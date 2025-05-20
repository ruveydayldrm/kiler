import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensurePlan, getWeekPlan, parseWeek } from "@/lib/planner-server";
import { getUserKitchen } from "@/lib/recipes";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { planEntrySchema, planMoveSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return json(await getWeekPlan(user.id, parseWeek(new URL(req.url).searchParams.get("week"))));
}

/** Plana tarif ekle */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, planEntrySchema);
  if (body.response) return body.response;
  const recipe = await db.recipe.findFirst({ where: { id: body.data.recipeId, published: true }, select: { id: true } });
  if (!recipe) return error("Tarif bulunamadı.", 404);
  const weekStart = parseWeek(body.data.weekStart);
  const plan = await ensurePlan(user.id, weekStart);
  const kitchen = await getUserKitchen(user.id);
  await db.mealPlanEntry.create({
    data: { mealPlanId: plan.id, day: body.data.day, meal: body.data.meal, recipeId: recipe.id, servings: body.data.servings ?? kitchen.householdSize },
  });
  return json(await getWeekPlan(user.id, weekStart));
}

/** Sürükle-bırak ile taşıma */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, planMoveSchema);
  if (body.response) return body.response;
  const entry = await db.mealPlanEntry.findFirst({ where: { id: body.data.entryId, mealPlan: { userId: user.id } }, include: { mealPlan: true } });
  if (!entry) return error("Plan öğesi bulunamadı.", 404);
  await db.mealPlanEntry.update({ where: { id: entry.id }, data: { day: body.data.day, meal: body.data.meal } });
  return json(await getWeekPlan(user.id, entry.mealPlan.weekStart));
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const week = url.searchParams.get("week");
  if (id) {
    const entry = await db.mealPlanEntry.findFirst({ where: { id, mealPlan: { userId: user.id } }, include: { mealPlan: true } });
    if (!entry) return error("Plan öğesi bulunamadı.", 404);
    await db.mealPlanEntry.delete({ where: { id } });
    return json(await getWeekPlan(user.id, entry.mealPlan.weekStart));
  }
  if (week) {
    const weekStart = parseWeek(week);
    await db.mealPlanEntry.deleteMany({ where: { mealPlan: { userId: user.id, weekStart } } });
    return json(await getWeekPlan(user.id, weekStart));
  }
  return error("Silinecek öğe belirtilmedi.");
}
