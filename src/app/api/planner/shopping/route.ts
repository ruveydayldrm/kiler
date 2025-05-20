import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseWeek } from "@/lib/planner-server";
import { getPantrySlugs, getUserKitchen } from "@/lib/recipes";
import { addToShoppingList, recipeShoppingAdditions } from "@/lib/shopping-server";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import type { ShoppingAddition } from "@/lib/shopping";

/**
 * "Haftanın alışveriş listesini oluştur": plandaki tüm tariflerin malzemeleri porsiyona göre
 * ölçeklenip birleştirilir, dolaptakiler ve "evde hep olanlar" düşülerek listeye eklenir.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }));
  if (body.response) return body.response;
  const plan = await db.mealPlan.findUnique({ where: { userId_weekStart: { userId: user.id, weekStart: parseWeek(body.data.weekStart) } }, include: { entries: true } });
  if (!plan?.entries.length) return error("Bu haftanın planı boş. Önce plana tarif ekle.", 404);

  const [pantry, kitchen] = await Promise.all([getPantrySlugs(user.id), getUserKitchen(user.id)]);
  const additions: ShoppingAddition[] = [];
  for (const e of plan.entries) {
    const out = await recipeShoppingAdditions(e.recipeId, { servings: e.servings, pantry, alwaysHave: kitchen.alwaysHave, onlyMissing: true });
    additions.push(...out.additions);
  }
  if (!additions.length) return json({ added: 0, merged: 0, message: "Plandaki her şey dolabında görünüyor. 🎉" });
  const result = await addToShoppingList(user.id, additions);
  return json({ added: result.added, merged: result.merged, items: result.items });
}
