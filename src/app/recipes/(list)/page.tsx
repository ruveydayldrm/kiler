import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, SearchX, ShieldCheck, Sparkles } from "lucide-react";
import { RecipeCard, type MatchInfo } from "@/components/recipes/recipe-card";
import { RecipeFilterSidebar, RecipeToolbar } from "@/components/recipes/recipe-filters";
import { AskAssistantButton } from "@/components/chatbot/ask-assistant-button";
import { EmptyState } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getCuisines, getPantrySlugs, getVisibleRecipes } from "@/lib/recipes";
import { getRecommendations } from "@/lib/recommendations";
import { filterRecipes, searchRecipes, sortRecipes } from "@/lib/matching";
import { parseRecipeQuery, serializeRecipeQuery } from "@/lib/recipe-filters";

const PAGE_SIZE = 12;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const q = parseRecipeQuery(await searchParams);
  const cats = await getCategories();
  const cat = q.categories?.length === 1 ? cats.find((c) => c.slug === q.categories![0]) : undefined;
  const title = q.q ? `“${q.q}” tarifleri` : cat ? `${cat.name} Tarifleri` : "Tüm Tarifler";
  return {
    title,
    description: cat?.description ? `${cat.name}: ${cat.description}. Kiler'de malzemeye, süreye ve diyete göre filtrele.` : "Malzemeye, süreye, kaloriye ve diyete göre filtrelenebilen ev yemeği tarifleri.",
    alternates: { canonical: cat ? `/recipes?category=${cat.slug}` : "/recipes" },
  };
}

export default async function RecipesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseRecipeQuery(await searchParams);
  const user = await getCurrentUser();
  const [{ visible, lexicon, kitchen, hiddenCount }, categories, cuisines, pantry] = await Promise.all([
    getVisibleRecipes(user?.id),
    getCategories(),
    getCuisines(),
    getPantrySlugs(user?.id),
  ]);

  // Serbest metin → ortak arama çekirdeği; ardından açık filtreler
  let list = visible;
  const matches = new Map<string, MatchInfo>();
  let searchMode: string | null = null;
  if (query.q) {
    const outcome = searchRecipes(visible, query.q, lexicon, { alwaysHave: kitchen.alwaysHave, pantry });
    list = outcome.results;
    searchMode = outcome.mode;
    for (const [id, m] of outcome.matches) matches.set(id, { percent: m.percent, matched: m.haveCount, required: m.requiredCount, missing: m.missing.map((i) => ({ slug: i.slug, name: i.name })) });
  }
  list = filterRecipes(list, query, lexicon);
  if (!query.q || query.sort !== "recommended") {
    const recommendedOrder = query.sort === "recommended" && user ? (await getRecommendations(user.id, 200)).map((r) => r.recipe.id) : undefined;
    list = sortRecipes(list, query.sort, recommendedOrder);
  }

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const options = {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    cuisines: cuisines.map((c) => ({ slug: c.slug, name: c.name })),
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8">
        <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">Tarifler</p>
        <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">Bugün hangi tabak?</h1>
        <p className="mt-2 max-w-2xl text-muted">Malzemeye, süreye, kaloriye ve diyetine göre süz. Arama kutusu “30 dakikada vegan” gibi doğal istekleri de anlar.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
        <Suspense>
          <RecipeFilterSidebar {...options} />
        </Suspense>
        <div className="min-w-0 space-y-6">
          <Suspense>
            <RecipeToolbar total={total} {...options} />
          </Suspense>

          {user && hiddenCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-olive-50 px-4 py-2.5 text-sm text-olive">
              <ShieldCheck className="size-4 shrink-0" />
              Alerjilerin ve sevmediğin malzemeler nedeniyle {hiddenCount} tarif gösterilmiyor.
              <Link href="/account/preferences" className="ml-auto shrink-0 font-semibold underline-offset-2 hover:underline">
                Tercihler
              </Link>
            </p>
          )}

          {items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} match={searchMode === "pantry" ? matches.get(r.id) : undefined} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title="Bu kriterlere uyan tarif bulamadık"
              description={query.q ? `“${query.q}” için arşivimizde bir eşleşme yok. Filtreleri gevşetmeyi ya da AI asistana sormayı deneyebilirsin.` : "Birkaç filtreyi kaldırmayı dene."}
              action={
                <>
                  <Link href="/recipes" className="inline-flex h-11 items-center rounded-full border border-line bg-paper px-5 font-semibold">
                    Filtreleri temizle
                  </Link>
                  <AskAssistantButton message={query.q}>
                    <Sparkles className="size-4" /> AI asistana sor
                  </AskAssistantButton>
                </>
              }
            />
          )}

          {pages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Sayfalar">
              <PageLink page={page - 1} disabled={page <= 1} query={query} label="Önceki sayfa">
                <ChevronLeft className="size-5" />
              </PageLink>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <PageLink key={p} page={p} query={query} active={p === page} label={`Sayfa ${p}`}>
                  {p}
                </PageLink>
              ))}
              <PageLink page={page + 1} disabled={page >= pages} query={query} label="Sonraki sayfa">
                <ChevronRight className="size-5" />
              </PageLink>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function PageLink({ page, query, active, disabled, label, children }: { page: number; query: ReturnType<typeof parseRecipeQuery>; active?: boolean; disabled?: boolean; label: string; children: React.ReactNode }) {
  const cls = `grid size-11 place-items-center rounded-full text-sm font-semibold transition ${active ? "bg-olive text-paper" : "border border-line bg-paper hover:border-olive"}`;
  if (disabled) return <span className={`${cls} opacity-40`} aria-hidden>{children}</span>;
  const qs = serializeRecipeQuery({ ...query, page });
  return (
    <Link href={`/recipes${qs ? `?${qs}` : ""}`} className={cls} aria-label={label} aria-current={active ? "page" : undefined} scroll>
      {children}
    </Link>
  );
}
