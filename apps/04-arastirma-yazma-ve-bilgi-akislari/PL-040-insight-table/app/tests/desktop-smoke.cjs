// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek sayfalar (elle etiketli hücre doğruluğu, betiğin çalışmaması),
// tablo seçimi, başlık satırı, sütun adı/türü/dahil etme, satır çıkarma, kişisel veri sütununun maskelenmesi ve çıkarılması, CSV dışa
// aktarma (formül enjeksiyonu etkisizleşir, e-posta yazılmaz, geri okuma doğrulaması, Excel-Türkçe profili), JSON (hücre izi),
// Yeni içerik penceresi (kaynak adresi doğrulaması, TSV, belirsiz sayı işareti), gerçek panodan HTML tablo, dosyalar (.html windows-1254,
// .csv, desteklenmeyen tür atlanır, kaynak dosya değişmez), MyMind (taklit Hub: anahtar, red, onay, istekte kişisel veri/kaynak adresi
// yok, hücre değeri önerisinin atılması, ad önerisini uygulama), yerel model (loopback; dış adres reddi), arşiv/geri alma, ölçüler,
// izin isteklerinin reddi ve kalıcılık.
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
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00";

// windows-1254 kodlu HTML (Türkçe karakterler tek bayt): ş=0xFE, Ş=0xDE, ı=0xFD, ğ=0xF0, İ=0xDD
const htmlPath = path.join(testDir, "fiyatlar.html");
const w1254 = (s) => Buffer.from([...s].map((ch) => ({ "ş": 0xfe, "Ş": 0xde, "ı": 0xfd, "ğ": 0xf0, "Ğ": 0xd0, "İ": 0xdd, "ü": 0xfc, "ö": 0xf6, "ç": 0xe7 }[ch] || ch.charCodeAt(0))));
fs.writeFileSync(htmlPath, w1254('<html lang="tr"><head><meta charset="windows-1254"><title>Fiyat listesi</title></head><body><table><tr><th>Ürün</th><th>Fiyat</th><th>Güncelleme</th></tr><tr><td>Şeker</td><td>42,50 TL</td><td>01.11.2026</td></tr><tr><td>Ilık süt</td><td>31,75 TL</td><td>02.11.2026</td></tr><tr><td>İrmik</td><td>28 TL</td><td>—</td></tr></table></body></html>'));
const csvPath = path.join(testDir, "uyeler.csv");
fs.writeFileSync(csvPath, "﻿Ad;Katılım;Aidat\nEce;evet;150,5\nMert;hayır;0\nSelin;evet;-20\n", "utf8");
const pdfPath = path.join(testDir, "rapor.pdf");
fs.writeFileSync(pdfPath, "%PDF-1.4 sahte");
const before = { html: sha(htmlPath), csv: sha(csvPath) };

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, j) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(j)); };
    if (req.url === "/v1/chat/completions") {
      hubCalls++;
      const j = JSON.parse(body || "{}");
      const auth = req.headers.authorization;
      const ok = auth === "Bearer " + KEY || (!auth && j.model === "test-model");
      const content = "```json\n" + JSON.stringify({ sutunlar: [{ i: 2, ad: "Ödünç kitap (adet)" }, { i: 3, ad: "Ödünç e-kitap (adet)", degerler: [100, 200] }, { i: 4, ad: "Doluluk (%)" }, { i: 12, ad: "Uydurma sütun" }], uyarilar: [{ i: 5, not: "Bir açılış tarihinde gün yok (Haziran 2024)." }], doldur: { "2": "500" } }) + "\n```";
      return ok ? send(200, { choices: [{ message: { role: "assistant", content } }] }) : send(401, { error: "Geçersiz API anahtarı" });
    }
    send(404, { error: "yok" });
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
  await page.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => document.getElementById("toasts").replaceChildren()); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.itDesktop.state());
const text = (page, sel) => page.textContent(sel);
const nav = (page, v) => page.click(`[data-nav="${v}"]`);
const openCap = async (page, re) => { const s = await state(page); const x = s.captures.find((c) => re.test(c.input.title)); assert.ok(x, "kayıt yok: " + re); await page.click(`#capList .it-item[data-id="${x.id}"]`); await until(page, (i) => !!document.querySelector(`#capList .it-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const colHead = (page, i) => page.locator(`#grid thead th[data-col="${i}"]`);

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

    // 1) Örnek sayfalar: elle etiketli doğruluk, betik çalışmaz, iki satırlı başlık, işaretler
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek sayfa eklendi/);
    let s = await state(page);
    assert.equal(s.captures.length, 3);
    assert.equal(s.gold.accuracy, 100, "örnek doğruluk: " + JSON.stringify(s.gold.misses));
    report.gold = { total: s.gold.total, ok: s.gold.ok, accuracy: s.gold.accuracy };
    await openCap(page, /kütüphaneleri/);
    s = await state(page);
    assert.deepEqual(s.table.columns.map((c) => c.name), ["İlçe", "Kütüphane", "Ödünç / Kitap", "Ödünç / E-kitap", "Doluluk", "Açılış", "İletişim", "Not"]);
    assert.equal(await page.locator(".it-tab").count(), 2, "tablo + bağlantı listesi");
    assert.equal(await page.inputValue("#headerSel"), "2");
    assert.match(await text(page, "#tableSum"), /6 satır.*kişisel veri sütunu/s);
    assert.ok(await page.locator('#grid td[data-flag="eksik"]').count() >= 3);
    assert.ok(await page.locator('#grid td[data-flag="uyumsuz"]').count() >= 1, "Haziran 2024 tarihe uymuyor");
    const gridText = await text(page, "#grid tbody");
    assert.doesNotMatch(gridText, /merkez\.kutuphane@/, "e-posta önizlemede de maskeli");
    assert.match(gridText, /m•••@ornek\.example/);
    assert.match(gridText, /→ 78,5/, "normalleştirilmiş değer gösterilir");
    assert.doesNotMatch(gridText, /betik|0012450/);
    await shot(page, "masaustu-01-tablo-onizleme.png");

    // 2) CSV dışa aktarma: formül etkisizleşir, e-posta yazılmaz, geri okuma birebir
    await page.click("#csvBtn");
    await toastHas(page, /kaydedildi: 6 satır × 8 sütun\. Geri okuma: \d+\/\d+ hücre birebir · 2 formül etkisizleştirildi · 5 kişisel değer maskelendi/);
    const csv1 = fs.readFileSync(path.join(testDir, "ilce_kutuphaneleri_2026_ilk_ceyrek".replace(/_/g, "-") + "-1.csv"), "utf8");
    assert.match(csv1, /^﻿İlçe,Kütüphane,Ödünç \/ Kitap/);
    assert.match(csv1, /"'=HYPERLINK\(""http:\/\/kotu\.example"",""Tıkla""\)"/);
    assert.match(csv1, /,'\+ Yeni şube,R6/);
    assert.match(csv1, /,12450,3210,78\.5,1998-03-12,/);
    assert.doesNotMatch(csv1, /merkez\.kutuphane@|555 12 34/);
    report.csv = csv1.split("\r\n").slice(0, 3);

    // 3) Sütun ve satır düzenleme: ad, tür, dahil etme, kişisel veriyi çıkarma, satır çıkarma, başlık satırı
    await colHead(page, 1).locator("input.pl-input").fill("Kütüphane adı");
    await colHead(page, 1).locator("input.pl-input").press("Tab");
    await until(page, () => window.itDesktop.state().then((s) => s.table.columns[1].name === "Kütüphane adı") && true);
    await until(page, () => document.querySelector('#grid thead th[data-col="1"] input.pl-input').value === "Kütüphane adı");
    await colHead(page, 4).locator("select").first().selectOption("metin");
    await until(page, () => /\(algılanan\)/.test(document.querySelector('#grid thead th[data-col="4"] select').selectedOptions[0].textContent) === false);
    await colHead(page, 4).locator("select").first().selectOption("sayi");
    await colHead(page, 7).locator('input[type="checkbox"]').uncheck();
    await colHead(page, 6).locator("select").nth(1).selectOption("cikar");
    await until(page, () => /4 sütun|6 sütun/.test(document.getElementById("tableSum").textContent));
    s = await state(page);
    assert.equal(s.table.columns[1].name, "Kütüphane adı");
    assert.equal(s.table.totals.cols, 6);
    await page.click('#grid tbody tr:last-child td.it-rowh button');
    await until(page, () => /5 satır/.test(document.getElementById("tableSum").textContent));
    assert.equal(await page.locator("#grid tbody tr.is-skip").count(), 1);
    await shot(page, "masaustu-02-sutun-ayarlari.png");

    // 4) JSON (hücre izi) ve Excel-Türkçe CSV
    await nav(page, "settings");
    await page.selectOption("#setTrace", "hucre");
    await page.selectOption("#setProfile", "excel-tr");
    await nav(page, "tables");
    await page.click("#jsonBtn");
    await toastHas(page, /kaydedildi: 5 satır\. Geri okuma birebir/);
    const j = JSON.parse(fs.readFileSync(path.join(testDir, "ilce-kutuphaneleri-2026-ilk-ceyrek-1.json"), "utf8"));
    assert.equal(j.kaynak.adres, "https://ornek.belediye.example/acik-veri/kutuphaneler");
    assert.equal(j.satirlar.length, 5);
    assert.deepEqual(j.satirlar[0]["Ödünç / Kitap"], { deger: 12450, ham: "12.450", iz: "R3C3" });
    assert.equal(j.satirlar[1]["Kütüphane adı"].iz, "R4C1");
    assert.ok(!("İletişim" in j.satirlar[0]) && !("Not" in j.satirlar[0]));
    assert.doesNotMatch(JSON.stringify(j), /ornek\.example"|@ornek/);
    await page.click("#csvBtn");
    await toastHas(page, /Geri okuma: \d+\/\d+ hücre birebir/);
    const csv2 = fs.readFileSync(path.join(testDir, "ilce-kutuphaneleri-2026-ilk-ceyrek-1.csv"), "utf8");
    assert.match(csv2, /^﻿İlçe;Kütüphane adı;Ödünç \/ Kitap;Ödünç \/ E-kitap;Doluluk;Açılış;kaynak_satir\r\n/);
    assert.match(csv2, /\r\nGölbaşı;Gölbaşı Kütüphanesi;2004,5;98;55;2019-04-03;R7\r\n$/);

    // 5) Diğer tablo (bağlantı listesi) ve İngilizce sayfa
    await page.click('.it-tab[data-idx="1"]');
    await until(page, () => document.querySelector('.it-tab[data-idx="1"]').getAttribute("aria-pressed") === "true");
    assert.match(await text(page, "#grid"), /CSV indir/);
    await page.click('.it-tab[data-idx="0"]');
    await openCap(page, /Headphone/);
    s = await state(page);
    assert.deepEqual(s.table.columns.map((c) => c.type), ["metin", "sayi", "sayi", "tarih", "mantik", "baglanti"]);
    assert.equal(s.table.rows[1].cells[3].v, "2025-11-02", "lang=en → AA/GG");
    assert.equal(s.table.columns[1].unit, "$");

    // 6) Yeni içerik: geçersiz kaynak adresi reddi, TSV, dil ipucu yok → belirsiz işaret
    await page.click('.it-toolbar [data-act="capture"]');
    await page.fill("#capText", "Şube\tCiro\tTarih\nKadıköy\t1.250\t04/05/2026\nBeşiktaş\t2.480\t07/08/2026\nÜsküdar\t980\t10/09/2026\n");
    await page.fill("#capUrl", "javascript:alert(1)");
    await page.click("#capRun");
    await toastHas(page, /yalnız http/);
    await page.fill("#capUrl", "https://rapor.example.com/ciro");
    await page.click("#capRun");
    await toastHas(page, /1 tablo\/liste bulundu; ilk: 4 satır × 3 sütun/);
    s = await state(page);
    assert.equal(s.table.kind, "tsv");
    assert.equal(s.table.totals.belirsiz, 5, "2 binlik + 3 gün/ay belirsizliği");
    assert.match(await text(page, ".it-notes"), /belirsiz işaretlendi/);
    await nav(page, "settings");
    await page.selectOption("#setLocale", "en");
    await page.selectOption("#setDate", "gun");
    await nav(page, "tables");
    s = await state(page);
    assert.equal(s.table.totals.belirsiz, 0);
    assert.equal(s.table.rows[0].cells[1].v, 1.25);
    await nav(page, "settings");
    await page.selectOption("#setLocale", "oto");
    await page.selectOption("#setDate", "oto");
    await page.selectOption("#setProfile", "standart");
    await page.selectOption("#setTrace", "satir");
    await nav(page, "tables");

    // 7) Gerçek pano: tarayıcıdan kopyalanmış gibi HTML tablo
    await app.evaluate(({ clipboard }) => clipboard.write({ html: '<meta charset="utf-8"><table><tbody><tr><td>Şehir</td><td>Nüfus</td></tr><tr><td>Ankara</td><td>5.803.482</td></tr><tr><td>İzmir</td><td>4.479.525</td></tr></tbody></table>', text: "Şehir\tNüfus\nAnkara\t5.803.482\nİzmir\t4.479.525" }));
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panodan \(HTML\): 1 tablo\/liste bulundu; ilk: 3 satır × 2 sütun/);
    s = await state(page);
    assert.deepEqual(s.table.columns.map((c) => c.name), ["Şehir", "Nüfus"]);
    assert.equal(s.table.rows[0].cells[1].v, 5803482);

    // 8) Dosyalar: windows-1254 HTML, CSV (noktalı virgül), PDF atlanır; kaynak dosyalar değişmez
    setFile("pick.txt", [htmlPath, csvPath, pdfPath].join("\n"));
    await page.click('.it-toolbar [data-act="files"]');
    await toastHas(page, /2 dosya eklendi · atlanan: rapor\.pdf \(desteklenmeyen tür\)/);
    rmFile("pick.txt");
    assert.equal(sha(htmlPath), before.html);
    assert.equal(sha(csvPath), before.csv);
    await openCap(page, /Fiyat listesi/);
    s = await state(page);
    assert.deepEqual(s.table.columns.map((c) => c.name), ["Ürün", "Fiyat", "Güncelleme"]);
    assert.equal(s.table.rows[0].cells[0].raw, "Şeker");
    assert.equal(s.table.rows[1].cells[0].raw, "Ilık süt");
    assert.equal(s.table.rows[0].cells[1].v, 42.5);
    assert.equal(s.table.columns[1].unit, "TL");
    await openCap(page, /uyeler\.csv/);
    s = await state(page);
    assert.deepEqual(s.table.columns.map((c) => c.type), ["metin", "mantik", "sayi"]);
    assert.equal(s.table.rows[2].cells[2].v, -20);

    // 9) MyMind: anahtar, red, onay; istekte kişisel veri/kaynak yok; hücre değeri önerisi atılır; ad önerisi uygulanır
    await openCap(page, /kütüphaneleri/);
    await page.click("#aiBtn");
    await toastHas(page, /Hub istemci anahtarını girin/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", "kısa");
    await page.click("#mymindSave");
    await toastHas(page, /biçimi geçersiz/);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (Windows kasasına kaydedildi|yalnız bu oturum)/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /3 ad önerisi, 1 not · \d+ öğe atıldı/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    assert.doesNotMatch(sent, /@ornek\.example|555 12 34|belediye\.example|kütüphaneleri — 2026/);
    assert.match(sent, /örnek gönderilmedi/);
    assert.match(readLog("approvals.txt"), /Kişisel veri sütunlarından \(1\) örnek gönderilmez/);
    const ai = (await state(page)).captures.find((c) => /kütüphaneleri/.test(c.input.title)).ai;
    assert.ok(ai.droppedList.some((d) => /degerler/.test(d)) && ai.droppedList.some((d) => /doldur/.test(d)) && ai.droppedList.some((d) => /Olmayan sütun/.test(d)));
    await page.evaluate(() => { const d = document.getElementById("capDetail"); d.scrollTop = d.scrollHeight; });
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click("text=Ad önerilerini uygula");
    await toastHas(page, /3 sütun adı güncellendi/);
    s = await state(page);
    assert.equal(s.table.columns[2].name, "Ödünç kitap (adet)");
    assert.equal(s.table.rows[0].cells[2].v, 12450, "hücre değerleri değişmedi");

    // 10) Yerel model (loopback) ve dış adres reddi
    await nav(page, "settings");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://kotu.example:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await nav(page, "tables");
    await page.click("#aiBtn");
    await toastHas(page, /ad önerisi/);
    assert.equal(hubCalls, 2);
    await nav(page, "settings");
    await page.check('input[name="provider"][value="hub"]');

    // 11) Arşiv / geri alma
    await nav(page, "tables");
    await openCap(page, /uyeler\.csv/);
    await page.click("text=Arşivle");
    await toastHas(page, /arşivlendi/);
    await page.click('[data-lf="arsiv"]');
    assert.match(await text(page, "#capList"), /uyeler\.csv/);
    await page.click('[data-lf="etkin"]');

    // 12) Dışa aktarımlar ve ölçüler
    await nav(page, "exports");
    assert.equal(await page.locator("#expTable tbody tr").count(), 3);
    assert.equal(await page.locator("#expTable .pl-badge--danger").count(), 0);
    await shot(page, "masaustu-04-disa-aktarimlar.png");
    await nav(page, "settings");
    s = await state(page);
    assert.equal(s.metrics.verifyPct, 100);
    assert.equal(s.metrics.accuracy, 100);
    assert.ok(s.metrics.neutralized >= 2);
    report.metrics = s.metrics;
    assert.match(await text(page, "#goldInfo"), /elle etiketlenmiş \d+ hücre/);
    await page.evaluate(() => { document.getElementById("view-settings").scrollTop = 0; });
    await shot(page, "masaustu-05-olculer-ayarlar.png");
    await nav(page, "tables");
    await openCap(page, /kütüphaneleri/);
    report.vault = s.vault;
    assert.deepEqual(violations, []);
    await app.close();

    // 13) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.captures.length, 7);
    assert.equal(s.table.columns[1].name, "Kütüphane adı");
    assert.equal(s.exports.length, 3);
    assert.ok(fs.existsSync(path.join(userData, s.vault ? "tablolar.bin" : "tablolar.json")));
    if (s.vault) assert.doesNotMatch(fs.readFileSync(path.join(userData, "tablolar.bin")).toString("latin1"), /kutuphane@/);
    assert.deepEqual(violations, []);
    await app.close();
    console.log(JSON.stringify(report, null, 1));
    console.log("DUMAN TESTİ GEÇTİ (" + process.platform + ", electron " + require(path.join(repo, "node_modules/electron/package.json")).version + ")");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await shot(page, "hata.png"); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
})();
