/* PL-049 Invoice Inbox — saf çekirdek (hem Node hem tarayıcıda çalışır).
 * Notion: "Kullanıcının yüklediği belgeyi aç; satıcı, tarih, vergi ve toplamı taslak çıkar; insan onayı sonrası CSV'ye aktar. İlk sürüm iki belge şablonu."
 * "OCR ve alan çıkarımı; toplam/kalem tutarlılığı deterministik hesapla kontrol edilir."
 * "Finansal belge şifreli; muhasebe kaydı veya vergi beyannamesi otomatik gönderilmez. Kimlik verisi kırpma seçeneği."
 * "Örnek belgelerde toplam/tarih alanı ≥%98 doğruluk; belirsiz alanlar zorunlu incelemeli." */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.InvoiceCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MAX_DOC_CHARS = 80000;
  const MAX_DOCS = 2000;
  const AI_CONTEXT = 2400;
  const TEMPLATES = ["earsiv-fatura", "serbest-makbuz-fis", "belirsiz"];
  const TEMPLATE_LABELS = {
    "earsiv-fatura": "Şablon 1 · e-Arşiv / e-Fatura",
    "serbest-makbuz-fis": "Şablon 2 · Perakende Fiş / Makbuz",
    "belirsiz": "Belirsiz şablon (zorunlu inceleme)",
  };
  const CURRENCIES = ["TRY", "USD", "EUR"];
  const MONTHS_TR = {
    ocak: 1, subat: 2, "şubat": 2, mart: 3, nisan: 4, mayis: 5, "mayıs": 5,
    haziran: 6, temmuz: 7, agustos: 8, "ağustos": 8, eylul: 9, "eylül": 9,
    ekim: 10, kasim: 11, "kasım": 11, aralik: 12, "aralık": 12,
  };

  function str(v, max = 500) {
    return typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "";
  }

  function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  function parseAmount(raw) {
    if (typeof raw === "number") return Number.isFinite(raw) ? round2(raw) : null;
    if (typeof raw !== "string") return null;
    let s = raw.trim().replace(/[₺$€£]|TL|TRY|USD|EUR/gi, "").replace(/\s+/g, "");
    if (!s) return null;
    const neg = s.startsWith("-");
    s = s.replace(/^[+-]/, "");
    if (/^\d{1,3}(\.\d{3})+,\d{1,4}$/.test(s)) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(,\d{3})+\.\d{1,4}$/.test(s)) {
      s = s.replace(/,/g, "");
    } else if (/^\d+,\d{1,4}$/.test(s)) {
      s = s.replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return round2(neg ? -n : n);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function validYmd(y, m, d) {
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  function parseDateStr(raw) {
    if (typeof raw !== "string") return "";
    const s = raw.trim();
    if (!s) return "";
    let m = s.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
    if (m) return validYmd(Number(m[1]), Number(m[2]), Number(m[3])) || "";
    m = s.match(/\b(0?[1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2})\b/);
    if (m) return validYmd(Number(m[3]), Number(m[2]), Number(m[1])) || "";
    m = s.toLowerCase().match(/\b(0?[1-9]|[12]\d|3[01])\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(20\d{2})\b/i);
    if (m) {
      const mo = MONTHS_TR[m[2].toLowerCase()];
      if (mo) return validYmd(Number(m[3]), mo, Number(m[1])) || "";
    }
    return "";
  }

  function stripMarkup(text) {
    const s = str(text, MAX_DOC_CHARS);
    if (!/[<>]/.test(s)) return s;
    return s
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<\/(tr|p|div|li|h[1-6]|cbc:[A-Za-z]+|cac:[A-Za-z]+)>/gi, "\n")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(td|th)>/gi, " | ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function redactIdentity(text, redactOn = true) {
    const raw = str(text, MAX_DOC_CHARS);
    const counts = { tckn: 0, iban: 0, card: 0 };
    if (!redactOn) return { text: raw, counts, redactedTotal: 0 };
    let out = raw;
    // TR IBAN (TR + 24 rakam, boşluklu veya bitişik)
    out = out.replace(/\bTR\s*\d{2}(?:\s*\d{4}){5}\s*\d{2}\b/gi, () => {
      counts.iban++;
      return "TR[IBAN-KIRPILDI]";
    });
    // Kredi kartı (4x4 rakam veya maskeli/açık 16 hane)
    out = out.replace(/\b(?:\d{4}[ -]){3}\d{4}\b/g, () => {
      counts.card++;
      return "[KART-KIRPILDI]";
    });
    // 11 haneli TCKN (1-9 ile başlayan 11 rakam; VKN 10 hanelidir, TCKN kişisel kimlik verisidir)
    out = out.replace(/\b([1-9]\d{10})\b/g, () => {
      counts.tckn++;
      return "[TCKN-KIRPILDI]";
    });
    return {
      text: out,
      counts,
      redactedTotal: counts.tckn + counts.iban + counts.card,
    };
  }

  function detectTemplate(rawText) {
    const t = str(rawText, MAX_DOC_CHARS);
    if (/e-arşiv|e-arsiv|e-fatura|ettn|gib20\d{2}|<invoice\b|cbc:id|mal hizmet toplam|vergiler dahil toplam/i.test(t)) {
      return "earsiv-fatura";
    }
    if (/fiş no|fis no|makbuz no|serbest meslek|perakende|pos\b|kasa\b|toplam kdv|ara toplam|ödeme yöntemi|tahsilat/i.test(t)) {
      return "serbest-makbuz-fis";
    }
    return "belirsiz";
  }

  function detectCurrency(rawText) {
    const t = str(rawText, MAX_DOC_CHARS);
    if (/\bEUR\b|€/i.test(t) && !/\bTRY\b|\bTL\b|₺/i.test(t)) return "EUR";
    if (/\bUSD\b|\$/i.test(t) && !/\bTRY\b|\bTL\b|₺/i.test(t)) return "USD";
    return "TRY";
  }

  function parseUblXml(rawText) {
    if (!/<(Invoice|cbc:|cac:)/i.test(rawText)) return null;
    const tag = (re) => {
      const m = rawText.match(re);
      return m ? m[1].trim() : "";
    };
    const invoiceNo = tag(/<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/i);
    const issueDate = parseDateStr(tag(/<cbc:IssueDate[^>]*>([^<]+)<\/cbc:IssueDate>/i));
    const dueDate = parseDateStr(tag(/<cbc:DueDate[^>]*>([^<]+)<\/cbc:DueDate>/i) || tag(/<cbc:PaymentDueDate[^>]*>([^<]+)<\/cbc:PaymentDueDate>/i));
    let vendor = "";
    const supBlock = rawText.match(/<cac:AccountingSupplierParty[\s\S]*?<\/cac:AccountingSupplierParty>/i);
    if (supBlock) {
      const mName = supBlock[0].match(/<cac:PartyName>\s*<cbc:Name[^>]*>([^<]+)<\/cbc:Name>/i) || supBlock[0].match(/<cbc:RegistrationName[^>]*>([^<]+)<\/cbc:RegistrationName>/i);
      if (mName) vendor = mName[1].trim();
    }
    const subtotal = parseAmount(tag(/<cbc:LineExtensionAmount[^>]*>([^<]+)<\/cbc:LineExtensionAmount>/i));
    const taxTotal = parseAmount(tag(/<cac:TaxTotal>\s*<cbc:TaxAmount[^>]*>([^<]+)<\/cbc:TaxAmount>/i));
    const grandTotal = parseAmount(tag(/<cbc:PayableAmount[^>]*>([^<]+)<\/cbc:PayableAmount>/i) || tag(/<cbc:TaxInclusiveAmount[^>]*>([^<]+)<\/cbc:TaxInclusiveAmount>/i));
    const items = [];
    const lineRe = /<cac:InvoiceLine[\s\S]*?<\/cac:InvoiceLine>/gi;
    let lm;
    while ((lm = lineRe.exec(rawText)) !== null) {
      const block = lm[0];
      const name = (block.match(/<cac:Item>[\s\S]*?<cbc:Name[^>]*>([^<]+)<\/cbc:Name>/i) || [])[1] || "Kalem";
      const qty = parseAmount((block.match(/<cbc:InvoicedQuantity[^>]*>([^<]+)<\/cbc:InvoicedQuantity>/i) || [])[1]) || 1;
      const lineTotal = parseAmount((block.match(/<cbc:LineExtensionAmount[^>]*>([^<]+)<\/cbc:LineExtensionAmount>/i) || [])[1]) || 0;
      const unitPrice = parseAmount((block.match(/<cac:Price>\s*<cbc:PriceAmount[^>]*>([^<]+)<\/cbc:PriceAmount>/i) || [])[1]) || round2(lineTotal / (qty || 1));
      const taxRate = parseAmount((block.match(/<cbc:Percent[^>]*>([^<]+)<\/cbc:Percent>/i) || [])[1]) || 20;
      items.push({ name: name.trim(), qty, unitPrice, taxRate, lineTotal });
    }
    return {
      template: "earsiv-fatura",
      vendor,
      invoiceNo,
      issueDate,
      dueDate,
      currency: detectCurrency(rawText),
      items,
      subtotal: subtotal != null ? subtotal : round2(items.reduce((s, x) => s + x.lineTotal, 0)),
      taxTotal: taxTotal != null ? taxTotal : 0,
      grandTotal: grandTotal != null ? grandTotal : 0,
    };
  }

  function extractLineItems(lines) {
    const items = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || /^(ara toplam|mal hizmet|toplam kdv|hesaplanan kdv|genel toplam|ödenecek tutar|vergiler dahil)/i.test(line)) continue;
      // Kalıp 1: "- Kalem adı | 2 Adet x 1.500,00 TL | KDV %20 | 3.000,00 TL" veya tablo satırı
      let m = line.match(/^(?:[-•*]|\d+[.)])?\s*([^|:\t]{3,80}?)\s*(?:\||—|-|:)\s*(\d+(?:[.,]\d+)?)\s*(?:adet|saat|ay|gün|paket|x|\*)?\s*(?:x|\*)?\s*([\d.,]+)\s*(?:TL|TRY|USD|EUR|₺|\$|€)?(?:.*?(?:KDV\s*%?\s*(\d{1,2})))?.*?(?:=|\||:)\s*([\d.,]+)\s*(?:TL|TRY|USD|EUR|₺|\$|€)?$/i);
      if (m) {
        const qty = parseAmount(m[2]) || 1;
        const unitPrice = parseAmount(m[3]) || 0;
        const taxRate = m[4] ? Number(m[4]) : 20;
        const lineTotal = parseAmount(m[5]);
        if (lineTotal != null && lineTotal > 0) {
          items.push({ name: m[1].trim(), qty, unitPrice: unitPrice || round2(lineTotal / qty), taxRate, lineTotal });
          continue;
        }
      }
      // Kalıp 2: "- Kalem adı (2 Adet x 750,00 TL, KDV %20): 1.500,00 TL" veya "- Kalem adı: 1.500,00 TL"
      m = line.match(/^(?:[-•*]|\d+[.)])\s*([^:()]{3,80}?)(?:\s*\((\d+(?:[.,]\d+)?)\s*(?:adet|saat|ay|gün|paket)?\s*[x*]\s*([\d.,]+)[^)]*\))?(?:\s*\[KDV\s*%(\d{1,2})\])?\s*[:|]\s*([\d.,]+)\s*(?:TL|TRY|USD|EUR|₺|\$|€)?$/i);
      if (m) {
        const qty = parseAmount(m[2]) || 1;
        const lineTotal = parseAmount(m[5]);
        const unitPrice = parseAmount(m[3]) || (lineTotal != null ? round2(lineTotal / qty) : 0);
        const taxRate = m[4] ? Number(m[4]) : 20;
        if (lineTotal != null && lineTotal > 0) {
          items.push({ name: m[1].trim(), qty, unitPrice, taxRate, lineTotal });
        }
      }
    }
    return items;
  }

  function checkConsistency(doc) {
    const reasons = [];
    const items = Array.isArray(doc.items) ? doc.items : [];
    const itemsSum = round2(items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0));
    const subtotal = round2(doc.subtotal);
    const taxTotal = round2(doc.taxTotal);
    const grandTotal = round2(doc.grandTotal);
    const computedGrand = round2(subtotal + taxTotal);

    const itemsMatch = items.length === 0 || Math.abs(itemsSum - subtotal) <= 0.02;
    const totalMatch = grandTotal > 0 && Math.abs(computedGrand - grandTotal) <= 0.02;

    if (!doc.vendor || !String(doc.vendor).trim()) reasons.push("Satıcı unvanı bulunamadı");
    if (!doc.invoiceNo || !String(doc.invoiceNo).trim()) reasons.push("Fatura / fiş numarası belirsiz");
    if (!doc.issueDate) reasons.push("Düzenleme tarihi bulunamadı");
    if (!doc.dueDate) reasons.push("Son ödeme tarihi belirsiz (kontrol edin)");
    if (doc.template === "belirsiz") reasons.push("Belge şablonu tanınmadı");
    if (grandTotal <= 0) reasons.push("Genel toplam sıfır veya okunamadı");
    if (!itemsMatch) {
      reasons.push(`Kalemler toplamı (${itemsSum.toFixed(2)}) ara toplamla (${subtotal.toFixed(2)}) uyuşmuyor`);
    }
    if (grandTotal > 0 && !totalMatch) {
      reasons.push(`Ara toplam + KDV (${computedGrand.toFixed(2)}) genel toplamla (${grandTotal.toFixed(2)}) uyuşmuyor`);
    }

    return {
      itemsSum,
      computedGrand,
      itemsMatch,
      totalMatch,
      deterministicOk: itemsMatch && totalMatch && grandTotal > 0,
      needsReview: reasons.length > 0,
      reasons,
    };
  }

  function parseInvoice(rawInput, meta = {}) {
    const settings = normalizeSettings(meta.settings);
    const red = redactIdentity(rawInput, settings.redactIdentity);
    const textToParse = red.text;

    const xmlParsed = parseUblXml(textToParse);
    let base;
    if (xmlParsed) {
      base = xmlParsed;
    } else {
      const clean = stripMarkup(textToParse);
      const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const template = detectTemplate(clean);
      const currency = detectCurrency(clean);

      const findVal = (patterns) => {
        for (const l of lines) {
          for (const re of patterns) {
            const m = l.match(re);
            if (m && m[1]) return m[1].trim();
          }
        }
        return "";
      };

      const vendor = findVal([
        /^(?:sat[ıiIİ]c[ıiIİ]|tedarik[çcÇC][ıiIİ]|firma|[iİıI][şsŞS]letme|unvan|sat[ıiIİ]c[ıiIİ]\s*unvan[ıiIİ]|d[üuÜU]zenleyen)\s*[:|-]\s*(.+)$/i,
      ]);
      const invoiceNo = findVal([
        /^(?:fatura\s*no|fatura\s*numaras[ıiIİ]|belge\s*no|fi[şsŞS]\s*no|makbuz\s*no)\s*[:|-]\s*([A-Za-z0-9-_./]+)/i,
        /\b((?:GIB|EAR|EFT|FAT|FIS|MKZ)20\d{2}[A-Za-z0-9-]+)\b/i,
      ]);
      const issueDateRaw = findVal([
        /^(?:fatura\s*tarihi|d[üuÜU]zenleme\s*tarihi|belge\s*tarihi|fi[şsŞS]\s*tarihi|tarih)\s*[:|-]\s*(.+)$/i,
      ]);
      const dueDateRaw = findVal([
        /^(?:son\s*[öoÖO]deme\s*tarihi|vade\s*tarihi|vade|[öoÖO]deme\s*vadesi)\s*[:|-]\s*(.+)$/i,
      ]);

      const issueDate = parseDateStr(issueDateRaw);
      const dueDate = parseDateStr(dueDateRaw);

      const items = extractLineItems(lines);
      const subRaw = findVal([
        /^(?:ara\s*toplam|mal\s*hizmet\s*toplam\s*tutar[ıiIİ]|mal\/hizmet\s*toplam[ıiIİ]|matrah|kdv\s*hari[çcÇC]\s*tutar)\s*[:|-]\s*(.+)$/i,
      ]);
      const taxRaw = findVal([
        /^(?:hesaplanan\s*kdv(?:\s*\(%\d+\))?|toplam\s*kdv|kdv\s*tutar[ıiIİ]|kdv\s*toplam[ıiIİ]|vergi\s*tutar[ıiIİ]|kdv)\s*[:|-]\s*(.+)$/i,
      ]);
      const grandRaw = findVal([
        /^(?:[öoÖO]denecek\s*tutar|vergiler\s*dahil\s*toplam\s*tutar|genel\s*toplam|toplam\s*tutar|toplam)\s*[:|-]\s*(.+)$/i,
      ]);

      const itemsSum = round2(items.reduce((s, it) => s + it.lineTotal, 0));
      const subtotal = parseAmount(subRaw) != null ? parseAmount(subRaw) : itemsSum;
      const taxTotal = parseAmount(taxRaw) != null ? parseAmount(taxRaw) : 0;
      const grandTotal = parseAmount(grandRaw) != null ? parseAmount(grandRaw) : 0;

      base = {
        template,
        vendor,
        invoiceNo,
        issueDate,
        dueDate,
        currency,
        items,
        subtotal,
        taxTotal,
        grandTotal,
      };
    }

    const doc = {
      id: str(meta.id, 64) || "inv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      sampleKey: str(meta.sampleKey, 64) || "",
      sourceTitle: str(meta.sourceTitle || base.invoiceNo || "Belge", 200),
      sourceType: str(meta.sourceType || "metin", 40),
      rawText: red.text,
      redactedCount: red.redactedTotal,
      redactedBreakdown: red.counts,
      template: TEMPLATES.includes(base.template) ? base.template : "belirsiz",
      vendor: str(base.vendor, 200),
      invoiceNo: str(base.invoiceNo, 80),
      issueDate: base.issueDate || "",
      dueDate: base.dueDate || "",
      currency: CURRENCIES.includes(base.currency) ? base.currency : "TRY",
      items: base.items.map((it) => ({
        name: str(it.name, 160),
        qty: round2(it.qty || 1),
        unitPrice: round2(it.unitPrice || 0),
        taxRate: Number.isFinite(Number(it.taxRate)) ? Number(it.taxRate) : 20,
        lineTotal: round2(it.lineTotal || 0),
      })),
      subtotal: round2(base.subtotal),
      taxTotal: round2(base.taxTotal),
      grandTotal: round2(base.grandTotal),
      status: "inceleme",
      reviewNote: "",
      mismatchConfirmed: false,
      edited: false,
      createdAt: meta.now ? new Date(meta.now).getTime() : Date.now(),
      approvedAt: 0,
      rejectedAt: 0,
      ai: null,
    };

    doc.consistency = checkConsistency(doc);
    return doc;
  }

  function updateInvoice(doc, patch = {}) {
    if ("vendor" in patch) doc.vendor = str(patch.vendor, 200).trim();
    if ("invoiceNo" in patch) doc.invoiceNo = str(patch.invoiceNo, 80).trim();
    if ("issueDate" in patch) doc.issueDate = parseDateStr(String(patch.issueDate)) || "";
    if ("dueDate" in patch) doc.dueDate = parseDateStr(String(patch.dueDate)) || "";
    if ("currency" in patch && CURRENCIES.includes(patch.currency)) doc.currency = patch.currency;
    if ("template" in patch && TEMPLATES.includes(patch.template)) doc.template = patch.template;
    if ("subtotal" in patch) {
      const v = parseAmount(patch.subtotal);
      if (v != null && v >= 0) doc.subtotal = v;
    }
    if ("taxTotal" in patch) {
      const v = parseAmount(patch.taxTotal);
      if (v != null && v >= 0) doc.taxTotal = v;
    }
    if ("grandTotal" in patch) {
      const v = parseAmount(patch.grandTotal);
      if (v != null && v >= 0) doc.grandTotal = v;
    }
    if ("reviewNote" in patch) doc.reviewNote = str(patch.reviewNote, 400).trim();
    if (Array.isArray(patch.items)) {
      doc.items = patch.items.map((it) => ({
        name: str(it.name, 160).trim() || "Kalem",
        qty: round2(it.qty || 1),
        unitPrice: round2(it.unitPrice || 0),
        taxRate: Number.isFinite(Number(it.taxRate)) ? Number(it.taxRate) : 20,
        lineTotal: round2(it.lineTotal != null ? it.lineTotal : (Number(it.qty || 1) * Number(it.unitPrice || 0))),
      }));
    }
    doc.edited = true;
    doc.consistency = checkConsistency(doc);
    return doc;
  }

  function approveInvoice(doc, patch = {}, nowMs = Date.now()) {
    if (patch && Object.keys(patch).length) updateInvoice(doc, patch);
    doc.consistency = checkConsistency(doc);
    if (!doc.vendor) throw new Error("Satıcı unvanı boş bırakılamaz. Lütfen inceleyip doldurun.");
    if (!doc.issueDate) throw new Error("Düzenleme tarihi boş bırakılamaz (YYYY-AA-GG).");
    if (doc.grandTotal <= 0) throw new Error("Genel toplam 0'dan büyük olmalıdır.");
    if (doc.consistency.needsReview) {
      const allowOverride = Boolean(patch && patch.confirmMismatch) && Boolean(doc.reviewNote || (patch && patch.reviewNote));
      if (!allowOverride) {
        throw new Error("Belgede belirsiz veya tutarsız alan var (" + doc.consistency.reasons.join("; ") + "). Rakamları düzeltin ya da inceleme notu yazıp 'Tutarsızlığı inceledim, yine de onayla' kutusunu işaretleyin.");
      }
      doc.mismatchConfirmed = true;
    } else {
      doc.mismatchConfirmed = false;
    }
    doc.status = "onayli";
    doc.approvedAt = nowMs;
    doc.rejectedAt = 0;
    return doc;
  }

  function csvSafeCell(val) {
    let s = String(val == null ? "" : val).replace(/\r?\n/g, " ").trim();
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    if (/[",;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exportCsv(docs) {
    const approved = (Array.isArray(docs) ? docs : []).filter((d) => d.status === "onayli");
    const header = [
      "Fatura No",
      "Satıcı",
      "Düzenleme Tarihi",
      "Son Ödeme Tarihi",
      "Para Birimi",
      "Ara Toplam",
      "KDV",
      "Genel Toplam",
      "Şablon",
      "Tutarlılık",
      "İnceleme Notu",
    ];
    const rows = [header.join(",")];
    for (const d of approved) {
      const c = d.consistency || checkConsistency(d);
      rows.push([
        csvSafeCell(d.invoiceNo),
        csvSafeCell(d.vendor),
        csvSafeCell(d.issueDate),
        csvSafeCell(d.dueDate),
        csvSafeCell(d.currency),
        csvSafeCell(d.subtotal.toFixed(2)),
        csvSafeCell(d.taxTotal.toFixed(2)),
        csvSafeCell(d.grandTotal.toFixed(2)),
        csvSafeCell(d.template),
        csvSafeCell(c.deterministicOk ? "Doğrulandı" : "İstisna Onaylı"),
        csvSafeCell(d.reviewNote),
      ].join(","));
    }
    return rows.join("\n") + "\n";
  }

  function exportMd(docs) {
    const list = Array.isArray(docs) ? docs : [];
    const approved = list.filter((d) => d.status === "onayli");
    const review = list.filter((d) => d.status === "inceleme");
    const lines = [
      "# Invoice Inbox — Fatura ve Fiş Özeti",
      "",
      `> İnsan onaylı belgeler: **${approved.length}** · İnceleme bekleyen: **${review.length}** · Otomatik beyanname/muhasebe gönderimi: **Yok**`,
      "",
      "## Onaylanan Belgeler (Finansal Asistan Aktarım Listesi)",
      "",
      "| Fatura No | Satıcı | Düzenleme | Son Ödeme | Ara Toplam | KDV | Genel Toplam | Tutarlılık |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ];
    for (const d of approved) {
      const c = d.consistency || checkConsistency(d);
      lines.push(
        `| ${d.invoiceNo || "-"} | ${d.vendor} | ${d.issueDate} | ${d.dueDate || "-"} | ${d.subtotal.toFixed(2)} ${d.currency} | ${d.taxTotal.toFixed(2)} ${d.currency} | **${d.grandTotal.toFixed(2)} ${d.currency}** | ${c.deterministicOk ? "Tam tutarlı" : "İstisna (" + d.reviewNote + ")"} |`
      );
    }
    if (review.length) {
      lines.push("", "## İnceleme Bekleyen Taslaklar", "");
      for (const d of review) {
        const c = d.consistency || checkConsistency(d);
        lines.push(`- **${d.vendor || d.sourceTitle}** (${d.invoiceNo || "No yok"}) — Toplam: ${d.grandTotal.toFixed(2)} ${d.currency} · Uyarılar: ${c.reasons.join(", ") || "İnsan onayı bekliyor"}`);
      }
    }
    return lines.join("\n") + "\n";
  }

  function evaluateGold(docs, goldMap) {
    if (!goldMap || typeof goldMap !== "object") return null;
    const keys = Object.keys(goldMap);
    if (!keys.length) return null;
    let totalMatched = 0;
    let dateMatched = 0;
    let mismatchCaught = 0;
    let mismatchExpected = 0;
    let evaluated = 0;

    for (const k of keys) {
      const expected = goldMap[k];
      const found = (Array.isArray(docs) ? docs : []).find((d) => d.sampleKey === k);
      if (!found) continue;
      evaluated++;
      if (Math.abs(round2(found.grandTotal) - round2(expected.grandTotal)) <= 0.02 && Math.abs(round2(found.taxTotal) - round2(expected.taxTotal)) <= 0.02) {
        totalMatched++;
      }
      if (found.issueDate === expected.issueDate && found.dueDate === expected.dueDate) {
        dateMatched++;
      }
      if (expected.expectMismatch) {
        mismatchExpected++;
        if (found.consistency && !found.consistency.deterministicOk && found.consistency.needsReview) {
          mismatchCaught++;
        }
      }
    }
    if (!evaluated) return null;
    return {
      evaluated,
      totalAccuracy: Math.round((totalMatched / evaluated) * 100),
      dateAccuracy: Math.round((dateMatched / evaluated) * 100),
      mismatchCaught,
      mismatchExpected,
    };
  }

  function metrics(docs) {
    const list = Array.isArray(docs) ? docs : [];
    const review = list.filter((d) => d.status === "inceleme").length;
    const approved = list.filter((d) => d.status === "onayli").length;
    const rejected = list.filter((d) => d.status === "red").length;
    const mandatoryReview = list.filter((d) => d.status === "inceleme" && d.consistency && d.consistency.needsReview).length;
    const deterministicOkCount = list.filter((d) => d.consistency && d.consistency.deterministicOk).length;
    const redactedTotal = list.reduce((s, d) => s + (Number(d.redactedCount) || 0), 0);
    const approvedSumTry = round2(
      list.filter((d) => d.status === "onayli" && d.currency === "TRY").reduce((s, d) => s + d.grandTotal, 0)
    );
    return {
      total: list.length,
      review,
      approved,
      rejected,
      mandatoryReview,
      deterministicOkCount,
      redactedTotal,
      approvedSumTry,
    };
  }

  function aiPayload(doc) {
    const red = redactIdentity(doc.rawText || "", true);
    let snippet = stripMarkup(red.text);
    // E-posta ve telefonları da ⟦n⟧ ile maskele
    let maskCount = red.redactedTotal;
    snippet = snippet
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, () => {
        maskCount++;
        return `⟦eposta-${maskCount}⟧`;
      })
      .replace(/\b(?:\+?90|0)?\s*\(?5\d{2}\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}\b/g, () => {
        maskCount++;
        return `⟦tel-${maskCount}⟧`;
      });
    const truncated = snippet.length > AI_CONTEXT;
    const cleanText = snippet.slice(0, AI_CONTEXT);

    const messages = [
      {
        role: "system",
        content:
          "Sen fatura ve fiş alan çıkarım yardımcısısın. Belgedeki satıcı (vendor), faturaNo (invoiceNo), duzenlemeTarihi (YYYY-MM-DD), sonOdemeTarihi (YYYY-MM-DD), araToplam (sayı), kdv (sayı), genelToplam (sayı) ve not alanlarını JSON olarak döndür. Belgede olmayan değeri uydurma.",
      },
      {
        role: "user",
        content: cleanText,
      },
    ];

    return {
      messages,
      sent: {
        chars: cleanText.length,
        truncated,
        maskedCount: maskCount,
      },
    };
  }

  function validateAi(rawContent, doc) {
    const s = str(rawContent, 20000);
    const m = s.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let parsed;
    try {
      parsed = JSON.parse(m[0]);
    } catch {
      throw new Error("Model JSON yanıtı ayrıştırılamadı.");
    }
    const vendor = str(parsed.satici || parsed.vendor || doc.vendor, 200).trim();
    const invoiceNo = str(parsed.faturaNo || parsed.invoiceNo || doc.invoiceNo, 80).trim();
    const issueDate = parseDateStr(String(parsed.duzenlemeTarihi || parsed.issueDate || "")) || doc.issueDate;
    const dueDate = parseDateStr(String(parsed.sonOdemeTarihi || parsed.dueDate || "")) || doc.dueDate;
    const subtotal = parseAmount(parsed.araToplam != null ? parsed.araToplam : parsed.subtotal);
    const taxTotal = parseAmount(parsed.kdv != null ? parsed.kdv : parsed.taxTotal);
    const grandTotal = parseAmount(parsed.genelToplam != null ? parsed.genelToplam : parsed.grandTotal);
    const note = str(parsed.not || parsed.note || "", 300).trim();

    const candidate = {
      vendor,
      invoiceNo,
      issueDate,
      dueDate,
      subtotal: subtotal != null ? subtotal : doc.subtotal,
      taxTotal: taxTotal != null ? taxTotal : doc.taxTotal,
      grandTotal: grandTotal != null ? grandTotal : doc.grandTotal,
      note,
    };
    const check = checkConsistency({
      ...doc,
      ...candidate,
    });
    candidate.deterministicOk = check.deterministicOk;
    candidate.reasons = check.reasons;
    return candidate;
  }

  function isLoopbackUrl(u) {
    try {
      const x = new URL(u);
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch {
      return false;
    }
  }

  function normalizeSettings(s) {
    s = s && typeof s === "object" ? s : {};
    return {
      redactIdentity: s.redactIdentity !== false,
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? s.localUrl : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
      autoSubmitFiling: false, // Sabit güvenlik sınırı: hiçbir zaman otomatik beyanname/muhasebe göndermez
    };
  }

  function normalizeDocs(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_DOCS).map((d) => {
      const copy = {
        id: str(d.id, 64) || "inv-" + Math.random().toString(36).slice(2, 9),
        sampleKey: str(d.sampleKey, 64),
        sourceTitle: str(d.sourceTitle, 200),
        sourceType: str(d.sourceType || "metin", 40),
        rawText: str(d.rawText, MAX_DOC_CHARS),
        redactedCount: Number(d.redactedCount) || 0,
        redactedBreakdown: d.redactedBreakdown || { tckn: 0, iban: 0, card: 0 },
        template: TEMPLATES.includes(d.template) ? d.template : "belirsiz",
        vendor: str(d.vendor, 200),
        invoiceNo: str(d.invoiceNo, 80),
        issueDate: parseDateStr(String(d.issueDate || "")),
        dueDate: parseDateStr(String(d.dueDate || "")),
        currency: CURRENCIES.includes(d.currency) ? d.currency : "TRY",
        items: Array.isArray(d.items)
          ? d.items.map((it) => ({
              name: str(it.name, 160),
              qty: round2(it.qty || 1),
              unitPrice: round2(it.unitPrice || 0),
              taxRate: Number(it.taxRate) || 20,
              lineTotal: round2(it.lineTotal || 0),
            }))
          : [],
        subtotal: round2(d.subtotal),
        taxTotal: round2(d.taxTotal),
        grandTotal: round2(d.grandTotal),
        status: ["inceleme", "onayli", "red"].includes(d.status) ? d.status : "inceleme",
        reviewNote: str(d.reviewNote, 400),
        mismatchConfirmed: Boolean(d.mismatchConfirmed),
        edited: Boolean(d.edited),
        createdAt: Number(d.createdAt) || Date.now(),
        approvedAt: Number(d.approvedAt) || 0,
        rejectedAt: Number(d.rejectedAt) || 0,
        ai: d.ai || null,
      };
      copy.consistency = checkConsistency(copy);
      return copy;
    });
  }

  function normalizeCounters(c) {
    c = c && typeof c === "object" ? c : {};
    return {
      imported: Number(c.imported) || 0,
      files: Number(c.files) || 0,
      clipboard: Number(c.clipboard) || 0,
      approved: Number(c.approved) || 0,
      exports: Number(c.exports) || 0,
      aiRuns: Number(c.aiRuns) || 0,
    };
  }

  return {
    MAX_DOC_CHARS,
    MAX_DOCS,
    AI_CONTEXT,
    TEMPLATES,
    TEMPLATE_LABELS,
    CURRENCIES,
    str,
    round2,
    parseAmount,
    parseDateStr,
    stripMarkup,
    redactIdentity,
    detectTemplate,
    checkConsistency,
    parseInvoice,
    updateInvoice,
    approveInvoice,
    exportCsv,
    exportMd,
    evaluateGold,
    metrics,
    aiPayload,
    validateAi,
    isLoopbackUrl,
    normalizeSettings,
    normalizeDocs,
    normalizeCounters,
  };
});
