/* Notion Bridge — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): izinli Notion hedefi seç → şemayı oku → alan eşleştir → taslak önizle → kaydet. İlk sürüm: tek veritabanına kart ekleme.
 * • İçerik yalnız kullanıcının verdiği metindir (yapıştırma, pano — düğme ya da genel kısayol —, .txt/.md dosyası). Sayfa indirilmez.
 * • Notion'a yalnız kullanıcının kendi entegrasyon anahtarıyla ve her işlemde ayrı onayla gidilir: şema okuma, mükerrer sorgusu, yeni sayfa ekleme.
 *   Var olan sayfa DEĞİŞTİRİLMEZ (PATCH/silme ucu yoktur). Kayıt öncesi taslak şemaya göre doğrulanır; uyumsuz taslak gönderilmez.
 * • Aynı girdi ikinci kez kaydedilmez (yerel parmak izi defteri + isteğe bağlı Notion'da başlık sorgusu).
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, veri azaltılmış; öneri aynı şema denetiminden geçer. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell, globalShortcut, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.NB_USER_DATA) app.setPath("userData", process.env.NB_USER_DATA);
const TEST = process.env.NB_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20;
const SHORTCUT = "CommandOrControl+Alt+N";

let win = null;
let memoryKeys = { notion: null, mymind: null };
let shortcutOk = false;
let data = { settings: C.normalizeSettings({}), schema: null, items: [], active: null, ledger: [], counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "kopru.bin" : "kopru.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.NB_NOW ? new Date(process.env.NB_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — içerik kişiseldir) ----
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
    data.schema = C.normalizeSchema(d.schema);
    data.items = C.normalizeItems(d.items);
    data.active = data.items.some((x) => x.id === d.active) ? d.active : null;
    data.ledger = C.normalizeLedger(d.ledger);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Anahtarlar (Notion entegrasyon anahtarı, Hub istemci anahtarı): kasada şifreli, arayüze hiç verilmez ----
const keyFile = (k) => path.join(app.getPath("userData"), k + "-key.bin");
function readKey(k) {
  if (memoryKeys[k]) return memoryKeys[k];
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile(k))); } catch { /* yok */ }
  return null;
}
function writeKey(k, key, valid, hint) {
  if (key == null) { memoryKeys[k] = null; fs.rmSync(keyFile(k), { force: true }); return "none"; }
  if (typeof key !== "string" || !valid(key.trim())) throw new Error(hint);
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(k), safeStorage.encryptString(key.trim())); memoryKeys[k] = null; return "vault"; }
  memoryKeys[k] = key.trim();
  return "memory";
}

// ---- Durum ----
function view() {
  const it = data.items.find((x) => x.id === data.active) || null;
  const gold = data.items.some((x) => x.sampleKey) ? C.evaluateGold(data.items.filter((x) => x.dbId === C.parseDatabaseId(SAMPLE.schema.id)), SAMPLE.gold) : null;
  const errors = it && data.schema && it.status === "taslak" ? C.validateDraft(data.schema, it.values) : [];
  return {
    settings: data.settings, schema: data.schema, items: data.items, active: it ? it.id : null, activeErrors: errors, metrics: C.metrics(data.items, data.counters), gold, counters: data.counters,
    ledgerCount: data.ledger.length, now: now().toISOString(), vault: vault(), hasNotion: !!readKey("notion"), hasKey: !!readKey("mymind"), platform: process.platform, shortcut: { accel: SHORTCUT, ok: shortcutOk },
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getItem(id) { const x = data.items.find((i) => i.id === id); if (!x) throw new Error("Taslak bulunamadı."); return x; }
const editable = (x) => { if (x.status !== "taslak") throw new Error("Yalnız taslak durumundaki kayıt düzenlenebilir (" + C.STATUS_NAMES[x.status] + ")."); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Notion Bridge", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title: "Metin dosyalarını seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Metin", extensions: ["txt", "md", "markdown"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- İçerik yakalama (yalnız kullanıcının verdiği metin) ----
function addDraft(input, extra) {
  if (data.items.length >= C.MAX_ITEMS) throw new Error("Kayıt sınırına (" + C.MAX_ITEMS + ") ulaşıldı. Kayıtları dışa aktarıp yedekten yeni başlangıç yapın.");
  const x = C.createDraft(data.schema, input, ((extra && extra.at) || now()).toISOString());
  if (extra && extra.key) x.sampleKey = extra.key;
  data.items.unshift(x);
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
  const text = clipboard.readText();
  if (!text || !text.trim()) throw new Error("Panoda metin yok. İçeriği seçip kopyalayın (Ctrl+C), sonra yeniden deneyin.");
  const x = addDraft({ text, via: "pano" });
  data.counters.clipboard++;
  if (via === "kisayol") data.counters.shortcut++;
  return x;
}
const filledCount = (x) => Object.keys(x.values).length;

// ---- Yapay zekâ sağlayıcısı ----
const hubUrl = () => (TEST && process.env.NB_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel"
    ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" }
    : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey("mymind"), model: "mymind-lite" };
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
// ---- Notion ----
const notionTestBase = () => (TEST && process.env.NB_NOTION_URL) || "";
async function notionCall(method, p, body) {
  const token = readKey("notion");
  if (!token) throw new Error("Önce Hedef ve şema bölümünden Notion bağlantı anahtarını girin.");
  if (TEST) testLog("notion-sent.json", JSON.stringify({ method, path: p, body: body || null }));
  try { return await net.notion({ method, path: p, body, token, testBase: notionTestBase() }); } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/ENOTFOUND|ECONNREFUSED|fetch failed|ETIMEDOUT|timeout/i.test(msg)) throw Object.assign(new Error("Notion'a ulaşılamadı (ağ bağlantısını denetleyin). Taslak yerelde duruyor; CSV ile de aktarabilirsiniz."), { status: 0 });
    throw err;
  }
}
const describeValue = (v) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "evet" : "hayır") : String(v)).replace(/\s+/g, " ").slice(0, 80);

// ---- Genel kısayol: panodaki seçili içerik yeni taslak olur (yalnız tuşa basıldığında okunur) ----
function applyShortcut() {
  try { globalShortcut.unregister(SHORTCUT); } catch { /* yok */ }
  shortcutOk = false;
  if (!data.settings.shortcut || process.env.NB_NO_SHORTCUT) return;
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => {
      try {
        const x = captureClipboard("kisayol");
        changed();
        if (Notification.isSupported()) new Notification({ title: "Notion Bridge", body: "Yeni taslak: " + filledCount(x) + " alan eşlendi. Kaydetmeden önce önizleyin.", silent: true }).show();
      } catch (err) {
        if (Notification.isSupported()) new Notification({ title: "Notion Bridge", body: String(err && err.message ? err.message : err), silent: true }).show();
      }
    });
  } catch { shortcutOk = false; }
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.notion-bridge");
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

    // Hedef ve şema
    handle("target:setToken", (token) => {
      const r = { stored: writeKey("notion", token, C.isToken, "Anahtar biçimi geçersiz. Notion → Ayarlar → Bağlantılar → “Entegrasyon geliştir” sayfasındaki dahili entegrasyon anahtarını (secret_… ya da ntn_…) yapıştırın.") };
      push();
      return r;
    });
    handle("target:fetch", async (input) => {
      const id = C.parseDatabaseId(input);
      if (!id) throw new Error("Notion veritabanı bağlantısı ya da kimliği anlaşılamadı. Veritabanını tam sayfa açıp adres çubuğundaki bağlantıyı kopyalayın.");
      if (!readKey("notion")) throw new Error("Önce Notion bağlantı anahtarını girin.");
      const ok = await approve("Notion'dan veritabanı şeması okunsun mu?",
        "Hedef: api.notion.com — yalnız okuma.\nİstek: veritabanı " + id + " için alan adları, türleri ve seçenekleri.\nGönderilen: veritabanı kimliği ve bağlantı anahtarınız (yalnız Notion'a). Taslaklarınız gönderilmez.\n\nŞema bu bilgisayarda saklanır; Notion'da hiçbir şey değişmez.", "Şemayı oku");
      if (!ok) return { approved: false };
      const schema = C.parseNotionDatabase(await notionCall("GET", "/v1/databases/" + id));
      schema.fetchedAt = now().toISOString();
      data.schema = schema;
      data.counters.schemaReads++;
      let remapped = 0;
      for (const x of data.items) if (x.status === "taslak") { C.remap(schema, x, x.createdAt); remapped++; }
      const st = changed();
      return { approved: true, title: schema.title, props: schema.properties.length, writable: schema.properties.filter(C.writable).length, remapped, state: st };
    });
    handle("target:useSample", () => {
      const schema = C.normalizeSchema(SAMPLE.schema);
      schema.fetchedAt = now().toISOString();
      data.schema = schema;
      let remapped = 0;
      for (const x of data.items) if (x.status === "taslak") { C.remap(schema, x, x.createdAt); remapped++; }
      return { remapped, state: changed() };
    });

    // İçerik
    handle("capture:text", (text, source) => { const x = addDraft({ text, ...sourceFrom(source), via: "metin" }); return { filled: filledCount(x), state: changed() }; });
    handle("capture:clipboard", () => { const x = captureClipboard("dugme"); return { filled: filledCount(x), state: changed() }; });
    handle("capture:files", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let added = 0, skipped = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE || !/\.(txt|md|markdown)$/i.test(f)) { skipped++; continue; }
        const text = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
        if (!text.trim()) { skipped++; continue; }
        addDraft({ text, title: path.basename(f), via: "dosya" });
        data.counters.files++;
        added++;
      }
      return { files: files.length, added, skipped, state: changed() };
    });
    handle("capture:sample", () => {
      if (!data.schema || data.schema.source !== "ornek") {
        data.schema = C.normalizeSchema(SAMPLE.schema);
        data.schema.fetchedAt = now().toISOString();
      }
      for (const c of SAMPLE.captures.slice().reverse()) addDraft({ text: c.text, ...c.source, via: "ornek" }, { key: c.key + "-0", at: new Date(SAMPLE.BASE) });
      return { added: SAMPLE.captures.length, state: changed() };
    });

    // Taslak düzenleme (yalnız yerel)
    handle("item:open", (id) => { if (id) getItem(id); data.active = id || null; return changed(); });
    handle("item:set", (id, name, raw) => {
      const x = getItem(id); editable(x);
      if (!data.schema) throw new Error("Önce hedef şemayı seçin.");
      if (x.dbId !== data.schema.id) C.remap(data.schema, x, x.createdAt);
      const r = C.setValue(data.schema, x, name, raw, x.createdAt);
      if (!r.ok) throw new Error("“" + name + "”: " + r.reason);
      return { note: r.reason || "", state: changed() };
    });
    handle("item:remap", (id) => {
      const x = getItem(id); editable(x);
      if (!data.schema) throw new Error("Önce hedef şemayı seçin.");
      C.remap(data.schema, x, x.createdAt);
      return changed();
    });
    handle("item:archive", (id) => { const x = getItem(id); editable(x); x.status = "iptal"; const next = data.items.find((i) => i.status === "taslak"); data.active = next ? next.id : x.id; return changed(); });
    handle("item:restore", (id) => { const x = getItem(id); if (x.status !== "iptal" && x.status !== "mukerrer") throw new Error("Yalnız arşivlenen ya da mükerrer işaretlenen kayıt taslağa geri alınabilir."); x.status = "taslak"; x.dup = null; return changed(); });
    handle("item:save", async (id) => {
      const x = getItem(id); editable(x);
      const schema = data.schema;
      if (!schema) throw new Error("Önce hedef şemayı seçin.");
      if (x.dbId !== schema.id) C.remap(schema, x, x.createdAt);
      const errors = C.validateDraft(schema, x.values);
      if (errors.length) { data.counters.blocked++; save(); push(); throw new Error("Taslak şemaya uymuyor, kaydedilmedi: " + errors.map((e) => (e.name ? e.name + " — " : "") + e.reason).join("; ")); }
      if (schema.source === "ornek") throw new Error("Örnek şema gerçek bir Notion veritabanı değil; kaydedilemez. Hedef ve şema bölümünden kendi veritabanınızı bağlayın ya da taslakları CSV olarak dışa aktarıp Notion'a içe aktarın.");
      const local = C.findDuplicate(data.ledger, schema, x);
      if (local) {
        x.status = "mukerrer"; x.dup = { reason: local.reason, pageUrl: local.entry.pageUrl, savedAt: local.entry.savedAt };
        data.counters.dupLocal++;
        return { duplicate: true, reason: local.reason, state: changed() };
      }
      const tp = schema.properties.find((p) => p.type === "title");
      const title = x.values[tp.name].value;
      const lines = Object.entries(x.values).map(([k, v]) => "• " + k + ": " + describeValue(v.value));
      const ok = await approve("Bu taslak Notion'a yeni kart olarak eklensin mi?",
        "Hedef: " + schema.title + " (api.notion.com)\n" + (data.settings.remoteDupCheck ? "Önce aynı başlıkla kayıt var mı diye sorgulanır (yalnız başlık gönderilir).\n" : "") +
        "Eklenecek " + lines.length + " alan:\n" + lines.join("\n") + "\n\nYalnız yeni sayfa eklenir; var olan sayfalar değiştirilmez. Boş bırakılan alanlar gönderilmez.", "Notion'a ekle");
      if (!ok) return { approved: false };
      if (data.settings.remoteDupCheck) {
        const q = await notionCall("POST", "/v1/databases/" + schema.id + "/query", { filter: { property: tp.name, title: { equals: title } }, page_size: 5 });
        const hit = q && Array.isArray(q.results) ? q.results.find((r) => r && r.object === "page" && !r.archived && !r.in_trash) : null;
        if (hit) {
          x.status = "mukerrer"; x.dup = { reason: "Notion'da aynı başlıkla bir kart zaten var", pageUrl: C.isWebUrl(hit.url) ? hit.url : "", savedAt: C.str(hit.created_time, 40) };
          data.counters.dupRemote++;
          return { duplicate: true, reason: x.dup.reason, state: changed() };
        }
      }
      let page;
      try {
        page = await notionCall("POST", "/v1/pages", { parent: { database_id: schema.id }, properties: C.toNotionProperties(schema, x.values) });
      } catch (err) {
        if (err && err.status === 400) { data.counters.remoteRejected++; save(); push(); throw new Error(err.message + " — Şema Notion'da değişmiş olabilir; Hedef ve şema bölümünden şemayı yeniden okuyun."); }
        throw err;
      }
      x.status = "kaydedildi"; x.pageId = C.str(page && page.id, 40); x.pageUrl = page && C.isWebUrl(page.url) ? page.url : ""; x.savedAt = now().toISOString();
      data.ledger.push({ dbId: schema.id, fp: x.fp, key: C.recordKey(schema, x.values), pageId: x.pageId, pageUrl: x.pageUrl, title: C.str(title, 200), savedAt: x.savedAt });
      data.counters.saves++;
      const next = data.items.find((i) => i.status === "taslak");
      if (next) data.active = next.id;
      return { saved: true, pageUrl: x.pageUrl, state: changed() };
    });
    handle("link:open", async (id, which) => {
      const x = getItem(id);
      const url = which === "kaynak" ? x.input.url : which === "mukerrer" ? x.dup && x.dup.pageUrl : x.pageUrl;
      if (!url || !C.isWebUrl(url)) throw new Error("Açılacak bağlantı yok.");
      if (TEST) { testLog("opened.txt", url); return { opened: url }; }
      await shell.openExternal(url);
      return { opened: url };
    });

    // Dışa aktarma (Notion CSV içe aktarma akışı için de uygundur)
    const forSchema = () => data.items.filter((x) => data.schema && x.dbId === data.schema.id && x.status !== "iptal");
    handle("export:csv", async () => {
      if (!data.schema) throw new Error("Önce hedef şemayı seçin.");
      const list = forSchema().filter((x) => x.status !== "mukerrer" && !C.validateDraft(data.schema, x.values).length);
      if (!list.length) throw new Error("Şemaya uyan taslak ya da kayıt yok.");
      const file = await pickSave("notion-bridge.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.schema, list), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: list.length, skipped: forSchema().length - list.length };
    });
    handle("export:md", async () => {
      if (!data.schema) throw new Error("Önce hedef şemayı seçin.");
      const file = await pickSave("notion-bridge.md", "md");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportMd(data.schema, forSchema()), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: forSchema().length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("notion-bridge-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "notion-bridge", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, schema: data.schema, items: data.items, ledger: data.ledger }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ (tek taslak; her istek ayrı onaylı)
    handle("ai:setKey", (key) => { const r = { stored: writeKey("mymind", key, (k) => /^[A-Za-z0-9._~+/=-]{16,190}$/.test(k), "Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.") }; push(); return r; });
    handle("ai:map", async (id) => {
      const x = getItem(id); editable(x);
      if (!data.schema) throw new Error("Önce hedef şemayı seçin.");
      const p = C.aiPayload(data.schema, x);
      const prov = providerInfo();
      const by = p.sent.byType.map((t) => t.count + " " + t.label).join(", ");
      const ok = await approve("Bu taslak MyMind ile alanlara eşlensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.props + " alanın adı, türü ve seçenekleri\n• Bu taslağın metni (" + p.sent.chars + " karakter" + (p.sent.truncated ? ", ilk " + C.AI_TEXT + " karakter" : "") + ")" +
        (by ? "\n• " + by + " ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") + "\n• Kaynak adresi, başlığı, Notion anahtarı ve diğer taslaklar gönderilmez" +
        "\n\nDönen öneri şemaya göre denetlenir: şemada olmayan alan, olmayan seçenek ve türe uymayan değer atılır. Uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 800), p, data.schema, x.createdAt);
      x.ai = { ...res, at: now().toISOString() };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, count: Object.keys(res.values).length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", (id, onlyEmpty) => {
      const x = getItem(id); editable(x);
      if (!x.ai) throw new Error("Önce MyMind önerisi alın.");
      let n = 0;
      for (const [k, v] of Object.entries(x.ai.values)) {
        if (!C.propOf(data.schema, k)) continue;
        if (onlyEmpty !== false && x.values[k]) continue;
        x.values[k] = v; n++;
      }
      return { applied: n, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("will-quit", () => { try { globalShortcut.unregisterAll(); } catch { /* yok */ } });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
