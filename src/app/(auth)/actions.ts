"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validators";
import type { FormState } from "@/hooks/use-form-action";

/** Açık yönlendirme açığını önlemek için yalnızca site içi yollar kabul edilir. */
function safeCallback(raw: FormDataEntryValue | null) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

export async function loginAction(_prev: FormState, data: FormData): Promise<FormState> {
  const values = { email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") };
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: values.email } };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeCallback(data.get("callbackUrl")) });
  } catch (e) {
    if (e instanceof AuthError) return { message: "E-posta veya şifre hatalı.", values: { email: values.email } };
    throw e; // NEXT_REDIRECT
  } finally {
    revalidatePath("/", "layout");
  }
  return { ok: true };
}

export async function registerAction(_prev: FormState, data: FormData): Promise<FormState> {
  const values = {
    name: String(data.get("name") ?? ""),
    email: String(data.get("email") ?? ""),
    password: String(data.get("password") ?? ""),
    confirm: String(data.get("confirm") ?? ""),
  };
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { name: values.name, email: values.email } };
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { errors: { email: "Bu e-posta ile zaten bir hesap var." }, values: { name: values.name, email: values.email } };

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      preference: { create: {} },
    },
  });
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/account/preferences?welcome=1" });
  } catch (e) {
    if (e instanceof AuthError) return { message: "Hesap oluşturuldu, ancak giriş yapılamadı. Lütfen giriş yapın." };
    throw e;
  } finally {
    revalidatePath("/", "layout");
  }
  return { ok: true };
}

export async function signOutAction() {
  revalidatePath("/", "layout");
  await signOut({ redirectTo: "/" });
}
