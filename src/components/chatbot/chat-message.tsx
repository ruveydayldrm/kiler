"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Clock, Flame, Info, ListPlus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { AddToPlanDialog } from "@/components/planner/add-to-plan-dialog";
import { useShopping } from "@/components/providers/shopping-provider";
import { DAYS_SHORT, MEALS, labelOf } from "@/lib/constants";
import { api } from "@/lib/client-storage";
import { cn, formatMinutes } from "@/lib/utils";
import type { ChatAction, ChatRecipeCard, ChatResponse } from "@/types/ai";

function MiniRecipeCard({ card, onPlan, onAddMissing }: { card: ChatRecipeCard; onPlan: () => void; onAddMissing: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <Link href={`/recipes/${card.slug}`} className="flex gap-3 p-2.5 transition hover:bg-cream-200/60">
        <RecipeThumb title={card.title} imageUrl={card.imageUrl} color={card.coverColor} className="size-16 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-serif leading-snug font-semibold">{card.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatMinutes(card.totalMinutes)}
            </span>
            {card.calories != null && (
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3" />
                {Math.round(card.calories)} kcal
              </span>
            )}
          </p>
          {card.matchPercent != null && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300">
                <div className={cn("h-full rounded-full", card.matchPercent === 100 ? "bg-olive" : "bg-saffron")} style={{ width: `${card.matchPercent}%` }} />
              </div>
              <span className="text-xs font-bold text-olive">
                %{card.matchPercent} · {card.matched}/{card.required}
              </span>
            </div>
          )}
        </div>
      </Link>
      {!!card.missing?.length && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          <span className="text-[11px] text-muted">Eksik:</span>
          {card.missing.map((m) => (
            <span key={m.slug} className="rounded-full bg-tomato-50 px-2 py-0.5 text-[11px] font-semibold text-tomato-600">
              {m.name}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 border-t border-line text-xs font-semibold">
        <Link href={`/recipes/${card.slug}`} className="flex h-10 items-center justify-center gap-1 text-ink-soft hover:bg-cream-200">
          <ArrowUpRight className="size-3.5" /> Tarifi Gör
        </Link>
        <button
          onClick={async () => {
            setBusy(true);
            await onAddMissing();
            setBusy(false);
          }}
          disabled={busy}
          className="flex h-10 items-center justify-center gap-1 border-x border-line text-olive hover:bg-olive-50 disabled:opacity-60"
        >
          <ListPlus className="size-3.5" /> {card.missing?.length ? "Eksikleri ekle" : "Listeye ekle"}
        </button>
        <button onClick={onPlan} className="flex h-10 items-center justify-center gap-1 text-ink-soft hover:bg-cream-200">
          <CalendarPlus className="size-3.5" /> Plana Ekle
        </button>
      </div>
    </div>
  );
}

export function AssistantMessage({ response }: { response: ChatResponse }) {
  const shopping = useShopping();
  const router = useRouter();
  const [planTarget, setPlanTarget] = useState<{ id: string; title: string } | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);

  const run = async (action: ChatAction, idx: number) => {
    setBusy(idx);
    try {
      switch (action.type) {
        case "add-missing":
          await shopping.addRecipe(action.payload.recipeId, { servings: action.payload.servings, onlyMissing: true });
          break;
        case "add-items":
          await shopping.addItems(action.payload.items);
          break;
        case "add-to-plan": {
          const card = response.recipes.find((r) => r.id === action.payload.recipeId);
          setPlanTarget({ id: action.payload.recipeId, title: card?.title ?? "Tarif" });
          setBusy(null);
          return;
        }
        case "save-plan": {
          const res = await api<{ saved: number }>("/api/planner/save", { method: "POST", json: { ...action.payload, replace: true } });
          toast.success(`Plan kaydedildi (${res.saved} öğün).`, { action: { label: "Plana git", onClick: () => router.push(`/planner?week=${action.payload.weekStart}`) } });
          break;
        }
        case "open":
          router.push(action.payload.href);
          break;
      }
      setDone((d) => new Set(d).add(idx));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="leading-relaxed whitespace-pre-line">{response.message}</p>

      {response.list && (
        <div className="rounded-2xl bg-cream-200/70 p-3.5">
          <p className="mb-2 text-sm font-bold">{response.list.title}</p>
          <ul className="space-y-1 text-sm text-ink-soft">
            {response.list.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sage" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response.plan && (
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {response.plan.days.map((d) => (
            <div key={d.day} className="flex gap-3 border-b border-line px-3 py-2 last:border-0">
              <div className="w-10 shrink-0">
                <p className="text-sm font-bold">{DAYS_SHORT[d.day]}</p>
                <p className="text-[10px] text-muted">{d.calories} kcal</p>
              </div>
              <ul className="min-w-0 flex-1 space-y-0.5 text-xs">
                {d.meals.map((m) => (
                  <li key={m.meal} className="truncate">
                    <span className="text-muted">{labelOf(MEALS, m.meal)}:</span> {m.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {response.plan.notes.length > 0 && (
            <div className="bg-sage-100/60 px-3 py-2 text-xs text-[#4f5c2c]">♻️ {response.plan.notes.slice(0, 2).join(" ")}</div>
          )}
        </div>
      )}

      {response.recipes.length > 0 && (
        <div className="space-y-2">
          {response.recipes.map((card) => (
            <MiniRecipeCard key={card.id} card={card} onPlan={() => setPlanTarget({ id: card.id, title: card.title })} onAddMissing={async () => void (await shopping.addRecipe(card.id, { onlyMissing: true }))} />
          ))}
        </div>
      )}

      {response.actions.filter((a) => a.type === "save-plan" || a.type === "add-items" || a.type === "open").length > 0 && (
        <div className="flex flex-wrap gap-2">
          {response.actions.map((a, i) =>
            a.type === "save-plan" || a.type === "add-items" || a.type === "open" ? (
              <button
                key={i}
                onClick={() => run(a, i)}
                disabled={busy === i || done.has(i)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition disabled:opacity-70",
                  done.has(i) ? "bg-olive-50 text-olive" : "bg-olive text-paper hover:bg-olive-600",
                )}
              >
                {done.has(i) ? <Check className="size-4" /> : null}
                {done.has(i) ? "Tamamlandı" : a.label}
              </button>
            ) : null,
          )}
        </div>
      )}

      {response.notice && (
        <p className="flex gap-2 rounded-xl bg-saffron-50 px-3 py-2 text-xs leading-relaxed text-[#7a5210]">
          <Info className="mt-0.5 size-3.5 shrink-0" /> {response.notice}
        </p>
      )}

      <AddToPlanDialog recipe={planTarget} open={!!planTarget} onOpenChange={(o) => !o && setPlanTarget(null)} />
    </div>
  );
}
