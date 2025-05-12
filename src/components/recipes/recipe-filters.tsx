"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as RD from "@radix-ui/react-dialog";
import { Search, SlidersHorizontal, Star, X } from "lucide-react";
import { SheetContent } from "@/components/ui/dialog";
import { ToggleChip } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { IngredientInput, useLexicon } from "@/components/pantry/ingredient-picker";
import { ALLERGENS, DIETS, DIFFICULTIES, SORTS, labelOf, type SortKey } from "@/lib/constants";
import { activeFilterCount, parseRecipeQuery, serializeRecipeQuery, type RecipeQuery } from "@/lib/recipe-filters";
import { cn } from "@/lib/utils";

interface Option {
  slug: string;
  name: string;
}

const TIME_OPTIONS = [
  { label: "15 dk", max: 15 },
  { label: "30 dk", max: 30 },
  { label: "45 dk", max: 45 },
  { label: "60+ dk", min: 60 },
];

const CALORIE_OPTIONS = [
  { label: "300 altı", max: 300 },
  { label: "300–500", min: 300, max: 500 },
  { label: "500–700", min: 500, max: 700 },
  { label: "700+", min: 700 },
];

function useRecipeQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const query = parseRecipeQuery(params);
  const update = (patch: Partial<RecipeQuery>) => {
    const next = { ...query, ...patch, page: patch.page ?? 1 };
    const qs = serializeRecipeQuery(next);
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { query, update, pending };
}

const toggleIn = <T,>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter((x) => x !== v) : [...(arr ?? []), v]);

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-0">
      <legend className="mb-3 text-sm font-bold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterFields({ categories, cuisines }: { categories: Option[]; cuisines: Option[] }) {
  const { query, update } = useRecipeQuery();
  return (
    <div>
      <FilterGroup title="Kategori">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <ToggleChip key={c.slug} active={query.categories?.includes(c.slug)} onClick={() => update({ categories: toggleIn(query.categories, c.slug) })}>
              {c.name}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Mutfak">
        <div className="flex flex-wrap gap-2">
          {cuisines.map((c) => (
            <ToggleChip key={c.slug} active={query.cuisines?.includes(c.slug)} onClick={() => update({ cuisines: toggleIn(query.cuisines, c.slug) })}>
              {c.name}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Toplam süre">
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((t) => {
            const active = t.max ? query.maxMinutes === t.max : query.minMinutes === t.min;
            return (
              <ToggleChip key={t.label} active={active} onClick={() => update(active ? { maxMinutes: undefined, minMinutes: undefined } : { maxMinutes: t.max, minMinutes: t.min })}>
                {t.label}
              </ToggleChip>
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Zorluk">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <ToggleChip key={d.key} active={query.difficulties?.includes(d.key)} onClick={() => update({ difficulties: toggleIn(query.difficulties, d.key) })}>
              {d.label}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Kalori (porsiyon başı)">
        <div className="flex flex-wrap gap-2">
          {CALORIE_OPTIONS.map((c) => {
            const active = query.maxCalories === c.max && query.minCalories === c.min;
            return (
              <ToggleChip key={c.label} active={active} onClick={() => update(active ? { maxCalories: undefined, minCalories: undefined } : { maxCalories: c.max, minCalories: c.min })}>
                {c.label}
              </ToggleChip>
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Diyet">
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <ToggleChip key={d.key} active={query.diets?.includes(d.key)} onClick={() => update({ diets: toggleIn(query.diets, d.key) })}>
              {d.label}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Alerjen hariç tut">
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <ToggleChip key={a.key} active={query.excludeAllergens?.includes(a.key)} onClick={() => update({ excludeAllergens: toggleIn(query.excludeAllergens, a.key) })}>
              {query.excludeAllergens?.includes(a.key) && <X />} {a.label}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="İçermesi gereken malzeme">
        <IngredientInput value={query.includeIngredients ?? []} onChange={(v) => update({ includeIngredients: v })} placeholder="ör. tavuk, mantar" />
      </FilterGroup>
      <FilterGroup title="İçermemesi gereken malzeme">
        <IngredientInput value={query.excludeIngredients ?? []} onChange={(v) => update({ excludeIngredients: v })} placeholder="ör. soğan, mantar" />
      </FilterGroup>
      <FilterGroup title="Puan">
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3].map((r) => (
            <ToggleChip key={r} active={query.minRating === r} onClick={() => update({ minRating: query.minRating === r ? undefined : r })}>
              <Star className="fill-saffron text-saffron" /> {r.toLocaleString("tr-TR")}+
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

export function RecipeToolbar({ total, categories, cuisines }: { total: number; categories: Option[]; cuisines: Option[] }) {
  const { query, update, pending } = useRecipeQuery();
  const lexicon = useLexicon();
  const [q, setQ] = useState(query.q ?? "");
  const count = activeFilterCount(query);

  useEffect(() => setQ(query.q ?? ""), [query.q]);

  const chips: { label: string; remove: () => void }[] = [
    ...(query.q ? [{ label: `“${query.q}”`, remove: () => update({ q: undefined }) }] : []),
    ...(query.categories ?? []).map((s) => ({ label: categories.find((c) => c.slug === s)?.name ?? s, remove: () => update({ categories: query.categories!.filter((x) => x !== s) }) })),
    ...(query.cuisines ?? []).map((s) => ({ label: cuisines.find((c) => c.slug === s)?.name ?? s, remove: () => update({ cuisines: query.cuisines!.filter((x) => x !== s) }) })),
    ...(query.maxMinutes ? [{ label: `≤ ${query.maxMinutes} dk`, remove: () => update({ maxMinutes: undefined }) }] : []),
    ...(query.minMinutes ? [{ label: `${query.minMinutes}+ dk`, remove: () => update({ minMinutes: undefined }) }] : []),
    ...(query.difficulties ?? []).map((d) => ({ label: labelOf(DIFFICULTIES, d), remove: () => update({ difficulties: query.difficulties!.filter((x) => x !== d) }) })),
    ...(query.minCalories != null || query.maxCalories != null
      ? [{ label: `${query.minCalories ?? 0}–${query.maxCalories ?? "∞"} kcal`, remove: () => update({ minCalories: undefined, maxCalories: undefined }) }]
      : []),
    ...(query.diets ?? []).map((d) => ({ label: labelOf(DIETS, d), remove: () => update({ diets: query.diets!.filter((x) => x !== d) }) })),
    ...(query.excludeAllergens ?? []).map((a) => ({ label: `${labelOf(ALLERGENS, a)} yok`, remove: () => update({ excludeAllergens: query.excludeAllergens!.filter((x) => x !== a) }) })),
    ...(query.includeIngredients ?? []).map((s) => ({ label: `+ ${lexicon?.name(s) ?? s}`, remove: () => update({ includeIngredients: query.includeIngredients!.filter((x) => x !== s) }) })),
    ...(query.excludeIngredients ?? []).map((s) => ({ label: `− ${lexicon?.name(s) ?? s}`, remove: () => update({ excludeIngredients: query.excludeIngredients!.filter((x) => x !== s) }) })),
    ...(query.minRating ? [{ label: `${query.minRating}+ puan`, remove: () => update({ minRating: undefined }) }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() || undefined });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tarif, malzeme ya da istek ara… (ör. 30 dakikada vegan)"
            className="h-12 w-full rounded-full border border-line bg-paper pr-4 pl-12 text-[15px] focus:border-olive focus:ring-4 focus:ring-olive/10 focus:outline-none"
            aria-label="Tariflerde ara"
          />
        </form>
        <div className="flex gap-2">
          <RD.Root>
            <RD.Trigger className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-paper px-4 font-semibold lg:hidden">
              <SlidersHorizontal className="size-4" /> Filtrele {count > 0 && <span className="grid size-6 place-items-center rounded-full bg-olive text-xs text-paper">{count}</span>}
            </RD.Trigger>
            <SheetContent title="Filtreler" side="bottom">
              <div className="p-5">
                <FilterFields categories={categories} cuisines={cuisines} />
              </div>
              <div className="sticky bottom-0 border-t border-line bg-paper p-4">
                <RD.Close className="h-12 w-full rounded-full bg-olive font-semibold text-paper">{total} tarifi göster</RD.Close>
              </div>
            </SheetContent>
          </RD.Root>
          <Select value={query.sort} onChange={(e) => update({ sort: e.target.value as SortKey })} className="h-12 w-auto rounded-full sm:min-w-52" aria-label="Sıralama">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("mr-2 font-serif text-xl font-semibold transition-opacity", pending && "opacity-50")} aria-live="polite">
          {total} Tarif
        </p>
        {chips.map((c) => (
          <button key={c.label} onClick={c.remove} className="inline-flex h-8 items-center gap-1 rounded-full bg-olive-50 pr-2 pl-3 text-sm font-semibold text-olive transition hover:bg-olive hover:text-paper">
            {c.label} <X className="size-3.5" aria-label="kaldır" />
          </button>
        ))}
        {chips.length > 1 && (
          <button
            onClick={() => update({ q: undefined, categories: [], cuisines: [], maxMinutes: undefined, minMinutes: undefined, difficulties: [], minCalories: undefined, maxCalories: undefined, diets: [], excludeAllergens: [], includeIngredients: [], excludeIngredients: [], minRating: undefined })}
            className="text-sm font-semibold text-tomato hover:underline"
          >
            Tümünü temizle
          </button>
        )}
      </div>
    </div>
  );
}

export function RecipeFilterSidebar({ categories, cuisines }: { categories: Option[]; cuisines: Option[] }) {
  return (
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[var(--radius-card)] border border-line/70 bg-paper p-5 lg:block" aria-label="Filtreler">
      <FilterFields categories={categories} cuisines={cuisines} />
    </aside>
  );
}
