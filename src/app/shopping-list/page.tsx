import type { Metadata } from "next";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";

export const metadata: Metadata = {
  title: "Alışveriş Listesi",
  description: "Reyonlara göre gruplu, tariflerden otomatik birleştirilen alışveriş listen.",
  robots: { index: false },
};

export default function ShoppingListPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8">
        <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">Alışveriş listesi</p>
        <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">Markete hazır mısın?</h1>
        <p className="mt-2 max-w-2xl text-muted">Reyonlara göre gruplu; aynı malzeme farklı tariflerden gelse de tek satırda birleşir. Aldıklarına dokun, en alta insin.</p>
      </header>
      <ShoppingListView />
    </div>
  );
}
