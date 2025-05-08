// Alışveriş listesi — saf yardımcılar (istemci + sunucu ortak).
import { AISLES, type AisleKey } from "./constants";
import { fold } from "./matching";
import { combineQuantities, formatAmount, type ConvertibleIngredient } from "./units";

export interface ShoppingSource {
  recipeId: string;
  title: string;
}

export interface ShoppingItemDTO {
  id: string;
  ingredientSlug: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  aisle: AisleKey;
  checked: boolean;
  sources: ShoppingSource[];
  createdAt: number;
}

export interface ShoppingAddition {
  ingredientSlug?: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  aisle?: AisleKey;
  source?: ShoppingSource;
}

export const itemKey = (x: { ingredientSlug?: string | null; name: string }) => x.ingredientSlug || `name:${fold(x.name)}`;

export function mergeSources(a: ShoppingSource[], b?: ShoppingSource | ShoppingSource[]) {
  const list = [...a];
  for (const s of b ? (Array.isArray(b) ? b : [b]) : []) if (!list.some((x) => x.recipeId === s.recipeId)) list.push(s);
  return list;
}

/**
 * Yeni ürünleri listeye birleştirir. Aynı malzeme (alınmamış) zaten varsa miktarlar toplanır:
 * 2 adet + 3 adet = 5 adet; 1 su bardağı + 100 ml = 300 ml; dönüşüm bilgisi varsa farklı
 * aileler (adet ↔ g) de grama çevrilir. Birleştirilemezse ayrı satır açılır.
 */
export function mergeShoppingItems(
  items: ShoppingItemDTO[],
  additions: ShoppingAddition[],
  opts: { newId: () => string; conversions?: (slug: string) => ConvertibleIngredient | undefined },
): { items: ShoppingItemDTO[]; added: number; merged: number } {
  const next = items.map((i) => ({ ...i, sources: [...i.sources] }));
  let added = 0;
  let merged = 0;
  for (const add of additions) {
    const key = itemKey(add);
    const existing = next.filter((i) => !i.checked && itemKey(i) === key);
    let done = false;
    for (const ex of existing) {
      const conv = add.ingredientSlug ? opts.conversions?.(add.ingredientSlug) : undefined;
      const combined = combineQuantities(
        { quantity: ex.quantity, unit: ex.unit },
        { quantity: add.quantity ?? null, unit: add.unit ?? null },
        conv,
      );
      if (combined) {
        ex.quantity = combined.quantity;
        ex.unit = combined.unit;
        ex.sources = mergeSources(ex.sources, add.source);
        merged++;
        done = true;
        break;
      }
    }
    if (!done) {
      next.push({
        id: opts.newId(),
        ingredientSlug: add.ingredientSlug ?? null,
        name: add.name,
        quantity: add.quantity ?? null,
        unit: add.unit ?? null,
        aisle: add.aisle ?? "OTHER",
        checked: false,
        sources: add.source ? [add.source] : [],
        createdAt: Date.now(),
      });
      added++;
    }
  }
  return { items: next, added, merged };
}

/** Reyon sırasına göre gruplar; alınanlar her grubun en altına iner. */
export function groupByAisle(items: ShoppingItemDTO[]) {
  return AISLES.map((a) => ({
    ...a,
    items: items
      .filter((i) => i.aisle === a.key)
      .sort((x, y) => Number(x.checked) - Number(y.checked) || x.name.localeCompare(y.name, "tr")),
  })).filter((g) => g.items.length);
}

/** WhatsApp / panoya kopyalama için düz metin */
export function shoppingListText(items: ShoppingItemDTO[]) {
  const lines = ["🛒 Kiler alışveriş listem", ""];
  for (const g of groupByAisle(items.filter((i) => !i.checked))) {
    lines.push(`*${g.label}*`);
    for (const i of g.items) {
      const amount = formatAmount(i.quantity, i.unit);
      lines.push(`• ${i.name}${amount ? ` — ${amount}` : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
