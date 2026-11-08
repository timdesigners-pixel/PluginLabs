/* Note Master (PL-006) — arayüz mantığı (yalnız güvenli DOM, innerHTML kullanılmaz). */
(function () {
  "use strict";
  const D = window.nmDesktop;
  const C = window.NoteCore;
  const $ = (id) => document.getElementById(id);

  let S = null;
  let nav = "notes";
  let kind = "not";
  let selectedId = null;
  let tagFilter = "";

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, String(v));
    }
    for (const ch of children.flat()) {
      if (ch == null || ch === false) continue;
      node.appendChild(ch instanceof Node ? ch : document.createTextNode(String(ch)));
    }
    return node;
  }
  function toast(msg, k) {
    const t = el("div", { class: "pl-toast pl-toast--" + (k || "info") }, String(msg));
    $("toasts").appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }
  async function run(fn) {
    try { await fn(); } catch (err) { toast(err && err.message ? err.message : String(err), "danger"); }
  }
  const fmt = (iso) => (iso ? iso.slice(0, 16).replace("T", " ") : "");

  function setKind(k) {
    kind = k;
    document.querySelectorAll("[data-kind]").forEach((b) => {
      const on = b.dataset.kind === k;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    $("cDue").hidden = k !== "gorev";
    $("cBody").placeholder = k === "gorev" ? "Hızlı görev… (Ctrl+Enter ile kaydet)" : "Hızlı not ya da görev… #etiket yazabilirsiniz (Ctrl+Enter ile kaydet)";
  }
  function setMore(open) {
    $("captureMore").hidden = !open;
    $("moreBtn").setAttribute("aria-expanded", open ? "true" : "false");
    $("moreBtn").textContent = open ? "− Kaynak, alıntı, etiket" : "+ Kaynak, alıntı, etiket";
  }
  function updateQuoteInfo() {
    const q = $("cQuote").value.trim();
    const lim = S ? S.settings.quoteLimit : C.DEFAULT_QUOTE_LIMIT;
    $("quoteInfo").textContent = q ? "Alıntı " + q.length + "/" + lim + (q.length > lim ? " — kısaltılacak" : "") : "";
  }

  function switchNav(n) {
    nav = n;
    document.querySelectorAll("[data-nav]").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === n));
    $("view-notes").hidden = n !== "notes";
    $("view-tasks").hidden = n !== "tasks";
    $("view-export").hidden = n !== "export";
    render();
  }

  function itemRow(n, opts) {
    const sub = [n.kind === "gorev" ? (n.due ? "Son: " + n.due : "Görev") : "Not"];
    if (n.sourceTitle || n.sourceUrl) sub.push(n.sourceTitle || C.sourceHost(n.sourceUrl));
    if (n.tags.length) sub.push(n.tags.map((t) => "#" + t).join(" "));
    const li = el(
      "li",
      { class: "ax-item" + (opts && opts.selectable && n.id === selectedId ? " is-sel" : ""), dataset: { id: n.id }, tabindex: "0" },
      n.kind === "gorev"
        ? el("input", { type: "checkbox", checked: n.done, "aria-label": "Tamamlandı", onclick: (e) => { e.stopPropagation(); run(async () => { S = await D.notes.toggle(n.id); render(); }); } })
        : null,
      el("div", { class: "ax-item__main" }, el("span", { class: "ax-item__title" + (n.done ? " is-done" : "") }, n.title), el("span", { class: "ax-item__sub" }, sub.join(" · "))),
      n.private ? el("span", { class: "ax-pill ax-pill--priv" }, "gizli") : null,
      n.aiDraft ? el("span", { class: "ax-pill" }, "taslak") : null
    );
    const open = () => run(async () => {
      selectedId = n.id;
      if (nav !== "notes") switchNav("notes");
      const r = await D.notes.recall(n.id);
      S = r.state;
      render();
    });
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    return li;
  }

  function renderDetail() {
    const box = $("noteDetail");
    const n = S.notes.find((x) => x.id === selectedId);
    if (!n) { box.replaceChildren(el("p", { class: "ax-empty" }, "Bir not seçin.")); return; }
    const parts = [];
    parts.push(
      el("div", { class: "ax-bar" },
        el("h2", { class: "pl-h3 ax-h", id: "detailTitle" }, n.title),
        n.private ? el("span", { class: "ax-pill ax-pill--priv" }, "gizli") : null)
    );
    parts.push(el("p", { class: "pl-muted ax-small" },
      (n.kind === "gorev" ? "Görev" + (n.done ? " · tamamlandı" : " · açık") + (n.due ? " · son tarih " + n.due : "") : "Not") +
        " · oluşturma " + fmt(n.createdAt) + " · geri çağırma " + n.recalls.length));
    if (n.tags.length) parts.push(el("div", { class: "ax-concepts" }, n.tags.map((t) => el("span", { class: "pl-tag" }, "#" + t))));
    if (n.body.trim()) parts.push(el("pre", { class: "ax-body", id: "detailBody" }, n.body));
    if (n.quote) {
      parts.push(el("div", { class: "ax-block ax-block--quote" },
        el("span", { class: "ax-lbl" }, "Alıntı"),
        el("p", { class: "ax-body" }, n.quote),
        n.quoteTruncated ? el("span", { class: "pl-muted ax-small" }, "Alıntı sınırı nedeniyle kısaltıldı.") : null));
    }
    if (n.sourceUrl || n.sourceTitle) {
      parts.push(el("div", { class: "ax-src", id: "detailSource" }, "Kaynak: ", el("b", {}, n.sourceTitle || C.sourceHost(n.sourceUrl)), n.sourceUrl ? " — " + n.sourceUrl : ""));
    }
    parts.push(el("div", { class: "ax-row" },
      el("button", { class: "pl-btn pl-btn--secondary pl-btn--sm", type: "button", id: "copyMdBtn", onclick: () => run(async () => { S = await D.notes.copyMd(n.id); toast("Not Markdown olarak panoya kopyalandı.", "success"); render(); }) }, "Markdown kopyala"),
      el("button", { class: "pl-btn pl-btn--ghost pl-btn--sm", type: "button", onclick: () => run(async () => { S = await D.notes.update(n.id, { private: !n.private }); render(); }) }, n.private ? "Gizliliği kaldır" : "Gizli yap"),
      el("button", { class: "pl-btn pl-btn--ghost pl-btn--sm", type: "button", onclick: () => run(async () => { const r = await D.notes.remove(n.id); S = r.state; if (r.removed) { selectedId = null; toast("Not silindi.", "info"); } render(); }) }, "Sil")
    ));

    // MyMind taslağı
    const ai = el("div", { class: "ax-block ax-block--ai", id: "aiBox" }, el("span", { class: "ax-lbl" }, "MyMind taslağı — özgün metin değişmez"));
    const len = (n.body + (n.quote ? "\n\nAlıntı:\n" + n.quote : "")).trim().length;
    if (n.private && !S.settings.allowPrivateAi) {
      ai.appendChild(el("p", { class: "ax-small" }, "Bu not gizli; varsayılan olarak modele gönderilmez."));
    } else if (len < C.AI_MIN_CHARS) {
      ai.appendChild(el("p", { class: "ax-small pl-muted" }, "Taslak uzun notlar içindir (en az " + C.AI_MIN_CHARS + " karakter; bu not " + len + ")."));
    }
    ai.appendChild(el("div", { class: "ax-row" },
      el("button", { class: "pl-btn pl-btn--primary pl-btn--sm", type: "button", id: "draftBtn", onclick: () => run(async () => {
        const r = await D.ai.draft(n.id);
        if (!r.approved) { toast("İptal edildi; hiçbir şey gönderilmedi.", "info"); return; }
        S = r.state;
        const extra = [];
        if (r.draft.droppedRewrites) extra.push(r.draft.droppedRewrites + " yeniden yazım girişimi atıldı");
        if (r.draft.droppedConcepts) extra.push(r.draft.droppedConcepts + " notta geçmeyen kavram atıldı");
        toast("Taslak hazır" + (extra.length ? " — " + extra.join(", ") : "") + ".", "success");
        render();
      }) }, n.aiDraft ? "Taslağı yenile" : "Görev/özet/kavram taslağı")));
    if (n.aiDraft) {
      const d = n.aiDraft;
      if (d.summary) ai.appendChild(el("p", { class: "ax-body", id: "draftSummary" }, d.summary));
      if (d.tasks.length) {
        ai.appendChild(el("span", { class: "ax-lbl" }, "Görev önerileri"));
        ai.appendChild(el("ul", { class: "ax-ul", id: "draftTasks" }, d.tasks.map((t) => el("li", {}, t))));
        ai.appendChild(el("button", { class: "pl-btn pl-btn--secondary pl-btn--sm", type: "button", id: "applyTasksBtn", onclick: () => run(async () => {
          const r = await D.ai.applyTasks(n.id, []);
          S = r.state;
          toast(r.added + " görev eklendi (kaynak ana nottan devralındı).", "success");
          render();
        }) }, "Önerileri görev olarak ekle"));
      }
      if (d.concepts.length) {
        ai.appendChild(el("span", { class: "ax-lbl" }, "Anahtar kavramlar"));
        ai.appendChild(el("div", { class: "ax-concepts", id: "draftConcepts" }, d.concepts.map((c) => el("span", { class: "pl-tag is-selected" }, c))));
      }
      const dropped = [];
      if (d.droppedRewrites) dropped.push("özgün metni yeniden yazma girişimi: " + d.droppedRewrites);
      if (d.droppedConcepts) dropped.push("notta geçmeyen kavram: " + d.droppedConcepts);
      if (dropped.length) ai.appendChild(el("p", { class: "ax-small", id: "droppedInfo" }, "Denetimde atıldı — " + dropped.join(" · ")));
      ai.appendChild(el("p", { class: "pl-muted ax-small" }, d.provider + " · " + fmt(d.at)));
    }
    parts.push(ai);
    box.replaceChildren(...parts);
    if (box.dataset.scrolled !== n.id) { box.dataset.scrolled = n.id; box.scrollTop = 0; }
  }

  function renderNotes() {
    const has = S.notes.length > 0;
    $("emptyPanel").hidden = has;
    $("notesSplit").hidden = !has;
    $("clearTagBtn").hidden = !tagFilter;
    $("clearTagBtn").textContent = "#" + tagFilter + " ✕";
    if (!has) return;
    const list = C.search(S.notes, $("searchInput").value, { tag: tagFilter, kind: $("kindSel").value });
    $("listCount").textContent = list.length + " / " + S.notes.length + " kayıt";
    if (!selectedId || !S.notes.some((n) => n.id === selectedId)) selectedId = list[0] ? list[0].id : null;
    $("noteList").replaceChildren(...(list.length ? list.map((n) => itemRow(n, { selectable: true })) : [el("li", { class: "ax-empty" }, "Eşleşen not yok.")]));
    renderDetail();
  }
  function renderTasks() {
    const tasks = S.notes.filter((n) => n.kind === "gorev");
    const open = tasks.filter((t) => !t.done).sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
    const done = tasks.filter((t) => t.done);
    $("openCount").textContent = open.length;
    $("doneCount").textContent = done.length;
    $("openTasks").replaceChildren(...(open.length ? open.map((n) => itemRow(n)) : [el("li", { class: "ax-empty" }, "Açık görev yok.")]));
    $("doneTasks").replaceChildren(...(done.length ? done.map((n) => itemRow(n)) : [el("li", { class: "ax-empty" }, "Henüz tamamlanan yok.")]));
  }
  function kpi(label, value, ok, hint) {
    return el("div", { class: "ax-kpi" }, el("span", {}, label), el("b", { class: ok == null ? "" : ok ? "is-ok" : "is-bad" }, value), hint ? el("span", {}, hint) : null);
  }
  function renderExport() {
    const m = S.metrics;
    $("kpis").replaceChildren(
      kpi("İlk not süresi", m.firstNoteSeconds == null ? "—" : m.firstNoteSeconds + " sn", m.firstNoteSeconds == null ? null : m.firstNoteOk, "Hedef ≤ " + m.targets.firstNoteSeconds + " sn"),
      kpi("Bu hafta geri çağrılan not", String(m.weeklyRecalledNotes), m.weeklyOk, "Hedef ≥ " + m.targets.weeklyRecalls + " · " + m.weeklyRecallEvents + " geri çağırma"),
      kpi("Kaynaklı kayıt", m.sourced + " / " + m.total, null, m.privateCount + " gizli not"),
      kpi("Görevler", m.openTasks + " açık / " + m.tasks, null, "MyMind taslağı: " + S.counters.aiRuns + " · gizli engeli: " + S.counters.privateBlocked)
    );
    if (document.activeElement !== $("quoteLimit")) $("quoteLimit").value = S.settings.quoteLimit;
    $("provHub").checked = S.settings.provider === "hub";
    $("provLocal").checked = S.settings.provider === "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = S.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = S.settings.localModel;
    $("allowPrivate").checked = S.settings.allowPrivateAi;
  }
  function renderSide() {
    const m = S.metrics;
    $("notesBadge").textContent = m.total;
    $("tasksBadge").textContent = m.openTasks;
    $("mymindState").textContent = S.settings.provider === "yerel" ? "Yerel" : S.hasKey ? "Hazır" : "Kapalı";
    $("tagList").replaceChildren(...S.tags.slice(0, 18).map((t) =>
      el("button", { type: "button", class: "pl-tag" + (t.tag === tagFilter ? " is-selected" : ""), onclick: () => { tagFilter = tagFilter === t.tag ? "" : t.tag; if (nav !== "notes") switchNav("notes"); else render(); } }, "#" + t.tag + " " + t.count)));
    $("sideInfo").replaceChildren(el("div", { class: "ax-mini__in" },
      el("span", { class: "pl-muted" }, "Bu hafta geri çağrılan"),
      el("b", { class: m.weeklyOk ? "is-ok" : "is-bad" }, m.weeklyRecalledNotes + " / " + m.targets.weeklyRecalls)));
    $("footInfo").textContent = (S.vault ? "Notlar Windows kasasında (DPAPI) şifreli" : "Notlar yerel dosyada") + " · arayüz ağa kapalı · MyMind yalnız onayınızla";
    $("root").classList.toggle("is-mini", !!S.mini);
    $("miniExitBtn").hidden = !S.mini;
  }
  function render() {
    if (!S) return;
    renderSide();
    if (nav === "notes") renderNotes();
    if (nav === "tasks") renderTasks();
    if (nav === "export") renderExport();
    updateQuoteInfo();
  }

  async function save() {
    const r = await D.notes.create({
      kind,
      body: $("cBody").value,
      quote: $("cQuote").value,
      sourceUrl: $("cUrl").value,
      sourceTitle: $("cSrcTitle").value,
      tags: $("cTags").value,
      due: $("cDue").value,
      private: $("cPrivate").checked,
    });
    S = r.state;
    selectedId = r.note.id;
    ["cBody", "cQuote", "cUrl", "cSrcTitle", "cTags", "cDue"].forEach((id) => ($(id).value = ""));
    $("cPrivate").checked = false;
    setMore(false);
    toast((r.note.kind === "gorev" ? "Görev" : "Not") + " kaydedildi" + (r.note.quoteTruncated ? " — alıntı sınırı nedeniyle kısaltıldı" : "") + ".", "success");
    render();
    $("cBody").focus();
  }

  function bind() {
    document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => switchNav(b.dataset.nav)));
    document.querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => setKind(b.dataset.kind)));
    document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", () => run(async () => {
      const r = await D.notes.loadSample();
      S = r.state;
      selectedId = null;
      toast("Örnek notlar yüklendi (" + r.added + " kayıt).", "success");
      render();
    })));
    $("saveBtn").addEventListener("click", () => run(save));
    $("cBody").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(save); } });
    $("cQuote").addEventListener("input", updateQuoteInfo);
    $("moreBtn").addEventListener("click", () => setMore($("captureMore").hidden));
    $("clipBtn").addEventListener("click", () => run(async () => {
      const r = await D.readClipboard();
      setMore(true);
      if (r.url) { $("cUrl").value = r.url; toast("Panodaki adres kaynak olarak eklendi.", "info"); return; }
      if (!r.text) { toast("Pano boş. Önce metni seçip kopyalayın (Ctrl+C).", "warning"); return; }
      $("cQuote").value = r.text;
      updateQuoteInfo();
      toast("Panodaki metin alıntı olarak eklendi; kaynağı girin.", "info");
      $("cUrl").focus();
    }));
    $("searchInput").addEventListener("input", () => render());
    $("kindSel").addEventListener("change", () => render());
    $("clearTagBtn").addEventListener("click", () => { tagFilter = ""; render(); });
    $("miniBtn").addEventListener("click", () => run(async () => { S = await D.setMini(true); render(); $("cBody").focus(); }));
    $("miniExitBtn").addEventListener("click", () => run(async () => { S = await D.setMini(false); render(); }));

    const excl = () => ({ excludePrivate: $("exclPrivate").checked });
    $("mdBtn").addEventListener("click", () => run(async () => { const r = await D.exportMd(excl()); if (r.cancelled) return; S = r.state; toast("“" + r.file + "” kaydedildi.", "success"); render(); }));
    $("jsonBtn").addEventListener("click", () => run(async () => { const r = await D.exportJson(excl()); if (r.cancelled) return; S = r.state; toast("“" + r.file + "” kaydedildi.", "success"); render(); }));
    $("importBtn").addEventListener("click", () => run(async () => { const r = await D.importJson(); if (r.cancelled) return; S = r.state; toast(r.added + " not içe aktarıldı, " + r.skipped + " atlandı.", "success"); render(); }));
    $("quoteLimit").addEventListener("change", () => run(async () => { S = await D.setSettings({ quoteLimit: Number($("quoteLimit").value) }); toast("Alıntı sınırı " + S.settings.quoteLimit + " karakter.", "info"); render(); }));
    $("provHub").addEventListener("change", () => run(async () => { S = await D.setSettings({ provider: "hub" }); render(); }));
    $("provLocal").addEventListener("change", () => run(async () => { S = await D.setSettings({ provider: "yerel" }); render(); }));
    $("saveLocal").addEventListener("click", () => run(async () => { S = await D.setSettings({ localUrl: $("localUrl").value, localModel: $("localModel").value }); toast("Yerel model ayarı kaydedildi.", "success"); render(); }));
    $("allowPrivate").addEventListener("change", () => run(async () => { S = await D.setSettings({ allowPrivateAi: $("allowPrivate").checked }); render(); }));

    const dlg = $("mymindDialog");
    $("openMymind").addEventListener("click", () => {
      $("mymindKey").value = "";
      $("mymindInfo").textContent = S.hasKey ? "Kayıtlı bir anahtar var" + (S.vault ? " (Windows kasasında şifreli)." : ".") : "Anahtar yok. Hub → API istemcileri bölümünden bir anahtar oluşturun.";
      dlg.showModal();
    });
    $("mymindCancel").addEventListener("click", () => dlg.close());
    $("mymindSave").addEventListener("click", () => run(async () => { const r = await D.ai.setKey($("mymindKey").value); dlg.close(); toast("MyMind anahtarı kaydedildi" + (r.stored === "vault" ? " (şifreli)." : " (yalnız bu oturum)."), "success"); }));
    $("mymindForget").addEventListener("click", () => run(async () => { await D.ai.setKey(null); dlg.close(); toast("MyMind anahtarı kaldırıldı.", "info"); }));

    D.onState((st) => { S = st; render(); });
    D.onCaptureFocus(() => $("cBody").focus());
  }

  (async () => {
    bind();
    setKind("not");
    S = await D.state();
    render();
    $("cBody").focus();
    document.documentElement.dataset.ready = "1";
  })();
})();
