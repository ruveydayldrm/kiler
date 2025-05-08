"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Timer, X } from "lucide-react";
import { toast } from "sonner";

export interface KitchenTimer {
  id: string;
  label: string;
  durationSec: number;
  endsAt: number;
  done: boolean;
}

interface TimerContextValue {
  timers: KitchenTimer[];
  start: (label: string, minutes: number) => void;
  cancel: (id: string) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimers() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimers, TimerProvider içinde kullanılmalı");
  return ctx;
}

export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Kısa "ding" sesi — harici ses dosyası gerektirmez. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.32);
    });
  } catch {
    /* ses desteklenmiyor */
  }
}

/**
 * Mutfak zamanlayıcıları kök seviyede yaşar: sayfa değişse de çalışmaya devam eder.
 * Süre bitiş zamanı (endsAt) üzerinden hesaplanır; sekme arka planda kısılsa bile doğru kalır.
 * Bitince ses + titreşim + (izin verildiyse) sistem bildirimi.
 */
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<KitchenTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const notified = useRef(new Set<string>());

  useEffect(() => {
    if (!timers.some((t) => !t.done)) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [timers]);

  useEffect(() => {
    for (const t of timers) {
      if (t.done || t.endsAt > now || notified.current.has(t.id)) continue;
      notified.current.add(t.id);
      chime();
      navigator.vibrate?.([300, 120, 300, 120, 500]);
      if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
        new Notification("Kiler zamanlayıcı", { body: `${t.label} — süre doldu!` });
      }
      toast.success(`⏰ ${t.label} — süre doldu!`, { duration: 10000 });
      setTimers((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: true } : x)));
    }
  }, [now, timers]);

  const start = useCallback((label: string, minutes: number) => {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission().catch(() => {});
    const durationSec = Math.round(minutes * 60);
    setTimers((prev) => [...prev, { id: crypto.randomUUID(), label, durationSec, endsAt: Date.now() + durationSec * 1000, done: false }]);
    setNow(Date.now());
    toast(`${minutes} dk zamanlayıcı başladı`, { description: label });
  }, []);

  const cancel = useCallback((id: string) => setTimers((prev) => prev.filter((t) => t.id !== id)), []);

  const value = useMemo(() => ({ timers, start, cancel }), [timers, start, cancel]);

  return (
    <TimerContext.Provider value={value}>
      {children}
      <div className="no-print pointer-events-none fixed top-20 right-3 z-40 flex w-[min(300px,calc(100vw-1.5rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {timers.map((t) => {
            const left = (t.endsAt - now) / 1000;
            const pct = t.done ? 100 : Math.min(100, ((t.durationSec - left) / t.durationSec) * 100);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-lift ${t.done ? "border-tomato bg-tomato text-paper" : "border-line bg-paper"}`}
              >
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  {t.done ? <BellRing className="size-5 animate-bounce" /> : <Timer className="size-5 text-olive" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs ${t.done ? "text-paper/85" : "text-muted"}`}>{t.label}</p>
                    <p className="font-serif text-xl font-semibold tabular-nums">{t.done ? "Süre doldu!" : formatClock(left)}</p>
                  </div>
                  <button onClick={() => cancel(t.id)} className="grid size-9 place-items-center rounded-full hover:bg-ink/10" aria-label="Zamanlayıcıyı kapat">
                    <X className="size-4" />
                  </button>
                </div>
                {!t.done && (
                  <div className="h-1 bg-cream-200">
                    <div className="h-full bg-olive transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </TimerContext.Provider>
  );
}
