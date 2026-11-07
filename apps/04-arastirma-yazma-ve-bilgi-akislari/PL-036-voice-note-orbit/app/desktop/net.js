/* Voice Note Orbit — ağ erişiminin TEK yeri (ana süreç). Arayüz ağ isteği yapamaz (CSP connect-src 'none').
 * Tüm hedefler yalnız bu bilgisayardadır (loopback):
 *  • Transkripsiyon: kullanıcının kendi bilgisayarındaki OpenAI uyumlu konuşma→metin sunucusu (whisper.cpp server, faster-whisper-server,
 *    LocalAI, Speaches…) — POST /v1/audio/transcriptions, çok parçalı form (16 kHz mono WAV).
 *  • MyMind: yerel PluginLabs Hub API'si (127.0.0.1:47632), Hub istemci anahtarıyla; ya da kullanıcının yerel OpenAI uyumlu sohbet sunucusu.
 * Her istek kullanıcının onayından sonra yapılır. Ses ve transkript internete gönderilmez. */
const HUB_URL = "http://127.0.0.1:47632";

function loopback(u) {
  const x = new URL(u);
  if (x.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) || x.username || x.password) throw new Error("Yalnız bu bilgisayardaki (127.0.0.1 / localhost) bir adres kullanılabilir.");
  return x;
}
async function readJson(r, limit) {
  const text = await r.text();
  if (text.length > limit) throw new Error("Sunucu yanıtı çok büyük.");
  let data = null;
  try { data = JSON.parse(text); } catch { /* düz metin yanıt */ }
  if (!r.ok) throw new Error((data && ((data.error && data.error.message) || data.error || data.detail)) || "Sunucu yanıtı " + r.status);
  return { data, text };
}

async function transcribe({ base, model, language, wav, path }) {
  const url = new URL(path || "/v1/audio/transcriptions", loopback(base));
  const form = new FormData();
  form.append("file", new Blob([wav], { type: "audio/wav" }), "not.wav");
  form.append("model", model || "whisper-1");
  if (language && language !== "auto") form.append("language", language);
  form.append("response_format", "json");
  form.append("temperature", "0");
  const r = await fetch(url, { method: "POST", body: form, redirect: "error", credentials: "omit", signal: AbortSignal.timeout(300000) });
  const { data, text } = await readJson(r, 400000);
  const out = data && typeof data.text === "string" ? data.text : !data && typeof text === "string" ? text : null;
  if (out == null) throw new Error("Transkripsiyon yanıtı anlaşılamadı.");
  return out.replace(/\s+/g, " ").trim().slice(0, 6000);
}

async function chat({ base, key, model, messages, maxTokens }) {
  const url = new URL("/v1/chat/completions", loopback(base || HUB_URL));
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(url, {
    method: "POST", headers,
    body: JSON.stringify({ model: model || "mymind-lite", messages, max_tokens: maxTokens, temperature: 0.2, stream: false }),
    redirect: "error", credentials: "omit", signal: AbortSignal.timeout(180000),
  });
  const { data } = await readJson(r, 600000);
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== "string") throw new Error("Model yanıtı anlaşılamadı.");
  return content.slice(0, 60000);
}

module.exports = { HUB_URL, transcribe, chat, loopback };
