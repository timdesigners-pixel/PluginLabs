// Masaüstü duman testi (PL-050 Decision Board): gerçek Electron penceresi; boş başlangıç, örnek karar panosu yükleme (3 seçenek × 4 kriter),
// her puanın veri/ağırlık türetiminin görünmesi, uzman incelemesi uyarısı, kaynaksız hücrede %100 izlenebilirlik kapısının karar kaydını
// engellemesi, hücre kaynağını tamamlayıp %100 izlenebilirliğe dönme, MyMind (taklit Hub: modelin kazanan/ağırlık dayatmalarının reddedilmesi,
// önerilen eksik kriteri matrise ekleme), tarihçeli karar günlüğü (ADR) kaydı, Markdown/CSV/JSON dışa aktarma, kalıcılık ve DPAPI şifreleme.
// Çalıştırma: node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
delete process.env.ELECTRON_RUN_AS_NODE;
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");

const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "db-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "db-test-"));
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T14:00:00";

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    const content =
      "```json\n" +
      JSON.stringify({
        kazanan: "Tescilli Sunucusuz Bulut DB", // Model kendi tercihini dayatmaya çalışıyor -> reddedilmeli!
        yeniAgirliklar: { "crit-cost": 1 }, // Model ağırlık dayatmaya çalışıyor -> reddedilmeli!
        eksikKriterler: [
          {
            ad: "Yedekten Dönüş Tatbikat Süresi (RTO)",
            neden: "Felaket kurtarma hedef süresi (RTO) ve yıllık geri yükleme testi süresi ayrı kriter olarak değerlendirilmemiş.",
          },
        ],
        celiskiler: [
          {
            secenek: "Kendi Sunucumuzda Patroni Kümesi",
            kriter: "Aylık Toplam Maliyet (TCO)",
            aciklama: "Donanım maliyeti düşük (9/10) puanlanmış ancak 7/24 mühendis nöbet maliyeti hesaba katılmamış.",
          },
        ],
      }) +
      "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return;
    await page.waitForTimeout(50);
  }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}

async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, DB_USER_DATA: userData, DB_TEST_DIR: testDir, DB_HUB_URL: "http://127.0.0.1:" + port, DB_NOW: NOW },
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
const state = (page) => page.evaluate(() => window.dbDesktop.state());
const text = (page, sel) => page.textContent(sel);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Decision Board");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".ax-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".ax-product"), /Decision Board.*Kaynaklı karar matrisi.*50/s);
    assert.ok(await page.isVisible("#emptyPanel"));

    // 1) Örnek karar panosu yükle -> %100 izlenebilirlik, puan türetimi ve uzman uyarısı
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /Örnek karar panosu yüklendi/);
    let s = await state(page);
    assert.equal(s.evaluation.traceabilityRate, 100);
    assert.equal(s.evaluation.fullyTraceable, true);
    assert.equal(s.evaluation.leader.optionId, "opt-pg-managed");
    assert.ok(await page.isVisible("#specialistBanner"));
    assert.match(await text(page, "#specialistBanner"), /mali müşavir \/ avukat uzman incelemesi yerine geçmez/);
    assert.match(await text(page, "#formulaText"), /Puan 8\/10 × Ağırlık %23\.5/);
    await shot(page, "masaustu-01-karar-matrisi.png");

    // 2) Hücre kaynağını silerek %100 izlenebilirlik kapısını test et
    await page.fill("#cSource", "");
    await page.click("#saveCellBtn");
    await toastHas(page, /Hücre puanı ve kaynağı güncellendi/);
    s = await state(page);
    assert.equal(s.evaluation.fullyTraceable, false);
    await shot(page, "masaustu-02-eksik-kaynak-uyarisi.png");

    // Eksik kaynakla karar kaydetmeyi dene -> engellenmeli
    await page.click('[data-nav="log"]');
    await page.click("#recordDecBtn");
    await toastHas(page, /%100'ü izlenebilir olmalıdır/);

    // Kaynağı geri tamamla -> %100 izlenebilirlik
    await page.click('[data-nav="matrix"]');
    await page.fill("#cSource", "Tedarikçi 2026 Kasım Fiyat Tablosu s.4");
    await page.click("#saveCellBtn");
    await toastHas(page, /Hücre puanı ve kaynağı güncellendi/);
    s = await state(page);
    assert.equal(s.evaluation.traceabilityRate, 100);

    // 3) Artı/Eksi, Duyarlılık ve MyMind Eksik Kriter / Çelişki Denetimi
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /MyMind anahtarı kaydedildi/);

    await page.click('[data-nav="analysis"]');
    setFile("deny.txt", "1");
    await page.click("#runAiBtn");
    await toastHas(page, /gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");

    await page.click("#runAiBtn");
    await toastHas(page, /2 model dayatması engellendi/);
    assert.equal(hubCalls, 1);
    assert.match(await text(page, "#droppedPrefBadge"), /Model tercih dayatması engellendi: 2 öğe atıldı/);
    assert.match(await text(page, "#missingCriteriaBox"), /Yedekten Dönüş Tatbikat Süresi \(RTO\)/);
    await shot(page, "masaustu-03-arti-eksi-ve-mymind-denetimi.png");

    // Önerilen eksik kriteri matrise ekle
    await page.click(".add-suggested-crit");
    await toastHas(page, /kriter olarak matrise eklendi/);
    s = await state(page);
    assert.equal(s.board.criteria.length, 5);
    assert.equal(s.evaluation.traceabilityRate, 100);
    await shot(page, "masaustu-04-duyarlilik-ve-artilar-eksiler.png");

    // 4) Karar Günlüğü (ADR) kaydı ve dışa aktarma
    await page.click('[data-nav="log"]');
    await page.click("#recordDecBtn");
    await toastHas(page, /Karar günlüğüne kaydedildi: Yönetilen PostgreSQL \+ pgvector/);
    s = await state(page);
    assert.equal(s.decisionLog.length, 1);
    assert.equal(s.decisionLog[0].traceabilityRate, 100);
    await shot(page, "masaustu-05-karar-gunlugu-adr.png");

    await page.click("#mdBtn");
    await toastHas(page, /karar-gunlugu-adr\.md” kaydedildi/);
    await page.click("#csvBtn");
    await toastHas(page, /karar-matrisi\.csv” kaydedildi/);
    await page.click("#backupBtn");
    await toastHas(page, /decision-board-yedek\.json” kaydedildi/);

    const md = fs.readFileSync(path.join(testDir, "karar-gunlugu-adr.md"), "utf8");
    assert.match(md, /# Karar Matrisi ve Karar Günlüğü \(ADR\)/);
    assert.match(md, /Yönetilen PostgreSQL \+ pgvector/);
    assert.match(md, /mali müşavir \/ avukat uzman incelemesi yerine geçmez/);

    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snap = await state(page);
    await app.close();

    // 5) Kalıcılık ve DPAPI kontrolü
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.decisionLog.length, 1);
    assert.equal(s.board.criteria.length, snap.board.criteria.length);
    report.traceabilityRate = s.evaluation.traceabilityRate;
    report.decisionsLogged = s.decisionLog.length;
    report.aiDroppedPreferences = s.counters.aiDroppedPreferences;
    report.vault = s.vault;
    if (s.vault) {
      assert.ok(!fs.readFileSync(path.join(userData, "karar-panosu.bin"), "latin1").includes("PostgreSQL"));
    }
    assert.deepEqual(violations, []);
    await app.close();

    console.log(JSON.stringify(report, null, 2));
    console.log(
      "DUMAN TESTİ GEÇTİ — " +
        new Date().toISOString() +
        " · " +
        process.platform +
        " · electron " +
        require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version
    );
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
