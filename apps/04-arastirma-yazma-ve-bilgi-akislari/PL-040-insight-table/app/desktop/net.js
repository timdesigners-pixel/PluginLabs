/* Insight Table — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Uygulama hiçbir web sayfası indirmez ve site taraması yapmaz: tablolar yalnız kullanıcının verdiği içerikten (pano, yapıştırma, dosya) çıkarılır.
 * Tek ağ hedefi isteğe bağlı yapay zekâdır ve yalnız bu bilgisayardadır:
 *  • MyMind: yerel PluginLabs Hub API'si (127.0.0.1:47632), Hub istemci anahtarıyla.
 *  • Yerel model: bu bilgisayardaki OpenAI uyumlu sunucu (adres yalnız 127.0.0.1/localhost/::1).
 * Her istek kullanıcının o seferki onayından sonra yapılır. Yönlendirme izlenmez. */
const HUB_URL = "http://127.0.0.1:47632";

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}

async function chat({ base, key, model, messages, maxTokens }) {
  const url = new URL("/v1/chat/completions", loopback(base || HUB_URL));
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: model || "mymind-lite", messages, max_tokens: maxTokens, temperature: 0.1, stream: false }),
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

module.exports = { HUB_URL, chat, loopback };
