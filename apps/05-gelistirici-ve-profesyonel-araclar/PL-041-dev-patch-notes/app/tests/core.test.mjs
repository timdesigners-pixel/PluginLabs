// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");
const sample = () => C.createRelease({ content: S.log, repoUrl: S.repoUrl, title: "1.4.0" }, S.BASE);

test("örnek git log: 15 commit, elle etiketli kategori doğruluğu %100, birleştirme/geri alma/bakım dışarıda", () => {
  const r = sample();
  assert.equal(r.source.format, "log");
  assert.equal(r.commits.length, 15);
  const g = C.evaluateGold(r, S.gold);
  assert.deepEqual(g.misses, []);
  assert.equal(g.accuracy, 100);
  const byText = (re) => r.items.find((x) => re.test(x.text));
  assert.equal(byText(/Kargo iade akışı/).include, false);
  assert.ok(byText(/Kargo iade akışı/).flags.includes("birlesme"));
  assert.ok(byText(/^Bildirim/).flags.includes("geri"));
  assert.ok(byText(/^Geri alındı/).flags.includes("geri"));
  assert.equal(byText(/Axios/).include, false, "bakım varsayılan olarak notta yok");
  assert.equal(byText(/^Wip$/).include, false);
  assert.ok(byText(/^Wip$/).flags.includes("belirsiz"));
  assert.equal(byText(/iade talebi/).text, "İade: Kargo iade talebi oluşturma ekranı");
  assert.deepEqual(byText(/iade talebi/).prs, [42]);
  assert.equal(byText(/v1\/gonderi/).cat, "kirici");
});

test("sır taraması: girişte bulunur, maskelenir, hiçbir çıktıda ham hâli yok", () => {
  const r = sample();
  assert.equal(r.secrets.length, 1);
  assert.equal(r.secrets[0].type, "AWS erişim anahtarı");
  assert.equal(r.secrets[0].sha, r.commits.find((c) => /Yapılandırma/.test(c.subject)).sha);
  const all = JSON.stringify(r) + C.renderMarkdown(r, {}) + C.renderText(r, {}) + C.renderJson(r, { internal: true }) + JSON.stringify(C.aiPayload(r).messages);
  assert.doesNotMatch(all, /AKIAIOSFODNN7EXAMPLE/);
  assert.match(r.commits.find((c) => /Yapılandırma/.test(c.subject)).body, /⟨gizlendi: AWS erişim anahtarı⟩/);
  for (const s of ["ghp_" + "a".repeat(36), "sk-ant-api03-" + "b".repeat(30), "xoxb-1234567890-abcdefghij", "AIza" + "c".repeat(35), "-----BEGIN RSA PRIVATE KEY-----\nMIIE\n-----END RSA PRIVATE KEY-----", "postgres://kullanici:Gizli123@db.example/x", "password = Hk29xLq7Za"]) assert.equal(C.scanSecrets("x " + s + " y").length, 1, s);
  assert.equal(C.scanSecrets("password = process.env.DB_PASS").length, 0);
  assert.equal(C.scanSecrets("api_key: changeme").length, 0);
});

test("kanıtsız iddia: kaynakta yoksa işaretlenir ve dışa aktarma engellenir; kaynakta aynı sayıyla varsa geçer", () => {
  const r = sample();
  const perf = r.items.find((x) => /sanal kaydırma/.test(x.text));
  perf.text = "Sipariş listesi 2x faster açılıyor";
  assert.deepEqual(C.blockers(r), [], "kaynakta “2x faster” var");
  perf.text = "Sipariş listesi 3x faster açılıyor";
  assert.equal(C.blockers(r).length, 1, "sayı kaynaktakiyle aynı değil");
  perf.text = "Sipariş listesi sanal kaydırmaya geçti";
  const fix = r.items.find((x) => /Takip numarası/.test(x.text));
  fix.text = "Takip numarası sorgusu düzeltildi, tüm testler geçti";
  const b = C.blockers(r);
  assert.equal(b.length, 1);
  assert.match(b[0].reason, /test geçişi.*kanıtsız/);
  fix.include = false;
  assert.deepEqual(C.blockers(r), [], "dahil edilmeyen madde engellemez");
  assert.equal(C.checkClaims("Üretime hazır", "").length, 1);
  assert.equal(C.checkClaims("%30 daha hızlı", "ölçüm: %30 daha hızlı")[0].supported, true);
  assert.equal(C.checkClaims("%40 daha hızlı", "ölçüm: %30 daha hızlı")[0].supported, false);
});

test("girdi biçimleri: --oneline (süslemeli), format-patch (MIME konu), çıplak diff, makine biçimi, düz metin reddi", () => {
  const one = C.parseInput("a1b2c3d (HEAD -> main, tag: v1.2.0) fix: giriş hatası\n9f8e7d6 feat: koyu tema\n");
  assert.equal(one.format, "oneline");
  assert.equal(one.commits[0].sha, "a1b2c3d");
  assert.equal(one.commits[0].subject, "fix: giriş hatası");
  const patch = "From 1111111111111111111111111111111111111111 Mon Sep 17 00:00:00 2001\nFrom: Ece Demir <ece@ornek.example>\nDate: Thu, 5 Nov 2026 10:00:00 +0300\nSubject: [PATCH 1/2] =?UTF-8?q?fix:_=C3=A7=C3=B6kme_d=C3=BCzeltildi?=\n\nAyrıntı satırı.\n---\n src/a.ts | 3 ++-\n 1 file changed, 2 insertions(+), 1 deletion(-)\n\ndiff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +1,2 @@\n-x\n+y\n+z\n-- \n2.43.0\n\nFrom 2222222222222222222222222222222222222222 Mon Sep 17 00:00:00 2001\nFrom: Mert <m@ornek.example>\nSubject: [PATCH 2/2] docs: README\n\n---\n README.md | 1 +\n";
  const p = C.parseInput(patch);
  assert.equal(p.format, "patch");
  assert.equal(p.commits.length, 2);
  assert.equal(p.commits[0].subject, "fix: çökme düzeltildi");
  assert.equal(p.commits[0].body, "Ayrıntı satırı.");
  assert.deepEqual(p.commits[0].files, [{ path: "src/a.ts", add: 2, del: 1 }]);
  assert.match(p.commits[0].diff, /^diff --git/);
  const d = C.parseInput("diff --git a/x.js b/x.js\n--- a/x.js\n+++ b/x.js\n@@ -1 +1 @@\n-a\n+b\n");
  assert.equal(d.format, "diff");
  const r = C.createRelease({ content: "diff --git a/x.js b/x.js\n+b\n" });
  assert.ok(r.items[0].flags.includes("kaynaksiz"));
  const m = C.parseInput("\x1e" + "a".repeat(40) + "\x1fEce\x1f2026-11-05T10:00:00+03:00\x1f" + "b".repeat(40) + "\x1ffeat: dışa aktarma\x1fGövde\n\x1d\n5\t1\tsrc/x.ts\n");
  assert.equal(m.format, "git");
  assert.deepEqual(m.commits[0].files, [{ path: "src/x.ts", add: 5, del: 1 }]);
  assert.equal(m.commits[0].body, "Gövde");
  assert.throws(() => C.createRelease({ content: "bugün güzel bir gün\nyarın da" }), /Commit bulunamadı/);
});

test("sınıflandırma: Conventional Commits, Türkçe/İngilizce anahtar sözcük, dosya türü, kırıcı değişiklik", () => {
  const k = (subject, body, files) => C.classify({ subject, body: body || "", files: (files || []).map((path) => ({ path })) });
  assert.equal(k("feat(ui): koyu tema").cat, "ozellik");
  assert.equal(k("refactor!: yapı").cat, "kirici");
  assert.equal(k("Giriş ekranındaki çökme giderildi").cat, "duzeltme");
  assert.equal(k("Add CSV export").cat, "ozellik");
  assert.equal(k("Speed up startup").cat, "iyilestirme");
  assert.equal(k("Yeni sürüm", "").cat, "ozellik");
  assert.equal(k("Düzenleme", "", ["docs/kurulum.md"]).cat, "belge");
  assert.equal(k("Düzenleme", "", [".github/workflows/a.yml", "tests/a.test.js"]).cat, "bakim");
  assert.equal(k("Düzenleme").conf, "belirsiz");
  assert.equal(k("Değişiklik", "BREAKING CHANGE: eski API kaldırıldı").breaking, true);
  assert.deepEqual(k("Merge pull request #7 from x/y", "Başlık").prs, [7]);
});

test("depo bağlantıları: GitHub/GitLab/Bitbucket/Azure, ssh adresi, yalnız https", () => {
  assert.deepEqual(C.repoFromRemote("git@github.com:ornek/depo.git"), { base: "https://github.com/ornek/depo", host: "github" });
  assert.deepEqual(C.repoFromRemote("https://user:tok@gitlab.com/grup/depo.git"), { base: "https://gitlab.com/grup/depo", host: "gitlab" });
  assert.equal(C.repoFromRemote("ssh://git@bitbucket.org/ekip/depo.git").host, "bitbucket");
  assert.equal(C.repoFromRemote("javascript:alert(1)"), null);
  assert.equal(C.repoFromRemote("/yerel/klasor"), null);
  const gl = C.repoFromRemote("https://gitlab.com/grup/depo");
  assert.equal(C.commitUrl(gl, "abcdef1"), "https://gitlab.com/grup/depo/-/commit/abcdef1");
  assert.equal(C.prUrl(gl, 5), "https://gitlab.com/grup/depo/-/merge_requests/5");
  assert.equal(C.commitUrl(gl, "x; rm"), "");
  assert.throws(() => C.createRelease({ content: S.log, repoUrl: "ftp://x" }), /Depo adresi/);
});

test("çıktılar: Markdown (kullanıcı / Keep a Changelog), düz metin, JSON; her maddede commit bağlantısı; iç maddeler isteğe bağlı", () => {
  const r = sample();
  const md = C.renderMarkdown(r, {});
  assert.match(md, /^## 1\.4\.0 — 2026-11-06\n/);
  assert.match(md, /### Düzeltmeler\n\n- Takip numarasında boşluk olunca sorgu boş dönüyordu \(\[666e093\]\(https:\/\/github\.com\/ornek-ekip\/kargo-takip\/commit\/666e093[0-9a-f]+\), \[#40\]\(https:\/\/github\.com\/ornek-ekip\/kargo-takip\/pull\/40\)\)/);
  assert.doesNotMatch(md, /Axios|Bakım|Wip|Bildirim/);
  for (const line of md.split("\n").filter((l) => l.startsWith("- "))) assert.match(line, /\/commit\/[0-9a-f]{40}/, "her madde commit bağlantılı: " + line);
  assert.match(C.renderMarkdown(C.createRelease({ content: S.log, repoUrl: S.repoUrl, title: "1.4.0", internal: true }, S.BASE), {}), /### Bakım\n\n- Deps: Axios/);
  const kac = C.renderMarkdown(r, { template: "keepachangelog" });
  assert.match(kac, /^## \[1\.4\.0\] - 2026-11-06/);
  assert.match(kac, /### Added[\s\S]*### Changed[\s\S]*- \*\*BREAKING:\*\* Api[\s\S]*### Fixed[\s\S]*### Security/);
  const txt = C.renderText(r, {});
  assert.match(txt, /DÜZELTMELER\n• Takip numarasında .* \[666e093 https:\/\/github\.com/);
  const j = JSON.parse(C.renderJson(r, {}));
  assert.equal(j.depo, S.repoUrl);
  assert.ok(j.maddeler.every((m) => m.commitler.length && m.commitler[0].adres.startsWith("https://")));
  const esc = C.renderMarkdown({ ...r, items: [{ ...r.items[2], text: "a*b_[c]<img>", include: true }] }, {});
  assert.match(esc, /a\\\*b\\_\\\[c\\\]\\<img\\>/);
});

test("düzeltme ölçüsü: değişmeyen taslak %0, tamamen farklı %100", () => {
  assert.equal(C.editRatio("a b c d", "a b c d"), 0);
  assert.equal(C.editRatio("a b", "c d"), 100);
  assert.equal(C.editRatio("a b c d", "a b c x"), 25);
});

test("MyMind: istekte sır yok; yeni madde, olmayan kategori, kanıtsız iddia ve sır içeren öneri atılır", () => {
  const r = sample();
  const p = C.aiPayload(r);
  assert.doesNotMatch(JSON.stringify(p.messages), /AKIAIOSFODNN7EXAMPLE|ece@ornek|Ece Demir/);
  assert.ok(p.sent.items >= 10);
  const fix = r.items.find((x) => /Takip numarası/.test(x.text));
  const perf = r.items.find((x) => /sanal kaydırma/.test(x.text));
  const res = C.validateAi("```json\n" + JSON.stringify({ maddeler: [
    { id: fix.id, metin: "Takip numarasının başında/sonunda boşluk olsa da sorgu artık sonuç veriyor", kategori: "duzeltme" },
    { id: perf.id, metin: "Uzun sipariş listeleri %80 daha hızlı açılıyor", kategori: "iyilestirme" },
    { id: r.items[1].id, metin: "İade talebi oluşturulabiliyor; tüm testler geçti", kategori: "ozellik" },
    { id: r.items[4].id, metin: "Yeni kargo firmaları", kategori: "uydurma" },
    { id: "m99", metin: "Yeni: canlı takip haritası", kategori: "ozellik" },
    { id: r.items[5].id, metin: "Anahtar ghp_" + "a".repeat(36), kategori: "duzeltme" },
  ] }) + "\n```", r);
  assert.deepEqual(Object.keys(res.items).sort(), [fix.id, r.items[4].id].sort());
  assert.equal(res.items[r.items[4].id].cat, r.items[4].cat, "olmayan kategori yerine mevcut kategori");
  assert.equal(res.dropped, 5);
  assert.ok(res.droppedList.some((d) => /yeni madde eklenmez/.test(d)));
  assert.throws(() => C.validateAi("tamam", r), /JSON/);
});

test("kayıt biçimleri: bozuk veri temizlenir, ayarlar yalnız loopback yerel model", () => {
  assert.equal(C.normalizeSettings({ localUrl: "http://kotu.example" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeRelease({ commits: "x" }), null);
  const r = sample();
  const back = C.normalizeRelease(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(back.items, r.items.map((x) => C.normalizeItem(x)));
  assert.equal(C.renderMarkdown(back, {}), C.renderMarkdown(r, {}));
});
