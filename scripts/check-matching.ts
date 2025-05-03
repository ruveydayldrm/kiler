 
// Eşleştirme çekirdeği için hızlı duman testi: npx tsx scripts/check-matching.ts
import { INGREDIENTS } from "../prisma/seed/ingredients";
import { RECIPES } from "../prisma/seed/recipes";
import { IngredientLexicon, extractSignals, searchRecipes, matchPantry, titleMatchScore, type RecipeIndexItem } from "../src/lib/matching";
import { slugify } from "../src/lib/utils";

const lexicon = new IngredientLexicon(
  INGREDIENTS.map((i) => ({ slug: i.slug, name: i.name, synonyms: i.syn ?? [], parentSlug: i.parent ?? null, aisle: i.aisle, isBasic: !!i.basic })),
);
const index: RecipeIndexItem[] = RECIPES.map((r, i) => ({
  id: String(i), slug: slugify(r.title), title: r.title, description: r.desc, imageUrl: null, coverColor: r.color,
  categorySlug: r.cat, categoryName: r.cat, cuisineSlug: r.cui, cuisineName: r.cui, difficulty: r.diff, prepMinutes: r.prep,
  cookMinutes: r.cook, totalMinutes: r.prep + r.cook, servings: r.serv, calories: 400, protein: null, carbs: null, fat: null,
  diets: [], allergens: [], tags: r.tags ?? [], ratingAvg: 4, ratingCount: 1, viewCount: 0, favoriteCount: 0, cookedCount: 0,
  featured: false, createdAt: 0, ingredients: r.ing.map(([, , s, , o]) => ({ slug: s, name: s, optional: !!o })),
}));

let failures = 0;
const expect = (label: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "✓" : "✗"} ${label}${detail ? `  → ${detail}` : ""}`);
  if (!cond) failures++;
};

const s1 = extractSignals("Dolabımda yumurta, ıspanak ve peynir var, 20 dakikada ne yaparım?", lexicon);
expect("malzeme çıkarımı", ["yumurta", "ispanak", "peynir"].every((x) => s1.ingredients.includes(x)), s1.ingredients.join(","));
expect("süre sinyali", s1.maxMinutes === 20);
expect("dolap kalıbı", s1.isPantryPhrase);

const r1 = searchRecipes(index, "Dolabımda yumurta, ıspanak ve peynir var, 20 dakikada ne yaparım?", lexicon);
expect("omlet ilk sırada", r1.results[0]?.title === "Ispanaklı Peynirli Omlet", r1.results.slice(0, 3).map((r) => r.title).join(" | "));

const r2 = searchRecipes(index, "Mercimek çorbası var mı?", lexicon);
expect("doğrudan tarif", r2.results[0]?.title === "Mercimek Çorbası", r2.results.slice(0, 3).map((r) => r.title).join(" | "));
expect("var mı kalıbı", r2.signals.isAvailabilityQuestion);

expect("yarım tarif adı", titleMatchScore("mercimek ç", "Mercimek Çorbası") > 80);
const r3 = searchRecipes(index, "Suşi tarifi var mı?", lexicon);
expect("arşivde olmayan tarif", r3.results.length === 0, r3.mode);

const s4 = extractSignals("500 kalori altı vegan akşam yemeği", lexicon);
expect("kalori + diyet", s4.maxCalories === 500 && s4.diets.includes("vegan") && s4.meal === "DINNER");

const s5 = extractSignals("Bu haftamı 1800 kaloriyle planla", lexicon);
expect("günlük kalori", s5.dailyCalories === 1800);

const s6 = extractSignals("Glutensiz bir kahvaltı öner, 4 kişiyiz.", lexicon);
expect("kişi sayısı + glutensiz", s6.servings === 4 && s6.diets.includes("gluten-free") && s6.meal === "BREAKFAST");

const s7 = extractSignals("yumurtalı bir şey ama soğansız olsun", lexicon);
expect("yumurtalı ≠ yumurta", s7.withIngredients.includes("yumurta") && !s7.ingredients.includes("yumurta"));
expect("soğansız → dışla", s7.excludeIngredients.includes("sogan"));

const s8 = extractSignals("domatesler, ıspanağı, salçası, kıyma", lexicon);
expect("ek toleransı", ["domates", "ispanak", "domates-salcasi", "kiyma"].every((x) => s8.ingredients.includes(x)), s8.ingredients.join(","));
expect("eş anlamlı: çekilmiş et", lexicon.resolve("çekilmiş et") === "kiyma");
expect("ASCII yazım: ispanak", lexicon.resolve("ispanak") === "ispanak");

const pm = matchPantry(index, ["peynir", "yumurta", "ispanak"], lexicon);
const omlet = pm.find((m) => m.recipe.title === "Ispanaklı Peynirli Omlet");
expect(
  "peynir → beyaz peyniri kapsar",
  !!omlet && omlet.matched.some((i) => i.slug === "beyaz-peynir") && omlet.missing.map((i) => i.slug).join() === "tereyagi",
  omlet ? `%${omlet.percent}, eksik: ${omlet.missing.map((i) => i.slug).join(",")}` : "yok",
);
const pm2 = matchPantry(index, ["tavuk", "pirinc"], lexicon);
expect("tavuk + pirinç sonuç verir", pm2.length > 0, pm2.slice(0, 3).map((m) => `${m.recipe.title} %${m.percent}`).join(" | "));
expect("'tavsiye et' et değildir", !extractSignals("bana bir şey tavsiye et", lexicon).ingredients.includes("et"));
expect("'şu' su değildir (arama)", searchRecipes(index, "şu tarifi göster", lexicon).mode !== "pantry");

console.log(failures ? `\n${failures} test başarısız` : "\nTüm kontroller geçti");
process.exit(failures ? 1 : 0);
