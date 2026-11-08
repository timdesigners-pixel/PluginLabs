/* Insight Table — masaüstü kabuğu.
 * Kullanıcının seçtiği HTML tablo/liste, Markdown, TSV veya CSV metnini sütun önizlemesi ve veri tipi kontrolüyle tabloya dönüştürür.
 * Site genelinde izinsiz tarama yapmaz; yalnız kullanıcının yapıştırdığı, panodan aldığı veya seçtiği yerel dosyayı işler. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.IT_USER_DATA) app.setPath("userData", process.env.IT_USER_DATA);
const TEST = process.env.IT_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), tables: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "tablolar.bin" : "tablolar.json");
const testLog = (file, line) => { if (TEST) fs.appendFileSync(path.join(TEST, file), line + "\n"); };
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

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
    data.active = data.tables.some((x) => x.id === d.active) ? d.active : (data.tables[0] ? data.tables[0].id : null);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

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

function view() {
  const active = data.tables.find((x) => x.id === data.active) || data.tables[0] || null;
  return {
    settings: data.settings,
    tables: data.tables,
    active: active ? active.id : null,
    metrics: C.metrics(data.tables, data.counters),
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getTable(id) { const t = data.tables.find((x) => x.id === (id || data.active)); if (!t) throw new Error("Tablo bulunamadı."); return t; }

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
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
  const r = await dialog.showOpenDialog(win, { title: "Tablo/liste dosyası seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Tablo / Metin", extensions: ["html", "htm", "md", "csv", "tsv", "txt"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

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
  return await net.chat({ base: p.base, key: p.key, model: p.model, messages, maxTokens });
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => {
    if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
    return fn(...a);
  });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.insight-table");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("capture:text", (text, meta) => {
      meta = meta || {};
      if (meta.sourceUrl && !C.isWebUrl(meta.sourceUrl)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
      const tbl = C.buildTable(text, meta);
      data.tables.unshift(tbl);
      data.active = tbl.id;
      data.counters.extracted++;
      return { tableId: tbl.id, rowCount: tbl.rows.length, colCount: tbl.columns.length, state: changed() };
    });

    handle("capture:clipboard", () => {
      const html = clipboard.readHTML();
      const text = clipboard.readText();
      const raw = (html && /<(table|ul|ol|li)[\s>]/i.test(html)) ? html : text;
      if (!raw || !raw.trim()) throw new Error("Panoda tablo ya da liste metni yok. Sayfada tabloyu seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
      const tbl = C.buildTable(raw, { title: "Panodan çıkarılan tablo", sourceType: "pano" });
      data.tables.unshift(tbl);
      data.active = tbl.id;
      data.counters.extracted++;
      return { tableId: tbl.id, rowCount: tbl.rows.length, colCount: tbl.columns.length, state: changed() };
    });

    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, 10);
      if (!files.length) return { cancelled: true };
      let added = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(html|htm|md|csv|tsv|txt)$/i.test(f)) { skipped++; continue; }
        const raw = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        if (!raw.trim()) { skipped++; continue; }
        const tbl = C.buildTable(raw, { title: path.basename(f), sourceType: "dosya" });
        data.tables.unshift(tbl);
        data.active = tbl.id;
        data.counters.extracted++;
        added++;
      }
      return { added, skipped, state: changed() };
    });

    handle("capture:sample", () => {
      let added = 0;
      for (const s of [...SAMPLE.samples].reverse()) {
        if (data.tables.some((t) => t.sampleKey === s.key)) continue;
        const tbl = C.buildTable(s.text, { title: s.title, sourceUrl: s.sourceUrl, sourceType: s.sourceType, sampleKey: s.key });
        data.tables.unshift(tbl);
        data.counters.extracted++;
        added++;
      }
      if (data.tables[0]) data.active = data.tables[0].id;
      return { added, state: changed() };
    });

    handle("table:open", (id) => { getTable(id); data.active = id; return changed(); });
    handle("table:updateColumn", (id, colIndex, patch) => {
      const tbl = getTable(id);
      const col = tbl.columns[Number(colIndex)];
      if (!col) throw new Error("Sütun bulunamadı.");
      if (patch.name !== undefined) col.name = C.str(patch.name, 80).trim() || col.originalName;
      if (patch.type !== undefined && C.COL_TYPES.includes(patch.type)) col.type = patch.type;
      if (patch.included !== undefined) col.included = !!patch.included;
      C.recomputeTable(tbl);
      return changed();
    });
    handle("table:editCell", (id, rowIndex, colIndex, value) => {
      const tbl = getTable(id);
      tbl.edits = tbl.edits || {};
      tbl.edits[Number(rowIndex) + ":" + Number(colIndex)] = C.str(value, 500);
      C.recomputeTable(tbl);
      return changed();
    });
    handle("table:resetCell", (id, rowIndex, colIndex) => {
      const tbl = getTable(id);
      if (tbl.edits) delete tbl.edits[Number(rowIndex) + ":" + Number(colIndex)];
      C.recomputeTable(tbl);
      return changed();
    });

    handle("source:open", async (id) => {
      const tbl = getTable(id);
      if (!tbl.sourceUrl || !C.isWebUrl(tbl.sourceUrl)) throw new Error("Bu tablonun web kaynak adresi yok.");
      if (TEST) { testLog("opened.txt", tbl.sourceUrl); return { opened: tbl.sourceUrl }; }
      await shell.openExternal(tbl.sourceUrl);
      return { opened: tbl.sourceUrl };
    });

    handle("export:csv", async (id, opts) => {
      const tbl = getTable(id);
      const file = await pickSave(C.slugCol(tbl.title, 0) + ".csv", "csv");
      if (!file) return { cancelled: true };
      const out = C.exportCsv(tbl, { maskPii: opts && opts.maskPii !== undefined ? opts.maskPii : data.settings.maskPiiByDefault, delimiter: data.settings.csvDelimiter });
      fs.writeFileSync(file, out.csv, "utf8");
      data.counters.exports++;
      data.counters.formulaEscaped += out.escapedFormulas;
      return { file: path.basename(file), rowCount: out.rowCount, escapedFormulas: out.escapedFormulas, state: changed() };
    });

    handle("export:json", async (id, opts) => {
      const tbl = getTable(id);
      const file = await pickSave(C.slugCol(tbl.title, 0) + ".json", "json");
      if (!file) return { cancelled: true };
      const out = C.exportJson(tbl, { maskPii: opts && opts.maskPii !== undefined ? opts.maskPii : data.settings.maskPiiByDefault, includeTrace: true });
      fs.writeFileSync(file, out.json, "utf8");
      data.counters.exports++;
      return { file: path.basename(file), rowCount: out.rowCount, state: changed() };
    });

    handle("export:backup", async () => {
      const file = await pickSave("insight-table-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "insight-table", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, tables: data.tables }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:normalize", async (id) => {
      const tbl = getTable(id);
      const p = C.aiPayload(tbl);
      const prov = providerInfo();
      const ok = await approve(
        "Sütun adları ve tipleri MyMind ile normalleştirilsin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.colCount + " sütun başlığı ve ilk " + p.sent.sampleRows + " satır örneği (" + p.sent.chars + " karakter)\n• " + p.sent.maskedCount + " kişisel veri (e-posta/telefon/IBAN/TCKN) maskelendi — gerçek değerler ve kaynak adresi gönderilmez.\n• Eksik hücreler kaynaksız tamamlanmaz.",
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 600), tbl);
      tbl.ai = res;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, dropped: res.dropped, state: changed() };
    });

    handle("ai:apply", (id) => {
      const tbl = getTable(id);
      if (!tbl.ai) throw new Error("Önce MyMind sütun önerisi alın.");
      for (const c of tbl.ai.columns) {
        if (tbl.columns[c.index]) {
          tbl.columns[c.index].name = c.name;
          tbl.columns[c.index].key = c.key;
          tbl.columns[c.index].type = c.type;
        }
      }
      C.recomputeTable(tbl);
      return changed();
    });

    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
