"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateCatalog } from "@/lib/recipes";
import { saveIngredient, saveRecipe } from "@/lib/recipe-admin";
import { refreshRating } from "@/lib/reviews";
import { fieldErrors, ingredientFormSchema, recipeFormSchema } from "@/lib/validators";

// Her yönetici eylemi sunucuda requireAdmin() ile rolü veritabanından yeniden doğrular.

export interface AdminResult {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
  slug?: string;
}

export async function saveRecipeAction(input: unknown, id?: string): Promise<AdminResult> {
  await requireAdmin();
  const parsed = recipeFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Formda düzeltilmesi gereken alanlar var." };
  try {
    const recipe = await saveRecipe(parsed.data, id);
    revalidatePath("/admin/recipes");
    revalidatePath(`/recipes/${recipe.slug}`);
    revalidatePath("/");
    return { ok: true, id: recipe.id, slug: recipe.slug, message: id ? "Tarif güncellendi." : "Tarif oluşturuldu." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function deleteRecipeAction(id: string): Promise<AdminResult> {
  await requireAdmin();
  await db.recipe.delete({ where: { id } }).catch(() => null);
  invalidateCatalog();
  revalidatePath("/admin/recipes");
  return { ok: true, message: "Tarif silindi." };
}

export async function toggleRecipeAction(id: string, field: "featured" | "published", value: boolean): Promise<AdminResult> {
  await requireAdmin();
  if (field !== "featured" && field !== "published") return { ok: false };
  await db.recipe.update({ where: { id }, data: { [field]: value } });
  invalidateCatalog();
  revalidatePath("/admin/recipes");
  revalidatePath("/");
  return { ok: true };
}

export async function saveIngredientAction(input: unknown, id?: string): Promise<AdminResult> {
  await requireAdmin();
  const parsed = ingredientFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Formda düzeltilmesi gereken alanlar var." };
  try {
    const { ingredient, updatedRecipes } = await saveIngredient(parsed.data, id);
    revalidatePath("/admin/ingredients");
    return { ok: true, id: ingredient.id, message: id ? `Malzeme güncellendi${updatedRecipes ? `; ${updatedRecipes} tarifin besin değeri yenilendi` : ""}.` : "Malzeme eklendi." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function deleteIngredientAction(id: string): Promise<AdminResult> {
  await requireAdmin();
  const used = await db.recipeIngredient.count({ where: { ingredientId: id } });
  if (used) return { ok: false, message: `Bu malzeme ${used} tarifte kullanılıyor; önce tariflerden çıkarın.` };
  await db.ingredient.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await db.ingredient.delete({ where: { id } });
  invalidateCatalog();
  revalidatePath("/admin/ingredients");
  return { ok: true, message: "Malzeme silindi." };
}

export async function setReviewStatusAction(id: string, status: "PUBLISHED" | "HIDDEN"): Promise<AdminResult> {
  await requireAdmin();
  if (status !== "PUBLISHED" && status !== "HIDDEN") return { ok: false };
  const review = await db.review.update({ where: { id }, data: { status } });
  await refreshRating(review.recipeId);
  revalidatePath("/admin/reviews");
  return { ok: true, message: status === "HIDDEN" ? "Yorum gizlendi." : "Yorum yayınlandı." };
}
