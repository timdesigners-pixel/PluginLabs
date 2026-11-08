/* Model Switchboard — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Notion kartı (PL-046):
 *  • Resmi API anahtarıyla tek panel; model kataloğu, istek maliyeti tahmini ve aynı görevde yan yana değerlendirme. İlk sürüm iki sağlayıcı.
 *  • Yapay zekânın rolü: Görev türüne göre model önerir; hız/kalite ölçümünü kayıtlı test sonucuna bağlar.
 *  • Teknik sınırlar: Fiyatlar sağlayıcıdan doğrulanmalı ve tarihli olmalı; limit aşımı için kullanıcı bütçe tavanı. Tüketici web hesabı çerezi kullanılmaz.
 *  • Doğrulama ölçütü: Görev başına gerçek maliyet görünürlüğü %100; bütçe tavanı aşımı sıfır hedefi. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.MS_USER_DATA) app.setPath("userData", process.env.MS_USER_DATA);
const TEST = process.env.MS_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let memoryKey = null;
let memoryProviderKeys = { openai: null, anthropic: null };
let data = {
  settings: C.normalizeSettings({}),
  catalog: C.normalizeCatalog(C.DEFAULT_CATALOG),
  runs: [],
  active: null,
  lastAiRec: null,
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "switchboard.bin" : "switchboard.json");
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
    data.catalog = C.normalizeCatalog(d.catalog);
    data.runs = Array.isArray(d.runs) ? d.runs.slice(0, C.MAX_RUNS) : [];
    data.active = data.runs.some((x) => x.id === d.active) ? d.active : (data.runs[0] ? data.runs[0].id : null);
    data.lastAiRec = d.lastAiRec || null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: varsayılanla başla */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Resmi API anahtarları ve MyMind anahtarı (Windows kasasında DPAPI şifreli; çerez kabul edilmez) ----
const keyFile = (name) => path.join(app.getPath("userData"), `${name}-key.bin`);
function readKey(name = "mymind") {
  if (name === "mymind" && memoryKey) return memoryKey;
  if (name !== "mymind" && memoryProviderKeys[name]) return memoryProviderKeys[name];
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile(name))); } catch { /* yok */ }
  return null;
}
function writeProviderKey(provider, rawKey) {
  if (!["openai", "anthropic"].includes(provider)) throw new Error("Yalnız desteklenen iki resmi sağlayıcı (OpenAI / Anthropic) anahtarı kaydedilebilir.");
  if (rawKey == null || rawKey === "") {
    memoryProviderKeys[provider] = null;
    fs.rmSync(keyFile(provider), { force: true });
    return "none";
  }
  const v = C.validateApiKeyOrRejectCookie(rawKey);
  if (!v.ok) {
    if (v.isCookie) { data.counters.rejectedCookies++; save(); }
    throw new Error(v.reason);
  }
  if (vault()) {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(keyFile(provider), safeStorage.encryptString(v.key));
    memoryProviderKeys[provider] = null;
    return "vault";
  }
  memoryProviderKeys[provider] = v.key;
  return "memory";
}
function writeMymindKey(rawKey) {
  if (rawKey == null || rawKey === "") { memoryKey = null; fs.rmSync(keyFile("mymind"), { force: true }); return "none"; }
  const v = C.validateApiKeyOrRejectCookie(rawKey);
  if (!v.ok) throw new Error(v.reason);
  if (vault()) {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(keyFile("mymind"), safeStorage.encryptString(v.key));
    memoryKey = null;
    return "vault";
  }
  memoryKey = v.key;
  return "memory";
}

function view() {
  const m = C.metrics(data.runs, data.settings, data.counters);
  const rec = C.recommendModelForTask(data.settings.defaultTaskType, data.runs, data.catalog);
  return {
    settings: data.settings,
    catalog: data.catalog,
    runs: data.runs,
    active: data.active,
    metrics: m,
    recommendation: rec,
    lastAiRec: data.lastAiRec,
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey("mymind"),
    providerKeys: { openai: !!readKey("openai"), anthropic: !!readKey("anthropic") },
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
    title: "Model Switchboard", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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

const hubUrl = () => (TEST && process.env.MS_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey("mymind"), model: "mymind-lite" };
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
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.model-switchboard");
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

    handle("run:loadSample", () => {
      const sampleRuns = SAMPLE.buildSampleRuns();
      const existingIds = new Set(data.runs.map((r) => r.id));
      let added = 0;
      for (const r of sampleRuns) {
        if (!existingIds.has(r.id)) { data.runs.push(r); added++; }
      }
      if (data.runs[0]) data.active = data.runs[0].id;
      return { added, state: changed() };
    });

    handle("run:open", (id) => {
      const r = data.runs.find((x) => x.id === id);
      if (!r) throw new Error("Karşılaştırma kaydı bulunamadı.");
      data.active = r.id;
      return changed();
    });

    handle("run:compare", (input) => {
      input = input || {};
      const prompt = C.str(input.prompt, C.MAX_PROMPT).trim();
      if (!prompt) throw new Error("Karşılaştırılacak görev istemini (prompt) girin.");
      const modelA = data.catalog.find((m) => m.id === input.modelA) || data.catalog[0];
      const modelB = data.catalog.find((m) => m.id === input.modelB) || data.catalog[1];
      if (modelA.id === modelB.id) throw new Error("Yan yana karşılaştırma için iki farklı model seçin.");

      const outA = C.str(input.outA, C.MAX_PROMPT).trim() || `[${modelA.displayName} örnek yanıtı]\n- Görev: ${prompt.slice(0, 120)}\n- Fonksiyon, hata kontrolü ve birim test adımları uygulandı.`;
      const outB = C.str(input.outB, C.MAX_PROMPT).trim() || `[${modelB.displayName} örnek yanıtı]\n1. **Analiz:** ${prompt.slice(0, 120)}\n2. **Çözüm:** Yapısal fonksiyon, hata yakalama, risk ve test doğrulaması tamamlandı.`;

      const est = C.estimatePairCost(modelA, modelB, prompt, Math.max(C.estimateTokens(outA), C.estimateTokens(outB), data.settings.expectedOutputTokens));
      const mNow = C.metrics(data.runs, data.settings, data.counters);
      const capCheck = C.checkBudgetCap(mNow.totalSpentUsd, est.combinedCostUsd, data.settings.budgetCapUsd);
      if (!capCheck.allowed) {
        data.counters.preventedOverruns++;
        save();
        push();
        throw new Error(capCheck.reason);
      }

      const criteria = typeof input.criteria === "string"
        ? input.criteria.split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(input.criteria) ? input.criteria : C.defaultCriteriaForTask(input.taskType);

      const run = C.buildComparisonRun({
        id: "run-" + Date.now(),
        title: input.title || prompt.split("\n")[0].slice(0, 90),
        taskType: input.taskType,
        prompt,
        criteria,
        modelA,
        modelB,
        outA,
        outB,
        latencyMsA: input.latencyMsA || 360,
        latencyMsB: input.latencyMsB || 490,
      });

      data.runs.unshift(run);
      data.runs = data.runs.slice(0, C.MAX_RUNS);
      data.active = run.id;
      return { runId: run.id, costUsd: run.totalCostUsd, state: changed() };
    });

    handle("keys:setProvider", (provider, rawKey) => {
      const stored = writeProviderKey(provider, rawKey);
      return { stored, state: changed() };
    });

    handle("catalog:updatePrice", (modelId, patch) => {
      patch = patch || {};
      const m = data.catalog.find((x) => x.id === modelId);
      if (!m) throw new Error("Katalogda model bulunamadı.");
      const verifiedAt = C.str(patch.verifiedAt || m.verifiedAt, 20).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) throw new Error("Fiyat doğrulama tarihi YYYY-AA-GG biçiminde olmalıdır.");
      const inP = Number(patch.inputPer1M);
      const outP = Number(patch.outputPer1M);
      if (isNaN(inP) || inP <= 0 || isNaN(outP) || outP <= 0) throw new Error("Girdi ve çıktı fiyatları 0'dan büyük olmalıdır.");
      m.inputPer1M = C.round6(inP);
      m.outputPer1M = C.round6(outP);
      m.verifiedAt = verifiedAt;
      return changed();
    });

    handle("ai:setKey", (key) => { const r = { stored: writeMymindKey(key) }; push(); return r; });
    handle("ai:recommend", async (taskType) => {
      const tType = C.TASK_TYPES.includes(taskType) ? taskType : data.settings.defaultTaskType;
      const payload = C.aiPayload(tType, data.runs, data.catalog);
      const prov = providerInfo();
      const ok = await approve(
        "Görev türü için MyMind model önerisi istensin mi?",
        `Hedef: ${prov.name} — yalnız bu bilgisayar.\nGönderilecekler:\n• Görev türü: ${C.TASK_NAMES[tType]}\n• Kayıtlı ${payload.sent.candidateCount} modelin ortalama hız/kalite/maliyet özeti (${payload.sent.chars} karakter)\n• Sağlayıcı API anahtarlarınız ve ham istem metinleriniz gönderilmez.\n\nDönen öneri katalog ve kayıtlı test kimliklerine göre denetlenir.`,
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAiRecommendation(await askModel(payload.messages, 500), payload, data.catalog);
      data.lastAiRec = res;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, rec: res, dropped: res.dropped, state: changed() };
    });

    handle("export:csv", async () => {
      const file = await pickSave("model-switchboard-karsilastirma.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.runs), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.runs.length };
    });
    handle("export:md", async () => {
      const file = await pickSave("model-switchboard-rapor.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMd(data.runs, data.settings, data.counters), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.runs.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("model-switchboard-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "model-switchboard", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, catalog: data.catalog, runs: data.runs }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
