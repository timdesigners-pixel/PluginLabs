/* Offline Aid — ana pencere. Metinler yalnız textContent / value ile yazılır (untrusted innerHTML yok). */
(function () {
  const D = window.oaDesktop;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["tasks", "models", "settings"];
  const state = { s: null, view: "tasks" };

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

  function apply(s) {
    if (s && s.settings) {
      state.s = s;
      render();
    }
  }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "tasks";
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
    $("taskCount").textContent = String(m.completedTasks);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");

    put($("sideInfo"), el("div", { class: "oa-mini__in" },
      el("span", { class: "pl-muted oa-small", text: "Dış ağ isteği · Ortalama gecikme" }),
      el("b", { text: `${m.externalRequests} istek · ${m.avgLatencyMs} ms` }),
      el("span", { class: "pl-muted oa-small", text: s.hardware.selectedModel.displayName })
    ));

    if (state.view === "tasks") renderTasks();
    if (state.view === "models") renderModels();
    if (state.view === "settings") renderSettings();
  }

  function renderTasks() {
    const s = state.s;
    const list = s.tasks;
    $("emptyPanel").hidden = list.length > 0;
    $("taskSplit").hidden = list.length === 0;
    if (!list.length) return;

    $("taskListInfo").textContent = `${list.length} tamamlanan çevrimdışı görev · Dış ağ isteği: ${s.metrics.externalRequests}`;
    put($("taskList"), ...list.map((t) => {
      const sel = t.id === s.active;
      const li = el("li", { class: "oa-item" + (sel ? " is-sel" : ""), "data-id": t.id, role: "option", tabindex: "0", "aria-selected": sel ? "true" : "false" },
        el("span", { class: "oa-ititle", text: t.title }),
        el("div", { class: "oa-imeta" },
          badge(t.modeLabel, "accent"),
          badge(`${t.latencyMs} ms`, "success"),
          badge(t.modelId === "modelsiz:kural-tabanli" ? "Modelsiz motor" : t.modelName, t.modelId === "modelsiz:kural-tabanli" ? "" : "pro")
        )
      );
      li.addEventListener("click", guard(async () => apply(await D.task.open(t.id))));
      return li;
    }));

    const cur = list.find((x) => x.id === s.active) || list[0];
    if (!cur) return;

    put($("taskDetail"),
      el("div", { class: "oa-bar" },
        badge(cur.modeLabel, "accent"),
        badge(`Motor: ${cur.modelName}`, cur.modelId === "modelsiz:kural-tabanli" ? "" : "pro"),
        badge(`Lisans: ${cur.modelLicense}`),
        badge(`Gecikme: ${cur.latencyMs} ms`, "success"),
        badge(`Dış ağ isteği: ${cur.externalNetworkRequests}`, "success"),
        cur.maskedCount ? badge(`${cur.maskedCount} hassas veri maskelendi`, "warning") : null
      ),
      el("h2", { class: "pl-h3 oa-h", text: cur.title }),
      el("p", { class: "pl-muted oa-small", text: `Donanım profili: ${cur.hardwareProfile} · Girdi: ${cur.inputWords} sözcük → Çıktı: ${cur.outputWords} sözcük` }),
      el("div", { class: "oa-block", id: "taskOutputBox" },
        el("b", { text: "Cihaz içi çıkarım sonucu" }),
        el("pre", { class: "oa-pre", text: cur.outputText })
      ),
      el("div", { class: "oa-block" },
        el("b", { text: "Kaynak metin" }),
        el("p", { class: "oa-small", text: cur.inputText })
      ),
      el("div", { class: "oa-block oa-block--warn" },
        el("span", { class: "oa-small", text: s.disclaimer })
      )
    );
  }

  function renderModels() {
    const s = state.s;
    const hw = s.hardware;
    put($("hwBanner"),
      el("div", { class: "oa-bar" },
        el("b", { text: `${hw.cpuModel} · ${hw.totalRamGb} GB Toplam RAM (${hw.freeRamGb} GB Boş) · ${hw.cpuCores} Çekirdek` }),
        badge(hw.compatible ? "Donanım uyumlu" : "Düşük donanım uyarısı", hw.compatible ? "success" : "warning"),
        badge(`Seçili: ${hw.selectedModel.displayName}`, "accent")
      ),
      el("p", { class: "oa-small", text: hw.note })
    );

    put($("modelGrid"), ...s.models.map((m) => {
      const sel = m.id === s.settings.selectedModelId;
      const pickBtn = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (sel ? "pl-btn--primary" : "pl-btn--secondary"), "data-select-model": m.id }, sel ? "Seçili motor" : "Bu motoru seç");
      pickBtn.addEventListener("click", guard(async () => {
        apply(await D.setSettings({ selectedModelId: m.id }));
        toast(`Çıkarım motoru seçildi: ${m.displayName}`);
      }));
      return el("div", { class: "oa-modelcard" + (sel ? " is-sel" : ""), "data-model": m.id },
        el("div", { class: "oa-bar" },
          el("b", { text: m.displayName }),
          m.recommendedForLowHardware ? badge("Düşük donanım dostu", "success") : badge(`En az ${m.minRamGb} GB RAM`, "accent")
        ),
        el("span", { class: "pl-muted oa-small", text: `Aile: ${m.family}` }),
        el("div", { class: "oa-imeta" },
          badge(`Lisans: ${m.license}`),
          badge(`RAM: ≥${m.minRamGb} GB · VRAM: ≥${m.minVramGb} GB`),
          badge(m.quantization)
        ),
        el("p", { class: "oa-small", text: `Güncelleme kaynağı: ${m.updateSource}` }),
        el("div", { class: "oa-row" }, pickBtn)
      );
    }));
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label) => el("div", {}, el("b", { text: v }), el("span", { text: label }));
    put($("metrics"),
      card(String(m.completedTasks), "ağsız tamamlanan görev"),
      card(String(m.externalRequests), "dışa giden model isteği (hedef 0)"),
      card(`${m.avgLatencyMs} ms`, `ortalama donanım gecikmesi (${m.hardwareSummary})`),
      card(String(m.ruleBasedRuns), "modelsiz kural tabanlı çıkarım"),
      card(String(m.localLlmRuns), "yerel LLM çıkarımı (loopback)"),
      card(String(m.blockedExternalUrls), "engellenen dış ağ adresi denemesi"),
      card(s.hardware.selectedModel.license, "aktif model lisansı"),
      card(`${s.hardware.selectedModel.minRamGb} GB`, "aktif model RAM gereksinimi")
    );
    put($("riskDisclaimerBox"),
      el("b", { text: "Çevrimdışı Sorumluluk ve Güvenlik Sınırı" }),
      el("p", { class: "oa-small", text: s.disclaimer })
    );

    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault
      ? "Tamamlanan çevrimdışı görevler ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır."
      : "Bu sistemde işletim sistemi kasası yok: görev kayıtları düz JSON olarak saklanır.";
  }

  function openNewTask() {
    $("taskTitle").value = "Saha bakım ve güvenlik kontrol notu";
    $("taskMode").value = "ozet";
    $("taskInput").value = "Trafo yedek güç ünitesi test edildi ve kritik eşik içinde bulundu. Karar olarak cuma gününe kadar batarya bloklarının yenilenmesi kararlaştırıldı. İletişim: saha.ekip@ornek-enerji.org.";
    $("taskDialog").showModal();
  }

  $("openNewTaskBtn").addEventListener("click", openNewTask);
  $("emptyNewTaskBtn").addEventListener("click", openNewTask);
  $("taskCancel").addEventListener("click", () => $("taskDialog").close());

  $("runRuleBtn").addEventListener("click", guard(async () => {
    const r = await D.task.runRuleBased({
      title: $("taskTitle").value.trim(),
      mode: $("taskMode").value,
      text: $("taskInput").value,
    });
    $("taskDialog").close();
    apply(r.state);
    go("tasks");
    toast(`Modelsiz motorla tamamlandı (${r.latencyMs} ms · dış ağ isteği: 0).`);
  }));

  $("runLlmBtn").addEventListener("click", guard(async () => {
    busy("Yerel model cihazda çalıştırılıyor…");
    const r = await D.task.runLocalLlm({
      title: $("taskTitle").value.trim(),
      mode: $("taskMode").value,
      text: $("taskInput").value,
      modelId: state.s && state.s.settings.selectedModelId,
    });
    busy(null);
    if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
    $("taskDialog").close();
    apply(r.state);
    go("tasks");
    toast(`Yerel modelle tamamlandı (${r.latencyMs} ms · dış ağ isteği: 0).`);
  }));

  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.task.loadSample();
    apply(r.state);
    go("tasks");
    toast(`${r.added} örnek çevrimdışı metin görevi yüklendi.`);
  })));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel sunucu adresi kaydedildi.");
  }));

  const exp = (fn) => guard(async () => {
    const r = await fn();
    if (r.cancelled) return;
    toast(`“${r.file}” kaydedildi.`);
  });
  $("txtBtn").addEventListener("click", exp(D.exportTxt));
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
    go("tasks");
    document.documentElement.dataset.ready = "1";
  });
})();
