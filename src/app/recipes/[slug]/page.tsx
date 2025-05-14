import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, ChevronRight, Clock, CookingPot, Flame, TriangleAlert, Users } from "lucide-react";
import { RecipeCover } from "@/components/recipes/recipe-image";
import { DietBadges } from "@/components/recipes/diet-badges";
import { IngredientsPanel } from "@/components/recipes/ingredients-panel";
import { StepsSection } from "@/components/recipes/steps-section";
import { RecipeActions, RecipeAssistantBridge } from "@/components/recipes/recipe-actions";
import { ReviewsSection } from "@/components/recipes/reviews-section";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth";
import { dietsOf, getRecipeDetail, getUserKitchen, getVisibleRecipes } from "@/lib/recipes";
import { similarRecipes } from "@/lib/recommendations";
import { parseList } from "@/lib/json";
import { ALLERGENS, DIFFICULTIES, labelOf, SITE_NAME } from "@/lib/constants";
import { NUTRIENTS, dailyPercent } from "@/lib/nutrition";
import { formatAmount } from "@/lib/units";
import { formatMinutes, formatNumber, siteUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

// loading.tsx akışı olmayan sayfaların 200 dönmesine yol açabildiği için generateMetadata'da da notFound() çağrılır.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeDetail(slug);
  if (!recipe) notFound();
  const description = `${recipe.description} ${recipe.totalMinutes} dakikada, ${recipe.servings} kişilik${recipe.calories ? `, porsiyonu ${Math.round(recipe.calories)} kcal` : ""}.`;
  return {
    title: `${recipe.title} Tarifi`,
    description,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      type: "article",
      title: `${recipe.title} Tarifi | ${SITE_NAME}`,
      description,
      url: `/recipes/${recipe.slug}`,
      ...(recipe.imageUrl ? { images: [{ url: recipe.imageUrl, width: 1200, height: 800, alt: recipe.title }] } : {}),
    },
  };
}

const iso = (min: number) => `PT${Math.floor(min / 60) ? `${Math.floor(min / 60)}H` : ""}${min % 60 ? `${min % 60}M` : min === 0 ? "0M" : ""}`;

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeDetail(slug);
  if (!recipe) notFound();

  const user = await getCurrentUser();
  const [kitchen, { visible }] = await Promise.all([getUserKitchen(user?.id), getVisibleRecipes(user?.id)]);
  const allergens = parseList(recipe.allergens);
  const tips = parseList(recipe.tips);
  const diets = dietsOf(recipe);
  const conflicts = allergens.filter((a) => kitchen.allergens.includes(a as never));
  const disliked = recipe.ingredients.filter((i) => kitchen.dislikedIngredients.includes(i.ingredient.slug)).map((i) => i.ingredient.name);
  const indexItem = visible.find((r) => r.id === recipe.id);
  const similar = indexItem ? similarRecipes(indexItem, visible, 4) : visible.filter((r) => r.categorySlug === recipe.category.slug && r.id !== recipe.id).slice(0, 4);

  const ingredients = recipe.ingredients.map((i) => ({
    id: i.id,
    slug: i.ingredient.slug,
    name: i.ingredient.name,
    quantity: i.quantity,
    unit: i.unit,
    note: i.note,
    optional: i.optional,
    density: i.ingredient.density,
    conversions: Object.fromEntries(i.ingredient.conversions.map((c) => [c.unit, c.grams])),
  }));
  const steps = recipe.steps.map((s) => ({ id: s.id, order: s.order, text: s.text, durationMinutes: s.durationMinutes }));
  const reviews = recipe.reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, photoUrl: r.photoUrl, createdAt: r.createdAt.toISOString(), userName: r.user.name ?? "Kiler kullanıcısı" }));

  // schema.org/Recipe — Google tarif kartları için
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    ...(recipe.imageUrl ? { image: [recipe.imageUrl] } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    datePublished: recipe.createdAt.toISOString().slice(0, 10),
    prepTime: iso(recipe.prepMinutes),
    cookTime: iso(recipe.cookMinutes),
    totalTime: iso(recipe.totalMinutes),
    recipeYield: `${recipe.servings} porsiyon`,
    recipeCategory: recipe.category.name,
    recipeCuisine: recipe.cuisine.name,
    keywords: recipe.tags.map((t) => t.name).join(", "),
    recipeIngredient: recipe.ingredients.map((i) => `${formatAmount(i.quantity, i.unit)} ${i.ingredient.name}${i.note ? `, ${i.note}` : ""}`.trim()),
    recipeInstructions: recipe.steps.map((s) => ({ "@type": "HowToStep", position: s.order, text: s.text })),
    ...(recipe.calories != null
      ? {
          nutrition: {
            "@type": "NutritionInformation",
            servingSize: "1 porsiyon",
            calories: `${Math.round(recipe.calories)} kcal`,
            proteinContent: `${recipe.protein} g`,
            carbohydrateContent: `${recipe.carbs} g`,
            fatContent: `${recipe.fat} g`,
            fiberContent: `${recipe.fiber} g`,
            sugarContent: `${recipe.sugar} g`,
            sodiumContent: `${recipe.sodium} mg`,
          },
        }
      : {}),
    ...(recipe.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: recipe.ratingAvg, ratingCount: recipe.ratingCount, bestRating: 5, worstRating: 1 } } : {}),
    url: siteUrl(`/recipes/${recipe.slug}`),
  };

  return (
    <article className="pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <RecipeAssistantBridge recipe={{ id: recipe.id, title: recipe.title }} />

      <div className="container-page pt-5">
        <nav aria-label="Konum" className="no-print mb-5 flex items-center gap-1 text-sm text-muted">
          <Link href="/recipes" className="hover:text-olive">
            Tarifler
          </Link>
          <ChevronRight className="size-4" />
          <Link href={`/recipes?category=${recipe.category.slug}`} className="hover:text-olive">
            {recipe.category.name}
          </Link>
          <ChevronRight className="size-4" />
          <span className="truncate text-ink-soft">{recipe.title}</span>
        </nav>

        <header className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <RecipeCover
            title={recipe.title}
            imageUrl={recipe.imageUrl}
            color={recipe.coverColor}
            label={recipe.category.name}
            priority
            className="aspect-[4/3] rounded-[28px] shadow-lift lg:aspect-[5/4]"
          />
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="tomato">{recipe.category.name}</Badge>
              <Badge tone="neutral">{recipe.cuisine.name} mutfağı</Badge>
              <Rating value={recipe.ratingAvg} count={recipe.ratingCount} size="md" className="ml-1" />
            </div>
            <h1 className="text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl">{recipe.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{recipe.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: "Hazırlık", value: formatMinutes(recipe.prepMinutes) },
                { icon: CookingPot, label: "Pişirme", value: formatMinutes(recipe.cookMinutes) },
                { icon: ChefHat, label: "Zorluk", value: labelOf(DIFFICULTIES, recipe.difficulty) },
                { icon: Users, label: "Porsiyon", value: `${recipe.servings} kişilik` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-line/70 bg-paper p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon className="size-3.5" /> {label}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <Clock className="size-4 text-olive" /> Toplam <strong>{formatMinutes(recipe.totalMinutes)}</strong>
              {recipe.calories != null && (
                <>
                  <span className="text-line">•</span> <Flame className="size-4 text-tomato" /> Porsiyon başı <strong>{Math.round(recipe.calories)} kcal</strong>
                </>
              )}
            </p>

            <div className="mt-5 space-y-2">
              <DietBadges diets={diets} max={6} size="md" />
              {allergens.length > 0 && (
                <p className="text-sm text-muted">
                  <span className="font-semibold text-ink-soft">Alerjenler:</span> {allergens.map((a) => labelOf(ALLERGENS, a)).join(", ")}
                </p>
              )}
            </div>

            {(conflicts.length > 0 || disliked.length > 0) && (
              <div role="alert" className="mt-5 flex gap-3 rounded-2xl border border-tomato/30 bg-tomato-50 p-4 text-sm text-tomato-600">
                <TriangleAlert className="size-5 shrink-0" />
                <p>
                  {conflicts.length > 0 && (
                    <>
                      Bu tarif alerjen olarak işaretlediğin <strong>{conflicts.map((a) => labelOf(ALLERGENS, a)).join(", ")}</strong> içeriyor.{" "}
                    </>
                  )}
                  {disliked.length > 0 && (
                    <>
                      Sevmediğin <strong>{disliked.join(", ")}</strong> bu tarifte var.{" "}
                    </>
                  )}
                  Bu yüzden sana önerilmiyor.
                </p>
              </div>
            )}

            <div className="mt-6">
              <RecipeActions recipe={{ id: recipe.id, title: recipe.title, slug: recipe.slug }} householdSize={kitchen.householdSize} />
            </div>
          </div>
        </header>
      </div>

      <div className="container-page mt-12 grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <IngredientsPanel recipeId={recipe.id} baseServings={recipe.servings} initialServings={recipe.servings} ingredients={ingredients} />
          <NutritionTable recipe={recipe} calorieTarget={kitchen.calorieTarget} />
        </div>
        <StepsSection title={recipe.title} steps={steps} tips={tips} ingredients={ingredients} />
      </div>

      <div className="container-page mt-16">
        <ReviewsSection recipeId={recipe.id} slug={recipe.slug} reviews={reviews} ratingAvg={recipe.ratingAvg} ratingCount={recipe.ratingCount} />
      </div>

      {similar.length > 0 && (
        <section className="no-print container-page mt-16" aria-labelledby="similar-title">
          <h2 id="similar-title" className="mb-6 text-2xl font-semibold">
            Benzer tarifler
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function NutritionTable({ recipe, calorieTarget }: { recipe: NonNullable<Awaited<ReturnType<typeof getRecipeDetail>>>; calorieTarget: number }) {
  return (
    <section aria-labelledby="nutrition-title" className="print-break">
      <h2 id="nutrition-title" className="mb-4 text-2xl font-semibold">
        Besin değerleri <span className="font-sans text-sm font-normal text-muted">(porsiyon başı)</span>
      </h2>
      {recipe.calories == null ? (
        <p className="rounded-2xl bg-cream-200/70 p-4 text-sm text-muted">Bu tarifin besin değerleri henüz hesaplanmadı.</p>
      ) : (
        <div className="rounded-2xl border border-line/70 bg-paper p-4">
          <ul className="space-y-3">
            {NUTRIENTS.map((n) => {
              const value = recipe[n.key] ?? 0;
              const pct = dailyPercent(n.key, value, calorieTarget);
              return (
                <li key={n.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-ink-soft">{n.label}</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(value, n.key === "calories" || n.key === "sodium" ? 0 : 1)} {n.unit}
                      <span className="ml-2 text-xs font-normal text-muted">%{pct}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                    <div className={`h-full rounded-full ${n.key === "calories" ? "bg-tomato" : n.key === "protein" ? "bg-olive" : "bg-sage"}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Yüzdeler günlük {formatNumber(calorieTarget)} kcal referansına göredir. Değerler yaklaşıktır, kullanılan ürünlere göre değişebilir.{" "}
            <Link href="/nutrition" className="underline">
              Nasıl hesaplıyoruz?
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
