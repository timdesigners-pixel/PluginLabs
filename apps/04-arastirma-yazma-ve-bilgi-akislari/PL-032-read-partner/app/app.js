/* Read Partner — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; belge metni asla HTML olarak yorumlanmaz).
 * Arayüz ağa ve dosya sistemine erişmez; açıklamalar ana süreçte hesaplanır, burada yalnız gösterilir. MyMind istekleri ana süreçte onaydan geçer. */
(function () {
  const D = window.rpDesktop;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["read", "library", "settings"];
  const LEVEL_NAMES = { baslangic: "Başlangıç", orta: "Orta", ileri: "İleri" };
  const state = { s: null, view: "read", sel: null, exact: "", anchor: null, level: null, tab: "simple", local: null, ai: null, explId: null, aiExplId: null, askRes: null, aiAsk: null, termRes: [], docId: null };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
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
    setTimeout(() => t.remove(), 5000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const rangeLabel = (r) => (r ? "¶" + r[0] + (r[1] > r[0] ? "–" + r[1] : "") : "");
  const fmtDate = (t) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const KIND = { paste: "metin", txt: "txt", md: "md", html: "html" };

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "read";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }
  function scrollToPara(p) {
    const n = document.querySelector('.rp-para[data-p="' + p + '"]');
    if (!n) return;
    go("read");
    n.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    n.classList.add("is-flash");
    setTimeout(() => n.classList.remove("is-flash"), 1600);
  }
  const ref = (p) => { const b = el("button", { type: "button", class: "rp-ref", text: "¶" + p, title: "Kaynağa git: paragraf " + p }); b.addEventListener("click", () => scrollToPara(p)); return b; };

  // ---------------- Durum ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    document.documentElement.style.setProperty("--rp-font", s.settings.fontSize + "px");
    document.documentElement.style.setProperty("--rp-line", String(s.settings.lineHeight));
    if (!state.level) state.level = s.settings.level;
    $("libCount").textContent = String(s.docs.length);
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    const cur = s.current;
    if (!cur || cur.id !== state.docId) resetSelection(cur);
    put($("sideDoc"), cur ? el("div", { class: "rp-mini__in" }, el("span", { class: "pl-muted rp-small", text: "Açık belge" }), el("b", { text: cur.title }), el("span", { class: "pl-muted rp-small", text: cur.paragraphs.length + " paragraf · " + cur.explanations.length + " açıklama" })) : el("span", { class: "pl-muted rp-small", text: "Açık belge yok" }));
    $("sideDoc").hidden = false;
    renderReader();
    renderLibrary();
    renderSettings();
  }
  function resetSelection(cur) {
    state.docId = cur ? cur.id : null;
    state.sel = cur && cur.lastRange ? cur.lastRange.slice() : null;
    state.exact = "";
    state.local = null; state.ai = null; state.explId = null; state.aiExplId = null; state.askRes = null; state.aiAsk = null; state.termRes = [];
    if (cur && cur.explanations.length) {
      // Son yerel ve MyMind açıklamaları geri yüklenir (yeniden açılışta panel boş kalmaz).
      const last = (src) => cur.explanations.slice().reverse().find((e) => e.source === src);
      const lo = last("yerel"), ai = last("mymind");
      if (lo && lo.result) { state.local = { range: lo.range, ...lo.result }; state.explId = lo.id; state.sel = lo.range.slice(); }
      if (ai && ai.result && (!lo || ai.at >= lo.at)) { state.ai = { range: ai.range, ...ai.result }; state.aiExplId = ai.id; }
    }
    state.lastDocRender = null;
  }

  // ---------------- Okuma ----------------
  function renderReader() {
    const cur = state.s.current;
    $("readEmpty").hidden = !!cur;
    $("reader").hidden = !cur;
    if (!cur) return;
    $("docTitle").textContent = cur.title;
    $("docTitle").title = cur.title;
    const r = cur.readability;
    $("docMeta").textContent = cur.paragraphs.length + " paragraf · " + r.words + " kelime · ortalama cümle " + r.avgWords + " kelime · ~" + Math.max(1, Math.round(r.words / 200)) + " dk okuma";
    $("readScore").textContent = "Okunabilirlik " + (r.score == null ? "—" : r.score + " · " + r.level);
    $("readScore").className = "pl-badge" + (r.score != null && r.score < 50 ? " pl-badge--warning" : "");
    const inj = cur.injections;
    $("injWarn").hidden = !inj.length;
    if (inj.length) put($("injWarn"), icon("alert"), el("div", {}, el("div", { class: "pl-callout__title", text: "Metinde " + inj.length + " sayfa içi talimat bulundu" }), el("span", { text: "Bu cümleler güvenilmeyen veri sayılır: uygulanmaz, açıklamalarda yalnız içerik olarak ele alınır. " }), ...inj.slice(0, 3).map((x) => ref(x.p))));
    // Belge yalnız değiştiğinde yeniden çizilir (seçim ve kaydırma korunur).
    const sig = cur.id + ":" + cur.paragraphs.length;
    if (state.lastDocRender !== sig) {
      const injSet = new Map(inj.map((x) => [x.p, x.rule]));
      put($("doc"), ...cur.paragraphs.map((t, i) => {
        const p = i + 1;
        const b = el("button", { type: "button", class: "rp-pno", text: "¶" + p, "aria-label": "Paragraf " + p + "'i seç", "data-p": String(p) });
        const body = el("p", { text: t });
        const box = el("div", { class: "rp-para" + (injSet.has(p) ? " is-inj" : ""), "data-p": String(p) }, b, el("div", {}, body, injSet.has(p) ? el("span", { class: "rp-injtag", text: "⚠ Sayfa içi talimat (" + injSet.get(p) + ") — güvenilmeyen veri, uygulanmaz" }) : null));
        return box;
      }));
      state.lastDocRender = sig;
    }
    document.querySelectorAll(".rp-para").forEach((n) => { const p = Number(n.dataset.p); n.classList.toggle("is-sel", !!state.sel && p >= state.sel[0] && p <= state.sel[1]); });
    $("selLabel").textContent = state.sel ? "Seçim: " + rangeLabel(state.sel) + (state.exact ? " · seçili metin (" + state.exact.length + " karakter)" : "") : "Seçim yok";
    $("explainBtn").disabled = !state.sel;
    $("aiBtn").disabled = !state.sel;
    document.querySelectorAll("[data-level]").forEach((b) => { const on = b.dataset.level === state.level; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    document.querySelectorAll("[data-tab]").forEach((b) => { const on = b.dataset.tab === state.tab; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    renderTab();
    renderRate();
  }
  function setSel(a, b, exact) {
    state.sel = [Math.min(a, b), Math.max(a, b)];
    state.exact = exact || "";
    renderReader();
  }
  const placeholder = (text) => el("p", { class: "rp-placeholder", text });
  function aiHead(title, r) {
    return el("div", { class: "rp-ai__head" }, icon("spark"), el("b", { text: title }), r ? el("span", { class: "pl-muted rp-small", text: rangeLabel(r.range) + " · " + LEVEL_NAMES[r.level || state.level] }) : null, el("span", { class: "rp-grow" }),
      r && r.claims ? badge(r.unsupported ? r.unsupported + "/" + r.claims + " desteklenmeyen" : r.claims + "/" + r.claims + " kaynaklı", r.unsupported ? "warning" : "success") : null);
  }
  const sup = (x) => (x.supported ? badge("kaynakta var", "success") : badge("desteklenmeyen — kaynakta bulunamadı", "warning"));

  function renderTab() {
    const body = $("tabBody");
    const L = state.local, A = state.ai;
    if (state.tab === "ask") return renderAsk(body);
    if (!L && !A) return put(body, placeholder(state.sel ? "“Açıkla” ile seçili bölüm için sade anlatım, terimler ve 3 anlama sorusu hazırlanır. Hepsi bu bilgisayarda, metnin içinden." : "Önce soldaki metinden bir bölüm seçin."));
    const kids = [];
    if (state.tab === "simple") {
      if (L && L.simple) {
        const b = L.simple.before, a = L.simple.after;
        kids.push(el("div", { class: "rp-cmp" },
          el("div", {}, el("b", { text: b.score == null ? "—" : String(b.score) }), el("span", { text: "okunabilirlik (önce)" })),
          el("div", {}, el("b", { text: a.score == null ? "—" : String(a.score) }), el("span", { text: "okunabilirlik (sonra)" })),
          el("div", {}, el("b", { text: String(b.avgWords) }), el("span", { text: "kelime/cümle (önce)" })),
          el("div", {}, el("b", { text: String(a.avgWords) }), el("span", { text: "kelime/cümle (sonra)" }))));
        kids.push(el("p", { class: "pl-muted rp-small", text: "Yan yana: solda özgün cümle, sağda sade hâli. Kelimeler değiştirilmez; uzun cümleler bölünür, parantez içi ek bilgiler ayrı satıra alınır. " + rangeLabel(L.range) }));
        kids.push(el("ol", { class: "rp-sents" }, ...L.simple.rows.map((r) => r.changed
          ? el("li", { class: "rp-sent" }, el("div", { class: "rp-sent__orig", text: r.original }),
            el("div", { class: "rp-sent__new" }, ...r.parts.map((p) => el("span", { text: p })), ...r.notes.map((n) => el("span", { class: "rp-sent__note", text: "Ek bilgi: " + n }))))
          : el("li", { class: "rp-sent is-same" }, el("div", { class: "rp-sent__orig", text: r.original }), badge("zaten kısa")))));
      }
      if (A && A.simple) kids.unshift(el("div", { class: "rp-ai" }, aiHead("MyMind sade anlatım", A), el("p", { text: A.simple }), A.unknown && A.unknown.length ? el("div", { class: "rp-unknown" }, el("b", { text: "Metinden çıkarılamayan: " }), A.unknown.join(" · ")) : null));
    } else if (state.tab === "terms") {
      if (A && A.terms && A.terms.length) kids.push(el("div", { class: "rp-ai" }, aiHead("MyMind terim açıklamaları", A), el("ul", { class: "rp-terms" }, ...A.terms.map((t) => el("li", { class: "rp-term" }, el("div", { class: "rp-term__head" }, el("b", { text: t.term }), t.p ? ref(t.p) : null, el("span", { class: "rp-grow" }), sup(t)), el("span", { text: t.text }), t.quote ? el("p", { class: "rp-quote rp-small", text: "“" + t.quote + "”" }) : null)))));
      const list = (L ? L.terms : []).concat(state.termRes);
      kids.push(el("form", { class: "rp-askform", id: "termForm" }, el("input", { class: "pl-input", id: "termInput", maxlength: "80", placeholder: "Başka bir terimi metinde ara (ör. isabet oranı)", "aria-label": "Terim" }), el("button", { class: "pl-btn pl-btn--secondary pl-btn--sm", type: "submit", text: "Açıkla" })));
      if (!list.length) kids.push(placeholder("Seçimde terim adayı bulunamadı. Yukarıdan bir terim yazabilirsiniz."));
      else kids.push(el("ul", { class: "rp-terms" }, ...list.map(termItem)));
    } else if (state.tab === "questions") {
      if (A && A.questions && A.questions.length) kids.push(el("div", { class: "rp-ai" }, aiHead("MyMind anlama soruları", A), el("ol", { class: "rp-qs" }, ...A.questions.map((q, i) => qItem(i, q.q, q.answer, q.p, q.quote, q)))));
      if (L && L.questions) {
        kids.push(el("p", { class: "pl-muted rp-small", text: "Önce kendiniz yanıtlayın, sonra “Yanıtı göster” ile metindeki kaynağa bakın." }));
        kids.push(L.questions.length ? el("ol", { class: "rp-qs" }, ...L.questions.map((q, i) => qItem(i, q.q, q.answer, q.source && q.source.p, q.type === "tanım" || q.type === "ana fikir" ? "" : q.source.quote, null, q.type))) : placeholder("Bu seçimden soru üretilemedi; daha uzun bir bölüm seçin."));
        if (L.questions.length && L.questions.length < 3) kids.push(el("p", { class: "pl-muted rp-small", text: "Seçimde yalnız " + L.questions.length + " soru için yeterli cümle var." }));
      }
    }
    put(body, ...kids);
    const tf = $("termForm");
    if (tf) tf.addEventListener("submit", guard(async (e) => {
      e.preventDefault();
      const v = $("termInput").value.trim();
      if (!v) return;
      const r = await D.term(state.docId, v);
      state.termRes = [r].concat(state.termRes.filter((x) => x.term.toLowerCase() !== r.term.toLowerCase())).slice(0, 6);
      renderTab();
    }));
  }
  const STATUS = { "açılım": ["açılım", "success"], "tanım": ["metindeki tanım", "success"], "bağlam": ["metindeki bağlam", "info"], bilinmiyor: ["bilinmiyor — metinde tanım yok", "warning"] };
  function termItem(t) {
    const [label, tone] = STATUS[t.status] || ["?", ""];
    return el("li", { class: "rp-term" + (t.status === "bilinmiyor" ? " is-unknown" : "") },
      el("div", { class: "rp-term__head" }, el("b", { text: t.term }), t.expansion && t.status === "açılım" ? el("span", { text: "= " + t.expansion }) : null, el("span", { class: "rp-grow" }), badge(label, tone), t.source ? ref(t.source.p) : null),
      t.source ? el("p", { class: "rp-quote", text: t.source.quote }) : el("span", { class: "pl-muted rp-small", text: "Metnin hiçbir yerinde açıklanmıyor. Read Partner tahmin yürütmez; bu terimi başka bir kaynaktan doğrulayın." }));
  }
  function qItem(i, q, answer, p, quote, ai, type) {
    return el("li", { class: "rp-q" },
      el("div", { class: "rp-q__head" }, el("b", { text: (i + 1) + "." }), type ? badge(type) : null, el("span", { class: "rp-grow" }), p ? ref(p) : null, ai ? sup(ai) : null),
      el("span", { class: "rp-q__text", text: q }),
      el("details", {}, el("summary", { text: "Yanıtı göster" }), el("span", { text: answer }), quote && quote !== answer ? el("p", { class: "rp-quote rp-small", text: quote }) : null));
  }
  function renderAsk(body) {
    const kids = [el("form", { class: "rp-askform", id: "askForm" },
      el("input", { class: "pl-input", id: "askInput", maxlength: "300", placeholder: "Metne bir soru sorun (ör. TTL uzun tutulursa ne olur?)", "aria-label": "Soru", value: state.askQ || "" }),
      el("button", { class: "pl-btn pl-btn--primary pl-btn--sm", type: "submit", text: "Metinde ara" }),
      el("button", { class: "pl-btn pl-btn--ghost pl-btn--sm", type: "button", id: "askAi" }, icon("spark"), "MyMind'a sor"))];
    kids.push(el("p", { class: "pl-muted rp-small", text: "Yanıt yalnız bu belgeden gelir. Metinde karşılığı yoksa “bilinmiyor” denir; tahmin yürütülmez." }));
    const R = state.askRes;
    if (R) {
      if (R.found) kids.push(el("div", { class: "rp-stack" }, el("div", { class: "rp-term__head" }, badge("metinde bulundu", "success"), el("span", { class: "pl-muted rp-small", text: "En ilgili cümleler" })), el("ul", { class: "rp-hits" }, ...R.hits.map((h) => el("li", { class: "rp-hit" }, el("div", { class: "rp-term__head" }, ref(h.p), el("span", { class: "rp-grow" }), el("span", { class: "pl-muted rp-small", text: "eşleşme %" + Math.round(h.coverage * 100) })), el("span", { class: "rp-q__text", text: h.text }))))));
      else kids.push(el("div", { class: "rp-unknown" }, el("div", { class: "rp-term__head" }, badge("bilinmiyor", "warning"), el("b", { text: "Bu soru metinden yanıtlanamıyor." })), el("span", { class: "pl-muted rp-small", text: R.reason })));
    }
    const X = state.aiAsk;
    if (X) kids.push(el("div", { class: "rp-ai" }, aiHead("MyMind yanıtı", X.claims ? X : null),
      X.unknown ? el("div", { class: "rp-unknown" }, badge("bilinmiyor", "warning"), " MyMind bu sorunun yanıtının gönderilen paragraflarda olmadığını bildirdi.") : el("p", { text: X.answer }),
      ...(X.sources || []).map((s) => el("div", { class: "rp-term__head" }, s.p ? ref(s.p) : null, el("span", { class: "rp-small", text: s.quote ? "“" + s.quote + "”" : "" }), el("span", { class: "rp-grow" }), sup(s)))));
    put(body, ...kids);
    $("askForm").addEventListener("submit", guard(async (e) => {
      e.preventDefault();
      const q = $("askInput").value.trim();
      if (!q) return;
      state.askQ = q;
      state.askRes = await D.ask(state.docId, q);
      state.aiAsk = null;
      renderTab();
    }));
    $("askAi").addEventListener("click", guard(async () => {
      const q = $("askInput").value.trim();
      if (!q) return toast("Önce bir soru yazın.", true);
      if (!state.s.hasKey) return openMymind();
      state.askQ = q;
      busy("MyMind yanıtlıyor…");
      const r = await D.mymind.ask(state.docId, q);
      busy(null);
      if (!r.approved) return toast("Gönderilmedi.");
      state.aiAsk = r;
      renderTab();
    }));
  }
  function renderRate() {
    const id = state.tab === "ask" ? null : state.ai && state.tab !== "simple" ? state.aiExplId || state.explId : state.explId || state.aiExplId;
    const ex = id && state.s.current ? state.s.current.explanations.find((x) => x.id === id) : null;
    $("rateRow").hidden = !ex;
    if (!ex) return;
    put($("stars"), ...[1, 2, 3, 4, 5].map((n) => {
      const b = el("button", { type: "button", class: "rp-star" + (ex.rating && n <= ex.rating ? " is-on" : ""), role: "radio", "aria-checked": ex.rating === n ? "true" : "false", "aria-label": n + " / 5", text: String(n) });
      b.addEventListener("click", guard(async () => { state.s = await D.rate(state.docId, ex.id, n); render(); toast("Teşekkürler: " + n + "/5 kaydedildi."); }));
      return b;
    }));
  }

  // Seçim: ¶ düğmesi (Shift ile aralık) ya da fareyle metin seçimi
  $("doc").addEventListener("click", (e) => {
    const b = e.target.closest(".rp-pno");
    if (!b) return;
    const p = Number(b.dataset.p);
    if (e.shiftKey && state.anchor) setSel(state.anchor, p, "");
    else { state.anchor = p; setSel(p, p, ""); }
  });
  $("doc").addEventListener("mouseup", () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed) return;
    const text = s.toString().replace(/\s+/g, " ").trim();
    if (text.length < 12) return;
    const pa = (n) => { const x = (n && n.nodeType === 3 ? n.parentElement : n); const q = x && x.closest && x.closest(".rp-para"); return q ? Number(q.dataset.p) : null; };
    const a = pa(s.anchorNode), b = pa(s.focusNode);
    if (a && b) { state.anchor = a; setSel(a, b, text.slice(0, 6000)); }
  });
  $("doc").addEventListener("keydown", (e) => {
    if (!state.s || !state.s.current) return;
    const n = state.s.current.paragraphs.length;
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (!e.altKey) return;
    e.preventDefault();
    const cur = state.sel ? (e.key === "ArrowDown" ? state.sel[1] : state.sel[0]) : 0;
    const next = Math.max(1, Math.min(n, cur + (e.key === "ArrowDown" ? 1 : -1)));
    if (e.shiftKey && state.sel) setSel(state.anchor || state.sel[0], next, ""); else { state.anchor = next; setSel(next, next, ""); }
    scrollToPara(next);
  });
  document.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { state.level = b.dataset.level; renderReader(); }));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; renderReader(); }));
  $("explainBtn").addEventListener("click", guard(async () => {
    if (!state.sel) return;
    const r = await D.analyze(state.docId, state.sel[0], state.sel[1], state.exact, state.level);
    state.local = r; state.explId = r.explId; state.ai = null; state.aiExplId = null; state.termRes = [];
    if (state.tab === "ask") state.tab = "simple";
    renderReader();
    toast(rangeLabel(r.range) + " açıklandı: " + r.simple.rows.filter((x) => x.changed).length + " cümle sadeleşti, " + r.terms.length + " terim, " + r.questions.length + " soru.");
  }));
  $("aiBtn").addEventListener("click", guard(async () => {
    if (!state.sel) return;
    if (!state.s.hasKey) return openMymind();
    busy("MyMind açıklıyor…");
    const r = await D.mymind.explain(state.docId, state.sel[0], state.sel[1], state.level);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    state.ai = { ...r, level: state.level }; state.aiExplId = r.explId;
    if (state.tab === "ask") state.tab = "simple";
    renderReader();
    toast("MyMind açıklaması hazır" + (r.unsupported ? " — " + r.unsupported + " açıklama kaynakta bulunamadı ve işaretlendi." : "; tüm açıklamalar kaynaklı."));
  }));

  // ---------------- Kitaplık ----------------
  function renderLibrary() {
    const s = state.s;
    const q = $("libSearch").value.trim().toLocaleLowerCase("tr");
    const list = s.docs.filter((d) => !q || d.title.toLocaleLowerCase("tr").includes(q));
    if (!list.length) return put($("docs"), el("li", { class: "rp-empty", text: s.docs.length ? "Aramayla eşleşen belge yok." : "Kitaplık boş. Yukarıya bir metin yapıştırın ya da dosya açın." }));
    put($("docs"), ...list.map((d) => {
      const open = el("button", { type: "button", class: "pl-btn pl-btn--secondary pl-btn--sm", text: s.current && s.current.id === d.id ? "Açık" : "Oku" });
      open.addEventListener("click", guard(async () => { state.s = await D.openDoc(d.id); render(); go("read"); }));
      const del = el("button", { type: "button", class: "rp-icon-btn", title: "Sil", "aria-label": d.title + " belgesini sil" }, icon("x"));
      del.addEventListener("click", guard(async () => { if (!confirm("“" + d.title + "” ve açıklamaları silinsin mi?")) return; state.s = await D.removeDoc(d.id); render(); toast("Belge silindi."); }));
      return el("li", { class: "rp-docrow" + (s.current && s.current.id === d.id ? " is-current" : "") },
        el("span", { class: "rp-kind", text: KIND[d.kind] || d.kind }),
        el("div", { class: "rp-docrow__main" }, el("b", { text: d.title }), el("span", { class: "pl-muted rp-small", text: d.paragraphs + " paragraf · " + d.words + " kelime · " + d.explanations + " açıklama · " + fmtDate(d.createdAt) })),
        open, del);
    }));
  }
  $("libSearch").addEventListener("input", () => renderLibrary());
  $("pasteForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    const text = $("pasteText").value;
    if (!text.trim()) return toast("Önce bir metin yapıştırın.", true);
    const r = await D.addText($("pasteTitle").value, text);
    $("pasteText").value = ""; $("pasteTitle").value = "";
    toast("“" + r.title + "” eklendi: " + r.paragraphs + " paragraf.");
    go("read");
  }));
  document.addEventListener("click", guard(async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "goLibrary") { go("library"); $("pasteText").focus(); }
    if (act === "sample") { const r = await D.addSample(); toast("Örnek metin açıldı: " + r.paragraphs + " paragraf."); go("read"); }
    if (act === "openFile") { const r = await D.openFile(); if (r && !r.cancelled) { toast("“" + r.title + "” açıldı: " + r.paragraphs + " paragraf."); go("read"); } }
    if (act === "exportMd") { const r = await D.exportMarkdown(state.docId); if (r && !r.cancelled) toast(r.explanations + " açıklama Markdown olarak kaydedildi."); }
  }));

  // ---------------- Ayarlar ve ölçüler ----------------
  function renderSettings() {
    const s = state.s;
    document.querySelectorAll("#setLevel [data-v]").forEach((b) => { const on = b.dataset.v === s.settings.level; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $("setFont").value = String(s.settings.fontSize);
    $("setLine").value = String(s.settings.lineHeight);
    const st = s.stats;
    const m = (val, label, ok) => el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: val }), el("span", { text: label }));
    put($("metrics"),
      m(st.avg == null ? "—" : st.avg + "/5", "ortalama anlaşılırlık (" + st.ratings + " puan)", st.avg == null ? null : st.avg >= 4),
      m(st.good == null ? "—" : "%" + st.good, "4 ve üstü puan oranı", st.good == null ? null : st.good >= 75),
      m(st.unsupportedPct == null ? "—" : "%" + st.unsupportedPct, "desteklenmeyen iddia (" + st.unsupported + "/" + st.claims + ")", st.unsupportedPct == null ? null : st.unsupportedPct < 5),
      m(String(st.explanations), "açıklama", null),
      m(String(st.questionsAsked), "sorulan soru", null),
      m(String(st.unanswered), "“bilinmiyor” yanıtı", null));
    $("vaultInfo").textContent = s.vault ? "Kitaplık ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: kitaplık düz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }
  document.querySelectorAll("#setLevel [data-v]").forEach((b) => b.addEventListener("click", guard(async () => { state.s = await D.setSettings({ level: b.dataset.v }); state.level = b.dataset.v; render(); })));
  $("setFont").addEventListener("change", guard(async () => { state.s = await D.setSettings({ fontSize: Number($("setFont").value) }); render(); }));
  $("setLine").addEventListener("change", guard(async () => { state.s = await D.setSettings({ lineHeight: Number($("setLine").value) }); render(); }));

  // ---------------- MyMind ----------------
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı. Değiştirmek için yenisini yapıştırın." : "Anahtar henüz girilmedi.";
    $("mymindDialog").showModal();
  }
  $("openMymind").addEventListener("click", openMymind);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => {
    const r = await D.mymind.setKey($("mymindKey").value);
    $("mymindDialog").close();
    toast(r.stored === "vault" ? "Anahtar Windows kasasında şifreli saklandı." : "Anahtar bu oturum için bellekte tutuluyor.");
  }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); D.openFile().then((r) => { if (r && !r.cancelled) go("read"); }).catch((x) => toast(clean(x), true)); }
    if (e.ctrlKey && e.key === "Enter" && state.sel && !$("explainBtn").disabled) { e.preventDefault(); $("explainBtn").click(); }
  });
  D.onState((s) => { state.s = s; render(); });
  D.state().then((s) => {
    state.s = s;
    render();
    go(s.current ? "read" : "read");
    document.documentElement.dataset.ready = "1";
  });
})();
