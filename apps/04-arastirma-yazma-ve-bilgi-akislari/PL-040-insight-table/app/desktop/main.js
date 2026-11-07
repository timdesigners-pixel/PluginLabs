/* Insight Table — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçili tablo/liste → sütun önizlemesi → veri tipi kontrolü → CSV/JSON. İlk sürüm: kullanıcının seçtiği tek sayfa.
 * • İçerik yalnız kullanıcının verdiğidir: yapıştırma, pano (tarayıcıdan kopyalanan tablo HTML olarak okunur; düğme ya da genel kısayol),
 *   .html/.htm/.csv/.tsv/.txt/.md dosyası. Sayfa indirilmez, site taranmaz; HTML'deki betikler çalıştırılmaz.
 * • Hücre değeri uydurulmaz; eksik/uyumsuz/belirsiz hücreler işaretlenir. Dışa aktarılan dosya geri okunup hücre hücre doğrulanır.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı; yalnız sütun adları/türleri/sayımlar ve kişisel veri
 *   içermeyen örnekler gider; yanıt yalnız sütun adlarını değiştirebilir ve not ekleyebilir. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell, globalShortcut, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.IT_USER_DATA) app.setPath("userData", process.env.IT_USER_DATA);
const TEST = process.env.IT_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 5 * 1024 * 1024;
const MAX_FILES = 20;
const SHOW_ROWS = 300;
const SHORTCUT = "CommandOrControl+Alt+I";
const FILE_RE = /\.(html?|xhtml|csv|tsv|txt|md|markdown)$/i;

let win = null;
let memoryKey = null;
let shortcutOk = false;
let data = { settings: C.normalizeSettings({}), captures: [], active: null, exports: [], counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "tablolar.bin" : "tablolar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.IT_NOW ? new Date(process.env.IT_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — tablolar kişisel veri içerebilir) ----
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
    data.captures = C.normalizeCaptures(d.captures);
    data.active = data.captures.some((x) => x.id === d.active) ? d.active : null;
    data.exports = C.normalizeExports(d.exports);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Hub istemci anahtarı: kasada şifreli, arayüze hiç verilmez ----
const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() {
  if (memoryKey) return memoryKey;
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* yok */ }
  return null;
}
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

// ---- Tablo ----
function getCap(id) { const x = data.captures.find((i) => i.id === id); if (!x) throw new Error("Kayıt bulunamadı."); return x; }
const workOf = (x, idx) => { const k = String(idx == null ? x.sel : idx); if (!x.work[k]) x.work[k] = C.normalizeWork({}); return x.work[k]; };
const tableOf = (x, idx) => { const i = idx == null ? x.sel : idx; return C.buildTable(x.candidates[i], x.work[String(i)] || {}, data.settings, x.input.lang); };
const sourceLabel = (x) => (x.input.title || C.hostOf(x.input.url) || x.input.file || "Yapıştırılan içerik") + " · " + C.KIND_NAMES[x.candidates[x.sel].kind] + " " + (x.sel + 1);
function goldResult() {
  const tables = {};
  for (const x of data.captures) if (x.sampleKey && x.status === "etkin") tables[x.sampleKey] = tableOf(x, 0);
  return Object.keys(tables).length ? C.evaluateGold(tables, SAMPLE.gold.filter((g) => tables[g.key])) : null;
}

// ---- Durum ----
function view() {
  const x = data.captures.find((i) => i.id === data.active) || null;
  let table = null;
  if (x) {
    const t = tableOf(x);
    table = { ...t, rows: t.rows.slice(0, SHOW_ROWS), shown: Math.min(SHOW_ROWS, t.rows.length), total: t.rows.length };
  }
  const gold = goldResult();
  return {
    settings: data.settings,
    captures: data.captures.map((c) => ({ id: c.id, createdAt: c.createdAt, status: c.status, input: c.input, sel: c.sel, sampleKey: c.sampleKey || null, ai: c.ai, candidates: c.candidates.map((d) => ({ idx: d.idx, kind: d.kind, caption: d.caption, rows: d.rows, cols: d.cols, headerGuess: d.headerGuess, preview: d.grid.slice(0, 2).map((r) => r.slice(0, 4).map((y) => y.t.slice(0, 40))) })) })),
    active: x ? x.id : null, table, exports: data.exports.slice(-200).reverse(), counters: data.counters, gold,
    metrics: C.metrics(data.captures, data.exports, data.counters, gold),
    now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform, shortcut: { accel: SHORTCUT, ok: shortcutOk },
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Insight Table", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
async function pickFiles() {
  if (TEST) { const t = testRead("pick.txt"); return t ? t.split("\n").filter(Boolean) : []; }
  const r = await dialog.showOpenDialog(win, { title: "Tablo içeren dosyaları seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Sayfa ve tablo", extensions: ["html", "htm", "xhtml", "csv", "tsv", "txt", "md", "markdown"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Dışa aktar", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}
/** Dosya metni: BOM'a ya da HTML meta charset'e göre çözülür (ör. windows-1254); bilinmeyen kodlamada UTF-8. */
function decodeFile(buf, isHtml) {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString("utf8");
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  if (isHtml) {
    const head = buf.subarray(0, 4096).toString("latin1");
    const m = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head);
    if (m && !/^utf-?8$/i.test(m[1])) { try { return new TextDecoder(m[1].toLowerCase()).decode(buf); } catch { /* desteklenmiyor */ } }
  }
  return buf.toString("utf8");
}

// ---- İçerik yakalama ----
function addCapture(input, extra) {
  if (data.captures.length >= C.MAX_CAPTURES) throw new Error("Kayıt sınırına (" + C.MAX_CAPTURES + ") ulaşıldı. Yedek alıp eski kayıtları arşivleyin.");
  const x = C.createCapture(input, ((extra && extra.at) || now()).toISOString());
  if (extra && extra.key) x.sampleKey = extra.key;
  data.captures.unshift(x);
  data.counters.captures++;
  data.active = x.id;
  return x;
}
function sourceFrom(s) {
  s = s || {};
  const url = C.str(s.url, 2000).trim();
  if (url && !C.isWebUrl(url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
  return { url, title: C.str(s.title, 200).trim() };
}
function captureClipboard(via) {
  const html = clipboard.readHTML();
  const text = clipboard.readText();
  const useHtml = html && /<(table|ul|ol|dl)\b/i.test(html);
  if (!useHtml && !(text && text.trim())) throw new Error("Panoda tablo yok. Sayfada tabloyu fareyle seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
  let x;
  try { x = addCapture(useHtml ? { content: html, format: "html", via: "pano" } : { content: text, format: "metin", via: "pano" }); } catch (err) {
    if (useHtml && text && text.trim()) x = addCapture({ content: text, format: "metin", via: "pano" }); else throw err;
  }
  data.counters.clipboard++;
  if (via === "kisayol") data.counters.shortcut++;
  return x;
}
const summary = (x) => { const c = x.candidates[x.sel]; return x.candidates.length + " tablo/liste bulundu; ilk: " + c.rows + " satır × " + c.cols + " sütun"; };

// ---- Yapay zekâ sağlayıcısı ----
const hubUrl = () => (TEST && process.env.IT_HUB_URL) || net.HUB_URL;
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
    if (/ECONNREFUSED|fetch failed/i.test(msg)) throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632). Hub'ı başlatıp My Mind motorunu çalıştırın." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
    throw new Error(msg);
  }
}

// ---- Genel kısayol: panodaki tablo yeni kayıt olur (pano yalnız tuşa basıldığında okunur) ----
function applyShortcut() {
  try { globalShortcut.unregister(SHORTCUT); } catch { /* yok */ }
  shortcutOk = false;
  if (!data.settings.shortcut || process.env.IT_NO_SHORTCUT) return;
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => {
      try {
        const x = captureClipboard("kisayol");
        changed();
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: summary(x) + ". Dışa aktarmadan önce sütunları kontrol edin.", silent: true }).show();
      } catch (err) {
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: String(err && err.message ? err.message : err), silent: true }).show();
      }
    });
  } catch { shortcutOk = false; }
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

async function exportFile(id, format) {
  const x = getCap(id);
  const t = tableOf(x);
  if (!t.totals.rows || !t.totals.cols) throw new Error("Dışa aktarılacak satır ya da sütun yok.");
  const s = data.settings;
  const base = (C.slugKey(x.input.title || C.hostOf(x.input.url) || "tablo").replace(/_/g, "-") || "tablo") + "-" + (x.sel + 1);
  const file = await pickSave(base + "." + format, format);
  if (!file) return { cancelled: true };
  let exp, verify;
  if (format === "csv") {
    exp = C.exportCsv(t, { profile: s.csvProfile, trace: s.trace });
    fs.writeFileSync(file, exp.text, "utf8");
    verify = C.verifyCsv(fs.readFileSync(file, "utf8"), exp);
  } else {
    exp = C.exportJson(t, { url: x.input.url || null, title: x.input.title || null, capturedAt: x.createdAt, table: x.sel + 1 }, { trace: s.trace });
    fs.writeFileSync(file, exp.text, "utf8");
    verify = C.verifyJson(fs.readFileSync(file, "utf8"), exp);
  }
  data.exports.push({ at: now().toISOString(), file: path.basename(file), format, profile: format === "csv" ? s.csvProfile : "", rows: t.totals.rows, cols: t.totals.cols, neutralized: exp.neutralized || 0, masked: exp.masked || 0, verify: { ok: verify.ok, total: verify.total, pass: verify.pass }, source: sourceLabel(x), captureId: x.id, trace: s.trace });
  data.counters.exports++;
  data.counters.neutralized += exp.neutralized || 0;
  data.counters.masked += exp.masked || 0;
  data.counters.cellsExported += t.totals.rows * t.totals.cols;
  if (verify.pass) data.counters.verified++; else data.counters.verifyFailed++;
  const st = changed();
  return { file: path.basename(file), rows: t.totals.rows, cols: t.totals.cols, neutralized: exp.neutralized || 0, masked: exp.masked || 0, verify, state: st };
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.insight-table");
    load();
    applyShortcut();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      const before = data.settings;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if (before.shortcut !== data.settings.shortcut) applyShortcut();
      return changed();
    });

    // İçerik
    handle("capture:text", (content, source) => {
      const c = C.str(content, C.MAX_INPUT);
      const x = addCapture({ content: c, format: /<(table|ul|ol|dl)\b/i.test(c) && /<\/(table|ul|ol|dl)>/i.test(c) ? "html" : "metin", ...sourceFrom(source), via: "yapistirma" });
      return { summary: summary(x), state: changed() };
    });
    handle("capture:clipboard", () => { const x = captureClipboard("dugme"); return { summary: summary(x), via: x.input.format, state: changed() }; });
    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0;
      const skipped = [];
      for (const f of files) {
        try {
          const st = fs.statSync(f);
          if (!st.isFile() || !FILE_RE.test(f)) { skipped.push(path.basename(f) + " (desteklenmeyen tür)"); continue; }
          if (st.size > MAX_FILE) { skipped.push(path.basename(f) + " (5 MB'tan büyük)"); continue; }
          const html = /\.(html?|xhtml)$/i.test(f);
          const content = decodeFile(fs.readFileSync(f), html);
          addCapture({ content, format: html ? "html" : "metin", title: "", file: path.basename(f), via: "dosya" });
          if (!data.captures[0].input.title) data.captures[0].input.title = path.basename(f);
          data.counters.files++;
          added++;
        } catch (err) { skipped.push(path.basename(f) + " (" + (err && err.message ? err.message.split(":")[0] : "okunamadı") + ")"); }
      }
      return { files: files.length, added, skipped, state: changed() };
    });
    handle("capture:sample", () => {
      for (const p of SAMPLE.pages.slice().reverse()) addCapture({ content: p.content, format: p.format, url: p.url, title: p.title, via: "ornek" }, { key: p.key, at: new Date(SAMPLE.BASE) });
      return { added: SAMPLE.pages.length, state: changed() };
    });

    // Tablo düzenleme (yalnız yerel; kaynak ızgara değişmez)
    handle("item:open", (id) => { if (id) getCap(id); data.active = id || null; return changed(); });
    handle("item:table", (id, idx) => { const x = getCap(id); const i = Number(idx); if (!x.candidates[i]) throw new Error("Tablo bulunamadı."); x.sel = i; return changed(); });
    handle("item:header", (id, n) => { const x = getCap(id); workOf(x).header = Math.max(0, Math.min(2, Math.floor(Number(n) || 0))); workOf(x).cols = workOf(x).cols.map((c) => ({ ...c, name: "" })); return changed(); });
    handle("item:column", (id, i, patch) => {
      const x = getCap(id);
      const w = workOf(x);
      const cand = x.candidates[x.sel];
      i = Number(i);
      if (!(i >= 0 && i < cand.cols)) throw new Error("Sütun bulunamadı.");
      const cur = C.normalizeWork({ cols: [w.cols[i] || {}] }).cols[0];
      patch = patch || {};
      if ("name" in patch) { const n = C.clean(C.str(patch.name, 120)); if (n.length > 60) throw new Error("Sütun adı en çok 60 karakter olabilir."); cur.name = n; }
      if ("type" in patch) { if (patch.type && !C.TYPES.includes(patch.type)) throw new Error("Geçersiz tür."); cur.type = patch.type || ""; }
      if ("include" in patch) cur.include = !!patch.include;
      if ("pii" in patch) { if (patch.pii && !C.PII_MODES.includes(patch.pii)) throw new Error("Geçersiz filtre."); cur.pii = patch.pii || ""; }
      while (w.cols.length <= i) w.cols.push({});
      w.cols[i] = cur;
      return changed();
    });
    handle("item:row", (id, n, skip) => {
      const x = getCap(id); const w = workOf(x);
      n = Number(n);
      const set = new Set(w.skipRows);
      if (skip) set.add(n); else set.delete(n);
      w.skipRows = [...set].sort((a, b) => a - b);
      return changed();
    });
    handle("item:reset", (id) => { const x = getCap(id); x.work[String(x.sel)] = C.normalizeWork({}); return changed(); });
    handle("item:archive", (id) => { const x = getCap(id); x.status = "arsiv"; const next = data.captures.find((i) => i.status === "etkin"); data.active = next ? next.id : null; return changed(); });
    handle("item:restore", (id) => { const x = getCap(id); x.status = "etkin"; data.active = x.id; return changed(); });
    handle("link:open", async (id) => {
      const x = getCap(id);
      if (!x.input.url || !C.isWebUrl(x.input.url)) throw new Error("Açılacak kaynak adresi yok.");
      if (TEST) { testLog("opened.txt", x.input.url); return { opened: x.input.url }; }
      await shell.openExternal(x.input.url);
      return { opened: x.input.url };
    });

    // Dışa aktarma (yazılan dosya geri okunup doğrulanır)
    handle("export:csv", (id) => exportFile(id, "csv"));
    handle("export:json", (id) => exportFile(id, "json"));
    handle("export:tsv", (id) => {
      const x = getCap(id);
      const t = tableOf(x);
      clipboard.writeText(C.exportTsv(t));
      data.counters.copies++;
      save();
      return { rows: t.totals.rows, cols: t.totals.cols };
    });
    handle("export:backup", async () => {
      const file = await pickSave("insight-table-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "insight-table", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, captures: data.captures, exports: data.exports }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ (tek tablo; her istek ayrı onaylı)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:suggest", async (id) => {
      const x = getCap(id);
      const t = tableOf(x);
      const p = C.aiPayload(t);
      const prov = providerInfo();
      const ok = await approve("Bu tablonun sütunları MyMind ile gözden geçirilsin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.cols + " sütunun adı, algılanan türü ve eksik/uyumsuz/belirsiz sayıları\n• Sütun başına en çok 3 örnek değer (toplam " + p.sent.samples + ")" +
        (p.sent.piiCols ? "\n• Kişisel veri sütunlarından (" + p.sent.piiCols + ") örnek gönderilmez" : "") + "\n• Satırların geri kalanı, kaynak adresi ve başlığı gönderilmez" +
        "\n\nYanıt yalnız sütun adı önerisi ve sütun notu olarak kabul edilir; hücre değeri öneren kısımlar atılır. Uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 900), t);
      x.ai = { ...res, at: now().toISOString(), table: x.sel };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, names: Object.keys(res.names).length, warnings: res.warnings.length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", (id) => {
      const x = getCap(id);
      if (!x.ai || x.ai.table !== x.sel) throw new Error("Bu tablo için MyMind önerisi yok.");
      const w = workOf(x);
      let n = 0;
      for (const [i, name] of Object.entries(x.ai.names)) {
        const k = Number(i);
        if (!(k >= 0 && k < x.candidates[x.sel].cols)) continue;
        while (w.cols.length <= k) w.cols.push({});
        w.cols[k] = { ...C.normalizeWork({ cols: [w.cols[k] || {}] }).cols[0], name: C.clean(name).slice(0, 60) };
        n++;
      }
      x.ai.names = {};
      return { applied: n, state: changed() };
    });
    handle("ai:dismiss", (id) => { const x = getCap(id); x.ai = null; return changed(); });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
