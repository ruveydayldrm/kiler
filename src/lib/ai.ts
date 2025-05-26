import "server-only";
// =============================================================================
//  AI Mutfak Asistanı — akış
//
//  Kullanıcı mesajı
//   → Niyet tespiti (detectIntent)
//   → Sinyal çıkarma (lib/matching.ts → extractSignals)
//   → Veritabanı sorgusu: getVisibleRecipes() — alerji + sevilmeyenler SERT filtre
//   → İlgili birkaç tarif (searchRecipes / matchPantry)
//   → AI bağlamı (yalnızca adaylar; tüm veritabanı ASLA gönderilmez)
//   → OpenAI (JSON modu)  |  anahtar yoksa şablon (demo)
//   → Sunucuda doğrulama: yalnızca aday listesindeki tarif id'leri kalır
//   → Yapılandırılmış yanıt (ChatResponse) → frontend kartları
//
//  Yazma gerektiren aksiyonlar (listeye/plana ekle) yalnızca ÖNERİ olarak döner;
//  kullanıcı onaylayınca ayrı API uçları üzerinden uygulanır.
// =============================================================================

import { db } from "./db";
import { completeJson, isAiEnabled } from "./openai";
import { getPantrySlugs, getVisibleRecipes, type UserKitchen } from "./recipes";
import {
  extractSignals,
  fold,
  matchPantry,
  searchRecipes,
  titleMatchScore,
  type IngredientLexicon,
  type MatchResult,
  type QuerySignals,
  type RecipeIndexItem,
} from "./matching";
import { buildWeeklyPlan, plannerCandidates } from "./planner";
import { GENERAL_ADVICE_NOTE, MEDICAL_NOTE, substitutesFor } from "./substitutions";
import { DIETS, MEALS, labelOf, type MealKey } from "./constants";
import { formatAmount, scaleQuantity } from "./units";
import { isoDate, startOfWeek } from "./utils";
import { toJson } from "./json";
import type { ChatAction, ChatIntent, ChatRecipeCard, ChatResponse, PlanPreview } from "@/types/ai";

export interface KitchenAssistantInput {
  message: string;
  userId: string | null;
  recipeId?: string;
  /** Misafir kullanıcının localStorage'daki dolabı */
  pantry?: string[];
}

// ----------------------------------------------------------------- Niyet tespiti

const RX = {
  greeting: /^(merhaba|selam|slm|sa|hey|günaydın|gunaydin|iyi akşamlar|iyi aksamlar|naber|nasılsın)[\s!.?]*$/i,
  medical: /(diyabet|şeker hastas|seker hastas|tansiyon|böbrek|bobrek|kolesterol|hamile|gebelik|emzir|reflü|reflu|gastrit|kanser|insülin|insulin|hastalığ|hastalig|ilaç|ilac|doktor)/i,
  substitution: /(yerine|ikame|alternatif|olmadan nasıl|olmadan nasil|yoksa ne kullan|bulamadım|bulamadim|kullanabilir miyim)/i,
  plan: /(planla|plan yap|plan oluştur|plan olustur|haftalık menü|haftalik menu|haftamı|haftami|haftalık plan|haftalik plan|menü oluştur|menu olustur)/i,
  shopping: /(listeme|alışveriş|alisveris|listem|market listesi)/i,
  pantryOnly: /(dolabımdaki|dolabimdaki|dolabımda ne|dolabimda ne|elimdekiler|evdekiler|dolaptakiler)/i,
  scale: /(\d+|iki|üç|uc|dört|dort|beş|bes|altı|alti|sekiz|on)\s*(kişilik|kisilik|kişiye|kisiye|porsiyon)|yarıya|yariya|iki katı|iki kati/i,
  vegan: /(vegan|bitkisel|hayvansal ürün|hayvansal urun)/i,
  pairing: /(yanına|yanina|yanında|yaninda|eşlik|eslik|ne yakışır|ne yakisir|ne gider)/i,
  noOven: /(fırın(ım)? yok|firin(im)? yok|fırınsız|firinsiz|tavada olur|ocakta olur|fırın olmadan|firin olmadan)/i,
};

export function detectIntent(message: string, signals: QuerySignals, hasRecipe: boolean): ChatIntent {
  const m = message.trim();
  if (RX.greeting.test(m)) return "greeting";
  if (hasRecipe) {
    if (RX.noOven.test(m)) return "no_oven";
    if (RX.vegan.test(m) && /(yap|olur|uygun|mı|mi|miyim)/i.test(m)) return "veganize";
    if (RX.substitution.test(m)) return "substitution";
    if (RX.scale.test(m)) return "scale";
    if (RX.pairing.test(m)) return "pairing";
    return "recipe_info";
  }
  if (RX.plan.test(m) || (signals.dailyCalories && /(hafta|gunluk|günlük|beslen)/i.test(m))) return "plan";
  if (RX.substitution.test(m) && (signals.ingredients.length || signals.withIngredients.length)) return "substitution";
  if (RX.shopping.test(m) && /(ne|eksik|ekle)/i.test(m)) return "shopping";
  if (RX.pantryOnly.test(m) && !signals.ingredients.length) return "pantry";
  if (signals.ingredients.length) return signals.isPantryPhrase || signals.ingredients.length >= 2 ? "pantry" : "ingredient_search";
  return "filter_search";
}

// ----------------------------------------------------------------- Kart & aksiyon üretimi

export function toCard(r: RecipeIndexItem, match?: MatchResult): ChatRecipeCard {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    imageUrl: r.imageUrl,
    coverColor: r.coverColor,
    categoryName: r.categoryName,
    totalMinutes: r.totalMinutes,
    calories: r.calories,
    servings: r.servings,
    diets: r.diets,
    ...(match
      ? {
          matchPercent: match.percent,
          matched: match.haveCount,
          required: match.requiredCount,
          missing: match.missing.map((i) => ({ slug: i.slug, name: i.name })),
        }
      : {}),
  };
}

function cardActions(card: ChatRecipeCard, servings?: number): ChatAction[] {
  const actions: ChatAction[] = [];
  if (card.missing?.length) {
    actions.push({ kind: "confirm", type: "add-missing", label: `${card.title} için eksikleri listeye ekle`, payload: { recipeId: card.id, servings } });
  }
  actions.push({ kind: "confirm", type: "add-to-plan", label: `${card.title} tarifini plana ekle`, payload: { recipeId: card.id } });
  return actions;
}

const dietLabels = (keys: string[]) => keys.map((k) => labelOf(DIETS, k).toLocaleLowerCase("tr-TR"));

function describeFilters(s: QuerySignals) {
  const parts: string[] = [];
  if (s.maxMinutes) parts.push(`${s.maxMinutes} dakikada hazır`);
  if (s.maxCalories) parts.push(`${s.maxCalories} kalorinin altında`);
  if (s.diets.length) parts.push(dietLabels(s.diets.filter((d) => !(d === "vegetarian" && s.diets.includes("vegan")))).join(", "));
  if (s.meal) parts.push(labelOf(MEALS, s.meal).toLocaleLowerCase("tr-TR") + " için");
  return parts;
}

// Arşivde olmayan popüler yemekler için yakın alternatif ipuçları
const DISH_HINTS: { rx: RegExp; cuisine?: string; ingredients?: string[]; category?: string }[] = [
  { rx: /(susi|sushi|ramen|noodle|dumpling|wok)/, cuisine: "asya" },
  { rx: /(pizza|lazanya|tiramisu|carbonara|gnocchi)/, cuisine: "italyan" },
  { rx: /(taco|burrito|nachos|quesadilla|enchilada)/, cuisine: "meksika" },
  { rx: /(cheesecake|kek|pasta|kurabiye|sufle|tiramisu)/, category: "tatlilar" },
  { rx: /(airfryer|air fryer|fritoz)/, ingredients: ["patates", "tavuk"] },
  { rx: /(tandir|kebap|kebab|doner|iskender|kuzu)/, ingredients: ["et", "kusbasi"] },
  { rx: /(burger|hamburger|kofte)/, ingredients: ["kiyma"] },
];

function alternativesFor(query: string, pool: RecipeIndexItem[], lexicon: IngredientLexicon, signals: QuerySignals): RecipeIndexItem[] {
  const q = fold(query);
  for (const hint of DISH_HINTS) {
    if (!hint.rx.test(q)) continue;
    let list = pool;
    if (hint.cuisine) list = list.filter((r) => r.cuisineSlug === hint.cuisine);
    if (hint.category) list = list.filter((r) => r.categorySlug === hint.category);
    if (hint.ingredients) {
      const set = lexicon.expandDown(hint.ingredients);
      list = list.filter((r) => r.ingredients.some((i) => set.has(i.slug)));
    }
    if (list.length) return [...list].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 3);
  }
  // Kısmi başlık benzerliği → kategori → popüler
  const partial = pool
    .map((r) => ({ r, s: titleMatchScore(query, r.title) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
  if (partial.length) return partial.slice(0, 3);
  if (signals.categorySlugs.length) {
    const byCat = pool.filter((r) => signals.categorySlugs.includes(r.categorySlug));
    if (byCat.length) return byCat.slice(0, 3);
  }
  return [...pool].sort((a, b) => b.ratingAvg * 10 + Math.log10(1 + b.viewCount) - (a.ratingAvg * 10 + Math.log10(1 + a.viewCount))).slice(0, 3);
}

// ----------------------------------------------------------------- OpenAI bağlamı

const SYSTEM_KITCHEN = `Sen "Kiler" adlı yemek uygulamasının sıcak, samimi ve kısa konuşan Türkçe mutfak asistanısın.
KESİN KURALLAR:
1. Yalnızca sana "adaylar" listesinde verilen tarifleri önerebilirsin. Listede olmayan bir tarifi ASLA uydurma, ismini bile anma.
2. Kalori, süre, besin değeri gibi sayıları yalnızca adaylardaki alanlardan al; kendi rakamını üretme.
3. "arsivde_yok" true ise ilk cümlen tam olarak şu olmalı: "Bu tarif şu anda tarif arşivimizde bulunmuyor." Ardından adayları yakın alternatif olarak sun.
4. Tıbbi diyet tavsiyesi verme; sağlıkla ilgili sorularda uzmana yönlendir.
5. Genel mutfak bilgisi (ikame vb.) verirken bunun genel bir öneri olduğunu belirt.
6. Yanıtın en fazla 4 kısa cümle olsun. Emoji kullanabilirsin ama abartma.
Çıktı JSON: {"message": string, "recipeIds": string[]} — recipeIds en fazla 4 öğe ve YALNIZCA adaylardaki id'lerden.`;

interface LlmPick {
  message?: string;
  recipeIds?: string[];
}

function candidateContext(cards: ChatRecipeCard[]) {
  return cards.map((c) => ({
    id: c.id,
    ad: c.title,
    kategori: c.categoryName,
    toplam_dakika: c.totalMinutes,
    porsiyon_kalori: c.calories,
    diyet: c.diets,
    ...(c.matchPercent != null ? { eslesme_yuzde: c.matchPercent, eksikler: c.missing?.map((m) => m.name) } : {}),
  }));
}

/** LLM ile mesajı yazdırır; yalnızca aday id'leri kabul edilir. */
async function composeWithLlm(
  message: string,
  intent: ChatIntent,
  cards: ChatRecipeCard[],
  kitchen: UserKitchen,
  extra: Record<string, unknown> = {},
): Promise<{ message: string; cards: ChatRecipeCard[] } | null> {
  if (!isAiEnabled()) return null;
  const out = await completeJson<LlmPick>(
    SYSTEM_KITCHEN,
    JSON.stringify({
      kullanici_mesaji: message,
      niyet: intent,
      kullanici_tercihleri: { diyet: kitchen.diets, hane: kitchen.householdSize },
      adaylar: candidateContext(cards),
      ...extra,
    }),
  );
  if (!out?.message || typeof out.message !== "string") return null;
  // Sunucu tarafı doğrulama: aday listesi dışındaki id'ler elenir
  const allowed = new Map(cards.map((c) => [c.id, c]));
  const picked = (Array.isArray(out.recipeIds) ? out.recipeIds : []).filter((id) => typeof id === "string" && allowed.has(id));
  const ordered = [...new Set(picked)].map((id) => allowed.get(id)!);
  const rest = cards.filter((c) => !picked.includes(c.id));
  return { message: out.message.slice(0, 1200), cards: (ordered.length ? [...ordered, ...rest] : cards).slice(0, 4) };
}

// ----------------------------------------------------------------- Ana akış

export async function runKitchenAssistant(input: KitchenAssistantInput): Promise<ChatResponse> {
  const { visible, all, lexicon, kitchen } = await getVisibleRecipes(input.userId);
  const pantry = input.userId ? await getPantrySlugs(input.userId) : (input.pantry ?? []);
  const signals = extractSignals(input.message, lexicon);
  const intent = detectIntent(input.message, signals, !!input.recipeId);
  const mode: ChatResponse["mode"] = isAiEnabled() ? "openai" : "demo";
  const medical = RX.medical.test(input.message);

  let response: ChatResponse;
  if (input.recipeId) {
    response = await recipeContextAnswer(input, intent, signals, visible, lexicon, kitchen);
  } else {
    response = await catalogAnswer(input, intent, signals, visible, all, lexicon, kitchen, pantry);
  }
  if (medical) response.notice = [MEDICAL_NOTE, response.notice].filter(Boolean).join(" ");
  if (mode === "demo") response.mode = "demo";

  await logQuery(input, response, signals).catch(() => {});
  return response;
}

async function catalogAnswer(
  input: KitchenAssistantInput,
  intent: ChatIntent,
  signals: QuerySignals,
  visible: RecipeIndexItem[],
  all: RecipeIndexItem[],
  lexicon: IngredientLexicon,
  kitchen: UserKitchen,
  pantry: string[],
): Promise<ChatResponse> {
  const base: ChatResponse = { message: "", recipes: [], missingIngredients: [], actions: [], intent, mode: isAiEnabled() ? "openai" : "demo" };
  const servings = signals.servings;

  if (intent === "greeting") {
    return { ...base, message: "Merhaba 👋 Bugün ne pişirelim? Elindeki malzemeleri, ne kadar vaktin olduğunu ya da canının ne çektiğini söyle." };
  }

  // ---- İkame (genel mutfak bilgisi)
  if (intent === "substitution") {
    const slugs = [...signals.ingredients, ...signals.withIngredients, ...signals.excludeIngredients];
    const lines: string[] = [];
    for (const slug of slugs.slice(0, 2)) {
      const subs = substitutesFor(slug, { veganOnly: signals.diets.includes("vegan") });
      if (!subs.length) continue;
      lines.push(`${lexicon.name(slug)} yerine: ${subs.map((s) => `${s.use}${s.ratio ? ` (${s.ratio})` : ""}`).join("; ")}`);
    }
    const message = lines.length
      ? `Elbette! ${lines.join(". ")}.`
      : "Bu malzeme için arşivimde hazır bir ikame bilgisi yok. Hangi tarifte kullanacağını söylersen o tarife göre yardımcı olabilirim.";
    const llm = isAiEnabled()
      ? await completeJson<{ message: string }>(
          `${SYSTEM_KITCHEN}\nBu soruda tarif önermene gerek yok; yalnızca verilen "ikame_bilgisi"ni sıcak bir dille aktar. JSON: {"message": string}`,
          JSON.stringify({ kullanici_mesaji: input.message, ikame_bilgisi: lines }),
        )
      : null;
    return { ...base, message: llm?.message?.slice(0, 1200) || message, notice: GENERAL_ADVICE_NOTE };
  }

  // ---- Haftalık plan taslağı
  if (intent === "plan") {
    return planAnswer(input, signals, visible, kitchen, base);
  }

  // ---- Alışveriş listesi önerisi
  if (intent === "shopping") {
    const matches = pantry.length ? matchPantry(visible, pantry, lexicon, { alwaysHave: kitchen.alwaysHave }).filter((m) => m.missing.length >= 1 && m.missing.length <= 2) : [];
    if (!matches.length) {
      return {
        ...base,
        message: pantry.length
          ? "Dolabındakilerle zaten pek çok tarifi yapabiliyorsun 🎉 Bir tarif seç, eksik kalan bir şey olursa tek tıkla listene eklerim."
          : "Önce dolabında neler olduğunu söyle (ör. 'yumurta, domates, peynir'); eksikleri buna göre önereyim.",
      };
    }
    const cards = matches.slice(0, 3).map((m) => toCard(m.recipe, m));
    const missing = uniqueMissing(cards);
    return {
      ...base,
      recipes: cards,
      missingIngredients: missing,
      actions: [
        { kind: "confirm", type: "add-items", label: `${missing.length} eksik malzemeyi listeye ekle`, payload: { items: missing.map((m) => ({ ingredientSlug: m.slug, name: m.name })) } },
      ],
      message: `Dolabına göre bu tarifler için sadece 1-2 malzeme eksik: ${missing.map((m) => m.name.toLocaleLowerCase("tr-TR")).join(", ")}. Listene ekleyeyim mi?`,
    };
  }

  // ---- Arama
  const useStoredPantry = intent === "pantry" && !signals.ingredients.length;
  if (useStoredPantry && !pantry.length) {
    return {
      ...base,
      message: "Dolabın şu an boş görünüyor. Elindeki malzemeleri yazarsan (ör. 'yumurta, ıspanak, peynir') sana uygun tarifleri bulayım ya da Dolabım sayfasından kaydedebilirsin.",
      actions: [{ kind: "link", type: "open", label: "Dolabımı düzenle", payload: { href: "/pantry" } }],
    };
  }
  const query = useStoredPantry ? `${input.message} ${pantry.map((s) => lexicon.name(s)).join(" ")}` : input.message;
  const outcome = searchRecipes(visible, query, lexicon, {
    alwaysHave: kitchen.alwaysHave,
    pantry: signals.isPantryPhrase ? pantry : undefined,
    extraFilters: useStoredPantry ? undefined : undefined,
  });

  // Alerji/sevilmeyen nedeniyle gizlenen doğrudan eşleşme var mı?
  let notice: string | undefined;
  const hiddenTitle = all.find((r) => !visible.includes(r) && titleMatchScore(input.message, r.title) >= 85);
  if (hiddenTitle) notice = `"${hiddenTitle.title}" tarifi alerjen veya sevmediğin malzeme içerdiği için önerilmiyor. Tercihlerini Hesabım → Mutfak Tercihlerim'den değiştirebilirsin.`;

  const titleHit = outcome.titleMatches[0];
  const asksSpecific = signals.isAvailabilityQuestion || /(tarifi|nasıl yapılır|nasil yapilir)/i.test(input.message);
  const meaningful = signals.ingredients.filter((s) => !lexicon.entries.get(s)?.isBasic);
  const notFound = asksSpecific && !titleHit && !meaningful.length && !signals.withIngredients.length;

  if (notFound || outcome.results.length === 0) {
    const alts = alternativesFor(input.message, visible, lexicon, signals);
    const cards = alts.map((r) => toCard(r));
    const intro = notFound ? "Bu tarif şu anda tarif arşivimizde bulunmuyor." : "Bu kriterlere tam uyan bir tarif bulamadım.";
    const demo = `${intro} Ama sana yakın birkaç alternatif önerebilirim: ${cards.map((c) => c.title).join(", ")}.`;
    const llm = await composeWithLlm(input.message, "not_found", cards, kitchen, { arsivde_yok: notFound });
    const finalMessage = llm?.message && (!notFound || llm.message.includes("arşivimizde bulunmuyor")) ? llm.message : demo;
    return { ...base, intent: "not_found", message: finalMessage, recipes: llm?.cards ?? cards, notice };
  }

  const top = outcome.results.slice(0, 6);
  const cards = top.map((r) => toCard(r, outcome.matches.get(r.id)));
  const filters = describeFilters(signals);
  let demo: string;
  let finalIntent: ChatIntent = intent;

  if (titleHit && cards[0]?.id === titleHit.id) {
    finalIntent = "recipe_lookup";
    const c = cards[0]!;
    demo = `Evet, ${c.title} tarifimiz var! ${c.totalMinutes} dakikada hazır${c.calories ? `, porsiyonu yaklaşık ${c.calories} kcal` : ""}. ${cards.length > 1 ? `Benzer olarak ${cards.slice(1, 3).map((x) => x.title).join(" ve ")} da hoşuna gidebilir.` : ""}`.trim();
  } else if (outcome.mode === "pantry" || outcome.mode === "ingredients") {
    const said = [...signals.ingredients].map((s) => lexicon.name(s).toLocaleLowerCase("tr-TR"));
    const best = cards[0]!;
    demo =
      best.matchPercent != null
        ? `${said.join(", ")} ile ${filters.length ? filters.join(", ") + " " : ""}en iyi eşleşme ${best.title} (%${best.matchPercent}).` +
          (best.missing?.length ? ` Sadece ${best.missing.map((m) => m.name.toLocaleLowerCase("tr-TR")).join(", ")} eksik; istersen listene ekleyebilirim.` : " Tüm malzemeler elinde görünüyor, hemen başlayabilirsin! 🍳")
        : `${said.join(", ")} kullanan ${cards.length} tarif buldum. ${best.title} öne çıkıyor.`;
  } else {
    demo = filters.length
      ? `${filters.join(", ")} ${cards.length} tarif buldum. ${cards[0]!.title} ile başlamaya ne dersin?`
      : `Aradığına en yakın tarifler bunlar. ${cards[0]!.title} çok sevilenlerden.`;
  }
  if (servings) demo += ` ${servings} kişilik için tarif sayfasındaki porsiyon ayarlayıcıyı kullanabilirsin; miktarlar otomatik ölçeklenir.`;

  const llm = await composeWithLlm(input.message, finalIntent, cards, kitchen, { filtreler: filters, kisi_sayisi: servings });
  const finalCards = (llm?.cards ?? cards).slice(0, 4);
  const first = finalCards[0]!;
  return {
    ...base,
    intent: finalIntent,
    message: llm?.message ?? demo,
    recipes: finalCards,
    missingIngredients: first.missing ?? [],
    actions: cardActions(first, servings),
    notice,
  };
}

function uniqueMissing(cards: ChatRecipeCard[]) {
  const map = new Map<string, { slug: string; name: string }>();
  for (const c of cards) for (const m of c.missing ?? []) map.set(m.slug, m);
  return [...map.values()];
}

// ----------------------------------------------------------------- Plan

async function planAnswer(input: KitchenAssistantInput, signals: QuerySignals, visible: RecipeIndexItem[], kitchen: UserKitchen, base: ChatResponse): Promise<ChatResponse> {
  const target = signals.dailyCalories ?? kitchen.calorieTarget;
  const diets = [...new Set([...kitchen.diets, ...signals.diets])];
  const weekStart = isoDate(startOfWeek());
  const params = { calorieTarget: target, diets, maxMinutes: signals.maxMinutes, budget: /(bütçe|butce|ekonomik|ucuz)/i.test(input.message), servings: signals.servings ?? kitchen.householdSize, meals: ["BREAKFAST", "LUNCH", "DINNER"] as MealKey[], noRepeat: true, useLeftovers: true, seed: Date.now() % 100000 };
  const plan = buildWeeklyPlan(visible, params);
  if (!plan.entries.length) {
    return { ...base, message: "Bu kriterlerle haftalık plan oluşturacak kadar tarif bulamadım. Diyet veya süre kısıtını biraz gevşetmeyi dener misin?" };
  }
  const byId = new Map(visible.map((r) => [r.id, r]));
  const preview: PlanPreview = {
    weekStart,
    notes: plan.notes,
    days: Array.from({ length: 7 }, (_, day) => ({
      day,
      calories: plan.dailyCalories[day] ?? 0,
      meals: plan.entries.filter((e) => e.day === day).map((e) => ({ meal: e.meal, recipeId: e.recipeId, title: byId.get(e.recipeId)?.title ?? "", calories: byId.get(e.recipeId)?.calories ?? null })),
    })),
  };
  const avg = Math.round(plan.dailyCalories.reduce((a, b) => a + b, 0) / 7);
  const dietText = diets.length ? `${dietLabels(diets.filter((d) => !(d === "vegetarian" && diets.includes("vegan")))).join(", ")} ` : "";
  const demo = `Senin için ${dietText}bir hafta hazırladım: günlük hedef ${target} kcal, plan ortalaması ${avg} kcal. Aynı tarifi tekrar etmedim${plan.notes.length ? " ve açılan malzemeleri değerlendirmeye çalıştım" : ""}. Beğenirsen onayla, planına kaydedeyim.`;
  const llm = isAiEnabled()
    ? await completeJson<{ message: string }>(
        `${SYSTEM_KITCHEN}\nBu yanıtta yalnızca hazırlanan planı özetle; rakamları yalnızca "plan_ozeti"nden al. JSON: {"message": string}`,
        JSON.stringify({ kullanici_mesaji: input.message, plan_ozeti: { hedef_kcal: target, ortalama_kcal: avg, diyet: diets, notlar: plan.notes, gunluk_kcal: plan.dailyCalories } }),
      )
    : null;
  return {
    ...base,
    intent: "plan",
    message: llm?.message?.slice(0, 1200) || demo,
    plan: preview,
    actions: input.userId
      ? [{ kind: "confirm", type: "save-plan", label: "Planı onayla ve kaydet", payload: { weekStart, entries: plan.entries } }]
      : [{ kind: "link", type: "open", label: "Planı kaydetmek için giriş yap", payload: { href: "/login?callbackUrl=/planner" } }],
    notice: signals.dailyCalories && RX.medical.test(input.message) ? MEDICAL_NOTE : undefined,
  };
}

// ----------------------------------------------------------------- Tarif bağlamı (tarif sayfasındaki AI)

async function recipeContextAnswer(
  input: KitchenAssistantInput,
  intent: ChatIntent,
  signals: QuerySignals,
  visible: RecipeIndexItem[],
  lexicon: IngredientLexicon,
  kitchen: UserKitchen,
): Promise<ChatResponse> {
  const recipe = await db.recipe.findUnique({
    where: { id: input.recipeId },
    include: {
      category: true,
      ingredients: { orderBy: { sortOrder: "asc" }, include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  const base: ChatResponse = { message: "", recipes: [], missingIngredients: [], actions: [], intent, mode: isAiEnabled() ? "openai" : "demo" };
  if (!recipe || !recipe.published) return { ...base, message: "Bu tarifi bulamadım. Sayfayı yenilemeyi dener misin?" };

  const ings = recipe.ingredients;
  let message = "";
  let list: ChatResponse["list"];
  let notice: string | undefined;
  let recipes: ChatRecipeCard[] = [];
  const facts: Record<string, unknown> = {};

  switch (intent) {
    case "veganize": {
      const nonVegan = ings.filter((i) => i.ingredient.kind !== "plant");
      if (!nonVegan.length) {
        message = `${recipe.title} zaten tamamen bitkisel 🌱 Hiçbir değişiklik yapmadan vegan olarak hazırlayabilirsin.`;
      } else {
        const lines = nonVegan.map((i) => {
          const subs = substitutesFor(i.ingredient.slug, { veganOnly: true });
          return `${i.ingredient.name} → ${subs.length ? subs.map((s) => s.use + (s.ratio ? ` (${s.ratio})` : "")).join(" ya da ") : "tarifte çıkarılabilir veya bitkisel bir muadili kullanılabilir"}`;
        });
        list = { title: "Vegan için değiştirilecekler", items: lines };
        message = `Evet, birkaç değişiklikle mümkün! ${recipe.title} tarifinde hayvansal kaynaklı ${nonVegan.length} malzeme var. Aşağıdaki ikamelerle vegan hale getirebilirsin.`;
        notice = GENERAL_ADVICE_NOTE;
      }
      facts.vegan_olmayanlar = nonVegan.map((i) => i.ingredient.name);
      facts.ikameler = list?.items;
      break;
    }
    case "substitution": {
      const mentioned = [...signals.ingredients, ...signals.withIngredients, ...signals.excludeIngredients];
      const target =
        ings.find((i) => mentioned.includes(i.ingredient.slug)) ??
        ings.find((i) => mentioned.some((m) => lexicon.descendants(m).includes(i.ingredient.slug) || lexicon.ancestors(m).includes(i.ingredient.slug)));
      const slug = target?.ingredient.slug ?? mentioned[0];
      if (!slug) {
        message = "Hangi malzemenin yerine ne kullanacağını merak ediyorsun? Örneğin 'krema yerine ne kullanırım?' diye sorabilirsin.";
        break;
      }
      const subs = substitutesFor(slug, { veganOnly: signals.diets.includes("vegan") });
      const name = target?.ingredient.name ?? lexicon.name(slug);
      if (!target) message = `${recipe.title} tarifinde ${name.toLocaleLowerCase("tr-TR")} yok ama genel olarak şunları kullanabilirsin.`;
      else message = `${recipe.title} tarifindeki ${formatAmount(target.quantity, target.unit)} ${name.toLocaleLowerCase("tr-TR")} yerine şunları kullanabilirsin:`;
      list = subs.length ? { title: `${name} yerine`, items: subs.map((s) => `${s.use}${s.ratio ? ` — ${s.ratio}` : ""}${s.note ? ` (${s.note})` : ""}`) } : undefined;
      if (!subs.length) message = `${name} için arşivimde hazır bir ikame bilgisi yok; tarifin dengesini bozmamak için orijinal malzemeyle yapmanı öneririm.`;
      notice = GENERAL_ADVICE_NOTE;
      facts.ikameler = list?.items;
      break;
    }
    case "scale": {
      const m = input.message.match(/(\d+)/);
      const words: Record<string, number> = { iki: 2, üç: 3, uc: 3, dört: 4, dort: 4, beş: 5, bes: 5, altı: 6, alti: 6, sekiz: 8, on: 10 };
      const wordHit = Object.keys(words).find((w) => fold(input.message).includes(`${fold(w)} kisi`));
      let target = signals.servings ?? (m ? Number(m[1]) : wordHit ? words[wordHit]! : recipe.servings);
      if (/yarıya|yariya/i.test(input.message)) target = Math.max(1, Math.round(recipe.servings / 2));
      if (/iki katı|iki kati/i.test(input.message)) target = recipe.servings * 2;
      target = Math.min(Math.max(target, 1), 50);
      const factor = target / recipe.servings;
      list = {
        title: `${target} kişilik malzemeler`,
        items: ings.map((i) => `${formatAmount(scaleQuantity(i.quantity, factor), i.unit)} ${i.ingredient.name}${i.optional ? " (isteğe bağlı)" : ""}`.trim()),
      };
      message = `Tabii! Tarif ${recipe.servings} kişilik; ${target} kişi için tüm miktarları ${factor < 1 ? "küçülttüm" : "büyüttüm"} (×${Math.round(factor * 100) / 100}). Pişirme süreleri genelde aynı kalır ama tencere/tepsi boyutunu buna göre seç.`;
      facts.olceklenmis = list.items;
      facts.hedef_porsiyon = target;
      break;
    }
    case "pairing": {
      const PAIR: Record<string, string[]> = {
        "ana-yemekler": ["salatalar", "corbalar", "icecekler", "atistirmaliklar"],
        makarnalar: ["salatalar", "icecekler"],
        corbalar: ["hamur-isleri", "salatalar", "atistirmaliklar"],
        kahvalti: ["icecekler", "hamur-isleri"],
        tatlilar: ["icecekler"],
        zeytinyaglilar: ["ana-yemekler", "salatalar", "atistirmaliklar"],
      };
      const cats = PAIR[recipe.category.slug] ?? ["salatalar", "atistirmaliklar"];
      const isVegan = recipe.isVegan;
      const picks: RecipeIndexItem[] = [];
      for (const c of cats) {
        const best = visible
          .filter((r) => r.categorySlug === c && r.id !== recipe.id && (!isVegan || r.diets.includes("vegan")))
          .sort((a, b) => b.ratingAvg - a.ratingAvg)[0];
        if (best) picks.push(best);
        if (picks.length >= 3) break;
      }
      recipes = picks.map((r) => toCard(r));
      message = picks.length
        ? `${recipe.title} yanına ${picks.map((p) => p.title).join(", ")} çok yakışır. Hepsi arşivimizde; istersen birini plana ekleyebilirsin.`
        : "Bu tarifin yanına arşivimizden uygun bir eşlikçi bulamadım.";
      break;
    }
    case "no_oven": {
      const ovenSteps = recipe.steps.filter((s) => /fırın|firin|°C/i.test(s.text));
      message = ovenSteps.length
        ? `Olur! ${recipe.title} tarifindeki fırın adımları için kalın tabanlı, kapaklı bir tava kullanabilirsin: orta-kısık ateşte kapağı kapalı pişir, süreyi yaklaşık %20-30 kısa tut ve ara ara kontrol et. Üstün kızarmasını istersen son 2-3 dakika kapağı açıp çevirebilirsin.`
        : `${recipe.title} zaten fırın gerektirmiyor; tüm adımlar ocakta yapılıyor. 🙂`;
      if (ovenSteps.length) {
        list = { title: "Fırın kullanılan adımlar", items: ovenSteps.map((s) => `${s.order}. ${s.text}`) };
        notice = GENERAL_ADVICE_NOTE;
      }
      break;
    }
    default: {
      const kcal = recipe.calories ? `, porsiyonu yaklaşık ${Math.round(recipe.calories)} kcal` : "";
      message = `${recipe.title}: ${recipe.servings} kişilik, toplam ${recipe.totalMinutes} dakika${kcal}. ${recipe.steps.length} adımda hazırlanıyor. Bana "Bunu vegan yapabilir miyim?", "Krema yerine ne kullanırım?", "2 kişilik yap" ya da "Yanına ne yakışır?" diye sorabilirsin.`;
    }
  }

  if (isAiEnabled() && intent !== "pairing") {
    const llm = await completeJson<{ message: string }>(
      `${SYSTEM_KITCHEN}\nKullanıcı şu an bir tarif sayfasında. Cevabını YALNIZCA verilen tarif bilgisine ve "hesaplanan_bilgiler"e dayandır; yeni miktar veya besin değeri uydurma. Ölçekli liste veya ikame listesi zaten ayrıca gösterilecek, tekrar etme. JSON: {"message": string}`,
      JSON.stringify({
        kullanici_mesaji: input.message,
        tarif: {
          ad: recipe.title,
          porsiyon: recipe.servings,
          toplam_dakika: recipe.totalMinutes,
          porsiyon_kalori: recipe.calories,
          malzemeler: ings.map((i) => `${formatAmount(i.quantity, i.unit)} ${i.ingredient.name}${i.note ? ` (${i.note})` : ""}`),
          adimlar: recipe.steps.map((s) => s.text),
        },
        hesaplanan_bilgiler: facts,
        demo_yanit: message,
      }),
    );
    if (llm?.message) message = llm.message.slice(0, 1200);
  }

  void kitchen;
  return { ...base, message, list, notice, recipes };
}

// ----------------------------------------------------------------- Kayıt

async function logQuery(input: KitchenAssistantInput, res: ChatResponse, signals: QuerySignals) {
  await db.aIQueryLog.create({
    data: {
      userId: input.userId,
      source: "CHAT",
      query: input.message.slice(0, 500),
      intent: res.intent,
      ingredients: toJson([...signals.ingredients, ...signals.withIngredients]),
      filters: toJson({ maxMinutes: signals.maxMinutes, maxCalories: signals.maxCalories, diets: signals.diets, recipeId: input.recipeId }),
      recipeIds: toJson(res.recipes.map((r) => r.id)),
      resultCount: res.recipes.length,
      success: res.intent !== "not_found" && (res.recipes.length > 0 || !!res.list || !!res.plan || ["greeting", "substitution", "recipe_info", "no_oven", "veganize", "scale"].includes(res.intent)),
      mode: res.mode,
    },
  });
}

/** Sohbeti kaydeder (giriş yapmış kullanıcılar için). */
export async function persistConversation(userId: string, conversationId: string | undefined, userMessage: string, response: ChatResponse) {
  let convo = conversationId ? await db.aIConversation.findFirst({ where: { id: conversationId, userId, kind: "KITCHEN" } }) : null;
  if (!convo) convo = await db.aIConversation.findFirst({ where: { userId, kind: "KITCHEN" }, orderBy: { updatedAt: "desc" } });
  if (!convo) convo = await db.aIConversation.create({ data: { userId, kind: "KITCHEN", title: userMessage.slice(0, 80) } });
  await db.aIMessage.createMany({
    data: [
      { conversationId: convo.id, role: "user", content: userMessage },
      { conversationId: convo.id, role: "assistant", content: response.message, payload: toJson(response) },
    ],
  });
  await db.aIConversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });
  return convo.id;
}

export { plannerCandidates };
