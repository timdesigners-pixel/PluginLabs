/* Notion Bridge — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya, dosya
 * sistemine ve anahtarlara doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.nbDesktop;
  const C = window.NBCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["drafts", "target", "history", "settings"];
  const state = { s: null, view: "drafts", hf: "kaydedildi", q: "", histSel: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
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
    setTimeout(() => t.remove(), 7000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const STATUS_TONE = { taslak: "accent", kaydedildi: "success", mukerrer: "warning", iptal: "" };
  const items = () => (state.s ? state.s.items : []);
  const schema = () => (state.s ? state.s.schema : null);
  const titleProp = () => (schema() ? schema().properties.find((p) => p.type === "title") : null);
  function titleOf(x) {
    const tp = titleProp();
    const v = tp && x.values[tp.name];
    return v ? String(v.value) : (x.input.title || x.input.text.split("\n")[0] || "(başlıksız)").slice(0, 120);
  }
  const showVal = (v) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "evet" : "hayır") : String(v));
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "drafts";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics, sc = s.schema;
    $("draftCount").textContent = String(m.drafts);
    $("savedCount").textContent = String(m.saved);
    $("targetState").textContent = sc ? (sc.source === "ornek" ? "Örnek" : "Bağlı") : "Yok";
    $("targetState").className = "pl-badge" + (sc && sc.source === "notion" ? " pl-badge--success" : sc ? " pl-badge--warning" : "");
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const accel = s.shortcut.accel.replace("CommandOrControl", s.platform === "darwin" ? "Cmd" : "Ctrl");
    $("shortcutInline").textContent = accel;
    $("shortcutName").textContent = accel;
    put($("sideInfo"), el("div", { class: "nb-mini__in" },
      el("span", { class: "pl-muted nb-small", text: "Şema uyumsuz kayıt" }),
      el("b", { class: m.remoteRejected ? "is-bad" : "is-ok", text: String(m.remoteRejected) }),
      el("span", { class: "pl-muted nb-small", text: m.saved + " kayıt · " + m.dupPrevented + " mükerrer önlendi" })));
    put($("targetChip"), icon("db", "16"), sc ? el("b", { text: sc.title }) : el("span", { class: "pl-muted", text: "Hedef seçilmedi" }), sc ? badge(sc.source === "ornek" ? "örnek şema" : "Notion", sc.source === "ornek" ? "warning" : "success") : null);
    if (state.view === "drafts") renderDrafts();
    if (state.view === "target") renderTarget();
    if (state.view === "history") renderHistory();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Taslaklar ----------------
  const drafts = () => items().filter((x) => x.status === "taslak");
  function listItem(x, selected, onOpen) {
    const filled = Object.keys(x.values).length;
    const li = el("li", { class: "nb-item" + (selected ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": selected ? "true" : "false" },
      el("span", {}),
      el("div", { class: "nb-item__body" },
        el("span", { class: "nb-ititle", text: titleOf(x) }),
        el("div", { class: "nb-imeta" }, badge(C.STATUS_NAMES[x.status], STATUS_TONE[x.status]), badge(filled + " alan"), x.notes.ambiguous.length ? badge(x.notes.ambiguous.length + " belirsiz", "warning") : null, x.ai ? badge("MyMind", "pro") : null),
        el("span", { class: "nb-src", text: (x.input.url ? C.hostOf(x.input.url) + " · " : "") + fmtWhen(x.savedAt || x.createdAt) })));
    li.addEventListener("click", guard(() => onOpen(x)));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
    return li;
  }
  function renderDrafts() {
    const list = drafts();
    const none = !items().length && !schema();
    $("emptyPanel").hidden = !none;
    $("draftSplit").hidden = none;
    if (none) return;
    $("draftInfo").textContent = list.length + " taslak" + (state.s.metrics.saved ? " · " + state.s.metrics.saved + " kaydedildi" : "");
    const act = state.s.active;
    put($("draftList"), ...(list.length ? list.map((x) => listItem(x, x.id === act, async (y) => apply(await D.item.open(y.id)))) : [el("li", { class: "nb-empty", text: "Taslak yok. “Yeni içerik”, “Panodan” ya da Ctrl+Alt+N ile ekleyin." })]));
    const x = list.find((i) => i.id === act) || null;
    put($("draftDetail"), x ? detail(x, true) : el("p", { class: "nb-empty", text: list.length ? "Soldan bir taslak seçin." : schema() ? "Hedef hazır: " + schema().title + ". İçerik ekleyin." : "Önce hedef veritabanını bağlayın." }));
  }

  function fromLine(v) {
    if (!v) return null;
    return el("div", { class: "nb-from" }, badge(C.FROM_NAMES[v.from] || v.from, v.from === "mymind" ? "pro" : v.from === "elle" ? "" : v.sure ? "success" : "accent"), v.evidence && v.evidence !== String(v.value) && !String(v.evidence).endsWith(String(v.value)) ? el("span", { text: v.evidence }) : null, !v.sure && v.from !== "elle" ? el("span", { text: "· tahmin — kontrol edin" }) : null);
  }
  function editor(x, p, live) {
    const v = x.values[p.name];
    const cur = v ? v.value : null;
    const commit = guard(async (raw) => { const r = await D.item.set(x.id, p.name, raw); apply(r.state); if (r.note) toast(p.name + ": " + r.note); });
    const lbl = "Alan: " + p.name;
    if (!live) return el("span", { class: "nb-why", text: cur == null ? "— boş —" : showVal(cur) });
    switch (p.type) {
      case "rich_text": { const t = el("textarea", { class: "pl-input", "aria-label": lbl, maxlength: "2000", rows: "2" }); t.value = cur || ""; t.addEventListener("change", () => commit(t.value)); return t; }
      case "date": { const i = el("input", { class: "pl-input", type: "date", "aria-label": lbl }); i.value = cur || ""; i.addEventListener("change", () => commit(i.value)); return i; }
      case "checkbox": {
        const sel = el("select", { class: "pl-input", "aria-label": lbl }, el("option", { value: "", text: "— boş —" }), el("option", { value: "evet", text: "Evet" }), el("option", { value: "hayır", text: "Hayır" }));
        sel.value = cur === true ? "evet" : cur === false ? "hayır" : "";
        sel.addEventListener("change", () => commit(sel.value)); return sel;
      }
      case "select": case "status": {
        const sel = el("select", { class: "pl-input", "aria-label": lbl }, el("option", { value: "", text: "— boş —" }), ...(p.options || []).map((o) => el("option", { value: o, text: o })));
        sel.value = cur || "";
        sel.addEventListener("change", () => commit(sel.value)); return sel;
      }
      case "multi_select": {
        const on = new Set(Array.isArray(cur) ? cur : []);
        const wrap = el("div", { class: "nb-chips", role: "group", "aria-label": lbl });
        for (const o of p.options || []) {
          const b = el("button", { type: "button", class: "nb-chip", "aria-pressed": on.has(o) ? "true" : "false", text: o });
          b.addEventListener("click", () => { if (on.has(o)) on.delete(o); else on.add(o); commit([...on]); });
          wrap.appendChild(b);
        }
        if (!(p.options || []).length) wrap.appendChild(el("span", { class: "nb-why", text: "Şemada seçenek yok — Notion'da seçenek eklenmeden değer yazılamaz." }));
        return wrap;
      }
      default: { const i = el("input", { class: "pl-input", "aria-label": lbl, maxlength: p.type === "title" ? "200" : "2000", spellcheck: "false", inputmode: p.type === "number" ? "decimal" : null }); i.value = cur == null ? "" : String(cur); i.addEventListener("change", () => commit(i.value)); return i; }
    }
  }
  function detail(x, live) {
    const sc = schema();
    const sameDb = sc && x.dbId === sc.id;
    const errors = live ? state.s.activeErrors : [];
    const errFor = (n) => errors.filter((e) => e.name === n);
    const ambFor = (n) => x.notes.ambiguous.filter((a) => a.name.split(" / ").includes(n));
    const failFor = (n) => x.notes.failed.filter((a) => a.name === n);
    const head = el("div", { class: "nb-dhead" },
      el("div", { class: "nb-row" }, badge(C.STATUS_NAMES[x.status], STATUS_TONE[x.status]), x.input.via ? badge({ metin: "Yapıştırma", pano: "Pano", dosya: "Dosya", ornek: "Örnek" }[x.input.via] || x.input.via) : null, el("span", { class: "pl-muted nb-small", text: fmtWhen(x.createdAt) })),
      el("h2", { class: "pl-h3 nb-h", text: titleOf(x) }));
    const quote = el("div", { class: "nb-block" }, el("span", { class: "nb-lbl", text: "İçerik" }), el("pre", { class: "nb-quote", text: x.input.text.length > 1600 ? x.input.text.slice(0, 1600) + "…" : x.input.text }),
      x.input.url ? el("div", { class: "nb-srcrow" }, icon("link", "16"), el("span", { class: "nb-src", text: x.input.url }), btn("Kaynağı aç", "pl-btn--ghost", async () => D.openLink(x.id, "kaynak"))) : null);
    const out = [head];
    if (x.status === "kaydedildi") out.push(el("div", { class: "nb-block nb-okbox" }, el("b", { text: "Notion'a kart olarak eklendi · " + fmtWhen(x.savedAt) }), x.pageUrl ? btn("Notion'da aç", "pl-btn--secondary", async () => D.openLink(x.id, "sayfa")) : null));
    if (x.status === "mukerrer" && x.dup) out.push(el("div", { class: "nb-block nb-errbox" }, el("b", { text: "Mükerrer — kaydedilmedi: " + x.dup.reason }), el("span", { class: "nb-hint", text: "Aynı kart ikinci kez eklenmez. Gerçekten farklı bir kayıtsa içeriği/başlığı düzenleyip taslağa geri alın." }),
      el("div", { class: "nb-row" }, x.dup.pageUrl ? btn("Mevcut kartı aç", "pl-btn--secondary", async () => D.openLink(x.id, "mukerrer")) : null, btn("Taslağa geri al", "pl-btn--ghost", async () => apply(await D.item.restore(x.id))))));
    if (x.status === "iptal") out.push(el("div", { class: "nb-block" }, el("span", { text: "Arşivlendi. Kayıt silinmez." }), el("div", { class: "nb-row" }, btn("Taslağa geri al", "pl-btn--ghost", async () => apply(await D.item.restore(x.id))))));
    out.push(quote);
    if (!sc) { out.push(el("p", { class: "nb-empty", text: "Hedef şema yok. Hedef ve şema bölümünden veritabanını bağlayın." })); return out.length ? frag(out) : null; }
    if (live && !sameDb) out.push(el("div", { class: "nb-block" }, el("span", { text: "Bu taslak başka bir şemayla eşlenmişti." }), btn("Bu şemaya göre yeniden eşle", "pl-btn--secondary", async () => apply(await D.item.remap(x.id)))));
    const rows = sc.properties.map((p) => {
      const v = x.values[p.name];
      const writable = C.writable(p);
      const why = [];
      for (const e of errFor(p.name)) why.push(el("span", { class: "nb-why is-err", text: "✕ " + e.reason }));
      if (!v) for (const a of ambFor(p.name)) why.push(el("span", { class: "nb-why is-warn", text: "Boş bırakıldı: " + a.reason }));
      for (const f of failFor(p.name)) why.push(el("span", { class: "nb-why is-warn", text: f.reason }));
      if (!writable) why.push(el("span", { class: "nb-why", text: (C.TYPE_NAMES[p.type] || p.type) + " — Notion Bridge bu alana yazmaz; boş kalır." }));
      return el("div", { class: "nb-prop" + (errFor(p.name).length ? " is-err" : "") + (writable ? "" : " is-ro"), "data-prop": p.name },
        el("div", { class: "nb-pname" }, el("b", { text: p.name }), badge(C.TYPE_NAMES[p.type] || p.type)),
        el("div", { class: "nb-pval" }, writable ? editor(x, p, live && x.status === "taslak") : null, fromLine(v), ...why));
    });
    out.push(el("div", { class: "nb-block" }, el("span", { class: "nb-lbl", text: "Taslak önizleme · " + sc.title }), el("div", { class: "nb-props", id: "propTable" }, ...rows)));
    const unk = x.notes.unknownKeys;
    if (unk.length) out.push(el("div", { class: "nb-block" }, el("span", { class: "nb-lbl", text: "Şemada olmayan — eklenmedi" }), el("ul", { class: "nb-notes" }, ...unk.map((k) => el("li", { text: (k.key === "#etiket" ? "" : "“" + k.key + "”: ") + k.value })))));
    if (x.ai) {
      const entries = Object.entries(x.ai.values);
      out.push(el("div", { class: "nb-block nb-block--ai", id: "aiBlock" },
        el("div", { class: "nb-row" }, icon("spark"), el("b", { text: "MyMind önerisi (şemaya göre denetlendi)" })),
        entries.length ? el("ul", { class: "nb-notes" }, ...entries.map(([k, v]) => el("li", { text: k + ": " + showVal(v.value) + (x.values[k] && JSON.stringify(x.values[k].value) !== JSON.stringify(v.value) ? " (taslakta: " + showVal(x.values[k].value) + ")" : "") }))) : el("span", { class: "nb-hint", text: "Geçerli öneri yok." }),
        x.ai.dropped ? el("div", { class: "nb-hint" }, el("b", { text: x.ai.dropped + " öğe atıldı: " }), x.ai.droppedList.join("; ")) : null,
        live && x.status === "taslak" && entries.length ? el("div", { class: "nb-row" }, btn("Boş alanlara uygula", "pl-btn--secondary", async () => { const r = await D.ai.apply(x.id, true); apply(r.state); toast(r.applied + " alan MyMind önerisinden dolduruldu."); }), btn("Tümünü uygula", "pl-btn--ghost", async () => { const r = await D.ai.apply(x.id, false); apply(r.state); toast(r.applied + " alan güncellendi."); })) : null));
    }
    if (live && x.status === "taslak") {
      if (errors.length) out.push(el("div", { class: "nb-block nb-errbox", id: "checkBox" }, el("b", { text: "Şemaya uymuyor — kaydedilemez" }), el("ul", { class: "nb-notes" }, ...errors.map((e) => el("li", { text: (e.name ? e.name + ": " : "") + e.reason })))));
      else out.push(el("div", { class: "nb-block nb-okbox", id: "checkBox" }, el("b", { text: "✓ Şemaya uygun — " + Object.keys(x.values).length + " alan gönderilecek, boş alanlar gönderilmez." })));
      const isSample = sc.source === "ornek";
      out.push(el("div", { class: "nb-actions" },
        btn("Notion'a kaydet", "pl-btn--primary", async () => {
          busy("Notion'a kaydediliyor…");
          const r = await D.item.save(x.id);
          busy(null);
          if (r.approved === false) return toast("Kaydedilmedi (onay verilmedi).");
          apply(r.state);
          if (r.duplicate) return toast("Mükerrer kayıt önlendi: " + r.reason + ".", true);
          toast("Notion'a yeni kart olarak eklendi.");
        }, { id: "saveBtn", disabled: errors.length || isSample ? true : null, title: isSample ? "Örnek şemayla kayıt yapılmaz; CSV ile aktarın." : null }),
        btn("MyMind ile eşle", "pl-btn--secondary", async () => {
          busy("MyMind eşliyor…");
          const r = await D.ai.map(x.id);
          busy(null);
          if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
          apply(r.state);
          toast("MyMind önerisi hazır: " + r.count + " alan" + (r.dropped ? "; " + r.dropped + " öğe denetimde atıldı" : "") + ".");
        }, { id: "aiBtn" }),
        btn("Yeniden eşle", "pl-btn--ghost", async () => { apply(await D.item.remap(x.id)); toast("Kurallarla yeniden eşlendi (elle girdikleriniz korundu)."); }),
        el("span", { class: "nb-grow" }),
        btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.item.archive(x.id)); toast("Taslak arşivlendi (silinmedi)."); }),
        isSample ? el("span", { class: "nb-hint", text: "Örnek şema: kayıt yerine CSV dışa aktarın." }) : null));
    }
    return frag(out);
  }
  function frag(list) { const f = document.createDocumentFragment(); for (const n of list) if (n) f.appendChild(n); return f; }

  // ---------------- Hedef ve şema ----------------
  function renderTarget() {
    const s = state.s, sc = s.schema;
    $("notionInfo").textContent = s.hasNotion ? "Kayıtlı bir anahtar var" + (s.vault ? " (Windows kasasında şifreli)." : " (yalnız bu oturum, bellekte).") : "Kayıtlı anahtar yok.";
    $("schemaTitle").textContent = sc ? "Şema · " + sc.title : "Şema";
    $("schemaMeta").textContent = sc ? (sc.source === "ornek" ? "örnek şema · " : "Notion'dan okundu · ") + fmtWhen(sc.fetchedAt) + " · " + sc.properties.filter(C.writable).length + "/" + sc.properties.length + " alan yazılabilir" : "";
    if (!sc) return put($("schemaBody"), el("p", { class: "pl-muted nb-small", text: "Henüz şema yok. Anahtarı kaydedip veritabanı bağlantısıyla “Şemayı oku”ya basın." }));
    const tbl = el("table", { class: "nb-schema", id: "schemaTable" },
      el("thead", {}, el("tr", {}, el("th", { text: "Alan" }), el("th", { text: "Tür" }), el("th", { text: "Seçenekler / not" }))),
      el("tbody", {}, ...sc.properties.map((p) => el("tr", {}, el("td", { text: p.name }), el("td", {}, badge(C.TYPE_NAMES[p.type] || p.type, C.writable(p) ? "" : "warning")),
        el("td", { text: p.options ? (p.options.length ? p.options.join(", ") : "seçenek yok") : C.writable(p) ? "" : "yazılmaz; taslakta boş kalır" })))));
    put($("schemaBody"), tbl, el("p", { class: "pl-muted nb-small", text: "Seçim, durum ve çoklu seçim alanlarına yalnız bu seçenekler yazılır; Notion Bridge yeni seçenek ya da yeni alan oluşturmaz. Notion'da şemayı değiştirirseniz “Şemayı oku” ile yenileyin." }));
  }

  // ---------------- Kayıtlar ----------------
  function renderHistory() {
    document.querySelectorAll("[data-hf]").forEach((b) => { b.setAttribute("aria-checked", b.dataset.hf === state.hf ? "true" : "false"); b.classList.toggle("is-active", b.dataset.hf === state.hf); });
    const q = C.fold(state.q || "");
    const list = items().filter((x) => x.status === state.hf && (!q || C.fold(titleOf(x) + " " + Object.values(x.values).map((v) => showVal(v.value)).join(" ")).includes(q)));
    if (!list.some((x) => x.id === state.histSel)) state.histSel = list[0] ? list[0].id : null;
    put($("histList"), ...(list.length ? list.map((x) => listItem(x, x.id === state.histSel, (y) => { state.histSel = y.id; renderHistory(); })) : [el("li", { class: "nb-empty", text: { kaydedildi: "Henüz Notion'a kaydedilen kart yok.", mukerrer: "Önlenen mükerrer kayıt yok.", iptal: "Arşiv boş." }[state.hf] })]));
    const x = list.find((i) => i.id === state.histSel);
    put($("histDetail"), x ? detail(x, false) : el("p", { class: "nb-empty", text: "Kayıt seçin." }));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(String(m.remoteRejected), "şema uyumsuz kayıt (hedef 0)", m.remoteRejected ? "is-bad" : "is-ok"),
      card(String(m.saved), "Notion'a eklenen kart", m.saved ? "is-ok" : ""),
      card(String(m.dupPrevented), "önlenen mükerrer kayıt"),
      card(String(m.blocked), "kayıttan önce yakalanan uyumsuz taslak"),
      card(pctText(m.autoFillRate), "kaydedilen alanlarda otomatik dolan"),
      card(String(m.drafts), "bekleyen taslak"),
      card(String(m.aiRuns), "MyMind eşlemesi"),
      card(String(m.aiDropped), "MyMind'dan atılan öğe (uydurma alan/seçenek)", m.aiDropped ? "is-bad" : ""));
    const g = s.gold;
    $("goldInfo").textContent = g ? "Örnek içeriklerde (elle etiketli " + g.fields + " alan): kural tabanlı eşleme doğruluğu " + pctText(g.accuracy) + ", şemada karşılığı olmayan uydurma alan " + g.inventions + ". Gerçek içeriklerinizde ölçülmemiştir." : "";
    $("setShortcut").checked = s.settings.shortcut;
    $("shortcutState").textContent = s.settings.shortcut ? (s.shortcut.ok ? "(etkin)" : "(bu oturumda kaydedilemedi — başka bir uygulama kullanıyor olabilir)") : "";
    $("setRemoteDup").checked = s.settings.remoteDupCheck;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Taslaklar, şema, kayıt defteri, Notion anahtarı ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: taslaklar düz JSON olarak saklanır, anahtarlar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  function openCapture() {
    $("capText").value = ""; $("capTitle").value = ""; $("capUrl").value = "";
    $("capDialog").showModal();
    $("capText").focus();
  }
  const capResult = (r, what) => toast("Yeni taslak: " + r.filled + " alan eşlendi" + (what ? " (" + what + ")" : "") + ". Kaydetmeden önce önizleyin.");
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", openCapture));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); apply(r.state); go("drafts"); capResult(r, "panodan"); })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    apply(r.state); go("drafts");
    toast(r.added + " dosyadan taslak oluşturuldu" + (r.skipped ? " · " + r.skipped + " dosya atlandı (boş, 2 MB üstü ya da .txt/.md değil)" : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.sample(); apply(r.state); go("drafts"); toast(r.added + " örnek içerik örnek şemaya eşlendi."); })));
  document.querySelectorAll("[data-nav-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.navGo)));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const text = $("capText").value;
    if (!text.trim() && !$("capUrl").value.trim()) return toast("Eşlenecek içeriği yapıştırın.", true);
    const r = await D.capture.text(text, { title: $("capTitle").value, url: $("capUrl").value.trim() });
    $("capDialog").close();
    apply(r.state); go("drafts"); capResult(r);
  }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-hf]").forEach((b) => b.addEventListener("click", () => { state.hf = b.dataset.hf; state.histSel = null; renderHistory(); }));
  $("q").addEventListener("input", () => { state.q = $("q").value; renderHistory(); });
  $("notionSave").addEventListener("click", guard(async () => { const r = await D.target.setToken($("notionKey").value); $("notionKey").value = ""; toast(r.stored === "vault" ? "Notion anahtarı Windows kasasına kaydedildi." : "Notion anahtarı yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("notionForget").addEventListener("click", guard(async () => { await D.target.setToken(null); toast("Notion anahtarı kaldırıldı."); apply(await D.state()); }));
  $("dbFetch").addEventListener("click", guard(async () => {
    busy("Şema okunuyor…");
    const r = await D.target.fetch($("dbInput").value);
    busy(null);
    if (!r.approved) return toast("Şema okunmadı (onay verilmedi).");
    apply(r.state);
    toast("“" + r.title + "” şeması okundu: " + r.writable + "/" + r.props + " alan yazılabilir" + (r.remapped ? "; " + r.remapped + " taslak yeniden eşlendi" : "") + ".");
  }));
  $("useSample").addEventListener("click", guard(async () => { const r = await D.target.useSample(); apply(r.state); toast("Örnek şema seçildi" + (r.remapped ? "; " + r.remapped + " taslak yeniden eşlendi" : "") + "."); }));
  $("setShortcut").addEventListener("change", guard(async () => { apply(await D.setSettings({ shortcut: $("setShortcut").checked })); toast($("setShortcut").checked ? "Genel kısayol açıldı." : "Genel kısayol kapatıldı."); }));
  $("setRemoteDup").addEventListener("change", guard(async () => apply(await D.setSettings({ remoteDupCheck: $("setRemoteDup").checked }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  const exp = (fn, what) => guard(async () => { const r = await fn(); if (r.cancelled) return; toast("“" + r.file + "” kaydedildi" + (r.count != null ? " (" + r.count + " " + what + (r.skipped ? "; şemaya uymayan " + r.skipped + " atlandı" : "") + ")" : "") + "."); });
  $("csvBtn").addEventListener("click", exp(D.exportCsv, "satır"));
  $("mdBtn").addEventListener("click", exp(D.exportMd, "kayıt"));
  $("backupBtn").addEventListener("click", exp(D.backup, ""));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
    if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); openCapture(); }
    else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") { e.preventDefault(); document.querySelector('[data-act="clipboard"]').click(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go(s.schema || s.items.length ? "drafts" : "drafts"); document.documentElement.dataset.ready = "1"; });
})();
