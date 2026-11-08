/* Model Switchboard — örnek görevler ve kayıtlı yan yana karşılaştırma sonuçları. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./core.js"));
  else root.MSSample = factory(root.MSCore);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  const cat = C.normalizeCatalog(C.DEFAULT_CATALOG);
  const byId = (id) => cat.find((m) => m.id === id) || cat[0];

  const RAW_RUNS = [
    {
      id: "bench-01",
      title: "SQL sorgusunda indeks ve N+1 darboğazı analizi",
      taskType: "kodlama",
      prompt: "Sipariş tablosunda müşteri bazlı son 30 gün sorgusu 4.2 saniye sürüyor. Fonksiyon düzeyinde hata kaynağını, indeks önerisini ve birim test adımlarını yazın.",
      criteria: ["fonksiyon", "hata", "test", "indeks"],
      modelA: "openai:gpt-4o-mini",
      modelB: "anthropic:claude-3-5-sonnet",
      latencyMsA: 410,
      latencyMsB: 690,
      createdAt: "2026-11-06T10:15:00.000Z",
      outA: "Sorun N+1 sorgu hatasıdır.\n- Çözüm: `orders(customer_id, created_at)` bileşik indeks ekleyin.\n- Fonksiyon içinde tek JOIN kullanın ve test senaryosu oluşturun.",
      outB: "```sql\nCREATE INDEX idx_orders_cust_created ON orders(customer_id, created_at DESC);\n```\n1. **Hata kaynağı:** Döngü içinde çağrılan sorgu fonksiyon darboğaz yaratıyor.\n2. **Çözüm ve Test:** Tek sorguya düşürün ve EXPLAIN ANALYZE ile birim test doğrulaması ekleyin.",
    },
    {
      id: "bench-02",
      title: "Mimari kurul toplantı tutanağını 3 maddede özetleme",
      taskType: "ozetleme",
      prompt: "Mimari kurulda önbellek katmanının Redis yerine yerel bellek + SQLite olarak sadeleştirilmesi, dağıtım gününün çarşambaya alınması ve yük testinin cuma tamamlanması kararlaştırıldı. Kısa özet, karar ve eylem maddelerini çıkarın.",
      criteria: ["özet", "karar", "eylem", "sqlite"],
      modelA: "openai:gpt-4o-mini",
      modelB: "anthropic:claude-3-5-haiku",
      latencyMsA: 290,
      latencyMsB: 340,
      createdAt: "2026-11-06T11:00:00.000Z",
      outA: "**Özet:** Önbellek mimarisi sadeleştirildi.\n- **Karar:** Redis yerine yerel bellek ve SQLite kullanılacak, dağıtım çarşamba yapılacak.\n- **Eylem:** Cuma gününe kadar yük testi tamamlanacak.",
      outB: "Toplantı özeti:\n- Karar: SQLite tabanlı yerel önbelleğe geçildi.\n- Eylem: Cuma yük testi yapılacak.",
    },
    {
      id: "bench-03",
      title: "Üçüncü taraf SDK yükseltmesinde maliyet ve güvenlik risk analizi",
      taskType: "analiz",
      prompt: "Ödeme SDK'sı v4 sürümüne geçerken lisans maliyeti %18 artıyor ancak eski sürümde imza doğrulama riski var. Risk, maliyet ve geçiş önerisi başlıklarıyla analiz edin.",
      criteria: ["risk", "maliyet", "öneri", "imza"],
      modelA: "openai:gpt-4o",
      modelB: "anthropic:claude-3-5-sonnet",
      latencyMsA: 780,
      latencyMsB: 720,
      createdAt: "2026-11-06T11:30:00.000Z",
      outA: "- **Risk:** Eski SDK'da imza doğrulama zafiyeti bulunuyor.\n- **Maliyet:** %18 artış yıllık bütçede sınırlı etki yaratır.\n- **Öneri:** Kademeli geçiş planıyla v4 sürümüne geçilmelidir.",
      outB: "| Boyut | Değerlendirme |\n|---|---|\n| **Risk** | İmza doğrulama hatası kritik güvenlik açığı doğurur. |\n| **Maliyet** | %18 lisans artışı olası ihlal maliyetinden düşüktür. |\n| **Öneri** | Kanarya dağıtımıyla hemen v4 sürümüne geçin. |",
    },
  ];

  function buildSampleRuns() {
    return RAW_RUNS.map((r) =>
      C.buildComparisonRun({
        id: r.id,
        title: r.title,
        taskType: r.taskType,
        prompt: r.prompt,
        criteria: r.criteria,
        modelA: byId(r.modelA),
        modelB: byId(r.modelB),
        outA: r.outA,
        outB: r.outB,
        latencyMsA: r.latencyMsA,
        latencyMsB: r.latencyMsB,
        createdAt: r.createdAt,
      })
    );
  }

  return { RAW_RUNS, buildSampleRuns };
});
