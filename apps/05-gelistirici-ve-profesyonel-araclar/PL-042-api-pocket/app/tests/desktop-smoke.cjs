// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, uygulama içi örnek API ile ilk doğru istek (≤ 2 dk ölçüsü), JSON
// renklendirme ve alan listesi, tanımsız değişkenle gönderim engeli, curl içe aktarma (Authorization + api_key gizli değişkene taşınır),
// yankı sunucusunda gerçek sırrın gittiği ama arayüzde/geçmişte/dosyalarda görünmediği (⟦sır:ad⟧), ortam düzenleyici (gizli değer
// arayüze gelmez, boş bırakılınca korunur), üretim ortamında onay (red → istek gitmez), 3xx yönlendirmenin izlenmemesi, 404/zaman aşımı
// /bağlantı reddi hataları, curl kopyası ve koleksiyon dışa aktarmasının sırsız olması, MyMind (taklit Hub: anahtar, red, onay, istekte sır/
// e-posta yok, olmayan alan ve verilmeyen bağlantının atılması) ile alan açıklaması ve istek taslağı, yerel model (loopback; dış adres
// reddi), arşiv, ölçüler, izin isteklerinin reddi, kalıcılık ve kullanıcı verisinde sır taraması.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ap-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ap-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
const TOKEN = "tok_" + "Hq4Lp9".repeat(5);
const APIKEY = "ak_" + "Zr7Vn2".repeat(4);
const PRODKEY = "prod_" + "Mx3Wd8".repeat(4);

const received = [];
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, j, h) => { res.writeHead(code, { "Content-Type": "application/json", ...(h || {}) }); res.end(typeof j === "string" ? j : JSON.stringify(j)); };
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname === "/v1/chat/completions") {
      hubCalls++;
      const j = JSON.parse(body || "{}");
      const auth = req.headers.authorization;
      if (!(auth === "Bearer " + KEY || (!auth && j.model === "test-model"))) return send(401, { error: "Geçersiz API anahtarı" });
      const sys = j.messages[0].content;
      const content = /TEK bir HTTP GET/.test(sys)
        ? JSON.stringify({ ad: "Roman türündeki kitaplar", adres: "{{base_url}}/v1/kitaplar", parametreler: [{ ad: "tur", deger: "roman" }, { ad: "adet", deger: "10" }], basliklar: [{ ad: "X-Api-Key", deger: "{{api_key}}" }, { ad: "Authorization", deger: "Bearer acik-deger-12345" }], aciklama: "Roman türündeki kitapları 10'ar getirir." })
        : "```json\n" + JSON.stringify({ ozet: "Sayfalı kitap listesi: veri dizisinde kitaplar, sayfalama nesnesinde sayfa bilgisi var.", alanlar: [
          { yol: "veri[*].id", aciklama: "Kitabın benzersiz kimliği; Tek kitap isteğinde kitap_id olarak kullanılır." },
          { yol: "veri[*].puan", aciklama: "Okur puanı (0–5); puanlanmamış kitapta null.", belirsiz: true },
          { yol: "sayfalama.sonraki", aciklama: "Sonraki sayfa numarası; son sayfada null." },
          { yol: "veri[*].isbn", aciklama: "Uydurma alan" },
          { yol: "veri[*].baslik", aciklama: "Ayrıntı: https://kotu.example/belge" },
        ] }) + "\n```";
      return send(200, { choices: [{ message: { role: "assistant", content } }] });
    }
    received.push({ path: u.pathname + u.search, headers: req.headers, method: req.method });
    if (u.pathname === "/yanki") return send(200, { yontem: req.method, yol: u.pathname, sorgu: Object.fromEntries(u.searchParams), basliklar: { authorization: req.headers.authorization || null, "user-agent": req.headers["user-agent"] }, kisi: { eposta: "ece@ornek.example" } });
    if (u.pathname === "/yonlen") return send(302, { not: "taşındı" }, { Location: "https://baska-sunucu.example/hedef" });
    if (u.pathname === "/yavas") return setTimeout(() => send(200, { gec: true }), 9000);
    if (u.pathname === "/html") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end('<html><body><script>window.kotu=1</script><img src=x onerror="window.kotu=2">Merhaba</body></html>'); }
    send(404, { hata: "yok: " + u.pathname });
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, AP_USER_DATA: userData, AP_TEST_DIR: testDir, AP_HUB_URL: "http://127.0.0.1:" + port } });
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
const state = (page) => page.evaluate(() => window.apDesktop.state());
const text = (page, sel) => page.textContent(sel);
const nav = (page, v) => page.click(`[data-nav="${v}"]`);
const dom = (page) => page.evaluate(() => document.body.innerText + " " + [...document.querySelectorAll("textarea,input,select")].map((e) => e.value + " " + (e.placeholder || "")).join(" "));
const openTpl = async (page, name) => { const s = await state(page); const t = s.templates.find((x) => x.name === name); assert.ok(t, "şablon yok: " + name); await page.click(`#tplList .dp-item[data-id="${t.id}"]`); await until(page, (i) => !!document.querySelector(`#tplList .dp-item.is-sel[data-id="${i}"]`), t.id); return t.id; };
const sendAndWait = async (page) => { await page.click("#sendBtn"); await until(page, () => document.getElementById("busy").hidden); await page.waitForTimeout(100); };
const setUrl = async (page, v) => { await page.fill("#tplUrl", v); await page.locator("#tplUrl").press("Tab"); await until(page, async (x) => { const s = await window.apDesktop.state(); return !!s.detail && s.detail.url === x; }, v); };
const stateIs = (page, fn, arg) => until(page, fn, arg);
const allSecretsIn = (s) => [TOKEN, APIKEY, PRODKEY].filter((x) => s.includes(x));
function scanDir(dir) {
  const hits = [];
  for (const f of fs.readdirSync(dir, { recursive: true })) {
    const p = path.join(dir, String(f));
    try { if (!fs.statSync(p).isFile()) continue; const b = fs.readFileSync(p).toString("latin1"); const u = fs.readFileSync(p, "utf8"); for (const x of [TOKEN, APIKEY, PRODKEY]) if (b.includes(x) || u.includes(x)) hits.push(path.relative(dir, p) + ":" + x.slice(0, 6)); } catch { /* kilitli dosya */ }
  }
  return hits;
}

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const base = "http://127.0.0.1:" + port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "API Pocket");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".dp-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".dp-product"), /API Pocket.*İstek şablonu.*42/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    const fetchBlocked = await page.evaluate(async (b) => { try { await fetch(b + "/yanki"); return "gitti"; } catch { return "engellendi"; } }, base);
    assert.equal(fetchBlocked, "engellendi", "arayüz ağa kapalı (CSP)");
    violations.length = 0;
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek API → ilk doğru istek
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /Örnek API hazır/);
    let s = await state(page);
    assert.equal(s.templates.length, 4);
    assert.equal(s.envs[0].name, "Örnek API (yerel)");
    assert.equal(s.envs[0].vars.find((v) => v.k === "api_key").v, "", "gizli değer arayüze gelmez");
    assert.equal(s.envs[0].vars.find((v) => v.k === "api_key").set, true);
    assert.match(await text(page, "#previewBox"), /GET http:\/\/127\.0\.0\.1:\d+\/v1\/kitaplar\?sayfa=1&adet=5/);
    assert.match(await text(page, "#previewBox"), /X-Api-Key: \{\{api_key\}\}/);
    await sendAndWait(page);
    await toastHas(page, /^200 · /);
    s = await state(page);
    assert.equal(s.detail.response.status, 200);
    assert.ok(s.metrics.firstOkMs != null && s.metrics.firstOkMs <= 120000, "ilk doğru istek ≤ 2 dk: " + s.metrics.firstOkMs);
    report.firstOkMs = s.metrics.firstOkMs;
    assert.match(await text(page, "#respStatus"), /200 Tamam/);
    assert.ok(await page.locator("#respBody .t-key").count() > 10);
    assert.match(await text(page, "#respBody"), /"baslik": "Rüzgârın Sayfası"/);
    await shot(page, "masaustu-01-ornek-yanit.png");
    await page.click('[data-stab="fields"]');
    assert.match(await text(page, "#fieldTable"), /veri\[\*\]\.puan.*ondalık \| null/s);
    // 401: başlık kapatılınca
    await page.click('[data-rtab="headers"]');
    await page.uncheck('#tplDetail .ap-row:nth-child(2) input[type="checkbox"]');
    await until(page, async () => { const s = await window.apDesktop.state(); return (s.detail.headers[0].on) === false; });
    await sendAndWait(page);
    await until(page, () => /401/.test((document.getElementById("respStatus") || {}).textContent || ""));
    await page.check('#tplDetail .ap-row:nth-child(2) input[type="checkbox"]');
    await until(page, async () => { const s = await window.apDesktop.state(); return (s.detail.headers[0].on) === true; });
    // Tek kitap (kitap_id değişkeni) ve 404
    await openTpl(page, "Tek kitap");
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    assert.match(await text(page, "#respBody"), /Saat Kulesindeki Kuş/);
    await setUrl(page, "{{base_url}}/v1/kitaplar/999");
    await sendAndWait(page);
    await until(page, () => /404 Bulunamadı/.test((document.getElementById("respStatus") || {}).textContent || ""));
    // Düz metin yanıt
    await openTpl(page, "Sunucu durumu");
    await sendAndWait(page);
    await until(page, () => /Örnek API çalışıyor/.test((document.getElementById("respBody") || {}).textContent || ""));

    // 2) Tanımsız değişken → gönderilmez
    await openTpl(page, "Yazar ara");
    await setUrl(page, "{{base_url}}/v1/yazarlar/{{yazar_kodu}}");
    assert.match(await text(page, "#previewBox"), /Tanımsız ya da boş değişken: \{\{yazar_kodu\}\}/);
    const blockedBefore = (await state(page)).metrics.blocked;
    await page.click("#sendBtn");
    await toastHas(page, /Gönderilmedi — Tanımsız ya da boş değişken/);
    s = await state(page);
    assert.equal(s.metrics.blocked, blockedBefore + 1);
    await setUrl(page, "{{base_url}}/v1/yazarlar");

    // 3) curl içe aktarma → sırlar gizli değişkene; yankı sunucusunda gerçek değer, arayüzde ⟦sır:…⟧
    await page.selectOption("#envSelect", "");
    await until(page, async () => (await window.apDesktop.state()).activeEnv === null);
    await page.click('[data-act="curl"]');
    await page.fill("#curlText", `curl '${base}/yanki?q=kitap&api_key=${APIKEY}' \\\n  -H 'Authorization: Bearer ${TOKEN}' \\\n  -H 'Accept: application/json' --compressed`);
    await page.click("#curlRun");
    await toastHas(page, /2 değer gizli değişkene taşındı \(token, api_key/);
    s = await state(page);
    assert.equal(s.detail.headers[0].v, "Bearer {{token}}");
    assert.equal(s.detail.params[1].v, "{{api_key}}");
    assert.deepEqual(allSecretsIn(JSON.stringify(s)), [], "durum nesnesinde sır yok");
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    const echo = received.filter((r) => r.path.startsWith("/yanki")).pop();
    assert.equal(echo.headers.authorization, "Bearer " + TOKEN, "gerçek sır sunucuya gitti");
    assert.match(echo.path, new RegExp("api_key=" + APIKEY));
    assert.equal(echo.method, "GET");
    assert.match(echo.headers["user-agent"], /^APIPocket\/0\.1\.0$/);
    assert.match(await text(page, "#respBody"), /⟦sır:token⟧/);
    assert.match(await text(page, "#respBody"), /⟦sır:api_key⟧/);
    assert.match(await text(page, "#respStatus") + (await text(page, "#respBox")), /2 sır gizlendi/);
    assert.deepEqual(allSecretsIn(await dom(page)), [], "ekranda sır yok");
    await page.click('[data-rtab="headers"]');
    await shot(page, "masaustu-02-curl-gizli-degisken.png");
    // curl kopyası sırsız
    await page.click("#curlCopy");
    await toastHas(page, /Panoya kopyalandı/);
    const clip = await app.evaluate(({ clipboard }) => clipboard.readText());
    assert.match(clip, /Authorization: Bearer \{\{token\}\}/);
    assert.deepEqual(allSecretsIn(clip), []);

    // 4) Ortam düzenleyici: gizli değer boş bırakılınca korunur; yeni gizli değişken; üretim onayı
    await nav(page, "envs");
    assert.match(await text(page, "#envList"), /Varsayılan/);
    await page.click('#envList [data-env]:has-text("Varsayılan")');
    assert.equal(await page.inputValue('[data-var="v-0"]'), "", "kayıtlı gizli değer düzenleyicide boş");
    assert.match(await page.getAttribute('[data-var="v-0"]', "placeholder"), /kayıtlı/);
    await page.click("#varAddSecret");
    await page.fill('[data-var="k-2"]', "prod_key");
    await page.fill('[data-var="v-2"]', PRODKEY);
    await page.click("#varAdd");
    await page.fill('[data-var="k-3"]', "bolge");
    await page.fill('[data-var="v-3"]', "tr-1");
    await page.click("#varSave");
    await toastHas(page, /Değişkenler kaydedildi/);
    s = await state(page);
    const venv = s.envs.find((e) => e.name === "Varsayılan");
    assert.deepEqual(venv.vars.map((v) => [v.k, v.secret, v.set || false]), [["token", true, true], ["api_key", true, true], ["prod_key", true, true], ["bolge", false, false]]);
    assert.deepEqual(allSecretsIn(await dom(page)), []);
    await page.check("#envProd");
    await until(page, async () => { const s = await window.apDesktop.state(); return (s.envs.find((e) => e.name === "Varsayılan").production) === true; });
    await shot(page, "masaustu-03-ortamlar.png");
    await nav(page, "requests");
    await openTpl(page, "127.0.0.1/yanki");
    setFile("deny.txt", "1");
    const sentBefore = received.length;
    await page.click("#sendBtn");
    await toastHas(page, /Üretim ortamına gönderim iptal edildi/);
    assert.equal(received.length, sentBefore, "red → istek gitmedi");
    rmFile("deny.txt");
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    const appr = readLog("approvals.txt");
    assert.match(appr, /ÜRETİM ortamına istek gönderilsin mi\?[\s\S]*Adres: http:\/\/127\.0\.0\.1:\d+\/yanki\?q=kitap&api_key=\{\{api_key\}\}[\s\S]*Authorization: Bearer \{\{token\}\}[\s\S]*Kullanılan gizli değişkenler: api_key, token/);
    assert.deepEqual(allSecretsIn(appr), [], "onay metninde sır yok");
    s = await state(page);
    assert.deepEqual([s.metrics.prodConfirms, s.metrics.prodDenied], [1, 1]);
    // üretimi kapat
    await nav(page, "envs");
    await page.click('#envList [data-env]:has-text("Varsayılan")');
    await page.uncheck("#envProd");
    await until(page, async () => { const s = await window.apDesktop.state(); return (s.envs.find((e) => e.name === "Varsayılan").production) === false; });
    await nav(page, "requests");

    // 5) Yönlendirme izlenmez; HTML çalıştırılmaz; zaman aşımı; bağlantı reddi
    await setUrl(page, base + "/yonlen");
    await sendAndWait(page);
    await until(page, () => /302/.test((document.getElementById("respStatus") || {}).textContent || ""));
    assert.match(await text(page, "#respBox"), /Yönlendirme hedefi \(otomatik izlenmedi\): https:\/\/baska-sunucu\.example\/hedef/);
    assert.ok(!received.some((r) => r.path === "/hedef"));
    await setUrl(page, base + "/html");
    await sendAndWait(page);
    await until(page, () => /<script>window\.kotu=1/.test((document.getElementById("respBody") || {}).textContent || ""));
    assert.equal(await page.evaluate(() => typeof window.kotu), "undefined", "yanıt HTML olarak çalıştırılmadı");
    await page.click('[data-nav="settings"]');
    await page.fill("#setTimeout", "5");
    await page.locator("#setTimeout").press("Tab");
    await until(page, async () => { const s = await window.apDesktop.state(); return (s.settings.timeoutSec) === 5; });
    await nav(page, "requests");
    await setUrl(page, base + "/yavas");
    await page.click("#sendBtn");
    await toastHas(page, /Zaman aşımı: sunucu 5 sn içinde yanıt vermedi/);
    await setUrl(page, "http://127.0.0.1:9/kapali");
    await page.click("#sendBtn");
    await toastHas(page, /Bağlantı reddedildi|İstek başarısız|Zaman aşımı/);
    assert.ok(await page.isVisible("#respError"));
    await setUrl(page, base + "/yanki");

    // 6) Geçmiş: maskeli, sırsız
    await nav(page, "history");
    const hist = await text(page, "#histTable");
    assert.match(hist, /api_key=\{\{api_key\}\}/);
    assert.match(hist, /Kitap listesi/);
    assert.deepEqual(allSecretsIn(hist), []);
    await shot(page, "masaustu-04-gecmis.png");

    // 7) MyMind: anahtar yok → hata; anahtar; red; onay → alan açıklaması (uydurma alan ve dış bağlantı atılır)
    await nav(page, "requests");
    await openTpl(page, "Kitap listesi");
    await page.click('[data-act="sample"]');
    await toastHas(page, /Örnek API hazır/);
    await openTpl(page, "Kitap listesi");
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    await page.click("#explainBtn");
    await toastHas(page, /Önce MyMind bağlantısı için Hub istemci anahtarını girin/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (Windows kasasına kaydedildi|bu oturum için bellekte)/);
    setFile("deny.txt", "1");
    await page.click("#explainBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#explainBtn");
    await toastHas(page, /3 alan açıklandı · 2 öğe atıldı/);
    const sent = readLog("ai-sent.json");
    assert.ok(sent.length > 50);
    assert.deepEqual(allSecretsIn(sent), [], "yapay zekâya sır gitmedi");
    assert.doesNotMatch(sent, /ornek_[0-9a-f]{24}/, "örnek API anahtarı gitmedi");
    assert.doesNotMatch(sent, /sayfa=1|adet=5/, "sorgu değerleri gitmedi");
    assert.match(readLog("approvals.txt"), /Yanıt alanları MyMind ile açıklansın mı\?[\s\S]*alan yolu, türü/);
    assert.match(await text(page, "#fieldTable"), /Kitabın benzersiz kimliği/);
    assert.match(await text(page, "#fieldTable"), /\(belirsiz\) Okur puanı/);
    assert.doesNotMatch(await text(page, "#tplDetail"), /kotu\.example|isbn/);
    await page.evaluate(() => { document.getElementById("tplDetail").scrollTop = document.getElementById("respBox").offsetTop - 60; });
    await shot(page, "masaustu-05-mymind-alanlar.png");

    // 8) MyMind istek taslağı: düz Authorization atılır, yalnız şablon eklenir (gönderilmez)
    const sendsBefore = (await state(page)).metrics.sends;
    await page.click('[data-act="draft"]');
    await page.fill("#draftText", "Örnek API'den roman türündeki kitapları 10'ar getir. Bana ece@ornek.example adresinden ulaşın.");
    await page.click("#draftRun");
    await toastHas(page, /Taslak şablon eklendi: Roman türündeki kitaplar · Authorization başlığı düz değerle önerildi; atıldı/);
    s = await state(page);
    assert.equal(s.detail.folder, "MyMind taslakları");
    assert.deepEqual(s.detail.headers.map((h) => h.k), ["X-Api-Key"]);
    assert.equal(s.metrics.sends, sendsBefore, "taslak gönderilmedi");
    assert.doesNotMatch(readLog("ai-sent.json"), /ece@ornek\.example/);
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    assert.match(await text(page, "#respBody"), /"tur": "roman"/);
    assert.doesNotMatch(await text(page, "#respBody"), /"tur": "öykü"/);

    // 9) Yerel model: dış adres reddi, loopback çalışır
    await nav(page, "settings");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://10.0.0.5:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar/);
    await page.fill("#localUrl", base);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await nav(page, "requests");
    await openTpl(page, "Kitap listesi");
    await sendAndWait(page);
    await until(page, () => /200/.test((document.getElementById("respStatus") || {}).textContent || ""));
    await page.click("#explainBtn");
    await toastHas(page, /3 alan açıklandı/);
    await nav(page, "settings");
    await page.check('input[name="provider"][value="hub"]');

    // 10) Koleksiyon dışa aktarma sırsız; arşiv
    await page.click("#exportBtn");
    await toastHas(page, /şablon dışa aktarıldı: api-pocket-koleksiyon\.json/);
    const col = fs.readFileSync(path.join(testDir, "api-pocket-koleksiyon.json"), "utf8");
    assert.deepEqual(allSecretsIn(col), []);
    assert.doesNotMatch(col, /ornek_[0-9a-f]{24}/);
    assert.match(col, /"Authorization",\s*"v": "Bearer \{\{token\}\}"/);
    await nav(page, "requests");
    await openTpl(page, "Sunucu durumu");
    await page.click('#tplDetail button:has-text("Arşivle")');
    await toastHas(page, /Arşivlendi/);
    await page.click('[data-lf="arsiv"]');
    assert.match(await text(page, "#tplList"), /Sunucu durumu/);
    await page.click('[data-lf="etkin"]');
    await openTpl(page, "Kitap listesi");

    // 11) Ölçüler
    await nav(page, "settings");
    s = await state(page);
    assert.equal(s.metrics.leaks, 0);
    assert.ok(s.metrics.redactions >= 2);
    assert.match(await text(page, "#metrics"), /İlk doğru istek/);
    await page.evaluate(() => { document.getElementById("view-settings").scrollTop = 0; });
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    report.metrics = s.metrics;
    report.vault = s.vault;
    assert.deepEqual(violations, []);
    await app.close();

    // 12) Kalıcılık ve diskte sır taraması
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.templates.length, 6);
    assert.ok(s.history.length >= 10);
    const venv2 = s.envs.find((e) => e.name === "Varsayılan");
    assert.equal(venv2.vars.find((v) => v.k === "bolge").v, "tr-1");
    assert.equal(venv2.vars.find((v) => v.k === "token").set, s.vault, "kasa varsa gizli değer korunur, yoksa diske yazılmamıştır");
    assert.equal(s.metrics.leaks, 0);
    const diskHits = scanDir(userData).concat(scanDir(testDir));
    assert.deepEqual(diskHits, [], "kullanıcı verisinde ve test günlüklerinde düz sır yok");
    report.disk = "temiz (" + fs.readdirSync(userData).length + " öğe tarandı)";
    assert.deepEqual(violations, []);
    console.log("DUMAN TESTİ GEÇTİ", JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
