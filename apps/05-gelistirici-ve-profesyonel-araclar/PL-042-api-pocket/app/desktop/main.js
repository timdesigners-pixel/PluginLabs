/* API Pocket — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): istek şablonu → ortam değişkenleri → kullanıcı başlatmalı GET → biçimlenmiş yanıt; örnek veriyle ilk istek.
 * • Ağ yalnız desktop/net.js içinde; arayüz CSP ile ağa kapalı. İstek yalnız "Gönder" ile; zamanlanmış/otomatik istek yok.
 * • Gizli değişkenler yalnız bu süreçte ve Windows kasasında (DPAPI). Kasa yoksa diske yazılmaz (yalnız bellekte).
 *   Arayüze, geçmişe, dışa aktarmaya, onay metnine ve yapay zekâya sır değeri gitmez; yanıtta geçerse ⟦sır:ad⟧ olarak gösterilir.
 * • "Üretim" işaretli ortamda her gönderimden önce ek önizleme ve onay.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, veri azaltılmış. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const sample = require("./sample-server");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.AP_USER_DATA) app.setPath("userData", process.env.AP_USER_DATA);
const TEST = process.env.AP_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const VERSION = require("../package.json").version;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), templates: [], envs: [], history: [], counters: C.normalizeCounters({}), active: null };
const responses = new Map();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "cep.bin" : "cep.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => new Date();

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
    data.templates = (Array.isArray(d.templates) ? d.templates : []).slice(0, C.MAX_TEMPLATES).map((t) => C.normalizeTemplate(t));
    data.envs = (Array.isArray(d.envs) ? d.envs : []).slice(0, C.MAX_ENVS).map((e) => C.normalizeEnv(e));
    data.history = C.normalizeHistory(d.history);
    data.counters = C.normalizeCounters(d.counters);
    data.active = data.templates.some((t) => t.id === d.active) ? d.active : null;
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
}
function save() {
  if (vault()) {
    writeAtomic(dataFile(true), safeStorage.encryptString(JSON.stringify({ version: 1, ...data })));
    fs.rmSync(dataFile(false), { force: true });
  } else {
    // Kasa yok: gizli değişken değerleri diske YAZILMAZ (yalnız bu oturumun belleğinde).
    const envs = data.envs.map((e) => ({ ...e, vars: e.vars.map((x) => (x.secret ? { ...x, v: "" } : x)) }));
    writeAtomic(dataFile(false), JSON.stringify({ version: 1, ...data, envs }));
  }
}

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

const getTpl = (id) => { const t = data.templates.find((x) => x.id === id); if (!t) throw new Error("İstek şablonu bulunamadı."); return t; };
const getEnv = (id) => { const e = data.envs.find((x) => x.id === id); if (!e) throw new Error("Ortam bulunamadı."); return e; };
const activeEnv = () => data.envs.find((e) => e.id === data.settings.activeEnv) || null;
const allSecrets = () => data.envs.flatMap((e) => C.secretValues(e));

function view() {
  const t = data.templates.find((x) => x.id === data.active) || null;
  const env = activeEnv();
  let detail = null;
  if (t) {
    const r = C.resolve(t, env);
    detail = { ...t, preview: { ok: r.ok, errors: r.errors, missing: r.missing, used: r.used, secretsUsed: r.secretsUsed, url: r.masked.url, headers: r.masked.headers }, response: responses.get(t.id) || null };
  }
  return {
    version: VERSION, settings: data.settings, active: t ? t.id : null, detail,
    templates: data.templates.map((x) => ({ id: x.id, name: x.name, url: x.url, folder: x.folder, archived: x.archived, sampleKey: x.sampleKey, updatedAt: x.updatedAt, last: (data.history.find((h) => h.tplId === x.id) || {}).status || null })),
    envs: data.envs.map(C.publicEnv), activeEnv: env ? env.id : null,
    history: data.history.slice(0, 200), metrics: C.metrics(data.templates, data.history, data.counters, allSecrets()),
    vault: vault(), hasKey: !!readKey(), platform: process.platform, sampleRunning: sample.running(),
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "API Pocket", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showMessageBox(win, { type: "question", buttons: [okLabel, "Vazgeç"], defaultId: 1, cancelId: 1, noLink: true, title: "Onay", message, detail });
  return r.response === 0;
}
async function pickOpen(title, exts) {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title, properties: ["openFile"], filters: [{ name: exts.join(", ").toUpperCase(), extensions: exts }] });
  return r.canceled ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

function addTemplate(t) {
  if (data.templates.length >= C.MAX_TEMPLATES) throw new Error("Şablon sınırına (" + C.MAX_TEMPLATES + ") ulaşıldı. Eskileri arşivleyin.");
  const x = C.normalizeTemplate({ ...t, id: null, createdAt: now().toISOString(), updatedAt: now().toISOString() });
  data.templates.unshift(x);
  data.active = x.id;
  return x;
}
function ensureEnv() {
  let e = activeEnv();
  if (!e) { e = C.normalizeEnv({ name: "Varsayılan" }); data.envs.push(e); data.settings.activeEnv = e.id; }
  return e;
}

// ---------------- Gönderim ----------------
async function sendTemplate(id) {
  const t = getTpl(id);
  const env = activeEnv();
  const r = C.resolve(t, env);
  if (!r.ok) { data.counters.blocked++; save(); push(); throw new Error("Gönderilmedi — " + r.errors.join(" ")); }
  if (env && env.production) {
    const ok = await approve("ÜRETİM ortamına istek gönderilsin mi?",
      "Ortam: " + env.name + " (üretim)\nYöntem: GET — sunucuda veri değiştirmemesi beklenir, ancak bazı API'ler GET ile de işlem yapabilir.\nAdres: " + r.masked.url +
      (r.masked.headers.length ? "\nBaşlıklar:\n" + r.masked.headers.map(([k, v]) => "  " + k + ": " + v).join("\n") : "") +
      (r.secretsUsed.length ? "\nKullanılan gizli değişkenler: " + r.secretsUsed.join(", ") + " (değerleri burada gösterilmez)" : ""), "Gönder");
    if (!ok) { data.counters.prodDenied++; save(); push(); return { approved: false, state: view() }; }
    data.counters.prodConfirms++;
  }
  const secrets = allSecrets();
  const at = now();
  const entry = { id: C.uid(), at: at.toISOString(), tplId: t.id, tplName: t.name, env: env ? env.name : "", production: !!(env && env.production), method: "GET", url: r.masked.url, headers: r.masked.headers, status: 0, ms: 0, size: 0, contentType: "", error: "", redacted: 0 };
  data.counters.sends++;
  let res;
  try {
    res = await net.request({ url: r.url, headers: r.headers, timeoutMs: data.settings.timeoutSec * 1000, maxBytes: data.settings.maxBodyMB * 1048576, userAgent: data.settings.userAgent ? "APIPocket/" + VERSION : "" });
  } catch (err) {
    const msg = C.redact(err && err.message ? err.message : String(err), secrets).text;
    entry.error = msg;
    data.counters.failed++;
    data.history.unshift(entry);
    data.history = data.history.slice(0, C.MAX_HISTORY);
    responses.set(t.id, { error: msg, at: entry.at, urlMasked: r.masked.url });
    changed();
    throw new Error(msg);
  }
  const body = C.redact(res.body, secrets);
  const hdrs = res.headers.map(([k, v]) => { const x = C.redact(v, secrets); body.count += x.count; return [k, x.text]; });
  const loc = C.redact(res.location, secrets);
  body.count += loc.count;
  const f = C.formatBody(res.contentType, body.text);
  const fields = f.json !== undefined ? C.fieldList(f.json) : [];
  const st = C.statusInfo(res.status);
  Object.assign(entry, { status: res.status, ms: res.ms, size: res.size, contentType: res.contentType.slice(0, 120), redacted: body.count });
  if (res.status >= 200 && res.status < 300) {
    data.counters.ok++;
    if (data.counters.firstOkMs == null && data.counters.onboardStart) data.counters.firstOkMs = Math.max(0, at.getTime() + res.ms - new Date(data.counters.onboardStart).getTime());
  } else data.counters.failed++;
  data.counters.redactions += body.count;
  data.history.unshift(entry);
  data.history = data.history.slice(0, C.MAX_HISTORY);
  const showTokens = f.tokens && f.tokens.length <= 60000;
  responses.set(t.id, {
    at: entry.at, status: res.status, statusText: st.text, tone: st.tone, ms: res.ms, ttfb: res.ttfb, size: res.size, truncated: res.truncated, binary: res.binary, contentType: res.contentType,
    headers: hdrs, location: loc.text, kind: f.kind, pretty: f.pretty.slice(0, 2000000), tokens: showTokens ? f.tokens : null, parseError: f.error, fields, redacted: body.count, urlMasked: r.masked.url, ai: null,
  });
  return { approved: true, status: res.status, ms: res.ms, redacted: body.count, state: changed() };
}

// ---------------- Örnek veri ----------------
async function startSample() {
  const s = await sample.start();
  let env = data.envs.find((e) => e.sampleKey === "ornek");
  const vars = [
    { k: "base_url", v: s.base, secret: false },
    { k: "api_key", v: s.key, secret: true },
    { k: "kitap_id", v: "3", secret: false },
    { k: "sayfa_boyu", v: "5", secret: false },
  ];
  if (!env) { env = C.normalizeEnv({ ...SAMPLE.env, vars }); data.envs.unshift(env); }
  else for (const v of vars) { const x = env.vars.find((y) => y.k === v.k); if (x) { if (v.k === "base_url" || v.k === "api_key") x.v = v.v; } else env.vars.push(v); }
  data.settings.activeEnv = env.id;
  let first = null;
  for (const st of SAMPLE.templates) {
    let t = data.templates.find((x) => x.sampleKey === st.key);
    if (!t) { t = C.normalizeTemplate({ ...st, sampleKey: st.key, createdAt: now().toISOString() }); data.templates.push(t); }
    else if (t.archived) t.archived = false;
    if (!first) first = t;
  }
  data.active = first.id;
  if (data.counters.firstOkMs == null) data.counters.onboardStart = now().toISOString();
  return { base: s.base, state: changed() };
}

function curlOf(t, env) {
  const r = C.resolve(t, env);
  const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
  return ["curl", q(r.masked.url), ...r.masked.headers.flatMap(([k, v]) => ["-H", q(k + ": " + v)])].join(" ");
}

const hubUrl = () => (TEST && process.env.AP_HUB_URL) || net.HUB_URL;
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

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.api-pocket");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      if ("activeEnv" in patch && patch.activeEnv) getEnv(patch.activeEnv);
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    // Şablonlar
    handle("tpl:new", () => { addTemplate({ name: "Yeni istek", url: "https://", headers: [{ k: "Accept", v: "application/json" }] }); return changed(); });
    handle("tpl:open", (id) => { if (id) getTpl(id); data.active = id || null; return changed(); });
    handle("tpl:set", (id, patch) => {
      const t = getTpl(id);
      patch = patch || {};
      if ("name" in patch) { const n = C.str(patch.name, 120).trim(); if (!n) throw new Error("Şablon adı boş olamaz."); t.name = n; }
      if ("url" in patch) t.url = C.str(patch.url, 4000).trim();
      if ("folder" in patch) t.folder = C.str(patch.folder, 60).trim();
      if ("notes" in patch) t.notes = C.str(patch.notes, 2000);
      if ("doc" in patch) { const d = C.str(patch.doc, 500).trim(); if (d && !C.isWebUrl(d)) throw new Error("Belge bağlantısı http:// ya da https:// ile başlamalı."); t.doc = d; }
      if ("params" in patch) t.params = C.normalizeRows(patch.params);
      if ("headers" in patch) t.headers = C.normalizeRows(patch.headers);
      t.updatedAt = now().toISOString();
      return changed();
    });
    handle("tpl:duplicate", (id) => { const t = getTpl(id); addTemplate({ ...t, name: t.name + " (kopya)", sampleKey: null }); return changed(); });
    handle("tpl:archive", (id) => { const t = getTpl(id); t.archived = true; const next = data.templates.find((x) => !x.archived); data.active = next ? next.id : null; return changed(); });
    handle("tpl:restore", (id) => { const t = getTpl(id); t.archived = false; data.active = t.id; return changed(); });
    handle("tpl:send", (id) => sendTemplate(id));
    handle("tpl:copyCurl", (id) => { const s = curlOf(getTpl(id), activeEnv()); clipboard.writeText(s); return { text: s }; });

    // Ortamlar ve değişkenler
    handle("env:new", (name) => { if (data.envs.length >= C.MAX_ENVS) throw new Error("Ortam sınırı."); const e = C.normalizeEnv({ name: C.str(name, 60).trim() || "Yeni ortam" }); data.envs.push(e); data.settings.activeEnv = e.id; return changed(); });
    handle("env:set", (id, patch) => {
      const e = getEnv(id);
      patch = patch || {};
      if ("name" in patch) { const n = C.str(patch.name, 60).trim(); if (!n) throw new Error("Ortam adı boş olamaz."); e.name = n; }
      if ("production" in patch) e.production = !!patch.production;
      return changed();
    });
    /** Değişken listesi. Gizli satırda boş değer = mevcut değeri koru (arayüz sır değerini hiç görmez); `clear: true` = sil. */
    handle("env:vars", (id, rows) => {
      const e = getEnv(id);
      const old = new Map(e.vars.map((x) => [x.k, x]));
      const out = [], seen = new Set();
      for (const r of (Array.isArray(rows) ? rows : []).slice(0, C.MAX_VARS)) {
        const k = C.str(r && r.k, 64).trim();
        if (!k) continue;
        if (!C.NAME_RE.test(k)) throw new Error("Geçersiz değişken adı: “" + k + "” (harf, rakam, _ . -; harfle başlar).");
        if (seen.has(k)) throw new Error("Aynı değişken iki kez: " + k);
        seen.add(k);
        const secret = !!r.secret;
        let v = C.str(r.v, 8000);
        const prevName = C.str(r.was, 64) || k;
        if (secret && v === "" && !r.clear && old.has(prevName)) v = old.get(prevName).v;
        out.push({ k, v, secret });
      }
      e.vars = out;
      return changed();
    });

    // İçe aktarma
    handle("import:curl", (text) => {
      const { tpl, ignored } = C.parseCurl(text);
      const env = ensureEnv();
      const ex = C.extractSecrets(tpl, env.vars);
      for (const v of ex.vars) env.vars.push(v);
      const t = addTemplate(ex.tpl);
      data.counters.curlImports++;
      data.counters.secretsMoved += ex.vars.length;
      return { name: t.name, moved: ex.vars.map((v) => v.k), env: env.name, ignored, state: changed() };
    });
    handle("sample:start", () => startSample());
    handle("import:collection", async () => {
      const f = await pickOpen("API Pocket koleksiyonu", ["json"]);
      if (!f) return { cancelled: true };
      if (fs.statSync(f).size > 5 * 1048576) throw new Error("Dosya 5 MB'tan büyük.");
      let obj;
      try { obj = JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")); } catch { throw new Error("JSON okunamadı."); }
      const r = C.importCollection(obj, now().toISOString());
      if (data.templates.length + r.templates.length > C.MAX_TEMPLATES) throw new Error("Şablon sınırı aşılır.");
      data.templates.unshift(...r.templates);
      for (const e of r.environments) if (data.envs.length < C.MAX_ENVS) data.envs.push(e);
      if (r.templates[0]) data.active = r.templates[0].id;
      return { templates: r.templates.length, envs: r.environments.length, state: changed() };
    });

    // Dışa aktarma (sır değerleri yazılmaz)
    handle("export:collection", async () => {
      const file = await pickSave("api-pocket-koleksiyon.json", "json");
      if (!file) return { cancelled: true };
      const obj = C.exportCollection(data.templates, data.envs, now().toISOString());
      const text = JSON.stringify(obj, null, 2);
      if (C.leakCount(text, allSecrets())) throw new Error("Dışa aktarma durduruldu: koleksiyonda düz yazılmış bir sır değeri var. Şablonda {{değişken}} kullanın.");
      fs.writeFileSync(file, text, "utf8");
      data.counters.exports++;
      changed();
      return { file: path.basename(file), templates: obj.templates.length };
    });
    handle("export:response", async (id) => {
      const t = getTpl(id);
      const r = responses.get(t.id);
      if (!r || r.error || r.binary) throw new Error("Kaydedilecek metin yanıtı yok.");
      const ext = r.kind === "json" ? "json" : r.kind === "xml" ? "xml" : r.kind === "html" ? "html" : "txt";
      const name = (C.fold(t.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "yanit") + "-yanit." + ext;
      const file = await pickSave(name, ext);
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, r.pretty, "utf8");
      data.counters.exports++;
      changed();
      return { file: path.basename(file) };
    });
    handle("copy:response", (id) => { const r = responses.get(getTpl(id).id); if (!r || r.error) throw new Error("Yanıt yok."); clipboard.writeText(r.pretty); return { chars: r.pretty.length }; });

    // Yapay zekâ
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:explain", async (id) => {
      const t = getTpl(id);
      const resp = responses.get(t.id);
      if (!resp || resp.error || !resp.fields || !resp.fields.length) throw new Error("Önce JSON yanıtı alın — açıklanacak alan yok.");
      const p = C.aiExplainPayload(t, resp, allSecrets());
      const prov = providerInfo();
      const ok = await approve("Yanıt alanları MyMind ile açıklansın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Adres: " + (p.sent.host || "—") + " (sorgu parametreleri ve değişken değerleri yok)\n• " + p.sent.fields + " alan yolu, türü ve en çok 40 karakterlik maskeli örnek\n• Şablon adı, HTTP durumu, içerik türü" +
        (t.doc ? "\n• Belge bağlantısı: " + t.doc : "") + "\n• Gönderilmeyenler: yanıt gövdesinin tamamı, başlıklar, gizli değişkenler, e-posta/telefon/kart/kimlik/bağlantı değerleri (⟦…⟧)" +
        "\n\nYanıt denetlenir: olmayan alan ve verilmeyen bağlantı içeren açıklama atılır.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateExplain(await askModel(p.messages, 1600), resp.fields, t.doc);
      resp.ai = { ...res, at: now().toISOString() };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, count: Object.keys(res.items).length, dropped: res.dropped, state: changed() };
    });
    handle("ai:draft", async (desc) => {
      const d = C.str(desc, 2000).trim();
      if (d.length < 8) throw new Error("İsteği birkaç sözcükle anlatın.");
      const env = activeEnv();
      const p = C.aiDraftPayload(d, env);
      const prov = providerInfo();
      const ok = await approve("İstek taslağı MyMind ile hazırlansın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Açıklamanız (" + p.sent.chars + " karakter; e-posta/telefon/bağlantı/anahtar değerleri ⟦…⟧)\n• Etkin ortamdaki " + p.sent.vars + " değişkenin yalnız ADI (değerler gönderilmez)" +
        "\n\nTaslak denetlenir: yalnız GET; düz yazılmış anahtar/belirteç atılır; ortamda olmayan değişken işaretlenir. Taslak gönderilmez, yalnız şablon olarak eklenir.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateDraft(await askModel(p.messages, 900), env);
      const t = addTemplate({ ...res.tpl, folder: "MyMind taslakları", notes: [res.tpl.notes, ...res.notes].filter(Boolean).join("\n") });
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, name: t.name, notes: res.notes, unknown: res.unknown, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => { sample.stop(); app.quit(); });
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
