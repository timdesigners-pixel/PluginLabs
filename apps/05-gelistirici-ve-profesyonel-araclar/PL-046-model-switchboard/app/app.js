/* Model Switchboard — ana pencere. Metinler yalnız textContent / value ile yazılır (untrusted innerHTML yok). */
(function () {
  const D = window.msDesktop;
  const C = window.MSCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["arena", "catalog", "advisor", "settings"];
  const state = { s: null, view: "arena", advisorTask: "kodlama" };

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
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  function toast(message, isError) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, el("div", { class: "pl-toast__body", text: message }));
    if (isError) t.style.setProperty("--pl-c", "var(--pl-danger)");
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), 7000);
  }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };

  function populateSelects() {
    if (!state.s) return;
    const cat = state.s.catalog;
    for (const selId of ["cmpTaskType", "advisorTaskSelect"]) {
      const sel = $(selId);
      if (!sel.options.length) {
        for (const t of C.TASK_TYPES) sel.appendChild(el("option", { value: t, text: C.TASK_NAMES[t] }));
      }
    }
    for (const [selId, defId] of [["cmpModelA", state.s.settings.defaultModelA], ["cmpModelB", state.s.settings.defaultModelB]]) {
      const sel = $(selId);
      const cur = sel.value || defId;
      put(sel, ...cat.map((m) => el("option", { value: m.id, text: `${m.displayName} (${m.providerName}) — $${m.inputPer1M}/$${m.outputPer1M}` })));
      sel.value = cur;
    }
  }

  function apply(s) {
    if (s && s.settings) {
      state.s = s;
      populateSelects();
      render();
    }
  }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "arena";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.nav === state.view);
      b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false");
    });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("runCount").textContent = String(m.runsCount);
    $("catalogCount").textContent = String(s.catalog.length);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");

    put($("sideInfo"), el("div", { class: "ms-mini__in" },
      el("span", { class: "pl-muted ms-small", text: "Maliyet görünürlüğü · Bütçe aşımı" }),
      el("b", { class: m.budgetOverruns === 0 && m.costVisibilityPct === 100 ? "is-ok" : "is-bad", text: `%${m.costVisibilityPct} · ${m.budgetOverruns} aşım` }),
      el("span", { class: "pl-muted ms-small", text: `Harcama: $${m.totalSpentUsd.toFixed(6)} / $${m.budgetCapUsd.toFixed(4)}` })
    ));

    put($("budgetChip"),
      el("span", { text: `Bütçe: $${m.totalSpentUsd.toFixed(6)} / $${m.budgetCapUsd.toFixed(4)} USD` }),
      badge(`%${m.costVisibilityPct} maliyet görünür`, "success"),
      m.preventedOverruns ? badge(`${m.preventedOverruns} aşım engellendi`, "warning") : null
    );

    if (state.view === "arena") renderArena();
    if (state.view === "catalog") renderCatalog();
    if (state.view === "advisor") renderAdvisor();
    if (state.view === "settings") renderSettings();
  }

  function renderArena() {
    const s = state.s;
    const list = s.runs;
    $("emptyPanel").hidden = list.length > 0;
    $("arenaSplit").hidden = list.length === 0;
    if (!list.length) return;

    $("arenaListInfo").textContent = `${list.length} karşılaştırma görevi · %${s.metrics.costVisibilityPct} gerçek maliyet görünürlüğü`;
    put($("runList"), ...list.map((r) => {
      const sel = r.id === s.active;
      const li = el("li", { class: "ms-item" + (sel ? " is-sel" : ""), "data-id": r.id, role: "option", tabindex: "0", "aria-selected": sel ? "true" : "false" },
        el("span", { class: "ms-ititle", text: r.title }),
        el("div", { class: "ms-imeta" },
          badge(C.TASK_NAMES[r.taskType] || r.taskType, "accent"),
          badge(`$${r.totalCostUsd.toFixed(6)} USD`, "success"),
          badge(`${r.sideA.displayName} vs ${r.sideB.displayName}`)
        )
      );
      li.addEventListener("click", guard(async () => apply(await D.run.open(r.id))));
      return li;
    }));

    const cur = list.find((r) => r.id === s.active) || list[0];
    if (!cur) return;

    const renderSide = (label, side, isWinner) => el("div", { class: "ms-colcard" + (isWinner ? " is-win" : "") },
      el("div", { class: "ms-bar" },
        badge(label, "accent"),
        el("b", { text: side.displayName }),
        el("span", { class: "pl-muted ms-small", text: side.providerName }),
        isWinner ? badge("Önde", "success") : null
      ),
      el("div", { class: "ms-imeta" },
        badge(`Maliyet: $${side.costUsd.toFixed(6)} USD`, "success"),
        badge(`${side.inputTokens} girdi / ${side.outputTokens} çıktı token`),
        badge(`${side.latencyMs} ms`),
        badge(`Kalite: ${side.qualityScore}/100`, side.qualityScore >= 80 ? "success" : "warning")
      ),
      el("span", { class: "pl-muted ms-small", text: `Katalog fiyat doğrulama tarihi: ${side.verifiedAt} · Karşılanan ölçütler: ${side.matchedCriteria.join(", ") || "—"}` }),
      el("pre", { class: "ms-pre", text: side.output })
    );

    put($("runDetail"),
      el("div", { class: "ms-bar" },
        badge(C.TASK_NAMES[cur.taskType] || cur.taskType, "accent"),
        badge(`Toplam görev maliyeti: $${cur.totalCostUsd.toFixed(6)} USD (%100 görünür)`, "success"),
        badge(`Test ID: ${cur.id}`)
      ),
      el("h2", { class: "pl-h3 ms-h", text: cur.title }),
      el("div", { class: "ms-block" },
        el("span", { class: "pl-muted ms-small", text: "Görev istemi (Prompt) · Ölçütler: " + cur.criteria.join(", ") }),
        el("pre", { class: "ms-pre", text: cur.prompt })
      ),
      el("div", { class: "ms-sidebyside" },
        renderSide("Model A", cur.sideA, cur.winner === cur.sideA.modelId),
        renderSide("Model B", cur.sideB, cur.winner === cur.sideB.modelId)
      )
    );
  }

  function renderCatalog() {
    const s = state.s;
    $("openaiKeyInfo").textContent = s.providerKeys.openai
      ? "OpenAI resmi API anahtarı kayıtlı (" + (s.vault ? "Windows kasasında DPAPI şifreli" : "yalnız bellekte") + "). Tüketici çerezi kullanılmaz."
      : "Henüz OpenAI resmi API anahtarı girilmedi.";
    $("anthropicKeyInfo").textContent = s.providerKeys.anthropic
      ? "Anthropic resmi API anahtarı kayıtlı (" + (s.vault ? "Windows kasasında DPAPI şifreli" : "yalnız bellekte") + "). Tüketici çerezi kullanılmaz."
      : "Henüz Anthropic resmi API anahtarı girilmedi.";

    const tbl = el("table", { class: "ms-table", id: "catalogTable" },
      el("thead", {}, el("tr", {},
        el("th", { text: "Sağlayıcı" }),
        el("th", { text: "Model" }),
        el("th", { text: "Girdi ($ / 1M)" }),
        el("th", { text: "Çıktı ($ / 1M)" }),
        el("th", { text: "Doğrulama Tarihi" }),
        el("th", { text: "Kimlik Doğrulama" })
      )),
      el("tbody", {}, ...s.catalog.map((m) => el("tr", { "data-model": m.id },
        el("td", { text: m.providerName }),
        el("td", {}, el("b", { text: m.displayName }), el("span", { class: "pl-muted ms-small", text: " (" + m.modelId + ")" })),
        el("td", { text: "$" + m.inputPer1M.toFixed(2) }),
        el("td", { text: "$" + m.outputPer1M.toFixed(2) }),
        el("td", {}, badge(m.verifiedAt, "success")),
        el("td", {}, badge("Resmi API Anahtarı (Çerezsiz)", "accent"))
      )))
    );
    put($("catalogTableWrap"), tbl);
  }

  function renderAdvisor() {
    const s = state.s;
    const tType = $("advisorTaskSelect").value || s.settings.defaultTaskType;
    const rec = C.recommendModelForTask(tType, s.runs, s.catalog);

    put($("advisorSummaryBox"),
      el("div", { class: "ms-block" },
        el("div", { class: "ms-bar" },
          badge(rec.taskLabel, "accent"),
          badge(rec.tiedToBenchmark ? `Kayıtlı test kanıtı: ${rec.evidenceRunIds.join(", ")}` : "Henüz kayıtlı test yok", rec.tiedToBenchmark ? "success" : "warning")
        ),
        el("h3", { class: "pl-h3 ms-h", text: `Önerilen model: ${rec.recommendedName} (${rec.providerName})` }),
        el("p", { class: "ms-small", text: rec.summary }),
        rec.candidates.length ? el("table", { class: "ms-table" },
          el("thead", {}, el("tr", {},
            el("th", { text: "Model" }),
            el("th", { text: "Kayıtlı Test Kanıtı" }),
            el("th", { text: "Ortalama Kalite" }),
            el("th", { text: "Ortalama Gecikme" }),
            el("th", { text: "Ortalama Maliyet" })
          )),
          el("tbody", {}, ...rec.candidates.map((c) => el("tr", {},
            el("td", {}, el("b", { text: c.displayName })),
            el("td", { text: c.evidenceRunIds.join(", ") }),
            el("td", { text: `${c.avgQuality}/100` }),
            el("td", { text: `${c.avgLatencyMs} ms` }),
            el("td", { text: `$${c.avgCostUsd.toFixed(6)} USD` })
          )))
        ) : null
      )
    );

    const ai = s.lastAiRec;
    put($("advisorAiBox"), ai ? el("div", { class: "ms-block ms-block--ai", id: "aiRecBox" },
      el("div", { class: "ms-bar" },
        badge("MyMind önerisi (kayıtlı testlere bağlı)", "pro"),
        badge(`Kanıt: ${ai.evidenceRunIds.join(", ") || "—"}`, "success"),
        ai.dropped ? badge(`${ai.dropped} uydurma öğe atıldı`, "warning") : null
      ),
      el("b", { text: `${ai.recommendedName} (${ai.providerName})` }),
      el("p", { class: "ms-small", text: ai.reason })
    ) : null);
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(`%${m.costVisibilityPct}`, "görev başına gerçek maliyet görünürlüğü (hedef %100)", m.costVisibilityPct === 100 ? "is-ok" : "is-bad"),
      card(String(m.budgetOverruns), "bütçe tavanı aşımı (hedef 0)", m.budgetOverruns === 0 ? "is-ok" : "is-bad"),
      card(String(m.preventedOverruns), "bütçe tavanıyla engellenen aşım"),
      card(`$${m.totalSpentUsd.toFixed(6)}`, "toplam gerçek görev maliyeti (USD)"),
      card(`$${m.budgetCapUsd.toFixed(4)}`, "kullanıcı bütçe tavanı (USD)"),
      card(String(m.rejectedCookies), "reddedilen tüketici web çerezi"),
      card(String(m.aiRuns), "MyMind model önerisi"),
      card(String(m.aiDropped), "MyMind denetiminde atılan uydurma öğe")
    );

    if (document.activeElement !== $("budgetCapInput")) $("budgetCapInput").value = String(s.settings.budgetCapUsd);
    $("budgetStatusText").textContent = `Kalan bütçe: $${m.remainingBudgetUsd.toFixed(6)} USD (Toplam harcama: $${m.totalSpentUsd.toFixed(6)} USD).`;

    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault
      ? "Resmi API anahtarları, MyMind anahtarı ve karşılaştırma geçmişi Windows kasasında (DPAPI) şifreli saklanır."
      : "Bu sistemde işletim sistemi kasası yok: veriler düz JSON olarak, anahtarlar yalnız bellekte tutulur.";
  }

  function updateModalEstimate() {
    if (!state.s) return;
    const cat = state.s.catalog;
    const mA = cat.find((x) => x.id === $("cmpModelA").value) || cat[0];
    const mB = cat.find((x) => x.id === $("cmpModelB").value) || cat[1];
    const prompt = $("cmpPrompt").value || "Örnek görev";
    const pair = C.estimatePairCost(mA, mB, prompt, state.s.settings.expectedOutputTokens);
    const capCheck = C.checkBudgetCap(state.s.metrics.totalSpentUsd, pair.combinedCostUsd, state.s.settings.budgetCapUsd);
    put($("cmpEstimateBox"),
      el("div", { class: "ms-bar" },
        badge(`Tahmini A (${mA.displayName}): $${pair.a.totalCostUsd.toFixed(6)} USD`),
        badge(`Tahmini B (${mB.displayName}): $${pair.b.totalCostUsd.toFixed(6)} USD`),
        badge(`Toplam: $${pair.combinedCostUsd.toFixed(6)} USD`, capCheck.allowed ? "success" : "warning")
      ),
      el("span", { class: "ms-small", text: capCheck.reason })
    );
  }

  function openNewModal() {
    populateSelects();
    $("cmpTitle").value = "";
    $("cmpPrompt").value = "";
    $("cmpCriteria").value = "fonksiyon, hata, test";
    $("cmpOutA").value = "";
    $("cmpOutB").value = "";
    updateModalEstimate();
    $("cmpDialog").showModal();
  }

  $("openNewCompare").addEventListener("click", openNewModal);
  $("emptyNewBtn").addEventListener("click", openNewModal);
  $("cmpCancel").addEventListener("click", () => $("cmpDialog").close());
  for (const id of ["cmpModelA", "cmpModelB", "cmpPrompt"]) $(id).addEventListener("input", updateModalEstimate);

  $("cmpRunBtn").addEventListener("click", guard(async () => {
    const r = await D.run.compare({
      taskType: $("cmpTaskType").value,
      title: $("cmpTitle").value,
      modelA: $("cmpModelA").value,
      modelB: $("cmpModelB").value,
      prompt: $("cmpPrompt").value,
      criteria: $("cmpCriteria").value,
      outA: $("cmpOutA").value,
      outB: $("cmpOutB").value,
    });
    $("cmpDialog").close();
    apply(r.state);
    go("arena");
    toast(`Yan yana karşılaştırma tamamlandı (gerçek maliyet: $${r.costUsd.toFixed(6)} USD).`);
  }));

  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.run.loadSample();
    apply(r.state);
    go("arena");
    toast(`${r.added} örnek karşılaştırma görevi yüklendi (%100 maliyet görünürlüğü).`);
  })));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));

  $("openaiSave").addEventListener("click", guard(async () => {
    const r = await D.keys.setProviderKey("openai", $("openaiKey").value);
    $("openaiKey").value = "";
    apply(r.state);
    toast("OpenAI resmi API anahtarı kaydedildi.");
  }));
  $("openaiForget").addEventListener("click", guard(async () => {
    const r = await D.keys.setProviderKey("openai", null);
    apply(r.state);
    toast("OpenAI API anahtarı kaldırıldı.");
  }));
  $("anthropicSave").addEventListener("click", guard(async () => {
    const r = await D.keys.setProviderKey("anthropic", $("anthropicKey").value);
    $("anthropicKey").value = "";
    apply(r.state);
    toast("Anthropic resmi API anahtarı kaydedildi.");
  }));
  $("anthropicForget").addEventListener("click", guard(async () => {
    const r = await D.keys.setProviderKey("anthropic", null);
    apply(r.state);
    toast("Anthropic API anahtarı kaldırıldı.");
  }));

  $("advisorTaskSelect").addEventListener("change", () => renderAdvisor());
  $("askAdvisorAiBtn").addEventListener("click", guard(async () => {
    busy("MyMind model önerisi hesaplanıyor…");
    const r = await D.ai.recommend($("advisorTaskSelect").value);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
    apply(r.state);
    toast(`MyMind model önerisi hazır: ${r.rec.recommendedName}` + (r.dropped ? ` (${r.dropped} uydurma öğe atıldı)` : "") + ".");
  }));

  $("saveBudgetBtn").addEventListener("click", guard(async () => {
    const val = Number($("budgetCapInput").value);
    if (isNaN(val) || val < 0) return toast("Geçerli bir bütçe tavanı girin.", true);
    apply(await D.setSettings({ budgetCapUsd: val }));
    toast(`Kullanıcı bütçe tavanı $${val.toFixed(4)} USD olarak güncellendi.`);
  }));

  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));

  const exp = (fn) => guard(async () => {
    const r = await fn();
    if (r.cancelled) return;
    toast(`“${r.file}” kaydedildi.`);
  });
  $("csvBtn").addEventListener("click", exp(D.exportCsv));
  $("mdBtn").addEventListener("click", exp(D.exportMd));
  $("backupBtn").addEventListener("click", exp(D.backup));

  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s && state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok.";
    $("mymindDialog").showModal();
  });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => {
    const r = await D.ai.setKey($("mymindKey").value);
    $("mymindDialog").close();
    toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bellekte tutuluyor.");
    apply(await D.state());
  }));
  $("mymindForget").addEventListener("click", guard(async () => {
    await D.ai.setKey(null);
    $("mymindDialog").close();
    toast("Anahtar kaldırıldı.");
    apply(await D.state());
  }));

  D.onState(apply);
  D.state().then((s) => {
    apply(s);
    go("arena");
    document.documentElement.dataset.ready = "1";
  });
})();
