/* Note Master (PL-006) — masaüstü kabuğu.
 * Hızlı notları ve görevleri kaynak bağlantılarıyla kaydeder, etiketler ve düzenler; alıntı sınırı ve kaynak URL tutulur;
 * Markdown/JSON dışa aktarır; MyMind ile uzun notu görev/özet/anahtar kavram taslağına çevirir (özgün metin saklanır);
 * gizli notlar varsayılan olarak modele gönderilmez. Hızlı not widget'ı: her zaman üstte küçük pencere (Ctrl+Shift+Space). */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, globalShortcut } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.NM_USER_DATA) app.setPath("userData", process.env.NM_USER_DATA);
const TEST = process.env.NM_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

const FULL = { width: 1320, height: 840, minWidth: 1040, minHeight: 640 };
const MINI = { width: 420, height: 560 };
let win = null;
let mini = false;
let memoryKey = null;
let data = {
  settings: C.normalizeSettings({}),
  notes: [],
  counters: { exports: 0, aiRuns: 0, aiDroppedConcepts: 0, aiDroppedRewrites: 0, privateBlocked: 0 },
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "notlar.bin" : "notlar.json");
const testLog = (file, line) => { if (TEST) fs.appendFileSync(path.join(TEST, file), line + "\n"); };
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => {
  if (TEST) { const t = testRead("now.txt") || process.env.NM_NOW; if (t) return new Date(t); }
  return new Date();
};
const nowIso = () => now().toISOString();

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
    data.notes = (Array.isArray(d.notes) ? d.notes : []).slice(0, 20000).map((n) => C.normalizeNote(n, { now: nowIso() }));
    if (d.counters && typeof d.counters === "object") {
      for (const k of Object.keys(data.counters)) data.counters[k] = Number(d.counters[k]) || 0;
    }
  } catch { /* bozuk dosya: boş başla */ }
  if (!data.settings.firstLaunchAt) { data.settings.firstLaunchAt = nowIso(); save(); }
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
  return {
    settings: data.settings,
    notes: data.notes,
    tags: C.tagCloud(data.notes),
    metrics: C.metrics(data.notes, data.settings, nowIso()),
    counters: data.counters,
    mini,
    now: nowIso(),
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function findNote(id) {
  const i = data.notes.findIndex((n) => n.id === id);
  if (i < 0) throw new Error("Not bulunamadı.");
  return i;
}

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    ...FULL,
    useContentSize: true,
    autoHideMenuBar: true,
    title: "Note Master",
    icon: path.join(root, "icons", "icon256.png"),
    backgroundColor: "#0e1322",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}

/* Hızlı not widget'ı: küçük, her zaman üstte pencere. */
function setMini(on) {
  if (!win) return;
  mini = !!on;
  if (mini) {
    win.setMinimumSize(360, 420);
    win.setContentSize(MINI.width, MINI.height);
    win.setAlwaysOnTop(true, "floating");
  } else {
    win.setAlwaysOnTop(false);
    win.setMinimumSize(FULL.minWidth, FULL.minHeight);
    win.setContentSize(FULL.width, FULL.height);
    win.center();
  }
}
function summon() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  win.webContents.send("capture:focus");
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
async function pickOpen() {
  if (TEST) { const f = testRead("import-path.txt"); return f || null; }
  const r = await dialog.showOpenDialog(win, { title: "Not dosyası seç", properties: ["openFile"], filters: [{ name: "JSON", extensions: ["json"] }] });
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
}

const hubUrl = () => (TEST && process.env.NM_HUB_URL) || net.HUB_URL;
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
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => summon());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.note-master");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) {
        throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      }
      delete patch.firstLaunchAt;
      delete patch.firstNoteAt;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("notes:loadSample", () => {
      const have = new Set(data.notes.map((n) => n.id));
      const add = SAMPLE.sampleNotes.map((n) => C.normalizeNote(n, { now: nowIso() })).filter((n) => !have.has(n.id));
      data.notes = [...add, ...data.notes];
      return { added: add.length, state: changed() };
    });
    handle("notes:create", (input) => {
      const n = C.createNote(input || {}, nowIso(), data.settings);
      data.notes = [n, ...data.notes];
      if (!data.settings.firstNoteAt) data.settings.firstNoteAt = n.createdAt;
      return { note: n, state: changed() };
    });
    handle("notes:update", (id, patch) => {
      const i = findNote(id);
      data.notes[i] = C.updateNote(data.notes[i], patch || {}, nowIso(), data.settings);
      return changed();
    });
    handle("notes:toggle", (id) => {
      const i = findNote(id);
      data.notes[i] = C.updateNote(data.notes[i], { done: !data.notes[i].done }, nowIso(), data.settings);
      return changed();
    });
    handle("notes:remove", async (id) => {
      const i = findNote(id);
      const ok = await approve("“" + data.notes[i].title + "” silinsin mi?", "Bu işlem geri alınamaz. Önce JSON yedeği almanız önerilir.", "Sil");
      if (!ok) return { removed: false, state: view() };
      data.notes.splice(i, 1);
      return { removed: true, state: changed() };
    });
    handle("notes:recall", (id) => {
      const i = findNote(id);
      const r = C.recordRecall(data.notes[i], nowIso());
      data.notes[i] = r.note;
      if (r.counted) return { counted: true, state: changed() };
      return { counted: false, state: view() };
    });
    handle("notes:copyMd", (id) => {
      const i = findNote(id);
      const md = C.noteToMarkdown(data.notes[i]);
      if (TEST) fs.writeFileSync(path.join(TEST, "clipboard-out.md"), md, "utf8");
      else clipboard.writeText(md);
      data.notes[i] = C.recordRecall(data.notes[i], nowIso()).note;
      return changed();
    });

    /* Seçili metinden not: kullanıcı metni seçip kopyalar, düğmeye basınca pano okunur (yalnız açık kullanıcı eylemiyle). */
    handle("clipboard:read", () => {
      const t = TEST ? testRead("clipboard.txt") : clipboard.readText();
      const s = C.str(t, 20000).trim();
      const url = /^https?:\/\/\S+$/i.test(s) ? C.normalizeSourceUrl(s) : "";
      return { text: url ? "" : s, url };
    });

    handle("window:mini", (on) => { setMini(on); return view(); });

    handle("export:md", async (opts) => {
      const excludePrivate = !!(opts && opts.excludePrivate);
      const file = await pickSave("note-master-notlar.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMarkdown(data.notes, { now: nowIso(), excludePrivate }), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), state: view() };
    });
    handle("export:json", async (opts) => {
      const excludePrivate = !!(opts && opts.excludePrivate);
      const file = await pickSave("note-master-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportJson(data.notes, { now: nowIso(), excludePrivate }), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), state: view() };
    });
    handle("import:json", async () => {
      const file = await pickOpen();
      if (!file) return { cancelled: true };
      const st = fs.statSync(file);
      if (st.size > 20 * 1024 * 1024) throw new Error("Dosya 20 MB sınırını aşıyor.");
      const r = C.importJson(fs.readFileSync(file, "utf8"), data.notes, nowIso());
      data.notes = [...r.added, ...data.notes];
      return { added: r.added.length, skipped: r.skipped, state: changed() };
    });

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:draft", async (id) => {
      const i = findNote(id);
      const note = data.notes[i];
      let p;
      try { p = C.aiPayload(note, data.settings); }
      catch (err) { if (note.private) { data.counters.privateBlocked++; save(); } throw err; }
      const prov = providerInfo();
      const ok = await approve(
        "“" + note.title + "” için görev/özet/anahtar kavram taslağı MyMind ile hazırlansın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Not başlığı ve metni (" + p.sent.chars + " karakter" + (p.sent.masked ? ", kişisel veriler maskelendi" : "") + ")" +
          (p.sent.host ? "\n• Kaynağın yalnız alan adı: " + p.sent.host : "") +
          (p.sent.private ? "\n• Bu not GİZLİ; Ayarlar'da verdiğiniz açık izinle gönderiliyor." : "") +
          "\n\nModelin rolü (Notion): Uzun notu taslağa çevirir; özgün metniniz değiştirilmez.",
        "Taslak hazırla"
      );
      if (!ok) return { approved: false };
      const draft = C.validateAi(await askModel(p.messages, 700), note, prov.name, nowIso());
      data.notes[i] = { ...note, aiDraft: draft };
      data.counters.aiRuns++;
      data.counters.aiDroppedConcepts += draft.droppedConcepts;
      data.counters.aiDroppedRewrites += draft.droppedRewrites;
      return { approved: true, draft, state: changed() };
    });
    handle("ai:applyTasks", (id, indices) => {
      const i = findNote(id);
      const tasks = C.tasksFromDraft(data.notes[i], indices, nowIso(), data.settings);
      data.notes = [...tasks, ...data.notes];
      return { added: tasks.length, state: changed() };
    });

    createWindow();
    if (!TEST) {
      try { globalShortcut.register("CommandOrControl+Shift+Space", summon); } catch { /* kısayol başka uygulamada olabilir */ }
    }
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}
