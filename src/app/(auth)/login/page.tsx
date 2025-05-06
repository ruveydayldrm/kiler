import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const safe = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
  if (await getCurrentUser()) redirect(safe);
  return (
    <AuthShell title="Tekrar hoş geldin 👋" subtitle="Dolabın, listen ve planın seni bekliyor.">
      <LoginForm callbackUrl={safe} />
    </AuthShell>
  );
}
