// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek kaynaklar (elle etiketli hücre doğruluğu, çift başlık satırı,
// birleştirilmiş hücre, hücre izi, formül benzeri hücre), gerçek panodan HTML tablo ve sekmeli metin, Yapıştır penceresi (biçimli HTML
// yapıştırma, kaynak adresi doğrulaması), dosyalar (.html BOM, .csv, desteklenmeyen dosyanın atlanması, kaynak dosyanın değişmemesi),
// tek sayfa adresi (taklit sunucu: onay reddi/onayı, tek istek, bağlantıların izlenmemesi, http/https dışı adres reddi), sütun düzenleme
// (ad, tür, biçim onayı → belirsiz işaretin kalkması, dahil etme, kişisel veri kipi), kaynaktaki tablo ve başlık satırı seçimi,
// CSV (standart / Excel Türkçe) ve kaynak izli JSON dışa aktarma (formül etkisizleştirme, maskeleme, geri okuma doğrulaması),
// MyMind (taklit Hub: anahtar, red, onay, kişisel veri/kaynak adresi gönderilmez, değer önerisinin atılması, adların uygulanması),
// arşiv/geri alma, ölçüler, yerel model (loopback; dış adres reddi), izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "it-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "it-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const readOut = (f) => fs.readFileSync(path.join(testDir, f), "utf8");
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-08T12:00:00";

const htmlPath = path.join(testDir, "fiyat-listesi.html");
fs.writeFileSync(htmlPath, "\ufeff<html lang=\"tr\"><body><table><tr><th>Ürün</th><th>Fiyat</th><th>Stok</th></tr><tr><td>Kalem</td><td>12,50 TL</td><td>Var</td></tr><tr><td>Defter</td><td>40,00 TL</td><td>Yok</td></tr><tr><td>Silgi</td><td>7,25 TL</td><td>Var</td></tr></table></body></html>", "utf8");
const csvPath = path.join(testDir, "uyeler.csv");
fs.writeFileSync(csvPath, "Ad;Katılım;Aidat\nAyşe;12.03.2026;250,00\nMert;01.04.2026;250,00\nCan;15.04.2026;125,50\n", "utf8");
const pdfPath = path.join(testDir, "rapor.pdf");
fs.writeFileSync(pdfPath, "%PDF-1.4 sahte");
const before = { html: sha(htmlPath), csv: sha(csvPath) };

// ---- Taklit sunucu (yalnız 127.0.0.1): tek sayfa + MyMind ----
const PAGE = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Kütüphane istatistikleri</title></head><body>
<p><a href="/baska.html">Diğer sayfa</a> · <a href="/arsiv.html">Arşiv</a></p>
<table><caption>Şube bazında ödünç</caption><tr><th>Şube</th><th>Ödünç</th><th>Değişim</th><th>Sayım</th></tr>
<tr><td>Merkez</td><td>12.450</td><td>%3,2</td><td>01.10.2026</td></tr><tr><td>Kadıköy</td><td>8.120</td><td>%-0,8</td><td>01.10.2026</td></tr>
<tr><td>Bornova</td><td>5.007</td><td>%1,1</td><td>02.10.2026</td></tr></table>
<table><tr><th>Etkinlik</th><th>Katılım</th></tr><tr><td>Okuma saati</td><td>120</td></tr><tr><td>Atölye</td><td>45</td></tr></table>
</body></html>`;
const served = [];
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.url === "/v1/chat/completions") {
      hubCalls++;
      const j = JSON.parse(body || "{}");
      const auth = req.headers.authorization;
      const ok = auth === "Bearer " + KEY || (!auth && j.model === "test-model");
      const content = "```json\n" + JSON.stringify({
        sutunlar: [{ no: 1, ad: "Şehir" }, { no: 3, ad: "AC fiyatı (TL/kWh)" }, { no: 4, ad: "DC fiyatı (TL/kWh)", deger: "12,40" }, { no: 7, ad: "Soket sayısı" }, { no: 42, ad: "Uydurma sütun" }],
        supheli: [{ satir: 6, sutun: 4, neden: "Sayı yerine metin" }, { satir: 5, sutun: 7, neden: "Eksik değer", duzeltme: "1.000" }, { satir: 99, sutun: 2, neden: "gönderilmedi" }],
      }) + "\n```";
      res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
    }
    served.push({ url: req.url, cookie: req.headers.cookie || null, ua: req.headers["user-agent"] || "" });
    if (req.url === "/sayfa.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(PAGE); }
    if (req.url === "/yonlen") { res.writeHead(302, { Location: "/sayfa.html" }); return res.end(); }
    if (req.url === "/resim.png") { res.writeHead(200, { "Content-Type": "image/png" }); return res.end("x"); }
    res.writeHead(404, { "Content-Type": "text/plain" }); res.end("yok");
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, IT_USER_DATA: userData, IT_TEST_DIR: testDir, IT_HUB_URL: "http://127.0.0.1:" + port, IT_NOW: NOW } });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1360, height: 860 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => document.getElementById("toasts").replaceChildren()); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.itDesktop.state());
const text = (page, sel) => page.textContent(sel);
const nav = (page, v) => page.click(`[data-nav="${v}"]`);
const openDs = async (page, re) => { const s = await state(page); const x = s.list.find((d) => re.test(d.name)); assert.ok(x, "tablo yok: " + re); await page.click(`#tableList .it-item[data-id="${x.id}"]`); await until(page, (i) => !!document.querySelector(`#tableList .it-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const colIdx = (s, name) => s.active.columns.findIndex((c) => c.name === name);
const values = (s, name) => { const i = colIdx(s, name); return s.active.preview.map((r) => r[i].v); };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Insight Table");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".it-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".it-product"), /Insight Table.*Tablodan veriye.*40/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    report.shortcut = (await state(page)).shortcut;
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek kaynaklar: çift başlık, birleştirilmiş hücre, türler, işaretler; elle etiketli doğruluk
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek kaynak açıldı/);
    let s = await state(page);
    assert.equal(s.list.length, 3);
    report.gold = s.gold;
    assert.ok(s.gold.accuracy >= 99, "örnek doğruluğu ≥ %99");
    await openDs(page, /Şehir bazında/);
    s = await state(page);
    assert.deepEqual(s.active.columns.map((c) => c.name), ["Şehir", "İşletmeci", "Fiyat (kWh) · AC", "Fiyat (kWh) · DC", "Değişim", "Güncelleme", "İstasyon", "İletişim"]);
    assert.equal(s.active.cands.length, 3);
    assert.match(await text(page, "#statChips"), /6 satır × 8 sütun.*2 eksik.*1 türe uymuyor.*1 kişisel veri sütunu/s);
    assert.equal(await page.locator("#previewGrid td.it-cell.is-merged").count(), 1, "rowspan hücresi işaretli");
    assert.equal(await page.locator("#previewGrid td.it-cell.is-hatali").count(), 1);
    await page.click('#previewGrid td[data-r="4"][data-i="1"]');
    await until(page, () => !!document.getElementById("traceBox"));
    assert.match(await text(page, "#traceBox"), /satır 7, sütun 2.*formül olarak çalışmaz/s);
    await page.click('#previewGrid td[data-r="5"][data-i="3"]');
    await until(page, () => /bilinmiyor/.test(document.getElementById("traceBox").textContent));
    assert.match(await text(page, "#traceBox"), /türe uymuyor/);
    await shot(page, "masaustu-01-onizleme-ve-hucre-izi.png");

    // 2) Gerçek panodan HTML tablo (tarayıcı kopyası gibi) — EN biçimli sayılar, başlıksız ilk satır değil th
    await app.evaluate(({ clipboard }) => clipboard.write({
      html: '<meta charset="utf-8"><html lang="en"><body><table><tr><th>City</th><th>Population</th><th>Area (km²)</th><th>Updated</th></tr><tr><td>Springfield</td><td>1,204,330</td><td>412.5</td><td>10/14/2026</td></tr><tr><td>Rivertown</td><td>98,410</td><td>88.25</td><td>09/30/2026</td></tr><tr><td>Lakeside</td><td>45,002</td><td>61</td><td>08/05/2026</td></tr></table></body></html>',
      text: "City\tPopulation\tArea (km²)\tUpdated\nSpringfield\t1,204,330\t412.5\t10/14/2026",
    }));
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /3 satır × 4 sütun/);
    s = await state(page);
    assert.equal(s.active.source.via, "pano-html");
    assert.deepEqual(values(s, "Population"), [1204330, 98410, 45002]);
    assert.deepEqual(values(s, "Updated"), ["2026-10-14", "2026-09-30", "2026-08-05"]);
    assert.equal(s.active.columns[colIdx(s, "Area (km²)")].type, "ondalik");
    // sekmeli metin (Excel kopyası; HTML yok)
    await app.evaluate(({ clipboard }) => clipboard.writeText("Ay\tGelir\tGider\nOcak\t12.500,00\t9.870,40\nŞubat\t13.020,10\t10.004,00\nMart\t11.900,00\t-\n"));
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /3 satır × 3 sütun/);
    s = await state(page);
    assert.equal(s.active.source.via, "pano-metin");
    assert.deepEqual(values(s, "Gider"), [9870.4, 10004, null]);

    // 3) Yapıştır penceresi: biçimli HTML yapıştırma + kaynak adresi doğrulaması
    await page.click('.it-toolbar [data-act="capture"]');
    await page.evaluate(() => {
      const ta = document.getElementById("capText");
      const dt = new DataTransfer();
      dt.setData("text/html", "<table><tr><th>Görev</th><th>Bitiş</th><th>Tamam</th></tr><tr><td>Rapor</td><td>12 Kasım 2026</td><td>Evet</td></tr><tr><td>Sunum</td><td>18.11.2026</td><td>Hayır</td></tr></table>");
      dt.setData("text/plain", "Görev Bitiş Tamam");
      ta.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      ta.value = "Görev Bitiş Tamam";
    });
    await until(page, () => /Biçimli tablo algılandı/.test(document.getElementById("capHtmlInfo").textContent));
    await page.fill("#capUrl", "javascript:alert(1)");
    await page.click("#capRun");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#capUrl", "https://ornek.example/gorevler");
    await page.fill("#capTitle", "Görev listesi");
    await page.click("#capRun");
    await toastHas(page, /“Görev listesi”: 2 satır × 3 sütun/);
    s = await state(page);
    assert.deepEqual(values(s, "Bitiş"), ["2026-11-12", "2026-11-18"]);
    assert.deepEqual(values(s, "Tamam"), [true, false]);
    assert.equal(s.active.source.url, "https://ornek.example/gorevler");

    // 4) Dosyalar: .html (BOM), .csv (; ayraç), desteklenmeyen dosya atlanır; kaynak dosyalar değişmez
    setFile("pick.txt", [htmlPath, csvPath, pdfPath].join("\n"));
    await page.click('.it-toolbar [data-act="files"]');
    await toastHas(page, /2 dosyadan tablo çıkarıldı · atlanan: rapor\.pdf \(desteklenmeyen tür\)/);
    s = await state(page);
    const csvDs = s.list.find((d) => d.file === "uyeler.csv");
    assert.ok(csvDs && s.list.find((d) => d.file === "fiyat-listesi.html"));
    await openDs(page, /^uyeler$/);
    s = await state(page);
    assert.deepEqual(values(s, "Katılım"), ["2026-03-12", "2026-04-01", "2026-04-15"]);
    assert.deepEqual(values(s, "Aidat"), [250, 250, 125.5]);
    assert.equal(sha(htmlPath), before.html);
    assert.equal(sha(csvPath), before.csv);
    rmFile("pick.txt");

    // 5) Tek sayfa adresi: http/https dışı reddedilir; onay reddi → istek yok; onay → tek istek, bağlantılar izlenmez
    await page.click('.it-toolbar [data-act="url"]');
    await page.fill("#urlInput", "file:///C:/Windows/win.ini");
    await page.click("#urlRun");
    await toastHas(page, /Yalnız http:\/\/ ya da https:\/\//);
    setFile("deny.txt", "1");
    await page.fill("#urlInput", "http://127.0.0.1:" + port + "/sayfa.html");
    await page.click("#urlRun");
    await toastHas(page, /İndirilmedi \(onay verilmedi\)/);
    assert.equal(served.length, 0);
    rmFile("deny.txt");
    await page.fill("#urlInput", "http://127.0.0.1:" + port + "/yonlen");
    await page.click("#urlRun");
    await toastHas(page, /“Şube bazında ödünç”: 3 satır × 4 sütun · kaynakta 2 tablo/);
    assert.deepEqual(served.map((x) => x.url), ["/yonlen", "/sayfa.html"], "yalnız istenen sayfa (yönlendirmeyle); bağlantılar izlenmedi");
    assert.ok(served.every((x) => !x.cookie));
    assert.match(readLog("approvals.txt"), /Bu sayfa indirilsin mi\?[\s\S]*bağlantılar izlenmez/);
    s = await state(page);
    assert.equal(s.active.source.via, "adres");
    assert.equal(s.active.source.url, "http://127.0.0.1:" + port + "/sayfa.html");
    assert.deepEqual(values(s, "Ödünç"), [12450, 8120, 5007], "sayfa dili TR → binlik");
    await page.click('#candSel');
    await page.selectOption("#candSel", "1");
    await toastHas(page, /Tablo değişti/);
    s = await state(page);
    assert.deepEqual(s.active.columns.map((c) => c.name), ["Etkinlik", "Katılım"]);
    await shot(page, "masaustu-02-kaynaktaki-tablolar.png");
    await page.selectOption("#candSel", "0");
    await toastHas(page, /Tablo değişti/);
    const before404 = served.length;
    await page.click('.it-toolbar [data-act="url"]');
    await page.fill("#urlInput", "http://127.0.0.1:" + port + "/resim.png");
    await page.click("#urlRun");
    await toastHas(page, /HTML sayfası değil/);
    assert.equal(served.length, before404 + 1);
    await page.click("#urlCancel");
    await page.click('#tableDetail button:has-text("Kaynağı aç")');
    await new Promise((r) => setTimeout(r, 300));
    assert.match(readLog("opened.txt"), /\/sayfa\.html/);

    // 6) Sütun düzenleme: belirsiz biçimi onaylama, ad, tür, dahil etme; başlık satırı
    await app.evaluate(({ clipboard }) => clipboard.writeText("Ürün\tAdet\tKod\nA\t1.250\t=1+1\nB\t3.400\t@ref\nC\t12.000\tX-9\n"));
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /3 satır × 3 sütun/);
    s = await state(page);
    assert.equal(s.active.stats.belirsiz, 3, "kanıtsız 1.250 belirsiz");
    await page.selectOption('#previewGrid th[data-src="1"] select[aria-label="Biçim: Adet"]', "tr");
    await until(page, () => /0 belirsiz/i.test(document.getElementById("statChips").textContent));
    s = await state(page);
    assert.deepEqual(values(s, "Adet"), [1250, 3400, 12000]);
    await page.fill('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Kod"]', "Ürün kodu");
    await page.press('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Kod"]', "Enter");
    await until(page, () => !!document.querySelector('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Ürün kodu"]'));
    await page.fill('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Ürün kodu"]', "Ürün");
    await page.press('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Ürün kodu"]', "Enter");
    await toastHas(page, /Bu adda başka bir sütun var/);
    await page.selectOption('#previewGrid th[data-src="1"] select[aria-label="Tür: Adet"]', "metin");
    await until(page, () => !document.querySelector('#previewGrid th[data-src="1"] select[aria-label="Biçim: Adet"]'));
    s = await state(page);
    assert.deepEqual(values(s, "Adet"), ["1.250", "3.400", "12.000"], "metin türünde ham metin korunur");
    await page.selectOption("#hdrSel", "0");
    await toastHas(page, /Başlık satırı değişti/);
    s = await state(page);
    assert.equal(s.active.stats.rows, 4);
    await page.selectOption("#hdrSel", "1");
    await toastHas(page, /Başlık satırı değişti/);
    s = await state(page);
    await page.selectOption('#previewGrid th[data-src="1"] select[aria-label="Biçim: Adet"]', "tr");
    await page.fill('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Kod"]', "Ürün kodu");
    await page.press('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Kod"]', "Enter");
    await until(page, () => !!document.querySelector('#previewGrid th[data-src="2"] input[aria-label="Sütun adı: Ürün kodu"]'));

    // 7) Dışa aktarma: formül etkisizleştirme ve geri okuma doğrulaması
    await page.click("#csvBtn");
    await toastHas(page, /CSV “urun-adet-kod\.csv|CSV “/);
    let csv = readOut((await state(page)).active.exports[0].file);
    report.injectionCsv = csv.replace(/^\ufeff/, "").split("\r\n").slice(0, 4);
    assert.ok(csv.includes("'=1+1") && csv.includes("'@ref") && csv.includes("Ürün,Adet,Ürün kodu"));
    assert.ok(/X-9/.test(csv) && !/'X-9/.test(csv));
    s = await state(page);
    assert.equal(s.active.exports[0].neutralized, 2);
    assert.equal(s.active.exports[0].matched, s.active.exports[0].cells);
    assert.match(await text(page, "#exportBox"), /geri okunarak doğrulandı: 12\/12 hücre eşleşti/);

    // örnek tarife: Excel TR CSV (maskeleme) + kaynak izli JSON + kişisel veri sütununu çıkarma
    await openDs(page, /Şehir bazında/);
    await page.selectOption("#presetSel", "excel-tr");
    await page.click("#csvBtn");
    await toastHas(page, /CSV “sehir-bazinda-hizli-sarj-tarifeleri\.csv”: 6 satır; doğrulama 56\/56 hücre; 1 formül etkisiz/);
    csv = readOut("sehir-bazinda-hizli-sarj-tarifeleri.csv");
    assert.ok(csv.startsWith("\ufeffŞehir;İşletmeci;Fiyat (kWh) · AC;"));
    assert.ok(csv.includes("İstanbul;Volta Şarj;8,9;12,4;4,5;03.11.2026;1284;d•••@volta-ornek.com"));
    assert.ok(!csv.includes("destek@volta-ornek.com"));
    assert.ok(csv.includes(`"'=HYPERLINK(""http://kotu.example"",""Tıkla"")"`));
    await page.click("#jsonBtn");
    await toastHas(page, /JSON “sehir-bazinda-hizli-sarj-tarifeleri\.json”: 6 satır; doğrulama \d+\/\d+ hücre/);
    const json = JSON.parse(readOut("sehir-bazinda-hizli-sarj-tarifeleri.json"));
    assert.equal(json.kaynak.adres, "https://ornek.example/sarj-tarifeleri");
    assert.deepEqual(json.satirlar[1]._kaynak, { satir: 4, sutunlar: [1, 2, 3, 4, 5, 6, 7, 8] });
    assert.equal(json.satirlar[5].fiyat_kwh_dc, null, "türe uymayan değer uydurulmaz");
    assert.equal(json.satirlar[0].iletisim, "d•••@volta-ornek.com");
    await page.selectOption('#previewGrid th[data-src="7"] select[aria-label="Kişisel veri: İletişim"]', "cikar");
    await until(page, () => document.querySelector('#previewGrid th[data-src="7"]').classList.contains("is-off"));
    await page.selectOption("#presetSel", "standart");
    await page.click("#csvBtn");
    await toastHas(page, /doğrulama 49\/49 hücre/);
    assert.ok(!readOut("sehir-bazinda-hizli-sarj-tarifeleri.csv").includes("İletişim"));
    await page.selectOption('#previewGrid th[data-src="7"] select[aria-label="Kişisel veri: İletişim"]', "maskele");

    // 8) MyMind: anahtar yok → hata; red → istek yok; onay → yalnız ad ve işaret, değer önerileri atılır
    await page.click("#aiBtn");
    await toastHas(page, /Önce MyMind bağlantısı/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", "kısa");
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar biçimi geçersiz/);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (Windows kasasına kaydedildi|yalnız bu oturum)/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi \(onay verilmedi\)/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.fill('#previewGrid th[data-src="0"] input[aria-label="Sütun adı: Şehir"]', "İl");
    await page.press('#previewGrid th[data-src="0"] input[aria-label="Sütun adı: Şehir"]', "Enter");
    await until(page, () => !!document.querySelector('#previewGrid th[data-src="0"] input[aria-label="Sütun adı: İl"]'));
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi: 4 ad, 2 şüpheli hücre; [4-9] öğe denetimde atıldı/);
    const sent = readLog("ai-sent.json");
    assert.ok(!sent.includes("destek@volta-ornek.com") && !sent.includes("ornek.example/sarj") && sent.includes("d•••@volta-ornek.com"), "kişisel veri maskeli, kaynak adresi yok");
    assert.match(readLog("approvals.txt"), /kişisel veri parçası[\s\S]*hücre değeri öneremez/);
    assert.equal(await page.locator("#previewGrid td.it-cell.is-ai").count(), 2);
    assert.match(await text(page, "#aiBlock"), /öğe atıldı.*deger.*duzeltme/s);
    await page.click('#previewGrid td[data-r="5"][data-i="3"]');
    await until(page, () => !!document.getElementById("traceBox") && /MyMind/.test(document.getElementById("traceBox").textContent));
    await page.evaluate(() => document.getElementById("aiBlock").scrollIntoView({ block: "end" }));
    await shot(page, "masaustu-03-mymind-onerisi.png");
    const valsBefore = JSON.stringify((await state(page)).active.preview.map((r) => r.map((x) => x.v)));
    await page.click('#aiBlock button:has-text("Adları uygula")');
    await toastHas(page, /3 sütun adı MyMind önerisiyle güncellendi/);
    s = await state(page);
    assert.equal(s.active.columns[0].name, "İl", "elle verilen ad korunur");
    assert.equal(s.active.columns[2].name, "AC fiyatı (TL/kWh)");
    assert.equal(JSON.stringify(s.active.preview.map((r) => r.map((x) => x.v))), valsBefore, "hücre değerleri değişmedi");

    // 9) Dışa aktarmalar görünümü
    await nav(page, "exports");
    assert.equal(await page.locator("#exportsTable tbody tr").count(), 4);
    assert.match(await text(page, "#exportsTable"), /Excel TR/);
    await shot(page, "masaustu-04-disa-aktarmalar.png");

    // 10) Arşiv / geri alma
    await nav(page, "tables");
    await page.click('#tableDetail button:has-text("Arşivle")');
    await toastHas(page, /arşive taşındı/);
    await page.click('[data-tf="arsiv"]');
    await until(page, () => document.querySelectorAll("#tableList .it-item").length === 1);
    await page.click("#tableList .it-item");
    await until(page, () => !!document.querySelector('#tableDetail button'));
    await page.click('#tableDetail button:has-text("Arşivden geri al")');
    await toastHas(page, /geri alındı/);

    // 11) Ölçüler ve ayarlar; yerel model yalnız loopback
    await nav(page, "settings");
    await page.click('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://192.168.1.20:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('input[name="provider"][value="hub"]');
    await until(page, () => document.getElementById("localBox").hidden);
    s = await state(page);
    report.metrics = { exports: s.metrics.exports, exportAccuracy: s.metrics.exportAccuracy, neutralized: s.metrics.neutralized, masked: s.metrics.masked, aiDropped: s.metrics.aiDropped };
    assert.equal(s.metrics.exportAccuracy, 100);
    assert.match(await text(page, "#metrics"), /%100\s*örneklerde kaynağa göre hücre doğruluğu/);
    await shot(page, "masaustu-05-olculer-ayarlar.png");
    await page.click("#backupBtn");
    await toastHas(page, /insight-table-yedek\.json/);

    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = (await state(page)).vault;
    report.tables = (await state(page)).list.length;
    await app.close();

    // 12) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.list.length, report.tables);
    assert.equal(s.metrics.exports, 4);
    const tarife = s.list.find((d) => /Şehir bazında/.test(d.name));
    assert.ok(tarife.ai);
    if (s.vault) assert.ok(s.hasKey, "kasa varken anahtar kalıcı");
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify({ ...report, served: served.map((x) => x.url), hubCalls, platform: process.platform }));
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
