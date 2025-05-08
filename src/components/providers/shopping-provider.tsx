"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "./user-provider";
import { usePantry } from "./pantry-provider";
import { STORAGE_KEYS, api, readStorage, removeStorage, writeStorage } from "@/lib/client-storage";
import { mergeShoppingItems, type ShoppingAddition, type ShoppingItemDTO } from "@/lib/shopping";

interface AddResult {
  added: number;
  merged: number;
}

interface ShoppingContextValue {
  items: ShoppingItemDTO[];
  ready: boolean;
  /** Alınmamış ürün sayısı (header rozeti) */
  count: number;
  addItems: (items: ShoppingAddition[], opts?: { silent?: boolean; message?: string }) => Promise<AddResult | null>;
  addRecipe: (recipeId: string, opts?: { servings?: number; onlyMissing?: boolean; silent?: boolean }) => Promise<AddResult | null>;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearChecked: () => void;
  clearAll: () => void;
  moveCheckedToPantry: () => Promise<void>;
  /** Sunucuda başka bir yerden (ör. haftalık plan) değişen listeyi yeniden yükler */
  refresh: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextValue | null>(null);

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error("useShopping, ShoppingProvider içinde kullanılmalı");
  return ctx;
}

const localId = () => `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Alışveriş listesi: giriş yapan kullanıcı için sunucuda (her istek userId ile sınırlı),
 * misafir için localStorage'da. Birleştirme mantığı her iki tarafta da lib/shopping.ts'den gelir.
 */
export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const userId = useUser()?.id ?? null;
  const pantry = usePantry();
  const [items, setItems] = useState<ShoppingItemDTO[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // İlk yükleme + misafir → hesap aktarımı
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const local = readStorage<ShoppingItemDTO[]>(STORAGE_KEYS.shopping, []);
      if (!userId) {
        if (!cancelled) {
          setItems(local);
          setReady(true);
        }
        return;
      }
      try {
        let data = await api<{ items: ShoppingItemDTO[] }>("/api/shopping-list");
        const pending = local.filter((i) => !i.checked);
        if (pending.length) {
          data = await api("/api/shopping-list", {
            method: "POST",
            json: { items: pending.map((i) => ({ ingredientSlug: i.ingredientSlug ?? undefined, name: i.name, quantity: i.quantity, unit: i.unit, aisle: i.aisle, source: i.sources[0] })) },
          });
          removeStorage(STORAGE_KEYS.shopping);
          toast.success("Cihazındaki alışveriş listesi hesabına aktarıldı.");
        }
        if (!cancelled) setItems(data.items);
      } catch {
        /* yoksay */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setLocal = useCallback((next: ShoppingItemDTO[]) => {
    setItems(next);
    writeStorage(STORAGE_KEYS.shopping, next);
  }, []);

  const addItems = useCallback<ShoppingContextValue["addItems"]>(
    async (additions, opts) => {
      if (!additions.length) {
        if (!opts?.silent) toast.info("Eklenecek eksik malzeme yok — hepsi dolabında görünüyor. 🎉");
        return { added: 0, merged: 0 };
      }
      try {
        let result: AddResult;
        if (userId) {
          const data = await api<{ items: ShoppingItemDTO[]; added: number; merged: number }>("/api/shopping-list", { method: "POST", json: { items: additions } });
          setItems(data.items);
          result = data;
        } else {
          const merged = mergeShoppingItems(itemsRef.current, additions, { newId: localId });
          setLocal(merged.items);
          result = merged;
        }
        if (!opts?.silent) toast.success(opts?.message ?? "Eksik malzemeler listene eklendi.", { action: { label: "Listeye git", onClick: () => (window.location.href = "/shopping-list") } });
        return result;
      } catch (e) {
        toast.error((e as Error).message);
        return null;
      }
    },
    [userId, setLocal],
  );

  const addRecipe = useCallback<ShoppingContextValue["addRecipe"]>(
    async (recipeId, opts) => {
      try {
        // Sunucu, tarifin ölçeklenmiş kalemlerini üretir (dolaptakiler ve "evde hep olanlar" düşülür).
        const data = await api<{ additions: ShoppingAddition[]; persisted: boolean; items?: ShoppingItemDTO[]; added?: number; merged?: number }>(
          "/api/shopping-list",
          { method: "POST", json: { recipe: { recipeId, servings: opts?.servings, onlyMissing: opts?.onlyMissing ?? true, pantry: userId ? undefined : pantry.slugs, alwaysHave: userId ? undefined : pantry.alwaysHave } } },
        );
        if (data.persisted && data.items) {
          setItems(data.items);
          if (!opts?.silent) {
            if (data.additions.length) toast.success("Eksik malzemeler listene eklendi.", { action: { label: "Listeye git", onClick: () => (window.location.href = "/shopping-list") } });
            else toast.info("Eklenecek eksik malzeme yok — hepsi dolabında görünüyor. 🎉");
          }
          return { added: data.added ?? 0, merged: data.merged ?? 0 };
        }
        return addItems(data.additions, { silent: opts?.silent });
      } catch (e) {
        toast.error((e as Error).message);
        return null;
      }
    },
    [userId, pantry.slugs, pantry.alwaysHave, addItems],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = itemsRef.current.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
      if (!userId) return setLocal(next);
      setItems(next);
      const item = next.find((i) => i.id === id);
      api("/api/shopping-list", { method: "PATCH", json: { id, checked: item?.checked } }).catch((e: Error) => toast.error(e.message));
    },
    [userId, setLocal],
  );

  const remove = useCallback(
    (id: string) => {
      const removed = itemsRef.current.find((i) => i.id === id);
      if (!removed) return;
      const next = itemsRef.current.filter((i) => i.id !== id);
      const undo = () => {
        if (!userId) return setLocal([...itemsRef.current, removed]);
        void api<{ items: ShoppingItemDTO[] }>("/api/shopping-list", {
          method: "POST",
          json: { items: [{ ingredientSlug: removed.ingredientSlug ?? undefined, name: removed.name, quantity: removed.quantity, unit: removed.unit, aisle: removed.aisle, source: removed.sources[0] }] },
        }).then((d) => setItems(d.items));
      };
      if (!userId) setLocal(next);
      else {
        setItems(next);
        api(`/api/shopping-list?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch((e: Error) => toast.error(e.message));
      }
      toast(`${removed.name} listeden çıkarıldı`, { action: { label: "Geri al", onClick: undo } });
    },
    [userId, setLocal],
  );

  const clear = useCallback(
    (scope: "checked" | "all") => {
      const previous = itemsRef.current;
      const next = scope === "all" ? [] : previous.filter((i) => !i.checked);
      if (!userId) {
        setLocal(next);
        toast(scope === "all" ? "Liste temizlendi" : "Alınanlar temizlendi", { action: { label: "Geri al", onClick: () => setLocal(previous) } });
        return;
      }
      setItems(next);
      api(`/api/shopping-list?scope=${scope}`, { method: "DELETE" }).catch((e: Error) => toast.error(e.message));
      toast.success(scope === "all" ? "Liste temizlendi" : "Alınanlar temizlendi");
    },
    [userId, setLocal],
  );

  const moveCheckedToPantry = useCallback(async () => {
    const checked = itemsRef.current.filter((i) => i.checked);
    const slugs = checked.flatMap((i) => (i.ingredientSlug ? [i.ingredientSlug] : []));
    if (!checked.length) {
      toast.info("Önce aldığın ürünleri işaretle.");
      return;
    }
    pantry.add(slugs);
    const next = itemsRef.current.filter((i) => !i.checked);
    if (!userId) setLocal(next);
    else {
      setItems(next);
      await api("/api/shopping-list?scope=checked", { method: "DELETE" }).catch((e: Error) => toast.error(e.message));
    }
    toast.success(`${slugs.length} ürün dolabına aktarıldı.`);
  }, [userId, setLocal, pantry]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await api<{ items: ShoppingItemDTO[] }>("/api/shopping-list").catch(() => null);
    if (data) setItems(data.items);
  }, [userId]);

  const value = useMemo<ShoppingContextValue>(
    () => ({
      refresh,
      items,
      ready,
      count: items.filter((i) => !i.checked).length,
      addItems,
      addRecipe,
      toggle,
      remove,
      clearChecked: () => clear("checked"),
      clearAll: () => clear("all"),
      moveCheckedToPantry,
    }),
    [items, ready, addItems, addRecipe, toggle, remove, clear, moveCheckedToPantry, refresh],
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}
