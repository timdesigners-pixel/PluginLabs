/* API Pocket — ana pencere. Her metin yalnız textContent / value ile yazılır (yanıt dahil; HTML olarak yazma yok). Arayüz ağa,
 * panoya, dosya sistemine ve sır değerlerine doğrudan erişmez; her işlem ana sürece dar IPC ile gider. Gizli değişkenin değeri
 * arayüze hiç gelmez (yalnız "kayıtlı" bilgisi). */
(function () {
  const D = window.apDesktop;
  const C = window.APCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["requests", "envs", "history", "settings"];
  const state = { s: null, view: "requests", lf: "etkin", q: "", reqTab: "params", respTab: "body", envSel: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    x: "M18 6 6 18M6 6l12 12",
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
    setTimeout(() => t.remove(), 9000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
  const fmtMs = (ms) => (ms == null ? "—" : ms < 1000 ? ms + " ms" : (ms / 1000).toFixed(1).replace(".", ",") + " sn");
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  /** Metindeki {{değişken}} ve ⟦sır:…⟧ parçalarını vurgulu yazar (yalnız textContent). */
  function marked(text, missing) {
    const span = el("span");
    const re = /(\{\{\s*[A-Za-z_][A-Za-z0-9_.-]*\s*\}\}|⟦sır:[^⟧]*⟧)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) span.appendChild(document.createTextNode(text.slice(last, m.index)));
      const name = m[1].replace(/[{}\s]/g, "");
      span.appendChild(el("span", { class: /^⟦/.test(m[1]) ? "t-red" : (missing || []).includes(name) ? "ap-miss" : "ap-sec", text: m[1] }));
      last = m.index + m[1].length;
    }
    if (last < text.length) span.appendChild(document.createTextNode(text.slice(last)));
    return span;
  }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "requests";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }
  function render() {
    const a = document.activeElement;
    const fkey = a && a !== document.body ? (a.id ? "#" + a.id : a.dataset.row ? '[data-row="' + a.dataset.row + '"]' : a.dataset.var ? '[data-var="' + a.dataset.var + '"]' : null) : null;
    const sel = fkey && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
    draw();
    if (fkey && !document.querySelector("dialog[open]")) { const b = document.querySelector(fkey); if (b && b !== document.activeElement) { b.focus(); if (sel && typeof b.setSelectionRange === "function") try { b.setSelectionRange(sel[0], sel[1]); } catch { /* yok */ } } }
  }
  function draw() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("tplCount").textContent = String(m.templates);
    $("envCount").textContent = String(s.envs.length);
    $("histCount").textContent = String(m.history);
    $("foot").textContent = "API Pocket " + s.version + " · PluginLabs · yalnız GET · istek yalnız siz gönderince · sırlar kasada, günlükte yok";
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "dp-mini__in" },
      el("span", { class: "pl-muted dp-small", text: "Günlükte görünen sır" }),
      el("b", { class: m.leaks ? "is-bad" : "is-ok", text: String(m.leaks) }),
      el("span", { class: "pl-muted dp-small", text: "İlk doğru istek: " + (m.firstOkMs == null ? "—" : fmtMs(m.firstOkMs)) + " · " + m.ok + "/" + m.sends + " başarılı" })));
    const sel = $("envSelect");
    put(sel, el("option", { value: "", text: "Ortam yok" }), ...s.envs.map((e) => el("option", { value: e.id, text: e.name + (e.production ? " · ÜRETİM" : "") })));
    sel.value = s.activeEnv || "";
    if (state.view === "requests") renderRequests();
    if (state.view === "envs") renderEnvs();
    if (state.view === "history") renderHistory();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- İstekler ----------------
  function renderRequests() {
    const s = state.s;
    document.querySelectorAll("[data-lf]").forEach((b) => { b.classList.toggle("is-active", b.dataset.lf === state.lf); b.setAttribute("aria-checked", b.dataset.lf === state.lf ? "true" : "false"); });
    const empty = !s.templates.length;
    $("emptyPanel").hidden = !empty;
    $("tplSplit").hidden = empty;
    if (empty) return;
    const q = C.fold(state.q);
    const list = s.templates.filter((t) => (state.lf === "arsiv" ? t.archived : !t.archived) && (!q || C.fold(t.name + " " + t.url + " " + t.folder).includes(q)));
    const groups = new Map();
    for (const t of list) { const g = t.folder || "Klasörsüz"; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(t); }
    const items = [];
    for (const [g, arr] of groups) {
      items.push(el("li", { class: "dp-group", text: g, role: "presentation" }));
      for (const t of arr) {
        const tone = t.last == null ? "" : t.last >= 200 && t.last < 300 ? " is-ok" : t.last >= 300 && t.last < 400 ? " is-mid" : " is-bad";
        const li = el("li", { class: "dp-item" + (t.id === s.active ? " is-sel" : ""), role: "option", tabindex: "0", "data-id": t.id, "aria-selected": t.id === s.active ? "true" : "false" },
          el("div", { class: "dp-ititle" }, el("span", { text: t.name }), el("span", { class: "dp-dot" + tone, title: t.last ? "Son durum " + t.last : "Henüz gönderilmedi" })),
          el("span", { class: "dp-src", text: "GET " + t.url }));
        const open = guard(async () => { state.respTab = "body"; apply(await D.tpl.open(t.id)); });
        li.addEventListener("click", open);
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
        items.push(li);
      }
    }
    if (!list.length) items.push(el("li", { class: "dp-empty", text: state.lf === "arsiv" ? "Arşiv boş." : "Eşleşen şablon yok." }));
    put($("tplList"), ...items);
    renderDetail();
  }

  function rowsEditor(rows, onSave, kind) {
    const wrap = el("div", { class: "ap-rows" });
    const draw = () => {
      const kids = [el("div", { class: "ap-row ap-rowhead" }, el("span"), el("span", { text: kind === "params" ? "Parametre" : "Başlık" }), el("span", { text: "Değer ({{değişken}} kullanılabilir)" }), el("span"))];
      rows.forEach((r, i) => {
        const on = el("input", { type: "checkbox", checked: r.on, "aria-label": "Etkin" });
        const k = el("input", { class: "pl-input", value: r.k, maxlength: "200", spellcheck: "false", "aria-label": kind === "params" ? "Parametre adı" : "Başlık adı", "data-row": kind + "-k-" + i });
        const v = el("input", { class: "pl-input", value: r.v, maxlength: "4000", spellcheck: "false", "aria-label": "Değer", "data-row": kind + "-v-" + i });
        const rm = btn("", "pl-btn--ghost ap-rm", async () => { rows.splice(i, 1); await onSave(rows); }, { "aria-label": "Satırı kaldır", title: "Satırı kaldır" });
        rm.appendChild(icon("x"));
        on.addEventListener("change", guard(async () => { r.on = on.checked; await onSave(rows); }));
        k.addEventListener("change", guard(async () => { r.k = k.value; await onSave(rows); }));
        v.addEventListener("change", guard(async () => { r.v = v.value; await onSave(rows); }));
        kids.push(el("div", { class: "ap-row" }, on, k, v, rm));
      });
      kids.push(el("div", { class: "dp-row" }, btn("+ Satır ekle", "pl-btn--ghost", async () => { rows.push({ k: "", v: "", on: true }); draw(); const ins = wrap.querySelectorAll("input.pl-input"); if (ins.length) ins[ins.length - 2].focus(); }, { "data-add": kind })));
      put(wrap, ...kids);
    };
    draw();
    return wrap;
  }

  function renderDetail() {
    const s = state.s;
    const d = s.detail;
    const box = $("tplDetail");
    if (!d) { put(box, el("p", { class: "dp-empty", text: "Soldan bir istek seçin ya da yeni istek oluşturun." })); return; }
    const save = (patch) => D.tpl.set(d.id, patch).then(apply);
    const name = el("input", { class: "pl-input ap-name", id: "tplName", value: d.name, maxlength: "120", "aria-label": "Şablon adı" });
    name.addEventListener("change", guard(() => save({ name: name.value })));
    const folder = el("input", { class: "pl-input", id: "tplFolder", value: d.folder, maxlength: "60", placeholder: "Klasör", "aria-label": "Klasör" });
    folder.addEventListener("change", guard(() => save({ folder: folder.value })));
    const url = el("input", { class: "pl-input ap-url", id: "tplUrl", value: d.url, maxlength: "4000", spellcheck: "false", "aria-label": "Adres", placeholder: "https://api.ornek.example/v1/… ya da {{base_url}}/…" });
    url.addEventListener("change", guard(() => save({ url: url.value })));
    url.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); save({ url: url.value }).then(() => send()); } });
    const sendBtn = btn("Gönder", "pl-btn--primary ap-send", () => send(), { id: "sendBtn", title: "Ctrl+Enter" });
    const env = s.envs.find((e) => e.id === s.activeEnv);

    const pv = d.preview;
    const preview = el("div", { class: "dp-block" + (pv.ok ? "" : " dp-block--bad"), id: "previewBox" },
      el("div", { class: "dp-bar" }, el("span", { class: "dp-lbl", text: "Gönderilecek istek" }), env ? badge(env.name, env.production ? "danger" : "") : badge("Ortam yok", "warning"),
        pv.secretsUsed.length ? badge(pv.secretsUsed.length + " gizli değişken", "warning", "Değerleri burada gösterilmez") : null),
      el("div", { class: "ap-preview" }, el("b", { text: "GET " }), marked(pv.url, pv.missing)),
      ...pv.headers.map(([k, v]) => el("div", { class: "ap-preview" }, el("span", { class: "pl-muted", text: k + ": " }), marked(v, pv.missing))),
      ...pv.errors.map((e) => el("div", { class: "dp-hint ap-prod", text: "⛔ " + e })));

    const tabs = [["params", "Parametreler", d.params.filter((x) => x.on && x.k).length], ["headers", "Başlıklar", d.headers.filter((x) => x.on && x.k).length], ["notes", "Not ve belge", null]];
    const tabBar = el("div", { class: "pl-tabs ap-tabs", role: "tablist" }, ...tabs.map(([k, label, n]) => {
      const b = el("button", { type: "button", class: "pl-tab ap-tab" + (state.reqTab === k ? " is-active" : ""), role: "tab", "aria-selected": state.reqTab === k ? "true" : "false", "data-rtab": k }, label, n ? badge(String(n)) : null);
      b.addEventListener("click", () => { state.reqTab = k; renderDetail(); });
      return b;
    }));
    let tabBody;
    if (state.reqTab === "params") tabBody = rowsEditor(d.params.map((x) => ({ ...x })), (rows) => save({ params: rows }), "params");
    else if (state.reqTab === "headers") tabBody = rowsEditor(d.headers.map((x) => ({ ...x })), (rows) => save({ headers: rows }), "headers");
    else {
      const notes = el("textarea", { class: "pl-input ap-textarea", id: "tplNotes", maxlength: "2000", "aria-label": "Not" });
      notes.value = d.notes;
      notes.addEventListener("change", guard(() => save({ notes: notes.value })));
      const doc = el("input", { class: "pl-input", id: "tplDoc", value: d.doc, maxlength: "500", spellcheck: "false", placeholder: "https://… (API belgesi; MyMind yalnız bu bağlantıyı kullanabilir)", "aria-label": "Belge bağlantısı" });
      doc.addEventListener("change", guard(() => save({ doc: doc.value })));
      tabBody = el("div", { class: "dp-stack" }, el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "tplNotes", text: "Not" }), notes),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "tplDoc", text: "Belge bağlantısı" }), doc));
    }

    const actions = el("div", { class: "ap-actions" },
      btn("curl olarak kopyala (sırsız)", "pl-btn--ghost", async () => { const r = await D.tpl.copyCurl(d.id); toast("Panoya kopyalandı: " + r.text.slice(0, 120)); }, { id: "curlCopy" }),
      btn("Çoğalt", "pl-btn--ghost", async () => apply(await D.tpl.duplicate(d.id))),
      d.archived ? btn("Arşivden çıkar", "pl-btn--ghost", async () => apply(await D.tpl.restore(d.id))) : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.tpl.archive(d.id)); toast("Arşivlendi — Arşiv süzgecinden geri alınabilir."); }));

    put(box,
      el("div", { class: "ap-head" }, name, folder),
      el("div", { class: "ap-reqbar" }, el("span", { class: "ap-method", title: "İlk sürüm yalnız GET", text: "GET" }), url, sendBtn),
      preview, tabBar, tabBody,
      renderResponse(d), actions);
  }

  function renderResponse(d) {
    const r = d.response;
    const box = el("div", { class: "dp-block", id: "respBox" });
    if (!r) { put(box, el("span", { class: "dp-lbl", text: "Yanıt" }), el("p", { class: "dp-hint", text: "Henüz gönderilmedi. İstek yalnız Gönder'e (ya da adreste Enter'a) bastığınızda gider." })); return box; }
    if (r.error) { box.className = "dp-block dp-block--bad"; put(box, el("span", { class: "dp-lbl", text: "Yanıt" }), el("div", { class: "dp-hint ap-prod", id: "respError", text: r.error }), el("span", { class: "dp-hint", text: fmtWhen(r.at) })); return box; }
    const head = el("div", { class: "ap-resphead" },
      el("span", { class: "dp-lbl", text: "Yanıt" }),
      el("span", { class: "pl-badge pl-badge--" + (r.tone || "info") + " ap-status", id: "respStatus", text: r.status + " " + r.statusText }),
      el("span", { class: "ap-stat", text: fmtMs(r.ms) }), el("span", { class: "ap-stat", text: C.fmtBytes(r.size) + (r.truncated ? " (kesildi)" : "") }),
      el("span", { class: "ap-stat", text: r.contentType || "içerik türü yok" }),
      r.redacted ? badge(r.redacted + " sır gizlendi", "warning", "Yanıtta gizli değişken değeri geçti; ⟦sır:ad⟧ olarak gösteriliyor") : null,
      el("span", { class: "dp-grow" }),
      btn("Kopyala", "pl-btn--ghost", async () => { const x = await D.copyResponse(d.id); toast(x.chars + " karakter panoya kopyalandı."); }),
      btn("Kaydet", "pl-btn--ghost", async () => { const x = await D.exportResponse(d.id); if (!x.cancelled) toast("Kaydedildi: " + x.file); }),
      r.fields.length ? btn("MyMind ile açıkla", "pl-btn--secondary", explain, { id: "explainBtn" }) : null);
    const kids = [head];
    if (r.location) kids.push(el("div", { class: "dp-hint" }, "Yönlendirme hedefi (otomatik izlenmedi): ", el("code", { text: r.location })));
    if (r.parseError) kids.push(el("div", { class: "dp-hint ap-prod", text: r.parseError }));
    if (r.ai && r.ai.summary) kids.push(el("div", { class: "dp-block dp-block--ai", id: "aiSummary" }, el("div", { class: "dp-bar" }, icon("spark"), el("b", { text: "MyMind özeti" }), r.ai.dropped ? badge(r.ai.dropped + " öğe atıldı", "warning", "Olmayan alan ya da verilmeyen bağlantı içeriyordu") : null),
      el("span", { text: r.ai.summary }), r.ai.doc ? el("span", { class: "dp-hint", text: "Belge: " + r.ai.doc }) : null));
    const tabs = [["body", "Gövde"], ["fields", "Alanlar", r.fields.length], ["headers", "Başlıklar", r.headers.length]];
    kids.push(el("div", { class: "pl-tabs ap-tabs", role: "tablist" }, ...tabs.map(([k, label, n]) => {
      const b = el("button", { type: "button", class: "pl-tab ap-tab" + (state.respTab === k ? " is-active" : ""), role: "tab", "aria-selected": state.respTab === k ? "true" : "false", "data-stab": k }, label, n ? badge(String(n)) : null);
      b.addEventListener("click", () => { state.respTab = k; renderDetail(); });
      return b;
    })));
    if (state.respTab === "body") {
      const pre = el("pre", { class: "ap-body", id: "respBody", tabindex: "0", "aria-label": "Yanıt gövdesi" });
      if (r.binary) pre.textContent = "İkili içerik (" + C.fmtBytes(r.size) + ") — metin olarak gösterilmez. " + (r.contentType || "");
      else if (r.tokens) for (const t of r.tokens) { if (t.t === "ws") pre.appendChild(document.createTextNode(t.v)); else if (/⟦sır:/.test(t.v)) pre.appendChild(marked(t.v)); else pre.appendChild(el("span", { class: "t-" + t.t, text: t.v })); }
      else pre.appendChild(/⟦sır:/.test(r.pretty) ? marked(r.pretty) : document.createTextNode(r.pretty || "(boş gövde)"));
      kids.push(pre);
    } else if (state.respTab === "fields") {
      if (!r.fields.length) kids.push(el("p", { class: "dp-hint", text: "Alan listesi yalnız JSON yanıtlarda çıkarılır." }));
      else kids.push(el("div", { class: "ap-tablewrap" }, el("table", { class: "ap-table", id: "fieldTable" },
        el("thead", null, el("tr", null, ...["Alan yolu", "Tür", "Görülme", "Boş", "Örnek", r.ai ? "MyMind açıklaması" : null].filter(Boolean).map((h) => el("th", { text: h })))),
        el("tbody", null, ...r.fields.map((f) => {
          const a = r.ai && r.ai.items[f.path];
          return el("tr", null, el("td", { class: "mono", text: f.path }), el("td", { text: f.types.join(" | ") }), el("td", { text: String(f.count) }), el("td", { text: f.nulls ? String(f.nulls) : "" }),
            el("td", { class: "mono" }, marked(f.sample)), r.ai ? el("td", { class: "ap-ai" + (a && a.unsure ? " is-unsure" : ""), text: a ? (a.unsure ? "(belirsiz) " : "") + a.text : "—" }) : null);
        })))));
    } else {
      kids.push(el("div", { class: "ap-tablewrap" }, el("table", { class: "ap-table", id: "headerTable" }, el("tbody", null, ...r.headers.map(([k, v]) => el("tr", null, el("td", { class: "mono", text: k }), el("td", { class: "mono" }, marked(v))))))));
    }
    put(box, ...kids);
    return box;
  }

  async function send() {
    const d = state.s.detail;
    if (!d) return;
    busy("İstek gönderiliyor…");
    try {
      const r = await D.tpl.send(d.id);
      busy(null);
      if (!r.approved) { apply(r.state); toast("Üretim ortamına gönderim iptal edildi."); return; }
      state.respTab = "body";
      apply(r.state);
      toast(r.status + " · " + fmtMs(r.ms) + (r.redacted ? " · yanıtta " + r.redacted + " sır gizlendi" : ""));
    } catch (e) {
      busy(null);
      apply(await D.state());
      toast(clean(e), true);
    }
  }
  async function explain() {
    busy("MyMind yanıt alanlarını açıklıyor…");
    const r = await D.ai.explain(state.s.detail.id);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    state.respTab = "fields";
    apply(r.state);
    toast(r.count + " alan açıklandı" + (r.dropped ? " · " + r.dropped + " öğe atıldı (olmayan alan / verilmeyen bağlantı)" : "") + ".");
  }

  // ---------------- Ortamlar ----------------
  function renderEnvs() {
    const s = state.s;
    if (!s.envs.some((e) => e.id === state.envSel)) state.envSel = s.activeEnv || (s.envs[0] && s.envs[0].id) || null;
    put($("envList"), ...(s.envs.length ? s.envs.map((e) => {
      const li = el("li", { class: "dp-item" + (e.id === state.envSel ? " is-sel" : ""), role: "option", tabindex: "0", "data-env": e.id },
        el("div", { class: "dp-ititle" }, el("span", { text: e.name }), e.production ? badge("ÜRETİM", "danger") : null, e.id === s.activeEnv ? badge("etkin", "accent") : null),
        el("span", { class: "dp-src", text: e.vars.length + " değişken · " + e.vars.filter((x) => x.secret).length + " gizli" }));
      li.addEventListener("click", () => { state.envSel = e.id; state.envDraft = null; renderEnvs(); });
      return li;
    }) : [el("li", { class: "dp-empty", text: "Ortam yok. “Yeni ortam” ile başlayın ya da Örnek API'yi açın." })]));
    const e = s.envs.find((x) => x.id === state.envSel);
    const box = $("envDetail");
    if (!e) { put(box, el("p", { class: "dp-empty", text: "Ortam seçin." })); return; }
    const name = el("input", { class: "pl-input", id: "envName", value: e.name, maxlength: "60", "aria-label": "Ortam adı" });
    name.addEventListener("change", guard(async () => apply(await D.env.set(e.id, { name: name.value }))));
    const prod = el("input", { type: "checkbox", id: "envProd", checked: e.production });
    prod.addEventListener("change", guard(async () => apply(await D.env.set(e.id, { production: prod.checked }))));
    if (!state.envDraft || state.envDraft.id !== e.id) state.envDraft = { id: e.id, rows: e.vars.map((x) => ({ k: x.k, v: x.secret ? "" : x.v, secret: x.secret, set: !!x.set, was: x.k, clear: false })) };
    const rows = state.envDraft.rows;
    const list = el("div", { class: "ap-rows", id: "varRows" });
    const draw = () => {
      const kids = [el("div", { class: "ap-row ap-row--env ap-rowhead" }, el("span", { text: "Değişken" }), el("span", { text: "Değer" }), el("span", { text: "Gizli" }), el("span"))];
      rows.forEach((r, i) => {
        const k = el("input", { class: "pl-input", value: r.k, maxlength: "64", spellcheck: "false", "aria-label": "Değişken adı", "data-var": "k-" + i });
        const v = el("input", { class: "pl-input", value: r.v, maxlength: "8000", spellcheck: "false", autocomplete: "off", type: r.secret ? "password" : "text", "aria-label": "Değer", "data-var": "v-" + i,
          placeholder: r.secret ? (r.set ? "•••••• kayıtlı — değiştirmek için yazın" : "değer girin (gösterilmez)") : "" });
        const sec = el("input", { type: "checkbox", checked: r.secret, "aria-label": "Gizli", "data-var": "s-" + i });
        const rm = btn("", "pl-btn--ghost ap-rm", () => { rows.splice(i, 1); draw(); }, { "aria-label": "Değişkeni kaldır", title: "Değişkeni kaldır" });
        rm.appendChild(icon("x"));
        k.addEventListener("input", () => { r.k = k.value; });
        v.addEventListener("input", () => { r.v = v.value; });
        sec.addEventListener("change", () => {
          if (!sec.checked && r.secret && r.set && !r.v) { sec.checked = true; toast("Kayıtlı gizli değer düz değişkene çevrilemez (görünür olurdu). Yeni değeri yazıp öyle çevirin ya da yeni değişken ekleyin.", true); return; }
          r.secret = sec.checked; draw();
        });
        kids.push(el("div", { class: "ap-row ap-row--env" }, k, v, el("label", { class: "ap-secretlbl" }, sec, icon("lock"), "gizli"), rm));
      });
      put(list, ...kids);
    };
    draw();
    put(box,
      el("div", { class: "ap-envname" }, name, el("label", { class: "dp-check dp-check--inline ap-prod" }, prod, el("span", { text: "Üretim ortamı — her gönderimden önce önizleme ve onay" }))),
      el("p", { class: "dp-hint", text: "Şablonda {{ad}} biçiminde kullanılır. Gizli değişken (anahtar, belirteç, parola) yalnız Windows kasasında saklanır; ekranda, geçmişte, curl kopyasında ve dışa aktarmada {{ad}} olarak kalır." + (s.vault ? "" : " Bu bilgisayarda kasa yok: gizli değerler yalnız bu oturumda bellekte tutulur, diske yazılmaz.") }),
      list,
      el("div", { class: "dp-row" },
        btn("+ Değişken", "pl-btn--ghost", () => { rows.push({ k: "", v: "", secret: false, set: false, was: "", clear: false }); draw(); }, { id: "varAdd" }),
        btn("+ Gizli değişken", "pl-btn--ghost", () => { rows.push({ k: "", v: "", secret: true, set: false, was: "", clear: false }); draw(); }, { id: "varAddSecret" }),
        el("span", { class: "dp-grow" }),
        e.id !== s.activeEnv ? btn("Etkin yap", "pl-btn--secondary", async () => apply(await D.setSettings({ activeEnv: e.id }))) : null,
        btn("Değişkenleri kaydet", "pl-btn--primary", async () => { const out = rows.map((r) => ({ k: r.k, v: r.v, secret: r.secret, was: r.was, clear: r.clear })); state.envDraft = null; apply(await D.env.vars(e.id, out)); toast("Değişkenler kaydedildi."); }, { id: "varSave" })));
  }

  // ---------------- Geçmiş ----------------
  function renderHistory() {
    const h = state.s.history;
    $("histInfo").textContent = h.length + " kayıt (en yeni 200)";
    if (!h.length) { put($("histBody"), el("p", { class: "dp-empty", text: "Henüz gönderim yok." })); return; }
    put($("histBody"), el("div", { class: "ap-tablewrap" }, el("table", { class: "ap-table", id: "histTable" },
      el("thead", null, el("tr", null, ...["Zaman", "Şablon", "Ortam", "Durum", "Süre", "Boyut", "Adres (maskeli)"].map((x) => el("th", { text: x })))),
      el("tbody", null, ...h.map((x) => {
        const st = C.statusInfo(x.status);
        const tr = el("tr", { class: "is-click", tabindex: "0" }, el("td", { text: fmtWhen(x.at) }), el("td", { text: x.tplName }), el("td", null, x.env || "—", x.production ? badge("ÜRETİM", "danger") : null),
          el("td", null, x.error ? badge("hata", "danger", x.error) : el("span", { class: "pl-badge pl-badge--" + (st.tone || "info"), text: String(x.status) })),
          el("td", { text: fmtMs(x.ms) }), el("td", { text: x.size ? C.fmtBytes(x.size) : "" }), el("td", { class: "mono" }, marked(x.url), x.redacted ? badge(x.redacted + " gizlendi", "warning") : null));
        tr.addEventListener("click", guard(async () => { apply(await D.tpl.open(x.tplId)); go("requests"); }));
        return tr;
      })))));
  }

  // ---------------- Ölçüler ve ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const tile = (v, label, cls) => el("div", null, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      tile(m.firstOkMs == null ? "—" : fmtMs(m.firstOkMs), "İlk doğru istek (örnek API; hedef ≤ 2 dk)", m.firstOkGoal == null ? "" : m.firstOkGoal ? "is-ok" : "is-bad"),
      tile(String(m.leaks), "Geçmişte/şablonlarda görünen sır (hedef 0)", m.leaks ? "is-bad" : "is-ok"),
      tile(String(m.redactions), "Yanıtta gizlenen sır değeri"),
      tile(m.ok + " / " + m.sends, "Başarılı (2xx) / gönderilen istek"),
      tile(fmtMs(m.medianMs), "Ortanca yanıt süresi (2xx)"),
      tile(String(m.blocked), "Gönderilmeyen istek (tanımsız değişken, geçersiz adres)"),
      tile(m.prodConfirms + " / " + m.prodDenied, "Üretim onayı: verilen / vazgeçilen"),
      tile(m.curlImports + " · " + m.secretsMoved, "curl içe aktarma · gizliye taşınan değer"),
      tile(m.aiRuns + " · " + m.aiDropped, "MyMind isteği · atılan öğe"));
    $("setTimeout").value = s.settings.timeoutSec;
    $("setMax").value = s.settings.maxBodyMB;
    $("setUa").checked = s.settings.userAgent;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Windows kasası (DPAPI) etkin: şablonlar, ortamlar, gizli değişkenler, geçmiş ve MyMind anahtarı şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: gizli değişken değerleri diske yazılmaz, yalnız bu oturumda bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-lf]").forEach((b) => b.addEventListener("click", () => { state.lf = b.dataset.lf; renderRequests(); }));
  $("tplSearch").addEventListener("input", () => { state.q = $("tplSearch").value; renderRequests(); });
  $("envSelect").addEventListener("change", guard(async () => apply(await D.setSettings({ activeEnv: $("envSelect").value }))));
  const acts = {
    new: async () => { state.reqTab = "params"; apply(await D.tpl.create()); setTimeout(() => { const u = $("tplUrl"); if (u) { u.focus(); u.select(); } }, 0); },
    curl: () => { $("curlText").value = ""; $("curlDialog").showModal(); $("curlText").focus(); },
    draft: () => { $("draftText").value = ""; $("draftDialog").showModal(); $("draftText").focus(); },
    import: async () => { const r = await D.importCollection(); if (!r.cancelled) { apply(r.state); toast(r.templates + " şablon, " + r.envs + " ortam içe aktarıldı (gizli değerler boş gelir)."); } },
    sample: async () => { busy("Örnek API başlatılıyor…"); const r = await D.sample(); busy(null); state.reqTab = "params"; apply(r.state); go("requests"); toast("Örnek API hazır (" + r.base + "). Şimdi Gönder'e basın."); },
  };
  document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", guard(acts[b.dataset.act])));
  $("curlCancel").addEventListener("click", () => $("curlDialog").close());
  // Yapıştırılan komut anahtar içerebilir: pencere kapanınca metin alanı her zaman boşaltılır (DOM'da sır kalmaz).
  $("curlDialog").addEventListener("close", () => { $("curlText").value = ""; });
  $("draftDialog").addEventListener("close", () => { $("draftText").value = ""; });
  $("mymindDialog").addEventListener("close", () => { $("mymindKey").value = ""; });
  $("curlRun").addEventListener("click", guard(async () => {
    const r = await D.importCurl($("curlText").value);
    $("curlDialog").close();
    state.reqTab = r.moved.length ? "headers" : "params";
    apply(r.state);
    go("requests");
    toast("Şablon oluşturuldu: " + r.name + (r.moved.length ? " · " + r.moved.length + " değer gizli değişkene taşındı (" + r.moved.join(", ") + ", ortam: " + r.env + ")" : "") + (r.ignored.length ? " · yok sayılan: " + r.ignored.join(" ") : ""));
  }));
  $("draftCancel").addEventListener("click", () => $("draftDialog").close());
  $("draftRun").addEventListener("click", guard(async () => {
    busy("MyMind taslak hazırlıyor…");
    const r = await D.ai.draft($("draftText").value);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    $("draftDialog").close();
    apply(r.state);
    go("requests");
    toast("Taslak şablon eklendi: " + r.name + (r.notes.length ? " · " + r.notes.join(" ") : ""));
  }));
  $("envNew").addEventListener("click", guard(async () => { const s = await D.env.create("Yeni ortam"); state.envSel = s.activeEnv; apply(s); }));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.exportCollection(); if (!r.cancelled) toast(r.templates + " şablon dışa aktarıldı: " + r.file + " (gizli değerler yazılmadı)."); }));
  $("setTimeout").addEventListener("change", guard(async () => apply(await D.setSettings({ timeoutSec: Number($("setTimeout").value) }))));
  $("setMax").addEventListener("change", guard(async () => apply(await D.setSettings({ maxBodyMB: Number($("setMax").value) }))));
  $("setUa").addEventListener("change", guard(async () => apply(await D.setSettings({ userAgent: $("setUa").checked }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bu oturum için bellekte tutuluyor."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && state.view === "requests" && state.s && state.s.detail) { e.preventDefault(); const u = $("tplUrl"); const p = u && u.value !== state.s.detail.url ? D.tpl.set(state.s.detail.id, { url: u.value }).then(apply) : Promise.resolve(); p.then(send); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && !document.querySelector("dialog[open]")) { e.preventDefault(); guard(acts.new)(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go("requests"); document.documentElement.dataset.ready = "1"; });
})();
