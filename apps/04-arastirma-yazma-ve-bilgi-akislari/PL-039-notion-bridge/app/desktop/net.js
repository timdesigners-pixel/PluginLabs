/* Notion Bridge — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Üç hedef, başka hiçbiri:
 *  • Notion API: yalnız https://api.notion.com (kullanıcının kendi "internal integration" anahtarıyla; anahtar arayüze verilmez).
 *    Yalnız üç uç kullanılır: veritabanı şemasını okuma (GET /v1/databases/{id}), mükerrer denetimi için başlıkla sorgu
 *    (POST /v1/databases/{id}/query) ve YENİ sayfa ekleme (POST /v1/pages). Var olan sayfayı değiştiren (PATCH) ya da silen uç YOKTUR.
 *  • MyMind: yerel PluginLabs Hub API'si (127.0.0.1:47632), Hub istemci anahtarıyla.
 *  • Yerel model: bu bilgisayardaki OpenAI uyumlu sunucu (adres yalnız 127.0.0.1/localhost/::1).
 * Her istek kullanıcının o seferki onayından sonra yapılır. Yönlendirme izlenmez; 429'da Retry-After'a (en çok 10 sn) uyulup bir kez denenir. */
const HUB_URL = "http://127.0.0.1:47632";
const NOTION_URL = "https://api.notion.com";
const NOTION_VERSION = "2022-06-28";

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}
/** Notion tabanı: üretimde sabit api.notion.com; testte yalnız loopback taklit sunucu kabul edilir. */
function notionBase(testBase) {
  if (testBase) return loopback(testBase).origin;
  return NOTION_URL;
}

const ALLOWED = [/^GET \/v1\/databases\/[0-9a-f-]{36}$/, /^POST \/v1\/databases\/[0-9a-f-]{36}\/query$/, /^POST \/v1\/pages$/];
async function notion({ method, path, body, token, testBase }) {
  if (!ALLOWED.some((re) => re.test(method + " " + path))) throw new Error("İzin verilmeyen Notion isteği.");
  if (!token) throw new Error("Notion bağlantı anahtarı yok.");
  const url = new URL(path, notionBase(testBase));
  const opts = {
    method,
    headers: { Authorization: "Bearer " + token, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "error",
    credentials: "omit",
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) });
    const text = await r.text();
    if (text.length > 2000000) throw new Error("Notion yanıtı çok büyük.");
    let data = null;
    try { data = JSON.parse(text); } catch { /* aşağıda */ }
    if (r.status === 429 && attempt === 0) {
      const wait = Math.min(10, Math.max(1, Number(r.headers.get("retry-after")) || 2));
      await new Promise((res) => setTimeout(res, wait * 1000));
      continue;
    }
    if (!r.ok) {
      const err = new Error(notionMessage(r.status, data));
      err.status = r.status;
      err.code = data && data.code;
      throw err;
    }
    return data;
  }
  throw new Error("Notion istek sınırı aşıldı (429). Biraz bekleyip yeniden deneyin.");
}
function notionMessage(status, data) {
  const code = data && data.code;
  const msg = data && typeof data.message === "string" ? data.message.slice(0, 300) : "";
  if (status === 401 || code === "unauthorized") return "Notion anahtarı geçersiz ya da iptal edilmiş (401).";
  if (status === 404 || code === "object_not_found") return "Veritabanı bulunamadı ya da bağlantınızla paylaşılmamış (404). Notion'da veritabanı → ••• → Bağlantılar → entegrasyonunuzu ekleyin.";
  if (status === 403 || code === "restricted_resource") return "Bu bağlantının bu işlem için yetkisi yok (403). Entegrasyonda “İçerik ekle” yeteneği açık olmalı.";
  if (status === 400 || code === "validation_error") return "Notion kaydı reddetti (şema uyuşmazlığı): " + msg;
  if (status === 409) return "Notion çakışma bildirdi (409); yeniden deneyin.";
  return "Notion yanıtı " + status + (msg ? ": " + msg : "");
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

module.exports = { HUB_URL, NOTION_URL, NOTION_VERSION, notion, chat, loopback, notionBase };
