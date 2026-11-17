/* Motor ve işletim sistemi köprüsü.
 * Masaüstü (Tauri): Rust komutları; dosya diyalogları, otomatik kayıt ve MyMind ana süreçte.
 * Tarayıcı önizlemesi: aynı Rust motoru WebAssembly işçisinde; dosyalar tarayıcı indirme/yükleme ile. */
import { t as L, tr as LM } from "./i18n.js";
const T = window.__TAURI__ && window.__TAURI__.core;
export const isDesktop = !!T;

let worker = null;
let seq = 0;
const waiting = new Map();
function getWorker() {
  if (!worker) {
    worker = new Worker("engine-worker.js");
    worker.onmessage = (e) => {
      const w = waiting.get(e.data.id);
      if (w) { waiting.delete(e.data.id); w(e.data.text); }
    };
  }
  return worker;
}

export async function engine(cmd, payload = {}) {
  const body = JSON.stringify(payload);
  let text;
  if (T) text = await T.invoke("engine", { cmd, payload: body });
  else text = await new Promise((res) => { const id = ++seq; waiting.set(id, res); getWorker().postMessage({ id, cmd, payload: body }); });
  const r = JSON.parse(text);
  if (!r.ok) throw new Error(r.error ? LM(r.error) : L("bridge.motor_hatasi"));
  return r.data;
}

const KEY = "uhd-autosave-v1";
export async function autosaveWrite(text) {
  if (T) return T.invoke("autosave_write", { text });
  try { localStorage.setItem(KEY, text); } catch { /* özel pencere */ }
}
export async function autosaveRead() {
  if (T) return T.invoke("autosave_read");
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function download(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/** Metin dosyası kaydeder. kind: uhds | obj | mtl */
export async function saveText(kind, name, text) {
  if (T) return T.invoke("save_file", { kind, name, text, base64: null });
  download(name, new Blob([text], { type: "text/plain" }));
  return name;
}
/** PNG kaydeder (base64). */
export async function savePng(name, b64) {
  if (T) return T.invoke("save_file", { kind: "png", name, text: null, base64: b64 });
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  download(name, new Blob([u], { type: "image/png" }));
  return name;
}

/** Dosya açar. kind: uhds | obj. Dönüş: [{name, text}] */
export async function openFiles(kind) {
  if (T) return T.invoke("open_files", { kind });
  const input = document.getElementById("fileInput");
  input.value = "";
  input.multiple = kind === "obj";
  input.accept = kind === "obj" ? ".obj,.mtl" : kind === "palette" ? ".ase,.gpl,.csv,.txt" : ".uhds";
  return new Promise((res) => {
    input.onchange = async () => {
      const out = [];
      for (const f of input.files) {
        if (f.size > (kind === "palette" ? 4 : 64) * 1024 * 1024) continue;
        if (kind === "palette" && /\.ase$/i.test(f.name)) {
          const b = new Uint8Array(await f.arrayBuffer());
          let bin = "";
          for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
          out.push({ name: f.name, text: "", data: btoa(bin) });
          continue;
        }
        out.push({ name: f.name, text: await f.text() });
      }
      res(out);
    };
    input.click();
  });
}

/* ---------- Poly Haven (CC0) ----------
 * Masaüstünde indirme Rust tarafında (yalnız Poly Haven alanları, MD5 doğrulama, önbellek).
 * Tarayıcı önizlemesinde aynı kaynağın "polyhaven/" yolu kullanılır (geliştirme/test sunucusu sağlar). */
async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("@ph_network");
  return r.json();
}
export async function phList(kind) { return T ? T.invoke("ph_list", { kind }) : getJson(`polyhaven/list/${kind}`); }
export async function phThumb(id) {
  if (T) return `data:image/png;base64,${await T.invoke("ph_thumb", { id })}`;
  return `polyhaven/thumb/${encodeURIComponent(id)}`;
}
export async function phModel(id, res) { return T ? T.invoke("ph_model", { id, res }) : getJson(`polyhaven/model/${encodeURIComponent(id)}/${res}`); }
export async function phTexture(id, res) { return T ? T.invoke("ph_texture", { id, res }) : getJson(`polyhaven/texture/${encodeURIComponent(id)}/${res}`); }

function b64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
/** Dosya listesini glTF paketine çevirir: { main, files: {ad: base64}, name } */
export async function filesToModel(list) {
  const main = list.find((f) => /\.(glb|gltf)$/i.test(f.name));
  if (!main) return null;
  const files = {};
  let total = 0;
  for (const f of list) {
    total += f.size;
    if (total > 256 * 1024 * 1024) throw new Error("@gltf_too_large");
    files[f.webkitRelativePath && f.webkitRelativePath.includes("/") ? f.webkitRelativePath.split("/").slice(1).join("/") : f.name] = b64(await f.arrayBuffer());
  }
  return { main: main.name, files, name: main.name.replace(/\.(glb|gltf)$/i, "") };
}
export async function openModel() {
  if (T) return T.invoke("open_model");
  const input = document.getElementById("modelInput");
  input.value = "";
  return new Promise((res) => {
    input.onchange = async () => res(await filesToModel([...input.files]));
    input.click();
  });
}

export async function hubStatus() {
  if (!T) return { available: false, reason: L("bridge.mymind_yalniz_masaustu_uygulamasinda") };
  return T.invoke("hub_status");
}
export async function cyclesStatus() { return T ? T.invoke("cycles_status") : { available: false, browser: true }; }
export async function cyclesPick() { return T.invoke("cycles_pick"); }
export async function cyclesCancel() { if (T) await T.invoke("cycles_cancel"); }
/** Cycles render: ilerleme satırları onProgress ile bildirilir. */
export async function cyclesRender(payload, onProgress) {
  const ev = window.__TAURI__ && window.__TAURI__.event;
  const stop = ev ? await ev.listen("cycles-progress", (e) => onProgress && onProgress(e.payload)) : null;
  try {
    return await T.invoke("cycles_render", { payload: JSON.stringify(payload) });
  } catch (e) {
    throw new Error(LM(String(e && e.message ? e.message : e)));
  } finally {
    if (stop) stop();
  }
}
/** Hub'daki paket lisansları. Tarayıcı önizlemesinde yalnız test düzeneği (packkey/packlic) verir. */
export async function hubLicenses() {
  if (T) return T.invoke("hub_licenses");
  const q = new URLSearchParams(location.search);
  if (q.get("packkey") && q.get("packlic")) {
    getWorker().postMessage({ trustKey: q.get("packkey") });
    return { available: true, licenses: q.get("packlic").split(",") };
  }
  return { available: false, licenses: [], reason: "@pack_desktop_only" };
}
export async function hubSetKey(key) { return T.invoke("hub_set_key", { key }); }
export async function mymind(prompt, approved) {
  if (!T) throw new Error(L("bridge.mymind_yalniz_masaustu_uygulamasinda_2"));
  return T.invoke("mymind", { prompt, approved });
}
