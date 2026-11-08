// Masaüstü duman testi — PL-041 Dev Patch Notes: gerçek Electron penceresi; git log/diff içe alma, kategoriye ayırma, kaynak commit
// bağlantıları, sızmış API anahtarı maskeleme, kanıtsız test geçişi ve performans artışı iddialarının engellenmesi, MyMind onaylı özet.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dpn-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "dpn-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const KEY = "test-istemci-anahtari-1234567890";

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const content = JSON.stringify({
      overview: "Toplu dışa aktarma, yeniden bağlanma kararlılığı ve güvenlik sıkılaştırmaları.",
      items: [
        { sha: "a1b2c3d", category: "ozellik", summary: "Tabloları tek tıkla CSV ve JSON olarak topluca dışa aktarma penceresi eklendi." },
        { sha: "b2c3d4e", category: "duzeltme", summary: "Ağ kesildiğinde yaşanan yeniden bağlanma döngüsü hatası giderildi; tüm testler geçti." },
        { sha: "dead999", category: "ozellik", summary: "Uydurma commit maddesi." },
      ],
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function launch(port) {
  const cleanEnv = { ...process.env, DPN_USER_DATA: userData, DPN_TEST_DIR: testDir, DPN_HUB_URL: "http://127.0.0.1:" + port };
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
const state = (page) => page.evaluate(() => window.dpnDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "Dev Patch Notes");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-01-baslangic.png");

    // 1) Örnek sürümü yükle (5 commit, 1 sızmış API anahtarı, 2 kanıtsız iddia otomatik temizlendi)
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /1 örnek sürüm yüklendi/);
    let s = await state(page);
    assert.equal(s.releases.length, 1);
    assert.equal(s.metrics.fabricatedClaims, 0);
    assert.ok(s.metrics.secrets >= 1);
    assert.ok(s.metrics.blockedClaims >= 2);
    await shot(page, "masaustu-02-surum-duzenleyici.png");

    // 2) Kullanıcı elle kanıtsız "tüm testler geçti" yazmaya çalışırsa engellenir
    const firstInput = page.locator(".item-sum-input").first();
    await firstInput.fill("Toplu dışa aktarma eklendi; tüm testler geçti");
    await page.locator("[data-save]").first().click();
    await toastHas(page, /Kanıtsız teslim iddiası engellendi/);

    // 3) MyMind ile kullanıcı diline çevirme (sırlar gönderilmez, uydurma SHA ve kanıtsız iddia atılır)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click("#aiBtn");
    await toastHas(page, /MyMind sürüm notu taslağı hazır · 2 uydurma\/kanıtsız öğe reddedildi/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    assert.ok(!sent.includes("sk-proj1234567890abcdefghij"), "sızmış anahtar modele gönderilmemeli");
    await shot(page, "masaustu-03-mymind-taslak.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /MyMind sürüm notu taslağı uygulandı/);

    // 4) Sır ve iddia denetimi görünümü
    await page.click('[data-nav="audit"]');
    await until(page, () => document.querySelectorAll("#auditWrap .dpn-auditcard").length >= 3);
    await shot(page, "masaustu-04-sir-ve-iddia-denetimi.png");

    // 5) Markdown ve JSON dışa aktarma
    await page.click('[data-nav="editor"]');
    await page.click("#exportMdBtn");
    await toastHas(page, /SURUM-NOTLARI-v1\.4\.0\.md” kaydedildi/);
    await page.click("#exportJsonBtn");
    await toastHas(page, /surum-notlari-v1\.4\.0\.json” kaydedildi/);
    const mdContent = fs.readFileSync(path.join(testDir, "SURUM-NOTLARI-v1.4.0.md"), "utf8");
    assert.match(mdContent, /\[`a1b2c3d`\]\(https:\/\/github\.com\/ornek-ekip\/senkron-araci\/commit\/a1b2c3d/);
    assert.ok(!mdContent.includes("sk-proj1234567890abcdefghij"));
    assert.ok(!mdContent.includes("tüm testler geçti"));

    // 6) Ölçüler ve ayarlar
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#metrics"), /uydurma teslim iddiası/);
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
