"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecipeCard, type RecipeCardData } from "@/components/recipes/recipe-card";

/** Yatay kaydırılabilir tarif şeridi (mobilde parmakla, masaüstünde oklarla). */
export function RecipeRail({ recipes, label }: { recipes: RecipeCardData[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6" role="region" aria-label={label}>
        {recipes.map((r) => (
          <div key={r.id} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[calc(25%-12px)]">
            <RecipeCard recipe={r} compact />
          </div>
        ))}
      </div>
      <div className="mt-4 hidden justify-end gap-2 sm:flex">
        <button onClick={() => scroll(-1)} className="grid size-11 place-items-center rounded-full border border-line bg-paper transition hover:border-olive hover:text-olive" aria-label="Önceki">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={() => scroll(1)} className="grid size-11 place-items-center rounded-full border border-line bg-paper transition hover:border-olive hover:text-olive" aria-label="Sonraki">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
