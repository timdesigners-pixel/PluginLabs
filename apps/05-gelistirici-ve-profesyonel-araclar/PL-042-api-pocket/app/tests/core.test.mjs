// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");

const SECRET = "sk_live_" + "Q7mZ2x".repeat(4);
const env = () => C.normalizeEnv({ name: "Geliştirme", vars: [{ k: "base_url", v: "https://api.ornek.example" }, { k: "api_key", v: SECRET, secret: true }, { k: "id", v: "42" }] });
const tpl = (o) => C.normalizeTemplate({ name: "Deneme", url: "{{base_url}}/v1/oge/{{id}}", params: [{ k: "alan", v: "ad,fiyat" }, { k: "key", v: "{{api_key}}" }, { k: "kapali", v: "x", on: false }], headers: [{ k: "Authorization", v: "Bearer {{api_key}}" }, { k: "Accept", v: "application/json" }], ...o });

test("değişken çözme: gerçek istek sırrı içerir, maskeli kopya {{ad}} gösterir", () => {
  const r = C.resolve(tpl(), env());
  assert.equal(r.ok, true, r.errors.join());
  assert.equal(r.url, "https://api.ornek.example/v1/oge/42?alan=ad%2Cfiyat&key=" + SECRET);
  assert.deepEqual(r.headers, [["Authorization", "Bearer " + SECRET], ["Accept", "application/json"]]);
  assert.equal(r.masked.url, "https://api.ornek.example/v1/oge/42?alan=ad%2Cfiyat&key={{api_key}}");
  assert.deepEqual(r.masked.headers[0], ["Authorization", "Bearer {{api_key}}"]);
  assert.deepEqual(r.secretsUsed, ["api_key"]);
  assert.equal(JSON.stringify(r.masked).includes(SECRET), false);
});

test("eksik değişken, geçersiz adres, başlık enjeksiyonu ve yönetilen başlık → gönderilmez", () => {
  let r = C.resolve(tpl({ url: "{{yok}}/x" }), env());
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["yok"]);
  assert.match(r.errors[0], /Tanımsız ya da boş değişken: \{\{yok\}\}/);
  r = C.resolve(tpl(), null);
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /ortam seçilmedi/);
  for (const url of ["ftp://x.example/a", "javascript:alert(1)", "file:///C:/Windows/win.ini", "api.ornek.example/x"]) assert.equal(C.resolve(tpl({ url }), env()).ok, false, url);
  r = C.resolve(tpl({ headers: [{ k: "X-A", v: "a\r\nX-Enjekte: 1" }] }), env());
  assert.equal(r.ok, false);
  r = C.resolve(tpl({ headers: [{ k: "Host", v: "kotu.example" }] }), env());
  assert.match(r.errors.join(), /uygulama tarafından yönetilir/);
  r = C.resolve(tpl({ url: "https://kul:parola@api.ornek.example/" }), env());
  assert.match(r.errors.join(), /kullanıcı adı\/parola/);
  const e2 = env(); e2.vars[1].v = "";
  assert.deepEqual(C.resolve(tpl(), e2).missing, ["api_key"], "boş gizli değişken tanımsız sayılır");
});

test("sır maskeleme: düz, URL kodlu ve base64 biçimleri gizlenir; sızıntı sayacı", () => {
  const secrets = C.secretValues(env());
  const text = `{"yankı":"${SECRET}","kodlu":"${encodeURIComponent(SECRET + "/")}","b64":"${Buffer.from(SECRET).toString("base64")}"}`;
  const r = C.redact(text, secrets);
  assert.equal(r.count, 3);
  assert.equal(r.text.includes(SECRET), false);
  assert.match(r.text, /⟦sır:api_key⟧/);
  assert.equal(C.leakCount(r.text, secrets), 0);
  assert.equal(C.leakCount({ a: [text] }, secrets) > 0, true);
  assert.equal(C.redact("çok kısa ab", [{ k: "x", v: "ab" }]).count, 0, "2 karakterlik değer maskelenmez (yanlış eşleşme)");
});

test("publicEnv: gizli değer arayüze hiç gitmez, yalnız 'kayıtlı' bilgisi", () => {
  const p = C.publicEnv(env());
  const sec = p.vars.find((x) => x.k === "api_key");
  assert.equal(sec.v, "");
  assert.equal(sec.set, true);
  assert.equal(JSON.stringify(p).includes(SECRET), false);
  assert.equal(p.vars.find((x) => x.k === "id").v, "42");
});

test("curl içe aktarma: başlık, sorgu, -G -d, -u; GET dışı ve gövde reddi; sırlar gizli değişkene taşınır", () => {
  const { tpl: t, ignored } = C.parseCurl(`curl 'https://api.ornek.example/v1/ara?q=kitap&api_key=${SECRET}' \\\n  -H 'Authorization: Bearer abc.def-123456' -H "Accept: application/json" --compressed -m 10`);
  assert.equal(t.url, "https://api.ornek.example/v1/ara");
  assert.deepEqual(t.params.map((p) => p.k), ["q", "api_key"]);
  assert.deepEqual(t.headers.map((h) => h.k), ["Authorization", "Accept"]);
  assert.deepEqual(ignored, ["--compressed", "-m 10"]);
  const ex = C.extractSecrets(t, [{ k: "token" }]);
  assert.deepEqual(ex.vars.map((v) => [v.k, v.secret]), [["token_2", true], ["api_key", true]]);
  assert.equal(ex.vars[0].v, "abc.def-123456");
  assert.equal(ex.tpl.headers[0].v, "Bearer {{token_2}}");
  assert.equal(ex.tpl.params[1].v, "{{api_key}}");
  assert.equal(JSON.stringify(ex.tpl).includes(SECRET), false);
  const g = C.parseCurl("curl -G https://ornek.example/ara --data-urlencode 'q=iki kelime' -d sayfa=2");
  assert.deepEqual(g.tpl.params.map((p) => [p.k, p.v]), [["q", "iki kelime"], ["sayfa", "2"]]);
  const u = C.parseCurl("curl -u ece:gizli https://ornek.example/");
  assert.equal(u.tpl.headers[0].v, "Basic " + Buffer.from("ece:gizli").toString("base64"));
  assert.throws(() => C.parseCurl("curl -X POST https://ornek.example/"), /yalnız GET/);
  assert.throws(() => C.parseCurl("curl https://ornek.example/ -d a=1"), /yalnız GET/);
  assert.throws(() => C.parseCurl("curl -F f=@a.txt https://ornek.example/"), /yalnız GET/);
  assert.throws(() => C.parseCurl("wget https://ornek.example/"), /curl/);
  assert.throws(() => C.parseCurl("curl 'https://ornek.example/"), /tırnak/);
});

test("yanıt biçimleme: JSON belirteçleri gidiş-dönüşte birebir, tür tespiti, alan listesi", () => {
  const body = '{"veri":[{"id":1,"ad":"A","puan":4.5,"etiket":[]},{"id":2,"ad":null,"puan":null,"stok":true}],"toplam":2}';
  const f = C.formatBody("application/json; charset=utf-8", body);
  assert.equal(f.kind, "json");
  assert.equal(f.tokens.map((t) => t.v).join(""), f.pretty);
  assert.ok(f.tokens.some((t) => t.t === "key" && t.v === '"veri"'));
  const fl = C.fieldList(f.json);
  const by = Object.fromEntries(fl.map((x) => [x.path, x]));
  assert.deepEqual(by["veri[*].ad"].types, ["metin", "null"]);
  assert.equal(by["veri[*].ad"].nulls, 1);
  assert.deepEqual(by["veri[*].puan"].types, ["ondalık", "null"]);
  assert.equal(by["veri[*].id"].count, 2);
  assert.equal(by["veri[*].stok"].count, 1);
  assert.equal(by["toplam"].sample, "2");
  assert.equal(C.formatBody("text/plain", body).kind, "text");
  assert.equal(C.formatBody("", body).kind, "json", "içerik türü yoksa gövdeden");
  assert.equal(C.formatBody("application/json", "{bozuk").kind, "text");
  assert.match(C.formatBody("application/json", "{bozuk").error, /JSON ayrıştırılamadı/);
  assert.equal(C.kindOf("text/html", "<html>"), "html");
  assert.equal(C.kindOf("application/octet-stream", ""), "binary");
  assert.deepEqual([C.statusInfo(200).tone, C.statusInfo(302).tone, C.statusInfo(404).text, C.statusInfo(503).tone], ["success", "accent", "Bulunamadı", "danger"]);
});

test("yapay zekâ açıklaması: yalnız alan yolları + maskeli örnek; olmayan alan ve verilmeyen bağlantı atılır", () => {
  const f = C.formatBody("application/json", JSON.stringify({ veri: [{ id: 1, eposta: "ece@ornek.example", anahtar: SECRET, site: "https://ornek.example/a" }] }));
  const resp = { fields: C.fieldList(f.json), urlMasked: "https://api.ornek.example/v1/kisi?key={{api_key}}&q=ece", status: 200, contentType: "application/json" };
  const t = tpl({ doc: "https://belge.ornek.example/api" });
  const p = C.aiExplainPayload(t, resp, C.secretValues(env()));
  const sent = JSON.stringify(p.messages);
  assert.equal(sent.includes(SECRET), false);
  assert.equal(sent.includes("ece@ornek.example"), false);
  assert.equal(sent.includes("q=ece"), false, "sorgu değerleri gitmez");
  assert.match(sent, /https:\/\/api\.ornek\.example\/v1\/kisi/);
  assert.match(sent, /⟦e-posta⟧/);
  const raw = "```json\n" + JSON.stringify({ ozet: "Kişi listesi.", belge: "https://belge.ornek.example/api", alanlar: [
    { yol: "veri[*].id", aciklama: "Kayıt kimliği" }, { yol: "veri[*].eposta", aciklama: "E-posta", belirsiz: true },
    { yol: "veri[*].yas", aciklama: "Uydurma alan" }, { yol: "veri[*].site", aciklama: "Bkz. https://kotu.example/x" },
  ] }) + "\n```";
  const v = C.validateExplain(raw, resp.fields, t.doc);
  assert.deepEqual(Object.keys(v.items), ["veri[*].id", "veri[*].eposta"]);
  assert.equal(v.items["veri[*].eposta"].unsure, true);
  assert.equal(v.dropped, 2);
  assert.equal(v.doc, "https://belge.ornek.example/api");
  assert.equal(C.validateExplain(JSON.stringify({ ozet: "x", belge: "https://baska.example", alanlar: [] }), resp.fields, "").doc, "");
});

test("istek taslağı: yalnız GET, düz anahtar atılır, ortamda olmayan değişken işaretlenir", () => {
  const p = C.aiDraftPayload("base_url'deki kitapları getir, anahtarım " + SECRET + " ece@ornek.example", env());
  const sent = JSON.stringify(p.messages);
  assert.equal(sent.includes(SECRET), false);
  assert.equal(sent.includes("ece@ornek.example"), false);
  assert.match(sent, /api_key \(gizli\)/);
  const v = C.validateDraft(JSON.stringify({ ad: "Kitaplar", adres: "{{base_url}}/v1/kitaplar", parametreler: [{ ad: "tur", deger: "roman" }, { ad: "token", deger: "acikdeger123" }], basliklar: [{ ad: "X-Api-Key", deger: "{{api_key}}" }, { ad: "Authorization", deger: "Bearer duz" }, { ad: "X-Bolge", deger: "{{bolge}}" }] }), env());
  assert.equal(v.tpl.method, "GET");
  assert.deepEqual(v.tpl.params.map((x) => x.k), ["tur"]);
  assert.deepEqual(v.tpl.headers.map((x) => x.k), ["X-Api-Key", "X-Bolge"]);
  assert.equal(v.dropped, 2);
  assert.deepEqual(v.unknown, ["bolge"]);
  assert.throws(() => C.validateDraft(JSON.stringify({ yontem: "DELETE", adres: "https://x.example" }), env()), /GET dışı/);
  assert.throws(() => C.validateDraft(JSON.stringify({ adres: "javascript:1" }), env()), /adres geçersiz/);
  assert.throws(() => C.validateDraft("serbest metin", env()), /JSON değil/);
});

test("koleksiyon dışa aktarma sırsız; içe aktarma gizli değerleri boş getirir", () => {
  const e = env();
  const out = C.exportCollection([tpl(), tpl({ archived: true, name: "Eski" })], [e], "2026-11-08T00:00:00Z");
  const text = JSON.stringify(out);
  assert.equal(text.includes(SECRET), false);
  assert.equal(out.templates.length, 1);
  assert.equal(out.environments[0].vars.find((x) => x.k === "api_key").v, "");
  const evil = JSON.parse(text);
  evil.environments[0].vars[1].v = "sizdirilan";
  const back = C.importCollection(evil, "2026-11-08T00:00:00Z");
  assert.equal(back.templates[0].name, "Deneme");
  assert.equal(back.environments[0].vars.find((x) => x.k === "api_key").v, "", "dosyada gizli değer olsa da içe alınmaz");
  assert.throws(() => C.importCollection({ app: "baska" }), /koleksiyonu değil/);
});

test("normalleştirme ve ölçüler: yalnız GET, geçersiz değişken adı atılır, sızıntı ölçüsü", () => {
  const t = C.normalizeTemplate({ method: "DELETE", url: " https://x.example ", doc: "javascript:1" });
  assert.equal(t.method, "GET");
  assert.equal(t.url, "https://x.example");
  assert.equal(t.doc, "");
  const e = C.normalizeEnv({ vars: [{ k: "1bad", v: "x" }, { k: "iyi", v: "1" }, { k: "iyi", v: "2" }, { k: "a b", v: "" }] });
  assert.deepEqual(e.vars.map((x) => x.k), ["iyi"]);
  const s = C.normalizeSettings({ timeoutSec: 999, maxBodyMB: 0, localUrl: "http://10.0.0.5:1234", provider: "x" });
  assert.deepEqual([s.timeoutSec, s.maxBodyMB, s.localUrl, s.provider], [120, 1, "http://127.0.0.1:1234", "hub"]);
  const secrets = C.secretValues(env());
  const hist = C.normalizeHistory([{ url: "https://a.example/?k={{api_key}}", status: 200, ms: 40 }, { url: "https://a.example/", status: 500, ms: 90 }]);
  const counters = C.normalizeCounters({ sends: 2, ok: 1, firstOkMs: 45000 });
  let m = C.metrics([tpl()], hist, counters, secrets);
  assert.deepEqual([m.leaks, m.firstOkGoal, m.okRate, m.medianMs], [0, true, 50, 40]);
  hist.push({ url: "https://a.example/?k=" + SECRET });
  m = C.metrics([tpl()], hist, counters, secrets);
  assert.equal(m.leaks, 1, "sızıntı ölçüsü düz sırrı yakalar");
});
