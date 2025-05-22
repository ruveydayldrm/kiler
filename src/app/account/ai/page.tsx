import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { AskAssistantButton } from "@/components/chatbot/ask-assistant-button";
import { Card } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRecommendations, getRecommendationEngine } from "@/lib/recommendations";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Önerilerim", robots: { index: false } };

export default async function AiRecommendationsPage() {
  const user = await requireUser("/account/ai");
  const [recs, recent] = await Promise.all([
    getRecommendations(user.id, 6),
    db.aIQueryLog.findMany({ where: { userId: user.id, source: "CHAT" }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, query: true, createdAt: true, resultCount: true } }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Sana özel öneriler</h2>
            <p className="text-sm text-muted">Favorilerin, yaptıkların, görüntülediklerin, diyetin ve dolabına göre ({getRecommendationEngine().name}).</p>
          </div>
          <AskAssistantButton message="Bana bugün için bir şey öner">
            <Sparkles className="size-4" /> Asistana sor
          </AskAssistantButton>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {recs.map(({ recipe, reasons }) => (
            <div key={recipe.id} className="flex flex-col gap-2">
              <RecipeCard recipe={recipe} />
              {reasons.length > 0 && <p className="px-1 text-xs font-medium text-olive">✦ {reasons.slice(0, 2).join(" · ")}</p>}
            </div>
          ))}
        </div>
      </div>
      {recent.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-xl font-semibold">Son sorduklarım</h2>
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <AskAssistantButton message={r.query} className="h-auto bg-transparent px-0 text-left font-medium text-ink hover:bg-transparent hover:text-olive">
                  {r.query}
                </AskAssistantButton>
                <span className="shrink-0 text-xs text-muted">{formatDate(r.createdAt, { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
