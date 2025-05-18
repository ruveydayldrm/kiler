import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { parseJson, toJson } from "./json";
import { getLexicon } from "./recipes";
import { mergeShoppingItems, type ShoppingAddition, type ShoppingItemDTO, type ShoppingSource } from "./shopping";
import type { AisleKey } from "./constants";
import { scaleQuantity, type ConvertibleIngredient } from "./units";

type ItemRow = Prisma.ShoppingListItemGetPayload<{ include: { ingredient: { select: { slug: true } } } }>;

export function toDTO(row: ItemRow): ShoppingItemDTO {
  return {
    id: row.id,
    ingredientSlug: row.ingredient?.slug ?? null,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    aisle: row.aisle as AisleKey,
    checked: row.checked,
    sources: parseJson<ShoppingSource[]>(row.sources, []),
    createdAt: row.createdAt.getTime(),
  };
}

/** Kullanıcının aktif listesi; yoksa oluşturur. Her sorgu userId ile sınırlıdır. */
export async function getActiveList(userId: string) {
  const existing = await db.shoppingList.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" } });
  return existing ?? db.shoppingList.create({ data: { userId } });
}

export async function getShoppingItems(userId: string): Promise<ShoppingItemDTO[]> {
  const list = await db.shoppingList.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" } });
  if (!list) return [];
  const rows = await db.shoppingListItem.findMany({ where: { listId: list.id }, include: { ingredient: { select: { slug: true } } }, orderBy: { createdAt: "asc" } });
  return rows.map(toDTO);
}

async function conversionsFor(slugs: string[]) {
  const rows = await db.ingredient.findMany({ where: { slug: { in: slugs } }, include: { conversions: true } });
  const map = new Map<string, ConvertibleIngredient & { id: string; aisle: string; name: string }>();
  for (const r of rows) {
    map.set(r.slug, { id: r.id, aisle: r.aisle, name: r.name, density: r.density, conversions: Object.fromEntries(r.conversions.map((c) => [c.unit, c.grams])) });
  }
  return map;
}

/**
 * Ürünleri kullanıcının aktif listesine ekler (birleştirerek). Tüm yazma işlemleri
 * kullanıcının kendi listesiyle sınırlıdır.
 */
export async function addToShoppingList(userId: string, additions: ShoppingAddition[]) {
  const lexicon = await getLexicon();
  // Serbest metinle gelen ürünleri sözlükten çözmeye çalış ("Domates" → domates)
  const resolved = additions.map((a) => {
    const slug = a.ingredientSlug ?? lexicon.resolve(a.name);
    const entry = slug ? lexicon.entries.get(slug) : undefined;
    return entry ? { ...a, ingredientSlug: entry.slug, name: a.ingredientSlug ? a.name : entry.name, aisle: (a.aisle ?? entry.aisle) as AisleKey } : { ...a, ingredientSlug: undefined };
  });
  const conv = await conversionsFor(resolved.flatMap((a) => (a.ingredientSlug ? [a.ingredientSlug] : [])));
  const list = await getActiveList(userId);
  const current = await getShoppingItems(userId);
  let tmp = 0;
  const { items, added, merged } = mergeShoppingItems(current, resolved, { newId: () => `new_${tmp++}`, conversions: (s) => conv.get(s) });

  const before = new Map(current.map((i) => [i.id, i]));
  await db.$transaction(
    items.flatMap((i) => {
      if (i.id.startsWith("new_")) {
        return [
          db.shoppingListItem.create({
            data: {
              listId: list.id, ingredientId: i.ingredientSlug ? conv.get(i.ingredientSlug)?.id ?? null : null, name: i.name,
              quantity: i.quantity, unit: i.unit, aisle: i.aisle, sources: toJson(i.sources),
            },
          }),
        ];
      }
      const prev = before.get(i.id)!;
      if (prev.quantity === i.quantity && prev.unit === i.unit && prev.sources.length === i.sources.length) return [];
      return [db.shoppingListItem.update({ where: { id: i.id, listId: list.id }, data: { quantity: i.quantity, unit: i.unit, sources: toJson(i.sources) } })];
    }),
  );
  await db.shoppingList.update({ where: { id: list.id }, data: { updatedAt: new Date() } });
  return { items: await getShoppingItems(userId), added, merged };
}

/**
 * Bir tarifin alışveriş kalemlerini üretir: porsiyona göre ölçekler, opsiyonel ve
 * "evde hep olan" malzemeleri atlar; onlyMissing ise dolaptakileri de düşer.
 */
export async function recipeShoppingAdditions(
  recipeId: string,
  opts: { servings?: number; pantry?: string[]; alwaysHave?: string[]; onlyMissing?: boolean },
): Promise<{ recipe: { id: string; title: string; servings: number } | null; additions: ShoppingAddition[] }> {
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, title: true, servings: true, published: true, ingredients: { orderBy: { sortOrder: "asc" }, include: { ingredient: true } } },
  });
  if (!recipe || !recipe.published) return { recipe: null, additions: [] };
  const lexicon = await getLexicon();
  const factor = (opts.servings ?? recipe.servings) / recipe.servings;
  const pantry = lexicon.expandPantry(opts.pantry ?? []);
  const skip = new Set(opts.alwaysHave ?? []);
  const source = { recipeId: recipe.id, title: recipe.title };
  const additions: ShoppingAddition[] = [];
  for (const ri of recipe.ingredients) {
    if (ri.optional || skip.has(ri.ingredient.slug)) continue;
    if (opts.onlyMissing !== false && pantry.has(ri.ingredient.slug)) continue;
    additions.push({
      ingredientSlug: ri.ingredient.slug,
      name: ri.ingredient.name,
      quantity: scaleQuantity(ri.quantity, factor),
      unit: ri.unit,
      aisle: ri.ingredient.aisle as AisleKey,
      source,
    });
  }
  return { recipe: { id: recipe.id, title: recipe.title, servings: recipe.servings }, additions };
}
