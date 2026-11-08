/* API Pocket — arayüz mantığı (yalnız textContent / güvenli DOM oluşturma). */
(function () {
  const D = window.apDesktop;
  const C = window.APCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["requests", "env", "settings"];
  const state = { s: null, view: "requests" };

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

  function activeTemplate() {
    const s = state.s;
    if (!s || !s.templates.length) return null;
    return s.templates.find((t) => t.id === s.active) || s.templates[0];
  }
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }
  function go(view) {
    state.view = VIEWS.includes(view) ? view : "requests";
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
    $("tplCount").textContent = String(s.templates.length);
    $("envCount").textContent = String(m.envCount);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "ap-mini__in" },
      el("span", { class: "pl-muted ap-small", text: "Günlükte sır sızıntısı" }),
      el("b", { text: "0 (Sıfır)" }),
      el("span", { class: "pl-muted ap-small", text: m.secretCount + " kasa sırrı · " + m.requestsSent + " istek gönderildi" }),
      el("span", { class: "pl-muted ap-small", text: "İlk doğru istek: ~" + m.firstRequestSeconds + " sn (≤2 dk)" })));
    if (state.view === "requests") renderRequests();
    if (state.view === "env") renderEnv();
    if (state.view === "settings") renderSettings();
  }

  function renderRequests() {
    const s = state.s;
    const cur = activeTemplate();
    $("reqSummary").textContent = s.templates.length + " şablon";
    put($("reqList"), ...s.templates.map((t) => {
      const tone = t.method === "GET" ? "success" : "warning";
      const li = el("li", { class: "ap-item" + (cur && cur.id === t.id ? " is-sel" : ""), "data-id": t.id },
        el("b", { class: "ap-small", text: t.name }),
        el("div", { class: "ap-row" },
          badge(t.method, tone),
          t.lastResponse ? badge("HTTP " + t.lastResponse.status, t.lastResponse.ok ? "info" : "danger") : null));
      li.addEventListener("click", guard(async () => apply(await D.request.open(t.id))));
      return li;
    }));
    const detail = $("reqDetail");
    if (!cur) { put(detail, el("p", { class: "pl-muted ap-small", text: "Şablon seçin." })); return; }

    const prev = s.preview;
    const methodSel = el("select", { class: "pl-input", id: "reqMethod", "aria-label": "HTTP Yöntemi" },
      ...C.METHODS.map((m) => el("option", { value: m, text: m })));
    methodSel.value = cur.method;
    methodSel.addEventListener("change", guard(async () => apply(await D.request.update(cur.id, { method: methodSel.value }))));

    const urlInp = el("input", { class: "pl-input", id: "reqUrl", value: cur.url, "aria-label": "İstek URL şablonu" });
    const saveBtn = btn("Kaydet", "pl-btn--ghost", async () => {
      apply(await D.request.update(cur.id, { url: urlInp.value }));
      toast("İstek şablonu kaydedildi.");
    }, { id: "saveReqBtn" });

    const sendBtn = btn(prev && prev.requiresWriteConfirm ? "Önizle ve Gönder (" + cur.method + ")" : "Gönder (GET)", "pl-btn--primary", async () => {
      busy("İstek gönderiliyor…");
      const r = await D.request.send(cur.id);
      busy(null);
      if (r.cancelled) return toast("Yazma isteği iptal edildi.");
      apply(r.state);
      toast("Yanıt alındı: HTTP " + r.status + " (" + r.durationMs + " ms).");
    }, { id: "sendReqBtn" });

    const headBar = el("div", { class: "ap-bar" },
      el("h2", { class: "pl-h3 ap-h", text: cur.name }),
      prev && prev.requiresWriteConfirm ? badge("Yazma yöntemi — ek önizleme zorunlu", "warning") : badge("Salt okunur GET", "success"),
      prev && prev.usedSecrets.length ? badge("Kasa sırrı: " + prev.usedSecrets.join(", ") + " (maskeli)", "accent") : null,
      el("span", { class: "ap-grow" }),
      cur.docUrl ? btn("API Belgesini Aç", "pl-btn--ghost", async () => { const r = await D.openDoc(cur.id); toast("Belge açıldı: " + r.opened); }, { id: "openDocBtn" }) : null,
      btn("MyMind ile alanları açıkla", "pl-btn--secondary", async () => {
        busy("MyMind yanıt alanlarını açıklıyor…");
        const r = await D.ai.explain(cur.id);
        busy(null);
        if (!r.approved) return toast("Gönderilmedi (onay verilmedi).");
        apply(r.state);
        toast("MyMind alan açıklamaları hazır" + (r.dropped ? " · " + r.dropped + " uydurma alan reddedildi" : "") + ".");
      }, { id: "aiBtn" }));

    const urlBar = el("div", { class: "ap-urlbar" }, methodSel, urlInp, saveBtn, sendBtn);

    const previewBox = prev ? el("div", { class: "ap-previewbox", id: "resolvedPreview" },
      el("div", { text: "Çözülmüş Önizleme (Sırlar Maskeli): " + prev.method + " " + prev.displayUrl }),
      el("div", { class: "pl-muted", text: "Başlıklar: " + Object.entries(prev.displayHeaders).map(([k, v]) => k + ": " + v).join(" | ") }),
      prev.missing.length ? el("div", { text: "Eksik değişkenler: " + prev.missing.join(", ") }) : null) : null;

    let aiBox = null;
    if (cur.ai) {
      aiBox = el("div", { class: "pl-callout pl-callout--info", id: "aiBox" },
        el("div", { class: "ap-row" },
          el("b", { text: "MyMind Yanıt Alanı Açıklamaları" }),
          cur.ai.dropped ? badge(cur.ai.dropped + " yanıtta olmayan alan reddedildi", "warning") : badge("Doğrulandı", "success"),
          cur.ai.docUrl ? badge("Belge bağlı: " + cur.ai.docUrl, "info") : null,
          el("span", { class: "ap-grow" }),
          btn("Açıklamaları uygula", "pl-btn--primary", async () => { apply(await D.ai.apply(cur.id)); toast("MyMind alan açıklamaları uygulandı."); }, { id: "aiApplyBtn" })),
        cur.ai.summary ? el("div", { class: "ap-small", text: cur.ai.summary }) : null,
        ...cur.ai.explanations.map((e) => el("div", { class: "pl-muted ap-small", text: "• " + e.path + ": " + e.explanation })));
    }

    let respSection = null;
    if (cur.lastResponse) {
      const r = cur.lastResponse;
      respSection = el("div", { class: "ap-resgrid", id: "respGrid" },
        el("div", { class: "ap-stack" },
          el("div", { class: "ap-row" },
            el("b", { class: "ap-lbl", text: "Biçimlendirilmiş Yanıt" }),
            badge("HTTP " + r.status, r.ok ? "success" : "danger"),
            badge(r.durationMs + " ms", "")),
          el("pre", { class: "ap-json", id: "respPretty", text: r.pretty })),
        el("div", { class: "ap-stack" },
          el("b", { class: "ap-lbl", text: "Yanıt Alanları (" + r.fields.length + ")" }),
          el("div", { class: "ap-fieldlist", id: "fieldList" },
            ...r.fields.map((f) => el("div", { class: "ap-fieldrow" },
              el("div", { class: "ap-row" }, el("b", { text: f.path }), badge(f.type, "info"), el("span", { class: "pl-muted", text: "Örnek: " + f.sample })),
              el("span", { text: f.explanation }))))));
    } else {
      respSection = el("p", { class: "pl-muted ap-small", text: "Henüz yanıt yok. İsteği göndermek için “Gönder” düğmesine basın." });
    }

    put(detail, headBar, urlBar, previewBox, aiBox, respSection);
  }

  function renderEnv() {
    const s = state.s;
    const wrap = $("envWrap");
    const rows = Object.values(s.env).map((v) => {
      const inp = el("input", {
        class: "pl-input env-val-input",
        "data-var": v.name,
        type: v.secret ? "password" : "text",
        value: v.secret ? "" : v.value,
        placeholder: v.secret ? (v.hasSecret ? "Kasada kayıtlı (⟦GİZLİ:" + v.name + "⟧) — değiştirmek için yeni değer yazın" : "Kasaya kaydetmek için sır girin") : "Değer",
      });
      const saveBtn = btn(v.secret ? "Kasaya Kaydet" : "Kaydet", "pl-btn--secondary", async () => {
        if (v.secret) {
          apply(await D.env.setSecret(v.name, inp.value));
          toast(v.name + " sırrı işletim sistemi kasasına kaydedildi.");
        } else {
          apply(await D.env.setVar(v.name, inp.value));
          toast(v.name + " ortam değişkeni güncellendi.");
        }
      }, { "data-save-env": v.name });
      return el("div", { class: "ap-envrow" },
        el("b", { class: "ap-small", text: "{{" + v.name + "}}" }),
        badge(v.secret ? (v.hasSecret ? "Kasa Sırrı (Aktif)" : "Kasa Sırrı (Boş)") : "Açık Değişken", v.secret ? "accent" : "info"),
        inp,
        saveBtn);
    });

    // Yeni değişken ekleme satırı
    const newName = el("input", { class: "pl-input", id: "newEnvName", placeholder: "YENİ_DEĞİŞKEN_ADI" });
    const newType = el("select", { class: "pl-input", id: "newEnvType" },
      el("option", { value: "var", text: "Açık Değişken" }),
      el("option", { value: "secret", text: "Kasa Sırrı (DPAPI)" }));
    const newVal = el("input", { class: "pl-input", id: "newEnvVal", placeholder: "Değer veya gizli anahtar" });
    const addBtn = btn("Değişken Ekle", "pl-btn--primary", async () => {
      const k = newName.value.trim();
      if (newType.value === "secret") apply(await D.env.setSecret(k, newVal.value));
      else apply(await D.env.setVar(k, newVal.value));
      toast(k + " eklendi.");
    }, { id: "addEnvBtn" });
    rows.push(el("div", { class: "ap-envrow" }, newName, newType, newVal, addBtn));
    put(wrap, ...rows);
  }

  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card(String(m.secretLeaksInLogs), "günlüklerde/dışa aktarmada sır sızıntısı (hedef 0)", "is-ok"),
      card("~" + m.firstRequestSeconds + " sn", "örnek API'de ilk doğru istek (hedef ≤2 dk)", "is-ok"),
      card(String(m.secretCount), "işletim sistemi kasasında korunan sır", "is-ok"),
      card(String(m.requestsSent) + " istek", m.writePreviewsConfirmed + " yazma önizlemesi onaylandı", "is-ok"));
    $("setConfirmWrite").checked = s.settings.confirmWriteMethods;
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "API anahtarları, kasa sırları ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "İşletim sistemi kasası yok: sırlar yalnız oturum belleğinde tutulur.";
  }

  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  $("newReqBtn").addEventListener("click", guard(async () => {
    apply(await D.request.create({ name: "Yeni API İsteği", method: "GET", url: "{{BASE_URL}}/v1/items" }));
    go("requests");
    toast("Yeni istek şablonu oluşturuldu.");
  }));
  $("sampleBtn").addEventListener("click", guard(async () => {
    apply(await D.request.loadSamples());
    go("requests");
    toast("Örnek koleksiyon yüklendi.");
  }));
  $("curlBtn").addEventListener("click", guard(async () => {
    const cur = activeTemplate();
    if (!cur) return;
    const r = await D.exportCurl(cur.id);
    apply(r.state);
    toast("Maskeli cURL komutu panoya kopyalandı (sırlar ⟦GİZLİ:...⟧ olarak korundu).");
  }));
  $("exportMdBtn").addEventListener("click", guard(async () => {
    const r = await D.exportMd();
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi.");
  }));
  $("exportColBtn").addEventListener("click", guard(async () => {
    const r = await D.exportCollection();
    if (r.cancelled) return;
    apply(r.state);
    toast("“" + r.file + "” kaydedildi.");
  }));
  $("setConfirmWrite").addEventListener("change", guard(async () => apply(await D.setSettings({ confirmWriteMethods: $("setConfirmWrite").checked }))));
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
  D.state().then((s) => { apply(s); go("requests"); document.documentElement.dataset.ready = "1"; });
})();
