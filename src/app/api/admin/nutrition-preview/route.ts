import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { previewNutrition } from "@/lib/recipe-admin";
import { error, forbidden, json, parseBody } from "@/lib/api";

const schema = z.object({
  servings: z.number().int().min(1).max(50),
  ingredients: z
    .array(z.object({ ingredientId: z.string().min(1), quantity: z.number().nullable(), unit: z.string().max(30), optional: z.boolean() }))
    .max(60),
});

/** Tarif formunda canlı besin değeri / diyet / alerjen önizlemesi */
export async function POST(req: Request) {
  if (!(await getAdmin())) return forbidden();
  const body = await parseBody(req, schema);
  if (body.response) return body.response;
  try {
    return json(await previewNutrition(body.data.ingredients, body.data.servings));
  } catch (e) {
    return error((e as Error).message);
  }
}
