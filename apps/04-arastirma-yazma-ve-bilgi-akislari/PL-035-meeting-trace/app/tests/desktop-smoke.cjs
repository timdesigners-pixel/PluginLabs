// Masaüstü duman testi: gerçek Electron penceresi; transkript önizlemesi (biçim, satır, konuşmacı, hassas değer uyarısı),
// zorunlu bilgilendirme/izin seçimi, örnek toplantı → satırlar + karar/görev adayları (kanıt satırı, Kesin/Tahmin/Belirsiz sahip),
// onay / ret / geri al, sahip ve son tarih düzeltme, metin düzenleme, kanıttan satıra gitme, zaman damgalı notlar, konuşmacı adı
// düzeltme ve tahmin satırını onaylama, MyMind (taklit Hub: anahtar, red, onay; adların ve e-postanın gitmemesi; kaynaksız maddenin
// atılması), yerel model (loopback; dış adres reddi), elle madde, dışa aktarma (MD/CSV/TXT/JSON), gerçek pano, görev listesi,
// WebVTT dosyası açma, arşiv, mikrofon izninin reddi, ölçüler ve yeniden açılışta kalıcılık.
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
      const has = (id) => new RegExp("^" + id + " ", "m").test(user);
      const out = { kararlar: [], gorevler: [] };
      if (has("u3")) out.kararlar.push({ metin: "Lansman takvimi K1 tarafından iki seçenekle açıldı", kaynak: ["u3"] });
      if (has("u11")) out.gorevler.push({ metin: "Mağaza görsellerinin boyutlarını K2 kontrol edecek", sorumlu: "tahmin:K2", tarih: "", kaynak: ["u11"] });
      if (has("u5")) out.gorevler.push({ metin: "Regresyon turunu bir hafta içinde tamamla", sorumlu: "K3", tarih: "gelecek hafta", kaynak: ["u5"] });
      out.gorevler.push({ metin: "Uydurma görev", sorumlu: "K1", kaynak: ["u999"] });
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
const item = (page, has) => page.locator("#items .mt-item", { hasText: has }).first();
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());
const findItem = (s, re) => s.meeting.items.find((x) => re.test(x.text));

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
    // Gizli kayıt yok: mikrofon izni reddedilir.
    const mic = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(mic, /^red:/, "mikrofon izni reddedilmeli: " + mic);
    const perm = await page.evaluate(async () => (await navigator.permissions.query({ name: "microphone" })).state);
    assert.equal(perm, "denied", "mikrofon izin durumu reddedilmiş olmalı");
    report.mikrofon = mic + " · izin: " + perm;

    // 1) Önizleme: biçim, satır, konuşmacı, hassas değer uyarısı
    await page.fill("#input", "Ayşe Demir   0:01\nMerhaba, raporu ayse@ornek.com adresine atın.\n\nCan Yıldız   0:12\nBen tabloyu yarın paylaşacağım.\nTelefonum 0532 123 45 67.");
    await until(page, () => /Metin transkripti · 2 satır · 2 konuşmacı · 2 zamanlı/.test(document.getElementById("inInfo").textContent));
    assert.ok(await page.isVisible("#sensWarn"));
    assert.match(await text(page, "#sensWarn"), /1 e-posta, 1 telefon/);
    await shot(page, "masaustu-00-transkript-yukleme.png");

    // 2) Örnek toplantı; izin seçimi zorunlu
    await page.click('[data-act="sample"]');
    await until(page, () => document.getElementById("input").value.includes("Ayşe Demir: Herkese merhaba"));
    assert.equal(await page.inputValue("#inTitle"), "Ürün lansmanı haftalık toplantısı");
    assert.equal(await page.inputValue("#inDate"), "2026-11-06");
    await page.click("#createBtn");
    await toastHas(page, /Bilgilendirme \/ izin seçeneğini işaretleyin/);
    await page.check('input[name="consent"][value="bilgilendirildi"]');
    await page.click("#createBtn");
    await toastHas(page, /36 satır, 4 konuşmacı · 18 karar\/görev adayı onayınızı bekliyor · 1 satırın konuşmacısı tahmin/);
    assert.ok(await page.isVisible("#meetPanel"));
    assert.equal(await page.locator("#lines .mt-line").count(), 36);
    assert.equal(await page.locator("#items .mt-item").count(), 18);
    assert.equal(await text(page, "#itemsBadge"), "18");
    assert.match(await text(page, "#mMeta"), /6 Kas 2026.*Metin transkripti.*36 satır.*4 konuşmacı.*09:10.*1 tahmin satır.*Katılımcılar bilgilendirildi/s);
    assert.match(await text(page, "#line-u30"), /Selin Arslan · tahmin/);
    // Sahip durumları görünür
    assert.match(await item(page, "ekran tasarımlarını").textContent(), /Kesin/);
    assert.match(await item(page, "mağaza görsellerinin").textContent(), /Belirsiz/);
    assert.match(await item(page, "Zeynep Hanım").textContent(), /Tahmin.*Katılımcı listesinde yok/s);
    assert.match(await item(page, "duyuru yaparım").textContent(), /Tahmin.*Konuşmacı tahmin/s);
    assert.equal(await item(page, "pazartesiye kadar").locator("input.mt-due").inputValue(), "2026-11-09");
    await shot(page, "masaustu-01-transkript-ve-adaylar.png");

    // 3) Onay: sahibi kesinleri toplu onayla; birini reddet; geri al; tekrar reddet
    await page.click('[data-act="approveAll"]');
    await toastHas(page, /11 madde onaylandı/);
    let s = await state(page);
    assert.equal(s.meeting.items.filter((x) => x.status === "onayli").length, 11);
    await item(page, "iletelim").locator('[data-act="reject"]').click();
    await until(page, () => !document.getElementById("items").textContent.includes("iletelim"));
    await page.click('[data-filter="reddedildi"]');
    await item(page, "iletelim").locator('[data-act="undo"]').click();
    await page.click('[data-filter="aday"]');
    await item(page, "iletelim").locator('[data-act="reject"]').click();
    s = await state(page);
    assert.equal(findItem(s, /iletelim/).status, "reddedildi");
    assert.equal(s.stats.metrics.ruleRejected, 1);
    // Sahip düzeltme + son tarih + onay
    const gorsel = item(page, "mağaza görsellerinin");
    const mehmetKey = s.meeting.speakers.find((x) => x.label === "Mehmet Kaya").key;
    await gorsel.locator("select.mt-ownersel").selectOption("k:" + mehmetKey);
    await until(page, () => /Kullanıcı atadı/.test([...document.querySelectorAll("#items .mt-item")].find((x) => /mağaza görsellerinin/.test(x.textContent)).textContent));
    await item(page, "mağaza görsellerinin").locator("input.mt-due").fill("2026-11-12");
    await item(page, "mağaza görsellerinin").locator("input.mt-due").dispatchEvent("change");
    await until(page, () => window.mtDesktop.state().then(() => true));
    await page.waitForTimeout(200);
    await item(page, "mağaza görsellerinin").locator('[data-act="approve"]').click();
    s = await state(page);
    const g = findItem(s, /mağaza görsellerinin/);
    assert.equal(g.status, "onayli");
    assert.equal(g.owner.key, mehmetKey);
    assert.equal(g.owner.state, "kesin");
    assert.equal(g.due, "2026-11-12");
    // Metin düzenleme
    await page.click('[data-filter="aday"]');
    await item(page, "basın bültenini").locator('[data-act="edit"]').click();
    await page.fill("#items textarea.mt-edit", "Basın bültenini ajansa gönder");
    await page.locator("#items .mt-item", { has: page.locator("textarea.mt-edit") }).locator("button", { hasText: "Kaydet" }).click();
    await until(page, () => document.getElementById("items").textContent.includes("Basın bültenini ajansa gönder"));
    // Kanıttan satıra
    await item(page, "Basın bültenini ajansa gönder").locator(".mt-evbtn").first().click();
    await until(page, () => document.querySelector("#line-u31.is-focus") !== null);

    // 4) Notlar
    await page.click('[data-tab="notes"]');
    await until(page, () => document.querySelectorAll("#notes .mt-note").length === 4);
    assert.match(await text(page, "#notes"), /00:40.*lansman tarihi.*Gündem.*03:20.*fiyatlandırma.*06:00.*destek hazırlığı/s);
    assert.ok(!(await text(page, "#notes")).includes("iletelim"), "reddedilen madde notlarda yok");
    await page.locator("#notes .mt-note", { hasText: "fiyatlandırma" }).scrollIntoViewIfNeeded();
    await shot(page, "masaustu-02-zaman-damgali-notlar.png");

    // 5) Konuşmacılar: tahmin satırını onayla, ad düzelt
    await page.click('[data-tab="speakers"]');
    assert.equal(await text(page, "#guessBadge"), "1");
    assert.equal(await page.locator("#speakers .mt-speaker").count(), 4);
    await page.locator("#guesses .mt-guess").first().locator('[data-act="confirmGuess"]').click();
    await until(page, () => document.getElementById("guessBadge").textContent === "0");
    s = await state(page);
    assert.equal(findItem(s, /duyuru yaparım/).owner.state, "kesin", "tahmin satırı onaylanınca sahip kesinleşir");
    const canInput = page.locator("#speakers .mt-speaker", { has: page.locator('input[value="Can Yıldız"]') }).locator("input.mt-spkname");
    await canInput.fill("Can Yıldız (Ürün)");
    await canInput.dispatchEvent("change");
    await until(page, () => document.getElementById("line-u14").textContent.includes("Can Yıldız (Ürün)"));
    await shot(page, "masaustu-03-konusmacilar.png");
    await page.click('[data-tab="items"]');

    // 6) MyMind: anahtar yok → pencere; red; onay
    await page.click('[data-act="ai"]');
    await until(page, () => document.getElementById("mymindDialog").open);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (kasaya kaydedildi|bu oturum için bellekte)/);
    setFile("deny.txt", "1");
    await page.click('[data-act="ai"]');
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0, "onaysız istek gitmez");
    rmFile("deny.txt");
    await page.click('[data-act="ai"]');
    await toastHas(page, /3 yeni aday eklendi, 1 kaynaksız madde atıldı/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    for (const bad of ["Ayşe", "Mehmet", "Selin", "Can Yıldız", "Zeynep Hanım'ı", "Ürün lansmanı"]) assert.ok(!sent.includes(bad), bad + " MyMind'a gitmemeli");
    assert.match(sent, /u7 \[01:45\] K1: Tamam, lansmanı 27 Kasım'a almaya karar verdik\./);
    assert.match(readLog("approvals.txt"), /36 transkript satırı.*K1, K2… takma adıyla \(4 konuşmacı/s);
    s = await state(page);
    const ai = s.meeting.items.filter((x) => x.origin === "ai");
    assert.equal(ai.length, 3);
    assert.ok(ai.every((x) => x.status === "aday"));
    assert.equal(ai.find((x) => /Mağaza/.test(x.text)).text, "Mağaza görsellerinin boyutlarını Mehmet Kaya kontrol edecek");
    assert.equal(ai.find((x) => /Mağaza/.test(x.text)).owner.state, "tahmin");
    assert.equal(ai.find((x) => /Regresyon turunu/.test(x.text)).due, "2026-11-13");
    assert.match(await item(page, "Regresyon turunu").textContent(), /MyMind/);
    await item(page, "Regresyon turunu").locator('[data-act="approve"]').click();
    await item(page, "Lansman takvimi").locator('[data-act="reject"]').click();
    s = await state(page);
    assert.equal(s.stats.metrics.aiApproved, 1);
    assert.equal(s.stats.metrics.aiRejected, 1);
    await shot(page, "masaustu-04-mymind-adaylari.png");

    // 7) Elle madde (seçili satıra bağlı)
    await page.click("#line-u35");
    await page.selectOption("#addKind", "gorev");
    await page.fill("#addText", "Lansman sonrası değerlendirme toplantısını 4 Aralık'a planla");
    await page.selectOption("#addOwner", s.meeting.speakers.find((x) => x.label === "Ayşe Demir").key);
    await page.click('#addForm button[type="submit"]');
    await toastHas(page, /Madde eklendi ve onaylandı \(seçili satıra bağlandı\)/);
    s = await state(page);
    const manual = findItem(s, /değerlendirme toplantısını/);
    assert.deepEqual(manual.refs, ["u35"]);
    assert.equal(manual.status, "onayli");

    // Sahibi tahmin olan görev de onaylanabilir; tahmin işareti korunur.
    await page.click('[data-filter="aday"]');
    await item(page, "Zeynep Hanım").locator('[data-act="approve"]').click();
    await until(page, () => !document.getElementById("items").textContent.includes("Zeynep Hanım"));

    // 8) Dışa aktarma + pano
    for (const f of ["md", "csv", "txt", "json"]) {
      await page.selectOption("#exportFormat", f);
      await page.click('[data-act="export"]');
      await toastHas(page, new RegExp("Ürün lansmanı haftalık toplantısı\\." + f + " kaydedildi"));
    }
    const md = readLog("Ürün lansmanı haftalık toplantısı.md");
    assert.match(md, /^# Ürün lansmanı haftalık toplantısı/);
    assert.match(md, /\*\*Bilgilendirme:\*\* Katılımcılar kayıt\/transkript/);
    assert.match(md, /`01:45` Tamam, lansmanı 27 Kasım'a almaya karar verdik\./);
    assert.match(md, /\| Bir de mağaza görsellerinin boyutlarını kontrol etmemiz gerekiyor\. \| Mehmet Kaya \| 2026-11-12 \| 02:40 \|/);
    assert.match(md, /Zeynep \(tahmin\)/);
    assert.ok(!md.includes("iletelim"), "reddedilen madde dışa aktarılmaz");
    assert.match(md, /madde onay bekliyor; bu dosyaya yalnız onaylı maddeler alındı/);
    const csv = readLog("Ürün lansmanı haftalık toplantısı.csv");
    assert.ok(csv.startsWith("﻿Tür;Metin;Sorumlu;Sorumlu durumu;Son tarih"));
    assert.match(csv, /Görev;Regresyon test planını pazartesiye kadar paylaşacağım\.;Selin Arslan;Kesin;2026-11-09/);
    const json = JSON.parse(readLog("Ürün lansmanı haftalık toplantısı.json"));
    assert.equal(json.participants.length, 4);
    assert.equal(json.tasks.length, 11);
    await page.click('[data-act="copy"]');
    await toastHas(page, /panoya kopyalandı/);
    assert.match(await clipRead(app), /^# Ürün lansmanı haftalık toplantısı/);

    // 9) Görev listesi: tamamla, süzgeç
    await page.click('[data-nav="tasks"]');
    s = await state(page);
    const openBefore = s.stats.open;
    assert.equal(await page.locator("#taskTable .mt-trow:not(.mt-trow--head)").count(), openBefore);
    assert.match(await text(page, "#taskTable"), /Zeynep.*Tahmin/s);
    await page.locator("#taskTable .mt-trow", { hasText: "fiyat karşılaştırma tablosunu" }).locator('input[type="checkbox"]').click();
    await until(page, (k) => document.querySelectorAll("#taskTable .mt-trow:not(.mt-trow--head)").length === k, openBefore - 1);
    assert.equal(await text(page, "#taskCount"), String(openBefore - 1));
    await page.selectOption("#taskOwner", "Selin Arslan");
    assert.ok((await page.locator("#taskTable .mt-trow:not(.mt-trow--head)").count()) >= 3);
    await page.selectOption("#taskOwner", "");
    await shot(page, "masaustu-05-gorevler.png");

    // 10) WebVTT dosyası, ikinci toplantı (kendi notu)
    const vtt = path.join(testDir, "haftalik.vtt");
    fs.writeFileSync(vtt, "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n<v Laura Chen>We decided to ship the export feature in December.\n\n00:00:05.000 --> 00:00:08.000\n<v Omar Haddad>I'll write the release notes by Friday.\n");
    setFile("pick.txt", vtt);
    await page.click('[data-nav="meet"]');
    await page.click('[data-act="new"]');
    await until(page, () => !document.getElementById("startPanel").hidden);
    await page.click('[data-act="openFile"]');
    await toastHas(page, /haftalik\.vtt açıldı \(WebVTT\)/);
    assert.equal(await page.inputValue("#inTitle"), "haftalik");
    await page.check('input[name="consent"][value="kendi-notum"]');
    await page.click("#createBtn");
    await toastHas(page, /2 satır, 2 konuşmacı · 2 karar\/görev adayı/);
    assert.match(await text(page, "#mMeta"), /WebVTT · haftalik\.vtt.*Kendi notu/s);

    // 11) Toplantılar: arşiv / geri al
    await page.click('[data-nav="list"]');
    assert.equal(await page.locator("#meetList .mt-mrow").count(), 2);
    await page.locator("#meetList .mt-mrow", { hasText: "haftalik" }).locator("button", { hasText: "Arşivle" }).click();
    await until(page, () => document.querySelectorAll("#meetList .mt-mrow").length === 1);
    await page.check("#showArchived");
    await page.locator("#meetList .mt-mrow", { hasText: "haftalik" }).locator("button", { hasText: "Geri al" }).click();
    await page.uncheck("#showArchived");
    await until(page, () => document.querySelectorAll("#meetList .mt-mrow").length === 2);
    await page.locator("#meetList .mt-mrow", { hasText: "Ürün lansmanı" }).locator("button", { hasText: "Aç" }).click();
    await until(page, () => !document.getElementById("meetPanel").hidden && document.getElementById("mTitle").value.startsWith("Ürün"));

    // 12) Yerel model: dış adres reddi, loopback ile çıkarım
    await page.click('[data-nav="settings"]');
    await page.check('input[name="provider"][value="yerel"]');
    await until(page, () => !document.getElementById("localBox").hidden);
    await page.fill("#localUrl", "http://example.com:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="meet"]');
    await page.click('[data-act="ai"]');
    await toastHas(page, /0 yeni aday eklendi, 3 zaten vardı, 1 kaynaksız madde atıldı/);
    assert.equal(hubCalls, 2);
    await page.click('[data-nav="settings"]');
    await page.check('input[name="provider"][value="hub"]');
    assert.match(await text(page, "#statGrid"), /Örnekte görev kesinliği%92,9/);
    assert.match(await text(page, "#statGrid"), /Onay oranı \(MyMind\)%50/);
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    s = await state(page);
    report.ornek = s.sampleEval;
    report.olculer = { kural: s.stats.rulePrecision, mymind: s.stats.aiPrecision, acikGorev: s.stats.open, belirsizSahip: s.stats.ambiguousOpen };
    report.kasa = s.vault;
    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");

    // 13) Yeniden açılış: kalıcılık
    await app.close();
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.meetings.length, 2);
    assert.equal(findItem(s, /iletelim/).status, "reddedildi");
    assert.equal(findItem(s, /mağaza görsellerinin boyutlarını kontrol/).due, "2026-11-12");
    assert.ok(s.tasks.some((t) => t.done));
    assert.equal(s.meeting.speakers.find((x) => x.key === s.meeting.speakers.find((y) => /Ürün/.test(y.label)).key).label, "Can Yıldız (Ürün)");
    const files = fs.readdirSync(userData);
    report.veriDosyasi = files.filter((f) => /^toplantilar\./.test(f));
    if (s.vault) assert.ok(files.includes("toplantilar.bin") && !files.includes("toplantilar.json"), "kasa varsa veri şifreli");
    assert.deepEqual(violations, []);
    await app.close();
    console.log(JSON.stringify(report, null, 2));
    console.log("DUMAN TESTİ GEÇTİ — " + process.platform + " · electron " + require(path.join(repo, "node_modules/electron/package.json")).version + " · kasa: " + (report.kasa ? "var" : "yok"));
  } catch (err) {
    try { await shot(page, "hata.png"); } catch { /* yok */ }
    console.error(err);
    try { await app.close(); } catch { /* yok */ }
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
