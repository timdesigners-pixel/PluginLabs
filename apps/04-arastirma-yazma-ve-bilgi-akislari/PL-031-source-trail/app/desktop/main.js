/* Source Trail — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış: tarayıcıda seçilen metin + adres kopyalanır → "Panodan yakala" (yalnız kullanıcı eylemiyle) ya da yapıştırma → kaynak kartı
 * (alıntı, URL, erişim tarihi, künye, not) → iddia kartına bağ (destekler/çürütür/bağlam + kaynakta aynen bulunan alıntı) ya da açık
 * "eksik kanıt" etiketi → kaynakça / kanıt izi dışa aktarma. Kaynak sayfalar indirilmez; ağ yalnız onaylı MyMind isteği içindir.
 * Silme yok, arşivleme var. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
// Test ortamında kullanıcı verisine dokunmamak için ayrı klasör; TEST kipinde onaylar, dosya seçimleri ve dış bağlantılar dosyadan yürür.
if (process.env.ST_USER_DATA) app.setPath("userData", process.env.ST_USER_DATA);
const TEST = process.env.ST_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_IMPORT = 20 * 1024 * 1024;

let win = null;
let memoryKey = null;
let data = C.normalizeData({});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "arsiv.bin" : "arsiv.json");
const backupFile = (enc) => dataFile(enc) + ".bak";
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik yazma + son sağlam yedek; kasa varsa şifreli — notlar ve alıntılar kişisel olabilir) ----
function writeAtomic(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, buf);
  if (fs.existsSync(file)) fs.copyFileSync(file, file + ".bak");
  fs.renameSync(tmp, file);
}
function readRaw(file, enc) {
  const b = fs.readFileSync(file);
  return enc ? safeStorage.decryptString(b) : b.toString("utf8");
}
function load() {
  const tries = vault() ? [[dataFile(true), true], [backupFile(true), true], [dataFile(false), false], [backupFile(false), false]] : [[dataFile(false), false], [backupFile(false), false]];
  for (const [f, enc] of tries) {
    try { data = C.normalizeData(JSON.parse(readRaw(f, enc))); return; } catch { /* sonraki */ }
  }
  data = C.normalizeData({});
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) {
    writeAtomic(dataFile(true), safeStorage.encryptString(json));
    fs.rmSync(dataFile(false), { force: true });
    fs.rmSync(backupFile(false), { force: true });
  } else writeAtomic(dataFile(false), json);
}

// ---- Durum ----
function view() {
  const projects = [...new Set([...data.sources, ...data.claims].filter((x) => !x.archived && x.project).map((x) => x.project))].sort((a, b) => a.localeCompare(b, "tr"));
  return { sources: data.sources, claims: data.claims, settings: data.settings, metrics: data.metrics, projects, vault: vault(), hasKey: !!readKey(), platform: process.platform };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
const findSource = (id) => { const s = data.sources.find((x) => x.id === id); if (!s) throw new Error("Kaynak bulunamadı."); return s; };
const findClaim = (id) => { const c = data.claims.find((x) => x.id === id); if (!c) throw new Error("İddia bulunamadı."); return c; };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 1000, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Source Trail", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
async function pickSave(name, ext) {
  if (TEST) { const dir = path.join(TEST, "out"); fs.mkdirSync(dir, { recursive: true }); return path.join(dir, name); }
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}
async function pickOpen() {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Source Trail yedeği seçin", properties: ["openFile"], filters: [{ name: "JSON", extensions: ["json"] }] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
/** Yerel ağ ve döngü adresleri dış bağlantı olarak açılmaz. */
function isPrivateHost(h) {
  h = h.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || /\.local$/.test(h) || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === "::1" || /^f[cd]/.test(h) || h === "0.0.0.0";
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
const hubUrl = () => (TEST && process.env.ST_HUB_URL) || net.HUB_URL;
async function askMymind(messages, maxTokens) {
  const key = readKey();
  if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
  if (TEST) testLog("mymind-sent.json", JSON.stringify(messages));
  try { return await net.mymindChat(hubUrl(), key, messages, maxTokens); } catch (err) {
    const m = err && err.message ? err.message : String(err);
    throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
  }
}

// ---- Kaynak ve iddia işlemleri ----
function saveSource(input) {
  const now = Date.now();
  const existing = input && input.id ? data.sources.find((x) => x.id === input.id) : null;
  if (existing && existing.archived) throw new Error("Arşivdeki kaynak düzenlenemez; önce geri alın.");
  const s = C.normalizeSource({ ...(existing || {}), ...(input || {}), created: existing ? existing.created : now, updated: now, archived: existing ? existing.archived : false }, now);
  if (!s.title && !s.url && !s.quote) throw new Error("Kaynak kartı için en az başlık, adres ya da alıntı gerekir.");
  if (input && input.url && !s.url) throw new Error("Adres yalnız http(s) olabilir (kullanıcı adı/parola içermemeli).");
  if (s.copyOf === s.id || (s.copyOf && !data.sources.some((x) => x.id === s.copyOf && !x.archived))) s.copyOf = "";
  // Bağlı alıntılar bu kaynağın metninde hâlâ var mı? Yoksa kayıt reddedilir (kanıt izi sessizce bozulmaz).
  if (existing) {
    const broken = data.claims.filter((c) => !c.archived && c.links.some((l) => l.sourceId === s.id && l.quote && !C.quoteIn(l.quote, s.quote)));
    if (broken.length) throw new Error("Bu kaynağa bağlı " + broken.length + " iddianın alıntısı yeni metinde aynen bulunmuyor. Önce o bağları düzenleyin ya da alıntıyı koruyun.");
  }
  let dupOf = null;
  if (!existing) {
    const key = C.canonicalUrl(s.url);
    const fp = C.fingerprint(s.quote);
    const d = data.sources.find((x) => !x.archived && ((key && C.canonicalUrl(x.url) === key) || (fp && C.fingerprint(x.quote) === fp)));
    if (d) { dupOf = { id: d.id, title: d.title || d.url }; data.metrics.copyAlerts++; }
    data.sources.unshift(s);
    data.metrics.captures++;
  } else Object.assign(existing, s);
  return { id: s.id, dupOf, state: changed() };
}
function saveClaim(input) {
  const now = Date.now();
  const existing = input && input.id ? data.claims.find((x) => x.id === input.id) : null;
  if (existing && existing.archived) throw new Error("Arşivdeki iddia düzenlenemez; önce geri alın.");
  const c = C.normalizeClaim({ ...(existing || {}), text: input.text, project: input.project, links: existing ? existing.links : [], created: existing ? existing.created : now, updated: now }, now);
  if (!c.text) throw new Error("İddia metni boş olamaz.");
  if (existing) Object.assign(existing, c); else data.claims.unshift(c);
  return { id: c.id, state: changed() };
}
function setLink(claimId, link, by) {
  const c = findClaim(claimId);
  if (c.archived) throw new Error("Arşivdeki iddiaya kanıt eklenemez.");
  const l = C.normalizeLink({ ...link, by: by || "kullanici" });
  const s = findSource(l.sourceId);
  if (s.archived) throw new Error("Arşivdeki kaynak bağlanamaz.");
  if (l.quote && !C.quoteIn(l.quote, s.quote)) {
    data.metrics.quoteRejects++; save();
    throw new Error("Alıntı, kaynak kartındaki kayıtlı metinde aynen bulunmuyor. Kaynaktaki metni kopyalayın ya da alıntısız bağlayın.");
  }
  const i = c.links.findIndex((x) => x.sourceId === l.sourceId);
  if (i >= 0) c.links[i] = l; else c.links.push(l);
  c.updated = Date.now();
  return changed();
}

function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.source-trail");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => { data.settings = C.normalizeSettings({ ...data.settings, ...(patch || {}) }); return changed(); });

    // Örnek proje (uydurma örnek kaynaklar; var olan kimlikler atlanır)
    handle("sample:load", () => {
      const ids = new Set(data.sources.map((s) => s.id));
      const cids = new Set(data.claims.map((c) => c.id));
      const d = C.normalizeData({ sources: SAMPLE.sources, claims: SAMPLE.claims });
      const s = d.sources.filter((x) => !ids.has(x.id)), c = d.claims.filter((x) => !cids.has(x.id));
      data.sources.push(...s); data.claims.push(...c);
      return { added: s.length + c.length, project: SAMPLE.project, state: changed() };
    });

    // Yakalama: pano yalnız kullanıcı düğmeye basınca okunur
    handle("clip:capture", () => {
      const t = clipboard.readText();
      if (!t || !t.trim()) return { empty: true };
      return { capture: C.parseCapture(t), truncated: t.length > C.MAX_QUOTE * 2 };
    });
    handle("clip:write", (text) => { const t = C.str(text, 2 * 1024 * 1024); if (!t) throw new Error("Kopyalanacak metin yok."); clipboard.writeText(t); return { copied: t.length }; });

    // Kaynaklar
    handle("source:save", (s) => saveSource(s));
    handle("source:archive", (id, on) => {
      const s = findSource(id);
      s.archived = on !== false; s.updated = Date.now();
      if (s.archived) for (const x of data.sources) if (x.copyOf === id) x.copyOf = "";
      return changed();
    });
    handle("url:open", async (u) => {
      const h = C.validUrl(u);
      if (!h || isPrivateHost(new URL(h).hostname)) throw new Error("Yalnız herkese açık http(s) adresleri açılır.");
      if (TEST) { testLog("opened.txt", h); return { opened: h }; }
      await shell.openExternal(h);
      return { opened: h };
    });

    // İddialar
    handle("claim:save", (c) => saveClaim(c || {}));
    handle("claim:archive", (id, on) => { const c = findClaim(id); c.archived = on !== false; c.updated = Date.now(); return changed(); });
    handle("claim:missing", (id, on, note) => {
      const c = findClaim(id);
      c.missing = !!on; c.missingNote = on ? C.line(note, 400) : ""; c.updated = Date.now();
      return changed();
    });
    handle("link:set", (claimId, link) => setLink(claimId, link));
    handle("link:remove", (claimId, sourceId) => { const c = findClaim(claimId); c.links = c.links.filter((l) => l.sourceId !== sourceId); c.updated = Date.now(); return changed(); });

    // Kaynakça ve yedek
    handle("export:copy", (format, scope) => {
      const r = C.bibliography(data, format, scope, data.settings.project);
      if (!r.text.trim()) throw new Error("Dışa aktarılacak kaynak yok.");
      clipboard.writeText(r.text);
      data.metrics.exports++;
      return { count: r.count, state: changed() };
    });
    handle("export:save", async (format, scope) => {
      const r = C.bibliography(data, format, scope, data.settings.project);
      if (!r.text.trim()) throw new Error("Dışa aktarılacak kaynak yok.");
      const ext = C.FORMAT_EXT[format] || "txt";
      const file = await pickSave((format === "md" ? "kanit-izi" : "kaynakca-" + format) + "." + ext, ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, (ext === "txt" || ext === "md" ? "﻿" : "") + r.text, "utf8");
      data.metrics.exports++;
      return { file: path.basename(file), count: r.count, state: changed() };
    });
    handle("backup:export", async () => {
      const file = await pickSave("source-trail-yedek-" + C.today() + ".json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "source-trail", version: 1, exported: new Date().toISOString(), sources: data.sources, claims: data.claims }, null, 2), "utf8");
      return { file: path.basename(file) };
    });
    handle("backup:import", async () => {
      const file = await pickOpen();
      if (!file) return { cancelled: true };
      if (fs.statSync(file).size > MAX_IMPORT) throw new Error("Yedek dosyası 20 MB'tan büyük.");
      let j;
      try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { throw new Error("Dosya geçerli bir JSON değil."); }
      if (!j || j.app !== "source-trail") throw new Error("Bu dosya bir Source Trail yedeği değil.");
      const merged = C.normalizeData({ sources: [...data.sources, ...(j.sources || []).filter((s) => s && !data.sources.some((x) => x.id === s.id))], claims: [...data.claims, ...(j.claims || []).filter((c) => c && !data.claims.some((x) => x.id === c.id))], settings: data.settings, metrics: data.metrics });
      const added = merged.sources.length - data.sources.length + merged.claims.length - data.claims.length;
      data = merged;
      return { added, state: changed() };
    });

    // MyMind (Hub üzerinden; her istek ayrı onaylı; yalnız iddia + bağlı kaynakların başlığı ve kayıtlı alıntısı gider)
    handle("mymind:status", () => ({ hasKey: !!readKey(), vault: vault() }));
    handle("mymind:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("mymind:compare", async (claimId) => {
      const c = findClaim(claimId);
      const srcs = c.links.map((l) => data.sources.find((s) => s.id === l.sourceId)).filter((s) => s && !s.archived);
      if (!srcs.length) throw new Error("Karşılaştırma için önce iddiaya en az bir kaynak bağlayın.");
      const p = C.aiPayload(c, srcs);
      const ok = await approve("MyMind'a gönderilsin mi? (kaynak karşılaştırma taslağı)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• İddia metni: " + p.sent.claimChars + " karakter\n• " + p.sent.sources + " kaynağın başlığı ve kayıtlı alıntısı (toplam " + p.sent.quoteChars + " karakter)" +
        (p.sent.skipped ? "\n• " + p.sent.skipped + " kaynak sınır nedeniyle gönderilmez" : "") +
        "\n\nAdresler, yazarlar, notlarınız, proje adı ve diğer iddialar gönderilmez. Sonuç yalnız taslaktır: önerilen her alıntı kaynak metninde aynen aranır, bulunmayan atılır; siz “Uygula” demeden hiçbir bağ değişmez.", "Gönder");
      if (!ok) return { approved: false };
      const byId = Object.fromEntries(data.sources.map((s) => [s.id, s]));
      const r = C.validateComparison(await askMymind(p.messages, 1200), p.map, byId);
      data.metrics.aiRuns++;
      data.metrics.aiItems += r.items.length;
      data.metrics.aiQuotesDropped += r.dropped;
      save(); push();
      return { approved: true, ...r };
    });
    handle("mymind:apply", (claimId, item) => {
      if (!item || !C.RELATIONS.includes(item.relation)) throw new Error("Bu öneri uygulanamaz (ilişki belirsiz ya da ilgisiz).");
      setLink(claimId, { sourceId: item.sourceId, relation: item.relation, quote: item.quote, note: "MyMind taslağı: " + C.line(item.reason, 300) }, "mymind");
      data.metrics.aiApplied++;
      return changed();
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
