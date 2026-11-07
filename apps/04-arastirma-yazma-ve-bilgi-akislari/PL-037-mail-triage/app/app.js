/* Mail Triage — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; ileti HTML'i ana süreçte düz metne
 * çevrilmiştir). Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez. Seçim (toplu değişiklik için) yalnız arayüz durumundadır. */
(function () {
  const D = window.mlDesktop;
  const C = window.MLCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["inbox", "bulk", "settings"];
  const state = { s: null, view: "inbox", prio: "all", label: "", onlyNew: false, q: "", sel: new Set(), preview: null, showFull: false };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    clip: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
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
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const PRIO_TONE = { yuksek: "danger", normal: "", dusuk: "info" };
  const LABEL_TONE = { yanit: "accent", fatura: "warning", toplanti: "info", kargo: "", guvenlik: "danger", bulten: "", bildirim: "" };
  const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const mail = () => state.s && state.s.mail;
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "inbox";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    if (state.view === "bulk") renderBulk();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const live = s.mails.filter((m) => !m.archived);
    for (const id of [...state.sel]) if (!live.some((m) => m.id === id)) state.sel.delete(id);
    $("inboxCount").textContent = String(live.filter((m) => !m.reviewed).length);
    $("selCount").textContent = String(state.sel.size);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const mt = s.metrics;
    put($("sideInfo"), el("div", { class: "ml-mini__in" },
      el("span", { class: "pl-muted ml-small", text: "Etiket kabulü" }),
      el("b", { class: mt.labelAcceptance == null ? "" : mt.labelAcceptance >= 85 ? "is-ok" : "is-bad", text: pctText(mt.labelAcceptance) }),
      el("span", { class: "pl-muted ml-small", text: "Yanlış düşük öncelik: " + pctText(mt.wrongLowRate) + (mt.important ? " (" + mt.wrongLow + "/" + mt.important + ")" : "") }),
      el("span", { class: "pl-muted ml-small", text: mt.byPriority.yuksek + " yüksek · " + mt.byPriority.normal + " normal · " + mt.byPriority.dusuk + " düşük" })));
    renderInbox();
    renderSettings();
    if (state.view === "bulk") renderBulk();
  }

  // ---------------- Gelen kutusu ----------------
  function visible(m) {
    if (m.archived) return false;
    if (state.prio !== "all" && m.final.priority !== state.prio) return false;
    if (state.label && !m.final.labels.includes(state.label)) return false;
    if (state.onlyNew && m.reviewed) return false;
    if (state.q) { const f = C.fold(state.q); if (!C.fold(m.from.name + " " + m.from.addr + " " + m.subject + " " + m.preview).includes(f)) return false; }
    return true;
  }
  const RANK = { yuksek: 0, normal: 1, dusuk: 2 };
  function renderInbox() {
    const s = state.s;
    const any = s.mails.some((m) => !m.archived);
    $("emptyPanel").hidden = any;
    $("splitPanel").hidden = !any;
    document.querySelectorAll("[data-prio]").forEach((b) => { const on = b.dataset.prio === state.prio; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    const lf = $("labelFilter");
    if (!lf.options.length) put(lf, el("option", { value: "", text: "Tüm etiketler" }), ...C.LABELS.map((l) => el("option", { value: l, text: C.LABEL_NAMES[l] })));
    lf.value = state.label;
    const list = s.mails.filter(visible).sort((a, b) => RANK[a.final.priority] - RANK[b.final.priority] || String(b.date).localeCompare(String(a.date)));
    $("listInfo").textContent = list.length + " ileti" + (state.sel.size ? " · " + state.sel.size + " seçili" : "");
    $("selAll").checked = list.length > 0 && list.every((m) => state.sel.has(m.id));
    $("acceptSelBtn").disabled = !state.sel.size;
    const active = mail();
    put($("list"), ...(list.length ? list.map((m) => {
      const cb = el("input", { type: "checkbox", "aria-label": "Seç: " + m.subject });
      cb.checked = state.sel.has(m.id);
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => { if (cb.checked) state.sel.add(m.id); else state.sel.delete(m.id); render(); });
      const changedSug = m.reviewed && (m.final.priority !== m.suggested.priority || m.final.labels.join() !== m.suggested.labels.join());
      const li = el("li", { class: "ml-row-item is-" + m.final.priority + (active && active.id === m.id ? " is-sel" : "") + (m.reviewed ? " is-reviewed" : ""), role: "option", tabindex: "0", "data-id": m.id, "aria-selected": active && active.id === m.id ? "true" : "false" },
        cb,
        el("span", { class: "ml-dot is-" + m.final.priority, title: C.PRIORITY_NAMES[m.final.priority] + " öncelik" }),
        el("div", { class: "ml-row-item__body" },
          el("div", { class: "ml-row-item__head" }, el("b", { class: "ml-from", text: m.from.name || m.from.addr }), el("span", { class: "ml-grow" }), m.attachments ? icon("clip") : null, el("span", { class: "pl-muted ml-small", text: fmtDate(m.date) })),
          el("div", { class: "ml-subj", text: m.subject }),
          el("div", { class: "ml-tags" }, badge(C.PRIORITY_NAMES[m.final.priority], PRIO_TONE[m.final.priority]), ...m.final.labels.map((l) => badge(C.LABEL_NAMES[l], LABEL_TONE[l])),
            m.final.important ? badge("önemli", "danger") : null, m.reviewed ? badge(changedSug ? "düzeltildi" : "kabul", changedSug ? "warning" : "success") : null, m.hasAi ? badge("MyMind", "pro") : null)));
      li.addEventListener("click", guard(async () => apply(await D.mail.open(m.id))));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter") li.click(); });
      return li;
    }) : [el("li", { class: "ml-empty", text: "Bu süzgeçte ileti yok." })]));
    renderDetail();
  }
  function reasonList(m) {
    const out = [];
    for (const l of m.suggestion.labels) out.push(el("li", {}, el("b", { text: C.LABEL_NAMES[l] + ": " }), (m.suggestion.reasons[l] || []).join("; ")));
    return out;
  }
  function renderDetail() {
    const m = mail();
    if (!m || m.archived) { put($("detail"), el("p", { class: "ml-empty", text: "Soldan bir ileti seçin." })); return; }
    const f = m.final, sug = m.suggestion;
    const labelChips = C.LABELS.map((l) => {
      const on = f.labels.includes(l), suggested = sug.labels.includes(l);
      const b = el("button", { type: "button", class: "ml-chip" + (on ? " is-on" : "") + (suggested ? " is-sug" : ""), "aria-pressed": on ? "true" : "false", "data-label": l, title: suggested ? "Önerilen: " + (sug.reasons[l] || []).join("; ") : "Önerilmedi" }, C.LABEL_NAMES[l]);
      b.addEventListener("click", guard(async () => { const next = on ? f.labels.filter((x) => x !== l) : f.labels.concat([l]); apply(await D.mail.decide(m.id, { labels: next })); }));
      return b;
    });
    const prioSeg = el("div", { class: "pl-segment", role: "radiogroup", "aria-label": "Öncelik" }, ...C.PRIORITIES.map((p) => {
      const b = el("button", { type: "button", role: "radio", class: f.priority === p ? "is-active" : "", "aria-checked": f.priority === p ? "true" : "false", "data-setprio": p }, C.PRIORITY_NAMES[p] + (sug.priority === p ? " ·öneri" : ""));
      b.addEventListener("click", guard(async () => apply(await D.mail.decide(m.id, { priority: p }))));
      return b;
    }));
    const imp = el("label", { class: "ml-check ml-check--inline" }, el("input", { type: "checkbox", id: "impBox" }), el("span", { text: "Önemli" }));
    imp.querySelector("input").checked = f.important;
    imp.querySelector("input").addEventListener("change", guard(async (e) => apply(await D.mail.decide(m.id, { important: e.target.checked }))));
    const to = m.to.map((x) => x.name || x.addr).join(", ") + (m.cc.length ? " · cc: " + m.cc.map((x) => x.name || x.addr).join(", ") : "");
    const body = state.showFull ? m.body : C.stripQuoted(m.body);
    const draft = el("textarea", { class: "pl-input ml-area ml-draft", id: "draftText", rows: "7", maxlength: "4000", "aria-label": "Yanıt taslağı", value: m.draft || "", placeholder: "Yanıt taslağı burada görünür. Gönderilmez; kopyalayıp kendi posta uygulamanızda kullanın." });
    draft.addEventListener("change", guard(async () => { await D.draft.set(m.id, draft.value); }));
    const ai = m.ai;
    put($("detail"),
      el("div", { class: "ml-dhead" },
        el("h2", { class: "pl-h3 ml-h ml-dsubj", text: m.subject }),
        el("div", { class: "ml-dmeta pl-muted ml-small" }, el("b", { class: "ml-from", text: (m.from.name ? m.from.name + " " : "") + "<" + m.from.addr + ">" }), " → " + (to || "—") + " · " + fmtDate(m.date)),
        m.attachments.length ? el("div", { class: "ml-atts" }, icon("clip"), ...m.attachments.map((a) => badge(a.name + " · " + Math.max(1, Math.round(a.size / 1024)) + " KB", "", a.type + " — açılmaz, kaydedilmez"))) : null),
      el("div", { class: "ml-sug" },
        el("div", { class: "ml-bar" }, el("span", { class: "ml-lbl", text: "Öncelik" }), prioSeg, imp, el("span", { class: "ml-grow" }),
          m.reviewed ? badge(f.priority === sug.priority && f.labels.join() === sug.labels.join() ? "öneri kabul edildi" : "düzeltildi", f.priority === sug.priority && f.labels.join() === sug.labels.join() ? "success" : "warning") : btn("Öneriyi kabul et", "pl-btn--primary", async () => { const r = await D.mail.accept([m.id]); apply(r.state); toast("Öneri kabul edildi."); }, { id: "acceptBtn" }),
          m.reviewed ? btn("Öneriye dön", "pl-btn--ghost", async () => apply(await D.mail.reset(m.id))) : null),
        el("ul", { class: "ml-why" }, ...sug.priorityReasons.map((r) => el("li", { class: "is-" + sug.priority }, icon(sug.priority === "dusuk" ? "check" : sug.signals.includes("guvenlik") ? "shield" : "alert"), el("span", { text: r })))),
        el("div", { class: "ml-bar" }, el("span", { class: "ml-lbl", text: "Etiketler" }), el("div", { class: "ml-chips" }, ...labelChips)),
        sug.labels.length ? el("ul", { class: "ml-reasons pl-muted ml-small" }, ...reasonList(m)) : el("p", { class: "pl-muted ml-small", text: "Etiket önerilmedi (belirgin bir kalıp yok)." })),
      (sug.actions.length || sug.due || sug.amounts.length || sug.questions.length) ? el("div", { class: "ml-extract" },
        el("span", { class: "ml-lbl", text: "Çıkarılanlar" }),
        sug.due ? el("div", {}, badge("son tarih " + C.trDate(sug.due), "warning"), el("span", { class: "pl-muted ml-small", text: " “" + sug.dueText + "”" })) : null,
        sug.amounts.length ? el("div", {}, ...sug.amounts.map((a) => badge(a, "info"))) : null,
        ...sug.actions.map((a) => el("div", { class: "ml-action" }, "☐ ", a)),
        ...sug.questions.filter((q) => !sug.actions.includes(q)).map((q) => el("div", { class: "ml-action" }, "? ", q))) : null,
      ai ? el("div", { class: "ml-ai" },
        el("div", { class: "ml-bar" }, icon("spark"), el("b", { text: "MyMind önerisi" }), badge(C.PRIORITY_NAMES[ai.priority], PRIO_TONE[ai.priority]), ...ai.labels.map((l) => badge(C.LABEL_NAMES[l], LABEL_TONE[l])), el("span", { class: "ml-grow" }),
          btn("MyMind önerisini uygula", "pl-btn--secondary", async () => { apply(await D.ai.apply(m.id)); toast("MyMind önerisi uygulandı."); })),
        ai.reason ? el("p", { class: "ml-small", text: ai.reason }) : null,
        ...ai.actions.map((a) => el("div", { class: "ml-action" }, "☐ ", a))) : null,
      el("div", { class: "ml-bodywrap" },
        el("div", { class: "ml-bar" }, el("span", { class: "ml-lbl", text: "İleti" }), el("span", { class: "ml-grow" }),
          btn(state.showFull ? "Yalnız yeni yazılanı göster" : "Alıntılar ve imzayla göster", "pl-btn--ghost", async () => { state.showFull = !state.showFull; renderDetail(); })),
        el("pre", { class: "ml-body", text: body || "(gövde yok)" })),
      el("div", { class: "ml-draftwrap" },
        el("div", { class: "ml-bar" }, el("span", { class: "ml-lbl", text: "Yanıt taslağı" }), m.draftSource ? badge(m.draftSource === "mymind" ? "MyMind" : m.draftSource === "elle" ? "düzenlendi" : "şablon", m.draftSource === "mymind" ? "pro" : "") : null, el("span", { class: "ml-grow" }),
          btn("Taslak oluştur", "pl-btn--secondary", async () => { apply(await D.draft.make(m.id)); toast("Taslak hazırlandı; düzenleyip kopyalayın. Gönderilmez."); }, { id: "draftBtn" }),
          btn("MyMind ile öner", "pl-btn--ghost", async () => {
            busy("MyMind inceliyor…");
            const r = await D.ai.suggest(m.id);
            busy(null);
            if (!r.approved) return toast("Gönderilmedi.");
            apply(r.state);
            toast("MyMind önerisi hazır" + (r.clamped ? " (önem işareti olduğu için Düşük önerisi Normal'e yükseltildi)" : "") + (r.unknown ? "; " + r.unknown + " bilinmeyen etiket yok sayıldı" : "") + ".");
          }, { id: "aiBtn" }),
          btn("Kopyala", "pl-btn--ghost", async () => { if (draft.value !== (m.draft || "")) await D.draft.set(m.id, draft.value); const r = await D.draft.copy(m.id); toast("Taslak panoya kopyalandı (" + r.copied + " karakter). Posta uygulamanızda yapıştırın."); }, { id: "copyDraftBtn" })),
        draft),
      el("div", { class: "ml-row" }, el("span", { class: "ml-grow" }), btn("Arşivle (gelen kutusundan kaldır)", "pl-btn--ghost", async () => { apply(await D.mail.archive([m.id], true)); toast("İleti arşivlendi (silinmedi; kaynak dosya değişmedi)."); })));
  }

  // ---------------- Toplu değişiklik ----------------
  function renderBulk() {
    const n = state.sel.size;
    $("bulkInfo").textContent = n ? n + " ileti seçili" : "Önce gelen kutusunda ileti seçin.";
    for (const [id, first] of [["bulkAdd", "— ekleme —"], ["bulkRemove", "— kaldırma —"]]) {
      const s = $(id);
      if (!s.options.length) put(s, el("option", { value: "", text: first }), ...C.LABELS.map((l) => el("option", { value: l, text: C.LABEL_NAMES[l] })));
    }
    const p = state.preview;
    $("bulkApplyBtn").disabled = !p || !p.changed;
    $("bulkWarn").hidden = !(p && p.warnings);
    if (p && p.warnings) put($("bulkWarn"), icon("alert"), el("div", {}, el("div", { class: "pl-callout__title", text: p.warnings + " önemli işaretli ileti Düşük önceliğe alınıyor" }), el("span", { text: "Satırlardaki uyarıları kontrol edin; bu iletileri seçimden çıkarmak isteyebilirsiniz." })));
    if (!p) { put($("bulkTable")); return; }
    const row = (cells, cls) => el("div", { class: "ml-prow " + (cls || ""), role: "row" }, ...cells.map((c) => (typeof c === "string" ? el("span", { role: "cell", text: c }) : el("span", { role: "cell" }, c))));
    const tags = (x) => el("span", { class: "ml-tags" }, badge(C.PRIORITY_NAMES[x.priority], PRIO_TONE[x.priority]), ...x.labels.map((l) => badge(C.LABEL_NAMES[l], LABEL_TONE[l])));
    put($("bulkTable"), row(["İleti", "Önce", "Sonra", ""], "ml-prow--head"), ...p.rows.map((r) => row([el("span", {}, el("b", { text: r.subject }), el("br"), el("span", { class: "pl-muted ml-small", text: r.from })), tags(r.before), tags(r.after), r.warn ? badge("uyarı", "danger", r.warn) : r.changed ? badge("değişecek", "accent") : badge("aynı")], r.warn ? "is-warn" : r.changed ? "" : "is-same")));
  }
  const bulkChange = () => ({ addLabel: $("bulkAdd").value, removeLabel: $("bulkRemove").value, priority: $("bulkPrio").value });
  $("bulkPreviewBtn").addEventListener("click", guard(async () => {
    if (!state.sel.size) return toast("Önce gelen kutusunda ileti seçin.", true);
    state.preview = await D.bulk.preview([...state.sel], bulkChange());
    renderBulk();
    toast(state.preview.changed + " ileti değişecek" + (state.preview.warnings ? " · " + state.preview.warnings + " uyarı" : "") + ". Uygulamadan önce kontrol edin.");
  }));
  ["bulkAdd", "bulkRemove", "bulkPrio"].forEach((id) => $(id).addEventListener("change", () => { state.preview = null; renderBulk(); }));
  $("bulkApplyBtn").addEventListener("click", guard(async () => {
    const r = await D.bulk.apply([...state.sel], bulkChange());
    state.preview = null;
    state.sel.clear();
    apply(r.state);
    toast(r.changed + " ileti güncellendi (yalnız bu uygulamada; posta kutusu değişmedi).");
    go("inbox");
  }));
  $("bulkBack").addEventListener("click", () => go("inbox"));

  // ---------------- Ölçüler ve ayarlar ----------------
  function tile(value, label, ok) { return el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: value }), el("span", { text: label })); }
  function renderSettings() {
    const s = state.s, mt = s.metrics, c = s.counters;
    put($("metrics"),
      tile(pctText(mt.labelAcceptance), "etiket kabulü (" + mt.labelKept + "/" + mt.labelSuggested + " korundu, " + mt.labelAdded + " eklendi) — hedef ≥ %85", mt.labelAcceptance == null ? null : mt.labelAcceptance >= 85),
      tile(pctText(mt.wrongLowRate), "önemli e-postayı yanlış düşük öncelikleme (" + mt.wrongLow + "/" + mt.important + ") — hedef < %2", mt.wrongLowRate == null ? null : mt.wrongLowRate < 2),
      tile(pctText(mt.priorityAgreement), "öncelik önerisi korundu (" + mt.reviewed + " gözden geçirilen)", null),
      tile(String(mt.mails), "ileti (" + mt.byPriority.yuksek + " yüksek · " + mt.byPriority.normal + " normal · " + mt.byPriority.dusuk + " düşük)", null),
      tile(String(c.aiRuns) + " · " + c.aiClamped, "MyMind isteği · Düşük önerisi engellendi", null),
      tile(String(c.drafts) + " · " + c.copies, "yanıt taslağı · kopyalama", null),
      tile(String(c.bulk), "toplu değişiklik", null),
      tile(String(c.imports) + " · " + c.duplicates, "içe aktarma · atlanan kopya", null),
      tile(String(c.exports), "dışa aktarma", null));
    const g = s.gold;
    $("goldInfo").textContent = g && g.mails ? "Elle etiketli örnek gelen kutusu (" + g.mails + " ileti, kural tabanlı öneri): etiket kesinliği " + pctText(g.labelPrecision) + ", duyarlılık " + pctText(g.labelRecall) + ", öncelik uyumu " + pctText(g.priorityAgreement) + ", önemli iletinin Düşük önerilmesi " + g.importantLow + "/" + g.important + " (" + pctText(g.wrongLowRate) + ")." : "";
    const ae = document.activeElement;
    if (ae !== $("setMine")) $("setMine").value = s.settings.myAddresses.join(", ");
    if (ae !== $("setName")) $("setName").value = s.settings.myName;
    if (ae !== $("setVip")) $("setVip").value = s.settings.vip.join(", ");
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (ae !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (ae !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "İletiler, kararlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: iletiler düz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }
  $("saveAddr").addEventListener("click", guard(async () => { apply(await D.setSettings({ myAddresses: $("setMine").value, myName: $("setName").value, vip: $("setVip").value })); toast("Kaydedildi; öneriler yeniden hesaplandı (kararlarınız korundu)."); }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => { apply(await D.setSettings({ provider: r.value })); toast(r.value === "yerel" ? "Yapay zekâ motoru: yerel model." : "Yapay zekâ motoru: MyMind (Hub)."); })));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("csvBtn").addEventListener("click", guard(async () => { const r = await D.exportCsv(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi (" + r.count + " ileti)."); }));
  $("mdBtn").addEventListener("click", guard(async () => { const r = await D.exportMd(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi (" + r.count + " ileti)."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.backup(); if (!r.cancelled) toast("Yedek “" + r.file + "” dosyasına yazıldı."); }));

  // ---------------- Olaylar ----------------
  function importResult(r, what) {
    apply(r.state);
    toast((r.added ? r.added + " ileti eklendi" : "Yeni ileti yok") + (r.dup ? " · " + r.dup + " kopya atlandı" : "") + (r.bad ? " · " + r.bad + " okunamadı" : "") + (r.tooBig ? " · " + r.tooBig + " dosya 25 MB'tan büyük" : "") + (what || "") + ".");
  }
  document.addEventListener("click", guard(async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "import") { const r = await D.mail.importFiles(); if (!r.cancelled) { go("inbox"); importResult(r); } }
    if (act === "sample") { const r = await D.mail.sample(); go("inbox"); importResult(r, r.settingsAdded ? " · örnek adresler ve önemli alan ayarlara yazıldı" : ""); }
    if (act === "paste") { $("pasteText").value = ""; $("pasteDialog").showModal(); $("pasteText").focus(); }
  }));
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteRun").addEventListener("click", guard(async () => { const r = await D.mail.paste($("pasteText").value); $("pasteDialog").close(); go("inbox"); importResult(r); }));
  document.querySelectorAll("[data-prio]").forEach((b) => b.addEventListener("click", () => { state.prio = b.dataset.prio; renderInbox(); }));
  $("labelFilter").addEventListener("change", () => { state.label = $("labelFilter").value; renderInbox(); });
  $("onlyNew").addEventListener("change", () => { state.onlyNew = $("onlyNew").checked; renderInbox(); });
  $("q").addEventListener("input", () => { state.q = $("q").value.trim(); renderInbox(); });
  $("selAll").addEventListener("change", () => { const list = state.s.mails.filter(visible); for (const m of list) { if ($("selAll").checked) state.sel.add(m.id); else state.sel.delete(m.id); } render(); });
  $("acceptSelBtn").addEventListener("click", guard(async () => { const r = await D.mail.accept([...state.sel]); apply(r.state); toast(r.accepted + " iletinin önerisi kabul edildi."); }));

  // MyMind
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı. Değiştirmek için yenisini yapıştırın." : "Anahtar henüz girilmedi. İsterseniz Ölçüler ve ayarlar → Yapay zekâ motoru'ndan yerel modeli seçebilirsiniz."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); if (state.s.settings.provider !== "hub") apply(await D.setSettings({ provider: "hub" })); toast(r.stored === "vault" ? "Anahtar Windows kasasında şifreli saklandı." : "Anahtar bu oturum için bellekte tutuluyor."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); document.querySelector('[data-act="import"]').click(); }
    if (e.ctrlKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); go("inbox"); $("q").focus(); }
    if (state.view === "inbox" && !e.ctrlKey && !e.altKey && (e.key === "j" || e.key === "k") && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      const items = [...document.querySelectorAll("#list .ml-row-item")];
      const i = items.findIndex((x) => x.classList.contains("is-sel"));
      const nx = items[Math.max(0, Math.min(items.length - 1, i + (e.key === "j" ? 1 : -1)))];
      if (nx) { nx.click(); nx.focus(); }
    }
  });
  D.onState((s) => { state.s = s; render(); });
  D.state().then((s) => { state.s = s; render(); go("inbox"); document.documentElement.dataset.ready = "1"; });
})();
