/* Source Trail — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa, panoya ve dosya sistemine doğrudan erişmez; kayıt, pano ve dışa aktarma ana süreçte yapılır.
 * İddia durumları, kopya grupları ve kaynakça önizlemesi aynı çekirdekle (src/core.js, saf işlevler) burada hesaplanır. */
(function () {
  const D = window.stDesktop;
  const C = window.STCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["claims", "sources", "biblio", "settings"];
  const STATUS_TONE = { guclu: "success", tek: "info", celiskili: "warning", eksik: "accent", etiketsiz: "danger" };
  const STATUS_SHORT = { guclu: "Kanıtlı", tek: "Tek kaynak", celiskili: "Çelişkili", eksik: "Eksik (etiketli)", etiketsiz: "Kaynaksız" };
  const state = { s: null, ev: null, view: "claims", claimId: null, sourceId: null, editClaim: false, claimFilter: "", sourceQ: "", archivedSources: false, ai: null, format: null, scope: null, draft: null };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
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
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
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
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const btn = (text, cls, onclick, extra) => el("button", { class: "pl-btn " + (cls || "pl-btn--ghost pl-btn--sm"), type: "button", text, onclick: guard(onclick), ...(extra || {}) });
  const pct = (v) => "%" + String(v).replace(".", ",");
  const project = () => (state.s ? state.s.settings.project : "");
  const data = () => ({ sources: state.s.sources, claims: state.s.claims });
  const srcById = (id) => state.s.sources.find((x) => x.id === id);
  const srcName = (s) => s.title || C.hostOf(s.url) || "Başlıksız kaynak";

  // ---------------- Gezinme ----------------
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "claims";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { const on = b.dataset.nav === state.view; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
  }

  // ---------------- Durum ----------------
  function setState(s) {
    state.s = s;
    if (state.format == null) { state.format = s.settings.format; state.scope = s.settings.scope; }
    render();
  }
  function render() {
    const s = state.s;
    if (!s) return;
    state.ev = C.evaluateAll(data(), project());
    const t = state.ev.tally;
    $("claimCount").textContent = String(t.total);
    $("sourceCount").textContent = String(t.sources);
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    const pf = $("projectFilter");
    put(pf, el("option", { value: "", text: "Tüm projeler" }), ...s.projects.map((p) => el("option", { value: p, text: p })));
    pf.value = s.projects.includes(project()) ? project() : "";
    put($("projectList"), ...s.projects.map((p) => el("option", { value: p })));
    put($("sideInfo"),
      el("span", { class: "pl-muted st-small", text: "Kaynağı ya da eksik etiketi olan iddia" }),
      el("b", { class: t.total ? (t.coveredPct === 100 ? "is-ok" : "is-bad") : "", text: t.total ? pct(t.coveredPct) : "—" }),
      el("span", { class: "pl-muted st-small", text: t.independentSources + " bağımsız kaynak" + (t.copies ? " · " + t.copies + " kopya" : "") }));
    renderClaims();
    renderSources();
    renderBiblio();
    renderMetrics();
  }

  // ---------------- İddialar ----------------
  function visibleClaims() {
    const f = state.claimFilter;
    return state.s.claims.filter((c) => (!project() || c.project === project()) && (f === "arsiv" ? c.archived : !c.archived && (!f || (state.ev.results[c.id] && state.ev.results[c.id].status === f))));
  }
  function renderClaims() {
    const list = visibleClaims();
    if (state.claimId && !state.s.claims.some((c) => c.id === state.claimId)) state.claimId = null;
    if (!state.claimId && list.length) state.claimId = list[0].id;
    put($("claimList"), ...(list.length ? list.map((c) => {
      const r = state.ev.results[c.id];
      return el("li", {}, el("button", { class: "st-item" + (c.id === state.claimId ? " is-active" : "") + (c.archived ? " is-archived" : ""), type: "button", "data-claim": c.id, onclick: () => { state.claimId = c.id; state.editClaim = false; renderClaims(); } },
        el("span", { class: "st-item__title", text: c.text }),
        el("span", { class: "st-item__meta" }, c.archived ? badge("Arşivde") : badge(STATUS_SHORT[r.status], STATUS_TONE[r.status]),
          r ? el("span", { text: r.independentSupport + " bağımsız destek" + (r.refute ? " · " + r.refute + " çürüten" : "") }) : null,
          c.project && !project() ? el("span", { text: "· " + c.project }) : null)));
    }) : [el("li", { class: "st-empty", text: state.s.claims.length ? "Bu süzgece uyan iddia yok." : "Henüz iddia yok. Yukarıya bir iddia yazın ya da Kaynakça bölümünden örnek projeyi ekleyin." })]));
    renderClaimDetail();
  }
  function renderClaimDetail() {
    const box = $("claimDetail");
    const c = state.s.claims.find((x) => x.id === state.claimId);
    if (!c) {
      put(box, el("div", { class: "st-empty" }, el("p", { text: "Bir iddia seçin. İddia kartı, bir sonucun hangi kaynağa ve hangi alıntıya dayandığını gösterir; kaynağı yoksa açıkça “eksik kanıt” olarak etiketlenir." }),
        btn("Örnek projeyi ekle", "pl-btn--secondary pl-btn--sm", loadSample)));
      return;
    }
    const r = state.ev.results[c.id] || C.evaluateClaim(c, Object.fromEntries(state.s.sources.map((s) => [s.id, s])), C.groupSources(state.s.sources));
    const head = el("div", { class: "st-bar" }, c.archived ? badge("Arşivde") : badge(C.STATUS_NAMES[r.status], STATUS_TONE[r.status]), c.project && !project() ? badge(c.project) : null, el("span", { class: "st-grow" }),
      el("span", { class: "st-row st-nowrap" }, c.archived ? null : btn(state.editClaim ? "Vazgeç" : "Düzenle", null, () => { state.editClaim = !state.editClaim; renderClaimDetail(); }),
        btn(c.archived ? "Geri al" : "Arşivle", null, async () => { setState(await D.archiveClaim(c.id, !c.archived)); toast(c.archived ? "İddia geri alındı." : "İddia arşivlendi (geri alınabilir)."); })));
    const parts = [head];
    if (state.editClaim) {
      const ta = el("textarea", { class: "pl-input st-area", id: "editClaimText", maxlength: "2000", rows: "3", value: c.text, "aria-label": "İddia metni" });
      const pr = el("input", { class: "pl-input", id: "editClaimProject", maxlength: "80", value: c.project, list: "projectList", placeholder: "Proje (isteğe bağlı)", "aria-label": "Proje" });
      parts.push(el("div", { class: "st-stack" }, ta, pr, el("div", { class: "st-row" }, btn("Kaydet", "pl-btn--primary pl-btn--sm", async () => {
        const res = await D.saveClaim({ id: c.id, text: ta.value, project: pr.value });
        state.editClaim = false; setState(res.state); toast("İddia güncellendi.");
      }))));
    } else parts.push(el("p", { class: "st-claimtext", text: c.text }));
    if (!c.archived) {
      const msg = {
        etiketsiz: ["warning", "Bu iddianın erişilebilir kayıtlı kaynağı da, eksik etiketi de yok.", "Doğrulama ölçütünü bozar: kaynak bağlayın ya da aşağıdan “eksik kanıt” olarak etiketleyin."],
        eksik: ["accent", "Eksik kanıt olarak etiketli.", c.missingNote || "Kaynak bulunca bağlayın; etiket kendiliğinden geçersiz olur."],
        tek: ["accent", "Yalnız tek bağımsız kaynak destekliyor.", "Kopyalar (aynı adres/metin) bağımsız sayılmaz. İkinci bağımsız kaynak güveni artırır."],
        celiskili: ["warning", "Kaynaklar çelişiyor.", "Destekleyen ve çürüten kaynak birlikte var; sonucu yazarken ikisini de belirtin."],
        guclu: ["success", "En az iki bağımsız kaynak destekliyor.", ""],
      }[r.status];
      parts.push(el("div", { class: "pl-callout pl-callout--" + msg[0] }, icon(r.status === "guclu" ? "check" : "alert"), el("div", {}, el("div", { class: "pl-callout__title", text: msg[1] }), msg[2] ? el("span", { text: msg[2] }) : null)));
      for (const w of r.warnings.filter((x) => x.kind === "kopya")) parts.push(el("p", { class: "st-warn", text: "⚠ " + w.text }));
    }
    // Bağlar
    const groups = state.ev.groups;
    const links = c.links.map((l) => {
      const s = srcById(l.sourceId);
      if (!s) return null;
      const lr = r.links.find((x) => x.sourceId === l.sourceId);
      const copies = s.archived ? 0 : state.s.sources.filter((x) => !x.archived && x.id !== s.id && groups.groupOf[x.id] === groups.groupOf[s.id]).length;
      const seg = el("div", { class: "pl-segment", role: "radiogroup", "aria-label": "İlişki" }, ...C.RELATIONS.map((rel) => el("button", { type: "button", role: "radio", class: rel === l.relation ? "is-active" : "", "aria-checked": rel === l.relation ? "true" : "false", text: C.REL_NAMES[rel], disabled: c.archived || s.archived,
        onclick: guard(async () => { setState(await D.setLink(c.id, { ...l, relation: rel })); }) })));
      const meta = [C.TYPE_NAMES[s.type], C.hostOf(s.url), s.accessed ? "erişim " + C.trDate(s.accessed) : "", s.archived ? "arşivde" : ""].filter(Boolean).join(" · ");
      return el("li", { class: "st-link st-link--" + l.relation + (lr && !lr.counts ? " is-void" : ""), "data-link": s.id },
        el("div", { class: "st-link__head" }, seg, copies ? badge("kopya grubu: " + (copies + 1), "warning") : null, l.by === "mymind" ? badge("MyMind taslağından") : null, el("span", { class: "st-grow" }),
          el("span", { class: "st-row st-nowrap" }, btn("Kartı aç", null, () => openSource(s.id)), c.archived ? null : btn("Bağı kaldır", null, async () => { setState(await D.removeLink(c.id, s.id)); toast("Bağ kaldırıldı."); }))),
        el("span", { class: "st-link__title", text: srcName(s) }),
        el("span", { class: "st-item__meta", text: meta }),
        l.quote ? el("blockquote", { class: "st-quote", text: "“" + l.quote + "”" }) : el("span", { class: "pl-muted st-small", text: "Alıntısız bağ" }),
        l.quote ? el("span", { class: lr && lr.quoteOk ? "pl-muted st-small" : "st-warn", text: lr && lr.quoteOk ? "✓ Alıntı kaynak kartındaki metinde aynen var" : "⚠ Alıntı kaynak metninde aynen yok — kanıt sayılmaz" }) : null,
        lr && !lr.accessible ? el("span", { class: "st-warn", text: "⚠ Kaynak erişilebilir değil (adres ya da künye eksik veya ulaşılamıyor işaretli) — kanıt sayılmaz" }) : null,
        l.note ? el("span", { class: "pl-muted st-small", text: "Not: " + l.note }) : null);
    }).filter(Boolean);
    parts.push(el("div", { class: "st-bar" }, el("h3", { class: "pl-h3 st-h", text: "Kanıtlar" }), badge(String(links.length))));
    parts.push(links.length ? el("ul", { class: "st-links" }, ...links) : el("p", { class: "pl-muted st-small", text: "Bu iddiaya henüz kaynak bağlanmadı." }));
    if (!c.archived) {
      parts.push(addLinkForm(c));
      const miss = el("input", { type: "checkbox", id: "missingChk", checked: c.missing });
      const note = el("input", { class: "pl-input st-grow", id: "missingNote", maxlength: "400", value: c.missingNote, placeholder: "Neden eksik? Ne aranıyor? (isteğe bağlı)", "aria-label": "Eksik kanıt notu" });
      parts.push(el("div", { class: "st-stack" }, el("label", { class: "st-check" }, miss, el("span", {}, el("b", { text: "Eksik kanıt" }), " — bu iddia için henüz yeterli kaynak yok (açık etiket)")),
        el("div", { class: "st-row" }, note, btn("Etiketi kaydet", "pl-btn--secondary pl-btn--sm", async () => { setState(await D.setMissing(c.id, miss.checked, note.value)); toast(miss.checked ? "Eksik kanıt etiketi kaydedildi." : "Eksik etiketi kaldırıldı."); }))));
      parts.push(aiBox(c));
    }
    put(box, ...parts);
  }
  function addLinkForm(c) {
    const used = new Set(c.links.map((l) => l.sourceId));
    const pool = state.s.sources.filter((s) => !s.archived && !used.has(s.id)).sort((a, b) => (b.project === c.project) - (a.project === c.project));
    if (!pool.length) return el("div", { class: "st-addlink" }, el("span", { class: "pl-muted st-small", text: state.s.sources.some((s) => !s.archived) ? "Tüm kaynaklar bu iddiaya bağlı." : "Bağlamak için önce Kaynaklar bölümünde bir kaynak kartı oluşturun (Panodan yakala)." }), btn("Kaynaklara git", null, () => go("sources")));
    const sel = el("select", { class: "pl-input st-select", id: "linkSource", "aria-label": "Kaynak" }, ...pool.map((s) => el("option", { value: s.id, text: srcName(s) + (s.project && s.project !== c.project ? " · " + s.project : "") })));
    const rel = el("select", { class: "pl-input st-select st-select--sm", id: "linkRelation", "aria-label": "İlişki" }, ...C.RELATIONS.map((r) => el("option", { value: r, text: C.REL_NAMES[r] })));
    const q = el("textarea", { class: "pl-input st-area st-area--sm", id: "linkQuote", maxlength: "6000", rows: "2", placeholder: "Dayanak alıntı — kaynak kartındaki metinden aynen kopyalayın (isteğe bağlı ama önerilir)", "aria-label": "Bağ alıntısı", spellcheck: "false" });
    const preview = el("blockquote", { class: "st-quote st-small", id: "linkSourceQuote" });
    const showQ = () => { const s = srcById(sel.value); preview.textContent = s && s.quote ? s.quote : "(Bu kaynak kartında kayıtlı metin yok; alıntısız bağlanabilir.)"; };
    sel.addEventListener("change", showQ); showQ();
    const note = el("input", { class: "pl-input", id: "linkNote", maxlength: "600", placeholder: "Bağ notu (isteğe bağlı)", "aria-label": "Bağ notu" });
    return el("div", { class: "st-addlink" }, el("b", { class: "st-small", text: "Kanıt bağla" }), el("div", { class: "st-row" }, sel, rel), preview, q, note,
      el("div", { class: "st-row" }, btn("Bağla", "pl-btn--primary pl-btn--sm", async () => {
        const s = await D.setLink(c.id, { sourceId: sel.value, relation: rel.value, quote: q.value, note: note.value });
        setState(s); toast("Kaynak bağlandı.");
      }, { id: "linkAdd" })));
  }
  function aiBox(c) {
    const box = el("div", { class: "st-ai" }, el("div", { class: "st-bar" }, el("b", { class: "st-small", text: "MyMind karşılaştırma taslağı" }), el("span", { class: "st-grow" }),
      btn("Karşılaştır", "pl-btn--secondary pl-btn--sm", () => compare(c.id), { id: "aiBtn", disabled: !c.links.length })),
      el("span", { class: "pl-muted st-small", text: "Bağlı kaynakların kayıtlı alıntılarını iddiayla karşılaştırır. Taslaktır: alıntı uydurmaz, kaynakta aynen olmayan alıntı atılır; siz uygulamadıkça bağ değişmez." }));
    const a = state.ai && state.ai.claimId === c.id ? state.ai : null;
    if (a) {
      if (a.summary) box.appendChild(el("p", { class: "st-small", text: "Özet (taslak): " + a.summary }));
      if (a.dropped) box.appendChild(el("p", { class: "st-warn", text: "⚠ " + a.dropped + " önerilen alıntı kaynak metninde aynen bulunmadığı için atıldı." }));
      for (const it of a.items) {
        const s = srcById(it.sourceId);
        const can = C.RELATIONS.includes(it.relation) && s && !s.archived;
        box.appendChild(el("div", { class: "st-ai__row", "data-ai": it.sourceId }, el("div", { class: "st-row" }, badge(it.label), el("b", { class: "st-small", text: s ? srcName(s) : "?" }), badge(C.REL_NAMES[it.relation] || it.relation, it.relation === "destekler" ? "success" : it.relation === "curutur" ? "danger" : ""), el("span", { class: "st-grow" }),
          can ? btn("Uygula", "pl-btn--ghost pl-btn--sm", async () => { setState(await D.mymind.apply(c.id, it)); it.applied = true; toast("Taslak ilişki bağa uygulandı."); renderClaimDetail(); }, { disabled: !!it.applied }) : null),
        it.quote ? el("blockquote", { class: "st-quote", text: "“" + it.quote + "”" }) : null,
        it.reason ? el("span", { class: "pl-muted st-small", text: it.reason }) : null,
        it.note ? el("span", { class: "st-warn", text: "⚠ " + it.note }) : null));
      }
    }
    return box;
  }
  const compare = async (id) => {
    if (!state.s.hasKey) { openMymind(); return; }
    busy("MyMind karşılaştırıyor…");
    const r = await D.mymind.compare(id);
    busy(null);
    if (!r.approved) { toast("Gönderilmedi; hiçbir veri paylaşılmadı."); return; }
    state.ai = { claimId: id, ...r };
    renderClaimDetail();
    toast("Taslak hazır: " + r.items.length + " kaynak" + (r.dropped ? " · " + r.dropped + " uydurma alıntı atıldı" : ""));
  };

  // ---------------- Kaynaklar ----------------
  function visibleSources() {
    const q = C.lowerTr(state.sourceQ.trim());
    return state.s.sources.filter((s) => (!project() || s.project === project()) && (state.archivedSources ? s.archived : !s.archived) &&
      (!q || C.lowerTr([s.title, s.authors, s.publisher, s.url, s.quote, s.note].join(" ")).includes(q)));
  }
  function renderSources() {
    const list = visibleSources();
    const g = state.ev.groups;
    const size = {};
    for (const s of state.s.sources) if (!s.archived) size[g.groupOf[s.id]] = (size[g.groupOf[s.id]] || 0) + 1;
    const usedCount = {};
    for (const c of state.s.claims) if (!c.archived) for (const l of c.links) usedCount[l.sourceId] = (usedCount[l.sourceId] || 0) + 1;
    put($("sourceList"), ...(list.length ? list.map((s) => el("li", {}, el("button", { class: "st-item" + (s.id === state.sourceId ? " is-active" : "") + (s.archived ? " is-archived" : ""), type: "button", "data-source": s.id, onclick: () => openSource(s.id) },
      el("span", { class: "st-item__title", text: srcName(s) }),
      el("span", { class: "st-item__meta" }, badge(C.TYPE_NAMES[s.type]), C.hostOf(s.url) ? el("span", { text: C.hostOf(s.url) }) : null, s.accessed ? el("span", { text: "· " + C.trDate(s.accessed) }) : null,
        !s.archived && size[g.groupOf[s.id]] > 1 ? badge("kopya grubu: " + size[g.groupOf[s.id]], "warning") : null,
        s.unreachable ? badge("ulaşılamıyor", "danger") : !C.isAccessible(s) && !s.archived ? badge("künye eksik", "warning") : null,
        usedCount[s.id] ? el("span", { text: "· " + usedCount[s.id] + " iddia" }) : null)))) :
      [el("li", { class: "st-empty", text: state.archivedSources ? "Arşivde kaynak yok." : "Henüz kaynak yok. Tarayıcıda alıntıyı ve adresi kopyalayıp “Panodan yakala”ya basın ya da “Yeni kaynak” ile künyeyi elle girin." })]));
    renderSourceForm();
  }
  function fillForm(s) {
    $("fTitle").value = s.title || ""; $("fUrl").value = s.url || ""; $("fAuthors").value = s.authors || ""; $("fPublisher").value = s.publisher || "";
    $("fPublished").value = s.published || ""; $("fAccessed").value = s.accessed || C.today(); $("fQuote").value = s.quote || ""; $("fNote").value = s.note || "";
    $("fProject").value = s.project != null ? s.project : project(); $("fType").value = s.type || "web"; $("fUnreachable").checked = !!s.unreachable;
    put($("fCopyOf"), el("option", { value: "", text: "— bağımsız kaynak —" }), ...state.s.sources.filter((x) => !x.archived && x.id !== s.id).map((x) => el("option", { value: x.id, text: srcName(x) })));
    $("fCopyOf").value = s.copyOf || "";
  }
  function renderSourceForm() {
    const s = state.sourceId ? srcById(state.sourceId) : null;
    if (state.sourceId && !s) state.sourceId = null;
    $("sourceFormTitle").textContent = s ? (s.archived ? "Kaynak kartı (arşivde)" : "Kaynak kartı") : "Yeni kaynak kartı";
    if (!$("fType").options.length) put($("fType"), ...C.TYPES.map((t) => el("option", { value: t, text: C.TYPE_NAMES[t] })));
    // Form yalnız gösterilen kart değişince yeniden doldurulur (yazılan ama kaydedilmemiş değerler ve panodan yakalanan taslak korunur).
    const sig = s ? s.id + ":" + s.updated : state.draft && state.draft.startsWith("cap:") ? state.draft : "new";
    if (state.draft !== sig) { fillForm(s || { accessed: C.today() }); state.draft = sig; }
    const reasons = s && !s.archived ? state.ev.groups.reasons[s.id] : null;
    put($("sourceBadges"), s && s.archived ? badge("Arşivde") : null, reasons ? badge("kopya: " + reasons.join(", "), "warning") : null, s && !s.archived ? (C.isAccessible(s) ? badge("erişilebilir", "success") : badge("kanıt sayılmaz", "warning")) : null);
    document.querySelector('[data-act="archiveSource"]').textContent = s && s.archived ? "Geri al" : "Arşivle";
    document.querySelector('[data-act="archiveSource"]').disabled = !s;
    const users = s ? state.s.claims.filter((c) => !c.archived && c.links.some((l) => l.sourceId === s.id)) : [];
    put($("sourceUsedBy"), ...(users.length ? [el("b", { class: "st-small", text: "Bu kaynağa dayanan iddialar" }), ...users.map((c) => {
      const l = c.links.find((x) => x.sourceId === s.id);
      return el("button", { class: "pl-btn pl-btn--ghost pl-btn--sm", type: "button", text: C.REL_NAMES[l.relation] + ": " + c.text.slice(0, 90), onclick: () => { state.claimId = c.id; go("claims"); renderClaims(); } });
    })] : []));
  }
  function openSource(id) { state.sourceId = id; state.draft = null; const s = srcById(id); if (s && s.archived) state.archivedSources = true; $("showArchivedSources").checked = state.archivedSources; go("sources"); renderSources(); }
  const formSource = () => ({ id: state.sourceId || undefined, type: $("fType").value, title: $("fTitle").value, url: $("fUrl").value, authors: $("fAuthors").value, publisher: $("fPublisher").value,
    published: $("fPublished").value, accessed: $("fAccessed").value, quote: $("fQuote").value, note: $("fNote").value, project: $("fProject").value, copyOf: $("fCopyOf").value, unreachable: $("fUnreachable").checked });

  // ---------------- Kaynakça ----------------
  function renderBiblio() {
    put($("formatSeg"), ...C.FORMATS.map((f) => el("button", { type: "button", role: "radio", "data-format": f, class: f === state.format ? "is-active" : "", "aria-checked": f === state.format ? "true" : "false", text: C.FORMAT_NAMES[f],
      onclick: guard(async () => { state.format = f; renderBiblio(); await D.setSettings({ format: f }); }) })));
    $("scopeSel").value = state.scope;
    const r = C.bibliography(data(), state.format, state.scope, project());
    $("biblioPreview").textContent = r.text.trim() ? r.text : "Dışa aktarılacak kaynak yok. Kapsamı “Tüm kaynaklar” yapın ya da iddialara kaynak bağlayın.";
    $("biblioInfo").textContent = r.count + " kaynak" + (project() ? " · proje: " + project() : "");
  }

  // ---------------- Ölçüler ----------------
  function renderMetrics() {
    const t = state.ev.tally, m = state.s.metrics;
    const tile = (v, l, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: l }));
    put($("metrics"),
      tile(t.total ? pct(t.coveredPct) : "—", "kaynaklı ya da eksik etiketli iddia (hedef %100)", t.total ? (t.coveredPct === 100 ? "is-ok" : "is-bad") : ""),
      tile(String(t.etiketsiz), "kaynaksız ve etiketsiz iddia", t.etiketsiz ? "is-bad" : "is-ok"),
      tile(String(t.eksik), "eksik kanıt etiketli"),
      tile(t.guclu + " / " + t.tek + " / " + t.celiskili, "kanıtlı / tek kaynak / çelişkili"),
      tile(t.independentSources + " / " + t.sources, "bağımsız / toplam kaynak"),
      tile(String(t.dupSupport), "bağımsız sayılmayan kopya destek"),
      tile(String(t.quoteFails + t.inaccessible), "kanıt sayılmayan bağ (alıntı yok / erişilemez)", t.quoteFails + t.inaccessible ? "is-bad" : ""),
      tile(String(m.quoteRejects), "reddedilen (kaynakta olmayan) alıntı"),
      tile(String(m.captures), "oluşturulan kaynak kartı"),
      tile(String(m.exports), "kaynakça dışa aktarma"),
      tile(m.aiRuns + " / " + m.aiApplied, "MyMind taslağı / uygulanan öneri"),
      tile(String(m.aiQuotesDropped), "MyMind'ın atılan uydurma alıntısı"));
    $("vaultInfo").textContent = state.s.vault ? "Kartlar bu bilgisayarda, Windows kasasıyla (DPAPI) şifreli saklanır; her kayıtta son sağlam sürüm yedeklenir. MyMind anahtarı da kasada şifreli." : "Bu sistemde işletim sistemi kasası yok: kartlar şifresiz JSON olarak uygulama klasöründe saklanır; MyMind anahtarı yalnız bu oturumda bellekte tutulur.";
  }

  // ---------------- MyMind ----------------
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı. Yenisini yapıştırıp kaydederek değiştirebilirsiniz." : "Anahtar kayıtlı değil.";
    $("mymindDialog").showModal();
  }

  // ---------------- Eylemler ----------------
  const loadSample = async () => {
    const r = await D.loadSample();
    await D.setSettings({ project: r.project });
    state.claimId = null;
    setState(await D.state());
    go("claims");
    toast(r.added ? "Örnek proje eklendi (" + r.added + " kart; uydurma örnek kaynaklar)." : "Örnek proje zaten ekli.");
  };
  const ACTIONS = {
    sample: loadSample,
    capture: async () => {
      const r = await D.capture();
      if (r.empty) { toast("Panoda metin yok. Tarayıcıda alıntıyı seçip kopyalayın, adresi de ayrı satıra yapıştırın.", true); return; }
      state.sourceId = null;
      state.draft = "cap:" + Date.now();
      const cap = r.capture;
      fillForm({ type: "web", title: cap.title, url: cap.url, authors: cap.authors, quote: cap.quote, accessed: C.today() });
      renderSources();
      go("sources");
      $("fTitle").focus();
      toast("Panodan alındı" + (cap.url ? " (adres: " + C.hostOf(cap.url) + ")" : " (adres bulunamadı)") + ". Künyeyi tamamlayıp Kaydet'e basın.");
    },
    newSource: () => { state.sourceId = null; state.draft = null; renderSources(); $("fTitle").focus(); },
    openUrl: async () => { const u = $("fUrl").value; const r = await D.openUrl(u); toast("Sistem tarayıcısında açıldı: " + C.hostOf(r.opened)); },
    archiveSource: async () => {
      const s = state.sourceId && srcById(state.sourceId);
      if (!s) return;
      setState(await D.archiveSource(s.id, !s.archived));
      toast(s.archived ? "Kaynak geri alındı." : "Kaynak arşivlendi; bağlı iddialarda kanıt sayılmaz (geri alınabilir).");
    },
    exportCopy: async () => { const r = await D.exportCopy(state.format, state.scope); setState(r.state); toast(C.FORMAT_NAMES[state.format] + " panoya kopyalandı (" + r.count + " kaynak)."); },
    exportSave: async () => { const r = await D.exportSave(state.format, state.scope); if (r.cancelled) return; setState(r.state); toast(r.file + " kaydedildi (" + r.count + " kaynak)."); },
    backupExport: async () => { const r = await D.backupExport(); if (!r.cancelled) toast("Yedek kaydedildi: " + r.file); },
    backupImport: async () => { const r = await D.backupImport(); if (r.cancelled) return; setState(r.state); toast(r.added + " yeni kart içe aktarıldı."); },
  };

  function bind() {
    document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
    document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", guard(ACTIONS[b.dataset.act])));
    $("projectFilter").addEventListener("change", guard(async () => { state.claimId = null; setState(await D.setSettings({ project: $("projectFilter").value })); }));
    $("claimFilter").addEventListener("change", () => { state.claimFilter = $("claimFilter").value; state.claimId = null; renderClaims(); });
    $("sourceSearch").addEventListener("input", () => { state.sourceQ = $("sourceSearch").value; renderSources(); });
    $("showArchivedSources").addEventListener("change", () => { state.archivedSources = $("showArchivedSources").checked; renderSources(); });
    $("scopeSel").addEventListener("change", guard(async () => { state.scope = $("scopeSel").value; renderBiblio(); await D.setSettings({ scope: state.scope }); }));
    $("newClaimForm").addEventListener("submit", guard(async (e) => {
      e.preventDefault();
      const r = await D.saveClaim({ text: $("newClaim").value, project: project() });
      $("newClaim").value = "";
      state.claimId = r.id; state.claimFilter = ""; $("claimFilter").value = "";
      setState(r.state);
      toast("İddia eklendi. Şimdi kaynak bağlayın ya da eksik olarak etiketleyin.");
    }));
    $("newClaim").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("newClaimForm").requestSubmit(); } });
    $("sourceForm").addEventListener("submit", guard(async (e) => {
      e.preventDefault();
      const r = await D.saveSource(formSource());
      state.sourceId = r.id; state.draft = null;
      setState(r.state);
      toast(r.dupOf ? "Kaydedildi — dikkat: “" + r.dupOf.title + "” ile aynı adres/metin; bağımsız kaynak sayılmaz." : "Kaynak kartı kaydedildi.", false);
    }));
    $("openMymind").addEventListener("click", openMymind);
    $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
    $("mymindSave").addEventListener("click", guard(async () => {
      const r = await D.mymind.setKey($("mymindKey").value);
      $("mymindDialog").close();
      toast(r.stored === "vault" ? "Anahtar kasada şifreli saklandı." : "Anahtar bu oturum için bellekte tutuluyor (kasa yok).");
    }));
    $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));
    D.onState((s) => setState(s));
  }

  guard(async () => {
    bind();
    setState(await D.state());
    go("claims");
    document.documentElement.dataset.ready = "1";
  })();
})();
