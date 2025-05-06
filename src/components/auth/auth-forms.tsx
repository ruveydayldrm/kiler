"use client";

import { useRef } from "react";
import Link from "next/link";
import { KeyRound, Shield, Sprout, WheatOff, Dumbbell, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useFormAction } from "@/hooks/use-form-action";
import { loginAction, registerAction } from "@/app/(auth)/actions";

const DEMO_ACCOUNTS = [
  { email: "admin@kiler.app", password: "Admin123!", label: "Yönetici", note: "Admin paneli + AI admin asistanı", icon: Shield },
  { email: "demo@kiler.app", password: "Demo123!", label: "Demo kullanıcı", note: "Dolabı, listesi ve planı dolu", icon: UserRound },
  { email: "vegan@kiler.app", password: "Demo123!", label: "Vegan", note: "Yalnızca vegan öneriler", icon: Sprout },
  { email: "glutensiz@kiler.app", password: "Demo123!", label: "Glutensiz", note: "Gluten alerjisi — sert filtre", icon: WheatOff },
  { email: "protein@kiler.app", password: "Demo123!", label: "Yüksek protein", note: "Kuruyemiş alerjisi, 2400 kcal", icon: Dumbbell },
];

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const { state, onSubmit, pending } = useFormAction(loginAction);
  const formRef = useRef<HTMLFormElement>(null);

  const fill = (email: string, password: string) => {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = email;
    (form.elements.namedItem("password") as HTMLInputElement).value = password;
    form.requestSubmit();
  };

  return (
    <div className="space-y-8">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {state.message && <p className="rounded-2xl bg-tomato-50 px-4 py-3 text-sm font-medium text-tomato-600" role="alert">{state.message}</p>}
        <Field label="E-posta" htmlFor="email" error={state.errors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!state.errors?.email} aria-describedby="email-error" />
        </Field>
        <Field label="Şifre" htmlFor="password" error={state.errors?.password}>
          <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={!!state.errors?.password} aria-describedby="password-error" />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Giriş yap
        </Button>
        <p className="text-center text-sm text-muted">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-semibold text-olive hover:underline">
            Kayıt ol
          </Link>
        </p>
      </form>

      <div className="rounded-3xl border border-dashed border-saffron/60 bg-saffron-50/60 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#8a5a0f]">
          <KeyRound className="size-4" /> Demo hesaplar — tek tıkla giriş
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map(({ email, password, label, note, icon: Icon }) => (
            <li key={email}>
              <button
                type="button"
                onClick={() => fill(email, password)}
                disabled={pending}
                className="flex w-full items-start gap-3 rounded-2xl bg-paper p-3 text-left shadow-soft transition hover:ring-2 hover:ring-olive/30 disabled:opacity-60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-olive-50 text-olive">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block truncate text-xs text-muted">{email}</span>
                  <span className="block text-xs text-muted">{note}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[#8a5a0f]">Şifreler: yönetici <code className="font-bold">Admin123!</code>, diğerleri <code className="font-bold">Demo123!</code></p>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const { state, onSubmit, pending } = useFormAction(registerAction);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {state.message && <p className="rounded-2xl bg-tomato-50 px-4 py-3 text-sm font-medium text-tomato-600" role="alert">{state.message}</p>}
      <Field label="Adın" htmlFor="name" error={state.errors?.name}>
        <Input id="name" name="name" autoComplete="name" defaultValue={state.values?.name} aria-invalid={!!state.errors?.name} />
      </Field>
      <Field label="E-posta" htmlFor="email" error={state.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!state.errors?.email} />
      </Field>
      <Field label="Şifre" htmlFor="password" error={state.errors?.password} hint="En az 8 karakter ve bir rakam">
        <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!state.errors?.password} />
      </Field>
      <Field label="Şifre (tekrar)" htmlFor="confirm" error={state.errors?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!state.errors?.confirm} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Hesap oluştur
      </Button>
      <p className="text-center text-sm text-muted">
        Zaten üye misin?{" "}
        <Link href="/login" className="font-semibold text-olive hover:underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
