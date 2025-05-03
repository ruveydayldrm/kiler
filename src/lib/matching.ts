// =============================================================================
//  Kiler — malzeme eşleştirme ve arama çekirdeği
// =============================================================================
//  Bu modül saf (yan etkisiz) fonksiyonlardan oluşur ve şu yerlerde AYNEN kullanılır:
//   • /pantry  — "Dolabımda ne var?" eşleştirmesi
//   • /recipes — genel arama ve filtreler
//   • AI asistanı — sinyal çıkarma ve aday tarif bulma
//
//  Temel fikirler
//   1. Türkçe normalizasyon: tr-TR küçük harf + ASCII katlama (ı→i, ş→s…). Böylece
//      "ıspanak" ve "ispanak" aynı anahtara düşer.
//   2. Ek toleransı: "domatesler", "ıspanağı", "salçası" kök sözlükte varsa köke iner.
//      "-lı/-li/-lu/-lü" (yumurtalı) ASLA köke indirgenmez; bu ek "içeren" sinyali
//      olarak ayrıca ele alınır ("yumurtalı" ≠ "yumurta" — dolapta yumurta olduğu anlamına gelmez).
//   3. JavaScript'te \b Türkçe harflerde çalışmadığı için tüm sınırlar BOŞLUK tabanlıdır.
//   4. Üst-alt ilişkisi: "peynir" araması kaşar/beyaz peyniri kapsar; dolaptaki
//      "beyaz peynir" de "peynir" isteyen tarifi karşılar.
// =============================================================================

import type { AllergenKey, DietKey, Difficulty, SortKey } from "./constants";
import { DEFAULT_ALWAYS_HAVE } from "./constants";

// ----------------------------------------------------------------- Tipler

export interface LexiconEntry {
  slug: string;
  name: string;
  synonyms: string[];
  parentSlug: string | null;
  aisle: string;
  isBasic: boolean;
}

export interface IndexIngredient {
  slug: string;
  name: string;
  optional: boolean;
}

/** Arama/eşleştirme için hafifletilmiş tarif kaydı (bkz. lib/recipes.ts → getRecipeIndex). */
export interface RecipeIndexItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  coverColor: string;
  categorySlug: string;
  categoryName: string;
  cuisineSlug: string;
  cuisineName: string;
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servings: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  diets: DietKey[];
  allergens: AllergenKey[];
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  favoriteCount: number;
  cookedCount: number;
  featured: boolean;
  createdAt: number;
  ingredients: IndexIngredient[];
}

export interface QuerySignals {
  /** Yalın geçen malzemeler ("yumurta, ıspanak") */
  ingredients: string[];
  /** "-lı/-li" ile geçen malzemeler ("tavuklu") — içermesi istenir ama dolapta olduğu anlamına gelmez */
  withIngredients: string[];
  /** "-sız/-siz", "olmadan", "hariç" ile dışlanan malzemeler */
  excludeIngredients: string[];
  maxMinutes?: number;
  maxCalories?: number;
  dailyCalories?: number;
  diets: DietKey[];
  categorySlugs: string[];
  cuisineSlug?: string;
  difficulty?: Difficulty;
  servings?: number;
  meal?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  /** "var mı / bulunur mu" kalıbı */
  isAvailabilityQuestion: boolean;
  /** "dolabımda", "elimde", "evde … var" kalıbı */
  isPantryPhrase: boolean;
  /** Filtre kelimeleri ve malzemeler temizlendikten sonra kalan anlamlı metin */
  residual: string;
}

export interface RecipeFilters {
  q?: string;
  categories?: string[];
  cuisines?: string[];
  maxMinutes?: number;
  minMinutes?: number;
  difficulties?: Difficulty[];
  minCalories?: number;
  maxCalories?: number;
  diets?: DietKey[];
  excludeAllergens?: AllergenKey[];
  includeIngredients?: string[];
  excludeIngredients?: string[];
  minRating?: number;
}

export interface HardConstraints {
  allergens: AllergenKey[];
  dislikedIngredients: string[];
}

export interface MatchResult {
  recipe: RecipeIndexItem;
  /** Zorunlu (temel/opsiyonel olmayan) malzeme sayısı */
  requiredCount: number;
  haveCount: number;
  percent: number;
  missing: IndexIngredient[];
  matched: IndexIngredient[];
  /** Kullanıcının söylediği malzemelerden kaç tanesi bu tarifte kullanılıyor */
  queryHits: number;
  score: number;
}

// ----------------------------------------------------------------- Normalizasyon

const FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** tr-TR küçük harf + noktalama temizliği (Türkçe harfler korunur). */
export function normalizeText(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[’'`´]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Karşılaştırma anahtarı: normalize + ASCII katlama. */
export function fold(input: string): string {
  return normalizeText(input).replace(/[çğıöşüâîû]/g, (c) => FOLD[c] ?? c);
}

export const tokenize = (folded: string) => (folded ? folded.split(" ") : []);

/** Boşluk tabanlı "kelime sınırı" ile içerme kontrolü (\b Türkçe'de güvenilmez). */
export const containsPhrase = (haystack: string, phrase: string) => ` ${haystack} `.includes(` ${phrase} `);

// Ekler katlanmış (ASCII) biçimde, uzundan kısaya. "li/lı/lu/lü" BİLEREK yok.
const SUFFIXES = [
  "lerimizden", "larimizdan", "lerimizi", "larimizi", "lerimiz", "larimiz",
  "lerinden", "larindan", "lerini", "larini", "lerden", "lardan", "lerimi", "larimi",
  "lerim", "larim", "lerde", "larda", "leri", "lari", "ler", "lar",
  "imizi", "umuzu", "imiz", "umuz", "inden", "undan", "ini", "unu", "imi", "umu",
  "den", "dan", "ten", "tan", "nin", "nun", "yla", "yle", "la", "le",
  "de", "da", "te", "ta", "yi", "yu", "si", "su", "ni", "nu", "im", "um", "in", "un",
  "i", "u", "m", "e", "a",
];
const SOFTEN: Record<string, string> = { g: "k", b: "p", d: "t" };

/** "ispanagi" → ["ispanagi","ispanag","ispanak", …] — sözlükte aranacak kök adayları */
export function stemCandidates(token: string): string[] {
  const out = [token];
  for (const s of SUFFIXES) {
    // Kök en az 3 harf: "suşi" → "su", "eti" → "et" gibi yanlış eşleşmeleri önler
    if (token.length - s.length < 3 || !token.endsWith(s)) continue;
    const stem = token.slice(0, -s.length);
    out.push(stem);
    const last = stem.at(-1)!;
    if (SOFTEN[last]) out.push(stem.slice(0, -1) + SOFTEN[last]);
  }
  return out;
}

const WITH_SUFFIXES = ["li", "lu"]; // katlanmış: lı/li → li, lu/lü → lu
const WITHOUT_SUFFIXES = ["siz", "suz"]; // sız/siz → siz, suz/süz → suz

// ----------------------------------------------------------------- Sözlük

/**
 * Malzeme sözlüğü: ad/eş anlamlı → slug ve üst-alt ilişkileri.
 * Bir kez kurulur, tüm eşleştirmelerde paylaşılır.
 */
export class IngredientLexicon {
  readonly entries = new Map<string, LexiconEntry>();
  private readonly terms = new Map<string, string>(); // katlanmış terim → slug
  private readonly children = new Map<string, string[]>();
  readonly maxWords: number;

  constructor(entries: LexiconEntry[]) {
    let maxWords = 1;
    for (const e of entries) {
      this.entries.set(e.slug, e);
      for (const term of [e.name, ...e.synonyms]) {
        const key = fold(term);
        if (!key) continue;
        // Aynı terim iki malzemeye işaret ederse ilk (daha spesifik tanımlanan) kazanır.
        if (!this.terms.has(key)) this.terms.set(key, e.slug);
        maxWords = Math.max(maxWords, key.split(" ").length);
      }
      if (e.parentSlug) {
        const list = this.children.get(e.parentSlug) ?? [];
        list.push(e.slug);
        this.children.set(e.parentSlug, list);
      }
    }
    this.maxWords = maxWords;
  }

  get size() {
    return this.entries.size;
  }

  name(slug: string) {
    return this.entries.get(slug)?.name ?? slug;
  }

  /** Tam terim (katlanmış) → slug */
  lookup(foldedTerm: string): string | undefined {
    return this.terms.get(foldedTerm);
  }

  /** Tek bir serbest metin girişini (ör. autocomplete seçimi, "Domatesler") slug'a çözer. */
  resolve(input: string): string | undefined {
    const key = fold(input);
    if (!key) return undefined;
    if (this.entries.has(input)) return input;
    const direct = this.terms.get(key);
    if (direct) return direct;
    const tokens = tokenize(key);
    const head = tokens.slice(0, -1).join(" ");
    for (const stem of stemCandidates(tokens.at(-1)!)) {
      const hit = this.terms.get(head ? `${head} ${stem}` : stem);
      if (hit) return hit;
    }
    return undefined;
  }

  ancestors(slug: string): string[] {
    const out: string[] = [];
    let cur = this.entries.get(slug)?.parentSlug;
    while (cur && !out.includes(cur)) {
      out.push(cur);
      cur = this.entries.get(cur)?.parentSlug ?? null;
    }
    return out;
  }

  descendants(slug: string): string[] {
    const out: string[] = [];
    const stack = [...(this.children.get(slug) ?? [])];
    while (stack.length) {
      const s = stack.pop()!;
      if (out.includes(s)) continue;
      out.push(s);
      stack.push(...(this.children.get(s) ?? []));
    }
    return out;
  }

  /** "peynir" → peynir + kaşar + beyaz peynir + … (arama/dışlama kapsamı) */
  expandDown(slugs: Iterable<string>): Set<string> {
    const set = new Set<string>();
    for (const s of slugs) {
      set.add(s);
      for (const d of this.descendants(s)) set.add(d);
    }
    return set;
  }

  /**
   * Dolap kapsamı: elindeki malzeme + alt türleri + üst türleri.
   *  - dolapta "peynir" → "kaşar" isteyen tarifi karşılar (alt tür)
   *  - dolapta "beyaz peynir" → "peynir" isteyen tarifi karşılar (üst tür)
   */
  expandPantry(slugs: Iterable<string>): Set<string> {
    const set = this.expandDown(slugs);
    for (const s of [...slugs]) for (const a of this.ancestors(s)) set.add(a);
    return set;
  }

  /** Otomatik tamamlama: önek ve içerme eşleşmesi (ad + eş anlamlılar). */
  suggest(input: string, limit = 8): LexiconEntry[] {
    const q = fold(input);
    if (!q) return [];
    const scored: { e: LexiconEntry; s: number }[] = [];
    for (const e of this.entries.values()) {
      let best = 0;
      for (const term of [e.name, ...e.synonyms]) {
        const t = fold(term);
        if (t === q) best = Math.max(best, 100);
        else if (t.startsWith(q)) best = Math.max(best, 80 - t.length / 10);
        else if (tokenize(t).some((w) => w.startsWith(q))) best = Math.max(best, 60 - t.length / 10);
        else if (q.length >= 3 && t.includes(q)) best = Math.max(best, 40);
      }
      if (best > 0) scored.push({ e, s: best + (term0IsName(e, q) ? 5 : 0) });
    }
    return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
  }
}

const term0IsName = (e: LexiconEntry, q: string) => fold(e.name).startsWith(q);

// ----------------------------------------------------------------- Malzeme çıkarma

// "et" (fiil) gibi yanlış pozitifleri önlemek için önceki kelimeye bakılır.
const VERB_PREFIXES_FOR_ET = new Set([
  "tavsiye", "yardim", "dikkat", "teklif", "kontrol", "takip", "tercih", "ilave", "devam", "elde", "terk", "kabul", "rica", "tahmin", "servis",
]);
const NEGATION_AFTER = new Set([
  "olmadan", "haric", "icermeyen", "icermesin", "olmasin", "olmayan", "istemiyorum", "kullanmadan", "katmadan", "sevmem", "sevmiyorum",
  "yemeden", "yemiyorum", "yemem", "yemeyen",
]);
const NOT_HAVE_AFTER = new Set(["yok", "bitti", "kalmadi"]);

interface Extraction {
  ingredients: string[];
  withIngredients: string[];
  excludeIngredients: string[];
  /** Malzeme olarak tüketilen token indeksleri (artık metin hesabı için) */
  consumed: Set<number>;
}

export function extractIngredients(text: string, lexicon: IngredientLexicon): Extraction {
  const tokens = tokenize(fold(text));
  const ingredients: string[] = [];
  const withIngredients: string[] = [];
  const excludeIngredients: string[] = [];
  const consumed = new Set<number>();
  const push = (list: string[], slug: string) => {
    if (!list.includes(slug)) list.push(slug);
  };

  let i = 0;
  while (i < tokens.length) {
    let hit: { slug: string; n: number; mode: "plain" | "with" | "without" } | null = null;

    for (let n = Math.min(lexicon.maxWords, tokens.length - i); n >= 1 && !hit; n--) {
      const head = tokens.slice(i, i + n - 1).join(" ");
      const last = tokens[i + n - 1]!;
      const join = (w: string) => (head ? `${head} ${w}` : w);

      const exact = lexicon.lookup(join(last));
      if (exact) {
        hit = { slug: exact, n, mode: "plain" };
        break;
      }
      // "-sız/-siz": soğansız, etsiz
      for (const s of WITHOUT_SUFFIXES) {
        if (!last.endsWith(s) || last.length - s.length < 2) continue;
        const stemWord = last.slice(0, -s.length);
        const slug = lexicon.lookup(join(stemWord)) ?? stemCandidates(stemWord).map((c) => lexicon.lookup(join(c))).find(Boolean);
        if (slug) hit = { slug, n, mode: "without" };
      }
      if (hit) break;
      // "-lı/-li/-lu/-lü": tavuklu, yumurtalı  → içeren sinyali
      for (const s of WITH_SUFFIXES) {
        if (!last.endsWith(s) || last.length - s.length < 2) continue;
        const stemWord = last.slice(0, -s.length);
        const slug = lexicon.lookup(join(stemWord)) ?? lexicon.lookup(join(stemWord.replace(/(.)$/, (c) => SOFTEN[c] ?? c)));
        if (slug) hit = { slug, n, mode: "with" };
      }
      if (hit) break;
      // Çekim ekleri: domatesler, ıspanağı, salçası
      for (const c of stemCandidates(last).slice(1)) {
        const slug = lexicon.lookup(join(c));
        if (slug) {
          hit = { slug, n, mode: "plain" };
          break;
        }
      }
    }

    if (!hit) {
      i++;
      continue;
    }

    // "tavsiye et" → "et" malzeme değildir
    if (hit.slug === "et" && hit.n === 1 && i > 0 && VERB_PREFIXES_FOR_ET.has(tokens[i - 1]!)) {
      i++;
      continue;
    }

    const next = tokens[i + hit.n];
    for (let k = i; k < i + hit.n; k++) consumed.add(k);
    if (hit.mode === "without" || (next && NEGATION_AFTER.has(next))) {
      push(excludeIngredients, hit.slug);
      if (next && NEGATION_AFTER.has(next)) consumed.add(i + hit.n);
    } else if (next && NOT_HAVE_AFTER.has(next)) {
      // "yumurta yok" — sahip değil, ama dışlama da değil
      consumed.add(i + hit.n);
    } else if (hit.mode === "with") {
      push(withIngredients, hit.slug);
    } else {
      push(ingredients, hit.slug);
    }
    i += hit.n;
  }

  return { ingredients, withIngredients, excludeIngredients, consumed };
}

// ----------------------------------------------------------------- Sinyal çıkarma

const NUMBER_WORDS: Record<string, number> = {
  bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
  yirmi: 20, otuz: 30, kirk: 40, elli: 50, altmis: 60, doksan: 90,
};
const UNIT_AFTER_NUMBER = /^(kisi|kisilik|kisiyiz|dakika|dk|saat|porsiyon|porsiyonluk)/;

/** "yirmi beş dakika" → "25 dakika" (yalnızca birimden hemen önceki sayı kelimeleri) */
function wordsToDigits(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (NUMBER_WORDS[t] != null) {
      let j = i;
      let sum = 0;
      while (j < tokens.length && NUMBER_WORDS[tokens[j]!] != null) sum += NUMBER_WORDS[tokens[j++]!]!;
      if (j < tokens.length && UNIT_AFTER_NUMBER.test(tokens[j]!)) {
        out.push(String(sum));
        i = j - 1;
        continue;
      }
    }
    out.push(t);
  }
  return out;
}

const DIET_PATTERNS: [RegExp, DietKey][] = [
  [/(^| )vegan( |$)/, "vegan"],
  [/(^| )(vejetaryen|vejeteryan|vejetarien|etsiz|vegetarian|et yemeden|et yemiyorum|et yemem|et olmadan)( |$)/, "vegetarian"],
  [/(^| )(glutensiz|colyak|gluten free)( |$)/, "gluten-free"],
  [/(^| )(laktozsuz|sutsuz|laktoz intolerans)/, "lactose-free"],
  [/(^| )(dusuk karbonhidrat|az karbonhidrat|karbonhidratsiz|low carb|keto|ketojenik)/, "low-carb"],
  [/(^| )(yuksek protein|proteinli|protein deposu|protein agirlikli|bol protein)/, "high-protein"],
];

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/(^| )(kahvalti|kahvaltilik|kahvaltiya|sabah)/, "kahvalti"],
  [/(^| )(corba|corbasi|corbalar)( |$)/, "corbalar"],
  [/(^| )(zeytinyagli|zeytinyaglilar)( |$)/, "zeytinyaglilar"],
  [/(^| )(salata|salatasi|salatalar)( |$)/, "salatalar"],
  [/(^| )(hamur isi|hamurisi|borek|pogaca|gozleme)( |$)/, "hamur-isleri"],
  [/(^| )(tatli|tatlisi|tatlilar|tatlim)( |$)/, "tatlilar"],
  [/(^| )(atistirmalik|atistirmaliklar|aperatif|meze)( |$)/, "atistirmaliklar"],
  [/(^| )(icecek|icecekler|smoothie|serbet)( |$)/, "icecekler"],
  [/(^| )(bebek|cocuk|cocuklar|cocuklara|cocugum)( |$)/, "bebek-ve-cocuk"],
  [/(^| )(fit|diyet|hafif)( |$)/, "fit-tarifler"],
];

const CUISINE_PATTERNS: [RegExp, string][] = [
  [/(^| )(italyan|italya)/, "italyan"],
  [/(^| )(turk|geleneksel|anadolu)/, "turk"],
  [/(^| )(asya|cin|japon|tay|thai|uzak dogu|hint)/, "asya"],
  [/(^| )(meksika|meksikan)/, "meksika"],
  [/(^| )(orta dogu|ortadogu|arap|lubnan)/, "orta-dogu"],
  [/(^| )(dunya mutfagi|amerikan|ingiliz|fransiz|akdeniz|yunan)/, "dunya"],
];

/** Doğal dil sorgusundan yapılandırılmış sinyaller çıkarır. */
export function extractSignals(text: string, lexicon: IngredientLexicon): QuerySignals {
  const tokens = wordsToDigits(tokenize(fold(text)));
  const t = tokens.join(" ");
  const ex = extractIngredients(tokens.join(" "), lexicon);

  const signals: QuerySignals = {
    ingredients: ex.ingredients,
    withIngredients: ex.withIngredients,
    excludeIngredients: ex.excludeIngredients,
    diets: [],
    categorySlugs: [],
    isAvailabilityQuestion: / (var|yok|bulunur|bulunuyor|mevcut) (mi|mu)( |$)/.test(` ${t} `) || /(^| )(var mi|varmi)( |$)/.test(t),
    isPantryPhrase: /(^| )(dolab|buzdolab|elimde|evde|mutfagimda|elimdeki|evdeki|dolaptaki|kalan|artan)/.test(t),
    residual: "",
  };

  // ---- Süre
  let m: RegExpMatchArray | null;
  if ((m = t.match(/(\d+)\s*(dk|dakika|dakikada|dakikalik|dakikalık|dakikanin|dakikayi|dakikadan|dkda|dklik)/))) {
    signals.maxMinutes = Number(m[1]);
  } else if ((m = t.match(/(\d+)\s*(saat|saatte|saatlik)/))) {
    signals.maxMinutes = Number(m[1]) * 60;
  } else if (/(^| )yarim saat/.test(t)) {
    signals.maxMinutes = 30;
  } else if (/(^| )ceyrek saat/.test(t)) {
    signals.maxMinutes = 15;
  } else if (/(^| )(hizli|hizlica|pratik|cabuk|acele|kisa surede|aceleyle)( |$)/.test(t)) {
    signals.maxMinutes = 30;
  }

  // ---- Kalori
  const calMatch = t.match(/(\d{2,4})\s*(kalori|kcal|kal|kalorilik|kaloriyle|kalorili|kaloriye)( |$)/);
  if (calMatch) {
    const n = Number(calMatch[1]);
    const daily = /(gun|gunluk|hafta|haftalik|haftami|plan|beslen)/.test(t) || n >= 1200;
    if (daily) signals.dailyCalories = n;
    else signals.maxCalories = n;
  } else if (/(^| )(dusuk kalori|az kalori|dusuk kalorili|hafif bir|kalorisi dusuk)/.test(t)) {
    signals.maxCalories = 400;
  }

  // ---- Diyet
  for (const [re, key] of DIET_PATTERNS) if (re.test(t) && !signals.diets.includes(key)) signals.diets.push(key);
  if (signals.diets.includes("vegan") && !signals.diets.includes("vegetarian")) signals.diets.push("vegetarian");
  // "etsiz" sözlükte "et" dışlaması olarak da gelir; vejetaryen bayrağı yeterli, et'i ayrıca dışlamayalım
  if (signals.diets.includes("vegetarian")) signals.excludeIngredients = signals.excludeIngredients.filter((s) => s !== "et");

  // ---- Öğün / kategori
  for (const [re, slug] of CATEGORY_PATTERNS) if (re.test(t)) signals.categorySlugs.push(slug);
  if (/(^| )(kahvalti|kahvaltilik|sabah)/.test(t)) signals.meal = "BREAKFAST";
  else if (/(^| )(aksam|aksama|aksamlik)/.test(t)) signals.meal = "DINNER";
  else if (/(^| )(ogle|ogleye|ogle yemegi)/.test(t)) signals.meal = "LUNCH";
  else if (/(^| )(ara ogun|atistirmalik)/.test(t)) signals.meal = "SNACK";

  // ---- Mutfak & zorluk
  for (const [re, slug] of CUISINE_PATTERNS) {
    if (re.test(t)) {
      signals.cuisineSlug = slug;
      break;
    }
  }
  if (/(^| )(kolay|basit|zahmetsiz|acemi|baslangic)/.test(t)) signals.difficulty = "EASY";

  // ---- Kişi sayısı
  if ((m = t.match(/(\d+)\s*(kisiyiz|kisilik|kisi|porsiyon|porsiyonluk)/))) signals.servings = Number(m[1]);

  // ---- Artık metin: malzemeler ve bilinen kalıplar dışındaki kelimeler (serbest arama için)
  signals.residual = tokens
    .filter((_, idx) => !ex.consumed.has(idx))
    .filter((w) => !FILLER.has(w) && !/^\d+$/.test(w))
    .join(" ");

  return signals;
}

/** Arama için anlam taşımayan kelimeler (katlanmış biçimde). */
export const FILLER = new Set([
  "tarif", "tarifi", "tarifleri", "tarifler", "tarifin", "nasil", "yapilir", "yapimi", "yaparim", "yapabilirim", "yapsam", "yapayim",
  "pisiririm", "pisireyim", "pisirsem", "pisirelim", "ne", "neler", "var", "mi", "mu", "yok", "bulunur", "bulunuyor", "mevcut",
  "bana", "bize", "bir", "seyler", "sey", "icin", "ile", "ve", "veya", "ya", "da", "de", "lutfen", "oner", "onerir", "onerin",
  "misin", "goster", "istiyorum", "isterim", "canim", "cekiyor", "bugun", "aksama", "aksam", "yemek", "yemegi", "yemekleri",
  "dolabimda", "dolapta", "elimde", "evde", "buzdolabimda", "sizde", "arsivde", "arsivinizde", "olan", "olsun", "gibi", "kadar",
  "dakikada", "dakika", "dk", "saat", "kalori", "kcal", "alti", "altinda", "az", "en", "cok", "biraz", "hizli", "pratik", "kolay",
  "kisiyiz", "kisilik", "kisi", "icin", "bu", "su", "o", "hangi", "nedir", "hakkinda", "tane", "adet",
]);

// ----------------------------------------------------------------- Tarif adı eşleşmesi

const TITLE_FILLER = new Set([
  "tarif", "tarifi", "tarifleri", "tarifin", "nasil", "yapilir", "yapimi", "var", "mi", "mu", "mı", "bulunur", "mevcut", "bana", "goster",
  "istiyorum", "lutfen", "sizde", "arsivde", "arsivinizde", "bir", "ariyorum", "yapmak", "pisirmek", "nedir", "olan", "hakkinda",
]);

/**
 * Doğrudan tarif adı eşleşmesi. "mercimek çorbası", yarım "mercimek ç" veya
 * cümle içinde geçen "akşama karnıyarık yapsam" ilgili tarifi en üste taşır.
 * Skor 0 ise eşleşme yoktur.
 */
export function titleMatchScore(query: string, title: string): number {
  const q = tokenize(fold(query)).filter((w) => !TITLE_FILLER.has(w));
  if (!q.length) return 0;
  const tt = tokenize(fold(title));
  const qs = q.join(" ");
  const ts = tt.join(" ");

  if (qs === ts) return 100;
  // Cümle içinde tam tarif adı
  if (tt.length >= 1 && ts.length >= 5 && containsPhrase(qs, ts)) return 95;

  // Ardışık önek eşleşmesi: "mercimek c" → "mercimek corbasi"
  for (let start = 0; start + q.length <= tt.length; start++) {
    const ok = q.every((w, k) => {
      const target = tt[start + k]!;
      const isLast = k === q.length - 1;
      return isLast ? target.startsWith(w) : target === w || (w.length >= 4 && target.startsWith(w));
    });
    if (ok && (q.length > 1 || q[0]!.length >= 4)) return 90 - (tt.length - q.length) * 2 - start;
  }

  // Sırasız ama tümü önek eşleşiyor (ör. "çorba mercimek")
  if (q.length >= 2 && q.every((w) => w.length >= 3 && tt.some((x) => x.startsWith(w)))) return 70;
  return 0;
}

// ----------------------------------------------------------------- Filtreler

/** Alerji ve sevilmeyen malzemeler — SERT filtre. LLM'e değil buraya güveniyoruz. */
export function passesHardConstraints(recipe: RecipeIndexItem, hard: HardConstraints | null | undefined, lexicon: IngredientLexicon): boolean {
  if (!hard) return true;
  if (hard.allergens.length && recipe.allergens.some((a) => hard.allergens.includes(a))) return false;
  if (hard.dislikedIngredients.length) {
    const banned = lexicon.expandDown(hard.dislikedIngredients);
    if (recipe.ingredients.some((i) => banned.has(i.slug))) return false;
  }
  return true;
}

export function applyHardConstraints<T extends RecipeIndexItem>(recipes: T[], hard: HardConstraints | null | undefined, lexicon: IngredientLexicon): T[] {
  if (!hard || (!hard.allergens.length && !hard.dislikedIngredients.length)) return recipes;
  return recipes.filter((r) => passesHardConstraints(r, hard, lexicon));
}

export function recipeUsesAny(recipe: RecipeIndexItem, slugs: Set<string>) {
  return recipe.ingredients.some((i) => slugs.has(i.slug));
}

export function filterRecipes(recipes: RecipeIndexItem[], f: RecipeFilters, lexicon: IngredientLexicon): RecipeIndexItem[] {
  const include = (f.includeIngredients ?? []).map((s) => lexicon.expandDown([s]));
  const exclude = lexicon.expandDown(f.excludeIngredients ?? []);
  return recipes.filter((r) => {
    if (f.categories?.length && !f.categories.includes(r.categorySlug)) return false;
    if (f.cuisines?.length && !f.cuisines.includes(r.cuisineSlug)) return false;
    if (f.maxMinutes != null && r.totalMinutes > f.maxMinutes) return false;
    if (f.minMinutes != null && r.totalMinutes < f.minMinutes) return false;
    if (f.difficulties?.length && !f.difficulties.includes(r.difficulty)) return false;
    if (f.maxCalories != null && (r.calories == null || r.calories > f.maxCalories)) return false;
    if (f.minCalories != null && (r.calories == null || r.calories < f.minCalories)) return false;
    if (f.diets?.length && !f.diets.every((d) => r.diets.includes(d))) return false;
    if (f.excludeAllergens?.length && r.allergens.some((a) => f.excludeAllergens!.includes(a))) return false;
    if (include.length && !include.every((set) => recipeUsesAny(r, set))) return false;
    if (exclude.size && recipeUsesAny(r, exclude)) return false;
    if (f.minRating != null && r.ratingAvg < f.minRating) return false;
    return true;
  });
}

// ----------------------------------------------------------------- Dolap eşleştirmesi

export interface PantryMatchOptions {
  /** "Evde hep olanlar" — eşleşme oranına dahil edilmez (varsayılan: tuz, karabiber, su, sıvı yağ) */
  alwaysHave?: string[];
  maxMinutes?: number;
  maxCalories?: number;
  diets?: DietKey[];
}

const popularity = (r: RecipeIndexItem) => r.viewCount + r.favoriteCount * 5 + r.cookedCount * 8;

/** Tek bir tarifi kullanıcının dolabına göre değerlendirir. */
export function matchRecipe(
  recipe: RecipeIndexItem,
  pantry: Set<string>,
  queried: Set<string>,
  ignore: Set<string>,
  opts: PantryMatchOptions = {},
): MatchResult {
  const required = recipe.ingredients.filter((i) => !i.optional && !ignore.has(i.slug));
  const matched = required.filter((i) => pantry.has(i.slug));
  const missing = required.filter((i) => !pantry.has(i.slug));
  const percent = required.length ? Math.round((matched.length / required.length) * 100) : 100;
  const queryHits = recipe.ingredients.filter((i) => queried.has(i.slug)).length;

  let score = percent - missing.length * 10 + queryHits * 6;
  if (opts.maxMinutes != null) score += recipe.totalMinutes <= opts.maxMinutes ? 6 : -20;
  if (opts.maxCalories != null && recipe.calories != null) score += recipe.calories <= opts.maxCalories ? 6 : -20;
  if (opts.diets?.length) score += opts.diets.every((d) => recipe.diets.includes(d)) ? 6 : -30;
  score += recipe.ratingAvg * 2 + Math.log10(1 + popularity(recipe)) * 3;

  return { recipe, requiredCount: required.length, haveCount: matched.length, percent, missing, matched, queryHits, score };
}

/**
 * "Dolabımda ne var?" — tarifleri eşleşme oranına göre sıralar.
 * Yalnızca kullanıcının malzemelerinden en az birini kullanan tarifler döner.
 */
export function matchPantry(
  recipes: RecipeIndexItem[],
  pantrySlugs: string[],
  lexicon: IngredientLexicon,
  opts: PantryMatchOptions = {},
): MatchResult[] {
  if (!pantrySlugs.length) return [];
  const pantry = lexicon.expandPantry(pantrySlugs);
  const queried = lexicon.expandDown(pantrySlugs);
  const ignore = new Set(opts.alwaysHave ?? DEFAULT_ALWAYS_HAVE);
  return recipes
    .map((r) => matchRecipe(r, pantry, queried, ignore, opts))
    .filter((m) => m.queryHits > 0 && m.haveCount > 0)
    .sort((a, b) => b.score - a.score);
}

/** Sonuçları sayfadaki iki gruba ayırır. */
export function groupPantryMatches(matches: MatchResult[]) {
  return {
    ready: matches.filter((m) => m.missing.length === 0),
    almost: matches.filter((m) => m.missing.length >= 1 && m.missing.length <= 2),
  };
}

// ----------------------------------------------------------------- Genel arama

export interface SearchOutcome {
  signals: QuerySignals;
  /** Doğrudan tarif adı eşleşmeleri (skora göre) */
  titleMatches: RecipeIndexItem[];
  results: RecipeIndexItem[];
  /** Malzeme odaklı aramada eşleşme detayları (recipeId → sonuç) */
  matches: Map<string, MatchResult>;
  mode: "title" | "pantry" | "ingredients" | "filters" | "text" | "none";
}

/**
 * Serbest metin araması. Öncelik sırası:
 *  1. Doğrudan tarif adı → en üstte (kelime türü eşleşmesine kaymaz)
 *  2. Malzeme cümlesi → eşleşme yüzdesi / kullanım sayısına göre
 *  3. Yalnız filtre sinyalleri (süre, kalori, diyet…) → filtre + popülerlik
 *  4. Metin içi arama (başlık, açıklama, etiket)
 */
export function searchRecipes(
  recipes: RecipeIndexItem[],
  query: string,
  lexicon: IngredientLexicon,
  opts: { alwaysHave?: string[]; pantry?: string[]; extraFilters?: RecipeFilters } = {},
): SearchOutcome {
  const signals = extractSignals(query, lexicon);
  const matches = new Map<string, MatchResult>();

  // 1) Tarif adı
  const titled = recipes
    .map((r) => ({ r, s: titleMatchScore(query, r.title) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.r.ratingAvg - a.r.ratingAvg);
  const strongTitle = titled.filter((x) => x.s >= 85).map((x) => x.r);

  // 2) Filtreler (sinyallerden)
  const filters: RecipeFilters = {
    ...opts.extraFilters,
    maxMinutes: signals.maxMinutes ?? opts.extraFilters?.maxMinutes,
    maxCalories: signals.maxCalories ?? opts.extraFilters?.maxCalories,
    diets: [...new Set([...(opts.extraFilters?.diets ?? []), ...signals.diets])],
    cuisines: signals.cuisineSlug ? [signals.cuisineSlug] : opts.extraFilters?.cuisines,
    difficulties: signals.difficulty ? [signals.difficulty] : opts.extraFilters?.difficulties,
    excludeIngredients: [...(opts.extraFilters?.excludeIngredients ?? []), ...signals.excludeIngredients],
    includeIngredients: [...(opts.extraFilters?.includeIngredients ?? []), ...signals.withIngredients],
  };
  // Kategori sinyali yumuşak: yalnızca başka kategori filtresi yoksa uygula
  const categoryFilter = signals.categorySlugs.filter((c) => c !== "fit-tarifler");
  if (categoryFilter.length && !filters.categories?.length) filters.categories = categoryFilter;
  if (signals.meal === "DINNER" && !filters.categories?.length) {
    filters.categories = ["ana-yemekler", "makarnalar", "zeytinyaglilar", "corbalar", "salatalar", "hamur-isleri"];
  }

  const filtered = filterRecipes(recipes, filters, lexicon);
  const hasFilterSignal =
    signals.maxMinutes != null || signals.maxCalories != null || signals.diets.length > 0 || !!signals.cuisineSlug ||
    !!signals.difficulty || signals.categorySlugs.length > 0 || !!signals.meal || signals.withIngredients.length > 0 ||
    signals.excludeIngredients.length > 0;

  const ordered = (list: RecipeIndexItem[]) => {
    const head = strongTitle.filter((r) => list.includes(r) || !hasFilterSignal);
    return [...head, ...list.filter((r) => !head.includes(r))];
  };

  // 3) Malzeme odaklı
  // Temel malzemeler (tuz, su…) arama terimi olarak anlamsız; "şu" → "su" gibi yanlış pozitifleri de eler.
  const said = signals.ingredients.filter((s) => !lexicon.entries.get(s)?.isBasic);
  if (said.length) {
    const pantryMode = signals.isPantryPhrase || said.length >= 2;
    const pantry = pantryMode ? [...new Set([...said, ...(opts.pantry ?? [])])] : said;
    const scored = matchPantry(filtered, pantry, lexicon, {
      alwaysHave: opts.alwaysHave,
      maxMinutes: signals.maxMinutes,
      maxCalories: signals.maxCalories,
      diets: signals.diets,
    });
    // Tekil malzeme ("ıspanak") → o malzemeyi kullanan tarifler, kullanım/puan sıralı
    const list = pantryMode
      ? scored
      : scored.sort((a, b) => b.queryHits - a.queryHits || b.recipe.ratingAvg - a.recipe.ratingAvg);
    for (const m of list) matches.set(m.recipe.id, m);
    return {
      signals,
      titleMatches: strongTitle,
      results: ordered(list.map((m) => m.recipe)),
      matches,
      mode: strongTitle.length ? "title" : pantryMode ? "pantry" : "ingredients",
    };
  }

  // 4) Yalnızca tarif adı
  if (titled.length && !hasFilterSignal) {
    return { signals, titleMatches: strongTitle, results: titled.map((x) => x.r), matches, mode: "title" };
  }

  // 5) Yalnız filtre sinyalleri
  if (hasFilterSignal) {
    const residual = signals.residual;
    const textual = residual ? filtered.filter((r) => textScore(r, residual) > 0) : [];
    const base = textual.length ? textual : filtered;
    return { signals, titleMatches: strongTitle, results: ordered(sortRecipes(base, "popular")), matches, mode: "filters" };
  }

  // 6) Metin içi arama
  const text = recipes
    .map((r) => ({ r, s: textScore(r, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
  return { signals, titleMatches: strongTitle, results: text, matches, mode: text.length ? "text" : "none" };
}

/** Başlık / açıklama / kategori / etiket içinde kelime öneki araması. */
export function textScore(r: RecipeIndexItem, query: string): number {
  const words = tokenize(fold(query)).filter((w) => w.length >= 3 && !FILLER.has(w));
  if (!words.length) return 0;
  const title = tokenize(fold(r.title));
  const body = tokenize(fold(`${r.description} ${r.categoryName} ${r.cuisineName} ${r.tags.join(" ")}`));
  let score = 0;
  for (const w of words) {
    if (title.some((t) => t.startsWith(w))) score += 3;
    else if (body.some((t) => t.startsWith(w))) score += 1;
    else return 0; // tüm kelimeler bulunmalı
  }
  return score;
}

// ----------------------------------------------------------------- Sıralama

export function sortRecipes(list: RecipeIndexItem[], sort: SortKey, recommendedOrder?: string[]): RecipeIndexItem[] {
  const arr = [...list];
  switch (sort) {
    case "popular":
      return arr.sort((a, b) => popularity(b) - popularity(a));
    case "fastest":
      return arr.sort((a, b) => a.totalMinutes - b.totalMinutes || popularity(b) - popularity(a));
    case "lowest-calorie":
      return arr.sort((a, b) => (a.calories ?? Infinity) - (b.calories ?? Infinity));
    case "top-rated":
      return arr.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    case "newest":
      return arr.sort((a, b) => b.createdAt - a.createdAt);
    case "recommended":
    default: {
      if (recommendedOrder?.length) {
        const rank = new Map(recommendedOrder.map((id, i) => [id, i]));
        return arr.sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6));
      }
      const s = (r: RecipeIndexItem) => r.ratingAvg * 20 + Math.log10(1 + popularity(r)) * 15 + (r.featured ? 10 : 0);
      return arr.sort((a, b) => s(b) - s(a));
    }
  }
}
