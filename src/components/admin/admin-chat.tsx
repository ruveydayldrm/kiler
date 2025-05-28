"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Check, Eraser, SendHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-storage";
import { cn } from "@/lib/utils";
import type { AdminChatResponse, AdminProposal, ChatMessageDTO } from "@/types/ai";

const PROMPTS = [
  "Bu hafta en çok yapılan 5 tarifi göster.",
  "Besin değeri eksik olan tarifleri listele.",
  "Görseli olmayan tarifler hangileri?",
  "Kullanıcılar en çok hangi malzemeyi aradı ama tarif bulamadı?",
  "Vegan tarif sayımız kaç, hangi kategoride az?",
  "Geçen haftaya göre aktif kullanıcı nasıl değişti?",
  "Mercimek Köftesi tarifini öne çıkar",
];

function Proposal({ p }: { p: AdminProposal }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const apply = async () => {
    setState("busy");
    try {
      const { label: _label, ...action } = p;
      const res = await api<{ message: string }>("/api/admin/actions", { method: "POST", json: action });
      toast.success(res.message);
      setState("done");
    } catch (e) {
      toast.error((e as Error).message);
      setState("idle");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron/50 bg-saffron-50 p-3">
      <ShieldCheck className="size-5 text-[#8a5a0f]" />
      <p className="min-w-0 flex-1 text-sm font-medium text-[#6b480d]">Öneri: {p.label}</p>
      <Button size="sm" onClick={apply} loading={state === "busy"} disabled={state === "done"} variant={state === "done" ? "soft" : "primary"}>
        {state === "done" ? (
          <>
            <Check /> Uygulandı
          </>
        ) : (
          "Onayla"
        )}
      </Button>
    </div>
  );
}

function AdminAnswer({ r }: { r: AdminChatResponse }) {
  return (
    <div className="space-y-3">
      <p className="leading-relaxed">{r.message}</p>
      {r.table && r.table.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-cream-200/70 text-left text-xs text-muted">
              <tr>
                {r.table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-line/60">
                  {row.map((cell, j) => (
                    <td key={j} className={cn("px-3 py-2", typeof cell === "number" && "text-right tabular-nums")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.recipes && r.recipes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.recipes.map((x) => (
            <Link key={x.id} href={`/admin/recipes/${x.id}`} className="rounded-full bg-olive-50 px-3 py-1 text-xs font-semibold text-olive hover:bg-olive hover:text-paper">
              {x.title}
            </Link>
          ))}
        </div>
      )}
      {r.proposals?.map((p, i) => <Proposal key={i} p={p} />)}
      <p className="text-[11px] text-muted">{r.mode === "openai" ? "OpenAI · salt-okunur rapor" : "Demo mod · kural tabanlı salt-okunur rapor"}</p>
    </div>
  );
}

export function AdminChat() {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ messages: ChatMessageDTO[] }>("/api/chat/history?kind=ADMIN")
      .then((d) => setMessages(d.messages))
      .catch(() => {});
  }, []);
  useEffect(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), [messages, loading]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: message, createdAt: Date.now() }]);
    setLoading(true);
    try {
      const { response } = await api<{ response: AdminChatResponse }>("/api/admin/chat", { method: "POST", json: { message } });
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: response.message, payload: response, createdAt: Date.now() }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: (e as Error).message, createdAt: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper">
      <header className="flex items-center gap-3 border-b border-line bg-ink px-4 py-3 text-paper">
        <Bot className="size-5 text-saffron" />
        <div className="flex-1">
          <p className="font-semibold">AI Yönetici Asistanı</p>
          <p className="text-xs text-paper/70">Gerçek verilerle yanıtlar · değişiklikleri yalnızca öneri olarak sunar</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={async () => {
              setMessages([]);
              await api("/api/chat/history?kind=ADMIN", { method: "DELETE" }).catch(() => {});
            }}
            className="grid size-9 place-items-center rounded-full hover:bg-paper/10"
            aria-label="Sohbeti temizle"
          >
            <Eraser className="size-4" />
          </button>
        )}
      </header>
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-cream/50 p-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} className="rounded-full border border-line bg-paper px-3.5 py-2 text-left text-sm text-ink-soft hover:border-olive hover:text-olive">
                {p}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[94%] rounded-3xl px-4 py-3 text-[15px]", m.role === "user" ? "rounded-br-lg bg-ink text-paper" : "w-full rounded-bl-lg border border-line bg-paper")}>
              {m.role === "assistant" && m.payload && "report" in m.payload ? <AdminAnswer r={m.payload as AdminChatResponse} /> : m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted">Veriler sorgulanıyor…</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Ör. Bu ay en çok favorilenen 10 tarif" className="h-12 flex-1 rounded-2xl border border-line bg-cream px-4 focus:outline-none" aria-label="Yöneticiye soru" />
        <button disabled={!input.trim() || loading} className="grid size-12 place-items-center rounded-full bg-tomato text-paper disabled:opacity-40" aria-label="Gönder">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}
