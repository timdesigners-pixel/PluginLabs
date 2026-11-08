/* Dev Patch Notes — masaüstü kabuğu.
 * Seçilen git diff / commit listesini içe alır, kategorilere ayırır, kaynak commit bağlantılı sürüm notları üretir.
 * API anahtarı ve sır taraması yapar; kanıtsız test geçişi veya performans artışı iddialarını engeller.
 * Otomatik commit, push veya yayın yapmaz. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.DPN_USER_DATA) app.setPath("userData", process.env.DPN_USER_DATA);
const TEST = process.env.DPN_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), releases: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "surum-notlari.bin" : "surum-notlari.json");
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
    data.releases = C.normalizeReleases(d.releases);
    data.active = data.releases.some((x) => x.id === d.active) ? d.active : (data.releases[0] ? data.releases[0].id : null);
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
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

function view() {
  const active = data.releases.find((x) => x.id === data.active) || data.releases[0] || null;
  return {
    settings: data.settings,
    releases: data.releases,
    active: active ? active.id : null,
    metrics: C.metrics(data.releases, data.counters),
    counters: data.counters,
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getRelease(id) { const r = data.releases.find((x) => x.id === (id || data.active)); if (!r) throw new Error("Sürüm notu bulunamadı."); return r; }

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Dev Patch Notes", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title: "Git log / diff dosyası seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Git log / diff", extensions: ["txt", "log", "diff", "patch", "md"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const hubUrl = () => (TEST && process.env.DPN_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
async function askModel(messages, maxTokens) {
  const p = providerInfo();
  if (data.settings.provider === "hub" && !p.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
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
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.dev-patch-notes");
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
      if (meta.repoUrl && !C.isWebUrl(meta.repoUrl)) throw new Error("Depo adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
      const rel = C.buildRelease(text, meta);
      data.releases.unshift(rel);
      data.active = rel.id;
      data.counters.imported++;
      data.counters.secretsCaught += rel.stats.secretCount;
      data.counters.claimsBlocked += rel.stats.unverifiedBlocked;
      return { releaseId: rel.id, itemCount: rel.items.length, secrets: rel.stats.secretCount, blocked: rel.stats.unverifiedBlocked, state: changed() };
    });

    handle("capture:clipboard", () => {
      const text = clipboard.readText();
      if (!text || !text.trim()) throw new Error("Panoda git log veya diff metni yok.");
      const rel = C.buildRelease(text, { title: "Panodan alınan sürüm notları", version: "v0.1.0" });
      data.releases.unshift(rel);
      data.active = rel.id;
      data.counters.imported++;
      data.counters.secretsCaught += rel.stats.secretCount;
      data.counters.claimsBlocked += rel.stats.unverifiedBlocked;
      return { releaseId: rel.id, itemCount: rel.items.length, state: changed() };
    });

    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, 10);
      if (!files.length) return { cancelled: true };
      let added = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(txt|log|diff|patch|md)$/i.test(f)) { skipped++; continue; }
        const raw = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        if (!raw.trim()) { skipped++; continue; }
        const rel = C.buildRelease(raw, { title: path.basename(f), version: "v0.1.0" });
        data.releases.unshift(rel);
        data.active = rel.id;
        data.counters.imported++;
        added++;
      }
      return { added, skipped, state: changed() };
    });

    handle("capture:sample", () => {
      let added = 0;
      for (const s of SAMPLE.samples) {
        if (data.releases.some((r) => r.sampleKey === s.key)) continue;
        const rel = C.buildRelease(s.text, { version: s.version, title: s.title, repoUrl: s.repoUrl, releaseDate: s.releaseDate, sampleKey: s.key });
        data.releases.unshift(rel);
        data.counters.imported++;
        data.counters.secretsCaught += rel.stats.secretCount;
        data.counters.claimsBlocked += rel.stats.unverifiedBlocked;
        added++;
      }
      if (data.releases[0]) data.active = data.releases[0].id;
      return { added, state: changed() };
    });

    handle("release:open", (id) => { getRelease(id); data.active = id; return changed(); });
    handle("release:updateItem", (id, itemId, patch) => {
      const rel = getRelease(id);
      const it = rel.items.find((x) => x.id === itemId);
      if (!it) throw new Error("Değişiklik maddesi bulunamadı.");
      if (patch.category && C.CATEGORIES.includes(patch.category)) it.category = patch.category;
      if (patch.included !== undefined) it.included = !!patch.included;
      if (patch.summary !== undefined) {
        const claims = C.checkUnverifiedClaims(patch.summary, it.evidence);
        if (claims.length) {
          data.counters.claimsBlocked += claims.length;
          throw new Error("Kanıtsız teslim iddiası engellendi: " + claims[0].reason + " (“" + claims[0].phrase + "”).");
        }
        it.summary = C.redactSecrets(C.str(patch.summary, 300).trim()) || it.summary;
        it.edited = true;
      }
      C.recomputeRelease(rel);
      return changed();
    });

    handle("release:updateMeta", (id, patch) => {
      const rel = getRelease(id);
      if (patch.version !== undefined) rel.version = C.str(patch.version, 40).trim() || rel.version;
      if (patch.title !== undefined) rel.title = C.str(patch.title, 140).trim() || rel.title;
      if (patch.repoUrl !== undefined) {
        if (patch.repoUrl && !C.isWebUrl(patch.repoUrl)) throw new Error("Depo adresi yalnız http/https olabilir.");
        rel.repoUrl = patch.repoUrl.trim();
      }
      C.recomputeRelease(rel);
      return changed();
    });

    handle("commit:open", async (id, itemId) => {
      const rel = getRelease(id);
      const it = rel.items.find((x) => x.id === itemId);
      if (!it || !it.commitUrl || !C.isWebUrl(it.commitUrl)) throw new Error("Bu commit için geçerli bir web bağlantısı yok.");
      if (TEST) { testLog("opened.txt", it.commitUrl); return { opened: it.commitUrl }; }
      await shell.openExternal(it.commitUrl);
      return { opened: it.commitUrl };
    });

    handle("export:md", async (id, opts) => {
      const rel = getRelease(id);
      const style = (opts && opts.style) || data.settings.exportStyle;
      const file = await pickSave("SURUM-NOTLARI-" + rel.version + ".md", "md");
      if (!file) return { cancelled: true };
      const out = C.exportMarkdown(rel, { style });
      fs.writeFileSync(file, out.markdown, "utf8");
      data.counters.exports++;
      return { file: path.basename(file), itemCount: out.itemCount, state: changed() };
    });

    handle("export:json", async (id) => {
      const rel = getRelease(id);
      const file = await pickSave("surum-notlari-" + rel.version + ".json", "json");
      if (!file) return { cancelled: true };
      const out = C.exportJson(rel);
      fs.writeFileSync(file, out.json, "utf8");
      data.counters.exports++;
      return { file: path.basename(file), itemCount: out.itemCount, state: changed() };
    });

    handle("export:backup", async () => {
      const file = await pickSave("dev-patch-notes-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "dev-patch-notes", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, releases: data.releases }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:draft", async (id) => {
      const rel = getRelease(id);
      const p = C.aiPayload(rel);
      const prov = providerInfo();
      const ok = await approve(
        "Sürüm notu maddeleri MyMind ile kullanıcı diline dönüştürülsün mü?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.commitCount + " commit başlığı ve kısa SHA (" + p.sent.chars + " karakter)\n• " + p.sent.redactedSecrets + " sızmış API anahtarı/sır maskelendi — gerçek anahtarlar gönderilmez.\n• Kanıtsız test geçişi veya performans artışı iddiaları denetimde reddedilir.",
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 700), rel);
      rel.ai = res;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, dropped: res.dropped, state: changed() };
    });

    handle("ai:apply", (id) => {
      const rel = getRelease(id);
      if (!rel.ai) throw new Error("Önce MyMind taslağı alın.");
      for (const cand of rel.ai.items) {
        const it = rel.items.find((x) => x.shortSha === cand.sha);
        if (it) {
          it.summary = cand.summary;
          it.category = cand.category;
          it.edited = true;
        }
      }
      C.recomputeRelease(rel);
      return changed();
    });

    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
