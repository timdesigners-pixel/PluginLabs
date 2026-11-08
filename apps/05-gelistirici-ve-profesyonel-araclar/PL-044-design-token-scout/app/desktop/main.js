/* Design Token Scout (PL-044) — masaüstü kabuğu.
 * Seçili sayfadaki computed style JSON, CSS veya HTML örneklerinden renk/font/spacing/radius adayları çıkarır;
 * yakın değerleri kümeleyerek token tekrarını azaltır ve yalnız kullanıcı onayıyla W3C Design Tokens JSON üretir. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.DTS_USER_DATA) app.setPath("userData", process.env.DTS_USER_DATA);
const TEST = process.env.DTS_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20;

let win = null;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  sources: [],
  candidates: [],
  activeTokenId: null,
  aiSuggestion: null,
  counters: C.normalizeCounters({}),
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "tokenlar.bin" : "tokenlar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

function writeAtomic(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, file);
}
function rebuildClusters() {
  const prevMap = new Map((data.candidates || []).map((c) => [`${c.category}:${c.value}`, { approved: c.approved, name: c.name, semanticRole: c.semanticRole }]));
  const allObs = data.sources.flatMap((s) => C.extractRawObservations(s.source, s.title));
  const res = C.clusterObservations(allObs, data.settings);
  for (const c of res.candidates) {
    const prev = prevMap.get(`${c.category}:${c.value}`);
    if (prev) {
      c.approved = prev.approved;
      c.name = prev.name || c.name;
      c.semanticRole = prev.semanticRole || "";
    }
  }
  data.candidates = res.candidates;
  if (!data.candidates.some((c) => c.id === data.activeTokenId)) {
    data.activeTokenId = data.candidates[0] ? data.candidates[0].id : null;
  }
  return res;
}
function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : {};
    data.settings = C.normalizeSettings(d.settings);
    data.sources = Array.isArray(d.sources) ? d.sources.slice(0, C.MAX_SOURCES) : [];
    data.candidates = Array.isArray(d.candidates) ? d.candidates : [];
    data.activeTokenId = d.activeTokenId || (data.candidates[0] ? data.candidates[0].id : null);
    data.aiSuggestion = d.aiSuggestion || null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

function statsOf() {
  const allObs = data.sources.flatMap((s) => C.extractRawObservations(s.source, s.title));
  const rawUniqueSet = new Set(allObs.map((o) => `${o.category}:${o.subType}:${o.rawValue.toLowerCase()}`));
  const rawUniqueCount = rawUniqueSet.size;
  const tokenCount = data.candidates.length;
  const approvedCount = data.candidates.filter((c) => c.approved).length;
  const duplicationReductionPct = rawUniqueCount > tokenCount ? C.pct(rawUniqueCount - tokenCount, rawUniqueCount) : 0;
  return {
    sourcesCount: data.sources.length,
    totalObservations: allObs.length,
    rawUniqueCount,
    tokenCount,
    approvedCount,
    duplicationReductionPct,
  };
}
function view() {
  const stats = statsOf();
  const hasSample = data.sources.some((s) => s.sampleKey);
  const coverage = hasSample ? C.evaluateCoverage(data.candidates, SAMPLE.goldCoreValues) : null;
  return {
    settings: data.settings,
    sources: data.sources,
    candidates: data.candidates,
    activeTokenId: data.activeTokenId,
    aiSuggestion: data.aiSuggestion,
    stats,
    coverage,
    w3cPreview: C.exportW3cTokens(data.candidates),
    cssPreview: C.exportCssVariables(data.candidates),
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
    ownershipDisclaimer: C.OWNERSHIP_DISCLAIMER,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

const webPreferences = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false });
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Design Token Scout", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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
  const r = await dialog.showOpenDialog(win, { title: "Stil veya Computed Style dosyalarını seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Stil / JSON / HTML", extensions: ["css", "json", "html", "htm"] }] });
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
const hubUrl = () => (TEST && process.env.DTS_HUB_URL) || net.HUB_URL;
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

function addSourceItem(sourceText, opts) {
  opts = opts || {};
  const raw = C.str(sourceText, C.MAX_SOURCE_CHARS).trim();
  if (!raw) throw new Error("Eklenecek stil veya computed style örneği boş.");
  if (opts.url && !C.isWebUrl(opts.url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayabilir.");
  const obs = C.extractRawObservations(raw, opts.title || "Örnek");
  if (!obs.length) throw new Error("Bu örnekte çıkarılabilir renk, yazı, boşluk veya köşe yarıçapı değeri bulunamadı.");
  data.sources.push({
    id: C.uid(),
    title: C.str(opts.title || "Stil örneği", 180),
    state: C.str(opts.state || "varsayilan", 60),
    url: opts.url ? String(opts.url).trim() : "",
    source: raw,
    sampleKey: C.str(opts.sampleKey || "", 40),
    obsCount: obs.length,
  });
  data.counters.sourcesAdded++;
  rebuildClusters();
  return obs.length;
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

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
      rebuildClusters();
      return changed();
    });

    handle("source:add", (payload) => {
      payload = payload || {};
      const obsCount = addSourceItem(payload.source, { title: payload.title || "Yeni stil örneği", state: payload.state || "varsayilan", url: payload.url || "" });
      return { obsCount, tokenCount: data.candidates.length, state: changed() };
    });
    handle("source:clipboard", () => {
      const text = clipboard.readText();
      if (!text || !text.trim()) throw new Error("Panoda stil veya computed style metni yok.");
      const obsCount = addSourceItem(text, { title: "Panodan stil örneği", state: "varsayilan" });
      data.counters.clipboardRun++;
      return { obsCount, tokenCount: data.candidates.length, state: changed() };
    });
    handle("source:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let loaded = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(css|json|html?)$/i.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        try {
          addSourceItem(text, { title: path.basename(f), state: "dosya" });
          loaded++; data.counters.filesLoaded++;
        } catch { skipped++; }
      }
      return { files: files.length, loaded, skipped, state: changed() };
    });
    handle("source:sample", () => {
      data.sources = [];
      data.candidates = [];
      for (const p of SAMPLE.pages) {
        addSourceItem(p.source, { title: p.title, state: p.state, url: p.url, sampleKey: p.key });
      }
      return { pages: SAMPLE.pages.length, tokenCount: data.candidates.length, state: changed() };
    });

    handle("token:select", (tokenId) => {
      if (data.candidates.some((c) => c.id === tokenId)) data.activeTokenId = tokenId;
      return changed();
    });
    handle("token:update", (tokenId, patch) => {
      patch = patch || {};
      const c = data.candidates.find((x) => x.id === tokenId);
      if (!c) throw new Error("Token adayı bulunamadı.");
      if ("approved" in patch) c.approved = !!patch.approved;
      if ("name" in patch && String(patch.name).trim()) c.name = C.str(patch.name, 80).trim();
      if ("semanticRole" in patch) c.semanticRole = C.str(patch.semanticRole, 80).trim();
      return changed();
    });
    handle("token:approveAll", (approved) => {
      for (const c of data.candidates) c.approved = !!approved;
      return changed();
    });

    handle("export:json", async () => {
      const approved = data.candidates.filter((c) => c.approved);
      if (!approved.length) throw new Error("Dışa aktarmak için en az bir token adayını onaylayın.");
      const ok = await approve(
        "Onaylanan tasarım tokenları W3C JSON olarak dışa aktarılsın mı?",
        `Toplam ${approved.length} onaylı token (${data.candidates.length - approved.length} aday hariç tutuldu) W3C Design Tokens biçiminde kaydedilecek.`,
        "JSON üret"
      );
      if (!ok) return { cancelled: true };
      const file = await pickSave("design-tokens.w3c.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportW3cTokens(data.candidates), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: approved.length };
    });
    handle("export:css", async () => {
      const approved = data.candidates.filter((c) => c.approved);
      if (!approved.length) throw new Error("Dışa aktarmak için en az bir token adayını onaylayın.");
      const file = await pickSave("tokens.css", "css");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCssVariables(data.candidates), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: approved.length };
    });
    handle("export:md", async () => {
      const file = await pickSave("design-token-scout.md", "md");
      if (!file) return { cancelled: true };
      const st = statsOf();
      const cov = data.sources.some((s) => s.sampleKey) ? C.evaluateCoverage(data.candidates, SAMPLE.goldCoreValues) : null;
      fs.writeFileSync(file, C.exportMd(data.sources, data.candidates, st, cov), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: st.approvedCount };
    });
    handle("export:backup", async () => {
      const file = await pickSave("design-token-scout-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "design-token-scout", version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:hierarchy", async () => {
      if (!data.candidates.length) throw new Error("Önce stil örneklerinden token adayları çıkarın.");
      const p = C.aiPayload(data.candidates);
      const prov = providerInfo();
      const ok = await approve(
        "Kümelenmiş token adayları için MyMind semantik hiyerarşi önersin mi?",
        `Hedef: ${prov.name} — yalnız bu bilgisayar.\nGönderilecekler:\n• Yalnız kümelenmiş ${p.sent.tokenCount} token adayının kategori, değer ve kullanım sayısı (${p.sent.chars} karakter)\n• Kaynak sayfa metni, URL'ler veya ham HTML gönderilmez.`,
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 700), data.candidates);
      data.aiSuggestion = res;
      data.counters.aiRuns++;
      return { approved: true, count: res.suggestions.length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", () => {
      if (!data.aiSuggestion || !Array.isArray(data.aiSuggestion.suggestions)) throw new Error("Önce MyMind hiyerarşi önerisi alın.");
      let applied = 0;
      for (const s of data.aiSuggestion.suggestions) {
        const c = data.candidates.find((x) => x.id === s.id);
        if (c) { c.semanticRole = s.semanticRole; applied++; }
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
