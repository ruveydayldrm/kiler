"use client";

import { useAssistant } from "@/components/providers/assistant-provider";
import { cn } from "@/lib/utils";

/** Sunucu bileşenlerinden asistanı (isteğe bağlı hazır mesajla) açmak için */
export function AskAssistantButton({ message, className, children }: { message?: string; className?: string; children: React.ReactNode }) {
  const { ask } = useAssistant();
  return (
    <button
      type="button"
      onClick={() => ask(message)}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full bg-saffron-50 px-5 font-semibold text-[#8a5a0f] transition hover:bg-saffron/25", className)}
    >
      {children}
    </button>
  );
}
