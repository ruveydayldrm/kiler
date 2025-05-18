import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPantrySlugs, getUserKitchen } from "@/lib/recipes";
import { addToShoppingList, getShoppingItems, recipeShoppingAdditions } from "@/lib/shopping-server";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { shoppingItemInput, shoppingPatchSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const postSchema = z
  .object({
    items: z.array(shoppingItemInput).max(200).optional(),
    recipe: z
      .object({
        recipeId: z.string().min(1).max(64),
        servings: z.number().int().min(1).max(50).optional(),
        onlyMissing: z.boolean().default(true),
        pantry: z.array(z.string().max(80)).max(300).optional(),
        alwaysHave: z.array(z.string().max(80)).max(50).optional(),
      })
      .optional(),
  })
  .refine((v) => v.items?.length || v.recipe, { message: "Eklenecek ürün yok." });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return json({ items: await getShoppingItems(user.id) });
}

/**
 * Ürün ekler. Giriş yapılmışsa kullanıcının listesine yazar; misafirse yalnızca
 * tarifin hesaplanmış kalemlerini döner (istemci localStorage'a birleştirir).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await parseBody(req, postSchema);
  if (body.response) return body.response;

  let additions = body.data.items ?? [];
  if (body.data.recipe) {
    const r = body.data.recipe;
    const [pantry, kitchen] = await Promise.all([user ? getPantrySlugs(user.id) : Promise.resolve(r.pantry ?? []), getUserKitchen(user?.id)]);
    const out = await recipeShoppingAdditions(r.recipeId, {
      servings: r.servings,
      onlyMissing: r.onlyMissing,
      pantry,
      alwaysHave: user ? kitchen.alwaysHave : (r.alwaysHave ?? kitchen.alwaysHave),
    });
    if (!out.recipe) return error("Tarif bulunamadı.", 404);
    additions = out.additions;
    if (!user) return json({ additions, persisted: false });
  }
  if (!user) return unauthorized();
  if (!additions.length) return json({ items: await getShoppingItems(user.id), additions: [], added: 0, merged: 0, persisted: true });
  const result = await addToShoppingList(user.id, additions);
  return json({ ...result, additions, persisted: true });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, shoppingPatchSchema);
  if (body.response) return body.response;
  // Sahiplik kontrolü: öğe kullanıcının listesinde olmalı
  const item = await db.shoppingListItem.findFirst({ where: { id: body.data.id, list: { userId: user.id } } });
  if (!item) return error("Ürün bulunamadı.", 404);
  await db.shoppingListItem.update({
    where: { id: item.id },
    data: {
      ...(body.data.checked != null ? { checked: body.data.checked, checkedAt: body.data.checked ? new Date() : null } : {}),
      ...(body.data.quantity !== undefined ? { quantity: body.data.quantity } : {}),
    },
  });
  return json({ items: await getShoppingItems(user.id) });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  if (id) {
    await db.shoppingListItem.deleteMany({ where: { id, list: { userId: user.id } } });
  } else if (scope === "checked") {
    await db.shoppingListItem.deleteMany({ where: { checked: true, list: { userId: user.id, isActive: true } } });
  } else if (scope === "all") {
    // Listeyi arşivle (istatistikler için) — bir sonraki eklemede yeni liste açılır
    await db.shoppingList.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });
  } else {
    return error("Silinecek öğe belirtilmedi.");
  }
  return json({ items: await getShoppingItems(user.id) });
}
