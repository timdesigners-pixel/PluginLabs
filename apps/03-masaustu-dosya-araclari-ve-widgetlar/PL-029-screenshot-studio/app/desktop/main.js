/* Screenshot Studio — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yakala (bölge / tüm ekran / pencere / dosya / pano) → düzenle (ok, numara, kutu, metin, vurgu, bulanık, MASKE, kırp, çerçeve)
 * → hassas alan adayları cihazda (OCR + kurallar) işaretlenir, insan kabul eder → panoya kopyala ya da YENİ dosyaya kaydet.
 * Her dışa aktarmada çıktı baytları burada yeniden çözülür ve her maske dikdörtgeninin her pikseli maske rengine eşit mi diye denetlenir;
 * eşit değilse dosya yazılmaz, panoya konmaz. Yakalanan görüntüler diske yazılmaz (yalnız kullanıcı kaydederse).
 * Ağ yalnız desktop/net.js içinde, onaylı MyMind isteği için. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, nativeImage, dialog, clipboard, globalShortcut, safeStorage, screen, desktopCapturer, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const net = require("./net");
const C = require("../src/studio.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar, dosya seçimleri ve "ekran" dosyadan gelir.
if (process.env.SS_USER_DATA) app.setPath("userData", process.env.SS_USER_DATA);
const TEST = process.env.SS_TEST_DIR || "";
const IS_WIN = process.platform === "win32";

let win = null;
let overlay = null;
let overlayJob = null;
let memoryKey = null;
let capturing = false;
let shortcutOk = null;
let data = { settings: C.normalizeSettings({}), history: [] };
// Oturumluk yakalama (diske yazılmaz): { id, image: nativeImage, source, at, lines?: OCR satırları }
let current = null;
let ocrMod = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "studyo.bin" : "studyo.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli). Yalnız ayarlar ve dışa aktarma geçmişi (dosya yolu, ölçü, süre) saklanır. ----
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
function picturesDir() {
  const d = path.join(app.getPath("pictures"), "Screenshot Studio");
  return d;
}
function outDir() {
  const d = data.settings.output === "folder" && data.settings.outputDir ? data.settings.outputDir : picturesDir();
  if (d === picturesDir()) fs.mkdirSync(d, { recursive: true });
  try { if (!fs.statSync(d).isDirectory()) throw new Error(); } catch { throw new Error("Kayıt klasörü bulunamadı: " + d); }
  return d;
}
function view() {
  return {
    settings: data.settings, history: data.history.slice(-200).reverse(), stats: C.historyStats(data.history),
    vault: vault(), hasKey: !!readKey(), platform: process.platform, shortcutOk, capturing,
    outDir: data.settings.output === "folder" && data.settings.outputDir ? data.settings.outputDir : picturesDir(),
    current: current ? { id: current.id, source: current.source, at: current.at, width: current.image.getSize().width, height: current.image.getSize().height, scanned: !!current.lines } : null,
    ocr: ocrAvailable(),
  };
}
function send(channel, payload) { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); }
const push = () => send("state:changed", view());
function changed() { save(); push(); return view(); }

// ---- OCR (hassas alan adayları) ----
function ocr() { if (!ocrMod) ocrMod = require("./ocr"); return ocrMod; }
function ocrAvailable() { try { return ocr().available(); } catch { return false; } }

// ---- Yakalama ----
function showWindow() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
/** İmlecin bulunduğu ekranın tam çözünürlüklü görüntüsü (yalnız bu an, yalnız bu ekran). */
async function grabDisplay(display) {
  const b = display.bounds, sf = display.scaleFactor || 1;
  const size = { width: Math.round(b.width * sf), height: Math.round(b.height * sf) };
  if (TEST && fs.existsSync(path.join(TEST, "screen.png"))) {
    // Duman testinde "ekran" bilinen bir görüntüdür (belirleyici sonuç için); seçim katmanı, kırpma, OCR ve maske denetimi gerçek kodla çalışır.
    return nativeImage.createFromPath(path.join(TEST, "screen.png")).resize(size);
  }
  const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: size });
  const all = screen.getAllDisplays();
  const src = sources.find((s) => s.display_id && s.display_id === String(display.id)) || (sources.length === 1 ? sources[0] : sources[all.findIndex((d) => d.id === display.id)]);
  if (!src || src.thumbnail.isEmpty()) throw new Error("Ekran görüntüsü alınamadı.");
  return src.thumbnail;
}
function selectRegion(display, shot) {
  return new Promise((resolve) => {
    const b = display.bounds;
    overlayJob = { display, shot, resolve };
    overlay = new BrowserWindow({
      x: b.x, y: b.y, width: b.width, height: b.height, frame: false, resizable: false, movable: false, minimizable: false, maximizable: false,
      fullscreenable: false, skipTaskbar: true, alwaysOnTop: true, show: false, hasShadow: false, enableLargerThanScreen: true, backgroundColor: "#000000",
      title: "Screenshot Studio — bölge seç",
      webPreferences: { preload: path.join(__dirname, "overlay-preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
    });
    overlay.setAlwaysOnTop(true, "screen-saver");
    overlay.setBounds(b);
    lockDown(overlay);
    overlay.loadFile(path.join(root, "overlay.html"));
    overlay.once("ready-to-show", () => { if (overlay) { overlay.show(); overlay.focus(); } });
    if (!TEST) overlay.on("blur", () => finishOverlay(null)); // başka yere tıklanırsa vazgeçilir
    overlay.on("closed", () => { overlay = null; finishOverlay(null); });
  });
}
function finishOverlay(rect) {
  const job = overlayJob;
  overlayJob = null;
  if (overlay && !overlay.isDestroyed()) overlay.destroy();
  overlay = null;
  if (job) job.resolve(rect);
}
function setCurrent(image, source) {
  if (!image || image.isEmpty()) throw new Error("Görüntü boş.");
  const { width, height } = image.getSize();
  if (width > C.LIMITS.side || height > C.LIMITS.side || width * height > C.LIMITS.pixels) throw new Error("Görüntü çok büyük (" + width + "×" + height + ").");
  current = { id: "k" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"), image, source, at: Date.now(), lines: null };
  send("capture:new", { id: current.id, source, width, height });
  push();
  return { id: current.id, width, height };
}
async function capture(mode, windowId) {
  if (capturing || overlayJob) return { busy: true };
  capturing = true;
  push();
  const wasVisible = !!(win && win.isVisible() && !win.isMinimized());
  try {
    if (wasVisible && data.settings.hideOnCapture && mode !== "window") { win.hide(); await delay(IS_WIN ? 260 : 140); } // kendi penceremiz görüntüye girmesin
    if (mode === "window") {
      const img = await grabWindow(windowId);
      showWindow();
      return setCurrent(img, "pencere");
    }
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const shot = await grabDisplay(display);
    if (mode === "screen") { showWindow(); return setCurrent(shot, "tüm ekran"); }
    const sel = await selectRegion(display, shot);
    showWindow();
    if (!sel) return { cancelled: true };
    const r = C.cropRect(sel, display.bounds, shot.getSize());
    if (!r) { notify("Seçilen bölge çok küçük; biraz daha geniş bir alan seçin.", true); return { cancelled: true }; }
    return setCurrent(shot.crop(r), "bölge");
  } catch (e) {
    showWindow();
    notify("Yakalama başarısız: " + (e && e.message ? e.message : String(e)), true);
    return { error: true };
  } finally {
    capturing = false;
    push();
  }
}
let windowSources = [];
async function listWindows() {
  if (TEST && fs.existsSync(path.join(TEST, "screen.png"))) {
    const img = nativeImage.createFromPath(path.join(TEST, "screen.png"));
    windowSources = [{ id: "test:1", name: "Fatura — Tarayıcı (test penceresi)", image: img }];
    return windowSources.map((s) => ({ id: s.id, name: s.name, thumb: s.image.resize({ width: 320 }).toDataURL() }));
  }
  const sources = await desktopCapturer.getSources({ types: ["window"], thumbnailSize: { width: 320, height: 200 }, fetchWindowIcons: false });
  const own = new Set([win, overlay].filter(Boolean).map((w) => w.getMediaSourceId && w.getMediaSourceId()));
  windowSources = sources.filter((s) => !own.has(s.id) && s.name && !s.thumbnail.isEmpty()).slice(0, 40).map((s) => ({ id: s.id, name: s.name }));
  return sources.filter((s) => windowSources.some((w) => w.id === s.id)).map((s) => ({ id: s.id, name: C.str(s.name, 120), thumb: s.thumbnail.toDataURL() }));
}
async function grabWindow(id) {
  const w = windowSources.find((s) => s.id === id);
  if (!w) throw new Error("Pencere listede yok; listeyi yenileyin.");
  if (w.image) return w.image;
  const sf = screen.getPrimaryDisplay().scaleFactor || 1;
  const size = { width: Math.round(3840 * sf), height: Math.round(2160 * sf) };
  const sources = await desktopCapturer.getSources({ types: ["window"], thumbnailSize: size, fetchWindowIcons: false });
  const s = sources.find((x) => x.id === id);
  if (!s || s.thumbnail.isEmpty()) throw new Error("Pencere görüntüsü alınamadı (pencere kapanmış ya da küçültülmüş olabilir).");
  return s.thumbnail;
}
function notify(message, isError) { send("app:notice", { message: String(message), error: !!isError }); }

// ---- Dışa aktarma: doğrula, sonra yaz/kopyala ----
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/**
 * Arayüz çıktıyı HER ZAMAN kayıpsız PNG olarak verir. Burada çözülür ve her maske dikdörtgeninin İÇİNDEKİ HER piksel maske rengine
 * birebir (tolerans 0) eşit mi denetlenir; köşe yuvarlatması hesaba katılır. Geçmezse hiçbir şey yazılmaz/kopyalanmaz.
 * JPEG istenirse JPEG, doğrulanmış bu piksellerden burada üretilir (maskenin altındaki içerik kodlayıcıya hiç ulaşmaz).
 */
function checkExport(bytes, meta) {
  const m = meta && typeof meta === "object" ? meta : {};
  const fmt = C.FORMATS[m.format] ? m.format : null;
  if (!fmt) throw new Error("Bilinmeyen çıktı biçimi.");
  const png = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []));
  if (!png.length || png.length > 300 * 1024 * 1024) throw new Error("Çıktı boş ya da çok büyük.");
  if (!PNG_MAGIC.every((b, i) => png[i] === b)) throw new Error("Çıktı PNG değil.");
  const img = nativeImage.createFromBuffer(png);
  if (img.isEmpty()) throw new Error("Çıktı çözülemedi.");
  const { width, height } = img.getSize();
  if (width !== m.width || height !== m.height) throw new Error("Çıktı ölçüleri beklenenle uyuşmuyor.");
  const masks = (Array.isArray(m.masks) ? m.masks : []).slice(0, C.LIMITS.annotations).map((x) => ({ id: C.str(x.id, 40), x: +x.x, y: +x.y, w: +x.w, h: +x.h, color: x.color })).filter((x) => [x.x, x.y, x.w, x.h].every(Number.isFinite));
  const framed = m.frame === "window" || m.frame === "shadow";
  const L = C.frameLayout(m.innerW | 0, m.innerH | 0, framed ? m.frame : "none");
  if (L.W !== width || L.H !== height) throw new Error("Çerçeve ölçüleri uyuşmuyor.");
  const v = C.verifyMasks(img.toBitmap(), width, height, masks, { tolerance: 0, order: "bgra", layout: framed ? L : null });
  if (TEST) testLog("verify.txt", JSON.stringify({ fmt, width, height, ...v }));
  if (!v.ok) throw new Error("Maske doğrulaması başarısız: " + v.failed.length + " maskede özgün piksel kaldı. Dosya yazılmadı, panoya konmadı.");
  const buf = fmt === "jpeg" ? img.toJPEG(data.settings.jpegQuality) : png;
  return { fmt, buf, img, width, height, verify: v, masks: masks.length };
}
function record(entry) {
  const h = C.normalizeHistory({ id: crypto.randomUUID(), at: Date.now(), ...entry });
  data.history.push(h);
  if (data.history.length > C.LIMITS.history) data.history = data.history.slice(-C.LIMITS.history);
  return h;
}
function writeNew(fmt, buf, base) {
  const dir = outDir();
  for (let i = 0; i < 5; i++) {
    const name = C.outputName(Date.now(), fmt, (n) => fs.existsSync(path.join(dir, n)), base);
    const file = path.join(dir, name);
    try { fs.writeFileSync(file, buf, { flag: "wx" }); return { file, name }; } catch (e) {
      if (e && e.code === "EEXIST") continue;
      throw new Error(e && (e.code === "EACCES" || e.code === "EPERM") ? "Kayıt klasörüne yazma izni yok: " + dir : "Dosya yazılamadı: " + (e.message || e));
    }
  }
  throw new Error("Dosya adı ayrılamadı.");
}
function prepMs() { if (!current) return 0; if (!current.firstExport) current.firstExport = Date.now(); return current.firstExport - current.at; }
function exportEntry(r, m, action) {
  const meta = m || {};
  return { action, format: r.fmt, width: r.width, height: r.height, bytes: r.buf.length, prepMs: prepMs(), masks: r.masks, verified: r.verify.ok, annotations: meta.annotations | 0, frame: meta.frame, source: current ? current.source : "", accepted: meta.accepted | 0, rejected: meta.rejected | 0 };
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
const hubUrl = () => (TEST && process.env.SS_HUB_URL) || net.HUB_URL;
async function askMymind(messages, maxTokens) {
  const key = readKey();
  if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) testLog("mymind-sent.json", JSON.stringify(messages));
  try { return await net.mymindChat(hubUrl(), key, messages, maxTokens); } catch (err) {
    const m = err && err.message ? err.message : String(err);
    throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
  }
}

// ---- Kısayol ----
function registerShortcut() {
  globalShortcut.unregisterAll();
  shortcutOk = null;
  const s = data.settings.shortcut;
  if (s === "off") return;
  try { shortcutOk = globalShortcut.register(s, () => { capture("region"); }); } catch { shortcutOk = false; }
}

// ---- Pencereler ----
const WEB = { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false };
function lockDown(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1000, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Screenshot Studio", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: WEB,
  });
  win.once("ready-to-show", () => { if (!process.argv.includes("--hidden")) win.show(); });
  win.loadFile(path.join(root, "app.html"));
  lockDown(win);
  win.on("closed", () => { win = null; });
}

function handle(name, fn, owner) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e, owner || "main"); return fn(...a); });
}
const need = () => { if (!current) throw new Error("Önce bir ekran görüntüsü alın ya da açın."); return current; };

if (gotLock) {
  app.on("second-instance", () => showWindow());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (IS_WIN) app.setAppUserModelId("com.pluginlabs.screenshot-studio");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      const p = patch && typeof patch === "object" ? patch : {};
      const before = data.settings.shortcut;
      data.settings = C.normalizeSettings({ ...data.settings, ...p });
      if (data.settings.shortcut !== before) registerShortcut();
      return changed();
    });
    handle("output:choose", async () => {
      let d;
      if (TEST) d = testRead("outdir.txt") || null;
      else { const r = await dialog.showOpenDialog(win, { title: "Kayıt klasörünü seçin", properties: ["openDirectory", "createDirectory"] }); d = r.canceled || !r.filePaths.length ? null : r.filePaths[0]; }
      if (!d) return { cancelled: true };
      if (!fs.statSync(d).isDirectory()) throw new Error("Klasör seçin.");
      data.settings = C.normalizeSettings({ ...data.settings, output: "folder", outputDir: d });
      changed();
      return { dir: d };
    });
    handle("capture:start", (mode) => capture(mode === "screen" ? "screen" : "region"));
    handle("capture:windows", () => listWindows());
    handle("capture:window", (id) => capture("window", C.str(id, 200)));
    handle("capture:open", async () => {
      let file;
      if (TEST) file = testRead("pick.txt");
      else {
        const r = await dialog.showOpenDialog(win, { title: "Görüntü açın", properties: ["openFile"], filters: [{ name: "Görüntüler", extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp"] }] });
        if (r.canceled || !r.filePaths.length) return { cancelled: true };
        file = r.filePaths[0];
      }
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > 100 * 1024 * 1024) throw new Error("Dosya 100 MB'tan büyük.");
      let img = nativeImage.createFromPath(file);
      if (img.isEmpty()) {
        // WebP/GIF gibi nativeImage'in çözemediği biçimler arayüzde (Chromium) çözülür: baytlar arayüze verilir.
        return { decode: true, bytes: new Uint8Array(fs.readFileSync(file)), name: path.basename(file) };
      }
      return setCurrent(img, "dosya");
    });
    handle("capture:fromBytes", (bytes, source) => {
      const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []));
      if (!PNG_MAGIC.every((b, i) => buf[i] === b)) throw new Error("PNG bekleniyordu.");
      return setCurrent(nativeImage.createFromBuffer(buf), source === "pano" ? "pano" : "dosya");
    });
    handle("capture:paste", () => {
      const img = clipboard.readImage();
      if (img.isEmpty()) throw new Error("Panoda görüntü yok.");
      return setCurrent(img, "pano");
    });
    handle("capture:image", () => {
      const c = need();
      const { width, height } = c.image.getSize();
      return { id: c.id, bytes: new Uint8Array(c.image.toPNG()), width, height, source: c.source, at: c.at };
    });
    handle("scan:run", async () => {
      const c = need();
      if (!ocrAvailable()) throw new Error("OCR dil verisi bulunamadı; uygulamayı yeniden kurun.");
      const t0 = Date.now();
      const lines = await ocr().words(c.image);
      if (current !== c) return { stale: true };
      c.lines = lines;
      const { width, height } = c.image.getSize();
      const candidates = C.findCandidates(lines, width, height);
      push();
      return { id: c.id, candidates, words: lines.reduce((a, l) => a + l.words.length, 0), ms: Date.now() - t0 };
    });
    handle("scan:mymind", async (coveredRects) => {
      const c = need();
      if (!c.lines) throw new Error("Önce hassas alan taramasını çalıştırın.");
      const rects = (Array.isArray(coveredRects) ? coveredRects : []).slice(0, 500).filter((r) => r && [r.x, r.y, r.w, r.h].every(Number.isFinite));
      const covered = (w) => rects.some((r) => C.overlap(r, w));
      const words = C.aiWords(c.lines, covered);
      if (!words.length) return { approved: true, candidates: [], sent: 0 };
      const p = C.aiPayload(words);
      const ok = await approve("MyMind'a gönderilsin mi? (ek hassas alan adayı)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Görüntüde okunan " + p.sent.count + " kelime (rakam içerenler ve zaten maskelenenler hariç)\n• Örnek: " + p.sent.sample +
        "\n\nGörüntünün kendisi, kelimelerin konumu, numaralar, e-posta ve kurallarca bulunan değerler gönderilmez. Öneriler yalnız ADAY olarak işaretlenir; siz kabul etmedikçe maskelenmez.", "Gönder");
      if (!ok) return { approved: false };
      const picks = C.validateAi(await askMymind(p.messages, 500), words);
      const { width, height } = c.image.getSize();
      return { approved: true, sent: words.length, candidates: C.candidatesForWords(c.lines, picks, width, height) };
    });
    handle("export:save", (bytes, meta) => {
      const r = checkExport(bytes, meta);
      const w = writeNew(r.fmt, r.buf, meta && meta.name);
      let copied = false;
      if (data.settings.copyAfterSave) { clipboard.writeImage(r.img); copied = true; }
      const h = record({ ...exportEntry(r, meta, "save"), file: w.file, name: w.name });
      changed();
      return { name: w.name, bytes: r.buf.length, verified: r.verify.ok, pixels: r.verify.pixels, masks: r.masks, copied, prepMs: h.prepMs, historyId: h.id };
    });
    handle("export:copy", (bytes, meta) => {
      const r = checkExport(bytes, meta);
      clipboard.writeImage(r.img);
      const h = record({ ...exportEntry(r, meta, "copy"), name: "Panoya kopyalandı" });
      changed();
      return { bytes: r.buf.length, verified: r.verify.ok, pixels: r.verify.pixels, masks: r.masks, prepMs: h.prepMs, historyId: h.id };
    });
    handle("history:reveal", (id) => {
      const h = data.history.find((x) => x.id === id);
      if (!h || !h.file) throw new Error("Kayıt bulunamadı.");
      if (!fs.existsSync(h.file)) throw new Error("Dosya artık yerinde değil.");
      if (TEST) testLog("reveal.txt", h.file); else shell.showItemInFolder(h.file);
      return true;
    });
    handle("history:forget", (id) => { data.history = data.history.filter((x) => x.id !== id); return changed(); });
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });

    // Seçim katmanı yalnız kendi üç kanalını çağırabilir.
    handle("overlay:init", () => {
      if (!overlayJob) throw new Error("Seçim yok.");
      const { width, height } = overlayJob.display.bounds;
      return { image: overlayJob.shot.toDataURL(), width, height };
    }, "overlay");
    handle("overlay:done", (rect) => {
      const r = rect && typeof rect === "object" ? { x: +rect.x, y: +rect.y, width: +rect.width, height: +rect.height } : null;
      finishOverlay(r && [r.x, r.y, r.width, r.height].every(Number.isFinite) ? r : null);
      return true;
    }, "overlay");
    handle("overlay:cancel", () => { finishOverlay(null); return true; }, "overlay");

    createWindow();
    registerShortcut();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { globalShortcut.unregisterAll(); if (ocrMod) ocrMod.stop(); });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi pencerelerimizden gelir; seçim katmanı yalnız "overlay" kanallarını, ana pencere yalnız "main" kanallarını çağırabilir.
function assertOwn(e, owner) {
  const fromMain = win && !win.isDestroyed() && e.sender === win.webContents;
  const fromOverlay = overlay && !overlay.isDestroyed() && e.sender === overlay.webContents;
  if ((owner === "main" && fromMain) || (owner === "overlay" && fromOverlay)) return;
  throw new Error("Yetkisiz istek.");
}
