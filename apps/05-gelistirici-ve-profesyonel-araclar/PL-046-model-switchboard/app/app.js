/* Model Switchboard — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya, dosya
 * sistemine ve anahtarlara doğrudan erişmez; her işlem dar IPC ile ana sürece gider. */
(function () {
  const D = window.msDesktop;
  const C = window.MSCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["compare", "history", "models", "settings"];
  const state = { s: null, view: "compare", hf: "acik", draft: { title: "", prompt: "", system: "", type: "", maxTokens: 0, ids: [] }, plan: null, ai: null, inited: false };
  const ICONS = { check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3", alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4" };
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
      else if (k === "css") for (const [prop, val] of Object.entries(v)) e.style.setProperty(prop, val);
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
    setTimeout(() => t.remove(), 8000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const usd = C.usd;
  const pct = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const num = (n) => Number(n || 0).toLocaleString("tr-TR");
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const provLabel = (p) => (C.PROVIDERS[p] ? C.PROVIDERS[p].label : p);
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "compare";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }
  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("runCount").textContent = String(s.runs.filter((r) => r.status === "acik").length);
    $("modelCount").textContent = String(s.catalog.filter((c) => c.enabled).length);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.keys.hub ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.keys.hub ? " pl-badge--success" : "");
    const used = m.monthlyCap ? Math.min(100, m.spentMonth / m.monthlyCap * 100) : 100;
    put($("sideInfo"), el("div", { class: "ms-mini__in" },
      el("span", { class: "pl-muted ms-small", text: "Bu ay harcanan / tavan" }),
      el("b", { class: m.overCap ? "is-bad" : "is-ok", text: usd(m.spentMonth) + " / " + usd(m.monthlyCap) }),
      el("div", { class: "ms-meter", "aria-hidden": "true" }, el("span", { css: { width: used.toFixed(1) + "%" } })),
      el("span", { class: "pl-muted ms-small", text: "Maliyet görünürlüğü " + pct(m.visibility) + " · tavan aşımı " + m.overCap })));
    if (state.view === "compare") renderCompare();
    if (state.view === "history") renderHistory();
    if (state.view === "models") renderModels();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Karşılaştır ----------------
  function readDraft() {
    const d = state.draft;
    d.title = $("tTitle").value; d.prompt = $("tPrompt").value; d.system = $("tSystem").value; d.type = $("tType").value;
    d.maxTokens = Math.floor(Number($("tMax").value)) || state.s.settings.maxTokens;
    return d;
  }
  function initDraft() {
    const s = state.s;
    const d = s.draft || {};
    put($("tType"), el("option", { value: "", text: "Otomatik (kurallarla)" }), ...Object.entries(C.TASK_TYPES).map(([k, v]) => el("option", { value: k, text: v })));
    $("tTitle").value = d.title || ""; $("tPrompt").value = d.prompt || ""; $("tSystem").value = d.system || ""; $("tType").value = d.type || "";
    $("tMax").value = String(d.maxTokens || s.settings.maxTokens);
    state.draft.ids = Array.isArray(d.ids) && d.ids.length ? d.ids.filter((id) => s.catalog.some((c) => c.id === id)) : s.catalog.filter((c) => c.enabled && c.provider !== "yerel").slice(0, 2).map((c) => c.id);
    readDraft();
  }
  let planT = null, saveT = null;
  function schedulePlan() {
    clearTimeout(planT); clearTimeout(saveT);
    planT = setTimeout(guard(async () => { state.plan = await D.plan(readDraft(), state.draft.ids); renderPlan(); }), 150);
    saveT = setTimeout(() => { D.setSettings({ draft: readDraft() }).catch(() => {}); }, 600);
  }
  let planSig = "";
  function renderCompare() {
    const s = state.s;
    const sig = JSON.stringify([s.settings.monthlyCap, s.settings.runCap, s.keys, s.catalog, s.metrics.spentMonth]);
    if (state.inited && sig !== planSig) schedulePlan();
    planSig = sig;
    const picks = s.catalog.filter((c) => c.enabled);
    put($("picks"), ...(picks.length ? picks.map((c) => {
      const on = state.draft.ids.includes(c.id);
      const paid = C.PROVIDERS[c.provider].paid;
      const needKey = c.provider !== "yerel" && !s.keys[c.provider];
      const cb = el("input", { type: "checkbox", "aria-label": c.label });
      cb.checked = on;
      const row = el("label", { class: "ms-pick" + (on ? " is-on" : "") + (needKey ? " is-off" : ""), "data-model": c.id }, cb,
        el("span", { class: "ms-pick__name" }, c.label, el("small", { text: provLabel(c.provider) + " · " + c.model })),
        el("span", { class: "ms-pick__meta" },
          paid ? (c.inPrice == null ? badge("fiyat yok", "danger") : badge("$" + c.inPrice + " / $" + c.outPrice, c.verified ? "success" : "warning", c.verified ? "Fiyat " + c.priceDate + " tarihinde doğrulandı" : "Fiyat doğrulanmadı")) : badge("ücretsiz", "success"),
          needKey ? badge("anahtar yok", "danger") : null));
      cb.addEventListener("change", () => {
        if (cb.checked && state.draft.ids.length >= 4) { cb.checked = false; return toast("Bir karşılaştırmada en çok 4 model.", true); }
        state.draft.ids = cb.checked ? state.draft.ids.concat(c.id) : state.draft.ids.filter((x) => x !== c.id);
        row.classList.toggle("is-on", cb.checked);
        schedulePlan();
      });
      return row;
    }) : [el("p", { class: "ms-empty", text: "Katalogda açık model yok. Modeller ve anahtarlar bölümünden ekleyin." })]));
    $("runBtn").disabled = s.running;
    $("runHint").textContent = s.running ? "Çalışıyor…" : "";
    renderPlan();
    renderAi();
    const r = s.active;
    $("resTitle").textContent = r ? r.title : "Sonuçlar";
    $("resMeta").textContent = r ? fmtWhen(r.at) + " · " + C.TASK_TYPES[r.type] + " · toplam " + usd(r.results.reduce((a, x) => a + (x.cost || 0), 0)) + " (en kötü " + usd(r.worst) + ")" + (r.sample ? " · ÖRNEK KAYIT (gerçek çağrı değil)" : "") : "";
    if (!r) return put($("resCols"), el("div", { class: "ms-empty" }, el("p", { text: "Görevi yazın, en çok 4 model seçin ve Karşılaştır'a basın. Yanıtlar yan yana; her birinin süresi, token kullanımı ve gerçek maliyeti görünür." }), el("p", { text: "Anahtarınız yoksa Örnek kayıtlar ile ekranı inceleyebilirsiniz (uydurma yanıtlar; harcamaya girmez)." })));
    put($("resCols"), ...resultCols(r));
  }
  function renderPlan() {
    const p = state.plan, box = $("planBox");
    if (!p) return put(box, el("span", { class: "pl-muted", text: "Maliyet tahmini model seçince görünür." }));
    box.className = "ms-plan " + (p.ok ? "is-ok" : "is-bad");
    const s = state.s, cap = s.settings.monthlyCap;
    const spentW = cap ? Math.min(100, p.spent / cap * 100) : 100, worstW = cap ? Math.min(100 - spentW, p.worst / cap * 100) : 0;
    put(box,
      el("div", { class: "ms-plan__row" }, el("span", { text: "Tahmini maliyet (yarım çıktı)" }), el("b", { text: usd(p.est) })),
      el("div", { class: "ms-plan__row" }, el("span", { text: "En kötü durum (" + num(p.inSafe) + " girdi + " + num(p.maxTokens) + " çıktı token/model)" }), el("b", { id: "planWorst", text: usd(p.worst) + " / tavan " + usd(s.settings.runCap) })),
      el("div", { class: "ms-plan__row" }, el("span", { text: "Bu ay: harcanan + en kötü durum / aylık tavan" }), el("b", { text: usd(p.spent) + " + " + usd(p.worst) + " / " + usd(cap) })),
      el("div", { class: "ms-meter" + (p.spent + p.worst > cap ? " is-over" : ""), "aria-hidden": "true" }, el("span", { css: { width: spentW.toFixed(1) + "%" } }), el("i", { css: { left: spentW.toFixed(1) + "%", width: Math.max(0.5, worstW).toFixed(1) + "%" } })),
      p.unverified.length ? el("span", { class: "ms-small pl-muted", text: "Fiyatı doğrulanmayan: " + p.unverified.join(", ") }) : null,
      p.errors.length ? el("ul", { id: "planErrors" }, ...p.errors.map((e) => el("li", { text: e }))) : null);
  }
  function renderAi() {
    const a = state.ai, box = $("aiBox");
    box.hidden = !a;
    if (!a) return;
    const names = a.models.map((id) => { const c = state.s.catalog.find((m) => m.id === id); return c ? c.label : id; });
    put(box, el("div", { class: "ms-row" }, icon("spark", "16"), el("b", { text: "MyMind önerisi" }), a.dropped ? badge(a.dropped + " öğe atıldı", "warning", "Listede olmayan tür / katalogda olmayan model / fiyat iddiası") : null),
      el("span", { text: "Tür: " + (a.type ? C.TASK_TYPES[a.type] : "anlaşılamadı") + (names.length ? " · Modeller: " + names.join(", ") : "") }),
      a.reason ? el("span", { class: "pl-muted ms-small", text: a.reason }) : null,
      el("div", { class: "ms-row" },
        a.type ? btn("Türü uygula", "pl-btn--secondary", () => { $("tType").value = a.type; schedulePlan(); toast("Görev türü uygulandı."); }) : null,
        a.models.length ? btn("Modelleri seç", "pl-btn--secondary", () => { state.draft.ids = a.models.slice(0, 4); renderCompare(); schedulePlan(); toast("Önerilen modeller seçildi."); }) : null,
        btn("Kapat", "pl-btn--ghost", () => { state.ai = null; renderAi(); })));
  }
  function resultCols(r) {
    return r.results.map((x, i) => {
      const fact = (v, label, bad) => el("div", {}, el("b", { class: bad ? "is-bad" : "", text: v }), el("span", { text: label }));
      const stars = el("div", { class: "ms-stars", role: "group", "aria-label": "Puan" }, ...[1, 2, 3, 4, 5].map((n) => {
        const b = el("button", { type: "button", class: "ms-star" + (x.rating >= n ? " is-on" : ""), "aria-label": n + " puan", "data-star": String(n), text: "★" });
        b.addEventListener("click", guard(async () => apply(await D.runs.rate(r.id, i, x.rating === n ? 0 : n))));
        return b;
      }));
      return el("div", { class: "ms-col" + (x.winner ? " is-win" : "") + (x.ok ? "" : " is-err"), "data-result": String(i) },
        el("div", { class: "ms-col__head" }, el("b", { text: x.label }), el("span", { text: provLabel(x.provider) + " · " + x.model })),
        el("div", { class: "ms-facts" },
          fact(x.ok ? (x.cost == null ? "görünmüyor" : usd(x.cost)) : "$0", x.ok ? (x.cost == null ? "kullanım bildirilmedi" : "gerçek maliyet") : "istek başarısız", x.ok && x.cost == null),
          fact((x.ms / 1000).toFixed(1).replace(".", ",") + " sn", "süre"),
          fact(num(x.inTok) + " / " + num(x.outTok), "girdi / çıktı token"),
          fact(C.PROVIDERS[x.provider].paid ? (x.price.verified ? x.price.date : "doğrulanmadı") : "ücretsiz", "fiyat tarihi", C.PROVIDERS[x.provider].paid && !x.price.verified)),
        el("pre", { class: "ms-answer" + (x.ok ? "" : " is-err"), text: x.ok ? x.text || "(boş yanıt)" : x.error }),
        x.ok ? el("div", { class: "ms-colfoot" }, stars,
          btn(x.winner ? "Kazanan ✓" : "Kazanan", x.winner ? "pl-btn--secondary" : "pl-btn--ghost", async () => apply(await D.runs.winner(r.id, i)), { "data-win": String(i) }),
          btn("Kopyala", "pl-btn--ghost", async () => { const c = await D.runs.copy(r.id, i); toast(num(c.chars) + " karakter panoya kopyalandı."); }),
          x.stop === "max_tokens" || x.stop === "length" ? badge("max token'da kesildi", "warning") : null) : null);
    });
  }

  // ---------------- Geçmiş ve öneri ----------------
  function renderHistory() {
    const s = state.s;
    put($("recoBody"), el("div", { class: "ms-reco", id: "recoCards" }, ...s.recommendations.map((rc) => el("div", { class: "ms-reco__card" + (rc.best ? "" : " is-empty"), "data-type": rc.type },
      el("span", { class: "ms-lbl", text: C.TASK_TYPES[rc.type] }),
      rc.best ? el("b", { class: "ms-reco__best", text: rc.best.label }) : el("span", { text: "Öneri yok" }),
      el("span", { class: "ms-small", text: rc.reason }),
      rc.ranked.length > 1 ? el("span", { class: "pl-muted ms-small", text: "Sıra: " + rc.ranked.map((e) => e.label + " (" + String(e.rating).replace(".", ",") + ")").join(" › ") }) : null))));
    document.querySelectorAll("[data-hf]").forEach((b) => b.setAttribute("aria-checked", b.dataset.hf === state.hf ? "true" : "false"));
    const list = s.runs.filter((r) => r.status === state.hf);
    if (!list.length) return put($("histBody"), el("p", { class: "ms-empty", text: state.hf === "arsiv" ? "Arşiv boş." : "Henüz çalıştırma yok." }));
    const td = (t, cls) => el("td", { class: cls || "", text: t });
    const rows = list.map((r) => {
      const tr = el("tr", { class: "is-click" + (s.active && s.active.id === r.id ? " is-sel" : ""), "data-run": r.id, tabindex: "0" },
        td(fmtWhen(r.at)), el("td", {}, r.title, r.sample ? badge("örnek", "warning") : null), td(C.TASK_TYPES[r.type]), td(r.ok + "/" + r.n, "is-num"), td(usd(r.cost), "is-num"), td(r.invisible ? r.invisible + " görünmüyor" : "✓", r.invisible ? "" : "is-num"), td(r.rated + "/" + r.ok, "is-num"));
      const open = guard(async () => apply(await D.runs.open(r.id)));
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
      return tr;
    });
    const a = s.active;
    put($("histBody"), el("table", { class: "ms-table", id: "histTable" }, el("thead", {}, el("tr", {}, ...["Tarih", "Görev", "Tür", "Başarılı", "Maliyet", "Maliyet görünür", "Puanlı"].map((h) => el("th", { text: h })))), el("tbody", {}, ...rows)),
      a && list.some((r) => r.id === a.id) ? el("div", { class: "ms-detail" },
        el("div", { class: "ms-row" }, el("b", { text: a.title }), el("span", { class: "ms-grow" }),
          a.status === "acik" ? btn("Görevi yeniden kullan", "pl-btn--secondary", async () => { $("tTitle").value = a.title; $("tPrompt").value = a.prompt; $("tSystem").value = a.system; $("tType").value = a.type; state.draft.ids = a.results.map((x) => x.modelId).filter((id) => s.catalog.some((c) => c.id === id && c.enabled)); go("compare"); schedulePlan(); }) : null,
          a.status === "acik" ? btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.runs.archive(a.id)); toast("Arşive taşındı (silinmedi)."); }) : btn("Geri al", "pl-btn--secondary", async () => { apply(await D.runs.restore(a.id)); state.hf = "acik"; renderHistory(); })),
        el("pre", { class: "ms-prompt", text: (a.system ? "[Sistem] " + a.system + "\n\n" : "") + a.prompt }),
        el("div", { class: "ms-cols ms-cols--hist" }, ...resultCols(a))) : null);
  }

  // ---------------- Modeller ve anahtarlar ----------------
  function renderModels() {
    const s = state.s;
    const keyBox = (p, hint) => {
      const inp = el("input", { class: "pl-input", type: "password", maxlength: "320", autocomplete: "off", spellcheck: "false", id: "key-" + p, placeholder: C.PROVIDERS[p].keyHint, "aria-label": C.PROVIDERS[p].label + " anahtarı" });
      return el("div", { class: "ms-key" }, el("div", { class: "ms-row" }, el("b", { text: C.PROVIDERS[p].label }), el("span", { class: "ms-grow" }), badge(s.keys[p] ? "Kayıtlı" : "Yok", s.keys[p] ? "success" : "")),
        el("span", { class: "pl-muted ms-small", text: hint }), inp,
        el("div", { class: "ms-row" }, btn("Kaydet", "pl-btn--secondary", async () => { const r = await D.setKey(p, inp.value); inp.value = ""; toast(C.PROVIDERS[p].label + " anahtarı " + (r.stored === "vault" ? "Windows kasasına kaydedildi." : "yalnız bu oturum için bellekte tutuluyor (kasa yok).")); apply(await D.state()); }, { "data-keysave": p }),
          btn("Kaldır", "pl-btn--ghost", async () => { await D.setKey(p, null); toast("Anahtar kaldırıldı."); apply(await D.state()); })));
    };
    put($("keyRows"), keyBox("openai", "platform.openai.com → API keys. Yalnız /v1/chat/completions çağrılır."), keyBox("anthropic", "console.anthropic.com → API Keys. Yalnız /v1/messages çağrılır."), keyBox("hub", "PluginLabs Hub → API istemcileri (mymind.chat). Ücretsiz, bu bilgisayarda."));
    const inp = (m, k, cls, type, extra) => {
      const i = el("input", { class: "pl-input " + (cls || ""), type: type || "text", value: m[k] == null ? "" : String(m[k]), "data-field": k, "aria-label": k, ...(extra || {}) });
      i.addEventListener("change", guard(async () => { apply(await D.catalog.set(m.id, { [k]: type === "number" ? (i.value === "" ? null : Number(i.value)) : i.value.trim() })); toast(m.label + ": kaydedildi" + ((k === "inPrice" || k === "outPrice") && m.verified ? " — fiyat değişti, doğrulama kaldırıldı." : ".")); }));
      return i;
    };
    const rows = s.catalog.map((m) => {
      const paid = C.PROVIDERS[m.provider].paid;
      const ver = el("input", { type: "checkbox", "data-field": "verified", "aria-label": "Fiyat doğrulandı" });
      ver.checked = m.verified; ver.disabled = !paid;
      ver.addEventListener("change", guard(async () => { try { apply(await D.catalog.set(m.id, { verified: ver.checked })); } catch (e) { ver.checked = !ver.checked; throw e; } }));
      const en = el("input", { type: "checkbox", "data-field": "enabled", "aria-label": "Açık" });
      en.checked = m.enabled;
      en.addEventListener("change", guard(async () => apply(await D.catalog.set(m.id, { enabled: en.checked }))));
      return el("tr", { "data-model": m.id },
        el("td", {}, en), el("td", { text: provLabel(m.provider) }), el("td", {}, inp(m, "label")), el("td", {}, inp(m, "model")),
        el("td", {}, paid ? inp(m, "inPrice", "ms-in-num", "number", { min: "0", step: "0.01" }) : el("span", { class: "pl-muted", text: "0" })),
        el("td", {}, paid ? inp(m, "outPrice", "ms-in-num", "number", { min: "0", step: "0.01" }) : el("span", { class: "pl-muted", text: "0" })),
        el("td", {}, paid ? inp(m, "priceDate", "ms-in-date", "date") : el("span", { class: "pl-muted", text: "—" })),
        el("td", {}, ver, paid ? badge(m.verified ? "doğrulandı" : m.inPrice == null ? "fiyat yok" : "doğrulanmadı", m.verified ? "success" : m.inPrice == null ? "danger" : "warning") : badge("ücretsiz", "success")),
        el("td", {}, paid ? inp(m, "priceSource", "", "url", { placeholder: "https://…" }) : el("span", { class: "pl-muted ms-small", text: m.provider === "yerel" ? s.settings.localUrl : "127.0.0.1:47632" })));
    });
    put($("catBody"), el("table", { class: "ms-table", id: "catTable" }, el("thead", {}, el("tr", {}, ...["Açık", "Sağlayıcı", "Ad", "API model kimliği", "Girdi $/1M", "Çıktı $/1M", "Fiyat tarihi", "Doğrulama", "Fiyat kaynağı"].map((h) => el("th", { text: h })))), el("tbody", {}, ...rows)));
  }

  // ---------------- Bütçe ve ölçüler ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(pct(m.visibility), "gerçek maliyeti görünen yanıt (hedef %100)", m.visibility == null ? "" : m.visibility >= 100 ? "is-ok" : "is-bad"),
      card(String(m.overCap), "bütçe tavanı aşımı (hedef 0)", m.overCap ? "is-bad" : "is-ok"),
      card(String(m.blocked), "tavan/fiyat nedeniyle gönderilmeyen çalıştırma"),
      card(String(m.overEstimate), "en kötü durum tahminini aşan çalıştırma (hedef 0)", m.overEstimate ? "is-bad" : "is-ok"),
      card(usd(m.spentMonth), "bu ay harcanan (" + usd(m.remaining) + " kaldı)"),
      card(usd(m.total), "toplam harcama · " + m.runs + " çalıştırma"),
      card(String(m.unverifiedPaid), "doğrulanmamış fiyatla hesaplanan yanıt", m.unverifiedPaid ? "is-bad" : ""),
      card(m.rated + " / " + m.results, "puanlanan yanıt (öneri kanıtı)"));
    const active = document.activeElement;
    const setv = (id, v) => { if (active !== $(id)) $(id).value = String(v); };
    setv("setMonthly", s.settings.monthlyCap); setv("setRun", s.settings.runCap); setv("setMax", s.settings.maxTokens); setv("setTemp", s.settings.temperature);
    $("budgetInfo").textContent = "Bu ay: " + usd(m.spentMonth) + " harcandı, " + usd(m.remaining) + " kaldı.";
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    setv("localUrl", s.settings.localUrl); setv("localModel", s.settings.localModel);
    $("vaultInfo").textContent = s.vault ? "Çalıştırmalar, katalog ve anahtarlar Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: veriler düz JSON olarak saklanır, anahtarlar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  ["tTitle", "tPrompt", "tSystem", "tType", "tMax"].forEach((id) => $(id).addEventListener("input", schedulePlan));
  $("runBtn").addEventListener("click", guard(async () => {
    const d = readDraft();
    busy("Modellere gönderiliyor…");
    const r = await D.run(d, state.draft.ids);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    apply(r.state);
    state.plan = await D.plan(readDraft(), state.draft.ids);
    renderPlan();
    toast(r.ok + " yanıt" + (r.failed ? ", " + r.failed + " hata" : "") + " · gerçek maliyet " + usd(r.cost) + " (en kötü durum " + usd(r.worst) + ").", r.failed > 0 && !r.ok);
  }));
  $("aiBtn").addEventListener("click", guard(async () => {
    busy("MyMind'a soruluyor…");
    const r = await D.ai.classify(readDraft());
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    state.ai = r;
    apply(r.state);
    toast("MyMind önerisi geldi" + (r.dropped ? " (" + r.dropped + " öğe atıldı)." : "."));
  }));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.runs.sample(); apply(r.state); toast(r.added ? r.added + " örnek kayıt eklendi (uydurma; harcamaya girmez)." : "Örnek kayıtlar zaten ekli."); })));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-hf]").forEach((b) => b.addEventListener("click", () => { state.hf = b.dataset.hf; renderHistory(); }));
  $("csvBtn").addEventListener("click", guard(async () => { const r = await D.exportCsv(); if (r.cancelled) return; apply(r.state); toast("“" + r.file + "” kaydedildi (" + r.rows + " satır)."); }));
  $("jsonBtn").addEventListener("click", guard(async () => { const r = await D.exportJson(); if (r.cancelled) return; apply(r.state); toast("“" + r.file + "” kaydedildi."); }));
  $("addModel").addEventListener("click", guard(async () => { const r = await D.catalog.add($("addProv").value); apply(r.state); toast("Model eklendi: API model kimliğini ve fiyatını girin."); }));
  $("resetCat").addEventListener("click", guard(async () => { apply(await D.catalog.reset()); toast("Eksik başlangıç modelleri eklendi."); }));
  $("saveBudget").addEventListener("click", guard(async () => { apply(await D.setSettings({ monthlyCap: Number($("setMonthly").value), runCap: Number($("setRun").value), maxTokens: Number($("setMax").value), temperature: Number($("setTemp").value) })); toast("Bütçe ayarları kaydedildi."); }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.keys.hub ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.setKey("hub", $("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.setKey("hub", null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then(async (s) => { state.s = s; initDraft(); state.plan = await D.plan(readDraft(), state.draft.ids); state.inited = true; go("compare"); document.documentElement.dataset.ready = "1"; });
})();
