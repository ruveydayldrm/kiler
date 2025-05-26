"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eraser, SendHorizontal, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { AssistantMessage } from "./chat-message";
import { useAssistant } from "@/components/providers/assistant-provider";
import { useUser } from "@/components/providers/user-provider";
import { usePantry } from "@/components/providers/pantry-provider";
import { STORAGE_KEYS, api, readStorage, removeStorage, writeStorage } from "@/lib/client-storage";
import { cn } from "@/lib/utils";
import type { ChatMessageDTO, ChatResponse } from "@/types/ai";

const GREETING = "Merhaba 👋 Bugün ne pişirelim? Elindeki malzemeleri, ne kadar vaktin olduğunu ya da canının ne çektiğini söyle.";

const QUICK_ACTIONS = [
  { label: "🥚 Dolabımdakilerle ne yaparım?", text: "Dolabımdakilerle ne yaparım?" },
  { label: "⏱️ 20 dakikalık akşam yemeği", text: "20 dakikada hazırlanan bir akşam yemeği öner" },
  { label: "🥗 500 kalori altı öner", text: "500 kalori altı bir şey öner" },
  { label: "🌱 Vegan bir şey öner", text: "Vegan bir şey öner" },
  { label: "📅 Bu haftamı planla", text: "Bu haftamı planla" },
  { label: "🛒 Listeme ne eklemeliyim?", text: "Listeme ne eklemeliyim?" },
];

const RECIPE_QUICK = ["Bunu vegan yapabilir miyim?", "Krema yerine ne kullanırım?", "Bunu 2 kişilik yapmak istiyorum.", "Yanına ne yakışır?", "Fırınım yok, tavada olur mu?"];

export function ChatWidget() {
  const { open, setOpen, consumePending, pending, recipe, setRecipe } = useAssistant();
  const user = useUser();
  const pantry = usePantry();
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Tarif sayfasından çıkınca tarif bağlamını bırak
  useEffect(() => {
    if (recipe && !pathname.startsWith("/recipes/")) setRecipe(null);
  }, [pathname, recipe, setRecipe]);

  // Geçmişi yükle (ilk açılışta)
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      if (user) {
        try {
          const data = await api<{ conversationId: string | null; messages: ChatMessageDTO[] }>("/api/chat/history");
          setMessages(data.messages);
          setConversationId(data.conversationId ?? undefined);
        } catch {
          /* yoksay */
        }
      } else {
        setMessages(readStorage<ChatMessageDTO[]>(STORAGE_KEYS.chat, []));
      }
      setLoaded(true);
    })();
  }, [open, loaded, user]);

  useEffect(() => {
    setLoaded(false);
    setMessages([]);
  }, [user?.id]);

  useEffect(() => {
    if (!user && loaded) writeStorage(STORAGE_KEYS.chat, messages.slice(-40));
  }, [messages, user, loaded]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // Mobilde tam ekran açıkken arka plan kaymasın
    const mq = window.matchMedia("(max-width: 639px)");
    if (mq.matches) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || loading) return;
      setInput("");
      const userMsg: ChatMessageDTO = { id: crypto.randomUUID(), role: "user", content: message, createdAt: Date.now() };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);
      try {
        const data = await api<{ response: ChatResponse; conversationId?: string }>("/api/chat", {
          method: "POST",
          json: { message, recipeId: recipe?.id, conversationId, pantry: user ? undefined : pantry.slugs },
        });
        if (data.conversationId) setConversationId(data.conversationId);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: data.response.message, payload: data.response, createdAt: Date.now() }]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: (e as Error).message, createdAt: Date.now() },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, recipe?.id, conversationId, user, pantry.slugs],
  );

  // Dışarıdan gelen soru (hero, arama, tarif sayfası…)
  useEffect(() => {
    if (open && loaded && pending) {
      const p = consumePending();
      if (p) void send(p);
    }
  }, [open, loaded, pending, consumePending, send]);

  const clear = async () => {
    setMessages([]);
    setConversationId(undefined);
    if (user) await api("/api/chat/history", { method: "DELETE" }).catch(() => {});
    else removeStorage(STORAGE_KEYS.chat);
    toast("Sohbet temizlendi");
  };

  const hideLauncher = pathname.startsWith("/admin");

  return (
    <>
      {!hideLauncher && (
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setOpen(true)}
              className="no-print fixed right-4 bottom-20 z-40 flex h-14 items-center gap-2 rounded-full bg-olive pr-5 pl-4 font-semibold text-paper shadow-lift transition hover:bg-olive-600 lg:right-6 lg:bottom-6"
              aria-label="AI Mutfak Asistanı'nı aç"
            >
              <span className="relative grid size-8 place-items-center rounded-full bg-paper/15">
                <Sparkles className="size-[18px] text-saffron" />
                <span className="absolute -top-0.5 -right-0.5 size-2.5 animate-pulse rounded-full bg-tomato" />
              </span>
              <span className="hidden sm:inline">AI Mutfak Asistanı</span>
              <span className="sm:hidden">Asistan</span>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="AI Mutfak Asistanı"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="no-print fixed inset-0 z-50 flex flex-col bg-cream sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(720px,calc(100dvh-2.5rem))] sm:w-[420px] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-line sm:shadow-lift"
          >
            <header className="flex items-center gap-3 bg-olive px-4 py-3.5 text-paper">
              <span className="grid size-10 place-items-center rounded-full bg-paper/15">
                <Sparkles className="size-5 text-saffron" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg leading-tight font-semibold">AI Mutfak Asistanı</p>
                <p className="truncate text-xs text-paper/75">{recipe ? `Tarif: ${recipe.title}` : "Tarif arşivimizden önerir, uydurmaz."}</p>
              </div>
              {messages.length > 0 && (
                <button onClick={clear} className="grid size-10 place-items-center rounded-full hover:bg-paper/10" aria-label="Sohbeti temizle" title="Sohbeti temizle">
                  <Eraser className="size-[18px]" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-paper/10" aria-label="Kapat">
                <X className="size-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
              <Bubble role="assistant">{recipe ? `${recipe.title} hakkında ne merak ediyorsun? İkame, porsiyon, eşlikçi… hepsini sorabilirsin.` : GREETING}</Bubble>

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {(recipe ? RECIPE_QUICK.map((t) => ({ label: t, text: t })) : QUICK_ACTIONS).map((q) => (
                    <button key={q.label} onClick={() => send(q.text)} className="rounded-full border border-line bg-paper px-3.5 py-2 text-left text-sm text-ink-soft transition hover:border-olive/50 hover:text-olive">
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <Bubble key={m.id} role="user">
                    {m.content}
                  </Bubble>
                ) : (
                  <Bubble key={m.id} role="assistant">
                    {m.payload && "intent" in m.payload ? <AssistantMessage response={m.payload as ChatResponse} /> : <p>{m.content}</p>}
                  </Bubble>
                ),
              )}

              {loading && (
                <Bubble role="assistant">
                  <span className="flex items-center gap-1.5 py-1" aria-label="Asistan yazıyor">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-2 animate-bounce rounded-full bg-sage" style={{ animationDelay: `${i * 120}ms` }} />
                    ))}
                  </span>
                </Bubble>
              )}
            </div>

            {messages.length > 0 && recipe && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
                {RECIPE_QUICK.map((t) => (
                  <button key={t} onClick={() => send(t)} className="shrink-0 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink-soft hover:text-olive">
                    {t}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="safe-bottom border-t border-line bg-paper p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  maxLength={1000}
                  placeholder={recipe ? "Bu tarifle ilgili sor…" : "Örn. Dolabımda yumurta, ıspanak ve peynir var…"}
                  className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-[15px] focus:border-olive focus:ring-4 focus:ring-olive/10 focus:outline-none"
                  aria-label="Mesajın"
                />
                <button type="submit" disabled={!input.trim() || loading} className="grid size-12 shrink-0 place-items-center rounded-full bg-tomato text-paper transition hover:bg-tomato-600 disabled:opacity-40" aria-label="Gönder">
                  <SendHorizontal className="size-5" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">Besin değerleri tarif arşivimizden gelir. Tıbbi tavsiye değildir.</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-3xl px-4 py-3 text-[15px]",
          role === "user" ? "rounded-br-lg bg-olive text-paper" : "w-full rounded-bl-lg border border-line/70 bg-paper text-ink shadow-soft",
        )}
      >
        {children}
      </div>
    </div>
  );
}
