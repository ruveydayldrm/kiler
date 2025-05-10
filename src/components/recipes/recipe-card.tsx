"use client";

import { useState } from "react";
import Link from "next/link";
import { ChefHat, Clock, Flame, Heart, ListPlus, ArrowUpRight } from "lucide-react";
import { RecipeCover } from "./recipe-image";
import { DietBadges } from "./diet-badges";
import { Rating } from "@/components/ui/misc";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useShopping } from "@/components/providers/shopping-provider";
import { DIFFICULTIES, labelOf } from "@/lib/constants";
import type { RecipeIndexItem } from "@/lib/matching";
import { cn, formatMinutes } from "@/lib/utils";

export type RecipeCardData = Pick<
  RecipeIndexItem,
  "id" | "slug" | "title" | "imageUrl" | "coverColor" | "categoryName" | "difficulty" | "prepMinutes" | "cookMinutes" | "totalMinutes" | "calories" | "diets" | "ratingAvg" | "ratingCount"
>;

export interface MatchInfo {
  percent: number;
  matched: number;
  required: number;
  missing: { slug: string; name: string }[];
}

export function FavoriteButton({ id, title, className }: { id: string; title: string; className?: string }) {
  const fav = useFavorites();
  const active = fav.isFavorite(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void fav.toggle(id, title);
      }}
      aria-pressed={active}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-paper/90 shadow-soft backdrop-blur transition hover:scale-105 active:scale-95",
        active ? "text-tomato" : "text-ink-soft hover:text-tomato",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", active && "fill-tomato")} />
    </button>
  );
}

export function RecipeCard({
  recipe,
  match,
  priority,
  className,
  compact,
}: {
  recipe: RecipeCardData;
  match?: MatchInfo;
  priority?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const shopping = useShopping();
  const [adding, setAdding] = useState(false);

  const addIngredients = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await shopping.addRecipe(recipe.id, { onlyMissing: true });
    setAdding(false);
  };

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/60 bg-paper shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <Link href={`/recipes/${recipe.slug}`} className="absolute inset-0 z-10" aria-label={`${recipe.title} tarifini gör`} />
      <div className="relative">
        <RecipeCover
          title={recipe.title}
          imageUrl={recipe.imageUrl}
          color={recipe.coverColor}
          label={recipe.categoryName}
          priority={priority}
          className={compact ? "aspect-[4/3]" : "aspect-[5/4]"}
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {match && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold shadow-soft backdrop-blur",
                match.percent === 100 ? "bg-olive text-paper" : match.percent >= 70 ? "bg-paper/95 text-olive" : "bg-paper/95 text-[#a26a12]",
              )}
              title={`${match.matched}/${match.required} malzeme elinde`}
            >
              %{match.percent} · {match.matched}/{match.required}
            </span>
          )}
        </div>
        <FavoriteButton id={recipe.id} title={recipe.title} className="absolute top-3 right-3 z-20" />

        {/* Masaüstü hover aksiyonları */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 hidden translate-y-2 gap-2 opacity-0 transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:flex">
          <Link href={`/recipes/${recipe.slug}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-paper/95 text-sm font-semibold text-ink shadow-soft backdrop-blur hover:bg-paper">
            Tarifi Gör <ArrowUpRight className="size-4" />
          </Link>
          <button
            onClick={addIngredients}
            disabled={adding}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-olive px-3.5 text-sm font-semibold text-paper shadow-soft hover:bg-olive-600 disabled:opacity-70"
            aria-label="Malzemeleri listeye ekle"
            title="Malzemeleri listeye ekle"
          >
            <ListPlus className="size-4" /> <span className="hidden lg:inline">Listeye ekle</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold tracking-wide text-tomato uppercase">{recipe.categoryName}</span>
          <Rating value={recipe.ratingAvg} count={recipe.ratingCount} />
        </div>
        <h3 className="font-serif text-lg leading-snug font-semibold text-ink">{recipe.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1" title={`Hazırlık ${recipe.prepMinutes} dk + pişirme ${recipe.cookMinutes} dk`}>
            <Clock className="size-3.5" /> {formatMinutes(recipe.totalMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ChefHat className="size-3.5" /> {labelOf(DIFFICULTIES, recipe.difficulty)}
          </span>
          {recipe.calories != null && (
            <span className="inline-flex items-center gap-1">
              <Flame className="size-3.5" /> {Math.round(recipe.calories)} kcal
            </span>
          )}
        </div>
        {match && match.missing.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {match.missing.map((m) => (
              <span key={m.slug} className="rounded-full bg-tomato-50 px-2 py-0.5 text-[11px] font-semibold text-tomato-600">
                {m.name}
              </span>
            ))}
          </div>
        )}
        {!compact && (
          <div className="mt-auto pt-1">
            <DietBadges diets={recipe.diets} />
          </div>
        )}
      </div>
    </article>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line/60 bg-paper">
      <div className="aspect-[5/4] animate-pulse bg-cream-300/60" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-cream-300/60" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-cream-300/60" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-cream-300/60" />
      </div>
    </div>
  );
}
