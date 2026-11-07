/* Meeting Trace — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: kullanıcının yüklediği / yapıştırdığı transkript (.txt, .vtt, .srt, .md) → bilgilendirme onayı → zaman damgalı satırlar →
 * kural tabanlı karar/görev adayları (kanıt satırıyla) → insan onayı. Gizli ya da sürekli kayıt YOK: uygulama mikrofon / ekran
 * yakalamaz (Chromium izin istekleri reddedilir). İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model ile çıkarım her istekte
 * onaylıdır; adlar takma adla, hassas değerler yer tutucuyla gider. */
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
let sampleEval = null;
function evalSample() {
  if (sampleEval) return sampleEval;
  const p = C.parseTranscript(SAMPLE.text);
  const m = C.normalizeMeeting({ date: SAMPLE.date, utterances: p.utterances, speakers: p.speakers });
  const items = C.extract(m);
  sampleEval = { gorev: C.evaluate(items, SAMPLE.labels, m, "gorev"), karar: C.evaluate(items, SAMPLE.labels, m, "karar") };
  return sampleEval;
}
function summary(m) {
  return { id: m.id, title: m.title, date: m.date, updatedAt: m.updatedAt, archived: m.archived, sample: m.sample, source: m.source, stats: C.meetingStats(m), speakers: m.speakers.map((s) => s.label) };
}
function allTasks() {
  const out = [];
  for (const m of data.meetings) for (const it of m.items) if (it.kind === "gorev" && it.status === "onayli") out.push({ meetingId: m.id, meetingTitle: m.title, meetingDate: m.date, archived: m.archived, id: it.id, text: it.text, owner: C.ownerLabel(m, it), ownerState: it.owner ? it.owner.state : "belirsiz", due: it.due, dueText: it.dueText, t: it.t, done: it.done });
  return out;
}
function view() {
  const meeting = data.meetings.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings, meetings: data.meetings.map(summary).sort((a, b) => b.updatedAt - a.updatedAt), meeting, tasks: allTasks(),
    stats: C.stats(data.meetings, data.metrics), sampleEval: evalSample(), vault: vault(), hasKey: !!readKey(), platform: process.platform,
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
  if (!it) throw new Error("Madde bulunamadı.");
  return it;
}
const touch = (m) => { m.updatedAt = Date.now(); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1060, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
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
function showWin() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
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

const CONSENT_TEXT = {
  "bilgilendirildi": "Katılımcılar kayıt/transkript ve not çıkarımı hakkında bilgilendirildi ve izin verdi.",
  "kendi-notum": "Transkript kullanıcının kendi notu; başka katılımcının ses kaydı yok.",
};
function newMeeting(text, o) {
  o = o || {};
  const t = C.str(text, C.MAX_CHARS);
  if (!t.trim()) throw new Error("Önce bir transkript yapıştırın ya da dosya açın.");
  if (!CONSENT_TEXT[o.consent]) throw new Error("Devam etmeden önce bilgilendirme / izin seçeneğini işaretleyin.");
  const p = C.parseTranscript(t);
  if (!p.utterances.length) throw new Error("Transkriptte konuşma satırı bulunamadı.");
  const m = C.normalizeMeeting({
    id: C.uid(), title: C.str(o.title, 120).trim() || (o.sourceName ? o.sourceName.replace(/\.[^.]+$/, "") : "Toplantı"), date: o.date,
    source: { name: C.str(o.sourceName, 120), format: p.format }, consent: { kind: o.consent, text: CONSENT_TEXT[o.consent], at: Date.now() },
    speakers: p.speakers, utterances: p.utterances, sample: !!o.sample,
  });
  m.items = C.mergeExtraction([], C.extract(m)).items;
  data.meetings.unshift(m);
  // En eski arşivli (yoksa en eski) toplantı sınırı aşınca çıkarılır.
  while (data.meetings.length > C.MAX_MEETINGS) { const i = data.meetings.map((x) => x.archived).lastIndexOf(true); data.meetings.splice(i >= 0 ? i : data.meetings.length - 1, 1); }
  data.active = m.id;
  data.metrics.imports++;
  return { meeting: m, parsed: { format: p.format, utterances: p.utterances.length, speakers: p.speakers.length, timed: p.timed, guessed: p.guessed, unknown: p.unknown } };
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => showWin());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Mikrofon, kamera, ekran yakalama ve diğer tüm izin istekleri reddedilir (gizli kayıt yok).
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
    handle("import:sample", () => ({ text: SAMPLE.text, title: SAMPLE.title, date: SAMPLE.date, name: SAMPLE.fileName }));
    handle("import:openFile", async () => {
      const file = await pickFile("Transkript dosyası seçin", ["txt", "vtt", "srt", "md"]);
      if (!file) return { cancelled: true };
      const text = readTextFile(file);
      return { text: text.slice(0, C.MAX_CHARS), truncated: text.length > C.MAX_CHARS, name: path.basename(file), format: C.detectFormat(text) };
    });

    // Toplantılar
    handle("meeting:create", (text, o) => { const r = newMeeting(text, o); const st = changed(); return { parsed: r.parsed, items: r.meeting.items.length, state: st }; });
    handle("meeting:open", (id) => { if (id) getMeeting(id); data.active = id || null; return changed(); });
    handle("meeting:update", (id, patch) => {
      const m = getMeeting(id);
      patch = patch || {};
      if ("title" in patch) m.title = C.str(patch.title, 120).trim() || m.title;
      if ("date" in patch && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) m.date = patch.date;
      touch(m);
      return changed();
    });
    handle("meeting:archive", (id) => { const m = getMeeting(id); m.archived = true; if (data.active === id) data.active = null; touch(m); return changed(); });
    handle("meeting:restore", (id) => { const m = getMeeting(id); m.archived = false; touch(m); return changed(); });
    handle("meeting:reextract", (id) => {
      const m = getMeeting(id);
      const r = C.mergeExtraction(m.items, C.extract(m));
      m.items = r.items;
      touch(m);
      const st = changed();
      return { added: r.added, state: st };
    });
    handle("meeting:export", async (id, format) => {
      const m = getMeeting(id);
      const x = C.exportMeeting(m, format, { pending: data.settings.exportPending, minutes: data.settings.minutes });
      const safeName = (m.title || "toplanti").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || "toplanti";
      const file = await pickSave(safeName + "." + x.ext, x.ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, x.body, "utf8");
      data.metrics.exports++;
      save();
      return { file: path.basename(file), bytes: Buffer.byteLength(x.body) };
    });
    handle("meeting:copy", (id) => {
      const m = getMeeting(id);
      const t = C.exportMeeting(m, "md", { pending: data.settings.exportPending, minutes: data.settings.minutes }).body;
      clipboard.writeText(t);
      data.metrics.copies++;
      save();
      return { copied: t.length };
    });
    handle("meeting:backup", async () => {
      const file = await pickSave("meeting-trace-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "meeting-trace", version: 1, exportedAt: new Date().toISOString(), meetings: data.meetings }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Konuşmacılar (ayrım düzeltmesi)
    handle("speaker:rename", (id, key, label) => {
      const m = getMeeting(id);
      const s = m.speakers.find((x) => x.key === key);
      if (!s) throw new Error("Konuşmacı bulunamadı.");
      const l = C.squash(C.str(label, 60));
      if (l.length < 2) throw new Error("Ad en az 2 karakter olmalı.");
      s.label = l;
      touch(m);
      return changed();
    });
    handle("speaker:merge", (id, from, into) => {
      const m = getMeeting(id);
      if (from === into || !m.speakers.some((x) => x.key === from) || !m.speakers.some((x) => x.key === into)) throw new Error("Birleştirilecek konuşmacılar geçersiz.");
      for (const u of m.utterances) if (u.speaker === from) u.speaker = into;
      for (const it of m.items) if (it.owner && it.owner.key === from) it.owner.key = into;
      m.speakers = m.speakers.filter((x) => x.key !== from);
      touch(m);
      return changed();
    });
    handle("utterance:setSpeaker", (id, uid, key) => {
      const m = getMeeting(id);
      const u = m.utterances.find((x) => x.id === uid);
      if (!u) throw new Error("Satır bulunamadı.");
      if (key !== C.UNKNOWN && !m.speakers.some((x) => x.key === key)) throw new Error("Konuşmacı bulunamadı.");
      u.speaker = key;
      u.guess = false; // kullanıcı onayladı ya da değiştirdi: artık tahmin değil
      // Bu satırdan çıkarılan ve sahibi “konuşan” olan tahmin maddeleri kesinleşir.
      for (const it of m.items) if (it.refs[0] === uid && it.owner && it.owner.note === "Konuşmacı tahmin") { it.owner = { key, name: "", state: key === C.UNKNOWN ? "belirsiz" : "kesin", note: "" }; }
      touch(m);
      return changed();
    });

    // Maddeler (insan onayı)
    handle("item:set", (id, itemId, patch) => {
      const m = getMeeting(id), it = getItem(m, itemId);
      patch = patch || {};
      if ("status" in patch && C.STATUS.includes(patch.status) && patch.status !== it.status) {
        const prev = it.status;
        it.status = patch.status;
        it.decidedAt = Date.now();
        const k = it.origin === "ai" ? "ai" : it.origin === "kural" ? "rule" : null;
        if (k) {
          if (prev === "onayli") data.metrics[k + "Approved"] = Math.max(0, data.metrics[k + "Approved"] - 1);
          if (prev === "reddedildi") data.metrics[k + "Rejected"] = Math.max(0, data.metrics[k + "Rejected"] - 1);
          if (it.status === "onayli") data.metrics[k + "Approved"]++;
          if (it.status === "reddedildi") data.metrics[k + "Rejected"]++;
        }
      }
      if ("text" in patch) { const t = C.squash(C.str(patch.text, 300)); if (t.length < 3) throw new Error("Madde metni çok kısa."); if (t !== it.text) { it.text = t; it.edited = true; data.metrics.textEdits++; } }
      if ("owner" in patch) {
        const o = patch.owner || {};
        if (o.key && o.key !== C.UNKNOWN && !m.speakers.some((x) => x.key === o.key)) throw new Error("Konuşmacı bulunamadı.");
        it.owner = o.key ? { key: o.key, name: "", state: "kesin", note: "Kullanıcı atadı" } : o.name ? { key: null, name: C.squash(C.str(o.name, 60)), state: "kesin", note: "Kullanıcı atadı" } : { key: null, name: "", state: "belirsiz", note: "Kullanıcı belirsiz bıraktı" };
        data.metrics.ownerEdits++;
      }
      if ("due" in patch) { it.due = /^\d{4}-\d{2}-\d{2}$/.test(patch.due || "") ? patch.due : ""; if (!it.due) it.dueText = ""; }
      if ("done" in patch) it.done = !!patch.done;
      touch(m);
      return changed();
    });
    handle("item:add", (id, x) => {
      const m = getMeeting(id);
      x = x || {};
      const text = C.squash(C.str(x.text, 300));
      if (text.length < 3) throw new Error("Madde metni çok kısa.");
      const u = m.utterances.find((y) => y.id === x.ref);
      const due = x.kind === "gorev" ? C.parseDue(text, m.date) : { text: "", date: "" };
      const owner = x.ownerKey && m.speakers.some((s) => s.key === x.ownerKey) ? { key: x.ownerKey, name: "", state: "kesin", note: "Kullanıcı atadı" } : { key: null, name: "", state: "belirsiz", note: "" };
      m.items.push(C.normalizeItem({ id: C.uid(), kind: x.kind === "karar" ? "karar" : "gorev", text, refs: u ? [u.id] : [], t: u ? u.t : null, owner: x.kind === "karar" ? null : owner, due: due.date, dueText: due.text, origin: "elle", status: "onayli", rule: "elle" }));
      data.metrics.manual++;
      touch(m);
      return changed();
    });

    // Yapay zekâ çıkarımı (MyMind / yerel model; her istek onaylı; adlar takma ad, hassas değerler gizli; maddeler onay bekler)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:extract", async (id) => {
      const m = getMeeting(id);
      const p = C.aiPayload(m);
      if (!p.requests.length) throw new Error("Gönderilecek satır yok.");
      const prov = providerInfo();
      const sens = p.sent.sensitive.map((x) => x.count + " " + x.label).join(", ");
      const ok = await approve("Karar ve görev çıkarımı için gönderilsin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.utterances + " transkript satırı, " + p.sent.chars + " karakter (" + p.sent.requests + " istek)\n• Konuşmacı adları K1, K2… takma adıyla (" + m.speakers.length + " konuşmacı; metin içinde " + p.sent.names + " ad geçişi değiştirildi)" +
        (sens ? "\n• Hassas değerler (" + sens + ") gönderilmez, yer tutucuyla gider" : "") +
        "\n\nToplantı başlığı, dosya adı, diğer toplantılar ve onay verdiğiniz maddeler gönderilmez. Dönen her madde var olan bir satıra dayanmak zorundadır; maddeler onayınızı bekler, kendiliğinden onaylanmaz.", "Gönder");
      if (!ok) return { approved: false };
      let added = 0, dropped = 0;
      const errors = [];
      const fresh = [];
      for (let k = 0; k < p.requests.length; k++) {
        const req = p.requests[k];
        let r;
        try { r = C.validateAi(await askModel(req.messages, 2500), req, p, m); } catch (err) { errors.push(err.message || String(err)); if (k === 0) throw err; continue; }
        data.metrics.aiRuns++;
        dropped += r.rejected;
        if (r.error) errors.push(r.error);
        fresh.push(...r.items);
      }
      const merged = C.mergeExtraction(m.items, fresh, { keepAll: true });
      added = merged.added;
      m.items = merged.items;
      m.aiRuns++;
      data.metrics.aiItems += added;
      data.metrics.aiDropped += dropped;
      touch(m);
      const st = changed();
      return { approved: true, added, dropped, duplicates: fresh.length - added, errors, state: st };
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
