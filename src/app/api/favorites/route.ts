import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { favoriteSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, favoriteSchema);
  if (body.response) return body.response;
  const recipe = await db.recipe.findFirst({ where: { id: body.data.recipeId, published: true }, select: { id: true } });
  if (!recipe) return error("Tarif bulunamadı.", 404);

  const existing = await db.favorite.findUnique({ where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } } });
  if (existing) {
    await db.$transaction([db.favorite.delete({ where: { id: existing.id } }), db.recipe.update({ where: { id: recipe.id }, data: { favoriteCount: { decrement: 1 } } })]);
    return json({ favorited: false });
  }
  await db.$transaction([db.favorite.create({ data: { userId: user.id, recipeId: recipe.id } }), db.recipe.update({ where: { id: recipe.id }, data: { favoriteCount: { increment: 1 } } })]);
  return json({ favorited: true });
}
