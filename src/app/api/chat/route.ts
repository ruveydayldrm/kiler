import { getCurrentUser } from "@/lib/auth";
import { persistConversation, runKitchenAssistant } from "@/lib/ai";
import { clientKey, error, json, parseBody, rateLimit } from "@/lib/api";
import { chatSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!rateLimit(`chat:${clientKey(req, user?.id)}`, 20, 60_000)) return error("Biraz yavaşlayalım 🙂 Bir dakika sonra tekrar dene.", 429);
  const body = await parseBody(req, chatSchema);
  if (body.response) return body.response;

  try {
    const response = await runKitchenAssistant({
      message: body.data.message,
      userId: user?.id ?? null,
      recipeId: body.data.recipeId,
      pantry: user ? undefined : body.data.pantry,
    });
    const conversationId = user ? await persistConversation(user.id, body.data.conversationId, body.data.message, response) : undefined;
    return json({ response, conversationId });
  } catch (e) {
    console.error("[chat]", e);
    return error("Asistan şu an yanıt veremiyor. Lütfen tekrar dene.", 500);
  }
}
