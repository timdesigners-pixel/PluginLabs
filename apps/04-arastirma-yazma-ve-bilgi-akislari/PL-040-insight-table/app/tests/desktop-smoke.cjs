// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, izin isteklerinin reddi, örnek tablolar (elle etiketli hücre doğruluğu ≥ %99,
// işaretler: türüne uymayan, takvimde olmayan tarih, farklı birim, boş işareti, mükerrer satır; çok satırlı başlık + rowspan/colspan),
// gerçek panodan HTML tablo (Ctrl+C ile kopyalanmış gibi; rowspan/colspan, &nbsp;, <br>), Yapıştır penceresi (CSV + formül enjeksiyonu;
// kaynak adresi doğrulaması), sütun düzenleme (ad, tür zorlama → işaret, sütunu kapatma), başlık satırı aç/kapa, kişisel veri sütunu
// (maskele/çıkar/olduğu gibi), CSV dışa aktarma (BOM, ayraç, ondalık, formül etkisiz, kaynak izi, kişisel veri maskeli, diske yazılıp geri
// okunan gidiş-dönüş farkı 0; Excel (Türkçe) hazır ayarı), JSON dışa aktarma (türlü değerler, kaynak, uyarılar), dosyadan içe aktarma
// (.html: iki tablo + menü listesi atlanır; .csv; desteklenmeyen dosya atlanır; kaynak dosyalar değişmez), MyMind (taklit Hub: anahtar, red,
// onay; kişisel veri/kaynak adresi gönderilmez; tabloda olmayan sütun, örnek dışı satır ve hücre değeri önerileri atılır; ad önerisini
// uygulama), yerel model (loopback; dış adres reddi), arşivleme/geri alma, ölçüler ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "it-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "it-test-"));
const readFile = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00";

// Dosyadan içe aktarma için kaydedilmiş sayfa ve CSV (uydurma veriler)
const htmlPath = path.join(testDir, "kayitli-sayfa.html");
fs.writeFileSync(htmlPath, `<!doctype html><html><head><title>Kütüphane istatistikleri</title><style>td{color:red}</style><script>var x="<table><tr><td>sahte</td></tr></table>";</script></head><body>
<header><ul><li>Anasayfa</li><li>Hakkında</li><li>İletişim</li></ul></header>
<table><caption>Şube ödünç sayıları</caption><tr><th>Şube</th><th>Ödünç</th><th>Değişim</th></tr><tr><td>Merkez</td><td>12.480</td><td>%4,2</td></tr><tr><td>Kadıköy</td><td>8.115</td><td>-%1,5</td></tr><tr><td>Bornova</td><td>6.902</td><td>%0,8</td></tr></table>
<table><tr><th>Yıl</th><th>Üye</th></tr><tr><td>2024</td><td>41.200</td></tr><tr><td>2025</td><td>44.950</td></tr></table>
<footer><ul><li>KVKK</li><li>Çerezler</li></ul></footer></body></html>`, "utf8");
const csvPath = path.join(testDir, "olcumler.csv");
fs.writeFileSync(csvPath, "﻿İstasyon,Sıcaklık,Nem\nA-1,21.5,40\nA-2,19.25,55\n", "utf8");
const pdfPath = path.join(testDir, "rapor.pdf");
fs.writeFileSync(pdfPath, "%PDF-1.4 sahte");
const before = { html: sha(htmlPath), csv: sha(csvPath) };

// Taklit Hub / yerel model (yalnız 127.0.0.1)
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, j) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(j)); };
    if (req.url !== "/v1/chat/completions") return send(404, { error: "yok" });
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = auth === "Bearer " + KEY || (!auth && j.model === "test-model");
    const content = "```json\n" + JSON.stringify({
      sutunlar: [{ no: 1, ad: "Ad soyad" }, { no: 4, ad: "Kayıt tarihi" }, { no: 7, ad: "Uydurma sütun" }, { no: 2, ad: "E-posta", deger: "yeni@example.com" }],
      isaretler: [{ satir: 5, sutun: 2, neden: "e-posta eksik" }, { satir: 99, sutun: 1, neden: "örnek dışı" }],
      satirlar: [["Uydurma Kişi", "x@example.com"]],
    }) + "\n```";
    return ok ? send(200, { choices: [{ message: { role: "assistant", content } }] }) : send(401, { error: "Geçersiz API anahtarı" });
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
const openTable = async (page, re) => {
  const s = await state(page);
  const t = s.tables.find((x) => re.test(x.name));
  assert.ok(t, "tablo yok: " + re);
  await page.click(`#tableList .it-item[data-id="${t.id}"]`);
  await until(page, (i) => !!document.querySelector(`#tableList .it-item.is-sel[data-id="${i}"]`), t.id);
  return t.id;
};
const cell = (page, r, c) => page.textContent(`#previewGrid td[data-cell="${r}:${c}"]`);
const cellClass = (page, r, c) => page.getAttribute(`#previewGrid td[data-cell="${r}:${c}"]`, "class");
const paste = async (page, t, url, title) => {
  await page.click('.it-toolbar [data-act="paste"]');
  await page.fill("#pasteText", t);
  await page.fill("#pasteUrl", url || "");
  await page.fill("#pasteName", title || "");
  await page.click("#pasteRun");
};
const lastAi = () => { const lines = readFile("ai-sent.json").trim().split("\n").filter(Boolean); return lines.length ? JSON.parse(lines[lines.length - 1]) : null; };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Insight Table");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".it-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".it-product"), /Insight Table.*Tablo çıkarıcı.*40/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    report.shortcut = (await state(page)).shortcut;
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek tablolar: hücre doğruluğu, işaretler, çok satırlı başlık
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /4 örnek tablo eklendi/);
    let s = await state(page);
    assert.equal(s.gold.cells, 84);
    assert.equal(s.gold.accuracy, 100);
    report.goldAccuracy = s.gold.accuracy;
    await openTable(page, /Kampanya fiyat listesi/);
    assert.equal(await page.inputValue('[data-col-name="1"]'), "Fiyat");
    assert.match(await page.textContent("#previewGrid thead"), /Otomatik: Para.*TRY/s);
    assert.equal(await cell(page, 0, 1), "1299.9");
    assert.match(await cellClass(page, 4, 1), /is-bad/);
    assert.equal(await cell(page, 4, 1), "389,9O TL");
    assert.match(await cellClass(page, 4, 4), /is-bad/);
    assert.match(await cellClass(page, 3, 1), /is-warn/);
    assert.match(await text(page, "#flagBlock"), /Türüne uymuyor: 1.*Geçersiz tarih: 1.*Mükerrer satır: 1/s);
    assert.match(await text(page, "#flagBlock"), /Sütundan farklı para birimi: “\$12\.99”/);
    await shot(page, "masaustu-01-tablo-onizleme.png");
    await openTable(page, /Q3 2026 sales/);
    assert.equal(await page.inputValue('[data-col-name="1"]'), "Q3 2026 · Revenue");
    assert.equal(await cell(page, 0, 2), "3412");
    assert.equal(await cell(page, 3, 1), "640100");

    // 2) Gerçek panodan HTML tablo (tarayıcıda seçip Ctrl+C gibi)
    const clipHtml = `<meta charset="utf-8"><table><tbody><tr><th>Ürün</th><th>Adet</th><th>Fiyat</th></tr><tr><td>Defter<br>A5</td><td>3</td><td>45,90&nbsp;₺</td></tr><tr><td rowspan="2">Kalem</td><td>10</td><td>12,50 ₺</td></tr><tr><td>5</td><td>13,00 ₺</td></tr></tbody></table>`;
    await app.evaluate(({ clipboard }, v) => clipboard.write({ html: v.html, text: v.text }), { html: clipHtml, text: "Ürün\tAdet\tFiyat\nDefter A5\t3\t45,90 ₺" });
    await nav(page, "tables");
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panodan: 1 tablo \(3 satır × 3 sütun\)/);
    s = await state(page);
    assert.equal(s.active.source.via, "pano");
    assert.deepEqual(s.active.rows.map((r) => r.cells.map((c) => c.raw)), [["Defter\nA5", "3", "45,90 ₺"], ["Kalem", "10", "12,50 ₺"], ["Kalem", "5", "13,00 ₺"]]);
    assert.equal(s.active.columns[2].type, "para");
    assert.equal(s.active.columns[2].unit, "TRY");
    assert.ok(s.active.flags.some((f) => f.code === "birlesik" && f.row === 2 && f.col === 0));
    // Panoda yalnız düz metin varsa da çalışır
    await app.evaluate(({ clipboard }) => clipboard.clear());
    await page.click('.it-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panoda içerik yok/);

    // 3) Yapıştır: kaynak adresi doğrulaması, CSV + formül enjeksiyonu + kişisel veri
    await paste(page, "a,b\n1,2", "javascript:alert(1)");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.click("#pasteCancel");
    const csvText = "Bağışçı;E-posta;Tutar;Not\nAyşe K.;ayse@example.com;1.250,00;=HYPERLINK(\"http://kotu.example\",\"tıkla\")\nCan D.;can@example.org;75,50;+90 532 000 00 07 aradı\nDeniz;deniz@example.net;2.000;@SUM(A1:A9)\nEce;ece@example.com;-;-indirim\n";
    await paste(page, csvText, "https://dernek.example/bagislar", "Bağışlar");
    await toastHas(page, /Yeni: 1 tablo \(4 satır × 4 sütun\)/);
    s = await state(page);
    assert.equal(s.active.name, "Bağışlar");
    assert.equal(s.active.columns[1].pii, "email");
    assert.equal(s.active.columns[1].piiAction, "maske");
    assert.equal(s.active.columns[2].type, "ondalik");
    assert.ok(await page.isVisible("#piiBlock"));
    await page.evaluate(() => document.getElementById("flagBlock").scrollIntoView({ block: "start" }));
    await shot(page, "masaustu-02-uyarilar-kisisel-veri.png");

    // 4) CSV dışa aktarma (standart): BOM, formül etkisiz, maskeli e-posta, metin içi telefon maskeli, kaynak izi, gidiş-dönüş 0
    await page.click("#csvBtn");
    await toastHas(page, /“bagislar\.csv” kaydedildi: 4 satır × 4 sütun · 3 formül etkisizleştirildi · \d+ kişisel değer maskelendi · gidiş-dönüş farkı 0/);
    let out = readFile("bagislar.csv");
    assert.ok(out.startsWith("﻿Bağışçı,E-posta,Tutar,Not,kaynak_satir\r\n"));
    assert.ok(out.includes('Ayşe K.,a***@example.com,1250,"\'=HYPERLINK(""http://kotu.example"",""tıkla"")",2\r\n'));
    assert.ok(out.includes("Can D.,c***@example.org,75.5,*** *** ** 07 aradı,3\r\n"));
    assert.ok(out.includes("Deniz,d***@example.net,2000,'@SUM(A1:A9),4\r\n"));
    assert.ok(out.includes("Ece,e***@example.com,,'-indirim,5\r\n"));
    assert.ok(!/ayse@|can@|deniz@|0532/.test(out), "kişisel veri maskelenmeli");
    // Excel (Türkçe) hazır ayarı + e-postayı çıkar
    await nav(page, "settings");
    await page.click("#presetExcel");
    await toastHas(page, /Excel \(Türkçe\)/);
    await nav(page, "tables");
    await page.selectOption('[data-pii="1"]', "cikar");
    await until(page, () => window.itDesktop.state().then((s) => s.active.columns[1].piiAction === "cikar"));
    await page.click("#csvBtn");
    await toastHas(page, /gidiş-dönüş farkı 0/);
    out = readFile("bagislar.csv");
    assert.ok(out.startsWith("﻿Bağışçı;Tutar;Not;kaynak_satir\r\n"));
    assert.ok(out.includes('Ayşe K.;1250;"\'=HYPERLINK(""http://kotu.example"",""tıkla"")";2\r\n'), "noktalı virgül ayraç");
    assert.ok(out.includes("Can D.;75,5;"), "virgül ondalık");
    assert.ok(!out.includes("@example"), "çıkarılan sütun yazılmaz");

    // 5) JSON dışa aktarma: türlü değerler, kaynak, kaynak satırı, uyarılar
    await page.click("#jsonBtn");
    await toastHas(page, /“bagislar\.json” kaydedildi: 4 satır/);
    const j = JSON.parse(readFile("bagislar.json"));
    assert.equal(j.kaynak.adres, "https://dernek.example/bagislar");
    assert.match(j.kaynak.uygulama, /^Insight Table 0\.\d+\.\d+$/);
    assert.deepEqual(j.satirlar.map((r) => r.tutar), [1250, 75.5, 2000, null]);
    assert.equal(j.satirlar[0].not, '=HYPERLINK("http://kotu.example","tıkla")');
    assert.equal(j.satirlar[1].not, "*** *** ** 07 aradı");
    assert.ok(!("e_posta" in j.satirlar[0]));
    assert.deepEqual(j.satirlar.map((r) => r._kaynak_satir), [2, 3, 4, 5]);

    // 6) Sütun düzenleme: ad, tür zorlama (işaret), sütunu kapatma; başlık satırı aç/kapa
    await page.fill('[data-col-name="3"]', "Açıklama:");
    await page.press('[data-col-name="3"]', "Tab");
    await until(page, () => window.itDesktop.state().then((s) => s.active.columns[3].name === "Açıklama"));
    await page.selectOption('[data-col-type="0"]', "tamsayi");
    await until(page, () => window.itDesktop.state().then((s) => s.active.columns[0].forced && s.active.summary.bad === 4));
    assert.match(await cellClass(page, 0, 0), /is-bad/);
    await page.selectOption('[data-col-type="0"]', "oto");
    await until(page, () => window.itDesktop.state().then((s) => !s.active.columns[0].forced && s.active.summary.bad === 0));
    await page.uncheck('[data-col-inc="3"]');
    await until(page, () => window.itDesktop.state().then((s) => s.active.columns[3].include === false));
    await page.click("#csvBtn");
    await toastHas(page, /4 satır × 2 sütun/);
    assert.ok(readFile("bagislar.csv").startsWith("﻿Bağışçı;Tutar;kaynak_satir\r\n"));
    await page.uncheck("#headerToggle");
    await until(page, () => window.itDesktop.state().then((s) => s.active.headerRows === 0 && s.active.summary.rows === 5));
    assert.equal(await page.inputValue('[data-col-name="0"]'), "Sütun 1");
    await page.check("#headerToggle");
    await until(page, () => window.itDesktop.state().then((s) => s.active.headerRows === 1));
    await page.fill("#tableName", "Dernek bağışları");
    await page.press("#tableName", "Tab");
    await until(page, () => window.itDesktop.state().then((s) => s.active.name === "Dernek bağışları"));

    // 7) Dosyadan: .html (iki tablo; script içindeki sahte tablo ve menü listeleri atlanır), .csv (BOM), desteklenmeyen dosya atlanır
    setFile("pick.txt", [htmlPath, csvPath, pdfPath].join("\n"));
    await page.click('.it-toolbar [data-act="files"]');
    await toastHas(page, /3 tablo alındı · 1 dosya atlandı/);
    rmFile("pick.txt");
    s = await state(page);
    const fromFile = s.tables.filter((t) => t.source.via === "dosya");
    assert.deepEqual(fromFile.map((t) => t.name).sort(), ["Kütüphane istatistikleri · 2/2", "olcumler", "Şube ödünç sayıları · 1/2"].sort());
    await openTable(page, /Şube ödünç/);
    s = await state(page);
    assert.deepEqual(s.active.rows.map((r) => r.cells.map((c) => c.v)), [["Merkez", 12480, 4.2], ["Kadıköy", 8115, -1.5], ["Bornova", 6902, 0.8]]);
    await openTable(page, /olcumler/);
    s = await state(page);
    assert.equal(s.active.columns[0].name, "İstasyon");
    assert.deepEqual(s.active.rows.map((r) => r.cells[1].v), [21.5, 19.25]);
    assert.equal(sha(htmlPath), before.html, "kaynak .html değişmemeli");
    assert.equal(sha(csvPath), before.csv, "kaynak .csv değişmemeli");

    // 8) MyMind: anahtarsız hata, anahtar, red (istek yok), onay; veri azaltma ve yanıt denetimi; ad önerisini uygulama
    await openTable(page, /Atölye katılımcıları/);
    await page.click("#aiBtn");
    await toastHas(page, /Hub istemci anahtarını girin/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", "kisa");
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
    await page.click("#aiBtn");
    await toastHas(page, /MyMind: 2 ad önerisi, 1 işaret; \d+ öğe denetimde atıldı/);
    assert.equal(hubCalls, 1);
    const sent = JSON.stringify(lastAi().messages);
    assert.ok(!/example\.(com|org|net)|0532|0533|etkinlik\.example|Atölye katılımcıları/.test(sent), "kişisel veri, kaynak adresi ve başlık gönderilmemeli");
    assert.ok(sent.includes("⟦e-posta⟧") && sent.includes("Elif Kaya"));
    const approvals = readFile("approvals.txt");
    assert.match(approvals, /kişisel veri sütununun değerleri GÖNDERİLMEZ/);
    s = await state(page);
    assert.equal(s.active.ai.cellBlocked, 2);
    assert.match(await text(page, "#aiBlock"), /Ad → Ad soyad.*Kayıt → Kayıt tarihi/s);
    assert.match(await text(page, "#aiBlock"), /hücre değeri önerisi/);
    assert.match(await text(page, "#flagBlock"), /MyMind: e-posta eksik/);
    await page.evaluate(() => document.getElementById("aiBlock").scrollIntoView({ block: "center" }));
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click("#aiApply");
    await toastHas(page, /2 sütun adı MyMind önerisiyle güncellendi/);
    s = await state(page);
    assert.deepEqual(s.active.columns.map((c) => c.name), ["Ad soyad", "E-posta", "Telefon", "Kayıt tarihi"]);
    assert.equal(s.active.rows[0].cells[0].raw, "Elif Kaya", "hücre değerleri değişmez");

    // 9) Yerel model: dış adres reddi, loopback sunucuyla çalışır (anahtarsız)
    await nav(page, "settings");
    await page.check('input[name="provider"][value="yerel"]');
    await until(page, () => !document.getElementById("localBox").hidden);
    await page.fill("#localUrl", "https://uzak.example:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await nav(page, "tables");
    await openTable(page, /Bağış listesi/);
    await page.click("#aiBtn");
    await toastHas(page, /MyMind: /);
    assert.equal(hubCalls, 2);
    assert.equal(lastAi().provider, "yerel");

    // 10) Arşiv / geri alma
    await openTable(page, /Q3 2026 sales/);
    await page.click("#tableDetail .it-actions button:last-child");
    await toastHas(page, /arşivlendi \(silinmedi\)/);
    await nav(page, "archive");
    assert.match(await text(page, "#tableList"), /Q3 2026 sales/);
    await page.click("#tableList .it-item");
    await page.click("#tableDetail .it-block button");
    await toastHas(page, /geri alındı/);
    s = await state(page);
    assert.equal(s.metrics.archived, 0);

    // 11) Ölçüler
    await nav(page, "settings");
    s = await state(page);
    report.metrics = s.metrics;
    assert.equal(s.metrics.mismatch, 0);
    assert.equal(s.metrics.csv, 3);
    assert.equal(s.metrics.json, 1);
    assert.ok(s.metrics.neutralized >= 3);
    assert.match(await text(page, "#metrics"), /%100.*örnek tablolarda hücre doğruluğu/s);
    await page.click('input[name="provider"][value="hub"]');
    await until(page, () => document.getElementById("localBox").hidden);
    await page.evaluate(() => { document.getElementById("view-settings").scrollTop = 0; });
    await shot(page, "masaustu-04-olculer-ayarlar.png");
    await nav(page, "tables");
    await openTable(page, /Kampanya fiyat listesi/);
    await shot(page, "masaustu-05-tablolar.png");

    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = (await state(page)).vault;
    const count = (await state(page)).tables.length;
    await app.close();

    // 12) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.tables.length, count);
    assert.ok(s.tables.some((t) => t.name === "Dernek bağışları"));
    assert.equal(s.settings.csvDelimiter, ";");
    if (s.vault) assert.ok(s.hasKey, "kasa varken anahtar kalıcı");
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify({ ...report, hubCalls, platform: process.platform }));
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
