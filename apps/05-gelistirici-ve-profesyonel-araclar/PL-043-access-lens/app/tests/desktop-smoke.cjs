// Masaüstü duman testi (PL-043 Access Lens): gerçek Electron penceresi; boş başlangıç, örnek fixture'lar (4 kesit, %100 duyarlılık,
// kritik yanlış olumlu %0), sorun seçildiğinde ilgili öğenin ve satır numarasının vurgulanması, kural motoru ve sertifika uyarısı,
// HTML/CSS kesiti penceresi, panodan denetim, .html dosyasından denetim, düzeltme uygulama, MyMind ile sade açıklama ve düzeltme
// taslağı (veri maskeleme, onay/red), manuel klavye/ekran okuyucu kontrol listesi, ölçüler ve dışa aktarma (MD, CSV, JSON), kalıcılık.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "al-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "al-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00.000Z";

const htmlFile = path.join(testDir, "bilesen.html");
fs.writeFileSync(htmlFile, "\uFEFF<html lang=\"tr\"><body><main><h1>Bileşen</h1><img src=\"ikon.png\"></main></body></html>", "utf8");

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    const content = "```json\n" + JSON.stringify({
      aciklama: "Görselde alt özniteliği olmadığı için ekran okuyucu görselin amacını aktaramaz.",
      duzeltme: "<img src=\"/assets/kampanya-banner.png\" alt=\"Sonbahar indirim kampanyası\">",
      manuelKontrol: "NVDA veya VoiceOver ile görselin alternatif metninin okunduğunu doğrulayın.",
    }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function launch(port) {
  const cleanEnv = { ...process.env };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...cleanEnv, AL_USER_DATA: userData, AL_TEST_DIR: testDir, AL_HUB_URL: "http://127.0.0.1:" + port, AL_NOW: NOW },
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
const state = (page) => page.evaluate(() => window.alDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Access Lens");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await page.textContent(".ax-product"), /Access Lens.*WCAG 2\.2 denetimi.*43/s);
    assert.ok(await page.isVisible("#emptyPanel"));

    // 1) Örnek fixture'lar yükle ve doğrulama ölçütünü kontrol et
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /4 örnek fixture denetlendi · 11 bulgu bulundu/);
    let s = await state(page);
    assert.equal(s.gold.recall, 100);
    assert.equal(s.gold.criticalFalsePositives, 0);
    assert.match(await page.textContent("#disclaimerBanner"), /sertifikası değildir/);
    assert.match(await page.textContent("#highlightedSource .ax-code-line.is-hit"), /kampanya-banner\.png/);
    await shot(page, "masaustu-01-denetim-ve-oge.png");

    // 2) Kontrast bulgusunu seç -> renk örneği ve oran görünür
    await page.click('#issueList .ax-item[data-rule="WCAG-1.4.3-CONTRAST-AA"]');
    await until(page, () => /Oran 2\.54:1/.test(document.getElementById("issueDetail").textContent));
    await shot(page, "masaustu-02-kontrast-ve-kaynak.png");

    // 3) MyMind ile sade açıklama ve düzeltme taslağı
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click('#issueList .ax-item[data-rule="WCAG-1.1.1-IMG-ALT"]');
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind sade açıklaması ve düzeltme taslağı hazır/);
    assert.equal(hubCalls, 1);
    assert.match(await page.textContent("#aiBox"), /ekran okuyucu görselin amacını aktaramaz/);
    await shot(page, "masaustu-03-mymind-aciklama.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /MyMind düzeltme taslağı uygulandı/);

    // 4) Yeni kesit, pano ve dosya denetimi
    await page.click('.ax-toolbar [data-act="snippet"]');
    await page.fill("#snipSource", "<button type=\"button\"></button>");
    await page.fill("#snipTitle", "Simge Düğmesi");
    await page.fill("#snipUrl", "javascript:alert(1)");
    await page.click("#snipRun");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#snipUrl", "https://ornek.com/dugme");
    await page.click("#snipRun");
    await toastHas(page, /Denetim tamamlandı: 1 bulgu/);

    await app.evaluate(({ clipboard }) => clipboard.writeText("<input type=\"text\" placeholder=\"Ara\">"));
    await page.click('.ax-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panodan denetim tamamlandı: 1 bulgu/);

    setFile("pick.txt", htmlFile);
    await page.click('.ax-toolbar [data-act="files"]');
    await toastHas(page, /1 dosya denetlendi \(1 bulgu\)/);
    rmFile("pick.txt");

    // 5) Manuel klavye ve ekran okuyucu kontrol listesi
    await page.click('[data-nav="manual"]');
    await page.check('input[data-manual="kbd-reach"]');
    await toastHas(page, /Manuel kontrol tamamlandı/);
    await shot(page, "masaustu-04-manuel-kontroller.png");

    // 6) Ölçüler, ayarlar ve dışa aktarma
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#metrics"), /kritik yanlış olumlu \(hedef < %5\)/);
    assert.match(await page.textContent("#goldInfo"), /AccessLens-Rules 1\.0\.0/);
    await shot(page, "masaustu-05-olculer-ayarlar.png");

    await page.click("#mdBtn");
    await toastHas(page, /access-lens-rapor\.md” kaydedildi/);
    await page.click("#csvBtn");
    await toastHas(page, /access-lens\.csv” kaydedildi/);
    await page.click("#backupBtn");
    await toastHas(page, /access-lens-yedek\.json” kaydedildi/);
    assert.match(fs.readFileSync(path.join(testDir, "access-lens-rapor.md"), "utf8"), /Sertifika Değildir/);
    assert.match(fs.readFileSync(path.join(testDir, "access-lens.csv"), "utf8"), /AccessLens-Rules 1\.0\.0/);

    assert.deepEqual(violations, []);
    const snap = await state(page);
    report.metrics = snap.metrics;
    report.gold = snap.gold;
    report.vault = snap.vault;
    await app.close();

    // 7) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.audits.length, snap.audits.length);
    assert.equal(s.metrics.manualDone, 1);
    assert.deepEqual(violations, []);
    await app.close();

    console.log(JSON.stringify(report, null, 2));
    console.log("DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform + " · electron " + require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version);
  } catch (err) {
    console.error(err);
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
