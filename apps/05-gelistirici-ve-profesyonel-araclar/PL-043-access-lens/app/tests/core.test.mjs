// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");

const raw = (over) => ({
  engineVersion: "4.14.0", tags: [...C.ENGINE_TAGS, "best-practice"], url: "https://ornek.example/sayfa", title: "Örnek", lang: "tr", viewport: { w: 1280, h: 900 }, passes: 30, inapplicable: 40, elements: 120, durationMs: 210,
  violations: [
    { id: "color-contrast", impact: "serious", tags: ["cat.color", "wcag2aa", "wcag143"], help: "Elements must meet minimum color contrast ratio thresholds", helpUrl: "https://dequeuniversity.com/rules/axe/4.14/color-contrast", nodes: [{ target: [".soluk"], html: '<p class="soluk">Yaz: ece@ornek.com</p>', impact: "serious", failureSummary: "Fix any of the following: insufficient contrast 2.32", beklenen: "color-contrast" }] },
    { id: "image-alt", impact: "critical", tags: ["wcag2a", "wcag111"], help: "Images must have alternate text", nodes: [{ target: ["img"], html: "<img src=x>", impact: "critical", beklenen: "" }] },
    { id: "heading-order", impact: "moderate", tags: ["best-practice"], help: "Heading levels should only increase by one", nodes: [{ target: ["h3"], html: "<h3>x</h3>", beklenen: "heading-order" }] },
  ],
  incomplete: [{ id: "color-contrast", impact: "serious", tags: ["wcag2aa", "wcag143"], help: "…", nodes: [{ target: [".afis"], html: "<p class=afis>", failureSummary: "background image" }] }],
  focus: [{ tag: "a", name: "Anasayfa", tabindex: 0, sel: "a", x: 0, y: 100, w: 50, h: 20 }, { tag: "a", name: "İletişim", tabindex: 3, sel: "#i", x: 0, y: 300, w: 50, h: 20 }, { tag: "button", name: "", tabindex: 0, sel: "button", x: 0, y: 400, w: 20, h: 20 }, { tag: "a", name: "Yukarı", tabindex: 0, sel: "#yukari", x: 0, y: 10, w: 20, h: 20 }],
  outline: { headings: [{ level: 1, text: "Başlık", sel: "h1" }, { level: 3, text: "Alt", sel: "h3" }], landmarks: [{ role: "main", name: "", sel: "main" }] },
  expectations: [{ sel: ".soluk", rules: ["color-contrast"], found: ["color-contrast"] }, { sel: "h3", rules: ["heading-order"], found: ["heading-order"] }, { sel: "input", rules: ["label"], found: [] }],
  ...(over || {}),
});

test("motor çıktısı → Türkçe bulgular: önem sırası, WCAG başvurusu/düzeyi, en iyi uygulama, manuel kontrol ayrı, kişisel veri maskeli", () => {
  const a = C.normalizeRun(raw(), { kind: "url", url: "https://ornek.example/sayfa", at: "2026-11-07T10:00:00Z", scripts: true });
  assert.deepEqual(a.findings.map((f) => f.ruleId), ["image-alt", "color-contrast", "heading-order"]);
  const cc = a.findings[1];
  assert.equal(cc.title, "Metin ile arka plan arasındaki kontrast yetersiz");
  assert.deepEqual(cc.wcag, ["1.4.3"]);
  assert.equal(cc.level, "AA");
  assert.equal(cc.version, "2.0");
  assert.ok(!cc.html.includes("ece@ornek.com") && cc.html.includes("[e-posta]"));
  assert.equal(a.findings[2].bestPractice, true);
  assert.deepEqual(a.findings[2].wcag, []);
  assert.equal(a.manual.length, 1);
  assert.equal(a.manual[0].manual, true);
  assert.equal(a.engine.version, "4.14.0");
  assert.equal(a.standard.label, "WCAG 2.2 A + AA + en iyi uygulamalar");
  const s = C.summarize(a);
  assert.deepEqual(s.byImpact, { critical: 1, serious: 1, moderate: 1, minor: 0 });
  assert.equal(s.rules[0].ruleId, "image-alt");
});

test("fixture doğrulaması: doğru bulgu, yanlış olumlu, kaçırılan; kritik/ciddi yanlış olumlu oranı", () => {
  const a = C.normalizeRun(raw(), { kind: "ornek", fixture: "deneme" });
  const e = C.evaluateFixture(a);
  assert.equal(e.tp, 2);
  assert.equal(e.fp, 1, "işaretsiz img image-alt bulgusu yanlış olumlu sayılır");
  assert.equal(e.fn, 1);
  assert.equal(e.expected, 3);
  assert.equal(e.critFpRate, 50);
  assert.deepEqual(e.missed, ["label input"]);
  assert.equal(C.evaluateFixture(C.normalizeRun(raw(), { kind: "url" })), null, "fixture olmayan sayfada ölçülmez");
  const tot = C.fixtureTotals([a]);
  assert.equal(tot.pages, 1);
  assert.equal(tot.precision, 66.7);
});

test("fixture dosyaları: her birinde beklenen sorunlar işaretli, sorunsuz öğeler de var", () => {
  for (const f of ["kayit-formu", "urun-karti", "haber-listesi"]) {
    const html = fs.readFileSync(new URL("../src/fixtures/" + f + ".html", import.meta.url), "utf8");
    const marks = html.match(/data-beklenen="[^"]+"/g) || [];
    assert.ok(marks.length >= 2, f);
    assert.ok(/alt="[^"]+"|<label|title="/.test(html), f + " doğru kullanım örneği içermeli");
  }
});

test("yeniden denetim karşılaştırması: yeni / giderilen / süren; yanlış olumlu işaretliler sayılmaz", () => {
  const a = C.normalizeRun(raw(), { kind: "url", url: "https://ornek.example/sayfa", at: "2026-11-07T10:00:00Z" });
  const r2 = raw();
  r2.violations = [r2.violations[0], { id: "label", impact: "critical", tags: ["wcag2a", "wcag412"], nodes: [{ target: ["input"], html: "<input>" }] }];
  const b = C.normalizeRun(r2, { kind: "url", url: "https://ornek.example/sayfa", at: "2026-11-07T11:00:00Z" });
  const d = C.diffAudits(a, b);
  assert.deepEqual([d.added, d.resolved, d.persisting], [1, 2, 1]);
  b.findings.find((f) => f.ruleId === "label").fp = true;
  assert.equal(C.diffAudits(a, b).added, 0);
  assert.equal(C.pageKey(a), C.pageKey(b));
});

test("odak sırası uyarıları: pozitif tabindex, görsel geri sıçrama, adsız öğe", () => {
  const a = C.normalizeRun(raw(), { kind: "url" });
  const kinds = C.focusIssues(a.focus).map((i) => i.n + ":" + i.kind);
  assert.deepEqual(kinds, ["2:tabindex", "3:adsiz", "4:geri"], "pozitif tabindex'in yol açtığı sıçrama ayrıca uyarılmaz");
});

test("adres: şema eklenir, yalnız http/https, kimlik bilgisi ve javascript: reddedilir, # atılır", () => {
  assert.equal(C.parseTarget("ornek.example/a#b"), "https://ornek.example/a");
  assert.equal(C.parseTarget("http://ornek.example"), "http://ornek.example/");
  assert.equal(C.parseTarget("javascript:alert(1)"), null);
  assert.equal(C.parseTarget("file:///C:/x.html"), null);
  assert.equal(C.parseTarget("https://kul:sifre@ornek.example"), null);
  assert.equal(C.parseTarget(""), null);
});

test("rapor: Markdown'da standart, motor sürümü, uyarı ve elle kontrol listesi; CSV formül enjeksiyonu engellenir", () => {
  const r = raw();
  r.violations[1].nodes[0].html = "=HYPERLINK(\"http://kotu\")";
  const a = C.normalizeRun(r, { kind: "url", url: "https://ornek.example/sayfa" });
  const md = C.exportMarkdown(a, "0.1.0");
  assert.match(md, /Standart: WCAG 2\.2 A \+ AA/);
  assert.match(md, /axe-core 4\.14\.0/);
  assert.match(md, /sertifikası ya da uygunluk beyanı değildir/);
  assert.match(md, /- \[ \] Tüm işlevler yalnız klavyeyle/);
  assert.ok(!/puan/i.test(md.replace(/puan üretmez/g, "")), "raporda puan yok");
  const csv = C.exportCsv(a);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/kotu""\)"/);
  const j = JSON.parse(C.exportJson(a, "0.1.0"));
  assert.equal(j.ozet.total, 3);
  assert.match(j.uyari, /sertifika/);
});

test("MyMind: istekte adres yok, kişisel veri maskeli; yanıtta uyumluluk/sertifika/puan iddiası atılır", () => {
  const a = C.normalizeRun(raw(), { kind: "url", url: "https://gizli.example/hesap" });
  const p = C.aiPayload(a, a.findings[1]);
  const all = JSON.stringify(p.messages);
  assert.ok(!all.includes("gizli.example"));
  assert.ok(!all.includes("ece@ornek.com"));
  const v = C.validateAi('```json\n{"aciklama":"Metin rengi arka planla yeterince ayrışmıyor. Düzeltince sayfanız tamamen erişilebilir olur.","duzeltme":"Rengi #595959 yapın; oran 7:1 olur. Böylece WCAG uyumlu sertifika alırsınız.","ornek":".soluk { color: #595959; }"}\n```');
  assert.equal(v.aciklama, "Metin rengi arka planla yeterince ayrışmıyor.");
  assert.equal(v.duzeltme, "Rengi #595959 yapın; oran 7:1 olur.");
  assert.equal(v.dropped, 2);
  assert.throws(() => C.validateAi("yanıt yok"));
});

test("ayarlar ve kayıtlar: sınırlar, yerel model yalnız loopback, bozuk kayıt atılır", () => {
  const s = C.normalizeSettings({ wait: 99999, width: 10, localUrl: "http://10.1.1.1:1234" });
  assert.equal(s.wait, 5000);
  assert.equal(s.width, 360);
  assert.equal(s.localUrl, "http://127.0.0.1:1234");
  assert.equal(s.scripts, true);
  assert.equal(s.remote, false);
  assert.deepEqual(C.tagsFor({ bestPractice: false }), C.ENGINE_TAGS);
  assert.equal(C.normalizeAudits([{ id: "x" }, null, C.normalizeRun(raw(), {})]).length, 1);
});
