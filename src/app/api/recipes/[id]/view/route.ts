import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientKey, json, rateLimit } from "@/lib/api";

/** Görüntülenme kaydı (öneri motoru sinyali + admin istatistikleri). Aynı kişiden 10 dk'da bir sayılır. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!rateLimit(`view:${clientKey(req, user?.id)}:${id}`, 1, 10 * 60_000)) return json({ ok: true, counted: false });
  const recipe = await db.recipe.findFirst({ where: { id, published: true }, select: { id: true } });
  if (!recipe) return json({ ok: false }, { status: 404 });
  await db.$transaction([
    db.recipeView.create({ data: { recipeId: id, userId: user?.id ?? null } }),
    db.recipe.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
    ...(user ? [db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })] : []),
  ]);
  return json({ ok: true, counted: true });
}
