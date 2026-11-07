// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const tableOf = (content, format, work, settings) => {
  const cap = C.createCapture({ content, format }, S.BASE);
  return C.buildTable(cap.candidates[0], work || {}, settings || {}, cap.input.lang);
};
const sampleTables = () => {
  const out = {};
  for (const p of S.pages) { const cap = C.createCapture({ content: p.content, format: p.format, url: p.url, title: p.title }, S.BASE); out[p.key] = C.buildTable(cap.candidates[0], {}, {}, cap.input.lang); }
  return out;
};

test("HTML: betik/stil yok sayılır, gizli sıralama anahtarı atılır, colspan/rowspan yayılır, iki satırlı başlık birleşir", () => {
  const cap = C.createCapture({ content: S.pages[0].content, format: "html" }, S.BASE);
  assert.equal(cap.input.title, "İlçe kütüphaneleri — 2026 ilk çeyrek");
  assert.equal(cap.input.lang, "tr");
  assert.equal(cap.candidates[0].kind, "table");
  assert.match(cap.candidates[0].caption, /^Tablo 1\./);
  assert.equal(cap.candidates.length, 2, "tablo + bağlantı listesi; betikteki tablo alınmaz");
  const t = C.buildTable(cap.candidates[0], {}, {}, "tr");
  assert.deepEqual(t.columns.map((c) => c.name), ["İlçe", "Kütüphane", "Ödünç / Kitap", "Ödünç / E-kitap", "Doluluk", "Açılış", "İletişim", "Not"]);
  assert.equal(t.rows[1].cells[0].raw, "Merkez", "rowspan kopyası");
  assert.equal(t.rows[1].cells[0].span, true);
  assert.equal(t.rows[0].cells[2].raw, "12.450", "display:none sıralama anahtarı alınmadı");
  assert.equal(t.rows[4].cells[0].raw, "Gölbaşı", "&shy; kaldırıldı");
  assert.equal(t.rows[0].src, 3);
  assert.equal(t.rows[1].src, 4, "satır izi rowspan kopyasından değil kendi hücresinden");
});

test("örneklerde elle etiketli hücre doğruluğu %100 (ölçüt ≥%99)", () => {
  const g = C.evaluateGold(sampleTables(), S.gold);
  assert.deepEqual(g.misses, []);
  assert.equal(g.accuracy, 100);
  assert.ok(g.total >= 40);
});

test("sayı biçimi: TR/EN, binlik belirsizliği, birim, dipnot, parantezli eksi", () => {
  assert.deepEqual(C.numberShape("1.234,56"), { tr: 1234.56, en: null, kind: "tr", unit: "" });
  assert.deepEqual(C.numberShape("$1,299.00"), { tr: null, en: 1299, kind: "en", unit: "$" });
  assert.equal(C.numberShape("1.234").kind, "belirsiz");
  assert.equal(C.numberShape("%12,5").unit, "%");
  assert.equal(C.numberShape("4.120[2]").tr, 4120);
  assert.equal(C.numberShape("(1.500)").tr, -1500);
  assert.equal(C.numberShape("12 kg"), null);
  assert.equal(C.numberShape("1.2.3"), null);
  // Dil ipucu olmayan metinde yalnız belirsiz sayılar → belirsiz işaretlenir, uydurulmaz
  const t = tableOf("Ad\tTutar\nA\t1.250\nB\t2.400\nC\t980\n", "metin");
  assert.equal(t.columns[1].type, "sayi");
  assert.equal(t.columns[1].stats.belirsiz, 2);
  assert.equal(t.rows[0].cells[1].v, 1250);
  assert.match(t.rows[0].cells[1].why, /iki türlü/);
  // Kullanıcı EN seçerse
  const t2 = tableOf("Ad\tTutar\nA\t1.250\nB\t2.400\nC\t980\n", "metin", {}, { numberLocale: "en" });
  assert.equal(t2.rows[0].cells[1].v, 1.25);
  assert.equal(t2.columns[1].stats.belirsiz, 0);
  // Karışık biçim → azınlık uyumsuz
  const t3 = tableOf("Ad\tTutar\nA\t1.250,5\nB\t2.400,75\nC\t3.100,1\nD\t1,250.5\n", "metin");
  assert.equal(t3.columns[1].locale, "tr");
  assert.equal(t3.rows[3].cells[1].flag, "uyumsuz");
  assert.equal(t3.rows[3].cells[1].v, null);
});

test("tarih: ISO, GG.AA.YYYY, ay adları (TR/EN), gün/ay belirsizliği", () => {
  assert.equal(C.dateShape("12.03.1998").dmy, "1998-03-12");
  assert.equal(C.dateShape("3 Nisan 2019").dmy, "2019-04-03");
  assert.equal(C.dateShape("Mar 3, 2026").dmy, "2026-03-03");
  assert.equal(C.dateShape("15 Kas 2026").dmy, "2026-11-15");
  assert.equal(C.dateShape("31.02.2026"), null);
  assert.equal(C.dateShape("2026-07-01T10:00:00Z").dmy, "2026-07-01");
  const amb = C.dateShape("04/05/2026");
  assert.equal(amb.kind, "egik-belirsiz");
  assert.equal(amb.dmy, "2026-05-04");
  assert.equal(amb.mdy, "2026-04-05");
  const t = tableOf("Olay\tTarih\nA\t04/05/2026\nB\t07/08/2026\n", "metin");
  assert.equal(t.columns[1].type, "tarih");
  assert.equal(t.rows[0].cells[1].flag, "belirsiz");
  const t2 = tableOf("Olay\tTarih\nA\t04/05/2026\nB\t25/08/2026\n", "metin");
  assert.equal(t2.columns[1].dateOrder, "gun", "25 > 12 → gün önce");
  assert.equal(t2.rows[0].cells[1].flag, null);
  assert.equal(t2.rows[0].cells[1].v, "2026-05-04");
});

test("metin girdileri: TSV, CSV (noktalı virgül, tırnak), Markdown tablosu, liste", () => {
  assert.equal(C.extract({ content: "a\tb\n1\t2\n3\t4" }).candidates[0].kind, "tsv");
  const csv = C.extract({ content: 'Ad;Not\n"Ece; Demir";"satır ""bir"""\nAli;iki' }).candidates[0];
  assert.equal(csv.kind, "csv");
  assert.equal(csv.grid[1][0].t, "Ece; Demir");
  assert.equal(csv.grid[1][1].t, 'satır "bir"');
  const md = C.extract({ content: "| Ad | Puan |\n| --- | ---: |\n| A | 4,5 |\n| B \\| C | 3 |" }).candidates[0];
  assert.equal(md.kind, "md");
  assert.equal(md.headerGuess, 1);
  assert.equal(md.grid[2][0].t, "B | C");
  const li = C.extract({ content: "- Elma: 3 kg\n- Armut: 2 kg\n- Kiraz: 1 kg" }).candidates[0];
  assert.equal(li.kind, "list");
  assert.equal(li.grid[0].length, 2);
  assert.throws(() => C.createCapture({ content: "tek satır düz metin" }), /tablo bulunamadı/);
});

test("eksik değer uydurulmaz: yer tutucu ve boş hücre null + işaret; kısa satır eksik", () => {
  const t = tableOf("<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td><td>—</td><td>x</td></tr><tr><td>2</td></tr></table>", "html");
  assert.equal(t.rows[0].cells[1].v, null);
  assert.equal(t.rows[0].cells[1].flag, "eksik");
  assert.equal(t.rows[1].cells[2].flag, "eksik");
  assert.match(t.notes.join(" "), /farklı uzunlukta/);
});

test("başlık tahmini ve tekrar eden başlık satırları; ad normalleştirme", () => {
  const t = tableOf("<table><tr><td>Ad</td><td>Yaş</td></tr><tr><td>Ece</td><td>31</td></tr><tr><td>Ad</td><td>Yaş</td></tr><tr><td>Ali</td><td>28</td></tr></table>", "html");
  assert.equal(t.header, 1);
  assert.equal(t.totals.rows, 2);
  assert.match(t.notes.join(" "), /başlığın tekrarı/);
  assert.deepEqual(C.normalizeNames(["  Ad: ", "", "Ad", "Toplam[1]"]), ["Ad", "Sütun 2", "Ad (2)", "Toplam"]);
  const t2 = tableOf("<table><tr><td>Ad</td><td>Yaş</td></tr><tr><td>Ece</td><td>31</td></tr></table>", "html", { header: 0 });
  assert.equal(t2.totals.rows, 2);
  assert.equal(t2.columns[0].name, "Sütun 1");
});

test("kişisel veri: sütun algılama, varsayılan maskeleme, çıkarma; T.C. kimlik/IBAN/kart doğrulamalı", () => {
  assert.equal(C.piiOf("ece@ornek.example"), "email");
  assert.equal(C.piiOf("10000000146"), "tckn");
  assert.equal(C.piiOf("12345678901"), null, "geçersiz T.C. kimlik değil");
  assert.equal(C.piiOf("TR33 0006 1005 1978 6457 8413 26"), "iban");
  assert.equal(C.piiOf("4111 1111 1111 1111"), "kart");
  assert.equal(C.piiOf("0532 123 45 67"), "telefon");
  assert.equal(C.maskValue("ece@ornek.example"), "e•••@ornek.example");
  assert.equal(C.maskValue("0532 123 45 67"), "•••• ••• •• 67");
  const ts = sampleTables();
  const k = ts.kutuphane;
  const ilet = k.columns.find((c) => c.name === "İletişim");
  assert.equal(ilet.pii, "email");
  assert.equal(ilet.piiMode, "maskele");
  const csv = C.exportCsv(k, {});
  assert.doesNotMatch(csv.text, /merkez\.kutuphane@/);
  assert.equal(csv.masked, 5);
  const k2 = C.buildTable(C.createCapture({ content: S.pages[0].content, format: "html" }).candidates[0], { cols: [, , , , , , { pii: "cikar" }] }, {}, "tr");
  assert.ok(!C.exportCsv(k2, {}).text.includes("İletişim"));
  assert.ok(!JSON.stringify(C.exportJson(k2, {}).doc).includes("ornek.example"));
});

test("CSV enjeksiyonu: = + - @ (tam genişlik, baştaki boşluk, sekme) etkisizleşir; sayılar sayı kalır; geri okuma doğrulaması", () => {
  for (const s of ["=1+1", "+90", "-cmd", "@SUM(A1)", "  =x", "\t=x", "＝1"]) assert.equal(C.safeText(s).neutralized, true, s);
  assert.equal(C.safeText("normal").neutralized, false);
  const t = tableOf("Ad\tTutar\tNot\nA\t-5\t=HYPERLINK(\"x\")\nB\t10\t@kişi\nC\t-2,5\tdüz\n", "metin");
  const e = C.exportCsv(t, { trace: "satir" });
  assert.equal(e.neutralized, 2);
  assert.match(e.text, /\nA,-5,"'=HYPERLINK\(""x""\)",R2/);
  assert.match(e.text, /\nC,-2\.5,düz,R4/);
  const v = C.verifyCsv(e.text, e);
  assert.equal(v.pass, true);
  assert.equal(C.verifyCsv(e.text.replace("düz", "duz"), e).pass, false, "bozulan dosya yakalanır");
  const x = C.exportCsv(t, { profile: "excel-tr" });
  assert.equal(x.delimiter, ";");
  assert.match(x.text, /\nC;-2,5;düz/);
  assert.equal(C.verifyCsv(x.text, x).pass, true);
  assert.equal(e.text.charCodeAt(0), 0xfeff);
});

test("JSON: türlü değerler, satır ve hücre izi, kaynak bilgisi; geri okuma doğrulaması", () => {
  const t = sampleTables().urunler;
  const j = C.exportJson(t, { url: "https://shop.example.com/compare/headphones", title: "Headphone comparison", capturedAt: S.BASE, table: 1 }, { trace: "hucre" });
  const d = JSON.parse(j.text);
  assert.equal(d.kaynak.adres, "https://shop.example.com/compare/headphones");
  assert.equal(d.satirlar[0].Price.deger, 1299);
  assert.equal(d.satirlar[0].Price.ham, "$1,299.00");
  assert.equal(d.satirlar[0].Price.iz, "R2C2");
  assert.equal(d.satirlar[0].Wireless.deger, true);
  assert.equal(d.satirlar[2].Rating.isaret, "eksik");
  assert.equal(d.sutunlar[1].birim, "$");
  assert.equal(C.verifyJson(j.text, j).pass, true);
  const j2 = C.exportJson(t, {}, { trace: "satir" });
  assert.deepEqual(JSON.parse(j2.text).satirlar[1]._kaynak, { satir: 3 });
});

test("sütun ayarları: ad, tür, dahil etme, satır atlama", () => {
  const cap = C.createCapture({ content: S.pages[1].content, format: "html" });
  const t = C.buildTable(cap.candidates[0], { cols: [{ name: "Ürün" }, { type: "metin" }, { include: false }], skipRows: [2] }, {}, "en");
  assert.equal(t.columns[0].name, "Ürün");
  assert.equal(t.columns[0].renamed, true);
  assert.equal(t.columns[1].type, "metin");
  assert.equal(t.rows[0].cells[1].v, "$1,299.00");
  assert.equal(t.totals.rows, 3);
  const e = C.exportCsv(t, {});
  assert.ok(!e.text.includes("Rating"));
  assert.ok(!e.text.includes("Bolt Mini"));
});

test("MyMind: istekte kişisel veri ve kaynak yok; yanıtta hücre değeri önerisi ve olmayan sütun atılır", () => {
  const t = sampleTables().kutuphane;
  const p = C.aiPayload(t);
  const sent = JSON.stringify(p.messages);
  assert.doesNotMatch(sent, /@ornek\.example|555 12 34|belediye\.example/);
  assert.match(sent, /örnek gönderilmedi/);
  assert.ok(p.sent.samples <= t.columns.length * 3);
  const res = C.validateAi('```json\n{"sutunlar":[{"i":2,"ad":"Ödünç kitap (adet)"},{"i":3,"ad":"Ödünç e-kitap","degerler":[1,2]},{"i":9,"ad":"Uydurma"},{"i":4,"ad":"Ödünç kitap (adet)"}],"uyarilar":[{"i":5,"not":"Bir tarih eksik gün içeriyor"},{"i":40,"not":"x"}],"doldur":{"2":{"3":"500"}}}\n```', t);
  assert.deepEqual(res.names, { 2: "Ödünç kitap (adet)", 3: "Ödünç e-kitap" });
  assert.equal(res.warnings.length, 1);
  assert.ok(res.dropped >= 4);
  assert.ok(res.droppedList.some((s) => /doldur/.test(s)));
  assert.throws(() => C.validateAi("tamam", t), /JSON/);
});

test("kayıt biçimleri: bozuk veri temizlenir, ayarlar yalnız loopback yerel model", () => {
  assert.equal(C.normalizeSettings({ localUrl: "http://kotu.example:1234" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({}).trace, "satir");
  assert.equal(C.normalizeCapture({ candidates: [] }), null);
  const cap = C.createCapture({ content: S.pages[0].content, format: "html", url: "javascript:alert(1)" });
  assert.equal(cap.input.url, "");
  const back = C.normalizeCapture(JSON.parse(JSON.stringify(cap)));
  assert.deepEqual(back.candidates[0].grid, cap.candidates[0].grid);
});
