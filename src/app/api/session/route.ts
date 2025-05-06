import { getCurrentUser } from "@/lib/auth";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return json({ user }, { headers: { "Cache-Control": "no-store" } });
}
