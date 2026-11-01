/* Quick Convert — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: dosyayı bırak (ana pencere ya da her zaman üstteki bırakma kutusu) → tür içerikten tanınır → ayar seç ya da ihtiyacını yaz →
 * sonuç YENİ dosyaya yazılır; kaynak dosya hiçbir zaman yazmak için açılmaz, var olan dosyanın üzerine yazılmaz.
 * Görüntü: arayüzdeki Chromium kod çözücü/kodlayıcı (Skia) dönüştürür; çıktı burada içerik ve ölçü olarak yeniden doğrulanır.
 * Metin: src/core.js tablolarıyla burada dönüştürülür ve geri çözülerek doğrulanır.
 * Geçmiş (dosya yolları) cihazda, kasa (DPAPI) varsa şifreli. Ağ yalnız desktop/net.js içinde, onaylı MyMind isteği için. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, shell, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const net = require("./net");
const C = require("../src/core.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir.
if (process.env.QC_USER_DATA) app.setPath("userData", process.env.QC_USER_DATA);
const TEST = process.env.QC_TEST_DIR || "";

let win = null;
let drop = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), history: [], dropPos: null };
let items = []; // oturumluk kuyruk: { id, path, name, bytes, kind, type, ... }
let seq = 0;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "donustur.bin" : "donustur.json");
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
    data.history = (Array.isArray(d.history) ? d.history : []).map(C.normalizeHistory).filter(Boolean).slice(-C.LIMITS.history);
    data.dropPos = d.dropPos && Number.isFinite(d.dropPos.x) && Number.isFinite(d.dropPos.y) ? { x: Math.round(d.dropPos.x), y: Math.round(d.dropPos.y) } : null;
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) {
    writeAtomic(dataFile(true), safeStorage.encryptString(json));
    fs.rmSync(dataFile(false), { force: true });
  } else writeAtomic(dataFile(false), json);
}

// ---- Görünüm ----
const pub = (it) => { const { path: _p, ...rest } = it; return { ...rest, dir: path.dirname(it.path) }; };
function view() {
  return {
    settings: data.settings, items: items.map(pub), history: data.history.slice(-200).reverse(), stats: C.historyStats(data.history),
    drop: !!(drop && !drop.isDestroyed() && drop.isVisible()), vault: vault(), hasKey: !!readKey(), platform: process.platform,
  };
}
function send(channel, payload) { for (const w of [win, drop]) if (w && !w.isDestroyed()) w.webContents.send(channel, payload); }
const push = () => send("state:changed", view());
function changed() { save(); push(); return view(); }

// ---- Dosya ekleme ----
function readHead(file, n) {
  const fd = fs.openSync(file, "r");
  try { const b = Buffer.alloc(n); const r = fs.readSync(fd, b, 0, n, 0); return new Uint8Array(b.subarray(0, r)); } finally { fs.closeSync(fd); }
}
function inspect(file) {
  const name = path.basename(file);
  const base = { id: "q" + Date.now().toString(36) + (++seq).toString(36), path: file, name, bytes: 0, kind: "unknown", type: "", label: "", status: "blocked", error: "", warn: "" };
  let st;
  try { st = fs.statSync(file); } catch { return { ...base, error: "Dosya bulunamadı ya da okunamıyor." }; }
  if (st.isDirectory()) return { ...base, error: "Klasör dönüştürülmez; içindeki dosyaları bırakın." };
  if (!st.isFile()) return { ...base, error: "Normal bir dosya değil." };
  base.bytes = st.size;
  let head;
  try { head = readHead(file, 64 * 1024); } catch { return { ...base, error: "Dosya okunamadı (kullanımda ya da izin yok)." }; }
  const s = C.sniff(head, name);
  if (s.kind === "image") {
    const size = C.imageSize(head, s.type) || (st.size <= C.LIMITS.imageBytes ? C.imageSize(fs.readFileSync(file), s.type) : null);
    const limit = C.checkImageLimits(size, st.size);
    return { ...base, kind: "image", type: s.type, label: s.label, width: size ? size.width : 0, height: size ? size.height : 0, warn: [C.extWarning(name, s), s.type === "gif" ? "GIF'in yalnız ilk karesi dönüştürülür." : ""].filter(Boolean).join(" "), status: limit ? "blocked" : "ready", error: limit };
  }
  if (s.kind === "text") {
    if (st.size > C.LIMITS.textBytes) return { ...base, kind: "text", type: "text", label: "Metin", error: "Metin dosyası " + C.fmtBytes(C.LIMITS.textBytes) + " sınırını aşıyor." };
    const all = new Uint8Array(fs.readFileSync(file));
    const det = C.detectEncoding(all);
    let eol = "none", chars = 0;
    try { const t = C.decodeText(all, det.encoding); eol = C.eolOf(t).kind; chars = t.length; } catch { /* algılama yine de gösterilir */ }
    return { ...base, kind: "text", type: "text", label: "Metin", encoding: det.encoding, encodingReason: det.reason, eol, chars, status: "ready" };
  }
  return { ...base, kind: s.kind, error: (s.reason || "Desteklenmiyor.") + (s.kind === "unknown" ? " " + C.UNSUPPORTED_HINT : "") };
}
function addPaths(list) {
  const paths = (Array.isArray(list) ? list : []).filter((p) => typeof p === "string" && p && path.isAbsolute(p));
  const room = C.LIMITS.batch - items.length;
  if (room <= 0) throw new Error("Kuyrukta en fazla " + C.LIMITS.batch + " dosya olabilir; önce tamamlananları temizleyin.");
  const added = [];
  for (const p of paths.slice(0, room)) {
    if (items.some((x) => x.path === p && x.status === "ready")) continue;
    const it = inspect(p);
    items.push(it);
    added.push(it);
  }
  push();
  return { added: added.map(pub), skipped: Math.max(0, paths.length - room) };
}
const item = (id) => { const it = items.find((x) => x.id === id); if (!it) throw new Error("Dosya kuyrukta bulunamadı."); return it; };

// ---- Çıktı ----
function outDir(it) {
  const d = data.settings.output === "folder" && data.settings.outputDir ? data.settings.outputDir : path.dirname(it.path);
  try { if (!fs.statSync(d).isDirectory()) throw new Error(); } catch { throw new Error("Çıktı klasörü bulunamadı: " + d); }
  return d;
}
/** Yeni dosyaya yazar; var olan dosyanın üzerine asla yazmaz ('wx'). Kaynakla aynı yol olamaz. */
function writeNew(it, ext, buf) {
  const dir = outDir(it);
  for (let i = 0; i < 5; i++) {
    const name = C.outputName(it.name, ext, (n) => fs.existsSync(path.join(dir, n)));
    const file = path.join(dir, name);
    if (path.resolve(file) === path.resolve(it.path)) throw new Error("Çıktı kaynakla aynı olamaz.");
    try { fs.writeFileSync(file, buf, { flag: "wx" }); return { file, name }; } catch (e) {
      if (e && e.code === "EEXIST") continue;
      fs.rmSync(file, { force: true });
      throw new Error(e && (e.code === "EACCES" || e.code === "EPERM") ? "Çıktı klasörüne yazma izni yok: " + dir : "Çıktı yazılamadı: " + (e.message || e));
    }
  }
  throw new Error("Çıktı adı ayrılamadı.");
}
function record(it, h) {
  const entry = C.normalizeHistory({ id: crypto.randomUUID(), at: Date.now(), src: it.path, srcName: it.name, srcBytes: it.bytes, ...h });
  data.history.push(entry);
  if (data.history.length > C.LIMITS.history) data.history = data.history.slice(-C.LIMITS.history);
  return entry;
}
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

function chooseDir() {
  if (TEST) return Promise.resolve(testRead("outdir.txt") || null);
  return dialog.showOpenDialog(win, { title: "Çıktı klasörünü seçin", properties: ["openDirectory", "createDirectory"] }).then((r) => (r.canceled || !r.filePaths.length ? null : r.filePaths[0]));
}

// ---- Pencereler ----
const WEB = (v) => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, additionalArguments: ["--qc-view=" + v] });
function lockDown(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1180, height: 760, minWidth: 940, minHeight: 620, useContentSize: true, autoHideMenuBar: true,
    title: "Quick Convert", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: WEB("main"),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  lockDown(win);
  win.on("closed", () => { win = null; if (drop && !drop.isDestroyed()) drop.destroy(); drop = null; });
}
const DW = 220, DH = 236;
function dropBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const p = data.dropPos;
  if (p && screen.getAllDisplays().some((d) => p.x >= d.workArea.x - DW / 2 && p.x <= d.workArea.x + d.workArea.width - DW / 2 && p.y >= d.workArea.y && p.y <= d.workArea.y + d.workArea.height - 40)) return { x: p.x, y: p.y, width: DW, height: DH };
  return { x: wa.x + wa.width - DW - 24, y: wa.y + wa.height - DH - 24, width: DW, height: DH };
}
function showDrop(show) {
  if (!show) { if (drop && !drop.isDestroyed()) drop.hide(); push(); return false; }
  if (!drop || drop.isDestroyed()) {
    drop = new BrowserWindow({
      ...dropBounds(), frame: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true,
      alwaysOnTop: true, title: "Quick Convert — bırakma kutusu", backgroundColor: "#121828", show: false, hasShadow: true, webPreferences: WEB("drop"),
    });
    drop.setAlwaysOnTop(true, "floating");
    drop.setVisibleOnAllWorkspaces(true);
    drop.loadFile(path.join(root, "drop.html"));
    lockDown(drop);
    drop.once("ready-to-show", () => { drop.showInactive(); push(); });
    let t = null;
    drop.on("moved", () => { clearTimeout(t); t = setTimeout(() => { if (drop && !drop.isDestroyed()) { const b = drop.getBounds(); data.dropPos = { x: b.x, y: b.y }; save(); } }, 400); });
    drop.on("closed", () => { drop = null; push(); });
  } else if (!drop.isVisible()) drop.showInactive();
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
const hubUrl = () => (TEST && process.env.QC_HUB_URL) || net.HUB_URL;
async function askMymind(messages, maxTokens) {
  const key = readKey();
  if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) testLog("mymind-sent.json", JSON.stringify(messages));
  try { return await net.mymindChat(hubUrl(), key, messages, maxTokens); } catch (err) {
    const m = err && err.message ? err.message : String(err);
    throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
  }
}

function handle(name, fn, owners) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e, owners); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", (_e, argv) => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show(); win.focus();
    // "Birlikte aç" ile gelen dosyalar kuyruğa eklenir (dönüştürme kullanıcı onayıyla başlar).
    const files = argv.slice(1).filter((a) => !a.startsWith("-") && path.isAbsolute(a) && fs.existsSync(a) && a !== process.execPath);
    if (files.length) addPaths(files);
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.quick-convert");
    load();
    handle("state:get", () => view(), "any");
    handle("settings:set", (patch) => {
      const p = patch && typeof patch === "object" ? patch : {};
      const next = { ...data.settings, ...p, image: { ...data.settings.image, ...(p.image || {}) }, text: { ...data.settings.text, ...(p.text || {}) } };
      data.settings = C.normalizeSettings(next);
      return changed();
    });
    handle("output:choose", async () => {
      const d = await chooseDir();
      if (!d) return { cancelled: true };
      if (!fs.statSync(d).isDirectory()) throw new Error("Klasör seçin.");
      data.settings = C.normalizeSettings({ ...data.settings, output: "folder", outputDir: d });
      changed();
      return { dir: d };
    });
    handle("files:pick", async () => {
      let paths;
      if (TEST) paths = testRead("pick.txt").split("\n").filter(Boolean);
      else {
        const r = await dialog.showOpenDialog(win, { title: "Dönüştürülecek dosyaları seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Desteklenenler", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", ...C.TEXT_EXT] }, { name: "Tüm dosyalar", extensions: ["*"] }] });
        if (r.canceled) return { cancelled: true };
        paths = r.filePaths;
      }
      return addPaths(paths);
    });
    handle("files:add", (paths) => addPaths(paths));
    handle("drop:add", (paths) => {
      const r = addPaths(paths);
      const ids = r.added.filter((x) => x.status === "ready").map((x) => x.id);
      if (win && !win.isDestroyed() && data.settings.dropAutorun && ids.length) win.webContents.send("queue:autorun", ids);
      return { ...r, autorun: data.settings.dropAutorun };
    }, "any");
    handle("queue:remove", (id) => { items = items.filter((x) => x.id !== id); push(); return view(); });
    handle("queue:clear", (which) => { items = which === "all" ? [] : items.filter((x) => x.status === "ready"); push(); return view(); });
    handle("item:read", (id) => {
      const it = item(id);
      if (it.kind !== "image" || it.status === "blocked") throw new Error("Bu dosya görüntü olarak dönüştürülemez.");
      const st = fs.statSync(it.path);
      if (st.size !== it.bytes) throw new Error("Dosya eklendikten sonra değişti; kuyruktan kaldırıp yeniden ekleyin.");
      const buf = fs.readFileSync(it.path);
      it.srcHash = sha(buf);
      return { bytes: new Uint8Array(buf), mime: C.IMAGE_IN[it.type], type: it.type, width: it.width, height: it.height };
    });
    handle("item:writeImage", (id, bytes, meta) => {
      const it = item(id);
      if (it.kind !== "image") throw new Error("Görüntü değil.");
      const m = meta && typeof meta === "object" ? meta : {};
      const fmt = C.IMAGE_OUT[m.format] ? m.format : null;
      if (!fmt) throw new Error("Bilinmeyen çıktı biçimi.");
      const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []));
      if (!buf.length || buf.length > C.LIMITS.imageBytes) throw new Error("Çıktı boş ya da çok büyük.");
      // Arayüzden gelen baytlara güvenilmez: içerik biçimi ve ölçüleri doğrulanır.
      if (!C.verifyOutput(buf, fmt)) throw new Error("Çıktı " + C.IMAGE_OUT[fmt].label + " değil; bu biçim bu sistemde kodlanamadı.");
      const size = C.imageSize(buf, fmt);
      if (!size || size.width !== m.width || size.height !== m.height) throw new Error("Çıktı ölçüleri beklenenle uyuşmuyor; dosya yazılmadı.");
      const w = writeNew(it, C.IMAGE_OUT[fmt].ext, buf);
      const after = sha(fs.readFileSync(it.path));
      if (it.srcHash && after !== it.srcHash) throw new Error("Kaynak dosya dönüştürme sırasında değişti.");
      const h = record(it, { kind: "image", out: w.file, outName: w.name, from: C.TYPE_LABEL[it.type], to: C.IMAGE_OUT[fmt].label, outBytes: buf.length, srcSize: it.width + "×" + it.height, outSize: size.width + "×" + size.height, quality: C.str(m.quality, 60), note: C.str(m.note, 200) });
      Object.assign(it, { status: "done", error: "", result: { outName: w.name, outBytes: buf.length, outSize: h.outSize, to: h.to, quality: h.quality, note: h.note, historyId: h.id } });
      changed();
      return { outName: w.name, outBytes: buf.length, historyId: h.id };
    });
    handle("item:convertText", (id, opts) => {
      const it = item(id);
      if (it.kind !== "text" || it.status === "blocked") throw new Error("Bu dosya metin olarak dönüştürülemez.");
      const buf = fs.readFileSync(it.path);
      if (buf.length !== it.bytes) throw new Error("Dosya eklendikten sonra değişti; kuyruktan kaldırıp yeniden ekleyin.");
      const before = sha(buf);
      let r;
      try { r = C.convertTextBytes(new Uint8Array(buf), opts || data.settings.text); } catch (e) { it.status = "error"; it.error = e.message; push(); throw e; }
      const w = writeNew(it, C.textExt(it.name), Buffer.from(r.bytes));
      if (sha(fs.readFileSync(it.path)) !== before) throw new Error("Kaynak dosya dönüştürme sırasında değişti.");
      const note = (r.identical ? "Kodlama zaten aynıydı; birebir kopya. " : "") + (r.lost ? r.lost + " karakter “?” ile değiştirildi." : "Geri okunarak doğrulandı (kayıpsız).");
      const h = record(it, { kind: "text", out: w.file, outName: w.name, from: C.ENCODINGS[r.from].label.split(" (")[0], to: C.ENCODINGS[r.to].label.split(" (")[0], outBytes: r.bytes.length, srcSize: r.lines + " satır", outSize: C.EOL_LABEL[r.eolTo] || r.eolTo, quality: r.lost ? r.lost + " karakter kaybı" : "kayıpsız", note });
      Object.assign(it, { status: "done", error: "", result: { outName: w.name, outBytes: r.bytes.length, to: h.to, outSize: h.outSize, quality: h.quality, note, historyId: h.id, preview: r.preview } });
      changed();
      return { outName: w.name, outBytes: r.bytes.length, lost: r.lost, from: r.from, to: r.to, historyId: h.id };
    });
    handle("item:fail", (id, message) => { const it = item(id); it.status = "error"; it.error = C.str(message, 300) || "Dönüştürülemedi."; push(); return true; });
    handle("item:reveal", (historyId) => {
      const h = data.history.find((x) => x.id === historyId);
      if (!h) throw new Error("Kayıt bulunamadı.");
      if (!fs.existsSync(h.out)) throw new Error("Çıktı dosyası artık yerinde değil.");
      if (TEST) testLog("reveal.txt", h.out); else shell.showItemInFolder(h.out);
      return true;
    });
    handle("drop:show", (show) => showDrop(show !== false), "any");
    handle("main:show", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } return true; }, "any");
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:suggest", async (need, id) => {
      const n = C.str(need, 240);
      if (n.length < 3) throw new Error("Önce ne istediğinizi bir cümleyle yazın.");
      const it = id ? item(id) : items.find((x) => x.status !== "blocked");
      const info = it ? { kind: it.kind, type: it.type, width: it.width, height: it.height, bytes: it.bytes, encoding: it.encoding, eol: it.eol } : { kind: "image" };
      const p = C.aiPayload(n, info);
      const lines = Object.entries(p.sent).map(([k, v]) => "• " + ({ need: "İhtiyaç", kind: "Tür", type: "Biçim", size: "Ölçü", bytes: "Boyut", encoding: "Kodlama", eol: "Satır sonu" }[k] || k) + ": " + v);
      const ok = await approve("MyMind'a gönderilsin mi? (dönüştürme ayarı önerisi)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n" + lines.join("\n") +
        "\n\nDosyanın adı, konumu ve içeriği gönderilmez. Dönüştürmeyi MyMind yapmaz; öneri siz uygulamadıkça ayarlara yazılmaz.", "Gönder");
      if (!ok) return { approved: false };
      return { approved: true, kind: info.kind, ...C.validateAi(await askMymind(p.messages, 300), info.kind) };
    });

    createWindow();
    const initial = process.argv.slice(app.isPackaged ? 1 : 2).filter((a) => !a.startsWith("-") && path.isAbsolute(a) && fs.existsSync(a) && fs.statSync(a).isFile());
    if (initial.length) win.webContents.once("did-finish-load", () => addPaths(initial));
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi pencerelerimizden gelir. Bırakma kutusu yalnız "any" işaretli kanalları çağırabilir (dosya okuma/yazma çağıramaz).
function assertOwn(e, owners) {
  const fromMain = win && e.sender === win.webContents;
  const fromDrop = drop && !drop.isDestroyed() && e.sender === drop.webContents;
  if (fromMain || (fromDrop && owners === "any")) return;
  throw new Error("Yetkisiz istek.");
}
