/* Read Partner — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yapıştırılan metin ya da yerel dosya (.txt/.md/.html) → ¶ numaralı paragraflar → kullanıcının seçtiği bölüm için yan yana
 * sadeleştirme, terim açıklaması, 3 anlama sorusu ve kaynak içi soru-cevap. Hepsi cihazda, kural tabanlı; MyMind isteğe bağlı ve onaylı.
 * Kullanıcı seçmeden hiçbir şey okunmaz; tarama geçmişine erişim yok. Kayıtlar cihazda, kasa (DPAPI) varsa şifreli. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir.
if (process.env.RP_USER_DATA) app.setPath("userData", process.env.RP_USER_DATA);
const TEST = process.env.RP_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 5 * 1024 * 1024;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), docs: [], currentId: "", metrics: C.normalizeMetrics({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "okumalar.bin" : "okumalar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli — okunan belgeler kişisel olabilir) ----
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
    data.docs = C.normalizeDocs(d.docs);
    data.metrics = C.normalizeMetrics(d.metrics);
    data.currentId = data.docs.some((x) => x.id === d.currentId) ? d.currentId : (data.docs[0] && data.docs[0].id) || "";
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
const doc = (id) => { const d = data.docs.find((x) => x.id === (id || data.currentId)); if (!d) throw new Error("Belge bulunamadı."); return d; };
function view() {
  const cur = data.docs.find((x) => x.id === data.currentId) || null;
  return {
    settings: data.settings,
    docs: data.docs.map((d) => ({ id: d.id, title: d.title, kind: d.kind, paragraphs: d.paragraphs.length, words: C.words(d.paragraphs.join(" ")).length, explanations: d.explanations.length, createdAt: d.createdAt, openedAt: d.openedAt })),
    current: cur ? { id: cur.id, title: cur.title, kind: cur.kind, paragraphs: cur.paragraphs, explanations: cur.explanations, lastRange: cur.lastRange, readability: C.readability(cur.paragraphs.join("\n")), injections: C.injectionScan(cur) } : null,
    stats: C.stats(data.metrics), vault: vault(), hasKey: !!readKey(), platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function addDoc(d) {
  if (data.docs.length >= C.MAX_DOCS) throw new Error("En fazla " + C.MAX_DOCS + " belge tutulur; kitaplıktan eskileri silin.");
  d.openedAt = Date.now();
  data.docs.unshift(d);
  data.currentId = d.id;
  changed();
  return { id: d.id, title: d.title, paragraphs: d.paragraphs.length };
}
function addExplanation(d, e) {
  const x = C.normalizeExplanation({ ...e, id: C.uid(), at: Date.now() });
  d.explanations.push(x);
  if (d.explanations.length > 200) d.explanations = d.explanations.slice(-200);
  data.metrics.explanations++;
  return x;
}

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1240, height: 800, minWidth: 980, minHeight: 620, useContentSize: true, autoHideMenuBar: true,
    title: "Read Partner", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title: "Okunacak belgeyi seçin", properties: ["openFile"], filters: [{ name: "Metin belgeleri", extensions: ["txt", "md", "markdown", "html", "htm"] }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
/** UTF-8 (BOM'lu/BOM'suz) ya da UTF-16; geçersiz UTF-8 ise Türkçe Windows kod sayfası (1254) denenir. */
function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, ""); } catch { /* aşağıda */ }
  try { return new TextDecoder("windows-1254").decode(buf); } catch { return buf.toString("latin1"); }
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
const hubUrl = () => (TEST && process.env.RP_HUB_URL) || net.HUB_URL;
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

if (gotLock) {
  app.on("second-instance", () => { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.read-partner");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => { data.settings = C.normalizeSettings({ ...data.settings, ...(patch || {}) }); return changed(); });

    // Belgeler: yalnız kullanıcının yapıştırdığı metin veya seçtiği dosya
    handle("doc:addText", (title, text) => {
      const t = typeof text === "string" ? text : "";
      if (t.length > C.MAX_CHARS) throw new Error("Metin çok uzun (en çok 1,5 milyon karakter).");
      return addDoc(C.importDocument(t, /^\s*<(!doctype|html)/i.test(t) ? "html" : "paste", title, Date.now()));
    });
    handle("doc:openFile", async () => {
      const file = await pickFile();
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > MAX_FILE) throw new Error("Belge 5 MB'tan büyük.");
      const ext = path.extname(file).toLowerCase();
      const kind = ext === ".html" || ext === ".htm" ? "html" : ext === ".md" || ext === ".markdown" ? "md" : "txt";
      return addDoc(C.importDocument(decode(fs.readFileSync(file)), kind, path.basename(file, ext), Date.now()));
    });
    handle("doc:sample", () => addDoc(C.importDocument(SAMPLE.text, "paste", SAMPLE.title, Date.now())));
    handle("doc:open", (id) => { const d = doc(id); d.openedAt = Date.now(); data.currentId = d.id; return changed(); });
    handle("doc:rename", (id, title) => { const d = doc(id); d.title = C.str(title, 120) || d.title; return changed(); });
    handle("doc:remove", (id) => {
      doc(id);
      data.docs = data.docs.filter((x) => x.id !== id);
      if (data.currentId === id) data.currentId = (data.docs[0] && data.docs[0].id) || "";
      return changed();
    });
    handle("doc:exportMd", async (id) => {
      const d = doc(id);
      const text = C.exportMarkdown(d);
      let file;
      if (TEST) file = path.join(TEST, "disari.md");
      else {
        const r = await dialog.showSaveDialog(win, { title: "Açıklamaları dışa aktar", defaultPath: d.title.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 60) + " — Read Partner.md", filters: [{ name: "Markdown", extensions: ["md"] }] });
        if (r.canceled || !r.filePath) return { cancelled: true };
        file = r.filePath;
      }
      fs.writeFileSync(file, text);
      return { file, explanations: d.explanations.length };
    });

    // Açıklamalar (yerel, kural tabanlı)
    handle("expl:analyze", (id, a, b, exact, level) => {
      const d = doc(id);
      const r = C.analyze(d, a, b, exact, level || data.settings.level);
      d.lastRange = r.range;
      const x = addExplanation(d, { range: r.range, level: level || data.settings.level, source: "yerel", text: r.text.slice(0, 2000), result: { simple: r.simple, terms: r.terms, questions: r.questions } });
      save(); push();
      return { explId: x.id, ...r };
    });
    handle("expl:term", (id, term) => C.explainTerm(term, doc(id)));
    handle("expl:ask", (id, q) => {
      const r = C.ask(q, doc(id));
      data.metrics.questionsAsked++;
      if (!r.found) data.metrics.unanswered++;
      save(); push();
      return r;
    });
    handle("expl:rate", (id, explId, score) => {
      const d = doc(id);
      const e = d.explanations.find((x) => x.id === explId);
      if (!e) throw new Error("Açıklama bulunamadı.");
      const s = Math.round(Number(score));
      if (!(s >= 1 && s <= 5)) throw new Error("Puan 1–5 arası olmalı.");
      const prev = data.metrics.ratings.find((r) => r.explId === explId);
      if (prev) prev.score = s; else data.metrics.ratings.push({ at: Date.now(), score: s, source: e.source, explId });
      data.metrics.ratings = data.metrics.ratings.slice(-1000);
      e.rating = s;
      return changed();
    });
    handle("expl:remove", (id, explId) => { const d = doc(id); d.explanations = d.explanations.filter((x) => x.id !== explId); return changed(); });

    // MyMind (Hub üzerinden; her istek ayrı onaylı; yalnız seçili paragraflar ya da soruyla eşleşen en çok 4 paragraf gider)
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:explain", async (id, a, b, level) => {
      const d = doc(id);
      const p = C.explainPayload(d, a, b, level || data.settings.level);
      const inj = C.injectionScan(d).filter((x) => x.p >= p.range[0] && x.p <= p.range[1]);
      const ok = await approve("MyMind'a gönderilsin mi? (seçili bölümü açıkla)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Belge: " + p.sent.title + "\n• Seçili paragraflar: " + p.sent.range + " (" + p.sent.chars + " karakter)\n• Seviye: " + p.sent.level +
        "\n\nBelgenin geri kalanı, kitaplığınız ve tarama geçmişi gönderilmez. Metin modele “güvenilmeyen veri” olarak işaretlenerek verilir" + (inj.length ? "; bu bölümde " + inj.length + " sayfa içi talimat bulundu, uygulanmaması istenir" : "") +
        ". Her açıklamanın metinden alıntısı denetlenir; alıntısı metinde olmayanlar “desteklenmeyen” diye işaretlenir.", "Gönder");
      if (!ok) return { approved: false };
      const v = C.validateExplain(await askMymind(p.messages, 1200), p.paras);
      data.metrics.claims += v.claims;
      data.metrics.unsupported += v.unsupported;
      d.lastRange = p.range;
      const x = addExplanation(d, { range: p.range, level: p.level, source: "mymind", text: p.paras.map((q) => q.text).join("\n\n").slice(0, 2000), result: v });
      save(); push();
      return { approved: true, explId: x.id, range: p.range, ...v };
    });
    handle("mymind:ask", async (id, q) => {
      const d = doc(id);
      const local = C.ask(q, d);
      const p = C.askPayload(d, q, local);
      const ok = await approve("MyMind'a sorulsun mu?",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Soru: " + p.sent.question + "\n• Soruyla eşleşen paragraflar: " + (p.sent.paragraphs.join(", ") || "yok") + " (" + p.sent.chars + " karakter)" +
        "\n\nBelgenin geri kalanı gönderilmez. Yanıt metinde yoksa MyMind'dan “bilinmiyor” demesi istenir; kaynak alıntısı denetlenir.", "Sor");
      if (!ok) return { approved: false };
      const v = C.validateAsk(await askMymind(p.messages, 600), p.paras);
      data.metrics.questionsAsked++;
      if (v.unknown) data.metrics.unanswered++;
      data.metrics.claims += v.claims;
      data.metrics.unsupported += v.unsupported;
      save(); push();
      return { approved: true, question: p.question, ...v };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi penceremizden gelen çağrıları kabul eder.
function assertOwn(e) {
  if (!(win && !win.isDestroyed() && e.sender === win.webContents)) throw new Error("Yetkisiz istek.");
}
