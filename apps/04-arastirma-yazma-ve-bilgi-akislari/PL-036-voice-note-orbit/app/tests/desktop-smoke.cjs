// Masaüstü duman testi: gerçek Electron penceresi + yüzen balon; Chromium taklit mikrofonuyla (--use-fake-device-for-media-stream) GERÇEK
// basılı tut–bırak kaydı (getUserMedia → 16 kHz WAV → ana süreç başlık denetimi), taklit yerel konuşma→metin sunucusu (/v1/audio/transcriptions,
// çok parçalı form) ve taklit MyMind (Hub). Ana pencereden kayıt + onay + kaydet (3 tık), balondan kayıt + belirsiz saatte tek tıkla seç-kaydet,
// belirsiz tarih seçilmeden kaydetme reddi, transkripsiyon reddi ve elle yazma, ses / transkript / not ayrı silme, ses dosyası içe aktarma,
// MyMind (anahtar, onay, maskeleme), dışa aktarma (ICS/CSV) ve pano, kamera isteğinin reddi, dış adres reddi ve kalıcılık.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const R = require("../src/recorder.js");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "vn-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "vn-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

// Taklit konuşma→metin: sıradaki cevabı verir; gelen dosyanın gerçek WAV olduğunu denetler.
const sttQueue = [];
const sttSeen = [];
const stt = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const ct = String(req.headers["content-type"] || "");
    const okReq = req.method === "POST" && req.url === "/v1/audio/transcriptions" && /multipart\/form-data/.test(ct);
    const riff = body.indexOf("RIFF");
    sttSeen.push({ ok: okReq, bytes: body.length, riff: riff >= 0 && body.slice(riff + 8, riff + 12).toString() === "WAVE", model: /name="model"\r\n\r\n([^\r]+)/.exec(body.toString("latin1"))?.[1], lang: /name="language"\r\n\r\n([^\r]+)/.exec(body.toString("latin1"))?.[1] });
    res.writeHead(okReq ? 200 : 400, { "Content-Type": "application/json" });
    res.end(JSON.stringify(okReq ? { text: sttQueue.shift() || "Boş" } : { error: "geçersiz" }));
  });
});
// Taklit MyMind
let hubCalls = 0;
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content = '```json\n{"tur":"gorev","baslik":"Muhasebeciyi ara, ⟦1⟧ yatırıldı mı sor","tarih_ifadesi":"saat 3","duzeltilmis":"Saat 3’te muhasebeciyi ara, ⟦1⟧ numaralı hesaba ödeme yatırıldı mı sor."}\n```';
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(sttPort, hubPort) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, VN_USER_DATA: userData, VN_TEST_DIR: testDir, VN_STT_URL: "http://127.0.0.1:" + sttPort, VN_HUB_URL: "http://127.0.0.1:" + hubPort, VN_TODAY: "2026-11-04", VN_NOW: "10:00" },
  });
  // Ana pencere ve balon aynı anda açılır; ana pencere adresinden seçilir.
  await app.firstWindow();
  let page = null;
  for (let i = 0; i < 200 && !page; i++) { page = app.windows().find((p) => /app\.html$/.test(p.url())) || null; if (!page) await new Promise((r) => setTimeout(r, 50)); }
  if (!page) throw new Error("Ana pencere açılmadı");
  const violations = [];
  const watch = (p) => { p.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); }); p.on("pageerror", (e) => violations.push(String(e))); };
  watch(page);
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations, watch };
}
async function bubblePage(app) {
  for (let i = 0; i < 200; i++) {
    const w = app.windows().find((p) => /bubble\.html$/.test(p.url()));
    if (w) { await until(w, () => document.documentElement.dataset.ready === "1"); return w; }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Balon penceresi açılmadı");
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.vnDesktop.state());
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());
async function hold(page, sel, ms) {
  const b = await page.$(sel);
  const box = await b.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

(async () => {
  await new Promise((r) => stt.listen(0, "127.0.0.1", r));
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const sttPort = stt.address().port, hubPort = hub.address().port;
  let { app, page, violations, watch } = await launch(sttPort, hubPort);
  const report = {};
  try {
    assert.equal(await page.title(), "Voice Note Orbit");
    assert.equal(await page.textContent(".vn-product__no"), "36");
    const bub = await bubblePage(app);
    watch(bub);
    await until(page, () => document.getElementById("bubbleState").textContent === "Açık");
    await shot(page, "masaustu-00-bos-gelen-kutusu.png");

    // 1) Kamera isteği reddedilir; mikrofon (ses) izni verilir.
    const cam = await page.evaluate(() => navigator.mediaDevices.getUserMedia({ video: true }).then(() => "verildi", (e) => e.name));
    assert.notEqual(cam, "verildi", "kamera izni verilmemeli");
    report.camera = cam;

    // 2) Ana pencere: basılı tut (1) → onay (2) → kaydet (3)
    sttQueue.push("Yarın sabah 9'da Elif'le proje toplantısı var, sunumu hazırlamayı unutma.");
    await hold(page, "#recBtn", 1600);
    await until(page, () => /Yarın sabah 9/.test(document.getElementById("dTx")?.value || ""));
    let st = await state(page);
    let n = st.note;
    assert.equal(n.source, "kayit");
    assert.ok(n.audio && n.audio.seconds >= 1 && n.audio.seconds <= 3, "ses süresi " + (n.audio && n.audio.seconds));
    assert.equal(n.kind, "gorev");
    assert.equal(n.when.date, "2026-11-05");
    assert.equal(n.when.time, "09:00");
    assert.equal(n.transcriptBy, "yerel-whisper");
    assert.ok(sttSeen[0].ok && sttSeen[0].riff, "sunucuya gerçek WAV gitti");
    assert.equal(sttSeen[0].lang, "tr");
    assert.match(readLog("approvals.txt"), /Ses notu metne çevrilsin mi\?[\s\S]*16 kHz mono WAV/);
    const audioFiles = fs.readdirSync(path.join(userData, "ses"));
    assert.equal(audioFiles.length, 1);
    report.audio = { seconds: n.audio.seconds, bytes: n.audio.bytes, file: audioFiles[0], vault: st.vault };
    // Ses oynatıcı blob: adresiyle yüklenir (CSP media-src blob:)
    await until(page, () => /^blob:/.test(document.querySelector(".vn-audio")?.src || ""));
    await shot(page, "masaustu-01-kayit-ve-taslak.png");
    await page.click("#saveBtn");
    await toastHas(page, /Görev kaydedildi/);
    st = await state(page);
    n = st.notes.find((x) => x.id === n.id);
    assert.equal(n.status, "kayitli");
    assert.equal(n.clicks, 3, "bas + onay + kaydet");
    assert.equal(n.dateCheck, "dogru");

    // 3) Balon: basılı tut (1) → onay (2) → belirsiz saat: "Kaydet · 15:00" tek tık (3)
    sttQueue.push("Saat 3'te muhasebeciyi ara, IBAN TR12 0006 4000 0011 2345 6789 01 hesabına ödeme yatırıldı mı sor.");
    await hold(bub, "#mic", 1300);
    await until(bub, () => document.querySelectorAll("[data-choice]").length === 2);
    assert.match(await bub.textContent("#card"), /Saat sabah mı akşam mı\?/);
    if (shots) await bub.screenshot({ path: path.join(shots, "masaustu-02-balon-belirsiz-saat.png") });
    const firstChoice = await bub.getAttribute("[data-choice]", "data-choice");
    assert.equal(firstChoice, "2026-11-04 15:00");
    await bub.click("[data-choice]");
    await until(bub, () => document.getElementById("card").hidden);
    st = await state(page);
    const bn = st.notes.find((x) => /muhasebeci/.test(x.transcript));
    assert.equal(bn.status, "kayitli");
    assert.equal(bn.when.time, "15:00");
    assert.equal(bn.when.ambiguous, false);
    assert.equal(bn.clicks, 3);
    assert.equal(bn.dateCheck, "dogru", "belirsiz işaretleyip doğru adayı sunmak doğru sayılır");

    // 4) Yazılı not, belirsiz tarih: seçmeden kaydetme reddedilir
    await page.fill("#typed", "Haftaya bankaya uğra, kart limitini sor");
    await page.click("#typedBtn");
    await until(page, () => document.querySelectorAll("#choices [data-choice]").length === 3);
    await shot(page, "masaustu-03-belirsiz-tarih-secimi.png");
    await page.click("#saveBtn");
    await toastHas(page, /Tarih\/saat belirsiz/);
    await page.click('#choices [data-choice^="2026-11-11"]');
    await until(page, () => !document.getElementById("choices"));
    await page.click("#saveBtn");
    await toastHas(page, /Görev kaydedildi/);
    st = await state(page);
    assert.equal(st.note.when.date, "2026-11-11");
    assert.equal(st.note.dateCheck, "dogru");

    // 5) Transkripsiyon reddi → taslak, metin elle yazılır ve çözümlenir
    setFile("deny.txt", "1");
    await hold(page, "#recBtn", 1100);
    await toastHas(page, /Ses notu kaydedildi/);
    rmFile("deny.txt");
    st = await state(page);
    assert.equal(st.note.transcript, "");
    assert.ok(st.note.audio);
    await page.fill("#dTx", "Kitap için yeni bir fikir: zaman yolculuğu yapan bir kedi");
    await page.click("#dTitle");
    await until(page, () => document.querySelector('[data-kind="not"]')?.classList.contains("is-active"));
    st = await state(page);
    assert.equal(st.note.kind, "not");
    assert.equal(st.note.transcriptBy, "elle");
    // Sonradan metne çevirme (yeniden onaylı)
    sttQueue.push("Kitap için yeni bir fikir: zaman yolculuğu yapan bir kedi ve kayıp saati.");
    await page.click("#sttBtn");
    await toastHas(page, /Metne çevrildi/);
    st = await state(page);
    assert.match(st.note.transcript, /kayıp saati/);
    await page.click("#saveBtn");
    await toastHas(page, /Not kaydedildi/);

    // 6) Ses ve transkript ayrı silinir
    const noteId = st.note.id;
    await page.click("#delAudio");
    await toastHas(page, /Ses dosyası silindi/);
    st = await state(page);
    assert.equal(st.note.audio, null);
    assert.ok(st.note.transcript.length > 10, "transkript kalır");
    assert.equal(fs.readdirSync(path.join(userData, "ses")).filter((f) => f.startsWith(noteId)).length, 0, "ses dosyası diskte yok");
    await page.click("#delTx");
    await toastHas(page, /Transkript silindi/);
    st = await state(page);
    assert.equal(st.note.transcript, "");
    assert.match(readLog("approvals.txt"), /Ses dosyası silinsin mi\?[\s\S]*Transkript silinsin mi\?/);
    await page.click("#delNote");
    await toastHas(page, /Not silindi/);
    st = await state(page);
    assert.ok(!st.notes.some((x) => x.id === noteId));

    // 7) Ses dosyası içe aktarma (WAV, 44.1 kHz → 16 kHz)
    const imp = path.join(testDir, "toplanti-notu.wav");
    const pcm = new Float32Array(44100 * 2).map((_, i) => Math.sin(i / 7) * 0.3);
    const w16 = R.wav(R.downsample([pcm], 44100));
    fs.writeFileSync(imp, Buffer.from(w16));
    setFile("pick.txt", imp);
    sttQueue.push("Cuma günü raporu Elif'e gönder.");
    await page.click("#fileBtn");
    await toastHas(page, /toplanti-notu\.wav/);
    rmFile("pick.txt");
    st = await state(page);
    assert.equal(st.note.source, "dosya");
    assert.equal(st.note.when.date, "2026-11-06");
    await page.click("#saveBtn");
    await toastHas(page, /Görev kaydedildi/);

    // 8) MyMind: anahtar, onay, maskeleme (balondaki muhasebeci notu)
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.evaluate((id) => window.vnDesktop.note.open(id), bn.id);
    try { await until(page, () => /muhasebeci/.test(document.getElementById("dTx")?.value || ""), null, 60); }
    catch (e) { const s2 = await state(page); console.log("DEBUG", s2.note && s2.note.id, bn.id, JSON.stringify(s2.note && s2.note.transcript), await page.evaluate(() => document.getElementById("detail").textContent.slice(0, 300))); throw e; }
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi uygulandı/);
    const sent = readLog("ai-sent.json");
    assert.ok(sent && !sent.includes("TR12 0006") && sent.includes("⟦1⟧"), "IBAN gönderilmedi");
    st = await state(page);
    assert.equal(st.note.transcriptBy, "mymind-duzeltme");
    assert.ok(st.note.transcript.includes("TR12 0006"), "yer tutucu geri yerleştirildi");
    assert.equal(st.note.when.time, "15:00", "kullanıcının seçtiği saat korunur");
    await shot(page, "masaustu-04-mymind-duzeltmesi.png");

    // 9) Örnek notlar, görevler görünümü, dışa aktarma ve pano
    await page.click("#sampleBtn");
    await toastHas(page, /3 örnek not eklendi/);
    await page.click('[data-nav="tasks"]');
    await until(page, () => document.querySelectorAll("#taskTable .vn-trow").length >= 5);
    await shot(page, "masaustu-05-gorevler.png");
    await page.selectOption("#exportFmt", "ics");
    await page.click("#exportBtn");
    await toastHas(page, /dışa aktarıldı/);
    const ics = fs.readFileSync(path.join(testDir, "voice-note-orbit-gorevler.ics"), "utf8");
    assert.ok(ics.includes("BEGIN:VTODO") && ics.includes("DUE:20261105T090000") && ics.includes("DUE:20261104T150000"));
    await page.selectOption("#exportFmt", "csv");
    await page.click("#exportBtn");
    await toastHas(page, /dışa aktarıldı/);
    assert.match(fs.readFileSync(path.join(testDir, "voice-note-orbit.csv"), "utf8"), /Görev;.*Elif/);
    await page.click("#copyBtn");
    await toastHas(page, /panoya kopyalandı/);
    assert.match(await clipRead(app), /## Görevler[\s\S]*- \[ \] /);
    // tamamlandı işareti
    await page.click("#taskTable .vn-trow:nth-child(2) input[type=checkbox]");
    await until(page, () => document.querySelectorAll("#taskTable .vn-trow.is-done").length === 0);

    // 10) Ayarlar: ölçüler, dış adres reddi
    await page.click('[data-nav="settings"]');
    await until(page, () => /%100/.test(document.getElementById("metrics").textContent));
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    const ext = await page.evaluate(() => window.vnDesktop.setSettings({ sttUrl: "http://192.168.1.5:8080" }).then(() => "kabul", (e) => String(e.message)));
    assert.match(ext, /yalnız bu bilgisayar/);
    st = await state(page);
    report.stats = { quickRate: st.stats.quickRate, avgClicks: st.stats.avgClicks, dateAccuracy: st.stats.dateAccuracy, dateChecked: st.stats.dateChecked, bench: st.bench };
    assert.equal(st.stats.quickRate, 100);
    assert.equal(st.stats.dateAccuracy, 100);
    // Balon kısayol düğmesiyle kapanır
    await page.click("#bubbleBtn");
    await until(page, () => document.getElementById("bubbleState").textContent === "Kapalı");
    assert.equal(hubCalls, 1);
    assert.deepEqual(violations, []);
    await app.close();

    // 11) Kalıcılık
    ({ app, page, violations } = await launch(sttPort, hubPort));
    st = await state(page);
    assert.ok(st.notes.length >= 6);
    assert.equal(st.settings.bubble, false);
    assert.ok(st.notes.some((x) => x.when && x.when.time === "15:00" && x.transcriptBy === "mymind-duzeltme"));
    assert.ok(fs.existsSync(path.join(userData, st.vault ? "notlar.bin" : "notlar.json")));
    assert.deepEqual(violations, []);
    report.notes = st.notes.length;
    report.sttRequests = sttSeen.length;
    console.log(JSON.stringify(report, null, 2));
    console.log("DUMAN TESTİ GEÇTİ — " + process.platform + " · gerçek kayıt " + report.audio.seconds + " sn · kamera: " + report.camera + " · hızlı kayıt %" + report.stats.quickRate + " · tarih %" + report.stats.dateAccuracy + " · etiketli küme %" + st.bench.accuracy);
  } finally {
    await app.close().catch(() => {});
    stt.close(); hub.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
