import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

test("1. Ortam değişkeni yer tutucularını ({{BASE_URL}}, {{API_KEY}}) doğru çıkarır", () => {
  const vars = C.extractPlaceholders("{{BASE_URL}}/v1/{{PROJECT_ID}}?key={{API_KEY}}");
  assert.deepEqual(vars, ["BASE_URL", "PROJECT_ID", "API_KEY"]);
});

test("2. Görünüm modunda sırları ⟦GİZLİ:...⟧ ile maskeler, yürütme modunda gerçek değeri koyar", () => {
  const env = SAMPLE.defaultEnv;
  const secrets = { API_KEY: "gizli-anahtar-12345" };
  const disp = C.interpolateText("Bearer {{API_KEY}} @ {{BASE_URL}}", env, secrets, "display");
  assert.equal(disp.text, "Bearer ⟦GİZLİ:API_KEY⟧ @ http://127.0.0.1:47699");
  assert.ok(!disp.text.includes("gizli-anahtar-12345"));
  const exec = C.interpolateText("Bearer {{API_KEY}} @ {{BASE_URL}}", env, secrets, "execute");
  assert.equal(exec.text, "Bearer gizli-anahtar-12345 @ http://127.0.0.1:47699");
});

test("3. Yazan HTTP yöntemlerinde (POST/PUT/PATCH/DELETE) ek önizleme bayrağını etkinleştirir", () => {
  const getPrev = C.buildRequestPreview(SAMPLE.templates[0], SAMPLE.defaultEnv, { API_KEY: "s12345" });
  assert.equal(getPrev.requiresWriteConfirm, false);
  const postPrev = C.buildRequestPreview(SAMPLE.templates[1], SAMPLE.defaultEnv, { API_KEY: "s12345" });
  assert.equal(postPrev.requiresWriteConfirm, true);
  assert.ok(!JSON.stringify(postPrev.displayHeaders).includes("s12345"));
});

test("4. JSON yanıtını biçimlendirir ve alanların türlerini/açıklamalarını çıkarır", () => {
  const raw = JSON.stringify({ id: "usr_1", created_at: "2026-11-07", total: 99, is_verified: true });
  const formatted = C.formatResponse(raw, 200, { "content-type": "application/json" }, 22, {});
  assert.equal(formatted.isJson, true);
  assert.equal(formatted.fields.length, 4);
  assert.match(formatted.fields.find((f) => f.path === "created_at").explanation, /zaman damgası/i);
});

test("5. Yanıt veya başlıklarda sızabilecek bilinen sırları ⟦GİZLİ:...⟧ ile temizler (0 sızıntı)", () => {
  const secrets = { API_KEY: "super-secret-token-xyz987" };
  const raw = JSON.stringify({ echo_auth: "Bearer super-secret-token-xyz987", status: "ok" });
  const formatted = C.formatResponse(raw, 200, { Authorization: "Bearer super-secret-token-xyz987" }, 10, secrets);
  assert.ok(!formatted.pretty.includes("super-secret-token-xyz987"));
  assert.ok(!JSON.stringify(formatted.headers).includes("super-secret-token-xyz987"));
});

test("6. cURL dışa aktarmasında sırları açık yazmaz, maskeli yer tutucu kullanır", () => {
  const curl = C.exportCurl(SAMPLE.templates[0], SAMPLE.defaultEnv);
  assert.match(curl, /⟦GİZLİ:API_KEY⟧/);
  assert.ok(!curl.includes(SAMPLE.sampleSecretValue));
});

test("7. Koleksiyon JSON ve Markdown dışa aktarmasında hiçbir gizli anahtar sızmaz", () => {
  const json = C.exportCollectionJson(SAMPLE.templates, SAMPLE.defaultEnv);
  assert.ok(!json.includes(SAMPLE.sampleSecretValue));
  const md = C.exportMarkdown(SAMPLE.templates, SAMPLE.defaultEnv);
  assert.match(md, /### Yanıt Alanları/);
  assert.ok(!md.includes(SAMPLE.sampleSecretValue));
});

test("8. Eksik ortam değişkenlerini istek önizlemesinde raporlar", () => {
  const tpl = { method: "GET", url: "{{BASE_URL}}/items/{{MISSING_ID}}", headers: [] };
  const prev = C.buildRequestPreview(tpl, SAMPLE.defaultEnv, {});
  assert.ok(prev.missing.includes("MISSING_ID"));
});

test("9. MyMind yükü ve doğrulayıcısı yanıtta olmayan uydurma alanları reddeder", () => {
  const tpl = SAMPLE.templates[0];
  const payload = C.aiPayload(tpl);
  assert.equal(payload.sent.docLinked, true);
  const res = C.validateAi(JSON.stringify({
    summary: "Proje sağlık durumu ve kota yanıtı.",
    explanations: [
      { path: "status", explanation: "Servisin çalışma durumu (healthy = sorunsuz)." },
      { path: "rate_limit", explanation: "Saatlik kalan toplam istek kotası." },
      { path: "uydurma_alan", explanation: "Yanıtta bulunmayan uydurma alan." },
    ],
  }), tpl);
  assert.equal(res.explanations.length, 2);
  assert.equal(res.dropped, 1);
});

test("10. Doğrulama ölçütü: sırların günlükte görünmesi sıfır ve ilk doğru istek ≤2 dk", () => {
  const m = C.metrics(SAMPLE.templates, SAMPLE.defaultEnv, {});
  assert.equal(m.secretLeaksInLogs, 0);
  assert.ok(m.firstRequestSeconds <= 120);
});
