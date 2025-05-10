import { Baby, CakeSlice, CookingPot, Cookie, Croissant, CupSoda, Dumbbell, Egg, Leaf, Salad, Soup, Utensils, Wheat, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  egg: Egg,
  soup: Soup,
  "cooking-pot": CookingPot,
  leaf: Leaf,
  salad: Salad,
  wheat: Wheat,
  croissant: Croissant,
  "cake-slice": CakeSlice,
  cookie: Cookie,
  "cup-soda": CupSoda,
  baby: Baby,
  dumbbell: Dumbbell,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Utensils;
  return <Icon className={className} aria-hidden />;
}

/** Kategori kartlarında kullanılan sıcak, düşük doygunluklu tonlar */
export const CATEGORY_TINTS = ["#F6E7D2", "#E9EDDA", "#F8E1D6", "#E5EBDD", "#F4EBD0", "#F1E2D0", "#EFE6D6", "#F6DCD5", "#ECE4D3", "#E3ECE6", "#F7E9DC", "#E6EAD8"];
