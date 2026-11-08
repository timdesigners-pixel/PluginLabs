/* Model Switchboard — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Yalnız dört hedef, başka hiçbiri; yalnız resmi API ve kullanıcının kendi anahtarı (tüketici web hesabı çerezi kullanılmaz, credentials: omit):
 *  • OpenAI: https://api.openai.com — yalnız POST /v1/chat/completions
 *  • Anthropic: https://api.anthropic.com — yalnız POST /v1/messages (anthropic-version 2023-06-01)
 *  • MyMind: yerel PluginLabs Hub API'si (127.0.0.1:47632), Hub istemci anahtarıyla
 *  • Yerel model: bu bilgisayardaki OpenAI uyumlu sunucu (adres yalnız 127.0.0.1/localhost/::1)
 * Her istek kullanıcının o seferki onayından ve bütçe denetiminden sonra yapılır. Yönlendirme izlenmez; yeniden deneme yoktur
 * (yeniden deneme maliyeti iki katına çıkarabilir). Testte bulut tabanları yalnız loopback taklit sunucuya yönlendirilebilir. */
const HUB_URL = "http://127.0.0.1:47632";
const BASES = { openai: "https://api.openai.com", anthropic: "https://api.anthropic.com" };
const PATHS = { openai: "/v1/chat/completions", anthropic: "/v1/messages", hub: "/v1/chat/completions", yerel: "/v1/chat/completions" };

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}
function baseOf(provider, opts) {
  if (provider === "openai" || provider === "anthropic") return opts.testBase ? loopback(opts.testBase).origin : BASES[provider];
  if (provider === "hub") return loopback(opts.base || HUB_URL).origin;
  if (provider === "yerel") return loopback(opts.base).origin;
  throw new Error("Bilinmeyen sağlayıcı.");
}
function message(provider, status, data) {
  const e = data && (data.error && (data.error.message || data.error.type) || data.error || data.message);
  const m = typeof e === "string" ? e.slice(0, 300) : "";
  if (status === 401) return (provider === "anthropic" ? "Anthropic" : provider === "openai" ? "OpenAI" : "Sunucu") + " anahtarı geçersiz (401).";
  if (status === 403) return "Bu anahtarın bu model için yetkisi yok (403)." + (m ? " " + m : "");
  if (status === 404) return "Model bulunamadı (404) — model adını Modeller bölümünden denetleyin." + (m ? " " + m : "");
  if (status === 429) return "Sağlayıcı istek/kota sınırı (429). Otomatik yeniden denenmez." + (m ? " " + m : "");
  return "Sağlayıcı yanıtı " + status + (m ? ": " + m : "");
}
/** Tek istek. Dönüş: { json, ms }. */
async function call(provider, path, body, opts) {
  opts = opts || {};
  if (path !== PATHS[provider]) throw new Error("İzin verilmeyen istek yolu.");
  const url = new URL(path, baseOf(provider, opts));
  const headers = { "Content-Type": "application/json" };
  if (provider === "anthropic") { if (!opts.key) throw new Error("Anthropic API anahtarı yok."); headers["x-api-key"] = opts.key; headers["anthropic-version"] = "2023-06-01"; }
  else if (provider === "openai") { if (!opts.key) throw new Error("OpenAI API anahtarı yok."); headers.Authorization = "Bearer " + opts.key; }
  else if (opts.key) headers.Authorization = "Bearer " + opts.key;
  const t0 = Date.now();
  let r;
  try { r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), redirect: "error", credentials: "omit", signal: AbortSignal.timeout(opts.timeout || 120000) }); }
  catch (err) {
    const m = String(err && err.message || err);
    if (/ECONNREFUSED|fetch failed/i.test(m)) throw new Error(provider === "hub" ? "PluginLabs Hub açık değil (127.0.0.1:47632)." : provider === "yerel" ? "Yerel model sunucusuna bağlanılamadı." : "Sağlayıcıya ulaşılamadı (ağ bağlantısını denetleyin).");
    if (/timeout|abort/i.test(m)) throw new Error("Yanıt zaman aşımına uğradı (120 sn).");
    throw new Error(m);
  }
  const text = await r.text();
  const ms = Date.now() - t0;
  if (text.length > 2000000) throw new Error("Yanıt çok büyük.");
  let json = null;
  try { json = JSON.parse(text); } catch { /* aşağıda */ }
  if (!r.ok) throw new Error(message(provider, r.status, json));
  if (!json) throw new Error("Yanıt JSON değil.");
  return { json, ms };
}

module.exports = { HUB_URL, BASES, PATHS, call, loopback, baseOf };
