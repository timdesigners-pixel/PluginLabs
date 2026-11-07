// Masaüstü duman testi: gerçek Electron penceresi; transkript girişi (biçim tanıma, hassas değer uyarısı, izin kutusu zorunlu,
// bilgilendirme metni panoya), WebVTT transkriptten toplantı, örnek toplantı (elle etiketli), zaman çizelgesi, konuşmacı adlandırma,
// katılımcı ekleme, taslak onay/red/düzenleme, sorumlu belirsizliği süzgeci, MyMind (taklit Hub: anahtar, onay, red, adların K-kodlu
// ve e-postanın gizli gitmesi, bilinmeyen satırın reddi), dışa aktarma (MD/TXT/CSV/ICS yalnız onaylı), pano (not kopyalama, parola
// benzeri metnin reddi), arama, görev listesi, ölçüler, yerel model (loopback; dış adres reddi), arşiv, mikrofon izninin reddi ve kalıcılık.
// TEST kipinde onaylar ve dosya seçimleri dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "mt-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "mt-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

const VTT = [
  "WEBVTT", "",
  "00:00:02.000 --> 00:00:05.000", "<v Deniz Yalçın>Sprint planlamasına başlayalım.", "",
  "00:00:06.000 --> 00:00:09.500", "<v Burak Er>Giriş ekranı hatasını yarın düzelteceğim.", "",
  "00:00:10.000 --> 00:00:14.000", "<v Deniz Yalçın>Tamam, sürüm tarihi 18 Kasım olarak kesinleşti.", "",
  "00:00:15.000 --> 00:00:18.000", "<v Burak Er>Test raporunu deniz@ornek.com adresine gönderirim.", "",
  "00:00:19.000 --> 00:00:21.000", "Bir de dokümantasyonun güncellenmesi gerekiyor.", "",
].join("\n");

// Taklit model: <satirlar> içindeki satırlara bakarak cevap üretir; adları bilmez, yalnız K-kodlarını kullanır.
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    let content = "";
    if (ok) {
      const user = j.messages[1].content;
      const items = JSON.parse(/<satirlar>\n([\s\S]*)\n<\/satirlar>/.exec(user)[1]);
      const by = (id) => items.find((x) => x.s === id);
      const out = { kararlar: [], gorevler: [] };
      if (by("L17")) out.gorevler.push({ metin: "Test sonucunu bir sonraki toplantıda paylaşmak", sorumlu: by("L17").k.replace("~", ""), tahmin: true, neden: "Satırın konuşmacısı tahmini", tarih: "", satirlar: ["L17"] });
      if (by("L18")) out.gorevler.push({ metin: "Beta kullanıcılarına teşekkür e-postasını yarın göndermek", sorumlu: by("L18").k, tarih: "yarın", satirlar: ["L18"] });
      if (by("L5")) out.kararlar.push({ metin: "Lansman tarihi 20 Kasım olarak kesinleşti", satirlar: ["L5"] });
      out.kararlar.push({ metin: "Uydurma satıra bağlı karar", satirlar: ["L999"] });
      out.gorevler.push({ metin: "Bilinmeyen kişiye görev", sorumlu: "K42", satirlar: [items[0].s] });
      content = "```json\n" + JSON.stringify(out) + "\n```";
    }
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, MT_USER_DATA: userData, MT_TEST_DIR: testDir, MT_HUB_URL: "http://127.0.0.1:" + port },
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
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.mtDesktop.state());
const text = (page, sel) => page.textContent(sel);
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());
const itemOn = async (page, line, kind) => { const s = await state(page); return s.meeting.items.find((x) => x.lineIds[0] === line && (!kind || x.kind === kind)); };
const card = (id) => `.mt-item[data-id="${id}"]`;

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Meeting Trace");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.mtDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".mt-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".mt-product"), /Meeting Trace.*Toplantı izi.*35/s);
    assert.ok(await page.isVisible("#startPanel"));
    // Mikrofon izni hiçbir koşulda verilmez (bu sürüm ses kaydetmez).
    const mic = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(mic, /^red:/);
    report.microphone = mic;

    // 1) Transkript girişi: biçim tanıma, hassas değer uyarısı, izin zorunlu, bilgilendirme metni
    await page.fill("#input", VTT);
    await until(page, () => /WebVTT · 5 satır · 2 konuşmacı · 1 tahmini satır/.test(document.getElementById("inInfo").textContent));
    assert.ok(await page.isVisible("#sensWarn"));
    assert.match(await text(page, "#sensWarn"), /1 e-posta/);
    assert.equal(await page.isDisabled("#createBtn"), true, "izin işaretlenmeden çözümlenemez");
    await page.fill("#mtTitle", "Sprint planlaması");
    await page.fill("#mtDate", "2026-11-04");
    await page.fill("#mtPeople", "Selin Aydın");
    await page.click("#noticeBtn");
    await toastHas(page, /Bilgilendirme metni panoya kopyalandı/);
    assert.match(await clipRead(app), /Sprint planlaması.*4 kasım 2026.*Meeting Trace/s);
    await page.check("#consentOk");
    assert.equal(await page.isDisabled("#createBtn"), false);
    await shot(page, "masaustu-00-transkript-girisi.png");
    await page.click("#createBtn");
    await until(page, () => !document.getElementById("wsPanel").hidden && document.querySelectorAll("#lines .mt-line").length === 5);
    let s = await state(page);
    assert.equal(s.meeting.format, "vtt");
    assert.equal(s.meeting.consent.informed, true);
    assert.equal(s.meeting.consent.method, "Toplantı başında sözlü");
    assert.deepEqual(s.meeting.participants, ["Selin Aydın"]);
    const vttTasks = s.meeting.items.filter((x) => x.kind === "gorev");
    assert.equal(vttTasks.find((t) => t.lineIds[0] === "L2").assignee, "Burak Er");
    assert.equal(vttTasks.find((t) => t.lineIds[0] === "L2").due, "2026-11-05");
    assert.equal(vttTasks.find((t) => t.lineIds[0] === "L5").assigneeState, "belirsiz");
    assert.equal(s.meeting.items.filter((x) => x.kind === "karar").length, 1);
    assert.equal(await page.locator("#lines .pl-badge", { hasText: "tahmin" }).count(), 1);

    // 2) Örnek toplantı (elle etiketli) → zaman çizelgesi + taslaklar
    await page.click('[data-nav="desk"]');
    await page.click("#newBtn");
    await page.click('[data-act="sample"]');
    await toastHas(page, /Örnek toplantı: 22 satır, 3 karar ve 8 görev taslağı/);
    await until(page, () => document.querySelectorAll("#lines .mt-line").length === 22);
    assert.equal(await text(page, "#tabTasks"), "8");
    assert.equal(await page.locator("#speakers .mt-spk").count(), 5);
    assert.equal(await page.locator("#speakers .mt-spk.is-generic").count(), 1);
    assert.match(await text(page, "#wsStats"), /07:48/);
    await shot(page, "masaustu-01-zaman-cizelgesi-ve-taslaklar.png");

    // 3) Sorumlusu belirsiz süzgeci: nedenler görünür
    await page.click('[data-filter="belirsiz"]');
    await until(page, () => document.querySelectorAll("#items .mt-item").length === 2);
    assert.equal(await page.locator("#items .mt-why").count(), 2);
    assert.match(await text(page, "#items"), /Gereklilik söylendi; sorumlu belirtilmedi/);
    await shot(page, "masaustu-02-belirsiz-sorumlu.png");

    // 4) Konuşmacı adlandırma: "Konuşmacı 3" → "Elif Şahin"; katılımcı ekleme
    await page.click('#speakers [data-speaker="Konuşmacı 3"]');
    await page.fill("#speakerName", "Elif Şahin");
    await page.click("#speakerSave");
    await toastHas(page, /Konuşmacı 3” → “Elif Şahin” \(1 satır\)/);
    assert.equal(await page.locator("#speakers .mt-spk.is-generic").count(), 0);
    s = await state(page);
    assert.equal(s.meeting.lines.find((l) => l.id === "L12").speaker, "Elif Şahin");
    await page.click("#speakers button:has-text('+ Katılımcı')");
    await page.fill("#speakerName", "Ozan Tekin");
    await page.click("#speakerSave");
    await toastHas(page, /Ozan Tekin” katılımcı olarak eklendi/);

    // 5) Onay akışı: sorumlusu açık olanları toplu onayla, belirsizine sorumlu ata ve onayla, birini reddet, metni düzenle
    await page.click('[data-filter="all"]');
    await page.click("#approveAllBtn");
    await toastHas(page, /6 görev onaylandı/);
    const l15 = await itemOn(page, "L15");
    await page.selectOption(card(l15.id) + " select.mt-owner", "Ozan Tekin");
    await toastHas(page, /Sorumlu: Ozan Tekin/);
    await page.click(card(l15.id) + ' [data-act-item="approve"]');
    const l12 = await itemOn(page, "L12");
    await page.click(card(l12.id) + ' [data-act-item="reject"]');
    const l10 = await itemOn(page, "L10");
    await page.fill(card(l10.id) + " textarea", "Demo geri bildirim özetini cumaya kadar kanala gönder");
    await page.press(card(l10.id) + " textarea", "Tab");
    await toastHas(page, /Metin güncellendi/);
    await page.fill(card(l10.id) + " input.mt-due", "2026-11-07");
    await page.press(card(l10.id) + " input.mt-due", "Tab");
    await until(page, async () => true);
    s = await state(page);
    const st0 = s.meeting.stats;
    assert.equal(st0.tasksApproved, 7);
    assert.equal(s.meeting.items.find((x) => x.id === l15.id).assigneeState, "acik");
    assert.equal(s.meeting.items.find((x) => x.id === l12.id).status, "red");
    assert.equal(s.meeting.items.find((x) => x.id === l10.id).edited, true);
    await until(page, async () => true);
    assert.equal((await itemOn(page, "L10")).due, "2026-11-07");
    // Satırdan elle görev ekleme
    await page.click('#lines [data-line="L19"]');
    await page.click('#lines [data-line="L19"] button:has-text("Görev olarak ekle")');
    await toastHas(page, /Görev eklendi/);
    // Kararlar
    await page.click('[data-tab="karar"]');
    await page.click("#approveAllBtn");
    await toastHas(page, /3 karar onaylandı/);
    await page.click('[data-tab="gorev"]');

    // 6) MyMind: anahtar, red, onay; gönderilen veride adlar ve e-posta yok
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    assert.match(readLog("approvals.txt"), /Kişi adları K1, K2… kodlarıyla \(6 kişi\)/);
    assert.match(readLog("approvals.txt"), /1 e-posta ⟦n⟧ yer tutucusuyla/);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /yeni taslak eklendi; 2 öğe doğrulamadan geçmedi/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    for (const secret of ["Ayşe", "Mehmet", "Zeynep", "Elif", "Can Arslan", "Ozan", "mehmet.kaya@ornek.com", "Ürün lansmanı"]) assert.ok(!sent.includes(secret), secret + " gönderilmemeli");
    s = await state(page);
    const ai17 = s.meeting.items.find((x) => x.source === "mymind" && x.lineIds[0] === "L17");
    assert.ok(ai17, "MyMind görevi eklendi");
    assert.equal(ai17.assignee, "Ayşe Demir");
    assert.equal(ai17.assigneeState, "tahmin");
    assert.ok(!s.meeting.items.some((x) => /Uydurma/.test(x.text)), "bilinmeyen satıra bağlı karar alınmaz");
    assert.ok(s.meeting.items.filter((x) => x.lineIds[0] === "L18").length === 1, "aynı satırdaki benzer görev tekrar eklenmez");
    const unk = s.meeting.items.find((x) => /Bilinmeyen kişiye/.test(x.text));
    assert.ok(!unk || unk.assigneeState === "belirsiz");
    report.mymind = { added: s.meeting.items.filter((x) => x.source === "mymind").length, calls: hubCalls };
    await page.click('[data-filter="taslak"]');
    await until(page, () => document.querySelectorAll("#items .pl-badge--pro").length >= 1);
    await shot(page, "masaustu-03-mymind-inceleme.png");
    await page.click(card(ai17.id) + ' [data-act-item="approve"]');
    await page.click('[data-filter="all"]');

    // 7) Dışa aktarma: yalnız onaylı öğeler
    for (const f of ["md", "txt", "csv", "ics"]) {
      await page.selectOption("#exportFmt", f);
      await page.click("#exportBtn");
      await toastHas(page, /kaydedildi/);
    }
    const md = fs.readFileSync(path.join(testDir, "Ürün lansmanı haftalık toplantısı.md"), "utf8");
    assert.match(md, /## Kararlar/);
    assert.match(md, /Demo geri bildirim özetini cumaya kadar kanala gönder/);
    assert.ok(!md.includes("Basın bülteni"), "reddedilen görev nota girmez");
    assert.match(md, /Ozan Tekin/);
    assert.match(md, /Sorumlusu belirsiz ya da tahmini/);
    const csv = fs.readFileSync(path.join(testDir, "Ürün lansmanı haftalık toplantısı-gorevler.csv"), "utf8");
    const csvRows = csv.trim().split("\r\n").length - 1;
    const ics = fs.readFileSync(path.join(testDir, "Ürün lansmanı haftalık toplantısı-gorevler.ics"), "utf8");
    assert.equal((ics.match(/BEGIN:VTODO/g) || []).length, csvRows);
    assert.match(ics, /DUE;VALUE=DATE:20261107/);
    report.exports = { csvRows, mdBytes: md.length };

    // 8) Pano: not kopyalama ve parola benzeri metnin reddi
    await page.click("#copyBtn");
    await toastHas(page, /Toplantı notu panoya kopyalandı/);
    assert.match(await clipRead(app), /KARARLAR\n1\. /);
    await clipWrite(app, "Qw7#mZ9!pL2x");
    await page.click("#newBtn");
    await page.click('[data-act="clip"]');
    await toastHas(page, /parola ya da anahtar gibi görünüyor/);
    await clipWrite(app, "Ali: Raporu yarın göndereceğim.\nVeli: Tamam.");
    await page.click('[data-act="clip"]');
    await toastHas(page, /Panodan alındı/);
    assert.match(await page.inputValue("#input"), /Raporu yarın/);

    // 9) Arama: tüm toplantılarda
    await page.click('[data-nav="list"]');
    await page.fill("#searchQ", "lansman tarihi");
    await until(page, () => document.querySelectorAll("#results .mt-res").length >= 2);
    assert.match(await text(page, "#results .mt-res:first-child"), /Karar/);
    assert.equal(await page.locator("#mtList .mt-mrow").count(), 2);
    await shot(page, "masaustu-05-toplantilar-ve-arama.png");
    await page.click("#results .mt-res:first-child button");
    await until(page, () => !document.getElementById("view-desk").hidden && !!document.querySelector("#lines .mt-line.is-sel"));
    assert.equal(await page.getAttribute("#lines .mt-line.is-sel", "data-line"), "L5");

    // 10) Görev listesi: tamamlandı işareti, sorumlu süzgeci
    await page.click('[data-nav="tasks"]');
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length >= 8);
    const before = await page.locator("#taskTable .mt-trow:not(.mt-trow--head)").count();
    await page.selectOption("#ownerFilter", "Mehmet Kaya");
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 3);
    await page.selectOption("#ownerFilter", "*");
    await shot(page, "masaustu-04-gorevler.png");
    await page.locator("#taskTable .mt-trow:not(.mt-trow--head) input[type=checkbox]").first().click();
    await toastHas(page, /Görev tamamlandı/);
    await until(page, (n) => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === n - 1, before);

    // 11) Ölçüler ve ayarlar: kesinlik (onay/red ve etiketli örnek), yerel model yalnız loopback
    await page.click('[data-nav="settings"]');
    const metrics = await text(page, "#metrics");
    assert.match(metrics, /%100\s*görev kesinliği — etiketli örnek/);
    assert.match(metrics, /görev kesinliği — onay\/red/);
    report.metrics = (await state(page)).stats.review;
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://example.com:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="list"]');
    await page.click("#mtList .mt-mrow:has-text('Sprint planlaması') button:has-text('Aç')");
    await until(page, () => document.querySelectorAll("#lines .mt-line").length === 5);
    await page.click("#aiBtn");
    await toastHas(page, /taslak/);
    assert.equal(hubCalls, 2);
    assert.match(readLog("approvals.txt"), /Yerel model \(http:\/\/127\.0\.0\.1:\d+, test-model\)/);
    assert.ok(!readLog("ai-sent.json").includes("deniz@ornek.com"));

    // 12) Arşiv: silinmez, geri alınır
    await page.click('[data-nav="list"]');
    await page.click("#mtList .mt-mrow:has-text('Sprint planlaması') button:has-text('Arşivle')");
    await toastHas(page, /arşivlendi/);
    assert.equal(await page.locator("#mtList .mt-mrow").count(), 1);
    await page.check("#showArchived");
    await page.click("#mtList .mt-mrow:has-text('Sprint planlaması') button:has-text('Geri al')");
    await page.uncheck("#showArchived");
    await until(page, () => document.querySelectorAll("#mtList .mt-mrow").length === 2);

    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snapshot = await state(page);
    await app.close();

    // 13) Kalıcılık: yeniden açılışta toplantılar, onaylar ve ayarlar yerinde; veri dosyası kasa varsa şifreli
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.meetings.length, 2);
    assert.equal(s.tasks.length, snapshot.tasks.length);
    assert.equal(s.settings.provider, "yerel");
    const files = fs.readdirSync(userData);
    report.vault = s.vault;
    report.storage = files.filter((f) => /^toplantilar\./.test(f));
    if (s.vault) { assert.ok(files.includes("toplantilar.bin")); assert.ok(!fs.readFileSync(path.join(userData, "toplantilar.bin"), "latin1").includes("lansman")); }
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
