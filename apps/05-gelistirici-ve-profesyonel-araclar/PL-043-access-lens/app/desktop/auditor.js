/* Access Lens — denetim penceresi. Kullanıcının seçtiği TEK sayfa görünmez (ekran dışı), oturumsuz ve yalıtılmış bir pencerede açılır:
 * her denetimde yeni bellek içi oturum (çerez/depolama boş başlar, diske yazılmaz), sandbox, Node yok, önyükleme betiği yok, izinler reddedilir,
 * indirmeler iptal, yeni pencere yok, ilk yüklemeden sonra başka adrese gidilmez. Yerel dosya/yapıştırılan HTML'de uzak kaynaklar
 * (ayar kapalıyken) engellenir. axe-core ve denetim betiği sayfanın betiklerinden yalıtılmış bir dünyada çalışır; sayfa değiştirilmez. */
const { BrowserWindow, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const WORLD = 1043;
let axeSource = null;
let auditScript = null;
let win = null;
let current = { auditId: null, kind: null };
let policy = { kind: "url", remote: false, scripts: true };
const NO_SCRIPT = "script-src 'none'";

function engine() {
  if (!axeSource) {
    const p = require.resolve("axe-core/axe.min.js");
    axeSource = fs.readFileSync(p, "utf8");
    auditScript = fs.readFileSync(path.join(__dirname, "page-audit.js"), "utf8");
  }
  return { version: require("axe-core/package.json").version };
}
const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_r, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

let partitionSeq = 0;
function setupSession(partition) {
  const ses = session.fromPartition(partition);
  {
    ses.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
    ses.setPermissionCheckHandler(() => false);
    ses.on("will-download", (e, item) => { e.preventDefault(); try { item.cancel(); } catch { /* yok */ } });
    ses.webRequest.onBeforeRequest((d, cb) => {
      const u = d.url;
      if (/^(data|blob|about|chrome-extension|devtools):/i.test(u)) return cb({});
      if (policy.kind === "url") return cb({ cancel: !/^https?:/i.test(u) });
      // Yerel dosya / yapıştırılan HTML: yalnız file:, uzak kaynaklar ayarla açılır.
      if (/^file:/i.test(u)) return cb({});
      return cb({ cancel: !(policy.remote && /^https?:/i.test(u)) });
    });
    // "Sayfa betikleri kapalı": belge yanıtına ek CSP (script-src 'none') eklenir. Denetim motoru yalıtılmış dünyada çalıştığı için etkilenmez.
    // (webPreferences.javascript=false yalıtılmış dünyayı da durdurduğundan kullanılmaz.)
    ses.webRequest.onHeadersReceived((d, cb) => {
      if (policy.scripts || !/^https?:/i.test(d.url) || !/^(mainFrame|subFrame)$/.test(d.resourceType)) return cb({});
      const h = { ...(d.responseHeaders || {}) };
      const k = Object.keys(h).find((x) => x.toLowerCase() === "content-security-policy") || "Content-Security-Policy";
      h[k] = [...(Array.isArray(h[k]) ? h[k] : h[k] ? [h[k]] : []), NO_SCRIPT];
      cb({ responseHeaders: h });
    });
  }
  return ses;
}

/** Yerel dosyada betikleri kapatmak için geçici kopya: <head> başına CSP meta ve özgün klasöre <base>. Özgün dosya değişmez. */
function noScriptCopy(file, tmpDir) {
  const html = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const base = require("node:url").pathToFileURL(path.dirname(file) + path.sep).href;
  const inject = '<meta http-equiv="Content-Security-Policy" content="' + NO_SCRIPT + '"><base href="' + base.replace(/"/g, "%22") + '">';
  const out = /<head\b[^>]*>/i.test(html) ? html.replace(/<head\b[^>]*>/i, (m) => m + inject) : inject + html;
  fs.mkdirSync(tmpDir, { recursive: true });
  const p = path.join(tmpDir, "betiksiz.html");
  fs.writeFileSync(p, out, "utf8");
  return p;
}

function close() { if (win && !win.isDestroyed()) win.destroy(); win = null; current = { auditId: null, kind: null }; }
/** Önceki denetim penceresi düzgün kapanana kadar beklenir (hemen yok etmek bir sonraki yüklemeyi ERR_FAILED ile bozabiliyor). */
async function closeGracefully() {
  if (!win || win.isDestroyed()) { close(); return; }
  const w = win;
  const gone = new Promise((r) => { w.once("closed", r); setTimeout(r, 3000); });
  w.close();
  await gone;
  close();
}

/** Sayfayı aç ve denetle. target: { kind: "url"|"dosya"|"yapistir"|"ornek", url?, file? } */
async function run(target, settings, tags) {
  engine();
  await closeGracefully();
  // Her denetim yeni, bellek içi (kalıcı olmayan) bir oturumla başlar: çerez, önbellek ve depolama boştur ve diske yazılmaz.
  const partition = "denetim-" + (++partitionSeq);
  setupSession(partition);
  policy = { kind: target.kind === "url" ? "url" : "yerel", remote: !!settings.remote, scripts: !!settings.scripts };
  win = new BrowserWindow({
    show: false, width: settings.width, height: 900, useContentSize: true,
    webPreferences: { partition, sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: true, offscreen: true, backgroundThrottling: false, webSecurity: true, spellcheck: false },
  });
  const wc = win.webContents;
  wc.setAudioMuted(true);
  wc.setWindowOpenHandler(() => ({ action: "deny" }));
  let loaded = false;
  wc.on("will-navigate", (e) => { if (loaded) e.preventDefault(); });
  wc.on("will-redirect", (e) => { if (loaded) e.preventDefault(); });
  const load = target.kind === "url" ? wc.loadURL(target.url, { userAgent: wc.getUserAgent().replace(/Electron\/\S+\s*/, "").replace(/access-lens\/\S+\s*/i, "") }) : wc.loadFile(settings.scripts ? target.file : noScriptCopy(target.file, target.tmpDir));
  try { await withTimeout(load, 30000, "Sayfa 30 saniyede yüklenemedi."); } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (!/ERR_ABORTED/.test(msg)) { close(); throw new Error(/ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION/.test(msg) ? "Sayfaya ulaşılamadı (adres ya da ağ bağlantısı). " + msg.slice(0, 120) : msg.slice(0, 300)); }
  }
  loaded = true;
  if (settings.wait) await new Promise((r) => setTimeout(r, settings.wait));
  // Önce motor yüklenir, sonra denetim betiği ayrı çağrıyla çalışır (aynı yalıtılmış dünya; sayfanın betikleri bu nesnelere erişemez).
  await wc.executeJavaScriptInIsolatedWorld(WORLD, [{ code: axeSource + "\n;void 0;" }]);
  const ready = await wc.executeJavaScriptInIsolatedWorld(WORLD, [{ code: "typeof axe === 'object' && typeof axe.run === 'function'" }]);
  if (!ready) { close(); throw new Error("Kural motoru sayfaya yüklenemedi."); }
  const raw = await withTimeout(wc.executeJavaScriptInIsolatedWorld(WORLD, [{ code: "(" + auditScript.trim() + ")(" + JSON.stringify({ tags }) + ")" }]), 120000, "Denetim 120 saniyede bitmedi.");
  if (!raw || !Array.isArray(raw.violations)) { close(); throw new Error("Denetim sonucu alınamadı."); }
  return raw;
}
function attach(auditId) { current = { auditId, kind: policy.kind }; }
const liveFor = (auditId) => !!(win && !win.isDestroyed() && current.auditId === auditId);

/** Öğeyi görünür alana kaydırır ve vurgu kutusu için konumla birlikte ekran görüntüsü döndürür (sayfaya hiçbir şey eklenmez). */
async function highlight(auditId, selector) {
  if (!liveFor(auditId)) throw new Error("Bu denetimin sayfası artık açık değil. Öğeyi görmek için “Yeniden denetle”yi kullanın.");
  const code = "(function(s){var el=null;try{el=document.querySelector(s)}catch(e){};if(!el)return null;el.scrollIntoView({block:'center',inline:'center'});var r=el.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight}})(" + JSON.stringify(selector) + ")";
  const rect = await win.webContents.executeJavaScriptInIsolatedWorld(WORLD, [{ code }]);
  if (!rect) throw new Error("Öğe sayfada bulunamadı (sayfa değişmiş olabilir).");
  await new Promise((r) => setTimeout(r, 150));
  let img = await win.webContents.capturePage();
  if (img.isEmpty()) throw new Error("Ekran görüntüsü alınamadı.");
  const size = img.getSize();
  if (size.width > 1600) img = img.resize({ width: 1600 });
  return { image: "data:image/jpeg;base64," + img.toJPEG(80).toString("base64"), rect, visible: rect.w > 0 && rect.h > 0 };
}

module.exports = { engine, run, attach, liveFor, highlight, close };
