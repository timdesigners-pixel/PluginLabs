/* Permission Radar — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Notion kartı (PL-047):
 *  • MVP ve temel akış: İzin verildiğinde eklenti izinlerini okunabilir kartlara dönüştür; değişim geçmişi ve Chrome’un yönetim ekranına yönlendirme.
 *  • Yapay zekânın rolü: İzinlerin ne anlama geldiğini açıklar; zararlı yazılım tespiti yaptığı iddiası taşımaz.
 *  • Teknik sınırlar: Diğer eklentilerin iç verisine eriştiği varsayılmaz.
 *  • Doğrulama ölçütü: Test eklentilerinde izin açıklamasının doğruluğu; bilinmeyen kapsamın açık etiketlenmesi. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.PR_USER_DATA) app.setPath("userData", process.env.PR_USER_DATA);
const TEST = process.env.PR_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  items: [],
  active: null,
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "permission-radar.bin" : "permission-radar.json");
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
    data.items = Array.isArray(d.items) ? d.items : [];
    data.active = data.items.some((x) => x.id === d.active) ? d.active : (data.items[0] ? data.items[0].id : null);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başla */ }
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
  if (key == null || key === "") { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{12,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

function view() {
  const gold = data.items.some((x) => x.id === "ext-fiyat-takip") ? C.evaluateGoldAccuracy(data.items, SAMPLE.GOLD_CHECKS) : null;
  const m = C.metrics(data.items, data.counters, gold);
  return {
    settings: data.settings,
    items: data.items,
    active: data.active,
    metrics: m,
    gold,
    disclaimer: C.MALWARE_DISCLAIMER,
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { const v = view(); if (win && !win.isDestroyed()) win.webContents.send("state:changed", v); };
function changed() { save(); push(); return view(); }

const webPreferences = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false });
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Permission Radar", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const hubUrl = () => (TEST && process.env.PR_HUB_URL) || net.HUB_URL;
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

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.permission-radar");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) {
        throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      }
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("inv:loadSample", () => {
      data.items = SAMPLE.buildSampleInventory();
      data.active = data.items[0] ? data.items[0].id : null;
      return { count: data.items.length, state: changed() };
    });

    handle("inv:open", (id) => {
      const x = data.items.find((i) => i.id === id);
      if (!x) throw new Error("Eklenti kaydı bulunamadı.");
      data.active = x.id;
      return changed();
    });

    handle("inv:inspectJson", (rawJson, customId) => {
      let parsed = null;
      try { parsed = JSON.parse(String(rawJson || "")); } catch { throw new Error("Geçerli bir manifest.json metni yapıştırın."); }
      const r = C.upsertExtensionManifest(data.items, parsed, { id: customId || parsed.id });
      data.items = r.list;
      data.active = r.item.id;
      return { id: r.item.id, isUpdate: r.isUpdate, unknownCount: r.item.unknownCount, diff: r.diff, state: changed() };
    });

    handle("inv:openChromeManage", (id) => {
      const x = data.items.find((i) => i.id === id);
      const url = x ? x.chromeManageUrl : C.CHROME_EXTENSIONS_URL;
      clipboard.writeText(url);
      data.counters.chromeOpened++;
      save();
      if (TEST) testLog("chrome-manage.txt", url);
      return { url, copiedToClipboard: true, state: changed() };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:explain", async (id) => {
      const x = data.items.find((i) => i.id === id);
      if (!x) throw new Error("Eklenti seçilmedi.");
      const payload = C.aiPayload(x);
      const prov = providerInfo();
      const ok = await approve(
        `“${x.name}” izinleri MyMind ile açıklansın mı?`,
        `Hedef: ${prov.name} — yalnız bu bilgisayar.\nGönderilecekler:\n• Eklenti adı, sürümü ve ${payload.sent.permissionCount} izin kodu (${payload.sent.chars} karakter)\n• Diğer eklentilerin iç verisine erişilmez; zararlı yazılım tespiti iddiası taşınmaz.`,
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAiExplanation(await askModel(payload.messages, 500), x);
      x.aiExplanation = res;
      data.counters.aiRuns++;
      return { approved: true, droppedClaims: res.droppedMalwareClaims, state: changed() };
    });

    handle("export:csv", async () => {
      const file = await pickSave("permission-radar-envanter.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.items), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.items.length };
    });
    handle("export:md", async () => {
      const file = await pickSave("permission-radar-politika-raporu.md", "md");
      if (!file) return { cancelled: true };
      const v = view();
      fs.writeFileSync(file, C.exportMd(data.items, v.metrics), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.items.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("permission-radar-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "permission-radar", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, items: data.items }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
