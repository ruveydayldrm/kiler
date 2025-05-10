import { Dumbbell, Leaf, Sprout, WheatOff, MilkOff, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIETS, type DietKey } from "@/lib/constants";

const META: Record<DietKey, { icon: typeof Leaf; tone: "olive" | "sage" | "saffron" | "tomato" | "neutral" }> = {
  vegan: { icon: Sprout, tone: "olive" },
  vegetarian: { icon: Leaf, tone: "sage" },
  "gluten-free": { icon: WheatOff, tone: "saffron" },
  "lactose-free": { icon: MilkOff, tone: "neutral" },
  "low-carb": { icon: Flame, tone: "tomato" },
  "high-protein": { icon: Dumbbell, tone: "olive" },
};

/** Vegan olan tarifte "vejetaryen" rozeti gereksiz tekrar olur — gizlenir. */
export function visibleDiets(diets: DietKey[]) {
  return diets.filter((d) => !(d === "vegetarian" && diets.includes("vegan")));
}

export function DietBadges({ diets, max = 3, size = "sm" }: { diets: DietKey[]; max?: number; size?: "sm" | "md" }) {
  const list = visibleDiets(diets);
  return (
    <div className="flex flex-wrap gap-1">
      {list.slice(0, max).map((d) => {
        const { icon: Icon, tone } = META[d];
        return (
          <Badge key={d} tone={tone} size={size}>
            <Icon aria-hidden /> {DIETS.find((x) => x.key === d)!.short}
          </Badge>
        );
      })}
      {list.length > max && (
        <Badge tone="neutral" size={size}>
          +{list.length - max}
        </Badge>
      )}
    </div>
  );
}
