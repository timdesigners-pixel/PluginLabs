import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import S from "../src/sample.js";

test("1. Bilinen izinler doğru Türkçe açıklamaya ve kategoriye dönüştürülür", () => {
  const c1 = C.explainPermission("cookies", "permission");
  assert.equal(c1.known, true);
  assert.equal(c1.unknownScopeLabeled, false);
  assert.equal(c1.category, "oturum");
  assert.equal(c1.level, "kritik");

  const c2 = C.explainPermission("<all_urls>", "host");
  assert.equal(c2.known, true);
  assert.equal(c2.category, "alan_adi");
  assert.equal(c2.level, "kritik");
});

test("2. Bilinmeyen izin kapsamları açıkça 'Bilinmeyen kapsam' olarak etiketlenir (Notion doğrulama ölçütü)", () => {
  const unk = C.explainPermission("experimentalPrivateTelemetry", "permission");
  assert.equal(unk.known, false);
  assert.equal(unk.unknownScopeLabeled, true);
  assert.match(unk.title, /^Bilinmeyen kapsam:/);
  assert.match(unk.meaning, /Bilinmeyen kapsam/);
});

test("3. İsteğe bağlı (optional_permissions) izinler çalışma anı onayı notuyla ayrıştırılır", () => {
  const opt = C.explainPermission("clipboardWrite", "optional");
  assert.equal(opt.known, true);
  assert.equal(opt.kind, "optional");
  assert.match(opt.meaning, /İsteğe bağlı izin/);
});

test("4. Manifest.json ayrıştırması zararlı yazılım tespiti iddiası taşımaz ve iç veri erişimi varsaymaz", () => {
  const card = C.parseManifestToCard({
    manifest_version: 3,
    name: "Test Eklentisi",
    version: "1.0.0",
    permissions: ["activeTab", "storage", "unknownPermX"],
    host_permissions: ["https://*.ornek.com/*"],
  }, { id: "ext-test" });

  assert.equal(card.malwareClaim, false);
  assert.equal(card.internalDataAccessed, false);
  assert.match(card.disclaimer, /zararlı yazılım tespiti yaptığı iddiası taşımaz/);
  assert.equal(card.unknownCount, 1);
  assert.equal(card.chromeManageUrl, "chrome://extensions/?id=ext-test");
});

test("5. Sürümler arası izin değişim geçmişi yeni eklenen ve kaldırılan izinleri doğru hesaplar", () => {
  const v1 = C.parseManifestToCard({ name: "Eklenti", version: "1.0.0", permissions: ["storage"] }, { id: "e1" });
  const v2 = C.parseManifestToCard({ name: "Eklenti", version: "1.1.0", permissions: ["storage", "cookies"], host_permissions: ["<all_urls>"] }, { id: "e1" });
  const diff = C.computePermissionDiff(v1, v2);
  assert.equal(diff.fromVersion, "1.0.0");
  assert.equal(diff.toVersion, "1.1.0");
  assert.equal(diff.added.length, 2);
  assert.equal(diff.removed.length, 0);
  assert.match(diff.summary, /\+2 yeni izin eklendi/);
});

test("6. upsertExtensionManifest aynı eklentinin yeni sürümünü günceller ve geçmişe ekler", () => {
  const list = S.buildSampleInventory();
  const fiyat = list.find((x) => x.id === "ext-fiyat-takip");
  assert.equal(fiyat.version, "1.3.0");
  assert.equal(fiyat.history.length, 1);
  assert.equal(fiyat.history[0].added.length, 4);
});

test("7. Test eklentilerinde izin açıklaması doğruluğu ve bilinmeyen kapsam etiketlemesi %100'dür", () => {
  const list = S.buildSampleInventory();
  const gold = C.evaluateGoldAccuracy(list, S.GOLD_CHECKS);
  assert.equal(gold.accuracyPct, 100);
  assert.equal(gold.unknownLabeledPct, 100);
});

test("8. AI izin açıklaması doğrulaması zararlı yazılım / virüs iddialarını temizler", () => {
  const list = S.buildSampleInventory();
  const raw = JSON.stringify({
    ozet: "Bu eklenti kesinlikle zararlı ve trojan içeriyor.",
    maddeler: ["cookies: Oturum çerezlerini okuyabilir.", "Zararlı yazılım tespit edildi!"],
  });
  const res = C.validateAiExplanation(raw, list[0]);
  assert.equal(res.droppedMalwareClaims, 2);
  assert.ok(!/trojan|kesinlikle zararlı/i.test(res.summary));
  assert.equal(res.bullets.length, 1);
});

test("9. CSV ve Markdown politika raporu formül enjeksiyonunu engeller ve sorumluluk sınırını içerir", () => {
  const list = S.buildSampleInventory();
  const gold = C.evaluateGoldAccuracy(list, S.GOLD_CHECKS);
  const m = C.metrics(list, {}, gold);
  const csv = C.exportCsv(list);
  assert.match(csv, /Bilinmeyen kapsam/);
  const md = C.exportMd(list, m);
  assert.match(md, /zararlı yazılım tespiti yaptığı iddiası taşımaz/);
  assert.match(md, /chrome:\/\/extensions\/\?id=ext-fiyat-takip/);
});

test("10. Yerel model sunucusu yalnız loopback adreslerini kabul eder", () => {
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:1234"), true);
  assert.equal(C.isLoopbackUrl("https://evil.example.com"), false);
});
