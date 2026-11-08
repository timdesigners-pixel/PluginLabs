/* Insight Table — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Üç hedef, başka hiçbiri:
 *  • Kullanıcının yazdığı TEK sayfa adresi (http/https): onaydan sonra tek GET isteği; çerez/kimlik bilgisi gönderilmez, en çok 5 MB,
 *    yalnız HTML/metin yanıtı. Sayfadaki bağlantılar İZLENMEZ, başka sayfa indirilmez (site genelinde tarama yok), betik çalıştırılmaz.
 *  • MyMind: yerel PluginLabs Hub API'si (127.0.0.1:47632), Hub istemci anahtarıyla.
 *  • Yerel model: bu bilgisayardaki OpenAI uyumlu sunucu (adres yalnız 127.0.0.1/localhost/::1). */
const HUB_URL = "http://127.0.0.1:47632";
const MAX_PAGE = 5 * 1024 * 1024;

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}
function webUrl(u) {
  const x = new URL(u);
  if ((x.protocol !== "http:" && x.protocol !== "https:") || x.username || x.password) throw new Error("Yalnız http:// ya da https:// ile başlayan bir sayfa adresi kullanılabilir.");
  return x;
}
function charsetOf(contentType, head) {
  const h = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType || "");
  if (h) return h[1].toLowerCase();
  const m = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head || "");
  return m ? m[1].toLowerCase() : "utf-8";
}
/** Tek sayfa indirme. Yönlendirme en çok 5 kez izlenir (yalnız http/https). Dönen: { html, finalUrl, contentType, bytes }. */
async function fetchPage(url, { timeoutMs = 20000 } = {}) {
  let target = webUrl(url);
  let r = null;
  for (let hop = 0; hop < 6; hop++) {
    r = await fetch(target, { method: "GET", redirect: "manual", credentials: "omit", headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.8,text/csv;q=0.8", "Accept-Language": "tr,en;q=0.8", "User-Agent": "InsightTable/0.1 (PluginLabs; single page, user request)" }, signal: AbortSignal.timeout(timeoutMs) });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      if (hop === 5) throw new Error("Sayfa çok fazla yönlendirme yaptı.");
      target = webUrl(new URL(r.headers.get("location"), target).toString());
      try { await r.body?.cancel(); } catch { /* yok */ }
      continue;
    }
    break;
  }
  if (!r.ok) throw new Error("Sayfa yanıtı " + r.status + (r.status === 403 || r.status === 401 ? " (erişim izni yok — sayfayı tarayıcıda açıp tabloyu kopyalayın)" : ""));
  const ct = r.headers.get("content-type") || "";
  if (ct && !/text\/html|application\/xhtml|text\/plain|text\/csv|text\/tab-separated/i.test(ct)) throw new Error("Bu adres bir HTML sayfası değil (" + ct.split(";")[0] + ").");
  const len = Number(r.headers.get("content-length") || 0);
  if (len > MAX_PAGE) throw new Error("Sayfa 5 MB sınırından büyük.");
  const reader = r.body.getReader();
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > MAX_PAGE) { try { await reader.cancel(); } catch { /* yok */ } throw new Error("Sayfa 5 MB sınırından büyük."); }
    chunks.push(value);
  }
  const buf = Buffer.concat(chunks);
  const cs = charsetOf(ct, buf.subarray(0, 2048).toString("latin1"));
  let html;
  try { html = new TextDecoder(cs === "iso-8859-9" || cs === "latin5" ? "windows-1254" : cs).decode(buf); } catch { html = new TextDecoder("utf-8").decode(buf); }
  return { html, finalUrl: target.toString(), contentType: ct.split(";")[0], bytes };
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
  if (!r.ok) throw new Error((data && (data.error && data.error.message || data.error)) || "Sunucu yanıtı " + r.status);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("Model yanıtı anlaşılamadı.");
  return content.slice(0, 120000);
}

module.exports = { HUB_URL, MAX_PAGE, fetchPage, chat, loopback, webUrl, charsetOf };
