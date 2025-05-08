import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-cream-300/60", className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line/70 bg-paper shadow-soft", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-tomato">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold text-ink sm:text-[2rem] sm:leading-tight">{title}</h2>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-cream-200 text-olive [&_svg]:size-7">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  if (!value) return <span className={cn("text-xs text-muted", className)}>Henüz puan yok</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold text-ink", size === "sm" ? "text-xs" : "text-sm", className)}>
      <Star className={cn("fill-saffron text-saffron", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
      {value.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      {count != null && <span className="font-normal text-muted">({count})</span>}
      <span className="sr-only">5 üzerinden puan</span>
    </span>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper p-1" role="group" aria-label={label}>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full text-xl font-semibold text-olive transition hover:bg-olive-50 disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Azalt"
      >
        −
      </button>
      <span className="min-w-[6.5rem] text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value} {suffix}
      </span>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full text-xl font-semibold text-olive transition hover:bg-olive-50 disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Artır"
      >
        +
      </button>
    </div>
  );
}

/** Seçilebilir chip (filtreler, diyet seçimi vb.) */
export function ToggleChip({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition [&_svg]:size-4",
        active ? "border-olive bg-olive text-paper" : "border-line bg-paper text-ink-soft hover:border-olive/50 hover:text-olive",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
