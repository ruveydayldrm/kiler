"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, ToggleChip } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { deleteIngredientAction, saveIngredientAction } from "@/app/admin/actions";
import { AISLES, ALLERGENS, INGREDIENT_KINDS, type AllergenKey } from "@/lib/constants";
import { UNIT_KEYS } from "@/lib/units";
import type { IngredientFormInput } from "@/lib/validators";

const KIND_LABELS: Record<string, string> = { plant: "Bitkisel", dairy: "Süt ürünü", egg: "Yumurta", meat: "Et / tavuk", fish: "Balık / deniz ürünü", honey: "Bal" };

export type IngredientFormInitial = Omit<IngredientFormInput, "density"> & { id?: string; density: string };

export function IngredientForm({ initial, parents }: { initial: IngredientFormInitial; parents: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ ...initial, synonymsText: initial.synonyms.join(", ") });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const num = (k: "kcal" | "protein" | "carbs" | "fat" | "fiber" | "sugar" | "sodium", label: string) => (
    <Field label={label} htmlFor={k} error={errors[k]}>
      <Input id={k} inputMode="decimal" value={String(f[k])} onChange={(e) => set(k, e.target.value as unknown as number)} />
    </Field>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...f, synonyms: f.synonymsText.split(",").map((s) => s.trim()).filter(Boolean) };
    start(async () => {
      const res = await saveIngredientAction(payload, initial.id);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        toast.error(res.message ?? "Kaydedilemedi.");
        return;
      }
      setErrors({});
      toast.success(res.message);
      if (!initial.id && res.id) router.push(`/admin/ingredients/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Malzeme adı" htmlFor="name" error={errors.name}>
          <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Kısa ad (slug)" htmlFor="slug" error={errors.slug} hint="Boş bırakılırsa addan üretilir.">
          <Input id="slug" value={f.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Eş anlamlılar (virgülle)" htmlFor="syn" className="sm:col-span-2" hint="Aramada eşleşir: ör. kıyma → çekilmiş et">
          <Input id="syn" value={f.synonymsText} onChange={(e) => set("synonymsText", e.target.value)} />
        </Field>
        <Field label="Reyon" htmlFor="aisle">
          <Select id="aisle" value={f.aisle} onChange={(e) => set("aisle", e.target.value as typeof f.aisle)}>
            {AISLES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tür" htmlFor="kind" hint="Vegan / vejetaryen tespiti için">
          <Select id="kind" value={f.kind} onChange={(e) => set("kind", e.target.value as typeof f.kind)}>
            {INGREDIENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Üst tür" htmlFor="parent" hint="ör. Kaşar → Peynir">
          <Select id="parent" value={f.parentId ?? ""} onChange={(e) => set("parentId", e.target.value)}>
            <option value="">— Yok —</option>
            {parents.filter((p) => p.id !== initial.id).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Varsayılan birim" htmlFor="unit">
          <Select id="unit" value={f.defaultUnit} onChange={(e) => set("defaultUnit", e.target.value)}>
            {UNIT_KEYS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </Select>
        </Field>
        <Field label="Yoğunluk (g/ml)" htmlFor="density" error={errors.density} hint="Sıvılar için; hacim → gram dönüşümü">
          <Input id="density" inputMode="decimal" value={f.density} onChange={(e) => set("density", e.target.value)} />
        </Field>
        <Checkbox label="Temel malzeme (tuz, su… eşleşmeye dahil edilmez)" checked={f.isBasic} onChange={(e) => set("isBasic", e.target.checked)} className="self-end" />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-xl font-semibold">100 g başına besin değerleri</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num("kcal", "Kalori (kcal)")}
          {num("protein", "Protein (g)")}
          {num("carbs", "Karbonhidrat (g)")}
          {num("fat", "Yağ (g)")}
          {num("fiber", "Lif (g)")}
          {num("sugar", "Şeker (g)")}
          {num("sodium", "Sodyum (mg)")}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-xl font-semibold">Alerjenler</h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <ToggleChip key={a.key} active={f.allergens.includes(a.key)} onClick={() => set("allergens", f.allergens.includes(a.key) ? f.allergens.filter((x) => x !== a.key) : [...f.allergens, a.key as AllergenKey])}>
              {a.label}
            </ToggleChip>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Birim dönüşümleri</h2>
          <Button type="button" size="sm" variant="soft" onClick={() => set("conversions", [...f.conversions, { unit: "su bardağı", grams: 100 }])}>
            <Plus /> Ekle
          </Button>
        </div>
        <ul className="space-y-2">
          {f.conversions.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted">1</span>
              <Select value={c.unit} onChange={(e) => set("conversions", f.conversions.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} className="w-44" aria-label="Birim">
                {[...new Set([...UNIT_KEYS, c.unit])].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
              <span className="text-sm text-muted">=</span>
              <Input inputMode="decimal" value={String(c.grams)} onChange={(e) => set("conversions", f.conversions.map((x, j) => (j === i ? { ...x, grams: e.target.value as unknown as number } : x)))} className="w-28" aria-label="Gram" />
              <span className="text-sm text-muted">g</span>
              <button type="button" onClick={() => set("conversions", f.conversions.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-full text-tomato hover:bg-tomato-50" aria-label="Kaldır">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {!f.conversions.length && <li className="text-sm text-muted">Dönüşüm yok — kütle birimleri doğrudan, hacim birimleri yoğunlukla hesaplanır.</li>}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={pending}>
          {initial.id ? "Kaydet" : "Malzemeyi ekle"}
        </Button>
        {initial.id && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={() => {
              if (!confirm("Malzeme silinsin mi?")) return;
              start(async () => {
                const res = await deleteIngredientAction(initial.id!);
                if (res.ok) {
                  toast.success(res.message);
                  router.push("/admin/ingredients");
                } else toast.error(res.message);
              });
            }}
          >
            <Trash2 /> Sil
          </Button>
        )}
      </div>
    </form>
  );
}
