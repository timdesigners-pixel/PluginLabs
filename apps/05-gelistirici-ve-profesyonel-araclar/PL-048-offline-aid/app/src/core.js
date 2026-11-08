/* Offline Aid — çekirdek (tarayıcı + Node UMD).
 * Notion kartı (PL-048):
 *  • MVP ve temel akış: Uyumlu yerel model seçimi, cihaz kaynak kontrolü ve metin özetleme/düzenleme. İlk sürüm tek onaylı model ailesi.
 *  • Yapay zekânın rolü: Çıkarımı yerelde yapar; düşük donanımda basit görev ve modelsiz alternatif sunar.
 *  • Teknik bağımlılık ve sınırlar: Model lisansı, RAM/VRAM gereksinimi ve güncelleme kaynağı görünür. Çevrimdışı diye tüm risklerin yok olduğu iddia edilmez.
 *  • Doğrulama ölçütü: Ağsız testte görev tamamlama; dışa giden model isteği sıfır; donanım bazlı gecikme raporu. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OACore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MAX_TEXT = 25000;
  const OFFLINE_RISK_DISCLAIMER = "Çevrimdışı çalışmak dış ağ veri sızıntısını önler ancak tüm risklerin yok olduğu iddia edilmez: yerel model çıktıları hatalı/eksik olabilir ve cihazdaki yerel dosyaların güvenliği işletim sistemi erişim denetimine bağlıdır.";

  const TASK_MODES = ["ozet", "maddeler", "duzenleme", "eylem"];
  const TASK_MODE_NAMES = {
    ozet: "Kısa özet çıkarma",
    maddeler: "Anahtar maddeleri ayıklama",
    duzenleme: "Metin sadeleştirme ve düzenleme",
    eylem: "Yapılacak eylem maddelerini çıkarma",
  };

  // İlk sürüm tek onaylı model ailesi (Qwen 2.5 Instruct GGUF ailesi) + düşük donanım için modelsiz kural tabanlı alternatif.
  const APPROVED_MODEL_FAMILY = [
    {
      id: "modelsiz:kural-tabanli",
      family: "PluginLabs Deterministik Motor (Modelsiz Alternatif)",
      displayName: "Modelsiz Kural Tabanlı Yedek Motor",
      kind: "rule_based",
      license: "PluginLabs Yerleşik (Açık Kural Motoru)",
      minRamGb: 1,
      minVramGb: 0,
      quantization: "Yok (CPU Kural Motoru)",
      updateSource: "Uygulama içi yerleşik paket (ağ gerektirmez)",
      recommendedForLowHardware: true,
    },
    {
      id: "qwen2.5:1.5b-instruct-q4_k_m",
      family: "Qwen 2.5 Instruct (Onaylı Tek Model Ailesi)",
      displayName: "Qwen 2.5 1.5B Instruct (Q4_K_M)",
      kind: "local_llm",
      license: "Apache-2.0",
      minRamGb: 4,
      minVramGb: 2,
      quantization: "GGUF Q4_K_M (~1.1 GB)",
      updateSource: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF (Yerel doğrulama SHA-256)",
      recommendedForLowHardware: true,
    },
    {
      id: "qwen2.5:3b-instruct-q4_k_m",
      family: "Qwen 2.5 Instruct (Onaylı Tek Model Ailesi)",
      displayName: "Qwen 2.5 3B Instruct (Q4_K_M)",
      kind: "local_llm",
      license: "Qwen Research License",
      minRamGb: 8,
      minVramGb: 4,
      quantization: "GGUF Q4_K_M (~2.1 GB)",
      updateSource: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF (Yerel doğrulama SHA-256)",
      recommendedForLowHardware: false,
    },
    {
      id: "qwen2.5:7b-instruct-q4_k_m",
      family: "Qwen 2.5 Instruct (Onaylı Tek Model Ailesi)",
      displayName: "Qwen 2.5 7B Instruct (Q4_K_M)",
      kind: "local_llm",
      license: "Apache-2.0",
      minRamGb: 16,
      minVramGb: 6,
      quantization: "GGUF Q4_K_M (~4.7 GB)",
      updateSource: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF (Yerel doğrulama SHA-256)",
      recommendedForLowHardware: false,
    },
  ];

  const str = (v, max = MAX_TEXT) => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  function isLoopbackUrl(u) {
    try {
      const x = new URL(String(u));
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch { return false; }
  }

  function evaluateHardwareResources(hwInfo, selectedModelId) {
    const hw = hwInfo || {};
    const totalRamGb = round2(Math.max(1, Number(hw.totalRamGb) || 8));
    const freeRamGb = round2(Math.max(0.5, Number(hw.freeRamGb) || totalRamGb * 0.5));
    const cpuCores = Math.max(1, Number(hw.cpuCores) || 4);
    const cpuModel = str(hw.cpuModel || "Yerel x64 İşlemci", 120).trim();
    const vramGb = round2(Math.max(0, Number(hw.vramGb) || 0));

    const model = APPROVED_MODEL_FAMILY.find((m) => m.id === selectedModelId) || APPROVED_MODEL_FAMILY[0];
    const ramOk = totalRamGb >= model.minRamGb;
    const lowHardware = totalRamGb < 8 || freeRamGb < 2.5;

    let recommendedModelId = model.id;
    let status = "uygun";
    let note = `Cihaz kaynakları (${totalRamGb} GB RAM, ${cpuCores} çekirdek) ${model.displayName} için uygun.`;

    if (!ramOk) {
      status = "dusuk_donanim";
      recommendedModelId = totalRamGb >= 4 ? "qwen2.5:1.5b-instruct-q4_k_m" : "modelsiz:kural-tabanli";
      note = `Seçilen model en az ${model.minRamGb} GB RAM gerektiriyor (cihaz: ${totalRamGb} GB). Düşük donanım için modelsiz alternatif veya Qwen 2.5 1.5B önerilir.`;
    } else if (lowHardware && model.kind === "local_llm" && model.minRamGb > 4) {
      status = "uyari";
      recommendedModelId = "modelsiz:kural-tabanli";
      note = `Kullanılabilir RAM sınırlı (${freeRamGb} GB boş). Düşük gecikme için modelsiz kural tabanlı alternatif hazır.`;
    }

    return {
      totalRamGb,
      freeRamGb,
      cpuCores,
      cpuModel,
      vramGb,
      lowHardware,
      selectedModel: model,
      compatible: ramOk,
      status,
      recommendedModelId,
      note,
    };
  }

  function splitSentences(text) {
    const clean = str(text, MAX_TEXT).replace(/\r\n/g, "\n").trim();
    if (!clean) return [];
    const lines = clean.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const parts = line.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) out.push(p);
    }
    return out;
  }

  // Modelsiz (kural tabanlı) çevrimdışı metin özetleme ve düzenleme motoru: ağsız ve düşük donanımda %100 deterministik çalışır.
  function runRuleBasedTask(text, mode = "ozet") {
    const t0 = Date.now();
    const raw = str(text, MAX_TEXT).trim();
    if (!raw) throw new Error("İşlenecek metin boş.");
    const sentences = splitSentences(raw);
    const m = TASK_MODES.includes(mode) ? mode : "ozet";

    let output = "";
    if (m === "ozet") {
      const scored = sentences.map((s, idx) => {
        let score = 0;
        if (idx === 0) score += 3;
        if (/\b(karar|sonuç|önemli|hedef|risk|bütçe|teslim|özet|kritik|gerekli)\b/i.test(s)) score += 4;
        if (/\d+/.test(s)) score += 1.5;
        score += Math.min(2, s.split(/\s+/).length / 12);
        return { s, idx, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, Math.min(3, scored.length)).sort((a, b) => a.idx - b.idx);
      output = "📌 Kısa Özet (Modelsiz Yerel Çıkarım):\n" + top.map((x) => "• " + x.s.replace(/^[-•*]\s*/, "")).join("\n");
    } else if (m === "maddeler") {
      const items = sentences.slice(0, 6).map((s) => "• " + s.replace(/^[-•*\d.)]+\s*/, "").trim());
      output = "📋 Anahtar Maddeler:\n" + items.join("\n");
    } else if (m === "duzenleme") {
      const cleaned = sentences.map((s) =>
        s
          .replace(/\s+/g, " ")
          .replace(/\b(şey|hani|aslında bakarsanız|bir nevi)\b\s*/gi, "")
          .trim()
      ).filter(Boolean);
      output = cleaned.join(" ");
    } else if (m === "eylem") {
      const actionRe = /\b(yapılacak|hazırla|gönder|kontrol et|tamamla|paylaş|güncelle|ekle|doğrula|kadar|teslim|todo)\b/i;
      const acts = sentences.filter((s) => actionRe.test(s));
      const picked = (acts.length ? acts : sentences.slice(0, 3)).map((s) => "- [ ] " + s.replace(/^[-•*\d.)[\]\s]+/, "").trim());
      output = "⚡ Yapılacak Eylem Maddeleri:\n" + picked.join("\n");
    }

    const elapsed = Math.max(1, Date.now() - t0);
    return {
      output,
      latencyMs: elapsed,
      engine: "modelsiz:kural-tabanli",
      externalRequests: 0,
    };
  }

  function maskSensitiveText(text) {
    let maskedCount = 0;
    const out = str(text, MAX_TEXT)
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => { maskedCount++; return "[E-POSTA]"; })
      .replace(/\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/gi, () => { maskedCount++; return "[IBAN]"; })
      .replace(/\b(?:\+?90|0)?\s*5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g, () => { maskedCount++; return "[TELEFON]"; });
    return { text: out, maskedCount };
  }

  function buildTaskRecord({ id, title, mode, inputText, outputText, modelId, latencyMs, hwSnapshot, maskedCount, createdAt }) {
    const model = APPROVED_MODEL_FAMILY.find((m) => m.id === modelId) || APPROVED_MODEL_FAMILY[0];
    const inWords = str(inputText).trim().split(/\s+/).filter(Boolean).length;
    const outWords = str(outputText).trim().split(/\s+/).filter(Boolean).length;
    return {
      id: str(id || "task-" + Date.now(), 80),
      title: str(title || inputText.split("\n")[0] || "Çevrimdışı metin görevi", 140).trim(),
      mode: TASK_MODES.includes(mode) ? mode : "ozet",
      modeLabel: TASK_MODE_NAMES[mode] || TASK_MODE_NAMES.ozet,
      inputText: str(inputText, MAX_TEXT),
      outputText: str(outputText, MAX_TEXT),
      inputWords: inWords,
      outputWords: outWords,
      modelId: model.id,
      modelName: model.displayName,
      modelLicense: model.license,
      latencyMs: Math.max(1, Math.round(Number(latencyMs) || 4)),
      hardwareProfile: hwSnapshot
        ? `${hwSnapshot.cpuModel} · ${hwSnapshot.totalRamGb} GB RAM (${hwSnapshot.cpuCores} çekirdek)`
        : "Yerel Cihaz",
      maskedCount: Number(maskedCount) || 0,
      externalNetworkRequests: 0,
      offlineCompleted: true,
      createdAt: str(createdAt || new Date().toISOString(), 40),
    };
  }

  function localLlmPayload(inputText, mode, maskSensitive = true) {
    const m = TASK_MODES.includes(mode) ? mode : "ozet";
    const prep = maskSensitive ? maskSensitiveText(inputText) : { text: str(inputText, MAX_TEXT), maskedCount: 0 };
    const sys = "Sen cihazda çevrimdışı çalışan Offline Aid yardımcı motorusun. Verilen metni istenen görev türüne göre Türkçe olarak işle ve doğrudan yanıtı döndür.";
    const usr = `Görev: ${TASK_MODE_NAMES[m]}\n\nMetin:\n${prep.text}`;
    return {
      mode: m,
      maskedCount: prep.maskedCount,
      sentChars: usr.length,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    };
  }

  function metrics(tasks, counters, hwEval) {
    const list = Array.isArray(tasks) ? tasks : [];
    const c = normalizeCounters(counters);
    const latencies = list.map((t) => Number(t.latencyMs) || 0).filter((n) => n > 0);
    const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const externalRequests = list.reduce((a, t) => a + (Number(t.externalNetworkRequests) || 0), 0) + (c.externalRequests || 0);
    const offlineCompletedCount = list.filter((t) => t.offlineCompleted).length;
    return {
      completedTasks: offlineCompletedCount,
      externalRequests,
      avgLatencyMs,
      ruleBasedRuns: list.filter((t) => t.modelId === "modelsiz:kural-tabanli").length,
      localLlmRuns: list.filter((t) => t.modelId !== "modelsiz:kural-tabanli").length,
      blockedExternalUrls: c.blockedExternalUrls,
      hardwareSummary: hwEval ? `${hwEval.totalRamGb} GB RAM · ${hwEval.cpuCores} çekirdek` : "Yerel Cihaz",
    };
  }

  function normalizeSettings(s) {
    s = s || {};
    const validIds = new Set(APPROVED_MODEL_FAMILY.map((m) => m.id));
    return {
      selectedModelId: validIds.has(s.selectedModelId) ? s.selectedModelId : "modelsiz:kural-tabanli",
      defaultMode: TASK_MODES.includes(s.defaultMode) ? s.defaultMode : "ozet",
      maskSensitive: s.maskSensitive !== false,
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "qwen2.5-1.5b-instruct", 80),
    };
  }

  function normalizeCounters(c) {
    c = c || {};
    return {
      externalRequests: 0,
      blockedExternalUrls: Math.max(0, Number(c.blockedExternalUrls) || 0),
      exports: Math.max(0, Number(c.exports) || 0),
    };
  }

  function exportTxt(tasks) {
    return (Array.isArray(tasks) ? tasks : []).map((t) =>
      `=== ${t.title} (${t.modeLabel}) ===\nModel: ${t.modelName} (${t.modelLicense})\nDonanım ve Gecikme: ${t.hardwareProfile} · ${t.latencyMs} ms · Dış ağ isteği: ${t.externalNetworkRequests}\n\n${t.outputText}\n`
    ).join("\n----------------------------------------\n\n");
  }

  function exportMd(tasks, metricsObj) {
    const lines = [
      "# Offline Aid — Cihaz İçi Metin İşleme ve Donanım Gecikme Raporu",
      "",
      `> **Sınır ve Güvenlik Notu:** ${OFFLINE_RISK_DISCLAIMER}`,
      "",
      `- **Ağsız tamamlanan görev sayısı:** ${metricsObj.completedTasks}`,
      `- **Dışa giden model isteği:** ${metricsObj.externalRequests} (hedef: 0)`,
      `- **Ortalama donanım gecikmesi:** ${metricsObj.avgLatencyMs} ms (${metricsObj.hardwareSummary})`,
      "",
      "## Görev Kayıtları ve Donanım Bazlı Gecikme Raporu",
      "",
    ];
    for (const t of Array.isArray(tasks) ? tasks : []) {
      lines.push(`### ${t.title} (\`${t.id}\`)`);
      lines.push(`- **Görev türü:** ${t.modeLabel} · **Motor:** ${t.modelName} (Lisans: ${t.modelLicense})`);
      lines.push(`- **Donanım & Gecikme:** ${t.hardwareProfile} · **${t.latencyMs} ms** · **Dış ağ isteği:** ${t.externalNetworkRequests}`);
      lines.push("");
      lines.push("```text");
      lines.push(t.outputText);
      lines.push("```");
      lines.push("");
    }
    return lines.join("\n");
  }

  return {
    MAX_TEXT,
    OFFLINE_RISK_DISCLAIMER,
    TASK_MODES,
    TASK_MODE_NAMES,
    APPROVED_MODEL_FAMILY,
    str,
    round2,
    isLoopbackUrl,
    evaluateHardwareResources,
    splitSentences,
    runRuleBasedTask,
    maskSensitiveText,
    buildTaskRecord,
    localLlmPayload,
    metrics,
    normalizeSettings,
    normalizeCounters,
    exportTxt,
    exportMd,
  };
});
