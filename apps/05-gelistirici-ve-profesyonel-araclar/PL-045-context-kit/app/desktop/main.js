/* Context Kit — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): klasör/sayfa seç → ilgili parçaları ve dosya ağacını önizle → sır filtresi → boyut limitli bağlam paketi dışa aktar.
 * • Klasör yalnız okunur (hiçbir dosya değiştirilmez); sembolik bağlantı izlenmez; hariç klasörlere girilmez; en çok 2000 dosya, dosya başına 1 MB.
 * • Sayfa: yapıştırılan metin, panodaki HTML/metin ya da .html/.md/.txt dosyası (indirme yok).
 * • Paket token bütçesine sığar, sırlar gizlenir; yazılan dosya yeniden okunup denetlenir (bütçe, kalan sır, uyarı başlığı).
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı; yalnız görev, yollar ve parça başlıkları gider. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.CK_USER_DATA) app.setPath("userData", process.env.CK_USER_DATA);
const TEST = process.env.CK_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const PAGE_EXT = /\.(html?|md|markdown|txt)$/i;
const MAX_PAGE = 4 * 1024 * 1024;
const PREVIEW_CHARS = 60000;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), kits: [], active: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "paketler.bin" : "paketler.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.CK_NOW ? new Date(process.env.CK_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — kaynak kod ve sayfalar özel olabilir) ----
function writeAtomic(file, buf) { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + ".tmp"; fs.writeFileSync(tmp, buf); fs.renameSync(tmp, file); }
function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : {};
    data.settings = C.normalizeSettings(d.settings);
    data.kits = C.normalizeKits(d.kits);
    data.active = data.kits.some((x) => x.id === d.active) ? d.active : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Hub istemci anahtarı ----
const keyFile = () => path.join(app.getPath("userData"), "mymind-key.bin");
function readKey() { if (memoryKey) return memoryKey; try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch { /* yok */ } return null; }
function writeKey(key) {
  if (key == null) { memoryKey = null; fs.rmSync(keyFile(), { force: true }); return "none"; }
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

// ---- Klasör tarama (salt okunur) ----
function walk(dir, rulesText) {
  const rules = C.parseRules(rulesText);
  const out = [];
  const stack = [""];
  let total = 0;
  while (stack.length && out.length < C.MAX_FILES) {
    const rel = stack.pop();
    let entries;
    try { entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true }); } catch { continue; }
    entries.sort((a, b) => b.name.localeCompare(a.name));
    for (const e of entries) {
      const r = rel ? rel + "/" + e.name : e.name;
      if (e.isSymbolicLink()) { out.push({ path: r, size: 0, excluded: "sembolik bağlantı (izlenmez)" }); continue; }
      if (e.isDirectory()) {
        const why = C.excludeReason(r + "/", 0, rules, C.DEFAULTS);
        if (why) out.push({ path: r + "/", size: 0, excluded: why });
        else stack.push(r);
        continue;
      }
      if (!e.isFile()) continue;
      let size = 0;
      try { size = fs.statSync(path.join(dir, r)).size; } catch { continue; }
      const why = C.excludeReason(r, size, rules, C.DEFAULTS);
      if (why || total + size > C.MAX_TOTAL) { out.push({ path: r, size, excluded: why || "toplam 8 MB sınırı" }); continue; }
      let buf;
      try { buf = fs.readFileSync(path.join(dir, r)); } catch { out.push({ path: r, size, excluded: "okunamadı" }); continue; }
      if (buf.subarray(0, 8000).includes(0)) { out.push({ path: r, size, excluded: "ikili dosya" }); continue; }
      total += size;
      out.push({ path: r, size, text: buf.toString("utf8") });
      if (out.length >= C.MAX_FILES) break;
    }
  }
  return out;
}
function rulesOf(kit) { return [data.settings.globalRules, kit.rules].filter(Boolean).join("\n"); }
/** Kaynaklardan dosyaları yeniden kurar: klasörler diskten yeniden okunur, örnek proje gömülü, sayfalar saklı metinden. */
function rebuild(kit) {
  const raw = [];
  const pages = kit.files.filter((f) => f.page);
  for (const s of kit.sources) {
    if (s.kind === "klasor") { const prefix = kit.sources.filter((x) => x.kind === "klasor").length > 1 ? s.label + "/" : ""; const list = walk(s.root, rulesOf(kit)); s.files = list.length; for (const f of list) raw.push({ ...f, path: prefix + f.path }); }
    if (s.kind === "ornek") { s.files = SAMPLE.files.length; for (const f of SAMPLE.files) raw.push({ path: f.path, size: f.text.length, text: f.text }); }
  }
  for (const p of pages) raw.push({ path: p.path, size: p.size, text: p.text, page: true });
  kit.files = C.buildFiles(raw, rulesOf(kit));
  for (const k of Object.keys(kit.pins)) { const p = k.split("#")[0]; if (!kit.files.some((f) => f.path === p)) delete kit.pins[k]; }
  if (kit.ai) kit.ai.order = kit.ai.order.filter((p) => kit.files.some((f) => f.path === p));
}

// ---- Durum ----
function packOf(kit) { return C.buildPackage(kit); }
function summary(k) {
  const p = packOf(k);
  return { id: k.id, name: k.name, status: k.status, createdAt: k.createdAt, files: k.files.filter((f) => !f.excluded).length, excluded: k.files.filter((f) => f.excluded).length, tokens: p.tokens, budget: k.budget, reduction: p.reduction, secrets: k.files.reduce((s, f) => s + f.secrets, 0), injections: k.files.reduce((s, f) => s + f.injection.length, 0), exports: k.exports.length, ai: !!k.ai, sample: !!k.sampleKey, hasTask: !!k.task.trim() };
}
function detail(k) {
  const p = packOf(k);
  const gold = k.sampleKey ? SAMPLE.tasks.find((t) => t.key === k.sampleKey) : null;
  return {
    id: k.id, name: k.name, task: k.task, budget: k.budget, rules: k.rules, status: k.status, createdAt: k.createdAt, sources: k.sources, useAi: k.useAi, ai: k.ai, exports: k.exports.slice().reverse(), pins: k.pins, sampleKey: k.sampleKey,
    files: k.files.map((f) => ({ path: f.path, size: f.size, tokens: f.tokens, lang: f.lang, excluded: f.excluded, secrets: f.secrets, secretTypes: f.secretTypes, injection: f.injection, score: f.score, page: f.page, chunks: f.chunks.map((c) => ({ id: c.id, start: c.start, end: c.end, tokens: c.tokens, head: c.head, score: c.score || 0 })) })),
    pkg: { tokens: p.tokens, budget: p.budget, full: p.full, reduction: p.reduction, terms: p.terms, blocks: p.blocks, chosenIds: p.chosenIds, selectedFiles: p.selectedFiles, skipped: p.skipped, redactions: p.redactions, injections: p.injections, over: p.over, text: p.text.slice(0, PREVIEW_CHARS), cut: p.text.length > PREVIEW_CHARS },
    coverage: gold ? C.coverage(p, SAMPLE.resolve(gold.required)) : null,
  };
}
function view() {
  const act = data.kits.find((x) => x.id === data.active) || null;
  const log = [];
  for (const k of data.kits) for (const e of k.exports) log.push({ ...e, kitId: k.id, kitName: k.name });
  log.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const samples = SAMPLE.tasks.map((t) => {
    const kit = { name: t.name, task: t.task, budget: t.budget, files: C.buildFiles(SAMPLE.files, ""), pins: {} };
    const p = C.buildPackage(kit);
    return { key: t.key, name: t.name, budget: t.budget, ...C.coverage(p, SAMPLE.resolve(t.required)), reduction: p.reduction, tokens: p.tokens, full: p.full };
  });
  return { settings: data.settings, list: data.kits.map(summary), active: act ? detail(act) : null, exportsLog: log.slice(0, 200), metrics: C.metrics(data.kits, data.counters), samples, now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getKit(id) { const x = data.kits.find((k) => k.id === id); if (!x) throw new Error("Paket bulunamadı."); return x; }
const editable = (k) => { if (k.status === "arsiv") throw new Error("Arşivdeki paket düzenlenemez; önce geri alın."); };

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 1060, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Context Kit", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
async function pickDir() {
  if (TEST) return testRead("dir.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Proje klasörünü seçin (yalnız okunur)", properties: ["openDirectory"] });
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
}
async function pickFiles() {
  if (TEST) { const t = testRead("pick.txt"); return t ? t.split("\n").filter(Boolean) : []; }
  const r = await dialog.showOpenDialog(win, { title: "Sayfa ya da belge seçin", properties: ["openFile", "multiSelections"], filters: [{ name: "Sayfa ve metin", extensions: ["html", "htm", "md", "txt"] }] });
  return r.canceled ? [] : r.filePaths;
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Paketi kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

function newKit(extra) {
  if (data.kits.length >= C.MAX_KITS) throw new Error("Paket sınırına (" + C.MAX_KITS + ") ulaşıldı. Eskileri arşivleyin.");
  const k = C.normalizeKit({ id: C.uid(), name: "Yeni bağlam paketi", createdAt: now().toISOString(), budget: data.settings.defaultBudget, ...(extra || {}) });
  data.kits.unshift(k);
  data.active = k.id;
  data.counters.kits++;
  return k;
}
function addPage(kit, name, text, kind) {
  const base = C.normPath(name).replace(/[^\wçğıöşüÇĞİÖŞÜ.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "sayfa";
  let p = "sayfa/" + base + (/\.(md|txt|html?)$/i.test(base) ? "" : ".md"), n = 2;
  while (kit.files.some((f) => f.path === p)) p = "sayfa/" + base.replace(/(\.\w+)?$/, "-" + n++ + "$1") + (/\.(md|txt|html?)$/i.test(base) ? "" : ".md");
  kit.files.push({ path: p, size: text.length, text, page: true, excluded: null, chunks: [], secrets: 0, injection: [] });
  kit.sources.push({ kind, root: "", label: p, at: now().toISOString(), files: 1 });
  rebuild(kit);
  data.counters.pages++;
  return p;
}
const slug = (s) => C.fold(s || "paket").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "paket";

async function doExport(id, format) {
  const k = getKit(id);
  if (!k.files.some((f) => !f.excluded)) throw new Error("Pakette kaynak yok. Önce klasör ya da sayfa ekleyin.");
  const p = C.buildPackage(k);
  const body = format === "json" ? C.packageJson(k, p) : p.text;
  let file = "";
  let back = body;
  if (format === "pano") { clipboard.writeText(body); back = clipboard.readText(); file = "pano"; }
  else {
    const f = await pickSave(slug(k.name) + "." + format, format);
    if (!f) return { cancelled: true };
    fs.writeFileSync(f, body, "utf8");
    back = fs.readFileSync(f, "utf8");
    file = path.basename(f);
  }
  // Yazılan paket yeniden okunup denetlenir (JSON'da parça içerikleri birleştirilerek)
  let check;
  if (format === "json") { const j = JSON.parse(back); const all = j.parcalar.map((x) => x.icerik).join("\n") + "\n" + j.uyari; check = C.verifyPackage(all, Infinity); check.tokens = C.estTokens(back); check.withinBudget = p.tokens <= k.budget; check.ok = check.withinBudget && !check.secretsLeft; }
  else check = C.verifyPackage(back, k.budget);
  const gold = k.sampleKey ? SAMPLE.tasks.find((t) => t.key === k.sampleKey) : null;
  const cov = gold ? C.coverage(p, SAMPLE.resolve(gold.required)) : null;
  const e = C.normalizeExport({ at: now().toISOString(), format, file, tokens: p.tokens, budget: k.budget, full: p.full, reduction: p.reduction, blocks: p.blocks.length, redactions: p.redactions, secretsLeft: check.secretsLeft, ok: check.ok, coverage: cov ? cov.coverage : null });
  k.exports.push(e);
  if (k.exports.length > 50) k.exports.shift();
  data.counters.exports++;
  data.counters.redactions += p.redactions;
  data.counters.secretsLeft += check.secretsLeft;
  if (!check.withinBudget) data.counters.overBudget++;
  data.counters.tokensOut += p.tokens;
  data.counters.tokensFull += p.full;
  return { ...e, check, state: changed() };
}

// ---- Yapay zekâ ----
const hubUrl = () => (TEST && process.env.CK_HUB_URL) || net.HUB_URL;
function providerInfo() {
  const s = data.settings;
  return s.provider === "yerel" ? { name: "Yerel model (" + s.localUrl + (s.localModel ? ", " + s.localModel : "") + ")", base: s.localUrl, key: null, model: s.localModel || "local-model" } : { name: "MyMind — PluginLabs Hub (127.0.0.1:47632)", base: hubUrl(), key: readKey(), model: "mymind-lite" };
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

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.context-kit");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      const rulesChanged = "globalRules" in patch && patch.globalRules !== data.settings.globalRules;
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      if (rulesChanged) for (const k of data.kits) if (k.status !== "arsiv") rebuild(k);
      return changed();
    });

    handle("kit:new", () => { newKit(); return changed(); });
    handle("kit:open", (id) => { if (id) getKit(id); data.active = id || null; return changed(); });
    handle("kit:set", (id, patch) => {
      const k = getKit(id); editable(k);
      patch = patch || {};
      if ("name" in patch) { const n = C.str(patch.name, 120).trim(); if (!n) throw new Error("Ad boş olamaz."); k.name = n; }
      if ("task" in patch) k.task = C.str(patch.task, 4000);
      if ("budget" in patch) { const b = Math.floor(Number(patch.budget)); if (!(b >= 1000 && b <= 400000)) throw new Error("Bütçe 1.000 ile 400.000 token arasında olmalı."); k.budget = b; }
      if ("useAi" in patch) k.useAi = !!patch.useAi;
      if ("rules" in patch) { k.rules = C.str(patch.rules, 6000); rebuild(k); }
      return changed();
    });
    handle("kit:addFolder", async (id) => {
      const k = getKit(id); editable(k);
      const dir = await pickDir();
      if (!dir) return { cancelled: true };
      if (!fs.statSync(dir).isDirectory()) throw new Error("Klasör seçin.");
      if (k.sources.some((s) => s.kind === "klasor" && s.root === dir)) throw new Error("Bu klasör zaten ekli. Değişiklikleri almak için “Yeniden tara”.");
      k.sources.push({ kind: "klasor", root: dir, label: path.basename(dir), at: now().toISOString(), files: 0 });
      if (k.name === "Yeni bağlam paketi") k.name = path.basename(dir);
      rebuild(k);
      data.counters.folders++;
      const inc = k.files.filter((f) => !f.excluded).length;
      return { folder: path.basename(dir), included: inc, excluded: k.files.length - inc, state: changed() };
    });
    handle("kit:rescan", (id) => { const k = getKit(id); editable(k); rebuild(k); return { files: k.files.filter((f) => !f.excluded).length, state: changed() }; });
    handle("kit:addPage", (id, text, html, title) => {
      const k = getKit(id); editable(k);
      const isHtml = typeof html === "string" && /<\w+[^>]*>/.test(html);
      const body = isHtml ? C.htmlToText(html) : C.str(text, MAX_PAGE);
      if (!body.trim()) throw new Error("Sayfa metnini yapıştırın.");
      const p = addPage(k, C.str(title, 80).trim() || (isHtml && C.htmlTitle(html)) || body.split("\n").find((l) => l.trim()) || "sayfa", body, "sayfa");
      return { path: p, state: changed() };
    });
    handle("kit:addClipboard", (id) => {
      const k = getKit(id); editable(k);
      const html = clipboard.readHTML() || "", text = clipboard.readText() || "";
      const body = html.trim() ? C.htmlToText(html) : text;
      if (!body.trim()) throw new Error("Panoda metin yok. Sayfada içeriği seçip kopyalayın (Ctrl+C).");
      const p = addPage(k, (html && C.htmlTitle(html)) || body.split("\n").find((l) => l.trim()) || "pano", body, "sayfa");
      return { path: p, state: changed() };
    });
    handle("kit:addFiles", async (id) => {
      const k = getKit(id); editable(k);
      const files = (await pickFiles()).slice(0, 20);
      if (!files.length) return { cancelled: true };
      const added = [], skipped = [];
      for (const f of files) {
        try {
          const st = fs.statSync(f);
          if (!st.isFile() || !PAGE_EXT.test(f)) { skipped.push(path.basename(f) + " (desteklenmeyen tür)"); continue; }
          if (st.size > MAX_PAGE) { skipped.push(path.basename(f) + " (4 MB üstü)"); continue; }
          const raw = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
          const body = /\.html?$/i.test(f) ? C.htmlToText(raw) : raw;
          if (!body.trim()) { skipped.push(path.basename(f) + " (boş)"); continue; }
          added.push(addPage(k, path.basename(f).replace(/\.html?$/i, ".md"), body, "dosya"));
          data.counters.files++;
        } catch (err) { skipped.push(path.basename(f) + " (okunamadı)"); }
      }
      return { added: added.length, skipped, state: changed() };
    });
    handle("kit:removeSource", (id, idx) => {
      const k = getKit(id); editable(k);
      const s = k.sources[Number(idx)];
      if (!s) throw new Error("Kaynak bulunamadı.");
      k.sources.splice(Number(idx), 1);
      if (s.kind === "sayfa" || s.kind === "dosya") k.files = k.files.filter((f) => f.path !== s.label);
      rebuild(k);
      return changed();
    });
    handle("kit:pin", (id, key, mode) => {
      const k = getKit(id); editable(k);
      const p = C.str(key, 520).split("#")[0];
      if (!k.files.some((f) => f.path === p && !f.excluded)) throw new Error("Bu dosya pakette kullanılamaz (hariç tutulmuş ya da yok).");
      if (mode === "in" || mode === "out") k.pins[key] = mode; else delete k.pins[key];
      return changed();
    });
    handle("kit:archive", (id) => { getKit(id).status = "arsiv"; return changed(); });
    handle("kit:restore", (id) => { getKit(id).status = "acik"; return changed(); });
    handle("kit:sample", () => {
      for (const t of SAMPLE.tasks.slice().reverse()) {
        const k = newKit({ name: "Örnek · " + t.name, task: t.task, budget: t.budget, sampleKey: t.key, createdAt: new Date(SAMPLE.BASE).toISOString() });
        k.sources.push({ kind: "ornek", root: SAMPLE.root, label: SAMPLE.root + " (örnek proje)", at: k.createdAt, files: 0 });
        rebuild(k);
      }
      return { added: SAMPLE.tasks.length, state: changed() };
    });

    handle("export:md", (id) => doExport(id, "md"));
    handle("export:json", (id) => doExport(id, "json"));
    handle("export:clipboard", (id) => doExport(id, "pano"));

    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:rank", async (id) => {
      const k = getKit(id); editable(k);
      if (!k.task.trim()) throw new Error("Önce görevi yazın; sıralama göreve göre yapılır.");
      const p = C.aiPayload(k);
      if (!p.sent.files) throw new Error("Pakette kaynak yok.");
      const prov = providerInfo();
      const ok = await approve("Dosyalar MyMind ile göreve göre sıralansın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Görev metni\n• " + p.sent.files + " dosyanın yolu, token tahmini ve en çok 3 parça başlığı (" + p.sent.total + " dahil dosyadan en ilgili olanlar)" +
        (p.sent.masked ? "\n• " + p.sent.masked + " sır/kişisel veri parçası gizlenerek" : "") + "\n• Dosya içerikleri ve klasör yolu gönderilmez" +
        "\n\nMyMind yalnız sıralama ve kısa özet önerir; olmayan yollar atılır, özet sansürlenir ve pakette “tahmin” olarak işaretlenir.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 700), p);
      k.ai = { ...res, at: now().toISOString() };
      k.useAi = true;
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, order: res.order.length, summary: !!res.summary, dropped: res.dropped, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
function assertOwn(e) { if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek."); }
