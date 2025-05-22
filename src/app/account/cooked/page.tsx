import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { DeleteCookedButton } from "@/components/account/delete-cooked-button";
import { EmptyState } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Yaptıklarım", robots: { index: false } };

export default async function CookedPage() {
  const user = await requireUser("/account/cooked");
  const logs = await db.cookedLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { recipe: { select: { slug: true, title: true, imageUrl: true, coverColor: true } } },
  });
  if (!logs.length) {
    return (
      <EmptyState
        icon={<CheckCheck />}
        title="Henüz bir şey pişirmedin mi?"
        description="Bir tarifi yaptığında “Yaptım” de; notlarını sakla, öneriler de damak tadına göre şekillensin."
        action={
          <Link href="/recipes" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
            Bugün ne pişirsek?
          </Link>
        }
      />
    );
  }
  return (
    <ul className="space-y-3">
      {logs.map((l) => (
        <li key={l.id} className="flex gap-4 rounded-[var(--radius-card)] border border-line/70 bg-paper p-3">
          <Link href={`/recipes/${l.recipe.slug}`}>
            <RecipeThumb title={l.recipe.title} imageUrl={l.photoUrl ?? l.recipe.imageUrl} color={l.recipe.coverColor} className="size-20 rounded-2xl" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/recipes/${l.recipe.slug}`} className="font-serif text-lg font-semibold hover:text-olive">
              {l.recipe.title}
            </Link>
            <p className="text-xs text-muted">{formatDate(l.createdAt)}</p>
            {l.note && <p className="mt-1 text-sm text-ink-soft">“{l.note}”</p>}
          </div>
          <DeleteCookedButton id={l.id} />
        </li>
      ))}
    </ul>
  );
}
