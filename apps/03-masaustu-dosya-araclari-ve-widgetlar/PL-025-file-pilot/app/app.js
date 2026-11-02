/* File Pilot — masaüstü arayüzü. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz dosya sistemine, panoya ve ağa erişmez; tarama, arama, önizleme, dosya açma ve MyMind istekleri ana süreçte yapılır. */
(function () {
  const C = window.FPCore;
  const D = window.fpDesktop;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, view: "search", query: "", kind: null, results: [], total: 0, ms: 0, current: null, preview: null, similar: [], answer: null, focusLine: 0, searchTimer: null, seq: 0 };
  const KIND_LABEL = { metin: "Metin", veri: "Veri", web: "Web", kod: "Kod", diger: "Diğer" };
  const STATUS = { metin: ["İçerik indeksli", "success"], ad: ["Yalnız ad", ""], buyuk: ["Büyük: yalnız ad", "warning"], okunamadi: ["Okunamadı (ikili/şifreli)", "danger"] };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    x: "M18 6 6 18M6 6l12 12",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
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
    setTimeout(() => t.remove(), 5000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + cls, text, ...(attrs || {}) }); b.addEventListener("click", guard(onClick)); return b; };
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const n = (x) => Number(x || 0).toLocaleString("tr-TR");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  /** İşaret aralıklarıyla metin: <mark> yalnız DOM düğümü olarak eklenir. */
  function marked(text, marks) {
    const f = document.createDocumentFragment();
    let at = 0;
    for (const [a, b] of marks || []) {
      if (a > at) f.appendChild(document.createTextNode(text.slice(at, a)));
      f.appendChild(el("mark", { class: "fp-mark-hit", text: text.slice(a, b) }));
      at = b;
    }
    if (at < text.length) f.appendChild(document.createTextNode(text.slice(at)));
    return f;
  }
  const extBox = (d) => el("span", { class: "fp-ext fp-ext--" + d.kind, "aria-hidden": "true", text: (d.ext || "?").slice(0, 4) });
  const where = (d) => { const parts = d.rel.split(/[\\/]/); parts.pop(); const base = d.root.split(/[\\/]/).filter(Boolean).pop() || d.root; return [base, ...parts].join(" › "); };

  // ---- Çizim ----
  function renderNav() {
    const s = state.s;
    const items = [
      ["search", "Ara", "search", n(s.counts.files)],
      ["folders", "Klasörler", "folder", n(s.roots.length)],
      ["settings", "Ayarlar", "gear", ""],
    ];
    $("nav").replaceChildren(...items.map(([id, label, ic, count]) => {
      const b = el("button", { type: "button", class: "pl-navitem fp-navbtn" + (state.view === id ? " is-active" : ""), "data-nav": id, "aria-current": state.view === id ? "page" : false }, icon(ic), el("span", { text: label }));
      if (count !== "") b.appendChild(badge(count));
      b.addEventListener("click", guard(() => go(id)));
      return b;
    }));
    $("tagsTitle").hidden = !s.tags.length;
    $("tagNav").replaceChildren(...s.tags.slice(0, 24).map((t) => {
      const b = el("button", { type: "button", class: "pl-tag" + (state.query.split(/\s+/).includes("#" + t.tag) ? " is-selected" : ""), title: t.n + " dosya" }, "#" + t.tag);
      b.addEventListener("click", guard(() => setQuery(state.query.split(/\s+/).includes("#" + t.tag) ? state.query.replace("#" + t.tag, "").trim() : ("#" + t.tag + " " + state.query).trim())));
      return b;
    }));
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    const info = $("scanInfo");
    if (s.scanning) info.textContent = "Taranıyor… " + n(s.progress ? s.progress.files : 0) + " dosya";
    else if (!s.roots.length) info.textContent = "Henüz klasör yok";
    else info.textContent = n(s.counts.files) + " dosya · " + n(s.counts.text) + " içerik indeksli";
  }
  function go(view) {
    state.view = view;
    $("searchView").hidden = view !== "search";
    $("toolbar").hidden = view !== "search";
    $("foldersView").hidden = view !== "folders";
    $("settingsView").hidden = view !== "settings";
    renderAll();
    if (view === "search") $("search").focus();
  }
  function renderKinds() {
    $("kinds").replaceChildren(...Object.keys(KIND_LABEL).map((k) => {
      const on = state.kind === k;
      const b = el("button", { type: "button", class: "pl-tag" + (on ? " is-selected" : ""), "aria-pressed": on ? "true" : "false", text: KIND_LABEL[k] });
      b.addEventListener("click", guard(() => { state.kind = on ? null : k; renderKinds(); runSearch(); }));
      return b;
    }));
  }
  function fullQuery() { return (state.query + (state.kind ? " tür:" + state.kind : "")).trim(); }

  async function runSearch() {
    const seq = ++state.seq;
    const q = fullQuery();
    const r = await D.search(q, { limit: 100, recent: !q });
    if (seq !== state.seq) return; // eski yanıt
    state.results = r.results;
    state.total = r.total;
    state.ms = r.ms;
    if (!state.results.some((x) => x.id === state.current)) state.current = state.results.length ? state.results[0].id : null;
    renderRows();
    await loadPreview();
  }
  function setQuery(q) {
    state.query = q;
    $("search").value = q;
    state.answer = null;
    renderAnswer();
    renderNav();
    return runSearch();
  }
  function renderRows() {
    const s = state.s;
    const head = $("listHead");
    if (!s.roots.length) head.textContent = "Klasör ekleyince dosyalar burada listelenir.";
    else if (!fullQuery()) head.textContent = "Son değişen dosyalar · yazmaya başlayın";
    else head.textContent = n(state.total) + " sonuç · " + state.ms.toLocaleString("tr-TR") + " ms";
    if (s.scanning) head.appendChild(badge("taranıyor", "info"));
    const rows = state.results.map((d, i) => {
      const main = el("div", { class: "pl-listrow__main" },
        el("div", { class: "pl-listrow__title", text: d.name }),
        el("div", { class: "pl-listrow__sub", text: where(d) + " · " + C.formatWhen(d.mtime) }));
      if (d.snippet && d.snippet.text && fullQuery()) main.appendChild(el("div", { class: "fp-snip" }, marked(d.snippet.text, d.snippet.marks)));
      const b = el("button", { type: "button", role: "option", class: "pl-listrow fp-row" + (d.id === state.current ? " is-current" : ""), "aria-selected": d.id === state.current ? "true" : "false", "data-id": d.id, "data-i": String(i) }, extBox(d), main);
      b.addEventListener("click", guard(() => select(d.id)));
      b.addEventListener("dblclick", guard(() => D.open(d.id)));
      return b;
    });
    if (!rows.length && fullQuery() && s.roots.length) rows.push(el("div", { class: "pl-empty" }, el("div", { class: "pl-empty__art" }, icon("search", "20")), el("b", { text: "Eşleşen dosya yok" }), el("span", { class: "pl-muted", text: "Daha kısa bir kök deneyin (ör. \"faturalar\" yerine \"fatura\"), tür süzgecini kaldırın ya da MyMind'a sorun." })));
    $("rows").replaceChildren(...rows);
  }
  async function select(id, line) {
    state.current = id;
    state.focusLine = line || 0;
    for (const r of $("rows").children) { const on = r.dataset && r.dataset.id === id; r.classList.toggle("is-current", !!on); if (r.setAttribute) r.setAttribute("aria-selected", on ? "true" : "false"); }
    const cur = $("rows").querySelector(".is-current");
    if (cur) cur.scrollIntoView({ block: "nearest" });
    await loadPreview();
  }
  async function loadPreview() {
    if (!state.current) { state.preview = null; state.similar = []; renderDetail(); return; }
    const id = state.current;
    const [p, sim] = await Promise.all([D.preview(id, fullQuery()), D.similar(id)]);
    if (id !== state.current) return;
    state.preview = p;
    state.similar = sim;
    renderDetail();
  }
  function renderDetail() {
    const box = $("detail");
    const s = state.s;
    if (!s.roots.length) {
      box.replaceChildren(el("div", { class: "fp-welcome" },
        el("div", { class: "fp-welcome__icon" }, icon("folder", "20")),
        el("h2", { class: "pl-h3", text: "Hatırladığınız birkaç sözcükle dosyayı bulun" }),
        el("p", { class: "pl-muted", text: "Belgelerinizin bulunduğu klasörleri ekleyin. File Pilot dosya adlarını, klasör yollarını ve metin dosyalarının içeriğini bu bilgisayarda indeksler; aradığınızda eşleşen bölümü satır numarasıyla gösterir." }),
        el("ul", { class: "fp-steps" }, el("li", { text: "Türkçe ekler ve aksanlar sorun değil: \"odeme\" yazınca \"ödemeler\" de bulunur." }), el("li", { text: "#etiket, tür:veri, \"tam ifade\" ve -hariç süzgeçleri birleştirilebilir." }), el("li", { text: "Dosyalarınız yalnız okunur; taşınmaz, silinmez, yeniden adlandırılmaz." })),
        el("div", { class: "fp-bar" }, btn("Klasör ekle", "pl-btn--primary", addRoot))));
      return;
    }
    const p = state.preview;
    if (!p) { box.replaceChildren(el("div", { class: "pl-empty" }, el("div", { class: "pl-empty__art" }, icon("search", "20")), el("b", { text: "Bir dosya seçin" }), el("span", { class: "pl-muted", text: "Sonuçlardan birini seçince eşleşen satırlar burada görünür." }))); return; }
    const st = STATUS[p.status] || STATUS.ad;
    const head = el("div", { class: "fp-filehead" }, extBox(p), el("div", { class: "fp-grow" }, el("h2", { class: "pl-h3", text: p.name }), el("div", { class: "fp-path", text: p.path })));
    const meta = el("div", { class: "fp-meta" }, badge(KIND_LABEL[p.kind] || "Diğer"), badge(C.formatSize(p.size)), badge(C.formatWhen(p.mtime)), badge(st[0], st[1]));
    if (p.hits) meta.appendChild(badge(n(p.hits) + " eşleşen satır", "accent"));
    const actions = el("div", { class: "fp-bar" },
      btn("Aç", "pl-btn--primary", () => D.open(p.id)),
      btn("Klasörde göster", "pl-btn--secondary", () => D.reveal(p.id)),
      btn("Yolu kopyala", "pl-btn--ghost", async () => { await D.copyPath(p.id); toast("Dosya yolu panoya kopyalandı."); }));
    // Etiketler
    const tags = el("div", { class: "fp-tags", "aria-label": "Etiketler" }, ...p.tags.map((t) => {
      const x = el("button", { type: "button", "aria-label": t + " etiketini kaldır" }, icon("x"));
      x.addEventListener("click", guard(async () => { await D.setTags(p.id, p.tags.filter((y) => y !== t)); await loadPreview(); }));
      return el("span", { class: "pl-tag" }, "#" + t, x);
    }));
    const tin = el("input", { class: "pl-input fp-taginput", placeholder: "Etiket ekle ↵", "aria-label": "Etiket ekle", maxlength: "32", id: "tagInput" });
    tin.addEventListener("keydown", guard(async (e) => {
      if (e.key !== "Enter") return;
      const t = C.cleanTag(tin.value);
      if (!t) { toast("Etiket en az 2 harf ya da rakam olmalı.", true); return; }
      await D.setTags(p.id, [...p.tags, t]);
      tin.value = "";
      await loadPreview();
      $("tagInput").focus();
    }));
    tags.appendChild(tin);
    // Önizleme satırları
    const pre = el("div", { class: "fp-pre", role: "region", "aria-label": "Dosya önizlemesi" });
    if (p.status !== "metin") pre.appendChild(el("div", { class: "fp-gap", text: p.status === "buyuk" ? "Dosya, Ayarlar'daki boyut sınırından büyük; yalnız adıyla indekslendi." : p.status === "okunamadi" ? "İçerik okunamadı (ikili ya da şifreli görünüyor). File Pilot şifreli belgeleri açmaz." : "Bu dosya türünün içeriği okunmaz; adı ve klasörüyle bulunur." }));
    else for (const ln of p.lines) {
      if (ln.gap) { pre.appendChild(el("div", { class: "fp-gap", text: "⋯" })); continue; }
      pre.appendChild(el("div", { class: "fp-line" + (ln.hit ? " is-hit" : "") + (state.focusLine === ln.n ? " is-focus" : ""), "data-line": String(ln.n) }, el("span", { class: "fp-line__n", text: String(ln.n) }), el("span", { class: "fp-line__t" }, marked(ln.text, ln.marks))));
    }
    const lineInfo = p.status === "metin" ? el("p", { class: "pl-muted fp-small", text: p.hits ? "Eşleşen satırlar ve çevresi gösteriliyor (" + n(p.total) + " satırın)." : "İlk satırlar gösteriliyor (" + n(p.total) + " satır)." }) : null;
    const sim = el("section", { class: "fp-sim", "aria-label": "Benzer belgeler" }, el("h3", { class: "pl-h3", text: "Benzer belgeler" }));
    if (!state.similar.length) sim.appendChild(el("p", { class: "pl-muted", text: p.status === "metin" ? "İçeriği belirgin biçimde benzeyen başka belge yok." : "Benzerlik yalnız içeriği indekslenen dosyalar için hesaplanır." }));
    for (const d of state.similar) {
      const b = el("button", { type: "button", class: "pl-listrow fp-row" }, extBox(d), el("div", { class: "pl-listrow__main" }, el("div", { class: "pl-listrow__title", text: d.name }), el("div", { class: "pl-listrow__sub", text: where(d) })), badge("%" + Math.round(d.score * 100)));
      b.addEventListener("click", guard(() => select(d.id)));
      sim.appendChild(b);
    }
    box.replaceChildren(head, meta, actions, tags, lineInfo || document.createTextNode(""), pre, sim);
    if (state.focusLine) { const f = pre.querySelector(".is-focus"); if (f) f.scrollIntoView({ block: "center" }); }
  }
  function renderAnswer() {
    const box = $("answer");
    const a = state.answer;
    box.hidden = !a;
    if (!a) { box.replaceChildren(); return; }
    const srcs = el("div", { class: "fp-srcs" }, ...a.sources.map((s) => {
      const b = el("button", { type: "button", class: "fp-src" }, el("b", { text: s.name }), document.createTextNode(s.verified ? " · satır " + s.line + " — “" + s.quote + "”" : " · alıntı doğrulanamadı"));
      b.addEventListener("click", guard(async () => { if (!state.results.some((x) => x.id === s.id)) { state.results.unshift(s); renderRows(); } await select(s.id, s.line); }));
      return b;
    }));
    const close = btn("Kapat", "pl-btn--ghost", () => { state.answer = null; renderAnswer(); });
    box.replaceChildren(el("div", { class: "pl-callout", role: "status" },
      el("div", { class: "pl-callout__title" }, "MyMind yanıtı"),
      el("div", { text: a.answer }),
      a.sources.length ? srcs : el("span", { class: "pl-muted", text: "Yanıt bir kaynağa bağlanamadı; yerel sonuçları kontrol edin." }),
      el("span", { class: "pl-muted fp-small", text: "Yanıt yalnız gönderilen bölümlere dayanır; alıntılar dosyadaki metinle karşılaştırıldı." }), close));
  }
  function renderFolders() {
    const s = state.s;
    $("rescan").disabled = !!s.scanning || !s.roots.length;
    $("stopScan").hidden = !s.scanning;
    $("rootList").replaceChildren(...(s.roots.length ? s.roots.map((r) => el("div", { class: "pl-listrow" },
      icon("folder"),
      el("div", { class: "pl-listrow__main" }, el("div", { class: "pl-listrow__title", text: r }), el("div", { class: "pl-listrow__sub", text: n(s.counts.perRoot[r] || 0) + " dosya" })),
      btn("Listeden çıkar", "pl-btn--ghost", async () => { await D.removeRoot(r); toast("Klasör indeksten çıkarıldı (dosyalara dokunulmadı)."); }))) : [el("p", { class: "pl-muted", text: "Henüz klasör eklenmedi." }), btn("Klasör ekle", "pl-btn--primary", addRoot)]));
    const ls = s.lastScan;
    const kv = el("dl", { class: "pl-kv" });
    const row = (k, v) => { kv.appendChild(el("dt", { text: k })); kv.appendChild(el("dd", { class: "pl-num", text: v })); };
    row("Toplam dosya", n(s.counts.files));
    row("İçeriği indeksli", n(s.counts.text));
    row("Yalnız ad", n(s.counts.nameOnly));
    row("Boyut sınırını aşan", n(s.counts.big));
    row("Okunamayan (ikili/şifreli)", n(s.counts.unreadable));
    if (s.scanning && s.progress) row("Şu an", n(s.progress.files) + " dosya, " + n(s.progress.dirs) + " klasör");
    if (ls) {
      row("Son tarama", new Date(ls.at).toLocaleString("tr-TR"));
      row("Süre", (ls.ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " sn");
      if (ls.stats) { row("Yeniden okunan / değişmeyen", n(ls.stats.read) + " / " + n(ls.stats.reused)); row("Atlanan (hariç/gizli/bağlantı)", n(ls.stats.skipped)); }
    }
    $("scanStats").replaceChildren(kv);
    const errs = ls && ls.errors && ls.errors.length ? ls.errors : [];
    $("scanErrors").replaceChildren(...(errs.length ? [el("p", { class: "pl-muted fp-small fp-warn", text: n(ls.errorCount) + " öğe okunamadı (erişim izni ya da kilitli dosya):" }), el("ul", { class: "fp-steps fp-small" }, ...errs.slice(0, 8).map((e) => el("li", { text: e.path + " — " + e.error })))] : []));
  }
  function renderSettings() {
    const s = state.s;
    if (document.activeElement !== $("excludes")) $("excludes").value = s.settings.excludes.join("\n");
    $("maxSize").replaceChildren(...s.sizes.map((m) => el("option", { value: String(m), text: m + " MB" })));
    $("maxSize").value = String(s.settings.maxSizeMB);
    $("skipHidden").checked = s.settings.skipHidden;
    $("rescanOnStart").checked = s.settings.rescanOnStart;
    $("privacy").replaceChildren(
      el("li", { text: "Dosyalar yalnız okunur. File Pilot taşıma, silme, yeniden adlandırma yapmaz; bu işler için kod yolu yoktur." }),
      el("li", { text: s.vault ? "İndeks (dosya adları, yollar, metin içeriği) bu bilgisayarda Windows kasasıyla (DPAPI) şifreli tutulur." : "Bu sistemde işletim sistemi kasası yok; indeks şifresiz tutulur." }),
      el("li", { text: "Kısayollar (sembolik bağlantılar) izlenmez; seçtiğiniz klasörün dışına çıkılmaz." }),
      el("li", { text: "İçerik okunan türler: " + C.TEXT_EXT.join(", ") + ". PDF ve Office belgeleri bu sürümde adıyla bulunur." }),
      el("li", { text: "Şifreli/ikili dosyaların içeriği okunmaz; \"okunamadı\" olarak işaretlenir." }),
      el("li", { text: "Ağ yalnız MyMind için kullanılır: onayınızla, yerel Hub'a (127.0.0.1) soru + en fazla 8 dosyanın adı ve kısa bölümü gider." }));
  }
  function renderAll() {
    renderNav();
    if (state.view === "search") { renderKinds(); renderRows(); renderDetail(); }
    if (state.view === "folders") renderFolders();
    if (state.view === "settings") renderSettings();
  }

  // ---- Eylemler ----
  async function addRoot() {
    const r = await D.addRoot();
    if (r.cancelled) return;
    if (r.exists) { toast("Bu klasör zaten listede."); return; }
    toast("Klasör eklendi, taranıyor…");
  }
  $("addRoot").addEventListener("click", guard(addRoot));
  $("rescan").addEventListener("click", guard(async () => { const r = await D.scan(); if (r && r.ok) toast(r.stopped ? "Tarama durduruldu; önceki indeks korundu." : n(r.files) + " dosya indekslendi."); }));
  $("stopScan").addEventListener("click", guard(() => D.stopScan()));
  $("search").addEventListener("input", () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(guard(() => { state.query = $("search").value; state.answer = null; renderAnswer(); renderNav(); return runSearch(); }), 90);
  });
  $("saveExcludes").addEventListener("click", guard(async () => { await D.setSettings({ excludes: $("excludes").value.split(/\r?\n/) }); toast("Hariç tutulanlar kaydedildi; yeniden taramada uygulanır."); }));
  $("resetExcludes").addEventListener("click", guard(async () => { await D.setSettings({ excludes: state.s.excludesDefault }); $("excludes").value = state.s.excludesDefault.join("\n"); toast("Varsayılan hariç tutulanlar geri yüklendi."); }));
  $("maxSize").addEventListener("change", guard(() => D.setSettings({ maxSizeMB: Number($("maxSize").value) })));
  $("skipHidden").addEventListener("change", guard(() => D.setSettings({ skipHidden: $("skipHidden").checked })));
  $("rescanOnStart").addEventListener("change", guard(() => D.setSettings({ rescanOnStart: $("rescanOnStart").checked })));

  // MyMind
  const mdlg = $("mymindDialog");
  $("openMymind").addEventListener("click", guard(async () => {
    const st = await D.mymind.status();
    $("mymindInfo").textContent = st.hasKey ? "Anahtar kayıtlı" + (st.vault ? " (Windows kasasında şifreli)." : " (yalnız bu oturumda bellekte).") : "Henüz anahtar yok.";
    $("mymindKey").value = "";
    mdlg.showModal();
  }));
  $("mymindCancel").addEventListener("click", () => mdlg.close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.mymind.setKey($("mymindKey").value); mdlg.close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bu oturum için bellekte tutuluyor."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); mdlg.close(); toast("Anahtar kaldırıldı."); }));
  const adlg = $("askDialog");
  $("askBtn").addEventListener("click", guard(async () => {
    if (!state.s.hasKey) { $("openMymind").click(); toast("Önce MyMind bağlantısını kurun.", true); return; }
    $("askInput").value = state.query && !/[#:"]/.test(state.query) ? state.query : "";
    adlg.showModal();
    $("askInput").focus();
  }));
  $("askCancel").addEventListener("click", () => adlg.close());
  const ask = guard(async () => {
    const q = $("askInput").value.trim();
    if (q.length < 3) { toast("Soru en az 3 karakter olmalı.", true); return; }
    adlg.close();
    busy("MyMind'a soruluyor…");
    try {
      const r = await D.mymind.ask(q, fullQuery());
      if (!r.approved) { toast("Gönderilmedi."); return; }
      if (!r.ok) { toast(r.error, true); return; }
      state.answer = r;
      renderAnswer();
      if (r.sources.length) await select(r.sources[0].id, r.sources[0].line);
    } finally { busy(""); }
  });
  $("askSend").addEventListener("click", ask);
  $("askInput").addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });

  // Klavye
  document.addEventListener("keydown", guard(async (e) => {
    if (e.ctrlKey && !e.shiftKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); if (state.view !== "search") go("search"); $("search").focus(); $("search").select(); return; }
    if (state.view !== "search" || document.querySelector("dialog[open]")) return;
    const inTag = document.activeElement && document.activeElement.id === "tagInput";
    if (inTag) return;
    const i = state.results.findIndex((x) => x.id === state.current);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!state.results.length) return;
      e.preventDefault();
      const j = Math.max(0, Math.min(state.results.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      await select(state.results[j].id);
    } else if (e.key === "Enter" && state.current) {
      e.preventDefault();
      if (e.ctrlKey) await D.reveal(state.current); else await D.open(state.current);
    } else if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c") && state.current) {
      e.preventDefault();
      await D.copyPath(state.current);
      toast("Dosya yolu panoya kopyalandı.");
    } else if (e.key === "Escape" && document.activeElement === $("search") && $("search").value) {
      await setQuery("");
    }
  }));

  // Durum
  D.onState(guard(async (s) => {
    const wasScanning = state.s && state.s.scanning;
    state.s = s;
    renderNav();
    if (state.view === "folders") renderFolders();
    if (state.view === "settings") renderSettings();
    if (state.view === "search" && (wasScanning !== s.scanning || !s.scanning)) {
      if (wasScanning && !s.scanning) await runSearch();
      else renderRows();
    }
  }));
  (async () => {
    try {
      state.s = await D.state();
      renderAll();
      await runSearch();
    } catch (e) { toast("Başlatılamadı: " + clean(e), true); }
    document.documentElement.dataset.ready = "1";
    $("search").focus();
  })();
})();
