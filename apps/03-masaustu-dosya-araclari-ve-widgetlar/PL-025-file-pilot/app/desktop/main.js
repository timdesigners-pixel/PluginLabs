/* File Pilot — masaüstü kabuğu (Windows; Electron'un desteklediği diğer platformlarda da çalışır, ancak yalnız Windows paketi yayımlanır).
 * Akış: kullanıcı klasör seçer → klasörler okunur ve yerel indeks kurulur (desktop/indexer.js) → ad/metin/etiket araması, eşleşen bölüm önizlemesi,
 * benzer belge → dosyayı aç / klasörde göster / yolu kopyala. Dosya taşıma, silme, yeniden adlandırma bu ürünün kapsamında DEĞİLDİR (kod yolu yoktur).
 * İndeks (dosya metinlerinden alıntılar içerir) cihazda, işletim sistemi kasasıyla (DPAPI) şifreli tutulur. Ağ yalnız desktop/net.js içinde, onaylı MyMind isteği için. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, clipboard, shell, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const indexer = require("./indexer");
const C = require("../src/core.js");
const Bench = require("../src/bench.js");

const root = path.join(__dirname, "..");
// Test ortamında (CI/duman testi) kullanıcı verisine dokunmamak için ayrı klasör verilir; TEST kipinde onaylar ve klasör seçimi dosyalardan gelir.
if (process.env.FP_USER_DATA) app.setPath("userData", process.env.FP_USER_DATA);
const TEST = process.env.FP_TEST_DIR || "";
const SELFTEST = process.env.FP_SELFTEST || "";
const MAX_ROOTS = 12;
let win = null;
let memoryKey = null;
let roots = [];
let settings = C.settingsOf(null);
let docs = [];
let index = C.buildIndex([]);
let byId = new Map();
let scanning = false;
let stopFlag = false;
let progress = null;
let lastScan = null; // { at, ms, stats, errors }
let saveTimer = null;
let lastAsk = null;

const gotLock = SELFTEST ? true : app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const indexFile = (enc) => path.join(app.getPath("userData"), enc ? "indeks.bin" : "indeks.json");
const settingsFile = () => path.join(app.getPath("userData"), "ayarlar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık: indeks şifreli (kasa varsa), ayarlar düz JSON (yalnız klasör yolları ve seçenekler). Atomik yazma. ----
function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}
function load() {
  try {
    const s = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
    settings = C.settingsOf(s.settings);
    roots = Array.isArray(s.roots) ? s.roots.filter((r) => typeof r === "string" && path.isAbsolute(r)).slice(0, MAX_ROOTS) : [];
    lastScan = s.lastScan && typeof s.lastScan === "object" ? s.lastScan : null;
  } catch { /* ilk açılış */ }
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(indexFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(indexFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : [];
    setDocs(Array.isArray(d) ? d.filter((x) => x && typeof x.path === "string" && C.ID_RE.test(x.id) && roots.includes(x.root)) : []);
  } catch { setDocs([]); }
}
function setDocs(list) {
  docs = list;
  index = C.buildIndex(docs);
  byId = new Map(docs.map((d) => [d.id, d]));
}
function saveIndex() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const json = JSON.stringify(docs);
  if (vault()) {
    writeAtomic(indexFile(true), safeStorage.encryptString(json));
    fs.rmSync(indexFile(false), { force: true }); // eski düz kopya kalmaz
  } else writeAtomic(indexFile(false), json);
}
const saveSoon = () => { if (!saveTimer) saveTimer = setTimeout(saveIndex, 400); };
function saveSettings() { writeAtomic(settingsFile(), JSON.stringify({ settings, roots, lastScan })); }

function summary(d) {
  return { id: d.id, name: d.name, rel: d.rel, root: d.root, ext: d.ext, kind: C.kindOf(d.ext), size: d.size, mtime: d.mtime, status: d.status, tags: d.tags || [] };
}
function counts() {
  const c = { files: docs.length, text: 0, nameOnly: 0, big: 0, unreadable: 0, perRoot: {} };
  for (const d of docs) {
    if (d.status === "metin") c.text++;
    else if (d.status === "buyuk") c.big++;
    else if (d.status === "okunamadi") c.unreadable++;
    else c.nameOnly++;
    c.perRoot[d.root] = (c.perRoot[d.root] || 0) + 1;
  }
  return c;
}
function tagList() {
  const m = new Map();
  for (const d of docs) for (const t of d.tags || []) m.set(t, (m.get(t) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).map(([tag, n]) => ({ tag, n }));
}
function view() {
  return { roots, settings, counts: counts(), tags: tagList(), scanning, progress, lastScan, vault: vault(), hasKey: !!readKey(), platform: process.platform, excludesDefault: C.DEFAULT_EXCLUDES, sizes: C.SIZES_MB };
}
const push = () => { if (win) win.webContents.send("state:changed", view()); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1180, height: 760, minWidth: 900, minHeight: 580, useContentSize: true, autoHideMenuBar: true,
    title: "File Pilot",
    icon: path.join(root, "icons", "icon256.png"),
    backgroundColor: "#0e1322", // --pl-bg-1 (koyu); açılışta beyaz parlama olmaması için
    show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}
async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 1, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}

// ---- Tarama ----
async function runScan() {
  if (scanning) return { busy: true };
  if (!roots.length) throw new Error("Önce en az bir klasör ekleyin.");
  scanning = true;
  stopFlag = false;
  progress = { files: 0, dirs: 0, current: "" };
  push();
  const t0 = Date.now();
  try {
    const prev = new Map(docs.map((d) => [d.path, d]));
    const r = await indexer.scan(roots, settings, prev, (p) => { progress = p; push(); }, () => stopFlag);
    if (!r.stats.stopped) {
      setDocs(r.docs);
      saveIndex();
    }
    lastScan = { at: Date.now(), ms: Date.now() - t0, stats: r.stats, errors: r.errors.slice(0, 50).map((e) => ({ path: e.path, error: e.error })), errorCount: r.errors.length };
    saveSettings();
    return { ok: true, stopped: r.stats.stopped, files: r.docs.length, ms: lastScan.ms };
  } finally {
    scanning = false;
    progress = null;
    push();
  }
}
async function pickFolder() {
  if (TEST) return testRead("folder.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "İndekslenecek klasörü seçin", properties: ["openDirectory"] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
}
function setSettings(patch) {
  const p = patch && typeof patch === "object" ? patch : {};
  const next = { ...settings };
  for (const k of ["excludes", "maxSizeMB", "skipHidden", "rescanOnStart"]) if (Object.hasOwn(p, k)) next[k] = p[k];
  settings = C.settingsOf(next);
  saveSettings();
  push();
  return view();
}

// ---- MyMind istemci anahtarı: işletim sistemi kasasıyla şifreli; düz metin olarak diske yazılmaz. ----
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
const hubUrl = () => (TEST && process.env.FP_HUB_URL) || net.HUB_URL;

const doc = (id) => {
  const d = typeof id === "string" ? byId.get(id) : null;
  if (!d) throw new Error("Dosya indekste bulunamadı.");
  return d;
};
function searchView(query, opts) {
  const t0 = process.hrtime.bigint();
  const r = C.search(index, String(query || ""), { limit: Math.min(200, Math.max(1, Number(opts && opts.limit) || 100)), recent: !!(opts && opts.recent), root: opts && roots.includes(opts.root) ? opts.root : undefined });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { total: r.total, ms: Math.round(ms * 100) / 100, results: r.results.map((x) => ({ ...summary(byId.get(x.id)), score: x.score, snippet: x.snippet, terms: x.terms })) };
}

if (gotLock && !SELFTEST) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, cb) => cb(false));
    load();
    ipcMain.handle("state:get", (e) => { assertOwn(e); return view(); });
    ipcMain.handle("settings:set", (e, patch) => { assertOwn(e); return setSettings(patch); });
    ipcMain.handle("roots:add", async (e) => {
      assertOwn(e);
      const dir = await pickFolder();
      if (!dir) return { cancelled: true };
      const st = fs.statSync(dir);
      if (!st.isDirectory()) throw new Error("Seçilen yol bir klasör değil.");
      const abs = path.resolve(dir);
      if (roots.includes(abs)) return { exists: true };
      if (roots.some((r) => abs.startsWith(r + path.sep))) throw new Error("Bu klasör zaten eklenmiş bir klasörün içinde.");
      if (roots.length >= MAX_ROOTS) throw new Error("En fazla " + MAX_ROOTS + " klasör eklenebilir.");
      roots = roots.filter((r) => !r.startsWith(abs + path.sep)).concat(abs); // üst klasör eklenirse alt klasör kaydı birleşir
      saveSettings();
      push();
      runScan().catch(() => {});
      return { added: abs };
    });
    ipcMain.handle("roots:remove", (e, dir) => {
      assertOwn(e);
      if (!roots.includes(dir)) throw new Error("Klasör listede yok.");
      roots = roots.filter((r) => r !== dir);
      setDocs(docs.filter((d) => d.root !== dir)); // yalnız indeksten çıkar; diskteki dosyalara dokunulmaz
      saveIndex();
      saveSettings();
      push();
      return { removed: true };
    });
    ipcMain.handle("scan:start", (e) => { assertOwn(e); return runScan(); });
    ipcMain.handle("scan:stop", (e) => { assertOwn(e); stopFlag = true; return { ok: true }; });
    ipcMain.handle("search", (e, query, opts) => { assertOwn(e); return searchView(query, opts); });
    ipcMain.handle("doc:preview", (e, id, query) => {
      assertOwn(e);
      const d = doc(id);
      const q = C.parseQuery(String(query || ""));
      const words = [...new Set(q.terms), ...q.phrases];
      return { ...summary(d), path: d.path, ...C.previewLines(d.text || "", words, 3) };
    });
    ipcMain.handle("doc:similar", (e, id) => { assertOwn(e); doc(id); return C.similar(index, id, 8).map((x) => ({ ...summary(byId.get(x.id)), score: x.score })); });
    ipcMain.handle("doc:open", async (e, id) => {
      assertOwn(e);
      const d = doc(id);
      if (!fs.existsSync(d.path)) throw new Error("Dosya artık bu konumda değil; yeniden tarayın.");
      if (TEST) { testLog("opened.txt", d.path); return { opened: true }; }
      const err = await shell.openPath(d.path);
      if (err) throw new Error(err);
      return { opened: true };
    });
    ipcMain.handle("doc:reveal", (e, id) => {
      assertOwn(e);
      const d = doc(id);
      if (TEST) { testLog("revealed.txt", d.path); return { ok: true }; }
      shell.showItemInFolder(d.path);
      return { ok: true };
    });
    ipcMain.handle("doc:copyPath", (e, id) => { assertOwn(e); clipboard.writeText(doc(id).path); return { copied: true }; });
    ipcMain.handle("doc:tags", (e, id, tags) => {
      assertOwn(e);
      const d = doc(id);
      if (!Array.isArray(tags)) throw new Error("Geçersiz etiket listesi.");
      d.tags = [...new Set(tags.map(C.cleanTag).filter(Boolean))].slice(0, 20);
      index = C.buildIndex(docs);
      saveSoon();
      push();
      return { tags: d.tags };
    });
    ipcMain.handle("mymind:status", (e) => { assertOwn(e); return { hasKey: !!readKey(), vault: vault() }; });
    ipcMain.handle("mymind:setKey", (e, key) => { assertOwn(e); const r = { stored: writeKey(key) }; push(); return r; });
    ipcMain.handle("mymind:ask", async (e, question, query) => {
      assertOwn(e);
      const key = readKey();
      if (!key) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin.");
      // Adaylar yerel aramadan gelir: önce sorunun kendisi, sonuç yoksa ekrandaki arama sorgusu.
      let r = C.search(index, String(question || ""), { limit: C.AI_MAX_CANDIDATES });
      if (!r.results.length && query) r = C.search(index, String(query), { limit: C.AI_MAX_CANDIDATES });
      const cands = r.results.map((x) => ({ id: x.id, name: byId.get(x.id).name, text: x.snippet.text }));
      const p = C.mymindPayload(question, cands);
      const shown = p.candidates.map((c) => "[" + c.n + "] " + c.name + " — " + c.text.slice(0, 140) + (c.text.length > 140 ? "…" : "")).join("\n");
      const ok = await approve("MyMind'a gönderilsin mi? (anlamsal sorgu)",
        "PluginLabs Hub (bu bilgisayar) üzerinden MyMind'a yalnız şunlar gönderilir:\n• Sorunuz\n• Yerel aramanın bulduğu " + p.candidates.length + " dosyanın ADI ve eşleşen en fazla " + C.AI_SNIPPET + " karakterlik bölümü:\n\n" + shown +
        "\n\nTam dosya yolları, klasör adları, etiketler, tarihler ve dosyaların geri kalanı gönderilmez.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("mymind-sent.json", JSON.stringify(p.messages));
      let content;
      try { content = await net.mymindChat(hubUrl(), key, p.messages, 700); } catch (err) {
        const m = err && err.message ? err.message : String(err);
        throw new Error(/ECONNREFUSED|fetch failed/i.test(m) ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : m);
      }
      const v = C.validateAi(content, p.candidates);
      if (!v.ok) return { approved: true, ...v };
      const sources = v.sources.map((s) => {
        const d = byId.get(cands[s.n - 1].id);
        const line = s.verified ? C.snippet(d.text || "", C.tokenize(s.quote).slice(0, 3)).line : 0;
        return { ...summary(d), quote: s.quote, verified: s.verified, line };
      });
      lastAsk = { at: Date.now(), question: String(question).slice(0, 300) };
      return { approved: true, ok: true, answer: v.answer, sources };
    });

    createWindow();
    if (TEST) global.__fpScan = () => runScan();
    if (roots.length && settings.rescanOnStart) setTimeout(() => runScan().catch(() => {}), 600);
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { if (saveTimer) saveIndex(); });
  app.on("window-all-closed", () => app.quit());
}

// Öz test kipi (paketlenmiş uygulama dahil): doğrulama kıyaslamasını koşar (1000 belge), sonucu JSON'a yazar ve çıkar. Kullanıcı verisine dokunmaz.
if (SELFTEST) {
  app.whenReady().then(() => {
    let code = 1;
    try {
      const { performance } = require("node:perf_hooks");
      const r = Bench.run({ now: () => performance.now(), docs: 1000, queries: 300 });
      r.platform = process.platform;
      r.electron = process.versions.electron;
      fs.writeFileSync(SELFTEST, JSON.stringify(r, null, 2));
      code = r.ok ? 0 : 1;
    } catch (e) {
      fs.writeFileSync(SELFTEST, JSON.stringify({ ok: false, error: String(e && e.stack) }));
    }
    app.exit(code);
  });
  app.on("window-all-closed", () => {});
}

// IPC yalnız kendi penceremizden gelen çağrıları kabul eder.
function assertOwn(e) {
  if (!win || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
