"use client";

import { useState } from "react";
import Link from "next/link";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check, Copy, MessageCircle, MoreHorizontal, Plus, Printer, Refrigerator, Share2, ShoppingBasket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { useShopping } from "@/components/providers/shopping-provider";
import { useUser } from "@/components/providers/user-provider";
import { useLexicon } from "@/components/pantry/ingredient-picker";
import { groupByAisle, shoppingListText } from "@/lib/shopping";
import { formatAmount, UNIT_KEYS } from "@/lib/units";
import type { AisleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ShoppingListView() {
  const shopping = useShopping();
  const user = useUser();
  const lexicon = useLexicon();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("adet");
  const [error, setError] = useState<string>();

  const groups = groupByAisle(shopping.items);
  const checkedCount = shopping.items.filter((i) => i.checked).length;
  const text = shoppingListText(shopping.items);

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError("Ürün adı yaz.");
    const q = qty ? Number(qty.replace(",", ".")) : null;
    if (qty && (!Number.isFinite(q) || q! <= 0)) return setError("Miktar pozitif bir sayı olmalı.");
    setError(undefined);
    const slug = lexicon?.resolve(n);
    const entry = slug ? lexicon?.entries.get(slug) : undefined;
    await shopping.addItems(
      [{ ingredientSlug: entry?.slug, name: entry?.name ?? n.charAt(0).toLocaleUpperCase("tr-TR") + n.slice(1), quantity: q, unit: q ? unit : null, aisle: (entry?.aisle as AisleKey) ?? "OTHER" }],
      { message: `${entry?.name ?? n} listene eklendi.` },
    );
    setName("");
    setQty("");
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Alışveriş listem", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Liste panoya kopyalandı.");
      }
    } catch {
      /* iptal */
    }
  };

  if (!shopping.ready) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <form onSubmit={addManual} className="no-print rounded-[var(--radius-card)] border border-line/70 bg-paper p-3 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elle ürün ekle: ör. deterjan, 2 kg domates…"
              className="h-13 flex-1 rounded-2xl bg-cream px-4 text-[15px] focus:ring-4 focus:ring-olive/10 focus:outline-none"
              aria-label="Ürün adı"
              list="ingredient-names"
            />
            <div className="flex gap-2">
              <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="Miktar" className="h-13 w-24 rounded-2xl bg-cream px-4 text-[15px] focus:outline-none" aria-label="Miktar" />
              <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-13 w-36 rounded-2xl border-0 bg-cream" aria-label="Birim">
                {UNIT_KEYS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
              <Button type="submit" size="icon-lg" className="size-13 shrink-0 rounded-2xl" aria-label="Ekle">
                <Plus />
              </Button>
            </div>
          </div>
          <datalist id="ingredient-names">
            {lexicon && [...lexicon.entries.values()].map((e) => <option key={e.slug} value={e.name} />)}
          </datalist>
          {error && <p className="mt-2 px-1 text-sm text-tomato-600">{error}</p>}
        </form>

        {shopping.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBasket />}
            title="Sepetin bomboş, mutfağın sakin"
            description="Bir tarifte “Eksiklerimi listeye ekle”ye dokun ya da haftalık planından listeyi tek tıkla oluştur. Elle de ekleyebilirsin."
            action={
              <>
                <Link href="/pantry" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
                  Dolabımda ne var?
                </Link>
                <Link href="/planner" className="inline-flex h-11 items-center rounded-full border border-line bg-paper px-5 font-semibold">
                  Haftalık plan
                </Link>
              </>
            }
          />
        ) : (
          groups.map((g) => (
            <section key={g.key} aria-labelledby={`aisle-${g.key}`} className="print-break">
              <h2 id={`aisle-${g.key}`} className="mb-2 flex items-center justify-between font-sans text-sm font-bold tracking-wider text-muted uppercase">
                {g.label}
                <span className="text-xs font-semibold normal-case">
                  {g.items.filter((i) => !i.checked).length}/{g.items.length}
                </span>
              </h2>
              <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper">
                {g.items.map((item) => (
                  <li key={item.id} className="flex items-center border-b border-line/60 last:border-0">
                    <button
                      onClick={() => shopping.toggle(item.id)}
                      className="flex min-h-16 flex-1 items-center gap-4 px-4 py-2.5 text-left"
                      aria-pressed={item.checked}
                      aria-label={`${item.name} ${item.checked ? "alınmadı olarak işaretle" : "alındı olarak işaretle"}`}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 transition", item.checked ? "border-olive bg-olive text-paper" : "border-line")}>
                        {item.checked && <Check className="size-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[16px] font-semibold transition", item.checked && "text-muted line-through")}>{item.name}</span>
                        {item.sources.length > 0 && <span className="block truncate text-xs text-muted">{item.sources.map((s) => s.title).join(" · ")}</span>}
                      </span>
                      <span className={cn("shrink-0 text-[15px] font-semibold tabular-nums", item.checked ? "text-muted" : "text-ink")}>{formatAmount(item.quantity, item.unit)}</span>
                    </button>
                    <button onClick={() => shopping.remove(item.id)} className="no-print mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-tomato-50 hover:text-tomato" aria-label={`${item.name} sil`}>
                      <X className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {shopping.items.length > 0 && (
        <aside className="no-print space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-5">
            <p className="font-serif text-3xl font-semibold">{shopping.count}</p>
            <p className="text-sm text-muted">alınacak ürün · {checkedCount} alındı</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
              <div className="h-full rounded-full bg-olive transition-all" style={{ width: `${(checkedCount / shopping.items.length) * 100}%` }} />
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={shopping.moveCheckedToPantry} disabled={!checkedCount}>
            <Refrigerator /> Alınanları dolaba aktar
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={share}>
              <Share2 /> Paylaş
            </Button>
            <Button variant="secondary" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(text).catch(() => {});
                toast.success("Liste panoya kopyalandı.");
              }}
            >
              <Copy /> Kopyala
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer /> Yazdır
            </Button>
          </div>
          <DM.Root>
            <DM.Trigger className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-muted hover:bg-cream-200">
              <MoreHorizontal className="size-4" /> Listeyi temizle
            </DM.Trigger>
            <DM.Portal>
              <DM.Content className="z-50 min-w-56 rounded-2xl border border-line bg-paper p-2 shadow-lift" sideOffset={6}>
                <DM.Item onSelect={shopping.clearChecked} disabled={!checkedCount} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-cream-200">
                  <Check className="size-4" /> Alınanları temizle
                </DM.Item>
                <DM.Item onSelect={shopping.clearAll} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-tomato-600 outline-none data-[highlighted]:bg-tomato-50">
                  <Trash2 className="size-4" /> Tüm listeyi temizle
                </DM.Item>
              </DM.Content>
            </DM.Portal>
          </DM.Root>
          {!user && (
            <p className="rounded-2xl bg-saffron-50 p-3 text-xs text-[#7a5210]">
              Listen bu cihazda saklanıyor.{" "}
              <Link href="/login?callbackUrl=/shopping-list" className="font-semibold underline">
                Giriş yap
              </Link>
              , her cihazda yanında olsun.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
