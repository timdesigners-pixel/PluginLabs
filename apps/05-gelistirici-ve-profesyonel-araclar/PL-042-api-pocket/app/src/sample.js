/* API Pocket — örnek veri. Uygulama içindeki örnek API (desktop/sample-server.js, yalnız 127.0.0.1) bu veriyi sunar.
 * Kitap, yazar ve yayınevi adları UYDURMADIR; gerçek bir hizmete bağlanılmaz. İlk doğru istek ölçüsü (≤ 2 dk) bu API ile ölçülür. */
(function (root) {
  "use strict";
  const books = [
    { id: 1, baslik: "Rüzgârın Sayfası", yazar_id: 1, yil: 2019, sayfa: 312, tur: "roman", stokta: true, puan: 4.4, etiketler: ["deniz", "aile"] },
    { id: 2, baslik: "Kırk Pencere", yazar_id: 2, yil: 2021, sayfa: 188, tur: "öykü", stokta: true, puan: 4.1, etiketler: ["şehir"] },
    { id: 3, baslik: "Saat Kulesindeki Kuş", yazar_id: 1, yil: 2023, sayfa: 254, tur: "roman", stokta: false, puan: 4.7, etiketler: ["gizem", "kasaba"] },
    { id: 4, baslik: "Haritasız Yolcular", yazar_id: 3, yil: 2018, sayfa: 402, tur: "deneme", stokta: true, puan: 3.9, etiketler: [] },
    { id: 5, baslik: "Mavi Defter", yazar_id: 2, yil: 2024, sayfa: 136, tur: "şiir", stokta: true, puan: null, etiketler: ["aşk"] },
    { id: 6, baslik: "Uzak Bir Mevsim", yazar_id: 3, yil: 2022, sayfa: 290, tur: "roman", stokta: true, puan: 4.0, etiketler: ["göç"] },
  ];
  const authors = [
    { id: 1, ad: "Deniz Arıkan", dogum: 1978, sehir: "İzmir" },
    { id: 2, ad: "Selin Okay", dogum: 1990, sehir: "Ankara" },
    { id: 3, ad: "Kerem Yalın", dogum: 1965, sehir: "Trabzon" },
  ];
  /** Örnek ortam: base_url çalışma anında örnek sunucunun adresiyle, api_key her başlatmada rastgele üretilir (gizli değişken). */
  const env = { name: "Örnek API (yerel)", production: false, sampleKey: "ornek" };
  const templates = [
    { key: "liste", name: "Kitap listesi", folder: "Örnek API", url: "{{base_url}}/v1/kitaplar", params: [{ k: "sayfa", v: "1" }, { k: "adet", v: "{{sayfa_boyu}}" }], headers: [{ k: "X-Api-Key", v: "{{api_key}}" }, { k: "Accept", v: "application/json" }], notes: "Sayfalı kitap listesi. X-Api-Key başlığı olmadan 401 döner.", doc: "" },
    { key: "tek", name: "Tek kitap", folder: "Örnek API", url: "{{base_url}}/v1/kitaplar/{{kitap_id}}", params: [], headers: [{ k: "X-Api-Key", v: "{{api_key}}" }], notes: "kitap_id ortam değişkeninden gelir.", doc: "" },
    { key: "yazar", name: "Yazar ara", folder: "Örnek API", url: "{{base_url}}/v1/yazarlar", params: [{ k: "ad", v: "Selin" }], headers: [{ k: "X-Api-Key", v: "{{api_key}}" }], notes: "Ada göre yazar arar (büyük/küçük harf duyarsız).", doc: "" },
    { key: "durum", name: "Sunucu durumu", folder: "Örnek API", url: "{{base_url}}/durum", params: [], headers: [], notes: "Anahtar istemez; düz metin döner.", doc: "" },
  ];
  const api = { books, authors, env, templates };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.APSample = api;
})(typeof self !== "undefined" ? self : this);
