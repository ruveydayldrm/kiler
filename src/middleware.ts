import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Birinci savunma hattı: /admin ve /account rotaları. İkinci kontrol her sayfada sunucuda yapılır
// (bkz. requireAdmin / requireUser).
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
