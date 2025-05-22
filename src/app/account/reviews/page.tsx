import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Yorumlarım", robots: { index: false } };

export default async function MyReviewsPage() {
  const user = await requireUser("/account/reviews");
  const reviews = await db.review.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { recipe: { select: { slug: true, title: true } } } });
  if (!reviews.length) return <EmptyState icon={<MessageCircle />} title="Henüz yorum yazmadın" description="Denediğin tariflere puan ver; başkalarına da yol göster." />;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Link href={`/recipes/${r.recipe.slug}`} className="font-serif text-lg font-semibold hover:text-olive">
              {r.recipe.title}
            </Link>
            <span className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("size-4", i < r.rating ? "fill-saffron text-saffron" : "text-line")} />
              ))}
            </span>
            {r.status === "HIDDEN" && <Badge tone="tomato">Moderasyon nedeniyle gizli</Badge>}
          </div>
          <p className="text-ink-soft">{r.comment}</p>
          <p className="mt-1 text-xs text-muted">{formatDate(r.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
