/* Meeting Trace — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yüklenen / yapıştırılan transkript + katılımcı bilgilendirme kaydı → zaman damgalı satırlar → kural tabanlı karar ve görev
 * taslakları → insan onayı (onayla / düzenle / reddet) → toplantı notu, görev listesi (CSV), takvim görevleri (ICS).
 * İsteğe bağlı MyMind (PluginLabs Hub) ya da bu bilgisayardaki yerel model: her istek ayrı onaylı; adlar K-kodlu, iletişim ve gizli
 * değerler ⟦n⟧ yer tutucusuyla gider. Ses kaydı yapılmaz (gizli sürekli kayıt yok); mikrofon izni hiç istenmez. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir.
if (process.env.MT_USER_DATA) app.setPath("userData", process.env.MT_USER_DATA);
const TEST = process.env.MT_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 4 * 1024 * 1024;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), meetings: [], active: null, metrics: C.normalizeMetrics({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "toplantilar.bin" : "toplantilar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa şifreli — toplantı içerikleri gizli olabilir) ----
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
    data.meetings = C.normalizeMeetings(d.meetings);
    data.active = data.meetings.some((x) => x.id === d.active) ? d.active : null;
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
function summary(m) {
  return { id: m.id, title: m.title, date: m.date, format: m.format, archived: m.archived, sample: m.sample, createdAt: m.createdAt, updatedAt: m.updatedAt, consent: m.consent, stats: C.meetingStats(m), speakers: m.speakers.map((s) => s.name) };
}
function allTasks() {
  const out = [];
  for (const m of data.meetings) {
    if (m.archived) continue;
    for (const t of m.items) if (t.kind === "gorev" && t.status === "onayli") out.push({ ...t, meetingId: m.id, meeting: m.title, date: m.date });
  }
  return out.sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9999").localeCompare(b.due || "9999"));
}
function view() {
  const mt = data.meetings.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings,
    meetings: data.meetings.map(summary).sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.updatedAt - a.updatedAt),
    meeting: mt ? { ...mt, stats: C.meetingStats(mt) } : null,
    tasks: allTasks(), stats: C.stats(data.meetings, data.metrics),
    vault: vault(), hasKey: !!readKey(), platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getMeeting(id) {
  const m = data.meetings.find((x) => x.id === id);
  if (!m) throw new Error("Toplantı bulunamadı.");
  return m;
}
function getItem(m, id) {
  const it = m.items.find((x) => x.id === id);
  if (!it) throw new Error("Öğe bulunamadı.");
  return it;
}
const touch = (m) => { m.updatedAt = Date.now(); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Meeting Trace", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title, properties: ["openFile"], filters: [{ name: "Transkript", extensions: exts }] });
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
  if (fs.statSync(file).size > MAX_FILE) throw new Error("Dosya 4 MB'tan büyük.");
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
const safeName = (s, def) => (s || def).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || def;

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
const hubUrl = () => (TEST && process.env.MT_HUB_URL) || net.HUB_URL;
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

/** Transkriptten toplantı oluşturur; katılımcı bilgilendirmesi işaretlenmeden oluşturulmaz. */
function newMeeting(text, o) {
  o = o || {};
  const t = C.str(text, C.MAX_CHARS);
  if (!t.trim()) throw new Error("Önce bir transkript yapıştırın ya da dosya açın.");
  if (!o.consent || !o.consent.informed) throw new Error("Katılımcıların bilgilendirildiğini ve izin verdiğini onaylayın.");
  const p = C.parseTranscript(t, o.format);
  if (!p.lines.length) throw new Error("Transkriptte satır bulunamadı.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(o.date || "") ? o.date : new Date().toISOString().slice(0, 10);
  const participants = (Array.isArray(o.participants) ? o.participants : String(o.participants || "").split(/[,;\n]/)).map((x) => x.trim()).filter((x) => x && !p.speakers.some((s) => s.name.toLowerCase() === x.toLowerCase()));
  const ex = C.extract(p.lines, p.speakers, { meetingDate: date, participants });
  const items = ex.decisions.concat(ex.tasks).filter((x) => x.kind === "karar" || x.confidence >= data.settings.minConfidence);
  const m = C.normalizeMeeting({
    id: C.uid(), title: C.str(o.title, 120).trim() || "Toplantı " + C.trDate(date), date, format: p.format, lines: p.lines, participants, items,
    consent: { informed: true, method: o.consent.method, at: Date.now() }, gold: o.gold, sample: !!o.sample, source: o.source,
  });
  data.meetings.unshift(m);
  // En eski arşivli (yoksa en eski) toplantı sınırı aşınca çıkarılır.
  while (data.meetings.length > C.MAX_MEETINGS) { const i = data.meetings.map((x) => x.archived).lastIndexOf(true); data.meetings.splice(i >= 0 ? i : data.meetings.length - 1, 1); }
  data.active = m.id;
  data.metrics.imports++;
  return { m, truncated: p.truncated };
}
/** Konuşmacı ya da katılımcı değişince taslak olmayan öğelere dokunmadan sorumlular yeniden çıkarılır. */
function reExtract(m) {
  const ex = C.extract(m.lines, m.speakers, { meetingDate: m.date, participants: m.participants });
  const fresh = ex.decisions.concat(ex.tasks).filter((x) => x.kind === "karar" || x.confidence >= data.settings.minConfidence);
  const keep = m.items.filter((x) => x.status !== "taslak" || x.source !== "kural");
  m.items = C.mergeItems(keep, fresh).items.map(C.normalizeItem);
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Mikrofon, kamera ve diğer izin istekleri her zaman reddedilir (bu sürüm ses kaydetmez).
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.meeting-trace");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    // Transkript kaynakları: yalnız kullanıcının yapıştırdığı / seçtiği
    handle("text:sample", () => {
      const { m } = newMeeting(SAMPLE.text, { title: SAMPLE.title, date: SAMPLE.date, participants: SAMPLE.participants, gold: SAMPLE.gold, sample: true, source: SAMPLE.source, consent: { informed: true, method: "Örnek veri (uydurma kişiler)" } });
      return { id: m.id, state: changed() };
    });
    handle("text:openFile", async () => {
      const file = await pickFile("Transkript dosyası seçin", ["txt", "vtt", "srt", "md", "csv", "log"]);
      if (!file) return { cancelled: true };
      const text = readTextFile(file);
      return { text: text.slice(0, C.MAX_CHARS), truncated: text.length > C.MAX_CHARS, name: path.basename(file), format: C.detectFormat(text) };
    });
    handle("clip:read", () => readClipboardSafe());
    handle("text:notice", (title, date) => { const t = C.consentNotice(title, date); clipboard.writeText(t); data.metrics.copies++; save(); return { text: t }; });

    // Toplantılar
    handle("mt:create", (text, o) => { const r = newMeeting(text, o); const st = changed(); return { id: r.m.id, truncated: r.truncated, state: st }; });
    handle("mt:open", (id) => { if (id) getMeeting(id); data.active = id || null; return changed(); });
    handle("mt:update", (id, patch) => {
      const m = getMeeting(id);
      patch = patch || {};
      if ("title" in patch) m.title = C.str(patch.title, 120).trim() || m.title;
      if ("date" in patch && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) m.date = patch.date;
      touch(m);
      return changed();
    });
    handle("mt:renameSpeaker", (id, from, to) => {
      // Konuşmacıyı yeniden adlandırma / birleştirme ("Konuşmacı 3" → "Elif Şahin"). Tahmin işaretli satırlar tahmin kalır.
      const m = getMeeting(id);
      const name = C.str(to, 60).replace(/\s+/g, " ").trim();
      if (name.length < 2) throw new Error("Ad en az 2 karakter olmalı.");
      let n = 0;
      for (const l of m.lines) if (l.speaker === from) { l.speaker = name; n++; }
      if (!n) throw new Error("Konuşmacı bulunamadı.");
      for (const it of m.items) { if (it.speaker === from) it.speaker = name; if (it.assignee === from) { it.assignee = name; if (it.assigneeState === "tahmin" && C.isGenericSpeaker(from) && !C.isGenericSpeaker(name)) { it.assigneeState = "acik"; it.assigneeReason = "Konuşmacı kimliği kullanıcı tarafından belirlendi (" + from + " → " + name + ")"; } } }
      m.participants = m.participants.filter((p) => p.toLowerCase() !== name.toLowerCase());
      m.speakers = C.speakerList(m.lines);
      reExtract(m);
      touch(m);
      const st = changed();
      return { lines: n, state: st };
    });
    handle("mt:participants", (id, list) => {
      const m = getMeeting(id);
      m.participants = (Array.isArray(list) ? list : []).map((x) => C.str(x, 60).trim()).filter((x) => x.length >= 2 && !m.speakers.some((s) => s.name.toLowerCase() === x.toLowerCase())).slice(0, 40);
      reExtract(m);
      touch(m);
      return changed();
    });
    handle("mt:archive", (id) => { const m = getMeeting(id); m.archived = true; if (data.active === id) data.active = null; touch(m); return changed(); });
    handle("mt:restore", (id) => { const m = getMeeting(id); m.archived = false; touch(m); return changed(); });
    handle("mt:export", async (id, format) => {
      const m = getMeeting(id);
      const x = C.exportMeeting(m, format);
      const file = await pickSave(safeName(m.title, "toplanti") + (format === "csv" ? "-gorevler" : format === "ics" ? "-gorevler" : "") + "." + x.ext, x.ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, x.body, "utf8");
      data.metrics.exports++;
      save();
      return { file: path.basename(file), bytes: Buffer.byteLength(x.body) };
    });
    handle("mt:copy", (id) => {
      const m = getMeeting(id);
      const t = C.exportMeeting(m, "txt").body;
      clipboard.writeText(t);
      data.metrics.copies++;
      save();
      return { copied: t.length };
    });
    handle("mt:backup", async () => {
      const file = await pickSave("meeting-trace-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "meeting-trace", version: 1, exportedAt: new Date().toISOString(), meetings: data.meetings }, null, 2), "utf8");
      return { file: path.basename(file) };
    });
    handle("mt:search", (q) => C.search(data.meetings.filter((m) => !m.archived), q, 80));

    // Karar / görev taslakları: insan onayı
    handle("item:status", (id, itemId, status) => {
      const m = getMeeting(id), it = getItem(m, itemId);
      if (!C.ITEM_STATUS.includes(status)) throw new Error("Geçersiz durum.");
      it.status = it.status === status ? "taslak" : status;
      it.decidedAt = Date.now();
      touch(m);
      return changed();
    });
    handle("item:update", (id, itemId, patch) => {
      const m = getMeeting(id), it = getItem(m, itemId);
      patch = patch || {};
      if ("text" in patch) { const t = C.str(patch.text, 600).trim(); if (t.length < 3) throw new Error("Metin en az 3 karakter olmalı."); it.text = t; }
      if (it.kind === "gorev") {
        if ("assignee" in patch) {
          const a = C.str(patch.assignee, 60).trim();
          it.assignee = a;
          it.assigneeState = a ? "acik" : "belirsiz";
          it.assigneeReason = a ? "Sorumlu kullanıcı tarafından belirlendi" : "Sorumlu kullanıcı tarafından boş bırakıldı";
        }
        if ("due" in patch) { it.due = /^\d{4}-\d{2}-\d{2}$/.test(patch.due || "") ? patch.due : ""; it.dueText = it.due ? "elle" : ""; }
        if ("done" in patch) it.done = !!patch.done;
      }
      if ("text" in patch || "assignee" in patch || "due" in patch) { it.edited = true; data.metrics.edits++; }
      touch(m);
      return changed();
    });
    handle("item:add", (id, kind, lineId, text) => {
      const m = getMeeting(id);
      const l = m.lines.find((x) => x.id === lineId) || null;
      const t = C.str(text || (l ? l.text : ""), 600).trim();
      if (t.length < 3) throw new Error("Metin en az 3 karakter olmalı.");
      const it = C.normalizeItem({ id: C.uid(), kind: kind === "karar" ? "karar" : "gorev", text: t, lineIds: l ? [l.id] : [], t: l ? l.t : null, speaker: l ? l.speaker : "", source: "elle", status: "onayli", confidence: 1, assignee: "", assigneeState: "belirsiz", assigneeReason: "Elle eklendi; sorumlu seçilmedi", decidedAt: Date.now() });
      const due = C.findDue(t, m.date);
      if (it.kind === "gorev" && due) { it.due = due.date; it.dueText = due.text; }
      m.items.push(it);
      data.metrics.manual++;
      touch(m);
      const st = changed();
      return { itemId: it.id, state: st };
    });
    handle("item:approveAll", (id, kind) => {
      // Yalnız sorumlusu açık görevler ya da kararlar toplu onaylanır; belirsizler tek tek gözden geçirilir.
      const m = getMeeting(id);
      let n = 0;
      for (const it of m.items) if (it.status === "taslak" && it.kind === kind && (kind === "karar" || it.assigneeState === "acik")) { it.status = "onayli"; it.decidedAt = Date.now(); n++; }
      touch(m);
      const st = changed();
      return { approved: n, state: st };
    });
    handle("task:done", (meetingId, itemId, done) => {
      const m = getMeeting(meetingId), it = getItem(m, itemId);
      it.done = !!done;
      touch(m);
      return changed();
    });

    // Yapay zekâ çıkarımı (MyMind / yerel model; her istek ayrı onaylı; adlar kodlu, iletişim ve gizli değerler gönderilmez)
    handle("ai:status", () => ({ hasKey: !!readKey(), vault: vault(), provider: data.settings.provider }));
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:extract", async (id) => {
      const m = getMeeting(id);
      const parts = C.batches(m.lines);
      const payloads = parts.map((p) => ({ lines: p, ...C.aiPayload(m, p) }));
      const sum = payloads.reduce((a, p) => ({ lines: a.lines + p.sent.lines, chars: a.chars + p.sent.chars, fields: a.fields + p.sent.fields }), { lines: 0, chars: 0, fields: 0 });
      const by = {};
      for (const p of payloads) for (const x of p.sent.byType) by[x.label] = (by[x.label] || 0) + x.count;
      const byText = Object.entries(by).map(([l, n]) => n + " " + l).join(", ");
      const prov = providerInfo();
      const ok = await approve("Toplantı MyMind ile incelensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + sum.lines + " transkript satırı, " + sum.chars + " karakter (" + parts.length + " istek)\n• Kişi adları K1, K2… kodlarıyla (" + payloads[0].codes.length + " kişi) — gerçek adlar gönderilmez" +
        (byText ? "\n• " + byText + " ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") + "\n• Toplantı tarihi\n\nDiğer toplantılarınız, başlık, onayladığınız öğeler ve pano gönderilmez. Dönen her öğe yalnız var olan satırlara ve kişilere bağlanabilir; yeni öğeler taslak olarak eklenir, onayınızı bekler.", "Gönder");
      if (!ok) return { approved: false };
      let added = 0, dropped = 0;
      const errors = [];
      for (let k = 0; k < payloads.length; k++) {
        const p = payloads[k];
        let res;
        try { res = C.validateAi(await askModel(p.messages, 2200), p, p.lines, m.date); } catch (err) { errors.push(err.message || String(err)); if (k === 0) throw err; continue; }
        data.metrics.aiRuns++;
        dropped += res.dropped.decisions + res.dropped.tasks + res.dropped.owners;
        const r = C.mergeItems(m.items, res.decisions.concat(res.tasks));
        m.items = r.items.map(C.normalizeItem);
        added += r.added;
      }
      m.aiRuns++;
      data.metrics.aiItems += added;
      data.metrics.aiDropped += dropped;
      touch(m);
      const st = changed();
      return { approved: true, added, dropped, errors, state: st };
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
