/* File Pilot — çekirdek (saf işlevler; hem ana süreçte hem arayüzde, hem de testlerde çalışır).
 * Yerel indeks: ad/yol/etiket/metin terimleri, BM25 sıralaması, önek eşleşmesi (Türkçe ekler: "fatura" → "faturalar"),
 * Türkçe duyarsız katlama (ı/i, ş/s, ç/c, ğ/g, ö/o, ü/u), sorgu süzgeçleri (#etiket, tür:md, "tam ifade", -hariç),
 * eşleşen metin bölümü (satır numarasıyla), benzer belge (TF-IDF kosinüs) ve MyMind istek/yanıt doğrulaması.
 * Dosya sistemine ve ağa erişmez. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FPCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TEXT_EXT = ["txt", "md", "markdown", "csv", "tsv", "json", "log", "html", "htm", "xml", "yml", "yaml", "ini", "cfg", "conf", "rtf", "js", "mjs", "cjs", "ts", "py", "css", "sql", "sh", "ps1", "bat", "srt", "vtt", "tex"];
  const KINDS = {
    metin: ["txt", "md", "markdown", "rtf", "log", "srt", "vtt", "tex"],
    veri: ["csv", "tsv", "json", "xml", "yml", "yaml", "ini", "cfg", "conf", "sql"],
    web: ["html", "htm", "css"],
    kod: ["js", "mjs", "cjs", "ts", "py", "sh", "ps1", "bat"],
  };
  const DEFAULT_EXCLUDES = ["node_modules", ".git", "$RECYCLE.BIN", "System Volume Information", "AppData", "*.tmp", "~$*"];
  const SIZES_MB = [1, 2, 5, 10];
  const MAX_TEXT = 300000; // belge başına indekslenen en fazla karakter
  const MAX_FILES = 50000;
  const AI_MAX_CANDIDATES = 8;
  const AI_SNIPPET = 360;
  const ID_RE = /^[a-z0-9]{6,24}$/;

  function settingsOf(s) {
    const x = s && typeof s === "object" ? s : {};
    const ex = Array.isArray(x.excludes) ? x.excludes.map((p) => String(p).trim()).filter((p) => p && p.length <= 120).slice(0, 60) : DEFAULT_EXCLUDES.slice();
    return {
      excludes: ex,
      maxSizeMB: SIZES_MB.includes(Number(x.maxSizeMB)) ? Number(x.maxSizeMB) : 2,
      skipHidden: x.skipHidden !== false,
      rescanOnStart: x.rescanOnStart !== false,
    };
  }

  // ---- Katlama: uzunluğu koruyan Türkçe duyarsız küçük harf (konumlar özgün metinle hizalı kalır) ----
  const foldCache = new Map();
  function foldChar(c) {
    let r = foldCache.get(c);
    if (r !== undefined) return r;
    let x = c.toLocaleLowerCase("tr");
    if (x === "ı") x = "i";
    x = x.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    r = x.length === 1 ? x : x.length ? x[0] : " ";
    if (c.length !== 1) r = c; // vekil çiftleri dokunulmadan
    foldCache.set(c, r);
    return r;
  }
  const ASCII = /^[\x00-\x7f]*$/;
  function fold(s) {
    s = String(s == null ? "" : s);
    if (ASCII.test(s)) return s.toLowerCase();
    let out = "";
    for (let i = 0; i < s.length; i++) out += foldChar(s[i]);
    return out;
  }
  const WORD = /[\p{L}\p{N}]+/gu;
  /** Metni terimlere böler (katlanmış). 2–40 karakter; tek haneli sayılar da alınır. */
  function tokenize(text) {
    const f = fold(text);
    const out = [];
    WORD.lastIndex = 0;
    let m;
    while ((m = WORD.exec(f))) {
      const t = m[0];
      if (t.length > 40) continue;
      if (t.length < 2 && !/\d/.test(t)) continue;
      out.push(t);
    }
    return out;
  }
  /** Dosya adını da sözcüklere ayırır: "FaturaOzeti_2026-11.pdf" → fatura ozeti 2026 11 pdf. */
  function nameTokens(name) {
    return tokenize(String(name || "").replace(/([a-zçğıöşü])([A-ZÇĞİÖŞÜ])/g, "$1 $2").replace(/[_.\-]+/g, " "));
  }
  function extOf(name) {
    const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(name || ""));
    return m ? m[1].toLowerCase() : "";
  }
  function kindOf(ext) {
    for (const [k, list] of Object.entries(KINDS)) if (list.includes(ext)) return k;
    return "diger";
  }
  const isTextExt = (ext) => TEXT_EXT.includes(ext);

  /** Hariç tutma: desen bir yol parçasıyla tam eşleşir ya da * / ? joker içerir (büyük/küçük harf duyarsız). */
  function excluded(relPath, patterns) {
    const parts = String(relPath || "").split(/[\\/]+/).filter(Boolean);
    for (const p of patterns || []) {
      const pat = String(p).trim();
      if (!pat) continue;
      if (/[*?]/.test(pat)) {
        const re = new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
        if (parts.some((x) => re.test(x))) return true;
      } else if (parts.some((x) => x.toLowerCase() === pat.toLowerCase())) return true;
    }
    return false;
  }

  /** Basit RTF/HTML temizliği: yalnız okunur metin kalır. */
  function plainText(ext, raw) {
    let t = String(raw || "");
    if (ext === "rtf") {
      // \'xx kaçışları belgenin kod sayfasıyla çözülür (\ansicpgNNNN; yoksa Türkçe Windows varsayılanı 1254).
      const cp = (/\\ansicpg(\d{3,4})/.exec(t) || [])[1] || "1254";
      let dec;
      try { dec = new TextDecoder("windows-" + cp); } catch { dec = new TextDecoder("windows-1254"); }
      t = t.replace(/(?:\\'[0-9a-f]{2})+/gi, (m) => dec.decode(Uint8Array.from(m.split("\\'").filter(Boolean).map((h) => parseInt(h, 16)))))
        .replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode((Number(n) + 65536) % 65536))
        .replace(/\\par[d]?\b ?/g, "\n").replace(/\{\\\*[^{}]*\}/g, "").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "");
    } else if (ext === "html" || ext === "htm" || ext === "xml") {
      t = t.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, "\n").replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }
    t = t.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ");
    return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) : t;
  }
  /** Ham bayt içeriğinden metin; ikili/şifreli görünüyorsa null. UTF-8 BOM, UTF-16 LE/BE ve Windows-1254 yedeği. */
  function decodeText(buf) {
    if (!buf || !buf.length) return "";
    const b = buf;
    if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b.subarray(2));
    if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b.subarray(2));
    const head = b.subarray(0, Math.min(b.length, 8192));
    let zero = 0;
    for (const x of head) if (x === 0) zero++;
    if (zero > 0) return null; // ikili ya da şifreli
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3) : b);
    } catch {
      try { return new TextDecoder("windows-1254").decode(b); } catch { return new TextDecoder("latin1").decode(b); }
    }
  }

  // ---- İndeks ----
  /** docs: [{ id, path, rel, name, ext, size, mtime, text, tags }] → arama indeksi. */
  function buildIndex(docs) {
    const list = Array.isArray(docs) ? docs : [];
    const body = new Map(); // terim → [docIdx, tf, docIdx, tf, ...]
    const names = new Map(); // terim → Set(docIdx) (ad + klasör yolu)
    const tags = new Map(); // katlanmış etiket → Set(docIdx)
    const lens = new Float64Array(list.length);
    let total = 0;
    list.forEach((d, i) => {
      const tf = new Map();
      const toks = d.text ? tokenize(d.text) : [];
      for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
      lens[i] = toks.length;
      total += toks.length;
      for (const [t, n] of tf) {
        let p = body.get(t);
        if (!p) body.set(t, (p = []));
        p.push(i, n);
      }
      const nt = new Set(nameTokens(d.name));
      for (const t of nameTokens(String(d.rel || "").split(/[\\/]/).slice(0, -1).join(" "))) nt.add(t);
      for (const t of nt) {
        let s = names.get(t);
        if (!s) names.set(t, (s = new Set()));
        s.add(i);
      }
      for (const tg of d.tags || []) {
        const k = fold(tg);
        let s = tags.get(k);
        if (!s) tags.set(k, (s = new Set()));
        s.add(i);
      }
    });
    const N = list.length || 1;
    const idf = (df) => Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const vocab = [...new Set([...body.keys(), ...names.keys()])].sort();
    // Benzer belge için belge normu (TF-IDF)
    const norms = new Float64Array(list.length);
    for (const p of body.values()) {
      const w = idf(p.length / 2);
      for (let j = 0; j < p.length; j += 2) norms[p[j]] += (p[j + 1] * w) ** 2;
    }
    for (let i = 0; i < norms.length; i++) norms[i] = Math.sqrt(norms[i]) || 1;
    return { docs: list, body, names, tags, lens, avg: total / N || 1, N, idf, vocab, norms };
  }

  /** Sözlükte önekle başlayan terimler (ikili arama). */
  function prefixTerms(vocab, pre, max) {
    let lo = 0, hi = vocab.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (vocab[m] < pre) lo = m + 1; else hi = m; }
    const out = [];
    for (let i = lo; i < vocab.length && vocab[i].startsWith(pre) && out.length < (max || 64); i++) out.push(vocab[i]);
    return out;
  }

  /** Sorgu ayrıştırma: düz terimler, "tam ifade", #etiket, tür:/uzantı: süzgeci, -hariç terim. */
  function parseQuery(q) {
    const s = String(q || "").slice(0, 400);
    const out = { terms: [], phrases: [], tags: [], kinds: [], exts: [], not: [], raw: s.trim() };
    const re = /(-?)"([^"]+)"|(\S+)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[2] != null) { const f = fold(m[2]).replace(/\s+/g, " ").trim(); if (f) (m[1] ? out.not : out.phrases).push(f); continue; }
      const w = m[3];
      let k;
      if (w.startsWith("#") && w.length > 1) out.tags.push(fold(w.slice(1)));
      else if ((k = /^(tür|tur|uzantı|uzanti|ext):(.+)$/i.exec(w))) {
        const v = fold(k[2]).replace(/^\./, "");
        if (Object.hasOwn(KINDS, v) || v === "diger") out.kinds.push(v); else out.exts.push(v);
      } else if (w.startsWith("-") && w.length > 1) out.not.push(...tokenize(w.slice(1)));
      else out.terms.push(...tokenize(w));
    }
    return out;
  }

  const K1 = 1.2, B = 0.75;
  /** Arama. Terim yoksa süzgeçlere uyan belgeler en yeni değişene göre gelir (opts.recent ile süzgeçsiz de). */
  function search(index, query, opts) {
    const o = opts || {};
    const limit = o.limit || 50;
    const q = typeof query === "string" ? parseQuery(query) : query;
    const { docs, body, names, tags, lens, avg, idf, vocab } = index;
    const allow = (i) => {
      const d = docs[i];
      if (q.kinds.length && !q.kinds.includes(kindOf(d.ext))) return false;
      if (q.exts.length && !q.exts.includes(d.ext)) return false;
      if (q.tags.length) for (const t of q.tags) { const s = tags.get(t); if (!s || !s.has(i)) return false; }
      if (o.root && d.root !== o.root) return false;
      return true;
    };
    const scores = new Map();
    const matched = new Map(); // docIdx → Set(sorgu terimi)
    const termList = [...new Set(q.terms)];
    for (const qt of termList) {
      // Tam terim + önek genişletmesi (3+ karakter): "fatura" → "faturalar", "faturasi"…
      const expanded = qt.length >= 3 ? prefixTerms(vocab, qt, 48) : [qt];
      if (!expanded.includes(qt)) expanded.unshift(qt);
      // Tüm biçimler tek terim gibi sayılır (kök eşleşmesi): tf biçimlerin toplamı (tam biçim 1, ekli biçim 0.85 ağırlıklı), df birleşimin boyutu.
      const tfDoc = new Map();
      const nameHit = new Map();
      for (const t of expanded) {
        const wq = t === qt ? 1 : 0.85;
        const p = body.get(t);
        if (p) for (let j = 0; j < p.length; j += 2) tfDoc.set(p[j], (tfDoc.get(p[j]) || 0) + p[j + 1] * wq);
        const ns = names.get(t);
        if (ns) for (const i of ns) nameHit.set(i, Math.max(nameHit.get(i) || 0, wq));
      }
      const perDoc = new Map();
      if (tfDoc.size) {
        const w = idf(tfDoc.size);
        for (const [i, tf] of tfDoc) perDoc.set(i, (w * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * lens[i]) / avg)));
      }
      if (nameHit.size) {
        const w = idf(nameHit.size) * 2.2; // ad ve klasör eşleşmesi güçlü sinyal
        for (const [i, wq] of nameHit) perDoc.set(i, (perDoc.get(i) || 0) + w * wq);
      }
      for (const [i, sc] of perDoc) {
        scores.set(i, (scores.get(i) || 0) + sc);
        let s = matched.get(i);
        if (!s) matched.set(i, (s = new Set()));
        s.add(qt);
      }
    }
    let ids;
    if (termList.length) {
      ids = [...scores.keys()].filter((i) => allow(i));
      // Tüm terimleri içeren belgeler öne: kapsama oranıyla çarp.
      for (const i of ids) scores.set(i, scores.get(i) * (0.35 + 0.65 * (matched.get(i).size / termList.length) ** 2));
    } else if (q.phrases.length || q.tags.length || q.kinds.length || q.exts.length || o.recent) {
      ids = docs.map((_, i) => i).filter(allow);
      for (const i of ids) scores.set(i, docs[i].mtime || 0);
    } else ids = [];
    if (q.phrases.length || q.not.length) {
      ids = ids.filter((i) => {
        const d = docs[i];
        const f = fold(d.name + "\n" + (d.text || "")).replace(/\s+/g, " ");
        if (q.phrases.some((p) => !f.includes(p))) return false;
        if (q.not.length) { const toks = new Set(tokenize(d.name + " " + (d.text || ""))); if (q.not.some((n) => toks.has(n) || fold(d.name).includes(n))) return false; }
        return true;
      });
      if (q.phrases.length) for (const i of ids) scores.set(i, (scores.get(i) || 0) + 5);
    }
    ids.sort((a, b) => scores.get(b) - scores.get(a) || (docs[b].mtime || 0) - (docs[a].mtime || 0));
    const total = ids.length;
    const words = [...termList, ...q.phrases];
    return {
      total,
      query: q,
      results: ids.slice(0, limit).map((i) => ({ id: docs[i].id, score: Math.round(scores.get(i) * 1000) / 1000, snippet: snippet(docs[i].text || "", words), terms: [...(matched.get(i) || [])] })),
    };
  }

  /** Eşleşen metin bölümü: en iyi konumun çevresi (yaklaşık 260 karakter), satır numarası ve işaret aralıkları. */
  function snippet(text, words, size) {
    const t = String(text || "");
    const W = size || 260;
    if (!t) return { text: "", line: 0, marks: [] };
    const f = fold(t);
    let pos = -1;
    const ws = (words || []).filter(Boolean);
    for (const w of ws) {
      const re = new RegExp("(^|[^\\p{L}\\p{N}])" + escapeRe(w), "u");
      const m = re.exec(f);
      if (m && (pos < 0 || m.index < pos)) pos = m.index + m[1].length;
    }
    if (pos < 0) pos = 0;
    let start = Math.max(0, pos - Math.floor(W / 3));
    const nl = t.lastIndexOf("\n", pos);
    if (nl >= start - 40 && nl < pos) start = nl + 1;
    let end = Math.min(t.length, start + W);
    const sp = t.lastIndexOf(" ", end);
    if (end < t.length && sp > pos) end = sp;
    const raw = t.slice(start, end);
    const line = countLines(t, pos);
    const lead = start > 0 ? "…" : "";
    const tail = end < t.length ? "…" : "";
    const shown = lead + raw.replace(/\s+/g, " ") + tail;
    return { text: shown, line, marks: marks(shown, ws) };
  }
  function countLines(t, pos) {
    let n = 1;
    for (let i = t.indexOf("\n"); i >= 0 && i < pos; i = t.indexOf("\n", i + 1)) n++;
    return n;
  }
  function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  /** Görünen metinde sözcük başında başlayan eşleşmelerin [başlangıç, bitiş] aralıkları. */
  function marks(shown, words) {
    const f = fold(shown);
    const out = [];
    for (const w of words || []) {
      if (!w) continue;
      const re = new RegExp("(^|[^\\p{L}\\p{N}])(" + escapeRe(w) + "[\\p{L}\\p{N}]*)", "gu");
      let m;
      while ((m = re.exec(f))) {
        const s = m.index + m[1].length;
        out.push([s, s + m[2].length]);
        if (out.length > 60) break;
      }
    }
    out.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of out) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()); }
    return merged;
  }
  /** Önizleme: belgenin tamamı yerine eşleşmenin çevresindeki satırlar (satır numaralı). */
  function previewLines(text, words, around) {
    const t = String(text || "");
    const lines = t.split("\n");
    const ws = (words || []).filter(Boolean);
    const hit = new Set();
    if (ws.length) {
      for (let i = 0; i < lines.length && hit.size < 400; i++) {
        const fl = fold(lines[i]);
        if (ws.some((w) => new RegExp("(^|[^\\p{L}\\p{N}])" + escapeRe(w), "u").test(fl))) hit.add(i);
      }
    }
    const A = around == null ? 3 : around;
    const keep = new Set();
    if (!hit.size) for (let i = 0; i < Math.min(lines.length, 40); i++) keep.add(i);
    for (const i of hit) for (let k = Math.max(0, i - A); k <= Math.min(lines.length - 1, i + A); k++) keep.add(k);
    const out = [];
    let prev = -2;
    for (const i of [...keep].sort((a, b) => a - b).slice(0, 400)) {
      if (i !== prev + 1 && out.length) out.push({ gap: true });
      const s = lines[i].length > 400 ? lines[i].slice(0, 400) + "…" : lines[i];
      out.push({ n: i + 1, text: s, hit: hit.has(i), marks: hit.has(i) ? marks(s, ws) : [] });
      prev = i;
    }
    return { lines: out, hits: hit.size, total: lines.length };
  }

  /** Benzer belgeler: seçili belgenin en ağırlıklı 40 terimiyle TF-IDF kosinüs. */
  function similar(index, docId, limit) {
    const i0 = index.docs.findIndex((d) => d.id === docId);
    if (i0 < 0) return [];
    const { body, idf, norms, docs } = index;
    const toks = tokenize(docs[i0].text || "");
    const tf = new Map();
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
    const top = [...tf].map(([t, n]) => [t, n * idf((body.get(t) || []).length / 2)]).filter(([t]) => (body.get(t) || []).length / 2 < index.N * 0.5).sort((a, b) => b[1] - a[1]).slice(0, 40);
    const sc = new Map();
    for (const [t, w] of top) {
      const p = body.get(t);
      const wi = idf(p.length / 2);
      for (let j = 0; j < p.length; j += 2) if (p[j] !== i0) sc.set(p[j], (sc.get(p[j]) || 0) + w * p[j + 1] * wi);
    }
    const n0 = Math.sqrt(top.reduce((a, [, w]) => a + w * w, 0)) || 1;
    return [...sc].map(([i, s]) => ({ id: docs[i].id, score: Math.round((s / (n0 * norms[i])) * 1000) / 1000 })).filter((x) => x.score >= 0.08).sort((a, b) => b.score - a.score).slice(0, limit || 8);
  }

  // ---- MyMind: anlamsal sorgu (veri azaltılmış, onaylı) ----
  /** Gönderilecek veri yalnız: soru + en iyi ≤8 adayın dosya ADI ve eşleşen ≤360 karakterlik bölümü. Tam yol, klasör, etiket, tarih gitmez. */
  function mymindPayload(question, candidates) {
    const qn = String(question || "").replace(/\s+/g, " ").trim().slice(0, 300);
    if (qn.length < 3) throw new Error("Soru en az 3 karakter olmalı.");
    const c = (candidates || []).slice(0, AI_MAX_CANDIDATES).map((x, k) => ({ n: k + 1, name: String(x.name || "").slice(0, 120), text: String(x.text || "").replace(/\s+/g, " ").slice(0, AI_SNIPPET) }));
    if (!c.length) throw new Error("Önce yerel aramada eşleşen belge bulunmalı.");
    const block = c.map((x) => "[" + x.n + "] " + x.name + "\n" + x.text).join("\n\n");
    return {
      candidates: c,
      messages: [
        { role: "system", content: "Sen bir dosya arama yardımcısısın. Yalnız verilen belge bölümlerini kullan; bilgi yoksa uydurma. Yanıtı yalnız şu JSON biçiminde ver: {\"cevap\":\"kısa Türkçe yanıt\",\"kaynaklar\":[{\"n\":1,\"alinti\":\"bölümden aynen kısa alıntı\"}]}. En ilgili en fazla 3 kaynak; ilgili kaynak yoksa kaynaklar boş liste." },
        { role: "user", content: "Soru: " + qn + "\n\nBelge bölümleri:\n" + block },
      ],
    };
  }
  /** Yanıt doğrulaması: JSON ayrıştırılır; yalnız gönderilen aday numaraları kabul edilir; alıntı o adayın metninde birebir (katlanmış) geçmiyorsa "doğrulanamadı" işaretlenir. */
  function validateAi(content, candidates) {
    let t = String(content == null ? "" : content).trim().replace(/^```[a-z]*\s*|\s*```$/g, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) return { ok: false, error: "MyMind yanıtı beklenen biçimde değil." };
    let j;
    try { j = JSON.parse(t.slice(a, b + 1)); } catch { return { ok: false, error: "MyMind yanıtı çözümlenemedi." }; }
    const answer = String(j.cevap || j.answer || "").replace(/\s+/g, " ").trim().slice(0, 1200);
    if (!answer) return { ok: false, error: "MyMind boş yanıt verdi." };
    const src = [];
    for (const s of Array.isArray(j.kaynaklar) ? j.kaynaklar : Array.isArray(j.sources) ? j.sources : []) {
      const n = Number(s && s.n);
      const c = (candidates || []).find((x) => x.n === n);
      if (!c || src.some((x) => x.n === n)) continue;
      const quote = String(s.alinti || s.quote || "").replace(/\s+/g, " ").trim().slice(0, 300);
      const verified = quote.length >= 4 && fold(c.text).includes(fold(quote));
      src.push({ n, quote: verified ? quote : "", verified });
      if (src.length >= 3) break;
    }
    return { ok: true, answer, sources: src };
  }

  // ---- Biçimleme ----
  function formatSize(n) {
    const x = Number(n) || 0;
    if (x < 1024) return x + " B";
    if (x < 1024 * 1024) return (x / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " KB";
    return (x / 1024 / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " MB";
  }
  function formatWhen(ts, now) {
    if (!ts) return "";
    const d = new Date(ts), n = new Date(now || Date.now());
    if (d.toDateString() === n.toDateString()) return "bugün " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" });
  }
  function cleanTag(t) {
    const s = String(t == null ? "" : t).replace(/^#+/, "").replace(/[\s,;]+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 32);
    return s.length >= 2 ? s : "";
  }
  function makeId(seed) {
    // Yol için kararlı kimlik (FNV-1a 64 bit benzeri, iki 32 bit parça)
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
    }
    return "f" + h1.toString(36) + h2.toString(36);
  }

  return { TEXT_EXT, KINDS, DEFAULT_EXCLUDES, SIZES_MB, MAX_TEXT, MAX_FILES, AI_MAX_CANDIDATES, AI_SNIPPET, ID_RE, settingsOf, fold, tokenize, nameTokens, extOf, kindOf, isTextExt, excluded, plainText, decodeText, buildIndex, prefixTerms, parseQuery, search, snippet, previewLines, similar, mymindPayload, validateAi, formatSize, formatWhen, cleanTag, makeId };
});
