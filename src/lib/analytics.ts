import "server-only";
import { db } from "./db";
import { parseList } from "./json";
import { fold } from "./matching";
import { getLexicon } from "./recipes";

// Yönetici paneli ve AI admin asistanı için YALNIZCA OKUMA yapan analiz fonksiyonları.

const DAY = 86_400_000;
export const since = (days: number) => new Date(Date.now() - days * DAY);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Son N günde aktif kullanıcı kimlikleri (görüntüleme, yaptım, favori, AI, liste) */
async function activityRows(days: number) {
  const from = since(days);
  const [views, cooked, favs, logs, lists, plans] = await Promise.all([
    db.recipeView.findMany({ where: { createdAt: { gte: from }, userId: { not: null } }, select: { userId: true, createdAt: true } }),
    db.cookedLog.findMany({ where: { createdAt: { gte: from } }, select: { userId: true, createdAt: true } }),
    db.favorite.findMany({ where: { createdAt: { gte: from } }, select: { userId: true, createdAt: true } }),
    db.aIQueryLog.findMany({ where: { createdAt: { gte: from }, userId: { not: null } }, select: { userId: true, createdAt: true } }),
    db.shoppingList.findMany({ where: { createdAt: { gte: from } }, select: { userId: true, createdAt: true } }),
    db.mealPlan.findMany({ where: { createdAt: { gte: from } }, select: { userId: true, createdAt: true } }),
  ]);
  return [...views, ...cooked, ...favs, ...logs, ...lists, ...plans] as { userId: string; createdAt: Date }[];
}

/** [fromDays gün önce, toDays gün önce) aralığında aktif kullanıcı sayısı */
export async function activeUserCount(fromDays: number, toDays = 0) {
  const rows = await activityRows(fromDays);
  const upper = toDays === 0 ? null : since(toDays);
  return new Set(rows.filter((r) => !upper || r.createdAt < upper).map((r) => r.userId)).size;
}

export async function activeUsersSeries(days: number) {
  const rows = await activityRows(days);
  const buckets = new Map<string, Set<string>>();
  for (let i = days - 1; i >= 0; i--) buckets.set(dayKey(since(i)), new Set());
  for (const r of rows) buckets.get(dayKey(r.createdAt))?.add(r.userId);
  return [...buckets.entries()].map(([date, set]) => ({
    date,
    label: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(date)),
    users: set.size,
  }));
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalRecipes, totalUsers, active7, listsToday, plansToday, reviewsPending] = await Promise.all([
    db.recipe.count({ where: { published: true } }),
    db.user.count(),
    activeUserCount(7),
    db.shoppingList.count({ where: { createdAt: { gte: today } } }),
    db.mealPlan.count({ where: { createdAt: { gte: today } } }),
    db.review.count({ where: { status: "HIDDEN" } }),
  ]);
  return { totalRecipes, totalUsers, active7, listsToday, plansToday, reviewsPending };
}

async function recipeTitles(ids: string[]) {
  const rows = await db.recipe.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } });
  return new Map(rows.map((r) => [r.id, r]));
}

export async function topRecipesBy(kind: "views" | "favorites" | "cooked", days = 30, limit = 5) {
  const where = { createdAt: { gte: since(days) } };
  const grouped =
    kind === "views"
      ? await db.recipeView.groupBy({ by: ["recipeId"], where, _count: { recipeId: true }, orderBy: { _count: { recipeId: "desc" } }, take: limit })
      : kind === "favorites"
        ? await db.favorite.groupBy({ by: ["recipeId"], where, _count: { recipeId: true }, orderBy: { _count: { recipeId: "desc" } }, take: limit })
        : await db.cookedLog.groupBy({ by: ["recipeId"], where, _count: { recipeId: true }, orderBy: { _count: { recipeId: "desc" } }, take: limit });
  const titles = await recipeTitles(grouped.map((g) => g.recipeId));
  return grouped.map((g) => ({ id: g.recipeId, title: titles.get(g.recipeId)?.title ?? "—", slug: titles.get(g.recipeId)?.slug ?? "", count: g._count.recipeId }));
}

export async function categoryViews(days = 30) {
  const grouped = await db.recipeView.groupBy({ by: ["recipeId"], where: { createdAt: { gte: since(days) } }, _count: { recipeId: true } });
  const recipes = await db.recipe.findMany({ select: { id: true, category: { select: { name: true } } } });
  const cat = new Map(recipes.map((r) => [r.id, r.category.name]));
  const totals = new Map<string, number>();
  for (const g of grouped) {
    const name = cat.get(g.recipeId);
    if (name) totals.set(name, (totals.get(name) ?? 0) + g._count.recipeId);
  }
  return [...totals.entries()].map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views);
}

export async function searchedIngredients(days = 30, limit = 10) {
  const logs = await db.aIQueryLog.findMany({ where: { createdAt: { gte: since(days) } }, select: { ingredients: true } });
  const lexicon = await getLexicon();
  const counts = new Map<string, number>();
  for (const l of logs) for (const s of new Set(parseList(l.ingredients))) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, count]) => ({ slug, name: lexicon.name(slug), count }));
}

export async function ingredientCombos(days = 30, limit = 8) {
  const logs = await db.aIQueryLog.findMany({ where: { createdAt: { gte: since(days) } }, select: { ingredients: true } });
  const lexicon = await getLexicon();
  const counts = new Map<string, number>();
  for (const l of logs) {
    const list = [...new Set(parseList(l.ingredients))].sort();
    if (list.length < 2) continue;
    // İkili kombinasyonlar
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const key = `${list[i]}|${list[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ combo: key.split("|").map((s) => lexicon.name(s)).join(" + "), count }));
}

export async function failedSearches(days = 30, limit = 10) {
  const logs = await db.aIQueryLog.findMany({ where: { createdAt: { gte: since(days) }, success: false }, select: { query: true, createdAt: true } });
  const groups = new Map<string, { query: string; count: number; last: Date }>();
  for (const l of logs) {
    const key = fold(l.query).replace(/ (var mi|tarifi|tarifleri|nasil yapilir)$/g, "").trim();
    const g = groups.get(key) ?? { query: l.query, count: 0, last: l.createdAt };
    g.count++;
    if (l.createdAt > g.last) g.last = l.createdAt;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function mostRecommended(days = 30, limit = 8) {
  const logs = await db.aIQueryLog.findMany({ where: { createdAt: { gte: since(days) }, source: { in: ["CHAT", "SEARCH"] } }, select: { recipeIds: true } });
  const counts = new Map<string, number>();
  for (const l of logs) for (const id of parseList(l.recipeIds).slice(0, 3)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const titles = await recipeTitles(top.map(([id]) => id));
  return top.filter(([id]) => titles.has(id)).map(([id, count]) => ({ id, title: titles.get(id)!.title, slug: titles.get(id)!.slug, count }));
}

export async function recentQuestions(limit = 20) {
  return db.aIQueryLog.findMany({
    where: { source: { in: ["CHAT", "SEARCH"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, query: true, intent: true, success: true, resultCount: true, mode: true, createdAt: true, user: { select: { name: true } } },
  });
}

/** Deterministik içgörü cümlesi — AI özetine temel olur (AI kapalıyken doğrudan gösterilir). */
export async function searchInsight(days = 7) {
  const [combos, ingredients, failed, logs] = await Promise.all([
    ingredientCombos(days, 1),
    searchedIngredients(days, 3),
    failedSearches(days, 2),
    db.aIQueryLog.findMany({ where: { createdAt: { gte: since(days) } }, select: { filters: true, query: true } }),
  ]);
  const timed = logs.filter((l) => /"maxMinutes":\s*(2\d|30)/.test(l.filters)).length;
  const dinner = logs.filter((l) => /akşam|aksam/i.test(l.query)).length;
  const parts: string[] = [];
  if (combos[0]) parts.push(`en çok ${combos[0].combo.toLocaleLowerCase("tr-TR")} kombinasyonu`);
  else if (ingredients[0]) parts.push(`en çok ${ingredients[0].name.toLocaleLowerCase("tr-TR")}`);
  if (timed >= 3) parts.push(`${dinner >= 3 ? "30 dakikalık akşam yemekleri" : "30 dakika ve altı tarifler"}`);
  let sentence = parts.length ? `Son ${days} günde kullanıcılar ${parts.join(" ve ")} aradı.` : `Son ${days} günde yeterli arama verisi yok.`;
  if (failed[0]) sentence += ` "${failed[0].query}" ${failed[0].count} kez arandı ama karşılığı yok — içerik fırsatı.`;
  return { sentence, combos, ingredients, failed, totalQueries: logs.length };
}
