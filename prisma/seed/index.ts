 
// Kiler demo verisi: malzemeler → tarifler → kullanıcı verileri → 30 günlük aktivite.
// Çalıştırma: npm run db:seed   (npm run setup bunu otomatik yapar)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { INGREDIENTS } from "./ingredients";
import { RECIPES, type SeedRecipe } from "./recipes";
import { computeNutrition, deriveAllergens, deriveDiets, type NutritionLine } from "../../src/lib/nutrition";
import { slugify } from "../../src/lib/utils";
import { IngredientLexicon, extractSignals, searchRecipes, type RecipeIndexItem } from "../../src/lib/matching";
import type { AllergenKey, DietKey } from "../../src/lib/constants";

const prisma = new PrismaClient();

// ------------------------------------------------------------ deterministik rastgelelik
let seed = 20241014;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const pickN = <T,>(arr: T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const daysAgo = (d: number, hour = 8 + Math.floor(rand() * 13)) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, Math.floor(rand() * 60), 0, 0);
  return date;
};

const CATEGORIES = [
  { slug: "kahvalti", name: "Kahvaltı", icon: "egg", description: "Güne güzel başlamak için" },
  { slug: "corbalar", name: "Çorbalar", icon: "soup", description: "Kaşık kaşık sıcaklık" },
  { slug: "ana-yemekler", name: "Ana Yemekler", icon: "cooking-pot", description: "Sofranın baş köşesi" },
  { slug: "zeytinyaglilar", name: "Zeytinyağlılar", icon: "leaf", description: "Soğuk servis, bol yeşil" },
  { slug: "salatalar", name: "Salatalar", icon: "salad", description: "Taze, renkli, çıtır" },
  { slug: "makarnalar", name: "Makarnalar", icon: "wheat", description: "Her gün başka bir sos" },
  { slug: "hamur-isleri", name: "Hamur İşleri", icon: "croissant", description: "Börek, poğaça, pişi" },
  { slug: "tatlilar", name: "Tatlılar", icon: "cake-slice", description: "Tatlı bir kapanış" },
  { slug: "atistirmaliklar", name: "Atıştırmalıklar", icon: "cookie", description: "Meze ve ara öğünler" },
  { slug: "icecekler", name: "İçecekler", icon: "cup-soda", description: "Serinleten, ısıtan" },
  { slug: "bebek-ve-cocuk", name: "Bebek ve Çocuk", icon: "baby", description: "Minik damaklar için" },
  { slug: "fit-tarifler", name: "Fit Tarifler", icon: "dumbbell", description: "Hafif ve dengeli" },
];

const CUISINES = [
  { slug: "turk", name: "Türk" },
  { slug: "italyan", name: "İtalyan" },
  { slug: "asya", name: "Asya" },
  { slug: "meksika", name: "Meksika" },
  { slug: "orta-dogu", name: "Orta Doğu" },
  { slug: "dunya", name: "Dünya Mutfağı" },
];

const TAG_NAMES: Record<string, string> = {
  "tek-tava": "Tek tava", "tek-tencere": "Tek tencere", "tek-tepsi": "Tek tepsi", "5-dakika": "5 dakikada", "10-dakika": "10 dakikada",
  "15-dakika": "15 dakikada", "20-dakika": "20 dakikada", "meal-prep": "Meal prep", "omega-3": "Omega-3",
};
const tagName = (slug: string) =>
  TAG_NAMES[slug] ?? slug.split("-").map((w, i) => (i === 0 ? w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1) : w)).join(" ");

const REVIEW_TEXTS: Record<number, string[]> = {
  5: [
    "Tarif birebir tuttu, ailece bayıldık. Ölçüler çok net, teşekkürler!",
    "Annemin yaptığı gibi oldu, bundan sonra hep bu tarifle yapacağım.",
    "Porsiyon ayarlayıcıyla 2 kişilik yaptım, kıvamı harikaydı.",
    "Pişirme modu mutfakta çok işime yaradı, ekran hiç kapanmadı.",
    "Misafirlerime yaptım, tarifini isteyen çok oldu.",
  ],
  4: [
    "Çok lezzetli oldu, bir dahakine tuzu biraz azaltacağım.",
    "Güzel tarif, ben biraz daha baharat ekledim.",
    "Süre tam yazıldığı gibi, pratik ve doyurucu.",
    "Çocuklar sevdi, yanına yoğurt yakıştı.",
  ],
  3: ["Fena değil ama benim fırınımda biraz daha uzun sürdü.", "Lezzetliydi, kıvamı için suyu azaltmak gerekebilir."],
  2: ["Benim beklediğim gibi olmadı, belki malzemelerden kaynaklıdır."],
};

const AI_QUERIES_OK = [
  "Dolabımda yumurta, ıspanak ve peynir var, 20 dakikada ne yaparım?",
  "Mercimek çorbası var mı?",
  "500 kalori altı vegan akşam yemeği",
  "Glutensiz bir kahvaltı öner, 4 kişiyiz.",
  "Tavuk ve pirinçle ne yapabilirim?",
  "Elimde tavuk, pirinç ve soğan var",
  "30 dakikada akşam yemeği",
  "Kıymalı pratik bir şey",
  "Etsiz yüksek proteinli tarif",
  "Nohutla ne yapılır?",
  "Patlıcanlı yemek önerir misin?",
  "Çocuklar için sebzeli bir şey",
  "Tereyağı yerine zeytinyağı kullanabilir miyim?",
  "Akşama 30 dakikada hazırlanan, 500 kalorinin altında, etsiz bir şey",
  "Evde makarna, domates ve sarımsak var",
  "Dolabımda tavuk, biber ve mantar var",
  "Hızlı bir tatlı",
  "Bu hafta et yemeden 1800 kaloriyle beslenmek istiyorum",
  "Kırmızı mercimekle çorba dışında ne yapılır?",
  "Yoğurtlu tarifler",
];
const AI_QUERIES_FAIL = [
  "airfryer tarifleri", "airfryer patates", "airfryer tavuk kanadı", "suşi tarifi var mı?", "glutensiz pizza hamuru",
  "keto ekmek", "vegan cheesecake", "kuzu tandır", "tiramisu tarifi", "ramen nasıl yapılır", "airfryer köfte", "tavuk kanat sos",
];

async function wipe() {
  // İlişki sırasına dikkat ederek temizle
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.aIQueryLog.deleteMany();
  await prisma.mealPlanEntry.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.pantryItem.deleteMany();
  await prisma.recipeView.deleteMany();
  await prisma.cookedLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.ingredientConversion.deleteMany();
  await prisma.ingredient.updateMany({ data: { parentId: null } });
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cuisine.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletter.deleteMany();
}

function stepDuration(text: string): number | null {
  // "8 dakika", "3-4 dakika" → üst sınır; "1 saat" → 60
  const m = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*dakika/);
  if (m) return Number(m[2] ?? m[1]);
  const h = text.match(/(\d+)\s*saat/);
  return h ? Number(h[1]) * 60 : null;
}

async function main() {
  console.log("› Veritabanı temizleniyor…");
  await wipe();

  // ---------------------------------------------------------------- Katalog
  console.log("› Kategoriler ve mutfaklar");
  const categories = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.create({ data: { ...c, sortOrder: i } });
    categories.set(c.slug, row.id);
  }
  const cuisines = new Map<string, string>();
  for (const c of CUISINES) cuisines.set(c.slug, (await prisma.cuisine.create({ data: c })).id);

  // ---------------------------------------------------------------- Malzemeler
  console.log(`› ${INGREDIENTS.length} malzeme`);
  const ingIds = new Map<string, string>();
  for (const i of INGREDIENTS) {
    const [kcal, protein, carbs, fat, fiber, sugar, sodium] = i.n;
    const row = await prisma.ingredient.create({
      data: {
        slug: i.slug, name: i.name, aisle: i.aisle, kind: i.kind, defaultUnit: i.unit ?? "g", isBasic: !!i.basic,
        density: i.density ?? null, kcal, protein, carbs, fat, fiber, sugar, sodium,
        synonyms: JSON.stringify(i.syn ?? []), allergens: JSON.stringify(i.allergens ?? []),
        conversions: { create: Object.entries(i.conv ?? {}).map(([unit, grams]) => ({ unit, grams })) },
      },
    });
    ingIds.set(i.slug, row.id);
  }
  for (const i of INGREDIENTS.filter((x) => x.parent)) {
    await prisma.ingredient.update({ where: { slug: i.slug }, data: { parentId: ingIds.get(i.parent!)! } });
  }
  const ingBySlug = new Map(INGREDIENTS.map((i) => [i.slug, i]));

  // ---------------------------------------------------------------- Tarifler
  console.log(`› ${RECIPES.length} tarif`);
  const tagIds = new Map<string, string>();
  const recipeIds = new Map<string, string>();
  const recipeMeta: (SeedRecipe & { id: string; slug: string; diets: DietKey[]; allergens: AllergenKey[]; calories: number })[] = [];
  const createdBase = Date.now() - 120 * 86400000;

  for (const [idx, r] of RECIPES.entries()) {
    for (const [, , slug] of r.ing) if (!ingBySlug.has(slug)) throw new Error(`"${r.title}" tarifinde bilinmeyen malzeme: ${slug}`);
    const lines: NutritionLine[] = r.ing.map(([quantity, unit, slug, , optional]) => {
      const i = ingBySlug.get(slug)!;
      const [kcal, protein, carbs, fat, fiber, sugar, sodium] = i.n;
      return {
        quantity, unit, optional: !!optional,
        ingredient: { name: i.name, kcal, protein, carbs, fat, fiber, sugar, sodium, kind: i.kind, allergens: i.allergens ?? [], density: i.density, conversions: i.conv },
      };
    });
    const { perServing, unresolved } = computeNutrition(lines, r.serv);
    if (unresolved.length) console.warn(`  ! ${r.title}: gram karşılığı yok → ${unresolved.join(", ")}`);
    const flags = deriveDiets(lines, perServing);
    const allergens = deriveAllergens(lines);

    for (const t of r.tags ?? []) {
      if (!tagIds.has(t)) tagIds.set(t, (await prisma.tag.create({ data: { slug: t, name: tagName(t) } })).id);
    }

    const slug = slugify(r.title);
    // İki tarifin besin değerini bilerek boş bırakıyoruz: admin asistanı "besin değeri eksik" sorusunu gösterebilsin.
    const dropNutrition = slug === "kopuklu-ayran" || slug === "muzlu-sut";
    const row = await prisma.recipe.create({
      data: {
        slug, title: r.title, description: r.desc, imageUrl: r.img ?? null, coverColor: r.color,
        categoryId: categories.get(r.cat)!, cuisineId: cuisines.get(r.cui)!, difficulty: r.diff,
        prepMinutes: r.prep, cookMinutes: r.cook, totalMinutes: r.prep + r.cook, servings: r.serv,
        tips: JSON.stringify(r.tips ?? []), featured: !!r.featured,
        ...flags, allergens: JSON.stringify(allergens),
        ...(dropNutrition
          ? {}
          : { calories: perServing.calories, protein: perServing.protein, carbs: perServing.carbs, fat: perServing.fat, fiber: perServing.fiber, sugar: perServing.sugar, sodium: perServing.sodium }),
        createdAt: new Date(createdBase + idx * 36 * 3600000),
        tags: { connect: (r.tags ?? []).map((t) => ({ id: tagIds.get(t)! })) },
        ingredients: {
          create: r.ing.map(([quantity, unit, s, note, optional], i) => ({
            ingredientId: ingIds.get(s)!, quantity, unit, note: note || null, optional: !!optional, sortOrder: i,
          })),
        },
        steps: { create: r.steps.map((text, i) => ({ order: i + 1, text, durationMinutes: stepDuration(text) })) },
      },
    });
    recipeIds.set(slug, row.id);
    const diets = (Object.entries({ vegetarian: flags.isVegetarian, vegan: flags.isVegan, "gluten-free": flags.isGlutenFree, "lactose-free": flags.isLactoseFree, "low-carb": flags.isLowCarb, "high-protein": flags.isHighProtein }) as [DietKey, boolean][])
      .filter(([, v]) => v).map(([k]) => k);
    recipeMeta.push({ ...r, id: row.id, slug, diets, allergens, calories: perServing.calories });
  }

  const dietCounts = Object.fromEntries(
    (["vegetarian", "vegan", "gluten-free", "lactose-free", "low-carb", "high-protein"] as DietKey[]).map((d) => [d, recipeMeta.filter((r) => r.diets.includes(d)).length]),
  );
  console.log("  diyet dağılımı:", dietCounts);
  for (const [d, n] of Object.entries(dietCounts)) if (n < 8) console.warn(`  ! ${d} için yalnızca ${n} tarif var`);

  // ---------------------------------------------------------------- Kullanıcılar
  console.log("› Kullanıcılar");
  const demoHash = await bcrypt.hash("Demo123!", 10);
  const adminHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: { name: "Kiler Yönetici", email: "admin@kiler.app", passwordHash: adminHash, role: "ADMIN", lastActiveAt: new Date(), preference: { create: {} } },
  });
  const demo = await prisma.user.create({
    data: {
      name: "Elif Demir", email: "demo@kiler.app", passwordHash: demoHash, lastActiveAt: new Date(),
      preference: { create: { householdSize: 3, calorieTarget: 2000, skillLevel: "INTERMEDIATE", dislikedIngredients: JSON.stringify(["bamya"]) } },
    },
  });
  const vegan = await prisma.user.create({
    data: {
      name: "Deniz Yıldız", email: "vegan@kiler.app", passwordHash: demoHash, lastActiveAt: daysAgo(1),
      preference: { create: { diets: JSON.stringify(["vegan", "vegetarian"]), householdSize: 2, calorieTarget: 1800, skillLevel: "ADVANCED" } },
    },
  });
  const glutenFree = await prisma.user.create({
    data: {
      name: "Can Aksoy", email: "glutensiz@kiler.app", passwordHash: demoHash, lastActiveAt: daysAgo(2),
      preference: { create: { diets: JSON.stringify(["gluten-free"]), allergens: JSON.stringify(["gluten"]), householdSize: 4, calorieTarget: 2200, skillLevel: "BEGINNER" } },
    },
  });
  const protein = await prisma.user.create({
    data: {
      name: "Selin Kaya", email: "protein@kiler.app", passwordHash: demoHash, lastActiveAt: daysAgo(0),
      preference: { create: { diets: JSON.stringify(["high-protein"]), allergens: JSON.stringify(["nuts", "peanut"]), householdSize: 1, calorieTarget: 2400, skillLevel: "INTERMEDIATE" } },
    },
  });

  const FIRST = ["Ayşe", "Mehmet", "Zeynep", "Ahmet", "Fatma", "Emre", "Merve", "Burak", "Elif", "Mert", "Ece", "Kaan", "Derya", "Onur", "Gizem", "Barış", "Seda", "Tolga", "İrem", "Cem", "Pınar", "Serkan", "Buse", "Hakan"];
  const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Arslan", "Doğan", "Kılıç", "Aydın", "Öztürk", "Koç", "Kurt"];
  const extras = [];
  for (let i = 0; i < 24; i++) {
    const name = `${FIRST[i]} ${pick(LAST)}`;
    extras.push(
      await prisma.user.create({
        data: {
          name, email: `kullanici${i + 1}@ornek.com`, passwordHash: demoHash, createdAt: daysAgo(30 + Math.floor(rand() * 90)),
          lastActiveAt: daysAgo(Math.floor(rand() * 20)), preference: { create: { householdSize: 1 + Math.floor(rand() * 4) } },
        },
      }),
    );
  }
  const everyone = [demo, vegan, glutenFree, protein, ...extras];

  // Kullanıcının alerjen/diyet kısıtına uyan tarifler
  const suitable = (u: { id: string }) => {
    if (u.id === vegan.id) return recipeMeta.filter((r) => r.diets.includes("vegan"));
    if (u.id === glutenFree.id) return recipeMeta.filter((r) => !r.allergens.includes("gluten"));
    if (u.id === protein.id) return recipeMeta.filter((r) => !r.allergens.includes("nuts") && !r.allergens.includes("peanut"));
    if (u.id === demo.id) return recipeMeta.filter((r) => !r.ing.some(([, , s]) => s === "bamya"));
    return recipeMeta;
  };

  // ---------------------------------------------------------------- Dolaplar
  console.log("› Dolaplar, favoriler, yorumlar");
  const pantries: Record<string, string[]> = {
    [demo.id]: ["yumurta", "ispanak", "beyaz-peynir", "domates", "sogan", "sarimsak", "yogurt", "makarna", "tereyagi", "patates", "kirmizi-mercimek", "limon"],
    [vegan.id]: ["kirmizi-mercimek", "haslanmis-nohut", "domates", "sogan", "zeytinyagi", "ispanak", "kinoa", "avokado", "limon", "badem-sutu", "muz"],
    [glutenFree.id]: ["pirinc", "tavuk-gogsu", "yumurta", "patates", "domates", "yogurt", "kasar"],
    [protein.id]: ["tavuk-gogsu", "yumurta", "lor", "ton-baligi", "kinoa", "brokoli", "yogurt"],
  };
  for (const [userId, slugs] of Object.entries(pantries)) {
    await prisma.pantryItem.createMany({ data: slugs.map((s) => ({ userId, ingredientId: ingIds.get(s)! })) });
  }

  // ---------------------------------------------------------------- Favoriler, yorumlar, yaptım
  for (const u of everyone) {
    const pool = suitable(u);
    for (const r of pickN(pool, 3 + Math.floor(rand() * 6))) {
      await prisma.favorite.create({ data: { userId: u.id, recipeId: r.id, createdAt: daysAgo(Math.floor(rand() * 40)) } });
    }
    for (const r of pickN(pool, 1 + Math.floor(rand() * 4))) {
      const rating = rand() < 0.55 ? 5 : rand() < 0.75 ? 4 : rand() < 0.9 ? 3 : 2;
      await prisma.review.create({
        data: { userId: u.id, recipeId: r.id, rating, comment: pick(REVIEW_TEXTS[rating]!), createdAt: daysAgo(Math.floor(rand() * 60)) },
      });
    }
    for (const r of pickN(pool, Math.floor(rand() * 6))) {
      await prisma.cookedLog.create({
        data: { userId: u.id, recipeId: r.id, note: rand() < 0.4 ? "Bir dahakine biraz daha baharat." : null, createdAt: daysAgo(Math.floor(rand() * 30)) },
      });
    }
  }
  // Moderasyon ekranı boş görünmesin
  const hiddenReviewTarget = recipeMeta.find((r) => r.slug === "menemen")!;
  await prisma.review.upsert({
    where: { userId_recipeId: { userId: extras[0]!.id, recipeId: hiddenReviewTarget.id } },
    update: { status: "HIDDEN", comment: "Reklam: en ucuz tencere setleri için sitemize bekleriz!!!", rating: 1 },
    create: { userId: extras[0]!.id, recipeId: hiddenReviewTarget.id, status: "HIDDEN", comment: "Reklam: en ucuz tencere setleri için sitemize bekleriz!!!", rating: 1 },
  });

  // ---------------------------------------------------------------- Görüntülenmeler (30 gün)
  console.log("› 30 günlük aktivite");
  const views: { recipeId: string; userId: string | null; createdAt: Date }[] = [];
  for (let d = 0; d < 30; d++) {
    const activeToday = pickN(everyone, 5 + Math.floor(rand() * 10) + (d < 7 ? 4 : 0));
    for (const u of activeToday) {
      for (const r of pickN(suitable(u), 1 + Math.floor(rand() * 4))) views.push({ recipeId: r.id, userId: u.id, createdAt: daysAgo(d) });
    }
    for (let k = 0; k < 15 + Math.floor(rand() * 25); k++) {
      const r = rand() < 0.4 ? pick(recipeMeta.filter((x) => x.featured)) : pick(recipeMeta);
      views.push({ recipeId: r.id, userId: null, createdAt: daysAgo(d) });
    }
  }
  await prisma.recipeView.createMany({ data: views });

  // ---------------------------------------------------------------- Alışveriş listeleri
  console.log("› Alışveriş listeleri ve yemek planları");
  const listFor = async (userId: string, recipeSlugs: string[], createdAt: Date, isActive: boolean) => {
    const list = await prisma.shoppingList.create({ data: { userId, isActive, createdAt } });
    const merged = new Map<string, { qty: number | null; unit: string; sources: { recipeId: string; title: string }[] }>();
    for (const slug of recipeSlugs) {
      const r = recipeMeta.find((x) => x.slug === slug);
      if (!r) continue;
      for (const [qty, unit, s, , opt] of r.ing) {
        const i = ingBySlug.get(s)!;
        if (opt || i.basic || pantries[userId]?.includes(s)) continue;
        const cur = merged.get(s);
        if (cur && cur.unit === unit && cur.qty != null && qty != null) {
          cur.qty += qty;
          cur.sources.push({ recipeId: r.id, title: r.title });
        } else if (!cur) merged.set(s, { qty, unit, sources: [{ recipeId: r.id, title: r.title }] });
      }
    }
    let n = 0;
    for (const [s, v] of merged) {
      const i = ingBySlug.get(s)!;
      const checked = !isActive || (n++ % 4 === 0);
      await prisma.shoppingListItem.create({
        data: {
          listId: list.id, ingredientId: ingIds.get(s)!, name: i.name, quantity: v.qty, unit: v.unit, aisle: i.aisle,
          checked, checkedAt: checked ? createdAt : null, sources: JSON.stringify(v.sources), createdAt,
        },
      });
    }
    return list;
  };
  await listFor(demo.id, ["karniyarik", "coban-salatasi"], daysAgo(0), true);
  await listFor(vegan.id, ["nohut-korisi", "kisir"], daysAgo(1), true);
  await listFor(glutenFree.id, ["tavuk-sote", "tereyagli-pirinc-pilavi"], daysAgo(0), true);
  for (let d = 1; d < 30; d++) {
    for (const u of pickN(extras, Math.floor(rand() * 3))) {
      await listFor(u.id, pickN(recipeMeta, 2).map((r) => r.slug), daysAgo(d), false);
    }
  }

  // ---------------------------------------------------------------- Yemek planları
  const monday = (() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
  })();
  const MEAL_CATS: Record<string, string[]> = {
    BREAKFAST: ["kahvalti"],
    LUNCH: ["corbalar", "salatalar", "zeytinyaglilar"],
    DINNER: ["ana-yemekler", "makarnalar"],
    SNACK: ["atistirmaliklar", "tatlilar", "icecekler"],
  };
  const planFor = async (u: { id: string }, weekOffset: number, createdAt: Date, density = 0.8) => {
    const weekStart = new Date(monday);
    weekStart.setUTCDate(weekStart.getUTCDate() + weekOffset * 7);
    const pool = suitable(u);
    const used = new Set<string>();
    const entries: { day: number; meal: string; recipeId: string; servings: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (const meal of Object.keys(MEAL_CATS)) {
        if (rand() > density) continue;
        const options = pool.filter((r) => MEAL_CATS[meal]!.includes(r.cat) && !used.has(r.id));
        if (!options.length) continue;
        const r = pick(options);
        used.add(r.id);
        entries.push({ day, meal, recipeId: r.id, servings: 2 });
      }
    }
    await prisma.mealPlan.create({ data: { userId: u.id, weekStart, createdAt, entries: { create: entries } } });
  };
  await planFor(demo, 0, daysAgo(2), 0.6);
  await planFor(demo, -1, daysAgo(9));
  await planFor(demo, -2, daysAgo(16));
  await planFor(vegan, 0, daysAgo(1));
  await planFor(glutenFree, 0, daysAgo(0), 0.5);
  await planFor(protein, 0, daysAgo(3), 0.7);
  for (let d = 0; d < 30; d += 3) {
    const u = pick(extras);
    if (!(await prisma.mealPlan.findFirst({ where: { userId: u.id, weekStart: monday } }))) await planFor(u, 0, daysAgo(d), 0.4);
  }

  // ---------------------------------------------------------------- AI sorgu kayıtları
  console.log("› AI sorgu kayıtları");
  const lexicon = new IngredientLexicon(
    INGREDIENTS.map((i) => ({ slug: i.slug, name: i.name, synonyms: i.syn ?? [], parentSlug: i.parent ?? null, aisle: i.aisle, isBasic: !!i.basic })),
  );
  const index: RecipeIndexItem[] = recipeMeta.map((r) => ({
    id: r.id, slug: r.slug, title: r.title, description: r.desc, imageUrl: r.img ?? null, coverColor: r.color,
    categorySlug: r.cat, categoryName: CATEGORIES.find((c) => c.slug === r.cat)!.name, cuisineSlug: r.cui,
    cuisineName: CUISINES.find((c) => c.slug === r.cui)!.name, difficulty: r.diff, prepMinutes: r.prep, cookMinutes: r.cook,
    totalMinutes: r.prep + r.cook, servings: r.serv, calories: r.calories, protein: null, carbs: null, fat: null, diets: r.diets,
    allergens: r.allergens, tags: r.tags ?? [], ratingAvg: 4, ratingCount: 1, viewCount: 0, favoriteCount: 0, cookedCount: 0,
    featured: !!r.featured, createdAt: 0,
    ingredients: r.ing.map(([, , s, , opt]) => ({ slug: s, name: ingBySlug.get(s)!.name, optional: !!opt })),
  }));
  const logs = [];
  for (let d = 0; d < 30; d++) {
    const n = 4 + Math.floor(rand() * 8) + (d < 7 ? 3 : 0);
    for (let k = 0; k < n; k++) {
      const failed = rand() < 0.18;
      const query = failed ? pick(AI_QUERIES_FAIL) : pick(AI_QUERIES_OK);
      const signals = extractSignals(query, lexicon);
      const outcome = searchRecipes(index, query, lexicon);
      const ok = !failed && outcome.results.length > 0;
      const source = rand() < 0.65 ? "CHAT" : "SEARCH";
      const user = rand() < 0.6 ? pick(everyone) : null;
      logs.push({
        userId: user?.id ?? null, source, query, intent: signals.ingredients.length ? "ingredient_search" : "recipe_search",
        ingredients: JSON.stringify([...signals.ingredients, ...signals.withIngredients]),
        filters: JSON.stringify({ maxMinutes: signals.maxMinutes, maxCalories: signals.maxCalories, diets: signals.diets }),
        recipeIds: JSON.stringify(ok ? outcome.results.slice(0, 4).map((r) => r.id) : []),
        resultCount: ok ? outcome.results.length : 0, success: ok, mode: "demo", createdAt: daysAgo(d),
      });
    }
    // Dolap aramaları — "tavuk + pirinç" en popüler kombinasyon olsun
    const combos = [["tavuk", "pirinc"], ["tavuk", "pirinc", "sogan"], ["yumurta", "ispanak", "peynir"], ["kiyma", "patlican"], ["nohut", "domates"], ["makarna", "domates", "sarimsak"], ["tavuk", "pirinc"], ["yumurta", "domates", "biber"]];
    for (let k = 0; k < 3 + Math.floor(rand() * 5); k++) {
      const combo = pick(combos);
      logs.push({
        userId: rand() < 0.5 ? pick(everyone).id : null, source: "PANTRY", query: combo.join(", "), intent: "pantry",
        ingredients: JSON.stringify(combo), filters: "{}", recipeIds: "[]", resultCount: 3 + Math.floor(rand() * 8), success: true, mode: "demo", createdAt: daysAgo(d),
      });
    }
  }
  await prisma.aIQueryLog.createMany({ data: logs });

  // ---------------------------------------------------------------- Bülten
  await prisma.newsletter.createMany({ data: extras.slice(0, 12).map((u) => ({ email: u.email, createdAt: u.createdAt })) });

  // ---------------------------------------------------------------- Sayaçları güncelle
  console.log("› Tarif sayaçları");
  for (const r of recipeMeta) {
    const [rating, views_, favs, cooked] = await Promise.all([
      prisma.review.aggregate({ where: { recipeId: r.id, status: "PUBLISHED" }, _avg: { rating: true }, _count: true }),
      prisma.recipeView.count({ where: { recipeId: r.id } }),
      prisma.favorite.count({ where: { recipeId: r.id } }),
      prisma.cookedLog.count({ where: { recipeId: r.id } }),
    ]);
    await prisma.recipe.update({
      where: { id: r.id },
      data: {
        ratingAvg: Math.round((rating._avg.rating ?? 0) * 10) / 10, ratingCount: rating._count,
        viewCount: views_ * 3 + Math.floor(rand() * 200), favoriteCount: favs, cookedCount: cooked,
      },
    });
  }

  console.log(`\n✓ Seed tamamlandı: ${INGREDIENTS.length} malzeme, ${RECIPES.length} tarif, ${everyone.length + 1} kullanıcı.`);
  console.log("  Yönetici : admin@kiler.app / Admin123!");
  console.log("  Demo     : demo@kiler.app / Demo123!  (vegan@, glutensiz@, protein@ — aynı şifre)");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
