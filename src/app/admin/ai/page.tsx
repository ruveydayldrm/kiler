import Link from "next/link";
import { CircleCheck, CircleX, Lightbulb, Sparkles } from "lucide-react";
import { AdminChat } from "@/components/admin/admin-chat";
import { BarList } from "@/components/admin/charts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { failedSearches, ingredientCombos, mostRecommended, recentQuestions, searchedIngredients, searchInsight } from "@/lib/analytics";
import { completeJson, isAiEnabled } from "@/lib/openai";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "AI paneli" };
export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  await requireAdmin();
  const [insight, questions, ingredients, combos, recommended, failed] = await Promise.all([
    searchInsight(7),
    recentQuestions(15),
    searchedIngredients(30, 8),
    ingredientCombos(30, 6),
    mostRecommended(30, 6),
    failedSearches(30, 8),
  ]);

  // AI özeti: veriler deterministik hesaplanır, LLM yalnızca cümleyi güzelleştirir
  let summary = insight.sentence;
  if (isAiEnabled()) {
    const out = await completeJson<{ message: string }>(
      "Bir yemek platformunun yöneticisine 2 cümlelik Türkçe içgörü yaz. Yalnızca verilen verileri kullan, sayı uydurma. JSON: {\"message\": string}",
      JSON.stringify({ temel_cumle: insight.sentence, kombinasyonlar: insight.combos, malzemeler: insight.ingredients, basarisiz: insight.failed, toplam_sorgu: insight.totalQueries }),
      { temperature: 0.3, maxTokens: 200 },
    );
    if (out?.message) summary = out.message;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">AI yönetim paneli</h1>
        <p className="text-muted">Kullanıcılar ne arıyor, neyi bulamıyor? {isAiEnabled() ? <Badge tone="olive">OpenAI aktif</Badge> : <Badge tone="saffron">Demo mod (OPENAI_API_KEY yok)</Badge>}</p>
      </header>

      <Card className="flex gap-4 border-olive/20 bg-olive-50 p-5">
        <Sparkles className="size-6 shrink-0 text-olive" />
        <div>
          <p className="text-xs font-bold tracking-wider text-olive uppercase">Son 7 gün özeti</p>
          <p className="mt-1 text-lg leading-relaxed text-ink">{summary}</p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <AdminChat />
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-1 flex items-center gap-2 font-sans text-base font-bold">
              <Lightbulb className="size-4 text-saffron" /> Başarısız aramalar — içerik fırsatları
            </h2>
            <p className="mb-3 text-xs text-muted">Son 30 günde karşılık bulunamayan istekler</p>
            <ul className="divide-y divide-line">
              {failed.map((f) => (
                <li key={f.query} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate">“{f.query}”</span>
                  <span className="shrink-0 font-semibold tabular-nums">{f.count}×</span>
                </li>
              ))}
              {!failed.length && <li className="py-2 text-sm text-muted">Başarısız arama yok.</li>}
            </ul>
          </Card>
          <Card className="p-5">
            <BarList title="En çok aranan malzemeler (30 gün)" items={ingredients.map((i) => ({ label: i.name, value: i.count }))} unit="arama" />
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <BarList title="En çok aranan kombinasyonlar" items={combos.map((c) => ({ label: c.combo, value: c.count }))} unit="arama" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-sans text-base font-bold">En çok önerilen tarifler</h2>
          <ol className="space-y-2">
            {recommended.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-cream-200 text-xs font-bold">{i + 1}</span>
                <Link href={`/recipes/${r.slug}`} className="flex-1 truncate font-medium hover:text-olive">
                  {r.title}
                </Link>
                <span className="tabular-nums text-muted">{r.count} öneri</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="overflow-x-auto p-5">
        <h2 className="mb-3 font-sans text-base font-bold">AI'ye sorulan son sorular</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-2">Soru</th>
              <th className="py-2">Kullanıcı</th>
              <th className="py-2">Niyet</th>
              <th className="py-2 text-right">Sonuç</th>
              <th className="py-2">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t border-line/60">
                <td className="max-w-xs truncate py-2 pr-3">{q.query}</td>
                <td className="py-2 text-ink-soft">{q.user?.name ?? "Misafir"}</td>
                <td className="py-2">
                  <Badge size="sm">{q.intent ?? "—"}</Badge>
                </td>
                <td className="py-2 text-right">
                  <span className="inline-flex items-center gap-1">
                    {q.success ? <CircleCheck className="size-4 text-olive" aria-label="başarılı" /> : <CircleX className="size-4 text-tomato" aria-label="başarısız" />} {q.resultCount}
                  </span>
                </td>
                <td className="py-2 text-ink-soft">{formatDate(q.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
