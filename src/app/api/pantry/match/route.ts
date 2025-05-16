import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVisibleRecipes } from "@/lib/recipes";
import { filterRecipes, groupPantryMatches, matchPantry, type MatchResult } from "@/lib/matching";
import { clientKey, json, parseBody, rateLimit, error } from "@/lib/api";
import { pantryMatchSchema } from "@/lib/validators";
import { toJson } from "@/lib/json";

export const dynamic = "force-dynamic";

const toCard = (m: MatchResult) => ({
  recipe: {
    id: m.recipe.id, slug: m.recipe.slug, title: m.recipe.title, imageUrl: m.recipe.imageUrl, coverColor: m.recipe.coverColor,
    categoryName: m.recipe.categoryName, difficulty: m.recipe.difficulty, prepMinutes: m.recipe.prepMinutes, cookMinutes: m.recipe.cookMinutes,
    totalMinutes: m.recipe.totalMinutes, calories: m.recipe.calories, diets: m.recipe.diets, ratingAvg: m.recipe.ratingAvg, ratingCount: m.recipe.ratingCount,
  },
  match: { percent: m.percent, matched: m.haveCount, required: m.requiredCount, missing: m.missing.map((i) => ({ slug: i.slug, name: i.name })) },
});

/** "Dolabımda ne var?" eşleştirmesi — alerji/sevilmeyen sert filtresi sunucuda uygulanır. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!rateLimit(`pantry:${clientKey(req, user?.id)}`, 120, 60_000)) return error("Çok hızlı istek gönderiyorsun, biraz bekle.", 429);
  const body = await parseBody(req, pantryMatchSchema);
  if (body.response) return body.response;
  const { slugs, maxMinutes, maxCalories, diets, alwaysHave, log } = body.data;

  const { visible, lexicon, kitchen, hiddenCount } = await getVisibleRecipes(user?.id);
  const pool = filterRecipes(visible, { maxMinutes, maxCalories, diets }, lexicon);
  const matches = matchPantry(pool, slugs.filter((s) => lexicon.entries.has(s)), lexicon, {
    alwaysHave: user ? kitchen.alwaysHave : alwaysHave ?? kitchen.alwaysHave,
    maxMinutes,
    maxCalories,
    diets,
  });
  const { ready, almost } = groupPantryMatches(matches);

  if (log && slugs.length) {
    void db.aIQueryLog
      .create({
        data: {
          userId: user?.id ?? null, source: "PANTRY", query: slugs.map((s) => lexicon.name(s)).join(", ").slice(0, 500), intent: "pantry",
          ingredients: toJson(slugs), filters: toJson({ maxMinutes, maxCalories, diets }), recipeIds: toJson(matches.slice(0, 4).map((m) => m.recipe.id)),
          resultCount: ready.length + almost.length, success: ready.length + almost.length > 0,
        },
      })
      .catch(() => {});
  }
  return json({ ready: ready.slice(0, 24).map(toCard), almost: almost.slice(0, 24).map(toCard), hiddenCount: user ? hiddenCount : 0 });
}
