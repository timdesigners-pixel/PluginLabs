// Masaüstü duman testi: gerçek Electron penceresi, gerçek dosya sistemi denetimi (geçici örnek klasör), gerçek kalıcılık ve yeniden açılış;
// MyMind için taklit Hub. TEST kipinde klasör/uygulama/dosya seçimi ve onaylar dosyalardan gelir; "açma" ve kısayol günlüğe yazılır
// (CI'da gerçek uygulama/tarayıcı başlatılmaz). Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ws-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ws-test-"));
const work = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ws-work-")), "Projeler");
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const clearLog = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

// Örnek çalışma alanı (test verisi): proje klasörü, "uygulama" (.exe adı taşıyan sahte dosya; TEST kipinde başlatılmaz), notlar.
const proj = path.join(work, "pluginlabs-site");
const appExe = path.join(work, "Araclar", "Code.exe");
const notes = path.join(work, "notlar", "sprint-plani.md");
const gone = path.join(work, "notlar", "eski-gundem.md");
for (const [f, d] of [[path.join(proj, "README.md"), "# site"], [appExe, "MZ sahte"], [notes, "# Sprint"], [gone, "# eski"]]) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, d); }

// Taklit Hub: /v1/chat/completions; anahtar doğrulanır. Bir geçerli bağlantı, bir zararlı bağlantı ve bir klasör önerisi döner.
let hubCalls = 0;
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content = "```json\n" + JSON.stringify({ sahne: "Web sitesi geliştirme", oneriler: [
      { tur: "url", ad: "Can I use", url: "https://caniuse.com/", gerekce: "Tarayıcı uyumluluğunu denetlemek için" },
      { tur: "url", ad: "Kötü", url: "javascript:alert(1)" },
      { tur: "klasor", ad: "Tasarım varlıkları", gerekce: "Görselleri hızlı bulmak için" },
    ] }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function launch(port, extra) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : []), ...(extra || [])],
    env: { ...process.env, WS_USER_DATA: userData, WS_TEST_DIR: testDir, WS_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1180, height: 760 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name, previewBottom) => { if (shots) { await page.evaluate(() => { document.getElementById("toasts").replaceChildren(); for (const id of ["editor", "preview"]) document.getElementById(id).scrollTop = 0; });
    if (previewBottom) await page.evaluate(() => { const p = document.getElementById("preview"); p.scrollTop = p.scrollHeight; });
    fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
async function until(page, fn, arg, tries = 400) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const itemLabels = (page) => page.$$eval("#items .ws-item .ws-item__label", (n) => n.map((x) => x.value));
const planLabels = (page) => page.$$eval("#plan li .ws-plan__t > span", (n) => n.map((x) => x.textContent));
const openedLines = () => readLog("opened.txt").trim().split("\n").filter(Boolean);

(async () => {
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const port = hub.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Workspace Scenes");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.wsDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await page.textContent(".ws-brand"), /PluginLabs\s*APPS/);
    assert.match(await page.textContent(".ws-product"), /Workspace Scenes.*Sahne başlatıcı.*26/s);
    assert.match(await page.textContent("#editor"), /Çalışma ortamınızı tek tıkla kurun/);
    await shot(page, "masaustu-00-karsilama.png");

    // 1) Şablondan sahne: Yazılım geliştirme (3 bağlantı) → kurala dayalı eksik araç önerileri (klasör, uygulama)
    await page.click(".ws-tpl:nth-child(2)");
    await toastHas(page, /şablondan oluşturuldu/);
    assert.equal(await page.inputValue("#sceneName"), "Yazılım geliştirme");
    assert.deepEqual(await itemLabels(page), ["GitHub", "MDN Web Docs", "Stack Overflow"]);
    const sugg = await page.textContent("#suggestions");
    assert.match(sugg, /Proje klasörü.*Sahnede hiç klasör yok/s);
    assert.match(sugg, /Kod düzenleyici/);
    await page.fill("#sceneName", "PluginLabs web sitesi");
    await page.press("#sceneName", "Enter");
    await until(page, () => /PluginLabs web sitesi/.test(document.getElementById("sceneList").textContent));
    await page.fill("#scenePurpose", "Yazılım geliştirme: site, belgeler ve sprint planı");
    await page.press("#scenePurpose", "Tab");

    // 2) Klasör / uygulama / dosya seçimi (gerçek yol doğrulaması), bağlantı diyaloğu, çoklu yapıştırma
    setFile("pick-folder.txt", proj);
    await page.click("#addFolder");
    await toastHas(page, /“pluginlabs-site” eklendi/);
    setFile("pick-app.txt", appExe);
    await page.click("#addApp");
    await toastHas(page, /“Code” eklendi/);
    setFile("pick-file.txt", notes);
    await page.click("#addFile");
    await toastHas(page, /sprint-plani\.md/);
    await page.click("#addUrl");
    await page.fill("#urlInput", "javascript:alert(1)");
    await page.click("#urlOk");
    await toastHas(page, /yalnız http/);
    await page.fill("#urlInput", "localhost:5173");
    await page.click("#urlOk");
    await toastHas(page, /yalnız http|başarısız/);
    await page.fill("#urlInput", "http://localhost:5173/");
    await page.fill("#urlLabel", "Yerel önizleme");
    await page.click("#urlOk");
    await toastHas(page, /Yerel önizleme/);
    await page.click("#pasteUrls");
    await page.fill("#pasteInput", "Sprint panosu - https://github.com/orgs/pluginlabs/projects/1\nhttps://github.com/orgs/pluginlabs/projects/1\n[Tasarım dosyası](https://www.figma.com/files/team)\nbu satır bağlantı değil");
    await page.click("#pasteOk");
    await toastHas(page, /2 bağlantı eklendi/);
    assert.deepEqual(await itemLabels(page), ["GitHub", "MDN Web Docs", "Stack Overflow", "pluginlabs-site", "Code", "sprint-plani.md", "Yerel önizleme", "Sprint panosu", "Tasarım dosyası"]);
    assert.doesNotMatch(await page.textContent("#suggestions"), /Sahnede hiç klasör yok/);

    // 3) Düzenleme: argüman, ad, sıra (klasörü başa), açılıştan çıkarma, sahneden çıkarıp geri alma
    await page.fill('#items .ws-item:nth-child(5) .ws-item__args', '"' + proj + '" --new-window');
    await page.press('#items .ws-item:nth-child(5) .ws-item__args', "Tab");
    for (let i = 0; i < 3; i++) { await page.click('#items .ws-item:nth-child(' + (4 - i) + ') [aria-label="Yukarı taşı"]'); await page.waitForTimeout(120); }
    assert.equal((await itemLabels(page))[0], "pluginlabs-site");
    await page.click('#items .ws-item:nth-child(4) input[type="checkbox"]'); // Stack Overflow açılışa dahil değil
    await until(page, () => document.querySelectorAll("#plan li").length === 8);
    await page.click('#items .ws-item:nth-child(3) [aria-label="Sahneden çıkar"]'); // MDN
    await toastHas(page, /sahneden çıkarıldı/);
    await page.click(".pl-toast__action");
    await until(page, () => document.querySelectorAll("#items .ws-item").length === 9);
    assert.deepEqual(await planLabels(page), ["pluginlabs-site", "GitHub", "MDN Web Docs", "Code", "sprint-plani.md", "Yerel önizleme", "Sprint panosu", "Tasarım dosyası"]);
    await page.selectOption("#sceneDelay", "300");
    await shot(page, "masaustu-01-sahne.png");

    // 4) Denetle: eksik dosya (diskten kaldırılmış) işaretlenir
    setFile("pick-file.txt", gone);
    await page.click("#addFile");
    await toastHas(page, /eski-gundem\.md/);
    fs.rmSync(gone);
    await page.click("#checkBtn");
    await toastHas(page, /1 öğe bulunamadı/);
    assert.match(await page.textContent("#plan"), /eski-gundem\.md.*Bulunamadı.*Eksik/s);

    // 5) Ret: hiçbir şey açılmaz
    setFile("deny.txt", "1");
    await page.click("#launchBtn");
    await toastHas(page, /onay verilmedi/);
    assert.equal(openedLines().length, 0);
    setFile("deny.txt", "0");

    // 6) Aç (Ctrl+Enter): onay metni dizinin tamamını ve "kapatılmaz" notunu gösterir; sıra korunur; eksik dosya raporlanır
    clearLog("approvals.txt");
    await page.click("#sceneName");
    await page.keyboard.press("Control+Enter");
    await toastHas(page, /8 öğe açıldı, 1 öğe açılamadı/);
    const appr = readLog("approvals.txt");
    assert.match(appr, /9 öğe, adımlar arası 0,3 sn/);
    assert.match(appr, /1\. Klasör — pluginlabs-site/);
    assert.ok(appr.includes(appExe), "onayda tam hedef yolu gösterilmeli");
    assert.match(appr, /kapatılmaz/);
    assert.doesNotMatch(appr, /Stack Overflow/, "açılıştan çıkarılan öğe onayda olmamalı");
    const opened = openedLines();
    assert.deepEqual(opened.map((l) => l.split("\t")[0]), ["folder", "url", "url", "app", "file", "url", "url", "url"]);
    assert.equal(opened[0].split("\t")[1], proj);
    assert.equal(opened[3], "app\t" + appExe + '\t"' + proj + '" --new-window');
    assert.equal(opened[5].split("\t")[1], "http://localhost:5173/");
    assert.match(await page.textContent("#plan"), /eski-gundem\.md.*Açılamadı/s);
    assert.match(await page.textContent("#timing"), /1\s*açılış/);
    report.firstRun = (await page.textContent("#timing")).replace(/\s+/g, " ");
    await page.click('#items .ws-item:nth-child(10) [aria-label="Sahneden çıkar"]');
    await toastHas(page, /çıkarıldı/);
    // Elle kurulum süresi → azalma yüzdesi (doğrulama ölçütü ≥ %60)
    await page.fill("#manualMin", "4");
    await page.press("#manualMin", "Tab");
    await until(page, () => /daha hızlı/.test(document.getElementById("timing").textContent));
    assert.match(await page.textContent("#timing"), /%\d+ daha hızlı/);
    await page.evaluate(() => document.getElementById("toasts").replaceChildren());
    await shot(page, "masaustu-02-acilis-sonucu.png");

    // 7) MyMind: anahtar → onay ayrıntısında yol/tam adres yok → doğrulanmış öneriler (zararlı bağlantı elenir) → Ekle
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await until(page, () => document.getElementById("mymindState").textContent === "Bağlı");
    clearLog("approvals.txt");
    await page.click("#askBtn");
    await toastHas(page, /MyMind 2 öneri verdi \(1 geçersiz öneri elendi\)/);
    const mapr = readLog("approvals.txt");
    const sent = readLog("mymind-sent.json");
    for (const secret of [proj, appExe, notes, "--new-window", "projects/1", "5173/"]) {
      assert.ok(!mapr.includes(secret) && !sent.includes(secret.replace(/\\/g, "\\\\")) && !sent.includes(secret), "gönderilmemeli: " + secret);
    }
    assert.match(sent, /github\.com/);
    assert.equal(hubCalls, 1);
    const s2 = await page.textContent("#suggestions");
    assert.match(s2, /MyMind · Tarayıcı uyumluluğunu/);
    assert.match(s2, /Tasarım varlıkları/);
    assert.doesNotMatch(s2, /Kötü/);
    await shot(page, "masaustu-03-mymind-oneri.png", true);
    await page.click("#suggestions .ws-sugg:nth-of-type(1) .pl-btn");
    await toastHas(page, /“Can I use” eklendi/);
    assert.ok((await itemLabels(page)).includes("Can I use"));

    // 8) Masaüstü kısayolu (TEST kipinde günlüğe), kopya, arşiv + geri al
    await page.click("#shortcutBtn");
    await toastHas(page, /Kısayol oluşturuldu/);
    const sc = readLog("shortcuts.txt");
    assert.match(sc, /PluginLabs web sitesi \(Workspace Scenes\)\.lnk\t.+\t--sahne=[a-z0-9]{6,24}/);
    const sceneId = /--sahne=([a-z0-9]+)/.exec(sc)[1];
    await page.click("#archiveBtn");
    await toastHas(page, /arşivlendi \(silinmedi\)/);
    await page.click(".pl-toast__action");
    await until(page, () => /PluginLabs web sitesi/.test(document.getElementById("sceneList").textContent));

    // 9) Ayarlar ve yedek
    await page.click('[data-nav="settings"]');
    assert.match(await page.textContent("#privacy"), /hiçbir kod yolu uygulama, pencere, sekme ya da işlem kapatmaz/);
    await shot(page, "masaustu-04-ayarlar.png");
    await page.click("#exportBtn");
    await toastHas(page, /1 sahne dışa aktarıldı/);
    const backup = fs.readFileSync(path.join(testDir, "yedek.json"), "utf8");
    assert.match(backup, /pluginlabs-workspace-scenes/);
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    await app.close();

    // 10) Masaüstü kısayolu gibi --sahne=<kimlik> ile açılış: önce onay istenir, sonra açılır; sahneler kalıcı (kasa varsa şifreli)
    clearLog("approvals.txt");
    clearLog("opened.txt");
    ({ app, page, violations } = await launch(port, ["--sahne=" + sceneId]));
    await toastHas(page, /Sahne açıldı: 9 öğe/);
    assert.match(readLog("approvals.txt"), /“PluginLabs web sitesi” sahnesi/);
    assert.equal(openedLines().length, 9);
    const files = fs.readdirSync(userData);
    report.vault = files.includes("sahneler.bin");
    if (report.vault) assert.ok(!fs.readFileSync(path.join(userData, "sahneler.bin")).includes(Buffer.from("pluginlabs-site")), "şifreli kayıt düz metin içermemeli");
    else assert.ok(files.includes("sahneler.json"));
    assert.match(await page.textContent("#timing"), /2\s*açılış/);
    // İçe aktarma: yedekteki sahne yeni kimlikle eklenir, mevcut silinmez
    setFile("import.txt", path.join(testDir, "yedek.json"));
    await page.click('[data-nav="settings"]');
    await page.click("#importBtn");
    await toastHas(page, /1 sahne içe aktarıldı/);
    const st = await page.evaluate(() => window.wsDesktop.state());
    assert.equal(st.scenes.length, 2);
    assert.notEqual(st.scenes[0].id, st.scenes[1].id);
    assert.equal(st.scenes[1].launches.length, 0);
    // Hiçbir örnek dosya değişmedi ya da silinmedi (eski-gundem.md'yi test kendisi kaldırdı)
    for (const f of [path.join(proj, "README.md"), appExe, notes]) assert.ok(fs.existsSync(f), f);
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    hub.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
