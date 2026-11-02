"use strict";
const $ = (s) => document.querySelector(s),
  content = $("#content"),
  modal = $("#modal");
const api = window.pluginlabs;
let state,
  page = "home",
  filter = "all",
  query = "",
  busy = new Set(),
  updateResults = [],
  chatResult = "",
  timer,
  tokenOnce,
  browserSelection = "",
  openProductId = "",
  productData = null;
const titles = {
  home: "Genel bakış",
  apps: "Uygulamalarım",
  discover: "Keşfet",
  resources: "Kaynak kütüphanesi",
  mymind: "My Mind",
  updates: "Güncellemeler",
  activity: "İşlem geçmişi",
  api: "API ve izinler",
  settings: "Ayarlar",
  product: "Ürün çalışma alanı",
  extensions: "Eklenti yöneticisi",
  ideas: "Uygulama kataloğu",
};
const kindLabels = {
  app: "Uygulama",
  preview: "Ürün önizlemesi",
  asset: "Asset",
  template: "Şablon",
  library: "Kütüphane",
  plugin: "Eklenti",
  model: "Yerel model",
  engine: "AI motoru",
};
const icons = {
  "mind-palace": "◈",
  "leo-helper": "L",
  "mymind-lite": "✳",
  "llama-engine": "✳",
  "graphite-theme": "◐",
  "meeting-template": "▤",
  "writing-library": "≡",
  "text-tools": "Aa",
};
const scopeLabels = {
  "browser.manage": "Tarayıcı yönetimi (özel bağlantı gerekir)",
  "catalog.read": "Kataloğu ve uygulamaları gör",
  "resources.read": "Etkin kaynakları oku",
  "jobs.read": "İndirme durumlarını gör",
  "downloads.request": "Yükleme isteği gönder (onaylı)",
  "apps.launch": "Uygulama açma isteği (onaylı)",
  "mymind.chat": "My Mind ile metin işle",
  "providers.register": "Uygulama işlevlerini kaydet",
  "actions.invoke": "Sağlayıcı işlemlerini çağır",
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const bytes = (n) =>
  n
    ? `${(n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`
    : "Dahili paket";
const date = (s) =>
  new Date(s).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const customModelCard = () => {
  const m = state.model.custom,
    active = state.model.source === "custom";
  const body = m
    ? `<p style="margin:10px 0 14px">${esc(m.name)} · ${bytes(m.size)}</p><div class="code">SHA-256: ${esc(m.sha256)}<br>${m.verified ? "Doğrulandı: SHA256SUMS dosyasıyla eşleşti" : "SHA256SUMS bulunamadı; dosyanın kaynağından emin olun"}<br>İçe aktarma: ${esc(new Date(m.imported).toLocaleString("tr-TR"))}</div><div class="button-row" style="margin-top:16px">${active ? button("Katalog modeline dön", "useCatalogModel") : button("Özel modeli kullan", "useCustomModel", "", "primary")}${button("Başka model içe aktar", "importModel")}${button("Kaldır", "removeCustomModel", "", "danger")}</div>`
    : `<p style="margin:10px 0 18px">Kendi eğittiğiniz MyMind modelini (GGUF) bu bilgisayardan içe aktarın. Dosya internetten indirilmez; uygulamalar onu aynı My Mind API'siyle kullanır.</p><div class="button-row">${button("GGUF içe aktar", "importModel", "", "primary")}</div>`;
  return `<section class="card" style="margin-top:20px"><div class="row-heading" style="margin-top:0"><h2>Özel MyMind modeli</h2>${m ? `<span class="badge ${active ? "online" : ""}">${active ? '<i class="status-dot"></i>Kullanılıyor' : "Hazır"}</span>` : ""}</div>${body}<div class="notice">Aynı klasörde SHA256SUMS varsa dosya onunla doğrulanır. Model kaynağı değişince çalışan sunucu durdurulur.</div></section>`;
};
const button = (text, action, id = "", style = "") =>
  `<button class="btn ${style}" data-action="${action}" data-id="${esc(id)}" ${busy.has(action + id) ? "disabled" : ""}>${busy.has(action + id) ? "İşleniyor…" : text}</button>`;
const icon = (id) =>
  `<span class="app-icon ${esc(id)}">${icons[id] || "▧"}</span>`;
const heading = (title, desc, action = "") =>
  `<div class="page-heading"><div><div class="eyebrow">PLUGINLABS / ${esc(titles[page])}</div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").style.display = "block";
  clearTimeout(timer);
  timer = setTimeout(() => ($("#toast").style.display = "none"), 5000);
}
async function call(method, ...args) {
  return api.call(method, ...args);
}
async function refresh(renderPage = true) {
  const next = await call("snapshot");
  const changed = JSON.stringify(next) !== JSON.stringify(state);
  state = next;
  $("#footer-status").textContent = state.api.running
    ? `● Yerel API hazır · 127.0.0.1:${state.api.port}`
    : "○ Yerel API çevrimdışı";
  const active = state.jobs.filter((j) =>
    ["queued", "downloading", "installing"].includes(j.status),
  ).length;
  $("#update-count").textContent = active || "";
  renderTicker();
  updateMenuServer();
  if (renderPage && changed) render();
}
function matches(item) {
  return (
    !query ||
    `${item.name} ${item.description} ${kindLabels[item.kind]}`
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr"))
  );
}
function card(item) {
  const installed = state.installed[item.id],
    job = state.jobs.find(
      (j) =>
        j.item === item.id &&
        ["queued", "downloading", "installing"].includes(j.status),
    );
  const newer = (a, b) => {
    const x = a.split(".").map(Number),
      y = b.split(".").map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    }
    return false;
  };
  const different = installed && newer(item.version, installed.version);
  return `<article class="card"><div class="card-top">${icon(item.id)}<div><h3>${esc(item.name)}</h3><small>${kindLabels[item.kind]} · v${esc(installed?.version || item.version)}</small></div></div><p>${esc(item.description)}</p>${job ? `<div class="progress"><span style="width:${Math.min(100, (job.bytes / (job.total || 1)) * 100)}%"></span></div><div class="subtle">${bytes(job.bytes)} / ${bytes(job.total)}</div>` : ""}<div class="card-bottom"><span class="badge ${installed?.enabled ? "online" : ""}">${installed ? `<i class="status-dot"></i>${installed.enabled ? "Yüklü" : "Devre dışı"}` : bytes(item.size)}</span>${job ? button("İptal", "cancel", job.id) : !installed ? button("＋ Yükle", "install", item.id) : different ? button("Güncelle", "install", item.id, "primary") : item.kind === "app" ? button("Aç ↗", "launch", item.id) : item.kind === "preview" ? button("Aç ↗", "openProduct", item.id) : button("Yönet", "manage", item.id)}</div>${installed ? `<div class="detail-actions"><button class="text-button" data-action="manage" data-id="${item.id}">Ayarlar ve paket bilgisi</button></div>` : ""}</article>`;
}
function grid(items) {
  return items.length
    ? `<div class="app-grid">${items.map(card).join("")}</div>`
    : '<div class="empty"><span>⌕</span>Bu görünümde henüz içerik yok.<br>Katalogdan paket yükleyebilir veya aramayı değiştirebilirsiniz.</div>';
}
const paletteChoices = [
  ["hub-yesil", "Hub Yeşil", "Mevcut PluginLabs Hub görünümü"],
  ["iris", "Iris", "Mor-mavi PluginLabs tasarım sistemi"],
];
const modeChoices = [
  ["dark", "Koyu", "Varsayılan"],
  ["light", "Açık", "Aydınlık ortamlar için"],
];
function choiceGroup(name, legend, choices, current) {
  return `<fieldset class="choice-group"><legend>${legend}</legend>${choices
    .map(
      ([value, label, hint]) =>
        `<label class="choice"><input type="radio" name="${name}" value="${value}" ${value === current ? "checked" : ""}><span class="choice-swatch" data-swatch="${name === "palette" ? value : "mode-" + value}" aria-hidden="true"></span><span><strong>${label}</strong><small>${hint}</small></span></label>`,
    )
    .join("")}</fieldset>`;
}
function appearanceHTML() {
  const t = window.plTheme.get();
  return `<section class="card appearance" style="margin-bottom:20px"><h2>Görünüm</h2><p style="margin:15px 0">Palet ve tema bu cihazda saklanır; uygulama yeniden açıldığında korunur.</p><div class="choice-grid">${choiceGroup("palette", "Palet", paletteChoices, t.palette)}${choiceGroup("mode", "Tema", modeChoices, t.mode)}</div></section>`;
}
function render() {
  if (!state) return;
  $("#breadcrumb").textContent = titles[page];
  document
    .querySelectorAll("nav [data-page]")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  const catalog = state.catalog.filter(matches),
    apps = catalog.filter((i) => i.kind === "app"),
    resources = catalog.filter((i) =>
      ["asset", "template", "library", "plugin"].includes(i.kind),
    );
  let html = "";
  if (page === "home") {
    const installed = Object.keys(state.installed).length;
    html = `${heading("Her şey, tek bir yerde.", "Uygulamalarınız, yaratıcı kaynaklarınız ve yerel yapay zekânız.", `<span class="pill">KİŞİSEL ÇALIŞMA ALANI</span>`)}${statusCards(true)}<section class="hero"><div class="hero-copy"><div class="eyebrow">TANIŞTIRALIM · MY MIND</div><h2>Küçük model.<br>Büyük bir çalışma alanı.</h2><p>My Mind’i cihazınıza yükleyin. Metinleri özetleyin, fikirlerinizi düzenleyin ve uygulamalarınıza yerel AI ekleyin.</p><button class="btn primary" data-go="mymind">My Mind’i keşfet <span>↗</span></button></div><div class="hero-art" aria-hidden="true"><span class="orbit"></span><span class="orbit two"></span><span class="ai-symbol">✳</span><span class="float-chip top">ON-DEVICE INTELLIGENCE</span><span class="float-chip">● Yerel sunucu · Kontrol sizde</span></div></section><div class="row-heading"><h2>Çalışma alanınız için</h2><button class="text-button" data-go="discover">Tüm uygulamalar ↗</button></div>${grid([...apps, ...catalog.filter((i) => i.id === "mymind-lite")])}<div class="section-split"><section class="card"><div class="row-heading" style="margin-top:0"><h2>Kaynak kütüphanesi</h2><button class="text-button" data-go="resources">Tümünü gör ↗</button></div>${resources
      .slice(0, 3)
      .map(
        (i) =>
          `<div class="resource-mini">${icon(i.id)}<div><h3>${esc(i.name)}</h3><p>${kindLabels[i.kind]} · ${state.installed[i.id] ? "Yüklü" : "Kataloğa dahil"}</p></div><button class="text-button" data-action="${state.installed[i.id] ? "manage" : "install"}" data-id="${i.id}">${state.installed[i.id] ? "Yönet" : "＋"}</button></div>`,
      )
      .join(
        "",
      )}</section><section class="card api-card"><div class="eyebrow">BİRBİRİYLE ÇALIŞAN ARAÇLAR</div><h3>Bir merkez.<br>Bağlantılı bir ekosistem.</h3><p>Uygulamalarınızı izinli yerel API ile bağlayın. Kaynakları paylaşın, ortak AI motorunu kullanın.</p><div class="api-stat"><div><strong>${installed}</strong>yüklü paket</div><div><strong>${state.providers.length}</strong>bağlı sağlayıcı</div><div><strong>${state.clients.length}</strong>API istemcisi</div></div><button class="btn ghost" data-go="api">API ve bağlantıları yönet ↗</button></section></div>`;
  }
  if (page === "apps")
    html =
      heading(
        "Uygulamalarım",
        "Bu merkez üzerinden yüklediğiniz uygulamaları ve eklentileri yönetin.",
        `<div class="button-row"><button class="btn" data-go="ideas">Uygulama kataloğu · 50 ürün</button><button class="btn primary" data-go="discover">＋ Uygulama ekle</button></div>`,
      ) + grid(catalog.filter((i) => state.installed[i.id]));
  if (page === "discover" || page === "resources") {
    const list = page === "resources" ? resources : catalog;
    html =
      heading(
        page === "resources"
          ? "Yaratıcılığınız için kaynaklar."
          : "Çalışma alanınızı genişletin.",
        page === "resources"
          ? "Asset, şablon, kütüphane ve eklentileri bulun. Etkin kaynakları uygulamalarınız API ile okuyabilir."
          : "Gerçek sürümler, doğrulanan paketler ve cihazınızda çalışan araçlar.",
        button("＋ Kaynak paketi yükle", "importPack"),
      ) +
      `<div class="filters">${["all", ...(page === "resources" ? ["asset", "template", "library", "plugin"] : ["app", "model", "engine", "plugin"])].map((k) => `<button class="filter ${filter === k ? "active" : ""}" data-filter="${k}">${k === "all" ? "Tümü" : kindLabels[k]}</button>`).join("")}</div>` +
      grid(list.filter((i) => filter === "all" || i.kind === filter));
  }
  if (page === "ideas") html = ideasPage();
  if (page === "product") html = productPage();
  if (page === "extensions") html = extensionsPage();
  if (page === "mymind") {
    const ready =
      state.installed["llama-engine"]?.enabled &&
      (state.model.source === "custom"
        ? !!state.model.custom
        : state.installed["mymind-lite"]?.enabled);
    html =
      heading(
        "My Mind. Sizin cihazınızda.",
        "Yerel model kurulumu, sunucu yönetimi ve uygulamalar için ortak AI erişimi.",
        `<span class="pill">${state.model.running ? "● SUNUCU HAZIR" : state.model.starting ? "BAŞLATILIYOR" : "SUNUCU KAPALI"}</span>`,
      ) +
      statusCards(false) +
      `<div class="notice">My Mind Lite, Qwen3 0.6B açık modelini llama.cpp ile çalıştırır. İndirmeler internet gerektirir; metin analizi yerel sunucuda yapılır. İlk sürüm CPU kullanır.</div><div class="model-grid">${catalog
        .filter((i) => ["mymind-lite", "llama-engine"].includes(i.id))
        .map(card)
        .join(
          "",
        )}</div>${customModelCard()}<div class="two-col"><section class="card"><h2>Yerel model sunucusu</h2><p style="margin:13px 0 20px">Motor: 127.0.0.1:8765<br>Uygulama API’si: 127.0.0.1:${state.api.port || 47632}/v1<br>Bağlam: 4096 token · Çıktı: en fazla 512 token</p>${state.model.error ? `<p class="error">${esc(state.model.error)}</p>` : ""}<div class="button-row">${state.model.running || state.model.starting ? button("Sunucuyu durdur", "stopModel", "", "danger") : ready ? button("▶ Sunucuyu başlat", "startModel", "", "primary") : '<span class="subtle">Başlatmak için model ve motoru yükleyip etkinleştirin.</span>'}</div><div class="notice">LM Studio ve mevcut PluginLabs AI paketleri bu sürümde doğrudan yönetilmiyor. Bu merkez kendi kurduğu motoru yönetir.</div></section><section class="card"><h2>Hızlı deneme</h2><p style="margin:10px 0 18px">Bir metin girin; My Mind yerel olarak yanıtlasın.</p><form id="chat-form"><label class="field"><span>Mesajınız</span><textarea name="prompt" maxlength="10000" required placeholder="Bu metni üç kısa maddede özetle…"></textarea></label><button class="btn primary" ${!state.model.running || busy.has("chat") ? "disabled" : ""}>${busy.has("chat") ? "Yanıt hazırlanıyor…" : "My Mind’e gönder ↗"}</button></form>${chatResult ? `<div class="chat-output">${esc(chatResult)}</div>` : ""}</section></div>`;
  }
  if (page === "updates")
    html =
      heading(
        "Her zaman güncel.",
        "Güncellemeler kendiliğinden kurulmaz. Denetleyin ve yüklemek istediğiniz sürümü seçin.",
        button("↻ Güncellemeleri denetle", "checkUpdates"),
      ) +
      (updateResults.length
        ? `<section class="card">${updateResults.map((r) => `<div class="list-row">${icon(r.id)}<div class="grow"><h3>${esc(state.catalog.find((i) => i.id === r.id)?.name)}</h3><p>${r.error ? esc(r.error) : r.available ? `Yeni sürüm: ${esc(r.version)}${r.ready ? " · Doğrulanmış indirmeye hazır" : " · Doğrulanmış dosya özeti eksik"}` : `En son yayımlanan sürüm: ${esc(r.version)}`}</p></div>${r.ready ? button("Yükle", "install", r.id) : ""}</div>`).join("")}</section>`
        : '<div class="empty"><span>↻</span>Henüz güncelleme denetimi yapılmadı.</div>') +
      `<div class="row-heading"><h2>İndirmeler</h2></div>` +
      jobsHTML();
  if (page === "activity")
    html =
      heading(
        "İşlem geçmişi",
        "İndirmeler, paket değişiklikleri ve API onayları. Prompt içerikleri kaydedilmez.",
      ) +
      jobsHTML() +
      `<section class="card" style="margin-top:20px">${state.activity.map((a) => `<div class="list-row"><span class="badge">◷</span><div class="grow"><p>${esc(a.message)}</p></div><span class="time">${date(a.time)}</span></div>`).join("")}</section>`;
  if (page === "api")
    html =
      heading(
        "Uygulamalarınız birlikte çalışsın.",
        "Her uygulama için ayrı anahtar, belirli izinler ve görünür işlemler.",
        button("＋ İstemci oluştur", "newClient", "", "primary"),
      ) +
      `<section class="card"><div class="page-heading" style="margin-bottom:0"><div><h2>Yerel API</h2><p style="margin-top:9px">http://127.0.0.1:${state.api.port || 47632}/v1</p></div><span class="api-status"><i class="status-dot"></i>${state.api.running ? "Dinliyor" : "Çevrimdışı"}</span></div><div class="code">Authorization: Bearer &lt;uygulamaya özel anahtar&gt;<br>OpenAI uyumlu: POST /v1/chat/completions</div><p>API yalnızca bu cihazda dinler. Tarayıcı kaynakları engellenir. SDK: sdk/client.cjs · Diğer uygulamalar adaptörleriyle bağlanır.</p></section><div class="row-heading"><h2>Bekleyen işlem onayları</h2></div>${pendingHTML()}<div class="row-heading"><h2>İstemciler (${state.clients.length})</h2></div><section class="card">${state.clients.length ? state.clients.map((c) => `<div class="list-row"><span class="avatar">${esc(c.name.slice(0, 2).toUpperCase())}</span><div class="grow"><h3>${esc(c.name)}</h3><p>${c.scopes.map(esc).join(" · ") || "İzin verilmedi"}</p></div>${button("Erişimi iptal et", "revokeClient", c.id, "danger")}</div>`).join("") : "<p>Henüz istemci yok. SDK kullanan uygulamanız için anahtar oluşturun.</p>"}</section><div class="row-heading"><h2>Bağlı işlev sağlayıcıları (${state.providers.length})</h2></div><section class="card">${state.providers.length ? state.providers.map((p) => `<div class="list-row"><div class="grow"><h3>${esc(p.name)}</h3><p>${p.actions.map((a) => `${esc(a.label)} (${a.write ? "onaylı" : "okuma"})`).join(" · ")}</p></div><span class="badge online">● Bağlı</span></div>`).join("") : "<p>Çevrimiçi sağlayıcı bulunamadı. SDK ile kayıt olan uygulamalar burada görünür.</p>"}</section>`;
  if (page === "settings")
    html =
      heading("Merkez ayarları", "Görünüm, kurulum, veri alanı ve sürüm bilgileri.") +
      appearanceHTML() +
      `<div class="two-col"><section class="card"><h2>Yerel veri alanı</h2><p style="margin:15px 0">Paketler, kaynak ayarları ve erişim izinleri uygulamanın kullanıcı veri klasöründe saklanır.</p>${button("Klasörü aç ↗", "openData")}<div class="notice">API anahtarları bu merkezde özetlenerek saklanır. İstemci uygulamalar kendi anahtarlarını işletim sistemi kasalarında tutmalıdır.</div></section><section class="card"><h2>PluginLabs Hub 0.3.0</h2><p style="margin:15px 0">Electron masaüstü uygulaması · Yerel HTTP API<br>Windows ürün paketleri Windows üzerinde açılır.<br>Model motoru: Windows x64 / Linux x64 CPU.</p><div class="notice warn">Önizleme sürümü. Ürün indirmeleri ve motor kaynakları katalogda sabitlenmiştir. Üçüncü taraf çalıştırılabilir eklentiler doğrudan yüklenmez; işlevler izinli sağlayıcı SDK’sı üzerinden eklenir.</div></section></div>`;
  content.innerHTML = html;
}
function jobsHTML() {
  return state.jobs.length
    ? `<section class="card">${state.jobs
        .slice()
        .reverse()
        .map(
          (j) =>
            `<div class="list-row"><div class="grow"><h3>${esc(j.name)}</h3><p>${{ queued: "Sırada", downloading: "İndiriliyor", installing: "Kuruluyor", complete: "Tamamlandı", failed: "Başarısız", cancelled: "İptal edildi" }[j.status]}${j.error ? " · " + esc(j.error) : ""}</p>${["downloading", "installing"].includes(j.status) ? `<div class="progress"><span style="width:${Math.min(100, (j.bytes / (j.total || 1)) * 100)}%"></span></div><span class="subtle">${bytes(j.bytes)} / ${bytes(j.total)}</span>` : ""}</div>${["queued", "downloading", "installing"].includes(j.status) ? button("İptal", "cancel", j.id) : '<span class="time">' + date(j.time) + "</span>"}</div>`,
        )
        .join("")}</section>`
    : '<div class="empty">Henüz bir indirme başlatılmadı.</div>';
}
function pendingHTML() {
  const pending = state.pending.filter((p) => p.status === "pending");
  return pending.length
    ? `<section class="card">${pending.map((p) => `<div class="list-row"><div class="grow"><h3>${esc(p.label)}</h3><p>${esc(p.clientName)} · ${date(p.createdAt)}</p></div>${button("Reddet", "reject", p.id, "ghost")}${button("Onayla", "approve", p.id, "primary")}</div>`).join("")}</section>`
    : '<div class="empty">Bekleyen onay yok.</div>';
}
function navigate(next) {
  page = next;
  filter = "all";
  render();
  content.scrollIntoView({ block: "start" });
}
function showModal(body) {
  $("#modal-content").innerHTML = body;
  modal.showModal();
}
function closeModal() {
  modal.close();
  $("#modal-content").innerHTML = "";
  tokenOnce = null;
}
function manage(id) {
  const item = state.catalog.find((i) => i.id === id),
    record = state.installed[id];
  if (!record) return;
  const fields = Object.entries(record.settings || {})
    .map(([k, v]) =>
      typeof v === "boolean"
        ? `<label class="check"><input name="${esc(k)}" type="checkbox" ${v ? "checked" : ""}>${esc(k)}</label>`
        : `<label class="field"><span>${esc(k)}</span><input class="text" name="${esc(k)}" value="${esc(v)}" maxlength="200"></label>`,
    )
    .join("");
  showModal(
    `<div class="modal-title"><h2>${esc(item.name)}</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>${esc(item.description)}</p><div class="code">Sürüm: ${esc(record.version)}<br>Tür: ${kindLabels[item.kind]}<br>Durum: ${record.enabled ? "Etkin" : "Devre dışı"}${item.sha256 ? "<br>SHA-256: " + esc(item.sha256) : ""}</div><div class="button-row">${button(record.enabled ? "Devre dışı bırak" : "Etkinleştir", "toggle", id)}${item.repo || item.source ? button("Kaynağı gör ↗", "openSource", id) : ""}${record.previous ? button("Önceki sürüme dön", "rollback", id) : ""}${item.bundled ? button("JSON dışa aktar", "exportResource", id) : ""}</div>${fields ? `<form id="resource-form" data-id="${id}" style="margin-top:24px"><h3>Paket ayarları</h3>${fields}<button class="btn primary">Ayarları kaydet</button></form>` : ""}<div class="modal-actions">${button("Paketi kaldır", "confirmRemove", id, "danger")}</div>`,
  );
}
async function run(action, id, fn) {
  const key = action + id;
  if (busy.has(key)) return;
  busy.add(key);
  try {
    await fn();
    await refresh();
  } catch (e) {
    toast(
      e.message.replace(/^Error invoking remote method '[^']+': Error: /, ""),
    );
  } finally {
    busy.delete(key);
    if (state) render();
  }
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button,[data-go]");
  if (!b || b.disabled) return;
  if (b.dataset.page) return navigate(b.dataset.page);
  if (b.dataset.go) return navigate(b.dataset.go);
  if (b.dataset.filter) {
    filter = b.dataset.filter;
    return render();
  }
  const action = b.dataset.action,
    id = b.dataset.id || "";
  if (!action) return;
  if (action === "closeModal") return closeModal();
  if (action === "openPalette") return openPalette();
  if (action === "showShortcuts")
    return showModal(
      `<div class="modal-title"><h2>Klavye kısayolları</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><dl class="pl-kv"><dt>Komut paleti</dt><dd><span class="pl-kbd">Ctrl</span> <span class="pl-kbd">K</span></dd><dt>Aramaya git</dt><dd><span class="pl-kbd">/</span></dd><dt>Menüleri gezin</dt><dd><span class="pl-kbd">←</span> <span class="pl-kbd">→</span> <span class="pl-kbd">↓</span></dd><dt>Kapat</dt><dd><span class="pl-kbd">Esc</span></dd></dl><div class="modal-actions">${button("Tamam", "closeModal", "", "primary")}</div>`,
    );
  if (action === "showAbout")
    return showModal(
      `<div class="modal-title"><h2>PluginLabs Hub</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Uygulama, eklenti ve kaynak merkezi. Verileriniz bu cihazda saklanır; yerel API yalnızca 127.0.0.1 üzerinde dinler.</p><div class="notice">Arayüz: PluginLabs Advanced tasarım sistemi.</div><div class="modal-actions">${button("Tamam", "closeModal", "", "primary")}</div>`,
    );
  if (action === "goPro")
    return showModal(
      `<div class="modal-title"><h2>PluginLabs Pro</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Pro planı henüz yayında değil. Hesap, ücretli mağaza ve bulut eşitleme planlandı; şu an Hub tamamen yerel çalışır ve hiçbir veri hesaba bağlanmaz.</p><div class="notice">Pro yayına girdiğinde bu düğme plan seçimini açacak.</div><div class="modal-actions">${button("Tamam", "closeModal", "", "primary")}</div>`,
    );
  if (action === "manage") return manage(id);
  if (action === "openProduct") return openProduct(id);
  if (action === "pairBrowser") return pairBrowser();
  if (action === "idea") return showIdea(id);
  if (action === "confirmBrowser")
    return confirmBrowser(id, b.dataset.operation);
  if (action === "confirmAppExtension")
    return confirmAppExtension(id, b.dataset.operation);
  if (action === "installAppExtension") return installAppExtension();
  if (action === "newClient") {
    showModal(
      `<div class="modal-title"><h2>Uygulama erişimi oluştur</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><form id="client-form"><label class="field"><span>Uygulama adı</span><input class="text" name="name" maxlength="80" placeholder="Örn. Mind Palace adaptörü" required></label><h3>İzinler</h3><div class="scope-grid">${Object.entries(
        scopeLabels,
      )
        .map(
          ([s, label]) =>
            `<label class="check"><input type="checkbox" name="scope" value="${s}">${label}</label>`,
        )
        .join(
          "",
        )}</div><div class="modal-actions"><button class="btn primary">Anahtar oluştur</button></div></form>`,
    );
    return;
  }
  if (action === "confirmRemove") {
    showModal(
      `<div class="modal-title"><h2>Paketi kaldır</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>${esc(state.installed[id].name)} ve merkezdeki paket ayarları kaldırılacak. Uygulamanın kendi kullanıcı verileri korunur.</p><div class="modal-actions">${button("Vazgeç", "closeModal")}${button("Kaldır", "remove", id, "danger")}</div>`,
    );
    return;
  }
  await run(action, id, async () => {
    if (action === "install") {
      await call("install", id);
      toast(
        "Yükleme başlatıldı. İlerlemeyi İşlem geçmişi bölümünden izleyebilirsiniz.",
      );
    } else if (action === "toggle") {
      await call("toggle", id, !state.installed[id].enabled);
      closeModal();
    } else if (action === "remove") {
      await call("remove", id);
      closeModal();
      toast("Paket kaldırıldı");
    } else if (action === "approve" || action === "reject")
      await call("approve", id, action === "approve");
    else if (action === "checkUpdates") {
      updateResults = await call("checkUpdates");
      toast("Güncelleme denetimi tamamlandı");
    } else if (action === "copyToken") {
      await call("copy", tokenOnce);
      toast("Anahtar panoya kopyalandı");
    } else if (action === "startModel") {
      toast("My Mind başlatılıyor; ilk açılış biraz sürebilir.");
      await call("startModel");
      toast("My Mind hazır");
    } else if (action === "stopModel") await call("stopModel");
    else if (action === "importModel") {
      const model = await call("importModel");
      if (model)
        toast(
          model.verified
            ? "Model içe aktarıldı ve SHA-256 doğrulandı"
            : "Model içe aktarıldı (SHA256SUMS yoktu)",
        );
    } else if (action === "useCustomModel" || action === "useCatalogModel") {
      await call(
        "setModelSource",
        action === "useCustomModel" ? "custom" : "catalog",
      );
      toast(
        action === "useCustomModel"
          ? "My Mind özel modeli kullanacak; sunucuyu yeniden başlatın"
          : "My Mind katalog modelini kullanacak",
      );
    } else if (action === "removeCustomModel") {
      await call("removeCustomModel");
      toast("Özel model kaldırıldı");
    }
    else if (
      [
        "cancel",
        "launch",
        "rollback",
        "revokeClient",
        "exportResource",
        "openSource",
      ].includes(action)
    )
      await call(action, id);
    else if (action === "openData") await call("openData");
    else if (action === "browserAction") {
      await call("browserAction", browserSelection, id, b.dataset.operation);
      closeModal();
      toast(
        "İstek gönderildi. Tarayıcıdaki PluginLabs bağlantı eklentisini açıp onaylayın.",
      );
    } else if (action === "appExtensionAction") {
      await call("appExtensionAction", b.dataset.operation, id);
      closeModal();
      toast("Uygulama eklenti işlemi tamamlandı");
    } else if (
      [
        "exportBrowserBridge",
        "connectAppExtensions",
        "scanAppExtensions",
        "disconnectAppExtensions",
      ].includes(action)
    ) {
      const result = await call(action);
      if (action === "exportBrowserBridge" && result)
        toast("Bağlantı eklentisi seçtiğiniz klasöre çıkarıldı");
    } else if (action === "importPack") {
      const result = await call("importPack");
      if (result) toast("Kaynak paketi yükleniyor");
    }
  });
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.id === "client-form") {
    await run("createClient", "", async () => {
      const data = new FormData(form),
        created = await call(
          "createClient",
          data.get("name"),
          data.getAll("scope"),
        );
      tokenOnce = created.token;
      $("#modal-content").innerHTML =
        `<div class="modal-title"><h2>Uygulama anahtarı hazır</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Bu anahtar yalnızca şimdi gösterilir. Güvenli biçimde kaydedin ve uygulamanızın ortam değişkenine veya anahtar kasasına ekleyin.</p><div class="code">${esc(tokenOnce)}</div><div class="button-row">${button("Anahtarı kopyala", "copyToken")}${button("Tamam", "closeModal", "", "primary")}</div>`;
    });
  }
  if (form.id === "resource-form") {
    const id = form.dataset.id,
      settings = {};
    for (const [k, v] of Object.entries(state.installed[id].settings)) {
      const field = form.elements.namedItem(k);
      settings[k] = typeof v === "boolean" ? field.checked : field.value;
    }
    await run("settings", id, async () => {
      await call("settings", id, settings);
      toast("Paket ayarları kaydedildi");
    });
  }
  if (form.id === "chat-form") {
    const prompt = new FormData(form).get("prompt");
    busy.add("chat");
    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Yanıt hazırlanıyor…";
    try {
      const response = await call("chat", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
      });
      chatResult = response.choices?.[0]?.message?.content || "Boş yanıt";
    } catch (e) {
      chatResult = e.message;
    } finally {
      busy.delete("chat");
      render();
    }
  }
});
$("#search").addEventListener("input", (e) => {
  query = e.target.value;
  if (
    query &&
    !["discover", "resources", "apps", "ideas", "extensions"].includes(page)
  ) {
    page = "discover";
    filter = "all";
  }
  render();
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) &&
    !modal.open
  ) {
    e.preventDefault();
    $("#search").focus();
  }
});
const plIco = (d) =>
  `<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
function statusCards(withStats) {
  const m = state.model,
    api = state.api;
  const srvState = m.error
    ? ["error", "Hata"]
    : m.running
      ? ["online", "Çalışıyor"]
      : m.starting
        ? ["syncing", "Başlatılıyor"]
        : ["", "Kapalı"];
  const apiState = api.running ? ["online", "Hazır"] : ["error", "Çevrimdışı"];
  const srv = `<div class="pl-card pl-row status-card" data-card="server"><span class="pl-avatar pl-avatar--accent">${plIco('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>')}</span><div class="sc-main"><b>My Mind sunucusu</b><div class="pl-muted pl-num">127.0.0.1:8765 · ${m.running ? "yanıt veriyor" : "yerel model"}</div></div><span class="pl-status ${srvState[0] ? "pl-status--" + srvState[0] : ""}">${srvState[1]}</span></div>`;
  const con = `<div class="pl-card pl-row status-card" data-card="connection"><span class="pl-avatar pl-avatar--accent">${plIco('<path d="M5 12a7 7 0 0 1 14 0"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0"/><circle cx="12" cy="12" r="1"/><path d="M12 13v7"/>')}</span><div class="sc-main"><b>Uygulama bağlantısı</b><div class="pl-muted pl-num">127.0.0.1:${api.port || 47632} · ${state.clients.length} istemci · ${state.providers.length} sağlayıcı</div></div><span class="pl-status ${"pl-status--" + apiState[0]}">${apiState[1]}</span></div>`;
  let html = `<div class="status-row">${srv}${con}</div>`;
  if (withStats) {
    const active = state.jobs.filter((j) =>
      ["queued", "downloading", "installing"].includes(j.status),
    ).length;
    const stat = (c, ic, lbl, val) =>
      `<div class="pl-statcard" style="--c:var(--pl-viz-${c})"><span class="pl-statcard__ic">${plIco(ic)}</span><span class="pl-statcard__lbl">${lbl}</span><span class="pl-statcard__val">${val}</span></div>`;
    html += `<div class="stat-row">${stat(7, '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m9 12 2 2 4-4"/>', "Yüklü paket", Object.keys(state.installed).length)}${stat(1, '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.6 10.5 15.4 7.5M8.6 13.5l6.8 3"/>', "Bağlı sağlayıcı", state.providers.length)}${stat(3, '<path d="M15 7a4 4 0 1 1-3.5 6L4 20.5V17H1" transform="translate(2 -1)"/>', "API istemcisi", state.clients.length)}${stat(5, '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>', "Etkin indirme", active)}</div>`;
  }
  return html;
}
let tickerKey = "";
function renderTicker() {
  const track = $("#ticker-track");
  if (!track || !state) return;
  const items = [];
  items.push(
    state.api.running
      ? `Yerel API <b>127.0.0.1:${state.api.port}</b> hazır`
      : "Yerel API <b>çevrimdışı</b>",
  );
  items.push(
    `My Mind sunucusu <b>${state.model.running ? "çalışıyor" : state.model.starting ? "başlıyor" : "kapalı"}</b>`,
  );
  items.push(`Yüklü paket <b>${Object.keys(state.installed).length}</b>`);
  items.push(
    `Sağlayıcı <b>${state.providers.length}</b> · İstemci <b>${state.clients.length}</b>`,
  );
  state.jobs
    .filter((j) => ["queued", "downloading", "installing"].includes(j.status))
    .slice(0, 2)
    .forEach((j) =>
      items.push(
        `İşlem <b>${esc(j.item)}</b> ${j.total ? "%" + Math.min(100, Math.round((j.bytes / j.total) * 100)) : "sürüyor"}`,
      ),
    );
  state.activity
    .slice(0, 3)
    .forEach((a) => items.push(`${esc(date(a.time))} <b>${esc(a.message)}</b>`));
  const html = items.map((t) => `<span>${t}</span>`).join("");
  if (html === tickerKey) return;
  tickerKey = html;
  track.innerHTML = html + html;
  track.style.setProperty("--ticker-dur", Math.max(24, items.length * 7) + "s");
}
function updateMenuServer() {
  const el = $("#mb-server");
  if (!el || !state) return;
  const running = state.model.running || state.model.starting;
  el.outerHTML = `<button id="mb-server" class="pl-menuitem" role="menuitem" data-action="${running ? "stopModel" : "startModel"}">${running ? "My Mind sunucusunu durdur" : "My Mind sunucusunu başlat"}</button>`;
}
const menubar = $(".menubar");
function closeMenus(focusBtn) {
  menubar.querySelectorAll(".mb-drop").forEach((d) => (d.hidden = true));
  menubar.querySelectorAll(".mb-btn").forEach((b) => {
    b.setAttribute("aria-expanded", "false");
    if (focusBtn && b === focusBtn) b.focus();
  });
}
function openMenu(btn) {
  closeMenus();
  btn.setAttribute("aria-expanded", "true");
  const d = btn.nextElementSibling;
  d.hidden = false;
}
menubar.addEventListener("click", (e) => {
  const b = e.target.closest(".mb-btn");
  if (b) {
    const open = b.getAttribute("aria-expanded") === "true";
    open ? closeMenus() : openMenu(b);
    return;
  }
  const it = e.target.closest(".pl-menuitem");
  if (!it) return;
  if (it.dataset.setPalette) window.plTheme.set({ palette: it.dataset.setPalette });
  if (it.dataset.setMode) window.plTheme.set({ mode: it.dataset.setMode });
  if (it.dataset.setPalette || it.dataset.setMode) render();
  closeMenus();
});
menubar.addEventListener("mouseover", (e) => {
  const b = e.target.closest(".mb-btn");
  if (b && menubar.querySelector('.mb-btn[aria-expanded="true"]') && b.getAttribute("aria-expanded") !== "true") openMenu(b);
});
menubar.addEventListener("keydown", (e) => {
  const btns = [...menubar.querySelectorAll(".mb-btn")];
  const cur = document.activeElement.closest(".mb-menu")?.querySelector(".mb-btn");
  if (e.key === "Escape") return closeMenus(cur);
  if (!cur) return;
  const i = btns.indexOf(cur);
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    const n = btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length];
    n.focus();
    if (menubar.querySelector('.mb-btn[aria-expanded="true"]')) openMenu(n);
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (cur.getAttribute("aria-expanded") !== "true") openMenu(cur);
    const items = [...cur.nextElementSibling.querySelectorAll(".pl-menuitem")];
    const at = items.indexOf(document.activeElement);
    items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".menubar")) closeMenus();
});
function syncPlTheme() {
  const m = document.documentElement.dataset.mode === "light" ? "light" : "dark";
  document.querySelectorAll("[data-pl]").forEach((e) => (e.dataset.plTheme = m));
}
new MutationObserver(syncPlTheme).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-mode"],
});
syncPlTheme();
/* Komut paleti (Ctrl/⌘+K) — PluginLabs Advanced PLC-033, opak panel */
const palette = $("#palette"),
  paletteInput = $("#palette-input"),
  paletteList = $("#palette-list");
let paletteItems = [],
  paletteIndex = 0;
const paletteIcon = (d) =>
  `<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
function paletteSource() {
  const pages = Object.keys(titles)
    .filter((k) => k !== "product")
    .map((k) => ({
      group: "Sayfalar",
      label: titles[k],
      run: () => navigate(k),
      icon: paletteIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    }));
  const apps = (state?.catalog || [])
    .filter((i) => i.kind === "app")
    .map((i) => ({
      group: "Uygulamalar",
      label: i.name,
      run: () => {
        query = i.name;
        $("#search").value = query;
        page = "discover";
        filter = "all";
        render();
      },
      icon: paletteIcon('<rect x="4" y="4" width="16" height="16" rx="3"/>'),
    }));
  const actions = [
    {
      group: "Eylemler",
      label: "Güncellemeleri denetle",
      run: () => navigate("updates"),
      icon: paletteIcon('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
    },
    {
      group: "Eylemler",
      label: "Aramaya git",
      run: () => $("#search").focus(),
      icon: paletteIcon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    },
  ];
  return [...actions, ...pages, ...apps];
}
function paletteRender() {
  const q = paletteInput.value.trim().toLocaleLowerCase("tr");
  paletteItems = paletteSource()
    .filter((i) => !q || i.label.toLocaleLowerCase("tr").includes(q))
    .slice(0, 30);
  paletteIndex = Math.min(paletteIndex, Math.max(paletteItems.length - 1, 0));
  let last = "",
    html = "";
  paletteItems.forEach((it, n) => {
    if (it.group !== last) {
      html += `<div class="pl-cmdk__group pl-label" role="presentation">${esc(it.group)}</div>`;
      last = it.group;
    }
    html += `<div class="pl-menuitem${n === paletteIndex ? " is-active" : ""}" role="option" id="palette-opt-${n}" data-n="${n}" aria-selected="${n === paletteIndex}">${it.icon}${esc(it.label)}${n === paletteIndex ? '<span class="pl-kbd">↵</span>' : ""}</div>`;
  });
  paletteList.innerHTML =
    html || '<div class="pl-cmdk__empty">Sonuç bulunamadı.</div>';
  paletteInput.setAttribute("aria-activedescendant", paletteItems.length ? `palette-opt-${paletteIndex}` : "");
  paletteList.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}
function openPalette() {
  if (palette.open || modal.open) return;
  paletteInput.value = "";
  paletteIndex = 0;
  paletteRender();
  palette.showModal();
  paletteInput.focus();
}
function runPalette(n) {
  const it = paletteItems[n];
  if (!it) return;
  palette.close();
  it.run();
}
paletteInput.addEventListener("input", () => {
  paletteIndex = 0;
  paletteRender();
});
paletteInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const len = paletteItems.length;
    if (!len) return;
    paletteIndex = (paletteIndex + (e.key === "ArrowDown" ? 1 : len - 1)) % len;
    paletteRender();
  } else if (e.key === "Enter") {
    e.preventDefault();
    runPalette(paletteIndex);
  }
});
paletteList.addEventListener("click", (e) => {
  const o = e.target.closest("[data-n]");
  if (o) runPalette(Number(o.dataset.n));
});
palette.addEventListener("click", (e) => {
  if (e.target === palette) palette.close();
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    palette.open ? palette.close() : openPalette();
  }
});
modal.addEventListener("close", () => {
  tokenOnce = null;
});
if (api) {
  refresh().catch((e) => toast(e.message));
  setInterval(() => {
    const editing =
      modal.open ||
      document.activeElement.closest?.("form") ||
      busy.has("chat");
    refresh(
      !editing &&
        ([
          "activity",
          "updates",
          "apps",
          "discover",
          "resources",
          "api",
          "home",
          "extensions",
          "ideas",
        ].includes(page) ||
          state?.model.starting),
    ).catch(() => {});
  }, 1600);
} else {
  content.innerHTML =
    '<div class="empty">PluginLabs Hub arayüzünü masaüstü uygulaması üzerinden açın.<br><code>npm start</code></div>';
}
function ideaCard(item) {
  const id = item.id.toLowerCase(),
    installed = state.installed[id],
    job = state.jobs.find(
      (j) =>
        j.item === id &&
        ["queued", "downloading", "installing"].includes(j.status),
    );
  return `<article class="card idea-card"><div class="card-top"><span class="app-icon">${item.id.startsWith("PL-04") ? "⌘" : "◇"}</span><div><h3>${esc(item.name)}</h3><small>${esc(item.id)} · v0.2.0</small></div></div><p>${esc(item.description)}</p><div class="idea-platform">${esc(item.fields.Platform)}</div><div class="card-bottom"><span class="badge ${installed ? "online" : ""}">${installed ? "● Yüklü · Önizleme" : "Kurulabilir önizleme"}</span>${job ? button("Yükleniyor…", "cancel", job.id) : installed ? button("Aç ↗", "openProduct", id, "primary") : button("＋ Yükle", "install", id, "primary")}</div><div class="detail-actions">${button("Kapsamı gör", "idea", item.id)}${installed ? button("Paket ayarları", "manage", id) : ""}</div></article>`;
}
function ideasPage() {
  let items = state.ideas.filter(
    (i) =>
      !query ||
      `${i.id} ${i.name} ${i.description} ${Object.values(i.fields).join(" ")}`
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  if (filter !== "all")
    items = items.filter((i) =>
      filter === "browser"
        ? /Chrome|tarayıcı/i.test(i.fields.Platform)
        : filter === "desktop"
          ? /masaüstü|W \/ L \/ M|W\/L\/M/i.test(i.fields.Platform)
          : /widget|balon/i.test(i.fields.Platform),
    );
  return (
    heading(
      "Uygulama kataloğu",
      "Uygulamaları keşfedin, ne işe yaradıklarını öğrenin ve çalışma alanınıza yükleyin.",
      `<span class="pill">${items.length} / 50 ÜRÜN</span>`,
    ) +
    `<div class="filters">${[
      ["all", "Tümü"],
      ["browser", "Tarayıcı"],
      ["desktop", "Masaüstü"],
      ["widget", "Widget / balon"],
    ]
      .map(
        ([id, label]) =>
          `<button class="filter ${filter === id ? "active" : ""}" data-filter="${id}">${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="notice">50 ürünün tamamını yerel önizleme paketi olarak yükleyebilirsiniz. Her paket ürün kapsamı, kalıcı notlar, geliştirme listesi ve kendi ayarlarını içerir. Planlanan ana işlevlerin geliştirme durumu ürün içinde gösterilir.</div><div class="app-grid">${items.map(ideaCard).join("")}</div>`
  );
}
async function showIdea(id) {
  try {
    const i = await call("idea", id),
      plain = i.spec
        .replace(/<mention url="([^"]+)"[^>]*>(.*?)<\/mention>/gs, "$2 ($1)")
        .replace(/<[^>]+>/g, "");
    showModal(
      `<div class="modal-title"><div><div class="eyebrow">${esc(i.id)} · UYGULAMA BİLGİLERİ</div><h2>${esc(i.name)}</h2><p>${esc(i.description)}</p></div><button data-action="closeModal" aria-label="Kapat">×</button></div><div class="spec-fields">${Object.entries(
        i.fields,
      )
        .filter(([key]) => key !== "Kullanıcı ve problem")
        .map(([k, v]) => `<h3>${esc(k)}</h3><p>${esc(v)}</p>`)
        .join(
          "",
        )}</div><details><summary>Ayrıntılı ürün kapsamı</summary><pre class="spec-text">${esc(plain)}</pre></details><div class="code">Kaynak: ${esc(i.source)}</div><div class="modal-actions"><button class="btn" data-action="copyIdeaSource" data-id="${i.id}">Kaynak bağlantısını kopyala</button>${button("Kapat", "closeModal", "", "primary")}</div>`,
    );
  } catch (e) {
    toast(e.message);
  }
}
function extensionsPage() {
  const mode = ["browser", "hub", "applications"].includes(filter)
    ? filter
    : "browser";
  const data = state.extensions || { browsers: [], commands: [] };
  let html =
    heading(
      "Eklentileriniz. Ortak bir merkez.",
      "Tarayıcı, PluginLabs ve uygulama eklentilerini aynı tasarım içinde yönetin.",
      `<div class="button-row">${button("Bağlantı eklentisini çıkar", "exportBrowserBridge")}${button("＋ Tarayıcı bağla", "pairBrowser", "", "primary")}</div>`,
    ) +
    `<div class="filters">${[
      ["browser", "Chrome / Opera / Tarayıcılar"],
      ["hub", "PluginLabs eklentileri"],
      ["applications", "Diğer uygulamalar"],
    ]
      .map(
        ([id, label]) =>
          `<button class="filter ${mode === id ? "active" : ""}" data-filter="${id}">${label}</button>`,
      )
      .join("")}</div>`;
  if (mode === "hub")
    return (
      html +
      grid(
        state.catalog.filter(
          (i) =>
            ["plugin", "asset", "template", "library"].includes(i.kind) &&
            matches(i),
        ),
      )
    );
  if (mode === "applications") {
    const host = state.appExtensions;
    html += `<section class="card"><div class="page-heading"><div><h2>VS Code / VSCodium</h2><p>Uygulamanın kendi CLI’siyle gerçek eklenti yönetimi. Tarayıcı profilleri ve uygulama dosyaları elle değiştirilmez.</p></div>${host.connected ? `<div class="button-row">${button("Envanteri yenile", "scanAppExtensions")}${button("Eklenti kur", "installAppExtension", "", "primary")}${button("Bağlantıyı kaldır", "disconnectAppExtensions")}</div>` : button("Uygulama dosyasını seç", "connectAppExtensions", "", "primary")}</div><div class="notice">${host.connected ? `${esc(host.name)} bağlı. ${host.lastScan ? "Son tarama: " + date(host.lastScan) : "Envanteri yenileyin."}` : "VS Code için Windows’ta Code.exe, Linux’ta code dosyasını seçin."} Açma/kapatma ve eklentiye özgü ayarlar uygulamanın kendi eklenti ekranından yönetilir.</div>${
      host.items.length
        ? host.items
            .filter(
              (i) => !query || i.id.toLowerCase().includes(query.toLowerCase()),
            )
            .map(
              (i) =>
                `<div class="list-row"><span class="app-icon">⌘</span><div class="grow"><h3>${esc(i.id)}</h3><p>v${esc(i.version)}</p></div><button class="btn" data-action="confirmAppExtension" data-id="${esc(i.id)}" data-operation="update">Güncelle</button><button class="btn danger" data-action="confirmAppExtension" data-id="${esc(i.id)}" data-operation="uninstall">Kaldır</button></div>`,
            )
            .join("")
        : '<div class="empty">Henüz uygulama eklenti envanteri yok.</div>'
    }</section><div class="notice">Diğer uygulamalar, PluginLabs sağlayıcı SDK’sıyla API ve izinler bölümüne bağlanabilir. Bu sürümün doğrudan eklenti adaptörü VS Code ve VSCodium içindir.</div>`;
    return html;
  }
  html += `<div class="notice">Bağlantı eklentisini klasöre çıkarın. Chrome: chrome://extensions · Opera: opera://extensions → Geliştirici modu → Paketlenmemiş eklenti yükle. Eklentinin panelindeki kimlikle tarayıcıyı eşleştirin; Hub’ın verdiği anahtarı aynı panele girin. Değişiklikler tarayıcı panelinde onaylanır.</div>`;
  if (!data.browsers.length)
    return (
      html +
      `<div class="empty"><span>◇</span>Henüz tarayıcı bağlı değil.<br>Bağlantı eklentisi Chrome, Opera, Edge, Brave ve Chromium ile aynı izinli protokolü kullanır.</div>`
    );
  if (!data.browsers.some((b) => b.clientId === browserSelection))
    browserSelection = data.browsers[0].clientId;
  const browser = data.browsers.find((b) => b.clientId === browserSelection);
  html += `<div class="browser-toolbar"><label class="field"><span>Bağlı tarayıcı / profil</span><select id="browser-selection">${data.browsers.map((b) => `<option value="${b.clientId}" ${b.clientId === browserSelection ? "selected" : ""}>${esc(b.name)} · ${b.online ? "Bağlı" : "Çevrimdışı"} · ${esc(b.clientId.slice(0, 6))}</option>`).join("")}</select></label><span class="badge ${browser.online ? "online" : ""}">${browser.online ? "● Bağlı" : "○ Çevrimdışı"} · ${browser.extensions.length} eklenti · ${date(browser.lastSeen)}</span></div>`;
  const pending = data.commands
    .filter((c) => c.clientId === browserSelection)
    .slice(-5);
  if (pending.length)
    html += `<section class="card extension-jobs">${pending.map((c) => `<div class="list-row"><div class="grow"><h3>${esc(c.extensionName)} · ${esc({ enable: "Etkinleştir", disable: "Devre dışı bırak", uninstall: "Kaldır", options: "Ayarlar" }[c.action])}</h3><p>${esc({ pending: "Bağlantı eklentisine gönderiliyor", "awaiting-confirmation": "Tarayıcıdaki PluginLabs panelinde onayınızı bekliyor", complete: "Tamamlandı", failed: "Başarısız", expired: "Süresi doldu" }[c.status])}${c.error ? " · " + esc(c.error) : ""}</p></div></div>`).join("")}</section>`;
  html += `<div class="app-grid">${browser.extensions
    .filter(
      (i) =>
        !query ||
        `${i.name} ${i.id}`
          .toLocaleLowerCase("tr")
          .includes(query.toLocaleLowerCase("tr")),
    )
    .map(
      (i) =>
        `<article class="card"><div class="card-top"><span class="app-icon">◇</span><div><h3>${esc(i.name)}</h3><small>${esc(browser.name)} · v${esc(i.version)}</small></div></div><p>${esc(i.description)}</p><span class="badge ${i.enabled ? "online" : ""}">${i.enabled ? "● Etkin" : "○ Devre dışı"}${i.id === browser.bridgeId ? " · Hub bağlantısı" : ""}</span><details class="extension-permissions"><summary>İzinler ve eklenti kimliği</summary><div class="code">${esc(i.id)}<br>${[...i.permissions, ...i.hostPermissions].map(esc).join("<br>") || "Ek izin bildirilmedi"}</div></details><div class="button-row">${i.id === browser.bridgeId ? '<span class="subtle">Bağlantı eklentisini tarayıcınızdan yönetin.</span>' : `<button class="btn" data-action="confirmBrowser" data-id="${i.id}" data-operation="${i.enabled ? "disable" : "enable"}" ${!browser.online || !i.mayDisable ? "disabled" : ""}>${i.enabled ? "Devre dışı bırak" : "Etkinleştir"}</button><button class="btn ghost" data-action="confirmBrowser" data-id="${i.id}" data-operation="options" ${!browser.online ? "disabled" : ""}>Ayarlar</button><button class="btn danger" data-action="confirmBrowser" data-id="${i.id}" data-operation="uninstall" ${!browser.online || !i.mayDisable ? "disabled" : ""}>Kaldır</button>`}</div></article>`,
    )
    .join("")}</div>`;
  return html;
}
function pairBrowser() {
  showModal(
    `<div class="modal-title"><h2>Tarayıcı bağlantısı</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Önce bağlantı eklentisini tarayıcınıza yükleyin. Açılan paneldeki 32 harfli eklenti kimliğini aşağıya girin. Her profil için ayrı bağlantı oluşturun.</p><form id="browser-form"><label class="field"><span>Tarayıcı</span><select name="browser">${["Chrome", "Opera", "Edge", "Brave", "Chromium"].map((n) => `<option>${n}</option>`).join("")}</select></label><label class="field"><span>PluginLabs Browser Bridge eklenti kimliği</span><input class="text" name="extensionId" pattern="[a-p]{32}" minlength="32" maxlength="32" required placeholder="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></label><div class="modal-actions"><button class="btn primary">Bağlantı anahtarı oluştur</button></div></form>`,
  );
}
function confirmBrowser(id, operation) {
  const b = state.extensions.browsers.find(
      (b) => b.clientId === browserSelection,
    ),
    i = b?.extensions.find((i) => i.id === id);
  if (!i) return;
  showModal(
    `<div class="modal-title"><h2>${esc(i.name)}</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>${esc(b.name)} için “${esc({ enable: "Etkinleştir", disable: "Devre dışı bırak", uninstall: "Kaldır", options: "Ayarları aç" }[operation])}” isteği gönderilecek. Tarayıcıdaki PluginLabs panelinden onaylayın. Kaldırma, eklentinin kendi verilerini de silebilir.</p><div class="modal-actions">${button("Vazgeç", "closeModal")}<button class="btn ${operation === "uninstall" ? "danger" : "primary"}" data-action="browserAction" data-id="${id}" data-operation="${esc(operation)}">İsteği gönder</button></div>`,
  );
}
function confirmAppExtension(id, operation) {
  showModal(
    `<div class="modal-title"><h2>Uygulama eklentisi</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>${esc(id)}: ${operation === "uninstall" ? "Eklenti uygulamanın kendi yöneticisiyle kaldırılacak." : "Uygulamanın eklenti kaynağındaki güncel sürüm kurulacak."}</p><div class="modal-actions">${button("Vazgeç", "closeModal")}<button class="btn ${operation === "uninstall" ? "danger" : "primary"}" data-action="appExtensionAction" data-id="${esc(id)}" data-operation="${esc(operation)}">${operation === "uninstall" ? "Kaldır" : "Güncelle"}</button></div>`,
  );
}
function installAppExtension() {
  showModal(
    `<div class="modal-title"><h2>Uygulama eklentisi kur</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Uygulamanın eklenti kaynağından paket indirip kurar. Yayımcıyı ve paketi doğrulayın.</p><form id="app-extension-form"><label class="field"><span>Eklenti kimliği</span><input class="text" name="extension" required pattern="[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+" placeholder="yayimci.eklenti"></label><div class="modal-actions"><button class="btn primary">İndir ve kur</button></div></form>`,
  );
}
document.addEventListener("change", (e) => {
  const choice = e.target.closest?.('.choice input[type="radio"]');
  if (choice) {
    window.plTheme.set({ [choice.name]: choice.value });
    render();
    document.querySelector(`.choice input[name="${choice.name}"]:checked`)?.focus();
    return;
  }
  if (e.target.id === "browser-selection") {
    browserSelection = e.target.value;
    render();
  }
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (b?.dataset.action === "copyIdeaSource") {
    const item = state.ideas.find((i) => i.id === b.dataset.id);
    if (item) {
      await call("copy", item.source);
      toast("Kaynak bağlantısı kopyalandı");
    }
  }
});
document.addEventListener("submit", async (e) => {
  if (e.target.id === "browser-form") {
    e.preventDefault();
    const data = new FormData(e.target);
    await run("createBrowser", "", async () => {
      const created = await call(
        "createBrowser",
        data.get("browser"),
        data.get("extensionId"),
      );
      tokenOnce = created.token;
      $("#modal-content").innerHTML =
        `<div class="modal-title"><h2>Tarayıcı anahtarı hazır</h2><button data-action="closeModal" aria-label="Kapat">×</button></div><p>Bu anahtarı tarayıcıdaki PluginLabs Browser Bridge paneline girin. Yerel API portu: ${state.api.port || 47632}. İlk eşitlemeden sonra eklentiler burada görünür.</p><div class="code">${esc(tokenOnce)}</div><div class="modal-actions">${button("Anahtarı kopyala", "copyToken")}${button("Tamam", "closeModal", "", "primary")}</div>`;
    });
  }
  if (e.target.id === "app-extension-form") {
    e.preventDefault();
    const id = new FormData(e.target).get("extension");
    await run("appExtensionInstall", "", async () => {
      await call("appExtensionAction", "install", id);
      closeModal();
      toast("Uygulama eklentisi kuruldu");
    });
  }
});
async function openProduct(id) {
  try {
    productData = await call("readProduct", id);
    openProductId = id;
    page = "product";
    render();
    content.scrollIntoView({ block: "start" });
  } catch (e) {
    toast(e.message);
  }
}
function productTasks() {
  const pack = productData.package;
  const source = pack.spec
    .split("\n")
    .filter((line) => line.startsWith("- [ ] "))
    .map((line) => line.slice(6));
  return source.length
    ? source.slice(0, 100)
    : [
        pack.fields["MVP ve temel akış"],
        pack.fields["Teknik bağımlılık ve sınır"],
        pack.fields["Doğrulama ölçütü"],
      ].filter(Boolean);
}
function productPage() {
  if (!productData)
    return '<div class="empty">Uygulamalarım bölümünden bir ürün paketi açın.</div>';
  const pack = productData.package,
    workspace = productData.workspace,
    settings = state.installed[openProductId]?.settings || {};
  return (
    heading(
      esc(pack.name),
      `${esc(pack.productId)} · Yerel ürün önizlemesi · Yüklü paket v0.2.0`,
      button("Paket ayarları", "manage", openProductId),
    ) +
    `<div class="notice">Bu kurulabilir sürüm; ürün kapsamı, not defteri ve geliştirme listesini içerir. Planlanan ana özellikler geliştirme aşamasındadır.</div><div class="two-col"><section class="card"><h2>Ürün kapsamı</h2><div class="spec-fields">${Object.entries(
      pack.fields,
    )
      .filter(([key]) => key !== "Kullanıcı ve problem")
      .map(([k, v]) => `<h3>${esc(k)}</h3><p>${esc(v)}</p>`)
      .join(
        "",
      )}</div></section><section class="card"><form id="product-workspace-form"><h2>Çalışma alanım</h2><label class="field" style="margin-top:20px"><span>Ürüne özel notlar</span><textarea name="notes" maxlength="20000" placeholder="Bu ürünle ilgili kullanım notlarınız…">${esc(workspace.notes)}</textarea></label>${
      settings.showDevelopmentTasks
        ? `<h3>Geliştirme / inceleme listem</h3><p>İşaretler kişisel takip listenizdir; ürün özelliğinin kodlandığını ifade etmez.</p>${productTasks()
            .map(
              (task, index) =>
                `<label class="check"><input type="checkbox" name="completed" value="${index}" ${workspace.completed.includes(index) ? "checked" : ""}><span>${esc(task.replace(/<[^>]+>/g, ""))}</span></label>`,
            )
            .join("")}`
        : ""
    }<button class="btn primary">Notları ve listeyi kaydet</button><p class="subtle" style="margin-top:12px">${workspace.updatedAt ? "Son kayıt: " + date(workspace.updatedAt) : "Notlarınız bu cihazda saklanır."}</p></form></section></div>`
  );
}
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "product-workspace-form") return;
  e.preventDefault();
  const data = new FormData(e.target);
  await run("saveProduct", openProductId, async () => {
    productData.workspace = await call("saveProduct", openProductId, {
      notes: data.get("notes"),
      completed: state.installed[openProductId].settings.showDevelopmentTasks
        ? data.getAll("completed").map(Number)
        : productData.workspace.completed,
    });
    toast("Ürün çalışma alanı kaydedildi");
  });
});
