/* Insight Table — örnek kaynaklar ve elle etiketlenmiş beklenen değerler (uydurma veriler; gerçek kişi/kurum yok).
 * Örnekler: Türkçe sayfa (çift başlık satırı, colspan/rowspan, TL, %, tarih, boş işareti, e-posta, formül benzeri hücre, gezinme listesi),
 * İngilizce sayfa (EN sayı ve ay/gün tarih biçimi, n/a, Yes/No, tanım listesi) ve tablolama programından kopyalanmış sekmeli metin (TR binlik/ondalık, telefon). */
(function (root) {
  "use strict";
  const BASE = "2026-11-08T10:00:00";
  const tr = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Hızlı şarj tarifeleri — Kasım 2026</title>
<style>td{padding:4px}</style><script>window.izle = function () { return "bu metin tabloya girmez"; };</script></head><body>
<nav><ul><li><a href="/">Ana sayfa</a></li><li><a href="/tarifeler">Tarifeler</a></li><li><a href="/iletisim">İletişim</a></li></ul></nav>
<h1>Elektrikli araç şarj tarifeleri</h1>
<p>Fiyatlar KDV dahildir. Kaynak: işletmecilerin duyuruları (örnek veri).</p>
<table class="tarife">
<caption>Şehir bazında hızlı şarj tarifeleri</caption>
<thead>
<tr><th rowspan="2">Şehir</th><th rowspan="2">İşletmeci</th><th colspan="2">Fiyat (kWh)</th><th rowspan="2">Değişim</th><th rowspan="2">Güncelleme</th><th rowspan="2">İstasyon<sup>[1]</sup></th><th rowspan="2">İletişim</th></tr>
<tr><th>AC</th><th>DC</th></tr>
</thead>
<tbody>
<tr><td rowspan="2">İstanbul</td><td>Volta&nbsp;Şarj</td><td>8,90 TL</td><td>12,40 TL</td><td>%4,5</td><td>03.11.2026</td><td>1.284</td><td>destek@volta-ornek.com</td></tr>
<tr><td>Kıvılcım Enerji</td><td>9,10 TL</td><td>12,75 TL</td><td>%-1,2</td><td>01.11.2026</td><td>876</td><td>bilgi@kivilcim-ornek.com</td></tr>
<tr><td>Ankara</td><td>Volta Şarj</td><td>8,70 TL</td><td>-</td><td>%0</td><td>28.10.2026</td><td>412</td><td>destek@volta-ornek.com</td></tr>
<tr><td>İzmir</td><td>Ege Akım</td><td>8,95 TL</td><td>13,20 TL</td><td>%2,25</td><td>5 Kasım 2026</td><td>2.031</td><td>iletisim@egeakim-ornek.com</td></tr>
<tr><td>Bursa</td><td>=HYPERLINK("http://kotu.example","Tıkla")</td><td>9,00 TL</td><td>12,90 TL</td><td>%1</td><td>02.11.2026</td><td></td><td>bursa@ornek-sarj.com</td></tr>
<tr><td>Antalya</td><td>Ege Akım</td><td>8,85 TL</td><td>bilinmiyor</td><td>%3,1</td><td>04.11.2026</td><td>655</td><td>iletisim@egeakim-ornek.com</td></tr>
</tbody></table>
<p><sup>[1]</sup> Kayıtlı soket sayısı.</p>
<h2>Kampanyalar</h2>
<table><tr><th>Kampanya</th><th>İndirim</th></tr><tr><td>Gece şarjı</td><td>%15</td></tr></table>
</body></html>`;
  const en = `<!doctype html><html lang="en"><head><title>Open model benchmarks</title></head><body>
<h2>Benchmark results</h2>
<table>
<tr><th>Model</th><th>Params (B)</th><th>Score</th><th>Released</th><th>License</th><th>Open weights</th></tr>
<tr><td>Atlas-7</td><td>7</td><td>1,204.5</td><td>Nov 3, 2026</td><td>Apache-2.0</td><td>Yes</td></tr>
<tr><td>Borealis-13</td><td>13</td><td>1,318.0</td><td>10/14/2026</td><td>MIT</td><td>Yes</td></tr>
<tr><td>Cirrus-34</td><td>34</td><td>1,402.25</td><td>09/30/2026</td><td>Proprietary</td><td>No</td></tr>
<tr><td>Delta-70</td><td>70</td><td>n/a</td><td>08/05/2026</td><td>Custom</td><td>No</td></tr>
</table>
<h2>Glossary</h2>
<dl><dt>Params</dt><dd>Number of parameters, in billions.</dd><dt>Score</dt><dd>Arena-style rating (example data).</dd><dt>Open weights</dt><dd>Whether the weights can be downloaded.</dd></dl>
</body></html>`;
  const tsv = [
    "Kalem\tOcak\tŞubat\tMart\tSorumlu\tTelefon",
    "Kira\t18.500,00\t18.500,00\t19.250,00\tAyşe K.\t0532 111 22 33",
    "Market\t6.420,35\t5.980,10\t-\tMert T.\t0541 222 33 44",
    "Ulaşım\t1.150\t1.240,50\t1.090,00\tAyşe K.\t0532 111 22 33",
    "+Ek gider\t300\t\t450\tMert T.\t0541 222 33 44",
  ].join("\n");
  const sources = [
    { key: "tarife", via: "ornek", title: "Hızlı şarj tarifeleri — Kasım 2026", url: "https://ornek.example/sarj-tarifeleri", html: tr },
    { key: "benchmark", via: "ornek", title: "Open model benchmarks", url: "https://ornek.example/benchmarks", html: en },
    { key: "butce", via: "ornek", title: "Ev bütçesi (tablolama kopyası)", text: tsv },
  ];
  // [veri satırı (0'dan), otomatik sütun adı, beklenen değer]
  const gold = [
    { key: "tarife", cells: [
      [0, "Şehir", "İstanbul"], [1, "Şehir", "İstanbul"], [2, "Şehir", "Ankara"], [5, "Şehir", "Antalya"],
      [0, "İşletmeci", "Volta Şarj"], [4, "İşletmeci", '=HYPERLINK("http://kotu.example","Tıkla")'],
      [0, "Fiyat (kWh) · AC", 8.9], [1, "Fiyat (kWh) · AC", 9.1], [3, "Fiyat (kWh) · AC", 8.95],
      [0, "Fiyat (kWh) · DC", 12.4], [1, "Fiyat (kWh) · DC", 12.75], [2, "Fiyat (kWh) · DC", null], [5, "Fiyat (kWh) · DC", null],
      [0, "Değişim", 4.5], [1, "Değişim", -1.2], [2, "Değişim", 0], [3, "Değişim", 2.25],
      [0, "Güncelleme", "2026-11-03"], [2, "Güncelleme", "2026-10-28"], [3, "Güncelleme", "2026-11-05"],
      [0, "İstasyon", 1284], [1, "İstasyon", 876], [3, "İstasyon", 2031], [4, "İstasyon", null],
      [0, "İletişim", "destek@volta-ornek.com"],
    ] },
    { key: "benchmark", cells: [
      [0, "Model", "Atlas-7"], [2, "Params (B)", 34], [0, "Score", 1204.5], [1, "Score", 1318], [2, "Score", 1402.25], [3, "Score", null],
      [0, "Released", "2026-11-03"], [1, "Released", "2026-10-14"], [3, "Released", "2026-08-05"], [0, "Open weights", true], [2, "Open weights", false],
    ] },
    { key: "butce", cells: [
      [0, "Kalem", "Kira"], [3, "Kalem", "+Ek gider"], [0, "Ocak", 18500], [1, "Ocak", 6420.35], [2, "Ocak", 1150], [3, "Ocak", 300],
      [1, "Şubat", 5980.1], [3, "Şubat", null], [1, "Mart", null], [2, "Mart", 1090], [0, "Telefon", "0532 111 22 33"],
    ] },
  ];
  const api = { BASE, sources, gold };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ITSample = api;
})(typeof self !== "undefined" ? self : this);
