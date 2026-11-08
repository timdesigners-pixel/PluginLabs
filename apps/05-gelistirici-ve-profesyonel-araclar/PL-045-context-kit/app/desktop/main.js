/* Context Kit (PL-045) — masaüstü kabuğu.
 * Seçilen dosya ve sayfalardan boyut ve token sınırı olan, önizlenebilir AI bağlam paketleri hazırlar;
 * göreve göre dosya/parça sıralar (tüm depoyu otomatik göndermez); hariç tutma kuralları, sır/API anahtarı/kişisel veri maskeleme
 * ve kaynak içi istem enjeksiyonu işaretlemesi uygular (kaynak içi talimatlar veri sayılır);
 * kullanıcı onayıyla Markdown, XML ve JSON bağlam paketi dışa aktarır. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.CK_USER_DATA) app.setPath("userData", process.env.CK_USER_DATA);
const TEST = process.env.CK_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 30;

let win = null;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  sources: [],
  activeSourceId: null,
  aiSuggestion: null,
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "baglam.bin" : "baglam.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
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
    data.sources = Array.isArray(d.sources) ? d.sources.slice(0, C.MAX_FILES) : [];
    data.activeSourceId = d.activeSourceId || (data.sources[0] ? data.sources[0].id : null);
    data.aiSuggestion = d.aiSuggestion || null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

function view() {
  const pkg = C.buildContextPackage(data.sources, data.settings);
  if (!pkg.items.some((i) => i.id === data.activeSourceId)) {
    data.activeSourceId = pkg.items[0] ? pkg.items[0].id : null;
  }
  const hasSample = data.sources.some((s) => s.sampleKey);
  const benchmark = hasSample ? C.evaluateBenchmark(pkg, SAMPLE.goldRequiredPaths) : null;
  return {
    settings: data.settings,
    sourcesCount: data.sources.length,
    items: pkg.items,
    includedItems: pkg.includedItems,
    excludedItems: pkg.excludedItems,
    treeText: pkg.treeText,
    stats: pkg.stats,
    benchmark,
    activeSourceId: data.activeSourceId,
    aiSuggestion: data.aiSuggestion,
    mdPreview: C.exportMarkdownPackage(pkg, data.aiSuggestion),
    xmlPreview: C.exportXmlPackage(pkg, data.aiSuggestion),
    jsonPreview: C.exportJsonPackage(pkg, data.aiSuggestion),
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
    untrustedDisclaimer: C.UNTRUSTED_DISCLAIMER,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

const webPreferences = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false });
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Context Kit", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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
  const r = await dialog.showOpenDialog(win, { title: "Bağlam için dosya veya sayfa seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Kaynak / Belge", extensions: ["js", "ts", "jsx", "tsx", "py", "go", "rs", "md", "json", "css", "html", "txt", "yml", "yaml"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() {
  if (memoryKey) return memoryKey;
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* yok */ }
  return null;
}
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}
const hubUrl = () => (TEST && process.env.CK_HUB_URL) || net.HUB_URL;
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
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error("Model sunucusuna bağlanılamadı.");
    throw new Error(msg);
  }
}

function addSourceItem(contentText, opts) {
  opts = opts || {};
  const raw = C.str(contentText, C.MAX_FILE_CHARS).trim();
  if (!raw) throw new Error("Eklenecek dosya veya sayfa içeriği boş.");
  if (opts.url && !C.isWebUrl(opts.url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayabilir.");
  const relPath = C.str(opts.path || opts.title || `kaynak-${data.sources.length + 1}.txt`, 240).replace(/\\/g, "/");
  const item = {
    id: C.uid(),
    path: relPath,
    title: C.str(opts.title || relPath, 180),
    kind: opts.kind === "page" ? "page" : "file",
    url: opts.url ? String(opts.url).trim() : "",
    content: raw,
    manualIncluded: typeof opts.manualIncluded === "boolean" ? opts.manualIncluded : null,
    sampleKey: C.str(opts.sampleKey || "", 40),
  };
  data.sources.push(item);
  data.activeSourceId = item.id;
  data.counters.sourcesAdded++;
  return item;
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.context-kit");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("source:add", (payload) => {
      payload = payload || {};
      const item = addSourceItem(payload.content, {
        path: payload.path || payload.title || "yeni-dosya.js",
        title: payload.title || payload.path || "Yeni kaynak",
        kind: payload.kind || "file",
        url: payload.url || "",
      });
      const st = changed();
      return { id: item.id, includedCount: st.stats.includedCount, state: st };
    });
    handle("source:clipboard", () => {
      const text = clipboard.readText();
      if (!text || !text.trim()) throw new Error("Panoda kaynak kod veya sayfa metni yok.");
      const item = addSourceItem(text, {
        path: `pano/kesit-${data.counters.clipboardRun + 1}.txt`,
        title: "Panodan alınan kesit",
        kind: "file",
      });
      data.counters.clipboardRun++;
      const st = changed();
      return { id: item.id, tokens: C.estimateTokens(text), state: st };
    });
    handle("source:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let loaded = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        try {
          addSourceItem(text, { path: path.basename(f), title: path.basename(f), kind: "file" });
          loaded++; data.counters.filesLoaded++;
        } catch { skipped++; }
      }
      return { files: files.length, loaded, skipped, state: changed() };
    });
    handle("source:sample", () => {
      data.sources = [];
      data.aiSuggestion = null;
      data.settings.taskQuery = SAMPLE.defaultTaskQuery;
      for (const s of SAMPLE.items) {
        addSourceItem(s.content, { path: s.path, title: s.title, kind: s.kind, url: s.url, sampleKey: s.key });
      }
      const st = changed();
      return { count: SAMPLE.items.length, includedCount: st.stats.includedCount, state: st };
    });

    handle("source:select", (sourceId) => {
      if (data.sources.some((s) => s.id === sourceId)) data.activeSourceId = sourceId;
      return changed();
    });
    handle("source:toggle", (sourceId, manualIncluded) => {
      const src = data.sources.find((s) => s.id === sourceId);
      if (!src) throw new Error("Kaynak bulunamadı.");
      src.manualIncluded = typeof manualIncluded === "boolean" ? manualIncluded : null;
      return changed();
    });

    handle("export:md", async () => {
      const pkg = C.buildContextPackage(data.sources, data.settings);
      if (!pkg.includedItems.length) throw new Error("Dışa aktarmak için pakette en az bir dahil edilen kaynak olmalı.");
      const ok = await approve(
        "Boyut sınırlı AI bağlam paketi Markdown (.md) olarak dışa aktarılsın mı?",
        `Toplam ${pkg.includedItems.length} kaynak (${pkg.stats.packageTokens} token, %${pkg.stats.sizeReductionPct} boyut azalması, ${pkg.stats.totalRedactions} sır maskelendi) kaydedilecek.`,
        "Paketi kaydet"
      );
      if (!ok) return { cancelled: true };
      const file = await pickSave("context-package.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMarkdownPackage(pkg, data.aiSuggestion), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: pkg.includedItems.length };
    });
    handle("export:xml", async () => {
      const pkg = C.buildContextPackage(data.sources, data.settings);
      if (!pkg.includedItems.length) throw new Error("Dışa aktarmak için pakette en az bir dahil edilen kaynak olmalı.");
      const file = await pickSave("context-package.xml", "xml");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportXmlPackage(pkg, data.aiSuggestion), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: pkg.includedItems.length };
    });
    handle("export:json", async () => {
      const pkg = C.buildContextPackage(data.sources, data.settings);
      if (!pkg.includedItems.length) throw new Error("Dışa aktarmak için pakette en az bir dahil edilen kaynak olmalı.");
      const file = await pickSave("context-package.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportJsonPackage(pkg, data.aiSuggestion), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: pkg.includedItems.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("context-kit-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "context-kit", version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:brief", async () => {
      if (!data.sources.length) throw new Error("Önce dosya veya sayfa kaynakları ekleyin.");
      const pkg = C.buildContextPackage(data.sources, data.settings);
      const p = C.aiPayload(pkg);
      const prov = providerInfo();
      const ok = await approve(
        "Göreve göre dosya/parça sıralaması ve kısa bağlam özeti için MyMind çalıştırılsın mı?",
        `Hedef: ${prov.name} — yalnız bu bilgisayar.\nGönderilecekler:\n• Görev tanımı ve ${p.sent.fileCount} aday dosyanın yol/alaka/token bilgisi (${p.sent.chars} karakter)\n• Tüm depo veya ham sırlar gönderilmez.`,
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 700), pkg.items);
      data.aiSuggestion = res;
      data.counters.aiRuns++;
      return { approved: true, count: res.priorityPaths.length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", () => {
      if (!data.aiSuggestion || !Array.isArray(data.aiSuggestion.priorityPaths)) throw new Error("Önce MyMind bağlam özeti ve sıralama önerisi alın.");
      const prio = new Set(data.aiSuggestion.priorityPaths);
      let applied = 0;
      for (const s of data.sources) {
        if (prio.has(s.path)) { s.manualIncluded = true; applied++; }
      }
      return { applied, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
