import "server-only";
import { cache } from "react";
import { db } from "./db";
import { parseList } from "./json";
import { IngredientLexicon, applyHardConstraints, type HardConstraints, type RecipeIndexItem } from "./matching";
import { DEFAULT_ALWAYS_HAVE, type AllergenKey, type DietKey, type Difficulty, type SkillLevel } from "./constants";

// -----------------------------------------------------------------------------
// Katalog önbelleği: eşleştirme/arama için tarif indeksi ve malzeme sözlüğü
// bellekte tutulur. Admin değişikliklerinde invalidateCatalog() çağrılır.
// Binlerce tarife ölçeklenirken bu katman bir arama motoruna (Meilisearch,
// Postgres FTS…) taşınabilir; arayüz (RecipeIndexItem) aynı kalır.
// -----------------------------------------------------------------------------

const TTL = 5 * 60 * 1000;
type Cached<T> = { at: number; value: Promise<T> } | null;
const g = globalThis as unknown as { __kilerIndex?: Cached<RecipeIndexItem[]>; __kilerLexicon?: Cached<IngredientLexicon> };

export function invalidateCatalog() {
  g.__kilerIndex = null;
  g.__kilerLexicon = null;
}

function memo<T>(key: "__kilerIndex" | "__kilerLexicon", load: () => Promise<T>): Promise<T> {
  const hit = g[key] as Cached<T> | undefined;
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const value = load().catch((e) => {
    (g as Record<string, unknown>)[key] = null;
    throw e;
  });
  (g as Record<string, unknown>)[key] = { at: Date.now(), value };
  return value;
}

export const DIET_COLUMNS: Record<DietKey, keyof RecipeRowFlags> = {
  vegetarian: "isVegetarian",
  vegan: "isVegan",
  "gluten-free": "isGlutenFree",
  "lactose-free": "isLactoseFree",
  "low-carb": "isLowCarb",
  "high-protein": "isHighProtein",
};
interface RecipeRowFlags {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
}
export const dietsOf = (r: RecipeRowFlags) => (Object.keys(DIET_COLUMNS) as DietKey[]).filter((k) => r[DIET_COLUMNS[k]]);

export function getLexicon(): Promise<IngredientLexicon> {
  return memo("__kilerLexicon", async () => {
    const rows = await db.ingredient.findMany({ include: { parent: { select: { slug: true } } }, orderBy: { name: "asc" } });
    return new IngredientLexicon(
      rows.map((r) => ({ slug: r.slug, name: r.name, synonyms: parseList(r.synonyms), parentSlug: r.parent?.slug ?? null, aisle: r.aisle, isBasic: r.isBasic })),
    );
  });
}

export function getRecipeIndex(): Promise<RecipeIndexItem[]> {
  return memo("__kilerIndex", async () => {
    const rows = await db.recipe.findMany({
      where: { published: true },
      include: {
        category: { select: { slug: true, name: true } },
        cuisine: { select: { slug: true, name: true } },
        tags: { select: { slug: true } },
        ingredients: { orderBy: { sortOrder: "asc" }, select: { optional: true, ingredient: { select: { slug: true, name: true } } } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      coverColor: r.coverColor,
      categorySlug: r.category.slug,
      categoryName: r.category.name,
      cuisineSlug: r.cuisine.slug,
      cuisineName: r.cuisine.name,
      difficulty: r.difficulty as Difficulty,
      prepMinutes: r.prepMinutes,
      cookMinutes: r.cookMinutes,
      totalMinutes: r.totalMinutes,
      servings: r.servings,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      diets: dietsOf(r),
      allergens: parseList(r.allergens) as AllergenKey[],
      tags: r.tags.map((t) => t.slug),
      ratingAvg: r.ratingAvg,
      ratingCount: r.ratingCount,
      viewCount: r.viewCount,
      favoriteCount: r.favoriteCount,
      cookedCount: r.cookedCount,
      featured: r.featured,
      createdAt: r.createdAt.getTime(),
      ingredients: r.ingredients.map((i) => ({ slug: i.ingredient.slug, name: i.ingredient.name, optional: i.optional })),
    }));
  });
}

// ----------------------------------------------------------------- Kullanıcı bağlamı

export interface UserKitchen {
  diets: DietKey[];
  allergens: AllergenKey[];
  dislikedIngredients: string[];
  alwaysHave: string[];
  calorieTarget: number;
  householdSize: number;
  skillLevel: SkillLevel;
}

export const DEFAULT_KITCHEN: UserKitchen = {
  diets: [],
  allergens: [],
  dislikedIngredients: [],
  alwaysHave: DEFAULT_ALWAYS_HAVE,
  calorieTarget: 2000,
  householdSize: 2,
  skillLevel: "BEGINNER",
};

export const getUserKitchen = cache(async (userId: string | null | undefined): Promise<UserKitchen> => {
  if (!userId) return DEFAULT_KITCHEN;
  const p = await db.userPreference.findUnique({ where: { userId } });
  if (!p) return DEFAULT_KITCHEN;
  return {
    diets: parseList(p.diets) as DietKey[],
    allergens: parseList(p.allergens) as AllergenKey[],
    dislikedIngredients: parseList(p.dislikedIngredients),
    alwaysHave: parseList(p.alwaysHave),
    calorieTarget: p.calorieTarget,
    householdSize: p.householdSize,
    skillLevel: (p.skillLevel as SkillLevel) ?? "BEGINNER",
  };
});

export const hardConstraintsOf = (k: UserKitchen): HardConstraints => ({ allergens: k.allergens, dislikedIngredients: k.dislikedIngredients });

/**
 * Kullanıcının görebileceği tarifler: alerjen ve sevilmeyen malzemeler SERT filtre olarak
 * burada, veritabanı verisiyle uygulanır. Öneri, arama ve AI bu fonksiyonun çıktısını kullanır.
 */
export const getVisibleRecipes = cache(async (userId: string | null | undefined) => {
  const [index, lexicon, kitchen] = await Promise.all([getRecipeIndex(), getLexicon(), getUserKitchen(userId)]);
  const visible = applyHardConstraints(index, hardConstraintsOf(kitchen), lexicon);
  return { all: index, visible, hiddenCount: index.length - visible.length, lexicon, kitchen };
});

export const getPantrySlugs = cache(async (userId: string | null | undefined) => {
  if (!userId) return [];
  const rows = await db.pantryItem.findMany({ where: { userId }, select: { ingredient: { select: { slug: true } } } });
  return rows.map((r) => r.ingredient.slug);
});

export const getFavoriteIds = cache(async (userId: string | null | undefined) => {
  if (!userId) return [] as string[];
  const rows = await db.favorite.findMany({ where: { userId }, select: { recipeId: true } });
  return rows.map((r) => r.recipeId);
});

// ----------------------------------------------------------------- Detay

export const getRecipeDetail = cache(async (slug: string) => {
  const recipe = await db.recipe.findUnique({
    where: { slug },
    include: {
      category: true,
      cuisine: true,
      tags: true,
      steps: { orderBy: { order: "asc" } },
      ingredients: {
        orderBy: { sortOrder: "asc" },
        include: { ingredient: { include: { conversions: true } } },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!recipe || !recipe.published) return null;
  return recipe;
});
export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeDetail>>>;

export const getCategories = cache(() => db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { recipes: { where: { published: true } } } } } }));
export const getCuisines = cache(() => db.cuisine.findMany({ orderBy: { name: "asc" } }));

/** Admin ve AI için hafif "id → index item" haritası */
export async function getIndexMap() {
  const index = await getRecipeIndex();
  return new Map(index.map((r) => [r.id, r]));
}
