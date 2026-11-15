/* Ultimate Home Design Toolkit — arayüz akışı.
 * Tüm hesaplar Rust motorunda (bridge.engine). Arayüz yalnız durum, çizim ve etkileşimi yönetir. */
import * as B from "./bridge.js";
import { PlanCanvas, moduleRect, fmt } from "./plan.js";
import { View3D } from "./view3d.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tl = (v) => `${fmt(v, 2)} ₺`;
const STEPS = ["model", "katlar", "plan", "uc", "ozet"];

const S = {
  scene: null, json: "", catalog: null, view: "model", storey: 1, counts: {}, level: "L0",
  undo: [], q: Promise.resolve(), lastRender: null, atm: "gunduz", v3: { mode: "dis", levels: "all", cut: false },
  camSet: false, dirty3d: true, unit: "m", saveTimer: null, checkTimer: null,
};

/* ---------- yardımcılar ---------- */
function toast(text, opt = {}) {
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "pl-toast";
  el.style.setProperty("--pl-c", opt.kind === "error" ? "var(--pl-danger)" : opt.kind === "warn" ? "var(--pl-warning)" : "var(--pl-success)");
  el.innerHTML = `<span class="pl-ico" aria-hidden="true">${opt.kind === "error" ? "!" : "✓"}</span><div class="pl-toast__body">${esc(text)}${opt.sub ? `<small>${esc(opt.sub)}</small>` : ""}</div>`;
  if (opt.action) {
    const b = document.createElement("button");
    b.className = "pl-toast__action";
    b.type = "button";
    b.textContent = opt.action;
    b.onclick = () => { opt.onAction(); el.remove(); };
    el.appendChild(b);
  }
  box.appendChild(el);
  setTimeout(() => el.remove(), opt.action ? 8000 : 4200);
}
function run(fn) {
  S.q = S.q.then(fn).catch((e) => toast(e.message || String(e), { kind: "error" }));
  return S.q;
}
function projectNo() {
  const y = new Date().getFullYear();
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return `UHD-${y}-${String(n[0] % 1000000).padStart(6, "0")}`;
}

/** Sahneyi değiştir: geri alma yığını, otomatik kayıt, görünümleri yenile. */
function commit(scene, opt = {}) {
  if (opt.undo !== false && S.json) { S.undo.push(S.json); if (S.undo.length > 60) S.undo.shift(); }
  S.scene = scene;
  S.json = JSON.stringify(scene);
  S.dirty3d = true;
  scheduleSave();
  refresh();
}
function undo() {
  const prev = S.undo.pop();
  if (!prev) { toast("Geri alınacak adım yok", { kind: "warn" }); return; }
  S.scene = JSON.parse(prev);
  S.json = prev;
  S.dirty3d = true;
  scheduleSave();
  refresh();
}
function scheduleSave() {
  const st = $("#saveState");
  st.querySelector(".uh-dot").classList.add("is-busy");
  st.lastElementChild.textContent = "Kaydediliyor…";
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(async () => {
    try {
      const r = await B.engine("save_scene", { scene: S.scene });
      await B.autosaveWrite(r.text);
      st.querySelector(".uh-dot").classList.remove("is-busy");
      st.lastElementChild.textContent = "Otomatik kaydedildi";
    } catch (e) {
      st.lastElementChild.textContent = "Otomatik kayıt başarısız";
    }
  }, 700);
}

/* ---------- gezinme ---------- */
function go(view) {
  S.view = view;
  $$(".uh-view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${view}`));
  $$(".uh-navbtn[data-view]").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
  const idx = STEPS.indexOf(view);
  $$("#stepNav .uh-navbtn").forEach((b, i) => b.classList.toggle("is-done", idx > i));
  refresh();
  if (view === "katlar") requestAnimationFrame(() => { K.resize(); if (!K.fitted) K.fit(); });
  if (view === "plan") requestAnimationFrame(() => { P.resize(); if (!P.fitted) P.fit(); P.c.focus(); });
  if (view === "uc") requestAnimationFrame(() => { V.resize(); show3d(); });
}

function refresh() {
  if (!S.scene) return;
  $("#projectNo").textContent = S.scene.project_no || "UHD";
  const st = S.scene.standard;
  $("#stdLine").textContent = `Dış duvar ${fmt(st.exterior_wall / 10, 1)} cm · İç bölme ${fmt(st.partition / 10, 0)} cm · Net iç ${fmt(st.net_height / 10, 0)} cm · Dış ${fmt((st.bottom_slab + st.net_height + st.top_slab + st.parapet) / 10, 0)} cm`;
  $("#fnCount").textContent = S.scene.functions.length;
  $("#objCount").textContent = S.scene.meshes.length;
  if (!S.scene.levels.some((l) => l.id === S.level)) S.level = "L0";
  sideInfo();
  const v = S.view;
  if (v === "model") renderModel();
  if (v === "katlar") renderKatlar();
  if (v === "plan") renderPlan();
  if (v === "uc") { renderInteriorSwatches(); if (S.dirty3d) show3d(); }
  if (v === "ozet") renderSummary();
  if (v === "olcu") renderMeasure();
  if (v === "maliyet") renderCost();
  if (v === "fonksiyon") renderFunctions();
  if (v === "kutuphane") renderLibrary();
  if (v === "mymind") renderMyMind();
}

function netArea(level) {
  let a = 0;
  for (const r of level.rooms) {
    let s = 0;
    for (let i = 0; i < r.polygon.length; i++) { const p = r.polygon[i], q = r.polygon[(i + 1) % r.polygon.length]; s += p[0] * q[1] - q[0] * p[1]; }
    a += Math.abs(s) / 2e6;
  }
  return a;
}

function sideInfo() {
  const s = S.scene;
  const area = s.levels.reduce((a, l) => a + netArea(l), 0);
  const outer = s.modules.reduce((a, m) => a + m.length * 4, 0);
  $("#sideInfo").innerHTML = `<span>Modül</span><b>${s.modules.length} · ${fmt(outer, 0)} m² dış</b><span>Net mahal alanı</span><b>${fmt(area)} m²</b><span>Kat</span><b>${s.levels.length}</b>`;
}

/* ---------- 1 · Model ---------- */
function syncCountsFromScene() {
  S.counts = {};
  for (const m of S.scene.modules.filter((x) => x.floor === 0)) S.counts[m.length] = (S.counts[m.length] || 0) + 1;
  S.storey = S.scene.modules.some((m) => m.floor === 1) || S.scene.levels.length > 1 ? 2 : S.storey;
}
function renderModel() {
  const grid = $("#moduleGrid");
  grid.innerHTML = S.catalog.modules.map((m) => {
    const n = S.counts[m.length] || 0;
    const tot = m.length;
    return `<div class="uh-mod ${n ? "is-on" : ""}">
      <div><div class="uh-mod__size">4 × ${m.length}</div><div class="uh-mod__meta">${m.area_m2} m² · uzun kenar: ${fmt(m.pier_m, 1)} m perde + ${fmt(m.open_m, 1)} m açılabilir + ${fmt(m.pier_m, 1)} m perde</div></div>
      <div class="uh-stepper"><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-dec="${m.length}" aria-label="4 × ${m.length} azalt">−</button><output aria-live="polite">${n}</output><button class="pl-btn pl-btn--primary pl-btn--sm" type="button" data-inc="${m.length}" aria-label="4 × ${m.length} artır">+</button></div>
      <div class="uh-mod__pier" aria-hidden="true"><i class="is-pier" style="width:${(m.pier_m / tot) * 100}%"></i><i class="is-open" style="width:${(m.open_m / tot) * 100}%"></i><i class="is-pier" style="width:${(m.pier_m / tot) * 100}%"></i></div>
    </div>`;
  }).join("");
  const count = Object.values(S.counts).reduce((a, b) => a + b, 0);
  const area = Object.entries(S.counts).reduce((a, [l, n]) => a + l * 4 * n, 0);
  $("#kpiModules").textContent = count;
  $("#kpiArea").textContent = `${area} m²`;
  $("#kpiStorey").textContent = S.storey === 2 ? "İki katlı" : "Tek katlı";
  $$(".uh-choice").forEach((b) => { const on = Number(b.dataset.storey) === S.storey; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on); });
}

/* ---------- 2 · Katlar ---------- */
function floorSeg(el, onPick) {
  const levels = S.scene.levels.map((l) => l.id).sort();
  if (S.storey === 2 && !levels.includes("L1")) levels.push("L1");
  el.innerHTML = levels.map((id) => `<button type="button" role="tab" data-l="${id}" class="${id === S.level ? "is-active" : ""}">${id === "L0" ? "Zemin" : `${id.slice(1)}. kat`}</button>`).join("");
  el.onclick = (e) => { const b = e.target.closest("button"); if (b) onPick(b.dataset.l); };
}
function renderKatlar() {
  floorSeg($("#floorSegK"), (l) => { S.level = l; K.setLevel(l); renderKatlar(); });
  K.setLevel(S.level);
  K.setScene(S.scene);
  const floor = Number(S.level.slice(1));
  const mods = S.scene.modules.filter((m) => m.floor === floor);
  const area = mods.reduce((a, m) => { const b = m.on ? S.scene.modules.find((g) => g.id === m.on) || m : m; return a + b.length * 4; }, 0);
  $("#floorStats").innerHTML = `<dt>Alan (dış)</dt><dd>${area} m²</dd><dt>Modül</dt><dd>${mods.length}</dd><dt>Net mahal alanı</dt><dd>${fmt(netArea(S.scene.levels.find((l) => l.id === S.level) || { rooms: [] }))} m²</dd>`;
  $("#upperGroup").hidden = S.storey !== 2;
  $("#upperList").innerHTML = S.scene.modules.filter((m) => m.floor === 0).map((m) => {
    const on = S.scene.modules.some((u) => u.floor === 1 && u.on === m.id);
    return `<label class="uh-check"><input type="checkbox" data-upper="${m.id}" ${on ? "checked" : ""}> ${m.id} · 4×${m.length}</label>`;
  }).join("") || `<p class="uh-small">Önce zemin modülü ekleyin.</p>`;
  $("#btnRotate").disabled = !(K.sel && K.sel.type === "module" && S.level === "L0");
}

/* ---------- 3 · İç plan ---------- */
const PLAN_TOOLS = () => {
  const f = S.catalog.furniture;
  const cat = (ids) => ids.map((id) => f.find((x) => x.id === id)).filter(Boolean).map((x) => ({ type: "furniture", value: x.id, label: x.name.replace(" (alt + üst dolap)", "") }));
  return [
    { title: "1 · Ara bölme", items: [{ type: "select", label: "Seç / taşı" }, { type: "wall", label: "10 cm duvar çiz" }], extra: `<button class="uh-tool uh-tool--wide" type="button" data-act="undo-wall">Son duvarı geri al</button><button class="uh-tool uh-tool--wide" type="button" data-act="clear-walls">İç duvarları arşivle</button><p class="uh-small">İlk noktaya, sonra ikinci noktaya tıklayın. Sistem 90° hizalar ve 10 cm hassasiyetle çalışır. Shift ile zincirleme çizin.</p>` },
    { title: "2 · Oda / mahal", items: S.catalog.roomKinds.map((k) => ({ type: "room", value: k.id, label: k.label })), extra: `<p class="uh-small">Türü seçin, sonra duvarlarla çevrili alanın içine bir kez tıklayın. Mahal adı ve net m² otomatik oluşur.</p>` },
    { title: "3 · Kapı", items: S.catalog.openings.filter((o) => o.kind === "door").map((o) => ({ type: "opening", value: o.id, label: o.label })) },
    { title: "4 · Standart pencereler", items: S.catalog.openings.filter((o) => o.kind === "window").map((o) => ({ type: "opening", value: o.id, label: o.label.replace("Pencere ", "") })), extra: `<p class="uh-small">Taşıyıcı perdeye kapı/pencere konamaz. Birden fazla pencereyi arka arkaya yerleştirebilirsiniz.</p>` },
    { title: "5 · Mutfak", items: cat(["alt-dolap", "boy-dolabi", "tezgah", "ada", "evye", "ocak", "buzdolabi", "mutfak-tezgahi"]) },
    { title: "6 · Banyo", items: cat(["dus-kabini", "klozet", "lavabo", "camasir"]) },
    { title: "7 · Mobilya", items: cat(["cift-yatak", "tek-yatak", "komodin", "gardirop", "kanepe-3", "berjer", "orta-sehpa", "yemek-masasi", "sandalye", "tv-unitesi", "calisma-masasi", "kitaplik", "ayakkabilik", "hali", "bitki", "sarkit-lamba", "merdiven"]), extra: `<p class="uh-small">Merdiven zemin kata yerleştirilir; üst döşemede boşluk otomatik açılır.</p>` },
    { title: "8 · Dış cephe kaplama", items: [{ type: "clad", value: "kaplama-tas", label: "Taş" }, { type: "clad", value: "kaplama-ahsap", label: "Ahşap" }, { type: "clad", value: "kaplama-kompozit", label: "Alüminyum kompozit" }, { type: "clad", value: "", label: "Kaplamayı kaldır" }], extra: `<p class="uh-small">Kaplama seçin, sonra plandaki dış cephe duvarlarına tıklayın.</p>` },
    { title: "9 · Dış cephe boyası", swatches: "facade" },
    { title: "10 · Revizyon notu", items: [{ type: "note", label: "Plana not ekle" }] },
  ];
};
function toolLabel(t) {
  if (t.type === "select") return "Seç / taşı";
  if (t.type === "wall") return "10 cm duvar çiz";
  if (t.type === "room") return `Mahal: ${S.catalog.roomKinds.find((k) => k.id === t.value)?.label}`;
  if (t.type === "opening") return S.catalog.openings.find((o) => o.id === t.value)?.label;
  if (t.type === "furniture") return S.catalog.furniture.find((o) => o.id === t.value)?.name;
  if (t.type === "clad") return t.value ? `Kaplama: ${S.scene.materials.find((m) => m.id === t.value)?.name.split("· ")[1]}` : "Kaplamayı kaldır";
  if (t.type === "note") return "Revizyon notu";
  return "";
}
function buildTools() {
  const el = $("#toolPanel");
  const open = new Set($$("details", el).filter((d) => d.open).map((d) => d.dataset.k));
  const first = !el.childElementCount;
  el.innerHTML = PLAN_TOOLS().map((g, i) => {
    let body = "";
    if (g.items) body = `<div class="uh-toolgrid">${g.items.map((t) => `<button class="uh-tool ${P.tool.type === t.type && (P.tool.value || "") === (t.value || "") ? "is-active" : ""}" type="button" data-tool='${esc(JSON.stringify({ type: t.type, value: t.value }))}'>${esc(t.label)}</button>`).join("")}</div>`;
    if (g.swatches === "facade") body = swatches("dis-", S.scene.facade, "facade");
    return `<details class="uh-toolsec" data-k="${i}" ${first ? (i < 4 ? "open" : "") : open.has(String(i)) ? "open" : ""}><summary>${esc(g.title)}</summary>${body}${g.extra || ""}</details>`;
  }).join("");
}
function swatches(prefix, current, kind) {
  const mats = S.scene.materials.filter((m) => m.id.startsWith(prefix) || (kind === "facade" && m.id === "beton-kabuk"));
  return `<div class="pl-swatches uh-mt" role="radiogroup">${mats.map((m) => `<button type="button" class="pl-swatch ${m.id === current ? "is-selected" : ""}" role="radio" aria-checked="${m.id === current}" title="${esc(m.name)}" aria-label="${esc(m.name)}" data-swatch="${kind}" data-id="${m.id}" style="background:rgb(${m.color.map((c) => Math.round(c * 255)).join(" ")})"></button>`).join("")}</div>`;
}
function renderPlan() {
  floorSeg($("#floorSegP"), (l) => { S.level = l; P.setLevel(l); renderPlan(); });
  P.setLevel(S.level);
  P.setScene(S.scene);
  buildTools();
  $("#activeTool").textContent = `Aktif: ${toolLabel(P.tool)}`;
  renderInspector();
  const level = S.scene.levels.find((l) => l.id === S.level) || { rooms: [] };
  const counters = ["tezgah", "alt-dolap", "evye", "ocak", "ada", "boy-dolabi", "mutfak-tezgahi"];
  const counter = S.scene.objects.filter((o) => o.level === S.level && counters.includes(o.mesh.slice(4))).reduce((a, o) => a + (S.catalog.furniture.find((f) => f.id === o.mesh.slice(4))?.size[0] || 0) * o.scale[0], 0);
  $("#liveStats").innerHTML = `<dt>Kat net alanı</dt><dd>${fmt(netArea(level))} m²</dd><dt>Kapalı alan</dt><dd>${level.rooms.length} mahal</dd><dt>Tezgâh uzunluğu</dt><dd>${fmt(counter / 1000)} m</dd><dt>Revizyon notu</dt><dd>${(S.scene.notes || []).length} adet</dd>`;
  const st = S.scene.standard;
  $("#stdTable").innerHTML = [["Dış duvar", st.exterior_wall], ["İç bölme", st.partition], ["İç net", st.net_height], ["Alt döşeme", st.bottom_slab], ["Üst döşeme", st.top_slab], ["Parapet", st.parapet], ["Dış toplam", st.bottom_slab + st.net_height + st.top_slab + st.parapet]].map(([k, v]) => `<tr><td>${k}</td><td class="is-num">${fmt(v / 10, 1)} cm</td></tr>`).join("");
  clearTimeout(S.checkTimer);
  S.checkTimer = setTimeout(async () => {
    try {
      const c = await B.engine("check", { scene: S.scene });
      $("#liveCheck").innerHTML = c.length ? c.slice(0, 6).map((x) => `<div class="uh-checkitem is-${x.level}"><b>${x.level === "hata" ? "Hata" : "Uyarı"}</b>${esc(x.text)}</div>`).join("") : `<div class="uh-checkitem is-ok"><b>Tamam</b>Şu an görünür bir kullanım çakışması yok.</div>`;
    } catch { /* sessiz */ }
  }, 300);
}

function selected() {
  const sel = P.sel;
  if (!sel) return null;
  const s = S.scene;
  const level = s.levels.find((l) => l.id === S.level);
  if (sel.type === "object") return { sel, o: s.objects.find((x) => x.id === sel.id) };
  if (sel.type === "opening") return { sel, o: level?.openings.find((x) => x.id === sel.id), level };
  if (sel.type === "wall") return { sel, o: level?.walls.find((x) => x.id === sel.id), level };
  if (sel.type === "room") return { sel, o: level?.rooms.find((x) => x.id === sel.id), level };
  if (sel.type === "note") return { sel, o: (s.notes || []).find((x) => x.id === sel.id) };
  return null;
}
const field = (label, html) => `<label class="pl-field"><span class="pl-field__label">${label}</span>${html}</label>`;
function renderInspector() {
  const box = $("#inspector");
  const it = selected();
  $("#btnArchiveSel").disabled = !it || !it.o;
  if (!it || !it.o) { box.innerHTML = `<p class="uh-small">Bir duvar, oda, kapı/pencere veya nesneye tıklayın.</p>`; return; }
  const o = it.o;
  if (it.sel.type === "object") {
    const cat = S.catalog.furniture.find((f) => f.id === o.mesh.slice(4));
    const size = cat ? cat.size : [0, 0, 0];
    box.innerHTML = `<div class="uh-stats"><dt>Tür</dt><dd>${esc(cat ? cat.group : "İçe aktarılan model")}</dd><dt>Ölçü</dt><dd>${fmt(size[0] * o.scale[0] / 10, 0)}×${fmt(size[1] * o.scale[2] / 10, 0)}×${fmt(size[2] * o.scale[1] / 10, 0)} cm</dd></div>
      ${field("Ad", `<input class="pl-input" data-f="name" value="${esc(o.name)}">`)}
      <div class="uh-row">${field("X (m)", `<input class="pl-input" type="number" step="0.05" data-f="x" value="${(o.position[0] / 1000).toFixed(2)}">`)}${field("Y (m)", `<input class="pl-input" type="number" step="0.05" data-f="y" value="${(o.position[1] / 1000).toFixed(2)}">`)}</div>
      <div class="uh-row">${field("Genişlik ölçeği", `<input class="pl-input" type="number" step="0.05" min="0.2" max="5" data-f="sx" value="${o.scale[0]}">`)}${field("Birim fiyat (₺)", `<input class="pl-input" type="number" step="100" min="0" data-f="price" value="${o.price}">`)}</div>
      <div class="uh-row"><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-act="rot">↻ 90° döndür</button><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button></div>`;
  } else if (it.sel.type === "opening") {
    const w = it.level.walls.find((x) => x.id === o.wall);
    box.innerHTML = `<div class="uh-stats"><dt>Tür</dt><dd>${o.kind === "door" ? "Kapı" : "Pencere"}</dd><dt>Ölçü</dt><dd>${fmt(o.width / 10, 0)}×${fmt(o.height / 10, 0)} cm</dd><dt>Duvar</dt><dd>${esc(o.wall)} · ${fmt((Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])) / 1000)} m</dd></div>
      ${field("Duvar başından uzaklık (m)", `<input class="pl-input" type="number" step="0.05" min="0" data-f="offset" value="${(o.offset / 1000).toFixed(2)}">`)}
      ${o.kind === "door" ? field("Kapı açılımı", `<select class="pl-select" data-f="swing">${[["sol-ice", "Sol menteşe · içe"], ["sag-ice", "Sağ menteşe · içe"], ["sol-disa", "Sol menteşe · dışa"], ["sag-disa", "Sağ menteşe · dışa"]].map(([v, l]) => `<option value="${v}" ${o.swing === v ? "selected" : ""}>${l}</option>`).join("")}</select>`) : field("Parapet / alt kot (cm)", `<input class="pl-input" type="number" step="5" min="0" data-f="sill" value="${Math.round(o.sill / 10)}" ${o.height >= 2350 ? "disabled" : ""}>`)}
      <div class="uh-row"><button class="pl-btn pl-btn--primary pl-btn--sm" type="button" data-act="apply-opening">Ölçüyü uygula</button><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button></div>`;
  } else if (it.sel.type === "wall") {
    const len = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
    const kind = o.structural ? "Taşıyıcı perde beton (değiştirilemez)" : o.generated ? (o.exterior ? "Modül dış duvarı" : "Modül birleşim duvarı") : "İç bölme";
    box.innerHTML = `<div class="uh-stats"><dt>Tür</dt><dd>${kind}</dd><dt>Uzunluk</dt><dd>${fmt(len / 1000)} m</dd><dt>Kalınlık</dt><dd>${fmt(o.thickness / 10, 1)} cm</dd></div>
      ${o.exterior ? field("Dış yüz", `<select class="pl-select" data-f="outer"><option value="">Cephe boyası (genel)</option>${S.scene.materials.filter((m) => m.category === "kaplama").map((m) => `<option value="${m.id}" ${o.outer === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`) : ""}
      ${!o.generated ? `<button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button>` : `<p class="uh-small">Modül duvarları modülle birlikte değişir; arşivlenemez.</p>`}`;
  } else if (it.sel.type === "room") {
    const a = netArea({ rooms: [o] });
    const xs = o.polygon.map((p) => p[0]), ys = o.polygon.map((p) => p[1]);
    box.innerHTML = `<div class="uh-stats"><dt>Net alan</dt><dd>${fmt(a)} m²</dd><dt>Net ölçü</dt><dd>${fmt((Math.max(...xs) - Math.min(...xs)) / 1000)} × ${fmt((Math.max(...ys) - Math.min(...ys)) / 1000)} m</dd></div>
      ${field("Mahal adı", `<input class="pl-input" data-f="rname" value="${esc(o.name)}">`)}
      ${field("Tür", `<select class="pl-select" data-f="kind">${S.catalog.roomKinds.map((k) => `<option value="${k.id}" ${o.kind === k.id ? "selected" : ""}>${k.label}</option>`).join("")}</select>`)}
      ${field("Zemin kaplaması", `<select class="pl-select" data-f="floor">${S.scene.materials.filter((m) => m.category === "zemin").map((m) => `<option value="${m.id}" ${o.floor === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`)}
      <button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Mahal adını arşivle</button>`;
  } else if (it.sel.type === "note") {
    box.innerHTML = `${field("Not", `<input class="pl-input" data-f="note" value="${esc(o.text)}" maxlength="200">`)}<button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button>`;
  }
}

function clone() { return JSON.parse(S.json); }

function onInspectorChange(e) {
  const f = e.target.dataset.f;
  if (!f) return;
  const it = selected();
  if (!it || !it.o) return;
  const s = clone();
  const level = s.levels.find((l) => l.id === S.level);
  const v = e.target.value;
  if (it.sel.type === "object") {
    const o = s.objects.find((x) => x.id === it.o.id);
    if (f === "name") o.name = v.slice(0, 80);
    if (f === "x") o.position[0] = Number(v) * 1000;
    if (f === "y") o.position[1] = Number(v) * 1000;
    if (f === "sx") o.scale[0] = Math.max(0.2, Math.min(5, Number(v) || 1));
    if (f === "price") o.price = Math.max(0, Number(v) || 0);
    commit(s);
  } else if (it.sel.type === "wall" && f === "outer") {
    level.walls.find((x) => x.id === it.o.id).outer = v;
    commit(s);
  } else if (it.sel.type === "room") {
    const r = level.rooms.find((x) => x.id === it.o.id);
    if (f === "rname") r.name = v.slice(0, 60);
    if (f === "kind") r.kind = v;
    if (f === "floor") r.floor = v;
    commit(s);
  } else if (it.sel.type === "note" && f === "note") {
    s.notes.find((x) => x.id === it.o.id).text = v.slice(0, 200);
    commit(s);
  } else if (it.sel.type === "opening" && f === "swing") {
    level.openings.find((x) => x.id === it.o.id).swing = v;
    commit(s);
  }
}

async function applyOpening() {
  const it = selected();
  const box = $("#inspector");
  const s = clone();
  const level = s.levels.find((l) => l.id === S.level);
  const o = level.openings.find((x) => x.id === it.o.id);
  o.offset = Math.round(Number($('[data-f="offset"]', box).value) * 1000);
  const sill = $('[data-f="sill"]', box);
  if (sill && !sill.disabled) o.sill = Math.round(Number(sill.value) * 10);
  await B.engine("validate_opening", { scene: s, level: S.level, opening: o });
  commit(s);
  toast("Açıklık güncellendi");
}

function archiveSelected() {
  const it = selected();
  if (!it || !it.o) return;
  const s = clone();
  const level = s.levels.find((l) => l.id === S.level);
  const t = it.sel.type;
  const put = (item) => s.archive.push({ type: t, level: S.level, item, at: new Date().toISOString() });
  if (t === "object") { s.objects = s.objects.filter((x) => x.id !== it.o.id); put(it.o); }
  else if (t === "opening") { level.openings = level.openings.filter((x) => x.id !== it.o.id); put(it.o); }
  else if (t === "room") { level.rooms = level.rooms.filter((x) => x.id !== it.o.id); put(it.o); }
  else if (t === "note") { s.notes = s.notes.filter((x) => x.id !== it.o.id); put(it.o); }
  else if (t === "wall") {
    if (it.o.generated) { toast("Modül duvarları arşivlenemez", { kind: "warn" }); return; }
    level.walls = level.walls.filter((x) => x.id !== it.o.id);
    const gone = level.openings.filter((o) => o.wall === it.o.id);
    level.openings = level.openings.filter((o) => o.wall !== it.o.id);
    put({ wall: it.o, openings: gone });
    P.sel = null;
    run(async () => { const r = await B.engine("refresh", { scene: s }); commit(r.scene); toast("Bölme arşivlendi", { action: "Geri al", onAction: undo }); });
    return;
  }
  P.sel = null;
  commit(s);
  toast("Arşivlendi", { action: "Geri al", onAction: undo });
}

/* plan eylemleri (tuvalden) */
function nextId(prefix, list) {
  let n = list.length + 1;
  while (list.some((x) => x.id === `${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}
function onPlanAction(kind, d) {
  if (kind === "select") { renderInspector(); return; }
  if (kind === "escape") { P.setTool({ type: "select" }); renderPlan(); return; }
  if (kind === "archive") { archiveSelected(); return; }
  if (kind === "rotate") { rotateObject(); return; }
  if (kind === "object_moved") { commit(S.scene); renderInspector(); return; }
  if (kind === "wall") return run(async () => { const r = await B.engine("add_partition", { scene: S.scene, level: S.level, a: d.a, b: d.b }); commit(r.scene); });
  if (kind === "room") return run(async () => { const r = await B.engine("name_room", { scene: S.scene, level: S.level, point: d.point, kind: d.kind }); commit(r.scene); toast(`${r.extra.room.name} oluşturuldu`); });
  if (kind === "opening") return run(async () => { const r = await B.engine("place_opening", { scene: S.scene, level: S.level, point: d.point, std: d.std }); commit(r.scene); });
  if (kind === "furniture") {
    const it = S.catalog.furniture.find((f) => f.id === d.cat);
    if (it.id === "merdiven" && S.level !== "L0") { toast("Merdiven yalnız zemin kata yerleştirilir", { kind: "warn" }); return; }
    const s = clone();
    const z = it.mount < 0 ? s.standard.net_height - 900 : it.mount;
    s.objects.push({ id: nextId("N", s.objects), name: it.name, mesh: `cat:${it.id}`, level: S.level, position: [d.point[0], d.point[1], z], rotation: 0, scale: [1, 1, 1], material: null, price: it.price, quantity: 1 });
    commit(s);
    return;
  }
  if (kind === "clad") {
    const s = clone();
    const w = s.levels.find((l) => l.id === S.level).walls.find((x) => x.id === d.wall);
    if (!w || !w.exterior) { toast("Kaplama yalnız dış cephe duvarlarına uygulanır", { kind: "warn" }); return; }
    w.outer = d.material;
    commit(s);
    return;
  }
  if (kind === "note") {
    const dlg = $("#noteDialog");
    $("#noteText").value = "";
    dlg.showModal();
    $("#noteOk").onclick = () => {
      const text = $("#noteText").value.trim();
      dlg.close();
      if (!text) return;
      const s = clone();
      s.notes = s.notes || [];
      s.notes.push({ id: nextId("Not", s.notes), level: S.level, position: d.point, text: text.slice(0, 200) });
      commit(s);
    };
    $("#noteCancel").onclick = () => dlg.close();
  }
}
function rotateObject() {
  const it = selected();
  if (!it || it.sel.type !== "object") return;
  const s = clone();
  const o = s.objects.find((x) => x.id === it.o.id);
  o.rotation = ((o.rotation || 0) + 90) % 360;
  commit(s);
}

/* ---------- 4 · 3B ---------- */
function meshOptions() {
  return { levels: S.v3.levels === "all" ? [] : [S.v3.levels], roof: !S.v3.cut, ground: true, furniture: true, openings: true };
}
async function show3d() {
  if (!V.ok || S.view !== "uc") return;
  S.dirty3d = false;
  return run(async () => {
    $("#view3dInfo").textContent = "Sahne hazırlanıyor…";
    const m = await B.engine("mesh", { scene: S.scene, options: meshOptions() });
    V.setMesh(m);
    if (!S.camSet) { S.camSet = true; await camera(S.v3.mode === "ic" ? "ic" : "perspektif"); }
  });
}
async function camera(name) {
  const c = await B.engine("camera_preset", { scene: S.scene, name });
  V.setCamera(c);
}
function renderInteriorSwatches() {
  $("#interiorSwatches").innerHTML = swatches("ic-", S.scene.interior, "interior").replace('<div class="pl-swatches uh-mt" role="radiogroup">', "").replace(/<\/div>$/, "");
}
async function doRender() {
  const [w, h] = $("#selRes").value.split("x").map(Number);
  const spp = Number($("#selSpp").value);
  const ov = $("#renderOverlay");
  ov.hidden = false;
  $("#renderMsg").textContent = `Render alınıyor · ${w}×${h} · ${spp} örnek. ${B.isDesktop ? "Tüm işlemci çekirdekleri kullanılıyor." : "Tarayıcı önizlemesinde tek çekirdek; taslak kalite önerilir."}`;
  $("#btnRender").classList.add("is-loading");
  try {
    const cam = V.getCamera();
    const r = await B.engine("render", { scene: S.scene, atmosphere: S.atm, settings: { width: w, height: h, samples: spp, bounces: 4, eye: cam.eye, target: cam.target, fov: cam.fov, mesh: meshOptions(), denoise: true } });
    S.lastRender = r.png;
    $("#renderImg").src = `data:image/png;base64,${r.png}`;
    $("#renderCap").textContent = `${r.width}×${r.height} · ${r.samples} örnek · ${r.triangles.toLocaleString("tr-TR")} üçgen · ${r.threads} iş parçacığı${r.ms ? ` · ${fmt(r.ms / 1000, 1)} sn` : ""}`;
    $("#renderFig").hidden = false;
    toast("Render hazır");
  } catch (e) {
    toast(e.message, { kind: "error" });
  } finally {
    ov.hidden = true;
    $("#btnRender").classList.remove("is-loading");
  }
}

/* ---------- 5 · Özet ---------- */
async function renderSummary() {
  const [m, est, chk] = await Promise.all([B.engine("measure", { scene: S.scene }), B.engine("estimate", { scene: S.scene }), B.engine("check", { scene: S.scene })]);
  const t = m.report.totals;
  $("#sumKpis").innerHTML = `<div class="pl-kpi"><div class="pl-label">Net mahal alanı</div><div class="pl-kpi__value">${fmt(t.floor_area_m2)} m²</div></div>
    <div class="pl-kpi"><div class="pl-label">Modül / kat</div><div class="pl-kpi__value">${S.scene.modules.length} / ${S.scene.levels.length}</div></div>
    <div class="pl-kpi"><div class="pl-label">Kapı · pencere</div><div class="pl-kpi__value">${t.doors} · ${t.windows}</div></div>
    <div class="pl-kpi pl-kpi--highlight"><div class="pl-label">Tahmini toplam (${est.tier})</div><div class="pl-kpi__value is-money">${tl(est.total)}</div></div>`;
  $("#checkList").innerHTML = chk.length ? chk.map((x) => `<div class="uh-checkitem is-${x.level}"><b>${x.level === "hata" ? "Hata" : "Uyarı"}</b>${esc(x.text)}</div>`).join("") : `<div class="uh-checkitem is-ok"><b>✓</b>Son proje kontrolü tamamlandı.</div>`;
  $("#sumRooms").innerHTML = `<thead><tr><th>Mahal</th><th>Kat</th><th class="is-num">Net m²</th><th class="is-num">Pencere</th></tr></thead><tbody>${m.report.rooms.map((r) => `<tr><td class="is-strong">${esc(r.name)}</td><td>${r.level === "L0" ? "Zemin" : r.level.slice(1) + ". kat"}</td><td class="is-num">${fmt(r.area_m2)}</td><td class="is-num">${r.windows}</td></tr>`).join("")}</tbody>`;
  const img = $("#sumRender");
  img.hidden = !S.lastRender;
  if (S.lastRender) img.src = `data:image/png;base64,${S.lastRender}`;
}

/* ---------- Ölçü ---------- */
const UNITS = { m: [1, "m", 1, "m²"], cm: [100, "cm", 1, "m²"], mm: [1000, "mm", 1, "m²"], ft: [3.28084, "ft", 10.7639, "ft²"], in: [39.3701, "in", 10.7639, "ft²"] };
async function renderMeasure() {
  const r = await B.engine("measure", { scene: S.scene });
  const [lf, lu, af, au] = UNITS[S.unit];
  const L = (v) => `${fmt(v * lf, S.unit === "mm" ? 0 : 2)} ${lu}`;
  const A = (v) => `${fmt(v * af)} ${au}`;
  const t = r.report.totals;
  $("#mKpis").innerHTML = [["Net zemin alanı", A(t.floor_area_m2)], ["Brüt alan", A(t.gross_area_m2)], ["Net duvar (boya)", A(t.wall_net_m2)], ["Hacim", `${fmt(t.volume_m3)} m³`], ["Islak hacim", A(t.wet_area_m2)], ["Süpürgelik", L(t.skirting_m)], ["Boya", `${fmt(t.paint_litres, 1)} lt`], ["Ayak izi", `${L(t.footprint_w_m)} × ${L(t.footprint_d_m)}`]].map(([k, v]) => `<div class="pl-kpi"><div class="pl-label">${k}</div><div class="pl-kpi__value uh-kpi-text pl-num">${v}</div></div>`).join("");
  $("#mRooms").innerHTML = `<thead><tr><th>Mahal</th><th class="is-num">Net alan</th><th class="is-num">Çevre</th><th class="is-num">Ölçü</th><th class="is-num">Yükseklik</th><th class="is-num">Hacim</th><th class="is-num">Net duvar</th><th class="is-num">Süpürgelik</th><th class="is-num">Kapı</th><th class="is-num">Pencere</th><th class="is-num">Gün ışığı</th></tr></thead><tbody>${r.report.rooms.map((x) => `<tr><td class="is-strong">${esc(x.name)}</td><td class="is-num">${A(x.area_m2)}</td><td class="is-num">${L(x.perimeter_m)}</td><td class="is-num">${L(x.width_m)} × ${L(x.depth_m)}</td><td class="is-num">${L(x.height_m)}</td><td class="is-num">${fmt(x.volume_m3)} m³</td><td class="is-num">${A(x.wall_net_m2)}</td><td class="is-num">${L(x.skirting_m)}</td><td class="is-num">${x.doors}</td><td class="is-num">${x.windows}</td><td class="is-num">%${fmt(x.daylight_ratio * 100, 0)}</td></tr>`).join("")}</tbody>`;
  $("#mWalls").innerHTML = `<thead><tr><th>Duvar</th><th>Tür</th><th class="is-num">Uzunluk</th><th class="is-num">Kalınlık</th><th class="is-num">Brüt</th><th class="is-num">Açıklık</th><th class="is-num">Net</th><th class="is-num">Hacim</th></tr></thead><tbody>${r.report.walls.map((w) => `<tr><td class="pl-num">${esc(w.id)}</td><td>${w.exterior ? "Dış" : "İç"}</td><td class="is-num">${L(w.length_m)}</td><td class="is-num">${fmt(w.thickness_cm, 1)} cm</td><td class="is-num">${A(w.gross_m2)}</td><td class="is-num">${A(w.openings_m2)}</td><td class="is-num">${A(w.net_m2)}</td><td class="is-num">${fmt(w.volume_m3, 2)} m³</td></tr>`).join("")}</tbody>`;
  $("#mFns").innerHTML = `<thead><tr><th>Fonksiyon</th><th class="is-num">Sonuç</th><th>Birim</th></tr></thead><tbody>${r.functions.map((f) => `<tr><td class="is-strong">${esc(f.name)}</td><td class="is-num">${f.value != null ? fmt(f.value) : `<span class="pl-badge pl-badge--danger">${esc(f.error)}</span>`}</td><td>${esc(f.unit)}</td></tr>`).join("") || `<tr><td colspan="3">Ölçü fonksiyonu yok.</td></tr>`}</tbody>`;
  $("#mWarn").innerHTML = r.report.warnings.map((w) => `<div class="uh-checkitem is-uyari"><b>Uyarı</b>${esc(w)}</div>`).join("");
}

/* ---------- Maliyet ---------- */
async function renderCost() {
  const s = S.scene;
  const cp = s.cost;
  $$("#segTier button").forEach((b) => b.classList.toggle("is-active", b.dataset.t === cp.tier));
  $("#inRegion").value = cp.region_index;
  $("#inLabour").value = cp.labour_index;
  $("#inVat").value = Math.round(cp.vat * 100);
  $("#inCont").value = Math.round(cp.contingency * 100);
  $("#chkFurn").checked = cp.include_furniture;
  const [est, sc] = await Promise.all([B.engine("estimate", { scene: s }), B.engine("scaling", { scene: s })]);
  $("#cKpis").innerHTML = `<div class="pl-kpi"><div class="pl-label">Ara toplam</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.subtotal)}</div></div>
    <div class="pl-kpi"><div class="pl-label">Beklenmeyen + KDV</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.contingency + est.vat)}</div></div>
    <div class="pl-kpi pl-kpi--highlight"><div class="pl-label">Genel toplam</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.total)}</div></div>
    <div class="pl-kpi"><div class="pl-label">m² başına</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.per_m2)}</div></div>`;
  $("#cGroups").innerHTML = est.groups.map((g) => `<div class="uh-bar"><span>${esc(g.group)}</span><div class="pl-progress" style="--pl-val:${Math.round(g.share * 100)}%" role="img" aria-label="%${Math.round(g.share * 100)}"><span></span></div><span>${tl(g.total)}</span></div>`).join("");
  const maxT = Math.max(...sc.tiers.map((t) => t.total), 1);
  $("#cTiers").innerHTML = sc.tiers.map((t) => `<div class="uh-bar"><span>${t.label}</span><div class="pl-progress" style="--pl-val:${Math.round((t.total / maxT) * 100)}%"><span></span></div><span>${tl(t.total)}</span></div>`).join("") + `<p class="uh-small">m² başına: ${sc.tiers.map((t) => `${t.label} ${tl(t.per_m2)}`).join(" · ")}</p>`;
  const rateIds = new Set(cp.rates.map((r) => r.id));
  $("#cLines").innerHTML = `<thead><tr><th>Kalem</th><th>Grup</th><th class="is-num">Miktar</th><th class="is-num">Fireli</th><th class="is-num">Malzeme birim (₺)</th><th class="is-num">İşçilik birim (₺)</th><th class="is-num">Malzeme</th><th class="is-num">İşçilik</th><th class="is-num">İndirim</th><th class="is-num">Toplam</th></tr></thead><tbody>${est.lines.map((l) => {
    const rate = cp.rates.find((r) => r.id === l.id);
    const edit = (k, v) => rateIds.has(l.id) ? `<input class="pl-input uh-cell-input" type="number" min="0" step="10" data-rate="${l.id}" data-k="${k}" value="${v}" aria-label="${esc(l.name)} ${k === "material_price" ? "malzeme" : "işçilik"} birim fiyatı">` : "—";
    return `<tr><td class="is-strong">${esc(l.name)}${l.note ? `<br><span class="uh-small">${esc(l.note)}</span>` : ""}</td><td>${esc(l.group)}</td><td class="is-num">${fmt(l.quantity)} ${esc(l.unit)}</td><td class="is-num">${fmt(l.quantity_with_waste)}</td><td class="is-num">${rate ? edit("material_price", rate.material_price) : "—"}</td><td class="is-num">${rate ? edit("labour_price", rate.labour_price) : "—"}</td><td class="is-num">${tl(l.material)}</td><td class="is-num">${tl(l.labour)}</td><td class="is-num">${l.discount ? "−" + tl(l.discount) : "—"}</td><td class="is-num">${tl(l.total)}</td></tr>`;
  }).join("")}</tbody>`;
  // alan eğrisi
  const pts = sc.area_curve;
  const W = 520, H = 200, pad = 40;
  const xs = pts.map((p) => p.floor_area_m2), ys = pts.map((p) => p.total);
  const [x0, x1, y1] = [Math.min(...xs), Math.max(...xs), Math.max(...ys) * 1.08];
  const X = (v) => pad + ((v - x0) / Math.max(1e-9, x1 - x0)) * (W - pad - 12);
  const Y = (v) => H - 26 - (v / Math.max(1, y1)) * (H - 40);
  $("#cCurve").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Alan büyüdükçe toplam maliyet eğrisi; ayrıntılar aşağıdaki tabloda"><line class="ax" x1="${pad}" y1="${H - 26}" x2="${W - 8}" y2="${H - 26}"/><line class="ax" x1="${pad}" y1="10" x2="${pad}" y2="${H - 26}"/><polyline class="ln" points="${pts.map((p) => `${X(p.floor_area_m2)},${Y(p.total)}`).join(" ")}"/>${pts.map((p) => `<circle class="pt ${p.factor === 1 ? "is-base" : ""}" cx="${X(p.floor_area_m2)}" cy="${Y(p.total)}" r="4"/><text x="${X(p.floor_area_m2)}" y="${H - 8}" text-anchor="middle">${fmt(p.floor_area_m2, 0)} m²</text>`).join("")}</svg>`;
  $("#cCurveT").innerHTML = `<thead><tr><th>Alan çarpanı</th><th class="is-num">Net alan</th><th class="is-num">Toplam</th><th class="is-num">m² başına</th></tr></thead><tbody>${pts.map((p) => `<tr class="${p.factor === 1 ? "is-selected" : ""}"><td>×${fmt(p.factor)}</td><td class="is-num">${fmt(p.floor_area_m2)} m²</td><td class="is-num">${tl(p.total)}</td><td class="is-num">${tl(p.per_m2)}</td></tr>`).join("")}</tbody>`;
  $("#cUnits").innerHTML = `<thead><tr><th>Konut</th><th class="is-num">Konut başına</th><th class="is-num">Toplam</th><th class="is-num">Tasarruf</th></tr></thead><tbody>${sc.units.map((u) => `<tr><td>${u.units}</td><td class="is-num">${tl(u.per_unit)}</td><td class="is-num">${tl(u.total)}</td><td class="is-num">%${fmt(u.saving * 100, 1)}</td></tr>`).join("")}</tbody>`;
  $("#cElastic").textContent = `Alan esnekliği: alan %1 büyüdüğünde toplam yaklaşık %${fmt(sc.elasticity, 2)} artar. Seri üretimde miktar indirimleri toplam miktara göre, işçilik %90 öğrenme eğrisiyle hesaplanır.`;
  $("#cErr").innerHTML = est.errors.map((e) => `<div class="uh-checkitem is-hata"><b>Formül</b>${esc(e)}</div>`).join("");
}

/* ---------- Fonksiyonlar ---------- */
async function renderFunctions() {
  const r = await B.engine("measure", { scene: S.scene });
  const desc = { floor_area: "Toplam net zemin alanı (m²)", gross_area: "Brüt alan (m²)", wet_area: "Islak hacim alanı (m²)", ceiling_area: "Tavan alanı (m²)", perimeter: "Mahal çevreleri (m)", wall_area: "Net duvar alanı (m²)", wall_length: "Duvar uzunluğu (m)", wall_volume: "Duvar hacmi (m³)", exterior_wall_area: "Net dış duvar (m²)", volume: "İç hacim (m³)", skirting: "Süpürgelik (m)", doors: "Kapı sayısı", windows: "Pencere sayısı", window_area: "Pencere alanı (m²)", paint_l: "Boya (lt)", rooms: "Mahal sayısı", objects: "Nesne sayısı", height: "Kat net yüksekliği (m)", region_index: "Bölge endeksi", labour_index: "İşçilik endeksi", tier: "Kalite çarpanı" };
  $("#fnVars").innerHTML = `<thead><tr><th>Değişken</th><th class="is-num">Değer</th><th>Açıklama</th></tr></thead><tbody>${Object.entries(r.variables).map(([k, v]) => `<tr><td class="pl-num">${esc(k)}</td><td class="is-num">${fmt(v)}</td><td>${esc(desc[k] || (k.startsWith("area_") ? "Türe göre alan" : "Mahal ölçüsü"))}</td></tr>`).join("")}</tbody>`;
  $("#fnList").innerHTML = `<thead><tr><th>Ad</th><th>Kimlik</th><th>Tür</th><th>Formül</th><th class="is-num">Sonuç</th><th>Etkin</th><th></th></tr></thead><tbody>${S.scene.functions.map((f, i) => {
    const res = r.functions.find((x) => x.id === f.id);
    return `<tr><td class="is-strong">${esc(f.name)}</td><td class="pl-num">${esc(f.id)}</td><td>${f.kind === "cost" ? "Maliyet" : "Ölçü"}</td><td class="pl-num">${esc(f.expr)}</td><td class="is-num">${res ? (res.value != null ? fmt(res.value) + " " + esc(f.unit) : esc(res.error)) : f.kind === "cost" ? `× ${tl(f.unit_price)}` : "—"}</td><td><label class="pl-switch"><input type="checkbox" data-fn-toggle="${i}" ${f.enabled ? "checked" : ""} aria-label="${esc(f.name)} etkin"></label></td><td><button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-fn-archive="${i}">Arşivle</button></td></tr>`;
  }).join("") || `<tr><td colspan="7">Henüz fonksiyon yok.</td></tr>`}</tbody>`;
}
function fnDraft() {
  const name = $("#fnName").value.trim();
  const id = ($("#fnId").value.trim() || name).toLowerCase().replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c])).replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return { id, name, kind: $("#fnKind").value, expr: $("#fnExpr").value.trim(), unit: $("#fnUnit").value.trim(), is_amount: false, unit_price: Number($("#fnPrice").value) || 0, enabled: true };
}

/* ---------- Kütüphane ---------- */
function renderLibrary() {
  $("#objList").innerHTML = `<thead><tr><th>Model</th><th class="is-num">Üçgen</th><th class="is-num">Sahnede</th><th></th></tr></thead><tbody>${S.scene.meshes.map((m) => `<tr><td class="is-strong">${esc(m.name)}</td><td class="is-num">${(m.indices.length / 3).toLocaleString("tr-TR")}</td><td class="is-num">${S.scene.objects.filter((o) => o.mesh === m.id).length}</td><td><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-place-mesh="${m.id}">Plana ekle</button></td></tr>`).join("") || `<tr><td colspan="4">Henüz içe aktarılan model yok.</td></tr>`}</tbody>`;
  $("#catList").innerHTML = `<thead><tr><th>Nesne</th><th>Grup</th><th class="is-num">Ölçü (cm)</th><th class="is-num">Standart fiyat</th></tr></thead><tbody>${S.catalog.furniture.map((f) => `<tr><td class="is-strong">${esc(f.name)}</td><td>${esc(f.group)}</td><td class="is-num">${f.size.map((x) => fmt(x / 10, 0)).join(" × ")}</td><td class="is-num">${tl(f.price)}</td></tr>`).join("")}</tbody>`;
}
async function importObj() {
  const files = await B.openFiles("obj");
  if (!files || !files.length) return;
  const obj = files.find((f) => /\.obj$/i.test(f.name));
  const mtl = files.find((f) => /\.mtl$/i.test(f.name));
  if (!obj) { toast("Bir .obj dosyası seçin (isteğe bağlı .mtl ile birlikte)", { kind: "warn" }); return; }
  const lv = S.scene.levels.find((l) => l.id === S.level) || S.scene.levels[0];
  const room = lv.rooms[0];
  let at = [1000, 1000];
  if (room) { const xs = room.polygon.map((p) => p[0]), ys = room.polygon.map((p) => p[1]); at = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; }
  const r = await B.engine("import_obj", { scene: S.scene, obj: obj.text, mtl: mtl ? mtl.text : null, unit: $("#objUnit").value, zUp: $("#objZup").checked, name: obj.name.replace(/\.obj$/i, ""), level: lv.id, at });
  commit(r.scene);
  $("#objResult").textContent = `${obj.name}: ${r.triangles.toLocaleString("tr-TR")} üçgen · ${r.size.map((x) => fmt(x / 1000)).join(" × ")} m${r.warnings.length ? " · " + r.warnings.join(" · ") : ""}`;
  toast("Model içe aktarıldı ve plana eklendi");
}

/* ---------- MyMind ---------- */
const MM_TASK = {
  plan: "Aşağıdaki konut planını değerlendir. Gün ışığı, mahal büyüklükleri ve dolaşım için en fazla 6 kısa, uygulanabilir öneri ver. Türkçe yaz.",
  malzeme: "Aşağıdaki konut için zemin, duvar boyası ve cephe malzemesi uyumu hakkında en fazla 6 kısa öneri ver. Türkçe yaz.",
  sira: "Aşağıdaki konutun iç mekân hazırlığı için uygulama sırasını ve kontrol listesini en fazla 10 maddede yaz. Türkçe yaz.",
};
async function mmPrompt() {
  const r = await B.engine("mymind_summary", { scene: S.scene });
  return `${MM_TASK[$("#mmTask").value]}\n\n${r.text}`;
}
async function renderMyMind() {
  const st = await B.hubStatus().catch((e) => ({ available: false, reason: e.message }));
  $("#mymindState").textContent = st.available ? "Hazır" : "Kapalı";
  $("#hubBox").innerHTML = st.available
    ? `<span class="pl-badge pl-badge--success">Bağlı</span> PluginLabs Hub · 127.0.0.1:47632`
    : `<span class="pl-badge">Bağlı değil</span> ${esc(st.reason || "")}${B.isDesktop ? `<div class="uh-row uh-mt"><input class="pl-input" type="password" id="hubKey" placeholder="Hub istemci anahtarı" autocomplete="off"><button class="pl-btn pl-btn--secondary" type="button" id="btnHubKey">Anahtarı kaydet</button></div><p class="uh-small">Anahtar Windows Kimlik Bilgisi Yöneticisi'nde saklanır; arayüze ve proje dosyasına yazılmaz.</p>` : ""}`;
  $("#mmPreview").textContent = await mmPrompt();
  $("#btnMmSend").disabled = !st.available;
}

/* ---------- komut paleti ---------- */
const COMMANDS = () => [
  ["1 · Model", () => go("model")], ["2 · Katlar", () => go("katlar")], ["3 · İç plan", () => go("plan")], ["4 · 3B ve render", () => go("uc")], ["5 · Özet ve dışa aktar", () => go("ozet")],
  ["Ölçü ve metraj", () => go("olcu")], ["Maliyet ve ölçekleme", () => go("maliyet")], ["Fonksiyonlar", () => go("fonksiyon")], ["3B kütüphane", () => go("kutuphane")], ["MyMind", () => go("mymind")],
  ["Örnek projeyi aç", () => loadDemo()], ["Yeni proje", () => newProject()], ["Projeyi kaydet (.uhds)", () => exportAs("uhds")], ["Proje aç", () => exportAs("open")],
  ["OBJ içe aktar", () => run(importObj)], ["OBJ dışa aktar", () => exportAs("obj")], ["HD render al", () => { go("uc"); setTimeout(doRender, 300); }], ["Geri al", () => undo()],
];
function openCmd() {
  const dlg = $("#cmdDialog");
  const input = $("#cmdInput");
  let idx = 0;
  const list = () => COMMANDS().filter(([n]) => n.toLocaleLowerCase("tr-TR").includes(input.value.toLocaleLowerCase("tr-TR")));
  const draw = () => {
    const l = list();
    idx = Math.min(idx, Math.max(0, l.length - 1));
    $("#cmdList").innerHTML = l.map(([n], i) => `<button class="uh-cmditem ${i === idx ? "is-active" : ""}" role="option" type="button" data-i="${i}">${esc(n)}</button>`).join("") || `<p class="uh-small">Sonuç yok</p>`;
  };
  input.value = "";
  draw();
  dlg.showModal();
  input.focus();
  input.oninput = () => { idx = 0; draw(); };
  input.onkeydown = (e) => {
    if (e.key === "ArrowDown") { idx++; draw(); e.preventDefault(); }
    if (e.key === "ArrowUp") { idx = Math.max(0, idx - 1); draw(); e.preventDefault(); }
    if (e.key === "Enter") { const c = list()[idx]; dlg.close(); if (c) c[1](); }
  };
  $("#cmdList").onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) { const c = list()[Number(b.dataset.i)]; dlg.close(); c[1](); } };
}

/* ---------- dosyalar ---------- */
function base() { return (S.scene.project_no || "ev").toLowerCase(); }
async function exportAs(kind) {
  return run(async () => {
    if (kind === "uhds") { const r = await B.engine("save_scene", { scene: S.scene }); const p = await B.saveText("uhds", `${base()}.uhds`, r.text); if (p) toast("Proje kaydedildi", { sub: p }); }
    if (kind === "open") {
      const f = await B.openFiles("uhds");
      if (!f || !f.length) return;
      const r = await B.engine("load_scene", { text: f[0].text });
      S.undo = []; S.json = ""; S.camSet = false; K.fitted = false; P.fitted = false;
      commit(r.scene, { undo: false });
      syncCountsFromScene();
      toast("Proje açıldı", { sub: `${r.info.modules} modül · ${r.info.objects} nesne · SHA-256 doğrulandı` });
      go("katlar");
    }
    if (kind === "obj") {
      const r = await B.engine("export_obj", { scene: S.scene, basename: base() });
      const p = await B.saveText("obj", `${r.basename}.obj`, r.obj);
      if (!p) return;
      await B.saveText("mtl", `${r.basename}.mtl`, r.mtl);
      toast("OBJ + MTL dışa aktarıldı", { sub: `${r.triangles.toLocaleString("tr-TR")} üçgen · metre` });
    }
    if (kind === "plan-png") {
      const prev = S.view;
      if (prev !== "plan") { go("plan"); await new Promise((r) => setTimeout(r, 120)); }
      P.fit();
      await B.savePng(`${base()}-plan.png`, P.toPng());
      if (prev !== "plan") go(prev);
      toast("2B plan PNG olarak kaydedildi");
    }
    if (kind === "render") { if (!S.lastRender) { toast("Önce 3B adımında render alın", { kind: "warn" }); return; } await B.savePng(`${base()}-render.png`, S.lastRender); toast("Render kaydedildi"); }
    if (kind === "print") window.print();
  });
}

/* ---------- proje başlatma ---------- */
async function newProject() {
  const r = await B.engine("new", { projectNo: projectNo() });
  S.undo = []; S.json = ""; S.counts = {}; S.storey = 1; S.camSet = false; K.fitted = false; P.fitted = false; S.lastRender = null;
  commit(r.scene, { undo: false });
  go("model");
}
async function loadDemo() {
  const r = await B.engine("demo");
  r.scene.project_no = projectNo();
  S.undo = []; S.json = ""; S.camSet = false; K.fitted = false; P.fitted = false;
  commit(r.scene, { undo: false });
  syncCountsFromScene();
  go("plan");
  toast("Örnek proje açıldı");
}

/* ---------- bağlama ---------- */
let K, P, V;
async function init() {
  K = new PlanCanvas($("#canvasK"), { mode: "katlar", onAction: onKatAction });
  P = new PlanCanvas($("#canvasP"), { mode: "plan", onAction: onPlanAction });
  V = new View3D($("#canvas3d"), $("#view3dInfo"));
  try {
    const info = await B.engine("info");
    $("#engineInfo").textContent = `Rust motoru ${info.version} · ${B.isDesktop ? "yerel" : "WebAssembly önizleme"}`;
    S.catalog = await B.engine("catalog");
  } catch (e) {
    $("#engineInfo").textContent = "Motor yüklenemedi";
    toast(e.message, { kind: "error" });
    return;
  }
  K.catalog = S.catalog;
  P.catalog = S.catalog;
  const params = new URLSearchParams(location.search);
  const saved = await B.autosaveRead().catch(() => null);
  if (params.get("demo") === "1") await loadDemo();
  else {
    await newProject();
    if (saved) $("#resumeBar").hidden = false;
  }
  $("#btnResume").onclick = () => run(async () => {
    const r = await B.engine("load_scene", { text: saved });
    S.undo = []; S.json = ""; K.fitted = false; P.fitted = false; S.camSet = false;
    commit(r.scene, { undo: false });
    syncCountsFromScene();
    $("#resumeBar").hidden = true;
    go("katlar");
  });
  $("#btnFresh").onclick = () => { $("#resumeBar").hidden = true; };
  const v = params.get("view");
  if (v) go(v);
  if (params.get("tool")) { const [t, val] = params.get("tool").split(":"); P.setTool({ type: t, value: val }); }
  if (params.get("sel")) { const [t, id] = params.get("sel").split(":"); P.sel = { type: t, id }; renderInspector(); P.draw(); }
}

function onKatAction(kind, d) {
  if (kind === "select") { renderKatlar(); return; }
  if (kind === "move_module") return run(async () => {
    const r = await B.engine("move_module", { scene: S.scene, id: d.id, position: d.position });
    commit(r.scene);
    const ov = r.extra.overlaps || [];
    $("#overlapWarn").hidden = !ov.length;
    $("#overlapText").textContent = ov.map(([a, b]) => `${a} ve ${b} üst üste biniyor`).join(" · ");
    if (r.notes.length) toast(r.notes.join(" · "), { kind: "warn", action: "Geri al", onAction: undo });
  });
  if (kind === "rotate") return rotateModule();
}
function rotateModule() {
  if (!K.sel || K.sel.type !== "module") return;
  return run(async () => {
    const r = await B.engine("rotate_module", { scene: S.scene, id: K.sel.id });
    commit(r.scene);
    if (r.notes.length) toast(r.notes.join(" · "), { kind: "warn", action: "Geri al", onAction: undo });
  });
}

document.addEventListener("click", (e) => {
  const t = e.target;
  const nav = t.closest("[data-view]");
  if (nav) { go(nav.dataset.view); return; }
  const g = t.closest("[data-go]");
  if (g) { go(g.dataset.go); return; }
  if (t.closest("[data-fit]")) { (S.view === "katlar" ? K : P).fit(); return; }
  if (t.closest("[data-undo]")) { undo(); return; }
  const st = t.closest("[data-storey]");
  if (st) { S.storey = Number(st.dataset.storey); renderModel(); return; }
  const inc = t.closest("[data-inc]"), dec = t.closest("[data-dec]");
  if (inc || dec) {
    const l = Number((inc || dec).dataset.inc || (inc || dec).dataset.dec);
    S.counts[l] = Math.max(0, Math.min(12, (S.counts[l] || 0) + (inc ? 1 : -1)));
    renderModel();
    return;
  }
  const tool = t.closest("[data-tool]");
  if (tool) { P.setTool(JSON.parse(tool.dataset.tool)); renderPlan(); P.c.focus(); return; }
  const act = t.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "archive") archiveSelected();
    if (a === "rot") rotateObject();
    if (a === "apply-opening") run(applyOpening);
    if (a === "undo-wall") {
      const s = clone();
      const lv = s.levels.find((l) => l.id === S.level);
      const last = [...lv.walls].reverse().find((w) => !w.generated);
      if (!last) { toast("Geri alınacak bölme yok", { kind: "warn" }); return; }
      P.sel = { type: "wall", id: last.id };
      archiveSelected();
    }
    if (a === "clear-walls") {
      const s = clone();
      const lv = s.levels.find((l) => l.id === S.level);
      const parts = lv.walls.filter((w) => !w.generated);
      if (!parts.length) return;
      lv.walls = lv.walls.filter((w) => w.generated);
      const ids = new Set(parts.map((w) => w.id));
      const ops = lv.openings.filter((o) => ids.has(o.wall));
      lv.openings = lv.openings.filter((o) => !ids.has(o.wall));
      s.archive.push({ type: "walls", level: S.level, item: { walls: parts, openings: ops } });
      run(async () => { const r = await B.engine("refresh", { scene: s }); commit(r.scene); toast(`${parts.length} bölme arşivlendi`, { action: "Geri al", onAction: undo }); });
    }
    return;
  }
  const sw = t.closest("[data-swatch]");
  if (sw) {
    const s = clone();
    if (sw.dataset.swatch === "facade") s.facade = sw.dataset.id;
    else s.interior = sw.dataset.id;
    commit(s);
    return;
  }
  const cam = t.closest("[data-cam]");
  if (cam) { run(() => camera(cam.dataset.cam)); return; }
  const ex = t.closest("[data-export]");
  if (ex) { exportAs(ex.dataset.export); return; }
  const fa = t.closest("[data-fn-archive]");
  if (fa) { const s = clone(); const [f] = s.functions.splice(Number(fa.dataset.fnArchive), 1); s.archive.push({ type: "function", item: f }); commit(s); toast("Fonksiyon arşivlendi", { action: "Geri al", onAction: undo }); return; }
  const pm = t.closest("[data-place-mesh]");
  if (pm) {
    const s = clone();
    const m = s.meshes.find((x) => x.id === pm.dataset.placeMesh);
    s.objects.push({ id: nextId("N", s.objects), name: m.name, mesh: m.id, level: S.level, position: [1500, 1500, 0], rotation: 0, scale: [1, 1, 1], material: null, price: 0, quantity: 1 });
    commit(s);
    toast("Model plana eklendi; İç plan adımında taşıyabilirsiniz");
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.closest("#inspector")) { onInspectorChange(e); return; }
  if (t.dataset.upper) { run(async () => { const r = await B.engine("toggle_upper", { scene: S.scene, ground: t.dataset.upper }); commit(r.scene); }); return; }
  if (t.dataset.rate) {
    const s = clone();
    const r = s.cost.rates.find((x) => x.id === t.dataset.rate);
    r[t.dataset.k] = Math.max(0, Number(t.value) || 0);
    commit(s);
    return;
  }
  if (t.dataset.fnToggle) { const s = clone(); s.functions[Number(t.dataset.fnToggle)].enabled = t.checked; commit(s); return; }
  const costKeys = { inRegion: ["region_index", 1], inLabour: ["labour_index", 1], inVat: ["vat", 0.01], inCont: ["contingency", 0.01] };
  if (costKeys[t.id]) { const s = clone(); s.cost[costKeys[t.id][0]] = Math.max(0, Number(t.value) || 0) * costKeys[t.id][1]; commit(s); return; }
  if (t.id === "chkFurn") { const s = clone(); s.cost.include_furniture = t.checked; commit(s); return; }
  if (t.id === "selUnit") { S.unit = t.value; renderMeasure(); return; }
  if (t.id === "chkCut") { S.v3.cut = t.checked; S.dirty3d = true; show3d(); return; }
  if (t.id === "mmTask") { renderMyMind(); }
});

function segment(id, key, fn) {
  $(id).addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$(`${id} button`).forEach((x) => x.classList.toggle("is-active", x === b));
    fn(b.dataset[key]);
  });
}
segment("#segView", "v", (v) => { S.v3.mode = v; if (v === "ic") { S.v3.cut = false; $("#chkCut").checked = false; S.dirty3d = true; } run(async () => { if (S.dirty3d) { const m = await B.engine("mesh", { scene: S.scene, options: meshOptions() }); V.setMesh(m); S.dirty3d = false; } await camera(v === "ic" ? "ic" : "perspektif"); }); });
segment("#segLevels", "l", (l) => { S.v3.levels = l; S.dirty3d = true; show3d(); });
segment("#segAtm", "a", (a) => { S.atm = a; V.setAtmosphere(a); });
segment("#segTier", "t", (t) => { const s = clone(); s.cost.tier = t; commit(s); });

$("#btnPlaceModules").onclick = () => run(async () => {
  const counts = Object.entries(S.counts).filter(([, n]) => n > 0).map(([l, n]) => [Number(l), n]);
  if (!counts.length) { toast("En az bir modül seçin", { kind: "warn" }); return; }
  const r = await B.engine("set_modules", { scene: S.scene, counts, twoStorey: S.storey === 2 });
  K.fitted = false; P.fitted = false;
  commit(r.scene);
  if (r.notes.length) toast(r.notes.join(" · "), { kind: "warn" });
  if (S.storey === 2 && !r.scene.modules.some((m) => m.floor === 1)) S.level = "L0";
  go("katlar");
});
$("#btnRotate").onclick = () => rotateModule();
$("#btnArchiveSel").onclick = () => archiveSelected();
$("#btnUndo").onclick = () => undo();
$("#btnNew").onclick = () => run(newProject);
$("#btnSave").onclick = () => exportAs("uhds");
$("#btnOpen").onclick = () => exportAs("open");
$("#btnCmd").onclick = openCmd;
$("#btnRender").onclick = () => doRender();
$("#btnSavePng").onclick = () => exportAs("render");
$("#btnObjImport").onclick = () => run(importObj);
$("#btnFnTest").onclick = () => run(async () => {
  const d = fnDraft();
  try {
    const r = await B.engine("eval_formula", { scene: S.scene, expr: d.expr });
    $("#fnResult").innerHTML = `Sonuç: <b class="pl-num">${fmt(r.value)}</b> ${esc(d.unit)} · kullanılan değişkenler: ${r.uses.map(esc).join(", ") || "—"}`;
  } catch (e) { $("#fnResult").innerHTML = `<span class="pl-badge pl-badge--danger">Hata</span> ${esc(e.message)}`; }
});
$("#btnFnAdd").onclick = () => run(async () => {
  const d = fnDraft();
  if (!d.name || !d.id || !d.expr) { toast("Ad ve formül gerekli", { kind: "warn" }); return; }
  if (S.scene.functions.some((f) => f.id === d.id)) { toast("Bu kimlik kullanılıyor", { kind: "warn" }); return; }
  await B.engine("eval_formula", { scene: S.scene, expr: d.expr });
  const s = clone();
  s.functions.push(d);
  commit(s);
  toast("Fonksiyon eklendi");
});
$("#btnMmSend").onclick = () => run(async () => {
  const prompt = await mmPrompt();
  $("#btnMmSend").classList.add("is-loading");
  try {
    const r = await B.mymind(prompt, true);
    $("#mmAnswer").innerHTML = `<p><span class="pl-badge pl-badge--pro">MyMind</span> <span class="uh-small">${esc(r.source)} · yalnız öneri</span></p><div>${esc(r.text)}</div>`;
  } finally { $("#btnMmSend").classList.remove("is-loading"); }
});
document.addEventListener("click", (e) => {
  if (e.target.id === "btnHubKey") run(async () => { await B.hubSetKey($("#hubKey").value); toast("Hub anahtarı kaydedildi"); renderMyMind(); });
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmd(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); exportAs("uhds"); }
});

init();
