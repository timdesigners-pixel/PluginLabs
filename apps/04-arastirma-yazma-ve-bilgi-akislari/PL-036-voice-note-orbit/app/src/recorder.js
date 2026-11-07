/* Voice Note Orbit — kayıt ve ses dönüştürme (arayüz tarafı; ana pencere ve balon ortak kullanır).
 * Basılı tutarak kayıt: start() mikrofonu açar, stop() kapatır — bırakınca mikrofon izi (track) hemen durdurulur; sürekli dinleme yoktur.
 * Ses 16 kHz mono 16 bit WAV'a indirgenir (yerel whisper sunucularının ortak biçimi). Dosyadan içe aktarmada çözme aynı biçime dönüştürür. */
(function (root) {
  "use strict";
  const RATE = 16000;
  function downsample(chunks, inRate) {
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const all = new Float32Array(total);
    let o = 0;
    for (const c of chunks) { all.set(c, o); o += c.length; }
    if (inRate === RATE) return all;
    const ratio = inRate / RATE;
    const out = new Float32Array(Math.floor(total / ratio));
    for (let i = 0; i < out.length; i++) {
      // Basit kutu süzgeci (örtüşme bozulmasını azaltır)
      const a = Math.floor(i * ratio), b = Math.min(total, Math.floor((i + 1) * ratio));
      let s = 0;
      for (let k = a; k < b; k++) s += all[k];
      out[i] = b > a ? s / (b - a) : all[a] || 0;
    }
    return out;
  }
  function wav(samples) {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, RATE, true);
    v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) { const x = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
    return new Uint8Array(buf);
  }
  /** Basılı tutarak kayıt. onLevel(0..1) seviye göstergesi için, onTick(saniye) sayaç için; maxSeconds dolunca onLimit çağrılır. */
  function createRecorder(o) {
    o = o || {};
    let stream = null, ctx = null, node = null, src = null, chunks = [], t0 = 0, timer = null, rate = 48000, active = false;
    async function start() {
      if (active) return;
      active = true;
      chunks = [];
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      } catch (e) { active = false; throw new Error(e && e.name === "NotAllowedError" ? "Mikrofon izni verilmedi. Windows Ayarlar → Gizlilik → Mikrofon bölümünden masaüstü uygulamalarına izin verin." : e && e.name === "NotFoundError" ? "Mikrofon bulunamadı." : "Mikrofon açılamadı: " + (e && e.message ? e.message : e)); }
      if (!active) { stream.getTracks().forEach((t) => t.stop()); stream = null; return; }
      ctx = new AudioContext();
      rate = ctx.sampleRate;
      src = ctx.createMediaStreamSource(stream);
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (e) => {
        if (!active) return;
        const d = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(d));
        let peak = 0;
        for (let i = 0; i < d.length; i += 8) peak = Math.max(peak, Math.abs(d[i]));
        if (o.onLevel) o.onLevel(Math.min(1, peak * 1.6));
      };
      src.connect(node);
      node.connect(ctx.destination);
      t0 = performance.now();
      timer = setInterval(() => {
        const s = (performance.now() - t0) / 1000;
        if (o.onTick) o.onTick(s);
        if (s >= (o.maxSeconds ? o.maxSeconds() : 60) && o.onLimit) o.onLimit();
      }, 200);
    }
    /** Kaydı durdurur; { wav, seconds } döner (çok kısa ise null). */
    async function stop() {
      if (!active) return null;
      active = false;
      clearInterval(timer);
      const seconds = (performance.now() - t0) / 1000;
      try { if (src) src.disconnect(); if (node) node.disconnect(); } catch { /* yok */ }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (ctx) await ctx.close().catch(() => {});
      ctx = null;
      if (o.onLevel) o.onLevel(0);
      const pcm = downsample(chunks, rate);
      chunks = [];
      if (pcm.length < RATE * 0.3) return { wav: null, seconds };
      return { wav: wav(pcm), seconds: pcm.length / RATE };
    }
    function cancel() { if (active) stop(); }
    return { start, stop, cancel, get active() { return active; } };
  }
  /** Ses dosyası baytları → 16 kHz mono WAV (tarayıcının çözebildiği biçimler: wav, mp3, ogg/opus, webm, flac, m4a/aac). */
  async function toWav(bytes, maxSeconds) {
    const ctx = new AudioContext();
    let buf;
    try { buf = await ctx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)); }
    catch { throw new Error("Ses dosyası çözülemedi (desteklenen: WAV, MP3, OGG/Opus, WebM, FLAC, M4A)."); }
    finally { ctx.close().catch(() => {}); }
    if (buf.duration > maxSeconds) throw new Error("Ses dosyası " + Math.round(maxSeconds / 60) + " dakikadan uzun; kısa notlar içindir.");
    const off = new OfflineAudioContext(1, Math.ceil(buf.duration * RATE), RATE);
    const s = off.createBufferSource();
    s.buffer = buf;
    s.connect(off.destination);
    s.start();
    const out = await off.startRendering();
    return { wav: wav(out.getChannelData(0)), seconds: buf.duration };
  }
  const api = { createRecorder, toWav, wav, downsample, RATE };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.VNRec = api;
})(typeof self !== "undefined" ? self : this);
