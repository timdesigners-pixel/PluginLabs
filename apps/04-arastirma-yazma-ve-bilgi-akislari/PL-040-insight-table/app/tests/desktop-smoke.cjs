// Masaüstü duman testi — PL-040 Insight Table: gerçek Electron penceresi; örnek tablolar, sütun önizlemesi, veri tipi kontrolü,
// eksik/şüpheli hücrelerin kaynaksız tamamlanmaması, PII maskeleme, CSV enjeksiyonu koruması, hücre kaynak izi, MyMind onaylı normalleştirme.
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "it-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "it-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const KEY = "test-istemci-anahtari-1234567890";

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const content = JSON.stringify({
      columns: [
        { index: 0, name: "Tedarikçi Kuruluş", key: "tedarikci_kurulus", type: "metin" },
        { index: 1, name: "Birim Fiyat (TL)", key: "birim_fiyat_tl", type: "para", fillValue: "999 TL" },
        { index: 2, name: "Teslimat Günü", key: "teslimat_gunu", type: "tarih" },
      ],
      fillValues: [{ row: 3, col: 2, value: "1000 TL" }],
      notes: ["3. satırda fiyat 'bekleniyor' olarak bırakılmış; kaynaksız tamamlanmadı."],
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
  const cleanEnv = { ...process.env, IT_USER_DATA: userData, IT_TEST_DIR: testDir, IT_HUB_URL: "http://127.0.0.1:" + port };
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
const state = (page) => page.evaluate(() => window.itDesktop.state());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  try {
    assert.equal(await page.title(), "Insight Table");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-01-baslangic.png");

    // 1) Örnek tabloları yükle
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek tablo\/liste yüklendi/);
    let s = await state(page);
    assert.equal(s.tables.length, 3);
    assert.equal(s.metrics.cellAccuracy, 100);
    assert.equal(s.metrics.unverifiedCompleted, 0);
    await shot(page, "masaustu-02-sutun-onizleme.png");

    // 2) MyMind ile sütun normalleştirme (PII maskeli gider, kaynaksız hücre tamamlama reddedilir)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click("#aiBtn");
    await toastHas(page, /MyMind sütun önerisi hazır · 2 kaynaksız\/uydurma öğe reddedildi/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    assert.ok(!sent.includes("teklif@anadolulojistik.com.tr"), "PII e-posta modele gönderilmemeli");
    await shot(page, "masaustu-03-mymind-normalizasyon.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /Sütun adları ve veri tipleri güncellendi/);

    // 3) Hücre kaynak izi ve denetim görünümü
    await page.click('[data-nav="trace"]');
    await page.click('[data-tf="issues"]');
    await until(page, () => document.querySelectorAll("#traceWrap .it-tracerow").length >= 2);
    await shot(page, "masaustu-04-kaynak-izi.png");

    // 4) CSV ve JSON dışa aktarma (formül enjeksiyonu koruması + PII maskeleme)
    await page.click('[data-nav="workspace"]');
    await page.click("#exportCsvBtn");
    await toastHas(page, /formül enjeksiyonu engellendi/);
    await page.click("#exportJsonBtn");
    await toastHas(page, /\.json” kaydedildi/);
    const csvFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".csv"));
    assert.equal(csvFiles.length, 1);
    const csvContent = fs.readFileSync(path.join(testDir, csvFiles[0]), "utf8");
    assert.match(csvContent, /'=HYPERLINK/);
    assert.ok(!csvContent.includes("anadolulojistik.com.tr"));

    // 5) Ölçüler ve ayarlar
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#metrics"), /%100/);
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
