import Link from "next/link";
import { Plus } from "lucide-react";
import { RecipeRowActions } from "@/components/admin/recipe-row-actions";
import { RecipeThumb } from "@/components/recipes/recipe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fold } from "@/lib/matching";

export const metadata = { title: "Tarifler" };
export const dynamic = "force-dynamic";

export default async function AdminRecipesPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  await requireAdmin();
  const { q, filter } = await searchParams;
  const all = await db.recipe.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, imageUrl: true, coverColor: true, calories: true, featured: true, published: true, viewCount: true, ratingAvg: true, category: { select: { name: true } } },
  });
  let rows = q ? all.filter((r) => fold(r.title).includes(fold(q))) : all;
  if (filter === "no-image") rows = rows.filter((r) => !r.imageUrl);
  if (filter === "no-nutrition") rows = rows.filter((r) => r.calories == null);
  if (filter === "draft") rows = rows.filter((r) => !r.published);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Tarifler</h1>
          <p className="text-muted">{all.length} tarif</p>
        </div>
        <Link href="/admin/recipes/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-olive px-5 font-semibold text-paper">
          <Plus className="size-4" /> Yeni tarif
        </Link>
      </header>

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Tarif ara…" className="h-11 min-w-60 flex-1 rounded-full border border-line bg-paper px-4 focus:outline-none" aria-label="Tarif ara" />
        {[
          { v: "", l: "Tümü" },
          { v: "no-image", l: "Görseli yok" },
          { v: "no-nutrition", l: "Besin değeri eksik" },
          { v: "draft", l: "Taslak" },
        ].map((f) => (
          <button key={f.v} name="filter" value={f.v} className={`h-11 rounded-full px-4 text-sm font-semibold ${(filter ?? "") === f.v ? "bg-ink text-paper" : "border border-line bg-paper"}`}>
            {f.l}
          </button>
        ))}
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="p-3">Tarif</th>
              <th className="p-3">Kategori</th>
              <th className="p-3 text-right">Kalori</th>
              <th className="p-3 text-right">Görüntülenme</th>
              <th className="p-3">Durum</th>
              <th className="p-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-cream/60">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <RecipeThumb title={r.title} imageUrl={r.imageUrl} color={r.coverColor} className="size-11 rounded-xl" />
                    <div>
                      <Link href={`/admin/recipes/${r.id}`} className="font-semibold hover:text-olive">
                        {r.title}
                      </Link>
                      <p className="text-xs text-muted">/{r.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-ink-soft">{r.category.name}</td>
                <td className="p-3 text-right tabular-nums">{r.calories != null ? Math.round(r.calories) : <Badge tone="tomato">eksik</Badge>}</td>
                <td className="p-3 text-right tabular-nums">{r.viewCount}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {!r.published && <Badge tone="neutral">Taslak</Badge>}
                    {r.featured && <Badge tone="saffron">Öne çıkan</Badge>}
                    {!r.imageUrl && <Badge tone="sage">Tipografik kapak</Badge>}
                  </div>
                </td>
                <td className="p-3">
                  <RecipeRowActions id={r.id} slug={r.slug} title={r.title} featured={r.featured} published={r.published} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-muted">Sonuç yok.</p>}
      </Card>
    </div>
  );
}
