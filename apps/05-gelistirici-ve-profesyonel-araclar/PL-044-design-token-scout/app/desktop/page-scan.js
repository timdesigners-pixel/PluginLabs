/* Design Token Scout — taranan sayfada, sayfanın kendi betiklerinden YALITILMIŞ bir dünyada (isolated world) çalışan betik.
 * Görünür öğelerin hesaplanmış stillerini (getComputedStyle) okur: renk (metin/zemin/kenarlık/SVG), yazı ailesi/boyutu/kalınlığı/satır
 * yüksekliği/harf aralığı, boşluk (margin/padding/gap), köşe yarıçapı ve gölge. Her değer için kullanım sayısı ve en çok 3 örnek öğe
 * seçicisi tutulur. Ayrıca sayfada :root/html üzerinde tanımlı CSS değişkenleri ve :hover/:focus/:active/:disabled durum kurallarındaki
 * renkler (erişilebilen stil sayfalarından) toplanır. Sayfa DEĞİŞTİRİLMEZ (DOM'a öğe eklenmez), ağ isteği yapılmaz. Sonuç JSON döner. */
(function (opts) {
  const t0 = performance.now();
  const MAX_EL = opts.maxElements || 5000;
  const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/[^a-zA-Z0-9_-]/g, "\\$&"));
  const unique = (q, el) => { try { const l = document.querySelectorAll(q); return l.length === 1 && l[0] === el; } catch (e) { return false; } };
  function sel(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el === document.documentElement) return "html";
    if (el === document.body) return "body";
    if (el.id && unique("#" + esc(el.id), el)) return "#" + esc(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      let part = cur.tagName.toLowerCase();
      if (cur.id && unique("#" + esc(cur.id), cur)) { parts.unshift("#" + esc(cur.id)); break; }
      const p = cur.parentElement;
      if (p) { const same = [...p.children].filter((c) => c.tagName === cur.tagName); if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(cur) + 1) + ")"; }
      parts.unshift(part);
      const q = parts.join(" > ");
      if (unique(q, el)) return q;
      cur = p;
    }
    return parts.join(" > ");
  }
  // Renkleri tek biçime çevirmek için DOM'a eklenmeyen bir tuval bağlamı kullanılır (sayfa değişmez).
  const cv = document.createElement("canvas").getContext("2d");
  const colorCache = new Map();
  function normColor(v) {
    v = String(v || "").trim();
    if (!v || v === "transparent" || v === "none" || v === "currentcolor") return "";
    if (colorCache.has(v)) return colorCache.get(v);
    let out = "";
    try { cv.fillStyle = "#000000"; cv.fillStyle = v; const a = cv.fillStyle; cv.fillStyle = "#ffffff"; cv.fillStyle = v; out = cv.fillStyle === a ? a : ""; } catch (e) { out = ""; }
    if (/rgba\([^)]*,\s*0\)$/.test(out)) out = "";
    colorCache.set(v, out);
    return out;
  }
  const store = {};
  function add(cat, value, el, role) {
    if (!value) return;
    const m = store[cat] || (store[cat] = new Map());
    let e = m.get(value);
    if (!e) { e = { value, uses: 0, roles: {}, samples: [] }; m.set(value, e); }
    e.uses++;
    if (role) e.roles[role] = (e.roles[role] || 0) + 1;
    if (el && e.samples.length < 3) { const s = sel(el); if (s && !e.samples.includes(s)) e.samples.push(s); }
  }
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
  const hasText = (el) => { for (const n of el.childNodes) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true; return false; };

  const all = document.body ? document.body.getElementsByTagName("*") : [];
  let sampled = 0, hidden = 0;
  const SKIP = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|META|LINK|HEAD|TITLE|BR|WBR)$/;
  const roots = document.body ? [document.body, ...all] : [];
  for (const el of roots) {
    if (sampled >= MAX_EL) break;
    if (SKIP.test(el.tagName)) continue;
    if (!el.getClientRects().length) { hidden++; continue; }
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) { hidden++; continue; }
    sampled++;
    const txt = hasText(el) || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName);
    // Renkler
    if (txt) add("color", normColor(cs.color), el, "metin");
    add("color", normColor(cs.backgroundColor), el, "zemin");
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (cs["border" + side + "Style"] !== "none" && px(cs["border" + side + "Width"]) > 0) { add("color", normColor(cs["border" + side + "Color"]), el, "kenarlik"); break; }
    }
    if (el.namespaceURI === "http://www.w3.org/2000/svg") { add("color", normColor(cs.fill), el, "svg"); if (cs.stroke !== "none") add("color", normColor(cs.stroke), el, "svg"); }
    // Yazı
    if (txt) {
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      add("fontFamily", fam ? cs.fontFamily.replace(/\s*,\s*/g, ", ").slice(0, 200) : "", el);
      add("fontSize", cs.fontSize, el);
      add("fontWeight", String(cs.fontWeight), el);
      if (cs.lineHeight !== "normal") { const lh = px(cs.lineHeight), fs = px(cs.fontSize); if (lh && fs) add("lineHeight", String(Math.round((lh / fs) * 100) / 100), el); }
      if (cs.letterSpacing !== "normal" && px(cs.letterSpacing)) add("letterSpacing", cs.letterSpacing, el);
    }
    // Boşluk
    // margin: auto ile ortalanan öğelerin hesaplanmış yatay kenar boşlukları (eşit ve büyük) tasarım değeri değildir; atlanır.
    const centered = cs.marginLeft === cs.marginRight && px(cs.marginLeft) > 64;
    for (const p of ["marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) {
      if (centered && (p === "marginLeft" || p === "marginRight")) continue;
      const n = px(cs[p]);
      if (n && n > 0 && n < 400) add("space", n + "px", el, p.startsWith("margin") ? "margin" : "padding");
    }
    if (/flex|grid/.test(cs.display)) for (const p of ["rowGap", "columnGap"]) { const n = px(cs[p]); if (n && n > 0 && n < 400) add("space", n + "px", el, "gap"); }
    // Köşe ve gölge
    const corners = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
    const seen = new Set();
    for (const c of corners) {
      if (!c || c === "0px" || seen.has(c)) continue;
      seen.add(c);
      const first = c.split(" ")[0];
      if (/%$/.test(first)) { if (parseFloat(first) >= 50) add("radius", "50%", el); }
      else { const n = px(first); if (n && n > 0) add("radius", (n >= 999 ? 9999 : n) + "px", el); }
    }
    if (cs.boxShadow && cs.boxShadow !== "none") add("shadow", cs.boxShadow.slice(0, 300), el);
  }

  // Sayfanın :root/html üzerinde tanımladığı CSS değişkenleri ve durum (:hover/:focus…) kuralları — yalnız okunabilen stil sayfaları.
  const vars = new Map();
  const states = [];
  let blockedSheets = 0;
  const rootCs = document.documentElement ? getComputedStyle(document.documentElement) : null;
  const resolveVar = (v) => String(v).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (m, n, fb) => (rootCs && rootCs.getPropertyValue(n).trim()) || (fb || "").trim());
  const STATE = /:(hover|focus-visible|focus-within|focus|active|disabled|checked)\b/;
  function walk(rules, depth) {
    for (const r of rules) {
      if (states.length > 400 && vars.size > 400) return;
      if (r.cssRules && depth < 4 && !r.selectorText) { walk(r.cssRules, depth + 1); continue; }
      if (!r.selectorText || !r.style) continue;
      const rootSel = /(^|,)\s*(:root|html)\s*(,|$)/.test(r.selectorText);
      for (let i = 0; i < r.style.length; i++) {
        const name = r.style[i];
        if (rootSel && name.startsWith("--") && vars.size < 400) { const val = (rootCs && rootCs.getPropertyValue(name).trim()) || r.style.getPropertyValue(name).trim(); if (val) vars.set(name, val.slice(0, 200)); }
      }
      const m = STATE.exec(r.selectorText);
      if (m && states.length < 400) {
        for (const prop of ["color", "background-color", "background", "border-color", "outline-color", "box-shadow"]) {
          const raw = r.style.getPropertyValue(prop);
          if (!raw) continue;
          if (prop === "box-shadow") { states.push({ state: m[1], prop, value: resolveVar(raw).slice(0, 300), selector: r.selectorText.slice(0, 200) }); continue; }
          const c = normColor(resolveVar(raw).split(/\s+(?![^(]*\))/).find((p) => normColor(p)) || "");
          if (c) states.push({ state: m[1], prop, value: c, selector: r.selectorText.slice(0, 200) });
        }
      }
    }
  }
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, 0); } catch (e) { blockedSheets++; } }
  // Beklenen ana değerler: yalnız uygulamayla gelen örnek sayfalarda (çalışmayan JSON bloğu).
  let expected = null;
  const ex = document.getElementById("dts-beklenen");
  if (ex && ex.type === "application/json") { try { expected = JSON.parse(ex.textContent); } catch (e) { expected = null; } }
  // Sayfanın temel (gövde) stili: metin rengi, zemin, yazı ailesi ve boyutu — anlamsal takma adlar ve ölçek tabanı için.
  const base = {};
  if (document.body) {
    const b = getComputedStyle(document.body), h = getComputedStyle(document.documentElement);
    base.color = normColor(b.color);
    base.background = normColor(b.backgroundColor) || normColor(h.backgroundColor);
    base.fontFamily = b.fontFamily.replace(/\s*,\s*/g, ", ").slice(0, 200);
    base.fontSize = b.fontSize;
  }
  const out = {};
  for (const [cat, m] of Object.entries(store)) out[cat] = [...m.values()].sort((a, b) => b.uses - a.uses).slice(0, 400);
  return {
    url: location.href, title: document.title, lang: document.documentElement.getAttribute("lang") || "",
    viewport: { w: innerWidth, h: innerHeight }, elements: document.getElementsByTagName("*").length, sampled, hidden, capped: sampled >= MAX_EL,
    values: out, base, vars: [...vars].map(([name, value]) => ({ name, value })), states, blockedSheets, expected, durationMs: Math.round(performance.now() - t0),
  };
})
