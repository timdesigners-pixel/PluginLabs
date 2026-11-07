// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");
const schema = C.normalizeSchema(S.schema);
const BASE = S.BASE;

test("veritabanı kimliği: bağlantı, çıplak kimlik, tireli; görünüm kimliği alınmaz; Notion dışı alan reddedilir", () => {
  const id = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
  assert.equal(C.parseDatabaseId("https://www.notion.so/ekip/Okuma-listesi-0f1e2d3c4b5a69788796a5b4c3d2e1f0?v=11112222333344445555666677778888"), id);
  assert.equal(C.parseDatabaseId("0f1e2d3c4b5a69788796a5b4c3d2e1f0"), id);
  assert.equal(C.parseDatabaseId(id), id);
  assert.equal(C.parseDatabaseId("https://kotu-site.com/0f1e2d3c4b5a69788796a5b4c3d2e1f0"), null);
  assert.equal(C.parseDatabaseId("http://www.notion.so/0f1e2d3c4b5a69788796a5b4c3d2e1f0"), null, "yalnız https");
  assert.equal(C.parseDatabaseId("abc"), null);
});

test("Notion veritabanı yanıtından şema: türler ve seçenekler okunur, başlık önce gelir", () => {
  const sc = C.parseNotionDatabase({
    object: "database", id: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0", url: "https://www.notion.so/0f1e2d3c4b5a69788796a5b4c3d2e1f0", title: [{ plain_text: "Okuma " }, { plain_text: "listesi" }],
    properties: { "Tür": { type: "select", select: { options: [{ name: "Makale" }, { name: "Video" }] } }, Ad: { type: "title", title: {} }, Etiket: { type: "multi_select", multi_select: { options: [{ name: "İş" }] } }, Sahip: { type: "people", people: {} } },
  });
  assert.equal(sc.title, "Okuma listesi");
  assert.equal(sc.properties[0].name, "Ad");
  assert.deepEqual(sc.properties.find((p) => p.name === "Tür").options, ["Makale", "Video"]);
  assert.equal(C.writable(sc.properties.find((p) => p.name === "Sahip")), false);
  assert.throws(() => C.parseNotionDatabase({ object: "page", id: "x" }));
  assert.equal(C.normalizeSchema({ id: "0f1e2d3c4b5a69788796a5b4c3d2e1f0", properties: [{ name: "A", type: "rich_text" }] }), null, "başlık alanı olmayan şema geçersiz");
});

test("örnek içerikler: elle etiketli alanlarda %100 doğruluk ve sıfır uydurma alan", () => {
  const items = S.captures.map((c) => { const d = C.createDraft(schema, { ...c.source, text: c.text }, BASE); d.sampleKey = c.key + "-0"; return d; });
  const g = C.evaluateGold(items, S.gold);
  assert.equal(g.accuracy, 100);
  assert.equal(g.inventions, 0);
  for (const x of items) assert.deepEqual(C.validateDraft(schema, x.values), []);
});

test("olmayan alan ve olmayan seçenek uydurulmaz; belirsiz alan boş kalır ve nedeni yazılır", () => {
  const d = C.createDraft(schema, { text: "Yeni bir araç\nÖncelik: yüksek\nTür: Blog yazısı\nEtiketler: Tasarım, Pazarlama\nKitap mı podcast mi bilmiyorum" }, BASE);
  assert.ok(!("Öncelik" in d.values));
  assert.deepEqual(d.notes.unknownKeys.map((k) => k.key), ["Öncelik"]);
  assert.ok(!("Tür" in d.values), "Blog yazısı seçeneği yok; belirsiz metin de yazılmaz");
  assert.ok(d.notes.failed.some((f) => f.name === "Tür" && /yeni seçenek eklenmez/.test(f.reason)));
  assert.deepEqual(d.values.Etiketler.value, ["Tasarım"]);
  assert.ok(d.notes.failed.some((f) => /Pazarlama/.test(f.reason)));
});

test("birden çok tarih/bağlantı/e-posta alanında belirsizlik: hiçbiri doldurulmaz", () => {
  const sc = C.normalizeSchema({ id: "11112222333344445555666677778888", properties: [{ name: "Ad", type: "title" }, { name: "Başlangıç", type: "date" }, { name: "Bitiş", type: "date" }, { name: "İş e-postası", type: "email" }, { name: "Site", type: "url" }, { name: "Repo", type: "url" }] });
  const d = C.createDraft(sc, { text: "Proje\n3 Aralık 2026 toplantı\nyazışma: ali@ornek.com ve ayse@ornek.com\nhttps://a.example.com https://b.example.com" }, BASE);
  assert.deepEqual(Object.keys(d.values), ["Ad"]);
  assert.ok(d.notes.ambiguous.some((a) => /tarih/.test(a.reason)));
  assert.ok(d.notes.ambiguous.some((a) => /bağlantı alanı/.test(a.reason)));
  assert.ok(d.notes.ambiguous.some((a) => a.name === "İş e-postası" && /2 farklı değer/.test(a.reason)));
});

test("tür dönüşümleri: sayı (TR/EN ayraç), onay kutusu, tarih, bağlantı", () => {
  assert.equal(C.parseNumber("1.250,75 TL"), 1250.75);
  assert.equal(C.parseNumber("1,250.75"), 1250.75);
  assert.equal(C.parseNumber("4,5"), 4.5);
  assert.equal(C.parseNumber("dört"), null);
  assert.equal(C.parseBool("Evet"), true);
  assert.equal(C.parseBool("hayır"), false);
  assert.equal(C.parseBool("belki"), null);
  assert.equal(C.parseDateValue("12 Kasım 2026", BASE), "2026-11-12");
  assert.equal(C.parseDateValue("2026-02-30"), null);
  assert.equal(C.parseDateValue("yarın", BASE), "2026-11-07");
  assert.equal(C.convert({ type: "url" }, "www.ornek.com/a").value, "https://www.ornek.com/a");
  assert.equal(C.convert({ type: "url" }, "javascript:alert(1)").ok, false);
  assert.equal(C.convert({ type: "people" }, "Ali").ok, false);
});

test("doğrulama: şemada olmayan alan, olmayan seçenek, boş başlık, yanlış tür → kayıt engellenir", () => {
  const errs = C.validateDraft(schema, { Yok: { value: "x" }, "Tür": { value: "Blog" }, Puan: { value: "dört" }, Sahip: { value: "Ali" }, Etiketler: { value: ["Tasarım", "Uydurma"] } });
  const names = errs.map((e) => e.name);
  for (const n of ["Yok", "Tür", "Puan", "Sahip", "Etiketler", "Ad"]) assert.ok(names.includes(n), n);
  assert.deepEqual(C.validateDraft(schema, { Ad: { value: "Tamam" } }), []);
  assert.equal(C.validateDraft(null, {}).length, 1);
});

test("Notion gövdesi: her tür doğru biçimde, yalnız şemadaki alanlar", () => {
  const d = C.createDraft(schema, { ...S.captures[1].source, text: S.captures[1].text }, BASE);
  const p = C.toNotionProperties(schema, d.values);
  assert.deepEqual(p.Ad, { title: [{ type: "text", text: { content: "Yapay zekâ ile toplantı özetleri — konuşma kaydı" } }] });
  assert.deepEqual(p["Tür"], { select: { name: "Video" } });
  assert.deepEqual(p.Durum, { status: { name: "Bitti" } });
  assert.deepEqual(p.Etiketler, { multi_select: [{ name: "Yapay zekâ" }, { name: "İş" }] });
  assert.deepEqual(p.Tarih, { date: { start: "2026-11-12" } });
  assert.deepEqual(p.Puan, { number: 4.5 });
  assert.deepEqual(p["Önemli"], { checkbox: true });
  assert.ok(!("Sahip" in p) && !("Oluşturulma" in p) && !("Konuşmacı" in p));
});

test("mükerrer: aynı girdi (boşluk/büyük harf farkıyla) aynı parmak izi; aynı başlık+bağlantı da yakalanır", () => {
  const a = C.createDraft(schema, { text: "Derin Çalışma notları\nSağlık", url: "https://kitap-ornek.org/derin-calisma" }, BASE);
  const b = C.createDraft(schema, { text: "  derin çalışma   NOTLARI \nsağlık ", url: "https://kitap-ornek.org/derin-calisma/" }, BASE);
  assert.equal(a.fp, b.fp);
  const ledger = [{ dbId: schema.id, fp: a.fp, key: C.recordKey(schema, a.values), pageUrl: "https://www.notion.so/x", savedAt: BASE }];
  assert.match(C.findDuplicate(ledger, schema, b).reason, /Aynı girdi/);
  const c = C.createDraft(schema, { text: "Derin Çalışma notları\nfarklı içerik ama aynı kart", url: "https://kitap-ornek.org/derin-calisma" }, BASE);
  assert.notEqual(c.fp, a.fp);
  assert.match(C.findDuplicate(ledger, schema, c).reason, /Aynı başlık ve bağlantı/);
  const other = C.createDraft(schema, { text: "Başka kitap", url: "https://kitap-ornek.org/baska" }, BASE);
  assert.equal(C.findDuplicate(ledger, schema, other), null);
});

test("elle düzenleme: geçersiz değer reddedilir, boş değer alanı boşaltır; yeniden eşlemede elle girilen korunur", () => {
  const d = C.createDraft(schema, { text: "Bir yazı" }, BASE);
  assert.equal(C.setValue(schema, d, "Tür", "Blog").ok, false);
  assert.equal(C.setValue(schema, d, "Tür", "makale").ok, true);
  assert.equal(d.values["Tür"].value, "Makale");
  assert.throws(() => C.setValue(schema, d, "Sahip", "Ali"));
  assert.throws(() => C.setValue(schema, d, "Uydurma", "x"));
  C.setValue(schema, d, "Puan", "3");
  C.remap(schema, d, BASE);
  assert.equal(d.values.Puan.value, 3);
  C.setValue(schema, d, "Puan", "");
  assert.ok(!("Puan" in d.values));
});

test("yapay zekâ isteği veri azaltılmış; yanıttaki uydurma alan/seçenek/tür hatası atılır", () => {
  const d = C.createDraft(schema, { text: "Ali Veli ali@ornek.com ile görüş, https://gizli.example.com/belge parola: Abc12345\nTür makale", url: "https://kaynak.example.com/yazi", title: "Gizli başlık" }, BASE);
  const p = C.aiPayload(schema, d);
  const sent = JSON.stringify(p.messages);
  for (const secret of ["ali@ornek.com", "gizli.example.com", "Abc12345", "kaynak.example.com", "Gizli başlık"]) assert.ok(!sent.includes(secret), secret);
  assert.match(sent, /⟦1⟧/);
  assert.ok(!/Sahip|Oluşturulma/.test(sent), "yazılamayan alanlar gönderilmez");
  const res = C.validateAi('```json\n{"alanlar": {"Ad": "Görüşme ⟦1⟧", "Tür": "Blog", "Uydurma": "x", "Puan": "çok", "Etiketler": ["İş", "Yeni"], "Sahip": "Ali", "Bağlantı": "⟦2⟧"}}\n```', p, schema, BASE);
  assert.equal(res.values.Ad.value, "Görüşme ali@ornek.com");
  assert.equal(res.values["Bağlantı"].value, "https://gizli.example.com/belge");
  assert.deepEqual(res.values.Etiketler.value, ["İş"]);
  assert.ok(!("Tür" in res.values) && !("Uydurma" in res.values) && !("Puan" in res.values) && !("Sahip" in res.values));
  assert.equal(res.dropped, 5);
  assert.throws(() => C.validateAi("yanıt yok", p, schema, BASE));
});

test("CSV: Notion içe aktarma için alan adları başlık, formül enjeksiyonu engellenir", () => {
  const d = C.createDraft(schema, { text: "=HYPERLINK(\"x\")\nTür: Video\nÖnemli: evet" }, BASE);
  const csv = C.exportCsv(schema, [d]);
  const lines = csv.replace(/^﻿/, "").split("\r\n");
  assert.ok(lines[0].startsWith("Ad,Bağlantı,Yazar,Tür,Etiketler,Durum,Tarih,Puan,Önemli,Not"));
  assert.ok(!lines[0].includes("Sahip"));
  assert.match(lines[1], /^"'=HYPERLINK/);
  assert.match(lines[1], /,Video,/);
  assert.match(lines[1], /,Yes,/);
});

test("ayarlar ve kayıt normalleştirme: yerel model yalnız loopback; bozuk kayıt atılır", () => {
  assert.equal(C.normalizeSettings({ localUrl: "http://10.0.0.5:1234" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({}).remoteDupCheck, true);
  assert.equal(C.normalizeItems([null, { id: 3 }, { id: "a", status: "garip", values: { Ad: { value: "x", from: "kotu" } } }]).length, 1);
  assert.equal(C.normalizeItems([{ id: "a", status: "garip" }])[0].status, "taslak");
  assert.equal(C.isToken("secret_" + "a".repeat(43)), true);
  assert.equal(C.isToken("ntn_" + "B1".repeat(20)), true);
  assert.equal(C.isToken("sk-123"), false);
});
