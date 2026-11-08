import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

test("1. HTML tablosunu sütun önizlemesi ve kaynak iziyle ayrıştırır", () => {
  const tbl = C.buildTable(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  assert.equal(tbl.format, "html_table");
  assert.equal(tbl.columns.length, 5);
  assert.equal(tbl.rows.length, 3);
  assert.equal(tbl.columns[1].type, "para");
  assert.equal(tbl.columns[2].type, "tarih");
  assert.equal(tbl.columns[3].type, "mantiksal");
  assert.equal(tbl.rows[0].cells[1].value, "1450.75 TL");
  assert.equal(tbl.rows[0].cells[2].value, "2026-11-15");
  assert.equal(tbl.rows[0].cells[0].trace.sourceLine, 2);
});

test("2. Markdown tablosunu ve İngilizce para/ondalık biçimini normalleştirir", () => {
  const tbl = C.buildTable(SAMPLE.samples[1].text, SAMPLE.samples[1]);
  assert.equal(tbl.format, "markdown");
  assert.equal(tbl.columns[1].type, "para");
  assert.equal(tbl.rows[0].cells[1].value, "49.90 $");
  assert.equal(tbl.rows[0].cells[2].value, "2026-12-01");
  assert.equal(tbl.rows[2].cells[3].value, "Hayır");
});

test("3. HTML <ul>/<li> anahtar-değer listesini yapılandırılmış tabloya dönüştürür", () => {
  const tbl = C.buildTable(SAMPLE.samples[2].text, SAMPLE.samples[2]);
  assert.equal(tbl.format, "html_list");
  assert.deepEqual(tbl.columns.map((c) => c.name), ["Şube", "Denetim Puanı", "Tarih", "Onay"]);
  assert.equal(tbl.columns[1].type, "sayi");
  assert.equal(tbl.rows[0].cells[1].value, "94.5");
});

test("4. Eksik ve hatalı hücreleri işaretler; kaynaksız değer uydurmaz", () => {
  const tbl = C.buildTable(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const anomalyCell = tbl.rows[2].cells[1]; // "bekleniyor" in para column
  const missingCell = tbl.rows[2].cells[4]; // "—"
  assert.equal(anomalyCell.status, "anomaly");
  assert.equal(anomalyCell.value, "bekleniyor");
  assert.equal(missingCell.status, "missing");
  assert.equal(missingCell.value, "");
  assert.equal(tbl.stats.unverifiedCompleted, 0);
});

test("5. CSV dışa aktarmada formül enjeksiyonunu (=, +, -, @) etkisizleştirir", () => {
  const tbl = C.buildTable(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const out = C.exportCsv(tbl, { maskPii: false });
  assert.ok(out.escapedFormulas >= 1);
  assert.match(out.csv, /'=HYPERLINK/);
});

test("6. Kişisel veri (e-posta, telefon, IBAN, TCKN) tespiti ve maskelemesi çalışır", () => {
  const pii = C.detectPii("İletişim: ali@ornek.com ve 0532 411 22 33");
  assert.deepEqual(pii.sort(), ["eposta", "telefon"]);
  const masked = C.maskPiiText("İletişim: ali@ornek.com ve 0532 411 22 33");
  assert.equal(masked, "İletişim: [E-POSTA] ve [TELEFON]");
});

test("7. CSV ve JSON dışa aktarmada PII maskelemesi ve kaynak izi (_trace) korunur", () => {
  const tbl = C.buildTable(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const csvOut = C.exportCsv(tbl, { maskPii: true });
  assert.ok(!csvOut.csv.includes("anadolulojistik.com.tr"));
  assert.ok(csvOut.csv.includes("[E-POSTA]"));
  const jsonOut = C.exportJson(tbl, { maskPii: true, includeTrace: true });
  const parsed = JSON.parse(jsonOut.json);
  assert.equal(parsed.rows[0]._trace.tedarikci_adi.line, 2);
});

test("8. TSV ve noktalı virgüllü CSV girdilerini doğru ayrıştırır", () => {
  const tsv = "Ad\tYaş\tŞehir\nAyşe\t29\tİzmir\nMehmet\t34\tBursa";
  const t1 = C.buildTable(tsv, { title: "TSV" });
  assert.equal(t1.format, "tsv");
  assert.equal(t1.columns[1].type, "sayi");
  const csv = "Ürün;Adet;Tarih\nKalem;120;10.10.2026\nDefter;85;11.10.2026";
  const t2 = C.buildTable(csv, { title: "CSV" });
  assert.equal(t2.format, "csv");
  assert.equal(t2.rows[0].cells[2].value, "2026-10-10");
});

test("9. MyMind yükü PII verilerini maskeler ve doğrulayıcı kaynaksız hücre tamamlamayı reddeder", () => {
  const tbl = C.buildTable(SAMPLE.samples[0].text, SAMPLE.samples[0]);
  const payload = C.aiPayload(tbl);
  const rawSent = JSON.stringify(payload.messages);
  assert.ok(!rawSent.includes("teklif@anadolulojistik.com.tr"));
  const res = C.validateAi(JSON.stringify({
    columns: [
      { index: 0, name: "Tedarikçi", key: "tedarikci", type: "metin" },
      { index: 1, name: "Birim Fiyat (TL)", key: "birim_fiyat_tl", type: "para", fillValue: "1000 TL" },
      { index: 99, name: "Uydurma Sütun", type: "metin" },
    ],
    fillValues: [{ row: 2, col: 4, value: "uydurma@ornek.com" }],
    notes: ["2. satırda fiyat bekleniyor olarak işaretlenmiş."],
  }), tbl);
  assert.equal(res.columns.length, 2);
  assert.ok(res.dropped >= 2, "uydurma sütun ve kaynaksız hücre doldurma atılmalı");
});

test("10. Doğrulama ölçütü: kaynağa göre hücre doğruluğu ≥%99 hesaplanır", () => {
  const tables = SAMPLE.samples.map((s) => C.buildTable(s.text, s));
  const m = C.metrics(tables, {});
  assert.equal(m.cellAccuracy, 100);
  assert.equal(m.unverifiedCompleted, 0);
});
