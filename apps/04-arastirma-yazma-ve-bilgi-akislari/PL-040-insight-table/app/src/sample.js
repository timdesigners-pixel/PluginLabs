/* Insight Table — örnek sayfalar (uydurma veri) ve elle etiketlenmiş beklenen hücre değerleri (doğruluk ölçümü için).
 * Örnekler kasıtlı olarak zor durumlar içerir: iki satırlı başlık (colspan), rowspan, Türkçe sayı ve yüzde, dipnot işareti, gizli sıralama anahtarı,
 * yer tutucu (—), formül enjeksiyonu denemesi, kişisel veri (e-posta, telefon) sütunu, İngilizce para/tarih biçimi, liste ayracı ve gün/ay belirsizliği. */
(function (root) {
  const BASE = "2026-11-06T12:00:00";
  const pages = [
    {
      key: "kutuphane",
      url: "https://ornek.belediye.example/acik-veri/kutuphaneler",
      title: "İlçe kütüphaneleri — 2026 ilk çeyrek",
      format: "html",
      content: `<!doctype html><html lang="tr"><head><title>İlçe kütüphaneleri — 2026 ilk çeyrek</title><script>document.write("<table><tr><td>betik</td></tr></table>")</script></head><body>
<h2>Kütüphane kullanım istatistikleri</h2>
<table class="wikitable">
<caption>Tablo 1. İlçelere göre kütüphane kullanımı (Ocak–Mart 2026)</caption>
<thead>
<tr><th rowspan="2">İlçe</th><th rowspan="2">Kütüphane</th><th colspan="2">Ödünç</th><th rowspan="2">Doluluk</th><th rowspan="2">Açılış</th><th rowspan="2">İletişim</th><th rowspan="2">Not</th></tr>
<tr><th>Kitap</th><th>E-kitap</th></tr>
</thead>
<tbody>
<tr><td rowspan="2">Merkez</td><td>Atatürk İl Halk Kütüphanesi</td><td><span style="display:none">0012450</span>12.450</td><td>3.210</td><td>%78,5</td><td>12.03.1998</td><td>merkez.kutuphane@ornek.example</td><td>Yenilendi[1]</td></tr>
<tr><td>Çocuk Kütüphanesi</td><td>4.120</td><td>—</td><td>%91</td><td>01.09.2015</td><td>cocuk@ornek.example</td><td>=HYPERLINK("http://kotu.example","Tıkla")</td></tr>
<tr><td>Yeşilyurt</td><td>Semt Kütüphanesi</td><td>1.980</td><td>540</td><td>%43,25</td><td>15.06.2021</td><td>0 (312) 555 12 34</td><td></td></tr>
<tr><td>Kuzeykent</td><td>Gençlik Merkezi Kütüphanesi</td><td>865</td><td>1.105</td><td>%62</td><td>Haziran 2024</td><td>genclik@ornek.example</td><td>+ Yeni şube</td></tr>
<tr><td>Göl&shy;başı</td><td>Gölbaşı Kütüphanesi</td><td>2.004,5</td><td>98</td><td>%55,0</td><td>3 Nisan 2019</td><td>golbasi@ornek.example</td><td>Hafta sonu kapalı</td></tr>
</tbody>
<tfoot><tr><td colspan="2">Toplam</td><td>21.419,5</td><td>4.953</td><td></td><td></td><td></td><td></td></tr></tfoot>
</table>
<p>[1] 2025'te tadilat yapıldı.</p>
<h2>Bağlantılar</h2>
<ul><li><a href="/veri.csv">CSV indir</a></li><li><a href="/hakkinda">Hakkında</a></li></ul>
</body></html>`,
      gold: [
        [1, "İlçe", "Merkez"], [2, "İlçe", "Merkez"], [1, "Kütüphane", "Atatürk İl Halk Kütüphanesi"],
        [1, "Ödünç / Kitap", 12450], [2, "Ödünç / Kitap", 4120], [3, "Ödünç / Kitap", 1980], [4, "Ödünç / Kitap", 865], [5, "Ödünç / Kitap", 2004.5], [6, "Ödünç / Kitap", 21419.5],
        [1, "Ödünç / E-kitap", 3210], [2, "Ödünç / E-kitap", null], [4, "Ödünç / E-kitap", 1105],
        [1, "Doluluk", 78.5], [3, "Doluluk", 43.25], [5, "Doluluk", 55],
        [1, "Açılış", "1998-03-12"], [3, "Açılış", "2021-06-15"], [4, "Açılış", null], [5, "Açılış", "2019-04-03"],
        [5, "İlçe", "Gölbaşı"], [1, "Not", "Yenilendi[1]"], [2, "Not", "=HYPERLINK(\"http://kotu.example\",\"Tıkla\")"],
      ],
    },
    {
      key: "urunler",
      url: "https://shop.example.com/compare/headphones",
      title: "Headphone comparison",
      format: "html",
      content: `<html lang="en"><head><title>Headphone comparison</title></head><body>
<table>
<tr><th>Model</th><th>Price</th><th>Rating</th><th>Released</th><th>Wireless</th><th>Product page</th></tr>
<tr><td>Aria One</td><td>$1,299.00</td><td>4.5</td><td>Mar 3, 2026</td><td>Yes</td><td>https://shop.example.com/p/aria-one</td></tr>
<tr><td>Bolt Mini</td><td>$89.99</td><td>3.9</td><td>11/02/2025</td><td>No</td><td>https://shop.example.com/p/bolt-mini</td></tr>
<tr><td>Calm Pro</td><td>$349.50</td><td>N/A</td><td>January 15, 2026</td><td>Yes</td><td>www.shop.example.com/p/calm-pro</td></tr>
<tr><td>Drift &amp; Co</td><td>$1,050</td><td>4.8</td><td>2026-07-01</td><td>Yes</td><td></td></tr>
</table></body></html>`,
      gold: [
        [1, "Model", "Aria One"], [4, "Model", "Drift & Co"], [1, "Price", 1299], [2, "Price", 89.99], [3, "Price", 349.5], [4, "Price", 1050],
        [1, "Rating", 4.5], [3, "Rating", null], [1, "Released", "2026-03-03"], [2, "Released", "2025-11-02"], [3, "Released", "2026-01-15"], [4, "Released", "2026-07-01"],
        [1, "Wireless", true], [2, "Wireless", false], [1, "Product page", "https://shop.example.com/p/aria-one"], [3, "Product page", "https://www.shop.example.com/p/calm-pro"], [4, "Product page", null],
      ],
    },
    {
      key: "program",
      url: "",
      title: "Etkinlik programı (yapıştırılan liste)",
      format: "metin",
      content: "• 09:30 – Açılış konuşması\n• 10:15 – Açık veri atölyesi\n• 12:00 – Öğle arası\n• 13:30 – Panel: Yerel yönetimlerde veri\n• 15:00 – Kapanış",
      gold: [[1, "Sütun 1", "09:30"], [1, "Sütun 2", "Açılış konuşması"], [4, "Sütun 2", "Panel: Yerel yönetimlerde veri"], [5, "Sütun 1", "15:00"]],
    },
  ];
  const api = { BASE, pages, gold: pages.map((p) => ({ key: p.key, cells: p.gold })) };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ITSample = api;
})(typeof self !== "undefined" ? self : this);
