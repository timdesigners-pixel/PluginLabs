/* Parallel Translate — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yapıştırılan / panodan (kullanıcı eylemiyle, Ctrl+Shift+Space) alınan / .txt-.md dosyasından açılan metin → bölümler →
 * yan yana çeviri tablosu. Çeviri elle yazılır, var olan çeviri yapıştırılıp hizalanır ya da isteğe bağlı olarak MyMind (PluginLabs Hub)
 * veya bu bilgisayardaki yerel model ile, her istekte onayla üretilir. Kişisel terim sözlüğü her bölümde denetlenir.
 * Korunan alanların (sayı, tutar, bağlantı, e-posta, gizli değer) değerleri modele gönderilmez; yalnız ⟦n⟧ yer tutucuları gider. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, globalShortcut } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir.
if (process.env.PT_USER_DATA) app.setPath("userData", process.env.PT_USER_DATA);
const TEST = process.env.PT_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const HOTKEY = "CommandOrControl+Shift+Space";

let win = null;
let memoryKey = null;
let hotkeyOn = false;
let data = { settings: C.normalizeSettings({}), glossary: [], docs: [], active: null, metrics: C.normalizeMetrics({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "ceviriler.bin" : "ceviriler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli — sözleşme ve mesajlar gizli olabilir) ----
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
    data.glossary = C.normalizeGlossary(d.glossary);
    data.docs = C.normalizeDocs(d.docs);
    data.active = data.docs.some((x) => x.id === d.active) ? d.active : null;
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
function docSummary(d) {
  const s = C.docStats(d, data.glossary);
  return { id: d.id, title: d.title, srcLang: d.srcLang, updatedAt: d.updatedAt, createdAt: d.createdAt, archived: d.archived, sample: d.sample, stats: s, preview: d.segments[0] ? d.segments[0].src.slice(0, 140) : "" };
}
function view() {
  const doc = data.docs.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings, glossary: data.glossary,
    docs: data.docs.map(docSummary).sort((a, b) => b.updatedAt - a.updatedAt),
    doc, stats: C.stats(data.docs, data.glossary, data.metrics),
    vault: vault(), hasKey: !!readKey(), platform: process.platform, hotkey: hotkeyOn ? "Ctrl+Shift+Space" : "",
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getDoc(id) {
  const d = data.docs.find((x) => x.id === id);
  if (!d) throw new Error("Belge bulunamadı.");
  return d;
}
function getSeg(d, id) {
  const s = d.segments.find((x) => x.id === id);
  if (!s) throw new Error("Bölüm bulunamadı.");
  return s;
}
const touch = (d) => { d.updatedAt = Date.now(); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Parallel Translate", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
async function pickFile(title, exts) {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title, properties: ["openFile"], filters: [{ name: "Dosya", extensions: exts }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}
/** UTF-8 (BOM'lu/BOM'suz) ya da UTF-16; geçersiz UTF-8 ise Türkçe Windows kod sayfası (1254) denenir. */
function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, ""); } catch { /* aşağıda */ }
  try { return new TextDecoder("windows-1254").decode(buf); } catch { return buf.toString("latin1"); }
}
function readTextFile(file) {
  if (fs.statSync(file).size > MAX_FILE) throw new Error("Dosya 2 MB'tan büyük.");
  return decode(fs.readFileSync(file));
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
/** Genel kısayol: panodaki metni seçim paneline getirir. */
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
const hubUrl = () => (TEST && process.env.PT_HUB_URL) || net.HUB_URL;
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
    const m = err && err.message ? err.message : String(err);
    if (/ECONNREFUSED|fetch failed/i.test(m)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + "). LM Studio / Ollama sunucusunu başlatın.");
    throw new Error(m);
  }
}

function newDoc(text, o) {
  o = o || {};
  const t = C.str(text, C.MAX_CHARS);
  if (!t.trim()) throw new Error("Önce çevrilecek bir metin yazın ya da yapıştırın.");
  const segs = C.segment(t).map((s) => C.normalizeSegment({ ...s, status: "bos" }));
  const srcLang = C.LANGS.includes(o.srcLang) ? o.srcLang : data.settings.autoDetect ? C.detectLang(t) : data.settings.defaultSrc;
  const first = segs[0] ? segs[0].src : "";
  const firstLine = C.str(o.title, 120).trim() || (first.length > 56 ? first.slice(0, 55).trim() + "…" : first);
  const d = C.normalizeDoc({ id: C.uid(), title: firstLine, srcLang, context: o.context, segments: segs, sample: !!o.sample });
  data.docs.unshift(d);
  // En eski arşivli (yoksa en eski) belge sınırı aşınca çıkarılır.
  while (data.docs.length > C.MAX_DOCS) { const i = data.docs.map((x) => x.archived).lastIndexOf(true); data.docs.splice(i >= 0 ? i : data.docs.length - 1, 1); }
  data.active = d.id;
  return d;
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => showWin());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.parallel-translate");
    load();
    applyHotkey();
    if (TEST) global.__ptQuick = quick; // duman testi kısayolu bu işlevle tetikler (yalnız test kipinde)
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if ("hotkey" in patch) applyHotkey();
      return changed();
    });

    // Metin kaynakları: yalnız kullanıcının yapıştırdığı/seçtiği
    handle("text:sample", () => {
      // Örnek belge ve temsilî terim kümesi; sözlükte olmayan örnek terimler eklenir.
      const before = data.glossary.length;
      data.glossary = C.normalizeGlossary(data.glossary.concat(SAMPLE.glossary.map((e) => ({ ...e, id: C.uid() }))));
      const d = newDoc(SAMPLE.text, { title: SAMPLE.title, context: SAMPLE.context, srcLang: "tr", sample: true });
      const r = changed();
      return { added: data.glossary.length - before, docId: d.id, state: r };
    });
    handle("text:openFile", async () => {
      const file = await pickFile("Metin dosyası seçin", ["txt", "md", "markdown"]);
      if (!file) return { cancelled: true };
      const text = readTextFile(file);
      return { text: text.slice(0, C.MAX_CHARS), truncated: text.length > C.MAX_CHARS, name: path.basename(file) };
    });
    handle("clip:read", () => readClipboardSafe());

    // Belgeler
    handle("doc:create", (text, o) => { newDoc(text, o); return changed(); });
    handle("doc:open", (id) => { if (id) getDoc(id); data.active = id || null; return changed(); });
    handle("doc:update", (id, patch) => {
      const d = getDoc(id);
      patch = patch || {};
      if ("title" in patch) d.title = C.str(patch.title, 120).trim() || d.title;
      if ("context" in patch) d.context = C.str(patch.context, 300);
      touch(d);
      return changed();
    });
    handle("doc:swap", (id) => {
      // Yön değiştirilir: kaynak dili diğer dil sayılır (çeviriler korunur, yalnız denetim yönü değişir).
      const d = getDoc(id);
      d.srcLang = C.other(d.srcLang);
      touch(d);
      return changed();
    });
    handle("doc:archive", (id) => { const d = getDoc(id); d.archived = true; if (data.active === id) data.active = null; touch(d); return changed(); });
    handle("doc:restore", (id) => { const d = getDoc(id); d.archived = false; touch(d); return changed(); });
    handle("doc:align", (id, targetText) => {
      const d = getDoc(id);
      const t = C.str(targetText, C.MAX_CHARS);
      if (!t.trim()) throw new Error("Hizalanacak çeviri metnini yapıştırın.");
      const filled = d.segments.filter((s) => s.tgt && s.tgt.trim()).length;
      const r = C.align(d.segments, t);
      let segs = d.segments.map((s, i) => ({ ...s, tgt: r.pairs[i].tgt, status: r.pairs[i].tgt ? "elle" : "bos", rating: "", alts: [], note: "", missing: [] }));
      // 2-1 eşleşmeler: iki kaynak bölüm tek çeviriye karşılık geliyor → kaynaklar birleştirilir.
      for (let i = segs.length - 2; i >= 0; i--) if (r.pairs[i].mergeWithNext) { const tgt = segs[i].tgt; segs = C.mergeSegments(segs, segs[i].id); segs[i].tgt = tgt; segs[i].status = tgt ? "elle" : "bos"; }
      d.segments = segs.map(C.normalizeSegment);
      data.metrics.aligns++;
      touch(d);
      const st = changed();
      return { segments: d.segments.length, targetSentences: r.targetSentences, merged: r.pairs.filter((p) => p.mergeWithNext).length, replaced: filled, state: st };
    });
    handle("doc:export", async (id, format) => {
      const d = getDoc(id);
      const x = C.exportDoc(d, format, data.glossary);
      const safeName = (d.title || "ceviri").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || "ceviri";
      const file = await pickSave(safeName + "." + x.ext, x.ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, x.body, "utf8");
      data.metrics.exports++;
      save();
      return { file: path.basename(file), bytes: Buffer.byteLength(x.body) };
    });
    handle("doc:copyTarget", (id, which) => {
      const d = getDoc(id);
      const t = which === "both" ? d.segments.map((s) => s.src + "\n" + (s.tgt || "")).join("\n\n") : C.join(d.segments, "tgt");
      if (!t.trim()) throw new Error("Kopyalanacak çeviri yok.");
      clipboard.writeText(t);
      data.metrics.copies++;
      save();
      return { copied: t.length };
    });
    handle("doc:backup", async () => {
      const file = await pickSave("parallel-translate-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "parallel-translate", version: 1, exportedAt: new Date().toISOString(), glossary: data.glossary, docs: data.docs }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Bölümler
    handle("seg:set", (docId, segId, tgt) => {
      const d = getDoc(docId), s = getSeg(d, segId);
      const t = C.str(tgt, C.MAX_CHARS);
      if (t === s.tgt) return { ok: true };
      s.tgt = t;
      s.status = t.trim() ? "elle" : "bos";
      s.missing = [];
      touch(d);
      changed();
      return { ok: true };
    });
    handle("seg:rate", (docId, segId, rating) => {
      const d = getDoc(docId), s = getSeg(d, segId);
      if (!s.tgt.trim()) throw new Error("Önce bu bölümün çevirisi olmalı.");
      s.rating = C.RATINGS.includes(rating) && s.rating !== rating ? rating : "";
      touch(d);
      return changed();
    });
    handle("seg:approve", (docId, segId) => {
      const d = getDoc(docId), s = getSeg(d, segId);
      if (!s.tgt.trim()) throw new Error("Önce bu bölümün çevirisi olmalı.");
      s.status = s.status === "onayli" ? "elle" : "onayli";
      touch(d);
      return changed();
    });
    handle("seg:merge", (docId, segId) => {
      const d = getDoc(docId);
      const n = d.segments.length;
      d.segments = C.mergeSegments(d.segments, segId).map(C.normalizeSegment);
      if (d.segments.length === n) throw new Error("Son bölüm bir sonrakiyle birleştirilemez.");
      touch(d);
      return changed();
    });
    handle("seg:draft", (docId, segIds) => {
      // Sözlük taslağı: yalnız boş bölümler; dolu çeviriye dokunulmaz.
      const d = getDoc(docId);
      const ids = Array.isArray(segIds) && segIds.length ? new Set(segIds) : null;
      let n = 0, terms = 0;
      for (const s of d.segments) {
        if (ids && !ids.has(s.id)) continue;
        if (s.tgt.trim()) continue;
        const r = C.draft(s.src, d.srcLang, data.glossary);
        if (!r.replaced) continue;
        s.tgt = r.text; s.status = "taslak"; n++; terms += r.replaced;
      }
      data.metrics.drafts += n;
      touch(d);
      const st = changed();
      return { segments: n, terms, state: st };
    });
    handle("seg:useAlt", (docId, segId, idx, option) => {
      const d = getDoc(docId), s = getSeg(d, segId);
      const a = s.alts[Number(idx)];
      if (!a || !a.options.includes(option)) throw new Error("Alternatif bulunamadı.");
      const r = C.applyAlternative(s.tgt, a.term, option, C.other(d.srcLang));
      if (!r.applied) throw new Error("“" + a.term + "” çeviride bulunamadı; elle düzenleyin.");
      s.tgt = r.text;
      s.status = "elle";
      a.term = option;
      data.metrics.altsUsed++;
      touch(d);
      return changed();
    });

    // Sözlük
    handle("glossary:add", (e) => {
      const x = C.normalizeEntry({ ...(e || {}), id: C.uid(), at: Date.now() });
      if (x.tr.length < 2 || x.en.length < 2) throw new Error("Türkçe ve İngilizce karşılık en az 2 karakter olmalı.");
      if (data.glossary.length >= C.MAX_GLOSSARY) throw new Error("Sözlük en çok " + C.MAX_GLOSSARY + " terim alır.");
      const exists = data.glossary.find((g) => C.lowerTr(g.tr) === C.lowerTr(x.tr));
      if (exists) { exists.en = x.en; exists.note = x.note || exists.note; }
      else data.glossary.unshift(x);
      data.glossary = C.normalizeGlossary(data.glossary);
      const st = changed();
      return { updated: !!exists, state: st };
    });
    handle("glossary:remove", (id) => { data.glossary = data.glossary.filter((x) => x.id !== id); return changed(); });
    handle("glossary:import", async () => {
      const file = await pickFile("Sözlük dosyası seçin (CSV/TSV: türkçe;ingilizce;not)", ["csv", "tsv", "txt"]);
      if (!file) return { cancelled: true };
      const list = C.parseGlossaryCsv(readTextFile(file));
      if (!list.length) throw new Error("Dosyada geçerli terim satırı bulunamadı (türkçe;ingilizce;not).");
      const before = data.glossary.length;
      const map = new Map(data.glossary.map((g) => [C.lowerTr(g.tr), g]));
      for (const e of list) { const g = map.get(C.lowerTr(e.tr)); if (g) { g.en = e.en; if (e.note) g.note = e.note; } else data.glossary.push(e); }
      data.glossary = C.normalizeGlossary(data.glossary);
      const st = changed();
      return { read: list.length, added: data.glossary.length - before, state: st };
    });
    handle("glossary:export", async () => {
      const file = await pickSave("terim-sozlugu.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.glossaryCsv(data.glossary), "utf8");
      return { file: path.basename(file), count: data.glossary.length };
    });

    // Yapay zekâ çevirisi (MyMind / yerel model; her istek ayrı onaylı; korunan alan değerleri gönderilmez)
    handle("ai:status", () => ({ hasKey: !!readKey(), vault: vault(), provider: data.settings.provider }));
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:translate", async (docId, segIds, overwrite) => {
      const d = getDoc(docId);
      const ids = Array.isArray(segIds) && segIds.length ? new Set(segIds) : null;
      // Elle düzenlenmiş ya da onaylı çevirilerin üzerine yazılmaz (kullanıcı tek bölümü açıkça seçmediyse).
      const segs = d.segments.filter((s) => (ids ? ids.has(s.id) : true) && (overwrite || !s.tgt.trim() || s.status === "taslak" || s.status === "ai"));
      if (!segs.length) throw new Error("Çevrilecek bölüm yok (dolu ve elle düzenlenmiş bölümlerin üzerine yazılmaz).");
      const parts = C.batches(segs);
      const payloads = parts.map((p) => C.aiPayload(p, d.srcLang, data.glossary, d.context));
      const sum = payloads.reduce((a, p) => ({ segments: a.segments + p.sent.segments, chars: a.chars + p.sent.chars, fields: a.fields + p.sent.fields, terms: a.terms + p.sent.terms }), { segments: 0, chars: 0, fields: 0, terms: 0 });
      const sens = {};
      for (const p of payloads) for (const x of p.sent.sensitive) sens[x.label] = (sens[x.label] || 0) + x.count;
      const sensText = Object.entries(sens).map(([l, n]) => n + " " + l).join(", ");
      const prov = providerInfo();
      const ok = await approve("Çeviri için gönderilsin mi? (" + C.LANG_NAMES[d.srcLang] + " → " + C.LANG_NAMES[C.other(d.srcLang)] + ")",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + sum.segments + " bölüm, " + sum.chars + " karakter (" + parts.length + " istek)\n• " + sum.fields + " korunan alan (sayı, tutar, bağlantı, e-posta…) ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" +
        (sensText ? "\n• Gizli değerler (" + sensText + ") gönderilmez" : "") + "\n• Sözlükten yalnız bu bölümlerde geçen " + sum.terms + " terim" + (d.context ? "\n• Bağlam notu (" + d.context.length + " karakter)" : "") +
        "\n\nDiğer belgeleriniz, sözlüğün geri kalanı ve pano gönderilmez. Dönen her çeviride yer tutucular ve sözlük uyumu denetlenir; elle düzenlediğiniz çevirilerin üzerine yazılmaz.", "Gönder");
      if (!ok) return { approved: false };
      let done = 0, failed = 0, missingFields = 0;
      const errors = [];
      for (let k = 0; k < payloads.length; k++) {
        const p = payloads[k];
        let res;
        try { res = C.validateAi(await askModel(p.messages, Math.min(4000, 300 + p.sent.chars * 3)), p); } catch (err) { errors.push(err.message || String(err)); failed += p.items.length; if (k === 0) throw err; continue; }
        data.metrics.aiRuns++;
        for (const r of res) {
          const s = d.segments.find((x) => x.id === r.id);
          if (!s) continue;
          if (!r.ok) { failed++; continue; }
          // İstek sırasında kullanıcı bölümü elle düzenlediyse üzerine yazılmaz.
          if (s.status === "elle" && !overwrite && s.tgt.trim()) { failed++; continue; }
          s.tgt = r.text; s.status = "ai"; s.alts = r.alts; s.note = r.note; s.missing = r.missing; s.rating = "";
          const f = C.checkFields(s.src, s.tgt);
          data.metrics.aiFieldsTotal += f.total; data.metrics.aiFieldsKept += f.kept;
          const g = C.checkGlossary(s.src, s.tgt, d.srcLang, data.glossary);
          data.metrics.aiTermsTotal += g.total; data.metrics.aiTermsHit += g.hits;
          data.metrics.altsShown += r.alts.length;
          missingFields += r.missing.length;
          done++;
        }
        data.metrics.aiSegments += res.filter((r) => r.ok).length;
      }
      touch(d);
      const st = changed();
      return { approved: true, done, failed, missingFields, errors, state: st };
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
