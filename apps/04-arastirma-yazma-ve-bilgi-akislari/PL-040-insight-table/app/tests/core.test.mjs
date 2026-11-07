// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const tableFrom = (text, html, extra) => { const r = C.detectInput(text || "", html || ""); assert.ok(r.candidates.length, "aday yok"); return r.candidates.map((c, i) => C.createTable(c, { via: "metin", ...(extra || {}) }, "2026-11-06T12:00:00.000Z", i + 1, r.candidates.length)); };
const values = (t, s) => { const a = C.analyze(t, s || {}); return a.rows.map((r) => r.cells.map((c, i) => C.exportValue(c, a.columns[i], C.normalizeSettings({ ...(s || {}), piiDefault: "koru", piiInText: false }), null))); };

test("HTML tablosu: rowspan/colspan çözülür, başlık th'den, menü listeleri alınmaz, varlıklar çözülür", () => {
  const html = `<title>Deneme &amp; tablo</title><nav><ul><li>Ana</li><li>Menü</li></ul></nav>
  <table><thead><tr><th rowspan=2>Bölge</th><th colspan=2>Q3</th></tr><tr><th>Ciro</th><th>Adet</th></tr></thead>
  <tbody><tr><td rowspan="2">Kuzey</td><td>1.250,50&nbsp;TL</td><td>3</td></tr><tr><td>2.000 TL</td><td>4</td></tr>
  <tr><td>Güney<br>Batı</td><td colspan="2">yok bilgi</td></tr></tbody></table>`;
  const r = C.detectInput("", html);
  assert.equal(r.title, "Deneme & tablo");
  assert.equal(r.candidates.length, 1);
  const c = r.candidates[0];
  assert.equal(c.headerRows, 2);
  assert.deepEqual(c.rows[2], ["Kuzey", "1.250,50 TL", "3"]);
  assert.deepEqual(c.rows[3], ["Kuzey", "2.000 TL", "4"]);
  assert.deepEqual(c.rows[4], ["Güney\nBatı", "yok bilgi", "yok bilgi"]);
  const t = C.createTable(c, { via: "pano" }, "2026-11-06", 1, 1);
  const a = C.analyze(t, {});
  assert.deepEqual(a.columns.map((x) => x.name), ["Bölge", "Q3 · Ciro", "Q3 · Adet"]);
  assert.equal(a.columns[1].type, "para");
  assert.equal(a.columns[1].unit, "TRY");
  assert.deepEqual(values(t)[0], ["Kuzey", 1250.5, 3]);
  assert.ok(a.flags.some((f) => f.code === "birlesik" && f.row === 1 && f.col === 0));
  assert.ok(a.flags.some((f) => f.code === "isaret"));
});

test("İç içe yerleşim tablosu atlanır; tanım listesi ve anahtar:değer listesi tabloya çevrilir", () => {
  const html = `<table><tr><td><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></td></tr></table>
  <dl><dt>Hız</dt><dd>120 km/s</dd><dt>Ağırlık</dt><dd>1.450 kg</dd></dl>
  <ol><li>Ad: Ece · Şehir: İzmir</li><li>Ad: Can · Şehir: Bursa</li><li>Ad: Su · Şehir: Van</li></ol>`;
  const r = C.detectInput("", html);
  assert.equal(r.candidates.length, 3);
  assert.deepEqual(r.candidates[0].rows, [["A", "B"], ["1", "2"]]);
  assert.deepEqual(r.candidates[1].rows, [["Terim", "Açıklama"], ["Hız", "120 km/s"], ["Ağırlık", "1.450 kg"]]);
  assert.deepEqual(r.candidates[2].rows, [["Ad", "Şehir"], ["Ece", "İzmir"], ["Can", "Bursa"], ["Su", "Van"]]);
});

test("Ayraçlı metin, Markdown ve satırlar tanınır; başlık tahmini", () => {
  const [csv] = tableFrom("Ad;Tutar\nAyşe;1.250,50\nCan;12,5\n");
  assert.equal(csv.origin.kind, "csv");
  assert.equal(csv.headerRows, 1);
  assert.deepEqual(values(csv), [["Ayşe", 1250.5], ["Can", 12.5]]);
  const [tsv] = tableFrom("1\t2\n3\t4\n");
  assert.equal(tsv.headerRows, 0);
  const [q] = tableFrom('a,b\n"x, y","çift ""tırnak"""\n"çok\nsatır",2\n');
  assert.deepEqual(q.raw.slice(1), [["x, y", 'çift "tırnak"'], ["çok\nsatır", "2"]]);
  const [md] = tableFrom("| Ad | Puan |\n|---|---:|\n| **Ece** | 4,5 |\n| Can | 3 |\n");
  assert.equal(md.origin.kind, "markdown");
  assert.deepEqual(values(md), [["Ece", 4.5], ["Can", 3]]);
  const [lines] = tableFrom("- Elma\n- Armut\n- Kiraz\n");
  assert.deepEqual(lines.raw, [["Öğe"], ["Elma"], ["Armut"], ["Kiraz"]]);
});

test("Sayı yerelleştirmesi: kanıta göre sütun ve tablo düzeyinde; çelişen hücre işaretlenir", () => {
  assert.deepEqual(C.parseNumber("1.234,5"), { kind: "sayi", unit: "", neg: false, tr: 1234.5, en: null, ev: "tr" });
  assert.equal(C.parseNumber("1,234.5").en, 1234.5);
  assert.equal(C.parseNumber("1.234").ev, null);
  assert.equal(C.parseNumber("007"), null);
  assert.equal(C.parseNumber("1234567890123456"), null);
  assert.equal(C.parseNumber("(1.200,00)").tr, -1200);
  assert.equal(C.parseNumber("−5").tr, -5);
  assert.equal(C.parseNumber("€ 1.200,00").unit, "EUR");
  assert.equal(C.parseNumber("%12,5").kind, "yuzde");
  assert.equal(C.parseNumber("-%1,5").tr, -1.5);
  assert.equal(C.parseNumber("-₺1.200").tr, -1200);
  assert.equal(C.parseNumber("12,5O TL"), null);
  // "3,412" tek başına belirsiz: tablonun geri kalanı İngilizce biçimliyse binlik sayılır.
  const [t] = tableFrom("Ad,Gelir,Adet\nA,\"$1,204.50\",\"3,412\"\nB,\"$987.25\",\"2,980\"\n");
  assert.deepEqual(values(t), [["A", 1204.5, 3412], ["B", 987.25, 2980]]);
  // Çelişen ayraç
  const [m] = tableFrom("Ürün;Fiyat\nA;1.299,90\nB;2.450,00\nC;12.99\n");
  const a = C.analyze(m, {});
  assert.equal(a.columns[1].locale, "tr");
  assert.ok(a.flags.some((f) => f.code === "ayrac" && f.row === 2));
});

test("Tarih: TR/EN biçimleri, sıralama kanıtı, takvimde olmayan tarih işaretlenir", () => {
  assert.deepEqual(C.parseDate("7 Kasım 2026"), { iso: "2026-11-07" });
  assert.deepEqual(C.parseDate("Nov 3, 2026"), { iso: "2026-11-03" });
  assert.deepEqual(C.parseDate("07.11.26"), { iso: "2026-11-07" });
  assert.deepEqual(C.parseDate("31.02.2026"), { invalid: true });
  const [us] = tableFrom("Gün\n11/25/2026\n03/04/2026\n");
  assert.deepEqual(values(us), [["2026-11-25"], ["2026-03-04"]]);
  const [tr] = tableFrom("Gün\n25/11/2026\n03/04/2026\n");
  assert.deepEqual(values(tr), [["2026-11-25"], ["2026-04-03"]]);
  const [bad] = tableFrom("Tarih\n01.11.2026\n02.11.2026\n30.02.2026\n04.11.2026\n");
  const a = C.analyze(bad, {});
  assert.equal(a.columns[0].type, "tarih");
  assert.ok(a.flags.some((f) => f.code === "tarih" && f.row === 2));
  assert.equal(values(bad)[2][0], "30.02.2026");
});

test("Türüne uymayan hücre uydurulmaz: kaynak metni ya da (ayarla) boş; eksik doldurulmaz", () => {
  const [t] = tableFrom("Ad;Stok\nA;12\nB;\nC;on iki\nD;7\nE;9\nF;4\nG;5\n");
  const a = C.analyze(t, {});
  assert.equal(a.columns[1].type, "tamsayi");
  assert.deepEqual(values(t).map((r) => r[1]), [12, null, "on iki", 7, 9, 4, 5]);
  assert.deepEqual(values(t, { badCells: "bos" }).map((r) => r[1]), [12, null, null, 7, 9, 4, 5]);
  assert.ok(a.flags.some((f) => f.code === "tur" && f.row === 2));
  assert.ok(a.flags.some((f) => f.code === "eksik" && f.row === 1));
});

test("Sütun adı normalleştirme ve makine anahtarı; mükerrer satır", () => {
  assert.equal(C.normName("Nüfus[1] ▲"), "Nüfus");
  assert.equal(C.normName("Fiyat (TL):"), "Fiyat (TL)");
  assert.equal(C.keyOf("Fiyat (TL)", 0), "fiyat_tl");
  assert.equal(C.keyOf("İndirim %", 0), "indirim_yuzde");
  assert.equal(C.keyOf("2026", 3), "s_2026");
  const [t] = tableFrom("Ad,Ad,\nx,y,z\nx,y,z\n");
  t.headerRows = 1;
  const a = C.analyze(t, {});
  assert.deepEqual(a.columns.map((c) => c.name), ["Ad", "Ad (2)", "Sütun 3"]);
  assert.equal(a.summary.dupRows, 1);
});

test("CSV: formül enjeksiyonu etkisiz, BOM, ayraç/ondalık, kaynak izi, gidiş-dönüş farkı 0", () => {
  const [t] = tableFrom("Not;Tutar\n=1+1;-5\n+bonus;1.200,50\n@SUM(A1);3\n-uyarı;4\n\tsekme;5\n＝tam;6\n", "", { url: "https://ornek.example/x" });
  const r = C.exportCsv(t, { csvDelimiter: ";", csvDecimal: ",", bom: true, sourceTrail: true });
  assert.ok(r.text.startsWith("﻿Not;Tutar;kaynak_satir\r\n"));
  const lines = r.text.slice(1).trim().split("\r\n");
  assert.equal(lines[1], "'=1+1;-5;2");
  assert.equal(lines[2], "'+bonus;1200,5;3");
  assert.equal(lines[3], "'@SUM(A1);3;4");
  assert.equal(lines[4], "'-uyarı;4;5");
  assert.equal(lines[6], "'＝tam;6;7");
  assert.equal(r.neutralized, 5); // =, +, @, -, ＝ (baştaki sekme hücre temizliğinde kırpılır; "-5" sayı olarak çözülür)
  assert.equal(r.mismatch, 0);
  const std = C.exportCsv(t, { csvDelimiter: ",", csvDecimal: ",", bom: false, sourceTrail: false });
  assert.ok(std.text.startsWith("Not,Tutar\r\n"));
  assert.ok(std.text.includes("'+bonus,1200.5\r\n"), "virgül ayraçta ondalık nokta olmalı");
  for (const s of S.sources) {
    for (const x of tableFrom(s.text, s.html)) for (const d of [",", ";", "\t"]) assert.equal(C.exportCsv(x, { csvDelimiter: d }).mismatch, 0);
  }
});

test("Kişisel veri: sütun tanıma, maskeleme/çıkarma/koruma, metin içi maskeleme; kimlik numarası sayıya çevrilmez", () => {
  const [t] = tableFrom("Ad;E-posta;Telefon;TCKN;Not\nEce;ece@example.com;0532 000 00 01;10000000146;ara: 0533 000 00 09\nCan;can@example.org;0533 000 00 02;10000000078;tamam\n");
  const a = C.analyze(t, {});
  assert.deepEqual(a.columns.map((c) => c.pii), ["", "email", "telefon", "tckn", ""]);
  assert.equal(a.columns[3].type, "metin");
  const j = JSON.parse(C.exportJson(t, {}).text);
  assert.equal(j.satirlar[0].e_posta, "e***@example.com");
  assert.equal(j.satirlar[0].telefon, "*** *** ** 01");
  assert.equal(j.satirlar[0].tckn, "*********46");
  assert.equal(j.satirlar[0].not, "ara: *** *** ** 09");
  t.cols[1].pii = "cikar"; t.cols[3].pii = "koru";
  const j2 = JSON.parse(C.exportJson(t, { piiInText: false }).text);
  assert.ok(!("e_posta" in j2.satirlar[0]));
  assert.equal(j2.satirlar[0].tckn, "10000000146");
  assert.equal(j2.satirlar[0].not, "ara: 0533 000 00 09");
});

test("JSON: türlü değerler, kaynak izi, uyarılar, anahtar biçimi", () => {
  const [t] = tableFrom("", S.sources[0].html, { url: S.sources[0].url, title: S.sources[0].title });
  const j = JSON.parse(C.exportJson(t, {}, { version: "0.1.0" }).text);
  assert.equal(j.kaynak.adres, "https://ornek-magaza.example/kampanya");
  assert.equal(j.kaynak.uygulama, "Insight Table 0.1.0");
  assert.equal(j.satirlar[0].fiyat, 1299.9);
  assert.equal(j.satirlar[0].kargo_bedava, true);
  assert.equal(j.satirlar[0]._kaynak_satir, 2);
  assert.equal(j.sutunlar[1].birim, "TRY");
  assert.ok(j.uyarilar.some((u) => u.tur === "Türüne uymuyor" && u.satir === 6));
  assert.ok(j.uyarilar.some((u) => u.tur === "Mükerrer satır"));
  const j2 = JSON.parse(C.exportJson(t, { jsonKeys: "ad", sourceTrail: false }).text);
  assert.equal(j2.satirlar[0]["Kargo bedava"], true);
  assert.ok(!("_kaynak_satir" in j2.satirlar[0]));
  t.cols.forEach((c) => (c.include = false));
  assert.throws(() => C.exportJson(t, {}), /sütun yok/);
});

test("Ölçüt: elle etiketli örnek tablolarda hücre doğruluğu ≥ %99", () => {
  const tables = [];
  for (const s of S.sources) for (const t of tableFrom(s.text, s.html)) { t.sampleKey = s.key; tables.push(t); }
  const g = C.evaluateGold(tables, S.gold, {});
  assert.equal(g.cells, 84);
  assert.deepEqual(g.misses, []);
  assert.ok(g.accuracy >= 99);
});

test("MyMind isteği veri azaltılmış; yanıt denetimi: yalnız var olan sütun, örnek satırlara işaret, hücre değeri önerisi atılır", () => {
  const [t] = tableFrom("", S.sources[2].html, { url: S.sources[2].url });
  const p = C.aiPayload(t, {});
  const sent = JSON.stringify(p.messages);
  assert.ok(!/example\.(com|org|net)|0532|0533|etkinlik\.example/.test(sent), "kişisel veri ya da kaynak adresi gitmemeli");
  assert.ok(sent.includes("⟦e-posta⟧"));
  assert.deepEqual(p.sampleRows, [2, 3, 4, 5]);
  const reply = "```json\n" + JSON.stringify({
    sutunlar: [{ no: 1, ad: "Ad soyad" }, { no: 9, ad: "Yok" }, { no: 4, ad: "Kayıt tarihi", deger: "2026-10-01" }, { no: 2, ad: "Ad soyad" }],
    isaretler: [{ satir: 5, sutun: 2, neden: "e-posta eksik" }, { satir: 40, sutun: 1, neden: "x" }, { satir: 3, sutun: 3, neden: "şüpheli", deger: "0533 111" }],
    satirlar: [["uydurma"]],
  }) + "\n```";
  const v = C.validateAi(reply, p, t, {});
  assert.deepEqual(v.names, [{ col: 0, name: "Ad soyad" }, { col: 3, name: "Kayıt tarihi" }]);
  assert.deepEqual(v.flags.map((f) => [f.row, f.col]), [[4, 1], [2, 2]]);
  assert.equal(v.cellBlocked, 3);
  assert.ok(v.droppedList.some((d) => /Sütun 9/.test(d)));
  assert.ok(v.droppedList.some((d) => /çakışıyor/.test(d)));
  assert.throws(() => C.validateAi("tamam", p, t, {}), /JSON/);
  t.ai = { ...v, at: "x" };
  const a = C.analyze(t, {});
  assert.ok(a.flags.some((f) => f.code === "mymind" && f.row === 3 && f.col === 1));
});

test("Ayarlar ve tablo normalleştirme güvenli varsayılanlara döner", () => {
  const s = C.normalizeSettings({ csvDelimiter: ",", csvDecimal: ",", localUrl: "https://kotu.example", piiDefault: "x", provider: "baska" });
  assert.equal(s.csvDecimal, ".");
  assert.equal(s.localUrl, "http://127.0.0.1:1234");
  assert.equal(s.piiDefault, "maske");
  assert.equal(s.provider, "hub");
  assert.equal(C.normalizeTable({ raw: "x" }), null);
  const t = C.normalizeTable({ raw: [["a", "b"], ["1"]], cols: [{ type: "kotu", pii: "x" }], source: { url: "javascript:alert(1)" }, headerRows: 9 });
  assert.equal(t.cols[0].type, "oto");
  assert.equal(t.source.url, "");
  assert.equal(t.headerRows, 1);
  assert.deepEqual(t.raw[1], ["1", ""]);
});
