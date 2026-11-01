import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");

const docs = [
  { id: "a1aaaa", path: "/k/Faturalar/elektrik-kasim.txt", root: "/k", rel: "Faturalar/elektrik-kasim.txt", name: "elektrik-kasim.txt", ext: "txt", mtime: 3, text: "Elektrik faturası\nKasım dönemi ödemeler tamamlandı.\nSon ödeme tarihi: 15.11.2026\nTutar 2.480,75 TL", tags: ["ev"] },
  { id: "b2bbbb", path: "/k/Notlar/toplanti.md", root: "/k", rel: "Notlar/toplanti.md", name: "toplanti.md", ext: "md", mtime: 2, text: "# Toplantı\nGündem: bütçe ve kombi bakımı.\nKarar: servis çağrılacak.", tags: [] },
  { id: "c3cccc", path: "/k/Veri/kombi-servis.csv", root: "/k", rel: "Veri/kombi-servis.csv", name: "kombi-servis.csv", ext: "csv", mtime: 1, text: "tarih,firma,tutar\n2026-10-02,Isı Servis,950", tags: ["ev", "kombi"] },
  { id: "d4dddd", path: "/k/Resim/IMG_2041.jpg", root: "/k", rel: "Resim/IMG_2041.jpg", name: "IMG_2041.jpg", ext: "jpg", mtime: 4, text: "", tags: [] },
];
const idx = C.buildIndex(docs);
const ids = (r) => r.results.map((x) => x.id);

test("katlama uzunluğu korur ve Türkçe duyarsızdır", () => {
  const s = "İstanbul'da ŞÇÖÜĞ ıı";
  assert.equal(C.fold(s).length, s.length);
  assert.equal(C.fold("İSTANBUL Iğdır"), "istanbul igdir");
  assert.deepEqual(C.tokenize("Faturalar ödendi, KDV %18"), ["faturalar", "odendi", "kdv", "18"]);
});

test("ek ve aksan: 'odeme' → 'ödemeler', 'fatura' → 'faturası'", () => {
  assert.equal(ids(C.search(idx, "odeme"))[0], "a1aaaa");
  assert.equal(ids(C.search(idx, "fatura"))[0], "a1aaaa");
  assert.equal(ids(C.search(idx, "kombi"))[0], "c3cccc", "ad eşleşmesi içerikten güçlü");
  assert.ok(ids(C.search(idx, "kombi")).includes("b2bbbb"));
});

test("dosya adı ve klasör adıyla bulma (içerik okunmayan dosya da)", () => {
  assert.deepEqual(ids(C.search(idx, "img 2041")), ["d4dddd"]);
  assert.equal(ids(C.search(idx, "notlar"))[0], "b2bbbb");
});

test("süzgeçler: #etiket, tür:, uzantı, tam ifade, hariç", () => {
  assert.deepEqual(ids(C.search(idx, "#ev")).sort(), ["a1aaaa", "c3cccc"]);
  assert.deepEqual(ids(C.search(idx, "#kombi")), ["c3cccc"]);
  assert.deepEqual(ids(C.search(idx, "kombi tür:metin")), ["b2bbbb"]);
  assert.deepEqual(ids(C.search(idx, "tür:veri")), ["c3cccc"]);
  assert.deepEqual(ids(C.search(idx, "uzantı:md")), ["b2bbbb"]);
  assert.deepEqual(ids(C.search(idx, '"son odeme tarihi"')), ["a1aaaa"]);
  assert.deepEqual(ids(C.search(idx, "kombi -karar")), ["c3cccc"]);
  assert.equal(C.search(idx, "").results.length, 0);
  assert.deepEqual(ids(C.search(idx, "", { recent: true })), ["d4dddd", "a1aaaa", "b2bbbb", "c3cccc"]);
});

test("eşleşen bölüm: satır numarası ve işaretler özgün metinle hizalı", () => {
  const r = C.search(idx, "odeme tarihi");
  const sn = r.results[0].snippet;
  assert.equal(sn.line, 2);
  const marked = sn.marks.map(([a, b]) => sn.text.slice(a, b));
  assert.ok(marked.includes("ödemeler"), marked.join(","));
  assert.ok(marked.includes("tarihi"));
  const p = C.previewLines(docs[0].text, ["odeme"], 0);
  assert.deepEqual(p.lines.map((l) => l.n), [2, 3]);
  assert.equal(p.hits, 2);
  assert.equal(p.lines[1].text.slice(...p.lines[1].marks[0]), "ödeme");
});

test("benzer belge: ortak terimli belge önde, kendisi yok", () => {
  const more = docs.concat([{ id: "e5eeee", path: "/k/x.txt", root: "/k", rel: "x.txt", name: "x.txt", ext: "txt", mtime: 0, text: "Kombi bakımı ve servis kararı: bütçe onaylandı. Kombi servis.", tags: [] }]);
  const ix = C.buildIndex(more);
  const s = C.similar(ix, "b2bbbb", 5);
  assert.equal(s[0].id, "e5eeee");
  assert.ok(!s.some((x) => x.id === "b2bbbb"));
});

test("hariç tutma desenleri", () => {
  const ex = C.settingsOf(null).excludes;
  assert.ok(C.excluded("proje/node_modules/a.js", ex));
  assert.ok(C.excluded("belgeler/~$rapor.docx", ex));
  assert.ok(C.excluded("x/y.TMP", ex));
  assert.ok(!C.excluded("belgeler/rapor.docx", ex));
  assert.ok(C.excluded("a/Gizli Arşiv/b.txt", ["gizli arşiv"]));
});

test("metin çözme: UTF-8, UTF-16, Windows-1254, ikili", () => {
  assert.equal(C.decodeText(Buffer.from("Şükrü ödedi", "utf8")), "Şükrü ödedi");
  assert.equal(C.decodeText(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("Çağrı", "utf16le")])), "Çağrı");
  assert.equal(C.decodeText(Buffer.from([0xde, 0x75, 0x62, 0x61, 0x74])), "Şubat"); // 1254: 0xDE = Ş
  assert.equal(C.decodeText(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])), null);
  assert.equal(C.plainText("html", "<p>Merhaba&nbsp;<b>dünya</b></p><script>x()</script>").replace(/\s+/g, " ").trim(), "Merhaba dünya");
  assert.match(C.plainText("rtf", "{\\rtf1\\ansi Fatura\\par \\'de\\'fe}"), /Fatura\n?Şş/);
});

test("MyMind: veri azaltma ve yanıt doğrulaması", () => {
  const cands = [{ name: "a.txt", text: "Son ödeme tarihi 15.11.2026, tutar 2.480,75 TL. ".repeat(20) }, { name: "b.md", text: "Kombi bakımı" }];
  const p = C.mymindPayload("Son ödeme ne zaman?", cands);
  assert.equal(p.candidates.length, 2);
  assert.ok(p.candidates[0].text.length <= C.AI_SNIPPET);
  const user = p.messages[1].content;
  assert.ok(!user.includes("/k/"), "yol gitmez");
  assert.throws(() => C.mymindPayload("x", cands));
  assert.throws(() => C.mymindPayload("geçerli soru", []));
  const ok = C.validateAi('```json\n{"cevap":"15 Kasım 2026.","kaynaklar":[{"n":1,"alinti":"son ödeme tarihi 15.11.2026"},{"n":9,"alinti":"yok"},{"n":2,"alinti":"uydurma alıntı"}]}\n```', p.candidates);
  assert.equal(ok.ok, true);
  assert.equal(ok.answer, "15 Kasım 2026.");
  assert.deepEqual(ok.sources.map((s) => [s.n, s.verified]), [[1, true], [2, false]]);
  assert.equal(ok.sources[1].quote, "");
  assert.equal(C.validateAi("düz metin", p.candidates).ok, false);
  assert.equal(C.validateAi('{"cevap":""}', p.candidates).ok, false);
});

test("etiket temizliği ve kararlı kimlik", () => {
  assert.equal(C.cleanTag("#İş Planı!"), "İş-Planı");
  assert.equal(C.cleanTag("a"), "");
  assert.equal(C.makeId("/a/b.txt"), C.makeId("/a/b.txt"));
  assert.notEqual(C.makeId("/a/b.txt"), C.makeId("/a/c.txt"));
  assert.match(C.makeId("C:\\x"), C.ID_RE);
});
