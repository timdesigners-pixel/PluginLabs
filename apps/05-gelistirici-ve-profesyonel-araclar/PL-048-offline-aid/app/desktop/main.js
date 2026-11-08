/* Offline Aid — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Notion kartı (PL-048):
 *  • MVP ve temel akış: Uyumlu yerel model seçimi, cihaz kaynak kontrolü ve metin özetleme/düzenleme. İlk sürüm tek onaylı model ailesi.
 *  • Yapay zekânın rolü: Çıkarımı yerelde yapar; düşük donanımda basit görev ve modelsiz alternatif sunar.
 *  • Teknik sınırlar: Model lisansı, RAM/VRAM gereksinimi ve güncelleme kaynağı görünür. Çevrimdışı diye tüm risklerin yok olduğu iddia edilmez.
 *  • Doğrulama ölçütü: Ağsız testte görev tamamlama; dışa giden model isteği sıfır; donanım bazlı gecikme raporu. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.OA_USER_DATA) app.setPath("userData", process.env.OA_USER_DATA);
const TEST = process.env.OA_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  tasks: [],
  active: null,
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "offline-aid.bin" : "offline-aid.json");
const testLog = (file, line) => { if (TEST) fs.appendFileSync(path.join(TEST, file), line + "\n"); };
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

function systemHw() {
  const cpus = os.cpus() || [];
  return {
    totalRamGb: C.round2(os.totalmem() / (1024 ** 3)),
    freeRamGb: C.round2(os.freemem() / (1024 ** 3)),
    cpuCores: Math.max(1, cpus.length),
    cpuModel: cpus[0] && cpus[0].model ? cpus[0].model.trim() : "Yerel x64 İşlemci",
    vramGb: 0,
  };
}

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
    data.tasks = Array.isArray(d.tasks) ? d.tasks : [];
    data.active = data.tasks.some((x) => x.id === d.active) ? d.active : (data.tasks[0] ? data.tasks[0].id : null);
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
  if (key == null || key === "") { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{12,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

function view() {
  const hwEval = C.evaluateHardwareResources(systemHw(), data.settings.selectedModelId);
  const m = C.metrics(data.tasks, data.counters, hwEval);
  return {
    settings: data.settings,
    models: C.APPROVED_MODEL_FAMILY,
    hardware: hwEval,
    tasks: data.tasks,
    active: data.active,
    metrics: m,
    disclaimer: C.OFFLINE_RISK_DISCLAIMER,
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
    title: "Offline Aid", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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

const hubUrl = () => (TEST && process.env.OA_HUB_URL) || net.HUB_URL;
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
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632)." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
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
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.offline-aid");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) {
        data.counters.blockedExternalUrls++;
        save();
        push();
        throw new Error("Dış ağ adresi engellendi: yalnız bu bilgisayar (http://127.0.0.1:… ya da http://localhost:…) kullanılabilir.");
      }
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("task:loadSample", () => {
      const hw = systemHw();
      const samples = SAMPLE.buildSampleTasks(hw);
      const existing = new Set(data.tasks.map((t) => t.id));
      let added = 0;
      for (const s of samples) {
        if (!existing.has(s.id)) { data.tasks.push(s); added++; }
      }
      if (data.tasks[0]) data.active = data.tasks[0].id;
      return { added, state: changed() };
    });

    handle("task:open", (id) => {
      const t = data.tasks.find((x) => x.id === id);
      if (!t) throw new Error("Görev kaydı bulunamadı.");
      data.active = t.id;
      return changed();
    });

    handle("task:runRuleBased", (input) => {
      input = input || {};
      const rawText = C.str(input.text, C.MAX_TEXT).trim();
      if (!rawText) throw new Error("İşlenecek metni girin.");
      const mode = C.TASK_MODES.includes(input.mode) ? input.mode : data.settings.defaultMode;
      const prep = data.settings.maskSensitive ? C.maskSensitiveText(rawText) : { text: rawText, maskedCount: 0 };
      const r = C.runRuleBasedTask(prep.text, mode);
      const rec = C.buildTaskRecord({
        id: "task-" + Date.now(),
        title: input.title || rawText.split("\n")[0].slice(0, 90),
        mode,
        inputText: rawText,
        outputText: r.output,
        modelId: "modelsiz:kural-tabanli",
        latencyMs: r.latencyMs,
        hwSnapshot: systemHw(),
        maskedCount: prep.maskedCount,
      });
      data.tasks.unshift(rec);
      data.active = rec.id;
      return { taskId: rec.id, latencyMs: rec.latencyMs, state: changed() };
    });

    handle("task:runLocalLlm", async (input) => {
      input = input || {};
      const rawText = C.str(input.text, C.MAX_TEXT).trim();
      if (!rawText) throw new Error("İşlenecek metni girin.");
      const mode = C.TASK_MODES.includes(input.mode) ? input.mode : data.settings.defaultMode;
      const modelId = input.modelId && input.modelId !== "modelsiz:kural-tabanli" ? input.modelId : "qwen2.5:1.5b-instruct-q4_k_m";
      const payload = C.localLlmPayload(rawText, mode, data.settings.maskSensitive);
      const prov = providerInfo();
      const ok = await approve(
        "Metin cihazdaki yerel modelle işlensin mi?",
        `Hedef: ${prov.name} — yalnız bu bilgisayar (dış ağ isteği: 0).\nGönderilecekler:\n• Görev türü: ${C.TASK_MODE_NAMES[mode]}\n• Metin (${payload.sentChars} karakter; ${payload.maskedCount} hassas veri maskelendi)\n• Çevrimdışı çalışma dış ağ sızıntısını önler ancak model çıktısını kontrol edin.`,
        "Yerelde Çalıştır"
      );
      if (!ok) return { approved: false };
      const t0 = Date.now();
      const out = await askModel(payload.messages, 600);
      const latencyMs = Math.max(1, Date.now() - t0);
      const rec = C.buildTaskRecord({
        id: "task-" + Date.now(),
        title: input.title || rawText.split("\n")[0].slice(0, 90),
        mode,
        inputText: rawText,
        outputText: out.trim(),
        modelId,
        latencyMs,
        hwSnapshot: systemHw(),
        maskedCount: payload.maskedCount,
      });
      data.tasks.unshift(rec);
      data.active = rec.id;
      return { approved: true, taskId: rec.id, latencyMs, state: changed() };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });

    handle("export:txt", async () => {
      const file = await pickSave("offline-aid-cikti.txt", "txt");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportTxt(data.tasks), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.tasks.length };
    });
    handle("export:md", async () => {
      const file = await pickSave("offline-aid-gecikme-raporu.md", "md");
      if (!file) return { cancelled: true };
      const v = view();
      fs.writeFileSync(file, C.exportMd(data.tasks, v.metrics), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.tasks.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("offline-aid-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "offline-aid", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, tasks: data.tasks }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
