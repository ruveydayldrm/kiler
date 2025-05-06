import "server-only";
import { NextResponse } from "next/server";
import type { z, ZodTypeAny } from "zod";
import { fieldErrors } from "./validators";

export const json = <T,>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const error = (message: string, status = 400, extra?: Record<string, unknown>) => NextResponse.json({ error: message, ...extra }, { status });
export const unauthorized = () => error("Bu işlem için giriş yapmalısın.", 401);
export const forbidden = () => error("Bu işlem için yetkin yok.", 403);

/** İstek gövdesini Zod ile doğrular. Başarısızsa hazır 400 yanıtı döner. */
export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ data: z.output<S>; response?: never } | { data?: never; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: error("Geçersiz istek gövdesi.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { response: error(Object.values(errors)[0] ?? "Geçersiz veri.", 422, { errors }) };
  }
  return { data: parsed.data };
}

// ----------------------------------------------------------------- Hız sınırlama
// Tek sunuculu kurulum için bellek içi kayan pencere. Çok sunuculu üretimde Redis ile değiştirin.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return true;
}

export function clientKey(req: Request, userId?: string | null) {
  return userId ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
}
