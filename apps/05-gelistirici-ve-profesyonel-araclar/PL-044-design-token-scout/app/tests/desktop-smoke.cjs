// Masaüstü duman testi (PL-044 Design Token Scout): gerçek Electron penceresi; boş başlangıç, örnek 5 sayfa (computed style JSON + CSS,
// ≥%90 ana değer kapsama (%100), yakın değer kümelemesi ile tekrar azalması), MyMind semantik token hiyerarşisi önerisi ve uygulanması,
// W3C Design Tokens JSON ve CSS :root önizlemesi, kullanıcı onayıyla token JSON üretimi, yeni stil ekleme, pano, dosya ve kalıcılık.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dts-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "dts-test-"));
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

const cssFile = path.join(testDir, "tema.css");
fs.writeFileSync(cssFile, "\uFEFF.chip { color: #3ddc97; padding: 4px 8px; border-radius: 4px; }", "utf8");

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
      oneriler: [
        { id: "col-1", semanticRole: "color.surface.card" },
        { id: "col-2", semanticRole: "color.fg.primary" },
        { id: "col-3", semanticRole: "color.accent.brand" },
        { id: "space-2", semanticRole: "space.sm" },
        { id: "space-4", semanticRole: "space.md" },
      ],
      ozet: "Renkler yüzey/metin/vurgu katmanlarına, boşluklar sm/md ölçeğine ayrıldı.",
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
    env: { ...cleanEnv, DTS_USER_DATA: userData, DTS_TEST_DIR: testDir, DTS_HUB_URL: "http://127.0.0.1:" + port },
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
const state = (page) => page.evaluate(() => window.dtsDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Design Token Scout");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await page.textContent(".ax-product"), /Design Token Scout.*Token çıkarımı.*44/s);
    assert.ok(await page.isVisible("#emptyPanel"));

    // 1) Örnek 5 sayfa yükle -> ≥%90 kapsama (%100) ve yakın değer kümelemesi
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /5 örnek sayfa yüklendi/);
    let s = await state(page);
    assert.ok(s.coverage.coveragePct >= 90);
    assert.equal(s.coverage.coveragePct, 100);
    assert.ok(s.stats.duplicationReductionPct > 15);
    await shot(page, "masaustu-01-token-adaylari.png");

    // 2) Boşluk kategorisini süz -> 16px (15px kümelenmiş) görünür
    await page.click('[data-cat="spacing"]');
    await until(page, () => /space\.4/.test(document.getElementById("tokenList").textContent));
    await shot(page, "masaustu-02-bosluk-kumeleme.png");
    await page.click('[data-cat="tumu"]');

    // 3) MyMind ile semantik token hiyerarşisi önerisi ve uygulanması
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind 5 semantik token rolü önerdi/);
    assert.equal(hubCalls, 1);
    assert.match(await page.textContent("#aiBox"), /color\.surface\.card/);
    await shot(page, "masaustu-03-mymind-hiyerarsi.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /5 tokena semantik rol uygulandı/);

    // 4) W3C Design Tokens JSON / CSS :root önizleme ve kullanıcı onayıyla üretim
    await page.click('[data-nav="preview"]');
    assert.match(await page.textContent("#w3cPreviewBox"), /"\$value"/);
    assert.match(await page.textContent("#cssPreviewBox"), /--color-surface-card/);
    await shot(page, "masaustu-04-w3c-json-onizleme.png");
    await page.click("#exportJsonBtn");
    await toastHas(page, /design-tokens\.w3c\.json” kaydedildi/);
    await page.click("#exportCssBtn");
    await toastHas(page, /tokens\.css” kaydedildi/);
    await page.click("#exportMdBtn");
    await toastHas(page, /design-token-scout\.md” kaydedildi/);
    const w3cSaved = JSON.parse(fs.readFileSync(path.join(testDir, "design-tokens.w3c.json"), "utf8"));
    assert.equal(w3cSaved.color.surface.card.$type, "color");

    // 5) Yeni stil, pano ve dosya ekleme
    await page.click('[data-nav="tokens"]');
    await page.click('.ax-toolbar [data-act="add"]');
    await page.fill("#srcText", ".hero { color: #f3f6fc; font-size: 20px; padding: 24px; }");
    await page.fill("#srcTitle", "Hero Bölümü");
    await page.fill("#srcUrl", "javascript:alert(1)");
    await page.click("#srcRun");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#srcUrl", "https://uygulama-ornek.com/hero");
    await page.click("#srcRun");
    await toastHas(page, /3 stil gözlemi eklendi/);

    await app.evaluate(({ clipboard }) => clipboard.writeText(".footer { background: #0e1322; padding: 16px; }"));
    await page.click('.ax-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panodan 2 stil gözlemi eklendi/);

    setFile("pick.txt", cssFile);
    await page.click('.ax-toolbar [data-act="files"]');
    await toastHas(page, /1 stil dosyası eklendi/);
    rmFile("pick.txt");

    // 6) Ölçüler ve ayarlar
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#metrics"), /5 sayfada ana değer kapsama \(hedef ≥ %90\)/);
    await shot(page, "masaustu-05-olculer-ayarlar.png");

    assert.deepEqual(violations, []);
    const snap = await state(page);
    report.stats = snap.stats;
    report.coverage = snap.coverage;
    report.vault = snap.vault;
    await app.close();

    // 7) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.candidates.length, snap.candidates.length);
    assert.equal(s.coverage.coveragePct, 100);
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
