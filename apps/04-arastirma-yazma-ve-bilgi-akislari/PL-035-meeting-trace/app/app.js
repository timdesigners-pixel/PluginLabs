/* Meeting Trace — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; bunlar ana süreçte yapılır. Önizleme ve notlar aynı çekirdeği
 * (src/core.js, saf işlevler) kullanır. Çıkarım isteği ana süreçte onaydan geçer. */
(function () {
  const D = window.mtDesktop;
  const C = window.MTCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["meet", "list", "tasks", "settings"];
  const state = { s: null, view: "meet", tab: "items", filter: "aday", sourceName: "", tQuery: "", tSpeaker: "", focus: null, linesKey: "", listQuery: "", showArchived: false, taskQuery: "", taskOwner: "", showDone: false, editing: null };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    undo: "M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z",
    link: "M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8",
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
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const n = (x) => Number(x).toLocaleString("tr-TR");
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const fmtDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); };
  const todayIso = () => C.iso(new Date());
  const meeting = () => state.s && state.s.meeting;
  const speakerName = (m, key) => C.speakerLabel(m, key);
  const ownerTone = (st) => (st === "kesin" ? "success" : st === "tahmin" ? "warning" : "danger");
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "meet";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }
  function setTab(tab) {
    state.tab = tab;
    for (const t of ["items", "notes", "speakers"]) $("tab-" + t).hidden = t !== tab;
    document.querySelectorAll("[data-tab]").forEach((b) => { b.classList.toggle("is-active", b.dataset.tab === tab); b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"); });
  }

  // ---------------- Çizim ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    $("meetCount").textContent = n(s.stats.meetings);
    $("taskCount").textContent = n(s.stats.open);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel" : s.hasKey ? "Hazır" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    $("helpPrecision").textContent = pctText(s.sampleEval.gorev.precision);
    renderSide();
    const m = meeting();
    $("startPanel").hidden = !!m;
    $("meetPanel").hidden = !m;
    if (m) renderMeeting(m);
    renderList();
    renderTasks();
    renderSettings();
  }
  function renderSide() {
    const s = state.s, m = meeting();
    if (m) {
      const st = C.meetingStats(m);
      put($("sideInfo"), el("div", { class: "mt-mini__in" }, el("span", { class: "pl-muted", text: "Açık toplantı" }), el("b", { text: m.title }), el("span", { class: "pl-muted", text: st.pending + " onay bekliyor · " + st.ambiguous + " belirsiz/tahmin sahip" })));
    } else put($("sideInfo"), el("div", { class: "mt-mini__in" }, el("span", { class: "pl-muted", text: "Açık görev" }), el("b", { text: n(s.stats.open) }), el("span", { class: "pl-muted", text: n(s.stats.decisions) + " onaylı karar · " + n(s.stats.meetings) + " toplantı" })));
  }

  // ---- Başlangıç (yükleme) ----
  function preview() {
    const t = $("input").value;
    if (!t.trim()) { $("inInfo").textContent = "Henüz metin yok"; $("sensWarn").hidden = true; return; }
    const p = C.parseTranscript(t);
    const parts = [C.FORMAT_NAMES[p.format], n(p.utterances.length) + " satır", n(p.speakers.length) + " konuşmacı", n(p.timed) + " zamanlı"];
    if (p.guessed) parts.push(n(p.guessed) + " satırın konuşmacısı tahmin");
    if (p.unknown) parts.push(n(p.unknown) + " satırın konuşmacısı yok");
    $("inInfo").textContent = parts.join(" · ") + (p.speakers.length ? " — " + p.speakers.map((x) => x.name).slice(0, 6).join(", ") : "");
    const sens = C.sensitiveSummary(t);
    $("sensWarn").hidden = !sens.length;
    $("sensWarn").textContent = sens.length ? "Transkriptte hassas değer var (" + sens.map((x) => x.count + " " + x.label).join(", ") + "). Cihazda saklanır; MyMind'a gönderilmez." : "";
  }

  // ---- Toplantı ----
  function renderMeeting(m) {
    if (document.activeElement !== $("mTitle")) $("mTitle").value = m.title;
    const st = C.meetingStats(m);
    const meta = [fmtDate(m.date), C.FORMAT_NAMES[m.source.format] + (m.source.name ? " · " + m.source.name : ""), n(st.utterances) + " satır", n(st.speakers) + " konuşmacı"];
    if (st.duration != null) meta.push(C.fmtTime(st.duration));
    put($("mMeta"), ...meta.map((x) => el("span", { text: x })), st.guessed ? badge(n(st.guessed) + " tahmin satır", "warning", "Konuşmacısı önceki satırdan tahmin edildi") : null, el("span", { class: "mt-consenttag", text: m.consent.kind === "kendi-notum" ? "Kendi notu" : "Katılımcılar bilgilendirildi", title: m.consent.text }));
    renderLines(m);
    renderItems(m);
    renderNotes(m);
    renderSpeakers(m);
    $("itemsBadge").textContent = n(st.pending);
    $("speakersBadge").textContent = n(st.speakers);
  }
  function refsMap(m) {
    const map = new Map();
    for (const it of m.items) if (it.status !== "reddedildi") for (const r of it.refs) { if (!map.has(r)) map.set(r, []); map.get(r).push(it); }
    return map;
  }
  function renderLines(m) {
    const sel = $("tSpeaker");
    const opts = [["", "Tüm konuşmacılar"]].concat(m.speakers.map((s) => [s.key, s.label]));
    const key = m.id + "|" + opts.map((o) => o.join(":")).join(",");
    if (sel.dataset.key !== key) { put(sel, ...opts.map(([v, t]) => el("option", { value: v, text: t }))); sel.dataset.key = key; if (!m.speakers.some((s) => s.key === state.tSpeaker)) state.tSpeaker = ""; }
    sel.value = state.tSpeaker;
    const q = C.lowerTr(state.tQuery.trim());
    const refs = refsMap(m);
    const rows = [];
    for (const u of m.utterances) {
      if (state.tSpeaker && u.speaker !== state.tSpeaker) continue;
      if (q && !C.lowerTr(u.text).includes(q) && !C.lowerTr(speakerName(m, u.speaker)).includes(q)) continue;
      const its = refs.get(u.id) || [];
      const li = el("li", { class: "mt-line" + (its.length ? " has-item" : "") + (state.focus === u.id ? " is-focus" : ""), id: "line-" + u.id, "data-u": u.id });
      const sp = el("span", { class: "mt-spk" + (u.guess ? " is-guess" : "") + (u.speaker === C.UNKNOWN ? " is-unknown" : ""), text: speakerName(m, u.speaker), "data-spk": u.speaker, title: u.guess ? "Konuşmacı tahmin: önceki satırdan. Konuşmacılar sekmesinden onaylayın." : "" });
      if (u.guess) sp.appendChild(el("i", { text: " · tahmin" }));
      li.append(el("span", { class: "mt-time pl-num", text: C.fmtTime(u.t) }), el("div", { class: "mt-line__body" }, sp, el("p", { class: "mt-line__text", text: u.text }), its.length ? el("div", { class: "mt-line__tags" }, ...its.slice(0, 3).map((it) => badge(C.KIND_NAMES[it.kind] + (it.status === "onayli" ? " ✓" : ""), it.kind === "karar" ? "info" : "accent"))) : null));
      rows.push(li);
    }
    put($("lines"), ...(rows.length ? rows : [el("li", { class: "mt-empty", text: "Eşleşen satır yok." })]));
    // Konuşmacı renkleri: sabit sıra (token renkleri CSS'te).
    m.speakers.forEach((s, i) => document.querySelectorAll('[data-spk="' + s.key + '"]').forEach((x) => { x.dataset.c = String(i % 6); }));
  }
  function focusLine(id) {
    state.focus = id;
    state.tQuery = ""; $("tQuery").value = ""; state.tSpeaker = "";
    renderLines(meeting());
    const li = $("line-" + id);
    if (li) li.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function ownerSelect(m, it) {
    const s = el("select", { class: "pl-select mt-select--sm mt-ownersel", "aria-label": "Sorumlu" });
    const cur = it.owner && it.owner.state !== "belirsiz" ? (it.owner.key ? "k:" + it.owner.key : it.owner.name ? "n:" + it.owner.name : "") : "";
    s.append(el("option", { value: "", text: "Belirsiz" }));
    for (const sp of m.speakers) s.append(el("option", { value: "k:" + sp.key, text: sp.label }));
    if (it.owner && it.owner.name) s.append(el("option", { value: "n:" + it.owner.name, text: it.owner.name + " (katılımcı değil)" }));
    s.value = cur;
    s.addEventListener("change", guard(async () => {
      const v = s.value;
      apply(await D.item.set(m.id, it.id, { owner: v.startsWith("k:") ? { key: v.slice(2) } : v.startsWith("n:") ? { name: v.slice(2) } : {} }));
    }));
    return s;
  }
  function itemCard(m, it) {
    const li = el("li", { class: "mt-item is-" + it.status + " mt-item--" + it.kind, "data-item": it.id });
    const head = el("div", { class: "mt-item__head" }, badge(C.KIND_NAMES[it.kind], it.kind === "karar" ? "info" : "accent"), badge(C.ORIGIN_NAMES[it.origin], it.origin === "ai" ? "pro" : ""), it.status !== "aday" ? badge(C.STATUS_NAMES[it.status], it.status === "onayli" ? "success" : "danger") : null, el("span", { class: "mt-grow" }), el("span", { class: "mt-time pl-num", text: C.fmtTime(it.t) }));
    li.append(head);
    if (state.editing === it.id) {
      const ta = el("textarea", { class: "pl-input mt-edit", maxlength: "300", "aria-label": "Madde metni", rows: "2" });
      ta.value = it.text;
      li.append(ta, el("div", { class: "mt-row" }, btn("Kaydet", "pl-btn--primary", async () => { state.editing = null; apply(await D.item.set(m.id, it.id, { text: ta.value })); }), btn("Vazgeç", "pl-btn--ghost", () => { state.editing = null; render(); })));
      setTimeout(() => ta.focus(), 0);
    } else li.append(el("p", { class: "mt-item__text" + (it.done ? " is-done" : ""), text: it.text }));
    if (it.kind === "gorev") {
      const st = (it.owner && it.owner.state) || "belirsiz";
      const due = el("input", { class: "pl-input mt-due", type: "date", "aria-label": "Son tarih", value: it.due || "" });
      due.addEventListener("change", guard(async () => apply(await D.item.set(m.id, it.id, { due: due.value }))));
      li.append(el("div", { class: "mt-item__owner" },
        el("span", { class: "mt-label", text: "Sorumlu" }), ownerSelect(m, it), badge(C.OWNER_NAMES[st], ownerTone(st), it.owner && it.owner.note ? it.owner.note : ""),
        it.owner && it.owner.note ? el("span", { class: "pl-muted mt-small", text: it.owner.note }) : null),
        el("div", { class: "mt-item__owner" }, el("span", { class: "mt-label", text: "Son tarih" }), due, it.dueText ? el("span", { class: "pl-muted mt-small", text: "metinde: “" + it.dueText + "”" }) : el("span", { class: "pl-muted mt-small", text: "metinde tarih yok" })));
    }
    // Kanıt
    const ev = el("div", { class: "mt-evidence" });
    for (const r of it.refs.slice(0, 3)) {
      const u = m.utterances.find((x) => x.id === r);
      if (!u) continue;
      const b = el("button", { type: "button", class: "mt-evbtn", title: "Transkriptte göster" }, icon("link"), el("span", { class: "pl-num", text: C.fmtTime(u.t) }), el("b", { text: speakerName(m, u.speaker) + (u.guess ? " (tahmin)" : "") }), el("span", { class: "mt-evtext", text: u.text }));
      b.addEventListener("click", () => focusLine(u.id));
      ev.append(b);
    }
    if (!it.refs.length) ev.append(el("span", { class: "pl-muted mt-small", text: "Elle eklendi; kanıt satırı yok." }));
    li.append(ev);
    const acts = el("div", { class: "mt-row mt-item__acts" });
    if (it.status === "aday") acts.append(btn("Onayla", "pl-btn--primary", async () => apply(await D.item.set(m.id, it.id, { status: "onayli" })), { "data-act": "approve" }), btn("Reddet", "pl-btn--ghost", async () => apply(await D.item.set(m.id, it.id, { status: "reddedildi" })), { "data-act": "reject" }));
    else acts.append(btn("Geri al", "pl-btn--ghost", async () => apply(await D.item.set(m.id, it.id, { status: "aday" })), { "data-act": "undo" }));
    if (it.status === "onayli" && it.kind === "gorev") {
      const cb = el("input", { type: "checkbox" });
      cb.checked = !!it.done;
      cb.addEventListener("change", guard(async () => apply(await D.item.set(m.id, it.id, { done: cb.checked }))));
      acts.append(el("label", { class: "mt-check mt-check--inline" }, cb, el("span", { text: "Tamamlandı" })));
    }
    acts.append(el("span", { class: "mt-grow" }), btn("Düzenle", "pl-btn--ghost", () => { state.editing = it.id; render(); }, { "data-act": "edit" }));
    li.append(acts);
    return li;
  }
  function renderItems(m) {
    document.querySelectorAll("[data-filter]").forEach((b) => { const on = b.dataset.filter === state.filter; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    const order = { aday: 0, onayli: 1, reddedildi: 2 };
    const list = m.items.filter((x) => state.filter === "hepsi" || x.status === state.filter).sort((a, b) => order[a.status] - order[b.status] || (a.kind === b.kind ? 0 : a.kind === "karar" ? -1 : 1) || (a.t ?? 1e9) - (b.t ?? 1e9));
    const empty = { aday: "Onay bekleyen madde yok.", onayli: "Henüz onaylı madde yok.", reddedildi: "Reddedilen madde yok.", hepsi: "Madde yok. Elle ekleyebilir ya da MyMind ile çıkarabilirsiniz." }[state.filter];
    put($("items"), ...(list.length ? list.map((it) => itemCard(m, it)) : [el("li", { class: "mt-empty", text: empty })]));
    const sel = $("addOwner");
    const key = m.id + m.speakers.map((s) => s.key + s.label).join();
    if (sel.dataset.key !== key) { put(sel, el("option", { value: "", text: "Sorumlu: belirsiz" }), ...m.speakers.map((s) => el("option", { value: s.key, text: s.label }))); sel.dataset.key = key; }
  }
  function renderNotes(m) {
    const ns = C.notes(m, state.s.settings.minutes);
    $("notesInfo").textContent = n(ns.length) + " bölüm · gündem işaretinde ya da her " + state.s.settings.minutes + " dakikada yeni bölüm · reddedilen maddeler gösterilmez";
    const byId = new Map(m.items.map((x) => [x.id, x]));
    put($("notes"), ...ns.map((b) => {
      const li = el("li", { class: "mt-note" });
      const tb = el("button", { type: "button", class: "mt-note__time pl-num", text: C.fmtTime(b.start), title: "Transkriptte göster" });
      tb.addEventListener("click", () => focusLine(b.from));
      li.append(el("div", { class: "mt-note__head" }, tb, el("b", { text: b.title }), b.topic ? badge("Gündem", "info") : null, el("span", { class: "mt-grow" }), el("span", { class: "pl-muted mt-small", text: b.count + " satır · " + b.speakers.map((k) => speakerName(m, k).split(" ")[0]).join(", ") })));
      if (b.keywords.length) li.append(el("div", { class: "mt-kw" }, ...b.keywords.map((k) => el("span", { class: "pl-tag", text: k }))));
      const ul = el("ul", { class: "mt-note__list" });
      for (const id of b.decisions.concat(b.tasks)) {
        const it = byId.get(id);
        if (!it) continue;
        ul.append(el("li", { class: "is-" + it.kind }, el("span", { class: "mt-note__kind", text: C.KIND_NAMES[it.kind] + (it.status === "aday" ? " (onay bekliyor)" : "") }), el("span", { text: it.text + (it.kind === "gorev" ? " — " + C.ownerLabel(m, it) : "") })));
      }
      if (!ul.children.length) for (const l of b.lead) ul.append(el("li", {}, el("span", { class: "mt-note__kind", text: speakerName(m, l.speaker).split(" ")[0] }), el("span", { text: l.text })));
      li.append(ul);
      return li;
    }));
  }
  function renderSpeakers(m) {
    const counts = {};
    for (const u of m.utterances) counts[u.speaker] = (counts[u.speaker] || 0) + 1;
    put($("speakers"), ...m.speakers.map((s, i) => {
      const inp = el("input", { class: "pl-input mt-spkname", maxlength: "60", "aria-label": "Konuşmacı adı", value: s.label });
      inp.addEventListener("change", guard(async () => apply(await D.speaker.rename(m.id, s.key, inp.value))));
      const merge = el("select", { class: "pl-select mt-select--sm", "aria-label": s.label + " konuşmacısını birleştir" }, el("option", { value: "", text: "Birleştir…" }), ...m.speakers.filter((x) => x.key !== s.key).map((x) => el("option", { value: x.key, text: "→ " + x.label })));
      merge.addEventListener("change", guard(async () => { if (merge.value) apply(await D.speaker.merge(m.id, s.key, merge.value)); }));
      return el("li", { class: "mt-speaker" }, el("span", { class: "mt-spk", "data-c": String(i % 6), text: s.name === s.label ? s.label.split(" ").map((w) => w[0]).join("").slice(0, 2) : "✎" }), inp, el("span", { class: "pl-muted mt-small", text: n(counts[s.key] || 0) + " satır" }), merge);
    }));
    const gs = m.utterances.filter((u) => u.guess || u.speaker === C.UNKNOWN);
    $("guessBadge").textContent = n(gs.length);
    put($("guesses"), ...(gs.length ? gs.map((u) => {
      const sel = el("select", { class: "pl-select mt-select--sm", "aria-label": "Satırın konuşmacısı" }, ...m.speakers.map((s) => el("option", { value: s.key, text: s.label })), el("option", { value: C.UNKNOWN, text: "Bilinmiyor" }));
      sel.value = u.speaker;
      const ok = btn(u.guess ? "Onayla" : "Kaydet", "pl-btn--secondary", async () => apply(await D.speaker.setFor(m.id, u.id, sel.value)), { "data-act": "confirmGuess" });
      return el("li", { class: "mt-guess" }, el("span", { class: "mt-time pl-num", text: C.fmtTime(u.t) }), el("p", { class: "mt-line__text", text: u.text }), el("div", { class: "mt-row" }, sel, ok));
    }) : [el("li", { class: "mt-empty", text: "Tahmin edilen satır yok: her satırın konuşmacısı transkriptte yazılı." })]));
  }

  // ---- Toplantılar ----
  function renderList() {
    const s = state.s;
    const q = C.lowerTr(state.listQuery.trim());
    const list = s.meetings.filter((m) => (state.showArchived || !m.archived) && (!q || C.lowerTr(m.title + " " + m.speakers.join(" ")).includes(q)));
    put($("meetList"), ...(list.length ? list.map((m) => {
      const st = m.stats;
      const open = btn("Aç", "pl-btn--secondary", async () => { apply(await D.meeting.open(m.id)); go("meet"); });
      const arch = m.archived ? btn("Geri al", "pl-btn--ghost", async () => apply(await D.meeting.restore(m.id))) : btn("Arşivle", "pl-btn--ghost", async () => apply(await D.meeting.archive(m.id)));
      return el("li", { class: "mt-mrow" + (m.archived ? " is-archived" : "") },
        el("div", { class: "mt-mrow__main" }, el("b", { text: m.title }), el("span", { class: "pl-muted mt-small", text: fmtDate(m.date) + " · " + m.speakers.slice(0, 5).join(", ") + " · " + n(st.utterances) + " satır" + (st.duration != null ? " · " + C.fmtTime(st.duration) : "") })),
        el("div", { class: "mt-row" }, badge(n(st.decisions) + " karar", "info"), badge(n(st.tasks) + " görev", "accent"), st.pending ? badge(n(st.pending) + " onay bekliyor", "warning") : null, m.archived ? badge("Arşiv") : null, m.sample ? badge("Örnek") : null),
        el("div", { class: "mt-row" }, open, arch));
    }) : [el("li", { class: "mt-empty", text: s.meetings.length ? "Eşleşen toplantı yok." : "Henüz toplantı yok. Toplantı bölümünden transkript yükleyin." })]));
  }

  // ---- Görevler ----
  function renderTasks() {
    const s = state.s;
    const owners = [...new Set(s.tasks.map((t) => t.owner))].sort((a, b) => a.localeCompare(b, "tr"));
    const sel = $("taskOwner");
    const key = owners.join("|");
    if (sel.dataset.key !== key) { put(sel, el("option", { value: "", text: "Tüm sorumlular" }), ...owners.map((o) => el("option", { value: o, text: o }))); sel.dataset.key = key; if (!owners.includes(state.taskOwner)) state.taskOwner = ""; }
    sel.value = state.taskOwner;
    const q = C.lowerTr(state.taskQuery.trim());
    const today = todayIso();
    const list = s.tasks.filter((t) => (state.showDone || !t.done) && (!state.taskOwner || t.owner === state.taskOwner) && (!q || C.lowerTr(t.text + " " + t.owner + " " + t.meetingTitle).includes(q)))
      .sort((a, b) => (a.done - b.done) || ((a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : 0));
    if (!list.length) { put($("taskTable"), el("p", { class: "mt-empty", text: s.tasks.length ? "Süzgece uyan görev yok." : "Henüz onaylı görev yok. Bir toplantıdaki görev adaylarını onaylayın." })); return; }
    const head = el("div", { class: "mt-trow mt-trow--head" }, el("span", { text: "" }), el("span", { text: "Görev" }), el("span", { text: "Sorumlu" }), el("span", { text: "Son tarih" }), el("span", { text: "Toplantı" }));
    put($("taskTable"), head, ...list.map((t) => {
      const cb = el("input", { type: "checkbox", "aria-label": "Tamamlandı" });
      cb.checked = t.done;
      cb.addEventListener("change", guard(async () => apply(await D.item.set(t.meetingId, t.id, { done: cb.checked }))));
      const late = t.due && !t.done && t.due < today;
      const mb = el("button", { type: "button", class: "mt-linkbtn", text: t.meetingTitle + " · " + C.fmtTime(t.t) });
      mb.addEventListener("click", guard(async () => { apply(await D.meeting.open(t.meetingId)); go("meet"); }));
      return el("div", { class: "mt-trow" + (t.done ? " is-done" : "") }, cb, el("span", { class: "mt-ttext", text: t.text }),
        el("span", { class: "mt-towner" }, el("span", { text: t.owner.replace(/ \(tahmin\)$/, "") }), t.ownerState !== "kesin" ? badge(C.OWNER_NAMES[t.ownerState], ownerTone(t.ownerState)) : null),
        el("span", { class: late ? "mt-late" : "", text: t.due ? fmtDate(t.due) + (late ? " · gecikti" : "") : t.dueText || "—" }), mb);
    }));
  }

  // ---- Ölçüler ve ayarlar ----
  function renderSettings() {
    const s = state.s, st = s.stats, m = st.metrics, ev = s.sampleEval;
    const cells = [
      ["Örnekte görev kesinliği", pctText(ev.gorev.precision), "hedef ≥ %90 · " + ev.gorev.correct + "/" + ev.gorev.found + " doğru"],
      ["Örnekte görev duyarlılığı", pctText(ev.gorev.recall), ev.gorev.correct + "/" + ev.gorev.labeled + " etiketli görev bulundu"],
      ["Örnekte sahip doğruluğu", pctText(ev.gorev.owner), ev.gorev.ambiguousShown + "/" + ev.gorev.ambiguousWant + " belirsiz sahip görünür"],
      ["Örnekte karar kesinliği", pctText(ev.karar.precision), "duyarlılık " + pctText(ev.karar.recall)],
      ["Onay oranı (kural)", pctText(st.rulePrecision), n(m.ruleApproved) + " onay · " + n(m.ruleRejected) + " ret — sizin kararlarınız"],
      ["Onay oranı (MyMind)", pctText(st.aiPrecision), n(m.aiApproved) + " onay · " + n(m.aiRejected) + " ret · " + n(m.aiDropped) + " kaynaksız madde atıldı"],
      ["Belirsiz sahipli onaylı görev", n(st.ambiguousOpen), "tahmin ya da belirsiz sahip"],
      ["Açık görev", n(st.open), n(st.tasks) + " onaylı görev · " + n(st.decisions) + " karar"],
      ["Sahip / metin düzeltmesi", n(m.ownerEdits) + " / " + n(m.textEdits), n(m.manual) + " elle madde"],
      ["Toplantı", n(st.meetings), n(st.archived) + " arşivde · " + n(m.imports) + " yükleme"],
      ["Dışa aktarma", n(m.exports), n(m.copies) + " kopyalama"],
      ["MyMind isteği", n(m.aiRuns), n(m.aiItems) + " yeni aday"],
    ];
    put($("statGrid"), ...cells.map(([k, v, h]) => el("div", {}, el("span", { text: k }), el("b", { text: v }), el("i", { text: h }))));
    $("statNote").textContent = "“Örnekte” ölçüleri uygulamayla gelen, elle etiketlenmiş örnek toplantıda kural tabanlı çıkarımın sonucudur (Notion ölçütü: görev kesinliği ≥ %90, belirsiz sahipler görünür). Örnek tek ve kısa bir toplantıdır; kendi toplantılarınızdaki başarı “Onay oranı” satırlarında görünür.";
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("setMinutes").value = String(s.settings.minutes);
    $("setPending").checked = s.settings.exportPending;
    $("vaultInfo").textContent = s.vault ? "Toplantılar ve MyMind anahtarı işletim sistemi kasasında (Windows'ta DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: toplantılar düz dosyada saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.filter; render(); }));
  $("input").addEventListener("input", preview);
  $("tQuery").addEventListener("input", () => { state.tQuery = $("tQuery").value; renderLines(meeting()); });
  $("tSpeaker").addEventListener("change", () => { state.tSpeaker = $("tSpeaker").value; renderLines(meeting()); });
  $("listQuery").addEventListener("input", () => { state.listQuery = $("listQuery").value; renderList(); });
  $("showArchived").addEventListener("change", () => { state.showArchived = $("showArchived").checked; renderList(); });
  $("taskQuery").addEventListener("input", () => { state.taskQuery = $("taskQuery").value; renderTasks(); });
  $("taskOwner").addEventListener("change", () => { state.taskOwner = $("taskOwner").value; renderTasks(); });
  $("showDone").addEventListener("change", () => { state.showDone = $("showDone").checked; renderTasks(); });
  $("mTitle").addEventListener("change", guard(async () => { const m = meeting(); if (m) apply(await D.meeting.update(m.id, { title: $("mTitle").value })); }));

  const acts = {
    sample: async () => {
      const r = await D.sample();
      $("input").value = r.text; $("inTitle").value = r.title; $("inDate").value = r.date; state.sourceName = r.name;
      preview();
      toast("Örnek toplantı yüklendi (uydurma kişiler). Bilgilendirme seçeneğini işaretleyip Çözümle'ye basın.");
    },
    openFile: async () => {
      const r = await D.openFile();
      if (r.cancelled) return;
      $("input").value = r.text; state.sourceName = r.name;
      if (!$("inTitle").value.trim()) $("inTitle").value = r.name.replace(/\.[^.]+$/, "");
      preview();
      toast(r.name + " açıldı (" + C.FORMAT_NAMES[r.format] + ")" + (r.truncated ? "; dosya kısaltıldı" : "") + ".");
    },
    create: async () => {
      const consent = (document.querySelector('input[name="consent"]:checked') || {}).value;
      if (!consent) { $("consentBox").classList.add("is-error"); throw new Error("Bilgilendirme / izin seçeneğini işaretleyin."); }
      $("consentBox").classList.remove("is-error");
      busy("Çözümleniyor…");
      const r = await D.meeting.create($("input").value, { title: $("inTitle").value, date: $("inDate").value || todayIso(), consent, sourceName: state.sourceName, sample: state.sourceName === "lansman-toplantisi.txt" });
      busy(null);
      $("input").value = ""; $("inTitle").value = ""; state.sourceName = ""; document.querySelectorAll('input[name="consent"]').forEach((x) => { x.checked = false; }); preview();
      state.filter = "aday"; state.focus = null; setTab("items");
      apply(r.state);
      toast(n(r.parsed.utterances) + " satır, " + n(r.parsed.speakers) + " konuşmacı · " + n(r.items) + " karar/görev adayı onayınızı bekliyor" + (r.parsed.guessed ? " · " + n(r.parsed.guessed) + " satırın konuşmacısı tahmin" : "") + ".");
    },
    reextract: async () => { const r = await D.meeting.reextract(meeting().id); apply(r.state); toast(r.added ? n(r.added) + " yeni aday eklendi." : "Yeni aday yok (onaylı ve reddedilen maddeler korunur)."); },
    ai: async () => {
      const m = meeting();
      if (state.s.settings.provider === "hub" && !state.s.hasKey) { openMymind(); return; }
      busy("Çıkarım isteği onayınızı bekliyor…");
      const r = await D.ai.extract(m.id);
      busy(null);
      if (!r.approved) { toast("Gönderilmedi."); return; }
      apply(r.state);
      state.filter = "aday"; render();
      toast(n(r.added) + " yeni aday eklendi" + (r.duplicates ? ", " + n(r.duplicates) + " zaten vardı" : "") + (r.dropped ? ", " + n(r.dropped) + " kaynaksız madde atıldı" : "") + (r.errors.length ? " · " + r.errors[0] : "") + ".");
    },
    export: async () => { const r = await D.meeting.exportAs(meeting().id, $("exportFormat").value); if (!r.cancelled) toast(r.file + " kaydedildi."); },
    copy: async () => { await D.meeting.copy(meeting().id); toast("Özet (Markdown) panoya kopyalandı."); },
    new: async () => { apply(await D.meeting.open(null)); },
    backup: async () => { const r = await D.meeting.backup(); if (!r.cancelled) toast(r.file + " kaydedildi."); },
    approveAll: async () => {
      const m = meeting();
      const ids = m.items.filter((x) => x.status === "aday" && (x.kind === "karar" || (x.owner && x.owner.state === "kesin"))).map((x) => x.id);
      if (!ids.length) { toast("Sahibi kesin olan aday yok; diğerlerini tek tek inceleyin."); return; }
      let st = null;
      for (const id of ids) st = await D.item.set(m.id, id, { status: "onayli" });
      apply(st);
      toast(n(ids.length) + " madde onaylandı. Tahmin ve belirsiz sahipli olanlar bekliyor.");
    },
  };
  document.querySelectorAll("[data-act]").forEach((b) => { if (acts[b.dataset.act]) b.addEventListener("click", guard(acts[b.dataset.act])); });
  $("createBtn").addEventListener("click", guard(acts.create));
  $("addForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    const m = meeting();
    apply(await D.item.add(m.id, { kind: $("addKind").value, text: $("addText").value, ownerKey: $("addOwner").value, ref: state.focus }));
    $("addText").value = "";
    toast("Madde eklendi ve onaylandı" + (state.focus ? " (seçili satıra bağlandı)." : "."));
  }));
  $("lines").addEventListener("click", (e) => { const li = e.target.closest(".mt-line"); if (li) { state.focus = li.dataset.u; document.querySelectorAll(".mt-line.is-focus").forEach((x) => x.classList.remove("is-focus")); li.classList.add("is-focus"); } });

  // Ayarlar
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("setMinutes").addEventListener("change", guard(async () => apply(await D.setSettings({ minutes: Number($("setMinutes").value) }))));
  $("setPending").addEventListener("change", guard(async () => apply(await D.setSettings({ exportPending: $("setPending").checked }))));

  // MyMind
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok.";
    $("mymindDialog").showModal();
  }
  $("openMymind").addEventListener("click", openMymind);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar kasaya kaydedildi." : "Anahtar bu oturum için bellekte tutuluyor."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));

  D.onState((s) => apply(s));
  $("inDate").value = todayIso();
  go("meet");
  setTab("items");
  D.state().then((s) => { apply(s); document.documentElement.dataset.ready = "1"; });
})();
