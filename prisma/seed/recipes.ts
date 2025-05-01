// Demo tarif verisi. Malzeme satırı: [miktar, birim, malzeme-slug, not?, opsiyonel?]
// Adımlardaki "N dakika" ifadeleri seed sırasında adım zamanlayıcısına dönüştürülür.
// Diyet bayrakları, alerjenler ve besin değerleri malzemelerden OTOMATİK hesaplanır.

export type Line = [number | null, string, string, string?, boolean?];

export interface SeedRecipe {
  title: string;
  cat: string;
  cui: string;
  diff: "EASY" | "MEDIUM" | "HARD";
  prep: number;
  cook: number;
  serv: number;
  desc: string;
  color: string;
  img?: string;
  featured?: boolean;
  tags?: string[];
  tips?: string[];
  ing: Line[];
  steps: string[];
}

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const RECIPES: SeedRecipe[] = [
  // ================================================================ Kahvaltı
  {
    title: "Menemen", cat: "kahvalti", cui: "turk", diff: "EASY", prep: 5, cook: 12, serv: 2, color: "#C8452C", featured: true,
    desc: "Domates, biber ve yumurtanın tavada buluştuğu, ekmeği banmadan kalkılamayan klasik kahvaltı.",
    tags: ["klasik", "tek-tava", "pratik"],
    tips: ["Domatesin suyunu iyice çektirirseniz menemen sulanmaz.", "Soğanlı mı soğansız mı? Tartışmaya girmeden bir küçük soğanı opsiyonel ekleyebilirsiniz."],
    ing: [[3, "adet", "domates", "kabuğu soyulmuş, küp doğranmış"], [3, "adet", "yesil-biber", "ince doğranmış"], [4, "adet", "yumurta"], [1, "yemek kaşığı", "tereyagi"], [1, "çay kaşığı", "tuz"], [1, "tutam", "karabiber"], [1, "çay kaşığı", "pul-biber", "", true]],
    steps: [
      "Tereyağını tavada eritin, biberleri ekleyip 3 dakika kavurun.",
      "Domatesleri ekleyin, suyunu çekene kadar orta ateşte 6 dakika pişirin.",
      "Yumurtaları kırın, tuz ve karabiberi ekleyip hafifçe karıştırın.",
      "Yumurtalar kıvamını alınca (yaklaşık 2 dakika) ocaktan alın, pul biberle servis edin.",
    ],
  },
  {
    title: "Shakshuka", cat: "kahvalti", cui: "orta-dogu", diff: "EASY", prep: 10, cook: 20, serv: 3, color: "#B83A26",
    desc: "Baharatlı domates sosunda pişen yumurtalar; Kuzey Afrika ve Orta Doğu sofralarının paylaşımlık kahvaltısı.",
    tags: ["tek-tava", "baharatli"],
    tips: ["Yumurtaların sarısının akışkan kalması için kapağı kapatıp kısık ateşte pişirin."],
    ing: [[1, "kutu", "konserve-domates"], [1, "adet", "kapya-biber", "şerit doğranmış"], [1, "adet", "sogan", "piyazlık"], [2, "diş", "sarimsak", "ezilmiş"], [5, "adet", "yumurta"], [2, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "pul-biber"], [1, "çay kaşığı", "tuz"], [2, "yemek kaşığı", "maydanoz", "kıyılmış", true]],
    steps: [
      "Zeytinyağında soğan ve biberi 5 dakika yumuşayana kadar kavurun.",
      "Sarımsak, kimyon ve pul biberi ekleyip 1 dakika çevirin.",
      "Konserve domatesi ve tuzu ekleyin; sos koyulaşana kadar 8 dakika pişirin.",
      "Sosta çukurlar açıp yumurtaları kırın, kapağı kapatıp 6 dakika pişirin.",
      "Maydanozla süsleyip tavada servis edin.",
    ],
  },
  {
    title: "Avokadolu Tost", cat: "kahvalti", cui: "dunya", diff: "EASY", prep: 8, cook: 3, serv: 2, color: "#6E8B3D",
    img: U("photo-1482049016688-2d3e1b311543"),
    desc: "Kızarmış ekşi mayalı ekmek üzerinde limonlu avokado ezmesi ve cherry domates. Beş dakikada tok tutan bir kahvaltı.",
    tags: ["5-dakika", "bitkisel"],
    tips: ["Avokadonun olgunluğunu sapına bastırarak kontrol edin; hafif yumuşamışsa tam kıvamındadır."],
    ing: [[2, "dilim", "ekmek", "ekşi mayalı"], [1, "adet", "avokado"], [1, "yemek kaşığı", "limon-suyu"], [6, "adet", "cherry-domates", "ikiye bölünmüş"], [1, "tutam", "pul-biber"], [1, "tutam", "tuz"], [1, "tatlı kaşığı", "zeytinyagi"]],
    steps: [
      "Ekmek dilimlerini tost makinesinde ya da tavada 3 dakika kızartın.",
      "Avokadoyu çatalla ezip limon suyu, tuz ve zeytinyağıyla karıştırın.",
      "Ezmeyi ekmeklere sürün; cherry domates ve pul biberle tamamlayın.",
    ],
  },
  {
    title: "Ispanaklı Peynirli Omlet", cat: "kahvalti", cui: "turk", diff: "EASY", prep: 5, cook: 8, serv: 1, color: "#5E7F3A", featured: true,
    desc: "Bir avuç ıspanak ve beyaz peynirle zenginleşen, 15 dakikada hazır proteinli omlet.",
    tags: ["pratik", "proteinli", "15-dakika"],
    tips: ["Ispanağı önce tavada söndürüp suyunu çektirirseniz omlet sulanmaz."],
    ing: [[3, "adet", "yumurta"], [2, "su bardağı", "ispanak", "iri kıyılmış"], [50, "g", "beyaz-peynir", "ufalanmış"], [1, "tatlı kaşığı", "tereyagi"], [1, "tutam", "tuz"], [1, "tutam", "karabiber"]],
    steps: [
      "Tereyağını tavada eritin, ıspanağı ekleyip 2 dakika söndürün.",
      "Yumurtaları tuz ve karabiberle çırpıp tavaya dökün.",
      "Kenarları tutmaya başlayınca peyniri serpin, kısık ateşte 4 dakika pişirin.",
      "Omleti ikiye katlayıp sıcak servis edin.",
    ],
  },
  {
    title: "Muzlu Yulaf Lapası", cat: "kahvalti", cui: "dunya", diff: "EASY", prep: 3, cook: 7, serv: 2, color: "#C9A26B",
    desc: "Badem sütüyle pişen kremamsı yulaf, muz ve tarçınla tatlanır. Bitkisel, doyurucu ve lif dolu.",
    tags: ["bitkisel", "lifli"],
    tips: ["Bir gece önceden buzdolabında bekletirseniz pişirmeden 'overnight oats' olarak da yiyebilirsiniz."],
    ing: [[1, "su bardağı", "yulaf"], [2, "su bardağı", "badem-sutu"], [1, "adet", "muz", "dilimlenmiş"], [1, "yemek kaşığı", "chia"], [1, "çay kaşığı", "tarcin"], [1, "avuç", "ceviz", "kırılmış", true]],
    steps: [
      "Yulafı badem sütüyle tencereye alın, kaynayınca kısın.",
      "Ara ara karıştırarak 5 dakika pişirin; chia ve tarçını ekleyin.",
      "Kaselere paylaştırıp muz dilimleri ve isteğe göre cevizle servis edin.",
    ],
  },
  {
    title: "Çılbır", cat: "kahvalti", cui: "turk", diff: "MEDIUM", prep: 5, cook: 10, serv: 2, color: "#D88A2D",
    desc: "Sarımsaklı yoğurt yatağında poşe yumurta ve üzerinde cızırdayan pul biberli tereyağı. Osmanlı saray mutfağından bir klasik.",
    tags: ["klasik", "osmanli"],
    tips: ["Poşe yumurta için suyu fokurdatmadan, hafif titreşir halde tutun; sirke beyazın dağılmasını önler."],
    ing: [[4, "adet", "yumurta"], [1.5, "su bardağı", "yogurt", "oda sıcaklığında"], [1, "diş", "sarimsak", "ezilmiş"], [2, "yemek kaşığı", "tereyagi"], [1, "çay kaşığı", "pul-biber"], [1, "yemek kaşığı", "sirke"], [1, "çay kaşığı", "tuz"], [4, "su bardağı", "su"]],
    steps: [
      "Yoğurdu sarımsak ve tuzla çırpıp servis tabaklarına yayın.",
      "Suyu sirkeyle kaynatın, ateşi kısın; yumurtaları tek tek kırıp 3 dakika poşe edin.",
      "Yumurtaları kevgirle alıp yoğurdun üzerine yerleştirin.",
      "Tereyağını eritip pul biberi ekleyin, 1 dakika köpürtüp yumurtaların üzerine gezdirin.",
    ],
  },
  {
    title: "Sucuklu Yumurta", cat: "kahvalti", cui: "turk", diff: "EASY", prep: 3, cook: 7, serv: 2, color: "#9E3B25",
    desc: "Pazar kahvaltılarının vazgeçilmezi: kendi yağında kızaran sucuk ve üzerine kırılan yumurtalar.",
    tags: ["pazar-kahvaltisi", "pratik"],
    ing: [[100, "g", "sucuk", "ince dilimlenmiş"], [4, "adet", "yumurta"], [1, "çay kaşığı", "tereyagi", "", true], [1, "tutam", "karabiber"]],
    steps: [
      "Sucukları yağsız tavada 3 dakika çevirerek kızartın.",
      "Yumurtaları sucukların arasına kırın, kapağı kapatıp 4 dakika pişirin.",
      "Karabiber serpip tavada servis edin.",
    ],
  },

  // ================================================================ Çorbalar
  {
    title: "Mercimek Çorbası", cat: "corbalar", cui: "turk", diff: "EASY", prep: 10, cook: 30, serv: 6, color: "#D9822B", featured: true,
    desc: "Kırmızı mercimek, havuç ve patatesle kadife kıvamında; lokantaların bir numaralı çorbası evde.",
    tags: ["klasik", "kis", "bitkisel", "ekonomik"],
    tips: ["Patates çorbaya un kullanmadan kıvam verir.", "Servis ederken pul biberli zeytinyağı ve limon unutmayın."],
    ing: [[1.5, "su bardağı", "kirmizi-mercimek", "yıkanmış"], [1, "adet", "sogan", "doğranmış"], [1, "adet", "havuc", "doğranmış"], [1, "adet", "patates", "doğranmış"], [1, "yemek kaşığı", "domates-salcasi"], [3, "yemek kaşığı", "zeytinyagi"], [7, "su bardağı", "su", "sıcak"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "pul-biber"], [1, "adet", "limon", "servis için", true]],
    steps: [
      "Zeytinyağında soğanı 3 dakika kavurun; havuç ve patatesi ekleyip 2 dakika daha çevirin.",
      "Salçayı ekleyip kokusu çıkana kadar karıştırın.",
      "Mercimeği ve sıcak suyu ekleyin; kapağı aralık, kısık ateşte 25 dakika pişirin.",
      "Blenderdan geçirin, tuz ve kimyonu ekleyip 2 dakika daha kaynatın.",
      "Pul biberi bir kaşık zeytinyağında kızdırıp üzerine gezdirin; limonla servis edin.",
    ],
  },
  {
    title: "Ezogelin Çorbası", cat: "corbalar", cui: "turk", diff: "EASY", prep: 10, cook: 35, serv: 6, color: "#C4612B",
    desc: "Mercimek, bulgur ve pirincin naneli, salçalı buluşması. Gaziantep'ten sofralara uzanan doyurucu bir hikâye.",
    tags: ["klasik", "kis", "bitkisel"],
    ing: [[1, "su bardağı", "kirmizi-mercimek"], [2, "yemek kaşığı", "bulgur"], [2, "yemek kaşığı", "pirinc"], [1, "adet", "sogan"], [1, "yemek kaşığı", "domates-salcasi"], [1, "tatlı kaşığı", "biber-salcasi"], [3, "yemek kaşığı", "zeytinyagi"], [8, "su bardağı", "su"], [1, "yemek kaşığı", "kuru-nane"], [1, "çay kaşığı", "pul-biber"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Soğanı zeytinyağında 3 dakika kavurun, salçaları ekleyip çevirin.",
      "Mercimek, bulgur ve pirinci ekleyip suyu ilave edin.",
      "Kısık ateşte, ara ara karıştırarak 30 dakika pişirin.",
      "Nane, pul biber ve tuzu ekleyip 2 dakika daha kaynatın.",
    ],
  },
  {
    title: "Yayla Çorbası", cat: "corbalar", cui: "turk", diff: "MEDIUM", prep: 10, cook: 25, serv: 5, color: "#E5D3A6",
    desc: "Yoğurt, pirinç ve naneli tereyağıyla hem ferahlatan hem ısıtan bir Anadolu çorbası.",
    tags: ["klasik", "yogurtlu"],
    tips: ["Yoğurdun kesilmemesi için sıcak çorbadan birkaç kepçe alıp yoğurda yavaşça ekleyerek ılıştırın."],
    ing: [[0.5, "su bardağı", "pirinc"], [1.5, "su bardağı", "yogurt"], [1, "adet", "yumurta", "sadece sarısı"], [1, "yemek kaşığı", "un"], [6, "su bardağı", "su"], [2, "yemek kaşığı", "tereyagi"], [1, "yemek kaşığı", "kuru-nane"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Pirinci suyla birlikte 15 dakika haşlayın.",
      "Yoğurt, yumurta sarısı ve unu pürüzsüz olana kadar çırpın.",
      "Sıcak çorbadan birkaç kepçe alıp yoğurtlu karışımı ılıştırın, sonra tencereye ekleyin.",
      "Sürekli karıştırarak 5 dakika kaynatın, tuzunu ayarlayın.",
      "Tereyağında naneyi kızdırıp çorbanın üzerine gezdirin.",
    ],
  },
  {
    title: "Domates Çorbası", cat: "corbalar", cui: "turk", diff: "EASY", prep: 10, cook: 20, serv: 4, color: "#C93A2A",
    desc: "Olgun domatesten sütlü ve kremamsı bir çorba; üzerine rendelenmiş kaşarla çocukların da favorisi.",
    tags: ["klasik", "cocuklar-sever"],
    ing: [[6, "adet", "domates", "rendelenmiş"], [2, "yemek kaşığı", "un"], [2, "yemek kaşığı", "tereyagi"], [1, "su bardağı", "sut"], [4, "su bardağı", "su"], [1, "tatlı kaşığı", "tuz"], [0.5, "su bardağı", "kasar", "rendelenmiş", true]],
    steps: [
      "Tereyağında unu 2 dakika kokusu çıkana kadar kavurun.",
      "Rendelenmiş domatesi ekleyip 5 dakika pişirin.",
      "Suyu ekleyin, kaynayınca kısıp 10 dakika pişirin; blenderdan geçirin.",
      "Sütü yavaşça ekleyip 3 dakika daha kaynatın. Kaşarla servis edin.",
    ],
  },
  {
    title: "Şehriyeli Tavuk Çorbası", cat: "corbalar", cui: "turk", diff: "EASY", prep: 10, cook: 30, serv: 5, color: "#E2B04A",
    desc: "Hasta çorbası diye küçümsemeyin: tavuk suyu, sebze ve şehriyeyle içi ısıtan bir kase şifa.",
    tags: ["kis", "proteinli"],
    ing: [[250, "g", "tavuk-gogsu"], [6, "su bardağı", "tavuk-suyu"], [0.5, "su bardağı", "sehriye", "tel şehriye"], [1, "adet", "havuc", "küp doğranmış"], [1, "yemek kaşığı", "tereyagi"], [1, "tatlı kaşığı", "tuz"], [1, "tutam", "karabiber"], [1, "adet", "limon", "servis için", true], [2, "yemek kaşığı", "maydanoz", "kıyılmış", true]],
    steps: [
      "Tavuk göğsünü tavuk suyunda 20 dakika haşlayın, çıkarıp didikleyin.",
      "Havucu tereyağında 2 dakika çevirip suya ekleyin.",
      "Şehriyeyi ve didiklenmiş tavuğu ekleyip 8 dakika pişirin.",
      "Tuz ve karabiberle tatlandırın, limon ve maydanozla servis edin.",
    ],
  },
  {
    title: "Balkabağı Çorbası", cat: "corbalar", cui: "dunya", diff: "EASY", prep: 15, cook: 25, serv: 4, color: "#E08A2E",
    desc: "Hindistan cevizi sütü ve zencefille kadifemsi, sonbaharın en sıcak rengi.",
    tags: ["sonbahar", "bitkisel"],
    ing: [[600, "g", "balkabagi", "küp doğranmış"], [1, "adet", "sogan"], [1, "adet", "havuc"], [10, "g", "zencefil", "rendelenmiş"], [1, "su bardağı", "hindistan-cevizi-sutu"], [2, "yemek kaşığı", "zeytinyagi"], [3, "su bardağı", "sebze-suyu"], [1, "tatlı kaşığı", "tuz"], [1, "tutam", "karabiber"]],
    steps: [
      "Soğanı zeytinyağında 3 dakika kavurun, zencefili ekleyin.",
      "Balkabağı ve havucu ekleyip 2 dakika çevirin.",
      "Sebze suyunu ekleyin; sebzeler yumuşayana kadar 20 dakika pişirin.",
      "Hindistan cevizi sütünü ekleyip blenderdan geçirin, baharatlayın.",
    ],
  },
  {
    title: "Brokoli Çorbası", cat: "corbalar", cui: "dunya", diff: "EASY", prep: 10, cook: 20, serv: 4, color: "#5C8A3E",
    desc: "Yeşilin en lezzetli hali: sütlü, hafif ve vitamin dolu bir brokoli çorbası.",
    tags: ["hafif", "sebzeli"],
    ing: [[1, "adet", "brokoli", "küçük çiçeklere ayrılmış"], [1, "adet", "patates"], [1, "adet", "sogan"], [1, "su bardağı", "sut"], [1, "yemek kaşığı", "tereyagi"], [4, "su bardağı", "su"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Soğanı tereyağında 3 dakika kavurun.",
      "Brokoli, patates ve suyu ekleyip 15 dakika pişirin.",
      "Blenderdan geçirip sütü ekleyin, 2 dakika daha kaynatın.",
    ],
  },

  // ================================================================ Ana yemekler
  {
    title: "Karnıyarık", cat: "ana-yemekler", cui: "turk", diff: "MEDIUM", prep: 25, cook: 40, serv: 4, color: "#4B2E5A", featured: true,
    desc: "Kızarmış patlıcanların kalbine yerleşen kıymalı iç; Türk mutfağının yaz klasiği.",
    tags: ["klasik", "yaz", "firin"],
    tips: ["Patlıcanları alacalı soyup tuzlu suda 20 dakika bekletirseniz acısı çıkar ve daha az yağ çeker."],
    ing: [[6, "adet", "patlican"], [250, "g", "kiyma"], [1, "adet", "sogan", "ince doğranmış"], [2, "adet", "domates"], [3, "adet", "yesil-biber"], [2, "diş", "sarimsak"], [1, "yemek kaşığı", "domates-salcasi"], [0.5, "su bardağı", "sivi-yag", "kızartmak için"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "karabiber"], [1, "su bardağı", "su", "sıcak"], [2, "yemek kaşığı", "maydanoz", "", true]],
    steps: [
      "Patlıcanları alacalı soyup tuzlu suda 20 dakika bekletin, kurulayın.",
      "Patlıcanları kızgın yağda her yüzü dönene kadar 8 dakika kızartın.",
      "Soğanı kavurup kıymayı ekleyin, suyunu çekene kadar 7 dakika pişirin.",
      "Bir domates, biber, sarımsak ve baharatları ekleyip 3 dakika daha pişirin.",
      "Patlıcanları yarıp içini doldurun; üzerine domates ve biber dilimleri koyun.",
      "Salçalı suyu tepsiye ekleyip 180°C fırında 25 dakika pişirin.",
    ],
  },
  {
    title: "İzmir Köfte", cat: "ana-yemekler", cui: "turk", diff: "MEDIUM", prep: 25, cook: 35, serv: 4, color: "#A4432A",
    desc: "Kızarmış köfte ve patateslerin domates soslu fırın buluşması; pazar öğlelerinin yıldızı.",
    tags: ["klasik", "firin", "aile-sofrasi"],
    ing: [[500, "g", "kiyma"], [1, "dilim", "ekmek", "bayat, ıslatılmış"], [1, "adet", "yumurta"], [1, "adet", "sogan", "rendelenmiş"], [3, "adet", "patates", "elma dilim"], [4, "adet", "yesil-biber"], [2, "adet", "domates"], [1, "yemek kaşığı", "domates-salcasi"], [1, "çay kaşığı", "kimyon"], [1, "tatlı kaşığı", "tuz"], [3, "yemek kaşığı", "sivi-yag"], [1.5, "su bardağı", "su", "sıcak"]],
    steps: [
      "Kıyma, ekmek, yumurta, soğan, kimyon ve tuzu 5 dakika yoğurun; parmak köfteler şekillendirin.",
      "Köfteleri ve patatesleri az yağda 10 dakika hafifçe kızartın.",
      "Fırın kabına köfte, patates, biber ve domatesleri dizin.",
      "Salçayı sıcak suda açıp üzerine dökün; 190°C fırında 30 dakika pişirin.",
    ],
  },
  {
    title: "Tavuk Sote", cat: "ana-yemekler", cui: "turk", diff: "EASY", prep: 10, cook: 20, serv: 4, color: "#C9772F", featured: true,
    desc: "Renkli biberler ve mantarla yüksek ateşte sotelenmiş tavuk; yanına pilav ya da salata, akşam yemeği hazır.",
    tags: ["pratik", "proteinli", "tek-tava"],
    ing: [[500, "g", "tavuk-gogsu", "kuşbaşı"], [1, "adet", "kapya-biber"], [2, "adet", "yesil-biber"], [1, "adet", "sogan"], [2, "adet", "domates", "küp"], [200, "g", "mantar", "dilimlenmiş"], [2, "yemek kaşığı", "sivi-yag"], [1, "çay kaşığı", "kekik"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "karabiber"]],
    steps: [
      "Tavukları kızgın yağda suyunu salıp çekene kadar 6 dakika sotelayın.",
      "Soğan ve mantarı ekleyip 4 dakika daha pişirin.",
      "Biberleri ekleyin, 3 dakika çevirin.",
      "Domates ve baharatları ekleyip kapağı kapalı 7 dakika pişirin.",
    ],
  },
  {
    title: "Fırında Limonlu Somon", cat: "ana-yemekler", cui: "dunya", diff: "EASY", prep: 10, cook: 18, serv: 4, color: "#E07B5B",
    img: U("photo-1467003909585-2f8a72700288"),
    desc: "Sarımsak, dereotu ve limonla fırınlanan somon, yanında közlenmiş brokoli. Omega-3 dolu bir akşam yemeği.",
    tags: ["firin", "omega-3", "proteinli"],
    tips: ["Somonu fırından içi hafif pembeyken çıkarın; dinlenirken pişmeye devam eder."],
    ing: [[600, "g", "somon", "4 fileto"], [1, "adet", "limon", "dilimlenmiş"], [2, "yemek kaşığı", "zeytinyagi"], [2, "diş", "sarimsak"], [0.5, "demet", "dereotu"], [1, "adet", "brokoli"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "karabiber"]],
    steps: [
      "Fırını 200°C'ye ısıtın. Brokoliyi zeytinyağı ve tuzla harmanlayıp tepsiye yayın.",
      "Somonları tepsiye yerleştirin; sarımsak, dereotu ve limon dilimleriyle kaplayın.",
      "Fırında 18 dakika pişirin ve hemen servis edin.",
    ],
  },
  {
    title: "Etli Kuru Fasulye", cat: "ana-yemekler", cui: "turk", diff: "MEDIUM", prep: 15, cook: 90, serv: 6, color: "#B5542D",
    desc: "Bir gece ıslatılmış fasulye, kuşbaşı et ve tereyağlı salçayla ağır ateşte; yanına pilav şart.",
    tags: ["klasik", "kis", "proteinli"],
    tips: ["Fasulyeyi bir gece önceden ıslatın; pişerken tuzu en son ekleyin ki kabuğu sertleşmesin."],
    ing: [[2, "su bardağı", "kuru-fasulye", "bir gece ıslatılmış"], [250, "g", "kusbasi"], [1, "adet", "sogan"], [2, "yemek kaşığı", "domates-salcasi"], [2, "yemek kaşığı", "tereyagi"], [6, "su bardağı", "su", "sıcak"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "pul-biber"]],
    steps: [
      "Islatılmış fasulyeyi 15 dakika haşlayıp süzün.",
      "Eti tereyağında suyunu çekene kadar 10 dakika kavurun; soğanı ekleyin.",
      "Salçayı ekleyip 2 dakika çevirin; fasulye ve sıcak suyu ilave edin.",
      "Kısık ateşte fasulyeler yumuşayana kadar 60 dakika pişirin; tuzu en son ekleyin.",
    ],
  },
  {
    title: "Nohut Körisi", cat: "ana-yemekler", cui: "asya", diff: "EASY", prep: 10, cook: 25, serv: 4, color: "#D9A13B",
    desc: "Hindistan cevizi sütü, köri ve ıspanakla zenginleşen tek tencere bitkisel bir akşam yemeği.",
    tags: ["bitkisel", "tek-tencere", "baharatli"],
    ing: [[2, "kutu", "haslanmis-nohut", "süzülmüş"], [1, "kutu", "hindistan-cevizi-sutu"], [1, "kutu", "konserve-domates"], [1, "adet", "sogan"], [3, "diş", "sarimsak"], [15, "g", "zencefil", "rendelenmiş"], [1, "yemek kaşığı", "kori"], [1, "çay kaşığı", "zerdecal"], [2, "su bardağı", "ispanak"], [2, "yemek kaşığı", "zeytinyagi"], [1, "tatlı kaşığı", "tuz"], [2, "yemek kaşığı", "kisnis", "", true]],
    steps: [
      "Soğanı zeytinyağında 4 dakika kavurun; sarımsak ve zencefili ekleyin.",
      "Köri ve zerdeçalı ekleyip 1 dakika kokusu çıkana kadar çevirin.",
      "Domates, nohut ve hindistan cevizi sütünü ekleyin; 15 dakika pişirin.",
      "Ispanağı ekleyip 2 dakika söndürün, tuzunu ayarlayın.",
    ],
  },
  {
    title: "Pad Thai", cat: "ana-yemekler", cui: "asya", diff: "MEDIUM", prep: 20, cook: 12, serv: 3, color: "#D17A3A",
    desc: "Pirinç eriştesi, karides, yumurta ve fıstıkla wok'ta yüksek ateşte; ekşi-tatlı-tuzlu dengesiyle Tayland'ın sokak klasiği.",
    tags: ["wok", "sokak-lezzeti"],
    tips: ["Erişteyi haşlamak yerine sıcak suda yumuşatın; wok'ta pişmeye devam edecek."],
    ing: [[200, "g", "pirinc-eriste"], [200, "g", "karides", "ayıklanmış"], [2, "adet", "yumurta"], [3, "yemek kaşığı", "soya-sosu"], [1, "yemek kaşığı", "seker"], [1, "adet", "limon", "misket limonu"], [0.25, "su bardağı", "yer-fistigi", "kavrulmuş, iri dövülmüş"], [3, "dal", "yesil-sogan"], [2, "diş", "sarimsak"], [2, "yemek kaşığı", "sivi-yag"]],
    steps: [
      "Erişteleri sıcak suda 8 dakika bekletip süzün.",
      "Soya sosu, şeker ve yarım limonun suyunu karıştırarak sosu hazırlayın.",
      "Wok'ta sarımsak ve karidesleri 3 dakika çevirin, kenara itip yumurtaları karıştırarak pişirin.",
      "Erişte ve sosu ekleyip 3 dakika yüksek ateşte harmanlayın.",
      "Yeşil soğan, fıstık ve limon dilimleriyle servis edin.",
    ],
  },
  {
    title: "Tavuklu Fajita", cat: "ana-yemekler", cui: "meksika", diff: "EASY", prep: 15, cook: 15, serv: 4, color: "#C2562C",
    desc: "Baharatlı tavuk şeritleri ve renkli biberler, sıcak lavaşlara sarılıyor. Masaya tavayla gelen Meksika şenliği.",
    tags: ["paylasimlik", "baharatli"],
    ing: [[500, "g", "tavuk-gogsu", "şerit doğranmış"], [2, "adet", "kapya-biber", "şerit"], [1, "adet", "dolmalik-biber", "şerit"], [1, "adet", "kirmizi-sogan", "piyazlık"], [4, "adet", "lavas"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "pul-biber"], [1, "adet", "limon"], [2, "yemek kaşığı", "sivi-yag"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Tavuğu kimyon, pul biber, tuz ve limon suyuyla harmanlayıp 10 dakika marine edin.",
      "Kızgın tavada tavukları 6 dakika yüksek ateşte pişirin, alın.",
      "Aynı tavada biber ve soğanları 5 dakika sotelayın, tavukları geri ekleyin.",
      "Isıttığınız lavaşlara sararak servis edin.",
    ],
  },
  {
    title: "Chili con Carne", cat: "ana-yemekler", cui: "meksika", diff: "EASY", prep: 10, cook: 40, serv: 5, color: "#8E2F23",
    desc: "Kıyma, kırmızı fasulye ve baharatlarla koyu kıvamlı, tek tencerede pişen doyurucu bir Tex-Mex klasiği.",
    tags: ["tek-tencere", "proteinli", "baharatli"],
    ing: [[400, "g", "kiyma"], [1, "kutu", "kirmizi-fasulye", "süzülmüş"], [1, "kutu", "konserve-domates"], [1, "adet", "sogan"], [2, "diş", "sarimsak"], [1, "adet", "kapya-biber"], [1, "tatlı kaşığı", "kimyon"], [1, "tatlı kaşığı", "pul-biber"], [1, "yemek kaşığı", "sivi-yag"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Soğan, sarımsak ve biberi yağda 4 dakika kavurun.",
      "Kıymayı ekleyip suyunu çekene kadar 8 dakika pişirin.",
      "Baharatları, domatesi ve fasulyeyi ekleyin; kısık ateşte 25 dakika koyulaştırın.",
    ],
  },
  {
    title: "Mantarlı Risotto", cat: "ana-yemekler", cui: "italyan", diff: "MEDIUM", prep: 10, cook: 30, serv: 4, color: "#A88B5E",
    desc: "Sabırla, kepçe kepçe eklenen sebze suyuyla kremamsı kıvamını bulan, parmesanlı mantar risottosu.",
    tags: ["italyan-klasigi", "vejetaryen"],
    tips: ["Risottoyu sürekli karıştırmak pirincin nişastasını salmasını sağlar; krema eklemeye gerek kalmaz."],
    ing: [[1.5, "su bardağı", "arborio-pirinc"], [300, "g", "mantar"], [1, "adet", "sogan", "ince doğranmış"], [5, "su bardağı", "sebze-suyu", "sıcak"], [2, "yemek kaşığı", "tereyagi"], [50, "g", "parmesan", "rendelenmiş"], [2, "yemek kaşığı", "zeytinyagi"], [1, "tutam", "karabiber"]],
    steps: [
      "Mantarları zeytinyağında 6 dakika kızartıp ayırın.",
      "Soğanı 3 dakika kavurun, pirinci ekleyip 2 dakika şeffaflaşana kadar çevirin.",
      "Sıcak sebze suyunu kepçe kepçe, her seferinde çekmesini bekleyerek ekleyin; toplam 18 dakika pişirin.",
      "Mantarları, tereyağını ve parmesanı ekleyip ocaktan alın, 2 dakika dinlendirin.",
    ],
  },
  {
    title: "Falafel", cat: "ana-yemekler", cui: "orta-dogu", diff: "MEDIUM", prep: 20, cook: 15, serv: 4, color: "#7A8A3A",
    desc: "Islatılmış nohut ve bol yeşillikle yapılan, dışı çıtır içi yumuşak Orta Doğu köftesi.",
    tags: ["bitkisel", "sokak-lezzeti"],
    tips: ["Falafel için haşlanmış değil, bir gece ıslatılmış ÇİĞ nohut kullanın; yoksa dağılır."],
    ing: [[2, "su bardağı", "nohut", "bir gece ıslatılmış"], [1, "adet", "sogan"], [3, "diş", "sarimsak"], [1, "demet", "maydanoz"], [0.5, "demet", "kisnis"], [1, "tatlı kaşığı", "kimyon"], [1, "çay kaşığı", "kabartma-tozu"], [1, "tatlı kaşığı", "tuz"], [0.5, "su bardağı", "sivi-yag", "kızartmak için"]],
    steps: [
      "Nohut, soğan, sarımsak ve yeşillikleri robotta iri kum kıvamına gelene kadar çekin.",
      "Baharatları ve kabartma tozunu ekleyip karışımı 15 dakika buzdolabında dinlendirin.",
      "Ceviz büyüklüğünde toplar yapıp kızgın yağda 4 dakika kızartın.",
    ],
  },
  {
    title: "Fırında Tavuk Baget ve Patates", cat: "ana-yemekler", cui: "turk", diff: "EASY", prep: 10, cook: 45, serv: 4, color: "#C7883A",
    desc: "Kekikli, sarımsaklı tavuk bagetler ve çıtır patatesler tek tepside. Bulaşığı az, lezzeti çok.",
    tags: ["firin", "tek-tepsi", "aile-sofrasi"],
    ing: [[8, "adet", "tavuk-but"], [4, "adet", "patates", "elma dilim"], [3, "yemek kaşığı", "zeytinyagi"], [3, "diş", "sarimsak", "ezilmiş"], [1, "tatlı kaşığı", "kekik"], [1, "tatlı kaşığı", "pul-biber"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Fırını 200°C'ye ısıtın. Tüm malzemeleri geniş bir kapta harmanlayın.",
      "Tepsiye tek kat olacak şekilde yayın.",
      "Yarısında çevirerek 45 dakika, tavuklar kızarana kadar pişirin.",
    ],
  },
  {
    title: "Bulgur Pilavı", cat: "ana-yemekler", cui: "turk", diff: "EASY", prep: 10, cook: 25, serv: 4, color: "#B86A2D",
    desc: "Domatesli, biberli, salçalı; tane tane dökülen Anadolu bulgur pilavı. Kuru fasulyenin en iyi arkadaşı.",
    tags: ["klasik", "bitkisel", "ekonomik"],
    ing: [[2, "su bardağı", "bulgur"], [1, "adet", "sogan"], [2, "adet", "yesil-biber"], [1, "adet", "domates"], [1, "yemek kaşığı", "domates-salcasi"], [3, "yemek kaşığı", "zeytinyagi"], [3, "su bardağı", "su", "sıcak"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Soğan ve biberi zeytinyağında 4 dakika kavurun; domates ve salçayı ekleyin.",
      "Bulguru ekleyip 2 dakika çevirin, sıcak su ve tuzu ilave edin.",
      "Kaynayınca kısın, suyunu çekene kadar 15 dakika pişirin.",
      "Ocaktan alıp kapağın altına kağıt havlu koyarak 10 dakika demlendirin.",
    ],
  },
  {
    title: "Tereyağlı Pirinç Pilavı", cat: "ana-yemekler", cui: "turk", diff: "EASY", prep: 25, cook: 20, serv: 4, color: "#E8D8B0",
    desc: "Tane tane, parlak ve tereyağı kokulu; her yemeğin yanına yakışan klasik pirinç pilavı.",
    tags: ["klasik", "yan-lezzet"],
    tips: ["Pirinci ılık tuzlu suda 20 dakika bekletip nişastasını iyice yıkayın."],
    ing: [[2, "su bardağı", "pirinc", "baldo"], [2, "yemek kaşığı", "tereyagi"], [3, "su bardağı", "su", "sıcak"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Pirinci ılık tuzlu suda 20 dakika bekletip berrak su akana kadar yıkayın.",
      "Tereyağında pirinci 3 dakika kavurun.",
      "Sıcak suyu ve tuzu ekleyin; kaynayınca kısıp 12 dakika pişirin.",
      "Ocaktan alıp 10 dakika demlendirin.",
    ],
  },
  {
    title: "Hünkâr Beğendi", cat: "ana-yemekler", cui: "turk", diff: "HARD", prep: 30, cook: 75, serv: 4, color: "#6B3A2A",
    desc: "Közlenmiş patlıcanlı, kaşarlı beğendi yatağında ağır ateşte pişmiş et. Saray mutfağının gösterişli tabağı.",
    tags: ["osmanli", "ozel-gun"],
    ing: [[500, "g", "kusbasi"], [4, "adet", "patlican", "közlenmiş"], [2, "su bardağı", "sut"], [2, "yemek kaşığı", "un"], [3, "yemek kaşığı", "tereyagi"], [50, "g", "kasar", "rendelenmiş"], [1, "adet", "sogan"], [2, "adet", "domates"], [1, "yemek kaşığı", "domates-salcasi"], [2, "su bardağı", "su"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Eti bir kaşık tereyağında suyunu çekene kadar 10 dakika kavurun; soğan, domates ve salçayı ekleyin.",
      "Su ekleyip et yumuşayana kadar kısık ateşte 60 dakika pişirin.",
      "Patlıcanları közleyip ince kıyın.",
      "Kalan tereyağında unu 2 dakika kavurun, sütü azar azar ekleyip beşamel yapın.",
      "Patlıcan ve kaşarı beşamele ekleyip 3 dakika karıştırın; etle birlikte servis edin.",
    ],
  },
  {
    title: "Sebzeli Tofu Wok", cat: "ana-yemekler", cui: "asya", diff: "EASY", prep: 15, cook: 12, serv: 3, color: "#7E9A3C",
    desc: "Çıtır tofu, brokoli ve renkli sebzeler soya-zencefil sosuyla; 30 dakikada bitkisel bir wok.",
    tags: ["wok", "bitkisel", "pratik"],
    ing: [[300, "g", "tofu", "küp doğranmış"], [1, "adet", "brokoli", "küçük çiçekler"], [1, "adet", "kapya-biber"], [1, "adet", "havuc", "jülyen"], [3, "yemek kaşığı", "soya-sosu"], [2, "diş", "sarimsak"], [10, "g", "zencefil"], [1, "yemek kaşığı", "susam"], [2, "yemek kaşığı", "sivi-yag"]],
    steps: [
      "Tofuyu kurulayıp kızgın yağda her yüzü altın renk alana kadar 6 dakika kızartın.",
      "Sarımsak, zencefil ve sebzeleri ekleyip yüksek ateşte 4 dakika çevirin.",
      "Soya sosunu ekleyip 1 dakika harmanlayın; susamla servis edin.",
    ],
  },

  // ================================================================ Zeytinyağlılar
  {
    title: "Zeytinyağlı Taze Fasulye", cat: "zeytinyaglilar", cui: "turk", diff: "EASY", prep: 15, cook: 45, serv: 5, color: "#5F8A3A", featured: true,
    desc: "Kendi suyunda, kısık ateşte pişen; soğuk servis edilen yaz sofralarının yeşil yıldızı.",
    tags: ["yaz", "bitkisel", "soguk-servis"],
    tips: ["Bir tutam şeker domatesin ekşiliğini dengeler ve fasulyenin rengini korur."],
    ing: [[750, "g", "taze-fasulye", "ayıklanmış"], [1, "adet", "sogan", "yarım ay"], [2, "adet", "domates", "rendelenmiş"], [0.5, "su bardağı", "zeytinyagi"], [1, "çay kaşığı", "seker"], [1, "su bardağı", "su"], [1, "tatlı kaşığı", "tuz"]],
    steps: [
      "Soğanı zeytinyağında 3 dakika pembeleştirin.",
      "Fasulyeleri ekleyip 5 dakika renk değiştirene kadar çevirin.",
      "Domates, şeker, tuz ve suyu ekleyin; kapağı kapalı kısık ateşte 40 dakika pişirin.",
      "Tenceresinde soğumaya bırakıp servis edin.",
    ],
  },
  {
    title: "Zeytinyağlı Enginar", cat: "zeytinyaglilar", cui: "turk", diff: "MEDIUM", prep: 25, cook: 35, serv: 6, color: "#8BA05A",
    desc: "Limonlu suda pişen enginar çanakları, garnitürü ve bol dereotuyla bahar sofralarının incisi.",
    tags: ["ilkbahar", "bitkisel", "soguk-servis"],
    ing: [[6, "adet", "enginar", "temizlenmiş çanak"], [1, "adet", "havuc", "küp"], [1, "adet", "patates", "küp"], [0.5, "su bardağı", "bezelye"], [1, "adet", "limon"], [0.5, "su bardağı", "zeytinyagi"], [0.5, "demet", "dereotu"], [1, "tatlı kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [1.5, "su bardağı", "su"]],
    steps: [
      "Enginarları limonlu suda bekletin ki kararmasınlar.",
      "Havuç, patates ve bezelyeyi zeytinyağında 3 dakika çevirin.",
      "Enginarları tencereye dizip garnitürü içlerine doldurun.",
      "Su, limon suyu, şeker ve tuzu ekleyip kısık ateşte 30 dakika pişirin; dereotuyla soğuk servis edin.",
    ],
  },
  {
    title: "Zeytinyağlı Pırasa", cat: "zeytinyaglilar", cui: "turk", diff: "EASY", prep: 15, cook: 30, serv: 5, color: "#9DB06A",
    desc: "Havuç ve bir avuç pirinçle tatlanan, limonla ferahlayan kış zeytinyağlısı.",
    tags: ["kis", "bitkisel"],
    ing: [[4, "adet", "pirasa", "2 cm doğranmış"], [1, "adet", "havuc", "halka"], [2, "yemek kaşığı", "pirinc"], [0.5, "su bardağı", "zeytinyagi"], [1, "adet", "limon"], [1, "çay kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [1, "su bardağı", "su"]],
    steps: [
      "Havucu zeytinyağında 3 dakika çevirin, pırasaları ekleyip 5 dakika daha pişirin.",
      "Pirinç, şeker, tuz ve suyu ekleyin.",
      "Kapağı kapalı kısık ateşte 25 dakika pişirin; limon suyuyla soğuk servis edin.",
    ],
  },
  {
    title: "İmam Bayıldı", cat: "zeytinyaglilar", cui: "turk", diff: "MEDIUM", prep: 20, cook: 45, serv: 4, color: "#5A2E4A",
    desc: "Soğan ve sarımsakla dolu, zeytinyağında ağır ağır pişen patlıcan. Adının hikâyesi kadar efsane bir tat.",
    tags: ["klasik", "bitkisel", "soguk-servis"],
    ing: [[4, "adet", "patlican"], [3, "adet", "sogan", "piyazlık"], [3, "adet", "domates"], [6, "diş", "sarimsak"], [2, "adet", "yesil-biber"], [0.5, "demet", "maydanoz"], [0.5, "su bardağı", "zeytinyagi"], [1, "tatlı kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [1, "su bardağı", "su"]],
    steps: [
      "Patlıcanları alacalı soyup tuzlu suda 20 dakika bekletin, zeytinyağında 8 dakika çevirerek yumuşatın.",
      "Soğan ve sarımsağı aynı yağda 8 dakika kavurun; domates, biber, şeker ve maydanozu ekleyin.",
      "Patlıcanları yarıp harcı doldurun, tencereye dizin.",
      "Su ekleyip kapağı kapalı kısık ateşte 30 dakika pişirin; soğuk servis edin.",
    ],
  },
  {
    title: "Zeytinyağlı Yaprak Sarma", cat: "zeytinyaglilar", cui: "turk", diff: "HARD", prep: 60, cook: 50, serv: 8, color: "#4F6B34",
    desc: "Kuş üzümlü, baharatlı pirinç iç, ince ince sarılmış asma yapraklarında. Sabır ister, karşılığını fazlasıyla verir.",
    tags: ["klasik", "bitkisel", "ozel-gun"],
    tips: ["Yaprakları sıcak suda 2-3 dakika bekletip tuzunu alın.", "Tencerenin dibine birkaç yaprak sererseniz sarmalar dibe yapışmaz."],
    ing: [[250, "g", "asma-yapragi"], [2, "su bardağı", "pirinc"], [3, "adet", "sogan", "ince doğranmış"], [2, "yemek kaşığı", "kuru-uzum"], [1, "tatlı kaşığı", "kuru-nane"], [1, "çay kaşığı", "yenibahar"], [1, "çay kaşığı", "tarcin"], [0.75, "su bardağı", "zeytinyagi"], [1, "adet", "limon"], [1, "tatlı kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [3, "su bardağı", "su", "sıcak"]],
    steps: [
      "Soğanı zeytinyağının yarısında 8 dakika kavurun; pirinci ekleyip 3 dakika çevirin.",
      "Kuş üzümü, baharatlar, şeker ve tuzu ekleyip yarım bardak su ile 5 dakika pişirin; soğutun.",
      "Yaprakların mat yüzüne iç koyup sıkıca sarın; tencereye dizin.",
      "Kalan zeytinyağı, limon suyu ve sıcak suyu ekleyin; ters tabakla bastırıp kısık ateşte 45 dakika pişirin.",
    ],
  },
  {
    title: "Barbunya Pilaki", cat: "zeytinyaglilar", cui: "turk", diff: "EASY", prep: 15, cook: 35, serv: 5, color: "#A85A3A",
    desc: "Havuç, patates ve sarımsakla zeytinyağında pişen barbunya; maydanozla soğuk servis.",
    tags: ["bitkisel", "soguk-servis", "ekonomik"],
    ing: [[2, "su bardağı", "barbunya", "haşlanmış"], [1, "adet", "havuc", "küp"], [1, "adet", "patates", "küp"], [1, "adet", "sogan"], [3, "diş", "sarimsak"], [1, "adet", "domates"], [0.5, "su bardağı", "zeytinyagi"], [1, "çay kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [1.5, "su bardağı", "su"], [0.5, "demet", "maydanoz", "", true]],
    steps: [
      "Soğan ve sarımsağı zeytinyağında 4 dakika kavurun.",
      "Havuç, patates ve domatesi ekleyip 3 dakika çevirin.",
      "Barbunya, şeker, tuz ve suyu ekleyin; kısık ateşte 25 dakika pişirin.",
      "Soğuduktan sonra maydanozla servis edin.",
    ],
  },

  // ================================================================ Salatalar
  {
    title: "Çoban Salatası", cat: "salatalar", cui: "turk", diff: "EASY", prep: 10, cook: 0, serv: 4, color: "#C9442E",
    desc: "Domates, salatalık, biber ve soğan; zeytinyağı ve limonla. Her sofranın sessiz kahramanı.",
    tags: ["klasik", "yaz", "bitkisel", "10-dakika"],
    ing: [[3, "adet", "domates"], [2, "adet", "salatalik"], [2, "adet", "yesil-biber"], [1, "adet", "kirmizi-sogan"], [0.5, "demet", "maydanoz"], [2, "yemek kaşığı", "zeytinyagi"], [2, "yemek kaşığı", "limon-suyu"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Tüm sebzeleri küçük küpler halinde doğrayın.",
      "Zeytinyağı, limon suyu ve tuzu ekleyip servisten hemen önce karıştırın.",
    ],
  },
  {
    title: "Gavurdağı Salatası", cat: "salatalar", cui: "turk", diff: "EASY", prep: 15, cook: 0, serv: 4, color: "#A3352B",
    desc: "İnce kıyılmış domates, ceviz ve nar ekşisiyle Gaziantep usulü, mezelik kıvamda bir salata.",
    tags: ["antep", "bitkisel"],
    ing: [[3, "adet", "domates"], [1, "adet", "kirmizi-sogan"], [2, "adet", "yesil-biber"], [0.5, "su bardağı", "ceviz"], [0.5, "demet", "maydanoz"], [2, "yemek kaşığı", "nar-eksisi"], [3, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "sumak"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Domates, soğan, biber ve maydanozu çok ince kıyın.",
      "Cevizi iri kırıp ekleyin.",
      "Nar ekşisi, zeytinyağı, sumak ve tuzla harmanlayıp 10 dakika dinlendirin.",
    ],
  },
  {
    title: "Kısır", cat: "salatalar", cui: "turk", diff: "EASY", prep: 25, cook: 0, serv: 6, color: "#B4622E",
    desc: "Salçalı ince bulgur, bol yeşillik ve nar ekşisi. Altın gününden piknik sepetine her yere yakışır.",
    tags: ["klasik", "bitkisel", "piknik"],
    ing: [[2, "su bardağı", "ince-bulgur"], [1.5, "su bardağı", "su", "kaynar"], [1, "yemek kaşığı", "domates-salcasi"], [1, "yemek kaşığı", "biber-salcasi"], [4, "dal", "yesil-sogan"], [1, "demet", "maydanoz"], [0.5, "demet", "taze-nane"], [3, "yemek kaşığı", "nar-eksisi"], [4, "yemek kaşığı", "zeytinyagi"], [1, "adet", "limon"], [1, "tatlı kaşığı", "tuz"], [1, "adet", "marul", "servis için", true]],
    steps: [
      "Bulguru kaynar suyla ıslatıp üzerini kapatarak 15 dakika şişmeye bırakın.",
      "Salçaları ekleyip elinizle iyice yoğurun.",
      "İnce kıyılmış yeşillikleri, nar ekşisi, zeytinyağı, limon ve tuzu ekleyip harmanlayın.",
      "Marul yapraklarıyla servis edin.",
    ],
  },
  {
    title: "Tavuklu Sezar Salata", cat: "salatalar", cui: "dunya", diff: "EASY", prep: 15, cook: 12, serv: 3, color: "#8FA04E",
    desc: "Izgara tavuk, çıtır kruton ve parmesanlı kremamsı sosla doyurucu bir öğle yemeği salatası.",
    tags: ["proteinli", "ogle-yemegi"],
    ing: [[300, "g", "tavuk-gogsu"], [1, "adet", "marul"], [2, "dilim", "ekmek", "kruton için"], [40, "g", "parmesan"], [3, "yemek kaşığı", "mayonez"], [1, "yemek kaşığı", "limon-suyu"], [1, "diş", "sarimsak"], [2, "yemek kaşığı", "zeytinyagi"], [1, "tutam", "tuz"]],
    steps: [
      "Tavuğu tuz ve zeytinyağıyla ızgara tavada her yüzü 5 dakika pişirin, dilimleyin.",
      "Ekmekleri küp doğrayıp tavada 3 dakika kıtırlaştırın.",
      "Mayonez, limon, sarımsak ve yarım parmesanla sosu hazırlayın.",
      "Marulu sosla harmanlayıp tavuk, kruton ve kalan parmesanla servis edin.",
    ],
  },
  {
    title: "Akdeniz Kinoa Salatası", cat: "salatalar", cui: "dunya", diff: "EASY", prep: 15, cook: 15, serv: 4, color: "#9AA65A",
    img: U("photo-1512621776951-a57141f2eefd"),
    desc: "Kinoa, salatalık, cherry domates ve zeytin; limonlu sosla taze ve tok tutan bir kase.",
    tags: ["bitkisel", "meal-prep"],
    ing: [[1, "su bardağı", "kinoa"], [1, "adet", "salatalik"], [12, "adet", "cherry-domates"], [0.5, "adet", "kirmizi-sogan"], [10, "adet", "zeytin"], [0.5, "demet", "maydanoz"], [2, "yemek kaşığı", "limon-suyu"], [3, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "tuz"], [2, "su bardağı", "su"]],
    steps: [
      "Kinoayı yıkayıp 2 su bardağı suyla 15 dakika haşlayın, soğutun.",
      "Sebzeleri doğrayıp kinoayla birleştirin.",
      "Limon, zeytinyağı ve tuzla harmanlayın.",
    ],
  },
  {
    title: "Ton Balıklı Salata", cat: "salatalar", cui: "dunya", diff: "EASY", prep: 10, cook: 0, serv: 2, color: "#6E8F5A",
    img: U("photo-1540189549336-e6e99c3679fe"),
    desc: "Konserve ton balığı, mısır ve bol yeşillikle 10 dakikada hazır proteinli salata.",
    tags: ["10-dakika", "proteinli"],
    ing: [[1, "kutu", "ton-baligi", "süzülmüş"], [0.5, "adet", "marul"], [0.5, "su bardağı", "misir"], [1, "adet", "domates"], [1, "adet", "salatalik"], [0.5, "adet", "kirmizi-sogan"], [1, "yemek kaşığı", "limon-suyu"], [2, "yemek kaşığı", "zeytinyagi"], [1, "tutam", "tuz"]],
    steps: [
      "Marulu doğrayın, sebzeleri küp kesin.",
      "Ton balığı ve mısırı ekleyin.",
      "Limon, zeytinyağı ve tuzla harmanlayıp servis edin.",
    ],
  },
  {
    title: "Yeşil Mercimek Salatası", cat: "salatalar", cui: "turk", diff: "EASY", prep: 10, cook: 25, serv: 4, color: "#7A6A3A",
    desc: "Haşlanmış yeşil mercimek, domates ve yeşil soğan; nar ekşili sosla doyurucu ve lifli.",
    tags: ["bitkisel", "lifli", "meal-prep"],
    ing: [[1, "su bardağı", "yesil-mercimek"], [2, "adet", "domates"], [3, "dal", "yesil-sogan"], [0.5, "demet", "maydanoz"], [2, "yemek kaşığı", "nar-eksisi"], [3, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "tuz"], [4, "su bardağı", "su"]],
    steps: [
      "Mercimeği dağılmadan, diri kalacak şekilde 25 dakika haşlayıp süzün.",
      "Doğranmış sebzeler ve yeşilliklerle birleştirin.",
      "Nar ekşisi, zeytinyağı, kimyon ve tuzla harmanlayın.",
    ],
  },

  // ================================================================ Makarnalar
  {
    title: "Fırın Makarna", cat: "makarnalar", cui: "turk", diff: "MEDIUM", prep: 15, cook: 40, serv: 6, color: "#E3B04B", featured: true,
    desc: "Beşamel soslu, üzeri kaşarla kızarmış, dilim dilim kesilen anne usulü fırın makarna.",
    tags: ["firin", "aile-sofrasi", "cocuklar-sever"],
    ing: [[500, "g", "penne"], [3, "su bardağı", "sut"], [3, "yemek kaşığı", "un"], [3, "yemek kaşığı", "tereyagi"], [2, "adet", "yumurta"], [150, "g", "kasar", "rendelenmiş"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "karabiber"]],
    steps: [
      "Makarnayı tuzlu suda 8 dakika, diri kalacak şekilde haşlayıp süzün.",
      "Tereyağında unu 2 dakika kavurun, sütü azar azar ekleyerek 5 dakika beşamel pişirin.",
      "Sos ılıyınca yumurtaları ve kaşarın yarısını ekleyin; makarnayla harmanlayın.",
      "Yağlanmış tepsiye yayın, kalan kaşarı serpip 180°C fırında 25 dakika pişirin.",
    ],
  },
  {
    title: "Spagetti Bolonez", cat: "makarnalar", cui: "italyan", diff: "EASY", prep: 15, cook: 35, serv: 4, color: "#A8392A",
    img: U("photo-1473093295043-cdd812d0e601"),
    desc: "Kıyma, domates ve sebzelerle ağır ateşte koyulaşan sos; İtalyan mutfağının dünyaya armağanı.",
    tags: ["italyan-klasigi", "aile-sofrasi"],
    ing: [[400, "g", "spagetti"], [300, "g", "kiyma"], [1, "adet", "sogan"], [2, "diş", "sarimsak"], [1, "adet", "havuc", "rendelenmiş"], [1, "kutu", "konserve-domates"], [1, "yemek kaşığı", "domates-salcasi"], [2, "yemek kaşığı", "zeytinyagi"], [1, "tatlı kaşığı", "tuz"], [5, "yaprak", "feslegen", "", true], [30, "g", "parmesan", "", true]],
    steps: [
      "Soğan, sarımsak ve havucu zeytinyağında 5 dakika kavurun.",
      "Kıymayı ekleyip 8 dakika pişirin; salça ve domatesi ilave edin.",
      "Kısık ateşte sos koyulaşana kadar 20 dakika pişirin.",
      "Spagettiyi 9 dakika haşlayıp sosla harmanlayın; fesleğen ve parmesanla servis edin.",
    ],
  },
  {
    title: "Penne Arrabbiata", cat: "makarnalar", cui: "italyan", diff: "EASY", prep: 5, cook: 20, serv: 4, color: "#C23B2B",
    desc: "Sarımsak, pul biber ve domatesin 'öfkeli' sosu. Dolaptaki birkaç malzemeyle 25 dakikada bitkisel bir makarna.",
    tags: ["bitkisel", "pratik", "ekonomik"],
    ing: [[400, "g", "penne"], [1, "kutu", "konserve-domates"], [3, "diş", "sarimsak", "ince dilimlenmiş"], [1, "tatlı kaşığı", "pul-biber"], [3, "yemek kaşığı", "zeytinyagi"], [1, "tatlı kaşığı", "tuz"], [2, "yemek kaşığı", "maydanoz", "", true]],
    steps: [
      "Sarımsak ve pul biberi zeytinyağında 1 dakika yakmadan çevirin.",
      "Domatesi ve tuzu ekleyip 12 dakika pişirin.",
      "Penneyi 10 dakika haşlayıp sosla harmanlayın, maydanozla servis edin.",
    ],
  },
  {
    title: "Cevizli Pesto Makarna", cat: "makarnalar", cui: "italyan", diff: "EASY", prep: 10, cook: 10, serv: 4, color: "#4E7A33",
    desc: "Bol fesleğen, ceviz ve parmesanla ev yapımı pesto; makarnanın en yeşil hali.",
    tags: ["vejetaryen", "20-dakika"],
    ing: [[400, "g", "spagetti"], [2, "demet", "feslegen"], [50, "g", "parmesan"], [0.5, "su bardağı", "ceviz"], [1, "diş", "sarimsak"], [0.5, "su bardağı", "zeytinyagi"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Fesleğen, ceviz, sarımsak, parmesan ve zeytinyağını robotta pesto kıvamına getirin.",
      "Makarnayı 9 dakika haşlayın; bir kepçe haşlama suyunu ayırın.",
      "Makarnayı pesto ve haşlama suyuyla harmanlayın.",
    ],
  },
  {
    title: "Kremalı Mantarlı Makarna", cat: "makarnalar", cui: "italyan", diff: "EASY", prep: 10, cook: 15, serv: 4, color: "#B89B72",
    desc: "Tereyağında kızaran mantarlar ve krema; 25 dakikada restoran tadında bir tabak.",
    tags: ["vejetaryen", "pratik"],
    ing: [[400, "g", "makarna", "fiyonk veya burgu"], [300, "g", "mantar"], [1, "paket", "krema"], [2, "diş", "sarimsak"], [2, "yemek kaşığı", "tereyagi"], [1, "tatlı kaşığı", "tuz"], [1, "çay kaşığı", "karabiber"], [30, "g", "parmesan", "", true]],
    steps: [
      "Mantarları tereyağında suyunu salıp çekene kadar 7 dakika soteleyin, sarımsağı ekleyin.",
      "Kremayı ekleyip 3 dakika kaynatın, baharatlayın.",
      "Haşlanmış makarnayı sosla harmanlayıp parmesanla servis edin.",
    ],
  },
  {
    title: "Mantı", cat: "makarnalar", cui: "turk", diff: "HARD", prep: 60, cook: 20, serv: 4, color: "#D7A85A",
    desc: "Minicik bohçalar, sarımsaklı yoğurt ve tereyağlı salça sosu. Kayseri usulü, sabır ve sevgiyle.",
    tags: ["klasik", "ozel-gun", "el-emegi"],
    tips: ["Hamuru en az 30 dakika dinlendirirseniz çok daha kolay açılır."],
    ing: [[3, "su bardağı", "un"], [1, "adet", "yumurta"], [0.75, "su bardağı", "su"], [1, "tatlı kaşığı", "tuz"], [250, "g", "kiyma"], [1, "adet", "sogan", "rendelenmiş"], [2, "su bardağı", "yogurt"], [2, "diş", "sarimsak"], [3, "yemek kaşığı", "tereyagi"], [1, "yemek kaşığı", "domates-salcasi"], [1, "çay kaşığı", "pul-biber"], [1, "çay kaşığı", "kuru-nane"]],
    steps: [
      "Un, yumurta, su ve tuzla sert bir hamur yoğurup 30 dakika dinlendirin.",
      "Kıyma, rendelenmiş soğan ve tuzu karıştırıp iç hazırlayın.",
      "Hamuru ince açıp 2 cm kareler kesin; her kareye iç koyup bohça yapın.",
      "Mantıları kaynar tuzlu suda 12 dakika haşlayın.",
      "Sarımsaklı yoğurt ve tereyağında kızdırılmış salça, pul biber ve naneyle servis edin.",
    ],
  },

  // ================================================================ Hamur işleri
  {
    title: "Peynirli Gözleme", cat: "hamur-isleri", cui: "turk", diff: "EASY", prep: 10, cook: 10, serv: 2, color: "#D9A659",
    desc: "Hazır yufkayla sacda değil tavada; beyaz peynir ve maydanozlu, kahvaltının ve çayın en iyi eşlikçisi.",
    tags: ["pratik", "cay-saati"],
    ing: [[2, "adet", "yufka"], [200, "g", "beyaz-peynir", "ufalanmış"], [0.5, "demet", "maydanoz"], [2, "yemek kaşığı", "tereyagi", "eritilmiş"]],
    steps: [
      "Yufkayı ikiye katlayıp ortasına peynir ve maydanoz yayın, zarf gibi kapatın.",
      "Tavada her yüzü 3 dakika kızarana kadar pişirin.",
      "Sıcakken üzerine tereyağı sürüp dilimleyin.",
    ],
  },
  {
    title: "Ispanaklı Börek", cat: "hamur-isleri", cui: "turk", diff: "MEDIUM", prep: 25, cook: 40, serv: 8, color: "#5E7F3A",
    desc: "Kat kat yufka, ıspanak ve beyaz peynir; fırından çıktığı an evi saran o koku.",
    tags: ["firin", "cay-saati", "misafir"],
    ing: [[3, "adet", "yufka"], [500, "g", "ispanak", "doğranmış"], [1, "adet", "sogan"], [150, "g", "beyaz-peynir"], [2, "adet", "yumurta"], [1, "su bardağı", "sut"], [0.5, "su bardağı", "sivi-yag"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Soğanı kavurun, ıspanağı ekleyip suyunu çekene kadar 5 dakika pişirin; peyniri karıştırın.",
      "Süt, yumurta ve yağı çırparak sos hazırlayın.",
      "Yufkaları sosla ıslatarak tepsiye katlayın, aralarına harcı yayın.",
      "180°C fırında üzeri kızarana kadar 35 dakika pişirin.",
    ],
  },
  {
    title: "Pişi", cat: "hamur-isleri", cui: "turk", diff: "MEDIUM", prep: 70, cook: 15, serv: 6, color: "#E6C27A",
    desc: "Mayalı hamurdan kızgın yağda kabaran pofuduk pişiler. Pazar kahvaltısının en sevilen misafiri.",
    tags: ["kahvalti", "bitkisel"],
    ing: [[4, "su bardağı", "un"], [1, "paket", "maya"], [1, "tatlı kaşığı", "seker"], [1, "tatlı kaşığı", "tuz"], [1.5, "su bardağı", "su", "ılık"], [0.5, "su bardağı", "sivi-yag", "kızartmak için"]],
    steps: [
      "Maya ve şekeri ılık suda eritin, un ve tuzla yumuşak bir hamur yoğurun.",
      "Üzerini örtüp 60 dakika mayalanmaya bırakın.",
      "Ceviz büyüklüğünde parçaları elinizle yassılaştırın.",
      "Kızgın yağda her yüzü 2 dakika kızartın.",
    ],
  },
  {
    title: "Lahmacun", cat: "hamur-isleri", cui: "turk", diff: "HARD", prep: 40, cook: 20, serv: 6, color: "#B8452C",
    desc: "İncecik açılmış hamur üzerinde baharatlı kıymalı harç; limon sıkıp maydanozla rulo yapmalık.",
    tags: ["klasik", "el-emegi"],
    ing: [[3, "su bardağı", "un"], [1, "su bardağı", "su", "ılık"], [1, "çay kaşığı", "tuz"], [300, "g", "kiyma"], [1, "adet", "sogan"], [2, "adet", "domates"], [1, "adet", "kapya-biber"], [2, "adet", "yesil-biber"], [0.5, "demet", "maydanoz"], [1, "yemek kaşığı", "domates-salcasi"], [1, "tatlı kaşığı", "pul-biber"], [1, "adet", "limon", "servis için", true]],
    steps: [
      "Un, su ve tuzla yumuşak hamur yoğurup 20 dakika dinlendirin.",
      "Sebzeleri robotta çekip kıyma, salça ve baharatlarla yoğurun.",
      "Hamuru bezelere ayırıp incecik açın, harcı ince bir tabaka halinde yayın.",
      "Fırının en sıcak ayarında (250°C) 7 dakika pişirin.",
    ],
  },
  {
    title: "Peynirli Poğaça", cat: "hamur-isleri", cui: "turk", diff: "MEDIUM", prep: 20, cook: 25, serv: 12, color: "#E0B25E",
    desc: "Yoğurtlu, yumuşacık hamur ve maydanozlu beyaz peynir içi; çay saatinin klasiği.",
    tags: ["cay-saati", "firin"],
    ing: [[4, "su bardağı", "un"], [1, "su bardağı", "yogurt"], [0.5, "su bardağı", "sivi-yag"], [2, "yemek kaşığı", "tereyagi"], [1, "adet", "yumurta"], [1, "paket", "kabartma-tozu"], [1, "tatlı kaşığı", "tuz"], [150, "g", "beyaz-peynir"], [0.5, "demet", "maydanoz"]],
    steps: [
      "Yoğurt, yağ, eritilmiş tereyağı, yumurta beyazı ve tuzu karıştırın.",
      "Un ve kabartma tozunu ekleyerek ele yapışmayan bir hamur yoğurun.",
      "Ceviz büyüklüğünde parçalara peynirli iç koyup kapatın; üzerine yumurta sarısı sürün.",
      "180°C fırında 25 dakika pişirin.",
    ],
  },

  // ================================================================ Tatlılar
  {
    title: "Fırın Sütlaç", cat: "tatlilar", cui: "turk", diff: "MEDIUM", prep: 10, cook: 45, serv: 6, color: "#EBD9B4", featured: true,
    desc: "Üzeri fırında karamelize olmuş, soğuk servis edilen kremamsı sütlaç. Muhallebicilerin baş tacı.",
    tags: ["klasik", "sutlu-tatli"],
    ing: [[5, "su bardağı", "sut"], [0.5, "su bardağı", "pirinc"], [1, "su bardağı", "seker"], [2, "yemek kaşığı", "pirinc-unu"], [1, "paket", "vanilin"], [1, "su bardağı", "su"], [1, "çay kaşığı", "tarcin", "", true]],
    steps: [
      "Pirinci suyla yumuşayana kadar 15 dakika haşlayın.",
      "Sütü ekleyip kaynatın; şekeri ilave edin.",
      "Pirinç ununu az sütle açıp tencereye ekleyin, karıştırarak 10 dakika pişirin; vanilini ekleyin.",
      "Güveçlere paylaştırıp fırının üst ızgarasında 15 dakika üzeri kızarana kadar pişirin.",
    ],
  },
  {
    title: "İrmik Helvası", cat: "tatlilar", cui: "turk", diff: "EASY", prep: 5, cook: 25, serv: 6, color: "#C9954B",
    desc: "Tereyağında sabırla kavrulan irmik ve sıcak şerbet; mis gibi kokan, sıcacık bir paylaşım tatlısı.",
    tags: ["klasik", "paylasimlik"],
    ing: [[2, "su bardağı", "irmik"], [125, "g", "tereyagi"], [2, "su bardağı", "sut"], [1, "su bardağı", "su"], [1.5, "su bardağı", "seker"], [2, "yemek kaşığı", "badem", "", true]],
    steps: [
      "Süt, su ve şekeri kaynatıp şerbeti hazırlayın.",
      "Tereyağında irmiği (ve bademi) kısık ateşte rengi dönene kadar 15 dakika kavurun.",
      "Sıcak şerbeti dikkatlice ekleyin, karıştırıp kapağı kapatın; 10 dakika demlendirin.",
    ],
  },
  {
    title: "Revani", cat: "tatlilar", cui: "turk", diff: "MEDIUM", prep: 15, cook: 35, serv: 12, color: "#E0A84A",
    desc: "İrmikli, yumuşacık kek ve limonlu şerbet; sıcak keke soğuk şerbet kuralıyla.",
    tags: ["serbetli", "misafir"],
    ing: [[4, "adet", "yumurta"], [1, "su bardağı", "seker"], [1, "su bardağı", "irmik"], [1, "su bardağı", "un"], [1, "su bardağı", "yogurt"], [1, "paket", "kabartma-tozu"], [2.5, "su bardağı", "seker", "şerbet için"], [3, "su bardağı", "su", "şerbet için"], [0.5, "adet", "limon"]],
    steps: [
      "Şerbet için şeker ve suyu 10 dakika kaynatın, limon suyunu ekleyip soğumaya bırakın.",
      "Yumurta ve şekeri köpük köpük çırpın; yoğurt, irmik, un ve kabartma tozunu ekleyin.",
      "Yağlanmış tepside 180°C fırında 30 dakika pişirin.",
      "Sıcak keke soğuk şerbeti dökün, şerbeti çekmesi için 1 saat bekletin.",
    ],
  },
  {
    title: "Çilekli Chia Puding", cat: "tatlilar", cui: "dunya", diff: "EASY", prep: 10, cook: 0, serv: 2, color: "#D45A6A",
    desc: "Badem sütünde şişen chia tohumları ve taze çilek. Pişirmesiz, bitkisel ve hafif bir tatlı.",
    tags: ["bitkisel", "pisirmesiz", "hafif"],
    tips: ["En az 4 saat, ideal olarak bir gece buzdolabında bekletin."],
    ing: [[4, "yemek kaşığı", "chia"], [1.5, "su bardağı", "badem-sutu"], [1, "su bardağı", "cilek"], [1, "tatlı kaşığı", "seker"], [0.5, "paket", "vanilin"]],
    steps: [
      "Chia, badem sütü, şeker ve vanilini karıştırıp 5 dakika bekletin, tekrar karıştırın.",
      "Kaplara paylaştırıp buzdolabında en az 4 saat bekletin.",
      "Doğranmış çileklerle servis edin.",
    ],
  },
  {
    title: "Fırında Tarçınlı Elma", cat: "tatlilar", cui: "dunya", diff: "EASY", prep: 10, cook: 30, serv: 4, color: "#B5652E",
    desc: "İçi cevizle doldurulup tarçınla fırınlanan elmalar; kışın en hafif tatlı kaçamağı.",
    tags: ["bitkisel", "hafif", "kis"],
    ing: [[4, "adet", "elma"], [0.5, "su bardağı", "ceviz"], [1, "tatlı kaşığı", "tarcin"], [2, "yemek kaşığı", "seker"], [2, "yemek kaşığı", "kuru-uzum"], [0.5, "su bardağı", "su"]],
    steps: [
      "Elmaların çekirdek yuvasını oyun.",
      "Ceviz, kuru üzüm, tarçın ve şekeri karıştırıp elmalara doldurun.",
      "Tepsiye su ekleyip 180°C fırında 30 dakika pişirin.",
    ],
  },
  {
    title: "Islak Brownie", cat: "tatlilar", cui: "dunya", diff: "EASY", prep: 15, cook: 25, serv: 12, color: "#4A2E22",
    desc: "Dışı çıtır, içi akışkan; bitter çikolata sevenler için yoğun bir brownie.",
    tags: ["cikolatali", "misafir"],
    tips: ["Fırından çıkarırken ortası hafif titriyorsa tam kıvamındadır; soğudukça toparlanır."],
    ing: [[150, "g", "bitter-cikolata"], [120, "g", "tereyagi"], [1, "su bardağı", "seker"], [3, "adet", "yumurta"], [0.5, "su bardağı", "un"], [2, "yemek kaşığı", "kakao"], [1, "tutam", "tuz"]],
    steps: [
      "Çikolata ve tereyağını benmari usulü eritin.",
      "Yumurta ve şekeri çırpıp çikolatalı karışıma ekleyin.",
      "Un, kakao ve tuzu ekleyip spatulayla karıştırın.",
      "Kalıba döküp 175°C fırında 25 dakika pişirin.",
    ],
  },
  {
    title: "Muzlu Yulaf Kurabiyesi", cat: "tatlilar", cui: "dunya", diff: "EASY", prep: 10, cook: 15, serv: 12, color: "#C49A5A",
    desc: "Sadece muz ve yulafla, şekersiz ve bitkisel; çocuk beslenme çantalarının kahramanı.",
    tags: ["bitkisel", "sekersiz", "cocuklar-sever"],
    ing: [[2, "adet", "muz", "olgun"], [1.5, "su bardağı", "yulaf"], [1, "çay kaşığı", "tarcin"], [2, "yemek kaşığı", "kuru-uzum"], [2, "yemek kaşığı", "ceviz", "", true]],
    steps: [
      "Muzları çatalla ezin, yulaf, tarçın ve kuru üzümü ekleyin.",
      "Kaşıkla yağlı kağıda yassı toplar halinde dizin.",
      "180°C fırında 15 dakika pişirin.",
    ],
  },

  // ================================================================ Atıştırmalıklar
  {
    title: "Humus", cat: "atistirmaliklar", cui: "orta-dogu", diff: "EASY", prep: 10, cook: 0, serv: 6, color: "#D8B97A",
    desc: "Nohut, tahin, limon ve sarımsakla ipeksi bir meze. Üzerine zeytinyağı ve pul biber şart.",
    tags: ["meze", "bitkisel", "pisirmesiz"],
    tips: ["Nohutları sıcakken çekerseniz humus çok daha pürüzsüz olur."],
    ing: [[2, "su bardağı", "haslanmis-nohut"], [3, "yemek kaşığı", "tahin"], [3, "yemek kaşığı", "limon-suyu"], [1, "diş", "sarimsak"], [1, "çay kaşığı", "kimyon"], [3, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "tuz"], [3, "yemek kaşığı", "su", "buzlu"]],
    steps: [
      "Nohut, tahin, limon, sarımsak, kimyon ve tuzu robota alın.",
      "Buzlu suyu azar azar ekleyerek 3 dakika pürüzsüz olana kadar çekin.",
      "Tabağa yayıp zeytinyağı gezdirin.",
    ],
  },
  {
    title: "Mercimek Köftesi", cat: "atistirmaliklar", cui: "turk", diff: "EASY", prep: 30, cook: 20, serv: 8, color: "#C8662F",
    desc: "Kırmızı mercimek ve ince bulgurla yoğrulan, marul yaprağında limonla servis edilen gün klasiği.",
    tags: ["klasik", "bitkisel", "altin-gunu"],
    ing: [[1, "su bardağı", "kirmizi-mercimek"], [1.5, "su bardağı", "ince-bulgur"], [3, "su bardağı", "su"], [1, "adet", "sogan"], [1, "yemek kaşığı", "domates-salcasi"], [1, "yemek kaşığı", "biber-salcasi"], [4, "dal", "yesil-sogan"], [1, "demet", "maydanoz"], [1, "çay kaşığı", "kimyon"], [1, "tatlı kaşığı", "pul-biber"], [4, "yemek kaşığı", "zeytinyagi"], [1, "tatlı kaşığı", "tuz"], [1, "adet", "marul", "servis için", true], [1, "adet", "limon", "servis için", true]],
    steps: [
      "Mercimeği suyla dağılana kadar 15 dakika haşlayın, sıcakken bulguru ekleyip kapağını kapatın; 15 dakika demlendirin.",
      "Soğanı zeytinyağında salçalarla 4 dakika kavurup karışıma ekleyin.",
      "Baharatlar ve kıyılmış yeşilliklerle iyice yoğurun.",
      "Avuç içinde sıkarak şekil verin; marul ve limonla servis edin.",
    ],
  },
  {
    title: "Sigara Böreği", cat: "atistirmaliklar", cui: "turk", diff: "EASY", prep: 20, cook: 15, serv: 6, color: "#E3B55E",
    desc: "Beyaz peynirli, maydanozlu ince rulolar; çıtır çıtır, çayın en iyi arkadaşı.",
    tags: ["cay-saati", "misafir"],
    ing: [[3, "adet", "yufka"], [200, "g", "beyaz-peynir"], [0.5, "demet", "maydanoz"], [0.5, "su bardağı", "sivi-yag", "kızartmak için"]],
    steps: [
      "Yufkaları 8 üçgen dilime kesin.",
      "Geniş uca peynirli harç koyup kenarları kıvırarak sigara gibi sarın; ucunu suyla yapıştırın.",
      "Kızgın yağda 3 dakika altın rengi olana kadar kızartın.",
    ],
  },
  {
    title: "Guacamole", cat: "atistirmaliklar", cui: "meksika", diff: "EASY", prep: 10, cook: 0, serv: 4, color: "#6F8F2F",
    desc: "Ezilmiş avokado, domates, kırmızı soğan ve limonla taze ve canlı bir Meksika sosu.",
    tags: ["meze", "bitkisel", "pisirmesiz"],
    ing: [[2, "adet", "avokado"], [1, "adet", "domates", "çekirdeği alınmış"], [0.5, "adet", "kirmizi-sogan"], [2, "yemek kaşığı", "limon-suyu"], [2, "yemek kaşığı", "kisnis"], [1, "çay kaşığı", "tuz"], [0.5, "adet", "aci-biber", "", true]],
    steps: [
      "Avokadoları çatalla iri parçalı ezin.",
      "İnce doğranmış domates, soğan ve kişnişi ekleyin.",
      "Limon suyu ve tuzla tatlandırıp hemen servis edin.",
    ],
  },
  {
    title: "Cacık", cat: "atistirmaliklar", cui: "turk", diff: "EASY", prep: 10, cook: 0, serv: 4, color: "#D3DDB8",
    desc: "Yoğurt, salatalık ve naneyle serinleten; pilavın, köftenin, mantının vazgeçilmezi.",
    tags: ["yaz", "pisirmesiz", "10-dakika"],
    ing: [[2, "su bardağı", "yogurt"], [2, "adet", "salatalik", "rendelenmiş"], [1, "diş", "sarimsak"], [1, "tatlı kaşığı", "kuru-nane"], [1, "yemek kaşığı", "zeytinyagi"], [0.5, "su bardağı", "su", "soğuk"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Yoğurdu su, sarımsak ve tuzla çırpın.",
      "Salatalıkları ekleyin; nane ve zeytinyağı gezdirerek servis edin.",
    ],
  },
  {
    title: "Fırında Baharatlı Nohut", cat: "atistirmaliklar", cui: "dunya", diff: "EASY", prep: 5, cook: 30, serv: 4, color: "#C07A35",
    desc: "Çıtır çıtır kavrulmuş, kimyonlu ve pul biberli nohut; cipse sağlıklı bir alternatif.",
    tags: ["bitkisel", "proteinli", "atistirmalik"],
    ing: [[2, "su bardağı", "haslanmis-nohut", "süzülüp kurulanmış"], [2, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "pul-biber"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Nohutları kurulayıp zeytinyağı ve baharatlarla harmanlayın.",
      "Tepsiye tek kat yayıp 200°C fırında 30 dakika, ara ara sallayarak kavurun.",
    ],
  },

  // ================================================================ İçecekler
  {
    title: "Köpüklü Ayran", cat: "icecekler", cui: "turk", diff: "EASY", prep: 3, cook: 0, serv: 2, color: "#E8EEDF",
    desc: "Yoğurt, soğuk su ve bir tutam tuz; blenderda köpürtülmüş ev ayranı.",
    tags: ["yaz", "5-dakika"],
    ing: [[1, "su bardağı", "yogurt"], [1, "su bardağı", "su", "buz gibi"], [1, "tutam", "tuz"]],
    steps: ["Tüm malzemeleri blenderda 1 dakika köpürene kadar çırpın ve hemen servis edin."],
  },
  {
    title: "Ev Yapımı Limonata", cat: "icecekler", cui: "turk", diff: "EASY", prep: 15, cook: 0, serv: 8, color: "#EBC93B",
    desc: "Limon kabuklarının şekerle bekletildiği, naneli ve buz gibi ev limonatası.",
    tags: ["yaz", "bitkisel"],
    ing: [[6, "adet", "limon"], [1, "su bardağı", "seker"], [7, "su bardağı", "su", "soğuk"], [3, "dal", "taze-nane", "", true]],
    steps: [
      "Limon kabuklarını rendeleyip şekerle ovalayarak 10 dakika bekletin.",
      "Limonların suyunu sıkıp şekerli karışıma ve suya ekleyin; şeker eriyene kadar karıştırın.",
      "Süzüp nane ve buzla servis edin.",
    ],
  },
  {
    title: "Yeşil Smoothie", cat: "icecekler", cui: "dunya", diff: "EASY", prep: 5, cook: 0, serv: 2, color: "#7FA34A",
    desc: "Ispanak, muz ve elmayla güne enerjik başlangıç; tadı yeşilinden çok daha tatlı.",
    tags: ["bitkisel", "5-dakika", "detoks"],
    ing: [[1, "su bardağı", "ispanak"], [1, "adet", "muz"], [1, "adet", "elma"], [1, "su bardağı", "badem-sutu"], [5, "g", "zencefil", "", true]],
    steps: ["Tüm malzemeleri blenderda 1 dakika pürüzsüz olana kadar çekin."],
  },
  {
    title: "Çilekli Muzlu Smoothie", cat: "icecekler", cui: "dunya", diff: "EASY", prep: 5, cook: 0, serv: 2, color: "#D9566A",
    desc: "Yoğurt, çilek ve muzla kremamsı, çocukların da bayıldığı pembe bir içecek.",
    tags: ["5-dakika", "cocuklar-sever"],
    ing: [[1, "su bardağı", "cilek"], [1, "adet", "muz"], [1, "su bardağı", "yogurt"], [0.5, "su bardağı", "sut"], [1, "tatlı kaşığı", "bal", "", true]],
    steps: ["Tüm malzemeleri blenderda 1 dakika çekip soğuk servis edin."],
  },

  // ================================================================ Bebek ve çocuk
  {
    title: "Sebzeli Bebek Çorbası", cat: "bebek-ve-cocuk", cui: "turk", diff: "EASY", prep: 10, cook: 25, serv: 4, color: "#E4A54E",
    desc: "Havuç, patates ve kabakla tuzsuz, yumuşacık bir püre çorba. Ek gıdaya geçen minikler için.",
    tags: ["bebek", "tuzsuz"],
    tips: ["1 yaş altı bebeklere tuz ve bal eklemeyin.", "Yeni bir sebzeyi tanıtırken 3 gün aynı sebzeyle devam edin."],
    ing: [[1, "adet", "havuc"], [1, "adet", "patates"], [0.5, "adet", "kabak"], [2, "yemek kaşığı", "pirinc"], [1, "tatlı kaşığı", "tereyagi"], [4, "su bardağı", "su"]],
    steps: [
      "Sebzeleri küçük doğrayıp pirinçle birlikte suda 25 dakika yumuşayana kadar pişirin.",
      "Blenderdan geçirin, tereyağını ekleyin; ılık servis edin.",
    ],
  },
  {
    title: "Mini Sebzeli Omlet Muffin", cat: "bebek-ve-cocuk", cui: "dunya", diff: "EASY", prep: 10, cook: 20, serv: 6, color: "#E9B640",
    desc: "Muffin kalıbında pişen, renkli sebzeli minik omletler. Elde yenir, beslenme çantasına sığar.",
    tags: ["cocuklar-sever", "beslenme-cantasi"],
    ing: [[4, "adet", "yumurta"], [0.5, "adet", "kabak", "rendelenmiş"], [1, "adet", "havuc", "rendelenmiş"], [50, "g", "kasar", "rendelenmiş"], [0.25, "su bardağı", "sut"], [1, "tutam", "tuz"]],
    steps: [
      "Yumurta ve sütü çırpın; sebzeleri ve kaşarı ekleyin.",
      "Yağlanmış muffin kalıbına paylaştırın.",
      "180°C fırında 20 dakika pişirin.",
    ],
  },
  {
    title: "Muzlu Süt", cat: "bebek-ve-cocuk", cui: "turk", diff: "EASY", prep: 3, cook: 0, serv: 2, color: "#F0D98A",
    desc: "Süt ve olgun muzla, şeker eklemeden tatlı; okul sonrası enerji deposu.",
    tags: ["cocuklar-sever", "5-dakika"],
    ing: [[2, "su bardağı", "sut"], [1, "adet", "muz"], [1, "tutam", "tarcin", "", true]],
    steps: ["Süt ve muzu blenderda 1 dakika çekin; isterseniz tarçın serpin."],
  },
  {
    title: "Fırında Tavuk Köftesi", cat: "bebek-ve-cocuk", cui: "turk", diff: "EASY", prep: 15, cook: 20, serv: 4, color: "#D69A4A",
    desc: "Rendelenmiş havuç ve kaşarla zenginleşen, kızartmasız, yumuşacık tavuk köfteleri.",
    tags: ["cocuklar-sever", "proteinli", "firin"],
    ing: [[400, "g", "tavuk-gogsu", "robotta çekilmiş"], [1, "adet", "havuc", "rendelenmiş"], [40, "g", "kasar", "rendelenmiş"], [1, "adet", "yumurta"], [3, "yemek kaşığı", "galeta-unu"], [1, "tutam", "tuz"]],
    steps: [
      "Tüm malzemeleri yoğurup küçük köfteler şekillendirin.",
      "Yağlı kağıt serili tepside 190°C fırında 20 dakika pişirin.",
    ],
  },

  // ================================================================ Fit tarifler
  {
    title: "Izgara Tavuklu Kinoa Bowl", cat: "fit-tarifler", cui: "dunya", diff: "EASY", prep: 15, cook: 20, serv: 2, color: "#7D9A4A", featured: true,
    img: U("photo-1546069901-ba9599a7e63c"),
    desc: "Izgara tavuk, kinoa, avokado ve taze sebzeler tek kasede; proteini yüksek, renkli bir öğün.",
    tags: ["proteinli", "meal-prep", "renkli"],
    ing: [[300, "g", "tavuk-gogsu"], [0.5, "su bardağı", "kinoa"], [0.5, "adet", "avokado"], [8, "adet", "cherry-domates"], [1, "adet", "salatalik"], [1, "avuç", "roka"], [1, "yemek kaşığı", "limon-suyu"], [1, "yemek kaşığı", "zeytinyagi"], [1, "çay kaşığı", "tuz"], [1, "su bardağı", "su"]],
    steps: [
      "Kinoayı suyla 15 dakika haşlayın.",
      "Tavuğu tuzlayıp ızgara tavada her yüzü 5 dakika pişirin, dilimleyin.",
      "Kaselere kinoa, sebzeler, avokado ve tavuğu yerleştirin; limon ve zeytinyağı gezdirin.",
    ],
  },
  {
    title: "Yulaflı Muzlu Pankek", cat: "fit-tarifler", cui: "dunya", diff: "EASY", prep: 5, cook: 10, serv: 2, color: "#D3A15A",
    img: U("photo-1567620905732-2d1ec7ab7445"),
    desc: "Un ve şeker yok; sadece muz, yumurta ve yulaf. Hafta sonu kahvaltısının fit yıldızı.",
    tags: ["sekersiz", "kahvalti"],
    ing: [[2, "adet", "yumurta"], [1, "adet", "muz"], [0.5, "su bardağı", "yulaf"], [1, "çay kaşığı", "tarcin"], [1, "çay kaşığı", "sivi-yag"], [0.5, "su bardağı", "yaban-mersini", "servis için", true]],
    steps: [
      "Tüm malzemeleri blenderda 30 saniye çekin.",
      "Yağlı tavaya kaşık kaşık döküp her yüzü 2 dakika pişirin.",
      "Yaban mersiniyle servis edin.",
    ],
  },
  {
    title: "Fırında Sebzeli Levrek", cat: "fit-tarifler", cui: "turk", diff: "EASY", prep: 10, cook: 25, serv: 2, color: "#5E8AA0",
    desc: "Kağıtta pişen levrek fileto, kabak ve biberle; buharında, hafif ve bol proteinli.",
    tags: ["firin", "omega-3", "proteinli"],
    ing: [[400, "g", "levrek", "fileto"], [1, "adet", "kabak"], [1, "adet", "kapya-biber"], [8, "adet", "cherry-domates"], [2, "yemek kaşığı", "zeytinyagi"], [1, "adet", "limon"], [1, "çay kaşığı", "kekik"], [2, "diş", "sarimsak"], [1, "çay kaşığı", "tuz"]],
    steps: [
      "Sebzeleri doğrayıp zeytinyağı, sarımsak ve kekikle harmanlayın.",
      "Yağlı kağıda sebzeleri, üzerine levrekleri yerleştirip limon dilimleriyle kapatın; paket yapın.",
      "200°C fırında 25 dakika pişirin.",
    ],
  },
  {
    title: "Fit Tavuk Dürüm", cat: "fit-tarifler", cui: "meksika", diff: "EASY", prep: 10, cook: 10, serv: 2, color: "#B9873E",
    desc: "Tam buğday lavaş, baharatlı tavuk ve yoğurt sosuyla; yolda bile yenebilen proteinli bir öğle yemeği.",
    tags: ["proteinli", "ogle-yemegi", "pratik"],
    ing: [[250, "g", "tavuk-gogsu", "şerit"], [2, "adet", "lavas", "tam buğday"], [4, "yaprak", "marul"], [1, "adet", "domates"], [3, "yemek kaşığı", "yogurt"], [1, "çay kaşığı", "pul-biber"], [1, "çay kaşığı", "kimyon"], [1, "çay kaşığı", "sivi-yag"], [1, "tutam", "tuz"]],
    steps: [
      "Tavuğu baharatlarla harmanlayıp az yağda 8 dakika pişirin.",
      "Lavaşlara yoğurt sürün; marul, domates ve tavuğu yerleştirin.",
      "Sıkıca sarıp ikiye kesin.",
    ],
  },
  {
    title: "Lorlu Yeşillikli Omlet", cat: "fit-tarifler", cui: "turk", diff: "EASY", prep: 5, cook: 6, serv: 1, color: "#7E9C55",
    desc: "Lor peyniri ve dereotuyla hafif ama tok tutan, yüksek proteinli bir kahvaltı omleti.",
    tags: ["proteinli", "kahvalti", "15-dakika"],
    ing: [[2, "adet", "yumurta"], [50, "g", "lor"], [2, "yemek kaşığı", "dereotu"], [1, "çay kaşığı", "zeytinyagi"], [1, "tutam", "karabiber"]],
    steps: [
      "Yumurtaları çırpın; lor ve dereotunu ekleyin.",
      "Zeytinyağlı tavada kısık ateşte 5 dakika pişirin.",
    ],
  },
];
