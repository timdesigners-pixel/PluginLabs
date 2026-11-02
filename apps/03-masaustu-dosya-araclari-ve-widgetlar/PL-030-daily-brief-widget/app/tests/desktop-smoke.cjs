// Masaüstü duman testi: gerçek Electron pencereleri (ana pencere + her zaman üstte widget), gerçek .ics ayrıştırma, taklit takvim
// sunucusundan abonelik okuma, gerçek kalıcılık ve yeniden açılış; MyMind için taklit Hub. Saat DB_NOW ile 3 Kasım 2026 08:30'a sabitlenir.
// TEST kipinde onaylar, dosya seçimleri ve bildirimler dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "db-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "db-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-03T08:30:00"; // yerel saat

// İş takvimi (abonelik): çakışan iki toplantı, haftalık tekrar, özel (CLASS:PRIVATE) etkinlik.
const WORK_ICS = ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:İş",
  "BEGIN:VEVENT", "UID:w1", "DTSTART:20261103T093000", "DTEND:20261103T103000", "SUMMARY:Ürün planlama toplantısı", "LOCATION:Toplantı odası 2", "END:VEVENT",
  "BEGIN:VEVENT", "UID:w2", "DTSTART:20261103T100000", "DTEND:20261103T104500", "SUMMARY:Müşteri görüşmesi (Acme)", "END:VEVENT",
  "BEGIN:VEVENT", "UID:w3", "DTSTART:20261020T140000", "DTEND:20261020T150000", "RRULE:FREQ=WEEKLY;BYDAY=TU", "SUMMARY:Haftalık ekip senkronu", "END:VEVENT",
  "BEGIN:VEVENT", "UID:w4", "DTSTART:20261103T163000", "DTEND:20261103T170000", "CLASS:PRIVATE", "SUMMARY:Avukatla telefon", "END:VEVENT",
  "END:VCALENDAR"].join("\r\n");
// Okul takvimi (dosya): tüm gün etkinlik + akşam.
const SCHOOL_ICS = ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:Okul",
  "BEGIN:VEVENT", "UID:s1", "DTSTART;VALUE=DATE:20261103", "DTEND;VALUE=DATE:20261104", "SUMMARY:Okul gezisi günü", "END:VEVENT",
  "BEGIN:VEVENT", "UID:s2", "DTSTART:20261103T190000", "DTEND:20261103T200000", "SUMMARY:Veli toplantısı", "END:VEVENT",
  "BEGIN:VEVENT", "UID:s3", "DTSTART:20261103T120000", "DTEND:20261103T130000", "STATUS:CANCELLED", "SUMMARY:İptal edilen öğle", "END:VEVENT",
  "END:VCALENDAR"].join("\r\n");

let icsHits = 0;
let icsFail = false;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.url.startsWith("/takvim/is.ics")) {
      icsHits++;
      assert.equal(req.method, "GET");
      assert.equal(req.headers.cookie, undefined, "takvim isteğinde çerez olmamalı");
      if (icsFail) { res.writeHead(503); return res.end(); }
      res.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8" });
      return res.end(WORK_ICS);
    }
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content = "```json\n" + JSON.stringify({ plan: [
      { saat: "08:45-09:30", is: "Rapor taslağının giriş bölümü" }, { saat: "10:45-11:45", is: "Raporu bitir ve gönder" },
      { saat: "11:45-12:00", is: "Fatura ödemesi" }, { saat: "09:30-10:00", is: "Müşteri görüşmesini iptal et" },
    ], not: "Toplantı çakışmasını sabah ekiple konuşun." }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function waitFor(cond, what, ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (cond()) return; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error("Zaman aşımı: " + what);
}
function watch(page, violations) {
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  page.on("dialog", (d) => d.accept());
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, DB_USER_DATA: userData, DB_TEST_DIR: testDir, DB_HUB_URL: "http://127.0.0.1:" + port, DB_NOW: NOW },
  });
  const page = await app.firstWindow();
  const violations = [];
  watch(page, violations);
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1180, height: 760 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
async function widgetOf(app, violations) {
  for (let i = 0; i < 200; i++) {
    const w = app.windows().find((x) => /widget\.html$/.test(x.url()));
    if (w) { if (!w.__watched) { watch(w, violations); w.__watched = true; } await until(w, () => document.documentElement.dataset.ready === "1"); return w; }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Widget açılmadı");
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.dbDesktop.state());
const text = (page, sel) => page.textContent(sel);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Daily Brief Widget");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.dbDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".db-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".db-product"), /Daily Brief.*Günün özeti.*30/s);
    assert.match(await text(page, "#dayTitle"), /3 Kasım/);
    const widget = await widgetOf(app, violations); // açılışta widget
    assert.equal(await widget.title(), "Daily Brief — bugün");
    assert.match(await text(widget, "#events"), /Kalan etkinlik yok/);
    // Sabah özeti bildirimi (08:00'den sonra açıldı): günde bir kez
    await waitFor(() => /Günün özeti hazır/.test(readLog("notifications.txt")), "sabah bildirimi");

    // 1) Görevler: gecikmiş, bugün (saatli ve saatsiz), tarihsiz yüksek öncelik, hassas
    await page.click('[data-nav="tasks"]');
    const addTask = async (title, due, time, dur, pri, sens) => {
      await page.fill("#tTitle", title); await page.fill("#tDue", due || ""); await page.fill("#tTime", time || ""); await page.fill("#tDur", String(dur || 30));
      await page.selectOption("#tPri", String(pri || 2)); if (sens) await page.check("#tSens");
      await page.click('#taskForm button[type="submit"]');
      await toastHas(page, /Görev eklendi/);
      await page.evaluate(() => document.getElementById("toasts").replaceChildren());
    };
    await addTask("Çeyrek raporunun taslağı", "2026-11-02", "", 60, 1);
    await addTask("Sunum provası", "2026-11-03", "10:15", 30, 2);
    await addTask("Elektrik faturasını öde", "2026-11-03", "", 15, 2);
    await addTask("Doktor randevusu için ara", "2026-11-03", "", 10, 3);
    await addTask("Bütçe tablosunu güncelle", "", "", 45, 1);
    await addTask("Kişisel not", "2026-11-03", "", 15, 3, true);
    await addTask("Yarınki sunum dosyası", "2026-11-04", "", 30, 2);
    let st = await state(page);
    assert.equal(st.tasks.length, 7);
    assert.match(await text(page, "#taskGroups"), /Gecikmiş \(1\).*Bugün \(4\).*Yaklaşan \(1\).*Tarihsiz \(1\)/s);

    // 2) Takvimler: yerel etkinlik, .ics dosyası, abonelik adresi (onay penceresi; yalnız alan adı gösterilir)
    await page.click('[data-nav="calendars"]');
    await page.fill("#eTitle", "Spor salonu");
    await page.fill("#eDate", "2026-11-03");
    await page.fill("#eFrom", "18:00"); await page.fill("#eTo", "19:00");
    await page.click('#eventForm button[type="submit"]');
    await toastHas(page, /Etkinlik eklendi/);
    const schoolFile = path.join(testDir, "okul.ics");
    fs.writeFileSync(schoolFile, SCHOOL_ICS);
    setFile("pick.txt", schoolFile);
    await page.click("#icsFile");
    await toastHas(page, /“Okul” içe aktarıldı: 2 etkinlik, 1 iptal edilmiş atlandı/);
    await page.fill("#icsUrl", "http://127.0.0.1:" + port + "/takvim/is.ics?gizli=abc123");
    await page.fill("#icsName", "İş");
    await page.click('#urlForm button[type="submit"]');
    await toastHas(page, /Takvim eklendi: 4 etkinlik okundu/);
    const appr = readLog("approvals.txt");
    assert.match(appr, /Bu takvim adresinden okunsun mu\?/);
    assert.match(appr, /yalnız OKUR/);
    assert.doesNotMatch(appr, /abc123/, "gizli anahtar onay metninde gösterilmemeli");
    assert.equal(icsHits, 1);
    assert.match(await text(page, "#sources"), /Okul.*ICS dosyası · okul\.ics.*İş.*Abonelik · 127\.0\.0\.1/s);
    assert.doesNotMatch(await text(page, "#sources"), /abc123/);
    // Reddedilen adresler
    await page.fill("#icsUrl", "http://ornek.com/takvim.ics");
    await page.click('#urlForm button[type="submit"]');
    await toastHas(page, /Yalnız https/);
    await page.fill("#icsUrl", "");
    await page.evaluate(() => document.getElementById("sources").scrollIntoView({ block: "end" }));
    await shot(page, "masaustu-03-takvimler.png");

    // 3) Bugün: etkinlikler (tüm gün önce), çakışmalar, görevler, plan, veri zamanı
    await page.click('[data-nav="today"]');
    const tl = await text(page, "#timeline");
    assert.match(tl, /tüm gün.*Okul gezisi günü.*09:30–10:30.*Ürün planlama toplantısı.*10:00–10:45.*Müşteri görüşmesi.*14:00–15:00.*Haftalık ekip senkronu.*16:30–17:00.*Avukatla telefon.*18:00–19:00.*Spor salonu.*19:00–20:00.*Veli toplantısı/s);
    assert.doesNotMatch(tl, /İptal edilen/);
    assert.equal(await page.locator("#timeline .db-ev").count(), 7);
    const conf = await text(page, "#conflicts");
    assert.match(conf, /“Ürün planlama toplantısı” \(09:30–10:30\) ile “Müşteri görüşmesi \(Acme\)” \(10:00–10:45\) 30 dk çakışıyor/);
    assert.match(conf, /Görev “Sunum provası” \(10:15\)/);
    assert.match(conf, /Takvim otomatik değiştirilmez/);
    assert.match(await text(page, "#todayTasks"), /Çeyrek raporunun taslağı.*gecikmiş.*Sunum provası.*Elektrik faturasını öde/s);
    const plan = await text(page, "#plan");
    assert.match(plan, /09:00–09:15\s*Elektrik faturasını öde/, "kısa iş ilk boşluğa (rapor 60 dk sığmaz)");
    assert.match(plan, /10:45–11:45\s*Çeyrek raporunun taslağı\s*gecikmiş/);
    assert.match(plan, /Bütçe tablosunu güncelle\s*yüksek öncelik/);
    assert.match(plan, /10:15–10:45\s*Sunum provası\s*saatli görev/);
    assert.match(await text(page, "#srcMini"), /İş · Abonelik · 127\.0\.0\.1\s*alındı az önce/);
    assert.match(await text(page, "#dayFresh"), /Veri güncel/);
    assert.match(await text(page, "#dayHeadline"), /7 etkinlik · 5 görev · 3 çakışma/);
    // Widget aynı özeti gösterir; sonraki etkinlik
    assert.match(await text(widget, "#next"), /1 sa sonra · 09:30.*Ürün planlama toplantısı.*Toplantı odası 2/s);
    assert.match(await text(widget, "#events"), /tüm gün\s*Okul gezisi günü.*09:30\s*Ürün planlama/s);
    assert.match(await text(widget, "#tasks"), /Çeyrek raporunun taslağı\s*gecikmiş.*10:15 Sunum provası/s);
    assert.match(await text(widget, "#warn"), /3 çakışma/);
    assert.match(await text(widget, "#fresh"), /Veri: 08:3\d \(az önce\)/);
    await shot(page, "masaustu-01-bugun.png");
    if (shots) await widget.screenshot({ path: path.join(shots, "masaustu-02-widget.png") });

    // 4) Hassas başlık gizleme (widget'tan): CLASS:PRIVATE, hassas kelime (doktor) ve hassas işaretli görev
    await widget.click("#hide");
    await until(widget, () => document.getElementById("hide").getAttribute("aria-pressed") === "true");
    await until(page, () => /Özel etkinlik/.test(document.getElementById("timeline").textContent));
    assert.doesNotMatch(await text(page, "#timeline"), /Avukat/);
    assert.match(await text(page, "#todayTasks"), /Özel görev.*Özel görev/s);
    assert.doesNotMatch(await text(page, "#todayTasks"), /Doktor|Kişisel not/);
    assert.match(await text(widget, "#tasks"), /Özel görev/);
    assert.equal(await text(page, "#hideState"), "Açık");
    await shot(page, "masaustu-04-gizleme-kipi.png");

    // 5) MyMind planı: onay penceresi gönderilecekleri gösterir; hassas başlıklar, yer, takvim adı ve adres gitmez; zararlı adım atılır
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await page.click("#widgetBtn"); // widget'ı gizle (MyMind sırasında ana pencere ekranda)
    await until(page, () => document.getElementById("widgetState").textContent === "Gizli");
    await page.click("#planBtn");
    await until(page, () => !document.getElementById("aiPlan").hidden);
    const appr2 = readLog("approvals.txt");
    assert.match(appr2, /günü kısa plana dönüştür/);
    assert.match(appr2, /09:30-10:30 Ürün planlama toplantısı/);
    const sent = readLog("mymind-sent.json");
    assert.doesNotMatch(sent, /Avukat|Doktor|Kişisel not|Toplantı odası|127\.0\.0\.1|gizli=|okul\.ics|"İş"/);
    assert.match(sent, /Özel etkinlik/);
    assert.match(sent, /Özel görev/);
    const ai = await text(page, "#aiPlan");
    assert.match(ai, /08:45–09:30\s*Rapor taslağının giriş bölümü.*10:45–11:45\s*Raporu bitir/s);
    assert.doesNotMatch(ai, /iptal/);
    assert.match(ai, /1 adım doğrulamadan geçmedi/);
    assert.match(ai, /Toplantı çakışmasını sabah ekiple konuşun/);
    await page.evaluate(() => document.getElementById("aiPlan").scrollIntoView({ block: "end" }));
    await shot(page, "masaustu-05-mymind-plan.png");
    await page.click("#aiClose");

    // 6) Görev tamamlama, yanlış işaretleme, Okudum (ölçüler)
    await page.click('#todayTasks .db-task:nth-child(1) input');
    await toastHas(page, /Görev tamamlandı/);
    await page.click('#timeline .db-ev:nth-child(3) .db-icon-btn');
    await toastHas(page, /yanlış\/eskimiş ölçüsüne eklendi/);
    await page.click("#readBtn");
    await toastHas(page, /okundu olarak işaretlendi/);
    st = await state(page);
    assert.equal(st.readToday, true);
    assert.equal(st.stats.readRate, 1);
    assert.equal(st.stats.flagged, 1);
    assert.equal(st.tasks.find((t) => t.title === "Çeyrek raporunun taslağı").done, true);

    // 7) Eskimiş veri: sunucu hata verir; yenileme hatası gösterilir, veri zamanı ve uyarılar
    icsFail = true;
    await page.click('[data-nav="calendars"]');
    const srcId = st.sources.find((x) => x.kind === "url").id;
    await page.click('[data-refresh="' + srcId + '"]');
    await toastHas(page, /Takvim sunucusu 503 döndü/);
    assert.match(await text(page, "#sources"), /hata.*Takvim sunucusu 503 döndü/s);

    // 8) Ayarlar ve ölçüler, yedek
    await page.click('[data-nav="settings"]');
    assert.match(await text(page, "#metrics"), /%100\s*sabah özeti okuma \(1\/1 gün\)/);
    assert.match(await text(page, "#metrics"), /%14\.3\s*yanlış\/eskimiş etkinlik \(1\/7\)/);
    assert.match(await text(page, "#privacy"), /hiçbir etkinliği oluşturmaz, değiştirmez ya da silmez/);
    await page.fill("#sStart", "08:00");
    await page.press("#sStart", "Tab");
    await toastHas(page, /Ayar kaydedildi/);
    await page.click("#exportBtn");
    await toastHas(page, /7 görev ve 1 yerel etkinlik dışa aktarıldı/);
    const backup = fs.readFileSync(path.join(testDir, "yedek.json"), "utf8");
    assert.match(backup, /pluginlabs-daily-brief/);
    assert.doesNotMatch(backup, /abc123|takvim\/is\.ics/, "abonelik adresi yedeğe yazılmamalı");
    await shot(page, "masaustu-06-ayarlar-olculer.png");
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    await app.close();

    // 9) Yeniden açılış: kayıtlar kalıcı (kasa varsa şifreli), sabah bildirimi aynı gün tekrarlanmaz, içe aktarma yinelemez
    icsFail = false;
    ({ app, page, violations } = await launch(port));
    st = await state(page);
    assert.equal(st.tasks.length, 7);
    assert.equal(st.sources.length, 3);
    assert.equal(st.settings.workStart, "08:00");
    assert.equal(st.settings.hideSensitive, true);
    assert.equal(st.hasKey || !st.vault, true);
    const files = fs.readdirSync(userData);
    report.vault = files.includes("ozet.bin");
    if (report.vault) {
      const enc = fs.readFileSync(path.join(userData, "ozet.bin"));
      assert.ok(!enc.includes(Buffer.from("abc123")) && !enc.includes(Buffer.from("Avukat")), "şifreli kayıt düz metin içermemeli");
    } else assert.ok(files.includes("ozet.json"));
    await page.waitForTimeout(1500);
    assert.equal(readLog("notifications.txt").trim().split("\n").filter(Boolean).length, 1, "sabah bildirimi günde bir kez");
    setFile("import.txt", path.join(testDir, "yedek.json"));
    await page.click('[data-nav="settings"]');
    await page.click("#importBtn");
    await toastHas(page, /0 görev, 0 etkinlik içe aktarıldı, 7 görev zaten vardı/);
    // Kısayollar: Ctrl+2 görevler, Ctrl+W widget
    await page.keyboard.press("Control+2");
    await until(page, () => !document.getElementById("view-tasks").hidden);
    await page.keyboard.press("Control+w");
    await widgetOf(app, violations);
    report.icsHits = icsHits;
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
