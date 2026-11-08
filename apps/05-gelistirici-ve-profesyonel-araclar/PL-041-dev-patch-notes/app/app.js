/* Dev Patch Notes — arayüz mantığı (yalnız textContent / güvenli DOM oluşturma). */
(function () {
  const D = window.dpnDesktop;
  const C = window.DPNCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["editor", "audit", "settings"];
  const state = { s: null, view: "editor" };

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
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function toast(message, isError) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, el("div", { class: "pl-toast__body", text: message }));
    if (isError) t.style.setProperty("--pl-c", "var(--pl-danger)");
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), 6000);
  }
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };

  function activeRelease() {
    const s = state.s;
    if (!s || !s.releases.length) return null;
    return s.releases.find((r) => r.id === s.active) || s.releases[0];
  }
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "editor";
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
    const cur = activeRelease();
    $("relCount").textContent = String(s.releases.length);
    $("auditCount").textContent = String(cur ? (cur.stats.secretCount + cur.stats.unverifiedBlocked) : 0);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "dpn-mini__in" },
      el("span", { class: "pl-muted dpn-small", text: "Uydurma teslim iddiası" }),
      el("b", { text: "0 (Sıfır)" }),
      el("span", { class: "pl-muted dpn-small", text: m.sourcedCommits + "/" + m.totalCommits + " kaynak commit bağlantılı" }),
      el("span", { class: "pl-muted dpn-small", text: m.secrets + " sır maskelendi · " + m.blockedClaims + " kanıtsız iddia engellendi" })));
    const any = s.releases.length > 0;
    $("emptyPanel").hidden = any;
    $("editorSplit").hidden = !any;
    if (state.view === "editor") renderEditor();
    if (state.view === "audit") renderAudit();
    if (state.view === "settings") renderSettings();
  }

  function renderEditor() {
    const s = state.s;
    const cur = activeRelease();
    $("relSummary").textContent = s.releases.length + " sürüm";
    put($("releaseList"), ...s.releases.map((r) => {
      const li = el("li", { class: "dpn-item" + (cur && cur.id === r.id ? " is-sel" : ""), "data-id": r.id },
        el("b", { class: "dpn-small", text: r.version + " · " + r.title }),
        el("div", { class: "dpn-row" },
          badge(r.stats.includedItems + " madde", "info"),
          r.stats.secretCount ? badge(r.stats.secretCount + " sır maskelendi", "danger") : null,
          r.stats.unverifiedBlocked ? badge(r.stats.unverifiedBlocked + " kanıtsız iddia temizlendi", "warning") : badge("doğrulandı", "success")));
      li.addEventListener("click", guard(async () => apply(await D.release.open(r.id))));
      return li;
    }));
    const detail = $("releaseDetail");
    if (!cur) { put(detail, el("p", { class: "pl-muted dpn-small", text: "Sürüm seçin." })); return; }

    const headRow = el("div", { class: "dpn-bar" },
      el("h2", { class: "pl-h3 dpn-h", text: cur.version + " — " + cur.title }),
      badge(cur.stats.sourcedItems + " kaynak commit", "info"),
      cur.stats.secretCount ? badge(cur.stats.secretCount + " sızmış anahtar maskelendi", "danger") : null,
      cur.stats.unverifiedBlocked ? badge(cur.stats.unverifiedBlocked + " kanıtsız test/performans iddiası ayıklandı", "warning") : null,
      el("span", { class: "dpn-grow" }),
      btn("MyMind ile kullanıcı diline çevir", "pl-btn--secondary", async () => {
        busy("MyMind sürüm notunu hazırlıyor…");
        const r = await D.ai.draft(cur.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind sürüm notu taslağı hazır" + (r.dropped ? " · " + r.dropped + " uydurma/kanıtsız öğe reddedildi" : "") + ".");
      }, { id: "aiBtn" }));

    let aiBox = null;
    if (cur.ai) {
      aiBox = el("div", { class: "pl-callout pl-callout--info", id: "aiBox" },
        el("div", { class: "dpn-row" },
          el("b", { text: "MyMind davranış değişikliği taslağı" }),
          cur.ai.dropped ? badge(cur.ai.dropped + " uydurma commit/kanıtsız iddia reddedildi", "warning") : badge("Doğrulandı", "success"),
          el("span", { class: "dpn-grow" }),
          btn("Taslağı maddelere uygula", "pl-btn--primary", async () => { apply(await D.ai.apply(cur.id)); toast("MyMind sürüm notu taslağı uygulandı."); }, { id: "aiApplyBtn" })),
        cur.ai.overview ? el("div", { class: "dpn-small", text: "Özet: " + cur.ai.overview }) : null,
        ...cur.ai.items.map((it) => el("div", { class: "pl-muted dpn-small", text: "[" + it.sha + "] (" + C.CATEGORY_NAMES[it.category] + ") " + it.summary })));
    }

    const commitList = el("div", { class: "dpn-stack", id: "commitList" }, ...cur.items.map((it) => {
      const catSel = el("select", { class: "pl-input item-cat-select", "data-id": it.id, "aria-label": "Kategori " + it.shortSha },
        ...C.CATEGORIES.map((c) => el("option", { value: c, text: C.CATEGORY_NAMES[c] })));
      catSel.value = it.category;
      catSel.addEventListener("change", guard(async () => { apply(await D.release.updateItem(cur.id, it.id, { category: catSel.value })); toast("Kategori güncellendi."); }));

      const sumInp = el("input", { class: "pl-input item-sum-input", "data-id": it.id, value: it.summary, maxlength: "300", "aria-label": "Madde metni " + it.shortSha });
      const saveBtn = btn("Kaydet", "pl-btn--ghost", async () => {
        apply(await D.release.updateItem(cur.id, it.id, { summary: sumInp.value }));
        toast("Madde güncellendi.");
      }, { "data-save": it.id });

      const metaRow = el("div", { class: "dpn-row" },
        badge("commit " + it.shortSha, "info"),
        it.commitUrl ? btn("Commit'i aç", "pl-btn--ghost", async () => { const r = await D.openCommit(cur.id, it.id); toast("Tarayıcıda açıldı: " + r.opened); }, { "data-commit": it.shortSha }) : null,
        it.secrets.length ? badge("Sır maskelendi: " + it.secrets.map((s) => s.label).join(", "), "danger") : null,
        it.strippedClaims && it.strippedClaims.length ? badge(it.strippedClaims.join(" · "), "warning") : null);

      return el("div", { class: "dpn-commitrow", "data-sha": it.shortSha },
        metaRow,
        el("div", { class: "dpn-commitrow__line" }, catSel, sumInp, saveBtn));
    }));

    const mdPreview = C.exportMarkdown(cur, { style: state.s.settings.exportStyle }).markdown;
    const previewBlock = el("div", { class: "dpn-stack" },
      el("b", { class: "dpn-lbl", text: "Canlı Markdown Önizlemesi (Kaynak Commit Bağlantılı)" }),
      el("pre", { class: "dpn-mdpreview", id: "mdPreview", text: mdPreview }));

    put(detail, headRow, aiBox, commitList, previewBlock);
  }

  function renderAudit() {
    const cur = activeRelease();
    const wrap = $("auditWrap");
    if (!cur) { put(wrap, el("p", { class: "pl-muted dpn-small", text: "Sürüm seçin." })); return; }
    const cards = [];
    for (const it of cur.items) {
      for (const sec of it.secrets) {
        cards.push(el("div", { class: "dpn-auditcard" },
          el("div", { class: "dpn-row" }, badge("Sızmış Sır / API Anahtarı Maskelendi", "danger"), badge("commit " + it.shortSha, "info")),
          el("div", { text: sec.label + " (" + sec.preview + ") sürüm notundan ve dışa aktarmadan otomatik temizlendi." })));
      }
      for (const st of it.strippedClaims || []) {
        cards.push(el("div", { class: "dpn-auditcard" },
          el("div", { class: "dpn-row" }, badge("Kanıtsız Teslim İddiası Engellendi", "warning"), badge("commit " + it.shortSha, "info")),
          el("div", { text: st + " — kaynak commit/diff içinde test veya benchmark kanıtı bulunamadı." }),
          el("div", { class: "pl-muted", text: "Özgün mesaj: “" + C.redactSecrets(it.originalSubject) + "”" })));
      }
    }
    $("auditSummary").textContent = cards.length + " güvenlik ve doğruluk bulgusu denetlendi · Uydurma teslim iddiası: 0";
    if (!cards.length) cards.push(el("div", { class: "dpn-auditcard", text: "Bu sürümde sızmış anahtar ya da kanıtsız teslim iddiası bulunmadı." }));
    put(wrap, ...cards);
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(String(m.fabricatedClaims), "uydurma teslim iddiası (hedef 0)", "is-ok"),
      card("%" + m.editorTimeReductionEstimate, "editör düzeltme süresi kazanımı (hedef ≥%50)", "is-ok"),
      card(String(m.secrets), "yakalanıp maskelenen API anahtarı/sır", "is-ok"),
      card(String(m.blockedClaims), "engellenen kanıtsız test/performans iddiası", "is-ok"));
    $("exportStyle").value = s.settings.exportStyle;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Sürüm notları ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "İşletim sistemi kasası yok: veriler yerel JSON olarak saklanır.";
  }

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll('[data-act="capture"]').forEach((b) => b.addEventListener("click", () => {
    $("capText").value = ""; $("capVer").value = "v0.1.0"; $("capTitle").value = ""; $("capRepo").value = "";
    $("capDialog").showModal();
  }));
  $("capCancel").addEventListener("click", () => $("capDialog").close());
  $("capRun").addEventListener("click", guard(async () => {
    const r = await D.capture.text($("capText").value, { version: $("capVer").value, title: $("capTitle").value, repoUrl: $("capRepo").value.trim() });
    $("capDialog").close();
    apply(r.state); go("editor");
    toast("Sürüm notu oluşturuldu (" + r.itemCount + " commit" + (r.secrets ? " · " + r.secrets + " sır maskelendi" : "") + (r.blocked ? " · " + r.blocked + " kanıtsız iddia temizlendi" : "") + ").");
  }));
  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.clipboard();
    apply(r.state); go("editor");
    toast("Panodan " + r.itemCount + " commit içe alındı.");
  })));
  document.querySelectorAll('[data-act="files"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.files();
    if (r.cancelled) return;
    apply(r.state); go("editor");
    toast(r.added + " sürüm dosyadan eklendi.");
  })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => {
    const r = await D.capture.sample();
    apply(r.state); go("editor");
    toast(r.added + " örnek sürüm yüklendi.");
  })));
  $("exportMdBtn").addEventListener("click", guard(async () => {
    const cur = activeRelease();
    if (!cur) return toast("Önce bir sürüm seçin.", true);
    const r = await D.exportMd(cur.id);
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi (" + r.itemCount + " madde).");
  }));
  $("exportJsonBtn").addEventListener("click", guard(async () => {
    const cur = activeRelease();
    if (!cur) return toast("Önce bir sürüm seçin.", true);
    const r = await D.exportJson(cur.id);
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi (" + r.itemCount + " madde).");
  }));
  $("backupBtn").addEventListener("click", guard(async () => {
    const r = await D.backup();
    if (!r.cancelled) toast("“" + r.file + "” kaydedildi.");
  }));
  $("exportStyle").addEventListener("change", guard(async () => apply(await D.setSettings({ exportStyle: $("exportStyle").value }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => {
    apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() }));
    toast("Yerel model ayarı kaydedildi.");
  }));
  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok.";
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
  D.state().then((s) => { apply(s); go("editor"); document.documentElement.dataset.ready = "1"; });
})();
