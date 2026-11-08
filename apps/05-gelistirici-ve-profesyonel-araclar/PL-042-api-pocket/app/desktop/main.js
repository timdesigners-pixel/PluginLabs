/* API Pocket — masaüstü kabuğu.
 * Sırlar işletim sistemi kasasında (DPAPI safeStorage) şifreli saklanır; arayüze, duruma, günlüklere veya dışa aktarmaya ASLA yazılmaz.
 * Üretim ortamına veya sunucuya yazan yöntemlerde (POST/PUT/PATCH/DELETE) gönderim öncesi ek önizleme ve onay uygulanır. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.AP_USER_DATA) app.setPath("userData", process.env.AP_USER_DATA);
const TEST = process.env.AP_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let memoryKey = null;
let memorySecrets = {};
let data = {
  settings: C.normalizeSettings({}),
  env: C.normalizeEnv(SAMPLE.defaultEnv),
  templates: SAMPLE.templates.map((t, i) => C.normalizeTemplate(t, i)),
  active: SAMPLE.templates[0].id,
  history: [],
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "api-pocket.bin" : "api-pocket.json");
const secretsFile = () => path.join(app.getPath("userData"), "api-secrets.bin");
const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
const vault = () => safeStorage.isEncryptionAvailable();

function writeAtomic(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, file);
}

function readSecretsMap() {
  let map = { ...memorySecrets };
  try {
    if (vault() && fs.existsSync(secretsFile())) {
      const dec = safeStorage.decryptString(fs.readFileSync(secretsFile()));
      map = { ...JSON.parse(dec), ...memorySecrets };
    }
  } catch { /* yok */ }
  return map;
}

function writeSecretsMap(map) {
  memorySecrets = { ...map };
  if (vault()) {
    writeAtomic(secretsFile(), safeStorage.encryptString(JSON.stringify(map)));
  }
}

// Günlük yazıcı: her satırı bilinen sırlara karşı tarar, sırların günlükte görünmesi 0'dır!
function safeTestLog(file, line) {
  if (!TEST) return;
  const cleanLine = C.scrubKnownSecrets(line, readSecretsMap());
  fs.appendFileSync(path.join(TEST, file), cleanLine + "\n");
}
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };

function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  if (!raw) {
    // İlk açılışta örnek sırrı kasaya koy
    writeSecretsMap({ API_KEY: SAMPLE.sampleSecretValue });
    return;
  }
  try {
    const d = JSON.parse(raw);
    data.settings = C.normalizeSettings(d.settings);
    data.env = C.normalizeEnv(d.env || SAMPLE.defaultEnv);
    data.templates = Array.isArray(d.templates) && d.templates.length ? d.templates.map((t, i) => C.normalizeTemplate(t, i)) : SAMPLE.templates.map((t, i) => C.normalizeTemplate(t, i));
    data.active = data.templates.some((x) => x.id === d.active) ? d.active : (data.templates[0] ? data.templates[0].id : null);
    data.history = Array.isArray(d.history) ? d.history.slice(0, C.MAX_HISTORY) : [];
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya */ }
}

function save() {
  const secMap = readSecretsMap();
  for (const k of Object.keys(data.env)) {
    if (data.env[k].secret) {
      data.env[k].value = ""; // Sırlar ana veri dosyasına asla yazılmaz
      data.env[k].hasSecret = !!secMap[k];
    }
  }
  const json = C.scrubKnownSecrets(JSON.stringify({ version: 1, ...data }), secMap);
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

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

function view() {
  const secMap = readSecretsMap();
  for (const k of Object.keys(data.env)) {
    if (data.env[k].secret) {
      data.env[k].value = "";
      data.env[k].hasSecret = !!secMap[k];
    }
  }
  const active = data.templates.find((x) => x.id === data.active) || data.templates[0] || null;
  const preview = active ? C.buildRequestPreview(active, data.env, {}) : null;
  return {
    settings: data.settings,
    env: data.env,
    templates: data.templates,
    active: active ? active.id : null,
    preview: preview ? {
      method: preview.method,
      displayUrl: preview.displayUrl,
      displayHeaders: preview.displayHeaders,
      displayBody: preview.displayBody,
      missing: preview.missing,
      usedSecrets: preview.usedSecrets,
      requiresWriteConfirm: preview.requiresWriteConfirm,
    } : null,
    history: data.history,
    metrics: C.metrics(data.templates, data.env, data.counters),
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getTemplate(id) { const t = data.templates.find((x) => x.id === (id || data.active)); if (!t) throw new Error("İstek şablonu bulunamadı."); return t; }

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "API Pocket", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}

async function approve(message, detail, okLabel) {
  if (TEST) { safeTestLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const hubUrl = () => (TEST && process.env.AP_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
async function askModel(messages, maxTokens) {
  const p = providerInfo();
  if (data.settings.provider === "hub" && !p.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) safeTestLog("ai-sent.json", JSON.stringify({ provider: data.settings.provider, messages }));
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
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.api-pocket");
    load();
    if (TEST && process.env.AP_TEST_API_URL) {
      data.env.BASE_URL = { name: "BASE_URL", secret: false, value: process.env.AP_TEST_API_URL, hasSecret: false };
    }

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("env:setVar", (name, value) => {
      const k = String(name || "").trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) throw new Error("Değişken adı yalnız harf, rakam ve alt çizgi içerebilir.");
      data.env[k] = { name: k, secret: false, value: C.str(value, 500), hasSecret: false };
      return changed();
    });

    handle("env:setSecret", (name, secretValue) => {
      const k = String(name || "").trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) throw new Error("Sır değişken adı geçersiz.");
      const map = readSecretsMap();
      if (secretValue == null || secretValue === "") delete map[k];
      else map[k] = String(secretValue).trim();
      writeSecretsMap(map);
      data.env[k] = { name: k, secret: true, value: "", hasSecret: !!map[k] };
      return changed();
    });

    handle("env:removeVar", (name) => {
      const k = String(name || "").trim();
      delete data.env[k];
      const map = readSecretsMap();
      delete map[k];
      writeSecretsMap(map);
      return changed();
    });

    handle("request:open", (id) => { getTemplate(id); data.active = id; return changed(); });
    handle("request:create", (patch) => {
      const t = C.normalizeTemplate({ id: "req-" + Date.now().toString(36), ...(patch || {}) }, data.templates.length);
      data.templates.unshift(t);
      data.active = t.id;
      return changed();
    });
    handle("request:update", (id, patch) => {
      const t = getTemplate(id);
      if (patch.name !== undefined) t.name = C.str(patch.name, 120).trim() || t.name;
      if (patch.method !== undefined && C.METHODS.includes(patch.method)) t.method = patch.method;
      if (patch.url !== undefined) t.url = C.str(patch.url, 1000).trim() || t.url;
      if (patch.docUrl !== undefined) {
        if (patch.docUrl && !C.isWebUrl(patch.docUrl)) throw new Error("API belge bağlantısı yalnız http/https olabilir.");
        t.docUrl = patch.docUrl.trim();
      }
      if (patch.headers !== undefined && Array.isArray(patch.headers)) {
        t.headers = patch.headers.slice(0, 20).map((h) => ({ key: C.str(h.key, 80).trim(), value: C.str(h.value, 500).trim(), enabled: h.enabled !== false }));
      }
      if (patch.body !== undefined) t.body = C.str(patch.body, 10000);
      return changed();
    });

    handle("request:loadSamples", () => {
      for (const s of SAMPLE.templates) {
        if (!data.templates.some((t) => t.id === s.id)) data.templates.push(C.normalizeTemplate(s));
      }
      const map = readSecretsMap();
      if (!map.API_KEY) { map.API_KEY = SAMPLE.sampleSecretValue; writeSecretsMap(map); }
      return changed();
    });

    handle("request:send", async (id) => {
      const tpl = getTemplate(id);
      const secMap = readSecretsMap();
      const prev = C.buildRequestPreview(tpl, data.env, secMap);
      if (prev.missing.length) {
        throw new Error("Eksik ortam değişkeni: " + prev.missing.join(", ") + ". Önce Ortam ve Sırlar bölümünden tanımlayın.");
      }
      if (prev.requiresWriteConfirm && data.settings.confirmWriteMethods) {
        const hdrLines = Object.entries(prev.displayHeaders).map(([k, v]) => `  ${k}: ${v}`).join("\n");
        const ok = await approve(
          `${prev.method} yazma isteği gönderilsin mi?`,
          `Bu yöntem (${prev.method}) hedef sunucuda veri oluşturabilir veya değiştirebilir.\n\nHedef: ${prev.displayUrl}\nBaşlıklar (sırlar maskeli):\n${hdrLines || "  (yok)"}\nGövde:\n${prev.displayBody || "(boş)"}`,
          "İsteği Gönder"
        );
        if (!ok) return { cancelled: true, state: view() };
        data.counters.writePreviewsConfirmed++;
      }
      safeTestLog("request-log.txt", `${prev.method} ${prev.displayUrl} headers=${JSON.stringify(prev.displayHeaders)}`);
      const rawResp = await net.sendApiRequest({
        method: prev.method,
        url: prev.execUrl,
        headers: prev.execHeaders,
        body: prev.execBody,
      });
      const formatted = C.formatResponse(rawResp.body, rawResp.status, rawResp.headers, rawResp.durationMs, secMap);
      tpl.lastResponse = formatted;
      data.counters.requestsSent++;
      data.history.unshift({
        id: "h-" + Date.now().toString(36),
        templateId: tpl.id,
        method: prev.method,
        displayUrl: prev.displayUrl,
        status: formatted.status,
        durationMs: formatted.durationMs,
        at: formatted.at,
      });
      data.history = data.history.slice(0, C.MAX_HISTORY);
      return { sent: true, status: formatted.status, durationMs: formatted.durationMs, state: changed() };
    });

    handle("doc:open", async (id) => {
      const tpl = getTemplate(id);
      if (!tpl.docUrl || !C.isWebUrl(tpl.docUrl)) throw new Error("Bu şablona bağlı geçerli bir API belgesi yok.");
      if (TEST) { safeTestLog("opened.txt", tpl.docUrl); return { opened: tpl.docUrl }; }
      await shell.openExternal(tpl.docUrl);
      return { opened: tpl.docUrl };
    });

    handle("export:curl", (id) => {
      const tpl = getTemplate(id);
      const curl = C.exportCurl(tpl, data.env);
      clipboard.writeText(curl);
      data.counters.exports++;
      return { curl, state: changed() };
    });

    handle("export:md", async () => {
      const file = await pickSave("api-pocket-koleksiyon.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMarkdown(data.templates, data.env), "utf8");
      data.counters.exports++;
      return { file: path.basename(file), count: data.templates.length, state: changed() };
    });

    handle("export:collection", async () => {
      const file = await pickSave("api-pocket-koleksiyon.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCollectionJson(data.templates, data.env), "utf8");
      data.counters.exports++;
      return { file: path.basename(file), count: data.templates.length, state: changed() };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:explain", async (id) => {
      const tpl = getTemplate(id);
      const p = C.aiPayload(tpl);
      const prov = providerInfo();
      const ok = await approve(
        "Yanıt alanları MyMind ile açıklansın mı?",
        `Hedef: ${prov.name} — yalnız bu bilgisayar.\nGönderilecekler:\n• ${p.sent.fieldCount} yanıt alanının yolu ve veri tipi (${p.sent.chars} karakter)\n• Kasadaki API anahtarları ve sırlar GÖNDERİLMEZ.\n• Yanıtta olmayan uydurma alanlar denetimde reddedilir.`,
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 600), tpl);
      tpl.ai = res;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, dropped: res.dropped, state: changed() };
    });

    handle("ai:apply", (id) => {
      const tpl = getTemplate(id);
      if (!tpl.ai || !tpl.lastResponse) throw new Error("Önce MyMind alan açıklaması alın.");
      for (const exp of tpl.ai.explanations) {
        const f = tpl.lastResponse.fields.find((x) => x.path === exp.path);
        if (f) f.explanation = exp.explanation;
      }
      return changed();
    });

    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
