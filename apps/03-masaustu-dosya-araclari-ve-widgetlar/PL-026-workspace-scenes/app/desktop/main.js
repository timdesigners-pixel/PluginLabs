/* Workspace Scenes — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: sahne oluştur (bağlantı, klasör, uygulama, dosya) → önizle ve denetle → onay penceresinde açılış dizisini gör → sırayla aç.
 * Bu ürünün HİÇBİR kod yolu uygulama, pencere, sekme ya da işlem kapatmaz (doğrulama ölçütü: beklenmeyen kapatma sıfır).
 * Hesaplara otomatik giriş yapılmaz; yalnız kullanıcının eklediği hedefler açılır. Sahneler cihazda, kasa (DPAPI) varsa şifreli tutulur.
 * Ağ yalnız desktop/net.js içinde, onaylı MyMind isteği için. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, shell, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const net = require("./net");
const C = require("../src/core.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar/seçimler dosyadan gelir ve "açma" günlüğe yazılır.
if (process.env.WS_USER_DATA) app.setPath("userData", process.env.WS_USER_DATA);
const TEST = process.env.WS_TEST_DIR || "";
const PLATFORM = process.platform;
let win = null;
let memoryKey = null;
let scenes = [];
let settings = { defaultDelayMs: 700 };
let running = null; // { sceneId, step, total }
let pendingScene = sceneArg(process.argv);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "sahneler.bin" : "sahneler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
function sceneArg(argv) {
  const a = (argv || []).find((x) => /^--sahne=[a-z0-9]{6,24}$/.test(x));
  return a ? a.slice(8) : null;
}

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli) ----
function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}
function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : {};
    scenes = [];
    for (const s of Array.isArray(d.scenes) ? d.scenes : []) { try { scenes.push(C.normalizeScene(s, PLATFORM)); } catch { /* bozuk kayıt atlanır */ } }
    if (d.settings && C.DELAYS.includes(Number(d.settings.defaultDelayMs))) settings.defaultDelayMs = Number(d.settings.defaultDelayMs);
  } catch { scenes = []; }
}
function save() {
  const json = JSON.stringify({ version: 1, settings, scenes });
  if (vault()) {
    writeAtomic(dataFile(true), safeStorage.encryptString(json));
    fs.rmSync(dataFile(false), { force: true });
  } else writeAtomic(dataFile(false), json);
}
function view() {
  return { scenes, settings, running, vault: vault(), hasKey: !!readKey(), platform: PLATFORM, delays: C.DELAYS, templates: C.TEMPLATES.map((t) => ({ key: t.key, name: t.name, purpose: t.purpose })), canShortcut: PLATFORM === "win32" || !!TEST };
}
const push = () => { if (win) win.webContents.send("state:changed", view()); };
const scene = (id) => {
  const s = typeof id === "string" ? scenes.find((x) => x.id === id) : null;
  if (!s) throw new Error("Sahne bulunamadı.");
  return s;
};

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1180, height: 760, minWidth: 920, minHeight: 600, useContentSize: true, autoHideMenuBar: true,
    title: "Workspace Scenes",
    icon: path.join(root, "icons", "icon256.png"),
    backgroundColor: "#0e1322",
    show: false,
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

// ---- Yol seçimi ----
async function pickPath(type) {
  if (TEST) return testRead("pick-" + type + ".txt") || null;
  const props = type === "folder" ? ["openDirectory"] : ["openFile"];
  const filters = type === "app" && PLATFORM === "win32" ? [{ name: "Uygulama veya kısayol", extensions: ["exe", "lnk", "appref-ms", "url"] }] : undefined;
  const r = await dialog.showOpenDialog(win, { title: type === "folder" ? "Klasör seçin" : type === "app" ? "Uygulama seçin" : "Dosya seçin", properties: props, filters, defaultPath: type === "app" && PLATFORM === "win32" ? "C:\\Program Files" : undefined });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}

// ---- Denetim ve açma ----
function checkItem(it) {
  if (it.type === "url") return { id: it.id, ok: true };
  try {
    const st = fs.statSync(it.target);
    if (it.type === "folder" && !st.isDirectory()) return { id: it.id, ok: false, error: "Klasör değil" };
    if (it.type !== "folder" && !st.isFile()) return { id: it.id, ok: false, error: "Dosya değil" };
    return { id: it.id, ok: true };
  } catch { return { id: it.id, ok: false, error: "Bulunamadı" }; }
}
/** Basit argüman ayrıştırma: boşlukla ayrılır, "çift tırnak" içi tek argüman. Kabuk KULLANILMAZ. */
function splitArgs(s) {
  const out = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(String(s || "")))) out.push(m[1] != null ? m[1] : m[2]);
  return out.slice(0, 20);
}
async function openItem(it) {
  if (TEST) {
    if (it.type !== "url") { const c = checkItem(it); if (!c.ok) throw new Error(c.error); }
    testLog("opened.txt", it.type + "\t" + it.target + (it.args ? "\t" + it.args : ""));
    return;
  }
  if (it.type === "url") {
    const u = C.normalizeUrl(it.target);
    if (!u) throw new Error("Geçersiz bağlantı");
    await shell.openExternal(u, { activate: true });
    return;
  }
  const c = checkItem(it);
  if (!c.ok) throw new Error(c.error);
  if (it.type === "app" && it.args && C.extOf(it.target) === "exe") {
    await new Promise((resolve, reject) => {
      const child = spawn(it.target, splitArgs(it.args), { detached: true, stdio: "ignore", shell: false, windowsHide: false, cwd: path.dirname(it.target) });
      child.once("error", reject);
      child.once("spawn", () => { child.unref(); resolve(); });
    });
    return;
  }
  const err = await shell.openPath(it.target);
  if (err) throw new Error(err);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launchScene(id, onlyIds) {
  if (running) throw new Error("Bir sahne zaten açılıyor.");
  const s = scene(id);
  const plan = C.launchPlan(s, onlyIds);
  if (!plan.steps.length) throw new Error("Açılacak etkin öğe yok.");
  const ok = await approve("Sahne açılsın mı?", C.planText(s, plan), "Aç");
  if (!ok) return { approved: false };
  const t0 = Date.now();
  const results = [];
  running = { sceneId: s.id, step: 0, total: plan.steps.length };
  push();
  try {
    for (const step of plan.steps) {
      running = { sceneId: s.id, step: step.n, total: plan.steps.length, label: step.label };
      push();
      const it = s.items.find((x) => x.id === step.id);
      try { await openItem(it); results.push({ id: it.id, label: it.label, ok: true }); }
      catch (e) { results.push({ id: it.id, label: it.label, ok: false, error: String(e && e.message ? e.message : e).slice(0, 200) }); }
      if (step.n < plan.steps.length && s.delayMs) await wait(s.delayMs);
    }
  } finally {
    running = null;
  }
  const rec = { at: Date.now(), ms: Date.now() - t0, opened: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  s.launches = (s.launches || []).concat(rec).slice(-30);
  save();
  push();
  return { approved: true, ...rec, results };
}

// ---- Masaüstü kısayolu (Windows): uygulamayı --sahne=<kimlik> ile açar; açılışta yine onay istenir. ----
async function makeShortcut(id) {
  const s = scene(id);
  const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  const safe = s.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim().slice(0, 50) || "Sahne";
  const file = path.join(app.getPath("desktop"), safe + " (Workspace Scenes).lnk");
  if (TEST) { testLog("shortcuts.txt", file + "\t" + exe + "\t--sahne=" + s.id); return { file }; }
  if (PLATFORM !== "win32") throw new Error("Masaüstü kısayolu yalnız Windows'ta oluşturulur.");
  const ok = shell.writeShortcutLink(file, "create", { target: exe, args: "--sahne=" + s.id, description: "Workspace Scenes: " + s.name, icon: exe, iconIndex: 0 });
  if (!ok) throw new Error("Kısayol oluşturulamadı.");
  return { file };
}

// ---- MyMind istemci anahtarı: kasada şifreli; düz metin diske yazılmaz. ----
const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() {
  if (memoryKey) return memoryKey;
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* anahtar yok */ }
  return null;
}
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}
const hubUrl = () => (TEST && process.env.WS_HUB_URL) || net.HUB_URL;

function upsertScene(raw) {
  const x = raw && typeof raw === "object" ? raw : {};
  const existing = x.id ? scenes.find((s) => s.id === x.id) : null;
  if (!existing && scenes.length >= C.MAX_SCENES) throw new Error("En fazla " + C.MAX_SCENES + " sahne kaydedilebilir.");
  const n = C.normalizeScene({ delayMs: settings.defaultDelayMs, ...(existing || {}), ...x, launches: existing ? existing.launches : [], createdAt: existing ? existing.createdAt : Date.now(), updatedAt: Date.now() }, PLATFORM);
  if (Array.isArray(x.items) && x.items.length && !n.items.length) throw new Error("Öğeler geçersiz.");
  if (existing) Object.assign(existing, n);
  else scenes.push(n);
  save();
  push();
  return n;
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", (_e, argv) => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
    const id = sceneArg(argv);
    if (id) win.webContents.send("scene:requested", id);
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    load();
    handle("state:get", () => view());
    handle("pending:take", () => { const id = pendingScene; pendingScene = null; return id && scenes.some((s) => s.id === id) ? id : null; });
    handle("settings:set", (patch) => {
      if (patch && C.DELAYS.includes(Number(patch.defaultDelayMs))) settings.defaultDelayMs = Number(patch.defaultDelayMs);
      save(); push(); return view();
    });
    handle("scene:save", (raw) => upsertScene(raw));
    handle("scene:fromTemplate", (key) => upsertScene(C.fromTemplate(key)));
    handle("scene:duplicate", (id) => { const s = scene(id); return upsertScene({ ...s, id: undefined, name: (s.name + " (kopya)").slice(0, 60), items: s.items.map((i) => ({ ...i, id: undefined })) }); });
    // Silme yerine arşiv: arşivlenen sahne geri alınabilir.
    handle("scene:archive", (id, archived) => { const s = scene(id); s.archived = !!archived; s.updatedAt = Date.now(); save(); push(); return { archived: s.archived }; });
    handle("scene:addItem", (id, item) => {
      const s = scene(id);
      if (s.items.length >= C.MAX_ITEMS) throw new Error("Bir sahnede en fazla " + C.MAX_ITEMS + " öğe olabilir.");
      const n = C.normalizeItem(item, PLATFORM);
      if (s.items.some((i) => i.type === n.type && C.fold(i.target) === C.fold(n.target))) throw new Error("Bu öğe sahnede zaten var.");
      s.items.push(n); s.updatedAt = Date.now(); save(); push(); return n;
    });
    handle("scene:pickItem", async (id, type) => {
      if (!["folder", "app", "file"].includes(type)) throw new Error("Geçersiz tür.");
      const s = scene(id);
      const p = await pickPath(type);
      if (!p) return { cancelled: true };
      if (s.items.length >= C.MAX_ITEMS) throw new Error("Bir sahnede en fazla " + C.MAX_ITEMS + " öğe olabilir.");
      const n = C.normalizeItem({ type, target: path.resolve(p) }, PLATFORM);
      if (s.items.some((i) => i.type === n.type && C.fold(i.target) === C.fold(n.target))) return { exists: true };
      s.items.push(n); s.updatedAt = Date.now(); save(); push(); return n;
    });
    handle("scene:pasteUrls", (id, text) => {
      const s = scene(id);
      const list = C.parseUrlList(text);
      let added = 0;
      for (const u of list) {
        if (s.items.length >= C.MAX_ITEMS) break;
        if (s.items.some((i) => i.type === "url" && i.target === u.target)) continue;
        s.items.push(C.normalizeItem(u, PLATFORM)); added++;
      }
      s.updatedAt = Date.now(); save(); push(); return { found: list.length, added };
    });
    handle("scene:check", (id) => scene(id).items.map(checkItem));
    handle("scene:launch", (id, onlyIds) => launchScene(id, onlyIds));
    handle("scene:shortcut", (id) => makeShortcut(id));
    handle("data:export", async () => {
      const text = C.exportData(scenes);
      let file;
      if (TEST) file = path.join(TEST, "yedek.json");
      else {
        const r = await dialog.showSaveDialog(win, { title: "Sahneleri dışa aktar", defaultPath: "workspace-scenes-yedek.json", filters: [{ name: "JSON", extensions: ["json"] }] });
        if (r.canceled || !r.filePath) return { cancelled: true };
        file = r.filePath;
      }
      fs.writeFileSync(file, text);
      return { file, count: scenes.length };
    });
    handle("data:import", async () => {
      let file;
      if (TEST) file = testRead("import.txt");
      else {
        const r = await dialog.showOpenDialog(win, { title: "Yedekten içe aktar", properties: ["openFile"], filters: [{ name: "JSON", extensions: ["json"] }] });
        if (r.canceled || !r.filePaths.length) return { cancelled: true };
        file = r.filePaths[0];
      }
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > 2 * 1024 * 1024) throw new Error("Yedek dosyası 2 MB'tan büyük olamaz.");
      const r = C.importData(fs.readFileSync(file, "utf8"), PLATFORM);
      const room = C.MAX_SCENES - scenes.length;
      const add = r.scenes.slice(0, Math.max(0, room));
      scenes.push(...add);
      save(); push();
      return { added: add.length, skipped: r.skipped + (r.scenes.length - add.length) };
    });
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:suggest", async (id, task) => {
      const key = readKey();
      if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
      const s = scene(id);
      const p = C.mymindPayload(task || s.name, s);
      const ok = await approve("MyMind'a gönderilsin mi? (sahne önerisi)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Görev: " + p.sent.task + (p.sent.purpose ? "\n• Amaç: " + p.sent.purpose : "") +
        "\n• Sahnedeki öğelerin türü ve adı" + (p.sent.items.length ? ":\n" + p.sent.items.join("\n") : " (boş)") +
        "\n\nKlasör/dosya/uygulama yolları, tam bağlantı adresleri ve argümanlar gönderilmez. Öneriler siz eklemedikçe sahneye girmez.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("mymind-sent.json", JSON.stringify(p.messages));
      let content;
      try { content = await net.mymindChat(hubUrl(), key, p.messages, 600); } catch (err) {
        const m = err && err.message ? err.message : String(err);
        throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
      }
      return { approved: true, ...C.validateAi(content, s) };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi penceremizden gelen çağrıları kabul eder.
function assertOwn(e) {
  if (!win || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
