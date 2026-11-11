/* PluginLabs Hub Android arayüzü.
   Yerel köprü: window.PLNative (MainActivity içinde HubBridge). Köprü yoksa tarayıcı önizlemesi olarak çalışır. */
(() => {
  "use strict";

  const SPLASH_MS = 4000;
  const KEYS = { mymind: "pl.mymind.v1", pairing: "pl.pairing.v1", usage: "pl.mymind.usage.v1", features: "pl.features.v1" };
  const LEO_PACKAGES = ["com.pluginlabs.leohelper", "com.pluginlabs.leohelper.test"];
  const EXT_KINDS = ["plugin", "library", "template", "asset"];
  const PRODUCT_ACCENT = {
    "leo-helper": "leo",
    "mind-palace": "mindpalace",
    "mutfak-atolyesi": "mutfak",
    "pluginlabs-scrapper": "scrapper",
    mywishlist: "wishlist",
    "flow-dock": "flowdock",
    tweakster: "tweakster",
    "mymind-ai": "mymind",
    "mymind-lite": "mymind",
    "llama-engine": "mymind",
  };
  const ROUTES = {
    catalog: "Uygulamalar",
    devices: "Cihazlar",
    mymind: "MyMind AI",
    account: "Hesap ve abonelik",
    features: "Özellikler",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const native = typeof window.PLNative === "object" && window.PLNative ? window.PLNative : null;
  const nf1 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat("tr-TR");

  const state = {
    route: "catalog",
    filter: "all",
    query: "",
    catalog: { items: [], previews: 0, hubDesktopVersion: "" },
    device: null,
    app: null,
    canInstall: false,
    mymind: null,
    pairing: null,
    installs: {},
    featureApp: "",
    features: {},
    desktop: { info: { paired: false }, status: null, features: null, pairing: null, error: "" },
  };
  const pendingCalls = new Map();
  let callSeq = 0;

  // ---------- Yardımcılar ----------
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function call(name, ...args) {
    if (!native || typeof native[name] !== "function") return null;
    try {
      return native[name](...args);
    } catch {
      return null;
    }
  }
  function callJson(name, ...args) {
    const raw = call(name, ...args);
    if (typeof raw !== "string" || !raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? { ...fallback, ...JSON.parse(v) } : { ...fallback };
    } catch {
      return { ...fallback };
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* depolama kapalıysa ayar yalnız bu oturumda kalır */
    }
  }
  function bytes(n) {
    if (!Number.isFinite(n) || n <= 0) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${i === 0 ? nf0.format(n) : nf1.format(n)} ${units[i]}`;
  }
  function initials(name) {
    const w = String(name).replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
    return ((w[0]?.[0] || "") + (w[1]?.[0] || w[0]?.[1] || "")).toLocaleUpperCase("tr-TR");
  }
  function setProgress(el, pct) {
    const span = el.querySelector("span");
    if (span) span.style.setProperty("width", `${Math.max(0, Math.min(100, pct))}%`);
    el.setAttribute("aria-valuenow", String(Math.round(pct)));
  }
  let toastTimer = 0;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Masaüstü köprüsü ----------
  function desktopCall(op, args = {}) {
    if (!native) return Promise.reject(new Error("Yalnız Android uygulamasında"));
    const reqId = `r${++callSeq}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingCalls.delete(reqId);
        reject(new Error("Masaüstü yanıt vermedi"));
      }, 20000);
      pendingCalls.set(reqId, { resolve, reject, timer });
      call("desktopCall", reqId, op, JSON.stringify(args));
    });
  }
  function readDesktopInfo() {
    state.desktop.info = callJson("desktopInfo") || { paired: false };
  }
  async function refreshDesktop() {
    if (!state.desktop.info.paired) return;
    try {
      const [status, features] = await Promise.all([desktopCall("status"), desktopCall("features.get")]);
      state.desktop.status = status;
      state.desktop.features = features;
      state.desktop.error = "";
    } catch (e) {
      state.desktop.error = e.message;
    }
  }
  const deskInstalled = (id) => state.desktop.status?.installed?.find((x) => x.id === id);

  // ---------- Veri ----------
  function readDevice() {
    state.device = callJson("deviceInfo");
    state.app = callJson("appInfo");
    state.canInstall = call("canInstallPackages") === true;
  }
  function loadMyMind() {
    state.mymind = load(KEYS.mymind, { enabled: true, language: "tr", keepHistory: false, apps: {} });
    // Onay ve veri azaltma kapatılamaz.
    state.mymind.confirmEach = true;
    state.mymind.minimizeData = true;
  }
  function saveMyMind() {
    save(KEYS.mymind, state.mymind);
  }
  function mymindUsage() {
    const u = load(KEYS.usage, { month: "", count: 0 });
    const m = new Date().toISOString().slice(0, 7);
    return u.month === m ? u.count : 0;
  }
  function apkInfo(item) {
    return item.android || null;
  }
  function mymindApps() {
    return state.catalog.items.filter((i) => i.kind === "app" && /mymind/i.test(i.description));
  }

  // ---------- Açılış ekranı (en az 4 sn) ----------
  const STEPS = [
    {
      label: "Arayüz ve yazı tipleri yükleniyor",
      run: async () => {
        if (document.fonts?.ready) await Promise.race([document.fonts.ready, wait(1500)]);
        return "Inter · PluginLabs Advanced tokenları";
      },
    },
    {
      label: "Uygulama kataloğu hazırlanıyor",
      run: async () => {
        try {
          const r = await fetch("catalog.json", { cache: "no-store" });
          if (!r.ok) throw new Error(String(r.status));
          state.catalog = await r.json();
        } catch {
          return "Katalog okunamadı; boş liste gösterilecek";
        }
        const items = state.catalog.items;
        const apk = items.filter((i) => apkInfo(i)?.status === "verified").length;
        const apkPending = items.filter((i) => apkInfo(i)?.status === "pending").length;
        return `${items.length} uygulama · ${apk} kurulabilir APK · ${apkPending} APK doğrulamada`;
      },
    },
    {
      label: "Cihaz bilgileri okunuyor",
      run: async () => {
        readDevice();
        const d = state.device;
        return d ? `${d.manufacturer} ${d.model} · Android ${d.android}` : "Tarayıcı önizlemesi: cihaz köprüsü yok";
      },
    },
    {
      label: "MyMind AI ayarları yükleniyor",
      run: async () => {
        loadMyMind();
        state.features = load(KEYS.features, {});
        return state.mymind.enabled ? "Etkin · her gönderimde onay · veri azaltma" : "Kapalı";
      },
    },
    {
      label: "Bağlı cihazlar kontrol ediliyor",
      run: async () => {
        readDesktopInfo();
        if (!state.desktop.info.paired) return "Eşleşmiş masaüstü yok";
        await Promise.race([refreshDesktop(), wait(2500)]);
        const st = state.desktop.status;
        return st ? `Masaüstü: ${st.hub.host} · Hub ${st.hub.version}` : `Masaüstü: ${state.desktop.info.address} · bağlanılamadı`;
      },
    },
    {
      label: "Ana ekran hazırlanıyor",
      run: async () => {
        render();
        return `${ROUTES.catalog} ekranı hazır`;
      },
    },
  ];

  async function runSplash() {
    const bar = $("#splash-bar");
    const stepEl = $("#splash-step");
    const pctEl = $("#splash-pct");
    const detailEl = $("#splash-detail");
    const list = $("#splash-list");
    list.innerHTML = STEPS.map((s) => `<li>${esc(s.label)}</li>`).join("");
    const rows = [...list.children];

    const start = performance.now();
    const slot = SPLASH_MS / STEPS.length;
    let cap = 0;
    let raf = 0;
    const tick = () => {
      const pct = Math.min(((performance.now() - start) / SPLASH_MS) * 100, cap);
      setProgress(bar, pct);
      pctEl.textContent = `%${Math.floor(pct)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    for (let i = 0; i < STEPS.length; i++) {
      rows[i].classList.add("is-active");
      stepEl.textContent = `${i + 1}/${STEPS.length} · ${STEPS[i].label}…`;
      cap = ((i + 1) / STEPS.length) * 100;
      let detail = "";
      const until = start + slot * (i + 1);
      try {
        [detail] = await Promise.all([STEPS[i].run(), wait(Math.max(0, until - performance.now()))]);
      } catch {
        detail = "Bu adım atlandı";
      }
      detailEl.textContent = detail || "";
      rows[i].classList.remove("is-active");
      rows[i].classList.add("is-done");
    }
    cancelAnimationFrame(raf);
    setProgress(bar, 100);
    pctEl.textContent = "%100";
    stepEl.textContent = "Hazır";
    const v = state.app?.version ? ` · ${state.app.version}` : "";
    $("#splash-foot").textContent = `PLUGINLABS HUB · ANDROID${v}`.toLocaleUpperCase("tr-TR");

    await wait(200);
    const splash = $("#splash");
    splash.classList.add("is-leaving");
    $("#shell").hidden = false;
    await wait(260);
    splash.hidden = true;
    $("#view").focus({ preventScroll: true });
  }

  // ---------- Ekranlar ----------
  function head(title, sub) {
    return `<div class="pl-m-head"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
  }

  function filterItems() {
    const q = state.query.trim().toLocaleLowerCase("tr-TR");
    return state.catalog.items.filter((i) => {
      const a = apkInfo(i);
      if (state.filter === "apk" && !a) return false;
      if (state.filter === "desktop" && !(i.kind === "app" && i.platform === "win32")) return false;
      if (state.filter === "ai" && !["engine", "model"].includes(i.kind)) return false;
      if (state.filter === "ext" && !EXT_KINDS.includes(i.kind)) return false;
      if (state.filter === "features" && !i.features) return false;
      if (q && !`${i.name} ${i.description}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
  }

  function itemAction(i) {
    const a = apkInfo(i);
    const ins = state.installs[i.id];
    if (a && a.status === "verified") {
      if (ins && ins.state === "download") {
        return {
          note: `İndiriliyor · %${ins.percent || 0}`,
          progress: ins.percent || 0,
          button: `<button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="cancel" data-id="${esc(i.id)}">İptal et</button>`,
        };
      }
      if (ins && (ins.state === "verified" || ins.state === "confirm")) {
        return { note: "SHA-256 doğrulandı · Android onayı bekleniyor", button: `<span class="pl-status pl-status--syncing">Onay bekleniyor</span>` };
      }
      if (ins && ins.state === "installed") {
        const pkg = ins.package || a.package;
        return {
          note: "Bu telefona kuruldu",
          button: pkg ? `<button class="pl-btn pl-btn--primary pl-btn--sm" data-act="open" data-pkg="${esc(pkg)}">Aç</button>` : `<span class="pl-badge pl-badge--success">Kuruldu</span>`,
        };
      }
      const installedVer = a.package ? call("packageVersion", a.package) : "";
      const err = ins && (ins.state === "error" || ins.state === "cancelled") ? ins.message : "";
      return {
        note: err || (installedVer ? `Kurulu sürüm ${installedVer}` : `APK · ${bytes(a.size)} · SHA-256 ile doğrulanır`),
        button: `<button class="pl-btn pl-btn--primary pl-btn--sm" data-act="install" data-id="${esc(i.id)}">${installedVer ? "Güncelle" : err ? "Tekrar dene" : "Kur"}</button>`,
      };
    }
    if (a) {
      return {
        note: a.reason || "APK doğrulaması bekleniyor",
        button: a.source ? `<button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="external" data-url="${esc(a.source)}">Kaynağı aç</button>` : "",
      };
    }
    if (state.desktop.info.paired && state.desktop.status) {
      const d = deskInstalled(i.id);
      if (d) return { note: `Masaüstünde kurulu · v${d.version}${d.enabled ? "" : " · kapalı"}`, button: "" };
      return {
        note: "Masaüstüne kurulur; masaüstünde onay ister",
        button: `<button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="desk-install" data-id="${esc(i.id)}">Masaüstüne kur</button>`,
      };
    }
    if (i.kind === "engine" || i.kind === "model") {
      return { note: "Masaüstü Hub'da MyMind için kurulur", button: "" };
    }
    if (EXT_KINDS.includes(i.kind)) {
      return { note: "Masaüstü Hub eklentisi · masaüstü eşleşince buradan kurulur", button: "" };
    }
    return {
      note: "Masaüstü Hub'dan kurulur",
      button: i.url ? `<button class="pl-btn pl-btn--ghost pl-btn--sm" data-act="share" data-id="${esc(i.id)}">Bağlantıyı paylaş</button>` : "",
    };
  }

  function platformBadge(i) {
    const a = apkInfo(i);
    if (a?.status === "verified") return `<span class="pl-badge pl-badge--success" lang="en">Android</span>`;
    if (a) return `<span class="pl-badge pl-badge--warning">APK doğrulamada</span>`;
    if (i.kind === "engine" || i.kind === "model") return `<span class="pl-badge pl-badge--pro" lang="en">MyMind</span>`;
    if (i.platform === "win32") return `<span class="pl-badge" lang="en">Windows</span>`;
    return `<span class="pl-badge">${esc(i.kind)}</span>`;
  }

  function renderCatalog() {
    const items = state.catalog.items;
    const counts = {
      all: items.length,
      apk: items.filter((i) => apkInfo(i)).length,
      desktop: items.filter((i) => i.kind === "app" && i.platform === "win32").length,
      ai: items.filter((i) => ["engine", "model"].includes(i.kind)).length,
      ext: items.filter((i) => EXT_KINDS.includes(i.kind)).length,
      features: items.filter((i) => i.features).length,
    };
    const verified = items.filter((i) => apkInfo(i)?.status === "verified").length;
    const list = filterItems();
    const chip = (id, label) =>
      `<button class="pl-m-chip" data-filter="${id}" aria-pressed="${state.filter === id}">${label}<small>${counts[id]}</small></button>`;

    const banner =
      native && verified > 0 && !state.canInstall
        ? `<div class="pl-m-banner"><span>APK kurmak için “Bilinmeyen uygulamaları yükle” izni gerekli.</span><button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="perm">İzni aç</button></div>`
        : "";

    return `
      ${head("Uygulamalar", "PluginLabs kataloğu: telefona APK kur, masaüstü uygulamalarını takip et.")}
      <div class="pl-m-card pl-m-card--hero">
        <div class="pl-m-card__head"><h2>Bu telefona kurulabilir</h2><span class="pl-badge pl-badge--accent">${verified} APK</span></div>
        <p>${counts.apk} Android paketi listede; ${counts.apk - verified} tanesi SHA-256 doğrulaması bekliyor. Masaüstünde ${counts.desktop} uygulama ve ${state.catalog.previews || 0} ürün önizlemesi var.</p>
      </div>
      ${banner}
      <div class="pl-inputwrap">
        <svg class="pl-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="pl-input" id="q" type="search" placeholder="Uygulama ara" value="${esc(state.query)}" aria-label="Uygulama ara" />
      </div>
      <div class="pl-m-filters" role="group" aria-label="Filtre">
        ${chip("all", "Tümü")}${chip("apk", "Android")}${chip("features", "Özellikler")}${chip("ext", "Eklentiler")}${chip("desktop", "Masaüstü")}${chip("ai", "MyMind AI")}
      </div>
      <div class="pl-m-list">
        ${
          list.length
            ? list
                .map((i) => {
                  const act = itemAction(i);
                  return `
          <article class="pl-m-item" id="item-${esc(i.id)}">
            <span class="pl-applogo" data-pl-product="${esc(PRODUCT_ACCENT[i.id] || "hub")}" aria-hidden="true">${esc(initials(i.name))}</span>
            <div class="pl-m-item__body">
              <div class="pl-m-item__title"><strong>${esc(i.name)}</strong><span class="pl-m-item__ver">v${esc(apkInfo(i)?.version || i.version)}</span>${platformBadge(i)}${i.prerelease ? `<span class="pl-badge pl-badge--info">Önizleme</span>` : ""}</div>
              <p class="pl-m-item__desc">${esc(i.description)}</p>
              ${act.progress !== undefined ? `<div class="pl-progress pl-progress--sm" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${act.progress}" data-progress="${act.progress}"><span></span></div>` : ""}
              <div class="pl-m-item__foot"><span class="pl-m-item__note">${esc(act.note)}</span><span class="pl-row">${i.features ? `<button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="features" data-id="${esc(i.id)}">Özellikler</button>` : ""}${act.button}</span></div>
            </div>
          </article>`;
                })
                .join("")
            : `<div class="pl-m-empty">Aramaya uyan uygulama yok.</div>`
        }
      </div>`;
  }

  function meter(label, used, total, fmt = bytes) {
    if (!Number.isFinite(total) || total <= 0) return "";
    const pct = Math.round((used / total) * 100);
    return `<div class="pl-m-meter"><div class="pl-m-meter__row"><span>${esc(label)}</span><b>${esc(fmt(used))} / ${esc(fmt(total))}</b></div><div class="pl-progress pl-progress--sm" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" data-progress="${pct}"><span></span></div></div>`;
  }

  function renderDevices() {
    const d = state.device;
    const net = { wifi: "Wi-Fi", cellular: "Mobil veri", ethernet: "Ethernet", none: "Bağlantı yok", other: "Diğer", unknown: "Bilinmiyor" };
    const phone = d
      ? `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Bu telefon</h2><span class="pl-status pl-status--online">Çevrimiçi</span></div>
        <dl class="pl-m-kv">
          <dt>Cihaz</dt><dd>${esc(d.manufacturer)} ${esc(d.model)}</dd>
          <dt>Android</dt><dd>${esc(d.android)} (API ${esc(d.sdk)})</dd>
          <dt>Mimari</dt><dd>${esc(d.abi || "—")}</dd>
          <dt>Ekran</dt><dd>${esc(d.screen || "—")} · ${esc(d.density || "—")} dpi</dd>
          <dt>Ağ</dt><dd>${esc(net[d.network] || d.network)}</dd>
          <dt>Pil</dt><dd>%${esc(d.batteryPercent ?? "—")}${d.charging ? " · şarj oluyor" : ""}</dd>
        </dl>
        ${meter("Depolama", d.storageTotal - d.storageFree, d.storageTotal)}
        ${meter("Bellek (RAM)", d.ramTotal - d.ramFree, d.ramTotal)}
        <button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="refresh-device">Yenile</button>
      </div>`
      : `<div class="pl-m-card"><div class="pl-m-card__head"><h2>Bu telefon</h2><span class="pl-status">Önizleme</span></div><p>Cihaz bilgisi yalnız Android uygulamasında okunur.</p></div>`;

    const desktop = desktopCard();

    return `
      ${head("Cihazlar", "Bu telefon, masaüstü Hub ve bağlı diğer cihazlar.")}
      ${phone}
      ${desktop}
      <div class="pl-m-section-label">Diğer bağlı cihazlar</div>
      <div class="pl-m-empty">Bağlı başka cihaz yok.</div>`;
  }

  function desktopCard() {
    const D = state.desktop;
    if (!D.info.paired) {
      const p = D.pairing;
      if (p && p.state === "compare") {
        return `
      <div class="pl-m-card pl-m-card--hero">
        <div class="pl-m-card__head"><h2>Karşılaştırma kodu</h2><span class="pl-status pl-status--syncing">Onay bekleniyor</span></div>
        <p>Masaüstü Hub'da aynı kod görünüyorsa orada <strong>Onayla</strong>'ya bas.</p>
        <div class="pl-m-compare" aria-live="polite">${esc(p.value)}</div>
        <button class="pl-btn pl-btn--ghost" data-act="desk-cancel">Vazgeç</button>
      </div>`;
      }
      const err = p && p.state !== "compare" && p.state !== "busy" ? { rejected: "Masaüstünde reddedildi.", expired: "Süre doldu; yeni kod al.", cancelled: "Eşleştirme iptal edildi.", error: p.error || "Eşleşme başarısız." }[p.state] : "";
      return `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Masaüstü Hub</h2><span class="pl-status pl-status--warning">Eşleşmedi</span></div>
        <p>Masaüstünde Hub → API ve izinler → <strong>Telefon köprüsü</strong>'nü aç, “Telefonu eşleştir” de. Görünen adresi ve 6 haneli kodu buraya yaz. Telefon ve bilgisayar aynı Wi-Fi ağında olmalı.</p>
        <label class="pl-field"><span class="pl-field__label">Masaüstü adresi</span><input class="pl-input" id="desk-addr" inputmode="decimal" autocomplete="off" placeholder="192.168.1.20:47633" value="${esc(D.info.address || "")}" /></label>
        <label class="pl-field"><span class="pl-field__label">Eşleştirme kodu</span><input class="pl-input" id="desk-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 haneli kod" /></label>
        ${err ? `<p class="pl-m-error">${esc(err)}</p>` : ""}
        <button class="pl-btn pl-btn--primary pl-btn--block" data-act="desk-pair" ${p && p.state === "busy" ? "disabled" : ""}>${p && p.state === "busy" ? "Bağlanıyor…" : "Eşleştir"}</button>
      </div>`;
    }
    const st = D.status;
    if (!st) {
      return `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Masaüstü Hub</h2><span class="pl-status pl-status--error">Bağlanılamadı</span></div>
        <p>${esc(D.error || "Masaüstüne ulaşılamadı.")} Bilgisayarın açık, Hub'ın çalıştığından ve aynı ağda olduğundan emin ol.</p>
        <dl class="pl-m-kv"><dt>Adres</dt><dd>${esc(D.info.address)}</dd></dl>
        <div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="desk-refresh">Yeniden dene</button><button class="pl-btn pl-btn--ghost pl-btn--sm" data-act="desk-unpair">Eşleşmeyi kaldır</button></div>
      </div>`;
    }
    const os = { win32: "Windows", linux: "Linux", darwin: "macOS" }[st.hub.platform] || st.hub.platform;
    const apps = st.installed.filter((a) => a.kind === "app");
    return `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>${esc(st.hub.host)}</h2><span class="pl-status pl-status--online">Bağlı</span></div>
        <dl class="pl-m-kv">
          <dt>PluginLabs Hub</dt><dd>v${esc(st.hub.version)}</dd>
          <dt>Sistem</dt><dd>${esc(os)} ${esc(st.hub.release)}</dd>
          <dt>İşlemci</dt><dd>${esc(st.system.cpus)} çekirdek</dd>
          <dt>MyMind motoru</dt><dd>${st.model.running ? "Çalışıyor" : "Kapalı"}</dd>
          <dt>Süren işlem</dt><dd>${esc(st.jobs)}</dd>
          <dt>Onay bekleyen</dt><dd>${esc(st.pending)}</dd>
        </dl>
        ${meter("Bellek (RAM)", st.system.memTotal - st.system.memFree, st.system.memTotal)}
        ${st.system.disk ? meter("Hub diski", st.system.disk.total - st.system.disk.free, st.system.disk.total) : ""}
        <div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="desk-refresh">Yenile</button><button class="pl-btn pl-btn--ghost pl-btn--sm" data-act="desk-unpair">Eşleşmeyi kaldır</button></div>
      </div>
      <div class="pl-m-section-label">Masaüstündeki uygulamalar (${apps.length})</div>
      ${
        apps.length
          ? `<div class="pl-m-card">${apps.map((a) => `<div class="pl-m-setting"><span class="pl-m-setting__text"><strong>${esc(a.name)}</strong><span>v${esc(a.version)}</span></span>${a.enabled ? `<span class="pl-badge pl-badge--success">Etkin</span>` : `<span class="pl-badge">Kapalı</span>`}</div>`).join("")}</div>`
          : `<div class="pl-m-empty">Masaüstü Hub'a kurulu uygulama yok.</div>`
      }`;
  }

  function sw(id, label, help, checked, disabled = false) {
    return `<label class="pl-m-setting"><span class="pl-m-setting__text"><strong>${esc(label)}</strong>${help ? `<span>${esc(help)}</span>` : ""}</span><span class="pl-switch"><input type="checkbox" data-setting="${esc(id)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} aria-label="${esc(label)}" /></span></label>`;
  }

  function renderMyMind() {
    const m = state.mymind;
    const deskSt = state.desktop.status;
    const apps = mymindApps();
    return `
      ${head("MyMind AI", "Ortak yapay zekâ yeteneği: izinler, gizlilik ve kullanım.")}
      <div class="pl-m-card pl-m-card--mymind">
        <div class="pl-m-card__head"><h2>Bağlantı</h2>${deskSt ? (deskSt.model.running ? `<span class="pl-status pl-status--online">Hazır</span>` : `<span class="pl-status pl-status--warning">Masaüstünde model kapalı</span>`) : `<span class="pl-status pl-status--warning">Masaüstü bekleniyor</span>`}</div>
        <dl class="pl-m-kv">
          <dt>Durum</dt><dd>${m.enabled ? "Etkin" : "Kapalı"}</dd>
          <dt>Model</dt><dd>My Mind Lite · masaüstü Hub</dd>
          <dt>Yol</dt><dd>Telefon → masaüstü Hub (onaylı)</dd>
          <dt>Bu ay gönderim</dt><dd>${nf0.format(mymindUsage())}</dd>
        </dl>
        <p>MyMind istekleri telefondan doğrudan bir sağlayıcıya gitmez; eşleşmiş masaüstü Hub üzerinden, her seferinde onayınla ve yalnız gerekli alanlarla gönderilir. API anahtarı telefonda tutulmaz.</p>
      </div>
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Ayarlar</h2></div>
        ${sw("enabled", "MyMind'ı etkinleştir", "Kapalıyken hiçbir uygulama istek gönderemez", m.enabled)}
        ${sw("confirmEach", "Her gönderimde onay iste", "Zorunlu · kapatılamaz", true, true)}
        ${sw("minimizeData", "Veri azaltma", "Zorunlu · yalnız gerekli alanlar gönderilir", true, true)}
        ${sw("keepHistory", "Görev geçmişini bu telefonda tut", "Kapalıyken geçmiş saklanmaz", m.keepHistory)}
        <label class="pl-m-setting"><span class="pl-m-setting__text"><strong>Yanıt dili</strong></span>
          <select class="pl-select" data-setting="language" aria-label="Yanıt dili">
            <option value="tr" ${m.language === "tr" ? "selected" : ""}>Türkçe</option>
            <option value="en" ${m.language === "en" ? "selected" : ""}>English</option>
          </select>
        </label>
      </div>
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Uygulama izinleri</h2><span class="pl-badge">${apps.length}</span></div>
        <p>MyMind'ı kullanabilecek uygulamaları seç. Varsayılan kapalıdır.</p>
        ${apps.map((a) => sw(`app:${a.id}`, a.name, `v${a.version}`, !!m.apps[a.id], !m.enabled)).join("")}
      </div>`;
  }

  function featureValues(item) {
    const saved = state.features[item.id] || {};
    return Object.fromEntries(item.features.map((f) => [f.id, typeof saved[f.id] === "boolean" ? saved[f.id] : f.default]));
  }

  function leoPackage() {
    return LEO_PACKAGES.find((p) => call("packageVersion", p)) || "";
  }

  function renderFeatures() {
    const item = state.catalog.items.find((i) => i.id === state.featureApp && i.features);
    if (!item) return renderCatalog();
    const values = featureValues(item);
    const label = { win32: "Windows", android: "Android" };
    const rows = item.features
      .map((f) => sw(`feature:${f.id}`, f.name, `${f.description} · ${f.platforms.map((p) => label[p] || p).join(", ")}`, values[f.id]))
      .join("");
    const isLeo = item.id === "leo-helper";
    const pkg = isLeo ? leoPackage() : "";
    const leoCard = isLeo
      ? `<div class="pl-m-card">
          <div class="pl-m-card__head"><h2>Bu telefondaki Leo Helper</h2>${pkg ? `<span class="pl-status pl-status--online">Kurulu</span>` : `<span class="pl-status">Kurulu değil</span>`}</div>
          <p>Android'e uyan özellikler Leo Helper'a gönderilir; Leo değişikliği uygulamadan önce onay ister.</p>
          <button class="pl-btn pl-btn--primary pl-btn--block" data-act="push-features" data-id="${esc(item.id)}" ${pkg ? "" : "disabled"}>Leo Helper'a uygula</button>
        </div>`
      : "";
    return `
      <button class="pl-btn pl-btn--ghost pl-btn--sm pl-m-back" data-act="back-catalog">← Uygulamalar</button>
      ${head(`${item.name} · Özellikler`, "Aç/kapa ayarları masaüstü ve telefon Hub'da aynı tanımları kullanır.")}
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Özellikler</h2><span class="pl-badge">${item.features.length}</span></div>
        ${rows}
      </div>
      ${leoCard}
      ${desktopFeatures(item)}`;
  }

  function desktopFeatures(item) {
    const D = state.desktop;
    const values = D.features?.[item.id];
    if (!D.info.paired || !values) {
      return `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Masaüstü</h2><span class="pl-status pl-status--warning">${D.info.paired ? "Bağlanılamadı" : "Eşleşme bekleniyor"}</span></div>
        <p>Masaüstündeki değerleri buradan değiştirmek için Cihazlar → Masaüstü Hub ekranından eşleştir.</p>
      </div>`;
    }
    const label = { win32: "Windows", android: "Android" };
    const rows = item.features
      .filter((f) => f.platforms.includes("win32"))
      .map((f) => sw(`desk:${f.id}`, f.name, `${f.description} · ${f.platforms.map((p) => label[p] || p).join(", ")}`, values[f.id]))
      .join("");
    return `
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Masaüstündeki değerler</h2><span class="pl-status pl-status--online">${esc(D.status?.hub.host || "Bağlı")}</span></div>
        <p>Buradaki değişiklik masaüstü Hub'a hemen yazılır.</p>
        ${rows}
      </div>`;
  }

  function renderAccount() {
    const a = state.app;
    return `
      ${head("Hesap ve abonelik", "Plan, abonelik ve uygulama bilgileri.")}
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Profil</h2><span class="pl-status">Yerel</span></div>
        <p>Bu telefonda PluginLabs hesabı ile oturum açılmadı. Ayarlar yalnız bu cihazda saklanır ve yedeklenmez.</p>
      </div>
      <div class="pl-m-section-label">Planlar</div>
      <div class="pl-m-plans">
        <div class="pl-m-card pl-m-plan is-current">
          <div class="pl-m-card__head"><h2>Ücretsiz</h2><span class="pl-badge pl-badge--accent">Geçerli plan</span></div>
          <ul><li>Katalog ve doğrulamalı APK kurulumu</li><li>Telefon bilgileri ve tek masaüstü eşleşmesi</li><li>MyMind (masaüstü Hub üzerinden, onaylı)</li></ul>
        </div>
        <div class="pl-m-card pl-m-plan">
          <div class="pl-m-card__head"><h2>Pro</h2><span class="pl-badge pl-badge--pro">Pro</span></div>
          <ul><li>Birden çok masaüstü ve cihaz eşleşmesi</li><li>MyMind öncelikli görev kuyruğu</li><li>Ayar ve izin yedekleme</li></ul>
          <p>Fiyat ve ödeme yöntemi henüz belirlenmedi. Satın alma Google Play üzerinden açılacak.</p>
          <button class="pl-btn pl-btn--secondary pl-btn--block" disabled>Pro'ya geç · yakında</button>
        </div>
      </div>
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Abonelik yönetimi</h2></div>
        <dl class="pl-m-kv">
          <dt>Durum</dt><dd>Ücretsiz · yenileme yok</dd>
          <dt>Faturalar</dt><dd>Yok</dd>
          <dt>MyMind kullanımı</dt><dd>${nf0.format(mymindUsage())} gönderim / ay</dd>
        </dl>
      </div>
      <div class="pl-m-card">
        <div class="pl-m-card__head"><h2>Uygulama</h2></div>
        <dl class="pl-m-kv">
          <dt>Sürüm</dt><dd>${esc(a?.version || "önizleme")}</dd>
          <dt>Paket</dt><dd>${esc(a?.applicationId || "—")}</dd>
          <dt>Katalog kaynağı</dt><dd>Masaüstü Hub ${esc(state.catalog.hubDesktopVersion || "—")}</dd>
        </dl>
        <div class="pl-row">
          <button class="pl-btn pl-btn--secondary pl-btn--sm" data-act="external" data-url="https://github.com/timdesigners-pixel/PluginLabs">Kaynak kodu aç</button>
          <button class="pl-btn pl-btn--ghost pl-btn--sm" data-act="reset">Yerel ayarları sıfırla</button>
        </div>
      </div>`;
  }

  function render() {
    const view = $("#view");
    const r = state.route;
    view.innerHTML =
      r === "devices" ? renderDevices() : r === "mymind" ? renderMyMind() : r === "account" ? renderAccount() : r === "features" ? renderFeatures() : renderCatalog();
    view.querySelectorAll("[data-progress]").forEach((el) => setProgress(el, Number(el.dataset.progress)));
    document.querySelectorAll(".pl-m-nav button").forEach((b) => {
      if (b.dataset.route === r || (r === "features" && b.dataset.route === "catalog")) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    document.title = `${ROUTES[r]} · PluginLabs Hub`;
  }

  function go(route, opts = {}) {
    state.route = ROUTES[route] ? route : "catalog";
    render();
    if (!opts.keepScroll) window.scrollTo(0, 0);
  }

  // ---------- Eylemler ----------
  function install(id) {
    const item = state.catalog.items.find((i) => i.id === id);
    const a = item && apkInfo(item);
    if (!a || a.status !== "verified") return;
    if (!native) return toast("Kurulum yalnız Android uygulamasında yapılır.");
    if (!state.canInstall) {
      call("openInstallSettings");
      return toast("İzni açıp geri dönünce tekrar “Kur”a dokun.");
    }
    state.installs[id] = { state: "download", percent: 0 };
    render();
    call("installApk", JSON.stringify({ id, url: a.url, sha256: a.sha256, size: a.size }));
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".pl-m-nav button");
    if (nav) return go(nav.dataset.route);
    const f = e.target.closest("[data-filter]");
    if (f) {
      state.filter = f.dataset.filter;
      return go("catalog", { keepScroll: true });
    }
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === "install") install(btn.dataset.id);
    else if (act === "cancel") call("cancelInstall", btn.dataset.id);
    else if (act === "open") call("openApp", btn.dataset.pkg);
    else if (act === "perm") call("openInstallSettings");
    else if (act === "desk-pair") {
      const addr = $("#desk-addr").value.trim();
      const code = $("#desk-code").value.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}(:\d{2,5})?$/.test(addr)) return toast("Adresi 192.168.1.20:47633 biçiminde yaz.");
      if (!/^\d{6}$/.test(code)) return toast("Kod 6 haneli olmalı.");
      if (!native) return toast("Eşleştirme yalnız Android uygulamasında yapılır.");
      state.desktop.info.address = addr;
      state.desktop.pairing = { state: "busy" };
      render();
      call("desktopPair", addr, code);
    } else if (act === "desk-cancel") {
      call("desktopCancelPair");
      state.desktop.pairing = { state: "cancelled" };
      render();
    } else if (act === "desk-refresh") {
      btn.disabled = true;
      refreshDesktop().then(() => {
        render();
        toast(state.desktop.status ? "Masaüstü bilgileri yenilendi." : "Masaüstüne ulaşılamadı.");
      });
    } else if (act === "desk-unpair") {
      if (!window.confirm("Bu telefonun masaüstü eşleşmesi kaldırılsın mı? Masaüstünde de 'Eşleşmeyi kaldır' demen önerilir.")) return;
      call("desktopUnpair");
      state.desktop = { info: { paired: false }, status: null, features: null, pairing: null, error: "" };
      render();
    } else if (act === "desk-install") {
      btn.disabled = true;
      desktopCall("install", { id: btn.dataset.id })
        .then(() => toast("İstek gönderildi; masaüstünde API ve izinler ekranından onayla."))
        .catch((e) => toast(e.message))
        .finally(() => refreshDesktop().then(render));
    }
    else if (act === "features") {
      state.featureApp = btn.dataset.id;
      go("features");
    } else if (act === "back-catalog") go("catalog");
    else if (act === "push-features") {
      const item = state.catalog.items.find((i) => i.id === btn.dataset.id);
      const pkg = leoPackage();
      if (!item || !pkg) return;
      const values = featureValues(item);
      const androidOnly = Object.fromEntries(item.features.filter((f) => f.platforms.includes("android")).map((f) => [f.id, values[f.id]]));
      call("sendFeatures", pkg, JSON.stringify({ app: item.id, features: androidOnly }));
      toast("Leo Helper açılıyor; onaylayınca ayarlar uygulanır.");
    }
    else if (act === "external") {
      if (native) call("openExternal", btn.dataset.url);
      else window.open(btn.dataset.url, "_blank", "noopener");
    } else if (act === "share") {
      const i = state.catalog.items.find((x) => x.id === btn.dataset.id);
      if (!i) return;
      const text = `${i.name} ${i.version} · PluginLabs\n${i.url}`;
      if (native) call("share", text);
      else toast("Paylaşım yalnız Android uygulamasında açılır.");
    } else if (act === "refresh-device") {
      readDevice();
      render();
      toast("Cihaz bilgileri yenilendi.");
    } else if (act === "reset") {
      if (!window.confirm("Bu telefondaki MyMind ve eşleşme ayarları sıfırlansın mı?")) return;
      try {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      } catch {
        /* yok say */
      }
      loadMyMind();
      call("desktopUnpair");
      state.desktop = { info: { paired: false }, status: null, features: null, pairing: null, error: "" };
      render();
      toast("Yerel ayarlar sıfırlandı.");
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "q") {
      state.query = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const q = $("#q");
      q.focus();
      q.setSelectionRange(pos, pos);
    } else if (e.target.id === "palette-input") {
      renderPalette(e.target.value);
    }
  });

  document.addEventListener("change", (e) => {
    const key = e.target.dataset?.setting;
    if (!key) return;
    const m = state.mymind;
    if (key === "confirmEach" || key === "minimizeData") return;
    if (key.startsWith("desk:")) {
      const app = state.featureApp, fid = key.slice(5), val = e.target.checked;
      e.target.disabled = true;
      desktopCall("features.set", { app, values: { [fid]: val } })
        .then((v) => {
          state.desktop.features[app] = v;
          toast("Masaüstüne kaydedildi.");
        })
        .catch((err) => {
          e.target.checked = !val;
          toast(err.message);
        })
        .finally(() => (e.target.disabled = false));
      return;
    }
    if (key.startsWith("feature:")) {
      const id = state.featureApp;
      state.features[id] = { ...(state.features[id] || {}), [key.slice(8)]: e.target.checked };
      save(KEYS.features, state.features);
      return;
    }
    if (key.startsWith("app:")) m.apps[key.slice(4)] = e.target.checked;
    else if (key === "language") m.language = e.target.value;
    else m[key] = e.target.checked;
    saveMyMind();
    if (key === "enabled") render();
  });

  // ---------- Komut paleti ----------
  function openPalette() {
    $("#palette").hidden = false;
    const input = $("#palette-input");
    input.value = "";
    renderPalette("");
    input.focus();
  }
  function closePalette() {
    $("#palette").hidden = true;
    $("#open-palette").focus();
  }
  function renderPalette(q) {
    const s = q.trim().toLocaleLowerCase("tr-TR");
    const screens = Object.entries(ROUTES).map(([id, name]) => ({ type: "route", id, name, hint: "Ekran" }));
    const apps = state.catalog.items.map((i) => ({ type: "app", id: i.id, name: i.name, hint: apkInfo(i) ? "Android" : "Uygulama" }));
    const rows = [...screens, ...apps].filter((r) => !s || r.name.toLocaleLowerCase("tr-TR").includes(s)).slice(0, 30);
    $("#palette-list").innerHTML = rows.length
      ? rows.map((r) => `<button type="button" data-ptype="${r.type}" data-pid="${esc(r.id)}"><span>${esc(r.name)}</span><small>${esc(r.hint)}</small></button>`).join("")
      : `<div class="pl-m-empty">Sonuç yok.</div>`;
  }
  $("#open-palette").addEventListener("click", openPalette);
  $("#palette").addEventListener("click", (e) => {
    if (e.target.id === "palette") return closePalette();
    const b = e.target.closest("button[data-ptype]");
    if (!b) return;
    closePalette();
    if (b.dataset.ptype === "route") return go(b.dataset.pid);
    const i = state.catalog.items.find((x) => x.id === b.dataset.pid);
    state.filter = "all";
    state.query = i ? i.name : "";
    go("catalog");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    } else if (e.key === "Escape" && !$("#palette").hidden) {
      closePalette();
    }
  });

  // ---------- Yerel olaylar ve geri tuşu ----------
  window.PLApp = {
    back() {
      if (!$("#palette").hidden) {
        closePalette();
        return true;
      }
      if (state.route !== "catalog") {
        go("catalog");
        return true;
      }
      return false;
    },
    onNative(raw) {
      let ev;
      try {
        ev = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        return;
      }
      if (!ev) return;
      if (ev.type === "install" && ev.id) {
        const prev = state.installs[ev.id] || {};
        state.installs[ev.id] = { ...prev, ...ev };
        if (ev.state === "installed") toast("Kurulum tamamlandı.");
        else if (ev.state === "error") toast(ev.message || "Kurulum başarısız.");
        if (state.route === "catalog") {
          // İlerleme olaylarında yalnız ilgili satırı güncelle.
          if (ev.state === "download") {
            const row = document.getElementById(`item-${ev.id}`);
            const bar = row?.querySelector("[data-progress]");
            const note = row?.querySelector(".pl-m-item__note");
            if (bar && note) {
              setProgress(bar, ev.percent || 0);
              note.textContent = `İndiriliyor · %${ev.percent || 0}`;
              return;
            }
          }
          render();
        }
      } else if (ev.type === "bridgeResult") {
        const p = pendingCalls.get(ev.reqId);
        if (!p) return;
        pendingCalls.delete(ev.reqId);
        clearTimeout(p.timer);
        ev.ok ? p.resolve(ev.data) : p.reject(new Error(ev.error || "Masaüstü işlemi başarısız"));
      } else if (ev.type === "bridgePair") {
        state.desktop.pairing = { state: ev.state, value: ev.value, error: ev.error };
        if (ev.state === "paired") {
          state.desktop.pairing = null;
          readDesktopInfo();
          toast(`Masaüstü eşleşti: ${ev.value || ""}`);
          refreshDesktop().then(render);
        }
        if (state.route === "devices") render();
      } else if (ev.type === "resume") {
        if ($("#splash").hidden) {
          readDevice();
          render();
        }
      }
    },
  };

  runSplash();
})();
