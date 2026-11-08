/* Offline Aid — örnek çevrimdışı metin görevleri. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./core.js"));
  else root.OASample = factory(root.OACore);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  const SAMPLE_INPUTS = [
    {
      id: "offline-01",
      title: "Saha denetimi bağlantı kesintisi tutanağı özeti",
      mode: "ozet",
      text: "Trafo merkezi saha denetiminde dış ağ bağlantısı güvenlik politikası gereği kapalı tutulmuştur. Yedek jeneratör soğutma pompası basıncı 2.4 bar olarak ölçülmüş ve kritik eşik içinde kalmıştır. Karar olarak B blok kesicilerinin cuma gününe kadar yenilenmesi ve test tutanağının yerel kasada saklanması kararlaştırılmıştır.",
      createdAt: "2026-11-06T09:30:00.000Z",
    },
    {
      id: "offline-02",
      title: "Sözleşme gizlilik maddelerinden eylem listesi çıkarma",
      mode: "eylem",
      text: "Denetim öncesi yapılacaklar: Veri işleme envanterini çarşamba sabahına kadar güncelle. İletişim kişisi ali.yilmaz@ornek-kurum.com adresine imzalı onay formunu gönder. Sunucu erişim anahtarlarını yerel donanım kasasında doğrula.",
      createdAt: "2026-11-06T10:15:00.000Z",
    },
    {
      id: "offline-03",
      title: "Teknik arıza notunu sadeleştirme ve düzenleme",
      mode: "duzenleme",
      text: "Şey aslında bakarsanız saha cihazında hani bir nevi bellek sızıntısı tespit edildi. Güncelleme paketi yerel USB bellek üzerinden doğrulandı ve servis yeniden başlatıldı.",
      createdAt: "2026-11-06T11:00:00.000Z",
    },
  ];

  function buildSampleTasks(hwInfo) {
    return SAMPLE_INPUTS.map((s) => {
      const masked = C.maskSensitiveText(s.text);
      const r = C.runRuleBasedTask(masked.text, s.mode);
      return C.buildTaskRecord({
        id: s.id,
        title: s.title,
        mode: s.mode,
        inputText: s.text,
        outputText: r.output,
        modelId: "modelsiz:kural-tabanli",
        latencyMs: r.latencyMs,
        hwSnapshot: hwInfo,
        maskedCount: masked.maskedCount,
        createdAt: s.createdAt,
      });
    });
  }

  return { SAMPLE_INPUTS, buildSampleTasks };
});
