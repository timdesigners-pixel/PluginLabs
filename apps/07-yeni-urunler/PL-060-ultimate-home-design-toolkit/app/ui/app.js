/* Ultimate Home Design Toolkit — arayüz akışı.
 * Tüm hesaplar Rust motorunda (bridge.engine). Arayüz yalnız durum, çizim ve etkileşimi yönetir. */
import { t as L, tr as LM, locale, getLang, setLang, has as hasKey } from "./i18n.js";
import * as B from "./bridge.js";
import { PlanCanvas, moduleRect, fmt } from "./plan.js";
import { View3D } from "./view3d.js";
import * as N from "./names.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tl = (v) => `${fmt(v, 2)} ₺`;
const STEPS = ["model", "katlar", "plan", "uc", "ozet"];

const S = {
  scene: null, json: "", catalog: null, view: "model", storey: 1, counts: {}, level: "L0",
  undo: [], q: Promise.resolve(), lastRender: null, atm: "gunduz", v3: { mode: "dis", levels: "all", cut: false },
  camSet: false, dirty3d: true, unit: "m", wallT: 100, paintMat: "parke-ceviz", paint: { sys: "ral-classic", group: "*", q: "", target: "duvar", ral: null }, libGroup: "*", libQ: "", matCat: "zemin", keepRatio: false, motor: "perde", motorParams: null, motorTimer: null, sky: null, proj: null, ref: null, photo: null, engine: "internal", cycles: null, ph: { models: null, textures: null, cat: "seating", q: "", tcat: "floor", tq: "", busy: new Set(), thumbs: {}, loading: {}, error: {} }, exposure: null, pendingCam: null, saved: null, savedScene: null, elevSide: "on", sel3: null, texSig: "", thumbs: {}, saveTimer: null, checkTimer: null,
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
  if (!prev) { toast(L("app.geri_alinacak_adim_yok"), { kind: "warn" }); return; }
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
      st.lastElementChild.textContent = L("app.otomatik_kaydedildi");
    } catch (e) {
      st.lastElementChild.textContent = L("app.otomatik_kayit_basarisiz");
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
  $("#stdLine").textContent = `${L("app.dis_duvar_cm_ic_bolme_cm_net_ic_cm_dis", { p: fmt(st.exterior_wall / 10, 1), p2: fmt(st.partition / 10, 0), p3: fmt(st.net_height / 10, 0), p4: fmt((st.bottom_slab + st.net_height + st.top_slab + st.parapet) / 10, 0) })}`;
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
  if (v === "kutuphane") { renderLibrary(); renderPhModels(); }
  if (v === "kaplama") { renderMaterials(); renderPaints(); renderPhTextures(); }
  if (v === "motor") renderMotor();
  if (v === "referans") renderReference();
  if (v === "foto") renderPhoto();
  if (v === "karsilama") renderWelcome();
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
  $("#sideInfo").innerHTML = `<span>${L("model.modul")}</span><b>${L("app.m2_dis", { length: s.modules.length, p: fmt(outer, 0) })}</b><span>${L("app.net_mahal_alani")}</span><b>${fmt(area)} m²</b><span>${L("plan.kat")}</span><b>${s.levels.length}</b>`;
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
      <div><div class="uh-mod__size">4 × ${m.length}</div><div class="uh-mod__meta">${L("app.m2_uzun_kenar_m_perde_m_acilabilir_m", { area_m2: m.area_m2, p: fmt(m.pier_m, 1), p2: fmt(m.open_m, 1), p3: fmt(m.pier_m, 1) })}</div></div>
      <div class="uh-stepper"><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-dec="${m.length}" aria-label="4 × ${m.length} azalt">−</button><output aria-live="polite">${n}</output><button class="pl-btn pl-btn--primary pl-btn--sm" type="button" data-inc="${m.length}" aria-label="${L("app.4_artir", { length: m.length })}">+</button></div>
      <div class="uh-mod__pier" aria-hidden="true"><i class="is-pier" style="width:${(m.pier_m / tot) * 100}%"></i><i class="is-open" style="width:${(m.open_m / tot) * 100}%"></i><i class="is-pier" style="width:${(m.pier_m / tot) * 100}%"></i></div>
    </div>`;
  }).join("");
  const count = Object.values(S.counts).reduce((a, b) => a + b, 0);
  const area = Object.entries(S.counts).reduce((a, [l, n]) => a + l * 4 * n, 0);
  $("#kpiModules").textContent = count;
  $("#kpiArea").textContent = `${area} m²`;
  $("#kpiStorey").textContent = S.storey === 2 ? L("model.iki_katli") : L("model.tek_katli");
  $$(".uh-choice").forEach((b) => { const on = Number(b.dataset.storey) === S.storey; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on); });
}

/* ---------- 2 · Katlar ---------- */
function floorSeg(el, onPick) {
  const levels = S.scene.levels.map((l) => l.id).sort();
  if (S.storey === 2 && !levels.includes("L1")) levels.push("L1");
  el.innerHTML = levels.map((id) => `<button type="button" role="tab" data-l="${id}" class="${id === S.level ? "is-active" : ""}">${id === "L0" ? L("app.zemin_kat_kisa") : `${L("app.kat", { p: id.slice(1) })}`}</button>`).join("");
  el.onclick = (e) => { const b = e.target.closest("button"); if (b) onPick(b.dataset.l); };
}
function renderKatlar() {
  floorSeg($("#floorSegK"), (l) => { S.level = l; K.setLevel(l); renderKatlar(); });
  K.setLevel(S.level);
  K.setScene(S.scene);
  const floor = Number(S.level.slice(1));
  const mods = S.scene.modules.filter((m) => m.floor === floor);
  const area = mods.reduce((a, m) => { const b = m.on ? S.scene.modules.find((g) => g.id === m.on) || m : m; return a + b.length * 4; }, 0);
  $("#floorStats").innerHTML = `<dt>${L("app.alan_dis")}</dt><dd>${area} m²</dd><dt>${L("model.modul")}</dt><dd>${mods.length}</dd><dt>${L("app.net_mahal_alani")}</dt><dd>${fmt(netArea(S.scene.levels.find((l) => l.id === S.level) || { rooms: [] }))} m²</dd>`;
  $("#upperGroup").hidden = S.storey !== 2;
  $("#upperList").innerHTML = S.scene.modules.filter((m) => m.floor === 0).map((m) => {
    const on = S.scene.modules.some((u) => u.floor === 1 && u.on === m.id);
    return `<label class="uh-check"><input type="checkbox" data-upper="${m.id}" ${on ? "checked" : ""}> ${m.id} · 4×${m.length}</label>`;
  }).join("") || `<p class="uh-small">${L("app.once_zemin_modulu_ekleyin")}</p>`;
  $("#btnRotate").disabled = !(K.sel && K.sel.type === "module" && S.level === "L0");
}

/* ---------- 3 · İç plan ---------- */
const PLAN_TOOLS = () => {
  const f = S.catalog.furniture;
  const cat = (ids) => ids.map((id) => f.find((x) => x.id === id)).filter(Boolean).map((x) => ({ type: "furniture", value: x.id, label: N.catName(x) }));
  return [
    { title: L("app.1_yapi_araclari"), items: [{ type: "select", label: L("app.sec_tasi") }, { type: "wall", label: L("app.duvar_ciz") }, { type: "measure", label: L("app.olcu_araci") }, { type: "furniture", value: "kolon", label: L("app.kolon") }, { type: "furniture", value: "merdiven", label: L("app.merdiven") }], extra: `<div class="pl-segment" role="radiogroup" aria-label="${L("app.duvar_kalinligi")}">${[[100, "10 cm"], [125, "12,5 cm"], [200, "20 cm"]].map(([v, l]) => `<button type="button" data-wt="${v}" class="${S.wallT === v ? "is-active" : ""}">${l}</button>`).join("")}</div><button class="uh-tool uh-tool--wide uh-mt" type="button" data-act="undo-wall">${L("app.son_duvari_geri_al")}</button><button class="uh-tool uh-tool--wide" type="button" data-act="clear-walls">${L("app.ic_duvarlari_arsivle")}</button><p class="uh-small">${L("app.duvar_iki_noktaya_tiklayin_90_hizali_10")}</p>` },
    { title: L("app.2_oda_mahal"), items: S.catalog.roomKinds.map((k) => ({ type: "room", value: k.id, label: N.roomKindName(k) })), extra: `<p class="uh-small">${L("app.turu_secin_sonra_duvarlarla_cevrili")}</p>` },
    { title: L("app.3_kapi"), items: S.catalog.openings.filter((o) => o.kind === "door").map((o) => ({ type: "opening", value: o.id, label: N.openingName(o) })) },
    { title: L("app.4_standart_pencereler"), items: S.catalog.openings.filter((o) => o.kind === "window").map((o) => ({ type: "opening", value: o.id, label: N.openingName(o).replace(/^\D+/, "") })), extra: `<p class="uh-small">${L("app.tasiyici_perdeye_kapi_pencere_konamaz")}</p>` },
    { title: L("app.5_mutfak"), items: cat(["alt-dolap", "boy-dolabi", "tezgah", "ada", "evye", "ocak", "buzdolabi", "mutfak-tezgahi"]) },
    { title: L("app.6_banyo"), items: cat(["dus-kabini", "klozet", "lavabo", "camasir"]) },
    { title: L("app.7_mobilya"), items: cat(["cift-yatak", "tek-yatak", "komodin", "gardirop", "kanepe-3", "berjer", "orta-sehpa", "yemek-masasi", "sandalye", "tv-unitesi", "calisma-masasi", "kitaplik", "ayakkabilik", "hali", "bitki", "sarkit-lamba", "merdiven"]), extra: `<p class="uh-small">${L("app.merdiven_zemin_kata_yerlestirilir_ust")}</p>` },
    { title: L("app.8_aydinlatma_elektronik_dis_mekan"), items: cat(["avize", "lambader", "ankastre-spot", "aplik", "tv-55", "tablo-yatay", "agac", "cali", "cim-alan", "bahce-lambasi"]), extra: `<button class="uh-tool uh-tool--wide uh-mt" type="button" data-view="motor">${L("app.perde_hali_yatak_havuz_tasarla")}</button><p class="uh-small">${L("app.tum_urunler_urun_kutuphanesindedir")}</p>` },
    { title: L("app.9_dis_cephe_kaplama"), items: [{ type: "clad", value: "kaplama-tas", label: L("app.tas") }, { type: "clad", value: "kaplama-ahsap", label: L("app.ahsap") }, { type: "clad", value: "kaplama-kompozit", label: L("app.aluminyum_kompozit") }, { type: "clad", value: "", label: L("app.kaplamayi_kaldir") }], extra: `<p class="uh-small">${L("app.kaplama_secin_sonra_plandaki_dis_cephe")}</p>` },
    { title: L("app.10_dis_cephe_boyasi"), swatches: "facade" },
    { title: L("app.11_kaplama_uygula"), items: [{ type: "paint", value: S.paintMat, label: L("app.kaplamayi_uygula") }], extra: (() => { const m = S.scene.materials.find((x) => x.id === S.paintMat); return `<div class="uh-paintnow">${m ? `<span class="pl-swatch" style="background:${rgb(m.color)}" aria-hidden="true"></span>${esc(N.matName(m))}` : ""}</div><button class="uh-tool uh-tool--wide uh-mt" type="button" data-view="kaplama">${L("app.kaplama_kutuphanesini_ac")}</button><button class="uh-tool uh-tool--wide" type="button" data-view="kutuphane">${L("app.urun_kutuphanesini_ac")}</button><p class="uh-small">${L("app.mahale_tiklayinca_zemin_duvara")}</p>`; })() },
    { title: L("app.12_revizyon_notu"), items: [{ type: "note", label: L("app.plana_not_ekle") }] },
  ];
};
function toolLabel(t) {
  if (t.type === "select") return L("app.sec_tasi");
  if (t.type === "wall") return `${L("app.cm_duvar_ciz", { p: fmt(S.wallT / 10, S.wallT % 10 ? 1 : 0) })}`;
  if (t.type === "measure") return L("app.olcu_araci");
  if (t.type === "paint") return `${L("app.kaplama", { p: N.matName(S.scene.materials.find((m) => m.id === t.value)) })}`;
  if (t.type === "room") return `${L("app.mahal", { p: N.roomKindName(S.catalog.roomKinds.find((k) => k.id === t.value) || { id: "", label: "" }) })}`;
  if (t.type === "opening") { const o = S.catalog.openings.find((x) => x.id === t.value); return o ? N.openingName(o) : ""; }
  if (t.type === "furniture") { const f = S.catalog.furniture.find((x) => x.id === t.value); return f ? N.catName(f) : ""; }
  if (t.type === "clad") return t.value ? `${L("app.kaplama", { p: N.matName(S.scene.materials.find((m) => m.id === t.value)).split("· ").pop() })}` : L("app.kaplamayi_kaldir");
  if (t.type === "note") return L("note.revizyon_notu");
  return "";
}
function buildTools() {
  const el = $("#toolPanel");
  const open = new Set($$("details", el).filter((d) => d.open).map((d) => d.dataset.k));
  const first = !el.childElementCount;
  el.innerHTML = PLAN_TOOLS().map((g, i) => {
    let body = "";
    if (g.items) body = `<div class="uh-toolgrid">${g.items.map((t) => `<button ${t.type === "furniture" ? `draggable="true" data-drag-item="${t.value}"` : ""} class="uh-tool ${P.tool.type === t.type && (P.tool.value || "") === (t.value || "") ? "is-active" : ""}" type="button" data-tool='${esc(JSON.stringify({ type: t.type, value: t.value }))}'>${esc(t.label)}</button>`).join("")}</div>`;
    if (g.swatches === "facade") body = swatches("dis-", S.scene.facade, "facade");
    return `<details class="uh-toolsec" data-k="${i}" ${first ? (i < 4 ? "open" : "") : open.has(String(i)) ? "open" : ""}><summary>${esc(g.title)}</summary>${body}${g.extra || ""}</details>`;
  }).join("");
}
function swatches(prefix, current, kind) {
  const mats = S.scene.materials.filter((m) => m.id.startsWith(prefix) || (kind === "facade" && m.id === "beton-kabuk"));
  return `<div class="pl-swatches uh-mt" role="radiogroup">${mats.map((m) => `<button type="button" class="pl-swatch ${m.id === current ? "is-selected" : ""}" role="radio" aria-checked="${m.id === current}" title="${esc(N.matName(m))}" aria-label="${esc(N.matName(m))}" data-swatch="${kind}" data-id="${m.id}" style="background:${rgb(m.color)}"></button>`).join("")}</div>`;
}
function renderPlan() {
  floorSeg($("#floorSegP"), (l) => { S.level = l; P.setLevel(l); renderPlan(); });
  P.setLevel(S.level);
  P.setScene(S.scene);
  buildTools();
  $("#activeTool").textContent = `${L("app.aktif", { p: toolLabel(P.tool) })}`;
  renderInspector();
  const level = S.scene.levels.find((l) => l.id === S.level) || { rooms: [] };
  const counters = ["tezgah", "alt-dolap", "evye", "ocak", "ada", "boy-dolabi", "mutfak-tezgahi"];
  const counter = S.scene.objects.filter((o) => o.level === S.level && counters.includes(o.mesh.slice(4))).reduce((a, o) => a + (S.catalog.furniture.find((f) => f.id === o.mesh.slice(4))?.size[0] || 0) * o.scale[0], 0);
  $("#liveStats").innerHTML = `<dt>${L("app.kat_net_alani")}</dt><dd>${fmt(netArea(level))} m²</dd><dt>${L("app.kapali_alan")}</dt><dd>${L("app.mahal_2", { length: level.rooms.length })}</dd><dt>${L("app.tezgah_uzunlugu")}</dt><dd>${fmt(counter / 1000)} m</dd><dt>${L("note.revizyon_notu")}</dt><dd>${L("app.adet", { length: (S.scene.notes || []).length })}</dd>`;
  const st = S.scene.standard;
  $("#stdTable").innerHTML = [[L("app.dis_duvar"), st.exterior_wall], [L("app.ic_bolme"), st.partition], [L("app.ic_net"), st.net_height], [L("app.alt_doseme"), st.bottom_slab], [L("app.ust_doseme"), st.top_slab], [L("app.parapet"), st.parapet], [L("app.dis_toplam"), st.bottom_slab + st.net_height + st.top_slab + st.parapet]].map(([k, v]) => `<tr><td>${k}</td><td class="is-num">${fmt(v / 10, 1)} cm</td></tr>`).join("");
  clearTimeout(S.checkTimer);
  S.checkTimer = setTimeout(async () => {
    try {
      const c = await B.engine("check", { scene: S.scene });
      $("#liveCheck").innerHTML = c.length ? c.slice(0, 6).map((x) => `<div class="uh-checkitem is-${x.level}"><b>${x.level === "hata" ? L("app.hata") : L("app.uyari")}</b>${esc(LM(x.text))}</div>`).join("") : `<div class="uh-checkitem is-ok"><b>${L("app.tamam")}</b>${L("app.su_an_gorunur_bir_kullanim_cakismasi_yok")}</div>`;
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
const innerMats = () => S.scene.materials.filter((m) => ["duvar", "ic-boya", "zemin"].includes(m.category) || m.id.startsWith("ozel-"));
const outerMats = () => S.scene.materials.filter((m) => ["kaplama", "cephe", "kabuk"].includes(m.category));
const matSelect = (f, list, cur, none, disabled = false) => `<select class="pl-select" data-f="${f}" ${disabled ? "disabled" : ""}><option value="">${none}</option>${list.map((m) => `<option value="${m.id}" ${cur === m.id ? "selected" : ""}>${esc(N.matName(m))}</option>`).join("")}</select>`;
const ralCss = (code) => { const c = (S.paint.ral || []).find((x) => x.code === code); return c ? c.hex : "transparent"; };
const field = (label, html) => `<label class="pl-field"><span class="pl-field__label">${label}</span>${html}</label>`;
function renderInspector() {
  const box = $("#inspector");
  const it = selected();
  $("#btnArchiveSel").disabled = !it || !it.o;
  if (!it || !it.o) { box.innerHTML = `<p class="uh-small">${L("plan.bir_duvar_oda_kapi_pencere_veya_nesneye")}</p>`; return; }
  const o = it.o;
  if (it.sel.type === "object") {
    const cat = S.catalog.furniture.find((f) => f.id === o.mesh.slice(4));
    const size = cat ? cat.size : [0, 0, 0];
    const bd = baseDims(o);
    const mats = S.scene.materials.filter((m) => ["mobilya", "tekstil", "metal", "zemin", "genel", "ice-aktarilan"].includes(m.category) || m.id.startsWith("ozel-"));
    box.innerHTML = `<div class="uh-stats"><dt>${L("common.tur")}</dt><dd>${esc(cat ? cat.group : L("app.ice_aktarilan_model"))}</dd><dt>${L("app.olcek")}</dt><dd>%${fmt(o.scale[0] * 100, 0)} · %${fmt(o.scale[2] * 100, 0)} · %${fmt(o.scale[1] * 100, 0)}</dd></div>
      ${field(L("common.ad"), `<input class="pl-input" data-f="name" value="${esc(o.name)}">`)}
      <div class="pl-label">${L("app.boyutlandirma_cm")}</div>
      <div class="uh-dims">${field(L("app.genislik"), `<input class="pl-input" type="number" step="5" min="1" data-f="w" value="${Math.round(bd[0] * o.scale[0] / 10)}">`)}${field(L("app.derinlik"), `<input class="pl-input" type="number" step="5" min="1" data-f="d" value="${Math.round(bd[1] * o.scale[2] / 10)}">`)}${field(L("app.yukseklik"), `<input class="pl-input" type="number" step="5" min="1" data-f="h" value="${Math.round(bd[2] * o.scale[1] / 10)}">`)}</div>
      <label class="uh-check"><input type="checkbox" data-f="keep" ${S.keepRatio ? "checked" : ""}> ${L("app.orani_koru_birlikte_olcekle")}</label>
      <div class="uh-row">${field(L("app.aci"), `<input class="pl-input" type="number" step="15" data-f="rot" value="${Math.round(o.rotation)}">`)}${field(L("app.zeminden_cm"), `<input class="pl-input" type="number" step="5" min="0" data-f="z" value="${Math.round(o.position[2] / 10)}">`)}</div>
      <div class="uh-row">${field("X (m)", `<input class="pl-input" type="number" step="0.05" data-f="x" value="${(o.position[0] / 1000).toFixed(2)}">`)}${field("Y (m)", `<input class="pl-input" type="number" step="0.05" data-f="y" value="${(o.position[1] / 1000).toFixed(2)}">`)}</div>
      ${field(L("app.kaplama_2"), `<select class="pl-select" data-f="mat"><option value="">${L("uc.varsayilan")}</option>${mats.map((m) => `<option value="${m.id}" ${o.material === m.id ? "selected" : ""}>${esc(N.matName(m))}</option>`).join("")}</select>`)}
      <div class="uh-row">${field(L("app.adet_2"), `<input class="pl-input" type="number" step="1" min="1" max="99" data-f="qty" value="${o.quantity || 1}">`)}${field(L("fonksiyon.birim_fiyat"), `<input class="pl-input" type="number" step="100" min="0" data-f="price" value="${o.price}">`)}</div>
      <div class="uh-row uh-wrap"><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-act="rot">↻ 90°</button><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-act="dup">${L("uc.cogalt")}</button><button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-act="reset-size">${L("app.varsayilan_olcu")}</button><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("uc.arsivle")}</button></div>
      <p class="uh-small">${L("app.planda_kose_tutamaklarini_surukleyerek")}</p>`;
  } else if (it.sel.type === "opening") {
    const w = it.level.walls.find((x) => x.id === o.wall);
    box.innerHTML = `<div class="uh-stats"><dt>${L("common.tur")}</dt><dd>${o.kind === "door" ? L("app.kapi") : L("app.pencere")}</dd><dt>${L("app.olcu")}</dt><dd>${fmt(o.width / 10, 0)}×${fmt(o.height / 10, 0)} cm</dd><dt>${L("foto.duvar")}</dt><dd>${esc(o.wall)} · ${fmt((Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])) / 1000)} m</dd></div>
      ${field(L("app.duvar_basindan_uzaklik_m"), `<input class="pl-input" type="number" step="0.05" min="0" data-f="offset" value="${(o.offset / 1000).toFixed(2)}">`)}
      ${o.kind === "door" ? field(L("app.kapi_acilimi"), `<select class="pl-select" data-f="swing">${[["sol-ice", L("app.sol_mentese_ice")], ["sag-ice", L("app.sag_mentese_ice")], ["sol-disa", L("app.sol_mentese_disa")], ["sag-disa", L("app.sag_mentese_disa")]].map(([v, l]) => `<option value="${v}" ${o.swing === v ? "selected" : ""}>${l}</option>`).join("")}</select>`) : field(L("app.parapet_alt_kot_cm"), `<input class="pl-input" type="number" step="5" min="0" data-f="sill" value="${Math.round(o.sill / 10)}" ${o.height >= 2350 ? "disabled" : ""}>`)}
      <div class="uh-row"><button class="pl-btn pl-btn--primary pl-btn--sm" type="button" data-act="apply-opening">${L("app.olcuyu_uygula")}</button><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("uc.arsivle")}</button></div>`;
  } else if (it.sel.type === "wall") {
    const len = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
    const kind = o.structural ? L("app.tasiyici_perde_beton_degistirilemez") : o.generated ? (o.exterior ? L("app.modul_dis_duvari") : L("app.modul_birlesim_duvari")) : L("app.ic_bolme");
    box.innerHTML = `<div class="uh-stats"><dt>${L("common.tur")}</dt><dd>${kind}</dd><dt>${L("app.uzunluk")}</dt><dd>${fmt(len / 1000)} m</dd><dt>${L("app.kalinlik")}</dt><dd>${fmt(o.thickness / 10, 1)} cm</dd></div>
      ${o.exterior ? field(L("app.dis_yuz"), matSelect("outer", outerMats(), o.outer, L("app.cephe_boyasi_genel"))) : ""}
      ${field(L("app.ic_yuz_kaplamasi"), matSelect("wmat", innerMats(), o.material, L("app.ic_cephe_boyasi_genel")))}
      ${!o.exterior ? field(L("boya.b_yuzu"), matSelect("outer", innerMats(), o.outer, L("boya.a_yuzu_ile_ayni"))) : ""}
      <details class="uh-details" ${o.lower ? "open" : ""}><summary>${L("boya.kombine_boya")}</summary>
        ${field(L("boya.alt_bolge"), matSelect("lower", innerMats(), o.lower, L("boya.tek_renk")))}
        ${field(L("boya.ayirma_yuksekligi_cm"), `<input class="pl-input" type="number" step="5" min="0" max="400" data-f="split" value="${o.split ? Math.round(o.split / 10) : 90}" ${o.lower ? "" : "disabled"}>`)}
        ${field(L("boya.serit"), matSelect("band", innerMats(), o.band, L("boya.serit_yok"), !o.lower))}
        ${field(L("boya.serit_yuksekligi_cm"), `<input class="pl-input" type="number" step="1" min="1" max="60" data-f="band_h" value="${o.band_h ? Math.round(o.band_h / 10) : 6}" ${o.lower && o.band ? "" : "disabled"}>`)}
        <div class="uh-row uh-wrap">${[["9010", "7016"], ["9001", "6021"], ["1013", "5014"]].map(([u, d]) => `<button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-act="two-tone" data-up="${u}" data-down="${d}"><span class="pl-swatch" style="background:${ralCss(u)}" aria-hidden="true"></span><span class="pl-swatch" style="background:${ralCss(d)}" aria-hidden="true"></span> RAL ${u} / ${d}</button>`).join("")}</div>
        <p class="uh-small">${L("boya.kombine_ipucu")}</p>
      </details>
      ${!o.generated ? field(L("app.kalinlik_cm"), `<input class="pl-input" type="number" step="0.5" min="5" max="40" data-f="thick" value="${o.thickness / 10}">`) : ""}
      ${!o.generated ? `<button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("uc.arsivle")}</button>` : `<p class="uh-small">${L("app.modul_duvarlari_modulle_birlikte_degisir")}</p>`}`;
  } else if (it.sel.type === "room") {
    const a = netArea({ rooms: [o] });
    const xs = o.polygon.map((p) => p[0]), ys = o.polygon.map((p) => p[1]);
    box.innerHTML = `<div class="uh-stats"><dt>${L("app.net_alan")}</dt><dd>${fmt(a)} m²</dd><dt>${L("app.net_olcu")}</dt><dd>${fmt((Math.max(...xs) - Math.min(...xs)) / 1000)} × ${fmt((Math.max(...ys) - Math.min(...ys)) / 1000)} m</dd></div>
      ${field(L("app.mahal_adi"), `<input class="pl-input" data-f="rname" value="${esc(o.name)}">`)}
      ${field(L("common.tur"), `<select class="pl-select" data-f="kind">${S.catalog.roomKinds.map((k) => `<option value="${k.id}" ${o.kind === k.id ? "selected" : ""}>${k.label}</option>`).join("")}</select>`)}
      ${field(L("app.zemin_kaplamasi"), `<select class="pl-select" data-f="floor">${S.scene.materials.filter((m) => m.category === "zemin").map((m) => `<option value="${m.id}" ${o.floor === m.id ? "selected" : ""}>${esc(N.matName(m))}</option>`).join("")}</select>`)}
      <button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("app.mahal_adini_arsivle")}</button>`;
  } else if (it.sel.type === "dimension") {
    box.innerHTML = `<div class="uh-stats"><dt>${L("common.tur")}</dt><dd>${L("app.olcu_cizgisi")}</dd><dt>${L("app.uzunluk")}</dt><dd>${fmt(Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]) / 1000)} m</dd></div><button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("uc.arsivle")}</button>`;
  } else if (it.sel.type === "note") {
    box.innerHTML = `${field(L("app.not"), `<input class="pl-input" data-f="note" value="${esc(o.text)}" maxlength="200">`)}<button class="pl-btn pl-btn--danger pl-btn--sm" type="button" data-act="archive">${L("uc.arsivle")}</button>`;
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
  } else if (it.sel.type === "wall" && ["lower", "split", "band", "band_h"].includes(f)) {
    const w = level.walls.find((x) => x.id === it.o.id);
    if (f === "lower") { w.lower = v; if (v && !w.split) w.split = 900; if (!v) { w.split = 0; w.band = ""; w.band_h = 0; } }
    if (f === "split") w.split = Math.max(50, Math.min(4000, (Number(v) || 90) * 10));
    if (f === "band") { w.band = v; w.band_h = v ? w.band_h || 60 : 0; }
    if (f === "band_h") w.band_h = Math.max(10, Math.min(600, (Number(v) || 6) * 10));
    commit(s);
    renderInspector();
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
  toast(L("app.aciklik_guncellendi"));
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
    if (it.o.generated) { toast(L("app.modul_duvarlari_arsivlenemez"), { kind: "warn" }); return; }
    level.walls = level.walls.filter((x) => x.id !== it.o.id);
    const gone = level.openings.filter((o) => o.wall === it.o.id);
    level.openings = level.openings.filter((o) => o.wall !== it.o.id);
    put({ wall: it.o, openings: gone });
    P.sel = null;
    run(async () => { const r = await B.engine("refresh", { scene: s }); commit(r.scene); toast(L("app.bolme_arsivlendi"), { action: L("top.geri_al"), onAction: undo }); });
    return;
  }
  P.sel = null;
  commit(s);
  toast(L("app.arsivlendi"), { action: L("top.geri_al"), onAction: undo });
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
  if (kind === "wall_moved") return run(async () => { const r = await B.engine("refresh", { scene: S.scene }); commit(r.scene); if (r.roomWarnings.length) toast(LM(r.roomWarnings[0]), { kind: "warn", action: L("top.geri_al"), onAction: undo }); });
  if (kind === "dimension") { const s = clone(); s.dimensions = s.dimensions || []; s.dimensions.push({ id: nextId("Ö", s.dimensions), level: S.level, a: d.a, b: d.b }); commit(s); return; }
  if (kind === "paint") {
    if (!d.hit) { toast(L("app.bir_mahale_duvara_ya_da_nesneye_tiklayin"), { kind: "warn" }); return; }
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
  if (kind === "room") return run(async () => { const r = await B.engine("name_room", { scene: S.scene, level: S.level, point: d.point, kind: d.kind }); commit(r.scene); toast(`${L("app.olusturuldu", { name: N.roomName(r.extra.room, S.catalog.roomKinds) })}`); });
  if (kind === "opening") return run(async () => { const r = await B.engine("place_opening", { scene: S.scene, level: S.level, point: d.point, std: d.std }); commit(r.scene); });
  if (kind === "furniture") {
    const it = S.catalog.furniture.find((f) => f.id === d.cat);
    if (it.id === "merdiven" && S.level !== "L0") { toast(L("app.merdiven_yalniz_zemin_kata_yerlestirilir"), { kind: "warn" }); return; }
    const s = clone();
    const z = it.mount === -2 ? s.standard.net_height - it.size[2] - 2 : it.mount < 0 ? s.standard.net_height - 900 : it.mount;
    s.objects.push({ id: nextId("N", s.objects), name: it.name, mesh: `cat:${it.id}`, level: S.level, position: [d.point[0], d.point[1], z], rotation: 0, scale: [1, 1, 1], material: null, price: it.price, quantity: 1 });
    commit(s);
    return;
  }
  if (kind === "clad") {
    const s = clone();
    const w = s.levels.find((l) => l.id === S.level).walls.find((x) => x.id === d.wall);
    if (!w || !w.exterior) { toast(L("app.kaplama_yalniz_dis_cephe_duvarlarina"), { kind: "warn" }); return; }
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
    $("#view3dInfo").textContent = L("app.sahne_hazirlaniyor");
    const sig = JSON.stringify([S.scene.materials.map((x) => [x.id, x.texture, x.texture_scale, x.color]), S.scene.textures.map((x) => x.id)]);
    if (sig !== S.texSig) { S.texSig = sig; V.setTextures(await B.engine("texture_tiles", { scene: S.scene })); }
    const m = await B.engine("mesh", { scene: S.scene, options: meshOptions() });
    V.setMesh(m);
    update3dSelection();
    $("#quick3d").innerHTML = ["kanepe-3", "berjer", "yemek-masasi", "cift-yatak", "gardirop", "lambader", "avize", "tv-55", "bitki", "agac", "sezlong", "bahce-lambasi"].map((id) => S.catalog.furniture.find((f) => f.id === id)).filter(Boolean).map((f) => `<button class="uh-tool" type="button" draggable="true" data-drag-item="${f.id}">${esc(f.name)}</button>`).join("");
    if (!S.camSet) { S.camSet = true; await camera(S.v3.mode === "ic" ? "ic" : "perspektif"); }
    if (S.pendingCam) { const c = S.pendingCam; S.pendingCam = null; await camera(c); }
  });
}
async function camera(name) {
  if (typeof name === "object") { S.proj = null; V.setCamera(name); return; }
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
function lookSettings() {
  // stil seçilmezse motor "default" stilini kullanır
  return { style: $("#selStyle").value || "default", aperture: Number($("#selAperture").value) };
}
async function cyclesState() {
  const st = await B.cyclesStatus();
  S.cycles = st;
  const on = S.engine === "cycles";
  $("#btnCyclesPath").hidden = !on || !B.isDesktop;
  $("#cyclesState").textContent = !on ? "" : st.browser ? L("app.cycles_tarayicida_yok") : st.available ? `${L("app.cycles_hazir", { path: st.path })} ${L("app.cycles_aciklama")}` : L("app.cycles_yok");
}
async function doRenderCycles(w, h, spp, settings) {
  if (!B.isDesktop) { toast(L("app.cycles_tarayicida_yok"), { kind: "warn" }); return; }
  if (!S.cycles || !S.cycles.available) { await cyclesState(); if (!S.cycles.available) { toast(L("app.cycles_yok"), { kind: "warn" }); return; } }
  const ov = $("#renderOverlay");
  ov.hidden = false;
  $("#btnRenderCancel").hidden = false;
  $("#renderMsg").textContent = L("app.cycles_render_suruyor", { w, h, spp });
  $("#btnRender").classList.add("is-loading");
  const t0 = performance.now();
  try {
    const png = await B.cyclesRender({ scene: S.scene, atmosphere: S.atm, settings }, (p) => {
      if (p.sample) $("#renderMsg").textContent = L("app.cycles_ilerleme", { sample: p.sample, total: p.total });
    });
    S.lastRender = png;
    $("#renderImg").src = `data:image/png;base64,${png}`;
    $("#renderCap").textContent = `Cycles · ${w}×${h} · ${spp} · ${fmt((performance.now() - t0) / 1000, 1)} s`;
    $("#renderFig").hidden = false;
    toast(L("app.render_hazir_cycles"));
  } catch (e) {
    toast(e.message, { kind: "error" });
  } finally {
    ov.hidden = true;
    $("#btnRenderCancel").hidden = true;
    $("#btnRender").classList.remove("is-loading");
  }
}
async function doRender() {
  const [w, h] = $("#selRes").value.split("x").map(Number);
  const spp = Number($("#selSpp").value);
  if (S.engine === "cycles") {
    const cam = V.getCamera();
    const n = Math.max(spp * 4, 128);
    await doRenderCycles(w, h, n, { width: w, height: h, samples: n, bounces: 10, eye: cam.eye, target: cam.target, fov: cam.fov, exposure: S.exposure || 0.62, projection: S.proj || "perspective", ortho_height: S.proj ? cam.orthoHeight : null, sky: skySettings(), mesh: meshOptions(), ...lookSettings() });
    return;
  }
  if (!B.isDesktop && w > 1920) { toast(L("app.4k_ve_8k_cikti_masaustu_uygulamasinda"), { kind: "warn", sub: L("app.tarayici_onizlemesi_tek_cekirdek_ve") }); return; }
  const ov = $("#renderOverlay");
  ov.hidden = false;
  $("#renderMsg").textContent = `${L("app.render_aliniyor_ornek", { w, h, spp, p: B.isDesktop ? L("app.tum_islemci_cekirdekleri_kullaniliyor") : L("app.tarayici_onizlemesinde_tek_cekirdek") })}`;
  $("#btnRender").classList.add("is-loading");
  try {
    const cam = V.getCamera();
    const r = await B.engine("render", { scene: S.scene, atmosphere: S.atm, settings: { width: w, height: h, samples: spp, bounces: spp >= 128 ? 6 : 4, eye: cam.eye, target: cam.target, fov: cam.fov, exposure: S.exposure || 0.62, projection: S.proj || "perspective", ortho_height: S.proj ? cam.orthoHeight : null, sky: skySettings(), mesh: meshOptions(), denoise: true, ...lookSettings() } });
    S.lastRender = r.png;
    $("#renderImg").src = `data:image/png;base64,${r.png}`;
    $("#renderCap").textContent = `${L("app.ornek_ucgen_is_parcacigi", { width: r.width, height: r.height, samples: r.samples, p: r.triangles.toLocaleString(locale()), threads: r.threads, p2: r.ms ? ` ${L("app.sn", { p: fmt(r.ms / 1000, 1) })}` : "" })}`;
    $("#renderFig").hidden = false;
    toast(L("app.render_hazir"));
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
  $("#sumKpis").innerHTML = `<div class="pl-kpi"><div class="pl-label">${L("app.net_mahal_alani")}</div><div class="pl-kpi__value">${fmt(t.floor_area_m2)} m²</div></div>
    <div class="pl-kpi"><div class="pl-label">${L("app.modul_kat")}</div><div class="pl-kpi__value">${S.scene.modules.length} / ${S.scene.levels.length}</div></div>
    <div class="pl-kpi"><div class="pl-label">${L("app.kapi_pencere")}</div><div class="pl-kpi__value">${t.doors} · ${t.windows}</div></div>
    <div class="pl-kpi pl-kpi--highlight"><div class="pl-label">${L("app.tahmini_toplam", { tier: N.tierName(est.tier) })}</div><div class="pl-kpi__value is-money">${tl(est.total)}</div></div>`;
  $("#checkList").innerHTML = chk.length ? chk.map((x) => `<div class="uh-checkitem is-${x.level}"><b>${x.level === "hata" ? L("app.hata") : L("app.uyari")}</b>${esc(LM(x.text))}</div>`).join("") : `<div class="uh-checkitem is-ok"><b>✓</b>${L("app.son_proje_kontrolu_tamamlandi")}</div>`;
  $("#sumRooms").innerHTML = `<thead><tr><th>${L("app.mahal_3")}</th><th>${L("plan.kat")}</th><th class="is-num">${L("app.net_m2")}</th><th class="is-num">${L("app.pencere")}</th></tr></thead><tbody>${m.report.rooms.map((r) => `<tr><td class="is-strong">${esc(N.roomName(r, S.catalog.roomKinds))}</td><td>${r.level === "L0" ? L("app.zemin_kat_kisa") : L("app.kat", { p: r.level.slice(1) })}</td><td class="is-num">${fmt(r.area_m2)}</td><td class="is-num">${r.windows}</td></tr>`).join("")}</tbody>`;
  const img = $("#sumRender");
  img.hidden = !S.lastRender;
  if (S.lastRender) img.src = `data:image/png;base64,${S.lastRender}`;
}

/* ---------- Ölçü ---------- */
const UNITS = { m: [1, "m", 1, "m²"], cm: [100, "cm", 1, "m²"], mm: [1000, "mm", 1, "m²"], ft: [3.28084, "ft", 10.7639, "ft²"], in: [39.3701, "in", 10.7639, "ft²"] };
async function renderMeasure() {
  const r = await B.engine("measure", { scene: S.scene });
  const [lf, lu, af, au] = UNITS[S.unit];
  const LEN = (v) => `${fmt(v * lf, S.unit === "mm" ? 0 : 2)} ${lu}`;
  const A = (v) => `${fmt(v * af)} ${au}`;
  const t = r.report.totals;
  $("#mKpis").innerHTML = [[L("app.net_zemin_alani"), A(t.floor_area_m2)], [L("app.brut_alan"), A(t.gross_area_m2)], [L("app.net_duvar_boya"), A(t.wall_net_m2)], [L("app.hacim"), `${fmt(t.volume_m3)} m³`], [L("app.islak_hacim"), A(t.wet_area_m2)], [L("app.supurgelik"), LEN(t.skirting_m)], [L("app.boya"), `${L("app.lt", { p: fmt(t.paint_litres, 1) })}`], [L("app.ayak_izi"), `${LEN(t.footprint_w_m)} × ${LEN(t.footprint_d_m)}`]].map(([k, v]) => `<div class="pl-kpi"><div class="pl-label">${k}</div><div class="pl-kpi__value uh-kpi-text pl-num">${v}</div></div>`).join("");
  $("#mRooms").innerHTML = `<thead><tr><th>${L("app.mahal_3")}</th><th class="is-num">${L("app.net_alan")}</th><th class="is-num">${L("app.cevre")}</th><th class="is-num">${L("app.olcu")}</th><th class="is-num">${L("app.yukseklik")}</th><th class="is-num">${L("app.hacim")}</th><th class="is-num">${L("app.net_duvar")}</th><th class="is-num">${L("app.supurgelik")}</th><th class="is-num">${L("app.kapi")}</th><th class="is-num">${L("app.pencere")}</th><th class="is-num">${L("app.gun_isigi")}</th></tr></thead><tbody>${r.report.rooms.map((x) => `<tr><td class="is-strong">${esc(N.roomName(x, S.catalog.roomKinds))}</td><td class="is-num">${A(x.area_m2)}</td><td class="is-num">${LEN(x.perimeter_m)}</td><td class="is-num">${LEN(x.width_m)} × ${LEN(x.depth_m)}</td><td class="is-num">${LEN(x.height_m)}</td><td class="is-num">${fmt(x.volume_m3)} m³</td><td class="is-num">${A(x.wall_net_m2)}</td><td class="is-num">${LEN(x.skirting_m)}</td><td class="is-num">${x.doors}</td><td class="is-num">${x.windows}</td><td class="is-num">%${fmt(x.daylight_ratio * 100, 0)}</td></tr>`).join("")}</tbody>`;
  $("#mWalls").innerHTML = `<thead><tr><th>${L("foto.duvar")}</th><th>${L("common.tur")}</th><th class="is-num">${L("app.uzunluk")}</th><th class="is-num">${L("app.kalinlik")}</th><th class="is-num">${L("app.brut")}</th><th class="is-num">${L("app.aciklik")}</th><th class="is-num">${L("app.net")}</th><th class="is-num">${L("app.hacim")}</th></tr></thead><tbody>${r.report.walls.map((w) => `<tr><td class="pl-num">${esc(w.id)}</td><td>${w.exterior ? L("app.dis") : L("app.ic")}</td><td class="is-num">${LEN(w.length_m)}</td><td class="is-num">${fmt(w.thickness_cm, 1)} cm</td><td class="is-num">${A(w.gross_m2)}</td><td class="is-num">${A(w.openings_m2)}</td><td class="is-num">${A(w.net_m2)}</td><td class="is-num">${fmt(w.volume_m3, 2)} m³</td></tr>`).join("")}</tbody>`;
  $("#mFns").innerHTML = `<thead><tr><th>${L("app.fonksiyon")}</th><th class="is-num">${L("app.sonuc")}</th><th>${L("common.birim")}</th></tr></thead><tbody>${r.functions.map((f) => `<tr><td class="is-strong">${esc(f.name)}</td><td class="is-num">${f.value != null ? fmt(f.value) : `<span class="pl-badge pl-badge--danger">${esc(f.error)}</span>`}</td><td>${esc(f.unit)}</td></tr>`).join("") || `<tr><td colspan="3">${L("app.olcu_fonksiyonu_yok")}</td></tr>`}</tbody>`;
  $("#mWarn").innerHTML = r.report.warnings.map((w) => `<div class="uh-checkitem is-uyari"><b>${L("app.uyari")}</b>${esc(LM(w))}</div>`).join("");
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
  $("#cKpis").innerHTML = `<div class="pl-kpi"><div class="pl-label">${L("app.ara_toplam")}</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.subtotal)}</div></div>
    <div class="pl-kpi"><div class="pl-label">${L("app.beklenmeyen_kdv")}</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.contingency + est.vat)}</div></div>
    <div class="pl-kpi pl-kpi--highlight"><div class="pl-label">${L("app.genel_toplam")}</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.total)}</div></div>
    <div class="pl-kpi"><div class="pl-label">${L("app.m2_basina")}</div><div class="pl-kpi__value uh-kpi-text is-money">${tl(est.per_m2)}</div></div>`;
  $("#cGroups").innerHTML = est.groups.map((g) => `<div class="uh-bar"><span>${esc(N.costGroupName(g.group))}</span><div class="pl-progress" style="--pl-val:${Math.round(g.share * 100)}%" role="img" aria-label="%${Math.round(g.share * 100)}"><span></span></div><span>${tl(g.total)}</span></div>`).join("");
  const maxT = Math.max(...sc.tiers.map((t) => t.total), 1);
  $("#cTiers").innerHTML = sc.tiers.map((t) => `<div class="uh-bar"><span>${esc(N.tierName(t.label))}</span><div class="pl-progress" style="--pl-val:${Math.round((t.total / maxT) * 100)}%"><span></span></div><span>${tl(t.total)}</span></div>`).join("") + `<p class="uh-small">${L("app.m2_basina_2", { p: sc.tiers.map((t) => `${N.tierName(t.label)} ${tl(t.per_m2)}`).join(" · ") })}</p>`;
  const rateIds = new Set(cp.rates.map((r) => r.id));
  $("#cLines").innerHTML = `<thead><tr><th>${L("app.kalem")}</th><th>${L("app.grup")}</th><th class="is-num">${L("app.miktar")}</th><th class="is-num">${L("app.fireli")}</th><th class="is-num">${L("app.malzeme_birim")}</th><th class="is-num">${L("app.iscilik_birim")}</th><th class="is-num">${L("app.malzeme")}</th><th class="is-num">${L("app.iscilik")}</th><th class="is-num">${L("app.indirim")}</th><th class="is-num">${L("app.toplam")}</th></tr></thead><tbody>${est.lines.map((l) => {
    const rate = cp.rates.find((r) => r.id === l.id);
    const edit = (k, v) => rateIds.has(l.id) ? `<input class="pl-input uh-cell-input" type="number" min="0" step="10" data-rate="${l.id}" data-k="${k}" value="${v}" aria-label="${L("app.birim_fiyati", { p: esc(N.costLineName(l, S.scene.materials)), p2: k === "material_price" ? L("app.malzeme_2") : L("app.iscilik_2") })}">` : "—";
    return `<tr><td class="is-strong">${esc(N.costLineName(l, S.scene.materials))}${l.note ? `<br><span class="uh-small">${esc(LM(l.note))}</span>` : ""}</td><td>${esc(N.costGroupName(l.group))}</td><td class="is-num">${fmt(l.quantity)} ${esc(N.unitName(l.unit))}</td><td class="is-num">${fmt(l.quantity_with_waste)}</td><td class="is-num">${rate ? edit("material_price", rate.material_price) : "—"}</td><td class="is-num">${rate ? edit("labour_price", rate.labour_price) : "—"}</td><td class="is-num">${tl(l.material)}</td><td class="is-num">${tl(l.labour)}</td><td class="is-num">${l.discount ? "−" + tl(l.discount) : "—"}</td><td class="is-num">${tl(l.total)}</td></tr>`;
  }).join("")}</tbody>`;
  // alan eğrisi
  const pts = sc.area_curve;
  const W = 520, H = 200, pad = 40;
  const xs = pts.map((p) => p.floor_area_m2), ys = pts.map((p) => p.total);
  const [x0, x1, y1] = [Math.min(...xs), Math.max(...xs), Math.max(...ys) * 1.08];
  const X = (v) => pad + ((v - x0) / Math.max(1e-9, x1 - x0)) * (W - pad - 12);
  const Y = (v) => H - 26 - (v / Math.max(1, y1)) * (H - 40);
  $("#cCurve").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L("app.alan_buyudukce_toplam_maliyet_egrisi")}"><line class="ax" x1="${pad}" y1="${H - 26}" x2="${W - 8}" y2="${H - 26}"/><line class="ax" x1="${pad}" y1="10" x2="${pad}" y2="${H - 26}"/><polyline class="ln" points="${pts.map((p) => `${X(p.floor_area_m2)},${Y(p.total)}`).join(" ")}"/>${pts.map((p) => `<circle class="pt ${p.factor === 1 ? "is-base" : ""}" cx="${X(p.floor_area_m2)}" cy="${Y(p.total)}" r="4"/><text x="${X(p.floor_area_m2)}" y="${H - 8}" text-anchor="middle">${fmt(p.floor_area_m2, 0)} m²</text>`).join("")}</svg>`;
  $("#cCurveT").innerHTML = `<thead><tr><th>${L("app.alan_carpani")}</th><th class="is-num">${L("app.net_alan")}</th><th class="is-num">${L("app.toplam")}</th><th class="is-num">${L("app.m2_basina")}</th></tr></thead><tbody>${pts.map((p) => `<tr class="${p.factor === 1 ? "is-selected" : ""}"><td>×${fmt(p.factor)}</td><td class="is-num">${fmt(p.floor_area_m2)} m²</td><td class="is-num">${tl(p.total)}</td><td class="is-num">${tl(p.per_m2)}</td></tr>`).join("")}</tbody>`;
  $("#cUnits").innerHTML = `<thead><tr><th>${L("app.konut")}</th><th class="is-num">${L("app.konut_basina")}</th><th class="is-num">${L("app.toplam")}</th><th class="is-num">${L("app.tasarruf")}</th></tr></thead><tbody>${sc.units.map((u) => `<tr><td>${u.units}</td><td class="is-num">${tl(u.per_unit)}</td><td class="is-num">${tl(u.total)}</td><td class="is-num">%${fmt(u.saving * 100, 1)}</td></tr>`).join("")}</tbody>`;
  $("#cElastic").textContent = `${L("app.alan_esnekligi_alan_1_buyudugunde_toplam", { p: fmt(sc.elasticity, 2) })}`;
  $("#cErr").innerHTML = est.errors.map((e) => `<div class="uh-checkitem is-hata"><b>${L("fonksiyon.formul")}</b>${esc(LM(e))}</div>`).join("");
}

/* ---------- Fonksiyonlar ---------- */
async function renderFunctions() {
  const r = await B.engine("measure", { scene: S.scene });
  const desc = { floor_area: L("app.toplam_net_zemin_alani_m2"), gross_area: L("app.brut_alan_m2"), wet_area: L("app.islak_hacim_alani_m2"), ceiling_area: L("app.tavan_alani_m2"), perimeter: L("app.mahal_cevreleri_m"), wall_area: L("app.net_duvar_alani_m2"), wall_length: L("app.duvar_uzunlugu_m"), wall_volume: L("app.duvar_hacmi_m3"), exterior_wall_area: L("app.net_dis_duvar_m2"), volume: L("app.ic_hacim_m3"), skirting: L("app.supurgelik_m"), doors: L("app.kapi_sayisi"), windows: L("app.pencere_sayisi"), window_area: L("app.pencere_alani_m2"), paint_l: L("app.boya_lt"), rooms: L("app.mahal_sayisi"), objects: L("app.nesne_sayisi"), height: L("app.kat_net_yuksekligi_m"), region_index: L("app.bolge_endeksi"), labour_index: L("maliyet.iscilik_endeksi"), tier: L("app.kalite_carpani") };
  $("#fnVars").innerHTML = `<thead><tr><th>${L("app.degisken")}</th><th class="is-num">${L("app.deger")}</th><th>${L("app.aciklama")}</th></tr></thead><tbody>${Object.entries(r.variables).map(([k, v]) => `<tr><td class="pl-num">${esc(k)}</td><td class="is-num">${fmt(v)}</td><td>${esc(desc[k] || (k.startsWith("area_") ? L("app.ture_gore_alan") : L("app.mahal_olcusu")))}</td></tr>`).join("")}</tbody>`;
  $("#fnList").innerHTML = `<thead><tr><th>${L("common.ad")}</th><th>${L("app.kimlik")}</th><th>${L("common.tur")}</th><th>${L("fonksiyon.formul")}</th><th class="is-num">${L("app.sonuc")}</th><th>${L("app.etkin")}</th><th></th></tr></thead><tbody>${S.scene.functions.map((f, i) => {
    const res = r.functions.find((x) => x.id === f.id);
    return `<tr><td class="is-strong">${esc(f.name)}</td><td class="pl-num">${esc(f.id)}</td><td>${f.kind === "cost" ? L("app.maliyet") : L("app.olcu")}</td><td class="pl-num">${esc(f.expr)}</td><td class="is-num">${res ? (res.value != null ? fmt(res.value) + " " + esc(f.unit) : esc(res.error)) : f.kind === "cost" ? `× ${tl(f.unit_price)}` : "—"}</td><td><label class="pl-switch"><input type="checkbox" data-fn-toggle="${i}" ${f.enabled ? "checked" : ""} aria-label="${esc(f.name)} etkin"></label></td><td><button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-fn-archive="${i}">${L("uc.arsivle")}</button></td></tr>`;
  }).join("") || `<tr><td colspan="7">${L("app.henuz_fonksiyon_yok")}</td></tr>`}</tbody>`;
}
function fnDraft() {
  const name = $("#fnName").value.trim();
  const id = ($("#fnId").value.trim() || name).toLowerCase().replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c])).replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return { id, name, kind: $("#fnKind").value, expr: $("#fnExpr").value.trim(), unit: $("#fnUnit").value.trim(), is_amount: false, unit_price: Number($("#fnPrice").value) || 0, enabled: true };
}

/* ---------- Ürün kütüphanesi ---------- */
// malzeme renkleri doğrusal ışık değeridir; ekranda sRGB olarak gösterilir
const toS = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const toL = (x) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
const rgb = (c, k = 1) => `rgb(${c.map((x) => Math.round(Math.max(0, Math.min(1, toS(Math.min(1, x * k)))) * 255)).join(" ")})`;
const srgbCss = (c) => `rgb(${c.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255)).join(" ")})`;
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
  const groups = ["*", ...new Set(f.map((x) => x.group))];
  $("#libGroups").innerHTML = groups.map((g) => `<button type="button" role="tab" class="uh-tool ${S.libGroup === g ? "is-active" : ""}" data-lib-group="${esc(g)}">${esc(g === "*" ? L("app.tumu") : g)}</button>`).join("");
  const q = S.libQ.toLocaleLowerCase(locale());
  const list = f.filter((x) => (S.libGroup === "*" || x.group === S.libGroup) && (!q || x.name.toLocaleLowerCase(locale()).includes(q)));
  $("#libGrid").innerHTML = list.map((x) => `<div class="uh-libcard" draggable="true" data-drag-item="${x.id}"><div class="uh-libcard__thumb" data-thumb="${x.id}">${S.thumbs[x.id] ? `<img src="data:image/png;base64,${S.thumbs[x.id]}" alt="${L("app.gercekci_onizleme", { p: esc(x.name) })}">` : isoThumb(S.catalog.previews[x.id])}</div><b>${esc(x.name)}</b>
    <div class="uh-libcard__meta"><span>${x.size.map((v) => fmt(v / 10, 0)).join("×")} cm</span><span class="is-money">${x.price ? tl(x.price) : "—"}</span></div>
    <div class="uh-row"><button class="pl-btn pl-btn--ghost pl-btn--sm" type="button" data-lib-real="${x.id}">${L("app.gercekci_gorunum")}</button><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-lib-place="${x.id}">${L("app.plana_yerlestir")}</button></div></div>`).join("") || `<p class="uh-small">${L("app.aramanizla_eslesen_urun_yok")}</p>`;
  $("#objGrid").innerHTML = S.scene.meshes.map((m) => `<div class="uh-libcard"><div class="uh-libcard__thumb"><span class="pl-badge">OBJ</span></div><b>${esc(m.name)}</b>
    <div class="uh-libcard__meta"><span>${L("app.ucgen", { p: (m.indices.length / 3).toLocaleString(locale()) })}</span><span>${L("app.sahnede", { length: S.scene.objects.filter((o) => o.mesh === m.id).length })}</span></div>
    <button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-place-mesh="${m.id}">${L("app.plana_ekle")}</button></div>`).join("") || `<p class="uh-small">${L("app.henuz_ice_aktarilan_model_yok")}</p>`;
}

/* ---------- Karşılama: önden tel kafes önizleme ---------- */
async function welcomeScene() {
  if (S.scene && S.scene.modules.length) return { scene: S.scene, saved: false };
  if (S.saved && !S.savedScene) {
    try { S.savedScene = (await B.engine("load_scene", { text: S.saved })).scene; } catch { S.saved = null; }
  }
  return S.savedScene && S.savedScene.modules.length ? { scene: S.savedScene, saved: true } : { scene: null, saved: false };
}
async function renderWelcome() {
  const { scene, saved } = await welcomeScene();
  $("#btnWelcomeResume").hidden = !saved;
  const wire = $("#welcomeWire");
  if (!scene) {
    wire.innerHTML = `<p class="uh-small">${L("app.henuz_proje_yok_yeni_bir_proje_baslatin")}</p>`;
    $("#welcomeCap").textContent = "";
    $("#welcomeTitle").textContent = L("karsilama.hos_geldiniz");
    $("#welcomeStats").innerHTML = "";
    return;
  }
  $("#welcomeTitle").textContent = saved ? L("app.kaldiginiz_yerden_devam_edin") : N.sceneName(scene.name) || L("app.projeniz");
  $("#welcomeLead").textContent = saved ? L("app.daha_once_otomatik_kaydedilmis_bir_proje") : L("app.acik_proje_adimlar_arasinda_soldaki");
  const area = scene.levels.reduce((a, l) => a + netArea(l), 0);
  $("#welcomeStats").innerHTML = `<dt>${L("app.proje")}</dt><dd>${esc(scene.project_no || "—")}</dd><dt>${L("model.modul")}</dt><dd>${scene.modules.map((m) => "4×" + m.length).join(", ")}</dd><dt>${L("plan.kat")}</dt><dd>${scene.levels.length}</dd><dt>${L("app.net_mahal_alani")}</dt><dd>${fmt(area)} m²</dd><dt>${L("app.nesne")}</dt><dd>${scene.objects.length}</dd>`;
  try {
    const e = await B.engine("elevation", { scene, side: S.elevSide });
    const [x0, y0, x1, y1] = e.bounds;
    const pad = (y1 - y0) * 0.12 + 200;
    wire.innerHTML = `<svg viewBox="${x0} ${-pad} ${x1 - x0} ${y1 - y0 + pad * 2}" preserveAspectRatio="xMidYMid meet">${e.lines.map((l) => `<line class="k${l[4]}" x1="${l[0]}" y1="${y1 - l[1]}" x2="${l[2]}" y2="${y1 - l[3]}"/>`).join("")}</svg>`;
    const side = { on: L("app.on"), arka: L("app.arka"), sol: L("app.sol"), sag: L("app.sag") }[S.elevSide];
    $("#welcomeCap").textContent = `${L("app.cephe_genislik_m_yukseklik_m_aciklik", { side, p: fmt((Math.max(...e.lines.filter((l) => l[4] === 0).flatMap((l) => [l[0], l[2]])) - Math.min(...e.lines.filter((l) => l[4] === 0).flatMap((l) => [l[0], l[2]]))) / 1000, 1), p2: fmt((y1 - y0) / 1000), openings: e.openings })}`;
  } catch (err) {
    wire.innerHTML = `<p class="uh-small">${esc(err.message)}</p>`;
  }
}
async function resumeSaved() {
  const r = await B.engine("load_scene", { text: S.saved });
  S.undo = []; S.json = ""; K.fitted = false; P.fitted = false; S.camSet = false;
  commit(r.scene, { undo: false });
  syncCountsFromScene();
  go(r.scene.levels.some((l) => l.rooms.length) ? "plan" : "katlar");
}

/* ---------- 3B düzenleme: seçim, sürükleyerek taşıma, araç çubuğu ---------- */
function objHeight(o) { return baseDims(o)[2] * (o.scale[1] || 1); }
function objectAt(pt) {
  const [x, y, z] = pt;
  for (let i = S.scene.objects.length - 1; i >= 0; i--) {
    const o = S.scene.objects[i];
    const lv = S.scene.levels.find((l) => l.id === o.level);
    if (!lv) continue;
    const y0 = lv.elevation + o.position[2];
    if (y < y0 - 60 || y > y0 + objHeight(o) + 60) continue;
    const [w, d] = P.objSize(o);
    const a = (-o.rotation * Math.PI) / 180;
    const dx = x - o.position[0], dz = z - o.position[1];
    const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
    if (Math.abs(lx) <= w / 2 + 30 && Math.abs(lz) <= d / 2 + 30) return o;
  }
  return null;
}
function update3dSelection() {
  const o = S.sel3 && S.scene.objects.find((x) => x.id === S.sel3);
  if (!o) S.sel3 = null;
  $$("[data-3d]").forEach((b) => (b.disabled = !o));
  $("#b3dSel").textContent = o ? N.objectName(o, S.catalog.furniture) : L("uc.secim_yok");
  if (!o) { V.setBox(null); return; }
  const lv = S.scene.levels.find((l) => l.id === o.level);
  const cs = P.objCorners(o);
  const xs = cs.map((c) => c[0]), zs = cs.map((c) => c[1]);
  const y0 = lv.elevation + o.position[2];
  V.setBox([Math.min(...xs), y0, Math.min(...zs)], [Math.max(...xs), y0 + objHeight(o), Math.max(...zs)]);
}
const hooks3d = {
  drag: null,
  down(e) {
    const hit = V.pick(e);
    const o = hit && objectAt(hit.point);
    S.sel3 = o ? o.id : null;
    update3dSelection();
    if (!o) return false;
    const y = hit.point[1];
    const start = V.planePoint(e, y);
    this.drag = start ? { id: o.id, y, start, pos: [...o.position], moved: false } : null;
    return !!this.drag;
  },
  move(e) {
    const d = this.drag;
    if (!d) return;
    const p = V.planePoint(e, d.y);
    if (!p) return;
    const o = S.scene.objects.find((x) => x.id === d.id);
    o.position = [Math.round((d.pos[0] + p[0] - d.start[0]) / 50) * 50, Math.round((d.pos[1] + p[2] - d.start[2]) / 50) * 50, o.position[2]];
    d.moved = true;
    update3dSelection();
  },
  up() {
    const d = this.drag;
    this.drag = null;
    if (d && d.moved) commit(S.scene);
  },
};
function act3d(kind) {
  const o = S.sel3 && S.scene.objects.find((x) => x.id === S.sel3);
  if (!o) return;
  const s = clone();
  const t = s.objects.find((x) => x.id === o.id);
  if (kind === "rot") t.rotation = ((t.rotation || 0) + 90) % 360;
  if (kind === "up") t.position[2] = Math.min(6000, t.position[2] + 50);
  if (kind === "down") t.position[2] = Math.max(0, t.position[2] - 50);
  if (kind === "dup") {
    const c = JSON.parse(JSON.stringify(t));
    c.id = nextId("N", s.objects);
    c.position = [t.position[0] + 400, t.position[1] + 400, t.position[2]];
    s.objects.push(c);
    S.sel3 = c.id;
  }
  if (kind === "archive") {
    s.objects = s.objects.filter((x) => x.id !== o.id);
    s.archive.push({ type: "object", level: o.level, item: o, at: new Date().toISOString() });
    S.sel3 = null;
    commit(s);
    toast(L("app.arsivlendi"), { action: L("top.geri_al"), onAction: undo });
    return;
  }
  commit(s);
}
/** Katalog ürününü dünya noktasına yerleştirir (plan ve 3B bırakma ortak). */
function placeItem(cat, x, z, level) {
  const it = S.catalog.furniture.find((f) => f.id === cat);
  if (!it) return null;
  const s = clone();
  const zz = it.mount === -2 ? s.standard.net_height - it.size[2] - 2 : it.mount < 0 ? s.standard.net_height - 900 : it.mount;
  const id = nextId("N", s.objects);
  s.objects.push({ id, name: it.name, mesh: `cat:${it.id}`, level, position: [Math.round(x / 50) * 50, Math.round(z / 50) * 50, zz], rotation: 0, scale: [1, 1, 1], material: null, price: it.price, quantity: 1, motor: null });
  commit(s);
  return id;
}

/* ---------- görsel → RGB (yerelde küçültme) ---------- */
async function imageToRgb(file, maxEdge) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.max(2, Math.round(bmp.width * k)), h = Math.max(2, Math.round(bmp.height * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const cx = cv.getContext("2d");
  cx.drawImage(bmp, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data;
  let bin = "";
  for (let i = 0; i < d.length; i += 4) bin += String.fromCharCode(d[i], d[i + 1], d[i + 2]);
  return { width: w, height: h, rgb: btoa(bin) };
}
async function uploadLook(file) {
  if (!file || file.size > 40 * 1024 * 1024) { toast(L("app.gorsel_40_mb_tan_kucuk_olmali"), { kind: "warn" }); return; }
  const img = await imageToRgb(file, 256);
  const r = await B.engine("add_texture", { scene: S.scene, name: file.name.replace(/\.[^.]+$/, ""), ...img });
  commit(r.scene);
  if (MOTORS[S.motor].fields && S.motor !== "havuz") S.motorParams[S.motor].look = r.look;
  if (S.view === "motor") renderMotor();
  toast(L("app.gorunum_yuklendi"), { sub: `${L("app.piksel", { width: img.width, height: img.height })}` });
}
async function loadPalette(name, text) {
  const r = await B.engine("import_palette", { scene: S.scene, name, text });
  commit(r.scene);
  S.matCat = "palet";
  go("kaplama");
  toast(`${L("app.renk_kaplamalara_eklendi", { length: r.ids.length })}`, { sub: name });
}
/** Pencereye bırakılan dosyalar: türüne göre aç / içe aktar. */
async function handleFiles(files) {
  const list = [...files];
  const ext = (f) => (f.name.split(".").pop() || "").toLowerCase();
  const proj = list.find((f) => ext(f) === "uhds");
  if (proj) {
    const r = await B.engine("load_scene", { text: await proj.text() });
    S.undo = []; S.json = ""; S.camSet = false; K.fitted = false; P.fitted = false;
    commit(r.scene, { undo: false });
    syncCountsFromScene();
    go("katlar");
    toast(L("app.proje_acildi"), { sub: proj.name });
    return;
  }
  if (list.some((f) => ["glb", "gltf"].includes(ext(f)))) { await importGltf(await B.filesToModel(list)); return; }
  const objs = list.filter((f) => ["obj", "mtl"].includes(ext(f)));
  if (objs.length) { await importObj(await Promise.all(objs.map(async (f) => ({ name: f.name, text: await f.text() })))); return; }
  const img = list.find((f) => f.type.startsWith("image/"));
  if (img) { if (S.view === "motor") await uploadLook(img); else { go("referans"); await refPick(img); } return; }
  const pal = list.find((f) => ["gpl", "txt", "json", "css", "hex", "pal"].includes(ext(f)));
  if (pal) { await loadPalette(pal.name.replace(/\.[^.]+$/, ""), await pal.text()); return; }
  toast(L("app.bu_dosya_turu_desteklenmiyor"), { kind: "warn", sub: L("app.desteklenen_uhds_obj_mtl_gorsel_renk") });
}

/* ---------- Fotoğraftan mekân ---------- */
const PH_PTS = [["bl", "1", L("app.arka_duvar_zemin_sol_kose")], ["br", "2", L("app.arka_duvar_zemin_sag_kose")], ["tr", "3", L("app.arka_duvar_tavan_sag_kose")], ["tl", "4", L("app.arka_duvar_tavan_sol_kose")], ["left", "5", L("app.sol_duvarin_zemin_cizgisinde_yakin_nokta")], ["right", "6", L("app.sag_duvarin_zemin_cizgisinde_yakin_nokta")]];
const PH_WALL = { arka: L("app.arka"), sol: L("app.sol"), sag: L("app.sag") };
async function photoPick(file) {
  if (!file || file.size > 40 * 1024 * 1024) { toast(L("app.fotograf_40_mb_tan_kucuk_olmali"), { kind: "warn" }); return; }
  const bmp = await createImageBitmap(file);
  const [w, h] = [bmp.width, bmp.height];
  if (S.photo?.url) URL.revokeObjectURL(S.photo.url);
  S.photo = {
    url: URL.createObjectURL(file), w, h, fit: null, err: null, tool: null, drag: null, seq: 0,
    pts: { bl: [w * 0.3, h * 0.66], br: [w * 0.7, h * 0.66], tr: [w * 0.7, h * 0.24], tl: [w * 0.3, h * 0.24], left: [w * 0.06, h * 0.92], right: [w * 0.94, h * 0.92] },
    openings: [],
  };
  $("#phImg").src = S.photo.url;
  renderPhoto();
  await photoSolve();
}
function photoInput() {
  const p = S.photo;
  return { width: p.w, height: p.h, ...p.pts, fov: $("#phFovAuto").checked ? null : Number($("#phFov").value), reference: { kind: $("#phRefKind").value, mm: Number($("#phRefVal").value) * 10 }, openings: p.openings };
}
async function photoSolve() {
  const p = S.photo;
  if (!p) return;
  const seq = ++p.seq;
  let fit = null, err = null;
  try { fit = await B.engine("photo_room", { photo: photoInput() }); } catch (e) { err = e.message || String(e); }
  if (seq !== p.seq) return;
  p.fit = fit; p.err = err;
  drawPhoto();
  photoResult();
}
function drawPhoto() {
  const p = S.photo;
  if (!p) return;
  const svg = $("#phSvg");
  svg.setAttribute("viewBox", `0 0 ${p.w} ${p.h}`);
  const k = p.w / Math.max(1, svg.getBoundingClientRect().width || 800);
  const q = p.pts;
  const pt = (a) => `${a[0].toFixed(1)},${a[1].toFixed(1)}`;
  let h = "";
  if (p.fit) h += p.fit.outline.map((e) => `<line class="uh-ph-out" x1="${e[0][0].toFixed(1)}" y1="${e[0][1].toFixed(1)}" x2="${e[1][0].toFixed(1)}" y2="${e[1][1].toFixed(1)}"/>`).join("");
  h += `<polygon class="uh-ph-quad" points="${pt(q.bl)} ${pt(q.br)} ${pt(q.tr)} ${pt(q.tl)}"/>`;
  h += `<polyline class="uh-ph-side" points="${pt(q.left)} ${pt(q.bl)}"/><polyline class="uh-ph-side" points="${pt(q.right)} ${pt(q.br)}"/>`;
  const rects = [...p.openings, ...(p.drag?.rect ? [p.drag.rect] : [])];
  h += rects.map((o) => `<rect class="uh-ph-open" x="${Math.min(o.a[0], o.b[0]).toFixed(1)}" y="${Math.min(o.a[1], o.b[1]).toFixed(1)}" width="${Math.abs(o.b[0] - o.a[0]).toFixed(1)}" height="${Math.abs(o.b[1] - o.a[1]).toFixed(1)}"/>`).join("");
  h += PH_PTS.map(([id, no, label]) => `<g class="uh-ph-h${p.drag?.pt === id ? " is-drag" : ""}" data-pt="${id}" tabindex="0" role="button" aria-label="${no}: ${label}" transform="translate(${pt(q[id])})"><title>${no} · ${label}</title><circle r="${(11 * k).toFixed(1)}"/><text font-size="${(12 * k).toFixed(1)}">${no}</text></g>`).join("");
  svg.innerHTML = h;
}
function photoResult() {
  const p = S.photo;
  const f = p?.fit;
  $("#btnPhotoBuild").disabled = !f;
  const box = $("#phResult");
  if (!f) { box.innerHTML = `<p class="uh-small">${esc(p?.err || L("app.isaretleri_yerlestirin"))}</p>`; return; }
  const cm = (v) => fmt(v / 10, 0);
  const dim = (label, v, tol) => `<div class="uh-ph-dim"><span>${label}</span><b>${cm(v)} cm</b><small>± ${cm(tol)} cm</small></div>`;
  const src = { "kacis-noktalari": L("app.fotograftan_hesaplandi"), kullanici: L("app.elle_girildi"), varsayilan: L("app.varsayim") }[f.focal_source];
  box.innerHTML = `<div class="uh-ph-dims">${dim(L("app.genislik"), f.width, f.tolerance.width)}${dim(L("app.derinlik"), f.depth, f.tolerance.depth)}${dim(L("app.yukseklik"), f.height, f.tolerance.height)}</div>
    <dl class="uh-stats"><dt>${L("app.genislik_yukseklik")}</dt><dd>${fmt(f.ratio_width_height, 2)} : 1</dd><dt>${L("app.derinlik_genislik")}</dt><dd>${fmt(f.ratio_depth_width, 2)} : 1</dd><dt>${L("app.taban_alani")}</dt><dd>${fmt((f.width * f.depth) / 1e6, 1)} m²</dd><dt>${L("app.gorunen_derinlik")}</dt><dd>${cm(f.depth_visible)} cm</dd><dt>${L("app.objektif")}</dt><dd>${L("app.mm_esdegeri", { p: fmt(f.focal_35, 0), p2: fmt(f.fov_h, 0), src })}</dd><dt>${L("app.kamera")}</dt><dd>${L("app.yerden_cm_arka_duvara_cm", { p: cm(f.camera.height), p2: cm(f.camera.back) })}</dd><dt>${L("app.tutarlilik")}</dt><dd>%${Math.round(f.consistency * 100)}</dd><dt>${L("app.aciklik")}</dt><dd>${f.openings.length}</dd></dl>
    ${f.notes.length ? `<ul class="uh-ph-notes">${f.notes.map((n) => `<li>${esc(LM(n))}</li>`).join("")}</ul>` : ""}`;
}
function renderPhoto() {
  const p = S.photo;
  $("#phBody").hidden = !p;
  $("#phEmpty").hidden = !!p;
  const sp = S.scene.spaces || [];
  $("#spaceCount").textContent = sp.length;
  $("#phBesideBox").hidden = !sp.length;
  $("#phBeside").innerHTML = sp.map((s) => `<option value="${esc(s.id)}">${L("app.yanina", { p: esc(s.name) })}</option>`).join("");
  if (sp.length) $("#phBeside").value = sp[sp.length - 1].id;
  $("#spaceRows").innerHTML = sp.length
    ? sp.map((s) => `<tr data-sp="${esc(s.id)}"><td><input class="pl-input uh-spname" data-k="name" value="${esc(s.name)}" maxlength="40" aria-label="${L("foto.oda_adi")}"></td>${["width", "depth", "height"].map((k) => `<td class="is-num"><input class="pl-input uh-num" type="number" data-k="${k}" min="100" max="3000" step="1" value="${Math.round(s[k] / 10)}" aria-label="${{ width: L("app.genislik"), depth: L("app.derinlik"), height: L("app.yukseklik") }[k]}"></td>`).join("")}<td class="is-num">${fmt((s.width * s.depth) / 1e6, 1)} m²</td><td>${s.source === "foto" ? L("app.fotograf") : L("app.elle")}</td><td><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-spact="view">${L("app.3b_de_ac")}</button> <button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-spact="archive">${L("uc.arsivle")}</button></td></tr>`).join("")
    : `<tr><td colspan="7" class="uh-small">${L("app.henuz_mekan_yok_bir_fotograf_secin_ya_da")}</td></tr>`;
  if (p) {
    $("#phOpenings").innerHTML = p.openings.map((o, i) => `<button class="pl-chip" type="button" data-phdel="${i}" title="${L("app.kaldir")}">${L("app.duvar", { p: o.kind === "door" ? L("app.kapi") : L("app.pencere"), p2: PH_WALL[o.wall] })}</button>`).join("") || `<span class="uh-small">${L("app.isaretli_kapi_ya_da_pencere_yok")}</span>`;
    $("#phStage").classList.toggle("is-tool", !!p.tool);
    $$("[data-phtool]").forEach((b) => b.classList.toggle("is-active", b.dataset.phtool === p.tool));
    drawPhoto();
    photoResult();
  }
}
function phPoint(e) {
  const p = S.photo;
  const r = $("#phSvg").getBoundingClientRect();
  return [Math.min(p.w, Math.max(0, ((e.clientX - r.left) / r.width) * p.w)), Math.min(p.h, Math.max(0, ((e.clientY - r.top) / r.height) * p.h))];
}
function openSpace(id) {
  const s = (S.scene.spaces || []).find((x) => x.id === id);
  if (!s) return;
  const el = S.scene.levels[0]?.elevation || 150;
  S.v3.mode = "ic"; S.camSet = true;
  S.pendingCam = s.camera || { eye: [s.position[0] + s.width * 0.2, el + 1500, s.position[1] + s.depth - 300], target: [s.position[0] + s.width * 0.6, el + 1000, s.position[1]], fov: 62 };
  go("uc");
}
async function buildFromPhoto() {
  const f = S.photo?.fit;
  if (!f) return;
  const sp = S.scene.spaces || [];
  const r = await B.engine("add_space", { scene: S.scene, space: { name: $("#phName").value.trim() || L("foto.oda"), width: f.width, depth: f.depth, height: f.height, source: "foto" }, openings: f.openings, camera: f.camera, beside: sp.length ? $("#phBeside").value : null, side: $("#phSide").value });
  commit(r.scene);
  const id = r.extra.id;
  toast(L("app.oda_olusturuldu"), { sub: `${fmt(f.width / 1000)} × ${fmt(f.depth / 1000)} × ${fmt(f.height / 1000)} m${r.extra.notes.length ? ` · ${LM(r.extra.notes[0])}` : ""}`, action: L("app.3b_de_ac"), onAction: () => openSpace(id) });
}
async function addManualSpace() {
  const sp = S.scene.spaces || [];
  const r = await B.engine("add_space", { scene: S.scene, space: { name: `${L("app.oda", { p: sp.length + 1 })}`, width: 4000, depth: 4000, height: 2650, source: "elle" }, beside: sp.length ? sp[sp.length - 1].id : null, side: "sag" });
  commit(r.scene);
  toast(L("app.oda_eklendi"), { sub: L("app.olculeri_asagidaki_tablodan") });
}

/* ---------- Tasarım motorları ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => Math.round(toL(parseInt(h.slice(i, i + 2), 16) / 255) * 10000) / 10000);
const rgb2hex = (c) => "#" + c.map((x) => Math.round(Math.max(0, Math.min(1, toS(Math.max(0, x)))) * 255).toString(16).padStart(2, "0")).join("");
const srgbHex = (c) => "#" + c.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("");
const R = (k, label, min, max, step, unit = "") => ({ k, label, t: "range", min, max, step, unit });
const Sel = (k, label, opts) => ({ k, label, t: "select", opts });
const Col = (k, label) => ({ k, label, t: "color" });
const Chk = (k, label) => ({ k, label, t: "check" });
const MOTORS = {
  perde: { lead: L("app.perde_tasarlayici_cins_tul_fon_tul_fon"), fields: [
    Sel("kind", L("app.cins"), [["tul-fon", L("app.tul_fon")], ["tul", L("app.tul")], ["fon", L("app.fon")], ["stor", L("app.stor")]]), Sel("header", L("app.ust_bitis"), [["rustik", L("app.rustik_ahsap_boru")], ["korniş", L("app.kornis_2")], ["kemer-duz", L("app.duz_kemer")], ["kemer-kavisli", L("app.kavisli_kemer")]]),
    R("width", L("app.genislik"), 600, 6000, 50, "mm"), R("height", L("app.yukseklik"), 1000, 3200, 50, "mm"), R("pleats", L("app.pile_sikligi"), 3, 18, 0.5, "pile/m"), R("depth", L("app.pile_derinligi"), 20, 160, 5, "mm"),
    R("opacity", L("app.tul_saydamligi_dusuk_saydam"), 0.1, 0.6, 0.05), R("open", L("app.aciklik_fon_stor"), 0, 0.9, 0.05),
    Sel("pattern", L("app.desen"), [["duz", L("app.duz")], ["cizgili", L("app.cizgili")], ["bordur", L("app.etek_borduru")]]), Col("color", L("app.tul_rengi")), Col("color2", L("app.fon_rengi"))] },
  hali: { lead: L("app.hali_motoru_sekil_olcu_desen_iki_renk"), fields: [
    Sel("shape", L("app.sekil"), [["dikdortgen", L("app.dikdortgen")], ["yuvarlak", L("app.yuvarlak")], ["oval", L("app.oval")], ["yolluk", L("app.yolluk")]]), Sel("pattern", L("app.desen"), [["bordur", L("app.bordurlu")], ["duz", L("app.duz")], ["cizgili", L("app.cizgili")], ["dama", L("app.dama")], ["madalyon", L("app.madalyon")]]),
    R("width", L("app.genislik"), 600, 5000, 50, "mm"), R("length", L("app.boy"), 600, 7000, 50, "mm"), R("pile", L("app.hav_yuksekligi"), 4, 50, 1, "mm"), Chk("fringe", L("app.sacakli")), Col("color", L("app.ana_renk")), Col("color2", L("app.desen_rengi"))] },
  yatak: { lead: L("app.yatak_kombinasyonu_olcu_baza_tipi_silte"), fields: [
    Sel("width", L("app.genislik"), [[900, "90 cm"], [1000, "100 cm"], [1200, "120 cm"], [1400, "140 cm"], [1600, "160 cm"], [1800, "180 cm"], [2000, "200 cm"]]), Sel("length", L("app.boy"), [[1900, "190 cm"], [2000, "200 cm"]]),
    Sel("base", L("app.baza"), [["sandikli", L("app.sandikli")], ["ayakli", L("app.ayakli")], ["dusuk", L("app.dusuk_platform")]]), Sel("headboard", L("app.baslik"), [["kapitone", L("app.kapitone")], ["duz", L("app.duz")], ["kemerli", L("app.kemerli")], ["kulakli", L("app.kulakli")], ["yok", L("app.basliksiz")]]),
    R("mattress", L("app.silte_yuksekligi"), 150, 380, 10, "mm"), R("headboard_height", L("app.baslik_yuksekligi"), 800, 1700, 50, "mm"), Col("base_color", L("app.baza_rengi")), Col("headboard_color", L("app.baslik_rengi")),
    Chk("bedding.on", L("app.nevresim_takimi")), Sel("bedding.pattern", L("app.nevresim_deseni"), [["duz", L("app.duz")], ["cizgili", L("app.cizgili")], ["dama", L("app.dama")]]), Sel("bedding.pillows", L("app.yastik"), [[1, "1"], [2, "2"], [4, "4"], [6, "6"]]), Chk("bedding.throw", L("app.ayak_ucu_ortusu")), Col("bedding.color", L("app.nevresim_rengi")), Col("bedding.color2", L("app.ikinci_renk"))] },
  nevresim: { lead: L("app.nevresim_motoru_mevcut_bir_yatagin"), fields: [
    Sel("width", L("app.yatak_genisligi"), [[900, "90 cm"], [1000, "100 cm"], [1200, "120 cm"], [1400, "140 cm"], [1600, "160 cm"], [1800, "180 cm"], [2000, "200 cm"]]), Sel("length", L("app.yatak_boyu"), [[1900, "190 cm"], [2000, "200 cm"]]),
    R("top", L("app.silte_ust_kotu"), 250, 800, 10, "mm"), Sel("bedding.pattern", L("app.desen"), [["duz", L("app.duz")], ["cizgili", L("app.cizgili")], ["dama", L("app.dama")]]), Sel("bedding.pillows", L("app.yastik"), [[1, "1"], [2, "2"], [4, "4"], [6, "6"]]), Chk("bedding.throw", L("app.ayak_ucu_ortusu")), Col("bedding.color", L("app.ana_renk")), Col("bedding.color2", L("app.ikinci_renk"))] },
  havuz: { lead: L("app.havuz_olusturucu_sekil_olcu_derinlik"), fields: [
    Sel("shape", L("app.sekil"), [["dikdortgen", L("app.dikdortgen")], ["oval", L("app.oval")], ["yuvarlak", L("app.yuvarlak")], ["l", L("app.l_bicimli")]]), R("width", L("app.genislik"), 2000, 10000, 100, "mm"), R("length", L("app.boy"), 2000, 20000, 100, "mm"), R("depth", L("app.derinlik"), 800, 2800, 50, "mm"),
    R("coping", L("app.kenar_tasi_genisligi"), 150, 700, 10, "mm"), Col("water", L("app.su_rengi")), Chk("steps", L("app.basamak")), Chk("lights", L("app.havuz_aydinlatmasi"))] },
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
  }).join("") + (kind === "havuz" ? "" : `<label class="pl-field"><span class="pl-field__label">${L("app.gorunum_doku")}</span><select class="pl-select" data-mk="look" data-mt="str"><option value="">${L("app.motorun_kendi_dokusu")}</option>${S.texKinds.map((k) => `<option value="${k.id}" ${p.look === k.id ? "selected" : ""}>${esc(N.texKindName(k))}</option>`).join("")}${S.scene.textures.map((t) => `<option value="img:${t.id}" ${p.look === "img:" + t.id ? "selected" : ""}>${L("app.yuklenen", { p: esc(t.name) })}</option>`).join("")}</select></label><label class="pl-field"><span class="pl-field__label">&nbsp;</span><button class="pl-btn pl-btn--secondary" type="button" id="btnLook">${L("app.gorunum_yukle")}</button></label><label class="pl-field"><span class="pl-field__label">${L("app.desen_olcusu")} <output>${fmt(p.look_scale, 0)} mm</output></span><input type="range" min="50" max="2000" step="10" value="${p.look_scale}" data-mk="look_scale" data-mt="range" data-unit="mm" data-step="10"></label><label class="pl-field"><span class="pl-field__label">${L("app.ayrinti_duzeyi")}</span><select class="pl-select" data-mk="detail" data-mt="num">${[[1, L("app.hizli")], [2, L("app.ayrintili")], [3, L("app.cok_ayrintili")]].map(([val, l]) => `<option value="${val}" ${p.detail === val ? "selected" : ""}>${l}</option>`).join("")}</select></label>`);
  $("#motorReal").hidden = true;
  motorPreview();
}
function motorPreview() {
  clearTimeout(S.motorTimer);
  S.motorTimer = setTimeout(async () => {
    try {
      const r = await B.engine("motor_preview", { kind: S.motor, params: S.motorParams[S.motor] });
      drawMotor(r);
      $("#motorInfo").innerHTML = `<dt>${L("app.urun")}</dt><dd>${esc(motorName(S.motor, r.size))}</dd><dt>${L("app.olcu_g_d_y")}</dt><dd>${r.size.map((v) => fmt(v / 10, 0)).join(" × ")} cm</dd><dt>${L("app.ucgen_2")}</dt><dd>${r.triangles.toLocaleString(locale())}</dd><dt>${L("app.tahmini_fiyat")}</dt><dd>${tl(r.price)}</dd>`;
    } catch (e) { $("#motorInfo").innerHTML = `<dt>${L("app.hata")}</dt><dd>${esc(e.message)}</dd>`; }
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
function motorName(kind, size) {
  return L("app.motor_urun_adi", { name: L(`motor.${kind}`), w: fmt(size[0] / 10, 0), d: fmt(size[1] / 10, 0) });
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
  // nesne adı seçili dilde: üretici adı ve ölçü
  const obj = r.scene.objects.find((o) => o.id === r.object);
  if (obj) obj.name = motorName(S.motor, r.size);
  commit(r.scene);
  P.fitted = false;
  P.sel = { type: "object", id: r.object };
  P.setTool({ type: "select" });
  go("plan");
  toast(L("app.model_plana_eklendi_surukleyerek_yerine"), { sub: `${L("app.ucgen_3", { p: r.triangles.toLocaleString(locale()), p2: tl(r.price) })}` });
}

/* ---------- Görselden referans ---------- */
async function refPick(file) {
  if (!file || file.size > 40 * 1024 * 1024) { toast(L("app.gorsel_40_mb_tan_kucuk_olmali"), { kind: "warn" }); return; }
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
  const name = (id) => N.matName(S.scene.materials.find((m) => m.id === id)) || "—";
  $("#refPalette").innerHTML = r.palette.map((p) => `<span style="width:${(p.share * 100).toFixed(1)}%;background:${srgbCss(p.color)}" title="%${Math.round(p.share * 100)}"></span>`).join("");
  const light = { ic: L("app.ic_mekan_kapali_hava"), "dis-gunduz": L("app.dis_mekan_gunduz"), "gun-batimi": L("uc.gun_batimi"), gece: L("app.gece") }[r.lighting];
  const cam = { ic: L("app.ic_mekan_goz_hizasi"), kusbakisi: L("uc.kusbakisi"), perspektif: L("app.dis_perspektif") }[r.camera];
  $("#refStats").innerHTML = `<dt>${L("app.isik_duzeni")}</dt><dd>${light}</dd><dt>${L("app.parlaklik")}</dt><dd>%${Math.round(r.brightness * 100)}</dd><dt>${L("app.sicaklik")}</dt><dd>${r.warmth > 0.04 ? L("app.sicak") : r.warmth < -0.04 ? L("app.soguk") : L("app.notr")} (${fmt(r.warmth)})</dd><dt>${L("app.doygunluk")}</dt><dd>%${Math.round(r.saturation * 100)}</dd><dt>${L("app.ufuk_cizgisi_tahmini")}</dt><dd>${L("app.ustten", { p: Math.round(r.horizon * 100) })}</dd>`;
  const hh = `${String(Math.floor(r.sky.hour)).padStart(2, "0")}:${String(Math.round((r.sky.hour % 1) * 60)).padStart(2, "0")}`;
  const items = [
    ["interior", `${L("app.ic_cephe_boyasi", { p: esc(name(r.interior)) })}`, !!r.interior],
    ["floor", `${L("app.zemin_kaplamasi_kuru_mahaller", { p: esc(name(r.floor)) })}`, !!r.floor],
    ["facade", `${L("app.dis_cephe", { p: esc(name(r.facade)) })}`, !!r.facade && r.lighting !== "ic"],
    ["sky", `${L("app.gokyuzu_ve_isik_saat_bulut_pus", { hh, p: Math.round(r.sky.cloud * 100), p2: Math.round(r.sky.haze * 100) })}`, true],
    ["exposure", `${L("app.pozlama", { p: fmt(r.exposure) })}`, true],
    ["camera", `${L("app.kamera_perspektif_gorus_acisi", { cam, fov: r.fov })}`, true],
  ];
  $("#refApplyList").innerHTML = items.map(([k, l, on]) => `<label class="uh-check"><input type="checkbox" data-ref="${k}" ${on ? "checked" : ""}> ${l}</label>`).join("");
  $("#refMatches").innerHTML = r.matches.map((m) => `<div class="uh-libcard"><div class="uh-libcard__thumb">${isoThumb(S.catalog.previews[m.id])}</div><b>${esc(N.catName(m))}</b><div class="uh-libcard__meta"><span>${esc(N.groupName(m.group))}</span><span>${L("app.benzerlik", { p: Math.round(m.score * 100) })}</span></div><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-lib-place="${m.id}">${L("app.plana_yerlestir")}</button></div>`).join("") || `<p class="uh-small">${L("app.gorselde_arka_plandan_ayrisan_tek_bir")}</p>`;
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
  toast(L("app.sahne_gorsele_gore_uyarlandi"), { action: L("top.geri_al"), onAction: undo });
}

/* ---------- Kaplama kütüphanesi ---------- */
const MAT_CATS = [["palet", L("app.paletim"), ["palet"]], ["zemin", L("kaplama.zemin"), ["zemin"]], ["ic", L("app.ic_duvar"), ["duvar", "ic-boya", "tavan"]], ["cephe", L("kaplama.dis_cephe_boyasi"), ["cephe", "kabuk"]], ["kaplama", L("kaplama.cephe_kaplamasi"), ["kaplama"]], ["mobilya", L("app.mobilya_ve_tekstil"), ["mobilya", "tekstil", "metal", "dekor", "genel"]], ["diger", L("app.diger"), ["dograma", "isik", "dis", "ice-aktarilan"]]];
function renderMaterials() {
  $("#matCats").innerHTML = MAT_CATS.map(([id, label]) => `<button type="button" role="tab" class="uh-tool ${S.matCat === id ? "is-active" : ""}" data-mat-cat="${id}">${label}</button>`).join("");
  const cats = MAT_CATS.find((c) => c[0] === S.matCat)[2];
  const list = S.scene.materials.filter((m) => cats.includes(m.category));
  const priced = ["zemin", "kaplama"].includes(S.matCat);
  $("#matGrid").innerHTML = list.map((m) => `<div class="uh-matcard ${S.paintMat === m.id ? "is-active" : ""}">
    <span class="uh-matball" style="background:radial-gradient(circle at 32% 28%, ${rgb(m.color, 1.25 + (1 - m.roughness) * 0.9)}, ${rgb(m.color)} 46%, ${rgb(m.color, 0.45)})" aria-hidden="true"></span>
    <div class="uh-matcard__body"><b title="${esc(N.matName(m))}">${esc(N.matName(m))}</b>
      <span class="uh-small">${L("app.puruz_metalik", { p: fmt(m.roughness), p2: fmt(m.metallic) })}</span>
      <div class="uh-matcard__row">${priced ? `<input class="pl-input uh-cell-input" type="number" min="0" step="10" value="${m.price_m2}" data-mat-price="${m.id}" aria-label="${L("app.m2_fiyati", { p: esc(N.matName(m)) })}"><span class="uh-small">₺/m²</span>` : ""}<span class="uh-grow"></span><button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-mat-apply="${m.id}">${L("app.uygula")}</button></div>
    </div></div>`).join("") || `<p class="uh-small">${L("app.bu_turde_kaplama_yok")}</p>`;
}
/* ---------- Renk kartelaları (duvar ve cephe boyası) ---------- */
const RAL_GROUPS = ["yellow and beige", "orange", "red", "violet", "blue", "green", "grey", "brown", "white and black"];
const PAINT_MAX = 400;
function paintColors() {
  if (S.paint.sys === "ral-classic") return (S.paint.ral || []).map((c) => ({ code: c.code, hex: c.hex, group: c.group, label: `RAL ${c.code}`, name: L(`ral.${c.code}`) }));
  const sys = (S.scene.paint_systems || []).find((p) => p.id === S.paint.sys);
  return sys ? sys.colors.map((c) => ({ code: c.code, hex: c.hex, group: c.group, label: c.code, name: c.name && c.name !== c.code ? c.name : "" })) : [];
}
const paintGroupName = (g) => (S.paint.sys === "ral-classic" ? L(`ralgroup.${N.slug(g)}`) : g || L("boya.grupsuz"));
const paintMatId = (code) => {
  const side = S.paint.target === "cephe" ? "dis" : "ic";
  return S.paint.sys === "ral-classic" ? `ral${code}-${side}` : null;
};
function renderPaints() {
  const systems = [["ral-classic", L("boya.ral_classic")], ...(S.scene.paint_systems || []).map((p) => [p.id, p.name])];
  if (!systems.some(([id]) => id === S.paint.sys)) S.paint.sys = "ral-classic";
  $("#paintSys").innerHTML = systems.map(([id, n]) => `<option value="${esc(id)}" ${S.paint.sys === id ? "selected" : ""}>${esc(n)}</option>`).join("");
  $("#paintTarget").value = S.paint.target;
  const all = paintColors();
  const groups = S.paint.sys === "ral-classic" ? RAL_GROUPS : [...new Set(all.map((c) => c.group))];
  if (S.paint.group !== "*" && !groups.includes(S.paint.group)) S.paint.group = "*";
  $("#paintGroups").innerHTML = [["*", L("boya.tumu")], ...groups.map((g) => [g, paintGroupName(g)])].map(([g, n]) => `<button type="button" role="tab" class="uh-tool ${S.paint.group === g ? "is-active" : ""}" data-paint-group="${esc(g)}">${esc(n)}</button>`).join("");
  const q = S.paint.q.toLocaleLowerCase();
  const list = all.filter((c) => (S.paint.group === "*" || c.group === S.paint.group) && (!q || `${c.label} ${c.name} ${c.hex}`.toLocaleLowerCase().includes(q)));
  const used = new Set(S.scene.materials.map((m) => m.id));
  $("#paintGrid").innerHTML = list.slice(0, PAINT_MAX).map((c) => {
    const id = paintMatId(c.code);
    return `<button type="button" class="uh-paintsw ${id && S.paintMat === id ? "is-active" : ""}" data-paint-code="${esc(c.code)}" title="${esc(`${c.label} ${c.name} · ${c.hex}`)}">
      <span class="uh-paintsw__chip" style="background:${esc(c.hex)}" aria-hidden="true"></span>
      <span class="uh-paintsw__code pl-num">${esc(c.label)}${id && used.has(id) ? ` <span class="uh-paintsw__in" aria-label="${L("boya.projede")}">●</span>` : ""}</span>
      <span class="uh-paintsw__name">${esc(c.name)}</span></button>`;
  }).join("") || `<p class="uh-small">${L("boya.sonuc_yok")}</p>`;
  $("#paintState").textContent = list.length > PAINT_MAX ? L("boya.ilk_n_gosteriliyor", { n: PAINT_MAX, total: list.length }) : L("boya.renk_sayisi", { n: list.length });
}
async function pickPaint(code) {
  const r = await B.engine("add_paint", { scene: S.scene, system: S.paint.sys, code, target: S.paint.target });
  if (!S.scene.materials.some((m) => m.id === r.id)) commit(r.scene);
  S.paintMat = r.id;
  P.setTool({ type: "paint", value: r.id });
  renderPaints();
  const m = S.scene.materials.find((x) => x.id === r.id);
  toast(L("boya.hazir", { name: N.matName(m) }), { sub: L("boya.hazir_ipucu"), action: L("boya.plana_git"), onAction: () => go("plan") });
}
async function importPaintSystem(files) {
  const f = files && files[0];
  if (!f) return;
  const r = await B.engine("import_paint_system", { scene: S.scene, name: f.name.replace(/\.[^.]+$/, ""), file: f.name, text: f.data ? undefined : f.text, data: f.data });
  commit(r.scene);
  S.paint.sys = r.id;
  S.paint.group = "*";
  S.paint.q = "";
  $("#paintSearch").value = "";
  renderPaints();
  toast(L("boya.kartela_eklendi", { n: r.count }), { sub: f.name });
}
async function twoTone(up, down) {
  const it = selected();
  if (!it || it.sel.type !== "wall") return;
  let sc = S.scene;
  const ids = [];
  for (const code of [up, down]) { const r = await B.engine("add_paint", { scene: sc, system: "ral-classic", code, target: "duvar" }); sc = r.scene; ids.push(r.id); }
  const s = JSON.parse(JSON.stringify(sc));
  const w = s.levels.find((l) => l.id === S.level).walls.find((x) => x.id === it.o.id);
  w.material = ids[0];
  w.lower = ids[1];
  w.split = w.split || 900;
  commit(s);
  renderInspector();
}

function baseDims(o) {
  if (o.mesh.startsWith("cat:")) { const c = S.catalog.furniture.find((f) => f.id === o.mesh.slice(4)); if (c) return [...c.size]; }
  const m = S.scene.meshes.find((x) => x.id === o.mesh);
  const [w, d] = P.objBase(o);
  const h = m && m.positions.length ? Math.max(...m.positions.map((p) => p[1])) : 1000;
  return [w, d, h];
}
async function importObj(given) {
  const files = Array.isArray(given) ? given : await B.openFiles("obj");
  if (!files || !files.length) return;
  const obj = files.find((f) => /\.obj$/i.test(f.name));
  const mtl = files.find((f) => /\.mtl$/i.test(f.name));
  if (!obj) { toast(L("app.bir_obj_dosyasi_secin_istege_bagli_mtl"), { kind: "warn" }); return; }
  const lv = S.scene.levels.find((l) => l.id === S.level) || S.scene.levels[0];
  const room = lv.rooms[0];
  let at = [1000, 1000];
  if (room) { const xs = room.polygon.map((p) => p[0]), ys = room.polygon.map((p) => p[1]); at = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; }
  const r = await B.engine("import_obj", { scene: S.scene, obj: obj.text, mtl: mtl ? mtl.text : null, unit: $("#objUnit").value, zUp: $("#objZup").checked, name: obj.name.replace(/\.obj$/i, ""), level: lv.id, at });
  commit(r.scene);
  $("#objResult").textContent = `${L("app.ucgen_m", { name: obj.name, p: r.triangles.toLocaleString(locale()), p2: r.size.map((x) => fmt(x / 1000)).join(" × "), p3: r.warnings.length ? " · " + r.warnings.map(LM).join(" · ") : "" })}`;
  toast(L("app.model_ice_aktarildi_ve_plana_eklendi"));
}

/* ---------- glTF ve Poly Haven ---------- */
const PH_CATS = ["seating", "table", "furniture", "lighting", "plants", "potted plants", "trees", "vases", "decorative", "shelves", "bed", "electronics", "appliances", "wall decoration", "books", "rocks"];
const PHT_CATS = ["floor", "wall", "wood", "plaster", "fabric", "tiles", "concrete", "brick", "rock", "metal", "roofing", "cobblestone", "gravel"];
function roomCenter() {
  const lv = S.scene.levels.find((l) => l.id === S.level) || S.scene.levels[0];
  const room = lv.rooms[0];
  if (!room) return { lv, at: [1000, 1000] };
  const xs = room.polygon.map((p) => p[0]), ys = room.polygon.map((p) => p[1]);
  return { lv, at: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] };
}
async function importGltf(pkg, license) {
  if (!pkg) return;
  const { lv, at } = roomCenter();
  const r = await B.engine("import_gltf", { scene: S.scene, files: pkg.files, main: pkg.main, name: pkg.name || pkg.main, level: lv.id, at, license: license || pkg.license || "" });
  commit(r.scene);
  S.texSig = "";
  const sub = L("ph.model_ozeti", { tris: r.triangles.toLocaleString(locale()), size: r.size.map((x) => fmt(x / 10, 0)).join(" × ") }) + (r.warnings.length ? ` · ${r.warnings.map(LM).join(" · ")}` : "");
  $("#objResult").textContent = sub;
  toast(L("ph.model_eklendi", { name: pkg.name || pkg.main }), { sub });
  return r;
}
function phCard(x, kind) {
  const busy = S.ph.busy.has(x.id);
  const dims = Array.isArray(x.dimensions) && x.dimensions.length >= 2 ? x.dimensions.slice(0, 3).map((v) => fmt(v / 10, 0)).join(" × ") + " cm" : "";
  const meta = kind === "models" ? L("ph.poligon", { n: Number(x.polycount || 0).toLocaleString(locale()) }) : dims;
  return `<div class="uh-libcard uh-phcard ${busy ? "is-busy" : ""}" data-ph="${esc(x.id)}"><div class="uh-libcard__thumb" data-phthumb="${esc(x.id)}">${S.ph.thumbs[x.id] ? `<img src="${S.ph.thumbs[x.id]}" alt="${esc(x.name)}" loading="lazy">` : `<span class="pl-badge">CC0</span>`}</div><b>${esc(x.name)}</b>
    <div class="uh-libcard__meta"><span>${esc(meta)}</span><span>${esc(kind === "models" ? dims : "")}</span></div>
    <div class="uh-small">${L("ph.yazar", { name: esc(x.authors || "Poly Haven") })}</div>
    <button class="pl-btn pl-btn--secondary pl-btn--sm" type="button" data-phget="${esc(x.id)}" data-phkind="${kind}">${busy ? L("ph.indiriliyor") : kind === "models" ? L("ph.indir_yerlestir") : L("ph.indir_kaplama")}</button></div>`;
}
async function loadPh(kind) {
  if (S.ph[kind] || S.ph.loading[kind]) return;
  S.ph.loading[kind] = true;
  try {
    S.ph[kind] = await B.phList(kind);
  } catch (e) {
    S.ph.error[kind] = LM(e.message || String(e));
  } finally {
    S.ph.loading[kind] = false;
  }
  if (kind === "models") renderPhModels(); else renderPhTextures();
}
function phThumbs(list) {
  for (const x of list) {
    if (S.ph.thumbs[x.id] !== undefined) continue;
    S.ph.thumbs[x.id] = "";
    B.phThumb(x.id).then((u) => { S.ph.thumbs[x.id] = u; const el = document.querySelector(`[data-phthumb="${CSS.escape(x.id)}"]`); if (el) el.innerHTML = `<img src="${u}" alt="${esc(x.name)}" loading="lazy">`; }).catch(() => {});
  }
}
function phFilter(list, cat, q) {
  const qq = q.toLocaleLowerCase(locale());
  return list.filter((x) => (cat === "*" || (x.categories || []).includes(cat)) && (!qq || `${x.name} ${(x.tags || []).join(" ")}`.toLocaleLowerCase(locale()).includes(qq))).slice(0, 60);
}
function renderPhModels() {
  $("#phCats").innerHTML = ["*", ...PH_CATS].map((c) => `<button type="button" role="tab" class="uh-tool ${S.ph.cat === c ? "is-active" : ""}" data-phcat="${esc(c)}">${c === "*" ? L("app.tumu") : L(`ph.cat.${N.slug(c)}`)}</button>`).join("");
  if (!S.ph.models) {
    $("#phState").textContent = S.ph.error.models ? L("ph.liste_alinamadi", { error: S.ph.error.models }) : L("ph.yukleniyor");
    $("#phGrid").innerHTML = "";
    loadPh("models");
    return;
  }
  const list = phFilter(S.ph.models, S.ph.cat, S.ph.q);
  $("#phState").textContent = L("ph.sonuc", { n: list.length, total: S.ph.models.length });
  $("#phGrid").innerHTML = list.map((x) => phCard(x, "models")).join("");
  phThumbs(list);
}
function renderPhTextures() {
  $("#phtCats").innerHTML = PHT_CATS.map((c) => `<button type="button" role="tab" class="uh-tool ${S.ph.tcat === c ? "is-active" : ""}" data-phtcat="${esc(c)}">${L(`ph.tcat.${N.slug(c)}`)}</button>`).join("");
  if (!S.ph.textures) {
    $("#phtState").textContent = S.ph.error.textures ? L("ph.liste_alinamadi", { error: S.ph.error.textures }) : L("ph.yukleniyor");
    $("#phtGrid").innerHTML = "";
    loadPh("textures");
    return;
  }
  const list = phFilter(S.ph.textures, S.ph.tcat, S.ph.tq);
  $("#phtState").textContent = L("ph.sonuc", { n: list.length, total: S.ph.textures.length });
  $("#phtGrid").innerHTML = list.map((x) => phCard(x, "textures")).join("");
  phThumbs(list);
}
async function phGet(id, kind) {
  const list = kind === "models" ? S.ph.models : S.ph.textures;
  const item = (list || []).find((x) => x.id === id);
  if (!item || S.ph.busy.has(id)) return;
  S.ph.busy.add(id);
  kind === "models" ? renderPhModels() : renderPhTextures();
  try {
    if (kind === "models") {
      const pkg = await B.phModel(id, $("#phRes").value);
      await importGltf({ ...pkg, name: item.name }, L("ph.lisans", { author: item.authors || "Poly Haven" }));
    } else {
      const pkg = await B.phTexture(id, $("#phRes").value);
      const scale = Array.isArray(item.dimensions) && item.dimensions[0] ? item.dimensions[0] : 2000;
      const target = $("#phtTarget").value;
      const r = await B.engine("add_pbr_material", { scene: S.scene, maps: pkg.maps, name: item.name, category: target, scale });
      // eklenen kaplamanın sekmesini aç
      S.matCat = { zemin: "zemin", duvar: "ic", kaplama: "kaplama", mobilya: "mobilya" }[target] || S.matCat;
      commit(r.scene);
      S.paintMat = r.id;
      S.texSig = "";
      toast(L("ph.kaplama_eklendi", { name: item.name }), { sub: L("ph.kaplama_ipucu") });
    }
  } finally {
    S.ph.busy.delete(id);
    kind === "models" ? renderPhModels() : renderPhTextures();
  }
}

/* ---------- MyMind ---------- */
const MM_TASK = {
  plan: L("app.asagidaki_konut_planini_degerlendir_gun"),
  malzeme: L("app.asagidaki_konut_icin_zemin_duvar_boyasi"),
  sira: L("app.asagidaki_konutun_ic_mekan_hazirligi"),
};
async function mmPrompt() {
  const f = await B.engine("mymind_summary", { scene: S.scene });
  const lines = [L("mm.konut", { modules: f.modules, levels: f.levels, area: fmt(f.floor_area_m2, 0) })];
  for (const r of f.rooms) {
    const k = S.catalog.roomKinds.find((x) => x.id === r.kind);
    lines.push(L("mm.mahal", { kind: k ? k.label : L("app.mahal_3"), name: N.roomName(r, S.catalog.roomKinds), area: fmt(r.area_m2, 1), windows: r.windows, doors: r.doors, daylight: fmt(r.daylight, 0) }));
  }
  if (f.items.length) lines.push(L("mm.donati", { list: f.items.map((x) => `${x.count} ${N.objectName({ mesh: x.mesh, name: x.name }, S.catalog.furniture)}`).join(", ") }));
  lines.push(L("mm.kalite", { tier: L(`tier.${f.tier}`) }));
  return `${MM_TASK[$("#mmTask").value]}\n\n${lines.join("\n")}`;
}
async function renderMyMind() {
  const st = await B.hubStatus().catch((e) => ({ available: false, reason: e.message }));
  $("#mymindState").textContent = st.available ? L("app.hazir") : L("nav.kapali");
  $("#hubBox").innerHTML = st.available
    ? `<span class="pl-badge pl-badge--success">${L("app.bagli")}</span> PluginLabs Hub · 127.0.0.1:47632`
    : `<span class="pl-badge">${L("app.bagli_degil")}</span> ${esc(st.reason || "")}${B.isDesktop ? `<div class="uh-row uh-mt"><input class="pl-input" type="password" id="hubKey" placeholder="${L("app.hub_istemci_anahtari")}" autocomplete="off"><button class="pl-btn pl-btn--secondary" type="button" id="btnHubKey">${L("app.anahtari_kaydet")}</button></div><p class="uh-small">${L("app.anahtar_windows_kimlik_bilgisi")}</p>` : ""}`;
  $("#mmPreview").textContent = await mmPrompt();
  $("#btnMmSend").disabled = !st.available;
}

/* ---------- komut paleti ---------- */
const COMMANDS = () => [
  [L("app.1_model"), () => go("model")], [L("app.2_katlar"), () => go("katlar")], [L("app.3_ic_plan"), () => go("plan")], [L("app.4_3b_ve_render"), () => go("uc")], [L("app.5_ozet_ve_disa_aktar"), () => go("ozet")],
  [L("common.olcu_ve_metraj"), () => go("olcu")], [L("common.maliyet_ve_olcekleme"), () => go("maliyet")], [L("common.fonksiyonlar"), () => go("fonksiyon")], [L("common.urun_kutuphanesi"), () => go("kutuphane")], [L("common.kaplama_kutuphanesi"), () => go("kaplama")], [L("common.tasarim_motorlari"), () => go("motor")], [L("common.gorselden_referans"), () => go("referans")], [L("common.karsilama"), () => go("karsilama")], [L("app.renk_paleti_yukle"), () => { go("kaplama"); $("#paletteInput").click(); }], ["MyMind", () => go("mymind")],
  [L("karsilama.ornek_projeyi_ac"), () => loadDemo()], [L("top.yeni_proje"), () => newProject()], [L("app.projeyi_kaydet_uhds"), () => exportAs("uhds")], [L("top.proje_ac"), () => exportAs("open")],
  [L("app.obj_ice_aktar"), () => run(importObj)], [L("app.obj_disa_aktar"), () => exportAs("obj")], [L("app.hd_render_al"), () => { go("uc"); setTimeout(doRender, 300); }], [L("top.geri_al"), () => undo()],
];
function openCmd() {
  const dlg = $("#cmdDialog");
  const input = $("#cmdInput");
  let idx = 0;
  const list = () => COMMANDS().filter(([n]) => n.toLocaleLowerCase(locale()).includes(input.value.toLocaleLowerCase(locale())));
  const draw = () => {
    const l = list();
    idx = Math.min(idx, Math.max(0, l.length - 1));
    $("#cmdList").innerHTML = l.map(([n], i) => `<button class="uh-cmditem ${i === idx ? "is-active" : ""}" role="option" type="button" data-i="${i}">${esc(n)}</button>`).join("") || `<p class="uh-small">${L("app.sonuc_yok")}</p>`;
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
    if (kind === "uhds") { const r = await B.engine("save_scene", { scene: S.scene }); const p = await B.saveText("uhds", `${base()}.uhds`, r.text); if (p) toast(L("app.proje_kaydedildi"), { sub: p }); }
    if (kind === "open") {
      const f = await B.openFiles("uhds");
      if (!f || !f.length) return;
      const r = await B.engine("load_scene", { text: f[0].text });
      S.undo = []; S.json = ""; S.camSet = false; K.fitted = false; P.fitted = false;
      commit(r.scene, { undo: false });
      syncCountsFromScene();
      toast(L("app.proje_acildi"), { sub: `${L("app.modul_nesne_sha_256_dogrulandi", { modules: r.info.modules, objects: r.info.objects })}` });
      go("katlar");
    }
    if (kind === "obj") {
      const r = await B.engine("export_obj", { scene: S.scene, basename: base() });
      const p = await B.saveText("obj", `${r.basename}.obj`, r.obj);
      if (!p) return;
      await B.saveText("mtl", `${r.basename}.mtl`, r.mtl);
      toast(L("app.obj_mtl_disa_aktarildi"), { sub: `${L("app.ucgen_metre", { p: r.triangles.toLocaleString(locale()) })}` });
    }
    if (kind === "plan-png") {
      const prev = S.view;
      if (prev !== "plan") { go("plan"); await new Promise((r) => setTimeout(r, 120)); }
      P.fit();
      await B.savePng(`${base()}-plan.png`, P.toPng());
      if (prev !== "plan") go(prev);
      toast(L("app.2b_plan_png_olarak_kaydedildi"));
    }
    if (kind === "render") { if (!S.lastRender) { toast(L("app.once_3b_adiminda_render_alin"), { kind: "warn" }); return; } await B.savePng(`${base()}-render.png`, S.lastRender); toast(L("app.render_kaydedildi")); }
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
  toast(L("app.ornek_proje_acildi"));
}

/* ---------- bağlama ---------- */
let K, P, V;
async function init() {
  K = new PlanCanvas($("#canvasK"), { mode: "katlar", onAction: onKatAction });
  P = new PlanCanvas($("#canvasP"), { mode: "plan", onAction: onPlanAction });
  V = new View3D($("#canvas3d"), $("#view3dInfo"));
  V.hooks = hooks3d;
  try {
    const info = await B.engine("info");
    $("#engineInfo").textContent = `${L("app.rust_motoru", { version: info.version, p: B.isDesktop ? L("app.yerel") : L("app.webassembly_onizleme") })}`;
    S.catalog = await B.engine("catalog");
    S.paint.ral = (await B.engine("paint_systems"))[0].colors;
    // görünen adlar seçili dile çevrilir; motorun özgün adları eşleştirme için saklanır
    for (const x of S.catalog.furniture) { x.name_src = x.name; x.group_src = x.group; x.name = N.catName(x); x.group = N.groupName(x.group); }
    for (const o of S.catalog.openings) { o.label_src = o.label; o.label = N.openingName(o); }
    for (const k of S.catalog.roomKinds) { k.label_src = k.label; k.label = N.roomKindName(k); }
    S.motorParams = await B.engine("motor_defaults");
    S.texKinds = await B.engine("texture_kinds");
  } catch (e) {
    $("#engineInfo").textContent = L("app.motor_yuklenemedi");
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
    S.saved = saved;
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
  let back = null;
  try { back = sessionStorage.getItem("uh-resume"); sessionStorage.removeItem("uh-resume"); } catch { /* depolama kapalı olabilir */ }
  const v = params.get("view");
  if (back && saved) { await resumeSaved(); go(back); }
  else if (v) go(v);
  else if (params.get("demo") !== "1") go("karsilama");
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
    $("#overlapText").textContent = ov.map(([a, b]) => `${L("app.ve_ust_uste_biniyor", { a, b })}`).join(" · ");
    if (r.notes.length) toast(r.notes.map(LM).join(" · "), { kind: "warn", action: L("top.geri_al"), onAction: undo });
  });
  if (kind === "rotate") return rotateModule();
}
function rotateModule() {
  if (!K.sel || K.sel.type !== "module") return;
  return run(async () => {
    const r = await B.engine("rotate_module", { scene: S.scene, id: K.sel.id });
    commit(r.scene);
    if (r.notes.length) toast(r.notes.map(LM).join(" · "), { kind: "warn", action: L("top.geri_al"), onAction: undo });
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
  if (lp) { P.setTool({ type: "furniture", value: lp.dataset.libPlace }); go("plan"); toast(L("app.urunu_yerlestirmek_icin_plana_tiklayin"), { sub: N.catName(S.catalog.furniture.find((f) => f.id === lp.dataset.libPlace) || { id: "", name: "" }) }); return; }
  const mc = t.closest("[data-mat-cat]");
  if (mc) { S.matCat = mc.dataset.matCat; renderMaterials(); return; }
  const ma = t.closest("[data-mat-apply]");
  if (ma) { S.paintMat = ma.dataset.matApply; P.setTool({ type: "paint", value: S.paintMat }); go("plan"); toast(L("app.kaplamayi_uygulamak_icin_mahale_duvara")); return; }
  const act = t.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "two-tone") run(() => twoTone(act.dataset.up, act.dataset.down));
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
      if (!last) { toast(L("app.geri_alinacak_bolme_yok"), { kind: "warn" }); return; }
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
      run(async () => { const r = await B.engine("refresh", { scene: s }); commit(r.scene); toast(`${L("app.bolme_arsivlendi_2", { length: parts.length })}`, { action: L("top.geri_al"), onAction: undo }); });
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
  const d3 = t.closest("[data-3d]");
  if (d3) { act3d(d3.dataset["3d"]); return; }
  if (t.id === "btnLook") { $("#lookInput").click(); return; }
  const real = t.closest("[data-lib-real]");
  if (real) {
    const id = real.dataset.libReal;
    real.classList.add("is-loading");
    run(async () => {
      try {
        const r = await B.engine("object_render", { scene: S.scene, cat: id, width: 400, height: 300, samples: B.isDesktop ? 48 : 12 });
        S.thumbs[id] = r.png;
        const box = $(`[data-thumb="${id}"]`);
        if (box) box.innerHTML = `<img src="data:image/png;base64,${r.png}" alt="${L("app.gercekci_onizleme_2")}">`;
      } finally { real.classList.remove("is-loading"); }
    });
    return;
  }
  const cam = t.closest("[data-cam]");
  if (cam) { run(() => camera(cam.dataset.cam)); return; }
  const ex = t.closest("[data-export]");
  if (ex) { exportAs(ex.dataset.export); return; }
  const fa = t.closest("[data-fn-archive]");
  if (fa) { const s = clone(); const [f] = s.functions.splice(Number(fa.dataset.fnArchive), 1); s.archive.push({ type: "function", item: f }); commit(s); toast(L("app.fonksiyon_arsivlendi"), { action: L("top.geri_al"), onAction: undo }); return; }
  const pm = t.closest("[data-place-mesh]");
  if (pm) {
    const s = clone();
    const m = s.meshes.find((x) => x.id === pm.dataset.placeMesh);
    s.objects.push({ id: nextId("N", s.objects), name: m.name, mesh: m.id, level: S.level, position: [1500, 1500, 0], rotation: 0, scale: [1, 1, 1], material: null, price: 0, quantity: 1 });
    commit(s);
    toast(L("app.model_plana_eklendi_ic_plan_adiminda"));
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
$("#btnMotorReal").onclick = () => run(async () => {
  const b = $("#btnMotorReal");
  b.classList.add("is-loading");
  try {
    const r = await B.engine("object_render", { scene: S.scene, motor: S.motor, params: S.motorParams[S.motor], width: 720, height: 520, samples: B.isDesktop ? 64 : 16 });
    $("#motorReal").src = `data:image/png;base64,${r.png}`;
    $("#motorReal").hidden = false;
  } finally { b.classList.remove("is-loading"); }
});
$("#lookInput").addEventListener("change", (e) => run(() => uploadLook(e.target.files[0])));
$("#btnPalette").onclick = () => $("#paletteInput").click();
$("#paletteInput").addEventListener("change", (e) => run(async () => { const f = e.target.files[0]; if (f) await loadPalette(f.name.replace(/\.[^.]+$/, ""), await f.text()); }));
$("#btnRefPalette").onclick = () => run(async () => { if (S.ref) await loadPalette(L("app.referans_gorsel"), S.ref.palette.map((p) => srgbHex(p.color)).join("\n")); });
$("#btnWelcomeResume").onclick = () => run(resumeSaved);
$("#btnWelcomeNew").onclick = () => run(newProject);
$("#btnWelcomeDemo").onclick = () => run(loadDemo);
$("#btnWelcomeOpen").onclick = () => exportAs("open");
segment("#segElev", "side", (s) => { S.elevSide = s; renderWelcome(); });
segment("#seg3dMode", "mode", (m) => { V.edit = m === "duzenle"; $("#canvas3d").style.cursor = V.edit ? "pointer" : ""; });
/* sürükle bırak: ürün düğmeleri ve kartları → plan ya da 3B sahne; dosyalar → pencere */
document.addEventListener("dragstart", (e) => {
  const el = e.target.closest && e.target.closest("[data-drag-item]");
  if (el) { e.dataTransfer.setData("text/plain", "uhd-item:" + el.dataset.dragItem); e.dataTransfer.effectAllowed = "copy"; }
});
for (const [id, kind] of [["#canvasP", "plan"], ["#canvas3d", "uc"]]) {
  const cv = $(id);
  cv.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; cv.classList.add("is-drop"); });
  cv.addEventListener("dragleave", () => cv.classList.remove("is-drop"));
  cv.addEventListener("drop", (e) => {
    cv.classList.remove("is-drop");
    const data = e.dataTransfer.getData("text/plain");
    if (!data.startsWith("uhd-item:")) return;
    e.preventDefault();
    e.stopPropagation();
    const cat = data.slice(9);
    if (kind === "plan") {
      const p = P.toWorld(e);
      const idNew = placeItem(cat, p[0], p[1], S.level);
      if (idNew) { P.sel = { type: "object", id: idNew }; renderPlan(); }
    } else {
      const hit = V.pick(e);
      const p = hit ? hit.point : V.planePoint(e, S.scene.levels[0].elevation);
      if (!p) return;
      const lv = [...S.scene.levels].sort((a, b) => b.elevation - a.elevation).find((l) => p[1] >= l.elevation - 200) || S.scene.levels[0];
      S.sel3 = placeItem(cat, p[0], p[2], lv.id);
    }
  });
}
const mainEl = $(".uh-main");
mainEl.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); mainEl.classList.add("is-drop"); } });
mainEl.addEventListener("dragleave", (e) => { if (e.target === mainEl) mainEl.classList.remove("is-drop"); });
mainEl.addEventListener("drop", (e) => {
  mainEl.classList.remove("is-drop");
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  run(() => handleFiles(e.dataTransfer.files));
});
$("#selLang").value = getLang();
$("#selLang").addEventListener("change", (e) => run(async () => {
  setLang(e.target.value);
  clearTimeout(S.saveTimer);
  if (S.scene) {
    const r = await B.engine("save_scene", { scene: S.scene });
    await B.autosaveWrite(r.text);
    try { sessionStorage.setItem("uh-resume", S.view); } catch { /* depolama kapalı olabilir */ }
  }
  location.reload();
}));
$("#segEngine").addEventListener("click", (e) => {
  const b = e.target.closest("[data-engine]");
  if (!b) return;
  S.engine = b.dataset.engine;
  $$("#segEngine [data-engine]").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-checked", String(x === b)); });
  run(cyclesState);
});
$("#btnCyclesPath").onclick = () => run(async () => { const p = await B.cyclesPick(); if (p) { toast(L("app.blender_kaydedildi"), { sub: p }); await cyclesState(); } });
$("#btnRenderCancel").onclick = () => run(async () => { await B.cyclesCancel(); toast(L("app.cycles_iptal_edildi"), { kind: "warn" }); });
$("#btnGltfImport").onclick = () => run(async () => importGltf(await B.openModel()));
$("#phCats").addEventListener("click", (e) => { const b = e.target.closest("[data-phcat]"); if (b) { S.ph.cat = b.dataset.phcat; renderPhModels(); } });
$("#phtCats").addEventListener("click", (e) => { const b = e.target.closest("[data-phtcat]"); if (b) { S.ph.tcat = b.dataset.phtcat; renderPhTextures(); } });
$("#phSearch").addEventListener("input", (e) => { S.ph.q = e.target.value.trim(); renderPhModels(); });
$("#phtSearch").addEventListener("input", (e) => { S.ph.tq = e.target.value.trim(); renderPhTextures(); });
$("#paintSys").addEventListener("change", (e) => { S.paint.sys = e.target.value; S.paint.group = "*"; renderPaints(); });
$("#paintTarget").addEventListener("change", (e) => { S.paint.target = e.target.value; renderPaints(); });
$("#paintSearch").addEventListener("input", (e) => { S.paint.q = e.target.value.trim(); renderPaints(); });
$("#paintGroups").addEventListener("click", (e) => { const b = e.target.closest("[data-paint-group]"); if (b) { S.paint.group = b.dataset.paintGroup; renderPaints(); } });
$("#paintGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-paint-code]"); if (b) run(() => pickPaint(b.dataset.paintCode)); });
$("#btnPaintImport").onclick = () => run(async () => importPaintSystem(await B.openFiles("palette")));
for (const g of ["#phGrid", "#phtGrid"]) $(g).addEventListener("click", (e) => { const b = e.target.closest("[data-phget]"); if (b) run(() => phGet(b.dataset.phget, b.dataset.phkind)); });
$("#btnRefPick").onclick = () => $("#refInput").click();
$("#btnPhotoPick").onclick = () => $("#photoInput").click();
$("#photoInput").addEventListener("change", (e) => run(() => photoPick(e.target.files[0])));
$("#btnPhotoBuild").onclick = () => run(buildFromPhoto);
$("#btnSpaceManual").onclick = () => run(addManualSpace);
["phRefKind", "phRefVal", "phFov", "phFovAuto"].forEach((id) => $("#" + id).addEventListener("change", () => {
  $("#phFovBox").hidden = $("#phFovAuto").checked;
  if (id === "phRefKind") $("#phRefVal").value = { yukseklik: 265, genislik: 400, kamera: 150, derinlik: 300 }[$("#phRefKind").value];
  photoSolve();
}));
$$("[data-phtool]").forEach((b) => (b.onclick = () => { if (!S.photo) return; S.photo.tool = S.photo.tool === b.dataset.phtool ? null : b.dataset.phtool; renderPhoto(); }));
$("#phOpenings").addEventListener("click", (e) => { const b = e.target.closest("[data-phdel]"); if (!b) return; S.photo.openings.splice(Number(b.dataset.phdel), 1); renderPhoto(); photoSolve(); });
{
  const svg = $("#phSvg");
  svg.addEventListener("pointerdown", (e) => {
    const p = S.photo;
    if (!p) return;
    const g = e.target.closest("[data-pt]");
    if (p.tool) { const a = phPoint(e); p.drag = { rect: { wall: $("#phWall").value, kind: p.tool, a, b: a } }; }
    else if (g) p.drag = { pt: g.dataset.pt };
    else return;
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener("pointermove", (e) => {
    const d = S.photo?.drag;
    if (!d) return;
    if (d.rect) { d.rect.b = phPoint(e); drawPhoto(); return; }
    S.photo.pts[d.pt] = phPoint(e);
    photoSolve();
  });
  const end = () => {
    const p = S.photo;
    const d = p?.drag;
    if (!d) return;
    p.drag = null;
    if (d.rect) {
      p.tool = null;
      if (Math.abs(d.rect.b[0] - d.rect.a[0]) > p.w * 0.01 && Math.abs(d.rect.b[1] - d.rect.a[1]) > p.h * 0.01) p.openings.push(d.rect);
      renderPhoto();
    }
    photoSolve();
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest?.("[data-pt]");
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!g || !step || !S.photo) return;
    e.preventDefault();
    const k = e.shiftKey ? 10 : 1;
    const id = g.dataset.pt;
    const q = S.photo.pts[id];
    S.photo.pts[id] = [Math.min(S.photo.w, Math.max(0, q[0] + step[0] * k)), Math.min(S.photo.h, Math.max(0, q[1] + step[1] * k))];
    photoSolve().then(() => $(`#phSvg [data-pt="${id}"]`)?.focus());
  });
}
$("#spaceRows").addEventListener("change", (e) => {
  const tr = e.target.closest("[data-sp]");
  const k = e.target.dataset.k;
  if (!tr || !k) return;
  run(async () => {
    const arg = { scene: S.scene, id: tr.dataset.sp, lock: $("#spLock").checked };
    if (k === "name") arg.name = e.target.value.trim() || L("foto.oda"); else arg[k] = Number(e.target.value) * 10;
    const r = await B.engine("set_space", arg);
    commit(r.scene);
    if (r.extra.notes.length) toast(LM(r.extra.notes[0]), { kind: "warn" });
  });
});
$("#spaceRows").addEventListener("click", (e) => {
  const b = e.target.closest("[data-spact]");
  if (!b) return;
  const id = b.closest("[data-sp]").dataset.sp;
  if (b.dataset.spact === "view") { openSpace(id); return; }
  run(async () => { const r = await B.engine("archive_space", { scene: S.scene, id }); commit(r.scene); toast(L("app.oda_arsivlendi"), { action: L("top.geri_al"), onAction: undo }); });
});
window.addEventListener("resize", () => { if (S.view === "foto") drawPhoto(); });
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
  if (!counts.length) { toast(L("app.en_az_bir_modul_secin"), { kind: "warn" }); return; }
  const r = await B.engine("set_modules", { scene: S.scene, counts, twoStorey: S.storey === 2 });
  K.fitted = false; P.fitted = false;
  commit(r.scene);
  if (r.notes.length) toast(r.notes.map(LM).join(" · "), { kind: "warn" });
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
  if (!name) { toast(L("app.kaplama_adi_gerekli"), { kind: "warn" }); return; }
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
  toast(L("app.kaplama_eklendi"), { sub: name });
};
$("#btnFnTest").onclick = () => run(async () => {
  const d = fnDraft();
  try {
    const r = await B.engine("eval_formula", { scene: S.scene, expr: d.expr });
    $("#fnResult").innerHTML = `${L("app.sonuc_2")} <b class="pl-num">${fmt(r.value)}</b> ${L("app.kullanilan_degiskenler", { p: esc(d.unit), p2: r.uses.map(esc).join(", ") || "—" })}`;
  } catch (e) { $("#fnResult").innerHTML = `<span class="pl-badge pl-badge--danger">${L("app.hata")}</span> ${esc(e.message)}`; }
});
$("#btnFnAdd").onclick = () => run(async () => {
  const d = fnDraft();
  if (!d.name || !d.id || !d.expr) { toast(L("app.ad_ve_formul_gerekli"), { kind: "warn" }); return; }
  if (S.scene.functions.some((f) => f.id === d.id)) { toast(L("app.bu_kimlik_kullaniliyor"), { kind: "warn" }); return; }
  await B.engine("eval_formula", { scene: S.scene, expr: d.expr });
  const s = clone();
  s.functions.push(d);
  commit(s);
  toast(L("app.fonksiyon_eklendi"));
});
$("#btnMmSend").onclick = () => run(async () => {
  const prompt = await mmPrompt();
  $("#btnMmSend").classList.add("is-loading");
  try {
    const r = await B.mymind(prompt, true);
    $("#mmAnswer").innerHTML = `<p><span class="pl-badge pl-badge--pro">MyMind</span> <span class="uh-small">${L("app.yalniz_oneri", { p: esc(r.source) })}</span></p><div>${esc(r.text)}</div>`;
  } finally { $("#btnMmSend").classList.remove("is-loading"); }
});
document.addEventListener("click", (e) => {
  if (e.target.id === "btnHubKey") run(async () => { await B.hubSetKey($("#hubKey").value); toast(L("app.hub_anahtari_kaydedildi")); renderMyMind(); });
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmd(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); exportAs("uhds"); }
});

init();
