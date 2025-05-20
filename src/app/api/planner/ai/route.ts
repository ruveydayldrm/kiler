import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVisibleRecipes } from "@/lib/recipes";
import { buildWeeklyPlan, plannerCandidates, MEAL_CATEGORIES, type PlanSlot } from "@/lib/planner";
import { completeJson, isAiEnabled } from "@/lib/openai";
import { clientKey, error, json, parseBody, rateLimit, unauthorized } from "@/lib/api";
import { planAiSchema } from "@/lib/validators";
import { MEAL_KEYS, type MealKey } from "@/lib/constants";
import { toJson } from "@/lib/json";

export const dynamic = "force-dynamic";

/**
 * "AI ile haftamı planla" — ÖNİZLEME üretir, kaydetmez. Kullanıcı onaylayınca /api/planner/save çağrılır.
 * AI yalnızca sert filtreden geçmiş aday havuzundan seçebilir; geçersiz yanıt algoritmik plana düşer.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!rateLimit(`plan-ai:${clientKey(req, user.id)}`, 10, 60_000)) return error("Çok fazla istek. Bir dakika sonra tekrar dene.", 429);
  const body = await parseBody(req, planAiSchema);
  if (body.response) return body.response;
  const input = body.data;

  const { visible } = await getVisibleRecipes(user.id);
  const algorithmic = buildWeeklyPlan(visible, { ...input, seed: Math.floor(Math.random() * 1e6) });
  let entries: PlanSlot[] = algorithmic.entries;
  let mode: "openai" | "demo" = "demo";
  let summary = "";

  if (isAiEnabled()) {
    const pool = plannerCandidates(visible, input).filter((r) => input.meals.some((m) => MEAL_CATEGORIES[m].includes(r.categorySlug)));
    const out = await completeJson<{ entries?: { day: number; meal: string; recipeId: string }[]; summary?: string }>(
      `Sen bir haftalık yemek planlayıcısısın. YALNIZCA "adaylar" listesindeki tarif id'lerini kullan. Her gün için istenen öğünleri doldur.
Hedef: günlük kalori hedefine yakın kal, aynı tarifi tekrar etme (noRepeat), açılan bozulabilir malzemeleri (krema, yoğurt, ıspanak…) sonraki 1-3 günde değerlendir, bütçe hassasiyeti varsa daha az farklı malzeme ve daha az et kullan.
Öğün → uygun kategoriler: ${JSON.stringify(MEAL_CATEGORIES)}.
JSON: {"entries":[{"day":0-6,"meal":"BREAKFAST|LUNCH|DINNER|SNACK","recipeId":"..."}],"summary":"2 cümlelik Türkçe özet"}`,
      JSON.stringify({
        tercihler: input,
        adaylar: pool.map((r) => ({ id: r.id, ad: r.title, kategori: r.categorySlug, kcal: r.calories, dk: r.totalMinutes, malzemeler: r.ingredients.slice(0, 8).map((i) => i.slug) })),
      }),
      { maxTokens: 1800, temperature: 0.5 },
    );
    // Sunucu doğrulaması
    const allowed = new Map(pool.map((r) => [r.id, r]));
    const validated: PlanSlot[] = [];
    const seen = new Set<string>();
    for (const e of out?.entries ?? []) {
      const r = allowed.get(e.recipeId);
      if (!r || !(MEAL_KEYS as readonly string[]).includes(e.meal) || !input.meals.includes(e.meal as MealKey)) continue;
      if (!Number.isInteger(e.day) || e.day < 0 || e.day > 6) continue;
      if (!MEAL_CATEGORIES[e.meal as MealKey].includes(r.categorySlug)) continue;
      const slot = `${e.day}-${e.meal}`;
      if (seen.has(slot)) continue;
      seen.add(slot);
      validated.push({ day: e.day, meal: e.meal as MealKey, recipeId: r.id, servings: input.servings });
    }
    if (validated.length >= Math.min(algorithmic.entries.length, 7 * input.meals.length) * 0.7) {
      entries = validated;
      mode = "openai";
      summary = out?.summary?.slice(0, 500) ?? "";
    }
  }

  const byId = new Map(visible.map((r) => [r.id, r]));
  const dailyCalories = Array.from({ length: 7 }, (_, d) => Math.round(entries.filter((e) => e.day === d).reduce((a, e) => a + (byId.get(e.recipeId)?.calories ?? 0), 0)));
  const avg = Math.round(dailyCalories.reduce((a, b) => a + b, 0) / 7);
  if (!summary) {
    summary = `Günlük ${input.calorieTarget} kcal hedefine göre ${entries.length} öğünlük bir hafta hazırladım (ortalama ${avg} kcal/gün).` + (algorithmic.notes.length && mode === "demo" ? " Açılan malzemeleri sonraki günlerde değerlendirdim." : "");
  }

  void db.aIQueryLog
    .create({ data: { userId: user.id, source: "PLANNER", query: `Haftalık plan: ${input.calorieTarget} kcal, ${input.diets.join(", ") || "diyet yok"}`, intent: "plan", filters: toJson(input), recipeIds: toJson(entries.map((e) => e.recipeId)), resultCount: entries.length, success: entries.length > 0, mode } })
    .catch(() => {});

  return json({
    weekStart: input.weekStart,
    mode,
    summary,
    notes: mode === "demo" ? algorithmic.notes : [],
    dailyCalories,
    entries: entries.map((e) => {
      const r = byId.get(e.recipeId)!;
      return { ...e, recipe: { id: r.id, slug: r.slug, title: r.title, imageUrl: r.imageUrl, coverColor: r.coverColor, calories: r.calories, totalMinutes: r.totalMinutes, categoryName: r.categoryName } };
    }),
  });
}
