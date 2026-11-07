/* Voice Note Orbit — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; bunlar ana süreçte yapılır. Mikrofon yalnız kayıt düğmesi basılıyken açıktır. */
(function () {
  const D = window.vnDesktop, C = window.VNCore, R = window.VNRec;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["inbox", "tasks", "notes", "settings"];
  const state = { s: null, view: "inbox", filter: "hepsi", showDone: false, showArchived: false, noteQ: "", rec: "idle", clicks: 0, audioUrl: null, audioFor: null };

  const ICONS = { check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3", alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4", spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4" };
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
  const badge = (text, tone, attrs) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, ...(attrs || {}) });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", (e) => { e.stopPropagation(); guard(onClick)(e); }); return b; };
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  // Fare basılıyken gelen durum, tıklama tamamlanana kadar bekletilir: alan "change" olayı yeniden çizime yol açıp tıklanan düğmeyi yok etmesin.
  let holding = false, pending = null;
  function apply(s) { if (!s || !s.settings) return; if (holding) { pending = s; return; } state.s = s; render(); }
  document.addEventListener("pointerdown", (e) => { if (e.target !== $("recBtn") && !$("recBtn").contains(e.target)) holding = true; }, true);
  document.addEventListener("pointerup", () => { if (!holding) return; setTimeout(() => { holding = false; if (pending) { const p = pending; pending = null; apply(p); } }, 0); }, true);
  const cur = () => state.s && state.s.note;
  const shortDay = (iso) => { const d = C.dateOf(iso); return d ? d.getUTCDate() + " " + C.capTr(C.MONTHS_TR[d.getUTCMonth()]).slice(0, 3) : ""; };
  const whenShort = (w) => (!w ? "" : w.ambiguous ? "Belirsiz" : (w.date ? shortDay(w.date) : "") + (w.time ? " " + w.time : ""));

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "inbox";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }

  // ---------------- Durum ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    const live = s.notes.filter((n) => !n.archived);
    $("draftCount").textContent = String(live.filter((n) => n.status === "taslak").length);
    $("taskCount").textContent = String(live.filter((n) => n.kind === "gorev" && n.status === "kayitli").length);
    $("noteCount").textContent = String(live.filter((n) => n.kind === "not" && n.status !== "taslak").length);
    $("bubbleState").textContent = s.bubbleShown ? "Açık" : "Kapalı";
    $("bubbleState").className = "pl-badge" + (s.bubbleShown ? " pl-badge--success" : "");
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const st = s.stats;
    put($("sideInfo"), el("div", { class: "vn-mini__in" },
      el("span", { class: "pl-muted vn-small", text: "Hızlı kayıt (≤ 3 tık)" }), el("b", { class: st.quickRate == null ? "" : st.quickRate >= 90 ? "is-ok" : "is-bad", text: pctText(st.quickRate) }),
      el("span", { class: "pl-muted vn-small", text: "Tarih doğruluğu" }), el("b", { class: st.dateAccuracy == null ? "" : st.dateAccuracy >= 90 ? "is-ok" : "is-bad", text: pctText(st.dateAccuracy) }),
      el("span", { class: "pl-muted vn-small", text: st.ambiguous ? st.ambiguous + " notta tarih seçimi bekliyor" : "Seçim bekleyen tarih yok" })));
    if (state.rec === "idle") $("recSub").textContent = "Kısa ses notu (en çok " + s.settings.maxSeconds + " sn). Bırakınca kayıt durur; sürekli dinleme yok.";
    renderList();
    renderDetail();
    renderTasks();
    renderNotes();
    renderSettings();
  }

  // ---------------- Kayıt (ana pencere) ----------------
  const rec = R.createRecorder({
    maxSeconds: () => (state.s ? state.s.settings.maxSeconds : 60),
    onLevel: (l) => { $("meter").style.width = Math.round(l * 100) + "%"; },
    onTick: (sec) => { $("recSub").textContent = "Kaydediliyor… " + C.fmtDur(sec) + " / " + C.fmtDur(state.s.settings.maxSeconds) + " — bırakınca durur"; },
    onLimit: () => release(),
  });
  function recUi(p) {
    state.rec = p;
    $("recBtn").classList.toggle("is-rec", p === "rec");
    $("recBtn").classList.toggle("is-busy", p === "busy");
    $("recBtn").setAttribute("aria-pressed", p === "rec" ? "true" : "false");
    $("recTitle").classList.toggle("is-rec", p === "rec");
    $("recTitle").textContent = p === "rec" ? "● Kayıt yapılıyor" : p === "busy" ? "Metne çevriliyor…" : "Basılı tut, konuş, bırak";
    if (p === "idle" && state.s) $("recSub").textContent = "Kısa ses notu (en çok " + state.s.settings.maxSeconds + " sn). Bırakınca kayıt durur; sürekli dinleme yok.";
  }
  async function press(e) {
    if (state.rec !== "idle") return;
    if (e) e.preventDefault();
    state.clicks = 1;
    recUi("rec");
    try { await rec.start(); if (state.rec !== "rec") await rec.stop(); }
    catch (err) { recUi("idle"); toast(clean(err), true); }
  }
  async function release() {
    if (state.rec !== "rec") return;
    recUi("busy");
    let r;
    try { r = await rec.stop(); } catch (err) { recUi("idle"); return toast(clean(err), true); }
    if (!r || !r.wav) { recUi("idle"); return toast("Kayıt çok kısa — düğmeyi basılı tutarak konuşun.", true); }
    try {
      const res = await D.note.fromAudio(r.wav, { source: "kayit", from: "main", clicks: state.clicks });
      recUi("idle");
      apply(res.state);
      go("inbox");
      if (res.error) toast("Ses kaydedildi (" + C.fmtDur(res.seconds) + ") ama metne çevrilemedi: " + res.error, true);
      else if (res.stt.approved) toast("Ses notu metne çevrildi (" + C.fmtDur(res.seconds) + ").");
      else toast("Ses notu kaydedildi (" + C.fmtDur(res.seconds) + "). Metni yazabilir ya da sonra çevirebilirsiniz.");
    } catch (err) { recUi("idle"); toast(clean(err), true); }
  }

  // ---------------- Liste ----------------
  function renderList() {
    const s = state.s;
    document.querySelectorAll("[data-filter]").forEach((b) => { b.classList.toggle("is-active", b.dataset.filter === state.filter); b.setAttribute("aria-checked", b.dataset.filter === state.filter ? "true" : "false"); });
    const list = s.notes.filter((n) => !n.archived && (state.filter === "hepsi" || n.status === "taslak"));
    if (!list.length) { put($("list"), el("li", { class: "vn-empty", text: state.filter === "taslak" ? "Taslak yok. Yeni bir ses notu kaydedin." : "Henüz not yok. Kayıt düğmesini basılı tutun ya da yazın." })); return; }
    put($("list"), ...list.map((n) => {
      const li = el("li", { class: "vn-li" + (cur() && cur().id === n.id ? " is-sel" : "") + (n.status !== "taslak" ? " is-saved" : "") + (n.when && n.when.ambiguous ? " is-amb" : ""), tabindex: "0", "data-id": n.id, role: "button" },
        el("div", { class: "vn-li__head" }, el("b", { text: n.title || "Ses notu" }), badge(C.KIND_NAMES[n.kind], n.kind === "gorev" ? "accent" : "info")),
        el("div", { class: "vn-li__meta" },
          el("span", { text: C.SOURCE_NAMES[n.source] + (n.audio ? " · " + C.fmtDur(n.audio.seconds) : "") }),
          n.when ? (n.when.ambiguous ? badge("tarih seçin", "warning") : el("span", { text: "⏲ " + whenShort(n.when) })) : null,
          n.status === "taslak" ? badge("taslak") : n.status === "tamam" ? badge("tamamlandı", "success") : badge("kaydedildi", "success"),
          !n.transcript && n.audio ? badge("metin yok", "warning") : null));
      const open = guard(async () => apply(await D.note.open(n.id)));
      li.addEventListener("click", open);
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      return li;
    }));
  }

  // ---------------- Ayrıntı ----------------
  async function loadAudio(n, audioEl) {
    if (state.audioFor !== n.id || !state.audioUrl) {
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      state.audioUrl = null; state.audioFor = n.id;
      const bytes = await D.audio.get(n.id);
      state.audioUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    }
    audioEl.src = state.audioUrl;
  }
  function renderDetail() {
    const n = cur();
    const box = $("detail");
    if (!n) {
      if (state.audioUrl) { URL.revokeObjectURL(state.audioUrl); state.audioUrl = null; state.audioFor = null; }
      put(box, el("div", { class: "vn-hint" },
        el("h2", { class: "pl-h3 vn-h", text: "Ses notu yakalama" }),
        el("ol", { class: "vn-steps" },
          el("li", {}, "Kayıt düğmesini ya da yüzen balonu ", el("b", { text: "basılı tutun" }), ", konuşun, bırakın. Kayıt sırasında düğme kırmızıdır ve süre görünür."),
          el("li", {}, "Ses bu bilgisayardaki konuşma→metin sunucusuyla (onayınızla) metne çevrilir — sunucu yoksa metni yazın."),
          el("li", {}, "Görev mi not mu, tarih ve saat taslak olarak çıkarılır. “Saat 3”, “haftaya” gibi ", el("b", { text: "belirsiz" }), " ifadelerde seçmeniz istenir."),
          el("li", {}, "Kaydet: görevler takvime (.ics) ya da Excel'e (.csv) aktarılabilir. Ses ve transkript ayrı ayrı silinebilir.")),
        el("p", { class: "pl-muted vn-small", text: "Balonu " + state.s.shortcut + " ile açıp kapatabilirsiniz. Balondan 30 sn'lik bir not: bas-tut (1) → metne çevir onayı (2) → Kaydet (3)." })));
      return;
    }
    const titleIn = el("input", { class: "pl-input vn-title", id: "dTitle", maxlength: "120", value: n.title, "aria-label": "Başlık" });
    titleIn.addEventListener("change", guard(async () => apply(await D.note.update(n.id, { title: titleIn.value }))));
    const seg = el("div", { class: "pl-segment", role: "radiogroup", "aria-label": "Tür" });
    for (const k of C.KINDS) {
      const b = el("button", { type: "button", role: "radio", "data-kind": k, class: n.kind === k ? "is-active" : "", "aria-checked": n.kind === k ? "true" : "false" }, C.KIND_NAMES[k]);
      b.addEventListener("click", guard(async () => apply(await D.note.update(n.id, { kind: k }))));
      seg.append(b);
    }
    const head = el("div", { class: "vn-dhead" }, titleIn, seg,
      n.status === "taslak" ? badge("Taslak") : n.status === "tamam" ? badge("Tamamlandı", "success") : badge("Kaydedildi", "success"),
      badge(C.SOURCE_NAMES[n.source] + (n.sourceName ? " · " + n.sourceName : "")));
    const kindWhy = el("p", { class: "vn-why", text: "Tür: " + (n.kindWhy || "—") + " · Kayıt günü " + C.fmtDateTr(n.day) });

    // Ses
    const audioSec = el("div", { class: "vn-sec" });
    if (n.audio) {
      const au = el("audio", { class: "vn-audio", controls: true, preload: "metadata", "aria-label": "Ses notunu dinle" });
      loadAudio(n, au).catch((e) => toast("Ses açılamadı: " + clean(e), true));
      audioSec.append(el("div", { class: "vn-sec__head" }, el("span", { text: "Ses" }), badge(C.fmtDur(n.audio.seconds)), badge(Math.round(n.audio.bytes / 1024) + " KB"), el("span", { class: "vn-grow" }),
        btn("Metne çevir", "pl-btn--secondary", async () => { busy("Metne çevriliyor…"); const r = await D.note.transcribe(n.id); busy(null); if (r.approved) { apply(r.state); toast("Metne çevrildi."); } else toast("Metne çevirme iptal edildi."); }, { id: "sttBtn" }),
        btn("Sesi sil", "pl-btn--ghost", async () => { const r = await D.note.deleteAudio(n.id); if (r.approved) { apply(r.state); toast("Ses dosyası silindi; transkript kaldı."); } }, { id: "delAudio" })), au);
    } else audioSec.append(el("div", { class: "vn-sec__head" }, el("span", { text: "Ses" }), el("span", { class: "pl-muted", text: n.source === "yazili" ? "Yazılı not — ses yok" : "Ses dosyası silindi" })));

    // Transkript
    const tx = el("textarea", { class: "pl-input vn-tx", id: "dTx", maxlength: "6000", spellcheck: "false", placeholder: n.audio ? "Transkript yok. “Metne çevir” ile yerel sunucuya gönderin ya da burada yazın." : "Not metni", "aria-label": "Transkript" });
    tx.value = n.transcript;
    tx.addEventListener("change", guard(async () => apply(await D.note.update(n.id, { transcript: tx.value }))));
    const by = { "yerel-whisper": "yerel konuşma→metin", elle: "elle yazıldı", "mymind-duzeltme": "MyMind düzeltmesi" }[n.transcriptBy];
    const txSec = el("div", { class: "vn-sec" },
      el("div", { class: "vn-sec__head" }, el("span", { text: "Transkript" }), by ? badge(by) : null, n.aiUsed ? badge("MyMind", "accent") : null, el("span", { class: "vn-grow" }),
        btn("Yeniden çözümle", "pl-btn--ghost", async () => { apply(await D.note.reanalyze(n.id)); toast("Tür, başlık ve tarih transkriptten yeniden çıkarıldı."); }, { title: "Elle yaptığınız başlık/tür/tarih değişikliklerini geri alır" }),
        btn("MyMind ile düzenle", "pl-btn--ghost", async () => { busy("MyMind çalışıyor…"); const r = await D.ai.refine(n.id); busy(null); if (!r.approved) return toast("MyMind isteği iptal edildi."); apply(r.state); toast("MyMind önerisi uygulandı" + (r.dropped ? " (" + r.dropped + " dayanaksız öneri atıldı)" : "") + "."); }, { id: "aiBtn" }),
        n.transcript ? btn("Transkripti sil", "pl-btn--ghost", async () => { const r = await D.note.deleteTranscript(n.id); if (r.approved) { apply(r.state); toast("Transkript silindi."); } }, { id: "delTx" }) : null),
      tx);

    // Tarih
    const whenSec = el("div", { class: "vn-sec" });
    const w = n.when;
    whenSec.append(el("div", { class: "vn-sec__head" }, el("span", { text: n.kind === "gorev" ? "Son tarih ve saat" : "Tarih (isteğe bağlı)" }),
      w ? (w.ambiguous ? badge("belirsiz — seçin", "warning") : w.chosen ? badge("sizin seçiminiz", "success") : badge("otomatik", "info")) : badge("yok")));
    if (w && w.text) whenSec.append(el("div", { class: "vn-whenline" }, "Notta geçen: ", el("b", { text: "“" + w.text + "”" }), w.ambiguous ? "" : " → " + C.fmtWhen(w)));
    if (w && w.ambiguous) {
      whenSec.append(el("div", { class: "pl-callout pl-callout--warning" }, icon("alert"), el("div", {}, el("div", { class: "pl-callout__title", text: w.why || "Tarih belirsiz" }), el("span", { text: "Tek bir tarih uydurulmadı. Aşağıdan seçin ya da tarihi elle girin." }))));
      const ch = el("div", { class: "vn-choice", id: "choices" });
      for (const c of C.whenChoices(w)) ch.append(btn(c.label, "pl-btn--secondary", async () => apply(await D.note.update(n.id, { when: { date: c.date, time: c.time } })), { "data-choice": c.date + " " + c.time }));
      whenSec.append(ch);
    }
    const dIn = el("input", { class: "pl-input vn-date", type: "date", id: "dDate", value: w && w.date ? w.date : "", "aria-label": "Tarih" });
    const tIn = el("input", { class: "pl-input vn-time", type: "time", id: "dTime", value: w && w.time ? w.time : "", "aria-label": "Saat" });
    const setManual = guard(async () => apply(await D.note.update(n.id, { when: { date: dIn.value, time: tIn.value } })));
    dIn.addEventListener("change", setManual);
    tIn.addEventListener("change", setManual);
    whenSec.append(el("div", { class: "vn-row" }, dIn, tIn, w ? btn("Tarihi kaldır", "pl-btn--ghost", async () => apply(await D.note.update(n.id, { when: { clear: true } }))) : null));

    const foot = el("div", { class: "vn-dfoot" },
      btn(n.status === "taslak" ? "Kaydet (" + C.KIND_NAMES[n.kind].toLowerCase() + ")" : "Güncelle", "pl-btn--primary", async () => { apply(await D.note.save(n.id, { clicks: 1 })); toast(n.kind === "gorev" ? "Görev kaydedildi." : "Not kaydedildi."); }, { id: "saveBtn" }),
      n.status !== "taslak" && n.kind === "gorev" ? btn(n.status === "tamam" ? "Yeniden aç" : "Tamamlandı", "pl-btn--secondary", async () => apply(await D.note.done(n.id))) : null,
      el("span", { class: "vn-grow" }),
      btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.note.archive(n.id, true)); toast("Not arşivlendi (Notlar → Arşivi göster)."); }),
      btn("Notu sil", "pl-btn--ghost", async () => { const r = await D.note.remove(n.id); if (r.approved) { apply(r.state); toast("Not silindi."); } }, { id: "delNote" }));
    put(box, head, kindWhy, audioSec, txSec, whenSec, foot);
  }

  // ---------------- Görevler ----------------
  function renderTasks() {
    const s = state.s;
    const today = s.today;
    const tasks = s.notes.filter((n) => !n.archived && n.kind === "gorev" && n.status !== "taslak" && (state.showDone || n.status !== "tamam"))
      .sort((a, b) => { const x = a.when && a.when.date ? a.when.date + (a.when.time || "99") : "9999", y = b.when && b.when.date ? b.when.date + (b.when.time || "99") : "9999"; return x < y ? -1 : x > y ? 1 : b.createdAt - a.createdAt; });
    const head = el("div", { class: "vn-trow vn-trow--head", role: "row" }, el("span", { text: "" }), el("span", { text: "Görev" }), el("span", { text: "Son tarih" }), el("span", { text: "Kayıt" }), el("span", { text: "Kaynak" }));
    if (!tasks.length) { put($("taskTable"), head, el("p", { class: "vn-empty", text: "Kayıtlı görev yok. Gelen kutusundaki taslakları kaydedin." })); return; }
    put($("taskTable"), head, ...tasks.map((n) => {
      const cb = el("input", { type: "checkbox", "aria-label": "Tamamlandı", checked: n.status === "tamam" });
      cb.addEventListener("change", guard(async () => apply(await D.note.done(n.id))));
      const late = n.when && n.when.date && n.when.date < today && n.status !== "tamam";
      const open = el("button", { type: "button", class: "vn-linkbtn vn-ttitle", text: n.title });
      open.addEventListener("click", guard(async () => { apply(await D.note.open(n.id)); go("inbox"); }));
      return el("div", { class: "vn-trow" + (n.status === "tamam" ? " is-done" : ""), role: "row" }, el("span", {}, cb), el("span", {}, open, n.transcript ? el("span", { class: "vn-sub", text: n.transcript.slice(0, 140) }) : null),
        el("span", { class: "vn-due" + (late ? " is-late" : n.when && n.when.date === today ? " is-today" : ""), text: n.when && n.when.date ? C.fmtWhen(n.when) : "—" }), el("span", { text: shortDay(n.day) }), el("span", { text: C.SOURCE_NAMES[n.source] }));
    }));
  }
  // ---------------- Notlar ----------------
  function renderNotes() {
    const s = state.s, q = C.fold(state.noteQ);
    const list = s.notes.filter((n) => n.kind === "not" && n.status !== "taslak" && (state.showArchived || !n.archived) && (!q || C.fold(n.title + " " + n.transcript).includes(q)));
    if (!list.length) { put($("noteGrid"), el("p", { class: "vn-empty", text: q ? "Aramayla eşleşen not yok." : "Kayıtlı not yok." })); return; }
    put($("noteGrid"), ...list.map((n) => el("div", { class: "vn-note" + (n.archived ? " is-archived" : "") },
      el("div", { class: "vn-row" }, el("b", { class: "vn-grow", text: n.title }), n.archived ? badge("arşiv") : null),
      el("span", { class: "pl-muted vn-small", text: C.fmtDateTr(n.day) + " · " + C.SOURCE_NAMES[n.source] + (n.audio ? " · " + C.fmtDur(n.audio.seconds) : "") }),
      el("p", { text: n.transcript || "(transkript yok)" }),
      el("div", { class: "vn-row" }, btn("Aç", "pl-btn--ghost", async () => { apply(await D.note.open(n.id)); go("inbox"); }), n.archived ? btn("Arşivden çıkar", "pl-btn--ghost", async () => apply(await D.note.archive(n.id, false))) : null))));
  }
  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, st = s.stats, m = st.metrics;
    const tile = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      tile(pctText(st.quickRate), st.quickSaves ? st.quickWithin + "/" + st.quickSaves + " kayıt ≤ 3 tıkla kaydedildi (≤ 35 sn)" : "Henüz kaydedilmiş ses kaydı yok", st.quickRate == null ? "" : st.quickRate >= 90 ? "is-ok" : "is-bad"),
      tile(st.avgClicks == null ? "—" : String(st.avgClicks).replace(".", ","), "Ortalama tık (bas → kaydet)"),
      tile(pctText(st.dateAccuracy), st.dateChecked ? st.dateRight + "/" + st.dateChecked + " görevde tarih doğru çıkarıldı" : "Henüz kaydedilmiş görev yok", st.dateAccuracy == null ? "" : st.dateAccuracy >= 90 ? "is-ok" : "is-bad"),
      tile(s.bench ? pctText(s.bench.accuracy) : "—", s.bench ? "Etiketli örnek kümesi: " + s.bench.ok + "/" + s.bench.total + " tarih ifadesi" : "Örnek kümesi", s.bench && s.bench.accuracy >= 90 ? "is-ok" : "is-bad"),
      tile(String(m.recordings), "Ses kaydı"), tile(String(m.transcribed), "Metne çevrildi (" + m.sttFails + " hata)"), tile(String(st.tasks), "Kayıtlı görev (" + st.open + " açık)"), tile(C.fmtDur(st.audioSeconds), "Saklanan ses toplamı"));
    const set = (id, v) => { const e = $(id); if (document.activeElement !== e) e.value = v; };
    set("sttUrl", s.settings.sttUrl); set("sttModel", s.settings.sttModel); $("sttLang").value = s.settings.sttLang; $("sttAsk").checked = s.settings.sttAsk;
    $("maxSec").value = String(s.settings.maxSeconds); $("keepAudio").checked = s.settings.keepAudio; $("setBubble").checked = s.settings.bubble; $("setTop").checked = s.settings.bubbleTop;
    $("shortcutKbd").textContent = s.shortcut;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    set("localUrl", s.settings.localUrl); set("localModel", s.settings.localModel);
    $("vaultInfo").textContent = s.vault ? "Notlar, ses dosyaları ve MyMind anahtarı Windows kasasıyla (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: notlar ve sesler şifresiz saklanır, MyMind anahtarı yalnız bu oturumda bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.filter; renderList(); }));
  const rb = $("recBtn");
  rb.addEventListener("pointerdown", (e) => { if (e.button === 0) { rb.setPointerCapture(e.pointerId); press(e); } });
  rb.addEventListener("pointerup", () => release());
  rb.addEventListener("pointercancel", () => release());
  rb.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(); } });
  rb.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); release(); } });
  window.addEventListener("blur", () => { if (state.rec === "rec") release(); });
  $("typedBtn").addEventListener("click", guard(async () => { const r = await D.note.typed($("typed").value, { clicks: 1 }); $("typed").value = ""; apply(r.state); toast("Not eklendi — türü ve tarihi kontrol edip kaydedin."); }));
  $("typed").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("typedBtn").click(); } });
  $("sampleBtn").addEventListener("click", guard(async () => { const texts = await D.sample(); let st; for (const t of texts) st = (await D.note.typed(t)).state; apply(st); toast(texts.length + " örnek not eklendi."); }));
  $("fileBtn").addEventListener("click", guard(async () => {
    const f = await D.audio.openFile();
    if (f.cancelled) return;
    busy("Ses dosyası dönüştürülüyor…");
    const r = await R.toWav(f.bytes, C.MAX_IMPORT_SECONDS);
    busy("Metne çevriliyor…");
    const res = await D.note.fromAudio(r.wav, { source: "dosya", sourceName: f.name, from: "main", clicks: 1 });
    busy(null);
    apply(res.state);
    toast(res.error ? "Ses eklendi ama metne çevrilemedi: " + res.error : "“" + f.name + "” eklendi (" + C.fmtDur(res.seconds) + ").", !!res.error);
  }));
  $("showDone").addEventListener("change", (e) => { state.showDone = e.target.checked; renderTasks(); });
  $("showArchived").addEventListener("change", (e) => { state.showArchived = e.target.checked; renderNotes(); });
  $("noteSearch").addEventListener("input", (e) => { state.noteQ = e.target.value; renderNotes(); });
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.notes.exportAs($("exportFmt").value); if (!r.cancelled) toast(r.count + " kayıt dışa aktarıldı: " + r.file); }));
  $("copyBtn").addEventListener("click", guard(async () => { const r = await D.notes.copy(); toast(r.copied + " kayıt panoya kopyalandı (Markdown)."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.notes.backup(); if (!r.cancelled) toast(r.count + " not yedeklendi: " + r.file + " (sesler hariç)"); }));
  $("saveStt").addEventListener("click", guard(async () => { apply(await D.setSettings({ sttUrl: $("sttUrl").value.trim(), sttModel: $("sttModel").value.trim(), sttLang: $("sttLang").value })); toast("Metne çevirme ayarları kaydedildi."); }));
  $("sttLang").addEventListener("change", guard(async () => apply(await D.setSettings({ sttLang: $("sttLang").value }))));
  $("sttAsk").addEventListener("change", guard(async (e) => apply(await D.setSettings({ sttAsk: e.target.checked }))));
  $("maxSec").addEventListener("change", guard(async (e) => apply(await D.setSettings({ maxSeconds: Number(e.target.value) }))));
  $("keepAudio").addEventListener("change", guard(async (e) => apply(await D.setSettings({ keepAudio: e.target.checked }))));
  $("setBubble").addEventListener("change", guard(async (e) => apply(await D.setSettings({ bubble: e.target.checked }))));
  $("setTop").addEventListener("change", guard(async (e) => apply(await D.setSettings({ bubbleTop: e.target.checked }))));
  $("bubbleBtn").addEventListener("click", guard(async () => apply(await D.bubble.toggle())));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarları kaydedildi."); }));
  // MyMind
  const dlg = $("mymindDialog");
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; dlg.showModal(); });
  $("mymindCancel").addEventListener("click", () => dlg.close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); dlg.close(); toast(r.stored === "vault" ? "Anahtar Windows kasasında saklandı." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); dlg.close(); toast("Anahtar kaldırıldı."); }));

  D.onState((s) => apply(s));
  D.state().then((s) => { go("inbox"); apply(s); document.documentElement.dataset.ready = "1"; });
})();
