"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, Plus, Search, ShoppingBasket, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AiPlanDialog } from "./ai-plan-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { useShopping } from "@/components/providers/shopping-provider";
import { DAYS, DAYS_SHORT, MEALS, type DietKey, type MealKey } from "@/lib/constants";
import { MEAL_CATEGORIES } from "@/lib/planner";
import { api } from "@/lib/client-storage";
import { fold } from "@/lib/matching";
import { addDays, cn, formatNumber, isoDate, startOfWeek } from "@/lib/utils";

export interface PlanEntry {
  id: string;
  day: number;
  meal: MealKey;
  servings: number;
  recipe: { id: string; slug: string; title: string; imageUrl: string | null; coverColor: string; categoryName: string; totalMinutes: number; calories: number | null; protein: number | null; carbs: number | null; fat: number | null };
}
export interface PlanData {
  weekStart: string;
  entries: PlanEntry[];
}
export interface PickerRecipe {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  calories: number | null;
  totalMinutes: number;
  imageUrl: string | null;
  coverColor: string;
}

const DRAG_TYPE = "application/x-kiler";

export function PlannerBoard({
  initial,
  recipes,
  kitchen,
}: {
  initial: PlanData;
  recipes: PickerRecipe[];
  kitchen: { calorieTarget: number; diets: DietKey[]; householdSize: number };
}) {
  const router = useRouter();
  const shopping = useShopping();
  const [plan, setPlan] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [picker, setPicker] = useState<{ day: number; meal: MealKey } | null>(null);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [mobileDay, setMobileDay] = useState(todayIdx);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const weekStartDate = new Date(`${plan.weekStart}T00:00:00Z`);
  const isCurrentWeek = plan.weekStart === isoDate(startOfWeek());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const fmt = (d: Date) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);

  const totals = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        plan.entries
          .filter((e) => e.day === day)
          .reduce((a, e) => ({ kcal: a.kcal + (e.recipe.calories ?? 0), protein: a.protein + (e.recipe.protein ?? 0), carbs: a.carbs + (e.recipe.carbs ?? 0), fat: a.fat + (e.recipe.fat ?? 0) }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
      ),
    [plan.entries],
  );

  const mutate = async (fn: () => Promise<PlanData>, success?: string) => {
    setBusy(true);
    try {
      setPlan(await fn());
      if (success) toast.success(success);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addRecipe = (recipeId: string, day: number, meal: MealKey) => {
    const mealLabel = MEALS.find((m) => m.key === meal)!.label.toLocaleLowerCase("tr-TR");
    return mutate(
      () => api("/api/planner", { method: "POST", json: { weekStart: plan.weekStart, day, meal, recipeId, servings: kitchen.householdSize } }),
      `${DAYS[day]} ${mealLabel}${meal === "SNACK" ? "" : " yemeği"} planına eklendi.`,
    );
  };
  const moveEntry = (entryId: string, day: number, meal: MealKey) => mutate(() => api("/api/planner", { method: "PATCH", json: { entryId, day, meal } }));
  const removeEntry = (entry: PlanEntry) =>
    mutate(async () => {
      const data = await api<PlanData>(`/api/planner?id=${entry.id}`, { method: "DELETE" });
      toast(`${entry.recipe.title} plandan çıkarıldı`, { action: { label: "Geri al", onClick: () => void addRecipe(entry.recipe.id, entry.day, entry.meal) } });
      return data;
    });

  const goWeek = (offset: number) => {
    const next = isoDate(addDays(weekStartDate, offset * 7));
    router.push(`/planner?week=${next}`);
  };

  const buildList = async () => {
    setBusy(true);
    try {
      const res = await api<{ added: number; merged: number; message?: string }>("/api/planner/shopping", { method: "POST", json: { weekStart: plan.weekStart } });
      if (res.message) toast.info(res.message);
      else {
        toast.success(`Haftanın listesi hazır: ${res.added} yeni ürün, ${res.merged} birleştirildi.`, { action: { label: "Listeye git", onClick: () => router.push("/shopping-list") } });
        await shopping.refresh();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent, day: number, meal: MealKey) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData(DRAG_TYPE)) as { kind: "recipe" | "entry"; id: string };
      if (data.kind === "recipe") void addRecipe(data.id, day, meal);
      else void moveEntry(data.id, day, meal);
    } catch {
      /* geçersiz sürükleme */
    }
  };

  const cell = (day: number, meal: MealKey, compact = false) => {
    const key = `${day}-${meal}`;
    const items = plan.entries.filter((e) => e.day === day && e.meal === meal);
    return (
      <div
        key={key}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(key);
        }}
        onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
        onDrop={(e) => onDrop(e, day, meal)}
        className={cn("flex min-h-24 flex-col gap-1.5 rounded-2xl border border-dashed p-1.5 transition", dragOver === key ? "border-olive bg-olive-50" : "border-line/80 bg-paper/50")}
      >
        {items.map((e) => (
          <div
            key={e.id}
            draggable
            onDragStart={(ev) => ev.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: "entry", id: e.id }))}
            className="group relative flex items-center gap-2 rounded-xl border border-line/70 bg-paper p-1.5 shadow-soft"
          >
            <GripVertical className="hidden size-4 shrink-0 cursor-grab text-line lg:block" aria-hidden />
            <RecipeThumb title={e.recipe.title} imageUrl={e.recipe.imageUrl} color={e.recipe.coverColor} className={cn("shrink-0 rounded-lg", compact ? "size-12" : "size-9")} />
            <Link href={`/recipes/${e.recipe.slug}`} className="min-w-0 flex-1">
              <p className={cn("leading-tight font-semibold", compact ? "text-[15px]" : "line-clamp-2 text-xs")}>{e.recipe.title}</p>
              <p className="text-[11px] text-muted">
                {e.recipe.calories ? `${Math.round(e.recipe.calories)} kcal · ` : ""}
                {e.servings} kişilik
              </p>
            </Link>
            <button onClick={() => removeEntry(e)} className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-100 transition hover:bg-tomato-50 hover:text-tomato lg:opacity-0 lg:group-hover:opacity-100" aria-label={`${e.recipe.title} plandan çıkar`}>
              <X className="size-4" />
            </button>
          </div>
        ))}
        <button onClick={() => setPicker({ day, meal })} className={cn("flex items-center justify-center gap-1 rounded-xl text-xs font-semibold text-muted transition hover:bg-olive-50 hover:text-olive", compact ? "h-12 text-sm" : "h-8")} aria-label={`${DAYS[day]} ${MEALS.find((m) => m.key === meal)!.label} için tarif ekle`}>
          <Plus className="size-4" /> {compact || !items.length ? "Ekle" : ""}
        </button>
      </div>
    );
  };

  const DayTotals = ({ day }: { day: number }) => {
    const t = totals[day]!;
    const pct = Math.min(130, (t.kcal / kitchen.calorieTarget) * 100);
    const over = t.kcal > kitchen.calorieTarget * 1.1;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className={cn(over ? "text-tomato-600" : "text-ink-soft")}>{formatNumber(t.kcal)} kcal</span>
          <span className="text-muted">/ {formatNumber(kitchen.calorieTarget)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-cream-300">
          <div className={cn("h-full rounded-full", over ? "bg-tomato" : "bg-olive")} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <p className="text-[10px] text-muted">
          P {Math.round(t.protein)}g · K {Math.round(t.carbs)}g · Y {Math.round(t.fat)}g
        </p>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", busy && "cursor-progress")}>
      {/* Araç çubuğu */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => goWeek(-1)} className="grid size-11 place-items-center rounded-full border border-line bg-paper hover:border-olive" aria-label="Önceki hafta">
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-48 text-center">
            <p className="font-serif text-xl font-semibold">
              {fmt(dates[0]!)} – {fmt(dates[6]!)}
            </p>
            <p className="text-xs text-muted">{isCurrentWeek ? "Bu hafta" : "Seçili hafta"} · {plan.entries.length} öğün</p>
          </div>
          <button onClick={() => goWeek(1)} className="grid size-11 place-items-center rounded-full border border-line bg-paper hover:border-olive" aria-label="Sonraki hafta">
            <ChevronRight className="size-5" />
          </button>
          <Link href="/planner" className="ml-1 hidden h-11 items-center rounded-full px-3 text-sm font-semibold text-olive hover:bg-olive-50 sm:inline-flex">
            Bugün
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => setAiOpen(true)}>
            <Sparkles /> AI ile haftamı planla
          </Button>
          <Button variant="secondary" onClick={buildList} disabled={!plan.entries.length || busy}>
            <ShoppingBasket /> Haftanın alışveriş listesini oluştur
          </Button>
          {plan.entries.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("Bu haftanın tüm planı silinsin mi?")) void mutate(() => api(`/api/planner?week=${plan.weekStart}`, { method: "DELETE" }), "Hafta temizlendi.");
              }}
              aria-label="Haftayı temizle"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      {plan.entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-8 text-center">
          <CalendarDays className="size-8 text-sage" />
          <p className="font-serif text-xl font-semibold">Haftan henüz bomboş — ama tabaklar seni bekliyor</p>
          <p className="max-w-lg text-sm text-muted">Hücrelerdeki “Ekle”ye dokun, tarifleri sürükleyip bırak ya da AI'ya “haftamı planla” de; birkaç saniyede taslak hazır.</p>
        </div>
      )}

      {/* Masaüstü ızgara */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="grid min-w-[980px] grid-cols-[96px_repeat(7,1fr)] gap-2">
          <div />
          {dates.map((d, i) => (
            <div key={i} className={cn("rounded-2xl p-2.5", i === todayIdx && isCurrentWeek ? "bg-olive text-paper" : "bg-cream-200/70")}>
              <p className="text-sm font-bold">{DAYS[i]}</p>
              <p className={cn("text-xs", i === todayIdx && isCurrentWeek ? "text-paper/75" : "text-muted")}>{fmt(d)}</p>
            </div>
          ))}
          {MEALS.map((m) => (
            <div key={m.key} className="contents">
              <div className="flex items-start pt-3 text-sm font-semibold text-ink-soft">{m.label}</div>
              {dates.map((_, day) => cell(day, m.key))}
            </div>
          ))}
          <div className="pt-2 text-xs font-semibold text-muted">Günlük</div>
          {dates.map((_, day) => (
            <div key={day} className="rounded-2xl bg-paper p-2.5">
              <DayTotals day={day} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobil: gün gün */}
      <div className="lg:hidden">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Günler">
          {dates.map((d, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={mobileDay === i}
              onClick={() => setMobileDay(i)}
              className={cn("flex min-w-16 shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 transition", mobileDay === i ? "bg-olive text-paper" : "bg-paper text-ink-soft")}
            >
              <span className="text-xs font-bold">{DAYS_SHORT[i]}</span>
              <span className="text-lg font-semibold">{d.getUTCDate()}</span>
              <span className={cn("mt-0.5 size-1.5 rounded-full", plan.entries.some((e) => e.day === i) ? (mobileDay === i ? "bg-saffron" : "bg-olive") : "bg-transparent")} />
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl bg-paper p-4">
            <p className="mb-2 font-serif text-lg font-semibold">{DAYS[mobileDay]}</p>
            <DayTotals day={mobileDay} />
          </div>
          {MEALS.map((m) => (
            <div key={m.key}>
              <p className="mb-1.5 text-sm font-bold text-ink-soft">{m.label}</p>
              {cell(mobileDay, m.key, true)}
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setMobileDay((d) => Math.max(0, d - 1))} disabled={mobileDay === 0}>
              <ChevronLeft /> Önceki gün
            </Button>
            <Button variant="ghost" onClick={() => setMobileDay((d) => Math.min(6, d + 1))} disabled={mobileDay === 6}>
              Sonraki gün <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {/* Masaüstü sürüklenebilir tarif rafı */}
      <RecipeShelf recipes={recipes} />

      <RecipePickerDialog
        slot={picker}
        recipes={recipes}
        onClose={() => setPicker(null)}
        onPick={(id) => {
          if (picker) void addRecipe(id, picker.day, picker.meal);
          setPicker(null);
        }}
      />
      <AiPlanDialog open={aiOpen} onOpenChange={setAiOpen} weekStart={plan.weekStart} defaults={kitchen} onSaved={setPlan} />
    </div>
  );
}

function RecipeShelf({ recipes }: { recipes: PickerRecipe[] }) {
  const [q, setQ] = useState("");
  const list = recipes.filter((r) => !q || fold(r.title).includes(fold(q))).slice(0, 24);
  return (
    <section className="hidden rounded-[var(--radius-card)] border border-line/70 bg-paper p-4 lg:block" aria-label="Sürüklenebilir tarifler">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="font-semibold">Tarifleri sürükleyip takvime bırak</p>
        <div className="relative w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tarif ara…" className="h-10 w-full rounded-full border border-line bg-cream pr-3 pl-9 text-sm focus:outline-none" aria-label="Rafta tarif ara" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((r) => (
          <div
            key={r.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: "recipe", id: r.id }))}
            className="flex cursor-grab items-center gap-2 rounded-full border border-line bg-cream py-1 pr-3 pl-1 text-sm active:cursor-grabbing"
          >
            <RecipeThumb title={r.title} imageUrl={r.imageUrl} color={r.coverColor} className="size-7 rounded-full" />
            {r.title}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecipePickerDialog({ slot, recipes, onClose, onPick }: { slot: { day: number; meal: MealKey } | null; recipes: PickerRecipe[]; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  if (!slot) return null;
  const suited = MEAL_CATEGORIES[slot.meal];
  const list = recipes
    .filter((r) => (all || q ? true : suited.includes(r.categorySlug)))
    .filter((r) => !q || fold(`${r.title} ${r.categoryName}`).includes(fold(q)))
    .slice(0, 40);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`${DAYS[slot.day]} · ${MEALS.find((m) => m.key === slot.meal)!.label}`} description="Bir tarif seç">
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tarif ara…" className="h-12 w-full rounded-2xl border border-line bg-cream pr-4 pl-10 focus:outline-none" aria-label="Tarif ara" />
        </div>
        {!q && (
          <button onClick={() => setAll((a) => !a)} className="mb-2 text-sm font-semibold text-olive">
            {all ? "Bu öğüne uygun olanları göster" : "Tüm tarifleri göster"}
          </button>
        )}
        <ul className="max-h-[52vh] space-y-1 overflow-y-auto">
          {list.map((r) => (
            <li key={r.id}>
              <button onClick={() => onPick(r.id)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-cream-200">
                <RecipeThumb title={r.title} imageUrl={r.imageUrl} color={r.coverColor} className="size-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="text-xs text-muted">
                    {r.categoryName} · {r.totalMinutes} dk{r.calories ? ` · ${Math.round(r.calories)} kcal` : ""}
                  </p>
                </div>
                <Plus className="size-5 text-olive" />
              </button>
            </li>
          ))}
          {!list.length && <li className="p-4 text-center text-sm text-muted">Eşleşen tarif yok.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
