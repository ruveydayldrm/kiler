import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseList } from "@/lib/json";
import { fold } from "@/lib/matching";
import { AISLES, ALLERGENS, labelOf } from "@/lib/constants";

export const metadata = { title: "Malzemeler" };
export const dynamic = "force-dynamic";

export default async function AdminIngredientsPage({ searchParams }: { searchParams: Promise<{ q?: string; aisle?: string }> }) {
  await requireAdmin();
  const { q, aisle } = await searchParams;
  const all = await db.ingredient.findMany({ orderBy: { name: "asc" }, include: { parent: { select: { name: true } }, _count: { select: { recipeIngredients: true, conversions: true } } } });
  const rows = all.filter((i) => (!q || fold(`${i.name} ${parseList(i.synonyms).join(" ")}`).includes(fold(q))) && (!aisle || i.aisle === aisle));
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Malzemeler</h1>
          <p className="text-muted">{all.length} malzeme · besin değerleri 100 g başına</p>
        </div>
        <Link href="/admin/ingredients/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-olive px-5 font-semibold text-paper">
          <Plus className="size-4" /> Yeni malzeme
        </Link>
      </header>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Ad veya eş anlamlı ara…" className="h-11 min-w-60 flex-1 rounded-full border border-line bg-paper px-4 focus:outline-none" aria-label="Malzeme ara" />
        <select name="aisle" defaultValue={aisle ?? ""} className="h-11 rounded-full border border-line bg-paper px-4" aria-label="Reyon">
          <option value="">Tüm reyonlar</option>
          {AISLES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-paper">Filtrele</button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="p-3">Malzeme</th>
              <th className="p-3">Reyon</th>
              <th className="p-3 text-right">kcal</th>
              <th className="p-3 text-right">P / K / Y</th>
              <th className="p-3">Alerjen</th>
              <th className="p-3 text-right">Tarif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-b border-line/60 last:border-0 hover:bg-cream/60">
                <td className="p-3">
                  <Link href={`/admin/ingredients/${i.id}`} className="font-semibold hover:text-olive">
                    {i.name}
                  </Link>
                  <p className="max-w-xs truncate text-xs text-muted">
                    {i.parent ? `↳ ${i.parent.name} · ` : ""}
                    {parseList(i.synonyms).slice(0, 4).join(", ")}
                  </p>
                </td>
                <td className="p-3 text-ink-soft">
                  {labelOf(AISLES, i.aisle)} {i.isBasic && <Badge size="sm">temel</Badge>}
                </td>
                <td className="p-3 text-right tabular-nums">{i.kcal}</td>
                <td className="p-3 text-right tabular-nums text-ink-soft">
                  {i.protein} / {i.carbs} / {i.fat}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {parseList(i.allergens).map((a) => (
                      <Badge key={a} tone="tomato" size="sm">
                        {labelOf(ALLERGENS, a)}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right tabular-nums">{i._count.recipeIngredients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
