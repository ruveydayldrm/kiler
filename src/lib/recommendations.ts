import "server-only";
import { cache } from "react";
import { db } from "./db";
import { getPantrySlugs, getVisibleRecipes, type UserKitchen } from "./recipes";
import { fold, tokenize, type IngredientLexicon, type RecipeIndexItem } from "./matching";

// -----------------------------------------------------------------------------
// Öneri motoru — strateji arayüzü
//
// İlk aşamada içerik tabanlı bir "yakınlık" algoritması kullanılır. İleride
// embedding/AI tabanlı bir motor aynı arayüzü uygulayarak takılabilir:
//
//   class EmbeddingStrategy implements RecommendationStrategy { … }
//   ENGINES.embedding = new EmbeddingStrategy()
//
// SERT FİLTRE (alerjen + sevilmeyen) motora girmeden önce uygulanır; hiçbir
// strateji bu kısıtı atlayamaz.
// -----------------------------------------------------------------------------

export interface RecommendationSignals {
  kitchen: UserKitchen;
  favorites: string[];
  cooked: string[];
  viewed: string[];
  pantry: string[];
}

export interface ScoredRecipe {
  recipe: RecipeIndexItem;
  score: number;
  reasons: string[];
}

export interface RecommendationStrategy {
  readonly name: string;
  recommend(candidates: RecipeIndexItem[], signals: RecommendationSignals, lexicon: IngredientLexicon, limit: number): Promise<ScoredRecipe[]>;
}

const bump = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);

/** Favori/yaptım/görüntüleme sinyallerinden kategori-mutfak-etiket-malzeme yakınlığı hesaplar. */
export class ContentAffinityStrategy implements RecommendationStrategy {
  readonly name = "content-affinity-v1";

  async recommend(candidates: RecipeIndexItem[], s: RecommendationSignals, lexicon: IngredientLexicon, limit: number) {
    const byId = new Map(candidates.map((r) => [r.id, r]));
    const cat = new Map<string, number>();
    const cui = new Map<string, number>();
    const tag = new Map<string, number>();
    const ing = new Map<string, number>();
    const weigh = (ids: string[], w: number) => {
      for (const id of ids) {
        const r = byId.get(id);
        if (!r) continue;
        bump(cat, r.categorySlug, w);
        bump(cui, r.cuisineSlug, w * 0.6);
        for (const t of r.tags) bump(tag, t, w * 0.5);
        for (const i of r.ingredients) if (!i.optional) bump(ing, i.slug, w * 0.2);
      }
    };
    weigh(s.favorites, 3);
    weigh(s.cooked, 4);
    weigh(s.viewed, 1);
    const pantry = lexicon.expandPantry(s.pantry);
    const ignore = new Set(s.kitchen.alwaysHave);
    const recentCooked = new Set(s.cooked.slice(0, 5));
    const norm = (m: Map<string, number>) => Math.max(1, ...m.values());
    const [nc, nu, nt, ni] = [norm(cat), norm(cui), norm(tag), norm(ing)];

    const scored = candidates.map((r) => {
      const reasons: string[] = [];
      let score = 0;
      const catAff = (cat.get(r.categorySlug) ?? 0) / nc;
      if (catAff > 0.5) reasons.push(`${r.categoryName} sevdiğin bir kategori`);
      score += catAff * 25 + ((cui.get(r.cuisineSlug) ?? 0) / nu) * 10;
      score += (r.tags.reduce((a, t) => a + (tag.get(t) ?? 0), 0) / nt) * 6;
      score += (r.ingredients.reduce((a, i) => a + (ing.get(i.slug) ?? 0), 0) / ni) * 4;

      if (s.kitchen.diets.length) {
        const fit = s.kitchen.diets.filter((d) => r.diets.includes(d)).length / s.kitchen.diets.length;
        score += fit * 30;
        if (fit === 1) reasons.push("Diyet tercihine uygun");
      }
      if (pantry.size) {
        const req = r.ingredients.filter((i) => !i.optional && !ignore.has(i.slug));
        const have = req.filter((i) => pantry.has(i.slug)).length;
        const pct = req.length ? have / req.length : 0;
        score += pct * 20;
        if (pct >= 0.6) reasons.push(`Dolabındakilerle %${Math.round(pct * 100)} hazır`);
      }
      if (s.kitchen.skillLevel === "BEGINNER" && r.difficulty === "HARD") score -= 12;
      if (s.kitchen.skillLevel === "ADVANCED" && r.difficulty !== "EASY") score += 4;
      score += r.ratingAvg * 3 + Math.log10(1 + r.viewCount + r.favoriteCount * 5) * 3;
      if (recentCooked.has(r.id)) score -= 25; // yakın zamanda yaptığını tekrar önerme
      if (s.favorites.includes(r.id)) score -= 8; // keşfe alan aç
      return { recipe: r, score, reasons };
    });

    // Çeşitlilik: aynı kategoriden en fazla 2 tarif
    const perCat = new Map<string, number>();
    const out: ScoredRecipe[] = [];
    for (const x of scored.sort((a, b) => b.score - a.score)) {
      const n = perCat.get(x.recipe.categorySlug) ?? 0;
      if (n >= 2) continue;
      perCat.set(x.recipe.categorySlug, n + 1);
      out.push(x);
      if (out.length >= limit) break;
    }
    return out;
  }
}

const ENGINES: Record<string, RecommendationStrategy> = {
  "content-affinity-v1": new ContentAffinityStrategy(),
};

export function getRecommendationEngine(): RecommendationStrategy {
  return ENGINES[process.env.RECOMMENDER ?? ""] ?? ENGINES["content-affinity-v1"]!;
}

export const getRecommendationSignals = cache(async (userId: string, kitchen: UserKitchen): Promise<RecommendationSignals> => {
  const [favorites, cooked, viewed, pantry] = await Promise.all([
    db.favorite.findMany({ where: { userId }, select: { recipeId: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.cookedLog.findMany({ where: { userId }, select: { recipeId: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.recipeView.findMany({ where: { userId }, select: { recipeId: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    getPantrySlugs(userId),
  ]);
  return {
    kitchen,
    favorites: favorites.map((f) => f.recipeId),
    cooked: cooked.map((c) => c.recipeId),
    viewed: viewed.map((v) => v.recipeId),
    pantry,
  };
});

/** "Senin için seçtik" — kişiselleştirilmiş öneriler (giriş yapmamışsa popüler tarifler). */
export async function getRecommendations(userId: string | null | undefined, limit = 8): Promise<ScoredRecipe[]> {
  const { visible, lexicon, kitchen } = await getVisibleRecipes(userId);
  if (!userId) {
    return [...visible]
      .sort((a, b) => b.ratingAvg * 10 + Math.log10(1 + b.viewCount) * 8 - (a.ratingAvg * 10 + Math.log10(1 + a.viewCount) * 8))
      .slice(0, limit)
      .map((recipe) => ({ recipe, score: 0, reasons: [] }));
  }
  const signals = await getRecommendationSignals(userId, kitchen);
  return getRecommendationEngine().recommend(visible, signals, lexicon, limit);
}

/** Benzer tarifler: aynı kategori + ortak malzeme + başlık benzerliği. */
export function similarRecipes(target: RecipeIndexItem, pool: RecipeIndexItem[], limit = 4) {
  const ings = new Set(target.ingredients.filter((i) => !i.optional).map((i) => i.slug));
  const words = new Set(tokenize(fold(target.title)));
  return pool
    .filter((r) => r.id !== target.id)
    .map((r) => {
      const shared = r.ingredients.filter((i) => ings.has(i.slug)).length;
      const titleShared = tokenize(fold(r.title)).filter((w) => words.has(w)).length;
      const score = (r.categorySlug === target.categorySlug ? 10 : 0) + (r.cuisineSlug === target.cuisineSlug ? 3 : 0) + shared * 2 + titleShared * 4 + r.ratingAvg;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}
