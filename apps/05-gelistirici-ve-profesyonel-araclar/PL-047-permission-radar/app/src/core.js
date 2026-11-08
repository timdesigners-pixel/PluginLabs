/* Permission Radar — çekirdek (tarayıcı + Node UMD).
 * Notion kartı (PL-047):
 *  • MVP ve temel akış: İzin verildiğinde eklenti izinlerini okunabilir kartlara dönüştür; değişim geçmişi ve Chrome’un yönetim ekranına yönlendirme.
 *  • Yapay zekânın rolü: İzinlerin ne anlama geldiğini açıklar; zararlı yazılım tespiti yaptığı iddiası taşımaz.
 *  • Teknik bağımlılık ve sınırlar: Chrome management API kapsamı ve kullanıcı izni önce teknik pilotla doğrulanır; diğer eklentilerin iç verisine eriştiği varsayılmaz.
 *  • Doğrulama ölçütü: Test eklentilerinde izin açıklamasının doğruluğu; bilinmeyen kapsamın açık etiketlenmesi. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PRCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CHROME_EXTENSIONS_URL = "chrome://extensions";
  const MALWARE_DISCLAIMER = "Permission Radar yalnızca bildirimdeki (manifest) izin kapsamlarını okunabilir biçimde açıklar; zararlı yazılım tespiti yaptığı iddiası taşımaz ve diğer eklentilerin iç çalışma verisine erişmez.";

  const PERMISSION_DICTIONARY = {
    activeTab: {
      title: "Etkin sekme erişimi (Kullanıcı tıkladığında)",
      category: "sekme",
      level: "orta",
      meaning: "Yalnızca siz eklenti simgesine veya kısayoluna bastığınızda o an açık olan sekmenin adresine ve içeriğine geçici erişim sağlar.",
    },
    tabs: {
      title: "Sekme adresleri ve başlıkları",
      category: "sekme",
      level: "yuksek",
      meaning: "Açık olan tüm tarayıcı sekmelerinin web adreslerini (URL) ve sayfa başlıklarını okuyabilir, yeni sekme açabilir veya kapatabilir.",
    },
    storage: {
      title: "Yerel eklenti depolaması",
      category: "veri",
      level: "dusuk",
      meaning: "Eklentinin kendi ayarlarını ve verilerini tarayıcı içinde saklamasına izin verir.",
    },
    cookies: {
      title: "Tarayıcı çerezleri (Cookies)",
      category: "oturum",
      level: "kritik",
      meaning: "İzin verilen sitelerdeki oturum ve kimlik çerezlerini okuyabilir veya değiştirebilir.",
    },
    webRequest: {
      title: "Ağ isteklerini gözlemleme",
      category: "ag",
      level: "yuksek",
      meaning: "Tarayıcının yaptığı HTTP/HTTPS ağ trafiği başlıklarını ve adreslerini gerçek zamanlı izleyebilir.",
    },
    declarativeNetRequest: {
      title: "Kural tabanlı ağ filtreleme",
      category: "ag",
      level: "orta",
      meaning: "İçeriklerini okumadan belirli ağ isteklerini kurallarla engelleyebilir veya yönlendirebilir.",
    },
    scripting: {
      title: "Sayfalarda betik (kod) çalıştırma",
      category: "icerik",
      level: "yuksek",
      meaning: "Erişim izni olan web sayfalarına JavaScript veya CSS kodu yerleştirebilir ve çalıştırabilir.",
    },
    clipboardRead: {
      title: "Panoyu (kopyalanan metni) okuma",
      category: "sistem",
      level: "yuksek",
      meaning: "Kopyaladığınız metin veya görselleri panodan okuyabilir.",
    },
    clipboardWrite: {
      title: "Panoya yazma",
      category: "sistem",
      level: "dusuk",
      meaning: "Panonuza metin veya veri kopyalayabilir.",
    },
    history: {
      title: "Gezinme geçmişi",
      category: "gizlilik",
      level: "kritik",
      meaning: "Ziyaret ettiğiniz sayfaların geçmişini okuyabilir, silebilir veya değiştirebilir.",
    },
    bookmarks: {
      title: "Yer imleri",
      category: "veri",
      level: "orta",
      meaning: "Tarayıcı yer imlerinizi okuyabilir ve düzenleyebilir.",
    },
    downloads: {
      title: "İndirilen dosyalar",
      category: "sistem",
      level: "orta",
      meaning: "İndirme başlatabilir ve indirilen dosyaların listesini görebilir.",
    },
    notifications: {
      title: "Masaüstü bildirimleri",
      category: "arayuz",
      level: "dusuk",
      meaning: "Sistem tepsisinde bildirim kutusu gösterebilir.",
    },
    contextMenus: {
      title: "Sağ tık menüsü",
      category: "arayuz",
      level: "dusuk",
      meaning: "Tarayıcı sağ tık menüsüne yeni seçenek ekleyebilir.",
    },
    alarms: {
      title: "Zamanlayıcı ve periyodik görevler",
      category: "sistem",
      level: "dusuk",
      meaning: "Arka planda belirli aralıklarla uyanıp görev çalıştırabilir.",
    },
    management: {
      title: "Kurulu eklenti listesi yönetimi",
      category: "sistem",
      level: "yuksek",
      meaning: "Kurulu diğer eklentilerin adlarını, sürümlerini ve bildirdikleri izinleri görebilir, etkinleştirebilir veya devre dışı bırakabilir (diğer eklentilerin iç verisine erişemez).",
    },
  };

  const str = (v, max = 2000) => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));

  function isLoopbackUrl(u) {
    try {
      const x = new URL(String(u));
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch { return false; }
  }

  function explainHostPattern(pattern) {
    const p = str(pattern, 300).trim();
    if (p === "<all_urls>" || p === "*://*/*" || p === "http://*/*" || p === "https://*/*") {
      return {
        raw: p,
        kind: "host",
        known: true,
        unknownScopeLabeled: false,
        title: `Tüm web sitelerine erişim (${p})`,
        category: "alan_adi",
        level: "kritik",
        meaning: "Ziyaret ettiğiniz tüm web sitelerindeki sayfa verilerini okuyabilir ve değiştirebilir.",
      };
    }
    if (/^(https?|wss?|\*):\/\//i.test(p)) {
      const host = p.replace(/^(https?|wss?|\*):\/\//i, "").split("/")[0];
      const wildcard = host.startsWith("*.");
      return {
        raw: p,
        kind: "host",
        known: true,
        unknownScopeLabeled: false,
        title: wildcard ? `Belirli alan adı ve alt alanları (${host})` : `Belirli site erişimi (${host})`,
        category: "alan_adi",
        level: "orta",
        meaning: `Yalnızca ${p} adres kalıbıyla eşleşen sayfalardaki verilere erişebilir.`,
      };
    }
    return {
      raw: p,
      kind: "host",
      known: false,
      unknownScopeLabeled: true,
      title: `Bilinmeyen alan adı kapsamı (${p})`,
      category: "bilinmeyen",
      level: "uyari",
      meaning: "Bilinmeyen kapsam: Bu adres kalıbı standart URL şemasıyla eşleşmiyor; Chrome yönetim ekranından kontrol edin.",
    };
  }

  function explainPermission(perm, kind = "permission") {
    const raw = str(perm, 200).trim();
    if (kind === "host" || raw === "<all_urls>" || raw.includes("://")) {
      return explainHostPattern(raw);
    }
    const entry = PERMISSION_DICTIONARY[raw];
    if (entry) {
      return {
        raw,
        kind,
        known: true,
        unknownScopeLabeled: false,
        title: entry.title,
        category: entry.category,
        level: entry.level,
        meaning: entry.meaning + (kind === "optional" ? " (İsteğe bağlı izin: yalnız çalışma anında onay verirseniz etkinleşir.)" : ""),
      };
    }
    return {
      raw,
      kind,
      known: false,
      unknownScopeLabeled: true,
      title: `Bilinmeyen kapsam: ${raw}`,
      category: "bilinmeyen",
      level: "uyari",
      meaning: `Bilinmeyen kapsam (${raw}): Standart Chrome izin sözlüğünde yer almıyor veya deneysel/özel bir API kapsamıdır.`,
    };
  }

  function parseManifestToCard(manifestObj, meta = {}) {
    if (!manifestObj || typeof manifestObj !== "object") throw new Error("Geçerli bir manifest.json nesnesi gerekli.");
    const name = str(manifestObj.name || meta.name || "Adsız Eklenti", 140).trim();
    const version = str(manifestObj.version || meta.version || "0.1.0", 40).trim();
    const manifestVersion = Number(manifestObj.manifest_version) || 3;
    const extId = str(meta.id || manifestObj.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), 80);

    const perms = Array.isArray(manifestObj.permissions) ? manifestObj.permissions.map(String) : [];
    const optPerms = Array.isArray(manifestObj.optional_permissions) ? manifestObj.optional_permissions.map(String) : [];
    const hostPerms = Array.isArray(manifestObj.host_permissions) ? manifestObj.host_permissions.map(String) : [];
    const csHosts = [];
    if (Array.isArray(manifestObj.content_scripts)) {
      for (const cs of manifestObj.content_scripts) {
        if (cs && Array.isArray(cs.matches)) {
          for (const m of cs.matches) if (!hostPerms.includes(String(m)) && !csHosts.includes(String(m))) csHosts.push(String(m));
        }
      }
    }

    const allHost = [...hostPerms, ...csHosts];
    const cards = [
      ...perms.map((p) => explainPermission(p, "permission")),
      ...optPerms.map((p) => explainPermission(p, "optional")),
      ...allHost.map((h) => explainPermission(h, "host")),
    ];

    const unknownCount = cards.filter((c) => !c.known && c.unknownScopeLabeled).length;
    const criticalCount = cards.filter((c) => c.level === "kritik").length;
    const highCount = cards.filter((c) => c.level === "yuksek").length;

    return {
      id: extId,
      name,
      version,
      manifestVersion,
      description: str(manifestObj.description || "", 400),
      permissions: perms,
      optionalPermissions: optPerms,
      hostPermissions: allHost,
      cards,
      unknownCount,
      criticalCount,
      highCount,
      internalDataAccessed: false,
      malwareClaim: false,
      disclaimer: MALWARE_DISCLAIMER,
      chromeManageUrl: `${CHROME_EXTENSIONS_URL}/?id=${extId}`,
      inspectedAt: str(meta.inspectedAt || new Date().toISOString(), 40),
      history: Array.isArray(meta.history) ? meta.history : [],
      aiExplanation: null,
    };
  }

  function computePermissionDiff(prevCard, nextCard) {
    if (!prevCard || !nextCard) return null;
    const prevSet = new Set(prevCard.cards.map((c) => `${c.kind}:${c.raw}`));
    const nextSet = new Set(nextCard.cards.map((c) => `${c.kind}:${c.raw}`));
    const added = nextCard.cards.filter((c) => !prevSet.has(`${c.kind}:${c.raw}`));
    const removed = prevCard.cards.filter((c) => !nextSet.has(`${c.kind}:${c.raw}`));
    return {
      fromVersion: prevCard.version,
      toVersion: nextCard.version,
      changedAt: nextCard.inspectedAt,
      added: added.map((c) => ({ raw: c.raw, kind: c.kind, title: c.title, level: c.level, unknownScopeLabeled: c.unknownScopeLabeled })),
      removed: removed.map((c) => ({ raw: c.raw, kind: c.kind, title: c.title, level: c.level })),
      summary: added.length || removed.length
        ? `${prevCard.version} → ${nextCard.version}: +${added.length} yeni izin eklendi, -${removed.length} izin kaldırıldı.`
        : `${prevCard.version} → ${nextCard.version}: izin kapsamı değişmedi.`,
    };
  }

  function upsertExtensionManifest(existingList, manifestObj, meta = {}) {
    const list = Array.isArray(existingList) ? [...existingList] : [];
    const nextCard = parseManifestToCard(manifestObj, meta);
    const idx = list.findIndex((x) => x.id === nextCard.id);
    if (idx >= 0) {
      const prev = list[idx];
      const diff = computePermissionDiff(prev, nextCard);
      nextCard.history = [...(prev.history || []), ...(diff ? [diff] : [])];
      list[idx] = nextCard;
      return { item: nextCard, isUpdate: true, diff, list };
    }
    list.unshift(nextCard);
    return { item: nextCard, isUpdate: false, diff: null, list };
  }

  function aiPayload(extItem) {
    const permissionsSummary = extItem.cards.map((c) => ({
      kod: c.raw,
      tur: c.kind,
      bilinenMi: c.known,
      seviye: c.level,
      varsayilanAciklama: c.meaning,
    }));
    const sys = "Sen Permission Radar izin açıklayıcısısın. Verilen tarayıcı eklentisi izinlerinin kullanıcı için ne anlama geldiğini sade Türkçeyle JSON olarak açıkla: {\"ozet\": \"...\", \"maddeler\": [\"...\"]}. Zararlı yazılım veya virüs tespiti yaptığı iddiasında bulunma; bilinmeyen kapsamları açıkça belirt.";
    const usr = JSON.stringify({
      eklentiAdi: extItem.name,
      surum: extItem.version,
      izinler: permissionsSummary,
    });
    return {
      extId: extItem.id,
      sent: { chars: usr.length, permissionCount: permissionsSummary.length },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    };
  }

  function validateAiExplanation(rawText, extItem) {
    let parsed = null;
    try {
      const m = String(rawText || "").match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch { parsed = null; }

    let summary = parsed && typeof parsed.ozet === "string" ? str(parsed.ozet.trim(), 600) : "";
    const rawBullets = parsed && Array.isArray(parsed.maddeler) ? parsed.maddeler.map((x) => str(x, 300).trim()).filter(Boolean) : [];

    let droppedMalwareClaims = 0;
    const forbiddenRe = /\b(virüs|trojan|zararlı yazılım tespit edildi|kesinlikle zararlı|malware detected|güvenli olduğu garanti)\b/i;
    if (forbiddenRe.test(summary)) {
      droppedMalwareClaims++;
      summary = "Bu eklentinin istediği izinler aşağıda açıklanmıştır (zararlı yazılım tespiti iddiası taşınmaz).";
    }
    const cleanBullets = [];
    for (const b of rawBullets) {
      if (forbiddenRe.test(b)) { droppedMalwareClaims++; continue; }
      cleanBullets.push(b);
    }

    if (!summary) {
      summary = `${extItem.name} (${extItem.version}) toplam ${extItem.cards.length} izin kapsamı talep ediyor (${extItem.unknownCount} bilinmeyen kapsam).`;
    }

    return {
      summary,
      bullets: cleanBullets.length ? cleanBullets : extItem.cards.map((c) => `${c.raw}: ${c.meaning}`),
      disclaimer: MALWARE_DISCLAIMER,
      droppedMalwareClaims,
    };
  }

  function evaluateGoldAccuracy(items, goldExpectations) {
    if (!Array.isArray(goldExpectations) || !goldExpectations.length) return null;
    let total = 0, correct = 0, unknownLabeled = 0, unknownTotal = 0;
    for (const g of goldExpectations) {
      const ext = (items || []).find((x) => x.id === g.extId);
      if (!ext) continue;
      for (const exp of g.checks) {
        total++;
        const card = ext.cards.find((c) => c.raw === exp.raw);
        if (card && card.known === exp.known && card.category === exp.category) correct++;
        if (!exp.known) {
          unknownTotal++;
          if (card && card.unknownScopeLabeled && /Bilinmeyen kapsam/.test(card.title)) unknownLabeled++;
        }
      }
    }
    return {
      totalChecks: total,
      accuracyPct: total ? Math.round((correct / total) * 100) : 100,
      unknownTotal,
      unknownLabeledPct: unknownTotal ? Math.round((unknownLabeled / unknownTotal) * 100) : 100,
    };
  }

  function metrics(items, counters, gold) {
    const list = Array.isArray(items) ? items : [];
    const c = normalizeCounters(counters);
    const totalPermissions = list.reduce((a, x) => a + x.cards.length, 0);
    const totalUnknown = list.reduce((a, x) => a + x.unknownCount, 0);
    const totalDiffs = list.reduce((a, x) => a + (x.history ? x.history.length : 0), 0);
    return {
      extensionCount: list.length,
      totalPermissions,
      totalUnknown,
      totalDiffs,
      accuracyPct: gold ? gold.accuracyPct : 100,
      unknownLabeledPct: gold ? gold.unknownLabeledPct : 100,
      chromeOpened: c.chromeOpened,
      aiRuns: c.aiRuns,
      exports: c.exports,
    };
  }

  function normalizeSettings(s) {
    s = s || {};
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "qwen2.5-7b-instruct", 80),
    };
  }

  function normalizeCounters(c) {
    c = c || {};
    return {
      chromeOpened: Math.max(0, Number(c.chromeOpened) || 0),
      aiRuns: Math.max(0, Number(c.aiRuns) || 0),
      exports: Math.max(0, Number(c.exports) || 0),
    };
  }

  function csvCell(v) {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function exportCsv(items) {
    const head = ["Eklenti Kimliği", "Eklenti Adı", "Sürüm", "İzin Kodu", "Tür", "Durum", "Seviye", "Türkçe Açıklama"];
    const rows = [head.map(csvCell).join(",")];
    for (const x of Array.isArray(items) ? items : []) {
      for (const c of x.cards) {
        rows.push([
          x.id, x.name, x.version, c.raw, c.kind,
          c.known ? "Bilinen" : "Bilinmeyen kapsam",
          c.level, c.meaning,
        ].map(csvCell).join(","));
      }
    }
    return rows.join("\n") + "\n";
  }

  function exportMd(items, metricsObj) {
    const lines = [
      "# Permission Radar — Tarayıcı Eklenti İzin Envanteri ve Politika Raporu",
      "",
      `> **Sınır ve Sorumluluk Notu:** ${MALWARE_DISCLAIMER}`,
      "",
      `- **İncelenen eklenti sayısı:** ${metricsObj.extensionCount}`,
      `- **Toplam izin kapsamı:** ${metricsObj.totalPermissions} · **Açık etiketlenen bilinmeyen kapsam:** ${metricsObj.totalUnknown} (%${metricsObj.unknownLabeledPct})`,
      `- **Test eklentilerinde izin açıklaması doğruluğu:** %${metricsObj.accuracyPct}`,
      `- **Kaydedilen sürüm değişim geçmişi:** ${metricsObj.totalDiffs}`,
      "",
    ];
    for (const x of Array.isArray(items) ? items : []) {
      lines.push(`## ${x.name} (\`v${x.version}\` · \`${x.id}\`)`);
      lines.push(`- **Yönetim ekranı:** \`${x.chromeManageUrl}\``);
      for (const c of x.cards) {
        lines.push(`  - **[${c.known ? c.level.toUpperCase() : "BİLİNMEYEN KAPSAM"}] \`${c.raw}\` (${c.title}):** ${c.meaning}`);
      }
      if (x.history && x.history.length) {
        lines.push(`- **İzin Değişim Geçmişi:**`);
        for (const h of x.history) {
          lines.push(`  - ${h.summary}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  return {
    CHROME_EXTENSIONS_URL,
    MALWARE_DISCLAIMER,
    PERMISSION_DICTIONARY,
    str,
    isLoopbackUrl,
    explainHostPattern,
    explainPermission,
    parseManifestToCard,
    computePermissionDiff,
    upsertExtensionManifest,
    aiPayload,
    validateAiExplanation,
    evaluateGoldAccuracy,
    metrics,
    normalizeSettings,
    normalizeCounters,
    csvCell,
    exportCsv,
    exportMd,
  };
});
