import "server-only";
// =============================================================================
//  AI Yönetici Asistanı
//
//  Güvenlik modeli:
//   • AI veritabanına DOĞRUDAN erişmez. Yalnızca aşağıdaki beyaz listedeki
//     SALT-OKUNUR raporlardan birini seçebilir (REPORTS).
//   • Değişiklik gerektiren istekler (öne çıkar, yayından kaldır…) "proposal"
//     olarak döner; admin "Onayla"ya basınca /api/admin/actions üzerinden
//     rol kontrolü + Zod doğrulamasıyla sunucuda uygulanır.
// =============================================================================

import { z } from "zod";
import { db } from "./db";
import { completeJson, isAiEnabled } from "./openai";
import { activeUserCount, failedSearches, getDashboardStats, ingredientCombos, searchedIngredients, since, topRecipesBy } from "./analytics";
import { fold, titleMatchScore } from "./matching";
import { DIETS, labelOf, type DietKey } from "./constants";
import { DIET_COLUMNS } from "./recipes";
import { formatDate } from "./utils";
import type { AdminChatResponse, AdminProposal } from "@/types/ai";

const REPORT_KEYS = [
  "top_cooked", "top_viewed", "top_favorited", "missing_nutrition", "missing_image", "failed_searches",
  "top_ingredients", "ingredient_combos", "diet_coverage", "active_users_trend", "overview", "propose_change",
] as const;
type ReportKey = (typeof REPORT_KEYS)[number];

const routeSchema = z.object({
  report: z.enum(REPORT_KEYS),
  days: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  diet: z.enum(DIETS.map((d) => d.key) as [DietKey, ...DietKey[]]).optional(),
  recipeQuery: z.string().max(120).optional(),
  change: z.enum(["feature", "unfeature", "unpublish", "publish", "recompute"]).optional(),
});
type Route = z.infer<typeof routeSchema>;

// ----------------------------------------------------------------- Kural tabanlı yönlendirme

function routeByRules(message: string): Route {
  const t = fold(message);
  const days = /bu hafta|son 7|haftalik|gecen hafta/.test(t) ? 7 : /bugun/.test(t) ? 1 : /bu ay|son 30|aylik/.test(t) ? 30 : undefined;
  const limit = Number(t.match(/(\d+)\s*(tarif|tane|malzeme|arama)?/)?.[1]) || undefined;
  const diet = DIETS.find((d) => t.includes(fold(d.label)) || (d.key === "vegan" && t.includes("vegan")))?.key;

  if (/(one cikar|onecikar|vitrine|featured)/.test(t)) return { report: "propose_change", change: /cikarma|kaldir/.test(t) ? "unfeature" : "feature", recipeQuery: message };
  if (/(yayindan kaldir|yayından|gizle|unpublish)/.test(t)) return { report: "propose_change", change: "unpublish", recipeQuery: message };
  if (/(yeniden hesapla|tekrar hesapla)/.test(t)) return { report: "propose_change", change: "recompute", recipeQuery: message };
  if (/(besin degeri|kalorisi) (eksik|olmayan|bos)|besin degerleri eksik/.test(t)) return { report: "missing_nutrition" };
  if (/(gorsel|resim|fotograf|foto)(i|u)? (olmayan|eksik|yok)/.test(t)) return { report: "missing_image" };
  if (/(bulamad|bulunamay|basarisiz|karsiligi olmayan|sonuc(suz| vermeyen))/.test(t)) return { report: "failed_searches", days, limit };
  if (/kombinasyon/.test(t)) return { report: "ingredient_combos", days, limit };
  if (/(en cok aranan|aranan malzeme|hangi malzeme)/.test(t)) return { report: "top_ingredients", days, limit };
  if (/aktif kullanici|kullanici (sayisi|trend)|kac kullanici/.test(t)) return { report: "active_users_trend" };
  if (diet && /(kac|sayi|az|kategori)/.test(t)) return { report: "diet_coverage", diet };
  if (/(en cok yapilan|yapilan)/.test(t)) return { report: "top_cooked", days: days ?? 7, limit };
  if (/(favori)/.test(t)) return { report: "top_favorited", days: days ?? 30, limit };
  if (/(goruntulenen|populer|en cok bakilan|izlenen)/.test(t)) return { report: "top_viewed", days: days ?? 30, limit };
  return { report: "overview" };
}

const ROUTER_PROMPT = `Sen bir yönetici paneli yönlendiricisisin. Yöneticinin sorusunu aşağıdaki SALT-OKUNUR raporlardan birine eşle.
Raporlar:
- top_cooked {days, limit}: en çok "yaptım" işaretlenen tarifler
- top_viewed {days, limit}: en çok görüntülenen tarifler
- top_favorited {days, limit}: en çok favorilenen tarifler
- missing_nutrition: besin değeri eksik tarifler
- missing_image: görseli olmayan tarifler
- failed_searches {days, limit}: karşılık bulunamayan aramalar
- top_ingredients {days, limit}: en çok aranan malzemeler
- ingredient_combos {days, limit}: en çok aranan malzeme kombinasyonları
- diet_coverage {diet}: bir diyet tipindeki tarif sayısı ve kategori dağılımı (diet: vegetarian|vegan|gluten-free|lactose-free|low-carb|high-protein)
- active_users_trend: bu hafta ile geçen haftanın aktif kullanıcı karşılaştırması
- overview: genel özet
- propose_change {change: feature|unfeature|unpublish|publish|recompute, recipeQuery}: bir tarifte değişiklik ÖNERİSİ (uygulanmaz, admin onaylar)
Yalnızca JSON döndür: {"report": "...", "days"?: number, "limit"?: number, "diet"?: string, "recipeQuery"?: string, "change"?: string}`;

// ----------------------------------------------------------------- Raporlar

type ReportResult = Omit<AdminChatResponse, "mode"> & { data?: unknown };

async function findRecipe(query: string) {
  const recipes = await db.recipe.findMany({ select: { id: true, slug: true, title: true, featured: true, published: true } });
  return recipes
    .map((r) => ({ r, s: Math.max(titleMatchScore(query, r.title), fold(query).includes(fold(r.title)) ? 95 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)[0]?.r;
}

async function runReport(route: Route): Promise<ReportResult> {
  const days = route.days ?? 30;
  const limit = Math.min(route.limit ?? 5, 20);
  switch (route.report) {
    case "top_cooked":
    case "top_viewed":
    case "top_favorited": {
      const kind = route.report === "top_cooked" ? "cooked" : route.report === "top_viewed" ? "views" : "favorites";
      const label = { cooked: "yapılan", views: "görüntülenen", favorites: "favorilenen" }[kind];
      const rows = await topRecipesBy(kind, days, limit);
      return {
        report: route.report,
        message: rows.length ? `Son ${days} günde en çok ${label} ${rows.length} tarif:` : `Son ${days} günde kayıt bulunamadı.`,
        table: { columns: ["#", "Tarif", kind === "views" ? "Görüntülenme" : kind === "cooked" ? "Yapılma" : "Favori"], rows: rows.map((r, i) => [i + 1, r.title, r.count]) },
        recipes: rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title })),
        data: rows,
      };
    }
    case "missing_nutrition": {
      const rows = await db.recipe.findMany({ where: { OR: [{ calories: null }, { protein: null }] }, select: { id: true, slug: true, title: true, updatedAt: true } });
      return {
        report: route.report,
        message: rows.length ? `${rows.length} tarifin besin değeri eksik. Malzemelerden yeniden hesaplamayı önerebilirim.` : "Tüm tariflerin besin değerleri tam. 👍",
        table: { columns: ["Tarif", "Son güncelleme"], rows: rows.map((r) => [r.title, formatDate(r.updatedAt)]) },
        recipes: rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title })),
        proposals: rows.slice(0, 5).map((r) => ({ kind: "recompute-nutrition", recipeId: r.id, label: `${r.title}: besin değerini malzemelerden hesapla` })),
        data: rows.length,
      };
    }
    case "missing_image": {
      const [rows, total] = await Promise.all([
        db.recipe.findMany({ where: { imageUrl: null }, select: { id: true, slug: true, title: true, category: { select: { name: true } } }, orderBy: { title: "asc" } }),
        db.recipe.count(),
      ]);
      return {
        report: route.report,
        message: `${total} tarifin ${rows.length} tanesinde görsel yok (bu tarifler tipografik kapakla gösteriliyor). İlk ${Math.min(rows.length, 15)} tanesi:`,
        table: { columns: ["Tarif", "Kategori"], rows: rows.slice(0, 15).map((r) => [r.title, r.category.name]) },
        recipes: rows.slice(0, 15).map((r) => ({ id: r.id, slug: r.slug, title: r.title })),
        data: rows.length,
      };
    }
    case "failed_searches": {
      const rows = await failedSearches(days, limit + 3);
      return {
        report: route.report,
        message: rows.length
          ? `Son ${days} günde karşılık bulunamayan en sık aramalar. "${rows[0]!.query}" (${rows[0]!.count} kez) açık bir içerik fırsatı.`
          : `Son ${days} günde başarısız arama yok.`,
        table: { columns: ["Arama", "Sayı", "Son arama"], rows: rows.map((r) => [r.query, r.count, formatDate(r.last, { day: "numeric", month: "short" })]) },
        data: rows,
      };
    }
    case "top_ingredients": {
      const rows = await searchedIngredients(days, limit + 5);
      return {
        report: route.report,
        message: rows.length ? `Son ${days} günde en çok aranan malzeme: ${rows[0]!.name}.` : "Henüz malzeme araması yok.",
        table: { columns: ["Malzeme", "Arama"], rows: rows.map((r) => [r.name, r.count]) },
        data: rows,
      };
    }
    case "ingredient_combos": {
      const rows = await ingredientCombos(days, limit + 3);
      return {
        report: route.report,
        message: rows.length ? `En popüler kombinasyon: ${rows[0]!.combo}.` : "Henüz kombinasyon verisi yok.",
        table: { columns: ["Kombinasyon", "Arama"], rows: rows.map((r) => [r.combo, r.count]) },
        data: rows,
      };
    }
    case "diet_coverage": {
      const diet = route.diet ?? "vegan";
      const column = DIET_COLUMNS[diet];
      const [categories, recipes] = await Promise.all([
        db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
        db.recipe.findMany({
          where: { published: true },
          select: { categoryId: true, isVegetarian: true, isVegan: true, isGlutenFree: true, isLactoseFree: true, isLowCarb: true, isHighProtein: true },
        }),
      ]);
      const totalPublished = recipes.length;
      const rows = categories.map((c) => {
        const list = recipes.filter((r) => r.categoryId === c.id);
        return { name: c.name, count: list.filter((r) => r[column]).length, total: list.length };
      });
      const total = rows.reduce((a, r) => a + r.count, 0);
      const weakest = [...rows].filter((r) => r.total > 0).sort((a, b) => a.count / a.total - b.count / b.total).slice(0, 3);
      const label = labelOf(DIETS, diet).toLocaleLowerCase("tr-TR");
      return {
        report: route.report,
        message: `${totalPublished} yayındaki tarifin ${total} tanesi ${label}. En az ${label} seçenek olan kategoriler: ${weakest.map((w) => `${w.name} (${w.count}/${w.total})`).join(", ")}.`,
        table: { columns: ["Kategori", labelOf(DIETS, diet), "Toplam", "Oran"], rows: rows.map((r) => [r.name, r.count, r.total, r.total ? `%${Math.round((r.count / r.total) * 100)}` : "—"]) },
        data: { total, weakest },
      };
    }
    case "active_users_trend": {
      const [thisWeek, lastWeek14] = await Promise.all([activeUserCount(7), activeUserCount(14, 7)]);
      const diff = lastWeek14 ? Math.round(((thisWeek - lastWeek14) / lastWeek14) * 100) : 0;
      return {
        report: route.report,
        message: `Bu hafta ${thisWeek} aktif kullanıcı var; geçen hafta ${lastWeek14} idi (${diff >= 0 ? "+" : ""}%${diff}).`,
        table: { columns: ["Dönem", "Aktif kullanıcı"], rows: [["Son 7 gün", thisWeek], ["Önceki 7 gün", lastWeek14]] },
        data: { thisWeek, lastWeek: lastWeek14, diff },
      };
    }
    case "propose_change": {
      const recipe = route.recipeQuery ? await findRecipe(route.recipeQuery) : undefined;
      if (!recipe) return { report: route.report, message: "Hangi tarifi kastettiğini bulamadım. Tarif adını tam yazar mısın?" };
      const change = route.change ?? "feature";
      const proposal: AdminProposal =
        change === "feature" || change === "unfeature"
          ? { kind: "feature-recipe", recipeId: recipe.id, featured: change === "feature", label: `"${recipe.title}" ${change === "feature" ? "öne çıkarılsın" : "öne çıkanlardan kaldırılsın"}` }
          : change === "recompute"
            ? { kind: "recompute-nutrition", recipeId: recipe.id, label: `"${recipe.title}" besin değerleri yeniden hesaplansın` }
            : { kind: "publish-recipe", recipeId: recipe.id, published: change === "publish", label: `"${recipe.title}" ${change === "publish" ? "yayına alınsın" : "yayından kaldırılsın"}` };
      return {
        report: route.report,
        message: `Bu bir değişiklik isteği; doğrudan uygulamıyorum. Onaylarsan sunucuda yetki kontrolüyle uygulanacak.`,
        proposals: [proposal],
        recipes: [{ id: recipe.id, slug: recipe.slug, title: recipe.title }],
      };
    }
    case "overview":
    default: {
      const s = await getDashboardStats();
      const failed = await db.aIQueryLog.count({ where: { success: false, createdAt: { gte: since(7) } } });
      return {
        report: "overview",
        message: `Genel durum: ${s.totalRecipes} yayında tarif, ${s.totalUsers} kullanıcı, son 7 günde ${s.active7} aktif kullanıcı. Bugün ${s.listsToday} alışveriş listesi ve ${s.plansToday} yemek planı oluşturuldu; son 7 günde ${failed} başarısız arama var. Bana "Bu hafta en çok yapılan 5 tarifi göster" ya da "Görseli olmayan tarifler hangileri?" gibi sorular sorabilirsin.`,
        table: {
          columns: ["Metrik", "Değer"],
          rows: [["Yayındaki tarif", s.totalRecipes], ["Kullanıcı", s.totalUsers], ["Aktif (7 gün)", s.active7], ["Bugünkü liste", s.listsToday], ["Bugünkü plan", s.plansToday], ["Başarısız arama (7 gün)", failed]],
        },
        data: s,
      };
    }
  }
}

// ----------------------------------------------------------------- Giriş noktası

export async function runAdminAssistant(message: string, adminId: string): Promise<AdminChatResponse> {
  let route = routeByRules(message);
  if (isAiEnabled()) {
    const llmRoute = await completeJson<unknown>(ROUTER_PROMPT, message, { temperature: 0 });
    const parsed = routeSchema.safeParse(llmRoute);
    if (parsed.success) route = parsed.data;
  }
  const result = await runReport(route);

  let text = result.message;
  if (isAiEnabled() && result.table) {
    const summary = await completeJson<{ message: string }>(
      `Sen bir yemek platformunun yönetici asistanısın. Yalnızca verilen "veri"yi kullanarak 2-3 cümlelik Türkçe bir özet yaz. Veride olmayan sayı uydurma. Gerekirse somut bir içerik/operasyon önerisi ekle. JSON: {"message": string}`,
      JSON.stringify({ soru: message, rapor: route.report, veri: result.table }),
      { temperature: 0.3 },
    );
    if (summary?.message) text = summary.message.slice(0, 1500);
  }

  await db.aIQueryLog
    .create({ data: { userId: adminId, source: "ADMIN", query: message.slice(0, 500), intent: route.report, success: true, resultCount: result.table?.rows.length ?? 0, mode: isAiEnabled() ? "openai" : "demo" } })
    .catch(() => {});

  return { message: text, table: result.table, recipes: result.recipes, proposals: result.proposals, report: route.report, mode: isAiEnabled() ? "openai" : "demo" };
}

export type { ReportKey };
