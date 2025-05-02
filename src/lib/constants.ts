// Uygulama genelinde paylaşılan sözlükler. Veritabanında String olarak saklanan
// "enum" değerlerinin tek doğruluk kaynağı burasıdır.

export const SITE_NAME = "Kiler";
export const SITE_TAGLINE = "Mutfaktaki akıllı yardımcın";

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const DIETS = [
  { key: "vegetarian", label: "Vejetaryen", short: "Vejetaryen", column: "isVegetarian" },
  { key: "vegan", label: "Vegan", short: "Vegan", column: "isVegan" },
  { key: "gluten-free", label: "Glutensiz", short: "Glutensiz", column: "isGlutenFree" },
  { key: "lactose-free", label: "Laktozsuz", short: "Laktozsuz", column: "isLactoseFree" },
  { key: "low-carb", label: "Düşük karbonhidrat", short: "Düşük karb.", column: "isLowCarb" },
  { key: "high-protein", label: "Yüksek protein", short: "Yüksek protein", column: "isHighProtein" },
] as const;
export type DietKey = (typeof DIETS)[number]["key"];
export const DIET_KEYS = DIETS.map((d) => d.key) as [DietKey, ...DietKey[]];

export const ALLERGENS = [
  { key: "gluten", label: "Gluten" },
  { key: "milk", label: "Süt" },
  { key: "egg", label: "Yumurta" },
  { key: "nuts", label: "Kuruyemiş" },
  { key: "peanut", label: "Yer fıstığı" },
  { key: "seafood", label: "Deniz ürünü" },
  { key: "sesame", label: "Susam" },
  { key: "soy", label: "Soya" },
] as const;
export type AllergenKey = (typeof ALLERGENS)[number]["key"];
export const ALLERGEN_KEYS = ALLERGENS.map((a) => a.key) as [AllergenKey, ...AllergenKey[]];

export const AISLES = [
  { key: "PRODUCE", label: "Manav" },
  { key: "BUTCHER", label: "Kasap" },
  { key: "DAIRY", label: "Süt Ürünleri" },
  { key: "DRY", label: "Kuru Gıda" },
  { key: "SPICE", label: "Baharat" },
  { key: "FROZEN", label: "Donuk" },
  { key: "OTHER", label: "Diğer" },
] as const;
export type AisleKey = (typeof AISLES)[number]["key"];
export const AISLE_KEYS = AISLES.map((a) => a.key) as [AisleKey, ...AisleKey[]];

export const INGREDIENT_KINDS = ["plant", "dairy", "egg", "meat", "fish", "honey"] as const;
export type IngredientKind = (typeof INGREDIENT_KINDS)[number];

export const DIFFICULTIES = [
  { key: "EASY", label: "Kolay" },
  { key: "MEDIUM", label: "Orta" },
  { key: "HARD", label: "Zor" },
] as const;
export type Difficulty = (typeof DIFFICULTIES)[number]["key"];
export const DIFFICULTY_KEYS = DIFFICULTIES.map((d) => d.key) as [Difficulty, ...Difficulty[]];

export const MEALS = [
  { key: "BREAKFAST", label: "Kahvaltı", share: 0.25 },
  { key: "LUNCH", label: "Öğle", share: 0.3 },
  { key: "DINNER", label: "Akşam", share: 0.35 },
  { key: "SNACK", label: "Ara öğün", share: 0.1 },
] as const;
export type MealKey = (typeof MEALS)[number]["key"];
export const MEAL_KEYS = MEALS.map((m) => m.key) as [MealKey, ...MealKey[]];

export const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
export const DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export const SKILL_LEVELS = [
  { key: "BEGINNER", label: "Başlangıç" },
  { key: "INTERMEDIATE", label: "Orta" },
  { key: "ADVANCED", label: "İleri" },
] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number]["key"];
export const SKILL_KEYS = SKILL_LEVELS.map((s) => s.key) as [SkillLevel, ...SkillLevel[]];

export const TIME_BUCKETS = [15, 30, 45, 60] as const;

export const SORTS = [
  { key: "recommended", label: "Önerilen" },
  { key: "popular", label: "En Popüler" },
  { key: "fastest", label: "En Hızlı" },
  { key: "lowest-calorie", label: "En Düşük Kalori" },
  { key: "top-rated", label: "En Yüksek Puan" },
  { key: "newest", label: "Yeni Eklenenler" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

/** Varsayılan "evde hep olanlar" — eşleşme oranına dahil edilmez. */
export const DEFAULT_ALWAYS_HAVE = ["tuz", "karabiber", "su", "sivi-yag"];

export const labelOf = <T extends { key: string; label: string }>(list: readonly T[], key: string) =>
  list.find((x) => x.key === key)?.label ?? key;
