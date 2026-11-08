/* Context Kit — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya, dosya sistemine
 * ve anahtara doğrudan erişmez; her işlem dar IPC ile ana sürece gider. */
(function () {
  const D = window.ckDesktop;
  const C = window.CKCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["kits", "exports", "settings"];
  const state = { s: null, view: "kits", tf: "acik", file: null, lastExport: null };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
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
  const num = (n) => Number(n || 0).toLocaleString("tr-TR");
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const SRC_NAMES = { klasor: "Klasör", sayfa: "Sayfa", dosya: "Dosya", ornek: "Örnek proje" };
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  const active = () => (state.s ? state.s.active : null);

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "kits";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }
  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("kitCount").textContent = String(m.kits);
    $("exportCount").textContent = String(m.exports);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "ck-mini__in" },
      el("span", { class: "pl-muted ck-small", text: "Dışa aktarılan paketlerde azalma" }),
      el("b", { class: m.reduction == null ? "" : m.reduction >= 40 ? "is-ok" : "is-bad", text: pctText(m.reduction) }),
      el("span", { class: "pl-muted ck-small", text: m.exports + " paket · " + m.secretsLeft + " sır kaldı · " + m.redactions + " gizlendi" })));
    if (state.view === "kits") renderKits();
    if (state.view === "exports") renderExports();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Paketler ----------------
  function renderKits() {
    const s = state.s;
    document.querySelectorAll("[data-tf]").forEach((b) => { b.setAttribute("aria-checked", b.dataset.tf === state.tf ? "true" : "false"); b.classList.toggle("is-active", b.dataset.tf === state.tf); });
    const none = !s.list.length;
    $("emptyPanel").hidden = !none;
    $("kitSplit").hidden = none;
    if (none) return;
    const list = s.list.filter((x) => x.status === state.tf);
    const act = active();
    $("listInfo").textContent = list.length + (state.tf === "arsiv" ? " arşivde" : " paket");
    put($("kitList"), ...(list.length ? list.map((x) => {
      const sel = act && act.id === x.id;
      const li = el("li", { class: "ck-item" + (sel ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": sel ? "true" : "false" },
        el("span", {}, icon("box", "16")),
        el("div", { class: "ck-item__body" },
          el("span", { class: "ck-ititle", text: x.name }),
          el("div", { class: "ck-imeta" }, badge(num(x.tokens) + " / " + num(x.budget), x.tokens > x.budget ? "danger" : ""), x.reduction != null && x.files ? badge("−" + pctText(x.reduction), x.reduction >= 40 ? "success" : "warning") : null, x.secrets ? badge(x.secrets + " sır", "danger") : null, x.injections ? badge(x.injections + " talimat", "warning") : null, x.ai ? badge("MyMind", "pro") : null),
          el("span", { class: "ck-src", text: x.files + " dosya · " + x.excluded + " hariç · " + fmtWhen(x.createdAt) })));
      li.addEventListener("click", guard(async () => { state.file = null; state.lastExport = null; apply(await D.kit.open(x.id)); }));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
      return li;
    }) : [el("li", { class: "ck-empty", text: state.tf === "arsiv" ? "Arşiv boş." : "Açık paket yok." })]));
    const k = act && act.status === state.tf ? act : null;
    put($("kitDetail"), k ? detail(k) : el("p", { class: "ck-empty", text: list.length ? "Soldan bir paket seçin." : "" }));
  }

  function fileRow(k, f, chosen) {
    const inPkg = chosen.has(f.path);
    const pin = k.pins[f.path];
    const li = el("li", { class: "ck-frow" + (f.excluded ? " is-off" : "") + (state.file === f.path ? " is-sel" : ""), tabindex: "0", "data-path": f.path },
      el("span", { class: "ck-fpath", title: f.path + (f.excluded ? " — hariç: " + f.excluded : "") }, inPkg ? el("b", { text: "★ " }) : null, f.path),
      el("span", { class: "ck-fmeta" },
        f.excluded ? badge(f.excluded.replace(/^varsayılan: /, "").slice(0, 28), "", "Hariç: " + f.excluded) : badge(num(f.tokens) + " tk"),
        !f.excluded && f.score ? badge(String(Math.round(f.score * 10) / 10), "accent", "Göreve göre puan") : null,
        f.secrets ? badge(f.secrets + " sır", "danger", Object.keys(f.secretTypes).map((t) => C.SECRET_NAMES[t]).join(", ")) : null,
        f.injection.length ? badge("talimat", "warning", f.injection.map((x) => "satır " + x.line + ": " + x.text).join("\n")) : null,
        pin ? badge(pin === "in" ? "sabit" : "dışlandı", pin === "in" ? "success" : "") : null));
    li.addEventListener("click", () => { state.file = f.path; renderKits(); });
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
    return li;
  }

  function detail(k) {
    const live = k.status !== "arsiv";
    const p = k.pkg;
    const nm = el("input", { class: "pl-input ck-name", value: k.name, "aria-label": "Paket adı", maxlength: "120", disabled: !live });
    nm.addEventListener("change", guard(async () => apply(await D.kit.set(k.id, { name: nm.value }))));
    const task = el("textarea", { class: "pl-input ck-task", id: "taskInput", "aria-label": "Görev", maxlength: "4000", disabled: !live, placeholder: "Yapay zekâdan ne istiyorsunuz? Örn. “Kargo bulunamadığında 500 yerine 404 dönsün.”" });
    task.value = k.task;
    task.addEventListener("change", guard(async () => { apply(await D.kit.set(k.id, { task: task.value })); toast("Görev güncellendi; parçalar yeniden puanlandı."); }));
    const budget = el("select", { class: "pl-input ck-select", id: "budgetSel", "aria-label": "Token bütçesi", disabled: !live }, ...C.BUDGETS.concat(C.BUDGETS.includes(k.budget) ? [] : [k.budget]).map((b) => el("option", { value: String(b), text: num(b) + " token" })));
    budget.value = String(k.budget);
    budget.addEventListener("change", guard(async () => apply(await D.kit.set(k.id, { budget: Number(budget.value) }))));
    const srcs = el("div", { class: "ck-srcs", id: "sources" },
      ...k.sources.map((s, i) => el("span", { class: "ck-src-chip", title: s.root || s.label }, SRC_NAMES[s.kind] + ": " + s.label + (s.files && s.kind !== "sayfa" ? " (" + s.files + ")" : ""), live ? (() => { const x = el("button", { type: "button", "aria-label": "Kaynağı çıkar: " + s.label, text: "×" }); x.addEventListener("click", guard(async () => { apply(await D.kit.removeSource(k.id, i)); toast("Kaynak çıkarıldı (dosyalar silinmedi)."); })); return x; })() : null)),
      live ? btn("Klasör ekle", "pl-btn--secondary", async () => { busy("Klasör taranıyor…"); const r = await D.kit.addFolder(k.id); busy(null); if (r.cancelled) return; apply(r.state); toast("“" + r.folder + "”: " + r.included + " dosya dahil, " + r.excluded + " hariç."); }, { id: "addFolder" }) : null,
      live ? btn("Sayfa yapıştır…", "pl-btn--ghost", () => { $("pageName").value = ""; $("pageText").value = ""; $("pageDialog").showModal(); $("pageText").focus(); }, { id: "addPage" }) : null,
      live ? btn("Panodan", "pl-btn--ghost", async () => { const r = await D.kit.addClipboard(k.id); apply(r.state); toast("Panodaki içerik “" + r.path + "” olarak eklendi."); }, { id: "addClip" }) : null,
      live ? btn("Belge (.html/.md/.txt)", "pl-btn--ghost", async () => { const r = await D.kit.addFiles(k.id); if (r.cancelled) return; apply(r.state); toast(r.added + " belge eklendi" + (r.skipped.length ? " · atlanan: " + r.skipped.join(", ") : "") + ".", !r.added); }, { id: "addFiles" }) : null,
      live && k.sources.some((s) => s.kind === "klasor") ? btn("Yeniden tara", "pl-btn--ghost", async () => { const r = await D.kit.rescan(k.id); apply(r.state); toast("Yeniden tarandı: " + r.files + " dosya dahil."); }) : null);
    const fill = Math.min(100, Math.round((p.tokens / k.budget) * 100));
    const stats = el("div", { class: "ck-stats", id: "statChips" },
      badge("paket " + num(p.tokens) + " / " + num(k.budget) + " token", p.over ? "danger" : "success"), badge("tüm dahil dosyalar " + num(p.full)), p.reduction != null && p.full ? badge("azalma " + pctText(p.reduction), p.reduction >= 40 ? "success" : "warning") : null,
      badge(p.blocks.length + " parça · " + p.selectedFiles + " dosya"), p.skipped ? badge(p.skipped + " ilgili parça bütçeye sığmadı", "warning") : null, badge(p.redactions + " gizlendi", p.redactions ? "danger" : ""), p.injections.length ? badge(p.injections.length + " talimat benzeri satır", "warning") : null,
      k.coverage ? badge("örnek kapsama " + pctText(k.coverage.coverage) + " (" + k.coverage.hit + "/" + k.coverage.required + ")", k.coverage.coverage >= 90 ? "success" : "danger") : null);
    const meter = el("div", { class: "ck-meter" + (p.over ? " is-over" : ""), role: "meter", "aria-valuemin": "0", "aria-valuemax": String(k.budget), "aria-valuenow": String(p.tokens), "aria-label": "Bütçe kullanımı" }, el("span", { style: null }));
    meter.firstChild.style.width = fill + "%";

    const chosen = new Set(p.blocks.map((b) => b.path));
    const files = k.files.slice().sort((a, b) => (!!a.excluded - !!b.excluded) || (b.score - a.score) || a.path.localeCompare(b.path));
    const tree = el("div", { class: "ck-stack" }, el("span", { class: "ck-lbl", text: "Dosyalar (" + k.files.filter((f) => !f.excluded).length + " dahil · " + k.files.filter((f) => f.excluded).length + " hariç) — puana göre" }),
      el("ul", { class: "ck-tree", id: "fileTree", "aria-label": "Dosyalar" }, ...(files.length ? files.map((f) => fileRow(k, f, chosen)) : [el("li", { class: "ck-empty", text: "Kaynak yok. Klasör ya da sayfa ekleyin." })])));
    const preview = el("div", { class: "ck-stack" }, el("span", { class: "ck-lbl", text: "Paket önizleme" + (p.cut ? " (ilk 60.000 karakter)" : "") }), el("pre", { class: "ck-pre", id: "pkgPreview", text: p.text }));
    const out = [el("div", { class: "ck-dhead" }, el("div", { class: "ck-row" }, k.sampleKey ? badge("Örnek", "warning") : null, k.status === "arsiv" ? badge("Arşiv", "warning") : null, el("span", { class: "pl-muted ck-small", text: fmtWhen(k.createdAt) })), nm),
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "taskInput", text: "Görev (paket buna göre seçilir)" }), task),
      el("div", { class: "ck-controls" }, el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "budgetSel", text: "Token bütçesi" }), budget), srcs),
      stats, meter, el("div", { class: "ck-two" }, tree, preview)];

    const f = state.file && k.files.find((x) => x.path === state.file);
    if (f) {
      const ids = new Set(p.chosenIds);
      const pinBtns = (key, cur) => live && !f.excluded ? el("span", { class: "ck-fmeta" },
        btn(cur === "in" ? "Sabit ✓" : "Sabitle", cur === "in" ? "pl-btn--secondary" : "pl-btn--ghost", async () => apply(await D.kit.pin(k.id, key, cur === "in" ? "auto" : "in")), { "aria-label": "Sabitle: " + key }),
        btn(cur === "out" ? "Dışlandı ✓" : "Dışla", cur === "out" ? "pl-btn--secondary" : "pl-btn--ghost", async () => apply(await D.kit.pin(k.id, key, cur === "out" ? "auto" : "out")), { "aria-label": "Dışla: " + key })) : null;
      out.push(el("div", { class: "ck-block", id: "fileBox" },
        el("div", { class: "ck-row" }, el("b", { class: "ck-fpath", text: f.path }), el("span", { class: "ck-grow" }), pinBtns(f.path, k.pins[f.path])),
        f.excluded ? el("span", { class: "ck-hint", text: "Hariç: " + f.excluded + ". Pakete girmez; istisna için hariç tutma kurallarına !" + f.path + " ekleyin (sır dosyaları her zaman hariçtir)." }) : null,
        f.secrets ? el("span", { class: "ck-hint", text: "Sır/kişisel veri: " + Object.entries(f.secretTypes).map(([t, n]) => n + " " + C.SECRET_NAMES[t]).join(", ") + " — pakette ⟦GİZLİ⟧ ile değiştirilir." }) : null,
        f.injection.length ? el("ul", { class: "ck-notes" }, ...f.injection.map((x) => el("li", { text: "Talimat benzeri (veri sayılır) · satır " + x.line + ": " + x.text }))) : null,
        f.chunks.length ? el("ul", { class: "ck-chunks" }, ...f.chunks.map((c) => el("li", { class: "ck-chunk" + (ids.has(c.id) ? " is-in" : ""), "data-chunk": c.id },
          el("div", {}, el("span", { class: "ck-hint", text: "satır " + c.start + "–" + c.end + " · " + num(c.tokens) + " tk · puan " + c.score + (ids.has(c.id) ? " · pakette" : "") }), el("code", { text: c.head || "(boş başlık)" })),
          pinBtns(c.id, k.pins[c.id])))) : null));
    }
    if (k.ai) {
      out.push(el("div", { class: "ck-block ck-block--ai", id: "aiBlock" },
        el("div", { class: "ck-row" }, icon("spark"), el("b", { text: "MyMind önerisi (yalnız yollar ve başlıklar gönderildi)" }), el("span", { class: "ck-grow" }),
          live ? el("label", { class: "ck-check ck-check--inline" }, (() => { const c = el("input", { type: "checkbox", id: "useAi" }); c.checked = k.useAi; c.addEventListener("change", guard(async () => apply(await D.kit.set(k.id, { useAi: c.checked })))); return c; })(), el("span", { text: "Sıralamayı ve özeti kullan" })) : null),
        k.ai.order.length ? el("ol", { class: "ck-notes" }, ...k.ai.order.slice(0, 8).map((x) => el("li", { text: x }))) : el("span", { class: "ck-hint", text: "Geçerli sıralama yok." }),
        k.ai.summary ? el("p", { class: "ck-hint", text: "Özet (tahmin): " + k.ai.summary }) : null,
        k.ai.dropped ? el("div", { class: "ck-hint" }, el("b", { text: k.ai.dropped + " öğe atıldı: " }), k.ai.droppedList.join("; ")) : null));
    }
    if (state.lastExport && state.lastExport.kit === k.id) {
      const e = state.lastExport;
      out.push(el("div", { class: "ck-block " + (e.ok ? "ck-okbox" : "ck-errbox"), id: "exportBox" },
        el("b", { text: (e.ok ? "✓ " : "✕ ") + (e.format === "pano" ? "Panoya kopyalandı" : "“" + e.file + "” yazıldı") + " ve yeniden denetlendi: " + num(e.tokens) + " / " + num(e.budget) + " token, " + e.secretsLeft + " sır kaldı" }),
        el("span", { class: "ck-hint", text: e.blocks + " parça · azalma " + pctText(e.reduction) + " · " + e.redactions + " sır/kişisel veri gizlendi" + (e.coverage != null ? " · örnek görev kapsaması " + pctText(e.coverage) : "") })));
    }
    const wrap = el("div", { class: "ck-dscroll" }, ...out);
    const actions = el("div", { class: "ck-actions" },
      btn("Markdown kaydet", "pl-btn--primary", exp(D.exportMd, k.id), { id: "mdBtn" }),
      btn("JSON kaydet", "pl-btn--secondary", exp(D.exportJson, k.id), { id: "jsonBtn" }),
      btn("Panoya kopyala", "pl-btn--secondary", exp(D.exportClipboard, k.id), { id: "clipBtn" }),
      el("span", { class: "ck-grow" }),
      live ? btn("MyMind ile sırala", "pl-btn--ghost", async () => {
        busy("MyMind sıralıyor…");
        const r = await D.ai.rank(k.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind önerisi: " + r.order + " dosya sıralandı" + (r.summary ? ", özet eklendi" : "") + (r.dropped ? "; " + r.dropped + " öğe denetimde atıldı" : "") + ".");
      }, { id: "aiBtn" }) : null,
      live ? btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.kit.archive(k.id)); toast("Paket arşive taşındı (silinmedi)."); }) : btn("Arşivden geri al", "pl-btn--secondary", async () => { apply(await D.kit.restore(k.id)); state.tf = "acik"; renderKits(); toast("Paket geri alındı."); }));
    return frag([wrap, actions]);
  }
  const exp = (fn, id) => async () => {
    busy("Paket hazırlanıyor…");
    const r = await fn(id);
    busy(null);
    if (r.cancelled) return;
    state.lastExport = { kit: id, ...r };
    apply(r.state);
    toast((r.format === "pano" ? "Panoya kopyalandı" : "“" + r.file + "” kaydedildi") + ": " + num(r.tokens) + " token, " + r.secretsLeft + " sır kaldı" + (r.ok ? "." : " — denetim başarısız!"), !r.ok);
  };
  function frag(list) { const f = document.createDocumentFragment(); for (const n of list) if (n) f.appendChild(n); return f; }

  // ---------------- Dışa aktarmalar ----------------
  function renderExports() {
    const log = state.s.exportsLog, m = state.s.metrics;
    $("exportsMeta").textContent = m.exports ? m.exports + " paket · " + num(m.tokensOut) + " / " + num(m.tokensFull) + " token · azalma " + pctText(m.reduction) : "";
    if (!log.length) return put($("exportsBody"), el("p", { class: "ck-empty", text: "Henüz dışa aktarma yok." }));
    const td = (t, cls) => el("td", { class: cls || "", text: t });
    put($("exportsBody"), el("table", { class: "ck-table", id: "exportsTable" },
      el("thead", {}, el("tr", {}, ...["Tarih", "Paket", "Biçim", "Hedef", "Token / bütçe", "Azalma", "Gizlenen", "Denetim", "Kapsama"].map((h) => el("th", { text: h })))),
      el("tbody", {}, ...log.map((e) => el("tr", {}, td(fmtWhen(e.at)), td(e.kitName), td(e.format === "pano" ? "Pano" : e.format.toUpperCase()), td(e.file), td(num(e.tokens) + " / " + num(e.budget), "is-num"), td(pctText(e.reduction), "is-num"), td(String(e.redactions), "is-num"),
        el("td", {}, badge(e.ok ? "✓ " + e.secretsLeft + " sır kaldı" : "✕ " + e.secretsLeft + " sır / bütçe", e.ok ? "success" : "danger")), td(e.coverage == null ? "—" : pctText(e.coverage), "is-num"))))));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    const sm = s.samples;
    const cov = sm.length ? Math.min(...sm.map((x) => x.coverage)) : null;
    const red = sm.length ? Math.min(...sm.map((x) => x.reduction)) : null;
    put($("metrics"),
      card(pctText(cov), "örnek görevlerde gerekli bağlam kapsaması (en düşük; hedef ≥ %90)", cov >= 90 ? "is-ok" : "is-bad"),
      card(pctText(red), "örnek görevlerde paket boyutu azalması (en düşük; hedef ≥ %40)", red >= 40 ? "is-ok" : "is-bad"),
      card(pctText(m.reduction), "dışa aktarılan paketlerde azalma", m.reduction == null ? "" : m.reduction >= 40 ? "is-ok" : "is-bad"),
      card(String(m.secretsLeft), "denetimde pakette kalan sır (hedef 0)", m.secretsLeft ? "is-bad" : "is-ok"),
      card(String(m.exports), "dışa aktarılan paket"),
      card(String(m.redactions), "gizlenen sır/kişisel veri"),
      card(String(m.overBudget), "bütçeyi aşan paket (hedef 0)", m.overBudget ? "is-bad" : "is-ok"),
      card(String(m.aiDropped), "MyMind'dan atılan öğe", m.aiDropped ? "is-bad" : ""));
    put($("sampleInfo"), el("table", { class: "ck-table", id: "sampleTable" },
      el("thead", {}, el("tr", {}, ...["Örnek görev", "Kapsama", "Paket / tüm dosyalar", "Azalma", "Kaçan"].map((h) => el("th", { text: h })))),
      el("tbody", {}, ...sm.map((x) => el("tr", {}, el("td", { text: x.name }), el("td", { class: "is-num", text: pctText(x.coverage) + " (" + x.hit + "/" + x.required + ")" }), el("td", { class: "is-num", text: num(x.tokens) + " / " + num(x.full) }), el("td", { class: "is-num", text: pctText(x.reduction) }), el("td", { text: x.missed.join(", ") || "—" }))))),
      el("p", { class: "pl-muted ck-small", text: "Örnek proje uydurmadır; gerekli satırlar elle etiketlenmiştir. Gerçek projelerinizde kapsama ölçülmemiştir — paketi göndermeden önce önizlemede kontrol edin." }));
    $("setBudget").value = String(s.settings.defaultBudget);
    if (document.activeElement !== $("setRules")) $("setRules").value = s.settings.globalRules;
    $("defaultRules").textContent = "Varsayılan hariç tutma: " + C.DEFAULT_RULES.join(", ") + "; ikili dosyalar, 1 MB üstü dosyalar ve sır dosyaları (.env, *.pem, *.key, id_rsa, credentials, secrets).";
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Paketler (kaynak metinleri dahil) ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: paketler düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  document.querySelectorAll('[data-act="new"]').forEach((b) => b.addEventListener("click", guard(async () => { state.file = null; state.lastExport = null; state.tf = "acik"; apply(await D.kit.create()); go("kits"); toast("Yeni paket: görevi yazın ve kaynak ekleyin."); })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => { state.file = null; state.tf = "acik"; const r = await D.kit.sample(); apply(r.state); go("kits"); toast(r.added + " örnek görev açıldı (uydurma proje)."); })));
  $("pageCancel").addEventListener("click", () => $("pageDialog").close());
  $("pageText").addEventListener("paste", (e) => { const h = e.clipboardData ? e.clipboardData.getData("text/html") : ""; $("pageText").dataset.html = h || ""; });
  $("pageRun").addEventListener("click", guard(async () => {
    const k = active();
    const html = $("pageText").dataset.html || "";
    const r = await D.kit.addPage(k.id, $("pageText").value, html, $("pageName").value);
    $("pageText").dataset.html = "";
    $("pageDialog").close();
    apply(r.state);
    toast("“" + r.path + "” eklendi.");
  }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-tf]").forEach((b) => b.addEventListener("click", () => { state.tf = b.dataset.tf; renderKits(); }));
  $("setBudget").addEventListener("change", guard(async () => apply(await D.setSettings({ defaultBudget: Number($("setBudget").value) }))));
  $("saveRules").addEventListener("click", guard(async () => { apply(await D.setSettings({ globalRules: $("setRules").value })); toast("Hariç tutma kuralları kaydedildi; açık paketler yeniden tarandı."); }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("kits"); document.documentElement.dataset.ready = "1"; });
})();
