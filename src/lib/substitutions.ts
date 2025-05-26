// Genel mutfak bilgisi: malzeme ikameleri. Bunlar GENEL ÖNERİDİR — sonuç tarife göre değişebilir.
// AI demo modunda doğrudan, OpenAI modunda bağlam olarak kullanılır.

export interface Substitute {
  use: string;
  ratio?: string;
  note?: string;
  vegan?: boolean;
}

export const SUBSTITUTIONS: Record<string, Substitute[]> = {
  krema: [
    { use: "Yoğurt + 1 tatlı kaşığı un", ratio: "1:1", note: "Kesilmemesi için ocaktan alınca ekleyin." },
    { use: "Süt + tereyağı", ratio: "¾ süt + ¼ eritilmiş tereyağı" },
    { use: "Hindistan cevizi sütü", ratio: "1:1", note: "Hafif bir hindistan cevizi aroması verir.", vegan: true },
    { use: "Kaju kreması (ıslatılmış kaju + su)", ratio: "1:1", vegan: true },
  ],
  tereyagi: [
    { use: "Zeytinyağı", ratio: "1 yemek kaşığı tereyağı ≈ ¾ yemek kaşığı zeytinyağı", note: "Sotelerde birebir çalışır; hamur işlerinde dokuyu değiştirebilir.", vegan: true },
    { use: "Bitkisel margarin", ratio: "1:1", vegan: true },
    { use: "Hindistan cevizi yağı", ratio: "1:1", note: "Tatlılarda iyi sonuç verir.", vegan: true },
  ],
  sut: [
    { use: "Badem sütü", ratio: "1:1", vegan: true },
    { use: "Yulaf sütü", ratio: "1:1", note: "Glutensiz değildir.", vegan: true },
    { use: "Su + biraz tereyağı", ratio: "1:1", note: "Beşamelde lezzet biraz hafifler." },
  ],
  yogurt: [
    { use: "Bitkisel (soya / hindistan cevizi) yoğurt", ratio: "1:1", vegan: true },
    { use: "Krem peynir veya labne (su ile inceltilmiş)", ratio: "1:1" },
  ],
  yumurta: [
    { use: "Keten tohumu yumurtası", ratio: "1 yemek kaşığı öğütülmüş keten + 3 yemek kaşığı su = 1 yumurta", note: "Kek ve köftelerde bağlayıcı olarak.", vegan: true },
    { use: "Ezilmiş muz", ratio: "½ muz = 1 yumurta", note: "Tatlılarda; muz aroması verir.", vegan: true },
    { use: "Aquafaba (nohut suyu)", ratio: "3 yemek kaşığı = 1 yumurta", vegan: true },
  ],
  peynir: [
    { use: "Tofu (ufalanmış, tuz ve limonla)", note: "Beyaz peynir dokusuna yakındır.", vegan: true },
    { use: "Besin mayası", note: "Peynirli aroma için, özellikle soslarda.", vegan: true },
  ],
  "beyaz-peynir": [
    { use: "Lor peyniri", ratio: "1:1", note: "Daha az tuzlu ve yağlıdır." },
    { use: "Tuz ve limonla ufalanmış tofu", ratio: "1:1", vegan: true },
  ],
  kasar: [
    { use: "Mozzarella", ratio: "1:1" },
    { use: "Bitkisel kaşar", ratio: "1:1", vegan: true },
  ],
  parmesan: [
    { use: "Eski kaşar (rendelenmiş)", ratio: "1:1" },
    { use: "Besin mayası + öğütülmüş ceviz", ratio: "1:1", vegan: true },
  ],
  kiyma: [
    { use: "Kırmızı / yeşil mercimek (haşlanmış)", ratio: "250 g kıyma ≈ 1 su bardağı kuru mercimek", vegan: true },
    { use: "İnce doğranmış mantar + ceviz", ratio: "1:1", vegan: true },
    { use: "Tavuk kıyma", ratio: "1:1", note: "Daha hafif ve az yağlıdır." },
  ],
  et: [
    { use: "Mantar (istiridye veya kestane)", note: "Pişme süresini kısaltın.", vegan: true },
    { use: "Nohut veya barbunya", vegan: true },
    { use: "Tavuk but", ratio: "1:1", note: "Pişme süresi yaklaşık yarıya iner." },
  ],
  kusbasi: [
    { use: "Nohut veya mantar", vegan: true },
    { use: "Tavuk but (kuşbaşı)", ratio: "1:1" },
  ],
  tavuk: [
    { use: "Tofu veya nohut", vegan: true },
    { use: "Hindi göğsü", ratio: "1:1" },
  ],
  "tavuk-gogsu": [
    { use: "Tofu (kurulanmış, küp)", vegan: true },
    { use: "Hindi göğsü", ratio: "1:1" },
  ],
  "tavuk-suyu": [{ use: "Sebze suyu", ratio: "1:1", vegan: true }],
  bal: [
    { use: "Pekmez", ratio: "1:1", vegan: true },
    { use: "Akçaağaç şurubu", ratio: "1:1", vegan: true },
  ],
  un: [
    { use: "Glutensiz un karışımı", ratio: "1:1", note: "Hamur işlerinde ksantan gam gerekebilir." },
    { use: "Pirinç unu", ratio: "1:1", note: "Kıvam vermek (sos, çorba) için idealdir." },
    { use: "Mısır nişastası", ratio: "1 yemek kaşığı un ≈ ½ yemek kaşığı nişasta", note: "Yalnızca koyulaştırmak için." },
  ],
  bulgur: [{ use: "Kinoa", ratio: "1:1", note: "Glutensizdir; pişme süresi benzerdir." }],
  makarna: [{ use: "Glutensiz (mercimek / pirinç) makarna", ratio: "1:1", note: "Haşlama süresine dikkat edin." }],
  ekmek: [{ use: "Glutensiz ekmek", ratio: "1:1" }],
  "soya-sosu": [{ use: "Tamari (glutensiz soya sosu)", ratio: "1:1" }],
  seker: [
    { use: "Bal", ratio: "1 su bardağı şeker ≈ ¾ su bardağı bal", note: "Sıvıyı ¼ oranında azaltın." },
    { use: "Hurma ezmesi", ratio: "1:1", vegan: true },
  ],
  "domates-salcasi": [{ use: "Rendelenmiş domates (koyulaştırılmış)", ratio: "1 yemek kaşığı salça ≈ 3 yemek kaşığı rendelenmiş domates", vegan: true }],
  "limon-suyu": [{ use: "Sirke", ratio: "1:½", note: "Daha keskindir; azar azar ekleyin.", vegan: true }],
  "sivi-yag": [{ use: "Zeytinyağı", ratio: "1:1", vegan: true }],
  zeytinyagi: [{ use: "Ayçiçek yağı", ratio: "1:1", vegan: true }],
  mayonez: [{ use: "Süzme yoğurt + hardal", ratio: "1:1", note: "Daha hafif bir sos olur." }],
  ceviz: [{ use: "Kabak çekirdeği", ratio: "1:1", note: "Kuruyemiş alerjisi olanlar için.", vegan: true }],
  badem: [{ use: "Ayçiçeği çekirdeği", ratio: "1:1", vegan: true }],
  "badem-sutu": [{ use: "Yulaf veya soya sütü", ratio: "1:1", vegan: true }],
  "yer-fistigi": [{ use: "Kavrulmuş nohut veya ayçiçeği çekirdeği", ratio: "1:1", vegan: true }],
  karides: [{ use: "Tavuk göğsü veya tofu", ratio: "1:1" }],
  somon: [{ use: "Levrek veya alabalık", ratio: "1:1" }],
  "krem-peynir": [{ use: "Süzme yoğurt", ratio: "1:1" }],
  "hindistan-cevizi-sutu": [{ use: "Krema veya süt + tereyağı", ratio: "1:1" }],
  sucuk: [{ use: "Baharatlı mantar (pul biber, kimyon, sarımsakla)", vegan: true }],
};

export const GENERAL_ADVICE_NOTE = "Bu genel bir mutfak önerisidir; sonuç tarife ve kullandığınız ürüne göre değişebilir.";
export const MEDICAL_NOTE = "Kiler tıbbi beslenme tavsiyesi vermez. Hastalığına uygun beslenme için bir hekime veya diyetisyene danış.";

export function substitutesFor(slug: string, opts: { veganOnly?: boolean } = {}) {
  const list = SUBSTITUTIONS[slug] ?? [];
  return opts.veganOnly ? list.filter((s) => s.vegan) : list;
}
