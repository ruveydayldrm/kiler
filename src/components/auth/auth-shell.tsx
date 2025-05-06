import { Refrigerator, ShoppingBasket, CalendarDays, Sparkles } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_1.05fr] lg:py-16">
      <aside className="relative hidden overflow-hidden rounded-[28px] bg-olive p-10 text-paper lg:block">
        <div className="bg-grain absolute inset-0 opacity-40" />
        <div className="absolute -right-24 -bottom-24 size-80 rounded-full border-[18px] border-paper/10" />
        <div className="absolute -right-6 -bottom-6 size-40 rounded-full bg-tomato/80" />
        <div className="relative">
          <p className="text-sm font-bold tracking-widest text-saffron uppercase">Kiler</p>
          <h2 className="mt-3 max-w-sm text-4xl leading-tight font-semibold">Mutfaktaki akıllı yardımcın seni bekliyor.</h2>
          <ul className="mt-10 space-y-5 text-paper/85">
            {[
              { icon: Refrigerator, t: "Dolabını kaydet, eşleşen tarifleri anında gör" },
              { icon: ShoppingBasket, t: "Eksikleri reyonlara göre gruplu listeye ekle" },
              { icon: CalendarDays, t: "Haftanı planla, alışverişi tek tıkla çıkar" },
              { icon: Sparkles, t: "Alerjilerine kesin uyan AI önerileri al" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-paper/10">
                  <Icon className="size-5 text-saffron" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="mx-auto w-full max-w-md lg:py-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-2 mb-8 text-muted">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}
