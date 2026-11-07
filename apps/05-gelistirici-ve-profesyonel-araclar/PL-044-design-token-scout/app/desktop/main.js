/* Design Token Scout — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçili sayfadaki computed style örneklerinden renk/font/spacing adayları çıkar; kullanıcı onayıyla token JSON üret.
 * • Taranan sayfa yalnız kullanıcının seçtiği TEK sayfadır: yazdığı adres (her açılış ayrı onaylı), açtığı .html dosyası ya da
 *   yapıştırdığı HTML. Bağlantılar izlenmez, site taranmaz; sayfa yalıtılmış, oturumsuz bir pencerede açılır (desktop/scanner.js).
 * • Dışa aktarılan dosyalar yalnız kullanıcının onayladığı tokenları içerir.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, veri azaltılmış adlandırma önerisi. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const scanner = require("./scanner");
const C = require("../src/core.js");
const VERSION = require("../package.json").version;

const root = path.join(__dirname, "..");
if (process.env.DTS_USER_DATA) app.setPath("userData", process.env.DTS_USER_DATA);
const TEST = process.env.DTS_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 5 * 1024 * 1024;
const FIXTURES = [
  { key: "kafe-menusu", title: "Kafe menüsü" },
  { key: "saas-pano", title: "Satış panosu" },
  { key: "blog-yazisi", title: "Blog yazısı" },
  { key: "e-ticaret-kart", title: "Ürün kartları" },
  { key: "form-sayfasi", title: "Kayıt formu" },
];

let win = null;
let memoryKey = null;
let busy = false;
let data = { settings: C.normalizeSettings({}), scans: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "taramalar.bin" : "taramalar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.DTS_NOW ? new Date(process.env.DTS_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — taranan adresler ve seçiciler kişisel olabilir) ----
function writeAtomic(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, file);
}
function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : {};
    data.settings = C.normalizeSettings(d.settings);
    data.scans = C.normalizeScans(d.scans);
    data.active = data.scans.some((x) => x.id === d.active) ? d.active : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Hub istemci anahtarı: kasada şifreli, arayüze hiç verilmez ----
const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() {
  if (memoryKey) return memoryKey;
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* yok */ }
  return null;
}
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

// ---- Durum ----
function view() {
  const a = data.scans.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings, version: VERSION, fixtures: FIXTURES,
    scans: data.scans.map((x) => ({ id: x.id, status: x.status, title: x.title, target: x.target, finalUrl: x.finalUrl, createdAt: x.createdAt, summary: C.summarize(x) })),
    active: a ? { ...a, summary: C.summarize(a), fixtureEval: C.evaluateFixture(a), live: scanner.liveFor(a.id) } : null,
    metrics: C.metrics(data.scans, data.counters), now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform, busy,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getScan(id) { const x = data.scans.find((i) => i.id === id); if (!x) throw new Error("Tarama bulunamadı."); return x; }
function getToken(s, id) { const t = s.tokens.find((x) => x.id === id) || s.aliases.find((x) => x.id === id); if (!t) throw new Error("Token bulunamadı."); return t; }

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Design Token Scout", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; scanner.close(); });
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickHtml() {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Taranacak HTML sayfasını seçin", properties: ["openFile"], filters: [{ name: "HTML", extensions: ["html", "htm", "xhtml"] }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Dışa aktar", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- Tarama ----
async function scan(target, meta) {
  if (busy) throw new Error("Bir tarama sürüyor; bitmesini bekleyin.");
  busy = true; push();
  try {
    const raw = await scanner.run({ ...target, tmpDir: path.join(app.getPath("userData"), "gecici") }, data.settings);
    const s = C.normalizeRun(raw, { ...meta, at: now().toISOString(), scripts: data.settings.scripts }, data.settings);
    data.scans.unshift(s);
    if (data.scans.length > C.MAX_SCANS) data.scans = data.scans.slice(0, C.MAX_SCANS);
    scanner.attach(s.id);
    data.active = s.id;
    data.counters.scans++;
    return s;
  } finally { busy = false; }
}
const fixturePath = (key) => path.join(root, "src", "fixtures", key + ".html");
const pastePath = () => path.join(app.getPath("userData"), "yapistirilan", "sayfa.html");
const done = (s, extra) => ({ approved: true, id: s.id, tokens: s.tokens.length, raw: C.summarize(s).raw, ...(extra || {}), state: changed() });
async function scanUrl(input) {
  const url = C.parseTarget(input);
  if (!url) throw new Error("Adres anlaşılamadı. http:// ya da https:// ile başlayan bir web sayfası adresi yazın.");
  const ok = await approve("Bu sayfa taranmak üzere açılsın mı?",
    "Adres: " + url + "\n\nYalnız bu sayfa yalıtılmış, oturumsuz bir pencerede yüklenir (çerezleriniz ve oturumunuz kullanılmaz; sayfanın kendi kaynakları indirilir). Bağlantılar izlenmez, site taranmaz, form gönderilmez.\nSayfanın kendi betikleri: " + (data.settings.scripts ? "çalışır (dinamik içerik için)" : "çalışmaz") + ".\nYalnız erişiminiz ve kullanım hakkınız olan arayüzleri tarayın. Sonuç yalnız bu bilgisayarda saklanır.", "Aç ve tara");
  if (!ok) return { approved: false };
  const s = await scan({ kind: "url", url }, { kind: "url", url });
  data.counters.urlScans++;
  return done(s);
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }
const safeName = (s, suffix, ext) => "tokenlar-" + (C.fold(s.title || C.hostOf(s.finalUrl) || s.target.fixture || "sayfa").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "sayfa") + suffix + "." + ext;

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.design-token-scout");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    // Tarama başlatma
    handle("scan:url", (input) => scanUrl(input));
    handle("scan:file", async () => {
      const f = await pickHtml();
      if (!f) return { cancelled: true };
      const st = fs.statSync(f);
      if (!st.isFile() || st.size > MAX_FILE || !/\.(html?|xhtml)$/i.test(f)) throw new Error("Yalnız 5 MB'tan küçük .html/.htm dosyası taranabilir.");
      const s = await scan({ kind: "dosya", file: f }, { kind: "dosya", file: path.basename(f) });
      s.target.path = f;
      data.counters.fileScans++;
      return done(s);
    });
    handle("scan:paste", async (html) => {
      html = C.str(html, MAX_FILE);
      if (!/<[a-z!]/i.test(html)) throw new Error("Yapıştırılan içerik HTML gibi görünmüyor.");
      writeAtomic(pastePath(), html);
      const s = await scan({ kind: "yapistir", file: pastePath() }, { kind: "yapistir" });
      data.counters.pasteScans++;
      return done(s);
    });
    handle("scan:samples", async () => {
      let n = 0, last = null;
      // Sondan başa taranır: ilk örnek en son açılır, böylece gösterilen taramanın sayfası açık kalır (öğe gösterme için).
      for (const fx of FIXTURES.slice().reverse()) { last = await scan({ kind: "ornek", file: fixturePath(fx.key) }, { kind: "ornek", fixture: fx.key }); n++; data.counters.sampleScans++; }
      return { pages: n, last: last && last.id, state: changed() };
    });
    handle("scan:rerun", async (id) => {
      const a = getScan(id);
      if (a.target.kind === "url") return scanUrl(a.target.url);
      if (a.target.kind === "ornek") { const b = await scan({ kind: "ornek", file: fixturePath(a.target.fixture) }, { kind: "ornek", fixture: a.target.fixture }); return done(b); }
      if (a.target.kind === "dosya" && a.target.path && fs.existsSync(a.target.path)) { const b = await scan({ kind: "dosya", file: a.target.path }, { kind: "dosya", file: a.target.file }); b.target.path = a.target.path; return done(b); }
      throw new Error(a.target.kind === "yapistir" ? "Yapıştırılan HTML saklanmaz; yeniden taramak için yeniden yapıştırın." : "Dosya artık bulunamıyor; yeniden seçin.");
    });

    // Gezinme
    handle("scan:open", (id) => { if (id) getScan(id); data.active = id || null; return changed(); });
    handle("scan:archive", (id) => { const a = getScan(id); a.status = "arsiv"; const next = data.scans.find((x) => x.status !== "arsiv"); data.active = next ? next.id : null; return changed(); });
    handle("scan:restore", (id) => { const a = getScan(id); a.status = "tamam"; data.active = a.id; return changed(); });

    // Tokenlar: onay, ad, yeniden öneri
    handle("token:approve", (id, tokenId, on) => { const s = getScan(id); const t = getToken(s, tokenId); t.ok = !!on; if (on && t.cat) data.counters.approvals++; return changed(); });
    handle("token:approveProposed", (id) => { const s = getScan(id); const n = C.approveProposed(s); data.counters.approvals += n; return { count: n, state: changed() }; });
    handle("token:clear", (id) => { const s = getScan(id); for (const t of s.tokens) t.ok = false; return changed(); });
    handle("token:rename", (id, tokenId, name) => {
      const s = getScan(id);
      const t = getToken(s, tokenId);
      name = C.str(name, 120).trim();
      const err = C.validateName(s, tokenId, name);
      if (err) throw new Error(err);
      t.name = name;
      if (t.cat) t.nameSource = "kullanici";
      data.counters.renames++;
      return changed();
    });
    handle("token:rebuild", (id) => { const s = getScan(id); C.buildTokens(s, data.settings); data.counters.rebuilds++; return { tokens: s.tokens.length, state: changed() }; });
    handle("token:show", async (id, selector) => {
      const s = getScan(id);
      const sel = C.str(selector, 400);
      if (!s.tokens.some((t) => t.samples.includes(sel))) throw new Error("Bilinmeyen öğe.");
      const r = await scanner.highlight(s.id, sel);
      data.counters.highlights++; save();
      return r;
    });
    handle("link:open", async (url) => {
      const u = C.str(url, 2000);
      const known = data.scans.some((a) => a.finalUrl === u || a.target.url === u);
      if (!known || !C.isWebUrl(u)) throw new Error("Bu bağlantı açılamaz.");
      if (TEST) { testLog("opened.txt", u); return { opened: u }; }
      await shell.openExternal(u);
      return { opened: u };
    });

    // Dışa aktarma (yalnız onaylı tokenlar)
    const exp = (suffix, ext, fn) => async (id) => {
      const s = getScan(id);
      if (!s.tokens.some((t) => t.ok)) throw new Error("Önce dışa aktarılacak tokenları onaylayın (tek tek ya da “Önerilenleri onayla”).");
      const file = await pickSave(safeName(s, suffix, ext), ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, fn(s), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: s.tokens.filter((t) => t.ok).length };
    };
    handle("export:json", exp("", "json", (s) => C.exportDtcg(s, VERSION)));
    handle("export:css", exp("", "css", (s) => C.exportCss(s, VERSION)));
    handle("export:md", exp("-rapor", "md", (s) => C.exportMarkdown(s, VERSION)));

    // Yapay zekâ (adlandırma önerisi; her istek ayrı onaylı)
    const hubUrl = () => (TEST && process.env.DTS_HUB_URL) || net.HUB_URL;
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:name", async (id) => {
      const sc = getScan(id);
      const s = data.settings;
      const prov = s.provider === "yerel" ? { name: "Yerel model (" + s.localUrl + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" } : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
      if (s.provider === "hub" && !prov.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
      const p = C.aiPayload(sc);
      if (!p.sent.tokens) throw new Error("Önerilecek token yok.");
      const ok = await approve("Token adları için MyMind önerisi alınsın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler: " + p.sent.tokens + " token adayının türü, değeri, kullanım sayısı ve şimdiki adı (" + p.sent.chars + " karakter).\nSayfa adresi, başlığı, öğe seçicileri ve sayfadaki metinler gönderilmez.\n\nModel yalnız ad önerir; değerler değişmez, yeni token eklenmez. Öneriler siz uygulayana kadar bekler.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: s.provider, messages: p.messages }));
      let text;
      try { text = await net.chat({ base: prov.base, key: prov.key, model: prov.model, messages: p.messages, maxTokens: 1500 }); } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(s.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + s.localUrl + ").");
        throw new Error(msg);
      }
      const res = C.validateAi(text, sc, p.map);
      sc.ai = { ...res, at: now().toISOString(), provider: s.provider, applied: false };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, count: res.suggestions.length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", (id) => { const s = getScan(id); if (!s.ai) throw new Error("Uygulanacak öneri yok."); const n = C.applyAi(s); data.counters.aiApplied += n; return { count: n, state: changed() }; });
    handle("ai:discard", (id) => { const s = getScan(id); s.ai = null; return changed(); });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => { scanner.close(); app.quit(); });
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
