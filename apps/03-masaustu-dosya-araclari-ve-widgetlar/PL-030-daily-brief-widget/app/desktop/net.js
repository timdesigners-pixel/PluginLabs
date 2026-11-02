/* Daily Brief Widget — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * 1) Takvim aboneliği: kullanıcının eklediği ve onayladığı .ics adresinden YALNIZ OKUMA (GET; çerez/kimlik bilgisi gönderilmez, 5 MB sınırı,
 *    20 sn zaman aşımı, yönlendirme en fazla https içinde). Takvime hiçbir şey yazılmaz.
 * 2) MyMind: yerel PluginLabs Hub API'sine (127.0.0.1:47632) istemci anahtarıyla, kullanıcının her seferinde onayladığı sohbet isteği. */
const HUB_URL = "http://127.0.0.1:47632";
const MAX_ICS = 5 * 1024 * 1024;

async function fetchIcs(url, allowLoopback) {
  const r = await fetch(url, {
    method: "GET",
    headers: { Accept: "text/calendar, text/plain;q=0.8, */*;q=0.1", "User-Agent": "PluginLabs-DailyBrief/0.1" },
    redirect: "follow",
    credentials: "omit",
    signal: AbortSignal.timeout(20000),
  });
  const final = new URL(r.url || url);
  const loop = allowLoopback && final.protocol === "http:" && final.hostname === "127.0.0.1";
  if (final.protocol !== "https:" && !loop) throw new Error("Takvim adresi https dışına yönlendirdi; okunmadı.");
  if (!r.ok) throw new Error(r.status === 404 ? "Takvim bulunamadı (404). Paylaşım adresi değişmiş olabilir." : r.status === 401 || r.status === 403 ? "Takvim erişimi reddedildi (" + r.status + "). Adresin herkese açık/gizli paylaşım adresi olduğundan emin olun." : "Takvim sunucusu " + r.status + " döndü.");
  const len = Number(r.headers.get("content-length") || 0);
  if (len > MAX_ICS) throw new Error("Takvim 5 MB'tan büyük.");
  const reader = r.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_ICS) { reader.cancel().catch(() => {}); throw new Error("Takvim 5 MB'tan büyük."); }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

async function mymindChat(base, key, messages, maxTokens) {
  const r = await fetch(new URL("/v1/chat/completions", base || HUB_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: "mymind-lite", messages, max_tokens: maxTokens, stream: false }),
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.timeout(130000),
  });
  const text = await r.text();
  if (text.length > 200000) throw new Error("MyMind yanıtı çok büyük.");
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* aşağıda */
  }
  if (!r.ok) throw new Error((data && data.error) || "Hub yanıtı " + r.status);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("MyMind yanıtı anlaşılamadı.");
  return content.slice(0, 4000);
}

module.exports = { HUB_URL, fetchIcs, mymindChat };
