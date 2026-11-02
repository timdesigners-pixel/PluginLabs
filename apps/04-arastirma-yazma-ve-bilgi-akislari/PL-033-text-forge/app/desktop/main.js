/* Text Forge — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yapıştırılan / panodan alınan / .txt-.md dosyasından açılan metin → sabit alanlar yer tutucuya → düzelt, sadeleştir, kısalt,
 * ton, biçimlendir (cihazda, kural tabanlı) → fark görünümü → kullanıcı "Kopyala" deyince panoya. Kaynak uygulamaya kendiliğinden yazılmaz.
 * Pano yalnız kullanıcı eylemiyle (düğme ya da Ctrl+Shift+Y) okunur; parola gibi görünen tek parça metin alınmaz.
 * MyMind isteğe bağlı ve her istekte onaylı; sabit alanlar ve gizli değerler gönderilmez (yalnız ⟦n⟧ yer tutucuları gider). */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, globalShortcut } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir.
if (process.env.TF_USER_DATA) app.setPath("userData", process.env.TF_USER_DATA);
const TEST = process.env.TF_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 1024 * 1024;
const HOTKEY = "CommandOrControl+Shift+Y";

let win = null;
let memoryKey = null;
let hotkeyOn = false;
let data = { settings: C.normalizeSettings({}), history: [], metrics: C.normalizeMetrics({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "atolye.bin" : "atolye.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli — metinler kişisel olabilir) ----
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
    data.history = C.normalizeHistory(d.history);
    data.metrics = C.normalizeMetrics(d.metrics);
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
function view() {
  return {
    settings: data.settings,
    history: data.history.map((h) => ({ ...h, input: h.input.slice(0, 600), output: h.output })),
    stats: C.stats(data.metrics), vault: vault(), hasKey: !!readKey(), platform: process.platform, hotkey: hotkeyOn ? "Ctrl+Shift+Y" : "",
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function addHistory(e) {
  const h = C.normalizeHistory([{ ...e, id: C.uid(), at: Date.now() }])[0];
  data.history.unshift(h);
  data.history = data.history.slice(0, C.MAX_HISTORY);
  data.metrics.suggestions++;
  return h;
}

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1240, height: 800, minWidth: 980, minHeight: 620, useContentSize: true, autoHideMenuBar: true,
    title: "Text Forge", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
async function pickFile() {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Metin dosyası seçin", properties: ["openFile"], filters: [{ name: "Metin", extensions: ["txt", "md", "markdown"] }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
/** UTF-8 (BOM'lu/BOM'suz) ya da UTF-16; geçersiz UTF-8 ise Türkçe Windows kod sayfası (1254) denenir. */
function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, ""); } catch { /* aşağıda */ }
  try { return new TextDecoder("windows-1254").decode(buf); } catch { return buf.toString("latin1"); }
}
/** Panoyu okur (yalnız kullanıcı eylemiyle çağrılır). Parola gibi görünen tek parça metin alınmaz. */
function readClipboardSafe() {
  const text = clipboard.readText();
  if (!text || !text.trim()) return { empty: true };
  if (C.looksLikeSecret(text)) { data.metrics.secretsBlocked++; save(); return { blocked: true }; }
  if (text.length > C.MAX_CHARS) return { text: text.slice(0, C.MAX_CHARS), truncated: true };
  return { text };
}
function showWin() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
/** Genel kısayol: panodaki metni atölyeye getirir (hızlı pencere). */
function quick() {
  const r = readClipboardSafe();
  showWin();
  const send = () => win && !win.isDestroyed() && win.webContents.send("quick:text", r);
  if (win.webContents.isLoading()) win.webContents.once("did-finish-load", send); else send();
}
function applyHotkey() {
  if (TEST) { hotkeyOn = !!data.settings.hotkey; return; }
  try { globalShortcut.unregister(HOTKEY); } catch { /* yok */ }
  hotkeyOn = data.settings.hotkey ? globalShortcut.register(HOTKEY, quick) : false;
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
const hubUrl = () => (TEST && process.env.TF_HUB_URL) || net.HUB_URL;
async function askMymind(messages, maxTokens) {
  const key = readKey();
  if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) testLog("mymind-sent.json", JSON.stringify(messages));
  try { return await net.mymindChat(hubUrl(), key, messages, maxTokens); } catch (err) {
    const m = err && err.message ? err.message : String(err);
    throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
  }
}
function opts(o) {
  o = o || {};
  return { ops: C.normalizeOps(o.ops), tone: C.TONES.includes(o.tone) ? o.tone : "koru", toneSample: C.str(o.toneSample, 4000), glossary: data.settings.glossary };
}
function remember(o) {
  data.settings = C.normalizeSettings({ ...data.settings, ops: o.ops, tone: o.tone, toneSample: o.toneSample });
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => showWin());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.text-forge");
    load();
    applyHotkey();
    if (TEST) global.__tfQuick = quick; // duman testi kısayolu bu işlevle tetikler (yalnız test kipinde)
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      data.settings = C.normalizeSettings({ ...data.settings, ...(patch || {}) });
      if (patch && "hotkey" in patch) applyHotkey();
      return changed();
    });

    // Metin kaynakları: yalnız kullanıcının yapıştırdığı/seçtiği
    handle("text:sample", () => ({ text: SAMPLE.text }));
    handle("text:openFile", async () => {
      const file = await pickFile();
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > MAX_FILE) throw new Error("Dosya 1 MB'tan büyük.");
      const text = decode(fs.readFileSync(file));
      return { text: text.slice(0, C.MAX_CHARS), truncated: text.length > C.MAX_CHARS, name: path.basename(file) };
    });
    handle("clip:read", () => readClipboardSafe());

    // Dönüştürme (yerel)
    handle("forge:run", (text, o) => {
      const t = C.str(text, C.MAX_CHARS);
      if (!t.trim()) throw new Error("Önce bir metin yazın ya da yapıştırın.");
      const op = opts(o);
      const r = C.forge(t, op);
      remember(op);
      data.metrics.runs++;
      data.metrics.fieldsTotal += r.total;
      data.metrics.fieldsKept += r.kept;
      const h = addHistory({ input: t, output: r.output, source: "yerel", ops: r.ops, tone: op.tone, kept: r.kept, total: r.total });
      save(); push();
      return { ...r, histId: h.id };
    });
    handle("clip:copy", (text, histId, hide) => {
      const t = C.str(text, C.MAX_CHARS * 2);
      if (!t) throw new Error("Kopyalanacak metin yok.");
      clipboard.writeText(t);
      data.metrics.copies++;
      const h = histId && data.history.find((x) => x.id === histId);
      if (h && !h.used) { h.used = true; data.metrics.used++; }
      const r = changed();
      if (hide && data.settings.hideAfterCopy && win) { if (TEST) testLog("hidden.txt", "1"); else win.minimize(); }
      return { copied: t.length, state: r };
    });
    handle("history:remove", (id) => { data.history = data.history.filter((x) => x.id !== id); return changed(); });
    handle("history:clear", () => { data.history = []; return changed(); });

    // MyMind (Hub üzerinden; her istek ayrı onaylı; sabit alanlar ve gizli değerler gönderilmez)
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:alternatives", async (text, o) => {
      const t = C.str(text, C.MAX_CHARS);
      if (!t.trim()) throw new Error("Önce bir metin yazın ya da yapıştırın.");
      const op = opts(o);
      const p = C.aiPayload(t, op);
      const sens = p.sent.sensitive.map((x) => x.count + " " + x.label).join(", ");
      const ok = await approve("MyMind'a gönderilsin mi? (alternatif yazım)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Metin: " + p.sent.chars + " karakter; " + p.sent.fields + " sabit alan (sayı, tarih, ad, e-posta, bağlantı…) ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" +
        (sens ? "\n• Gizli değerler (" + sens + ") gönderilmez" : "") + "\n• İstek: " + (p.sent.ops.join(", ") || "daha iyi yaz") + " · " + p.sent.tone +
        (p.sent.sample ? "\n• Ton örneği: " + p.sent.sample + " karakter (sabit alanları silinmiş)" : "") +
        "\n\nGeçmişiniz, sözlüğünüz ve pano gönderilmez. Dönen her alternatifte sabit alanlar denetlenir; eksik olan işaretlenir.", "Gönder");
      if (!ok) return { approved: false };
      const alts = C.validateAlternatives(await askMymind(p.messages, 1500), p.fields, p.original);
      remember(op);
      data.metrics.aiRuns++;
      const out = alts.map((a) => {
        data.metrics.aiFieldsTotal += a.total;
        data.metrics.aiFieldsKept += a.kept;
        const h = addHistory({ input: t, output: a.text, source: "mymind", ops: op.ops, tone: op.tone, kept: a.kept, total: a.total, note: a.note });
        return { ...a, histId: h.id };
      });
      save(); push();
      return { approved: true, alternatives: out };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi penceremizden gelen çağrıları kabul eder.
function assertOwn(e) {
  if (!(win && !win.isDestroyed() && e.sender === win.webContents)) throw new Error("Yetkisiz istek.");
}
