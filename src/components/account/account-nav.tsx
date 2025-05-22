"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckCheck, Heart, MessageCircle, Refrigerator, Settings2, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Profilim", icon: UserRound },
  { href: "/account/preferences", label: "Mutfak Tercihlerim", icon: Settings2 },
  { href: "/account/pantry", label: "Dolabım", icon: Refrigerator },
  { href: "/account/favorites", label: "Favorilerim", icon: Heart },
  { href: "/account/cooked", label: "Yaptıklarım", icon: CheckCheck },
  { href: "/account/plans", label: "Yemek Planlarım", icon: CalendarDays },
  { href: "/account/reviews", label: "Yorumlarım", icon: MessageCircle },
  { href: "/account/ai", label: "AI Önerilerim", icon: Sparkles },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hesap menüsü" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition lg:h-12 lg:rounded-2xl",
              active ? "bg-olive text-paper" : "bg-paper text-ink-soft hover:bg-olive-50 hover:text-olive lg:bg-transparent",
            )}
          >
            <Icon className="size-[18px]" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
