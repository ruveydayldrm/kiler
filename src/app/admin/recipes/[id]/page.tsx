import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RecipeForm, type RecipeFormInitial } from "@/components/admin/recipe-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseList } from "@/lib/json";

export const metadata = { title: "Tarif düzenle" };

export default async function AdminRecipeEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [categories, cuisines, ingredients] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.cuisine.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.ingredient.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, defaultUnit: true } }),
  ]);

  let initial: RecipeFormInitial;
  if (id === "new") {
    initial = {
      title: "", description: "", categoryId: categories[0]!.id, cuisineId: cuisines[0]!.id, difficulty: "EASY", prepMinutes: 10, cookMinutes: 20, servings: 4,
      imageUrl: "", coverColor: "#8A9A5B", tags: [], tips: [], featured: false, published: true, nutritionManual: false, nutrition: {}, ingredients: [], steps: [{ text: "", durationMinutes: null }],
    };
  } else {
    const r = await db.recipe.findUnique({ where: { id }, include: { tags: true, ingredients: { orderBy: { sortOrder: "asc" } }, steps: { orderBy: { order: "asc" } } } });
    if (!r) notFound();
    initial = {
      id: r.id, title: r.title, description: r.description, categoryId: r.categoryId, cuisineId: r.cuisineId, difficulty: r.difficulty as RecipeFormInitial["difficulty"],
      prepMinutes: r.prepMinutes, cookMinutes: r.cookMinutes, servings: r.servings, imageUrl: r.imageUrl ?? "", coverColor: r.coverColor, tags: r.tags.map((t) => t.name),
      tips: parseList(r.tips), featured: r.featured, published: r.published, nutritionManual: r.nutritionManual,
      nutrition: { calories: r.calories ?? undefined, protein: r.protein ?? undefined, carbs: r.carbs ?? undefined, fat: r.fat ?? undefined, fiber: r.fiber ?? undefined, sugar: r.sugar ?? undefined, sodium: r.sodium ?? undefined },
      ingredients: r.ingredients.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit, note: i.note, optional: i.optional })),
      steps: r.steps.map((s) => ({ text: s.text, durationMinutes: s.durationMinutes })),
    };
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/recipes" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-olive">
        <ChevronLeft className="size-4" /> Tarifler
      </Link>
      <h1 className="text-3xl font-semibold">{initial.id ? initial.title : "Yeni tarif"}</h1>
      <RecipeForm initial={initial} categories={categories} cuisines={cuisines} ingredients={ingredients} />
    </div>
  );
}
