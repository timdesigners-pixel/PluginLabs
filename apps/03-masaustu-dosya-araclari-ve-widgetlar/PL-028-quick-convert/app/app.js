/* Quick Convert — ana pencere. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Görüntü dönüştürme burada Chromium'un kod çözücü/kodlayıcısıyla (createImageBitmap + OffscreenCanvas) yapılır; baytlar ana süreçten
 * okunur ve sonuç ana sürece verilir, ana süreç içerik/ölçü doğrulayıp YENİ dosyaya yazar. Arayüz ağa ve dosya sistemine erişmez. */
(function () {
  const C = window.QCCore;
  const D = window.qcDesktop;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, view: "convert", running: false, suggestion: null, thumbs: new Map(), thumbBusy: new Set() };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    x: "M18 6 6 18M6 6l12 12",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15.5 9.5h.01",
    text: "M6 3h9l5 5v13H6zM14 3v6h6M9 13h8M9 17h6",
    ban: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM5 5l14 14",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    play: "M7 4v16l13-8z",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
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
    setTimeout(() => t.remove(), 6000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs, ico) => { const b = el("button", { type: "button", class: "pl-btn " + cls, ...(attrs || {}) }, ico ? icon(ico) : null, text); b.addEventListener("click", guard(onClick)); return b; };
  const put = (node, ...kids) => node.replaceChildren(...kids.filter(Boolean));
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const S = () => state.s.settings;

  // ---- Dönüştürme motoru (görüntü) ----
  function hasAlpha(bmp) {
    const n = Math.min(128, bmp.width), m = Math.max(1, Math.round((bmp.height * n) / bmp.width));
    const c = new OffscreenCanvas(n, m).getContext("2d", { willReadFrequently: true });
    c.drawImage(bmp, 0, 0, n, m);
    const d = c.getImageData(0, 0, n, m).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  }
  function pixels(src, w, h) {
    const c = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true });
    c.imageSmoothingQuality = "high";
    c.drawImage(src, 0, 0, w, h);
    return c.getImageData(0, 0, w, h).data;
  }
  async function convertImage(it, opts) {
    const src = await D.read(it.id);
    let bmp;
    try { bmp = await createImageBitmap(new Blob([src.bytes], { type: src.mime }), { imageOrientation: "from-image" }); } catch { throw new Error("Görüntü çözülemedi: dosya bozuk, eksik ya da bu biçimin desteklenmeyen bir türü."); }
    const fmt = C.targetFormat(opts, src.type);
    const meta = C.IMAGE_OUT[fmt];
    const plan = C.planResize({ width: bmp.width, height: bmp.height }, opts);
    const notes = [];
    const canvas = new OffscreenCanvas(plan.width, plan.height);
    const ctx = canvas.getContext("2d", { alpha: fmt !== "jpeg" });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (fmt === "jpeg") {
      if (hasAlpha(bmp)) notes.push("Saydam alanlar " + opts.background + " ile dolduruldu (JPEG saydamlık taşımaz).");
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, plan.width, plan.height);
    }
    ctx.drawImage(bmp, 0, 0, plan.width, plan.height);
    bmp.close();
    const encode = async (q) => new Uint8Array(await (await canvas.convertToBlob({ type: meta.mime, quality: q / 100 })).arrayBuffer());
    let q = opts.quality;
    let out = await encode(q);
    if (!C.verifyOutput(out, fmt)) throw new Error(meta.label + " bu sistemde kodlanamadı.");
    if (opts.maxKB && meta.lossy && out.length > opts.maxKB * 1024) {
      const limit = opts.maxKB * 1024;
      let lo = 5, hi = q - 1, best = null;
      for (let i = 0; i < 8 && lo <= hi; i++) {
        const mid = (lo + hi) >> 1;
        const b = await encode(mid);
        if (b.length <= limit) { best = { b, q: mid }; lo = mid + 1; } else hi = mid - 1;
      }
      if (best) { out = best.b; q = best.q; notes.push("Hedef " + opts.maxKB + " KB için kalite %" + q + "'e indirildi."); }
      else { out = await encode(5); q = 5; notes.push("En düşük kalitede bile " + opts.maxKB + " KB'a inilemedi; boyutu da küçültmeyi deneyin."); }
    } else if (opts.maxKB && !meta.lossy) notes.push("PNG kayıpsızdır; KB hedefi uygulanmadı.");
    // Kalite ölçüsü: çıktı yeniden çözülür (açılabildiği doğrulanır) ve en fazla 512 px'te kaynakla karşılaştırılır.
    let db = NaN;
    try {
      const back = await createImageBitmap(new Blob([out], { type: meta.mime }));
      if (back.width !== plan.width || back.height !== plan.height) throw new Error("ölçü");
      const k = Math.min(1, 512 / Math.max(plan.width, plan.height));
      const w = Math.max(1, Math.round(plan.width * k)), h = Math.max(1, Math.round(plan.height * k));
      db = C.psnr(pixels(canvas, w, h), pixels(back, w, h));
      back.close();
    } catch { throw new Error("Çıktı yeniden açılamadı; dosya yazılmadı."); }
    if (plan.scaled) notes.unshift("Boyut " + it.width + "×" + it.height + " → " + plan.width + "×" + plan.height + ".");
    if (src.type === "gif") notes.push("GIF'in ilk karesi kullanıldı.");
    const quality = (meta.lossy ? "kalite %" + q + " · " : "") + C.qualityLabel(db);
    const r = await D.writeImage(it.id, out, { format: fmt, width: plan.width, height: plan.height, quality, note: notes.join(" ") });
    try { const old = state.thumbs.get("out:" + it.id); if (old) URL.revokeObjectURL(old); state.thumbs.set("out:" + it.id, URL.createObjectURL(new Blob([out], { type: meta.mime }))); } catch { /* önizleme isteğe bağlı */ }
    return r;
  }
  async function thumb(it) {
    if (state.thumbs.has(it.id) || state.thumbBusy.has(it.id) || it.kind !== "image" || it.status === "blocked" || it.bytes > 8 * C.MB) return;
    state.thumbBusy.add(it.id);
    try {
      const src = await D.read(it.id);
      const bmp = await createImageBitmap(new Blob([src.bytes], { type: src.mime }), { resizeWidth: 96, resizeQuality: "medium" });
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      c.getContext("2d").drawImage(bmp, 0, 0);
      bmp.close();
      state.thumbs.set(it.id, URL.createObjectURL(await c.convertToBlob({ type: "image/png" })));
      renderQueue();
    } catch { state.thumbs.set(it.id, ""); } finally { state.thumbBusy.delete(it.id); }
  }

  async function run(ids) {
    if (state.running) return;
    const list = state.s.items.filter((x) => x.status === "ready" && (!ids || ids.includes(x.id)));
    if (!list.length) { toast("Dönüştürülecek hazır dosya yok. Önce dosya bırakın.", true); return; }
    state.running = true;
    renderRun();
    let ok = 0, fail = 0, saved = 0;
    try {
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        busy("Dönüştürülüyor " + (i + 1) + "/" + list.length + " · " + it.name);
        try {
          if (it.kind === "image") await convertImage(it, S().image);
          else await D.convertText(it.id, S().text);
          ok++;
          saved += it.bytes;
        } catch (e) {
          fail++;
          await D.fail(it.id, clean(e)).catch(() => {});
        }
      }
    } finally { state.running = false; busy(null); renderRun(); }
    toast(ok + " dosya dönüştürüldü" + (fail ? ", " + fail + " dosyada hata (ayrıntı kuyrukta)" : "") + ".", !ok && fail > 0);
  }

  // ---- Gezinme ----
  function setView(v) {
    state.view = v;
    for (const id of ["convert", "history", "settings"]) $("view-" + id).hidden = id !== v;
    for (const b of document.querySelectorAll("[data-nav]")) { const on = b.dataset.nav === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); }
    render();
  }

  // ---- Çizim ----
  function itemMeta(it) {
    if (it.kind === "image") return [it.label, it.width ? it.width + "×" + it.height + " px" : "", C.fmtBytes(it.bytes)].filter(Boolean).join(" · ");
    if (it.kind === "text") return ["Metin", it.encoding ? C.ENCODINGS[it.encoding].label.split(" (")[0] : "", it.eol ? C.EOL_LABEL[it.eol] : "", it.chars != null ? it.chars.toLocaleString("tr-TR") + " karakter" : "", C.fmtBytes(it.bytes)].filter(Boolean).join(" · ");
    return C.fmtBytes(it.bytes);
  }
  const STATUS = { ready: ["Hazır", "accent"], done: ["Dönüştürüldü", "success"], error: ["Hata", "danger"], blocked: ["Desteklenmiyor", "warning"] };
  function renderQueue() {
    const items = state.s.items;
    $("queueInfo").textContent = String(items.length);
    $("queueCount").textContent = String(items.filter((x) => x.status === "ready").length);
    if (!items.length) {
      put($("queue"), el("li", { class: "qc-empty" }, icon("upload", "24"), el("b", { text: "Kuyruk boş" }), el("span", { text: "Dosyaları sol üstteki alana ya da masaüstündeki bırakma kutusuna bırakın. Kaynak dosyalar hiçbir zaman değiştirilmez." })));
      return;
    }
    put($("queue"), ...items.map((it) => {
      const [st, tone] = STATUS[it.status] || ["?", ""];
      const outUrl = state.thumbs.get("out:" + it.id);
      const srcUrl = state.thumbs.get(it.id);
      if (it.kind === "image" && !srcUrl && it.status !== "blocked") thumb(it);
      const pic = (outUrl || srcUrl) ? el("img", { class: "qc-thumb", src: outUrl || srcUrl, alt: "" }) : el("span", { class: "qc-thumb qc-thumb--icon" }, icon(it.status === "blocked" ? "ban" : it.kind === "text" ? "text" : "image", "20"));
      const main = el("div", { class: "qc-item__main" },
        el("b", { text: it.name, title: it.dir + " · " + it.name }),
        el("span", { class: "pl-muted", text: itemMeta(it) }));
      if (it.warn) main.appendChild(el("span", { class: "qc-warn", text: it.warn }));
      if (it.status === "blocked" || it.status === "error") main.appendChild(el("span", { class: "qc-err", text: it.error }));
      if (it.status === "done" && it.result) {
        const r = it.result;
        main.appendChild(el("span", { class: "qc-out" }, icon("arrow"), el("b", { text: r.outName }), " · " + C.fmtBytes(r.outBytes) + " (" + C.pctLabel(it.bytes, r.outBytes) + ")" + (r.outSize ? " · " + r.outSize : "") + (r.quality ? " · " + r.quality : "")));
        if (r.note) main.appendChild(el("span", { class: "pl-muted qc-small", text: r.note }));
      }
      const tools = el("div", { class: "qc-item__tools" });
      if (it.status === "done" && it.result) {
        const rv = el("button", { type: "button", class: "qc-icon-btn qc-reveal", title: "Klasörde göster", "aria-label": "Klasörde göster: " + it.result.outName }, icon("folder"));
        rv.addEventListener("click", guard(() => D.reveal(it.result.historyId)));
        tools.appendChild(rv);
      }
      const rm = el("button", { type: "button", class: "qc-icon-btn", title: "Kuyruktan kaldır", "aria-label": "Kuyruktan kaldır: " + it.name }, icon("x"));
      rm.addEventListener("click", guard(() => D.remove(it.id)));
      tools.appendChild(rm);
      return el("li", { class: "qc-item qc-item--" + it.status, "data-id": it.id }, pic, main, el("div", { class: "qc-item__side" }, badge(st, tone), tools));
    }));
  }
  const PRESETS = [
    { key: "mail", label: "E-posta / WhatsApp", image: { format: "jpeg", quality: 80, resize: "fit", width: 1600, height: 1600, maxKB: 0 } },
    { key: "web", label: "Web (WebP)", image: { format: "webp", quality: 80, resize: "fit", width: 1920, height: 1920, maxKB: 0 } },
    { key: "insta", label: "Instagram 1080×1350", image: { format: "jpeg", quality: 90, resize: "fit", width: 1080, height: 1350, maxKB: 0 } },
    { key: "png", label: "Kayıpsız PNG", image: { format: "png", resize: "none", maxKB: 0 } },
    { key: "small", label: "En fazla 200 KB", image: { format: "jpeg", quality: 85, resize: "fit", width: 1600, height: 1600, maxKB: 200 } },
  ];
  const setSeg = (id, attr, val) => { for (const b of $(id).querySelectorAll("button")) { const on = b.dataset[attr] === val; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); } };
  const setVal = (id, v) => { const e = $(id); if (document.activeElement !== e) e.value = v; };
  function renderSettings() {
    const im = S().image, tx = S().text;
    const items = state.s.items;
    $("imgCount").textContent = String(items.filter((x) => x.kind === "image" && x.status !== "blocked").length);
    $("txtCount").textContent = String(items.filter((x) => x.kind === "text" && x.status !== "blocked").length);
    setSeg("fmtSeg", "fmt", im.format);
    setSeg("rsSeg", "rs", im.resize);
    setSeg("outSeg", "out", S().output);
    setVal("quality", im.quality);
    $("quality").style.setProperty("--pl-val", ((im.quality - 10) / 90) * 100 + "%");
    $("quality").setAttribute("aria-valuetext", "%" + im.quality);
    $("qualityVal").textContent = "%" + im.quality;
    setVal("maxKB", im.maxKB);
    setVal("w", im.width); setVal("h", im.height); setVal("pct", im.percent);
    setVal("bg", im.background);
    const lossy = im.format === "jpeg" || im.format === "webp" || im.format === "same";
    $("qualityRow").classList.toggle("is-off", !lossy);
    $("fitRow").hidden = im.resize !== "fit";
    $("pctRow").hidden = im.resize !== "percent";
    $("bgRow").hidden = im.format !== "jpeg";
    $("imgSummary").textContent = im.format === "same" ? "Aynı biçim · " + C.describeImage(im, "jpeg").split(" · ").slice(1).join(" · ") : C.describeImage(im);
    for (const b of $("presets").querySelectorAll("button")) {
      const p = PRESETS.find((x) => x.key === b.dataset.preset);
      b.classList.toggle("is-active", Object.entries(p.image).every(([k, v]) => im[k] === v));
    }
    setVal("from", tx.from); setVal("to", tx.to); setVal("eol", tx.eol);
    $("replace").checked = tx.unmappable === "replace";
    $("outPath").textContent = S().output === "folder" ? S().outputDir : "Her dosya kendi klasörüne";
    $("outPath").title = $("outPath").textContent;
  }
  function renderRun() {
    const n = state.s ? state.s.items.filter((x) => x.status === "ready").length : 0;
    $("convertBtn").textContent = state.running ? "Dönüştürülüyor…" : n ? "Dönüştür (" + n + " dosya)" : "Dönüştür";
    $("convertBtn").disabled = state.running || !n;
  }
  function renderSuggestion() {
    const s = state.suggestion;
    const box = $("suggestion");
    box.hidden = !s;
    if (!s) return;
    const parts = [];
    if (s.image) parts.push("Görüntü: " + C.describeImage(C.normalizeImageOptions({ ...S().image, maxKB: 0, ...s.image }), "jpeg"));
    if (s.text) parts.push("Metin: " + C.ENCODINGS[s.text.to || S().text.to].label + (s.text.eol ? " · satır sonu " + C.EOL_LABEL[s.text.eol] : ""));
    const head = el("div", { class: "qc-suggest__head" }, s.ai ? el("span", { class: "pl-badge qc-badge-ai" }, icon("spark"), "MyMind") : badge("Yerel kural", "info"), el("b", { text: parts.length ? parts.join(" · ") : "Öneri yok" }));
    const list = el("ul", { class: "qc-list qc-small" }, ...s.reasons.map((r) => el("li", { text: r })));
    const foot = el("div", { class: "qc-bar" });
    if (s.ai) foot.appendChild(el("span", { class: "pl-muted qc-small", text: "Kaynak: PluginLabs Hub · My Mind (yerel). Yalnız izinli alanlar alındı" + (s.rejected && s.rejected.length ? "; yok sayılan: " + s.rejected.join(", ") : "") + "." }));
    foot.appendChild(el("span", { class: "qc-grow" }));
    foot.appendChild(btn("Kapat", "pl-btn--ghost pl-btn--sm", () => { state.suggestion = null; renderSuggestion(); }));
    if (parts.length) foot.appendChild(btn("Ayarlara uygula", "pl-btn--secondary pl-btn--sm", applySuggestion, { id: "applySuggestion" }));
    put(box, head, list, foot);
    box.classList.toggle("qc-suggest--ai", !!s.ai);
  }
  async function applySuggestion() {
    const s = state.suggestion;
    if (!s) return;
    const patch = {};
    if (s.image) patch.image = { ...(s.image.maxKB ? {} : { maxKB: 0 }), ...s.image };
    if (s.text) patch.text = s.text;
    await D.setSettings(patch);
    state.suggestion = null;
    renderSuggestion();
    toast("Öneri ayarlara uygulandı. Dönüştürmek için “Dönüştür”e basın.");
  }
  function renderHistory() {
    const h = state.s.history, st = state.s.stats;
    $("historyCount").textContent = String(st.total);
    const kpi = (label, value, sub) => el("div", { class: "pl-kpi qc-kpi" }, el("span", { class: "pl-label", text: label }), el("b", { class: "pl-kpi__value pl-num", text: value }), sub ? el("span", { class: "pl-muted qc-small", text: sub }) : null);
    put($("kpis"), kpi("Dönüşüm", String(st.total), "kaynak dosya değişmedi"), kpi("Görüntü", String(st.images)), kpi("Metin", String(st.texts)), kpi(st.savedBytes >= 0 ? "Kazanılan alan" : "Eklenen alan", C.fmtBytes(Math.abs(st.savedBytes)), "kaynak toplamına göre"));
    if (!h.length) { put($("history"), el("li", { class: "qc-empty" }, icon("box", "24"), el("b", { text: "Henüz dönüşüm yok" }), el("span", { text: "Dönüştürdüğünüz dosyalar burada boyut ve kalite bilgisiyle listelenir." }))); return; }
    put($("history"), ...h.map((x) => el("li", { class: "qc-hrow" },
      el("span", { class: "qc-thumb qc-thumb--icon" }, icon(x.kind === "text" ? "text" : "image", "20")),
      el("div", { class: "qc-item__main" },
        el("b", { text: x.srcName + " → " + x.outName }),
        el("span", { class: "pl-muted", text: [x.from + " → " + x.to, C.fmtBytes(x.srcBytes) + " → " + C.fmtBytes(x.outBytes) + " (" + C.pctLabel(x.srcBytes, x.outBytes) + ")", x.srcSize && x.outSize ? x.srcSize + " → " + x.outSize : "", x.quality].filter(Boolean).join(" · ") }),
        x.note ? el("span", { class: "pl-muted qc-small", text: x.note }) : null),
      el("span", { class: "pl-muted qc-small qc-nowrap", text: C.fmtDate(x.at) }),
      btn("Klasörde göster", "pl-btn--ghost pl-btn--sm", () => D.reveal(x.id), null, "folder"))));
  }
  function renderStatic() {
    const support = [
      "Görüntü girişi: PNG, JPEG, WebP, GIF (ilk kare), BMP — içerikten tanınır, uzantıya güvenilmez.",
      "Görüntü çıkışı: PNG (kayıpsız), JPEG, WebP; kalite, hedef KB, kutuya sığdırma ya da yüzde (büyütmez).",
      "Metin: UTF-8, UTF-8 (BOM'lu, Excel), UTF-16 LE/BE, Windows-1254 (Türkçe ANSI) arasında; satır sonu CRLF/LF.",
      "Desteklenmeyen: HEIC/AVIF, TIFF, ICO, SVG, PDF, Office belgeleri, arşivler, ses/video. Yürütülebilir ve betik dosyaları reddedilir.",
      "Sınırlar: görüntü 50 MB, en fazla 16384 px kenar ve 100 MP; metin 20 MB; kuyrukta 50 dosya.",
    ];
    put($("support"), ...support.map((t) => el("li", { text: t })));
    const privacy = [
      "Dönüştürme bu bilgisayarda yapılır; dosyalar hiçbir sunucuya yüklenmez. Arayüzün ağ erişimi yoktur.",
      "Kaynak dosya yalnız okunur; dönüştürme öncesi ve sonrası özeti (SHA-256) karşılaştırılır. Sonuç “-donusturuldu” ekli yeni dosyaya yazılır; var olan dosyanın üzerine yazılmaz.",
      "Çıktı yazılmadan önce yeniden açılır ve biçimi, ölçüleri doğrulanır; metin geri çözülerek kaynakla karşılaştırılır (kayıpsızlık).",
      "Görüntüyü yeniden kodlamak EXIF/konum gibi meta verileri çıktıya taşımaz; yön bilgisi uygulanır.",
      "MyMind (isteğe bağlı): yalnız ihtiyaç cümlesi ile dosyanın türü/ölçüsü gönderilir; dosya adı, yolu ve içeriği gönderilmez. Her istekte onay sorulur.",
      "Geçmiş (dosya yolları) ve MyMind anahtarı bu bilgisayarda, Windows kasasıyla (DPAPI) şifreli tutulur.",
    ];
    put($("privacy"), ...privacy.map((t) => el("li", { text: t })));
    const encOpts = (auto) => [...(auto ? [["auto", "Otomatik algıla"]] : []), ...Object.entries(C.ENCODINGS).map(([k, v]) => [k, v.label])].map(([v, t]) => el("option", { value: v, text: t }));
    put($("from"), ...encOpts(true));
    put($("to"), ...encOpts(false));
    put($("presets"), ...PRESETS.map((p) => { const b = el("button", { type: "button", class: "qc-chip", "data-preset": p.key, text: p.label }); b.addEventListener("click", guard(async () => { await D.setSettings({ image: p.image }); toast("Hazır ayar: " + p.label); })); return b; }));
  }
  function render() {
    const s = state.s;
    if (!s) return;
    $("root").classList.toggle("qc-reduce", !!s.settings.reduceMotion);
    $("dropState").textContent = s.drop ? "Açık" : "Gizli";
    $("dropState").className = "pl-badge" + (s.drop ? " pl-badge--success" : "");
    $("mymindState").textContent = s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (s.hasKey ? " pl-badge--success" : "");
    $("setAutorun").checked = s.settings.dropAutorun;
    $("setMotion").checked = s.settings.reduceMotion;
    $("dirInfo").textContent = s.settings.output === "folder" ? "Seçili: " + s.settings.outputDir : "Şu an: her dosya kendi klasörüne yazılır.";
    $("foot").textContent = "Dönüştürme bu bilgisayarda yapılır; dosyalar hiçbir yere yüklenmez. Kaynak dosya değişmez, sonuç yeni dosyaya yazılır." + (s.vault ? " Geçmiş Windows kasasıyla (DPAPI) şifreli." : " Kasa kullanılamıyor: geçmiş düz dosyada.");
    renderQueue(); renderSettings(); renderRun(); renderHistory();
  }

  // ---- Olaylar ----
  for (const b of document.querySelectorAll("[data-nav]")) b.addEventListener("click", () => setView(b.dataset.nav));
  const dz = $("dropzone");
  const addPaths = guard(async (paths) => {
    if (!paths.length) { toast("Bırakılan öğenin dosya yolu alınamadı.", true); return; }
    const r = await D.add(paths);
    const bad = r.added.filter((x) => x.status === "blocked").length;
    toast(r.added.length + " dosya kuyruğa eklendi" + (bad ? " (" + bad + " desteklenmiyor)" : "") + (r.skipped ? "; " + r.skipped + " dosya sınır nedeniyle eklenmedi" : "") + ".", bad === r.added.length && bad > 0);
  });
  for (const t of ["dragenter", "dragover"]) document.addEventListener(t, (e) => { e.preventDefault(); if (state.view === "convert") dz.classList.add("is-dragover"); });
  document.addEventListener("dragleave", (e) => { if (!e.relatedTarget) dz.classList.remove("is-dragover"); });
  document.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("is-dragover"); if (e.dataTransfer && e.dataTransfer.files.length) { setView("convert"); addPaths(D.pathsFor(e.dataTransfer.files)); } });
  $("pickBtn").addEventListener("click", guard(async (e) => { e.stopPropagation(); const r = await D.pick(); if (r && !r.cancelled) toast(r.added.length + " dosya kuyruğa eklendi."); }));
  dz.addEventListener("click", (e) => { if (e.target === dz || !e.target.closest("button")) $("pickBtn").click(); });
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("pickBtn").click(); } });
  $("clearDone").addEventListener("click", guard(() => D.clear("done")));
  $("convertBtn").addEventListener("click", guard(() => run()));
  const img = (patch) => D.setSettings({ image: patch });
  for (const b of $("fmtSeg").querySelectorAll("button")) b.addEventListener("click", guard(() => img({ format: b.dataset.fmt })));
  for (const b of $("rsSeg").querySelectorAll("button")) b.addEventListener("click", guard(() => img({ resize: b.dataset.rs })));
  for (const b of $("outSeg").querySelectorAll("button")) b.addEventListener("click", guard(async () => {
    if (b.dataset.out === "folder" && !S().outputDir) { const r = await D.chooseOutput(); if (r.cancelled) return; }
    else await D.setSettings({ output: b.dataset.out });
  }));
  $("quality").addEventListener("input", () => { $("qualityVal").textContent = "%" + $("quality").value; $("quality").style.setProperty("--pl-val", (($("quality").value - 10) / 90) * 100 + "%"); });
  $("quality").addEventListener("change", guard(() => img({ quality: Number($("quality").value) })));
  for (const [id, key] of [["maxKB", "maxKB"], ["w", "width"], ["h", "height"], ["pct", "percent"]]) $(id).addEventListener("change", guard(() => img({ [key]: Number($(id).value) })));
  $("bg").addEventListener("change", guard(() => img({ background: $("bg").value })));
  for (const [id, key] of [["from", "from"], ["to", "to"], ["eol", "eol"]]) $(id).addEventListener("change", guard(() => D.setSettings({ text: { [key]: $(id).value } })));
  $("replace").addEventListener("change", guard(() => D.setSettings({ text: { unmappable: $("replace").checked ? "replace" : "stop" } })));
  $("chooseDir").addEventListener("click", guard(async () => { const r = await D.chooseOutput(); if (!r.cancelled) toast("Çıktı klasörü: " + r.dir); }));
  $("setAutorun").addEventListener("change", guard(() => D.setSettings({ dropAutorun: $("setAutorun").checked })));
  $("setMotion").addEventListener("change", guard(() => D.setSettings({ reduceMotion: $("setMotion").checked })));
  $("dropBtn").addEventListener("click", guard(() => D.showDrop(!state.s.drop)));
  const firstInfo = () => { const it = state.s.items.find((x) => x.status !== "blocked"); return it ? { kind: it.kind } : null; };
  $("suggestBtn").addEventListener("click", guard(() => {
    const need = $("need").value.trim();
    if (!need) { toast("Önce ne istediğinizi bir cümleyle yazın.", true); $("need").focus(); return; }
    const s = C.suggest(need, firstInfo());
    state.suggestion = { ...s, ai: false };
    renderSuggestion();
  }));
  $("need").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("suggestBtn").click(); } });
  $("aiBtn").addEventListener("click", guard(async () => {
    if (!state.s.hasKey) { openMymind(); return; }
    const need = $("need").value.trim();
    if (!need) { toast("Önce ne istediğinizi bir cümleyle yazın.", true); $("need").focus(); return; }
    const it = state.s.items.find((x) => x.status !== "blocked");
    busy("MyMind ayar öneriyor…");
    const r = await D.mymind.suggest(need, it ? it.id : null);
    busy(null);
    if (!r.approved) { toast("Gönderim iptal edildi; MyMind'a hiçbir şey gönderilmedi."); return; }
    if (r.empty) { toast("MyMind geçerli bir ayar önermedi.", true); return; }
    state.suggestion = { image: r.image, text: r.text, reasons: [r.reason || "MyMind gerekçe vermedi."], ai: true, rejected: r.rejected };
    renderSuggestion();
  }));

  // MyMind bağlantı penceresi
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Bağlı. Yeni anahtar yapıştırırsanız eskisinin yerine geçer." : state.s.vault ? "Anahtar kasada şifreli saklanacak." : "Kasa kullanılamıyor: anahtar yalnız bu oturum boyunca bellekte tutulur.";
    $("mymindDialog").showModal();
    $("mymindKey").focus();
  }
  $("openMymind").addEventListener("click", openMymind);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { const r = await D.mymind.setKey($("mymindKey").value); $("mymindDialog").close(); toast(r.stored === "vault" ? "MyMind anahtarı kasaya kaydedildi." : "MyMind anahtarı bu oturum için bellekte."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("MyMind anahtarı kaldırıldı."); }));

  // Komut paleti (Ctrl+K)
  const COMMANDS = () => [
    { group: "Eylemler", label: "Dosya seç", run: () => $("pickBtn").click() },
    { group: "Eylemler", label: "Dönüştür", meta: "Ctrl Enter", run: () => run() },
    { group: "Eylemler", label: state.s.drop ? "Bırakma kutusunu gizle" : "Bırakma kutusunu aç", run: () => D.showDrop(!state.s.drop) },
    { group: "Eylemler", label: "Tamamlananları kuyruktan temizle", run: () => D.clear("done") },
    { group: "Eylemler", label: "Çıktı klasörü seç", run: () => $("chooseDir").click() },
    { group: "Eylemler", label: "MyMind bağlantısı", run: openMymind },
    ...PRESETS.map((p) => ({ group: "Hazır ayarlar", label: p.label, run: () => D.setSettings({ image: p.image }) })),
    { group: "Hazır ayarlar", label: "Metin: Excel için UTF-8 (BOM'lu)", run: () => D.setSettings({ text: { to: "utf-8-bom" } }) },
    { group: "Hazır ayarlar", label: "Metin: UTF-8", run: () => D.setSettings({ text: { to: "utf-8" } }) },
    { group: "Hazır ayarlar", label: "Metin: Windows-1254 (Türkçe ANSI)", run: () => D.setSettings({ text: { to: "windows-1254" } }) },
    { group: "Bölümler", label: "Dönüştür", meta: "Ctrl 1", run: () => setView("convert") },
    { group: "Bölümler", label: "Geçmiş", meta: "Ctrl 2", run: () => setView("history") },
    { group: "Bölümler", label: "Ayarlar ve gizlilik", meta: "Ctrl 3", run: () => setView("settings") },
  ];
  const pal = { list: [], i: 0 };
  function renderPalette() {
    const q = C.fold($("paletteInput").value.trim());
    pal.list = COMMANDS().filter((c) => !q || C.fold(c.group + " " + c.label).includes(q));
    pal.i = Math.min(pal.i, Math.max(0, pal.list.length - 1));
    const out = [];
    let g = "";
    pal.list.forEach((c, i) => {
      if (c.group !== g) { g = c.group; out.push(el("div", { class: "pl-cmdk__group pl-label", text: g })); }
      const row = el("div", { class: "pl-menuitem" + (i === pal.i ? " is-active" : ""), role: "option", id: "cmd-" + i, "aria-selected": i === pal.i ? "true" : "false" }, c.label, c.meta ? el("span", { class: "pl-menuitem__meta", text: c.meta }) : null);
      row.addEventListener("click", () => execPalette(i));
      out.push(row);
    });
    if (!pal.list.length) out.push(el("div", { class: "pl-muted qc-small qc-pad", text: "Eşleşen komut yok." }));
    put($("paletteList"), ...out);
    $("paletteInput").setAttribute("aria-activedescendant", pal.list.length ? "cmd-" + pal.i : "");
  }
  function openPalette() { $("paletteInput").value = ""; pal.i = 0; renderPalette(); $("palette").showModal(); $("paletteInput").focus(); }
  const execPalette = guard(async (i) => { const c = pal.list[i]; $("palette").close(); if (c) await c.run(); });
  $("openPalette").addEventListener("click", openPalette);
  $("paletteInput").addEventListener("input", () => { pal.i = 0; renderPalette(); });
  $("paletteInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pal.i = Math.min(pal.list.length - 1, pal.i + 1); renderPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pal.i = Math.max(0, pal.i - 1); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); execPalette(pal.i); }
  });
  $("palette").addEventListener("click", (e) => { if (e.target === $("palette")) $("palette").close(); });
  document.addEventListener("keydown", guard(async (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); if ($("palette").open) $("palette").close(); else openPalette(); }
    else if (mod && e.key === "Enter") { e.preventDefault(); await run(); }
    else if (mod && ["1", "2", "3"].includes(e.key)) { e.preventDefault(); setView(["convert", "history", "settings"][Number(e.key) - 1]); }
  }));

  // ---- Başlangıç ----
  D.onState((s) => { state.s = s; render(); });
  D.onAutorun((ids) => { run(ids); });
  renderStatic();
  D.state().then((s) => {
    state.s = s;
    setView("convert");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) $("root").classList.add("qc-reduce");
    document.documentElement.dataset.ready = "1";
  });
})();
