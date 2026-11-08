/* PL-050 Decision Board — saf çekirdek (hem Node hem tarayıcıda çalışır).
 * Notion: "Kullanıcı seçenek, kriter ve ağırlık girer; kaynaklı karar matrisi, artı/eksi ve karar günlüğü üretir. İlk sürüm manuel kaynaklı tek pano."
 * "Yapay zekânın rolü: Eksik kriter ve çelişki önerir; kullanıcı tercihleri yerine modelin değerlerini dayatmaz."
 * "Teknik bağımlılık ve sınır: Puanlar hangi veri/ağırlıktan türediğiyle görünür; finansal/hukuki kararlar için uzman süreci yerine geçmez."
 * "Doğrulama ölçütü: Karar gerekçelerinin %100'ü izlenebilir; haftalık kullanıcı görüşmesinde tekrar kullanım niyeti." */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DecisionCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DOMAINS = ["teknik", "urun", "tedarik", "finans-hukuk"];
  const DOMAIN_LABELS = {
    teknik: "Teknik / Mimari Karar",
    urun: "Ürün / Özellik Kararı",
    tedarik: "Araç / Hizmet Seçimi",
    "finans-hukuk": "Finansal / Hukuki Etki İçeren Karar (Uzman İncelemesi Gerekir)",
  };
  const SPECIALIST_DISCLAIMER =
    "UYARI: Bu karar panosu ekip içi karşılaştırma ve gerekçe kaydı içindir; finansal, vergisel veya hukuki kararlar için mali müşavir / avukat uzman incelemesi yerine geçmez.";

  function str(v, max = 500) {
    return typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "";
  }

  function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  function clamp(n, min, max, fallback) {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.min(max, Math.max(min, x));
  }

  function cellKey(optionId, criterionId) {
    return `${optionId}:${criterionId}`;
  }

  function isSensitiveDomain(board) {
    if (!board) return false;
    if (board.domain === "finans-hukuk") return true;
    const text = `${board.title || ""} ${board.context || ""} ${(board.criteria || []).map((c) => c.name).join(" ")}`;
    return /sözleşme|sozlesme|hukuk|kvkk|gdpr|vergi|kredi|yatırım|yatirim|lisans|tazminat|mali\b/i.test(text);
  }

  function normalizeBoard(b) {
    b = b && typeof b === "object" ? b : {};
    const options = Array.isArray(b.options)
      ? b.options.slice(0, 12).map((o, idx) => ({
          id: str(o.id, 64) || `opt-${idx + 1}`,
          name: str(o.name, 120).trim() || `Seçenek ${idx + 1}`,
          summary: str(o.summary, 300).trim(),
        }))
      : [];
    const criteria = Array.isArray(b.criteria)
      ? b.criteria.slice(0, 20).map((c, idx) => ({
          id: str(c.id, 64) || `crit-${idx + 1}`,
          name: str(c.name, 120).trim() || `Kriter ${idx + 1}`,
          weight: clamp(Math.round(Number(c.weight) || 5), 1, 10, 5),
          unit: str(c.unit, 60).trim(),
        }))
      : [];
    const rawCells = b.cells && typeof b.cells === "object" ? b.cells : {};
    const cells = {};
    for (const o of options) {
      for (const c of criteria) {
        const k = cellKey(o.id, c.id);
        const rc = rawCells[k] || {};
        cells[k] = {
          optionId: o.id,
          criterionId: c.id,
          score: clamp(Number(rc.score != null ? rc.score : 5), 1, 10, 5),
          evidence: str(rc.evidence, 400).trim(),
          sourceTitle: str(rc.sourceTitle, 160).trim(),
          sourceUrl: str(rc.sourceUrl, 400).trim(),
        };
      }
    }
    return {
      id: str(b.id, 64) || "board-main",
      title: str(b.title, 180).trim() || "Yeni Karar Panosu",
      context: str(b.context, 800).trim(),
      domain: DOMAINS.includes(b.domain) ? b.domain : "tedarik",
      options,
      criteria,
      cells,
      selectedOptionId: str(b.selectedOptionId, 64),
      draftRationale: str(b.draftRationale, 1000).trim(),
      aiSuggestions: b.aiSuggestions || null,
      updatedAt: Number(b.updatedAt) || Date.now(),
    };
  }

  function evaluateBoard(rawBoard) {
    const board = normalizeBoard(rawBoard);
    const totalWeight = board.criteria.reduce((s, c) => s + c.weight, 0) || 1;
    const criteriaWithShare = board.criteria.map((c) => ({
      ...c,
      weightShare: round2((c.weight / totalWeight) * 100),
    }));

    let totalCells = 0;
    let backedCells = 0;
    const unbackedCells = [];
    const contradictions = [];

    const optionResults = board.options.map((o) => {
      let weightedSum100 = 0;
      const breakdowns = [];
      const pros = [];
      const cons = [];

      for (const c of criteriaWithShare) {
        totalCells++;
        const k = cellKey(o.id, c.id);
        const cell = board.cells[k] || { score: 5, evidence: "", sourceTitle: "", sourceUrl: "" };
        const hasEvidence = Boolean(cell.evidence && cell.evidence.trim().length >= 3);
        const hasSource = Boolean(cell.sourceTitle && cell.sourceTitle.trim().length >= 2);
        const isBacked = hasEvidence && hasSource;

        if (isBacked) {
          backedCells++;
        } else {
          unbackedCells.push({
            key: k,
            optionId: o.id,
            optionName: o.name,
            criterionId: c.id,
            criterionName: c.name,
            missing: !hasEvidence && !hasSource ? "veri gerekçesi ve kaynak eksik" : !hasEvidence ? "veri gerekçesi eksik" : "kaynak adı eksik",
          });
        }

        // Çelişki denetimi: yüksek puana rağmen kanıtta olumsuz ifade veya düşük puana rağmen olumlu ifade
        const evLower = (cell.evidence || "").toLowerCase();
        if (cell.score >= 8 && /(yok\b|desteklemiyor|çok pahalı|cok pahali|yüksek risk|yuksek risk|yetersiz|eksik|불|iade edilmez|kısıtlı)/i.test(evLower)) {
          contradictions.push({
            type: "puan-kanit-celiskisi",
            optionName: o.name,
            criterionName: c.name,
            message: `${o.name} · ${c.name}: Puan yüksek (${cell.score}/10) verilmiş ancak veri gerekçesinde olumsuz ifade var (“${cell.evidence}”).`,
          });
        } else if (cell.score <= 3 && /(tam uyumlu|en düşük maliyet|en ucuz|ücretsiz|ucretsiz|sıfır gecikme|kusursuz|tam destek)/i.test(evLower)) {
          contradictions.push({
            type: "puan-kanit-celiskisi",
            optionName: o.name,
            criterionName: c.name,
            message: `${o.name} · ${c.name}: Puan düşük (${cell.score}/10) verilmiş ancak veri gerekçesi olumlu görünüyor (“${cell.evidence}”).`,
          });
        }

        const contribution = round2((cell.score / 10) * c.weightShare);
        weightedSum100 = round2(weightedSum100 + contribution);

        const formula = `Puan ${cell.score}/10 × Ağırlık %${c.weightShare.toFixed(1)} (${c.weight}/${totalWeight}) = ${contribution.toFixed(2)} puan`;
        breakdowns.push({
          criterionId: c.id,
          criterionName: c.name,
          weight: c.weight,
          weightShare: c.weightShare,
          score: cell.score,
          contribution,
          evidence: cell.evidence,
          sourceTitle: cell.sourceTitle,
          sourceUrl: cell.sourceUrl,
          isBacked,
          formula,
        });

        if (cell.score >= 8) {
          pros.push(`${c.name} (${cell.score}/10, ağırlık %${c.weightShare.toFixed(0)}): ${cell.evidence || "Gerekçe girilmedi"} [${cell.sourceTitle || "Kaynak yok"}]`);
        } else if (cell.score <= 4) {
          cons.push(`${c.name} (${cell.score}/10, ağırlık %${c.weightShare.toFixed(0)}): ${cell.evidence || "Gerekçe girilmedi"} [${cell.sourceTitle || "Kaynak yok"}]`);
        }
      }

      return {
        optionId: o.id,
        optionName: o.name,
        summary: o.summary,
        totalScore: round2(weightedSum100),
        breakdowns,
        pros,
        cons,
      };
    });

    const ranked = [...optionResults].sort((a, b) => b.totalScore - a.totalScore);
    const leader = ranked[0] || null;
    const runnerUp = ranked[1] || null;

    // Seçilen seçenek lider değilse çelişki / ödünleşim uyarısı üret
    if (board.selectedOptionId && leader && board.selectedOptionId !== leader.optionId) {
      const chosen = optionResults.find((r) => r.optionId === board.selectedOptionId);
      if (chosen) {
        contradictions.push({
          type: "secim-siralama-farki",
          optionName: chosen.optionName,
          criterionName: "Genel Toplam",
          message: `Seçilen “${chosen.optionName}” (${chosen.totalScore.toFixed(2)} puan), matris lideri “${leader.optionName}” (${leader.totalScore.toFixed(2)} puan) seçeneğinin gerisinde. Karar gerekçesinde bu ödünleşimi açıklayın.`,
        });
      }
    }

    // Ağırlık duyarlılık analizi (±3 ağırlık değişiminde lider değişiyor mu?)
    const sensitivity = [];
    if (board.options.length >= 2 && board.criteria.length >= 2 && leader) {
      for (const crit of board.criteria) {
        for (const delta of [-3, +3]) {
          const testWeight = clamp(crit.weight + delta, 1, 10, crit.weight);
          if (testWeight === crit.weight) continue;
          const modTotalW = totalWeight - crit.weight + testWeight;
          const scores = board.options.map((o) => {
            let s = 0;
            for (const c of board.criteria) {
              const w = c.id === crit.id ? testWeight : c.weight;
              const cell = board.cells[cellKey(o.id, c.id)] || { score: 5 };
              s += (cell.score / 10) * ((w / modTotalW) * 100);
            }
            return { optionId: o.id, optionName: o.name, score: round2(s) };
          });
          scores.sort((a, b) => b.score - a.score);
          if (scores[0].optionId !== leader.optionId) {
            sensitivity.push({
              criterionId: crit.id,
              criterionName: crit.name,
              fromWeight: crit.weight,
              toWeight: testWeight,
              newLeaderName: scores[0].optionName,
              message: `“${crit.name}” ağırlığı ${crit.weight} → ${testWeight} olursa 1. sıra “${leader.optionName}” yerine “${scores[0].optionName}” olur.`,
            });
          }
        }
      }
    }

    // Kural tabanlı eksik kriter önerileri (kullanıcı tercihini dayatmadan yalnız sorulması gereken boyutları hatırlatır)
    const critNamesJoined = board.criteria.map((c) => c.name.toLowerCase()).join(" ");
    const missingCriteria = [];
    if (!/maliyet|fiyat|bütçe|butce|ücret|ucret|tco/i.test(critNamesJoined)) {
      missingCriteria.push({ name: "Toplam Sahip Olma Maliyeti (TCO)", reason: "Kriterler arasında doğrudan maliyet/bütçe boyutu görünmüyor." });
    }
    if (!/taşınabilirlik|tasinabilirlik|çıkış|cikis|lock-in|bağımlılık|bagimlilik|göç/i.test(critNamesJoined)) {
      missingCriteria.push({ name: "Tedarikçi Bağımlılığı ve Çıkış Maliyeti (Lock-in)", reason: "İleride başka bir araca/hizmete geçiş kolaylığı henüz kriter olarak eklenmemiş." });
    }
    if (!/güvenlik|guvenlik|gizlilik|kvkk|gdpr|uyum|yetki/i.test(critNamesJoined)) {
      missingCriteria.push({ name: "Veri Güvenliği ve Mevzuat Uyumu (KVKK/GDPR)", reason: "Veri işleme ve güvenlik gereksinimleri için ayrı bir kriter bulunmuyor." });
    }
    if (!/bakım|bakim|operasyon|destek|sla|ekip/i.test(critNamesJoined)) {
      missingCriteria.push({ name: "Operasyon Yükü ve Destek / SLA", reason: "Kurulum sonrası bakım ve ekip eforu kriterlerde yer almıyor." });
    }

    const traceabilityRate = totalCells > 0 ? round2((backedCells / totalCells) * 100) : 100;

    return {
      totalWeight,
      criteriaWithShare,
      optionResults,
      ranked,
      leader,
      runnerUp,
      margin: leader && runnerUp ? round2(leader.totalScore - runnerUp.totalScore) : 0,
      totalCells,
      backedCells,
      unbackedCells,
      traceabilityRate,
      fullyTraceable: totalCells > 0 && unbackedCells.length === 0,
      contradictions,
      sensitivity,
      missingCriteria,
      requiresSpecialistDisclaimer: isSensitiveDomain(board),
      specialistDisclaimer: SPECIALIST_DISCLAIMER,
    };
  }

  function addOption(board, optInput) {
    const b = normalizeBoard(board);
    const id = str(optInput && optInput.id, 64) || "opt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5);
    const name = str(optInput && optInput.name, 120).trim();
    if (!name) throw new Error("Seçenek adı boş olamaz.");
    b.options.push({ id, name, summary: str(optInput && optInput.summary, 300).trim() });
    for (const c of b.criteria) {
      b.cells[cellKey(id, c.id)] = {
        optionId: id,
        criterionId: c.id,
        score: clamp(Number(optInput && optInput.defaultScore) || 5, 1, 10, 5),
        evidence: str(optInput && optInput.defaultEvidence, 400).trim(),
        sourceTitle: str(optInput && optInput.defaultSource, 160).trim(),
        sourceUrl: "",
      };
    }
    b.updatedAt = Date.now();
    const out = normalizeBoard(b);
    if (board && typeof board === "object") Object.assign(board, out);
    return out;
  }

  function addCriterion(board, critInput) {
    const b = normalizeBoard(board);
    const id = str(critInput && critInput.id, 64) || "crit-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5);
    const name = str(critInput && critInput.name, 120).trim();
    if (!name) throw new Error("Kriter adı boş olamaz.");
    const weight = clamp(Math.round(Number(critInput && critInput.weight) || 5), 1, 10, 5);
    b.criteria.push({ id, name, weight, unit: str(critInput && critInput.unit, 60).trim() });
    for (const o of b.options) {
      b.cells[cellKey(o.id, id)] = {
        optionId: o.id,
        criterionId: id,
        score: clamp(Number(critInput && critInput.defaultScore) || 5, 1, 10, 5),
        evidence: str(critInput && critInput.defaultEvidence, 400).trim(),
        sourceTitle: str(critInput && critInput.defaultSource, 160).trim(),
        sourceUrl: "",
      };
    }
    b.updatedAt = Date.now();
    const out = normalizeBoard(b);
    if (board && typeof board === "object") Object.assign(board, out);
    return out;
  }

  function updateCell(board, optionId, criterionId, patch = {}) {
    const b = normalizeBoard(board);
    const k = cellKey(optionId, criterionId);
    if (!b.cells[k]) throw new Error("Matris hücresi bulunamadı.");
    if ("score" in patch) b.cells[k].score = clamp(Number(patch.score), 1, 10, b.cells[k].score);
    if ("evidence" in patch) b.cells[k].evidence = str(patch.evidence, 400).trim();
    if ("sourceTitle" in patch) b.cells[k].sourceTitle = str(patch.sourceTitle, 160).trim();
    if ("sourceUrl" in patch) b.cells[k].sourceUrl = str(patch.sourceUrl, 400).trim();
    b.updatedAt = Date.now();
    if (board && typeof board === "object") Object.assign(board, b);
    return b;
  }

  function updateCriterionWeight(board, criterionId, weight) {
    const b = normalizeBoard(board);
    const c = b.criteria.find((x) => x.id === criterionId);
    if (!c) throw new Error("Kriter bulunamadı.");
    c.weight = clamp(Math.round(Number(weight)), 1, 10, c.weight);
    b.updatedAt = Date.now();
    if (board && typeof board === "object") Object.assign(board, b);
    return b;
  }

  function recordDecision(rawBoard, input = {}, existingLog = [], nowIso = new Date().toISOString()) {
    const board = normalizeBoard(rawBoard);
    const evalRes = evaluateBoard(board);
    if (!board.options.length || !board.criteria.length) {
      throw new Error("Karar kaydı için en az bir seçenek ve bir kriter olmalıdır.");
    }
    if (!evalRes.fullyTraceable) {
      const firstMissing = evalRes.unbackedCells[0];
      throw new Error(
        `Karar gerekçelerinin %100'ü izlenebilir olmalıdır (şu an %${evalRes.traceabilityRate}). Eksik hücre: ${firstMissing.optionName} · ${firstMissing.criterionName} (${firstMissing.missing}).`
      );
    }
    const chosenId = str(input.selectedOptionId || board.selectedOptionId || (evalRes.leader && evalRes.leader.optionId), 64);
    const chosen = evalRes.optionResults.find((o) => o.optionId === chosenId);
    if (!chosen) throw new Error("Karar verilecek seçenek bulunamadı.");

    const rationale = str(input.rationale != null ? input.rationale : board.draftRationale, 1000).trim();
    if (!rationale || rationale.length < 10) {
      throw new Error("Karar günlüğüne kaydetmek için en az 10 karakterlik açık bir karar gerekçesi yazın.");
    }

    const entry = {
      id: "dec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      boardTitle: board.title,
      domain: board.domain,
      decidedAt: nowIso,
      chosenOptionId: chosen.optionId,
      chosenOptionName: chosen.optionName,
      chosenScore: chosen.totalScore,
      leaderOptionName: evalRes.leader ? evalRes.leader.optionName : chosen.optionName,
      leaderScore: evalRes.leader ? evalRes.leader.totalScore : chosen.totalScore,
      traceabilityRate: evalRes.traceabilityRate,
      rationale,
      reviewerNote: str(input.reviewerNote, 300).trim(),
      snapshot: {
        criteria: evalRes.criteriaWithShare,
        ranking: evalRes.ranked.map((r) => ({
          optionName: r.optionName,
          totalScore: r.totalScore,
          pros: r.pros,
          cons: r.cons,
          breakdowns: r.breakdowns,
        })),
      },
      specialistDisclaimer: evalRes.requiresSpecialistDisclaimer ? SPECIALIST_DISCLAIMER : "",
    };

    board.selectedOptionId = chosen.optionId;
    board.draftRationale = rationale;
    const nextLog = [entry, ...(Array.isArray(existingLog) ? existingLog : [])].slice(0, 500);
    return { board, entry, decisionLog: nextLog, evaluation: evalRes };
  }

  function aiPayload(rawBoard) {
    const board = normalizeBoard(rawBoard);
    const evalRes = evaluateBoard(board);
    const summaryObj = {
      baslik: board.title,
      alan: board.domain,
      secenekler: board.options.map((o) => o.name),
      kriterler: evalRes.criteriaWithShare.map((c) => ({ ad: c.name, agirlik: c.weight, payYuzde: c.weightShare })),
      hucreler: evalRes.optionResults.map((r) => ({
        secenek: r.optionName,
        toplamPuan: r.totalScore,
        detay: r.breakdowns.map((b) => ({
          kriter: b.criterionName,
          puan: b.score,
          kanit: b.evidence,
          kaynak: b.sourceTitle,
        })),
      })),
    };
    const content = JSON.stringify(summaryObj, null, 2).slice(0, 4000);
    const messages = [
      {
        role: "system",
        content:
          "Sen tarafsız bir karar matrisi denetçisisin. Kullanıcının seçenek tercihlerini veya ağırlıklarını ASLA değiştirme ve kazanan seçenek seçme. Yalnızca gözden kaçmış olabilecek eksik kriterleri (eksikKriterler: [{ad, neden}]) ve puan ile kanıt arasındaki olası çelişkileri (celiskiler: [{secenek, kriter, aciklama}]) JSON olarak döndür.",
      },
      {
        role: "user",
        content,
      },
    ];
    return {
      messages,
      sent: {
        chars: content.length,
        optionsCount: board.options.length,
        criteriaCount: board.criteria.length,
      },
    };
  }

  function validateAi(rawContent, rawBoard) {
    const board = normalizeBoard(rawBoard);
    const s = str(rawContent, 20000);
    const m = s.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let parsed;
    try {
      parsed = JSON.parse(m[0]);
    } catch {
      throw new Error("Model JSON yanıtı ayrıştırılamadı.");
    }

    // Model kendi değerlerini / kazanan tercihini veya ağırlık dayatmasını göndermişse bunları reddet ve say!
    let droppedPreferences = 0;
    for (const forbiddenKey of ["kazanan", "winner", "secilenSecenek", "preferredOption", "yeniAgirliklar", "overrideWeights", "puanDegisiklikleri"]) {
      if (forbiddenKey in parsed && parsed[forbiddenKey] != null) {
        droppedPreferences++;
      }
    }

    const existingNames = new Set(board.criteria.map((c) => c.name.toLowerCase()));
    const rawMissing = Array.isArray(parsed.eksikKriterler || parsed.missingCriteria) ? (parsed.eksikKriterler || parsed.missingCriteria) : [];
    const missingCriteria = [];
    for (const item of rawMissing.slice(0, 6)) {
      const name = str(item && (item.ad || item.name), 120).trim();
      const reason = str(item && (item.neden || item.reason), 240).trim();
      if (!name || existingNames.has(name.toLowerCase())) continue;
      missingCriteria.push({ name, reason: reason || "Karar kapsamını tamamlamak için önerilen kriter" });
    }

    const rawContra = Array.isArray(parsed.celiskiler || parsed.contradictions) ? (parsed.celiskiler || parsed.contradictions) : [];
    const contradictions = [];
    for (const item of rawContra.slice(0, 6)) {
      const optionName = str(item && (item.secenek || item.optionName), 120).trim();
      const criterionName = str(item && (item.kriter || item.criterionName), 120).trim();
      const message = str(item && (item.aciklama || item.message), 300).trim();
      if (!message) continue;
      contradictions.push({ optionName, criterionName, message });
    }

    return {
      missingCriteria,
      contradictions,
      droppedPreferences,
    };
  }

  function csvSafeCell(val) {
    let s = String(val == null ? "" : val).replace(/\r?\n/g, " ").trim();
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    if (/[",;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exportCsv(rawBoard) {
    const board = normalizeBoard(rawBoard);
    const evalRes = evaluateBoard(board);
    const header = ["Seçenek", "Kriter", "Ağırlık (1-10)", "Ağırlık Payı (%)", "Ham Puan (1-10)", "Ağırlıklı Katkı (100 üzerinden)", "Veri / Gerekçe", "Kaynak Adı", "İzlenebilirlik"];
    const rows = [header.join(",")];
    for (const r of evalRes.optionResults) {
      for (const b of r.breakdowns) {
        rows.push([
          csvSafeCell(r.optionName),
          csvSafeCell(b.criterionName),
          csvSafeCell(b.weight),
          csvSafeCell(b.weightShare.toFixed(2)),
          csvSafeCell(b.score),
          csvSafeCell(b.contribution.toFixed(2)),
          csvSafeCell(b.evidence),
          csvSafeCell(b.sourceTitle),
          csvSafeCell(b.isBacked ? "Tam İzlenebilir" : "Eksik Kaynak/Kanıt"),
        ].join(","));
      }
    }
    return rows.join("\n") + "\n";
  }

  function exportAdrMd(rawBoard, decisionLog = []) {
    const board = normalizeBoard(rawBoard);
    const evalRes = evaluateBoard(board);
    const lines = [
      `# Karar Matrisi ve Karar Günlüğü (ADR): ${board.title}`,
      "",
      `> **Alan:** ${DOMAIN_LABELS[board.domain] || board.domain} · **İzlenebilirlik:** %${evalRes.traceabilityRate} (${evalRes.backedCells}/${evalRes.totalCells} hücre kaynaklı)`,
      `> ${SPECIALIST_DISCLAIMER}`,
      "",
      "## 1. Bağlam",
      board.context || "Bağlam belirtilmedi.",
      "",
      "## 2. Ağırlıklı Karar Matrisi ve Puan Türetimi",
      "",
      "| Seçenek | Toplam Puan (/100) | Kriter Kırılımı (Puan × Ağırlık = Katkı · Kaynak) |",
      "| --- | --- | --- |",
    ];
    for (const r of evalRes.ranked) {
      const detail = r.breakdowns
        .map((b) => `${b.criterionName}: ${b.score}/10 × %${b.weightShare.toFixed(1)} = **${b.contribution.toFixed(2)}** (${b.evidence} — *${b.sourceTitle}*)`)
        .join("<br>");
      lines.push(`| **${r.optionName}** | **${r.totalScore.toFixed(2)}** | ${detail} |`);
    }

    lines.push("", "## 3. Seçeneklere Göre Artılar ve Eksiler", "");
    for (const r of evalRes.ranked) {
      lines.push(`### ${r.optionName} (${r.totalScore.toFixed(2)} puan)`);
      lines.push("- **Artılar (+):** " + (r.pros.length ? r.pros.join(" · ") : "Belirgin yüksek puanlı kriter yok."));
      lines.push("- **Eksiler (-):** " + (r.cons.length ? r.cons.join(" · ") : "Belirgin düşük puanlı kriter yok."));
      lines.push("");
    }

    if (Array.isArray(decisionLog) && decisionLog.length) {
      lines.push("## 4. Kayıtlı Karar Günlüğü (Tarihçeli)", "");
      for (const d of decisionLog) {
        lines.push(`- **${d.decidedAt.slice(0, 10)} — Seçilen: ${d.chosenOptionName} (${d.chosenScore.toFixed(2)} puan)** · İzlenebilirlik: %${d.traceabilityRate}`);
        lines.push(`  - Gerekçe: ${d.rationale}`);
      }
    }
    return lines.join("\n") + "\n";
  }

  function isLoopbackUrl(u) {
    try {
      const x = new URL(u);
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch {
      return false;
    }
  }

  function normalizeSettings(s) {
    s = s && typeof s === "object" ? s : {};
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? s.localUrl : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
    };
  }

  return {
    DOMAINS,
    DOMAIN_LABELS,
    SPECIALIST_DISCLAIMER,
    str,
    round2,
    cellKey,
    isSensitiveDomain,
    normalizeBoard,
    evaluateBoard,
    addOption,
    addCriterion,
    updateCell,
    updateCriterionWeight,
    recordDecision,
    aiPayload,
    validateAi,
    exportCsv,
    exportAdrMd,
    isLoopbackUrl,
    normalizeSettings,
  };
});
