/* Insight Table — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçili tablo/liste → sütun önizlemesi → veri tipi kontrolü → CSV/JSON. İlk sürüm: kullanıcının seçtiği tek sayfa.
 * • Kaynak yalnız kullanıcının verdiğidir: pano (tarayıcıdan kopyalanan tablo HTML'i ya da metin) — düğme ya da genel kısayol —,
 *   yapıştırma, .html/.csv/.tsv/.txt/.md dosyası ya da onaylanan TEK sayfa adresi. Bağlantılar izlenmez; site genelinde tarama yoktur.
 * • Hücre değerleri kaynaktan gelir; eksik/hatalı hücre işaretlenir, tahminle doldurulmaz. Dışa aktarılan dosya geri okunup doğrulanır.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, kişisel veri maskeli; yalnız sütun adı ve işaret önerir. */
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
const MAX_FILES = 10;
const PREVIEW_ROWS = 300;
const SHORTCUT = "CommandOrControl+Alt+T";
const FILE_EXT = /\.(html?|xhtml|csv|tsv|tab|txt|md|markdown)$/i;

let win = null;
let memoryKey = null;
let shortcutOk = false;
let data = { settings: C.normalizeSettings({}), datasets: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "tablolar.bin" : "tablolar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.IT_NOW ? new Date(process.env.IT_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — kopyalanan tablolar kişisel veri içerebilir) ----
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
    data.datasets = C.normalizeDatasets(d.datasets);
    data.active = data.datasets.some((x) => x.id === d.active) ? d.active : null;
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

// ---- Durum (arayüze yalnız özet + etkin tablonun önizlemesi gider) ----
function summary(d) {
  const s = C.analyze(d).stats;
  const cand = d.cands[d.choice];
  return { id: d.id, name: d.name, status: d.status, createdAt: d.createdAt, via: d.source.via, host: C.hostOf(d.source.url), file: d.source.file, kind: cand.kind, rows: s.rows, cols: s.cols, flagged: s.eksik + s.hatali + s.belirsiz, pii: s.pii, exports: d.exports.length, ai: !!d.ai, sample: !!d.sampleKey };
}
function detail(d) {
  const a = C.analyze(d);
  const cand = d.cands[d.choice];
  return {
    id: d.id, name: d.name, status: d.status, createdAt: d.createdAt, source: d.source, choice: d.choice,
    cands: d.cands.map((c) => ({ label: C.candidateLabel(c), kind: c.kind, rows: c.rows, cols: c.cols, headerRows: c.headerRows, truncated: c.truncated })),
    headerRows: cand.headerRows, header: cand.grid.slice(0, cand.headerRows), columns: d.columns, stats: a.stats, truncated: a.truncated,
    preview: a.cells.slice(0, PREVIEW_ROWS), more: Math.max(0, a.cells.length - PREVIEW_ROWS), ai: d.ai, exports: d.exports.slice().reverse(),
  };
}
function view() {
  const act = data.datasets.find((x) => x.id === data.active) || null;
  const samples = data.datasets.filter((x) => x.sampleKey);
  const log = [];
  for (const d of data.datasets) for (const e of d.exports) log.push({ ...e, dsId: d.id, dsName: d.name });
  log.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return {
    settings: data.settings, list: data.datasets.map(summary), active: act ? detail(act) : null, exportsLog: log.slice(0, 200),
    metrics: C.metrics(data.datasets, data.counters), gold: samples.length ? C.evaluateGold(samples, SAMPLE.gold) : null, counters: data.counters,
    now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform, shortcut: { accel: SHORTCUT, ok: shortcutOk },
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getDs(id) { const x = data.datasets.find((i) => i.id === id); if (!x) throw new Error("Tablo bulunamadı."); return x; }
const editable = (x) => { if (x.status === "arsiv") throw new Error("Arşivdeki tablo düzenlenemez; önce geri alın."); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 1060, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
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
  const r = await dialog.showOpenDialog(win, { title: "Tablo içeren dosyaları seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Tablo ve sayfa", extensions: ["html", "htm", "csv", "tsv", "txt", "md"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Dışa aktar", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- Kaynak yakalama ----
function addDataset(input, extra) {
  if (data.datasets.length >= C.MAX_DATASETS) throw new Error("Tablo sınırına (" + C.MAX_DATASETS + ") ulaşıldı. Eski tabloları JSON yedeğe aktarıp yeni başlangıç yapın.");
  const html = input.html ? String(input.html).slice(0, C.MAX_HTML) : "";
  const meta = html ? C.htmlMeta(html) : { lang: "", title: "" };
  const cands = C.candidates({ html, text: input.text ? String(input.text).slice(0, C.MAX_TEXT) : "" });
  const ds = C.createDataset({ ...input, title: input.title || meta.title, lang: meta.lang }, cands, ((extra && extra.at) || now()).toISOString(), data.settings);
  if (extra && extra.key) ds.sampleKey = extra.key;
  data.datasets.unshift(ds);
  data.counters.captures++;
  data.active = ds.id;
  return ds;
}
const capInfo = (ds) => ({ name: ds.name, tables: ds.cands.length, rows: C.analyze(ds).stats.rows, cols: ds.columns.length });
function captureClipboard(via) {
  const html = clipboard.readHTML() || "";
  const text = clipboard.readText() || "";
  if (!html.trim() && !text.trim()) throw new Error("Panoda içerik yok. Sayfada tabloyu ya da listeyi seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
  const hasTable = /<(table|ul|ol|dl)\b/i.test(html);
  const ds = addDataset({ html: hasTable ? html : "", text, via: hasTable ? "pano-html" : "pano-metin" });
  data.counters.clipboard++;
  if (via === "kisayol") data.counters.shortcut++;
  return ds;
}
function sourceFrom(s) {
  s = s || {};
  const url = C.str(s.url, 2000).trim();
  if (url && !C.isWebUrl(url)) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
  return { url, title: C.str(s.title, 200).trim() };
}

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

// ---- Genel kısayol: panodaki seçili tablo yeni kayıt olur (pano yalnız tuşa basıldığında okunur) ----
function applyShortcut() {
  try { globalShortcut.unregister(SHORTCUT); } catch { /* yok */ }
  shortcutOk = false;
  if (!data.settings.shortcut || process.env.IT_NO_SHORTCUT) return;
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => {
      try {
        const ds = captureClipboard("kisayol");
        changed();
        const i = capInfo(ds);
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: "“" + i.name + "”: " + i.rows + " satır × " + i.cols + " sütun" + (i.tables > 1 ? " (" + i.tables + " tablo bulundu)" : "") + ". Sütunları önizleyin.", silent: true }).show();
      } catch (err) {
        if (Notification.isSupported()) new Notification({ title: "Insight Table", body: String(err && err.message ? err.message : err), silent: true }).show();
      }
    });
  } catch { shortcutOk = false; }
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }
const slug = (s) => (C.keyOf(s || "tablo").replace(/_/g, "-").slice(0, 50) || "tablo");

async function doExport(id, format, opts) {
  const d = getDs(id);
  const cols = d.columns.filter((c) => c.include && !(c.pii && c.piiMode === "cikar"));
  if (!cols.length) throw new Error("Dışa aktarılacak sütun yok (tüm sütunlar kapalı).");
  const o = format === "csv"
    ? { preset: opts && opts.preset === "excel-tr" ? "excel-tr" : opts && opts.preset === "standart" ? "standart" : data.settings.csvPreset, values: opts && opts.values === "ham" ? "ham" : "normal", bom: data.settings.bom }
    : { trace: opts && "trace" in opts ? !!opts.trace : data.settings.jsonTrace, values: opts && opts.values === "ham" ? "ham" : "normal" };
  const res = format === "csv" ? C.exportCsv(d, o) : C.exportJson(d, o);
  const file = await pickSave(slug(d.name) + "." + format, format);
  if (!file) return { cancelled: true };
  fs.writeFileSync(file, res.text, "utf8");
  // Yazılan dosya diskten geri okunur ve hücre hücre doğrulanır.
  const check = C.verifyExport(format, fs.readFileSync(file, "utf8"), res);
  const entry = C.normalizeExport({ at: now().toISOString(), format, preset: o.preset || "", file: path.basename(file), rows: res.rows, cols: res.cols, cells: check.cells, matched: check.matched, neutralized: res.neutralized || 0, masked: res.masked, values: o.values, trace: !!o.trace });
  d.exports.push(entry);
  if (d.exports.length > 50) d.exports.shift();
  data.counters.exports++;
  data.counters.exportCells += check.cells;
  data.counters.exportMatched += check.matched;
  data.counters.neutralized += res.neutralized || 0;
  data.counters.masked += res.masked;
  const st = changed();
  return { file: entry.file, rows: res.rows, cols: res.cols, cells: check.cells, matched: check.matched, ok: check.ok, mismatches: check.mismatches.slice(0, 3), neutralized: entry.neutralized, masked: entry.masked, state: st };
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

    // Kaynak
    handle("capture:clipboard", () => { const ds = captureClipboard("dugme"); return { ...capInfo(ds), state: changed() }; });
    handle("capture:text", (text, html, source) => {
      text = C.str(text, C.MAX_TEXT);
      html = typeof html === "string" ? html.slice(0, C.MAX_HTML) : "";
      if (!text.trim() && !html.trim()) throw new Error("Tablo içeren metni yapıştırın.");
      const hasTable = /<(table|ul|ol|dl)\b/i.test(html);
      const ds = addDataset({ html: hasTable ? html : "", text, via: "metin", ...sourceFrom(source) });
      return { ...capInfo(ds), state: changed() };
    });
    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0;
      const skipped = [];
      for (const f of files) {
        try {
          const st = fs.statSync(f);
          if (!st.isFile() || !FILE_EXT.test(f)) { skipped.push(path.basename(f) + " (desteklenmeyen tür)"); continue; }
          if (st.size > MAX_FILE) { skipped.push(path.basename(f) + " (5 MB üstü)"); continue; }
          const body = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
          const isHtml = /\.(html?|xhtml)$/i.test(f);
          addDataset({ html: isHtml ? body : "", text: isHtml ? "" : body, via: "dosya", file: path.basename(f) });
          data.counters.files++;
          added++;
        } catch (err) { skipped.push(path.basename(f) + " (" + (err && err.message ? err.message.split(".")[0] : "okunamadı") + ")"); }
      }
      return { files: files.length, added, skipped, state: changed() };
    });
    handle("capture:url", async (url) => {
      url = C.str(url, 2000).trim();
      if (!C.isWebUrl(url)) throw new Error("Yalnız http:// ya da https:// ile başlayan tek bir sayfa adresi girin.");
      const ok = await approve("Bu sayfa indirilsin mi?",
        "Adres: " + url + "\nTek GET isteği; çerez ve oturum bilgisi gönderilmez, en çok 5 MB.\nSayfadaki bağlantılar izlenmez, başka sayfa indirilmez, betik çalıştırılmaz.\n\nBetikle sonradan yüklenen tablolar görünmeyebilir; o durumda tabloyu tarayıcıda seçip kopyalayın.", "İndir");
      if (!ok) return { approved: false };
      if (TEST) testLog("fetched.txt", url);
      let page;
      try { page = await net.fetchPage(url); } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (/ENOTFOUND|ECONNREFUSED|fetch failed|ETIMEDOUT|timeout|aborted/i.test(msg)) throw new Error("Sayfaya ulaşılamadı (adresi ve ağ bağlantısını denetleyin).");
        throw new Error(msg);
      }
      const isHtml = /html/i.test(page.contentType) || /<(html|table|body)\b/i.test(page.html.slice(0, 5000));
      const ds = addDataset({ html: isHtml ? page.html : "", text: isHtml ? "" : page.html, via: "adres", url: page.finalUrl });
      data.counters.pages++;
      return { approved: true, ...capInfo(ds), bytes: page.bytes, state: changed() };
    });
    handle("capture:sample", () => {
      for (const s of SAMPLE.sources.slice().reverse()) addDataset({ html: s.html || "", text: s.text || "", via: "ornek", url: s.url, title: s.title }, { key: s.key, at: new Date(SAMPLE.BASE) });
      return { added: SAMPLE.sources.length, state: changed() };
    });

    // Tablo düzenleme (yalnız yerel)
    handle("ds:open", (id) => { if (id) getDs(id); data.active = id || null; return changed(); });
    handle("ds:rename", (id, name) => { const d = getDs(id); editable(d); const n = C.str(name, 120).trim(); if (!n) throw new Error("Ad boş olamaz."); d.name = n; return changed(); });
    handle("ds:choose", (id, idx) => { const d = getDs(id); editable(d); C.selectCandidate(d, Number(idx), data.settings); data.counters.edits++; return changed(); });
    handle("ds:header", (id, n) => { const d = getDs(id); editable(d); C.setHeaderRows(d, Number(n), data.settings); data.counters.edits++; return changed(); });
    handle("ds:column", (id, src, patch) => { const d = getDs(id); editable(d); C.setColumn(d, Number(src), patch); data.counters.edits++; return changed(); });
    handle("ds:archive", (id) => { const d = getDs(id); d.status = "arsiv"; return changed(); });
    handle("ds:restore", (id) => { const d = getDs(id); d.status = "acik"; return changed(); });
    handle("link:open", async (id) => {
      const d = getDs(id);
      const url = d.source.url;
      if (!url || !C.isWebUrl(url)) throw new Error("Açılacak kaynak adresi yok.");
      if (TEST) { testLog("opened.txt", url); return { opened: url }; }
      await shell.openExternal(url);
      return { opened: url };
    });

    // Dışa aktarma
    handle("export:csv", (id, opts) => doExport(id, "csv", opts));
    handle("export:json", (id, opts) => doExport(id, "json", opts));
    handle("export:backup", async () => {
      const file = await pickSave("insight-table-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "insight-table", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, datasets: data.datasets }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ (tek tablo; her istek ayrı onaylı; yalnız sütun adı ve şüpheli değer işareti)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:suggest", async (id) => {
      const d = getDs(id); editable(d);
      const p = C.aiPayload(d);
      const prov = providerInfo();
      const ok = await approve("Bu tablonun sütunları MyMind ile gözden geçirilsin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.cols + " sütunun adı ve türü\n• İlk " + p.sent.rows + " satırdan örnek değerler (en çok 60 karakter)" +
        (p.sent.masked ? "\n• " + p.sent.masked + " kişisel veri parçası (e-posta, telefon, T.C. kimlik, IBAN, kart) maskelenerek" : "") + "\n• Kaynak adresi, dosya adı ve diğer satırlar gönderilmez" +
        "\n\nMyMind yalnız sütun adı önerir ve şüpheli değerleri işaretler; hücre değeri öneremez, öneriler denetlenir. Uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 900), p, d);
      d.ai = { ...res, at: now().toISOString() };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, names: Object.keys(res.names).length, flags: res.flags.length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", (id, onlyAuto) => { const d = getDs(id); editable(d); const n = C.applyAiNames(d, onlyAuto); return { applied: n, state: changed() }; });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
