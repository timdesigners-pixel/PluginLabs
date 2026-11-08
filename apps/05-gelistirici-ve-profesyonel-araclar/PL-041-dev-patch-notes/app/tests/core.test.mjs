import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

test("1. Git log metnini commit SHA, kategori ve kaynak bağlantılarıyla ayrıştırır", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  assert.equal(rel.items.length, 5);
  assert.equal(rel.items[0].shortSha, "a1b2c3d");
  assert.equal(rel.items[0].category, "ozellik");
  assert.equal(rel.items[0].commitUrl, "https://github.com/ornek-ekip/senkron-araci/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9012345678");
  assert.equal(rel.items[1].category, "duzeltme");
  assert.equal(rel.items[2].category, "guvenlik");
  assert.equal(rel.items[3].category, "kirici");
  assert.equal(rel.items[4].category, "dokumantasyon");
});

test("2. Tek satırlık git log --oneline listesini ayrıştırır", () => {
  const txt = "7f8e9a1 feat(ui): Karanlık tema düğmesi eklendi\n9a0b1c2 fix(ag): Zaman aşımı hatası giderildi";
  const rel = C.buildRelease(txt, { version: "v0.2.0" });
  assert.equal(rel.items.length, 2);
  assert.equal(rel.items[0].shortSha, "7f8e9a1");
  assert.equal(rel.items[1].category, "duzeltme");
});

test("3. Ham git diff metnini dosya bazında değişiklik maddelerine dönüştürür", () => {
  const diff = `diff --git a/src/auth.js b/src/auth.js
--- a/src/auth.js
+++ b/src/auth.js
@@ -1,3 +1,4 @@
+Oturum anahtarı doğrulaması eklendi`;
  const rel = C.buildRelease(diff, { version: "v0.3.0" });
  assert.equal(rel.items.length, 1);
  assert.match(rel.items[0].summary, /src\/auth\.js/);
});

test("4. Commit mesajlarındaki sızmış API anahtarlarını ve sırları yakalar ve maskeler", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  assert.ok(rel.stats.secretCount >= 1);
  assert.ok(!rel.items[2].summary.includes("sk-proj1234567890abcdefghij"));
  assert.ok(rel.items[2].summary.includes("[GİZLİ-ANAHTAR-MASKELENDİ]"));
});

test("5. Kanıtsız test geçişi ve performans artışı iddialarını otomatik temizler (uydurma iddia 0)", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const breaking = rel.items[3];
  assert.equal(breaking.strippedClaims.length, 2);
  assert.ok(!/tüm testler geçti/i.test(breaking.summary));
  assert.ok(!/performansta %80 artış/i.test(breaking.summary));
  assert.equal(rel.stats.fabricatedClaims, 0);
});

test("6. Kaynakta gerçek benchmark/test kanıtı varsa ifadeyi korur", () => {
  const withEvidence = `commit 1122334455667788990011223344556677889900
Author: Dev <d@ornek.com>
Date: 2026-11-07

    feat(cache): Önbellek индекsi ile performansta %40 artış sağlandı (benchmark: 120ms -> 72ms)`;
  const rel = C.buildRelease(withEvidence, { version: "v1.0.0" });
  assert.equal(rel.items[0].strippedClaims.length, 0);
  assert.match(rel.items[0].summary, /performansta %40 artış/);
});

test("7. Markdown ve Keep-a-Changelog dışa aktarmasında kaynak commit bağlantıları yer alır", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const trMd = C.exportMarkdown(rel, { style: "tr" });
  assert.match(trMd.markdown, /## Kırıcı Değişiklikler/);
  assert.match(trMd.markdown, /\[`a1b2c3d`\]\(https:\/\/github\.com\/ornek-ekip\/senkron-araci\/commit\/a1b2c3d/);
  const kacMd = C.exportMarkdown(rel, { style: "keepachangelog" });
  assert.match(kacMd.markdown, /## Added/);
  assert.match(kacMd.markdown, /## Fixed/);
});

test("8. JSON dışa aktarmada sızmış sır veya kanıtsız iddia bulunmaz", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const out = C.exportJson(rel);
  assert.ok(!out.json.includes("sk-proj1234567890abcdefghij"));
  assert.ok(!out.json.includes("tüm testler geçti"));
});

test("9. MyMind yükü sırları maskeler; doğrulayıcı uydurma SHA ve kanıtsız iddiaları reddeder", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const payload = C.aiPayload(rel);
  assert.ok(!JSON.stringify(payload.messages).includes("sk-proj1234567890abcdefghij"));
  const res = C.validateAi(JSON.stringify({
    overview: "Toplu dışa aktarma ve bağlantı kararlılığı sürümü.",
    items: [
      { sha: "a1b2c3d", category: "ozellik", summary: "Kullanıcılar artık tabloları topluca CSV ve JSON olarak dışa aktarabilir." },
      { sha: "b2c3d4e", category: "duzeltme", summary: "Ağ kesintisinde yeniden bağlanma hatası giderildi; tüm testler geçti." },
      { sha: "deadbeef", category: "ozellik", summary: "Uydurma commit maddesi." },
    ],
  }), rel);
  assert.equal(res.items.length, 2);
  assert.ok(res.dropped >= 2, "uydurma SHA ve kanıtsız test iddiası reddedilmeli");
  assert.ok(!res.items[1].summary.includes("tüm testler geçti"));
});

test("10. Doğrulama ölçütü: uydurma teslim iddiası sıfır ve editör düzeltme süresi kazanımı hesaplanır", () => {
  const rel = C.buildRelease(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const m = C.metrics([rel], {});
  assert.equal(m.fabricatedClaims, 0);
  assert.ok(m.editorTimeReductionEstimate >= 50);
});
