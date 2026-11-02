// Masaüstü duman testi: gerçek Electron penceresi; örnek taslak, tüm işlemler, fark/değişiklik görünümü, ton ve ton örneği,
// gerçek pano (kopyala, panodan al, parola benzeri metnin reddi, Ctrl+Shift+Y hızlı pencere işlevi), gizli veri uyarısı, .txt dosyası,
// terim sözlüğü, MyMind (taklit Hub: onay, red, sabit alan değerlerinin gitmemesi, eksik sabit alan uyarısı), geçmiş, ölçüler ve kalıcılık.
// TEST kipinde onaylar ve dosya seçimleri dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "tf-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";

// Taklit Hub: <metin> içindeki yer tutuculu metinden iki alternatif üretir; ikincisinde ilk sabit alan bilerek düşürülür.
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    let content = "";
    if (ok) {
      const user = JSON.parse(body).messages[1].content;
      const metin = /<metin>\n([\s\S]*)\n<\/metin>/.exec(user)[1];
      const a1 = metin.replace(/selam kanka,?\s*/i, "Merhaba, ").replace(/!+/g, ".").replace(/gelirim/, "orada olacağım");
      const first = (/⟦\d+⟧/.exec(a1) || [""])[0];
      const a2 = a1.replace(first + " ", "").replace(first, "");
      content = "```json\n" + JSON.stringify({ alternatifler: [{ metin: a1, not: "resmî ve kısa" }, { metin: a2, not: "daha kısa" }] }) + "\n```";
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
    env: { ...process.env, TF_USER_DATA: userData, TF_TEST_DIR: testDir, TF_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  page.on("dialog", (d) => d.accept());
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1240, height: 800 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.tfDesktop.state());
const text = (page, sel) => page.textContent(sel);
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Text Forge");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.tfDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".tf-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".tf-product"), /Text Forge.*Metin atölyesi.*33/s);
    assert.match(await text(page, "#resBody"), /Dönüştür'e basın/);
    await shot(page, "masaustu-00-ilk-acilis.png");

    // 1) Örnek taslak: sabit alanlar canlı önizlenir
    await page.click('[data-act="sample"]');
    await until(page, () => document.querySelectorAll("#fields .tf-chip").length >= 9);
    assert.match(await text(page, "#fieldsSummary"), /\d+ sabit alan korunacak/);
    const chips = await text(page, "#fields");
    for (const v of ["12.500 TL", "15 Mart 2026", "Ayşe Hanım", "%15", "14:30", "ayse.demir@ornek-ajans.com"]) assert.ok(chips.includes(v), "çip: " + v);

    // 2) Tüm işlemler, ton korunur → fark, sabit alan denetimi
    for (const op of ["sadelestir", "kisalt", "bicim"]) await page.click(`[data-op="${op}"]`);
    assert.equal(await page.locator(".tf-toggle.is-on").count(), 4);
    await page.click("#runBtn");
    await toastHas(page, /değişiklik · sabit alan (\d+)\/\1 korundu/);
    assert.ok(await page.locator("#resBody ins.tf-ins").count() >= 3);
    assert.ok(await page.locator("#resBody del.tf-del").count() >= 3);
    assert.match(await text(page, "#keepBadge"), /Sabit alan (\d+)\/\1 korundu/);
    assert.match(await text(page, "#resStats"), /karakter/);
    await shot(page, "masaustu-01-fark-gorunumu.png");
    await page.click('[data-tab="changes"]');
    const chg = await text(page, "#resBody");
    assert.match(chg, /Herkez→Herkes/);
    assert.match(chg, /akabinde.*ardından/s);
    assert.match(chg, /satır içi sayım → liste/);
    await shot(page, "masaustu-02-degisiklikler.png");
    await page.click('[data-tab="out"]');
    const out1 = await text(page, "#resBody .tf-out");
    assert.match(out1, /Herkes bu konuda hemfikir!/);
    assert.match(out1, /• İmzalı form/);
    assert.match(out1, /uyguluyor/);

    // 3) Ton örneği: samimi örnek → örnekten çıkan üslup, kopyala (gerçek pano)
    await page.click('[data-tone="ornek"]');
    assert.ok(await page.isVisible("#sampleBox"));
    await page.fill("#toneSample", "Selam! Yarın uğrarım, görüşürüz 😀 Teşekkürler!");
    await until(page, () => /Samimi/.test(document.getElementById("toneProfile").textContent));
    await page.click("#runBtn");
    await toastHas(page, /korundu/);
    assert.match(await text(page, "#resStats"), /Samimi.*örnekten/s);
    await page.click('[data-tab="diff"]');
    await shot(page, "masaustu-03-ton-ornegi.png");
    await page.click('[data-tab="out"]');
    const out2 = await text(page, "#resBody .tf-out");
    await page.click("#copyBtn");
    await toastHas(page, /Panoya kopyalandı/);
    assert.equal(await clipRead(app), out2, "pano sonuçla aynı olmalı");
    await page.click("#copyHideBtn");
    await toastHas(page, /Panoya kopyalandı/);
    assert.equal(readLog("hidden.txt").trim(), "1", "kopyala ve küçült");

    // 4) Pano: parola benzeri metin alınmaz; gizli bilgili metin Ctrl+Shift+Y işleviyle gelir
    const before = await page.inputValue("#input");
    await clipWrite(app, "Gz7!kq9Lm#2026");
    await page.click('[data-act="clip"]');
    await toastHas(page, /parola ya da anahtar gibi görünüyor/);
    assert.equal(await page.inputValue("#input"), before);
    const secretText = "selam kanka, kart numaram 4111 1111 1111 1111 şifre: Abc123!xyz yarın 10:00'da Ankara'da olurum, gelirim!!";
    await clipWrite(app, secretText);
    await app.evaluate(() => global.__tfQuick());
    await toastHas(page, /Panodan alındı/);
    assert.equal(await page.inputValue("#input"), secretText);
    assert.ok(await page.isVisible("#sensWarn"));
    assert.match(await text(page, "#sensWarn"), /gizli bilgi var: .*kart no.*gizli değer|gizli değer.*kart no/);
    assert.equal(await page.locator("#fields .tf-chip.is-secret").count(), 2);
    assert.ok(!(await text(page, "#fields")).includes("4111 1111 1111 1111"), "gizli değer ekranda maskelenir");
    await page.click('[data-tone="resmi"]');
    await page.click("#runBtn");
    await toastHas(page, /korundu/);
    await page.click('[data-tab="out"]');
    const out3 = await text(page, "#resBody .tf-out");
    assert.ok(out3.includes("4111 1111 1111 1111") && out3.includes("Abc123!xyz") && out3.includes("10:00"), "gizli ve sabit değerler aynen kalmalı");
    assert.match(out3, /^Merhaba, kart numaram/);
    await page.click('[data-tab="diff"]');
    await shot(page, "masaustu-04-gizli-veri-korumasi.png");

    // 5) MyMind: anahtar yokken diyalog; red; onaylı istek (sabit alan değerleri gitmez); eksik sabit alan uyarısı
    await page.click("#aiBtn");
    await until(page, () => document.getElementById("mymindDialog").open);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await until(page, () => document.getElementById("mymindState").textContent === "Bağlı");
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0, "reddedilen onayda Hub'a istek gitmemeli");
    setFile("deny.txt", "0");
    await page.click("#aiBtn");
    await toastHas(page, /2 MyMind alternatifi hazır — 1 alternatifte sabit alan eksik/);
    const approvals = readLog("approvals.txt");
    assert.match(approvals, /sabit alan .*⟦n⟧ yer tutucusuyla — değerleri gönderilmez/);
    assert.match(approvals, /Gizli değerler \(.*kart no.*\) gönderilmez/);
    const sent = readLog("mymind-sent.json").trim().split("\n").pop();
    for (const v of ["4111", "Abc123!xyz", "10:00", "Ankara", KEY]) assert.ok(!sent.includes(v), v + " MyMind'a gitmemeli");
    assert.ok(sent.includes("⟦1⟧"));
    assert.equal(await page.locator(".tf-alt").count(), 2);
    assert.equal(await page.locator(".tf-alt.is-unsafe").count(), 1);
    assert.match(await text(page, ".tf-alt.is-unsafe .tf-missing"), /Eksik sabit alan/);
    await shot(page, "masaustu-05-mymind-alternatifler.png");
    await page.click('.tf-alt:not(.is-unsafe) >> text="Kullan"');
    await toastHas(page, /Alternatif 1 seçildi/);
    assert.match(await text(page, "#keepBadge"), /korundu/);
    await page.click("#copyBtn");
    await toastHas(page, /Panoya kopyalandı/);
    assert.match(await clipRead(app), /orada olacağım/);

    // 6) Dosya (.txt, UTF-8 BOM) ve terim sözlüğü
    const txt = path.join(testDir, "not.txt");
    fs.writeFileSync(txt, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("text forge ile yazdım , son derece hızlı.", "utf8")]));
    setFile("pick.txt", txt);
    await page.click('[data-act="openFile"]');
    await toastHas(page, /not\.txt.*açıldı/);
    assert.equal(await page.inputValue("#input"), "text forge ile yazdım , son derece hızlı.");
    await page.click('[data-nav="settings"]');
    await page.fill("#termInput", "text forge");
    await page.click('#termForm button[type="submit"]');
    await toastHas(page, /sözlüğe eklendi/);
    await page.click('[data-nav="forge"]');
    await until(page, () => /sözlük terimi/.test(document.getElementById("fields").textContent));
    await page.click('[data-tone="koru"]');
    await page.click("#runBtn");
    await toastHas(page, /korundu/);
    await page.click('[data-tab="out"]');
    assert.equal(await text(page, "#resBody .tf-out"), "text forge ile yazdım, çok hızlı.");

    // 7) Geçmiş ve ölçüler
    await page.click('[data-nav="history"]');
    assert.ok(await page.locator(".tf-histrow").count() >= 6);
    assert.ok(await page.locator('.tf-histrow:has-text("MyMind")').count() >= 2);
    assert.ok(await page.locator('.tf-histrow:has-text("kullanıldı")').count() >= 2);
    await shot(page, "masaustu-06-gecmis.png");
    await page.fill("#histSearch", "orada olacağım");
    await until(page, () => document.querySelectorAll(".tf-histrow").length >= 1 && document.querySelectorAll(".tf-histrow").length <= 2);
    await page.fill("#histSearch", "");
    await page.click('[data-nav="settings"]');
    const metrics = await text(page, "#metrics");
    assert.match(metrics, /sabit alan koruma/);
    assert.match(metrics, /öneri kullanma \(\d+\/\d+\)/);
    await shot(page, "masaustu-07-sozluk-ayarlar-olculer.png");
    const st = await state(page);
    report.stats = st.stats;
    report.vault = st.vault;
    assert.equal(st.stats.localProtection, 100, "yerel koruma %100");
    assert.ok(st.stats.aiProtection < 100, "eksik alternatif ölçüye girer");
    assert.equal(st.stats.secretsBlocked, 1);
    assert.equal(st.stats.aiRuns, 1);
    assert.deepEqual(st.settings.glossary, ["text forge"]);
    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    await app.close();

    // 8) Yeniden açılış: geçmiş, sözlük, son işlem/ton seçimi kalıcı; anahtar diske düz yazılmaz
    const files = fs.readdirSync(userData);
    report.files = files.filter((f) => /atolye|mymind/.test(f));
    const plain = files.includes("atolye.json") ? fs.readFileSync(path.join(userData, "atolye.json"), "utf8") : "";
    if (st.vault) assert.ok(files.includes("atolye.bin") && !files.includes("atolye.json"), "kasa varken düz dosya olmamalı");
    assert.ok(!plain.includes(KEY), "anahtar düz kayıtta olmamalı");
    ({ app, page, violations } = await launch(port));
    const st2 = await state(page);
    assert.equal(st2.history.length, st.history.length);
    assert.deepEqual(st2.settings.glossary, ["text forge"]);
    assert.equal(st2.settings.tone, "koru");
    assert.equal(st2.settings.ops.bicim, true);
    assert.equal(await page.locator(".tf-toggle.is-on").count(), 4);
    assert.deepEqual(violations, []);
    console.log(JSON.stringify(report));
    console.log("DUMAN TESTİ GEÇTİ: Text Forge (" + process.platform + ") — örnek + tüm işlemler, fark/değişiklikler, ton örneği, gerçek pano (kopyala, parola reddi, hızlı pencere), gizli veri koruması, MyMind (onay, red, sabit alan değerleri gitmez, eksik alan uyarısı), .txt, sözlük, geçmiş, ölçüler, kalıcılık");
  } catch (e) {
    console.error("DUMAN TESTİ BAŞARISIZ:", e);
    if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await app.close().catch(() => {});
    server.close();
  }
})();
