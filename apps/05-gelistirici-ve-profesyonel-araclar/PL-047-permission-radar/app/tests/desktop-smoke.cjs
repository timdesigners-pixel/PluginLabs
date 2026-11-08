// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek eklenti envanteri, okunabilir Türkçe izin kartları,
// bilinmeyen kapsamın açık etiketlenmesi (%100), manifest.json sürüm güncellemesi ve değişim geçmişi (+yeni eklenen izinler),
// Chrome yönetim ekranına yönlendirme, MyMind izin açıklaması (zararlı yazılım tespiti iddiası taşımaz; sahte virüs iddiası filtrelenir),
// CSV ve Markdown politika raporu dışa aktarma, CSP/izin kontrolü ve kalıcılık.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "pr-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "pr-test-"));
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
      ozet: "Bu eklenti tüm web sitelerindeki sayfa verilerini ve oturum çerezlerini okuyabilir; ayrıca 1 bilinmeyen kapsam içeriyor.",
      maddeler: [
        "cookies ve <all_urls> birlikte kullanıldığında ziyaret ettiğiniz sitelerdeki oturum bilgilerine erişilebilir.",
        "experimentalPrivateTelemetry standart izin sözlüğünde yer almayan bilinmeyen bir kapsamdır.",
        "Zararlı yazılım tespit edildi!",
      ],
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
  const cleanEnv = { ...process.env, PR_USER_DATA: userData, PR_TEST_DIR: testDir, PR_HUB_URL: "http://127.0.0.1:" + port };
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
const state = (page) => page.evaluate(() => window.prDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "Permission Radar");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek eklenti envanteri yükle, Fiyat Takip Asistanı'nı seç ve izin kartlarını doğrula
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 test eklentisi ve sürüm değişim geçmişi yüklendi/);
    let s = await state(page);
    assert.equal(s.items.length, 3);
    assert.equal(s.metrics.accuracyPct, 100);
    assert.equal(s.metrics.unknownLabeledPct, 100);
    await page.click('[data-id="ext-fiyat-takip"]');
    await shot(page, "masaustu-01-izin-kartlari.png");

    // 2) Chrome yönetim ekranına yönlendirme
    await page.click("#chromeManageBtn");
    await toastHas(page, /chrome:\/\/extensions\/\?id=ext-fiyat-takip/);

    // 3) MyMind ile izinleri açıkla (zararlı yazılım iddiası filtrelenir)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);

    await page.click("#aiExplainBtn");
    await until(page, () => !!document.getElementById("aiBox"));
    assert.equal(hubCalls, 1);
    await shot(page, "masaustu-02-mymind-izin-aciklamasi.png");

    // 4) Yeni manifest.json sürümü incele ve sürüm değişim geçmişini görüntüle
    await page.click("#openInspectModal");
    await page.click("#inspectRunBtn");
    await toastHas(page, /Eklenti sürümü güncellendi/);
    await page.click('[data-nav="changes"]');
    s = await state(page);
    assert.equal(s.metrics.totalDiffs, 2);
    await shot(page, "masaustu-03-degisim-gecmisi.png");

    // 5) Doğruluk ölçütleri ve politika raporu dışa aktarma
    await page.click('[data-nav="settings"]');
    await shot(page, "masaustu-04-dogruluk-ve-politika.png");
    await page.click("#csvBtn");
    await toastHas(page, /permission-radar-envanter\.csv” kaydedildi/);
    await page.click("#mdBtn");
    await toastHas(page, /permission-radar-politika-raporu\.md” kaydedildi/);
    assert.ok(fs.existsSync(path.join(testDir, "permission-radar-envanter.csv")));
    assert.ok(fs.existsSync(path.join(testDir, "permission-radar-politika-raporu.md")));
    assert.deepEqual(violations, []);
    await app.close();

    // 6) Kalıcılık kontrolü
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.items.length, 3);
    assert.equal(s.metrics.totalDiffs, 2);
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
