/* Model Switchboard — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): resmi API anahtarıyla tek panel → model kataloğu → istek maliyeti tahmini → aynı görevde yan yana değerlendirme.
 * • Anahtarlar (OpenAI, Anthropic, Hub) Windows kasasında (DPAPI) şifreli; arayüze, duruma ve günlüklere verilmez.
 * • Her karşılaştırma: plan (en kötü durum maliyeti, tavan denetimi) → onay penceresi (hedefler, gönderilecekler, maliyet) → istekler.
 *   Tavanı aşacak çalıştırma gönderilmez. Aynı anda tek çalıştırma (harcama yarışını önler). Yeniden deneme yok.
 * • Gerçek maliyet sağlayıcının bildirdiği kullanım × katalog fiyatıdır; fiyatın tarihi ve doğrulanma durumu sonuçla saklanır.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: görev türü ve katalogdan model önerisi; her istek ayrı onaylı, veri azaltılmış. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.MS_USER_DATA) app.setPath("userData", process.env.MS_USER_DATA);
const TEST = process.env.MS_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");

let win = null;
let running = false;
const memoryKeys = { openai: null, anthropic: null, hub: null };
let data = { settings: C.normalizeSettings({}), catalog: C.normalizeCatalog(SAMPLE.catalog), runs: [], active: null, draft: null, counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "pano.bin" : "pano.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.MS_NOW ? new Date(process.env.MS_NOW) : new Date());

// ---- Kalıcılık (atomik; kasa varsa şifreli — görevler ve yanıtlar özel olabilir) ----
function writeAtomic(file, buf) { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + ".tmp"; fs.writeFileSync(tmp, buf); fs.renameSync(tmp, file); }
function load() {
  let raw = null;
  try { if (vault()) raw = safeStorage.decryptString(fs.readFileSync(dataFile(true))); } catch { raw = null; }
  if (raw == null) { try { raw = fs.readFileSync(dataFile(false), "utf8"); } catch { raw = null; } }
  try {
    const d = raw ? JSON.parse(raw) : {};
    data.settings = C.normalizeSettings(d.settings);
    if (Array.isArray(d.catalog)) data.catalog = C.normalizeCatalog(d.catalog);
    data.runs = C.normalizeRuns(d.runs);
    data.active = data.runs.some((x) => x.id === d.active) ? d.active : null;
    data.draft = d.draft && typeof d.draft === "object" ? d.draft : null;
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır */ }
}
function save() {
  const json = JSON.stringify({ version: 1, ...data });
  if (vault()) { writeAtomic(dataFile(true), safeStorage.encryptString(json)); fs.rmSync(dataFile(false), { force: true }); }
  else writeAtomic(dataFile(false), json);
}

// ---- Anahtarlar ----
const keyFile = (k) => path.join(app.getPath("userData"), k + "-key.bin");
function readKey(k) {
  if (memoryKeys[k]) return memoryKeys[k];
  try { if (vault()) return safeStorage.decryptString(fs.readFileSync(keyFile(k))); } catch { /* yok */ }
  return null;
}
function writeKey(k, key) {
  if (!(k in memoryKeys)) throw new Error("Bilinmeyen sağlayıcı.");
  if (key == null) { memoryKeys[k] = null; fs.rmSync(keyFile(k), { force: true }); return "none"; }
  if (!C.keyValid(k, key)) throw new Error(k === "hub" ? "Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın." : "Anahtar biçimi geçersiz (" + C.PROVIDERS[k].label + " anahtarı " + C.PROVIDERS[k].keyHint + " ile başlar). Yalnız resmi API anahtarı kabul edilir.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(k), safeStorage.encryptString(key.trim())); memoryKeys[k] = null; return "vault"; }
  memoryKeys[k] = key.trim();
  return "memory";
}

// ---- Durum ----
function view() {
  const act = data.runs.find((x) => x.id === data.active) || null;
  const nowIso = now().toISOString();
  const types = Object.keys(C.TASK_TYPES);
  return {
    settings: data.settings, catalog: data.catalog, runs: data.runs.map((r) => ({ id: r.id, at: r.at, title: r.title, type: r.type, status: r.status, sample: r.sample, n: r.results.length, ok: r.results.filter((x) => x.ok).length, cost: C.round(r.results.reduce((s, x) => s + (x.cost || 0), 0), 8), rated: r.results.filter((x) => x.rating).length, invisible: r.results.filter((x) => x.ok && x.cost == null).length })),
    active: act, draft: data.draft, metrics: C.metrics(data.runs, data.counters, data.settings, nowIso), recommendations: types.map((t) => C.recommend(data.runs, data.catalog, t)),
    keys: { openai: !!readKey("openai"), anthropic: !!readKey("anthropic"), hub: !!readKey("hub") }, running, now: nowIso, vault: vault(), platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }
function getRun(id) { const x = data.runs.find((r) => r.id === id); if (!x) throw new Error("Çalıştırma bulunamadı."); return x; }

// ---- Pencere ----
function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1380, height: 880, minWidth: 1080, minHeight: 660, useContentSize: true, autoHideMenuBar: true,
    title: "Model Switchboard", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

// ---- Sağlayıcı çağrısı ----
const testBase = (p) => (TEST ? process.env["MS_" + p.toUpperCase() + "_URL"] || "" : "");
function callOpts(provider) {
  if (provider === "openai" || provider === "anthropic") return { key: readKey(provider), testBase: testBase(provider) };
  if (provider === "hub") return { key: readKey("hub"), base: testBase("hub") || net.HUB_URL };
  return { key: null, base: data.settings.localUrl };
}
function modelFor(m) { return m.provider === "yerel" && !m.model ? data.settings.localModel || "local-model" : m.model; }
function readyErr(m) {
  if ((m.provider === "openai" || m.provider === "anthropic" || m.provider === "hub") && !readKey(m.provider)) return C.PROVIDERS[m.provider].label + " anahtarı girilmemiş (Modeller ve anahtarlar).";
  return "";
}
function taskOf(t) {
  t = t || {};
  return { title: C.str(t.title, 160).trim(), system: C.str(t.system, C.MAX_PROMPT), prompt: C.str(t.prompt, C.MAX_PROMPT), type: C.TASK_TYPES[t.type] ? t.type : C.classifyTask(t.prompt).type, maxTokens: Math.floor(Number(t.maxTokens)) || data.settings.maxTokens };
}
function planFor(t, ids) {
  const task = taskOf(t);
  const p = C.plan(data.catalog, (Array.isArray(ids) ? ids : []).map(String), task, data.settings, data.runs, now().toISOString());
  for (const r of p.rows) { const m = data.catalog.find((c) => c.id === r.id); const e = readyErr(m); r.ready = !e; if (e && !p.errors.includes(e)) p.errors.push(e); }
  p.ok = !p.errors.length;
  return { task, plan: p };
}

function handle(name, fn) { ipcMain.handle(name, async (e, ...a) => { assertOwn(e); return fn(...a); }); }

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.model-switchboard");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      for (const k of ["monthlyCap", "runCap"]) if (k in patch && !(Number(patch[k]) >= 0)) throw new Error("Tavan 0 ya da daha büyük bir sayı olmalı (USD).");
      if ("draft" in patch) { data.draft = patch.draft && typeof patch.draft === "object" ? { ...taskOf(patch.draft), type: C.TASK_TYPES[patch.draft.type] ? patch.draft.type : "", ids: Array.isArray(patch.draft.ids) ? patch.draft.ids.map(String).slice(0, 4) : [] } : null; delete patch.draft; }
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });
    handle("key:set", (provider, key) => { const r = { stored: writeKey(String(provider), key) }; push(); return r; });

    // Katalog
    handle("catalog:set", (id, patch) => {
      const i = data.catalog.findIndex((m) => m.id === id);
      if (i < 0) throw new Error("Model bulunamadı.");
      patch = patch || {};
      const cur = data.catalog[i];
      if ("model" in patch && !/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,99}$/.test(String(patch.model).trim())) throw new Error("Model adı geçersiz (sağlayıcının API'deki model kimliği, ör. gpt-4o-mini).");
      for (const k of ["inPrice", "outPrice"]) if (k in patch && patch[k] !== "" && patch[k] != null && !(Number(patch[k]) >= 0)) throw new Error("Fiyat 0 ya da daha büyük bir sayı olmalı (USD / 1M token).");
      if ("priceDate" in patch && patch.priceDate && !C.isDate(patch.priceDate)) throw new Error("Tarih YYYY-AA-GG biçiminde olmalı.");
      if ("priceSource" in patch && patch.priceSource && !C.isWebUrl(patch.priceSource)) throw new Error("Fiyat kaynağı http/https adresi olmalı.");
      const priceChanged = ["inPrice", "outPrice"].some((k) => k in patch && String(patch[k]) !== String(cur[k]));
      const next = { ...cur, ...patch };
      if (priceChanged && !("verified" in patch)) next.verified = false;
      if (patch.verified && !C.isDate(next.priceDate)) throw new Error("Doğrulandı işaretlemek için fiyatı kontrol ettiğiniz tarihi girin.");
      data.catalog[i] = C.normalizeModel(next);
      return changed();
    });
    handle("catalog:add", (provider) => {
      if (data.catalog.length >= C.MAX_MODELS) throw new Error("Katalog sınırı (" + C.MAX_MODELS + ").");
      const p = C.PROVIDERS[provider] ? provider : "openai";
      const m = C.normalizeModel({ id: C.uid(), provider: p, model: p === "yerel" ? (data.settings.localModel || "local-model") : p === "hub" ? "mymind-lite" : "model-adi", label: p === "yerel" ? "Yerel model" : "Yeni model", inPrice: null, outPrice: null });
      data.catalog.push(m);
      return { id: m.id, state: changed() };
    });
    handle("catalog:reset", () => {
      for (const s of SAMPLE.catalog) if (!data.catalog.some((m) => m.id === s.id)) data.catalog.push(C.normalizeModel(s));
      return changed();
    });

    // Karşılaştırma
    handle("run:plan", (t, ids) => planFor(t, ids).plan);
    handle("run:compare", async (t, ids) => {
      if (running) throw new Error("Bir karşılaştırma zaten çalışıyor.");
      const { task, plan } = planFor(t, ids);
      if (!plan.ok) { data.counters.blocked++; save(); push(); throw new Error(plan.errors.join(" ")); }
      const models = plan.rows.map((r) => data.catalog.find((m) => m.id === r.id));
      const lines = plan.rows.map((r) => "• " + r.label + " — " + C.PROVIDERS[r.provider].host + " · en kötü " + C.usd(r.worst) + (r.paid ? (r.verified ? " (fiyat " + r.priceDate + ")" : " (fiyat DOĞRULANMADI)") : " (ücretsiz)"));
      const ok = await approve("Görev " + plan.rows.length + " modele gönderilsin mi?",
        "Hedefler:\n" + lines.join("\n") + "\n\nGönderilen: görev metni (" + task.prompt.length + " karakter)" + (task.system ? " ve sistem talimatı" : "") + ", her modele aynı. Anahtarlar yalnız kendi sağlayıcısına gider.\n" +
        "Max çıktı: " + plan.maxTokens + " token · temkinli girdi tahmini: " + plan.inSafe + " token\nEn kötü durum toplam: " + C.usd(plan.worst) + " (tavan " + C.usd(data.settings.runCap) + ") · bu ay kalan: " + C.usd(plan.remaining) +
        (plan.unverified.length ? "\n\nUyarı: " + plan.unverified.join(", ") + " fiyatı doğrulanmadı; gerçek fatura farklı olabilir." : "") + "\n\nAPI faturası sağlayıcı tarafından ayrıca kesilir.", "Gönder");
      if (!ok) return { approved: false };
      running = true; push();
      const results = [];
      try {
        await Promise.all(models.map(async (m, i) => {
          const req = C.buildRequest({ ...m, model: modelFor(m) }, task, plan.maxTokens, data.settings.temperature);
          if (TEST) testLog("sent.json", JSON.stringify({ provider: m.provider, path: req.path, body: req.body }));
          const t0 = Date.now();
          try {
            const r = await net.call(m.provider, req.path, req.body, callOpts(m.provider));
            results[i] = C.makeResult(m, plan.rows[i], C.parseResponse(m.provider === "anthropic" ? "anthropic" : "openai", r.json), r.ms);
          } catch (err) {
            data.counters.failed++;
            results[i] = C.makeResult(m, plan.rows[i], null, Date.now() - t0, String(err && err.message || err));
          }
          data.counters.requests++;
        }));
      } finally { running = false; }
      const run = C.normalizeRun({ id: C.uid(), at: now().toISOString(), title: task.title || task.prompt.split("\n").find((l) => l.trim()).slice(0, 80), type: task.type, system: task.system, prompt: task.prompt, maxTokens: plan.maxTokens, results, worst: plan.worst });
      const actual = run.results.reduce((s, x) => s + (x.cost || 0), 0);
      if (actual > plan.worst + 1e-12) data.counters.overEstimate++;
      data.runs.unshift(run);
      if (data.runs.length > C.MAX_RUNS) data.runs.pop();
      if (C.spentIn(data.runs, C.monthKey(run.at)) > data.settings.monthlyCap + 1e-12) data.counters.overCap++;
      data.counters.runs++;
      data.active = run.id;
      return { approved: true, id: run.id, ok: run.results.filter((x) => x.ok).length, failed: run.results.filter((x) => !x.ok).length, cost: C.round(actual, 8), worst: plan.worst, state: changed() };
    });
    handle("run:open", (id) => { if (id) getRun(id); data.active = id || null; return changed(); });
    handle("run:rate", (id, idx, rating) => { const r = getRun(id); const x = r.results[Number(idx)]; if (!x || !x.ok) throw new Error("Yalnız başarılı yanıt puanlanabilir."); x.rating = Math.max(0, Math.min(5, Math.floor(Number(rating)) || 0)); return changed(); });
    handle("run:winner", (id, idx) => { const r = getRun(id); const x = r.results[Number(idx)]; if (!x || !x.ok) throw new Error("Yalnız başarılı yanıt seçilebilir."); const was = x.winner; r.results.forEach((y) => { y.winner = false; }); x.winner = !was; if (x.winner && !x.rating) x.rating = 5; return changed(); });
    handle("run:note", (id, note) => { getRun(id).note = C.str(note, 1000); return changed(); });
    handle("run:archive", (id) => { getRun(id).status = "arsiv"; return changed(); });
    handle("run:restore", (id) => { getRun(id).status = "acik"; return changed(); });
    handle("run:sample", () => {
      let added = 0;
      for (const s of SAMPLE.runs.slice().reverse()) if (!data.runs.some((r) => r.id === s.id)) { data.runs.unshift(C.normalizeRun(s)); added++; }
      data.active = SAMPLE.runs[0].id;
      return { added, state: changed() };
    });
    handle("run:copy", (id, idx) => { const x = getRun(id).results[Number(idx)]; if (!x || !x.ok) throw new Error("Kopyalanacak yanıt yok."); clipboard.writeText(x.text); return { chars: x.text.length }; });

    // Dışa aktarma
    handle("export:csv", async () => {
      if (!data.runs.length) throw new Error("Henüz çalıştırma yok.");
      const file = await pickSave("model-switchboard.csv", "csv");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportCsv(data.runs), "utf8");
      data.counters.exports++;
      return { file: path.basename(file), rows: data.runs.reduce((s, r) => s + r.results.length, 0), state: changed() };
    });
    handle("export:json", async () => {
      const file = await pickSave("model-switchboard.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, C.exportJson(data.runs, data.catalog), "utf8");
      data.counters.exports++;
      return { file: path.basename(file), state: changed() };
    });

    // MyMind: görev türü ve model önerisi (her istek ayrı onaylı)
    handle("ai:classify", async (t) => {
      const task = taskOf(t);
      if (!task.prompt.trim()) throw new Error("Önce görev metnini yazın.");
      const prov = data.settings.provider;
      if (prov === "hub" && !readKey("hub")) throw new Error("Önce MyMind bağlantısı için Hub istemci anahtarını girin (ya da Ayarlar'dan yerel modeli seçin).");
      const p = C.aiPayload(task, data.catalog, data.runs);
      const where = prov === "yerel" ? "Yerel model (" + data.settings.localUrl + ")" : "MyMind — PluginLabs Hub (127.0.0.1:47632)";
      const ok = await approve("Görev türü ve model önerisi MyMind'dan istensin mi?",
        "Hedef: " + where + " — yalnız bu bilgisayar.\nGönderilecekler:\n• Görev metni (" + p.sent.chars + " karakter" + (p.sent.truncated ? ", ilk " + C.AI_TEXT : "") + ")" + (p.sent.masked ? ", " + p.sent.masked + " kişisel veri/anahtar/bağlantı ⟦…⟧ ile gizlenerek" : "") +
        "\n• Katalogdaki " + p.sent.models + " modelin adı ve fiyatı\n• Kayıtlı test özeti (" + p.sent.evidence + " model; yanıt metinleri gönderilmez)\n• Sistem talimatı, API anahtarları ve geçmiş yanıtlar gönderilmez\n\nYanıt denetlenir: listede olmayan tür ve katalogda olmayan model atılır; öneri yalnız seçimi kolaylaştırır.", "Gönder");
      if (!ok) return { approved: false };
      if (TEST) testLog("ai-sent.json", JSON.stringify({ provider: prov, messages: p.messages }));
      const req = { model: prov === "yerel" ? data.settings.localModel || "local-model" : "mymind-lite", messages: p.messages, max_tokens: 300, temperature: 0.1, stream: false };
      const r = await net.call(prov, "/v1/chat/completions", req, callOpts(prov));
      const res = C.validateAi(C.parseResponse("openai", r.json).text, p);
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      if (res.type) data.counters.classified++;
      return { approved: true, ...res, state: changed() };
    });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
function assertOwn(e) { if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek."); }
