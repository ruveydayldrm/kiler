"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/**
 * Görsel yoksa ya da yüklenemezse yemeğin rengine uygun tipografik kapak üretir.
 * Site asla kırık görsel göstermez.
 */
export function TypographicCover({ title, color, label, compact, className }: { title: string; color: string; label?: string; compact?: boolean; className?: string }) {
  const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : "#8A9A5B";
  const dark = luminance(safe) < 0.45;
  const fg = dark ? "#FFFDF9" : "#2A2620";
  return (
    <div
      className={cn("relative flex h-full w-full overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 85% 15%, ${shade(safe, 0.12)} 0%, ${safe} 45%, ${shade(safe, -0.14)} 100%)`, color: fg }}
      role="img"
      aria-label={title}
    >
      {/* tabak & çatal-bıçak motifi */}
      <svg className="absolute -right-[12%] -bottom-[18%] h-[95%] opacity-[0.16]" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="40" fill="currentColor" opacity="0.25" />
      </svg>
      <div className="bg-grain absolute inset-0 opacity-60" aria-hidden />
      {!compact && (
        <div className="relative mt-auto p-[7%]">
          {label && <p className="mb-1.5 text-[10px] font-bold tracking-[0.18em] uppercase opacity-75">{label}</p>}
          <p className="font-serif text-[clamp(1.15rem,4.2cqi,2.4rem)] leading-[1.05] font-semibold text-balance">{title}</p>
        </div>
      )}
      {compact && <span className="relative m-auto font-serif text-xl font-semibold">{title.charAt(0)}</span>}
    </div>
  );
}

export function RecipeCover({
  title,
  imageUrl,
  color,
  label,
  className,
  imgClassName,
  priority,
}: {
  title: string;
  imageUrl: string | null;
  color: string;
  label?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-cream-300 [container-type:inline-size]", className)}>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <TypographicCover title={title} color={color} label={label} className={imgClassName} />
      )}
    </div>
  );
}

export function RecipeThumb({ title, imageUrl, color, className }: { title: string; imageUrl: string | null; color: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)}>
      {imageUrl && !failed ? (
        <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <TypographicCover title={title} color={color} compact />
      )}
    </div>
  );
}
