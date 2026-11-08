// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek benchmark yükleme, yan yana iki sağlayıcı karşılaştırması,
// %100 maliyet görünürlüğü, tarihli katalog ve resmi API anahtarı kasası (tüketici web çerezi reddi), kullanıcı bütçe tavanı
// aşımının engellenmesi (aşım hedefi 0), kayıtlı test sonuçlarına bağlı MyMind model önerisi (ve uydurma test kimliğinin atılması),
// CSV/Markdown/JSON dışa aktarma, CSP/izin kontrolü ve kalıcılık.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ms-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ms-test-"));
const KEY = "test-istemci-anahtari-1234567890";

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && auth === "Bearer " + KEY;
    const content = JSON.stringify({
      onerilenModel: "anthropic:claude-3-5-sonnet",
      gerekce: "Kodlama görevlerinde kayıtlı bench-01 testinde en yüksek yapısal kalite puanını (100/100) üretti.",
      kanitTestIdleri: ["bench-01", "uydurma-test-99"],
    });
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 400) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function launch(port) {
  const cleanEnv = { ...process.env, MS_USER_DATA: userData, MS_TEST_DIR: testDir, MS_HUB_URL: "http://127.0.0.1:" + port };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: cleanEnv,
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => {
  if (shots) {
    await page.evaluate(() => document.getElementById("toasts").replaceChildren());
    fs.mkdirSync(shots, { recursive: true });
    await page.screenshot({ path: path.join(shots, name) });
  }
};
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.msDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "Model Switchboard");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek benchmarkları yükle ve yan yana karşılaştırmayı doğrula
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek karşılaştırma görevi yüklendi/);
    let s = await state(page);
    assert.equal(s.runs.length, 3);
    assert.equal(s.metrics.costVisibilityPct, 100);
    assert.equal(s.metrics.budgetOverruns, 0);
    await shot(page, "masaustu-01-yan-yana-karsilastirma.png");

    // 2) Yeni karşılaştırma görevi ekle
    await page.click("#openNewCompare");
    await page.fill("#cmpTitle", "REST API hata yanıtı şeması doğrulaması");
    await page.fill("#cmpPrompt", "400 ve 429 durum kodları için fonksiyon, hata şeması ve birim test örneği üretin.");
    await page.click("#cmpRunBtn");
    await toastHas(page, /Yan yana karşılaştırma tamamlandı/);
    s = await state(page);
    assert.equal(s.runs.length, 4);
    assert.equal(s.metrics.costVisibilityPct, 100);

    // 3) Katalog ve resmi API anahtarı (tüketici çerezi reddi)
    await page.click('[data-nav="catalog"]');
    await page.fill("#openaiKey", "__Secure-session=cookie_degeri; Path=/");
    await page.click("#openaiSave");
    await toastHas(page, /Tüketici web hesabı çerezi/);
    await page.fill("#openaiKey", "sk-proj-ResmiOpenAIAnahtari1234567890");
    await page.click("#openaiSave");
    await toastHas(page, /OpenAI resmi API anahtarı kaydedildi/);
    await shot(page, "masaustu-02-katalog-ve-anahtarlar.png");

    // 4) Görev türüne göre model önerisi ve MyMind bağlantısı
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);

    await page.click('[data-nav="advisor"]');
    await page.click("#askAdvisorAiBtn");
    await toastHas(page, /MyMind model önerisi hazır: Claude 3\.5 Sonnet \(1 uydurma öğe atıldı\)/);
    assert.equal(hubCalls, 1);
    await shot(page, "masaustu-03-gorev-model-onerisi.png");

    // 5) Kullanıcı bütçe tavanı aşımının engellenmesi (hedef: 0 aşım)
    await page.click('[data-nav="settings"]');
    await page.fill("#budgetCapInput", "0.0001");
    await page.click("#saveBudgetBtn");
    await toastHas(page, /Kullanıcı bütçe tavanı/);

    await page.click('[data-nav="arena"]');
    await page.click("#openNewCompare");
    await page.fill("#cmpPrompt", "Bütçe tavanını aşacak uzun bir görev istemi.");
    await page.click("#cmpRunBtn");
    await toastHas(page, /Bütçe tavanı aşımı engellendi/);
    await page.click("#cmpCancel");

    await page.click('[data-nav="settings"]');
    s = await state(page);
    assert.equal(s.metrics.budgetOverruns, 0);
    assert.equal(s.metrics.preventedOverruns, 1);
    assert.equal(s.metrics.rejectedCookies, 1);
    await shot(page, "masaustu-04-butce-ve-olculer.png");

    // 6) CSV ve Markdown dışa aktarma
    await page.click("#csvBtn");
    await toastHas(page, /model-switchboard-karsilastirma\.csv” kaydedildi/);
    await page.click("#mdBtn");
    await toastHas(page, /model-switchboard-rapor\.md” kaydedildi/);
    assert.ok(fs.existsSync(path.join(testDir, "model-switchboard-karsilastirma.csv")));
    assert.ok(fs.existsSync(path.join(testDir, "model-switchboard-rapor.md")));
    assert.deepEqual(violations, []);
    await app.close();

    // 7) Kalıcılık kontrolü
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.runs.length, 4);
    assert.equal(s.metrics.preventedOverruns, 1);
    assert.equal(s.providerKeys.openai, true);
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform + " · electron " + require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version);
  } catch (err) {
    console.error(err);
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
