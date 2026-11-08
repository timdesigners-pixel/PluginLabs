/* PL-006 Note Master — örnek not defteri (kaynaklı notlar, alıntılar, görevler ve bir gizli not). Tüm içerik kurgusaldır. */
"use strict";

const sampleNotes = [
  {
    id: "not-ornek-okuma",
    kind: "not",
    title: "Yerel öncelikli yazılım: veriyi kullanıcıda tutmak",
    body:
      "Okuma notu. Yerel öncelikli (local-first) yaklaşımda asıl kopya kullanıcının cihazındadır; bulut yalnız eşitleme ve yedek rolündedir. " +
      "Bu, çevrimdışı çalışmayı varsayılan yapar ve gecikmeyi ortadan kaldırır. Çakışma çözümü için CRDT gibi yapılar öneriliyor. " +
      "PluginLabs ürünlerinde de veri Windows kasasında (DPAPI) duruyor; Note Master için eşitleme ileride ayrı bir modül olmalı. " +
      "Takip: CRDT kütüphanelerini karşılaştır, Mind Palace not şemasıyla eşitleme alanlarını çıkar, çakışma senaryolarını test et. #okuma #mimari #local-first",
    quote:
      "Yerel öncelikli yazılımda verinin birincil kopyası kullanıcının kendi cihazında bulunur; sunucular yalnız eşitleme ve yedekleme için kullanılır.",
    sourceUrl: "https://ornek-dergi.example/makale/yerel-oncelikli-yazilim?utm_source=bulten",
    sourceTitle: "Örnek Dergi — Yerel öncelikli yazılım",
    tags: ["okuma"],
    createdAt: "2026-11-06T09:10:00.000Z",
  },
  {
    id: "not-ornek-toplanti",
    kind: "not",
    title: "Ürün toplantısı: hızlı not widget’ı",
    body:
      "Hızlı not penceresi her zaman üstte kalabilmeli; Ctrl+Shift+Space ile açılmalı. İlk not 60 saniyede alınabilmeli. " +
      "Etiketler diyez işaretiyle yazıldığında otomatik eklensin. #urun #toplanti",
    sourceTitle: "Haftalık ürün toplantısı (iç not)",
    createdAt: "2026-11-06T10:30:00.000Z",
  },
  {
    id: "gorev-ornek-1",
    kind: "gorev",
    title: "Markdown dışa aktarımında alıntı sınırını belirt",
    body: "Kısaltılan alıntıların sonunda açıklama satırı olsun. #urun",
    due: "2026-11-12",
    createdAt: "2026-11-06T11:00:00.000Z",
  },
  {
    id: "gorev-ornek-2",
    kind: "gorev",
    title: "Okuma listesindeki üç makaleyi etiketle",
    body: "#okuma",
    done: true,
    createdAt: "2026-11-05T16:00:00.000Z",
  },
  {
    id: "not-ornek-gizli",
    kind: "not",
    title: "Kişisel: sağlık randevusu notları",
    body:
      "Bu not gizli olarak işaretli; varsayılan ayarlarda MyMind'a gönderilmez. Randevu için hazırlanacak sorular listesi ve önceki tahlil sonuçlarının karşılaştırması. " +
      "Doktora sorulacaklar: ilaç saatleri, kontrol aralığı, egzersiz önerileri. İletişim: ornek.kisi@example.com, 0532 000 00 00. #kisisel",
    private: true,
    createdAt: "2026-11-04T08:00:00.000Z",
  },
];

module.exports = { sampleNotes };
