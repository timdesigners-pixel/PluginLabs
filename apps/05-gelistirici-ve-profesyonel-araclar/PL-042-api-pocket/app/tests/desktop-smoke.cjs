// Masaüstü duman testi — PL-042 API Pocket: gerçek Electron penceresi; istek şablonları, ortam değişkenleri ({{BASE_URL}}, {{API_KEY}}),
// kasadaki sırların günlüklerde ve dışa aktarmada sıfır sızıntısı, GET ve POST (yazma önizleme onaylı) istek yürütmesi, yanıt biçimleme,
// MyMind onaylı alan açıklamaları.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const SAMPLE = require("../src/sample.js");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ap-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ap-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const KEY = "test-istemci-anahtari-1234567890";

let apiCalls = 0, hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.url === "/v1/chat/completions") {
      hubCalls++;
      const content = JSON.stringify({
        summary: "Proje durumu ve kalan saatlik istek kotasını döndüren uç.",
        explanations: [
          { path: "status", explanation: "Servisin anlık sağlık durumu (healthy = aktif)." },
          { path: "rate_limit", explanation: "Saatlik kalan toplam API çağrı kotası." },
          { path: "uydurma_alan", explanation: "Yanıtta olmayan uydurma alan." },
        ],
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }));
      return;
    }
    apiCalls++;
    // Gerçek istekte Authorization başlığında kasa sırrının çözüldüğünü doğrula
    const auth = req.headers.authorization || "";
    const hasValidSecret = auth === "Bearer " + SAMPLE.sampleSecretValue;
    res.writeHead(hasValidSecret ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      id: "pl-katalog-2026",
      status: hasValidSecret ? "healthy" : "unauthorized",
      rate_limit: 1199,
      created_at: "2026-11-07T12:30:00Z",
      items: [{ id: "hook-1", is_active: true, total: 1 }],
    }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function launch(port) {
  const cleanEnv = {
    ...process.env,
    AP_USER_DATA: userData,
    AP_TEST_DIR: testDir,
    AP_HUB_URL: "http://127.0.0.1:" + port,
    AP_TEST_API_URL: "http://127.0.0.1:" + port,
  };
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
const state = (page) => page.evaluate(() => window.apDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "API Pocket");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    await shot(page, "masaustu-01-istek-ve-yanit.png");

    // 1) GET isteğini gönder ve kasa sırrının ağda çözülüp günlükte maskelendiğini doğrula
    await page.click("#sendReqBtn");
    await toastHas(page, /Yanıt alındı: HTTP 200/);
    assert.equal(apiCalls, 1);
    const reqLog = readLog("request-log.txt");
    assert.ok(!reqLog.includes(SAMPLE.sampleSecretValue), "kasa sırrı günlükte asla görünmemeli");
    assert.match(reqLog, /⟦GİZLİ:API_KEY⟧/);

    // 2) MyMind ile yanıt alanlarını açıkla (uydurma alan reddedilir)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click("#aiBtn");
    await toastHas(page, /MyMind alan açıklamaları hazır · 1 uydurma alan reddedildi/);
    assert.equal(hubCalls, 1);
    const aiSent = readLog("ai-sent.json");
    assert.ok(!aiSent.includes(SAMPLE.sampleSecretValue), "kasa sırrı modele gönderilmemeli");
    await shot(page, "masaustu-02-mymind-alan-aciklama.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /MyMind alan açıklamaları uygulandı/);

    // 3) POST (yazma yöntemi) şablonunu seç ve ek önizleme onayını doğrula
    await page.click('#reqList .ap-item[data-id="req-webhook-kayit"]');
    await until(page, () => /Yazma yöntemi/.test(document.getElementById("reqDetail").textContent));
    await page.click("#sendReqBtn");
    await toastHas(page, /Yanıt alındı: HTTP 200/);
    assert.equal(apiCalls, 2);
    const approvals = readLog("approvals.txt");
    assert.match(approvals, /POST yazma isteği gönderilsin mi\?/);
    assert.ok(!approvals.includes(SAMPLE.sampleSecretValue), "onay günlüğünde de sır açık yazılmaz");
    await shot(page, "masaustu-03-yazma-onizleme-yanit.png");

    // 4) Ortam değişkenleri ve kasa görünümü
    await page.click('[data-nav="env"]');
    await until(page, () => document.querySelectorAll("#envWrap .ap-envrow").length >= 3);
    await shot(page, "masaustu-04-ortam-ve-kasa.png");

    // 5) cURL, Markdown ve Koleksiyon dışa aktarma (0 sır sızıntısı)
    await page.click('[data-nav="requests"]');
    await page.click("#curlBtn");
    await toastHas(page, /Maskeli cURL komutu panoya kopyalandı/);
    await page.click("#exportMdBtn");
    await toastHas(page, /api-pocket-koleksiyon\.md” kaydedildi/);
    await page.click("#exportColBtn");
    await toastHas(page, /api-pocket-koleksiyon\.json” kaydedildi/);
    const mdOut = fs.readFileSync(path.join(testDir, "api-pocket-koleksiyon.md"), "utf8");
    const jsonOut = fs.readFileSync(path.join(testDir, "api-pocket-koleksiyon.json"), "utf8");
    assert.ok(!mdOut.includes(SAMPLE.sampleSecretValue));
    assert.ok(!jsonOut.includes(SAMPLE.sampleSecretValue));

    // 6) Ölçüler ve ayarlar
    await page.click('[data-nav="settings"]');
    let s = await state(page);
    assert.equal(s.metrics.secretLeaksInLogs, 0);
    await shot(page, "masaustu-05-olculer-ayarlar.png");

    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform);
  } catch (err) {
    console.error(err);
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
