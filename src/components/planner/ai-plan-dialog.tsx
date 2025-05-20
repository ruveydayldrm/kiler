"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Stepper, ToggleChip } from "@/components/ui/misc";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { DAYS, DIETS, MEALS, type DietKey, type MealKey } from "@/lib/constants";
import { api } from "@/lib/client-storage";
import { cn } from "@/lib/utils";
import type { PlanData } from "./planner-board";

interface Preview {
  weekStart: string;
  mode: "openai" | "demo";
  summary: string;
  notes: string[];
  dailyCalories: number[];
  entries: { day: number; meal: MealKey; recipeId: string; servings: number; recipe: { id: string; title: string; imageUrl: string | null; coverColor: string; calories: number | null } }[];
}

export function AiPlanDialog({
  open,
  onOpenChange,
  weekStart,
  defaults,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weekStart: string;
  defaults: { calorieTarget: number; diets: DietKey[]; householdSize: number };
  onSaved: (plan: PlanData) => void;
}) {
  const [calorieTarget, setCalorieTarget] = useState(String(defaults.calorieTarget));
  const [diets, setDiets] = useState<DietKey[]>(defaults.diets);
  const [budget, setBudget] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState<number | undefined>(45);
  const [servings, setServings] = useState(defaults.householdSize);
  const [meals, setMeals] = useState<MealKey[]>(["BREAKFAST", "LUNCH", "DINNER"]);
  const [noRepeat, setNoRepeat] = useState(true);
  const [useLeftovers, setUseLeftovers] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const generate = async () => {
    const target = Number(calorieTarget);
    if (!Number.isFinite(target) || target < 1000 || target > 5000) return setError("Kalori hedefi 1000–5000 arasında olmalı.");
    if (!meals.length) return setError("En az bir öğün seç.");
    setError(undefined);
    setLoading(true);
    try {
      setPreview(await api<Preview>("/api/planner/ai", { method: "POST", json: { weekStart, calorieTarget: target, diets, budget, maxMinutes, servings, meals, noRepeat, useLeftovers } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const plan = await api<PlanData & { saved: number }>("/api/planner/save", {
        method: "POST",
        json: { weekStart, replace: true, entries: preview.entries.map(({ day, meal, recipeId, servings: s }) => ({ day, meal, recipeId, servings: s })) },
      });
      toast.success(`Haftan hazır! ${plan.saved} öğün planına kaydedildi.`);
      onSaved(plan);
      onOpenChange(false);
      setPreview(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={preview ? "Plan önizlemesi" : "AI ile haftamı planla"} description={preview ? "Beğendiysen onayla; mevcut haftanın yerine kaydedilir." : "Tercihlerini söyle; yalnızca arşivimizdeki tariflerden bir hafta önerelim."} className="sm:w-[min(720px,calc(100vw-2rem))]">
        {!preview ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Günlük kalori hedefi" htmlFor="ai-cal" error={error}>
                <Input id="ai-cal" inputMode="numeric" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink-soft">Kaç kişilik?</p>
                <Stepper value={servings} onChange={setServings} label="Kişi sayısı" suffix="kişi" max={12} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">Diyet</p>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <ToggleChip key={d.key} active={diets.includes(d.key)} onClick={() => setDiets(toggle(diets, d.key))}>
                    {d.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">Öğünler</p>
              <div className="flex flex-wrap gap-2">
                {MEALS.map((m) => (
                  <ToggleChip key={m.key} active={meals.includes(m.key)} onClick={() => setMeals(toggle(meals, m.key))}>
                    {m.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">En fazla pişirme süresi</p>
              <div className="flex flex-wrap gap-2">
                {[20, 30, 45, 60].map((m) => (
                  <ToggleChip key={m} active={maxMinutes === m} onClick={() => setMaxMinutes(maxMinutes === m ? undefined : m)}>
                    {m} dk
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <Checkbox label="Bütçe dostu olsun" checked={budget} onChange={(e) => setBudget(e.target.checked)} />
              <Checkbox label="Aynı tarifi tekrar etme" checked={noRepeat} onChange={(e) => setNoRepeat(e.target.checked)} />
              <Checkbox label="Artan malzemeleri değerlendir" checked={useLeftovers} onChange={(e) => setUseLeftovers(e.target.checked)} />
            </div>
            <Button size="lg" variant="accent" className="w-full" onClick={generate} loading={loading}>
              <Sparkles /> Planı hazırla
            </Button>
            <p className="text-center text-xs text-muted">Alerjilerin ve sevmediğin malzemeler hiçbir öneride yer almaz. Tıbbi diyet planı değildir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-2xl bg-olive-50 p-3 text-sm text-olive">
              <Sparkles className="mr-1 inline size-4" /> {preview.summary}
            </p>
            {preview.notes.length > 0 && (
              <ul className="space-y-1 rounded-2xl bg-sage-100/60 p-3 text-xs text-[#4f5c2c]">
                {preview.notes.map((n) => (
                  <li key={n}>♻️ {n}</li>
                ))}
              </ul>
            )}
            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {DAYS.map((d, day) => {
                const items = preview.entries.filter((e) => e.day === day);
                return (
                  <div key={d} className="rounded-2xl border border-line bg-paper p-3">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold">{d}</span>
                      <span className={cn("tabular-nums", Math.abs(preview.dailyCalories[day]! - Number(calorieTarget)) > Number(calorieTarget) * 0.2 ? "text-[#a26a12]" : "text-olive")}>
                        {preview.dailyCalories[day]} kcal
                      </span>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.map((e) => (
                        <li key={`${e.day}-${e.meal}`} className="flex items-center gap-2">
                          <RecipeThumb title={e.recipe.title} imageUrl={e.recipe.imageUrl} color={e.recipe.coverColor} className="size-10 rounded-lg" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted">{MEALS.find((m) => m.key === e.meal)!.label}</p>
                            <p className="truncate text-sm font-medium">{e.recipe.title}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Tercihleri değiştir
              </Button>
              <Button onClick={save} loading={saving}>
                <Check /> Onayla ve kaydet
              </Button>
            </div>
            <p className="text-center text-xs text-muted">{preview.mode === "openai" ? "Plan yapay zekâ ile oluşturuldu ve sunucuda doğrulandı." : "Demo mod: plan kural tabanlı algoritmayla oluşturuldu."}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
