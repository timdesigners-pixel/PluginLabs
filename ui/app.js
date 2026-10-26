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
  browserSelection = "";
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
  extensions: "Eklenti yöneticisi",
  ideas: "Notion kataloğu",
};
const kindLabels = {
  app: "Uygulama",
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
  return `<article class="card"><div class="card-top">${icon(item.id)}<div><h3>${esc(item.name)}</h3><small>${kindLabels[item.kind]} · v${esc(installed?.version || item.version)}</small></div></div><p>${esc(item.description)}</p>${job ? `<div class="progress"><span style="width:${Math.min(100, (job.bytes / (job.total || 1)) * 100)}%"></span></div><div class="subtle">${bytes(job.bytes)} / ${bytes(job.total)}</div>` : ""}<div class="card-bottom"><span class="badge ${installed?.enabled ? "online" : ""}">${installed ? `<i class="status-dot"></i>${installed.enabled ? "Yüklü" : "Devre dışı"}` : bytes(item.size)}</span>${job ? button("İptal", "cancel", job.id) : !installed ? button("＋ Yükle", "install", item.id) : different ? button("Güncelle", "install", item.id, "primary") : item.kind === "app" ? button("Aç ↗", "launch", item.id) : button("Yönet", "manage", item.id)}</div>${installed ? `<div class="detail-actions"><button class="text-button" data-action="manage" data-id="${item.id}">Ayarlar ve paket bilgisi</button></div>` : ""}</article>`;
}
function grid(items) {
  return items.length
    ? `<div class="app-grid">${items.map(card).join("")}</div>`
    : '<div class="empty"><span>⌕</span>Bu görünümde henüz içerik yok.<br>Katalogdan paket yükleyebilir veya aramayı değiştirebilirsiniz.</div>';
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
    html = `${heading("Her şey, tek bir yerde.", "Uygulamalarınız, yaratıcı kaynaklarınız ve yerel yapay zekânız.", `<span class="pill">KİŞİSEL ÇALIŞMA ALANI</span>`)}<section class="hero"><div class="hero-copy"><div class="eyebrow">TANIŞTIRALIM · MY MIND</div><h2>Küçük model.<br>Büyük bir çalışma alanı.</h2><p>My Mind’i cihazınıza yükleyin. Metinleri özetleyin, fikirlerinizi düzenleyin ve uygulamalarınıza yerel AI ekleyin.</p><button class="btn primary" data-go="mymind">My Mind’i keşfet <span>↗</span></button></div><div class="hero-art" aria-hidden="true"><span class="orbit"></span><span class="orbit two"></span><span class="ai-symbol">✳</span><span class="float-chip top">ON-DEVICE INTELLIGENCE</span><span class="float-chip">● Yerel sunucu · Kontrol sizde</span></div></section><div class="row-heading"><h2>Çalışma alanınız için</h2><button class="text-button" data-go="discover">Tüm uygulamalar ↗</button></div>${grid([...apps, ...catalog.filter((i) => i.id === "mymind-lite")])}<div class="section-split"><section class="card"><div class="row-heading" style="margin-top:0"><h2>Kaynak kütüphanesi</h2><button class="text-button" data-go="resources">Tümünü gör ↗</button></div>${resources
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
        `<div class="button-row"><button class="btn" data-go="ideas">Notion kataloğu · 50 ürün</button><button class="btn primary" data-go="discover">＋ Uygulama ekle</button></div>`,
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
  if (page === "extensions") html = extensionsPage();
  if (page === "mymind") {
    const ready =
      state.installed["mymind-lite"]?.enabled &&
      state.installed["llama-engine"]?.enabled;
    html =
      heading(
        "My Mind. Sizin cihazınızda.",
        "Yerel model kurulumu, sunucu yönetimi ve uygulamalar için ortak AI erişimi.",
        `<span class="pill">${state.model.running ? "● SUNUCU HAZIR" : state.model.starting ? "BAŞLATILIYOR" : "SUNUCU KAPALI"}</span>`,
      ) +
      `<div class="notice">My Mind Lite, Qwen3 0.6B açık modelini llama.cpp ile çalıştırır. İndirmeler internet gerektirir; metin analizi yerel sunucuda yapılır. İlk sürüm CPU kullanır.</div><div class="model-grid">${catalog
        .filter((i) => ["mymind-lite", "llama-engine"].includes(i.id))
        .map(card)
        .join(
          "",
        )}</div><div class="two-col"><section class="card"><h2>Yerel model sunucusu</h2><p style="margin:13px 0 20px">Motor: 127.0.0.1:8765<br>Uygulama API’si: 127.0.0.1:${state.api.port || 47632}/v1<br>Bağlam: 4096 token · Çıktı: en fazla 512 token</p>${state.model.error ? `<p class="error">${esc(state.model.error)}</p>` : ""}<div class="button-row">${state.model.running || state.model.starting ? button("Sunucuyu durdur", "stopModel", "", "danger") : ready ? button("▶ Sunucuyu başlat", "startModel", "", "primary") : '<span class="subtle">Başlatmak için model ve motoru yükleyip etkinleştirin.</span>'}</div><div class="notice">LM Studio ve mevcut PluginLabs AI paketleri bu sürümde doğrudan yönetilmiyor. Bu merkez kendi kurduğu motoru yönetir.</div></section><section class="card"><h2>Hızlı deneme</h2><p style="margin:10px 0 18px">Bir metin girin; My Mind yerel olarak yanıtlasın.</p><form id="chat-form"><label class="field"><span>Mesajınız</span><textarea name="prompt" maxlength="10000" required placeholder="Bu metni üç kısa maddede özetle…"></textarea></label><button class="btn primary" ${!state.model.running || busy.has("chat") ? "disabled" : ""}>${busy.has("chat") ? "Yanıt hazırlanıyor…" : "My Mind’e gönder ↗"}</button></form>${chatResult ? `<div class="chat-output">${esc(chatResult)}</div>` : ""}</section></div>`;
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
      heading("Merkez ayarları", "Kurulum, veri alanı ve sürüm bilgileri.") +
      `<div class="two-col"><section class="card"><h2>Yerel veri alanı</h2><p style="margin:15px 0">Paketler, kaynak ayarları ve erişim izinleri uygulamanın kullanıcı veri klasöründe saklanır.</p>${button("Klasörü aç ↗", "openData")}<div class="notice">API anahtarları bu merkezde özetlenerek saklanır. İstemci uygulamalar kendi anahtarlarını işletim sistemi kasalarında tutmalıdır.</div></section><section class="card"><h2>PluginLabs Hub 0.2.0</h2><p style="margin:15px 0">Electron masaüstü uygulaması · Yerel HTTP API<br>Windows ürün paketleri Windows üzerinde açılır.<br>Model motoru: Windows x64 / Linux x64 CPU.</p><div class="notice warn">Önizleme sürümü. Ürün indirmeleri ve motor kaynakları katalogda sabitlenmiştir. Üçüncü taraf çalıştırılabilir eklentiler doğrudan yüklenmez; işlevler izinli sağlayıcı SDK’sı üzerinden eklenir.</div></section></div>`;
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
  if (action === "manage") return manage(id);
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
        ].includes(page) ||
          state?.model.starting),
    ).catch(() => {});
  }, 1600);
} else {
  content.innerHTML =
    '<div class="empty">PluginLabs Hub arayüzünü masaüstü uygulaması üzerinden açın.<br><code>npm start</code></div>';
}
function ideaCard(item) {
  const map = { "PL-002": "leo-helper", "PL-003": "mind-palace" },
    installed = state.installed[map[item.id]],
    available = map[item.id];
  return `<article class="card idea-card"><div class="card-top"><span class="app-icon">${item.id.startsWith("PL-04") ? "⌘" : "◇"}</span><div><h3>${esc(item.name)}</h3><small>${esc(item.id)} · ${esc(item.fields["Öncelik ve efor"]?.split(";")[0] || "Ürün fikri")}</small></div></div><p>${esc(item.fields["Kullanıcı ve problem"] || "")}</p><div class="idea-platform">${esc(item.fields.Platform)}</div><div class="card-bottom"><span class="badge ${available ? "online" : ""}">${installed ? "İlgili ürün yüklü" : available ? "İlgili ürün mevcut" : "Notion ürün taslağı"}</span>${button("Kapsamı gör", "idea", item.id)}</div></article>`;
}
function ideasPage() {
  let items = state.ideas.filter(
    (i) =>
      !query ||
      `${i.id} ${i.name} ${Object.values(i.fields).join(" ")}`
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
      "Notion’daki fikirler. Birebir burada.",
      "50 özgün ürün kartı; adları, kapsamları, platformları ve kaynak bağlantıları korunur.",
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
      )}</div><div class="notice">Bu katalog Notion’daki ürün geliştirme fikirlerini gösterir. Kartın kapsamı henüz geliştirilmiş olduğu anlamına gelmez. Gerçek dağıtım paketi bulunan ürünler Keşfet ve Uygulamalarım bölümlerinden yüklenir.</div><div class="app-grid">${items.map(ideaCard).join("")}</div>`
  );
}
async function showIdea(id) {
  try {
    const i = await call("idea", id),
      plain = i.spec
        .replace(/<mention url="([^"]+)"[^>]*>(.*?)<\/mention>/gs, "$2 ($1)")
        .replace(/<[^>]+>/g, "");
    showModal(
      `<div class="modal-title"><div><div class="eyebrow">${esc(i.id)} · NOTION ÜRÜN KARTI</div><h2>${esc(i.name)}</h2></div><button data-action="closeModal" aria-label="Kapat">×</button></div><div class="spec-fields">${Object.entries(
        i.fields,
      )
        .map(([k, v]) => `<h3>${esc(k)}</h3><p>${esc(v)}</p>`)
        .join(
          "",
        )}</div><details><summary>Notion’daki tam kapsam</summary><pre class="spec-text">${esc(plain)}</pre></details><div class="code">Kaynak: ${esc(i.source)}</div><div class="modal-actions"><button class="btn" data-action="copyIdeaSource" data-id="${i.id}">Kaynak bağlantısını kopyala</button>${button("Kapat", "closeModal", "", "primary")}</div>`,
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
