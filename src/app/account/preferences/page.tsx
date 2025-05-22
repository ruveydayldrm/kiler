import type { Metadata } from "next";
import { PreferencesForm } from "@/components/account/account-forms";
import { requireUser } from "@/lib/auth";
import { getUserKitchen } from "@/lib/recipes";

export const metadata: Metadata = { title: "Mutfak Tercihlerim", robots: { index: false } };

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser("/account/preferences");
  const [kitchen, { welcome }] = await Promise.all([getUserKitchen(user.id), searchParams]);
  return <PreferencesForm kitchen={kitchen} welcome={welcome === "1"} />;
}
