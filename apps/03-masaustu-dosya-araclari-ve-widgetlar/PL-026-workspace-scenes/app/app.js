/* Workspace Scenes — masaüstü arayüzü. Her metin yalnız textContent / value ile yazılır (HTML olarak yazma yok).
 * Arayüz dosya sistemine ve ağa erişmez, hiçbir şeyi açmaz; açma ve MyMind istekleri ana süreçte onay penceresinden geçer. */
(function () {
  const C = window.WSCore;
  const D = window.wsDesktop;
  const $ = (id) => document.getElementById(id);
  const state = { s: null, current: null, view: "scene", archived: false, filter: "", checks: {}, run: null, ai: null, aiFor: null };

  const ICONS = {
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    alert: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    url: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    app: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
    up: "M18 15l-6-6-6 6",
    down: "M6 9l6 6 6-6",
    x: "M18 6 6 18M6 6l12 12",
    play: "M7 4v16l13-8z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4",
    paste: "M9 4h6v3H9zM8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
    plus: "M12 5v14M5 12h14",
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
  function toast(message, isError, action) {
    const t = el("div", { class: "pl-toast", role: isError ? "alert" : "status" }, icon(isError ? "alert" : "check", "20"), el("div", { class: "pl-toast__body", text: message }));
    if (isError) t.style.setProperty("--pl-c", "var(--pl-danger)");
    if (action) { const b = el("button", { type: "button", class: "pl-toast__action", text: action.label }); b.addEventListener("click", guard(async () => { t.remove(); await action.run(); })); t.appendChild(b); }
    $("toasts").replaceChildren(t);
    setTimeout(() => t.remove(), action ? 8000 : 5000);
  }
  const clean = (e) => String(e && e.message ? e.message : e).replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { busy(null); toast("İşlem başarısız: " + clean(e), true); } };
  const btn = (text, cls, onClick, attrs, ico) => { const b = el("button", { type: "button", class: "pl-btn pl-btn--sm " + cls, ...(attrs || {}) }, ico ? icon(ico) : null, text); b.addEventListener("click", guard(onClick)); return b; };
  const iconBtn = (ico, label, onClick, disabled) => { const b = el("button", { type: "button", class: "ws-icon-btn", title: label, "aria-label": label, disabled: !!disabled }, icon(ico)); b.addEventListener("click", guard(onClick)); return b; };
  const badge = (text, tone) => el("span", { class: "pl-badge" + (tone ? " pl-badge--" + tone : ""), text });
  function busy(text) { $("busy").hidden = !text; $("busyText").textContent = text || ""; }
  const cur = () => (state.s ? state.s.scenes.find((x) => x.id === state.current) : null) || null;
  const sec = (ms) => (ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " sn";

  async function save(patch) {
    const s = cur();
    if (!s) return null;
    return D.saveScene({ id: s.id, ...patch });
  }

  // ---- Kenar çubuğu ----
  function renderSide() {
    const all = state.s.scenes;
    const list = C.filterScenes(all, state.filter, state.archived);
    $("listTitle").textContent = state.archived ? "Arşivlenen sahneler" : "Sahneler";
    $("archiveCount").textContent = String(all.filter((s) => s.archived).length);
    $("toggleArchive").firstChild.textContent = state.archived ? "Sahnelere dön" : "Arşiv";
    $("mymindState").textContent = state.s.hasKey ? "Bağlı" : "Kapalı";
    $("mymindState").className = "pl-badge" + (state.s.hasKey ? " pl-badge--success" : "");
    const box = $("sceneList");
    box.replaceChildren(...list.map((s) => {
      const b = el("button", { type: "button", class: "ws-scene" + (s.id === state.current && state.view === "scene" ? " is-current" : ""), role: "listitem", "aria-current": s.id === state.current ? "true" : false },
        el("b", { text: s.name }), el("span", { text: s.items.length + " öğe" + (s.launches.length ? " · son açılış " + C.formatWhen(s.launches[s.launches.length - 1].at) : "") }));
      b.addEventListener("click", () => select(s.id));
      return b;
    }));
    if (!list.length) box.appendChild(el("p", { class: "pl-muted ws-small ws-empty", text: state.archived ? "Arşiv boş." : state.filter ? "Eşleşen sahne yok." : "Henüz sahne yok." }));
  }
  function select(id) {
    state.current = id;
    state.view = "scene";
    state.run = null;
    state.checks = {};
    if (state.aiFor !== id) state.ai = null;
    render();
  }

  // ---- Karşılama: şablonlar ----
  function renderWelcome() {
    const tpls = state.s.templates.map((t) => {
      const b = el("button", { type: "button", class: "ws-tpl" }, el("b", { text: t.name }), el("span", { text: t.purpose }));
      b.addEventListener("click", guard(async () => { const n = await D.fromTemplate(t.key); select(n.id); toast("“" + n.name + "” sahnesi şablondan oluşturuldu. Klasör ve uygulamalarınızı ekleyin."); }));
      return b;
    });
    $("editor").replaceChildren(el("div", { class: "ws-welcome" },
      el("h2", { class: "pl-h2", text: "Çalışma ortamınızı tek tıkla kurun" }),
      el("p", { class: "pl-muted ws-tight", text: "Bir sahne; iş, araştırma ya da kişisel çalışma için her seferinde açtığınız uygulamaları, klasörleri, dosyaları ve web sayfalarını bir arada tutar. Açmadan önce dizinin tamamını görür ve onaylarsınız. Workspace Scenes hiçbir şeyi kapatmaz." }),
      el("div", { class: "ws-side__title pl-muted", text: "Şablondan başla" }),
      el("div", { class: "ws-templates" }, ...tpls),
      el("div", { class: "ws-bar" }, btn("Boş sahne oluştur", "pl-btn--secondary", newScene, null, "plus"), btn("Yedekten içe aktar", "pl-btn--ghost", importData))));
    $("preview").replaceChildren(el("div", { class: "ws-card" }, el("h3", { text: "Nasıl çalışır" }),
      el("ol", { class: "ws-steps" },
        el("li", { text: "Sahneye bağlantı, klasör, uygulama (.exe/.lnk) ya da dosya ekleyin; sırayı belirleyin." }),
        el("li", { text: "Önizlemede açılış dizisini ve eksik öğeleri denetleyin." }),
        el("li", { text: "“Sahneyi aç” ile onay penceresinde listeyi görün; onaylayınca öğeler sırayla açılır." }),
        el("li", { text: "İsterseniz sahne için masaüstü kısayolu oluşturun." }))));
  }
  async function newScene() {
    const n = await D.saveScene({ name: "Yeni sahne " + (state.s.scenes.length + 1) });
    select(n.id);
    setTimeout(() => { const i = $("sceneName"); if (i) { i.focus(); i.select(); } }, 30);
  }

  // ---- Düzenleyici ----
  function renderEditor(s) {
    const name = el("input", { class: "pl-input ws-name", id: "sceneName", value: s.name, maxlength: "60", "aria-label": "Sahne adı", spellcheck: "false" });
    const commitName = guard(async () => { const v = name.value.trim(); if (v && v !== s.name) await save({ name: v }); else name.value = s.name; });
    name.addEventListener("change", commitName);
    name.addEventListener("keydown", (e) => { if (e.key === "Enter") name.blur(); });
    const purpose = el("input", { class: "pl-input", id: "scenePurpose", value: s.purpose, maxlength: "200", placeholder: "Amaç (ör. tez için kaynak tarama)", "aria-label": "Sahnenin amacı" });
    purpose.addEventListener("change", guard(() => save({ purpose: purpose.value })));
    const delay = el("select", { class: "pl-select", id: "sceneDelay", "aria-label": "Adımlar arası bekleme" }, ...state.s.delays.map((d) => el("option", { value: String(d), text: d ? "Adımlar arası " + sec(d) : "Beklemeden aç" })));
    delay.value = String(s.delayMs);
    delay.addEventListener("change", guard(() => save({ delayMs: Number(delay.value) })));

    const rows = s.items.map((it, k) => {
      const chk = state.checks[it.id];
      const label = el("input", { class: "ws-item__label", value: it.label, maxlength: "80", "aria-label": (k + 1) + ". öğenin adı" });
      label.addEventListener("change", guard(() => save({ items: s.items.map((x) => (x.id === it.id ? { ...x, label: label.value } : x)) })));
      const main = el("div", { class: "ws-item__main" }, label, el("div", { class: "ws-item__target", text: it.target + (chk && !chk.ok ? " — " + chk.error : "") }));
      if (it.type === "app") {
        const args = el("input", { class: "pl-input ws-item__args", value: it.args, maxlength: "300", placeholder: "Başlatma argümanları (isteğe bağlı)", "aria-label": "Başlatma argümanları", spellcheck: "false" });
        args.addEventListener("change", guard(() => save({ items: s.items.map((x) => (x.id === it.id ? { ...x, args: args.value } : x)) })));
        main.appendChild(args);
      }
      const on = el("input", { type: "checkbox", checked: it.enabled, "aria-label": "Açılışa dahil", title: "Açılışa dahil" });
      on.addEventListener("change", guard(() => save({ items: s.items.map((x) => (x.id === it.id ? { ...x, enabled: on.checked } : x)) })));
      const move = (dir) => async () => { const a = s.items.slice(); const j = k + dir; [a[k], a[j]] = [a[j], a[k]]; await save({ items: a }); };
      const remove = async () => {
        const before = s.items.slice();
        await save({ items: s.items.filter((x) => x.id !== it.id) });
        toast("“" + it.label + "” sahneden çıkarıldı.", false, { label: "Geri al", run: () => D.saveScene({ id: s.id, items: before }) });
      };
      return el("div", { class: "ws-item" + (it.enabled ? "" : " is-off") + (chk && !chk.ok ? " is-bad" : ""), "data-item": it.id },
        el("span", { class: "ws-item__n", text: String(k + 1) }),
        el("span", { class: "ws-type ws-type--" + it.type, title: C.TYPE_LABEL[it.type] }, icon(it.type)),
        main,
        el("div", { class: "ws-item__tools" }, el("label", { class: "pl-switch", title: "Açılışa dahil" }, on),
          iconBtn("up", "Yukarı taşı", move(-1), k === 0), iconBtn("down", "Aşağı taşı", move(1), k === s.items.length - 1), iconBtn("x", "Sahneden çıkar", remove)));
    });
    const items = el("div", { class: "ws-items", id: "items" }, ...rows);
    if (!rows.length) items.appendChild(el("p", { class: "ws-empty", text: "Sahne boş. Aşağıdan bağlantı, klasör, uygulama ya da dosya ekleyin." }));

    const pick = (type) => async () => {
      const r = await D.pickItem(s.id, type);
      if (r && r.exists) toast("Bu öğe sahnede zaten var.");
      else if (r && r.id) toast("“" + r.label + "” eklendi.");
    };
    const head = el("div", { class: "ws-head" }, name, el("div", { class: "ws-head__tools" },
      btn("Kopyala", "pl-btn--ghost", async () => { const n = await D.duplicate(s.id); select(n.id); toast("Sahnenin kopyası oluşturuldu."); }),
      state.s.canShortcut && !s.archived ? btn("Masaüstü kısayolu", "pl-btn--ghost", async () => { const r = await D.shortcut(s.id); toast("Kısayol oluşturuldu: " + r.file.split(/[\\/]/).pop() + ". Açıldığında yine onay istenir."); }, { id: "shortcutBtn" }) : null,
      btn(s.archived ? "Arşivden çıkar" : "Arşivle", "pl-btn--ghost", async () => {
        await D.archive(s.id, !s.archived);
        const was = s.archived;
        toast(was ? "Sahne arşivden çıkarıldı." : "Sahne arşivlendi (silinmedi).", false, { label: "Geri al", run: () => D.archive(s.id, was) });
      }, { id: "archiveBtn" })));
    $("editor").replaceChildren(head, purpose, el("div", { class: "ws-bar" }, delay, el("span", { class: "pl-muted ws-small", text: s.items.length + " / " + C.MAX_ITEMS + " öğe" })), items,
      el("div", { class: "ws-addbar" },
        btn("Bağlantı", "pl-btn--secondary", () => openUrlDialog(), { id: "addUrl" }, "url"),
        btn("Bağlantıları yapıştır", "pl-btn--ghost", () => { $("pasteInput").value = ""; $("pasteDialog").showModal(); }, { id: "pasteUrls" }, "paste"),
        btn("Klasör", "pl-btn--secondary", pick("folder"), { id: "addFolder" }, "folder"),
        btn("Uygulama", "pl-btn--secondary", pick("app"), { id: "addApp" }, "app"),
        btn("Dosya", "pl-btn--secondary", pick("file"), { id: "addFile" }, "file")));
  }

  // ---- Önizleme: açılış dizisi, ölçüm, öneriler ----
  function renderPreview(s) {
    const plan = C.launchPlan(s);
    const run = state.run && state.run.sceneId === s.id ? state.run : null;
    const live = state.s.running && state.s.running.sceneId === s.id ? state.s.running : null;
    const res = new Map(run && run.results ? run.results.map((r) => [r.id, r]) : []);
    const planList = el("ol", { class: "ws-plan", id: "plan" }, ...plan.steps.map((st) => {
      const r = res.get(st.id);
      const chk = state.checks[st.id];
      const cls = live ? (st.n < live.step ? "is-done" : st.n === live.step ? "is-now" : "") : r ? (r.ok ? "is-done" : "is-fail") : chk && !chk.ok ? "is-fail" : "";
      const note = r && !r.ok ? r.error : chk && !chk.ok ? chk.error : C.TYPE_LABEL[st.type];
      return el("li", { class: cls }, el("span", { class: "ws-plan__n", text: String(st.n) }), el("div", { class: "ws-plan__t" }, el("span", { text: st.label }), el("small", { text: note })),
        r ? badge(r.ok ? "Açıldı" : "Açılamadı", r.ok ? "success" : "danger") : chk ? badge(chk.ok ? "Hazır" : "Eksik", chk.ok ? "success" : "danger") : null);
    }));
    if (!plan.steps.length) planList.appendChild(el("li", {}, el("span"), el("span", { class: "pl-muted ws-small", text: "Açılışa dahil öğe yok." })));
    const launch = el("button", { type: "button", class: "pl-btn pl-btn--primary ws-launch", id: "launchBtn", disabled: !plan.steps.length || !!state.s.running || s.archived }, icon("play"), live ? "Açılıyor… " + live.step + " / " + live.total : "Sahneyi aç (" + plan.steps.length + " öğe)");
    launch.addEventListener("click", guard(() => launchCurrent()));
    const card1 = el("div", { class: "ws-card" },
      el("h3", { text: "Açılış dizisi" }, badge("Kapatılan: 0", "success")),
      planList,
      launch,
      el("div", { class: "ws-bar" }, btn("Denetle", "pl-btn--ghost", checkCurrent, { id: "checkBtn" }), el("span", { class: "pl-muted ws-small ws-grow", text: "Tahmini " + sec(plan.estimateMs) + " · " + (run ? (run.approved === false ? "son deneme onaylanmadı" : "son açılış " + sec(run.ms) + ", " + run.opened + " açıldı" + (run.failed ? ", " + run.failed + " açılamadı" : "")) : "Ctrl+Enter ile de açılır") })));

    const t = C.timing(s);
    const manual = el("input", { class: "pl-input", id: "manualMin", type: "number", min: "0.5", max: "240", step: "0.5", value: s.manualMinutes == null ? "" : String(s.manualMinutes), "aria-label": "Elle kurulum süresi (dakika)" });
    manual.addEventListener("change", guard(() => save({ manualMinutes: manual.value ? Number(manual.value) : null })));
    const card2 = el("div", { class: "ws-card", id: "timing" },
      el("h3", { text: "Kurulum süresi" }, t.reduction != null ? badge("%" + t.reduction + " daha hızlı", t.reduction >= 60 ? "success" : "warning") : null),
      el("div", { class: "ws-metric" },
        el("div", {}, el("b", { text: String(t.runs) }), el("span", { text: "açılış" })),
        el("div", {}, el("b", { text: t.medianSec == null ? "—" : t.medianSec.toLocaleString("tr-TR") + " sn" }), el("span", { text: "ortanca süre" })),
        el("div", {}, el("b", { text: t.reduction == null ? "—" : "%" + t.reduction }), el("span", { text: "azalma (hedef ≥ %60)" }))),
      el("label", { class: "ws-manual" }, "Bu ortamı elle kurmak yaklaşık", manual, "dakika sürüyor."));

    const sugg = C.suggestMissing(s);
    const ai = state.aiFor === s.id && state.ai ? state.ai : [];
    const rowsS = [...ai, ...sugg].map((g) => {
      const add = g.target
        ? btn("Ekle", "pl-btn--secondary", async () => { await D.addItem(s.id, { type: g.type, target: g.target, label: g.label }); if (g.ai) state.ai = state.ai.filter((x) => x !== g); toast("“" + g.label + "” eklendi."); })
        : btn(g.type === "url" ? "Adres gir" : "Seç…", "pl-btn--ghost", async () => { if (g.type === "url") return openUrlDialog(g.label); const r = await D.pickItem(s.id, g.type); if (r && r.id) toast("“" + r.label + "” eklendi."); });
      return el("div", { class: "ws-sugg" }, el("span", { class: "ws-type ws-type--" + g.type }, icon(g.type)),
        el("div", { class: "ws-sugg__main" }, el("span", { text: g.label }), el("small", { text: (g.ai ? "MyMind · " : "") + g.reason + (g.target ? " · " + C.hostOf(g.target) : "") })), add);
    });
    const askBtn = btn("MyMind'dan öner", "pl-btn--ghost", askMymind, { id: "askBtn", title: "Görev adına göre eksik araç önerir (onayınızla; yollar gönderilmez)" }, "spark");
    const card3 = el("div", { class: "ws-card", id: "suggestions" },
      el("h3", { text: "Eksik araç önerileri" }, askBtn),
      ...(rowsS.length ? rowsS : [el("p", { class: "pl-muted ws-small", text: "Sahne adına/amacına uyan bir öneri yok. Amacı yazın ya da MyMind'a sorun." })]),
      el("p", { class: "pl-muted ws-small", text: "Öneriler siz “Ekle” demeden sahneye girmez." }));
    $("preview").replaceChildren(card1, card2, card3);
  }

  async function checkCurrent() {
    const s = cur();
    const r = await D.check(s.id);
    state.checks = Object.fromEntries(r.map((x) => [x.id, x]));
    const bad = r.filter((x) => !x.ok).length;
    render();
    toast(bad ? bad + " öğe bulunamadı; yolunu güncelleyin ya da açılıştan çıkarın." : "Tüm öğeler hazır.", !!bad);
  }
  async function launchCurrent() {
    const s = cur();
    if (!s || state.s.running) return;
    const r = await D.launch(s.id);
    state.run = { sceneId: s.id, ...r };
    if (!r.approved) { toast("Açılmadı: onay verilmedi."); render(); return; }
    render();
    toast(r.failed ? r.opened + " öğe açıldı, " + r.failed + " öğe açılamadı (" + sec(r.ms) + ")." : "Sahne açıldı: " + r.opened + " öğe, " + sec(r.ms) + ".", !!r.failed);
  }
  async function askMymind() {
    const s = cur();
    if (!state.s.hasKey) { openMymind(); return; }
    busy("MyMind öneriyor…");
    const r = await D.mymind.suggest(s.id, s.name + (s.purpose ? " — " + s.purpose : ""));
    busy(null);
    if (!r.approved) { toast("Gönderilmedi: onay verilmedi."); return; }
    if (!r.ok) { toast(r.error, true); return; }
    state.ai = r.suggestions;
    state.aiFor = s.id;
    render();
    toast(r.suggestions.length ? "MyMind " + r.suggestions.length + " öneri verdi" + (r.rejected ? " (" + r.rejected + " geçersiz öneri elendi)" : "") + "." : "MyMind yeni öneri bulmadı.");
  }

  // ---- Ayarlar ----
  function renderSettings() {
    const sel = $("defaultDelay");
    if (!sel.options.length) for (const d of state.s.delays) sel.appendChild(el("option", { value: String(d), text: d ? sec(d) : "Beklemeden" }));
    sel.value = String(state.s.settings.defaultDelayMs);
    $("privacy").replaceChildren(...[
      "Workspace Scenes yalnız açar: hiçbir kod yolu uygulama, pencere, sekme ya da işlem kapatmaz.",
      "Her açılış öncesinde dizinin tamamı (tür, ad, tam hedef) onay penceresinde gösterilir; masaüstü kısayolundan açılışta da.",
      "Bağlantılar yalnız http/https olabilir ve varsayılan tarayıcıda açılır; hesaplara otomatik giriş yapılmaz, parola saklanmaz.",
      "Uygulamalar kabuk (cmd/PowerShell) olmadan doğrudan başlatılır; argümanlar yalnız sizin yazdıklarınızdır.",
      "Sahneler bu bilgisayarda " + (state.s.vault ? "işletim sistemi kasasıyla (DPAPI) şifreli" : "düz JSON olarak (bu sistemde kasa yok)") + " tutulur; ağa gönderilmez.",
      "MyMind (isteğe bağlı): her istekte onay; yalnız görev adı/amacı ile öğelerin türü ve adı (bağlantılarda yalnız alan adı) gider. Yollar ve tam adresler gitmez.",
      "İlk sürüm pencere konumu/çoklu ekran yerleşimi yapmaz; yalnız açılış dizisi.",
    ].map((t) => el("li", { text: t })));
  }

  function render() {
    if (!state.s) return;
    renderSide();
    $("sceneView").hidden = state.view !== "scene";
    $("settingsView").hidden = state.view !== "settings";
    if (state.view === "settings") { renderSettings(); return; }
    const s = cur();
    if (!s) { renderWelcome(); return; }
    const active = document.activeElement && document.activeElement.id;
    renderEditor(s);
    renderPreview(s);
    if (active && $(active) && /^(sceneName|scenePurpose|manualMin)$/.test(active)) $(active).focus();
  }

  // ---- Diyaloglar ----
  function openUrlDialog(label) {
    $("urlInput").value = "";
    $("urlLabel").value = label || "";
    $("urlDialog").showModal();
    $("urlInput").focus();
  }
  $("urlCancel").addEventListener("click", () => $("urlDialog").close());
  $("urlOk").addEventListener("click", guard(async () => {
    const s = cur();
    const n = await D.addItem(s.id, { type: "url", target: $("urlInput").value, label: $("urlLabel").value });
    $("urlDialog").close();
    toast("“" + n.label + "” eklendi.");
  }));
  $("urlInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("urlOk").click(); } });
  $("pasteCancel").addEventListener("click", () => $("pasteDialog").close());
  $("pasteOk").addEventListener("click", guard(async () => {
    const r = await D.pasteUrls(cur().id, $("pasteInput").value);
    $("pasteDialog").close();
    toast(r.found ? r.added + " bağlantı eklendi" + (r.found > r.added ? " (" + (r.found - r.added) + " zaten vardı ya da sınır doldu)" : "") + "." : "Metinde bağlantı bulunamadı.", !r.found);
  }));
  function openMymind() {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = state.s.hasKey ? "Anahtar kayıtlı" + (state.s.vault ? " (Windows kasasında şifreli)." : " (yalnız bu oturumda; kasa yok).") : "Anahtar kayıtlı değil.";
    $("mymindDialog").showModal();
  }
  $("openMymind").addEventListener("click", openMymind);
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", guard(async () => { await D.mymind.setKey($("mymindKey").value); $("mymindDialog").close(); toast("MyMind bağlantısı kaydedildi."); }));
  $("mymindForget").addEventListener("click", guard(async () => { await D.mymind.setKey(null); $("mymindDialog").close(); toast("Anahtar kaldırıldı."); }));

  async function importData() {
    const r = await D.importData();
    if (r.cancelled) return;
    toast(r.added + " sahne içe aktarıldı" + (r.skipped ? ", " + r.skipped + " atlandı" : "") + ".");
  }
  $("newScene").addEventListener("click", guard(newScene));
  $("filter").addEventListener("input", () => { state.filter = $("filter").value; renderSide(); });
  $("toggleArchive").addEventListener("click", () => { state.archived = !state.archived; state.view = "scene"; const first = C.filterScenes(state.s.scenes, "", state.archived)[0]; state.current = first ? first.id : null; render(); });
  document.querySelector('[data-nav="settings"]').addEventListener("click", () => { state.view = "settings"; render(); });
  $("closeSettings").addEventListener("click", () => { state.view = "scene"; render(); });
  $("defaultDelay").addEventListener("change", guard(() => D.setSettings({ defaultDelayMs: Number($("defaultDelay").value) })));
  $("exportBtn").addEventListener("click", guard(async () => { const r = await D.exportData(); if (!r.cancelled) toast(r.count + " sahne dışa aktarıldı."); }));
  $("importBtn").addEventListener("click", guard(importData));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter" && state.view === "scene" && cur() && !document.querySelector("dialog[open]")) { e.preventDefault(); guard(launchCurrent)(); }
    else if (e.ctrlKey && (e.key === "n" || e.key === "N")) { e.preventDefault(); guard(newScene)(); }
    else if (e.ctrlKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); $("filter").focus(); }
  });

  async function requested(id) {
    if (!id || !state.s.scenes.some((s) => s.id === id)) return;
    select(id);
    await guard(launchCurrent)();
  }
  D.onState((s) => { state.s = s; if (state.current && !s.scenes.some((x) => x.id === state.current)) state.current = null; render(); });
  D.onSceneRequested((id) => requested(id));
  (async () => {
    state.s = await D.state();
    const active = state.s.scenes.filter((s) => !s.archived);
    state.current = active.length ? active.sort((a, b) => b.updatedAt - a.updatedAt)[0].id : null;
    render();
    document.documentElement.dataset.ready = "1";
    const pending = await D.takePending();
    if (pending) await requested(pending);
  })();
})();
