/* Design Token Scout (PL-044) — çekirdek (saf işlevler; Node testleri, ana süreç ve arayüz kullanır; ağ ve dosya erişimi yok).
 * Seçilen arayüzden (computed style JSON, CSS veya HTML) renk (hex/rgb/hsl), yazı (font-family, boyut, ağırlık, satır yüksekliği),
 * boşluk (padding, margin, gap) ve köşe yarıçapı (border-radius) adaylarını çıkarır; yakın değerleri kümeleyerek token tekrarını
 * azaltır; yalnız kullanıcı onayıyla W3C Design Tokens JSON, CSS :root değişkenleri ve Markdown belge üretir.
 * Teknik bağımlılık ve sınırlar (Notion): yalnız erişilen sayfa ve hak sahibi olunan tasarımda kullanılır; tasarım kopyalama
 * yerine sistem çıkarma; dinamik durumlar (hover, focus, dark) ayrıca örneklenir.
 * Doğrulama ölçütü (Notion): örnek 5 sayfada kullanılan ana değerleri ≥%90 kapsama; token tekrarında düşüş. */
(function (root) {
  "use strict";
  const MAX_SOURCES = 200;
  const MAX_SOURCE_CHARS = 150000;
  const CATEGORIES = ["color", "typography", "spacing", "radius"];
  const CATEGORY_NAMES = { color: "Renk", typography: "Yazı (Tipografi)", spacing: "Boşluk (Spacing)", radius: "Köşe yarıçapı" };
  const OWNERSHIP_DISCLAIMER = "Yalnız erişilen sayfa ve hak sahibi olunan tasarımda kullanılır; tasarım kopyalama yerine var olan tasarım sistemini belgeler. Dinamik durumlar (hover, focus, aktif, koyu tema) ayrıca örneklenmelidir.";

  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max || 10000);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

  function isWebUrl(u) {
    try { const x = new URL(String(u)); return (x.protocol === "http:" || x.protocol === "https:") && !x.username && !x.password; } catch { return false; }
  }
  function isLoopbackUrl(u) {
    try { const x = new URL(String(u)); return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password; } catch { return false; }
  }

  // ---------------- Renk ve Boyut Normalleştirme ----------------
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
  function colorDistance(rgb1, rgb2) {
    const dr = rgb1[0] - rgb2[0], dg = rgb1[1] - rgb2[1], db = rgb1[2] - rgb2[2];
    return Math.round(Math.sqrt(dr * dr + dg * dg + db * db) * 10) / 10;
  }
  function parsePx(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().toLowerCase();
    let m = /^([\d.]+)\s*px$/.exec(s);
    if (m) return Math.round(Number(m[1]) * 100) / 100;
    m = /^([\d.]+)\s*rem$/.exec(s);
    if (m) return Math.round(Number(m[1]) * 16 * 100) / 100;
    m = /^([\d.]+)\s*em$/.exec(s);
    if (m) return Math.round(Number(m[1]) * 16 * 100) / 100;
    return null;
  }
  function cleanFontFamily(raw) {
    if (!raw) return "";
    const first = String(raw).split(",")[0].replace(/["']/g, "").trim();
    if (!first || /^(inherit|initial|unset|none)$/i.test(first)) return "";
    return first;
  }

  // ---------------- Ham Stil Çıkarımı (CSS / HTML / Computed Style JSON) ----------------
  function extractRawObservations(sourceText, pageTitle) {
    const text = str(sourceText, MAX_SOURCE_CHARS);
    const obs = [];
    const add = (category, subType, rawValue, normValue, numeric, prop, selector) => {
      obs.push({
        category,
        subType,
        rawValue: str(rawValue, 120),
        normValue: str(normValue, 120),
        numeric,
        prop: str(prop || category, 60),
        selector: str(selector || pageTitle || "oge", 100),
      });
    };

    const inspectProp = (prop, val, sel) => {
      const p = prop.toLowerCase().trim();
      const v = String(val || "").trim();
      if (!v) return;

      // Renkler
      const colorRe = /#[0-9a-f]{3,6}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi;
      let cm;
      while ((cm = colorRe.exec(v))) {
        const rgb = parseColor(cm[0]);
        if (rgb) add("color", "color", cm[0], rgbToHex(rgb), rgb, p, sel);
      }

      // Yazı ailesi
      if (p === "font-family" || p === "fontfamily") {
        const ff = cleanFontFamily(v);
        if (ff) add("typography", "fontFamily", v, ff, null, "font-family", sel);
      }
      // Yazı boyutu
      if (p === "font-size" || p === "fontsize") {
        const px = parsePx(v);
        if (px != null && px > 0) add("typography", "fontSize", v, `${Math.round(px)}px`, px, "font-size", sel);
      }
      // Yazı ağırlığı
      if (p === "font-weight" || p === "fontweight") {
        const wMap = { normal: 400, regular: 400, medium: 500, semibold: 600, bold: 700 };
        const wn = wMap[v.toLowerCase()] || (Number(v) >= 100 && Number(v) <= 900 ? Number(v) : null);
        if (wn) add("typography", "fontWeight", v, String(wn), wn, "font-weight", sel);
      }
      // Satır yüksekliği
      if (p === "line-height" || p === "lineheight") {
        if (/^[\d.]+$/.test(v) && Number(v) >= 1 && Number(v) <= 3) {
          const lh = Math.round(Number(v) * 100) / 100;
          add("typography", "lineHeight", v, String(lh), lh, "line-height", sel);
        } else {
          const px = parsePx(v);
          if (px != null && px > 0) add("typography", "lineHeight", v, `${Math.round(px)}px`, px, "line-height", sel);
        }
      }
      // Boşluk (spacing)
      if (/^(padding|margin|gap|row-gap|column-gap|padding-(?:top|right|bottom|left|inline|block)|margin-(?:top|right|bottom|left|inline|block))$/i.test(p)) {
        for (const tok of v.split(/\s+/)) {
          const px = parsePx(tok);
          if (px != null && px > 0 && px <= 256) add("spacing", "dimension", tok, `${Math.round(px)}px`, px, p, sel);
        }
      }
      // Köşe yarıçapı (radius)
      if (/^(border-radius|borderradius)$/i.test(p)) {
        const firstTok = v.split(/\s+/)[0];
        const px = parsePx(firstTok);
        if (px != null && px > 0 && px <= 128) add("radius", "dimension", firstTok, `${Math.round(px)}px`, px, "border-radius", sel);
      }
    };

    // 1) JSON computed style dizisi veya nesnesi mi?
    const trimmed = text.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.elements) ? parsed.elements : [parsed]);
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const sel = item.selector || item.tag || pageTitle || "oge";
          const styles = item.styles && typeof item.styles === "object" ? item.styles : item;
          for (const [k, v] of Object.entries(styles)) {
            if (["selector", "tag", "page", "state", "elements"].includes(k)) continue;
            inspectProp(k, v, sel);
          }
        }
        return obs;
      } catch { /* JSON değilse CSS/HTML olarak devam et */ }
    }

    // 2) CSS blokları ve satır içi style="..."
    const blockRe = /([^{};]+)\{([^{}]+)\}/g;
    let bm;
    while ((bm = blockRe.exec(text))) {
      const sel = bm[1].replace(/\/\*[\s\S]*?\*\//g, "").trim().split("\n").pop().trim() || "css";
      for (const decl of bm[2].split(";")) {
        const idx = decl.indexOf(":");
        if (idx > 0) inspectProp(decl.slice(0, idx), decl.slice(idx + 1), sel);
      }
    }
    const inlineRe = /style\s*=\s*["']([^"']+)["']/gi;
    let im;
    while ((im = inlineRe.exec(text))) {
      for (const decl of im[1].split(";")) {
        const idx = decl.indexOf(":");
        if (idx > 0) inspectProp(decl.slice(0, idx), decl.slice(idx + 1), "inline");
      }
    }
    return obs;
  }

  // ---------------- Yakın Değer Kümeleme ve Token Adayları Üretimi ----------------
  function clusterObservations(allObservations, opts) {
    opts = opts || {};
    const colorTolerance = opts.colorTolerance != null ? Number(opts.colorTolerance) : 14; // RGB Öklid mesafesi (ör. #7c6cff ile #7d6dff kümelenir)
    const spacingTolerance = opts.spacingTolerance != null ? Number(opts.spacingTolerance) : 1.5; // 15px -> 16px kümelenir

    const rawUniqueSet = new Set(allObservations.map((o) => `${o.category}:${o.subType}:${o.rawValue.toLowerCase()}`));
    const candidates = [];

    // 1) Renk kümeleme
    const colorObs = allObservations.filter((o) => o.category === "color" && Array.isArray(o.numeric));
    const colorFreq = new Map();
    for (const o of colorObs) {
      const hex = o.normValue.toLowerCase();
      if (!colorFreq.has(hex)) colorFreq.set(hex, { hex, rgb: o.numeric, count: 0, rawVariants: new Set(), selectors: new Set(), props: new Set() });
      const entry = colorFreq.get(hex);
      entry.count++;
      entry.rawVariants.add(o.rawValue);
      entry.selectors.add(o.selector);
      entry.props.add(o.prop);
    }
    const sortedColors = [...colorFreq.values()].sort((a, b) => b.count - a.count);
    const colorClusters = [];
    for (const c of sortedColors) {
      const found = colorClusters.find((cl) => colorDistance(cl.rgb, c.rgb) <= colorTolerance);
      if (found) {
        found.count += c.count;
        found.mergedHexes.push(c.hex);
        c.rawVariants.forEach((v) => found.rawVariants.add(v));
        c.selectors.forEach((s) => found.selectors.add(s));
        c.props.forEach((p) => found.props.add(p));
      } else {
        colorClusters.push({
          hex: c.hex,
          rgb: c.rgb,
          count: c.count,
          mergedHexes: [c.hex],
          rawVariants: new Set(c.rawVariants),
          selectors: new Set(c.selectors),
          props: new Set(c.props),
        });
      }
    }
    colorClusters.forEach((cl, idx) => {
      candidates.push({
        id: "col-" + (idx + 1),
        name: `color.palette.${idx + 1}`,
        category: "color",
        subType: "color",
        w3cType: "color",
        value: cl.hex,
        count: cl.count,
        mergedValues: [...cl.rawVariants],
        mergedHexes: cl.mergedHexes,
        selectors: [...cl.selectors].slice(0, 8),
        approved: true,
        semanticRole: "",
      });
    });

    // 2) Boyut (Spacing ve Radius) kümeleme
    const clusterNumeric = (cat, subType, w3cType, prefix, tol, snapGrid) => {
      const list = allObservations.filter((o) => o.category === cat && o.subType === subType && typeof o.numeric === "number");
      const freq = new Map();
      for (const o of list) {
        const px = Math.round(o.numeric * 10) / 10;
        if (!freq.has(px)) freq.set(px, { px, count: 0, rawVariants: new Set(), selectors: new Set() });
        const e = freq.get(px);
        e.count++; e.rawVariants.add(o.rawValue); e.selectors.add(o.selector);
      }
      const sorted = [...freq.values()].sort((a, b) => b.count - a.count);
      const clusters = [];
      for (const item of sorted) {
        const found = clusters.find((cl) => Math.abs(cl.px - item.px) <= tol);
        if (found) {
          found.count += item.count;
          found.mergedPxs.push(item.px);
          item.rawVariants.forEach((v) => found.rawVariants.add(v));
          item.selectors.forEach((s) => found.selectors.add(s));
        } else {
          const canonicalPx = snapGrid && item.px >= 4 && Math.abs(Math.round(item.px / 4) * 4 - item.px) <= 1 ? Math.round(item.px / 4) * 4 : Math.round(item.px);
          clusters.push({
            px: canonicalPx,
            count: item.count,
            mergedPxs: [item.px],
            rawVariants: new Set(item.rawVariants),
            selectors: new Set(item.selectors),
          });
        }
      }
      clusters.sort((a, b) => a.px - b.px).forEach((cl, idx) => {
        candidates.push({
          id: `${prefix}-${idx + 1}`,
          name: `${prefix}.${idx + 1}`,
          category: cat,
          subType,
          w3cType,
          value: `${cl.px}px`,
          count: cl.count,
          mergedValues: [...cl.rawVariants],
          mergedPxs: cl.mergedPxs,
          selectors: [...cl.selectors].slice(0, 8),
          approved: true,
          semanticRole: "",
        });
      });
    };

    clusterNumeric("spacing", "dimension", "dimension", "space", spacingTolerance, true);
    clusterNumeric("radius", "dimension", "dimension", "radius", 1.0, false);
    clusterNumeric("typography", "fontSize", "dimension", "font.size", 1.0, false);

    // 3) Tipografi: font-family, font-weight, line-height
    const addExactGroup = (subType, w3cType, prefix) => {
      const list = allObservations.filter((o) => o.category === "typography" && o.subType === subType);
      const freq = new Map();
      for (const o of list) {
        const k = o.normValue;
        if (!freq.has(k)) freq.set(k, { val: k, count: 0, rawVariants: new Set(), selectors: new Set() });
        const e = freq.get(k);
        e.count++; e.rawVariants.add(o.rawValue); e.selectors.add(o.selector);
      }
      [...freq.values()].sort((a, b) => b.count - a.count).forEach((cl, idx) => {
        candidates.push({
          id: `${prefix.replace(/\./g, "-")}-${idx + 1}`,
          name: `${prefix}.${idx + 1}`,
          category: "typography",
          subType,
          w3cType,
          value: cl.val,
          count: cl.count,
          mergedValues: [...cl.rawVariants],
          selectors: [...cl.selectors].slice(0, 8),
          approved: true,
          semanticRole: "",
        });
      });
    };
    addExactGroup("fontFamily", "fontFamily", "font.family");
    addExactGroup("fontWeight", "fontWeight", "font.weight");
    addExactGroup("lineHeight", "number", "font.lineHeight");

    const rawUniqueCount = rawUniqueSet.size;
    const tokenCount = candidates.length;
    const duplicationReductionPct = rawUniqueCount > tokenCount ? pct(rawUniqueCount - tokenCount, rawUniqueCount) : 0;

    return {
      candidates,
      totalObservations: allObservations.length,
      rawUniqueCount,
      tokenCount,
      duplicationReductionPct,
    };
  }

  // ---------------- Doğrulama Ölçütü: Örnek 5 Sayfada Ana Değerleri ≥%90 Kapsama ----------------
  function evaluateCoverage(candidates, goldCoreValues) {
    if (!Array.isArray(goldCoreValues) || !goldCoreValues.length) return null;
    const approved = (candidates || []).filter((c) => c.approved !== false);
    let covered = 0;
    const details = [];
    for (const g of goldCoreValues) {
      const hit = approved.some((c) => {
        if (c.category !== g.category) return false;
        if (c.value.toLowerCase() === g.value.toLowerCase()) return true;
        if ((c.mergedValues || []).some((mv) => mv.toLowerCase() === g.value.toLowerCase())) return true;
        if (g.category === "color") {
          const rgb1 = parseColor(c.value), rgb2 = parseColor(g.value);
          if (rgb1 && rgb2 && colorDistance(rgb1, rgb2) <= 14) return true;
        }
        return false;
      });
      if (hit) covered++;
      details.push({ ...g, covered: hit });
    }
    return {
      expectedCore: goldCoreValues.length,
      coveredCore: covered,
      coveragePct: pct(covered, goldCoreValues.length) ?? 100,
      details,
    };
  }

  // ---------------- Yalnız Onaylı Tokenların Dışa Aktarımı (W3C Design Tokens JSON / CSS / MD) ----------------
  function exportW3cTokens(candidates) {
    const approved = (Array.isArray(candidates) ? candidates : []).filter((c) => c.approved);
    const rootObj = {
      $metadata: {
        generator: "Design Token Scout 0.1.0 (PL-044)",
        standard: "W3C Design Tokens Format Module",
        approvedCount: approved.length,
      },
    };
    for (const c of approved) {
      const parts = (c.semanticRole || c.name).split(".").filter(Boolean);
      let cur = rootObj;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
        cur = cur[p];
      }
      const leaf = parts[parts.length - 1] || c.id;
      cur[leaf] = {
        $value: c.value,
        $type: c.w3cType || c.category,
        $description: `Gözlem: ${c.count} kez (${(c.mergedValues || []).slice(0, 4).join(", ")})`,
      };
    }
    return JSON.stringify(rootObj, null, 2) + "\n";
  }

  function exportCssVariables(candidates) {
    const approved = (Array.isArray(candidates) ? candidates : []).filter((c) => c.approved);
    const lines = ["/* Design Token Scout (PL-044) — kullanıcı onaylı tasarım tokenları */", ":root {"];
    for (const c of approved) {
      const varName = "--" + (c.semanticRole || c.name).replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      lines.push(`  ${varName}: ${c.value}; /* ${c.count} kullanım */`);
    }
    lines.push("}", "");
    return lines.join("\n");
  }

  function exportMd(sources, candidates, stats, cov) {
    const approved = (Array.isArray(candidates) ? candidates : []).filter((c) => c.approved);
    const lines = [
      "# Design Token Scout — Tasarım Sistemi Belgesi",
      "",
      `> **İlke:** ${OWNERSHIP_DISCLAIMER}`,
      "",
      `- **Örneklenen sayfa/kesit:** ${(sources || []).length}`,
      `- **Onaylanan token sayısı:** ${approved.length} / ${(candidates || []).length}`,
      `- **Ham benzersiz değer → kümelenmiş token:** ${stats.rawUniqueCount} → ${stats.tokenCount} (**%${stats.duplicationReductionPct} tekrar azalması**)`,
    ];
    if (cov) lines.push(`- **Ana değer kapsama oranı (5 sayfa):** **%${cov.coveragePct}** (${cov.coveredCore}/${cov.expectedCore}, hedef ≥ %90)`);
    lines.push("", "## Onaylanan Tokenlar", "", "| Token Adı | Kategori | Değer | Kullanım | Kümelenen Ham Değerler |", "| --- | --- | --- | --- | --- |");
    for (const c of approved) {
      lines.push(`| \`${c.semanticRole || c.name}\` | ${CATEGORY_NAMES[c.category] || c.category} | \`${c.value}\` | ${c.count} | ${(c.mergedValues || []).join(", ")} |`);
    }
    return lines.join("\n") + "\n";
  }

  // ---------------- Yapay Zekâ (MyMind / yerel model) Semantik Token Hiyerarşisi ----------------
  function aiPayload(candidates) {
    const list = (Array.isArray(candidates) ? candidates : []).slice(0, 40).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      value: c.value,
      count: c.count,
      mergedCount: (c.mergedValues || []).length,
    }));
    const sys = "Sen Design Token Scout yardımcısısın. Kümelenmiş tasarım token adaylarını inceleyip tutarlı bir semantik adlandırma hiyerarşisi öner (ör. color.bg.primary, color.accent.brand, space.md). Yalnız JSON döndür: {\"oneriler\":[{\"id\":\"col-1\",\"semanticRole\":\"color.bg.canvas\"}],\"ozet\":\"...\"}";
    const usr = JSON.stringify({ adaylar: list });
    return {
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      sent: { tokenCount: list.length, chars: usr.length },
    };
  }

  function validateAi(rawText, candidates) {
    const s = String(rawText || "");
    const m = /\{[\s\S]*\}/.exec(s);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let j;
    try { j = JSON.parse(m[0]); } catch { throw new Error("Model JSON yanıtı ayrıştırılamadı."); }
    const validIds = new Set((candidates || []).map((c) => c.id));
    const suggestions = [];
    let dropped = 0;
    for (const item of Array.isArray(j.oneriler) ? j.oneriler : []) {
      if (!item || !validIds.has(item.id) || typeof item.semanticRole !== "string" || !/^[a-zA-Z0-9._-]{3,60}$/.test(item.semanticRole.trim())) {
        dropped++;
        continue;
      }
      suggestions.push({ id: item.id, semanticRole: item.semanticRole.trim() });
    }
    return {
      suggestions,
      summary: str(j.ozet || "Yakın değerler semantik katmanlara ayrıldı.", 400),
      dropped,
    };
  }

  // ---------------- Normalleştirme ----------------
  function normalizeSettings(s) {
    s = s || {};
    return {
      colorTolerance: Math.max(0, Math.min(40, Number(s.colorTolerance ?? 14))),
      spacingTolerance: Math.max(0, Math.min(8, Number(s.spacingTolerance ?? 1.5))),
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
    };
  }
  function normalizeCounters(c) {
    c = c || {};
    return {
      sourcesAdded: Math.max(0, Number(c.sourcesAdded) || 0),
      filesLoaded: Math.max(0, Number(c.filesLoaded) || 0),
      clipboardRun: Math.max(0, Number(c.clipboardRun) || 0),
      aiRuns: Math.max(0, Number(c.aiRuns) || 0),
      exports: Math.max(0, Number(c.exports) || 0),
    };
  }

  const api = {
    MAX_SOURCES, MAX_SOURCE_CHARS, CATEGORIES, CATEGORY_NAMES, OWNERSHIP_DISCLAIMER,
    str, uid, pct, isWebUrl, isLoopbackUrl,
    parseColor, rgbToHex, colorDistance, parsePx, cleanFontFamily,
    extractRawObservations, clusterObservations, evaluateCoverage,
    exportW3cTokens, exportCssVariables, exportMd,
    aiPayload, validateAi, normalizeSettings, normalizeCounters,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DTSCore = api;
})(typeof self !== "undefined" ? self : this);
