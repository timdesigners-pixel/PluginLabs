// Masaüstü duman testi: gerçek Electron penceresi + gerçek yalıtılmış tarama penceresi. Boş başlangıç, izin reddi, 5 örnek sayfa
// (beklenen ana değer kapsaması ≥%90, yakın renk çiftleri birleşir), token seçince kullanım yeri vurgulu ekran görüntüsü, ad doğrulama,
// onaysız dışa aktarma reddi, onay → DTCG JSON / CSS / Markdown (yalnız onaylı tokenlar), yerel HTTP sayfası: onay reddi → istek yok,
// onay → tarama; çerez gönderilmez, bağlantılar izlenmez; sayfa betikleri açık/kapalı (betikle eklenen renk yalnız açıkken), :hover durum
// rengi, sayfa değişkeni adı; HTML yapıştırma; .html dosyası (uzak kaynak ayar kapalıyken yüklenmez; dosya değişmez); yeniden öner
// (ΔE kapalı → daha çok renk); MyMind (taklit Hub: anahtar, red, onay; adres/seçici/metin gönderilmez; geçersiz öneri atılır; değer
// değişmez); arşiv/geri alma; ölçüler; yerel model (loopback; dış adres reddi); kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dts-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "dts-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-08T12:00:00";

const req = { log: [], hub: 0 };
const page = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Yerel mağaza</title><link rel="stylesheet" href="/stil.css"></head>
<body><main><h1>Mağaza</h1><p class="aciklama">Kampanya 30 Kasım'a kadar sürer.</p><p class="aciklama">Kargo ücretsiz.</p>
<a class="dugme" href="/baska-sayfa">Diğer sayfa</a> <a class="dugme" href="/baska">Sepet</a><div id="kok"></div>
<script>document.getElementById("kok").innerHTML = '<p class="betik">Betikle eklendi</p><p class="betik">İkinci</p>';</script></main></body></html>`;
const server = http.createServer((rq, res) => {
  let body = "";
  rq.on("data", (c) => (body += c));
  rq.on("end", () => {
    if (rq.url === "/v1/chat/completions") {
      req.hub++;
      const j = JSON.parse(body || "{}");
      const ok = rq.headers.authorization === "Bearer " + KEY || (!rq.headers.authorization && j.model === "test-model");
      const rows = JSON.parse(j.messages[1].content.replace(/^[^\n]*\n/, ""));
      const root = { color: "color", fontFamily: "font", fontSize: "font", fontWeight: "font", lineHeight: "font", letterSpacing: "font", space: "space", radius: "radius", shadow: "shadow" };
      const oneriler = rows.slice(0, 4).map((r, i) => ({ id: r.id, ad: root[r.tur] + ".oneri.ad-" + (i + 1), neden: "kullanım sıklığına göre" }));
      oneriler.push({ id: rows[4].id, ad: "Geçersiz Ad" }, { id: "t999", ad: "color.yok.ad" }, { id: rows[5].id, ad: (root[rows[5].tur] === "shadow" ? "color" : "shadow") + ".yanlis.tur" });
      const content = "```json\n" + JSON.stringify({ oneriler }) + "\n```";
      res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
    }
    req.log.push({ url: rq.url, cookie: rq.headers.cookie || "" });
    if (rq.url === "/sayfa") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": "oturum=gizli123; Path=/" }); return res.end(page); }
    if (rq.url === "/stil.css") { res.writeHead(200, { "Content-Type": "text/css" }); return res.end(":root{--marka:#7c3aed;--zemin:#fafafa}body{margin:0;padding:24px;font:16px/1.5 Verdana,sans-serif;background:var(--zemin);color:#18181b}h1{font-size:28px;margin:0 0 16px}.aciklama{color:#52525b;margin:0 0 8px}.dugme{display:inline-block;padding:8px 16px;border-radius:8px;background:var(--marka);color:#fff;text-decoration:none}.dugme:hover{background:#6d28d9}.betik{color:#be123c;margin:0}"); }
    res.writeHead(404); res.end("yok");
  });
});

const htmlPath = path.join(testDir, "bilesen.html");
fs.writeFileSync(htmlPath, '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Bileşen</title><style>body{margin:0;padding:12px;color:#0c4a6e;background:#f0f9ff;font:15px Tahoma,sans-serif}.k{padding:12px;border:1px solid #bae6fd;border-radius:12px;margin-bottom:12px}</style></head><body><div class="k">Bir</div><div class="k">İki</div><img src="REMOTE/izleme.gif" alt="İzleme pikseli"></body></html>');

async function until(pg, fn, arg, tries = 1200) {
  for (let i = 0; i < tries; i++) { if (await pg.evaluate(fn, arg)) return; await pg.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, DTS_USER_DATA: userData, DTS_TEST_DIR: testDir, DTS_HUB_URL: "http://127.0.0.1:" + port, DTS_NOW: NOW } });
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
const clearToast = (pg) => pg.evaluate(() => document.getElementById("toasts").replaceChildren());
const state = (pg) => pg.evaluate(() => window.dtsDesktop.state());
const text = (pg, sel) => pg.textContent(sel);
const nav = (pg, v) => pg.click(`[data-nav="${v}"]`);
const tab = (pg, t) => pg.click(`[data-tab="${t}"]`);
const pick = async (pg, s, name) => { const t = s.active.tokens.find((x) => x.name === name); assert.ok(t, "token yok: " + name); await pg.click(`#leftList .dt-titem[data-id="${t.id}"] .dt-tname`); await pg.waitForSelector("#nameInput"); return t; };
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
    assert.equal(await pg.title(), "Design Token Scout");
    assert.equal(await pg.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(pg, ".dt-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(pg, ".dt-product"), /Design Token Scout.*Tasarım tokenları.*44/s);
    assert.equal(await pg.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await pg.isVisible("#emptyPanel"));
    const perm = await pg.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    await shot(pg, "masaustu-00-baslangic.png");

    // 1) Örnek sayfalar: beklenen ana değer kapsaması ve yakın renk çiftleri
    await pg.click('#emptyPanel [data-act="samples"]');
    await toastHas(pg, /5 örnek sayfa tarandı/);
    let s = await state(pg);
    const fx = s.metrics.fixture;
    assert.equal(fx.pages, 5);
    assert.equal(fx.expected, 91);
    assert.ok(fx.coverage >= 90, "örneklerde kapsama ≥%90: " + fx.coverage);
    assert.ok(fx.minPage >= 90, "her sayfada ≥%90: " + fx.minPage);
    assert.equal(fx.merged, fx.pairs);
    assert.ok(fx.reduction > 0, "tekrar düşüşü olmalı");
    report.fixture = fx;
    const a0 = s.active;
    assert.equal(a0.target.fixture, "kafe-menusu");
    assert.equal(a0.fixtureEval.coverage, 100);
    assert.match(await text(pg, "#fixtureEval"), /18\/18 beklenen ana değer önerilerde \(%100\).*1 yakın renk çiftinin 1'i birleşti/s);
    assert.match(await text(pg, "#chips"), /ham değer.*önerilen token.*tekrar düşüşü.*8 px\s*boşluk ızgarası/s);
    assert.match(await text(pg, "#scanHead"), /Erişiminiz ve kullanım hakkınız olan/);
    const names = Object.fromEntries(a0.aliases.map((x) => [x.name, a0.tokens.find((t) => t.id === x.ref).name]));
    assert.equal(names["color.text.default"], "color.kahve");
    assert.equal(names["color.surface.default"], "color.krem");
    assert.equal(names["color.accent.default"], "color.kiremit");
    assert.ok(names["color.state.hover"], "hover durum rengi");
    const kahve = await pick(pg, s, "color.kahve");
    assert.deepEqual(kahve.members.map((m) => m.value), ["#3b2a1f", "#3c2b20"]);
    assert.match(await text(pg, "#rightDetail"), /sayfadaki değişkenden.*#3b2a1f.*--color-kahve.*--kahve.*Birleşen ham değerler \(2\)/s);
    const sw = await pg.evaluate(() => { const i = document.querySelector("#rightDetail .dt-swatch--lg .dt-swatch__in"); const r = i.getBoundingClientRect(); return { h: r.height, bg: getComputedStyle(i).backgroundColor }; });
    assert.ok(sw.h > 40 && sw.bg === "rgb(59, 42, 31)", "renk örneği boyandı");
    await shot(pg, "masaustu-01-renkler.png");
    await pg.click("[data-show]");
    await until(pg, () => document.querySelector("#shot") && document.querySelector("#shot").dataset.ready === "1");
    const box = await pg.evaluate(() => { const b = document.querySelector(".dt-box").getBoundingClientRect(); return { w: b.width, h: b.height }; });
    assert.ok(box.w > 20 && box.h > 5, "vurgu kutusu çizildi");
    await shot(pg, "masaustu-06-kullanim-yeri.png");

    // 2) Yazı: ad doğrulama ve yeniden adlandırma
    await tab(pg, "yazi");
    s = await state(pg);
    await pick(pg, s, "font.size.lg");
    await pg.fill("#nameInput", "Başlık Boyutu");
    await pg.click("#nameSave");
    await toastHas(pg, /küçük harf/);
    await pg.fill("#nameInput", "space.baslik");
    await pg.click("#nameSave");
    await toastHas(pg, /font\.” ile başlamalı/);
    await pg.fill("#nameInput", "font.size.heading-2");
    await pg.click("#nameSave");
    await toastHas(pg, /Ad kaydedildi/);
    s = await state(pg);
    assert.ok(s.active.tokens.some((t) => t.name === "font.size.heading-2" && t.value === "20px" && t.nameSource === "kullanici"));
    assert.match(await text(pg, "#rightDetail"), /sizin adınız/);
    await shot(pg, "masaustu-02-yazi.png");

    // 3) Onaysız dışa aktarma reddedilir; onay → JSON/CSS/MD yalnız onaylılar
    await pg.click("#jsonBtn");
    await toastHas(pg, /Önce dışa aktarılacak tokenları onaylayın/);
    await pg.click("#approveAll");
    await toastHas(pg, /\d+ token onaylandı/);
    s = await state(pg);
    const okCount = s.active.summary.ok;
    assert.equal(okCount, s.active.tokens.filter((t) => t.uses >= 2 || t.anchor).length);
    // seyrek bir değeri elle onaylamadan bırak; bir öneriyi onaydan çıkar
    const off = s.active.tokens.find((t) => t.cat === "space" && t.ok);
    await tab(pg, "bosluk");
    await pg.click(`#leftList .dt-titem[data-id="${off.id}"] input`);
    await until(pg, (n) => window.dtsDesktop.state().then((x) => x.active.summary.ok === n), okCount - 1);
    await pg.click("#jsonBtn");
    await toastHas(pg, /“tokenlar-kafe-menusu\.json” kaydedildi \(\d+ onaylı token\)/);
    const j = JSON.parse(readOut("tokenlar-kafe-menusu.json"));
    assert.equal(j.color.kiremit.$value, "#c2410c");
    assert.equal(j.color.kiremit.$type, "color");
    assert.equal(j.font.size["heading-2"].$value, "20px");
    assert.equal(j.color.text.default.$value, "{color.kahve}");
    const offPath = off.name.split(".");
    assert.equal(offPath.reduce((o, k) => (o ? o[k] : undefined), j), undefined, "onaydan çıkarılan token yazılmadı");
    assert.match(j.$extensions["com.pluginlabs.design-token-scout"].source, /örnek sayfa: kafe-menusu/);
    await clearToast(pg);
    await pg.click("#cssBtn");
    await toastHas(pg, /tokenlar-kafe-menusu\.css/);
    const css = readOut("tokenlar-kafe-menusu.css");
    assert.match(css, /--color-kiremit: #c2410c;/);
    assert.match(css, /--color-text-default: var\(--color-kahve\);/);
    assert.ok(!css.includes(C_CSS(off.name)), "onaysız token CSS'te yok");
    await clearToast(pg);
    await pg.click("#mdBtn");
    await toastHas(pg, /tokenlar-kafe-menusu-rapor\.md/);
    assert.match(readOut("tokenlar-kafe-menusu-rapor.md"), /# Tasarım tokenları — Kafe Menüsü.*Örnek sayfa doğrulaması: beklenen 18 ana değerin 18'i/s);

    // 4) Yerel HTTP sayfası: onay reddi → istek yok; onay → tarama; çerez yok, bağlantı izlenmez, betik açık/kapalı
    await nav(pg, "scan");
    setFile("deny.txt", "1");
    await pg.fill("#urlInput", base + "/sayfa");
    await pg.click("#urlBtn");
    await toastHas(pg, /onay verilmedi/);
    assert.equal(req.log.length, 0, "onay verilmeden istek yapılmadı");
    assert.match(readLog("approvals.txt"), /Bu sayfa taranmak üzere açılsın mı\?.*\/sayfa.*çerezleriniz ve oturumunuz kullanılmaz.*kullanım hakkınız/s);
    rmFile("deny.txt");
    await pg.click("#urlBtn");
    await toastHas(pg, /ham değerden \d+ token adayı önerildi/);
    s = await state(pg);
    let a = s.active;
    assert.equal(a.title, "Yerel mağaza");
    assert.ok(a.tokens.some((t) => t.value === "#be123c"), "betik açıkken betikle eklenen renk tarandı");
    assert.ok(a.tokens.some((t) => t.name === "color.marka" && t.value === "#7c3aed" && t.varName === "--marka"), "sayfa değişkeni adı");
    assert.ok(a.states.some((x) => x.state === "hover" && x.value === "#6d28d9"));
    assert.equal(a.vars.length, 2);
    assert.ok(a.live);
    assert.ok(req.log.every((r) => !r.url.startsWith("/baska")), "bağlantılar izlenmedi");
    assert.equal(req.log.find((r) => r.url === "/sayfa").cookie, "", "tarayıcı çerezi gönderilmedi");
    await pg.click('[data-nav="settings"]');
    await pg.uncheck("#setScripts");
    await nav(pg, "scan");
    const n0 = req.log.length;
    await pg.click("#rerunBtn");
    await toastHas(pg, /ham değer, \d+ aday/);
    s = await state(pg);
    a = s.active;
    assert.ok(!a.tokens.some((t) => t.value === "#be123c"), "betik kapalıyken betikle eklenen öğe yok");
    assert.equal(req.log.slice(n0).find((r) => r.url === "/sayfa").cookie, "", "yeni tarama yeni oturum (çerez yok)");
    await pg.click('[data-nav="settings"]');
    await pg.check("#setScripts");

    // 5) HTML yapıştırma ve .html dosyası (uzak kaynak kapalı, dosya değişmez)
    await nav(pg, "scan");
    await pg.click('[data-act="paste"]');
    await pg.fill("#pasteText", '<html><head><title>Yapıştırılan kart</title><style>body{color:#14532d;background:#f0fdf4}.x{padding:8px;margin:8px;border-radius:4px;background:#bbf7d0}</style></head><body><div class="x">A</div><div class="x">B</div></body></html>');
    await pg.click("#pasteRun");
    await toastHas(pg, /token adayı önerildi/);
    s = await state(pg);
    assert.equal(s.active.title, "Yapıştırılan kart");
    assert.ok(s.active.tokens.some((t) => t.value === "#bbf7d0" && t.uses === 2));
    setFile("pick.txt", htmlPath);
    const n1 = req.log.length;
    await clearToast(pg);
    await pg.click('#view-scan .dt-toolbar [data-act="file"]');
    await toastHas(pg, /token adayı önerildi/);
    s = await state(pg);
    assert.equal(s.active.title, "Bileşen");
    assert.ok(s.active.tokens.some((t) => t.cat === "radius" && t.value === "12px"));
    assert.equal(req.log.slice(n1).length, 0, "yerel dosyada uzak kaynak yüklenmedi");
    assert.equal(sha(htmlPath), before, "kaynak dosya değişmedi");

    // 6) Yeniden öner: ΔE kapalı → yakın renkler ayrılır
    await openSample(pg, "blog-yazisi");
    s = await state(pg);
    const colorsBefore = s.active.tokens.filter((t) => t.cat === "color").length;
    await nav(pg, "settings");
    await pg.selectOption("#setColorTol", "0");
    await nav(pg, "scan");
    await clearToast(pg);
    await pg.click("#rebuildBtn");
    await toastHas(pg, /Güncel birleştirme ayarlarıyla/);
    s = await state(pg);
    assert.ok(s.active.tokens.filter((t) => t.cat === "color").length > colorsBefore, "ΔE kapalıyken daha çok renk");
    assert.equal(s.active.fixtureEval.merged, 0);
    await nav(pg, "settings");
    await pg.selectOption("#setColorTol", "3");
    await nav(pg, "scan");
    await clearToast(pg);
    await pg.click("#rebuildBtn");
    await toastHas(pg, /Güncel birleştirme ayarlarıyla/);

    // 7) MyMind (taklit Hub): anahtar yokken uyarı, red → istek yok, onay → öneriler; uygula
    await openSample(pg, "saas-pano");
    await pg.click("#aiBtn");
    await toastHas(pg, /Hub istemci anahtarını girin/);
    await pg.click("#openMymind");
    await pg.fill("#mymindKey", KEY);
    await pg.click("#mymindSave");
    await toastHas(pg, /Anahtar/);
    setFile("deny.txt", "1");
    await pg.click("#aiBtn");
    await toastHas(pg, /İstek gönderilmedi/);
    assert.equal(req.hub, 0);
    rmFile("deny.txt");
    await clearToast(pg);
    await pg.click("#aiBtn");
    await toastHas(pg, /4 ad önerisi geldi \(3 öneri atıldı\)/);
    const sent = readLog("ai-sent.json");
    assert.ok(!/saas-pano|Satış Panosu|\.kart|aside|Ayşe/.test(sent), "adres, başlık, seçici ve metin gönderilmedi");
    assert.match(sent, /tur\W+color/);
    assert.match(await text(pg, "#aiBox"), /4 öneri.*→.*oneri\.ad-1.*3 geçersiz ya da bilinmeyen öneri atıldı/s);
    await shot(pg, "masaustu-03-mymind-onerisi.png");
    s = await state(pg);
    const valuesBefore = s.active.tokens.map((t) => t.value).join("|");
    await pg.click("#aiApply");
    await toastHas(pg, /4 token yeniden adlandırıldı/);
    s = await state(pg);
    assert.equal(s.active.tokens.filter((t) => t.nameSource === "mymind").length, 4);
    assert.equal(s.active.tokens.map((t) => t.value).join("|"), valuesBefore, "değerler değişmedi");

    // 8) Geçmiş, arşiv/geri alma, ölçüler, yerel model
    await nav(pg, "history");
    assert.equal(await pg.locator("#histList .dt-item").count(), 9);
    await shot(pg, "masaustu-04-gecmis.png");
    await pg.click("#histList .dt-item >> nth=0");
    await until(pg, () => !document.getElementById("view-scan").hidden);
    await pg.click("#archiveBtn");
    await toastHas(pg, /arşive alındı/);
    await nav(pg, "history");
    await pg.click('[data-hf="arsiv"]');
    assert.equal(await pg.locator("#histList .dt-item").count(), 1);
    await pg.click("#histList .dt-item >> nth=0");
    await pg.click("text=Arşivden geri al");
    await until(pg, () => !/Arşivden geri al/.test(document.getElementById("scanHead").textContent));
    await nav(pg, "settings");
    assert.match(await text(pg, "#metrics"), /%\d+(,\d)?\s*örnek sayfalarda ana değer kapsaması.*6\/6\s*birleşmesi gereken/s);
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
    // Ekran görüntüsü sonrası: yerel modelle bir öneri (loopback, anahtarsız)
    await openSample(pg, "form-sayfasi");
    await clearToast(pg);
    await pg.click("#aiBtn");
    await toastHas(pg, /ad önerisi geldi/);
    assert.match(readLog("ai-sent.json").trim().split("\n").pop(), /"provider":"yerel"/);
    s = await state(pg);
    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = s.vault;
    report.requests = req.log.length;
    report.tokensExported = okCount - 1;
    await app.close();

    // 9) Kalıcılık (sayfa penceresi kapalı → öğe gösterme kapalı; onay ve adlar korunur)
    ({ app, page: pg, violations } = await launch(port));
    s = await state(pg);
    assert.equal(s.scans.length, 9);
    assert.equal(s.settings.provider, "yerel");
    assert.equal(s.active.live, false);
    const kafe = s.scans.find((x) => x.target.fixture === "kafe-menusu");
    assert.equal(kafe.summary.ok, okCount - 1);
    await pg.evaluate((id) => window.dtsDesktop.scan.open(id), kafe.id);
    s = await state(pg);
    assert.ok(s.active.tokens.some((t) => t.name === "font.size.heading-2"));
    await pg.reload();
    await until(pg, () => document.documentElement.dataset.ready === "1");
    await pick(pg, s, "color.kiremit");
    assert.ok(await pg.isDisabled("[data-show]"));
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

function C_CSS(name) { return "--" + name.replace(/\./g, "-") + ":"; }
async function openSample(pg, fixture) {
  const s = await pg.evaluate(() => window.dtsDesktop.state());
  const id = s.scans.find((x) => x.target.fixture === fixture && x.status === "tamam").id;
  await pg.evaluate((i) => window.dtsDesktop.scan.open(i), id);
  await pg.click('[data-nav="scan"]');
  await pg.click('[data-tab="renk"]');
  await until(pg, (f) => window.dtsDesktop.state().then((x) => x.active && x.active.target.fixture === f), fixture);
}
