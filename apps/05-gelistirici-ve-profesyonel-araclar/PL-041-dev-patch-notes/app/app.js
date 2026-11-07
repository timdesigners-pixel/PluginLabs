/* Dev Patch Notes — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok). Arayüz ağa, panoya, dosya
 * sistemine, git'e ve anahtarlara doğrudan erişmez; her işlem ana sürece dar IPC ile gider. */
(function () {
  const D = window.dpDesktop;
  const C = window.DPCore;
  const $ = (id) => document.getElementById(id);
  const VIEWS = ["notes", "exports", "settings"];
  const state = { s: null, view: "notes", lf: "etkin", repoDir: "" };
  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
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
    setTimeout(() => t.remove(), 8000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone, title) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text, title });
  const btn = (text, cls, onClick, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + (cls || "pl-btn--ghost"), ...(attrs || {}) }, text); if (onClick) b.addEventListener("click", guard(onClick)); return b; };
  const pctText = (v) => (v == null ? "—" : "%" + String(v).replace(".", ","));
  const fmtWhen = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const SRC = { depo: "git deposu", yapistirma: "yapıştırma", dosya: "dosya", ornek: "örnek" };
  const STATUS = { taslak: ["Taslak", "accent"], aktarildi: ["Dışa aktarıldı", "success"], arsiv: ["Arşiv", ""] };
  function apply(s) { if (s && s.settings) { state.s = s; render(); } }

  function go(view) {
    state.view = VIEWS.includes(view) ? view : "notes";
    for (const v of VIEWS) $("view-" + v).hidden = v !== state.view;
    document.querySelectorAll("[data-nav]").forEach((b) => { b.classList.toggle("is-active", b.dataset.nav === state.view); b.setAttribute("aria-selected", b.dataset.nav === state.view ? "true" : "false"); });
    render();
  }
  function render() {
    const s = state.s;
    if (!s) return;
    const m = s.metrics;
    $("relCount").textContent = String(m.releases);
    $("expCount").textContent = String(m.exports);
    $("mymindState").textContent = s.settings.provider === "yerel" ? "Yerel model" : s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.settings.provider === "yerel" || s.hasKey ? " pl-badge--success" : "");
    put($("sideInfo"), el("div", { class: "dp-mini__in" },
      el("span", { class: "pl-muted dp-small", text: "Dışa aktarılan kanıtsız iddia" }),
      el("b", { class: "is-ok", text: "0" }),
      el("span", { class: "pl-muted dp-small", text: m.blocked + " engellenen dışa aktarma · " + m.secretsFound + " sır maskelendi" })));
    if (state.view === "notes") renderNotes();
    if (state.view === "exports") renderExports();
    if (state.view === "settings") renderSettings();
  }

  // ---------------- Sürüm notları ----------------
  function listItem(x, selected) {
    const st = STATUS[x.status];
    const li = el("li", { class: "dp-item dp-item" + (selected ? " is-sel" : ""), "data-id": x.id, role: "option", tabindex: "0", "aria-selected": selected ? "true" : "false" },
      el("span", {}),
      el("div", { class: "dp-item__body" },
        el("span", { class: "dp-ititle", text: x.title + " · " + x.date }),
        el("div", { class: "dp-imeta" }, badge(st[0], st[1]), badge(x.commits + " commit"), badge(x.items + " madde"), x.secrets ? badge(x.secrets + " sır", "warning") : null, x.blocked ? badge(x.blocked + " engel", "danger") : null),
        el("span", { class: "dp-src", text: (x.source.label || "") + (x.source.range ? " · " + x.source.range : "") })));
    const open = guard(async () => apply(await D.rel.open(x.id)));
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return li;
  }
  function renderNotes() {
    document.querySelectorAll("[data-lf]").forEach((b) => { b.setAttribute("aria-checked", b.dataset.lf === state.lf ? "true" : "false"); b.classList.toggle("is-active", b.dataset.lf === state.lf); });
    const all = state.s.releases;
    $("emptyPanel").hidden = !!all.length;
    $("relSplit").hidden = !all.length;
    if (!all.length) return;
    const list = all.filter((x) => (state.lf === "arsiv" ? x.status === "arsiv" : x.status !== "arsiv"));
    $("relInfo").textContent = list.length + (state.lf === "arsiv" ? " arşivlenmiş sürüm notu" : " sürüm notu");
    put($("relList"), ...(list.length ? list.map((x) => listItem(x, x.id === state.s.active)) : [el("li", { class: "dp-empty", text: state.lf === "arsiv" ? "Arşiv boş." : "Sürüm notu yok." })]));
    const d = state.s.detail;
    put($("relDetail"), d && list.some((x) => x.id === d.id) ? detail(d) : el("p", { class: "dp-empty", text: list.length ? "Soldan bir sürüm notu seçin." : "" }));
  }

  function itemRow(d, it) {
    const is = d.issues[it.id];
    const bad = it.include && (is.unsupported.length || is.secrets.length);
    const set = (patch) => guard(async () => { const r = await D.item.set(d.id, it.id, patch); apply(r.state); if (r.warn) toast(r.warn, true); });
    const inc = el("input", { type: "checkbox", "aria-label": "Notta yer alsın: " + it.text });
    inc.checked = it.include;
    inc.addEventListener("change", () => set({ include: inc.checked })());
    const ta = el("textarea", { class: "pl-input", rows: "1", maxlength: String(C.MAX_TEXT), "aria-label": "Madde metni", spellcheck: "false" });
    ta.value = it.text;
    ta.addEventListener("change", () => set({ text: ta.value })());
    const cat = el("select", { class: "pl-input", "aria-label": "Başlık" }, ...C.CATS.map((c) => el("option", { value: c, text: C.CAT_NAMES[c] })));
    cat.value = it.cat;
    cat.addEventListener("change", () => set({ cat: cat.value })());
    const refs = el("div", { class: "dp-refs" });
    for (const sha of it.commits) {
      if (!C.isSha(sha)) { refs.appendChild(badge("commit yok", "danger")); continue; }
      const c = d.commits.find((x) => x.sha === sha);
      const b = el("button", { type: "button", class: "dp-sha", title: (c ? c.subject : "") + (c && c.url ? "\n" + c.url : "\n(depo adresi yok — bağlantı üretilemedi)") }, sha.slice(0, 7));
      b.addEventListener("click", guard(async () => { await D.openCommit(d.id, sha); }));
      refs.appendChild(b);
    }
    for (const p of it.prs) refs.appendChild(badge("#" + p));
    refs.appendChild(badge(C.CONF_NAMES[it.conf], it.conf === "kesin" ? "success" : it.conf === "belirsiz" ? "warning" : ""));
    for (const f of it.flags) refs.appendChild(badge(C.FLAG_NAMES[f], f === "kaynaksiz" ? "danger" : "warning"));
    if (it.edited) refs.appendChild(badge(it.ai ? "MyMind" : "düzenlendi", it.ai ? "pro" : ""));
    const first = d.commits.find((x) => x.sha === it.commits[0]);
    return el("div", { class: "dp-it" + (it.include ? "" : " is-off") + (bad ? " is-bad" : ""), "data-item": it.id },
      inc,
      el("div", { class: "dp-it__main" }, ta, refs,
        first && first.subject !== it.text ? el("span", { class: "dp-src", title: first.subject + (first.body ? "\n\n" + first.body : ""), text: "Kaynak: " + first.subject }) : null,
        ...is.unsupported.map((c) => el("span", { class: "dp-warn", text: "Kanıtsız iddia: “" + c.match + "” — " + c.name + " kaynak commit'te geçmiyor. Kaldırın ya da commit iletisine kanıt ekleyin." })),
        ...is.secrets.map((s) => el("span", { class: "dp-warn", text: s + " içeriyor — kaldırın." }))),
      cat);
  }

  function detail(d) {
    const out = [];
    const title = el("input", { class: "pl-input", id: "relTitle", value: d.title, maxlength: "80", "aria-label": "Sürüm" });
    title.addEventListener("change", guard(async () => apply(await D.rel.meta(d.id, { title: title.value }))));
    const date = el("input", { class: "pl-input", type: "date", value: d.date, "aria-label": "Tarih" });
    date.addEventListener("change", guard(async () => apply(await D.rel.meta(d.id, { date: date.value }))));
    const repo = el("input", { class: "pl-input", id: "relRepo", value: d.repo ? d.repo.base : "", maxlength: "500", spellcheck: "false", placeholder: "https://github.com/… (commit bağlantıları için)", "aria-label": "Depo adresi" });
    repo.addEventListener("change", guard(async () => apply(await D.rel.meta(d.id, { repoUrl: repo.value }))));
    out.push(el("div", { class: "dp-meta" },
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", text: "Sürüm" }), title),
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", text: "Tarih" }), date),
      el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", text: "Depo adresi" + (d.repo ? " · " + d.repo.host : "") }), repo)));
    out.push(el("div", { class: "dp-bar" }, badge(SRC[d.source.via] || d.source.via), badge(d.source.format), d.source.label ? el("span", { class: "pl-muted dp-small", text: d.source.label + (d.source.range ? " · " + d.source.range : "") }) : null, el("span", { class: "dp-grow" }),
      badge(d.commits.length + " commit"), badge(d.items.filter((x) => x.include).length + " madde"), badge("düzeltme " + pctText(d.ratio), d.ratio > 50 ? "warning" : "")));
    if (d.secrets.length) out.push(el("div", { class: "dp-block dp-secrets", id: "secretBox" }, el("div", { class: "dp-row" }, icon("lock", "16"), el("b", { text: d.secrets.length + " olası sır bulundu ve maskelendi" })),
      el("ul", { class: "dp-notes" }, ...d.secrets.slice(0, 8).map((s) => el("li", { text: s.type + " · " + s.masked + (s.sha ? " · commit " + s.sha.slice(0, 7) : "") + " · satır " + s.line }))),
      el("span", { class: "pl-muted dp-small", text: "Ham değer saklanmadı; nota, dosyaya ve yapay zekâya gitmez. Gerçek bir anahtarsa depoda geçmişten temizleyip iptal edin." })));
    if (d.blockers.length) out.push(el("div", { class: "dp-block dp-blockers", id: "blockBox" }, el("b", { text: "Dışa aktarma engelli (" + d.blockers.length + ")" }), el("ul", { class: "dp-notes" }, ...d.blockers.map((b) => el("li", { text: b.id + ": " + b.reason })))));
    const editor = el("div", { class: "dp-stack", id: "itemList" });
    for (const c of C.CATS) {
      const list = d.items.filter((x) => x.cat === c);
      if (!list.length) continue;
      editor.appendChild(el("div", { class: "dp-sec" }, el("div", { class: "dp-sec__h" }, C.CAT_NAMES[c], badge(String(list.filter((x) => x.include).length) + "/" + list.length)), ...list.map((it) => itemRow(d, it))));
    }
    out.push(el("div", { class: "dp-panes" }, editor, el("div", { class: "dp-stack" }, el("span", { class: "dp-lbl", text: "Önizleme (Markdown)" }), el("pre", { class: "dp-preview", id: "preview", text: d.preview }))));
    if (d.ai) {
      const entries = Object.entries(d.ai.items);
      out.push(el("div", { class: "dp-block dp-block--ai", id: "aiBox" },
        el("div", { class: "dp-row" }, icon("spark", "16"), el("b", { text: "MyMind önerisi" }), el("span", { class: "pl-muted dp-small", text: fmtWhen(d.ai.at) + " · denetlendi" })),
        entries.length ? el("ul", { class: "dp-notes" }, ...entries.map(([id, v]) => { const it = d.items.find((x) => x.id === id); return el("li", { text: (it ? "“" + it.text + "” → " : "") + "“" + v.text + "”" + (it && v.cat !== it.cat ? " [" + C.CAT_NAMES[v.cat] + "]" : "") }); })) : el("span", { class: "pl-muted dp-small", text: "Öneri yok ya da uygulandı." }),
        d.ai.dropped ? el("span", { class: "dp-why is-warn", text: d.ai.dropped + " öneri atıldı: " + d.ai.droppedList.join("; ") }) : null,
        el("div", { class: "dp-row" }, entries.length ? btn("Önerileri uygula", "pl-btn--secondary", async () => { const r = await D.ai.apply(d.id); apply(r.state); toast(r.applied + " madde güncellendi."); }) : null, btn("Kapat", "pl-btn--ghost", async () => apply(await D.ai.dismiss(d.id))))));
    }
    const exp = (fn, label) => async () => {
      const r = await fn(d.id);
      if (r.cancelled) return;
      apply(r.state);
      toast((r.file ? "“" + r.file + "” kaydedildi" : "Panoya kopyalandı") + ": " + r.items + " madde, " + r.links + " commit bağlantısı, düzeltme oranı " + pctText(r.ratio) + (r.verify ? " · geri okuma birebir" : " · GERİ OKUMA UYUŞMUYOR") + ".", !r.verify);
    };
    out.push(el("div", { class: "dp-actions" },
      btn("Markdown kaydet", "pl-btn--primary", exp(D.exportMd), { id: "mdBtn" }),
      btn("Panoya kopyala", "pl-btn--secondary", exp(D.copy), { id: "copyBtn" }),
      btn("Düz metin", "pl-btn--ghost", exp(D.exportTxt), { id: "txtBtn" }),
      btn("JSON", "pl-btn--ghost", exp(D.exportJson), { id: "jsonBtn" }),
      el("span", { class: "dp-grow" }),
      btn("MyMind ile yeniden yaz", "pl-btn--ghost", async () => { busy("MyMind'a soruluyor…"); const r = await D.ai.draft(d.id); busy(null); if (!r.approved) { toast("Gönderilmedi."); return; } apply(r.state); toast(r.count + " madde önerisi" + (r.dropped ? " · " + r.dropped + " öneri atıldı (yeni madde, kanıtsız iddia, olmayan başlık ya da sır)" : "") + "."); }, { id: "aiBtn" }),
      btn("Taslağa dön", "pl-btn--ghost", async () => { apply(await D.rel.reset(d.id)); toast("Maddeler üretilen taslağa döndürüldü."); }),
      d.status === "arsiv" ? btn("Geri al", "pl-btn--ghost", async () => { apply(await D.rel.restore(d.id)); state.lf = "etkin"; render(); }) : btn("Arşivle", "pl-btn--ghost", async () => { apply(await D.rel.archive(d.id)); toast("Sürüm notu arşivlendi (silinmedi)."); })));
    const f = document.createDocumentFragment();
    out.forEach((n) => f.appendChild(n));
    return f;
  }

  // ---------------- Dışa aktarımlar ----------------
  function renderExports() {
    const list = state.s.exports;
    $("expInfo").textContent = list.length ? list.length + " dışa aktarım" : "";
    if (!list.length) { put($("expBody"), el("p", { class: "dp-empty", text: "Henüz dışa aktarım yok." })); return; }
    put($("expBody"), el("table", { class: "dp-explist", id: "expTable" },
      el("thead", {}, el("tr", {}, ...["Zaman", "Sürüm", "Dosya", "Biçim", "Madde", "Commit bağlantısı", "Düzeltme oranı", "Geri okuma"].map((h) => el("th", { text: h })))),
      el("tbody", {}, ...list.map((e) => el("tr", {}, el("td", { text: fmtWhen(e.at) }), el("td", { text: e.release }), el("td", { class: "mono", text: e.file }), el("td", { text: e.format === "pano" ? "Pano (Markdown)" : e.format.toUpperCase() }), el("td", { text: String(e.items) }), el("td", { text: String(e.links) }), el("td", { text: pctText(e.ratio) }), el("td", {}, badge(e.verify ? "birebir" : "uyuşmuyor", e.verify ? "success" : "danger")))))));
  }

  // ---------------- Ayarlar ----------------
  function renderSettings() {
    const s = state.s, m = s.metrics;
    const card = (v, label, cls) => el("div", {}, el("b", { class: cls || "", text: v }), el("span", { text: label }));
    put($("metrics"),
      card("0", "dışa aktarılan kanıtsız teslim iddiası (hedef 0; engellenir)", "is-ok"),
      card(String(m.blocked), "engellenen dışa aktarma (kanıtsız iddia / sır)", m.blocked ? "is-bad" : ""),
      card(pctText(m.editRatio), "son " + m.last10 + " sürümde ortalama düzeltme oranı"),
      card(m.editMinutes == null ? "—" : String(m.editMinutes).replace(".", ",") + " dk", "son " + m.last10 + " sürümde ortalama etkin düzenleme"),
      card(String(m.releases), "etkin sürüm notu (" + m.items + " madde)"),
      card(String(m.exports), "dışa aktarım (" + m.verified + " geri okuma birebir)"),
      card(String(m.secretsFound), "maskelenen olası sır", m.secretsFound ? "is-bad" : ""),
      card(m.aiRuns + " / " + m.aiDropped, "MyMind isteği / atılan öneri", m.aiDropped ? "is-bad" : ""));
    const g = s.gold;
    $("goldInfo").textContent = g ? "Örnek depoda elle etiketlenmiş " + g.total + " commit: kategori doğruluğu " + pctText(g.accuracy) + (g.misses.length ? " · hatalar: " + g.misses.join("; ") : "") + ". Örnek uydurma veridir; gerçek depolarınızda ölçülmemiştir." : "Sınıflandırma doğruluğu için “Örnek depo”yu ekleyin (elle etiketlenmiş beklenen başlıklarla karşılaştırılır).";
    $("setTemplate").value = s.settings.template;
    $("setInternal").checked = s.settings.internal;
    if (document.activeElement !== $("setMax")) $("setMax").value = String(s.settings.maxCommits);
    document.querySelectorAll('input[name="provider"]').forEach((r) => { r.checked = r.value === s.settings.provider; });
    $("localBox").hidden = s.settings.provider !== "yerel";
    if (document.activeElement !== $("localUrl")) $("localUrl").value = s.settings.localUrl;
    if (document.activeElement !== $("localModel")) $("localModel").value = s.settings.localModel;
    $("vaultInfo").textContent = s.vault ? "Sürüm notları ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır." : "Bu sistemde işletim sistemi kasası yok: kayıtlar düz JSON olarak saklanır, anahtar yalnız bellekte tutulur.";
  }

  // ---------------- Olaylar ----------------
  const done = (r) => { state.lf = "etkin"; apply(r.state); go("notes"); toast(r.summary + "."); };
  document.querySelectorAll('[data-act="repo"]').forEach((b) => b.addEventListener("click", () => { $("repoInfo").textContent = state.repoDir ? "" : "Önce klasör seçin."; $("repoDialog").showModal(); }));
  $("repoPick").addEventListener("click", guard(async () => {
    const r = await D.repo.pick();
    if (r.cancelled) return;
    state.repoDir = r.dir;
    $("repoDir").value = r.dir;
    put($("repoTags"), ...r.tags.map((t) => el("option", { value: t + "..HEAD" })));
    $("repoRange").value = r.tags.length ? r.tags[0] + "..HEAD" : "";
    $("repoUrl").value = r.repo ? r.repo.base : "";
    $("repoInfo").textContent = r.name + " · dal " + (r.head || "?") + " · " + (r.tags.length ? r.tags.length + " etiket, son: " + r.tags[0] : "etiket yok") + (r.remote ? " · origin: " + (r.repo ? r.repo.base : "web adresine çevrilemedi") : " · origin yok");
  }));
  $("repoCancel").addEventListener("click", () => $("repoDialog").close());
  $("repoRun").addEventListener("click", guard(async () => {
    if (!state.repoDir) { toast("Önce klasör seçin.", true); return; }
    busy("Commit'ler okunuyor…");
    const r = await D.repo.read({ dir: state.repoDir, range: $("repoRange").value.trim(), title: $("repoVer").value.trim(), repoUrl: $("repoUrl").value.trim() });
    busy(null);
    $("repoDialog").close();
    done(r);
  }));
  document.querySelectorAll('[data-act="paste"]').forEach((b) => b.addEventListener("click", () => { $("pasteText").value = ""; $("pasteVer").value = ""; $("pasteUrl").value = ""; $("pasteDate").value = (state.s ? state.s.now : new Date().toISOString()).slice(0, 10); $("pasteDialog").showModal(); $("pasteText").focus(); }));
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteRun").addEventListener("click", guard(async () => {
    const r = await D.capture.text({ content: $("pasteText").value, title: $("pasteVer").value.trim(), date: $("pasteDate").value, repoUrl: $("pasteUrl").value.trim() });
    $("pasteDialog").close();
    done(r);
  }));
  document.querySelectorAll('[data-act="file"]').forEach((b) => b.addEventListener("click", guard(async () => { const r = await D.capture.file(); if (!r.cancelled) done(r); })));
  document.querySelectorAll('[data-act="sample"]').forEach((b) => b.addEventListener("click", guard(async () => done(await D.capture.sample()))));
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
  document.querySelectorAll("[data-lf]").forEach((b) => b.addEventListener("click", () => { state.lf = b.dataset.lf; render(); }));
  $("setTemplate").addEventListener("change", guard(async () => apply(await D.setSettings({ template: $("setTemplate").value }))));
  $("setInternal").addEventListener("change", guard(async () => apply(await D.setSettings({ internal: $("setInternal").checked }))));
  $("setMax").addEventListener("change", guard(async () => apply(await D.setSettings({ maxCommits: Number($("setMax").value) }))));
  document.querySelectorAll('input[name="provider"]').forEach((r) => r.addEventListener("change", guard(async () => apply(await D.setSettings({ provider: r.value })))));
  $("saveLocal").addEventListener("click", guard(async () => { apply(await D.setSettings({ localUrl: $("localUrl").value.trim(), localModel: $("localModel").value.trim() })); toast("Yerel model ayarı kaydedildi."); }));
  $("backupBtn").addEventListener("click", guard(async () => { const r = await D.backup(); if (!r.cancelled) toast("“" + r.file + "” kaydedildi."); }));
  $("openMymind").addEventListener("click", () => { $("mymindKey").value = ""; $("mymindInfo").textContent = state.s.hasKey ? "Kayıtlı bir anahtar var." : "Kayıtlı anahtar yok."; $("mymindDialog").showModal(); });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.ai.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için bellekte tutuluyor."); apply(await D.state()); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.ai.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); apply(await D.state()); }));

  D.onState(apply);
  D.state().then((s) => { apply(s); go("notes"); document.documentElement.dataset.ready = "1"; });
})();
