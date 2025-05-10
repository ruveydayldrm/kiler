"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { IngredientLexicon, type LexiconEntry } from "@/lib/matching";
import { cn } from "@/lib/utils";

let lexiconPromise: Promise<IngredientLexicon> | null = null;

/** Malzeme sözlüğünü bir kez indirip istemcide aynı eşleştirme modülüyle kullanır. */
export function useLexicon() {
  const [lexicon, setLexicon] = useState<IngredientLexicon | null>(null);
  useEffect(() => {
    lexiconPromise ??= fetch("/api/ingredients")
      .then((r) => r.json())
      .then((d: { ingredients: LexiconEntry[] }) => new IngredientLexicon(d.ingredients));
    lexiconPromise.then(setLexicon).catch(() => {
      lexiconPromise = null;
    });
  }, []);
  return lexicon;
}

/**
 * Chip tabanlı malzeme girişi: autocomplete + Enter/virgülle ekleme + Backspace ile silme.
 * Serbest metin sözlükten çözülür ("domatesler" → Domates); bilinmeyen kelime eklenmez.
 */
export function IngredientInput({
  value,
  onChange,
  placeholder = "Malzeme ekle: yumurta, ıspanak, peynir…",
  className,
  size = "md",
  autoFocus,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
  placeholder?: string;
  className?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const lexicon = useLexicon();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => (lexicon && text.trim() ? lexicon.suggest(text, 8).filter((e) => !value.includes(e.slug)) : []), [lexicon, text, value]);

  const add = (raw: string) => {
    if (!lexicon) return;
    const parts = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    const added: string[] = [];
    const unknown: string[] = [];
    for (const p of parts) {
      const slug = lexicon.resolve(p) ?? lexicon.suggest(p, 1)[0]?.slug;
      if (slug && !value.includes(slug) && !added.includes(slug)) added.push(slug);
      else if (!slug) unknown.push(p);
    }
    if (added.length) onChange([...value, ...added]);
    setHint(unknown.length ? `"${unknown.join(", ")}" malzeme listemizde yok.` : undefined);
    setText("");
    setActive(0);
  };

  const pick = (e: LexiconEntry) => {
    onChange([...value, e.slug]);
    setText("");
    setHint(undefined);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-paper px-3 transition focus-within:border-olive focus-within:ring-4 focus-within:ring-olive/10",
          size === "lg" ? "min-h-16 py-2.5" : "min-h-12 py-1.5",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="mr-1 size-5 shrink-0 text-muted" aria-hidden />
        {value.map((slug) => (
          <span key={slug} className="inline-flex h-8 items-center gap-1 rounded-full bg-olive-50 pr-1 pl-3 text-sm font-semibold text-olive">
            {lexicon?.name(slug) ?? slug}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((s) => s !== slug));
              }}
              className="grid size-6 place-items-center rounded-full hover:bg-olive hover:text-paper"
              aria-label={`${lexicon?.name(slug) ?? slug} kaldır`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;]$/.test(v)) add(v);
            else {
              setText(v);
              setOpen(true);
              setActive(0);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions[active] && text.trim()) pick(suggestions[active]!);
              else if (text.trim()) add(text);
            } else if (e.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "Bir malzeme daha…" : placeholder}
          className="h-9 min-w-[10rem] flex-1 bg-transparent text-[15px] placeholder:text-muted/80 focus:outline-none"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="ingredient-suggestions"
          aria-label="Malzeme ekle"
          aria-autocomplete="list"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul id="ingredient-suggestions" role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-line bg-paper p-1.5 shadow-lift">
          {suggestions.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px]", i === active ? "bg-olive-50 text-olive" : "hover:bg-cream-200")}
              >
                <span className="font-medium">{s.name}</span>
                <Plus className="size-4 opacity-60" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {hint && <p className="mt-1.5 text-sm text-tomato-600">{hint}</p>}
    </div>
  );
}
