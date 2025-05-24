import Link from "next/link";
import { Star } from "lucide-react";
import { ReviewModerationButton } from "@/components/admin/review-moderation-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Yorumlar" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const where = status === "HIDDEN" || status === "PUBLISHED" ? { status } : {};
  const [reviews, hidden] = await Promise.all([
    db.review.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, recipe: { select: { title: true, slug: true } } } }),
    db.review.count({ where: { status: "HIDDEN" } }),
  ]);
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Yorum moderasyonu</h1>
          <p className="text-muted">{hidden} gizlenmiş yorum</p>
        </div>
        <div className="flex gap-2">
          {[
            { v: "", l: "Tümü" },
            { v: "PUBLISHED", l: "Yayında" },
            { v: "HIDDEN", l: "Gizli" },
          ].map((f) => (
            <Link key={f.v} href={f.v ? `/admin/reviews?status=${f.v}` : "/admin/reviews"} className={cn("inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold", (status ?? "") === f.v ? "bg-ink text-paper" : "border border-line bg-paper")}>
              {f.l}
            </Link>
          ))}
        </div>
      </header>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-start", r.status === "HIDDEN" && "opacity-70")}>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{r.user.name}</span>
                <span className="text-muted">→</span>
                <Link href={`/recipes/${r.recipe.slug}`} className="font-semibold text-olive hover:underline">
                  {r.recipe.title}
                </Link>
                <span className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-saffron text-saffron" : "text-line")} />
                  ))}
                </span>
                {r.status === "HIDDEN" && <Badge tone="tomato">Gizli</Badge>}
              </div>
              <p className="text-ink-soft">{r.comment}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(r.createdAt)}</p>
            </div>
            <ReviewModerationButton id={r.id} status={r.status as "PUBLISHED" | "HIDDEN"} />
          </Card>
        ))}
      </div>
    </div>
  );
}
