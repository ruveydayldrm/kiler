"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Timer } from "lucide-react";
import { IngredientInput } from "@/components/pantry/ingredient-picker";
import { RecipeCover } from "@/components/recipes/recipe-image";
import { useAssistant } from "@/components/providers/assistant-provider";
import { useLexicon } from "@/components/pantry/ingredient-picker";
import { cn } from "@/lib/utils";

const TIMES = [15, 30, 45] as const;

export interface HeroDish {
  title: string;
  imageUrl: string | null;
  coverColor: string;
  slug: string;
  minutes: number;
}

export function Hero({ dishes }: { dishes: HeroDish[] }) {
  const router = useRouter();
  const assistant = useAssistant();
  const lexicon = useLexicon();
  const [ingredients, setIngredients] = useState<string[]>(["yumurta", "ispanak", "peynir"]);
  const [time, setTime] = useState<number | null>(30);

  const find = () => {
    const params = new URLSearchParams();
    if (ingredients.length) params.set("i", ingredients.join(","));
    if (time) params.set("t", String(time));
    router.push(`/pantry?${params.toString()}`);
  };

  const askAi = () => {
    const names = ingredients.map((s) => lexicon?.name(s).toLocaleLowerCase("tr-TR") ?? s);
    assistant.ask(names.length ? `Dolabımda ${names.join(", ")} var${time ? `, ${time} dakikada` : ""} ne yaparım?` : undefined);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grain absolute inset-0 opacity-50" aria-hidden />
      <div className="container-page relative grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-xs font-bold tracking-wide text-olive shadow-soft">
            <span className="size-2 rounded-full bg-tomato" /> Ev mutfağının akıllı yardımcısı
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-[2.6rem] leading-[1.02] font-semibold text-balance text-ink sm:text-6xl lg:text-[4.2rem]"
          >
            Dolabında ne varsa, <span className="text-olive italic">bugünün tarifi</span> o<span className="text-tomato">.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Elindeki malzemeleri yaz, sana uygun tarifleri bulalım. Eksikleri listene ekleyelim, haftanı birlikte planlayalım.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 rounded-[26px] border border-line/70 bg-paper/80 p-3 shadow-lift backdrop-blur sm:p-4">
            <IngredientInput value={ingredients} onChange={setIngredients} size="lg" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1.5" role="group" aria-label="Süre">
                <Timer className="mr-1 size-5 text-muted" aria-hidden />
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(time === t ? null : t)}
                    aria-pressed={time === t}
                    className={cn("h-10 rounded-full px-3.5 text-sm font-semibold transition", time === t ? "bg-ink text-paper" : "bg-cream-200 text-ink-soft hover:bg-cream-300")}
                  >
                    {t} dk
                  </button>
                ))}
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <button onClick={askAi} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-saffron-50 px-4 text-sm font-semibold text-[#8a5a0f] transition hover:bg-saffron/25 sm:flex-none">
                  <Sparkles className="size-4" /> AI Asistana Sor
                </button>
                <button onClick={find} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-tomato px-6 font-semibold text-paper shadow-soft transition hover:bg-tomato-600 sm:flex-none">
                  Tarif Bul <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
          <p className="mt-4 text-sm text-muted">80+ tarif · alerjilerine kesin uyan öneriler · eksikler tek tıkla listende</p>
        </div>

        {/* Sağ: yüzen yemek kompozisyonu */}
        <div className="relative mx-auto hidden h-[520px] w-full max-w-[520px] md:block" aria-hidden>
          <div className="absolute top-8 left-10 size-[400px] rounded-full bg-olive-100/80" />
          <div className="absolute right-6 bottom-10 size-40 rounded-full bg-saffron/25" />
          {dishes.slice(0, 3).map((d, i) => {
            const pos = [
              "top-0 left-4 w-[62%] rotate-[-4deg] animate-float",
              "top-36 right-0 w-[50%] rotate-[5deg] animate-float-slow [animation-delay:-3s]",
              "bottom-0 left-16 w-[48%] rotate-[2deg] animate-float [animation-delay:-5s]",
            ][i];
            return (
              <a key={d.slug} href={`/recipes/${d.slug}`} tabIndex={-1} className={cn("absolute block overflow-hidden rounded-[22px] border-[6px] border-paper bg-paper shadow-lift", pos)}>
                <RecipeCover title={d.title} imageUrl={d.imageUrl} color={d.coverColor} className="aspect-[4/3]" priority={i === 0} />
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="truncate font-serif text-sm font-semibold">{d.title}</span>
                  <span className="shrink-0 text-muted">{d.minutes} dk</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
