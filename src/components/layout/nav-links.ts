import { CalendarDays, House, Info, Refrigerator, ShoppingBasket, UtensilsCrossed } from "lucide-react";

export const MAIN_NAV = [
  { href: "/", label: "Ana Sayfa", icon: House },
  { href: "/recipes", label: "Tarifler", icon: UtensilsCrossed },
  { href: "/pantry", label: "Dolabımda Ne Var?", short: "Dolabım", icon: Refrigerator },
  { href: "/planner", label: "Yemek Planı", short: "Plan", icon: CalendarDays },
  { href: "/shopping-list", label: "Alışveriş Listesi", short: "Liste", icon: ShoppingBasket },
  { href: "/about", label: "Hakkımızda", icon: Info },
] as const;

export const isActivePath = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
