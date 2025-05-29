import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES } from "../content";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PAGES).map((page) => ({ page }));

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = PAGES[(await params).page];
  if (!page) notFound();
  return { title: page.title, description: page.description, alternates: { canonical: `/${(await params).page}` } };
}

export default async function ContentRoute({ params }: Props) {
  const page = PAGES[(await params).page];
  if (!page) notFound();
  const faqLd = page.faq && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="container-page max-w-3xl py-10 lg:py-16">
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />}
      <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">{page.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-balance sm:text-5xl">{page.title}</h1>
      <p className="mt-4 text-lg text-muted">{page.description}</p>
      <div className="mt-10 space-y-10">
        {page.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="mb-3 text-2xl font-semibold">{s.heading}</h2>}
            <div className="space-y-4 text-[17px] leading-relaxed text-ink-soft">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        {page.faq && (
          <div className="space-y-3">
            {page.faq.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line/70 bg-paper p-5 open:shadow-soft">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q} <span className="text-xl text-olive transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        )}
      </div>
      <div className="mt-12 rounded-3xl bg-olive-50 p-6">
        <p className="font-serif text-xl font-semibold text-olive">Mutfağa geçelim mi?</p>
        <p className="mt-1 text-ink-soft">Elindeki malzemeleri yaz, sana uygun tarifleri bulalım.</p>
        <Link href="/pantry" className="mt-4 inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
          Dolabımda ne var?
        </Link>
      </div>
    </div>
  );
}
