import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { EmptyState } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getIndexMap } from "@/lib/recipes";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/account/favorites");
  const [favs, index] = await Promise.all([db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { recipeId: true } }), getIndexMap()]);
  const recipes = favs.flatMap((f) => (index.has(f.recipeId) ? [index.get(f.recipeId)!] : []));
  if (!recipes.length) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Henüz favorin yok"
        description="Beğendiğin tariflerdeki kalp ikonuna dokun; hepsi burada toplansın."
        action={
          <Link href="/recipes" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
            Tariflere göz at
          </Link>
        }
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} />
      ))}
    </div>
  );
}
