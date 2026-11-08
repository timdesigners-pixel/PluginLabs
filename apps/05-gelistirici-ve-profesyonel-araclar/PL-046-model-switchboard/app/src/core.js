/* Model Switchboard — çekirdek (tarayıcı + Node UMD).
 * Notion kartı (PL-046):
 *  • MVP ve temel akış: Resmi API anahtarıyla tek panel; model kataloğu, istek maliyeti tahmini ve aynı görevde yan yana değerlendirme. İlk sürüm iki sağlayıcı.
 *  • Yapay zekânın rolü: Görev türüne göre model önerir; hız/kalite ölçümünü kayıtlı test sonucuna bağlar.
 *  • Teknik bağımlılık ve sınırlar: Fiyatlar sağlayıcıdan doğrulanmalı ve tarihli olmalı; limit aşımı için kullanıcı bütçe tavanı. Tüketici web hesabı çerezi kullanılmaz.
 *  • Doğrulama ölçütü: Görev başına gerçek maliyet görünürlüğü %100; bütçe tavanı aşımı sıfır hedefi. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MSCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MAX_PROMPT = 20000;
  const MAX_RUNS = 1000;
  const TASK_TYPES = ["kodlama", "ozetleme", "analiz", "ceviri", "genel"];
  const TASK_NAMES = {
    kodlama: "Kodlama ve hata ayıklama",
    ozetleme: "Metin özetleme",
    analiz: "Veri ve yapısal analiz",
    ceviri: "Çeviri ve yerelleştirme",
    genel: "Genel yanıt ve yazım",
  };

  // İlk sürüm iki resmi sağlayıcı (OpenAI + Anthropic); fiyatlar USD / 1M token, doğrulanmış ve tarihli katalog.
  const DEFAULT_CATALOG = [
    {
      id: "openai:gpt-4o-mini",
      providerId: "openai",
      providerName: "OpenAI (Resmi API)",
      modelId: "gpt-4o-mini",
      displayName: "GPT-4o mini",
      inputPer1M: 0.15,
      outputPer1M: 0.60,
      contextWindow: 128000,
      verifiedAt: "2026-10-25",
      sourceUrl: "https://openai.com/api/pricing/",
      authMode: "official_api_key",
      cookieUsed: false,
      strengths: ["ozetleme", "ceviri", "genel"],
    },
    {
      id: "openai:gpt-4o",
      providerId: "openai",
      providerName: "OpenAI (Resmi API)",
      modelId: "gpt-4o",
      displayName: "GPT-4o",
      inputPer1M: 2.50,
      outputPer1M: 10.00,
      contextWindow: 128000,
      verifiedAt: "2026-10-25",
      sourceUrl: "https://openai.com/api/pricing/",
      authMode: "official_api_key",
      cookieUsed: false,
      strengths: ["kodlama", "analiz", "genel"],
    },
    {
      id: "anthropic:claude-3-5-haiku",
      providerId: "anthropic",
      providerName: "Anthropic (Resmi API)",
      modelId: "claude-3-5-haiku",
      displayName: "Claude 3.5 Haiku",
      inputPer1M: 0.80,
      outputPer1M: 4.00,
      contextWindow: 200000,
      verifiedAt: "2026-10-25",
      sourceUrl: "https://www.anthropic.com/pricing",
      authMode: "official_api_key",
      cookieUsed: false,
      strengths: ["ozetleme", "kodlama", "ceviri"],
    },
    {
      id: "anthropic:claude-3-5-sonnet",
      providerId: "anthropic",
      providerName: "Anthropic (Resmi API)",
      modelId: "claude-3-5-sonnet",
      displayName: "Claude 3.5 Sonnet",
      inputPer1M: 3.00,
      outputPer1M: 15.00,
      contextWindow: 200000,
      verifiedAt: "2026-10-25",
      sourceUrl: "https://www.anthropic.com/pricing",
      authMode: "official_api_key",
      cookieUsed: false,
      strengths: ["kodlama", "analiz", "ozetleme"],
    },
  ];

  const str = (v, max = 2000) => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));
  const round6 = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  function fold(s) {
    return str(s, 5000)
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
  }

  function isLoopbackUrl(u) {
    try {
      const x = new URL(String(u));
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch { return false; }
  }

  function validateApiKeyOrRejectCookie(raw) {
    const s = str(raw, 400).trim();
    if (!s) return { ok: false, reason: "API anahtarı boş." };
    if (/cookie|session_id|__Secure-|cf_clearance|sessionKey=|Bearer\s+eyJ/i.test(s) || s.includes(";")) {
      return { ok: false, isCookie: true, reason: "Tüketici web hesabı çerezi (cookie/session) kabul edilmez. Yalnız sağlayıcının resmi API anahtarını girin." };
    }
    if (!/^[A-Za-z0-9._~+/=-]{12,260}$/.test(s)) {
      return { ok: false, reason: "Resmi API anahtarı biçimi geçersiz." };
    }
    return { ok: true, key: s };
  }

  function normalizeCatalog(list) {
    const src = Array.isArray(list) && list.length ? list : DEFAULT_CATALOG;
    const out = [];
    for (const m of src) {
      if (!m || typeof m !== "object") continue;
      const id = str(m.id, 100).trim();
      const verifiedAt = str(m.verifiedAt, 30).trim();
      if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) continue;
      const inputPer1M = Math.max(0, Number(m.inputPer1M) || 0);
      const outputPer1M = Math.max(0, Number(m.outputPer1M) || 0);
      out.push({
        id,
        providerId: str(m.providerId || id.split(":")[0], 40),
        providerName: str(m.providerName || m.providerId, 80),
        modelId: str(m.modelId || id.split(":")[1] || id, 60),
        displayName: str(m.displayName || m.modelId || id, 80),
        inputPer1M: round6(inputPer1M),
        outputPer1M: round6(outputPer1M),
        contextWindow: Math.max(1024, Number(m.contextWindow) || 128000),
        verifiedAt,
        sourceUrl: str(m.sourceUrl || "https://openai.com/api/pricing/", 300),
        authMode: "official_api_key",
        cookieUsed: false,
        strengths: Array.isArray(m.strengths) ? m.strengths.filter((t) => TASK_TYPES.includes(t)) : ["genel"],
      });
    }
    return out.length ? out : DEFAULT_CATALOG.map((x) => ({ ...x }));
  }

  function estimateTokens(text) {
    const t = str(text, MAX_PROMPT).trim();
    if (!t) return 0;
    const words = t.split(/\s+/).filter(Boolean).length;
    const charEst = Math.ceil(t.length / 3.8);
    return Math.max(1, Math.ceil((words * 1.35 + charEst) / 2));
  }

  function estimateTaskCost(model, promptText, expectedOutputTokens = 280) {
    if (!model || !model.verifiedAt) throw new Error("Model fiyat kataloğu doğrulanmış ve tarihli olmalıdır.");
    const inputTokens = estimateTokens(promptText);
    const outputTokens = Math.max(16, Math.min(16384, Number(expectedOutputTokens) || 280));
    const inputCostUsd = round6((inputTokens / 1e6) * model.inputPer1M);
    const outputCostUsd = round6((outputTokens / 1e6) * model.outputPer1M);
    const totalCostUsd = round6(inputCostUsd + outputCostUsd);
    return {
      modelId: model.id,
      displayName: model.displayName,
      providerName: model.providerName,
      verifiedAt: model.verifiedAt,
      inputPer1M: model.inputPer1M,
      outputPer1M: model.outputPer1M,
      inputTokens,
      outputTokens,
      inputCostUsd,
      outputCostUsd,
      totalCostUsd,
      costVisible: true,
    };
  }

  function estimatePairCost(modelA, modelB, promptText, expectedOutputTokens = 280) {
    const a = estimateTaskCost(modelA, promptText, expectedOutputTokens);
    const b = estimateTaskCost(modelB, promptText, expectedOutputTokens);
    return {
      a,
      b,
      combinedCostUsd: round6(a.totalCostUsd + b.totalCostUsd),
      costVisible: Boolean(a.costVisible && b.costVisible),
    };
  }

  function checkBudgetCap(currentSpentUsd, estimatedTaskUsd, budgetCapUsd) {
    const cap = Math.max(0, round6(budgetCapUsd));
    const spent = Math.max(0, round6(currentSpentUsd));
    const task = Math.max(0, round6(estimatedTaskUsd));
    const projectedUsd = round6(spent + task);
    const allowed = projectedUsd <= cap + 1e-9;
    return {
      allowed,
      currentSpentUsd: spent,
      estimatedTaskUsd: task,
      projectedUsd,
      budgetCapUsd: cap,
      remainingAfterUsd: allowed ? round6(Math.max(0, cap - projectedUsd)) : round6(Math.max(0, cap - spent)),
      overrunAmountUsd: allowed ? 0 : round6(projectedUsd - cap),
      reason: allowed
        ? "Bütçe tavanı içinde (" + projectedUsd.toFixed(6) + " USD / " + cap.toFixed(4) + " USD)."
        : "Bütçe tavanı aşımı engellendi: tahmini toplam " + projectedUsd.toFixed(6) + " USD, kullanıcı bütçe tavanı " + cap.toFixed(4) + " USD.",
    };
  }

  function scoreOutputRubric(outputText, taskType, criteriaList) {
    const txt = str(outputText, MAX_PROMPT).trim();
    if (!txt) return { score: 0, matchedCriteria: [], totalCriteria: 0, notes: "Yanıt boş" };
    const criteria = Array.isArray(criteriaList) && criteriaList.length
      ? criteriaList.map((c) => str(c, 80).trim()).filter(Boolean)
      : defaultCriteriaForTask(taskType);
    const folded = fold(txt);
    const matched = [];
    for (const c of criteria) {
      const f = fold(c);
      if (f && folded.includes(f)) matched.push(c);
    }
    const baseRatio = criteria.length ? matched.length / criteria.length : 1;
    const structureBonus = (/```|\n-\s|\n1\.\s|\|/m.test(txt) ? 12 : 0) + (txt.length >= 60 ? 10 : 0);
    const score = Math.min(100, Math.round(baseRatio * 78 + structureBonus));
    return {
      score,
      matchedCriteria: matched,
      totalCriteria: criteria.length,
      notes: criteria.length ? matched.length + "/" + criteria.length + " ölçüt karşılandı" : "Yapısal değerlendirme",
    };
  }

  function defaultCriteriaForTask(taskType) {
    switch (taskType) {
      case "kodlama": return ["fonksiyon", "hata", "test"];
      case "ozetleme": return ["özet", "karar", "eylem"];
      case "analiz": return ["risk", "maliyet", "öneri"];
      case "ceviri": return ["terim", "ton", "doğruluk"];
      default: return ["açık", "yapısal"];
    }
  }

  function buildComparisonRun({ id, title, taskType, prompt, criteria, modelA, modelB, outA, outB, latencyMsA, latencyMsB, actualInTokensA, actualOutTokensA, actualInTokensB, actualOutTokensB, createdAt }) {
    const tType = TASK_TYPES.includes(taskType) ? taskType : "genel";
    const inA = actualInTokensA != null ? Math.max(1, Number(actualInTokensA)) : estimateTokens(prompt);
    const outTokA = actualOutTokensA != null ? Math.max(1, Number(actualOutTokensA)) : estimateTokens(outA);
    const inB = actualInTokensB != null ? Math.max(1, Number(actualInTokensB)) : estimateTokens(prompt);
    const outTokB = actualOutTokensB != null ? Math.max(1, Number(actualOutTokensB)) : estimateTokens(outB);

    const costA = round6((inA / 1e6) * modelA.inputPer1M + (outTokA / 1e6) * modelA.outputPer1M);
    const costB = round6((inB / 1e6) * modelB.inputPer1M + (outTokB / 1e6) * modelB.outputPer1M);
    const evalA = scoreOutputRubric(outA, tType, criteria);
    const evalB = scoreOutputRubric(outB, tType, criteria);
    const latA = Math.max(1, Math.round(Number(latencyMsA) || 320));
    const latB = Math.max(1, Math.round(Number(latencyMsB) || 350));

    let winner = "berabere";
    const valueA = evalA.score - costA * 800 - latA * 0.005;
    const valueB = evalB.score - costB * 800 - latB * 0.005;
    if (Math.abs(valueA - valueB) > 1.5) winner = valueA >= valueB ? modelA.id : modelB.id;

    return {
      id: str(id || "run-" + Date.now(), 80),
      title: str(title || prompt.split("\n")[0] || "Karşılaştırma görevi", 140).trim(),
      taskType: tType,
      prompt: str(prompt, MAX_PROMPT),
      criteria: Array.isArray(criteria) ? criteria.map((c) => str(c, 80).trim()).filter(Boolean) : defaultCriteriaForTask(tType),
      createdAt: str(createdAt || new Date().toISOString(), 40),
      costVisible: true,
      budgetOverrun: false,
      sideA: {
        modelId: modelA.id,
        displayName: modelA.displayName,
        providerName: modelA.providerName,
        verifiedAt: modelA.verifiedAt,
        inputTokens: inA,
        outputTokens: outTokA,
        costUsd: costA,
        latencyMs: latA,
        qualityScore: evalA.score,
        matchedCriteria: evalA.matchedCriteria,
        output: str(outA, MAX_PROMPT),
      },
      sideB: {
        modelId: modelB.id,
        displayName: modelB.displayName,
        providerName: modelB.providerName,
        verifiedAt: modelB.verifiedAt,
        inputTokens: inB,
        outputTokens: outTokB,
        costUsd: costB,
        latencyMs: latB,
        qualityScore: evalB.score,
        matchedCriteria: evalB.matchedCriteria,
        output: str(outB, MAX_PROMPT),
      },
      totalCostUsd: round6(costA + costB),
      winner,
      aiRecommendation: null,
    };
  }

  // Yapay zekânın rolü (Notion): Görev türüne göre model önerir; hız/kalite ölçümünü kayıtlı test sonucuna bağlar.
  function recommendModelForTask(taskType, runs, catalog) {
    const cat = normalizeCatalog(catalog);
    const tType = TASK_TYPES.includes(taskType) ? taskType : "genel";
    const list = Array.isArray(runs) ? runs : [];
    const matchingRuns = list.filter((r) => r && r.taskType === tType);
    const pool = matchingRuns.length ? matchingRuns : list;

    const statsByModel = {};
    for (const r of pool) {
      for (const side of [r.sideA, r.sideB]) {
        if (!side || !side.modelId) continue;
        if (!statsByModel[side.modelId]) {
          statsByModel[side.modelId] = {
            modelId: side.modelId,
            displayName: side.displayName,
            providerName: side.providerName,
            runIds: [],
            totalScore: 0,
            totalLatency: 0,
            totalCost: 0,
            count: 0,
          };
        }
        const st = statsByModel[side.modelId];
        st.runIds.push(r.id);
        st.totalScore += Number(side.qualityScore) || 0;
        st.totalLatency += Number(side.latencyMs) || 0;
        st.totalCost += Number(side.costUsd) || 0;
        st.count++;
      }
    }

    const candidates = Object.values(statsByModel).map((st) => {
      const avgQuality = round2(st.totalScore / st.count);
      const avgLatencyMs = Math.round(st.totalLatency / st.count);
      const avgCostUsd = round6(st.totalCost / st.count);
      const composite = avgQuality - avgCostUsd * 1200 - avgLatencyMs * 0.008;
      return {
        modelId: st.modelId,
        displayName: st.displayName,
        providerName: st.providerName,
        sampleCount: st.count,
        evidenceRunIds: st.runIds.slice(0, 5),
        avgQuality,
        avgLatencyMs,
        avgCostUsd,
        composite: round2(composite),
      };
    });

    candidates.sort((a, b) => b.composite - a.composite);
    if (candidates.length) {
      const best = candidates[0];
      const fast = [...candidates].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)[0];
      return {
        taskType: tType,
        taskLabel: TASK_NAMES[tType],
        recommendedModelId: best.modelId,
        recommendedName: best.displayName,
        providerName: best.providerName,
        evidenceRunIds: best.evidenceRunIds,
        avgQuality: best.avgQuality,
        avgLatencyMs: best.avgLatencyMs,
        avgCostUsd: best.avgCostUsd,
        fastestModelId: fast.modelId,
        fastestName: fast.displayName,
        fastestLatencyMs: fast.avgLatencyMs,
        tiedToBenchmark: true,
        summary: `${TASK_NAMES[tType]} görevi için kayıtlı test sonuçlarına (${best.evidenceRunIds.join(", ")}) göre önerilen model: ${best.displayName} (Ortalama kalite: ${best.avgQuality}/100, hız: ${best.avgLatencyMs} ms, görev maliyeti: $${best.avgCostUsd.toFixed(6)}).`,
        candidates,
      };
    }

    const fallback = cat.find((m) => m.strengths.includes(tType)) || cat[0];
    return {
      taskType: tType,
      taskLabel: TASK_NAMES[tType],
      recommendedModelId: fallback.id,
      recommendedName: fallback.displayName,
      providerName: fallback.providerName,
      evidenceRunIds: [],
      avgQuality: null,
      avgLatencyMs: null,
      avgCostUsd: null,
      tiedToBenchmark: false,
      summary: `${TASK_NAMES[tType]} için henüz kayıtlı test sonucu yok; katalog başlangıç önerisi: ${fallback.displayName}.`,
      candidates: [],
    };
  }

  function redactSecrets(text) {
    let n = 0;
    const byType = {};
    const bump = (label) => { byType[label] = (byType[label] || 0) + 1; return `⟦${++n}⟧`; };
    const out = str(text, 4000)
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => bump("e-posta"))
      .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, () => bump("API anahtarı"))
      .replace(/\b(?:\+?90|0)?\s*5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g, () => bump("telefon"));
    return { text: out, count: n, byType };
  }

  function aiPayload(taskType, runs, catalog) {
    const rec = recommendModelForTask(taskType, runs, catalog);
    const summaryRows = rec.candidates.map((c) => ({
      modelId: c.modelId,
      avgQuality: c.avgQuality,
      avgLatencyMs: c.avgLatencyMs,
      avgCostUsd: c.avgCostUsd,
      evidenceRunIds: c.evidenceRunIds,
    }));
    const sys = "Sen Model Switchboard yardımcı motorusun. Verilen görev türü ve kayıtlı benchmark ölçümlerine dayanarak JSON biçiminde model önerisi döndür: {\"onerilenModel\": \"modelId\", \"gerekce\": \"...\", \"kanitTestIdleri\": [\"...\"]}. Kayıtlı testlerde olmayan model veya test kimliği uydurma.";
    const usr = JSON.stringify({ gorevTuru: rec.taskType, gorevAdi: rec.taskLabel, kayitliOlcumler: summaryRows });
    return {
      taskType: rec.taskType,
      baseline: rec,
      sent: { chars: usr.length, candidateCount: summaryRows.length, evidenceRuns: rec.evidenceRunIds },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    };
  }

  function validateAiRecommendation(rawText, payload, catalog) {
    const cat = normalizeCatalog(catalog);
    const validModels = new Set(cat.map((m) => m.id));
    const validRuns = new Set((payload && payload.baseline && payload.baseline.evidenceRunIds) || []);
    for (const c of (payload && payload.baseline && payload.baseline.candidates) || []) {
      for (const id of c.evidenceRunIds || []) validRuns.add(id);
    }
    let parsed = null;
    try {
      const m = String(rawText || "").match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch { parsed = null; }

    let dropped = 0;
    const droppedReasons = [];
    let modelId = parsed && typeof parsed.onerilenModel === "string" ? parsed.onerilenModel.trim() : "";
    if (!validModels.has(modelId)) {
      if (modelId) { dropped++; droppedReasons.push("Katalogda olmayan model atıldı: " + modelId); }
      modelId = payload.baseline.recommendedModelId;
    }

    const rawEvidence = parsed && Array.isArray(parsed.kanitTestIdleri) ? parsed.kanitTestIdleri : [];
    const checkedEvidence = [];
    for (const id of rawEvidence) {
      if (validRuns.has(id)) checkedEvidence.push(id);
      else { dropped++; droppedReasons.push("Kayıtlı olmayan test kimliği atıldı: " + id); }
    }
    const finalEvidence = checkedEvidence.length ? checkedEvidence : payload.baseline.evidenceRunIds;
    const modelObj = cat.find((m) => m.id === modelId) || cat[0];
    const reason = parsed && typeof parsed.gerekce === "string" && parsed.gerekce.trim()
      ? str(parsed.gerekce.trim(), 500)
      : payload.baseline.summary;

    return {
      recommendedModelId: modelObj.id,
      recommendedName: modelObj.displayName,
      providerName: modelObj.providerName,
      reason,
      evidenceRunIds: finalEvidence,
      tiedToBenchmark: finalEvidence.length > 0,
      dropped,
      droppedReasons,
    };
  }

  function metrics(runs, settings, counters) {
    const list = Array.isArray(runs) ? runs : [];
    const c = normalizeCounters(counters);
    const s = normalizeSettings(settings);
    const totalSpentUsd = round6(list.reduce((acc, r) => acc + (Number(r.totalCostUsd) || 0), 0));
    const visibleCount = list.filter((r) => r && r.costVisible && typeof r.totalCostUsd === "number" && r.sideA && r.sideB).length;
    const costVisibilityPct = list.length ? round2((visibleCount / list.length) * 100) : 100;
    const budgetOverruns = list.filter((r) => r && r.budgetOverrun).length + (c.budgetOverruns || 0);
    return {
      runsCount: list.length,
      totalSpentUsd,
      budgetCapUsd: s.budgetCapUsd,
      remainingBudgetUsd: round6(Math.max(0, s.budgetCapUsd - totalSpentUsd)),
      costVisibilityPct,
      budgetOverruns,
      preventedOverruns: c.preventedOverruns,
      rejectedCookies: c.rejectedCookies,
      aiRuns: c.aiRuns,
      aiDropped: c.aiDropped,
    };
  }

  function normalizeSettings(s) {
    s = s || {};
    const cap = Number(s.budgetCapUsd);
    return {
      budgetCapUsd: !isNaN(cap) && cap >= 0 ? round6(Math.min(10000, cap)) : 0.05,
      defaultTaskType: TASK_TYPES.includes(s.defaultTaskType) ? s.defaultTaskType : "kodlama",
      defaultModelA: str(s.defaultModelA || "openai:gpt-4o-mini", 80),
      defaultModelB: str(s.defaultModelB || "anthropic:claude-3-5-haiku", 80),
      expectedOutputTokens: Math.max(32, Math.min(8192, Number(s.expectedOutputTokens) || 280)),
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "qwen2.5-coder-7b", 80),
    };
  }

  function normalizeCounters(c) {
    c = c || {};
    return {
      preventedOverruns: Math.max(0, Number(c.preventedOverruns) || 0),
      budgetOverruns: Math.max(0, Number(c.budgetOverruns) || 0),
      rejectedCookies: Math.max(0, Number(c.rejectedCookies) || 0),
      aiRuns: Math.max(0, Number(c.aiRuns) || 0),
      aiDropped: Math.max(0, Number(c.aiDropped) || 0),
      exports: Math.max(0, Number(c.exports) || 0),
    };
  }

  function csvCell(v) {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function exportCsv(runs) {
    const head = [
      "Test ID", "Başlık", "Görev Türü", "Tarih",
      "Model A", "Model A Girdi Token", "Model A Çıktı Token", "Model A Maliyet (USD)", "Model A Gecikme (ms)", "Model A Kalite",
      "Model B", "Model B Girdi Token", "Model B Çıktı Token", "Model B Maliyet (USD)", "Model B Gecikme (ms)", "Model B Kalite",
      "Toplam Maliyet (USD)", "Kazanan",
    ];
    const rows = [head.map(csvCell).join(",")];
    for (const r of Array.isArray(runs) ? runs : []) {
      rows.push([
        r.id, r.title, TASK_NAMES[r.taskType] || r.taskType, r.createdAt,
        r.sideA.displayName, r.sideA.inputTokens, r.sideA.outputTokens, r.sideA.costUsd.toFixed(6), r.sideA.latencyMs, r.sideA.qualityScore,
        r.sideB.displayName, r.sideB.inputTokens, r.sideB.outputTokens, r.sideB.costUsd.toFixed(6), r.sideB.latencyMs, r.sideB.qualityScore,
        r.totalCostUsd.toFixed(6), r.winner,
      ].map(csvCell).join(","));
    }
    return rows.join("\n") + "\n";
  }

  function exportMd(runs, settings, counters) {
    const m = metrics(runs, settings, counters);
    const lines = [
      "# Model Switchboard — Yan Yana Karşılaştırma ve Maliyet Raporu",
      "",
      `- **Görev başına gerçek maliyet görünürlüğü:** %${m.costVisibilityPct}`,
      `- **Bütçe tavanı aşımı:** ${m.budgetOverruns} (hedef: 0) · **Engellenen tavan aşımı:** ${m.preventedOverruns}`,
      `- **Toplam harcama / Bütçe tavanı:** $${m.totalSpentUsd.toFixed(6)} / $${m.budgetCapUsd.toFixed(4)} USD`,
      "",
      "## Karşılaştırma Kayıtları",
      "",
    ];
    for (const r of Array.isArray(runs) ? runs : []) {
      lines.push(`### ${r.title} (\`${r.id}\`)`);
      lines.push(`- **Görev türü:** ${TASK_NAMES[r.taskType] || r.taskType} · **Toplam maliyet:** $${r.totalCostUsd.toFixed(6)} USD · **Kazanan:** ${r.winner}`);
      lines.push(`- **A (${r.sideA.displayName} — fiyat tarihi ${r.sideA.verifiedAt}):** $${r.sideA.costUsd.toFixed(6)} USD (${r.sideA.inputTokens} girdi / ${r.sideA.outputTokens} çıktı token) · ${r.sideA.latencyMs} ms · Kalite ${r.sideA.qualityScore}/100`);
      lines.push(`- **B (${r.sideB.displayName} — fiyat tarihi ${r.sideB.verifiedAt}):** $${r.sideB.costUsd.toFixed(6)} USD (${r.sideB.inputTokens} girdi / ${r.sideB.outputTokens} çıktı token) · ${r.sideB.latencyMs} ms · Kalite ${r.sideB.qualityScore}/100`);
      lines.push("");
    }
    return lines.join("\n");
  }

  return {
    MAX_PROMPT,
    MAX_RUNS,
    TASK_TYPES,
    TASK_NAMES,
    DEFAULT_CATALOG,
    str,
    fold,
    round6,
    round2,
    isLoopbackUrl,
    validateApiKeyOrRejectCookie,
    normalizeCatalog,
    estimateTokens,
    estimateTaskCost,
    estimatePairCost,
    checkBudgetCap,
    scoreOutputRubric,
    defaultCriteriaForTask,
    buildComparisonRun,
    recommendModelForTask,
    redactSecrets,
    aiPayload,
    validateAiRecommendation,
    metrics,
    normalizeSettings,
    normalizeCounters,
    csvCell,
    exportCsv,
    exportMd,
  };
});
