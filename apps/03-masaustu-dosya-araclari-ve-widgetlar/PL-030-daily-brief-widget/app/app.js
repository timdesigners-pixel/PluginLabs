/* Daily Brief Widget — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa ve dosya sistemine erişmez; özet ana süreçte hesaplanır, burada yalnız gösterilir. MyMind istekleri ana süreçte onaydan geçer. */
(function () {
  const C = window.DBCore;
  const D = window.dbDesktop;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, view: "today", ai: null };
  const VIEWS = ["today", "tasks", "calendars", "settings"];

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    flag: "M4 22V4M4 4h13l-2 4 2 4H4",
    refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
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
      else if (k === "checked") e.checked = !!v;
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
    setTimeout(() => t.remove(), 5000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs, ico) => { const b = el("button", { type: "button", class: "pl-btn " + cls, ...(attrs || {}) }, ico ? icon(ico) : null, text); b.addEventListener("click", guard(onClick)); return b; };
  const iconBtn = (ico, label, onClick, attrs) => { const b = el("button", { type: "button", class: "db-icon-btn", title: label, "aria-label": label, ...(attrs || {}) }, icon(ico)); b.addEventListener("click", guard(onClick)); return b; };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  const PRI = { 1: "Yüksek", 2: "Normal", 3: "Düşük" };
  const KIND = { local: "Yerel", file: "ICS dosyası", url: "Abonelik" };
  const dueLabel = (t, today) => !t.due ? "tarihsiz" : t.due < today ? "gecikmiş · " + t.due.split("-").reverse().join(".") : t.due === today ? "bugün" + (t.time ? " " + t.time : "") : t.due.split("-").reverse().join(".") + (t.time ? " " + t.time : "");

  function setView(v) {
    if (!VIEWS.includes(v)) return;
    state.view = v;
    for (const id of VIEWS) $("view-" + id).hidden = id !== v;
    for (const b of document.querySelectorAll("[data-nav]")) { const on = b.dataset.nav === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); }
    render();
  }

  // ---- Bugün ----
  function taskRow(t, today) {
    const id = "chk-" + t.id;
    const li = el("li", { class: "db-task" + (t.done ? " is-done" : "") + (t.priority === 1 ? " is-high" : ""), "data-id": t.id },
      el("input", { type: "checkbox", id, checked: t.done, "aria-label": "Tamamlandı: " + t.title }),
      el("label", { for: id }, el("span", { class: "db-task__title", text: t.title }), el("span", { class: "db-task__meta pl-muted", text: dueLabel(t, today) + " · " + t.durationMin + " dk" + (t.priority !== 2 ? " · " + PRI[t.priority].toLowerCase() : "") })),
      t.sensitive ? el("span", { class: "db-lock", title: "Hassas" }, icon("lock")) : null,
      iconBtn("x", "Görevi sil", () => D.removeTask(t.id)));
    li.querySelector("input").addEventListener("change", guard(async () => { await D.toggleTask(t.id); toast(t.done ? "Görev yeniden açıldı." : "Görev tamamlandı."); }));
    return li;
  }
  function renderToday() {
    const s = state.s, b = s.brief, now = s.now;
    $("dayTitle").textContent = C.longDate(now);
    $("dayHeadline").textContent = b.headline + (b.freeMin ? " · çalışma saatlerinde " + Math.floor(b.freeMin / 60) + " sa " + (b.freeMin % 60) + " dk boş" : "");
    $("readBtn").textContent = s.readToday ? "Okundu ✓" : "Okudum";
    $("readBtn").disabled = s.readToday;
    const staleN = b.sources.filter((x) => x.stale).length;
    put($("dayFresh"), staleN ? badge(staleN + " takvim eskimiş", "warning") : badge("Veri güncel", "success"));
    $("evCount").textContent = String(b.events.length);
    $("busyInfo").textContent = b.busyMin ? "çalışma saatlerinde " + b.busyMin + " dk dolu" : "";
    const tl = $("timeline");
    if (!b.events.length) put(tl, el("li", { class: "db-empty", text: "Bugün takvimde etkinlik yok. Takvimler bölümünden takvim ekleyebilirsiniz." }));
    else put(tl, ...b.events.map((e) => {
      const past = !e.allDay && e.end <= now, live = !e.allDay && e.start <= now && e.end > now;
      const flagged = s.flagged.includes(e.key);
      return el("li", { class: "db-ev" + (past ? " is-past" : "") + (live ? " is-live" : "") + (e.stale ? " is-stale" : ""), "data-key": e.key },
        el("span", { class: "db-ev__time pl-num", text: e.allDay ? "tüm gün" : C.clock(e.start) + "–" + C.clock(e.end) }),
        el("div", { class: "db-ev__main" }, el("b", { text: e.title }), el("span", { class: "pl-muted", text: [e.source, e.location].filter(Boolean).join(" · ") })),
        live ? badge("şimdi", "accent") : null, e.stale ? badge("eskimiş", "warning") : null, flagged ? badge("yanlış işaretlendi", "danger") : null,
        flagged ? null : iconBtn("flag", "Yanlış ya da eskimiş olarak işaretle (ölçü; takvim değişmez)", async () => { await D.flagEvent(e.key); toast("İşaretlendi: yanlış/eskimiş ölçüsüne eklendi."); }));
    }));
    $("conflictCard").hidden = !b.conflicts.length;
    $("confCount").textContent = String(b.conflicts.length);
    put($("conflicts"), ...b.conflicts.map((c) => el("li", {}, el("span", { text: c.text }), el("span", { class: "pl-muted db-small", text: c.tip }))));

    const tasks = [...b.overdue, ...b.dueToday, ...b.doneToday];
    $("dueCount").textContent = String(b.overdue.length + b.dueToday.length);
    if (!tasks.length) put($("todayTasks"), el("li", { class: "db-empty", text: "Bugüne görev yok. Yukarıdan hızlıca ekleyin." }));
    else put($("todayTasks"), ...tasks.map((t) => taskRow(t, b.date)));

    $("planInfo").textContent = b.plan.length ? "Kural tabanlı öneri: gecikmiş ve bugünkü görevler, yüksek öncelikli tarihsizler, çalışma saatleri (" + s.settings.workStart + "–" + s.settings.workEnd + ") içindeki boş aralıklara yerleştirildi." : b.slots.length ? "Yerleştirilecek görev yok. Boş aralıklar: " + b.slots.map((x) => C.clock(x.start) + "–" + C.clock(x.end)).join(", ") : "Bugün çalışma saatlerinde boş aralık kalmadı.";
    put($("plan"), ...b.plan.map((p) => el("li", { class: "db-plan__row" + (p.fixed ? " is-fixed" : "") }, el("span", { class: "pl-num db-plan__time", text: C.clock(p.start) + "–" + C.clock(p.end) }), el("span", { class: "db-grow", text: p.title }), badge(p.why))),
      ...b.unplaced.map((u) => el("li", { class: "db-plan__row is-out" }, el("span", { class: "pl-num db-plan__time", text: "—" }), el("span", { class: "db-grow", text: u.title + " (" + u.durationMin + " dk)" }), badge("sığmadı", "warning"))));
    const ai = state.ai;
    $("aiPlan").hidden = !ai;
    if (ai) put($("aiPlan"),
      el("div", { class: "db-ai__head" }, icon("spark"), el("b", { text: "MyMind planı (öneri)" }), el("span", { class: "pl-muted", text: ai.rejected ? ai.rejected + " adım doğrulamadan geçmedi" : "" })),
      el("ol", { class: "db-plan" }, ...ai.plan.map((p) => el("li", { class: "db-plan__row" }, el("span", { class: "pl-num db-plan__time", text: p.from + "–" + p.to }), el("span", { class: "db-grow", text: p.text })))),
      ai.note ? el("p", { class: "db-small", text: ai.note }) : null,
      el("div", { class: "db-bar" }, el("span", { class: "pl-muted db-small db-grow", text: "Plan yalnız gösterilir; takvim ve görevler değiştirilmez." }), btn("Kapat", "pl-btn--ghost pl-btn--sm", () => { state.ai = null; render(); }, { id: "aiClose" })));
    put($("srcMini"), ...b.sources.filter((x) => x.enabled).map((x) => el("li", { class: x.stale ? "is-stale" : "" },
      el("span", { class: "db-grow" }, el("b", { text: x.name }), el("span", { class: "pl-muted", text: " · " + KIND[x.kind] + " · " + x.link })),
      el("span", { class: "pl-muted db-small", text: x.kind === "local" ? x.today + " bugün" : (x.kind === "url" ? "alındı " : "içe aktarıldı ") + C.ago(x.lastFetched, now) }),
      x.stale ? badge("eskimiş", "warning") : null, x.lastError ? badge("hata", "danger") : null)));
  }

  // ---- Görevler ----
  function renderTasks() {
    const s = state.s, b = s.brief, today = b.date;
    const open = s.tasks.filter((t) => !t.done);
    const vt = (t) => ({ ...t, title: s.settings.hideSensitive && C.isSensitive(t, s.settings) ? "Özel görev" : t.title, sensitive: C.isSensitive(t, s.settings) });
    const groups = [
      ["Gecikmiş", open.filter((t) => t.due && t.due < today)], ["Bugün", open.filter((t) => t.due === today)],
      ["Yaklaşan", open.filter((t) => t.due && t.due > today).sort((a, c) => a.due.localeCompare(c.due))], ["Tarihsiz", open.filter((t) => !t.due).sort((a, c) => a.priority - c.priority)],
    ].filter((g) => g[1].length);
    $("openInfo").textContent = open.length + " açık görev";
    if (!groups.length) put($("taskGroups"), el("p", { class: "db-empty", text: "Açık görev yok." }));
    else put($("taskGroups"), ...groups.map(([name, list]) => el("div", { class: "db-group" }, el("h3", { class: "db-sub", text: name + " (" + list.length + ")" }), el("ul", { class: "db-tasks" }, ...list.map((t) => taskRow(vt(t), today))))));
    const done = s.tasks.filter((t) => t.done).sort((a, c) => (c.doneAt || 0) - (a.doneAt || 0)).slice(0, 30);
    if (!done.length) put($("doneTasks"), el("li", { class: "db-empty", text: "Tamamlanan görev yok." }));
    else put($("doneTasks"), ...done.map((t) => taskRow(vt(t), today)));
  }

  // ---- Takvimler ----
  function renderCalendars() {
    const s = state.s, now = s.now;
    const upcoming = s.localEvents.filter((e) => e.end > C.dayStart(now) || e.rule).slice(0, 30);
    if (!upcoming.length) put($("localEvents"), el("li", { class: "db-empty", text: "Yerel etkinlik yok." }));
    else put($("localEvents"), ...upcoming.map((e) => el("li", {},
      el("span", { class: "pl-num db-ev__time", text: new Date(e.start).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }) + " " + (e.allDay ? "tüm gün" : C.clock(e.start) + "–" + C.clock(e.end)) }),
      el("span", { class: "db-grow", text: (s.settings.hideSensitive && C.isSensitive(e, s.settings) ? "Özel etkinlik" : e.title) + (e.location ? " · " + e.location : "") }),
      e.sensitive ? el("span", { class: "db-lock", title: "Hassas" }, icon("lock")) : null,
      iconBtn("x", "Etkinliği sil", () => D.removeEvent(e.id)))));
    put($("sources"), ...s.sources.map((x) => {
      const f = s.brief.sources.find((y) => y.id === x.id) || {};
      const head = el("div", { class: "db-src__head" },
        el("div", { class: "db-src__name" }, el("b", { text: x.name }), el("span", { class: "pl-muted", text: KIND[x.kind] + " · " + x.link })),
        el("span", { class: "db-grow" }),
        x.fetching ? badge("okunuyor…", "info") : f.stale ? badge("eskimiş", "warning") : x.enabled ? badge("açık", "success") : badge("kapalı"),
        x.lastError ? badge("hata", "danger") : null);
      const meta = el("p", { class: "pl-muted db-small", text: x.count + " etkinlik · bugün " + (f.today || 0) + (x.kind === "url" ? " · son okuma " + C.ago(x.lastFetched, now) + " · her " + (x.refreshMin >= 60 ? x.refreshMin / 60 + " sa" : x.refreshMin + " dk") : x.kind === "file" ? " · içe aktarıldı " + C.ago(x.lastFetched, now) : "") + (x.tzUnknown ? " · " + x.tzUnknown + " saat dilimi tanınmadı (yerel saat sayıldı)" : "") });
      const tools = el("div", { class: "db-bar" });
      const en = el("label", { class: "db-check" }, el("input", { type: "checkbox", checked: x.enabled }), "Özette göster");
      en.querySelector("input").addEventListener("change", guard((ev) => D.setSource(x.id, { enabled: ev.target.checked })));
      const ha = el("label", { class: "db-check" }, el("input", { type: "checkbox", checked: x.hideAll }), "Tüm başlıkları hassas say");
      ha.querySelector("input").addEventListener("change", guard((ev) => D.setSource(x.id, { hideAll: ev.target.checked })));
      tools.append(en, ha);
      if (x.kind === "url") {
        const sel = el("select", { class: "pl-input db-select", "aria-label": "Yenileme sıklığı" }, ...C.REFRESH_CHOICES.map((m) => el("option", { value: String(m), text: m >= 60 ? "her " + m / 60 + " sa" : "her " + m + " dk" })));
        sel.value = String(x.refreshMin);
        sel.addEventListener("change", guard(() => D.setSource(x.id, { refreshMin: Number(sel.value) })));
        tools.append(sel);
      }
      tools.append(el("span", { class: "db-grow" }));
      if (x.kind !== "local") {
        tools.append(btn(x.kind === "url" ? "Şimdi yenile" : "Dosyayı güncelle", "pl-btn--secondary pl-btn--sm", async () => { busy("Takvim okunuyor…"); const r = await D.refreshSource(x.id); busy(null); if (!r.cancelled) toast(r.events + " etkinlik okundu."); }, { "data-refresh": x.id }, "refresh"));
        tools.append(btn("Kaldır", "pl-btn--ghost pl-btn--sm", async () => { if (!window.confirm("“" + x.name + "” takvimi kaldırılsın mı? Takvimin kendisi değişmez; yalnız Daily Brief'ten çıkar.")) return; await D.removeSource(x.id); toast("Takvim kaldırıldı."); }));
      }
      return el("div", { class: "db-src" + (f.stale ? " is-stale" : ""), "data-src": x.id }, head, meta, x.lastError ? el("p", { class: "db-small db-err", text: x.lastError }) : null, tools);
    }));
  }

  // ---- Ayarlar ----
  function renderSettings() {
    const S = state.s.settings;
    const set = (id, v) => { if (document.activeElement !== $(id)) $(id).value = v; };
    set("sStart", S.workStart); set("sEnd", S.workEnd); set("sBrief", S.briefTime); set("sDur", S.defaultTaskMin); set("sWords", S.sensitiveWords.join(", "));
    $("sNotify").checked = S.notify; $("sWidget").checked = S.widgetOnStart; $("sMotion").checked = S.reduceMotion; $("sHide").checked = S.hideSensitive;
    const st = state.s.stats;
    const pct = (v) => (v == null ? "—" : "%" + Math.round(v * 1000) / 10);
    put($("metrics"),
      el("div", {}, el("b", { class: st.readRate != null && st.readRate >= st.readGoal ? "is-ok" : "", text: pct(st.readRate) }), el("span", { text: "sabah özeti okuma (" + st.read + "/" + st.shown + " gün) · hedef ≥%60" })),
      el("div", {}, el("b", { class: st.badRate != null && st.badRate < st.badGoal ? "is-ok" : st.badRate != null ? "is-bad" : "", text: pct(st.badRate) }), el("span", { text: "yanlış/eskimiş etkinlik (" + st.bad + "/" + st.events + ") · hedef <%1" })),
      el("div", {}, el("b", { text: String(st.flagged) }), el("span", { text: "sizin işaretlediğiniz yanlış etkinlik" })));
    put($("privacy"), ...[
      "Takvimler yalnız okunur: Daily Brief hiçbir etkinliği oluşturmaz, değiştirmez ya da silmez; çakışmalar ve plan yalnız öneridir.",
      "Abonelik adresinden okuma yalnız sizin eklediğiniz ve onayladığınız https adreslerine, salt-okur GET isteğiyle yapılır; çerez ve hesap bilgisi gönderilmez. Adres Windows kasasında şifreli durur, yedeğe yazılmaz, arayüzde yalnız alan adı görünür.",
      "Hesap girişi (Google/Microsoft OAuth) 0.1.0'da yok; gizli iCal adresi ya da .ics dosyası kullanılır. Sağlık ve finans verisi kaynakları ilk sürümün dışında.",
      "Görevler, yerel etkinlikler ve ölçüler bu bilgisayarda (%APPDATA%\\Daily Brief Widget), kasa varsa şifreli tutulur.",
      "MyMind isteğe bağlıdır; her istekte neyin gideceği gösterilir ve onay istenir. Hassas başlıklar her zaman “Özel …” olarak gider; yer, takvim adı/adresi ve notlar gönderilmez.",
    ].map((t) => el("li", { text: t })));
  }

  function render() {
    const s = state.s;
    if (!s) return;
    const b = s.brief;
    $("todayCount").textContent = String(b.events.length + b.dueToday.length + b.overdue.length);
    $("tasksCount").textContent = String(s.tasks.filter((t) => !t.done).length);
    $("calCount").textContent = String(s.sources.length);
    $("hideState").textContent = s.settings.hideSensitive ? "Açık" : "Kapalı";
    $("hideState").className = "pl-badge" + (s.settings.hideSensitive ? " pl-badge--accent" : "");
    $("widgetState").textContent = s.widget ? "Açık" : "Gizli";
    $("widgetState").className = "pl-badge" + (s.widget ? " pl-badge--success" : "");
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    $("root").classList.toggle("db-reduce", !!s.settings.reduceMotion);
    const n = b.next;
    put($("sideNext"), n ? el("div", { class: "db-mini__in" }, el("span", { class: "pl-muted db-small", text: n.start <= s.now ? "Şimdi" : "Sıradaki · " + C.until(n.start, s.now) }), el("b", { text: n.title }), el("span", { class: "pl-num pl-muted db-small", text: C.clock(n.start) + "–" + C.clock(n.end) })) : el("span", { class: "pl-muted db-small", text: "Bugün başka etkinlik yok" }));
    $("foot").textContent = (s.vault ? "Kayıtlar bu bilgisayarda, Windows kasasıyla (DPAPI) şifreli tutulur." : "Kasa yok: kayıtlar bu bilgisayarda düz JSON olarak tutulur.") + " Daily Brief takvimlerinizi yalnız okur; hiçbir etkinliği değiştirmez.";
    if (state.view === "today") renderToday();
    else if (state.view === "tasks") renderTasks();
    else if (state.view === "calendars") renderCalendars();
    else renderSettings();
  }

  // ---- Olaylar ----
  for (const b of document.querySelectorAll("[data-nav]")) b.addEventListener("click", () => setView(b.dataset.nav));
  $("readBtn").addEventListener("click", guard(async () => { await D.markRead(); toast("Bugünün özeti okundu olarak işaretlendi."); }));
  $("quickForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    await D.addTask({ title: $("quickTask").value, due: state.s.brief.date });
    $("quickTask").value = "";
    toast("Bugüne görev eklendi.");
  }));
  $("taskForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    await D.addTask({ title: $("tTitle").value, due: $("tDue").value, time: $("tTime").value, durationMin: Number($("tDur").value), priority: Number($("tPri").value), sensitive: $("tSens").checked });
    $("tTitle").value = ""; $("tTime").value = ""; $("tSens").checked = false;
    toast("Görev eklendi.");
  }));
  $("clearDone").addEventListener("click", guard(async () => { const r = await D.clearDone(); toast(r.removed + " tamamlanan görev temizlendi."); }));
  $("planBtn").addEventListener("click", guard(async () => {
    busy("MyMind günü planlıyor…");
    const r = await D.mymind.plan();
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    if (!r.ok) return toast(r.error, true);
    state.ai = r;
    render();
  }));
  $("urlForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    busy("Takvim okunuyor…");
    const r = await D.addIcsUrl($("icsUrl").value, $("icsName").value);
    busy(null);
    if (!r.approved) return toast("Eklenmedi.");
    $("icsUrl").value = ""; $("icsName").value = "";
    if (r.error) toast("Takvim eklendi ama okunamadı: " + r.error, true);
    else toast("Takvim eklendi: " + r.events + " etkinlik okundu" + (r.tzUnknown ? " (" + r.tzUnknown + " saat dilimi tanınmadı)" : "") + ".");
  }));
  $("icsFile").addEventListener("click", guard(async () => {
    const r = await D.addIcsFile();
    if (r.cancelled) return;
    toast("“" + r.name + "” içe aktarıldı: " + r.events + " etkinlik" + (r.cancelled_events ? ", " + r.cancelled_events + " iptal edilmiş atlandı" : "") + (r.unsupported ? ", " + r.unsupported + " tekrar kuralı kısmen desteklendi" : "") + ".");
  }));
  $("eAll").addEventListener("change", () => { $("eFrom").disabled = $("eTo").disabled = $("eAll").checked; });
  $("eventForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    await D.addEvent({ title: $("eTitle").value, date: $("eDate").value, from: $("eFrom").value, to: $("eTo").value, allDay: $("eAll").checked, location: $("eLoc").value, sensitive: $("eSens").checked });
    $("eTitle").value = ""; $("eLoc").value = ""; $("eSens").checked = false;
    toast("Etkinlik eklendi.");
  }));
  const settingInputs = { sStart: "workStart", sEnd: "workEnd", sBrief: "briefTime", sDur: "defaultTaskMin", sWords: "sensitiveWords" };
  for (const [id, k] of Object.entries(settingInputs)) $(id).addEventListener("change", guard(async () => { await D.setSettings({ [k]: id === "sDur" ? Number($(id).value) : $(id).value }); toast("Ayar kaydedildi."); }));
  const checks = { sNotify: "notify", sWidget: "widgetOnStart", sMotion: "reduceMotion", sHide: "hideSensitive" };
  for (const [id, k] of Object.entries(checks)) $(id).addEventListener("change", guard(() => D.setSettings({ [k]: $(id).checked })));
  $("hideBtn").addEventListener("click", guard(async () => { await D.setSettings({ hideSensitive: !state.s.settings.hideSensitive }); toast(state.s.settings.hideSensitive ? "Hassas başlıklar gizlendi." : "Hassas başlıklar gösteriliyor."); }));
  $("widgetBtn").addEventListener("click", guard(() => D.showWidget(!state.s.widget)));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.exportData(); if (!r.cancelled) toast(r.tasks + " görev ve " + r.events + " yerel etkinlik dışa aktarıldı."); }));
  $("importBtn").addEventListener("click", guard(async () => { const r = await D.importData(); if (!r.cancelled) toast(r.tasks + " görev, " + r.events + " etkinlik içe aktarıldı" + (r.skipped ? ", " + r.skipped + " görev zaten vardı" : "") + "."); }));
  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Bağlı: anahtar " + (state.s.vault ? "Windows kasasında." : "yalnız bu oturumda (kasa yok).") : "Anahtar girilmedi; MyMind planı kapalı.";
    $("mymindDialog").showModal();
  });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.mymind.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için tutuluyor (kasa yok)."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));
  // Klavye: Ctrl+1..4 bölümler, Ctrl+H gizleme kipi, Ctrl+N bugüne görev, Ctrl+W widget.
  document.addEventListener("keydown", guard(async (e) => {
    if (document.querySelector("dialog[open]") || !e.ctrlKey) return;
    if (/^[1-4]$/.test(e.key)) { e.preventDefault(); setView(VIEWS[Number(e.key) - 1]); }
    else if (e.key.toLowerCase() === "h") { e.preventDefault(); $("hideBtn").click(); }
    else if (e.key.toLowerCase() === "n") { e.preventDefault(); setView("today"); $("quickTask").focus(); }
    else if (e.key.toLowerCase() === "w") { e.preventDefault(); await D.showWidget(!state.s.widget); }
  }));
  const today = new Date();
  $("eDate").value = C.dateKey(today.getTime());

  D.onState((s) => { state.s = s; render(); });
  D.onNav((v) => setView(v));
  D.state().then((s) => {
    state.s = s;
    $("eDate").value = s.brief.date;
    setView("today");
    document.documentElement.dataset.ready = "1";
  });
})();
