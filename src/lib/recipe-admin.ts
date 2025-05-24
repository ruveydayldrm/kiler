import "server-only";
import { db } from "./db";
import { parseList, toJson } from "./json";
import { computeNutrition, deriveAllergens, deriveDiets, type NutritionLine } from "./nutrition";
import { invalidateCatalog } from "./recipes";
import { slugify } from "./utils";
import type { IngredientFormInput, RecipeFormInput } from "./validators";

// Yönetici yazma işlemleri. Çağıran taraf (server action / API) rol kontrolünü YAPMIŞ olmalıdır;
// yine de her fonksiyon yalnızca doğrulanmış (Zod) girdi kabul eder.

async function nutritionLines(items: { ingredientId: string; quantity: number | null; unit: string; optional: boolean }[]): Promise<NutritionLine[]> {
  const ids = [...new Set(items.map((i) => i.ingredientId))];
  const rows = await db.ingredient.findMany({ where: { id: { in: ids } }, include: { conversions: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return items.map((i) => {
    const ing = byId.get(i.ingredientId);
    if (!ing) throw new Error("Bilinmeyen malzeme");
    return {
      quantity: i.quantity,
      unit: i.unit,
      optional: i.optional,
      ingredient: {
        name: ing.name, kcal: ing.kcal, protein: ing.protein, carbs: ing.carbs, fat: ing.fat, fiber: ing.fiber, sugar: ing.sugar,
        sodium: ing.sodium, kind: ing.kind, allergens: parseList(ing.allergens), density: ing.density,
        conversions: Object.fromEntries(ing.conversions.map((c) => [c.unit, c.grams])),
      },
    };
  });
}

/** Malzemelerden besin değeri, diyet bayrakları ve alerjenleri hesaplar (önizleme için de kullanılır). */
export async function previewNutrition(items: { ingredientId: string; quantity: number | null; unit: string; optional: boolean }[], servings: number) {
  const lines = await nutritionLines(items);
  const { perServing, unresolved } = computeNutrition(lines, servings);
  return { perServing, unresolved, diets: deriveDiets(lines, perServing), allergens: deriveAllergens(lines) };
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "tarif";
  let n = 2;
  while (await db.recipe.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })) {
    slug = `${slugify(base)}-${n++}`;
  }
  return slug;
}

export async function saveRecipe(input: RecipeFormInput, id?: string) {
  const { perServing, diets, allergens } = await previewNutrition(input.ingredients, input.servings);
  const override = input.nutritionOverride;
  const manual = !!override && Object.values(override).some((v) => v != null);
  const nutrition = manual ? { ...perServing, ...Object.fromEntries(Object.entries(override!).filter(([, v]) => v != null)) } : perServing;

  const tagSlugs = [...new Set(input.tags.map((t) => slugify(t)).filter(Boolean))];
  const tags = await Promise.all(
    tagSlugs.map((slug, i) => db.tag.upsert({ where: { slug }, update: {}, create: { slug, name: input.tags[i]!.trim() } })),
  );

  const data = {
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    cuisineId: input.cuisineId,
    difficulty: input.difficulty,
    prepMinutes: input.prepMinutes,
    cookMinutes: input.cookMinutes,
    totalMinutes: input.prepMinutes + input.cookMinutes,
    servings: input.servings,
    imageUrl: input.imageUrl || null,
    coverColor: input.coverColor,
    tips: toJson(input.tips),
    featured: input.featured,
    published: input.published,
    ...diets,
    allergens: toJson(allergens),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
    sugar: nutrition.sugar,
    sodium: nutrition.sodium,
    nutritionManual: manual,
  };
  const ingredients = input.ingredients.map((i, idx) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit, note: i.note || null, optional: i.optional, sortOrder: idx }));
  const steps = input.steps.map((s, idx) => ({ order: idx + 1, text: s.text, durationMinutes: s.durationMinutes }));

  const slug = await uniqueSlug(input.title, id);
  const recipe = await db.$transaction(async (tx) => {
    if (id) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      return tx.recipe.update({
        where: { id },
        data: { ...data, slug, tags: { set: tags.map((t) => ({ id: t.id })) }, ingredients: { create: ingredients }, steps: { create: steps } },
      });
    }
    return tx.recipe.create({
      data: { ...data, slug, tags: { connect: tags.map((t) => ({ id: t.id })) }, ingredients: { create: ingredients }, steps: { create: steps } },
    });
  });
  invalidateCatalog();
  return recipe;
}

export async function recomputeRecipeNutrition(recipeId: string) {
  const recipe = await db.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
  if (!recipe) throw new Error("Tarif bulunamadı");
  const { perServing, diets, allergens } = await previewNutrition(recipe.ingredients, recipe.servings);
  await db.recipe.update({ where: { id: recipeId }, data: { ...perServing, ...diets, allergens: toJson(allergens), nutritionManual: false } });
  invalidateCatalog();
}

/** Bir malzeme değiştiğinde onu kullanan tüm tariflerin (elle düzeltilmemiş) besin değerlerini yeniler. */
export async function recomputeForIngredient(ingredientId: string) {
  const affected = await db.recipe.findMany({ where: { nutritionManual: false, ingredients: { some: { ingredientId } } }, select: { id: true } });
  for (const r of affected) await recomputeRecipeNutrition(r.id);
  return affected.length;
}

export async function saveIngredient(input: IngredientFormInput, id?: string) {
  const slug = input.slug || slugify(input.name);
  const clash = await db.ingredient.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) throw new Error("Bu kısa ada sahip başka bir malzeme var");
  if (id && input.parentId === id) throw new Error("Malzeme kendisinin üst türü olamaz");
  const data = {
    name: input.name, slug, synonyms: toJson(input.synonyms), aisle: input.aisle, defaultUnit: input.defaultUnit, kind: input.kind,
    isBasic: input.isBasic, parentId: input.parentId || null, density: input.density, kcal: input.kcal, protein: input.protein,
    carbs: input.carbs, fat: input.fat, fiber: input.fiber, sugar: input.sugar, sodium: input.sodium, allergens: toJson(input.allergens),
  };
  const conversions = input.conversions.map((c) => ({ unit: c.unit, grams: c.grams }));
  const row = await db.$transaction(async (tx) => {
    if (id) {
      await tx.ingredientConversion.deleteMany({ where: { ingredientId: id } });
      return tx.ingredient.update({ where: { id }, data: { ...data, conversions: { create: conversions } } });
    }
    return tx.ingredient.create({ data: { ...data, conversions: { create: conversions } } });
  });
  const updatedRecipes = id ? await recomputeForIngredient(row.id) : 0;
  invalidateCatalog();
  return { ingredient: row, updatedRecipes };
}
