"use client";

import Link from "next/link";
import { ArrowRight, Refrigerator } from "lucide-react";
import { IngredientInput, useLexicon } from "@/components/pantry/ingredient-picker";
import { Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { usePantry } from "@/components/providers/pantry-provider";
import { AISLES } from "@/lib/constants";

export function PantryEditor() {
  const pantry = usePantry();
  const lexicon = useLexicon();
  if (!pantry.ready) return <Skeleton className="h-64" />;
  const grouped = AISLES.map((a) => ({ ...a, items: pantry.slugs.filter((s) => lexicon?.entries.get(s)?.aisle === a.key) })).filter((g) => g.items.length);
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-1 text-xl font-semibold">Dolabımdakiler</h2>
        <p className="mb-4 text-sm text-muted">Değişiklikler otomatik kaydedilir.</p>
        <IngredientInput value={pantry.slugs} onChange={pantry.set} />
      </Card>
      {pantry.slugs.length === 0 ? (
        <EmptyState icon={<Refrigerator />} title="Dolabın boş" description="Malzeme ekledikçe sana uygun tarifleri ve eksikleri daha iyi gösterebiliriz." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {grouped.map((g) => (
            <Card key={g.key} className="p-4">
              <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{g.label}</p>
              <p className="text-ink-soft">{g.items.map((s) => lexicon?.name(s)).join(", ")}</p>
            </Card>
          ))}
        </div>
      )}
      <Link href="/pantry" className="inline-flex h-12 items-center gap-2 rounded-full bg-olive px-6 font-semibold text-paper">
        Bu dolapla ne pişer? <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
