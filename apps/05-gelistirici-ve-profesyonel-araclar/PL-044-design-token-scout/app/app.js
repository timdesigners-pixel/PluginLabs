/* Design Token Scout (PL-044) — ana pencere. Her metin yalnız textContent / value ile yazılır. */
(function () {
  const D = window.dtsDesktop;
  const C = window.DTSCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["tokens", "preview", "settings"];
  const state = { s: null, view: "tokens", cat: "tumu" };
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
    state.view = VIEWS.includes(view) ? view : "tokens";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const st = s.stats;
    $("tokenCountBadge").textContent = String(st.tokenCount);
    $("approvedBadge").textContent = `${st.approvedCount}/${st.tokenCount}`;
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");

    put($("sideInfo"), el("div", { class: "ax-mini__in" },
      el("span", { class: "pl-muted ax-small", text: "Kümeleme kazancı" }),
      el("b", { text: `${st.rawUniqueCount} → ${st.tokenCount} token` }),
      el("span", { class: "pl-muted ax-small", text: `Tekrar azalması: ${pctText(st.duplicationReductionPct)}` }),
      s.coverage ? el("span", { class: "pl-muted ax-small", text: `5 sayfa kapsama: ${pctText(s.coverage.coveragePct)}` }) : null));

    const any = s.candidates.length > 0;
    $("emptyPanel").hidden = any;
    $("tokenSplit").hidden = !any;
    if (state.view === "tokens" && any) renderTokens();
    if (state.view === "preview") renderPreview();
    if (state.view === "settings") renderSettings();
  }

  function renderTokens() {
    const s = state.s;
    document.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-checked", b.dataset.cat === state.cat ? "true" : "false"));
    const list = s.candidates.filter((c) => state.cat === "tumu" || c.category === state.cat);
    const cur = list.find((c) => c.id === s.activeTokenId) || list[0] || null;
    const ul = $("tokenList");
    put(ul, ...list.map((c) => {
      const isSel = cur && cur.id === c.id;
      const chk = el("input", { type: "checkbox", "aria-label": "Onayla: " + (c.semanticRole || c.name) });
      chk.checked = !!c.approved;
      chk.addEventListener("click", (e) => e.stopPropagation());
      chk.addEventListener("change", guard(async () => apply(await D.token.update(c.id, { approved: chk.checked }))));

      const sw = el("span", { class: "ax-swatch" });
      if (c.category === "color") sw.style.backgroundColor = c.value;
      else sw.textContent = c.category === "typography" ? "Aa" : c.category === "spacing" ? "↔" : "◜";

      const li = el("li", { class: "ax-item" + (isSel ? " is-sel" : ""), "data-id": c.id, tabindex: "0", role: "option", "aria-selected": isSel ? "true" : "false" },
        chk, sw,
        el("div", {},
          el("div", { class: "ax-row" },
            el("span", { class: "ax-ititle", text: c.semanticRole || c.name }),
            badge(c.value, "accent"),
            badge(`${c.count}×`, ""),
            (c.mergedValues || []).length > 1 ? badge(`${c.mergedValues.length} yakın değer kümelendi`, "info") : null
          )
        )
      );
      li.addEventListener("click", guard(async () => apply(await D.token.select(c.id))));
      return li;
    }));
    renderTokenDetail(cur);
  }

  function renderTokenDetail(c) {
    const node = $("tokenDetail");
    const s = state.s;
    if (!c) {
      put(node, el("p", { class: "ax-empty", text: "Ayrıntısını görmek için soldan bir token adayı seçin." }));
      return;
    }
    const sw = el("div", { class: "ax-swatch ax-swatch--lg" });
    if (c.category === "color") sw.style.backgroundColor = c.value;

    const nameIn = el("input", { class: "pl-input", id: "tokNameInput", value: c.name, maxlength: "80" });
    const semIn = el("input", { class: "pl-input", id: "tokSemInput", value: c.semanticRole || "", maxlength: "80", placeholder: "ör. color.accent.brand veya space.md" });

    const head = el("div", { class: "ax-block" },
      el("div", { class: "ax-row" },
        c.category === "color" ? sw : null,
        el("div", {},
          el("div", { class: "ax-row" }, badge(C.CATEGORY_NAMES[c.category], "info"), badge(`W3C $type: ${c.w3cType}`, ""), badge(`${c.count} kullanım`, "accent")),
          el("h3", { class: "pl-h3 ax-h", text: `${c.semanticRole || c.name} = ${c.value}` })
        )
      ),
      el("div", { class: "ax-capgrid" },
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "tokNameInput", text: "Temel token adı" }), nameIn),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "tokSemInput", text: "Semantik rol / hiyerarşi (isteğe bağlı)" }), semIn)
      ),
      el("div", { class: "ax-row" },
        btn("Token adını kaydet", "pl-btn--primary", async () => {
          apply(await D.token.update(c.id, { name: nameIn.value, semanticRole: semIn.value }));
          toast("Token adı güncellendi.");
        }, { id: "saveTokBtn" })
      )
    );

    const clusterBlock = el("div", { class: "ax-block" },
      el("span", { class: "ax-lbl", text: `Kümelenen ham değerler (${(c.mergedValues || []).length})` }),
      el("p", { class: "ax-small", text: (c.mergedValues || []).join(" · ") }),
      el("span", { class: "ax-lbl", text: "Görüldüğü seçiciler" }),
      el("p", { class: "ax-small", text: (c.selectors || []).join(", ") })
    );

    let aiBox = null;
    if (s.aiSuggestion) {
      aiBox = el("div", { class: "ax-block ax-block--ai", id: "aiBox" },
        el("div", { class: "ax-row" }, icon("spark"), el("b", { text: "MyMind semantik token hiyerarşisi önerisi" }), badge(`${s.aiSuggestion.suggestions.length} rol`, "success")),
        el("p", { class: "ax-small", text: s.aiSuggestion.summary }),
        el("pre", { class: "ax-code", text: s.aiSuggestion.suggestions.map((x) => `${x.id} → ${x.semanticRole}`).join("\n") }),
        el("div", { class: "ax-row" },
          btn("Semantik hiyerarşiyi uygula", "pl-btn--secondary", async () => {
            const r = await D.ai.apply();
            apply(r.state);
            toast(`${r.applied} tokena semantik rol uygulandı.`);
          }, { id: "aiApplyBtn" })
        )
      );
    }

    put(node, head, clusterBlock, aiBox);
  }

  function renderPreview() {
    const s = state.s;
    $("w3cPreviewBox").textContent = s.w3cPreview;
    $("cssPreviewBox").textContent = s.cssPreview;
  }

  function renderSettings() {
    const s = state.s, st = s.stats, cov = s.coverage;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(cov ? pctText(cov.coveragePct) : "—", "5 sayfada ana değer kapsama (hedef ≥ %90)", cov && cov.coveragePct >= 90 ? "is-ok" : ""),
      card(pctText(st.duplicationReductionPct), `token tekrarında düşüş (${st.rawUniqueCount} → ${st.tokenCount})`, st.duplicationReductionPct > 0 ? "is-ok" : ""),
      card(`${st.approvedCount}/${st.tokenCount}`, "kullanıcı onaylı token adayı"),
      card(String(st.sourcesCount), `örneklenen sayfa / durum (${st.totalObservations} gözlem)`)
    );
    $("goldInfo").textContent = cov ? `Örnek 5 sayfada kullanılan ${cov.expectedCore} ana tasarım değerinin ${cov.coveredCore} tanesi (%${cov.coveragePct}) kümelenmiş tokenlarla kapsandı.` : "Örnek 5 sayfayı yükleyerek ≥%90 ana değer kapsama ölçütünü doğrulayabilirsiniz.";
    if (document.activeElement !== $("colorTolInput")) $("colorTolInput").value = String(s.settings.colorTolerance);
    if (document.activeElement !== $("spaceTolInput")) $("spaceTolInput").value = String(s.settings.spacingTolerance);

    put($("sourcesBox"),
      el("span", { class: "ax-lbl", text: `Örneklenen Sayfalar ve Dinamik Durumlar (${s.sources.length})` }),
      ...s.sources.map((src) => el("div", { class: "ax-row ax-small" },
        el("b", { text: src.title }), badge(src.state, "info"), badge(`${src.obsCount} stil`, "")
      ))
    );

    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("ownershipInfo").textContent = s.ownershipDisclaimer;
    $("vaultInfo").textContent = s.vault ? "Örnekler, onaylı tokenlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok.";
  }

  document.querySelectorAll('[data-act="add"]').forEach((b) => b.addEventListener("click", () => {
    $("srcText").value = ""; $("srcTitle").value = ""; $("srcState").value = "varsayilan"; $("srcUrl").value = "";
    $("srcDialog").showModal(); $("srcText").focus();
  }));
  $("srcCancel").addEventListener("click", () => $("srcDialog").close());
  $("srcRun").addEventListener("click", guard(async () => {
    const r = await D.source.add({
      source: $("srcText").value,
      title: $("srcTitle").value.trim(),
      state: $("srcState").value.trim(),
      url: $("srcUrl").value.trim(),
    });
    $("srcDialog").close();
    apply(r.state); go("tokens");
    toast(`${r.obsCount} stil gözlemi eklendi · toplam ${r.tokenCount} kümelenmiş token adayı.`);
  }));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.clipboard();
    apply(r.state); go("tokens");
    toast(`Panodan ${r.obsCount} stil gözlemi eklendi.`);
  })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.files();
    if (r.cancelled) return;
    apply(r.state); go("tokens");
    toast(`${r.loaded} stil dosyası eklendi` + (r.skipped ? ` · ${r.skipped} dosya atlandı` : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.source.sample();
    apply(r.state); go("tokens");
    toast(`${r.pages} örnek sayfa yüklendi · ${r.tokenCount} kümelenmiş token adayı hazır.`);
  })));
  $("aiBtn").addEventListener("click", guard(async () => {
    busy("MyMind semantik hiyerarşi öneriyor…");
    const r = await D.ai.hierarchy();
    busy(null);
    if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
    apply(r.state);
    toast(`MyMind ${r.count} semantik token rolü önerdi.`);
  }));
  document.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { state.cat = b.dataset.cat; renderTokens(); }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  $("saveThresholds").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ colorTolerance: Number($("colorTolInput").value), spacingTolerance: Number($("spaceTolInput").value) }));
    toast("Kümeleme eşikleri uygulandı.");
  }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));
  const exp = (fn) => guard(async () => { const r = await fn(); if (!r.cancelled) toast(`“${r.file}” kaydedildi.`); });
  $("exportJsonBtn").addEventListener("click", exp(D.exportJson));
  $("exportCssBtn").addEventListener("click", exp(D.exportCss));
  $("exportMdBtn").addEventListener("click", exp(D.exportMd));
  $("backupBtn").addEventListener("click", exp(D.backup));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("tokens"); document.documentElement.dataset.ready = "1"; });
})();
