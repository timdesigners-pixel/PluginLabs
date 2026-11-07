/* Meeting Trace — örnek toplantı (uydurma kişiler ve şirket; gerçek kişi verisi yok).
 * `labels`: elle etiketlenmiş karar ve görevler (satır = parseTranscript sonrası "uN" kimliği; sahip = konuşmacı adı ya da "belirsiz").
 * Bilerek konan zorluklar: "gelecek hafta" / "bakalım" / "olacak" gibi görev olmayan gelecek zamanlar, olumsuz cümle,
 * konuşmacı etiketi olmayan satır (tahmin), sahibi söylenmemiş görevler, istek + kabul, "kim yapacak?" + "ben". */
(function (root) {
  const title = "Ürün lansmanı haftalık toplantısı";
  const date = "2026-11-06";
  const text = [
    "[00:00:05] Ayşe Demir: Herkese merhaba, başlayalım. Bugün lansman takvimi, fiyatlandırma ve destek hazırlığını konuşacağız.",
    "[00:00:21] Mehmet Kaya: Merhaba. Benim tarafta tasarım ekranları neredeyse hazır.",
    "[00:00:40] Ayşe Demir: Gündem: lansman tarihi",
    "[00:00:46] Ayşe Demir: Geçen hafta iki seçenek konuşmuştuk, 20 Kasım ya da 27 Kasım.",
    "[00:01:10] Selin Arslan: Test tarafında 20 Kasım çok sıkışık olur, regresyon turu en az bir hafta sürecek.",
    "[00:01:32] Mehmet Kaya: Bence de 27 daha güvenli.",
    "[00:01:45] Ayşe Demir: Tamam, lansmanı 27 Kasım'a almaya karar verdik.",
    "[00:02:02] Selin Arslan: Regresyon test planını pazartesiye kadar paylaşacağım.",
    "[00:02:20] Ayşe Demir: Mehmet, son ekran tasarımlarını çarşambaya kadar gönderebilir misin?",
    "[00:02:28] Mehmet Kaya: Tamam, gönderirim.",
    "[00:02:40] Mehmet Kaya: Bir de mağaza görsellerinin boyutlarını kontrol etmemiz gerekiyor.",
    "[00:03:05] Ayşe Demir: Bakalım, o konu belki gelecek hafta netleşir.",
    "[00:03:20] Ayşe Demir: Sıradaki konu: fiyatlandırma",
    "[00:03:28] Can Yıldız: Rakiplerin aylık fiyatlarını çıkardım, ortalama 9 dolar civarında.",
    "[00:03:55] Can Yıldız: Ben fiyat karşılaştırma tablosunu yarın paylaşacağım.",
    "[00:04:15] Ayşe Demir: Aylık 7,99 dolar ile başlıyoruz, yıllık planda yüzde 20 indirim olacak.",
    "[00:04:30] Mehmet Kaya: Yıllık indirim bence de mantıklı.",
    "[00:04:44] Ayşe Demir: O zaman fiyatlandırmada bu şekilde ilerliyoruz.",
    "[00:05:02] Can Yıldız: Ücretsiz deneme süresi 14 gün olarak kalsın mı?",
    "[00:05:10] Ayşe Demir: Evet, 14 gün olarak kalsın.",
    "[00:05:30] Can Yıldız: Fiyat sayfasındaki metinleri Zeynep Hanım yazacak, kendisiyle konuştum.",
    "[00:06:00] Ayşe Demir: Sıradaki konu: destek hazırlığı",
    "[00:06:08] Selin Arslan: Sık sorulan sorular sayfası henüz yok.",
    "[00:06:20] Ayşe Demir: Peki SSS sayfasını kim hazırlayacak?",
    "[00:06:27] Can Yıldız: Ben hazırlarım, cumaya kadar taslak çıkar.",
    "[00:06:45] Selin Arslan: Destek e-posta şablonları da güncellenecek.",
    "[00:07:02] Mehmet Kaya: Eski şablonları silmeyeceğiz, arşivde dursun.",
    "[00:07:15] Ayşe Demir: Canlı destek için hafta sonu nöbet listesi çıkarmalıyız.",
    "[00:07:30] Selin Arslan: Nöbet listesini ben hazırlayayım.",
    "[00:07:41] Destek ekibine de duyuru yaparım, bugün öğleden sonra.",
    "[00:08:00] Ayşe Demir: Bir de basın bültenini ajansa göndermek lazım.",
    "[00:08:12] Mehmet Kaya: Ajans geçen sefer geç dönmüştü, bu sefer erken iletelim.",
    "[00:08:30] Ayşe Demir: Bülteni ajansa ben iletirim, Mehmet sen de logoyu ajansa gönderecek misin?",
    "[00:08:42] Mehmet Kaya: Olur, logoyu bugün gönderirim.",
    "[00:09:00] Ayşe Demir: Özetle: lansman 27 Kasım, fiyat aylık 7,99 dolar, deneme 14 gün. Herkese teşekkürler.",
    "[00:09:10] Can Yıldız: Teşekkürler, görüşürüz.",
  ].join("\n");

  // Elle etiketler (satır numarası = yukarıdaki sıra, u1'den başlar).
  const labels = [
    { kind: "karar", ref: "u7" },
    { kind: "karar", ref: "u16" },
    { kind: "karar", ref: "u18" },
    { kind: "karar", ref: "u20" },
    { kind: "gorev", ref: "u8", owner: "Selin Arslan" },
    { kind: "gorev", ref: "u9", owner: "Mehmet Kaya" },
    { kind: "gorev", ref: "u11", owner: "belirsiz" },
    { kind: "gorev", ref: "u15", owner: "Can Yıldız" },
    { kind: "gorev", ref: "u21", owner: "Zeynep" },
    { kind: "gorev", ref: "u24", owner: "Can Yıldız" },
    { kind: "gorev", ref: "u26", owner: "belirsiz" },
    { kind: "gorev", ref: "u28", owner: "belirsiz" },
    { kind: "gorev", ref: "u29", owner: "Selin Arslan" },
    { kind: "gorev", ref: "u30", owner: "Selin Arslan" },
    { kind: "gorev", ref: "u31", owner: "belirsiz" },
    { kind: "gorev", ref: "u33", owner: "Ayşe Demir" },
    { kind: "gorev", ref: "u33", owner: "Mehmet Kaya" },
  ];
  const api = { title, date, text, labels, fileName: "lansman-toplantisi.txt" };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MTSample = api;
})(typeof self !== "undefined" ? self : this);
