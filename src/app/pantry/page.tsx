import type { Metadata } from "next";
import { PantryFinder } from "@/components/pantry/pantry-finder";

export const metadata: Metadata = {
  title: "Dolabımda Ne Var?",
  description: "Elindeki malzemeleri seç; hemen yapabileceğin ve 1-2 eksikle yapabileceğin tarifleri eşleşme yüzdesiyle gör.",
  alternates: { canonical: "/pantry" },
};

export default async function PantryPage({ searchParams }: { searchParams: Promise<{ i?: string; t?: string }> }) {
  const { i, t } = await searchParams;
  const initial = (i ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s))
    .slice(0, 50);
  const time = Number(t);
  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">Dolabımda ne var?</p>
        <h1 className="mt-1 text-4xl font-semibold text-balance sm:text-5xl">Elindekilerle bugün ne pişer?</h1>
        <p className="mt-3 text-lg text-muted">Malzemelerini seç; eşleşme yüzdesiyle hemen yapabileceklerini ve 1-2 eksikle yapabileceklerini gösterelim. Eksikler tek tıkla listende.</p>
      </header>
      <PantryFinder initialIngredients={initial} initialTime={[15, 30, 45, 60].includes(time) ? time : undefined} />
    </div>
  );
}
