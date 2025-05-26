import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { json, unauthorized } from "@/lib/api";
import { parseJson } from "@/lib/json";
import type { ChatMessageDTO, ChatResponse } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const kind = new URL(req.url).searchParams.get("kind") === "ADMIN" ? "ADMIN" : "KITCHEN";
  if (kind === "ADMIN" && user.role !== "ADMIN") return unauthorized();
  const convo = await db.aIConversation.findFirst({
    where: { userId: user.id, kind },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
  });
  const messages: ChatMessageDTO[] = (convo?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    payload: m.payload ? parseJson<ChatResponse | undefined>(m.payload, undefined) : undefined,
    createdAt: m.createdAt.getTime(),
  }));
  return json({ conversationId: convo?.id ?? null, messages });
}

/** Sohbeti temizle */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const kind = new URL(req.url).searchParams.get("kind") === "ADMIN" ? "ADMIN" : "KITCHEN";
  await db.aIConversation.deleteMany({ where: { userId: user.id, kind } });
  return json({ ok: true });
}
