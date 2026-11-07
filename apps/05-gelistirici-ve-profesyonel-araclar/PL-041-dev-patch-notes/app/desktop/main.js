/* Dev Patch Notes — masaüstü kabuğu (Windows paketi yayımlanır; Electron'un desteklediği diğer platformlarda da çalışır).
 * Akış (Notion kartı): seçilen git diff/commit listesini içe al → özellik/düzeltme başlıklarına ayır → kaynak commit bağlantılı düzenlenebilir not.
 * • Girdi: yerel git deposu (yalnız okuma; desktop/git.js), yapıştırılan git log / format-patch / diff, .patch/.diff/.log/.txt dosyası.
 * • Otomatik commit, push, etiket ya da yayın YOK. Çıktı yalnız kullanıcının seçtiği dosyaya ya da panoya yazılır.
 * • Sırlar girişte maskelenir; kanıtsız iddia ya da sır içeren madde varken dışa aktarma engellenir.
 * • İsteğe bağlı MyMind (PluginLabs Hub) ya da yerel model: her istek ayrı onaylı, sırlar maskeli; öneri aynı denetimden geçer. */
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, dialog, safeStorage, clipboard, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const net = require("./net");
const git = require("./git");
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");

const root = path.join(__dirname, "..");
if (process.env.DP_USER_DATA) app.setPath("userData", process.env.DP_USER_DATA);
const TEST = process.env.DP_TEST_DIR || "";
app.commandLine.appendSwitch("lang", "tr-TR");
const MAX_FILE = 8 * 1024 * 1024;
const FILE_RE = /\.(patch|diff|log|txt|mbox|eml)$/i;

let win = null;
let memoryKey = null;
let data = { settings: C.normalizeSettings({}), releases: [], active: null, exports: [], counters: C.normalizeCounters({}) };

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const dataFile = (enc) => path.join(app.getPath("userData"), enc ? "notlar.bin" : "notlar.json");
const testLog = (file, line) => fs.appendFileSync(path.join(TEST, file), line + "\n");
const testRead = (f) => { try { return fs.readFileSync(path.join(TEST, f), "utf8").trim(); } catch { return ""; } };
const vault = () => safeStorage.isEncryptionAvailable();
const now = () => (TEST && process.env.DP_NOW ? new Date(process.env.DP_NOW) : new Date());

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
    data.releases = C.normalizeReleases(d.releases);
    data.active = data.releases.some((x) => x.id === d.active) ? d.active : null;
    data.exports = C.normalizeExports(d.exports);
    data.counters = C.normalizeCounters(d.counters);
  } catch { /* bozuk dosya: boş başlanır, eski dosya yerinde kalır */ }
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
  if (typeof key !== "string" || !/^[A-Za-z0-9._~+/=-]{16,190}$/.test(key.trim())) throw new Error("Anahtar biçimi geçersiz. Hub → API istemcileri bölümünden kopyaladığınız anahtarı yapıştırın.");
  if (vault()) { fs.mkdirSync(app.getPath("userData"), { recursive: true }); fs.writeFileSync(keyFile(), safeStorage.encryptString(key.trim())); memoryKey = null; return "vault"; }
  memoryKey = key.trim();
  return "memory";
}

function getRel(id) { const x = data.releases.find((r) => r.id === id); if (!x) throw new Error("Sürüm notu bulunamadı."); return x; }
function getItem(r, id) { const it = r.items.find((x) => x.id === id); if (!it) throw new Error("Madde bulunamadı."); return it; }
/** Etkin düzenleme süresi: ardışık düzenlemeler arasındaki boşluk en çok 60 sn sayılır. */
function touch(r) {
  const t = now().getTime();
  const last = r.edit.lastAt ? new Date(r.edit.lastAt).getTime() : 0;
  r.edit.count++;
  r.edit.activeMs += last ? Math.max(0, Math.min(60000, t - last)) : 5000;
  r.edit.lastAt = new Date(t).toISOString();
  if (r.status === "aktarildi") r.status = "taslak";
}

function view() {
  const r = data.releases.find((x) => x.id === data.active) || null;
  let detail = null;
  if (r) {
    const md = C.renderMarkdown(r, { template: data.settings.template });
    detail = { ...r, issues: Object.fromEntries(r.items.map((it) => [it.id, C.itemIssues(r, it)])), blockers: C.blockers(r), preview: md, ratio: C.editRatio(r.generated, md), commits: r.commits.map((c) => ({ sha: c.sha, subject: c.subject, body: c.body.slice(0, 1500), date: c.date, files: c.files.slice(0, 40), url: C.commitUrl(r.repo, c.sha) })) };
  }
  const gold = (() => { const s = data.releases.find((x) => x.sampleKey && x.status !== "arsiv"); return s ? C.evaluateGold(s, SAMPLE.gold) : null; })();
  return {
    settings: data.settings, active: r ? r.id : null, detail, gold,
    releases: data.releases.map((x) => ({ id: x.id, title: x.title, date: x.date, status: x.status, createdAt: x.createdAt, repo: x.repo, source: { via: x.source.via, format: x.source.format, label: x.source.label, range: x.source.range }, commits: x.commits.length, items: x.items.filter((i) => i.include).length, secrets: x.secrets.length, blocked: C.blockers(x).length, sampleKey: x.sampleKey || null, exported: x.exported })),
    exports: data.exports.slice(-200).reverse(), counters: data.counters, metrics: C.metrics(data.releases, data.exports, data.counters),
    now: now().toISOString(), vault: vault(), hasKey: !!readKey(), platform: process.platform,
  };
}
const push = () => { if (win && !win.isDestroyed()) win.webContents.send("state:changed", view()); };
function changed() { save(); push(); return view(); }

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 1040, minHeight: 640, useContentSize: true, autoHideMenuBar: true,
    title: "Dev Patch Notes", icon: path.join(root, "icons", "icon256.png"), backgroundColor: "#0e1322", show: false,
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
  const r = await dialog.showOpenDialog(win, { title: "Git deposu klasörünü seçin", properties: ["openDirectory"] });
  return r.canceled ? null : r.filePaths[0];
}
async function pickFile() {
  if (TEST) return testRead("pick.txt") || null;
  const r = await dialog.showOpenDialog(win, { title: "Yama ya da git log dosyası", properties: ["openFile"], filters: [{ name: "Yama / log", extensions: ["patch", "diff", "log", "txt", "mbox", "eml"] }] });
  return r.canceled ? null : r.filePaths[0];
}
async function pickSave(name, ext) {
  if (TEST) return path.join(TEST, name);
  const r = await dialog.showSaveDialog(win, { title: "Sürüm notunu kaydet", defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

function addRelease(input, extra) {
  if (data.releases.length >= C.MAX_RELEASES) throw new Error("Kayıt sınırına (" + C.MAX_RELEASES + ") ulaşıldı. Eski sürüm notlarını arşivleyin.");
  const r = C.createRelease({ ...input, internal: data.settings.internal }, ((extra && extra.at) || now()).toISOString());
  if (extra && extra.key) r.sampleKey = extra.key;
  if (input.dir) r.source.dir = input.dir;
  r.template = data.settings.template;
  data.releases.unshift(r);
  data.counters.releases++;
  data.counters.secretsFound += r.secrets.length;
  data.active = r.id;
  return r;
}
const summary = (r) => r.commits.length + " commit → " + r.items.filter((x) => x.include).length + " madde" + (r.secrets.length ? " · " + r.secrets.length + " sır maskelendi" : "");

const hubUrl = () => (TEST && process.env.DP_HUB_URL) || net.HUB_URL;
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

async function exportAs(id, format) {
  const r = getRel(id);
  const b = C.blockers(r);
  if (b.length) { data.counters.blocked++; save(); push(); throw new Error("Dışa aktarılmadı — önce düzeltin: " + b.slice(0, 4).map((x) => x.reason).join("; ") + (b.length > 4 ? " (+" + (b.length - 4) + ")" : "")); }
  const opts = { template: data.settings.template };
  const md = C.renderMarkdown(r, opts);
  const text = format === "md" ? md : format === "txt" ? C.renderText(r, opts) : C.renderJson(r, opts);
  const items = r.items.filter((x) => x.include).length;
  if (!items) throw new Error("Notta madde yok.");
  let file = null, verify = true;
  if (format === "pano") { clipboard.writeText(md); data.counters.copies++; verify = clipboard.readText() === md; }
  else {
    const name = (C.fold(r.title).replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "surum") + "-surum-notu." + format;
    file = await pickSave(name, format);
    if (!file) return { cancelled: true };
    fs.writeFileSync(file, text, "utf8");
    verify = fs.readFileSync(file, "utf8") === text;
  }
  const ratio = C.editRatio(r.generated, md);
  const links = (md.match(/\/commit\/[0-9a-f]{7,40}/g) || []).length;
  r.status = "aktarildi";
  r.exported = { at: now().toISOString(), ratio, activeMs: r.edit.activeMs };
  data.exports.push({ at: r.exported.at, file: file ? path.basename(file) : "pano", format, items, links, ratio, verify, release: r.title, releaseId: r.id });
  data.counters.exports++;
  const st = changed();
  return { file: file ? path.basename(file) : null, items, links, ratio, verify, state: st };
}

if (gotLock) {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (process.platform === "win32") app.setAppUserModelId("com.pluginlabs.dev-patch-notes");
    load();
    handle("state:get", () => view());
    handle("settings:set", (patch) => {
      patch = patch || {};
      if ("localUrl" in patch && !C.isLoopbackUrl(String(patch.localUrl).trim())) throw new Error("Yerel model adresi yalnız bu bilgisayar olabilir (http://127.0.0.1:… ya da http://localhost:…).");
      data.settings = C.normalizeSettings({ ...data.settings, ...patch });
      return changed();
    });

    // Girdi
    handle("repo:pick", async () => {
      const dir = await pickDir();
      if (!dir) return { cancelled: true };
      const info = await git.inspect(dir);
      return { ...info, repo: C.repoFromRemote(info.remote) };
    });
    handle("repo:read", async (o) => {
      o = o || {};
      const info = await git.inspect(String(o.dir || ""));
      const range = C.str(o.range, 250).trim();
      const out = await git.log(info.dir, range, data.settings.maxCommits);
      if (!out.includes("\x1e")) throw new Error(range ? "Bu aralıkta commit yok (" + range + ")." : "Depoda commit yok.");
      const repoUrl = C.str(o.repoUrl, 500).trim() || info.remote;
      const r = addRelease({ content: out, repoUrl: C.repoFromRemote(repoUrl) ? repoUrl : "", title: o.title, date: o.date, via: "depo", label: info.name, range: range || "son " + data.settings.maxCommits + " commit", dir: info.dir });
      data.counters.repoReads++;
      return { summary: summary(r), state: changed() };
    });
    handle("capture:text", (o) => {
      o = o || {};
      const r = addRelease({ content: C.str(o.content, C.MAX_INPUT), repoUrl: C.str(o.repoUrl, 500).trim(), title: o.title, date: o.date, via: "yapistirma", label: "Yapıştırılan " + "metin" });
      return { summary: summary(r), state: changed() };
    });
    handle("capture:file", async () => {
      const f = await pickFile();
      if (!f) return { cancelled: true };
      const st = fs.statSync(f);
      if (!st.isFile() || !FILE_RE.test(f)) throw new Error("Desteklenmeyen dosya türü (.patch, .diff, .log, .txt).");
      if (st.size > MAX_FILE) throw new Error("Dosya 8 MB'tan büyük.");
      const r = addRelease({ content: fs.readFileSync(f, "utf8").replace(/^﻿/, ""), via: "dosya", label: path.basename(f), title: "" });
      data.counters.files++;
      return { summary: summary(r), file: path.basename(f), state: changed() };
    });
    handle("capture:sample", () => {
      const r = addRelease({ content: SAMPLE.log, repoUrl: SAMPLE.repoUrl, title: SAMPLE.title, date: "2026-11-06", via: "ornek", label: "Örnek: kargo-takip (uydurma)", range: "v1.3.0..v1.4.0" }, { key: "kargo", at: new Date(SAMPLE.BASE) });
      return { summary: summary(r), state: changed() };
    });

    // Düzenleme (yalnız yerel)
    handle("rel:open", (id) => { if (id) getRel(id); data.active = id || null; return changed(); });
    handle("rel:meta", (id, patch) => {
      const r = getRel(id);
      patch = patch || {};
      if ("title" in patch) { const t = C.str(patch.title, 80).trim(); if (!t) throw new Error("Sürüm adı boş olamaz."); r.title = t; }
      if ("date" in patch) { if (!/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) throw new Error("Tarih YYYY-AA-GG olmalı."); r.date = patch.date; }
      if ("repoUrl" in patch) { const u = C.str(patch.repoUrl, 500).trim(); if (u && !C.repoFromRemote(u)) throw new Error("Depo adresi anlaşılamadı (https://… ya da git@…)."); r.repo = u ? C.repoFromRemote(u) : null; }
      touch(r);
      return changed();
    });
    handle("item:set", (id, itemId, patch) => {
      const r = getRel(id);
      const it = getItem(r, itemId);
      patch = patch || {};
      if ("text" in patch) { const t = C.str(patch.text, 2000).replace(/\s+/g, " ").trim(); if (t.length > C.MAX_TEXT) throw new Error("Madde en çok " + C.MAX_TEXT + " karakter olabilir."); it.text = t; it.edited = true; }
      if ("cat" in patch) { if (!C.CATS.includes(patch.cat)) throw new Error("Geçersiz başlık."); it.cat = patch.cat; it.edited = true; }
      if ("include" in patch) it.include = !!patch.include;
      touch(r);
      const is = C.itemIssues(r, it);
      return { warn: is.unsupported.map((c) => "“" + c.match + "”: " + c.name + " kaynak commit'te yok").concat(is.secrets.map((s) => s + " içeriyor")).join("; "), state: changed() };
    });
    handle("rel:reset", (id) => { const r = getRel(id); for (const it of r.items) { it.text = it.gen; it.cat = it.genCat; it.edited = false; } touch(r); return changed(); });
    handle("rel:archive", (id) => { const r = getRel(id); r.status = "arsiv"; const next = data.releases.find((x) => x.status !== "arsiv"); data.active = next ? next.id : null; return changed(); });
    handle("rel:restore", (id) => { const r = getRel(id); r.status = "taslak"; data.active = r.id; return changed(); });
    handle("link:open", async (id, sha) => {
      const r = getRel(id);
      const url = C.commitUrl(r.repo, String(sha || ""));
      if (!url || !r.commits.some((c) => c.sha === sha)) throw new Error("Açılacak commit bağlantısı yok (depo adresi girilmemiş olabilir).");
      if (TEST) { testLog("opened.txt", url); return { opened: url }; }
      await shell.openExternal(url);
      return { opened: url };
    });

    // Çıktı (engelleyici varsa yazılmaz)
    handle("export:md", (id) => exportAs(id, "md"));
    handle("export:txt", (id) => exportAs(id, "txt"));
    handle("export:json", (id) => exportAs(id, "json"));
    handle("export:copy", (id) => exportAs(id, "pano"));
    handle("export:backup", async () => {
      const file = await pickSave("dev-patch-notes-yedek.json", "json");
      if (!file) return { cancelled: true };
      fs.writeFileSync(file, JSON.stringify({ app: "dev-patch-notes", version: 1, exportedAt: new Date().toISOString(), settings: data.settings, releases: data.releases, exports: data.exports }, null, 2), "utf8");
      return { file: path.basename(file) };
    });

    // Yapay zekâ
    handle("ai:setKey", (key) => { const r = { stored: writeKey(key) }; push(); return r; });
    handle("ai:draft", async (id) => {
      const r = getRel(id);
      if (r.source.dir) {
        for (const c of r.commits.slice(0, 40)) if (!c.diff && c.sha) { try { c.diff = C.maskSecrets(await git.show(r.source.dir, c.sha)); } catch { /* fark alınamadı */ } }
      }
      const p = C.aiPayload(r);
      const prov = providerInfo();
      const ok = await approve("Sürüm notu maddeleri MyMind ile yeniden yazılsın mı?",
        "Hedef: " + prov.name + " — yalnız bu bilgisayar.\nGönderilecekler:\n• " + p.sent.items + " madde: mevcut metin ve başlık\n• " + p.sent.commits + " commit'in başlığı, açıklaması (en çok 400 karakter) ve dosya adları\n• Kod farkından en çok " + 1200 + " karakter/commit (toplam " + p.sent.diffChars + " karakter)" +
        (r.secrets.length ? "\n• Bulunan " + r.secrets.length + " sır maskeli gider (⟨gizlendi⟩)" : "") + "\n• Yazar adları, e-postalar ve depo adresi gönderilmez" +
        "\n\nYanıt denetlenir: yeni madde, olmayan başlık, commit'te geçmeyen test/performans/güvenlik iddiası ve sır içeren öneri atılır. Uygulamak sizin onayınızla olur.", "Gönder");
      if (!ok) return { approved: false };
      const res = C.validateAi(await askModel(p.messages, 2000), r);
      r.ai = { ...res, at: now().toISOString() };
      data.counters.aiRuns++;
      data.counters.aiDropped += res.dropped;
      return { approved: true, count: Object.keys(res.items).length, dropped: res.dropped, state: changed() };
    });
    handle("ai:apply", (id) => {
      const r = getRel(id);
      if (!r.ai) throw new Error("Önce MyMind önerisi alın.");
      let n = 0;
      for (const [itemId, v] of Object.entries(r.ai.items)) {
        const it = r.items.find((x) => x.id === itemId);
        if (!it) continue;
        if (C.checkClaims(v.text, r.commits.filter((c) => it.commits.includes(c.sha)).map((c) => c.subject + "\n" + c.body).join("\n")).some((c) => !c.supported)) continue;
        it.text = v.text; it.cat = v.cat; it.edited = true; it.ai = true; n++;
      }
      r.ai.items = {};
      touch(r);
      return { applied: n, state: changed() };
    });
    handle("ai:dismiss", (id) => { getRel(id).ai = null; return changed(); });

    createWindow();
    app.on("activate", () => { if (!win) createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}

function assertOwn(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) throw new Error("Yetkisiz istek.");
}
