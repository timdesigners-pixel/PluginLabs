/* Access Lens — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçili sayfada kontrast, etiket, odak sırası ve semantik uyarılar; sorun seçildiğinde ilgili öğeyi göster.
 * • Denetlenen sayfa yalnız kullanıcının seçtiği TEK sayfadır: yazdığı adres (her açılış ayrı onaylı), açtığı .html dosyası ya da
 *   yapıştırdığı HTML. Bağlantılar izlenmez, site taranmaz; sayfa yalıtılmış, oturumsuz bir pencerede açılır (desktop/auditor.js).
 * • Kural motoru axe-core; standart (WCAG 2.2 A/AA + isteğe bağlı en iyi uygulamalar) ve motor sürümü raporda görünür. Puan/sertifika yok.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, veri azaltılmış açıklama + düzeltme taslağı. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const auditor = require("./auditor");
const C = require("../src/core.js");
const VERSION = require("../package.json").version;

const root = path.join(__dirname, "..");
if (process.env.AL_USER_DATA) app.setPath("userData", process.env.AL_USER_DATA);
const TEST = process.env.AL_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 5 * 1024 * 1024;
const FIXTURES = [
  { key: "kayit-formu", title: "Atölye kayıt formu" },
  { key: "urun-karti", title: "Ürün kartı" },
  { key: "haber-listesi", title: "Haber listesi" },
];

let win = null;
let memoryKey = null;
let busy = false;
let data = { settings: C.normalizeSettings({}), audits: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "denetimler.bin" : "denetimler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.AL_NOW ? new Date(process.env.AL_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — denetlenen adresler ve HTML parçaları kişisel olabilir) ----
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
    data.audits = C.normalizeAudits(d.audits);
    data.active = data.audits.some((x) => x.id === d.active) ? d.active : null;
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
function previousOf(a) {
  const k = C.pageKey(a);
  // Liste en yeniden en eskiye sıralıdır; aynı sayfanın bu denetimden sonra gelen ilk kaydı bir öncekidir.
  const i = data.audits.indexOf(a);
  return data.audits.slice(i + 1).find((x) => x.status !== "arsiv" && C.pageKey(x) === k) || null;
}
function view() {
  const a = data.audits.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings, version: VERSION, engine: auditor.engine(), fixtures: FIXTURES,
    audits: data.audits.map((x) => ({ id: x.id, status: x.status, title: x.title, target: x.target, finalUrl: x.finalUrl, createdAt: x.createdAt, engine: x.engine, summary: C.summarize(x) })),
    active: a ? { ...a, summary: C.summarize(a), diff: C.diffAudits(previousOf(a), a), fixtureEval: C.evaluateFixture(a), focusIssues: C.focusIssues(a.focus), live: auditor.liveFor(a.id) } : null,
    metrics: C.metrics(data.audits, data.counters), now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform, busy,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getAudit(id) { const x = data.audits.find((i) => i.id === id); if (!x) throw new Error("Denetim bulunamadı."); return x; }
function getFinding(a, key) { const f = a.findings.find((x) => x.key === key) || a.manual.find((x) => x.key === key); if (!f) throw new Error("Bulgu bulunamadı."); return f; }

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Access Lens", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; auditor.close(); });
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickHtml() {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Denetlenecek HTML sayfasını seçin", properties: ["openFile"], filters: [{ name: "HTML", extensions: ["html", "htm", "xhtml"] }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Raporu kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- Denetim ----
async function audit(target, meta) {
  if (busy) throw new Error("Bir denetim sürüyor; bitmesini bekleyin.");
  busy = true; push();
  try {
    const raw = await auditor.run({ ...target, tmpDir: path.join(app.getPath("userData"), "gecici") }, data.settings, C.tagsFor(data.settings));
    const a = C.normalizeRun(raw, { ...meta, at: now().toISOString(), scripts: data.settings.scripts });
    data.audits.unshift(a);
    if (data.audits.length > C.MAX_AUDITS) data.audits = data.audits.slice(0, C.MAX_AUDITS);
    auditor.attach(a.id);
    data.active = a.id;
    data.counters.audits++;
    return a;
  } finally { busy = false; }
}
const fixturePath = (key) => path.join(root, "src", "fixtures", key + ".html");
const pastePath = () => path.join(app.getPath("userData"), "yapistirilan", "sayfa.html");
async function auditUrl(input) {
  const url = C.parseTarget(input);
  if (!url) throw new Error("Adres anlaşılamadı. http:// ya da https:// ile başlayan bir web sayfası adresi yazın.");
  const ok = await approve("Bu sayfa denetim için açılsın mı?",
    "Adres: " + url + "\n\nYalnız bu sayfa yalıtılmış, oturumsuz bir pencerede yüklenir (çerezleriniz ve oturumunuz kullanılmaz; sayfanın kendi kaynakları indirilir). Bağlantılar izlenmez, site taranmaz, form gönderilmez.\nSayfanın kendi betikleri: " + (data.settings.scripts ? "çalışır (dinamik içerik için)" : "çalışmaz") + ".\nDenetim sonucu yalnız bu bilgisayarda saklanır.", "Aç ve denetle");
  if (!ok) return { approved: false };
  const a = await audit({ kind: "url", url }, { kind: "url", url });
  data.counters.urlAudits++;
  return { approved: true, id: a.id, count: a.findings.length, state: changed() };
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }
const safeName = (a, ext) => "erisilebilirlik-" + (C.fold(a.title || C.hostOf(a.finalUrl) || "rapor").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "rapor") + "." + ext;

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.access-lens");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    // Denetim başlatma
    handle("audit:url", (input) => auditUrl(input));
    handle("audit:file", async () => {
      const f = await pickHtml();
      if (!f) return { cancelled: true };
      const st = fs.statSync(f);
      if (!st.isFile() || st.size > MAX_FILE || !/\.(html?|xhtml)$/i.test(f)) throw new Error("Yalnız 5 MB'tan küçük .html/.htm dosyası denetlenebilir.");
      const a = await audit({ kind: "dosya", file: f }, { kind: "dosya", file: path.basename(f) });
      a.target.path = f;
      data.counters.fileAudits++;
      return { id: a.id, count: a.findings.length, state: changed() };
    });
    handle("audit:paste", async (html) => {
      html = C.str(html, MAX_FILE);
      if (!/<[a-z!]/i.test(html)) throw new Error("Yapıştırılan içerik HTML gibi görünmüyor.");
      writeAtomic(pastePath(), html);
      const a = await audit({ kind: "yapistir", file: pastePath() }, { kind: "yapistir" });
      data.counters.pasteAudits++;
      return { id: a.id, count: a.findings.length, state: changed() };
    });
    handle("audit:samples", async () => {
      let n = 0, last = null;
      // Sondan başa denetlenir: ilk örnek en son açılır, böylece gösterilen denetimin sayfası açık kalır (öğe gösterme için).
      for (const fx of FIXTURES.slice().reverse()) { last = await audit({ kind: "ornek", file: fixturePath(fx.key) }, { kind: "ornek", fixture: fx.key }); n++; }
      return { audits: n, last: last && last.id, state: changed() };
    });
    handle("audit:rerun", async (id) => {
      const a = getAudit(id);
      if (a.target.kind === "url") return auditUrl(a.target.url);
      if (a.target.kind === "ornek") { const b = await audit({ kind: "ornek", file: fixturePath(a.target.fixture) }, { kind: "ornek", fixture: a.target.fixture }); return { approved: true, id: b.id, count: b.findings.length, state: changed() }; }
      if (a.target.kind === "dosya" && a.target.path && fs.existsSync(a.target.path)) { const b = await audit({ kind: "dosya", file: a.target.path }, { kind: "dosya", file: a.target.file }); b.target.path = a.target.path; return { approved: true, id: b.id, count: b.findings.length, state: changed() }; }
      throw new Error(a.target.kind === "yapistir" ? "Yapıştırılan HTML saklanmaz; yeniden denetlemek için yeniden yapıştırın." : "Dosya artık bulunamıyor; yeniden seçin.");
    });

    // Gezinme ve işaretler
    handle("audit:open", (id) => { if (id) getAudit(id); data.active = id || null; return changed(); });
    handle("audit:archive", (id) => { const a = getAudit(id); a.status = "arsiv"; const next = data.audits.find((x) => x.status !== "arsiv"); data.active = next ? next.id : null; return changed(); });
    handle("audit:restore", (id) => { const a = getAudit(id); a.status = "tamam"; data.active = a.id; return changed(); });
    handle("finding:fp", (id, key, on) => { const a = getAudit(id); const f = getFinding(a, key); if (f.manual) throw new Error("Manuel kontrol öğeleri yanlış olumlu işaretlenmez."); f.fp = !!on; if (on) data.counters.fpMarked++; return changed(); });
    handle("finding:show", async (id, selector) => {
      const a = getAudit(id);
      const s = C.str(selector, 400);
      if (!a.findings.some((f) => f.target[0] === s) && !a.manual.some((f) => f.target[0] === s) && !a.focus.some((f) => f.sel === s) && !a.outline.headings.some((h) => h.sel === s) && !a.outline.landmarks.some((l) => l.sel === s)) throw new Error("Bilinmeyen öğe.");
      const r = await auditor.highlight(a.id, s);
      data.counters.highlights++; save();
      return r;
    });
    handle("link:open", async (url) => {
      const u = C.str(url, 2000);
      const known = data.audits.some((a) => a.finalUrl === u || a.target.url === u || a.findings.some((f) => f.helpUrl === u) || a.manual.some((f) => f.helpUrl === u));
      if (!known || !C.isWebUrl(u)) throw new Error("Bu bağlantı açılamaz.");
      if (TEST) { testLog("opened.txt", u); return { opened: u }; }
      await shell.openExternal(u);
      return { opened: u };
    });

    // Rapor
    const exp = (ext, fn) => async (id) => {
      const a = getAudit(id);
      const file = await pickSave(safeName(a, ext), ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, fn(a), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file) };
    };
    handle("export:md", exp("md", (a) => C.exportMarkdown(a, VERSION)));
    handle("export:json", exp("json", (a) => C.exportJson(a, VERSION)));
    handle("export:csv", exp("csv", (a) => C.exportCsv(a)));

    // Yapay zekâ (tek bulgu; her istek ayrı onaylı)
    const hubUrl = () => (TEST && process.env.AL_HUB_URL) || net.HUB_URL;
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:explain", async (id, key) => {
      const a = getAudit(id);
      const f = getFinding(a, key);
      const s = data.settings;
      const prov = s.provider === "yerel" ? { name: "Yerel model (" + s.localUrl + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" } : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
      if (s.provider === "hub" && !prov.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
      const p = C.aiPayload(a, f);
      const ok = await approve("Bu bulgu MyMind ile açıklansın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Kural: " + f.ruleId + ", WCAG başvurusu ve motorun özeti (" + p.sent.summaryChars + " karakter)\n• Öğenin HTML parçası (" + p.sent.htmlChars + " karakter; e-posta/telefon/uzun sayılar gizlenir)\n• Sayfa adresi, başlığı ve diğer bulgular gönderilmez\n\nYanıt bir taslaktır; “uyumlu/sertifikalı” ya da puan iddiaları atılır.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: s.provider, messages: p.messages }));
      let text;
      try { text = await net.chat({ base: prov.base, key: prov.key, model: prov.model, messages: p.messages, maxTokens: 700 }); } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(s.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + s.localUrl + ").");
        throw new Error(msg);
      }
      const res = C.validateAi(text);
      f.ai = { ...res, at: now().toISOString(), provider: s.provider };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, dropped: res.dropped, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => { auditor.close(); app.quit(); });
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
