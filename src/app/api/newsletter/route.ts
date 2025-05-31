import { db } from "@/lib/db";
import { clientKey, error, json, parseBody, rateLimit } from "@/lib/api";
import { newsletterSchema } from "@/lib/validators";

export async function POST(req: Request) {
  if (!rateLimit(`newsletter:${clientKey(req)}`, 5, 60 * 60_000)) return error("Çok fazla deneme. Daha sonra tekrar dene.", 429);
  const body = await parseBody(req, newsletterSchema);
  if (body.response) return body.response;
  await db.newsletter.upsert({ where: { email: body.data.email }, update: {}, create: { email: body.data.email } });
  return json({ ok: true });
}
