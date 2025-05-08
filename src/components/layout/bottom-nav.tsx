"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, isActivePath } from "./nav-links";
import { useShopping } from "@/components/providers/shopping-provider";
import { cn } from "@/lib/utils";

const ITEMS = MAIN_NAV.filter((n) => n.href !== "/about");

/** Mobil alt menü: Ana Sayfa · Tarifler · Dolabım · Plan · Liste — ıslak/unlu elle kullanılabilecek büyük hedefler. */
export function BottomNav() {
  const pathname = usePathname();
  const { count, ready } = useShopping();
  if (pathname.startsWith("/admin")) return null;
  return (
    <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden" aria-label="Alt menü">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const label = "short" in item ? item.short : item.label;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition", active ? "text-olive" : "text-muted")}
                aria-current={active ? "page" : undefined}
              >
                <span className={cn("grid h-8 w-12 place-items-center rounded-full transition", active && "bg-olive-50")}>
                  <Icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                </span>
                {label}
                {item.href === "/shopping-list" && ready && count > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-tomato px-1 text-[10px] font-bold text-paper">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
