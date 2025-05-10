"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, ListChecks, CalendarDays } from "lucide-react";
import { useAssistant } from "@/components/providers/assistant-provider";

const EXAMPLES = ["Glutensiz bir kahvaltı öner, 4 kişiyiz", "Mercimek çorbası var mı?", "Tereyağı yerine zeytinyağı kullanabilir miyim?", "Bu hafta et yemeden 1800 kaloriyle beslenmek istiyorum"];

export function AiSection() {
  const assistant = useAssistant();
  const [text, setText] = useState("");

  return (
    <section className="container-page">
      <div className="relative overflow-hidden rounded-[32px] bg-olive px-6 py-12 text-paper sm:px-12 lg:py-16">
        <div className="bg-grain absolute inset-0 opacity-30" aria-hidden />
        <div className="absolute -top-20 -right-20 size-72 rounded-full border-[24px] border-paper/5" aria-hidden />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-sage/25 blur-2xl" aria-hidden />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1.5 text-xs font-bold tracking-wider text-saffron uppercase">
              <Sparkles className="size-3.5" /> AI Mutfak Asistanı
            </p>
            <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-5xl">Ne pişireceğine karar veremedin mi?</h2>
            <p className="mt-4 max-w-lg text-lg text-paper/80">Malzemelerini, süreni ve diyetini söyle; sana uygun tarifleri bulalım.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assistant.ask(text || "Akşama 30 dakikada hazırlanan, 500 kalorinin altında, etsiz bir şey");
                setText("");
              }}
              className="mt-8 flex flex-col gap-2 rounded-[24px] bg-paper p-2 sm:flex-row"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Örneğin: Akşama 30 dakikada hazırlanan, 500 kalorinin altında, etsiz bir şey…"
                className="h-13 flex-1 rounded-2xl bg-transparent px-4 text-[15px] text-ink placeholder:text-muted focus:outline-none"
                aria-label="Asistana sor"
              />
              <button className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-tomato px-6 font-semibold text-paper transition hover:bg-tomato-600">
                <Sparkles className="size-4" /> AI ile Bul
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => assistant.ask(ex)} className="rounded-full border border-paper/20 px-3.5 py-1.5 text-sm text-paper/85 transition hover:bg-paper/10">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <ul className="grid gap-3">
            {[
              { icon: ShieldCheck, t: "Uydurmaz", d: "Yalnızca tarif arşivimizdeki tarifleri önerir; kalori ve besin değerleri veritabanından gelir." },
              { icon: ListChecks, t: "Eksikleri bilir", d: "Eşleşme yüzdesini gösterir, eksik malzemeleri onayınla listene ekler." },
              { icon: CalendarDays, t: "Haftanı planlar", d: "Kalori hedefine ve diyetine göre plan taslağı çıkarır, sen onaylarsın." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-4 rounded-2xl bg-paper/[0.07] p-4 ring-1 ring-paper/10">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-saffron text-ink">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-0.5 text-sm text-paper/70">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
