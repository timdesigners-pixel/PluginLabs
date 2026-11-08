/* API Pocket — örnek şablonlar ve ortam değişkenleri. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.APSample = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const defaultEnv = {
    BASE_URL: { name: "BASE_URL", secret: false, value: "http://127.0.0.1:47699", hasSecret: false },
    API_KEY: { name: "API_KEY", secret: true, value: "", hasSecret: true },
    PROJECT_ID: { name: "PROJECT_ID", secret: false, value: "pl-katalog-2026", hasSecret: false },
  };
  const sampleSecretValue = "sk-pocket-ornek-gizli-anahtar-998877";
  const templates = [
    {
      id: "req-servis-durumu",
      sampleKey: "servis-durumu",
      name: "Servis Durumu ve Kota Sorgusu (GET)",
      method: "GET",
      url: "{{BASE_URL}}/v1/projects/{{PROJECT_ID}}/status",
      docUrl: "https://gelistirici-ornek.com/docs/v1/status",
      headers: [
        { key: "Authorization", value: "Bearer {{API_KEY}}", enabled: true },
        { key: "Accept", value: "application/json", enabled: true },
      ],
      body: "",
      lastResponse: {
        status: 200,
        ok: true,
        durationMs: 14,
        isJson: true,
        pretty: JSON.stringify({
          id: "pl-katalog-2026",
          status: "healthy",
          rate_limit: 1200,
          created_at: "2026-11-07T09:00:00Z",
          items: [{ id: "node-1", is_active: true, total: 42 }],
        }, null, 2),
        fields: [
          { path: "id", type: "metin", sample: "pl-katalog-2026", explanation: "Kaydın benzersiz kimliği" },
          { path: "status", type: "metin", sample: "healthy", explanation: "İşlem veya kayıt durumu" },
          { path: "rate_limit", type: "sayı", sample: "1200", explanation: "İstek sınırı bilgisi" },
          { path: "created_at", type: "metin", sample: "2026-11-07T09:00:00Z", explanation: "Oluşturulma zaman damgası (ISO 8601)" },
          { path: "items", type: "dizi[1]", sample: "{\"id\":\"node-1\",\"is_active\":true,\"total\":42}", explanation: "Dönen kayıt listesi (dizi)" },
          { path: "items[0].id", type: "metin", sample: "node-1", explanation: "Kaydın benzersiz kimliği" },
          { path: "items[0].is_active", type: "mantıksal", sample: "true", explanation: "Mantıksal (doğru/yanlış) bayrak" },
          { path: "items[0].total", type: "sayı", sample: "42", explanation: "Toplam kayıt veya tutar" },
        ],
        headers: { "content-type": "application/json" },
        at: "2026-11-07T12:00:00Z",
      },
    },
    {
      id: "req-webhook-kayit",
      sampleKey: "webhook-kayit",
      name: "Yeni Webhook Kaydı Oluştur (POST — Yazma Önizlemeli)",
      method: "POST",
      url: "{{BASE_URL}}/v1/projects/{{PROJECT_ID}}/webhooks",
      docUrl: "https://gelistirici-ornek.com/docs/v1/webhooks",
      headers: [
        { key: "Authorization", value: "Bearer {{API_KEY}}", enabled: true },
        { key: "Content-Type", value: "application/json", enabled: true },
      ],
      body: JSON.stringify({ event: "release.published", target_url: "https://ornek.com/hook" }, null, 2),
      lastResponse: null,
    },
  ];
  return { defaultEnv, sampleSecretValue, templates };
});
