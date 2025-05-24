import Link from "next/link";
import { CalendarDays, MessageSquare, ShoppingBasket, Users, UserCheck, UtensilsCrossed } from "lucide-react";
import { ActiveUsersChart, BarList } from "@/components/admin/charts";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { activeUsersSeries, categoryViews, getDashboardStats, searchedIngredients, topRecipesBy } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Gösterge paneli" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, week, month, cats, ingredients, viewed, favorited, cooked] = await Promise.all([
    getDashboardStats(),
    activeUsersSeries(7),
    activeUsersSeries(30),
    categoryViews(30),
    searchedIngredients(30, 8),
    topRecipesBy("views", 30, 5),
    topRecipesBy("favorites", 90, 5),
    topRecipesBy("cooked", 30, 5),
  ]);
  const tiles = [
    { label: "Yayındaki tarif", value: stats.totalRecipes, icon: UtensilsCrossed },
    { label: "Toplam kullanıcı", value: stats.totalUsers, icon: Users },
    { label: "Aktif kullanıcı (7 gün)", value: stats.active7, icon: UserCheck },
    { label: "Bugünkü alışveriş listesi", value: stats.listsToday, icon: ShoppingBasket },
    { label: "Bugünkü yemek planı", value: stats.plansToday, icon: CalendarDays },
    { label: "Gizlenmiş yorum", value: stats.reviewsPending, icon: MessageSquare },
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Gösterge paneli</h1>
        <p className="text-muted">Kiler'de bugün neler oluyor?</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <Icon className="size-5 text-olive" aria-hidden />
            <p className="mt-2 font-serif text-3xl font-semibold tabular-nums">{formatNumber(value)}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <ActiveUsersChart week={week} month={month} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <BarList title="Kategori bazlı görüntülenme (30 gün)" items={cats.map((c) => ({ label: c.name, value: c.views }))} unit="görüntülenme" />
        </Card>
        <Card className="p-5">
          <BarList title="En çok aranan malzemeler (30 gün)" items={ingredients.map((i) => ({ label: i.name, value: i.count }))} unit="arama" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: "En çok görüntülenen (30 gün)", rows: viewed, unit: "görüntülenme" },
          { title: "En çok favorilenen", rows: favorited, unit: "favori" },
          { title: "En çok yapılan (30 gün)", rows: cooked, unit: "kez" },
        ].map((t) => (
          <Card key={t.title} className="p-5">
            <h2 className="mb-3 font-sans text-base font-bold">{t.title}</h2>
            <ol className="space-y-2">
              {t.rows.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream-200 text-xs font-bold">{i + 1}</span>
                  <Link href={`/recipes/${r.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-olive">
                    {r.title}
                  </Link>
                  <span className="shrink-0 tabular-nums text-muted">
                    {r.count} {t.unit}
                  </span>
                </li>
              ))}
              {!t.rows.length && <li className="text-sm text-muted">Veri yok.</li>}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
