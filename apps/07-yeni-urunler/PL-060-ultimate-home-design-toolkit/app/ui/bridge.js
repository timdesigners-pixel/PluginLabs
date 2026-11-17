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
  input.accept = kind === "obj" ? ".obj,.mtl" : ".uhds";
  return new Promise((res) => {
    input.onchange = async () => {
      const out = [];
      for (const f of input.files) {
        if (f.size > 64 * 1024 * 1024) continue;
        out.push({ name: f.name, text: await f.text() });
      }
      res(out);
    };
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
export async function hubSetKey(key) { return T.invoke("hub_set_key", { key }); }
export async function mymind(prompt, approved) {
  if (!T) throw new Error(L("bridge.mymind_yalniz_masaustu_uygulamasinda_2"));
  return T.invoke("mymind", { prompt, approved });
}
