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
  camSet: false, dirty3d: true, unit: "m", wallT: 100, paintMat: "parke-ceviz", libGroup: "Tümü", libQ: "", matCat: "zemin", keepRatio: false, motor: "perde", motorParams: null, motorTimer: null, sky: null, proj: null, ref: null, exposure: null, pendingCam: null, saveTimer: null, checkTimer: null,
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
  $("#objCount").textContent = S.catalog.furniture.length + S.scene.meshes.length;
  $("#matCount").textContent = S.scene.materials.length;
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
  if (v === "kaplama") renderMaterials();
  if (v === "motor") renderMotor();
  if (v === "referans") renderReference();
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
    { title: "1 · Yapı araçları", items: [{ type: "select", label: "Seç / taşı" }, { type: "wall", label: "Duvar çiz" }, { type: "measure", label: "Ölçü aracı" }, { type: "furniture", value: "kolon", label: "Kolon" }, { type: "furniture", value: "merdiven", label: "Merdiven" }], extra: `<div class="pl-segment" role="radiogroup" aria-label="Duvar kalınlığı">${[[100, "10 cm"], [125, "12,5 cm"], [200, "20 cm"]].map(([v, l]) => `<button type="button" data-wt="${v}" class="${S.wallT === v ? "is-active" : ""}">${l}</button>`).join("")}</div><button class="uh-tool uh-tool--wide uh-mt" type="button" data-act="undo-wall">Son duvarı geri al</button><button class="uh-tool uh-tool--wide" type="button" data-act="clear-walls">İç duvarları arşivle</button><p class="uh-small">Duvar: iki noktaya tıklayın (90° hizalı, 10 cm hassas; Shift ile zincirleme). Çizili bölmeyi sürükleyerek taşıyın. Ölçü aracı: iki nokta arasına kalıcı ölçü çizgisi bırakır.</p>` },
    { title: "2 · Oda / mahal", items: S.catalog.roomKinds.map((k) => ({ type: "room", value: k.id, label: k.label })), extra: `<p class="uh-small">Türü seçin, sonra duvarlarla çevrili alanın içine bir kez tıklayın. Mahal adı ve net m² otomatik oluşur.</p>` },
    { title: "3 · Kapı", items: S.catalog.openings.filter((o) => o.kind === "door").map((o) => ({ type: "opening", value: o.id, label: o.label })) },
    { title: "4 · Standart pencereler", items: S.catalog.openings.filter((o) => o.kind === "window").map((o) => ({ type: "opening", value: o.id, label: o.label.replace("Pencere ", "") })), extra: `<p class="uh-small">Taşıyıcı perdeye kapı/pencere konamaz. Birden fazla pencereyi arka arkaya yerleştirebilirsiniz.</p>` },
    { title: "5 · Mutfak", items: cat(["alt-dolap", "boy-dolabi", "tezgah", "ada", "evye", "ocak", "buzdolabi", "mutfak-tezgahi"]) },
    { title: "6 · Banyo", items: cat(["dus-kabini", "klozet", "lavabo", "camasir"]) },
    { title: "7 · Mobilya", items: cat(["cift-yatak", "tek-yatak", "komodin", "gardirop", "kanepe-3", "berjer", "orta-sehpa", "yemek-masasi", "sandalye", "tv-unitesi", "calisma-masasi", "kitaplik", "ayakkabilik", "hali", "bitki", "sarkit-lamba", "merdiven"]), extra: `<p class="uh-small">Merdiven zemin kata yerleştirilir; üst döşemede boşluk otomatik açılır.</p>` },
    { title: "8 · Aydınlatma, elektronik, dış mekân", items: cat(["avize", "lambader", "ankastre-spot", "aplik", "tv-55", "tablo-yatay", "agac", "cali", "cim-alan", "bahce-lambasi"]), extra: `<button class="uh-tool uh-tool--wide uh-mt" type="button" data-view="motor">Perde, halı, yatak, havuz tasarla…</button><p class="uh-small">Tüm ürünler Ürün kütüphanesindedir.</p>` },
    { title: "9 · Dış cephe kaplama", items: [{ type: "clad", value: "kaplama-tas", label: "Taş" }, { type: "clad", value: "kaplama-ahsap", label: "Ahşap" }, { type: "clad", value: "kaplama-kompozit", label: "Alüminyum kompozit" }, { type: "clad", value: "", label: "Kaplamayı kaldır" }], extra: `<p class="uh-small">Kaplama seçin, sonra plandaki dış cephe duvarlarına tıklayın.</p>` },
    { title: "10 · Dış cephe boyası", swatches: "facade" },
    { title: "11 · Kaplama uygula", items: [{ type: "paint", value: S.paintMat, label: "Kaplamayı uygula" }], extra: (() => { const m = S.scene.materials.find((x) => x.id === S.paintMat); return `<div class="uh-paintnow">${m ? `<span class="pl-swatch" style="background:rgb(${m.color.map((c) => Math.round(c * 255)).join(" ")})" aria-hidden="true"></span>${esc(m.name)}` : ""}</div><button class="uh-tool uh-tool--wide uh-mt" type="button" data-view="kaplama">Kaplama kütüphanesini aç</button><button class="uh-tool uh-tool--wide" type="button" data-view="kutuphane">Ürün kütüphanesini aç</button><p class="uh-small">Mahale tıklayınca zemin, duvara tıklayınca duvar yüzü, nesneye tıklayınca nesne kaplaması değişir.</p>`; })() },
    { title: "12 · Revizyon notu", items: [{ type: "note", label: "Plana not ekle" }] },
  ];
};
function toolLabel(t) {
  if (t.type === "select") return "Seç / taşı";
  if (t.type === "wall") return `${fmt(S.wallT / 10, S.wallT % 10 ? 1 : 0)} cm duvar çiz`;
  if (t.type === "measure") return "Ölçü aracı";
  if (t.type === "paint") return `Kaplama: ${S.scene.materials.find((m) => m.id === t.value)?.name || ""}`;
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
  if (sel.type === "dimension") return { sel, o: (s.dimensions || []).find((x) => x.id === sel.id) };
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
    const bd = baseDims(o);
    const mats = S.scene.materials.filter((m) => ["mobilya", "tekstil", "metal", "zemin", "genel", "ice-aktarilan"].includes(m.category) || m.id.startsWith("ozel-"));
    box.innerHTML = `<div class="uh-stats"><dt>Tür</dt><dd>${esc(cat ? cat.group : "İçe aktarılan model")}</dd><dt>Ölçek</dt><dd>%${fmt(o.scale[0] * 100, 0)} · %${fmt(o.scale[2] * 100, 0)} · %${fmt(o.scale[1] * 100, 0)}</dd></div>
      ${field("Ad", `<input class="pl-input" data-f="name" value="${esc(o.name)}">`)}
      <div class="pl-label">Boyutlandırma (cm)</div>
      <div class="uh-dims">${field("Genişlik", `<input class="pl-input" type="number" step="5" min="1" data-f="w" value="${Math.round(bd[0] * o.scale[0] / 10)}">`)}${field("Derinlik", `<input class="pl-input" type="number" step="5" min="1" data-f="d" value="${Math.round(bd[1] * o.scale[2] / 10)}">`)}${field("Yükseklik", `<input class="pl-input" type="number" step="5" min="1" data-f="h" value="${Math.round(bd[2] * o.scale[1] / 10)}">`)}</div>
      <label class="uh-check"><input type="checkbox" data-f="keep" ${S.keepRatio ? "checked" : ""}> Oranı koru (birlikte ölçekle)</label>
      <div class="uh-row">${field("Açı (°)", `<input class="pl-input" type="number" step="15" data-f="rot" value="${Math.round(o.rotation)}">`)}${field("Zeminden (cm)", `<input class="pl-input" type="number" step="5" min="0" data-f="z" value="${Math.round(o.position[2] / 10)}">`)}</div>
      <div class="uh-row">${field("X (m)", `<input class="pl-input" type="number" step="0.05" data-f="x" value="${(o.position[0] / 1000).toFixed(2)}">`)}${field("Y (m)", `<input class="pl-input" type="number" step="0.05" data-f="y" value="${(o.position[1] / 1000).toFixed(2)}">`)}</div>
      ${field("Kaplama", `<select class="pl-select" data-f="mat"><option value="">Varsayılan</option>${mats.map((m) => `<option value="${m.id}" ${o.material === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`)}
      <div class="uh-row">${field("Adet", `<input class="pl-input" type="number" step="1" min="1" max="99" data-f="qty" value="${o.quantity || 1}">`)}${field("Birim fiyat (₺)", `<input class="pl-input" type="number" step="100" min="0" data-f="price" value="${o.price}">`)}</div>
      <div class="uh-row uh-wrap"><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-act="rot">↻ 90°</button><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-act="dup">Çoğalt</button><button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-act="reset-size">Varsayılan ölçü</button><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button></div>
      <p class="uh-small">Planda köşe tutamaklarını sürükleyerek de boyutlandırabilirsiniz (Shift: oranı koru).</p>`;
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
      ${field("İç yüz kaplaması", `<select class="pl-select" data-f="wmat"><option value="">İç cephe boyası (genel)</option>${S.scene.materials.filter((m) => ["duvar", "ic-boya", "zemin"].includes(m.category) || m.id.startsWith("ozel-")).map((m) => `<option value="${m.id}" ${o.material === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`)}
      ${!o.generated ? field("Kalınlık (cm)", `<input class="pl-input" type="number" step="0.5" min="5" max="40" data-f="thick" value="${o.thickness / 10}">`) : ""}
      ${!o.generated ? `<button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button>` : `<p class="uh-small">Modül duvarları modülle birlikte değişir; arşivlenemez.</p>`}`;
  } else if (it.sel.type === "room") {
    const a = netArea({ rooms: [o] });
    const xs = o.polygon.map((p) => p[0]), ys = o.polygon.map((p) => p[1]);
    box.innerHTML = `<div class="uh-stats"><dt>Net alan</dt><dd>${fmt(a)} m²</dd><dt>Net ölçü</dt><dd>${fmt((Math.max(...xs) - Math.min(...xs)) / 1000)} × ${fmt((Math.max(...ys) - Math.min(...ys)) / 1000)} m</dd></div>
      ${field("Mahal adı", `<input class="pl-input" data-f="rname" value="${esc(o.name)}">`)}
      ${field("Tür", `<select class="pl-select" data-f="kind">${S.catalog.roomKinds.map((k) => `<option value="${k.id}" ${o.kind === k.id ? "selected" : ""}>${k.label}</option>`).join("")}</select>`)}
      ${field("Zemin kaplaması", `<select class="pl-select" data-f="floor">${S.scene.materials.filter((m) => m.category === "zemin").map((m) => `<option value="${m.id}" ${o.floor === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`)}
      <button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Mahal adını arşivle</button>`;
  } else if (it.sel.type === "dimension") {
    box.innerHTML = `<div class="uh-stats"><dt>Tür</dt><dd>Ölçü çizgisi</dd><dt>Uzunluk</dt><dd>${fmt(Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]) / 1000)} m</dd></div><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">Arşivle</button>`;
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
    if (f === "keep") { S.keepRatio = e.target.checked; return; }
    const ax = { w: 0, d: 2, h: 1 }[f];
    if (ax !== undefined) {
      const bd = baseDims(it.o);
      const k = Math.max(0.2, Math.min(5, ((Number(v) || 1) * 10) / bd[{ w: 0, d: 1, h: 2 }[f]]));
      if (S.keepRatio) o.scale = [k, k, k]; else o.scale[ax] = k;
    }
    if (f === "rot") o.rotation = (((Number(v) || 0) % 360) + 360) % 360;
    if (f === "z") o.position[2] = Math.max(0, Math.min(6000, (Number(v) || 0) * 10));
    if (f === "mat") o.material = v || null;
    if (f === "qty") o.quantity = Math.max(1, Math.min(99, Math.round(Number(v) || 1)));
    if (f === "price") o.price = Math.max(0, Number(v) || 0);
    commit(s);
  } else if (it.sel.type === "wall" && f === "wmat") {
    level.walls.find((x) => x.id === it.o.id).material = v;
    commit(s);
  } else if (it.sel.type === "wall" && f === "thick") {
    level.walls.find((x) => x.id === it.o.id).thickness = Math.max(50, Math.min(400, (Number(v) || 10) * 10));
    run(async () => { const r = await B.engine("refresh", { scene: s }); commit(r.scene); });
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
  else if (t === "dimension") { s.dimensions = s.dimensions.filter((x) => x.id !== it.o.id); put(it.o); }
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
  if (kind === "wall") return run(async () => { const r = await B.engine("add_partition", { scene: S.scene, level: S.level, a: d.a, b: d.b, thickness: S.wallT }); commit(r.scene); });
  if (kind === "wall_moved") return run(async () => { const r = await B.engine("refresh", { scene: S.scene }); commit(r.scene); if (r.roomWarnings.length) toast(r.roomWarnings[0], { kind: "warn", action: "Geri al", onAction: undo }); });
  if (kind === "dimension") { const s = clone(); s.dimensions = s.dimensions || []; s.dimensions.push({ id: nextId("Ö", s.dimensions), level: S.level, a: d.a, b: d.b }); commit(s); return; }
  if (kind === "paint") {
    if (!d.hit) { toast("Bir mahale, duvara ya da nesneye tıklayın", { kind: "warn" }); return; }
    const s = clone();
    const lv = s.levels.find((l) => l.id === S.level);
    const mat = s.materials.find((m) => m.id === d.material);
    if (!mat) return;
    if (d.hit.type === "object") s.objects.find((x) => x.id === d.hit.id).material = mat.id;
    else if (d.hit.type === "room") lv.rooms.find((x) => x.id === d.hit.id).floor = mat.id;
    else if (d.hit.type === "wall") {
      const w = lv.walls.find((x) => x.id === d.hit.id);
      if (w.exterior && ["cephe", "kaplama", "kabuk"].includes(mat.category)) w.outer = mat.id; else w.material = mat.id;
    }
    commit(s);
    return;
  }
  if (kind === "room") return run(async () => { const r = await B.engine("name_room", { scene: S.scene, level: S.level, point: d.point, kind: d.kind }); commit(r.scene); toast(`${r.extra.room.name} oluşturuldu`); });
  if (kind === "opening") return run(async () => { const r = await B.engine("place_opening", { scene: S.scene, level: S.level, point: d.point, std: d.std }); commit(r.scene); });
  if (kind === "furniture") {
    const it = S.catalog.furniture.find((f) => f.id === d.cat);
    if (it.id === "merdiven" && S.level !== "L0") { toast("Merdiven yalnız zemin kata yerleştirilir", { kind: "warn" }); return; }
    const s = clone();
    const z = it.mount === -2 ? s.standard.net_height - it.size[2] - 2 : it.mount < 0 ? s.standard.net_height - 900 : it.mount;
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
    if (S.pendingCam) { const c = S.pendingCam; S.pendingCam = null; await camera(c); }
  });
}
async function camera(name) {
  const cut = name === "izometrik-kesit";
  if (name.startsWith("izometrik")) {
    if (S.v3.cut !== cut) { S.v3.cut = cut; $("#chkCut").checked = cut; const m = await B.engine("mesh", { scene: S.scene, options: meshOptions() }); V.setMesh(m); S.dirty3d = false; }
    name = "izometrik";
  }
  const c = await B.engine("camera_preset", { scene: S.scene, name });
  S.proj = c.projection === "isometric" ? "isometric" : null;
  V.setCamera(c);
}
function skySettings() {
  if (!$("#chkSky").checked) return null;
  return { hour: Number($("#skyHour").value), cloud: Number($("#skyCloud").value), haze: Number($("#skyHaze").value), month: Number($("#skyMonth").value) };
}
function syncSky() {
  const on = $("#chkSky").checked;
  $("#skyBox").classList.toggle("is-off", !on);
  const h = Number($("#skyHour").value);
  $("#skyHourOut").textContent = `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  $("#skyCloudOut").textContent = `%${Math.round(Number($("#skyCloud").value) * 100)}`;
  $("#skyHazeOut").textContent = `%${Math.round(Number($("#skyHaze").value) * 100)}`;
  // önizleme: saate en yakın ışık düzeni
  if (on) V.setAtmosphere(h < 6 || h > 20.5 ? "aksam" : h < 7.5 || h > 17.5 ? "gun-batimi" : "gunduz");
  else V.setAtmosphere(S.atm);
}
function renderInteriorSwatches() {
  $("#interiorSwatches").innerHTML = swatches("ic-", S.scene.interior, "interior").replace('<div class="pl-swatches uh-mt" role="radiogroup">', "").replace(/<\/div>$/, "");
}
async function doRender() {
  const [w, h] = $("#selRes").value.split("x").map(Number);
  const spp = Number($("#selSpp").value);
  if (!B.isDesktop && w > 1920) { toast("4K ve 8K çıktı masaüstü uygulamasında alınır", { kind: "warn", sub: "Tarayıcı önizlemesi tek çekirdek ve sınırlı bellekle çalışır" }); return; }
  const ov = $("#renderOverlay");
  ov.hidden = false;
  $("#renderMsg").textContent = `Render alınıyor · ${w}×${h} · ${spp} örnek. ${B.isDesktop ? "Tüm işlemci çekirdekleri kullanılıyor." : "Tarayıcı önizlemesinde tek çekirdek; taslak kalite önerilir."}`;
  $("#btnRender").classList.add("is-loading");
  try {
    const cam = V.getCamera();
    const r = await B.engine("render", { scene: S.scene, atmosphere: S.atm, settings: { width: w, height: h, samples: spp, bounces: spp >= 128 ? 6 : 4, eye: cam.eye, target: cam.target, fov: cam.fov, exposure: S.exposure || 0.62, projection: S.proj || "perspective", ortho_height: S.proj ? cam.orthoHeight : null, sky: skySettings(), mesh: meshOptions(), denoise: true } });
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

/* ---------- Ürün kütüphanesi ---------- */
const rgb = (c, k = 1) => `rgb(${c.map((x) => Math.round(Math.min(1, x * k) * 255)).join(" ")})`;
/** Katalog parçalarından izometrik küçük resim (SVG). */
function isoThumb(parts) {
  if (!parts || !parts.length) return "";
  const P3 = (x, y, z) => [(x - z) * 0.866, (x + z) * 0.5 - y];
  const faces = [];
  for (const p of parts) {
    const [x0, y0, z0] = p.min, [x1, y1, z1] = p.max;
    const col = (S.scene.materials.find((m) => m.id === p.material) || { color: [0.7, 0.7, 0.7] }).color;
    const depth = x1 + z1 + y1;
    faces.push({ d: depth, k: 1.0, pts: [P3(x0, y1, z0), P3(x1, y1, z0), P3(x1, y1, z1), P3(x0, y1, z1)], col });
    faces.push({ d: depth, k: 0.78, pts: [P3(x0, y0, z1), P3(x1, y0, z1), P3(x1, y1, z1), P3(x0, y1, z1)], col });
    faces.push({ d: depth, k: 0.6, pts: [P3(x1, y0, z0), P3(x1, y0, z1), P3(x1, y1, z1), P3(x1, y1, z0)], col });
  }
  faces.sort((a, b) => a.d - b.d);
  const xs = faces.flatMap((f) => f.pts.map((q) => q[0])), ys = faces.flatMap((f) => f.pts.map((q) => q[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
  return `<svg viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${faces.map((f) => `<polygon points="${f.pts.map((q) => q.map((v) => v.toFixed(0)).join(",")).join(" ")}" fill="${rgb(f.col, f.k)}"/>`).join("")}</svg>`;
}
function renderLibrary() {
  const f = S.catalog.furniture;
  const groups = ["Tümü", ...new Set(f.map((x) => x.group))];
  $("#libGroups").innerHTML = groups.map((g) => `<button type="button" role="tab" class="uh-tool ${S.libGroup === g ? "is-active" : ""}" data-lib-group="${esc(g)}">${esc(g)}</button>`).join("");
  const q = S.libQ.toLocaleLowerCase("tr-TR");
  const list = f.filter((x) => (S.libGroup === "Tümü" || x.group === S.libGroup) && (!q || x.name.toLocaleLowerCase("tr-TR").includes(q)));
  $("#libGrid").innerHTML = list.map((x) => `<div class="uh-libcard"><div class="uh-libcard__thumb">${isoThumb(S.catalog.previews[x.id])}</div><b>${esc(x.name)}</b>
    <div class="uh-libcard__meta"><span>${x.size.map((v) => fmt(v / 10, 0)).join("×")} cm</span><span class="is-money">${x.price ? tl(x.price) : "—"}</span></div>
    <button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-lib-place="${x.id}">Plana yerleştir</button></div>`).join("") || `<p class="uh-small">Aramanızla eşleşen ürün yok.</p>`;
  $("#objGrid").innerHTML = S.scene.meshes.map((m) => `<div class="uh-libcard"><div class="uh-libcard__thumb"><span class="pl-badge">OBJ</span></div><b>${esc(m.name)}</b>
    <div class="uh-libcard__meta"><span>${(m.indices.length / 3).toLocaleString("tr-TR")} üçgen</span><span>sahnede ${S.scene.objects.filter((o) => o.mesh === m.id).length}</span></div>
    <button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-place-mesh="${m.id}">Plana ekle</button></div>`).join("") || `<p class="uh-small">Henüz içe aktarılan model yok.</p>`;
}

/* ---------- Tasarım motorları ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 1000) / 1000);
const rgb2hex = (c) => "#" + c.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("");
const R = (k, label, min, max, step, unit = "") => ({ k, label, t: "range", min, max, step, unit });
const Sel = (k, label, opts) => ({ k, label, t: "select", opts });
const Col = (k, label) => ({ k, label, t: "color" });
const Chk = (k, label) => ({ k, label, t: "check" });
const MOTORS = {
  perde: { lead: "Perde tasarlayıcı: cins (tül, fon, tül + fon, stor), pile sıklığı ve derinliği, kemer/korniş tipi, saydamlık, desen ve renk.", fields: [
    Sel("kind", "Cins", [["tul-fon", "Tül + fon"], ["tul", "Tül"], ["fon", "Fon"], ["stor", "Stor"]]), Sel("header", "Üst bitiş", [["rustik", "Rustik (ahşap boru)"], ["korniş", "Korniş"], ["kemer-duz", "Düz kemer"], ["kemer-kavisli", "Kavisli kemer"]]),
    R("width", "Genişlik", 600, 6000, 50, "mm"), R("height", "Yükseklik", 1000, 3200, 50, "mm"), R("pleats", "Pile sıklığı", 3, 18, 0.5, "pile/m"), R("depth", "Pile derinliği", 20, 160, 5, "mm"),
    R("opacity", "Tül saydamlığı (düşük = saydam)", 0.1, 0.6, 0.05), R("open", "Açıklık (fon/stor)", 0, 0.9, 0.05),
    Sel("pattern", "Desen", [["duz", "Düz"], ["cizgili", "Çizgili"], ["bordur", "Etek bordürü"]]), Col("color", "Tül rengi"), Col("color2", "Fon rengi")] },
  hali: { lead: "Halı motoru: şekil, ölçü, desen, iki renk, hav yüksekliği ve saçak.", fields: [
    Sel("shape", "Şekil", [["dikdortgen", "Dikdörtgen"], ["yuvarlak", "Yuvarlak"], ["oval", "Oval"], ["yolluk", "Yolluk"]]), Sel("pattern", "Desen", [["bordur", "Bordürlü"], ["duz", "Düz"], ["cizgili", "Çizgili"], ["dama", "Dama"], ["madalyon", "Madalyon"]]),
    R("width", "Genişlik", 600, 5000, 50, "mm"), R("length", "Boy", 600, 7000, 50, "mm"), R("pile", "Hav yüksekliği", 4, 50, 1, "mm"), Chk("fringe", "Saçaklı"), Col("color", "Ana renk"), Col("color2", "Desen rengi")] },
  yatak: { lead: "Yatak kombinasyonu: ölçü, baza tipi, şilte, başlık formu ve nevresim takımı birlikte üretilir.", fields: [
    Sel("width", "Genişlik", [[900, "90 cm"], [1000, "100 cm"], [1200, "120 cm"], [1400, "140 cm"], [1600, "160 cm"], [1800, "180 cm"], [2000, "200 cm"]]), Sel("length", "Boy", [[1900, "190 cm"], [2000, "200 cm"]]),
    Sel("base", "Baza", [["sandikli", "Sandıklı"], ["ayakli", "Ayaklı"], ["dusuk", "Düşük platform"]]), Sel("headboard", "Başlık", [["kapitone", "Kapitone"], ["duz", "Düz"], ["kemerli", "Kemerli"], ["kulakli", "Kulaklı"], ["yok", "Başlıksız"]]),
    R("mattress", "Şilte yüksekliği", 150, 380, 10, "mm"), R("headboard_height", "Başlık yüksekliği", 800, 1700, 50, "mm"), Col("base_color", "Baza rengi"), Col("headboard_color", "Başlık rengi"),
    Chk("bedding.on", "Nevresim takımı"), Sel("bedding.pattern", "Nevresim deseni", [["duz", "Düz"], ["cizgili", "Çizgili"], ["dama", "Dama"]]), Sel("bedding.pillows", "Yastık", [[1, "1"], [2, "2"], [4, "4"], [6, "6"]]), Chk("bedding.throw", "Ayak ucu örtüsü"), Col("bedding.color", "Nevresim rengi"), Col("bedding.color2", "İkinci renk")] },
  nevresim: { lead: "Nevresim motoru: mevcut bir yatağın ölçüsüne otomatik uyan yorgan, katlama, yastık ve örtü takımı.", fields: [
    Sel("width", "Yatak genişliği", [[900, "90 cm"], [1000, "100 cm"], [1200, "120 cm"], [1400, "140 cm"], [1600, "160 cm"], [1800, "180 cm"], [2000, "200 cm"]]), Sel("length", "Yatak boyu", [[1900, "190 cm"], [2000, "200 cm"]]),
    R("top", "Şilte üst kotu", 250, 800, 10, "mm"), Sel("bedding.pattern", "Desen", [["duz", "Düz"], ["cizgili", "Çizgili"], ["dama", "Dama"]]), Sel("bedding.pillows", "Yastık", [[1, "1"], [2, "2"], [4, "4"], [6, "6"]]), Chk("bedding.throw", "Ayak ucu örtüsü"), Col("bedding.color", "Ana renk"), Col("bedding.color2", "İkinci renk")] },
  havuz: { lead: "Havuz oluşturucu: şekil, ölçü, derinlik, kenar taşı, su rengi, basamak ve aydınlatma. Havuz yapının dışına yerleştirilir.", fields: [
    Sel("shape", "Şekil", [["dikdortgen", "Dikdörtgen"], ["oval", "Oval"], ["yuvarlak", "Yuvarlak"], ["l", "L biçimli"]]), R("width", "Genişlik", 2000, 10000, 100, "mm"), R("length", "Boy", 2000, 20000, 100, "mm"), R("depth", "Derinlik", 800, 2800, 50, "mm"),
    R("coping", "Kenar taşı genişliği", 150, 700, 10, "mm"), Col("water", "Su rengi"), Chk("steps", "Basamak"), Chk("lights", "Havuz aydınlatması")] },
};
const getPath = (o, k) => k.split(".").reduce((a, p) => a[p], o);
const setPath = (o, k, v) => { const ps = k.split("."); const last = ps.pop(); ps.reduce((a, p) => a[p], o)[last] = v; };
function renderMotor() {
  const kind = S.motor;
  const def = MOTORS[kind];
  const p = S.motorParams[kind];
  $$("#motorTabs button").forEach((b) => b.classList.toggle("is-active", b.dataset.m === kind));
  $("#motorLead").textContent = def.lead;
  $("#motorForm").innerHTML = def.fields.map((f) => {
    const v = getPath(p, f.k);
    if (f.t === "range") return `<label class="pl-field"><span class="pl-field__label">${f.label} <output>${fmt(v, f.step < 1 ? 2 : 0)}${f.unit ? " " + f.unit : ""}</output></span><input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-mk="${f.k}" data-mt="range" data-unit="${f.unit}" data-step="${f.step}"></label>`;
    if (f.t === "select") return `<label class="pl-field"><span class="pl-field__label">${f.label}</span><select class="pl-select" data-mk="${f.k}" data-mt="${typeof f.opts[0][0] === "number" ? "num" : "str"}">${f.opts.map(([val, l]) => `<option value="${val}" ${String(v) === String(val) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
    if (f.t === "color") return `<label class="pl-field"><span class="pl-field__label">${f.label}</span><input class="pl-input uh-color" type="color" value="${rgb2hex(v)}" data-mk="${f.k}" data-mt="color"></label>`;
    return `<label class="pl-switch"><input type="checkbox" ${v ? "checked" : ""} data-mk="${f.k}" data-mt="check"> ${f.label}</label>`;
  }).join("");
  motorPreview();
}
function motorPreview() {
  clearTimeout(S.motorTimer);
  S.motorTimer = setTimeout(async () => {
    try {
      const r = await B.engine("motor_preview", { kind: S.motor, params: S.motorParams[S.motor] });
      drawMotor(r);
      $("#motorInfo").innerHTML = `<dt>Ürün</dt><dd>${esc(r.name)}</dd><dt>Ölçü (G × D × Y)</dt><dd>${r.size.map((v) => fmt(v / 10, 0)).join(" × ")} cm</dd><dt>Üçgen</dt><dd>${r.triangles.toLocaleString("tr-TR")}</dd><dt>Tahmini fiyat</dt><dd>${tl(r.price)}</dd>`;
    } catch (e) { $("#motorInfo").innerHTML = `<dt>Hata</dt><dd>${esc(e.message)}</dd>`; }
  }, 120);
}
/** Üçgen ağını izometrik olarak çizer: derinlik tamponlu yazılım rasterleştirici. */
function drawMotor(r) {
  const cv = $("#motorCanvas"), ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  const tris = [];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const g of r.groups) {
    const p = g.positions;
    for (let i = 0; i + 8 < p.length; i += 9) {
      const v = [0, 3, 6].map((o) => {
        const [x, y, z] = [p[i + o], p[i + o + 1], p[i + o + 2]];
        return [(x - z) * 0.866, (x + z) * 0.5 - y, x + y + z];
      });
      const a = [p[i], p[i + 1], p[i + 2]], b = [p[i + 3], p[i + 4], p[i + 5]], c = [p[i + 6], p[i + 7], p[i + 8]];
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const l = Math.hypot(...n) || 1;
      n = n.map((q) => Math.abs(q / l));
      const k = Math.min(1.15, 0.45 + 0.55 * n[1] + 0.28 * n[2] + 0.1 * n[0]);
      for (const q of v) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      tris.push({ v, col: g.color.map((cc) => Math.min(255, cc * k * 255)), sheer: g.opacity < 0.5 });
    }
  }
  const img = ctx.createImageData(W, H);
  if (!tris.length) { ctx.putImageData(img, 0, 0); return; }
  const s = Math.min((W - 40) / (x1 - x0 || 1), (H - 40) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 - y0 * s;
  const zb = new Float32Array(W * H).fill(-Infinity);
  const d = img.data;
  // önce opak yüzeyler, sonra saydam (tül, su) yüzeyler
  tris.sort((a, b) => a.sheer - b.sheer);
  for (const t of tris) {
    const [A, B2, C] = t.v.map((q) => [q[0] * s + ox, q[1] * s + oy, q[2]]);
    const area = (B2[0] - A[0]) * (C[1] - A[1]) - (B2[1] - A[1]) * (C[0] - A[0]);
    if (Math.abs(area) < 1e-6) continue;
    const bx0 = Math.max(0, Math.floor(Math.min(A[0], B2[0], C[0]))), bx1 = Math.min(W - 1, Math.ceil(Math.max(A[0], B2[0], C[0])));
    const by0 = Math.max(0, Math.floor(Math.min(A[1], B2[1], C[1]))), by1 = Math.min(H - 1, Math.ceil(Math.max(A[1], B2[1], C[1])));
    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((B2[0] - px) * (C[1] - py) - (B2[1] - py) * (C[0] - px)) / area;
        const w1 = ((C[0] - px) * (A[1] - py) - (C[1] - py) * (A[0] - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue;
        const z = w0 * A[2] + w1 * B2[2] + w2 * C[2];
        const k = y * W + x;
        if (z <= zb[k]) continue;
        const o = k * 4;
        if (t.sheer) {
          const al = d[o + 3] ? 0.5 : 1;
          d[o] = d[o] * (1 - al) + t.col[0] * al; d[o + 1] = d[o + 1] * (1 - al) + t.col[1] * al; d[o + 2] = d[o + 2] * (1 - al) + t.col[2] * al;
          d[o + 3] = Math.max(d[o + 3], 150);
        } else {
          zb[k] = z;
          d[o] = t.col[0]; d[o + 1] = t.col[1]; d[o + 2] = t.col[2]; d[o + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}
async function motorAdd() {
  const lv = S.scene.levels.find((l) => l.id === S.level) || S.scene.levels[0];
  let at = [1500, 1500];
  const xs = [], ys = [];
  for (const m of S.scene.modules) { const r = moduleRect(m, S.scene); xs.push(r[0], r[2]); ys.push(r[1], r[3]); }
  if (S.motor === "havuz") {
    const p = S.motorParams.havuz;
    at = xs.length ? [Math.max(...xs) + 2500 + p.width / 2, (Math.min(...ys) + Math.max(...ys)) / 2] : [8000, 4000];
  } else {
    const kinds = { yatak: "yatak", nevresim: "yatak", perde: "salon", hali: "salon" };
    const room = lv.rooms.find((r) => r.kind === kinds[S.motor]) || lv.rooms[0];
    if (room) { const rx = room.polygon.map((q) => q[0]), ry = room.polygon.map((q) => q[1]); at = [(Math.min(...rx) + Math.max(...rx)) / 2, (Math.min(...ry) + Math.max(...ry)) / 2]; }
  }
  const r = await B.engine("motor", { scene: S.scene, kind: S.motor, params: S.motorParams[S.motor], level: S.motor === "havuz" ? "L0" : lv.id, at });
  commit(r.scene);
  P.fitted = false;
  P.sel = { type: "object", id: r.object };
  P.setTool({ type: "select" });
  go("plan");
  toast("Model plana eklendi; sürükleyerek yerine taşıyın", { sub: `${r.triangles.toLocaleString("tr-TR")} üçgen · ${tl(r.price)}` });
}

/* ---------- Görselden referans ---------- */
async function refPick(file) {
  if (!file || file.size > 40 * 1024 * 1024) { toast("Görsel 40 MB'tan küçük olmalı", { kind: "warn" }); return; }
  const bmp = await createImageBitmap(file);
  // en-boy oranını koruyarak en çok 96 piksele küçült; görsel yalnız bu cihazda işlenir
  const k = 96 / Math.max(bmp.width, bmp.height);
  const w = Math.max(4, Math.round(bmp.width * k)), h = Math.max(4, Math.round(bmp.height * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const cx = cv.getContext("2d");
  cx.drawImage(bmp, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data;
  let bin = "";
  for (let i = 0; i < d.length; i += 4) bin += String.fromCharCode(d[i], d[i + 1], d[i + 2]);
  const r = await B.engine("reference_image", { scene: S.scene, width: w, height: h, rgb: btoa(bin) });
  S.ref = r;
  $("#refThumb").src = URL.createObjectURL(file);
  renderReference();
}
function renderReference() {
  const r = S.ref;
  $("#refBody").hidden = !r;
  $("#refEmpty").hidden = !!r;
  if (!r) return;
  const name = (id) => S.scene.materials.find((m) => m.id === id)?.name || "—";
  $("#refPalette").innerHTML = r.palette.map((p) => `<span style="width:${(p.share * 100).toFixed(1)}%;background:${rgb(p.color)}" title="%${Math.round(p.share * 100)}"></span>`).join("");
  const light = { ic: "İç mekân / kapalı hava", "dis-gunduz": "Dış mekân · gündüz", "gun-batimi": "Gün batımı", gece: "Gece" }[r.lighting];
  const cam = { ic: "İç mekân, göz hizası", kusbakisi: "Kuşbakışı", perspektif: "Dış perspektif" }[r.camera];
  $("#refStats").innerHTML = `<dt>Işık düzeni</dt><dd>${light}</dd><dt>Parlaklık</dt><dd>%${Math.round(r.brightness * 100)}</dd><dt>Sıcaklık</dt><dd>${r.warmth > 0.04 ? "Sıcak" : r.warmth < -0.04 ? "Soğuk" : "Nötr"} (${fmt(r.warmth)})</dd><dt>Doygunluk</dt><dd>%${Math.round(r.saturation * 100)}</dd><dt>Ufuk çizgisi (tahmini)</dt><dd>üstten %${Math.round(r.horizon * 100)}</dd>`;
  const hh = `${String(Math.floor(r.sky.hour)).padStart(2, "0")}:${String(Math.round((r.sky.hour % 1) * 60)).padStart(2, "0")}`;
  const items = [
    ["interior", `İç cephe boyası → ${esc(name(r.interior))}`, !!r.interior],
    ["floor", `Zemin kaplaması (kuru mahaller) → ${esc(name(r.floor))}`, !!r.floor],
    ["facade", `Dış cephe → ${esc(name(r.facade))}`, !!r.facade && r.lighting !== "ic"],
    ["sky", `Gökyüzü ve ışık → saat ${hh}, bulut %${Math.round(r.sky.cloud * 100)}, pus %${Math.round(r.sky.haze * 100)}`, true],
    ["exposure", `Pozlama → ${fmt(r.exposure)}`, true],
    ["camera", `Kamera / perspektif → ${cam} (görüş açısı ${r.fov}°)`, true],
  ];
  $("#refApplyList").innerHTML = items.map(([k, l, on]) => `<label class="uh-check"><input type="checkbox" data-ref="${k}" ${on ? "checked" : ""}> ${l}</label>`).join("");
  $("#refMatches").innerHTML = r.matches.map((m) => `<div class="uh-libcard"><div class="uh-libcard__thumb">${isoThumb(S.catalog.previews[m.id])}</div><b>${esc(m.name)}</b><div class="uh-libcard__meta"><span>${esc(m.group)}</span><span>benzerlik %${Math.round(m.score * 100)}</span></div><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-lib-place="${m.id}">Plana yerleştir</button></div>`).join("") || `<p class="uh-small">Görselde arka plandan ayrışan tek bir ürün bulunamadı. Ürünü düz bir zemin önünde gösteren bir görsel deneyin.</p>`;
}
async function refApply() {
  const r = S.ref;
  if (!r) return;
  const on = (k) => $(`[data-ref="${k}"]`)?.checked;
  const want = { sky: on("sky"), exposure: on("exposure"), camera: on("camera") };
  const s = clone();
  if (on("interior") && r.interior) s.interior = r.interior;
  if (on("facade") && r.facade) s.facade = r.facade;
  if (on("floor") && r.floor) for (const l of s.levels) for (const room of l.rooms) if (!["banyo", "mutfak", "camasir", "kiler"].includes(room.kind)) room.floor = r.floor;
  commit(s);
  if (want.sky) {
    $("#chkSky").checked = true;
    $("#skyHour").value = r.sky.hour; $("#skyCloud").value = r.sky.cloud; $("#skyHaze").value = r.sky.haze;
    syncSky();
  }
  if (want.exposure) S.exposure = r.exposure;
  if (want.camera) {
    S.v3.mode = r.camera === "ic" ? "ic" : "dis";
    $$("#segView button").forEach((b) => b.classList.toggle("is-active", b.dataset.v === S.v3.mode));
    S.camSet = true;
    S.pendingCam = r.camera;
  }
  go("uc");
  toast("Sahne görsele göre uyarlandı", { action: "Geri al", onAction: undo });
}

/* ---------- Kaplama kütüphanesi ---------- */
const MAT_CATS = [["zemin", "Zemin", ["zemin"]], ["ic", "İç duvar", ["duvar", "ic-boya", "tavan"]], ["cephe", "Dış cephe boyası", ["cephe", "kabuk"]], ["kaplama", "Cephe kaplaması", ["kaplama"]], ["mobilya", "Mobilya ve tekstil", ["mobilya", "tekstil", "metal", "dekor", "genel"]], ["diger", "Diğer", ["dograma", "isik", "dis", "ice-aktarilan"]]];
function renderMaterials() {
  $("#matCats").innerHTML = MAT_CATS.map(([id, label]) => `<button type="button" role="tab" class="uh-tool ${S.matCat === id ? "is-active" : ""}" data-mat-cat="${id}">${label}</button>`).join("");
  const cats = MAT_CATS.find((c) => c[0] === S.matCat)[2];
  const list = S.scene.materials.filter((m) => cats.includes(m.category));
  const priced = ["zemin", "kaplama"].includes(S.matCat);
  $("#matGrid").innerHTML = list.map((m) => `<div class="uh-matcard ${S.paintMat === m.id ? "is-active" : ""}">
    <span class="uh-matball" style="background:radial-gradient(circle at 32% 28%, ${rgb(m.color, 1.25 + (1 - m.roughness) * 0.9)}, ${rgb(m.color)} 46%, ${rgb(m.color, 0.45)})" aria-hidden="true"></span>
    <div class="uh-matcard__body"><b title="${esc(m.name)}">${esc(m.name)}</b>
      <span class="uh-small">Pürüz ${fmt(m.roughness)} · Metalik ${fmt(m.metallic)}</span>
      <div class="uh-matcard__row">${priced ? `<input class="pl-input uh-cell-input" type="number" min="0" step="10" value="${m.price_m2}" data-mat-price="${m.id}" aria-label="${esc(m.name)} m² fiyatı"><span class="uh-small">₺/m²</span>` : ""}<span class="uh-grow"></span><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-mat-apply="${m.id}">Uygula</button></div>
    </div></div>`).join("") || `<p class="uh-small">Bu türde kaplama yok.</p>`;
}
function baseDims(o) {
  if (o.mesh.startsWith("cat:")) { const c = S.catalog.furniture.find((f) => f.id === o.mesh.slice(4)); if (c) return [...c.size]; }
  const m = S.scene.meshes.find((x) => x.id === o.mesh);
  const [w, d] = P.objBase(o);
  const h = m && m.positions.length ? Math.max(...m.positions.map((p) => p[1])) : 1000;
  return [w, d, h];
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
  ["Ölçü ve metraj", () => go("olcu")], ["Maliyet ve ölçekleme", () => go("maliyet")], ["Fonksiyonlar", () => go("fonksiyon")], ["Ürün kütüphanesi", () => go("kutuphane")], ["Kaplama kütüphanesi", () => go("kaplama")], ["Tasarım motorları", () => go("motor")], ["Görselden referans", () => go("referans")], ["MyMind", () => go("mymind")],
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
    S.motorParams = await B.engine("motor_defaults");
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
  if (tool) { const tt = JSON.parse(tool.dataset.tool); if (tt.type === "wall") tt.thickness = S.wallT; P.setTool(tt); renderPlan(); P.c.focus(); return; }
  const wt = t.closest("[data-wt]");
  if (wt) { S.wallT = Number(wt.dataset.wt); P.setTool({ type: "wall", thickness: S.wallT }); renderPlan(); return; }
  const lg = t.closest("[data-lib-group]");
  if (lg) { S.libGroup = lg.dataset.libGroup; renderLibrary(); return; }
  const lp = t.closest("[data-lib-place]");
  if (lp) { P.setTool({ type: "furniture", value: lp.dataset.libPlace }); go("plan"); toast("Ürünü yerleştirmek için plana tıklayın", { sub: S.catalog.furniture.find((f) => f.id === lp.dataset.libPlace)?.name }); return; }
  const mc = t.closest("[data-mat-cat]");
  if (mc) { S.matCat = mc.dataset.matCat; renderMaterials(); return; }
  const ma = t.closest("[data-mat-apply]");
  if (ma) { S.paintMat = ma.dataset.matApply; P.setTool({ type: "paint", value: S.paintMat }); go("plan"); toast("Kaplamayı uygulamak için mahale, duvara ya da nesneye tıklayın"); return; }
  const act = t.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "archive") archiveSelected();
    if (a === "rot") rotateObject();
    if (a === "dup" || a === "reset-size") {
      const it = selected();
      if (!it || it.sel.type !== "object") return;
      const s = clone();
      const o = s.objects.find((x) => x.id === it.o.id);
      if (a === "reset-size") o.scale = [1, 1, 1];
      else {
        const c = JSON.parse(JSON.stringify(o));
        c.id = nextId("N", s.objects);
        c.position = [o.position[0] + 300, o.position[1] + 300, o.position[2]];
        s.objects.push(c);
        P.sel = { type: "object", id: c.id };
      }
      commit(s);
    }
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
  if (t.dataset.matPrice) { const s = clone(); s.materials.find((m) => m.id === t.dataset.matPrice).price_m2 = Math.max(0, Number(t.value) || 0); commit(s); return; }
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
segment("#segAtm", "a", (a) => { S.atm = a; $("#chkSky").checked = false; syncSky(); });
segment("#motorTabs", "m", (m) => { S.motor = m; renderMotor(); });
for (const id of ["#chkSky", "#skyHour", "#skyCloud", "#skyHaze", "#skyMonth"]) $(id).addEventListener("input", syncSky);
$("#btnMotorAdd").onclick = () => run(motorAdd);
$("#btnRefPick").onclick = () => $("#refInput").click();
$("#refInput").addEventListener("change", (e) => run(() => refPick(e.target.files[0])));
$("#btnRefApply").onclick = () => refApply();
$("#motorForm").addEventListener("input", (e) => {
  const t = e.target, k = t.dataset.mk;
  if (!k) return;
  const p = S.motorParams[S.motor];
  const mt = t.dataset.mt;
  const v = mt === "range" || mt === "num" ? Number(t.value) : mt === "color" ? hex2rgb(t.value) : mt === "check" ? t.checked : t.value;
  setPath(p, k, v);
  if (mt === "range") { const st = Number(t.dataset.step); t.closest("label").querySelector("output").textContent = `${fmt(v, st < 1 ? 2 : 0)}${t.dataset.unit ? " " + t.dataset.unit : ""}`; }
  motorPreview();
});
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
$("#libSearch").addEventListener("input", (e) => { S.libQ = e.target.value; renderLibrary(); });
$("#matRough").addEventListener("input", (e) => { $("#matRoughOut").textContent = fmt(Number(e.target.value)); });
$("#matMetal").addEventListener("input", (e) => { $("#matMetalOut").textContent = fmt(Number(e.target.value)); });
$("#btnMatAdd").onclick = () => {
  const name = $("#matName").value.trim();
  if (!name) { toast("Kaplama adı gerekli", { kind: "warn" }); return; }
  const hex = $("#matColor").value;
  const color = [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 1000) / 1000);
  const s = clone();
  const slug = name.toLowerCase().replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c])).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kaplama";
  let id = `ozel-${slug}`, n = 2;
  while (s.materials.some((m) => m.id === id)) id = `ozel-${slug}-${n++}`;
  const cat = $("#matCat").value;
  s.materials.push({ id, name: name.slice(0, 60), color, roughness: Number($("#matRough").value), metallic: Number($("#matMetal").value), emission: 0, opacity: 1, price_m2: Math.max(0, Number($("#matPrice").value) || 0), category: cat });
  S.matCat = { zemin: "zemin", "ic-boya": "ic", cephe: "cephe", kaplama: "kaplama", mobilya: "mobilya" }[cat];
  S.paintMat = id;
  commit(s);
  $("#matName").value = "";
  toast("Kaplama eklendi", { sub: name });
};
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
