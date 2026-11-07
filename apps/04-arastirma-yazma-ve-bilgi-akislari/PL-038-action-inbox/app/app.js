/* Action Inbox — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya ve dosya
 * sistemine doğrudan erişmez; her işlem ana sürece dar IPC ile gider. Seçim (toplu kabul için) yalnız arayüz durumundadır. */
(function () {
  const D = window.axDesktop;
  const C = window.AXCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["review", "tasks", "settings"];
  const state = { s: null, view: "review", tf: "acik", q: "", sel: new Set(), taskSel: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    copy: "M8 8h12v12H8zM4 16V4h12",
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
  const fmtDay = (isoDate) => { if (!isoDate) return ""; const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00" : "")); return isNaN(d) ? "" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short" }); };
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const BUCKET_TONE = { gecikmis: "danger", bugun: "warning", hafta: "accent", sonra: "", tarihsiz: "" };
  const items = () => (state.s ? state.s.items : []);
  const byId = (id) => items().find((x) => x.id === id) || null;
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "review";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("reviewCount").textContent = String(m.review);
    $("taskCount").textContent = String(m.open);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    $("widgetState").textContent = s.widgetOpen ? "Açık" : "Kapalı";
    $("widgetState").className = "pl-badge" + (s.widgetOpen ? " pl-badge--success" : "");
    const accel = s.shortcut.accel.replace("CommandOrControl", s.platform === "darwin" ? "Cmd" : "Ctrl");
    $("shortcutHint").textContent = s.settings.shortcut ? (s.shortcut.ok ? accel + ": kopyaladığınızı her yerden yakalayın" : "Genel kısayol bu oturumda etkin değil") : "Genel kısayol kapalı";
    $("shortcutInline").textContent = accel;
    $("shortcutName").textContent = accel;
    put($("sideInfo"), el("div", { class: "ax-mini__in" },
      el("span", { class: "pl-muted ax-small", text: "Bu hafta tamamlanan" }),
      el("b", { text: String(m.doneThisWeek) + " görev" }),
      el("span", { class: "pl-muted ax-small", text: m.overdue + " gecikmiş · " + m.today + " bugün" }),
      el("span", { class: "pl-muted ax-small", text: "Yinelenen görev: " + pctText(m.duplicateRate) + (m.accepted ? " (" + m.duplicatesAfterAccept + "/" + m.accepted + ")" : "") })));
    const any = items().length > 0;
    $("emptyPanel").hidden = any;
    $("reviewSplit").hidden = !any;
    if (state.view === "review") renderReview();
    if (state.view === "tasks") renderTasks();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Liste öğesi ----------------
  function srcText(src) { return src ? C.srcLabel(src) + (src.url && src.title ? " · " + C.hostOf(src.url) : "") : ""; }
  function itemRow(x, opts) {
    const sel = opts.selected;
    const li = el("li", { class: "ax-item" + (sel ? " is-sel" : "") + (x.status === "tamam" ? " is-done" : ""), "data-id": x.id, tabindex: "0", role: "option", "aria-selected": sel ? "true" : "false" });
    const box = el("input", { type: "checkbox", "aria-label": opts.checkLabel });
    box.checked = opts.checked;
    box.addEventListener("click", (e) => e.stopPropagation());
    box.addEventListener("change", guard(() => opts.onCheck(box.checked)));
    const meta = el("div", { class: "ax-imeta" });
    if (x.due) { const b = C.bucketOf(x, state.s.now); meta.appendChild(badge((b === "gecikmis" ? "Gecikmiş · " : "") + fmtDay(x.due), x.status === "acik" || x.status === "inceleme" ? BUCKET_TONE[b] : "", "Son tarih")); }
    if (x.verb) meta.appendChild(badge(x.verb, "", "Fiil"));
    if (x.materials.length) meta.appendChild(badge(x.materials.length + " materyal", "", x.materials.join(", ")));
    if (x.assignee) meta.appendChild(badge((x.assigneeConfirmed ? "" : "taslak: ") + x.assignee, x.assigneeConfirmed ? "info" : "warning", x.assigneeConfirmed ? "Kişi (onaylı)" : "Kişi ataması taslak"));
    if (x.status === "inceleme" && x.dup) meta.appendChild(badge("olası yineleme", "danger", "“" + x.dup.title + "” ile benzer"));
    if (x.sources.length > 1) meta.appendChild(badge(x.sources.length + " kaynak", "accent"));
    li.append(box, el("div", { class: "ax-item__body" }, el("span", { class: "ax-ititle", text: x.title }), meta, el("span", { class: "ax-src", text: srcText(x.sources[0]) + (x.sources[0] ? " · " + fmtWhen(x.sources[0].capturedAt) : "") })));
    li.addEventListener("click", guard(opts.onOpen));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); li.click(); } });
    return li;
  }

  // ---------------- İnceleme kuyruğu ----------------
  function reviewItems() { return items().filter((x) => x.status === "inceleme").sort((a, b) => a.createdAt - b.createdAt); }
  function renderReview() {
    const list = reviewItems();
    for (const id of [...state.sel]) if (!list.some((x) => x.id === id)) state.sel.delete(id);
    const active = byId(state.s.active);
    const cur = active && active.status === "inceleme" ? active : list[0] || null;
    $("reviewInfo").textContent = list.length + " aday" + (state.sel.size ? " · " + state.sel.size + " seçili" : "");
    $("selAll").checked = list.length > 0 && list.every((x) => state.sel.has(x.id));
    $("acceptSelBtn").disabled = state.sel.size === 0;
    const ul = $("reviewList");
    if (!list.length) put(ul, el("li", { class: "ax-empty", text: items().length ? "İnceleme kuyruğu boş. Yeni metin yakalayın ya da Görevler'e geçin." : "" }));
    else put(ul, ...list.map((x) => itemRow(x, {
      selected: cur && cur.id === x.id, checked: state.sel.has(x.id), checkLabel: "Seç: " + x.title,
      onCheck: (on) => { if (on) state.sel.add(x.id); else state.sel.delete(x.id); renderReview(); },
      onOpen: async () => { apply(await D.item.open(x.id)); },
    })));
    renderDetail($("reviewDetail"), cur);
  }

  // ---------------- Görevler ----------------
  function renderTasks() {
    document.querySelectorAll("[data-tf]").forEach((b) => b.setAttribute("aria-checked", b.dataset.tf === state.tf ? "true" : "false"));
    const q = C.fold(state.q.trim());
    let list = items().filter((x) => x.status === state.tf);
    if (q) list = list.filter((x) => C.fold([x.title, x.verb, x.materials.join(" "), x.assignee, x.sources.map((s) => s.title + " " + s.url).join(" ")].join(" ")).includes(q));
    const now = state.s.now;
    list = state.tf === "acik" ? C.sortTasks(list, now) : list.sort((a, b) => (b.doneAt || b.rejectedAt) - (a.doneAt || a.rejectedAt));
    const active = byId(state.taskSel) || byId(state.s.active);
    const cur = active && active.status === state.tf && list.some((x) => x.id === active.id) ? active : list[0] || null;
    const ul = $("taskList");
    const rows = [];
    let lastBucket = null;
    for (const x of list) {
      if (state.tf === "acik") { const b = C.bucketOf(x, now); if (b !== lastBucket) { rows.push(el("li", { class: "ax-group is-" + b, text: C.BUCKET_NAMES[b] + " (" + list.filter((y) => C.bucketOf(y, now) === b).length + ")" })); lastBucket = b; } }
      rows.push(itemRow(x, {
        selected: cur && cur.id === x.id, checked: x.status === "tamam", checkLabel: x.status === "tamam" ? "Yeniden aç: " + x.title : "Tamamla: " + x.title,
        onCheck: async (on) => { if (x.status === "red") return renderTasks(); apply(await D.item.done(x.id, on)); toast(on ? "Görev tamamlandı." : "Görev yeniden açıldı."); },
        onOpen: () => { state.taskSel = x.id; renderTasks(); },
      }));
    }
    if (!rows.length) rows.push(el("li", { class: "ax-empty", text: q ? "Aramayla eşleşen görev yok." : state.tf === "acik" ? "Açık görev yok. İnceleme kuyruğundaki adayları göreve ekleyin." : state.tf === "tamam" ? "Henüz tamamlanan görev yok." : "Reddedilen aday yok." }));
    put(ul, ...rows);
    renderDetail($("taskDetail"), cur);
  }

  // ---------------- Ayrıntı / düzenleme ----------------
  function excerptNode(excerpt, sentence) {
    const q = el("blockquote", { class: "ax-quote" });
    const t = String(excerpt || "");
    const s = String(sentence || "").replace(/[ \t]+/g, " ").trim();
    const i = s ? t.indexOf(s) : -1;
    if (i < 0) q.textContent = t;
    else q.append(document.createTextNode(t.slice(0, i)), el("mark", { text: s }), document.createTextNode(t.slice(i + s.length)));
    return q;
  }
  function fieldsOf(node) {
    return { title: node.querySelector("#fTitle").value, due: node.querySelector("#fDue").value, materials: node.querySelector("#fMat").value, assignee: node.querySelector("#fWho").value, assigneeConfirmed: node.querySelector("#fWhoOk").checked, verb: node.querySelector("#fVerb").value };
  }
  function renderDetail(node, x) {
    if (!x) { put(node, el("p", { class: "ax-empty", text: state.view === "review" ? "Görev adayı seçin." : "Görev seçin." })); return; }
    const isReview = x.status === "inceleme";
    const statusTone = { inceleme: "warning", acik: "accent", tamam: "success", red: "", birlesti: "" }[x.status];
    const title = el("input", { class: "pl-input ax-dtitle", id: "fTitle", value: x.title, maxlength: "200", "aria-label": "Görev başlığı" });
    const head = el("div", { class: "ax-dhead" },
      el("div", { class: "ax-row" }, badge(C.STATUS_NAMES[x.status], statusTone), x.edited ? badge("düzenlendi", "") : null, x.mode === "tamami" || x.mode === "ilk" ? badge("eylem cümlesi bulunamadı — metin olduğu gibi", "warning") : null,
        x.doneAt ? el("span", { class: "pl-muted ax-small", text: "Tamamlandı: " + fmtWhen(new Date(x.doneAt).toISOString()) }) : null), title);

    // Kaynaklar
    const srcBlock = el("div", { class: "ax-block" }, el("span", { class: "ax-lbl", text: x.sources.length > 1 ? "Kaynaklar (" + x.sources.length + ")" : "Kaynak" }));
    x.sources.forEach((s, i) => {
      const row = el("div", { class: "ax-srcrow" }, badge(C.SOURCE_NAMES[s.type] || "Diğer", "info"), el("span", { class: "ax-src", text: (s.title || (s.url ? C.hostOf(s.url) : "başlıksız")) + " · " + fmtWhen(s.capturedAt) }));
      if (s.url) row.append(el("span", { class: "ax-grow" }), btn("Kaynağı aç", "pl-btn--ghost", async () => { const r = await D.openSource(x.id, i); toast("Tarayıcıda açıldı: " + C.hostOf(r.opened)); }, { "data-src": String(i), title: s.url }));
      srcBlock.append(row, excerptNode(s.excerpt, i === 0 ? x.sentence : ""));
    });

    // Alanlar
    const due = el("input", { class: "pl-input", id: "fDue", type: "date", value: x.due });
    const verb = el("input", { class: "pl-input", id: "fVerb", value: x.verb, maxlength: "40", placeholder: "ör. gönder" });
    const mat = el("input", { class: "pl-input", id: "fMat", value: x.materials.join(", "), maxlength: "1000", placeholder: "virgülle: rapor, sözleşme.pdf, bağlantı" });
    const who = el("input", { class: "pl-input", id: "fWho", value: x.assignee, maxlength: "80", placeholder: "boş = ben" });
    const whoOk = el("input", { type: "checkbox", id: "fWhoOk" });
    whoOk.checked = x.assigneeConfirmed;
    const dueHint = x.due ? (x.dueFrom === "cümle" ? "Metindeki “" + x.dueText + "” ifadesinden (yakalama günü: " + fmtDay((x.sources[0] || {}).capturedAt) + ")" : x.dueFrom === "yakalama" ? "Yakalamanın başka bir yerindeki “" + x.dueText + "” ifadesinden — kontrol edin" : x.dueFrom === "mymind" ? "MyMind önerisi (“" + x.dueText + "”)" : "Elle girildi") : "Metinde son tarih bulunamadı";
    const fields = el("div", { class: "ax-fields" },
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fVerb", text: "Fiil" }), verb),
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fDue", text: "Son tarih" }), due, el("span", { class: "ax-hint", text: dueHint })),
      el("div", { class: "pl-field ax-fields__wide" }, el("label", { class: "pl-field__label", for: "fMat", text: "Gerekli materyal" }), mat),
      el("div", { class: "pl-field ax-fields__wide" }, el("label", { class: "pl-field__label", for: "fWho" }, "Kişi ", el("span", { class: x.assignee && !x.assigneeConfirmed ? "ax-draft" : "pl-muted", text: x.assignee && !x.assigneeConfirmed ? "(taslak — onaylanmadı)" : "(isteğe bağlı)" })), who,
        el("label", { class: "ax-check ax-check--inline" }, whoOk, el("span", { text: "Atamayı onaylıyorum" + (x.assigneeWhy ? " · öneri nedeni: " + x.assigneeWhy : "") }))));
    const block = el("div", { class: "ax-block" }, fields);

    // Yineleme uyarısı
    let dupBox = null;
    if (isReview && x.dup) {
      const target = byId(x.dup.id);
      if (target && target.status !== "red" && target.status !== "birlesti") {
        dupBox = el("div", { class: "pl-callout pl-callout--warning", id: "dupBox" },
          el("div", {}, el("b", { text: "Olası yineleme: " }), "“" + target.title + "” (" + C.STATUS_NAMES[target.status].toLowerCase() + ", benzerlik %" + Math.round(x.dup.score * 100) + "). Aynı işse kaynağı mevcut göreve ekleyin; görev çoğalmaz."),
          el("div", { class: "ax-row" },
            btn("Mevcut göreve birleştir", "pl-btn--secondary", async () => { apply(await D.item.merge(x.id, target.id)); toast("Kaynak “" + target.title + "” görevine eklendi; yeni görev açılmadı."); }, { id: "mergeBtn" }),
            btn("Yine de ayrı görev", "pl-btn--ghost", async () => { apply(await D.item.accept(x.id, { ...fieldsOf(node), ignoreDup: true })); toast("Ayrı görev olarak eklendi."); }, { id: "ignoreDupBtn" })));
      }
    }

    // MyMind önerisi
    let aiBox = null;
    if (x.ai) {
      const lines = [x.ai.title ? "Başlık: " + x.ai.title : "", x.ai.verb ? "Fiil: " + x.ai.verb : "", x.ai.due ? "Son tarih: " + fmtDay(x.ai.due) + " (“" + x.ai.dueText + "”)" : "Son tarih: yok", x.ai.materials.length ? "Materyal: " + x.ai.materials.join(", ") : "", x.ai.assignee ? "Kişi (taslak): " + x.ai.assignee : "", x.ai.note ? "Not: " + x.ai.note : ""].filter(Boolean);
      aiBox = el("div", { class: "ax-block ax-block--ai", id: "aiBox" }, el("div", { class: "ax-row" }, icon("spark"), el("b", { text: "MyMind önerisi" }), x.ai.dropped ? badge(x.ai.dropped + " öğe denetimde atıldı", "warning", "Metinde olmayan kişi ya da çözülemeyen tarih") : null),
        ...lines.map((l) => el("span", { class: "ax-small", text: l })), el("div", { class: "ax-row" }, btn("Öneriyi uygula", "pl-btn--secondary", async () => { apply(await D.ai.apply(x.id)); toast("MyMind önerisi uygulandı (kişi ataması taslak)."); }, { id: "aiApplyBtn" })));
    }

    // Eylemler
    const save = async () => { apply(await D.item.update(x.id, fieldsOf(node))); toast("Kaydedildi."); };
    const actions = el("div", { class: "ax-row" });
    if (isReview) {
      actions.append(
        btn("Göreve ekle", "pl-btn--primary", async () => { const f = fieldsOf(node); apply(await D.item.accept(x.id, f)); toast("Görev eklendi" + (f.assignee && !f.assigneeConfirmed ? " (kişi ataması taslak)." : ".")); }, { id: "acceptBtn" }),
        btn("Reddet", "pl-btn--ghost", async () => { apply(await D.item.reject(x.id)); toast("Aday reddedildi (Görevler → Reddedilen'de durur)."); }, { id: "rejectBtn" }),
        btn("Kaydet", "pl-btn--ghost", save, { id: "saveBtn" }),
        el("span", { class: "ax-grow" }),
        btn("MyMind ile çıkar", "pl-btn--ghost", aiRun(x), { id: "aiBtn" }));
    } else if (x.status === "acik" || x.status === "tamam") {
      actions.append(
        x.status === "acik" ? btn("Tamamlandı", "pl-btn--primary", async () => { apply(await D.item.done(x.id, true)); toast("Görev tamamlandı."); }, { id: "doneBtn" }) : btn("Yeniden aç", "pl-btn--secondary", async () => { apply(await D.item.done(x.id, false)); toast("Görev yeniden açıldı."); }, { id: "reopenBtn" }),
        btn("Kaydet", "pl-btn--ghost", save, { id: "saveBtn" }), el("span", { class: "ax-grow" }), btn("MyMind ile çıkar", "pl-btn--ghost", aiRun(x), { id: "aiBtn" }));
    } else if (x.status === "red") {
      actions.append(btn("İncelemeye geri al", "pl-btn--secondary", async () => { apply(await D.item.toReview(x.id)); toast("Aday inceleme kuyruğuna geri alındı."); }, { id: "toReviewBtn" }));
    }

    // Kabulden sonra yineleme fark edilirse: başka açık göreve birleştir (ölçüye "yinelenen görev" olarak girer)
    let mergeBox = null;
    if (x.status === "acik") {
      const others = items().filter((y) => y.id !== x.id && (y.status === "acik" || y.status === "tamam")).map((y) => ({ y, s: C.similarity(x.title + " " + x.verb, y.title + " " + y.verb) })).sort((a, b) => b.s - a.s).slice(0, 8);
      if (others.length) {
        const sel = el("select", { class: "pl-input ax-select", id: "mergeSel", "aria-label": "Birleştirilecek görev" }, ...others.map(({ y, s }) => el("option", { value: y.id, text: y.title.slice(0, 60) + (s ? " (%" + Math.round(s * 100) + ")" : "") })));
        mergeBox = el("div", { class: "ax-row" }, el("span", { class: "pl-muted ax-small", text: "Bu görev başka bir görevin yinelemesi mi?" }), sel,
          btn("Ona birleştir", "pl-btn--ghost", async () => { const target = byId(sel.value); apply(await D.item.merge(x.id, sel.value)); state.taskSel = sel.value; toast("Yineleme birleştirildi: kaynak “" + target.title + "” görevine eklendi."); }, { id: "mergeTaskBtn" }));
      }
    }
    put(node, head, dupBox, srcBlock, block, aiBox, actions, mergeBox);
  }
  function aiRun(x) {
    return async () => {
      busy("MyMind çıkarıyor…");
      const r = await D.ai.extract(x.id);
      busy(null);
      if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
      apply(r.state);
      toast("MyMind önerisi hazır" + (r.dropped ? "; " + r.dropped + " öğe denetimde atıldı" : "") + ". Uygulamak için “Öneriyi uygula”.");
    };
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(String(m.sourcedDoneThisWeek) + "/" + m.doneThisWeek, "bu hafta tamamlanan (kaynaklı/tümü)", m.doneThisWeek ? "is-ok" : ""),
      card(pctText(m.duplicateRate), "yinelenen görev (hedef < %3)" + (m.accepted ? " · " + m.duplicatesAfterAccept + "/" + m.accepted : ""), m.duplicateRate == null ? "" : m.duplicateRate < 3 ? "is-ok" : "is-bad"),
      card(String(m.prevented), "önlenen yineleme (incelemede birleştirilen)"),
      card(pctText(m.acceptRate), "aday kabul oranı (" + m.reviewed + " incelendi)"),
      card(String(m.open), "açık görev · " + m.overdue + " gecikmiş", m.overdue ? "is-bad" : ""),
      card(pctText(m.editedRate), "kabulde düzenlenen"),
      card(pctText(m.withDue), "son tarihli açık görev"),
      card(String(m.assigneeDrafts), "onaylanmamış kişi taslağı", m.assigneeDrafts ? "is-bad" : ""));
    const max = Math.max(1, ...m.weeks.map((w) => w.done));
    put($("weeks"), ...m.weeks.map((w, i) => el("div", { class: "ax-week", title: w.sourced + " kaynaklı / " + w.done + " tamamlanan; " + w.created + " görev eklendi" }, el("b", { text: String(w.done) }),
      (() => { const b = el("div", { class: "ax-week__bar" + (i === 3 ? " is-now" : "") }); b.style.height = Math.round((w.done / max) * 70) + "%"; return b; })(), el("span", { text: i === 3 ? "bu hafta" : fmtDay(w.start) }))));
    const g = s.gold;
    $("goldInfo").textContent = g ? "Örnek yakalamalarda (elle etiketli " + g.items + " aday): fiil doğruluğu " + pctText(g.verbAccuracy) + ", son tarih doğruluğu " + pctText(g.dueAccuracy) + ", yineleme tespiti kesinliği " + pctText(g.dupPrecision) + " / duyarlılığı " + pctText(g.dupRecall) + ". Gerçek yakalamalarınızda ölçülmemiştir." : "";
    const dt = $("defType");
    if (!dt.options.length) for (const t of C.SOURCE_TYPES.filter((x) => x !== "pano" && x !== "dosya")) dt.appendChild(el("option", { value: t, text: C.SOURCE_NAMES[t] }));
    dt.value = s.settings.defaultType;
    $("setShortcut").checked = s.settings.shortcut;
    $("shortcutState").textContent = s.settings.shortcut ? (s.shortcut.ok ? "(etkin)" : "(bu oturumda kaydedilemedi — başka bir uygulama kullanıyor olabilir)") : "";
    $("setOnTop").checked = s.settings.widgetOnTop;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Görevler, yakalanan metinler ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: görevler düz JSON olarak saklanır, MyMind anahtarı yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  function openCapture() {
    const s = state.s;
    const sel = $("capType");
    if (!sel.options.length) for (const t of C.SOURCE_TYPES.filter((x) => x !== "pano" && x !== "dosya")) sel.appendChild(el("option", { value: t, text: C.SOURCE_NAMES[t] }));
    sel.value = s.settings.defaultType;
    $("capText").value = ""; $("capTitle").value = ""; $("capUrl").value = "";
    $("capDialog").showModal();
    $("capText").focus();
  }
  const capResult = (r, what) => toast(r.added + " görev adayı inceleme kuyruğuna eklendi" + (r.dups ? " · " + r.dups + " olası yineleme" : "") + (what ? " (" + what + ")" : "") + ".");
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", openCapture));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); apply(r.state); go("review"); capResult(r, "panodan"); })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    apply(r.state); go("review");
    toast(r.added + " görev adayı " + (r.files - r.skipped) + " dosyadan eklendi" + (r.dups ? " · " + r.dups + " olası yineleme" : "") + (r.skipped ? " · " + r.skipped + " dosya atlandı (boş, 2 MB üstü ya da .txt/.md değil)" : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.sample(); apply(r.state); go("review"); capResult(r, "örnek"); })));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const text = $("capText").value;
    if (!text.trim()) return toast("Yakalanacak metni yapıştırın.", true);
    const r = await D.capture.text(text, { type: $("capType").value, title: $("capTitle").value, url: $("capUrl").value.trim() });
    $("capDialog").close();
    apply(r.state); go("review"); capResult(r);
  }));
  $("selAll").addEventListener("change", () => { const list = reviewItems(); if ($("selAll").checked) list.forEach((x) => state.sel.add(x.id)); else state.sel.clear(); renderReview(); });
  $("acceptSelBtn").addEventListener("click", guard(async () => {
    const r = await D.item.acceptMany([...state.sel]);
    state.sel.clear();
    apply(r.state);
    toast(r.accepted + " aday göreve eklendi" + (r.held ? " · " + r.held + " olası yineleme incelemede bekletildi" : "") + ".");
  }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tf]").forEach((b) => b.addEventListener("click", () => { state.tf = b.dataset.tf; state.taskSel = null; renderTasks(); }));
  $("q").addEventListener("input", () => { state.q = $("q").value; renderTasks(); });
  $("openWidget").addEventListener("click", guard(async () => { if (state.s.widgetOpen) await D.widget.close(); else await D.widget.open(); }));
  $("defType").addEventListener("change", guard(async () => apply(await D.setSettings({ defaultType: $("defType").value }))));
  $("setShortcut").addEventListener("change", guard(async () => { apply(await D.setSettings({ shortcut: $("setShortcut").checked })); toast($("setShortcut").checked ? "Genel kısayol açıldı." : "Genel kısayol kapatıldı."); }));
  $("setOnTop").addEventListener("change", guard(async () => apply(await D.setSettings({ widgetOnTop: $("setOnTop").checked }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  const exp = (fn, what) => guard(async () => { const r = await fn(); if (r.cancelled) return; toast("“" + r.file + "” kaydedildi" + (r.count != null ? " (" + r.count + " " + what + ")" : "") + "."); });
  $("mdBtn").addEventListener("click", exp(D.exportMd, "açık görev"));
  $("icsBtn").addEventListener("click", exp(D.exportIcs, "görev"));
  $("csvBtn").addEventListener("click", exp(D.exportCsv, "kayıt"));
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
  D.state().then((s) => { apply(s); go(s.metrics.review || !s.items.length ? "review" : "tasks"); document.documentElement.dataset.ready = "1"; });
})();
