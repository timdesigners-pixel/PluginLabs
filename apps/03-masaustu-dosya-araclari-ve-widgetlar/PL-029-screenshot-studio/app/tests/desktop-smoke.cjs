// Masaüstü duman testi: gerçek Electron pencereleri (ana pencere + tam ekran bölge seçim katmanı), gerçek OCR (Tesseract, cihazda),
// gerçek tuval çizimi, gerçek pano ve dosya yazımı, gerçek kalıcılık ve yeniden açılış; MyMind için taklit Hub.
// "Ekran" bilinen bir test görüntüsüdür (uygulamanın kendi tuvalinde çizilir: ad, e-posta, IBAN, kart, telefon, API anahtarı).
// Bağımsız kanıt: kaydedilen dosya testte AYRI bir Tesseract çalıştırmasıyla okunur; maskelenen değerlerin hiçbiri okunamamalı.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ss-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ss-test-"));
const outDir = path.join(testDir, "Ekran görüntüleri");
fs.mkdirSync(outDir);
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";
const t0 = Date.now();
const log = (m) => console.log("[" + ((Date.now() - t0) / 1000).toFixed(1) + " sn] " + m);

// Taklit Hub: /v1/chat/completions; anahtar doğrulanır. Gönderilmeyen kelime ("Olmayan") ve izinsiz alan ("komut") da döner; uygulama yok saymalı.
let hubBody = "";
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubBody = body;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content = "```json\n" + JSON.stringify({ hassas: [{ kelime: "Ayşe", neden: "kişi adı" }, { kelime: "Yılmaz", neden: "soyadı" }, { kelime: "Olmayan", neden: "uydurma" }], komut: "del C:\\*" }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 1200) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + JSON.stringify(arg || ""));
}
function watch(page, violations) {
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
}
async function launch() {
  const app = await electron.launch({
    executablePath: electronPath, args: [repo],
    env: { ...process.env, SS_USER_DATA: userData, SS_TEST_DIR: testDir, SS_HUB_URL: "http://127.0.0.1:" + hub.address().port, ELECTRON_DISABLE_SECURITY_WARNINGS: "1" },
  });
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1360, height: 820 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page };
}
const shot = async (page, name) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); log("ekran görüntüsü: " + name); } };
// Görüntü koordinatını tuvalin ekrandaki konumuna çevirir.
async function at(page, x, y) {
  const r = await page.evaluate(() => { const c = document.getElementById("canvas"); const b = c.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height, W: c.width, H: c.height }; });
  return { x: r.l + (x * r.w) / r.W, y: r.t + (y * r.h) / r.H };
}
async function drag(page, a, b) {
  const p = await at(page, a[0], a[1]), q = await at(page, b[0], b[1]);
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2, { steps: 4 }); await page.mouse.move(q.x, q.y, { steps: 4 }); await page.mouse.up();
}
async function clickAt(page, x, y) { const p = await at(page, x, y); await page.mouse.click(p.x, p.y); }
async function ocrFile(file) {
  const T = require(require.resolve("tesseract.js", { paths: [repo] }));
  const w = await T.createWorker(["tur", "eng"], 1, { langPath: path.join(repo, "ocr-data"), gzip: true, cacheMethod: "none", logger: () => {} });
  const r = await w.recognize(file);
  await w.terminate();
  return r.data.text;
}

(async () => {
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const violations = [];
  let { app, page } = await launch();
  watch(page, violations);
  log("uygulama açıldı");

  // ---- Test "ekranı": uygulamanın kendi tuvalinde çizilir (gerçek yazı tipi, gerçek kenar yumuşatma). ----
  const screenUrl = await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 1440; c.height = 900;
    const g = c.getContext("2d");
    g.fillStyle = "#eef1f7"; g.fillRect(0, 0, 1440, 900);
    g.fillStyle = "#1b2236"; g.fillRect(0, 0, 1440, 56);
    g.fillStyle = "#ffffff"; g.font = "600 22px Inter, 'Segoe UI', 'DejaVu Sans', sans-serif"; g.fillText("Fatura ayrıntıları — Hesabım", 32, 36);
    g.fillStyle = "#ffffff"; g.fillRect(80, 100, 1000, 560);
    g.strokeStyle = "#cdd3e0"; g.strokeRect(80, 100, 1000, 560);
    g.fillStyle = "#0e1424"; g.font = "26px 'DejaVu Sans', 'Segoe UI', Arial, sans-serif";
    const rows = ["Müşteri: Ayşe Yılmaz", "E-posta: ayse.yilmaz@ornek.com.tr", "IBAN: TR33 0006 1005 1978 6457 8413 26", "Kart: 4111 1111 1111 1111", "Telefon: 0532 123 45 67", "API anahtarı: sk-proj-AbCdEf0123456789XyZ", "Toplam tutar: 1.250,00 TL"];
    rows.forEach((t, i) => g.fillText(t, 120, 160 + i * 66));
    g.fillStyle = "#7c6cff"; g.fillRect(120, 610, 180, 36); g.fillStyle = "#fff"; g.font = "600 20px sans-serif"; g.fillText("Ödemeyi onayla", 132, 635);
    return c.toDataURL("image/png");
  });
  fs.writeFileSync(path.join(testDir, "screen.png"), Buffer.from(screenUrl.split(",")[1], "base64"));
  setFile("outdir.txt", outDir);

  await shot(page, "masaustu-01-bos-durum.png");
  // Kayıt klasörü (test klasörü; kullanıcının Resimler klasörüne dokunulmaz)
  await page.click('[data-nav="settings"]');
  await page.click("#chooseDir");
  await until(page, (d) => document.getElementById("dirInfo").textContent === d, outDir);
  await page.click('[data-nav="studio"]');

  // ---- 1) Bölge yakalama: gerçek tam ekran seçim katmanı, fareyle sürükleme ----
  const overlayP = app.waitForEvent("window");
  await page.click("#capRegion");
  const ov = await overlayP;
  watch(ov, violations);
  await until(ov, () => document.documentElement.dataset.ready === "1");
  assert.equal(await ov.evaluate(() => typeof window.ssDesktop), "undefined", "seçim katmanı ana pencere arayüzüne erişmemeli");
  const ovSize = await ov.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const k = { x: ovSize.w / 1440, y: ovSize.h / 900 };
  await ov.mouse.move(70 * k.x, 90 * k.y); await ov.mouse.down(); await ov.mouse.move(600 * k.x, 400 * k.y, { steps: 5 }); await ov.mouse.move(1100 * k.x, 680 * k.y, { steps: 5 }); await ov.mouse.up();
  await until(page, () => !document.getElementById("canvasWrap").hidden);
  const size = await page.evaluate(() => ({ W: document.getElementById("canvas").width, H: document.getElementById("canvas").height }));
  // Test ekranı görüntüye 1440×900'den ekran ölçüsüne (ör. Windows runner'da 1024×768) esnetilerek gelir; beklenen oran buna göre.
  const want = (1030 * k.x) / (590 * k.y);
  assert.ok(size.W > 500 && size.H > 280 && Math.abs(size.W / size.H - want) / want < 0.04, "bölge kırpılmadı: " + JSON.stringify(size) + " beklenen oran " + want.toFixed(3));
  log("bölge yakalandı: " + size.W + "×" + size.H);

  // ---- 2) Hassas alan taraması (otomatik; gerçek OCR) ----
  await until(page, () => /kelime okundu/.test(document.getElementById("scanInfo").textContent), null, 2400);
  const labels = await page.evaluate(() => [...document.querySelectorAll(".ss-cand b")].map((b) => b.textContent));
  log("adaylar: " + labels.join(" | "));
  for (const want of ["E-posta adresi", "IBAN", "Kart numarası", "Telefon numarası", "API anahtarı / erişim belirteci"]) assert.ok(labels.includes(want), want + " adayı yok: " + labels.join(", "));
  const hints = await page.evaluate(() => [...document.querySelectorAll(".ss-cand span")].map((b) => b.textContent).join(" "));
  assert.ok(!/yilmaz@|1978 6457|4111 1111 1111/.test(hints), "aday listesi değeri açık gösteriyor: " + hints);

  // ---- 3) İşaretleme: ok, numaralar, kutu, metin, vurgu (görüntü koordinatı; bölge 70,90'dan başlar) ----
  const o = (x, y) => [(x - 70) * size.W / 1030, (y - 90) * size.H / 590];
  await page.keyboard.press("a");
  await drag(page, o(560, 640), o(320, 630));
  await page.keyboard.press("n");
  await clickAt(page, ...o(100, 150));
  await clickAt(page, ...o(100, 545));
  await page.keyboard.press("r");
  await drag(page, o(112, 600), o(310, 652));
  await page.keyboard.press("h");
  await drag(page, o(115, 530), o(460, 562));
  await page.keyboard.press("t");
  await clickAt(page, ...o(348, 598));
  await until(page, () => !document.getElementById("textInput").hidden && document.activeElement === document.getElementById("textInput"));
  await page.keyboard.type("Buradan onaylayın");
  await page.keyboard.press("Enter");
  const anns = await page.evaluate(() => document.getElementById("imgInfo").textContent);
  assert.match(anns, /6 işaret/, anns);
  // Geri al / yinele
  await page.keyboard.press("Control+z");
  await until(page, () => /5 işaret/.test(document.getElementById("imgInfo").textContent));
  await page.keyboard.press("Control+y");
  await until(page, () => /6 işaret/.test(document.getElementById("imgInfo").textContent));
  await shot(page, "masaustu-02-adaylar-ve-isaretler.png");

  // ---- 4) Adayları maskele; MyMind ile ek aday (onaylı, veri azaltılmış) ----
  await page.click("#acceptAll");
  await until(page, () => document.getElementById("candCount").textContent === "0");
  await page.click("#aiBtn"); // anahtar yok → bağlantı penceresi
  await until(page, () => document.getElementById("mymindDialog").open);
  await page.fill("#mymindKey", KEY);
  await page.click("#mymindSave");
  await until(page, () => document.getElementById("mymindState").textContent === "Bağlı");
  setFile("deny.txt", "1");
  await page.click("#aiBtn");
  await until(page, () => /hiçbir şey gönderilmedi/.test(document.getElementById("toasts").textContent));
  assert.equal(hubBody, "", "reddedilen onayda Hub'a istek gitti");
  setFile("deny.txt", "0");
  await page.click("#aiBtn");
  await until(page, () => /MyMind (\d+ ek aday|ek aday bulmadı)/.test(document.getElementById("toasts").textContent), null, 600);
  const sent = readLog("mymind-sent.json");
  assert.ok(sent.length > 0, "MyMind isteği kaydedilmedi");
  for (const leak of ["4111", "TR33", "@", "sk-proj", "0532", "1978"]) assert.ok(!sent.includes(leak), "MyMind'a hassas/rakamlı veri gitti: " + leak);
  assert.ok(/Kelimeler/.test(sent));
  assert.match(readLog("approvals.txt"), /MyMind'a gönderilsin mi\?/);
  const aiLabels = await page.evaluate(() => [...document.querySelectorAll(".ss-cand.is-pending b")].map((b) => b.textContent));
  log("MyMind adayları: " + aiLabels.join(" | "));
  assert.ok(aiLabels.every((l) => /^MyMind: (kişi adı|soyadı)$/.test(l)), "gönderilmeyen kelime aday oldu: " + aiLabels.join(","));
  assert.ok(aiLabels.length >= 1, "MyMind adayı işaretlenmedi");
  await shot(page, "masaustu-03-mymind-adaylari.png");
  // Birini kabul, kalanları reddet (kabul oranı ölçülür)
  await page.click(".ss-cand.is-pending [data-act=accept]");
  while (await page.locator(".ss-cand.is-pending").count()) await page.click(".ss-cand.is-pending [data-act=reject]");
  // Elle maske (M): "Toplam tutar" satırı
  await page.keyboard.press("m");
  await drag(page, o(292, 538), o(480, 572));
  const masks = Number((await page.evaluate(() => document.getElementById("imgInfo").textContent)).match(/(\d+) maske/)[1]);
  assert.ok(masks >= 7, "maske sayısı az: " + masks);

  // ---- 5) Pencere çerçevesi + PNG kaydet → doğrulama + bağımsız OCR ----
  await page.click('[data-frame="window"]');
  await until(page, () => !document.getElementById("titleField").hidden);
  await page.fill("#frameTitle", "Hesabım → Fatura");
  await page.waitForTimeout(400);
  await page.click('[data-fmt="png"]');
  await page.keyboard.press("Control+s");
  await until(page, () => !document.getElementById("result").hidden && /doğrulandı/.test(document.getElementById("result").textContent));
  const ver = readLog("verify.txt").trim().split("\n").map((l) => JSON.parse(l));
  const v1 = ver[ver.length - 1];
  assert.ok(v1.ok && v1.masks === masks && v1.pixels > 1000, "doğrulama: " + JSON.stringify(v1));
  const files = fs.readdirSync(outDir);
  assert.equal(files.length, 1);
  const pngFile = path.join(outDir, files[0]);
  assert.match(files[0], /^Ekran görüntüsü \d{4}-\d\d-\d\d \d\d\.\d\d\.\d\d\.png$/);
  assert.deepEqual([...fs.readFileSync(pngFile).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  log("kaydedildi: " + files[0] + " (" + v1.width + "×" + v1.height + ", " + v1.pixels + " maske pikseli doğrulandı)");
  const before = await ocrFile(path.join(testDir, "screen.png"));
  const after = await ocrFile(pngFile);
  for (const s of ["ornek.com", "TR33", "4111", "sk-proj", "0532"]) {
    assert.ok(before.replace(/\s/g, "").includes(s.replace(/\s/g, "")), "özgün ekranda bile okunamadı (test geçersiz): " + s);
    assert.ok(!after.replace(/\s/g, "").includes(s.replace(/\s/g, "")), "maskelenen değer çıktıda okunabiliyor: " + s);
  }
  assert.ok(/Müşteri|Telefon|Toplam/i.test(after), "maskelenmeyen içerik çıktıda yok (OCR çalışmıyor olabilir): " + after);
  log("bağımsız OCR: maskelenen 5 değerin hiçbiri çıktıda okunamadı");
  if (shots) fs.copyFileSync(pngFile, path.join(shots, "masaustu-08-cikti-pencere-cercevesi.png")); // uygulamanın gerçek çıktısı (test verisi)
  await shot(page, "masaustu-04-kaydedildi-dogrulandi.png");

  // ---- 6) Panoya kopyala (gerçek pano) ----
  await page.click("#copyBtn");
  await until(page, () => /Panoya kopyalandı/.test(document.getElementById("result").textContent));
  const clip = await app.evaluate(({ clipboard }) => clipboard.readImage().getSize());
  assert.deepEqual([clip.width, clip.height], [v1.width, v1.height], "panodaki görüntü ölçüsü");

  // ---- 7) JPEG: doğrulanmış piksellerden ana süreçte üretilir ----
  await page.click('[data-fmt="jpeg"]');
  await until(page, () => document.querySelector('[data-fmt="jpeg"]').getAttribute("aria-selected") === "true");
  await page.click("#saveBtn");
  await until(page, () => /\.jpg/.test(document.getElementById("result").textContent));
  const jpg = fs.readdirSync(outDir).find((f) => f.endsWith(".jpg"));
  assert.deepEqual([...fs.readFileSync(path.join(outDir, jpg)).subarray(0, 3)], [0xff, 0xd8, 0xff]);

  // ---- 8) Sahte maske bildirimi reddedilir: maske altında içerik varsa hiçbir şey yazılmaz ----
  const n0 = fs.readdirSync(outDir).length;
  const err = await page.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = 120; c.height = 80;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 120, 80); g.fillStyle = "#000"; g.fillRect(10, 10, 40, 20); g.fillStyle = "#f00"; g.fillRect(30, 15, 2, 2);
    const bytes = new Uint8Array(await (await new Promise((r) => c.toBlob(r, "image/png"))).arrayBuffer());
    try { await window.ssDesktop.save(bytes, { format: "png", width: 120, height: 80, innerW: 120, innerH: 80, frame: "none", masks: [{ id: "x", x: 10, y: 10, w: 40, h: 20, color: "#000000" }] }); return "yazıldı"; } catch (e) { return String(e.message || e); }
  });
  assert.match(err, /Maske doğrulaması başarısız/);
  assert.equal(fs.readdirSync(outDir).length, n0, "doğrulanmayan çıktı diske yazıldı");
  log("sızıntılı maske reddedildi: " + err.replace(/^Error invoking remote method '[^']+': (Error: )?/, ""));

  // ---- 9) Pencere yakalama ----
  await page.click("#capWindow");
  await until(page, () => document.getElementById("winDialog").open && document.querySelectorAll("[data-win]").length > 0);
  await shot(page, "masaustu-05-pencere-sec.png");
  await page.click("[data-win]");
  await until(page, () => /pencere/.test(document.getElementById("imgInfo").textContent) && /0 maske/.test(document.getElementById("imgInfo").textContent));

  // ---- 10) Kayıtlar ve ayarlar ----
  await page.click('[data-nav="history"]');
  await until(page, () => document.querySelectorAll(".ss-hrow").length === 3);
  const kpis = await page.evaluate(() => document.getElementById("kpis").textContent);
  assert.match(kpis, /≤30 sn%100/, kpis);
  assert.match(kpis, /3\/3/, kpis);
  await shot(page, "masaustu-06-kayitlar.png");
  await page.click(".ss-hrow [aria-label='Klasörde göster']");
  await until(page, () => true);
  await page.waitForTimeout(200);
  assert.ok(readLog("reveal.txt").includes(outDir));
  await page.click('[data-nav="settings"]');
  await page.selectOption("#setShortcut", "CommandOrControl+Alt+S");
  await until(page, () => /Ctrl Alt S/.test(document.getElementById("shortcutKbd").textContent));
  await shot(page, "masaustu-07-ayarlar.png");

  // ---- 11) Komut paleti ----
  await page.click('[data-nav="studio"]');
  await page.keyboard.press("Control+k");
  await until(page, () => document.getElementById("palette").open);
  await page.keyboard.type("maske");
  await page.keyboard.press("Enter");
  await until(page, () => document.querySelector('[data-tool="mask"]').classList.contains("is-active"));

  const vault = await page.evaluate(() => window.ssDesktop.state().then((s) => s.vault));
  await app.close();

  // ---- 12) Yeniden açılış: kayıtlar ve ayarlar korunur; yakalanan görüntü diske yazılmamıştır ----
  ({ app, page } = await launch());
  watch(page, violations);
  await page.click('[data-nav="history"]');
  await until(page, () => document.querySelectorAll(".ss-hrow").length === 3);
  assert.match(await page.evaluate(() => document.getElementById("shortcutKbd").textContent), /Ctrl Alt S/);
  assert.equal(await page.evaluate(() => document.getElementById("empty").hidden), false, "yeniden açılışta eski yakalama geri geldi");
  const stored = fs.readdirSync(userData).filter((f) => /\.(png|jpe?g|bmp)$/i.test(f));
  assert.deepEqual(stored, [], "kullanıcı verisine görüntü yazılmış");
  await app.close();
  hub.close();

  assert.deepEqual(violations, [], "CSP ihlali/sayfa hatası: " + violations.join("\n"));
  console.log("DUMAN TESTİ GEÇTİ — bölge yakalama, OCR adayları (" + labels.length + "), MyMind (onay/ret, veri azaltma), " + masks + " maske, pencere çerçevesi, PNG/JPEG/pano, maske doğrulaması (" + v1.pixels + " piksel) + bağımsız OCR, sızıntılı maske reddi, pencere yakalama, kalıcılık; vault: " + vault + "; CSP ihlali 0");
})().catch((e) => { console.error("DUMAN TESTİ BAŞARISIZ:", e); process.exit(1); });
