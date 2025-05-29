// Statik içerik sayfaları. Her bölüm: başlık + paragraflar.
export interface ContentPage {
  title: string;
  description: string;
  eyebrow: string;
  sections: { heading?: string; body: string[] }[];
  faq?: { q: string; a: string }[];
}

export const PAGES: Record<string, ContentPage> = {
  about: {
    eyebrow: "Hakkımızda",
    title: "Ev mutfağının akıllı yardımcısı",
    description: "Kiler; elindeki malzemeyle ne pişireceğini bulmanı, eksiklerini listene eklemeni ve haftanı planlamanı kolaylaştıran bir mutfak asistanı.",
    sections: [
      {
        body: [
          "Kiler, “Bugün ne pişirsem?” sorusunun her akşam yorgun bir kafayla buzdolabının önünde sorulduğu evlerde doğdu. Amacımız basit: elindeki malzemeyi israf etmeden, vaktine ve damak tadına uygun bir tabağa dönüştürmek.",
          "Tariflerimiz ev mutfağı ölçüleriyle yazılır; her malzemenin besin değeri tek tek girilir ve tarif başına otomatik hesaplanır. Alerjenler malzemelerden çıkarılır, böylece bir tarifin glutensiz ya da vegan olduğunu tahmin etmek zorunda kalmazsın.",
        ],
      },
      {
        heading: "Yapay zekâyı nasıl kullanıyoruz?",
        body: [
          "AI mutfak asistanımız yalnızca tarif arşivimizdeki tarifleri önerir; tarif, kalori ya da besin değeri uydurmaz. Alerjilerin ve sevmediğin malzemeler yapay zekâya bırakılmaz — veritabanı sorgusunda kesin olarak elenir.",
          "Listeye ya da plana ekleme gibi her yazma işlemi senin onayınla gerçekleşir.",
        ],
      },
    ],
  },
  contact: {
    eyebrow: "İletişim",
    title: "Bize ulaş",
    description: "Kiler ekibiyle iletişime geç: öneri, hata bildirimi, iş birliği.",
    sections: [
      { body: ["Önerilerin, bulduğun bir hata ya da paylaşmak istediğin bir tarif mi var? merhaba@kiler.app adresine yazabilirsin; genellikle iki iş günü içinde dönüyoruz.", "Basın ve iş birlikleri için: is@kiler.app"] },
    ],
  },
  faq: {
    eyebrow: "Sık sorulan sorular",
    title: "Merak edilenler",
    description: "Kiler'in eşleştirme algoritması, besin değerleri, alerjen filtresi ve AI asistanı hakkında sık sorulan sorular.",
    sections: [],
    faq: [
      { q: "Eşleşme yüzdesi nasıl hesaplanıyor?", a: "Tarifin zorunlu malzemelerinden kaçının dolabında olduğuna bakıyoruz. Tuz, karabiber, su, sıvı yağ gibi “evde hep olanlar” ve “süslemek için” gibi opsiyonel malzemeler hesaba katılmaz. Bu listeyi Mutfak Tercihlerim'den değiştirebilirsin." },
      { q: "“Peynir” yazdım, kaşarlı tarifler de çıktı. Neden?", a: "Malzemeler arasında üst-alt ilişkisi var: kaşar ve beyaz peynir “peynir”in alt türleri. Ayrıca “kıyma” ile “çekilmiş et” gibi eş anlamlılar da eşleşir." },
      { q: "Alerjenlerim gerçekten hiç önerilmez mi?", a: "Evet. Alerjilerin ve sevmediğin malzemeler; öneri, arama, dolap eşleştirmesi ve AI yanıtlarında veritabanı seviyesinde elenir. Opsiyonel malzemelerdeki alerjenler de güvenli tarafta kalmak için dahil edilir." },
      { q: "AI asistanı olmayan bir tarifi uydurur mu?", a: "Hayır. Asistan yalnızca arşivimizdeki tarifleri önerebilir; sunucu, yanıttaki her tarifin gerçekten aday listesinde olduğunu doğrular. Arşivde yoksa açıkça söyler ve yakın alternatifler sunar." },
      { q: "Giriş yapmadan kullanabilir miyim?", a: "Evet. Dolabın ve alışveriş listen bu cihazda saklanır; giriş yaptığında hesabına aktarılır. Haftalık plan ve favoriler için hesap gerekir." },
      { q: "Pişirme modunda ekran neden kapanmıyor?", a: "Ekran Uyanık Tutma (Wake Lock) özelliğini kullanıyoruz; ıslak ya da unlu ellerle telefona dokunmak zorunda kalmazsın. Desteklemeyen tarayıcılarda ekran ayarların geçerlidir." },
    ],
  },
  privacy: {
    eyebrow: "Gizlilik",
    title: "Gizlilik Politikası",
    description: "Kiler'in hangi verileri neden topladığı ve nasıl koruduğu.",
    sections: [
      { heading: "Topladığımız veriler", body: ["Hesap bilgilerin (ad, e-posta), mutfak tercihlerin, dolabın, alışveriş listen, yemek planların, favorilerin ve AI asistanına yazdığın mesajlar.", "Ürünü geliştirmek için anonim kullanım istatistikleri (görüntülenen tarifler, aranan malzemeler)."] },
      { heading: "Kullanım amacı", body: ["Verilerin yalnızca sana önerilerde bulunmak, listeni ve planını saklamak ve hizmeti iyileştirmek için kullanılır. Üçüncü taraflarla satılmaz.", "AI özellikleri kullanıldığında, yalnızca soruna yanıt vermek için gereken tarif bilgileri yapay zekâ sağlayıcısına gönderilir; tüm veritabanı asla paylaşılmaz."] },
      { heading: "Haklarınız", body: ["Hesabını ve tüm verilerini silmemizi istediğinde merhaba@kiler.app adresine yazman yeterli."] },
    ],
  },
  terms: {
    eyebrow: "Koşullar",
    title: "Kullanım Koşulları",
    description: "Kiler'i kullanırken geçerli kurallar.",
    sections: [
      { body: ["Kiler'deki tarifler ve besin bilgileri bilgilendirme amaçlıdır. Tıbbi bir durumun varsa beslenme kararlarını bir hekim ya da diyetisyenle birlikte ver.", "Yorumlarda saygılı bir dil kullan; reklam, spam ve hakaret içeren yorumlar moderasyonla kaldırılır.", "Gönderdiğin tarif ve fotoğrafların sana ait olduğunu ve paylaşma hakkına sahip olduğunu kabul edersin."] },
    ],
  },
  nutrition: {
    eyebrow: "Besin değerleri",
    title: "Besin değerlerini nasıl hesaplıyoruz?",
    description: "Kiler'de tarif besin değerleri malzemelerden otomatik hesaplanır.",
    sections: [
      { body: ["Her malzemenin 100 gram başına kalori, protein, karbonhidrat, yağ, lif, şeker ve sodyum değerleri veritabanımızda kayıtlıdır (USDA ve TürKomp kaynaklı yaklaşık değerler).", "Tarifteki miktarlar grama çevrilir: “1 su bardağı un” ≈ 120 g, “1 adet yumurta” ≈ 50 g gibi malzemeye özel dönüşümler; sıvılarda yoğunluk kullanılır. Toplam değer porsiyon sayısına bölünür ve tarif üzerinde saklanır.", "Opsiyonel malzemeler (ör. “servis için limon”) hesaba katılmaz. Kızartma yağı gibi kısmen emilen malzemeler nedeniyle gerçek değerler farklılık gösterebilir."] },
      { heading: "Diyet etiketleri", body: ["Vegan, vejetaryen, glutensiz ve laktozsuz etiketleri malzemelerin türü ve alerjenlerinden otomatik çıkarılır. Porsiyon başı 20 g altı karbonhidrat “düşük karbonhidrat”, 25 g ve üzeri protein “yüksek protein” olarak işaretlenir.", "Değerler yaklaşıktır, kullanılan ürünlere göre değişebilir. Tıbbi tavsiye yerine geçmez."] },
    ],
  },
  "submit-recipe": {
    eyebrow: "Tarif gönder",
    title: "Ailenin tarifini Kiler'le paylaş",
    description: "Kiler'e tarif gönder; editörlerimiz ölçüleri test edip yayınlasın.",
    sections: [
      { body: ["Annenden kalan defterdeki o tarif, başkalarının da sofrasına konsun. Tarifini malzemeleri ve adımlarıyla birlikte tarif@kiler.app adresine gönder; editörlerimiz ölçüleri mutfakta test ettikten sonra senin adınla yayınlar.", "Fotoğraf eklersen harika olur — yoksa da dert değil, her tarif için özenli bir kapak hazırlıyoruz."] },
    ],
  },
};
