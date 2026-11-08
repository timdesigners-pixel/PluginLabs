/* Invoice Inbox (PL-049) — arayüz mantığı (yalnız güvenli DOM, innerHTML kullanılmaz). */
(function () {
  "use strict";
  const D = window.invDesktop;
  const C = window.InvoiceCore;
  const $ = (id) => document.getElementById(id);

  let S = null;
  let currentNav = "review";
  let docFilter = "onayli";
  let searchQuery = "";

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
    $("view-review").hidden = nav !== "review";
    $("view-approved").hidden = nav !== "approved";
    $("view-settings").hidden = nav !== "settings";
    render();
  }

  function renderDocItem(d, activeId, onSelect) {
    const c = d.consistency || C.checkConsistency(d);
    const isSel = d.id === activeId;
    const badges = [];
    badges.push(el("span", { class: "pl-badge" }, C.TEMPLATE_LABELS[d.template] || d.template));
    if (d.status === "inceleme") {
      if (c.needsReview) {
        badges.push(el("span", { class: "pl-badge pl-badge--warning" }, "Zorunlu inceleme"));
      } else {
        badges.push(el("span", { class: "pl-badge pl-badge--success" }, "Toplam doğrulandı"));
      }
    } else if (d.status === "onayli") {
      badges.push(el("span", { class: "pl-badge pl-badge--success" }, d.mismatchConfirmed ? "İstisna onaylı" : "Onaylı"));
    } else {
      badges.push(el("span", { class: "pl-badge" }, "Reddedildi"));
    }
    if (d.redactedCount > 0) {
      badges.push(el("span", { class: "pl-badge" }, `${d.redactedCount} kimlik kırpıldı`));
    }

    return el(
      "li",
      {
        class: `ax-item${isSel ? " is-sel" : ""}${c.needsReview && d.status === "inceleme" ? " is-warn" : ""}`,
        dataset: { id: d.id },
        onclick: () => onSelect(d.id),
      },
      el(
        "div",
        { class: "ax-ititle" },
        el("span", {}, d.vendor || d.sourceTitle || "Belirsiz Satıcı"),
        el("span", { class: "ax-num" }, `${d.grandTotal.toFixed(2)} ${d.currency}`)
      ),
      el("div", { class: "ax-small pl-muted" }, `${d.invoiceNo || "Fatura No Yok"} · Düzenleme: ${d.issueDate || "?"} · Son ödeme: ${d.dueDate || "Belirsiz"}`),
      el("div", { class: "ax-imeta" }, ...badges)
    );
  }

  function renderDetail(container, d) {
    container.replaceChildren();
    if (!d) {
      container.appendChild(el("p", { class: "ax-empty" }, "Ayrıntısını görmek için listeden bir fatura veya fiş seçin."));
      return;
    }
    const c = d.consistency || C.checkConsistency(d);

    const statusBanner = el(
      "div",
      { class: `ax-block ${c.deterministicOk && !c.needsReview ? "ax-block--ok" : "ax-block--warn"}`, id: "consistencyBox" },
      el(
        "div",
        { class: "ax-bar" },
        el("b", {}, c.deterministicOk ? "Deterministik Toplam Kontrolü: DOĞRULANDI" : "Deterministik Toplam Kontrolü: UYARI — ZORUNLU İNCELEME"),
        el("span", { class: "ax-grow" }),
        el("span", { class: "pl-badge" }, `Ara Toplam + KDV = ${c.computedGrand.toFixed(2)} ${d.currency}`)
      ),
      c.reasons.length
        ? el("ul", { class: "ax-ul" }, ...c.reasons.map((r) => el("li", {}, r)))
        : el("p", { class: "ax-small pl-muted" }, "Kalem toplamları, KDV ve ödenecek genel toplam birebir tutarlıdır.")
    );

    const vendorInput = el("input", { class: "pl-input", id: "fVendor", value: d.vendor, placeholder: "Satıcı / İşletme Unvanı" });
    const noInput = el("input", { class: "pl-input", id: "fNo", value: d.invoiceNo, placeholder: "GIB2026... / FIS..." });
    const issueInput = el("input", { class: "pl-input", id: "fIssue", value: d.issueDate, placeholder: "YYYY-AA-GG" });
    const dueInput = el("input", { class: "pl-input", id: "fDue", value: d.dueDate, placeholder: "YYYY-AA-GG" });
    const subInput = el("input", { class: "pl-input", id: "fSub", value: d.subtotal.toFixed(2) });
    const taxInput = el("input", { class: "pl-input", id: "fTax", value: d.taxTotal.toFixed(2) });
    const grandInput = el("input", { class: "pl-input", id: "fGrand", value: d.grandTotal.toFixed(2) });
    const noteInput = el("input", { class: "pl-input", id: "fNote", value: d.reviewNote, placeholder: "İnceleme / muhasebe notu (uyumsuzluk istisnası için zorunlu)" });
    const confirmMismatchChk = el("input", { type: "checkbox", id: "fConfirmMismatch", checked: d.mismatchConfirmed });

    const collectPatch = () => ({
      vendor: vendorInput.value,
      invoiceNo: noInput.value,
      issueDate: issueInput.value,
      dueDate: dueInput.value,
      subtotal: subInput.value,
      taxTotal: taxInput.value,
      grandTotal: grandInput.value,
      reviewNote: noteInput.value,
      confirmMismatch: confirmMismatchChk.checked,
    });

    const fieldsBlock = el(
      "div",
      { class: "ax-block" },
      el("div", { class: "ax-lbl" }, `Çıkarılan Fatura / Fiş Alanları (${C.TEMPLATE_LABELS[d.template] || d.template})`),
      el(
        "div",
        { class: "ax-fields" },
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fVendor" }, "Satıcı Unvanı"), vendorInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fNo" }, "Fatura / Fiş No"), noInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fIssue" }, "Düzenleme Tarihi (YYYY-AA-GG)"), issueInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fDue" }, "Son Ödeme Tarihi (YYYY-AA-GG)"), dueInput)
      ),
      el(
        "div",
        { class: "ax-fields ax-fields--3" },
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fSub" }, `Ara Toplam (${d.currency})`), subInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fTax" }, `KDV / Vergi (${d.currency})`), taxInput),
        el("div", { class: "pl-field" }, el("label", { class: "pl-field__label", for: "fGrand" }, `Genel Toplam (${d.currency})`), grandInput)
      ),
      el(
        "div",
        { class: "pl-field ax-fields__wide" },
        el("label", { class: "pl-field__label", for: "fNote" }, "İnceleme Notu"),
        noteInput
      ),
      c.needsReview && d.status === "inceleme"
        ? el(
            "label",
            { class: "ax-check" },
            confirmMismatchChk,
            el("span", {}, "Tutarsızlığı / eksik alanı inceledim, açıklamamı nota yazdım ve istisna olarak onaylıyorum.")
          )
        : null,
      el(
        "div",
        { class: "ax-bar" },
        d.status === "inceleme"
          ? [
              el(
                "button",
                {
                  class: "pl-btn pl-btn--primary pl-btn--sm",
                  id: "approveBtn",
                  type: "button",
                  onclick: () =>
                    run(async () => {
                      S = await D.doc.approve(d.id, collectPatch());
                      render();
                      toast("Belge insan onayıyla kaydedildi (CSV aktarımına hazır).", "success");
                    }),
                },
                "Onayla ve CSV Listesine Ekle"
              ),
              el(
                "button",
                {
                  class: "pl-btn pl-btn--secondary pl-btn--sm",
                  id: "saveDraftBtn",
                  type: "button",
                  onclick: () =>
                    run(async () => {
                      S = await D.doc.update(d.id, collectPatch());
                      render();
                      toast("Taslak alanları güncellendi ve tutarlılık yeniden hesaplandı.");
                    }),
                },
                "Taslağı Güncelle"
              ),
              el(
                "button",
                {
                  class: "pl-btn pl-btn--ghost pl-btn--sm",
                  id: "rejectBtn",
                  type: "button",
                  onclick: () =>
                    run(async () => {
                      S = await D.doc.reject(d.id);
                      render();
                      toast("Belge reddedildi.");
                    }),
                },
                "Reddet"
              ),
            ]
          : [
              el(
                "button",
                {
                  class: "pl-btn pl-btn--secondary pl-btn--sm",
                  id: "toReviewBtn",
                  type: "button",
                  onclick: () =>
                    run(async () => {
                      S = await D.doc.toReview(d.id);
                      render();
                      toast("Belge inceleme kuyruğuna geri alındı.");
                    }),
                },
                "İnceleme Kuyruğuna Geri Al"
              ),
            ],
        el("span", { class: "ax-grow" }),
        el(
          "button",
          {
            class: "pl-btn pl-btn--ghost pl-btn--sm",
            id: "aiBtn",
            type: "button",
            onclick: () =>
              run(async () => {
                const r = await D.ai.extract(d.id);
                if (!r.approved) {
                  toast("MyMind isteği gönderilmedi.");
                  return;
                }
                S = r.state;
                render();
                toast("MyMind alan önerisi hazır (deterministik kontrolden geçirildi).");
              }),
          },
          "MyMind ile Alan Çıkar"
        )
      )
    );

    const itemsBlock = el(
      "div",
      { class: "ax-block" },
      el("div", { class: "ax-lbl" }, `Kalemler (${d.items.length} satır · Toplam: ${c.itemsSum.toFixed(2)} ${d.currency})`),
      d.items.length
        ? el(
            "table",
            { class: "ax-table" },
            el(
              "thead",
              {},
              el("tr", {}, el("th", {}, "Kalem"), el("th", { class: "ax-num" }, "Miktar"), el("th", { class: "ax-num" }, "Birim Fiyat"), el("th", { class: "ax-num" }, "KDV %"), el("th", { class: "ax-num" }, "Tutar"))
            ),
            el(
              "tbody",
              {},
              ...d.items.map((it) =>
                el(
                  "tr",
                  {},
                  el("td", {}, it.name),
                  el("td", { class: "ax-num" }, String(it.qty)),
                  el("td", { class: "ax-num" }, it.unitPrice.toFixed(2)),
                  el("td", { class: "ax-num" }, `%${it.taxRate}`),
                  el("td", { class: "ax-num" }, it.lineTotal.toFixed(2))
                )
              )
            )
          )
        : el("p", { class: "ax-small pl-muted" }, "Kalem satırı ayrıştırılmadı; yalnız belge dip toplamları kullanılıyor.")
    );

    let aiBlock = null;
    if (d.ai) {
      aiBlock = el(
        "div",
        { class: "ax-block ax-block--ai", id: "aiBox" },
        el("div", { class: "ax-lbl" }, "MyMind Alan Çıkarım Önerisi (Deterministik Kontrol Sonucu)"),
        el(
          "p",
          { class: "ax-small" },
          `Satıcı: ${d.ai.vendor} · Fatura No: ${d.ai.invoiceNo} · Düzenleme: ${d.ai.issueDate} · Son Ödeme: ${d.ai.dueDate || "Yok"} · Ara Toplam: ${Number(d.ai.subtotal).toFixed(2)} · KDV: ${Number(d.ai.taxTotal).toFixed(2)} · Genel Toplam: ${Number(d.ai.grandTotal).toFixed(2)}`
        ),
        el(
          "p",
          { class: "ax-small pl-muted" },
          d.ai.deterministicOk
            ? "Deterministik kontrol: Ara Toplam + KDV = Genel Toplam doğrulandı."
            : `Deterministik uyarı: ${d.ai.reasons.join("; ")}`
        ),
        el(
          "div",
          { class: "ax-bar" },
          el(
            "button",
            {
              class: "pl-btn pl-btn--secondary pl-btn--sm",
              id: "aiApplyBtn",
              type: "button",
              onclick: () =>
                run(async () => {
                  S = await D.ai.apply(d.id);
                  render();
                  toast("MyMind önerisi taslak alanlarına uygulandı.");
                }),
            },
            "Öneriyi Taslağa Uygula"
          )
        )
      );
    }

    const rawBlock = el(
      "div",
      { class: "ax-block" },
      el("div", { class: "ax-lbl" }, `Belge Metni (${d.sourceTitle} · ${d.redactedCount} kimlik verisi kırpıldı)`),
      el("pre", { class: "ax-quote", id: "rawPreview" }, d.rawText)
    );

    container.append(statusBanner, fieldsBlock, itemsBlock);
    if (aiBlock) container.appendChild(aiBlock);
    container.appendChild(rawBlock);
  }

  function render() {
    if (!S) return;
    const m = S.metrics;
    $("reviewCount").textContent = String(m.review);
    $("approvedCount").textContent = String(m.approved);
    $("privacyHint").textContent = `TCKN/IBAN/Kart kırpma: ${S.settings.redactIdentity ? "Açık" : "Kapalı"} · Otomatik beyanname yok`;
    $("mymindState").textContent = S.settings.provider === "yerel" ? "Yerel" : S.hasKey ? "Hazır" : "Kapalı";

    // Yan bilgi
    const side = $("sideInfo");
    side.replaceChildren(
      el(
        "div",
        { class: "ax-mini__in" },
        el("span", { class: "pl-muted" }, "Onaylı Toplam (TRY)"),
        el("b", { class: "is-ok" }, `${m.approvedSumTry.toFixed(2)} TL`),
        el("span", { class: "pl-muted" }, `${m.mandatoryReview} zorunlu inceleme · ${m.redactedTotal} kırpılan kimlik`)
      )
    );

    // İnceleme görünümü
    const reviewDocs = S.docs.filter((d) => d.status === "inceleme");
    $("emptyPanel").hidden = S.docs.length > 0;
    $("reviewSplit").hidden = S.docs.length === 0;
    $("reviewInfo").textContent = `${reviewDocs.length} belge incelemede (${m.mandatoryReview} zorunlu inceleme)`;

    const rList = $("reviewList");
    rList.replaceChildren();
    let activeReview = reviewDocs.find((d) => d.id === S.active) || reviewDocs[0] || null;
    if (!reviewDocs.length) {
      rList.appendChild(el("li", { class: "ax-empty" }, "İnceleme kuyruğunda belge yok."));
    } else {
      for (const d of reviewDocs) {
        rList.appendChild(
          renderDocItem(d, activeReview ? activeReview.id : null, (id) =>
            run(async () => {
              S = await D.doc.open(id);
              render();
            })
          )
        );
      }
    }
    renderDetail($("reviewDetail"), activeReview);

    // Onaylı / Reddedilen görünümü
    document.querySelectorAll("[data-df]").forEach((b) => {
      b.setAttribute("aria-checked", b.dataset.df === docFilter ? "true" : "false");
    });
    const qLower = searchQuery.toLowerCase();
    const filteredDocs = S.docs.filter(
      (d) =>
        d.status === docFilter &&
        (!qLower ||
          (d.vendor && d.vendor.toLowerCase().includes(qLower)) ||
          (d.invoiceNo && d.invoiceNo.toLowerCase().includes(qLower)) ||
          (d.sourceTitle && d.sourceTitle.toLowerCase().includes(qLower)))
    );
    const aList = $("approvedList");
    aList.replaceChildren();
    let activeApproved = filteredDocs.find((d) => d.id === S.active) || filteredDocs[0] || null;
    if (!filteredDocs.length) {
      aList.appendChild(el("li", { class: "ax-empty" }, "Bu süzgeçte belge yok."));
    } else {
      for (const d of filteredDocs) {
        aList.appendChild(
          renderDocItem(d, activeApproved ? activeApproved.id : null, (id) =>
            run(async () => {
              S = await D.doc.open(id);
              render();
            })
          )
        );
      }
    }
    renderDetail($("approvedDetail"), activeApproved);

    // Ölçüler ve Ayarlar
    const met = $("metrics");
    met.replaceChildren(
      el("div", {}, el("b", { class: "is-ok" }, String(m.approved)), el("span", {}, "İnsan onaylı belge (CSV'ye hazır)")),
      el("div", {}, el("b", { class: m.mandatoryReview ? "is-bad" : "is-ok" }, String(m.mandatoryReview)), el("span", {}, "Zorunlu inceleme bekleyen")),
      el("div", {}, el("b", { class: "is-ok" }, String(m.deterministicOkCount)), el("span", {}, "Deterministik toplamı doğrulanan")),
      el("div", {}, el("b", {}, String(m.redactedTotal)), el("span", {}, "Kırpılan kimlik/ödeme verisi (TCKN/IBAN/Kart)"))
    );

    if (S.gold) {
      $("goldInfo").textContent = `Altın örnek doğrulaması (${S.gold.evaluated} belge): toplam/KDV doğruluğu %${S.gold.totalAccuracy} (hedef ≥%98) · tarih doğruluğu %${S.gold.dateAccuracy} (hedef ≥%98) · yakalanan toplam uyumsuzluğu ${S.gold.mismatchCaught}/${S.gold.mismatchExpected}.`;
    } else {
      $("goldInfo").textContent = "Altın örnek doğrulaması için 'Örnek fatura ve fişler' düğmesine basın.";
    }

    $("setRedact").checked = Boolean(S.settings.redactIdentity);
    document.querySelectorAll('input[name="provider"]').forEach((r) => {
      r.checked = r.value === S.settings.provider;
    });
    $("localUrl").value = S.settings.localUrl || "http://127.0.0.1:1234";
    $("localModel").value = S.settings.localModel || "local-model";
    $("vaultInfo").textContent = S.vault
      ? "Yerel depolama: Finansal belgeler ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanıyor."
      : "Yerel depolama: Bu ortamda sistem kasası yok; belgeler yerel klasörde saklanıyor.";
  }

  // Olay bağlamaları
  document.querySelectorAll("[data-nav]").forEach((b) => {
    b.addEventListener("click", () => switchNav(b.dataset.nav));
  });
  document.querySelectorAll("[data-df]").forEach((b) => {
    b.addEventListener("click", () => {
      docFilter = b.dataset.df;
      render();
    });
  });
  $("q").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    render();
  });

  document.querySelectorAll('[data-act="ingest"]').forEach((b) => {
    b.addEventListener("click", () => {
      $("ingestTitle").value = "";
      $("ingestText").value = "";
      $("ingestDialog").showModal();
    });
  });
  $("ingestCancel").addEventListener("click", () => $("ingestDialog").close());
  $("ingestRun").addEventListener("click", () =>
    run(async () => {
      const r = await D.ingest.text($("ingestText").value, $("ingestTitle").value);
      $("ingestDialog").close();
      S = r.state;
      switchNav("review");
      toast(r.needsReview ? "Belge eklendi · Zorunlu inceleme uyarısı var." : "Belge eklendi · Toplam tutarlılığı doğrulandı.");
    })
  );

  document.querySelectorAll('[data-act="clipboard"]').forEach((b) => {
    b.addEventListener("click", () =>
      run(async () => {
        const r = await D.ingest.clipboard();
        S = r.state;
        switchNav("review");
        toast("Panodaki belge inceleme kuyruğuna eklendi.");
      })
    );
  });

  document.querySelectorAll('[data-act="files"]').forEach((b) => {
    b.addEventListener("click", () =>
      run(async () => {
        const r = await D.ingest.files();
        if (r.cancelled) return;
        S = r.state;
        switchNav("review");
        toast(`${r.added} belge dosyadan eklendi${r.skipped ? ` · ${r.skipped} dosya atlandı` : ""}.`);
      })
    );
  });

  document.querySelectorAll('[data-act="sample"]').forEach((b) => {
    b.addEventListener("click", () =>
      run(async () => {
        const r = await D.ingest.sample();
        S = r.state;
        switchNav("review");
        toast(`${r.added} örnek fatura/fiş inceleme kuyruğuna eklendi.`);
      })
    );
  });

  $("setRedact").addEventListener("change", (e) =>
    run(async () => {
      S = await D.setSettings({ redactIdentity: e.target.checked });
      render();
      toast(S.settings.redactIdentity ? "Kimlik verisi kırpma açıldı." : "Kimlik verisi kırpma kapatıldı.");
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

  const doCsvExport = () =>
    run(async () => {
      const r = await D.exportCsv();
      if (r.cancelled) return;
      S = r.state;
      render();
      toast(`“${r.file}” kaydedildi (${r.count} onaylı belge).`);
    });
  $("csvBtn").addEventListener("click", doCsvExport);
  $("topExportCsv").addEventListener("click", doCsvExport);

  $("mdBtn").addEventListener("click", () =>
    run(async () => {
      const r = await D.exportMd();
      if (r.cancelled) return;
      S = r.state;
      render();
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
