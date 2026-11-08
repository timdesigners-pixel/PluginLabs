// Access Lens (PL-043) çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

test("1. renk ayrıştırma (hex, rgb, hsl, isimli) ve WCAG 2.2 bağıl parlaklık / kontrast oranı", () => {
  assert.deepEqual(C.parseColor("#ffffff"), [255, 255, 255]);
  assert.deepEqual(C.parseColor("#000"), [0, 0, 0]);
  assert.deepEqual(C.parseColor("rgb(17, 24, 39)"), [17, 24, 39]);
  assert.deepEqual(C.parseColor("hsl(0, 100%, 50%)"), [255, 0, 0]);
  assert.equal(C.contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(C.contrastRatio("#ffffff", "#ffffff"), 1);
  const low = C.contrastRatio("#9ca3af", "#ffffff");
  assert.ok(low < 4.5 && low > 2.0);
  const fixed = C.suggestAccessibleColor("#9ca3af", "#ffffff", 4.5);
  assert.ok(C.contrastRatio(fixed, "#ffffff") >= 4.5);
});

test("2. kontrast denetimi: AA (4.5:1 / büyük metin 3:1) ve AAA (7:1) ayrımı", () => {
  const html = `<p style="color: #767676; background-color: #ffffff;">AA sınırında metin (4.54:1)</p>
<p style="color: #9ca3af; background-color: #ffffff;">Düşük kontrastlı metin</p>`;
  const aa = C.auditSnippet(html, { level: "AA" });
  assert.equal(aa.issues.filter((i) => i.category === "kontrast").length, 1);
  assert.equal(aa.issues[0].ruleId, "WCAG-1.4.3-CONTRAST-AA");
  assert.equal(aa.issues[0].line, 2);
  const aaa = C.auditSnippet(html, { level: "AAA" });
  assert.equal(aaa.issues.filter((i) => i.category === "kontrast").length, 2);
  assert.ok(aaa.issues.some((i) => i.ruleId === "WCAG-1.4.6-CONTRAST-AAA"));
});

test("3. etiket denetimi: img alt, form label/aria-label, button ve a erişilebilir adları", () => {
  const html = `<img src="a.png">
<img src="dekor.png" alt="">
<input type="text" placeholder="Adınız">
<label for="soyad">Soyad</label><input id="soyad" type="text">
<button type="button"></button>
<a href="/detay">tıklayın</a>`;
  const a = C.auditSnippet(html);
  const ids = a.issues.map((i) => i.ruleId);
  assert.ok(ids.includes("WCAG-1.1.1-IMG-ALT"), "alt olmayan img yakalanmalı");
  assert.equal(a.issues.filter((i) => i.ruleId === "WCAG-1.1.1-IMG-ALT").length, 1, 'alt="" dekoratif görsel yanlış olumlu olmamalı');
  assert.equal(a.issues.filter((i) => i.ruleId === "WCAG-1.3.1-FORM-LABEL").length, 1, "yalnız etiketsiz input yakalanmalı");
  assert.ok(ids.includes("WCAG-4.1.2-BTN-NAME"));
  assert.ok(ids.includes("WCAG-2.4.4-LINK-NAME"));
});

test("4. odak sırası denetimi: pozitif tabindex, etkileşimli div/span ve outline:none", () => {
  const html = `<button tabindex="2">Önce</button>
<div onclick="ac()">Menüyü Aç</div>
<style>.btn:focus { outline: none; }</style>`;
  const a = C.auditSnippet(html);
  const ids = a.issues.map((i) => i.ruleId);
  assert.ok(ids.includes("WCAG-2.4.3-TABINDEX-POS"));
  assert.ok(ids.includes("WCAG-2.1.1-INTERACTIVE-FOCUS"));
  assert.ok(ids.includes("WCAG-2.4.7-OUTLINE-NONE"));
});

test("5. semantik yapı denetimi: html lang, main landmark ve başlık düzeyi atlama (h1 → h3)", () => {
  const html = `<html><body><h1>Başlık</h1><h3>Alt başlık</h3></body></html>`;
  const a = C.auditSnippet(html);
  const ids = a.issues.map((i) => i.ruleId);
  assert.ok(ids.includes("WCAG-3.1.1-HTML-LANG"));
  assert.ok(ids.includes("WCAG-1.3.1-MAIN-LANDMARK"));
  assert.ok(ids.includes("WCAG-1.3.1-HEADING-SKIP"));
});

test("6. bilinen fixture'larda doğrulama ölçütü: %100 duyarlılık ve kritik yanlış olumlu <%5 (%0)", () => {
  const audits = S.fixtures.map((f) => C.auditSnippet(f.source, { title: f.title, url: f.url, sampleKey: f.key, at: S.BASE }));
  const ev = C.evaluateFixtures(audits, S.fixtures);
  assert.equal(ev.fixtures, 4);
  assert.equal(ev.recall, 100);
  assert.equal(ev.criticalFalsePositives, 0);
  assert.ok(ev.criticalFpRate < 5, "Kritik yanlış olumlu oranı <%5 hedefini sağlamalı");
});

test("7. teknik sınırlar: standart sürümü, kural motoru sürümü, sertifika uyarısı ve manuel kontrol listesi", () => {
  const a = C.auditSnippet("<h1>Merhaba</h1>");
  assert.equal(a.engineVersion, "AccessLens-Rules 1.0.0");
  assert.equal(a.standardVersion, "WCAG 2.2 (AA / AAA)");
  assert.match(a.certificateDisclaimer, /sertifikası değildir/);
  assert.equal(a.manualChecks.length, 4);
  assert.ok(a.manualChecks.every((m) => m.done === false));
});

test("8. yapay zekâ veri azaltma ve doğrulama: sırlar maskelenir, sertifika uyarısı korunur", () => {
  const a = C.auditSnippet(`<input type="text" placeholder="iletisim@ornek.com https://gizli.ornek.com/form">`);
  const issue = a.issues[0];
  const p = C.aiPayload(a, issue);
  const sent = JSON.stringify(p.messages);
  assert.ok(!sent.includes("iletisim@ornek.com"));
  assert.ok(!sent.includes("gizli.ornek.com"));
  assert.ok(sent.includes("⟦eposta⟧"));
  const res = C.validateAi('```json\n{"aciklama":"Form alanında ekran okuyucu için etiket eksik.","duzeltme":"<label for=\\"e\\">E-posta</label> ekleyin.","manuelKontrol":"Tab ile odaklanıp NVDA ile dinleyin."}\n```', issue);
  assert.match(res.aciklama, /ekran okuyucu/);
  assert.match(res.disclaimer, /sertifikası değildir/);
  assert.throws(() => C.validateAi("geçersiz metin", issue), /JSON/);
});

test("9. dışa aktarma: CSV formül enjeksiyonu engeli ve Markdown rapor bütünlüğü", () => {
  const a = C.auditSnippet(`<img src="x.png">`, { title: "=cmd|' /C calc'!A0" });
  const csv = C.exportCsv(a);
  assert.match(csv, /'=cmd/);
  assert.match(csv, /AccessLens-Rules 1\.0\.0/);
  const md = C.exportMd(a);
  assert.match(md, /Sertifika Değildir/);
  assert.match(md, /Manuel Klavye ve Ekran Okuyucu Kontrol Listesi/);
  assert.match(md, /WCAG-1\.1\.1-IMG-ALT/);
});

test("10. normalleştirme ve güvenlik: yalnız http/https kaynak adresi ve yalnız loopback yerel model", () => {
  assert.equal(C.isWebUrl("javascript:alert(1)"), false);
  assert.equal(C.isWebUrl("https://ornek.com/sayfa"), true);
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:11434"), true);
  assert.equal(C.isLoopbackUrl("http://uzak-sunucu.com:11434"), false);
  const st = C.normalizeSettings({ localUrl: "https://kötü.com", level: "AAA" });
  assert.equal(st.localUrl, "http://127.0.0.1:1234");
  assert.equal(st.level, "AAA");
});
