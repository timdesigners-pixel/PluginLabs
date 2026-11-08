/* Design Token Scout (PL-044) — örnek 5 sayfa / durum (computed style + CSS kesitleri).
 * Notion doğrulama ölçütü: "Örnek 5 sayfada kullanılan ana değerleri ≥%90 kapsama; token tekrarında düşüş." */
(function (root) {
  "use strict";
  const BASE = "2026-11-06T09:00:00.000Z";
  const pages = [
    {
      key: "p1",
      title: "1. Ana Gösterge Paneli (Dashboard — Computed Style JSON)",
      state: "varsayilan",
      url: "https://uygulama-ornek.com/panel",
      source: JSON.stringify([
        { selector: "body", styles: { backgroundColor: "#0e1322", color: "#f3f6fc", fontFamily: "'Inter', sans-serif", fontSize: "16px", lineHeight: "1.5" } },
        { selector: ".card", styles: { backgroundColor: "#151c30", padding: "16px", borderRadius: "12px", gap: "12px" } },
        { selector: ".btn-primary", styles: { backgroundColor: "#7c6cff", color: "#ffffff", fontSize: "14px", fontWeight: "600", padding: "8px 16px", borderRadius: "8px" } },
      ], null, 2),
    },
    {
      key: "p2",
      title: "2. Ayarlar ve Form Görünümü (Yakın Sapmalı Değerler — Kümeleme Testi)",
      state: "varsayilan",
      url: "https://uygulama-ornek.com/ayarlar",
      source: `
        .settings-shell { background-color: rgb(14, 19, 34); color: #f2f5fb; font-family: "Inter", system-ui; font-size: 1rem; line-height: 1.5; padding: 24px; }
        .form-card { background-color: #161d31; padding: 15px; border-radius: 12px; margin-bottom: 16px; }
        .form-label { color: #9aa4bf; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
        .btn-save { background-color: #7d6dff; color: #ffffff; padding: 8px 15px; border-radius: 8px; font-weight: 600; }
      `,
    },
    {
      key: "p3",
      title: "3. Veri Tablosu ve Rozetler (Durum Renkleri ve Monospace Yazı)",
      state: "varsayilan",
      url: "https://uygulama-ornek.com/kayitlar",
      source: `
        .table-wrap { background: #151c30; padding: 16px; border-radius: 12px; }
        .cell-code { font-family: "JetBrains Mono", monospace; font-size: 12px; color: #f3f6fc; }
        .badge-ok { color: #3ddc97; background-color: #151c30; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge-warn { color: #f4c45a; padding: 4px 8px; border-radius: 4px; }
        .badge-err { color: #ff6b6b; padding: 4px 8px; border-radius: 4px; }
      `,
    },
    {
      key: "p4",
      title: "4. Modal Pencere ve Başlık Hiyerarşisi",
      state: "modal-acik",
      url: "https://uygulama-ornek.com/panel#onay",
      source: `
        .modal-dialog { background-color: #151c30; color: #f3f6fc; padding: 24px; border-radius: 12px; gap: 16px; }
        .modal-title { font-family: Inter, sans-serif; font-size: 20px; font-weight: 700; line-height: 1.25; margin-bottom: 8px; }
        .modal-desc { color: #9ba5c0; font-size: 14px; line-height: 1.5; }
      `,
    },
    {
      key: "p5",
      title: "5. Etkileşim Durumları (Hover / Focus — Dinamik Durum Örneklemesi)",
      state: "hover-focus",
      url: "https://uygulama-ornek.com/panel#etkilesim",
      source: JSON.stringify([
        { selector: ".btn-primary:hover", styles: { backgroundColor: "#7c6cff", color: "#ffffff", padding: "8px 16px", borderRadius: "8px" } },
        { selector: ".input:focus", styles: { backgroundColor: "#0f1423", color: "#f3f6fc", padding: "8px 12px", borderRadius: "8px" } },
        { selector: ".status-pill", styles: { color: "#3ddc97", fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "4px" } },
      ], null, 2),
    },
  ];

  // 5 sayfada kullanılan ana tasarım sistemi değerleri (doğrulama ölçütü: ≥%90 kapsama)
  const goldCoreValues = [
    { category: "color", value: "#0e1322", label: "Ana zemin rengi" },
    { category: "color", value: "#151c30", label: "Kart / yüzey rengi" },
    { category: "color", value: "#f3f6fc", label: "Birincil metin rengi" },
    { category: "color", value: "#9aa4bf", label: "İkincil metin rengi" },
    { category: "color", value: "#7c6cff", label: "Marka vurgu rengi" },
    { category: "color", value: "#3ddc97", label: "Başarı rengi" },
    { category: "color", value: "#f4c45a", label: "Uyarı rengi" },
    { category: "color", value: "#ff6b6b", label: "Tehlike rengi" },
    { category: "typography", value: "Inter", label: "Ana yazı ailesi" },
    { category: "typography", value: "JetBrains Mono", label: "Kod yazı ailesi" },
    { category: "typography", value: "12px", label: "Küçük yazı boyutu" },
    { category: "typography", value: "14px", label: "Gösterge yazı boyutu" },
    { category: "typography", value: "16px", label: "Gövde yazı boyutu" },
    { category: "typography", value: "20px", label: "Başlık yazı boyutu" },
    { category: "spacing", value: "4px", label: "Boşluk 1 (4px)" },
    { category: "spacing", value: "8px", label: "Boşluk 2 (8px)" },
    { category: "spacing", value: "12px", label: "Boşluk 3 (12px)" },
    { category: "spacing", value: "16px", label: "Boşluk 4 (16px)" },
    { category: "spacing", value: "24px", label: "Boşluk 6 (24px)" },
    { category: "radius", value: "4px", label: "Küçük köşe yarıçapı" },
    { category: "radius", value: "8px", label: "Orta köşe yarıçapı" },
    { category: "radius", value: "12px", label: "Kart köşe yarıçapı" },
  ];

  const api = { BASE, pages, goldCoreValues };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DTSSample = api;
})(typeof self !== "undefined" ? self : this);
