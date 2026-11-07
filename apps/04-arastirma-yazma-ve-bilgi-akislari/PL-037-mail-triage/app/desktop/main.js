/* Mail Triage — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Salt okunur pilot: kullanıcının seçtiği .eml / .mbox dosyaları ya da yapıştırdığı ham ileti okunur; posta kutusuna bağlanılmaz,
 * ileti gönderilmez / taşınmaz / silinmez; kaynak dosyalar değiştirilmez. Etiket ve öncelik önerileri, toplu değişiklik önizlemesi ve
 * yanıt taslakları yalnız bu uygulamanın yerel kaydındadır. Yanıt taslağı panoya kopyalanır; gönderim kullanıcının posta uygulamasındadır.
 * İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, tek ileti, veri azaltılmış. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.ML_USER_DATA) app.setPath("userData", process.env.ML_USER_DATA);
const TEST = process.env.ML_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 25 * 1024 * 1024;
const MAX_FILES = 200;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), mails: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "gelen-kutusu.bin" : "gelen-kutusu.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();

// ---- Kalıcılık (atomik; kasa varsa şifreli — e-posta içeriği kişiseldir) ----
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
    data.mails = C.normalizeMails(d.mails);
    data.active = data.mails.some((x) => x.id === d.active) ? d.active : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Durum ----
function summary(m) {
  const f = C.finalOf(m);
  return { id: m.id, from: m.from, subject: m.subject, date: m.date, archived: m.archived, reviewed: m.reviewed, attachments: m.attachments.length, sample: !!m.sampleKey,
    suggested: { labels: m.suggestion.labels, priority: m.suggestion.priority }, final: f, due: m.suggestion.due, hasAi: !!m.ai, preview: C.stripQuoted(m.body).replace(/\s+/g, " ").slice(0, 120) };
}
function view() {
  const m = data.mails.find((x) => x.id === data.active) || null;
  const gold = data.mails.some((x) => x.sampleKey) ? C.evaluateGold(data.mails.filter((x) => !x.archived), SAMPLE.gold) : null;
  return {
    settings: data.settings, mails: data.mails.map(summary), mail: m ? { ...m, final: C.finalOf(m) } : null,
    metrics: C.metrics(data.mails.filter((x) => !x.archived)), gold, counters: data.counters,
    vault: vault(), hasKey: !!readKey(), platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getMail(id) { const m = data.mails.find((x) => x.id === id); if (!m) throw new Error("İleti bulunamadı."); return m; }
const triageOpts = () => ({ myAddresses: data.settings.myAddresses, vip: data.settings.vip });
function retriage(m) { m.suggestion = C.normalizeMail({ suggestion: C.triage(m, triageOpts()) }).suggestion; }

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Mail Triage", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title: "E-posta dosyalarını seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "E-posta", extensions: ["eml", "mbox", "mbx", "txt"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- İçe aktarma (salt okunur; kaynak dosyalar değiştirilmez) ----
/** Ham metinleri ayrıştırır, aynı Message-ID'yi ikinci kez eklemez. */
function addRaw(raws, source, extra) {
  const seen = new Set(data.mails.map((m) => m.messageId).filter(Boolean));
  let added = 0, dup = 0, bad = 0;
  const firstId = [];
  for (const raw of raws) {
    if (data.mails.length >= C.MAX_MAILS) break;
    let m;
    try { m = C.parseEml(raw.text); } catch { bad++; continue; }
    if (!m.from.addr && !m.subject && !m.body) { bad++; continue; }
    if (m.messageId && seen.has(m.messageId)) { dup++; continue; }
    if (m.messageId) seen.add(m.messageId);
    const n = C.normalizeMail({ ...m, source: raw.name || source, sampleKey: raw.key || "", importedAt: Date.now(), ...(extra || {}) });
    retriage(n);
    data.mails.push(n);
    firstId.push(n.id);
    added++;
  }
  data.counters.duplicates += dup;
  if (added) data.counters.imports++;
  return { added, dup, bad, firstId: firstId[0] || null };
}
function rawsFromText(latin1, name) {
  return C.looksLikeMbox(latin1) ? C.splitMbox(latin1).map((t) => ({ text: t, name })) : [{ text: latin1, name }];
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

// ---- MyMind istemci anahtarı: kasada şifreli ----
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
const hubUrl = () => (TEST && process.env.ML_HUB_URL) || net.HUB_URL;
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

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.mail-triage");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      const before = JSON.stringify([data.settings.myAddresses, data.settings.vip]);
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      // Adreslerim ya da önemli kişiler değişince öneriler yeniden hesaplanır; kullanıcının kararları korunur.
      if (JSON.stringify([data.settings.myAddresses, data.settings.vip]) !== before) data.mails.forEach(retriage);
      return changed();
    });

    // İçe aktarma
    handle("mail:importFiles", async () => {
      const files = (await pickFiles()).slice(0, MAX_FILES);
      if (!files.length) return { cancelled: true };
      let raws = [], tooBig = 0;
      for (const f of files) {
        const st = fs.statSync(f);
        if (!st.isFile() || st.size > MAX_FILE) { tooBig++; continue; }
        // Dosya bayt olarak okunur (latin1 = bayt başına bir karakter); karakter kümesi MIME başlıklarından çözülür.
        raws = raws.concat(rawsFromText(fs.readFileSync(f).toString("latin1"), path.basename(f)));
      }
      data.counters.files += files.length - tooBig;
      const r = addRaw(raws, "dosya");
      if (r.firstId && !data.active) data.active = r.firstId;
      const st = changed();
      return { files: files.length, tooBig, ...r, state: st };
    });
    handle("mail:paste", (text) => {
      const t = C.str(text, MAX_FILE);
      if (!/^[\w-]+:\s/m.test(t.slice(0, 4000))) throw new Error("Yapıştırılan metin bir e-posta kaynağına benzemiyor (başlık satırları yok). Posta uygulamanızda “Kaynağı göster / Orijinali göster” ile kopyalayın.");
      const r = addRaw(rawsFromText(Buffer.from(t, "utf8").toString("latin1"), "yapıştırılan"), "yapıştırılan");
      if (r.firstId) data.active = r.firstId;
      const st = changed();
      return { ...r, state: st };
    });
    handle("mail:sample", () => {
      // Örnek ayarlar yalnız ilgili alanlar boşsa yazılır (kullanıcının adresleri ezilmez).
      const s = data.settings;
      let settingsAdded = false;
      if (!s.myAddresses.length && !s.vip.length) { data.settings = C.normalizeSettings({ ...s, ...SAMPLE.settings }); settingsAdded = true; data.mails.forEach(retriage); }
      const r = addRaw(SAMPLE.mails.map((x) => ({ text: Buffer.from(x.raw, "utf8").toString("latin1"), name: "örnek", key: x.key })), "örnek");
      if (r.firstId) data.active = r.firstId;
      const st = changed();
      return { ...r, settingsAdded, state: st };
    });

    // İnceleme ve kararlar (yalnız yerel kayıt)
    handle("mail:open", (id) => { if (id) getMail(id); data.active = id || null; return changed(); });
    handle("mail:decide", (id, patch) => {
      const m = getMail(id);
      patch = patch || {};
      const f = C.finalOf(m);
      const d = { labels: f.labels.slice(), priority: f.priority, important: f.important };
      if (Array.isArray(patch.labels)) d.labels = C.LABELS.filter((l) => patch.labels.includes(l));
      if (C.PRIORITIES.includes(patch.priority)) d.priority = patch.priority;
      if ("important" in patch) d.important = !!patch.important;
      m.decision = d;
      m.reviewed = true;
      return changed();
    });
    handle("mail:accept", (ids) => {
      let n = 0;
      for (const id of Array.isArray(ids) ? ids : [ids]) { const m = getMail(id); if (!m.reviewed) { m.reviewed = true; n++; } }
      const st = changed();
      return { accepted: n, state: st };
    });
    handle("mail:reset", (id) => { const m = getMail(id); m.decision = null; m.reviewed = false; return changed(); });
    handle("mail:archive", (ids, on) => {
      for (const id of Array.isArray(ids) ? ids : [ids]) { const m = getMail(id); m.archived = on !== false; if (m.archived && data.active === id) data.active = null; }
      return changed();
    });
    handle("bulk:preview", (ids, change) => C.bulkPreview(data.mails, ids, change || {}));
    handle("bulk:apply", (ids, change) => {
      const p = C.bulkPreview(data.mails, ids, change || {});
      for (const r of p.rows) {
        const m = getMail(r.id);
        m.decision = { labels: r.after.labels, priority: r.after.priority, important: C.finalOf(m).important };
        m.reviewed = true;
      }
      data.counters.bulk++;
      const st = changed();
      return { applied: p.rows.length, changed: p.changed, warnings: p.warnings, state: st };
    });

    // Yanıt taslağı (gönderilmez)
    handle("draft:make", (id) => { const m = getMail(id); m.draft = C.replyDraft(m, m.suggestion, data.settings.myName); m.draftSource = "kural"; data.counters.drafts++; return changed(); });
    handle("draft:set", (id, text) => { const m = getMail(id); m.draft = C.str(text, 4000); m.draftSource = "elle"; save(); return { ok: true }; });
    handle("draft:copy", (id) => {
      const m = getMail(id);
      if (!m.draft.trim()) throw new Error("Önce bir yanıt taslağı oluşturun.");
      clipboard.writeText(m.draft);
      data.counters.copies++;
      save();
      return { copied: m.draft.length };
    });

    // Dışa aktarma
    handle("export:csv", async () => {
      const file = await pickSave("mail-triage.csv", "csv");
      if (!file) return { cancelled: true };
      const list = data.mails.filter((m) => !m.archived);
      fs.writeFileSync(file, C.exportCsv(list), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: list.length };
    });
    handle("export:md", async () => {
      const file = await pickSave("gelen-kutusu-ozeti.md", "md");
      if (!file) return { cancelled: true };
      const list = data.mails.filter((m) => !m.archived);
      fs.writeFileSync(file, C.exportMd(list), "utf8");
      data.counters.exports++; save();
      return { file: path.basename(file), count: list.length };
    });
    handle("export:backup", async () => {
      const file = await pickSave("mail-triage-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "mail-triage", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, mails: data.mails }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ (tek ileti; her istek ayrı onaylı)
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:suggest", async (id) => {
      const m = getMail(id);
      const opts = { myName: data.settings.myName };
      const p = C.aiPayload(m, opts);
      const prov = providerInfo();
      const by = p.sent.byType.map((x) => x.count + " " + x.label).join(", ");
      const ok = await approve("Bu e-posta MyMind ile incelensin mi?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Yalnız bu ileti: konu ve yeni yazılan gövde (" + p.sent.chars + " karakter" + (p.sent.truncated ? ", ilk " + C.AI_BODY + " karakter" : "") + "); alıntılanan önceki iletiler ve imza atılır\n• Kişi adları [Gönderen] / [Alıcı] olarak; e-posta adresleri ve alan adı gönderilmez" +
        (by ? "\n• " + by + " ⟦n⟧ yer tutucusuyla — değerleri gönderilmez" : "") + "\n• Ek dosyaların yalnız türü (içerikleri gönderilmez)\n\nDiğer iletileriniz gönderilmez. Dönen öneri kurallara göre denetlenir (önem işareti olan ileti Düşük yapılamaz); uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 900), p, m, opts);
      m.ai = { labels: res.labels, priority: res.priority, reason: res.reason, actions: res.actions, due: res.due, clamped: res.clamped };
      if (res.reply && m.draftSource !== "elle") { m.draft = res.reply; m.draftSource = "mymind"; }
      data.counters.aiRuns++;
      if (res.clamped) data.counters.aiClamped++;
      data.counters.aiUnknown += res.unknown;
      const st = changed();
      return { approved: true, clamped: res.clamped, unknown: res.unknown, reply: !!res.reply, state: st };
    });
    handle("ai:apply", (id) => {
      const m = getMail(id);
      if (!m.ai) throw new Error("Önce MyMind önerisi alın.");
      m.decision = { labels: m.ai.labels, priority: m.ai.priority, important: C.finalOf(m).important };
      m.reviewed = true;
      return changed();
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!(win && !win.isDestroyed() && e.sender === win.webContents)) throw new Error("Yetkisiz istek.");
}
