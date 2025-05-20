import "server-only";
import OpenAI from "openai";

// OpenAI erişimi YALNIZCA sunucuda. Anahtar yoksa null döner ve sistem demo moduna geçer.

let client: OpenAI | null | undefined;

export function getOpenAI(): OpenAI | null {
  if (client !== undefined) return client;
  const key = process.env.OPENAI_API_KEY?.trim();
  client = key ? new OpenAI({ apiKey: key, timeout: 25_000, maxRetries: 1 }) : null;
  return client;
}

export const aiModel = () => process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
export const isAiEnabled = () => !!getOpenAI();

/** JSON modunda tek çağrı. Hata/zaman aşımında null döner — çağıran demo yanıta düşer. */
export async function completeJson<T>(system: string, user: string, opts: { temperature?: number; maxTokens?: number } = {}): Promise<T | null> {
  const ai = getOpenAI();
  if (!ai) return null;
  try {
    const res = await ai.chat.completions.create({
      model: aiModel(),
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = res.choices[0]?.message?.content;
    return text ? (JSON.parse(text) as T) : null;
  } catch (e) {
    console.error("[openai]", e instanceof Error ? e.message : e);
    return null;
  }
}
