"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Carrot, LayoutDashboard, MessageSquare, UsersRound, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Gösterge paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/recipes", label: "Tarifler", icon: UtensilsCrossed },
  { href: "/admin/ingredients", label: "Malzemeler", icon: Carrot },
  { href: "/admin/users", label: "Kullanıcılar", icon: UsersRound },
  { href: "/admin/reviews", label: "Yorumlar", icon: MessageSquare },
  { href: "/admin/ai", label: "AI paneli", icon: Bot },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Yönetim menüsü" className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 hidden px-3 text-xs font-bold tracking-[0.14em] text-tomato uppercase lg:block">Yönetim</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition lg:rounded-2xl",
                active ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-cream-200 lg:bg-transparent",
              )}
            >
              <Icon className="size-[18px]" /> {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
