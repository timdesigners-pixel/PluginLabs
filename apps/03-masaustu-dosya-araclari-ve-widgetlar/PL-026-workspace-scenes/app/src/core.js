/* Workspace Scenes — çekirdek (saf işlevler; ana süreçte, arayüzde ve testlerde aynı kod çalışır).
 * Sahne: adı ve amacı olan, sırayla açılacak öğeler listesi (bağlantı, klasör, uygulama, dosya). İlk sürüm pencere konumu değil yalnız açılış dizisidir.
 * Burada: doğrulama/normalleştirme, açılış planı, şablonlar, kurala dayalı "eksik araç" önerisi, kurulum süresi ölçümü, içe/dışa aktarma,
 * MyMind istek/yanıt doğrulaması. Dosya sistemine ve ağa erişmez; hiçbir şeyi açmaz ya da kapatmaz. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WSCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TYPES = ["url", "folder", "app", "file"];
  const TYPE_LABEL = { url: "Bağlantı", folder: "Klasör", app: "Uygulama", file: "Dosya" };
  const MAX_SCENES = 60;
  const MAX_ITEMS = 40;
  const DELAYS = [0, 300, 700, 1500, 3000];
  const ID_RE = /^[a-z0-9]{6,24}$/;
  const AI_MAX_SUGGESTIONS = 5;
  const APP_EXT_WIN = ["exe", "lnk", "appref-ms", "url"];

  function makeId() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).slice(0, 16);
  }
  const validId = (v) => typeof v === "string" && ID_RE.test(v);
  const str = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

  // ---- Türkçe duyarsız katlama (ı/i, ş/s, ç/c, ğ/g, ö/o, ü/u) ----
  const MAP = { ı: "i", İ: "i", I: "i", ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ö: "o", Ö: "o", ü: "u", Ü: "u", â: "a", î: "i", û: "u" };
  function fold(s) {
    let o = "";
    for (const c of String(s || "")) o += MAP[c] || c.toLowerCase();
    return o;
  }
  const words = (s) => fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);

  // ---- Bağlantı ve yol doğrulaması ----
  /** Yalnız http/https; kullanıcı adı/parola içeren bağlantılar reddedilir. Şemasız "github.com" gibi girdilere https eklenir. */
  function normalizeUrl(input) {
    let t = String(input || "").trim();
    if (!t) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) {
      if (!/^[^\s/]+\.[^\s/]{2,}/.test(t)) return null;
      t = "https://" + t;
    }
    let u;
    try { u = new URL(t); } catch { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password || !u.hostname) return null;
    const s = u.toString();
    return s.length <= 2000 ? s : null;
  }
  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }
  /** Mutlak yol mu? (Windows: C:\… veya \\sunucu\…; diğerleri: /…). Göreli yol, ~ ve boş kabul edilmez. */
  function isAbsPath(p, platform) {
    const s = String(p || "");
    if (!s || s.length > 1024 || /[\u0000-\u001f]/.test(s)) return false;
    if ((platform || "win32") === "win32") return /^[a-zA-Z]:[\\/]/.test(s) || /^\\\\[^\\]+\\[^\\]+/.test(s);
    return s.startsWith("/");
  }
  function baseName(p) {
    const s = String(p || "").replace(/[\\/]+$/, "");
    const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
    return i >= 0 ? s.slice(i + 1) : s;
  }
  function extOf(p) {
    const b = baseName(p).toLowerCase();
    const i = b.lastIndexOf(".");
    return i > 0 ? b.slice(i + 1) : "";
  }
  function defaultLabel(type, target) {
    if (type === "url") return hostOf(target) || target;
    const b = baseName(target);
    return type === "app" ? b.replace(/\.(exe|lnk|appref-ms|url)$/i, "") : b || target;
  }

  /** Öğe normalleştirme; geçersizse hata fırlatır. */
  function normalizeItem(raw, platform) {
    const x = raw && typeof raw === "object" ? raw : {};
    const type = TYPES.includes(x.type) ? x.type : null;
    if (!type) throw new Error("Öğe türü geçersiz.");
    let target = String(x.target || "").trim();
    if (type === "url") {
      target = normalizeUrl(target);
      if (!target) throw new Error("Bağlantı yalnız http:// veya https:// olabilir.");
    } else {
      if (!isAbsPath(target, platform)) throw new Error(TYPE_LABEL[type] + " için tam yol gerekir.");
      if ((platform || "win32") === "win32" && type === "app" && !APP_EXT_WIN.includes(extOf(target)))
        throw new Error("Uygulama olarak yalnız .exe, .lnk, .appref-ms veya .url eklenebilir.");
    }
    const args = type === "app" ? str(x.args, 300) : "";
    return {
      id: validId(x.id) ? x.id : makeId(),
      type,
      target,
      label: str(x.label, 80) || defaultLabel(type, target),
      args,
      enabled: x.enabled !== false,
    };
  }
  function normalizeScene(raw, platform) {
    const x = raw && typeof raw === "object" ? raw : {};
    const name = str(x.name, 60);
    if (!name) throw new Error("Sahne adı gerekli.");
    const items = [];
    const seen = new Set();
    for (const it of Array.isArray(x.items) ? x.items : []) {
      let n;
      try { n = normalizeItem(it, platform); } catch { continue; }
      const key = n.type + "|" + fold(n.target);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(n);
      if (items.length >= MAX_ITEMS) break;
    }
    const launches = (Array.isArray(x.launches) ? x.launches : [])
      .filter((l) => l && Number.isFinite(l.at) && Number.isFinite(l.ms))
      .slice(-30)
      .map((l) => ({ at: l.at, ms: Math.max(0, Math.round(l.ms)), opened: Math.max(0, l.opened | 0), failed: Math.max(0, l.failed | 0) }));
    return {
      id: validId(x.id) ? x.id : makeId(),
      name,
      purpose: str(x.purpose, 200),
      items,
      delayMs: DELAYS.includes(Number(x.delayMs)) ? Number(x.delayMs) : 700,
      manualMinutes: Number.isFinite(Number(x.manualMinutes)) && Number(x.manualMinutes) > 0 ? Math.min(240, Math.round(Number(x.manualMinutes) * 10) / 10) : null,
      archived: !!x.archived,
      createdAt: Number.isFinite(x.createdAt) ? x.createdAt : Date.now(),
      updatedAt: Number.isFinite(x.updatedAt) ? x.updatedAt : Date.now(),
      launches,
    };
  }

  // ---- Açılış planı ----
  /** Etkin öğeler sırasıyla; tahmini süre = öğe sayısı × gecikme. Kapatma adımı YOKTUR. */
  function launchPlan(scene, onlyIds) {
    const only = Array.isArray(onlyIds) && onlyIds.length ? new Set(onlyIds) : null;
    const steps = scene.items.filter((i) => i.enabled && (!only || only.has(i.id))).map((i, k) => ({ n: k + 1, id: i.id, type: i.type, label: i.label, target: i.target, args: i.args }));
    return { steps, estimateMs: Math.max(0, steps.length - 1) * scene.delayMs, closes: 0 };
  }
  /** Onay penceresinde gösterilecek metin: her adım, türü ve hedefi. */
  function planText(scene, plan) {
    const lines = plan.steps.map((s) => s.n + ". " + TYPE_LABEL[s.type] + " — " + s.label + "\n   " + s.target + (s.args ? " " + s.args : ""));
    return "“" + scene.name + "” sahnesi şu sırayla açılacak (" + plan.steps.length + " öğe, adımlar arası " + (scene.delayMs / 1000).toLocaleString("tr-TR") + " sn):\n\n" + lines.join("\n") +
      "\n\nAçık uygulama, pencere veya sekme kapatılmaz. Giriş gerektiren hesaplara otomatik giriş yapılmaz.";
  }

  // ---- Kurulum süresi ölçümü (doğrulama ölçütü: ≥ %60 azalma) ----
  function timing(scene) {
    const l = scene.launches || [];
    if (!l.length) return { runs: 0, medianSec: null, manualMinutes: scene.manualMinutes, reduction: null };
    const ms = l.map((x) => x.ms).sort((a, b) => a - b);
    const mid = ms.length >> 1;
    const med = ms.length % 2 ? ms[mid] : (ms[mid - 1] + ms[mid]) / 2;
    const medianSec = Math.round(med / 100) / 10;
    const reduction = scene.manualMinutes ? Math.max(0, Math.min(100, Math.round((1 - med / (scene.manualMinutes * 60000)) * 100))) : null;
    return { runs: l.length, medianSec, manualMinutes: scene.manualMinutes, reduction, lastAt: l[l.length - 1].at, failed: l.reduce((a, x) => a + x.failed, 0) };
  }

  // ---- Şablonlar ve kurala dayalı eksik araç önerisi ----
  // Her şablon: anahtar sözcükler (katlanmış), önerilen bağlantılar ve "olmalı" kategorileri. Yerel klasör/uygulama yolları bilinemediği için
  // önerilen klasör/uygulamalar yalnız ad olarak verilir; kullanıcı seçer.
  const TEMPLATES = [
    {
      key: "arastirma", name: "Araştırma", purpose: "Kaynak tarama, okuma ve not alma",
      words: ["arastirma", "tez", "makale", "literatur", "okuma", "kaynak", "odev", "research"],
      urls: [["Google Akademik", "https://scholar.google.com/"], ["Vikipedi", "https://tr.wikipedia.org/"], ["Zotero", "https://www.zotero.org/mylibrary"]],
      needs: [["folder", "Kaynaklar / notlar klasörü"], ["app", "Not veya PDF uygulaması"]],
    },
    {
      key: "yazilim", name: "Yazılım geliştirme", purpose: "Kod, sürüm kontrolü ve belgeler",
      words: ["kod", "kodlama", "yazilim", "gelistirme", "proje", "github", "frontend", "backend", "dev", "programlama"],
      urls: [["GitHub", "https://github.com/"], ["MDN Web Docs", "https://developer.mozilla.org/tr/"], ["Stack Overflow", "https://stackoverflow.com/"]],
      needs: [["folder", "Proje klasörü"], ["app", "Kod düzenleyici (ör. VS Code)"], ["app", "Terminal"]],
    },
    {
      key: "tasarim", name: "Tasarım", purpose: "Arayüz, görsel ve sunum hazırlığı",
      words: ["tasarim", "figma", "arayuz", "ui", "ux", "logo", "gorsel", "sunum", "design"],
      urls: [["Figma", "https://www.figma.com/files/"], ["Google Fonts", "https://fonts.google.com/"], ["Coolors", "https://coolors.co/"]],
      needs: [["folder", "Varlıklar (asset) klasörü"], ["app", "Görsel düzenleyici"]],
    },
    {
      key: "finans", name: "Fatura ve finans", purpose: "Ödemeler, faturalar ve bütçe",
      words: ["fatura", "finans", "butce", "muhasebe", "odeme", "vergi", "banka", "harcama"],
      urls: [["e-Devlet", "https://www.turkiye.gov.tr/"], ["GİB İnteraktif Vergi Dairesi", "https://ivd.gib.gov.tr/"]],
      needs: [["folder", "Faturalar klasörü"], ["file", "Bütçe tablosu"]],
    },
    {
      key: "toplanti", name: "Toplantı", purpose: "Gündem, notlar ve görüntülü görüşme",
      words: ["toplanti", "gorusme", "meeting", "gundem", "sunum", "zoom", "teams"],
      urls: [["Google Takvim", "https://calendar.google.com/"], ["Google Meet", "https://meet.google.com/"]],
      needs: [["file", "Gündem / not dosyası"], ["folder", "Toplantı notları klasörü"]],
    },
    {
      key: "yazi", name: "Yazı ve içerik", purpose: "Taslak, düzelti ve yayın",
      words: ["yazi", "blog", "icerik", "metin", "kitap", "taslak", "editor", "yayin"],
      urls: [["TDK Sözlük", "https://sozluk.gov.tr/"], ["Google Dokümanlar", "https://docs.google.com/"]],
      needs: [["folder", "Taslaklar klasörü"], ["app", "Yazı uygulaması"]],
    },
    {
      key: "kisisel", name: "Kişisel", purpose: "E-posta, takvim ve günlük işler",
      words: ["kisisel", "ev", "gunluk", "aile", "alisveris", "plan", "eposta", "mail"],
      urls: [["Gmail", "https://mail.google.com/"], ["Google Takvim", "https://calendar.google.com/"]],
      needs: [["folder", "Belgeler klasörü"]],
    },
  ];
  function matchTemplates(text) {
    const w = new Set(words(text));
    return TEMPLATES.map((t) => ({ t, score: t.words.filter((x) => w.has(x) || (x.length >= 5 && [...w].some((y) => y.startsWith(x)))).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t);
  }
  function fromTemplate(key) {
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) throw new Error("Şablon bulunamadı.");
    return { name: t.name, purpose: t.purpose, items: t.urls.map(([label, target]) => ({ type: "url", label, target })), delayMs: 700 };
  }
  /** Sahne adı/amacına uyan şablonlara göre eksik araçlar: sahnede olmayan bağlantılar (alan adına göre) ve eksik öğe türleri. Gerekçeli. */
  function suggestMissing(scene) {
    const tpl = matchTemplates(scene.name + " " + scene.purpose);
    if (!tpl.length) return [];
    const hosts = new Set(scene.items.filter((i) => i.type === "url").map((i) => hostOf(i.target)));
    const typeCount = {};
    for (const i of scene.items) typeCount[i.type] = (typeCount[i.type] || 0) + 1;
    const out = [];
    for (const t of tpl.slice(0, 2)) {
      for (const [label, url] of t.urls) {
        const h = hostOf(url);
        if (hosts.has(h) || out.some((o) => o.target === url)) continue;
        out.push({ type: "url", label, target: url, reason: "“" + t.name + "” sahnelerinde sık kullanılır" });
      }
      for (const [type, label] of t.needs) {
        if (typeCount[type] || out.some((o) => o.type === type && !o.target)) continue;
        out.push({ type, label, target: "", reason: "Sahnede hiç " + TYPE_LABEL[type].toLocaleLowerCase("tr") + " yok" });
      }
    }
    return out.slice(0, 6);
  }

  // ---- Çoklu bağlantı yapıştırma (ör. tarayıcıdan "tüm sekmelerin adresleri") ----
  function parseUrlList(text) {
    const out = [];
    const seen = new Set();
    for (const raw of String(text || "").split(/[\r\n]+/)) {
      const m = raw.match(/https?:\/\/[^\s<>"']+/i) || raw.trim().match(/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i);
      if (!m) continue;
      const u = normalizeUrl(m[0].replace(/[)\].,;]+$/, ""));
      if (!u || seen.has(u)) continue;
      seen.add(u);
      const title = raw.replace(m[0], "").replace(/\[([^\]]*)\]\(?/, "$1").replace(/^[\s\-–—|:()]+|[\s\-–—|:()]+$/g, "");
      out.push({ type: "url", target: u, label: str(title, 80) || hostOf(u) });
      if (out.length >= MAX_ITEMS) break;
    }
    return out;
  }

  // ---- İçe / dışa aktarma ----
  function exportData(scenes) {
    return JSON.stringify({ format: "pluginlabs-workspace-scenes", version: 1, exportedAt: new Date().toISOString(), scenes: scenes.map((s) => ({ ...s, launches: undefined })) }, null, 2);
  }
  function importData(text, platform) {
    let j;
    try { j = JSON.parse(String(text || "")); } catch { throw new Error("Dosya JSON değil."); }
    if (!j || j.format !== "pluginlabs-workspace-scenes" || !Array.isArray(j.scenes)) throw new Error("Bu bir Workspace Scenes yedeği değil.");
    const out = [];
    let skipped = 0;
    for (const s of j.scenes.slice(0, MAX_SCENES)) {
      try { out.push(normalizeScene({ ...s, id: undefined, launches: [] }, platform)); } catch { skipped++; }
    }
    return { scenes: out, skipped };
  }

  // ---- MyMind: görev adına göre sahne ve eksik araç önerisi (veri azaltılmış, onaylı) ----
  /** Gönderilen: görev adı/amacı + mevcut öğelerin TÜRÜ ve ETİKETİ + bağlantıların yalnız alan adı. Yerel yollar, tam URL'ler ve argümanlar gönderilmez. */
  function mymindPayload(task, scene) {
    const t = str(task, 160);
    if (t.length < 3) throw new Error("Görev adı en az 3 karakter olmalı.");
    const have = (scene && scene.items ? scene.items : []).slice(0, 20).map((i) => "- " + TYPE_LABEL[i.type] + ": " + i.label + (i.type === "url" ? " (" + hostOf(i.target) + ")" : ""));
    const sent = { task: t, purpose: scene ? str(scene.purpose, 200) : "", items: have };
    return {
      sent,
      messages: [
        { role: "system", content: "Sen bir çalışma ortamı yardımcısısın. Kullanıcının görevi için açılması faydalı araçları öner. Yerel dosya yolu uydurma. Yalnız şu JSON'u ver: {\"sahne\":\"kısa sahne adı\",\"oneriler\":[{\"tur\":\"url|klasor|uygulama|dosya\",\"ad\":\"kısa ad\",\"url\":\"yalnız tur=url ise https adresi\",\"gerekce\":\"tek cümle\"}]}. En fazla " + AI_MAX_SUGGESTIONS + " öneri; mevcut öğeleri tekrar önerme. Hiçbir şeyi kapatma önerme." },
        { role: "user", content: "Görev: " + t + (sent.purpose ? "\nAmaç: " + sent.purpose : "") + "\nSahnede olanlar:\n" + (have.length ? have.join("\n") : "(boş)") },
      ],
    };
  }
  const AI_TYPE = { url: "url", baglanti: "url", link: "url", klasor: "folder", folder: "folder", uygulama: "app", app: "app", dosya: "file", file: "file" };
  /** Yanıt doğrulaması: JSON; yalnız bilinen türler; url türünde yalnız https; mevcut alan adlarıyla yineleme yok; en fazla 5. */
  function validateAi(content, scene) {
    const t = String(content == null ? "" : content).trim().replace(/^```[a-z]*\s*|\s*```$/g, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) return { ok: false, error: "MyMind yanıtı beklenen biçimde değil." };
    let j;
    try { j = JSON.parse(t.slice(a, b + 1)); } catch { return { ok: false, error: "MyMind yanıtı çözümlenemedi." }; }
    const hosts = new Set((scene && scene.items ? scene.items : []).filter((i) => i.type === "url").map((i) => hostOf(i.target)));
    const out = [];
    let rejected = 0;
    for (const s of Array.isArray(j.oneriler) ? j.oneriler : Array.isArray(j.suggestions) ? j.suggestions : []) {
      const type = AI_TYPE[fold(s && (s.tur || s.type)).replace(/[^a-z]/g, "")];
      const label = str(s && (s.ad || s.name), 80);
      if (!type || !label) { rejected++; continue; }
      let target = "";
      if (type === "url") {
        target = normalizeUrl(s.url || s.target);
        if (!target || !target.startsWith("https://") || hosts.has(hostOf(target)) || out.some((o) => hostOf(o.target) === hostOf(target))) { rejected++; continue; }
      }
      out.push({ type, label, target, reason: str(s.gerekce || s.reason, 160) || "MyMind önerisi", ai: true });
      if (out.length >= AI_MAX_SUGGESTIONS) break;
    }
    return { ok: true, sceneName: str(j.sahne || j.scene, 60), suggestions: out, rejected };
  }

  function formatWhen(ts, now) {
    if (!ts) return "";
    const d = new Date(ts), n = new Date(now || Date.now());
    const sameDay = d.toDateString() === n.toDateString();
    return sameDay ? "bugün " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" });
  }
  function filterScenes(scenes, q, archived) {
    const f = fold(q).trim();
    return scenes.filter((s) => !!s.archived === !!archived && (!f || fold(s.name + " " + s.purpose + " " + s.items.map((i) => i.label).join(" ")).includes(f)));
  }

  return { TYPES, TYPE_LABEL, MAX_SCENES, MAX_ITEMS, DELAYS, ID_RE, AI_MAX_SUGGESTIONS, TEMPLATES, makeId, fold, normalizeUrl, hostOf, isAbsPath, baseName, extOf, normalizeItem, normalizeScene, launchPlan, planText, timing, matchTemplates, fromTemplate, suggestMissing, parseUrlList, exportData, importData, mymindPayload, validateAi, formatWhen, filterScenes };
});
