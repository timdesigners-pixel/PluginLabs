/* Access Lens (PL-043) — ana pencere. Her metin yalnız textContent / value ile yazılır. */
(function () {
  const D = window.alDesktop;
  const C = window.ALCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["audit", "manual", "settings"];
  const state = { s: null, view: "audit", cat: "tumu" };
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

  function activeAudit() {
    const s = state.s;
    if (!s || !s.audits.length) return null;
    return s.audits.find((a) => a.id === s.activeId) || s.audits[0];
  }
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "audit";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    const a = activeAudit();
    $("openCount").textContent = String(m.openIssues);
    const doneMan = a ? (a.manualChecks || []).filter((x) => x.done).length : 0;
    const totMan = a ? (a.manualChecks || []).length : 4;
    $("manualCount").textContent = `${doneMan}/${totMan}`;
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    $("engineBadge").textContent = `${s.standardVersion} · ${s.engineVersion}`;

    put($("sideInfo"), el("div", { class: "ax-mini__in" },
      el("span", { class: "pl-muted ax-small", text: "Kural motoru" }),
      el("b", { text: s.engineVersion }),
      el("span", { class: "pl-muted ax-small", text: `${m.openIssues} açık · ${m.resolvedIssues} çözüldü` }),
      el("span", { class: "pl-muted ax-small", text: "Otomatik puan sertifika değildir" })));

    const sel = $("auditSelect");
    put(sel, ...s.audits.map((x) => el("option", { value: x.id, text: `${x.title} (${x.issues.length} bulgu)` })));
    if (a) sel.value = a.id;
    sel.hidden = !s.audits.length;

    const any = s.audits.length > 0;
    $("emptyPanel").hidden = any;
    $("auditSplit").hidden = !any;
    if (state.view === "audit" && any) renderAudit(a);
    if (state.view === "manual") renderManual(a);
    if (state.view === "settings") renderSettings();
  }

  function renderAudit(a) {
    document.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-checked", b.dataset.cat === state.cat ? "true" : "false"));
    const list = (a.issues || []).filter((i) => state.cat === "tumu" || i.category === state.cat);
    const cur = list.find((i) => i.id === state.s.activeIssueId) || list[0] || null;
    const ul = $("issueList");
    if (!list.length) {
      put(ul, el("li", { class: "ax-empty", text: a.issues.length ? "Bu kategoride bulgu yok." : "Kural motoru bu kesitte otomatik uyarı bulmadı (manuel kontrolleri yine de uygulayın)." }));
    } else {
      put(ul, ...list.map((it) => {
        const isSel = cur && cur.id === it.id;
        const li = el("li", { class: "ax-item" + (isSel ? " is-sel" : "") + (it.status === "cozuldu" ? " is-done" : ""), "data-id": it.id, "data-rule": it.ruleId, tabindex: "0", role: "option", "aria-selected": isSel ? "true" : "false" },
          el("span", { class: "ax-ititle", text: it.title }),
          el("div", { class: "ax-imeta" },
            badge(it.ruleId, it.severity === "kritik" ? "danger" : "warning"),
            badge(C.CATEGORY_NAMES[it.category] || it.category, "info"),
            badge("Satır " + it.line, ""),
            it.status !== "acik" ? badge(C.ISSUE_STATUS_NAMES[it.status], it.status === "cozuldu" ? "success" : "") : null
          ),
          el("span", { class: "ax-src", text: `${it.selector} — ${it.snippet}` })
        );
        li.addEventListener("click", guard(async () => apply(await D.audit.select(a.id, it.id))));
        return li;
      }));
    }
    renderIssueDetail(a, cur);
  }

  function renderIssueDetail(a, it) {
    const node = $("issueDetail");
    const disclaimerBanner = el("div", { class: "pl-callout pl-callout--warning", id: "disclaimerBanner" },
      el("div", { class: "ax-small", text: `${C.STANDARD_VERSION} · ${C.ENGINE_VERSION} — ${C.CERTIFICATE_DISCLAIMER}` }));

    if (!it) {
      put(node, disclaimerBanner, el("p", { class: "ax-empty", text: "Ayrıntısını ve ilgili öğeyi görmek için listeden bir bulgu seçin." }));
      return;
    }

    const head = el("div", { class: "ax-block" },
      el("div", { class: "ax-row" },
        badge(it.ruleId, it.severity === "kritik" ? "danger" : "warning"),
        badge(it.wcag, "info"),
        badge("Satır " + it.line, "accent"),
        badge(C.ISSUE_STATUS_NAMES[it.status], it.status === "cozuldu" ? "success" : "")
      ),
      el("h3", { class: "pl-h3 ax-h", text: it.title }),
      el("p", { class: "ax-small", text: it.detail })
    );

    if (it.meta && it.meta.fg && it.meta.bg) {
      const swFg = el("span", { class: "ax-swatch" }); swFg.style.backgroundColor = it.meta.fg;
      const swBg = el("span", { class: "ax-swatch" }); swBg.style.backgroundColor = it.meta.bg;
      head.appendChild(el("div", { class: "ax-swatch-row" },
        swFg, el("span", { text: `Ön plan: ${it.meta.fg}` }),
        swBg, el("span", { text: `Arka plan: ${it.meta.bg}` }),
        badge(`Oran ${it.meta.ratio}:1 (Eşik ${it.meta.required}:1)`, "danger"),
        it.meta.suggestedFg ? badge(`Öneri: ${it.meta.suggestedFg}`, "success") : null
      ));
    }

    // İlgili öğe ve kaynak vurgusu
    const lines = (a.source || "").split(/\r?\n/);
    const codeBox = el("pre", { class: "ax-code", id: "highlightedSource" });
    lines.forEach((ln, idx) => {
      const lineNo = idx + 1;
      const span = el("span", { class: "ax-code-line" + (lineNo === it.line ? " is-hit" : ""), text: `${String(lineNo).padStart(2, " ")} | ${ln}` });
      codeBox.appendChild(span);
    });
    const elemBlock = el("div", { class: "ax-block" },
      el("span", { class: "ax-lbl", text: `İlgili Öğe — Seçici: ${it.selector} (Satır ${it.line})` }),
      codeBox
    );

    const fixInput = el("textarea", { class: "pl-input ax-area", id: "fixDraftInput", rows: "3", value: it.fixDraft, "aria-label": "Düzeltme taslağı" });
    const fixBlock = el("div", { class: "ax-block" },
      el("span", { class: "ax-lbl", text: "Düzeltme taslağı" }),
      fixInput,
      el("div", { class: "ax-row" },
        btn("Düzeltmeyi uygula ve çözüldü işaretle", "pl-btn--primary", async () => {
          apply(await D.audit.applyFix(a.id, it.id, fixInput.value));
          toast("Düzeltme taslağı kaynağa uygulandı ve bulgu çözüldü olarak işaretlendi.");
        }, { id: "applyFixBtn" }),
        btn("Yanlış olumlu işaretle", "pl-btn--ghost", async () => {
          apply(await D.audit.setIssueStatus(a.id, it.id, "yanlis_olumlu"));
          toast("Bulgu yanlış olumlu olarak işaretlendi.");
        }, { id: "markFpBtn" }),
        it.status !== "acik" ? btn("Yeniden aç", "pl-btn--ghost", async () => {
          apply(await D.audit.setIssueStatus(a.id, it.id, "acik"));
          toast("Bulgu yeniden açıldı.");
        }, { id: "reopenIssueBtn" }) : null,
        el("span", { class: "ax-grow" }),
        btn("MyMind ile sade açıkla", "pl-btn--secondary", async () => {
          busy("MyMind açıklıyor…");
          const r = await D.ai.explain(a.id, it.id);
          busy(null);
          if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
          apply(r.state);
          toast("MyMind sade açıklaması ve düzeltme taslağı hazır.");
        }, { id: "aiBtn" })
      )
    );

    let aiBox = null;
    if (it.ai) {
      aiBox = el("div", { class: "ax-block ax-block--ai", id: "aiBox" },
        el("div", { class: "ax-row" }, icon("spark"), el("b", { text: "MyMind sade açıklama ve düzeltme önerisi" }), badge("Sertifika değildir", "warning")),
        el("p", { class: "ax-small", text: it.ai.aciklama }),
        el("pre", { class: "ax-code", text: it.ai.duzeltme }),
        el("p", { class: "pl-muted ax-small", text: "Manuel kontrol hatırlatması: " + it.ai.manuelKontrol }),
        el("div", { class: "ax-row" },
          btn("MyMind düzeltmesini uygula", "pl-btn--secondary", async () => {
            apply(await D.ai.apply(a.id, it.id));
            toast("MyMind düzeltme taslağı uygulandı.");
          }, { id: "aiApplyBtn" })
        )
      );
    }

    put(node, disclaimerBanner, head, elemBlock, fixBlock, aiBox);
  }

  function renderManual(a) {
    const s = state.s;
    $("engineInline").textContent = s.engineVersion;
    $("standardInline").textContent = s.standardVersion;
    const box = $("manualList");
    if (!a) {
      put(box, el("p", { class: "ax-empty", text: "Manuel kontrol listesini işaretlemek için önce bir kesit denetleyin." }));
      return;
    }
    put(box, ...C.MANUAL_CHECKS.map((mc) => {
      const st = (a.manualChecks || []).find((x) => x.id === mc.id);
      const chk = el("input", { type: "checkbox", "data-manual": mc.id });
      chk.checked = !!(st && st.done);
      chk.addEventListener("change", guard(async () => {
        apply(await D.audit.toggleManual(a.id, mc.id, chk.checked));
        toast(chk.checked ? "Manuel kontrol tamamlandı olarak işaretlendi." : "Manuel kontrol işareti kaldırıldı.");
      }));
      return el("label", { class: "ax-check ax-block" }, chk,
        el("div", {}, el("b", { text: `${mc.title} · ${mc.wcag}` }), el("p", { class: "pl-muted ax-small", text: mc.desc })));
    }));
  }

  function renderSettings() {
    const s = state.s, m = s.metrics, g = s.gold;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(g ? pctText(g.recall) : "—", "fixture bulgu duyarlılığı (hedef %100)", g && g.recall === 100 ? "is-ok" : ""),
      card(pctText(g ? g.criticalFpRate : m.criticalFpRate), "kritik yanlış olumlu (hedef < %5)", (g ? g.criticalFpRate : m.criticalFpRate) < 5 ? "is-ok" : "is-bad"),
      card(String(m.totalIssues), `toplam bulgu (${m.openIssues} açık · ${m.resolvedIssues} çözüldü)`),
      card(`${m.manualDone}/${m.manualTotal}`, "tamamlanan manuel klavye/ekran okuyucu kontrolü", m.manualDone ? "is-ok" : "")
    );
    $("goldInfo").textContent = g ? `Bilinen ${g.fixtures} fixture üzerinde kural motoru (${s.engineVersion}): beklenen ${g.expectedTotal} bulgunun ${g.matched} tanesi yakalandı (%${g.recall}); kritik yanlış olumlu sayısı ${g.criticalFalsePositives} (%${g.criticalFpRate}).` : "Örnek fixture’ları yükleyerek kural motoru doğrulama ölçütünü görebilirsiniz.";
    $("levelSelect").value = s.settings.level;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Denetim kayıtları ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: kayıtlar yerel JSON olarak saklanır, MyMind anahtarı yalnız bellekte tutulur.";
  }

  document.querySelectorAll('[data-act="snippet"]').forEach((b) => b.addEventListener("click", () => {
    $("snipSource").value = ""; $("snipTitle").value = ""; $("snipUrl").value = "";
    $("snipDialog").showModal(); $("snipSource").focus();
  }));
  $("snipCancel").addEventListener("click", () => $("snipDialog").close());
  $("snipRun").addEventListener("click", guard(async () => {
    const source = $("snipSource").value;
    if (!source.trim()) return toast("Denetlenecek HTML/CSS kodunu yapıştırın.", true);
    const r = await D.audit.snippet({ source, title: $("snipTitle").value.trim(), url: $("snipUrl").value.trim() });
    $("snipDialog").close();
    apply(r.state); go("audit");
    toast(`Denetim tamamlandı: ${r.addedIssues} bulgu raporlandı.`);
  }));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.audit.clipboard();
    apply(r.state); go("audit");
    toast(`Panodan denetim tamamlandı: ${r.addedIssues} bulgu raporlandı.`);
  })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.audit.files();
    if (r.cancelled) return;
    apply(r.state); go("audit");
    toast(`${r.loaded} dosya denetlendi (${r.issuesCount} bulgu)` + (r.skipped ? ` · ${r.skipped} dosya atlandı` : "") + ".");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.audit.sample();
    apply(r.state); go("audit");
    toast(`${r.count} örnek fixture denetlendi · ${r.totalIssues} bulgu bulundu.`);
  })));
  $("auditSelect").addEventListener("change", guard(async () => apply(await D.audit.select($("auditSelect").value, null))));
  document.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { state.cat = b.dataset.cat; render(); }));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  $("levelSelect").addEventListener("change", guard(async () => {
    apply(await D.setSettings({ level: $("levelSelect").value }));
    toast("WCAG hedef düzeyi güncellendi.");
  }));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));
  const exp = (fn) => guard(async () => { const r = await fn(); if (!r.cancelled) toast(`“${r.file}” kaydedildi.`); });
  $("mdBtn").addEventListener("click", exp(D.exportMd));
  $("csvBtn").addEventListener("click", exp(D.exportCsv));
  $("backupBtn").addEventListener("click", exp(D.backup));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("audit"); document.documentElement.dataset.ready = "1"; });
})();
