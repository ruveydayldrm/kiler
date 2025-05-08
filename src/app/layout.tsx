import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/recipes";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { siteUrl } from "@/lib/utils";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap", axes: ["opsz", "SOFT"] });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "Elindeki malzemelere göre tarif bul, eksikleri tek tıkla alışveriş listene ekle, haftalık yemek planını yapay zekâ ile oluştur.",
  applicationName: SITE_NAME,
  keywords: ["yemek tarifi", "ne pişirsem", "dolaptaki malzemeyle tarif", "alışveriş listesi", "haftalık yemek planı", "vegan tarifler", "glutensiz tarifler"],
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const favoriteIds = await getFavoriteIds(user?.id);
  return (
    <html lang="tr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <AppProviders user={user} favoriteIds={favoriteIds}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-olive focus:px-4 focus:py-2 focus:text-paper">
            İçeriğe geç
          </a>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <ChatWidget />
        </AppProviders>
      </body>
    </html>
  );
}
