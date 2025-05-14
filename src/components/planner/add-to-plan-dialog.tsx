"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper, ToggleChip } from "@/components/ui/misc";
import { useUser } from "@/components/providers/user-provider";
import { DAYS, DAYS_SHORT, MEALS, type MealKey } from "@/lib/constants";
import { api } from "@/lib/client-storage";
import { addDays, isoDate, startOfWeek } from "@/lib/utils";

export function AddToPlanDialog({
  recipe,
  open,
  onOpenChange,
  defaultMeal = "DINNER",
  defaultServings = 2,
}: {
  recipe: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultMeal?: MealKey;
  defaultServings?: number;
}) {
  const user = useUser();
  const router = useRouter();
  const today = (new Date().getDay() + 6) % 7;
  const [week, setWeek] = useState<0 | 1>(0);
  const [day, setDay] = useState(today);
  const [meal, setMeal] = useState<MealKey>(defaultMeal);
  const [servings, setServings] = useState(defaultServings);
  const [saving, setSaving] = useState(false);

  if (!recipe) return null;

  const save = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSaving(true);
    try {
      const weekStart = isoDate(addDays(startOfWeek(), week * 7));
      await api("/api/planner", { method: "POST", json: { weekStart, day, meal, recipeId: recipe.id, servings } });
      const mealLabel = MEALS.find((m) => m.key === meal)!.label.toLocaleLowerCase("tr-TR");
      toast.success(`${DAYS[day]} ${mealLabel}${meal === "SNACK" ? "" : " yemeği"} planına eklendi.`, {
        action: { label: "Plana git", onClick: () => router.push(`/planner?week=${weekStart}`) },
      });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Plana ekle" description={recipe.title}>
        {!user ? (
          <div className="space-y-4">
            <p className="text-ink-soft">Haftalık planını kaydedebilmek için giriş yapman gerekiyor.</p>
            <Button className="w-full" onClick={save}>
              Giriş yap
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-2">
              <ToggleChip active={week === 0} onClick={() => setWeek(0)}>
                Bu hafta
              </ToggleChip>
              <ToggleChip active={week === 1} onClick={() => setWeek(1)}>
                Gelecek hafta
              </ToggleChip>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">Gün</p>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_SHORT.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(i)}
                    aria-pressed={day === i}
                    aria-label={DAYS[i]}
                    className={`h-12 rounded-xl text-sm font-semibold transition ${day === i ? "bg-olive text-paper" : "bg-cream-200 text-ink-soft hover:bg-olive-50"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">Öğün</p>
              <div className="flex flex-wrap gap-2">
                {MEALS.map((m) => (
                  <ToggleChip key={m.key} active={meal === m.key} onClick={() => setMeal(m.key)}>
                    {m.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-soft">Porsiyon</p>
              <Stepper value={servings} onChange={setServings} label="Porsiyon" suffix="kişilik" max={20} />
            </div>
            <Button className="w-full" size="lg" onClick={save} loading={saving}>
              {DAYS[day]} · {MEALS.find((m) => m.key === meal)!.label} olarak ekle
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
