import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

test("1. Örnek karar panosu: ağırlık payları, puan türetimi ve %100 izlenebilirlik hesaplanır", () => {
  const ev = C.evaluateBoard(SAMPLE.sampleBoard);
  assert.equal(ev.totalWeight, 34);
  assert.equal(ev.totalCells, 12);
  assert.equal(ev.backedCells, 12);
  assert.equal(ev.traceabilityRate, 100);
  assert.equal(ev.fullyTraceable, true);
  assert.equal(ev.leader.optionId, "opt-pg-managed");
  assert.ok(ev.leader.totalScore > ev.runnerUp.totalScore);
  // Her hücrenin formülü açıkça görünür:
  assert.match(ev.leader.breakdowns[0].formula, /Puan 8\/10 × Ağırlık %/);
});

test("2. Doğrulama ölçütü: kaynağı veya veri gerekçesi eksik olan hücre izlenebilirliği düşürür ve karar kaydını engeller", () => {
  const b = C.normalizeBoard(SAMPLE.sampleBoard);
  C.updateCell(b, "opt-pg-managed", "crit-cost", { sourceTitle: "" });
  const ev = C.evaluateBoard(b);
  assert.equal(ev.fullyTraceable, false);
  assert.equal(ev.unbackedCells.length, 1);
  assert.throws(() => C.recordDecision(b, {}), /%100'ü izlenebilir olmalıdır/);
});

test("3. %100 izlenebilir panoda karar günlüğü (ADR) kaydı oluşturulur ve anlık matris görüntüsünü saklar", () => {
  const res = C.recordDecision(SAMPLE.sampleBoard, {}, [], SAMPLE.BASE_DATE);
  assert.equal(res.entry.chosenOptionId, "opt-pg-managed");
  assert.equal(res.entry.traceabilityRate, 100);
  assert.equal(res.decisionLog.length, 1);
  assert.equal(res.entry.snapshot.ranking.length, 3);
});

test("4. Seçeneklere göre Artılar (+) ve Eksiler (-) kaynaklarıyla otomatik üretilir", () => {
  const ev = C.evaluateBoard(SAMPLE.sampleBoard);
  const selfCluster = ev.optionResults.find((o) => o.optionId === "opt-self-cluster");
  assert.ok(selfCluster.pros.some((p) => /Aylık Toplam Maliyet/.test(p)));
  assert.ok(selfCluster.cons.some((c) => /Operasyon Kolaylığı/.test(c)));
});

test("5. Puan ile veri gerekçesi arasındaki çelişki otomatik tespit edilir", () => {
  const b = C.normalizeBoard(SAMPLE.sampleBoard);
  C.updateCell(b, "opt-serverless-proprietary", "crit-port", {
    score: 9,
    evidence: "Standart dışa aktarma yok, başka veritabanına geçiş desteklemiyor.",
  });
  const ev = C.evaluateBoard(b);
  assert.ok(ev.contradictions.some((c) => c.type === "puan-kanit-celiskisi"));
});

test("6. Seçilen seçenek matris lideri değilse ödünleşim / sıralama çelişkisi uyarısı üretilir", () => {
  const b = C.normalizeBoard(SAMPLE.sampleBoard);
  b.selectedOptionId = "opt-self-cluster";
  const ev = C.evaluateBoard(b);
  assert.ok(ev.contradictions.some((c) => c.type === "secim-siralama-farki"));
});

test("7. Eksik kriter tespiti: maliyet veya güvenlik kriteri yoksa kullanıcıya hatırlatır", () => {
  const b = C.normalizeBoard({
    title: "Hızlı Araç Kararı",
    options: [{ id: "o1", name: "Araç A" }, { id: "o2", name: "Araç B" }],
    criteria: [{ id: "c1", name: "Kullanım Hızı", weight: 5 }],
    cells: {
      "o1:c1": { score: 8, evidence: "200ms yanıt", sourceTitle: "Benchmark" },
      "o2:c1": { score: 6, evidence: "450ms yanıt", sourceTitle: "Benchmark" },
    },
  });
  const ev = C.evaluateBoard(b);
  assert.ok(ev.missingCriteria.length >= 2);
  assert.ok(ev.missingCriteria.some((m) => /Maliyet/.test(m.name)));
});

test("8. Finansal ve hukuki kararlar için uzman süreci uyarısı zorunlu olarak üretilir", () => {
  const ev = C.evaluateBoard(SAMPLE.sampleBoard);
  assert.equal(ev.requiresSpecialistDisclaimer, true);
  assert.match(ev.specialistDisclaimer, /mali müşavir \/ avukat uzman incelemesi yerine geçmez/);
});

test("9. Yapay zekâ rolü: eksik kriter ve çelişki önerir; modelin kazanan/ağırlık dayatmalarını reddeder", () => {
  const b = C.normalizeBoard(SAMPLE.sampleBoard);
  const aiRes = C.validateAi(
    JSON.stringify({
      kazanan: "Tescilli Sunucusuz Bulut DB",
      yeniAgirliklar: { "crit-cost": 1 },
      eksikKriterler: [
        { ad: "Yedekten Dönüş Tatbikat Süresi (RTO)", neden: "Felaket kurtarma süresi ayrı ölçülmemiş" },
      ],
      celiskiler: [
        { secenek: "Kendi Sunucumuzda Patroni Kümesi", kriter: "Aylık Toplam Maliyet (TCO)", aciklama: "Mühendis nöbet maliyeti TCO'ya dahil edilmemiş" },
      ],
    }),
    b
  );
  assert.equal(aiRes.droppedPreferences, 2, "Modelin kazanan ve ağırlık dayatmaları atılır");
  assert.equal(aiRes.missingCriteria.length, 1);
  assert.equal(aiRes.contradictions.length, 1);
});

test("10. Seçenek ve kriter ekleme tüm matris hücrelerini tutarlı biçimde genişletir", () => {
  let b = C.normalizeBoard(SAMPLE.sampleBoard);
  b = C.addCriterion(b, { id: "crit-rto", name: "Felaket Kurtarma (RTO)", weight: 6, defaultEvidence: "15 dk RTO", defaultSource: "DR Planı" });
  assert.equal(b.criteria.length, 5);
  assert.equal(Object.keys(b.cells).length, 15);
  b = C.addOption(b, { id: "opt-cockroach", name: "Dağıtık SQL", defaultEvidence: "Bölgesel yedekli", defaultSource: "Teknik Doküman" });
  assert.equal(b.options.length, 4);
  assert.equal(Object.keys(b.cells).length, 20);
});

test("11. ADR Markdown ve CSV dışa aktarma puan türetimini ve formül enjeksiyonu korumasını içerir", () => {
  const b = C.normalizeBoard(SAMPLE.sampleBoard);
  C.updateCell(b, "opt-pg-managed", "crit-cost", { evidence: "=SUM(1,2) 240 EUR/ay" });
  const csv = C.exportCsv(b);
  assert.match(csv, /'=SUM\(1,2\)/);
  const res = C.recordDecision(b, {}, [], SAMPLE.BASE_DATE);
  const md = C.exportAdrMd(res.board, res.decisionLog);
  assert.match(md, /# Karar Matrisi ve Karar Günlüğü \(ADR\)/);
  assert.match(md, /Kayıtlı Karar Günlüğü/);
});
