import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLexicon, getUserKitchen } from "@/lib/recipes";
import { error, json, parseBody, unauthorized } from "@/lib/api";
import { toJson } from "@/lib/json";
import { z } from "zod";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  slugs: z.array(z.string().max(80)).max(300),
  alwaysHave: z.array(z.string().max(80)).max(50).optional(),
});

async function pantryOf(userId: string) {
  const [rows, kitchen] = await Promise.all([
    db.pantryItem.findMany({ where: { userId }, select: { ingredient: { select: { slug: true } } }, orderBy: { createdAt: "asc" } }),
    getUserKitchen(userId),
  ]);
  return { slugs: rows.map((r) => r.ingredient.slug), alwaysHave: kitchen.alwaysHave };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return json(await pantryOf(user.id));
}

/** Dolabı toptan günceller. Yalnızca oturumdaki kullanıcının dolabı değişir. */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await parseBody(req, putSchema);
  if (body.response) return body.response;

  const lexicon = await getLexicon();
  const valid = [...new Set(body.data.slugs.filter((s) => lexicon.entries.has(s)))];
  const ingredients = await db.ingredient.findMany({ where: { slug: { in: valid } }, select: { id: true } });
  await db.$transaction([
    db.pantryItem.deleteMany({ where: { userId: user.id } }),
    db.pantryItem.createMany({ data: ingredients.map((i) => ({ userId: user.id, ingredientId: i.id })) }),
  ]);
  if (body.data.alwaysHave) {
    const always = body.data.alwaysHave.filter((s) => lexicon.entries.has(s));
    await db.userPreference.upsert({ where: { userId: user.id }, update: { alwaysHave: toJson(always) }, create: { userId: user.id, alwaysHave: toJson(always) } });
  }
  if (!ingredients.length && valid.length) return error("Malzemeler bulunamadı.");
  return json(await pantryOf(user.id));
}
