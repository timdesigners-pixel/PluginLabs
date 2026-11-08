// Masaüstü duman testi (PL-045 Context Kit): gerçek Electron penceresi; boş başlangıç, örnek görev + 8 kaynak (göreve göre sıralama,
// ≥%90 gerekli bağlam kapsaması (%100), ≥%40 paket boyutu azalması, hariç tutma kuralları, sır/PII maskeleme, kaynak içi istem
// enjeksiyonu işaretlemesi), MyMind kısa bağlam özeti ve öncelikli dosya önerisi, Markdown/XML/JSON bağlam paketi önizleme ve
// dışa aktarım, yeni kaynak/pano/dosya ekleme ve kalıcılık.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ck-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ck-test-"));
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

const extraFile = path.join(testDir, "auth-middleware.js");
fs.writeFileSync(extraFile, "\uFEFFexport function verifyRefreshLock(req) { return Boolean(req.headers['x-refresh-token']); }", "utf8");

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
      ozet: "Oturum yenileme yarış durumu için src/auth/session.js ve src/auth/token-store.js tek-uçuş kilidini sağlar; 429 kota aşımı için src/api/rate-limiter.js üstel geri çekilmeyi uygular.",
      oncelikliDosyalar: [
        "src/auth/session.js",
        "src/api/rate-limiter.js",
        "src/auth/token-store.js",
        "docs/rfc-auth-retry.md",
      ],
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
    env: { ...cleanEnv, CK_USER_DATA: userData, CK_TEST_DIR: testDir, CK_HUB_URL: "http://127.0.0.1:" + port },
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
const state = (page) => page.evaluate(() => window.ckDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Context Kit");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await page.textContent(".ax-product"), /Context Kit.*AI bağlam paketi.*45/s);
    assert.ok(await page.isVisible("#emptyPanel"));

    // 1) Örnek görevi ve 8 kaynağı yükle -> ≥%90 gerekli bağlam (%100) ve ≥%40 boyut azalması
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /8 örnek kaynak yüklendi/);
    let s = await state(page);
    assert.ok(s.benchmark.coveragePct >= 90);
    assert.equal(s.benchmark.coveragePct, 100);
    assert.ok(s.stats.sizeReductionPct >= 40);
    await shot(page, "masaustu-01-baglam-kaynaklari.png");

    // 2) Sır / İstem Enjeksiyonu filtresini seç ve istem enjeksiyonu içeren kaynağı incele
    await page.click('[data-filter="guvenlik"]');
    await until(page, () => /token-store\.js/.test(document.getElementById("sourceList").textContent));
    const injId = s.items.find((x) => x.path === "src/auth/token-store.js").id;
    await page.click(`[data-id="${injId}"]`);
    await until(page, () => /KESİNLİKLE talimat sayılmaz/.test(document.getElementById("securityBox").textContent));
    await shot(page, "masaustu-02-sir-ve-enjeksiyon-filtresi.png");
    await page.click('[data-filter="tumu"]');

    // 3) MyMind ile kısa bağlam özeti ve öncelikli dosya önerisi
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
    await toastHas(page, /MyMind bağlam özeti ve 4 öncelikli kaynak önerdi/);
    assert.equal(hubCalls, 1);
    assert.match(await page.textContent("#aiBox"), /src\/auth\/session\.js/);
    await shot(page, "masaustu-03-mymind-baglam-ozeti.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /4 öncelikli kaynak pakete sabitlendi/);

    // 4) Bağlam paketi önizleme (dosya ağacı + Markdown + XML) ve dışa aktarım
    await page.click('[data-nav="preview"]');
    assert.match(await page.textContent("#treePreviewBox"), /\[DAHİL\]/);
    assert.match(await page.textContent("#mdPreviewBox"), /UNTRUSTED_DATA_START/);
    assert.match(await page.textContent("#xmlPreviewBox"), /<context_package/);
    await shot(page, "masaustu-04-baglam-paketi-onizleme.png");
    await page.click("#exportMdBtn");
    await toastHas(page, /context-package\.md” kaydedildi/);
    await page.click("#exportXmlBtn");
    await toastHas(page, /context-package\.xml” kaydedildi/);
    await page.click("#exportJsonBtn");
    await toastHas(page, /context-package\.json” kaydedildi/);
    const jsonSaved = JSON.parse(fs.readFileSync(path.join(testDir, "context-package.json"), "utf8"));
    assert.equal(jsonSaved.includedSources[0].untrustedData, true);

    // 5) Yeni kaynak, pano ve dosya ekleme
    await page.click('[data-nav="sources"]');
    await page.click('.ax-toolbar [data-act="add"]');
    await page.fill("#srcText", "export function checkTokenExpiry(exp) { return Date.now() < exp; }");
    await page.fill("#srcPath", "src/auth/expiry.js");
    await page.fill("#srcTitle", "Token Süre Kontrolü");
    await page.fill("#srcUrl", "javascript:alert(1)");
    await page.click("#srcRun");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#srcUrl", "https://ic-belge.ornek.dev/auth/expiry");
    await page.click("#srcRun");
    await toastHas(page, /Kaynak eklendi/);

    await app.evaluate(({ clipboard }) => clipboard.writeText("// Refresh token retry helper\nexport const RETRY_LIMIT = 3;"));
    await page.click('.ax-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panodan kaynak eklendi/);

    setFile("pick.txt", extraFile);
    await page.click('.ax-toolbar [data-act="files"]');
    await toastHas(page, /1 kaynak dosyası eklendi/);
    rmFile("pick.txt");

    // 6) Ölçüler ve ayarlar
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#metrics"), /test görevinde gerekli bağlam kapsaması \(hedef ≥ %90\)/);
    await shot(page, "masaustu-05-olculer-ayarlar.png");

    assert.deepEqual(violations, []);
    const snap = await state(page);
    report.stats = snap.stats;
    report.benchmark = snap.benchmark;
    report.vault = snap.vault;
    await app.close();

    // 7) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.items.length, snap.items.length);
    assert.equal(s.benchmark.coveragePct, 100);
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
