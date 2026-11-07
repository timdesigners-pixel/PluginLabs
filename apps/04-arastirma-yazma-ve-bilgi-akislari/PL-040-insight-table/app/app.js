/* Insight Table — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya, dosya
 * sistemine ve anahtarlara doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.itDesktop;
  const C = window.ITCore;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, view: "tables", q: "" };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
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
  const TONE = { bad: "danger", warn: "warning", info: "" };
  const FROM = { kaynak: "kaynak başlığı", kural: "kural", elle: "elle", mymind: "MyMind" };
  const tables = () => (state.s ? state.s.tables : []);
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = ["tables", "archive", "settings"].includes(view) ? view : "tables";
    $("view-tables").hidden = state.view === "settings";
    $("view-settings").hidden = state.view !== "settings";
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("tableCount").textContent = String(m.tables);
    $("archiveCount").textContent = String(m.archived);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const accel = s.shortcut.accel.replace("CommandOrControl", s.platform === "darwin" ? "Cmd" : "Ctrl");
    $("shortcutInline").textContent = accel;
    $("shortcutName").textContent = accel;
    $("footer").textContent = "Insight Table " + s.version + " · PluginLabs · hücre uydurulmaz · eksik doldurulmaz · CSV enjeksiyonuna karşı güvenli · yapay zekâ isteğe bağlı";
    const g = s.gold;
    put($("sideInfo"), el("div", { class: "it-mini__in" },
      el("span", { class: "pl-muted it-small", text: "CSV gidiş-dönüş farkı" }),
      el("b", { class: m.mismatch ? "is-bad" : "is-ok", text: String(m.mismatch) }),
      el("span", { class: "pl-muted it-small", text: m.exports + " dışa aktarma · " + m.neutralized + " formül etkisiz" + (g ? " · örnek doğruluk " + pctText(g.accuracy) : "") })));
    const st = s.settings;
    put($("fmtChip"), el("span", { text: "CSV" }), el("b", { text: st.csvDelimiter === "\t" ? "sekme" : st.csvDelimiter }), el("span", { text: "ondalık" }), el("b", { text: st.csvDecimal }), st.bom ? el("b", { text: "BOM" }) : null, st.sourceTrail ? el("span", { text: "· kaynak izi" }) : null);
    if (state.view === "settings") renderSettings();
    else renderTables();
  }

  // ---------------- Tablolar ----------------
  function listItem(t, selected) {
    const sm = t.sum || { rows: 0, cols: 0, flagged: 0 };
    const li = el("li", { class: "it-item" + (selected ? " is-sel" : ""), "data-id": t.id, role: "option", tabindex: "0", "aria-selected": selected ? "true" : "false" },
      el("span", {}),
      el("div", { class: "it-item__body" },
        el("span", { class: "it-ititle", text: t.name }),
        el("div", { class: "it-imeta" }, badge(sm.rows + " × " + sm.cols), sm.flagged ? badge(sm.flagged + " uyarı", "warning") : badge("uyarı yok", "success"), sm.pii ? badge(sm.pii + " kişisel", "danger") : null, t.ai ? badge("MyMind", "pro") : null, t.exports ? badge(t.exports + " çıktı") : null),
        el("span", { class: "it-src", text: [C.KIND_NAMES[t.origin.kind], t.source.url ? C.hostOf(t.source.url) : t.source.file, fmtWhen(t.createdAt)].filter(Boolean).join(" · ") })));
    li.addEventListener("click", guard(async () => apply(await D.table.open(t.id))));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
    return li;
  }
  function renderTables() {
    const arch = state.view === "archive";
    const want = arch ? "arsiv" : "aktif";
    const q = C.fold(state.q || "");
    const list = tables().filter((t) => t.status === want && (!q || C.fold(t.name + " " + (t.source.url || "") + " " + (t.source.file || "")).includes(q)));
    const none = !tables().length;
    $("emptyPanel").hidden = !none || arch;
    $("tableSplit").hidden = none && !arch;
    if (none && !arch) return;
    $("listInfo").textContent = list.length + (arch ? " arşivde" : " tablo");
    const a = state.s.active;
    put($("tableList"), ...(list.length ? list.map((t) => listItem(t, a && t.id === a.id)) : [el("li", { class: "it-empty", text: arch ? "Arşiv boş." : "Tablo yok. Sayfada tabloyu seçip kopyalayın ve “Panodan tablo”ya basın." })]));
    const show = a && a.status === want ? a : null;
    put($("tableDetail"), show ? detail(show) : el("p", { class: "it-empty", text: list.length ? "Soldan bir tablo seçin." : arch ? "Arşivlenen tablolar burada görünür; silinmez." : "" }));
  }

  function colHead(a, c, live) {
    const flagsIn = a.flags.filter((f) => f.col === c.i && C.FLAG_TONE[f.code] !== "info").length;
    const name = el("input", { class: "pl-input", "aria-label": "Sütun " + (c.i + 1) + " adı", maxlength: "60", spellcheck: "false", "data-col-name": String(c.i), disabled: live ? null : true });
    name.value = c.name;
    name.addEventListener("change", guard(async () => apply(await D.table.col(a.id, c.i, { name: name.value }))));
    const inc = el("input", { type: "checkbox", "aria-label": "Sütun " + (c.i + 1) + " dışa aktarılsın", "data-col-inc": String(c.i), disabled: live ? null : true });
    inc.checked = c.include;
    inc.addEventListener("change", guard(async () => apply(await D.table.col(a.id, c.i, { include: inc.checked }))));
    const type = el("select", { class: "pl-input", "aria-label": "Sütun " + (c.i + 1) + " türü", "data-col-type": String(c.i), disabled: live ? null : true },
      el("option", { value: "oto", text: "Otomatik: " + C.TYPE_NAMES[c.auto] }), ...C.TYPES.map((t) => el("option", { value: t, text: C.TYPE_NAMES[t] })));
    type.value = c.forced ? c.type : "oto";
    type.addEventListener("change", guard(async () => apply(await D.table.col(a.id, c.i, { type: type.value }))));
    const meta = el("div", { class: "it-colmeta" },
      C.NUMERIC.includes(c.type) ? badge(c.locale === "tr" ? "1.234,5" : "1,234.5", "", "Sayı biçimi (sütundaki kanıta göre)") : null,
      c.type === "tarih" ? badge(c.dateOrder === "mdy" ? "AA/GG" : "GG.AA", "", "Tarih sırası") : null,
      c.unit ? badge(c.unit) : null,
      c.pii ? badge(C.PII_NAMES[c.pii] + " · " + { maske: "maskelenir", cikar: "çıkarılır", koru: "olduğu gibi" }[c.piiAction], c.piiAction === "koru" ? "danger" : "warning") : null,
      el("span", { text: c.stats.filled + " dolu" + (c.stats.bad ? " · " + c.stats.bad + " uyumsuz" : "") + (flagsIn && !c.stats.bad ? " · " + flagsIn + " uyarı" : "") }),
      c.nameFrom === "mymind" || c.nameFrom === "elle" ? el("span", { text: "· ad: " + FROM[c.nameFrom] }) : c.src && c.src !== c.name ? el("span", { text: "· kaynak: " + c.src }) : null);
    return el("th", { class: c.include ? "" : "is-off", scope: "col" }, el("div", { class: "it-colhead" }, el("div", { class: "it-colhead__top" }, inc, name), type, meta));
  }
  function showVal(c, col) {
    if (c.flag === "eksik") return "";
    if (c.flag === "isaret") return c.raw;
    if (!c.ok || c.v == null) return c.raw;
    if (typeof c.v === "boolean") return c.v ? "evet" : "hayır";
    return String(c.v);
  }
  function grid(a) {
    const flagAt = new Map();
    for (const f of a.flags) if (f.col >= 0) { const k = f.row + ":" + f.col; if (!flagAt.has(k) || C.FLAG_TONE[f.code] === "bad") flagAt.set(k, f); }
    const live = a.status === "aktif";
    const head = el("tr", {}, el("th", { class: "it-rn", scope: "col", title: "Kaynak satır numarası", text: "#" }), ...a.columns.map((c) => colHead(a, c, live)));
    const rows = a.rows.map((r, ri) => el("tr", { class: r.dup ? "is-dup" : "", title: r.dup ? "Mükerrer satır" : null },
      el("td", { class: "it-rn", text: String(r.src) }),
      ...r.cells.map((c, ci) => {
        const col = a.columns[ci];
        const f = flagAt.get(ri + ":" + ci);
        const tone = f ? C.FLAG_TONE[f.code] : "";
        const cls = [col.include ? "" : "is-off", tone ? "is-" + tone : "", c.flag === "eksik" ? "is-empty" : "", C.NUMERIC.includes(col.type) && c.ok && c.v != null ? "is-num" : ""].filter(Boolean).join(" ");
        const title = [f ? f.reason : "", c.raw && String(c.v) !== c.raw ? "Kaynak: " + c.raw : ""].filter(Boolean).join("\n");
        return el("td", { class: cls, title: title || null, "data-cell": ri + ":" + ci, text: showVal(c, col) || (c.flag === "eksik" ? "boş" : "") });
      })));
    return el("div", { class: "it-gridwrap", id: "gridWrap" }, el("table", { class: "it-grid", id: "previewGrid" }, el("thead", {}, head), el("tbody", {}, ...rows)));
  }
  function detail(a) {
    const live = a.status === "aktif";
    const sm = a.summary;
    const out = [];
    const nameIn = el("input", { class: "pl-input it-name", id: "tableName", "aria-label": "Tablo adı", maxlength: "120", disabled: live ? null : true });
    nameIn.value = a.name;
    nameIn.addEventListener("change", guard(async () => apply(await D.table.rename(a.id, nameIn.value))));
    out.push(el("div", { class: "it-dhead" },
      el("div", { class: "it-row" }, badge(C.KIND_NAMES[a.origin.kind], "accent"), badge(C.VIA_NAMES[a.source.via] || a.source.via), a.origin.total > 1 ? badge("kaynakta " + a.origin.index + "/" + a.origin.total) : null, a.origin.truncated ? badge("ilk 5000 satır", "warning") : null, el("span", { class: "pl-muted it-small", text: fmtWhen(a.createdAt) })),
      el("div", { class: "it-row" }, nameIn),
      a.source.url || a.source.file ? el("div", { class: "it-srcrow" }, icon("link", "16"), el("span", { class: "it-src", text: a.source.url || a.source.file }), a.source.url ? btn("Kaynağı aç", "pl-btn--ghost", async () => D.openSource(a.id)) : null) : null));
    if (!live) out.push(el("div", { class: "it-block" }, el("span", { text: "Arşivde. Tablo silinmez; geri alınca düzenlenebilir." }), el("div", { class: "it-row" }, btn("Geri al", "pl-btn--secondary", async () => { apply(await D.table.restore(a.id)); go("tables"); toast("Tablo geri alındı."); }))));
    const hdr = el("input", { type: "checkbox", id: "headerToggle", disabled: live ? null : true });
    hdr.checked = a.headerRows > 0;
    hdr.addEventListener("change", guard(async () => apply(await D.table.header(a.id, hdr.checked ? 1 : 0))));
    const stat = (v, label, cls) => el("div", { class: "it-stat" }, el("b", { class: cls || "", text: String(v) }), el("span", { text: label }));
    out.push(el("div", { class: "it-row" },
      el("div", { class: "it-stats" }, stat(sm.rows, "satır"), stat(sm.cols, "sütun"), stat(sm.typed, "türlü sütun"), stat(sm.flagged, "uyarılı hücre", sm.flagged ? "is-bad" : "is-ok"), stat(sm.bad, "türüne uymayan", sm.bad ? "is-bad" : "is-ok"), stat(sm.dupRows, "mükerrer satır", sm.dupRows ? "is-bad" : "")),
      el("span", { class: "it-grow" }),
      el("label", { class: "it-check it-check--inline" }, hdr, el("span", { text: "İlk satır başlık" + (a.headerRows > 1 ? " (" + a.headerRows + " satır)" : "") }))));
    out.push(el("div", { class: "it-block" },
      el("div", { class: "it-bar" }, el("span", { class: "it-lbl", text: "Sütun önizlemesi" + (a.more ? " · ilk " + a.rows.length + " satır (+" + a.more + ")" : "") }), el("span", { class: "it-grow" }),
        el("div", { class: "it-legend" }, el("span", { class: "l-bad", text: "türüne uymuyor" }), el("span", { class: "l-warn", text: "eksik / farklı birim·ayraç / mükerrer" }), el("span", { class: "l-info", text: "boş işareti / birleştirilmiş" }))),
      grid(a),
      el("span", { class: "it-hint", text: "Hücreler dışa aktarılacak değeri gösterir (sayı nokta ondalıklı, tarih YYYY-AA-GG); kaynaktaki metin için hücrenin üzerine gelin. Kutucuğu kapalı sütun dışa aktarılmaz." })));
    // Uyarılar
    const real = a.flags.filter((f) => C.FLAG_TONE[f.code] !== "info");
    const counts = {};
    for (const f of a.flags) counts[f.code] = (counts[f.code] || 0) + 1;
    out.push(el("div", { class: "it-block", id: "flagBlock" },
      el("div", { class: "it-bar" }, el("span", { class: "it-lbl", text: "Uyarılar (" + real.length + ")" }), el("span", { class: "it-grow" }), el("div", { class: "it-flagsum" }, ...Object.entries(counts).map(([k, n]) => badge(C.FLAG_NAMES[k] + ": " + n, TONE[C.FLAG_TONE[k]])))),
      a.flags.length ? el("ul", { class: "it-flaglist" }, ...a.flags.slice(0, 80).map((f) => el("li", {}, el("span", { text: "satır " + f.src + (f.col >= 0 ? " · " + (f.col + 1) : "") }), el("span", { text: (f.col >= 0 ? a.columns[f.col].name + ": " : "") + f.reason })))) : el("span", { class: "it-hint", text: "Uyarı yok: her hücre sütun türüne uyuyor." }),
      a.flagCount > 80 ? el("span", { class: "it-hint", text: "+" + (a.flagCount - 80) + " uyarı daha (JSON çıktısının “uyarilar” bölümünde)." }) : null));
    // Kişisel veri
    const pii = a.columns.filter((c) => c.pii);
    if (pii.length) out.push(el("div", { class: "it-block", id: "piiBlock" },
      el("div", { class: "it-row" }, icon("lock", "16"), el("span", { class: "it-lbl", text: "Kişisel veri sütunları" })),
      ...pii.map((c) => {
        const sel = el("select", { class: "pl-input", "aria-label": c.name + " için kişisel veri işlemi", "data-pii": String(c.i), disabled: live ? null : true }, el("option", { value: "maske", text: "Maskele (ör. " + C.maskValue(c.pii, sampleOf(a, c)) + ")" }), el("option", { value: "cikar", text: "Dışa aktarmadan çıkar" }), el("option", { value: "koru", text: "Olduğu gibi aktar" }));
        sel.value = c.piiAction;
        sel.addEventListener("change", guard(async () => apply(await D.table.col(a.id, c.i, { pii: sel.value }))));
        return el("div", { class: "it-piirow" }, el("b", { text: c.name }), badge(C.PII_NAMES[c.pii]), sel);
      }),
      el("span", { class: "it-hint", text: "Önizlemede gerçek değerler görünür (yalnız bu bilgisayarda); dışa aktarma ve MyMind isteği seçtiğiniz işleme göre yapılır." })));
    // MyMind
    if (a.ai) {
      out.push(el("div", { class: "it-block it-block--ai", id: "aiBlock" },
        el("div", { class: "it-row" }, icon("spark"), el("b", { text: "MyMind önerisi (denetlendi) · " + fmtWhen(a.ai.at) })),
        a.ai.names.length ? el("ul", { class: "it-notes" }, ...a.ai.names.map((n) => el("li", { text: (a.columns[n.col] ? a.columns[n.col].name : "Sütun " + (n.col + 1)) + " → " + n.name }))) : el("span", { class: "it-hint", text: "Uygulanacak ad önerisi yok." }),
        a.ai.flags.length ? el("span", { class: "it-hint", text: a.ai.flags.length + " hücre MyMind tarafından işaretlendi (uyarılar listesinde “MyMind işareti”). Hücre değerleri değiştirilmedi." }) : null,
        a.ai.dropped ? el("div", { class: "it-hint" }, el("b", { text: a.ai.dropped + " öğe atıldı" + (a.ai.cellBlocked ? " (" + a.ai.cellBlocked + " hücre değeri önerisi)" : "") + ": " }), a.ai.droppedList.join("; ")) : null,
        live && a.ai.names.length ? el("div", { class: "it-row" }, btn("Ad önerilerini uygula", "pl-btn--secondary", async () => { const r = await D.ai.apply(a.id); apply(r.state); toast(r.applied + " sütun adı MyMind önerisiyle güncellendi."); }, { id: "aiApply" })) : null));
    }
    if (live) out.push(el("div", { class: "it-actions" },
      btn("CSV olarak kaydet", "pl-btn--primary", async () => {
        const r = await D.exportCsv(a.id);
        if (r.cancelled) return;
        apply(r.state);
        toast("“" + r.file + "” kaydedildi: " + r.rows + " satır × " + r.cols + " sütun" + (r.neutralized ? " · " + r.neutralized + " formül etkisizleştirildi" : "") + (r.masked ? " · " + r.masked + " kişisel değer maskelendi" : "") + " · gidiş-dönüş farkı " + r.mismatch + ".", r.mismatch > 0);
      }, { id: "csvBtn" }),
      btn("JSON olarak kaydet", "pl-btn--secondary", async () => {
        const r = await D.exportJson(a.id);
        if (r.cancelled) return;
        apply(r.state);
        toast("“" + r.file + "” kaydedildi: " + r.rows + " satır" + (r.masked ? " · " + r.masked + " kişisel değer maskelendi" : "") + ".");
      }, { id: "jsonBtn" }),
      btn("MyMind ile denetle", "pl-btn--secondary", async () => {
        busy("MyMind denetliyor…");
        const r = await D.ai.check(a.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind: " + r.names + " ad önerisi, " + r.flags + " işaret" + (r.dropped ? "; " + r.dropped + " öğe denetimde atıldı" : "") + ".");
      }, { id: "aiBtn" }),
      el("span", { class: "it-grow" }),
      btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.table.archive(a.id)); toast("Tablo arşivlendi (silinmedi)."); })));
    const f = document.createDocumentFragment();
    for (const n of out) if (n) f.appendChild(n);
    return f;
  }
  function sampleOf(a, c) { const r = a.rows.find((x) => x.cells[c.i].raw.trim() && x.cells[c.i].flag !== "isaret"); return r ? r.cells[c.i].raw : ""; }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics, st = s.settings;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    const g = s.gold;
    put($("metrics"),
      card(g ? pctText(g.accuracy) : "—", "örnek tablolarda hücre doğruluğu (hedef ≥ %99)", g ? (g.accuracy >= 99 ? "is-ok" : "is-bad") : ""),
      card(String(m.mismatch), "CSV gidiş-dönüş farkı (hedef 0)", m.mismatch ? "is-bad" : "is-ok"),
      card(String(m.neutralized), "etkisizleştirilen formül hücresi"),
      card(String(m.exports), "dışa aktarma (" + m.csv + " CSV · " + m.json + " JSON)"),
      card(String(m.tables), "tablo · " + m.cells + " hücre"),
      card(String(m.flagged), "uyarılı hücre (etkin tablolar)"),
      card(String(m.masked), "maskelenen kişisel değer"),
      card(String(m.aiDropped), "MyMind'dan atılan öğe" + (m.aiCellBlocked ? " (" + m.aiCellBlocked + " hücre değeri önerisi)" : ""), m.aiDropped ? "is-bad" : ""));
    $("goldInfo").textContent = g ? "Örnek tablolarda (elle etiketli " + g.cells + " hücre: TR/EN sayı biçimi, para birimi, yüzde, tarih, evet/hayır, rowspan/colspan, boş işareti, hatalı değer): " + g.ok + "/" + g.cells + " hücre beklenen değerle aynı. Gerçek sayfalarınızda ölçülmemiştir." : "Örnek tablolarla deneyince elle etiketli hücrelerde doğruluk burada görünür.";
    const radio = (name, v) => document.querySelectorAll('input[name="' + name + '"]').forEach((r) => { r.checked = r.value === v; });
    radio("csvDelimiter", st.csvDelimiter === "\t" ? "tab" : st.csvDelimiter);
    radio("csvDecimal", st.csvDecimal);
    document.querySelector('input[name="csvDecimal"][value=","]').disabled = st.csvDelimiter === ",";
    radio("badCells", st.badCells); radio("jsonKeys", st.jsonKeys); radio("locale", st.locale); radio("piiDefault", st.piiDefault); radio("provider", st.provider);
    $("setBom").checked = st.bom; $("setTrail").checked = st.sourceTrail; $("setPiiText").checked = st.piiInText; $("setShortcut").checked = st.shortcut;
    $("shortcutState").textContent = st.shortcut ? (s.shortcut.ok ? "(etkin)" : "(bu oturumda kaydedilemedi — başka bir uygulama kullanıyor olabilir)") : "";
    $("localBox").hidden = st.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = st.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = st.localModel;
    $("vaultInfo").textContent = s.vault ? "Tablolar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: tablolar düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  const set = (patch) => guard(async () => apply(await D.setSettings(patch)));
  document.querySelectorAll('input[name="csvDelimiter"]').forEach((r) => r.addEventListener("change", () => set({ csvDelimiter: r.value === "tab" ? "\t" : r.value })()));
  document.querySelectorAll('input[name="csvDecimal"]').forEach((r) => r.addEventListener("change", () => set({ csvDecimal: r.value })()));
  for (const name of ["badCells", "jsonKeys", "locale", "piiDefault", "provider"]) document.querySelectorAll('input[name="' + name + '"]').forEach((r) => r.addEventListener("change", () => set({ [name]: r.value })()));
  $("setBom").addEventListener("change", () => set({ bom: $("setBom").checked })());
  $("setTrail").addEventListener("change", () => set({ sourceTrail: $("setTrail").checked })());
  $("setPiiText").addEventListener("change", () => set({ piiInText: $("setPiiText").checked })());
  $("setShortcut").addEventListener("change", guard(async () => { apply(await D.setSettings({ shortcut: $("setShortcut").checked })); toast($("setShortcut").checked ? "Genel kısayol açıldı." : "Genel kısayol kapatıldı."); }));
  $("presetExcel").addEventListener("click", guard(async () => { apply(await D.setSettings({ csvDelimiter: ";", csvDecimal: ",", bom: true })); toast("Excel (Türkçe): ayraç ; · ondalık , · UTF-8 BOM."); }));
  $("presetStd").addEventListener("click", guard(async () => { apply(await D.setSettings({ csvDelimiter: ",", csvDecimal: ".", bom: false })); toast("Standart CSV: ayraç , · ondalık . · BOM yok."); }));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.backup(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi."); }));

  function openPaste() { $("pasteText").value = ""; $("pasteUrl").value = ""; $("pasteName").value = ""; $("pasteDialog").showModal(); $("pasteText").focus(); }
  document.querySelectorAll('[data-act="paste"]').forEach((b) => b.addEventListener("click", openPaste));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); apply(r.state); go("tables"); toast("Panodan: " + r.text + "."); })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    apply(r.state); go("tables");
    toast(r.added + " tablo alındı" + (r.skipped ? " · " + r.skipped + " dosya atlandı (boş, 5 MB üstü ya da desteklenmeyen tür)" : "") + (r.empty ? " · " + r.empty + " dosyada tablo bulunamadı" : "") + ".", !r.added);
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.sample(); apply(r.state); go("tables"); toast(r.added + " örnek tablo eklendi (uydurma veriler)."); })));
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteRun").addEventListener("click", guard(async () => {
    const text = $("pasteText").value;
    if (!text.trim()) return toast("Tablo içeren metni yapıştırın.", true);
    const r = await D.capture.text(text, { url: $("pasteUrl").value.trim(), title: $("pasteName").value });
    $("pasteDialog").close();
    apply(r.state); go("tables"); toast("Yeni: " + r.text + ".");
  }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  $("q").addEventListener("input", () => { state.q = $("q").value; renderTables(); });
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") { e.preventDefault(); document.querySelector('[data-act="clipboard"]').click(); }
    else if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); openPaste(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go("tables"); document.documentElement.dataset.ready = "1"; }).catch((e) => { console.error("Başlatma hatası: " + (e && e.stack ? e.stack : e)); toast(clean(e), true); });
})();
