/* Design Token Scout — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; sayfadan gelen değerler,
 * seçiciler ve değişken adları düz metindir). Renk örnekleri CSSOM ile (element.style) boyanır. Arayüz ağa, dosya sistemine ve anahtarlara
 * doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.dtsDesktop;
  const C = window.DTSCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["scan", "history", "settings"];
  const state = { s: null, view: "scan", tab: "renk", sel: null, show: "", hf: "tamam", q: "", shot: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    drop: "M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z",
  };
  function icon(name, size) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "pl-ico" + (size ? " pl-ico--" + size : ""));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", ICONS[name]);
    svg.appendChild(p);
    return svg;
  }
  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "value") e.value = v;
      else if (k === "checked") e.checked = !!v;
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const kid of kids) if (kid) e.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    return e;
  }
  function toast(message, isError) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, icon(isError ? "alert" : "check", "20"), el("div", { class: "pl-toast__body", text: message }));
    if (isError) t.style.setProperty("--pl-c", "var(--pl-danger)");
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), 7000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const pctText = C.pctText;
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const pageName = (a) => a.title || (a.target.kind === "url" ? C.hostOf(a.target.url) : a.target.kind === "dosya" ? a.target.file : a.target.kind === "ornek" ? "Örnek: " + a.target.fixture : "Yapıştırılan HTML");
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  const act = () => (state.s ? state.s.active : null);
  const isProposed = (a, t) => C.proposed(a, t);
  const NAME_SRC = { otomatik: "otomatik ad", degisken: "sayfadaki değişkenden", kullanici: "sizin adınız", mymind: "MyMind önerisi" };

  function swatch(value, large) {
    const p = C.parseColor(value);
    const box = el("span", { class: "dt-swatch" + (large ? " dt-swatch--lg" : "") + (p && p.a < 1 ? " dt-swatch--chk" : ""), "aria-hidden": "true" });
    const inner = el("span", { class: "dt-swatch__in" });
    inner.style.backgroundColor = value;
    box.appendChild(inner);
    return box;
  }
  function glyph(t) {
    const g = el("span", { class: "dt-glyph", "aria-hidden": "true" });
    if (t.cat === "fontFamily") { g.textContent = "Aa"; g.style.fontFamily = t.value; }
    else if (t.cat === "fontSize") g.textContent = String(Math.round(C.pxNum(t.value)));
    else if (t.cat === "fontWeight") { g.textContent = "B"; g.style.fontWeight = t.value; }
    else if (t.cat === "lineHeight") g.textContent = "↕";
    else if (t.cat === "letterSpacing") g.textContent = "↔";
    else if (t.cat === "space") g.textContent = String(Math.round(C.pxNum(t.value)));
    else if (t.cat === "radius") { g.textContent = ""; g.style.borderRadius = t.value === "50%" ? "50%" : Math.min(12, C.pxNum(t.value)) + "px"; g.style.borderColor = "var(--pl-accent)"; }
    else if (t.cat === "shadow") { g.textContent = ""; g.style.boxShadow = t.value; g.style.background = "var(--pl-bg-2)"; }
    return g;
  }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "scan";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const a = act();
    $("tokCount").textContent = String(a ? a.summary.ok : 0);
    $("scanCount").textContent = String(s.metrics.live);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    $("footer").textContent = "Design Token Scout " + s.version + " · PluginLabs · değerler yalnız taranan sayfadan gelir · yalnız onaylı tokenlar dışa aktarılır";
    const fx = s.metrics.fixture;
    put($("sideInfo"), el("div", { class: "dt-mini__in" },
      el("span", { class: "pl-muted dt-small", text: "Örnek sayfalarda ana değer kapsaması" }),
      el("b", { class: fx ? (fx.coverage >= 90 ? "is-ok" : "is-bad") : "", text: fx ? pctText(fx.coverage) : "—" }),
      el("span", { class: "pl-muted dt-small", text: fx ? fx.pages + " sayfa · tekrar düşüşü " + pctText(fx.reduction) : "Örnek sayfaları tarayınca ölçülür" })));
    if (state.view === "scan") renderScan();
    if (state.view === "history") renderHistory();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Tarama ----------------
  function renderScan() {
    const a = act();
    const none = !state.s.scans.length;
    $("emptyPanel").hidden = !none;
    $("resultPanel").hidden = none || !a;
    $("urlBtn").disabled = !!state.s.busy;
    if (!a) return;
    document.querySelectorAll("[data-tab]").forEach((b) => { b.classList.toggle("is-active", b.dataset.tab === state.tab); b.setAttribute("aria-checked", b.dataset.tab === state.tab ? "true" : "false"); });
    $("showFilter").hidden = state.tab === "degisken";
    $("showFilter").value = state.show;
    renderHead(a);
    if (state.tab === "degisken") renderVars(a); else renderTokens(a);
  }
  const saved = (r) => { if (!r.cancelled) toast("“" + r.file + "” kaydedildi (" + r.count + " onaylı token)."); };
  function renderHead(a) {
    const sm = a.summary;
    const where = a.finalUrl || a.target.url;
    const meta = el("div", { class: "dt-meta" },
      where ? btn(C.hostOf(where) || where, "pl-btn--ghost", async () => { await D.openLink(where); }, { title: where, id: "pageLink" }) : el("span", { text: a.target.kind === "dosya" ? "dosya: " + a.target.file : a.target.kind === "ornek" ? "uygulamayla gelen örnek sayfa" : "yapıştırılan HTML" }),
      el("span", { text: fmtWhen(a.createdAt) }),
      el("span", { text: a.viewport.w + "×" + a.viewport.h + " · betikler " + (a.scripts ? "açık" : "kapalı") + " · " + a.counts.sampled + " öğe örneklendi" + (a.counts.capped ? " (üst sınır)" : "") + " · " + a.durationMs + " ms" }),
      badge("ΔE ≤ " + a.tol.colorTol + " · ≤ " + String(a.tol.numTol).replace(".", ",") + " px · eşik " + a.tol.minUses, "", "Birleştirme ayarı"),
      a.counts.blockedSheets ? badge(a.counts.blockedSheets + " stil sayfası okunamadı", "warning", "Başka alan adından gelen stil sayfalarındaki değişken ve durum kuralları okunamaz") : null,
      a.live ? badge("sayfa açık", "success", "Kullanım yerlerini görüntüde gösterebilirsiniz") : badge("sayfa kapalı", "", "Öğeyi görmek için yeniden tarayın"));
    const chip = (v, label, cls) => el("span", { class: "dt-chip" + (cls ? " " + cls : "") }, el("b", { text: v }), label);
    const chips = el("div", { class: "dt-chips", id: "chips" },
      chip(String(sm.raw), "ham değer"), chip(String(sm.proposed), "önerilen token", "is-acc"), chip(String(sm.ok), "onaylı", sm.ok ? "is-good" : ""),
      chip(pctText(sm.reduction), "tekrar düşüşü"), chip(pctText(sm.ok ? sm.coverage : sm.proposedCoverage), sm.ok ? "onaylılarla kapsama" : "önerilenlerle kapsama"),
      sm.grid ? chip(sm.grid.base + " px", "boşluk ızgarası") : null, sm.scale ? chip(String(sm.scale.ratio).replace(".", ","), "yazı ölçeği oranı") : null,
      chip(String(sm.vars), "sayfa değişkeni"), chip(String(sm.states), "durum kuralı"));
    const fe = a.fixtureEval ? el("p", { class: "dt-note", id: "fixtureEval" }, el("b", { text: "Örnek sayfa doğrulaması: " }), a.fixtureEval.hit + "/" + a.fixtureEval.expected + " beklenen ana değer önerilerde (" + pctText(a.fixtureEval.coverage) + "); birleşmesi gereken " + a.fixtureEval.pairs + " yakın renk çiftinin " + a.fixtureEval.merged + "'i birleşti" + (a.fixtureEval.missed.length ? "; kaçırılan: " + a.fixtureEval.missed.join(", ") : "") + ".") : null;
    const ai = a.ai ? el("div", { class: "dt-block dt-block--ai", id: "aiBox" },
      el("div", { class: "dt-row" }, icon("spark", "16"), el("span", { class: "dt-lbl", text: "MyMind ad önerileri · " + a.ai.suggestions.length + " öneri · " + fmtWhen(a.ai.at) + (a.ai.applied ? " · uygulandı" : "") })),
      ...a.ai.suggestions.slice(0, 12).map((x) => el("div", { class: "dt-ai-row" }, el("span", { text: x.from }), el("span", { text: "→" }), el("b", { text: x.name, title: x.why || "" }))),
      a.ai.suggestions.length > 12 ? el("span", { class: "dt-note", text: "+" + (a.ai.suggestions.length - 12) + " öneri daha" }) : null,
      el("span", { class: "dt-note", text: "Model yalnız ad önerdi; değerler değişmedi." + (a.ai.dropped ? " " + a.ai.dropped + " geçersiz ya da bilinmeyen öneri atıldı." : "") }),
      a.ai.applied ? null : el("div", { class: "dt-row" }, btn("Önerileri uygula", "pl-btn--secondary", async () => { const r = await D.ai.apply(a.id); apply(r.state); toast(r.count + " token yeniden adlandırıldı."); }, { id: "aiApply" }), btn("Vazgeç", "pl-btn--ghost", async () => apply(await D.ai.discard(a.id))))) : null;
    const row1 = el("div", { class: "dt-row" },
      btn("Önerilenleri onayla", "pl-btn--primary", async () => { const r = await D.token.approveProposed(a.id); apply(r.state); toast(r.count + " token onaylandı."); }, { id: "approveAll" }),
      btn("Onayları kaldır", "pl-btn--ghost", async () => apply(await D.token.clear(a.id)), { id: "clearAll", disabled: !sm.ok }),
      btn("Yeniden öner", "pl-btn--ghost", async () => { const r = await D.token.rebuild(a.id); state.sel = null; apply(r.state); toast("Güncel birleştirme ayarlarıyla " + r.tokens + " aday önerildi."); }, { id: "rebuildBtn", title: "Ayarlardaki birleştirme değerleriyle yeniden kümeler; ad ve onay düzenlemeleri sıfırlanır" }),
      btn("MyMind ile adlandır", "pl-btn--secondary", async () => { busy("MyMind çalışıyor…"); const r = await D.ai.name(a.id); busy(null); if (!r.approved) return toast("İstek gönderilmedi (onay verilmedi)."); apply(r.state); toast(r.count + " ad önerisi geldi" + (r.dropped ? " (" + r.dropped + " öneri atıldı)" : "") + "."); }, { id: "aiBtn" }),
      el("span", { class: "dt-grow" }),
      btn("Token JSON", "pl-btn--secondary", async () => saved(await D.exportJson(a.id)), { id: "jsonBtn", title: "W3C Design Tokens (DTCG) biçimi — yalnız onaylı tokenlar" }),
      btn("CSS", "pl-btn--ghost", async () => saved(await D.exportCss(a.id)), { id: "cssBtn" }),
      btn("Rapor", "pl-btn--ghost", async () => saved(await D.exportMd(a.id)), { id: "mdBtn" }),
      btn("Yeniden tara", "pl-btn--ghost", async () => { busy("Taranıyor…"); const r = await D.scan.rerun(a.id); busy(null); if (r.approved === false) return toast("Sayfa açılmadı (onay verilmedi)."); state.sel = null; apply(r.state); toast(r.raw + " ham değer, " + r.tokens + " aday."); }, { id: "rerunBtn" }),
      a.status === "arsiv" ? btn("Arşivden geri al", "pl-btn--ghost", async () => apply(await D.scan.restore(a.id))) : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.scan.archive(a.id)); toast("Tarama arşive alındı."); }, { id: "archiveBtn" }));
    put($("scanHead"), el("h2", { class: "pl-h3", text: pageName(a) }), meta, chips, fe, ai, el("p", { class: "dt-note", text: C.DISCLAIMER }), row1);
  }

  function tokenItem(a, t) {
    const li = el("li", { class: "dt-titem" + (state.sel === t.id ? " is-sel" : "") + (isProposed(a, t) ? "" : " is-rare"), tabindex: "0", role: "option", "data-id": t.id, "aria-selected": state.sel === t.id ? "true" : "false" });
    const cb = el("input", { type: "checkbox", checked: t.ok, "aria-label": t.name + " onayla", title: "Dışa aktarmaya al" });
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", guard(async () => apply(await D.token.approve(a.id, t.id, cb.checked))));
    li.append(cb, t.cat === "color" ? swatch(t.value) : glyph(t),
      el("div", { class: "dt-item__body" }, el("span", { class: "dt-tname", text: t.name }), el("span", { class: "dt-tval", text: t.value + (t.members.length > 1 ? " · +" + (t.members.length - 1) + " birleşen" : "") + (t.varName ? " · " + t.varName : "") })),
      el("span", { class: "dt-uses", text: "×" + t.uses }));
    li.addEventListener("click", () => { state.sel = t.id; state.shot = null; renderScan(); $("rightDetail").scrollTop = 0; });
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); li.click(); } if (e.key === " ") { e.preventDefault(); cb.click(); } });
    return li;
  }
  function renderTokens(a) {
    const cats = C.GROUPS[state.tab] || [];
    const items = [];
    for (const cat of cats) {
      const all = a.tokens.filter((t) => t.cat === cat);
      const list = all.filter((t) => !state.show || (state.show === "oneri" ? isProposed(a, t) : t.ok));
      if (!all.length) continue;
      items.push(el("li", { class: "dt-group" }, el("span", { text: C.CATS[cat].ad }), badge(all.filter((t) => isProposed(a, t)).length + " öneri"), badge(all.filter((t) => t.ok).length + " onaylı", "success"), badge(a.summary.byCat[cat].raw + " ham")));
      for (const t of list) items.push(tokenItem(a, t));
    }
    if (state.tab === "renk" && a.aliases.length) {
      items.push(el("li", { class: "dt-group" }, el("span", { text: "Anlamsal takma adlar" }), badge(String(a.aliases.length))));
      for (const al of a.aliases) {
        const ref = a.tokens.find((t) => t.id === al.ref);
        if (!ref) continue;
        const cb = el("input", { type: "checkbox", checked: al.ok, "aria-label": al.name + " dışa aktarmaya al" });
        cb.addEventListener("change", guard(async () => apply(await D.token.approve(a.id, al.id, cb.checked))));
        items.push(el("li", { class: "dt-alias", "data-alias": al.name }, cb, el("div", { class: "dt-item__body" }, el("span", { class: "dt-tname", text: al.name + " → " + ref.name }), el("span", { class: "dt-tval", text: al.reason + (ref.ok ? "" : " · gösterdiği token onaylı değil, dışa aktarılmaz") }))));
      }
    }
    put($("leftList"), ...(items.length ? items : [el("li", { class: "dt-empty", text: "Bu grupta aday bulunamadı." })]));
    const t = a.tokens.find((x) => x.id === state.sel && cats.includes(x.cat));
    put($("rightDetail"), t ? tokenDetail(a, t) : el("div", { class: "dt-stack" },
      el("p", { class: "dt-small", text: "Soldan bir aday seçin: birleşen ham değerleri, kullanım yerlerini ve adını görürsünüz. Kutucuk tokenı dışa aktarmaya alır (Boşluk tuşu)." }),
      el("p", { class: "dt-note", text: "Soluk satırlar öneri eşiğinin (" + a.tol.minUses + " kullanım) altındaki seyrek değerlerdir; çoğu zaman sistem dışı tek seferlik değerlerdir. Sayfa değişkeninde tanımlı, sayfa gövdesine ait ya da başlık boyutu olan değerler seyrek olsa da önerilir." })));
  }
  function shotBox(sel) {
    if (!state.shot || state.shot.sel !== sel) return null;
    const r = state.shot.r;
    const wrap = el("div", { class: "dt-shot", id: "shot" });
    const img = el("img", { src: r.image, alt: "Sayfanın görüntüsü; seçili öğe sarı çerçeveyle işaretli" });
    wrap.appendChild(img);
    const place = () => {
      const k = img.clientWidth / r.rect.vw;
      if (!k) return;
      const box = el("div", { class: "dt-box", "aria-hidden": "true" });
      box.style.left = Math.max(0, r.rect.x * k - 3) + "px"; box.style.top = Math.max(0, r.rect.y * k - 3) + "px";
      box.style.width = Math.max(8, r.rect.w * k + 6) + "px"; box.style.height = Math.max(8, r.rect.h * k + 6) + "px";
      wrap.appendChild(box);
      wrap.dataset.ready = "1";
      wrap.scrollIntoView({ block: "nearest" });
    };
    if (img.complete) setTimeout(place, 0); else img.addEventListener("load", place);
    return wrap;
  }
  function preview(a, t) {
    if (t.cat === "color") return swatch(t.value, true);
    const sampleText = "Tasarım tokenları — Aa Bb Çç Ğğ 0123";
    if (["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"].includes(t.cat)) {
      const p = el("p", { class: "dt-sample-text", text: t.cat === "lineHeight" ? sampleText + " · " + sampleText + " · " + sampleText : sampleText });
      if (t.cat === "fontFamily") p.style.fontFamily = t.value;
      if (t.cat === "fontSize") p.style.fontSize = Math.min(64, C.pxNum(t.value)) + "px";
      if (t.cat === "fontWeight") p.style.fontWeight = t.value;
      if (t.cat === "lineHeight") p.style.lineHeight = t.value;
      if (t.cat === "letterSpacing") p.style.letterSpacing = t.value;
      return p;
    }
    if (t.cat === "space") { const b = el("div", { class: "dt-sample-space", title: t.value }); b.style.width = Math.min(400, C.pxNum(t.value)) + "px"; return b; }
    const b = el("div", { class: "dt-sample-box" });
    if (t.cat === "radius") b.style.borderRadius = t.value === "50%" ? "50%" : t.value;
    if (t.cat === "radius" && t.value === "50%") b.style.width = "56px";
    if (t.cat === "shadow") { b.style.boxShadow = t.value; b.style.borderStyle = "none"; b.style.background = "#ffffff"; b.style.margin = "8px"; }
    return b;
  }
  function tokenDetail(a, t) {
    const input = el("input", { class: "pl-input", id: "nameInput", value: t.name, maxlength: "120", spellcheck: "false", "aria-label": "Token adı" });
    const saveName = async () => { if (input.value.trim() === t.name) return; apply(await D.token.rename(a.id, t.id, input.value)); toast("Ad kaydedildi."); };
    input.addEventListener("keydown", guard(async (e) => { if (e.key === "Enter") { e.preventDefault(); await saveName(); } }));
    const roles = Object.entries(t.roles).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]).map(([r, n]) => (C.ROLE_AD[r] || r) + " " + n).join(" · ");
    const text = a.aliases.find((x) => x.name === "color.text.default"), surf = a.aliases.find((x) => x.name === "color.surface.default");
    const tv = text && a.tokens.find((x) => x.id === text.ref), sv = surf && a.tokens.find((x) => x.id === surf.ref);
    const ratio = t.cat === "color" ? (t.roles.metin && sv && sv.id !== t.id ? { on: sv, r: C.contrast(t.value, sv.value) } : tv && tv.id !== t.id ? { on: tv, r: C.contrast(tv.value, t.value) } : null) : null;
    return el("div", { class: "dt-stack" },
      el("div", { class: "dt-row" }, badge(C.CATS[t.cat].ad, "accent"), badge(NAME_SRC[t.nameSource] || "ad"), t.ok ? badge("onaylı", "success") : isProposed(a, t) ? badge("öneri") : badge("seyrek", "", "Öneri eşiğinin altında"), t.anchor ? badge(C.ANCHOR_AD[t.anchor], "", "Eşiğin altında kalsa da yapısal değer olduğu için önerilir") : null),
      preview(a, t),
      el("div", { class: "dt-namerow" }, input, btn("Adı kaydet", "pl-btn--secondary", saveName, { id: "nameSave" })),
      el("dl", { class: "dt-kv" },
        el("dt", { text: "Değer" }), el("dd", { class: "dt-sel", id: "tokValue", text: t.value }),
        el("dt", { text: "CSS değişkeni" }), el("dd", { class: "dt-sel", text: C.cssVar(t.name) }),
        el("dt", { text: "Kullanım" }), el("dd", { text: t.uses + " kez" + (roles ? " (" + roles + ")" : "") }),
        t.varName ? el("dt", { text: "Sayfadaki değişken" }) : null, t.varName ? el("dd", { class: "dt-sel", text: t.varName }) : null,
        ratio && ratio.r ? el("dt", { text: "Kontrast" }) : null, ratio && ratio.r ? el("dd", { text: String(ratio.r).replace(".", ",") + ":1 — " + ratio.on.name + " ile (bilgi amaçlı)" }) : null),
      t.members.length > 1 ? el("div", { class: "dt-stack" }, el("span", { class: "dt-lbl", text: "Birleşen ham değerler (" + t.members.length + ")" }),
        el("div", { class: "dt-members", id: "members" }, ...t.members.map((m) => el("span", { class: "dt-member" }, t.cat === "color" ? swatch(m.value) : null, m.value + " ×" + m.uses))),
        el("span", { class: "dt-note", text: "Token değeri, kümenin en çok kullanılan üyesidir; yeni bir değer üretilmez." })) : null,
      t.samples.length ? el("div", { class: "dt-stack" }, el("span", { class: "dt-lbl", text: "Örnek kullanım yerleri" }),
        ...t.samples.map((sel) => el("div", { class: "dt-srcrow" }, el("span", { class: "dt-sel dt-grow", text: sel }), btn("Öğeyi göster", "pl-btn--ghost", async () => { busy("Öğe gösteriliyor…"); const r = await D.token.show(a.id, sel); busy(null); state.shot = { sel, r }; renderScan(); }, { "data-show": sel, disabled: !a.live, title: a.live ? "" : "Sayfa kapalı — yeniden tarayın" }))),
        state.shot && t.samples.includes(state.shot.sel) ? shotBox(state.shot.sel) : null) : el("p", { class: "dt-note", text: "Bu değer yalnız stil sayfasındaki durum kurallarından (:hover/:focus…) geldi." }),
      el("div", { class: "dt-actions" }, btn(t.ok ? "Onayı kaldır" : "Onayla", t.ok ? "pl-btn--ghost" : "pl-btn--primary", async () => apply(await D.token.approve(a.id, t.id, !t.ok)), { id: "approveOne" })));
  }
  function renderVars(a) {
    const items = [el("li", { class: "dt-group" }, el("span", { text: "Sayfada :root/html üzerinde tanımlı CSS değişkenleri" }), badge(String(a.vars.length)))];
    for (const v of a.vars) {
      const c = C.normColor(v.value);
      const used = a.tokens.find((t) => t.varName === v.name);
      items.push(el("li", { class: "dt-titem" }, el("span", {}), c ? swatch(c) : el("span", { class: "dt-glyph", text: "--" }), el("div", { class: "dt-item__body" }, el("span", { class: "dt-tname", text: v.name }), el("span", { class: "dt-tval", text: v.value })), el("span", { class: "dt-uses", text: used ? "→ " + used.name : "" })));
    }
    if (a.states.length) {
      items.push(el("li", { class: "dt-group" }, el("span", { text: "Durum kuralları" }), badge(String(a.states.length))));
      for (const s of a.states.slice(0, 120)) items.push(el("li", { class: "dt-titem" }, el("span", {}), s.prop === "box-shadow" ? el("span", { class: "dt-glyph", text: "▢" }) : swatch(s.value), el("div", { class: "dt-item__body" }, el("span", { class: "dt-tname", text: ":" + s.state + " · " + s.prop }), el("span", { class: "dt-tval", text: s.selector + " — " + s.value })), el("span", {})));
    }
    put($("leftList"), ...items);
    put($("rightDetail"), el("div", { class: "dt-stack" },
      el("p", { class: "dt-small", text: a.vars.length ? a.vars.length + " değişken bulundu. Değeri bir token adayıyla aynı olan değişkenin adı, o tokenın önerilen adına dönüştürülür (sayfanın kendi sistemi korunur)." : "Sayfada okunabilen bir stil sayfasında :root/html üzerinde CSS değişkeni tanımı bulunmadı." }),
      el("p", { class: "dt-small", text: a.states.length ? a.states.length + " durum kuralı (:hover, :focus, :active, :disabled…) örneklendi; renkleri renk adaylarına “durum” rolüyle eklendi ve durum takma adları önerildi." : "Okunabilen durum kuralı (:hover/:focus…) bulunmadı." }),
      a.counts.blockedSheets ? el("p", { class: "dt-warn", text: a.counts.blockedSheets + " stil sayfası başka alan adından geldiği için okunamadı; bu sayfalardaki değişkenler ve durum kuralları listede yok (görünür öğelerin hesaplanmış stilleri yine de tarandı)." }) : null));
  }

  // ---------------- Geçmiş ----------------
  function renderHistory() {
    document.querySelectorAll("[data-hf]").forEach((b) => { b.classList.toggle("is-active", b.dataset.hf === state.hf); b.setAttribute("aria-checked", b.dataset.hf === state.hf ? "true" : "false"); });
    const q = C.fold(state.q || "");
    const list = state.s.scans.filter((a) => a.status === state.hf && (!q || C.fold(pageName(a) + " " + (a.finalUrl || a.target.url || "")).includes(q)));
    put($("histList"), ...(list.length ? list.map((a) => {
      const sm = a.summary;
      const li = el("li", { class: "dt-item", tabindex: "0", "data-id": a.id },
        el("span", {}, icon("drop", "16")),
        el("div", { class: "dt-item__body" }, el("span", { class: "dt-ititle", text: pageName(a) }),
          el("div", { class: "dt-imeta" }, badge(sm.raw + " ham değer"), badge(sm.proposed + " öneri", "accent"), sm.ok ? badge(sm.ok + " onaylı", "success") : null, badge("tekrar düşüşü " + pctText(sm.reduction))),
          el("span", { class: "dt-src", text: (a.finalUrl || a.target.url ? C.hostOf(a.finalUrl || a.target.url) + " · " : "") + fmtWhen(a.createdAt) })));
      li.addEventListener("click", guard(async () => { state.sel = null; state.shot = null; apply(await D.scan.open(a.id)); go("scan"); }));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter") li.click(); });
      return li;
    }) : [el("li", { class: "dt-empty", text: state.hf === "arsiv" ? "Arşiv boş." : "Henüz tarama yok." })]));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics, fx = m.fixture;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(fx ? pctText(fx.coverage) : "—", "örnek sayfalarda ana değer kapsaması (hedef ≥%90)", fx ? (fx.coverage >= 90 ? "is-ok" : "is-bad") : ""),
      card(fx ? pctText(fx.minPage) : "—", "en düşük sayfa kapsaması", fx ? (fx.minPage >= 90 ? "is-ok" : "is-bad") : ""),
      card(fx ? fx.merged + "/" + fx.pairs : "—", "birleşmesi gereken yakın renk çifti", fx && fx.merged === fx.pairs ? "is-ok" : ""),
      card(fx ? pctText(fx.reduction) : pctText(m.avgReduction), fx ? "örneklerde tekrar düşüşü" : "ortalama tekrar düşüşü"),
      card(String(m.scans), "tarama (" + m.urlScans + " adres · " + m.fileScans + " dosya · " + m.pasteScans + " yapıştırma · " + m.sampleScans + " örnek)"),
      card(String(m.tokens), "onaylı token (açık taramalarda)"),
      card(String(m.exports), "dışa aktarma"),
      card(String(m.aiRuns), "MyMind önerisi (" + m.aiDropped + " öneri atıldı, " + m.aiApplied + " ad uygulandı)"));
    $("fixtureInfo").textContent = fx ? fx.pages + " örnek sayfada " + fx.expected + " beklenen ana değerin " + fx.hit + "'i önerilen tokenlarda bulundu; " + fx.pairs + " yakın renk çiftinden " + fx.merged + "'i tek tokena birleşti. Ölçüm uygulamayla gelen örneklerde yapılır; gerçek sitelerde kapsama sayfaya göre değişir." : "“Örnek sayfalar” ile ana değerleri önceden yazılı 5 sayfayı tarayınca kapsama burada ölçülür.";
    for (const [id, key] of [["setColorTol", "colorTol"], ["setNumTol", "numTol"], ["setMinUses", "minUses"], ["setWidth", "width"], ["setWait", "wait"]]) if (document.activeElement !== $(id)) $(id).value = String(s.settings[key]);
    $("setScripts").checked = s.settings.scripts;
    $("setRemote").checked = s.settings.remote;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Taramalar, ayarlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: taramalar düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  const started = (r, what) => { busy(null); if (!r || r.cancelled) return; if (r.approved === false) return toast("Sayfa açılmadı (onay verilmedi)."); state.sel = null; state.shot = null; state.tab = "renk"; apply(r.state); go("scan"); toast(what(r)); };
  const found = (r) => r.raw + " ham değerden " + r.tokens + " token adayı önerildi.";
  $("urlForm").addEventListener("submit", guard(async (e) => { e.preventDefault(); const v = $("urlInput").value; if (!v.trim()) return toast("Taranacak sayfanın adresini yazın.", true); busy("Sayfa açılıyor ve taranıyor…"); started(await D.scan.url(v), found); }));
  document.querySelectorAll('[data-act="file"]').forEach((b) => b.addEventListener("click", guard(async () => { busy("Taranıyor…"); started(await D.scan.file(), found); })));
  document.querySelectorAll('[data-act="samples"]').forEach((b) => b.addEventListener("click", guard(async () => { busy("Örnek sayfalar taranıyor…"); started(await D.scan.samples(), (r) => r.pages + " örnek sayfa tarandı."); })));
  document.querySelectorAll('[data-act="paste"]').forEach((b) => b.addEventListener("click", () => { $("pasteText").value = ""; $("pasteDialog").showModal(); $("pasteText").focus(); }));
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteRun").addEventListener("click", guard(async () => { const v = $("pasteText").value; if (!v.trim()) return toast("HTML yapıştırın.", true); $("pasteDialog").close(); busy("Taranıyor…"); started(await D.scan.paste(v), found); }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.sel = null; state.shot = null; renderScan(); }));
  $("showFilter").addEventListener("change", () => { state.show = $("showFilter").value; renderScan(); });
  document.querySelectorAll("[data-hf]").forEach((b) => b.addEventListener("click", () => { state.hf = b.dataset.hf; renderHistory(); }));
  $("q").addEventListener("input", () => { state.q = $("q").value; renderHistory(); });
  $("setScripts").addEventListener("change", guard(async () => apply(await D.setSettings({ scripts: $("setScripts").checked }))));
  $("setRemote").addEventListener("change", guard(async () => apply(await D.setSettings({ remote: $("setRemote").checked }))));
  for (const [id, key] of [["setColorTol", "colorTol"], ["setNumTol", "numTol"], ["setMinUses", "minUses"], ["setWidth", "width"], ["setWait", "wait"]]) $(id).addEventListener("change", guard(async () => apply(await D.setSettings({ [key]: Number($(id).value) }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
    if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); go("scan"); $("urlInput").focus(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go("scan"); document.documentElement.dataset.ready = "1"; });
})();
