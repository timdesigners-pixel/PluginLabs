/* Meeting Trace — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: kullanıcının yüklediği / yapıştırdığı transkript (katılımcı bilgilendirme beyanıyla) → zaman damgalı satırlar →
 * kurala dayalı karar / görev / açık soru taslakları → kullanıcı onayı → toplantı notu (Markdown/TXT), görev listesi (CSV/ICS).
 * Ses kaydı yapılmaz; mikrofona ve ekrana erişim yoktur (izin istekleri reddedilir). İsteğe bağlı MyMind / yerel model çıkarımı
 * her istekte onaylıdır; konuşmacı adları S1… takma adlarıyla, hassas değerler ⟦n⟧ yer tutucusuyla gider. */
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
const MAX_FILE = 2 * 1024 * 1024;

let win = null;
let memoryKey = null;
// Notion doğrulama ölçütü: elle etiketli örnekte kural çıkarımının kesinliği (uygulama açılışında bir kez hesaplanır).
const BENCH = (() => { try { const m = C.buildMeeting(C.parseTranscript(SAMPLE.text), { date: SAMPLE.date }); const e = C.evaluate(m.items, SAMPLE.gold); return { precision: e.precision, recall: e.recall, tp: e.tp, predicted: e.predicted, gold: e.gold }; } catch { return null; } })();
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
  return { id: m.id, title: m.title, date: m.date, updatedAt: m.updatedAt, createdAt: m.createdAt, archived: m.archived, sample: m.sample, format: m.source.format, sourceName: m.source.name, stats: C.meetingStats(m), people: m.speakers.map((s) => s.name || s.label).filter(Boolean).slice(0, 8) };
}
/** Görevler görünümü için tüm toplantılardaki (arşivsiz) karar ve görevler. */
function allItems() {
  const out = [];
  for (const m of data.meetings) {
    if (m.archived) continue;
    for (const it of m.items) {
      if (it.status === "red") continue;
      out.push({ ...it, meetingId: m.id, meetingTitle: m.title, meetingDate: m.date, ownerLabel: it.kind === "gorev" ? C.ownerText(m, it) : "", time: C.itemTime(m, it) });
    }
  }
  return out;
}
function view() {
  const meeting = data.meetings.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings,
    meetings: data.meetings.map(summary).sort((a, b) => (b.date === a.date ? b.updatedAt - a.updatedAt : b.date < a.date ? -1 : 1)),
    meeting, items: allItems(), stats: C.stats(data.meetings, data.metrics),
    vault: vault(), hasKey: !!readKey(), platform: process.platform, today: C.todayIso(), bench: BENCH,
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
    width: 1360, height: 860, minWidth: 1080, minHeight: 660, useContentSize: true, autoHideMenuBar: true,
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
  if (fs.statSync(file).size > MAX_FILE) throw new Error("Dosya 2 MB'tan büyük.");
  return decode(fs.readFileSync(file));
}
const safeName = (t, fb) => (t || fb).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || fb;

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
    const msg = err && err.message ? err.message : String(err);
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + "). LM Studio / Ollama sunucusunu başlatın.");
    throw new Error(msg);
  }
}

function newMeeting(text, o) {
  o = o || {};
  if (!o.consent) throw new Error("Devam etmek için katılımcıların kayıt / transkript hakkında bilgilendirildiğini onaylayın.");
  const t = C.str(text, C.MAX_CHARS);
  if (!t.trim()) throw new Error("Önce bir transkript yapıştırın ya da dosya açın.");
  const parsed = C.parseTranscript(t);
  if (!parsed.lines.length) throw new Error("Transkriptte okunabilir satır bulunamadı.");
  const participants = C.str(o.participants, 600).split(/[,;\n]/).map((x) => x.trim()).filter((x) => x.length >= 2).slice(0, 40);
  const m = C.buildMeeting(parsed, { title: C.str(o.title, 120).trim() || (o.sourceName ? o.sourceName.replace(/\.[a-z0-9]+$/i, "") : "Toplantı"), date: o.date, sample: !!o.sample, sourceName: C.str(o.sourceName, 120), consent: { informed: true, at: Date.now() } });
  if (participants.length) { m.participants = participants; m.items = C.extract(m); }
  data.meetings.unshift(m);
  // En eski arşivli (yoksa en eski) toplantı sınırı aşınca çıkarılır.
  while (data.meetings.length > C.MAX_MEETINGS) { const i = data.meetings.map((x) => x.archived).lastIndexOf(true); data.meetings.splice(i >= 0 ? i : data.meetings.length - 1, 1); }
  data.active = m.id;
  data.metrics.imports++;
  return m;
}
/** Kurallar yeniden çalışır: karar verilmiş, düzenlenmiş, elle ya da MyMind öğeleri korunur; yalnız dokunulmamış kural taslakları yenilenir. */
function reextract(m) {
  const keep = m.items.filter((x) => x.origin !== "kural" || x.status !== "taslak" || x.edited);
  const fresh = C.extract(m).filter((x) => !C.isDuplicate(x, keep));
  m.items = keep.concat(fresh).slice(0, C.MAX_ITEMS);
  return fresh.length;
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Mikrofon, kamera, ekran, bildirim… hiçbir izin verilmez: uygulama kayıt yapmaz.
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

    // Transkript kaynakları: yalnız kullanıcının yapıştırdığı/seçtiği
    handle("text:sample", () => ({ text: SAMPLE.text, title: SAMPLE.title, date: SAMPLE.date, name: SAMPLE.fileName }));
    handle("text:openFile", async () => {
      const file = await pickFile("Transkript dosyası seçin (.vtt, .srt, .txt, .md)", ["vtt", "srt", "txt", "md", "markdown"]);
      if (!file) return { cancelled: true };
      const text = readTextFile(file);
      return { text: text.slice(0, C.MAX_CHARS), truncated: text.length > C.MAX_CHARS, name: path.basename(file) };
    });

    // Toplantılar
    handle("meeting:create", (text, o) => { const m = newMeeting(text, o); return { id: m.id, items: m.items.length, lines: m.lines.length, format: m.source.format, state: changed() }; });
    handle("meeting:open", (id) => { if (id) getMeeting(id); data.active = id || null; return changed(); });
    handle("meeting:update", (id, patch) => {
      const m = getMeeting(id);
      patch = patch || {};
      if ("title" in patch) m.title = C.str(patch.title, 120).trim() || m.title;
      if ("date" in patch && /^\d{4}-\d{2}-\d{2}$/.test(String(patch.date))) {
        m.date = C.normalizeMeeting({ ...m, date: patch.date }).date;
        // Göreli son tarihler (yarın, cuma…) yeni tarihe göre yeniden çözülür; elle girilen tarihlere dokunulmaz.
        for (const it of m.items) if (it.kind === "gorev" && it.dueText && !it.edited) { const d = C.parseDue(it.dueText, m.date); it.due = d ? d.date : ""; }
      }
      touch(m);
      return changed();
    });
    handle("meeting:archive", (id) => { const m = getMeeting(id); m.archived = true; if (data.active === id) data.active = null; touch(m); return changed(); });
    handle("meeting:restore", (id) => { const m = getMeeting(id); m.archived = false; touch(m); return changed(); });
    handle("meeting:reextract", (id) => { const m = getMeeting(id); const n = reextract(m); touch(m); const st = changed(); return { added: n, state: st }; });
    handle("meeting:export", async (id, format) => {
      const m = getMeeting(id);
      const x = C.exportMeeting(m, format);
      const file = await pickSave(safeName(m.title, "toplanti") + (format === "csv" ? "-ogeler" : format === "ics" ? "-gorevler" : "") + "." + x.ext, x.ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, x.body, "utf8");
      data.metrics.exports++;
      save();
      return { file: path.basename(file), bytes: Buffer.byteLength(x.body), approved: m.items.filter((i) => i.status === "onayli").length };
    });
    handle("meeting:copy", (id) => {
      const m = getMeeting(id);
      const x = C.exportMeeting(m, "md");
      clipboard.writeText(x.body);
      data.metrics.copies++;
      save();
      return { copied: x.body.length };
    });
    handle("meeting:backup", async () => {
      const file = await pickSave("meeting-trace-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "meeting-trace", version: 1, exportedAt: new Date().toISOString(), meetings: data.meetings }, null, 2), "utf8");
      return { file: path.basename(file), count: data.meetings.length };
    });

    // Konuşmacılar ve satırlar
    handle("speaker:rename", (id, key, name) => {
      const m = getMeeting(id);
      const s = m.speakers.find((x) => x.key === key);
      if (!s) throw new Error("Konuşmacı bulunamadı.");
      s.name = C.str(name, 60).trim();
      touch(m);
      return changed();
    });
    handle("speaker:merge", (id, from, to) => {
      const m = getMeeting(id);
      if (from === to || !m.speakers.some((x) => x.key === from) || !m.speakers.some((x) => x.key === to)) throw new Error("Birleştirilecek konuşmacıları seçin.");
      for (const l of m.lines) if (l.speaker === from) l.speaker = to;
      for (const it of m.items) if (it.owner === from) it.owner = to;
      m.speakers = m.speakers.filter((x) => x.key !== from);
      touch(m);
      return changed();
    });
    handle("line:setSpeaker", (id, lineId, key) => {
      const m = getMeeting(id);
      const l = m.lines.find((x) => x.id === lineId);
      if (!l) throw new Error("Satır bulunamadı.");
      if (key && !m.speakers.some((x) => x.key === key)) throw new Error("Konuşmacı bulunamadı.");
      l.speaker = key || "";
      l.guess = false;
      l.guessWhy = "";
      // Bu satırdan çıkarılan ve konuşmacıya bağlı görevlerin tahmin etiketi kalkar.
      for (const it of m.items) if (it.lineIds[0] === lineId && it.kind === "gorev" && it.ownerState === "tahmin" && !it.edited && it.why.startsWith("Konuşmacı tahmini")) { it.owner = l.speaker; it.ownerState = l.speaker ? "acik" : "belirsiz"; it.why = "Konuşmacı doğrulandı"; }
      touch(m);
      return changed();
    });

    // Öğeler (karar / görev / açık soru): her biri kullanıcı onayından geçer
    handle("item:update", (id, itemId, patch) => {
      const m = getMeeting(id), it = getItem(m, itemId);
      patch = patch || {};
      if ("text" in patch) { const t = C.str(patch.text, 280).trim(); if (t.length < 3) throw new Error("Metin en az 3 karakter olmalı."); if (t !== it.text) { it.text = t; data.metrics.textEdits++; } }
      if ("kind" in patch && C.KINDS.includes(patch.kind)) { it.kind = patch.kind; if (it.kind === "gorev" && !it.ownerState) it.ownerState = "belirsiz"; if (it.kind !== "gorev") { it.owner = ""; it.ownerName = ""; it.ownerState = ""; it.due = ""; } }
      if ("owner" in patch) {
        const v = String(patch.owner || "");
        if (v === "@ekip") { it.owner = ""; it.ownerName = ""; it.ownerState = "ekip"; }
        else if (v === "@belirsiz" || !v) { it.owner = ""; it.ownerName = ""; it.ownerState = "belirsiz"; }
        else if (v.startsWith("@ad:")) { it.owner = ""; it.ownerName = C.str(v.slice(4), 60).trim(); it.ownerState = it.ownerName ? "acik" : "belirsiz"; }
        else { if (!m.speakers.some((x) => x.key === v)) throw new Error("Konuşmacı bulunamadı."); it.owner = v; it.ownerName = ""; it.ownerState = "acik"; }
        it.why = "Kullanıcı atadı";
        data.metrics.ownerFixes++;
      }
      if ("due" in patch) { it.due = /^\d{4}-\d{2}-\d{2}$/.test(String(patch.due)) ? patch.due : ""; it.dueText = ""; }
      it.edited = true;
      touch(m);
      return changed();
    });
    handle("item:decide", (id, itemId, status) => {
      const m = getMeeting(id), it = getItem(m, itemId);
      if (!C.STATUS.includes(status)) throw new Error("Geçersiz durum.");
      it.status = it.status === status ? "taslak" : status;
      it.decidedAt = Date.now();
      touch(m);
      return changed();
    });
    handle("item:add", (id, o) => {
      const m = getMeeting(id);
      o = o || {};
      const l = m.lines.find((x) => x.id === o.lineId);
      if (!l) throw new Error("Önce transkriptte bir satır seçin.");
      if (m.items.length >= C.MAX_ITEMS) throw new Error("Bir toplantıda en çok " + C.MAX_ITEMS + " öğe olabilir.");
      const kind = C.KINDS.includes(o.kind) ? o.kind : "gorev";
      const it = C.normalizeItem({ kind, text: C.str(o.text, 280).trim() || l.text.slice(0, 280), lineIds: [l.id], origin: "elle", status: "taslak", owner: kind === "gorev" && l.speaker && !l.guess ? l.speaker : "", ownerState: kind === "gorev" ? (l.speaker && !l.guess ? "acik" : "belirsiz") : "", why: "Elle eklendi", edited: true });
      if (kind === "gorev") { const d = C.parseDue(l.text, m.date); if (d) { it.due = d.date; it.dueText = d.text; } }
      m.items.push(it);
      touch(m);
      const st = changed();
      return { id: it.id, state: st };
    });

    // Zaman damgalı notlar
    handle("note:add", (id, lineId, text) => {
      const m = getMeeting(id);
      const l = m.lines.find((x) => x.id === lineId);
      const t = C.str(text, 500).trim();
      if (!t) throw new Error("Not boş olamaz.");
      if (m.notes.length >= 300) throw new Error("Bir toplantıda en çok 300 not olabilir.");
      m.notes.push({ id: C.uid(), lineId: l ? l.id : "", t: l ? l.t : null, text: t, at: Date.now() });
      touch(m);
      return changed();
    });
    handle("note:remove", (id, noteId) => { const m = getMeeting(id); m.notes = m.notes.filter((n) => n.id !== noteId); touch(m); return changed(); });

    // Yapay zekâ çıkarımı (MyMind / yerel model; her istek ayrı onaylı; adlar ve hassas değerler gönderilmez)
    handle("ai:status", () => ({ hasKey: !!readKey(), vault: vault(), provider: data.settings.provider }));
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:extract", async (id) => {
      const m = getMeeting(id);
      const parts = C.batches(m);
      const payloads = parts.map((ids) => C.aiPayload(m, ids));
      const sum = payloads.reduce((a, p) => ({ lines: a.lines + p.sent.lines, chars: a.chars + p.sent.chars, masked: a.masked + p.sent.masked }), { lines: 0, chars: 0, masked: 0 });
      const types = [...new Set(payloads.flatMap((p) => p.sent.maskedTypes))];
      const prov = providerInfo();
      const ok = await approve("Toplantı MyMind ile çözümlensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + sum.lines + " transkript satırı, " + sum.chars + " karakter (" + parts.length + " istek)\n• Konuşmacı adları S1, S2… takma adlarıyla — adlar gönderilmez" +
        (sum.masked ? "\n• " + sum.masked + " hassas değer (" + types.join(", ") + ") ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") +
        "\n\nToplantı başlığı, tarihi, notlarınız ve diğer toplantılar gönderilmez. Dönen her öneri var olan satırlara dayanmak zorundadır; öneriler taslak olarak eklenir ve sizin onayınızı bekler.", "Gönder");
      if (!ok) return { approved: false };
      let added = 0, dup = 0, dropped = 0, guesses = 0;
      const errors = [];
      for (let k = 0; k < payloads.length; k++) {
        const p = payloads[k];
        let res;
        try { res = C.validateAi(await askModel(p.messages, 2500), p, m); } catch (err) { errors.push(err.message || String(err)); if (k === 0) throw err; continue; }
        data.metrics.aiRuns++;
        dropped += res.dropped;
        for (const it of res.items) {
          if (C.isDuplicate(it, m.items) || m.items.length >= C.MAX_ITEMS) { dup++; continue; }
          m.items.push(it);
          added++;
        }
        if (data.settings.autoGuess) {
          for (const g of res.guesses) {
            const l = m.lines.find((x) => x.id === g.lineId);
            // Yalnız konuşmacısı olmayan ya da zaten tahmin olan satırlar; kullanıcının doğruladığı satıra dokunulmaz.
            if (!l || (l.speaker && !l.guess)) continue;
            l.speaker = g.speaker; l.guess = true; l.guessWhy = "MyMind tahmini" + (g.why ? ": " + g.why : "");
            guesses++;
          }
        }
      }
      data.metrics.aiItems += added; data.metrics.aiDropped += dropped; data.metrics.aiGuesses += guesses;
      touch(m);
      const st = changed();
      return { approved: true, added, dup, dropped, guesses, errors, state: st };
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
