/* Model Switchboard — başlangıç kataloğu ve örnek kayıtlar.
 * • Katalogdaki fiyatlar ÖRNEKTİR ve "doğrulanmadı" işaretlidir: ilk kullanımda sağlayıcının resmi fiyat sayfasından doğrulayıp tarihini
 *   girin. Model adları da sağlayıcıya göre değişebilir; Modeller bölümünden düzenlenir.
 * • Örnek kayıtlar UYDURMADIR (gerçek API çağrısı değildir): öneri ekranını anahtar olmadan göstermek içindir; harcamaya ve ölçülere girmez. */
(function (root) {
  "use strict";
  const BASE = "2026-11-06T10:00:00.000Z";
  const catalog = [
    { id: "oa-mini", provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini", inPrice: 0.15, outPrice: 0.6, priceSource: "https://openai.com/api/pricing/", note: "Örnek fiyat — doğrulayın" },
    { id: "oa-41", provider: "openai", model: "gpt-4.1", label: "GPT-4.1", inPrice: 2, outPrice: 8, priceSource: "https://openai.com/api/pricing/", note: "Örnek fiyat — doğrulayın" },
    { id: "an-haiku", provider: "anthropic", model: "claude-haiku-4-5", label: "Claude Haiku 4.5", inPrice: 1, outPrice: 5, priceSource: "https://www.anthropic.com/pricing#api", note: "Örnek fiyat — doğrulayın" },
    { id: "an-sonnet", provider: "anthropic", model: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", inPrice: 3, outPrice: 15, priceSource: "https://www.anthropic.com/pricing#api", note: "Örnek fiyat — doğrulayın" },
    { id: "hub-mymind", provider: "hub", model: "mymind-lite", label: "MyMind (Hub)", note: "Bu bilgisayarda — ücretsiz" },
  ];
  const r = (modelId, label, provider, model, text, inTok, outTok, ms, rating, winner, inPrice, outPrice) => ({ modelId, label, provider, model, ok: true, text, inTok, outTok, usageReported: true, ms, rating, winner, cost: provider === "hub" ? 0 : (inTok * inPrice + outTok * outPrice) / 1e6, price: { inPrice, outPrice, date: "", verified: provider === "hub" } });
  const runs = [
    { id: "ornek-kod", at: BASE, title: "Örnek · KDV işlevindeki hata", type: "kod", sample: true, maxTokens: 400,
      prompt: "Aşağıdaki JavaScript işlevi KDV'yi yanlış hesaplıyor; hatayı bul ve düzelt:\nfunction kdv(t){ return t * 18 / 10; }",
      results: [
        r("oa-mini", "GPT-4o mini", "openai", "gpt-4o-mini", "Hata: 18/10 = 1,8 ile çarpıyorsunuz. Oran %20 ise: function kdv(t){ return t * 0.20; }", 52, 41, 1300, 4, false, 0.15, 0.6),
        r("an-haiku", "Claude Haiku 4.5", "anthropic", "claude-haiku-4-5", "18/10 yerine 18/100 olmalı; 2026 oranı %20 ise sabit kullanın:\nconst KDV = 0.20;\nfunction kdv(t){ return Math.round(t * KDV * 100) / 100; }", 58, 62, 1600, 5, true, 1, 5),
        r("hub-mymind", "MyMind (Hub)", "hub", "mymind-lite", "İşlev 1,8 ile çarpıyor; t * 0.18 yazın.", 60, 18, 2400, 3, false, 0, 0),
      ] },
    { id: "ornek-ozet", at: BASE, title: "Örnek · Toplantı notu özeti", type: "ozet", sample: true, maxTokens: 300,
      prompt: "Şu toplantı notunu 3 maddede özetle: Fatura servisi Ocak'ta %20 KDV'ye geçecek. PDF şablonu yenilenecek. Test kapsamı artırılacak; sorumlu ekip ödeme.",
      results: [
        r("oa-mini", "GPT-4o mini", "openai", "gpt-4o-mini", "• Ocak'ta KDV %20'ye geçiyor.\n• PDF şablonu yenilenecek.\n• Test kapsamı artırılacak (ödeme ekibi).", 64, 38, 1100, 5, true, 0.15, 0.6),
        r("an-haiku", "Claude Haiku 4.5", "anthropic", "claude-haiku-4-5", "1. KDV Ocak'tan itibaren %20.\n2. Fatura PDF şablonu yenileniyor.\n3. Ödeme ekibi test kapsamını artıracak.", 70, 44, 1400, 5, false, 1, 5),
        r("hub-mymind", "MyMind (Hub)", "hub", "mymind-lite", "KDV %20 olacak, PDF yenilenecek, testler artacak.", 72, 20, 2100, 4, false, 0, 0),
      ] },
  ];
  const api = { BASE, catalog, runs };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MSSample = api;
})(typeof self !== "undefined" ? self : this);
