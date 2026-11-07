/* Design Token Scout — çekirdek (saf işlevler; Node testleri, ana süreç ve arayüz kullanır; ağ ve dosya erişimi yok).
 * Akış (Notion kartı): seçili sayfadaki computed style örneklerinden renk/font/spacing adayları çıkar; kullanıcı onayıyla token JSON üret.
 * • Değerler yalnız taranan sayfadan gelir; hiçbir değer uydurulmaz. Yakın değerler kümelenir (renkte ΔE76, ölçülerde px toleransı);
 *   kümenin değeri en çok kullanılan üyesidir (ortalama/yeni renk üretilmez), birleşen değerler token kaydında görünür.
 * • Dışa aktarma yalnız kullanıcının onayladığı tokenları içerir (W3C Design Tokens / DTCG biçimi, CSS değişkenleri, Markdown rapor).
 * • Yapay zekâ (MyMind) yalnız ad ve hiyerarşi önerir; değer değiştiremez, token ekleyemez; geçersiz/bilinmeyen öneriler atılır.
 * • Araç tasarım kopyalamak için değil, erişiminiz ve hakkınız olan bir arayüzün mevcut sistemini belgelemek içindir. */
(function (root) {
  "use strict";
  const MAX_SCANS = 200;
  const MAX_TOKENS_PER_CAT = 160;
  const AI_TOKENS = 60;
  const CATS = {
    color: { type: "color", ad: "Renk", group: "renk", root: "color" },
    fontFamily: { type: "fontFamily", ad: "Yazı ailesi", group: "yazi", root: "font" },
    fontSize: { type: "dimension", ad: "Yazı boyutu", group: "yazi", root: "font" },
    fontWeight: { type: "fontWeight", ad: "Yazı kalınlığı", group: "yazi", root: "font" },
    lineHeight: { type: "number", ad: "Satır yüksekliği", group: "yazi", root: "font" },
    letterSpacing: { type: "dimension", ad: "Harf aralığı", group: "yazi", root: "font" },
    space: { type: "dimension", ad: "Boşluk", group: "bosluk", root: "space" },
    radius: { type: "dimension", ad: "Köşe yarıçapı", group: "kose", root: "radius" },
    shadow: { type: "shadow", ad: "Gölge", group: "kose", root: "shadow" },
  };
  const CAT_KEYS = Object.keys(CATS);
  const GROUPS = { renk: ["color"], yazi: ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"], bosluk: ["space"], kose: ["radius", "shadow"] };
  const COVER_CATS = ["color", "fontFamily", "fontSize", "space", "radius"];
  const ROLE_AD = { metin: "metin", zemin: "zemin", kenarlik: "kenarlık", svg: "SVG", durum: "durum", margin: "dış boşluk", padding: "iç boşluk", gap: "aralık (gap)" };
  const NAME_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*){1,4}$/;
  const DISCLAIMER = "Değerler yalnız taranan sayfanın görünür öğelerinden ve okunabilen stil sayfalarından çıkarılır; kümeler birer öneridir. Dışa aktarılan dosya yalnız onayladığınız tokenları içerir. Erişiminiz ve kullanım hakkınız olan arayüzlerde kullanın.";

  // ---------------- Yardımcılar ----------------
  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max || 10000);
  const trLower = (s) => String(s).replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
  const fold = (s) => trLower(s).replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const ws = (s) => String(s).replace(/\s+/g, " ").trim();
  const round = (n, d) => { const k = Math.pow(10, d == null ? 2 : d); return Math.round(n * k) / k; };
  let seq = 0;
  const uid = (p) => (p || "t") + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
  const isWebUrl = (u) => { try { const x = new URL(String(u)); return (x.protocol === "http:" || x.protocol === "https:") && !x.username && !x.password; } catch { return false; } };
  const isLoopbackUrl = (u) => { try { const x = new URL(String(u)); return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password; } catch { return false; } };
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
  function parseTarget(input) {
    let s = ws(str(input, 2000));
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    if (!isWebUrl(s)) return null;
    const u = new URL(s);
    u.hash = "";
    return u.href;
  }
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));

  // ---------------- Renk ----------------
  /** "#rgb", "#rrggbb", "#rrggbbaa", "rgb(…)", "rgba(…)" → { r, g, b, a } ya da null. */
  function parseColor(s) {
    s = str(s, 80).trim().toLowerCase();
    let m = /^#([0-9a-f]{3,8})$/.exec(s);
    if (m) {
      let h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
      if (h.length !== 6 && h.length !== 8) return null;
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? round(parseInt(h.slice(6, 8), 16) / 255, 3) : 1 };
    }
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
    if (m) {
      const c = (v) => Math.max(0, Math.min(255, Math.round(+v)));
      let a = m[4] == null ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4];
      a = Math.max(0, Math.min(1, round(a, 3)));
      return { r: c(m[1]), g: c(m[2]), b: c(m[3]), a };
    }
    return null;
  }
  const hex2 = (n) => n.toString(16).padStart(2, "0");
  /** Tek biçim: opaksa #rrggbb, saydamlık varsa #rrggbbaa. */
  function colorHex(c) { return "#" + hex2(c.r) + hex2(c.g) + hex2(c.b) + (c.a < 1 ? hex2(Math.round(c.a * 255)) : ""); }
  const normColor = (s) => { const c = parseColor(s); return c && c.a > 0 ? colorHex(c) : ""; };
  function toLab(c) {
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const R = lin(c.r), G = lin(c.g), B = lin(c.b);
    const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return { L: 116 * f(Y) - 16, A: 500 * (f(X) - f(Y)), B: 200 * (f(Y) - f(Z)) };
  }
  /** ΔE76 (CIELAB); saydamlık farkı 0,05'ten büyükse renkler ayrı sayılır (Infinity). */
  function deltaE(a, b) {
    const x = typeof a === "string" ? parseColor(a) : a, y = typeof b === "string" ? parseColor(b) : b;
    if (!x || !y) return Infinity;
    if (Math.abs(x.a - y.a) > 0.05) return Infinity;
    const p = toLab(x), q = toLab(y);
    return Math.sqrt((p.L - q.L) ** 2 + (p.A - q.A) ** 2 + (p.B - q.B) ** 2);
  }
  function hsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  }
  /** Renk ailesi: CIELAB kroması 16'nın altındaysa nötr (gri tonlar, mavimsi "slate" griler dahil), değilse HSL tonuna göre. */
  function colorFamily(c) {
    const x = hsl(c), lab = toLab(c);
    if (Math.sqrt(lab.A * lab.A + lab.B * lab.B) < 16) return "neutral";
    const h = x.h;
    if (h < 15 || h >= 345) return "red";
    if (h < 45) return "orange";
    if (h < 70) return "yellow";
    if (h < 165) return "green";
    if (h < 195) return "teal";
    if (h < 235) return "blue";
    if (h < 260) return "indigo";
    if (h < 290) return "purple";
    return "pink";
  }
  const chroma = (c) => { const l = toLab(c); return Math.sqrt(l.A * l.A + l.B * l.B); };
  /** Açıklık basamağı (50…950): CIELAB L* değerinden; beyaz 50, siyaha yakın 950. */
  function colorStep(c) { const L = toLab(c).L; return Math.max(50, Math.min(950, Math.round((100 - L) / 10) * 100 || 50)); }
  /** WCAG göreli parlaklık kontrastı (bilgi amaçlı; renk tokenı ayrıntısında metin/zemin çiftine gösterilir). */
  function contrast(a, b) {
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const x = parseColor(a), y = parseColor(b);
    if (!x || !y) return null;
    const l1 = lum(x), l2 = lum(y);
    return round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), 2);
  }

  // ---------------- Ölçü, yazı, gölge ----------------
  const pxNum = (v) => { const m = /^(-?[\d.]+)px$/.exec(str(v, 40).trim()); return m ? round(+m[1], 2) : null; };
  const cleanFamily = (s) => ws(str(s, 200).replace(/[^\p{L}\p{N} ,'"_-]/gu, "")).slice(0, 200);
  const primaryFamily = (s) => fold(cleanFamily(s).split(",")[0].replace(/["']/g, "").trim());
  /** Hesaplanmış box-shadow → [{ color, offsetX, offsetY, blur, spread, inset }] (yalnız rgb/rgba + px biçimi; aksi null). */
  function parseShadow(s) {
    s = str(s, 400).trim();
    if (!s || s === "none") return null;
    const parts = s.split(/,(?![^(]*\))/).map((p) => p.trim()).filter(Boolean);
    const out = [];
    for (const p of parts.slice(0, 4)) {
      const cm = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/i.exec(p);
      const color = cm ? parseColor(cm[0]) : { r: 0, g: 0, b: 0, a: 1 };
      if (!color) return null;
      const rest = (cm ? p.replace(cm[0], " ") : p).trim();
      const inset = /\binset\b/.test(rest);
      const lens = rest.replace(/\binset\b/, " ").trim().split(/\s+/).filter(Boolean).map(pxNum);
      if (lens.length < 2 || lens.length > 4 || lens.some((n) => n == null)) return null;
      out.push({ color: colorHex(color), offsetX: lens[0] + "px", offsetY: lens[1] + "px", blur: (lens[2] || 0) + "px", spread: (lens[3] || 0) + "px", inset });
    }
    return out.length ? out : null;
  }
  const shadowCss = (arr) => arr.map((x) => (x.inset ? "inset " : "") + [x.offsetX, x.offsetY, x.blur, x.spread].join(" ") + " " + x.color).join(", ");
  /** Kategoriye göre değeri tek biçime getirir; anlaşılmayan değer "" döner (atlanır). */
  function normValue(cat, v) {
    if (cat === "color") return normColor(v);
    if (cat === "fontSize" || cat === "letterSpacing") { const n = pxNum(v); return n != null && n !== 0 && Math.abs(n) < 400 ? n + "px" : ""; }
    if (cat === "space") { const n = pxNum(v); return n != null && n > 0 && n < 400 ? n + "px" : ""; }
    if (cat === "radius") { if (str(v, 10).trim() === "50%") return "50%"; const n = pxNum(v); return n != null && n > 0 ? (n >= 999 ? 9999 : n) + "px" : ""; }
    if (cat === "fontWeight") { const n = parseInt(v, 10); return n >= 1 && n <= 1000 ? String(n) : ""; }
    if (cat === "lineHeight") { const n = parseFloat(v); return n > 0 && n < 10 ? String(round(n, 2)) : ""; }
    if (cat === "fontFamily") return cleanFamily(v);
    if (cat === "shadow") { const p = parseShadow(v); return p ? shadowCss(p) : ""; }
    return "";
  }
  /** İki değerin farkı (kümeleme için). Yazı ailesi: ilk aile aynıysa 0; gölge ve kalınlık: yalnız aynıysa 0. */
  function distance(cat, a, b) {
    if (a === b) return 0;
    if (cat === "color") return deltaE(a, b);
    if (cat === "fontFamily") return primaryFamily(a) === primaryFamily(b) ? 0 : Infinity;
    if (cat === "lineHeight") return Math.abs(parseFloat(a) - parseFloat(b)) * 20; // 0,05 fark ≈ 1 birim
    if (cat === "radius" && (a === "50%" || b === "50%" || a === "9999px" || b === "9999px")) return Infinity;
    if (["fontSize", "letterSpacing", "space", "radius"].includes(cat)) return Math.abs(pxNum(a) - pxNum(b));
    return Infinity;
  }

  // ---------------- Ayarlar ----------------
  const COLOR_TOLS = [0, 2, 3, 5, 8];
  const NUM_TOLS = [0, 0.5, 1, 2];
  const MIN_USES = [1, 2, 3, 5];
  const WIDTHS = [1280, 1024, 768, 390];
  const WAITS = [0, 800, 2000, 5000];
  function normalizeSettings(s) {
    s = s || {};
    const pick = (list, v, d) => (list.includes(Number(v)) ? Number(v) : d);
    return {
      scripts: s.scripts == null ? true : !!s.scripts, remote: !!s.remote,
      width: pick(WIDTHS, s.width, 1280), wait: pick(WAITS, s.wait, 0),
      colorTol: pick(COLOR_TOLS, s.colorTol, 3), numTol: pick(NUM_TOLS, s.numTol, 1), minUses: pick(MIN_USES, s.minUses, 2),
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? str(s.localUrl, 200) : "http://127.0.0.1:1234", localModel: ws(str(s.localModel, 80)),
    };
  }
  const COUNTERS = ["scans", "urlScans", "fileScans", "pasteScans", "sampleScans", "approvals", "renames", "exports", "highlights", "aiRuns", "aiDropped", "aiApplied", "rebuilds"];
  function normalizeCounters(c) { const o = {}; for (const k of COUNTERS) o[k] = Math.max(0, (c && c[k]) | 0); return o; }

  // ---------------- Ham taramayı normalleştirme ----------------
  function normEntries(cat, list) {
    const m = new Map();
    for (const e of Array.isArray(list) ? list : []) {
      if (!e) continue;
      const v = normValue(cat, e.value);
      if (!v) continue;
      let x = m.get(v);
      if (!x) { x = { value: v, uses: 0, roles: {}, samples: [] }; m.set(v, x); }
      x.uses += Math.max(1, e.uses | 0);
      for (const [r, n] of Object.entries(e.roles || {})) if (ROLE_AD[r]) x.roles[r] = (x.roles[r] || 0) + (n | 0);
      for (const sm of Array.isArray(e.samples) ? e.samples : []) if (x.samples.length < 3 && typeof sm === "string" && !x.samples.includes(sm)) x.samples.push(str(sm, 400));
    }
    return [...m.values()].sort((a, b) => b.uses - a.uses || (a.value < b.value ? -1 : 1)).slice(0, 400);
  }
  /** Sayfadaki betiğin döndürdüğü ham sonuç → tarama kaydı (tokenlar ayrıca buildTokens ile önerilir). */
  function normalizeRun(raw, meta, settings) {
    raw = raw || {};
    meta = meta || {};
    const values = {};
    for (const cat of CAT_KEYS) values[cat] = normEntries(cat, raw.values && raw.values[cat]);
    const states = (Array.isArray(raw.states) ? raw.states : []).slice(0, 400).map((s) => ({ state: str(s.state, 20), prop: str(s.prop, 30), value: s.prop === "box-shadow" ? normValue("shadow", s.value) : normColor(s.value), selector: ws(str(s.selector, 200)) })).filter((s) => s.value && /^(hover|focus-visible|focus-within|focus|active|disabled|checked)$/.test(s.state));
    // Durum renkleri, renk değerlerine "durum" rolüyle eklenir (ayrıca örneklenir; Notion: dinamik durumlar ayrıca örneklenir).
    for (const s of states) {
      if (s.prop === "box-shadow") continue;
      let e = values.color.find((x) => x.value === s.value);
      if (!e) { e = { value: s.value, uses: 0, roles: {}, samples: [] }; values.color.push(e); }
      e.uses++;
      e.roles.durum = (e.roles.durum || 0) + 1;
    }
    const vars = (Array.isArray(raw.vars) ? raw.vars : []).filter((v) => v && /^--[\w-]{1,80}$/.test(v.name)).slice(0, 400).map((v) => ({ name: v.name, value: ws(str(v.value, 200)) }));
    let expected = null;
    if (raw.expected && typeof raw.expected === "object") {
      expected = {};
      for (const cat of COVER_CATS) if (Array.isArray(raw.expected[cat])) expected[cat] = raw.expected[cat].slice(0, 60).map((v) => normValue(cat, v)).filter(Boolean);
      expected.birlesmeli = (Array.isArray(raw.expected.birlesmeli) ? raw.expected.birlesmeli : []).slice(0, 30).filter((p) => Array.isArray(p) && p.length === 2).map((p) => p.map((v) => normColor(v)));
    }
    const scan = {
      id: uid("s"), createdAt: str(meta.at, 40) || new Date().toISOString(), status: "tamam",
      target: { kind: ["url", "dosya", "yapistir", "ornek"].includes(meta.kind) ? meta.kind : "url", url: isWebUrl(meta.url) ? str(meta.url, 2000) : "", file: str(meta.file, 260), fixture: str(meta.fixture, 60) },
      finalUrl: isWebUrl(raw.url) ? str(raw.url, 2000) : "", title: ws(str(raw.title, 200)), lang: str(raw.lang, 40),
      viewport: { w: raw.viewport ? raw.viewport.w | 0 : 0, h: raw.viewport ? raw.viewport.h | 0 : 0 }, scripts: !!meta.scripts,
      counts: { elements: raw.elements | 0, sampled: raw.sampled | 0, hidden: raw.hidden | 0, capped: !!raw.capped, blockedSheets: raw.blockedSheets | 0 },
      durationMs: raw.durationMs | 0, values, vars, states, expected, tokens: [], aliases: [], tol: null, ai: null,
      base: raw.base ? { color: normColor(raw.base.color), background: normColor(raw.base.background), fontFamily: cleanFamily(raw.base.fontFamily), fontSize: normValue("fontSize", raw.base.fontSize) } : { color: "", background: "", fontFamily: "", fontSize: "" },
    };
    buildTokens(scan, settings || normalizeSettings({}));
    return scan;
  }

  // ---------------- Kümeleme ve adlandırma ----------------
  function cluster(cat, entries, tol) {
    const out = [];
    for (const e of entries) {
      const c = tol > 0 || cat === "fontFamily" ? out.find((x) => distance(cat, x.value, e.value) <= tol) : out.find((x) => x.value === e.value);
      if (c) {
        c.uses += e.uses;
        c.members.push({ value: e.value, uses: e.uses });
        for (const [r, n] of Object.entries(e.roles)) c.roles[r] = (c.roles[r] || 0) + n;
        for (const s of e.samples) if (c.samples.length < 3 && !c.samples.includes(s)) c.samples.push(s);
      } else out.push({ value: e.value, uses: e.uses, members: [{ value: e.value, uses: e.uses }], roles: { ...e.roles }, samples: e.samples.slice(0, 3) });
    }
    return out.sort((a, b) => b.uses - a.uses).slice(0, MAX_TOKENS_PER_CAT);
  }
  const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const SIZE_UP = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
  const SIZE_DOWN = ["sm", "xs", "2xs", "3xs", "4xs"];
  const WEIGHTS = { 100: "thin", 200: "extralight", 300: "light", 400: "regular", 500: "medium", 600: "semibold", 700: "bold", 800: "extrabold", 900: "black" };
  /** Boşluklar için taban ızgara: kullanımların ≥%80'i 8'in, 4'ün ya da 2'nin katıysa o taban. */
  function spaceGrid(entries) {
    const total = entries.reduce((a, e) => a + e.uses, 0);
    if (!total) return null;
    for (const base of [8, 4, 2]) {
      const fit = entries.reduce((a, e) => a + (Math.abs(pxNum(e.value) / base - Math.round(pxNum(e.value) / base)) < 0.01 ? e.uses : 0), 0);
      if (fit / total >= 0.8) return { base, share: round((fit / total) * 100, 1) };
    }
    return null;
  }
  /** Yazı boyutu ölçeği: ardışık boyut oranlarının ortancası. */
  function typeScale(values) {
    const nums = [...new Set(values.map(pxNum).filter((n) => n > 0))].sort((a, b) => a - b);
    if (nums.length < 3) return null;
    const r = [];
    for (let i = 1; i < nums.length; i++) r.push(nums[i] / nums[i - 1]);
    r.sort((a, b) => a - b);
    return { ratio: round(r[Math.floor(r.length / 2)], 2), sizes: nums.length };
  }
  function relativeNames(sortedVals, baseIndex) {
    const names = [];
    for (let i = 0; i < sortedVals.length; i++) {
      const d = i - baseIndex;
      names.push(d === 0 ? "md" : d > 0 ? (SIZE_UP[d - 1] || "xl-" + d) : (SIZE_DOWN[-d - 1] || "xs-" + -d));
    }
    return names;
  }
  /** Seyrek (eşik altı) ama yapısal değer: sayfa değişkeninde tanımlı, gövde (body/html) stili ya da başlık (h1–h6) yazı boyutu. */
  const ANCHOR_AD = { degisken: "sayfa değişkeni", govde: "sayfa gövdesi", baslik: "başlık boyutu" };
  function anchorOf(scan, cat, c, varName) {
    if (varName) return "degisken";
    const b = scan.base || {};
    const hasM = (v) => v && c.members.some((m) => m.value === v);
    if ((cat === "color" && (hasM(b.color) || hasM(b.background))) || (cat === "fontSize" && hasM(b.fontSize)) || (cat === "fontFamily" && b.fontFamily && primaryFamily(b.fontFamily) === primaryFamily(c.value))) return "govde";
    if (c.samples.some((s) => /^(html|body)$/.test(s))) return "govde";
    if (cat === "fontSize" && c.samples.some((s) => /(^|[\s>])h[1-6]\b/.test(s))) return "baslik";
    return "";
  }
  /** Taramanın değerlerinden token önerileri ve anlamsal takma adlar üretir. Kullanıcının ad/onay düzenlemeleri silinir (yeniden öner). */
  function buildTokens(scan, settings) {
    settings = normalizeSettings(settings);
    const tokens = [];
    const tolFor = (cat) => (cat === "color" ? settings.colorTol : cat === "lineHeight" ? (settings.numTol ? 1 : 0) : ["fontSize", "letterSpacing", "space", "radius"].includes(cat) ? settings.numTol : 0);
    const varByValue = new Map();
    for (const v of scan.vars) {
      for (const cat of ["color", "space", "radius", "fontSize"]) { const n = normValue(cat, v.value); if (n && !varByValue.has(cat + "|" + n)) varByValue.set(cat + "|" + n, v.name); }
    }
    for (const cat of CAT_KEYS) {
      const cl = cluster(cat, scan.values[cat] || [], tolFor(cat));
      let names = [];
      if (cat === "color") names = cl.map((c) => { const p = parseColor(c.value); return "color." + colorFamily(p) + "." + colorStep(p) + (p.a < 1 ? "-a" + Math.round(p.a * 100) : ""); });
      else if (cat === "fontSize") {
        const sorted = cl.slice().sort((a, b) => pxNum(a.value) - pxNum(b.value));
        const baseC = scan.base && scan.base.fontSize ? cl.find((c) => c.members.some((m) => m.value === scan.base.fontSize)) : null;
        const rel = relativeNames(sorted, sorted.indexOf(baseC || cl[0]));
        names = cl.map((c) => "font.size." + rel[sorted.indexOf(c)]);
      } else if (cat === "fontFamily") {
        let alt = 0;
        const bi = scan.base && scan.base.fontFamily ? Math.max(0, cl.findIndex((c) => primaryFamily(c.value) === primaryFamily(scan.base.fontFamily))) : 0;
        names = cl.map((c, i) => "font.family." + (i === bi ? "base" : /monospace|mono\b|consolas|courier/i.test(c.value) ? "mono" : c.samples.some((s) => /(^|[\s>])h[1-6]\b/.test(s)) ? "heading" : "alt" + (alt++ ? "-" + alt : "")));
      } else if (cat === "fontWeight") names = cl.map((c) => "font.weight." + (WEIGHTS[c.value] || c.value));
      else if (cat === "lineHeight") names = cl.map((c) => { const v = parseFloat(c.value); return "font.line-height." + (v < 1.2 ? "tight" : v < 1.35 ? "snug" : v < 1.55 ? "normal" : v < 1.75 ? "relaxed" : "loose"); });
      else if (cat === "letterSpacing") { const s = cl.slice().sort((a, b) => pxNum(a.value) - pxNum(b.value)); names = cl.map((c) => "font.letter-spacing." + (s.indexOf(c) + 1)); }
      else if (cat === "space") {
        const grid = spaceGrid(cl.map((c) => ({ value: c.value, uses: c.uses })));
        const s = cl.slice().sort((a, b) => pxNum(a.value) - pxNum(b.value));
        names = cl.map((c) => "space." + (grid && grid.base === 4 || grid && grid.base === 8 ? String(round(pxNum(c.value) / 4, 2)).replace(".", "-") : String(s.indexOf(c) + 1)));
      } else if (cat === "radius") {
        const s = cl.filter((c) => c.value !== "50%" && c.value !== "9999px").sort((a, b) => pxNum(a.value) - pxNum(b.value));
        const rel = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
        const off = s.length >= 5 ? 0 : 1;
        names = cl.map((c) => "radius." + (c.value === "50%" ? "circle" : c.value === "9999px" ? "full" : rel[s.indexOf(c) + off] || "r" + (s.indexOf(c) + 1)));
      } else if (cat === "shadow") { const s = cl.slice().sort((a, b) => a.value.length - b.value.length); names = cl.map((c) => "shadow." + (["sm", "md", "lg", "xl", "2xl"][s.indexOf(c)] || String(s.indexOf(c) + 1))); }
      cl.forEach((c, i) => {
        const varName = varByValue.get(cat + "|" + c.value) || "";
        let name = names[i];
        if (varName) { const base = slug(varName.replace(/^--/, "").replace(/^(color|clr|c|space|spacing|radius|rounded|font-size|fs|text)-/, "")); if (base) name = CATS[cat].root + "." + (cat === "fontSize" ? "size." : "") + base; }
        tokens.push({ id: uid("k"), cat, type: CATS[cat].type, name, value: c.value, uses: c.uses, members: c.members.slice(0, 20), roles: c.roles, samples: c.samples, varName, anchor: anchorOf(scan, cat, c, varName), ok: false, nameSource: varName ? "degisken" : "otomatik" });
      });
    }
    // Ad çakışması: sonradan gelenlere -2, -3…
    const seen = new Map();
    for (const t of tokens) { const n = seen.get(t.name) || 0; seen.set(t.name, n + 1); if (n) t.name = t.name + "-" + (n + 1); }
    // Anlamsal takma adlar (yalnız renk): en çok metin/zemin/kenarlık rengi, en çok kullanılan doygun renk (vurgu) ve durum renkleri.
    const colors = tokens.filter((t) => t.cat === "color");
    const topBy = (role, filter) => colors.filter((t) => (t.roles[role] || 0) > 0 && (!filter || filter(t))).sort((a, b) => (b.roles[role] || 0) - (a.roles[role] || 0))[0];
    const aliases = [];
    const addAlias = (name, t, reason) => { if (t && !aliases.some((a) => a.name === name)) aliases.push({ id: uid("a"), name, ref: t.id, reason, ok: true }); };
    const b = scan.base || {};
    const byMember = (v) => (v ? colors.find((t) => t.members.some((m) => m.value === v)) : null);
    addAlias("color.text.default", byMember(b.color) || topBy("metin"), byMember(b.color) ? "sayfa gövdesinin metin rengi" : "en çok kullanılan metin rengi");
    addAlias("color.surface.default", byMember(b.background) || topBy("zemin"), byMember(b.background) ? "sayfa gövdesinin zemin rengi" : "en çok kullanılan zemin rengi");
    addAlias("color.border.default", topBy("kenarlik"), "en çok kullanılan kenarlık rengi");
    const tmp = { tol: { minUses: settings.minUses } };
    const score = (t) => (t.roles.zemin || 0) + (t.roles.svg || 0) + (t.roles.durum || 0) + (t.roles.metin || 0) / 2;
    const accent = colors.filter((t) => { const p = parseColor(t.value); return p && p.a === 1 && chroma(p) >= 24 && hsl(p).l > 0.15 && hsl(p).l < 0.85; }).sort((a, b) => (proposed(tmp, b) ? 1 : 0) - (proposed(tmp, a) ? 1 : 0) || score(b) - score(a) || b.uses - a.uses)[0];
    addAlias("color.accent.default", accent, "en çok kullanılan doygun renk");
    for (const st of ["hover", "focus-visible", "focus", "active", "disabled"]) {
      const vals = scan.states.filter((s) => s.state === st && s.prop !== "box-shadow").map((s) => s.value);
      if (!vals.length) continue;
      const count = new Map();
      for (const v of vals) { const t = colors.find((c) => c.members.some((m) => m.value === v)); if (t) count.set(t, (count.get(t) || 0) + 1); }
      const best = [...count].sort((a, b) => b[1] - a[1])[0];
      if (best) addAlias("color.state." + st, best[0], ":" + st + " kurallarında en sık renk");
    }
    scan.tokens = tokens;
    scan.aliases = aliases;
    scan.tol = { colorTol: settings.colorTol, numTol: settings.numTol, minUses: settings.minUses };
    scan.ai = null;
    return scan;
  }
  function proposed(scan, t) { return t.uses >= ((scan.tol && scan.tol.minUses) || 2) || !!t.anchor; }
  function approveProposed(scan) { let n = 0; for (const t of scan.tokens) if (!t.ok && proposed(scan, t)) { t.ok = true; n++; } return n; }
  function validateName(scan, id, name) {
    name = str(name, 120).trim();
    if (!NAME_RE.test(name)) return "Ad küçük harf, rakam ve tire içeren 2–5 parçalı nokta yolu olmalı (örn. color.brand.primary).";
    const t = scan.tokens.find((x) => x.id === id) || scan.aliases.find((x) => x.id === id);
    if (!t) return "Token bulunamadı.";
    if (t.cat && name.split(".")[0] !== CATS[t.cat].root) return "Bu token “" + CATS[t.cat].root + ".” ile başlamalı.";
    if (scan.tokens.some((x) => x.id !== id && x.name === name) || scan.aliases.some((x) => x.id !== id && x.name === name)) return "Bu ad başka bir token tarafından kullanılıyor.";
    if ([...scan.tokens, ...scan.aliases].some((x) => x.id !== id && (x.name.startsWith(name + ".") || name.startsWith(x.name + ".")))) return "Bu ad başka bir tokenın grubuyla çakışıyor (bir token hem değer hem grup olamaz).";
    return "";
  }

  // ---------------- Özet ve ölçüler ----------------
  function summarize(scan) {
    const raw = CAT_KEYS.reduce((a, c) => a + (scan.values[c] || []).length, 0);
    const okTokens = scan.tokens.filter((t) => t.ok);
    const prop = scan.tokens.filter((t) => proposed(scan, t));
    const totalUses = COVER_CATS.reduce((a, c) => a + (scan.values[c] || []).reduce((x, e) => x + e.uses, 0), 0);
    const coverOf = (list) => (totalUses ? round((list.filter((t) => COVER_CATS.includes(t.cat)).reduce((a, t) => a + t.uses, 0) / totalUses) * 100, 1) : null);
    const byCat = {};
    for (const c of CAT_KEYS) byCat[c] = { raw: (scan.values[c] || []).length, tokens: scan.tokens.filter((t) => t.cat === c).length, ok: okTokens.filter((t) => t.cat === c).length };
    return {
      raw, tokens: scan.tokens.length, proposed: prop.length, ok: okTokens.length, byCat,
      coverage: coverOf(okTokens), proposedCoverage: coverOf(prop),
      reduction: raw ? round((1 - prop.length / raw) * 100, 1) : null, okReduction: raw && okTokens.length ? round((1 - okTokens.length / raw) * 100, 1) : null,
      grid: spaceGrid(scan.values.space || []), scale: typeScale((scan.values.fontSize || []).map((e) => e.value)),
      vars: scan.vars.length, states: scan.states.length, aliases: scan.aliases.length,
    };
  }
  /** Örnek sayfa doğrulaması: beklenen ana değerlerin önerilen (ya da onaylı) tokenlarda bulunma oranı ve birleşmesi gereken çiftler. */
  function evaluateFixture(scan) {
    const ex = scan.expected;
    if (!ex) return null;
    const pool = scan.tokens.filter((t) => t.ok || proposed(scan, t));
    let total = 0, hit = 0;
    const missed = [];
    const byCat = {};
    for (const cat of COVER_CATS) {
      const list = ex[cat] || [];
      let h = 0;
      for (const v of list) {
        total++;
        const ok = pool.some((t) => t.cat === cat && (t.value === v || t.members.some((m) => m.value === v) || (cat === "color" ? deltaE(t.value, v) <= 2.3 : cat === "fontFamily" ? primaryFamily(t.value) === primaryFamily(v) : Math.abs(pxNum(t.value) - pxNum(v)) <= 0.5)));
        if (ok) { hit++; h++; } else missed.push(CATS[cat].ad + " " + v);
      }
      byCat[cat] = { expected: list.length, hit: h };
    }
    const pairs = ex.birlesmeli || [];
    const merged = pairs.filter(([a, b]) => scan.tokens.some((t) => t.cat === "color" && t.members.some((m) => m.value === a) && t.members.some((m) => m.value === b))).length;
    return { expected: total, hit, coverage: total ? round((hit / total) * 100, 1) : null, missed, byCat, pairs: pairs.length, merged };
  }
  const pageKey = (s) => (s.target.kind === "ornek" ? "ornek:" + s.target.fixture : s.target.kind === "url" ? "url:" + s.target.url : s.target.kind === "dosya" ? "dosya:" + s.target.file : "yapistir:" + s.id);
  function metrics(scans, counters) {
    const live = scans.filter((s) => s.status !== "arsiv");
    const latest = new Map();
    for (const s of live) if (s.target.kind === "ornek" && s.expected && !latest.has(s.target.fixture)) latest.set(s.target.fixture, s);
    let fixture = null;
    if (latest.size) {
      const ev = [...latest.values()].map(evaluateFixture);
      const expected = ev.reduce((a, e) => a + e.expected, 0), hit = ev.reduce((a, e) => a + e.hit, 0);
      const reds = [...latest.values()].map((s) => summarize(s).reduction).filter((x) => x != null);
      fixture = { pages: latest.size, expected, hit, coverage: expected ? round((hit / expected) * 100, 1) : null, minPage: round(Math.min(...ev.map((e) => e.coverage)), 1), pairs: ev.reduce((a, e) => a + e.pairs, 0), merged: ev.reduce((a, e) => a + e.merged, 0), reduction: reds.length ? round(reds.reduce((a, b) => a + b, 0) / reds.length, 1) : null };
    }
    const sums = live.map(summarize);
    return {
      scans: scans.length, live: live.length, fixture,
      tokens: sums.reduce((a, s) => a + s.ok, 0), avgReduction: sums.length ? round(sums.reduce((a, s) => a + (s.reduction || 0), 0) / sums.length, 1) : null,
      ...normalizeCounters(counters),
    };
  }

  // ---------------- Kalıcılık doğrulaması ----------------
  function normalizeScans(list) {
    return (Array.isArray(list) ? list : []).filter((s) => s && typeof s.id === "string" && s.values && Array.isArray(s.tokens)).slice(0, MAX_SCANS).map((s) => ({
      ...s, status: s.status === "arsiv" ? "arsiv" : "tamam", vars: Array.isArray(s.vars) ? s.vars : [], states: Array.isArray(s.states) ? s.states : [], aliases: Array.isArray(s.aliases) ? s.aliases : [],
      tokens: s.tokens.filter((t) => t && CATS[t.cat] && typeof t.name === "string").map((t) => ({ ...t, ok: !!t.ok, members: Array.isArray(t.members) ? t.members : [], samples: Array.isArray(t.samples) ? t.samples : [], roles: t.roles || {} })),
    }));
  }

  // ---------------- Dışa aktarma ----------------
  const cssVar = (name) => "--" + name.replace(/\./g, "-");
  function dtcgValue(t) {
    if (t.cat === "fontFamily") return t.value.split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    if (t.cat === "fontWeight") return Number(t.value);
    if (t.cat === "lineHeight") return Number(t.value);
    if (t.cat === "shadow") { const p = parseShadow(t.value) || []; const o = p.map((x) => ({ color: x.color, offsetX: x.offsetX, offsetY: x.offsetY, blur: x.blur, spread: x.spread, ...(x.inset ? { inset: true } : {}) })); return o.length === 1 ? o[0] : o; }
    return t.value;
  }
  function exportable(scan) {
    const tokens = scan.tokens.filter((t) => t.ok);
    const ids = new Set(tokens.map((t) => t.id));
    const aliases = scan.aliases.filter((a) => a.ok && ids.has(a.ref)).map((a) => ({ ...a, target: tokens.find((t) => t.id === a.ref) }));
    return { tokens, aliases };
  }
  function setPath(obj, name, leaf) {
    const parts = name.split(".");
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== "object" || "$value" in o[parts[i]]) o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = leaf;
  }
  const sourceOf = (s) => s.finalUrl || s.target.url || (s.target.kind === "dosya" ? "dosya: " + s.target.file : s.target.kind === "ornek" ? "örnek sayfa: " + s.target.fixture : "yapıştırılan HTML");
  function exportDtcg(scan, version) {
    const { tokens, aliases } = exportable(scan);
    const out = { $description: "Design Token Scout " + version + " — " + (scan.title || sourceOf(scan)) + " sayfasından çıkarılan, kullanıcının onayladığı tokenlar.", $extensions: { "com.pluginlabs.design-token-scout": { version, source: sourceOf(scan), scannedAt: scan.createdAt, viewport: scan.viewport.w + "x" + scan.viewport.h, colorTolerance: "ΔE76 " + scan.tol.colorTol, sizeTolerance: scan.tol.numTol + "px" } } };
    for (const t of tokens) {
      setPath(out, t.name, { $type: t.type, $value: dtcgValue(t), $description: t.uses + " kullanım" + (t.members.length > 1 ? " · birleşen: " + t.members.map((m) => m.value).join(", ") : "") + (t.varName ? " · sayfadaki değişken: " + t.varName : ""), $extensions: { "com.pluginlabs.design-token-scout": { uses: t.uses, members: t.members, cssVar: cssVar(t.name) } } });
    }
    for (const a of aliases) setPath(out, a.name, { $type: a.target.type, $value: "{" + a.target.name + "}", $description: a.reason });
    return JSON.stringify(out, null, 2) + "\n";
  }
  function cssValue(t) {
    if (t.cat === "fontFamily") return t.value.split(",").map((x) => { const v = x.trim().replace(/^["']|["']$/g, ""); return /\s/.test(v) ? '"' + v.replace(/"/g, "") + '"' : v; }).join(", ");
    return t.value;
  }
  function exportCss(scan, version) {
    const { tokens, aliases } = exportable(scan);
    const lines = ["/* Design Token Scout " + version + " — " + sourceOf(scan).replace(/\*\//g, "") + " · " + scan.createdAt.slice(0, 10) + " · yalnız onaylı tokenlar */", ":root {"];
    for (const cat of CAT_KEYS) {
      const list = tokens.filter((t) => t.cat === cat);
      if (!list.length) continue;
      lines.push("  /* " + CATS[cat].ad + " */");
      for (const t of list) lines.push("  " + cssVar(t.name) + ": " + cssValue(t) + "; /* " + t.uses + " kullanım */");
    }
    if (aliases.length) { lines.push("  /* Anlamsal takma adlar */"); for (const a of aliases) lines.push("  " + cssVar(a.name) + ": var(" + cssVar(a.target.name) + ");"); }
    lines.push("}");
    return lines.join("\n") + "\n";
  }
  const mdCell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  function exportMarkdown(scan, version) {
    const sm = summarize(scan);
    const { tokens, aliases } = exportable(scan);
    const fe = evaluateFixture(scan);
    const L = ["# Tasarım tokenları — " + mdCell(scan.title || sourceOf(scan)), "", "- Kaynak: " + mdCell(sourceOf(scan)), "- Tarama: " + scan.createdAt + " · görünüm " + scan.viewport.w + "×" + scan.viewport.h + " · sayfa betikleri " + (scan.scripts ? "açık" : "kapalı"), "- Örneklenen öğe: " + scan.counts.sampled + " / " + scan.counts.elements + (scan.counts.capped ? " (üst sınıra ulaşıldı)" : "") + (scan.counts.blockedSheets ? " · okunamayan stil sayfası: " + scan.counts.blockedSheets : ""), "- Birleştirme: renkte ΔE76 ≤ " + scan.tol.colorTol + ", ölçülerde ≤ " + scan.tol.numTol + " px · öneri eşiği " + scan.tol.minUses + " kullanım", "- Araç: Design Token Scout " + version, "",
      "## Özet", "", "| Ölçü | Değer |", "| --- | --- |", "| Farklı ham değer | " + sm.raw + " |", "| Önerilen token | " + sm.proposed + " |", "| Onaylı token | " + sm.ok + " |", "| Onaylı tokenların kullanım kapsaması | " + pctText(sm.coverage) + " |", "| Önerilenlerle tekrar düşüşü | " + pctText(sm.reduction) + " |",
      sm.grid ? "| Boşluk ızgarası | " + sm.grid.base + " px (kullanımların " + pctText(sm.grid.share) + "'i) |" : "| Boşluk ızgarası | belirgin değil |", sm.scale ? "| Yazı ölçeği (ortanca oran) | " + String(sm.scale.ratio).replace(".", ",") + " |" : "| Yazı ölçeği | yetersiz veri |", ""];
    if (fe) L.push("Örnek sayfa doğrulaması: beklenen " + fe.expected + " ana değerin " + fe.hit + "'i önerilerde (" + pctText(fe.coverage) + "); birleşmesi gereken " + fe.pairs + " çiftin " + fe.merged + "'i birleşti." + (fe.missed.length ? " Kaçırılan: " + fe.missed.join(", ") + "." : ""), "");
    for (const cat of CAT_KEYS) {
      const list = tokens.filter((t) => t.cat === cat);
      if (!list.length) continue;
      L.push("## " + CATS[cat].ad, "", "| Token | CSS | Değer | Kullanım | Birleşen değerler |", "| --- | --- | --- | --- | --- |");
      for (const t of list) L.push("| `" + t.name + "` | `" + cssVar(t.name) + "` | `" + mdCell(t.value) + "` | " + t.uses + " | " + (t.members.length > 1 ? mdCell(t.members.map((m) => m.value + " (" + m.uses + ")").join(", ")) : "—") + " |");
      L.push("");
    }
    if (aliases.length) { L.push("## Anlamsal takma adlar", "", "| Takma ad | Gösterdiği token | Gerekçe |", "| --- | --- | --- |"); for (const a of aliases) L.push("| `" + a.name + "` | `" + a.target.name + "` | " + mdCell(a.reason) + " |"); L.push(""); }
    if (scan.vars.length) { L.push("## Sayfada tanımlı CSS değişkenleri (" + scan.vars.length + ")", ""); for (const v of scan.vars.slice(0, 80)) L.push("- `" + mdCell(v.name) + "`: `" + mdCell(v.value) + "`"); L.push(""); }
    const skipped = scan.tokens.filter((t) => !t.ok).length;
    L.push("## Notlar", "", "- " + skipped + " aday onaylanmadığı için dosyalara alınmadı.", "- " + DISCLAIMER, "- Görünmeyen durumlar (açılır menü, modal, karanlık tema) ancak sayfada görünür olduklarında örneklenir; :hover/:focus renkleri okunabilen stil sayfalarından ayrıca toplanır.");
    return L.join("\n") + "\n";
  }

  // ---------------- Yapay zekâ (adlandırma önerisi) ----------------
  /** Modele yalnız token türü, değeri ve kullanım sayısı gider: sayfa adresi, başlığı, seçiciler ve metinler gönderilmez. */
  function aiPayload(scan) {
    const list = scan.tokens.filter((t) => t.ok || proposed(scan, t)).slice(0, AI_TOKENS);
    const map = {};
    const rows = list.map((t, i) => { const k = "t" + (i + 1); map[k] = t.id; return { id: k, tur: t.cat, deger: t.value, kullanim: t.uses, rol: Object.keys(t.roles).filter((r) => r !== "durum").join("/") || undefined, simdikiAd: t.name }; });
    const system = "Sen bir tasarım sistemi adlandırma yardımcısısın. Sana bir arayüzden çıkarılmış token adayları verilir (tür, değer, kullanım). Görevin yalnız anlamlı ad ve hiyerarşi önermek. Değer DEĞİŞTİRME, yeni token EKLEME, renk/ölçü UYDURMA. Ad biçimi: küçük harf nokta yolu, 2–5 parça; ilk parça türe göre: color, font, space, radius, shadow (örn. color.brand.primary, color.neutral.100, font.size.body, space.4, radius.card). Yalnız şu JSON'u döndür: {\"oneriler\":[{\"id\":\"t1\",\"ad\":\"color.brand.primary\",\"neden\":\"kısa gerekçe\"}]}";
    const user = "Token adayları (JSON):\n" + JSON.stringify(rows);
    return { messages: [{ role: "system", content: system }, { role: "user", content: user }], map, sent: { tokens: rows.length, chars: user.length } };
  }
  function parseJsonLoose(text) {
    const s = str(text, 120000);
    const m = /```(?:json)?\s*([\s\S]*?)```/.exec(s);
    const cand = m ? m[1] : s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1);
    try { return JSON.parse(cand); } catch { return null; }
  }
  /** Model yanıtını doğrular: yalnız bilinen tokenlara, geçerli ve türüne uygun, benzersiz adlar kalır. */
  function validateAi(text, scan, map) {
    const j = parseJsonLoose(text);
    const list = j && Array.isArray(j.oneriler) ? j.oneriler.slice(0, AI_TOKENS * 2) : [];
    const out = [];
    let dropped = j ? 0 : 1;
    const used = new Set();
    for (const o of list) {
      const id = o && map[str(o.id, 10)];
      const t = id && scan.tokens.find((x) => x.id === id);
      const name = str(o && o.ad, 120).trim();
      if (!t || !NAME_RE.test(name) || name.split(".")[0] !== CATS[t.cat].root || used.has(name) || out.some((x) => x.id === id)) { dropped++; continue; }
      used.add(name);
      out.push({ id, name, from: t.name, why: ws(str(o.neden, 200)) });
    }
    return { suggestions: out, dropped };
  }
  /** Önerileri uygular; mevcut başka bir adla çakışan öneri atlanır. */
  function applyAi(scan) {
    if (!scan.ai) return 0;
    let n = 0;
    for (const s of scan.ai.suggestions) {
      const t = scan.tokens.find((x) => x.id === s.id);
      if (!t || t.name === s.name) continue;
      if (validateName(scan, t.id, s.name)) continue;
      t.name = s.name; t.nameSource = "mymind"; n++;
    }
    scan.ai.applied = true;
    return n;
  }

  const api = {
    MAX_SCANS, CATS, CAT_KEYS, GROUPS, COVER_CATS, ROLE_AD, NAME_RE, DISCLAIMER, COLOR_TOLS, NUM_TOLS, MIN_USES,
    str, fold, ws, round, isWebUrl, isLoopbackUrl, hostOf, parseTarget, pctText,
    parseColor, colorHex, normColor, deltaE, hsl, colorFamily, colorStep, contrast, pxNum, parseShadow, normValue, distance,
    ANCHOR_AD, chroma, normalizeSettings, normalizeCounters, normalizeRun, normalizeScans, cluster, buildTokens, proposed, approveProposed, validateName, spaceGrid, typeScale,
    summarize, evaluateFixture, pageKey, metrics, cssVar, exportDtcg, exportCss, exportMarkdown, aiPayload, validateAi, applyAi, parseJsonLoose,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DTSCore = api;
})(typeof window !== "undefined" ? window : globalThis);
