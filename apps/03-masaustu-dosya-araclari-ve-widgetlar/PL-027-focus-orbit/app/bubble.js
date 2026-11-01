/* Focus Orbit — odak balonu: her zaman üstte, sürüklenebilir küçük pencere. Yalnız gösterir; zamanlayıcı ana süreçtedir.
 * "Dağıldım" burada notsuz/sitesiz hızlı kayıt yapar (ayrıntı ana pencerede). Metinler yalnız textContent ile yazılır. */
(function () {
  const C = window.FOCore;
  const D = window.foDesktop;
  const $ = (id) => document.getElementById(id);
  let s = null, t = null, noteTimer = null;
  const PAUSE = "M7 4h4v16H7zM13 4h4v16h-4z", PLAY = "M7 4v16l13-8z";
  function note(text) { $("note").textContent = text; clearTimeout(noteTimer); noteTimer = setTimeout(() => ($("note").textContent = ""), 3500); }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async () => { try { await fn(); } catch (e) { note(clean(e)); } };
  function paint() {
    if (!s || !t) return;
    const idle = t.phase === "idle";
    $("time").textContent = idle ? C.fmt(s.settings.focusMin * C.MIN) : C.fmt(t.remainingMs);
    $("phase").textContent = idle ? "Hazır" : (t.phase === "break" ? "Mola" : "Odak") + (t.paused ? " · durdu" : "");
    $("task").textContent = t.phase === "focus" ? t.task || "Adsız görev" : t.phase === "break" ? "Ekrandan kalkın, gözlerinizi dinlendirin" : s.task.title ? "Sıradaki: " + s.task.title : "Ana pencereden görev yazıp başlatın";
    $("root").className = "fb fb--" + t.phase + (t.paused ? " is-paused" : "") + (s.settings.reduceMotion ? " fo-reduce" : "");
    const frac = idle || !t.durationMs ? 0 : Math.min(1, t.elapsedMs / t.durationMs);
    $("ringFg").style.strokeDashoffset = String(Math.round(1000 * frac));
    $("toggleIco").setAttribute("d", idle || t.paused ? PLAY : PAUSE);
    const label = idle ? "Odak seansını başlat" : t.paused ? "Sürdür" : "Duraklat";
    $("toggle").title = label; $("toggle").setAttribute("aria-label", label);
    $("interrupt").disabled = t.phase !== "focus";
  }
  $("toggle").addEventListener("click", guard(async () => {
    if (t.phase === "idle") { await D.start(); note("Odak başladı."); }
    else if (t.paused) await D.resume();
    else await D.pause();
  }));
  $("interrupt").addEventListener("click", guard(async () => { const r = await D.interrupt("", ""); note("Kesinti kaydedildi (" + r.count + "). Odağa dönün."); }));
  $("open").addEventListener("click", guard(() => D.showMain()));
  $("hide").addEventListener("click", guard(() => D.showBubble(false)));
  D.onState((x) => { s = x; t = x.timer; paint(); });
  D.onTick((x) => { t = x; paint(); });
  D.state().then((x) => { s = x; t = x.timer; paint(); document.documentElement.dataset.ready = "1"; });
})();
