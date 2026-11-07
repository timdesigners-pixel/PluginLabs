/* Örnek veri (uydurma; gerçek kişi/kurum yok). Notion'a bağlanmadan denemek için örnek bir "Okuma listesi" veritabanı şeması ve
 * elle etiketlenmiş örnek içerikler. Etiketler (gold) kural tabanlı eşlemenin doğruluğunu ve "uydurma alan yok" ilkesini ölçer:
 * null = alan BOŞ kalmalı (belirsiz ya da metinde yok). */
(function (root) {
  const BASE = "2026-11-06T12:00:00";
  const schema = {
    id: "0f1e2d3c4b5a69788796a5b4c3d2e1f0",
    title: "Okuma listesi (örnek)",
    url: "",
    source: "ornek",
    properties: [
      { name: "Ad", type: "title" },
      { name: "Bağlantı", type: "url" },
      { name: "Yazar", type: "rich_text" },
      { name: "Tür", type: "select", options: ["Makale", "Video", "Kitap", "Podcast"] },
      { name: "Etiketler", type: "multi_select", options: ["Tasarım", "Yapay zekâ", "Verimlilik", "İş", "Sağlık"] },
      { name: "Durum", type: "status", options: ["Okunacak", "Okunuyor", "Bitti"] },
      { name: "Tarih", type: "date" },
      { name: "Puan", type: "number" },
      { name: "Önemli", type: "checkbox" },
      { name: "Not", type: "rich_text" },
      { name: "Sahip", type: "people" },
      { name: "Oluşturulma", type: "created_time" },
    ],
  };
  const captures = [
    {
      key: "o1",
      source: { url: "https://ornek-dergi.com/yazilar/tasarim-sistemleri", title: "Tasarım sistemleri nasıl ölçeklenir?" },
      text: "Tasarım sistemleri nasıl ölçeklenir?\nYazar: Deniz Arıkan\nTür: Makale\nBileşen kitaplığı, token yönetimi ve ekip sahipliği üzerine uzun bir yazı. #tasarım #verimlilik\nCumartesi okunacak.",
    },
    {
      key: "o2",
      source: { url: "", title: "" },
      text: "Yapay zekâ ile toplantı özetleri — konuşma kaydı\nBağlantı: https://video-ornek.net/izle/ai-ozet\nVideo, 42 dakika.\nPuan: 4,5\nÖnemli: evet\n12 Kasım 2026 tarihinde izlendi.\nDurum: Bitti\nKonuşmacı: Selin Ak\nEtiketler: Yapay zekâ, İş, #pazarlama",
    },
    {
      key: "o3",
      source: { url: "https://kitap-ornek.org/derin-calisma", title: "" },
      text: "Derin Çalışma notları\nKitap mı podcast mi olduğunu henüz bilmiyorum, iki versiyonu da var.\nSağlık ve odak üzerine bölümler.\nÖncelik: yüksek",
    },
  ];
  // _free: içeriği serbest olan alanlar (ör. kalan metnin yazıldığı Not) doğrulukta sayılmaz ama "uydurma" da sayılmaz.
  const gold = {
    _free: ["Not"],
    "o1-0": { Ad: "Tasarım sistemleri nasıl ölçeklenir?", "Bağlantı": "https://ornek-dergi.com/yazilar/tasarim-sistemleri", Yazar: "Deniz Arıkan", "Tür": "Makale", Etiketler: ["Tasarım", "Verimlilik"], Durum: "Okunacak", Tarih: null, Puan: null, "Önemli": null },
    "o2-0": { Ad: "Yapay zekâ ile toplantı özetleri — konuşma kaydı", "Bağlantı": "https://video-ornek.net/izle/ai-ozet", "Tür": "Video", Etiketler: ["Yapay zekâ", "İş"], Durum: "Bitti", Tarih: "2026-11-12", Puan: 4.5, "Önemli": true, Yazar: null },
    "o3-0": { Ad: "Derin Çalışma notları", "Bağlantı": "https://kitap-ornek.org/derin-calisma", "Tür": null, Etiketler: ["Sağlık"], Durum: null, Tarih: null, Puan: null, "Önemli": null, Yazar: null },
  };
  const api = { BASE, schema, captures, gold };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NBSample = api;
})(typeof self !== "undefined" ? self : this);
