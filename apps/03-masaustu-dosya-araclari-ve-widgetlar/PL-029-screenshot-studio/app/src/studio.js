/* Screenshot Studio — çekirdek (saf işlevler; hem ana süreçte `require` ile hem arayüzde `window.SSCore` olarak çalışır).
 * İçerik: ayarlar, dosya adı, hassas alan adayı kuralları (OCR satırlarından), çerçeve yerleşimi, maske doğrulaması (piksel piksel),
 * geçmiş istatistikleri ve MyMind isteğinin veri azaltılmış yükü + yanıt doğrulaması. Ağ, dosya sistemi ve DOM kullanmaz. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SSCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const LIMITS = { history: 500, side: 16384, pixels: 80e6, annotations: 400, candidates: 200, aiWords: 150, aiOut: 40, minSel: 4 };
  const SHORTCUTS = ["CommandOrControl+Shift+X", "CommandOrControl+Alt+S", "CommandOrControl+Shift+2", "PrintScreen", "off"];
  const SHORTCUT_LABEL = { "CommandOrControl+Shift+X": "Ctrl + Shift + X", "CommandOrControl+Alt+S": "Ctrl + Alt + S", "CommandOrControl+Shift+2": "Ctrl + Shift + 2", PrintScreen: "PrtSc (Print Screen)", off: "Kapalı" };
  const FRAMES = { none: "Çerçevesiz", shadow: "Boşluk ve gölge", window: "Pencere çerçevesi" };
  const BACKDROPS = {
    iris: { label: "İris", stops: ["#7c6cff", "#22d3ee"] },
    gece: { label: "Gece", stops: ["#1b2236", "#0b0f1a"] },
    gun: { label: "Gün", stops: ["#f5f7fb", "#dfe5f1"] },
    mercan: { label: "Mercan", stops: ["#fb7185", "#f0b429"] },
  };
  const FORMATS = { png: { label: "PNG", ext: ".png", mime: "image/png" }, jpeg: { label: "JPEG", ext: ".jpg", mime: "image/jpeg" } };
  const MASK_COLORS = ["#000000", "#ffffff", "#1b2236"];
  const COLORS = ["#ff4d4f", "#f0b429", "#22c55e", "#3b82f6", "#7c6cff", "#ffffff", "#0b0f1a"];
  const TOOLS = ["select", "arrow", "rect", "number", "text", "highlight", "blur", "mask", "crop"];

  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max || 500);
  const int = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const hex = (v, d) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d);

  function normalizeSettings(s) {
    const o = s && typeof s === "object" ? s : {};
    return {
      shortcut: SHORTCUTS.includes(o.shortcut) ? o.shortcut : SHORTCUTS[0],
      format: FORMATS[o.format] ? o.format : "png",
      jpegQuality: int(o.jpegQuality, 50, 100, 92),
      frame: FRAMES[o.frame] ? o.frame : "none",
      backdrop: BACKDROPS[o.backdrop] ? o.backdrop : "iris",
      frameTitle: str(o.frameTitle, 80),
      maskColor: hex(o.maskColor, "#000000"),
      autoScan: o.autoScan !== false,
      hideOnCapture: o.hideOnCapture !== false,
      copyAfterSave: !!o.copyAfterSave,
      output: o.output === "folder" ? "folder" : "pictures",
      outputDir: str(o.outputDir, 1000),
      reduceMotion: !!o.reduceMotion,
    };
  }

  // ---- Dosya adı ----
  const pad2 = (n) => String(n).padStart(2, "0");
  function stamp(ms) { const d = new Date(ms); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " + pad2(d.getHours()) + "." + pad2(d.getMinutes()) + "." + pad2(d.getSeconds()); }
  /** "Ekran görüntüsü 2026-11-01 13.45.12.png"; ad varsa " (2)", " (3)" … eklenir. Yol ayırıcıları ve Windows'ta yasak karakterler ayıklanır. */
  function outputName(ms, format, exists, base) {
    const ext = (FORMATS[format] || FORMATS.png).ext;
    const b = (str(base, 120).replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "")) || "Ekran görüntüsü " + stamp(ms);
    for (let i = 1; i < 1000; i++) {
      const n = b + (i > 1 ? " (" + i + ")" : "") + ext;
      if (!exists || !exists(n)) return n;
    }
    throw new Error("Uygun dosya adı bulunamadı.");
  }

  // ---- Doğrulayıcılar ----
  function luhn(digits) {
    const d = String(digits).replace(/\D/g, "");
    if (d.length < 13 || d.length > 19 || /^(\d)\1+$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < d.length; i++) { let x = d.charCodeAt(d.length - 1 - i) - 48; if (i % 2) { x *= 2; if (x > 9) x -= 9; } sum += x; }
    return sum % 10 === 0;
  }
  function ibanValid(v) {
    const s = String(v).replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    if (s.startsWith("TR") && s.length !== 26) return false;
    const r = s.slice(4) + s.slice(0, 4);
    let m = 0;
    for (const ch of r) { const n = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55); for (const c of n) m = (m * 10 + (c.charCodeAt(0) - 48)) % 97; }
    return m === 1;
  }
  function tcknValid(v) {
    const d = String(v);
    if (!/^[1-9]\d{10}$/.test(d)) return false;
    const n = d.split("").map(Number);
    const d10 = ((n[0] + n[2] + n[4] + n[6] + n[8]) * 7 - (n[1] + n[3] + n[5] + n[7])) % 10;
    const t = (d10 + 10) % 10;
    if (t !== n[9]) return false;
    return n.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === n[10];
  }

  /** Kurallar: her biri { kind, label, re, check?, group? }. `group` verilirse yalnız o grup maskelenir (ör. "Şifre: X" → yalnız X). */
  const RULES = [
    { kind: "secret", label: "API anahtarı / erişim belirteci", re: /\b(?:sk-[A-Za-z0-9_-]{16,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,})/g },
    { kind: "labeled", label: "Etiketli gizli değer (şifre, PIN, token …)", re: /(?:şifre|sifre|parola|password|passwd|pwd|pin|cvv|cvc|token|api[ _-]?key|secret|gizli anahtar|doğrulama kodu|dogrulama kodu|otp)\s*[:=]\s*(\S{3,})/giu, group: 1 },
    { kind: "email", label: "E-posta adresi", re: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}/gu },
    { kind: "iban", label: "IBAN", re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\b/gi, check: ibanValid },
    { kind: "card", label: "Kart numarası", re: /\b\d(?:[ -]?\d){12,18}\b/g, check: luhn },
    { kind: "tckn", label: "T.C. kimlik numarası", re: /\b[1-9]\d{10}\b/g, check: tcknValid },
    { kind: "phone", label: "Telefon numarası", re: /(?:\+90[\s-]?|\b0[\s-]?)?\(?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b|\+\d{1,3}[\s-]?\(?\d{2,4}\)?(?:[\s-]?\d{2,4}){2,4}\b/g },
    { kind: "ip", label: "IP adresi", re: /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g },
    { kind: "urlsecret", label: "Bağlantıdaki gizli parametre", re: /[?&](?:token|access_token|key|api_key|sig|signature|auth|code|session|sid)=([^\s&#]{4,})/gi, group: 1 },
    { kind: "longtoken", label: "Uzun anahtar/parola benzeri dizi", re: /\b(?=[A-Za-z0-9_-]{28,}\b)(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{28,}\b/g },
  ];
  const KIND_LABEL = Object.fromEntries(RULES.map((r) => [r.kind, r.label]).concat([["ai", "MyMind önerisi"], ["manual", "Elle eklenen"]]));

  function unionRect(rs) {
    const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function padRect(r, p, W, H) {
    const x = Math.max(0, Math.floor(r.x - p)), y = Math.max(0, Math.floor(r.y - p));
    return { x, y, w: Math.min(W, Math.ceil(r.x + r.w + p)) - x, h: Math.min(H, Math.ceil(r.y + r.h + p)) - y };
  }
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  function hint(kind, t) {
    const s = String(t);
    if (kind === "email") { const [u, d] = s.split("@"); return (u || "").slice(0, 1) + "•••@" + (d || "").replace(/^[^.]+/, (m) => m.slice(0, 1) + "•••"); }
    const keep = s.replace(/\s/g, "");
    return keep.length <= 4 ? "••••" : keep.slice(0, 2) + "•••" + keep.slice(-2);
  }

  /**
   * OCR satırlarından hassas alan adayları üretir. `lines`: [{ words: [{ text, x, y, w, h }] }] (görüntü pikseli).
   * Dönen aday: { id, kind, label, rect, hint } — metnin kendisi saklanmaz, yalnız kısaltılmış ipucu.
   */
  function findCandidates(lines, W, H, opts) {
    const out = [];
    const padding = (opts && opts.pad) || 3;
    for (const line of Array.isArray(lines) ? lines : []) {
      const words = (line && Array.isArray(line.words) ? line.words : []).filter((w) => w && typeof w.text === "string" && w.text.trim() && w.w > 0 && w.h > 0);
      if (!words.length) continue;
      let text = "";
      const spans = words.map((w) => { const s = text.length ? text.length + 1 : 0; text += (text.length ? " " : "") + w.text.trim(); return { s, e: text.length, w }; });
      for (const rule of RULES) {
        rule.re.lastIndex = 0;
        let m;
        while ((m = rule.re.exec(text))) {
          if (!m[0]) { rule.re.lastIndex++; continue; }
          const val = rule.group ? m[rule.group] : m[0];
          if (rule.check && !rule.check(val)) continue;
          const start = rule.group ? m.index + m[0].lastIndexOf(val) : m.index;
          const end = start + val.length;
          const hit = spans.filter((p) => p.s < end && p.e > start);
          if (!hit.length) continue;
          // Kelimenin yalnız bir kısmı eşleştiyse (ör. "Şifre:Gizli123") kutu harf oranıyla daraltılır.
          const rects = hit.map((p) => {
            const a = Math.max(start, p.s) - p.s, b = Math.min(end, p.e) - p.s, len = p.e - p.s;
            if (a === 0 && b === len) return p.w;
            const cw = p.w.w / len;
            return { x: p.w.x + a * cw, y: p.w.y, w: Math.max(cw, (b - a) * cw), h: p.w.h };
          });
          const rect = padRect(unionRect(rects), padding, W, H);
          if (rect.w < 2 || rect.h < 2) continue;
          // Aynı alanı kapsayan daha genel kural (ör. kart numarası içinde telefon) tekrar eklenmez.
          if (out.some((c) => overlap(c.rect, rect) && area(intersect(c.rect, rect)) >= 0.6 * Math.min(area(c.rect), area(rect)))) continue;
          out.push({ id: "c" + out.length.toString(36) + Math.round(rect.x).toString(36) + Math.round(rect.y).toString(36), kind: rule.kind, label: rule.label, rect, hint: hint(rule.kind, val) });
          if (out.length >= LIMITS.candidates) return out;
        }
      }
    }
    return out;
  }
  const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
  function intersect(a, b) { const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y); return { x, y, w: Math.min(a.x + a.w, b.x + b.w) - x, h: Math.min(a.y + a.h, b.y + b.h) - y }; }

  /** Tesseract çıktısını (blocks → paragraphs → lines → words, bbox x0/y0/x1/y1) satır/kelime listesine çevirir; `scale` büyütme katsayısıdır. */
  function linesFromTesseract(data, scale) {
    const k = scale || 1;
    const lines = [];
    for (const b of (data && data.blocks) || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) {
      const words = [];
      for (const w of l.words || []) {
        const bb = w.bbox || {};
        const t = String(w.text || "").trim();
        if (!t || !Number.isFinite(bb.x0)) continue;
        words.push({ text: t, x: bb.x0 / k, y: bb.y0 / k, w: (bb.x1 - bb.x0) / k, h: (bb.y1 - bb.y0) / k, conf: Math.round(Number(w.confidence) || 0) });
      }
      if (words.length) lines.push({ words });
    }
    return lines;
  }
  /** Küçük ekran yazısı için OCR öncesi büyütme katsayısı (en uzun kenar ~4000 px'i geçmez). */
  function upscaleFactor(w, h) { const m = Math.max(w, h); return m <= 1000 ? 3 : m <= 2000 ? 2 : 1; }

  // ---- Çerçeve ----
  /** Çerçeveli çıktının ölçüleri ve görüntünün konumu. Pencere çerçevesinde köşeler yuvarlanır (r), başlık çubuğu (bar) eklenir. */
  function frameLayout(w, h, style) {
    if (style === "shadow" || style === "window") {
      const pad = Math.round(Math.min(96, Math.max(32, Math.max(w, h) * 0.06)));
      const bar = style === "window" ? 36 : 0;
      const r = style === "window" ? 10 : 8;
      return { W: w + pad * 2, H: h + bar + pad * 2, ox: pad, oy: pad + bar, pad, bar, r, wx: pad, wy: pad, ww: w, wh: h + bar };
    }
    return { W: w, H: h, ox: 0, oy: 0, pad: 0, bar: 0, r: 0, wx: 0, wy: 0, ww: w, wh: h };
  }
  /** (x, y) çıktı noktası yuvarlatılmış pencere dikdörtgeninin içinde mi (köşe kırpması nedeniyle maske pikseli zemin rengini alabilir). */
  function insideRounded(L, x, y) {
    if (!L.r) return true;
    const px = x + 0.5, py = y + 0.5, r = L.r + 1; // kenar yumuşatma payı
    const left = L.wx + r, right = L.wx + L.ww - r, top = L.wy + r, bottom = L.wy + L.wh - r;
    const cx = px < left ? left : px > right ? right : px;
    const cy = py < top ? top : py > bottom ? bottom : py;
    if (cx === px || cy === py) return true;
    return Math.hypot(px - cx, py - cy) <= r - 2;
  }

  function parseHex(c) { const h = hex(c, "#000000"); return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /**
   * Maske doğrulaması: çıktı bit eşleminde (BGRA ya da RGBA) her maske dikdörtgeninin İÇİNDEKİ HER piksel maske rengine eşit mi?
   * PNG için tolerans 0 (kayıpsız), JPEG için küçük sıkıştırma payı. Böylece maskenin altındaki içerik çıktıdan geri çıkarılamaz:
   * o piksellerde özgün içerikten tek bit bilgi kalmaz. `layout` köşe kırpmasını hesaba katar.
   */
  function verifyMasks(bitmap, width, height, masks, opts) {
    const o = opts || {};
    const tol = o.tolerance || 0;
    const bgra = o.order !== "rgba";
    const L = o.layout || null;
    const failed = [];
    let pixels = 0;
    for (const m of Array.isArray(masks) ? masks : []) {
      const [r, g, b] = parseHex(m.color);
      const x0 = Math.max(0, Math.floor(m.x)), y0 = Math.max(0, Math.floor(m.y));
      const x1 = Math.min(width, Math.ceil(m.x + m.w)), y1 = Math.min(height, Math.ceil(m.y + m.h));
      if (x1 <= x0 || y1 <= y0) continue;
      let bad = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        if (L && !insideRounded(L, x, y)) continue;
        const i = (y * width + x) * 4;
        const R = bitmap[bgra ? i + 2 : i], G = bitmap[i + 1], B = bitmap[bgra ? i : i + 2];
        n++;
        if (Math.abs(R - r) > tol || Math.abs(G - g) > tol || Math.abs(B - b) > tol) bad++;
      }
      pixels += n;
      if (bad) failed.push({ id: m.id, bad, of: n });
    }
    return { ok: failed.length === 0, failed, pixels, masks: (masks || []).length };
  }
  /** Maskeleri (görüntü koordinatı) kırpma ve çerçeveye göre çıktı koordinatına çevirir; kırpma dışında kalanlar atılır. */
  function masksToOutput(masks, crop, layout) {
    const out = [];
    for (const m of masks || []) {
      const c = crop ? intersect(m, crop) : { x: m.x, y: m.y, w: m.w, h: m.h };
      if (c.w <= 0 || c.h <= 0) continue;
      out.push({ id: m.id, color: m.color, x: c.x - (crop ? crop.x : 0) + layout.ox, y: c.y - (crop ? crop.y : 0) + layout.oy, w: c.w, h: c.h });
    }
    return out;
  }
  /** Maske dikdörtgenini tam piksele genişletir (kenarda yarım piksel kalıp yumuşatılmasın). */
  function snapRect(r) { const x = Math.floor(r.x), y = Math.floor(r.y); return { x, y, w: Math.ceil(r.x + r.w) - x, h: Math.ceil(r.y + r.h) - y }; }

  // ---- Geçmiş ----
  function normalizeHistory(h) {
    if (!h || typeof h !== "object" || typeof h.id !== "string") return null;
    return {
      id: str(h.id, 64), at: Number(h.at) || 0, action: h.action === "copy" ? "copy" : "save", file: str(h.file, 1000), name: str(h.name, 260),
      format: FORMATS[h.format] ? h.format : "png", width: int(h.width, 0, 100000, 0), height: int(h.height, 0, 100000, 0), bytes: int(h.bytes, 0, 1e10, 0),
      prepMs: int(h.prepMs, 0, 864e5, 0), masks: int(h.masks, 0, 10000, 0), verified: !!h.verified, annotations: int(h.annotations, 0, 10000, 0),
      frame: FRAMES[h.frame] ? h.frame : "none", source: str(h.source, 40),
      accepted: int(h.accepted, 0, 10000, 0), rejected: int(h.rejected, 0, 10000, 0),
    };
  }
  function historyStats(list) {
    const h = (list || []).filter(Boolean);
    const prep = h.map((x) => x.prepMs).filter((x) => x > 0).sort((a, b) => a - b);
    const med = prep.length ? (prep.length % 2 ? prep[(prep.length - 1) / 2] : (prep[prep.length / 2 - 1] + prep[prep.length / 2]) / 2) : 0;
    const acc = h.reduce((a, x) => a + x.accepted, 0), rej = h.reduce((a, x) => a + x.rejected, 0);
    return {
      count: h.length,
      medianPrepS: Math.round(med / 100) / 10,
      under30: prep.length ? Math.round((prep.filter((x) => x <= 30000).length / prep.length) * 100) : 0,
      masks: h.reduce((a, x) => a + x.masks, 0),
      verified: h.filter((x) => x.masks > 0 && x.verified).length,
      withMasks: h.filter((x) => x.masks > 0).length,
      acceptRate: acc + rej ? Math.round((acc / (acc + rej)) * 100) : null,
    };
  }
  function fmtBytes(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0).replace(".", ",") + " KB" : (n / 1048576).toFixed(1).replace(".", ",") + " MB"; }
  function fmtSec(ms) { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? s + " sn" : Math.floor(s / 60) + " dk " + (s % 60) + " sn"; }

  // ---- MyMind ----
  /**
   * MyMind'a giden yük: yalnız OCR'ın bulduğu, kurallarca zaten işaretlenmemiş, rakam İÇERMEYEN, en az 3 harfli benzersiz kelimeler (en çok 150).
   * Görüntü, kelimelerin konumu, rakamlı değerler (numaralar, kodlar) ve zaten maskelenen değerler gönderilmez.
   */
  function aiWords(lines, covered) {
    const seen = new Set(), out = [];
    for (const l of lines || []) for (const w of l.words || []) {
      const t = String(w.text || "").replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
      if (t.length < 3 || t.length > 40 || /\d/.test(t) || !/^[\p{L}'’.-]+$/u.test(t)) continue;
      if (covered && covered(w)) continue;
      const k = t.toLocaleLowerCase("tr");
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
      if (out.length >= LIMITS.aiWords) return out;
    }
    return out;
  }
  function aiPayload(words) {
    const list = (words || []).slice(0, LIMITS.aiWords);
    return {
      sent: { count: list.length, sample: list.slice(0, 12).join(", ") + (list.length > 12 ? " …" : "") },
      messages: [
        { role: "system", content: "Ekran görüntüsünden çıkarılmış kelime listesi veriliyor. Paylaşılmadan önce gizlenmesi gerekebilecek olanları seç: kişi adı-soyadı, adres parçası, müşteri/şirket adı, kullanıcı adı. Sıradan sözcükleri, menü/başlık metinlerini seçme. YALNIZ listedeki kelimeleri aynen kullan. Yalnız JSON döndür: {\"hassas\":[{\"kelime\":\"...\",\"neden\":\"kısa gerekçe\"}]}" },
        { role: "user", content: "Kelimeler: " + JSON.stringify(list) },
      ],
    };
  }
  function parseJson(text) {
    const t = String(text || "");
    const m = t.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, t];
    const s = m[1], a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
  }
  /** Yanıt doğrulaması: yalnız GÖNDERİLEN listede birebir bulunan kelimeler kabul edilir; gerekçe kısaltılır; başka alanlar yok sayılır. */
  function validateAi(text, sentWords) {
    const j = parseJson(text);
    const arr = j && Array.isArray(j.hassas) ? j.hassas : null;
    if (!arr) throw new Error("MyMind yanıtı beklenen biçimde değil.");
    const allowed = new Map((sentWords || []).map((w) => [w.toLocaleLowerCase("tr"), w]));
    const out = [], seen = new Set();
    for (const it of arr) {
      const k = str(it && it.kelime, 60).trim().toLocaleLowerCase("tr");
      if (!allowed.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push({ word: allowed.get(k), reason: str(it.neden, 80).trim() || "MyMind önerisi" });
      if (out.length >= LIMITS.aiOut) break;
    }
    return out;
  }
  /** MyMind'ın seçtiği kelimelerin OCR kutularından aday üretir (aynı kelimenin tüm geçişleri). */
  function candidatesForWords(lines, picks, W, H) {
    const out = [];
    const want = new Map((picks || []).map((p) => [p.word.toLocaleLowerCase("tr"), p.reason]));
    for (const l of lines || []) for (const w of l.words || []) {
      const t = String(w.text || "").replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").toLocaleLowerCase("tr");
      if (!want.has(t)) continue;
      const rect = padRect(w, 3, W, H);
      out.push({ id: "a" + out.length.toString(36) + Math.round(rect.x).toString(36) + Math.round(rect.y).toString(36), kind: "ai", label: "MyMind: " + want.get(t), rect, hint: hint("ai", w.text) });
    }
    return out;
  }

  /** Bölge seçimi (DIP) → fiziksel piksel kırpma dikdörtgeni; çok küçükse null. */
  function cropRect(sel, bounds, size) {
    if (!sel || !bounds || !size) return null;
    const kx = size.width / bounds.width, ky = size.height / bounds.height;
    const x = Math.max(0, Math.round(sel.x * kx)), y = Math.max(0, Math.round(sel.y * ky));
    const w = Math.min(size.width - x, Math.round(sel.width * kx)), h = Math.min(size.height - y, Math.round(sel.height * ky));
    return w >= LIMITS.minSel && h >= LIMITS.minSel ? { x, y, width: w, height: h } : null;
  }

  return {
    LIMITS, SHORTCUTS, SHORTCUT_LABEL, FRAMES, BACKDROPS, FORMATS, MASK_COLORS, COLORS, TOOLS, RULES, KIND_LABEL,
    str, normalizeSettings, outputName, stamp, luhn, ibanValid, tcknValid, findCandidates, linesFromTesseract, upscaleFactor,
    frameLayout, insideRounded, verifyMasks, masksToOutput, snapRect, intersect, overlap, normalizeHistory, historyStats, fmtBytes, fmtSec,
    aiWords, aiPayload, validateAi, candidatesForWords, cropRect, parseHex,
  };
});
