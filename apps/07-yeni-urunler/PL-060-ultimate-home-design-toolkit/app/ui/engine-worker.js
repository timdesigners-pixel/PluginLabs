/* Tarayıcı önizlemesi: Rust motoru WebAssembly olarak bu işçide çalışır (arayüz donmaz). */
let ex = null;
const enc = new TextEncoder();
const dec = new TextDecoder();
const ready = fetch("engine/uhd_engine.wasm")
  .then((r) => { if (!r.ok) throw new Error("@worker_file"); return r.arrayBuffer(); })
  .then((b) => WebAssembly.instantiate(b, {}))
  .then((m) => { ex = m.instance.exports; });

function put(str) {
  const b = enc.encode(str);
  if (!b.length) return [0, 0];
  const p = ex.uhd_alloc(b.length);
  new Uint8Array(ex.memory.buffer, p, b.length).set(b);
  return [p, b.length];
}

self.onmessage = async (e) => {
  const { id, cmd, payload } = e.data;
  try {
    await ready;
    const [cp, cl] = put(cmd);
    const [pp, pl] = put(payload);
    const r = ex.uhd_call(cp, cl, pp, pl);
    ex.uhd_free(cp, cl);
    ex.uhd_free(pp, pl);
    const len = new DataView(ex.memory.buffer).getUint32(r, true);
    const text = dec.decode(new Uint8Array(ex.memory.buffer, r + 4, len).slice());
    ex.uhd_free_result(r);
    self.postMessage({ id, text });
  } catch (err) {
    self.postMessage({ id, text: JSON.stringify({ ok: false, error: String(err && err.message || err) }) });
  }
};
