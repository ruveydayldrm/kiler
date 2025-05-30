# Kiler — yapay zekâ destekli yemek tarifi ve market asistanı

[![CI](https://github.com/ruveydayldrm/kiler/actions/workflows/ci.yml/badge.svg)](https://github.com/ruveydayldrm/kiler/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![License](https://img.shields.io/badge/license-MIT-3F5B3A)

> “Dolabında ne varsa, bugünün tarifi o.”

Kiler; elindeki malzemelere göre tarif bulan, eksikleri tek tıkla reyonlara göre gruplu alışveriş listesine ekleyen, haftalık yemek planı çıkaran ve tüm bunları tarif veritabanına bağlı bir **AI mutfak asistanıyla** yapan bir Next.js uygulamasıdır. OpenAI anahtarı olmadan da baştan sona çalışır (kural tabanlı demo mod).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 (SQLite / PostgreSQL) · Auth.js v5 · OpenAI (yalnızca sunucuda) · Framer Motion · Lucide · Recharts · Zod

---

## Hızlı başlangıç

```bash
npm install
npm run setup   # .env oluşturur, şemayı uygular, demo verileri yükler
npm run dev     # http://localhost:3000
```

`npm run setup` kurulumsuz çalışan **SQLite** kullanır (`prisma/dev.db`). PostgreSQL gerekmez.

### Demo hesaplar

| Rol | E-posta | Şifre | Not |
|---|---|---|---|
| Yönetici | `admin@kiler.app` | `Admin123!` | `/admin` paneli + AI yönetici asistanı |
| Kullanıcı | `demo@kiler.app` | `Demo123!` | Dolabı, listesi ve planları dolu |
| Vegan | `vegan@kiler.app` | `Demo123!` | Yalnızca vegan öneriler |
| Glutensiz | `glutensiz@kiler.app` | `Demo123!` | Gluten alerjisi: sert filtre testi için |
| Yüksek protein | `protein@kiler.app` | `Demo123!` | Kuruyemiş + yer fıstığı alerjisi, 2400 kcal |

Giriş sayfasında bu hesaplara tek tıkla girilebilir.

---

## Ortam değişkenleri

`.env.example` dosyasına bakın; `npm run setup` bunu `.env` olarak kopyalar ve `AUTH_SECRET` üretir.

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite: `file:./dev.db` · PostgreSQL: `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | Oturum imzası (`npx auth secret` ile üretilebilir) |
| `AUTH_URL` | Uygulamanın adresi (`http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | Sitemap, canonical ve Open Graph bağlantıları için |
| `OPENAI_API_KEY` | **Opsiyonel.** Boşsa demo mod |
| `OPENAI_MODEL` | Varsayılan `gpt-4o-mini` |

## Veritabanı

Şema iki sağlayıcıyla da çalışır: enum yerine doğrulanmış `String`, skaler liste yerine JSON metni kullanılır.

```bash
npm run db:use-postgres   # schema.prisma → postgresql, .env DATABASE_URL güncellenir
npm run setup             # şemayı uygula + seed

npm run db:use-sqlite     # geri dön
```

| Script | Ne yapar |
|---|---|
| `db:push` | Şemayı veritabanına uygular (geliştirme) |
| `db:migrate` | `prisma migrate dev`: migration dosyası üretir (PostgreSQL üretim akışı için önerilir) |
| `db:seed` | Demo verilerini yeniden yükler (tabloları önce temizler) |
| `db:reset` | Veritabanını sıfırlar + seed (**tüm veriyi siler**) |
| `db:studio` | Prisma Studio |

> Migration dosyaları sağlayıcıya özeldir. SQLite ile `db:push`, PostgreSQL üretiminde `db:migrate` kullanın.

### Demo verisi

148 malzeme (100 g başına besin değeri, reyon, alerjen, eş anlamlılar, birim dönüşümleri, üst-alt türler) · 80 tarif (Türk mutfağı ağırlıklı + dünya mutfağı) · 12 kategori · 6 mutfak · 29 kullanıcı · dolaplar, listeler, haftalık planlar · yorumlar ve “yaptım” kayıtları · son 30 güne yayılmış aktivite · başarısız aramalar dahil AI sorgu kayıtları.

Tarif besin değerleri, diyet etiketleri ve alerjenler **malzemelerden hesaplanır** ve tarif üzerinde porsiyon başına saklanır.

### Yönetici oluşturma

Seed bir yönetici oluşturur. Başka bir kullanıcıyı yönetici yapmak için:

```bash
npx prisma studio      # User tablosunda role = "ADMIN"
```

---

## OpenAI

`.env` içine `OPENAI_API_KEY` eklemeniz yeterli. Anahtar yoksa ya da çağrı hata verirse her adım aynı çalışır; yalnızca son metin şablondan üretilir.

## AI mimarisi

```
Kullanıcı mesajı
 → Niyet tespiti           (lib/ai.ts: dolap, tarif adı, ikame, plan, liste, ölçekleme…)
 → Sinyal çıkarma          (lib/matching.ts: malzemeler, süre, kalori, diyet, öğün, kişi sayısı)
 → Veritabanı sorgusu      (lib/recipes.ts → getVisibleRecipes: alerji + sevilmeyenler SERT filtre)
 → Birkaç aday tarif       (searchRecipes / matchPantry)
 → AI bağlamı              (yalnızca adaylar; tüm veritabanı ASLA gönderilmez)
 → OpenAI (JSON modu) | demo şablonu
 → Sunucuda doğrulama      (yalnızca aday listesindeki tarif id'leri kalır)
 → { message, recipes, missingIngredients, actions } → kartlar
```

- AI tarif **uydurmaz**: arşivde yoksa “Bu tarif şu anda tarif arşivimizde bulunmuyor.” der ve alternatif önerir.
- Kalori ve besin değerleri her zaman veritabanından gelir.
- Listeye/plana ekleme gibi yazma işlemleri yalnızca **öneri** olarak döner; kullanıcı onaylayınca ayrı API uçlarından uygulanır.
- **Yönetici asistanı** (`lib/ai-admin.ts`) yalnızca beyaz listedeki salt-okunur raporları çalıştırabilir. “Şu tarifi öne çıkar” gibi istekler öneri olarak döner; “Onayla” düğmesi `/api/admin/actions` üzerinden rol kontrolü ve Zod doğrulamasıyla uygulanır.

## Eşleştirme algoritması (`src/lib/matching.ts`)

Dolap sayfası, genel arama ve AI asistanı **aynı modülü** kullanır.

- **Türkçe normalizasyon:** `tr-TR` küçük harf + ASCII katlama (`ıspanak` = `ispanak`).
- **Ek toleransı:** `domatesler`, `ıspanağı`, `salçası` köke iner. `-lı/-li` (`yumurtalı`) köke **indirgenmez**; “içeren” sinyali olarak işlenir. `-sız/-siz` ve “olmadan / hariç” dışlama olarak işlenir.
- **Sınırlar boşluk tabanlıdır.** JavaScript'te `\b` Türkçe harflerde çalışmaz.
- **Eş anlamlı ve üst-alt ilişkisi:** `kıyma` = `çekilmiş et`; `peynir` araması kaşar ve beyaz peyniri kapsar; dolaptaki beyaz peynir de “peynir” isteyen tarifi karşılar.
- **Temel malzemeler** (tuz, karabiber, su, sıvı yağ; kullanıcı değiştirebilir) ve opsiyonel malzemeler eşleşme oranına dahil edilmez.
- **Skor:** eşleşme oranı − eksik sayısı cezası + kullanıcının söylediği malzemelerin kullanımı + süre/kalori/diyet uyumu + puan/popülerlik.
- **Doğrudan tarif adı** (“mercimek çorbası”, yarım “mercimek ç”) her zaman ilk sıradadır.
- **“var mı / bulunur mu”** kalıbı arşiv sorusu olarak algılanır.

Duman testi: `npm run test:matching`

## Öneri motoru

`lib/recommendations.ts` içinde `RecommendationStrategy` arayüzü vardır. Demo olarak içerik tabanlı `ContentAffinityStrategy` kullanılır (favoriler, yaptıklarım, görüntülemeler, diyet, dolap, beceri seviyesi). AI veya embedding tabanlı bir motor aynı arayüzle eklenip `RECOMMENDER` ortam değişkeniyle seçilebilir. Alerjen filtresi motordan **önce** uygulanır.

## Güvenlik

- `/admin` ve `/account` middleware ile korunur. Ayrıca her sayfada ve eylemde sunucu tarafında `requireAdmin()` / `requireUser()` çağrılır; rol veritabanından okunur.
- Dolap, liste ve plan sorgularının hepsi `userId` ile sınırlıdır.
- Tüm girdiler Zod ile doğrulanır, Prisma parametreli sorgu kullanır.
- OpenAI yalnızca `server-only` modüllerden çağrılır.
- Sohbet, arama ve bülten uçlarında hız sınırı vardır (bellek içi; çok sunuculu kurulumda Redis önerilir).

## Geliştirme

```bash
npm run dev          # geliştirme sunucusu
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test:matching
```

### OneDrive / senkronize klasör notu

Proje OneDrive gibi senkronize bir klasördeyse derleme sırasında `.next ... readlink EINVAL` hatası görülebilir. Çözüm:

```bash
npm run clean   # .next klasörünü siler
npm run build
```

Kalıcı çözüm için projeyi senkronize olmayan bir klasöre taşıyabilir ya da `.next` klasörünü OneDrive'dan hariç tutabilirsiniz.

## Üretim

```bash
npm run build
npm run start
```

- PostgreSQL'e geçin (`npm run db:use-postgres`), `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` ve `NEXT_PUBLIC_SITE_URL` değerlerini ayarlayın.
- `npx prisma migrate deploy` ile migration'ları uygulayın.
- Tarif indeksi sunucu belleğinde 5 dakika önbelleklenir ve admin değişikliklerinde otomatik geçersiz kılınır. Binlerce tarif için bu katman bir arama motoruna (Meilisearch, Postgres FTS) taşınabilir; arayüz aynı kalır.

## Klasör yapısı

```
src/
├── app/            sayfalar, API uçları, server action'lar
├── components/     ui · recipes · pantry · planner · shopping · chatbot · admin · account · layout · providers
├── lib/            matching · nutrition · units · recommendations · ai · ai-admin · planner · shopping · auth · db …
├── hooks/          use-form-action (React 19 form sıfırlama çözümü) · use-wake-lock
└── types/
prisma/             schema.prisma · seed/
scripts/            setup · db-provider · clean · check-matching
```
