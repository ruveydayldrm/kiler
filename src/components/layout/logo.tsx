import Link from "next/link";
import { cn } from "@/lib/utils";

/** Kiler logosu: buharı tüten küçük bir tencere + serif yazı */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" fill="#3F5B3A" />
      <path d="M15 9.5c-1.2 1.4 1.2 2.6 0 4M20 8.5c-1.2 1.4 1.2 2.6 0 4M25 9.5c-1.2 1.4 1.2 2.6 0 4" stroke="#E9A23B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M9 18.5h22" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 19.5h18v6.5a5.5 5.5 0 0 1-5.5 5.5h-7A5.5 5.5 0 0 1 11 26v-6.5Z" fill="#FFFDF9" />
      <path d="M7 21.5h4M29 21.5h4" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="25.5" r="2.2" fill="#D9532B" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Kiler ana sayfa">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className={cn("font-serif text-[1.65rem] leading-none font-semibold tracking-tight", light ? "text-paper" : "text-olive")}>
        Kiler<span className="text-tomato">.</span>
      </span>
    </Link>
  );
}
