import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { listPlans } from "@/lib/planner-server";
import { addDays, isoDate, startOfWeek } from "@/lib/utils";

export const metadata: Metadata = { title: "Yemek Planlarım", robots: { index: false } };

const fmt = (iso: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export default async function PlansPage() {
  const user = await requireUser("/account/plans");
  const plans = (await listPlans(user.id)).filter((p) => p.entryCount > 0);
  const current = isoDate(startOfWeek());
  if (!plans.length) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="Henüz bir plan yok"
        description="Haftanı planla; geçmiş haftaların burada birikir."
        action={
          <Link href="/planner" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
            Planlamaya başla
          </Link>
        }
      />
    );
  }
  return (
    <ul className="space-y-3">
      {plans.map((p) => {
        const end = isoDate(addDays(new Date(`${p.weekStart}T00:00:00Z`), 6));
        const label = p.weekStart === current ? "Bu hafta" : p.weekStart > current ? "Gelecek" : "Geçmiş";
        return (
          <li key={p.id}>
            <Link href={`/planner?week=${p.weekStart}`} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line/70 bg-paper p-4 transition hover:shadow-soft">
              <span className="grid size-12 place-items-center rounded-2xl bg-olive-50 text-olive">
                <CalendarDays className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  {fmt(p.weekStart)} – {fmt(end)}
                </p>
                <p className="text-sm text-muted">
                  {label} · {p.entryCount} öğün
                </p>
              </div>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
