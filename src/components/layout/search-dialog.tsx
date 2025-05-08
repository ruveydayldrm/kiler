"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, LoaderCircle, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { useAssistant } from "@/components/providers/assistant-provider";
import { formatMinutes } from "@/lib/utils";

interface Hit {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  totalMinutes: number;
  calories: number | null;
  imageUrl: string | null;
  coverColor: string;
  matchPercent?: number;
}

const SUGGESTIONS = ["mercimek çorbası", "30 dakikada akşam yemeği", "vegan", "tavuk", "glutensiz kahvaltı", "500 kalori altı"];

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();
  const assistant = useAssistant();
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`, { signal: ctrl.current.signal });
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results ?? []);
        setSearched(true);
      } catch {
        /* iptal edildi */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (term = q) => {
    if (!term.trim()) return;
    onOpenChange(false);
    router.push(`/recipes?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Tarif ara" description="Tarif adı, malzeme ya da 'akşama 20 dakikalık' gibi bir istek yaz." className="sm:top-[12%] sm:translate-y-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Örn. mercimek çorbası, ıspanaklı, 20 dakikada…"
            className="h-14 w-full rounded-2xl border border-line bg-cream pr-12 pl-12 text-base focus:border-olive focus:ring-4 focus:ring-olive/10 focus:outline-none"
            aria-label="Arama"
          />
          {loading && <LoaderCircle className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-muted" />}
        </form>

        {!q.trim() && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Popüler aramalar</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="rounded-full bg-cream-200 px-3.5 py-2 text-sm text-ink-soft transition hover:bg-olive-50 hover:text-olive">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-1">
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/recipes/${h.slug}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-cream-200"
              >
                <RecipeThumb title={h.title} imageUrl={h.imageUrl} color={h.coverColor} className="size-14 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{h.title}</p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    {h.categoryName} · <Clock className="size-3" /> {formatMinutes(h.totalMinutes)}
                    {h.calories ? ` · ${h.calories} kcal` : ""}
                  </p>
                </div>
                {h.matchPercent != null && <span className="rounded-full bg-olive-50 px-2 py-1 text-xs font-bold text-olive">%{h.matchPercent}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {searched && !hits.length && !loading && (
          <div className="mt-4 rounded-2xl bg-cream-200/70 p-4 text-sm text-ink-soft">
            “{q}” için arşivimizde bir tarif bulamadık. AI asistana sormak ister misin?
          </div>
        )}

        {q.trim().length >= 2 && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button onClick={() => go()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-olive px-4 text-sm font-semibold text-paper">
              Tüm sonuçları gör <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                assistant.ask(q);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-saffron-50 px-4 text-sm font-semibold text-[#8a5a0f]"
            >
              <Sparkles className="size-4" /> AI asistana sor
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
