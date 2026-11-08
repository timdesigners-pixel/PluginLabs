// Design Token Scout (PL-044) çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

test("1. renk normalleştirme (hex, rgb, hsl) ve RGB Öklid mesafesi", () => {
  assert.deepEqual(C.parseColor("#7c6cff"), [124, 108, 255]);
  assert.deepEqual(C.parseColor("rgb(14, 19, 34)"), [14, 19, 34]);
  assert.equal(C.rgbToHex([14, 19, 34]), "#0e1322");
  assert.ok(C.colorDistance([124, 108, 255], [125, 109, 255]) < 5, "yakın renklerin mesafesi küçük olmalı");
});

test("2. boyut normalleştirme (px, rem, em) ve yazı ailesi temizleme", () => {
  assert.equal(C.parsePx("16px"), 16);
  assert.equal(C.parsePx("1.5rem"), 24);
  assert.equal(C.parsePx("0.75em"), 12);
  assert.equal(C.cleanFontFamily("'Inter', -apple-system, sans-serif"), "Inter");
  assert.equal(C.cleanFontFamily("inherit"), "");
});

test("3. computed style JSON ve CSS kaynağından ham stil gözlemlerini çıkarma", () => {
  const jsonObs = C.extractRawObservations(S.pages[0].source, S.pages[0].title);
  assert.ok(jsonObs.some((o) => o.category === "color" && o.normValue === "#7c6cff"));
  assert.ok(jsonObs.some((o) => o.category === "typography" && o.subType === "fontFamily" && o.normValue === "Inter"));
  assert.ok(jsonObs.some((o) => o.category === "spacing" && o.normValue === "16px"));
  assert.ok(jsonObs.some((o) => o.category === "radius" && o.normValue === "12px"));
});

test("4. yakın değerleri kümeleme: sapmalı renk (#7c6cff / #7d6dff) ve boşluk (15px / 16px) birleşir", () => {
  const allObs = S.pages.flatMap((p) => C.extractRawObservations(p.source, p.title));
  const res = C.clusterObservations(allObs, { colorTolerance: 14, spacingTolerance: 1.5 });
  const accent = res.candidates.find((c) => c.category === "color" && c.value === "#7c6cff");
  assert.ok(accent, "#7c6cff ana renk olarak seçilmeli");
  assert.ok(accent.mergedHexes.includes("#7d6dff"), "#7d6dff yakın değer olarak #7c6cff kümesine katılmalı");
  const sp16 = res.candidates.find((c) => c.category === "spacing" && c.value === "16px");
  assert.ok(sp16.mergedValues.includes("15px"), "15px sapması 16px tokenına kümelenmeli");
  assert.ok(res.duplicationReductionPct > 15, "token tekrarında anlamlı düşüş sağlanmalı");
});

test("5. Notion doğrulama ölçütü: örnek 5 sayfada ana değerleri ≥%90 kapsama (%100)", () => {
  const allObs = S.pages.flatMap((p) => C.extractRawObservations(p.source, p.title));
  const res = C.clusterObservations(allObs);
  const cov = C.evaluateCoverage(res.candidates, S.goldCoreValues);
  assert.equal(S.pages.length, 5);
  assert.ok(cov.coveragePct >= 90, `Kapsama ≥%90 olmalı, ölçülen: %${cov.coveragePct}`);
  assert.equal(cov.coveragePct, 100);
});

test("6. kullanıcı onayı: onaylanmayan adaylar W3C Design Tokens JSON ve CSS çıktısına girmez", () => {
  const allObs = C.extractRawObservations(S.pages[0].source, "P1");
  const res = C.clusterObservations(allObs);
  res.candidates[0].approved = false;
  const unapprovedVal = res.candidates[0].value;
  const w3c = JSON.parse(C.exportW3cTokens(res.candidates));
  assert.equal(w3c.$metadata.approvedCount, res.candidates.length - 1);
  assert.ok(!JSON.stringify(w3c).includes(`"$value":"${unapprovedVal}"`));
  const css = C.exportCssVariables(res.candidates);
  assert.match(css, /:root \{/);
});

test("7. W3C Design Tokens JSON ($value, $type) biçim doğrulaması", () => {
  const allObs = C.extractRawObservations(S.pages[0].source, "P1");
  const res = C.clusterObservations(allObs);
  const w3c = JSON.parse(C.exportW3cTokens(res.candidates));
  assert.ok(w3c.color && w3c.color.palette && w3c.color.palette["1"].$value);
  assert.equal(w3c.color.palette["1"].$type, "color");
});

test("8. yapay zekâ (MyMind) semantik token hiyerarşisi önerisi ve doğrulaması", () => {
  const allObs = C.extractRawObservations(S.pages[0].source, "P1");
  const res = C.clusterObservations(allObs);
  const p = C.aiPayload(res.candidates);
  assert.ok(p.sent.tokenCount > 0);
  const validId = res.candidates[0].id;
  const aiOut = C.validateAi(JSON.stringify({
    oneriler: [
      { id: validId, semanticRole: "color.bg.canvas" },
      { id: "olmayan-id", semanticRole: "color.bad" },
    ],
    ozet: "Renk ve boşluk katmanları ayrıldı.",
  }), res.candidates);
  assert.equal(aiOut.suggestions.length, 1);
  assert.equal(aiOut.suggestions[0].semanticRole, "color.bg.canvas");
  assert.equal(aiOut.dropped, 1);
});

test("9. Markdown tasarım sistemi belgesi ve telif/mülkiyet ilkesi", () => {
  const allObs = S.pages.flatMap((p) => C.extractRawObservations(p.source, p.title));
  const res = C.clusterObservations(allObs);
  const cov = C.evaluateCoverage(res.candidates, S.goldCoreValues);
  const md = C.exportMd(S.pages, res.candidates, res, cov);
  assert.match(md, /hak sahibi olunan tasarımda kullanılır/);
  assert.match(md, /%100/);
});

test("10. ayar normalleştirme ve yalnız loopback yerel model adresi", () => {
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:1234"), true);
  assert.equal(C.isLoopbackUrl("https://dis-sunucu.com"), false);
  const st = C.normalizeSettings({ localUrl: "http://kötü.com", colorTolerance: 18 });
  assert.equal(st.localUrl, "http://127.0.0.1:1234");
  assert.equal(st.colorTolerance, 18);
});
