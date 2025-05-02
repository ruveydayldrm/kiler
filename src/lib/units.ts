// Birim sistemi: ölçekleme, dönüşüm ve okunabilir biçimlendirme.
// Saf fonksiyonlar — hem sunucuda hem istemcide hem de seed script'inde kullanılır.

export type UnitFamily = "mass" | "volume" | "count";

interface UnitDef {
  key: string;
  family: UnitFamily;
  /** mass → gram, volume → ml karşılığı; count birimlerinde tanımsız */
  base?: number;
  /** "2 adet" gibi gösterimlerde kullanılan kısaltma */
  short?: string;
}

export const UNITS: UnitDef[] = [
  { key: "g", family: "mass", base: 1 },
  { key: "kg", family: "mass", base: 1000 },
  { key: "ml", family: "volume", base: 1 },
  { key: "l", family: "volume", base: 1000 },
  { key: "su bardağı", family: "volume", base: 200, short: "su b." },
  { key: "çay bardağı", family: "volume", base: 100, short: "çay b." },
  { key: "yemek kaşığı", family: "volume", base: 15, short: "yk" },
  { key: "tatlı kaşığı", family: "volume", base: 10, short: "tk" },
  { key: "çay kaşığı", family: "volume", base: 5, short: "çk" },
  { key: "adet", family: "count" },
  { key: "diş", family: "count" },
  { key: "demet", family: "count" },
  { key: "dilim", family: "count" },
  { key: "tutam", family: "count" },
  { key: "avuç", family: "count" },
  { key: "paket", family: "count" },
  { key: "kutu", family: "count" },
  { key: "dal", family: "count" },
];

export const UNIT_KEYS = UNITS.map((u) => u.key);
const UNIT_MAP = new Map(UNITS.map((u) => [u.key, u]));

export const unitDef = (unit: string | null | undefined) => (unit ? UNIT_MAP.get(unit) : undefined);

/** Bir malzemenin dönüşüm bilgisi (Ingredient + IngredientConversion'dan türetilir). */
export interface ConvertibleIngredient {
  density?: number | null; // g/ml
  conversions?: Record<string, number>; // birim → gram
}

/** Miktarı grama çevirir; mümkün değilse null döner. */
export function toGrams(quantity: number | null | undefined, unit: string, ing?: ConvertibleIngredient): number | null {
  if (quantity == null || !Number.isFinite(quantity)) return null;
  const custom = ing?.conversions?.[unit];
  if (custom != null) return quantity * custom;
  const def = unitDef(unit);
  if (!def) return null;
  if (def.family === "mass") return quantity * def.base!;
  if (def.family === "volume") return quantity * def.base! * (ing?.density ?? 1);
  return null;
}

/** Miktarı ml'ye çevirir (yalnızca hacim birimleri). */
export function toMilliliters(quantity: number, unit: string): number | null {
  const def = unitDef(unit);
  return def?.family === "volume" ? quantity * def.base! : null;
}

/** 1250 g → { 1.25, "kg" } gibi okunabilir metrik birim seçer. */
export function humanizeMetric(quantity: number, family: "mass" | "volume") {
  if (family === "mass") return quantity >= 1000 ? { quantity: quantity / 1000, unit: "kg" } : { quantity, unit: "g" };
  return quantity >= 1000 ? { quantity: quantity / 1000, unit: "l" } : { quantity, unit: "ml" };
}

/**
 * Tarif sayfasındaki "metrik göster" seçeneği için: mümkünse g/ml karşılığını döner.
 * Sıvılar ml, katılar g olarak gösterilir.
 */
export function toMetric(quantity: number | null, unit: string, ing?: ConvertibleIngredient & { isLiquid?: boolean }) {
  if (quantity == null) return null;
  const def = unitDef(unit);
  if (def?.family === "mass") return humanizeMetric(quantity * def.base!, "mass");
  if (def?.family === "volume" && ing?.isLiquid) return humanizeMetric(quantity * def.base!, "volume");
  const grams = toGrams(quantity, unit, ing);
  if (grams == null) return null;
  return humanizeMetric(grams, "mass");
}

/**
 * İki miktarı birleştirir (alışveriş listesi). Aynı birim → doğrudan topla.
 * Aynı aile (kütle/hacim) → ortak tabana çevir. Farklı aile → gram üzerinden
 * dönüştürülebiliyorsa grama çevir. Hiçbiri mümkün değilse null.
 */
export function combineQuantities(
  a: { quantity: number | null; unit: string | null },
  b: { quantity: number | null; unit: string | null },
  ing?: ConvertibleIngredient,
): { quantity: number | null; unit: string | null } | null {
  if (a.quantity == null && b.quantity == null) return a.unit === b.unit ? { quantity: null, unit: a.unit } : null;
  if (a.quantity == null || b.quantity == null) return null;
  const ua = a.unit ?? "adet";
  const ub = b.unit ?? "adet";
  if (ua === ub) return { quantity: round(a.quantity + b.quantity), unit: ua };

  const da = unitDef(ua);
  const db = unitDef(ub);
  if (da && db && da.family === db.family && da.family !== "count") {
    const total = a.quantity * da.base! + b.quantity * db.base!;
    // Daha büyük birimde ifade etmek okunabilirliği bozabilir; ortak tabanda tut.
    const h = humanizeMetric(total, da.family as "mass" | "volume");
    return { quantity: round(h.quantity), unit: h.unit };
  }

  const ga = toGrams(a.quantity, ua, ing);
  const gb = toGrams(b.quantity, ub, ing);
  if (ga != null && gb != null) {
    const h = humanizeMetric(ga + gb, "mass");
    return { quantity: round(h.quantity), unit: h.unit };
  }
  return null;
}

export const round = (n: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export const scaleQuantity = (quantity: number | null, factor: number) =>
  quantity == null ? null : round(quantity * factor, 3);

const FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];

/** 1.5 → "1½", 0.333 → "⅓", 250 → "250", 1.25 kg → "1,25" */
export function formatQuantity(quantity: number | null | undefined, unit?: string | null): string {
  if (quantity == null) return "";
  const def = unitDef(unit ?? undefined);
  const metric = def && (def.key === "g" || def.key === "ml");
  if (metric) {
    // Gram/ml'de kesir yerine makul yuvarlama: 7 → 7, 123 → 125
    const r = quantity >= 100 ? Math.round(quantity / 5) * 5 : Math.round(quantity);
    return new Intl.NumberFormat("tr-TR").format(Math.max(r, 1));
  }
  if (def?.key === "kg" || def?.key === "l") {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(quantity);
  }
  const whole = Math.floor(quantity + 1e-6);
  const frac = quantity - whole;
  if (frac > 0.94) return String(whole + 1);
  if (frac < 0.06) {
    return whole > 0 ? String(whole) : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(quantity);
  }
  const match = FRACTIONS.find(([v]) => Math.abs(frac - v) < 0.06);
  if (match) return `${whole > 0 ? whole : ""}${match[1]}`;
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(quantity);
}

export function formatAmount(quantity: number | null | undefined, unit?: string | null) {
  const q = formatQuantity(quantity, unit);
  if (!q) return unit && unit !== "adet" ? unit : "";
  if (!unit || unit === "adet") return q;
  return `${q} ${unit}`;
}
