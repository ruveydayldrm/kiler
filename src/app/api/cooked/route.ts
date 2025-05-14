import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { cookedSchema } from "@/lib/validators";

/** "Yaptım" kaydı — öneri motoruna güçlü sinyal olarak gider. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, cookedSchema);
  if (body.response) return body.response;
  const recipe = await db.recipe.findFirst({ where: { id: body.data.recipeId, published: true }, select: { id: true } });
  if (!recipe) return error("Tarif bulunamadı.", 404);
  await db.$transaction([
    db.cookedLog.create({ data: { userId: user.id, recipeId: recipe.id, note: body.data.note || null, photoUrl: body.data.photoUrl || null } }),
    db.recipe.update({ where: { id: recipe.id }, data: { cookedCount: { increment: 1 } } }),
  ]);
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return error("Kayıt belirtilmedi.");
  const log = await db.cookedLog.findFirst({ where: { id, userId: user.id } });
  if (!log) return error("Kayıt bulunamadı.", 404);
  await db.$transaction([db.cookedLog.delete({ where: { id } }), db.recipe.update({ where: { id: log.recipeId }, data: { cookedCount: { decrement: 1 } } })]);
  return json({ ok: true });
}
