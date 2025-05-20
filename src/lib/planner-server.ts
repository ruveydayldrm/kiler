import "server-only";
import { db } from "./db";
import { getIndexMap } from "./recipes";
import { isoDate, startOfWeek } from "./utils";
import type { MealKey } from "./constants";

export interface PlanEntryDTO {
  id: string;
  day: number;
  meal: MealKey;
  servings: number;
  recipe: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    coverColor: string;
    categoryName: string;
    totalMinutes: number;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
}

/** "2024-10-16" → o haftanın pazartesisi (UTC). Geçersizse bu hafta. */
export function parseWeek(value?: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y!, m! - 1, d!));
    if (!Number.isNaN(date.getTime())) {
      const day = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - day);
      return date;
    }
  }
  return startOfWeek();
}

export async function getWeekPlan(userId: string, weekStart: Date) {
  const [plan, index] = await Promise.all([
    db.mealPlan.findUnique({ where: { userId_weekStart: { userId, weekStart } }, include: { entries: true } }),
    getIndexMap(),
  ]);
  const entries: PlanEntryDTO[] = (plan?.entries ?? []).flatMap((e) => {
    const r = index.get(e.recipeId);
    if (!r) return [];
    return [
      {
        id: e.id,
        day: e.day,
        meal: e.meal as MealKey,
        servings: e.servings,
        recipe: {
          id: r.id, slug: r.slug, title: r.title, imageUrl: r.imageUrl, coverColor: r.coverColor, categoryName: r.categoryName,
          totalMinutes: r.totalMinutes, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
        },
      },
    ];
  });
  return { weekStart: isoDate(weekStart), planId: plan?.id ?? null, entries };
}

export async function ensurePlan(userId: string, weekStart: Date) {
  return db.mealPlan.upsert({ where: { userId_weekStart: { userId, weekStart } }, update: {}, create: { userId, weekStart } });
}

/** Geçmiş ve gelecek haftaların özeti (hesap panelindeki "Yemek Planlarım") */
export async function listPlans(userId: string) {
  const plans = await db.mealPlan.findMany({ where: { userId }, orderBy: { weekStart: "desc" }, include: { _count: { select: { entries: true } } }, take: 20 });
  return plans.map((p) => ({ id: p.id, weekStart: isoDate(p.weekStart), entryCount: p._count.entries }));
}
