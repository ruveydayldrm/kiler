import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { loginSchema } from "./validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, role: user.role === "ADMIN" ? "ADMIN" : "USER" };
      },
    }),
  ],
});

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
}

/** Oturumdaki kullanıcı (yoksa null). Silinmiş kullanıcıya ait eski JWT'leri de eler. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
  if (!user) return null;
  return { ...user, role: user.role === "ADMIN" ? "ADMIN" : "USER" };
}

export async function requireUser(callbackUrl = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/**
 * Yönetici kontrolü — middleware'e EK olarak her admin sayfası/aksiyonunda sunucuda çağrılır.
 * Rol veritabanından okunur; JWT'deki eski rol bilgisine güvenilmez.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** API route'ları için: yönlendirme yerine null döner. */
export async function getAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}
