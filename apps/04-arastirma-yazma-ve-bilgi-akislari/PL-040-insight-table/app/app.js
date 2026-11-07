/* Insight Table — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; kaynak sayfanın HTML'i hiçbir zaman
 * DOM'a eklenmez). Arayüz ağa, panoya, dosya sistemine ve anahtarlara doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.itDesktop;
  const C = window.ITCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["tables", "exports", "settings"];
  const state = { s: null, view: "tables", lf: "etkin" };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
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
  const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("tr-TR", { maximumFractionDigits: 6 }) : String(n));
  const caps = () => (state.s ? state.s.captures : []);
  const titleOf = (x) => x.input.title || C.hostOf(x.input.url) || x.input.file || "Yapıştırılan içerik";
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

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
    $("capCount").textContent = String(m.captures);
    $("expCount").textContent = String(m.exports);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    const accel = s.shortcut.accel.replace("CommandOrControl", s.platform === "darwin" ? "Cmd" : "Ctrl");
    $("shortcutInline").textContent = accel;
    $("shortcutName").textContent = accel;
    put($("sideInfo"), el("div", { class: "it-mini__in" },
      el("span", { class: "pl-muted it-small", text: "Dışa aktarma doğrulaması" }),
      el("b", { class: m.verifyFailed ? "is-bad" : m.verifyPct != null ? "is-ok" : "", text: m.verifyPct == null ? "—" : pctText(m.verifyPct) }),
      el("span", { class: "pl-muted it-small", text: m.exports + " dosya · " + m.neutralized + " formül etkisizleşti" })));
    if (state.view === "tables") renderTables();
    if (state.view === "exports") renderExports();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Tablolar ----------------
  function listItem(x, selected) {
    const c = x.candidates[x.sel];
    const li = el("li", { class: "it-item it-item" + (selected ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": selected ? "true" : "false" },
      el("div", { class: "it-item__body" },
        el("span", { class: "it-ititle", text: titleOf(x) }),
        el("div", { class: "it-imeta" }, badge(x.candidates.length + " tablo/liste"), badge(c.rows + "×" + c.cols), x.input.via === "ornek" ? badge("örnek", "warning") : null, x.ai ? badge("MyMind", "pro") : null),
        el("span", { class: "it-mini-preview", text: c.preview.map((r) => r.join(" · ")).join(" | ") }),
        el("span", { class: "it-src", text: (x.input.url ? C.hostOf(x.input.url) + " · " : x.input.file ? x.input.file + " · " : "") + fmtWhen(x.createdAt) })));
    const open = guard(async () => apply(await D.item.open(x.id)));
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return li;
  }
  function renderTables() {
    document.querySelectorAll("[data-lf]").forEach((b) => { b.setAttribute("aria-checked", b.dataset.lf === state.lf ? "true" : "false"); b.classList.toggle("is-active", b.dataset.lf === state.lf); });
    const all = caps();
    const none = !all.length;
    $("emptyPanel").hidden = !none;
    $("capSplit").hidden = none;
    if (none) return;
    const list = all.filter((x) => x.status === state.lf);
    $("capInfo").textContent = list.length + (state.lf === "arsiv" ? " arşivlenmiş kayıt" : " kayıt") + " · " + list.reduce((a, x) => a + x.candidates.length, 0) + " tablo/liste";
    const act = state.s.active;
    put($("capList"), ...(list.length ? list.map((x) => listItem(x, x.id === act)) : [el("li", { class: "it-empty", text: state.lf === "arsiv" ? "Arşiv boş." : "Kayıt yok. “Yeni içerik”, “Panodan” ya da Ctrl+Alt+I ile ekleyin." })]));
    const x = list.find((i) => i.id === act);
    put($("capDetail"), x && state.s.table ? detail(x, state.s.table) : el("p", { class: "it-empty", text: list.length ? "Soldan bir kayıt seçin." : "" }));
  }

  function columnHead(x, t, col) {
    const set = (patch) => guard(async () => apply(await D.item.column(x.id, col.i, patch)));
    const name = el("input", { class: "pl-input", value: col.name, maxlength: "60", "aria-label": "Sütun " + (col.i + 1) + " adı", spellcheck: "false" });
    name.addEventListener("change", () => set({ name: name.value })());
    const type = el("select", { class: "pl-input", "aria-label": "Sütun " + (col.i + 1) + " türü" }, ...C.TYPES.map((k) => el("option", { value: k, text: C.TYPE_NAMES[k] + (k === col.inferred ? " (algılanan)" : "") })));
    type.value = col.type;
    type.addEventListener("change", () => set({ type: type.value === col.inferred ? "" : type.value })());
    const inc = el("input", { type: "checkbox", "aria-label": "Sütun " + (col.i + 1) + " dışa aktarılsın" });
    inc.checked = col.include;
    inc.addEventListener("change", () => set({ include: inc.checked })());
    const st = col.stats;
    const stats = el("div", { class: "it-col__stats" },
      st.eksik ? badge(st.eksik + " eksik", "", "Boş ya da yer tutucu (—, N/A) — değer uydurulmaz") : null,
      st.uyumsuz ? badge(st.uyumsuz + " uyumsuz", "danger", "Sütun türüne uymayan hücre; ham metniyle yazılır") : null,
      st.belirsiz ? badge(st.belirsiz + " belirsiz", "warning", "İki türlü okunabilen değer; varsayım hücre ipucunda yazar") : null,
      col.unit ? badge(col.unit, "", "Birim (değerden ayrıldı)") : null,
      col.locale && col.type === "sayi" ? badge(col.locale === "tr" ? "TR 1.234,5" : "EN 1,234.5", "", "Kaynaktaki sayı biçimi") : null,
      col.dateOrder && col.type === "tarih" ? badge(col.dateOrder === "gun" ? "GG/AA" : "AA/GG", "", "Gün/ay sırası") : null,
      st.kisisel ? badge(st.kisisel + " kişisel?", "warning", "Metin içinde kişisel veri olabilir") : null);
    const kids = [el("div", { class: "it-col__row" }, inc, name), el("div", { class: "it-col__row" }, type)];
    if (col.pii) {
      const pii = el("select", { class: "pl-input", "aria-label": "Sütun " + (col.i + 1) + " kişisel veri filtresi" }, el("option", { value: "maskele", text: "Maskele" }), el("option", { value: "dahil", text: "Olduğu gibi" }), el("option", { value: "cikar", text: "Çıkar" }));
      pii.value = col.piiMode;
      pii.addEventListener("change", () => set({ pii: pii.value })());
      kids.push(el("div", { class: "it-col__row" }, badge(C.PII_NAMES[col.pii], "warning", "Kişisel veri sütunu"), pii));
    }
    kids.push(stats);
    return el("th", { scope: "col", "data-col": String(col.i) }, el("div", { class: "it-col" + (col.include && !(col.pii && col.piiMode === "cikar") ? "" : " is-off") }, ...kids));
  }
  function cellView(cell, col) {
    const off = !col.include || (col.pii && col.piiMode === "cikar");
    const cls = ["it-cell"];
    if (cell.flag) cls.push("f-" + cell.flag);
    if (col.type === "sayi" && cell.v != null) cls.push("is-num");
    if (cell.pii) cls.push("has-pii");
    if (off) cls.push("is-off");
    const masked = col.pii && col.piiMode === "maskele" && cell.raw;
    const shown = masked ? maskCell(cell.raw) : cell.raw;
    const normText = cell.v != null && !masked && col.type !== "metin" ? (col.type === "sayi" ? fmtNum(cell.v) : col.type === "mantik" ? (cell.v ? "evet" : "hayır") : String(cell.v)) : "";
    const norm = normText && normText !== cell.raw && String(cell.v) !== cell.raw ? normText : "";
    const tip = "Kaynak: satır " + cell.r + ", sütun " + cell.c + (cell.span ? " (birleşik hücreden)" : "") + (cell.flag ? "\n" + C.FLAG_NAMES[cell.flag] + ": " + cell.why : "") + (cell.pii ? "\nKişisel veri olabilir: " + C.PII_NAMES[cell.pii] : "") + (norm ? "\nYazılacak: " + norm : "");
    return el("td", { class: cls.join(" "), title: tip, "data-flag": cell.flag || "" }, el("span", { text: shown || (cell.flag === "eksik" ? "—" : "") }), norm ? el("span", { class: "it-norm", text: "→ " + norm }) : null);
  }
  const maskCell = (s) => { const e = /^([^@\s])[^@\s]*(@.+)$/.exec(s.trim()); if (e) return e[1] + "•••" + e[2]; let keep = 2, out = ""; for (let i = s.length - 1; i >= 0; i--) { const ch = s[i]; if (/[\p{L}\p{N}]/u.test(ch)) { out = (keep > 0 ? ch : "•") + out; keep--; } else out = ch + out; } return out; };

  function detail(x, t) {
    const out = [];
    out.push(el("div", { class: "it-dhead" },
      el("div", { class: "it-bar" }, el("h2", { class: "pl-h3 it-h", text: titleOf(x) }), el("span", { class: "it-grow" }), badge(x.input.format === "html" ? "HTML" : "Metin"), badge({ pano: "panodan", yapistirma: "yapıştırma", dosya: "dosya", ornek: "örnek" }[x.input.via] || x.input.via)),
      x.input.url ? el("div", { class: "it-srcrow" }, icon("link", "16"), el("span", { class: "it-src", text: x.input.url }), btn("Kaynağı aç", "pl-btn--ghost", async () => D.openLink(x.id))) : el("span", { class: "pl-muted it-small", text: "Kaynak adresi verilmedi — dışa aktarılan dosyada yalnız başlık ve yakalama zamanı yer alır." })));
    if (x.candidates.length > 1) {
      out.push(el("div", { class: "it-tabs", role: "group", "aria-label": "Sayfadaki tablolar" }, ...x.candidates.map((c) => {
        const b = el("button", { type: "button", class: "it-tab", "aria-pressed": c.idx === x.sel ? "true" : "false", "data-idx": String(c.idx) }, el("b", { text: C.KIND_NAMES[c.kind] + " " + (c.idx + 1) + " · " + c.rows + "×" + c.cols }), el("span", { text: c.caption || c.preview[0].join(" · ") }));
        b.addEventListener("click", guard(async () => apply(await D.item.table(x.id, c.idx))));
        return b;
      })));
    }
    const hdr = el("select", { class: "pl-input", id: "headerSel", "aria-label": "Başlık satırı" }, el("option", { value: "0", text: "Yok (ilk satır veri)" }), el("option", { value: "1", text: "İlk satır" }), el("option", { value: "2", text: "İlk iki satır (birleştir)" }));
    hdr.value = String(t.header);
    hdr.addEventListener("change", guard(async () => apply(await D.item.header(x.id, Number(hdr.value)))));
    const tt = t.totals;
    out.push(el("div", { class: "it-opts" },
      el("label", {}, "Başlık satırı", hdr),
      t.header !== t.headerGuess ? el("span", { class: "pl-muted it-small", text: "(önerilen: " + t.headerGuess + ")" }) : null,
      el("span", { class: "it-grow" }),
      el("div", { class: "it-sum", id: "tableSum" }, badge(tt.rows + " satır"), badge(tt.cols + " sütun dışa aktarılacak"), tt.eksik ? badge(tt.eksik + " eksik") : null, tt.uyumsuz ? badge(tt.uyumsuz + " uyumsuz", "danger") : null, tt.belirsiz ? badge(tt.belirsiz + " belirsiz", "warning") : badge("belirsiz yok", "success"), tt.piiCols ? badge(tt.piiCols + " kişisel veri sütunu", "warning") : null)));
    const notes = t.notes.concat(...t.columns.map((c) => c.notes.map((n) => "“" + c.name + "”: " + n)));
    if (t.caption) notes.unshift("Başlık/altyazı: " + t.caption);
    if (notes.length) out.push(el("ul", { class: "it-notes pl-muted" }, ...notes.map((n) => el("li", { text: n }))));
    const thead = el("thead", {}, el("tr", {}, el("th", { class: "it-rowh", scope: "col", title: "Satır no (kaynaktaki satır)" }, "#"), ...t.columns.map((c) => columnHead(x, t, c))));
    const tbody = el("tbody", {}, ...t.rows.map((r) => {
      const toggle = el("button", { type: "button", title: (r.skip ? "Satırı geri al" : "Satırı dışa aktarmadan çıkar") + " · kaynak satır " + r.src, "aria-label": "Satır " + r.n + (r.skip ? " geri al" : " çıkar") }, String(r.n));
      toggle.addEventListener("click", guard(async () => apply(await D.item.row(x.id, r.n, !r.skip))));
      return el("tr", { class: r.skip ? "is-skip" : "" }, el("td", { class: "it-rowh" }, toggle), ...r.cells.map((cell, i) => cellView(cell, t.columns[i])));
    }));
    out.push(el("div", { class: "it-gridwrap", id: "gridWrap" }, el("table", { class: "it-grid", id: "grid" }, thead, tbody)));
    out.push(el("div", { class: "it-legend" }, el("span", {}, el("i", { class: "l-eksik" }), "eksik (boş/yer tutucu)"), el("span", {}, el("i", { class: "l-uyumsuz" }), "türe uymuyor"), el("span", {}, el("i", { class: "l-belirsiz" }), "belirsiz biçim"), el("span", {}, el("i", { class: "l-pii" }), "kişisel veri olabilir"),
      el("span", { text: t.total > t.shown ? "İlk " + t.shown + " / " + t.total + " satır gösteriliyor; dışa aktarma tümünü içerir." : "Hücrenin üzerine gelince kaynak konumu ve neden görünür. Satır numarasına tıklayarak satırı çıkarın." })));

    if (x.ai && x.ai.table === x.sel) {
      const names = Object.entries(x.ai.names);
      out.push(el("div", { class: "it-block it-block--ai" },
        el("div", { class: "it-row" }, icon("spark", "16"), el("b", { text: "MyMind önerisi" }), el("span", { class: "pl-muted it-small", text: fmtWhen(x.ai.at) + " · denetlendi" })),
        names.length ? el("ul", { class: "it-notes" }, ...names.map(([i, n]) => el("li", { text: "“" + (t.columns[i] ? t.columns[i].name : "?") + "” → “" + n + "”" }))) : el("span", { class: "pl-muted it-small", text: "Ad önerisi yok ya da uygulandı." }),
        x.ai.warnings.length ? el("ul", { class: "it-notes" }, ...x.ai.warnings.map((w) => el("li", { text: (t.columns[w.i] ? t.columns[w.i].name : "?") + ": " + w.not }))) : null,
        x.ai.dropped ? el("span", { class: "it-why is-warn", text: x.ai.dropped + " öğe atıldı: " + x.ai.droppedList.join("; ") }) : null,
        el("div", { class: "it-row" }, names.length ? btn("Ad önerilerini uygula", "pl-btn--secondary", async () => { const r = await D.ai.apply(x.id); apply(r.state); toast(r.applied + " sütun adı güncellendi."); }) : null, btn("Kapat", "pl-btn--ghost", async () => apply(await D.ai.dismiss(x.id))))));
    }
    out.push(el("div", { class: "it-actions" },
      btn("CSV olarak kaydet", "pl-btn--primary", async () => {
        busy("Yazılıyor ve doğrulanıyor…");
        const r = await D.exportCsv(x.id);
        busy(null);
        if (r.cancelled) return;
        apply(r.state);
        toast("“" + r.file + "” kaydedildi: " + r.rows + " satır × " + r.cols + " sütun. Geri okuma: " + r.verify.ok + "/" + r.verify.total + " hücre " + (r.verify.pass ? "birebir" : "UYUŞMUYOR") + (r.neutralized ? " · " + r.neutralized + " formül etkisizleştirildi" : "") + (r.masked ? " · " + r.masked + " kişisel değer maskelendi" : "") + ".", !r.verify.pass);
      }, { id: "csvBtn" }),
      btn("JSON olarak kaydet", "pl-btn--secondary", async () => {
        busy("Yazılıyor ve doğrulanıyor…");
        const r = await D.exportJson(x.id);
        busy(null);
        if (r.cancelled) return;
        apply(r.state);
        toast("“" + r.file + "” kaydedildi: " + r.rows + " satır. Geri okuma " + (r.verify.pass ? "birebir" : "UYUŞMUYOR") + (r.masked ? " · " + r.masked + " kişisel değer maskelendi" : "") + ".", !r.verify.pass);
      }, { id: "jsonBtn" }),
      btn("Panoya kopyala (sekmeli)", "pl-btn--ghost", async () => { const r = await D.copyTsv(x.id); toast(r.rows + " satır panoya kopyalandı (Excel/Sheets'e yapıştırılabilir)."); }),
      el("span", { class: "it-grow" }),
      btn("MyMind ile sütunları gözden geçir", "pl-btn--ghost", async () => {
        busy("MyMind'a soruluyor…");
        const r = await D.ai.suggest(x.id);
        busy(null);
        if (!r.approved) { toast("Gönderilmedi."); return; }
        apply(r.state);
        toast(r.names + " ad önerisi, " + r.warnings + " not" + (r.dropped ? " · " + r.dropped + " öğe atıldı (hücre değeri önerisi ya da olmayan sütun)" : "") + ".");
      }, { id: "aiBtn" }),
      btn("Ayarları sıfırla", "pl-btn--ghost", async () => { apply(await D.item.reset(x.id)); toast("Bu tablo için sütun ayarları sıfırlandı."); }),
      x.status === "etkin" ? btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.item.archive(x.id)); toast("Kayıt arşivlendi (silinmedi)."); }) : btn("Geri al", "pl-btn--ghost", async () => { apply(await D.item.restore(x.id)); state.lf = "etkin"; render(); })));
    return frag(out);
  }
  function frag(list) { const f = document.createDocumentFragment(); for (const n of list) if (n) f.appendChild(n); return f; }

  // ---------------- Dışa aktarımlar ----------------
  function renderExports() {
    const list = state.s.exports;
    $("expInfo").textContent = list.length ? list.length + " dosya" : "";
    if (!list.length) { put($("expBody"), el("p", { class: "it-empty", text: "Henüz dışa aktarım yok." })); return; }
    put($("expBody"), el("table", { class: "it-explist", id: "expTable" },
      el("thead", {}, el("tr", {}, ...["Zaman", "Dosya", "Biçim", "Boyut", "Geri okuma", "Etkisizleşen formül", "Maskelenen", "Kaynak"].map((h) => el("th", { text: h })))),
      el("tbody", {}, ...list.map((e) => el("tr", {},
        el("td", { text: fmtWhen(e.at) }), el("td", { class: "mono", text: e.file }), el("td", { text: e.format.toUpperCase() + (e.profile === "excel-tr" ? " · Excel-TR" : "") + (e.trace && e.trace !== "yok" ? " · " + (e.trace === "hucre" ? "hücre izi" : "satır izi") : "") }),
        el("td", { text: e.rows + "×" + e.cols }), el("td", {}, e.verify ? badge(e.verify.ok + "/" + e.verify.total + (e.verify.pass ? " birebir" : " uyuşmuyor"), e.verify.pass ? "success" : "danger") : el("span", { text: "—" })),
        el("td", { text: String(e.neutralized) }), el("td", { text: String(e.masked) }), el("td", { class: "pl-muted", text: e.source }))))));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(pctText(m.accuracy), "hücre doğruluğu — elle etiketli örnekler (hedef ≥%99)", m.accuracy == null ? "" : m.accuracy >= 99 ? "is-ok" : "is-bad"),
      card(pctText(m.verifyPct), "dışa aktarma geri okuma doğrulaması", m.verifyFailed ? "is-bad" : m.verifyPct != null ? "is-ok" : ""),
      card(String(m.neutralized), "etkisizleştirilen formül hücresi (CSV enjeksiyonu)", m.neutralized ? "is-ok" : ""),
      card(String(m.masked), "maskelenen kişisel değer"),
      card(String(m.captures), "etkin kayıt (" + m.tables + " tablo/liste)"),
      card(String(m.exports), "dışa aktarılan dosya"),
      card(fmtNum(m.cellsExported), "dışa aktarılan hücre"),
      card(String(m.aiRuns) + " / " + m.aiDropped, "MyMind isteği / atılan öğe", m.aiDropped ? "is-bad" : ""));
    const g = s.gold;
    $("goldInfo").textContent = g ? "Örnek sayfalarda elle etiketlenmiş " + g.total + " hücre: " + g.ok + " doğru (" + pctText(g.accuracy) + ")" + (g.misses.length ? " · hatalar: " + g.misses.join("; ") : "") + ". Gerçek sayfalarınızda ölçülmemiştir; örnekler uydurma veridir." : "Doğruluk ölçümü için “Örnek sayfalar”ı ekleyin (elle etiketlenmiş beklenen değerlerle karşılaştırılır).";
    $("setLocale").value = s.settings.numberLocale;
    $("setDate").value = s.settings.dateOrder;
    $("setProfile").value = s.settings.csvProfile;
    $("setTrace").value = s.settings.trace;
    $("setShortcut").checked = s.settings.shortcut;
    $("shortcutState").textContent = s.settings.shortcut ? (s.shortcut.ok ? "(etkin)" : "(bu oturumda kaydedilemedi — başka bir uygulama kullanıyor olabilir)") : "";
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Kayıtlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: kayıtlar düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  function openCapture() {
    $("capText").value = ""; $("capTitle").value = ""; $("capUrl").value = "";
    $("capDialog").showModal();
    $("capText").focus();
  }
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", openCapture));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); state.lf = "etkin"; apply(r.state); go("tables"); toast("Panodan (" + (r.via === "html" ? "HTML" : "metin") + "): " + r.summary + "."); })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    state.lf = "etkin"; apply(r.state); go("tables");
    toast(r.added + " dosya eklendi" + (r.skipped.length ? " · atlanan: " + r.skipped.join(", ") : "") + ".", !r.added);
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.sample(); state.lf = "etkin"; apply(r.state); go("tables"); toast(r.added + " örnek sayfa eklendi (uydurma veri; doğruluk ölçümü için elle etiketli)."); })));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-lf]").forEach((b) => b.addEventListener("click", () => { state.lf = b.dataset.lf; render(); }));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const text = $("capText").value;
    if (!text.trim()) { toast("İçerik boş.", true); return; }
    const r = await D.capture.text(text, { title: $("capTitle").value, url: $("capUrl").value.trim() });
    $("capDialog").close();
    state.lf = "etkin"; apply(r.state); go("tables");
    toast(r.summary + ".");
  }));
  $("setLocale").addEventListener("change", guard(async () => apply(await D.setSettings({ numberLocale: $("setLocale").value }))));
  $("setDate").addEventListener("change", guard(async () => apply(await D.setSettings({ dateOrder: $("setDate").value }))));
  $("setProfile").addEventListener("change", guard(async () => apply(await D.setSettings({ csvProfile: $("setProfile").value }))));
  $("setTrace").addEventListener("change", guard(async () => apply(await D.setSettings({ trace: $("setTrace").value }))));
  $("setShortcut").addEventListener("change", guard(async () => { apply(await D.setSettings({ shortcut: $("setShortcut").checked })); }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.backup(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi."); }));
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
  D.state().then((s) => { apply(s); go("tables"); document.documentElement.dataset.ready = "1"; });
})();
