/* Access Lens (PL-043) — çekirdek (saf işlevler; Node testleri, ana süreç ve arayüz kullanır; ağ ve dosya erişimi yok).
 * Seçilen HTML/CSS kesitlerinde kontrast (WCAG 2.2 AA/AAA), form etiketi (label / aria-label), görsel alt metni, başlık sırası (h1–h6),
 * odak sırası (tabindex), düğme/bağlantı erişilebilir adı ve semantik bölgeleri denetler; sorun seçildiğinde ilgili öğeyi ve satır
 * numarasını gösterir.
 * Teknik bağımlılık ve sınırlar (Notion): standart sürümü (WCAG 2.2) ve kural motoru çıktısı açıkça görünür; otomatik denetim sonucu
 * erişilebilirlik sertifikası değildir — klavye ve ekran okuyucu manuel kontrolleri ayrıca gerekir.
 * Yapay zekâ (MyMind / yerel model): sorunu sade dille açıklar ve düzeltme taslağı önerir; otomatik puanı sertifika gibi sunmaz. */
(function (root) {
  "use strict";
  const ENGINE_VERSION = "AccessLens-Rules 1.0.0";
  const STANDARD_VERSION = "WCAG 2.2 (AA / AAA)";
  const CERTIFICATE_DISCLAIMER = "Otomatik denetim sonucu erişilebilirlik sertifikası değildir; klavye ve ekran okuyucu ile gerçek kullanıcı / manuel kontroller ayrıca gerekir.";
  const MAX_AUDITS = 500;
  const MAX_SOURCE = 120000;
  const CATEGORIES = ["kontrast", "etiket", "odak", "semantik"];
  const CATEGORY_NAMES = { kontrast: "Kontrast", etiket: "Etiket ve ad", odak: "Odak sırası", semantik: "Semantik yapı" };
  const SEVERITY_NAMES = { kritik: "Kritik", uyari: "Uyarı", bilgi: "Bilgi" };
  const ISSUE_STATUSES = ["acik", "cozuldu", "yanlis_olumlu"];
  const ISSUE_STATUS_NAMES = { acik: "Açık", cozuldu: "Çözüldü", yanlis_olumlu: "Yanlış olumlu" };

  const MANUAL_CHECKS = [
    { id: "kbd-reach", title: "Klavye ile tam erişim (Tab / Shift+Tab)", wcag: "2.1.1 Klavye (A)", desc: "Fare kullanmadan tüm etkileşimli öğelere ulaşılabiliyor ve odak tuzağı oluşmuyor mu?" },
    { id: "kbd-focus-vis", title: "Görünür odak göstergesi", wcag: "2.4.7 Görünür Odak (AA)", desc: "Tab ile gezinirken aktif öğenin odak halkası her zeminde net görünüyor mu?" },
    { id: "sr-announce", title: "Ekran okuyucu (NVDA / VoiceOver) okuma sırası ve roller", wcag: "4.1.2 Ad, Rol, Değer (A)", desc: "Ekran okuyucu form etiketlerini, düğme durumlarını ve dinamik bildirimleri doğru okuyor mu?" },
    { id: "zoom-reflow", title: "%200 metin büyütme ve 320 CSS px yeniden akış", wcag: "1.4.4 / 1.4.10 Yeniden Akış (AA)", desc: "Sayfa %200 büyütüldüğünde yatay kaydırma olmadan içerik okunabiliyor mu?" },
  ];

  const RULES = [
    { id: "WCAG-1.4.3-CONTRAST-AA", wcag: "1.4.3 Kontrast (Asgari) — AA", category: "kontrast", severity: "kritik", title: "Metin ile arka plan kontrastı AA eşiğinin altında" },
    { id: "WCAG-1.4.6-CONTRAST-AAA", wcag: "1.4.6 Kontrast (Gelişmiş) — AAA", category: "kontrast", severity: "uyari", title: "Metin kontrastı AA'yı geçiyor ancak AAA (7:1 / 4.5:1) altında" },
    { id: "WCAG-1.1.1-IMG-ALT", wcag: "1.1.1 Metin Dışı İçerik — A", category: "etiket", severity: "kritik", title: "Görselde (img) alt özniteliği eksik" },
    { id: "WCAG-1.3.1-FORM-LABEL", wcag: "1.3.1 / 3.3.2 Etiket veya Talimatlar — A", category: "etiket", severity: "kritik", title: "Form alanında ilişkili label veya aria-label yok" },
    { id: "WCAG-4.1.2-BTN-NAME", wcag: "4.1.2 Ad, Rol, Değer — A", category: "etiket", severity: "kritik", title: "Düğmenin (button) erişilebilir adı boş" },
    { id: "WCAG-2.4.4-LINK-NAME", wcag: "2.4.4 Bağlantı Amacı — A", category: "etiket", severity: "kritik", title: "Bağlantının (a) erişilebilir adı boş veya belirsiz" },
    { id: "WCAG-2.4.3-TABINDEX-POS", wcag: "2.4.3 Odak Sırası — A", category: "odak", severity: "uyari", title: "Pozitif tabindex doğal odak sırasını bozuyor" },
    { id: "WCAG-2.1.1-INTERACTIVE-FOCUS", wcag: "2.1.1 Klavye — A", category: "odak", severity: "kritik", title: "Tıklanabilir div/span klavye odağı ve rolünden yoksun" },
    { id: "WCAG-2.4.7-OUTLINE-NONE", wcag: "2.4.7 Görünür Odak — AA", category: "odak", severity: "uyari", title: "Odak göstergesi (outline: none/0) alternatif olmadan kaldırılmış" },
    { id: "WCAG-1.3.1-HEADING-SKIP", wcag: "1.3.1 Bilgi ve İlişkiler — A", category: "semantik", severity: "uyari", title: "Başlık düzeyi atlanmış (ör. h1 → h3)" },
    { id: "WCAG-3.1.1-HTML-LANG", wcag: "3.1.1 Sayfanın Dili — A", category: "semantik", severity: "kritik", title: "html kök öğesinde geçerli lang özniteliği eksik" },
    { id: "WCAG-1.3.1-MAIN-LANDMARK", wcag: "1.3.1 / 2.4.1 Ana Bölge — A", category: "semantik", severity: "uyari", title: "Sayfada <main> veya role='main' ana bölgesi bulunamadı" },
  ];

  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max || 10000);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const lowerTr = (s) => String(s).replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
  const fold = (s) => lowerTr(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u");
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

  function isWebUrl(u) {
    try { const x = new URL(String(u)); return (x.protocol === "http:" || x.protocol === "https:") && !x.username && !x.password; } catch { return false; }
  }
  function isLoopbackUrl(u) {
    try { const x = new URL(String(u)); return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password; } catch { return false; }
  }

  // ---------------- Renk ve WCAG 2.2 Kontrast ----------------
  const NAMED_COLORS = {
    white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0],
    gray: [128, 128, 128], grey: [128, 128, 128], silver: [192, 192, 192], yellow: [255, 255, 0], navy: [0, 0, 128],
  };
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function parseColor(raw) {
    if (!raw || typeof raw !== "string") return null;
    const s = raw.trim().toLowerCase();
    if (NAMED_COLORS[s]) return NAMED_COLORS[s].slice();
    let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) {
      const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(s);
    if (m) return [Math.min(255, Number(m[1])), Math.min(255, Number(m[2])), Math.min(255, Number(m[3]))];
    m = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(s);
    if (m) return hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
    return null;
  }
  function rgbToHex(rgb) {
    if (!Array.isArray(rgb) || rgb.length < 3) return "";
    return "#" + rgb.slice(0, 3).map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function relativeLuminance(rgb) {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrastRatio(fg, bg) {
    const c1 = typeof fg === "string" ? parseColor(fg) : fg;
    const c2 = typeof bg === "string" ? parseColor(bg) : bg;
    if (!c1 || !c2) return null;
    const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2);
    const bright = Math.max(l1, l2), dark = Math.min(l1, l2);
    return Math.round(((bright + 0.05) / (dark + 0.05)) * 100) / 100;
  }
  function suggestAccessibleColor(fg, bg, minRatio) {
    const c1 = typeof fg === "string" ? parseColor(fg) : fg;
    const c2 = typeof bg === "string" ? parseColor(bg) : bg;
    if (!c1 || !c2) return "#111827";
    const bgLum = relativeLuminance(c2);
    const targetDark = bgLum > 0.35;
    for (let step = 0; step <= 100; step++) {
      const f = step / 100;
      const cand = targetDark
        ? c1.map((v) => Math.round(v * (1 - f)))
        : c1.map((v) => Math.round(v + (255 - v) * f));
      if (contrastRatio(cand, c2) >= (minRatio || 4.5)) return rgbToHex(cand);
    }
    return targetDark ? "#000000" : "#ffffff";
  }

  // ---------------- HTML / CSS ayrıştırma ve denetim ----------------
  function lineOfIndex(text, idx) {
    let line = 1;
    for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
    return line;
  }
  function parseAttrs(attrStr) {
    const out = {};
    const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let m;
    while ((m = re.exec(attrStr || ""))) {
      const k = m[1].toLowerCase();
      const v = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : "";
      out[k] = v;
    }
    return out;
  }
  function parseInlineStyle(styleStr) {
    const map = {};
    for (const part of String(styleStr || "").split(";")) {
      const i = part.indexOf(":");
      if (i > 0) map[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
    }
    return map;
  }
  function isLargeText(styleMap, tag) {
    const fs = styleMap["font-size"] || "";
    const fw = (styleMap["font-weight"] || "").toLowerCase();
    const bold = fw === "bold" || Number(fw) >= 700 || /^h[1-3]$/.test(tag);
    let px = 0;
    const mPx = /([\d.]+)\s*px/i.exec(fs);
    const mPt = /([\d.]+)\s*pt/i.exec(fs);
    const mRem = /([\d.]+)\s*rem/i.exec(fs);
    if (mPx) px = Number(mPx[1]);
    else if (mPt) px = Number(mPt[1]) * (4 / 3);
    else if (mRem) px = Number(mRem[1]) * 16;
    else if (tag === "h1") px = 28;
    else if (tag === "h2") px = 24;
    if (px >= 24) return true;
    if (bold && px >= 18.66) return true;
    return false;
  }
  function stripTags(html) {
    return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  function selectorOf(tag, attrs, nth) {
    if (attrs.id) return `${tag}#${attrs.id}`;
    if (attrs.class) {
      const cls = attrs.class.trim().split(/\s+/).slice(0, 2).join(".");
      if (cls) return `${tag}.${cls}`;
    }
    if (attrs.name) return `${tag}[name="${attrs.name}"]`;
    return `${tag}:nth-of-type(${nth || 1})`;
  }

  /** HTML/CSS kaynağını denetler ve bulguları döndürür. */
  function auditSnippet(source, opts) {
    opts = opts || {};
    const raw = str(source, MAX_SOURCE);
    const level = opts.level === "AAA" ? "AAA" : "AA";
    const lines = raw.split(/\r?\n/);
    const issues = [];
    const tagCounts = {};
    const addIssue = (ruleId, line, selector, snippet, detail, fixDraft, meta) => {
      const rule = RULES.find((r) => r.id === ruleId) || RULES[0];
      issues.push({
        id: uid(),
        ruleId: rule.id,
        wcag: rule.wcag,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        line: Math.max(1, Math.min(lines.length || 1, Number(line) || 1)),
        selector: str(selector, 160),
        snippet: str(snippet, 300),
        detail: str(detail, 500),
        fixDraft: str(fixDraft, 500),
        status: "acik",
        meta: meta || {},
        ai: null,
      });
    };

    // 1) <html lang="..."> kontrolü (tam belge ise)
    const htmlMatch = /<html\b([^>]*)>/i.exec(raw);
    if (htmlMatch) {
      const attrs = parseAttrs(htmlMatch[1]);
      if (!attrs.lang || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(attrs.lang.trim())) {
        addIssue(
          "WCAG-3.1.1-HTML-LANG",
          lineOfIndex(raw, htmlMatch.index),
          "html",
          htmlMatch[0],
          "Sayfa kök öğesinde ekran okuyucunun doğru ses sentezleyiciyi seçmesi için geçerli bir lang özniteliği yok.",
          '<html lang="tr">'
        );
      }
    }

    // 2) <main> veya role="main" kontrolü (<html veya <body içeren tam sayfa kesitlerinde)
    if ((/<html\b|<body\b|<header\b/i.test(raw)) && !/<main\b|role\s*=\s*["']main["']/i.test(raw)) {
      const bodyMatch = /<body\b[^>]*>/i.exec(raw) || htmlMatch;
      const ln = bodyMatch ? lineOfIndex(raw, bodyMatch.index) : 1;
      addIssue(
        "WCAG-1.3.1-MAIN-LANDMARK",
        ln,
        "body",
        bodyMatch ? bodyMatch[0] : "<body>",
        "Tam sayfa yapısında ana içerik bölgesi (<main> veya role=\"main\") tanımlanmamış; ekran okuyucu kullanıcıları ana içeriğe doğrudan atlayamaz.",
        "<main id=\"ana-icerik\">\n  <!-- Sayfa ana içeriği -->\n</main>"
      );
    }

    // Etiket eşlemeleri: <label for="id">...
    const labelForSet = new Set();
    const labelForRe = /<label\b([^>]*)>([\s\S]*?)<\/label>/gi;
    let lm;
    while ((lm = labelForRe.exec(raw))) {
      const a = parseAttrs(lm[1]);
      if (a.for && stripTags(lm[2])) labelForSet.add(a.for.trim());
    }

    // Kapsayıcı <label>...<input ...>...</label> aralıkları
    const labelRanges = [];
    labelForRe.lastIndex = 0;
    while ((lm = labelForRe.exec(raw))) {
      if (stripTags(lm[2])) labelRanges.push([lm.index, lm.index + lm[0].length]);
    }
    const insideLabel = (idx) => labelRanges.some(([s, e]) => idx >= s && idx <= e);

    // 3) Öğeleri tara
    const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g;
    let tm;
    let lastHeading = 0;
    while ((tm = tagRe.exec(raw))) {
      const tag = tm[1].toLowerCase();
      const attrRaw = tm[2] || "";
      const attrs = parseAttrs(attrRaw);
      if (attrs["aria-hidden"] === "true") continue;
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      const nth = tagCounts[tag];
      const line = lineOfIndex(raw, tm.index);
      const sel = selectorOf(tag, attrs, nth);
      const openTag = tm[0];

      // Kapama etiketine kadar iç metin (varsa)
      let innerHtml = "";
      let fullElement = openTag;
      if (!openTag.endsWith("/>") && !["img", "input", "br", "hr", "meta", "link"].includes(tag)) {
        const closeRe = new RegExp(`</${tag}\\s*>`, "i");
        const rest = raw.slice(tm.index + openTag.length);
        const cm = closeRe.exec(rest);
        if (cm && cm.index < 2000) {
          innerHtml = rest.slice(0, cm.index);
          fullElement = raw.slice(tm.index, tm.index + openTag.length + cm.index + cm[0].length);
        }
      }

      // Görsel alt kontrolü
      if (tag === "img") {
        const hasAlt = Object.prototype.hasOwnProperty.call(attrs, "alt");
        const rolePres = attrs.role === "presentation" || attrs.role === "none";
        if (!hasAlt && !rolePres && !attrs["aria-label"]) {
          const srcName = (attrs.src || "gorsel").split("/").pop();
          addIssue(
            "WCAG-1.1.1-IMG-ALT",
            line,
            sel,
            openTag,
            `Görsel öğesinde (${srcName}) alt özniteliği bulunmuyor. Bilgilendirici görsellerde açıklama, dekoratif görsellerde alt="" kullanılmalıdır.`,
            openTag.replace(/\/?>$/, ' alt="Görsel açıklaması">')
          );
        }
      }

      // Form alanı etiket kontrolü
      if (["input", "select", "textarea"].includes(tag)) {
        const type = (attrs.type || "text").toLowerCase();
        if (!["hidden", "submit", "reset", "button", "image"].includes(type)) {
          const hasLabel = (attrs.id && labelForSet.has(attrs.id)) || insideLabel(tm.index) || !!(attrs["aria-label"] && attrs["aria-label"].trim()) || !!(attrs["aria-labelledby"] && attrs["aria-labelledby"].trim());
          if (!hasLabel) {
            const idSug = attrs.id || attrs.name || "alan-" + nth;
            const labelHint = attrs.placeholder || idSug;
            addIssue(
              "WCAG-1.3.1-FORM-LABEL",
              line,
              sel,
              openTag,
              `Form kontrolünde (${tag}${attrs.placeholder ? ', placeholder="' + attrs.placeholder + '"' : ""}) ilişkili bir <label for="..."> veya aria-label yok; yalnız placeholder etiket yerine geçmez.`,
              `<label for="${idSug}">${labelHint}</label>\n${openTag.includes("id=") ? openTag : openTag.replace(new RegExp("^<" + tag, "i"), `<${tag} id="${idSug}"`)}`
            );
          }
        }
      }

      // Düğme erişilebilir adı
      if (tag === "button") {
        const text = stripTags(innerHtml);
        const imgAlt = /<img\b[^>]*\balt\s*=\s*["']([^"']+)["']/i.exec(innerHtml);
        const accName = text || (attrs["aria-label"] || "").trim() || (attrs["aria-labelledby"] || "").trim() || (imgAlt ? imgAlt[1].trim() : "") || (attrs.title || "").trim();
        if (!accName) {
          addIssue(
            "WCAG-4.1.2-BTN-NAME",
            line,
            sel,
            fullElement.slice(0, 180),
            "Düğmenin içinde metin veya aria-label bulunmuyor; ekran okuyucu yalnızca 'düğme' diyerek amacını açıklayamaz.",
            openTag.replace(/>$/, ' aria-label="Eylem açıklaması">') + innerHtml + "</button>"
          );
        }
      }

      // Bağlantı erişilebilir adı
      if (tag === "a" && Object.prototype.hasOwnProperty.call(attrs, "href")) {
        const text = stripTags(innerHtml);
        const imgAlt = /<img\b[^>]*\balt\s*=\s*["']([^"']+)["']/i.exec(innerHtml);
        const accName = text || (attrs["aria-label"] || "").trim() || (imgAlt ? imgAlt[1].trim() : "");
        const vague = /^(tıklayın|tiklayin|buraya|link|daha fazla|devamı|click here|more|here)$/i.test(accName);
        if (!accName || vague) {
          addIssue(
            "WCAG-2.4.4-LINK-NAME",
            line,
            sel,
            fullElement.slice(0, 180),
            !accName ? "Bağlantının (a) okunabilir metni veya aria-label özniteliği boş." : `Bağlantı metni ("${accName}") bağlam dışında hedefini açıklamıyor.`,
            openTag.replace(/>$/, ' aria-label="Hedef sayfa açıklaması">') + (accName || "Detaylı raporu görüntüle") + "</a>"
          );
        }
      }

      // Pozitif tabindex kontrolü
      if (attrs.tabindex != null && Number(attrs.tabindex) > 0) {
        addIssue(
          "WCAG-2.4.3-TABINDEX-POS",
          line,
          sel,
          openTag,
          `tabindex="${attrs.tabindex}" kullanılmış. Pozitif tabindex değerleri DOM sırasıyla görsel odak sırasını koparır.`,
          openTag.replace(/tabindex\s*=\s*["']?\d+["']?/i, 'tabindex="0"')
        );
      }

      // Tıklanabilir div/span kontrolü
      if ((tag === "div" || tag === "span") && (Object.prototype.hasOwnProperty.call(attrs, "onclick") || Object.prototype.hasOwnProperty.call(attrs, "@click") || /btn|button|clickable/i.test(attrs["data-action"] || ""))) {
        const hasRole = !!(attrs.role && ["button", "link", "menuitem", "tab", "checkbox", "switch"].includes(attrs.role));
        const hasTab = attrs.tabindex === "0" || attrs.tabindex === "-1";
        if (!hasRole || !hasTab) {
          addIssue(
            "WCAG-2.1.1-INTERACTIVE-FOCUS",
            line,
            sel,
            fullElement.slice(0, 180),
            `<${tag}> öğesine tıklama davranışı verilmiş ancak klavye odağı (tabindex="0") ve semantik rol (role="button") eksik.`,
            `<button type="button"${attrs.class ? ` class="${attrs.class}"` : ""}>${stripTags(innerHtml) || "Eylem"}</button>`
          );
        }
      }

      // Başlık hiyerarşisi (h1..h6)
      if (/^h([1-6])$/.test(tag)) {
        const lvl = Number(tag[1]);
        if (lastHeading > 0 && lvl > lastHeading + 1) {
          const expected = "h" + (lastHeading + 1);
          addIssue(
            "WCAG-1.3.1-HEADING-SKIP",
            line,
            sel,
            fullElement.slice(0, 180),
            `Başlık düzeyi <h${lastHeading}> sonrası doğrudan <h${lvl}> olarak atlanmış; belge ana hattı kesintiye uğruyor.`,
            fullElement.replace(new RegExp(`^<h${lvl}`, "i"), `<${expected}`).replace(new RegExp(`</h${lvl}>$`, "i"), `</${expected}>`)
          );
        }
        lastHeading = lvl;
      }

      // Satır içi (inline) stil kontrast ve outline kontrolü
      if (attrs.style) {
        const st = parseInlineStyle(attrs.style);
        const fg = st.color;
        const bg = st["background-color"] || st.background;
        if (fg && bg) {
          const ratio = contrastRatio(fg, bg);
          if (ratio != null) {
            const large = isLargeText(st, tag);
            const minAA = large ? 3.0 : 4.5;
            const minAAA = large ? 4.5 : 7.0;
            if (ratio < minAA) {
              const sug = suggestAccessibleColor(fg, bg, minAA);
              addIssue(
                "WCAG-1.4.3-CONTRAST-AA",
                line,
                sel,
                fullElement.slice(0, 180),
                `Ön plan (${fg}) ve arka plan (${bg}) kontrast oranı ${ratio}:1 — ${large ? "büyük metin" : "normal metin"} için WCAG AA asgari oranı ${minAA}:1.`,
                openTag.replace(st.color, sug),
                { fg, bg, ratio, required: minAA, suggestedFg: sug }
              );
            } else if (level === "AAA" && ratio < minAAA) {
              const sug = suggestAccessibleColor(fg, bg, minAAA);
              addIssue(
                "WCAG-1.4.6-CONTRAST-AAA",
                line,
                sel,
                fullElement.slice(0, 180),
                `Ön plan (${fg}) ve arka plan (${bg}) kontrast oranı ${ratio}:1 — AA geçer ancak AAA hedefi ${minAAA}:1 altındadır.`,
                openTag.replace(st.color, sug),
                { fg, bg, ratio, required: minAAA, suggestedFg: sug }
              );
            }
          }
        }
        if ((st.outline === "none" || st.outline === "0") && !st["box-shadow"] && !st["border-color"]) {
          addIssue(
            "WCAG-2.4.7-OUTLINE-NONE",
            line,
            sel,
            openTag,
            "Öğede outline: none/0 ile klavye odak halkası alternatif vurgu olmadan kapatılmış.",
            openTag.replace(/outline\s*:\s*(?:none|0)\s*;?/i, "outline: 2px solid #7c6cff; outline-offset: 2px;")
          );
        }
      }
    }

    // 4) CSS kurallarında kontrast ve :focus outline kontrolü (<style> blokları veya doğrudan CSS)
    const cssSources = [];
    const styleTagRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let sm;
    while ((sm = styleTagRe.exec(raw))) {
      cssSources.push({ text: sm[1], offset: sm.index + sm[0].indexOf(sm[1]) });
    }
    if (!cssSources.length && !/<[a-zA-Z]/.test(raw)) cssSources.push({ text: raw, offset: 0 });
    for (const cs of cssSources) {
      const cssBlockRe = /([^{};]+)\{([^{}]+)\}/g;
      let cm;
      while ((cm = cssBlockRe.exec(cs.text))) {
        const rawSel = cm[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
        if (!rawSel || rawSel.startsWith("@") || /<|>/.test(rawSel)) continue;
        const sel = rawSel.split("\n").pop().trim();
        const st = parseInlineStyle(cm[2]);
        const line = lineOfIndex(raw, cs.offset + cm.index);
        const snippet = `${sel} { ${cm[2].trim().replace(/\s+/g, " ")} }`;
        if (st.color && (st["background-color"] || st.background)) {
          const fg = st.color, bg = st["background-color"] || st.background;
          const ratio = contrastRatio(fg, bg);
          if (ratio != null) {
            const large = isLargeText(st, sel);
            const minAA = large ? 3.0 : 4.5;
            const minAAA = large ? 4.5 : 7.0;
            if (ratio < minAA) {
              const sug = suggestAccessibleColor(fg, bg, minAA);
              addIssue(
                "WCAG-1.4.3-CONTRAST-AA",
                line,
                sel,
                snippet,
                `CSS kuralında (${sel}) ön plan (${fg}) ve arka plan (${bg}) kontrastı ${ratio}:1 (AA eşiği ${minAA}:1).`,
                `${sel} { color: ${sug}; background-color: ${bg}; }`,
                { fg, bg, ratio, required: minAA, suggestedFg: sug }
              );
            } else if (level === "AAA" && ratio < minAAA) {
              const sug = suggestAccessibleColor(fg, bg, minAAA);
              addIssue(
                "WCAG-1.4.6-CONTRAST-AAA",
                line,
                sel,
                snippet,
                `CSS kuralında (${sel}) kontrast ${ratio}:1 (AAA eşiği ${minAAA}:1).`,
                `${sel} { color: ${sug}; background-color: ${bg}; }`,
                { fg, bg, ratio, required: minAAA, suggestedFg: sug }
              );
            }
          }
        }
        if ((st.outline === "none" || st.outline === "0") && !st["box-shadow"] && !st.border) {
          addIssue(
            "WCAG-2.4.7-OUTLINE-NONE",
            line,
            sel,
            snippet,
            `CSS kuralında (${sel}) outline: none/0 kullanılmış ve görünür bir odak alternatifi (box-shadow/border) tanımlanmamış.`,
            `${sel}:focus-visible { outline: 2px solid #7c6cff; outline-offset: 2px; }`
          );
        }
      }
    }

    return {
      id: opts.id || uid(),
      title: str(opts.title || "İsimsiz kesit", 200),
      url: isWebUrl(opts.url) ? String(opts.url).trim() : "",
      source: raw,
      level,
      engineVersion: ENGINE_VERSION,
      standardVersion: STANDARD_VERSION,
      certificateDisclaimer: CERTIFICATE_DISCLAIMER,
      createdAt: opts.at || new Date().toISOString(),
      sampleKey: str(opts.sampleKey || "", 40),
      manualChecks: MANUAL_CHECKS.map((m) => ({ id: m.id, done: false })),
      issues,
    };
  }

  // ---------------- Doğrulama ölçütü (Bilinen fixture'larda kural doğruluğu ve kritik yanlış olumlu <%5) ----------------
  function evaluateFixtures(audits, goldFixtures) {
    if (!Array.isArray(goldFixtures) || !goldFixtures.length) return null;
    let expectedTotal = 0, matched = 0, falsePositives = 0, criticalFalsePositives = 0, totalFindings = 0;
    for (const g of goldFixtures) {
      const a = (audits || []).find((x) => x.sampleKey === g.key);
      if (!a) continue;
      const foundIds = a.issues.map((i) => i.ruleId);
      totalFindings += foundIds.length;
      const exp = g.expectedRules.slice();
      expectedTotal += exp.length;
      const remaining = foundIds.slice();
      for (const r of exp) {
        const idx = remaining.indexOf(r);
        if (idx >= 0) { matched++; remaining.splice(idx, 1); }
      }
      for (const extra of remaining) {
        falsePositives++;
        const rule = RULES.find((r) => r.id === extra);
        if (!rule || rule.severity === "kritik") criticalFalsePositives++;
      }
    }
    return {
      fixtures: goldFixtures.length,
      expectedTotal,
      matched,
      recall: pct(matched, expectedTotal) ?? 100,
      totalFindings,
      falsePositives,
      criticalFalsePositives,
      criticalFpRate: totalFindings ? pct(criticalFalsePositives, totalFindings) : 0,
    };
  }

  function metrics(audits) {
    const list = Array.isArray(audits) ? audits : [];
    let totalIssues = 0, openIssues = 0, resolvedIssues = 0, falsePositiveMarked = 0, criticalTotal = 0, criticalFpMarked = 0;
    const byCategory = { kontrast: 0, etiket: 0, odak: 0, semantik: 0 };
    let manualDone = 0, manualTotal = 0;
    for (const a of list) {
      for (const m of a.manualChecks || []) { manualTotal++; if (m.done) manualDone++; }
      for (const it of a.issues || []) {
        totalIssues++;
        if (byCategory[it.category] != null) byCategory[it.category]++;
        if (it.severity === "kritik") criticalTotal++;
        if (it.status === "cozuldu") resolvedIssues++;
        else if (it.status === "yanlis_olumlu") {
          falsePositiveMarked++;
          if (it.severity === "kritik") criticalFpMarked++;
        } else openIssues++;
      }
    }
    return {
      audits: list.length,
      totalIssues,
      openIssues,
      resolvedIssues,
      falsePositiveMarked,
      criticalTotal,
      criticalFpMarked,
      criticalFpRate: totalIssues ? pct(criticalFpMarked, totalIssues) : 0,
      byCategory,
      manualDone,
      manualTotal,
      engineVersion: ENGINE_VERSION,
      standardVersion: STANDARD_VERSION,
    };
  }

  // ---------------- Hassas veri maskeleme ve Yapay Zekâ (MyMind / yerel model) ----------------
  function maskSecrets(text) {
    let count = 0;
    const out = String(text || "")
      .replace(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}/gu, () => { count++; return "⟦eposta⟧"; })
      .replace(/\b(?:https?:\/\/)[^\s"'<>]+/gi, () => { count++; return "⟦baglanti⟧"; })
      .replace(/(?:api[_-]?key|token|secret|password|parola)\s*[:=]\s*["']?[A-Za-z0-9._-]{8,}["']?/gi, () => { count++; return "⟦gizli⟧"; });
    return { masked: out, count };
  }
  function aiPayload(audit, issue) {
    if (!audit || !issue) throw new Error("Denetim ve bulgu seçilmelidir.");
    const m1 = maskSecrets(issue.snippet);
    const m2 = maskSecrets(issue.detail);
    const sys = "Sen Access Lens erişilebilirlik yardımcısısın. Verilen WCAG 2.2 bulgusunu geliştirici ve tasarımcı için sade Türkçe ile açıkla ve uygulanabilir düzeltme taslağı öner. Otomatik denetim puanını asla erişilebilirlik sertifikası gibi sunma; klavye ve ekran okuyucu manuel kontrolünü hatırlat. Yalnız JSON döndür: {\"aciklama\":\"...\",\"duzeltme\":\"...\",\"manuelKontrol\":\"...\"}";
    const usr = JSON.stringify({
      kural: issue.ruleId,
      wcag: issue.wcag,
      kategori: issue.category,
      satir: issue.line,
      secici: issue.selector,
      oge: m1.masked,
      bulgu: m2.masked,
    });
    return {
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      sent: { chars: usr.length, maskedCount: m1.count + m2.count, ruleId: issue.ruleId },
    };
  }
  function validateAi(rawText, issue) {
    const s = String(rawText || "");
    const m = /\{[\s\S]*\}/.exec(s);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let j;
    try { j = JSON.parse(m[0]); } catch { throw new Error("Model JSON yanıtı ayrıştırılamadı."); }
    const aciklama = str(j.aciklama || j.explanation || "", 600).trim();
    const duzeltme = str(j.duzeltme || j.fix || (issue && issue.fixDraft) || "", 600).trim();
    const manuelKontrol = str(j.manuelKontrol || j.manual || "Klavye (Tab) ve ekran okuyucu ile öğenin okunuşunu doğrulayın.", 300).trim();
    if (!aciklama) throw new Error("Model açıklaması boş döndü.");
    return {
      aciklama,
      duzeltme,
      manuelKontrol,
      disclaimer: CERTIFICATE_DISCLAIMER,
    };
  }

  // ---------------- Dışa aktarma (CSV / Markdown / JSON) ----------------
  function csvCell(v) {
    let s = String(v == null ? "" : v).replace(/\r?\n/g, " ").trim();
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function exportCsv(audit) {
    const head = ["Kesit", "Kural", "WCAG", "Kategori", "Önem", "Satır", "Seçici", "Durum", "Bulgu", "Düzeltme Taslağı", "Motor Sürümü"];
    const rows = [head.join(",")];
    for (const it of (audit && audit.issues) || []) {
      rows.push([
        audit.title, it.ruleId, it.wcag, CATEGORY_NAMES[it.category] || it.category,
        SEVERITY_NAMES[it.severity] || it.severity, it.line, it.selector,
        ISSUE_STATUS_NAMES[it.status] || it.status, it.detail, it.fixDraft, ENGINE_VERSION,
      ].map(csvCell).join(","));
    }
    return rows.join("\r\n") + "\r\n";
  }
  function exportMd(audit) {
    if (!audit) return "";
    const lines = [
      `# Access Lens Denetim Raporu — ${audit.title}`,
      "",
      `- **Standart:** ${STANDARD_VERSION}`,
      `- **Kural motoru:** \`${ENGINE_VERSION}\``,
      `- **Tarih:** ${audit.createdAt}`,
      `- **Bulgular:** ${audit.issues.length} (${audit.issues.filter((i) => i.status === "acik").length} açık, ${audit.issues.filter((i) => i.status === "cozuldu").length} çözüldü)`,
      "",
      `> **Not (Sertifika Değildir):** ${CERTIFICATE_DISCLAIMER}`,
      "",
      "## Bulgular",
      "",
    ];
    if (!audit.issues.length) lines.push("Kural motoru bu kesitte otomatik uyarı bulmadı.");
    for (const it of audit.issues) {
      lines.push(`### [${it.ruleId}] ${it.title} (Satır ${it.line} · \`${it.selector}\`)`);
      lines.push(`- **WCAG:** ${it.wcag} · **Kategori:** ${CATEGORY_NAMES[it.category]} · **Önem:** ${SEVERITY_NAMES[it.severity]} · **Durum:** ${ISSUE_STATUS_NAMES[it.status]}`);
      lines.push(`- **Açıklama:** ${it.detail}`);
      lines.push(`- **İlgili öğe:** \`${it.snippet.replace(/`/g, "'")}\``);
      lines.push(`- **Düzeltme taslağı:** \`${it.fixDraft.replace(/`/g, "'")}\``);
      if (it.ai && it.ai.aciklama) lines.push(`- **MyMind sade açıklama:** ${it.ai.aciklama}`);
      lines.push("");
    }
    lines.push("## Manuel Klavye ve Ekran Okuyucu Kontrol Listesi", "");
    for (const mc of MANUAL_CHECKS) {
      const st = (audit.manualChecks || []).find((x) => x.id === mc.id);
      lines.push(`- [${st && st.done ? "x" : " "}] **${mc.title}** (${mc.wcag}) — ${mc.desc}`);
    }
    return lines.join("\n") + "\n";
  }

  // ---------------- Normalleştirme ----------------
  function normalizeSettings(s) {
    s = s || {};
    return {
      level: s.level === "AAA" ? "AAA" : "AA",
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
    };
  }
  function normalizeAudit(a) {
    a = a || {};
    const issues = Array.isArray(a.issues) ? a.issues.slice(0, 500).map((it) => ({
      id: str(it.id || uid(), 40),
      ruleId: str(it.ruleId || RULES[0].id, 60),
      wcag: str(it.wcag || RULES[0].wcag, 80),
      category: CATEGORIES.includes(it.category) ? it.category : "semantik",
      severity: ["kritik", "uyari", "bilgi"].includes(it.severity) ? it.severity : "uyari",
      title: str(it.title || "", 200),
      line: Math.max(1, Number(it.line) || 1),
      selector: str(it.selector || "oge", 160),
      snippet: str(it.snippet || "", 300),
      detail: str(it.detail || "", 500),
      fixDraft: str(it.fixDraft || "", 500),
      status: ISSUE_STATUSES.includes(it.status) ? it.status : "acik",
      meta: it.meta && typeof it.meta === "object" ? it.meta : {},
      ai: it.ai && typeof it.ai === "object" ? it.ai : null,
    })) : [];
    const manualChecks = MANUAL_CHECKS.map((mc) => {
      const found = Array.isArray(a.manualChecks) ? a.manualChecks.find((x) => x && x.id === mc.id) : null;
      return { id: mc.id, done: !!(found && found.done) };
    });
    return {
      id: str(a.id || uid(), 40),
      title: str(a.title || "Kesit", 200),
      url: isWebUrl(a.url) ? String(a.url).trim() : "",
      source: str(a.source || "", MAX_SOURCE),
      level: a.level === "AAA" ? "AAA" : "AA",
      engineVersion: ENGINE_VERSION,
      standardVersion: STANDARD_VERSION,
      certificateDisclaimer: CERTIFICATE_DISCLAIMER,
      createdAt: str(a.createdAt || new Date().toISOString(), 40),
      sampleKey: str(a.sampleKey || "", 40),
      manualChecks,
      issues,
    };
  }
  function normalizeAudits(list) {
    return (Array.isArray(list) ? list : []).slice(0, MAX_AUDITS).map(normalizeAudit);
  }
  function normalizeCounters(c) {
    c = c || {};
    return {
      auditsRun: Math.max(0, Number(c.auditsRun) || 0),
      filesLoaded: Math.max(0, Number(c.filesLoaded) || 0),
      clipboardRun: Math.max(0, Number(c.clipboardRun) || 0),
      aiRuns: Math.max(0, Number(c.aiRuns) || 0),
      exports: Math.max(0, Number(c.exports) || 0),
    };
  }

  const api = {
    ENGINE_VERSION, STANDARD_VERSION, CERTIFICATE_DISCLAIMER,
    MAX_AUDITS, MAX_SOURCE, CATEGORIES, CATEGORY_NAMES, SEVERITY_NAMES,
    ISSUE_STATUSES, ISSUE_STATUS_NAMES, MANUAL_CHECKS, RULES,
    str, uid, fold, pct, isWebUrl, isLoopbackUrl,
    parseColor, rgbToHex, relativeLuminance, contrastRatio, suggestAccessibleColor,
    auditSnippet, evaluateFixtures, metrics, maskSecrets, aiPayload, validateAi,
    exportCsv, exportMd, normalizeSettings, normalizeAudit, normalizeAudits, normalizeCounters,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ALCore = api;
})(typeof self !== "undefined" ? self : this);
