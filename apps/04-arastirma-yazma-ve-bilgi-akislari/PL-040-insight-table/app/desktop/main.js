/* Insight Table — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçili tablo/liste → sütun önizlemesi → veri tipi kontrolü → CSV/JSON. İlk sürüm: kullanıcının seçtiği tek sayfa.
 * • İçerik yalnız kullanıcının verdiği şeydir: panodaki seçim (HTML biçimi — tarayıcıda tabloyu seçip Ctrl+C; düğme ya da genel kısayol),
 *   yapıştırılan metin (HTML, CSV/TSV, Markdown tablo, satırlar) ya da kaydedilmiş .html/.csv/.tsv/.md/.txt dosyası. Hiçbir sayfa indirilmez,
 *   site genelinde tarama yoktur.
 * • Kaynak dosyalar yalnız okunur; dışa aktarma kullanıcının seçtiği yeni dosyaya yazılır.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, veri azaltılmış; yalnız sütun adı ve işaret önerir. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell, globalShortcut, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");
const VERSION = require("../package.json").version;

const root = path.join(__dirname, "..");
if (process.env.IT_USER_DATA) app.setPath("userData", process.env.IT_USER_DATA);
const TEST = process.env.IT_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const SHORTCUT = "CommandOrControl+Alt+T";
const PREVIEW_ROWS = 200;
const FILE_EXT = /\.(html?|xhtml|csv|tsv|tab|md|markdown|txt)$/i;

let win = null;
let memoryKey = null;
let shortcutOk = false;
let data = { settings: C.normalizeSettings({}), tables: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "tablolar.bin" : "tablolar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.IT_NOW ? new Date(process.env.IT_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — tablolar kişisel veri içerebilir) ----
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
    data.tables = C.normalizeTables(d.tables);
    for (const t of data.tables) t.sum = C.summarize(t, data.settings);
    data.active = data.tables.some((x) => x.id === d.active) ? d.active : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, settings: data.settings, tables: data.tables.map(({ sum, ...t }) => t), active: data.active, counters: data.counters });
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
let goldCache = null;
function gold() {
  if (!data.tables.some((t) => t.sampleKey)) return null;
  if (!goldCache) goldCache = C.evaluateGold(data.tables, SAMPLE.gold, data.settings);
  return goldCache;
}
function activeView() {
  const t = data.tables.find((x) => x.id === data.active);
  if (!t) return null;
  const a = C.analyze(t, data.settings);
  return {
    id: t.id, name: C.tableName(t), customName: t.name, source: t.source, origin: t.origin, createdAt: t.createdAt, status: t.status, headerRows: t.headerRows, exports: t.exports, ai: t.ai,
    columns: a.columns, rows: a.rows.slice(0, PREVIEW_ROWS), more: Math.max(0, a.rows.length - PREVIEW_ROWS), flags: a.flags.slice(0, 600).map((f) => ({ ...f, src: a.rows[f.row].src })), flagCount: a.flags.length, summary: a.summary,
    headRows: t.raw.slice(0, t.headerRows),
  };
}
function view() {
  return {
    settings: data.settings, version: VERSION,
    tables: data.tables.map((t) => ({ id: t.id, name: C.tableName(t), source: t.source, origin: t.origin, createdAt: t.createdAt, status: t.status, sum: t.sum, exports: t.exports, ai: !!t.ai })),
    active: activeView(), metrics: C.metrics(data.tables, data.counters), gold: gold(), counters: data.counters,
    now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform, shortcut: { accel: SHORTCUT, ok: shortcutOk },
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function touch(t) { if (t) t.sum = C.summarize(t, data.settings); goldCache = null; }
function changed(t) { touch(t); save(); push(); return view(); }
function getTable(id) { const x = data.tables.find((i) => i.id === id); if (!x) throw new Error("Tablo bulunamadı."); return x; }
const editable = (t) => { if (t.status !== "aktif") throw new Error("Arşivdeki tablo değiştirilemez; önce geri alın."); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 1060, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Insight Table", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickFiles() {
  if (TEST) { const t = testRead("pick.txt"); return t ? t.split("\n").filter(Boolean) : []; }
  const r = await dialog.showOpenDialog(win, { title: "Tablo içeren dosyaları seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Sayfa ve tablo dosyaları", extensions: ["html", "htm", "csv", "tsv", "md", "txt"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- İçerik yakalama (yalnız kullanıcının verdiği içerik) ----
function addFrom(text, html, source) {
  const r = C.detectInput(text, html);
  if (!r.candidates.length) throw new Error("İçerikte tablo ya da liste bulunamadı. Sayfada tabloyu fareyle seçip kopyalayın (Ctrl+C) ya da CSV/Markdown tablo yapıştırın.");
  if (data.tables.length + r.candidates.length > C.MAX_TABLES) throw new Error("Tablo sınırına (" + C.MAX_TABLES + ") ulaşıldı. Gereksiz tabloları arşivleyip JSON yedek alın.");
  const src = { ...source, title: source.title || r.title };
  const at = (source.at || now()).toISOString();
  const added = r.candidates.map((c, i) => {
    const t = C.createTable(c, src, at, i + 1, r.candidates.length);
    if (source.key) t.sampleKey = source.key;
    t.sum = C.summarize(t, data.settings);
    return t;
  });
  data.tables.unshift(...added);
  data.counters.captures++;
  data.counters.tables += added.length;
  data.active = added[0].id;
  goldCache = null;
  return { added: added.length, more: r.more, first: added[0] };
}
function sourceFrom(s) {
  s = s || {};
  const url = C.str(s.url, 2000).trim();
  if (url && !C.isWebUrl(url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
  return { url, title: C.str(s.title, 200).trim() };
}
function captureClipboard(via) {
  const html = clipboard.readHTML();
  const text = clipboard.readText();
  if (!(html && html.trim()) && !(text && text.trim())) throw new Error("Panoda içerik yok. Sayfadaki tabloyu ya da listeyi seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
  const r = addFrom(text || "", html || "", { via: via === "kisayol" ? "kisayol" : "pano" });
  data.counters.clipboard++;
  if (via === "kisayol") data.counters.shortcut++;
  return r;
}
const describe = (r) => r.added + " tablo" + (r.added === 1 ? " (" + r.first.sum.rows + " satır × " + r.first.sum.cols + " sütun)" : "") + (r.more ? "; " + r.more + " aday daha sınır nedeniyle alınmadı" : "");

// ---- Yapay zekâ sağlayıcısı ----
const hubUrl = () => (TEST && process.env.IT_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
async function askModel(messages, maxTokens) {
  const p = providerInfo();
  if (data.settings.provider === "hub" && !p.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
  if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: data.settings.provider, messages }));
  try { return await net.chat({ base: p.base, key: p.key, model: p.model, messages, maxTokens }); } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
    throw new Error(msg);
  }
}

// ---- Genel kısayol: panodaki seçim yeni tablo olur (pano yalnız tuşa basıldığında okunur) ----
function applyShortcut() {
  try { globalShortcut.unregister(SHORTCUT); } catch { /* yok */ }
  shortcutOk = false;
  if (!data.settings.shortcut || process.env.IT_NO_SHORTCUT) return;
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => {
      try {
        const r = captureClipboard("kisayol");
        changed();
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: "Yeni: " + describe(r) + ". Sütun önizlemesini denetleyin.", silent: true }).show();
      } catch (err) {
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: String(err && err.message ? err.message : err), silent: true }).show();
      }
    });
  } catch { shortcutOk = false; }
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.insight-table");
    load();
    applyShortcut();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      const before = data.settings;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if (before.shortcut !== data.settings.shortcut) applyShortcut();
      for (const t of data.tables) t.sum = C.summarize(t, data.settings);
      return changed();
    });

    // İçerik
    handle("capture:text", (text, source) => {
      if (typeof text !== "string" || !text.trim()) throw new Error("Tablo içeren metni yapıştırın.");
      if (text.length > C.MAX_INPUT) throw new Error("Metin çok uzun (en çok 6 MB).");
      const r = addFrom(text, "", { ...sourceFrom(source), via: "metin" });
      return { text: describe(r), added: r.added, state: changed() };
    });
    handle("capture:clipboard", () => { const r = captureClipboard("dugme"); return { text: describe(r), added: r.added, state: changed() }; });
    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0, skipped = 0, empty = 0;
      for (const f of files) {
        let st;
        try { st = fs.statSync(f); } catch { skipped++; continue; }
        if (!st.isFile() || st.size > MAX_FILE || !FILE_EXT.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
        if (!text.trim()) { skipped++; continue; }
        const isHtml = /\.(html?|xhtml)$/i.test(f);
        try {
          const r = addFrom(isHtml ? "" : text, isHtml ? text : "", { via: "dosya", file: path.basename(f) });
          added += r.added;
          data.counters.files++;
        } catch { empty++; }
      }
      return { files: files.length, added, skipped, empty, state: changed() };
    });
    handle("capture:sample", () => {
      let added = 0;
      for (const s of SAMPLE.sources.slice().reverse()) added += addFrom(s.text || "", s.html || "", { url: s.url, title: s.title, via: "ornek", key: s.key, at: new Date(SAMPLE.BASE) }).added;
      data.active = data.tables[0].id;
      return { added, state: changed() };
    });

    // Tablo düzenleme (yalnız yerel; kaynak değerler değişmez)
    handle("table:open", (id) => { if (id) getTable(id); data.active = id || null; return changed(); });
    handle("table:rename", (id, name) => { const t = getTable(id); editable(t); t.name = C.str(name, 120).trim(); return changed(t); });
    handle("table:header", (id, n) => {
      const t = getTable(id); editable(t);
      const v = Math.max(0, Math.min(3, Number(n) || 0, t.raw.length - 1));
      t.headerRows = v;
      if (t.ai) t.ai.names = [];
      return changed(t);
    });
    handle("table:col", (id, i, patch) => {
      const t = getTable(id); editable(t);
      const c = t.cols[Number(i)];
      if (!c) throw new Error("Sütun bulunamadı.");
      patch = patch || {};
      if ("name" in patch) {
        const n = C.normName(C.str(patch.name, 120));
        if (n.length > 60) throw new Error("Sütun adı en çok 60 karakter olabilir.");
        c.name = n; c.nameFrom = n ? "elle" : "";
      }
      if ("type" in patch) { if (patch.type !== "oto" && !C.TYPES.includes(patch.type)) throw new Error("Geçersiz tür."); c.type = patch.type; }
      if ("include" in patch) c.include = !!patch.include;
      if ("pii" in patch) { if (!C.PII_ACTIONS.includes(patch.pii)) throw new Error("Geçersiz kişisel veri işlemi."); c.pii = patch.pii; }
      return changed(t);
    });
    handle("table:archive", (id) => { const t = getTable(id); editable(t); t.status = "arsiv"; const next = data.tables.find((x) => x.status === "aktif"); data.active = next ? next.id : t.id; return changed(t); });
    handle("table:restore", (id) => { const t = getTable(id); t.status = "aktif"; data.active = t.id; return changed(t); });
    handle("link:open", async (id) => {
      const t = getTable(id);
      const url = t.source.url;
      if (!url || !C.isWebUrl(url)) throw new Error("Kaynak adresi yok.");
      if (TEST) { testLog("opened.txt", url); return { opened: url }; }
      await shell.openExternal(url);
      return { opened: url };
    });

    // Dışa aktarma
    const fileBase = (t) => (C.fold(C.tableName(t)).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "tablo");
    handle("export:csv", async (id) => {
      const t = getTable(id);
      const r = C.exportCsv(t, data.settings);
      const file = await pickSave(fileBase(t) + ".csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, r.text, "utf8");
      // Diske yazılan dosya geri okunup yeniden denetlenir (gidiş-dönüş).
      const back = fs.readFileSync(file, "utf8");
      const disk = back === r.text ? 0 : 1;
      t.exports++;
      data.counters.csv++; data.counters.neutralized += r.neutralized; data.counters.masked += r.masked;
      data.counters.roundtrip++; data.counters.mismatch += r.mismatch + disk;
      const st = changed(t);
      return { file: path.basename(file), rows: r.rows, cols: r.cols, neutralized: r.neutralized, masked: r.masked, mismatch: r.mismatch + disk, dropped: r.dropped, state: st };
    });
    handle("export:json", async (id) => {
      const t = getTable(id);
      const r = C.exportJson(t, data.settings, { version: VERSION });
      const file = await pickSave(fileBase(t) + ".json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, r.text, "utf8");
      JSON.parse(fs.readFileSync(file, "utf8")); // geçerli JSON denetimi
      t.exports++;
      data.counters.json++; data.counters.masked += r.masked;
      const st = changed(t);
      return { file: path.basename(file), rows: r.rows, cols: r.cols, masked: r.masked, dropped: r.dropped, state: st };
    });
    handle("export:backup", async () => {
      const file = await pickSave("insight-table-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "insight-table", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, tables: data.tables.map(({ sum, ...t }) => t) }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ (tek tablo; her istek ayrı onaylı; yalnız sütun adı ve işaret)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:check", async (id) => {
      const t = getTable(id); editable(t);
      const p = C.aiPayload(t, data.settings);
      const prov = providerInfo();
      const by = p.sent.byType.map((x) => x.count + " " + x.label).join(", ");
      const ok = await approve("Bu tablo MyMind ile denetlensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.cols + " sütunun adı ve türü\n• İlk " + p.sent.rows + " satırın hücreleri (her hücre en çok 80 karakter)" +
        (p.sent.piiCols ? "\n• " + p.sent.piiCols + " kişisel veri sütununun değerleri GÖNDERİLMEZ (yalnız tür adı)" : "") + (by ? "\n• Metin içindeki " + by + " ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") +
        "\n• Kaynak adresi, dosya adı ve diğer satırlar gönderilmez\n\nMyMind yalnız sütun adı önerir ve olası eksik/hatalı değerleri işaretler. Hücre değeri önerileri atılır; hiçbir hücre değiştirilmez. Uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 900), p, t, data.settings);
      t.ai = { ...res, at: now().toISOString() };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      data.counters.aiCellBlocked += res.cellBlocked;
      return { approved: true, names: res.names.length, flags: res.flags.length, dropped: res.dropped, state: changed(t) };
    });
    handle("ai:apply", (id) => {
      const t = getTable(id); editable(t);
      if (!t.ai || !t.ai.names.length) throw new Error("Uygulanacak MyMind ad önerisi yok.");
      let n = 0;
      for (const s of t.ai.names) { const c = t.cols[s.col]; if (!c) continue; c.name = s.name; c.nameFrom = "mymind"; n++; }
      t.ai.names = [];
      return { applied: n, state: changed(t) };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
