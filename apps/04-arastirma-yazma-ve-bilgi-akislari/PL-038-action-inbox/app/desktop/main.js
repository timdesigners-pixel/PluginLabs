/* Action Inbox — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Kullanıcının seçip yakaladığı metin (yapıştırma, pano — düğme ya da genel kısayol —, .txt/.md dosyası) görev adaylarına ayrılır ve
 * inceleme kuyruğuna girer; hiçbir aday kullanıcı onaylamadan görev olmaz, kişi ataması onaylanmadıkça taslaktır. Otomatik kaynak
 * izleme yoktur: sayfa, posta kutusu ya da sohbet uygulamasına bağlanılmaz; pano yalnız kullanıcı istediğinde okunur.
 * Kaynak adresi yalnız kullanıcı tıklayınca varsayılan tarayıcıda açılır (yalnız http/https).
 * İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, tek aday, veri azaltılmış. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell, globalShortcut, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.AX_USER_DATA) app.setPath("userData", process.env.AX_USER_DATA);
const TEST = process.env.AX_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20;
const SHORTCUT = "CommandOrControl+Alt+I";

let win = null;
let widget = null;
let memoryKey = null;
let shortcutOk = false;
let data = { settings: C.normalizeSettings({}), items: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "gorevler.bin" : "gorevler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
/** Test ortamında sabit "şimdi" (örnek verinin tarihleri tutarlı kalsın diye); gerçek kullanımda sistem saati. */
const now = () => (TEST && process.env.AX_NOW ? new Date(process.env.AX_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — yakalanan metinler kişiseldir) ----
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
    data.items = C.normalizeItems(d.items);
    data.active = data.items.some((x) => x.id === d.active) ? d.active : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Durum ----
function view() {
  const nowIso = now().toISOString();
  const it = data.items.find((x) => x.id === data.active) || null;
  const gold = data.items.some((x) => x.sampleKey) ? C.evaluateGold(data.items, SAMPLE.gold) : null;
  return {
    settings: data.settings, items: data.items, active: it ? it.id : null, metrics: C.metrics(data.items, nowIso), gold, counters: data.counters, now: nowIso,
    vault: vault(), hasKey: !!readKey(), platform: process.platform, shortcut: { accel: SHORTCUT, ok: shortcutOk }, widgetOpen: !!(widget && !widget.isDestroyed()),
  };
}
const push = () => { const v = view(); for (const w of [win, widget]) if (w && !w.isDestroyed()) w.webContents.send("state:changed", v); };
function changed() { save(); push(); return view(); }
function getItem(id) { const x = data.items.find((i) => i.id === id); if (!x) throw new Error("Kayıt bulunamadı."); return x; }

// ---- Pencereler ----
const webPreferences = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false });
function harden(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Action Inbox", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  harden(win);
  win.on("closed", () => { win = null; if (widget && !widget.isDestroyed()) widget.close(); });
}
function openWidget() {
  if (widget && !widget.isDestroyed()) { widget.show(); widget.focus(); return; }
  widget = new BrowserWindow({
    width: 360, height: 480, minWidth: 300, minHeight: 320, useContentSize: true, autoHideMenuBar: true, alwaysOnTop: data.settings.widgetOnTop, maximizable: false, fullscreenable: false,
    title: "Action Inbox — görev kutusu", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPreferences(),
  });
  widget.once("ready-to-show", () => widget.showInactive());
  widget.loadFile(path.join(root, "widget.html"));
  harden(widget);
  widget.on("closed", () => { widget = null; push(); });
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickFiles() {
  if (TEST) { const t = testRead("pick.txt"); return t ? t.split("\n").filter(Boolean) : []; }
  const r = await dialog.showOpenDialog(win, { title: "Metin dosyalarını seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Metin", extensions: ["txt", "md", "markdown"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- Yakalama (yalnız kullanıcının seçtiği metin; hiçbir aday kendiliğinden görev olmaz) ----
function addCapture(text, source, extra) {
  const t = C.str(text, C.MAX_CAPTURE).trim();
  if (!t) throw new Error("Yakalanacak metin boş.");
  if (data.items.length >= C.MAX_ITEMS) throw new Error("Kayıt sınırına (" + C.MAX_ITEMS + ") ulaşıldı. Tamamlanan görevleri dışa aktarıp yedekten yeni başlangıç yapın.");
  const out = C.capture(t, source, data.items, (extra && extra.at) || now());
  out.forEach((x, i) => { if (extra && extra.key) x.sampleKey = extra.key + "-" + i; });
  data.items = data.items.concat(out).slice(0, C.MAX_ITEMS);
  data.counters.captures++;
  data.counters.candidates += out.length;
  if (out[0]) data.active = out[0].id;
  return { added: out.length, dups: out.filter((x) => x.dup).length, firstId: out[0] ? out[0].id : null };
}
function sourceFrom(input, fallbackType) {
  const s = input || {};
  const url = C.str(s.url, 1000).trim();
  if (url && !C.isWebUrl(url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
  return { type: C.SOURCE_TYPES.includes(s.type) ? s.type : fallbackType || data.settings.defaultType, url, title: C.str(s.title, 200).trim() };
}
function captureClipboard(via) {
  const text = clipboard.readText();
  if (!text || !text.trim()) throw new Error("Panoda metin yok. Kaynakta yapılacak metni seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
  const r = addCapture(text, { type: "pano", title: via === "kisayol" ? "Genel kısayolla yakalandı" : "Panodan yakalandı" });
  data.counters.clipboard++;
  if (via === "kisayol") data.counters.shortcut++;
  return r;
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

// ---- MyMind istemci anahtarı: kasada şifreli ----
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
const hubUrl = () => (TEST && process.env.AX_HUB_URL) || net.HUB_URL;
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
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
    throw new Error(msg);
  }
}

// ---- Genel kısayol: panodaki seçili metni inceleme kuyruğuna ekler (yalnız tuşa basıldığında okunur) ----
function applyShortcut() {
  try { globalShortcut.unregister(SHORTCUT); } catch { /* yok */ }
  shortcutOk = false;
  if (!data.settings.shortcut || process.env.AX_NO_SHORTCUT) return;
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => {
      try {
        const r = captureClipboard("kisayol");
        changed();
        if (Notification.isSupported()) new Notification({ title: "Action Inbox", body: r.added + " görev adayı inceleme kuyruğuna eklendi" + (r.dups ? " (" + r.dups + " olası yineleme)" : "") + ".", silent: true }).show();
      } catch (err) {
        if (Notification.isSupported()) new Notification({ title: "Action Inbox", body: String(err && err.message ? err.message : err), silent: true }).show();
      }
    });
  } catch { shortcutOk = false; }
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.action-inbox");
    load();
    applyShortcut();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      const before = data.settings;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if (before.shortcut !== data.settings.shortcut) applyShortcut();
      if (widget && !widget.isDestroyed() && before.widgetOnTop !== data.settings.widgetOnTop) widget.setAlwaysOnTop(data.settings.widgetOnTop);
      return changed();
    });

    // Yakalama
    handle("capture:text", (text, source) => { const r = addCapture(text, sourceFrom(source)); return { ...r, state: changed() }; });
    handle("capture:clipboard", () => { const r = captureClipboard("dugme"); return { ...r, state: changed() }; });
    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0, dups = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(txt|md|markdown)$/i.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
        if (!text.trim()) { skipped++; continue; }
        const r = addCapture(text, { type: "dosya", title: path.basename(f) });
        added += r.added; dups += r.dups;
        data.counters.files++;
      }
      return { files: files.length, added, dups, skipped, state: changed() };
    });
    handle("capture:sample", () => {
      let added = 0, dups = 0;
      for (const c of SAMPLE.captures) { const r = addCapture(c.text, c.source, { key: c.key, at: new Date(SAMPLE.BASE) }); added += r.added; dups += r.dups; }
      const first = data.items.find((x) => x.status === "inceleme");
      if (first) data.active = first.id;
      return { added, dups, state: changed() };
    });

    // İnceleme ve görevler (yalnız yerel kayıt)
    handle("item:open", (id) => { if (id) getItem(id); data.active = id || null; return changed(); });
    handle("item:update", (id, patch) => {
      const x = getItem(id);
      const st = x.status;
      C.accept(x, patch || {}, Date.now());
      x.status = st; // düzenleme durumu değiştirmez
      if (st === "inceleme") x.acceptedAt = 0;
      if (st === "inceleme") x.dup = C.findDuplicate(x, data.items, now().toISOString());
      return changed();
    });
    handle("item:accept", (id, patch) => {
      const x = getItem(id);
      if (x.status !== "inceleme") throw new Error("Bu kayıt incelemede değil.");
      if (x.dup && !(patch && patch.ignoreDup)) {
        const target = data.items.find((i) => i.id === x.dup.id);
        if (target && target.status !== "red" && target.status !== "birlesti") throw new Error("Bu aday “" + target.title + "” ile aynı iş olabilir. Birleştirin ya da “Yine de ayrı görev” seçin.");
      }
      C.accept(x, patch || {}, now().getTime());
      const next = data.items.find((i) => i.status === "inceleme");
      data.active = next ? next.id : x.id;
      return changed();
    });
    handle("item:acceptMany", (ids) => {
      let n = 0, held = 0;
      for (const id of Array.isArray(ids) ? ids : []) {
        const x = getItem(id);
        if (x.status !== "inceleme") continue;
        if (x.dup) { held++; continue; } // olası yineleme toplu kabulde bekletilir
        C.accept(x, {}, now().getTime()); n++;
      }
      const st = changed();
      return { accepted: n, held, state: st };
    });
    handle("item:reject", (id) => { const x = getItem(id); if (x.status !== "inceleme") throw new Error("Yalnız incelemedeki aday reddedilebilir."); x.status = "red"; x.rejectedAt = Date.now(); const next = data.items.find((i) => i.status === "inceleme"); data.active = next ? next.id : null; return changed(); });
    handle("item:toReview", (id) => {
      const x = getItem(id);
      if (x.status !== "red") throw new Error("Yalnız reddedilen aday incelemeye geri alınabilir.");
      x.status = "inceleme"; x.rejectedAt = 0; x.dup = C.findDuplicate(x, data.items, now().toISOString());
      return changed();
    });
    handle("item:merge", (fromId, intoId) => {
      const from = getItem(fromId), into = getItem(intoId);
      C.merge(from, into);
      data.counters.merges++;
      data.active = into.id;
      return changed();
    });
    handle("item:done", (id, on) => {
      const x = getItem(id);
      if (on !== false) { if (x.status !== "acik") throw new Error("Yalnız açık görev tamamlanabilir."); x.status = "tamam"; x.doneAt = now().getTime(); }
      else { if (x.status !== "tamam") throw new Error("Görev tamamlanmış değil."); x.status = "acik"; x.doneAt = 0; }
      return changed();
    });
    handle("source:open", async (id, index) => {
      const x = getItem(id);
      const s = x.sources[Number(index) || 0];
      if (!s || !C.isWebUrl(s.url)) throw new Error("Bu kaynağın web adresi yok.");
      data.counters.opened++; save();
      if (TEST) { testLog("opened.txt", s.url); return { opened: s.url }; }
      await shell.openExternal(s.url);
      return { opened: s.url };
    });

    // Dışa aktarma
    const live = () => data.items.filter((x) => x.status === "acik" || x.status === "tamam");
    handle("export:md", async () => {
      const file = await pickSave("gorev-kuyrugu.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMd(data.items, now().toISOString()), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: data.items.filter((x) => x.status === "acik").length };
    });
    handle("export:csv", async () => {
      const file = await pickSave("action-inbox.csv", "csv");
      if (!file) return { cancelled: true };
      const list = data.items.filter((x) => x.status !== "birlesti");
      fs.writeFileSync(file, C.exportCsv(list), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: list.length };
    });
    handle("export:ics", async () => {
      const file = await pickSave("gorevler.ics", "ics");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportIcs(live(), now().toISOString()), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: live().length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("action-inbox-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "action-inbox", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, items: data.items }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Widget
    handle("widget:open", () => { openWidget(); push(); return { ok: true }; });
    handle("widget:close", () => { if (widget && !widget.isDestroyed()) widget.close(); return { ok: true }; });
    handle("app:focus", (id) => {
      if (id) { getItem(id); data.active = id; save(); }
      if (!win) createWindow(); else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
      push();
      return { ok: true };
    });

    // Yapay zekâ (tek aday; her istek ayrı onaylı)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:extract", async (id) => {
      const x = getItem(id);
      const p = C.aiPayload(x);
      const prov = providerInfo();
      const by = p.sent.byType.map((t) => t.count + " " + t.label).join(", ");
      const ok = await approve("Bu görev adayı MyMind ile çıkarılsın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Yalnız bu adayın cümlesi ve kısa bağlamı (" + p.sent.chars + " karakter" + (p.sent.truncated ? ", bağlamın ilk " + C.AI_CONTEXT + " karakteri" : "") + ")\n• Kaynak türü ve yakalama tarihi; kaynak adresi ve başlığı gönderilmez" +
        (p.sent.people ? "\n• " + p.sent.people + " kişi adı [Kişi1]… olarak — adlar gönderilmez" : "") + (by ? "\n• " + by + " ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") +
        "\n\nDiğer görevleriniz gönderilmez. Dönen öneri denetlenir (metinde olmayan kişi ve çözülemeyen tarih atılır; kişi ataması taslak kalır); uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 600), p);
      x.ai = res;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      const st = changed();
      return { approved: true, dropped: res.dropped, state: st };
    });
    handle("ai:apply", (id) => {
      const x = getItem(id);
      if (!x.ai) throw new Error("Önce MyMind önerisi alın.");
      const st = x.status;
      const patch = { title: x.ai.title || x.title, materials: x.ai.materials.length ? x.ai.materials : x.materials };
      if (x.ai.due) patch.due = x.ai.due;
      if (x.ai.assignee && !x.assignee) patch.assignee = x.ai.assignee;
      if (x.ai.verb) patch.verb = x.ai.verb;
      C.accept(x, patch, Date.now());
      x.status = st; if (st === "inceleme") x.acceptedAt = 0;
      if (x.ai.due) { x.dueFrom = "mymind"; x.dueText = x.ai.dueText; }
      if (st === "inceleme") x.dup = C.findDuplicate(x, data.items, now().toISOString());
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  const ok = [win, widget].some((w) => w && !w.isDestroyed() && e.sender === w.webContents);
  if (!ok) throw new Error("Yetkisiz istek.");
}
