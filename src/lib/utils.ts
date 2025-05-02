import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Türkçe karakterleri ASCII'ye çevirip URL dostu slug üretir. */
export function slugify(input: string) {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export const formatNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits }).format(n);

export const formatDate = (d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Intl.DateTimeFormat("tr-TR", opts).format(typeof d === "string" ? new Date(d) : d);

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export function pluralize(n: number, word: string) {
  // Türkçede sayıdan sonra isim tekil kalır: "3 tarif"
  return `${formatNumber(n)} ${word}`;
}

export function initials(name?: string | null) {
  if (!name) return "K";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase("tr-TR"))
    .join("");
}

export function startOfWeek(date = new Date()) {
  // Pazartesi 00:00 UTC — plan haftaları saat diliminden bağımsız tutulur.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7; // 0 = Pazartesi
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
