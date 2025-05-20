// Haftalık yemek planı üretici — saf ve deterministik (aynı girdi → aynı plan).
// AI modu açıkken LLM bu algoritmanın aday havuzundan seçer; anahtar yoksa doğrudan bu kullanılır.

import { DAYS, MEALS, type DietKey, type MealKey } from "./constants";
import type { RecipeIndexItem } from "./matching";

export const MEAL_CATEGORIES: Record<MealKey, string[]> = {
  BREAKFAST: ["kahvalti", "fit-tarifler"],
  LUNCH: ["corbalar", "salatalar", "zeytinyaglilar", "makarnalar", "fit-tarifler"],
  DINNER: ["ana-yemekler", "makarnalar", "zeytinyaglilar", "fit-tarifler"],
  SNACK: ["atistirmaliklar", "tatlilar", "icecekler"],
};

/** Açıldıktan sonra birkaç gün içinde tüketilmesi gereken malzemeler (artan malzeme değerlendirme). */
export const PERISHABLES = new Set([
  "krema", "yogurt", "sut", "ispanak", "maydanoz", "dereotu", "taze-nane", "kisnis", "feslegen", "mantar", "lor",
  "krem-peynir", "hindistan-cevizi-sutu", "marul", "roka", "yesil-sogan", "avokado", "beyaz-peynir", "kabak", "cilek",
]);

export interface PlannerInput {
  calorieTarget: number;
  diets: DietKey[];
  maxMinutes?: number;
  budget: boolean;
  servings: number;
  meals: MealKey[];
  noRepeat: boolean;
  useLeftovers: boolean;
  seed?: number;
}

export interface PlanSlot {
  day: number;
  meal: MealKey;
  recipeId: string;
  servings: number;
}

export interface PlanResult {
  entries: PlanSlot[];
  notes: string[];
  dailyCalories: number[];
}

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Plan için uygun aday havuzu (diyet + süre + besin değeri olan tarifler). */
export function plannerCandidates(pool: RecipeIndexItem[], input: Pick<PlannerInput, "diets" | "maxMinutes">) {
  return pool.filter(
    (r) => r.calories != null && input.diets.every((d) => r.diets.includes(d)) && (input.maxMinutes == null || r.totalMinutes <= input.maxMinutes),
  );
}

export function buildWeeklyPlan(pool: RecipeIndexItem[], input: PlannerInput): PlanResult {
  const random = rng(input.seed ?? 42);
  const candidates = plannerCandidates(pool, input);
  const meals = MEALS.filter((m) => input.meals.includes(m.key));
  const shareSum = meals.reduce((a, m) => a + m.share, 0) || 1;
  const used = new Set<string>();
  const opened: { slug: string; day: number }[] = [];
  const pantryWeek = new Set<string>();
  const entries: PlanSlot[] = [];
  const notes: string[] = [];
  const dailyCalories: number[] = [];

  for (let day = 0; day < 7; day++) {
    let dayCal = 0;
    for (const meal of meals) {
      const target = (input.calorieTarget * meal.share) / shareSum;
      let options = candidates.filter((r) => MEAL_CATEGORIES[meal.key].includes(r.categorySlug));
      if (input.noRepeat) {
        const fresh = options.filter((r) => !used.has(r.id));
        if (fresh.length) options = fresh;
      }
      if (!options.length) continue;

      let best: { r: RecipeIndexItem; score: number; leftover: { slug: string; day: number } | null } | null = null;
      for (const r of options) {
        const cal = r.calories ?? target;
        let score = -Math.abs(cal - target) / Math.max(target, 1) * 40;
        score += r.ratingAvg * 2 + random() * 6;
        let leftover: { slug: string; day: number } | null = null;
        if (input.useLeftovers) {
          for (const i of r.ingredients) {
            const hit = opened.find((o) => o.slug === i.slug && day - o.day >= 1 && day - o.day <= 3);
            if (hit) {
              score += 12;
              leftover = hit;
              break;
            }
          }
        }
        if (input.budget) {
          const newIngredients = r.ingredients.filter((i) => !i.optional && !pantryWeek.has(i.slug)).length;
          score -= newIngredients * 1.5;
          if (!r.diets.includes("vegetarian")) score -= 6; // et/balık bütçeyi en çok etkileyen kalem
        }
        if (!best || score > best.score) best = { r, score, leftover };
      }
      if (!best) continue;

      used.add(best.r.id);
      dayCal += best.r.calories ?? 0;
      entries.push({ day, meal: meal.key, recipeId: best.r.id, servings: input.servings });
      for (const i of best.r.ingredients) {
        pantryWeek.add(i.slug);
        if (PERISHABLES.has(i.slug) && !opened.some((o) => o.slug === i.slug && day - o.day <= 3)) opened.push({ slug: i.slug, day });
      }
      if (best.leftover) {
        const name = best.r.ingredients.find((i) => i.slug === best!.leftover!.slug)?.name ?? best.leftover.slug;
        notes.push(`${DAYS[best.leftover.day]} açılan ${name.toLocaleLowerCase("tr-TR")}, ${DAYS[day]} ${best.r.title} tarifinde değerlendirildi.`);
      }
    }
    dailyCalories.push(Math.round(dayCal));
  }
  return { entries, notes: [...new Set(notes)].slice(0, 6), dailyCalories };
}
