/* Decision Board (PL-050) — arayüz mantığı (yalnız güvenli DOM, innerHTML kullanılmaz). */
(function () {
  "use strict";
  const D = window.dbDesktop;
  const C = window.DecisionCore;
  const $ = (id) => document.getElementById(id);

  let S = null;
  let currentNav = "matrix";
  let selectedCellKey = null;

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, String(v));
    }
    for (const ch of children.flat()) {
      if (ch == null || ch === false) continue;
      node.appendChild(typeof ch === "Node" || ch instanceof Node ? ch : document.createTextNode(String(ch)));
    }
    return node;
  }

  function toast(msg, kind = "info") {
    const box = $("toasts");
    const t = el("div", { class: `pl-toast pl-toast--${kind}` }, String(msg));
    box.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }

  async function run(fn) {
    try {
      await fn();
    } catch (err) {
      toast(err && err.message ? err.message : String(err), "danger");
    }
  }

  function switchNav(nav) {
    currentNav = nav;
    document.querySelectorAll("[data-nav]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.nav === nav);
    });
    $("view-matrix").hidden = nav !== "matrix";
    $("view-analysis").hidden = nav !== "analysis";
    $("view-log").hidden = nav !== "log";
    render();
  }

  function renderMatrixView() {
    const b = S.board;
    const ev = S.evaluation;
    const hasData = b.options.length > 0 && b.criteria.length > 0;
    $("emptyPanel").hidden = hasData;
    $("matrixSplit").hidden = !hasData;

    const banner = $("specialistBanner");
    if (hasData && ev.requiresSpecialistDisclaimer) {
      banner.hidden = false;
      banner.textContent = ev.specialistDisclaimer;
    } else {
      banner.hidden = true;
    }

    if (!hasData) return;

    $("boardTitleInput").value = b.title;
    $("boardDomainSel").value = b.domain;
    $("leaderHint").textContent = ev.leader
      ? `1. Sıra: ${ev.leader.optionName} (${ev.leader.totalScore.toFixed(2)}/100) · İzlenebilirlik: %${ev.traceabilityRate}`
      : "";

    if (!selectedCellKey || !b.cells[selectedCellKey]) {
      selectedCellKey = C.cellKey(b.options[0].id, b.criteria[0].id);
    }

    const wrap = $("matrixWrap");
    wrap.replaceChildren();

    const theadRow = el(
      "tr",
      {},
      el("th", {}, "Kriter / Ağırlık"),
      ...ev.optionResults.map((o) =>
        el(
          "th",
          {},
          el("div", {}, o.optionName),
          el("div", { class: "ax-num pl-muted" }, `Toplam: ${o.totalScore.toFixed(2)} / 100`)
        )
      )
    );

    const tbodyRows = ev.criteriaWithShare.map((crit) => {
      const weightSelect = el(
        "select",
        {
          class: "pl-input db-weight-select",
          "aria-label": `${crit.name} ağırlığı`,
          onchange: (e) =>
            run(async () => {
              S = await D.board.updateWeight(crit.id, Number(e.target.value));
              render();
              toast(`“${crit.name}” ağırlığı güncellendi.`);
            }),
        },
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => el("option", { value: w, selected: w === crit.weight }, `Ağırlık ${w}`))
      );

      const critCell = el(
        "td",
        {},
        el("b", {}, crit.name),
        el("div", { class: "pl-muted ax-num" }, `Pay: %${crit.weightShare.toFixed(1)} (${crit.weight}/${ev.totalWeight})`),
        weightSelect
      );

      const optCells = ev.optionResults.map((opt) => {
        const k = C.cellKey(opt.optionId, crit.id);
        const br = opt.breakdowns.find((x) => x.criterionId === crit.id);
        const isSel = k === selectedCellKey;
        return el(
          "td",
          {
            class: `ax-mcell${isSel ? " is-sel" : ""}${!br.isBacked ? " is-unbacked" : ""}`,
            dataset: { cell: k },
            onclick: () => {
              selectedCellKey = k;
              render();
            },
          },
          el(
            "div",
            { class: "ax-mcell__top" },
            el("span", {}, `${br.score}/10`),
            el("span", { class: "ax-mcell__sub" }, `+${br.contribution.toFixed(2)} p`)
          ),
          el("div", { class: "ax-mcell__ev" }, br.evidence || "⚠ Veri gerekçesi eksik"),
          el("div", { class: "ax-mcell__src" }, br.sourceTitle ? `Kaynak: ${br.sourceTitle}` : "⚠ Kaynak eksik")
        );
      });

      return el("tr", {}, critCell, ...optCells);
    });

    wrap.appendChild(el("table", { class: "ax-mtable" }, el("thead", {}, theadRow), el("tbody", {}, ...tbodyRows)));

    // Seçili Hücre Denetçisi
    const detail = $("cellDetail");
    detail.replaceChildren();
    const [selOptId, selCritId] = selectedCellKey.split(":");
    const selOpt = ev.optionResults.find((o) => o.optionId === selOptId);
    const selBr = selOpt ? selOpt.breakdowns.find((x) => x.criterionId === selCritId) : null;

    if (!selOpt || !selBr) return;

    const scoreInput = el("input", { class: "pl-input", id: "cScore", type: "number", min: "1", max: "10", value: selBr.score });
    const evInput = el("textarea", { class: "pl-input ax-area", id: "cEvidence", rows: "3", placeholder: "Bu puan hangi ölçüme veya veriye dayanıyor?" }, selBr.evidence);
    const srcInput = el("input", { class: "pl-input", id: "cSource", value: selBr.sourceTitle, placeholder: "ör. SLA Sözleşmesi Madde 3.2" });

    detail.append(
      el(
        "div",
        { class: `ax-block ${selBr.isBacked ? "ax-block--ok" : "ax-block--warn"}`, id: "derivationBox" },
        el("div", { class: "ax-lbl" }, "Puan Türetimi ve İzlenebilirlik Kanıtı"),
        el("b", {}, `${selOpt.optionName} · ${selBr.criterionName}`),
        el("p", { class: "ax-small ax-num", id: "formulaText" }, selBr.formula),
        el(
          "p",
          { class: "ax-small pl-muted" },
          selBr.isBacked
            ? `İzlenebilirlik: TAM — Kaynak: “${selBr.sourceTitle}”`
            : "İzlenebilirlik: EKSİK — Karar kaydı öncesi veri gerekçesi ve kaynak girilmelidir."
        )
      ),
      el(
        "div",
        { class: "ax-block" },
        el("div", { class: "ax-lbl" }, "Hücre Puanı ve Kaynağını Düzenle"),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "cScore" }, "Ham Puan (1–10)"), scoreInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "cEvidence" }, "Veri / Gerekçe (Zorunlu)"), evInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "cSource" }, "Kaynak Belge / Referans (Zorunlu)"), srcInput),
        el(
          "div",
          { class: "ax-bar" },
          el(
            "button",
            {
              class: "pl-btn pl-btn--primary pl-btn--sm",
              id: "saveCellBtn",
              type: "button",
              onclick: () =>
                run(async () => {
                  S = await D.board.updateCell(selOptId, selCritId, {
                    score: Number(scoreInput.value),
                    evidence: evInput.value,
                    sourceTitle: srcInput.value,
                  });
                  render();
                  toast("Hücre puanı ve kaynağı güncellendi.", "success");
                }),
            },
            "Hücreyi Kaydet"
          )
        )
      )
    );
  }

  function renderAnalysisView() {
    const ev = S.evaluation;
    const b = S.board;
    const issuesBox = $("issuesContainer");
    issuesBox.replaceChildren();

    // 1. Çelişkiler
    const allContradictions = [
      ...ev.contradictions,
      ...((b.aiSuggestions && b.aiSuggestions.contradictions) || []),
    ];
    issuesBox.appendChild(
      el(
        "div",
        { class: `ax-block ${allContradictions.length ? "ax-block--warn" : "ax-block--ok"}`, id: "contradictionsBox" },
        el("div", { class: "ax-lbl" }, `Puan-Kanıt ve Sıralama Çelişkileri (${allContradictions.length})`),
        allContradictions.length
          ? el("ul", { class: "ax-ul" }, ...allContradictions.map((c) => el("li", {}, c.message)))
          : el("p", { class: "ax-small pl-muted" }, "Puanlar ile veri gerekçeleri arasında çelişki tespit edilmedi.")
      )
    );

    // 2. Eksik Kriter Önerileri (Kural + MyMind)
    const allMissing = [
      ...ev.missingCriteria,
      ...((b.aiSuggestions && b.aiSuggestions.missingCriteria) || []),
    ];
    issuesBox.appendChild(
      el(
        "div",
        { class: "ax-block ax-block--ai", id: "missingCriteriaBox" },
        el(
          "div",
          { class: "ax-bar" },
          el("div", { class: "ax-lbl" }, `Önerilen Eksik Kriterler (${allMissing.length})`),
          el("span", { class: "ax-grow" }),
          b.aiSuggestions
            ? el(
                "span",
                { class: "pl-badge", id: "droppedPrefBadge" },
                `Model tercih dayatması engellendi: ${b.aiSuggestions.droppedPreferences} öğe atıldı`
              )
            : null
        ),
        allMissing.length
          ? el(
              "div",
              { class: "ax-stack" },
              ...allMissing.map((m) =>
                el(
                  "div",
                  { class: "ax-bar" },
                  el("div", {}, el("b", {}, m.name), el("p", { class: "ax-small pl-muted" }, m.reason)),
                  el("span", { class: "ax-grow" }),
                  el(
                    "button",
                    {
                      class: "pl-btn pl-btn--secondary pl-btn--sm add-suggested-crit",
                      type: "button",
                      onclick: () =>
                        run(async () => {
                          S = await D.ai.applyCriterion(m);
                          render();
                          toast(`“${m.name}” kriter olarak matrise eklendi.`, "success");
                        }),
                    },
                    "+ Matrise Kriter Ekle"
                  )
                )
              )
            )
          : el("p", { class: "ax-small pl-muted" }, "Temel karar boyutları (maliyet, operasyon, taşınabilirlik, güvenlik) matriste mevcut.")
      )
    );

    // 3. Ağırlık Duyarlılık Analizi
    issuesBox.appendChild(
      el(
        "div",
        { class: "ax-block", id: "sensitivityBox" },
        el("div", { class: "ax-lbl" }, "Ağırlık Duyarlılık Analizi (±3 Puan Değişimi)"),
        ev.sensitivity.length
          ? el("ul", { class: "ax-ul" }, ...ev.sensitivity.map((s) => el("li", {}, s.message)))
          : el(
              "p",
              { class: "ax-small pl-muted" },
              ev.leader
                ? `Sıralama dayanıklı: Tek bir kriterin ağırlığı ±3 değiştiğinde 1. sıradaki “${ev.leader.optionName}” değişmiyor (fark: ${ev.margin.toFixed(2)} puan).`
                : "Henüz yeterli seçenek yok."
            )
      )
    );

    // Artılar ve Eksiler
    const pcBox = $("prosConsContainer");
    pcBox.replaceChildren();
    for (const r of ev.ranked) {
      pcBox.appendChild(
        el(
          "div",
          { class: "ax-block" },
          el("div", { class: "ax-bar" }, el("b", {}, r.optionName), el("span", { class: "ax-grow" }), el("span", { class: "pl-badge ax-num" }, `${r.totalScore.toFixed(2)} p`)),
          el("div", { class: "ax-lbl" }, "Artılar (+, Puan ≥ 8)"),
          r.pros.length ? el("ul", { class: "ax-ul" }, ...r.pros.map((p) => el("li", {}, p))) : el("p", { class: "ax-small pl-muted" }, "Yüksek puanlı kriter yok."),
          el("div", { class: "ax-lbl" }, "Eksiler (-, Puan ≤ 4)"),
          r.cons.length ? el("ul", { class: "ax-ul" }, ...r.cons.map((c) => el("li", {}, c))) : el("p", { class: "ax-small pl-muted" }, "Düşük puanlı kriter yok.")
        )
      );
    }
  }

  function renderLogView() {
    const b = S.board;
    const ev = S.evaluation;

    const sel = $("decOptionSel");
    sel.replaceChildren(
      ...ev.ranked.map((r) =>
        el(
          "option",
          { value: r.optionId, selected: r.optionId === (b.selectedOptionId || (ev.leader && ev.leader.optionId)) },
          `${r.optionName} (${r.totalScore.toFixed(2)} puan)`
        )
      )
    );

    $("decTraceStatus").value = ev.fullyTraceable
      ? `%100 İzlenebilir (${ev.backedCells}/${ev.totalCells} hücre kaynaklı — Karar kaydına hazır)`
      : `EKSİK (%${ev.traceabilityRate} — ${ev.unbackedCells.length} hücrede kaynak/gerekçe eksik)`;

    if (document.activeElement !== $("decRationale")) {
      $("decRationale").value = b.draftRationale || "";
    }

    $("logCountInline").textContent = String(S.decisionLog.length);
    const logList = $("decisionLogList");
    logList.replaceChildren();
    if (!S.decisionLog.length) {
      logList.appendChild(el("p", { class: "ax-empty" }, "Henüz kesinleştirilmiş karar kaydı yok."));
    } else {
      for (const entry of S.decisionLog) {
        logList.appendChild(
          el(
            "div",
            { class: "ax-block ax-block--ok" },
            el(
              "div",
              { class: "ax-bar" },
              el("b", {}, `Seçilen: ${entry.chosenOptionName} (${entry.chosenScore.toFixed(2)}/100)`),
              el("span", { class: "ax-grow" }),
              el("span", { class: "pl-badge pl-badge--success" }, `İzlenebilirlik %${entry.traceabilityRate}`)
            ),
            el("p", { class: "ax-small" }, entry.rationale),
            el("p", { class: "ax-small pl-muted" }, `Tarih: ${entry.decidedAt.slice(0, 10)} · Pano: ${entry.boardTitle}`)
          )
        );
      }
    }

    document.querySelectorAll('input[name="provider"]').forEach((r) => {
      r.checked = r.value === S.settings.provider;
    });
    $("localUrl").value = S.settings.localUrl || "http://127.0.0.1:1234";
    $("localModel").value = S.settings.localModel || "local-model";
    $("vaultInfo").textContent = S.vault
      ? "Yerel depolama: Karar panosu, gerekçeler ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanıyor."
      : "Yerel depolama: Bu ortamda sistem kasası yok; yerel klasörde saklanıyor.";
  }

  function render() {
    if (!S) return;
    const ev = S.evaluation;
    const issueCount =
      ev.contradictions.length +
      ev.unbackedCells.length +
      ((S.board.aiSuggestions && S.board.aiSuggestions.missingCriteria && S.board.aiSuggestions.missingCriteria.length) || 0);

    $("traceBadge").textContent = `%${ev.traceabilityRate}`;
    $("issueBadge").textContent = String(issueCount);
    $("logBadge").textContent = String(S.decisionLog.length);
    $("mymindState").textContent = S.settings.provider === "yerel" ? "Yerel" : S.hasKey ? "Hazır" : "Kapalı";

    const side = $("sideInfo");
    side.replaceChildren(
      el(
        "div",
        { class: "ax-mini__in" },
        el("span", { class: "pl-muted" }, "Gerekçe İzlenebilirliği"),
        el("b", { class: ev.fullyTraceable ? "is-ok" : "is-bad" }, `%${ev.traceabilityRate} (${ev.backedCells}/${ev.totalCells})`),
        el("span", { class: "pl-muted" }, ev.leader ? `Lider: ${ev.leader.optionName}` : "Henüz seçenek yok")
      )
    );

    renderMatrixView();
    renderAnalysisView();
    renderLogView();
  }

  // Olaylar
  document.querySelectorAll("[data-nav]").forEach((b) => {
    b.addEventListener("click", () => switchNav(b.dataset.nav));
  });

  document.querySelectorAll('[data-act="sample"]').forEach((b) => {
    b.addEventListener("click", () =>
      run(async () => {
        S = await D.board.loadSample();
        selectedCellKey = null;
        switchNav("matrix");
        toast("Örnek karar panosu yüklendi (3 seçenek × 4 kriter, %100 izlenebilir).");
      })
    );
  });

  $("boardTitleInput").addEventListener("change", (e) =>
    run(async () => {
      S = await D.board.updateMeta({ title: e.target.value });
      render();
    })
  );
  $("boardDomainSel").addEventListener("change", (e) =>
    run(async () => {
      S = await D.board.updateMeta({ domain: e.target.value });
      render();
    })
  );

  const openOptDlg = () => {
    $("newOptName").value = "";
    $("newOptSummary").value = "";
    $("optDialog").showModal();
  };
  $("addOptBtn").addEventListener("click", openOptDlg);
  $("startAddOptBtn").addEventListener("click", openOptDlg);
  $("optCancel").addEventListener("click", () => $("optDialog").close());
  $("optSave").addEventListener("click", () =>
    run(async () => {
      S = await D.board.addOption({
        name: $("newOptName").value,
        summary: $("newOptSummary").value,
        defaultEvidence: $("newOptEv").value,
        defaultSource: $("newOptSrc").value,
      });
      $("optDialog").close();
      render();
      toast("Yeni seçenek matrise eklendi.");
    })
  );

  $("addCritBtn").addEventListener("click", () => {
    $("newCritName").value = "";
    $("newCritWeight").value = "7";
    $("critDialog").showModal();
  });
  $("critCancel").addEventListener("click", () => $("critDialog").close());
  $("critSave").addEventListener("click", () =>
    run(async () => {
      S = await D.board.addCriterion({
        name: $("newCritName").value,
        weight: Number($("newCritWeight").value),
        defaultEvidence: $("newCritEv").value,
        defaultSource: $("newCritSrc").value,
      });
      $("critDialog").close();
      render();
      toast("Yeni kriter matrise eklendi.");
    })
  );

  $("runAiBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.ai.analyze();
      if (!r.approved) {
        toast("MyMind incelemesi gönderilmedi.");
        return;
      }
      S = r.state;
      render();
      toast(`MyMind incelemesi tamamlandı (${r.ai.missingCriteria.length} eksik kriter önerisi, ${r.ai.droppedPreferences} model dayatması engellendi).`);
    })
  );

  $("recordDecBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.board.recordDecision({
        selectedOptionId: $("decOptionSel").value,
        rationale: $("decRationale").value,
      });
      S = r.state;
      render();
      toast(`Karar günlüğüne kaydedildi: ${r.entry.chosenOptionName}`, "success");
    })
  );

  $("mdBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.exportMd();
      if (r.cancelled) return;
      S = r.state;
      toast(`“${r.file}” kaydedildi.`);
    })
  );
  $("csvBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.exportCsv();
      if (r.cancelled) return;
      S = r.state;
      toast(`“${r.file}” kaydedildi.`);
    })
  );
  $("backupBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.backup();
      if (r.cancelled) return;
      toast(`“${r.file}” kaydedildi.`);
    })
  );

  document.querySelectorAll('input[name="provider"]').forEach((r) => {
    r.addEventListener("change", () => {
      if (r.checked) {
        run(async () => {
          S = await D.setSettings({ provider: r.value });
          render();
        });
      }
    });
  });
  $("saveLocal").addEventListener("click", () =>
    run(async () => {
      S = await D.setSettings({
        provider: "yerel",
        localUrl: $("localUrl").value.trim(),
        localModel: $("localModel").value.trim(),
      });
      render();
      toast("Yerel model ayarı kaydedildi.");
    })
  );

  $("openMymind").addEventListener("click", () => {
    $("mymindKey").value = "";
    $("mymindInfo").textContent = S && S.hasKey ? "Kayıtlı anahtar var (DPAPI şifreli)." : "Henüz anahtar kaydedilmedi.";
    $("mymindDialog").showModal();
  });
  $("mymindCancel").addEventListener("click", () => $("mymindDialog").close());
  $("mymindSave").addEventListener("click", () =>
    run(async () => {
      await D.ai.setKey($("mymindKey").value);
      S = await D.state();
      $("mymindDialog").close();
      render();
      toast("MyMind anahtarı kaydedildi.");
    })
  );
  $("mymindForget").addEventListener("click", () =>
    run(async () => {
      await D.ai.setKey(null);
      S = await D.state();
      $("mymindDialog").close();
      render();
      toast("MyMind anahtarı kaldırıldı.");
    })
  );

  D.onState((next) => {
    S = next;
    render();
  });

  D.state().then((initial) => {
    S = initial;
    render();
    document.documentElement.dataset.ready = "1";
  });
})();
