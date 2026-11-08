// Masaüstü duman testi (PL-048 Offline Aid): gerçek Electron penceresi; boş başlangıç, örnek çevrimdışı metin görevlerini yükleme,
// modelsiz kural tabanlı motorla ağsız görev tamamlama, cihaz kaynak kontrolü ve onaylı yerel model ailesinin (lisans, RAM/VRAM, güncelleme kaynağı)
// görünmesi, yerel model (loopback) çıkarımı ve hassas veri maskeleme, dış ağ adresinin engellenmesi, donanım bazlı gecikme raporu ve dışa aktarma.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
delete process.env.ELECTRON_RUN_AS_NODE;
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "oa-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "oa-test-"));
const KEY = "test-istemci-anahtari-1234567890";

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && auth === "Bearer " + KEY;
    const content = "📌 Yerel Qwen 2.5 1.5B Özeti:\n• Trafo yedek güç ünitesi kritik eşik içinde doğrulandı.\n• Cuma gününe kadar batarya blokları yenilenecek.";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 400) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function launch(port) {
  const cleanEnv = { ...process.env, OA_USER_DATA: userData, OA_TEST_DIR: testDir, OA_HUB_URL: "http://127.0.0.1:" + port };
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
const state = (page) => page.evaluate(() => window.oaDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "Offline Aid");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek çevrimdışı metin görevlerini yükle
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek çevrimdışı metin görevi yüklendi/);
    let s = await state(page);
    assert.equal(s.tasks.length, 3);
    assert.equal(s.metrics.externalRequests, 0);
    await shot(page, "masaustu-01-cevrimdisi-gorevler.png");

    // 2) Yerel model ailesi ve cihaz kaynak kontrolü görünümü
    await page.click('[data-nav="models"]');
    await page.click('[data-select-model="qwen2.5:1.5b-instruct-q4_k_m"]');
    await toastHas(page, /Qwen 2\.5 1\.5B Instruct/);
    await shot(page, "masaustu-02-yerel-model-ve-donanim.png");

    // 3) MyMind / yerel model (loopback) ile cihazda çıkarım çalıştır (hassas e-posta maskelenmeli)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);

    await page.click('[data-nav="tasks"]');
    await page.click("#openNewTaskBtn");
    await page.click("#runLlmBtn");
    await toastHas(page, /Yerel modelle tamamlandı.*dış ağ isteği: 0/);
    assert.equal(hubCalls, 1);
    const aiSent = fs.readFileSync(path.join(testDir, "ai-sent.json"), "utf8");
    assert.ok(!aiSent.includes("saha.ekip@ornek-enerji.org"), "E-posta maskelenmeliydi");
    assert.ok(aiSent.includes("[E-POSTA]"));
    await shot(page, "masaustu-03-yerel-model-cikarimi.png");

    // 4) Gecikme raporu, dış ağ adresi engelleme ve dışa aktarma
    await page.click('[data-nav="settings"]');
    await page.click('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "https://api.openai.com/v1");
    await page.click("#saveLocal");
    await toastHas(page, /Dış ağ adresi engellendi/);
    s = await state(page);
    assert.equal(s.metrics.externalRequests, 0);
    assert.equal(s.metrics.blockedExternalUrls, 1);
    await shot(page, "masaustu-04-gecikme-raporu-ve-sinirlar.png");

    await page.click("#txtBtn");
    await toastHas(page, /offline-aid-cikti\.txt” kaydedildi/);
    await page.click("#mdBtn");
    await toastHas(page, /offline-aid-gecikme-raporu\.md” kaydedildi/);
    assert.ok(fs.existsSync(path.join(testDir, "offline-aid-cikti.txt")));
    assert.ok(fs.existsSync(path.join(testDir, "offline-aid-gecikme-raporu.md")));
    assert.deepEqual(violations, []);
    await app.close();

    // 5) Kalıcılık kontrolü
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.tasks.length, 4);
    assert.equal(s.metrics.externalRequests, 0);
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
