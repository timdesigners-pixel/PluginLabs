/* API Pocket — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Kullanıcının kendi başlattığı HTTP/HTTPS API isteğini gönderir ve yanıtı döndürür;
 * ayrıca yerel MyMind (127.0.0.1:47632) ya da yerel model (loopback) ile konuşur. */
const HUB_URL = "http://127.0.0.1:47632";

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) {
    throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  }
  return x;
}

function assertHttpUrl(u) {
  let x;
  try { x = new URL(String(u).trim()); } catch { throw new Error("Geçersiz istek URL'si: " + u); }
  if ((x.protocol !== "http:" && x.protocol !== "https:") || x.username || x.password) {
    throw new Error("İstek adresi yalnız http:// ya da https:// olabilir.");
  }
  return x;
}

async function sendApiRequest({ method, url, headers, body }) {
  const target = assertHttpUrl(url);
  const t0 = Date.now();
  const r = await fetch(target, {
    method: method || "GET",
    headers: headers || {},
    body: method && method !== "GET" && body ? body : undefined,
    redirect: "manual",
    credentials: "omit",
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  const durationMs = Date.now() - t0;
  if (text.length > 1000000) throw new Error("API yanıtı çok büyük (>1 MB).");
  const respHeaders = {};
  r.headers.forEach((v, k) => { respHeaders[k] = v; });
  return { status: r.status, body: text, headers: respHeaders, durationMs };
}

async function chat({ base, key, model, messages, maxTokens }) {
  const url = new URL("/v1/chat/completions", loopback(base || HUB_URL));
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: model || "mymind-lite", messages, max_tokens: maxTokens || 600, temperature: 0.1, stream: false }),
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.timeout(180000),
  });
  const text = await r.text();
  if (text.length > 600000) throw new Error("Model yanıtı çok büyük.");
  let data = null;
  try { data = JSON.parse(text); } catch { /* aşağıda */ }
  if (!r.ok) throw new Error((data && ((data.error && data.error.message) || data.error)) || "Sunucu yanıtı " + r.status);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("Model yanıtı anlaşılamadı.");
  return content.slice(0, 120000);
}

module.exports = { HUB_URL, sendApiRequest, chat, loopback, assertHttpUrl };
