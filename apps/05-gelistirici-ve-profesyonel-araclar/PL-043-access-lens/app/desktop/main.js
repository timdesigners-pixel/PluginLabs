/* Access Lens (PL-043) — masaüstü kabuğu.
 * Seçilen HTML/CSS kesitlerini (yapıştırma, pano, .html/.css dosyası) WCAG 2.2 AA/AAA kurallarıyla denetler;
 * sorun seçildiğinde ilgili öğeyi ve satır numarasını gösterir; kural motoru sürümünü açıkça gösterir ve otomatik denetim
 * puanını erişilebilirlik sertifikası gibi sunmaz (manuel klavye/ekran okuyucu kontrol listesi içerir). */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.AL_USER_DATA) app.setPath("userData", process.env.AL_USER_DATA);
const TEST = process.env.AL_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), audits: [], activeId: null, activeIssueId: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "denetimler.bin" : "denetimler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.AL_NOW ? new Date(process.env.AL_NOW) : new Date());

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
    data.activeId = data.audits.some((x) => x.id === d.activeId) ? d.activeId : (data.audits[0] ? data.audits[0].id : null);
    data.activeIssueId = d.activeIssueId || null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

function view() {
  const active = data.audits.find((x) => x.id === data.activeId) || data.audits[0] || null;
  const gold = data.audits.some((x) => x.sampleKey) ? C.evaluateFixtures(data.audits, SAMPLE.fixtures) : null;
  return {
    settings: data.settings,
    audits: data.audits,
    activeId: active ? active.id : null,
    activeIssueId: data.activeIssueId,
    metrics: C.metrics(data.audits),
    gold,
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
    engineVersion: C.ENGINE_VERSION,
    standardVersion: C.STANDARD_VERSION,
    certificateDisclaimer: C.CERTIFICATE_DISCLAIMER,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getAudit(id) {
  const a = data.audits.find((x) => x.id === (id || data.activeId));
  if (!a) throw new Error("Denetim kaydı bulunamadı.");
  return a;
}

const webPreferences = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false });
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Access Lens", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
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
  const r = await dialog.showOpenDialog(win, { title: "HTML/CSS dosyalarını seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Web / Kesit", extensions: ["html", "htm", "css", "svg"] }] });
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
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}
const hubUrl = () => (TEST && process.env.AL_HUB_URL) || net.HUB_URL;
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

function addAudit(source, opts) {
  const raw = C.str(source, C.MAX_SOURCE).trim();
  if (!raw) throw new Error("Denetlenecek HTML/CSS içeriği boş.");
  if (opts && opts.url && !C.isWebUrl(opts.url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayabilir.");
  const a = C.auditSnippet(raw, { ...opts, level: data.settings.level, at: now().toISOString() });
  data.audits = [a, ...data.audits].slice(0, C.MAX_AUDITS);
  data.activeId = a.id;
  data.activeIssueId = a.issues[0] ? a.issues[0].id : null;
  data.counters.auditsRun++;
  return a;
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

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
      const prevLevel = data.settings.level;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if (prevLevel !== data.settings.level) {
        data.audits = data.audits.map((a) => {
          const re = C.auditSnippet(a.source, { id: a.id, title: a.title, url: a.url, sampleKey: a.sampleKey, level: data.settings.level, at: a.createdAt });
          re.manualChecks = a.manualChecks;
          return re;
        });
      }
      return changed();
    });

    handle("audit:snippet", (payload) => {
      payload = payload || {};
      const a = addAudit(payload.source, { title: payload.title || "Yeni HTML/CSS kesiti", url: payload.url || "" });
      return { addedIssues: a.issues.length, auditId: a.id, state: changed() };
    });
    handle("audit:clipboard", () => {
      const text = clipboard.readText();
      if (!text || !text.trim()) throw new Error("Panoda denetlenecek HTML/CSS metni yok.");
      const a = addAudit(text, { title: "Panodan kesit" });
      data.counters.clipboardRun++;
      return { addedIssues: a.issues.length, auditId: a.id, state: changed() };
    });
    handle("audit:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let loaded = 0, issuesCount = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(html?|css|svg)$/i.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        if (!text.trim()) { skipped++; continue; }
        const a = addAudit(text, { title: path.basename(f) });
        loaded++; issuesCount += a.issues.length; data.counters.filesLoaded++;
      }
      return { files: files.length, loaded, issuesCount, skipped, state: changed() };
    });
    handle("audit:sample", () => {
      let totalIssues = 0;
      const built = [];
      for (const f of SAMPLE.fixtures) {
        const a = C.auditSnippet(f.source, { title: f.title, url: f.url, sampleKey: f.key, level: data.settings.level, at: SAMPLE.BASE });
        totalIssues += a.issues.length;
        built.push(a);
        data.counters.auditsRun++;
      }
      data.audits = built.concat(data.audits.filter((x) => !x.sampleKey)).slice(0, C.MAX_AUDITS);
      if (built[0]) {
        data.activeId = built[0].id;
        data.activeIssueId = built[0].issues[0] ? built[0].issues[0].id : null;
      }
      return { count: built.length, totalIssues, state: changed() };
    });
    handle("audit:select", (auditId, issueId) => {
      const a = getAudit(auditId);
      data.activeId = a.id;
      data.activeIssueId = issueId && a.issues.some((i) => i.id === issueId) ? issueId : (a.issues[0] ? a.issues[0].id : null);
      return changed();
    });
    handle("audit:setIssueStatus", (auditId, issueId, status) => {
      const a = getAudit(auditId);
      const it = a.issues.find((i) => i.id === issueId);
      if (!it) throw new Error("Bulgu bulunamadı.");
      if (!C.ISSUE_STATUSES.includes(status)) throw new Error("Geçersiz durum.");
      it.status = status;
      return changed();
    });
    handle("audit:applyFix", (auditId, issueId, customFix) => {
      const a = getAudit(auditId);
      const it = a.issues.find((i) => i.id === issueId);
      if (!it) throw new Error("Bulgu bulunamadı.");
      const draft = C.str(customFix || (it.ai && it.ai.duzeltme) || it.fixDraft, 1000).trim();
      if (!draft) throw new Error("Uygulanacak düzeltme taslağı boş.");
      if (it.snippet && a.source.includes(it.snippet)) {
        a.source = a.source.replace(it.snippet, draft);
      }
      it.fixDraft = draft;
      it.status = "cozuldu";
      return changed();
    });
    handle("audit:toggleManual", (auditId, checkId, done) => {
      const a = getAudit(auditId);
      const m = (a.manualChecks || []).find((x) => x.id === checkId);
      if (!m) throw new Error("Manuel kontrol maddesi bulunamadı.");
      m.done = !!done;
      return changed();
    });

    handle("export:md", async () => {
      const a = getAudit();
      const file = await pickSave("access-lens-rapor.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMd(a), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: a.issues.length };
    });
    handle("export:csv", async () => {
      const a = getAudit();
      const file = await pickSave("access-lens.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(a), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: a.issues.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("access-lens-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "access-lens", version: 1, engineVersion: C.ENGINE_VERSION, exportedAt: new Date().toISOString(), settings: data.settings, audits: data.audits }, null, 2), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:explain", async (auditId, issueId) => {
      const a = getAudit(auditId);
      const it = a.issues.find((i) => i.id === (issueId || data.activeIssueId));
      if (!it) throw new Error("Açıklanacak bulgu seçilmedi.");
      const p = C.aiPayload(a, it);
      const prov = providerInfo();
      const ok = await approve(
        "Bu erişilebilirlik bulgusu MyMind ile sadeleştirilsin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Yalnız seçili bulgunun kural kodu (" + p.sent.ruleId + ") ve ilgili öğe kesiti (" + p.sent.chars + " karakter)\n• Kaynak sayfa adresi ve diğer kesitler gönderilmez" +
        (p.sent.maskedCount ? "\n• " + p.sent.maskedCount + " e-posta/bağlantı/gizli değer ⟦…⟧ ile maskelendi" : "") +
        "\n\nNot: Otomatik puan ve yapay zekâ önerisi erişilebilirlik sertifikası değildir.",
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 600), it);
      it.ai = res;
      data.counters.aiRuns++;
      return { approved: true, state: changed() };
    });
    handle("ai:apply", (auditId, issueId) => {
      const a = getAudit(auditId);
      const it = a.issues.find((i) => i.id === (issueId || data.activeIssueId));
      if (!it || !it.ai) throw new Error("Önce MyMind açıklaması ve düzeltme taslağı alın.");
      it.fixDraft = it.ai.duzeltme || it.fixDraft;
      if (it.snippet && a.source.includes(it.snippet)) {
        a.source = a.source.replace(it.snippet, it.fixDraft);
      }
      it.status = "cozuldu";
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
