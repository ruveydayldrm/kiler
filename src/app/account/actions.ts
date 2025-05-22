"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { getLexicon } from "@/lib/recipes";
import { fieldErrors, preferencesSchema, profileSchema } from "@/lib/validators";
import type { FormState } from "@/hooks/use-form-action";

export async function updateProfileAction(_prev: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: data.get("name") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { name: String(data.get("name") ?? "") } };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profilin güncellendi." };
}

export async function updatePreferencesAction(_prev: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser();
  const lexicon = await getLexicon();
  const slugs = (k: string) =>
    String(data.get(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => lexicon.entries.has(s));
  const raw = {
    diets: data.getAll("diets").map(String),
    allergens: data.getAll("allergens").map(String),
    dislikedIngredients: slugs("dislikedIngredients"),
    alwaysHave: slugs("alwaysHave"),
    calorieTarget: data.get("calorieTarget"),
    householdSize: data.get("householdSize"),
    skillLevel: data.get("skillLevel"),
  };
  const parsed = preferencesSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { calorieTarget: String(raw.calorieTarget ?? ""), householdSize: String(raw.householdSize ?? "") } };
  const p = parsed.data;
  // Vegan seçildiyse vejetaryen de geçerlidir
  const diets = p.diets.includes("vegan") && !p.diets.includes("vegetarian") ? [...p.diets, "vegetarian"] : p.diets;
  const payload = {
    diets: toJson(diets),
    allergens: toJson(p.allergens),
    dislikedIngredients: toJson(p.dislikedIngredients),
    alwaysHave: toJson(p.alwaysHave),
    calorieTarget: p.calorieTarget,
    householdSize: p.householdSize,
    skillLevel: p.skillLevel,
  };
  await db.userPreference.upsert({ where: { userId: user.id }, update: payload, create: { userId: user.id, ...payload } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Mutfak tercihlerin kaydedildi. Öneriler ve aramalar artık buna göre." };
}
