import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IngredientForm, type IngredientFormInitial } from "@/components/admin/ingredient-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseList } from "@/lib/json";
import type { AllergenKey } from "@/lib/constants";

export const metadata = { title: "Malzeme düzenle" };

export default async function AdminIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const parents = await db.ingredient.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  let initial: IngredientFormInitial;
  if (id === "new") {
    initial = { name: "", slug: "", synonyms: [], aisle: "PRODUCE", defaultUnit: "g", kind: "plant", isBasic: false, parentId: "", density: "", kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, allergens: [], conversions: [] };
  } else {
    const i = await db.ingredient.findUnique({ where: { id }, include: { conversions: true } });
    if (!i) notFound();
    initial = {
      id: i.id, name: i.name, slug: i.slug, synonyms: parseList(i.synonyms), aisle: i.aisle as IngredientFormInitial["aisle"], defaultUnit: i.defaultUnit,
      kind: i.kind as IngredientFormInitial["kind"], isBasic: i.isBasic, parentId: i.parentId ?? "", density: i.density?.toString() ?? "",
      kcal: i.kcal, protein: i.protein, carbs: i.carbs, fat: i.fat, fiber: i.fiber, sugar: i.sugar, sodium: i.sodium,
      allergens: parseList(i.allergens) as AllergenKey[], conversions: i.conversions.map((c) => ({ unit: c.unit, grams: c.grams })),
    };
  }
  return (
    <div className="space-y-5">
      <Link href="/admin/ingredients" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-olive">
        <ChevronLeft className="size-4" /> Malzemeler
      </Link>
      <h1 className="text-3xl font-semibold">{initial.id ? initial.name : "Yeni malzeme"}</h1>
      <IngredientForm initial={initial} parents={parents} />
    </div>
  );
}
