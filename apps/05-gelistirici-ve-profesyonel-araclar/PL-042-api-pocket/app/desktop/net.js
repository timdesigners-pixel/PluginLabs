/* API Pocket — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * • API isteği: yalnız GET, yalnız http/https, yalnız kullanıcı "Gönder"e bastığında. Yönlendirme otomatik izlenmez (3xx ve Location
 *   gösterilir; kimlik bilgisi başka bir sunucuya taşınmaz). Çerez saklanmaz, önbellek kullanılmaz. Yanıt boyutu ve süre sınırlı.
 * • Yapay zekâ: yalnız bu bilgisayardaki MyMind (PluginLabs Hub 127.0.0.1:47632) ya da loopback yerel model; her istek ayrı onaylı. */
const HUB_URL = "http://127.0.0.1:47632";

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}

/** Tek GET isteği. Dönüş: durum, başlıklar, gövde (metin; ikili içerik metne çevrilmez), süre, boyut. */
async function request({ url, headers, timeoutMs, maxBytes, userAgent }) {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Yalnız http:// ve https:// adresleri.");
  const h = new Headers();
  for (const [k, v] of headers || []) h.append(k, v);
  if (userAgent && !h.has("user-agent")) h.set("User-Agent", userAgent);
  const t0 = performance.now();
  let r;
  try {
    r = await fetch(u, { method: "GET", headers: h, redirect: "manual", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(timeoutMs || 30000) });
  } catch (err) {
    const c = err && (err.cause || err);
    const code = c && c.code;
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) throw new Error("Zaman aşımı: sunucu " + Math.round((timeoutMs || 30000) / 1000) + " sn içinde yanıt vermedi.");
    if (code === "ECONNREFUSED") throw new Error("Bağlantı reddedildi (" + u.host + ") — sunucu çalışmıyor olabilir.");
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") throw new Error("Sunucu adı çözülemedi: " + u.hostname);
    if (code && /CERT|SSL|TLS/i.test(code)) throw new Error("TLS sertifikası doğrulanamadı (" + code + "). Güvensiz bağlantıya izin verilmez.");
    throw new Error("İstek başarısız: " + ((c && c.message) || (err && err.message) || String(err)));
  }
  const ttfb = performance.now() - t0;
  const ct = r.headers.get("content-type") || "";
  const chunks = [];
  let size = 0, truncated = false;
  if (r.body) {
    const reader = r.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { truncated = true; try { await reader.cancel(); } catch { /* yok */ } break; }
      chunks.push(value);
    }
  }
  const buf = Buffer.concat(chunks);
  const binary = /octet-stream|^image\/|^audio\/|^video\/|pdf|zip|font|protobuf/i.test(ct) || (!ct && buf.includes(0));
  return {
    status: r.status, statusText: r.statusText || "", headers: [...r.headers.entries()].slice(0, 200), contentType: ct,
    body: binary ? "" : buf.toString("utf8").replace(/^﻿/, ""), binary, size, truncated, ms: Math.round(performance.now() - t0), ttfb: Math.round(ttfb),
    location: r.status >= 300 && r.status < 400 ? r.headers.get("location") || "" : "",
  };
}

async function chat({ base, key, model, messages, maxTokens }) {
  const url = new URL("/v1/chat/completions", loopback(base || HUB_URL));
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(url, {
    method: "POST", headers, body: JSON.stringify({ model: model || "mymind-lite", messages, max_tokens: maxTokens, temperature: 0.1, stream: false }),
    redirect: "error", credentials: "omit", signal: AbortSignal.timeout(180000),
  });
  const text = await r.text();
  if (text.length > 600000) throw new Error("Model yanıtı çok büyük.");
  let data = null;
  try { data = JSON.parse(text); } catch { /* aşağıda */ }
  if (!r.ok) throw new Error((data && (data.error && data.error.message || data.error)) || "Sunucu yanıtı " + r.status);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("Model yanıtı anlaşılamadı.");
  return content.slice(0, 120000);
}

module.exports = { HUB_URL, request, chat, loopback };
