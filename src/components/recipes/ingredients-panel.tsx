"use client";

import { useState } from "react";
import { Check, ListPlus, ShoppingBasket } from "lucide-react";
import { Stepper } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { usePantry } from "@/components/providers/pantry-provider";
import { useShopping } from "@/components/providers/shopping-provider";
import { useLexicon } from "@/components/pantry/ingredient-picker";
import { formatAmount, scaleQuantity, toMetric } from "@/lib/units";
import { cn } from "@/lib/utils";

export interface DetailIngredient {
  id: string;
  slug: string;
  name: string;
  quantity: number | null;
  unit: string;
  note: string | null;
  optional: boolean;
  density: number | null;
  conversions: Record<string, number>;
}

/**
 * Malzemeler: porsiyon ayarlayıcı (tüm miktarlar ölçeklenir), birim dönüşümü
 * (ölçü kabı ↔ gram/ml), dolaptakiler ✓ ve "Eksiklerimi listeye ekle".
 */
export function IngredientsPanel({
  recipeId,
  baseServings,
  initialServings,
  ingredients,
  onServingsChange,
}: {
  recipeId: string;
  baseServings: number;
  initialServings?: number;
  ingredients: DetailIngredient[];
  onServingsChange?: (n: number) => void;
}) {
  const [servings, setServings] = useState(initialServings ?? baseServings);
  const [metric, setMetric] = useState(false);
  const [adding, setAdding] = useState<"missing" | "all" | null>(null);
  const pantry = usePantry();
  const shopping = useShopping();
  const lexicon = useLexicon();
  const factor = servings / baseServings;

  // Dolap kapsamı (üst/alt tür dahil) — eşleştirme modülüyle aynı mantık
  const pantrySet = lexicon ? lexicon.expandPantry(pantry.slugs) : new Set(pantry.slugs);
  const always = new Set(pantry.alwaysHave);
  const inPantry = (slug: string) => pantrySet.has(slug) || always.has(slug);
  const required = ingredients.filter((i) => !i.optional && !always.has(i.slug));
  const missingCount = required.filter((i) => !pantrySet.has(i.slug)).length;

  const change = (n: number) => {
    setServings(n);
    onServingsChange?.(n);
  };

  const add = async (onlyMissing: boolean) => {
    setAdding(onlyMissing ? "missing" : "all");
    await shopping.addRecipe(recipeId, { servings, onlyMissing });
    setAdding(null);
  };

  return (
    <section aria-labelledby="ingredients-title" className="print-break">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="ingredients-title" className="text-2xl font-semibold">
          Malzemeler
        </h2>
        <Stepper value={servings} onChange={change} label="Porsiyon" suffix="kişilik" max={40} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-cream-200 p-1 text-sm font-semibold" role="group" aria-label="Ölçü birimi">
          <button onClick={() => setMetric(false)} aria-pressed={!metric} className={cn("h-9 rounded-full px-3.5 transition", !metric ? "bg-paper shadow-soft" : "text-muted")}>
            Ölçü kabı
          </button>
          <button onClick={() => setMetric(true)} aria-pressed={metric} className={cn("h-9 rounded-full px-3.5 transition", metric ? "bg-paper shadow-soft" : "text-muted")}>
            Gram / ml
          </button>
        </div>
        {pantry.ready && (
          <p className="text-right text-xs text-muted">
            {missingCount === 0 ? "Hepsi dolabında 🎉" : `${required.length - missingCount}/${required.length} malzeme dolabında`}
          </p>
        )}
      </div>

      <ul className="divide-y divide-line/70 rounded-2xl border border-line/70 bg-paper">
        {ingredients.map((i) => {
          const q = scaleQuantity(i.quantity, factor);
          const metricValue = metric ? toMetric(q, i.unit, { density: i.density, conversions: i.conversions, isLiquid: i.density != null }) : null;
          const amount = metricValue ? formatAmount(metricValue.quantity, metricValue.unit) : formatAmount(q, i.unit);
          const have = pantry.ready && inPantry(i.slug);
          return (
            <li key={i.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
              <span
                className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition", have ? "border-olive bg-olive text-paper" : "border-line")}
                aria-label={have ? "Dolabında var" : "Dolabında yok"}
                title={have ? (always.has(i.slug) ? "Evde hep olanlar" : "Dolabında var") : "Dolabında yok"}
              >
                {have && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 text-[15px]">
                <span className={cn("font-medium", have && "text-muted")}>{i.name}</span>
                {i.note && <span className="text-muted">, {i.note}</span>}
                {i.optional && <span className="ml-1.5 rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-semibold text-muted">isteğe bağlı</span>}
              </span>
              <span className="shrink-0 text-right text-[15px] font-semibold tabular-nums text-ink">{amount}</span>
            </li>
          );
        })}
      </ul>

      <div className="no-print mt-4 grid gap-2 sm:grid-cols-2">
        <Button size="lg" onClick={() => add(true)} loading={adding === "missing"} disabled={!!adding}>
          <ListPlus /> Eksiklerimi listeye ekle {pantry.ready && missingCount > 0 && <span className="rounded-full bg-paper/20 px-2 text-sm">{missingCount}</span>}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => add(false)} loading={adding === "all"} disabled={!!adding}>
          <ShoppingBasket /> Tümünü ekle
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Tuz, karabiber, su ve sıvı yağ gibi “evde hep olanlar” listeye eklenmez. Bu listeyi Hesabım → Mutfak Tercihlerim'den değiştirebilirsin.</p>
    </section>
  );
}
