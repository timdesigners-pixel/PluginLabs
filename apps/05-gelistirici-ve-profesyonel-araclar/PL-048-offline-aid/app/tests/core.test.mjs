import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import S from "../src/sample.js";

test("1. Onaylı yerel model ailesinde lisans, RAM/VRAM gereksinimi ve güncelleme kaynağı görünürdür", () => {
  assert.ok(C.APPROVED_MODEL_FAMILY.length >= 4);
  for (const m of C.APPROVED_MODEL_FAMILY) {
    assert.ok(m.license && m.license.length > 0);
    assert.ok(typeof m.minRamGb === "number");
    assert.ok( typeof m.minVramGb === "number");
    assert.ok(m.updateSource && m.updateSource.length > 0);
  }
});

test("2. Cihaz kaynak kontrolü düşük donanımda modelsiz veya küçük modeli önerir", () => {
  const lowHw = C.evaluateHardwareResources({ totalRamGb: 3, freeRamGb: 1.2, cpuCores: 2 }, "qwen2.5:7b-instruct-q4_k_m");
  assert.equal(lowHw.compatible, false);
  assert.equal(lowHw.status, "dusuk_donanim");
  assert.equal(lowHw.recommendedModelId, "modelsiz:kural-tabanli");

  const highHw = C.evaluateHardwareResources({ totalRamGb: 32, freeRamGb: 18, cpuCores: 8 }, "qwen2.5:7b-instruct-q4_k_m");
  assert.equal(highHw.compatible, true);
  assert.equal(highHw.status, "uygun");
});

test("3. Ağsız ortamda modelsiz kural tabanlı motor özetleme, maddeleme, düzenleme ve eylem çıkarmayı tamamlar", () => {
  const text = "Toplantıda önemli karar alındı. Yedekleme sistemi cuma gününe kadar güncellenecek. Şey aslında bakarsanız bütçe onaylandı.";
  const ozet = C.runRuleBasedTask(text, "ozet");
  assert.equal(ozet.externalRequests, 0);
  assert.match(ozet.output, /Kısa Özet/);

  const eylem = C.runRuleBasedTask(text, "eylem");
  assert.match(eylem.output, /- \[ \]/);

  const duz = C.runRuleBasedTask(text, "duzenleme");
  assert.ok(!/aslında bakarsanız/i.test(duz.output));
});

test("4. Hassas iletişim ve IBAN bilgileri yerel model işleminden önce maskelenir", () => {
  const m = C.maskSensitiveText("İletişim: test@kurum.org, tel 0532 123 45 67 ve TR12 0006 1000 0000 0000 0000 01");
  assert.equal(m.maskedCount, 3);
  assert.ok(m.text.includes("[E-POSTA]"));
  assert.ok(m.text.includes("[TELEFON]"));
  assert.ok(m.text.includes("[IBAN]"));
});

test("5. Çevrimdışı diye tüm risklerin yok olduğu iddia edilmez (sorumluluk sınırı görünürdür)", () => {
  assert.match(C.OFFLINE_RISK_DISCLAIMER, /tüm risklerin yok olduğu iddia edilmez/);
});

test("6. Görev kaydı donanım bazlı gecikme raporunu (ms) ve sıfır dış ağ isteğini içerir", () => {
  const tasks = S.buildSampleTasks({ totalRamGb: 16, freeRamGb: 8, cpuCores: 8, cpuModel: "Test CPU" });
  assert.equal(tasks.length, 3);
  for (const t of tasks) {
    assert.equal(t.externalNetworkRequests, 0);
    assert.equal(t.offlineCompleted, true);
    assert.ok(t.latencyMs >= 1);
    assert.match(t.hardwareProfile, /16 GB RAM/);
  }
});

test("7. Doğrulama ölçütleri: dışa giden model isteği 0 ve donanım gecikme ortalaması hesaplanır", () => {
  const tasks = S.buildSampleTasks({ totalRamGb: 16, freeRamGb: 8, cpuCores: 8, cpuModel: "Test CPU" });
  const m = C.metrics(tasks, { blockedExternalUrls: 1 }, { totalRamGb: 16, cpuCores: 8 });
  assert.equal(m.externalRequests, 0);
  assert.equal(m.completedTasks, 3);
  assert.ok(m.avgLatencyMs >= 1);
  assert.equal(m.blockedExternalUrls, 1);
});

test("8. Yerel model sunucusu yalnız loopback adreslerini kabul eder, dış ağ adreslerini reddeder", () => {
  assert.equal(C.isLoopbackUrl("http://127.0.0.1:11434"), true);
  assert.equal(C.isLoopbackUrl("http://localhost:1234"), true);
  assert.equal(C.isLoopbackUrl("https://api.openai.com/v1"), false);
});

test("9. localLlmPayload metni maskeler ve sistem istemini hazırlar", () => {
  const p = C.localLlmPayload("Bana ali@test.com adresinden ulaşın.", "ozet", true);
  assert.equal(p.maskedCount, 1);
  assert.ok(!JSON.stringify(p.messages).includes("ali@test.com"));
});

test("10. TXT ve Markdown dışa aktarma donanım bazlı gecikme raporunu ve lisans bilgisini içerir", () => {
  const tasks = S.buildSampleTasks({ totalRamGb: 16, freeRamGb: 8, cpuCores: 8, cpuModel: "Test CPU" });
  const m = C.metrics(tasks, {}, { totalRamGb: 16, cpuCores: 8 });
  const md = C.exportMd(tasks, m);
  assert.match(md, /Dışa giden model isteği:\*\* 0/);
  assert.match(md, /tüm risklerin yok olduğu iddia edilmez/);
  const txt = C.exportTxt(tasks);
  assert.match(txt, /Dış ağ isteği: 0/);
});
