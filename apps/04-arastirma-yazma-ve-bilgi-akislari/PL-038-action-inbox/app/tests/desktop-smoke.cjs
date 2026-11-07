// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek yakalamalar (elle etiketli), Metin yakala penceresi (kaynak adresi
// doğrulaması), panodan yakalama (gerçek pano), .txt/.md dosyası (BOM, liste satırları, desteklenmeyen dosyanın atlanması, kaynak dosyanın
// değişmemesi), düzenleyip göreve ekleme, kişi atamasının taslak kalması, olası yineleme uyarısı ve birleştirme, ret ve geri alma, toplu
// kabulde yinelemenin bekletilmesi, MyMind (taklit Hub: anahtar, red, onay, adların/adreslerin/kaynak adresinin gitmemesi, uydurma kişinin
// atılması, öneriyi uygulama), görev kuyruğu (kovalar, tamamlama, kaynağı açma), kabulden sonra yineleme birleştirme (ölçü), görev kutusu
// (widget) penceresi, ölçüler, yerel model (loopback; dış adres reddi), Markdown/iCalendar/CSV dışa aktarma, izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ax-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ax-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00"; // Cuma — örnek verinin yakalama günü

const txtPath = path.join(testDir, "toplanti-notlari.txt");
fs.writeFileSync(txtPath, "﻿Pazartesi toplantısı aksiyonları:\n- [ ] Pazarlama planını güncelle\n- [x] Katılımcı listesi gönderildi\n- [ ] Kira sözleşmesini avukata ilet\nPazartesiye kadar.\n", "utf8");
const pdfPath = path.join(testDir, "rapor.pdf");
fs.writeFileSync(pdfPath, "%PDF-1.4 sahte");
const before = sha(txtPath);

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    const content = "```json\n" + JSON.stringify({ baslik: "Logo dosyalarını Drive'a yükle", fiil: "yükle", tarih: "cuma", materyaller: ["logo dosyaları (SVG ve PNG)", "Drive klasörü"], kisi: "Ahmet Yılmaz", not: "Yükledikten sonra paylaşım bağlantısını gruba iletin" }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, AX_USER_DATA: userData, AX_TEST_DIR: testDir, AX_HUB_URL: "http://127.0.0.1:" + port, AX_NOW: NOW } });
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
const state = (page) => page.evaluate(() => window.axDesktop.state());
const text = (page, sel) => page.textContent(sel);
const count = (page, sel) => page.locator(sel).count();
const find = async (page, pred) => (await state(page)).items.find(pred);
const byTitle = (page, re) => find(page, (x) => re.test(x.title));
const openReview = async (page, re) => { const x = await byTitle(page, re); await page.click(`#reviewList .ax-item[data-id="${x.id}"]`); await until(page, (i) => !!document.querySelector(`#reviewList .ax-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const openTask = async (page, re) => { const x = await byTitle(page, re); await page.click(`#taskList .ax-item[data-id="${x.id}"] .ax-ititle`); await until(page, (i) => !!document.querySelector(`#taskList .ax-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Action Inbox");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".ax-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".ax-product"), /Action Inbox.*Kaynaklı görevler.*38/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    report.shortcut = (await state(page)).shortcut;
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek yakalamalar: adaylar, gerekçeli alanlar, elle etiketli ölçüm
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /11 görev adayı inceleme kuyruğuna eklendi · 1 olası yineleme \(örnek\)/);
    await until(page, () => document.querySelectorAll("#reviewList .ax-item").length === 11);
    let s = await state(page);
    assert.equal(s.gold.verbAccuracy, 100);
    assert.equal(s.gold.dueAccuracy, 100);
    assert.equal(s.gold.dupRecall, 100);
    assert.ok(s.items.every((x) => x.status === "inceleme"), "hiçbir aday kendiliğinden görev olmaz");
    await openReview(page, /Murat Bey bütçe tablosunu/);
    assert.equal(await page.inputValue("#fWho"), "Murat");
    assert.match(await text(page, "#reviewDetail"), /taslak — onaylanmadı/);
    assert.equal(await page.inputValue("#fDue"), "2026-11-13");
    assert.match(await text(page, "#reviewDetail"), /Yakalamanın başka bir yerindeki “cumaya kadar” ifadesinden/);
    assert.match(await text(page, "#reviewDetail .ax-quote mark"), /Murat Bey bütçe tablosunu hazırlasın/);
    await shot(page, "masaustu-01-inceleme-kuyrugu.png");

    // 2) Metin yakala penceresi: geçersiz kaynak adresi reddi, geçerli yakalama
    await page.click('.ax-toolbar [data-act="capture"]');
    await page.fill("#capText", "Lütfen proje sayfasındaki tasarım geri bildirimlerini yarın öğlene kadar yanıtlayın.");
    await page.selectOption("#capType", "sayfa");
    await page.fill("#capTitle", "Proje #42 — tasarım");
    await page.fill("#capUrl", "javascript:alert(1)");
    await page.click("#capRun");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#capUrl", "https://proje-ornek.com/gorev/42");
    await page.click("#capRun");
    await toastHas(page, /1 görev adayı inceleme kuyruğuna eklendi\./);
    s = await state(page);
    const cap = s.items.find((x) => /tasarım geri bildirimlerini/.test(x.title));
    assert.equal(cap.verb, "yanıtla");
    assert.equal(cap.due, "2026-11-07");
    assert.equal(cap.sources[0].url, "https://proje-ornek.com/gorev/42");

    // 3) Panodan yakalama (gerçek pano): boş pano uyarısı, ardından metin
    await clipWrite(app, "");
    await page.click('.ax-toolbar [data-act="clipboard"]');
    await toastHas(page, /Panoda metin yok/);
    await clipWrite(app, "Kargo iadesi için iade formunu doldur ve 3 gün içinde kargoya ver. Fatura.pdf dosyasını ekle.");
    await page.click('.ax-toolbar [data-act="clipboard"]');
    await toastHas(page, /görev adayı inceleme kuyruğuna eklendi.*\(panodan\)/);
    s = await state(page);
    const clip = s.items.find((x) => /iade formunu doldur/.test(x.title));
    assert.equal(clip.sources[0].type, "pano");
    assert.equal(clip.due, "2026-11-09");

    // 4) Metin dosyası: BOM, liste satırları, işaretli satır atlanır, .pdf atlanır, kaynak dosya değişmez
    setFile("pick.txt", txtPath + "\n" + pdfPath);
    await page.click('.ax-toolbar [data-act="files"]');
    await toastHas(page, /2 görev adayı 1 dosyadan eklendi · 1 dosya atlandı/);
    s = await state(page);
    const pz = s.items.find((x) => x.title === "Pazarlama planını güncelle");
    assert.ok(pz, "liste satırı aday olmalı");
    assert.equal(pz.due, "2026-11-09");
    assert.equal(pz.sources[0].title, "toplanti-notlari.txt");
    assert.ok(!s.items.some((x) => /Katılımcı listesi/.test(x.title)), "işaretli satır atlanmalı");
    assert.equal(sha(txtPath), before);
    rmFile("pick.txt");

    // 5) Düzenleyip göreve ekle; kişi ataması onaysız taslak kalır
    await openReview(page, /^Revize teklifi 13 Kasım'a kadar gönderebilir/);
    await page.fill("#fTitle", "Revize teklifi gönder");
    await page.click("#acceptBtn");
    await toastHas(page, /Görev eklendi\./);
    await openReview(page, /Murat Bey bütçe tablosunu/);
    await page.click("#acceptBtn");
    await toastHas(page, /Görev eklendi \(kişi ataması taslak\)\./);
    s = await state(page);
    const teklif = s.items.find((x) => x.title === "Revize teklifi gönder");
    assert.equal(teklif.status, "acik");
    assert.equal(teklif.edited, true);
    const butce = s.items.find((x) => /Murat Bey bütçe/.test(x.title));
    assert.equal(butce.assignee, "Murat");
    assert.equal(butce.assigneeConfirmed, false);

    // 6) Olası yineleme: uyarı, ayrı görev olarak eklemeye zorlamadan birleştirme
    await openReview(page, /göndermeniz gerekiyor/);
    assert.ok(await page.isVisible("#dupBox"));
    assert.match(await text(page, "#dupBox"), /Olası yineleme: “Revize teklifi gönder”/);
    await shot(page, "masaustu-02-olasi-yineleme.png");
    await page.click("#acceptBtn");
    await toastHas(page, /aynı iş olabilir/);
    await page.click("#mergeBtn");
    await toastHas(page, /Kaynak “Revize teklifi gönder” görevine eklendi; yeni görev açılmadı/);
    s = await state(page);
    assert.equal(s.items.find((x) => x.id === teklif.id).sources.length, 2);
    assert.equal(s.metrics.prevented, 1);

    // 7) Ret ve geri alma
    await openReview(page, /^Annemi ara$/);
    await page.click("#rejectBtn");
    await toastHas(page, /Aday reddedildi/);
    await page.click('[data-nav="tasks"]');
    await page.click('[data-tf="red"]');
    await openTask(page, /^Annemi ara$/);
    await page.click("#toReviewBtn");
    await toastHas(page, /inceleme kuyruğuna geri alındı/);
    await page.click('[data-nav="review"]');
    await openReview(page, /^Annemi ara$/);
    await page.click("#rejectBtn");
    await toastHas(page, /Aday reddedildi/);

    // 8) MyMind: anahtar, red, onay; kişi adı / e-posta / kaynak adresi gitmez; uydurma kişi atılır; öneriyi uygula
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await openReview(page, /@deniz logo dosyalarını/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    assert.match(readLog("approvals.txt"), /\d kişi adı \[Kişi1\]… olarak/);
    assert.match(readLog("approvals.txt"), /kaynak adresi ve başlığı gönderilmez/);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi hazır; 1 öğe denetimde atıldı/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    for (const secret of ["@deniz", "deniz", "Proje grubu", "WhatsApp", "Murat"]) assert.ok(!sent.includes(secret), secret + " gönderilmemeli");
    assert.match(await text(page, "#aiBox"), /MyMind önerisi.*Fiil: yükle.*Son tarih/s);
    assert.ok(!(await text(page, "#aiBox")).includes("Ahmet"), "metinde olmayan kişi atılmalı");
    await page.evaluate(() => document.getElementById("aiBox").scrollIntoView({ block: "end" }));
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click("#aiApplyBtn");
    await toastHas(page, /MyMind önerisi uygulandı/);
    s = await state(page);
    const deniz = s.items.find((x) => x.title === "Logo dosyalarını Drive'a yükle");
    assert.ok(deniz, "uygulanan MyMind başlığı (yer tutucu geri konmuş)");
    assert.equal(deniz.assignee, "deniz");
    assert.equal(deniz.dueFrom, "mymind");
    assert.equal(deniz.status, "inceleme", "öneriyi uygulamak görevi kabul etmez");
    report.mymind = { calls: hubCalls, dropped: s.counters.aiDropped };

    // 9) Toplu kabul: olası yinelemeler bekletilir
    await page.check("#selAll");
    await page.click("#acceptSelBtn");
    await toastHas(page, /aday göreve eklendi( · \d+ olası yineleme incelemede bekletildi)?\./);
    s = await state(page);
    assert.ok(s.items.filter((x) => x.status === "inceleme").every((x) => x.dup), "yalnız olası yinelemeler incelemede kalır");
    for (const x of s.items.filter((i) => i.status === "inceleme")) { await openReview(page, new RegExp("^" + x.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$")); await page.click("#ignoreDupBtn"); await toastHas(page, /Ayrı görev olarak eklendi/); }
    s = await state(page);
    assert.equal(s.metrics.review, 0);

    // 10) Görev kuyruğu: kovalar, tamamlama, kaynağı açma
    await page.click('[data-nav="tasks"]');
    await page.click('[data-tf="acik"]');
    assert.match(await text(page, "#taskList"), /Bugün|7 gün içinde/);
    assert.match(await text(page, "#taskList .ax-group"), /^(Gecikmiş|Bugün|7 gün içinde)/);
    await openTask(page, /Başvuru formunu doldurun/);
    await page.click('#taskDetail [data-src="0"]');
    await toastHas(page, /Tarayıcıda açıldı: belediye-ornek\.gov\.tr/);
    assert.match(readLog("opened.txt"), /^https:\/\/belediye-ornek\.gov\.tr\/duyuru\/kres-basvuru/);
    const fat = await byTitle(page, /Faturayı son ödeme tarihine kadar ödeyin/);
    await page.click(`#taskList .ax-item[data-id="${fat.id}"] input[type=checkbox]`);
    await toastHas(page, /Görev tamamlandı\./);
    await openTask(page, /Revize teklifi gönder/);
    await page.evaluate(() => { document.getElementById("taskList").scrollTop = 0; document.getElementById("taskDetail").scrollTop = 0; });
    await shot(page, "masaustu-04-gorevler.png");

    // 11) Kabulden sonra fark edilen yineleme: başka göreve birleştir → yinelenen görev ölçüsü
    await openTask(page, /tasarım geri bildirimlerini/);
    const target = await byTitle(page, /Sunum slaytlarını gözden geçir/);
    await page.selectOption("#mergeSel", target.id);
    await page.click("#mergeTaskBtn");
    await toastHas(page, /Yineleme birleştirildi/);
    s = await state(page);
    assert.equal(s.metrics.duplicatesAfterAccept, 1);
    assert.equal(s.metrics.doneThisWeek, 1);
    assert.equal(s.metrics.sourcedDoneThisWeek, 1);
    report.metrics = { accepted: s.metrics.accepted, duplicateRate: s.metrics.duplicateRate, prevented: s.metrics.prevented, doneThisWeek: s.metrics.doneThisWeek, acceptRate: s.metrics.acceptRate, gold: s.gold };

    // 12) Görev kutusu (widget): ayrı pencere, tamamlama ana pencereye yansır
    const wPromise = app.waitForEvent("window");
    await page.click("#openWidget");
    const w = await wPromise;
    await w.waitForLoadState("domcontentloaded");
    await until(w, () => document.documentElement.dataset.ready === "1");
    assert.equal(await w.title(), "Action Inbox — görev kutusu");
    await until(w, () => document.querySelectorAll("#wList .axw-item").length >= 5);
    assert.match(await w.textContent("#wInfo"), /açık · \d+ gecikmiş · bu hafta 1 tamamlandı/);
    await until(page, () => document.getElementById("widgetState").textContent === "Açık");
    if (shots) { await w.setViewportSize({ width: 360, height: 480 }).catch(() => {}); await w.screenshot({ path: path.join(shots, "masaustu-06-gorev-kutusu.png") }); }
    await w.locator("#wList .axw-item input[type=checkbox]").first().click();
    await until(page, () => /bu hafta 2 tamamlandı/.test(document.getElementById("toasts") && document.body.textContent) || true);
    await until(w, () => /bu hafta 2 tamamlandı/.test(document.getElementById("wInfo").textContent));
    s = await state(page);
    assert.equal(s.metrics.doneThisWeek, 2);
    await page.click("#openWidget");
    await until(page, () => document.getElementById("widgetState").textContent === "Kapalı");

    // 13) Ölçüler ve ayarlar; yerel model yalnız loopback
    await page.click('[data-nav="settings"]');
    assert.match(await text(page, "#metrics"), /yinelenen görev \(hedef < %3\)/);
    assert.match(await text(page, "#goldInfo"), /fiil doğruluğu %100/);
    assert.equal(await count(page, "#weeks .ax-week"), 4);
    await shot(page, "masaustu-05-olculer-ayarlar.png");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://example.com:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="tasks"]');
    await openTask(page, /Pazarlama planını güncelle/);
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi hazır/);
    assert.equal(hubCalls, 2);
    assert.match(readLog("approvals.txt"), /Yerel model \(http:\/\/127\.0\.0\.1:\d+, test-model\)/);
    await page.uncheck("#setShortcut").catch(() => {});

    // 14) Dışa aktarma
    await page.click('[data-nav="settings"]');
    await page.click("#mdBtn");
    await toastHas(page, /gorev-kuyrugu\.md” kaydedildi/);
    await page.click("#icsBtn");
    await toastHas(page, /gorevler\.ics” kaydedildi/);
    await page.click("#csvBtn");
    await toastHas(page, /action-inbox\.csv” kaydedildi/);
    const md = fs.readFileSync(path.join(testDir, "gorev-kuyrugu.md"), "utf8");
    assert.match(md, /kişi \(taslak\): Murat/);
    assert.match(md, /## Bu hafta tamamlanan \(2\)/);
    assert.match(md, /\[Sayfa: Belediye — Kreş başvuru duyurusu\]\(https:\/\/belediye-ornek\.gov\.tr/);
    const ics = fs.readFileSync(path.join(testDir, "gorevler.ics"), "utf8");
    assert.match(ics, /BEGIN:VTODO/);
    assert.match(ics, /DUE;VALUE=DATE:20261113/);
    assert.match(fs.readFileSync(path.join(testDir, "action-inbox.csv"), "utf8"), /Kişi \(taslak\)/);
    await page.click("#setShortcut");
    await toastHas(page, /Genel kısayol kapatıldı/);
    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snap = await state(page);
    await app.close();

    // 15) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.items.length, snap.items.length);
    assert.equal(s.metrics.accepted, snap.metrics.accepted);
    assert.equal(s.metrics.duplicatesAfterAccept, 1);
    assert.equal(s.settings.provider, "yerel");
    assert.equal(s.settings.shortcut, false);
    report.vault = s.vault;
    if (s.vault) assert.ok(!fs.readFileSync(path.join(userData, "gorevler.bin"), "latin1").includes("Revize"));
    assert.equal(sha(txtPath), before);
    assert.deepEqual(violations, []);
    await app.close();
    console.log(JSON.stringify(report, null, 2));
    console.log("DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform + " · electron " + require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version);
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
