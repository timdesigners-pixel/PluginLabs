/* Text Forge — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; dönüştürme ve pano ana süreçte yapılır. Canlı sabit alan önizlemesi
 * aynı çekirdeği (src/core.js, saf işlevler) kullanır. MyMind istekleri ana süreçte onaydan geçer. */
(function () {
  const D = window.tfDesktop;
  const C = window.TFCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["forge", "history", "settings"];
  const KIND_NAMES = { duzelt: "Düzelt", sadelestir: "Sadeleştir", kisalt: "Kısalt", bicim: "Biçim", ton: "Ton" };
  const state = { s: null, view: "forge", ops: null, tone: null, tab: "diff", result: null, ai: null, pick: null, histQ: "" };

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
  const fmtTime = (t) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const n = (x) => x.toLocaleString("tr-TR");

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "forge";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
  }

  // ---------------- Durum ----------------
  function render() {
    const s = state.s;
    if (!s) return;
    if (!state.ops) { state.ops = { ...s.settings.ops }; state.tone = s.settings.tone; $("toneSample").value = s.settings.toneSample; }
    $("histCount").textContent = String(s.history.length);
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    const st = s.stats;
    put($("sideInfo"), el("div", { class: "tf-mini__in" },
      el("span", { class: "pl-muted tf-small", text: "Sabit alan koruma" }), el("b", { text: st.protection == null ? "—" : "%" + st.protection }),
      el("span", { class: "pl-muted tf-small", text: s.hotkey ? "Hızlı pencere: " + s.hotkey : "Hızlı pencere kapalı" })));
    renderOptions();
    renderResult();
    renderHistory();
    renderSettings();
  }

  // ---------------- Atölye ----------------
  function renderOptions() {
    document.querySelectorAll("[data-op]").forEach((b) => { const on = !!state.ops[b.dataset.op]; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll("[data-tone]").forEach((b) => { const on = b.dataset.tone === state.tone; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $("sampleBox").hidden = state.tone !== "ornek";
    renderProfile();
  }
  function renderProfile() {
    const p = C.toneProfile($("toneSample").value);
    $("toneProfile").textContent = p ? "Örnekten çıkan üslup: " + C.TONE_NAMES[p.tone] + " · ortalama cümle " + p.avgWords + " kelime" + (p.emoji ? " · emoji var" : "") + " (" + p.formal + " resmî / " + p.informal + " samimi işaret)" : "Örnek girilmezse ton korunur.";
  }
  let liveTimer = null;
  function live() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(renderFields, 120);
    $("inCount").textContent = n($("input").value.length) + " karakter · " + n(C.words($("input").value).length) + " kelime";
  }
  function renderFields() {
    const text = $("input").value;
    const m = C.mask(text, state.s ? state.s.settings.glossary : []);
    const f = m.fields;
    $("fieldsSummary").textContent = f.length ? f.length + " sabit alan korunacak" : "";
    put($("fields"), ...f.slice(0, 40).map((x) => el("span", { class: "tf-chip tf-chip--" + x.type + (x.sensitive ? " is-secret" : ""), title: C.TYPE_NAMES[x.type] }, x.sensitive ? icon("lock") : null, el("i", { text: C.TYPE_NAMES[x.type] }), el("b", { text: x.sensitive ? C.maskValue(x.value) : x.value.length > 40 ? x.value.slice(0, 40) + "…" : x.value }))), f.length > 40 ? el("span", { class: "pl-muted tf-small", text: "+" + (f.length - 40) }) : null);
    const sens = C.sensitiveSummary(f);
    $("sensWarn").hidden = !sens.length;
    if (sens.length) put($("sensWarn"), icon("lock"), el("div", {}, el("div", { class: "pl-callout__title", text: "Metinde gizli bilgi var: " + sens.map((x) => x.count + " " + x.label).join(", ") }), el("span", { text: "Bu değerler hiçbir işlemde değiştirilmez, ekranda maskelenir ve MyMind'a gönderilmez. Paylaşmadan önce gerçekten gerekli olup olmadığına bakın." })));
  }
  function setInput(text, msg) {
    $("input").value = text;
    live();
    renderFields();
    go("forge");
    $("input").focus();
    if (msg) toast(msg);
  }
  function current() {
    if (state.pick) return state.pick;
    return state.result ? { text: state.result.output, histId: state.result.histId, source: "yerel" } : null;
  }
  function diffNode(segs) {
    const box = el("div", { class: "tf-diff" });
    for (const s of segs) box.appendChild(el(s.t === "eq" ? "span" : s.t === "ins" ? "ins" : "del", { class: s.t === "eq" ? "" : "tf-" + s.t, text: s.s }));
    return box;
  }
  function renderResult() {
    const r = state.result;
    const cur = current();
    document.querySelectorAll("[data-tab]").forEach((b) => { const on = b.dataset.tab === state.tab; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    $("chgCount").textContent = r ? String(r.changes.length) : "0";
    $("aiCount").hidden = !state.ai;
    $("aiCount").textContent = state.ai ? String(state.ai.length) : "0";
    ["copyBtn", "copyHideBtn", "reuseBtn"].forEach((id) => { $(id).disabled = !cur; });
    const kb = $("keepBadge");
    const kept = state.pick && state.pick.alt ? state.pick.alt : r;
    kb.hidden = !kept || !kept.total;
    if (kept && kept.total) { kb.textContent = "Sabit alan " + kept.kept + "/" + kept.total + (kept.kept === kept.total ? " korundu" : " — eksik var"); kb.className = "pl-badge pl-badge--" + (kept.kept === kept.total ? "success" : "warning"); }
    if (r) {
      const st = r.stats, pct = st.charsBefore ? Math.round(((st.charsAfter - st.charsBefore) / st.charsBefore) * 100) : 0;
      const tile = (v, l) => el("div", {}, el("b", { text: v }), el("span", { text: l }));
      put($("resStats"), tile(n(st.charsBefore) + " → " + n(st.charsAfter), "karakter (" + (pct > 0 ? "+" : "") + pct + "%)"), tile(n(st.wordsBefore) + " → " + n(st.wordsAfter), "kelime"), tile(String(r.changes.length), "değişiklik"), tile({ koru: "Korunur", resmi: "Resmî", notr: "Nötr", samimi: "Samimi" }[r.tone] || "—", r.profile ? "ton (örnekten)" : "ton"));
    } else put($("resStats"));
    const body = $("resBody");
    if (state.tab === "ai") return renderAi();
    if (!r && !state.pick) return put(body, el("div", { class: "tf-placeholder" }, el("p", { text: "İşlemleri ve tonu seçip Dönüştür'e basın (Ctrl+Enter)." }), el("p", { class: "tf-small", text: "Solda sabit alanlar (sayı, tarih, ad, e-posta, bağlantı…) önceden gösterilir; sonuçta aynen korunduğu denetlenir." })));
    if (state.tab === "out") return put(body, state.pick && state.pick.alt ? el("p", { class: "pl-muted tf-small", text: "MyMind alternatifi seçili. Yerel sonuca dönmek için Dönüştür'e yeniden basın." }) : null, el("pre", { class: "tf-out", text: cur.text }));
    if (state.tab === "changes") {
      if (!r.changes.length) return put(body, el("div", { class: "tf-placeholder", text: "Değişiklik yok — metin seçilen işlemlere göre zaten uygun." }));
      return put(body, el("ul", { class: "tf-changes" }, ...r.changes.map((c) => el("li", {}, badge(KIND_NAMES[c.kind] || c.kind), el("span", { class: "tf-from", text: c.from || "∅" }), el("span", { class: "tf-arrow", text: "→" }), el("span", { class: "tf-to", text: c.to || "(silindi)" }), c.note ? el("span", { class: "pl-muted tf-small", text: c.note }) : null))));
    }
    const segs = state.pick && state.pick.alt ? state.pick.alt.diff : r.diff;
    put(body, el("div", { class: "tf-legend tf-small pl-muted" }, el("del", { class: "tf-del", text: "silinen" }), " ", el("ins", { class: "tf-ins", text: "eklenen" }), r && r.missing && r.missing.length ? badge("eksik sabit alan: " + r.missing.length, "warning") : null), diffNode(segs));
  }
  function renderAi() {
    const body = $("resBody");
    if (!state.ai) return put(body, el("div", { class: "tf-placeholder" }, el("p", { text: "MyMind alternatifleri için “MyMind alternatifleri” düğmesine basın." }), el("p", { class: "tf-small", text: "Her istekte onay penceresi açılır. Sabit alanların değerleri gönderilmez; dönen her alternatifte aynen bulunup bulunmadıkları denetlenir." })));
    if (!state.ai.length) return put(body, el("div", { class: "tf-placeholder", text: "MyMind kullanılabilir bir alternatif döndürmedi." }));
    put(body, ...state.ai.map((a, i) => {
      const picked = state.pick && state.pick.histId === a.histId;
      const use = el("button", { type: "button", class: "pl-btn pl-btn--secondary pl-btn--sm", text: picked ? "Seçili" : "Kullan" });
      use.disabled = picked;
      use.addEventListener("click", () => { state.pick = { text: a.text, histId: a.histId, source: "mymind", alt: a }; state.tab = "diff"; renderResult(); toast("Alternatif " + (i + 1) + " seçildi. Kopyala ile panoya alın."); });
      const cp = el("button", { type: "button", class: "pl-btn pl-btn--ghost pl-btn--sm", text: "Kopyala" });
      cp.addEventListener("click", guard(async () => { await doCopy({ text: a.text, histId: a.histId }, false); }));
      return el("article", { class: "tf-alt" + (a.safe ? "" : " is-unsafe") },
        el("div", { class: "tf-alt__head" }, el("b", { text: "Alternatif " + (i + 1) }), badge("sabit alan " + a.kept + "/" + a.total, a.safe ? "success" : "warning"), a.note ? el("span", { class: "pl-muted tf-small", text: a.note }) : null, el("span", { class: "tf-grow" }), use, cp),
        a.missing.length ? el("div", { class: "tf-missing" }, icon("alert"), el("span", { text: "Eksik sabit alan — bu alternatifte kaybolmuş: " + a.missing.map((m) => m.value + " (" + m.label + ")").join(", ") + ". Kullanmadan önce kontrol edin." })) : null,
        diffNode(a.diff));
    }));
  }
  function readOpts() { return { ops: state.ops, tone: state.tone, toneSample: $("toneSample").value }; }
  async function run() {
    const text = $("input").value;
    if (!text.trim()) return toast("Önce bir metin yazın ya da yapıştırın.", true);
    if (!Object.values(state.ops).some(Boolean) && state.tone === "koru") return toast("En az bir işlem ya da ton seçin.", true);
    const r = await D.forge(text, readOpts());
    state.result = r;
    state.pick = null;
    if (state.tab === "ai") state.tab = "diff";
    renderResult();
    toast(r.changes.length + " değişiklik · sabit alan " + r.kept + "/" + r.total + (r.kept === r.total ? " korundu" : " — eksik var") + ".");
  }
  async function runAi() {
    const text = $("input").value;
    if (!text.trim()) return toast("Önce bir metin yazın ya da yapıştırın.", true);
    if (!state.s.hasKey) return openMymind();
    busy("MyMind alternatif yazıyor…");
    const r = await D.mymind.alternatives(text, readOpts());
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    state.ai = r.alternatives;
    state.tab = "ai";
    renderResult();
    const bad = r.alternatives.filter((a) => !a.safe).length;
    toast(r.alternatives.length + " MyMind alternatifi hazır" + (bad ? " — " + bad + " alternatifte sabit alan eksik" : " — sabit alanlar korundu") + ".");
  }
  async function doCopy(cur, hide) {
    const r = await D.copy(cur.text, cur.histId, hide);
    state.s = r.state;
    render();
    toast("Panoya kopyalandı (" + n(r.copied) + " karakter). Kaynak uygulamada Ctrl+V ile yapıştırın.");
  }
  document.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => { state.ops[b.dataset.op] = !state.ops[b.dataset.op]; renderOptions(); }));
  document.querySelectorAll("[data-tone]").forEach((b) => b.addEventListener("click", () => { state.tone = b.dataset.tone; renderOptions(); if (state.tone === "ornek") $("toneSample").focus(); }));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; renderResult(); }));
  $("toneSample").addEventListener("input", renderProfile);
  $("input").addEventListener("input", live);
  $("runBtn").addEventListener("click", guard(run));
  $("aiBtn").addEventListener("click", guard(runAi));
  $("copyBtn").addEventListener("click", guard(async () => { const c = current(); if (c) await doCopy(c, false); }));
  $("copyHideBtn").addEventListener("click", guard(async () => { const c = current(); if (c) await doCopy(c, true); }));
  $("reuseBtn").addEventListener("click", () => { const c = current(); if (c) setInput(c.text, "Sonuç girdiye alındı; üzerinde yeniden çalışabilirsiniz."); });

  // ---------------- Geçmiş ----------------
  function renderHistory() {
    const q = C.lowerTr(state.histQ.trim());
    const list = state.s.history.filter((h) => !q || C.lowerTr(h.output + " " + h.input).includes(q));
    if (!list.length) return put($("hist"), el("li", { class: "tf-empty", text: state.s.history.length ? "Aramayla eşleşen öneri yok." : "Henüz öneri yok. Atölyede Dönüştür'e bastığınızda burada görünür." }));
    put($("hist"), ...list.map((h) => {
      const ops = C.OPS.filter((k) => h.ops[k]).map((k) => C.OP_NAMES[k]);
      const cp = el("button", { type: "button", class: "pl-btn pl-btn--ghost pl-btn--sm", text: "Kopyala" });
      cp.addEventListener("click", guard(() => doCopy({ text: h.output, histId: h.id }, false)));
      const take = el("button", { type: "button", class: "pl-btn pl-btn--ghost pl-btn--sm", text: "Atölyeye al" });
      take.addEventListener("click", () => setInput(h.output, "Öneri atölyeye alındı."));
      const rm = el("button", { type: "button", class: "tf-icon-btn", "aria-label": "Öneriyi sil", title: "Sil" }, icon("x"));
      rm.addEventListener("click", guard(async () => { state.s = await D.removeHistory(h.id); render(); }));
      return el("li", { class: "tf-histrow" },
        el("div", { class: "tf-histrow__head" }, badge(h.source === "mymind" ? "MyMind" : "Yerel", h.source === "mymind" ? "warning" : ""), el("span", { class: "pl-muted tf-small", text: fmtTime(h.at) + " · " + [...ops, h.tone !== "koru" ? C.TONE_NAMES[h.tone] : ""].filter(Boolean).join(", ") }),
          h.total ? badge("sabit " + h.kept + "/" + h.total, h.kept === h.total ? "success" : "warning") : null, h.used ? badge("kullanıldı", "success") : null, el("span", { class: "tf-grow" }), cp, take, rm),
        el("p", { class: "tf-histrow__out", text: h.output.length > 280 ? h.output.slice(0, 280) + "…" : h.output }));
    }));
  }
  $("histSearch").addEventListener("input", () => { state.histQ = $("histSearch").value; renderHistory(); });

  // ---------------- Sözlük, ayarlar ve ölçüler ----------------
  function renderSettings() {
    const s = state.s;
    put($("glossary"), ...(s.settings.glossary.length ? s.settings.glossary.map((t) => {
      const rm = el("button", { type: "button", class: "tf-chip__x", "aria-label": t + " terimini kaldır" }, icon("x"));
      rm.addEventListener("click", guard(async () => { state.s = await D.setSettings({ glossary: s.settings.glossary.filter((x) => x !== t) }); render(); renderFields(); }));
      return el("span", { class: "tf-chip tf-chip--terim" }, el("b", { text: t }), rm);
    }) : [el("span", { class: "pl-muted tf-small", text: "Sözlük boş." })]));
    $("setHotkey").checked = s.settings.hotkey;
    $("setHide").checked = s.settings.hideAfterCopy;
    $("hotkeyInfo").textContent = s.settings.hotkey ? (s.hotkey ? "Kısayol etkin." : "Kısayol başka bir uygulama tarafından kullanılıyor olabilir; etkinleştirilemedi.") : "Kısayol kapalı.";
    const st = s.stats;
    const m = (val, label, ok) => el("div", {}, el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad", text: val }), el("span", { text: label }));
    put($("metrics"),
      m(st.protection == null ? "—" : "%" + st.protection, "sabit alan koruma (" + (st.fieldsKept + st.aiFieldsKept) + "/" + (st.fieldsTotal + st.aiFieldsTotal) + ")", st.protection == null ? null : st.protection >= 99),
      m(st.usage == null ? "—" : "%" + st.usage, "öneri kullanma (" + st.used + "/" + st.suggestions + ")", st.usage == null ? null : st.usage >= 50),
      m(st.aiProtection == null ? "—" : "%" + st.aiProtection, "MyMind sabit alan koruma", st.aiProtection == null ? null : st.aiProtection >= 99),
      m(String(st.runs), "yerel dönüştürme", null),
      m(String(st.aiRuns), "MyMind isteği", null),
      m(String(st.secretsBlocked), "alınmayan parola benzeri pano", null));
    $("vaultInfo").textContent = s.vault ? "Geçmiş, sözlük ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: geçmiş düz JSON olarak saklanır, MyMind anahtarı yalnız oturum boyunca bellekte tutulur.";
  }
  $("termForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    const t = $("termInput").value.trim();
    if (t.length < 2) return toast("Terim en az 2 karakter olmalı.", true);
    state.s = await D.setSettings({ glossary: [...state.s.settings.glossary, t] });
    $("termInput").value = "";
    render();
    renderFields();
    toast("“" + t + "” sözlüğe eklendi; artık sabit alan.");
  }));
  $("setHotkey").addEventListener("change", guard(async () => { state.s = await D.setSettings({ hotkey: $("setHotkey").checked }); render(); }));
  $("setHide").addEventListener("change", guard(async () => { state.s = await D.setSettings({ hideAfterCopy: $("setHide").checked }); render(); }));

  // ---------------- Metin kaynakları ----------------
  function clipResult(r) {
    if (r.blocked) return toast("Panodaki metin bir parola ya da anahtar gibi görünüyor; güvenlik için alınmadı.", true);
    if (r.empty) return toast("Panoda metin yok.", true);
    setInput(r.text, "Panodan alındı" + (r.truncated ? " (ilk 20.000 karakter)" : "") + ".");
  }
  document.addEventListener("click", guard(async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "clip") clipResult(await D.readClipboard());
    if (act === "sample") { const r = await D.sample(); setInput(r.text, "Örnek taslak açıldı."); }
    if (act === "openFile") { const r = await D.openFile(); if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı" + (r.truncated ? " (ilk 20.000 karakter)" : "") + "."); }
    if (act === "clear") { setInput(""); state.result = null; state.pick = null; state.ai = null; renderResult(); }
    if (act === "clearHistory") { state.s = await D.clearHistory(); render(); toast("Geçmiş silindi."); }
  }));

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
    if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); D.openFile().then((r) => { if (r && !r.cancelled) setInput(r.text, "“" + r.name + "” açıldı."); }).catch((x) => toast(clean(x), true)); }
    if (e.ctrlKey && e.key === "Enter" && state.view === "forge") { e.preventDefault(); guard(run)(); }
  });
  D.onState((s) => { state.s = s; render(); });
  D.onQuick((r) => clipResult(r));
  D.state().then((s) => {
    state.s = s;
    render();
    go("forge");
    live();
    document.documentElement.dataset.ready = "1";
  });
})();
