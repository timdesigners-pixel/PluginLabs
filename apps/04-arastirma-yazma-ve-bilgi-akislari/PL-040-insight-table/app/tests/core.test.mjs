// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const open = (src) => {
  const meta = src.html ? C.htmlMeta(src.html) : {};
  const ds = C.createDataset({ ...src, lang: meta.lang, title: src.title || meta.title }, C.candidates({ html: src.html, text: src.text }), S.BASE, C.normalizeSettings({}));
  ds.sampleKey = src.key || null;
  return ds;
};
const col = (ds, name) => ds.columns.find((c) => c.auto === name || c.name === name);
const vals = (ds, name) => { const i = ds.columns.indexOf(col(ds, name)); return C.analyze(ds).cells.map((r) => r[i].v); };

test("sayı: TR/EN ayraçları, para birimi, yüzde, muhasebe parantezi, Unicode eksi; belirsiz biçim işaretlenir", () => {
  const n = (s, l) => C.parseNumber(s, l || "auto");
  assert.equal(n("1.234,56").value, 1234.56);
  assert.equal(n("1,234.56").value, 1234.56);
  assert.equal(n("12.000.000").value, 12000000);
  assert.equal(n("-₺12,5").value, -12.5);
  assert.equal(n("-₺12,5").currency, "TRY");
  assert.equal(n("%-1,2").value, -1.2);
  assert.equal(n("%-1,2").percent, true);
  assert.equal(n("(1.000,00)").value, -1000);
  assert.equal(n("−3").value, -3);
  assert.equal(n("$1,200.00").value, 1200);
  assert.equal(n("1.250 TL").value, 1250, "TL'de üç haneli ondalık olmaz → binlik");
  assert.equal(n("1.234").ambiguous, true);
  assert.equal(n("1.234", "tr").value, 1234);
  assert.equal(n("1.234", "en").value, 1.234);
  assert.equal(n("1,5", "en").ok, false, "zorunlu EN'de virgül ondalık kabul edilmez");
  for (const bad of ["abc", "1..2", "12,", "1.2.3,4.5", "12 elma"]) assert.equal(n(bad).ok, false, bad);
});

test("tarih: ISO, gg.aa.yyyy, eğik çizgide gün/ay çözümü, Türkçe ve İngilizce ay adları; geçersiz tarih reddedilir", () => {
  const d = (s, l) => C.parseDate(s, l || "auto");
  assert.equal(d("2026-11-08").value, "2026-11-08");
  assert.equal(d("08.11.2026").value, "2026-11-08");
  assert.equal(d("13/04/2026").value, "2026-04-13");
  assert.equal(d("04/13/2026").value, "2026-04-13");
  assert.equal(d("03/04/2026").ambiguous, true);
  assert.equal(d("03/04/2026", "en").value, "2026-03-04");
  assert.equal(d("03/04/2026", "tr").value, "2026-04-03");
  assert.equal(d("12 Kasım 2026").value, "2026-11-12");
  assert.equal(d("12 Kas 2026").value, "2026-11-12");
  assert.equal(d("Nov 12, 2026").value, "2026-11-12");
  assert.equal(d("8 Eylül 2026").value, "2026-09-08");
  assert.equal(d("31.02.2026").ok, false);
  assert.equal(d("bugün").ok, false);
});

test("HTML: script/style atılır, colspan/rowspan açılır, çift başlık satırı birleşir, dipnot temizlenir, varlıklar çözülür", () => {
  const c = C.candidates({ html: S.sources[0].html });
  assert.equal(c[0].label, "Şehir bazında hızlı şarj tarifeleri");
  assert.equal(c[0].headerRows, 2);
  assert.equal(c[0].cols, 8);
  assert.ok(!JSON.stringify(c).includes("bu metin tabloya girmez"), "script içeriği aday olmaz");
  const ds = open(S.sources[0]);
  assert.deepEqual(ds.columns.map((x) => x.name), ["Şehir", "İşletmeci", "Fiyat (kWh) · AC", "Fiyat (kWh) · DC", "Değişim", "Güncelleme", "İstasyon", "İletişim"]);
  assert.deepEqual(vals(ds, "Şehir").slice(0, 2), ["İstanbul", "İstanbul"], "rowspan değeri kapsadığı satıra da yazılır");
  assert.equal(C.analyze(ds).cells[1][0].merged, true, "birleştirilmiş hücre izde işaretli");
  assert.equal(vals(ds, "İşletmeci")[0], "Volta Şarj", "&nbsp; boşluğa çevrilir");
  assert.equal(C.htmlMeta(S.sources[0].html).lang, "tr");
  // gezinme listesi ve küçük tablo da aday (kullanıcı seçer), ama en dolu tablo önce gelir
  assert.equal(c.length, 3);
  assert.ok(c.some((x) => x.kind === "liste"));
});

test("listeler: ortak ayraçla sütunlara bölünür; tanım listesi iki sütun; iç içe alt liste ayrı aday olmaz", () => {
  const html = "<ul><li>Elma — 12,50 TL — Manav</li><li>Armut — 9,75 TL — Manav</li><li>Peynir — 145 TL — Şarküteri<ul><li>alt</li><li>alt2</li><li>alt3</li></ul></li></ul>";
  const c = C.candidates({ html });
  assert.equal(c.length, 1);
  assert.equal(c[0].cols, 3);
  assert.deepEqual(c[0].grid[3], ["Peynir", "145 TL", "Şarküteri"]);
  const dl = C.candidates({ html: S.sources[1].html }).find((x) => x.kind === "tanim");
  assert.deepEqual(dl.grid[0], ["Terim", "Açıklama"]);
  assert.equal(dl.grid[1][0], "Params");
});

test("metin tabloları: sekmeli (Excel/Sheets), CSV ayraç tespiti (; ve tırnaklı alan), Markdown boru tablosu", () => {
  const tsv = C.candidates({ text: S.sources[2].text });
  assert.equal(tsv[0].kind, "tsv");
  assert.equal(tsv[0].headerRows, 1);
  const csv = C.candidates({ text: 'Ad;Tutar;Not\n"Kira; Ocak";18.500,00;"çift ""tırnak"""\nMarket;6.420,35;\n' });
  assert.equal(csv[0].kind, "csv");
  assert.deepEqual(csv[0].grid[1], ["Kira; Ocak", "18.500,00", 'çift "tırnak"']);
  const md = C.candidates({ text: "Bazı notlar\n\n| Ürün | Fiyat |\n|---|---:|\n| Kalem | 12,5 |\n| Defter | 40 |\n" });
  assert.equal(md[0].kind, "md");
  assert.deepEqual(md[0].grid, [["Ürün", "Fiyat"], ["Kalem", "12,5"], ["Defter", "40"]]);
  assert.equal(C.candidates({ text: "tek satır metin" }).length, 0);
});

test("tür çıkarımı ve yerelleştirme: sütun kanıtı, belge dili, kimlik benzeri sayılar metin kalır, belirsizlik işaretlenir", () => {
  const tr = open(S.sources[0]);
  assert.equal(col(tr, "Fiyat (kWh) · AC").type, "para");
  assert.equal(col(tr, "Fiyat (kWh) · AC").currency, "TRY");
  assert.equal(col(tr, "Değişim").type, "yuzde");
  assert.equal(col(tr, "Güncelleme").type, "tarih");
  assert.equal(col(tr, "İstasyon").type, "tamsayi");
  assert.deepEqual(vals(tr, "İstasyon"), [1284, 876, 412, 2031, null, 655], "sayfa dili TR → 1.284 binlik");
  const en = open(S.sources[1]);
  assert.equal(col(en, "Released").locale, "en");
  assert.equal(vals(en, "Released")[3], "2026-08-05", "sütunda 10/14 kanıtı → 08/05 ay/gün okunur");
  assert.equal(col(en, "Open weights").type, "mantiksal");
  const ids = C.inferColumn(["05321112233", "05412223344", "05559998877"], "tr");
  assert.equal(ids.type, "metin", "baştaki sıfır: kimlik/telefon sayıya çevrilmez");
  assert.equal(C.inferColumn(["4111111111111111", "5500000000000004", "340000000000009"], "").type, "metin", "16 hane hassasiyet kaybı olmasın");
  const amb = C.createDataset({ via: "metin" }, C.candidates({ text: "Ürün\tAdet\nA\t1.250\nB\t3.400\nC\t12.000\n" }), S.BASE, {});
  const a = C.analyze(amb);
  assert.equal(a.stats.belirsiz, 3, "kanıt yokken 1.250 belirsiz işaretlenir");
  C.setColumn(amb, 1, { locale: "tr" });
  assert.equal(C.analyze(amb).stats.belirsiz, 0, "biçim elle onaylanınca işaret kalkar");
  assert.deepEqual(C.analyze(amb).cells.map((r) => r[1].v), [1250, 3400, 12000]);
});

test("hücre işaretleri: eksik (boş ve boş işareti), türe uymayan değer boş aktarılır ve uydurulmaz", () => {
  const ds = open(S.sources[0]);
  const a = C.analyze(ds);
  const i = ds.columns.indexOf(col(ds, "Fiyat (kWh) · DC"));
  assert.equal(a.cells[2][i].flag, "eksik");
  assert.match(a.cells[2][i].note, /boş işareti/);
  assert.equal(a.cells[5][i].flag, "hatali");
  assert.equal(a.cells[5][i].v, null);
  assert.equal(a.cells[5][i].raw, "bilinmiyor", "ham metin izde korunur");
  assert.deepEqual([a.stats.eksik, a.stats.hatali], [2, 1]);
});

test("kişisel veri: T.C. kimlik/IBAN/kart doğrulamalı algılanır, e-posta/telefon sütunu, maskeleme son iki karakteri bırakır", () => {
  assert.equal(C.tcknOk("10000000146"), true);
  assert.equal(C.tcknOk("12345678901"), false);
  assert.equal(C.ibanOk("TR33 0006 1005 1978 6457 8413 26"), true);
  assert.equal(C.ibanOk("TR33 0006 1005 1978 6457 8413 27"), false);
  assert.deepEqual(C.findPii("Kart 4111 1111 1111 1111, iletişim a@b.co").map((h) => h.type), ["kart", "eposta"]);
  assert.equal(C.maskPii("destek@volta-ornek.com").text, "d•••@volta-ornek.com");
  assert.equal(C.maskPii("0532 111 22 33").text, "•••• ••• •• 33");
  assert.equal(C.columnPii(["Ali", "10000000146", "Veli"]).type, "tckn");
  assert.equal(C.columnPii(["a@b.co", "", "c@d.co", "-"]).type, "eposta");
  assert.equal(C.columnPii(["Ali", "Veli", "a@b.co", "Ayşe", "Can"]), null, "tek e-posta sütunu kişisel saymaz (%30 altı)");
  const ds = open(S.sources[0]);
  assert.equal(col(ds, "İletişim").pii, "eposta");
  assert.equal(col(ds, "İletişim").piiMode, "maskele");
});

test("CSV: enjeksiyon etkisizleştirilir (yalın negatif sayı değil), maskeleme, Excel Türkçe biçimi; geri okuma tam eşleşir", () => {
  assert.deepEqual(C.csvSafe('=HYPERLINK("x")'), { s: "'=HYPERLINK(\"x\")", neutralized: true });
  assert.equal(C.csvSafe("+Ek gider").neutralized, true);
  assert.equal(C.csvSafe("@SUM(A1)").neutralized, true);
  assert.equal(C.csvSafe("-1.2").neutralized, false, "yalın sayı bozulmaz");
  assert.equal(C.csvSafe("-1+2").neutralized, true);
  const ds = open(S.sources[0]);
  const r = C.exportCsv(ds, {});
  assert.ok(r.text.startsWith("﻿Şehir,İşletmeci,Fiyat (kWh) · AC"));
  assert.ok(r.text.includes(`"'=HYPERLINK(""http://kotu.example"",""Tıkla"")"`));
  assert.ok(!/destek@volta/.test(r.text) && r.text.includes("d•••@volta-ornek.com"));
  assert.equal(r.neutralized, 1);
  assert.equal(r.masked, 6);
  assert.deepEqual(C.verifyExport("csv", r.text, r).ok, true);
  const b = open(S.sources[2]);
  const x = C.exportCsv(b, { preset: "excel-tr" });
  assert.ok(x.text.includes("Market;6420,35;5980,1;;Mert T.;•••• ••• •• 44"));
  assert.ok(x.text.includes("'+Ek gider;300"));
  assert.equal(C.verifyExport("csv", x.text, x).matched, x.expected.flat().length);
  // ham değerler ve kişisel veri sütununu çıkarma
  C.setColumn(b, 5, { piiMode: "cikar" });
  const h = C.exportCsv(b, { values: "ham", bom: false });
  assert.ok(h.text.startsWith("Kalem,Ocak,Şubat,Mart,Sorumlu\r\n"));
  assert.ok(h.text.includes('"18.500,00"'));
  assert.equal(C.verifyExport("csv", h.text, h).ok, true);
  // bozulmuş dosya doğrulamada yakalanır
  assert.equal(C.verifyExport("csv", h.text.replace("Kira", "Kirx"), h).ok, false);
});

test("JSON: türlenmiş değerler, kaynak izi (satır/sütun), sütun meta verisi; izsiz dizi seçeneği", () => {
  const ds = open(S.sources[1]);
  const r = C.exportJson(ds, {});
  const doc = JSON.parse(r.text);
  assert.equal(doc.kaynak.adres, "https://ornek.example/benchmarks");
  assert.equal(doc.sutunlar[2].anahtar, "score");
  assert.deepEqual(doc.satirlar[0], { model: "Atlas-7", params_b: 7, score: 1204.5, released: "2026-11-03", license: "Apache-2.0", open_weights: true, _kaynak: { satir: 2, sutunlar: [1, 2, 3, 4, 5, 6] } });
  assert.equal(doc.satirlar[3].score, null);
  assert.equal(C.verifyExport("json", r.text, r).ok, true);
  const plain = JSON.parse(C.exportJson(ds, { trace: false }).text);
  assert.ok(Array.isArray(plain) && !("_kaynak" in plain[0]));
});

test("örnek kaynaklarda elle etiketli hücre doğruluğu ≥ %99 (Notion doğrulama ölçütü)", () => {
  const list = S.sources.map(open);
  const g = C.evaluateGold(list, S.gold);
  assert.ok(g.cells >= 45, "en az 45 etiketli hücre");
  assert.deepEqual(g.misses, []);
  assert.ok(g.accuracy >= 99);
});

test("sütun düzenleme: ad (benzersiz, anahtar yeniden üretilir), tür, dahil etme; aday ve başlık satırı değişimi", () => {
  const ds = open(S.sources[0]);
  C.setColumn(ds, 6, { name: "Soket sayısı" });
  assert.equal(ds.columns[6].key, "soket_sayisi");
  assert.equal(ds.columns[6].nameFrom, "elle");
  assert.throws(() => C.setColumn(ds, 6, { name: "Şehir" }), /başka bir sütun/);
  assert.throws(() => C.setColumn(ds, 6, { type: "resim" }), /Bilinmeyen tür/);
  C.setColumn(ds, 1, { include: false });
  assert.ok(!C.exportCsv(ds, {}).text.includes("İşletmeci"));
  C.selectCandidate(ds, 1, {});
  assert.equal(ds.columns.length, 2);
  assert.equal(ds.name, "Kampanyalar");
  C.selectCandidate(ds, 0, {});
  C.setHeaderRows(ds, 1, {});
  assert.equal(C.analyze(ds).stats.rows, 7, "başlık 1 satır olunca ikinci başlık satırı veriye döner");
  assert.throws(() => C.selectCandidate(ds, 9, {}), /öyle bir tablo yok/);
});

test("MyMind isteği: kişisel veri maskeli, kaynak adresi yok; yanıtta değer önerisi/olmayan sütun atılır; adlar elle değiştirilene dokunmaz", () => {
  const ds = open(S.sources[0]);
  const p = C.aiPayload(ds);
  const sent = JSON.stringify(p.messages);
  assert.ok(!sent.includes("destek@volta-ornek.com") && !sent.includes("ornek.example/sarj"));
  assert.ok(p.sent.masked >= 6);
  const content = "```json\n" + JSON.stringify({
    sutunlar: [{ no: 1, ad: "Şehir" }, { no: 3, ad: "AC fiyatı (TL/kWh)" }, { no: 4, ad: "DC fiyatı (TL/kWh)", deger: "12,40" }, { no: 99, ad: "Uydurma" }],
    supheli: [{ satir: 6, sutun: 4, neden: "sayı değil" }, { satir: 5, sutun: 7, neden: "boş", duzeltme: "1000" }, { satir: 40, sutun: 1, neden: "yok" }],
    tamamla: { "satir 3": "12,00 TL" },
  }) + "\n```";
  C.setColumn(ds, 0, { name: "İl" });
  const r = C.validateAi(content, p, ds);
  assert.equal(r.flags.length, 2);
  assert.ok(r.dropped >= 4, "deger, duzeltme, olmayan sütun, gönderilmeyen satır, tamamla atılır");
  ds.ai = { ...r, at: S.BASE };
  const before = JSON.stringify(C.analyze(ds).cells.map((row) => row.map((x) => x.v)));
  const n = C.applyAiNames(ds, true);
  assert.equal(n, 2);
  assert.equal(ds.columns[0].name, "İl", "elle verilen ad korunur");
  assert.equal(ds.columns[2].name, "AC fiyatı (TL/kWh)");
  assert.equal(JSON.stringify(C.analyze(ds).cells.map((row) => row.map((x) => x.v))), before, "hücre değerleri değişmez");
  assert.throws(() => C.validateAi("yanıt yok", p, ds), /JSON/);
});

test("kalıcılık: normalleştirme bozuk/eksik alanları düzeltir, sütunlar korunur; ayarlar ve sayaçlar", () => {
  const ds = open(S.sources[2]);
  C.setColumn(ds, 1, { name: "Ocak (TL)" });
  ds.exports.push({ at: S.BASE, format: "csv", file: "x.csv", rows: 4, cols: 6, cells: 30, matched: 30 });
  const back = C.normalizeDatasets(JSON.parse(JSON.stringify([ds, { cands: [] }, null, { id: "x", cands: [{ grid: [["a", "b"], ["1", "2"]] }], columns: "bozuk" }])));
  assert.equal(back.length, 2);
  assert.equal(back[0].columns[1].name, "Ocak (TL)");
  assert.equal(back[0].exports[0].matched, 30);
  assert.equal(back[1].columns.length, 2);
  const st = C.normalizeSettings({ localUrl: "http://10.0.0.5:1234", csvPreset: "excel-tr", defaultLocale: "xx" });
  assert.equal(st.localUrl, "http://127.0.0.1:1234");
  assert.equal(st.csvPreset, "excel-tr");
  assert.equal(st.defaultLocale, "tr");
  assert.equal(C.normalizeCounters({ exports: -3, masked: "4" }).masked, 4);
  assert.throws(() => C.createDataset({ via: "metin" }, [], S.BASE, {}), /tablo ya da liste bulunamadı/);
});
