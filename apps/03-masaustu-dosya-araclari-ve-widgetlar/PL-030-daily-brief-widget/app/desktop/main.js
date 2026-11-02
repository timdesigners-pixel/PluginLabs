/* Daily Brief Widget — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yerel görevler + kullanıcının eklediği takvimler (yerel etkinlik, .ics dosyası, onaylı .ics abonelik adresi) → günün özeti →
 * her zaman üstte, sürüklenebilir widget + ana pencere. Sabah saatinde bir kez bildirim. Takvimlere hiçbir şey yazılmaz.
 * Kayıtlar cihazda, kasa (DPAPI) varsa şifreli. Ağ yalnız desktop/net.js içinde: abonelik adresinden okuma ve onaylı MyMind isteği. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, Notification, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir, bildirimler günlüğe yazılır.
if (process.env.DB_USER_DATA) app.setPath("userData", process.env.DB_USER_DATA);
const TEST = process.env.DB_TEST_DIR || "";
// TEST kipinde saat sabit bir andan başlatılabilir (DB_NOW, ISO yerel saat). Gerçek kullanımda saat Date.now().
const T0 = Date.now();
// Tarih/saat alanları Türkçe biçimde (24 saat) görünsün.
app.commandLine.appendSwitch("lang", "tr-TR");
const BASE = TEST && process.env.DB_NOW ? new Date(process.env.DB_NOW).getTime() : null;
const now = () => (BASE ? BASE + (Date.now() - T0) : Date.now());

let win = null;
let widget = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), tasks: [], sources: C.normalizeSources([]), metrics: C.normalizeMetrics({}), widgetPos: null, notifiedOn: "" };
const fetching = new Set();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "ozet.bin" : "ozet.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli — abonelik adresleri gizli anahtar içerebilir) ----
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
    data.tasks = C.normalizeTasks(d.tasks);
    data.sources = C.normalizeSources(d.sources);
    data.metrics = C.normalizeMetrics(d.metrics);
    data.widgetPos = d.widgetPos && Number.isFinite(d.widgetPos.x) && Number.isFinite(d.widgetPos.y) ? { x: Math.round(d.widgetPos.x), y: Math.round(d.widgetPos.y) } : null;
    data.notifiedOn = typeof d.notifiedOn === "string" ? d.notifiedOn : "";
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
const local = () => data.sources.find((s) => s.kind === "local");
const source = (id) => { const s = data.sources.find((x) => x.id === id); if (!s) throw new Error("Takvim bulunamadı."); return s; };
function view() {
  const t = now();
  const b = C.brief(data, t);
  const before = JSON.stringify(data.metrics.days[b.date] || null);
  C.recordShown(data.metrics, b);
  if (JSON.stringify(data.metrics.days[b.date]) !== before) save();
  const day = data.metrics.days[b.date];
  return {
    settings: data.settings, tasks: data.tasks, brief: b, readToday: !!(day && day.readAt), flagged: day ? day.flagged : [],
    localEvents: local().events.slice().sort((a, b2) => a.start - b2.start),
    sources: data.sources.map((s) => ({ id: s.id, kind: s.kind, name: s.name, link: C.sourceLink(s), refreshMin: s.refreshMin, lastFetched: s.lastFetched, lastError: s.lastError, enabled: s.enabled, hideAll: s.hideAll, count: s.events.length, tzUnknown: s.tzUnknown, fetching: fetching.has(s.id) })),
    stats: C.stats(data.metrics, t, 14), widget: !!(widget && widget.isVisible()), vault: vault(), hasKey: !!readKey(), platform: process.platform, now: t,
  };
}
function send(channel, payload) {
  for (const w of [win, widget]) if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
}
const push = () => send("state:changed", view());
function changed() { save(); push(); return view(); }

// ---- Bildirim: sabah saatinde (ya da uygulama o saatten sonra açılınca) günde bir kez ----
function notify(title, body) {
  if (TEST) { testLog("notifications.txt", title + "\t" + body); return; }
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: false, icon: path.join(root, "icons", "icon256.png") });
  n.on("click", () => showWidget(true));
  n.show();
}
function morningCheck() {
  const t = now();
  const key = C.dateKey(t);
  if (!data.settings.notify || data.notifiedOn === key) return;
  const mins = new Date(t).getHours() * 60 + new Date(t).getMinutes();
  if (mins < C.parseHM(data.settings.briefTime)) return;
  const b = C.brief(data, t);
  data.notifiedOn = key;
  save();
  notify("Günün özeti hazır", b.headline + (b.next ? " · ilk: " + (b.next.start > t ? C.clock(b.next.start) + " " : "şimdi ") + b.next.title : "") + (b.staleEvents ? " · bazı takvim verileri eskimiş" : ""));
}

// ---- Takvim aboneliği: yalnız okuma ----
async function refreshSource(src, manual) {
  if (src.kind !== "url" || fetching.has(src.id)) return;
  fetching.add(src.id);
  push();
  try {
    const text = await net.fetchIcs(src.url, !!TEST);
    const r = C.parseICS(text);
    src.events = r.events.map((e) => C.normalizeEvent(e)).filter(Boolean);
    src.tzUnknown = r.stats.tzUnknown;
    src.lastFetched = now();
    src.lastError = "";
    return r;
  } catch (e) {
    src.lastError = C.str(e && e.message ? e.message : e, 200);
    if (manual) throw new Error(src.lastError);
  } finally {
    fetching.delete(src.id);
    save();
    push();
  }
}
function refreshDue() {
  const t = now();
  for (const s of data.sources) if (s.kind === "url" && s.enabled && (!s.lastFetched || t - s.lastFetched >= s.refreshMin * C.MIN)) refreshSource(s, false);
}

// ---- Pencereler ----
const WEB = (file) => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, additionalArguments: ["--db-view=" + file] });
function lockDown(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1180, height: 760, minWidth: 940, minHeight: 600, useContentSize: true, autoHideMenuBar: true,
    title: "Daily Brief Widget", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
    webPreferences: WEB("main"),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  lockDown(win);
  win.on("closed", () => { win = null; if (widget && !widget.isDestroyed()) widget.destroy(); widget = null; });
}
const WW = 360, WH = 560;
function widgetBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const p = data.widgetPos;
  // Kayıtlı konum hiçbir ekranın içinde değilse varsayılan: birincil ekranın sağ üstü.
  if (p && screen.getAllDisplays().some((d) => p.x >= d.workArea.x - WW / 2 && p.x <= d.workArea.x + d.workArea.width - WW / 2 && p.y >= d.workArea.y && p.y <= d.workArea.y + d.workArea.height - 60)) return { x: p.x, y: p.y, width: WW, height: WH };
  return { x: wa.x + wa.width - WW - 24, y: wa.y + 24, width: WW, height: Math.min(WH, wa.height - 48) };
}
function showWidget(show) {
  if (!show) { if (widget && !widget.isDestroyed()) widget.hide(); push(); return false; }
  if (!widget || widget.isDestroyed()) {
    widget = new BrowserWindow({
      ...widgetBounds(), frame: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true,
      alwaysOnTop: true, title: "Daily Brief — bugün", backgroundColor: "#121828", show: false, focusable: true, hasShadow: true,
      webPreferences: WEB("widget"),
    });
    widget.setAlwaysOnTop(true, "floating");
    widget.loadFile(path.join(root, "widget.html"));
    lockDown(widget);
    widget.once("ready-to-show", () => { widget.showInactive(); push(); });
    let moveTimer = null;
    widget.on("moved", () => {
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => { if (widget && !widget.isDestroyed()) { const b = widget.getBounds(); data.widgetPos = { x: b.x, y: b.y }; save(); } }, 400);
    });
    widget.on("closed", () => { widget = null; push(); });
  } else if (!widget.isVisible()) widget.showInactive();
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
const hubUrl = () => (TEST && process.env.DB_HUB_URL) || net.HUB_URL;
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
const task = (id) => { const t = data.tasks.find((x) => x.id === id); if (!t) throw new Error("Görev bulunamadı."); return t; };
function eventFromInput(x) {
  const day = C.parseDateKey(x && x.date);
  if (day == null) throw new Error("Geçerli bir tarih seçin.");
  const title = C.str(x.title, 200);
  if (!title) throw new Error("Etkinlik başlığı boş olamaz.");
  if (x.allDay) return C.normalizeEvent({ title, start: day, end: C.addDays(day, 1), allDay: true, location: x.location, sensitive: x.sensitive });
  const a = C.parseHM(x.from), b = C.parseHM(x.to);
  if (a == null || b == null || b <= a) throw new Error("Bitiş saati başlangıçtan sonra olmalı.");
  return C.normalizeEvent({ title, start: C.atMinutes(day, a), end: C.atMinutes(day, b), location: x.location, sensitive: x.sensitive });
}
async function pickFile(title, filters) {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title, properties: ["openFile"], filters });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}

if (gotLock) {
  app.on("second-instance", () => { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.daily-brief-widget");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => { data.settings = C.normalizeSettings({ ...data.settings, ...(patch || {}) }); return changed(); });

    // Görevler
    handle("task:add", (x) => {
      if (data.tasks.length >= C.MAX_TASKS) throw new Error("En fazla " + C.MAX_TASKS + " görev tutulur; tamamlananları temizleyin.");
      const t = C.normalizeTask({ ...(x || {}), id: undefined, done: false, createdAt: now(), durationMin: x && x.durationMin ? x.durationMin : data.settings.defaultTaskMin });
      if (!t) throw new Error("Görev başlığı boş olamaz.");
      data.tasks.push(t);
      changed();
      return { id: t.id };
    });
    handle("task:update", (id, patch) => {
      const i = data.tasks.indexOf(task(id));
      const n = C.normalizeTask({ ...data.tasks[i], ...(patch || {}), id });
      if (!n) throw new Error("Görev başlığı boş olamaz.");
      data.tasks[i] = n;
      return changed();
    });
    handle("task:toggle", (id) => { const t = task(id); t.done = !t.done; t.doneAt = t.done ? now() : null; return changed(); });
    handle("task:remove", (id) => { task(id); data.tasks = data.tasks.filter((t) => t.id !== id); return changed(); });
    handle("task:clearDone", () => { const n = data.tasks.filter((t) => t.done).length; data.tasks = data.tasks.filter((t) => !t.done); changed(); return { removed: n }; });

    // Yerel etkinlikler
    handle("event:add", (x) => {
      const l = local();
      if (l.events.length >= 1000) throw new Error("En fazla 1000 yerel etkinlik tutulur.");
      const e = eventFromInput(x);
      l.events.push(e);
      changed();
      return { id: e.id };
    });
    handle("event:remove", (id) => { const l = local(); l.events = l.events.filter((e) => e.id !== id); return changed(); });

    // Takvimler
    handle("source:addFile", async () => {
      if (data.sources.length > C.MAX_SOURCES) throw new Error("En fazla " + C.MAX_SOURCES + " takvim eklenebilir.");
      const file = await pickFile("Takvim dosyası (.ics) seçin", [{ name: "iCalendar", extensions: ["ics", "ical", "ifb"] }]);
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > C.MAX_ICS_BYTES) throw new Error("Takvim dosyası 5 MB'tan büyük.");
      const r = C.parseICS(fs.readFileSync(file, "utf8"));
      const src = C.normalizeSource({ kind: "file", name: r.name || path.basename(file, path.extname(file)), file: path.basename(file), events: r.events, lastFetched: now(), tzUnknown: r.stats.tzUnknown });
      data.sources.push(src);
      changed();
      return { id: src.id, name: src.name, events: r.events.length, cancelled_events: r.stats.cancelled, tzUnknown: r.stats.tzUnknown, unsupported: r.stats.unsupportedRule };
    });
    handle("source:addUrl", async (rawUrl, name) => {
      if (data.sources.length > C.MAX_SOURCES) throw new Error("En fazla " + C.MAX_SOURCES + " takvim eklenebilir.");
      const url = C.normalizeIcsUrl(rawUrl, !!TEST);
      if (data.sources.some((s) => s.kind === "url" && s.url === url)) throw new Error("Bu takvim zaten ekli.");
      const host = new URL(url).hostname;
      const ok = await approve("Bu takvim adresinden okunsun mu?",
        "Daily Brief bu adresten takviminizi yalnız OKUR (her " + 60 + " dakikada bir; süreyi Takvimler bölümünden değiştirebilirsiniz):\n• " + host +
        "\n\nTakvime hiçbir şey yazılmaz, hiçbir veri gönderilmez. Adres gizli bir anahtar içerebilir; bu bilgisayarda Windows kasasında şifreli tutulur, yedeğe yazılmaz ve arayüzde yalnız alan adı gösterilir.", "Ekle ve oku");
      if (!ok) return { approved: false };
      const src = C.normalizeSource({ kind: "url", name: C.str(name, 60) || host, url, refreshMin: 60, events: [] });
      data.sources.push(src);
      save();
      try { await refreshSource(src, true); } catch (e) { push(); return { approved: true, id: src.id, error: C.str(e.message, 200) }; }
      if (!C.str(name, 60)) { /* takvim kendi adını veriyorsa kullanılır */ }
      return { approved: true, id: src.id, events: src.events.length, tzUnknown: src.tzUnknown };
    });
    handle("source:refresh", async (id) => {
      const s = source(id);
      if (s.kind === "url") { const r = await refreshSource(s, true); return { events: s.events.length, stats: r ? r.stats : null }; }
      if (s.kind === "file") {
        const file = await pickFile("Güncel takvim dosyasını seçin (" + s.file + ")", [{ name: "iCalendar", extensions: ["ics", "ical", "ifb"] }]);
        if (!file) return { cancelled: true };
        if (fs.statSync(file).size > C.MAX_ICS_BYTES) throw new Error("Takvim dosyası 5 MB'tan büyük.");
        const r = C.parseICS(fs.readFileSync(file, "utf8"));
        s.events = r.events; s.file = path.basename(file); s.lastFetched = now(); s.tzUnknown = r.stats.tzUnknown; s.lastError = "";
        changed();
        return { events: s.events.length };
      }
      return { events: s.events.length };
    });
    handle("source:set", (id, patch) => {
      const s = source(id);
      const p = patch || {};
      if (p.name != null) s.name = C.str(p.name, 60) || s.name;
      if (p.enabled != null) s.enabled = !!p.enabled;
      if (p.hideAll != null) s.hideAll = !!p.hideAll;
      if (p.refreshMin != null && C.REFRESH_CHOICES.includes(Number(p.refreshMin))) s.refreshMin = Number(p.refreshMin);
      return changed();
    });
    handle("source:remove", (id) => {
      const s = source(id);
      if (s.kind === "local") throw new Error("Yerel etkinlikler kaldırılamaz; etkinlikleri tek tek silebilirsiniz.");
      data.sources = data.sources.filter((x) => x.id !== id);
      return changed();
    });

    // Özet, okuma ve yanlış bildirimi (ölçüler)
    handle("brief:read", () => { C.markRead(data.metrics, C.dateKey(now()), now()); return changed(); });
    handle("brief:flag", (key) => { C.flagEvent(data.metrics, C.dateKey(now()), C.str(key, 120)); return changed(); });

    handle("widget:show", (show) => showWidget(show !== false));
    handle("main:show", (viewName) => {
      if (!win) createWindow();
      if (win.isMinimized()) win.restore();
      win.show(); win.focus();
      if (viewName) win.webContents.send("nav", String(viewName));
      return true;
    });
    handle("data:export", async () => {
      const text = C.exportData(data);
      let file;
      if (TEST) file = path.join(TEST, "yedek.json");
      else {
        const r = await dialog.showSaveDialog(win, { title: "Görevleri ve yerel etkinlikleri dışa aktar", defaultPath: "daily-brief-yedek.json", filters: [{ name: "JSON", extensions: ["json"] }] });
        if (r.canceled || !r.filePath) return { cancelled: true };
        file = r.filePath;
      }
      fs.writeFileSync(file, text);
      return { file, tasks: data.tasks.length, events: local().events.length };
    });
    handle("data:import", async () => {
      const file = TEST ? testRead("import.txt") : await pickFile("Yedekten içe aktar", [{ name: "JSON", extensions: ["json"] }]);
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > 5 * 1024 * 1024) throw new Error("Yedek dosyası 5 MB'tan büyük olamaz.");
      const r = C.importData(fs.readFileSync(file, "utf8"), data);
      data.tasks = data.tasks.concat(r.tasks).slice(0, C.MAX_TASKS);
      local().events = local().events.concat(r.events).slice(0, 1000);
      changed();
      return { tasks: r.tasks.length, events: r.events.length, skipped: r.skipped };
    });
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:plan", async () => {
      const p = C.planPayload(data, now());
      const ok = await approve("MyMind'a gönderilsin mi? (günü kısa plana dönüştür)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• " + p.sent.date + ", şu an " + p.sent.now + ", çalışma saatleri " + p.sent.work +
        "\n• Etkinlikler (saat + başlık):\n" + (p.sent.events.map((x) => "   " + x).join("\n") || "   yok") +
        "\n• Görevler (başlık, süre, öncelik):\n" + (p.sent.tasks.map((x) => "   " + x).join("\n") || "   yok") +
        "\n• Boş aralıklar: " + (p.sent.slots.join(", ") || "yok") +
        "\n\nHassas başlıklar “Özel …” olarak gider. Yer, takvim adı/adresi ve notlar gönderilmez. Plan yalnız öneridir; takvim değiştirilmez.", "Gönder");
      if (!ok) return { approved: false };
      return { approved: true, ...C.validatePlan(await askMymind(p.messages, 600)) };
    });

    createWindow();
    if (data.settings.widgetOnStart) win.once("ready-to-show", () => showWidget(true));
    app.on("activate", () => { if (!win) createWindow(); });
    // Saat: özet her yarım dakikada yenilenir (sonraki etkinlik, gün dönümü); abonelikler süresi gelince okunur; sabah bildirimi.
    setInterval(() => { morningCheck(); refreshDue(); push(); }, TEST ? 1000 : 30000);
    setTimeout(() => { morningCheck(); refreshDue(); }, TEST ? 300 : 3000);
  });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi pencerelerimizden (ana pencere, widget) gelen çağrıları kabul eder.
function assertOwn(e) {
  const ok = (win && !win.isDestroyed() && e.sender === win.webContents) || (widget && !widget.isDestroyed() && e.sender === widget.webContents);
  if (!ok) throw new Error("Yetkisiz istek.");
}
