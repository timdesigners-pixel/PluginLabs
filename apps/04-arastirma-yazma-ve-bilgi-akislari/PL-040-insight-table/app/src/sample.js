/* Insight Table — örnek kaynaklar ve elle etiketli beklenen değerler (uydurma veriler; gerçek kişi, mağaza ya da kurum değildir).
 * Beklenen değer = JSON dışa aktarımındaki hücre değeri (kişisel veri işlemi kapalıyken): dönüşmüş sayı/tarih/evet-hayır, dönüşmeyen hücrede
 * kaynak metni, boş/boş işaretli hücrede null. Ölçüt (Notion kartı): kaynağa göre hücre doğruluğu ≥ %99. */
(function (root) {
  "use strict";
  const BASE = "2026-11-06T12:00:00";
  const sources = [
    {
      key: "fiyat",
      via: "ornek",
      url: "https://ornek-magaza.example/kampanya",
      title: "Kampanya fiyat listesi",
      html: `<h2>Kampanya</h2><table class="fiyat"><thead><tr><th>Ürün</th><th>Fiyat</th><th>İndirim</th><th>Stok</th><th>Güncelleme</th><th>Kargo bedava</th></tr></thead>
<tbody>
<tr><td>Kablosuz kulaklık</td><td>1.299,90 TL</td><td>%15</td><td>12</td><td>03.11.2026</td><td>Evet</td></tr>
<tr><td>Akıllı saat</td><td>2.450,00 TL</td><td>%7,5</td><td>0</td><td>04.11.2026</td><td>Hayır</td></tr>
<tr><td>Powerbank 10.000 mAh</td><td>649,50&nbsp;TL</td><td>—</td><td>35</td><td>4 Kasım 2026</td><td>Evet</td></tr>
<tr><td>USB-C kablo</td><td>$12.99</td><td>%5</td><td>120</td><td>05.11.2026</td><td>Evet</td></tr>
<tr><td>Tablet kılıfı</td><td>389,9O TL</td><td>%10</td><td>8</td><td>31.11.2026</td><td>Evet</td></tr>
<tr><td>Akıllı saat</td><td>2.450,00 TL</td><td>%7,5</td><td>0</td><td>04.11.2026</td><td>Hayır</td></tr>
</tbody></table>`,
      expect: [
        ["Kablosuz kulaklık", 1299.9, 15, 12, "2026-11-03", true],
        ["Akıllı saat", 2450, 7.5, 0, "2026-11-04", false],
        ["Powerbank 10.000 mAh", 649.5, null, 35, "2026-11-04", true],
        ["USB-C kablo", 12.99, 5, 120, "2026-11-05", true],
        ["Tablet kılıfı", "389,9O TL", 10, 8, "31.11.2026", true],
        ["Akıllı saat", 2450, 7.5, 0, "2026-11-04", false],
      ],
    },
    {
      key: "satis",
      via: "ornek",
      url: "https://example.com/reports/q3",
      title: "Q3 sales by region",
      html: `<table><caption>Q3 2026 sales by region</caption>
<thead><tr><th rowspan="2">Region</th><th colspan="2">Q3 2026</th><th rowspan="2">Growth</th></tr><tr><th>Revenue</th><th>Orders</th></tr></thead>
<tbody>
<tr><td>North</td><td>$1,204,500.50</td><td>3,412</td><td>4.5%</td></tr>
<tr><td>South</td><td>$987,000</td><td>2,980</td><td>&minus;1.2%</td></tr>
<tr><td>East</td><td>$1,050,250.75</td><td>N/A</td><td>2.0%</td></tr>
<tr><td>West</td><td>$ 640,100</td><td>1,876</td><td>12%</td></tr>
</tbody></table>`,
      expect: [
        ["North", 1204500.5, 3412, 4.5],
        ["South", 987000, 2980, -1.2],
        ["East", 1050250.75, null, 2],
        ["West", 640100, 1876, 12],
      ],
    },
    {
      key: "katilimci",
      via: "ornek",
      url: "https://etkinlik.example/atolye/katilimcilar",
      title: "Atölye katılımcıları",
      html: `<nav><ul><li>Anasayfa</li><li>Etkinlikler</li><li>İletişim</li></ul></nav>
<h3>Kayıtlı katılımcılar</h3>
<ul class="katilimci">
<li>Ad: Elif Kaya · E-posta: elif.kaya@example.com · Telefon: 0532 000 00 01 · Kayıt: 12.10.2026</li>
<li>Ad: Mert Arslan · E-posta: mert@example.org · Telefon: 0533 000 00 02 · Kayıt: 14.10.2026</li>
<li>Ad: Zeynep Uçar · E-posta: z.ucar@example.net · Telefon: 0534 000 00 03 · Kayıt: 15.10.2026</li>
<li>Ad: Can Öz · E-posta: — · Telefon: 0535 000 00 04 · Kayıt: 20.10.2026</li>
</ul>`,
      expect: [
        ["Elif Kaya", "elif.kaya@example.com", "0532 000 00 01", "2026-10-12"],
        ["Mert Arslan", "mert@example.org", "0533 000 00 02", "2026-10-14"],
        ["Zeynep Uçar", "z.ucar@example.net", "0534 000 00 03", "2026-10-15"],
        ["Can Öz", null, "0535 000 00 04", "2026-10-20"],
      ],
    },
    {
      key: "bagis",
      via: "ornek",
      url: "",
      title: "Bağış listesi (CSV)",
      text: "Tarih;Bağışçı;Tutar;Not\n01.11.2026;Anonim;150,00;=1+1\n02.11.2026;Deniz A.;1.200,50;-\n03.11.2026;Ece;75;@çağrı\n04.11.2026;Mert;2.000;+bonus\n",
      expect: [
        ["2026-11-01", "Anonim", 150, "=1+1"],
        ["2026-11-02", "Deniz A.", 1200.5, null],
        ["2026-11-03", "Ece", 75, "@çağrı"],
        ["2026-11-04", "Mert", 2000, "+bonus"],
      ],
    },
  ];
  const api = { BASE, sources, gold: sources.map((s) => ({ key: s.key, expect: s.expect })) };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ITSample = api;
})(typeof self !== "undefined" ? self : this);
