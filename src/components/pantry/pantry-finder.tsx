"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChefHat, ListPlus, Refrigerator, Save, Settings2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { IngredientInput, useLexicon } from "./ingredient-picker";
import { RecipeCard, RecipeCardSkeleton, type MatchInfo, type RecipeCardData } from "@/components/recipes/recipe-card";
import { EmptyState, ToggleChip } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { usePantry } from "@/components/providers/pantry-provider";
import { useShopping } from "@/components/providers/shopping-provider";
import { useAssistant } from "@/components/providers/assistant-provider";
import { useUser } from "@/components/providers/user-provider";
import { DIETS, type DietKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

const POPULAR: { title: string; slugs: string[] }[] = [
  { title: "Sebze", slugs: ["domates", "sogan", "patates", "biber", "ispanak", "patlican", "kabak", "havuc", "sarimsak", "mantar", "brokoli"] },
  { title: "Meyve", slugs: ["limon", "muz", "elma", "avokado", "cilek"] },
  { title: "Et, tavuk & balık", slugs: ["tavuk", "kiyma", "kusbasi", "somon", "ton-baligi", "sucuk"] },
  { title: "Süt ürünleri & yumurta", slugs: ["yumurta", "peynir", "yogurt", "sut", "tereyagi", "kasar", "krema"] },
  { title: "Bakliyat & tahıl", slugs: ["kirmizi-mercimek", "nohut", "pirinc", "bulgur", "makarna", "un", "yulaf"] },
  { title: "Baharat & sos", slugs: ["domates-salcasi", "pul-biber", "kimyon", "kuru-nane", "nar-eksisi"] },
];

interface MatchCard {
  recipe: RecipeCardData;
  match: MatchInfo;
}

export function PantryFinder({ initialIngredients, initialTime }: { initialIngredients: string[]; initialTime?: number }) {
  const pantry = usePantry();
  const user = useUser();
  const lexicon = useLexicon();
  const assistant = useAssistant();
  const shopping = useShopping();
  const [selection, setSelection] = useState<string[]>(initialIngredients);
  const [initialized, setInitialized] = useState(initialIngredients.length > 0);
  const [maxMinutes, setMaxMinutes] = useState<number | undefined>(initialTime);
  const [maxCalories, setMaxCalories] = useState<number | undefined>();
  const [diets, setDiets] = useState<DietKey[]>([]);
  const [results, setResults] = useState<{ ready: MatchCard[]; almost: MatchCard[]; hiddenCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAlways, setShowAlways] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  // URL'den malzeme gelmediyse kayıtlı dolabı yükle (hazır olunca, bir kez)
  useEffect(() => {
    if (!initialized && pantry.ready) {
      setSelection(pantry.slugs);
      setInitialized(true);
    }
  }, [initialized, pantry.ready, pantry.slugs]);

  useEffect(() => {
    if (!initialized) return;
    if (!selection.length) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      try {
        const res = await fetch("/api/pantry/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.current.signal,
          body: JSON.stringify({ slugs: selection, maxMinutes, maxCalories, diets, alwaysHave: pantry.alwaysHave, log: true }),
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* iptal */
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [selection, maxMinutes, maxCalories, diets, pantry.alwaysHave, initialized]);

  const saved = useMemo(() => {
    const a = [...selection].sort().join();
    const b = [...pantry.slugs].sort().join();
    return a === b;
  }, [selection, pantry.slugs]);

  const addAllMissing = async (cards: MatchCard[]) => {
    const seen = new Set<string>();
    const items = cards.flatMap((c) => c.match.missing).filter((m) => !seen.has(m.slug) && seen.add(m.slug));
    await shopping.addItems(items.map((m) => ({ ingredientSlug: m.slug, name: m.name })));
  };

  const names = selection.map((s) => lexicon?.name(s).toLocaleLowerCase("tr-TR") ?? s);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* ---------------------------------------------------------------- Sol: dolap */}
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Refrigerator className="size-5 text-olive" /> Dolabım
            </h2>
            {selection.length > 0 && (
              <button onClick={() => setSelection([])} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-tomato">
                <Trash2 className="size-4" /> Temizle
              </button>
            )}
          </div>
          <IngredientInput value={selection} onChange={setSelection} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-muted">{user ? "Hesabına kaydedilir." : "Bu cihazda saklanır. Giriş yaparsan hesabına aktarılır."}</p>
            <Button size="sm" variant={saved ? "soft" : "primary"} disabled={saved || !pantry.ready} onClick={() => pantry.set(selection)}>
              <Save /> {saved ? "Kayıtlı" : "Dolabıma kaydet"}
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {POPULAR.map((g) => (
              <div key={g.title}>
                <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{g.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.slugs.map((s) => {
                    const on = selection.includes(s);
                    return (
                      <ToggleChip key={s} active={on} onClick={() => setSelection(on ? selection.filter((x) => x !== s) : [...selection, s])} className="min-h-10">
                        {lexicon?.name(s) ?? s}
                      </ToggleChip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-5">
          <button onClick={() => setShowAlways((v) => !v)} className="flex w-full items-center justify-between text-left" aria-expanded={showAlways}>
            <span className="flex items-center gap-2 font-semibold">
              <Settings2 className="size-4 text-olive" /> Evde hep olanlar
            </span>
            <span className="text-xs text-muted">{pantry.alwaysHave.map((s) => lexicon?.name(s) ?? s).join(", ")}</span>
          </button>
          {showAlways && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted">Bunlar eşleşme oranına dahil edilmez ve alışveriş listesine eklenmez.</p>
              <IngredientInput value={pantry.alwaysHave} onChange={pantry.setAlwaysHave} placeholder="ör. tuz, un, şeker" />
            </div>
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------------------- Sağ: sonuçlar */}
      <section className="min-w-0 space-y-6" aria-live="polite">
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-cream-200/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink-soft">Süre:</span>
            {[15, 30, 45, 60].map((m) => (
              <ToggleChip key={m} active={maxMinutes === m} onClick={() => setMaxMinutes(maxMinutes === m ? undefined : m)}>
                ≤ {m} dk
              </ToggleChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink-soft">Kalori:</span>
            {[300, 500, 700].map((c) => (
              <ToggleChip key={c} active={maxCalories === c} onClick={() => setMaxCalories(maxCalories === c ? undefined : c)}>
                ≤ {c} kcal
              </ToggleChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink-soft">Diyet:</span>
            {DIETS.map((d) => (
              <ToggleChip key={d.key} active={diets.includes(d.key)} onClick={() => setDiets(diets.includes(d.key) ? diets.filter((x) => x !== d.key) : [...diets, d.key])}>
                {d.short}
              </ToggleChip>
            ))}
          </div>
        </div>

        {results?.hiddenCount ? (
          <p className="flex items-center gap-2 rounded-2xl bg-olive-50 px-4 py-2.5 text-sm text-olive">
            <ShieldCheck className="size-4" /> Alerjilerin ve sevmediklerin nedeniyle bazı tarifler hiç gösterilmiyor.
          </p>
        ) : null}

        {!initialized || (!pantry.ready && !selection.length) ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : !selection.length ? (
          <EmptyState
            icon={<Refrigerator />}
            title="Dolabın şimdilik boş"
            description="Soldan birkaç malzeme seç ya da yaz; hemen yapabileceklerini ve 1-2 eksikle yapabileceklerini gösterelim."
            action={
              <Button variant="soft" onClick={() => setSelection(["yumurta", "domates", "biber"])}>
                Örnek: yumurta, domates, biber
              </Button>
            }
          />
        ) : loading && !results ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : results && results.ready.length + results.almost.length === 0 ? (
          <EmptyState
            icon={<ChefHat />}
            title="Bu malzemelerle tam bir eşleşme çıkmadı"
            description="Birkaç malzeme daha ekleyebilir, filtreleri gevşetebilir ya da AI asistana danışabilirsin."
            action={
              <Button variant="accent" onClick={() => assistant.ask(`Dolabımda ${names.join(", ")} var, ne yapabilirim?`)}>
                <Sparkles /> AI asistana sor
              </Button>
            }
          />
        ) : (
          results && (
            <div className={cn("space-y-10 transition-opacity", loading && "opacity-60")}>
              <ResultGroup
                title="Hemen yapabileceklerin"
                subtitle="Tüm malzemeler elinde (evde hep olanlar hariç)."
                cards={results.ready}
                empty="Henüz tüm malzemesi elinde olan bir tarif yok — aşağıdaki 1-2 eksikli tariflere göz at."
              />
              <ResultGroup
                title="1-2 malzeme eksik"
                subtitle="Eksikler kırmızıyla işaretli; tek tıkla listene ekleyebilirsin."
                cards={results.almost}
                empty="1-2 eksikle yapılabilecek tarif bulunamadı."
                action={
                  results.almost.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => addAllMissing(results.almost.slice(0, 6))}>
                      <ListPlus /> İlk 6 tarifin eksiklerini ekle
                    </Button>
                  )
                }
                showAdd
              />
              <p className="text-center text-sm text-muted">
                Aradığını bulamadın mı?{" "}
                <button onClick={() => assistant.ask(`Dolabımda ${names.join(", ")} var, ne yapabilirim?`)} className="font-semibold text-olive hover:underline">
                  AI asistana sor
                </button>{" "}
                ya da{" "}
                <Link href="/recipes" className="font-semibold text-olive hover:underline">
                  tüm tariflere bak
                </Link>
                .
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

function ResultGroup({ title, subtitle, cards, empty, action, showAdd }: { title: string; subtitle: string; cards: MatchCard[]; empty: string; action?: React.ReactNode; showAdd?: boolean }) {
  const shopping = useShopping();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">
            {title} <span className="font-sans text-base font-semibold text-muted">({cards.length})</span>
          </h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {cards.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <div key={c.recipe.id} className="flex flex-col gap-2">
              <RecipeCard recipe={c.recipe} match={c.match} className="flex-1" />
              {showAdd && c.match.missing.length > 0 && (
                <button
                  onClick={() => shopping.addItems(c.match.missing.map((m) => ({ ingredientSlug: m.slug, name: m.name, source: { recipeId: c.recipe.id, title: c.recipe.title } })))}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-tomato-50 text-sm font-semibold text-tomato-600 transition hover:bg-tomato hover:text-paper"
                >
                  <ListPlus className="size-4" /> Eksikleri listeye ekle
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-cream-200/60 px-4 py-3 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}
