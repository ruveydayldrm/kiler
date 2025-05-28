import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAdminAssistant } from "@/lib/ai-admin";
import { error, forbidden, json, parseBody, rateLimit } from "@/lib/api";
import { toJson } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAdmin(); // rol veritabanından doğrulanır
  if (!admin) return forbidden();
  if (!rateLimit(`admin-chat:${admin.id}`, 30, 60_000)) return error("Çok fazla istek.", 429);
  const body = await parseBody(req, z.object({ message: z.string().trim().min(1).max(500) }));
  if (body.response) return body.response;

  const response = await runAdminAssistant(body.data.message, admin.id);

  let convo = await db.aIConversation.findFirst({ where: { userId: admin.id, kind: "ADMIN" }, orderBy: { updatedAt: "desc" } });
  convo ??= await db.aIConversation.create({ data: { userId: admin.id, kind: "ADMIN", title: "Yönetici asistanı" } });
  await db.aIMessage.createMany({
    data: [
      { conversationId: convo.id, role: "user", content: body.data.message },
      { conversationId: convo.id, role: "assistant", content: response.message, payload: toJson(response) },
    ],
  });
  await db.aIConversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });
  return json({ response });
}
