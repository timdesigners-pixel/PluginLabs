/* Seçim katmanı: fareyle sürükleyerek dikdörtgen seçilir; bırakınca seçim ana sürece (DIP koordinatı) gönderilir.
 * Esc vazgeçer; Ctrl+A tüm ekranı seçer; ok tuşları + Enter ile klavyeden de seçilebilir (merkezden başlayan çerçeve). */
(function () {
  const O = window.ssOverlay;
  const $ = (id) => document.getElementById(id);
  let start = null, rect = null, size = { width: innerWidth, height: innerHeight }, sent = false;

  function draw() {
    const s = $("sel");
    if (!rect || rect.width < 1 || rect.height < 1) { s.hidden = true; document.body.classList.remove("has-sel"); return; }
    s.hidden = false;
    document.body.classList.add("has-sel");
    Object.assign(s.style, { left: rect.x + "px", top: rect.y + "px", width: rect.width + "px", height: rect.height + "px" });
    $("size").textContent = Math.round(rect.width) + " × " + Math.round(rect.height);
    $("size").style.top = rect.y < 30 ? "calc(100% + 4px)" : "";
  }
  function norm(a, b) {
    const x = Math.max(0, Math.min(a.x, b.x)), y = Math.max(0, Math.min(a.y, b.y));
    return { x, y, width: Math.min(size.width, Math.max(a.x, b.x)) - x, height: Math.min(size.height, Math.max(a.y, b.y)) - y };
  }
  function finish() {
    if (sent) return;
    if (!rect || rect.width < 4 || rect.height < 4) { rect = null; draw(); return; }
    sent = true;
    O.done(rect);
  }
  function cancel() { if (!sent) { sent = true; O.cancel(); } }

  addEventListener("mousedown", (e) => { if (e.button !== 0) return cancel(); start = { x: e.clientX, y: e.clientY }; rect = null; document.body.classList.add("dragging"); });
  addEventListener("mousemove", (e) => { if (!start) return; rect = norm(start, { x: e.clientX, y: e.clientY }); draw(); });
  addEventListener("mouseup", (e) => { if (!start) return; rect = norm(start, { x: e.clientX, y: e.clientY }); start = null; document.body.classList.remove("dragging"); draw(); finish(); });
  addEventListener("contextmenu", (e) => { e.preventDefault(); cancel(); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") return cancel();
    if (e.key === "a" && e.ctrlKey) { e.preventDefault(); rect = { x: 0, y: 0, width: size.width, height: size.height }; draw(); return finish(); }
    if (e.key === "Enter" && rect) return finish();
    const step = e.shiftKey ? 40 : 10;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (d) {
      e.preventDefault();
      if (!rect) rect = { x: size.width / 2 - 150, y: size.height / 2 - 40, width: 300, height: 80 };
      if (e.altKey) { rect.width = Math.max(10, rect.width + d[0]); rect.height = Math.max(10, rect.height + d[1]); }
      else { rect.x = Math.max(0, Math.min(size.width - rect.width, rect.x + d[0])); rect.y = Math.max(0, Math.min(size.height - rect.height, rect.y + d[1])); }
      draw();
    }
  });

  O.init().then((d) => {
    size = { width: d.width, height: d.height };
    $("shot").src = d.image;
    document.documentElement.dataset.ready = "1";
  }).catch(cancel);
})();
