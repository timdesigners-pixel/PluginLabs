// Masaüstü duman testi: gerçek Electron penceresi; örnek transkript (biçim önizlemesi, hassas değer uyarısı), katılımcı bilgilendirme beyanı
// zorunluluğu, çözümleme (21 satır, 4 konuşmacı, 12 taslak), onay/red, sorumlu atama, konuşmacı adlandırma ve tahmin doğrulama, zaman damgalı not,
// elle öğe, MyMind (taklit Hub: anahtar, onay, red, adların ve hassas değerin gitmemesi, dayanaksız önerinin atılması, tekrar önerinin atlanması),
// dışa aktarma (MD/CSV/ICS) ve gerçek pano, karar ve görevler görünümü, ikinci toplantı (dosyadan, İngilizce), arşiv, yerel model (loopback;
// dış adres reddi), ölçüler ve kalıcılık. Mikrofon/ekran izni istenmez. TEST kipinde onaylar ve dosya seçimleri dosya üzerinden yürür.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
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

// Taklit model: Türkçe örnekte (S4 var) bir tekrar karar, iki yeni öneri ve bir dayanaksız öneri; İngilizce toplantıda tek öneri.
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
      const out = /S4/.test(user)
        ? { kararlar: [{ metin: "Sürüm 20 Kasım'a ertelendi", satirlar: ["L4"] }],
            gorevler: [{ metin: "Bildirim sorunu için hata kayıtlarını toplamak", sorumlu: "S2", son_tarih: "yarın", satirlar: ["L15"] }, { metin: "Uydurma görev", sorumlu: "S1", satirlar: ["L99"] }],
            sorular: [{ metin: "SSS taslağını kimin hazırlayacağı", satirlar: ["L12"] }], konusmaci_tahminleri: [] }
        : { kararlar: [], gorevler: [{ metin: "Finish the landing page copy", sorumlu: "S2", son_tarih: "Friday", satirlar: ["L2"] }], sorular: [], konusmaci_tahminleri: [] };
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
  await page.setViewportSize({ width: 1360, height: 860 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.mtDesktop.state());
const text = (page, sel) => page.textContent(sel);
const itemSel = (id) => `#tab-items .mt-item[data-id="${id}"]`;
const itemOf = (st, line, kind) => st.meeting.items.find((x) => x.lineIds[0] === line && (!kind || x.kind === kind));
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());

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
    // Ses kaydı yok: mikrofon izni reddedilir.
    const mic = await page.evaluate(() => navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices.getUserMedia({ audio: true }).then(() => "verildi", (e) => "red:" + e.name) : "yok");
    assert.notEqual(mic, "verildi");
    report.mikrofon = mic;

    // 1) Örnek transkript: biçim önizlemesi ve hassas değer uyarısı
    await page.click("#sampleBtn");
    await toastHas(page, /Örnek transkript yüklendi/);
    await until(page, () => /WebVTT · 21 satır · 4 konuşmacı/.test(document.getElementById("inFormat").textContent));
    assert.ok(await page.isVisible("#sensWarn"));
    assert.match(await text(page, "#sensWarn"), /1 e-posta/);
    assert.equal(await page.inputValue("#inDate"), "2026-11-04");
    await page.fill("#inPeople", "Elif Kurt");
    await shot(page, "masaustu-00-transkript-girisi.png");

    // 2) Bilgilendirme beyanı olmadan çözümlenmez
    await page.click("#createBtn");
    await toastHas(page, /bilgilendirme beyanını işaretleyin/);
    assert.equal((await state(page)).meetings.length, 0);
    await page.check("#consent");
    await page.click("#createBtn");
    await toastHas(page, /21 satır \(WebVTT\) çözümlendi: 12 taslak/);
    await until(page, () => document.querySelectorAll("#lines .mt-line").length === 21);
    let st = await state(page);
    const mid = st.meeting.id;
    assert.equal(st.meeting.speakers.length, 4);
    assert.equal(st.meeting.consent.informed, true);
    assert.deepEqual(st.meeting.participants, ["Elif Kurt"]);
    assert.equal(await page.locator("#tab-items .mt-item").count(), 12);
    assert.equal(await page.locator('#lines .mt-line[data-id="l8"] .pl-badge:has-text("tahmin")').count(), 1);
    assert.equal(await page.locator('#lines .mt-line[data-id="l9"] .pl-badge:has-text("adsız")').count(), 1);
    assert.match(await text(page, "#mStats"), /12\s*taslak/);
    assert.match(await text(page, "#tab-items"), /2 görevin sorumlusu belirsiz/);
    const l5 = itemOf(st, "l5");
    assert.match(await text(page, itemSel(l5.id)), /Sorumlu: Mehmet Kaya.*Son tarih: 6 Kasım 2026 \(“cuma”\)/s);
    await page.click('#lines .mt-line[data-id="l6"]');
    await shot(page, "masaustu-01-transkript-ve-taslaklar.png");

    // 3) Onay / red; sorumlu atama
    for (const it of st.meeting.items) if (it.lineIds[0] !== "l9" && it.lineIds[0] !== "l14") await page.click(itemSel(it.id) + ' [data-act="approve"]');
    await page.click(itemSel(itemOf(st, "l9").id) + ' [data-act="reject"]');
    const l14 = itemOf(st, "l14");
    await page.click(itemSel(l14.id) + ' [data-act="edit"]');
    await page.selectOption(itemSel(l14.id) + ' select[aria-label="Sorumlu"]', "s3");
    await page.fill(itemSel(l14.id) + ' input[aria-label="Son tarih"]', "2026-11-10");
    await page.click(itemSel(l14.id) + ' [data-act="save"]');
    await toastHas(page, /Öğe güncellendi/);
    await page.click(itemSel(l14.id) + ' [data-act="approve"]');
    await until(page, () => /11\s*onaylı/.test(document.getElementById("mStats").textContent));
    st = await state(page);
    assert.equal(itemOf(st, "l14").owner, "s3");
    assert.equal(itemOf(st, "l14").ownerState, "acik");
    assert.equal(itemOf(st, "l14").due, "2026-11-10");
    assert.equal(itemOf(st, "l9").status, "red");

    // 4) Konuşmacılar: adsız konuşmacıya ad; tahmin satırını doğrula
    await page.click('[data-tab="speakers"]');
    await page.fill('#tab-speakers input[data-key="s4"]', "Can Er");
    await page.press('#tab-speakers input[data-key="s4"]', "Tab");
    await toastHas(page, /Konuşmacı adı kaydedildi/);
    await until(page, () => /Can Er/.test(document.querySelector('#lines .mt-line[data-id="l9"]').textContent));
    await page.click('#lines .mt-line[data-id="l8"]');
    await shot(page, "masaustu-02-konusmacilar.png");
    await page.click('#lines .mt-line[data-id="l8"] button:has-text("Tahmini doğrula")');
    await toastHas(page, /Konuşmacı doğrulandı/);
    st = await state(page);
    assert.equal(st.meeting.lines.find((l) => l.id === "l8").guess, false);
    assert.equal(itemOf(st, "l8").ownerState, "acik");
    assert.equal(itemOf(st, "l13").owner, "s4");

    // 5) Zaman damgalı not ve elle öğe
    await page.click('#lines .mt-line[data-id="l3"]');
    await page.fill('#lines .mt-line[data-id="l3"] .mt-noteinput', "Giriş ekranı şikâyeti öncelikli");
    await page.click('#lines .mt-line[data-id="l3"] button:has-text("Not ekle")');
    await toastHas(page, /Not eklendi \(00:00:31\)/);
    await page.click('#lines .mt-line[data-id="l11"]');
    await page.click('#lines .mt-line[data-id="l11"] button:has-text("+ Görev")');
    await toastHas(page, /Görev taslağı eklendi/);
    st = await state(page);
    const manual = st.meeting.items.find((x) => x.origin === "elle");
    assert.equal(manual.owner, "s2");
    await page.fill(itemSel(manual.id) + " textarea", "Destek ekibi için SSS sayfası açmak");
    await page.click(itemSel(manual.id) + ' [data-act="save"]');
    await toastHas(page, /Öğe güncellendi/);
    await page.click(itemSel(manual.id) + ' [data-act="approve"]');
    await page.click('[data-tab="notes"]');
    assert.match(await text(page, "#tab-notes"), /00:00:31\s*Giriş ekranı şikâyeti öncelikli/);

    // 6) MyMind: anahtar yoksa bağlantı penceresi; onay reddedilirse hiçbir şey gönderilmez
    await page.click('[data-tab="items"]');
    await page.click("#aiBtn");
    await until(page, () => document.getElementById("mymindDialog").open);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await until(page, () => /Bağlı/.test(document.getElementById("mymindState").textContent));
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind: 2 yeni öneri, 1 tekrar atlandı, 1 dayanaksız öneri atıldı/);
    assert.equal(hubCalls, 1);
    const approvals = readLog("approvals.txt");
    assert.match(approvals, /21 transkript satırı/);
    assert.match(approvals, /S1, S2… takma adlarıyla/);
    assert.match(approvals, /1 hassas değer \(e-posta\)/);
    const sent = readLog("ai-sent.json");
    for (const secret of ["Ayşe", "Mehmet", "Zeynep", "Can Er", "Demir", "destek@ornekfirma.com.tr", "Elif", "Ürün haftalık", "Giriş ekranı şikâyeti"]) assert.ok(!sent.includes(secret), secret + " gönderilmemeli");
    assert.match(sent, /⟦1⟧/);
    st = await state(page);
    const ai = st.meeting.items.filter((x) => x.origin === "mymind");
    assert.equal(ai.length, 2);
    const aiTask = ai.find((x) => x.kind === "gorev");
    assert.equal(aiTask.owner, "s2");
    assert.equal(aiTask.ownerState, "tahmin");
    assert.equal(aiTask.due, "2026-11-05");
    await page.click(itemSel(aiTask.id));
    await page.click(itemSel(aiTask.id) + ' [data-act="approve"]');
    await page.click(itemSel(ai.find((x) => x.kind === "soru").id) + ' [data-act="reject"]');
    await page.keyboard.press("Escape");
    await page.locator(itemSel(aiTask.id)).scrollIntoViewIfNeeded();
    await shot(page, "masaustu-03-mymind-onerisi.png");

    // 7) Dışa aktarma ve pano
    for (const f of ["md", "csv", "ics"]) {
      await page.selectOption("#exportFmt", f);
      await page.click("#exportBtn");
      await toastHas(page, /kaydedildi \(13 onaylı öğe\)/);
    }
    const base = "Ürün haftalık toplantısı (örnek)";
    const md = fs.readFileSync(path.join(testDir, base + ".md"), "utf8");
    assert.match(md, /## Kararlar \(2\)/);
    assert.match(md, /## Açık sorular \(0\)/);
    assert.match(md, /Paket fiyatlarını .* — Sorumlu: Ekip \(kişi atanmadı\)/);
    assert.match(md, /## Görevler \(11\)/);
    assert.match(md, /Sorumlu: Can Er \(tahmin\) — Son tarih: 5 Kasım 2026/);
    assert.match(md, /Performans testi .* — Sorumlu: Zeynep Arslan — Son tarih: 10 Kasım 2026/);
    assert.match(md, /- \[00:00:31\] Giriş ekranı şikâyeti öncelikli/);
    assert.ok(!md.includes("henüz bilmiyoruz"), "reddedilen öğe nota girmez");
    const csv = fs.readFileSync(path.join(testDir, base + "-ogeler.csv"), "utf8");
    assert.equal(csv.trim().split("\r\n").length, 14);
    const ics = fs.readFileSync(path.join(testDir, base + "-gorevler.ics"), "utf8");
    assert.equal((ics.match(/BEGIN:VTODO/g) || []).length, 11);
    await page.click("#copyBtn");
    await toastHas(page, /panoya kopyalandı/);
    assert.match(await clipRead(app), /^# Ürün haftalık toplantısı \(örnek\)/);

    // 8) Karar ve görevler görünümü
    await page.click('[data-nav="tasks"]');
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 11);
    assert.match(await text(page, "#taskTable"), /Can Er \(tahmin\)/);
    await page.fill("#taskSearch", "zeynep");
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 4);
    await page.fill("#taskSearch", "");
    await page.click('#view-tasks [data-kind="karar"]');
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 2);
    await page.click('#view-tasks [data-kind="gorev"]');
    await page.check("#onlyUnclear");
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 1);
    await page.uncheck("#onlyUnclear");
    await until(page, () => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === 11);
    await shot(page, "masaustu-04-karar-ve-gorevler.png");

    // 9) İkinci toplantı: dosyadan (İngilizce, zaman damgalı satırlar)
    const enFile = path.join(testDir, "launch-sync.txt");
    fs.writeFileSync(enFile, ["[00:00:03] John Miller: Thanks for joining, today we'll go over the launch plan.", "[00:00:10] Priya Shah: The landing page copy is almost done.", "[00:00:18] John Miller: We decided to launch on December 1st.", "[00:00:25] Priya Shah: I'll send the final copy to legal by Friday.", "[00:00:34] John Miller: Tom, can you update the pricing table?", "[00:00:40] Tom Becker: Sure, will do.", "[00:00:55] Priya Shah: Whether we offer a free tier is still open."].join("\r\n"), "utf8");
    setFile("pick.txt", enFile);
    await page.click('[data-nav="meet"]');
    await page.click("#newBtn");
    await page.click("#openFileBtn");
    await toastHas(page, /launch-sync.txt açıldı/);
    await until(page, () => /Zaman damgalı satırlar · 7 satır · 3 konuşmacı/.test(document.getElementById("inFormat").textContent));
    await page.check("#consent");
    await page.click("#createBtn");
    await toastHas(page, /7 satır \(Zaman damgalı satırlar\) çözümlendi: 4 taslak/);
    st = await state(page);
    assert.equal(st.meeting.title, "launch-sync");
    const mid2 = st.meeting.id;

    // 10) Yerel model: dış adres reddedilir; loopback çalışır (anahtar gönderilmez)
    await page.click('[data-nav="settings"]');
    await page.check('input[name="provider"][value="yerel"]');
    await toastHas(page, /Yerel model seçildi/);
    await page.fill("#localUrl", "http://ornek.com:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarları kaydedildi/);
    await page.click('[data-nav="meet"]');
    await page.click("#aiBtn");
    await toastHas(page, /MyMind: 1 yeni öneri/);
    assert.equal(hubCalls, 2);
    assert.match(readLog("approvals.txt"), /Yerel model \(http:\/\/127\.0\.0\.1:/);
    st = await state(page);
    assert.equal(st.meeting.items.filter((x) => x.origin === "mymind").length, 1);

    // 11) Toplantılar: arşiv (silinmez)
    await page.click('[data-nav="meetings"]');
    assert.equal(await page.locator("#meetList .mt-mrow").count(), 2);
    await page.click('#meetList .mt-mrow:has-text("launch-sync") button:has-text("Arşivle")');
    await toastHas(page, /arşivlendi/);
    assert.equal(await page.locator("#meetList .mt-mrow").count(), 1);
    await page.check("#showArchived");
    assert.equal(await page.locator("#meetList .mt-mrow").count(), 2);
    await shot(page, "masaustu-05-toplantilar.png");

    // 12) Ölçüler
    await page.click('[data-nav="settings"]');
    const metrics = await text(page, "#metrics");
    assert.match(metrics, /%100\s*etiketli örnekte kesinlik \(12\/12; hedef ≥ %90\)/);
    st = await state(page);
    report.stats = { bench: st.stats && st.bench, taskPrecision: st.stats.taskPrecision, precision: st.stats.precision, aiPrecision: st.stats.aiPrecision, ownerUnclear: st.stats.ownerUnclear };
    assert.equal(st.stats.decidedRule, 12);
    assert.equal(st.stats.precision, 91.7);
    assert.equal(st.stats.aiPrecision, 50);
    assert.equal(st.stats.taskPrecision, 100);
    assert.equal(st.stats.ownerUnclear, 1);
    assert.match(metrics, /%91,7\s*tüm kural taslakları/);
    await page.check('input[name="provider"][value="hub"]');
    await toastHas(page, /MyMind \(Hub\) seçildi/);
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    assert.equal(violations.length, 0, "CSP/hata: " + violations.join(" | "));
    await app.close();

    // 13) Kalıcılık: yeniden açılış
    ({ app, page, violations } = await launch(port));
    const s2 = await state(page);
    assert.equal(s2.meetings.length, 2);
    assert.ok(s2.meetings.find((m) => m.id === mid2).archived);
    assert.equal(s2.settings.provider, "hub");
    assert.equal(s2.settings.localModel, "test-model");
    report.vault = s2.vault;
    if (s2.vault) assert.ok(fs.existsSync(path.join(userData, "toplantilar.bin")) && !fs.existsSync(path.join(userData, "toplantilar.json")));
    else assert.ok(fs.existsSync(path.join(userData, "toplantilar.json")));
    await page.click('[data-nav="meetings"]');
    await page.click('#meetList .mt-mrow:has-text("Ürün haftalık") button:has-text("Aç")');
    await until(page, () => document.querySelectorAll("#lines .mt-line").length === 21);
    const s3 = await state(page);
    assert.equal(s3.meeting.id, mid);
    assert.equal(s3.meeting.items.filter((x) => x.status === "onayli").length, 13);
    assert.equal(s3.meeting.notes.length, 1);
    assert.equal(s3.meeting.speakers.find((x) => x.key === "s4").name, "Can Er");
    assert.equal(violations.length, 0, "CSP/hata: " + violations.join(" | "));
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ", JSON.stringify({ platform: process.platform, kasa: report.vault ? "var" : "yok", hubCalls, mikrofon: report.mikrofon, ...report.stats }));
  } catch (e) {
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    console.error(e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
