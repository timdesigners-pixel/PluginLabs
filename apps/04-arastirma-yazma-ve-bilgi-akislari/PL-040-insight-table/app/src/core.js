/* Insight Table — çekirdek motor (Node + tarayıcı UMD).
 * Seçilen HTML tablo/liste, Markdown tablosu, TSV ya da CSV metnini sütunlara ayırır, veri tiplerini (sayı, para, tarih, mantıksal, metin)
 * algılar, TR/EN sayı ve tarih yerelleştirmesini normalleştirir, eksik veya şüpheli hücreleri işaretler (kaynaksız değer uydurmaz),
 * her hücre için kaynak izi (satır/sütun/ham metin) tutar, kişisel verileri (PII) isteğe bağlı maskeler ve CSV enjeksiyonuna karşı
 * güvenli CSV/JSON dışa aktarır. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ITCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_TEXT = 200000;
  const MAX_TABLES = 200;
  const COL_TYPES = ["metin", "sayi", "para", "tarih", "mantiksal"];
  const COL_TYPE_NAMES = { metin: "Metin", sayi: "Sayı", para: "Para birimi", tarih: "Tarih (ISO)", mantiksal: "Mantıksal (E/H)" };
  const FORMAT_NAMES = { html_table: "HTML tablo", html_list: "HTML liste", markdown: "Markdown tablosu", tsv: "TSV (sekme)", csv: "CSV / noktalı virgül", kv_list: "Anahtar: Değer listesi" };

  function str(v, max = 2000) { return typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max); }
  function fold(s) {
    return str(s, 2000).toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function slugCol(name, idx) {
    const f = fold(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return f || "sutun_" + (idx + 1);
  }
  function isWebUrl(u) {
    try { const x = new URL(String(u).trim()); return (x.protocol === "http:" || x.protocol === "https:") && !x.username && !x.password; } catch { return false; }
  }
  function isLoopbackUrl(u) {
    try { const x = new URL(String(u).trim()); return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password; } catch { return false; }
  }
  function hostOf(u) { try { return new URL(u).hostname; } catch { return ""; } }

  // ---- HTML entity çözme & etiket temizleme ----
  function stripTags(html) {
    return String(html || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ---- Kişisel veri (PII) tespiti ve maskeleme ----
  const PII_RULES = [
    { type: "eposta", label: "E-posta", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, mask: "[E-POSTA]" },
    { type: "iban", label: "IBAN", re: /\bTR\d{2}\s?(?:\d{4}\s?){5}\d{2}\b/gi, mask: "[IBAN]" },
    { type: "telefon", label: "Telefon", re: /(?:\+90|0)?\s*\(?5\d{2}\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}\b/g, mask: "[TELEFON]" },
    { type: "tckn", label: "T.C. Kimlik", re: /\b[1-9]\d{10}\b/g, mask: "[TCKN]" },
  ];
  function detectPii(text) {
    const s = String(text || "");
    const found = [];
    for (const r of PII_RULES) {
      r.re.lastIndex = 0;
      if (r.re.test(s)) found.push(r.type);
    }
    return found;
  }
  function maskPiiText(text) {
    let s = String(text || "");
    for (const r of PII_RULES) {
      r.re.lastIndex = 0;
      s = s.replace(r.re, r.mask);
    }
    return s;
  }

  // ---- Veri tipi ve yerelleştirme normalleştirmesi (TR / EN) ----
  const TR_MONTHS = {
    ocak: "01", subat: "02", mart: "03", nisan: "04", mayis: "05", haziran: "06",
    temmuz: "07", agustos: "08", eylul: "09", ekim: "10", kasim: "11", aralik: "12",
    oca: "01", sub: "02", mar: "03", nis: "04", may: "05", haz: "06",
    tem: "07", agu: "08", eyl: "09", eki: "10", kas: "11", ara: "12",
  };

  function parseCurrencyOrNumber(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;
    // Telefon veya TCKN gibi görünüyorsa sayıya çevirme
    if (/^\+90|^0\s*\(?5\d{2}/.test(s) || /^[1-9]\d{10}$/.test(s)) return null;
    const curMatch = s.match(/(₺|TL|TRY|\$|USD|€|EUR|£|GBP)/i);
    const currency = curMatch ? curMatch[1].toUpperCase().replace("₺", "TL") : null;
    let clean = s.replace(/(₺|TL|TRY|\$|USD|€|EUR|£|GBP|%)/gi, "").trim();
    if (!clean || !/^[-+]?\d[\d.,\s]*$/.test(clean)) return null;
    clean = clean.replace(/\s+/g, "");
    const hasComma = clean.includes(",");
    const hasDot = clean.includes(".");
    if (hasComma && hasDot) {
      if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        clean = clean.replace(/,/g, "");
      }
    } else if (hasComma) {
      const parts = clean.split(",");
      if (parts.length === 2 && parts[1].length <= 2) clean = parts[0].replace(/\./g, "") + "." + parts[1];
      else clean = clean.replace(/,/g, "");
    } else if (hasDot) {
      const parts = clean.split(".");
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3 && currency)) {
        clean = clean.replace(/\./g, "");
      }
    }
    const n = Number(clean);
    if (!Number.isFinite(n)) return null;
    return { num: n, currency, isPercent: s.includes("%") };
  }

  function parseDateValue(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (m) {
      const y = +m[1], mo = +m[2], d = +m[3];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${m[1]}-${m[2]}-${m[3]}`;
    }
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      const d = +m[1], mo = +m[2], y = +m[3];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    const f = fold(s);
    m = f.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (m && TR_MONTHS[m[2]]) {
      const d = +m[1], y = +m[3];
      if (d >= 1 && d <= 31) return `${y}-${TR_MONTHS[m[2]]}-${String(d).padStart(2, "0")}`;
    }
    return null;
  }

  function parseBoolValue(raw) {
    const f = fold(String(raw || "").trim());
    if (!f) return null;
    if (["evet", "true", "aktif", "var", "onayli", "acik", "yes"].includes(f)) return true;
    if (["hayir", "false", "pasif", "yok", "kapali", "no"].includes(f)) return false;
    return null;
  }

  function classifyValue(raw) {
    const s = String(raw || "").trim();
    if (!s || /^(-|—|n\/a|null|yok|belirsiz|\?+)$/i.test(s)) return { kind: "empty", norm: "" };
    const dt = parseDateValue(s);
    if (dt) return { kind: "tarih", norm: dt };
    const bl = parseBoolValue(s);
    if (bl !== null) return { kind: "mantiksal", norm: bl ? "Evet" : "Hayır" };
    const cn = parseCurrencyOrNumber(s);
    if (cn) {
      if (cn.currency) return { kind: "para", norm: cn.num.toFixed(2) + " " + cn.currency, num: cn.num };
      return { kind: "sayi", norm: String(cn.num), num: cn.num };
    }
    return { kind: "metin", norm: s };
  }

  function inferColumnType(values) {
    const counts = { sayi: 0, para: 0, tarih: 0, mantiksal: 0, metin: 0 };
    let nonEmpty = 0;
    for (const v of values) {
      const c = classifyValue(v);
      if (c.kind === "empty") continue;
      nonEmpty++;
      counts[c.kind] = (counts[c.kind] || 0) + 1;
    }
    if (!nonEmpty) return "metin";
    for (const t of ["para", "tarih", "sayi", "mantiksal"]) {
      if (counts[t] / nonEmpty >= 0.6) return t;
    }
    // sayi + para karışımıysa para veya sayi
    if ((counts.para + counts.sayi) / nonEmpty >= 0.6) return counts.para >= counts.sayi ? "para" : "sayi";
    return "metin";
  }

  function normalizeCellForType(raw, colType) {
    const s = String(raw || "").trim();
    const pii = detectPii(s);
    if (!s || /^(-|—|n\/a|null|belirsiz|\?+)$/i.test(s)) {
      return { raw: s, norm: "", status: "missing", reason: s ? "Belirsiz yer tutucu (“" + s + "”) — kaynaksız tamamlanmadı" : "Kaynakta boş hücre — kaynaksız tamamlanmadı", pii };
    }
    if (colType === "metin") return { raw: s, norm: s, status: "ok", reason: "", pii };
    const c = classifyValue(s);
    if (colType === "tarih") {
      if (c.kind === "tarih") return { raw: s, norm: c.norm, status: "ok", reason: s !== c.norm ? "Tarih ISO biçimine normalleştirildi" : "", pii };
      return { raw: s, norm: s, status: "anomaly", reason: "Tarih sütununda geçersiz tarih biçimi (“" + s + "”) — olduğu gibi korundu", pii };
    }
    if (colType === "para" || colType === "sayi") {
      const cn = parseCurrencyOrNumber(s);
      if (cn) {
        const norm = colType === "para" ? (cn.currency ? cn.num.toFixed(2) + " " + cn.currency : cn.num.toFixed(2)) : String(cn.num);
        return { raw: s, norm, status: "ok", reason: s !== norm ? "Sayı/ondalık normalleştirildi" : "", pii };
      }
      return { raw: s, norm: s, status: "anomaly", reason: COL_TYPE_NAMES[colType] + " sütununda sayısal olmayan değer (“" + s + "”) — uydurulmadı", pii };
    }
    if (colType === "mantiksal") {
      const bl = parseBoolValue(s);
      if (bl !== null) return { raw: s, norm: bl ? "Evet" : "Hayır", status: "ok", reason: "", pii };
      return { raw: s, norm: s, status: "anomaly", reason: "Mantıksal sütunda beklenmeyen değer (“" + s + "”)", pii };
    }
    return { raw: s, norm: s, status: "ok", reason: "", pii };
  }

  // ---- Tablo ve liste ayrıştırıcı (HTML tablo, HTML liste, Markdown, TSV, CSV) ----
  function parseDelimitedLine(line, delim) {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function extractRawGrid(text) {
    const raw = String(text || "").replace(/^\uFEFF/, "").slice(0, MAX_TEXT).trim();
    if (!raw) throw new Error("Çıkarılacak tablo ya da liste metni boş.");

    // 1) HTML <table>
    if (/<table[\s>]/i.test(raw) && /<tr[\s>]/i.test(raw)) {
      const rows = [];
      const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch, lineIdx = 0;
      while ((trMatch = trRe.exec(raw)) !== null) {
        lineIdx++;
        const cells = [];
        const cellRe = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
        let cm;
        while ((cm = cellRe.exec(trMatch[1])) !== null) cells.push(stripTags(cm[2]));
        if (cells.length) rows.push({ cells, line: lineIdx, rawLine: stripTags(trMatch[0]).slice(0, 240) });
      }
      if (rows.length >= 2) return { format: "html_table", header: rows[0].cells, rows: rows.slice(1) };
    }

    // 2) HTML <ul>/<ol>/<li>
    if (/<li[\s>]/i.test(raw)) {
      const items = [];
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let m, idx = 0;
      while ((m = liRe.exec(raw)) !== null) {
        idx++;
        const clean = stripTags(m[1]);
        if (clean) items.push({ clean, line: idx });
      }
      if (items.length) return parseListItemsToGrid(items, "html_list");
    }

    const lines = raw.split(/\r?\n/).map((l, i) => ({ text: l.trim(), line: i + 1 })).filter((x) => x.text);

    // 3) Markdown tablosu
    const mdLines = lines.filter((x) => x.text.includes("|"));
    if (mdLines.length >= 2) {
      const parsed = mdLines.map((x) => {
        let t = x.text;
        if (t.startsWith("|")) t = t.slice(1);
        if (t.endsWith("|")) t = t.slice(0, -1);
        return { cells: t.split("|").map((c) => c.trim()), line: x.line, rawLine: x.text.slice(0, 240) };
      });
      const isSep = (cells) => cells.every((c) => /^:?-{2,}:?$/.test(c));
      const sepIdx = parsed.findIndex((r) => isSep(r.cells));
      if (sepIdx === 1) {
        return { format: "markdown", header: parsed[0].cells, rows: parsed.slice(2).filter((r) => !isSep(r.cells)) };
      }
      if (parsed.length >= 2 && parsed[0].cells.length >= 2) {
        return { format: "markdown", header: parsed[0].cells, rows: parsed.slice(1) };
      }
    }

    // 4) TSV (sekme)
    if (lines.length >= 2 && lines[0].text.includes("\t")) {
      const parsed = lines.map((x) => ({ cells: x.text.split("\t").map((c) => c.trim()), line: x.line, rawLine: x.text.slice(0, 240) }));
      return { format: "tsv", header: parsed[0].cells, rows: parsed.slice(1) };
    }

    // 5) Madde işaretli liste (- / * / • / 1.)
    if (lines.every((x) => /^([-*•]|\d+[.)])\s+/.test(x.text))) {
      const items = lines.map((x) => ({ clean: x.text.replace(/^([-*•]|\d+[.)])\s+/, "").trim(), line: x.line }));
      return parseListItemsToGrid(items, "kv_list");
    }

    // 6) CSV veya noktalı virgüllü tablo
    if (lines.length >= 2) {
      const semi = (lines[0].text.match(/;/g) || []).length;
      const comma = (lines[0].text.match(/,/g) || []).length;
      const delim = semi > comma ? ";" : ",";
      if (semi > 0 || comma > 0) {
        const parsed = lines.map((x) => ({ cells: parseDelimitedLine(x.text, delim), line: x.line, rawLine: x.text.slice(0, 240) }));
        if (parsed[0].cells.length >= 2) return { format: "csv", header: parsed[0].cells, rows: parsed.slice(1) };
      }
    }

    // 7) Son çare: satır listesi
    const items = lines.map((x) => ({ clean: x.text, line: x.line }));
    return parseListItemsToGrid(items, "kv_list");
  }

  function parseListItemsToGrid(items, format) {
    // Örn: "Ürün: Kamera | Fiyat: 1.250 TL | Stok: Evet" veya "Ad - Değer - Tarih"
    const kvRows = [];
    const keyOrder = [];
    for (const it of items) {
      const parts = it.clean.split(/\s*(?:\||;|—|–|\s-\s)\s*/).filter(Boolean);
      const kv = {};
      let pairs = 0;
      for (const p of parts) {
        const m = p.match(/^([^:]{1,40}):\s*(.+)$/);
        if (m) {
          const k = m[1].trim();
          if (!keyOrder.includes(k)) keyOrder.push(k);
          kv[k] = m[2].trim();
          pairs++;
        }
      }
      if (pairs >= 2) kvRows.push({ kv, line: it.line, rawLine: it.clean.slice(0, 240) });
    }
    if (kvRows.length && keyOrder.length >= 2) {
      return {
        format,
        header: keyOrder,
        rows: kvRows.map((r) => ({ cells: keyOrder.map((k) => r.kv[k] || ""), line: r.line, rawLine: r.rawLine })),
      };
    }
    const splitRows = items.map((it) => ({
      cells: it.clean.split(/\s*(?:\||;|—|–|\s-\s)\s*/).map((s) => s.trim()),
      line: it.line,
      rawLine: it.clean.slice(0, 240),
    }));
    const maxCols = Math.max(1, ...splitRows.map((r) => r.cells.length));
    const header = Array.from({ length: maxCols }, (_, i) => "Alan " + (i + 1));
    return { format, header, rows: splitRows };
  }

  function buildTable(rawText, meta = {}) {
    const grid = extractRawGrid(rawText);
    const colCount = Math.max(grid.header.length, ...grid.rows.map((r) => r.cells.length));
    const columns = [];
    for (let c = 0; c < colCount; c++) {
      const origName = str(grid.header[c] || "Sütun " + (c + 1), 80).trim() || "Sütun " + (c + 1);
      const colVals = grid.rows.map((r) => str(r.cells[c] ?? "", 500));
      const type = inferColumnType(colVals);
      columns.push({
        index: c,
        originalName: origName,
        name: origName,
        key: slugCol(origName, c),
        type,
        autoType: type,
        included: true,
      });
    }
    const id = meta.id || "tbl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    const sourceUrl = meta.sourceUrl && isWebUrl(meta.sourceUrl) ? meta.sourceUrl.trim() : "";
    const title = str(meta.title || columns.slice(0, 3).map((c) => c.name).join(" · ") || "Tablo", 140).trim();
    const tbl = {
      id,
      title,
      sourceUrl,
      sourceType: str(meta.sourceType || "yapistirma", 30),
      format: grid.format,
      createdAt: meta.createdAt || new Date().toISOString(),
      rawPreview: str(rawText, 3000),
      columns,
      rawRows: grid.rows.map((r, rIdx) => ({
        rowIndex: rIdx + 1,
        sourceLine: r.line,
        rawLine: str(r.rawLine, 260),
        values: Array.from({ length: colCount }, (_, c) => str(r.cells[c] ?? "", 500)),
      })),
      edits: {},
      ai: null,
      sampleKey: meta.sampleKey || "",
    };
    return recomputeTable(tbl);
  }

  function recomputeTable(tbl) {
    const colCount = tbl.columns.length;
    tbl.columns.forEach((col, i) => {
      col.index = i;
      col.name = str(col.name || col.originalName || "Sütun " + (i + 1), 80).trim();
      col.key = slugCol(col.key || col.name, i);
      if (!COL_TYPES.includes(col.type)) col.type = "metin";
      col.included = col.included !== false;
    });
    let totalCells = 0, exactTraceCells = 0, missingCells = 0, anomalyCells = 0, piiCells = 0, editedCells = 0;
    const rows = tbl.rawRows.map((rr, rIdx) => {
      const cells = [];
      for (let c = 0; c < colCount; c++) {
        const col = tbl.columns[c];
        const editKey = rIdx + ":" + c;
        const hasEdit = Object.prototype.hasOwnProperty.call(tbl.edits || {}, editKey);
        const rawVal = rr.values[c] ?? "";
        const valToUse = hasEdit ? tbl.edits[editKey] : rawVal;
        const normInfo = normalizeCellForType(valToUse, col.type);
        const trace = {
          row: rIdx + 1,
          col: c + 1,
          sourceLine: rr.sourceLine,
          rawCell: rawVal,
          rawLine: rr.rawLine,
          edited: hasEdit,
        };
        if (col.included) {
          totalCells++;
          if (trace.rawCell !== undefined && trace.sourceLine >= 1) exactTraceCells++;
          if (normInfo.status === "missing") missingCells++;
          if (normInfo.status === "anomaly") anomalyCells++;
          if (normInfo.pii.length) piiCells++;
          if (hasEdit) editedCells++;
        }
        cells.push({
          colIndex: c,
          raw: rawVal,
          value: normInfo.norm,
          status: hasEdit ? "edited" : normInfo.status,
          reason: hasEdit ? "Kullanıcı tarafından düzenlendi (kaynak: “" + rawVal + "”)" : normInfo.reason,
          pii: normInfo.pii,
          trace,
        });
      }
      return { rowIndex: rIdx + 1, sourceLine: rr.sourceLine, rawLine: rr.rawLine, cells };
    });
    tbl.rows = rows;
    tbl.stats = {
      rowCount: rows.length,
      colCount,
      includedCols: tbl.columns.filter((c) => c.included).length,
      totalCells,
      exactTraceCells,
      cellAccuracy: totalCells ? Math.round((exactTraceCells / totalCells) * 1000) / 10 : 100,
      missingCells,
      anomalyCells,
      piiCells,
      editedCells,
      unverifiedCompleted: 0, // Hücre verileri asla kaynaksız tamamlanmaz
    };
    return tbl;
  }

  // ---- CSV enjeksiyonu koruması ----
  function safeCsvCell(val) {
    let s = String(val == null ? "" : val).replace(/\r?\n/g, " ");
    let formulaEscaped = false;
    if (/^[=+\-@\t\r]/.test(s) && !/^-\d+(\.\d+)?(\s+[A-Z₺$€£]+)?$/.test(s)) {
      s = "'" + s;
      formulaEscaped = true;
    }
    if (/[";,]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return { text: s, formulaEscaped };
  }

  function exportCsv(tbl, opts = {}) {
    recomputeTable(tbl);
    const maskPii = !!opts.maskPii;
    const delim = opts.delimiter === ";" ? ";" : ",";
    const cols = tbl.columns.filter((c) => c.included);
    let escapedFormulas = 0;
    const head = cols.map((c) => {
      const r = safeCsvCell(c.name);
      if (r.formulaEscaped) escapedFormulas++;
      return r.text;
    }).join(delim);
    const lines = [head];
    for (const row of tbl.rows) {
      const cells = cols.map((c) => {
        const cell = row.cells[c.index];
        const rawOut = cell.value !== "" ? cell.value : cell.raw;
        const v = maskPii ? maskPiiText(rawOut) : rawOut;
        const r = safeCsvCell(v);
        if (r.formulaEscaped) escapedFormulas++;
        return r.text;
      });
      lines.push(cells.join(delim));
    }
    return { csv: "\uFEFF" + lines.join("\r\n") + "\r\n", rowCount: tbl.rows.length, colCount: cols.length, escapedFormulas };
  }

  function exportJson(tbl, opts = {}) {
    recomputeTable(tbl);
    const maskPii = !!opts.maskPii;
    const includeTrace = opts.includeTrace !== false;
    const cols = tbl.columns.filter((c) => c.included);
    const records = tbl.rows.map((row) => {
      const obj = {};
      const traces = {};
      for (const c of cols) {
        const cell = row.cells[c.index];
        const v = cell.value !== "" ? cell.value : "";
        obj[c.key] = maskPii ? maskPiiText(v) : v;
        if (includeTrace) {
          traces[c.key] = {
            line: cell.trace.sourceLine,
            raw: maskPii ? maskPiiText(cell.raw) : cell.raw,
            status: cell.status,
          };
        }
      }
      return includeTrace ? { ...obj, _trace: traces } : obj;
    });
    return {
      json: JSON.stringify({
        table: tbl.title,
        format: tbl.format,
        sourceUrl: tbl.sourceUrl || null,
        exportedAt: new Date().toISOString(),
        maskPii,
        columns: cols.map((c) => ({ name: c.name, key: c.key, type: c.type })),
        stats: tbl.stats,
        rows: records,
      }, null, 2),
      rowCount: records.length,
    };
  }

  // ---- MyMind / yerel model yükü ve doğrulaması (yalnız sütun adı/tipi ve sorunlu hücre uyarısı; hücre değeri uydurulamaz) ----
  function aiPayload(tbl) {
    recomputeTable(tbl);
    let maskedCount = 0;
    const colSamples = tbl.columns.map((c) => {
      const samples = tbl.rows.slice(0, 3).map((r) => {
        const raw = r.cells[c.index].raw;
        const pii = detectPii(raw);
        if (pii.length) { maskedCount += pii.length; return maskPiiText(raw); }
        return str(raw, 60);
      });
      return { index: c.index, name: c.originalName, currentType: c.type, samples };
    });
    const sys = "Sen Insight Table sütun normalleştiricisisin. Verilen sütun başlıklarını ve örneklerini incele. Sütun adlarını temiz Türkçe/standart adlara normalleştir, veri tipini (metin, sayi, para, tarih, mantiksal) öner ve olası eksik/hatalı hücre uyarılarını özetle. KURAL: Eksik hücreler için ASLA değer uydurma veya tamamlama (`fillValues` alanı gönderme). Yalnız JSON döndür: {\"columns\":[{\"index\":0,\"name\":\"...\",\"key\":\"...\",\"type\":\"...\"}],\"notes\":[\"...\"]}.";
    const usr = JSON.stringify({ tableTitle: tbl.title, columns: colSamples });
    return {
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      sent: { colCount: colSamples.length, sampleRows: Math.min(3, tbl.rows.length), maskedCount, chars: usr.length },
    };
  }

  function validateAi(rawContent, tbl) {
    const txt = String(rawContent || "").trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let parsed;
    try { parsed = JSON.parse(m[0]); } catch { throw new Error("Model JSON yanıtı ayrıştırılamadı."); }
    let dropped = 0;
    // Eğer model kaynaksız hücre tamamlama (fillValues / fabricatedCells) önerdiyse anında reddet ve say!
    if (parsed.fillValues || parsed.completedCells || parsed.fabricatedValues) {
      const extra = Array.isArray(parsed.fillValues) ? parsed.fillValues.length : 1;
      dropped += extra;
    }
    const cols = [];
    for (const item of Array.isArray(parsed.columns) ? parsed.columns : []) {
      const idx = Number(item && item.index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= tbl.columns.length) { dropped++; continue; }
      if (item.fillValue !== undefined || item.defaultValue !== undefined) dropped++;
      const name = str(item.name || tbl.columns[idx].name, 80).trim();
      const type = COL_TYPES.includes(item.type) ? item.type : tbl.columns[idx].type;
      const key = slugCol(item.key || name, idx);
      cols.push({ index: idx, name, key, type });
    }
    const notes = (Array.isArray(parsed.notes) ? parsed.notes : []).map((n) => str(n, 200).trim()).filter(Boolean).slice(0, 6);
    return { columns: cols, notes, dropped, at: new Date().toISOString() };
  }

  function normalizeSettings(s) {
    s = s || {};
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
      maskPiiByDefault: s.maskPiiByDefault !== false,
      csvDelimiter: s.csvDelimiter === ";" ? ";" : ",",
    };
  }
  function normalizeCounters(c) {
    c = c || {};
    return {
      extracted: Number(c.extracted) || 0,
      exports: Number(c.exports) || 0,
      aiRuns: Number(c.aiRuns) || 0,
      aiDropped: Number(c.aiDropped) || 0,
      formulaEscaped: Number(c.formulaEscaped) || 0,
    };
  }
  function normalizeTables(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_TABLES).map((t) => {
      try { return recomputeTable(t); } catch { return null; }
    }).filter(Boolean);
  }
  function metrics(tables, counters) {
    const list = Array.isArray(tables) ? tables : [];
    let totalCells = 0, exactTraceCells = 0, missing = 0, anomaly = 0, pii = 0;
    for (const t of list) {
      if (!t.stats) recomputeTable(t);
      totalCells += t.stats.totalCells;
      exactTraceCells += t.stats.exactTraceCells;
      missing += t.stats.missingCells;
      anomaly += t.stats.anomalyCells;
      pii += t.stats.piiCells;
    }
    return {
      tableCount: list.length,
      totalCells,
      cellAccuracy: totalCells ? Math.round((exactTraceCells / totalCells) * 1000) / 10 : 100,
      missing,
      anomaly,
      pii,
      unverifiedCompleted: 0,
      exports: (counters && counters.exports) || 0,
      formulaEscaped: (counters && counters.formulaEscaped) || 0,
    };
  }

  return {
    MAX_TEXT, MAX_TABLES, COL_TYPES, COL_TYPE_NAMES, FORMAT_NAMES,
    str, fold, slugCol, isWebUrl, isLoopbackUrl, hostOf,
    detectPii, maskPiiText, parseCurrencyOrNumber, parseDateValue, parseBoolValue,
    classifyValue, inferColumnType, normalizeCellForType,
    extractRawGrid, buildTable, recomputeTable,
    safeCsvCell, exportCsv, exportJson,
    aiPayload, validateAi,
    normalizeSettings, normalizeCounters, normalizeTables, metrics,
  };
});
