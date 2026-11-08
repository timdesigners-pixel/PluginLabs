// Masaüstü duman testi (PL-049 Invoice Inbox): gerçek Electron penceresi; boş başlangıç, örnek fatura/fiş belgeleri (2 şablon + tutarsız belge),
// altın örnek doğrulaması (>=%98 toplam/tarih doğruluğu), TCKN/IBAN/Kart kırpma denetimi, zorunlu inceleme engeli (tutarsız belgenin
// düzeltilmeden onaylanamaması), panodan ve dosyadan belge alma, MyMind (taklit Hub: onay/red, kimlik verisinin gitmemesi, öneri uygulama),
// insan onayı sonrası Finansal Asistan uyumlu CSV/MD/JSON dışa aktarma, kalıcılık ve DPAPI şifreleme.
// Çalıştırma: node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
delete process.env.ELECTRON_RUN_AS_NODE;
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");

const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "inv-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "inv-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00";

const fileInvoicePath = path.join(testDir, "hosting-fatura.txt");
fs.writeFileSync(
  fileInvoicePath,
  "\uFEFFe-Arşiv Fatura\nSatıcı: Marmara Veri Merkezi A.Ş.\nFatura No: GIB2026000002210\nDüzenleme Tarihi: 06.11.2026\nSon Ödeme Tarihi: 20.11.2026\nTCKN: 23456789012\n- Sunucu Barındırma (1 Adet x 4.000,00 TL) [KDV %20]: 4.000,00 TL\nAra Toplam: 4.000,00 TL\nHesaplanan KDV: 800,00 TL\nÖdenecek Tutar: 4.800,00 TL\n",
  "utf8"
);

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
        satici: "Nokta Fiber İnternet Hizmetleri A.Ş.",
        faturaNo: "GIB2026000001905",
        duzenlemeTarihi: "2026-11-06",
        sonOdemeTarihi: "2026-11-21",
        araToplam: 1250,
        kdv: 250,
        genelToplam: 1500,
        not: "Son ödeme tarihi fatura alt bilgisinden 15 gün vade olarak tamamlandı",
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
    env: { ...process.env, INV_USER_DATA: userData, INV_TEST_DIR: testDir, INV_HUB_URL: "http://127.0.0.1:" + port, INV_NOW: NOW },
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
const state = (page) => page.evaluate(() => window.invDesktop.state());
const text = (page, sel) => page.textContent(sel);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Invoice Inbox");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".ax-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".ax-product"), /Invoice Inbox.*Fatura ve fiş kutusu.*49/s);
    assert.ok(await page.isVisible("#emptyPanel"));

    // 1) Örnek fatura ve fişleri yükle -> >=%98 doğruluk + TCKN/IBAN kırpma
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /5 örnek fatura\/fiş inceleme kuyruğuna eklendi/);
    let s = await state(page);
    assert.equal(s.docs.length, 5);
    assert.equal(s.gold.totalAccuracy, 100);
    assert.equal(s.gold.dateAccuracy, 100);
    assert.equal(s.gold.mismatchCaught, 1);
    assert.ok(s.docs.every((d) => d.status === "inceleme"), "Hiçbir belge insan onayı olmadan onaylı olmaz");
    report.gold = s.gold;

    // Kuzey Bulut e-Arşiv faturası seçili (ilk sırada)
    const kuzey = s.docs.find((d) => d.sampleKey === "earsiv-bulut");
    await page.click(`#reviewList .ax-item[data-id="${kuzey.id}"]`);
    await until(page, (id) => !!document.querySelector(`#reviewList .ax-item.is-sel[data-id="${id}"]`), kuzey.id);
    assert.match(await text(page, "#consistencyBox"), /Deterministik Toplam Kontrolü: DOĞRULANDI/);
    assert.match(await text(page, "#rawPreview"), /\[TCKN-KIRPILDI\]/);
    assert.match(await text(page, "#rawPreview"), /TR\[IBAN-KIRPILDI\]/);
    await shot(page, "masaustu-01-inceleme-kuyrugu.png");

    // 2) Zorunlu inceleme: Mercan Mali Müşavirlik makbuzu (5000 + 1000 != 6450)
    const mercan = s.docs.find((d) => d.sampleKey === "makbuz-danismanlik-uyumsuz");
    await page.click(`#reviewList .ax-item[data-id="${mercan.id}"]`);
    await until(page, (id) => !!document.querySelector(`#reviewList .ax-item.is-sel[data-id="${id}"]`), mercan.id);
    assert.match(await text(page, "#consistencyBox"), /ZORUNLU İNCELEME/);
    await shot(page, "masaustu-02-zorunlu-inceleme-uyarisi.png");

    // Düzeltmeden onaylamayı dene -> reddedilmeli
    await page.click("#approveBtn");
    await toastHas(page, /tutarsız alan var/);
    // Genel toplamı 6000.00 olarak düzeltip onayla
    await page.fill("#fGrand", "6000.00");
    await page.click("#approveBtn");
    await toastHas(page, /insan onayıyla kaydedildi/);

    // Kuzey Bulut ve UBL XML tasarım faturasını da onayla
    await page.click(`#reviewList .ax-item[data-id="${kuzey.id}"]`);
    await page.click("#approveBtn");
    await toastHas(page, /insan onayıyla kaydedildi/);

    const ubl = s.docs.find((d) => d.sampleKey === "earsiv-tasarim-xml");
    await page.click(`#reviewList .ax-item[data-id="${ubl.id}"]`);
    await page.click("#approveBtn");
    await toastHas(page, /insan onayıyla kaydedildi/);

    // 3) MyMind ile belirsiz vade tarihini tamamla (Nokta Fiber)
    const nokta = s.docs.find((d) => d.sampleKey === "earsiv-vadesiz");
    await page.click(`#reviewList .ax-item[data-id="${nokta.id}"]`);
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /MyMind anahtarı kaydedildi/);

    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");

    await page.click("#aiBtn");
    await toastHas(page, /MyMind alan önerisi hazır/);
    assert.equal(hubCalls, 1);
    await shot(page, "masaustu-03-mymind-alan-cikarimi.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /taslak alanlarına uygulandı/);
    assert.equal(await page.inputValue("#fDue"), "2026-11-21");
    await page.click("#approveBtn");
    await toastHas(page, /insan onayıyla kaydedildi/);

    // 4) Dosyadan belge içe aktarma
    setFile("pick.txt", fileInvoicePath);
    await page.click('[data-act="files"]');
    await toastHas(page, /1 belge dosyadan eklendi/);
    rmFile("pick.txt");

    // 5) Onaylı belgeler görünümü ve Finansal Asistan CSV dışa aktarma
    await page.click('[data-nav="approved"]');
    await until(page, () => document.querySelectorAll("#approvedList .ax-item").length === 4);
    await shot(page, "masaustu-04-onayli-faturalar.png");

    await page.click("#topExportCsv");
    await toastHas(page, /finansal-asistan-faturalar\.csv” kaydedildi \(4 onaylı belge\)/);
    const csv = fs.readFileSync(path.join(testDir, "finansal-asistan-faturalar.csv"), "utf8");
    assert.match(csv, /GIB2026000001482,Kuzey Bulut Bilişim A\.Ş\.,2026-11-03,2026-11-17,TRY,8500\.00,1700\.00,10200\.00/);
    assert.ok(!csv.includes("FIS202600419"), "Onaylanmamış belge CSV'de yer almaz");

    // 6) Ölçüler ve Ayarlar görünümü + Markdown / JSON dışa aktarma
    await page.click('[data-nav="settings"]');
    assert.match(await text(page, "#goldInfo"), /toplam\/KDV doğruluğu %\d+/);
    await shot(page, "masaustu-05-olculer-ve-ayarlar.png");

    await page.click("#mdBtn");
    await toastHas(page, /fatura-ozeti\.md” kaydedildi/);
    await page.click("#backupBtn");
    await toastHas(page, /invoice-inbox-yedek\.json” kaydedildi/);

    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snap = await state(page);
    await app.close();

    // 7) Kalıcılık ve şifreli kasa kontrolü
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.docs.length, snap.docs.length);
    assert.equal(s.metrics.approved, 4);
    report.vault = s.vault;
    report.approved = s.metrics.approved;
    if (s.vault) {
      assert.ok(!fs.readFileSync(path.join(userData, "faturalar.bin"), "latin1").includes("Kuzey Bulut"));
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
