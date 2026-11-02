/* Focus Orbit — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz ağa ve dosya sistemine erişmez; zamanlayıcı ana süreçtedir, burada yalnız gösterilir. MyMind istekleri ana süreçte onaydan geçer. */
(function () {
  const C = window.FOCore;
  const D = window.foDesktop;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, t: null, view: "focus", aiSteps: null, aiSummary: {}, intSite: "" };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    play: "M7 4v16l13-8z",
    pause: "M7 4h4v16H7zM13 4h4v16h-4z",
    stop: "M6 6h12v12H6z",
    plus: "M12 5v14M5 12h14",
    up: "M18 15l-6-6-6 6",
    down: "M6 9l6 6 6-6",
    x: "M18 6 6 18M6 6l12 12",
    coffee: "M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3",
    zap: "M13 2 3 14h9l-1 8 10-12h-9z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    bubble: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
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
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs, ico) => { const b = el("button", { type: "button", class: "pl-btn " + cls, ...(attrs || {}) }, ico ? icon(ico) : null, text); b.addEventListener("click", guard(onClick)); return b; };
  const iconBtn = (ico, label, onClick, disabled) => { const b = el("button", { type: "button", class: "fo-icon-btn", title: label, "aria-label": label, disabled: !!disabled }, icon(ico)); b.addEventListener("click", guard(onClick)); return b; };
  /** replaceChildren null/false değerleri "null" metni olarak yazar; boşları ayıklar. */
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const PHASE = { idle: "Hazır", focus: "Odak", break: "Mola" };

  // ---- Gezinme ----
  function setView(v) {
    state.view = v;
    for (const id of ["focus", "sites", "history", "settings"]) $("view-" + id).hidden = id !== v;
    for (const b of document.querySelectorAll("[data-nav]")) { const on = b.dataset.nav === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); }
    render();
  }

  // ---- Zamanlayıcı görünümü (her tikte) ----
  function renderTimer() {
    const t = state.t;
    if (!t) return;
    const S = state.s.settings;
    const idle = t.phase === "idle";
    const ms = idle ? S.focusMin * C.MIN : t.remainingMs;
    $("time").textContent = C.fmt(ms);
    $("phase").textContent = idle ? "Hazır" : (t.phase === "break" ? (t.long ? "Uzun mola" : "Mola") : "Odak") + (t.paused ? " · duraklatıldı" : "");
    $("phase").className = "fo-phase fo-phase--" + t.phase + (t.paused ? " is-paused" : "");
    $("timeSub").textContent = idle ? S.focusMin + " dk odak · " + S.breakMin + " dk mola" : C.fmt(t.elapsedMs) + " geçti";
    const frac = idle || !t.durationMs ? 0 : Math.min(1, t.elapsedMs / t.durationMs);
    $("ringFg").style.strokeDashoffset = String(Math.round(1000 * frac));
    $("ring").className = "fo-ring fo-ring--" + t.phase + (t.paused ? " is-paused" : "");
    const side = $("sideTimer");
    side.hidden = idle;
    if (!idle) side.replaceChildren(el("span", { class: "fo-dot fo-dot--" + t.phase, "aria-hidden": "true" }), el("b", { class: "pl-num", text: C.fmt(t.remainingMs) }), el("span", { class: "pl-muted", text: PHASE[t.phase] + (t.paused ? " (durdu)" : "") }));
    document.title = idle ? "Focus Orbit" : C.fmt(t.remainingMs) + " · " + PHASE[t.phase] + " — Focus Orbit";
  }
  function renderControls() {
    const t = state.t;
    const box = $("ctrls");
    const kids = [];
    if (t.phase === "idle") {
      kids.push(btn("Odak seansını başlat", "pl-btn--primary fo-big", () => start(), { id: "startBtn" }, "play"));
      kids.push(btn("Mola ver", "pl-btn--secondary", () => D.startBreak(), { id: "breakBtn" }, "coffee"));
    } else {
      kids.push(t.paused ? btn("Sürdür", "pl-btn--primary", () => D.resume(), { id: "resumeBtn" }, "play") : btn("Duraklat", "pl-btn--secondary", () => D.pause(), { id: "pauseBtn" }, "pause"));
      kids.push(btn("+5 dk", "pl-btn--ghost", () => D.extend(5), { id: "extendBtn" }, "plus"));
      if (t.phase === "focus") kids.push(btn("Dağıldım", "pl-btn--secondary", () => openInterrupt(), { id: "interruptBtn" }, "zap"));
      kids.push(btn(t.phase === "focus" ? "Seansı bitir" : "Molayı geç", "pl-btn--ghost", async () => {
        const wasFocus = t.phase === "focus";
        await D.stop();
        toast(wasFocus ? "Seans erken bitirildi; kayıtlara “erken bitti” olarak işlendi." : "Mola geçildi.");
      }, { id: "stopBtn" }, "stop"));
    }
    box.replaceChildren(...kids);
    const pr = $("presets");
    pr.hidden = t.phase !== "idle";
    if (t.phase === "idle") {
      const S = state.s.settings;
      pr.replaceChildren(...C.PRESETS.map((p) => {
        const on = p.focusMin === S.focusMin && p.breakMin === S.breakMin;
        const b = el("button", { type: "button", class: "fo-chip" + (on ? " is-on" : ""), "aria-pressed": on ? "true" : "false" }, el("b", { text: p.name }), el("span", { text: p.focusMin + "/" + p.breakMin + " dk" }));
        b.addEventListener("click", guard(async () => { await D.setSettings({ focusMin: p.focusMin, breakMin: p.breakMin }); toast(p.name + ": " + p.focusMin + " dk odak, " + p.breakMin + " dk mola."); }));
        return b;
      }));
    }
    const nt = $("nowTask");
    nt.textContent = t.phase === "focus" ? "Şimdi: " + (t.task || "Adsız görev") + (t.interruptions ? " · " + t.interruptions + " kesinti" : "") : t.phase === "break" ? "Ekrandan kalkın, gözlerinizi dinlendirin." : state.s.task.title ? "Sıradaki: " + state.s.task.title : "Bir görev yazın ve başlatın.";
  }
  async function start() {
    const title = $("taskTitle").value;
    if (C.str(title, 120) !== state.s.task.title) await D.setTask(title);
    await D.start();
    toast("Odak seansı başladı: " + state.s.settings.focusMin + " dk.");
  }

  // ---- Görev ve adımlar ----
  function renderTask() {
    const task = state.s.task;
    const inp = $("taskTitle");
    if (document.activeElement !== inp) inp.value = task.title;
    inp.disabled = state.t.phase === "focus";
    $("stepCount").textContent = task.steps.filter((s) => s.done).length + "/" + task.steps.length;
    const ul = $("steps");
    if (!task.steps.length) ul.replaceChildren(el("li", { class: "fo-empty", text: "Adım yok. Büyük görevleri 25 dakikada bitebilecek parçalara bölmek odağı kolaylaştırır." }));
    else ul.replaceChildren(...task.steps.map((s, i) => {
      const cb = el("input", { type: "checkbox", checked: s.done, id: "st-" + s.id });
      cb.addEventListener("change", guard(() => D.toggleStep(s.id)));
      return el("li", { class: "fo-step" + (s.done ? " is-done" : "") }, cb, el("label", { for: "st-" + s.id, text: s.text }), s.ai ? badge("MyMind", "pro") : null,
        el("span", { class: "fo-step__tools" }, iconBtn("up", "Yukarı taşı", () => D.moveStep(s.id, -1), i === 0), iconBtn("down", "Aşağı taşı", () => D.moveStep(s.id, 1), i === task.steps.length - 1), iconBtn("x", "Adımı kaldır", () => D.removeStep(s.id))));
    }));
    const ai = $("aiSteps");
    ai.hidden = !state.aiSteps;
    if (state.aiSteps) {
      const r = state.aiSteps;
      put(ai,
        el("div", { class: "fo-ai__head" }, icon("spark"), el("b", { text: "MyMind önerisi" }), el("span", { class: "pl-muted", text: r.steps.length + " adım" + (r.rejected ? " · " + r.rejected + " öneri doğrulamadan geçmedi" : "") })),
        r.tip ? el("p", { class: "fo-small", text: r.tip }) : null,
        el("ol", { class: "fo-list" }, ...r.steps.map((x) => el("li", { text: x }))),
        el("div", { class: "fo-bar" }, btn("Tümünü ekle", "pl-btn--primary pl-btn--sm", async () => { const res = await D.addSteps(r.steps); state.aiSteps = null; toast(res.added + " adım eklendi."); render(); }, { id: "aiAdd" }), btn("Vazgeç", "pl-btn--ghost pl-btn--sm", () => { state.aiSteps = null; render(); })));
    }
  }

  // ---- Bu hafta ----
  function renderWeek() {
    const w = state.s.stats;
    const max = Math.max(1, ...w.days.map((d) => d.done));
    const dn = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const today = new Date(state.s.now).getDay();
    const ips = w.interruptionsPerSession;
    const trend = w.trend === "down" ? ["azaldı", "success"] : w.trend === "up" ? ["arttı", "warning"] : w.trend === "same" ? ["aynı", ""] : null;
    put($("weekCard"),
      el("div", { class: "fo-bar" }, el("h3", { class: "fo-sub", text: "Bu hafta" }), el("span", { class: "fo-grow" }), badge(w.goalMet ? "Hedef tamam" : "Hedef: " + w.goal + " seans", w.goalMet ? "success" : "")),
      el("div", { class: "fo-metrics" },
        el("div", {}, el("b", { class: "pl-num", text: w.done + "/" + w.goal }), el("span", { text: "tamamlanan seans" })),
        el("div", {}, el("b", { class: "pl-num", text: String(w.focusMin) }), el("span", { text: "dk odak" })),
        el("div", {}, el("b", { class: "pl-num", text: ips == null ? "—" : ips.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) }), el("span", { text: "kesinti / seans" + (trend ? " · geçen haftaya göre " + trend[0] : "") }))),
      el("div", { class: "fo-days", role: "img", "aria-label": "Günlere göre tamamlanan seanslar: " + w.days.map((d, i) => dn[i] + " " + d.done).join(", ") },
        ...w.days.map((d, i) => { const bar = el("i", { class: d.done ? "" : "is-zero" }); bar.style.height = Math.max(4, Math.round((d.done / max) * 100)) + "%"; return el("div", { class: "fo-day" + ((i + 1) % 7 === today ? " is-today" : "") }, el("div", { class: "fo-day__bar" }, bar), el("span", { text: d.done ? dn[i] + " " + d.done : dn[i] })); })),
      w.stopped ? el("p", { class: "pl-muted fo-small", text: w.stopped + " seans erken bitirildi (ölçüye tamamlanan sayılmaz)." }) : null);
  }
  function renderAvoid() {
    const on = state.s.sites.filter((s) => s.on);
    const card = $("avoidCard");
    if (!on.length) { put(card,el("h3", { class: "fo-sub", text: "Dikkat listesi" }), el("p", { class: "pl-muted fo-small", text: "Uzak durmak istediğiniz siteleri ekleyin; seans boyunca burada hatırlatılır." }), btn("Site ekle", "pl-btn--ghost pl-btn--sm", () => setView("sites"))); return; }
    put(card,el("h3", { class: "fo-sub", text: state.t.phase === "focus" ? "Bu seansta uzak durun" : "Dikkat listesi" }), el("div", { class: "fo-chips" }, ...on.map((s) => el("span", { class: "fo-chip is-static", text: s.host }))));
  }

  // ---- Dikkat listesi görünümü ----
  function renderSites() {
    const ul = $("sites");
    const list = state.s.sites;
    if (!list.length) ul.replaceChildren(el("li", { class: "fo-empty", text: "Liste boş." }));
    else ul.replaceChildren(...list.map((s) => {
      const cb = el("input", { type: "checkbox", checked: s.on, id: "site-" + s.host, "aria-label": s.host + " hatırlatmada" });
      cb.addEventListener("change", guard(async () => { await D.toggleSite(s.host); toast(s.host + (s.on ? " hatırlatmadan çıkarıldı (listede duruyor)." : " yeniden açıldı.")); }));
      return el("li", { class: "fo-site" + (s.on ? "" : " is-off") }, cb, el("label", { for: "site-" + s.host, text: s.host }), badge(s.on ? "Açık" : "Kapalı", s.on ? "success" : ""), iconBtn("x", s.host + " listeden çıkar", () => D.removeSite(s.host)));
    }));
    const top = state.s.topSites;
    $("topSites").replaceChildren(...(top.length ? top.map((x) => el("li", {}, el("span", { text: x.host }), el("b", { class: "pl-num", text: x.count + " kez" }))) : [el("li", { class: "fo-empty", text: "Henüz kesinti kaydı yok." })]));
  }

  // ---- Kayıtlar ----
  function renderHistory() {
    const list = state.s.sessions.filter((s) => s.status !== "running");
    $("historyInfo").textContent = list.length ? list.length + " seans · son 200 gösterilir" : "";
    const box = $("sessions");
    if (!list.length) { box.replaceChildren(el("div", { class: "fo-empty", text: "Henüz seans yok. İlk odak seansını başlattığınızda burada görünür." })); return; }
    box.replaceChildren(...list.map((s) => {
      const ai = state.aiSummary[s.id];
      const row = el("article", { class: "fo-session" },
        el("div", { class: "fo-session__main" },
          el("b", { text: s.task }),
          el("span", { class: "pl-muted", text: C.formatWhen(s.startedAt, state.s.now) + " · " + Math.round(s.focusMs / C.MIN) + "/" + s.plannedMin + " dk" + (s.stepsTotal ? " · adım " + s.stepsDone + "/" + s.stepsTotal : "") + " · " + s.interruptions.length + " kesinti" }),
          s.summary ? el("p", { class: "fo-summary", text: s.summary }) : null),
        badge(s.status === "done" ? "Tamamlandı" : "Erken bitti", s.status === "done" ? "success" : "warning"),
        btn(s.summary ? "Yeniden özetle" : "MyMind özeti", "pl-btn--ghost pl-btn--sm", () => summarize(s.id), { "data-sum": s.id }, "spark"));
      if (!ai) return row;
      return el("div", { class: "fo-session-wrap" }, row, el("div", { class: "fo-ai" },
        el("div", { class: "fo-ai__head" }, icon("spark"), el("b", { text: "MyMind özeti (kaydedilmedi)" })),
        el("p", { class: "fo-small", text: ai.summary }), ai.next ? el("p", { class: "fo-small", text: "Sonraki adım: " + ai.next }) : null,
        el("div", { class: "fo-bar" }, btn("Seansa kaydet", "pl-btn--primary pl-btn--sm", async () => { await D.saveSummary(s.id, ai.summary + (ai.next ? " Sonraki: " + ai.next : "")); delete state.aiSummary[s.id]; toast("Özet seansa kaydedildi."); render(); }, { "data-save": s.id }),
          ai.next ? btn("Sonraki adımı göreve ekle", "pl-btn--ghost pl-btn--sm", async () => { await D.addStep(ai.next); toast("Adım eklendi."); }) : null,
          btn("Vazgeç", "pl-btn--ghost pl-btn--sm", () => { delete state.aiSummary[s.id]; render(); }))));
    }));
  }
  async function summarize(id) {
    busy("MyMind özetliyor…");
    const r = await D.mymind.summary(id);
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    if (!r.ok) return toast(r.error, true);
    state.aiSummary[id] = r;
    render();
  }

  // ---- Ayarlar ----
  function renderSettings() {
    const S = state.s.settings;
    const map = { setFocus: "focusMin", setBreak: "breakMin", setLong: "longBreakMin", setEvery: "longEvery", setGoal: "weeklyGoal" };
    for (const [id, k] of Object.entries(map)) if (document.activeElement !== $(id)) $(id).value = String(S[k]);
    $("setAutoBreak").checked = S.autoBreak; $("setBubble").checked = S.bubbleOnStart; $("setNotify").checked = S.notify; $("setMotion").checked = S.reduceMotion;
    $("privacy").replaceChildren(...[
      "Görev, adımlar, seans kayıtları ve dikkat listesi yalnız bu bilgisayarda tutulur" + (state.s.vault ? " (Windows kasası, DPAPI ile şifreli)." : " (bu sistemde kasa yok; düz JSON)."),
      "Ekran, pencereler, tarayıcı ya da uygulamalar izlenmez. Dikkat kesintisi yalnız sizin \"Dağıldım\" bildiriminizle kaydedilir.",
      "Focus Orbit hiçbir uygulamayı, pencereyi ya da sekmeyi kapatmaz; siteleri engellemez (0.1.0). Dikkat listesi bir hatırlatmadır ve tek tıkla kapatılabilir.",
      "Ağ yalnız isteğe bağlı MyMind için ve yalnız bu bilgisayardaki PluginLabs Hub'a (127.0.0.1:47632) gider; her istekte neyin gönderileceği onay penceresinde gösterilir.",
      "Odak balonu her zaman üstte durur ve sürüklenebilir; konumu hatırlanır. Kapatmak zamanlayıcıyı durdurmaz.",
    ].map((t) => el("li", { text: t })));
  }

  function render() {
    if (!state.s) return;
    const s = state.s;
    $("sitesCount").textContent = String(s.sites.filter((x) => x.on).length);
    $("historyCount").textContent = String(s.sessions.filter((x) => x.status !== "running").length);
    $("bubbleState").textContent = s.bubble ? "Açık" : "Gizli";
    $("bubbleState").className = "pl-badge" + (s.bubble ? " pl-badge--success" : "");
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    $("root").classList.toggle("fo-reduce", !!s.settings.reduceMotion);
    $("foot").textContent = s.vault ? "Kayıtlar bu bilgisayarda, Windows kasasıyla (DPAPI) şifreli tutulur. Focus Orbit ekranı izlemez, hiçbir uygulamayı ya da sekmeyi kapatmaz." : "Kayıtlar bu bilgisayarda tutulur (kasa yok: düz JSON). Focus Orbit ekranı izlemez, hiçbir uygulamayı ya da sekmeyi kapatmaz.";
    renderTimer();
    if (state.view === "focus") { renderControls(); renderTask(); renderWeek(); renderAvoid(); }
    else if (state.view === "sites") renderSites();
    else if (state.view === "history") renderHistory();
    else renderSettings();
  }

  // ---- Dağıldım ----
  function openInterrupt() {
    state.intSite = "";
    const chips = [{ host: "", label: "Site değil" }].concat(state.s.sites.filter((s) => s.on).map((s) => ({ host: s.host, label: s.host })));
    const box = $("intSites");
    const paint = () => box.querySelectorAll(".fo-chip").forEach((c) => { const on = c.dataset.host === state.intSite; c.classList.toggle("is-on", on); c.setAttribute("aria-checked", on ? "true" : "false"); });
    box.replaceChildren(...chips.map((c) => { const b = el("button", { type: "button", class: "fo-chip", role: "radio", "data-host": c.host, text: c.label }); b.addEventListener("click", () => { state.intSite = c.host; paint(); }); return b; }));
    paint();
    $("intNote").value = "";
    $("intDialog").showModal();
  }
  $("intCancel").addEventListener("click", () => $("intDialog").close());
  $("intOk").addEventListener("click", guard(async () => {
    const r = await D.interrupt(state.intSite, $("intNote").value);
    $("intDialog").close();
    toast("Kesinti kaydedildi (bu seansta " + r.count + "). Odağa dönün — sayaç sürüyor.");
  }));

  // ---- Olaylar ----
  for (const b of document.querySelectorAll("[data-nav]")) b.addEventListener("click", () => setView(b.dataset.nav));
  $("taskTitle").addEventListener("change", guard(() => D.setTask($("taskTitle").value)));
  $("taskTitle").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("taskTitle").blur(); } });
  $("stepForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    if (C.str($("taskTitle").value, 120) !== state.s.task.title) await D.setTask($("taskTitle").value);
    await D.addStep($("stepInput").value);
    $("stepInput").value = "";
  }));
  $("splitBtn").addEventListener("click", guard(async () => {
    if (C.str($("taskTitle").value, 120) !== state.s.task.title) await D.setTask($("taskTitle").value);
    busy("MyMind görevi parçalıyor…");
    const r = await D.mymind.split();
    busy(null);
    if (!r.approved) return toast("Gönderilmedi.");
    if (!r.ok) return toast(r.error, true);
    if (!r.steps.length) return toast("MyMind geçerli adım önermedi.", true);
    state.aiSteps = r;
    render();
  }));
  $("siteForm").addEventListener("submit", guard(async (e) => {
    e.preventDefault();
    const r = await D.addSites($("siteInput").value);
    $("siteInput").value = "";
    toast(r.added ? r.added + " site eklendi." : "Bu siteler zaten listede.");
  }));
  $("bubbleBtn").addEventListener("click", guard(() => D.showBubble(!state.s.bubble)));
  const num = { setFocus: "focusMin", setBreak: "breakMin", setLong: "longBreakMin", setEvery: "longEvery", setGoal: "weeklyGoal" };
  for (const [id, k] of Object.entries(num)) $(id).addEventListener("change", guard(async () => { await D.setSettings({ [k]: Number($(id).value) }); toast("Ayar kaydedildi."); }));
  const chk = { setAutoBreak: "autoBreak", setBubble: "bubbleOnStart", setNotify: "notify", setMotion: "reduceMotion" };
  for (const [id, k] of Object.entries(chk)) $(id).addEventListener("change", guard(() => D.setSettings({ [k]: $(id).checked })));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.exportData(); if (!r.cancelled) toast(r.count + " seans dışa aktarıldı."); }));
  $("importBtn").addEventListener("click", guard(async () => { const r = await D.importData(); if (!r.cancelled) toast(r.added + " seans içe aktarıldı" + (r.skipped ? ", " + r.skipped + " zaten vardı" : "") + "."); }));
  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Bağlı: anahtar " + (state.s.vault ? "Windows kasasında." : "yalnız bu oturumda (kasa yok).") : "Anahtar girilmedi; MyMind özellikleri kapalı.";
    $("mymindDialog").showModal();
  });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.mymind.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "Anahtar Windows kasasına kaydedildi." : "Anahtar yalnız bu oturum için tutuluyor (kasa yok)."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));
  // Klavye: Ctrl+Enter başlat/duraklat-sürdür, Ctrl+1..4 bölümler. Yazı alanlarında boşluk tuşu engellenmez.
  document.addEventListener("keydown", guard(async (e) => {
    if (document.querySelector("dialog[open]")) return;
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      const t = state.t;
      if (t.phase === "idle") await start();
      else if (t.paused) await D.resume();
      else await D.pause();
    } else if (e.ctrlKey && /^[1-4]$/.test(e.key)) { e.preventDefault(); setView(["focus", "sites", "history", "settings"][Number(e.key) - 1]); }
  }));

  D.onState((s) => { state.s = s; state.t = s.timer; render(); });
  D.onTick((t) => { const phaseChanged = !state.t || state.t.phase !== t.phase || state.t.paused !== t.paused; state.t = t; if (phaseChanged) render(); else renderTimer(); });
  D.state().then((s) => {
    state.s = s;
    state.t = s.timer;
    setView("focus");
    document.documentElement.dataset.ready = "1";
  });
})();
