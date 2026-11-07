/* Meeting Trace — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; bunlar ana süreçte yapılır. Ayrıştırma önizlemesi ve hassas değer uyarısı
 * aynı çekirdeği (src/core.js, saf işlevler) kullanır. Kalıcı her değişiklik ana süreçte yapılır ve yeni durum geri gelir. */
(function () {
  const D = window.mtDesktop;
  const C = window.MTCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["meet", "meetings", "tasks", "settings"];
  const TABS = ["items", "speakers", "notes"];
  const state = { s: null, view: "meet", tab: "items", selLine: null, selItem: null, filter: "hepsi", lineQ: "", taskKind: "gorev", taskQ: "", onlyApproved: true, onlyUnclear: false, showArchived: false, srcName: "", forceStart: false };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
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
    setTimeout(() => t.remove(), 6000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const n = (x) => Number(x).toLocaleString("tr-TR");
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", (e) => { e.stopPropagation(); guard(onClick)(e); }); return b; };
  const mt = () => state.s && state.s.meeting;
  const shortDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : ""; };
  const longDate = (iso) => C.fmtDateTr(iso);
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  const KIND_TONE = { karar: "success", gorev: "accent", soru: "info" };

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "meet";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }
  function tab(t) {
    state.tab = TABS.includes(t) ? t : "items";
    for (const x of TABS) $("tab-" + x).hidden = x !== state.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => { b.classList.toggle("is-active", b.dataset.tab === state.tab); b.setAttribute("aria-selected", b.dataset.tab === state.tab ? "true" : "false"); });
  }

  // ---------------- Durum ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    const live = s.meetings.filter((m) => !m.archived);
    $("meetCount").textContent = String(live.length);
    $("taskCount").textContent = String(s.items.filter((x) => x.kind === "gorev" && x.status === "onayli").length);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const st = s.stats;
    put($("sideInfo"), el("div", { class: "mt-mini__in" },
      el("span", { class: "pl-muted mt-small", text: "Görev kesinliği (kullanımda)" }), el("b", { class: st.taskPrecision == null ? "" : st.taskPrecision >= 90 ? "is-ok" : "is-bad", text: pctText(st.taskPrecision) }),
      el("span", { class: "pl-muted mt-small", text: st.decidedTasks ? st.decidedTasks + " kural görevi değerlendirildi" : "Henüz değerlendirilmiş görev yok" }),
      el("span", { class: "pl-muted mt-small", text: st.ownerUnclear ? st.ownerUnclear + " görevin sorumlusu belirsiz" : "Sorumlusu belirsiz görev yok" })));
    renderMeet();
    renderMeetings();
    renderTasks();
    renderSettings();
  }

  // ---------------- Başlangıç ----------------
  let liveTimer = null;
  function live() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(renderInputInfo, 160);
    $("inCount").textContent = n($("input").value.length) + " karakter";
  }
  function renderInputInfo() {
    const v = $("input").value;
    if (!v.trim()) { $("inFormat").textContent = ""; $("sensWarn").hidden = true; return; }
    const p = C.parseTranscript(v);
    const sp = new Set(p.lines.map((l) => l.speaker).filter(Boolean));
    $("inFormat").textContent = "Biçim: " + C.FORMAT_NAMES[p.format] + " · " + n(p.lines.length) + " satır · " + sp.size + " konuşmacı";
    const sens = C.sensitiveSummary(v);
    $("sensWarn").hidden = !sens.length;
    if (sens.length) put($("sensWarn"), icon("lock"), el("div", {}, el("div", { class: "pl-callout__title", text: "Transkriptte hassas bilgi var: " + sens.map((x) => x.count + " " + x.label).join(", ") }), el("span", { text: "Toplantı yalnız bu bilgisayarda saklanır. MyMind kullanırsanız bu değerler gönderilmez (yer tutucu gider)." })));
  }
  function setInput(text, o) {
    o = o || {};
    $("input").value = text;
    if (o.title != null) $("inTitle").value = o.title;
    if (o.date) $("inDate").value = o.date;
    state.srcName = o.name || "";
    live();
    renderInputInfo();
    state.forceStart = true;
    render();
    go("meet");
  }
  function renderMeet() {
    const m = mt();
    const showStart = !m || state.forceStart;
    $("startPanel").hidden = !showStart;
    $("meetPanel").hidden = showStart;
    if (!$("inDate").value && state.s) $("inDate").value = state.s.today;
    if (showStart) return;
    if (document.activeElement !== $("mTitle")) $("mTitle").value = m.title;
    if (document.activeElement !== $("mDate")) $("mDate").value = m.date;
    const ms = m.stats || C.meetingStats(m);
    put($("mBadges"), badge(C.FORMAT_NAMES[m.source.format]), ms.duration != null ? badge(C.fmtTime(ms.duration)) : null, badge(m.lines.length + " satır"), badge(m.speakers.length + " konuşmacı"), m.consent.informed ? badge("Bilgilendirme beyanı", "success") : badge("Beyan yok", "warning"));
    const stat = (v, label, cls) => el("div", { class: "mt-stat" }, el("b", { class: cls || "", text: String(v) }), el("span", { text: label }));
    put($("mStats"), stat(ms.drafts, "taslak", ms.drafts ? "is-bad" : "is-ok"), stat(ms.approved, "onaylı"), stat(ms.ownerUnclear, "sorumlu belirsiz", ms.ownerUnclear ? "is-bad" : "is-ok"), stat(ms.guessed, "konuşmacı tahmini", ms.guessed ? "is-bad" : "is-ok"));
    renderLines(m);
    renderItems(m);
    renderSpeakers(m);
    renderNotes(m);
    tab(state.tab);
  }

  // ---------------- Transkript ----------------
  const spIndex = (m, key) => m.speakers.findIndex((s) => s.key === key);
  const spClass = (m, key) => { const i = spIndex(m, key); return "mt-c" + (i < 0 ? 0 : (i % 6) + 1); };
  const spName = (m, key) => { const s = m.speakers.find((x) => x.key === key); return s ? s.name || s.label || "Adsız" : "Bilinmiyor"; };
  function renderLines(m) {
    const box = $("lines");
    const top = box.scrollTop;
    const q = C.fold(state.lineQ.trim());
    const byLine = new Map();
    for (const it of m.items) for (const l of it.lineIds) { if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(it); }
    const notesBy = new Map();
    for (const nt of m.notes) if (nt.lineId) notesBy.set(nt.lineId, (notesBy.get(nt.lineId) || 0) + 1);
    const rows = m.lines.map((l) => {
      const sp = m.speakers.find((x) => x.key === l.speaker);
      const sel = state.selLine === l.id;
      const row = el("div", { class: "mt-line" + (sel ? " is-sel" : "") + (q && !C.fold(l.text + " " + (sp ? sp.name || sp.label : "")).includes(q) ? " is-dim" : ""), role: "listitem", tabindex: "0", "data-id": l.id });
      const who = el("div", { class: "mt-who " + spClass(m, l.speaker) }, el("b", { text: l.speaker ? spName(m, l.speaker) : "Bilinmiyor", title: sp && sp.label !== sp.name ? "Transkriptteki etiket: " + sp.label : null }));
      if (l.guess) who.appendChild(el("span", { class: "pl-badge pl-badge--warning", text: "tahmin", title: l.guessWhy || "Bu satırda konuşmacı yazmıyor; önceki konuşmacı varsayıldı." }));
      else if (sp && !sp.name) who.appendChild(badge("adsız", "warning"));
      const marks = el("div", { class: "mt-marks" });
      for (const it of byLine.get(l.id) || []) if (it.status !== "red") marks.appendChild(badge(C.KIND_NAMES[it.kind] + (it.status === "onayli" ? " ✓" : ""), it.status === "onayli" ? "success" : KIND_TONE[it.kind]));
      if (notesBy.get(l.id)) marks.appendChild(badge(notesBy.get(l.id) + " not", "warning"));
      const say = el("div", { class: "mt-say" }, el("p", { text: l.text }), marks.childNodes.length ? marks : null);
      if (sel) say.appendChild(lineActions(m, l));
      row.append(el("span", { class: "mt-time", text: C.fmtTime(l.t) }), who, say);
      row.addEventListener("click", (e) => { if (e.target.closest("input,select,button,textarea")) return; selectLine(l.id); });
      row.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === row) selectLine(l.id); });
      return row;
    });
    box.replaceChildren(...rows);
    box.scrollTop = top;
  }
  function lineActions(m, l) {
    const sel = el("select", { class: "pl-input", "aria-label": "Satırın konuşmacısı" });
    sel.appendChild(el("option", { value: "", text: "Konuşmacı: bilinmiyor" }));
    for (const s of m.speakers) { const o = el("option", { value: s.key, text: "Konuşmacı: " + (s.name || s.label) }); if (s.key === l.speaker) o.selected = true; sel.appendChild(o); }
    sel.addEventListener("change", guard(async () => { apply(await D.line.setSpeaker(m.id, l.id, sel.value)); toast("Satırın konuşmacısı doğrulandı."); }));
    const note = el("input", { class: "pl-input mt-noteinput", maxlength: "500", placeholder: "Bu ana (" + C.fmtTime(l.t) + ") not ekle", "aria-label": "Not" });
    const addNote = guard(async () => { if (!note.value.trim()) return; apply(await D.note.add(m.id, l.id, note.value)); toast("Not eklendi (" + C.fmtTime(l.t) + ")."); });
    note.addEventListener("keydown", (e) => { if (e.key === "Enter") addNote(); });
    const add = (kind) => btn("+ " + C.KIND_NAMES[kind], "pl-btn--ghost", async () => { const r = await D.item.add(m.id, { lineId: l.id, kind }); state.selItem = r.id; state.tab = "items"; apply(r.state); toast(C.KIND_NAMES[kind] + " taslağı eklendi; düzenleyip onaylayın."); });
    const wrap = el("div", { class: "mt-lineacts" }, sel, note, btn("Not ekle", "pl-btn--secondary", addNote), add("gorev"), add("karar"), add("soru"));
    if (l.guess) wrap.prepend(btn("Tahmini doğrula", "pl-btn--secondary", async () => { apply(await D.line.setSpeaker(m.id, l.id, l.speaker)); toast("Konuşmacı doğrulandı."); }));
    return wrap;
  }
  function selectLine(id, scroll) {
    state.selLine = state.selLine === id && !scroll ? null : id;
    renderLines(mt());
    if (scroll) {
      const row = $("lines").querySelector('[data-id="' + id + '"]');
      if (row) { row.scrollIntoView({ block: "center" }); row.classList.add("is-flash"); setTimeout(() => row.classList.remove("is-flash"), 1200); }
    }
  }

  // ---------------- Taslaklar ----------------
  function ownerLabel(m, it) {
    if (it.kind !== "gorev") return null;
    const who = C.ownerText(m, it);
    const extra = it.ownerState === "tahmin" ? " (tahmin)" : it.ownerState === "belirsiz" ? " — atanmadı" : "";
    return el("span", { class: "mt-owner is-" + it.ownerState, text: "Sorumlu: " + who + extra, title: it.why || null });
  }
  function itemCard(m, it) {
    const sel = state.selItem === it.id;
    const line = m.lines.find((l) => l.id === it.lineIds[0]);
    const card = el("div", { class: "mt-item is-" + it.status + (sel ? " is-sel" : ""), tabindex: "0", "data-id": it.id, role: "listitem" });
    const head = el("div", { class: "mt-item__head" }, badge(C.KIND_NAMES[it.kind], KIND_TONE[it.kind]));
    if (it.origin !== "kural") head.appendChild(badge(it.origin === "mymind" ? "MyMind" : "Elle", it.origin === "mymind" ? "warning" : null));
    if (it.status !== "taslak") head.appendChild(badge(C.STATUS_NAMES[it.status], it.status === "onayli" ? "success" : "danger"));
    if (it.confidence === "dusuk" && it.status === "taslak") head.appendChild(badge("düşük güven", "warning"));
    card.append(head, el("p", { class: "mt-item__text", text: it.text }));
    const meta = el("div", { class: "mt-item__meta" });
    const time = el("button", { type: "button", class: "mt-timebtn", text: C.fmtTime(line ? line.t : null), title: "Transkriptte göster" });
    time.addEventListener("click", (e) => { e.stopPropagation(); selectLine(it.lineIds[0], true); });
    meta.append(time, el("span", { text: line && line.speaker ? spName(m, line.speaker) + (line.guess ? " (tahmin)" : "") : "Konuşmacı bilinmiyor" }));
    const ol = ownerLabel(m, it);
    if (ol) meta.appendChild(ol);
    if (it.kind === "gorev" && it.due) meta.appendChild(el("span", { text: "Son tarih: " + longDate(it.due) + (it.dueText ? " (“" + it.dueText + "”)" : "") }));
    card.appendChild(meta);
    if (sel) card.appendChild(editBox(m, it));
    const acts = el("div", { class: "mt-acts" },
      btn(it.status === "onayli" ? "Onayı geri al" : "Onayla", it.status === "onayli" ? "pl-btn--ghost" : "pl-btn--primary", async () => { apply(await D.item.decide(m.id, it.id, "onayli")); }, { "data-act": "approve" }),
      btn(it.status === "red" ? "Reddi geri al" : "Reddet", "pl-btn--ghost", async () => { apply(await D.item.decide(m.id, it.id, "red")); }, { "data-act": "reject" }),
      sel ? null : btn("Düzenle", "pl-btn--ghost", () => { state.selItem = it.id; renderItems(m); }, { "data-act": "edit" }));
    card.appendChild(acts);
    card.addEventListener("click", (e) => { if (e.target.closest("input,select,button,textarea")) return; state.selItem = sel ? null : it.id; renderItems(m); });
    return card;
  }
  function editBox(m, it) {
    const ta = el("textarea", { class: "pl-input", maxlength: "280", "aria-label": "Öğe metni" });
    ta.value = it.text;
    const kind = el("select", { class: "pl-input", "aria-label": "Tür" });
    for (const k of C.KINDS) { const o = el("option", { value: k, text: C.KIND_NAMES[k] }); if (k === it.kind) o.selected = true; kind.appendChild(o); }
    const box = el("div", { class: "mt-edit" }, ta, el("div", { class: "mt-row" }, kind));
    let owner = null, due = null, other = null;
    if (it.kind === "gorev") {
      owner = el("select", { class: "pl-input", "aria-label": "Sorumlu" });
      const opt = (v, t, on) => { const o = el("option", { value: v, text: t }); if (on) o.selected = true; owner.appendChild(o); };
      opt("@belirsiz", "Sorumlu: belirsiz", !it.owner && !it.ownerName && it.ownerState !== "ekip");
      for (const s of m.speakers) opt(s.key, "Sorumlu: " + (s.name || s.label), it.owner === s.key);
      for (const p of m.participants || []) opt("@ad:" + p, "Sorumlu: " + p, it.ownerName === p);
      if (it.ownerName && !(m.participants || []).includes(it.ownerName)) opt("@ad:" + it.ownerName, "Sorumlu: " + it.ownerName, true);
      opt("@ekip", "Sorumlu: ekip (kişi yok)", it.ownerState === "ekip");
      other = el("input", { class: "pl-input", maxlength: "60", placeholder: "ya da ad yazın", "aria-label": "Başka sorumlu adı" });
      due = el("input", { class: "pl-input mt-date", type: "date", "aria-label": "Son tarih", value: it.due || "" });
      box.append(el("div", { class: "mt-row" }, owner, other), el("div", { class: "mt-row" }, el("span", { class: "pl-muted mt-small", text: "Son tarih" }), due));
    }
    if (it.why) box.appendChild(el("p", { class: "mt-why", text: "Neden: " + it.why }));
    box.appendChild(el("div", { class: "mt-acts" }, btn("Kaydet", "pl-btn--secondary", async () => {
      const patch = {};
      if (ta.value.trim() !== it.text) patch.text = ta.value;
      if (kind.value !== it.kind) patch.kind = kind.value;
      if (owner) {
        const ov = other.value.trim() ? "@ad:" + other.value.trim() : owner.value;
        const cur = it.owner || (it.ownerName ? "@ad:" + it.ownerName : it.ownerState === "ekip" ? "@ekip" : "@belirsiz");
        if (ov !== cur || (it.ownerState === "tahmin" && ov === cur)) patch.owner = ov;
        if ((due.value || "") !== (it.due || "")) patch.due = due.value;
      }
      if (!Object.keys(patch).length) { state.selItem = null; renderItems(m); return; }
      apply(await D.item.update(m.id, it.id, patch));
      toast("Öğe güncellendi.");
    }, { "data-act": "save" }), btn("Kapat", "pl-btn--ghost", () => { state.selItem = null; renderItems(m); })));
    return box;
  }
  function renderItems(m) {
    const box = $("tab-items");
    const counts = { hepsi: m.items.length, taslak: m.items.filter((x) => x.status === "taslak").length, onayli: m.items.filter((x) => x.status === "onayli").length };
    const seg = el("div", { class: "pl-segment mt-filter", role: "radiogroup", "aria-label": "Durum süzgeci" });
    for (const [k, t] of [["hepsi", "Hepsi"], ["taslak", "Taslak"], ["onayli", "Onaylı"]]) {
      const b = el("button", { type: "button", role: "radio", class: state.filter === k ? "is-active" : "", "aria-checked": state.filter === k ? "true" : "false", "data-filter": k, text: t + " " + counts[k] });
      b.addEventListener("click", () => { state.filter = k; renderItems(m); });
      seg.appendChild(b);
    }
    const kids = [seg];
    const ms = C.meetingStats(m);
    if (ms.ownerUnclear) kids.push(el("div", { class: "pl-callout pl-callout--warning" }, icon("alert"), el("div", {}, el("div", { class: "pl-callout__title", text: ms.ownerUnclear + " görevin sorumlusu belirsiz" }), el("span", { text: "Kime verildiği transkriptten çıkarılamadı. Düzenle → Sorumlu ile atayın ya da belirsiz olarak onaylayın." }))));
    for (const kind of C.KINDS) {
      const list = m.items.filter((x) => x.kind === kind && (state.filter === "hepsi" || x.status === state.filter));
      const sorted = list.slice().sort((a, b) => m.lines.findIndex((l) => l.id === a.lineIds[0]) - m.lines.findIndex((l) => l.id === b.lineIds[0]));
      const g = el("div", { class: "mt-group", role: "list", "aria-label": C.KIND_PLURAL[kind], "data-kind": kind }, el("div", { class: "mt-group__head" }, el("span", { text: C.KIND_PLURAL[kind] }), badge(String(list.length))));
      if (!list.length) g.appendChild(el("p", { class: "mt-why", text: state.filter === "hepsi" ? "Bulunamadı. Transkriptte satır seçip elle ekleyebilirsiniz." : "Bu süzgeçte öğe yok." }));
      for (const it of sorted) g.appendChild(itemCard(m, it));
      kids.push(g);
    }
    const top = box.scrollTop;
    box.replaceChildren(...kids);
    box.scrollTop = top;
  }

  // ---------------- Konuşmacılar ----------------
  function renderSpeakers(m) {
    const st = C.speakerStats(m);
    const kids = [];
    const guessed = m.lines.filter((l) => l.guess).length;
    if (guessed) kids.push(el("div", { class: "pl-callout pl-callout--warning" }, icon("alert"), el("div", {}, el("div", { class: "pl-callout__title", text: guessed + " satırın konuşmacısı tahmin" }), el("span", { text: "Transkriptte konuşmacı yazmıyor; önceki konuşmacı varsayıldı. Satırı seçip konuşmacıyı doğrulayın." }))));
    for (const s of m.speakers) {
      const x = st.by[s.key] || { lines: 0, chars: 0, guessed: 0 };
      const share = st.total ? Math.round((x.chars / st.total) * 100) : 0;
      const name = el("input", { class: "pl-input", maxlength: "60", placeholder: s.label ? s.label + " — gerçek adını yazın" : "Ad", "aria-label": "Konuşmacı adı: " + s.label, value: s.name, "data-key": s.key });
      name.addEventListener("change", guard(async () => { apply(await D.speaker.rename(m.id, s.key, name.value)); toast("Konuşmacı adı kaydedildi."); }));
      const merge = el("select", { class: "pl-input", "aria-label": "Başka konuşmacıyla birleştir" });
      merge.appendChild(el("option", { value: "", text: "Aynı kişi mi? Şununla birleştir…" }));
      for (const o of m.speakers) if (o.key !== s.key) merge.appendChild(el("option", { value: o.key, text: o.name || o.label }));
      merge.addEventListener("change", guard(async () => { if (!merge.value) return; apply(await D.speaker.merge(m.id, s.key, merge.value)); toast("Konuşmacılar birleştirildi."); }));
      kids.push(el("div", { class: "mt-spk " + spClass(m, s.key) },
        el("div", { class: "mt-spk__head" }, el("span", { class: "mt-dot" }), name),
        el("span", { class: "pl-muted mt-small", text: x.lines + " satır · konuşmanın %" + share + "'i" + (x.guessed ? " · " + x.guessed + " tahmin satır" : "") + (s.label && s.label !== s.name ? " · etiket: " + s.label : "") }),
        el("div", { class: "mt-share" }, el("i", { style: null })),
        m.speakers.length > 1 ? merge : null));
      kids[kids.length - 1].querySelector(".mt-share > i").style.width = share + "%";
    }
    const none = (st.by[""] || {}).lines;
    if (none) kids.push(el("p", { class: "mt-why", text: none + " satırda konuşmacı yok (transkriptin başında konuşmacı yazmıyor)." }));
    if ((m.participants || []).length) kids.push(el("p", { class: "mt-why", text: "Konuşmayan katılımcılar: " + m.participants.join(", ") }));
    $("tab-speakers").replaceChildren(...kids);
  }

  // ---------------- Notlar ----------------
  function renderNotes(m) {
    const kids = [];
    const line = m.lines.find((l) => l.id === state.selLine);
    const input = el("input", { class: "pl-input mt-grow", maxlength: "500", placeholder: line ? "Seçili ana (" + C.fmtTime(line.t) + ") not" : "Genel not (zaman için önce satır seçin)", "aria-label": "Yeni not", id: "noteInput" });
    const add = guard(async () => { if (!input.value.trim()) return; apply(await D.note.add(m.id, line ? line.id : "", input.value)); toast("Not eklendi."); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    kids.push(el("div", { class: "mt-row" }, input, btn("Ekle", "pl-btn--secondary", add)));
    const notes = m.notes.slice().sort((a, b) => (a.t ?? 1e9) - (b.t ?? 1e9));
    if (!notes.length) kids.push(el("p", { class: "mt-why", text: "Henüz not yok. Transkriptte bir satır seçip “Not ekle” ile o ana not düşebilirsiniz; notlar toplantı notuna zaman damgasıyla girer." }));
    for (const nt of notes) {
      const time = el("button", { type: "button", class: "mt-timebtn", text: C.fmtTime(nt.t), title: "Transkriptte göster" });
      time.addEventListener("click", () => { if (nt.lineId) selectLine(nt.lineId, true); });
      const x = el("button", { type: "button", class: "mt-ico-btn", "aria-label": "Notu kaldır", title: "Notu kaldır" }, icon("x"));
      x.addEventListener("click", guard(async () => { apply(await D.note.remove(m.id, nt.id)); }));
      kids.push(el("div", { class: "mt-note" }, time, el("p", { text: nt.text }), x));
    }
    $("tab-notes").replaceChildren(...kids);
  }

  // ---------------- Toplantılar ----------------
  function renderMeetings() {
    const s = state.s;
    const list = s.meetings.filter((m) => state.showArchived || !m.archived);
    if (!list.length) { put($("meetList"), el("li", { class: "mt-empty", text: s.meetings.length ? "Arşivde toplantı var; “Arşivi göster” ile görebilirsiniz." : "Henüz toplantı yok. Toplantı bölümünden transkript yükleyin." })); return; }
    put($("meetList"), ...list.map((m) => {
      const st = m.stats;
      return el("li", { class: "mt-mrow" + (m.archived ? " is-archived" : "") },
        el("div", { class: "mt-mrow__head" }, el("b", { text: m.title }), badge(shortDate(m.date)), m.sample ? badge("Örnek", "info") : null, m.archived ? badge("Arşivde", "warning") : null,
          badge(st.approved + " onaylı", st.approved ? "success" : null), st.drafts ? badge(st.drafts + " taslak", "accent") : null, st.ownerUnclear ? badge(st.ownerUnclear + " sorumlu belirsiz", "warning") : null,
          el("span", { class: "mt-grow" }),
          m.archived ? btn("Geri al", "pl-btn--ghost", async () => { apply(await D.meeting.restore(m.id)); toast("Toplantı geri alındı."); })
            : btn("Aç", "pl-btn--secondary", async () => { state.forceStart = false; state.selLine = null; state.selItem = null; apply(await D.meeting.open(m.id)); go("meet"); }),
          m.archived ? null : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.meeting.archive(m.id)); toast("Toplantı arşivlendi (silinmedi)."); })),
        el("p", { class: "mt-mrow__sub", text: C.FORMAT_NAMES[m.format] + " · " + st.lines + " satır · " + (st.duration != null ? C.fmtTime(st.duration) + " · " : "") + m.people.join(", ") + (m.sourceName ? " · " + m.sourceName : "") }));
    }));
  }

  // ---------------- Karar ve görevler ----------------
  function renderTasks() {
    const s = state.s;
    document.querySelectorAll("[data-kind]").forEach((b) => { if (!b.closest("#taskTable") && b.tagName === "BUTTON") { const on = b.dataset.kind === state.taskKind; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); } });
    const q = C.fold(state.taskQ.trim());
    const list = s.items.filter((x) => x.kind === state.taskKind && (!state.onlyApproved || x.status === "onayli") && (!state.onlyUnclear || x.ownerState === "belirsiz" || x.ownerState === "ekip") && (!q || C.fold(x.text + " " + x.ownerLabel + " " + x.meetingTitle).includes(q)))
      .sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : b.meetingDate < a.meetingDate ? -1 : 1);
    $("taskInfo").textContent = list.length + " öğe";
    const head = el("div", { class: "mt-trow mt-trow--head", role: "row" }, el("span", { text: C.KIND_NAMES[state.taskKind] }), el("span", { text: state.taskKind === "gorev" ? "Sorumlu" : "" }), el("span", { text: state.taskKind === "gorev" ? "Son tarih" : "" }), el("span", { text: "Toplantı" }), el("span"));
    if (!list.length) { put($("taskTable"), head, el("p", { class: "mt-empty", text: state.onlyApproved ? "Onaylanmış öğe yok. Toplantıdaki taslakları onaylayın ya da “Yalnız onaylı” süzgecini kaldırın." : "Öğe yok." })); return; }
    put($("taskTable"), head, ...list.map((x) => el("div", { class: "mt-trow", role: "row" },
      el("span", {}, el("span", { text: x.text }), el("span", { class: "mt-sub", text: (x.status === "onayli" ? "Onaylı" : "Taslak") + (x.origin === "mymind" ? " · MyMind" : x.origin === "elle" ? " · elle" : "") })),
      el("span", { class: "mt-owner is-" + x.ownerState, text: x.kind === "gorev" ? x.ownerLabel + (x.ownerState === "tahmin" ? " (tahmin)" : "") : "" }),
      el("span", { class: "mt-due" + (x.due && x.due < s.today && x.status !== "red" ? " is-late" : ""), text: x.due ? longDate(x.due) : x.kind === "gorev" ? "—" : "" }),
      el("span", {}, el("span", { text: x.meetingTitle }), el("span", { class: "mt-sub", text: shortDate(x.meetingDate) + " · " + x.time })),
      btn("Aç", "pl-btn--ghost", async () => {
        state.forceStart = false; state.selItem = x.id; state.selLine = x.lineIds[0]; state.tab = "items"; state.filter = "hepsi";
        apply(await D.meeting.open(x.meetingId)); go("meet"); selectLine(x.lineIds[0], true);
      }))));
  }

  // ---------------- Ölçüler ve ayarlar ----------------
  function renderSettings() {
    const s = state.s, st = s.stats, b = s.bench;
    const box = (v, label, ok) => el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: v }), el("span", { text: label }));
    const benchP = b && b.precision != null ? Math.round(b.precision * 1000) / 10 : null;
    put($("metrics"),
      box(pctText(benchP), "etiketli örnekte kesinlik (" + (b ? b.tp + "/" + b.predicted : "—") + "; hedef ≥ %90)", benchP == null ? null : benchP >= 90),
      box(pctText(b && b.recall != null ? Math.round(b.recall * 1000) / 10 : null), "etiketli örnekte duyarlılık (" + (b ? b.tp + "/" + b.gold : "—") + ")"),
      box(pctText(st.taskPrecision), "görev kesinliği — kullanımda (" + st.decidedTasks + " değerlendirme)", st.taskPrecision == null ? null : st.taskPrecision >= 90),
      box(pctText(st.precision), "tüm kural taslakları — kullanımda (" + st.decidedRule + ")"),
      box(String(st.ownerUnclear), "sorumlusu belirsiz görev (" + st.openTasks + " görevden)", st.ownerUnclear ? false : true),
      box(pctText(st.aiPrecision), "MyMind önerisi kabulü (" + st.decidedAi + ")"),
      box(n(st.meetings), "toplantı (" + n(st.lines) + " satır)"),
      box(n(st.metrics.exports + st.metrics.copies), "dışa aktarma / kopyalama"));
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("localBox").hidden = s.settings.provider !== "yerel";
    $("setGuess").checked = s.settings.autoGuess;
    $("vaultInfo").textContent = s.vault ? "Toplantılar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır; yedek dosyası (JSON) şifresizdir." : "Bu sistemde işletim sistemi kasası yok: toplantılar şifresiz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }

  // ---------------- MyMind ----------------
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var. Yenisini yapıştırırsanız değiştirilir." : state.s.vault ? "Henüz anahtar yok." : "Bu sistemde kasa yok: anahtar yalnız bu oturumda bellekte tutulur.";
    $("mymindDialog").showModal();
  }

  // ---------------- Olaylar ----------------
  function bind() {
    document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => { go(b.dataset.nav); if (b.dataset.nav === "meet" && mt()) { state.forceStart = false; render(); } }));
    document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => tab(b.dataset.tab)));
    $("input").addEventListener("input", live);
    $("sampleBtn").addEventListener("click", guard(async () => { const r = await D.sample(); setInput(r.text, { title: r.title, date: r.date, name: r.name }); toast("Örnek transkript yüklendi (uydurma kişiler). İzin beyanını işaretleyip Çözümle'ye basın."); }));
    $("openFileBtn").addEventListener("click", guard(async () => {
      const r = await D.openFile();
      if (r.cancelled) return;
      setInput(r.text, { title: $("inTitle").value || r.name.replace(/\.[a-z0-9]+$/i, ""), name: r.name });
      toast(r.name + " açıldı" + (r.truncated ? " (sınır nedeniyle kısaltıldı)" : "") + ".");
    }));
    $("consent").addEventListener("change", () => $("consent").closest(".mt-consent").classList.remove("is-missing"));
    $("createBtn").addEventListener("click", guard(async () => {
      if (!$("consent").checked) { $("consent").closest(".mt-consent").classList.add("is-missing"); throw new Error("Katılımcı bilgilendirme beyanını işaretleyin."); }
      busy("Çözümleniyor…");
      const r = await D.meeting.create($("input").value, { title: $("inTitle").value, date: $("inDate").value, consent: true, sourceName: state.srcName, participants: $("inPeople").value });
      busy(null);
      state.forceStart = false; state.selLine = null; state.selItem = null; state.filter = "hepsi"; state.tab = "items";
      $("input").value = ""; $("inTitle").value = ""; $("inPeople").value = ""; $("consent").checked = false; state.srcName = ""; live(); renderInputInfo();
      apply(r.state);
      toast(r.lines + " satır (" + C.FORMAT_NAMES[r.format] + ") çözümlendi: " + r.items + " taslak. Her birini onaylayın ya da reddedin.");
    }));
    $("newBtn").addEventListener("click", () => { state.forceStart = true; render(); $("input").focus(); });
    $("mTitle").addEventListener("change", guard(async () => { apply(await D.meeting.update(mt().id, { title: $("mTitle").value })); }));
    $("mDate").addEventListener("change", guard(async () => { if (!$("mDate").value) return; apply(await D.meeting.update(mt().id, { date: $("mDate").value })); toast("Tarih güncellendi; göreli son tarihler yeniden hesaplandı."); }));
    $("lineSearch").addEventListener("input", () => { state.lineQ = $("lineSearch").value; renderLines(mt()); });
    $("reBtn").addEventListener("click", guard(async () => { const r = await D.meeting.reextract(mt().id); apply(r.state); toast(r.added ? r.added + " yeni taslak eklendi." : "Yeni taslak yok; onayladıklarınız ve düzenledikleriniz korundu."); }));
    $("exportBtn").addEventListener("click", guard(async () => {
      const m = mt();
      if (!m.items.some((x) => x.status === "onayli")) toast("Henüz onaylı öğe yok: dosyada yalnız başlık ve notlar olacak.", true);
      const r = await D.meeting.exportAs(m.id, $("exportFmt").value);
      if (!r.cancelled) toast(r.file + " kaydedildi (" + r.approved + " onaylı öğe).");
    }));
    $("copyBtn").addEventListener("click", guard(async () => { const r = await D.meeting.copy(mt().id); toast("Toplantı notu panoya kopyalandı (" + n(r.copied) + " karakter)."); }));
    $("aiBtn").addEventListener("click", guard(async () => {
      if (state.s.settings.provider === "hub" && !state.s.hasKey) { openMymind(); return; }
      busy("MyMind çözümlüyor…");
      const r = await D.ai.extract(mt().id);
      busy(null);
      if (!r.approved) { toast("Gönderilmedi."); return; }
      apply(r.state);
      toast("MyMind: " + r.added + " yeni öneri" + (r.guesses ? ", " + r.guesses + " konuşmacı tahmini" : "") + (r.dup ? ", " + r.dup + " tekrar atlandı" : "") + (r.dropped ? ", " + r.dropped + " dayanaksız öneri atıldı" : "") + ". Öneriler onayınızı bekliyor." + (r.errors.length ? " Bazı istekler başarısız: " + r.errors[0] : ""), !!r.errors.length);
    }));
    $("showArchived").addEventListener("change", () => { state.showArchived = $("showArchived").checked; renderMeetings(); });
    $("backupBtn").addEventListener("click", guard(async () => { const r = await D.meeting.backup(); if (!r.cancelled) toast(r.file + " kaydedildi (" + r.count + " toplantı)."); }));
    document.querySelectorAll("#view-tasks [data-kind]").forEach((b) => b.addEventListener("click", () => { state.taskKind = b.dataset.kind; renderTasks(); }));
    $("taskSearch").addEventListener("input", () => { state.taskQ = $("taskSearch").value; renderTasks(); });
    $("onlyApproved").addEventListener("change", () => { state.onlyApproved = $("onlyApproved").checked; renderTasks(); });
    $("onlyUnclear").addEventListener("change", () => { state.onlyUnclear = $("onlyUnclear").checked; renderTasks(); });
    document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => { apply(await D.setSettings({ provider: r.value })); toast(r.value === "yerel" ? "Yerel model seçildi." : "MyMind (Hub) seçildi."); })));
    $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarları kaydedildi."); }));
    $("setGuess").addEventListener("change", guard(async () => { apply(await D.setSettings({ autoGuess: $("setGuess").checked })); }));
    $("openMymind").addEventListener("click", openMymind);
    $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
    $("mymindSave").addEventListener("click", guard(async () => {
      const r = await D.ai.setKey($("mymindKey").value);
      $("mymindDialog").close();
      toast(r.stored === "vault" ? "Anahtar Windows kasasında şifreli saklandı." : "Anahtar bu oturum için bellekte tutuluyor.");
    }));
    $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));
    D.onState((s) => apply(s));
  }

  bind();
  go("meet");
  tab("items");
  D.state().then((s) => { apply(s); document.documentElement.dataset.ready = "1"; }).catch((e) => toast("Başlatılamadı: " + clean(e), true));
})();
