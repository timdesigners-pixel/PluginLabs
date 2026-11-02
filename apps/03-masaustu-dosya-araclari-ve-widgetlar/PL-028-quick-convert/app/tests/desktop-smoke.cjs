// Masaüstü duman testi: gerçek Electron pencereleri (ana pencere + her zaman üstte bırakma kutusu), gerçek Chromium kod çözücü/kodlayıcı,
// gerçek dosyalar (üretilmiş PNG/BMP/GIF, bozuk PNG, yürütülebilir taklidi, PDF, Windows-1254/UTF-8 metin), gerçek kalıcılık ve yeniden açılış;
// MyMind için taklit Hub. TEST kipinde onaylar, dosya seçimleri ve "klasörde göster" dosyaya yazılır.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), zlib = require("node:zlib"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const C = require("../src/core.js");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "qc-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "qc-test-"));
const src = path.join(testDir, "Fotoğraflar ve belgeler");
const outDir = path.join(testDir, "Çıktılar");
fs.mkdirSync(src); fs.mkdirSync(outDir);
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

// ---- Test dosyaları ----
function png(w, h, rgba) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = rgba(x, y), o = y * (w * 4 + 1) + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3]; }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function bmp(w, h) {
  const row = Math.ceil((w * 3) / 4) * 4, size = 54 + row * h, b = Buffer.alloc(size);
  b.write("BM", 0); b.writeUInt32LE(size, 2); b.writeUInt32LE(54, 10); b.writeUInt32LE(40, 14); b.writeInt32LE(w, 18); b.writeInt32LE(h, 22); b.writeUInt16LE(1, 26); b.writeUInt16LE(24, 28); b.writeUInt32LE(row * h, 34);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = 54 + y * row + x * 3; b[o] = (x * 4) & 255; b[o + 1] = (y * 5) & 255; b[o + 2] = 200; }
  return b;
}
// Fotoğrafa benzer: yumuşak geçişler + doku (JPEG/WebP için gerçekçi boyut), saydamlık yok.
const photo = png(2400, 1600, (x, y) => [Math.round(128 + 100 * Math.sin(x / 140) * Math.cos(y / 90)), Math.round((x * 255) / 2400), Math.round((y * 255) / 1600 + ((x * 7 + y * 13) % 23)), 255]);
const logo = png(320, 320, (x, y) => { const d = Math.hypot(x - 160, y - 160); return d < 120 ? [124, 108, 255, 255] : d < 140 ? [255, 255, 255, Math.round(255 * (140 - d) / 20)] : [0, 0, 0, 0]; });
const F = {
  photo: path.join(src, "tatil fotoğrafı.png"), logo: path.join(src, "logo.png"), bmp: path.join(src, "eski tarama.bmp"), gif: path.join(src, "ikon.gif"),
  broken: path.join(src, "yarım kalmış.png"), exe: path.join(src, "fatura.png.exe"), fakepng: path.join(src, "kurulum.png"), pdf: path.join(src, "sözleşme.pdf"),
  srt: path.join(src, "altyazı.srt"), price: path.join(src, "fiyat listesi.txt"),
};
fs.writeFileSync(F.photo, photo);
fs.writeFileSync(F.logo, logo);
fs.writeFileSync(F.bmp, bmp(64, 48));
fs.writeFileSync(F.gif, Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
fs.writeFileSync(F.broken, photo.subarray(0, 3000));
fs.writeFileSync(F.exe, Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "latin1"), Buffer.alloc(200)]));
fs.writeFileSync(F.fakepng, Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "latin1"), Buffer.alloc(200)]));
fs.writeFileSync(F.pdf, "%PDF-1.7\n%âãÏÓ\n1 0 obj\n");
const SRT = "1\r\n00:00:01,000 --> 00:00:03,000\r\nÇağrı, ılık şişe ve Ğ/İ/Ş harfleri.\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\n“Tırnaklı” söz — €5\r\n";
fs.writeFileSync(F.srt, Buffer.from(C.encodeText(SRT, "windows-1254").bytes));
const PRICE = "Ürün;Fiyat\nÇay;45 ₺\nKahve;80 ₺\n";
fs.writeFileSync(F.price, PRICE);
const before = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, sha(f)]));

// Taklit Hub: /v1/chat/completions; anahtar doğrulanır. İzinsiz alan ("komut") da döner; uygulama yok saymalı.
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content = "```json\n" + JSON.stringify({ bicim: "webp", kalite: 82, boyutlandir: "sigdir", genislik: 1200, yukseklik: 1200, komut: "del C:\\*", gerekce: "Blog görselleri için WebP hem küçük hem nettir; 1200 px yeterli." }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + JSON.stringify(arg || ""));
}
function watch(page, violations) {
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, QC_USER_DATA: userData, QC_TEST_DIR: testDir, QC_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  watch(page, violations);
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1180, height: 760 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
async function dropOf(app, violations) {
  for (let i = 0; i < 200; i++) {
    const w = app.windows().find((x) => /drop\.html$/.test(x.url()));
    if (w) { watch(w, violations); await until(w, () => document.documentElement.dataset.ready === "1"); return w; }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Bırakma kutusu açılmadı");
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.qcDesktop.state());
const byName = (st, name) => st.items.find((x) => x.name === name);
const outFiles = (dir) => fs.readdirSync(dir).filter((n) => /-donusturuldu/.test(n)).sort();
const idle = (page) => until(page, () => document.getElementById("busy").hidden && !/Dönüştürülüyor/.test(document.getElementById("convertBtn").textContent));

(async () => {
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const port = hub.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Quick Convert");
    assert.match(await page.textContent(".qc-product"), /Quick Convert.*Bırak, dönüştür.*28/s);
    assert.match(await page.textContent("#queue"), /Kuyruk boş/);

    // 1) Dosya ekleme (sürükle-bırakla aynı yol: ana süreçte içerikten tür tanıma) + "Dosya seç" (TEST: pick.txt)
    let r = await page.evaluate((p) => window.qcDesktop.add(p), [F.photo, F.logo, F.bmp, F.gif, F.broken, F.exe, F.fakepng, F.pdf]);
    assert.equal(r.added.length, 8);
    setFile("pick.txt", [F.srt, F.price].join("\n"));
    await page.click("#pickBtn");
    await toastHas(page, /2 dosya kuyruğa eklendi/);
    let st = await state(page);
    assert.equal(byName(st, "tatil fotoğrafı.png").width, 2400);
    assert.equal(byName(st, "fatura.png.exe").status, "blocked");
    assert.match(byName(st, "kurulum.png").error, /Yürütülebilir/);
    assert.match(byName(st, "sözleşme.pdf").error, /PDF bu sürümde desteklenmiyor/);
    assert.equal(byName(st, "altyazı.srt").encoding, "windows-1254");
    assert.equal(byName(st, "altyazı.srt").eol, "crlf");
    assert.equal(byName(st, "fiyat listesi.txt").encoding, "utf-8");
    assert.match(byName(st, "ikon.gif").warn, /ilk karesi/);
    assert.match(await page.textContent("#queue"), /Desteklenmiyor/);
    assert.equal(await page.textContent("#convertBtn"), "Dönüştür (7 dosya)");

    // 2) Hazır ayar "E-posta / WhatsApp" (JPEG, 1600 px, %80) ile tümünü dönüştür; bozuk PNG çökme olmadan hata verir
    await page.click('[data-preset="mail"]');
    await until(page, () => document.getElementById("imgSummary").textContent === "JPEG · kalite %80 · en fazla 1600×1600 px");
    await page.keyboard.press("Control+Enter");
    await toastHas(page, /6 dosya dönüştürüldü, 1 dosyada hata/);
    await idle(page);
    st = await state(page);
    assert.equal(byName(st, "yarım kalmış.png").status, "error");
    assert.match(byName(st, "yarım kalmış.png").error, /çözülemedi/);
    let outs = outFiles(src);
    assert.deepEqual(outs, ["altyazı-donusturuldu.srt", "eski tarama-donusturuldu.jpg", "fiyat listesi-donusturuldu.txt", "ikon-donusturuldu.jpg", "logo-donusturuldu.jpg", "tatil fotoğrafı-donusturuldu.jpg"]);
    const ph = fs.readFileSync(path.join(src, "tatil fotoğrafı-donusturuldu.jpg"));
    assert.equal(C.sniff(ph, "").type, "jpeg");
    assert.deepEqual(C.imageSize(ph, "jpeg"), { width: 1600, height: 1067 });
    assert.ok(ph.length < photo.length, "JPEG küçük olmalı");
    assert.match(byName(st, "tatil fotoğrafı.png").result.quality, /kalite %80 · \d+,\d dB/);
    assert.match(byName(st, "logo.png").result.note, /Saydam alanlar #ffffff ile dolduruldu/);
    assert.deepEqual(C.imageSize(fs.readFileSync(path.join(src, "eski tarama-donusturuldu.jpg")), "jpeg"), { width: 64, height: 48 });
    // Metin: Windows-1254 → UTF-8, CRLF korunur; kayıpsız
    assert.equal(fs.readFileSync(path.join(src, "altyazı-donusturuldu.srt"), "utf8"), SRT);
    assert.match(byName(st, "altyazı.srt").result.note, /kayıpsız/);
    assert.match(byName(st, "fiyat listesi.txt").result.note, /birebir kopya/);
    report.photoKB = Math.round(ph.length / 1024);
    await shot(page, "masaustu-01-kuyruk-ve-sonuclar.png");

    // 3) Kurala dayalı öneri: "web sitesi için webp, en fazla 150 KB" → uygula → yeniden dönüştür (hedef KB)
    await page.click("#clearDone");
    r = await page.evaluate((p) => window.qcDesktop.add(p), [F.photo]);
    await page.fill("#need", "Bu fotoğrafı web sitesi için webp yap, en fazla 150 KB olsun");
    await page.click("#suggestBtn");
    await until(page, () => !document.getElementById("suggestion").hidden);
    assert.match(await page.textContent("#suggestion"), /Yerel kural.*WebP · en fazla 150 KB · en fazla 1920×1920 px/s);
    await shot(page, "masaustu-02-oneri.png");
    await page.click("#applySuggestion");
    await toastHas(page, /Öneri ayarlara uygulandı/);
    st = await state(page);
    assert.equal(st.settings.image.format, "webp"); assert.equal(st.settings.image.maxKB, 150);
    await page.click("#convertBtn");
    await toastHas(page, /1 dosya dönüştürüldü/);
    await idle(page);
    const wp = fs.readFileSync(path.join(src, "tatil fotoğrafı-donusturuldu.webp"));
    assert.equal(C.sniff(wp, "").type, "webp");
    assert.ok(wp.length <= 150 * 1024, "WebP 150 KB altında olmalı: " + wp.length);
    assert.deepEqual(C.imageSize(wp, "webp"), { width: 1920, height: 1280 });
    report.webpKB = Math.round(wp.length / 1024);

    // 4) MyMind: anahtar kaydı, onay penceresinde yalnız ihtiyaç + tür/ölçü; dosya adı/yolu gönderilmez; izinsiz alan yok sayılır
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /MyMind anahtarı/);
    r = await page.evaluate((p) => window.qcDesktop.add(p), [F.photo]);
    await page.fill("#need", "Blogumdaki yazılar için görselleri hafiflet ama net kalsın");
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderim iptal edildi/);
    assert.equal(readLog("mymind-sent.json"), "", "reddedilen istek gönderilmemeli");
    setFile("deny.txt", "0");
    await page.click("#aiBtn");
    await until(page, () => /MyMind/.test(document.getElementById("suggestion").textContent) && !document.getElementById("suggestion").hidden);
    const sent = readLog("mymind-sent.json");
    assert.match(sent, /Blogumdaki yazılar/); assert.match(sent, /2400×1600 px/);
    assert.doesNotMatch(sent, /tatil|Fotoğraflar|qc-test/);
    assert.match(readLog("approvals.txt"), /Dosyanın adı, konumu ve içeriği gönderilmez/);
    assert.match(await page.textContent("#suggestion"), /WebP · kalite %82 · en fazla 1200×1200 px/);
    assert.match(await page.textContent("#suggestion"), /yok sayılan: komut/);
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click("#applySuggestion");
    st = await state(page);
    assert.equal(st.settings.image.width, 1200); assert.equal(st.settings.image.maxKB, 0);

    // 5) Seçilen klasöre yaz + Windows-1254'e sığmayan "₺" varsayılan olarak durdurur, izinle "?" yazar
    setFile("outdir.txt", outDir);
    await page.click('[data-out="folder"]');
    await until(page, (d) => document.getElementById("outPath").textContent === d, outDir);
    await page.selectOption("#to", "windows-1254");
    await page.selectOption("#eol", "crlf");
    r = await page.evaluate((p) => window.qcDesktop.add(p), [F.price]);
    await page.click("#convertBtn");
    await toastHas(page, /1 dosya dönüştürüldü, 1 dosyada hata/);
    await idle(page);
    st = await state(page);
    const priceItem = st.items.filter((x) => x.name === "fiyat listesi.txt").pop();
    assert.match(priceItem.error, /“₺” ×2/);
    assert.deepEqual(C.imageSize(fs.readFileSync(path.join(outDir, "tatil fotoğrafı-donusturuldu.webp")), "webp"), { width: 1200, height: 800 });
    await page.click("#replace");
    await page.evaluate((p) => window.qcDesktop.add(p), [F.price]);
    await page.click("#convertBtn");
    await toastHas(page, /1 dosya dönüştürüldü\./);
    await idle(page);
    assert.equal(fs.readFileSync(path.join(outDir, "fiyat listesi-donusturuldu.txt"), "latin1"), "\xdcr\xfcn;Fiyat\r\n\xc7ay;45 ?\r\nKahve;80 ?\r\n");

    // 6) Bırakma kutusu: her zaman üstte; bırakılan dosya geçerli ayarlarla hemen dönüştürülür
    await page.click("#dropBtn");
    const dw = await dropOf(app, violations);
    await until(page, () => document.getElementById("dropState").textContent === "Açık");
    assert.match(await dw.textContent("#preset"), /WebP · kalite %82 · en fazla 1200×1200 px · metin → Windows-1254/);
    await dw.evaluate((p) => window.qcDesktop.dropAdd(p), [F.logo]);
    await until(page, () => /1 dosya dönüştürüldü/.test(document.getElementById("toasts").textContent));
    await idle(page);
    const lw = fs.readFileSync(path.join(outDir, "logo-donusturuldu.webp"));
    assert.equal(C.sniff(lw, "").type, "webp");
    await until(dw, () => /dönüştürüldü/.test(document.getElementById("status").textContent));
    // Bırakma kutusu dosya okuyamaz/yazamaz (yalnız ana pencere)
    await assert.rejects(dw.evaluate(() => window.qcDesktop.read("x")), /Yetkisiz/);
    if (shots) await dw.screenshot({ path: path.join(shots, "masaustu-05-birakma-kutusu.png") });

    // 7) Geçmiş, klasörde göster, komut paleti
    await page.click('[data-nav="history"]');
    await until(page, () => document.querySelectorAll("#history .qc-hrow").length === 10);
    assert.match(await page.textContent("#kpis"), /Dönüşüm\s*10/);
    await page.click("#history .qc-hrow >> text=Klasörde göster");
    await until(page, () => true);
    for (let i = 0; i < 40 && !readLog("reveal.txt"); i++) await page.waitForTimeout(50);
    assert.match(readLog("reveal.txt"), /-donusturuldu/);
    await shot(page, "masaustu-04-gecmis.png");
    await page.keyboard.press("Control+K");
    await until(page, () => document.getElementById("palette").open);
    await page.keyboard.type("kayıpsız");
    await page.keyboard.press("Enter");
    await until(page, () => !document.getElementById("palette").open);
    st = await state(page);
    assert.equal(st.settings.image.format, "png");
    await page.keyboard.press("Control+3");
    assert.match(await page.textContent("#privacy"), /dosyalar hiçbir sunucuya yüklenmez/);
    assert.match(await page.textContent("#support"), /HEIC\/AVIF/);

    // Kaynak dosyaların hiçbiri değişmedi (SHA-256)
    for (const [k, f] of Object.entries(F)) assert.equal(sha(f), before[k], "kaynak değişti: " + f);
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    await app.close();

    // 8) Yeniden açılış: ayarlar ve geçmiş kalıcı (kasa varsa şifreli); kuyruk oturumluk
    ({ app, page, violations } = await launch(port));
    st = await state(page);
    assert.equal(st.history.length, 10);
    assert.equal(st.items.length, 0);
    assert.equal(st.settings.image.format, "png");
    assert.equal(st.settings.output, "folder");
    assert.equal(st.hasKey || !st.vault, true);
    const files = fs.readdirSync(userData);
    report.vault = files.includes("donustur.bin");
    if (report.vault) assert.ok(!fs.readFileSync(path.join(userData, "donustur.bin")).includes(Buffer.from("altyaz")), "şifreli kayıt düz metin içermemeli");
    else assert.ok(files.includes("donustur.json"));
    // PNG kayıpsız: PSNR "birebir"
    await page.evaluate((p) => window.qcDesktop.add(p), [F.bmp]);
    await page.click("#convertBtn");
    await toastHas(page, /1 dosya dönüştürüldü/);
    await idle(page);
    st = await state(page);
    assert.match(st.items[0].result.quality, /kayıpsız \(birebir\)/);
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    report.outputs = outFiles(src).length + outFiles(outDir).length;
    report.history = st.history.length;
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    hub.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
