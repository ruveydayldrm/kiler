import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { AiSection } from "@/components/home/ai-section";
import { RecipeRail } from "@/components/home/recipe-rail";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { CategoryIcon, CATEGORY_TINTS } from "@/components/recipes/category-icon";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SectionHeading } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getVisibleRecipes } from "@/lib/recipes";
import { getRecommendations } from "@/lib/recommendations";
import { sortRecipes } from "@/lib/matching";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [{ visible }, categories, recommendations] = await Promise.all([getVisibleRecipes(user?.id), getCategories(), getRecommendations(user?.id, 4)]);

  const featured = sortRecipes(visible.filter((r) => r.featured), "recommended").slice(0, 4);
  const today = featured.length >= 4 ? featured : sortRecipes(visible, "recommended").slice(0, 4);
  const quick = sortRecipes(visible.filter((r) => r.totalMinutes <= 30 && r.categorySlug !== "icecekler"), "popular").slice(0, 10);
  const healthy = sortRecipes(
    visible.filter((r) => r.calories != null && (r.calories <= 400 || r.diets.includes("high-protein")) && r.categorySlug !== "icecekler"),
    "top-rated",
  ).slice(0, 4);
  const heroDishes = [...visible.filter((r) => r.imageUrl), ...today].slice(0, 3).map((r) => ({ title: r.title, imageUrl: r.imageUrl, coverColor: r.coverColor, slug: r.slug, minutes: r.totalMinutes }));

  return (
    <>
      <Hero dishes={heroDishes} />

      <section className="container-page mt-10">
        <SectionHeading
          eyebrow="Bugün"
          title="Bugün ne pişirsek?"
          description="Mutfağımızdan öne çıkanlar — her biri denenmiş, ölçüleri net."
          action={
            <Link href="/recipes" className="inline-flex items-center gap-1.5 font-semibold text-olive hover:underline">
              Tüm tarifler <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {today.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} priority={i < 2} />
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeading eyebrow="Kategoriler" title="Canın ne çekiyor?" />
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/recipes?category=${c.slug}`}
                className="group flex h-full flex-col items-center gap-2 rounded-[20px] p-4 text-center transition hover:-translate-y-0.5 hover:shadow-soft"
                style={{ background: CATEGORY_TINTS[i % CATEGORY_TINTS.length] }}
              >
                <span className="grid size-14 place-items-center rounded-full bg-paper/80 text-olive transition group-hover:scale-105 group-hover:text-tomato">
                  <CategoryIcon name={c.icon} className="size-6" />
                </span>
                <span className="text-sm leading-tight font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-muted">{c._count.recipes} tarif</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-20">
        <AiSection />
      </div>

      <section className="container-page mt-20">
        <SectionHeading
          eyebrow="30 dakikada hazır"
          title="Hızlı ve pratik"
          description="Yorgun akşamların kurtarıcıları: yarım saatte sofrada."
          action={
            <Link href="/recipes?maxMinutes=30&sort=fastest" className="inline-flex items-center gap-1.5 font-semibold text-olive hover:underline">
              Hepsini gör <ArrowRight className="size-4" />
            </Link>
          }
        />
        <RecipeRail recipes={quick} label="30 dakikada hazır tarifler" />
      </section>

      <section className="container-page mt-20">
        <SectionHeading
          eyebrow="Dengeli tabaklar"
          title="Sağlıklı seçimler"
          description="Düşük kalorili ya da proteini yüksek; hafif ama doyurucu."
          action={
            <Link href="/recipes?sort=lowest-calorie&maxCalories=400" className="inline-flex items-center gap-1.5 font-semibold text-olive hover:underline">
              Daha fazla <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {healthy.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Kişisel
            </span>
          }
          title="Senin için seçtik"
          description={
            user
              ? "Diyet tercihlerin, favorilerin, yaptıkların ve dolabına göre. Alerjenlerin ve sevmediklerin asla önerilmez."
              : "Giriş yaparsan önerileri diyetine, favorilerine ve dolabına göre kişiselleştiririz."
          }
          action={
            !user && (
              <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-olive hover:underline">
                Giriş yap <ArrowRight className="size-4" />
              </Link>
            )
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map(({ recipe, reasons }) => (
            <div key={recipe.id} className="flex flex-col gap-2">
              <RecipeCard recipe={recipe} />
              {reasons[0] && <p className="px-1 text-xs font-medium text-olive">✦ {reasons[0]}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="grid items-center gap-8 rounded-[32px] bg-saffron-50 px-6 py-10 sm:px-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Haftanın menüsü her pazar e-postanda.</h2>
            <p className="mt-3 text-ink-soft">Mevsiminde 7 akşam yemeği, hazır alışveriş listesiyle. Spam yok, istediğin an ayrıl.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
