import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Sparkles, ShoppingBasket, Recycle } from "lucide-react";
import { PlannerBoard } from "@/components/planner/planner-board";
import { getCurrentUser } from "@/lib/auth";
import { getWeekPlan, parseWeek } from "@/lib/planner-server";
import { getVisibleRecipes } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Haftalık Yemek Planı",
  description: "Haftanı sürükle-bırak ile planla, günlük kalori ve makroları takip et, alışveriş listeni tek tıkla oluştur.",
  robots: { index: false },
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await getCurrentUser();
  const header = (
    <header className="mb-8">
      <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">Yemek planı</p>
      <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">Haftanı birlikte planlayalım</h1>
      <p className="mt-2 max-w-2xl text-muted">Kahvaltıdan akşam yemeğine; günlük kalori ve makrolarını hedefinle karşılaştır, haftanın listesini tek tıkla çıkar.</p>
    </header>
  );

  if (!user) {
    return (
      <div className="container-page py-8 lg:py-12">
        {header}
        <div className="grid items-center gap-8 rounded-[32px] bg-paper p-8 shadow-soft lg:grid-cols-2 lg:p-12">
          <div>
            <h2 className="text-3xl font-semibold">Planın her cihazda yanında olsun</h2>
            <ul className="mt-6 space-y-4 text-ink-soft">
              {[
                { icon: Sparkles, t: "AI ile kalori hedefine ve diyetine uygun hafta taslağı" },
                { icon: Recycle, t: "Açılan kremayı, yoğurdu ertesi günler değerlendiren akıllı plan" },
                { icon: ShoppingBasket, t: "Tüm haftanın alışverişi tek listede, dolaptakiler düşülmüş" },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-olive-50 text-olive">
                    <Icon className="size-5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login?callbackUrl=/planner" className="inline-flex h-12 items-center rounded-full bg-olive px-6 font-semibold text-paper">
                Giriş yap
              </Link>
              <Link href="/register" className="inline-flex h-12 items-center rounded-full border border-line px-6 font-semibold">
                Ücretsiz kayıt ol
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 opacity-80" aria-hidden>
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className={`aspect-square rounded-xl ${i % 5 === 0 ? "bg-tomato/30" : i % 3 === 0 ? "bg-saffron/30" : i % 2 ? "bg-olive-100" : "bg-cream-300"}`} />
            ))}
            <CalendarDays className="col-span-7 mx-auto mt-4 size-10 text-sage" />
          </div>
        </div>
      </div>
    );
  }

  const { week } = await searchParams;
  const weekStart = parseWeek(week);
  const [plan, { visible, kitchen }] = await Promise.all([getWeekPlan(user.id, weekStart), getVisibleRecipes(user.id)]);
  const recipes = visible
    .filter((r) => r.calories != null)
    .sort((a, b) => a.title.localeCompare(b.title, "tr"))
    .map((r) => ({ id: r.id, slug: r.slug, title: r.title, categorySlug: r.categorySlug, categoryName: r.categoryName, calories: r.calories, totalMinutes: r.totalMinutes, imageUrl: r.imageUrl, coverColor: r.coverColor }));

  return (
    <div className="container-page py-8 lg:py-12">
      {header}
      <PlannerBoard key={plan.weekStart} initial={plan} recipes={recipes} kitchen={{ calorieTarget: kitchen.calorieTarget, diets: kitchen.diets, householdSize: kitchen.householdSize }} />
    </div>
  );
}
