"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DM from "@radix-ui/react-dropdown-menu";
import * as RD from "@radix-ui/react-dialog";
import { Heart, LayoutDashboard, LogOut, Menu, Search, Settings2, ShoppingBasket, UserRound } from "lucide-react";
import { Logo } from "./logo";
import { MAIN_NAV, isActivePath } from "./nav-links";
import { SearchDialog } from "./search-dialog";
import { SheetContent } from "@/components/ui/dialog";
import { useUser } from "@/components/providers/user-provider";
import { useShopping } from "@/components/providers/shopping-provider";
import { signOutAction } from "@/app/(auth)/actions";
import { cn, initials } from "@/lib/utils";

const iconBtn = "relative grid size-11 place-items-center rounded-full text-ink-soft transition hover:bg-olive-50 hover:text-olive";

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const { count, ready } = useShopping();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" ile hızlı arama
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className={cn("sticky top-0 z-40 transition-all duration-300", scrolled ? "border-b border-line/70 bg-cream/90 backdrop-blur-md" : "bg-cream")}>
      <div className="container-page flex h-16 items-center gap-3 lg:h-[72px]">
        <RD.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <RD.Trigger className={cn(iconBtn, "-ml-2 lg:hidden")} aria-label="Menüyü aç">
            <Menu className="size-6" />
          </RD.Trigger>
          <SheetContent title="Menü" side="left">
            <nav className="flex flex-col p-3" aria-label="Mobil menü">
              {MAIN_NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-13 items-center gap-3 rounded-2xl px-4 text-base font-medium",
                    isActivePath(pathname, href) ? "bg-olive-50 text-olive" : "text-ink-soft hover:bg-cream-200",
                  )}
                >
                  <Icon className="size-5" /> {label}
                </Link>
              ))}
              <div className="my-3 border-t border-line" />
              {user ? (
                <>
                  <Link href="/account" className="flex min-h-13 items-center gap-3 rounded-2xl px-4 text-ink-soft hover:bg-cream-200">
                    <UserRound className="size-5" /> Hesabım
                  </Link>
                  <Link href="/account/favorites" className="flex min-h-13 items-center gap-3 rounded-2xl px-4 text-ink-soft hover:bg-cream-200">
                    <Heart className="size-5" /> Favorilerim
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="flex min-h-13 items-center gap-3 rounded-2xl px-4 text-ink-soft hover:bg-cream-200">
                      <LayoutDashboard className="size-5" /> Yönetim Paneli
                    </Link>
                  )}
                  <form action={signOutAction}>
                    <button className="flex min-h-13 w-full items-center gap-3 rounded-2xl px-4 text-tomato-600 hover:bg-tomato-50">
                      <LogOut className="size-5" /> Çıkış yap
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="mx-1 mt-1 inline-flex h-12 items-center justify-center rounded-full bg-olive font-semibold text-paper">
                  Giriş yap / Kayıt ol
                </Link>
              )}
            </nav>
          </SheetContent>
        </RD.Root>

        <Logo />

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {MAIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-[15px] font-medium transition",
                isActivePath(pathname, href) ? "text-olive" : "text-ink-soft hover:text-olive",
              )}
            >
              {label}
              {isActivePath(pathname, href) && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-tomato" />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <button className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Ara (kısayol: /)">
            <Search className="size-5" />
          </button>
          <Link href={user ? "/account/favorites" : "/login?callbackUrl=/account/favorites"} className={cn(iconBtn, "hidden sm:grid")} aria-label="Favorilerim">
            <Heart className="size-5" />
          </Link>
          <Link href="/shopping-list" className={iconBtn} aria-label={`Alışveriş listesi${ready && count ? `, ${count} ürün` : ""}`}>
            <ShoppingBasket className="size-5" />
            {ready && count > 0 && (
              <span className="absolute top-1 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-tomato px-1 text-[11px] font-bold text-paper ring-2 ring-cream">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {user ? (
            <DM.Root>
              <DM.Trigger className="ml-1 grid size-10 place-items-center rounded-full bg-olive text-sm font-bold text-paper ring-offset-2 ring-offset-cream transition hover:ring-2 hover:ring-olive/30" aria-label="Hesap menüsü">
                {initials(user.name)}
              </DM.Trigger>
              <DM.Portal>
                <DM.Content align="end" sideOffset={8} className="z-50 min-w-60 rounded-2xl border border-line bg-paper p-2 shadow-lift">
                  <div className="px-3 py-2">
                    <p className="font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <DM.Separator className="my-1 h-px bg-line" />
                  {[
                    { href: "/account", label: "Hesabım", icon: UserRound },
                    { href: "/account/preferences", label: "Mutfak tercihlerim", icon: Settings2 },
                    { href: "/account/favorites", label: "Favorilerim", icon: Heart },
                    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Yönetim paneli", icon: LayoutDashboard }] : []),
                  ].map(({ href, label, icon: Icon }) => (
                    <DM.Item key={href} asChild>
                      <Link href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft outline-none data-[highlighted]:bg-cream-200 data-[highlighted]:text-ink">
                        <Icon className="size-4" /> {label}
                      </Link>
                    </DM.Item>
                  ))}
                  <DM.Separator className="my-1 h-px bg-line" />
                  <form action={signOutAction}>
                    <DM.Item asChild>
                      <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-tomato-600 outline-none data-[highlighted]:bg-tomato-50">
                        <LogOut className="size-4" /> Çıkış yap
                      </button>
                    </DM.Item>
                  </form>
                </DM.Content>
              </DM.Portal>
            </DM.Root>
          ) : (
            <Link href="/login" className="ml-1 hidden h-10 items-center rounded-full bg-olive px-4 text-sm font-semibold text-paper transition hover:bg-olive-600 sm:inline-flex">
              Giriş yap
            </Link>
          )}
          {!user && (
            <Link href="/login" className={cn(iconBtn, "sm:hidden")} aria-label="Giriş yap">
              <UserRound className="size-5" />
            </Link>
          )}
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
