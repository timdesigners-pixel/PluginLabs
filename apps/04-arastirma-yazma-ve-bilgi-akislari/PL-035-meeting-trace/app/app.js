/* Meeting Trace — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; bunlar ana süreçte yapılır. Transkript ön izlemesi (biçim, satır,
 * konuşmacı, hassas değer uyarısı) aynı çekirdeği (src/core.js) kullanır. Yapay zekâ isteği ana süreçte onaydan geçer. */
(function () {
  const D = window.mtDesktop;
  const C = window.MTCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["desk", "list", "tasks", "settings"];
  const state = { s: null, view: "desk", tab: "gorev", filter: "all", sel: null, lineQ: "", showArchived: false, owner: "*", hideDone: true, renaming: null, linesKey: "" };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    pin: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
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
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const n = (x) => Number(x).toLocaleString("tr-TR");
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const mt = () => state.s && state.s.meeting;
  const today = () => new Date().toISOString().slice(0, 10);
  const OWNER_TONE = { acik: "success", tahmin: "warning", belirsiz: "danger" };
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
    const active = s.meetings.filter((m) => !m.archived);
    $("mtCount").textContent = String(active.length);
    $("taskCount").textContent = String(s.stats.open);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const st = s.stats;
    const gold = st.gold[0];
    put($("sideInfo"), el("div", { class: "mt-mini__in" },
      el("span", { class: "pl-muted mt-small", text: "Görev çıkarma kesinliği" }),
      el("b", { class: st.review.precision == null ? "" : st.review.precision >= 90 ? "is-ok" : "is-bad", text: pctText(st.review.precision) }),
      el("span", { class: "pl-muted mt-small", text: st.review.approved + st.review.rejected ? st.review.approved + " onay · " + st.review.rejected + " red (sizin etiketiniz)" : "Henüz onay/red yok" }),
      gold ? el("span", { class: "pl-muted mt-small", text: "Etiketli örnek: " + pctText(gold.precision) }) : null,
      el("span", { class: "pl-muted mt-small", text: st.open + " açık görev · " + st.unclear + " sorumlusu belirsiz" })));
    renderDesk();
    renderList();
    renderTasks();
    renderSettings();
  }

  // ---------------- Başlangıç: transkript al ----------------
  let liveTimer = null;
  function live() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(renderInputInfo, 160);
    const v = $("input").value;
    $("inCount").textContent = n(v.length) + " karakter";
    $("createBtn").disabled = !v.trim() || !$("consentOk").checked;
  }
  function renderInputInfo() {
    const v = $("input").value;
    if (!v.trim()) { $("inInfo").textContent = ""; $("sensWarn").hidden = true; return; }
    const p = C.parseTranscript(v);
    const generic = p.speakers.filter((s) => s.generic).length;
    const guessed = p.lines.filter((l) => l.guess).length;
    $("inInfo").textContent = C.FORMAT_NAMES[p.format] + " · " + n(p.lines.length) + " satır · " + p.speakers.length + " konuşmacı" + (generic ? " (" + generic + " kimliği belirsiz)" : "") + (guessed ? " · " + guessed + " tahmini satır" : "");
    const sens = C.sensitiveSummary(v);
    $("sensWarn").hidden = !sens.length;
    if (sens.length) put($("sensWarn"), icon("lock"), el("div", {}, el("div", { class: "pl-callout__title", text: "Transkriptte kişisel/gizli bilgi var: " + sens.map((x) => x.count + " " + x.label).join(", ") }), el("span", { text: "Bu değerler yalnız bu bilgisayarda saklanır; MyMind incelemesine gönderilmez (yer tutucu gider)." })));
  }
  function setInput(text, msg, title) {
    $("input").value = text;
    if (title != null) $("mtTitle").value = title;
    if (!$("mtDate").value) $("mtDate").value = today();
    live();
    renderInputInfo();
    if (state.s && state.s.meeting) { state.s.meeting = null; D.mt.open(null).then(apply).catch(() => {}); }
    showStart(true);
    go("desk");
    $("input").focus();
    if (msg) toast(msg);
  }
  function showStart(on) { $("startPanel").hidden = !on; $("wsPanel").hidden = on; }

  // ---------------- Çalışma alanı ----------------
  function stat(value, label, ok) { return el("div", { class: "mt-stat" }, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: value }), el("span", { text: label })); }
  function renderDesk() {
    const m = mt();
    if (!m) { showStart(true); return; }
    showStart(false);
    if (document.activeElement !== $("wsTitle")) $("wsTitle").value = m.title;
    if (document.activeElement !== $("wsDate")) $("wsDate").value = m.date || "";
    $("wsFormat").textContent = C.FORMAT_NAMES[m.format] || "";
    const st = m.stats;
    put($("wsStats"),
      stat(st.duration ? C.fmtTime(st.duration) : "—", "süre"),
      stat(st.lines + " · " + st.speakers, "satır · konuşmacı"),
      stat(st.decisionsApproved + "/" + st.decisions, "karar onaylı"),
      stat(st.tasksApproved + "/" + st.tasks, "görev onaylı"),
      stat(String(st.unclear), "sorumlusu belirsiz/tahmin", st.unclear === 0));
    renderSpeakers(m);
    renderLines(m);
    renderItems(m);
  }
  function renderSpeakers(m) {
    const chips = m.speakers.map((s) => {
      const b = el("button", { type: "button", class: "mt-spk" + (s.generic ? " is-generic" : ""), title: s.generic ? "Kimliği belirsiz konuşmacı — gerçek adı vermek için tıklayın" : "Yeniden adlandır ya da başka konuşmacıyla birleştir", "data-speaker": s.name },
        icon(s.generic ? "help" : "user"), el("b", { text: s.name }), el("span", { text: "%" + s.share + " · " + s.lines + " satır" + (s.guessed ? " · " + s.guessed + " tahmin" : "") }));
      b.addEventListener("click", () => openRename(s.name));
      return b;
    });
    for (const p of m.participants) chips.push(el("span", { class: "mt-spk is-silent", title: "Konuşmayan katılımcı (görev atanabilir)" }, icon("user"), el("b", { text: p }), el("span", { text: "konuşmadı" })));
    const add = btn("+ Katılımcı", "pl-btn--ghost", async () => {
      $("speakerTitle").textContent = "Katılımcı ekle";
      $("speakerInfo").textContent = "Transkriptte konuşmayan ama görev atanabilecek bir kişi ekleyin.";
      state.renaming = { add: true };
      $("speakerName").value = "";
      fillNames();
      $("speakerDialog").showModal();
      $("speakerName").focus();
    });
    put($("speakers"), ...chips, add);
  }
  function fillNames() {
    const m = mt();
    put($("speakerNames"), ...(m ? m.speakers.map((s) => s.name).concat(m.participants) : []).map((x) => el("option", { value: x })));
  }
  function openRename(name) {
    state.renaming = { from: name };
    $("speakerTitle").textContent = "Konuşmacıyı adlandır";
    $("speakerInfo").textContent = "“" + name + "” konuşmacısının tüm satırları ve görevleri yeni ada taşınır.";
    $("speakerName").value = C.isGenericSpeaker(name) ? "" : name;
    fillNames();
    $("speakerDialog").showModal();
    $("speakerName").focus();
  }
  function lineMatches(l) {
    if (!state.lineQ) return true;
    const f = C.fold(state.lineQ);
    return C.fold((l.speaker || "") + " " + l.text).includes(f);
  }
  function renderLines(m) {
    const itemsByLine = new Map();
    for (const it of m.items) if (it.status !== "red") for (const id of it.lineIds) { const a = itemsByLine.get(id) || []; a.push(it); itemsByLine.set(id, a); }
    const key = m.id + "|" + m.updatedAt + "|" + state.lineQ + "|" + state.sel;
    if (key === state.linesKey) return;
    state.linesKey = key;
    const rows = m.lines.filter(lineMatches).map((l) => {
      const its = itemsByLine.get(l.id) || [];
      const r = el("div", { class: "mt-line" + (state.sel === l.id ? " is-sel" : "") + (its.length ? " has-item" : ""), role: "listitem", "data-line": l.id, tabindex: "0" },
        el("span", { class: "mt-time pl-num", text: l.t != null ? C.fmtTime(l.t) : l.id }),
        el("div", { class: "mt-line__body" },
          el("div", { class: "mt-line__head" },
            el("b", { class: "mt-who" + (C.isGenericSpeaker(l.speaker) ? " is-generic" : ""), text: l.speaker || "Konuşmacı yok" }),
            l.guess ? badge("tahmin", "warning", "Bu satırın konuşmacısı etiketsizdi; önceki konuşmacıya tahminle bağlandı") : null,
            C.isGenericSpeaker(l.speaker) ? badge("kimlik belirsiz", "warning") : null,
            ...its.map((it) => badge(it.kind === "karar" ? "karar" : "görev", it.kind === "karar" ? "info" : it.status === "onayli" ? "success" : "accent"))),
          el("p", { class: "mt-line__text", text: l.text })));
      r.addEventListener("click", () => { state.sel = l.id; state.linesKey = ""; renderLines(m); renderLineActions(m, l, r); });
      r.addEventListener("keydown", (e) => { if (e.key === "Enter") r.click(); });
      if (state.sel === l.id) renderLineActions(m, l, r);
      return r;
    });
    put($("lines"), ...(rows.length ? rows : [el("p", { class: "mt-empty", text: state.lineQ ? "Eşleşen satır yok." : "Satır yok." })]));
  }
  function renderLineActions(m, l, row) {
    row.querySelectorAll(".mt-line__acts").forEach((x) => x.remove());
    const acts = el("div", { class: "mt-line__acts" },
      btn("Görev olarak ekle", "pl-btn--secondary", async () => { const r = await D.item.add(m.id, "gorev", l.id); state.tab = "gorev"; apply(r.state); toast("Görev eklendi (onaylı). Sorumluyu seçin."); }),
      btn("Karar olarak ekle", "pl-btn--ghost", async () => { const r = await D.item.add(m.id, "karar", l.id); state.tab = "karar"; apply(r.state); toast("Karar eklendi (onaylı)."); }));
    row.querySelector(".mt-line__body").appendChild(acts);
  }
  function itemVisible(it) {
    if (it.kind !== state.tab) return false;
    if (state.filter === "taslak") return it.status === "taslak";
    if (state.filter === "onayli") return it.status === "onayli";
    if (state.filter === "belirsiz") return it.kind === "gorev" && it.status !== "red" && it.assigneeState !== "acik";
    return true;
  }
  function renderItems(m) {
    const tasks = m.items.filter((x) => x.kind === "gorev"), dec = m.items.filter((x) => x.kind === "karar");
    $("tabTasks").textContent = String(tasks.filter((x) => x.status !== "red").length);
    $("tabDecisions").textContent = String(dec.filter((x) => x.status !== "red").length);
    document.querySelectorAll("[data-tab]").forEach((b) => { const on = b.dataset.tab === state.tab; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    document.querySelectorAll("[data-filter]").forEach((b) => { const on = b.dataset.filter === state.filter; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    document.querySelector('[data-filter="belirsiz"]').hidden = state.tab !== "gorev";
    const pendingClear = state.tab === "gorev" ? tasks.filter((x) => x.status === "taslak" && x.assigneeState === "acik").length : dec.filter((x) => x.status === "taslak").length;
    $("approveAllBtn").textContent = state.tab === "gorev" ? "Sorumlusu açık olanları onayla (" + pendingClear + ")" : "Tüm kararları onayla (" + pendingClear + ")";
    $("approveAllBtn").disabled = !pendingClear;
    const list = m.items.filter(itemVisible).sort((a, b) => (a.status === "red") - (b.status === "red") || (a.t ?? 1e9) - (b.t ?? 1e9));
    const focused = document.activeElement && document.activeElement.closest && document.activeElement.closest(".mt-item");
    const focusId = focused && focused.dataset.id;
    put($("items"), ...(list.length ? list.map((it) => itemCard(m, it)) : [el("p", { class: "mt-empty", text: state.tab === "gorev" ? "Bu süzgeçte görev yok." : "Bu süzgeçte karar yok." })]));
    if (focusId) { const c = $("items").querySelector('[data-id="' + focusId + '"] .mt-item__text'); if (c && document.activeElement === document.body) c.focus(); }
  }
  function people(m) { return m.speakers.map((s) => s.name).concat(m.participants); }
  function itemCard(m, it) {
    const card = el("div", { class: "mt-item is-" + it.status + (it.kind === "gorev" ? " is-owner-" + it.assigneeState : ""), role: "listitem", "data-id": it.id });
    const head = el("div", { class: "mt-item__head" },
      badge(C.ITEM_STATUS_NAMES[it.status], it.status === "onayli" ? "success" : it.status === "red" ? "danger" : ""),
      badge(C.SOURCE_NAMES[it.source], it.source === "mymind" ? "pro" : ""),
      it.edited ? badge("düzenlendi", "info") : null,
      el("span", { class: "mt-grow" }),
      it.lineIds.length ? el("button", { type: "button", class: "mt-ref", title: "Transkriptteki satıra git", "data-goto": it.lineIds[0] }, icon("pin"), (it.t != null ? C.fmtTime(it.t) + " · " : "") + it.lineIds.join(", ")) : null);
    const text = el("textarea", { class: "pl-input mt-item__text", rows: "2", maxlength: "600", "aria-label": it.kind === "karar" ? "Karar metni" : "Görev metni", value: it.text });
    text.addEventListener("change", guard(async () => { if (text.value.trim() !== it.text) { apply(await D.item.update(m.id, it.id, { text: text.value })); toast("Metin güncellendi."); } }));
    card.append(head, text);
    if (it.kind === "gorev") {
      const sel = el("select", { class: "pl-input mt-owner", "aria-label": "Sorumlu" }, el("option", { value: "", text: "— Belirsiz —" }), ...people(m).map((p) => el("option", { value: p, text: p })));
      if (it.assignee && !people(m).includes(it.assignee)) sel.appendChild(el("option", { value: it.assignee, text: it.assignee }));
      sel.value = it.assignee || "";
      sel.addEventListener("change", guard(async () => { apply(await D.item.update(m.id, it.id, { assignee: sel.value })); toast(sel.value ? "Sorumlu: " + sel.value + "." : "Sorumlu belirsiz bırakıldı."); }));
      const due = el("input", { class: "pl-input mt-due", type: "date", "aria-label": "Son tarih", value: it.due || "" });
      due.addEventListener("change", guard(async () => apply(await D.item.update(m.id, it.id, { due: due.value }))));
      card.appendChild(el("div", { class: "mt-item__row" },
        el("span", { class: "mt-lbl", text: "Sorumlu" }), sel, badge(C.ASSIGNEE_NAMES[it.assigneeState], OWNER_TONE[it.assigneeState], it.assigneeReason),
        el("span", { class: "mt-lbl", text: "Son tarih" }), due, it.dueText && it.dueText !== "elle" ? el("span", { class: "pl-muted mt-small", text: "“" + it.dueText + "”" }) : null));
      if (it.assigneeState !== "acik") card.appendChild(el("div", { class: "mt-why" }, icon(it.assigneeState === "tahmin" ? "help" : "alert"), el("span", { text: (it.assigneeState === "tahmin" ? "Tahmin: " : "Belirsiz: ") + (it.assigneeReason || "Sorumlu metinden çıkmıyor") })));
    }
    card.appendChild(el("div", { class: "mt-item__acts" },
      btn(it.status === "onayli" ? "Onayı geri al" : "Onayla", it.status === "onayli" ? "pl-btn--ghost" : "pl-btn--primary", async () => apply(await D.item.status(m.id, it.id, "onayli")), { "data-act-item": "approve" }),
      btn(it.status === "red" ? "Reddi geri al" : "Reddet", "pl-btn--ghost", async () => apply(await D.item.status(m.id, it.id, "red")), { "data-act-item": "reject" }),
      el("span", { class: "mt-grow" }),
      it.source !== "elle" ? el("span", { class: "pl-muted mt-small", text: "güven " + String(Math.round(it.confidence * 100)) + "%" }) : null));
    return card;
  }

  // ---------------- Toplantılar ve arama ----------------
  function renderList() {
    const s = state.s;
    const list = s.meetings.filter((m) => state.showArchived || !m.archived);
    put($("mtList"), ...(list.length ? list.map((m) => {
      const st = m.stats;
      const row = el("li", { class: "mt-mrow" + (m.archived ? " is-archived" : "") },
        el("div", { class: "mt-mrow__head" },
          el("b", { text: m.title }), m.sample ? badge("örnek", "info") : null, m.archived ? badge("arşivde") : null,
          el("span", { class: "pl-muted mt-small", text: (m.date ? C.trDate(m.date) + " · " : "") + st.lines + " satır · " + m.speakers.length + " konuşmacı" }),
          el("span", { class: "mt-grow" }),
          badge(st.decisionsApproved + " karar", "info"), badge(st.tasksApproved + " görev", "success"), st.pending ? badge(st.pending + " bekleyen", "warning") : null,
          btn("Aç", "pl-btn--secondary", async () => { apply(await D.mt.open(m.id)); go("desk"); }),
          m.archived ? btn("Geri al", "pl-btn--ghost", async () => apply(await D.mt.restore(m.id))) : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.mt.archive(m.id)); toast("Toplantı arşivlendi (silinmedi)."); })),
        el("p", { class: "mt-mrow__prev", text: (m.consent && m.consent.informed ? "İzin: " + (m.consent.method || "bilgilendirildi") : "İzin kaydı yok") + " · " + m.speakers.join(", ") }));
      return row;
    }) : [el("li", { class: "mt-empty", text: "Henüz toplantı yok. Toplantı sekmesinden transkript yükleyin ya da örnek toplantıyı açın." })]));
  }
  let searchTimer = null;
  async function runSearch() {
    const q = $("searchQ").value.trim();
    if (q.length < 2) { put($("results")); return; }
    const res = await D.mt.search(q);
    const name = { karar: "Karar", gorev: "Görev", satir: "Satır" };
    put($("results"), ...(res.length ? res.map((r) => {
      const li = el("li", { class: "mt-res" },
        badge(name[r.type], r.type === "karar" ? "info" : r.type === "gorev" ? "success" : ""),
        el("div", { class: "mt-res__body" },
          el("p", { class: "mt-res__text", text: r.text }),
          el("span", { class: "pl-muted mt-small", text: r.meeting + (r.date ? " · " + C.trDate(r.date) : "") + (r.t != null ? " · " + C.fmtTime(r.t) : "") + (r.assignee ? " · sorumlu: " + r.assignee : r.speaker ? " · " + r.speaker : "") + (r.status === "taslak" ? " · taslak" : "") })),
        btn("Göster", "pl-btn--ghost", async () => { apply(await D.mt.open(r.meetingId)); go("desk"); if (r.type === "karar" || r.type === "gorev") { state.tab = r.type; state.filter = "all"; } focusLine(r.lineId); }));
      return li;
    }) : [el("li", { class: "mt-empty", text: "“" + q + "” için sonuç yok." })]));
  }
  function focusLine(id) {
    if (!id) return;
    state.sel = id;
    state.lineQ = "";
    $("lineFilter").value = "";
    state.linesKey = "";
    renderDesk();
    const r = $("lines").querySelector('[data-line="' + id + '"]');
    if (r) { r.scrollIntoView({ block: "center" }); r.focus({ preventScroll: true }); }
  }

  // ---------------- Görevler ----------------
  function renderTasks() {
    const s = state.s;
    const owners = [...new Set(s.tasks.map((t) => t.assignee || ""))].sort((a, b) => a.localeCompare(b, "tr"));
    const sel = $("ownerFilter");
    const cur = state.owner;
    put(sel, el("option", { value: "*", text: "Tüm sorumlular" }), ...owners.map((o) => el("option", { value: o, text: o || "Belirsiz sorumlu" })));
    sel.value = owners.includes(cur) ? cur : "*";
    const list = s.tasks.filter((t) => (sel.value === "*" || (t.assignee || "") === sel.value) && (!state.hideDone || !t.done));
    const head = el("div", { class: "mt-trow mt-trow--head", role: "row" }, ...["", "Görev", "Sorumlu", "Son tarih", "Toplantı"].map((h) => el("span", { role: "columnheader", text: h })));
    const todayIso = today();
    put($("taskTable"), head, ...(list.length ? list.map((t) => {
      const cb = el("input", { type: "checkbox", "aria-label": "Tamamlandı" });
      cb.checked = t.done;
      cb.addEventListener("change", guard(async () => { apply(await D.item.done(t.meetingId, t.id, cb.checked)); toast(cb.checked ? "Görev tamamlandı." : "Görev yeniden açıldı."); }));
      const late = t.due && !t.done && t.due < todayIso;
      return el("div", { class: "mt-trow" + (t.done ? " is-done" : ""), role: "row" },
        el("span", { role: "cell" }, cb),
        el("span", { role: "cell", class: "mt-trow__text", text: t.text }),
        el("span", { role: "cell" }, t.assignee ? el("span", { text: t.assignee + " " }) : null, badge(C.ASSIGNEE_NAMES[t.assigneeState], OWNER_TONE[t.assigneeState], t.assigneeReason)),
        el("span", { role: "cell", class: late ? "is-late" : "", text: t.due ? C.trDate(t.due) + (late ? " (gecikti)" : "") : "—" }),
        el("span", { role: "cell", class: "pl-muted mt-small", text: t.meeting + (t.t != null ? " · " + C.fmtTime(t.t) : "") }));
    }) : [el("p", { class: "mt-empty", text: s.tasks.length ? "Bu süzgeçte görev yok." : "Henüz onaylı görev yok. Toplantıdaki taslakları onaylayın." })]));
  }

  // ---------------- Ölçüler ve ayarlar ----------------
  function tile(value, label, ok) { return el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: value }), el("span", { text: label })); }
  function renderSettings() {
    const s = state.s, st = s.stats, m = st.metrics;
    put($("metrics"),
      tile(pctText(st.review.precision), "görev kesinliği — onay/red (" + st.review.approved + "/" + (st.review.approved + st.review.rejected) + "), hedef ≥ %90", st.review.precision == null ? null : st.review.precision >= 90),
      tile(st.gold.length ? pctText(st.gold[0].precision) : "—", "görev kesinliği — etiketli örnek (kural)", st.gold.length ? st.gold[0].precision >= 90 : null),
      tile(st.gold.length ? pctText(st.gold[0].recall) : "—", "duyarlılık — etiketli örnek (" + (st.gold.length ? st.gold[0].tp + " doğru · " + st.gold[0].fp + " yanlış · " + st.gold[0].fn + " kaçan" : "örnek yok") + ")", null),
      tile(String(st.unclear), "onaylı görevde sorumlu belirsiz/tahmin (görünür)", null),
      tile(n(st.tasks) + " · " + n(st.decisions), "onaylı görev · karar (" + st.meetings + " toplantı)", null),
      tile(String(st.review.pending), "bekleyen görev taslağı", null),
      tile(String(m.aiRuns) + " · " + m.aiItems, "MyMind isteği · eklenen taslak (" + m.aiDropped + " doğrulamadan geçmedi)", null),
      tile(String(m.edits) + " · " + m.manual, "düzeltme · elle eklenen", null),
      tile(String(m.exports) + " · " + m.copies, "dışa aktarma · kopyalama", null));
    put($("goldList"), ...st.gold.map((g) => el("p", { class: "pl-muted mt-small", text: "Etiketli: “" + g.title + "” — kesinlik " + pctText(g.precision) + ", duyarlılık " + pctText(g.recall) + " (kural tabanlı taslaklar, elle etiketlenmiş " + (g.tp + g.fn) + " görev satırına karşı)." })));
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("setStrict").checked = s.settings.minConfidence >= 0.75;
    $("vaultInfo").textContent = s.vault ? "Toplantılar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: toplantılar düz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => { apply(await D.setSettings({ provider: r.value })); toast(r.value === "yerel" ? "Yapay zekâ motoru: yerel model." : "Yapay zekâ motoru: MyMind (Hub)."); })));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("setStrict").addEventListener("change", guard(async () => apply(await D.setSettings({ minConfidence: $("setStrict").checked ? 0.75 : 0.5 }))));

  // ---------------- Olaylar ----------------
  function clipResult(r) {
    if (r.blocked) return toast("Panodaki metin bir parola ya da anahtar gibi görünüyor; güvenlik için alınmadı.", true);
    if (r.empty) return toast("Panoda metin yok.", true);
    setInput(r.text, "Panodan alındı" + (r.truncated ? " (ilk 200.000 karakter)" : "") + ". Bilgilendirmeyi işaretleyip “Transkripti çözümle”ye basın.");
  }
  document.addEventListener("click", guard(async (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { focusLine(g.dataset.goto); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "clip") clipResult(await D.readClipboard());
    if (act === "sample") { const r = await D.sample(); state.tab = "gorev"; state.filter = "all"; apply(r.state); go("desk"); const st = mt().stats; toast("Örnek toplantı: " + st.lines + " satır, " + st.decisions + " karar ve " + st.tasks + " görev taslağı. Onaylayın ya da reddedin."); }
    if (act === "openFile") { const r = await D.openFile(); if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı (" + C.FORMAT_NAMES[r.format] + ")" + (r.truncated ? " — ilk 200.000 karakter" : "") + ".", r.name.replace(/\.[^.]+$/, "")); }
  }));
  $("input").addEventListener("input", live);
  $("consentOk").addEventListener("change", live);
  $("noticeBtn").addEventListener("click", guard(async () => { await D.copyNotice($("mtTitle").value.trim(), $("mtDate").value); toast("Bilgilendirme metni panoya kopyalandı; toplantı sohbetine ya da davetiyeye yapıştırabilirsiniz."); }));
  $("createBtn").addEventListener("click", guard(async () => {
    const text = $("input").value;
    if (!text.trim()) return toast("Önce bir transkript yapıştırın ya da dosya açın.", true);
    if (!$("consentOk").checked) return toast("Katılımcıların bilgilendirildiğini onaylayın.", true);
    const r = await D.mt.create(text, { title: $("mtTitle").value, date: $("mtDate").value, participants: $("mtPeople").value, consent: { informed: true, method: $("consentMethod").value } });
    state.tab = "gorev"; state.filter = "all"; state.sel = null;
    apply(r.state);
    const st = mt().stats;
    $("input").value = ""; $("mtTitle").value = ""; $("mtPeople").value = ""; $("consentOk").checked = false; live();
    toast(st.lines + " satır, " + st.speakers + " konuşmacı · " + st.decisions + " karar ve " + st.tasks + " görev taslağı" + (st.unclear ? " (" + st.unclear + " sorumlusu belirsiz/tahmin)" : "") + (r.truncated ? " · satır sınırı nedeniyle kısaltıldı" : "") + ".");
  }));
  $("wsTitle").addEventListener("change", guard(async () => apply(await D.mt.update(mt().id, { title: $("wsTitle").value }))));
  $("wsDate").addEventListener("change", guard(async () => apply(await D.mt.update(mt().id, { date: $("wsDate").value }))));
  $("aiBtn").addEventListener("click", guard(async () => {
    busy("MyMind inceliyor…");
    const r = await D.ai.extract(mt().id);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    apply(r.state);
    toast((r.added ? r.added + " yeni taslak eklendi" : "Yeni taslak yok (kural tabanlı taslaklarla aynı)") + (r.dropped ? "; " + r.dropped + " öğe doğrulamadan geçmedi (bilinmeyen satır/kişi)" : "") + (r.errors.length ? "; " + r.errors.length + " istek başarısız" : "") + ".");
  }));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.mt.exportAs(mt().id, $("exportFmt").value); if (!r.cancelled) toast("“" + r.file + "” kaydedildi (" + n(r.bytes) + " bayt). Yalnız onaylı öğeler yazıldı."); }));
  $("copyBtn").addEventListener("click", guard(async () => { const r = await D.mt.copy(mt().id); toast("Toplantı notu panoya kopyalandı (" + n(r.copied) + " karakter)."); }));
  $("newBtn").addEventListener("click", () => setInput("", null, ""));
  $("approveAllBtn").addEventListener("click", guard(async () => { const r = await D.item.approveAll(mt().id, state.tab); apply(r.state); toast(r.approved + (state.tab === "gorev" ? " görev onaylandı. Sorumlusu belirsiz olanları tek tek gözden geçirin." : " karar onaylandı.")); }));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; if (state.tab === "karar" && state.filter === "belirsiz") state.filter = "all"; renderDesk(); }));
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.filter; renderDesk(); }));
  $("lineFilter").addEventListener("input", () => { state.lineQ = $("lineFilter").value.trim(); renderDesk(); });
  $("searchQ").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(guard(runSearch), 180); });
  $("showArchived").addEventListener("change", () => { state.showArchived = $("showArchived").checked; renderList(); });
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.mt.backup(); if (!r.cancelled) toast("Yedek “" + r.file + "” dosyasına yazıldı."); }));
  $("ownerFilter").addEventListener("change", () => { state.owner = $("ownerFilter").value; renderTasks(); });
  $("hideDone").addEventListener("change", () => { state.hideDone = $("hideDone").checked; renderTasks(); });

  // Konuşmacı adlandırma / katılımcı ekleme
  $("speakerCancel").addEventListener("click", () => $("speakerDialog").close());
  $("speakerSave").addEventListener("click", guard(async () => {
    const name = $("speakerName").value.trim();
    const m = mt();
    if (state.renaming && state.renaming.add) {
      if (name.length < 2) return toast("Ad en az 2 karakter olmalı.", true);
      apply(await D.mt.participants(m.id, m.participants.concat([name])));
      $("speakerDialog").close();
      return toast("“" + name + "” katılımcı olarak eklendi; görevlerde sorumlu seçilebilir.");
    }
    const r = await D.mt.renameSpeaker(m.id, state.renaming.from, name);
    $("speakerDialog").close();
    state.linesKey = "";
    apply(r.state);
    toast("“" + state.renaming.from + "” → “" + name + "” (" + r.lines + " satır).");
  }));
  $("speakerName").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("speakerSave").click(); } });

  // ---------------- MyMind ----------------
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı. Değiştirmek için yenisini yapıştırın." : "Anahtar henüz girilmedi. Hub kullanmak istemezseniz Ölçüler ve ayarlar → Yapay zekâ motoru'ndan yerel modeli seçebilirsiniz.";
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
    if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); D.openFile().then((r) => { if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı.", r.name.replace(/\.[^.]+$/, "")); }).catch((x) => toast(clean(x), true)); }
    if (e.ctrlKey && e.key === "Enter" && state.view === "desk" && !$("startPanel").hidden) { e.preventDefault(); $("createBtn").click(); }
    if (e.ctrlKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); go("list"); $("searchQ").focus(); }
  });
  D.onState((s) => { state.s = s; render(); });
  D.state().then((s) => {
    state.s = s;
    $("mtDate").value = today();
    render();
    go("desk");
    live();
    document.documentElement.dataset.ready = "1";
  });
})();
