// Masaüstü duman testi: gerçek Electron penceresi + gerçek yalıtılmış denetim penceresi (axe-core). Boş başlangıç, izin reddi, örnek
// fixture'lar (bilinen sorunlarda doğru bulgu %100, kritik yanlış olumlu %0), bulgu seçince öğe vurgulu ekran görüntüsü, manuel kontrol,
// odak sırası (pozitif tabindex uyarısı), yapı (başlık düzeyi atlama), yerel HTTP sayfası: onay reddi → istek yok, onay → denetim; sayfa
// betikleri açık/kapalı (betikle eklenen öğe yalnız açıkken denetlenir), bağlantılar izlenmez, çerez gönderilmez; yeniden denetimde
// giderilen bulgu; HTML yapıştırma; .html dosyası (uzak kaynak ayar kapalıyken yüklenmez; dosya değişmez); yanlış olumlu işareti; rapor
// (Markdown/JSON/CSV); MyMind (taklit Hub: anahtar, red, onay; adres ve e-posta gönderilmez; sertifika iddiası atılır); arşiv/geri alma;
// ölçüler; yerel model (loopback; dış adres reddi); kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "al-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "al-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-07T12:00:00";

const req = { log: [], fixed: false };
const page = (fixed) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Yerel test sayfası</title><link rel="stylesheet" href="/stil.css"></head>
<body><main><h1>Mağaza</h1><p class="${fixed ? "iyi" : "soluk"}">Kampanya 30 Kasım'a kadar sürer. İletişim: destek@ornek.com</p>
<label for="ara">Ara</label><input id="ara"><a href="/baska-sayfa">Diğer sayfa</a><div id="kok"></div>
<script>document.getElementById("kok").innerHTML = '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" width="40" height="40" class="betik-gorsel">';</script></main></body></html>`;
const server = http.createServer((rq, res) => {
  let body = "";
  rq.on("data", (c) => (body += c));
  rq.on("end", () => {
    if (rq.url === "/v1/chat/completions") {
      req.hub = (req.hub || 0) + 1;
      const j = JSON.parse(body || "{}");
      const ok = rq.headers.authorization === "Bearer " + KEY || (!rq.headers.authorization && j.model === "test-model");
      const content = "```json\n" + JSON.stringify({ aciklama: "Metin rengi arka planla yeterince ayrışmıyor; az gören kullanıcılar okumakta zorlanır. Bunu düzeltince sayfa tamamen erişilebilir olur.", duzeltme: "Metin rengini #595959 gibi daha koyu bir tona çekin (oran en az 4.5:1).", ornek: ".soluk { color: #595959; }" }) + "\n```";
      res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
    }
    req.log.push({ url: rq.url, cookie: rq.headers.cookie || "" });
    if (rq.url === "/sayfa") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": "oturum=gizli123; Path=/" }); return res.end(page(req.fixed)); }
    if (rq.url === "/stil.css") { res.writeHead(200, { "Content-Type": "text/css" }); return res.end("body{font:16px sans-serif;background:#fff;color:#222}.soluk{color:#b0b0b0}.iyi{color:#333}"); }
    res.writeHead(404); res.end("yok");
  });
});

const htmlPath = path.join(testDir, "bilesen.html");
fs.writeFileSync(htmlPath, '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Bileşen</title></head><body><main><h1>Kart</h1><img src="REMOTE/izleme.gif" alt="İzleme pikseli"><button></button></main></body></html>');

async function until(pg, fn, arg, tries = 900) {
  for (let i = 0; i < tries; i++) { if (await pg.evaluate(fn, arg)) return; await pg.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, AL_USER_DATA: userData, AL_TEST_DIR: testDir, AL_HUB_URL: "http://127.0.0.1:" + port, AL_NOW: NOW } });
  const pg = await app.firstWindow();
  const violations = [];
  pg.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  pg.on("pageerror", (e) => violations.push(String(e)));
  await pg.waitForLoadState("domcontentloaded");
  await pg.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(pg, () => document.documentElement.dataset.ready === "1");
  return { app, page: pg, violations };
}
const shot = async (pg, name) => { if (shots) { await pg.evaluate(() => document.getElementById("toasts").replaceChildren()); fs.mkdirSync(shots, { recursive: true }); await pg.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (pg, re) => until(pg, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (pg) => pg.evaluate(() => window.alDesktop.state());
const text = (pg, sel) => pg.textContent(sel);
const nav = (pg, v) => pg.click(`[data-nav="${v}"]`);
const tab = (pg, t) => pg.click(`[data-tab="${t}"]`);
const pickFinding = async (pg, rule) => { await pg.click(`#leftList .al-fitem[data-key^="${rule}|"]`); await pg.waitForSelector("#showBtn"); };
const openHistory = async (pg, re) => { await nav(pg, "history"); const id = (await state(pg)).audits.find((a) => re.test(a.title || "") && a.status === "tamam").id; await pg.click(`#histList [data-id="${id}"]`); await until(pg, (i) => !document.getElementById("view-audit").hidden, null); return id; };
const readOut = (f) => fs.readFileSync(path.join(testDir, f), "utf8");

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const base = "http://127.0.0.1:" + port;
  fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, "utf8").replace("REMOTE", base));
  const before = sha(htmlPath);
  let { app, page: pg, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await pg.title(), "Access Lens");
    assert.equal(await pg.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(pg, ".al-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(pg, ".al-product"), /Access Lens.*Erişilebilirlik.*43/s);
    assert.equal(await pg.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await pg.isVisible("#emptyPanel"));
    const perm = await pg.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    await shot(pg, "masaustu-00-baslangic.png");

    // 1) Örnek fixture'lar: bilinen sorunlarda doğru bulgu, kritik yanlış olumlu
    await pg.click('#emptyPanel [data-act="samples"]');
    await toastHas(pg, /3 örnek sayfa denetlendi/);
    let s = await state(pg);
    const fx = s.metrics.fixture;
    assert.equal(fx.pages, 3);
    assert.equal(fx.expected, 17);
    assert.equal(fx.tp, 17);
    assert.equal(fx.fp, 0);
    assert.equal(fx.critFpRate, 0);
    report.fixture = fx;
    assert.equal(s.active.target.fixture, "kayit-formu");
    assert.match(s.active.engine.version, /^4\.\d+\.\d+$/);
    assert.match(await text(pg, "#auditHead"), /WCAG 2\.2 A \+ AA \+ en iyi uygulamalar.*axe-core 4\./s);
    assert.match(await text(pg, "#chips"), /4\s*Kritik.*4\s*Ciddi.*1\s*Orta/s);
    assert.match(await text(pg, "#fixtureEval"), /9\/9 beklenen bulgu yakalandı, 0 beklenmeyen/);
    assert.match(await text(pg, "#auditHead"), /sertifikası ya da uygunluk beyanı değildir/);
    await pickFinding(pg, "color-contrast");
    assert.match(await text(pg, "#rightDetail"), /Metin ile arka plan arasındaki kontrast yetersiz.*1\.4\.3 · düzey AA/s);
    assert.match(await text(pg, "#summaryText"), /contrast/i);
    await pg.click("#showBtn");
    await until(pg, () => document.querySelector("#shot") && document.querySelector("#shot").dataset.ready === "1");
    const box = await pg.evaluate(() => { const b = document.querySelector(".al-box").getBoundingClientRect(); return { w: b.width, h: b.height }; });
    assert.ok(box.w > 50 && box.h > 5, "vurgu kutusu çizildi");
    await shot(pg, "masaustu-01-bulgu-ve-oge.png");

    // 2) Odak sırası ve yapı
    await tab(pg, "focus");
    await until(pg, () => document.querySelectorAll("#leftList .al-focus").length > 3);
    assert.match(await text(pg, '#leftList .al-focus[data-n="1"]'), /İletişim.*tabindex=3/s);
    await pg.click('#leftList .al-focus[data-n="1"]');
    await pg.click("#showBtn");
    await until(pg, () => document.querySelector("#shot") && document.querySelector("#shot").dataset.ready === "1");
    await shot(pg, "masaustu-02-odak-sirasi.png");
    await tab(pg, "outline");
    assert.match(await text(pg, "#leftList"), /H1 · Atölye kayıt formu.*H3 · Kişisel bilgiler.*düzey atlandı/s);
    await openHistory(pg, /Ürün kartı/);
    await tab(pg, "manual");
    assert.match(await text(pg, "#leftList"), /kontrast/);
    await tab(pg, "findings");

    // 3) Yerel HTTP sayfası: red → istek yok; onay → denetim; betikler açık (betikle eklenen görsel denetlenir); bağlantı izlenmez; çerez yok
    await nav(pg, "audit");
    await pg.fill("#urlInput", "javascript:alert(1)");
    await pg.click("#urlBtn");
    await toastHas(pg, /Adres anlaşılamadı/);
    await pg.fill("#urlInput", base + "/sayfa");
    setFile("deny.txt", "1");
    await pg.click("#urlBtn");
    await toastHas(pg, /Sayfa açılmadı \(onay verilmedi\)/);
    assert.equal(req.log.length, 0, "onaysız istek yok");
    rmFile("deny.txt");
    await pg.click("#urlBtn");
    await toastHas(pg, /bulgu bulundu/);
    assert.match(readLog("approvals.txt"), /Bu sayfa denetim için açılsın mı\?[\s\S]*127\.0\.0\.1[\s\S]*çalışır/);
    s = await state(pg);
    assert.equal(s.active.finalUrl, base + "/sayfa");
    const rules1 = s.active.findings.map((f) => f.ruleId);
    assert.ok(rules1.includes("color-contrast"));
    assert.ok(rules1.includes("image-alt"), "betikle eklenen görsel (betikler açık) denetlendi");
    assert.ok(!req.log.some((r) => r.url === "/baska-sayfa"), "bağlantı izlenmez");
    assert.ok(req.log.filter((r) => r.url === "/sayfa").every((r) => !r.cookie), "denetim çerezsiz başlar");
    const ccHtml = s.active.findings.find((f) => f.ruleId === "color-contrast").html;
    assert.ok(!ccHtml.includes("destek@ornek.com") && ccHtml.includes("[e-posta]"), "bulgudaki e-posta maskelenir");

    // 4) Betikler kapalı → betikle eklenen öğe yok; düzeltilmiş sayfa → giderilen bulgu
    await nav(pg, "settings");
    await pg.uncheck("#setScripts");
    await nav(pg, "audit");
    req.fixed = true;
    await pg.click("#rerunBtn");
    await toastHas(pg, /bulgu\./);
    s = await state(pg);
    const rules2 = s.active.findings.map((f) => f.ruleId);
    assert.ok(!rules2.includes("image-alt"), "betikler kapalıyken betik çalışmadı");
    assert.ok(!rules2.includes("color-contrast"), "düzeltilen kontrast");
    assert.equal(s.active.scripts, false);
    assert.ok(req.log.filter((r) => r.url === "/sayfa").length === 2 && req.log.filter((r) => r.url === "/sayfa").every((r) => !r.cookie), "yeniden denetim de yeni (çerezsiz) oturumla başlar");
    assert.equal(s.active.diff.resolved, 2);
    assert.match(await text(pg, "#diffInfo"), /0 yeni, 2 giderildi/);
    await nav(pg, "settings");
    await pg.check("#setScripts");
    await nav(pg, "audit");

    // 5) HTML yapıştırma ve .html dosyası (uzak kaynak kapalıyken yüklenmez; dosya değişmez)
    await pg.click('.al-toolbar [data-act="paste"]');
    await pg.fill("#pasteText", '<html lang="tr"><head><title>Parça</title></head><body><main><h1>Form</h1><input type="text"><a href="#"></a></main></body></html>');
    await pg.click("#pasteRun");
    await toastHas(pg, /bulgu bulundu/);
    s = await state(pg);
    assert.deepEqual(s.active.findings.map((f) => f.ruleId).sort(), ["label", "link-name"]);
    setFile("pick.txt", htmlPath);
    const n0 = req.log.length;
    await pg.evaluate(() => document.getElementById("toasts").replaceChildren());
    await pg.click('.al-toolbar [data-act="file"]');
    await toastHas(pg, /bulgu bulundu/);
    s = await state(pg);
    assert.equal(s.active.target.file, "bilesen.html");
    assert.ok(s.active.findings.some((f) => f.ruleId === "button-name"));
    assert.equal(req.log.length, n0, "yerel dosyadaki uzak kaynak yüklenmedi");
    assert.equal(sha(htmlPath), before);

    // 6) Yanlış olumlu, MyMind, rapor
    await openHistory(pg, /Atölye kayıt formu/);
    await pickFinding(pg, "tabindex");
    await pg.click("#fpBtn");
    await toastHas(pg, /Yanlış olumlu olarak işaretlendi/);
    assert.equal((await state(pg)).active.summary.fp, 1);
    await pickFinding(pg, "color-contrast");
    await pg.click("#aiBtn");
    await toastHas(pg, /Önce MyMind bağlantısı/);
    await pg.click("#openMymind");
    await pg.fill("#mymindKey", "kisa");
    await pg.click("#mymindSave");
    await toastHas(pg, /Anahtar biçimi geçersiz/);
    await pg.fill("#mymindKey", KEY);
    await pg.click("#mymindSave");
    await toastHas(pg, /Anahtar (Windows kasasına kaydedildi|yalnız bu oturum)/);
    assert.ok(!(await pg.content()).includes(KEY));
    setFile("deny.txt", "1");
    await pg.click("#aiBtn");
    await toastHas(pg, /İstek gönderilmedi/);
    assert.ok(!req.hub);
    rmFile("deny.txt");
    await pg.click("#aiBtn");
    await toastHas(pg, /MyMind açıklaması eklendi \(1 iddia atıldı\)/);
    assert.equal(req.hub, 1);
    assert.match(await text(pg, "#aiBox"), /taslak.*#595959.*doğrulayın/s);
    assert.ok(!(await text(pg, "#aiBox")).includes("tamamen erişilebilir"));
    await pg.evaluate(() => document.getElementById("aiBox").scrollIntoView({ block: "end" }));
    await shot(pg, "masaustu-03-mymind-aciklama.png");
    await pg.click("#mdBtn");
    await toastHas(pg, /\.md” kaydedildi/);
    const md = readOut(fs.readdirSync(testDir).find((f) => f.endsWith(".md")));
    assert.match(md, /Kural motoru: axe-core 4\.\d+\.\d+/);
    assert.match(md, /yanlış olumlu işaretli: 1/);
    assert.match(md, /Düzeltme taslağı \(MyMind, doğrulayın\)/);
    await pg.click("#jsonBtn");
    await toastHas(pg, /\.json” kaydedildi/);
    await pg.click("#csvBtn");
    await toastHas(pg, /\.csv” kaydedildi/);
    const sent = readLog("ai-sent.json");
    assert.ok(!sent.includes("127.0.0.1:" + port) && !sent.includes("destek@ornek.com"));

    // 7) Geçmiş, arşiv/geri alma, ölçüler, yerel model
    await nav(pg, "history");
    await until(pg, () => document.querySelectorAll("#histList .al-item").length === 7);
    await shot(pg, "masaustu-04-gecmis.png");
    await openHistory(pg, /Haber listesi/);
    await pg.click("#archiveBtn");
    await toastHas(pg, /arşive alındı/);
    await nav(pg, "history");
    await pg.click('[data-hf="arsiv"]');
    await until(pg, () => document.querySelectorAll("#histList .al-item").length === 1);
    await pg.click("#histList .al-item");
    await pg.click("text=Arşivden geri al");
    await until(pg, () => !/Arşivden geri al/.test(document.getElementById("auditHead").textContent));
    await nav(pg, "settings");
    assert.match(await text(pg, "#metrics"), /%0.*kritik\/ciddi yanlış olumlu.*%100.*doğru bulgu/s);
    await pg.check('input[name="provider"][value="yerel"]');
    await pg.fill("#localUrl", "http://10.0.0.5:1234");
    await pg.click("#saveLocal");
    await toastHas(pg, /yalnız bu bilgisayar olabilir/);
    await pg.fill("#localUrl", base);
    await pg.fill("#localModel", "test-model");
    await pg.click("#saveLocal");
    await toastHas(pg, /Yerel model ayarı kaydedildi/);
    await pg.evaluate(() => { document.getElementById("view-settings").scrollTop = 0; });
    await shot(pg, "masaustu-05-olculer-ayarlar.png");
    s = await state(pg);
    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = s.vault;
    report.requests = req.log.length;
    await app.close();

    // 8) Kalıcılık (sayfa penceresi kapalı → öğe gösterme kapalı)
    ({ app, page: pg, violations } = await launch(port));
    s = await state(pg);
    assert.equal(s.audits.length, 7);
    assert.equal(s.settings.scripts, true);
    assert.equal(s.active.live, false);
    await pickFinding(pg, s.active.findings[0].ruleId);
    assert.ok(await pg.isDisabled("#showBtn"));
    if (s.vault) assert.ok(s.hasKey, "kasa varken anahtar kalıcı");
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify({ ...report, hub: req.hub, platform: process.platform }));
  } catch (err) {
    console.error(err);
    try { if (shots) await pg.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
