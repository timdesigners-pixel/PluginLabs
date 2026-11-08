import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

test("1. Şablon 1 (e-Arşiv/e-Fatura metin ve UBL XML) alan çıkarımı ve deterministik tutarlılık", () => {
  const d1 = C.parseInvoice(SAMPLE.documents[0].text, { sampleKey: SAMPLE.documents[0].key });
  assert.equal(d1.template, "earsiv-fatura");
  assert.equal(d1.vendor, "Kuzey Bulut Bilişim A.Ş.");
  assert.equal(d1.invoiceNo, "GIB2026000001482");
  assert.equal(d1.issueDate, "2026-11-03");
  assert.equal(d1.dueDate, "2026-11-17");
  assert.equal(d1.subtotal, 8500);
  assert.equal(d1.taxTotal, 1700);
  assert.equal(d1.grandTotal, 10200);
  assert.equal(d1.items.length, 2);
  assert.equal(d1.consistency.deterministicOk, true);
  assert.equal(d1.consistency.needsReview, false);

  const d2 = C.parseInvoice(SAMPLE.documents[1].text, { sampleKey: SAMPLE.documents[1].key });
  assert.equal(d2.template, "earsiv-fatura");
  assert.equal(d2.vendor, "Atölye Çizgi Tasarım Ltd. Şti.");
  assert.equal(d2.invoiceNo, "EFT2026000000914");
  assert.equal(d2.issueDate, "2026-11-01");
  assert.equal(d2.dueDate, "2026-11-15");
  assert.equal(d2.grandTotal, 14400);
  assert.equal(d2.consistency.deterministicOk, true);
});

test("2. Şablon 2 (Perakende fiş / Serbest meslek makbuzu) alan çıkarımı", () => {
  const d3 = C.parseInvoice(SAMPLE.documents[2].text, { sampleKey: SAMPLE.documents[2].key });
  assert.equal(d3.template, "serbest-makbuz-fis");
  assert.equal(d3.vendor, "Boğaziçi Ofis ve Kırtasiye Paz. Tic.");
  assert.equal(d3.invoiceNo, "FIS202600419");
  assert.equal(d3.issueDate, "2026-11-04");
  assert.equal(d3.subtotal, 2500);
  assert.equal(d3.taxTotal, 500);
  assert.equal(d3.grandTotal, 3000);
  assert.equal(d3.consistency.deterministicOk, true);
});

test("3. Kalem + vergi != genel toplam uyumsuzluğu deterministik hesapla yakalanır ve zorunlu incelemeye düşer", () => {
  const bad = C.parseInvoice(SAMPLE.documents[3].text, { sampleKey: SAMPLE.documents[3].key });
  assert.equal(bad.subtotal, 5000);
  assert.equal(bad.taxTotal, 1000);
  assert.equal(bad.grandTotal, 6450);
  assert.equal(bad.consistency.deterministicOk, false);
  assert.equal(bad.consistency.needsReview, true);
  assert.ok(bad.consistency.reasons.some((r) => /Ara toplam \+ KDV/.test(r)));
});

test("4. Zorunlu incelemeli belge rakamlar düzeltilmeden veya açık istisna notu olmadan onaylanamaz", () => {
  const bad = C.parseInvoice(SAMPLE.documents[3].text);
  assert.throws(() => C.approveInvoice(bad), /tutarsız alan var/);
  // Rakam düzeltilince onaylanır:
  C.approveInvoice(bad, { grandTotal: 6000 });
  assert.equal(bad.status, "onayli");
  assert.equal(bad.consistency.deterministicOk, true);
});

test("5. İstisna onayı: inceleme notu + confirmMismatch ile tutarsız belge kayıt altına alınabilir", () => {
  const bad = C.parseInvoice(SAMPLE.documents[3].text);
  C.approveInvoice(bad, { reviewNote: "450 TL gecikme zammı faturaya dahil edilmiş", confirmMismatch: true });
  assert.equal(bad.status, "onayli");
  assert.equal(bad.mismatchConfirmed, true);
});

test("6. Kimlik verisi kırpma (TCKN, IBAN, kredi kartı) açık/kapalı davranışı", () => {
  const dRedacted = C.parseInvoice(SAMPLE.documents[0].text, { settings: { redactIdentity: true } });
  assert.ok(!dRedacted.rawText.includes("34567890124"));
  assert.ok(dRedacted.rawText.includes("[TCKN-KIRPILDI]"));
  assert.ok(dRedacted.rawText.includes("TR[IBAN-KIRPILDI]"));
  assert.equal(dRedacted.redactedCount, 2);

  const dRaw = C.parseInvoice(SAMPLE.documents[0].text, { settings: { redactIdentity: false } });
  assert.ok(dRaw.rawText.includes("34567890124"));
  assert.equal(dRaw.redactedCount, 0);
});

test("7. Notion doğrulama ölçütü: örnek belgelerde toplam ve tarih doğruluğu >= %98", () => {
  const parsed = SAMPLE.documents.map((s) => C.parseInvoice(s.text, { sampleKey: s.key }));
  const gold = C.evaluateGold(parsed, SAMPLE.gold);
  assert.ok(gold.totalAccuracy >= 98, `Beklenen >=98, gelen ${gold.totalAccuracy}`);
  assert.ok(gold.dateAccuracy >= 98, `Beklenen >=98, gelen ${gold.dateAccuracy}`);
  assert.equal(gold.mismatchCaught, gold.mismatchExpected);
});

test("8. Finansal Asistan uyumlu CSV dışa aktarma: yalnız insan onaylı belgeleri içerir ve formül enjeksiyonunu engeller", () => {
  const d1 = C.parseInvoice(SAMPLE.documents[0].text);
  const d2 = C.parseInvoice(SAMPLE.documents[2].text);
  C.approveInvoice(d1, { vendor: "=CMD|' /C calc'!A0 Kuzey Bulut" });
  // d2 incelemede kalıyor
  const csv = C.exportCsv([d1, d2]);
  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 2, "başlık + yalnız 1 onaylı belge");
  assert.match(lines[1], /'=CMD/);
  assert.ok(!csv.includes("FIS202600419"), "onaysız belge CSV'ye girmez");
});

test("9. Otomatik vergi beyannamesi / muhasebe gönderimi her zaman kapalıdır", () => {
  const s = C.normalizeSettings({ autoSubmitFiling: true });
  assert.equal(s.autoSubmitFiling, false);
});

test("10. MyMind veri azaltma ve deterministik yanıt doğrulaması", () => {
  const d = C.parseInvoice(SAMPLE.documents[0].text + "\nİletişim: muhasebe@kuzeybulut.com.tr · 0532 111 22 33", {
    settings: { redactIdentity: false },
  });
  const payload = C.aiPayload(d);
  const userMsg = payload.messages[1].content;
  assert.ok(!userMsg.includes("34567890124"), "TCKN modele gitmez");
  assert.ok(!userMsg.includes("1978 6457"), "IBAN modele gitmez");
  assert.ok(!userMsg.includes("muhasebe@kuzeybulut.com.tr"), "E-posta modele gitmez");

  const aiRes = C.validateAi(
    JSON.stringify({
      satici: "Kuzey Bulut Bilişim A.Ş.",
      faturaNo: "GIB2026000001482",
      duzenlemeTarihi: "2026-11-03",
      sonOdemeTarihi: "2026-11-17",
      araToplam: 8500,
      kdv: 1700,
      genelToplam: 99999, // tutarsız model çıktısı!
      not: "Model tahmini",
    }),
    d
  );
  assert.equal(aiRes.deterministicOk, false, "Modelin tutarsız toplamı deterministik kontrole takılır");
});

test("11. Yerel model URL doğrulaması yalnız loopback kabul eder", () => {
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:1234"), true);
  assert.equal(C.isLoopbackUrl("http://localhost:11434"), true);
  assert.equal(C.isLoopbackUrl("https://api.openai.com/v1"), false);
  assert.equal(C.isLoopbackUrl("http://192.168.1.10:1234"), false);
});
