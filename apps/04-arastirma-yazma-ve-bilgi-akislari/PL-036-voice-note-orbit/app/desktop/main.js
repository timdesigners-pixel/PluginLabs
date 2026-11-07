/* Voice Note Orbit — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: yüzen kayıt balonu (her zaman üstte, sürüklenebilir) ya da ana pencere → BASILI TUTARAK kısa ses notu (en çok 120 sn; bırakınca durur,
 * sürekli dinleme yok, kayıt süresince kırmızı gösterge ve sayaç) → 16 kHz mono WAV → isteğe bağlı yerel transkripsiyon (bu bilgisayardaki
 * OpenAI uyumlu konuşma→metin sunucusu, her istekte onaylı) ya da elle yazma → kurala dayalı görev/not + tarih–saat taslağı (belirsizse seçenek)
 * → kullanıcı kaydeder. Ses dosyası ve transkript ayrı ayrı silinebilir. Mikrofon izni yalnız bu uygulamanın kendi pencerelerine ve yalnız
 * ses için verilir (kamera, ekran ve diğer izinler reddedilir). MyMind / yerel model düzeltmesi isteğe bağlı ve onaylıdır. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, globalShortcut, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar ve dosya seçimleri dosyadan gelir, mikrofon taklit aygıttır.
if (process.env.VN_USER_DATA) app.setPath("userData", process.env.VN_USER_DATA);
const TEST = process.env.VN_TEST_DIR || "";
// Yalnız taklit aygıt; izin kararı yine aşağıdaki işleyiciden geçer (use-fake-ui-for-media-stream kullanılmaz: o, izin denetimini atlar).
if (TEST) app.commandLine.appendSwitch("use-fake-device-for-media-stream");
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_AUDIO_FILE = 25 * 1024 * 1024;
const MAX_WAV = 16000 * 2 * (C.MAX_IMPORT_SECONDS + 2) + 1024;
const SHORTCUT = "CommandOrControl+Alt+N";

let win = null, bubble = null;
let memoryKey = null;
const BENCH = (() => { try { const e = C.evaluate(SAMPLE.gold); return { accuracy: e.accuracy, ok: e.ok, total: e.total }; } catch { return null; } })();
let data = { settings: C.normalizeSettings({}), notes: [], active: null, metrics: C.normalizeMetrics({}) };
let bubbleNote = null; // balonda gösterilen son not

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "notlar.bin" : "notlar.json");
const audioDir = () => path.join(app.getPath("userData"), "ses");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma; kasa varsa notlar ve ses dosyaları şifreli) ----
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
    data.notes = C.normalizeNotes(d.notes);
    data.active = data.notes.some((x) => x.id === d.active) ? d.active : null;
    data.metrics = C.normalizeMetrics(d.metrics);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}
function writeAudio(id, wav) {
  const enc = vault();
  const file = id + (enc ? ".bin" : ".wav");
  writeAtomic(path.join(audioDir(), file), enc ? safeStorage.encryptString(Buffer.from(wav).toString("base64")) : Buffer.from(wav));
  return file;
}
function readAudio(n) {
  if (!n.audio) throw new Error("Bu notun ses dosyası yok.");
  const buf = fs.readFileSync(path.join(audioDir(), n.audio.file));
  return n.audio.file.endsWith(".bin") ? Buffer.from(safeStorage.decryptString(buf), "base64") : buf;
}
function removeAudio(n) { if (n.audio) fs.rmSync(path.join(audioDir(), n.audio.file), { force: true }); n.audio = null; }

// ---- Durum ----
function view() {
  const note = data.notes.find((x) => x.id === data.active) || null;
  return {
    settings: data.settings, notes: data.notes, note, bubbleNote: data.notes.find((x) => x.id === bubbleNote) || null,
    stats: C.stats(data.notes, data.metrics), vault: vault(), hasKey: !!readKey(), platform: process.platform,
    today: C.todayIso(), bench: BENCH, shortcut: SHORTCUT.replace("CommandOrControl", process.platform === "darwin" ? "Cmd" : "Ctrl"), bubbleShown: !!(bubble && !bubble.isDestroyed() && bubble.isVisible()),
  };
}
function push() { const v = view(); for (const w of [win, bubble]) if (w && !w.isDestroyed()) w.webContents.send("state:changed", v); }
function changed() { save(); push(); return view(); }
function getNote(id) { const n = data.notes.find((x) => x.id === id); if (!n) throw new Error("Not bulunamadı."); return n; }
const touch = (n) => { n.updatedAt = Date.now(); };
const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const testNow = () => (TEST && process.env.VN_NOW) || nowTime();
const testToday = () => (TEST && process.env.VN_TODAY) || C.todayIso();

// ---- Pencereler ----
const webPrefs = () => ({ preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, backgroundThrottling: false });
function guardNav(w) {
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({ width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true, title: "Voice Note Orbit", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false, webPreferences: webPrefs() });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  guardNav(win);
  win.on("closed", () => { win = null; if (bubble && !bubble.isDestroyed()) bubble.destroy(); app.quit(); });
}
const BUBBLE = { small: { w: 96, h: 112 }, big: { w: 360, h: 300 } };
function createBubble() {
  if (bubble && !bubble.isDestroyed()) return bubble;
  const wa = screen.getPrimaryDisplay().workArea;
  bubble = new BrowserWindow({
    width: BUBBLE.small.w, height: BUBBLE.small.h, x: wa.x + wa.width - BUBBLE.small.w - 24, y: wa.y + wa.height - BUBBLE.small.h - 24,
    frame: false, transparent: true, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true,
    alwaysOnTop: data.settings.bubbleTop, hasShadow: false, show: false, title: "Voice Note Orbit — kayıt balonu", backgroundColor: "#00000000", webPreferences: webPrefs(),
  });
  if (data.settings.bubbleTop) bubble.setAlwaysOnTop(true, "floating");
  bubble.loadFile(path.join(root, "bubble.html"));
  guardNav(bubble);
  bubble.once("ready-to-show", () => { if (data.settings.bubble) bubble.showInactive(); push(); });
  bubble.on("closed", () => { bubble = null; push(); });
  return bubble;
}
function setBubbleVisible(v) {
  if (v) { const b = createBubble(); if (b.webContents.isLoading()) return; b.showInactive(); }
  else if (bubble && !bubble.isDestroyed()) bubble.hide();
  push();
}
function resizeBubble(big) {
  if (!bubble || bubble.isDestroyed()) return;
  const [x, y] = bubble.getPosition();
  const cur = bubble.getSize();
  const t = big ? BUBBLE.big : BUBBLE.small;
  const wa = screen.getDisplayMatching(bubble.getBounds()).workArea;
  // Sağ alt köşe sabit kalır (balon ekran kenarındayken kart içeri doğru açılır).
  const nx = Math.max(wa.x, Math.min(x + cur[0] - t.w, wa.x + wa.width - t.w));
  const ny = Math.max(wa.y, Math.min(y + cur[1] - t.h, wa.y + wa.height - t.h));
  bubble.setBounds({ x: nx, y: ny, width: t.w, height: t.h });
}
function showMain(id) {
  if (id) { getNote(id); data.active = id; save(); }
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
  push();
}

async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const parent = win && win.isVisible() ? win : undefined;
  const opts = { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 0, cancelId: 1, noLink: true, title: "Onay", message, detail };
  const r = parent ? await dialog.showMessageBox(parent, opts) : await dialog.showMessageBox(opts);
  return r.response === 0;
}
async function pickFile(title, name, exts) {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title, properties: ["openFile"], filters: [{ name, extensions: exts }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
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
const hubUrl = () => (TEST && process.env.VN_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
const connErr = (msg, what) => (/ECONNREFUSED|fetch failed|ECONNRESET/i.test(msg) ? new Error(what) : new Error(msg));

// ---- Notlar ----
function insert(n) {
  data.notes.unshift(n);
  while (data.notes.length > C.MAX_NOTES) { const i = data.notes.map((x) => x.archived).lastIndexOf(true); const [gone] = data.notes.splice(i >= 0 ? i : data.notes.length - 1, 1); removeAudio(gone); }
}
function applyAnalysis(n, keepUser) {
  const a = C.analyze(n.transcript, n.day, n.createdDayTime || testNow());
  if (!keepUser || !n.titleEdited) n.title = a.title || n.title || "Ses notu";
  if (!keepUser || !n.kindEdited) { n.kind = a.kind; n.kindWhy = a.kindWhy; }
  if (!keepUser || !n.whenEdited) { n.when = C.normalizeWhen(a.when); n.autoWhen = C.normalizeWhen(a.when); }
}
/** Kayıt/dosya sesi yerel sunucuda metne çevrilir (onaylı). Sunucu yoksa ya da reddedilirse not taslak kalır; transkript elle yazılabilir. */
async function transcribeNote(n, wav) {
  const s = data.settings;
  const secs = n.audio ? n.audio.seconds : 0;
  if (s.sttAsk) {
    const ok = await approve("Ses notu metne çevrilsin mi?", "Hedef: yerel konuşma→metin sunucusu " + s.sttUrl + " (yalnız bu bilgisayar).\nGönderilecek: bu notun sesi (" + C.fmtDur(secs) + ", 16 kHz mono WAV, " + Math.round(wav.length / 1024) + " KB), dil: " + (s.sttLang === "auto" ? "otomatik" : s.sttLang) + ".\n\nDiğer notlar, başlıklar ve dosya adı gönderilmez. Reddederseniz not taslak kalır; metni kendiniz yazabilirsiniz.", "Metne çevir");
    n.clicks = Math.min(99, n.clicks + 1);
    if (!ok) return { approved: false };
  }
  data.metrics.sttRuns++;
  let text;
  try { text = await net.transcribe({ base: (TEST && process.env.VN_STT_URL) || s.sttUrl, model: s.sttModel, language: s.sttLang, wav }); }
  catch (err) { data.metrics.sttFails++; throw connErr(err.message || String(err), "Yerel konuşma→metin sunucusuna bağlanılamadı (" + s.sttUrl + "). whisper.cpp server / faster-whisper-server'ı başlatın ya da Ayarlar'dan adresi düzeltin. Metni elle de yazabilirsiniz."); }
  if (TEST) testLog("stt-sent.txt", JSON.stringify({ bytes: wav.length, model: s.sttModel, lang: s.sttLang }));
  n.transcript = C.str(text, C.MAX_TRANSCRIPT);
  n.transcriptBy = "yerel-whisper";
  data.metrics.transcribed++;
  applyAnalysis(n, false);
  return { approved: true, chars: n.transcript.length };
}
function setWhen(n, date, time) {
  const w = n.when || { date: "", time: "", text: "", dateOptions: [], timeOptions: [], why: "" };
  n.when = C.normalizeWhen({ ...w, date: date || "", time: time || "", ambiguous: false, chosen: true }) || null;
  n.whenEdited = true;
}
/** Notion ölçütü için: kaydedilen görevin son tarihi, otomatik çıkarılanla karşılaştırılır (belirsiz işaretlenip doğru aday seçildiyse doğru). */
function dateVerdict(n) {
  if (n.kind !== "gorev") return "";
  const a = n.autoWhen, f = n.when;
  const fd = f && f.date ? f.date : "", ft = f && f.time ? f.time : "";
  if (!a) return fd ? "yanlis" : "";
  if (a.ambiguous) return C.whenChoices(a).some((c) => (!c.date || c.date === fd) && (!c.time || c.time === ft)) || (a.date && a.date === fd) ? "dogru" : "yanlis";
  return a.date === fd && (!a.time || a.time === ft) ? "dogru" : "yanlis";
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => showMain());
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Yalnız kendi pencerelerimiz ve yalnız mikrofon (ses). Kamera, ekran paylaşımı, bildirim, konum… reddedilir.
    const own = (wc) => !!wc && ((win && !win.isDestroyed() && wc === win.webContents) || (bubble && !bubble.isDestroyed() && wc === bubble.webContents));
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(perm === "media" && own(wc) && Array.isArray(details.mediaTypes) && details.mediaTypes.length > 0 && details.mediaTypes.every((t) => t === "audio")));
    session.defaultSession.setPermissionCheckHandler((wc, perm, _o, details) => perm === "media" && own(wc) && (!details || !details.mediaType || details.mediaType === "audio"));
    session.defaultSession.setDisplayMediaRequestHandler((_r, cb) => cb({}));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.voice-note-orbit");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      for (const k of ["sttUrl", "localUrl"]) if (k in patch && !C.isLoopbackUrl(String(patch[k]).trim())) throw new Error("Sunucu adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if ("bubbleTop" in patch && bubble && !bubble.isDestroyed()) bubble.setAlwaysOnTop(data.settings.bubbleTop, "floating");
      if ("bubble" in patch) setBubbleVisible(data.settings.bubble);
      return changed();
    });

    // Ses notu: kayıt (balon ya da ana pencere) veya ses dosyası. Arayüz sesi 16 kHz mono WAV olarak verir; başlık ve süre burada doğrulanır.
    handle("note:fromAudio", async (bytes, o) => {
      o = o || {};
      const wav = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []));
      if (wav.length > MAX_WAV) throw new Error("Ses çok uzun.");
      const info = C.wavInfo(wav);
      if (!info.ok) throw new Error("Ses verisi geçersiz (16 bit PCM WAV bekleniyordu).");
      const source = o.source === "dosya" ? "dosya" : "kayit";
      const limit = source === "kayit" ? data.settings.maxSeconds + 1.5 : C.MAX_IMPORT_SECONDS + 1;
      if (info.seconds > limit) throw new Error("Ses " + Math.round(limit) + " saniyeden uzun olamaz.");
      if (info.seconds < 0.3) throw new Error("Kayıt çok kısa — basılı tutarak konuşun.");
      const n = C.normalizeNote({ source, sourceName: source === "dosya" ? C.str(o.sourceName, 120) : "", day: testToday(), clicks: Math.max(0, Math.min(5, Number(o.clicks) || 0)), recSeconds: info.seconds, title: source === "dosya" ? C.str(o.sourceName, 120).replace(/\.[a-z0-9]+$/i, "") : "Ses notu " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) });
      n.createdDayTime = testNow();
      const file = writeAudio(n.id, wav);
      n.audio = { file, seconds: Math.round(info.seconds * 10) / 10, bytes: wav.length };
      insert(n);
      data.metrics[source === "kayit" ? "recordings" : "imports"]++;
      if (o.from === "bubble") bubbleNote = n.id; else data.active = n.id;
      changed();
      let stt = { approved: false, skipped: true }, error = null;
      if (o.transcribe !== false) {
        try { stt = await transcribeNote(n, wav); } catch (err) { error = err.message || String(err); }
        if (!data.settings.keepAudio && n.transcript) removeAudio(n);
        touch(n);
      }
      const st = changed();
      return { id: n.id, seconds: n.audio ? n.audio.seconds : info.seconds, stt, error, state: st };
    });
    handle("note:transcribe", async (id) => {
      const n = getNote(id);
      const wav = readAudio(n);
      const r = await transcribeNote(n, wav);
      touch(n);
      return { ...r, state: changed() };
    });
    handle("note:typed", (text, o) => {
      const t = C.cleanText(text);
      if (t.length < 2) throw new Error("Önce notu yazın.");
      const n = C.normalizeNote({ source: "yazili", day: testToday(), transcript: t, transcriptBy: "elle", clicks: Math.max(0, Math.min(5, Number(o && o.clicks) || 0)) });
      n.createdDayTime = testNow();
      applyAnalysis(n, false);
      insert(n);
      data.metrics.typed++;
      data.active = n.id;
      return { id: n.id, state: changed() };
    });
    handle("audio:openFile", async () => {
      const file = await pickFile("Ses dosyası seçin", "Ses", ["wav", "mp3", "m4a", "ogg", "oga", "opus", "webm", "flac", "aac"]);
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > MAX_AUDIO_FILE) throw new Error("Ses dosyası 25 MB'tan büyük.");
      return { bytes: new Uint8Array(fs.readFileSync(file)), name: path.basename(file) };
    });
    handle("audio:get", (id) => new Uint8Array(readAudio(getNote(id))));
    handle("text:sample", () => SAMPLE.notes.map((x) => x.text));

    handle("note:open", (id) => { if (id) getNote(id); data.active = id || null; return changed(); });
    handle("note:update", (id, patch) => {
      const n = getNote(id);
      patch = patch || {};
      if ("transcript" in patch) {
        const t = C.cleanText(patch.transcript);
        if (t !== n.transcript) { n.transcript = t; n.transcriptBy = n.transcriptBy === "yerel-whisper" || n.transcriptBy === "mymind-duzeltme" ? n.transcriptBy : "elle"; n.transcriptEdited = true; if (patch.reanalyze !== false) applyAnalysis(n, true); }
      }
      if ("title" in patch) { const t = C.str(patch.title, 120).trim(); if (t) { n.title = t; n.titleEdited = true; } }
      if ("kind" in patch && C.KINDS.includes(patch.kind)) { n.kind = patch.kind; n.kindWhy = "Kullanıcı seçti"; n.kindEdited = true; }
      if ("when" in patch) {
        const w = patch.when || {};
        if (w.clear) { n.when = null; n.whenEdited = true; }
        else {
          if (w.date && !C.dateOf(w.date)) throw new Error("Tarih geçersiz.");
          if (w.time && !C.validTime(w.time)) throw new Error("Saat geçersiz.");
          setWhen(n, w.date, w.time);
        }
      }
      if ("tags" in patch) n.tags = C.normalizeNote({ tags: String(patch.tags || "").split(",") }).tags;
      touch(n);
      return changed();
    });
    handle("note:reanalyze", (id) => { const n = getNote(id); n.titleEdited = n.kindEdited = n.whenEdited = false; applyAnalysis(n, false); touch(n); return changed(); });
    /** Kaydet: görev/not olarak kalıcı listeye geçer. Belirsiz tarih seçilmeden kaydedilemez (choice verilirse o seçilir). */
    handle("note:save", (id, o) => {
      const n = getNote(id);
      o = o || {};
      if (o.choice) { if ((o.choice.date && !C.dateOf(o.choice.date)) || (o.choice.time && !C.validTime(o.choice.time))) throw new Error("Seçim geçersiz."); setWhen(n, o.choice.date, o.choice.time); }
      if (n.kind === "gorev" && n.when && n.when.ambiguous) throw new Error("Tarih/saat belirsiz: önce seçeneklerden birini seçin ya da tarihi elle girin.");
      if (!n.transcript && !n.audio) throw new Error("Boş not kaydedilemez.");
      if (!n.title) n.title = n.transcript ? C.makeTitle(n.transcript) : "Ses notu";
      n.clicks = Math.min(99, n.clicks + Math.max(0, Math.min(3, Number(o.clicks) || 0)));
      if (n.status === "taslak") data.metrics.saved++;
      n.status = n.status === "tamam" ? "tamam" : "kayitli";
      n.dateCheck = dateVerdict(n);
      touch(n);
      if (bubbleNote === id && o.from === "bubble") bubbleNote = null;
      return changed();
    });
    handle("note:done", (id) => { const n = getNote(id); if (n.status === "taslak") throw new Error("Önce kaydedin."); n.status = n.status === "tamam" ? "kayitli" : "tamam"; touch(n); return changed(); });
    handle("note:archive", (id, v) => { const n = getNote(id); n.archived = v !== false; if (n.archived && data.active === id) data.active = null; touch(n); return changed(); });
    handle("note:deleteAudio", async (id) => {
      const n = getNote(id);
      if (!n.audio) throw new Error("Ses dosyası zaten yok.");
      if (!(await approve("Ses dosyası silinsin mi?", "“" + n.title + "” notunun sesi (" + C.fmtDur(n.audio.seconds) + ") bu bilgisayardan kalıcı olarak silinir. Transkript ve not kalır.", "Sesi sil"))) return { approved: false };
      removeAudio(n); data.metrics.audioDeleted++; touch(n);
      return { approved: true, state: changed() };
    });
    handle("note:deleteTranscript", async (id) => {
      const n = getNote(id);
      if (!n.transcript) throw new Error("Transkript zaten boş.");
      if (!(await approve("Transkript silinsin mi?", "“" + n.title + "” notunun metni silinir. " + (n.audio ? "Ses dosyası kalır; yeniden metne çevirebilirsiniz." : "Bu notun ses dosyası yok; metin geri getirilemez."), "Transkripti sil"))) return { approved: false };
      n.transcript = ""; n.transcriptBy = ""; data.metrics.transcriptDeleted++; touch(n);
      return { approved: true, state: changed() };
    });
    handle("note:delete", async (id) => {
      const n = getNote(id);
      if (!(await approve("Not tamamen silinsin mi?", "“" + n.title + "”: not, transkript" + (n.audio ? " ve ses dosyası" : "") + " bu bilgisayardan kalıcı olarak silinir.", "Sil"))) return { approved: false };
      removeAudio(n);
      data.notes = data.notes.filter((x) => x.id !== id);
      if (data.active === id) data.active = null;
      if (bubbleNote === id) bubbleNote = null;
      return { approved: true, state: changed() };
    });
    handle("notes:export", async (format) => {
      const x = C.exportNotes(data.notes, format);
      if (!x.count) throw new Error("Dışa aktarılacak kayıtlı " + (format === "ics" ? "görev" : "not") + " yok.");
      const file = await pickSave("voice-note-orbit" + (format === "ics" ? "-gorevler" : "") + "." + x.ext, x.ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, x.body, "utf8");
      data.metrics.exports++;
      save();
      return { file: path.basename(file), count: x.count };
    });
    handle("notes:copy", () => { const x = C.exportNotes(data.notes, "md"); clipboard.writeText(x.body); return { copied: x.count }; });
    handle("notes:backup", async () => {
      const file = await pickSave("voice-note-orbit-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "voice-note-orbit", version: 1, exportedAt: new Date().toISOString(), note: "Ses dosyaları yedeğe girmez.", notes: data.notes }, null, 2), "utf8");
      return { file: path.basename(file), count: data.notes.length };
    });

    // MyMind düzeltmesi (isteğe bağlı, onaylı; yalnız bu notun maskelenmiş transkripti)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:refine", async (id) => {
      const n = getNote(id);
      if (!n.transcript) throw new Error("Önce transkript gerekir.");
      const prov = providerInfo();
      if (data.settings.provider === "hub" && !prov.key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
      const p = C.aiPayload(n, n.day);
      const ok = await approve("Not MyMind ile düzenlensin mi?", "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecek: yalnız bu notun transkripti (" + p.sent.chars + " karakter)" + (p.sent.masked ? "; " + p.sent.masked + " hassas değer (" + p.sent.maskedTypes.join(", ") + ") ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") + ".\n\nSes, diğer notlar ve etiketler gönderilmez. Öneri (tür, başlık, düzeltilmiş metin) taslağa uygulanır; tarih yine uygulamada hesaplanır ve belirsizse size sorulur.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: data.settings.provider, messages: p.messages }));
      let content;
      try { content = await net.chat({ base: prov.base, key: prov.key, model: prov.model, messages: p.messages, maxTokens: 900 }); }
      catch (err) { throw connErr(err.message || String(err), data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ")."); }
      const r = C.validateAi(content, p, n);
      data.metrics.aiRuns++; data.metrics.aiDropped += r.dropped;
      if (r.corrected && r.corrected !== n.transcript) { n.transcript = r.corrected; n.transcriptBy = "mymind-duzeltme"; }
      const a = C.analyze(r.dateText ? r.dateText + ". " + n.transcript : n.transcript, n.day, n.createdDayTime || testNow());
      if (!n.titleEdited && r.title) n.title = r.title;
      if (!n.kindEdited && r.kind) { n.kind = r.kind; n.kindWhy = "MyMind önerisi"; }
      if (!n.whenEdited) { n.when = C.normalizeWhen(a.when); n.autoWhen = C.normalizeWhen(a.when); }
      n.aiUsed = true;
      touch(n);
      return { approved: true, dropped: r.dropped, corrected: !!r.corrected, state: changed() };
    });

    // Balon
    handle("bubble:toggle", (v) => { data.settings.bubble = v == null ? !(bubble && !bubble.isDestroyed() && bubble.isVisible()) : !!v; setBubbleVisible(data.settings.bubble); return changed(); });
    handle("bubble:resize", (big) => { resizeBubble(!!big); return true; });
    handle("bubble:dismiss", () => { bubbleNote = null; push(); return true; });
    handle("main:show", (id) => { showMain(id); return true; });

    createWindow();
    if (data.settings.bubble) createBubble();
    try { globalShortcut.register(SHORTCUT, () => { data.settings.bubble = !(bubble && !bubble.isDestroyed() && bubble.isVisible()); setBubbleVisible(data.settings.bubble); save(); }); } catch { /* kısayol başka uygulamada kayıtlı */ }
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => globalShortcut.unregisterAll());
  app.on("window-all-closed", () => app.quit());
}

// IPC yalnız kendi pencerelerimizden gelen çağrıları kabul eder.
function assertOwn(e) {
  const ok = (win && !win.isDestroyed() && e.sender === win.webContents) || (bubble && !bubble.isDestroyed() && e.sender === bubble.webContents);
  if (!ok) throw new Error("Yetkisiz istek.");
}
