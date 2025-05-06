import type { NextAuthConfig } from "next-auth";

// Edge uyumlu yapılandırma (middleware burada çalışır). Veritabanı erişimi YOK.
// Sağlayıcılar ve şifre doğrulaması src/lib/auth.ts içinde.

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user;
      if (pathname.startsWith("/admin")) {
        if (!user) return false; // → giriş sayfası
        if (user.role !== "ADMIN") return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (pathname.startsWith("/account")) return !!user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
