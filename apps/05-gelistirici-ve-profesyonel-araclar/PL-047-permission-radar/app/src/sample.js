/* Permission Radar — örnek test eklentileri, sürüm yükseltme farkı ve doğruluk altın veri kümesi. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./core.js"));
  else root.PRSample = factory(root.PRCore);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  const SAMPLE_MANIFESTS = [
    {
      id: "ext-fiyat-takip",
      inspectedAt: "2026-11-05T10:00:00.000Z",
      manifest: {
        manifest_version: 3,
        name: "Fiyat Takip Asistanı",
        version: "1.2.0",
        description: "E-ticaret sitelerinde ürün fiyat değişimlerini gösterir.",
        permissions: ["storage", "activeTab", "notifications"],
        host_permissions: ["https://*.ornek-magaza.com/*"],
      },
      // Sürüm 1.3.0 güncellemesi: tüm sitelere erişim, çerezler ve bilinmeyen kapsam eklendi!
      updatedAt: "2026-11-06T14:30:00.000Z",
      updatedManifest: {
        manifest_version: 3,
        name: "Fiyat Takip Asistanı",
        version: "1.3.0",
        description: "E-ticaret sitelerinde ürün fiyat değişimlerini gösterir.",
        permissions: ["storage", "activeTab", "notifications", "cookies", "tabs", "experimentalPrivateTelemetry"],
        host_permissions: ["<all_urls>"],
      },
    },
    {
      id: "ext-odak-okuyucu",
      inspectedAt: "2026-11-06T09:15:00.000Z",
      manifest: {
        manifest_version: 3,
        name: "Odak Makale Okuyucu",
        version: "2.0.1",
        description: "Seçili makaleyi sade okuma görünümüne dönüştürür.",
        permissions: ["activeTab", "storage", "contextMenus"],
        optional_permissions: ["clipboardWrite"],
        host_permissions: [],
      },
    },
    {
      id: "ext-sekme-arsivleyici",
      inspectedAt: "2026-11-06T11:45:00.000Z",
      manifest: {
        manifest_version: 3,
        name: "Sekme Arşivleyici Pro",
        version: "0.9.4",
        description: "Açık sekmeleri gruplar ve yerel geçmişle senkronize eder.",
        permissions: ["tabs", "history", "bookmarks", "alarms", "customVendorBridge"],
        host_permissions: ["https://arsiv.ornek.org/*"],
      },
    },
  ];

  const GOLD_CHECKS = [
    {
      extId: "ext-fiyat-takip",
      checks: [
        { raw: "cookies", known: true, category: "oturum" },
        { raw: "<all_urls>", known: true, category: "alan_adi" },
        { raw: "experimentalPrivateTelemetry", known: false, category: "bilinmeyen" },
      ],
    },
    {
      extId: "ext-odak-okuyucu",
      checks: [
        { raw: "activeTab", known: true, category: "sekme" },
        { raw: "clipboardWrite", known: true, category: "sistem" },
      ],
    },
    {
      extId: "ext-sekme-arsivleyici",
      checks: [
        { raw: "history", known: true, category: "gizlilik" },
        { raw: "customVendorBridge", known: false, category: "bilinmeyen" },
      ],
    },
  ];

  function buildSampleInventory() {
    let list = [];
    for (const s of SAMPLE_MANIFESTS) {
      const r1 = C.upsertExtensionManifest(list, s.manifest, { id: s.id, inspectedAt: s.inspectedAt });
      list = r1.list;
      if (s.updatedManifest) {
        const r2 = C.upsertExtensionManifest(list, s.updatedManifest, { id: s.id, inspectedAt: s.updatedAt });
        list = r2.list;
      }
    }
    return list;
  }

  return { SAMPLE_MANIFESTS, GOLD_CHECKS, buildSampleInventory };
});
