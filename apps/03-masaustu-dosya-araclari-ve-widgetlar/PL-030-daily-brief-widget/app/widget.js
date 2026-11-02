/* Daily Brief — widget: her zaman üstte, sürüklenebilir küçük pencere. Yalnız gösterir; özet ana süreçtedir.
 * Görev işaretleme, gizleme kipi ve "Okudum" buradan da yapılır. Metinler yalnız textContent ile yazılır. */
(function () {
  const C = window.DBCore;
  const D = window.dbDesktop;
  const $ = (id) => document.getElementById(id);
  const EYE = "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
  const EYE_OFF = "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-3.2 3.9M6.6 6.6C3.5 8.5 1 12 1 12s4 7 11 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2";
  let s = null;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { $("warn").hidden = false; $("warn").textContent = clean(e); } };
  function paint() {
    if (!s) return;
    const b = s.brief, now = s.now;
    $("date").textContent = C.longDate(now);
    $("headline").textContent = b.headline;
    $("root").classList.toggle("db-reduce", !!s.settings.reduceMotion);
    $("hideIco").setAttribute("d", s.settings.hideSensitive ? EYE_OFF : EYE);
    $("hide").setAttribute("aria-pressed", s.settings.hideSensitive ? "true" : "false");
    $("hide").title = s.settings.hideSensitive ? "Hassas başlıkları göster" : "Hassas başlıkları gizle";
    const n = b.next, nx = $("next");
    nx.replaceChildren();
    if (n) {
      nx.append(el("span", "dw-next__when", n.start <= now ? "Şimdi · " + C.clock(n.end) + "'e kadar" : C.until(n.start, now) + " · " + C.clock(n.start)), el("b", "dw-next__title", n.title));
      if (n.location) nx.append(el("span", "pl-muted dw-small", n.location));
    } else nx.append(el("span", "pl-muted dw-small", b.events.length ? "Bugünün etkinlikleri bitti." : "Bugün takvimde etkinlik yok."));
    const evs = b.events.filter((e) => e.allDay || e.end > now).slice(0, 5);
    $("events").replaceChildren(...(evs.length ? evs.map((e) => {
      const li = el("li", "dw-ev" + (e.stale ? " is-stale" : "") + (!e.allDay && e.start <= now ? " is-live" : ""));
      li.append(el("span", "pl-num dw-time", e.allDay ? "tüm gün" : C.clock(e.start)), el("span", "dw-title", e.title));
      if (e.stale) li.append(el("span", "pl-badge pl-badge--warning", "eskimiş"));
      return li;
    }) : [el("li", "dw-empty", "Kalan etkinlik yok")]));
    if (b.events.length - evs.length > 0 && evs.length) $("events").append(el("li", "dw-more pl-muted", "+" + (b.events.length - evs.length) + " etkinlik daha (tümü ana pencerede)"));
    const tasks = [...b.overdue, ...b.dueToday].slice(0, 4);
    $("tasks").replaceChildren(...(tasks.length ? tasks.map((t) => {
      const li = el("li", "dw-task" + (t.due && t.due < b.date ? " is-late" : ""));
      const id = "w-" + t.id;
      const cb = el("input"); cb.type = "checkbox"; cb.id = id; cb.setAttribute("aria-label", "Tamamlandı: " + t.title);
      cb.addEventListener("change", guard(() => D.toggleTask(t.id)));
      const lb = el("label", "dw-title", (t.time ? t.time + " " : "") + t.title); lb.htmlFor = id;
      li.append(cb, lb);
      if (t.due && t.due < b.date) li.append(el("span", "pl-badge pl-badge--danger", "gecikmiş"));
      return li;
    }) : [el("li", "dw-empty", "Bugüne görev yok")]));
    const extra = b.overdue.length + b.dueToday.length - tasks.length;
    if (extra > 0) $("tasks").append(el("li", "dw-more pl-muted", "+" + extra + " görev daha"));
    const w = [];
    if (b.conflicts.length) w.push(b.conflicts.length + " çakışma (öneri için ana pencere)");
    const stale = b.sources.filter((x) => x.stale);
    if (stale.length) w.push(stale.map((x) => x.name).join(", ") + ": veri eskimiş");
    $("warn").hidden = !w.length;
    $("warn").textContent = w.join(" · ");
    const urls = b.sources.filter((x) => x.enabled && x.kind === "url");
    $("fresh").textContent = urls.length ? "Veri: " + (b.oldestFetch ? C.clock(b.oldestFetch) + " (" + C.ago(b.oldestFetch, now) + ")" : "henüz alınmadı") : "Yerel veri · " + C.clock(now);
    $("read").textContent = s.readToday ? "Okundu ✓" : "Okudum";
    $("read").disabled = s.readToday;
  }
  $("hide").addEventListener("click", guard(() => D.setSettings({ hideSensitive: !s.settings.hideSensitive })));
  $("open").addEventListener("click", guard(() => D.showMain("today")));
  $("close").addEventListener("click", guard(() => D.showWidget(false)));
  $("read").addEventListener("click", guard(() => D.markRead()));
  D.onState((x) => { s = x; paint(); });
  D.state().then((x) => { s = x; paint(); document.documentElement.dataset.ready = "1"; });
})();
