import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3.5", {
  variants: {
    tone: {
      olive: "bg-olive-50 text-olive",
      sage: "bg-sage-100 text-[#5d6b34]",
      tomato: "bg-tomato-50 text-tomato-600",
      saffron: "bg-saffron-50 text-[#a26a12]",
      neutral: "bg-cream-200 text-ink-soft",
      dark: "bg-ink/80 text-paper backdrop-blur",
      light: "bg-paper/90 text-ink backdrop-blur",
    },
    size: {
      sm: "px-2 py-0.5 text-[11px]",
      md: "px-2.5 py-1 text-xs",
    },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

export function Badge({ className, tone, size, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
