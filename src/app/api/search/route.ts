import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPantrySlugs, getVisibleRecipes } from "@/lib/recipes";
import { searchRecipes } from "@/lib/matching";
import { clientKey, json, rateLimit } from "@/lib/api";
import { toJson } from "@/lib/json";

export const dynamic = "force-dynamic";

/** Header'daki hızlı arama — genel aramayla aynı çekirdek (lib/matching.ts). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 200).trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 8, 24);
  if (q.length < 2) return json({ results: [] });

  const user = await getCurrentUser();
  if (!rateLimit(`search:${clientKey(req, user?.id)}`, 60, 60_000)) return json({ results: [] }, { status: 429 });

  const [{ visible, lexicon, kitchen }, pantry] = await Promise.all([getVisibleRecipes(user?.id), getPantrySlugs(user?.id)]);
  const outcome = searchRecipes(visible, q, lexicon, { alwaysHave: kitchen.alwaysHave, pantry });
  const results = outcome.results.slice(0, limit).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    categoryName: r.categoryName,
    totalMinutes: r.totalMinutes,
    calories: r.calories,
    imageUrl: r.imageUrl,
    coverColor: r.coverColor,
    matchPercent: outcome.matches.get(r.id)?.percent,
  }));

  // Analitik: yalnızca anlamlı uzunluktaki aramalar (yazarken her tuşu kaydetmemek için ≥4 karakter)
  if (q.length >= 4 && url.searchParams.get("log") !== "0") {
    void db.aIQueryLog
      .create({
        data: {
          userId: user?.id ?? null, source: "SEARCH", query: q, intent: outcome.mode,
          ingredients: toJson([...outcome.signals.ingredients, ...outcome.signals.withIngredients]),
          recipeIds: toJson(results.slice(0, 4).map((r) => r.id)), resultCount: outcome.results.length, success: outcome.results.length > 0,
        },
      })
      .catch(() => {});
  }
  return json({ results, mode: outcome.mode, total: outcome.results.length });
}
