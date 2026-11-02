// Masaüstü duman testi: gerçek Electron pencereleri (ana pencere + her zaman üstte odak balonu), gerçek zamanlayıcı (saat FO_SPEED ile
// hızlandırılır), gerçek kalıcılık ve yeniden açılış; MyMind için taklit Hub. TEST kipinde onaylar ve bildirimler dosyaya yazılır.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "fo-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "fo-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";
const SPEED = 30; // 1 dakika = 2 saniye

// Taklit Hub: /v1/chat/completions; anahtar doğrulanır. Parçalama isteğine adımlar (biri zararlı), özet isteğine özet döner.
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const split = /adıma böl/.test(body);
    const content = split
      ? "```json\n" + JSON.stringify({ adimlar: ["Tablodaki verileri tek sayfada topla", "Tüm uygulamaları kapat", "Üç ana bulguyu madde madde yaz", "Grafikleri rapora yerleştir"], ipucu: "İlk 5 dakikada yalnız verileri toplayın." }) + "\n```"
      : JSON.stringify({ ozet: "Planlanan 1 dakikalık seans tamamlandı; bir kesinti bildirildi.", sonraki: "Bulguları yöneticiye gönder" });
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
async function waitFor(cond, what, ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (cond()) return; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error("Zaman aşımı: " + what);
}
function watch(page, violations) {
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, FO_USER_DATA: userData, FO_TEST_DIR: testDir, FO_HUB_URL: "http://127.0.0.1:" + port, FO_SPEED: String(SPEED) },
  });
  const page = await app.firstWindow();
  const violations = [];
  watch(page, violations);
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1120, height: 740 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
async function bubbleOf(app, violations) {
  for (let i = 0; i < 200; i++) {
    const w = app.windows().find((x) => /bubble\.html$/.test(x.url()));
    if (w) { if (!w.__watched) { watch(w, violations); w.__watched = true; } await until(w, () => document.documentElement.dataset.ready === "1"); return w; }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Odak balonu açılmadı");
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.foDesktop.state());
const notes = () => readLog("notifications.txt").trim().split("\n").filter(Boolean);

(async () => {
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const port = hub.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Focus Orbit");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.foDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await page.textContent(".fo-brand"), /PluginLabs\s*APPS/);
    assert.match(await page.textContent(".fo-product"), /Focus Orbit.*Odak balonu.*27/s);
    assert.equal(await page.textContent("#time"), "25:00");

    // 1) Görev, elle adım, MyMind ile parçalama (onay penceresi neyin gideceğini gösterir; zararlı adım atılır)
    await page.fill("#taskTitle", "Çeyrek satış raporu");
    await page.press("#taskTitle", "Enter");
    await page.fill("#stepInput", "Satış tablosunu aç");
    await page.press("#stepInput", "Enter");
    await until(page, () => document.querySelectorAll("#steps .fo-step").length === 1);
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click("#splitBtn");
    await until(page, () => !document.getElementById("aiSteps").hidden);
    const appr = readLog("approvals.txt");
    assert.match(appr, /görev parçalama/);
    assert.match(appr, /Görev: Çeyrek satış raporu/);
    const sent = readLog("mymind-sent.json");
    assert.doesNotMatch(sent, /Satış tablosunu aç/, "adımlar gönderilmemeli");
    const ai = await page.textContent("#aiSteps");
    assert.match(ai, /Üç ana bulguyu/);
    assert.doesNotMatch(ai, /kapat/);
    assert.match(ai, /1 öneri doğrulamadan geçmedi/);
    await page.click("#aiAdd");
    await toastHas(page, /3 adım eklendi/);
    await page.click("#steps .fo-step:nth-child(1) input");
    await until(page, () => /1\/4/.test(document.getElementById("stepCount").textContent));

    // 2) Dikkat listesi
    await page.click('[data-nav="sites"]');
    await page.fill("#siteInput", "https://www.youtube.com/, x.com; instagram.com localhost");
    await page.press("#siteInput", "Enter");
    await toastHas(page, /3 site eklendi/);
    await page.click('#sites .fo-site:nth-child(3) input');
    await toastHas(page, /hatırlatmadan çıkarıldı/);
    await page.click('[data-nav="focus"]');
    assert.match(await page.textContent("#avoidCard"), /youtube\.com.*x\.com/s);
    assert.doesNotMatch(await page.textContent("#avoidCard"), /instagram/);

    // 3) 25 dk odak seansı: balon açılır, sayaç ilerler; duraklatma süreyi dondurur; "Dağıldım" (site seçerek) ve balondan hızlı kayıt
    await page.click("#startBtn");
    await toastHas(page, /Odak seansı başladı: 25 dk/);
    const bubble = await bubbleOf(app, violations);
    assert.equal(await bubble.title(), "Focus Orbit — odak balonu");
    await page.waitForTimeout(3000);
    const t1 = await page.textContent("#time");
    assert.match(t1, /^2[34]:\d\d$/, "sayaç ilerlemeli: " + t1);
    assert.match(await bubble.textContent("#task"), /Çeyrek satış raporu/);
    assert.match(await bubble.textContent("#phase"), /Odak/);
    await page.click("#interruptBtn");
    await page.click('#intSites .fo-chip[data-host="youtube.com"]');
    await page.fill("#intNote", "video önerisi");
    await page.click("#intOk");
    await toastHas(page, /Kesinti kaydedildi \(bu seansta 1\)/);
    await bubble.click("#interrupt");
    await until(bubble, () => /Kesinti kaydedildi \(2\)/.test(document.getElementById("note").textContent));
    await shot(page, "masaustu-01-odak-seansi.png");
    if (shots) await bubble.screenshot({ path: path.join(shots, "masaustu-02-odak-balonu.png") });
    await bubble.click("#toggle");
    await until(page, () => /duraklatıldı/.test(document.getElementById("phase").textContent));
    const p1 = await page.textContent("#time");
    await page.waitForTimeout(1500);
    assert.equal(await page.textContent("#time"), p1, "duraklatılmışken süre akmamalı");
    await page.click("#resumeBtn");
    await page.click("#stopBtn");
    await toastHas(page, /erken bitirildi/);
    let st = await state(page);
    assert.equal(st.sessions[0].status, "stopped");
    assert.equal(st.sessions[0].interruptions.length, 2);
    assert.equal(st.sessions[0].interruptions[0].site, "youtube.com");
    assert.equal(st.timer.phase, "idle");

    // 4) Kısa seanslarla tam döngü: odak bitince bildirim + kendiliğinden mola, mola bitince bildirim. Haftalık hedef (3) tamamlanır.
    await page.click('[data-nav="settings"]');
    await page.fill("#setFocus", "1");
    await page.press("#setFocus", "Tab");
    await page.fill("#setBreak", "1");
    await page.press("#setBreak", "Tab");
    await until(page, () => true);
    await page.waitForTimeout(300);
    st = await state(page);
    assert.equal(st.settings.focusMin, 1);
    assert.equal(st.settings.breakMin, 1);
    await page.click('[data-nav="focus"]');
    for (let i = 0; i < 3; i++) {
      const before = notes().length;
      await page.click("#startBtn");
      if (i === 1) { await page.click("#interruptBtn"); await page.click('#intSites .fo-chip[data-host="x.com"]'); await page.click("#intOk"); }
      await waitFor(() => notes().length >= before + 1, "odak bitiş bildirimi");
      assert.match(notes()[before], /^Odak seansı bitti\t“Çeyrek satış raporu” · Mola: 1 dk/);
      await until(page, () => /Mola/.test(document.getElementById("phase").textContent));
      await waitFor(() => notes().length >= before + 2, "mola bitiş bildirimi");
      assert.match(notes()[before + 1], /^Mola bitti\tSıradaki: “Çeyrek satış raporu”/);
      await until(page, () => document.getElementById("phase").textContent === "Hazır");
    }
    st = await state(page);
    assert.equal(st.stats.done, 3);
    assert.equal(st.stats.goalMet, true);
    assert.equal(st.stats.stopped, 1);
    assert.equal(st.sessions[0].stepsDone, 1);
    assert.equal(st.sessions[0].stepsTotal, 4);
    assert.match(await page.textContent("#weekCard"), /Hedef tamam.*3\/3 *tamamlanan seans/s);
    await page.fill("#taskTitle", "Çeyrek satış raporu");
    await shot(page, "masaustu-03-hafta.png");

    // 5) Kayıtlar: seans sonu özeti (site ve not gönderilmez), kaydetme
    await page.click('[data-nav="history"]');
    assert.equal(await page.locator("#sessions .fo-session").count(), 4);
    await page.click("#sessions > :nth-child(2) [data-sum]");
    await until(page, () => /MyMind özeti \(kaydedilmedi\)/.test(document.getElementById("sessions").textContent));
    const appr2 = readLog("approvals.txt");
    assert.match(appr2, /seans sonu özeti/);
    assert.match(appr2, /Bildirilen kesinti sayısı: 1/);
    const sent2 = readLog("mymind-sent.json").trim().split("\n").pop();
    assert.doesNotMatch(sent2, /x\.com|youtube|video önerisi/);
    await page.click("[data-save]");
    await toastHas(page, /Özet seansa kaydedildi/);
    assert.match(await page.textContent("#sessions"), /Planlanan 1 dakikalık seans tamamlandı.*Sonraki: Bulguları yöneticiye gönder/s);
    await shot(page, "masaustu-04-kayitlar.png");

    // 6) Dikkat listesi görünümü: en çok dikkat dağıtanlar (yalnız kullanıcı kayıtları)
    await page.click('[data-nav="sites"]');
    assert.match(await page.textContent("#topSites"), /x\.com\s*1 kez.*youtube\.com\s*1 kez/s);
    await shot(page, "masaustu-05-dikkat-listesi.png");

    // 7) Ayarlar, gizlilik, yedek; balonu gizle
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#privacy"), /hiçbir uygulamayı, pencereyi ya da sekmeyi kapatmaz/);
    await page.click("#exportBtn");
    await toastHas(page, /4 seans dışa aktarıldı/);
    assert.match(fs.readFileSync(path.join(testDir, "yedek.json"), "utf8"), /pluginlabs-focus-orbit/);
    await page.click("#bubbleBtn");
    await until(page, () => document.getElementById("bubbleState").textContent === "Gizli");
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    await app.close();

    // 8) Yeniden açılış: kayıtlar kalıcı (kasa varsa şifreli); içe aktarma aynı seansları iki kez eklemez
    ({ app, page, violations } = await launch(port));
    st = await state(page);
    assert.equal(st.sessions.length, 4);
    assert.equal(st.task.steps.length, 4);
    assert.equal(st.sites.length, 3);
    assert.equal(st.hasKey || !st.vault, true);
    const files = fs.readdirSync(userData);
    report.vault = files.includes("odak.bin");
    if (report.vault) assert.ok(!fs.readFileSync(path.join(userData, "odak.bin")).includes(Buffer.from("satış")), "şifreli kayıt düz metin içermemeli");
    else assert.ok(files.includes("odak.json"));
    setFile("import.txt", path.join(testDir, "yedek.json"));
    await page.click('[data-nav="settings"]');
    await page.click("#importBtn");
    await toastHas(page, /0 seans içe aktarıldı, 4 zaten vardı/);
    await page.click('[data-nav="focus"]');
    await page.keyboard.press("Control+Enter");
    await toastHas(page, /Odak seansı başladı/);
    await bubbleOf(app, violations);
    await page.keyboard.press("Control+Enter");
    await until(page, () => /duraklatıldı/.test(document.getElementById("phase").textContent));
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    report.notifications = notes().length;
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    hub.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
