import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import S from "../src/sample.js";

test("1. Katalogdaki tüm modeller doğrulanmış tarihli fiyata sahiptir ve tüketici çerezi kullanmaz", () => {
  const cat = C.normalizeCatalog(C.DEFAULT_CATALOG);
  assert.ok(cat.length >= 4);
  for (const m of cat) {
    assert.match(m.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(m.authMode, "official_api_key");
    assert.equal(m.cookieUsed, false);
    assert.ok(m.inputPer1M > 0 && m.outputPer1M > 0);
  }
});

test("2. Tüketici web hesabı çerezi (cookie/session) reddedilir, resmi API anahtarı kabul edilir", () => {
  const badCookie = C.validateApiKeyOrRejectCookie("__Secure-next-auth.session-token=abc; Path=/");
  assert.equal(badCookie.ok, false);
  assert.equal(badCookie.isCookie, true);
  assert.match(badCookie.reason, /Tüketici web hesabı çerezi/);

  const goodKey = C.validateApiKeyOrRejectCookie("sk-proj-ResmiTestAnahtari1234567890");
  assert.equal(goodKey.ok, true);
});

test("3. Görev başına istek maliyeti tahmini %100 görünür ve deterministiktir", () => {
  const cat = C.normalizeCatalog(C.DEFAULT_CATALOG);
  const mA = cat.find((x) => x.id === "openai:gpt-4o-mini");
  const mB = cat.find((x) => x.id === "anthropic:claude-3-5-sonnet");
  const pair = C.estimatePairCost(mA, mB, "Bu bir örnek karşılaştırma görevidir.", 300);
  assert.equal(pair.costVisible, true);
  assert.ok(pair.a.totalCostUsd > 0);
  assert.ok(pair.b.totalCostUsd > pair.a.totalCostUsd);
  assert.equal(pair.combinedCostUsd, C.round6(pair.a.totalCostUsd + pair.b.totalCostUsd));
});

test("4. Kullanıcı bütçe tavanı denetimi: tavan aşımı sıfır hedefiyle aşırı isteği engeller", () => {
  const allowed = C.checkBudgetCap(0.01, 0.005, 0.05);
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.overrunAmountUsd, 0);

  const blocked = C.checkBudgetCap(0.048, 0.005, 0.05);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.overrunAmountUsd > 0);
  assert.match(blocked.reason, /Bütçe tavanı aşımı engellendi/);
});

test("5. Yan yana değerlendirme: iki sağlayıcının hız, maliyet ve rubrik kalitesini karşılaştırır", () => {
  const cat = C.normalizeCatalog(C.DEFAULT_CATALOG);
  const run = C.buildComparisonRun({
    id: "t-1",
    title: "Kod testi",
    taskType: "kodlama",
    prompt: "Fonksiyon hata ve test adımlarını yazın",
    criteria: ["fonksiyon", "hata", "test"],
    modelA: cat[0],
    modelB: cat[3],
    outA: "Kısa yanıt: fonksiyon var.",
    outB: "```js\nfunction fn(){}\n```\n- fonksiyon, hata yakalama ve test adımları eklendi.",
    latencyMsA: 300,
    latencyMsB: 500,
  });
  assert.equal(run.costVisible, true);
  assert.equal(run.budgetOverrun, false);
  assert.ok(run.sideB.qualityScore > run.sideA.qualityScore);
  assert.equal(run.totalCostUsd, C.round6(run.sideA.costUsd + run.sideB.costUsd));
});

test("6. Görev türüne göre model önerisi kayıtlı test sonuçlarına bağlanır", () => {
  const runs = S.buildSampleRuns();
  const rec = C.recommendModelForTask("kodlama", runs, C.DEFAULT_CATALOG);
  assert.equal(rec.tiedToBenchmark, true);
  assert.ok(rec.evidenceRunIds.includes("bench-01"));
  assert.ok(rec.avgQuality > 0);
  assert.match(rec.summary, /bench-01/);
});

test("7. MyMind AI doğrulaması katalogda olmayan modeli ve uydurma test kimliğini atar", () => {
  const runs = S.buildSampleRuns();
  const payload = C.aiPayload("kodlama", runs, C.DEFAULT_CATALOG);
  const raw = JSON.stringify({
    onerilenModel: "uydurma:model-99",
    gerekce: "Kayıtlı testlerde yüksek kalite verdi.",
    kanitTestIdleri: ["bench-01", "sahte-test-999"],
  });
  const validated = C.validateAiRecommendation(raw, payload, C.DEFAULT_CATALOG);
  assert.equal(validated.recommendedModelId, payload.baseline.recommendedModelId);
  assert.deepEqual(validated.evidenceRunIds, ["bench-01"]);
  assert.equal(validated.dropped, 2);
});

test("8. İletişim bilgileri ve API anahtarları AI isteğinden önce gizlenir", () => {
  const r = C.redactSecrets("İletişim: ali@ornek.com, anahtar sk-1234567890abcdef1234 ve tel 0532 111 22 33");
  assert.equal(r.count, 3);
  assert.ok(!r.text.includes("ali@ornek.com"));
  assert.ok(!r.text.includes("sk-1234567890abcdef1234"));
});

test("9. Doğrulama ölçütleri: maliyet görünürlüğü %100 ve bütçe aşımı 0 olarak raporlanır", () => {
  const runs = S.buildSampleRuns();
  const m = C.metrics(runs, { budgetCapUsd: 0.05 }, { preventedOverruns: 2, budgetOverruns: 0 });
  assert.equal(m.costVisibilityPct, 100);
  assert.equal(m.budgetOverruns, 0);
  assert.equal(m.preventedOverruns, 2);
});

test("10. CSV ve Markdown dışa aktarma formül enjeksiyonunu engeller ve fiyat tarihlerini içerir", () => {
  const runs = S.buildSampleRuns();
  runs[0].title = "=CMD|' /C calc'!A0";
  const csv = C.exportCsv(runs);
  assert.match(csv, /'=CMD/);
  const md = C.exportMd(runs, { budgetCapUsd: 0.05 }, {});
  assert.match(md, /Görev başına gerçek maliyet görünürlüğü:\*\* %100/);
  assert.match(md, /fiyat tarihi 2026-10-25/);
});

test("11. Yerel model sunucusu yalnız loopback adreslerini kabul eder", () => {
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:1234"), true);
  assert.equal(C.isLoopbackUrl("http://localhost:11434"), true);
  assert.equal(C.isLoopbackUrl("https://api.openai.com"), false);
  assert.equal(C.isLoopbackUrl("http://192.168.1.10:1234"), false);
});
