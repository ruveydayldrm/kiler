"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Checkbox, Field, FieldError, Input, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DietBadges } from "@/components/recipes/diet-badges";
import { TypographicCover } from "@/components/recipes/recipe-image";
import { saveRecipeAction } from "@/app/admin/actions";
import { ALLERGENS, DIETS, DIFFICULTIES, labelOf, type DietKey } from "@/lib/constants";
import { NUTRIENTS, type Nutrition } from "@/lib/nutrition";
import { UNIT_KEYS } from "@/lib/units";
import { api } from "@/lib/client-storage";
import type { RecipeFormInput } from "@/lib/validators";

export interface IngredientOption {
  id: string;
  name: string;
  defaultUnit: string;
}

type Line = { key: string; ingredientId: string; quantity: string; unit: string; note: string; optional: boolean };
type Step = { key: string; text: string; durationMinutes: string };

export interface RecipeFormInitial {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  cuisineId: string;
  difficulty: RecipeFormInput["difficulty"];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  imageUrl: string;
  coverColor: string;
  tags: string[];
  tips: string[];
  featured: boolean;
  published: boolean;
  nutritionManual: boolean;
  nutrition: Partial<Nutrition>;
  ingredients: { ingredientId: string; quantity: number | null; unit: string; note: string | null; optional: boolean }[];
  steps: { text: string; durationMinutes: number | null }[];
}

const k = () => Math.random().toString(36).slice(2);

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

export function RecipeForm({ initial, categories, cuisines, ingredients }: { initial: RecipeFormInitial; categories: { id: string; name: string }[]; cuisines: { id: string; name: string }[]; ingredients: IngredientOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({ ...initial, tagsText: initial.tags.join(", "), tipsText: initial.tips.join("\n") });
  const [lines, setLines] = useState<Line[]>(
    initial.ingredients.map((i) => ({ key: k(), ingredientId: i.ingredientId, quantity: i.quantity?.toString() ?? "", unit: i.unit, note: i.note ?? "", optional: i.optional })),
  );
  const [steps, setSteps] = useState<Step[]>(initial.steps.map((s) => ({ key: k(), text: s.text, durationMinutes: s.durationMinutes?.toString() ?? "" })));
  const [manual, setManual] = useState(initial.nutritionManual);
  const [override, setOverride] = useState<Record<string, string>>(Object.fromEntries(NUTRIENTS.map((n) => [n.key, initial.nutrition[n.key]?.toString() ?? ""])));
  const [preview, setPreview] = useState<{ perServing: Nutrition; unresolved: string[]; diets: Record<string, boolean>; allergens: string[] } | null>(null);
  const byName = new Map(ingredients.map((i) => [i.name.toLocaleLowerCase("tr-TR"), i]));
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  // Canlı besin / diyet / alerjen önizlemesi (malzemelerden otomatik)
  useEffect(() => {
    const valid = lines.filter((l) => l.ingredientId);
    if (!valid.length) return setPreview(null);
    const t = setTimeout(() => {
      api<NonNullable<typeof preview>>("/api/admin/nutrition-preview", {
        method: "POST",
        json: { servings: Number(f.servings) || 1, ingredients: valid.map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity ? Number(l.quantity.replace(",", ".")) : null, unit: l.unit, optional: l.optional })) },
      })
        .then(setPreview)
        .catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [lines, f.servings]);

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((p) => ({ ...p, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: f.title,
      description: f.description,
      categoryId: f.categoryId,
      cuisineId: f.cuisineId,
      difficulty: f.difficulty,
      prepMinutes: f.prepMinutes,
      cookMinutes: f.cookMinutes,
      servings: f.servings,
      imageUrl: f.imageUrl,
      coverColor: f.coverColor,
      tags: f.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      tips: f.tipsText.split("\n").map((t) => t.trim()).filter(Boolean),
      featured: f.featured,
      published: f.published,
      ingredients: lines.filter((l) => l.ingredientId).map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity ? l.quantity.replace(",", ".") : "", unit: l.unit, note: l.note, optional: l.optional })),
      steps: steps.filter((s) => s.text.trim()).map((s) => ({ text: s.text, durationMinutes: s.durationMinutes })),
      nutritionOverride: manual ? override : null,
    };
    start(async () => {
      const res = await saveRecipeAction(payload, initial.id);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        toast.error(res.message ?? "Kaydedilemedi.");
        return;
      }
      setErrors({});
      toast.success(res.message);
      if (!initial.id && res.id) router.push(`/admin/recipes/${res.id}`);
      else router.refresh();
    });
  };

  const dietKeys = preview ? (DIETS.filter((d) => preview.diets[{ vegetarian: "isVegetarian", vegan: "isVegan", "gluten-free": "isGlutenFree", "lactose-free": "isLactoseFree", "low-carb": "isLowCarb", "high-protein": "isHighProtein" }[d.key]]).map((d) => d.key) as DietKey[]) : [];

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Tarif adı" htmlFor="title" error={errors.title} className="sm:col-span-2">
            <Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} aria-invalid={!!errors.title} />
          </Field>
          <Field label="Açıklama" htmlFor="description" error={errors.description} className="sm:col-span-2">
            <Textarea id="description" value={f.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} />
          </Field>
          <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId}>
            <Select id="categoryId" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mutfak" htmlFor="cuisineId" error={errors.cuisineId}>
            <Select id="cuisineId" value={f.cuisineId} onChange={(e) => set("cuisineId", e.target.value)}>
              {cuisines.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Zorluk" htmlFor="difficulty">
            <Select id="difficulty" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value as RecipeFormInput["difficulty"])}>
              {DIFFICULTIES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Hazırlık (dk)" htmlFor="prep" error={errors.prepMinutes}>
              <Input id="prep" type="number" min={0} value={f.prepMinutes} onChange={(e) => set("prepMinutes", Number(e.target.value))} />
            </Field>
            <Field label="Pişirme (dk)" htmlFor="cook" error={errors.cookMinutes}>
              <Input id="cook" type="number" min={0} value={f.cookMinutes} onChange={(e) => set("cookMinutes", Number(e.target.value))} />
            </Field>
            <Field label="Porsiyon" htmlFor="servings" error={errors.servings}>
              <Input id="servings" type="number" min={1} value={f.servings} onChange={(e) => set("servings", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Görsel URL" htmlFor="imageUrl" error={errors.imageUrl} hint="Boş bırakılırsa kapak rengiyle tipografik kapak üretilir.">
            <Input id="imageUrl" value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://images.unsplash.com/…" />
          </Field>
          <Field label="Kapak rengi" htmlFor="coverColor" error={errors.coverColor}>
            <div className="flex gap-2">
              <input type="color" value={f.coverColor} onChange={(e) => set("coverColor", e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-line" aria-label="Kapak rengi seç" />
              <Input id="coverColor" value={f.coverColor} onChange={(e) => set("coverColor", e.target.value)} />
            </div>
          </Field>
          <Field label="Etiketler (virgülle)" htmlFor="tags" className="sm:col-span-2">
            <Input id="tags" value={f.tagsText} onChange={(e) => set("tagsText", e.target.value)} placeholder="pratik, tek tava, yaz" />
          </Field>
          <div className="flex gap-6 sm:col-span-2">
            <Checkbox label="Yayında" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
            <Checkbox label="Öne çıkan" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Malzemeler</h2>
            <Button type="button" size="sm" variant="soft" onClick={() => setLines([...lines, { key: k(), ingredientId: "", quantity: "", unit: "g", note: "", optional: false }])}>
              <Plus /> Malzeme ekle
            </Button>
          </div>
          <FieldError message={errors.ingredients} />
          <datalist id="admin-ingredients">
            {ingredients.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={l.key} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-cream/70 p-2 sm:grid-cols-[minmax(0,2fr)_80px_130px_minmax(0,1.4fr)_auto_auto]">
                <input
                  list="admin-ingredients"
                  defaultValue={byId.get(l.ingredientId)?.name ?? ""}
                  onChange={(e) => {
                    const hit = byName.get(e.target.value.toLocaleLowerCase("tr-TR"));
                    setLines(lines.map((x) => (x.key === l.key ? { ...x, ingredientId: hit?.id ?? "", unit: hit && !x.ingredientId ? hit.defaultUnit : x.unit } : x)));
                  }}
                  placeholder="Malzeme (listeden seç)"
                  className={`h-10 rounded-xl border bg-paper px-3 text-sm ${l.ingredientId ? "border-line" : "border-tomato/50"}`}
                  aria-label="Malzeme"
                />
                <div className="flex gap-1 sm:order-last">
                  <button type="button" onClick={() => setLines(move(lines, i, -1))} className="grid size-10 place-items-center rounded-full hover:bg-paper" aria-label="Yukarı taşı">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => setLines(move(lines, i, 1))} className="grid size-10 place-items-center rounded-full hover:bg-paper" aria-label="Aşağı taşı">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} className="grid size-10 place-items-center rounded-full text-tomato hover:bg-tomato-50" aria-label="Kaldır">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <input value={l.quantity} onChange={(e) => setLines(lines.map((x) => (x.key === l.key ? { ...x, quantity: e.target.value } : x)))} inputMode="decimal" placeholder="Miktar" className="h-10 rounded-xl border border-line bg-paper px-3 text-sm" aria-label="Miktar" />
                <select value={l.unit} onChange={(e) => setLines(lines.map((x) => (x.key === l.key ? { ...x, unit: e.target.value } : x)))} className="h-10 rounded-xl border border-line bg-paper px-2 text-sm" aria-label="Birim">
                  {[...new Set([...UNIT_KEYS, l.unit])].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
                <input value={l.note} onChange={(e) => setLines(lines.map((x) => (x.key === l.key ? { ...x, note: e.target.value } : x)))} placeholder="Not (ince doğranmış)" className="h-10 rounded-xl border border-line bg-paper px-3 text-sm" aria-label="Not" />
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={l.optional} onChange={(e) => setLines(lines.map((x) => (x.key === l.key ? { ...x, optional: e.target.checked } : x)))} /> opsiyonel
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Adımlar</h2>
            <Button type="button" size="sm" variant="soft" onClick={() => setSteps([...steps, { key: k(), text: "", durationMinutes: "" }])}>
              <Plus /> Adım ekle
            </Button>
          </div>
          <FieldError message={errors.steps} />
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={s.key} className="flex gap-2 rounded-2xl bg-cream/70 p-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-olive font-semibold text-paper">{i + 1}</span>
                <textarea value={s.text} onChange={(e) => setSteps(steps.map((x) => (x.key === s.key ? { ...x, text: e.target.value } : x)))} rows={2} className="min-h-10 flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm" aria-label={`${i + 1}. adım`} />
                <input value={s.durationMinutes} onChange={(e) => setSteps(steps.map((x) => (x.key === s.key ? { ...x, durationMinutes: e.target.value } : x)))} inputMode="numeric" placeholder="dk" className="h-10 w-16 rounded-xl border border-line bg-paper px-2 text-sm" aria-label="Süre (dakika)" />
                <div className="flex flex-col">
                  <button type="button" onClick={() => setSteps(move(steps, i, -1))} className="grid size-8 place-items-center rounded-full hover:bg-paper" aria-label="Yukarı">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => setSteps(move(steps, i, 1))} className="grid size-8 place-items-center rounded-full hover:bg-paper" aria-label="Aşağı">
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                <button type="button" onClick={() => setSteps(steps.filter((x) => x.key !== s.key))} className="grid size-10 place-items-center rounded-full text-tomato hover:bg-tomato-50" aria-label="Adımı sil">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <Field label="Püf noktaları (her satır bir ipucu)" htmlFor="tips" className="mt-4">
            <Textarea id="tips" value={f.tipsText} onChange={(e) => set("tipsText", e.target.value)} />
          </Field>
        </Card>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl">
          {f.imageUrl ? <img src={f.imageUrl} alt="" className="h-full w-full object-cover" /> : <TypographicCover title={f.title || "Tarif adı"} color={f.coverColor} label="Önizleme" />}
        </div>
        <Card className="p-4">
          <h3 className="mb-2 font-sans text-sm font-bold">Besin değerleri (porsiyon başı)</h3>
          {preview ? (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {NUTRIENTS.map((n) => (
                  <div key={n.key} className="flex justify-between">
                    <dt className="text-muted">{n.label}</dt>
                    <dd className="font-semibold tabular-nums">
                      {preview.perServing[n.key]} {n.unit}
                    </dd>
                  </div>
                ))}
              </dl>
              {preview.unresolved.length > 0 && <p className="mt-2 text-xs text-tomato-600">Gram karşılığı bulunamadı: {preview.unresolved.join(", ")} — malzemeye birim dönüşümü ekleyin.</p>}
              <div className="mt-3 space-y-2">
                <DietBadges diets={dietKeys} max={6} />
                {preview.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {preview.allergens.map((a) => (
                      <Badge key={a} tone="tomato" size="sm">
                        {labelOf(ALLERGENS, a)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">Malzemelerden otomatik hesaplanır; diyet ve alerjenler de otomatik çıkarılır.</p>
            </>
          ) : (
            <p className="text-sm text-muted">Malzeme ekledikçe hesaplanır.</p>
          )}
          <Checkbox className="mt-3" label="Besin değerlerini elle düzelt" checked={manual} onChange={(e) => setManual(e.target.checked)} />
          {manual && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {NUTRIENTS.map((n) => (
                <label key={n.key} className="text-xs text-muted">
                  {n.label} ({n.unit})
                  <input value={override[n.key]} onChange={(e) => setOverride({ ...override, [n.key]: e.target.value })} inputMode="decimal" placeholder={preview ? String(preview.perServing[n.key]) : ""} className="mt-0.5 h-9 w-full rounded-lg border border-line bg-paper px-2 text-sm text-ink" />
                </label>
              ))}
            </div>
          )}
        </Card>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {initial.id ? "Değişiklikleri kaydet" : "Tarifi oluştur"}
        </Button>
      </aside>
    </form>
  );
}
