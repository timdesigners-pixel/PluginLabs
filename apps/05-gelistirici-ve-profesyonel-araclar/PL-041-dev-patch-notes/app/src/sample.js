/* Dev Patch Notes — örnek git log ve diff verileri. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DPNSample = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const samples = [
    {
      key: "v1-4-0",
      version: "v1.4.0",
      title: "PluginLabs Masaüstü Senkronizasyon Paketi",
      repoUrl: "https://github.com/ornek-ekip/senkron-araci",
      releaseDate: "2026-11-07",
      text: `commit a1b2c3d4e5f60718293a4b5c6d7e8f9012345678
Author: Deniz Kaya <deniz@ornek.com>
Date:   2026-11-05 14:20:00 +0300

    feat(disa-aktarma): Toplu CSV ve JSON dışa aktarma penceresi eklendi

commit b2c3d4e5f60718293a4b5c6d7e8f901234567891
Author: Murat Demir <murat@ornek.com>
Date:   2026-11-05 16:45:00 +0300

    fix(oturum): Ağ koptuğunda yeniden bağlanma döngüsündeki çökme düzeltildi

commit c3d4e5f60718293a4b5c6d7e8f90123456789123
Author: Deniz Kaya <deniz@ornek.com>
Date:   2026-11-06 10:15:00 +0300

    sec(kasa): Yedekleme anahtarı kontrolü sıkılaştırıldı (örnek sızıntı testi: sk-proj1234567890abcdefghij)

commit d4e5f60718293a4b5c6d7e8f9012345678912345
Author: Murat Demir <murat@ornek.com>
Date:   2026-11-06 15:00:00 +0300

    feat(api)!: Eski v1 kimlik doğrulama başlığı kaldırıldı; tüm testler geçti ve performansta %80 artış sağlandı

commit e5f60718293a4b5c6d7e8f901234567891234567
Author: Ayşe Yılmaz <ayse@ornek.com>
Date:   2026-11-07 09:30:00 +0300

    docs(kurulum): Windows taşınabilir paket doğrulama adımları güncellendi`,
    },
  ];
  return { samples };
});
