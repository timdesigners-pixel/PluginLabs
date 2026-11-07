/* Action Inbox görev kutusu (widget): gecikmiş, bugünkü ve yaklaşan açık görevler; işaretleyince tamamlanır. Metin yalnız textContent ile yazılır. */
(function () {
  const D = window.axDesktop;
  const C = window.AXCore;
  const $ = (id) => document.getElementById(id);
  const TONE = { gecikmis: "danger", bugun: "warning", hafta: "accent", sonra: "", tarihsiz: "" };
  let s = null;
  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v); }
    for (const kid of kids) if (kid) e.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    return e;
  }
  function toast(msg, err) {
    const t = el("div", { class: "pl-toast", role: err ? "alert" : "status" }, el("div", { class: "pl-toast__body", text: msg }));
    if (err) t.style.setProperty("--pl-c", "var(--pl-danger)");
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), 4000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(clean(e), true); } };
  const day = (d) => { const x = new Date(d + "T00:00:00"); return isNaN(x) ? "" : x.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); };
  function render() {
    if (!s) return;
    const open = C.sortTasks(s.items.filter((x) => x.status === "acik"), s.now);
    const m = s.metrics;
    $("wInfo").textContent = m.open + " açık · " + m.overdue + " gecikmiş · bu hafta " + m.doneThisWeek + " tamamlandı";
    $("wReview").textContent = m.review + " aday";
    $("wReview").className = "pl-badge" + (m.review ? " pl-badge--warning" : "");
    const rows = open.slice(0, 12).map((x) => {
      const b = C.bucketOf(x, s.now);
      const box = el("input", { type: "checkbox", "aria-label": "Tamamla: " + x.title });
      box.addEventListener("change", guard(async () => { await D.item.done(x.id, true); toast("Tamamlandı: " + x.title); }));
      const title = el("button", { type: "button", class: "axw-title", text: x.title, title: "Ana pencerede aç" });
      title.addEventListener("click", guard(() => D.widget.focusApp(x.id)));
      const meta = el("div", { class: "axw-meta" });
      if (x.due) meta.appendChild(el("span", { class: "pl-badge" + (TONE[b] ? " pl-badge--" + TONE[b] : ""), text: (b === "gecikmis" ? "Gecikmiş · " : b === "bugun" ? "Bugün · " : "") + day(x.due) }));
      if (x.assignee) meta.appendChild(el("span", { class: "pl-badge" + (x.assigneeConfirmed ? "" : " pl-badge--warning"), text: (x.assigneeConfirmed ? "" : "taslak: ") + x.assignee }));
      if (x.sources[0]) meta.appendChild(el("span", { class: "pl-badge", text: C.SOURCE_NAMES[x.sources[0].type] || "Kaynak" }));
      return el("li", { class: "axw-item" }, box, el("div", { class: "axw-item__body" }, title, meta));
    });
    if (!rows.length) rows.push(el("li", { class: "ax-empty", text: "Açık görev yok." }));
    if (open.length > 12) rows.push(el("li", { class: "ax-empty", text: "+" + (open.length - 12) + " görev daha — ana pencerede." }));
    $("wList").replaceChildren(...rows);
  }
  $("wOpen").addEventListener("click", guard(() => D.widget.focusApp(null)));
  $("wClip").addEventListener("click", guard(async () => { const r = await D.capture.clipboard(); toast(r.added + " aday inceleme kuyruğuna eklendi" + (r.dups ? " (" + r.dups + " olası yineleme)" : "") + "."); }));
  D.onState((v) => { s = v; render(); });
  D.state().then((v) => { s = v; render(); document.documentElement.dataset.ready = "1"; });
})();
