// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");
const cat = () => C.normalizeCatalog(S.catalog);
const settings = (x) => C.normalizeSettings({ monthlyCap: 5, runCap: 0.5, maxTokens: 800, ...(x || {}) });
const NOW = "2026-11-08T12:00:00.000Z";

test("anahtar biçimi: yalnız resmi API anahtarı biçimleri", () => {
  assert.ok(C.keyValid("openai", "sk-proj-" + "a".repeat(40)));
  assert.ok(C.keyValid("anthropic", "sk-ant-api03-" + "b".repeat(40)));
  assert.ok(!C.keyValid("openai", "sess-" + "a".repeat(40)), "web oturum belirteci kabul edilmez");
  assert.ok(!C.keyValid("anthropic", "sk-" + "a".repeat(40)));
  assert.ok(!C.keyValid("openai", "sk-kisa"));
  assert.ok(C.keyValid("hub", "test-istemci-anahtari-1234567890"));
});

test("katalog: fiyat tarihli; doğrulama tarih olmadan olmaz; ücretsiz sağlayıcı 0; geçersiz model adı", () => {
  const m = C.normalizeModel({ provider: "openai", model: "gpt-4o-mini", inPrice: 0.15, outPrice: 0.6, verified: true });
  assert.equal(m.verified, false, "tarihsiz fiyat doğrulanmış sayılmaz");
  assert.equal(C.normalizeModel({ provider: "openai", model: "x", inPrice: 1, outPrice: 2, verified: true, priceDate: "2026-11-01" }).verified, true);
  const h = C.normalizeModel({ provider: "hub", model: "mymind-lite", inPrice: 9 });
  assert.equal(h.inPrice, 0); assert.equal(h.verified, true);
  assert.equal(C.normalizeModel({ provider: "anthropic", model: "a b; rm -rf" }).model, "model");
  assert.equal(C.normalizeModel({ provider: "openai", model: "x", inPrice: -1 }).inPrice, null);
  assert.ok(cat().every((x) => !C.PROVIDERS[x.provider].paid || !x.verified), "başlangıç fiyatları doğrulanmamış");
});

test("maliyet: kullanım × fiyat; fiyat yoksa null; ücretsiz 0", () => {
  const m = C.normalizeModel({ provider: "anthropic", model: "c", inPrice: 3, outPrice: 15 });
  assert.equal(C.costOf(m, 1000, 500), 0.0105);
  assert.equal(C.costOf(C.normalizeModel({ provider: "openai", model: "x" }), 10, 10), null);
  assert.equal(C.costOf(C.normalizeModel({ provider: "hub", model: "mymind-lite" }), 1e6, 1e6), 0);
  assert.equal(C.usd(0.0105), "$0.0105");
  assert.ok(C.safeInputTokens("", "a".repeat(400)) >= C.estTokens("a".repeat(400)) * 2, "temkinli girdi tahmini yaklaşık tahminin üstünde");
});

test("plan: en kötü durum tavanı aşarsa gönderilmez; aylık tavan; fiyatsız model engellenir; 4 model sınırı", () => {
  const c = cat();
  const task = { prompt: "Bu metni özetle: " + "kelime ".repeat(200), maxTokens: 800 };
  let p = C.plan(c, ["oa-mini", "an-haiku"], task, settings(), [], NOW);
  assert.ok(p.ok, p.errors.join(" "));
  const exp = C.costOf(c[0], p.inSafe, 800) + C.costOf(c[2], p.inSafe, 800);
  assert.ok(Math.abs(p.worst - exp) < 1e-9);
  assert.deepEqual(p.unverified, ["GPT-4o mini", "Claude Haiku 4.5"]);
  p = C.plan(c, ["an-sonnet", "oa-41"], { ...task, maxTokens: 16000 }, settings({ runCap: 0.1 }), [], NOW);
  assert.ok(!p.ok); assert.match(p.errors.join(" "), /çalıştırma başına tavan/);
  const spentRuns = [C.normalizeRun({ at: "2026-11-02T10:00:00Z", results: [{ ok: true, cost: 4.999, provider: "openai" }] })];
  p = C.plan(c, ["an-haiku"], task, settings(), spentRuns, NOW);
  assert.ok(!p.ok); assert.match(p.errors.join(" "), /aylık tavanı/);
  p = C.plan(c, ["an-haiku"], task, settings(), [C.normalizeRun({ at: "2026-10-30T10:00:00Z", results: [{ ok: true, cost: 4.99 }] })], NOW);
  assert.ok(p.ok, "geçen ayın harcaması bu ayı etkilemez");
  p = C.plan(c, ["an-haiku"], task, settings(), [C.normalizeRun({ at: "2026-11-02T10:00:00Z", sample: true, results: [{ ok: true, cost: 4.99 }] })], NOW);
  assert.ok(p.ok, "örnek kayıtlar harcamaya girmez");
  const noPrice = c.concat(C.normalizeModel({ id: "np", provider: "openai", model: "yeni" }));
  p = C.plan(noPrice, ["np"], task, settings(), [], NOW);
  assert.ok(!p.ok); assert.match(p.errors[0], /fiyatı girilmemiş/);
  p = C.plan(c, ["oa-mini", "oa-41", "an-haiku", "an-sonnet", "hub-mymind"], task, settings({ runCap: 100, monthlyCap: 100 }), [], NOW);
  assert.match(p.errors.join(" "), /en çok 4/);
  assert.ok(!C.plan(c, ["hub-mymind"], { prompt: "  " }, settings(), [], NOW).ok, "boş görev");
  assert.equal(C.plan(c, ["hub-mymind"], task, settings({ monthlyCap: 0, runCap: 0 }), [], NOW).ok, true, "ücretsiz model tavan 0'da da çalışır");
});

test("istek gövdeleri: OpenAI max_completion_tokens, Anthropic max_tokens + system", () => {
  const c = cat();
  const t = { system: "Kısa yanıt ver.", prompt: "Merhaba" };
  const o = C.buildRequest(c[0], t, 300, 0.2);
  assert.equal(o.path, "/v1/chat/completions"); assert.equal(o.body.max_completion_tokens, 300); assert.equal(o.body.messages[0].role, "system");
  const a = C.buildRequest(c[2], t, 300, 0.2);
  assert.equal(a.path, "/v1/messages"); assert.equal(a.body.max_tokens, 300); assert.equal(a.body.system, "Kısa yanıt ver."); assert.equal(a.body.messages.length, 1);
  const h = C.buildRequest(c[4], { prompt: "x" }, 100, 0);
  assert.equal(h.body.max_tokens, 100); assert.equal(h.body.messages.length, 1);
});

test("yanıt ayrıştırma ve gerçek maliyet; kullanım bildirilmezse maliyet görünmez", () => {
  const c = cat();
  const pa = C.parseResponse("anthropic", { content: [{ type: "text", text: "Mer" }, { type: "text", text: "haba" }], usage: { input_tokens: 100, output_tokens: 20 }, stop_reason: "end_turn" });
  assert.equal(pa.text, "Merhaba"); assert.equal(pa.inTok, 100); assert.ok(pa.usageReported);
  const po = C.parseResponse("openai", { choices: [{ message: { content: "Selam" }, finish_reason: "length" }], usage: { prompt_tokens: 50, completion_tokens: 10 } });
  assert.equal(po.stop, "length");
  const row = { worst: 1, est: 0.5 };
  const r1 = C.makeResult(c[0], row, po, 900);
  assert.equal(r1.cost, C.costOf(c[0], 50, 10)); assert.equal(r1.price.verified, false);
  const r2 = C.makeResult(c[0], row, C.parseResponse("openai", { choices: [{ message: { content: "x" } }] }), 900);
  assert.equal(r2.cost, null, "kullanım yoksa maliyet uydurulmaz");
  const r3 = C.makeResult(c[0], row, null, 100, "OpenAI anahtarı geçersiz (401).");
  assert.equal(r3.ok, false); assert.equal(r3.cost, 0);
  assert.throws(() => C.parseResponse("openai", {}), /seçenek yok/);
});

test("görev türü sınıflama (kural tabanlı)", () => {
  assert.equal(C.classifyTask("Bu Python fonksiyonundaki hatayı düzelt:\n```def f(x): return x+```").type, "kod");
  assert.equal(C.classifyTask("Şu paragrafı İngilizceye çevir: Merhaba dünya").type, "ceviri");
  assert.equal(C.classifyTask("Toplantı notlarını 3 maddede özetle").type, "ozet");
  assert.equal(C.classifyTask("Bu yorumları olumlu/olumsuz olarak sınıflandır").type, "siniflandirma");
  assert.equal(C.classifyTask("Merhaba").type, "genel");
});

test("öneri: yalnız puanlanmış kayıtlı sonuçlardan; tür bazında; kanıt yoksa öneri yok; arşiv sayılmaz", () => {
  const c = cat();
  const runs = C.normalizeRuns(S.runs);
  const rk = C.recommend(runs, c, "kod");
  assert.equal(rk.best.modelId, "an-haiku");
  assert.match(rk.reason, /yalnız örnek kayıtlar/);
  assert.equal(C.recommend(runs, c, "ozet").best.modelId, "oa-mini", "eşit puanda kazanma ve maliyet belirler");
  const none = C.recommend(runs, c, "ceviri");
  assert.equal(none.best, null); assert.match(none.reason, /puanlanmış test sonucu yok/);
  const arch = runs.map((r) => ({ ...r, status: "arsiv" }));
  assert.equal(C.recommend(arch, c, "kod").best, null);
  const off = c.map((m) => (m.id === "an-haiku" ? { ...m, enabled: false } : m));
  assert.notEqual(C.recommend(runs, off, "kod").best.modelId, "an-haiku", "katalogda kapalı model önerilmez");
});

test("MyMind: kişisel veri gizlenir, sistem talimatı/anahtar gitmez; uydurma tür/model/fiyat atılır", () => {
  const c = cat();
  const task = { system: "GIZLI-SISTEM", prompt: "ayse@ornek.com adresine yaz, tel 0532 111 22 33, anahtar sk-ant-" + "z".repeat(30) + " https://ic.ornek/x ; özetle" };
  const p = C.aiPayload(task, c, C.normalizeRuns(S.runs));
  const all = JSON.stringify(p.messages);
  assert.ok(!all.includes("ayse@ornek.com") && !all.includes("0532") && !all.includes("sk-ant-") && !all.includes("ic.ornek") && !all.includes("GIZLI-SISTEM"));
  assert.equal(p.sent.masked, 4);
  const v = C.validateAi('```json\n{"tur":"ozet","modeller":["oa-mini","uydurma-model","an-haiku"],"gerekce":"Haiku ucuz, $0.001 tutar; ali@x.com"}\n```', p);
  assert.equal(v.type, "ozet"); assert.deepEqual(v.models, ["oa-mini", "an-haiku"]); assert.ok(!v.reason.includes("ali@x.com")); assert.ok(!/\$0/.test(v.reason)); assert.equal(v.dropped, 2);
  assert.equal(C.validateAi('{"tur":"felsefe","modeller":[]}', p).type, null);
  assert.throws(() => C.validateAi("bilmiyorum", p), /JSON değil/);
});

test("ölçüler: görünürlük, ay harcaması; örnekler hariç", () => {
  const runs = C.normalizeRuns([
    { at: "2026-11-05T10:00:00Z", results: [{ ok: true, provider: "openai", cost: 0.01, usageReported: true }, { ok: true, provider: "anthropic", cost: null }, { ok: false, provider: "openai", cost: 0 }] },
    ...S.runs,
  ]);
  const m = C.metrics(runs, C.normalizeCounters({}), settings(), NOW);
  assert.equal(m.runs, 1); assert.equal(m.results, 2); assert.equal(m.visibility, 50); assert.equal(m.spentMonth, 0.01); assert.equal(m.remaining, 4.99);
});

test("CSV: formül enjeksiyonu engellenir; JSON yanıt ve fiyat tarihini taşır", () => {
  const runs = C.normalizeRuns([{ at: NOW, title: "=HYPERLINK(\"http://x\")", type: "genel", results: [{ ok: true, provider: "openai", model: "gpt-4o-mini", text: "+1", cost: 0.002, price: { inPrice: 0.15, outPrice: 0.6, date: "2026-11-01", verified: true } }] }]);
  const csv = C.exportCsv(runs);
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"http://x\"\")\""));
  assert.ok(csv.startsWith("﻿tarih,"));
  assert.ok(csv.includes(",0.002,"), "sayı etkilenmez");
  const j = JSON.parse(C.exportJson(runs, cat()));
  assert.equal(j.calistirmalar[0].sonuclar[0].yanit, "+1"); assert.equal(j.para_birimi, "USD"); assert.equal(j.katalog[0].dogrulandi, false);
  assert.equal(C.safeCell("－1"), "'－1");
});
