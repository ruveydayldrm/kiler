"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "./user-provider";
import { api } from "@/lib/client-storage";

interface FavoritesContextValue {
  ids: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string, title?: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites, FavoritesProvider içinde kullanılmalı");
  return ctx;
}

export function FavoritesProvider({ initialIds, children }: { initialIds: string[]; children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();
  const [ids, setIds] = useState(() => new Set(initialIds));

  useEffect(() => setIds(new Set(initialIds)), [initialIds]);

  const toggle = useCallback(
    async (id: string, title?: string) => {
      if (!user) {
        toast("Favorilere eklemek için giriş yap", { action: { label: "Giriş yap", onClick: () => router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`) } });
        return;
      }
      const wasFav = ids.has(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const res = await api<{ favorited: boolean }>("/api/favorites", { method: "POST", json: { recipeId: id } });
        toast.success(res.favorited ? `${title ?? "Tarif"} favorilerine eklendi.` : "Favorilerden çıkarıldı.");
      } catch (e) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error((e as Error).message);
      }
    },
    [user, ids, router],
  );

  const value = useMemo(() => ({ ids, isFavorite: (id: string) => ids.has(id), toggle }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
