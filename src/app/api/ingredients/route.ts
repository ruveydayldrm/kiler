import { getLexicon } from "@/lib/recipes";
import { json } from "@/lib/api";

/** Malzeme sözlüğü (otomatik tamamlama ve chip'ler için). Herkese açık, salt okunur. */
export async function GET(req: Request) {
  const lexicon = await getLexicon();
  const q = new URL(req.url).searchParams.get("q");
  const entries = q ? lexicon.suggest(q, 10) : [...lexicon.entries.values()];
  return json(
    { ingredients: entries.map((e) => ({ slug: e.slug, name: e.name, aisle: e.aisle, synonyms: e.synonyms, parentSlug: e.parentSlug, isBasic: e.isBasic })) },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
  );
}
