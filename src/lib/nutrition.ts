// Besin değeri hesaplama ve diyet/alerjen çıkarımı.
// Tarif kaydedilirken çalışır; sonuç tarif üzerinde porsiyon başına saklanır.

import type { AllergenKey, IngredientKind } from "./constants";
import { toGrams, round, type ConvertibleIngredient } from "./units";

export const NUTRIENTS = [
  { key: "calories", label: "Kalori", unit: "kcal", daily: 2000 },
  { key: "protein", label: "Protein", unit: "g", daily: 50 },
  { key: "carbs", label: "Karbonhidrat", unit: "g", daily: 275 },
  { key: "fat", label: "Yağ", unit: "g", daily: 78 },
  { key: "fiber", label: "Lif", unit: "g", daily: 28 },
  { key: "sugar", label: "Şeker", unit: "g", daily: 50 },
  { key: "sodium", label: "Sodyum", unit: "mg", daily: 2300 },
] as const;
export type NutrientKey = (typeof NUTRIENTS)[number]["key"];
export type Nutrition = Record<NutrientKey, number>;

export interface NutritionSource extends ConvertibleIngredient {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  kind: IngredientKind | string;
  allergens: AllergenKey[] | string[];
}

export interface NutritionLine {
  quantity: number | null;
  unit: string;
  optional?: boolean;
  ingredient: NutritionSource;
}

export interface NutritionResult {
  perServing: Nutrition;
  /** Gram karşılığı bulunamadığı için hesaba katılamayan malzemeler */
  unresolved: string[];
}

const empty = (): Nutrition => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });

export function computeNutrition(lines: NutritionLine[], servings: number): NutritionResult {
  const total = empty();
  const unresolved: string[] = [];
  for (const line of lines) {
    if (line.optional) continue;
    const grams = toGrams(line.quantity, line.unit, line.ingredient);
    if (grams == null) {
      if (line.ingredient.kcal > 0) unresolved.push(line.ingredient.name);
      continue;
    }
    const f = grams / 100;
    total.calories += line.ingredient.kcal * f;
    total.protein += line.ingredient.protein * f;
    total.carbs += line.ingredient.carbs * f;
    total.fat += line.ingredient.fat * f;
    total.fiber += line.ingredient.fiber * f;
    total.sugar += line.ingredient.sugar * f;
    total.sodium += line.ingredient.sodium * f;
  }
  const s = Math.max(1, servings);
  const perServing = empty();
  for (const k of Object.keys(total) as NutrientKey[]) {
    perServing[k] = k === "calories" || k === "sodium" ? Math.round(total[k] / s) : round(total[k] / s, 1);
  }
  return { perServing, unresolved };
}

export interface DietFlags {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
}

/** Diyet bayraklarını malzeme türleri, alerjenler ve besin değerlerinden çıkarır. */
export function deriveDiets(lines: Pick<NutritionLine, "ingredient" | "optional">[], perServing: Nutrition | null): DietFlags {
  const required = lines.filter((l) => !l.optional);
  const kinds = new Set(required.map((l) => l.ingredient.kind));
  const allergens = new Set(required.flatMap((l) => l.ingredient.allergens as string[]));
  const hasMeat = kinds.has("meat") || kinds.has("fish");
  const animal = hasMeat || kinds.has("dairy") || kinds.has("egg") || kinds.has("honey");
  const proteinKcalShare = perServing && perServing.calories > 0 ? (perServing.protein * 4) / perServing.calories : 0;
  return {
    isVegetarian: !hasMeat,
    isVegan: !animal,
    isGlutenFree: !allergens.has("gluten"),
    isLactoseFree: !allergens.has("milk"),
    isLowCarb: !!perServing && perServing.carbs <= 20 && perServing.calories > 0,
    isHighProtein: !!perServing && (perServing.protein >= 25 || (perServing.protein >= 15 && proteinKcalShare >= 0.3)),
  };
}

/**
 * Tarifin alerjenleri: opsiyonel olanlar DAHİL tüm malzemelerin alerjenleri.
 * Alerjen filtresi sert filtre olduğu için güvenli tarafta kalıyoruz.
 */
export function deriveAllergens(lines: Pick<NutritionLine, "ingredient" | "optional">[]): AllergenKey[] {
  const set = new Set<string>();
  for (const l of lines) for (const a of l.ingredient.allergens as string[]) set.add(a);
  return [...set].sort() as AllergenKey[];
}

/** Günlük hedefe göre yüzde (bar genişliği için). */
export function dailyPercent(key: NutrientKey, value: number, calorieTarget = 2000) {
  const def = NUTRIENTS.find((n) => n.key === key)!;
  const daily = key === "calories" ? calorieTarget : def.daily;
  return Math.min(100, Math.round((value / daily) * 100));
}
