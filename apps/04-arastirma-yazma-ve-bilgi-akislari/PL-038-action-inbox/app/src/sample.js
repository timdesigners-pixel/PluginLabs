/* Action Inbox — örnek yakalamalar (uydurma; gerçek kişi/kurum değildir). Her yakalama bir kaynaktan seçilmiş metindir.
 * `gold`: elle etiketlenmiş beklenen sonuçlar (yakalama tarihi 6 Kasım 2026 Cuma kabul edilir) — aday bulma, fiil, son tarih ve
 * yineleme tespitinin örnek üzerinde ölçülmesi içindir. */
(function (root) {
  "use strict";
  const BASE = "2026-11-06T09:00:00";
  const captures = [
    { key: "c1", source: { type: "eposta", title: "Teklif revizyonu hakkında", url: "" },
      text: "Merhaba Elif Hanım, revize teklifi 13 Kasım'a kadar gönderebilir misiniz? Ek olarak güncel şartname.pdf dosyasını da inceleyip onayınızı iletirseniz seviniriz.\nİyi çalışmalar." },
    { key: "c2", source: { type: "sayfa", title: "Belediye — Kreş başvuru duyurusu", url: "https://belediye-ornek.gov.tr/duyuru/kres-basvuru" },
      text: "Başvurular 20.11.2026 tarihinde sona erecektir. Başvuru formunu doldurun ve kimlik fotokopisi ile ikametgâh belgesini sisteme yükleyin." },
    { key: "c3", source: { type: "mesaj", title: "Proje grubu (WhatsApp)", url: "" },
      text: "Yarınki toplantıdan önce:\n- [ ] Murat Bey bütçe tablosunu hazırlasın\n- [x] Toplantı odası ayrıldı\n- [ ] @deniz logo dosyalarını Drive'a yüklesin\n- [ ] Sunum slaytlarını gözden geçir\nCumaya kadar tamamlanmalı." },
    { key: "c4", source: { type: "eposta", title: "Kasım 2026 elektrik faturanız", url: "" },
      text: "Kasım 2026 dönemine ait 842,60 TL tutarındaki faturanızın son ödeme tarihi 18.11.2026'dır. Lütfen faturayı son ödeme tarihine kadar ödeyin." },
    { key: "c5", source: { type: "sayfa", title: "Kurs sayfası — Veri görselleştirme", url: "https://egitim-ornek.com/kurs/veri-gorsellestirme" },
      text: "Kursa katılmadan önce örnek veri setini indirip haftaya pazartesi gününe kadar ön anketi doldurmalısınız." },
    { key: "c6", source: { type: "eposta", title: "Re: Teklif revizyonu hakkında", url: "" },
      text: "Hatırlatma: revize teklifi 13 Kasım'a kadar göndermeniz gerekiyor." },
    { key: "c7", source: { type: "not", title: "Kişisel not", url: "" },
      text: "Arabanın sigorta poliçesini yenile, 2 gün içinde. Annemi ara." },
  ];
  // Beklenen sonuçlar (adayın yakalamadaki sırası `i`).
  const gold = [
    { key: "c1-0", verb: "gönder", due: "2026-11-13", dup: false },
    { key: "c1-1", verb: "incele", due: "2026-11-13", dup: false }, // "Ek olarak" — aynı istekteki son tarih
    { key: "c2-0", verb: "doldur", due: "2026-11-20", dup: false },
    { key: "c3-0", verb: "hazırla", due: "2026-11-13", dup: false },
    { key: "c3-1", verb: "yükle", due: "2026-11-13", dup: false },
    { key: "c3-2", verb: "gözden geçir", due: "2026-11-13", dup: false },
    { key: "c4-0", verb: "öde", due: "2026-11-18", dup: false },
    { key: "c5-0", verb: "doldur", due: "2026-11-16", dup: false },
    { key: "c6-0", verb: "gönder", due: "2026-11-13", dup: true },
    { key: "c7-0", verb: "yenile", due: "2026-11-08", dup: false },
    { key: "c7-1", verb: "ara", due: "", dup: false },
  ];
  const api = { BASE, captures, gold };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AXSample = api;
})(typeof self !== "undefined" ? self : this);
