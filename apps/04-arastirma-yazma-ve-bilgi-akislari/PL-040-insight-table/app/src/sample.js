/* Insight Table — örnek tablolar ve listeler (elle etiketli doğrulama verisi). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ITSample = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const samples = [
    {
      key: "fiyat-tablosu",
      title: "Tedarikçi Teklif Karşılaştırması (HTML Tablo)",
      sourceUrl: "https://tedarik-ornek.com/teklifler/2026-q4",
      sourceType: "html",
      text: `<table>
        <tr><th>Tedarikçi Adı</th><th>Birim Fiyat</th><th>Teslim Tarihi</th><th>Stokta Var mı</th><th>İletişim E-posta</th></tr>
        <tr><td>Anadolu Lojistik A.Ş.</td><td>1.450,75 TL</td><td>15.11.2026</td><td>Evet</td><td>teklif@anadolulojistik.com.tr</td></tr>
        <tr><td>Kuzey Kırtasiye Ltd.</td><td>890,00 TL</td><td>22 Kasım 2026</td><td>Hayır</td><td>satis@kuzeykirtasiye.com</td></tr>
        <tr><td>=HYPERLINK("http://zararli.ornek","Formül Enjeksiyonu")</td><td>bekleniyor</td><td>2026-11-30</td><td>Evet</td><td>—</td></tr>
      </table>`,
    },
    {
      key: "abonelik-md",
      title: "SaaS Araç Envanteri (Markdown Tablosu)",
      sourceUrl: "https://wiki-ornek.com/ekip/araclar",
      sourceType: "markdown",
      text: `| Araç | Aylık Maliyet | Yenileme Günü | Aktif | Sorumlu Telefon |
| --- | --- | --- | --- | --- |
| Bulut Depolama Pro | $49.90 | 01.12.2026 | true | 0532 411 22 33 |
| Kod Analiz Paketi | $120.00 | 14.12.2026 | true | - |
| Eski Arşiv Servisi | $15.00 | 2026-12-28 | false | 0544 822 10 90 |`,
    },
    {
      key: "urun-listesi",
      title: "Saha Denetim Notları (HTML Liste)",
      sourceUrl: "https://saha-ornek.com/denetim/ankara",
      sourceType: "liste",
      text: `<ul>
        <li>Şube: Çankaya Merkez | Denetim Puanı: 94,5 | Tarih: 05.11.2026 | Onay: Evet</li>
        <li>Şube: Ostim Depo | Denetim Puanı: 81,0 | Tarih: 06.11.2026 | Onay: Evet</li>
        <li>Şube: Sincan Şube | Denetim Puanı: — | Tarih: 07.11.2026 | Onay: Hayır</li>
      </ul>`,
    },
  ];
  return { samples };
});
