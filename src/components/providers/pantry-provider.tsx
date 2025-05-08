"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "./user-provider";
import { STORAGE_KEYS, api, readStorage, removeStorage, writeStorage } from "@/lib/client-storage";
import { DEFAULT_ALWAYS_HAVE } from "@/lib/constants";

interface PantryContextValue {
  slugs: string[];
  alwaysHave: string[];
  /** localStorage / sunucu okuması bitti mi? Boş ekran yanıp sönmesin diye. */
  ready: boolean;
  has: (slug: string) => boolean;
  add: (slugs: string[]) => void;
  remove: (slug: string) => void;
  set: (slugs: string[]) => void;
  setAlwaysHave: (slugs: string[]) => void;
}

const PantryContext = createContext<PantryContextValue | null>(null);

export function usePantry() {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry, PantryProvider içinde kullanılmalı");
  return ctx;
}

/**
 * Dolap: giriş yapan kullanıcı için veritabanında, misafir için localStorage'da.
 * Misafir giriş yaptığında yerel dolabı hesabına aktarılır.
 */
export function PantryProvider({ children }: { children: React.ReactNode }) {
  const userId = useUser()?.id ?? null;
  const [slugs, setSlugs] = useState<string[]>([]);
  const [alwaysHave, setAlways] = useState<string[]>(DEFAULT_ALWAYS_HAVE);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const local = readStorage<string[]>(STORAGE_KEYS.pantry, []);
      const localAlways = readStorage<string[] | null>(STORAGE_KEYS.alwaysHave, null);
      if (!userId) {
        if (cancelled) return;
        setSlugs(local);
        setAlways(localAlways ?? DEFAULT_ALWAYS_HAVE);
        setReady(true);
        return;
      }
      try {
        let data = await api<{ slugs: string[]; alwaysHave: string[] }>("/api/pantry");
        if (local.length) {
          const merged = [...new Set([...data.slugs, ...local])];
          data = await api("/api/pantry", { method: "PUT", json: { slugs: merged } });
          removeStorage(STORAGE_KEYS.pantry);
          toast.success("Cihazındaki dolap hesabına aktarıldı.");
        }
        if (cancelled) return;
        setSlugs(data.slugs);
        setAlways(data.alwaysHave);
      } catch {
        /* sessizce boş dolapla devam */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    (next: string[], nextAlways?: string[]) => {
      if (!userId) {
        writeStorage(STORAGE_KEYS.pantry, next);
        if (nextAlways) writeStorage(STORAGE_KEYS.alwaysHave, nextAlways);
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api("/api/pantry", { method: "PUT", json: { slugs: next, ...(nextAlways ? { alwaysHave: nextAlways } : {}) } }).catch((e: Error) => toast.error(e.message));
      }, 400);
    },
    [userId],
  );

  const value = useMemo<PantryContextValue>(() => {
    const update = (next: string[]) => {
      setSlugs(next);
      persist(next);
    };
    return {
      slugs,
      alwaysHave,
      ready,
      has: (s) => slugs.includes(s),
      add: (list) => update([...new Set([...slugs, ...list])]),
      remove: (s) => update(slugs.filter((x) => x !== s)),
      set: (list) => update([...new Set(list)]),
      setAlwaysHave: (list) => {
        setAlways(list);
        persist(slugs, list);
      },
    };
  }, [slugs, alwaysHave, ready, persist]);

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}
