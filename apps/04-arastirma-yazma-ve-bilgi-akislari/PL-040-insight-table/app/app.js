/* Insight Table — arayüz mantığı (yalnız textContent / güvenli DOM oluşturma, untrusted innerHTML yok). */
(function () {
  const D = window.itDesktop;
  const C = window.ITCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["workspace", "trace", "settings"];
  const state = { s: null, view: "workspace", tf: "all" };

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
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function toast(message, isError) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, el("div", { class: "pl-toast__body", text: message }));
    if (isError) t.style.setProperty("--pl-c", "var(--pl-danger)");
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), 6000);
  }
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };

  function activeTable() {
    const s = state.s;
    if (!s || !s.tables.length) return null;
    return s.tables.find((t) => t.id === s.active) || s.tables[0];
  }
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "workspace";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.nav === state.view);
      b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false");
    });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    const cur = activeTable();
    $("tableCount").textContent = String(s.tables.length);
    $("issueCount").textContent = String(cur ? (cur.stats.missingCells + cur.stats.anomalyCells) : 0);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "it-mini__in" },
      el("span", { class: "pl-muted it-small", text: "Kaynağa göre hücre doğruluğu" }),
      el("b", { text: "%" + String(m.cellAccuracy).replace(".", ",") }),
      el("span", { class: "pl-muted it-small", text: m.totalCells + " hücre · kaynaksız tamamlama: 0" }),
      el("span", { class: "pl-muted it-small", text: m.missing + " eksik · " + m.anomaly + " şüpheli · " + m.pii + " PII" })));
    const any = s.tables.length > 0;
    $("emptyPanel").hidden = any;
    $("workSplit").hidden = !any;
    if (state.view === "workspace") renderWorkspace();
    if (state.view === "trace") renderTrace();
    if (state.view === "settings") renderSettings();
  }

  function renderWorkspace() {
    const s = state.s;
    const cur = activeTable();
    $("listSummary").textContent = s.tables.length + " tablo";
    const ul = $("tableList");
    put(ul, ...s.tables.map((t) => {
      const li = el("li", { class: "it-item" + (cur && cur.id === t.id ? " is-sel" : ""), "data-id": t.id, role: "option", "aria-selected": cur && cur.id === t.id ? "true" : "false" },
        el("b", { class: "it-small", text: t.title }),
        el("div", { class: "it-row" },
          badge(C.FORMAT_NAMES[t.format] || t.format, "info"),
          badge(t.stats.rowCount + "×" + t.stats.colCount, ""),
          (t.stats.missingCells + t.stats.anomalyCells) ? badge((t.stats.missingCells + t.stats.anomalyCells) + " uyarı", "warning") : badge("temiz", "success")));
      li.addEventListener("click", guard(async () => apply(await D.table.open(t.id))));
      return li;
    }));
    const detail = $("tableDetail");
    if (!cur) { put(detail, el("p", { class: "pl-muted it-small", text: "Tablo seçin." })); return; }
    const maskOn = $("maskPiiToggle").checked;
    const headRow = el("div", { class: "it-bar" },
      el("h2", { class: "pl-h3 it-h", text: cur.title }),
      badge(C.FORMAT_NAMES[cur.format] || cur.format, "info"),
      badge("Hücre doğruluğu %" + cur.stats.cellAccuracy, "success"),
      cur.stats.missingCells ? badge(cur.stats.missingCells + " eksik hücre (boş bırakıldı)", "warning") : null,
      cur.stats.anomalyCells ? badge(cur.stats.anomalyCells + " tip uyuşmazlığı", "danger") : null,
      cur.stats.piiCells ? badge(cur.stats.piiCells + " PII hücre", "accent") : null,
      el("span", { class: "it-grow" }),
      cur.sourceUrl ? btn("Kaynağı aç", "pl-btn--ghost", async () => { const r = await D.openSource(cur.id); toast("Tarayıcıda açıldı: " + C.hostOf(r.opened)); }, { id: "openSourceBtn" }) : null,
      btn("MyMind ile sütunları normalleştir", "pl-btn--secondary", async () => {
        busy("MyMind sütunları inceliyor…");
        const r = await D.ai.normalize(cur.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind sütun önerisi hazır" + (r.dropped ? " · " + r.dropped + " kaynaksız/uydurma öğe reddedildi" : "") + ".");
      }, { id: "aiBtn" }));

    // AI öneri kutusu
    let aiBox = null;
    if (cur.ai) {
      aiBox = el("div", { class: "pl-callout pl-callout--info", id: "aiBox" },
        el("div", { class: "it-row" },
          el("b", { text: "MyMind sütun normalleştirme önerisi" }),
          cur.ai.dropped ? badge(cur.ai.dropped + " kaynaksız tamamlama/sütun reddedildi", "warning") : badge("Kaynaksız tamamlama: 0", "success"),
          el("span", { class: "it-grow" }),
          btn("Öneriyi sütunlara uygula", "pl-btn--primary", async () => { apply(await D.ai.apply(cur.id)); toast("Sütun adları ve veri tipleri güncellendi."); }, { id: "aiApplyBtn" })),
        el("div", { class: "it-small", text: cur.ai.columns.map((c) => "#" + (c.index + 1) + " → " + c.name + " (" + C.COL_TYPE_NAMES[c.type] + ")").join(" · ") }),
        cur.ai.notes.length ? el("div", { class: "pl-muted it-small", text: "Notlar: " + cur.ai.notes.join(" | ") }) : null);
    }

    // Sütun önizleme kartları
    const colGrid = el("div", { class: "it-colgrid", id: "colGrid" }, ...cur.columns.map((col) => {
      const inc = el("input", { type: "checkbox", "aria-label": "Dahil et: " + col.name });
      inc.checked = col.included;
      inc.addEventListener("change", guard(async () => apply(await D.table.updateColumn(cur.id, col.index, { included: inc.checked }))));
      const nameInp = el("input", { class: "pl-input col-name-input", "data-col": String(col.index), value: col.name, maxlength: "80", "aria-label": "Sütun adı " + (col.index + 1) });
      nameInp.addEventListener("change", guard(async () => { apply(await D.table.updateColumn(cur.id, col.index, { name: nameInp.value })); toast("Sütun adı güncellendi."); }));
      const typeSel = el("select", { class: "pl-input col-type-select", "data-col": String(col.index), "aria-label": "Sütun tipi " + (col.index + 1) },
        ...C.COL_TYPES.map((t) => el("option", { value: t, text: C.COL_TYPE_NAMES[t] })));
      typeSel.value = col.type;
      typeSel.addEventListener("change", guard(async () => { apply(await D.table.updateColumn(cur.id, col.index, { type: typeSel.value })); toast("Sütun veri tipi güncellendi."); }));
      return el("div", { class: "it-colcard" },
        el("div", { class: "it-row" }, inc, el("b", { class: "it-small", text: "#" + (col.index + 1) + " (" + col.key + ")" })),
        nameInp,
        typeSel);
    }));

    // Veri tablosu
    const cols = cur.columns.filter((c) => c.included);
    const thead = el("thead", {}, el("tr", {},
      el("th", { text: "Kaynak Satır" }),
      ...cols.map((c) => el("th", {}, el("div", { text: c.name }), el("span", { class: "it-cellmeta", text: C.COL_TYPE_NAMES[c.type] })))));
    const tbody = el("tbody", {}, ...cur.rows.map((row) => el("tr", {},
      el("td", { text: "#" + row.sourceLine }),
      ...cols.map((c) => {
        const cell = row.cells[c.index];
        const shown = cell.value !== "" ? cell.value : (cell.status === "missing" ? "— (boş)" : cell.raw);
        const displayVal = maskOn && cell.pii.length ? C.maskPiiText(shown) : shown;
        const td = el("td", { class: cell.status === "missing" ? "is-missing" : cell.status === "anomaly" ? "is-anomaly" : "" },
          el("div", { text: displayVal }),
          cell.reason ? el("span", { class: "it-cellmeta", text: cell.reason }) : null,
          cell.pii.length ? badge(maskOn ? "PII maskeli" : "PII: " + cell.pii.join(","), "accent") : null);
        return td;
      }))));
    const gridWrap = el("div", { class: "it-gridwrap" }, el("table", { class: "it-table", id: "previewTable" }, thead, tbody));
    put(detail, headRow, aiBox, colGrid, gridWrap);
  }

  function renderTrace() {
    const cur = activeTable();
    const wrap = $("traceWrap");
    document.querySelectorAll("[data-tf]").forEach((b) => b.setAttribute("aria-checked", b.dataset.tf === state.tf ? "true" : "false"));
    if (!cur) { put(wrap, el("p", { class: "pl-muted it-small", text: "Tablo seçin." })); return; }
    const items = [];
    for (const row of cur.rows) {
      for (const cell of row.cells) {
        if (state.tf === "issues" && cell.status !== "missing" && cell.status !== "anomaly") continue;
        if (state.tf === "pii" && !cell.pii.length) continue;
        items.push({ row, cell, col: cur.columns[cell.colIndex] });
      }
    }
    $("traceSummary").textContent = items.length + " hücre gösteriliyor · Kaynak izi doğruluğu %" + cur.stats.cellAccuracy;
    put(wrap, ...items.map(({ row, cell, col }) => el("div", { class: "it-tracerow" },
      badge("Satır #" + cell.trace.sourceLine + " · Sütun #" + cell.trace.col + " (" + col.name + ")", "info"),
      badge(cell.status === "ok" ? "Doğrulandı" : cell.status === "missing" ? "Eksik (boş bırakıldı)" : "Tip uyuşmazlığı", cell.status === "ok" ? "success" : cell.status === "missing" ? "warning" : "danger"),
      el("span", { text: "Ham kaynak: “" + cell.raw + "” → Normalleştirilmiş: “" + (cell.value || "boş") + "”" }),
      cell.reason ? el("span", { class: "pl-muted", text: "(" + cell.reason + ")" }) : null)));
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card("%" + String(m.cellAccuracy).replace(".", ","), "kaynağa göre hücre doğruluğu (hedef ≥%99)", "is-ok"),
      card(String(m.unverifiedCompleted), "kaynaksız tamamlanan hücre (hedef 0)", "is-ok"),
      card(String(m.formulaEscaped), "etkisizleştirilen CSV formül enjeksiyonu", "is-ok"),
      card(String(m.tableCount) + " tablo / " + m.totalCells + " hücre", "işlenen yapılandırılmış veri"));
    $("csvDelim").value = s.settings.csvDelimiter;
    $("setMaskPii").checked = s.settings.maskPiiByDefault;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Tablolar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "İşletim sistemi kasası yok: veriler yerel JSON olarak saklanır.";
  }

  // Olaylar
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tf]").forEach((b) => b.addEventListener("click", () => { state.tf = b.dataset.tf; renderTrace(); }));
  $("maskPiiToggle").addEventListener("change", () => renderWorkspace());
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", () => {
    $("capText").value = ""; $("capTitle").value = ""; $("capUrl").value = "";
    $("capDialog").showModal();
  }));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const r = await D.capture.text($("capText").value, { title: $("capTitle").value, sourceUrl: $("capUrl").value.trim() });
    $("capDialog").close();
    apply(r.state); go("workspace");
    toast("Tablo çıkarıldı (" + r.rowCount + " satır, " + r.colCount + " sütun).");
  }));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.clipboard();
    apply(r.state); go("workspace");
    toast("Panodan tablo çıkarıldı (" + r.rowCount + " satır, " + r.colCount + " sütun).");
  })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    apply(r.state); go("workspace");
    toast(r.added + " tablo dosyadan eklendi" + (r.skipped ? " · " + r.skipped + " dosya atlandı" : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.sample();
    apply(r.state); go("workspace");
    toast(r.added + " örnek tablo/liste yüklendi.");
  })));
  $("exportCsvBtn").addEventListener("click", guard(async () => {
    const cur = activeTable();
    if (!cur) return toast("Önce bir tablo seçin.", true);
    const r = await D.exportCsv(cur.id, { maskPii: $("maskPiiToggle").checked });
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi (" + r.rowCount + " satır" + (r.escapedFormulas ? " · " + r.escapedFormulas + " formül enjeksiyonu engellendi" : "") + ").");
  }));
  $("exportJsonBtn").addEventListener("click", guard(async () => {
    const cur = activeTable();
    if (!cur) return toast("Önce bir tablo seçin.", true);
    const r = await D.exportJson(cur.id, { maskPii: $("maskPiiToggle").checked });
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi (" + r.rowCount + " kayıt).");
  }));
  $("backupBtn").addEventListener("click", guard(async () => {
    const r = await D.backup();
    if (!r.cancelled) toast("“" + r.file + "” kaydedildi.");
  }));
  $("csvDelim").addEventListener("change", guard(async () => apply(await D.setSettings({ csvDelimiter: $("csvDelim").value }))));
  $("setMaskPii").addEventListener("change", guard(async () => {
    $("maskPiiToggle").checked = $("setMaskPii").checked;
    apply(await D.setSettings({ maskPiiByDefault: $("setMaskPii").checked }));
  }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));
  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok.";
    $("mymindDialog").showModal();
  });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => {
    const r = await D.ai.setKey($("mymindKey").value);
    $("mymindDialog").close();
    toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bellekte tutuluyor.");
    apply(await D.state());
  }));
  $("mymindForget").addEventListener("click", guard(async () => {
    await D.ai.setKey(null);
    $("mymindDialog").close();
    toast("Anahtar kaldırıldı.");
    apply(await D.state());
  }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("workspace"); document.documentElement.dataset.ready = "1"; });
})();
