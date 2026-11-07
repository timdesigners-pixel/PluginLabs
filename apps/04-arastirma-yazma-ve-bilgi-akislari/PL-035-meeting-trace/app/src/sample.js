/* Meeting Trace — örnek toplantı (uydurma kişiler ve içerik; gerçek veri değildir) ve elle etiketlenmiş doğru görev satırları.
 * Etiketler Notion doğrulama ölçütünü (görev çıkarma kesinliği ≥ %90) uygulama içinde ölçmek içindir: "gold" dizisindeki satırlar
 * gerçekten bir görev içerir; diğer satırlarda görev yoktur. "Konuşmacı 3" bilerek genel etikettir (kimlik belirsiz) ve 00:05:58'deki
 * etiketsiz satır önceki konuşmacıya tahminle bağlanır. */
(function (root) {
  const SAMPLE = {
    title: "Ürün lansmanı haftalık toplantısı",
    date: "2026-11-04",
    source: "ornek-transkript.txt",
    participants: ["Can Arslan"],
    text: [
      "[00:00:05] Ayşe Demir: Herkese günaydın, lansman takvimini ve açık konuları konuşalım.",
      "[00:00:21] Mehmet Kaya: Günaydın. Ben geçen haftaki demo geri bildirimlerini topladım.",
      "[00:00:48] Ayşe Demir: Güzel. Önce tarih konusu: lansmanı 20 Kasım'a almayı önermiştim.",
      "[00:01:10] Zeynep Aksoy: Mağaza onayı için en az bir hafta gerekiyor, 20 Kasım bence uygun.",
      "[00:01:32] Ayşe Demir: Tamam, lansman tarihi 20 Kasım olarak kesinleşti.",
      "[00:01:55] Mehmet Kaya: Fiyatlandırma tarafında iki seçenek vardı, aylık ve yıllık.",
      "[00:02:20] Zeynep Aksoy: Yıllık planı %20 indirimle sunmaya karar verdik geçen sefer, onu koruyalım.",
      "[00:02:41] Ayşe Demir: Evet, yıllık planda %20 indirimle devam ediyoruz.",
      "[00:03:02] Ayşe Demir: Mehmet, demo geri bildirimlerini cuma gününe kadar özet olarak paylaşabilir misin?",
      "[00:03:15] Mehmet Kaya: Olur, cumaya kadar özeti hazırlayıp kanala göndereceğim.",
      "[00:03:40] Zeynep Aksoy: Mağaza açıklama metinlerini ben yazacağım, ekran görüntülerini de güncelleyeceğim.",
      "[00:04:05] Konuşmacı 3: Basın bülteni için de bir taslak lazım, ajansla konuşmamız gerekiyor.",
      "[00:04:30] Ayşe Demir: Ajansla iletişimi kim üstlenecek, henüz belli değil, sonra bakarız.",
      "[00:04:52] Mehmet Kaya: Bu arada geçen ay kampanya çok iyi geçmişti, dönüşüm oranı yüksekti.",
      "[00:05:15] Zeynep Aksoy: Destek ekibine yeni sürümün SSS sayfası lazım; bunun hazırlanması gerekiyor.",
      "[00:05:40] Ayşe Demir: Can'ın da haftaya salı güvenlik testini bitirmesi gerekiyor, ona ben haber vereceğim.",
      "[00:05:58] ve test sonucunu bir sonraki toplantıda paylaşırız.",
      "[00:06:20] Mehmet Kaya: Beta kullanıcılarına teşekkür e-postasını yarın göndereceğim, adres listesi mehmet.kaya@ornek.com'da.",
      "[00:06:45] Zeynep Aksoy: Hatırlatma: önceki sürümde ikon hatası vardı, düzeldi mi bilmiyorum.",
      "[00:07:05] Ayşe Demir: Aksiyon: Zeynep — ikon hatasını yeni derlemede kontrol et, 10.11'e kadar.",
      "[00:07:30] Mehmet Kaya: Toplantıyı uzatmayalım, bir sonraki toplantı aynı saatte olacak.",
      "[00:07:48] Ayşe Demir: Teşekkürler, iyi çalışmalar.",
    ].join("\n"),
    // Elle etiketli doğru görev satırları (satır kimlikleri ayrıştırma sırasına göre L1…).
    gold: ["L9", "L10", "L11", "L12", "L15", "L16", "L18", "L20"],
  };
  if (typeof module === "object" && module.exports) module.exports = SAMPLE;
  else root.MTSample = SAMPLE;
})(typeof self !== "undefined" ? self : this);
