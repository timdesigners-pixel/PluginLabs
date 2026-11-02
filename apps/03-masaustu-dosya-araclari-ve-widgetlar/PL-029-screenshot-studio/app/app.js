/* Screenshot Studio — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Düzenleme tuvalde, görüntü koordinatında yapılır; dışa aktarmada çıktı (çerçeve dahil) kayıpsız PNG olarak çizilir ve ana sürece verilir.
 * Ana süreç maskeleri piksel piksel doğrulamadan dosya yazmaz/panoya koymaz. Maskeler her zaman EN SON çizilir (üstüne hiçbir şey binmez).
 * Arayüz ağa ve dosya sistemine erişmez. */
(function () {
  const C = window.SSCore;
  const D = window.ssDesktop;
  const $ = (id) => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");

  const st = {
    s: null, nav: "studio", base: null, capId: null, capAt: 0, source: "", W: 0, H: 0,
    anns: [], crop: null, cands: [], tool: "arrow", color: C.COLORS[0], sel: null, drag: null,
    undo: [], redo: [], scanning: false, scanned: false, exported: false, lastResult: null, seq: 0,
  };

  const ICONS = {
    select: "M5 3l14 8-6 2-3 6z",
    arrow: "M5 19 19 5M9 5h10v10",
    rect: "M4 6h16v12H4z",
    number: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM11 8h2v8M10 16h4",
    text: "M5 6V4h14v2M12 4v16M9 20h6",
    highlight: "m9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4",
    blur: "M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z",
    mask: "M3 5h18v14H3zM3 5l18 14M21 5 3 19",
    crop: "M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2",
    check: "M20 6 9 17l-5-5",
    x: "M18 6 6 18M6 6l12 12",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  };
  const TOOL_INFO = {
    select: ["Seç ve taşı", "V"], arrow: ["Ok", "A"], rect: ["Kutu", "R"], number: ["Numara", "N"], text: ["Metin", "T"],
    highlight: ["Vurgula", "H"], blur: ["Bulanıklaştır (yalnız görsel vurgu)", "B"], mask: ["Maske — kalıcı, doğrulanır", "M"], crop: ["Kırp", "C"],
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
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k === "bg") n.style.background = v; // CSSOM (CSP style-src 'self' satır içi style özniteliğine izin vermez)
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k);
    return n;
  }
  const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
  const clean = (e) => String((e && e.message) || e || "").replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  let toastT = null;
  function toast(message, isError) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, icon(isError ? "alert" : "check", "20"), el("div", { class: "pl-toast__body", text: message }));
    put($("toasts"), t);
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), isError ? 7000 : 4200);
  }
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast(clean(e), true); } };
  const nf = (n) => Number(n || 0).toLocaleString("tr-TR");

  // ---- Görüntü yükleme ----
  async function loadCurrent() {
    const r = await D.image();
    const bmp = await createImageBitmap(new Blob([r.bytes], { type: "image/png" }));
    if (st.base && st.base.close) st.base.close();
    Object.assign(st, { base: bmp, capId: r.id, capAt: r.at, source: r.source, W: r.width, H: r.height, anns: [], crop: null, cands: [], sel: null, drag: null, undo: [], redo: [], scanned: false, exported: false, lastResult: null, seq: 0 });
    canvas.width = r.width;
    canvas.height = r.height;
    $("result").hidden = true;
    setNav("studio");
    renderAll();
    canvas.focus();
    if (st.s && st.s.settings.autoScan && st.s.ocr) runScan();
  }
  async function decodeAndSend(bytes, source) {
    // nativeImage'in çözemediği biçimler (WebP, GIF) Chromium'da çözülür ve kayıpsız PNG olarak ana sürece verilir.
    const bmp = await createImageBitmap(new Blob([bytes]));
    const c = document.createElement("canvas");
    c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    bmp.close();
    const png = new Uint8Array(await (await new Promise((res) => c.toBlob(res, "image/png"))).arrayBuffer());
    await D.fromBytes(png, source);
  }

  // ---- Durum geçmişi (geri al / yinele) ----
  const snap = () => JSON.stringify({ anns: st.anns, crop: st.crop, cands: st.cands.map((c) => [c.id, c.state]) });
  function restore(s) {
    const o = JSON.parse(s);
    st.anns = o.anns; st.crop = o.crop;
    const m = new Map(o.cands);
    for (const c of st.cands) c.state = m.get(c.id) || "pending";
    st.sel = null;
  }
  function commit() { st.undo.push(snap()); if (st.undo.length > 100) st.undo.shift(); st.redo = []; }
  function undo() { if (!st.undo.length) return; st.redo.push(snap()); restore(st.undo.pop()); renderAll(); }
  function redo() { if (!st.redo.length) return; st.undo.push(snap()); restore(st.redo.pop()); renderAll(); }

  // ---- Çizim ----
  const lw = () => Math.max(3, Math.round(Math.min(st.W, st.H) / 220));
  const numR = () => Math.max(14, Math.round(Math.min(st.W, st.H) / 38));
  const fontPx = () => Math.max(16, Math.round(Math.min(st.W, st.H) / 26));
  function norm(r) { return { x: Math.min(r.x, r.x + r.w), y: Math.min(r.y, r.y + r.h), w: Math.abs(r.w), h: Math.abs(r.h) }; }
  function drawArrow(g, a) {
    const w = a.width || lw();
    const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), head = w * 4.2;
    g.save();
    g.strokeStyle = g.fillStyle = a.color;
    g.lineWidth = w; g.lineCap = "round";
    g.beginPath(); g.moveTo(a.x1, a.y1); g.lineTo(a.x2 - Math.cos(ang) * head * 0.6, a.y2 - Math.sin(ang) * head * 0.6); g.stroke();
    g.beginPath(); g.moveTo(a.x2, a.y2);
    g.lineTo(a.x2 - head * Math.cos(ang - 0.42), a.y2 - head * Math.sin(ang - 0.42));
    g.lineTo(a.x2 - head * Math.cos(ang + 0.42), a.y2 - head * Math.sin(ang + 0.42));
    g.closePath(); g.fill();
    g.restore();
  }
  function pixelate(g, src, r) {
    const q = norm(r);
    if (q.w < 2 || q.h < 2) return;
    const block = Math.max(10, Math.round(Math.min(q.w, q.h) / 5));
    const tw = Math.max(1, Math.round(q.w / block)), th = Math.max(1, Math.round(q.h / block));
    const t = document.createElement("canvas");
    t.width = tw; t.height = th;
    const tg = t.getContext("2d");
    tg.imageSmoothingEnabled = true;
    tg.drawImage(src, q.x, q.y, q.w, q.h, 0, 0, tw, th);
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(t, 0, 0, tw, th, q.x, q.y, q.w, q.h);
    g.restore();
  }
  function drawAnn(g, a, src) {
    g.save();
    if (a.type === "rect") { const q = norm(a); g.strokeStyle = a.color; g.lineWidth = a.width || lw(); g.lineJoin = "round"; g.strokeRect(q.x, q.y, q.w, q.h); }
    else if (a.type === "arrow") drawArrow(g, a);
    else if (a.type === "highlight") { const q = norm(a); g.globalAlpha = 0.35; g.fillStyle = a.color; g.fillRect(q.x, q.y, q.w, q.h); }
    else if (a.type === "blur") pixelate(g, src, a);
    else if (a.type === "number") {
      const r = a.r || numR();
      g.fillStyle = a.color; g.beginPath(); g.arc(a.x, a.y, r, 0, Math.PI * 2); g.fill();
      g.lineWidth = Math.max(2, r / 7); g.strokeStyle = "rgba(255,255,255,.9)"; g.stroke();
      g.fillStyle = a.color === "#ffffff" || a.color === "#f0b429" ? "#0b0f1a" : "#ffffff";
      g.font = "700 " + Math.round(r * 1.1) + "px Inter, 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(a.n), a.x, a.y + r * 0.04);
    } else if (a.type === "text") {
      const fs = a.size || fontPx();
      g.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif"; g.textBaseline = "top";
      g.lineJoin = "round"; g.lineWidth = Math.max(3, fs / 5);
      g.strokeStyle = a.color === "#ffffff" || a.color === "#f0b429" ? "rgba(11,15,26,.85)" : "rgba(255,255,255,.92)";
      g.strokeText(a.text, a.x, a.y); g.fillStyle = a.color; g.fillText(a.text, a.x, a.y);
    } else if (a.type === "mask") { g.fillStyle = a.color; g.fillRect(a.x, a.y, a.w, a.h); }
    g.restore();
  }
  /** Maskeler en son: ok, metin ya da vurgu maskenin üstüne binemez (doğrulama bunu da garanti eder). */
  function drawAll(g, src) {
    g.drawImage(src, 0, 0);
    for (const a of st.anns) if (a.type !== "mask") drawAnn(g, a, src);
    for (const a of st.anns) if (a.type === "mask") drawAnn(g, a, src);
  }
  function bbox(a) {
    if (a.type === "arrow") { const p = (a.width || lw()) * 4; return { x: Math.min(a.x1, a.x2) - p, y: Math.min(a.y1, a.y2) - p, w: Math.abs(a.x2 - a.x1) + 2 * p, h: Math.abs(a.y2 - a.y1) + 2 * p }; }
    if (a.type === "number") { const r = a.r || numR(); return { x: a.x - r, y: a.y - r, w: 2 * r, h: 2 * r }; }
    if (a.type === "text") { const fs = a.size || fontPx(); ctx.save(); ctx.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif"; const w = ctx.measureText(a.text).width; ctx.restore(); return { x: a.x, y: a.y, w, h: fs * 1.2 }; }
    return norm(a);
  }
  function render() {
    if (!st.base) return;
    ctx.clearRect(0, 0, st.W, st.H);
    drawAll(ctx, st.base);
    const u = Math.max(1, st.W / Math.max(1, canvas.getBoundingClientRect().width || st.W)); // ekranda 1 px'e karşılık gelen görüntü pikseli
    // Adaylar: kesikli turuncu çerçeve + sıra numarası (çıktıya girmez).
    st.cands.forEach((c, i) => {
      if (c.state !== "pending") return;
      ctx.save();
      ctx.setLineDash([6 * u, 4 * u]); ctx.lineWidth = 2 * u; ctx.strokeStyle = "#fbbf24";
      ctx.fillStyle = "rgba(251,191,36,.16)"; ctx.fillRect(c.rect.x, c.rect.y, c.rect.w, c.rect.h);
      ctx.strokeRect(c.rect.x, c.rect.y, c.rect.w, c.rect.h);
      ctx.setLineDash([]);
      const r = 9 * u;
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(c.rect.x, c.rect.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.font = "700 " + Math.round(11 * u) + "px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), c.rect.x, c.rect.y + 0.5 * u);
      ctx.restore();
    });
    // Kırpma: dışı karartılır.
    const cr = st.drag && st.drag.kind === "crop" ? norm(st.drag.rect) : st.crop;
    if (cr) {
      ctx.save();
      ctx.fillStyle = "rgba(5,8,16,.62)";
      ctx.beginPath(); ctx.rect(0, 0, st.W, st.H); ctx.rect(cr.x, cr.y, cr.w, cr.h); ctx.fill("evenodd");
      ctx.strokeStyle = "#7c6cff"; ctx.lineWidth = 2 * u; ctx.setLineDash([8 * u, 5 * u]); ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      ctx.restore();
    }
    // Çizilmekte olan şekil
    if (st.drag && st.drag.preview) drawAnn(ctx, st.drag.preview, st.base);
    // Seçim çerçevesi
    const a = st.anns.find((x) => x.id === st.sel);
    if (a) { const b = bbox(a); ctx.save(); ctx.strokeStyle = "#7c6cff"; ctx.lineWidth = 1.5 * u; ctx.setLineDash([4 * u, 3 * u]); ctx.strokeRect(b.x - 4 * u, b.y - 4 * u, b.w + 8 * u, b.h + 8 * u); ctx.restore(); }
  }

  // ---- Dışa aktarma çizimi ----
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function cropBox() { const c = st.crop; return c && c.w >= 4 && c.h >= 4 ? c : { x: 0, y: 0, w: st.W, h: st.H }; }
  function renderExport() {
    const crop = cropBox();
    const frame = st.s.settings.frame;
    const L = C.frameLayout(crop.w, crop.h, frame);
    const out = document.createElement("canvas");
    out.width = L.W; out.height = L.H;
    const g = out.getContext("2d");
    if (frame !== "none") {
      const bd = C.BACKDROPS[st.s.settings.backdrop] || C.BACKDROPS.iris;
      const grad = g.createLinearGradient(0, 0, L.W, L.H);
      grad.addColorStop(0, bd.stops[0]); grad.addColorStop(1, bd.stops[1]);
      g.fillStyle = grad; g.fillRect(0, 0, L.W, L.H);
      const light = st.s.settings.backdrop === "gun";
      g.save(); g.shadowColor = "rgba(0,0,0,.38)"; g.shadowBlur = Math.round(L.pad * 0.6); g.shadowOffsetY = Math.round(L.pad * 0.18);
      roundRect(g, L.wx, L.wy, L.ww, L.wh, L.r); g.fillStyle = light ? "#ffffff" : "#141a2c"; g.fill(); g.restore();
      g.save(); roundRect(g, L.wx, L.wy, L.ww, L.wh, L.r); g.clip();
      if (frame === "window") {
        g.fillStyle = light ? "#e9edf5" : "#1b2236"; g.fillRect(L.wx, L.wy, L.ww, L.bar);
        ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(L.wx + 18 + i * 20, L.wy + L.bar / 2, 6, 0, Math.PI * 2); g.fill(); });
        const title = st.s.settings.frameTitle;
        if (title) { g.fillStyle = light ? "#3b4458" : "#b6c0d4"; g.font = "600 13px Inter, 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(title, L.wx + L.ww / 2, L.wy + L.bar / 2, L.ww - 160); }
      }
    }
    g.save();
    g.beginPath(); g.rect(L.ox, L.oy, crop.w, crop.h); g.clip();
    g.translate(L.ox - crop.x, L.oy - crop.y);
    drawAll(g, st.base);
    g.restore();
    if (frame !== "none") g.restore();
    const masks = C.masksToOutput(st.anns.filter((a) => a.type === "mask"), st.crop ? crop : null, L);
    return { out, L, crop, masks, frame };
  }
  async function exportPng() {
    const r = renderExport();
    const blob = await new Promise((res) => r.out.toBlob(res, "image/png"));
    if (!blob) throw new Error("Çıktı üretilemedi (görüntü çok büyük olabilir).");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const meta = {
      format: st.s.settings.format, width: r.out.width, height: r.out.height, innerW: r.crop.w, innerH: r.crop.h, frame: r.frame, masks: r.masks,
      annotations: st.anns.filter((a) => a.type !== "mask").length,
      accepted: st.cands.filter((c) => c.state === "accepted").length, rejected: st.cands.filter((c) => c.state === "rejected").length,
    };
    return { bytes, meta };
  }
  let previewT = null;
  function schedulePreview() {
    clearTimeout(previewT);
    previewT = setTimeout(() => {
      const p = $("preview"), g = p.getContext("2d");
      g.clearRect(0, 0, p.width, p.height);
      if (!st.base) return;
      const r = renderExport();
      const k = Math.min(p.width / r.out.width, p.height / r.out.height);
      const w = r.out.width * k, h = r.out.height * k;
      g.imageSmoothingQuality = "high";
      g.drawImage(r.out, (p.width - w) / 2, (p.height - h) / 2, w, h);
    }, 250);
  }
  const pendingCount = () => st.cands.filter((c) => c.state === "pending").length;
  async function doExport(kind) {
    if (!st.base) { toast("Önce bir ekran görüntüsü alın ya da açın.", true); return; }
    if (st.scanning) { toast("Hassas alan taraması sürüyor; bitince tekrar deneyin.", true); return; }
    busy(kind === "copy" ? "Maskeler doğrulanıyor, panoya kopyalanıyor…" : "Maskeler doğrulanıyor, kaydediliyor…");
    const { bytes, meta } = await exportPng();
    const r = kind === "copy" ? await D.copy(bytes, meta) : await D.save(bytes, meta);
    busy(null);
    st.exported = true;
    st.lastResult = { kind, ...r, at: Date.now() };
    renderResult();
    const pend = pendingCount();
    const verify = r.masks ? " · " + r.masks + " maske piksel piksel doğrulandı" : "";
    toast((kind === "copy" ? "Panoya kopyalandı" : "Kaydedildi: " + r.name + (r.copied ? " (panoya da kopyalandı)" : "")) + verify + "." + (pend ? " Uyarı: " + pend + " aday gözden geçirilmedi." : ""), false);
  }
  function renderResult() {
    const r = st.lastResult;
    const box = $("result");
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    put(box,
      el("b", { text: r.kind === "copy" ? "Panoya kopyalandı" : r.name }),
      el("span", { text: C.fmtBytes(r.bytes) + " · hazırlık " + C.fmtSec(r.prepMs) + (r.prepMs <= 30000 ? " (≤30 sn)" : "") }),
      r.masks ? el("span", { class: "ss-ok" }, icon("shield"), el("span", { text: r.masks + " maske doğrulandı: " + nf(r.pixels) + " pikselin tamamı maske renginde; altındaki içerik çıktıda yok." })) : el("span", { class: "pl-muted", text: "Bu çıktıda maske yok." }),
      r.kind === "save" ? el("button", { type: "button", class: "pl-btn pl-btn--ghost pl-btn--sm", onclick: guard(() => D.reveal(r.historyId)) }, icon("folder"), "Klasörde göster") : null,
    );
  }

  // ---- Hassas alan taraması ----
  async function runScan() {
    if (!st.base || st.scanning) return;
    st.scanning = true;
    const id = st.capId;
    renderCands();
    $("scanInfo").textContent = "Yazı bu bilgisayarda okunuyor (ilk taramada OCR motoru yüklenir)…";
    try {
      const r = await D.scan();
      if (r.stale || id !== st.capId) return;
      const prev = new Map(st.cands.map((c) => [c.id, c.state]));
      st.cands = r.candidates.map((c) => ({ ...c, state: prev.get(c.id) || "pending" })).concat(st.cands.filter((c) => c.kind === "ai"));
      st.scanned = true;
      $("scanInfo").textContent = nf(r.words) + " kelime okundu (" + C.fmtSec(r.ms) + "). " + (r.candidates.length ? r.candidates.length + " hassas alan adayı işaretlendi; her birini kabul edin ya da reddedin." : "Kurallara uyan hassas alan bulunamadı. Yine de görüntüyü gözden geçirin.");
    } catch (e) {
      $("scanInfo").textContent = "Tarama yapılamadı: " + clean(e);
    } finally {
      st.scanning = false;
      renderAll();
    }
  }
  function maskFromCand(c) { return { id: "m-" + c.id, type: "mask", ...C.snapRect(c.rect), color: st.s.settings.maskColor, from: c.id }; }
  function setCand(c, state) {
    commit();
    st.anns = st.anns.filter((a) => a.from !== c.id);
    c.state = state;
    if (state === "accepted") st.anns.push(maskFromCand(c));
    renderAll();
  }
  function acceptAll() {
    const p = st.cands.filter((c) => c.state === "pending");
    if (!p.length) return;
    commit();
    for (const c of p) { c.state = "accepted"; st.anns.push(maskFromCand(c)); }
    renderAll();
    toast(p.length + " aday maskelendi. Maskeler dışa aktarmada piksel piksel doğrulanır.");
  }
  async function askAi() {
    if (!st.base) { toast("Önce bir ekran görüntüsü alın.", true); return; }
    if (!st.s.hasKey) { openMymind(); return; }
    if (!st.scanned) await runScan();
    const covered = st.anns.filter((a) => a.type === "mask").map((a) => ({ x: a.x, y: a.y, w: a.w, h: a.h })).concat(st.cands.map((c) => c.rect));
    busy("MyMind'a sorulmadan önce onayınız isteniyor…");
    const r = await D.mymind.suggest(covered);
    busy(null);
    if (!r.approved) { toast("Gönderim iptal edildi; MyMind'a hiçbir şey gönderilmedi."); return; }
    const known = new Set(st.cands.map((c) => c.id));
    const add = r.candidates.filter((c) => !known.has(c.id)).map((c) => ({ ...c, state: "pending" }));
    st.cands = st.cands.concat(add);
    renderAll();
    toast(add.length ? "MyMind " + add.length + " ek aday önerdi (" + r.sent + " kelime gönderildi). Kabul ettikleriniz maskelenir." : "MyMind ek aday bulmadı (" + (r.sent || 0) + " kelime gönderildi).");
  }
  function renderCands() {
    const list = st.cands.map((c, i) => {
      const li = el("li", { class: "ss-cand is-" + c.state, "data-cand": c.id },
        el("span", { class: "ss-cand__no", text: String(i + 1) }),
        el("div", { class: "ss-cand__main" }, el("b", { text: c.label }), el("span", { text: c.hint })),
        el("div", { class: "ss-cand__tools" },
          c.state !== "accepted" ? el("button", { type: "button", class: "pl-iconbtn pl-iconbtn--sm", "aria-label": (i + 1) + ". adayı maskele", title: "Maskele", "data-act": "accept", onclick: () => setCand(c, "accepted") }, icon("check")) : null,
          c.state !== "rejected" ? el("button", { type: "button", class: "pl-iconbtn pl-iconbtn--sm", "aria-label": (i + 1) + ". adayı reddet", title: c.state === "accepted" ? "Maskeyi kaldır" : "Reddet", "data-act": "reject", onclick: () => setCand(c, "rejected") }, icon("x")) : null,
        ));
      return li;
    });
    put($("cands"), list);
    $("candCount").textContent = String(pendingCount());
    $("acceptAll").disabled = !pendingCount();
    $("scanBtn").disabled = !st.base || st.scanning || !(st.s && st.s.ocr);
    $("scanBtn").textContent = st.scanning ? "Taranıyor…" : st.scanned ? "Yeniden tara" : "Tara";
    $("aiBtn").disabled = !st.base || st.scanning;
  }

  // ---- İşaretçi etkileşimi ----
  function pt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: Math.round(((e.clientX - r.left) * st.W) / r.width), y: Math.round(((e.clientY - r.top) * st.H) / r.height) };
  }
  function hit(p) {
    for (let i = st.anns.length - 1; i >= 0; i--) {
      const a = st.anns[i];
      const b = bbox(a);
      if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 6) return a;
    }
    return null;
  }
  function move(a, dx, dy) {
    if (a.type === "arrow") { a.x1 += dx; a.x2 += dx; a.y1 += dy; a.y2 += dy; }
    else { a.x += dx; a.y += dy; }
  }
  const nextNum = () => st.anns.filter((a) => a.type === "number").reduce((m, a) => Math.max(m, a.n), 0) + 1;
  const newId = () => "a" + Date.now().toString(36) + (++st.seq).toString(36);
  canvas.addEventListener("pointerdown", (e) => {
    if (!st.base || e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    const p = pt(e);
    if (st.tool === "select") {
      const a = hit(p);
      st.sel = a ? a.id : null;
      if (a) { commit(); st.drag = { kind: "move", last: p, id: a.id, moved: false }; }
      render();
      return;
    }
    if (st.tool === "number") { commit(); st.anns.push({ id: newId(), type: "number", x: p.x, y: p.y, n: nextNum(), color: st.color, r: numR() }); renderAll(); return; }
    if (st.tool === "text") { openText(p, e); return; }
    st.drag = { kind: st.tool, start: p, rect: { x: p.x, y: p.y, w: 0, h: 0 }, preview: null };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!st.drag) { if (st.tool === "select" && st.base) canvas.classList.toggle("is-move", !!hit(pt(e))); return; }
    const p = pt(e);
    const d = st.drag;
    if (d.kind === "move") {
      const a = st.anns.find((x) => x.id === d.id);
      if (a) { move(a, p.x - d.last.x, p.y - d.last.y); d.last = p; d.moved = true; render(); }
      return;
    }
    d.rect = { x: d.start.x, y: d.start.y, w: p.x - d.start.x, h: p.y - d.start.y };
    if (d.kind === "arrow") d.preview = { type: "arrow", x1: d.start.x, y1: d.start.y, x2: p.x, y2: p.y, color: st.color, width: lw() };
    else if (d.kind === "mask") d.preview = { type: "mask", ...C.snapRect(norm(d.rect)), color: st.s.settings.maskColor };
    else if (d.kind !== "crop") d.preview = { type: d.kind, ...norm(d.rect), color: st.color, width: lw() };
    render();
  });
  function endDrag(e) {
    const d = st.drag;
    if (!d) return;
    st.drag = null;
    if (d.kind === "move") {
      const a = st.anns.find((x) => x.id === d.id);
      if (!d.moved) st.undo.pop(); else if (a && a.type === "mask") Object.assign(a, C.snapRect(a));
      renderAll();
      return;
    }
    const p = e ? pt(e) : d.start;
    const r = norm({ x: d.start.x, y: d.start.y, w: p.x - d.start.x, h: p.y - d.start.y });
    const small = r.w < 4 && r.h < 4;
    if (d.kind === "arrow") {
      if (Math.hypot(p.x - d.start.x, p.y - d.start.y) >= 8) { commit(); st.anns.push({ id: newId(), type: "arrow", x1: d.start.x, y1: d.start.y, x2: p.x, y2: p.y, color: st.color, width: lw() }); }
    } else if (d.kind === "crop") {
      if (r.w >= 8 && r.h >= 8) { commit(); const c = C.snapRect(r); st.crop = C.intersect(c, { x: 0, y: 0, w: st.W, h: st.H }); }
    } else if (!small && r.w >= 3 && r.h >= 3) {
      commit();
      if (d.kind === "mask") st.anns.push({ id: newId(), type: "mask", ...C.snapRect(r), color: st.s.settings.maskColor, manual: true });
      else st.anns.push({ id: newId(), type: d.kind, ...r, color: st.color, width: lw() });
    }
    renderAll();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => { st.drag = null; render(); });

  function openText(p, e) {
    const inp = $("textInput");
    const wrap = $("canvasWrap").getBoundingClientRect();
    inp.hidden = false;
    inp.value = "";
    inp.style.left = (e.clientX - wrap.left + $("canvasWrap").scrollLeft) + "px";
    inp.style.top = (e.clientY - wrap.top + $("canvasWrap").scrollTop - 12) + "px";
    inp.dataset.x = p.x; inp.dataset.y = p.y;
    setTimeout(() => inp.focus(), 0);
  }
  function commitText(ok) {
    const inp = $("textInput");
    if (inp.hidden) return;
    const t = inp.value.trim();
    inp.hidden = true;
    if (ok && t) { commit(); st.anns.push({ id: newId(), type: "text", x: +inp.dataset.x, y: +inp.dataset.y, text: t, color: st.color, size: fontPx() }); renderAll(); }
    canvas.focus();
  }
  $("textInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); commitText(true); } else if (e.key === "Escape") { e.preventDefault(); commitText(false); } e.stopPropagation(); });
  $("textInput").addEventListener("blur", () => commitText(true));

  // ---- Araç çubuğu ----
  function setTool(t) {
    if (!C.TOOLS.includes(t)) return;
    st.tool = t;
    if (t !== "select") st.sel = null;
    canvas.classList.toggle("is-select", t === "select");
    renderTools();
    render();
  }
  function renderTools() {
    put($("tools"), C.TOOLS.map((t) => el("button", { type: "button", class: "ss-tool" + (t === "mask" ? " ss-tool--mask" : "") + (st.tool === t ? " is-active" : ""), "data-tool": t, "aria-pressed": String(st.tool === t), "aria-label": TOOL_INFO[t][0] + " (" + TOOL_INFO[t][1] + ")", title: TOOL_INFO[t][0] + " (" + TOOL_INFO[t][1] + ")", onclick: () => setTool(t) }, icon(t), el("span", { class: "ss-key", text: TOOL_INFO[t][1] }))));
    put($("colors"), C.COLORS.map((c) => el("button", { type: "button", class: "ss-color" + (st.color === c ? " is-active" : ""), role: "radio", "aria-checked": String(st.color === c), "aria-label": "Renk " + c, bg: c, onclick: () => { st.color = c; const a = st.anns.find((x) => x.id === st.sel); if (a && a.type !== "mask" && a.type !== "blur") { commit(); a.color = c; } renderTools(); renderAll(); } })));
  }

  // ---- Görünüm ----
  let timerT = null;
  function renderTimer() {
    const t = $("timer");
    if (!st.base) { t.textContent = ""; return; }
    const r = st.lastResult;
    const ms = r ? r.prepMs : Date.now() - st.capAt;
    t.textContent = (r ? "Hazırlandı: " : "Hazırlık: ") + C.fmtSec(ms);
    t.classList.toggle("is-ok", ms <= 30000 && !!r);
    t.classList.toggle("is-late", ms > 30000);
  }
  function renderAll() {
    const has = !!st.base;
    $("empty").hidden = has;
    $("canvasWrap").hidden = !has;
    $("stageBar").hidden = !has;
    if (has) {
      const cr = st.crop;
      $("imgInfo").textContent = st.W + " × " + st.H + " px · " + st.source + (cr ? " · kırpma " + cr.w + " × " + cr.h : "") + " · " + st.anns.filter((a) => a.type === "mask").length + " maske · " + st.anns.filter((a) => a.type !== "mask").length + " işaret";
      $("clearCrop").hidden = !cr;
    }
    $("undoBtn").disabled = !st.undo.length;
    $("redoBtn").disabled = !st.redo.length;
    for (const id of ["copyBtn", "saveBtn"]) $(id).disabled = !has;
    render();
    renderCands();
    renderTimer();
    schedulePreview();
  }
  function renderState() {
    const s = st.s;
    if (!s) return;
    $("historyCount").textContent = String(s.stats.count);
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    const key = C.SHORTCUT_LABEL[s.settings.shortcut] || "";
    $("shortcutKbd").textContent = key.replace(/ \+ /g, " ");
    $("shortcutInfo").classList.toggle("is-bad", s.shortcutOk === false);
    $("shortcutInfo").title = s.shortcutOk === false ? "Kısayol başka bir uygulamada kullanılıyor; Ayarlar'dan başka bir kısayol seçin." : "";
    $("emptyHint").textContent = "“Bölge yakala” ya da " + (s.settings.shortcut === "off" ? "araç çubuğu" : key + " kısayolu") + " ile ekranın bir bölümünü seçin. Pencere, tüm ekran, dosya ve pano da olur.";
    for (const b of $("frameSeg").querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.frame === s.settings.frame));
    for (const b of $("fmtSeg").querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.fmt === s.settings.format));
    put($("backdrops"), Object.entries(C.BACKDROPS).map(([k, v]) => el("button", { type: "button", class: "ss-backdrop" + (s.settings.backdrop === k ? " is-active" : ""), "data-b": k, "aria-label": "Zemin: " + v.label, "aria-pressed": String(s.settings.backdrop === k), disabled: s.settings.frame === "none" ? true : null, onclick: guard(() => D.setSettings({ backdrop: k })) })));
    $("titleField").hidden = s.settings.frame !== "window";
    if (document.activeElement !== $("frameTitle")) $("frameTitle").value = s.settings.frameTitle;
    $("outInfo").textContent = "Kayıt: " + s.outDir + " · yeni dosya, var olanın üzerine yazılmaz.";
    $("root").classList.toggle("ss-reduce", s.settings.reduceMotion);
    // Ayarlar
    if (!$("setShortcut").options.length) for (const k of C.SHORTCUTS) $("setShortcut").append(el("option", { value: k, text: C.SHORTCUT_LABEL[k] }));
    $("setShortcut").value = s.settings.shortcut;
    $("shortcutState").textContent = s.settings.shortcut === "off" ? "Kısayol kapalı." : s.shortcutOk === false ? "Bu kısayol başka bir uygulamada kullanılıyor; başkasını seçin." : s.shortcutOk ? "Kısayol etkin (uygulama açıkken)." : "";
    $("setHide").checked = s.settings.hideOnCapture;
    $("setScan").checked = s.settings.autoScan;
    $("setCopy").checked = s.settings.copyAfterSave;
    $("setMotion").checked = s.settings.reduceMotion;
    if (document.activeElement !== $("setQuality")) $("setQuality").value = s.settings.jpegQuality;
    $("setMask").value = s.settings.maskColor;
    $("dirInfo").textContent = s.outDir;
    put($("privacy"), [
      "Yakalanan görüntü yalnız bellekte tutulur; siz “Kaydet” demedikçe diske yazılmaz.",
      "Hassas alan taraması (OCR) bu bilgisayarda, çevrimdışı çalışır; okunan metin diske yazılmaz.",
      "Adaylar yalnız öneridir; sızıntı olmayacağını garanti etmez. Siz kabul etmedikçe maskelenmez.",
      "Maske kalıcıdır: çıktıda maske altındaki her piksel maske rengiyle değiştirilir ve kaydetmeden/kopyalamadan önce piksel piksel doğrulanır. Doğrulama geçmezse hiçbir şey yazılmaz.",
      "“Bulanıklaştır” yalnız görsel vurgudur; bulanık yazı bazen geri okunabilir. Hassas veri için Maske kullanın.",
      "MyMind (isteğe bağlı): her istekte onay; yalnız rakam içermeyen kelimeler gönderilir — görüntü, konum, numaralar ve zaten maskelenen değerler gönderilmez. Yanıt yalnız gönderilen kelimelerle sınırlıdır.",
      "Kayıtlar listesi (dosya adı, ölçü, süre, maske sayısı) " + (s.vault ? "Windows kasasıyla (DPAPI) şifreli" : "bu bilgisayarda") + " tutulur. Ağ isteği yalnız MyMind için, yerel Hub'a (127.0.0.1) yapılır.",
    ].map((t) => el("li", { text: t })));
    renderHistory();
  }
  function kpi(label, value, sub) { return el("div", { class: "pl-kpi ss-kpi" }, el("span", { class: "pl-label", text: label }), el("span", { class: "pl-kpi__value pl-num", text: value }), sub ? el("span", { class: "pl-muted ss-small", text: sub }) : null); }
  function renderHistory() {
    const s = st.s, k = s.stats;
    put($("kpis"),
      kpi("Dışa aktarma", nf(k.count)),
      kpi("Medyan hazırlık", k.count ? String(k.medianPrepS).replace(".", ",") + " sn" : "—", "yakalamadan ilk dışa aktarmaya"),
      kpi("≤30 sn", k.count ? "%" + k.under30 : "—", "hedef: paylaşılabilir görsel ≤30 sn"),
      kpi("Doğrulanan maskeli", k.withMasks ? k.verified + "/" + k.withMasks : "—", "maske altı piksel denetimi"),
      kpi("Aday kabulü", k.acceptRate == null ? "—" : "%" + k.acceptRate, "kabul / (kabul + ret)"));
    if (!s.history.length) { put($("history"), el("li", { class: "ss-empty" }, el("b", { text: "Henüz dışa aktarma yok" }), el("span", { text: "Panoya kopyaladığınız ya da kaydettiğiniz görüntüler burada listelenir." }))); return; }
    put($("history"), s.history.map((h) => el("li", { class: "ss-hrow" },
      el("div", {}, el("b", { text: h.name || (h.action === "copy" ? "Panoya kopyalandı" : "Kayıt") }),
        el("div", { class: "ss-hrow__meta" },
          el("span", { text: new Date(h.at).toLocaleString("tr-TR") }), el("span", { text: h.width + "×" + h.height + " " + C.FORMATS[h.format].label }), el("span", { text: C.fmtBytes(h.bytes) }),
          el("span", { text: "hazırlık " + C.fmtSec(h.prepMs) }), el("span", { text: C.FRAMES[h.frame] }), h.source ? el("span", { text: h.source }) : null)),
      h.masks ? el("span", { class: "pl-badge pl-badge--success", title: "Maske altındaki tüm pikseller doğrulandı" }, icon("shield"), h.masks + " maske doğrulandı") : el("span", { class: "pl-badge", text: "maskesiz" }),
      el("div", { class: "ss-bar" },
        h.file ? el("button", { type: "button", class: "pl-iconbtn pl-iconbtn--sm", "aria-label": "Klasörde göster", title: "Klasörde göster", onclick: guard(() => D.reveal(h.id)) }, icon("folder")) : null,
        el("button", { type: "button", class: "pl-iconbtn pl-iconbtn--sm", "aria-label": "Listeden kaldır (dosya silinmez)", title: "Listeden kaldır (dosya silinmez)", onclick: guard(() => D.forget(h.id)) }, icon("x"))))));
  }
  function setNav(v) {
    st.nav = v;
    for (const b of document.querySelectorAll("[data-nav]")) { const on = b.dataset.nav === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on)); }
    for (const id of ["studio", "history", "settings"]) $("view-" + id).hidden = id !== v;
  }

  // ---- Pencere seçimi ----
  async function pickWindow() {
    busy("Açık pencereler listeleniyor…");
    const list = await D.windows();
    busy(null);
    put($("winList"), list.length ? list.map((w) => el("li", {}, el("button", { type: "button", class: "ss-win", "data-win": w.id, onclick: guard(async () => { $("winDialog").close(); await D.captureWindow(w.id); }) }, el("img", { src: w.thumb, alt: "" }), el("span", { text: w.name })))) : el("li", { class: "ss-empty" }, el("b", { text: "Yakalanabilir pencere bulunamadı" })));
    if (!$("winDialog").open) $("winDialog").showModal();
  }

  // ---- MyMind ----
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = st.s.hasKey ? "Bağlı: anahtar " + (st.s.vault ? "kasada şifreli" : "bu oturumda bellekte") + "." : "Bağlı değil.";
    $("mymindDialog").showModal();
  }

  // ---- Komut paleti ----
  const COMMANDS = () => [
    { group: "Yakala", label: "Bölge yakala", run: () => D.capture("region") },
    { group: "Yakala", label: "Tüm ekranı yakala", run: () => D.capture("screen") },
    { group: "Yakala", label: "Pencere yakala…", run: pickWindow },
    { group: "Yakala", label: "Görüntü aç…", run: openFile },
    { group: "Yakala", label: "Panodan yapıştır", run: () => D.paste() },
    ...C.TOOLS.map((t) => ({ group: "Araç", label: TOOL_INFO[t][0], hint: TOOL_INFO[t][1], run: () => setTool(t) })),
    { group: "Hassas alanlar", label: "Hassas alanları tara", run: runScan },
    { group: "Hassas alanlar", label: "Tüm adayları maskele", run: acceptAll },
    { group: "Hassas alanlar", label: "MyMind ile ek aday ara", run: askAi },
    ...Object.entries(C.FRAMES).map(([k, v]) => ({ group: "Çerçeve", label: "Çerçeve: " + v, run: () => D.setSettings({ frame: k }) })),
    { group: "Dışa aktar", label: "Panoya kopyala", hint: "Ctrl C", run: () => doExport("copy") },
    { group: "Dışa aktar", label: "Kaydet", hint: "Ctrl S", run: () => doExport("save") },
    { group: "Git", label: "Kayıtlar", run: () => setNav("history") },
    { group: "Git", label: "Ayarlar ve gizlilik", run: () => setNav("settings") },
    { group: "Git", label: "MyMind bağlantısı", run: openMymind },
  ];
  let palIdx = 0, palItems = [];
  function renderPalette() {
    const q = $("paletteInput").value.trim().toLocaleLowerCase("tr");
    palItems = COMMANDS().filter((c) => !q || (c.group + " " + c.label).toLocaleLowerCase("tr").includes(q));
    palIdx = Math.min(palIdx, Math.max(0, palItems.length - 1));
    const out = [];
    let g = null;
    palItems.forEach((c, i) => {
      if (c.group !== g) { g = c.group; out.push(el("div", { class: "pl-cmdk__group pl-label", text: g })); }
      out.push(el("div", { class: "pl-menuitem", role: "option", "aria-selected": String(i === palIdx), "data-i": i, onclick: () => runPal(i) }, el("span", { text: c.label }), c.hint ? el("span", { class: "pl-kbd", text: c.hint }) : null));
    });
    put($("paletteList"), out);
  }
  function runPal(i) { const c = palItems[i]; $("palette").close(); if (c) guard(async () => c.run())(); }
  function openPalette() { $("paletteInput").value = ""; palIdx = 0; renderPalette(); $("palette").showModal(); $("paletteInput").focus(); }
  $("paletteInput").addEventListener("input", () => { palIdx = 0; renderPalette(); });
  $("paletteInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); palIdx = Math.min(palItems.length - 1, palIdx + 1); renderPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palIdx = Math.max(0, palIdx - 1); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); runPal(palIdx); }
  });

  // ---- Olaylar ----
  async function openFile() { const r = await D.open(); if (r && r.decode) await decodeAndSend(r.bytes, "dosya"); }
  $("capRegion").addEventListener("click", guard(() => D.capture("region")));
  $("emptyRegion").addEventListener("click", guard(() => D.capture("region")));
  $("capScreen").addEventListener("click", guard(() => D.capture("screen")));
  $("capWindow").addEventListener("click", guard(pickWindow));
  $("winRefresh").addEventListener("click", guard(pickWindow));
  $("winCancel").addEventListener("click", () => $("winDialog").close());
  $("openFile").addEventListener("click", guard(openFile));
  $("emptyOpen").addEventListener("click", guard(openFile));
  $("pasteBtn").addEventListener("click", guard(() => D.paste()));
  $("undoBtn").addEventListener("click", undo);
  $("redoBtn").addEventListener("click", redo);
  $("clearCrop").addEventListener("click", () => { commit(); st.crop = null; renderAll(); });
  $("scanBtn").addEventListener("click", guard(runScan));
  $("acceptAll").addEventListener("click", acceptAll);
  $("aiBtn").addEventListener("click", guard(askAi));
  $("copyBtn").addEventListener("click", guard(() => doExport("copy")));
  $("saveBtn").addEventListener("click", guard(() => doExport("save")));
  $("frameSeg").addEventListener("click", guard(async (e) => { const b = e.target.closest("[data-frame]"); if (b) await D.setSettings({ frame: b.dataset.frame }); }));
  $("fmtSeg").addEventListener("click", guard(async (e) => { const b = e.target.closest("[data-fmt]"); if (b) await D.setSettings({ format: b.dataset.fmt }); }));
  let titleT = null;
  $("frameTitle").addEventListener("input", () => { clearTimeout(titleT); titleT = setTimeout(guard(() => D.setSettings({ frameTitle: $("frameTitle").value })), 300); });
  for (const b of document.querySelectorAll("[data-nav]")) b.addEventListener("click", () => setNav(b.dataset.nav));
  $("openMymind").addEventListener("click", openMymind);
  $("openPalette").addEventListener("click", openPalette);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.mymind.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "MyMind anahtarı kasaya kaydedildi." : "MyMind anahtarı bu oturum için bellekte."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("MyMind anahtarı kaldırıldı."); }));
  $("setShortcut").addEventListener("change", guard(() => D.setSettings({ shortcut: $("setShortcut").value })));
  $("setHide").addEventListener("change", guard(() => D.setSettings({ hideOnCapture: $("setHide").checked })));
  $("setScan").addEventListener("change", guard(() => D.setSettings({ autoScan: $("setScan").checked })));
  $("setCopy").addEventListener("change", guard(() => D.setSettings({ copyAfterSave: $("setCopy").checked })));
  $("setMotion").addEventListener("change", guard(() => D.setSettings({ reduceMotion: $("setMotion").checked })));
  $("setQuality").addEventListener("change", guard(() => D.setSettings({ jpegQuality: $("setQuality").value })));
  $("setMask").addEventListener("change", guard(() => D.setSettings({ maskColor: $("setMask").value })));
  $("chooseDir").addEventListener("click", guard(async () => { const r = await D.chooseOutput(); if (!r.cancelled) toast("Kayıt klasörü: " + r.dir); }));
  $("defaultDir").addEventListener("click", guard(() => D.setSettings({ output: "pictures" })));

  const typing = () => { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT"); };
  const KEY_TOOL = { v: "select", a: "arrow", r: "rect", n: "number", t: "text", h: "highlight", b: "blur", m: "mask", c: "crop" };
  document.addEventListener("keydown", (e) => {
    const dlg = document.querySelector("dialog[open]");
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if ($("palette").open) $("palette").close(); else if (!dlg) openPalette(); return; }
    if (dlg || typing()) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey || e.metaKey) {
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
      else if (k === "c" && st.base && !window.getSelection().toString()) { e.preventDefault(); guard(() => doExport("copy"))(); }
      else if (k === "s" && st.base) { e.preventDefault(); guard(() => doExport("save"))(); }
      else if (k === "v") { e.preventDefault(); guard(() => D.paste())(); }
      return;
    }
    if (e.altKey || st.nav !== "studio") return;
    if ((e.key === "Delete" || e.key === "Backspace") && st.sel) { e.preventDefault(); commit(); const a = st.anns.find((x) => x.id === st.sel); st.anns = st.anns.filter((x) => x.id !== st.sel); if (a && a.from) { const c = st.cands.find((x) => x.id === a.from); if (c) c.state = "rejected"; } st.sel = null; renderAll(); return; }
    if (e.key === "Escape") { if (st.drag) { st.drag = null; render(); } else if (st.sel) { st.sel = null; render(); } return; }
    if (KEY_TOOL[k] && st.base) { e.preventDefault(); setTool(KEY_TOOL[k]); }
  });
  window.addEventListener("resize", () => render());

  D.onState((s) => { st.s = s; renderState(); renderAll(); });
  D.onCapture(guard(loadCurrent));
  D.onNotice((n) => toast(n.message, n.error));
  timerT = setInterval(renderTimer, 500);
  D.state().then((s) => {
    st.s = s;
    renderTools();
    setNav("studio");
    renderState();
    renderAll();
    if (s.current) guard(loadCurrent)();
    document.documentElement.dataset.ready = "1";
  });
})();
