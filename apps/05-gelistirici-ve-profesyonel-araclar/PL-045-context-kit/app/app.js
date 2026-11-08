/* Context Kit (PL-045) — ana pencere. Her metin yalnız textContent / value ile yazılır. */
(function () {
  const D = window.ckDesktop;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["sources", "preview", "settings"];
  const state = { s: null, view: "sources", filter: "tumu" };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
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

  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "sources";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const st = s.stats;
    $("sourceCountBadge").textContent = `${st.includedCount}/${st.totalFiles}`;
    $("packageBadge").textContent = `${st.packageTokens} tok`;
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");

    put($("sideInfo"), el("div", { class: "ax-mini__in" },
      el("span", { class: "pl-muted ax-small", text: "Paket bütçesi ve kazanç" }),
      el("b", { text: `${st.packageTokens} / ${st.maxTokens} token` }),
      el("span", { class: "pl-muted ax-small", text: `Boyut azalması: ${pctText(st.sizeReductionPct)}` }),
      s.benchmark ? el("span", { class: "pl-muted ax-small", text: `Gerekli bağlam: ${pctText(s.benchmark.coveragePct)}` }) : null));

    const any = s.items.length > 0;
    $("emptyPanel").hidden = any;
    $("taskBar").hidden = !any;
    $("sourceSplit").hidden = !any;
    if (document.activeElement !== $("taskQueryInput")) $("taskQueryInput").value = s.settings.taskQuery;

    if (state.view === "sources" && any) renderSources();
    if (state.view === "preview") renderPreview();
    if (state.view === "settings") renderSettings();
  }

  function renderSources() {
    const s = state.s;
    document.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-checked", b.dataset.filter === state.filter ? "true" : "false"));
    const list = s.items.filter((it) => {
      if (state.filter === "dahil") return it.included;
      if (state.filter === "haric") return !it.included;
      if (state.filter === "guvenlik") return it.redactionsCount > 0 || it.injectionFlagged;
      return true;
    });
    const cur = list.find((x) => x.id === s.activeSourceId) || list[0] || null;
    const ul = $("sourceList");
    put(ul, ...list.map((it) => {
      const isSel = cur && cur.id === it.id;
      const chk = el("input", { type: "checkbox", "aria-label": "Pakete dahil et: " + it.path });
      chk.checked = !!it.included;
      chk.disabled = !!it.excludedByRule;
      chk.addEventListener("click", (e) => e.stopPropagation());
      chk.addEventListener("change", guard(async () => apply(await D.source.toggle(it.id, chk.checked))));

      const li = el("li", { class: "ax-item" + (isSel ? " is-sel" : ""), "data-id": it.id, tabindex: "0", role: "option", "aria-selected": isSel ? "true" : "false" },
        chk,
        el("div", {},
          el("div", { class: "ax-row" },
            el("span", { class: "ax-ititle", text: it.path }),
            it.included ? badge("Pakette", "success") : it.excludedByRule ? badge(`Hariç (${it.excludedByRule})`, "") : badge("Elenen", ""),
            badge(`${it.pkgTokens} tok`, "accent"),
            badge(`Alaka: ${it.relevanceScore}`, "info"),
            it.redactionsCount > 0 ? badge(`${it.redactionsCount} sır maskelendi`, "warning") : null,
            it.injectionFlagged ? badge("İstem enjeksiyonu (veri)", "danger") : null
          )
        )
      );
      li.addEventListener("click", guard(async () => apply(await D.source.select(it.id))));
      return li;
    }));
    renderSourceDetail(cur);
  }

  function renderSourceDetail(it) {
    const node = $("sourceDetail");
    const s = state.s;
    if (!it) {
      put(node, el("p", { class: "ax-empty", text: "Önizlemesini ve güvenlik filtrelerini görmek için soldan bir dosya veya sayfa seçin." }));
      return;
    }

    const head = el("div", { class: "ax-block" },
      el("div", { class: "ax-row" },
        badge(it.kind === "page" ? "Web sayfası / Belge" : "Kaynak dosya", "info"),
        it.included ? badge("Pakete dahil", "success") : badge(it.statusReason, ""),
        badge(`${it.pkgTokens} token · ${it.pkgBytes} bayt`, "accent"),
        badge(`Görev alaka puanı: ${it.relevanceScore}`, "")
      ),
      el("h3", { class: "pl-h3 ax-h", text: `${it.path} — ${it.title}` }),
      it.matchedTerms.length ? el("p", { class: "ax-small pl-muted", text: `Eşleşen görev terimleri: ${it.matchedTerms.join(", ")}` }) : null
    );

    const secBlock = el("div", { class: "ax-block" + (it.injectionFlagged || it.redactionsCount ? " ax-block--warn" : ""), id: "securityBox" },
      el("span", { class: "ax-lbl", text: "Sır Filtresi ve Kaynak İçi İstem Enjeksiyonu Denetimi" }),
      el("p", { class: "ax-small", text: it.redactionsCount > 0 ? `${it.redactionsCount} sır / kişisel veri maskelendi: ${it.redactionFindings.map((f) => `${f.label} (${f.count})`).join(", ")}.` : "Bu kaynakta açık sır veya kişisel veri bulunmadı." }),
      el("p", { class: "ax-small", text: it.untrustedNotice }),
      ...(it.injectionFlags || []).map((fl) => el("p", { class: "ax-small", text: `Satır ${fl.line} [${fl.label}]: ${fl.excerpt}` }))
    );

    const codeBlock = el("div", { class: "ax-block" },
      el("span", { class: "ax-lbl", text: "Maskelenmiş ve Güvenilmeyen Veri Olarak Sarılmış Önizleme" }),
      el("pre", { class: "ax-code", text: it.sanitizedContent })
    );

    let aiBox = null;
    if (s.aiSuggestion) {
      aiBox = el("div", { class: "ax-block ax-block--ai", id: "aiBox" },
        el("div", { class: "ax-row" }, icon("spark"), el("b", { text: "MyMind kısa bağlam özeti ve öncelikli dosya sıralaması" }), badge(`${s.aiSuggestion.priorityPaths.length} dosya`, "success")),
        el("p", { class: "ax-small", text: s.aiSuggestion.summary }),
        el("pre", { class: "ax-code", text: s.aiSuggestion.priorityPaths.join("\n") }),
        el("div", { class: "ax-row" },
          btn("Öncelikli dosyaları pakete sabitle", "pl-btn--secondary", async () => {
            const r = await D.ai.apply();
            apply(r.state);
            toast(`${r.applied} öncelikli kaynak pakete sabitlendi.`);
          }, { id: "aiApplyBtn" })
        )
      );
    }

    put(node, head, secBlock, aiBox, codeBlock);
  }

  function renderPreview() {
    const s = state.s;
    $("treePreviewBox").textContent = s.treeText;
    $("mdPreviewBox").textContent = s.mdPreview;
    $("xmlPreviewBox").textContent = s.xmlPreview;
  }

  function renderSettings() {
    const s = state.s, st = s.stats, b = s.benchmark;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(b ? pctText(b.coveragePct) : "—", "test görevinde gerekli bağlam kapsaması (hedef ≥ %90)", b && b.coveragePct >= 90 ? "is-ok" : ""),
      card(pctText(st.sizeReductionPct), `paket boyutunda azalma (hedef ≥ %40 · ${st.totalRepoBytes} → ${st.packageBytes} B)`, st.sizeReductionPct >= 40 ? "is-ok" : ""),
      card(`${st.packageTokens}/${st.maxTokens}`, `tahmini token bütçesi (${st.includedCount}/${st.totalFiles} kaynak)`),
      card(`${st.totalRedactions} sır · ${st.totalInjections} enj.`, "maskelenen sır ve işaretlenen istem enjeksiyonu")
    );
    $("goldInfo").textContent = b
      ? `Test görevinde gerekli ${b.expectedRequired} bağlam kaynağının ${b.coveredRequired} tanesi (%${b.coveragePct}) pakete alındı; tüm depoyu göndermek yerine paket boyutu %${b.sizeReductionPct} azaltıldı.`
      : "Örnek görevi yükleyerek ≥%90 gerekli bağlam kapsaması ve ≥%40 paket boyutu azalması ölçütünü doğrulayabilirsiniz.";

    if (document.activeElement !== $("maxTokensInput")) $("maxTokensInput").value = String(s.settings.maxTokens);
    if (document.activeElement !== $("maxBytesInput")) $("maxBytesInput").value = String(s.settings.maxBytes);
    if (document.activeElement !== $("excludeInput")) $("excludeInput").value = (s.settings.excludePatterns || []).join(", ");

    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("untrustedInfo").textContent = s.untrustedDisclaimer;
    $("vaultInfo").textContent = s.vault ? "Bağlam paketleri, ayarlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok.";
  }

  document.querySelectorAll('[data-act="add"]').forEach((b) => b.addEventListener("click", () => {
    $("srcText").value = ""; $("srcPath").value = ""; $("srcTitle").value = ""; $("srcUrl").value = "";
    $("srcDialog").showModal(); $("srcText").focus();
  }));
  $("srcCancel").addEventListener("click", () => $("srcDialog").close());
  $("srcRun").addEventListener("click", guard(async () => {
    const r = await D.source.add({
      content: $("srcText").value,
      path: $("srcPath").value.trim(),
      title: $("srcTitle").value.trim(),
      url: $("srcUrl").value.trim(),
      kind: $("srcUrl").value.trim() ? "page" : "file",
    });
    $("srcDialog").close();
    apply(r.state); go("sources");
    toast(`Kaynak eklendi · pakette ${r.includedCount} kaynak aktif.`);
  }));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.clipboard();
    apply(r.state); go("sources");
    toast(`Panodan kaynak eklendi (${r.tokens} tahmini token).`);
  })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.files();
    if (r.cancelled) return;
    apply(r.state); go("sources");
    toast(`${r.loaded} kaynak dosyası eklendi` + (r.skipped ? ` · ${r.skipped} dosya atlandı` : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.sample();
    apply(r.state); go("sources");
    toast(`${r.count} örnek kaynak yüklendi · görevle alakalı ${r.includedCount} kaynak pakete seçildi.`);
  })));
  $("taskQueryApply").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ taskQuery: $("taskQueryInput").value.trim() }));
    toast("Göreve göre dosya/parça sıralaması güncellendi.");
  }));
  $("aiBtn").addEventListener("click", guard(async () => {
    busy("MyMind bağlam özeti üretiyor…");
    const r = await D.ai.brief();
    busy(null);
    if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
    apply(r.state);
    toast(`MyMind bağlam özeti ve ${r.count} öncelikli kaynak önerdi.`);
  }));
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.filter; renderSources(); }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  $("saveBudgetBtn").addEventListener("click", guard(async () => {
    const pats = $("excludeInput").value.split(",").map((x) => x.trim()).filter(Boolean);
    apply(await D.setSettings({
      maxTokens: Number($("maxTokensInput").value),
      maxBytes: Number($("maxBytesInput").value),
      excludePatterns: pats,
    }));
    toast("Paket bütçesi ve hariç tutma kuralları uygulandı.");
  }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));
  const exp = (fn) => guard(async () => { const r = await fn(); if (!r.cancelled) toast(`“${r.file}” kaydedildi.`); });
  $("exportMdBtn").addEventListener("click", exp(D.exportMd));
  $("exportXmlBtn").addEventListener("click", exp(D.exportXml));
  $("exportJsonBtn").addEventListener("click", exp(D.exportJson));
  $("backupBtn").addEventListener("click", exp(D.backup));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("sources"); document.documentElement.dataset.ready = "1"; });
})();
