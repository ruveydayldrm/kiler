import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensurePlan, getWeekPlan, parseWeek } from "@/lib/planner-server";
import { getVisibleRecipes } from "@/lib/recipes";
import { json, parseBody, unauthorized } from "@/lib/api";
import { planSaveSchema } from "@/lib/validators";

/** Önizlemesi onaylanan planı kaydeder. Tarifler yeniden doğrulanır (sert filtre dahil). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, planSaveSchema);
  if (body.response) return body.response;
  const { visible } = await getVisibleRecipes(user.id);
  const allowed = new Set(visible.map((r) => r.id));
  const entries = body.data.entries.filter((e) => allowed.has(e.recipeId));
  const weekStart = parseWeek(body.data.weekStart);
  const plan = await ensurePlan(user.id, weekStart);
  await db.$transaction([
    ...(body.data.replace ? [db.mealPlanEntry.deleteMany({ where: { mealPlanId: plan.id } })] : []),
    db.mealPlanEntry.createMany({ data: entries.map((e) => ({ ...e, mealPlanId: plan.id })) }),
  ]);
  return json({ ...(await getWeekPlan(user.id, weekStart)), saved: entries.length, skipped: body.data.entries.length - entries.length });
}
