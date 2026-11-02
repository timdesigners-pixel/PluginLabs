/* Örnek proje: kaynaklar ve alıntılar uydurma ÖRNEKLERDİR (example.org/.com/.net adresleri, "Örnek:" başlıkları); gerçek bir yayına atıf değildir.
 * Amaç: ilk açılışta iddia–kaynak ilişkisini, kopya kaynağın bağımsız sayılmamasını, eksik etiketini ve çelişkiyi göstermek. */
(function (root) {
  const P = "Örnek: Uzaktan çalışma";
  const sources = [
    { id: "ornek-s1", type: "rapor", title: "Örnek: Uzaktan Çalışma Anketi 2025", url: "https://example.org/rapor/uzaktan-calisma-2025?utm_source=bulten", authors: "Örnek Araştırma Merkezi",
      publisher: "Örnek Araştırma Merkezi", published: "2025-04-10", accessed: "2026-10-28", project: P,
      quote: "Ankete katılan 1.200 çalışanın %62'si haftada en az iki gün evden çalıştığında odaklanma süresinin arttığını bildirdi. Aynı grupta toplantı sayısı ortalama %18 azaldı.",
      note: "Öz bildirime dayalı; nesnel ölçüm değil." },
    { id: "ornek-s2", type: "web", title: "Örnek: Anket sonuçları haberi", url: "https://www.example.com/haber/uzaktan-calisma-anketi#yorumlar", authors: "Deniz Yılmaz",
      publisher: "Örnek Haber", published: "2025-04-12", accessed: "2026-10-28", project: P,
      quote: "Ankete katılan 1.200 çalışanın %62'si haftada en az iki gün evden çalıştığında odaklanma süresinin arttığını bildirdi.",
      note: "Raporun haberi; yeni veri yok." },
    { id: "ornek-s3", type: "makale", title: "Örnek: Hibrit ekiplerde verimlilik ölçümü", url: "https://example.net/dergi/hibrit-verimlilik", authors: "Kaya, Elif; Demir, Can",
      publisher: "Örnek Çalışma Bilimleri Dergisi", published: "2024", accessed: "2026-10-29", project: P,
      quote: "Görev kayıtlarına dayalı ölçümde hibrit ekiplerin tamamlanan iş sayısı ofis ekiplerinden anlamlı biçimde farklı bulunmadı; ancak hibrit ekiplerde kesintisiz çalışma blokları daha uzundu.",
      note: "Nesnel veri (görev kayıtları)." },
    { id: "ornek-s4", type: "web", title: "Örnek: Ofise dönüş gerekçeleri", url: "https://example.com/blog/ofise-donus", authors: "Arda Şahin",
      publisher: "Örnek Yönetim Blogu", published: "2025-09-01", accessed: "2026-10-30", project: P,
      quote: "Görüştüğümüz yöneticilerin çoğu, uzaktan çalışmada yeni başlayanların öğrenme hızının düştüğünü gözlemlediklerini söyledi.",
      note: "Anekdot; örneklem belirtilmemiş." },
  ];
  const claims = [
    { id: "ornek-c1", project: P, text: "Evden çalışma, çalışanların odaklanma süresini artırır.",
      links: [
        { sourceId: "ornek-s1", relation: "destekler", quote: "%62'si haftada en az iki gün evden çalıştığında odaklanma süresinin arttığını bildirdi" },
        { sourceId: "ornek-s2", relation: "destekler", quote: "odaklanma süresinin arttığını bildirdi" },
        { sourceId: "ornek-s3", relation: "destekler", quote: "hibrit ekiplerde kesintisiz çalışma blokları daha uzundu" },
      ] },
    { id: "ornek-c2", project: P, text: "Uzaktan çalışma ekiplerin tamamlanan iş sayısını artırır.",
      links: [
        { sourceId: "ornek-s3", relation: "curutur", quote: "tamamlanan iş sayısı ofis ekiplerinden anlamlı biçimde farklı bulunmadı" },
        { sourceId: "ornek-s1", relation: "baglam", quote: "toplantı sayısı ortalama %18 azaldı" },
      ] },
    { id: "ornek-c3", project: P, text: "Uzaktan çalışma yeni başlayanların öğrenmesini yavaşlatır.", missing: true, missingNote: "Yalnız anekdot var; ölçüme dayalı kaynak aranıyor.",
      links: [{ sourceId: "ornek-s4", relation: "baglam", quote: "yeni başlayanların öğrenme hızının düştüğünü gözlemlediklerini söyledi" }] },
    { id: "ornek-c4", project: P, text: "Hibrit çalışma kira giderlerini yarıya indirir.", links: [] },
  ];
  const api = { project: P, sources, claims };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.STSample = api;
})(typeof self !== "undefined" ? self : this);
