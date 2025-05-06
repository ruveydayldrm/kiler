import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Kayıt ol", robots: { index: false } };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <AuthShell title="Mutfağına hoş geldin" subtitle="Ücretsiz hesap oluştur; dolabını, listeni ve planını her cihazda yanında taşı.">
      <RegisterForm />
    </AuthShell>
  );
}
