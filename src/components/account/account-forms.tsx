"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Field, Input, Select } from "@/components/ui/form";
import { IngredientInput } from "@/components/pantry/ingredient-picker";
import { useFormAction } from "@/hooks/use-form-action";
import { updatePreferencesAction, updateProfileAction } from "@/app/account/actions";
import { ALLERGENS, DIETS, SKILL_LEVELS } from "@/lib/constants";
import type { UserKitchen } from "@/lib/recipes";
import { cn } from "@/lib/utils";

function useToastOnSuccess(state: { ok?: boolean; message?: string }) {
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { state, onSubmit, pending } = useFormAction(updateProfileAction);
  useToastOnSuccess(state);
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Adın" htmlFor="name" error={state.errors?.name}>
        <Input id="name" name="name" defaultValue={state.values?.name ?? name} aria-invalid={!!state.errors?.name} />
      </Field>
      <Field label="E-posta" htmlFor="email" hint="E-posta adresi değiştirilemez.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}

function CheckPill({ name, value, label, defaultChecked, tone = "olive" }: { name: string; value: string; label: string; defaultChecked: boolean; tone?: "olive" | "tomato" }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition select-none",
        on ? (tone === "olive" ? "border-olive bg-olive text-paper" : "border-tomato bg-tomato text-paper") : "border-line bg-paper text-ink-soft hover:border-olive/50",
      )}
    >
      <input type="checkbox" name={name} value={value} checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

export function PreferencesForm({ kitchen, welcome }: { kitchen: UserKitchen; welcome?: boolean }) {
  const { state, onSubmit, pending } = useFormAction(updatePreferencesAction);
  const [disliked, setDisliked] = useState(kitchen.dislikedIngredients);
  const [always, setAlways] = useState(kitchen.alwaysHave);
  useToastOnSuccess(state);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {welcome && (
        <div className="rounded-[var(--radius-card)] bg-saffron-50 p-5">
          <p className="font-serif text-xl font-semibold">Hoş geldin! 🎉</p>
          <p className="mt-1 text-ink-soft">Birkaç tercihle önerilerini sana özel hale getirelim. Alerjilerin hiçbir öneride yer almaz.</p>
        </div>
      )}
      <Card className="space-y-4 p-5">
        <h2 className="text-xl font-semibold">Diyet tipi</h2>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <CheckPill key={d.key} name="diets" value={d.key} label={d.label} defaultChecked={kitchen.diets.includes(d.key)} />
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold">Alerjiler ve sevmediklerim</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-olive">
            <ShieldCheck className="size-4" /> Bunlar öneri, arama ve AI yanıtlarında kesin olarak hariç tutulur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <CheckPill key={a.key} name="allergens" value={a.key} label={a.label} defaultChecked={kitchen.allergens.includes(a.key)} tone="tomato" />
          ))}
        </div>
        <Field label="Sevmediğim malzemeler" hint="Üst türü seçersen alt türleri de hariç tutulur (ör. “peynir” → kaşar, beyaz peynir…).">
          <IngredientInput value={disliked} onChange={setDisliked} placeholder="ör. bamya, mantar" />
          <input type="hidden" name="dislikedIngredients" value={disliked.join(",")} />
        </Field>
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        <Field label="Günlük kalori hedefi (kcal)" htmlFor="calorieTarget" error={state.errors?.calorieTarget}>
          <Input id="calorieTarget" name="calorieTarget" inputMode="numeric" defaultValue={state.values?.calorieTarget ?? kitchen.calorieTarget} aria-invalid={!!state.errors?.calorieTarget} />
        </Field>
        <Field label="Hane kişi sayısı" htmlFor="householdSize" error={state.errors?.householdSize} hint="Varsayılan porsiyon">
          <Input id="householdSize" name="householdSize" type="number" min={1} max={12} defaultValue={state.values?.householdSize ?? kitchen.householdSize} />
        </Field>
        <Field label="Mutfak becerim" htmlFor="skillLevel">
          <Select id="skillLevel" name="skillLevel" defaultValue={kitchen.skillLevel}>
            {SKILL_LEVELS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold">Evde hep olanlar</h2>
        <p className="text-sm text-muted">Eşleşme oranına dahil edilmez ve alışveriş listesine eklenmez.</p>
        <IngredientInput value={always} onChange={setAlways} placeholder="ör. tuz, karabiber, un" />
        <input type="hidden" name="alwaysHave" value={always.join(",")} />
      </Card>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <Button type="submit" size="lg" loading={pending} className="shadow-lift">
          Tercihleri kaydet
        </Button>
      </div>
    </form>
  );
}
