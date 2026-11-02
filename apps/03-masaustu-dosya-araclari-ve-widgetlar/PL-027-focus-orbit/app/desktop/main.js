/* Focus Orbit — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: tek görev yaz (isteğe bağlı adımlar) → odak seansını başlat → her zaman üstte, sürüklenebilir odak balonu kalan süreyi gösterir →
 * süre bitince bildirim ve mola → mola bitince bildirim. Dikkat dağılınca "Dağıldım" ile kayıt (kullanıcı bildirimi; ekran izlenmez).
 * Zamanlayıcının tek yetkilisi bu süreçtir; pencereler yalnız gösterir. Hiçbir uygulama, pencere ya da sekme kapatılmaz.
 * Kayıtlar cihazda, kasa (DPAPI) varsa şifreli. Ağ yalnız desktop/net.js içinde, onaylı MyMind isteği için. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, Notification, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar dosyadan gelir, bildirimler günlüğe yazılır.
if (process.env.FO_USER_DATA) app.setPath("userData", process.env.FO_USER_DATA);
const TEST = process.env.FO_TEST_DIR || "";
// TEST kipinde saat hızlandırılabilir (ör. 600 → 1 dakika 0,1 saniyede geçer). Gerçek kullanımda saat Date.now().
const SPEED = TEST ? Math.max(1, Number(process.env.FO_SPEED) || 1) : 1;
const T0 = Date.now();
const now = () => (SPEED === 1 ? Date.now() : T0 + (Date.now() - T0) * SPEED);

let win = null;
let bubble = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), task: { title: "", steps: [] }, sites: [], sessions: [], bubblePos: null };
let timer = C.IDLE;
let ticker = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "odak.bin" : "odak.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli) ----
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
    data.task = C.normalizeTask(d.task);
    data.sites = C.normalizeSites(d.sites);
    // Uygulama seans sırasında kapandıysa o seans "erken bitirildi" sayılır (normalizeSession running → stopped).
    data.sessions = (Array.isArray(d.sessions) ? d.sessions : []).map(C.normalizeSession).filter(Boolean).slice(-C.MAX_SESSIONS);
    data.bubblePos = d.bubblePos && Number.isFinite(d.bubblePos.x) && Number.isFinite(d.bubblePos.y) ? { x: Math.round(d.bubblePos.x), y: Math.round(d.bubblePos.y) } : null;
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) {
    writeAtomic(dataFile(true), safeStorage.encryptString(json));
    fs.rmSync(dataFile(false), { force: true });
  } else writeAtomic(dataFile(false), json);
}

// ---- Durum ----
const current = () => (timer.sessionId ? data.sessions.find((s) => s.id === timer.sessionId) : null) || null;
function timerView() {
  const t = now();
  const s = current();
  return {
    phase: timer.phase, paused: !!timer.pausedAt, long: !!timer.long, remainingMs: C.remaining(timer, t), durationMs: timer.durationMs || 0,
    elapsedMs: C.elapsed(timer, t), task: timer.phase === "focus" ? (s ? s.task : data.task.title) : "", interruptions: s ? s.interruptions.length : 0,
  };
}
function view() {
  const t = now();
  return {
    settings: data.settings, task: data.task, sites: data.sites, sessions: data.sessions.slice(-200).reverse(),
    stats: C.weekStats(data.sessions, t, data.settings.weeklyGoal), topSites: C.topSites(data.sessions, 5), timer: timerView(),
    bubble: !!(bubble && bubble.isVisible()), vault: vault(), hasKey: !!readKey(), platform: process.platform, presets: C.PRESETS, now: t,
  };
}
function send(channel, payload) {
  for (const w of [win, bubble]) if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
}
const push = () => send("state:changed", view());

// ---- Bildirim ----
function notify(title, body) {
  if (TEST) { testLog("notifications.txt", title + "\t" + body); return; }
  if (!data.settings.notify || !Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: false, icon: path.join(root, "icons", "icon256.png") });
  n.on("click", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  n.show();
}

// ---- Zamanlayıcı (tek yetkili) ----
function ensureTicker() {
  if (timer.phase === "idle") { if (ticker) { clearInterval(ticker); ticker = null; } return; }
  if (!ticker) ticker = setInterval(tick, TEST ? 100 : 500);
}
function tick() {
  const t = now();
  if (C.isDue(timer, t)) {
    if (timer.phase === "focus") finishFocus(t, true);
    else finishBreak();
    return;
  }
  send("timer:tick", timerView());
}
function finishFocus(t, completed) {
  const s = current();
  if (s) {
    s.status = completed ? "done" : "stopped";
    s.focusMs = C.elapsed(timer, t);
    s.endedAt = t;
    s.stepsDone = data.task.title === s.task ? data.task.steps.filter((x) => x.done).length : s.stepsDone;
    s.stepsTotal = data.task.title === s.task ? data.task.steps.length : s.stepsTotal;
  }
  if (completed) {
    const st = C.startBreak(data.settings, t, C.completedToday(data.sessions, t));
    const mins = Math.round(st.durationMs / C.MIN);
    notify("Odak seansı bitti", (s ? "“" + s.task + "” · " : "") + (data.settings.autoBreak ? (st.long ? "Uzun mola: " : "Mola: ") + mins + " dk. Ekrandan kalkıp gözlerinizi dinlendirin." : "Hazır olduğunuzda molayı başlatın."));
    timer = data.settings.autoBreak ? st : C.IDLE;
  } else timer = C.IDLE;
  save();
  ensureTicker();
  push();
}
function finishBreak() {
  timer = C.IDLE;
  notify("Mola bitti", data.task.title ? "Sıradaki: “" + data.task.title + "”. Hazırsanız yeni odak seansını başlatın." : "Hazırsanız yeni odak seansını başlatın.");
  ensureTicker();
  push();
}
function startFocus() {
  if (timer.phase === "focus") throw new Error("Zaten bir odak seansı sürüyor.");
  const t = now();
  const s = C.newSession(data.task, data.settings, t);
  data.sessions.push(s);
  if (data.sessions.length > C.MAX_SESSIONS) data.sessions = data.sessions.slice(-C.MAX_SESSIONS);
  timer = C.startFocus(data.settings, t, s.id);
  save();
  ensureTicker();
  if (data.settings.bubbleOnStart) showBubble(true);
  push();
  return timerView();
}

// ---- Pencereler ----
const WEB = (file) => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, additionalArguments: ["--fo-view=" + file] });
function lockDown(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1120, height: 740, minWidth: 900, minHeight: 600, useContentSize: true, autoHideMenuBar: true,
    title: "Focus Orbit", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: WEB("main"),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  lockDown(win);
  win.on("closed", () => { win = null; if (bubble && !bubble.isDestroyed()) bubble.destroy(); bubble = null; });
}
const BW = 320, BH = 104;
function bubbleBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const p = data.bubblePos;
  // Kayıtlı konum herhangi bir ekranın içinde değilse varsayılan: birincil ekranın sağ üstü.
  if (p && screen.getAllDisplays().some((d) => p.x >= d.workArea.x - BW / 2 && p.x <= d.workArea.x + d.workArea.width - BW / 2 && p.y >= d.workArea.y && p.y <= d.workArea.y + d.workArea.height - 40)) return { x: p.x, y: p.y, width: BW, height: BH };
  return { x: wa.x + wa.width - BW - 24, y: wa.y + 24, width: BW, height: BH };
}
function showBubble(show) {
  if (!show) { if (bubble && !bubble.isDestroyed()) bubble.hide(); push(); return false; }
  if (!bubble || bubble.isDestroyed()) {
    bubble = new BrowserWindow({
      ...bubbleBounds(), frame: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true,
      alwaysOnTop: true, title: "Focus Orbit — odak balonu", backgroundColor: "#121828", show: false, focusable: true, hasShadow: true,
      webPreferences: WEB("bubble"),
    });
    bubble.setAlwaysOnTop(true, "floating");
    bubble.setVisibleOnAllWorkspaces(true);
    bubble.loadFile(path.join(root, "bubble.html"));
    lockDown(bubble);
    bubble.once("ready-to-show", () => { bubble.showInactive(); push(); });
    let moveTimer = null;
    bubble.on("moved", () => {
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => { if (bubble && !bubble.isDestroyed()) { const b = bubble.getBounds(); data.bubblePos = { x: b.x, y: b.y }; save(); } }, 400);
    });
    bubble.on("closed", () => { bubble = null; push(); });
  } else if (!bubble.isVisible()) bubble.showInactive();
  push();
  return true;
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
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
const hubUrl = () => (TEST && process.env.FO_HUB_URL) || net.HUB_URL;
async function askMymind(messages, maxTokens) {
  const key = readKey();
  if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) testLog("mymind-sent.json", JSON.stringify(messages));
  try { return await net.mymindChat(hubUrl(), key, messages, maxTokens); } catch (err) {
    const m = err && err.message ? err.message : String(err);
    throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
  }
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}
function changed() { save(); push(); return view(); }
const step = (id) => {
  const s = data.task.steps.find((x) => x.id === id);
  if (!s) throw new Error("Adım bulunamadı.");
  return s;
};

if (gotLock) {
  app.on("second-instance", () => { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.focus-orbit");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => { data.settings = C.normalizeSettings({ ...data.settings, ...(patch || {}) }); return changed(); });
    handle("task:set", (title) => {
      const t = C.str(title, 120);
      if (timer.phase === "focus" && t !== data.task.title) throw new Error("Seans sürerken görev değiştirilemez; önce seansı bitirin.");
      // Yeni görev: önceki adımlar bu göreve ait değildir.
      if (C.fold(t) !== C.fold(data.task.title)) data.task = { title: t, steps: [] };
      else data.task.title = t;
      return changed();
    });
    handle("step:add", (text) => {
      if (data.task.steps.length >= C.MAX_STEPS) throw new Error("En fazla " + C.MAX_STEPS + " adım eklenebilir.");
      const n = C.normalizeStep({ text, ai: false });
      if (!n) throw new Error("Adım boş olamaz.");
      if (data.task.steps.some((s) => C.fold(s.text) === C.fold(n.text))) throw new Error("Bu adım zaten var.");
      data.task.steps.push(n);
      return changed();
    });
    handle("step:addMany", (list) => {
      let added = 0;
      for (const text of Array.isArray(list) ? list.slice(0, C.MAX_STEPS) : []) {
        if (data.task.steps.length >= C.MAX_STEPS) break;
        const n = C.normalizeStep({ text, ai: true });
        if (n && !data.task.steps.some((s) => C.fold(s.text) === C.fold(n.text))) { data.task.steps.push(n); added++; }
      }
      changed();
      return { added };
    });
    handle("step:toggle", (id) => { const s = step(id); s.done = !s.done; return changed(); });
    handle("step:remove", (id) => { step(id); data.task.steps = data.task.steps.filter((s) => s.id !== id); return changed(); });
    handle("step:move", (id, dir) => {
      const i = data.task.steps.findIndex((s) => s.id === id);
      const j = i + (dir < 0 ? -1 : 1);
      if (i < 0 || j < 0 || j >= data.task.steps.length) return view();
      const a = data.task.steps;
      [a[i], a[j]] = [a[j], a[i]];
      return changed();
    });
    handle("timer:start", () => startFocus());
    handle("timer:pause", () => { timer = C.pause(timer, now()); push(); return timerView(); });
    handle("timer:resume", () => { timer = C.resume(timer, now()); push(); return timerView(); });
    handle("timer:extend", (m) => { timer = C.extend(timer, m); push(); return timerView(); });
    handle("timer:stop", () => {
      if (timer.phase === "focus") finishFocus(now(), false);
      else if (timer.phase === "break") { timer = C.IDLE; ensureTicker(); push(); }
      return timerView();
    });
    handle("timer:break", () => {
      if (timer.phase !== "idle") throw new Error("Önce mevcut evreyi bitirin.");
      timer = C.startBreak(data.settings, now(), C.completedToday(data.sessions, now()));
      ensureTicker(); push(); return timerView();
    });
    handle("interrupt:log", (site, note) => {
      const s = current();
      if (!s || timer.phase !== "focus") throw new Error("Kesinti yalnız odak seansı sırasında kaydedilir.");
      const i = data.sessions.indexOf(s);
      data.sessions[i] = C.addInterruption(s, site, note, now());
      changed();
      return { count: data.sessions[i].interruptions.length };
    });
    handle("sites:add", (text) => {
      const add = C.parseSiteList(text);
      if (!add.length) throw new Error("Geçerli site adı bulunamadı (ör. youtube.com).");
      const before = data.sites.length;
      data.sites = C.normalizeSites(data.sites.concat(add));
      changed();
      return { added: data.sites.length - before };
    });
    handle("sites:toggle", (host) => { const s = data.sites.find((x) => x.host === host); if (!s) throw new Error("Site bulunamadı."); s.on = !s.on; return changed(); });
    handle("sites:remove", (host) => { data.sites = data.sites.filter((x) => x.host !== host); return changed(); });
    handle("bubble:show", (show) => showBubble(show !== false));
    handle("main:show", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } return true; });
    handle("data:export", async () => {
      const text = C.exportData(data);
      let file;
      if (TEST) file = path.join(TEST, "yedek.json");
      else {
        const r = await dialog.showSaveDialog(win, { title: "Odak kayıtlarını dışa aktar", defaultPath: "focus-orbit-yedek.json", filters: [{ name: "JSON", extensions: ["json"] }] });
        if (r.canceled || !r.filePath) return { cancelled: true };
        file = r.filePath;
      }
      fs.writeFileSync(file, text);
      return { file, count: data.sessions.length };
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
      if (fs.statSync(file).size > 5 * 1024 * 1024) throw new Error("Yedek dosyası 5 MB'tan büyük olamaz.");
      const r = C.importData(fs.readFileSync(file, "utf8"), data.sessions);
      data.sessions = data.sessions.concat(r.sessions).sort((a, b) => a.startedAt - b.startedAt).slice(-C.MAX_SESSIONS);
      const before = data.sites.length;
      data.sites = C.normalizeSites(data.sites.concat(r.sites));
      changed();
      return { added: r.sessions.length, skipped: r.skipped, sites: data.sites.length - before };
    });
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:split", async () => {
      const p = C.splitPayload(data.task);
      const ok = await approve("MyMind'a gönderilsin mi? (görev parçalama)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şu gönderilir:\n• Görev: " + p.sent.task +
        "\n\nAdımlarınız, seans kayıtlarınız ve dikkat listeniz gönderilmez. Önerilen adımlar siz eklemedikçe göreve girmez.", "Gönder");
      if (!ok) return { approved: false };
      return { approved: true, ...C.validateSteps(await askMymind(p.messages, 400), data.task) };
    });
    handle("mymind:summary", async (id) => {
      const s = data.sessions.find((x) => x.id === id);
      if (!s || s.status === "running") throw new Error("Bitmiş bir seans seçin.");
      const p = C.summaryPayload(s, data.task);
      const ok = await approve("MyMind'a gönderilsin mi? (seans sonu özeti)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Görev: " + p.sent.task + "\n• Planlanan / odaklanılan süre: " + p.sent.plannedMin + " / " + p.sent.focusMin + " dk (" + p.sent.status + ")" +
        "\n• Bildirilen kesinti sayısı: " + p.sent.interruptions + (p.sent.steps.length ? "\n• Adımlar ve işaretleri:\n" + p.sent.steps.join("\n") : "") +
        "\n\nKesintilerin hangi sitede olduğu ve notları gönderilmez. Özet siz kaydetmedikçe seansa yazılmaz.", "Gönder");
      if (!ok) return { approved: false };
      return { approved: true, ...C.validateSummary(await askMymind(p.messages, 300)) };
    });
    handle("session:saveSummary", (id, text) => {
      const s = data.sessions.find((x) => x.id === id);
      if (!s) throw new Error("Seans bulunamadı.");
      s.summary = C.str(text, 400);
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi pencerelerimizden (ana pencere, odak balonu) gelen çağrıları kabul eder.
function assertOwn(e) {
  const ok = (win && e.sender === win.webContents) || (bubble && !bubble.isDestroyed() && e.sender === bubble.webContents);
  if (!ok) throw new Error("Yetkisiz istek.");
}
