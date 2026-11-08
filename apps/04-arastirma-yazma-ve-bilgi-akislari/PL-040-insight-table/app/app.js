/* Insight Table — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; yapıştırılan HTML yalnız metin olarak
 * ana sürece iletilir ve orada ayrıştırılır). Arayüz ağa, panoya, dosya sistemine ve anahtara doğrudan erişmez; her işlem dar IPC ile gider. */
(function () {
  const D = window.itDesktop;
  const C = window.ITCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["tables", "exports", "settings"];
  const state = { s: null, view: "tables", tf: "acik", sel: null, pastedHtml: "", lastExport: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14",
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
  const NUMERIC = ["tamsayi", "ondalik", "para", "yuzde"];
  const fmtNum = (v, money) => (typeof v === "number" ? v.toLocaleString("tr-TR", money ? { minimumFractionDigits: 2, maximumFractionDigits: 6 } : { maximumFractionDigits: 6 }) : "");
  function showVal(v, col) {
    if (v == null) return "";
    if (typeof v === "boolean") return v ? "Evet" : "Hayır";
    if (typeof v === "number") return col.type === "yuzde" ? "%" + fmtNum(v) : col.type === "para" ? fmtNum(v, true) + " " + ({ TRY: "₺", USD: "$", EUR: "€", GBP: "£" }[col.currency] || "") : fmtNum(v);
    if (col.type === "tarih" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.slice(8, 10) + "." + v.slice(5, 7) + "." + v.slice(0, 4);
    return String(v);
  }
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  const active = () => (state.s ? state.s.active : null);

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "tables";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("tableCount").textContent = String(m.datasets);
    $("exportCount").textContent = String(m.exports);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const accel = s.shortcut.accel.replace("CommandOrControl", s.platform === "darwin" ? "Cmd" : "Ctrl");
    $("shortcutInline").textContent = accel;
    $("shortcutName").textContent = accel;
    put($("sideInfo"), el("div", { class: "it-mini__in" },
      el("span", { class: "pl-muted it-small", text: "Dışa aktarma doğrulaması" }),
      el("b", { class: m.exportAccuracy == null ? "" : m.exportAccuracy >= 99 ? "is-ok" : "is-bad", text: pctText(m.exportAccuracy) }),
      el("span", { class: "pl-muted it-small", text: m.exports + " dışa aktarma · " + m.neutralized + " formül etkisiz" })));
    if (state.view === "tables") renderTables();
    if (state.view === "exports") renderExports();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Tablolar ----------------
  function renderTables() {
    const s = state.s;
    document.querySelectorAll("[data-tf]").forEach((b) => { b.setAttribute("aria-checked", b.dataset.tf === state.tf ? "true" : "false"); b.classList.toggle("is-active", b.dataset.tf === state.tf); });
    const none = !s.list.length;
    $("emptyPanel").hidden = !none;
    $("tableSplit").hidden = none;
    if (none) return;
    const list = s.list.filter((x) => x.status === state.tf);
    const act = active();
    $("listInfo").textContent = list.length + (state.tf === "arsiv" ? " arşivde" : " tablo") + " · " + s.metrics.rows + " satır";
    put($("tableList"), ...(list.length ? list.map((x) => {
      const sel = act && act.id === x.id;
      const li = el("li", { class: "it-item" + (sel ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": sel ? "true" : "false" },
        el("span", {}, icon("table", "16")),
        el("div", { class: "it-item__body" },
          el("span", { class: "it-ititle", text: x.name }),
          el("div", { class: "it-imeta" }, badge(x.rows + "×" + x.cols), x.flagged ? badge(x.flagged + " işaret", "warning") : badge("temiz", "success"), x.pii ? badge(x.pii + " kişisel", "danger") : null, x.exports ? badge(x.exports + " dışa aktarma", "accent") : null, x.ai ? badge("MyMind", "pro") : null),
          el("span", { class: "it-src", text: (x.host || x.file || C.VIA_NAMES[x.via]) + " · " + fmtWhen(x.createdAt) })));
      li.addEventListener("click", guard(async () => { state.sel = null; state.lastExport = null; apply(await D.ds.open(x.id)); }));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
      return li;
    }) : [el("li", { class: "it-empty", text: state.tf === "arsiv" ? "Arşiv boş." : "Açık tablo yok. “Panodan”, “Yapıştır…” ya da " + $("shortcutInline").textContent + " ile ekleyin." })]));
    const d = act && act.status === state.tf ? act : null;
    put($("tableDetail"), d ? detail(d) : el("p", { class: "it-empty", text: list.length ? "Soldan bir tablo seçin." : "" }));
  }

  function colHeader(d, col, live) {
    const pc = d.stats.perCol[col.src] || {};
    const set = (patch) => guard(async () => { apply(await D.ds.column(d.id, col.src, patch)); })();
    const name = el("input", { class: "pl-input", value: col.name, "aria-label": "Sütun adı: " + col.name, maxlength: "80", spellcheck: "false" });
    name.addEventListener("change", () => set({ name: name.value }));
    const inc = el("input", { type: "checkbox", "aria-label": "Dışa aktar: " + col.name, title: "Dışa aktarmaya dahil" });
    inc.checked = col.include;
    inc.addEventListener("change", () => set({ include: inc.checked }));
    const type = el("select", { class: "pl-input", "aria-label": "Tür: " + col.name }, ...C.TYPES.map((t) => el("option", { value: t, text: C.TYPE_NAMES[t] + (t === col.typeAuto ? " ✓" : "") })));
    type.value = col.type;
    type.addEventListener("change", () => set({ type: type.value }));
    const rows = [el("div", { class: "it-colhead__row" }, inc, name), el("div", { class: "it-colhead__row" }, type)];
    if (NUMERIC.includes(col.type) || col.type === "tarih") {
      const loc = el("select", { class: "pl-input", "aria-label": "Biçim: " + col.name, title: col.localeFrom === "sutun" ? "Sütundaki değerlerden çıkarıldı" : col.localeFrom === "belge" ? "Sayfa dilinden" : col.localeFrom === "elle" ? "Elle seçildi" : "Kanıt yok — varsayılan; belirsiz hücreler işaretlenir" },
        el("option", { value: "tr", text: "TR" + (col.type === "tarih" ? " gg/aa" : " 1.234,5") }), el("option", { value: "en", text: "EN" + (col.type === "tarih" ? " aa/gg" : " 1,234.5") }));
      loc.value = col.locale;
      loc.addEventListener("change", () => set({ locale: loc.value }));
      rows[1].appendChild(loc);
    }
    if (col.pii) {
      const pm = el("select", { class: "pl-input", "aria-label": "Kişisel veri: " + col.name }, ...C.PII_MODES.map((m) => el("option", { value: m, text: C.PII_MODE_NAMES[m] + " · " + C.PII_NAMES[col.pii] })));
      pm.value = col.piiMode;
      pm.addEventListener("change", () => set({ piiMode: pm.value }));
      rows.push(el("div", { class: "it-colhead__row" }, pm));
    }
    const flags = el("div", { class: "it-colflags" },
      el("span", { class: "it-colsrc", text: "kaynak sütun " + (col.src + 1) + (col.nameFrom !== "kaynak" ? " · ad: " + C.NAME_FROM[col.nameFrom] : "") }),
      pc.eksik ? badge(pc.eksik + " eksik") : null, pc.hatali ? badge(pc.hatali + " uymuyor", "danger") : null, pc.belirsiz ? badge(pc.belirsiz + " belirsiz", "warning") : null, col.pii ? badge(C.PII_NAMES[col.pii], "danger") : null);
    if (!live) for (const x of rows) x.querySelectorAll("input,select").forEach((i) => { i.disabled = true; });
    const off = !col.include || (col.pii && col.piiMode === "cikar");
    return el("th", { class: off ? "is-off" : "", scope: "col", "data-src": String(col.src) }, el("div", { class: "it-colhead" }, ...rows, flags));
  }

  function detail(d) {
    const live = d.status !== "arsiv";
    const st = d.stats;
    const head = el("div", { class: "it-dhead" },
      el("div", { class: "it-row" }, badge(C.VIA_NAMES[d.source.via] || d.source.via), badge(C.KIND_NAMES[d.cands[d.choice].kind]), d.status === "arsiv" ? badge("Arşiv", "warning") : null, el("span", { class: "pl-muted it-small", text: fmtWhen(d.createdAt) })));
    const nm = el("input", { class: "pl-input it-name", value: d.name, "aria-label": "Tablo adı", maxlength: "120", disabled: !live });
    nm.addEventListener("change", guard(async () => apply(await D.ds.rename(d.id, nm.value))));
    head.appendChild(nm);
    if (d.source.url || d.source.file || d.source.title) head.appendChild(el("div", { class: "it-srcrow" }, icon("link", "16"), el("span", { class: "it-src", text: d.source.url || d.source.file || d.source.title }), d.source.url ? btn("Kaynağı aç", "pl-btn--ghost", async () => D.openLink(d.id)) : null));

    const candSel = el("select", { class: "pl-input it-select", id: "candSel", "aria-label": "Kaynaktaki tablo", disabled: !live || d.cands.length < 2 }, ...d.cands.map((c, i) => el("option", { value: String(i), text: (i + 1) + ". " + c.label })));
    candSel.value = String(d.choice);
    candSel.addEventListener("change", guard(async () => { state.sel = null; apply(await D.ds.choose(d.id, Number(candSel.value))); toast("Tablo değişti; sütunlar yeniden önerildi."); }));
    const hdrSel = el("select", { class: "pl-input it-select", id: "hdrSel", "aria-label": "Başlık satırı", disabled: !live }, ...[0, 1, 2, 3].filter((n) => n < d.cands[d.choice].rows).map((n) => el("option", { value: String(n), text: n === 0 ? "Başlık yok" : n + " satır" })));
    hdrSel.value = String(d.headerRows);
    hdrSel.addEventListener("change", guard(async () => { state.sel = null; apply(await D.ds.header(d.id, Number(hdrSel.value))); toast("Başlık satırı değişti; sütun adları ve türler yeniden önerildi."); }));
    const controls = el("div", { class: "it-controls" },
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "candSel", text: "Kaynaktaki tablo (" + d.cands.length + ")" }), candSel),
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "hdrSel", text: "Başlık satırı" }), hdrSel),
      el("div", { class: "it-stats", id: "statChips" }, badge(st.rows + " satır × " + st.cols + " sütun"), badge(st.eksik + " eksik", st.eksik ? "" : "success"), badge(st.hatali + " türe uymuyor", st.hatali ? "danger" : "success"), badge(st.belirsiz + " belirsiz", st.belirsiz ? "warning" : "success"), st.pii ? badge(st.pii + " kişisel veri sütunu", "danger") : null, d.truncated ? badge("ilk 5000 satır", "warning") : null));

    // Önizleme tablosu
    const aiFlags = new Map();
    if (d.ai) for (const f of d.ai.flags) aiFlags.set(f.r + ":" + f.c, f.reason);
    const thead = el("thead", {}, el("tr", {}, el("th", { class: "it-rn", scope: "col", title: "Kaynaktaki satır numarası", text: "#" }), ...d.columns.map((c) => colHeader(d, c, live))));
    const tbody = el("tbody", {});
    d.preview.forEach((row, r) => {
      const tr = el("tr", {}, el("td", { class: "it-rn", text: String(row[0] ? row[0].r + 1 : r + 1) }));
      row.forEach((x, i) => {
        const col = d.columns[i];
        const off = !col.include || (col.pii && col.piiMode === "cikar");
        const ai = aiFlags.get(r + ":" + col.src);
        const cls = ["it-cell", NUMERIC.includes(col.type) ? "is-num" : "", x.flag ? "is-" + x.flag : "", ai ? "is-ai" : "", x.merged ? "is-merged" : "", off ? "is-off" : "", state.sel && state.sel.r === r && state.sel.i === i ? "is-sel" : ""].filter(Boolean).join(" ");
        const shown = x.flag === "hatali" || x.v == null ? x.raw : showVal(x.v, col);
        const td = el("td", { class: cls, tabindex: "0", "data-r": String(r), "data-i": String(i), title: (x.flag ? C.FLAG_NAMES[x.flag] + (x.note ? " — " + x.note : "") + " · " : "") + (ai ? "MyMind: " + ai + " · " : "") + "kaynak: satır " + (x.r + 1) + ", sütun " + (x.c + 1) + (x.raw !== shown ? " · ham: " + x.raw : "") }, shown || (x.flag === "eksik" ? "—" : ""));
        td.addEventListener("click", () => { state.sel = { r, i }; renderTables(); });
        td.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); td.click(); } });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    const grid = el("div", { class: "it-gridwrap", id: "gridWrap" }, el("table", { class: "it-grid", id: "previewGrid" }, thead, tbody));
    const legend = el("div", { class: "it-legend" },
      el("span", {}, el("span", { class: "it-sw is-eksik" }), "eksik"), el("span", {}, el("span", { class: "it-sw is-hatali" }), "türe uymuyor (değer boş aktarılır)"), el("span", {}, el("span", { class: "it-sw is-belirsiz" }), "belirsiz biçim (biçimi seçerek onaylayın)"),
      d.ai ? el("span", {}, el("span", { class: "it-sw is-ai" }), "MyMind şüpheli") : null, d.more ? el("span", { text: "Önizleme ilk " + d.preview.length + " satır; dışa aktarmaya " + (d.preview.length + d.more) + " satırın tamamı girer." }) : null);

    const out = [head, controls, grid, legend];
    // Hücre izi
    const sel = state.sel && d.preview[state.sel.r] && d.preview[state.sel.r][state.sel.i];
    if (sel) {
      const col = d.columns[state.sel.i];
      const ai = aiFlags.get(state.sel.r + ":" + col.src);
      out.push(el("div", { class: "it-block", id: "traceBox" }, el("span", { class: "it-lbl", text: "Hücre izi · " + col.name }),
        el("dl", { class: "it-trace" },
          el("dt", { text: "Kaynakta" }), el("dd", { text: "satır " + (sel.r + 1) + ", sütun " + (sel.c + 1) + (sel.merged ? " (birleştirilmiş hücreden)" : "") + (d.source.url ? " · " + d.source.url : "") }),
          el("dt", { text: "Ham metin" }), el("dd", { text: sel.raw === "" ? "(boş)" : sel.raw }),
          el("dt", { text: "Değer (" + C.TYPE_NAMES[col.type] + ")" }), el("dd", { text: sel.v == null ? "boş" : typeof sel.v === "string" ? sel.v : JSON.stringify(sel.v) }),
          typeof sel.v === "string" && C.csvSafe(sel.v).neutralized ? el("dt", { text: "Dışa aktarmada" }) : null, typeof sel.v === "string" && C.csvSafe(sel.v).neutralized ? el("dd", { text: "CSV'de başına ' eklenir — tablolama programında formül olarak çalışmaz" }) : null,
          sel.flag ? el("dt", { text: "İşaret" }) : null, sel.flag ? el("dd", { text: C.FLAG_NAMES[sel.flag] + (sel.note ? " — " + sel.note : "") }) : null,
          ai ? el("dt", { text: "MyMind" }) : null, ai ? el("dd", { text: ai + " (değer değiştirilmedi)" }) : null)));
    }
    if (d.ai) {
      const names = Object.entries(d.ai.names);
      out.push(el("div", { class: "it-block it-block--ai", id: "aiBlock" },
        el("div", { class: "it-row" }, icon("spark"), el("b", { text: "MyMind önerisi (denetlendi; hücre değeri değiştirmez)" })),
        names.length ? el("ul", { class: "it-notes" }, ...names.map(([src, n]) => { const c = d.columns.find((x) => String(x.src) === src); return el("li", { text: (c ? c.name : "sütun " + (Number(src) + 1)) + " → " + n }); })) : el("span", { class: "it-hint", text: "Ad önerisi yok." }),
        d.ai.flags.length ? el("span", { class: "it-hint", text: d.ai.flags.length + " şüpheli hücre altın çerçeveyle işaretlendi." }) : null,
        d.ai.dropped ? el("div", { class: "it-hint" }, el("b", { text: d.ai.dropped + " öğe atıldı: " }), d.ai.droppedList.join("; ")) : null,
        live && names.length ? el("div", { class: "it-row" }, btn("Adları uygula (elle değiştirdiklerim hariç)", "pl-btn--secondary", async () => { const r = await D.ai.apply(d.id, true); apply(r.state); toast(r.applied + " sütun adı MyMind önerisiyle güncellendi."); })) : null));
    }
    if (state.lastExport && state.lastExport.id === d.id) {
      const e = state.lastExport;
      out.push(el("div", { class: "it-block " + (e.ok ? "it-okbox" : "it-errbox"), id: "exportBox" },
        el("b", { text: (e.ok ? "✓ " : "✕ ") + "“" + e.file + "” yazıldı ve geri okunarak doğrulandı: " + e.matched + "/" + e.cells + " hücre eşleşti" }),
        el("span", { class: "it-hint", text: e.rows + " satır × " + e.cols + " sütun" + (e.neutralized ? " · " + e.neutralized + " formül benzeri hücre etkisizleştirildi" : "") + (e.masked ? " · " + e.masked + " kişisel veri hücresi maskelendi" : "") }),
        !e.ok && e.mismatches.length ? el("span", { class: "it-hint", text: "İlk fark: satır " + (e.mismatches[0].r + 1) + " — beklenen " + JSON.stringify(e.mismatches[0].want) + ", dosyada " + JSON.stringify(e.mismatches[0].got) }) : null));
    }

    const wrap = el("div", { class: "it-dscroll" }, ...out);
    const preset = el("select", { class: "pl-input it-select", id: "presetSel", "aria-label": "CSV biçimi" }, el("option", { value: "standart", text: "Standart CSV" }), el("option", { value: "excel-tr", text: "Excel Türkçe CSV" }));
    preset.value = state.s.settings.csvPreset;
    const raw = el("input", { type: "checkbox", id: "rawChk" });
    const doExp = (fn, label) => async () => {
      busy("Dışa aktarılıyor…");
      const r = await fn(d.id, { preset: preset.value, values: raw.checked ? "ham" : "normal" });
      busy(null);
      if (r.cancelled) return;
      state.lastExport = { id: d.id, ...r };
      apply(r.state);
      toast(label + " “" + r.file + "”: " + r.rows + " satır; doğrulama " + r.matched + "/" + r.cells + " hücre" + (r.neutralized ? "; " + r.neutralized + " formül etkisiz" : "") + ".", !r.ok);
    };
    const actions = el("div", { class: "it-actions" },
      btn("CSV dışa aktar", "pl-btn--primary", doExp(D.exportCsv, "CSV"), { id: "csvBtn" }), preset,
      btn("JSON dışa aktar", "pl-btn--secondary", doExp(D.exportJson, "JSON"), { id: "jsonBtn" }),
      el("label", { class: "it-check it-check--inline", title: "Türlenmiş değer yerine kaynaktaki metin" }, raw, el("span", { text: "Ham metin" })),
      el("span", { class: "it-grow" }),
      live ? btn("MyMind ile gözden geçir", "pl-btn--ghost", async () => {
        busy("MyMind gözden geçiriyor…");
        const r = await D.ai.suggest(d.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind önerisi: " + r.names + " ad, " + r.flags + " şüpheli hücre" + (r.dropped ? "; " + r.dropped + " öğe denetimde atıldı" : "") + ".");
      }, { id: "aiBtn" }) : null,
      live ? btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.ds.archive(d.id)); toast("Tablo arşive taşındı (silinmedi)."); }) : btn("Arşivden geri al", "pl-btn--secondary", async () => { apply(await D.ds.restore(d.id)); state.tf = "acik"; renderTables(); toast("Tablo geri alındı."); }));
    return frag([wrap, actions]);
  }
  function frag(list) { const f = document.createDocumentFragment(); for (const n of list) if (n) f.appendChild(n); return f; }

  // ---------------- Dışa aktarmalar ----------------
  function renderExports() {
    const log = state.s.exportsLog;
    const m = state.s.metrics;
    $("exportsMeta").textContent = m.exports ? m.exports + " dışa aktarma · " + m.exportCells + " hücre doğrulandı · " + pctText(m.exportAccuracy) : "";
    if (!log.length) return put($("exportsBody"), el("p", { class: "it-empty", text: "Henüz dışa aktarma yok." }));
    const td = (t, cls) => el("td", { class: cls || "", text: t });
    put($("exportsBody"), el("table", { class: "it-table", id: "exportsTable" },
      el("thead", {}, el("tr", {}, ...["Tarih", "Tablo", "Biçim", "Dosya", "Satır × sütun", "Doğrulama", "Etkisizleştirilen", "Maskelenen"].map((h) => el("th", { text: h })))),
      el("tbody", {}, ...log.map((e) => el("tr", {}, td(fmtWhen(e.at)), td(e.dsName), td(e.format.toUpperCase() + (e.format === "csv" ? " · " + (e.preset === "excel-tr" ? "Excel TR" : "standart") : e.trace ? " · izli" : "") + (e.values === "ham" ? " · ham" : "")), td(e.file),
        td(e.rows + " × " + e.cols, "is-num"), el("td", { class: "is-num" }, badge(e.matched + "/" + e.cells, e.matched === e.cells ? "success" : "danger")), td(String(e.neutralized), "is-num"), td(String(e.masked), "is-num"))))));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    const g = s.gold;
    put($("metrics"),
      card(g ? pctText(g.accuracy) : "—", "örneklerde kaynağa göre hücre doğruluğu (hedef ≥ %99)", g ? (g.accuracy >= 99 ? "is-ok" : "is-bad") : ""),
      card(pctText(m.exportAccuracy), "dışa aktarma geri okuma doğrulaması", m.exportAccuracy == null ? "" : m.exportAccuracy === 100 ? "is-ok" : "is-bad"),
      card(String(m.neutralized), "etkisizleştirilen formül benzeri hücre"),
      card(String(m.masked), "maskelenen kişisel veri hücresi"),
      card(String(m.datasets), "açık tablo"),
      card(String(m.rows), "satır"),
      card(String(m.eksik + m.hatali + m.belirsiz), "işaretli hücre (eksik/uymuyor/belirsiz)", m.hatali ? "is-bad" : ""),
      card(String(m.aiDropped), "MyMind'dan atılan öğe (değer önerisi vb.)", m.aiDropped ? "is-bad" : ""));
    $("goldInfo").textContent = g ? "Elle etiketlenmiş " + g.cells + " örnek hücrede (Türkçe sayfa, İngilizce sayfa, sekmeli metin) kural tabanlı çıkarım doğruluğu " + pctText(g.accuracy) + (g.misses.length ? " · farklar: " + g.misses.join("; ") : "") + ". Gerçek kaynaklarınızda ölçülmemiştir; her dışa aktarma ayrıca geri okunarak doğrulanır." : "Örnek kaynakları açınca elle etiketli hücrelerde doğruluk burada görünür.";
    $("setShortcut").checked = s.settings.shortcut;
    $("shortcutState").textContent = s.settings.shortcut ? (s.shortcut.ok ? "(etkin)" : "(bu oturumda kaydedilemedi — başka bir uygulama kullanıyor olabilir)") : "";
    $("setPreset").value = s.settings.csvPreset;
    $("setLocale").value = s.settings.defaultLocale;
    $("setTrace").checked = s.settings.jsonTrace;
    $("setBom").checked = s.settings.bom;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Tablolar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: tablolar düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  const capResult = (r) => toast("“" + r.name + "”: " + r.rows + " satır × " + r.cols + " sütun" + (r.tables > 1 ? " · kaynakta " + r.tables + " tablo/liste bulundu (üstten seçebilirsiniz)" : "") + ".");
  const after = (r) => { state.sel = null; state.lastExport = null; state.tf = "acik"; apply(r.state); go("tables"); };
  function openCapture() {
    $("capText").value = ""; $("capTitle").value = ""; $("capUrl").value = ""; state.pastedHtml = ""; $("capHtmlInfo").textContent = "";
    $("capDialog").showModal();
    $("capText").focus();
  }
  $("capText").addEventListener("paste", (e) => {
    const html = e.clipboardData ? e.clipboardData.getData("text/html") : "";
    state.pastedHtml = html && /<(table|ul|ol|dl)\b/i.test(html) ? html : "";
    $("capHtmlInfo").textContent = state.pastedHtml ? "Biçimli tablo algılandı (HTML); tablo yapısı (birleştirilmiş hücreler, başlık satırları) korunarak çıkarılacak." : "";
  });
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", openCapture));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); after(r); capResult(r); })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    after(r);
    toast(r.added + " dosyadan tablo çıkarıldı" + (r.skipped.length ? " · atlanan: " + r.skipped.join(", ") : "") + ".", !r.added);
  })));
  document.querySelectorAll('[data-act="url"]').forEach((b) => b.addEventListener("click", () => { $("urlInput").value = ""; $("urlDialog").showModal(); $("urlInput").focus(); }));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.sample(); after(r); toast(r.added + " örnek kaynak açıldı (uydurma veriler)."); })));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const text = $("capText").value;
    if (!text.trim() && !state.pastedHtml) return toast("Tablo içeren metni yapıştırın.", true);
    const r = await D.capture.text(text, state.pastedHtml, { title: $("capTitle").value, url: $("capUrl").value.trim() });
    $("capDialog").close();
    after(r); capResult(r);
  }));
  $("urlCancel").addEventListener("click", () => $("urlDialog").close());
  $("urlRun").addEventListener("click", guard(async () => {
    const url = $("urlInput").value.trim();
    busy("Sayfa indiriliyor…");
    const r = await D.capture.url(url);
    busy(null);
    if (!r.approved) return toast("İndirilmedi (onay verilmedi).");
    $("urlDialog").close();
    after(r); capResult(r);
  }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tf]").forEach((b) => b.addEventListener("click", () => { state.tf = b.dataset.tf; renderTables(); }));
  $("setShortcut").addEventListener("change", guard(async () => { apply(await D.setSettings({ shortcut: $("setShortcut").checked })); toast($("setShortcut").checked ? "Genel kısayol açıldı." : "Genel kısayol kapatıldı."); }));
  $("setPreset").addEventListener("change", guard(async () => apply(await D.setSettings({ csvPreset: $("setPreset").value }))));
  $("setLocale").addEventListener("change", guard(async () => { apply(await D.setSettings({ defaultLocale: $("setLocale").value })); toast("Yeni tablolarda kanıt yoksa bu biçim kullanılır."); }));
  $("setTrace").addEventListener("change", guard(async () => apply(await D.setSettings({ jsonTrace: $("setTrace").checked }))));
  $("setBom").addEventListener("change", guard(async () => apply(await D.setSettings({ bom: $("setBom").checked }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.backup(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") { e.preventDefault(); document.querySelector('.it-toolbar [data-act="clipboard"]').click(); }
    else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); openCapture(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go("tables"); document.documentElement.dataset.ready = "1"; });
})();
