/* Quick Convert — çekirdek (saf işlevler; hem ana süreçte (Node) hem arayüzde çalışır, ağ/dosya erişimi yoktur).
 * - Dosya türü içerikten (sihirli baytlar) tanınır; uzantıya güvenilmez. Yürütülebilir, betik, arşiv, SVG gibi içerikler açıkça reddedilir.
 * - Görüntü: boyut planı (büyütmez), seçenek normalleştirme, çıktı adı (kaynak korunur, üzerine yazılmaz).
 * - Metin: kodlama algılama (UTF-8 / UTF-16 / Windows-1254), kayıpsız çözme-kodlama, satır sonu, eşlenemeyen karakter raporu.
 * - Öneri: ihtiyaç cümlesinden kurala dayalı ayar önerisi; MyMind yanıtı yalnız izinli alanlarla doğrulanır.
 * Gerçek dönüştürme deterministiktir: görüntüde Chromium (Skia) kod çözücü/kodlayıcı, metinde bu dosyadaki tablolar. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QCCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  const KB = 1024, MB = 1024 * 1024;
  const LIMITS = { imageBytes: 50 * MB, textBytes: 20 * MB, side: 16384, pixels: 100e6, batch: 50, history: 300 };

  // ---- Yardımcılar ----
  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max || 200);
  const clampInt = (v, lo, hi, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def; };
  const fold = (s) => String(s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const pad = (n) => String(n).padStart(2, "0");
  function fmtBytes(n) {
    if (!Number.isFinite(n) || n < 0) return "—";
    if (n < KB) return n + " B";
    const v = n < MB ? n / KB : n / MB;
    return v.toLocaleString("tr-TR", { maximumFractionDigits: v < 10 ? 1 : 0 }) + (n < MB ? " KB" : " MB");
  }
  function fmtDate(ms) { const d = new Date(ms); return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function pct(before, after) { if (!(before > 0)) return 0; return Math.round(((after - before) / before) * 100); }
  /** Türkçe yüzde değişimi: "−%88", "+%12", "%0". */
  function pctLabel(before, after) { const d = pct(before, after); return (d < 0 ? "−%" : d > 0 ? "+%" : "%") + Math.abs(d); }
  const startsWith = (b, sig, at) => sig.every((x, i) => b[(at || 0) + i] === x);
  const ascii = (b, at, n) => { let s = ""; for (let i = 0; i < n && at + i < b.length; i++) s += String.fromCharCode(b[at + i]); return s; };
  const u16le = (b, i) => b[i] | (b[i + 1] << 8);
  const u32le = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
  const u16be = (b, i) => (b[i] << 8) | b[i + 1];
  const u32be = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;

  // ---- Tür tanıma ----
  const IMAGE_IN = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp" };
  const IMAGE_OUT = { png: { mime: "image/png", ext: "png", label: "PNG", lossy: false }, jpeg: { mime: "image/jpeg", ext: "jpg", label: "JPEG", lossy: true }, webp: { mime: "image/webp", ext: "webp", label: "WebP", lossy: true } };
  const TYPE_LABEL = { png: "PNG", jpeg: "JPEG", gif: "GIF", bmp: "BMP", webp: "WebP", text: "Metin" };
  const TEXT_EXT = ["txt", "csv", "tsv", "srt", "vtt", "md", "json", "xml", "html", "htm", "ini", "log", "sql", "yml", "yaml", "css", "js", "ts", "py", "bat", "cmd", "ps1", "sh", "nfo", "sub", "lrc"];
  const EXT_TYPE = { png: "png", jpg: "jpeg", jpeg: "jpeg", jpe: "jpeg", jfif: "jpeg", gif: "gif", bmp: "bmp", dib: "bmp", webp: "webp" };
  const UNSUPPORTED_HINT = "Desteklenenler: PNG, JPEG, WebP, GIF (ilk kare), BMP görüntüleri ve düz metin dosyaları (.txt, .csv, .srt …).";

  function extOf(name) { const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(name || "")); return m ? m[1].toLowerCase() : ""; }
  function baseOf(name) { const n = String(name || "").split(/[\\/]/).pop() || ""; const e = extOf(n); return e ? n.slice(0, -(e.length + 1)) : n; }

  function looksText(b) {
    const n = Math.min(b.length, 64 * KB);
    if (n === 0) return true;
    let ctrl = 0;
    for (let i = 0; i < n; i++) {
      const c = b[i];
      if (c === 0) return false;
      if (c < 9 || (c > 13 && c < 32 && c !== 26 && c !== 27)) ctrl++;
    }
    return ctrl / n < 0.01;
  }
  function utf16Guess(b) {
    // BOM'suz UTF-16: ilk 4 KB'ta tek/çift konumlarda yoğun sıfır.
    const n = Math.min(b.length - (b.length % 2), 4096);
    if (n < 8) return "";
    let even = 0, odd = 0;
    for (let i = 0; i < n; i += 2) { if (b[i] === 0) even++; if (b[i + 1] === 0) odd++; }
    const half = n / 2;
    if (odd / half > 0.3 && even / half < 0.05) return "utf-16le";
    if (even / half > 0.3 && odd / half < 0.05) return "utf-16be";
    return "";
  }

  /** İçerikten tür. Sonuç: { kind: "image"|"text"|"blocked"|"unknown", type, label, reason } */
  function sniff(bytes, name) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    const ext = extOf(name);
    const r = (kind, type, reason) => ({ kind, type: type || "", label: TYPE_LABEL[type] || "", reason: reason || "" });
    if (b.length === 0) return r("unknown", "", "Dosya boş.");
    if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return r("image", "png");
    if (startsWith(b, [0xff, 0xd8, 0xff])) return r("image", "jpeg");
    if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return r("image", "gif");
    if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return r("image", "webp");
    if (ascii(b, 0, 2) === "BM" && b.length >= 26 && u32le(b, 10) < b.length && [12, 40, 52, 56, 108, 124].includes(u32le(b, 14))) return r("image", "bmp");
    if (ascii(b, 0, 2) === "MZ") return r("blocked", "", "Yürütülebilir dosya (Windows programı/kitaplığı) dönüştürülmez.");
    if (startsWith(b, [0x7f, 0x45, 0x4c, 0x46])) return r("blocked", "", "Yürütülebilir dosya (ELF) dönüştürülmez.");
    if (startsWith(b, [0xca, 0xfe, 0xba, 0xbe]) || startsWith(b, [0xcf, 0xfa, 0xed, 0xfe])) return r("blocked", "", "Yürütülebilir dosya dönüştürülmez.");
    if (ascii(b, 0, 2) === "PK") return r("unknown", "", "Arşiv ya da Office belgesi (ZIP tabanlı) bu sürümde desteklenmiyor.");
    if (ascii(b, 0, 5) === "%PDF-") return r("unknown", "", "PDF bu sürümde desteklenmiyor.");
    if (startsWith(b, [0x52, 0x61, 0x72, 0x21]) || startsWith(b, [0x37, 0x7a, 0xbc, 0xaf])) return r("unknown", "", "Arşiv (RAR/7z) desteklenmiyor.");
    if (ascii(b, 4, 4) === "ftyp") return r("unknown", "", "HEIC/AVIF/MP4 gibi kapsayıcı biçimler bu sürümde desteklenmiyor (codec lisansı ayrıca değerlendirilecek).");
    if (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return r("unknown", "", "TIFF bu sürümde desteklenmiyor.");
    if (startsWith(b, [0x00, 0x00, 0x01, 0x00])) return r("unknown", "", "ICO bu sürümde desteklenmiyor.");
    const bom = textBom(b);
    const u16 = bom ? "" : utf16Guess(b);
    if (bom || u16 || looksText(b)) {
      const head = fold(decodeAny(b.subarray(0, Math.min(b.length, 2048))).replace(/^\s+/, "").slice(0, 300));
      if (/^<svg|^<\?xml[^>]*>\s*(<!--[\s\S]*?-->\s*)*<svg|<!doctype svg/.test(head) || ext === "svg") return r("unknown", "", "SVG bu sürümde desteklenmiyor (betik içerebilir).");
      if (/^#!/.test(head) && !TEXT_EXT.includes(ext)) return r("blocked", "", "Betik dosyası (#!) dönüştürülmez; metin olarak işlemek için .txt uzantılı kopyasını bırakın.");
      return r("text", "text");
    }
    return r("unknown", "", "Bu dosya türü tanınmadı ya da desteklenmiyor.");
  }
  /** Uzantı içerikle uyuşmuyorsa uyarı metni. */
  function extWarning(name, s) {
    const e = extOf(name);
    if (!e || !s || s.kind !== "image") return "";
    const t = EXT_TYPE[e];
    if (t && t !== s.type) return "Uzantı ." + e + " ama içerik " + s.label + "; içeriğe göre işlenir.";
    if (!t) return "Uzantı ." + e + " ama içerik " + s.label + " görüntüsü.";
    return "";
  }

  /** Görüntü başlığından genişlik/yükseklik (kod çözmeden; sınır denetimi ve testler için). */
  function imageSize(bytes, type) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    try {
      if (type === "png" && ascii(b, 12, 4) === "IHDR") return { width: u32be(b, 16), height: u32be(b, 20) };
      if (type === "gif") return { width: u16le(b, 6), height: u16le(b, 8) };
      if (type === "bmp") { const hs = u32le(b, 14); if (hs === 12) return { width: u16le(b, 18), height: u16le(b, 20) }; const h = u32le(b, 22) | 0; return { width: u32le(b, 18) | 0, height: Math.abs(h) }; }
      if (type === "webp") {
        const c = ascii(b, 12, 4);
        if (c === "VP8 ") return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
        if (c === "VP8L") { const v = u32le(b, 21); return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
        if (c === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
      }
      if (type === "jpeg") {
        let i = 2;
        while (i + 9 < b.length) {
          if (b[i] !== 0xff) { i++; continue; }
          const m = b[i + 1];
          if (m === 0xff) { i++; continue; }
          if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
          const len = u16be(b, i + 2);
          if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: u16be(b, i + 7), height: u16be(b, i + 5) };
          if (len < 2) break;
          i += 2 + len;
        }
      }
    } catch { /* bozuk başlık */ }
    return null;
  }
  function checkImageLimits(size, bytes) {
    if (bytes > LIMITS.imageBytes) return "Görüntü " + fmtBytes(LIMITS.imageBytes) + " sınırını aşıyor.";
    if (!size || !(size.width > 0) || !(size.height > 0)) return "Görüntü başlığı okunamadı (dosya bozuk olabilir).";
    if (size.width > LIMITS.side || size.height > LIMITS.side) return "Görüntü kenarı " + LIMITS.side + " pikseli aşıyor.";
    if (size.width * size.height > LIMITS.pixels) return "Görüntü 100 megapikseli aşıyor.";
    return "";
  }
  /** Çıktı baytlarının istenen biçimde olduğunu doğrular (Chromium desteklemediği biçimde PNG'ye düşebilir). */
  function verifyOutput(bytes, format) {
    const s = sniff(bytes, "");
    return s.kind === "image" && s.type === format;
  }

  // ---- Görüntü seçenekleri ----
  const DEFAULT_IMAGE = { format: "webp", quality: 85, resize: "none", width: 1920, height: 1920, percent: 50, maxKB: 0, background: "#ffffff" };
  function normalizeImageOptions(o) {
    o = o && typeof o === "object" ? o : {};
    const format = Object.prototype.hasOwnProperty.call(IMAGE_OUT, o.format) ? o.format : o.format === "same" ? "same" : DEFAULT_IMAGE.format;
    const resize = ["none", "fit", "percent"].includes(o.resize) ? o.resize : "none";
    return {
      format,
      quality: clampInt(o.quality, 1, 100, DEFAULT_IMAGE.quality),
      resize,
      width: clampInt(o.width, 1, LIMITS.side, DEFAULT_IMAGE.width),
      height: clampInt(o.height, 1, LIMITS.side, DEFAULT_IMAGE.height),
      percent: clampInt(o.percent, 1, 100, DEFAULT_IMAGE.percent),
      maxKB: clampInt(o.maxKB, 0, 50 * 1024, 0),
      background: /^#[0-9a-f]{6}$/i.test(o.background || "") ? o.background.toLowerCase() : DEFAULT_IMAGE.background,
    };
  }
  /** "same" biçimi kaynak türüne çözülür; GIF/BMP çıktı olarak yazılmaz → PNG. */
  function targetFormat(opts, srcType) {
    if (opts.format !== "same") return opts.format;
    return IMAGE_OUT[srcType] ? srcType : "png";
  }
  /** Boyut planı: oran korunur, asla büyütülmez, en az 1 px. */
  function planResize(src, opts) {
    const w = src.width, h = src.height;
    let s = 1;
    if (opts.resize === "fit") s = Math.min(1, opts.width / w, opts.height / h);
    else if (opts.resize === "percent") s = Math.min(1, opts.percent / 100);
    const out = { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
    return { ...out, scaled: out.width !== w || out.height !== h };
  }
  function describeImage(opts, srcType) {
    const f = targetFormat(opts, srcType || "png");
    const parts = [IMAGE_OUT[f].label];
    if (IMAGE_OUT[f].lossy) parts.push(opts.maxKB ? "en fazla " + opts.maxKB + " KB" : "kalite %" + opts.quality);
    if (opts.resize === "fit") parts.push("en fazla " + opts.width + "×" + opts.height + " px");
    if (opts.resize === "percent") parts.push("%" + opts.percent + " boyut");
    return parts.join(" · ");
  }
  /** PSNR (dB) iki RGBA dizisi arasında (yalnız RGB). Aynıysa Infinity. */
  function psnr(a, b) {
    if (!a || !b || a.length !== b.length || a.length === 0) return NaN;
    let se = 0, n = 0;
    for (let i = 0; i < a.length; i += 4) { for (let k = 0; k < 3; k++) { const d = a[i + k] - b[i + k]; se += d * d; } n += 3; }
    if (se === 0) return Infinity;
    return 10 * Math.log10((255 * 255) / (se / n));
  }
  function qualityLabel(db) {
    if (db === Infinity) return "kayıpsız (birebir)";
    if (!Number.isFinite(db)) return "ölçülemedi";
    const v = db.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " dB";
    if (db >= 40) return v + " · çok iyi";
    if (db >= 34) return v + " · iyi";
    if (db >= 28) return v + " · orta";
    return v + " · belirgin kayıp";
  }

  // ---- Çıktı adı ----
  function safeBase(name) {
    let b = baseOf(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/, "").slice(0, 120);
    if (!b || /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(b)) b = "dosya";
    return b;
  }
  /** Kaynağın yanına (ya da seçilen klasöre) yeni ad; `exists(ad)` true dönerse -2, -3 … denenir. */
  function outputName(srcName, ext, exists) {
    const base = safeBase(srcName) + "-donusturuldu";
    for (let i = 1; i < 1000; i++) {
      const n = base + (i === 1 ? "" : "-" + i) + "." + ext;
      if (!exists || !exists(n)) return n;
    }
    throw new Error("Uygun çıktı adı bulunamadı.");
  }

  // ---- Metin kodlamaları ----
  // Windows-1254 (Türkçe) 0x80–0xFF; WHATWG dizini. Tanımsız konumlar C1 denetim karakterine eşlenir (WHATWG ile aynı).
  const CP1254_HIGH = [
    0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x8e, 0x8f,
    0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x9e, 0x178,
  ];
  const CP1254 = new Array(256);
  for (let i = 0; i < 256; i++) CP1254[i] = i < 0x80 ? i : i < 0xa0 ? CP1254_HIGH[i - 0x80] : i;
  Object.assign(CP1254, { 0xd0: 0x11e, 0xdd: 0x130, 0xde: 0x15e, 0xf0: 0x11f, 0xfd: 0x131, 0xfe: 0x15f });
  const CP1254_REV = new Map(CP1254.map((cp, i) => [cp, i]));

  const ENCODINGS = {
    "utf-8": { label: "UTF-8", bom: false },
    "utf-8-bom": { label: "UTF-8 (BOM'lu, Excel için)", bom: true },
    "utf-16le": { label: "UTF-16 LE (BOM'lu)", bom: true },
    "utf-16be": { label: "UTF-16 BE (BOM'lu)", bom: true },
    "windows-1254": { label: "Windows-1254 (Türkçe ANSI)", bom: false },
  };
  function textBom(b) {
    if (startsWith(b, [0xef, 0xbb, 0xbf])) return "utf-8-bom";
    if (startsWith(b, [0xff, 0xfe])) return "utf-16le";
    if (startsWith(b, [0xfe, 0xff])) return "utf-16be";
    return "";
  }
  /** Katı UTF-8 doğrulaması (fazla uzun dizi, vekil, >U+10FFFF reddedilir). */
  function validUtf8(b, start) {
    let nonAscii = 0;
    for (let i = start || 0; i < b.length;) {
      const c = b[i];
      if (c < 0x80) { i++; continue; }
      let n, min;
      if (c >= 0xc2 && c <= 0xdf) { n = 1; min = 0x80; } else if (c >= 0xe0 && c <= 0xef) { n = 2; min = 0x800; } else if (c >= 0xf0 && c <= 0xf4) { n = 3; min = 0x10000; } else return { ok: false };
      if (i + n >= b.length) return { ok: false };
      let cp = c & (0x3f >> n);
      for (let k = 1; k <= n; k++) { const x = b[i + k]; if (x === undefined || (x & 0xc0) !== 0x80) return { ok: false }; cp = (cp << 6) | (x & 0x3f); }
      if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return { ok: false };
      nonAscii++;
      i += n + 1;
    }
    return { ok: true, nonAscii };
  }
  /** Kodlama algılama: BOM → UTF-16 deseni → geçerli UTF-8 → Windows-1254. */
  function detectEncoding(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    const bom = textBom(b);
    if (bom) return { encoding: bom, reason: "Dosya başında " + ENCODINGS[bom].label.split(" (")[0] + " imi (BOM) var." };
    const u16 = utf16Guess(b);
    if (u16) return { encoding: u16, reason: "Bayt deseni BOM'suz " + (u16 === "utf-16le" ? "UTF-16 LE" : "UTF-16 BE") + " gösteriyor." };
    const v = validUtf8(b, 0);
    if (v.ok) return { encoding: "utf-8", reason: v.nonAscii ? "Geçerli UTF-8 (" + v.nonAscii + " ASCII dışı karakter)." : "Yalnız ASCII karakter var; UTF-8 ile aynı." , asciiOnly: !v.nonAscii };
    return { encoding: "windows-1254", reason: "Geçerli UTF-8 değil; Türkçe Windows (ANSI) kod sayfası varsayıldı." };
  }
  function decodeUtf8(b) {
    // Katı doğrulamadan geçmiş baytlar için kendi çözücümüz (TextDecoder'a bağımlı kalmadan iki ortamda da aynı sonuç).
    let out = "";
    const parts = [];
    for (let i = 0; i < b.length;) {
      const c = b[i];
      let cp;
      if (c < 0x80) { cp = c; i++; } else if (c < 0xe0) { cp = ((c & 0x1f) << 6) | (b[i + 1] & 0x3f); i += 2; } else if (c < 0xf0) { cp = ((c & 0x0f) << 12) | ((b[i + 1] & 0x3f) << 6) | (b[i + 2] & 0x3f); i += 3; } else { cp = ((c & 0x07) << 18) | ((b[i + 1] & 0x3f) << 12) | ((b[i + 2] & 0x3f) << 6) | (b[i + 3] & 0x3f); i += 4; }
      out += String.fromCodePoint(cp);
      if (out.length > 8192) { parts.push(out); out = ""; }
    }
    parts.push(out);
    return parts.join("");
  }
  function decodeUtf16(b, le, start) {
    const parts = [];
    let out = "";
    const end = b.length - ((b.length - start) % 2);
    for (let i = start; i < end; i += 2) {
      out += String.fromCharCode(le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
      if (out.length > 8192) { parts.push(out); out = ""; }
    }
    parts.push(out);
    return { text: parts.join(""), oddByte: end !== b.length };
  }
  /** Baytları verilen kodlamayla çözer. Geçersiz UTF-8 hata fırlatır (sessiz � yok: veri kaybı olmaz). */
  function decodeText(bytes, encoding) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    if (encoding === "utf-8" || encoding === "utf-8-bom") {
      const start = startsWith(b, [0xef, 0xbb, 0xbf]) ? 3 : 0;
      if (!validUtf8(b, start).ok) throw new Error("Dosya geçerli UTF-8 değil; kaynak kodlamayı Windows-1254 ya da Otomatik seçin.");
      return decodeUtf8(start ? b.subarray(start) : b);
    }
    if (encoding === "utf-16le" || encoding === "utf-16be") {
      const le = encoding === "utf-16le";
      const start = (le && startsWith(b, [0xff, 0xfe])) || (!le && startsWith(b, [0xfe, 0xff])) ? 2 : 0;
      const r = decodeUtf16(b, le, start);
      if (r.oddByte) throw new Error("UTF-16 dosyasının bayt sayısı tek; dosya eksik ya da kodlama yanlış.");
      return r.text;
    }
    if (encoding === "windows-1254") {
      const parts = [];
      let out = "";
      for (let i = 0; i < b.length; i++) { out += String.fromCharCode(CP1254[b[i]]); if (out.length > 8192) { parts.push(out); out = ""; } }
      parts.push(out);
      return parts.join("");
    }
    throw new Error("Bilinmeyen kodlama: " + encoding);
  }
  function decodeAny(b) {
    const d = detectEncoding(b);
    try { return decodeText(b, d.encoding); } catch { return decodeText(b, "windows-1254"); }
  }
  /** Metni kodlar. Windows-1254'te karşılığı olmayan karakterler `unmappable` listesinde döner (yerine "?" yazılır). */
  function encodeText(text, encoding) {
    const s = String(text);
    const unm = new Map();
    if (encoding === "utf-8" || encoding === "utf-8-bom") {
      const out = [];
      if (encoding === "utf-8-bom") out.push(0xef, 0xbb, 0xbf);
      for (const ch of s) {
        let cp = ch.codePointAt(0);
        if (cp >= 0xd800 && cp <= 0xdfff) { unm.set(ch, (unm.get(ch) || 0) + 1); cp = 0xfffd; }
        if (cp < 0x80) out.push(cp);
        else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
        else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
        else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
      }
      return { bytes: Uint8Array.from(out), unmappable: [...unm].map(([ch, count]) => ({ ch, count })) };
    }
    if (encoding === "utf-16le" || encoding === "utf-16be") {
      const le = encoding === "utf-16le";
      const out = new Uint8Array(2 + s.length * 2);
      out[0] = le ? 0xff : 0xfe; out[1] = le ? 0xfe : 0xff;
      for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out[2 + i * 2] = le ? c & 0xff : c >> 8; out[3 + i * 2] = le ? c >> 8 : c & 0xff; }
      return { bytes: out, unmappable: [] };
    }
    if (encoding === "windows-1254") {
      const out = new Uint8Array(s.length);
      let n = 0;
      for (const ch of s) {
        const v = CP1254_REV.get(ch.codePointAt(0));
        if (v === undefined) { unm.set(ch, (unm.get(ch) || 0) + 1); out[n++] = 0x3f; } else out[n++] = v;
      }
      return { bytes: out.slice(0, n), unmappable: [...unm].map(([ch, count]) => ({ ch, count })) };
    }
    throw new Error("Bilinmeyen kodlama: " + encoding);
  }
  function eolOf(s) {
    const crlf = (s.match(/\r\n/g) || []).length;
    const lf = (s.match(/\n/g) || []).length - crlf;
    const cr = (s.match(/\r(?!\n)/g) || []).length;
    const kinds = [crlf && "crlf", lf && "lf", cr && "cr"].filter(Boolean);
    return { kind: kinds.length === 0 ? "none" : kinds.length > 1 ? "mixed" : kinds[0], lines: crlf + lf + cr + (s.length ? 1 : 0) };
  }
  const EOL_LABEL = { crlf: "CRLF (Windows)", lf: "LF (Linux/macOS)", cr: "CR (eski Mac)", mixed: "karışık", none: "tek satır", keep: "değiştirme" };
  function convertEol(s, to) {
    if (to === "crlf") return s.replace(/\r\n|\r|\n/g, "\r\n");
    if (to === "lf") return s.replace(/\r\n|\r/g, "\n");
    return s;
  }
  const DEFAULT_TEXT = { from: "auto", to: "utf-8", eol: "keep", unmappable: "stop" };
  function normalizeTextOptions(o) {
    o = o && typeof o === "object" ? o : {};
    return {
      from: o.from === "auto" || ENCODINGS[o.from] ? o.from : "auto",
      to: ENCODINGS[o.to] ? o.to : DEFAULT_TEXT.to,
      eol: ["keep", "crlf", "lf"].includes(o.eol) ? o.eol : "keep",
      unmappable: o.unmappable === "replace" ? "replace" : "stop",
    };
  }
  /** Metin dönüştürme planı: çöz → satır sonu → kodla → geri çözerek doğrula. Kayıp varsa (ve izin yoksa) hata. */
  function convertTextBytes(bytes, options) {
    const o = normalizeTextOptions(options);
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    const det = detectEncoding(b);
    const from = o.from === "auto" ? det.encoding : o.from;
    const text = decodeText(b, from);
    const eolBefore = eolOf(text);
    const converted = convertEol(text, o.eol);
    const enc = encodeText(converted, o.to);
    const lost = enc.unmappable.reduce((a, x) => a + x.count, 0);
    if (lost && o.unmappable !== "replace") {
      const list = enc.unmappable.slice(0, 8).map((x) => "“" + x.ch + "” ×" + x.count).join(", ");
      const err = new Error(ENCODINGS[o.to].label + " şu karakterleri gösteremez: " + list + ". Hedefi UTF-8 seçin ya da “? ile değiştir” seçeneğini açın.");
      err.unmappable = enc.unmappable;
      throw err;
    }
    // Doğrulama: çıktı geri çözülünce dönüştürülen metinle birebir aynı olmalı (eşlenemeyenler hariç).
    const back = decodeText(enc.bytes, o.to);
    if (!lost && back !== converted) throw new Error("Doğrulama başarısız: çıktı geri okunduğunda metin aynı değil. Dosya yazılmadı.");
    return {
      bytes: enc.bytes, from, detected: det, to: o.to, chars: [...text].length, lines: eolBefore.lines,
      eolFrom: eolBefore.kind, eolTo: o.eol === "keep" ? eolBefore.kind : o.eol, lost, unmappable: enc.unmappable, verified: !lost,
      identical: b.length === enc.bytes.length && b.every((x, i) => x === enc.bytes[i]),
      preview: converted.slice(0, 400),
    };
  }
  const textExt = (name) => { const e = extOf(name); return e && TEXT_EXT.includes(e) ? e : "txt"; };

  // ---- Öneri (kurala dayalı, yerel) ----
  /** İhtiyaç cümlesinden ayar önerisi. Döner: { image: {...}|null, text: {...}|null, reasons: [] } */
  function suggest(need, info) {
    const t = " " + fold(need).replace(/[“”"']/g, " ") + " ";
    const img = {}, txt = {}, reasons = [];
    const has = (re) => re.test(t);
    // Görüntü biçimi
    if (has(/\bwebp\b/)) { img.format = "webp"; reasons.push("“webp” istendi → WebP."); }
    else if (has(/\b(jpe?g)\b/)) { img.format = "jpeg"; reasons.push("“jpg” istendi → JPEG."); }
    else if (has(/\bpng\b/)) { img.format = "png"; reasons.push("“png” istendi → PNG (kayıpsız)."); }
    else if (has(/seffaf|transparan|arka ?plan(i)? (kalsin|korunsun|olmasin)|logo/)) { img.format = "png"; reasons.push("Saydamlık korunmalı → PNG (JPEG saydamlığı desteklemez)."); }
    else if (has(/kayipsiz|kalite(yi|si)? (bozulmasin|korunsun|dusmesin)|ekran goruntusu/)) { img.format = "png"; reasons.push("Kalite kaybı istenmiyor → PNG."); }
    // Hedef kullanım
    if (has(/instagram/)) { img.format = img.format || "jpeg"; img.resize = "fit"; img.width = 1080; img.height = 1350; img.quality = 90; reasons.push("Instagram gönderisi → en fazla 1080×1350 px, kalite %90."); }
    else if (has(/whatsapp|e-?posta|mail|ek(e|i) |gonder|paylas/)) { img.format = img.format || "jpeg"; img.resize = "fit"; img.width = 1600; img.height = 1600; img.quality = 80; reasons.push("Paylaşım/e-posta → en fazla 1600 px, kalite %80."); }
    else if (has(/web ?site|web sayfa|blog|siteye/)) { img.format = img.format || "webp"; img.resize = "fit"; img.width = 1920; img.height = 1920; img.quality = 80; reasons.push("Web sitesi → WebP, en fazla 1920 px, kalite %80."); }
    else if (has(/kucult|hafiflet|sikistir|boyut(u|unu)? (dusur|azalt|kucult)|yer kapl/)) { img.format = img.format || "jpeg"; img.quality = img.quality || 75; reasons.push("Dosyayı küçültmek → kayıplı biçim, kalite %75."); }
    // Ölçüler
    let m = /(\d{2,5}) ?[x×*] ?(\d{2,5})/.exec(t);
    if (m) { img.resize = "fit"; img.width = clampInt(m[1], 1, LIMITS.side, 1920); img.height = clampInt(m[2], 1, LIMITS.side, 1920); reasons.push("“" + m[1] + "×" + m[2] + "” → bu kutuya sığdır (oran korunur, büyütülmez)."); }
    else if ((m = /(\d{2,5}) ?(px|piksel|pixel)/.exec(t))) { img.resize = "fit"; img.width = img.height = clampInt(m[1], 1, LIMITS.side, 1920); reasons.push("“" + m[1] + " px” → uzun kenar en fazla " + m[1] + " px."); }
    if ((m = /(?:%|yuzde) ?(\d{1,3})\b/.exec(t)) && !/kalite/.test(t.slice(Math.max(0, m.index - 12), m.index))) { img.resize = "percent"; img.percent = clampInt(m[1], 1, 100, 50); reasons.push("“%" + m[1] + "” → boyutun %" + img.percent + "'i."); }
    if ((m = /kalite(?:si)? ?(?:%|yuzde)? ?(\d{1,3})/.exec(t)) || (m = /(?:%|yuzde) ?(\d{1,3}) kalite/.exec(t))) { img.quality = clampInt(m[1], 1, 100, 85); reasons.push("Kalite %" + img.quality + "."); }
    if ((m = /(\d{1,5}(?:[.,]\d)?) ?(kb|mb)\b/.exec(t))) {
      const v = Number(m[1].replace(",", ".")) * (m[2] === "mb" ? 1024 : 1);
      img.maxKB = clampInt(v, 1, 50 * 1024, 500);
      img.format = img.format && img.format !== "png" ? img.format : "jpeg";
      reasons.push("“" + m[1] + " " + m[2].toUpperCase() + "” → en fazla " + img.maxKB + " KB (kalite otomatik düşürülür; sonuç gösterilir).");
    }
    // Metin
    if (has(/excel/)) { txt.to = "utf-8-bom"; reasons.push("Excel Türkçe karakterleri doğru açsın → UTF-8 (BOM'lu)."); }
    else if (has(/1254|ansi|eski program|eski windows|notepad eski|kod sayfas/)) { txt.to = "windows-1254"; reasons.push("Eski Windows programı → Windows-1254 (Türkçe ANSI)."); }
    else if (has(/utf-?16|unicode/)) { txt.to = "utf-16le"; reasons.push("“UTF-16/Unicode” → UTF-16 LE."); }
    else if (has(/utf-?8|turkce karakter|bozuk karakter|karakter(ler)? bozuk|altyazi|srt/)) { txt.to = "utf-8"; reasons.push("Türkçe karakterler her yerde doğru görünsün → UTF-8."); }
    if (has(/crlf|windows satir|satir sonu(nu)? windows/)) { txt.eol = "crlf"; reasons.push("Satır sonları Windows (CRLF)."); }
    else if (has(/\blf\b|linux|unix|mac(os)?\b/)) { txt.eol = "lf"; reasons.push("Satır sonları Linux/macOS (LF)."); }
    const kind = info && info.kind;
    return {
      image: Object.keys(img).length && kind !== "text" ? img : null,
      text: Object.keys(txt).length && kind !== "image" ? txt : null,
      reasons: reasons.length ? reasons : ["Cümlede bilinen bir ipucu bulunamadı. Örnek: “e-posta için küçült”, “1080 px webp”, “Excel'de Türkçe karakterler bozuk”."],
      matched: reasons.length > 0,
    };
  }

  // ---- MyMind (PluginLabs Hub üzerinden) ----
  /** Gönderilecek veri: ihtiyaç cümlesi + seçili dosyanın türü ve ölçüleri. Dosya adı, yolu ve içeriği gönderilmez. */
  function aiPayload(need, info) {
    const sent = { need: str(need, 240), kind: info && info.kind === "text" ? "metin" : "görüntü" };
    if (info && info.kind === "image") { sent.type = TYPE_LABEL[info.type] || "?"; if (info.width) sent.size = info.width + "×" + info.height + " px"; if (info.bytes) sent.bytes = fmtBytes(info.bytes); }
    if (info && info.kind === "text") { if (info.encoding) sent.encoding = ENCODINGS[info.encoding] ? ENCODINGS[info.encoding].label : info.encoding; if (info.eol) sent.eol = EOL_LABEL[info.eol] || info.eol; }
    const ctx = Object.entries(sent).filter(([k]) => k !== "need").map(([k, v]) => k + ": " + v).join("; ");
    const messages = [
      { role: "system", content: "Sen Quick Convert adlı çevrimdışı dosya dönüştürücünün ayar yardımcısısın. Dönüştürmeyi sen yapmazsın; yalnız ayar önerirsin. Yalnız JSON döndür: {\"bicim\":\"png|jpeg|webp|ayni\",\"kalite\":1-100,\"boyutlandir\":\"yok|sigdir|yuzde\",\"genislik\":px,\"yukseklik\":px,\"yuzde\":1-100,\"en_fazla_kb\":sayı,\"kodlama\":\"utf-8|utf-8-bom|utf-16le|windows-1254\",\"satir_sonu\":\"koru|crlf|lf\",\"gerekce\":\"tek kısa Türkçe cümle\"}. Dosya türüne uymayan alanları yazma. Görüntüyü asla büyütme önerme." },
      { role: "user", content: "İhtiyaç: " + sent.need + "\nDosya: " + ctx },
    ];
    return { sent, messages };
  }
  function parseJsonLoose(text) {
    const s = String(text || "");
    const m = /```(?:json)?\s*([\s\S]*?)```/.exec(s);
    const body = m ? m[1] : s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1);
    try { return JSON.parse(body); } catch { return null; }
  }
  /** MyMind yanıtını doğrular: yalnız izinli alanlar ve aralıklar; bilinmeyen ya da geçersiz alanlar `rejected`'a yazılır. */
  function validateAi(text, kind) {
    const j = parseJsonLoose(text);
    if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error("MyMind yanıtı beklenen biçimde değil (JSON yok).");
    const img = {}, txt = {}, rejected = [];
    const FMT = { png: "png", jpeg: "jpeg", jpg: "jpeg", webp: "webp", ayni: "same", "aynı": "same" };
    const RS = { yok: "none", sigdir: "fit", "sığdır": "fit", yuzde: "percent", "yüzde": "percent" };
    const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null; };
    for (const [k, v] of Object.entries(j)) {
      if (k === "gerekce") continue;
      if (kind !== "text" && k === "bicim" && FMT[fold(v)]) img.format = FMT[fold(v)];
      else if (kind !== "text" && k === "kalite" && num(v, 1, 100) != null) img.quality = num(v, 1, 100);
      else if (kind !== "text" && k === "boyutlandir" && RS[fold(v)]) img.resize = RS[fold(v)];
      else if (kind !== "text" && k === "genislik" && num(v, 1, LIMITS.side) != null) img.width = num(v, 1, LIMITS.side);
      else if (kind !== "text" && k === "yukseklik" && num(v, 1, LIMITS.side) != null) img.height = num(v, 1, LIMITS.side);
      else if (kind !== "text" && k === "yuzde" && num(v, 1, 100) != null) img.percent = num(v, 1, 100);
      else if (kind !== "text" && k === "en_fazla_kb" && num(v, 1, 50 * 1024) != null) img.maxKB = num(v, 1, 50 * 1024);
      else if (kind === "text" && k === "kodlama" && ENCODINGS[fold(v)]) txt.to = fold(v);
      else if (kind === "text" && k === "satir_sonu" && { koru: "keep", crlf: "crlf", lf: "lf" }[fold(v)]) txt.eol = { koru: "keep", crlf: "crlf", lf: "lf" }[fold(v)];
      else if (v !== null && v !== "" && v !== undefined) rejected.push(k);
    }
    if (img.resize === "fit" && !(img.width || img.height)) delete img.resize;
    if (img.resize === "fit") { img.width = img.width || img.height; img.height = img.height || img.width; }
    if (img.maxKB && img.format === "png") delete img.maxKB;
    const reason = str(j.gerekce, 220);
    const empty = !Object.keys(img).length && !Object.keys(txt).length;
    return { image: Object.keys(img).length ? img : null, text: Object.keys(txt).length ? txt : null, reason, rejected, empty };
  }

  // ---- Ayarlar ve geçmiş ----
  const DEFAULT_SETTINGS = { output: "beside", outputDir: "", dropAutorun: true, reduceMotion: false, image: DEFAULT_IMAGE, text: DEFAULT_TEXT };
  function normalizeSettings(s) {
    s = s && typeof s === "object" ? s : {};
    return {
      output: s.output === "folder" && typeof s.outputDir === "string" && s.outputDir ? "folder" : "beside",
      outputDir: typeof s.outputDir === "string" ? s.outputDir.slice(0, 1024) : "",
      dropAutorun: s.dropAutorun !== false,
      reduceMotion: !!s.reduceMotion,
      image: normalizeImageOptions(s.image),
      text: normalizeTextOptions(s.text),
    };
  }
  function normalizeHistory(h) {
    if (!h || typeof h !== "object") return null;
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const kind = h.kind === "text" ? "text" : "image";
    if (typeof h.out !== "string" || !h.out) return null;
    return {
      id: str(h.id, 40) || "h" + n(h.at), at: n(h.at), kind, src: str(h.src, 1024), out: str(h.out, 1024),
      srcName: str(h.srcName, 260), outName: str(h.outName, 260), from: str(h.from, 20), to: str(h.to, 20),
      srcBytes: n(h.srcBytes), outBytes: n(h.outBytes), srcSize: str(h.srcSize, 40), outSize: str(h.outSize, 40), quality: str(h.quality, 60), note: str(h.note, 200),
    };
  }
  function historyStats(list) {
    const ok = list.length;
    const saved = list.reduce((a, h) => a + (h.srcBytes - h.outBytes), 0);
    const img = list.filter((h) => h.kind === "image").length;
    return { total: ok, images: img, texts: ok - img, savedBytes: saved };
  }

  return {
    KB, MB, LIMITS, IMAGE_IN, IMAGE_OUT, TYPE_LABEL, ENCODINGS, EOL_LABEL, UNSUPPORTED_HINT, DEFAULT_IMAGE, DEFAULT_TEXT, DEFAULT_SETTINGS, TEXT_EXT,
    str, fold, clampInt, fmtBytes, fmtDate, pct, pctLabel, extOf, baseOf,
    sniff, extWarning, imageSize, checkImageLimits, verifyOutput,
    normalizeImageOptions, targetFormat, planResize, describeImage, psnr, qualityLabel,
    safeBase, outputName, textExt,
    CP1254, detectEncoding, decodeText, encodeText, eolOf, convertEol, normalizeTextOptions, convertTextBytes,
    suggest, aiPayload, validateAi, parseJsonLoose,
    normalizeSettings, normalizeHistory, historyStats,
  };
});
