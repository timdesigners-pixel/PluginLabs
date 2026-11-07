/* Voice Note Orbit — yüzen kayıt balonu. Basılı tut → konuş → bırak. Kayıt süresince kırmızı halka ve sayaç görünür.
 * Bırakınca ses ana sürece gider (onaylı yerel transkripsiyon); sonuç kartında tür ve tarih görünür, belirsiz tarih seçeneklerinden
 * biri tek tıkla seçilip kaydedilir. Her metin textContent ile yazılır. */
(function () {
  const D = window.vnDesktop, C = window.VNCore, R = window.VNRec;
  const $ = (id) => document.getElementById(id);
  let s = null, phase = "idle", pressClicks = 0, lastErr = "", lastId = null;
  const rec = R.createRecorder({
    maxSeconds: () => (s ? s.settings.maxSeconds : 60),
    onLevel: (l) => $("ring").style.setProperty("--lvl", String(l)),
    onTick: (sec) => { $("label").textContent = "● " + C.fmtDur(sec) + " / " + C.fmtDur(s ? s.settings.maxSeconds : 60); },
    onLimit: () => release(),
  });
  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (v !== false && v != null) e.setAttribute(k, v); }
    for (const k of kids) if (k) e.appendChild(typeof k === "string" ? document.createTextNode(k) : k);
    return e;
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const btn = (text, cls, fn, attrs) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + cls, ...(attrs || {}) }, text); b.addEventListener("click", async () => { try { await fn(); } catch (e) { showError(clean(e)); } }); return b; };

  function setPhase(p) {
    phase = p;
    const mic = $("mic"), label = $("label");
    mic.classList.toggle("is-rec", p === "rec");
    mic.classList.toggle("is-busy", p === "busy");
    label.classList.toggle("is-rec", p === "rec");
    mic.setAttribute("aria-pressed", p === "rec" ? "true" : "false");
    if (p === "idle") label.textContent = "Basılı tut";
    if (p === "busy") label.textContent = "Metne çevriliyor…";
  }
  async function press(e) {
    if (phase !== "idle") return;
    if (e) e.preventDefault();
    pressClicks = 1;
    lastErr = "";
    setPhase("rec");
    try { await rec.start(); if (phase !== "rec") await rec.stop(); }
    catch (err) { setPhase("idle"); showError(clean(err)); }
  }
  async function release() {
    if (phase !== "rec") return;
    setPhase("busy");
    let r = null;
    try { r = await rec.stop(); } catch (err) { setPhase("idle"); return showError(clean(err)); }
    if (!r || !r.wav) { setPhase("idle"); return showError("Kayıt çok kısa — düğmeyi basılı tutarak konuşun."); }
    try {
      const res = await D.note.fromAudio(r.wav, { source: "kayit", from: "bubble", clicks: pressClicks });
      lastId = res.id;
      if (res.error) lastErr = res.error;
      setPhase("idle");
      s = res.state;
      render();
    } catch (err) { setPhase("idle"); showError(clean(err)); }
  }
  function showError(msg) { lastErr = msg; lastId = null; render(true); }

  async function expand(v) { await D.bubble.resize(!!v); $("card").hidden = !v; }
  function render(errorOnly) {
    const n = !errorOnly && s && s.bubbleNote;
    if (!n && !lastErr) { expand(false); return; }
    expand(true);
    const body = $("cardBody");
    body.replaceChildren();
    if (!n) {
      $("cardTitle").textContent = "Kayıt yapılamadı";
      body.append(el("p", { text: lastErr }), el("div", { class: "vb-row" }, btn("Kapat", "pl-btn--ghost", () => { lastErr = ""; render(); })));
      return;
    }
    $("cardTitle").textContent = n.title || "Ses notu";
    if (n.transcript) body.append(el("p", { class: "vb-tx", text: "“" + n.transcript + "”" }));
    else body.append(el("p", { class: "vb-tx", text: lastErr ? lastErr : "Transkript yok — ana pencerede yazabilir ya da yeniden metne çevirebilirsiniz." }));
    const seg = el("div", { class: "vb-seg", role: "radiogroup", "aria-label": "Tür" });
    for (const k of C.KINDS) { const b = el("button", { type: "button", role: "radio", class: n.kind === k ? "is-on" : "", "aria-checked": n.kind === k ? "true" : "false" }, C.KIND_NAMES[k]); b.addEventListener("click", async () => { try { s = await D.note.update(n.id, { kind: k }); render(); } catch (e) { showError(clean(e)); } }); seg.append(b); }
    body.append(el("div", { class: "vb-row" }, seg, el("span", { class: "vb-when" + (n.when && n.when.ambiguous ? " is-amb" : ""), text: n.when ? (n.when.ambiguous ? "Belirsiz: " + (n.when.text || "") : C.fmtWhen(n.when)) : n.kind === "gorev" ? "Tarih yok" : "" })));
    const save = async (choice) => { s = await D.note.save(n.id, { clicks: 1, from: "bubble", choice }); lastId = null; lastErr = ""; render(); flash("Kaydedildi"); };
    if (n.kind === "gorev" && n.when && n.when.ambiguous) {
      body.append(el("p", { class: "vb-when is-amb", text: n.when.why || "Hangisi?" }));
      const ch = el("div", { class: "vb-choices" });
      for (const c of C.whenChoices(n.when)) ch.append(btn("Kaydet · " + c.label, "pl-btn--secondary", () => save(c), { "data-choice": c.date + " " + c.time }));
      body.append(ch, el("div", { class: "vb-row" }, btn("Aç", "pl-btn--ghost", () => D.showMain(n.id)), btn("Sonra", "pl-btn--ghost", () => D.bubble.dismiss())));
    } else {
      body.append(el("div", { class: "vb-row" }, btn("Kaydet", "pl-btn--primary", () => save(null), { id: "bubbleSave" }), btn("Aç", "pl-btn--ghost", () => D.showMain(n.id)), btn("Sonra", "pl-btn--ghost", () => D.bubble.dismiss())));
    }
  }
  function flash(t) { $("label").textContent = "✓ " + t; setTimeout(() => { if (phase === "idle") $("label").textContent = "Basılı tut"; }, 1800); }

  const mic = $("mic");
  mic.addEventListener("pointerdown", (e) => { if (e.button === 0) { mic.setPointerCapture(e.pointerId); press(e); } });
  mic.addEventListener("pointerup", () => release());
  mic.addEventListener("pointercancel", () => release());
  mic.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(); } });
  mic.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); release(); } });
  window.addEventListener("blur", () => { if (phase === "rec") release(); });
  $("cardClose").addEventListener("click", () => { lastErr = ""; D.bubble.dismiss(); render(); });
  D.onState((st) => { s = st; if (phase === "idle") render(); });
  D.state().then((st) => { s = st; render(); document.documentElement.dataset.ready = "1"; });
})();
