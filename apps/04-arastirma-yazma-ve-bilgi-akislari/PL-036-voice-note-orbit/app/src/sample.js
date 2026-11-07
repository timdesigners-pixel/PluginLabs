/* Voice Note Orbit — elle etiketlenmiş tarih örnekleri (Notion ölçütü: görev tarihi doğru çıkarma ≥ %90) ve örnek notlar.
 * Kayıt günü 4 Kasım 2026 Çarşamba, saat 10:00. "ambiguous: true" olanlarda doğru davranış TEK tarih uydurmamak, kullanıcıya seçenek sunmaktır. */
(function (root) {
  const B = "2026-11-04", N = "10:00";
  const gold = [
    { text: "Yarın annemi aramayı unutma", date: "2026-11-05" },
    { text: "Bugün akşam faturayı öde", date: "2026-11-04", time: "19:00" },
    { text: "Cuma günü raporu Elif'e gönder", date: "2026-11-06" },
    { text: "Pazartesi saat 14:30'da diş randevusu", date: "2026-11-09", time: "14:30" },
    { text: "15 Kasım'a kadar vergi beyannamesini hazırla", date: "2026-11-15" },
    { text: "Öbür gün kargo gelecek, evde ol", date: "2026-11-06" },
    { text: "Haftaya salı sunumu bitir", date: "2026-11-10" },
    { text: "3 gün sonra kiralık arabayı teslim et", date: "2026-11-07" },
    { text: "Ay sonuna kadar aidatı yatır", date: "2026-11-30" },
    { text: "Saat 3'te Can'ı ara", ambiguous: true },
    { text: "Haftaya bankaya uğra", ambiguous: true },
    { text: "Hafta sonu çiçekleri sula", ambiguous: true },
    { text: "Çarşamba spor salonuna git", ambiguous: true },
    { text: "Yarın sabah 9'da toplantıya katıl", date: "2026-11-05", time: "09:00" },
    { text: "Perşembe akşam 8'de sinema biletini al", date: "2026-11-05", time: "20:00" },
    { text: "Ayın 20'sinde kira öde", date: "2026-11-20" },
    { text: "Ayın 2'sinde elektrik faturası", date: "2026-12-02" },
    { text: "Bu cuma kitap kulübü", date: "2026-11-06" },
    { text: "Saat 16:00'da veterinere götür", date: "2026-11-04", time: "16:00" },
    { text: "1 Aralık'ta sigorta yenilenecek, hatırlat", date: "2026-12-01" },
    { text: "Remind me to call the dentist tomorrow", date: "2026-11-05" },
    { text: "Send the invoice on Friday", date: "2026-11-06" },
    { text: "Meeting with Ali next Monday at 3pm", date: "2026-11-09", time: "15:00" },
    { text: "Pay rent on November 28", date: "2026-11-28" },
    { text: "Pick up groceries tonight", date: "2026-11-04", time: "20:00" },
    { text: "In 2 weeks renew the passport", date: "2026-11-18" },
    { text: "Call mom at 5", ambiguous: true },
    { text: "Ekmek ve süt al", date: "" },
    { text: "Kitap için yeni bir fikir: zaman yolculuğu yapan kedi", date: "" },
    { text: "Gelecek hafta perşembe proje teslimi", date: "2026-11-12" },
    { text: "Saat 8'de ilacını al", ambiguous: true },
    { text: "Yarın öğleden sonra 2'de kuaför", date: "2026-11-05", time: "14:00" },
    { text: "12.11.2026 tarihinde noter randevusu", date: "2026-11-12" },
    { text: "Bir hafta içinde abonelik iptali", date: "2026-11-11" },
    { text: "Yarın sabah 7 buçukta koşuya çık", date: "2026-11-05", time: "07:30" },
    { text: "Sabah 7'de koşuya çık", ambiguous: true, note: "07:00 bugün geçti: bugün mü yarın mı sorulur" },
    { text: "Cumartesi pazara git, sebze al", date: "2026-11-07" },
    { text: "Bu akşam Zeynep'e mesaj at", date: "2026-11-04", time: "19:00" },
    { text: "Yarından sonra arabayı yıkat", date: "2026-11-06" },
    { text: "10 Ocak'ta vize başvurusu", date: "2027-01-10" },
    { text: "Saat 9'da otobüs var", ambiguous: true },
  ].map((g) => ({ base: B, now: N, ...g }));
  const notes = [
    { text: "Yarın sabah 9'da Elif'le proje toplantısı var, sunumu hazırlamayı unutma.", day: B },
    { text: "Saat 3'te muhasebeciyi ara, fatura numarası TR12 0006 4000 0011 2345 6789 01 üzerine yatırıldı mı sor.", day: B },
    { text: "Kitap için yeni bir fikir: zaman yolculuğu yapan bir kedi ve onun kayıp saati.", day: B },
  ];
  const api = { base: B, now: N, gold, notes };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.VNSample = api;
})(typeof self !== "undefined" ? self : this);
