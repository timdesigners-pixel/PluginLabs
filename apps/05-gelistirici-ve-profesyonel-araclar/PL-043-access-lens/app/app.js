/* Access Lens — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok; bulgulardaki HTML parçaları da
 * düz metindir). Arayüz ağa, dosya sistemine ve anahtarlara doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.alDesktop;
  const C = window.ALCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["audit", "history", "settings"];
  const state = { s: null, view: "audit", tab: "findings", sel: null, impact: "", hf: "tamam", q: "", shot: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
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
  const impactBadge = (i) => badge(C.IMPACT[i].ad, C.IMPACT[i].tone);
  const pageName = (a) => a.title || (a.target.kind === "url" ? C.hostOf(a.target.url) : a.target.kind === "dosya" ? a.target.file : a.target.kind === "ornek" ? "Örnek: " + a.target.fixture : "Yapıştırılan HTML");
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  const act = () => (state.s ? state.s.active : null);

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "audit";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const a = act();
    $("findCount").textContent = String(a ? a.summary.total : 0);
    $("auditCount").textContent = String(s.metrics.audits);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    $("footer").textContent = "Access Lens " + s.version + " · axe-core " + s.engine.version + " · PluginLabs · otomatik denetim sertifika değildir · klavye ve ekran okuyucu kontrolleri ayrıca gerekir";
    const fx = s.metrics.fixture;
    put($("sideInfo"), el("div", { class: "al-mini__in" },
      el("span", { class: "pl-muted al-small", text: "Fixture'larda kritik yanlış olumlu" }),
      el("b", { class: fx ? (fx.critFpRate < 5 ? "is-ok" : "is-bad") : "", text: fx ? pctText(fx.critFpRate) : "—" }),
      el("span", { class: "pl-muted al-small", text: fx ? "doğru bulgu " + pctText(fx.precision) + " · yakalama " + pctText(fx.recall) : "Örnek sayfaları denetleyince ölçülür" })));
    if (state.view === "audit") renderAudit();
    if (state.view === "history") renderHistory();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Denetim ----------------
  function renderAudit() {
    const a = act();
    const none = !state.s.audits.length;
    $("emptyPanel").hidden = !none;
    $("resultPanel").hidden = none || !a;
    $("urlBtn").disabled = !!state.s.busy;
    if (!a) return;
    document.querySelectorAll("[data-tab]").forEach((b) => { b.classList.toggle("is-active", b.dataset.tab === state.tab); b.setAttribute("aria-checked", b.dataset.tab === state.tab ? "true" : "false"); });
    $("impactFilter").hidden = state.tab !== "findings" && state.tab !== "manual";
    $("impactFilter").value = state.impact;
    renderHead(a);
    if (state.tab === "findings" || state.tab === "manual") renderFindings(a, state.tab === "manual");
    else if (state.tab === "focus") renderFocus(a);
    else renderOutline(a);
  }
  function renderHead(a) {
    const sm = a.summary;
    const where = a.finalUrl || a.target.url;
    const meta = el("div", { class: "al-meta" },
      where ? btn(C.hostOf(where) || where, "pl-btn--ghost", async () => { await D.openLink(where); }, { title: where, id: "pageLink" }) : el("span", { text: a.target.kind === "dosya" ? "dosya: " + a.target.file : a.target.kind === "ornek" ? "uygulamayla gelen örnek sayfa" : "yapıştırılan HTML" }),
      el("span", { text: fmtWhen(a.createdAt) }),
      badge(a.standard.label, "accent", a.standard.tags.join(", ")),
      badge(a.engine.name + " " + a.engine.version, "", "Kural motoru"),
      el("span", { text: a.viewport.w + "×" + a.viewport.h + " · betikler " + (a.scripts ? "açık" : "kapalı") + " · " + a.durationMs + " ms" }),
      a.live ? badge("sayfa açık", "success", "Öğeleri görüntüde gösterebilirsiniz") : badge("sayfa kapalı", "", "Öğeyi görmek için yeniden denetleyin"));
    const chips = el("div", { class: "al-chips", id: "chips" }, ...C.IMPACTS.map((i) => el("span", { class: "al-chip is-" + i }, el("b", { text: String(sm.byImpact[i]) }), C.IMPACT[i].ad)),
      el("span", { class: "al-chip" }, el("b", { text: String(sm.manual) }), "manuel kontrol"), el("span", { class: "al-chip" }, el("b", { text: String(sm.focus) }), "odaklanabilir öğe"),
      sm.fp ? el("span", { class: "al-chip" }, el("b", { text: String(sm.fp) }), "yanlış olumlu işaretli") : null);
    const diff = a.diff ? el("div", { class: "al-diff", id: "diffInfo" }, "Önceki denetime göre (" + fmtWhen(a.diff.prevAt) + "): ", el("span", { class: a.diff.added ? "is-up" : "", text: a.diff.added + " yeni" }), ", ", el("span", { class: a.diff.resolved ? "is-down" : "", text: a.diff.resolved + " giderildi" }), ", " + a.diff.persisting + " sürüyor.") : null;
    const fe = a.fixtureEval ? el("p", { class: "al-note", id: "fixtureEval" }, el("b", { text: "Fixture doğrulaması: " }), a.fixtureEval.tp + "/" + a.fixtureEval.expected + " beklenen bulgu yakalandı, " + a.fixtureEval.fp + " beklenmeyen bulgu (kritik/ciddi yanlış olumlu oranı " + pctText(a.fixtureEval.critFpRate) + ")" + (a.fixtureEval.missed.length ? "; kaçırılan: " + a.fixtureEval.missed.join(", ") : "") + ".") : null;
    const actions = el("div", { class: "al-row" },
      btn("Yeniden denetle", "pl-btn--secondary", async () => { busy("Denetleniyor…"); const r = await D.audit.rerun(a.id); busy(null); if (r.approved === false) return toast("Sayfa açılmadı (onay verilmedi)."); state.sel = null; apply(r.state); toast(r.count + " bulgu."); }, { id: "rerunBtn" }),
      btn("Markdown rapor", "pl-btn--ghost", async () => saved(await D.exportMd(a.id)), { id: "mdBtn" }),
      btn("JSON", "pl-btn--ghost", async () => saved(await D.exportJson(a.id)), { id: "jsonBtn" }),
      btn("CSV", "pl-btn--ghost", async () => saved(await D.exportCsv(a.id)), { id: "csvBtn" }),
      el("span", { class: "al-grow" }),
      a.status === "arsiv" ? btn("Arşivden geri al", "pl-btn--ghost", async () => apply(await D.audit.restore(a.id))) : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.audit.archive(a.id)); toast("Denetim arşive alındı."); }, { id: "archiveBtn" }));
    put($("auditHead"), el("h2", { class: "pl-h3", text: pageName(a) }), meta, chips, diff, fe, el("p", { class: "al-note", text: C.DISCLAIMER }), actions);
  }
  const saved = (r) => { if (!r.cancelled) toast("“" + r.file + "” kaydedildi."); };

  function renderFindings(a, manual) {
    const all = (manual ? a.manual : a.findings).filter((f) => !state.impact || f.impact === state.impact);
    const items = [];
    let last = null;
    for (const f of all) {
      if (f.ruleId !== last) {
        last = f.ruleId;
        const n = all.filter((x) => x.ruleId === f.ruleId).length;
        items.push(el("li", { class: "al-group" }, impactBadge(f.impact), el("span", { text: f.title + " (" + n + ")" }), f.wcag.length ? badge(f.wcag.join(", ")) : badge("en iyi uygulama")));
      }
      const li = el("li", { class: "al-fitem" + (state.sel === f.key ? " is-sel" : "") + (f.fp ? " is-fp" : ""), tabindex: "0", role: "option", "data-key": f.key, "aria-selected": state.sel === f.key ? "true" : "false" },
        el("span", { class: "al-sel", text: f.target.join(" ") }), el("span", { class: "al-snip", text: f.html }), f.fp ? el("span", { class: "al-warn", text: "yanlış olumlu işaretlendi" }) : null);
      li.addEventListener("click", () => { state.sel = f.key; state.shot = null; renderAudit(); $("rightDetail").scrollTop = 0; });
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
      items.push(li);
    }
    put($("leftList"), ...(items.length ? items : [el("li", { class: "al-empty", text: manual ? "Manuel kontrol gerektiren sonuç yok." : state.impact ? "Bu önem derecesinde bulgu yok." : "Seçili kurallarla otomatik bulgu yok. Bu, sayfanın erişilebilir olduğu anlamına gelmez; manuel kontrolleri yapın." })]));
    const f = all.find((x) => x.key === state.sel) || null;
    put($("rightDetail"), f ? findingDetail(a, f) : el("p", { class: "al-empty", text: all.length ? "Soldan bir bulgu seçin; ilgili öğe sayfanın görüntüsünde işaretlenir." : "" }));
  }
  function shotBox(sel) {
    if (!state.shot || state.shot.sel !== sel) return null;
    const r = state.shot.r;
    const wrap = el("div", { class: "al-shot", id: "shot" });
    const img = el("img", { src: r.image, alt: "Sayfanın görüntüsü; seçili öğe sarı çerçeveyle işaretli" });
    wrap.appendChild(img);
    const place = () => {
      const k = img.clientWidth / r.rect.vw;
      if (!k) return;
      const box = el("div", { class: "al-box", "aria-hidden": "true" });
      box.style.left = Math.max(0, r.rect.x * k - 3) + "px"; box.style.top = Math.max(0, r.rect.y * k - 3) + "px";
      box.style.width = Math.max(8, r.rect.w * k + 6) + "px"; box.style.height = Math.max(8, r.rect.h * k + 6) + "px";
      wrap.appendChild(box);
      wrap.dataset.ready = "1";
      wrap.scrollIntoView({ block: "nearest" });
    };
    if (img.complete) setTimeout(place, 0); else img.addEventListener("load", place);
    return el("div", { class: "al-stack" }, wrap, r.visible ? null : el("span", { class: "al-warn", text: "Öğe görünmüyor (boyutu sıfır ya da gizli) — konumu işaretlenemedi." }));
  }
  async function show(a, sel) {
    busy("Öğe gösteriliyor…");
    const r = await D.finding.show(a.id, sel);
    busy(null);
    state.shot = { sel, r };
    renderAudit();
  }
  function findingDetail(a, f) {
    const kv = el("dl", { class: "al-kv" },
      el("dt", { text: "Kural" }), el("dd", { text: f.ruleId + (f.manual ? " (motor emin olamadı — manuel kontrol)" : "") }),
      el("dt", { text: "WCAG" }), el("dd", { text: f.wcag.length ? f.wcag.join(", ") + (f.level ? " · düzey " + f.level : "") + (f.version ? " · WCAG " + f.version + "'den beri" : "") : "WCAG dışı — en iyi uygulama" }),
      el("dt", { text: "Motorun açıklaması" }), el("dd", { text: f.help + (f.description ? " — " + f.description : "") }),
      el("dt", { text: "Seçici" }), el("dd", { class: "al-sel", text: f.target.join(" ") }));
    const ai = f.ai ? el("div", { class: "al-block al-block--ai", id: "aiBox" },
      el("div", { class: "al-row" }, icon("spark", "16"), el("span", { class: "al-lbl", text: "MyMind açıklaması · taslak · " + fmtWhen(f.ai.at) })),
      f.ai.aciklama ? el("p", { class: "al-small", text: f.ai.aciklama }) : null,
      f.ai.duzeltme ? el("p", { class: "al-small" }, el("b", { text: "Düzeltme önerisi: " }), f.ai.duzeltme) : null,
      f.ai.ornek ? el("pre", { class: "al-code", text: f.ai.ornek }) : null,
      el("span", { class: "al-note", text: "Model önerisidir; uygulamadan önce doğrulayın ve yeniden denetleyin." + (f.ai.dropped ? " " + f.ai.dropped + " uygunluk/sertifika iddiası içeren cümle atıldı." : "") })) : null;
    return el("div", { class: "al-stack" },
      el("div", { class: "al-row" }, impactBadge(f.impact), f.wcag.length ? badge("WCAG " + f.wcag.join(", ")) : badge("en iyi uygulama")),
      el("h3", { class: "pl-h3 al-h", text: f.title }),
      kv,
      f.summary ? el("div", { class: "al-stack" }, el("span", { class: "al-lbl", text: "Neden" }), el("pre", { class: "al-code", id: "summaryText", text: f.summary })) : null,
      el("div", { class: "al-stack" }, el("span", { class: "al-lbl", text: "Öğe" }), el("pre", { class: "al-code", text: f.html })),
      shotBox(f.target[0]),
      ai,
      el("div", { class: "al-actions" },
        btn("Öğeyi göster", "pl-btn--primary", async () => show(a, f.target[0]), { id: "showBtn", disabled: !a.live, title: a.live ? "" : "Sayfa kapalı — yeniden denetleyin" }),
        btn("MyMind ile açıkla", "pl-btn--secondary", async () => {
          busy("MyMind çalışıyor…");
          const r = await D.ai.explain(a.id, f.key);
          busy(null);
          if (!r.approved) return toast("İstek gönderilmedi (onay verilmedi).");
          apply(r.state); toast("MyMind açıklaması eklendi" + (r.dropped ? " (" + r.dropped + " iddia atıldı)" : "") + ".");
        }, { id: "aiBtn" }),
        f.manual ? null : btn(f.fp ? "Yanlış olumlu işaretini kaldır" : "Yanlış olumlu", "pl-btn--ghost", async () => { apply(await D.finding.fp(a.id, f.key, !f.fp)); toast(f.fp ? "İşaret kaldırıldı." : "Yanlış olumlu olarak işaretlendi; raporda ayrıca belirtilir."); }, { id: "fpBtn" }),
        f.helpUrl ? btn("Kural belgesi", "pl-btn--ghost", async () => { await D.openLink(f.helpUrl); }, { title: f.helpUrl }) : null));
  }

  function renderFocus(a) {
    const issues = new Map();
    for (const i of a.focusIssues) { if (!issues.has(i.n)) issues.set(i.n, []); issues.get(i.n).push(i.reason); }
    const items = a.focus.map((f) => {
      const li = el("li", { class: "al-focus" + (state.sel === "f:" + f.n ? " is-sel" : ""), tabindex: "0", "data-n": String(f.n) },
        el("span", { class: "al-n", text: String(f.n) }),
        el("div", { class: "al-item__body" }, el("span", { class: "al-ititle", text: f.name || "(adsız)" }), el("span", { class: "al-sel", text: f.tag + (f.role ? " [" + f.role + "]" : "") + " · " + f.sel }), ...(issues.get(f.n) || []).map((t) => el("span", { class: "al-warn", text: t }))));
      li.addEventListener("click", () => { state.sel = "f:" + f.n; state.shot = null; renderAudit(); $("rightDetail").scrollTop = 0; });
      return li;
    });
    put($("leftList"), ...(items.length ? items : [el("li", { class: "al-empty", text: "Klavyeyle odaklanabilen öğe bulunamadı." })]));
    const f = a.focus.find((x) => "f:" + x.n === state.sel);
    put($("rightDetail"), f ? el("div", { class: "al-stack" },
      el("h3", { class: "pl-h3 al-h", text: f.n + ". odak durağı: " + (f.name || "(adsız)") }),
      el("dl", { class: "al-kv" }, el("dt", { text: "Öğe" }), el("dd", { text: f.tag + (f.role ? " · rol " + f.role : "") }), el("dt", { text: "tabindex" }), el("dd", { text: String(f.tabindex) }), el("dt", { text: "Seçici" }), el("dd", { class: "al-sel", text: f.sel })),
      ...(issues.get(f.n) || []).map((t) => el("p", { class: "al-warn", text: t })),
      shotBox(f.sel),
      el("div", { class: "al-actions" }, btn("Öğeyi göster", "pl-btn--primary", async () => show(a, f.sel), { id: "showBtn", disabled: !a.live })))
      : el("div", { class: "al-stack" }, el("p", { class: "al-small", text: "Tab tuşunun gezeceği sıra (tabindex > 0 olanlar önce, sonra belge sırası). " + a.focusIssues.length + " uyarı." }), el("p", { class: "al-note", text: "Bu liste otomatik çıkarılır; odak göstergesinin görünürlüğü ve sıranın mantıklı olup olmadığı klavyeyle elle denenmelidir." })));
  }
  function renderOutline(a) {
    const items = [el("li", { class: "al-group", text: "Başlıklar (" + a.outline.headings.length + ")" })];
    let prev = 0;
    for (const h of a.outline.headings) {
      const skip = prev && h.level > prev + 1;
      prev = h.level;
      const li = el("li", { class: "al-fitem" + (state.sel === "h:" + h.sel ? " is-sel" : ""), tabindex: "0" }, el("span", { class: "al-ititle", text: "H" + h.level + " · " + (h.text || "(boş başlık)") }), skip ? el("span", { class: "al-warn", text: "düzey atlandı" }) : null);
      li.style.paddingInlineStart = (8 + (h.level - 1) * 14) + "px";
      li.addEventListener("click", () => { state.sel = "h:" + h.sel; state.shot = null; renderAudit(); });
      items.push(li);
    }
    items.push(el("li", { class: "al-group", text: "Sayfa bölgeleri / landmark (" + a.outline.landmarks.length + ")" }));
    for (const l of a.outline.landmarks) {
      const li = el("li", { class: "al-fitem" + (state.sel === "l:" + l.sel ? " is-sel" : ""), tabindex: "0" }, el("span", { class: "al-ititle", text: l.role + (l.name ? " — " + l.name : "") }), el("span", { class: "al-sel", text: l.sel }));
      li.addEventListener("click", () => { state.sel = "l:" + l.sel; state.shot = null; renderAudit(); });
      items.push(li);
    }
    put($("leftList"), ...items);
    const sel = state.sel && /^[hl]:/.test(state.sel) ? state.sel.slice(2) : null;
    put($("rightDetail"), sel ? el("div", { class: "al-stack" }, el("span", { class: "al-sel", text: sel }), shotBox(sel), el("div", { class: "al-actions" }, btn("Öğeyi göster", "pl-btn--primary", async () => show(a, sel), { id: "showBtn", disabled: !a.live })))
      : el("div", { class: "al-stack" }, el("p", { class: "al-small", text: "Dil: " + (a.lang || "belirtilmemiş") + " · başlık: " + (a.title || "yok") + " · " + a.counts.elements + " öğe." }), el("p", { class: "al-note", text: "Ekran okuyucu kullanıcıları sayfada başlıklar ve bölgelerle gezinir: tek bir h1, atlanmayan başlık düzeyleri ve main/nav/header/footer bölgeleri beklenir." })));
  }

  // ---------------- Geçmiş ----------------
  function renderHistory() {
    document.querySelectorAll("[data-hf]").forEach((b) => { b.classList.toggle("is-active", b.dataset.hf === state.hf); b.setAttribute("aria-checked", b.dataset.hf === state.hf ? "true" : "false"); });
    const q = C.fold(state.q || "");
    const list = state.s.audits.filter((a) => a.status === state.hf && (!q || C.fold(pageName(a) + " " + (a.finalUrl || a.target.url || "")).includes(q)));
    put($("histList"), ...(list.length ? list.map((a) => {
      const sm = a.summary;
      const li = el("li", { class: "al-item", tabindex: "0", "data-id": a.id },
        el("span", {}, icon("eye", "16")),
        el("div", { class: "al-item__body" }, el("span", { class: "al-ititle", text: pageName(a) }),
          el("div", { class: "al-imeta" }, sm.byImpact.critical ? badge(sm.byImpact.critical + " kritik", "danger") : null, sm.byImpact.serious ? badge(sm.byImpact.serious + " ciddi", "warning") : null, badge(sm.total + " bulgu"), badge(sm.manual + " manuel"), badge(a.engine.name + " " + a.engine.version)),
          el("span", { class: "al-src", text: (a.finalUrl || a.target.url ? C.hostOf(a.finalUrl || a.target.url) + " · " : "") + fmtWhen(a.createdAt) })));
      li.addEventListener("click", guard(async () => { state.sel = null; state.shot = null; apply(await D.audit.open(a.id)); go("audit"); }));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter") li.click(); });
      return li;
    }) : [el("li", { class: "al-empty", text: state.hf === "arsiv" ? "Arşiv boş." : "Henüz denetim yok." })]));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics, fx = m.fixture;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(fx ? pctText(fx.critFpRate) : "—", "kritik/ciddi yanlış olumlu (hedef <%5)", fx ? (fx.critFpRate < 5 ? "is-ok" : "is-bad") : ""),
      card(fx ? pctText(fx.precision) : "—", "fixture'larda doğru bulgu oranı", fx && fx.precision >= 95 ? "is-ok" : ""),
      card(fx ? pctText(fx.recall) : "—", "beklenen bulguları yakalama", fx && fx.recall >= 95 ? "is-ok" : ""),
      card(String(m.audits), "denetim (" + m.urlAudits + " adres · " + m.fileAudits + " dosya · " + m.pasteAudits + " yapıştırma)"),
      card(String(m.findings), "açık bulgu (" + m.critical + " kritik)", m.critical ? "is-bad" : ""),
      card(String(m.highlights), "gösterilen öğe"),
      card(String(m.fpMarked), "kullanıcının yanlış olumlu işareti"),
      card(String(m.aiRuns), "MyMind açıklaması (" + m.aiDropped + " iddia atıldı)"));
    $("fixtureInfo").textContent = fx ? fx.pages + " örnek sayfada " + fx.expected + " bilinen sorun: " + fx.tp + " doğru bulgu, " + fx.fp + " beklenmeyen bulgu, " + fx.fn + " kaçırılan. Gerçek sayfalarda ölçülmemiştir; gerçek engelli kullanıcı testi ürün doğrulamasının parçasıdır." : "“Örnek sayfalar” ile bilinen sorunlu fixture'ları denetleyince doğruluk burada ölçülür.";
    $("setScripts").checked = s.settings.scripts;
    $("setBest").checked = s.settings.bestPractice;
    $("setRemote").checked = s.settings.remote;
    if (document.activeElement !== $("setWidth")) $("setWidth").value = String(s.settings.width);
    if (document.activeElement !== $("setWait")) $("setWait").value = String(s.settings.wait);
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("engineInfo").textContent = "Kural motoru: axe-core " + s.engine.version + " (Deque Systems, MPL-2.0). Etiketler: " + C.tagsFor(s.settings).join(", ") + ".";
    $("vaultInfo").textContent = s.vault ? "Denetimler, ayarlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: denetimler düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  const started = (r, what) => { busy(null); if (!r || r.cancelled) return; if (r.approved === false) return toast("Sayfa açılmadı (onay verilmedi)."); state.sel = null; state.shot = null; state.tab = "findings"; apply(r.state); go("audit"); toast(what(r)); };
  $("urlForm").addEventListener("submit", guard(async (e) => { e.preventDefault(); const v = $("urlInput").value; if (!v.trim()) return toast("Denetlenecek sayfanın adresini yazın.", true); busy("Sayfa açılıyor ve denetleniyor…"); started(await D.audit.url(v), (r) => r.count + " bulgu bulundu."); }));
  document.querySelectorAll('[data-act="file"]').forEach((b) => b.addEventListener("click", guard(async () => { busy("Denetleniyor…"); started(await D.audit.file(), (r) => r.count + " bulgu bulundu."); })));
  document.querySelectorAll('[data-act="samples"]').forEach((b) => b.addEventListener("click", guard(async () => { busy("Örnek sayfalar denetleniyor…"); started(await D.audit.samples(), (r) => r.audits + " örnek sayfa denetlendi."); })));
  document.querySelectorAll('[data-act="paste"]').forEach((b) => b.addEventListener("click", () => { $("pasteText").value = ""; $("pasteDialog").showModal(); $("pasteText").focus(); }));
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteRun").addEventListener("click", guard(async () => { const v = $("pasteText").value; if (!v.trim()) return toast("HTML yapıştırın.", true); $("pasteDialog").close(); busy("Denetleniyor…"); started(await D.audit.paste(v), (r) => r.count + " bulgu bulundu."); }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.sel = null; state.shot = null; renderAudit(); }));
  $("impactFilter").addEventListener("change", () => { state.impact = $("impactFilter").value; renderAudit(); });
  document.querySelectorAll("[data-hf]").forEach((b) => b.addEventListener("click", () => { state.hf = b.dataset.hf; renderHistory(); }));
  $("q").addEventListener("input", () => { state.q = $("q").value; renderHistory(); });
  $("setScripts").addEventListener("change", guard(async () => apply(await D.setSettings({ scripts: $("setScripts").checked }))));
  $("setBest").addEventListener("change", guard(async () => apply(await D.setSettings({ bestPractice: $("setBest").checked }))));
  $("setRemote").addEventListener("change", guard(async () => apply(await D.setSettings({ remote: $("setRemote").checked }))));
  $("setWidth").addEventListener("change", guard(async () => apply(await D.setSettings({ width: Number($("setWidth").value) }))));
  $("setWait").addEventListener("change", guard(async () => apply(await D.setSettings({ wait: Number($("setWait").value) }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
    if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); go("audit"); $("urlInput").focus(); }
  });

  D.onState(apply);
  D.state().then((s) => { apply(s); go("audit"); document.documentElement.dataset.ready = "1"; });
})();
