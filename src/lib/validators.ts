// Tüm girdiler için Zod şemaları — API route'ları, server action'lar ve formlar paylaşır.
import { z } from "zod";
import { AISLE_KEYS, ALLERGEN_KEYS, DIET_KEYS, DIFFICULTY_KEYS, MEAL_KEYS, SKILL_KEYS } from "./constants";
import { UNIT_KEYS } from "./units";

const slug = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/, "Geçersiz kimlik");
const id = z.string().trim().min(1).max(64);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Adınız en az 2 karakter olmalı").max(60),
    email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(100).regex(/\d/, "Şifre en az bir rakam içermeli"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Şifreler eşleşmiyor" });

export const preferencesSchema = z.object({
  diets: z.array(z.enum(DIET_KEYS)).max(6),
  allergens: z.array(z.enum(ALLERGEN_KEYS)).max(8),
  dislikedIngredients: z.array(slug).max(50),
  alwaysHave: z.array(slug).max(50),
  calorieTarget: z.coerce.number().int().min(1000, "En az 1000 kcal").max(5000, "En fazla 5000 kcal"),
  householdSize: z.coerce.number().int().min(1).max(12),
  skillLevel: z.enum(SKILL_KEYS),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Adınız en az 2 karakter olmalı").max(60),
});

export const pantrySchema = z.object({ slugs: z.array(slug).max(300) });

export const pantryMatchSchema = z.object({
  slugs: z.array(slug).max(100),
  maxMinutes: z.coerce.number().int().positive().max(600).optional(),
  maxCalories: z.coerce.number().int().positive().max(5000).optional(),
  diets: z.array(z.enum(DIET_KEYS)).optional(),
  alwaysHave: z.array(slug).max(50).optional(),
  log: z.boolean().optional(),
});

export const shoppingItemInput = z.object({
  ingredientSlug: slug.optional(),
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(100000).nullable().optional(),
  unit: z.string().trim().max(30).nullable().optional(),
  aisle: z.enum(AISLE_KEYS).optional(),
  source: z.object({ recipeId: id, title: z.string().max(120) }).optional(),
});
export type ShoppingItemInput = z.infer<typeof shoppingItemInput>;

export const shoppingAddSchema = z.object({ items: z.array(shoppingItemInput).min(1).max(200) });
export const shoppingAddRecipeSchema = z.object({
  recipeId: id,
  servings: z.number().int().min(1).max(50).optional(),
  onlyMissing: z.boolean().default(true),
  pantry: z.array(slug).max(300).optional(),
});
export const shoppingPatchSchema = z.object({
  id,
  checked: z.boolean().optional(),
  quantity: z.number().positive().max(100000).nullable().optional(),
});

export const favoriteSchema = z.object({ recipeId: id });

export const reviewSchema = z.object({
  recipeId: id,
  rating: z.coerce.number().int().min(1, "Puan seçin").max(5),
  comment: z.string().trim().min(5, "Yorum en az 5 karakter olmalı").max(1000),
  photoUrl: z.string().trim().url("Geçerli bir bağlantı girin").max(500).optional().or(z.literal("")),
});

export const cookedSchema = z.object({
  recipeId: id,
  note: z.string().trim().max(500).optional(),
  photoUrl: z.string().trim().url("Geçerli bir bağlantı girin").max(500).optional().or(z.literal("")),
});

export const planEntrySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  day: z.number().int().min(0).max(6),
  meal: z.enum(MEAL_KEYS),
  recipeId: id,
  servings: z.number().int().min(1).max(20).optional(),
});
export const planMoveSchema = z.object({
  entryId: id,
  day: z.number().int().min(0).max(6),
  meal: z.enum(MEAL_KEYS),
});

export const planAiSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calorieTarget: z.coerce.number().int().min(1000).max(5000),
  diets: z.array(z.enum(DIET_KEYS)).max(6).default([]),
  budget: z.boolean().default(false),
  maxMinutes: z.coerce.number().int().min(10).max(240).optional(),
  servings: z.coerce.number().int().min(1).max(12),
  meals: z.array(z.enum(MEAL_KEYS)).min(1).default(["BREAKFAST", "LUNCH", "DINNER"]),
  noRepeat: z.boolean().default(true),
  useLeftovers: z.boolean().default(true),
});
export type PlanAiInput = z.infer<typeof planAiSchema>;

export const planSaveSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  replace: z.boolean().default(true),
  entries: z.array(z.object({ day: z.number().int().min(0).max(6), meal: z.enum(MEAL_KEYS), recipeId: id, servings: z.number().int().min(1).max(20) })).max(60),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Mesaj boş olamaz").max(1000),
  recipeId: id.optional(),
  conversationId: id.optional(),
  pantry: z.array(slug).max(300).optional(),
});

export const newsletterSchema = z.object({ email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin") });

// ---------------------------------------------------------------- Admin

const optionalNumber = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(100000).nullable());

export const recipeFormSchema = z.object({
  title: z.string().trim().min(3, "Tarif adı en az 3 karakter").max(120),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter").max(600),
  categoryId: id,
  cuisineId: id,
  difficulty: z.enum(DIFFICULTY_KEYS),
  prepMinutes: z.coerce.number().int().min(0).max(1440),
  cookMinutes: z.coerce.number().int().min(0).max(1440),
  servings: z.coerce.number().int().min(1).max(50),
  imageUrl: z.string().trim().url("Geçerli bir görsel bağlantısı girin").max(500).optional().or(z.literal("")),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Renk #RRGGBB biçiminde olmalı"),
  tags: z.array(z.string().trim().min(1).max(40)).max(15),
  tips: z.array(z.string().trim().min(1).max(300)).max(10),
  featured: z.boolean(),
  published: z.boolean(),
  ingredients: z
    .array(
      z.object({
        ingredientId: id,
        quantity: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().positive().max(100000).nullable()),
        unit: z.string().refine((u) => UNIT_KEYS.includes(u) || u.length <= 20, "Geçersiz birim"),
        note: z.string().trim().max(120).optional(),
        optional: z.boolean(),
      }),
    )
    .min(1, "En az bir malzeme ekleyin")
    .max(60),
  steps: z
    .array(z.object({ text: z.string().trim().min(3, "Adım metni çok kısa").max(1000), durationMinutes: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(1440).nullable()) }))
    .min(1, "En az bir adım ekleyin")
    .max(40),
  nutritionOverride: z
    .object({
      calories: optionalNumber,
      protein: optionalNumber,
      carbs: optionalNumber,
      fat: optionalNumber,
      fiber: optionalNumber,
      sugar: optionalNumber,
      sodium: optionalNumber,
    })
    .nullable(),
});
export type RecipeFormInput = z.infer<typeof recipeFormSchema>;

export const ingredientFormSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter").max(80),
  slug: slug.optional().or(z.literal("")),
  synonyms: z.array(z.string().trim().min(1).max(60)).max(30),
  aisle: z.enum(AISLE_KEYS),
  defaultUnit: z.string().trim().min(1).max(20),
  kind: z.enum(["plant", "dairy", "egg", "meat", "fish", "honey"]),
  isBasic: z.boolean(),
  parentId: z.string().max(64).optional().or(z.literal("")),
  density: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().positive().max(5).nullable()),
  kcal: z.coerce.number().min(0).max(1000),
  protein: z.coerce.number().min(0).max(100),
  carbs: z.coerce.number().min(0).max(100),
  fat: z.coerce.number().min(0).max(100),
  fiber: z.coerce.number().min(0).max(100),
  sugar: z.coerce.number().min(0).max(100),
  sodium: z.coerce.number().min(0).max(50000),
  allergens: z.array(z.enum(ALLERGEN_KEYS)).max(8),
  conversions: z.array(z.object({ unit: z.string().trim().min(1).max(30), grams: z.coerce.number().positive().max(10000) })).max(20),
});
export type IngredientFormInput = z.infer<typeof ingredientFormSchema>;

export const adminActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("feature-recipe"), recipeId: id, featured: z.boolean() }),
  z.object({ kind: z.literal("publish-recipe"), recipeId: id, published: z.boolean() }),
  z.object({ kind: z.literal("recompute-nutrition"), recipeId: id }),
  z.object({ kind: z.literal("hide-review"), reviewId: id }),
]);
export type AdminAction = z.infer<typeof adminActionSchema>;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
