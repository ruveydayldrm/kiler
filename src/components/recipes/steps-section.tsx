"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, ChevronLeft, ChevronRight, Lightbulb, Sun, Timer, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimers } from "@/components/providers/timer-provider";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { cn } from "@/lib/utils";
import type { DetailIngredient } from "./ingredients-panel";
import { formatAmount } from "@/lib/units";

export interface DetailStep {
  id: string;
  order: number;
  text: string;
  durationMinutes: number | null;
}

function TimerButton({ minutes, label, large }: { minutes: number; label: string; large?: boolean }) {
  const { start } = useTimers();
  return (
    <button
      type="button"
      onClick={() => start(label, minutes)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition",
        large ? "h-14 bg-saffron px-6 text-lg text-ink hover:bg-saffron/85" : "h-9 bg-saffron-50 px-3.5 text-sm text-[#8a5a0f] hover:bg-saffron/25",
      )}
    >
      <Timer className={large ? "size-5" : "size-4"} /> {minutes} dk zamanlayıcı başlat
    </button>
  );
}

export function StepsSection({ title, steps, tips, ingredients }: { title: string; steps: DetailStep[]; tips: string[]; ingredients: DetailIngredient[] }) {
  const [cooking, setCooking] = useState(false);
  return (
    <section aria-labelledby="steps-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="steps-title" className="text-2xl font-semibold">
          Yapılışı
        </h2>
        <Button variant="accent" onClick={() => setCooking(true)} className="no-print">
          <ChefHat /> Pişirme modu
        </Button>
      </div>
      <ol className="space-y-4">
        {steps.map((s) => (
          <li key={s.id} className="print-break flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-olive font-serif text-lg font-semibold text-paper">{s.order}</span>
            <div className="flex-1 pt-1.5">
              <p className="text-[16px] leading-relaxed text-ink">{s.text}</p>
              {s.durationMinutes && (
                <div className="no-print mt-2.5">
                  <TimerButton minutes={s.durationMinutes} label={`${title} — ${s.order}. adım`} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {tips.length > 0 && (
        <div className="print-break mt-8 rounded-2xl border border-saffron/40 bg-saffron-50/70 p-5">
          <h3 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold tracking-wide text-[#8a5a0f] uppercase">
            <Lightbulb className="size-4" /> Püf noktaları
          </h3>
          <ul className="space-y-1.5 text-[15px] text-ink-soft">
            {tips.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-saffron" /> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence>{cooking && <CookingMode title={title} steps={steps} ingredients={ingredients} onClose={() => setCooking(false)} />}</AnimatePresence>
    </section>
  );
}

/**
 * Pişirme modu: tam ekran, büyük yazı, adım adım ileri/geri, ekran açık kalır (Wake Lock),
 * isteğe bağlı sesli okuma (Web Speech API, tr-TR). Ok tuşları ve kaydırma ile gezinilir.
 */
function CookingMode({ title, steps, ingredients, onClose }: { title: string; steps: DetailStep[]; ingredients: DetailIngredient[]; onClose: () => void }) {
  const [index, setIndex] = useState(-1); // -1 = malzeme hazırlığı
  const [speak, setSpeak] = useState(false);
  const { supported, held } = useWakeLock(true);
  const [mounted, setMounted] = useState(false);
  const total = steps.length;
  const step = index >= 0 ? steps[index] : null;

  useEffect(() => setMounted(true), []);

  const say = useCallback(
    (text: string) => {
      if (!speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tr-TR";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    },
    [speak],
  );

  useEffect(() => {
    if (step) say(`Adım ${step.order}. ${step.text}`);
    else say("Önce malzemeleri hazırlayalım.");
  }, [step, say]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, -1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [total, onClose]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} pişirme modu`}
    >
      <header className="flex items-center gap-3 px-4 py-3 sm:px-8">
        <ChefHat className="size-6 text-saffron" />
        <p className="min-w-0 flex-1 truncate font-serif text-lg">{title}</p>
        {supported && (
          <span className={cn("hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:inline-flex", held ? "bg-olive text-paper" : "bg-paper/10 text-paper/70")}>
            <Sun className="size-3.5" /> {held ? "Ekran açık kalacak" : "Ekran kilidi bekleniyor"}
          </span>
        )}
        <button onClick={() => setSpeak((s) => !s)} className={cn("grid size-12 place-items-center rounded-full", speak ? "bg-saffron text-ink" : "bg-paper/10")} aria-pressed={speak} aria-label="Sesli okuma">
          {speak ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
        <button onClick={onClose} className="grid size-12 place-items-center rounded-full bg-paper/10" aria-label="Pişirme modundan çık">
          <X className="size-6" />
        </button>
      </header>

      <div className="h-1.5 bg-paper/10">
        <div className="h-full bg-saffron transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="flex flex-1 items-center overflow-y-auto px-5 py-8 sm:px-12">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="mx-auto w-full max-w-3xl">
            {step ? (
              <>
                <p className="mb-4 text-sm font-bold tracking-[0.2em] text-saffron uppercase">
                  Adım {step.order} / {total}
                </p>
                <p className="font-serif text-[clamp(1.7rem,4.5vw,3rem)] leading-snug">{step.text}</p>
                {step.durationMinutes && (
                  <div className="mt-8">
                    <TimerButton minutes={step.durationMinutes} label={`${title} — ${step.order}. adım`} large />
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mb-4 text-sm font-bold tracking-[0.2em] text-saffron uppercase">Hazırlık</p>
                <p className="mb-6 font-serif text-3xl sm:text-4xl">Önce malzemeleri tezgâha alalım</p>
                <ul className="grid gap-x-8 gap-y-3 text-xl sm:grid-cols-2">
                  {ingredients.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4 border-b border-paper/10 pb-2">
                      <span>{i.name}</span>
                      <span className="text-paper/70 tabular-nums">{formatAmount(i.quantity, i.unit)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="safe-bottom grid grid-cols-2 gap-3 p-4 sm:px-8">
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, -1))}
          disabled={index < 0}
          className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-paper/10 text-lg font-semibold disabled:opacity-30"
        >
          <ChevronLeft className="size-6" /> Geri
        </button>
        {index < total - 1 ? (
          <button onClick={() => setIndex((i) => i + 1)} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-saffron text-lg font-semibold text-ink">
            {index < 0 ? "Başla" : "Sonraki"} <ChevronRight className="size-6" />
          </button>
        ) : (
          <button onClick={onClose} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-olive text-lg font-semibold">
            Afiyet olsun! 🎉
          </button>
        )}
      </footer>
    </motion.div>,
    document.body,
  );
}
