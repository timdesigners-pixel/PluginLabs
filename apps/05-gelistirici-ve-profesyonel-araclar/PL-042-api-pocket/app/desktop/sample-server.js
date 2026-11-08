/* API Pocket — örnek API sunucusu. Yalnız kullanıcı "Örnek verilerle başla"ya bastığında, yalnız 127.0.0.1 üzerinde rastgele bir
 * portta açılır; uygulama kapanınca kapanır. Uydurma kitap verisi (src/sample.js). X-Api-Key başlığı her başlatmada üretilen
 * rastgele anahtarla eşleşmelidir (gizli değişken akışını denemek için). */
const http = require("node:http");
const crypto = require("node:crypto");
const S = require("../src/sample.js");

let server = null, port = 0, key = "";

function send(res, code, body, type) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Ornek-Api": "1" });
  res.end(text);
}
function handler(req, res) {
  const u = new URL(req.url, "http://127.0.0.1");
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { hata: "Örnek API yalnız GET kabul eder." });
  if (u.pathname === "/durum") return send(res, 200, "Örnek API çalışıyor. Kitap: " + S.books.length + ", yazar: " + S.authors.length + "\n", "text/plain; charset=utf-8");
  if (req.headers["x-api-key"] !== key) return send(res, 401, { hata: "Geçersiz ya da eksik X-Api-Key başlığı.", ipucu: "Ortamdaki api_key gizli değişkenini X-Api-Key başlığında gönderin." });
  const withAuthor = (b) => ({ ...b, yazar: (S.authors.find((a) => a.id === b.yazar_id) || {}).ad || null });
  if (u.pathname === "/v1/kitaplar") {
    const sayfa = Math.max(1, parseInt(u.searchParams.get("sayfa") || "1", 10) || 1);
    const adet = Math.min(50, Math.max(1, parseInt(u.searchParams.get("adet") || "10", 10) || 10));
    const tur = u.searchParams.get("tur");
    const all = S.books.filter((b) => !tur || b.tur === tur);
    const items = all.slice((sayfa - 1) * adet, sayfa * adet).map(withAuthor);
    return send(res, 200, { veri: items, sayfalama: { sayfa, adet, toplam: all.length, sonraki: sayfa * adet < all.length ? sayfa + 1 : null } });
  }
  const m = /^\/v1\/kitaplar\/(\d+)$/.exec(u.pathname);
  if (m) { const b = S.books.find((x) => x.id === Number(m[1])); return b ? send(res, 200, withAuthor(b)) : send(res, 404, { hata: "Kitap bulunamadı: " + m[1] }); }
  if (u.pathname === "/v1/yazarlar") {
    const q = (u.searchParams.get("ad") || "").toLocaleLowerCase("tr-TR");
    return send(res, 200, { veri: S.authors.filter((a) => !q || a.ad.toLocaleLowerCase("tr-TR").includes(q)).map((a) => ({ ...a, kitap_sayisi: S.books.filter((b) => b.yazar_id === a.id).length })) });
  }
  send(res, 404, { hata: "Böyle bir uç yok: " + u.pathname });
}

async function start() {
  if (server) return { port, key, base: "http://127.0.0.1:" + port };
  key = "ornek_" + crypto.randomBytes(12).toString("hex");
  server = http.createServer(handler);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  port = server.address().port;
  return { port, key, base: "http://127.0.0.1:" + port };
}
function stop() { if (server) { server.close(); server = null; } }
const running = () => !!server;

module.exports = { start, stop, running };
