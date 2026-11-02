import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const SAMPLE = require("../src/sample.js");
const sample = () => C.normalizeData({ sources: SAMPLE.sources, claims: SAMPLE.claims });

test("URL: yalnız http(s), kimlik bilgisi reddi, kanonik biçim", () => {
  assert.equal(C.validUrl("javascript:alert(1)"), "");
  assert.equal(C.validUrl("file:///C:/a.txt"), "");
  assert.equal(C.validUrl("https://kullanici:parola@example.com/"), "");
  assert.equal(C.validUrl("example.com/a"), "https://example.com/a");
  const a = C.canonicalUrl("https://www.Example.com/haber/x/?utm_source=a&b=2&a=1#yorum");
  const b = C.canonicalUrl("http://m.example.com/haber/x?a=1&b=2&fbclid=zz");
  assert.equal(a, b);
  assert.equal(a, "example.com/haber/x?a=1&b=2");
  assert.equal(C.cleanUrl("https://www.example.com/x?id=5&utm_source=a&fbclid=b#yorum"), "https://www.example.com/x?id=5");
  assert.equal(C.normalizeSource({ url: "https://example.org/a?utm_medium=e#b" }).url, "https://example.org/a");
});

test("Tarih: biçimler ve geçersizler", () => {
  assert.equal(C.normDate("2024"), "2024");
  assert.equal(C.normDate("5.3.2024"), "2024-03-05");
  assert.equal(C.normDate("2024-3-5"), "2024-03-05");
  assert.equal(C.normDate("31.02.2024"), "");
  assert.equal(C.normDate("dün"), "");
  assert.equal(C.trDate("2024-03-05"), "5 Mart 2024");
});

test("Alıntı denetimi: tipografik farklar tolere edilir, uydurma yakalanır", () => {
  const src = "Bu “önemli” bir bulgu — ve   tekrarlandı… İstanbul'da.";
  assert.ok(C.quoteIn('"önemli" bir bulgu - ve tekrarlandı...', src));
  assert.ok(C.quoteIn("İSTANBUL'DA", src));
  assert.ok(!C.quoteIn("çok önemli bir bulgu", src));
  assert.ok(!C.quoteIn("", src));
});

test("Yazar ayrıştırma: Soyad, Ad · Ad Soyad · kurum", () => {
  assert.deepEqual(C.parseAuthors("Kaya, Elif; Can Demir"), [{ family: "Kaya", given: "Elif" }, { family: "Demir", given: "Can" }]);
  assert.deepEqual(C.parseAuthors("Örnek Araştırma Merkezi"), [{ literal: "Örnek Araştırma Merkezi" }]);
});

test("Kopyalar bağımsız sayılmaz: aynı metin, aynı adres, kopyası işareti", () => {
  const d = sample();
  const g = C.groupSources(d.sources);
  assert.equal(g.groupOf["ornek-s1"], g.groupOf["ornek-s2"], "haber raporun metnini içeriyor → aynı kaynak");
  assert.notEqual(g.groupOf["ornek-s1"], g.groupOf["ornek-s3"]);
  const d2 = C.normalizeData({ sources: [
    { id: "a", url: "https://www.example.com/x?utm_medium=e", title: "A" },
    { id: "b", url: "https://example.com/x/", title: "B" },
    { id: "c", url: "https://example.org/y", title: "C", copyOf: "a" },
    { id: "d", url: "https://example.org/z", title: "D" },
  ] });
  const g2 = C.groupSources(d2.sources);
  assert.equal(g2.groupOf.a, g2.groupOf.b);
  assert.equal(g2.groupOf.a, g2.groupOf.c);
  assert.notEqual(g2.groupOf.a, g2.groupOf.d);
  assert.deepEqual(g2.reasons.c, ["kopyası olarak işaretli"]);
});

test("İddia durumu: bağımsız destek, çelişki, eksik etiketi, etiketsiz", () => {
  const ev = C.evaluateAll(sample());
  const r1 = ev.results["ornek-c1"];
  assert.equal(r1.support, 3);
  assert.equal(r1.independentSupport, 2, "s1 ve s2 aynı kaynak");
  assert.equal(r1.status, "guclu");
  assert.equal(r1.dupSupport, 1);
  assert.ok(r1.warnings.some((w) => w.kind === "kopya"));
  assert.equal(ev.results["ornek-c2"].status, "celiskili");
  assert.equal(ev.results["ornek-c3"].status, "eksik");
  assert.equal(ev.results["ornek-c4"].status, "etiketsiz");
  assert.equal(ev.tally.total, 4);
  assert.equal(ev.tally.covered, 3);
  assert.equal(ev.tally.coveredPct, 75);
  assert.equal(ev.tally.copies, 1);
});

test("Kaynakta aynen olmayan bağ alıntısı ve erişilemeyen kaynak kanıt sayılmaz", () => {
  const d = sample();
  d.claims[0].links = [{ sourceId: "ornek-s3", relation: "destekler", quote: "hibrit ekipler her zaman daha verimlidir" }];
  let r = C.evaluateAll(d).results["ornek-c1"];
  assert.equal(r.status, "etiketsiz");
  assert.ok(r.warnings.some((w) => w.kind === "alinti"));
  d.claims[0].links[0].quote = "";
  d.sources.find((s) => s.id === "ornek-s3").unreachable = true;
  r = C.evaluateAll(d).results["ornek-c1"];
  assert.equal(r.status, "etiketsiz");
  assert.ok(r.warnings.some((w) => w.kind === "erisim"));
  // URL'siz ama tam künyeli kitap erişilebilir sayılır
  assert.ok(C.isAccessible(C.normalizeSource({ type: "kitap", title: "Kitap", authors: "Ad Soyad", publisher: "Yayınevi" })));
  assert.ok(!C.isAccessible(C.normalizeSource({ type: "kitap", title: "Kitap" })));
});

test("Yakalama: yapıştırılan seçimden URL, başlık ve alıntı", () => {
  const c = C.parseCapture("Başlık: Örnek sayfa\nBu bir alıntıdır.\nİkinci satır.\nhttps://example.org/a?utm_source=x\n");
  assert.equal(c.title, "Örnek sayfa");
  assert.equal(c.url, "https://example.org/a?utm_source=x");
  assert.equal(c.quote, "Bu bir alıntıdır.\nİkinci satır.");
  assert.equal(C.parseCapture("metin içinde https://example.com/b bağlantı").url, "https://example.com/b");
});

test("Kaynakça: APA, MLA, BibTeX (kaçış), CSL-JSON, kapsam", () => {
  const d = sample();
  const apa = C.bibliography(d, "apa", "kullanilan").text;
  assert.match(apa, /Kaya, E\., & Demir, C\. \(2024\)\. Örnek: Hibrit ekiplerde verimlilik ölçümü\. Örnek Çalışma Bilimleri Dergisi\. https:\/\/example\.net\/dergi\/hibrit-verimlilik/);
  assert.match(apa, /Yılmaz, D\. \(2025, 12 Nisan\)/);
  const mla = C.bibliography(d, "mla", "kullanilan").text;
  assert.match(mla, /Kaya, Elif ve Can Demir\. “Örnek: Hibrit ekiplerde verimlilik ölçümü\.” Örnek Çalışma Bilimleri Dergisi, 2024, example\.net\/dergi\/hibrit-verimlilik\. Erişim 29 Ekim 2026\./);
  const bib = C.bibliography(d, "bibtex", "tum").text;
  assert.match(bib, /@article\{kaya2024,/);
  assert.match(bib, /author = \{Kaya, Elif and Demir, Can\}/);
  assert.match(bib, /urldate = \{2026-10-29\}/);
  const x = C.bibtex([C.normalizeSource({ id: "z", title: "100% & #1_a {b}", authors: "Ad Soyad" })]);
  assert.match(x, /title = \{\{100\\% \\& \\#1\\_a \\\{b\\\}\}\}/);
  const cslj = JSON.parse(C.bibliography(d, "csl", "tum").text);
  assert.equal(cslj.length, 4);
  const r = cslj.find((o) => o.type === "report");
  assert.deepEqual(r.author, [{ literal: "Örnek Araştırma Merkezi" }]);
  assert.deepEqual(r.issued, { "date-parts": [[2025, 4, 10]] });
  d.claims = d.claims.filter((c) => c.id === "ornek-c4");
  assert.equal(C.bibliography(d, "apa", "kullanilan").count, 0);
  assert.equal(C.bibliography(d, "apa", "tum").count, 4);
});

test("Markdown kanıt izi: durum, alıntı, uyarılar", () => {
  const md = C.bibliography(sample(), "md", "kullanilan").text;
  assert.match(md, /# Kanıt izi/);
  assert.match(md, /%75/);
  assert.match(md, /Eksik kanıt: Yalnız anekdot var/);
  assert.match(md, /bağımsız doğrulama sayılmadı/);
});

test("MyMind: veri azaltma ve uydurma alıntının atılması", () => {
  const d = sample();
  const byId = Object.fromEntries(d.sources.map((s) => [s.id, s]));
  const claim = d.claims[0];
  const p = C.aiPayload(claim, claim.links.map((l) => byId[l.sourceId]));
  const all = JSON.stringify(p.messages);
  assert.ok(!all.includes("example.org"), "URL gönderilmez");
  assert.ok(!all.includes("Öz bildirime"), "not gönderilmez");
  assert.ok(!all.includes("Deniz Yılmaz"), "yazar gönderilmez");
  assert.equal(p.sent.sources, 3);
  const reply = "```json\n" + JSON.stringify({ karsilastirma: [
    { kaynak: "S1", iliski: "destekler", alinti: "odaklanma süresinin arttığını bildirdi", gerekce: "Doğrudan." },
    { kaynak: "S2", iliski: "destekler", alinti: "çalışanların tamamı daha mutlu", gerekce: "Uydurma." },
    { kaynak: "S3", iliski: "Çürütür", alinti: "", gerekce: "Alıntısız." },
    { kaynak: "S9", iliski: "destekler", alinti: "x", gerekce: "Bilinmeyen." },
  ], ozet: "Kısmen destekleniyor." }) + "\n```";
  const v = C.validateComparison(reply, p.map, byId);
  assert.equal(v.items.length, 3);
  assert.equal(v.items[0].relation, "destekler");
  assert.equal(v.items[1].relation, "belirsiz");
  assert.equal(v.items[1].quote, "");
  assert.match(v.items[1].note, /aynen bulunmadığı/);
  assert.equal(v.items[2].relation, "belirsiz", "alıntısız çürütür belirsize düşer");
  assert.equal(v.dropped, 1);
  assert.throws(() => C.validateComparison("merhaba", p.map, byId), /JSON/);
});

test("Normalleştirme: bozuk veri, yinelenen bağ, olmayan kaynağa bağ", () => {
  const d = C.normalizeData({ sources: [{ id: "a", url: "javascript:x", type: "zzz", copyOf: "yok" }], claims: [{ id: "c", links: [{ sourceId: "a" }, { sourceId: "a" }, { sourceId: "yok" }] }, null] });
  assert.equal(d.sources[0].url, "");
  assert.equal(d.sources[0].type, "web");
  assert.equal(d.sources[0].copyOf, "");
  assert.equal(d.claims[0].links.length, 1);
  assert.equal(d.claims.length, 2);
  assert.deepEqual(C.normalizeData(null).sources, []);
});
