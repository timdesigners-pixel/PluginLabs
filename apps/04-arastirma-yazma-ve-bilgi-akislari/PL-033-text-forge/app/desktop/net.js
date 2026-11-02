/* Text Forge — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Yalnız MyMind: yerel PluginLabs Hub API'sine (127.0.0.1:47632) istemci anahtarıyla, kullanıcının her seferinde onayladığı sohbet isteği.
 * Metinler internetten indirilmez; kaynak yalnız yapıştırma, kullanıcı eylemiyle pano ve yerel dosyadır. */
const HUB_URL = "http://127.0.0.1:47632";

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
  if (text.length > 300000) throw new Error("MyMind yanıtı çok büyük.");
  let data = null;
  try { data = JSON.parse(text); } catch { /* aşağıda */ }
  if (!r.ok) throw new Error((data && data.error) || "Hub yanıtı " + r.status);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("MyMind yanıtı anlaşılamadı.");
  return content.slice(0, 12000);
}

module.exports = { HUB_URL, mymindChat };
