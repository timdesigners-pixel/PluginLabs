/* Invoice Inbox (PL-049) — masaüstü kabuğu.
 * Yüklenen veya yapıştırılan fatura/fiş belgelerinden satıcı, tarih, vergi ve toplamı taslak çıkarır;
 * kalem + vergi = genel toplam tutarlılığını deterministik hesapla kontrol eder; belirsiz/uyumsuz belgeleri zorunlu incelemeye alır;
 * insan onayı sonrası Finansal Asistan uyumlu CSV'ye aktarır. Muhasebe kaydı veya vergi beyannamesi otomatik gönderilmez.
 * Finansal belgeler ve MyMind anahtarı Windows kasasında (DPAPI safeStorage) şifreli saklanır. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.INV_USER_DATA) app.setPath("userData", process.env.INV_USER_DATA);
const TEST = process.env.INV_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), docs: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "faturalar.bin" : "faturalar.json");
const testLog = (file, line) => { if (TEST) fs.appendFileSync(path.join(TEST, file), line + "\n"); };
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.INV_NOW ? new Date(process.env.INV_NOW) : new Date());

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
    data.active = data.docs.some((x) => x.id === d.active) ? d.active : (data.docs[0] ? data.docs[0].id : null);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() {
  if (memoryKey) return memoryKey;
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* yok */ }
  return null;
}
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) {
    throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  }
  if (vault()) {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim()));
    memoryKey = null;
    return "vault";
  }
  memoryKey = key.trim();
  return "memory";
}

function view() {
  const activeDoc = data.docs.find((x) => x.id === data.active) || null;
  const gold = data.docs.some((x) => x.sampleKey) ? C.evaluateGold(data.docs, SAMPLE.gold) : null;
  return {
    settings: data.settings,
    docs: data.docs,
    active: activeDoc ? activeDoc.id : null,
    metrics: C.metrics(data.docs),
    gold,
    counters: data.counters,
    now: now().toISOString(),
    vault: vault(),
    hasKey: !!readKey(),
    platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getDoc(id) {
  const x = data.docs.find((i) => i.id === id);
  if (!x) throw new Error("Belge bulunamadı.");
  return x;
}

function addDocument(text, meta = {}) {
  const t = C.str(text, C.MAX_DOC_CHARS).trim();
  if (!t) throw new Error("Belge metni boş.");
  if (data.docs.length >= C.MAX_DOCS) throw new Error("Belge sınırına ulaşıldı.");
  const doc = C.parseInvoice(t, { ...meta, settings: data.settings, now: now().toISOString() });
  data.docs.unshift(doc);
  data.active = doc.id;
  data.counters.imported++;
  return doc;
}

const webPreferences = () => ({
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
  spellcheck: false,
});

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1040,
    minHeight: 640,
    useContentSize: true,
    autoHideMenuBar: true,
    title: "Invoice Inbox",
    icon: path.join(root, "icons", "icon256.png"),
    backgroundColor: "#0e1322",
    show: false,
    webPreferences: webPreferences(),
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(root, "app.html"));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.on("closed", () => { win = null; });
}

async function approve(message, detail, okLabel) {
  if (TEST) { testLog("approvals.txt", message + "\n" + detail + "\n----"); return testRead("deny.txt") !== "1"; }
  const r = await dialog.showMessageBox(win, {
    type: "question",
    buttons: [okLabel, "Vazgeç"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
    title: "Onay",
    message,
    detail,
  });
  return r.response === 0;
}
async function pickFiles() {
  if (TEST) { const t = testRead("pick.txt"); return t ? t.split("\n").filter(Boolean) : []; }
  const r = await dialog.showOpenDialog(win, {
    title: "Fatura / fiş belgelerini seçin (.txt, .xml, .html)",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Fatura / Fiş Metni", extensions: ["txt", "xml", "html", "htm", "md"] }],
  });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, {
    title: "Kaydet",
    defaultPath: name,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  return r.canceled || !r.filePath ? null : r.filePath;
}

const hubUrl = () => (TEST && process.env.INV_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
}
async function askModel(messages, maxTokens) {
  const p = providerInfo();
  if (data.settings.provider === "hub" && !p.key) {
    throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
  }
  if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: data.settings.provider, messages }));
  try {
    return await net.chat({ base: p.base, key: p.key, model: p.model, messages, maxTokens });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/ECONNREFUSED|fetch failed/i.test(msg)) {
      throw new Error(data.settings.provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632)." : "Yerel model sunucusuna bağlanılamadı (" + data.settings.localUrl + ").");
    }
    throw new Error(msg);
  }
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
function handle(name, fn) {
  ipcMain.handle(name, async (e, ...a) => {
    assertOwn(e);
    return fn(...a);
  });
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.invoice-inbox");
    load();

    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) {
        throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      }
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    handle("ingest:text", (text, title) => {
      const doc = addDocument(text, { sourceTitle: title || "Yapıştırılan belge", sourceType: "metin" });
      return { docId: doc.id, needsReview: doc.consistency.needsReview, state: changed() };
    });
    handle("ingest:clipboard", () => {
      const text = clipboard.readText();
      if (!text || !text.trim()) throw new Error("Panoda fatura veya fiş metni yok.");
      const doc = addDocument(text, { sourceTitle: "Panodan alınan belge", sourceType: "pano" });
      data.counters.clipboard++;
      return { docId: doc.id, needsReview: doc.consistency.needsReview, state: changed() };
    });
    handle("ingest:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(txt|xml|html|htm|md)$/i.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "");
        if (!text.trim()) { skipped++; continue; }
        addDocument(text, { sourceTitle: path.basename(f), sourceType: "dosya" });
        added++;
        data.counters.files++;
      }
      return { added, skipped, state: changed() };
    });
    handle("ingest:sample", () => {
      let added = 0;
      for (let i = SAMPLE.documents.length - 1; i >= 0; i--) {
        const s = SAMPLE.documents[i];
        if (data.docs.some((d) => d.sampleKey === s.key)) continue;
        addDocument(s.text, { sampleKey: s.key, sourceTitle: s.sourceTitle, sourceType: s.sourceType });
        added++;
      }
      const first = data.docs.find((x) => x.status === "inceleme");
      if (first) data.active = first.id;
      return { added, state: changed() };
    });

    handle("doc:open", (id) => {
      if (id) getDoc(id);
      data.active = id || null;
      return changed();
    });
    handle("doc:update", (id, patch) => {
      const doc = getDoc(id);
      C.updateInvoice(doc, patch || {});
      return changed();
    });
    handle("doc:approve", (id, patch) => {
      const doc = getDoc(id);
      C.approveInvoice(doc, patch || {}, now().getTime());
      data.counters.approved++;
      const next = data.docs.find((x) => x.status === "inceleme");
      data.active = next ? next.id : doc.id;
      return changed();
    });
    handle("doc:reject", (id) => {
      const doc = getDoc(id);
      doc.status = "red";
      doc.rejectedAt = now().getTime();
      const next = data.docs.find((x) => x.status === "inceleme");
      data.active = next ? next.id : doc.id;
      return changed();
    });
    handle("doc:toReview", (id) => {
      const doc = getDoc(id);
      doc.status = "inceleme";
      doc.rejectedAt = 0;
      doc.approvedAt = 0;
      data.active = doc.id;
      return changed();
    });

    handle("export:csv", async () => {
      const approved = data.docs.filter((d) => d.status === "onayli");
      if (!approved.length) throw new Error("CSV'ye aktarmak için önce en az bir belgeyi inceleyip onaylayın.");
      const file = await pickSave("finansal-asistan-faturalar.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.docs), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), count: approved.length, state: view() };
    });
    handle("export:md", async () => {
      const file = await pickSave("fatura-ozeti.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMd(data.docs), "utf8");
      data.counters.exports++;
      save();
      return { file: path.basename(file), count: data.docs.length, state: view() };
    });
    handle("export:backup", async () => {
      const file = await pickSave("invoice-inbox-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(
        file,
        JSON.stringify({ app: "invoice-inbox", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, docs: data.docs }, null, 2),
        "utf8"
      );
      return { file: path.basename(file) };
    });

    handle("ai:setKey", (key) => {
      const r = { stored: writeKey(key) };
      push();
      return r;
    });
    handle("ai:extract", async (id) => {
      const doc = getDoc(id);
      const p = C.aiPayload(doc);
      const prov = providerInfo();
      const ok = await approve(
        "Bu belge için MyMind alan çıkarımı çalıştırılsın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Belge metninin kimlik verisi kırpılmış özeti (" + p.sent.chars + " karakter)\n• TCKN, IBAN, kart numarası, e-posta ve telefon numaraları maskelenir (" + p.sent.maskedCount + " öğe gizlendi)\n\nDönen öneri deterministik matematik kontrolünden (Ara Toplam + KDV = Genel Toplam) geçirilir ve sizin onayınız olmadan uygulanmaz.",
        "Gönder"
      );
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 600), doc);
      doc.ai = res;
      data.counters.aiRuns++;
      return { approved: true, ai: res, state: changed() };
    });
    handle("ai:apply", (id) => {
      const doc = getDoc(id);
      if (!doc.ai) throw new Error("Önce MyMind önerisi alın.");
      C.updateInvoice(doc, {
        vendor: doc.ai.vendor,
        invoiceNo: doc.ai.invoiceNo,
        issueDate: doc.ai.issueDate,
        dueDate: doc.ai.dueDate,
        subtotal: doc.ai.subtotal,
        taxTotal: doc.ai.taxTotal,
        grandTotal: doc.ai.grandTotal,
        reviewNote: doc.ai.note || doc.reviewNote,
      });
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
