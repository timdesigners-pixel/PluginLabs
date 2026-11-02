/* Parallel Translate — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; bunlar ana süreçte yapılır. Sözlük ve korunan alan denetimi
 * aynı çekirdeği (src/core.js, saf işlevler) kullanır ve yazarken canlı güncellenir. Çeviri isteği ana süreçte onaydan geçer. */
(function () {
  const D = window.ptDesktop;
  const C = window.PTCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["desk", "docs", "glossary", "settings"];
  const state = { s: null, view: "desk", dir: "auto", sel: null, rowsKey: "", docId: null, onlyIssues: false, termQ: "", showArchived: false };
  const timers = new Map();

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
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
    setTimeout(() => t.remove(), 6000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const fmtTime = (t) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const n = (x) => Number(x).toLocaleString("tr-TR");
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const doc = () => state.s && state.s.doc;
  const tgtLang = (d) => C.other(d.srcLang);
  const dirText = (src) => (src === "tr" ? "Türkçe → İngilizce" : "İngilizce → Türkçe");
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "desk";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }

  // ---------------- Durum ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    const active = s.docs.filter((d) => !d.archived);
    $("docCount").textContent = String(active.length);
    $("termCount").textContent = String(s.glossary.length);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const st = s.stats;
    put($("sideInfo"), el("div", { class: "pt-mini__in" },
      el("span", { class: "pl-muted pt-small", text: "Sözlük uyumu" }), el("b", { class: st.compliance == null ? "" : st.compliance >= 95 ? "is-ok" : "is-bad", text: pctText(st.compliance) }),
      el("span", { class: "pl-muted pt-small", text: st.termsTotal ? st.termsHit + "/" + st.termsTotal + " terim · " + st.done + " bölüm" : "Henüz terimli çeviri yok" }),
      el("span", { class: "pl-muted pt-small", text: s.hotkey ? "Seçim paneli: " + s.hotkey : "Seçim paneli kapalı" })));
    renderDesk();
    renderDocs();
    renderGlossary();
    renderSettings();
  }

  // ---------------- Başlangıç: metin al ----------------
  let liveTimer = null;
  function live() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(renderInputInfo, 150);
    const v = $("input").value;
    $("inCount").textContent = n(v.length) + " karakter · " + n(C.words(v).length) + " kelime";
  }
  function renderInputInfo() {
    const v = $("input").value;
    $("inLang").textContent = v.trim() ? "Tespit edilen dil: " + C.LANG_NAMES[C.detectLang(v)] + " · " + C.segment(v).length + " bölüm" : "";
    const sens = C.sensitiveSummary(v);
    $("sensWarn").hidden = !sens.length;
    if (sens.length) put($("sensWarn"), icon("lock"), el("div", {}, el("div", { class: "pl-callout__title", text: "Metinde gizli bilgi var: " + sens.map((x) => x.count + " " + x.label).join(", ") }), el("span", { text: "Bu değerler korunan alandır: çeviri motoruna gönderilmez (yer tutucu gider) ve çeviride aynen bulunması denetlenir." })));
  }
  function renderDir() {
    document.querySelectorAll("[data-dir]").forEach((b) => { const on = b.dataset.dir === state.dir; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
  }
  function setInput(text, msg) {
    $("input").value = text;
    live();
    renderInputInfo();
    if (state.s && state.s.doc) { state.s.doc = null; D.doc.open(null).then(apply).catch(() => {}); }
    showStart(true);
    go("desk");
    $("input").focus();
    if (msg) toast(msg);
  }
  function showStart(on) { $("startPanel").hidden = !on; $("docPanel").hidden = on; }

  // ---------------- Belge: yan yana tablo ----------------
  function segIssues(d, s) {
    const g = C.checkGlossary(s.src, s.tgt, d.srcLang, state.s.glossary);
    const f = s.tgt.trim() ? C.checkFields(s.src, s.tgt) : { total: 0, kept: 0, missing: [] };
    return { g, f, empty: !s.tgt.trim(), bad: !s.tgt.trim() || !g.ok || f.missing.length > 0 };
  }
  function srcNode(d, s) {
    const box = el("div", { class: "pt-src", lang: d.srcLang });
    const hits = C.findTerms(s.src, d.srcLang, state.s.glossary);
    let pos = 0;
    for (const h of hits) {
      if (h.start > pos) box.appendChild(document.createTextNode(s.src.slice(pos, h.start)));
      const e = state.s.glossary.find((x) => x.id === h.id);
      box.appendChild(el("mark", { class: "pt-term", title: "Sözlük: " + (d.srcLang === "tr" ? e.tr + " → " + e.en : e.en + " → " + e.tr) + (e.note ? " (" + e.note + ")" : "") }, s.src.slice(h.start, h.end)));
      pos = h.end;
    }
    if (pos < s.src.length) box.appendChild(document.createTextNode(s.src.slice(pos)));
    return box;
  }
  function metaNodes(d, s) {
    const x = segIssues(d, s);
    const st = { bos: "", taslak: "info", ai: "warning", elle: "accent", onayli: "success" }[s.status];
    const out = [badge(C.STATUS_NAMES[s.status], st)];
    if (x.g.total) out.push(badge("sözlük " + x.g.hits + "/" + x.g.total, x.empty ? "" : x.g.ok ? "success" : "danger"));
    if (!x.empty && x.f.total) out.push(badge(x.f.missing.length ? "alan eksik " + x.f.missing.length : "alanlar " + x.f.kept + "/" + x.f.total, x.f.missing.length ? "danger" : "success"));
    if (s.alts && s.alts.length) out.push(badge(s.alts.length + " alternatif", "warning"));
    if (s.rating) out.push(badge(C.RATING_NAMES[s.rating], s.rating === "iyi" ? "success" : s.rating === "kotu" ? "danger" : "warning"));
    return { nodes: out, issues: x };
  }
  function grow(ta) { ta.style.height = "auto"; ta.style.height = Math.min(320, ta.scrollHeight + 2) + "px"; }
  function buildRow(d, s, i) {
    const ta = el("textarea", { class: "pl-input pt-tgt", rows: "2", lang: tgtLang(d), spellcheck: "false", "aria-label": "Bölüm " + (i + 1) + " çevirisi", placeholder: "Çeviri…" });
    ta.value = s.tgt;
    ta.addEventListener("input", () => {
      grow(ta);
      const cur = doc() && doc().segments.find((x) => x.id === s.id);
      if (cur) { cur.tgt = ta.value; cur.status = ta.value.trim() ? "elle" : "bos"; updateMeta(row, doc(), cur); if (state.sel === s.id) renderInspector(); renderDocStats(); }
      clearTimeout(timers.get(s.id));
      timers.set(s.id, setTimeout(() => saveSeg(d.id, s.id, ta.value), 450));
    });
    ta.addEventListener("focus", () => select(s.id));
    ta.addEventListener("blur", () => { clearTimeout(timers.get(s.id)); timers.delete(s.id); saveSeg(d.id, s.id, ta.value); });
    const row = el("div", { class: "pt-seg", role: "listitem", "data-id": s.id },
      el("span", { class: "pt-num pl-num", text: String(i + 1) }),
      el("div", { class: "pt-cell" }, srcNode(d, s)),
      el("div", { class: "pt-cell" }, ta, el("div", { class: "pt-meta" })));
    row.addEventListener("click", (e) => { if (!e.target.closest("textarea, button")) select(s.id); });
    updateMeta(row, d, s);
    return row;
  }
  function updateMeta(row, d, s) {
    const m = metaNodes(d, s);
    put(row.querySelector(".pt-meta"), ...m.nodes);
    row.classList.toggle("is-bad", !m.issues.empty && m.issues.bad);
    row.classList.toggle("is-empty", m.issues.empty);
    row.classList.toggle("is-sel", state.sel === s.id);
    row.hidden = state.onlyIssues && !m.issues.bad;
  }
  const pending = new Set();
  async function saveSeg(docId, segId, value) {
    const d = doc();
    const s = d && d.segments.find((x) => x.id === segId);
    const key = docId + segId + value;
    if (pending.has(key)) return;
    pending.add(key);
    try { await D.seg.set(docId, segId, value); } catch (e) { toast("Kaydedilemedi: " + clean(e), true); } finally { pending.delete(key); }
    return s;
  }
  function renderDesk() {
    const d = doc();
    renderDir();
    if (!d) { showStart(true); state.rowsKey = ""; state.docId = null; return; }
    showStart(false);
    if (document.activeElement !== $("docTitle")) $("docTitle").value = d.title;
    if (document.activeElement !== $("docContext")) $("docContext").value = d.context || "";
    $("docDir").textContent = dirText(d.srcLang);
    $("thSrc").textContent = "Kaynak · " + C.LANG_NAMES[d.srcLang];
    $("thTgt").textContent = "Çeviri · " + C.LANG_NAMES[tgtLang(d)];
    $("onlyIssues").checked = state.onlyIssues;
    const key = d.id + "|" + d.srcLang + "|" + d.segments.map((s) => s.id).join(",") + "|" + state.s.glossary.map((g) => g.id + g.tr + g.en).join(",");
    const rows = $("rows");
    if (key !== state.rowsKey) {
      state.rowsKey = key;
      if (state.docId !== d.id || !d.segments.some((s) => s.id === state.sel)) state.sel = d.segments[0] ? d.segments[0].id : null;
      state.docId = d.id;
      put(rows, ...d.segments.map((s, i) => buildRow(d, s, i)));
      rows.querySelectorAll("textarea").forEach(grow);
    } else {
      for (const s of d.segments) {
        const row = rows.querySelector('[data-id="' + s.id + '"]');
        if (!row) continue;
        const ta = row.querySelector("textarea");
        if (document.activeElement !== ta && !timers.has(s.id) && ta.value !== s.tgt) { ta.value = s.tgt; grow(ta); }
        updateMeta(row, d, s);
      }
    }
    renderDocStats();
    renderInspector();
  }
  function renderDocStats() {
    const d = doc();
    if (!d) return;
    const st = C.docStats(d, state.s.glossary);
    const tile = (v, l, ok) => el("div", { class: "pt-stat" }, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: v }), el("span", { text: l }));
    put($("docStats"),
      tile(st.done + "/" + st.segments, "bölüm çevrildi"),
      tile(pctText(st.compliance), "sözlük uyumu" + (st.termsTotal ? " (" + st.termsHit + "/" + st.termsTotal + ")" : ""), st.compliance == null ? null : st.compliance >= 95),
      tile(st.fieldsTotal ? st.fieldsKept + "/" + st.fieldsTotal : "—", "korunan alan", st.fieldsTotal ? st.fieldsKept === st.fieldsTotal : null),
      tile(pctText(st.quality), "kalite (" + st.rated + " not)", st.quality == null ? null : st.quality >= 75));
  }
  function select(id) {
    if (state.sel === id) return;
    state.sel = id;
    $("rows").querySelectorAll(".pt-seg").forEach((r) => r.classList.toggle("is-sel", r.dataset.id === id));
    renderInspector();
  }
  function renderInspector() {
    const d = doc();
    const box = $("inspector");
    const s = d && d.segments.find((x) => x.id === state.sel);
    if (!s) return put(box, el("p", { class: "pl-muted pt-small", text: "Bir bölüm seçin." }));
    const i = d.segments.indexOf(s);
    const x = segIssues(d, s);
    const glossaryList = x.g.items.length ? el("ul", { class: "pt-checks" }, ...x.g.items.map((it) => el("li", { class: x.empty ? "" : it.ok ? "is-ok" : "is-bad" },
      icon(x.empty ? "alert" : it.ok ? "check" : "x"), el("span", {}, el("b", { text: it.source }), " → ", el("b", { text: it.expected }), it.accepted.length > 1 ? el("span", { class: "pl-muted", text: " (ya da " + it.accepted.slice(1).join(", ") + ")" }) : null,
        el("span", { class: "pl-muted", text: x.empty ? "" : " · kaynakta " + it.count + ", çeviride " + it.found }), it.note ? el("span", { class: "pl-muted", text: " · " + it.note }) : null)))) : el("p", { class: "pl-muted pt-small", text: "Bu bölümde sözlük terimi yok." });
    const fields = C.detectFields(s.src);
    const fieldList = fields.length ? el("div", { class: "pt-chips" }, ...fields.map((f) => { const miss = !x.empty && x.f.missing.some((m) => m.value === (f.sensitive ? C.maskValue(f.value) : f.value)); return el("span", { class: "pt-chip" + (f.sensitive ? " is-secret" : "") + (miss ? " is-miss" : "") }, f.sensitive ? icon("lock") : null, el("i", { text: C.TYPE_NAMES[f.type] }), el("b", { text: f.sensitive ? C.maskValue(f.value) : f.value })); })) : null;
    const alts = (s.alts || []).map((a, k) => el("div", { class: "pt-alt" }, el("div", { class: "pt-alt__head" }, el("b", { text: a.term }), a.note ? el("span", { class: "pl-muted pt-small", text: a.note }) : null),
      el("div", { class: "pt-row" }, ...a.options.map((o) => btn(o, "pl-btn--secondary", async () => { apply(await D.seg.useAlt(d.id, s.id, k, o)); toast("“" + a.term + "” yerine “" + o + "” kullanıldı."); })),
        btn("Sözlüğe ekle", "pl-btn--ghost", async () => { $("termTr").value = ""; $("termEn").value = a.term; go("glossary"); $("termTr").focus(); toast("Kaynaktaki Türkçe karşılığını yazıp Ekle'ye basın."); }))));
    const rate = (r, label) => btn(label, s.rating === r ? "pl-btn--primary" : "pl-btn--ghost", async () => apply(await D.seg.rate(d.id, s.id, r)), { "aria-pressed": s.rating === r ? "true" : "false" });
    put(box,
      el("div", { class: "pt-bar" }, el("h2", { class: "pl-h3 pt-h", text: "Bölüm " + (i + 1) + " / " + d.segments.length }), el("span", { class: "pt-grow" }), badge(C.STATUS_NAMES[s.status], s.status === "onayli" ? "success" : "")),
      el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "Sözlük denetimi" }), glossaryList),
      fieldList ? el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "Korunan alanlar (çeviride aynen olmalı)" }), fieldList) : null,
      !x.empty && x.f.missing.length ? el("div", { class: "pt-missing" }, icon("alert"), el("span", { text: "Çeviride bulunmayan: " + x.f.missing.map((m) => m.value + " (" + m.label + ")").join(", ") })) : null,
      s.note ? el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "MyMind notu" }), el("p", { class: "pt-note", text: s.note })) : null,
      alts.length ? el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "Alternatif terimler" }), ...alts) : null,
      el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "Kalite değerlendirmesi" }), el("div", { class: "pt-row" }, rate("iyi", "İyi"), rate("duzelt", "Düzeltme gerekti"), rate("kotu", "Kötü"))),
      el("div", { class: "pt-insec" }, el("span", { class: "pt-label", text: "Bölüm işlemleri" }), el("div", { class: "pt-row" },
        btn("Bu bölümü çevir", "pl-btn--secondary", () => translate([s.id], true)),
        btn("Sözlük taslağı", "pl-btn--ghost", async () => { const r = await D.seg.draft(d.id, [s.id]); apply(r.state); toast(r.segments ? r.terms + " terim yerleştirildi (taslak)." : "Taslak için bölüm boş olmalı ve sözlük terimi içermeli.", !r.segments); }),
        btn(s.status === "onayli" ? "Onayı kaldır" : "Onayla", "pl-btn--ghost", async () => apply(await D.seg.approve(d.id, s.id))),
        i < d.segments.length - 1 ? btn("Sonrakiyle birleştir", "pl-btn--ghost", async () => { apply(await D.seg.merge(d.id, s.id)); toast("Bölüm " + (i + 1) + " ve " + (i + 2) + " birleştirildi."); }) : null)));
  }
  async function translate(ids, overwrite) {
    const d = doc();
    if (!d) return;
    if (state.s.settings.provider === "hub" && !state.s.hasKey) return openMymind();
    busy((state.s.settings.provider === "yerel" ? "Yerel model" : "MyMind") + " çeviriyor…");
    const r = await D.ai.translate(d.id, ids, overwrite);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    apply(r.state);
    const dd = doc();
    const st = C.docStats(dd, state.s.glossary);
    toast(r.done + " bölüm çevrildi" + (r.failed ? ", " + r.failed + " bölüm alınamadı" : "") + (r.missingFields ? " — " + r.missingFields + " korunan alan eksik" : "") + " · sözlük uyumu " + pctText(st.compliance) + ".", r.failed > 0 && !r.done);
  }

  // ---------------- Belgeler ----------------
  function renderDocs() {
    const list = state.s.docs.filter((d) => state.showArchived || !d.archived);
    if (!list.length) return put($("docList"), el("li", { class: "pt-empty", text: state.s.docs.length ? "Arşivde belge var; “Arşivi göster”i işaretleyin." : "Henüz belge yok. Çeviri masasında bir metni bölümlere ayırın." }));
    put($("docList"), ...list.map((d) => {
      const st = d.stats;
      return el("li", { class: "pt-docrow" + (d.archived ? " is-archived" : "") },
        el("div", { class: "pt-docrow__head" }, el("b", { text: d.title }), badge(dirText(d.srcLang), "accent"), d.sample ? badge("örnek") : null, d.archived ? badge("arşivde") : null,
          el("span", { class: "pl-muted pt-small", text: fmtTime(d.updatedAt) + " · " + st.done + "/" + st.segments + " bölüm · " + n(st.words) + " kelime" }),
          st.termsTotal ? badge("sözlük " + pctText(st.compliance), st.compliance >= 95 ? "success" : "warning") : null, st.rated ? badge("kalite " + pctText(st.quality)) : null,
          el("span", { class: "pt-grow" }),
          d.archived ? btn("Geri al", "pl-btn--ghost", async () => { apply(await D.doc.restore(d.id)); toast("Belge arşivden çıkarıldı."); }) : btn("Aç", "pl-btn--secondary", async () => { apply(await D.doc.open(d.id)); go("desk"); }),
          d.archived ? null : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.doc.archive(d.id)); toast("Belge arşivlendi (silinmedi)."); })),
        el("p", { class: "pt-docrow__prev", text: d.preview }));
    }));
  }

  // ---------------- Sözlük ----------------
  function renderGlossary() {
    const g = state.s.glossary;
    const q = C.lowerTr(state.termQ.trim());
    const list = g.filter((e) => !q || C.lowerTr(e.tr + " " + e.en + " " + e.note).includes(q));
    const usage = new Map();
    for (const d of state.s.doc ? [state.s.doc] : []) for (const s of d.segments) for (const h of C.findTerms(s.src, d.srcLang, g)) usage.set(h.id, (usage.get(h.id) || 0) + 1);
    if (!list.length) return put($("terms"), el("p", { class: "pt-empty", text: g.length ? "Aramayla eşleşen terim yok." : "Sözlük boş. Terim ekleyin, CSV içe aktarın ya da Çeviri masasında Örnek'i açın (temsilî terim kümesi eklenir)." }));
    put($("terms"),
      el("div", { class: "pt-termrow pt-termrow--head", role: "row" }, el("span", { text: "Türkçe" }), el("span", { text: "İngilizce" }), el("span", { text: "Not" }), el("span", { text: state.s.doc ? "Açık belgede" : "" }), el("span")),
      ...list.map((e) => {
        const rm = el("button", { type: "button", class: "pt-icon-btn", "aria-label": e.tr + " terimini kaldır", title: "Kaldır" }, icon("x"));
        rm.addEventListener("click", guard(async () => { apply(await D.glossary.remove(e.id)); toast("“" + e.tr + "” sözlükten kaldırıldı."); }));
        return el("div", { class: "pt-termrow", role: "row" }, el("b", { text: e.tr }), el("span", { text: e.en }), el("span", { class: "pl-muted", text: e.note }), el("span", { class: "pl-muted", text: usage.get(e.id) ? usage.get(e.id) + " kez" : "" }), rm);
      }));
  }
  $("termForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    const tr = $("termTr").value.trim(), en = $("termEn").value.trim();
    if (tr.length < 2 || en.length < 2) return toast("Türkçe ve İngilizce karşılık en az 2 karakter olmalı.", true);
    const r = await D.glossary.add({ tr, en, note: $("termNote").value.trim() });
    apply(r.state);
    $("termTr").value = ""; $("termEn").value = ""; $("termNote").value = "";
    $("termTr").focus();
    toast("“" + tr + " → " + en + "” " + (r.updated ? "güncellendi." : "sözlüğe eklendi."));
  }));
  $("termSearch").addEventListener("input", () => { state.termQ = $("termSearch").value; renderGlossary(); });
  $("importBtn").addEventListener("click", guard(async () => { const r = await D.glossary.importCsv(); if (r.cancelled) return; apply(r.state); toast(r.read + " satır okundu, " + r.added + " yeni terim eklendi."); }));
  $("exportGlossaryBtn").addEventListener("click", guard(async () => { const r = await D.glossary.exportCsv(); if (!r.cancelled) toast("Sözlük “" + r.file + "” dosyasına yazıldı (" + r.count + " terim)."); }));

  // ---------------- Ölçüler ve ayarlar ----------------
  function renderSettings() {
    const s = state.s, st = s.stats, m = st.metrics;
    const tile = (val, label, ok) => el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: val }), el("span", { text: label }));
    put($("metrics"),
      tile(pctText(st.compliance), "sözlük uyumu — tüm çeviriler (" + st.termsHit + "/" + st.termsTotal + "; hedef ≥ %95)", st.compliance == null ? null : st.compliance >= 95),
      tile(pctText(st.aiCompliance), "sözlük uyumu — MyMind/yerel model ilk çevirisi", st.aiCompliance == null ? null : st.aiCompliance >= 95),
      tile(pctText(st.fields), "korunan alan (" + st.fieldsKept + "/" + st.fieldsTotal + ")", st.fields == null ? null : st.fields >= 99),
      tile(pctText(st.quality), "insan kalite: İyi oranı (" + st.iyi + " iyi · " + st.duzelt + " düzeltme · " + st.kotu + " kötü)", st.quality == null ? null : st.quality >= 75),
      tile(pctText(st.altUse), "alternatif kullanma (" + m.altsUsed + "/" + m.altsShown + ")", null),
      tile(n(st.done) + "/" + n(st.segments), "çevrilen bölüm (" + st.docs + " belge)", null),
      tile(String(m.aiRuns), "çeviri isteği (" + m.aiSegments + " bölüm)", null),
      tile(String(m.aligns) + " · " + m.drafts, "hizalama · sözlük taslağı", null),
      tile(String(m.secretsBlocked), "alınmayan parola benzeri pano", null));
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("setHotkey").checked = s.settings.hotkey;
    $("setDetect").checked = s.settings.autoDetect;
    $("hotkeyInfo").textContent = s.settings.hotkey ? (s.hotkey ? "Kısayol etkin." : "Kısayol başka bir uygulama tarafından kullanılıyor olabilir; etkinleştirilemedi.") : "Kısayol kapalı.";
    $("vaultInfo").textContent = s.vault ? "Belgeler, sözlük ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: belgeler düz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => { apply(await D.setSettings({ provider: r.value })); toast(r.value === "yerel" ? "Çeviri motoru: yerel model." : "Çeviri motoru: MyMind (Hub)."); })));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("setHotkey").addEventListener("change", guard(async () => apply(await D.setSettings({ hotkey: $("setHotkey").checked }))));
  $("setDetect").addEventListener("change", guard(async () => apply(await D.setSettings({ autoDetect: $("setDetect").checked }))));

  // ---------------- Olaylar ----------------
  function clipResult(r) {
    if (r.blocked) return toast("Panodaki metin bir parola ya da anahtar gibi görünüyor; güvenlik için alınmadı.", true);
    if (r.empty) return toast("Panoda metin yok.", true);
    setInput(r.text, "Panodan alındı" + (r.truncated ? " (ilk 30.000 karakter)" : "") + ". Yönü seçip “Bölümlere ayır”a basın.");
  }
  document.addEventListener("click", guard(async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "clip") clipResult(await D.readClipboard());
    if (act === "sample") { const r = await D.sample(); apply(r.state); go("desk"); toast("Örnek belge açıldı" + (r.added ? "; temsilî terim kümesinden " + r.added + " terim sözlüğe eklendi." : ".")); }
    if (act === "openFile") { const r = await D.openFile(); if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı" + (r.truncated ? " (ilk 30.000 karakter)" : "") + "."); }
  }));
  document.querySelectorAll("[data-dir]").forEach((b) => b.addEventListener("click", () => { state.dir = b.dataset.dir; renderDir(); }));
  $("input").addEventListener("input", live);
  $("createBtn").addEventListener("click", guard(async () => {
    const text = $("input").value;
    if (!text.trim()) return toast("Önce çevrilecek bir metin yazın ya da yapıştırın.", true);
    apply(await D.doc.create(text, { srcLang: state.dir === "auto" ? undefined : state.dir }));
    const d = doc();
    toast(d.segments.length + " bölüm · " + dirText(d.srcLang) + ".");
  }));
  $("docTitle").addEventListener("change", guard(async () => apply(await D.doc.update(doc().id, { title: $("docTitle").value }))));
  $("docContext").addEventListener("change", guard(async () => apply(await D.doc.update(doc().id, { context: $("docContext").value }))));
  $("swapBtn").addEventListener("click", guard(async () => { apply(await D.doc.swap(doc().id)); toast("Yön: " + dirText(doc().srcLang) + "."); }));
  $("aiAllBtn").addEventListener("click", guard(() => translate(null, false)));
  $("draftBtn").addEventListener("click", guard(async () => { const r = await D.seg.draft(doc().id, null); apply(r.state); toast(r.segments ? r.segments + " boş bölüme " + r.terms + " sözlük terimi yerleştirildi (taslak; çeviri değildir)." : "Taslak yapılacak boş ve terimli bölüm yok."); }));
  $("alignBtn").addEventListener("click", () => { $("alignText").value = ""; $("alignDialog").showModal(); $("alignText").focus(); });
  $("alignCancel").addEventListener("click", () => $("alignDialog").close());
  $("alignRun").addEventListener("click", guard(async () => {
    const r = await D.doc.align(doc().id, $("alignText").value);
    $("alignDialog").close();
    state.rowsKey = "";
    apply(r.state);
    toast(r.targetSentences + " çeviri cümlesi " + r.segments + " bölüme hizalandı" + (r.merged ? " (" + r.merged + " bölüm birleştirildi)" : "") + ". Satırları kontrol edin.");
  }));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.doc.exportAs(doc().id, $("exportFmt").value); if (!r.cancelled) toast("“" + r.file + "” kaydedildi (" + n(r.bytes) + " bayt)."); }));
  $("copyBtn").addEventListener("click", guard(async () => { const r = await D.doc.copyTarget(doc().id); toast("Çeviri panoya kopyalandı (" + n(r.copied) + " karakter)."); }));
  $("newBtn").addEventListener("click", () => setInput("", null));
  $("onlyIssues").addEventListener("change", () => { state.onlyIssues = $("onlyIssues").checked; renderDesk(); });
  $("showArchived").addEventListener("change", () => { state.showArchived = $("showArchived").checked; renderDocs(); });
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.doc.backup(); if (!r.cancelled) toast("Yedek “" + r.file + "” dosyasına yazıldı."); }));

  // ---------------- MyMind ----------------
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı. Değiştirmek için yenisini yapıştırın." : "Anahtar henüz girilmedi. Hub kullanmak istemezseniz Ölçüler ve ayarlar → Çeviri motoru'ndan yerel modeli seçebilirsiniz.";
    $("mymindDialog").showModal();
  }
  $("openMymind").addEventListener("click", openMymind);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => {
    const r = await D.ai.setKey($("mymindKey").value);
    $("mymindDialog").close();
    if (state.s.settings.provider !== "hub") apply(await D.setSettings({ provider: "hub" }));
    toast(r.stored === "vault" ? "Anahtar Windows kasasında şifreli saklandı." : "Anahtar bu oturum için bellekte tutuluyor.");
  }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); D.openFile().then((r) => { if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı."); }).catch((x) => toast(clean(x), true)); }
    if (e.ctrlKey && e.key === "Enter" && state.view === "desk" && !$("startPanel").hidden) { e.preventDefault(); $("createBtn").click(); }
    if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp") && doc()) {
      e.preventDefault();
      const segs = doc().segments, i = segs.findIndex((s) => s.id === state.sel);
      const nx = segs[Math.max(0, Math.min(segs.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
      if (nx) { const ta = $("rows").querySelector('[data-id="' + nx.id + '"] textarea'); if (ta) ta.focus(); }
    }
  });
  D.onState((s) => { state.s = s; render(); });
  D.onQuick((r) => clipResult(r));
  D.state().then((s) => {
    state.s = s;
    render();
    go("desk");
    live();
    document.documentElement.dataset.ready = "1";
  });
})();
