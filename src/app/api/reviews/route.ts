import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { refreshRating } from "@/lib/reviews";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { reviewSchema } from "@/lib/validators";

/** Yorum ekle/güncelle (kullanıcı başına tarif başına bir yorum). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, reviewSchema);
  if (body.response) return body.response;
  const { recipeId, rating, comment, photoUrl } = body.data;
  const recipe = await db.recipe.findFirst({ where: { id: recipeId, published: true }, select: { id: true } });
  if (!recipe) return error("Tarif bulunamadı.", 404);
  await db.review.upsert({
    where: { userId_recipeId: { userId: user.id, recipeId } },
    update: { rating, comment, photoUrl: photoUrl || null, status: "PUBLISHED", createdAt: new Date() },
    create: { userId: user.id, recipeId, rating, comment, photoUrl: photoUrl || null },
  });
  await refreshRating(recipeId);
  return json({ ok: true });
}
