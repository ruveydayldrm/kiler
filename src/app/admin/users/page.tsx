import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseList } from "@/lib/json";
import { DIETS, labelOf } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kullanıcılar" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true, lastActiveAt: true,
      preference: { select: { diets: true } },
      _count: { select: { favorites: true, cookedLogs: true, reviews: true, mealPlans: true } },
    },
  });
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Kullanıcılar</h1>
        <p className="text-muted">{users.length} kullanıcı · {users.filter((u) => u.role === "ADMIN").length} yönetici</p>
      </header>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="p-3">Kullanıcı</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Diyet</th>
              <th className="p-3 text-right">Favori / Yaptı / Plan</th>
              <th className="p-3">Son aktivite</th>
              <th className="p-3">Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="p-3">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="p-3">{u.role === "ADMIN" ? <Badge tone="tomato">ADMIN</Badge> : <Badge tone="neutral">USER</Badge>}</td>
                <td className="p-3 text-ink-soft">{parseList(u.preference?.diets).map((d) => labelOf(DIETS, d)).join(", ") || "—"}</td>
                <td className="p-3 text-right tabular-nums">
                  {u._count.favorites} / {u._count.cookedLogs} / {u._count.mealPlans}
                </td>
                <td className="p-3 text-ink-soft">{u.lastActiveAt ? formatDate(u.lastActiveAt, { day: "numeric", month: "short" }) : "—"}</td>
                <td className="p-3 text-ink-soft">{formatDate(u.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
