import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { invalidateCatalog } from "./recipes";

/** Yayındaki yorumlardan tarif puanını yeniden hesaplar (yorum ekleme / moderasyon sonrası). */
export async function refreshRating(recipeId: string) {
  const agg = await db.review.aggregate({ where: { recipeId, status: "PUBLISHED" }, _avg: { rating: true }, _count: true });
  const recipe = await db.recipe.update({
    where: { id: recipeId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
    select: { slug: true },
  });
  invalidateCatalog();
  revalidatePath(`/recipes/${recipe.slug}`);
}
