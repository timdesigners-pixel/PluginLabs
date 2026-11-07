/* Access Lens — denetlenen sayfada, sayfanın kendi betiklerinden YALITILMIŞ bir dünyada (isolated world) çalışan betik.
 * axe-core'u verilen WCAG etiketleriyle çalıştırır; odak sırasını (klavye Tab sırası), başlık/bölge yapısını ve — yalnız
 * fixture'larda anlamlı olan — data-beklenen işaretlerini toplar. Sayfayı DEĞİŞTİRMEZ, ağ isteği yapmaz. Sonuç JSON olarak döner. */
(async function (opts) {
  const t0 = performance.now();
  // Benzersiz CSS seçicisi: tekil id varsa #id, yoksa en yakın tekil ataya kadar :nth-of-type yolu (sonuç doğrulanır).
  const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/[^a-zA-Z0-9_-]/g, "\\$&"));
  const unique = (q, el) => { try { const l = document.querySelectorAll(q); return l.length === 1 && l[0] === el; } catch (e) { return false; } };
  function sel(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el === document.documentElement) return "html";
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
    const q = parts.join(" > ");
    return unique(q, el) ? q : (cur === document.documentElement ? "html > " + q : q);
  }
  const txt = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n || 160);
  const byId = (ids) => String(ids || "").split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((e) => e.textContent).join(" ");
  function nameOf(el) {
    return txt(el.getAttribute("aria-label") || byId(el.getAttribute("aria-labelledby")) || (el.labels && el.labels.length ? [...el.labels].map((l) => l.textContent).join(" ") : "") ||
      el.getAttribute("alt") || (el.tagName === "INPUT" && /^(submit|button|reset)$/i.test(el.type) ? el.value : "") || (/^(SELECT|INPUT|TEXTAREA)$/.test(el.tagName) ? "" : el.textContent) || el.getAttribute("title") || el.getAttribute("placeholder") || "", 120);
  }
  const r = await axe.run(document, { runOnly: { type: "tag", values: opts.tags }, resultTypes: ["violations", "incomplete"], iframes: false, elementRef: false, selectors: true });
  const exp = new Map();
  for (const el of document.querySelectorAll("[data-beklenen]")) exp.set(el, { sel: sel(el), rules: el.getAttribute("data-beklenen").split(/\s+/).filter(Boolean), found: [] });
  const slim = (list, mark) => list.map((v) => ({ id: v.id, impact: v.impact, tags: v.tags, help: v.help, description: v.description, helpUrl: v.helpUrl, nodes: v.nodes.map((n) => {
    const t = n.target && n.target[0];
    let el = null;
    if (typeof t === "string") { try { el = document.querySelector(t); } catch (e) { el = null; } }
    let beklenen = "";
    if (el && exp.has(el)) { beklenen = exp.get(el).rules.join(" "); if (mark) exp.get(el).found.push(v.id); }
    return { target: n.target, html: n.html, impact: n.impact, failureSummary: n.failureSummary, beklenen };
  }) }));
  const violations = slim(r.violations, true);
  const incomplete = slim(r.incomplete, false);
  // Odak sırası: klavyeyle odaklanabilen, görünür öğeler; önce tabindex > 0 (artan), sonra belge sırası.
  const FOC = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, [tabindex], [contenteditable=""], [contenteditable="true"], audio[controls], video[controls]';
  const els = [...document.querySelectorAll(FOC)].filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden" && !el.closest("[inert]"));
  const ordered = [...els.filter((e) => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex), ...els.filter((e) => e.tabIndex === 0)];
  const focus = ordered.slice(0, 400).map((el) => { const b = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), role: el.getAttribute("role") || "", name: nameOf(el), tabindex: el.tabIndex, sel: sel(el), x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; });
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')].slice(0, 300).map((h) => ({ level: /^H\d$/.test(h.tagName) ? +h.tagName[1] : +(h.getAttribute("aria-level") || 2), text: txt(h.textContent), sel: sel(h) }));
  const LM = { MAIN: "main", NAV: "navigation", ASIDE: "complementary", HEADER: "banner", FOOTER: "contentinfo" };
  const landmarks = [...document.querySelectorAll('main, nav, aside, header, footer, form[aria-label], form[aria-labelledby], section[aria-label], section[aria-labelledby], [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="search"], [role="region"], [role="form"]')]
    .filter((el) => !(/^(HEADER|FOOTER)$/.test(el.tagName) && !el.getAttribute("role") && el.closest("article, aside, main, nav, section")))
    .slice(0, 100).map((el) => ({ role: el.getAttribute("role") || LM[el.tagName] || (el.tagName === "FORM" ? "form" : "region"), name: txt(el.getAttribute("aria-label") || byId(el.getAttribute("aria-labelledby")), 120), sel: sel(el) }));
  return {
    engineVersion: axe.version, tags: opts.tags, url: location.href, title: document.title, lang: document.documentElement.getAttribute("lang") || "",
    viewport: { w: innerWidth, h: innerHeight }, passes: r.passes.length, inapplicable: r.inapplicable.length, elements: document.getElementsByTagName("*").length,
    violations, incomplete, focus, outline: { headings, landmarks }, expectations: [...exp.values()], durationMs: Math.round(performance.now() - t0),
  };
})
