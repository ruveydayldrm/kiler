import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateCatalog } from "@/lib/recipes";
import { recomputeRecipeNutrition } from "@/lib/recipe-admin";
import { refreshRating } from "@/lib/reviews";
import { error, forbidden, json, parseBody } from "@/lib/api";
import { adminActionSchema } from "@/lib/validators";

/**
 * AI admin asistanının ÖNERDİĞİ değişiklikleri uygular. Yalnızca yönetici "Onayla"ya bastığında
 * çağrılır; rol veritabanından tekrar doğrulanır ve girdi Zod ile sınırlandırılır.
 */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return forbidden();
  const body = await parseBody(req, adminActionSchema);
  if (body.response) return body.response;
  const action = body.data;

  switch (action.kind) {
    case "feature-recipe": {
      const r = await db.recipe.update({ where: { id: action.recipeId }, data: { featured: action.featured } }).catch(() => null);
      if (!r) return error("Tarif bulunamadı.", 404);
      invalidateCatalog();
      revalidatePath("/");
      return json({ ok: true, message: `"${r.title}" ${action.featured ? "öne çıkarıldı" : "öne çıkanlardan kaldırıldı"}.` });
    }
    case "publish-recipe": {
      const r = await db.recipe.update({ where: { id: action.recipeId }, data: { published: action.published } }).catch(() => null);
      if (!r) return error("Tarif bulunamadı.", 404);
      invalidateCatalog();
      revalidatePath(`/recipes/${r.slug}`);
      return json({ ok: true, message: `"${r.title}" ${action.published ? "yayına alındı" : "yayından kaldırıldı"}.` });
    }
    case "recompute-nutrition": {
      try {
        await recomputeRecipeNutrition(action.recipeId);
      } catch {
        return error("Tarif bulunamadı.", 404);
      }
      return json({ ok: true, message: "Besin değerleri malzemelerden yeniden hesaplandı." });
    }
    case "hide-review": {
      const r = await db.review.update({ where: { id: action.reviewId }, data: { status: "HIDDEN" } }).catch(() => null);
      if (!r) return error("Yorum bulunamadı.", 404);
      await refreshRating(r.recipeId);
      return json({ ok: true, message: "Yorum gizlendi." });
    }
  }
}
