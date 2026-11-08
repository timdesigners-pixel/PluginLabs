/* Permission Radar — ana pencere. Metinler yalnız textContent / value ile yazılır (untrusted innerHTML yok). */
(function () {
  const D = window.prDesktop;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["inventory", "changes", "settings"];
  const state = { s: null, view: "inventory" };

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

  const LEVEL_TONE = { kritik: "warning", yuksek: "accent", orta: "", dusuk: "success", uyari: "warning" };
  const LEVEL_LABEL = { kritik: "Kritik", yuksek: "Yüksek", orta: "Orta", dusuk: "Düşük", uyari: "Uyarı" };

  function apply(s) {
    if (s && s.settings) {
      state.s = s;
      render();
    }
  }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "inventory";
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
    $("extCount").textContent = String(m.extensionCount);
    $("diffCount").textContent = String(m.totalDiffs);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");

    put($("sideInfo"), el("div", { class: "pr-mini__in" },
      el("span", { class: "pl-muted pr-small", text: "Açıklama doğruluğu · Bilinmeyen etiket" }),
      el("b", { text: `%${m.accuracyPct} · %${m.unknownLabeledPct}` }),
      el("span", { class: "pl-muted pr-small", text: `${m.totalPermissions} izin · ${m.totalUnknown} bilinmeyen kapsam` })
    ));

    if (state.view === "inventory") renderInventory();
    if (state.view === "changes") renderChanges();
    if (state.view === "settings") renderSettings();
  }

  function renderInventory() {
    const s = state.s;
    const list = s.items;
    $("emptyPanel").hidden = list.length > 0;
    $("invSplit").hidden = list.length === 0;
    if (!list.length) return;

    $("invListInfo").textContent = `${list.length} eklenti · ${s.metrics.totalPermissions} izin kartı`;
    put($("extList"), ...list.map((x) => {
      const sel = x.id === s.active;
      const li = el("li", { class: "pr-item" + (sel ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": sel ? "true" : "false" },
        el("span", { class: "pr-ititle", text: `${x.name} (v${x.version})` }),
        el("div", { class: "pr-imeta" },
          badge(`${x.cards.length} izin`),
          x.unknownCount ? badge(`${x.unknownCount} bilinmeyen kapsam`, "warning") : badge("Tüm kapsamlar biliniyor", "success"),
          x.history && x.history.length ? badge(`${x.history.length} sürüm farkı`, "accent") : null
        )
      );
      li.addEventListener("click", guard(async () => apply(await D.inventory.open(x.id))));
      return li;
    }));

    const cur = list.find((x) => x.id === s.active) || list[0];
    if (!cur) return;

    const manageBtn = el("button", { type: "button", class: "pl-btn pl-btn--secondary pl-btn--sm", id: "chromeManageBtn" }, "Chrome yönetim ekranı (" + cur.chromeManageUrl + ")");
    manageBtn.addEventListener("click", guard(async () => {
      const r = await D.inventory.openChromeManage(cur.id);
      apply(r.state);
      toast(`Adresi panoya kopyalandı: ${r.url} — Chrome adres çubuğuna yapıştırarak yönetin.`);
    }));

    const aiBtn = el("button", { type: "button", class: "pl-btn pl-btn--primary pl-btn--sm", id: "aiExplainBtn" }, "MyMind ile izinleri açıkla");
    aiBtn.addEventListener("click", guard(async () => {
      const targetId = cur.id;
      busy("MyMind izinleri açıklıyor…");
      const r = await D.ai.explain(targetId);
      busy(null);
      if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
      apply(r.state);
      toast("MyMind izin açıklaması hazır" + (r.droppedClaims ? ` (${r.droppedClaims} zararlı yazılım iddiası filtrelendi)` : "") + ".");
    }));

    const cardsGrid = el("div", { class: "pr-permgrid", id: "permCardsGrid" }, ...cur.cards.map((c) =>
      el("div", { class: "pr-permcard" + (!c.known ? " is-unknown" : "") + (c.level === "kritik" ? " is-kritik" : ""), "data-perm": c.raw },
        el("div", { class: "pr-bar" },
          el("b", { text: c.raw }),
          !c.known ? badge("Bilinmeyen kapsam", "warning") : badge(LEVEL_LABEL[c.level] || c.level, LEVEL_TONE[c.level]),
          badge(c.kind === "host" ? "Site erişimi" : c.kind === "optional" ? "İsteğe bağlı" : "İzin")
        ),
        el("span", { class: "pr-ititle", text: c.title }),
        el("p", { class: "pr-small", text: c.meaning })
      )
    ));

    put($("extDetail"),
      el("div", { class: "pr-bar" },
        badge(`MV${cur.manifestVersion}`),
        badge(`Sürüm ${cur.version}`, "accent"),
        cur.unknownCount ? badge(`${cur.unknownCount} bilinmeyen kapsam açık etiketlendi`, "warning") : badge("Bilinmeyen kapsam yok", "success"),
        el("span", { class: "pr-grow" }),
        manageBtn,
        aiBtn
      ),
      el("h2", { class: "pl-h3 pr-h", text: cur.name }),
      el("p", { class: "pl-muted pr-small", text: cur.disclaimer }),
      cur.history && cur.history.length ? el("div", { class: "pr-block" },
        el("b", { text: "Son sürüm izin değişimi: " + cur.history[cur.history.length - 1].summary }),
        el("span", { class: "pr-small", text: "Yeni eklenen izinler: " + cur.history[cur.history.length - 1].added.map((a) => a.raw).join(", ") })
      ) : null,
      cur.aiExplanation ? el("div", { class: "pr-block pr-block--ai", id: "aiBox" },
        el("div", { class: "pr-bar" },
          badge("MyMind izin açıklaması", "pro"),
          badge("Zararlı yazılım tespiti iddiası taşımaz", "accent"),
          cur.aiExplanation.droppedMalwareClaims ? badge(`${cur.aiExplanation.droppedMalwareClaims} zararlı yazılım iddiası çıkarıldı`, "warning") : null
        ),
        el("b", { text: cur.aiExplanation.summary }),
        el("ul", { class: "pr-ul" }, ...cur.aiExplanation.bullets.map((b) => el("li", { text: b })))
      ) : null,
      cardsGrid
    );
  }

  function renderChanges() {
    const s = state.s;
    const diffs = [];
    for (const x of s.items) {
      for (const h of x.history || []) {
        diffs.push({ extName: x.name, extId: x.id, ...h });
      }
    }
    if (!diffs.length) {
      put($("diffTimeline"), el("p", { class: "pl-muted pr-small", text: "Henüz sürüm değişim kaydı yok." }));
      return;
    }
    put($("diffTimeline"), ...diffs.map((d) =>
      el("div", { class: "pr-block" },
        el("div", { class: "pr-bar" },
          el("b", { text: d.extName }),
          badge(`v${d.fromVersion} → v${d.toVersion}`, "accent"),
          badge(`+${d.added.length} eklendi`, d.added.length ? "warning" : "success"),
          badge(`-${d.removed.length} kaldırıldı`)
        ),
        el("p", { class: "pr-small", text: d.summary }),
        d.added.length ? el("ul", { class: "pr-ul" }, ...d.added.map((a) => el("li", { text: `+ Eklendi: ${a.raw} — ${a.title}` }))) : null,
        d.removed.length ? el("ul", { class: "pr-ul" }, ...d.removed.map((r) => el("li", { text: `- Kaldırıldı: ${r.raw} — ${r.title}` }))) : null
      )
    ));
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label) => el("div", {}, el("b", { text: v }), el("span", { text: label }));
    put($("metrics"),
      card(`%${m.accuracyPct}`, "test eklentilerinde izin açıklaması doğruluğu (hedef %100)"),
      card(`%${m.unknownLabeledPct}`, "bilinmeyen kapsamın açık etiketlenmesi (hedef %100)"),
      card(String(m.extensionCount), "incelenen eklenti"),
      card(String(m.totalPermissions), "okunabilir izin kartı"),
      card(String(m.totalUnknown), "açık etiketlenen bilinmeyen kapsam"),
      card(String(m.totalDiffs), "kaydedilen sürüm değişim geçmişi"),
      card(String(m.chromeOpened), "Chrome yönetim ekranı yönlendirmesi"),
      card(String(m.aiRuns), "MyMind izin açıklaması")
    );

    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault
      ? "Eklenti izin envanteri, sürüm geçmişi ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır."
      : "Bu sistemde işletim sistemi kasası yok: envanter düz JSON olarak saklanır.";
  }

  function openInspect() {
    $("inspectId").value = "ext-odak-okuyucu";
    $("inspectJson").value = JSON.stringify({
      manifest_version: 3,
      name: "Odak Makale Okuyucu",
      version: "2.1.0",
      permissions: ["activeTab", "storage", "contextMenus", "clipboardRead", "unlistedExperimentalScope"],
      host_permissions: ["https://*.ornek-blog.org/*"],
    }, null, 2);
    $("inspectDialog").showModal();
  }

  $("openInspectModal").addEventListener("click", openInspect);
  $("emptyInspectBtn").addEventListener("click", openInspect);
  $("inspectCancel").addEventListener("click", () => $("inspectDialog").close());
  $("inspectRunBtn").addEventListener("click", guard(async () => {
    const r = await D.inventory.inspectJson($("inspectJson").value, $("inspectId").value.trim());
    $("inspectDialog").close();
    apply(r.state);
    go("inventory");
    toast(r.isUpdate ? `Eklenti sürümü güncellendi (${r.diff.summary})` : `Eklenti izin kartlarına dönüştürüldü (${r.unknownCount} bilinmeyen kapsam).`);
  }));

  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.inventory.loadSample();
    apply(r.state);
    go("inventory");
    toast(`${r.count} test eklentisi ve sürüm değişim geçmişi yüklendi.`);
  })));

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
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
    go("inventory");
    document.documentElement.dataset.ready = "1";
  });
})();
