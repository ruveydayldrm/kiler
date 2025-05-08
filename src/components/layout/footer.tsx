import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Kiler",
    links: [
      { href: "/about", label: "Hakkımızda" },
      { href: "/contact", label: "İletişim" },
      { href: "/faq", label: "Sık Sorulan Sorular" },
    ],
  },
  {
    title: "Mutfak",
    links: [
      { href: "/recipes", label: "Tüm tarifler" },
      { href: "/pantry", label: "Dolabımda ne var?" },
      { href: "/planner", label: "Haftalık plan" },
      { href: "/submit-recipe", label: "Tarif Gönder" },
    ],
  },
  {
    title: "Bilgi",
    links: [
      { href: "/nutrition", label: "Besin Değerleri Hakkında" },
      { href: "/privacy", label: "Gizlilik Politikası" },
      { href: "/terms", label: "Kullanım Koşulları" },
    ],
  },
];

// Marka ikonları lucide'dan kaldırıldığı için sade, tek renkli SVG'ler
const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", d: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.8-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 3c-2.4 0-2.7 0-3.7.1-3.3.1-5.1 2-5.2 5.2C3 9.3 3 9.6 3 12s0 2.7.1 3.7c.1 3.3 2 5.1 5.2 5.2 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c3.3-.1 5.1-2 5.2-5.2.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-3.2-1.9-5.1-5.2-5.2C14.7 3 14.4 3 12 3Zm0 1.6c2.4 0 2.6 0 3.6.1 2.4.1 3.6 1.3 3.7 3.7.1 1 .1 1.2.1 3.6s0 2.6-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-1 .1-1.2.1-3.6.1s-2.6 0-3.6-.1c-2.4-.1-3.6-1.3-3.7-3.7-.1-1-.1-1.2-.1-3.6s0-2.6.1-3.6c.1-2.4 1.3-3.6 3.7-3.7 1-.1 1.2-.1 3.6-.1Z" },
  { label: "YouTube", href: "https://youtube.com", d: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" },
  { label: "Pinterest", href: "https://pinterest.com", d: "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.5 2.1-4.5 4.4 0 .9.3 1.8.8 2.3l.1.4-.3 1.1c0 .2-.2.2-.4.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1 0-2-.5-2.4-1.2l-.6 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2Z" },
  { label: "X", href: "https://x.com", d: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z" },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-olive-700 pb-24 text-paper/85 lg:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
            Elindeki malzemeyle ne pişireceğini bul, eksiklerini tek tıkla listene ekle, haftanı birlikte planlayalım.
          </p>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid size-10 place-items-center rounded-full bg-paper/10 text-paper transition hover:bg-saffron hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="font-sans text-sm font-bold tracking-wider text-saffron uppercase">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] text-paper/80 transition hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-paper/55 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Kiler. Sevgiyle, ev mutfaklarından.</p>
          <p>Besin değerleri yaklaşıktır; tıbbi tavsiye yerine geçmez.</p>
        </div>
      </div>
    </footer>
  );
}
