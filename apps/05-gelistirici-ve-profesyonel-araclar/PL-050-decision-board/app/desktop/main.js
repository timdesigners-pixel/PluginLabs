/* Decision Board (PL-050) — masaüstü kabuğu.
 * Seçenekleri, kriterleri ve ağırlıkları kaynaklı bir karar matrisinde karşılaştırır;
 * her puanın hangi veri ve ağırlıktan türediğini (%100 izlenebilirlik) denetler;
 * artı/eksi listesi, duyarlılık analizi, eksik kriter / çelişki denetimi ve tarihçeli karar günlüğü (ADR) üretir.
 * Finansal ve hukuki kararlar için uzman süreci yerine geçmez. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.DB_USER_DATA) app.setPath("userData", process.env.DB_USER_DATA);
const TEST = process.env.DB_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  board: C.normalizeBoard({ title: "Yeni Karar Panosu", options: [], criteria: [], cells: {} }),
  decisionLog: [],
  counters: { decisions: 0, exports: 0, aiRuns: 0, aiDroppedPreferences: 0 },
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "karar-panosu.bin" : "karar-panosu.json");
const testLog = (file, line) => { if (TEST) fs.appendFileSync(path.join(TEST, file), line + "\n"); };
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.DB_NOW ? new Date(process.env.DB_NOW) : new Date());

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
    if (d.board) data.board = C.normalizeBoard(d.board);
    data.decisionLog = Array.isArray(d.decisionLog) ? d.decisionLog.slice(0, 500) : [];
    if (d.counters && typeof d.counters === "object") {
      data.counters = {
        decisions: Number(d.counters.decisions) || 0,
        exports: Number(d.counters.exports) || 0,
        aiRuns: Number(d.counters.aiRuns) || 0,
        aiDroppedPreferences: Number(d.counters.aiDroppedPreferences) || 0,
      };
    }
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
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) {
    throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  }
  if (vault()) {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim()));
    memoryKey = null;
    return "vault";
  }
  memoryKey = key.trim();
  return "memory";
}

function view() {
  const evaluation = C.evaluateBoard(data.board);
  return {
    settings: data.settings,
    board: data.board,
    evaluation,
    decisionLog: data.decisionLog,
    counters: data.counters,
    now: now().toISOString(),
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

const webPreferences = () => ({
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
  spellcheck: false,
});

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1040,
    minHeight: 640,
    useContentSize: true,
    autoHideMenuBar: true,
    title: "Decision Board",
    icon: path.join(root, "icons", "icon256.png"),
    backgroundColor: "#0e1322",
    show: false,
    webPreferences: webPreferences(),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}

async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, {
    type: "question",
    buttons: [okLabel, "Vazgeç"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
    title: "Onay",
    message,
    detail,
  });
  return r.response === 0;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, {
    title: "Kaydet",
    defaultPath: name,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const hubUrl = () => (TEST && process.env.DB_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
async function askModel(messages, maxTokens) {
  const p = providerInfo();
  if (data.settings.provider === "hub" && !p.key) {
    throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
  }
  if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: data.settings.provider, messages }));
  try {
    return await net.chat({ base: p.base, key: p.key, model: p.model, messages, maxTokens });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/ECONNREFUSED|fetch failed/i.test(msg)) {
      throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632)." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
    }
    throw new Error(msg);
  }
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => {
    assertOwn(e);
    return fn(...a);
  });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.decision-board");
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

    handle("board:loadSample", () => {
      data.board = C.normalizeBoard(JSON.parse(JSON.stringify(SAMPLE.sampleBoard)));
      return changed();
    });
    handle("board:updateMeta", (patch) => {
      patch = patch || {};
      if ("title" in patch) data.board.title = C.str(patch.title, 180).trim() || data.board.title;
      if ("context" in patch) data.board.context = C.str(patch.context, 800).trim();
      if ("domain" in patch && C.DOMAINS.includes(patch.domain)) data.board.domain = patch.domain;
      if ("selectedOptionId" in patch) data.board.selectedOptionId = C.str(patch.selectedOptionId, 64);
      if ("draftRationale" in patch) data.board.draftRationale = C.str(patch.draftRationale, 1000).trim();
      data.board.updatedAt = Date.now();
      return changed();
    });
    handle("board:addOption", (optInput) => {
      data.board = C.addOption(data.board, optInput || {});
      return changed();
    });
    handle("board:addCriterion", (critInput) => {
      data.board = C.addCriterion(data.board, critInput || {});
      return changed();
    });
    handle("board:updateWeight", (criterionId, weight) => {
      data.board = C.updateCriterionWeight(data.board, criterionId, weight);
      return changed();
    });
    handle("board:updateCell", (optionId, criterionId, patch) => {
      data.board = C.updateCell(data.board, optionId, criterionId, patch || {});
      return changed();
    });
    handle("board:recordDecision", (input) => {
      const res = C.recordDecision(data.board, input || {}, data.decisionLog, now().toISOString());
      data.board = res.board;
      data.decisionLog = res.decisionLog;
      data.counters.decisions++;
      return { entry: res.entry, state: changed() };
    });

    handle("export:md", async () => {
      const file = await pickSave("karar-gunlugu-adr.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportAdrMd(data.board, data.decisionLog), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), state: view() };
    });
    handle("export:csv", async () => {
      const file = await pickSave("karar-matrisi.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.board), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), state: view() };
    });
    handle("export:backup", async () => {
      const file = await pickSave("decision-board-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(
        file,
        JSON.stringify({ app: "decision-board", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, board: data.board, decisionLog: data.decisionLog }, null, 2),
        "utf8"
      );
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => {
      const r = { stored: writeKey(key) };
      push();
      return r;
    });
    handle("ai:analyze", async () => {
      const p = C.aiPayload(data.board);
      const prov = providerInfo();
      const ok = await approve(
        "Karar matrisi eksik kriter ve çelişkiler için MyMind ile incelensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Panodaki seçenekler (" + p.sent.optionsCount + "), kriterler (" + p.sent.criteriaCount + ") ve hücre gerekçeleri (" + p.sent.chars + " karakter)\n\nModelin rolü (Notion): Yalnızca eksik kriter ve çelişki önerir; sizin ağırlıklarınızı veya kazanan tercihinizi değiştirmesine izin verilmez.",
        "İncele"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 700), data.board);
      data.board.aiSuggestions = res;
      data.counters.aiRuns++;
      data.counters.aiDroppedPreferences += res.droppedPreferences;
      return { approved: true, ai: res, state: changed() };
    });
    handle("ai:applyCriterion", (critObj) => {
      const name = C.str(critObj && critObj.name, 120).trim();
      if (!name) throw new Error("Eklenecek kriter adı boş.");
      data.board = C.addCriterion(data.board, {
        name,
        weight: 6,
        defaultScore: 7,
        defaultEvidence: C.str(critObj && critObj.reason, 240) || "MyMind eksik kriter önerisinden eklendi; ekip değerlendirmesi.",
        defaultSource: "Karar Toplantısı Notu",
      });
      if (data.board.aiSuggestions && Array.isArray(data.board.aiSuggestions.missingCriteria)) {
        data.board.aiSuggestions.missingCriteria = data.board.aiSuggestions.missingCriteria.filter((m) => m.name !== name);
      }
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
