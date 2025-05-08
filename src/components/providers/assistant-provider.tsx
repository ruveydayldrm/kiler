"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface AssistantRecipeContext {
  id: string;
  title: string;
}

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Bekleyen (otomatik gönderilecek) mesaj */
  pending: string | null;
  consumePending: () => string | null;
  /** Tarif sayfasında açıldıysa ilgili tarif */
  recipe: AssistantRecipeContext | null;
  setRecipe: (r: AssistantRecipeContext | null) => void;
  ask: (message?: string) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant, AssistantProvider içinde kullanılmalı");
  return ctx;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<AssistantRecipeContext | null>(null);

  const ask = useCallback((message?: string) => {
    if (message?.trim()) setPending(message.trim());
    setOpen(true);
  }, []);

  const consumePending = useCallback(() => {
    const p = pending;
    setPending(null);
    return p;
  }, [pending]);

  const value = useMemo(() => ({ open, setOpen, pending, consumePending, recipe, setRecipe, ask }), [open, pending, consumePending, recipe, ask]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
