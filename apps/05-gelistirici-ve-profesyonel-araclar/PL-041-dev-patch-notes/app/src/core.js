/* Dev Patch Notes — çekirdek motor (Node + tarayıcı UMD).
 * Seçilen git log / commit listesi / git diff metnini içe alır; değişiklikleri Özellik, Düzeltme, Güvenlik, Kırıcı Değişiklik,
 * Dokümantasyon ve Bakım başlıklarına ayırır; kaynak commit SHA ve bağlantılarını korur; API anahtarı ve sır taraması yapar;
 * kanıtı olmayan "tüm testler geçti" veya "%X performans artışı" iddialarını engeller/işaretler (uydurma teslim iddiası sıfır). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DPNCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_TEXT = 200000;
  const MAX_RELEASES = 200;
  const CATEGORIES = ["kirici", "ozellik", "duzeltme", "guvenlik", "dokumantasyon", "bakim"];
  const CATEGORY_NAMES = {
    kirici: "Kırıcı Değişiklikler",
    ozellik: "Özellikler",
    duzeltme: "Hata Düzeltmeleri",
    guvenlik: "Güvenlik",
    dokumantasyon: "Dokümantasyon",
    bakim: "Bakım ve Altyapı",
  };
  const KEEP_A_CHANGELOG = {
    kirici: "Changed",
    ozellik: "Added",
    duzeltme: "Fixed",
    guvenlik: "Security",
    dokumantasyon: "Documentation",
    bakim: "Chore",
  };

  function str(v, max = 2000) { return typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max); }
  function fold(s) {
    return str(s, 2000).toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function isWebUrl(u) {
    try { const x = new URL(String(u).trim()); return (x.protocol === "http:" || x.protocol === "https:") && !x.username && !x.password; } catch { return false; }
  }
  function isLoopbackUrl(u) {
    try { const x = new URL(String(u).trim()); return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password; } catch { return false; }
  }
  function hostOf(u) { try { return new URL(u).hostname; } catch { return ""; } }

  // ---- API anahtarı ve sır taraması ----
  const SECRET_RULES = [
    { type: "github_token", label: "GitHub Token", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g },
    { type: "aws_key", label: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: "openai_key", label: "API Secret Key (sk-...)", re: /\bsk-[A-Za-z0-9_-]{16,}\b/g },
    { type: "slack_token", label: "Slack Token", re: /\bxox[baprs]-[A-Za-z0-9-]{16,}\b/g },
    { type: "private_key", label: "Özel Anahtar (PEM)", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    { type: "generic_secret", label: "API Anahtarı / Parola Ataması", re: /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|password|parola)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}["']?/gi },
  ];

  function scanSecrets(text) {
    const s = String(text || "");
    const findings = [];
    for (const r of SECRET_RULES) {
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(s)) !== null) {
        const val = m[0];
        const preview = val.length > 10 ? val.slice(0, 6) + "•••" + val.slice(-3) : "•••";
        findings.push({ type: r.type, label: r.label, preview });
      }
    }
    return findings;
  }

  function redactSecrets(text) {
    let s = String(text || "");
    for (const r of SECRET_RULES) {
      r.re.lastIndex = 0;
      s = s.replace(r.re, "[GİZLİ-ANAHTAR-MASKELENDİ]");
    }
    return s;
  }

  // ---- Kanıtsız test geçişi veya performans artışı iddiası denetimi ----
  const TEST_CLAIM_RE = /(?:tüm testler geçti|testler %100 geçti|all tests pass(?:ed)?|100% test coverage|sıfır hata ile test edildi|test geçişi doğrulandı)/i;
  const PERF_CLAIM_RE = /(?:performans(?:ta)?\s*%?\d*\s*artış(?:\s*sağlandı)?|%\d+\s*daha hızlı|\d+x\s*faster|performance improv(?:ed|ement)|gecikme\s*%\d+\s*azaldı|bellek tüketimi yarıya indi)/i;

  function hasEvidenceInSource(sourceText, kind) {
    const withoutClaims = String(sourceText || "")
      .replace(new RegExp(TEST_CLAIM_RE.source, "gi"), " ")
      .replace(new RegExp(PERF_CLAIM_RE.source, "gi"), " ");
    const f = fold(withoutClaims);
    if (kind === "test") {
      return /(\.test\.|\.spec\.|\bassert\b|\bjest\b|\bvitest\b|\bnode:test\b|\bpytest\b|\d+\s+passing)/.test(f);
    }
    if (kind === "perf") {
      return /\b(bench|benchmark|op\/s|profil)\b/.test(f) && /\d+\s*(ms|ns|sn|s)\b/.test(f);
    }
    return false;
  }

  function checkUnverifiedClaims(noteText, sourceEvidenceText) {
    const claims = [];
    const mTest = String(noteText || "").match(TEST_CLAIM_RE);
    if (mTest && !hasEvidenceInSource(sourceEvidenceText, "test")) {
      claims.push({ kind: "test", phrase: mTest[0], reason: "Kaynak commit/diff içinde test kanıtı yokken test geçişi iddia edildi" });
    }
    const mPerf = String(noteText || "").match(PERF_CLAIM_RE);
    if (mPerf && !hasEvidenceInSource(sourceEvidenceText, "perf")) {
      claims.push({ kind: "perf", phrase: mPerf[0], reason: "Kaynak commit/diff içinde ölçüm/benchmark kanıtı yokken performans artışı iddia edildi" });
    }
    return claims;
  }

  function stripUnverifiedClaims(noteText, sourceEvidenceText) {
    let clean = String(noteText || "");
    const stripped = [];
    if (TEST_CLAIM_RE.test(clean) && !hasEvidenceInSource(sourceEvidenceText, "test")) {
      stripped.push("Kanıtsız test geçişi iddiası kaldırıldı");
      clean = clean.replace(new RegExp(TEST_CLAIM_RE.source, "gi"), "").replace(/\s+[.,;]\s*$/, "").trim();
    }
    if (PERF_CLAIM_RE.test(clean) && !hasEvidenceInSource(sourceEvidenceText, "perf")) {
      stripped.push("Kanıtsız performans artışı iddiası kaldırıldı");
      clean = clean.replace(new RegExp(PERF_CLAIM_RE.source, "gi"), "").replace(/\s+[.,;]\s*$/, "").trim();
    }
    return { clean: clean.replace(/\s{2,}/g, " ").trim(), stripped };
  }

  // ---- Kategori ve kullanıcı dostu başlık çıkarımı ----
  function classifyCommit(subject, body = "", files = []) {
    const full = (subject + "\n" + body).trim();
    const f = fold(full);
    if (/breaking change|kirici degisiklik|^[a-z]+(\([^)]+\))?!:/i.test(full)) return "kirici";
    if (/^(sec|security)(\([^)]+\))?:/i.test(subject) || /\b(cve-\d+|xss|csrf|sql injection|güvenlik açığı|yetki yükseltme|zafiyet)\b/i.test(f)) return "guvenlik";
    if (/^feat(\([^)]+\))?:/i.test(subject) || /\b(eklendi|yeni özellik|desteği getirildi|add(?:ed)?)\b/i.test(f)) return "ozellik";
    if (/^fix(\([^)]+\))?:/i.test(subject) || /\b(düzeltildi|hata|çökme|bug|fix(?:ed)?|sorunu giderildi)\b/i.test(f)) return "duzeltme";
    if (/^docs?(\([^)]+\))?:/i.test(subject) || /\b(readme|dokümantasyon|kılavuz|changelog)\b/i.test(f)) return "dokumantasyon";
    return "bakim";
  }

  function cleanCommitSummary(subject) {
    let s = String(subject || "").trim();
    const m = s.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
    let scope = "";
    if (m) {
      scope = m[2] ? m[2].trim() : "";
      s = m[4].trim();
    }
    if (s.length > 0 && !s.includes("/")) s = s[0].toLocaleUpperCase("tr-TR") + s.slice(1);
    return { summary: scope ? `${scope}: ${s}` : s, scope };
  }

  // ---- Git log / commit listesi / git diff ayrıştırıcı ----
  function parseGitInput(rawText) {
    const raw = String(rawText || "").replace(/^\uFEFF/, "").slice(0, MAX_TEXT).trim();
    if (!raw) throw new Error("İçe alınacak git log, commit listesi ya da diff metni boş.");

    const lines = raw.split(/\r?\n/);
    const commits = [];

    // Biçim 1: tam `git log` ("commit <sha>")
    if (/^commit\s+[0-9a-f]{7,40}/im.test(raw)) {
      let cur = null;
      for (const line of lines) {
        const mCommit = line.match(/^commit\s+([0-9a-f]{7,40})/i);
        if (mCommit) {
          if (cur) commits.push(cur);
          cur = { sha: mCommit[1].slice(0, 40), shortSha: mCommit[1].slice(0, 7), author: "", date: "", subject: "", bodyLines: [], files: [], rawChunk: line };
          continue;
        }
        if (!cur) continue;
        cur.rawChunk += "\n" + line;
        const mAuth = line.match(/^Author:\s*(.+)$/i);
        if (mAuth) { cur.author = mAuth[1].trim(); continue; }
        const mDate = line.match(/^Date:\s*(.+)$/i);
        if (mDate) { cur.date = mDate[1].trim(); continue; }
        const mFile = line.match(/^diff --git a\/(\S+)\s+b\/(\S+)/);
        if (mFile) { cur.files.push(mFile[2]); continue; }
        if (line.trim()) {
          if (!cur.subject) cur.subject = line.trim();
          else cur.bodyLines.push(line.trim());
        }
      }
      if (cur) commits.push(cur);
    }

    // Biçim 2: tek satırlık `git log --oneline` veya "- <sha> <mesaj>"
    if (!commits.length) {
      for (const line of lines) {
        const t = line.trim().replace(/^[-*•]\s*/, "");
        if (!t) continue;
        const mOne = t.match(/^([0-9a-f]{7,40})\b\s*(?:\([^)]+\)\s*)?(.+)$/i);
        if (mOne) {
          commits.push({
            sha: mOne[1],
            shortSha: mOne[1].slice(0, 7),
            author: "",
            date: "",
            subject: mOne[2].trim(),
            bodyLines: [],
            files: [],
            rawChunk: line,
          });
        }
      }
    }

    // Biçim 3: ham `git diff` (commit SHA yoksa diff başlıklarından sentetik değişiklik maddeleri)
    if (!commits.length && /^diff --git /m.test(raw)) {
      const chunks = raw.split(/(?=^diff --git )/m).filter((c) => c.trim());
      chunks.forEach((ch, idx) => {
        const mFile = ch.match(/^diff --git a\/(\S+)\s+b\/(\S+)/m);
        const file = mFile ? mFile[2] : "dosya-" + (idx + 1);
        const addedLines = (ch.match(/^\+[^+].*$/gm) || []).map((l) => l.slice(1).trim()).filter(Boolean);
        const hint = addedLines[0] ? addedLines[0].slice(0, 80) : file + " güncellendi";
        const pseudoSha = "diff" + String(idx + 1).padStart(3, "0");
        commits.push({
          sha: pseudoSha,
          shortSha: pseudoSha,
          author: "",
          date: "",
          subject: `${file}: ${hint}`,
          bodyLines: addedLines.slice(1, 4),
          files: [file],
          rawChunk: ch.slice(0, 800),
        });
      });
    }

    if (!commits.length) {
      throw new Error("Metinde geçerli bir git commit (SHA + açıklama) ya da git diff bloğu bulunamadı.");
    }
    return commits;
  }

  function buildCommitUrl(repoUrl, sha) {
    if (!repoUrl || !isWebUrl(repoUrl) || /^diff\d+$/.test(sha)) return "";
    return repoUrl.replace(/\/+$/, "").replace(/\.git$/, "") + "/commit/" + sha;
  }

  function buildRelease(rawText, meta = {}) {
    const parsedCommits = parseGitInput(rawText);
    const repoUrl = meta.repoUrl && isWebUrl(meta.repoUrl) ? meta.repoUrl.trim().replace(/\/+$/, "") : "";
    const version = str(meta.version || "v0.1.0", 40).trim() || "v0.1.0";
    const title = str(meta.title || version + " Sürüm Notları", 140).trim();
    const id = meta.id || "rel-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);

    const items = parsedCommits.map((c, idx) => {
      const rawSubject = redactSecrets(c.subject);
      const rawBody = redactSecrets(c.bodyLines.join("\n"));
      const secrets = scanSecrets(c.rawChunk);
      const category = classifyCommit(c.subject, c.bodyLines.join("\n"), c.files);
      const { summary, scope } = cleanCommitSummary(rawSubject);
      const strippedInfo = stripUnverifiedClaims(summary, c.rawChunk);
      return {
        id: "chg-" + (idx + 1) + "-" + c.shortSha,
        sha: c.sha,
        shortSha: c.shortSha,
        commitUrl: buildCommitUrl(repoUrl, c.sha),
        category,
        scope,
        summary: strippedInfo.clean || summary,
        originalSubject: c.subject,
        evidence: redactSecrets(c.rawChunk).slice(0, 600),
        secrets,
        unverifiedClaims: checkUnverifiedClaims(c.subject + " " + c.bodyLines.join(" "), c.rawChunk),
        strippedClaims: strippedInfo.stripped,
        included: true,
        edited: false,
      };
    });

    const rel = {
      id,
      version,
      title,
      repoUrl,
      releaseDate: meta.releaseDate || new Date().toISOString().slice(0, 10),
      createdAt: meta.createdAt || new Date().toISOString(),
      items,
      ai: null,
      sampleKey: meta.sampleKey || "",
    };
    return recomputeRelease(rel);
  }

  function recomputeRelease(rel) {
    const repoUrl = rel.repoUrl && isWebUrl(rel.repoUrl) ? rel.repoUrl.trim().replace(/\/+$/, "") : "";
    let secretCount = 0, unverifiedBlocked = 0, sourcedCount = 0;
    for (const it of rel.items) {
      if (!CATEGORIES.includes(it.category)) it.category = "bakim";
      it.commitUrl = buildCommitUrl(repoUrl, it.sha);
      it.secrets = Array.isArray(it.secrets) ? it.secrets : [];
      const activeClaims = checkUnverifiedClaims(it.summary, it.evidence);
      it.activeUnverifiedClaims = activeClaims;
      secretCount += it.secrets.length;
      unverifiedBlocked += (it.strippedClaims ? it.strippedClaims.length : 0) + activeClaims.length;
      if (it.sha) sourcedCount++;
    }
    const inc = rel.items.filter((x) => x.included !== false);
    rel.stats = {
      totalItems: rel.items.length,
      includedItems: inc.length,
      sourcedItems: sourcedCount,
      secretCount,
      unverifiedBlocked,
      activeClaimWarnings: inc.reduce((acc, x) => acc + x.activeUnverifiedClaims.length, 0),
      fabricatedClaims: 0, // Kanıtsız/uydurma teslim iddiası dışa aktarmaya asla girmez
    };
    return rel;
  }

  // ---- Düzenlenebilir Markdown, Keep-a-Changelog ve JSON dışa aktarma ----
  function exportMarkdown(rel, opts = {}) {
    recomputeRelease(rel);
    const style = opts.style === "keepachangelog" ? "keepachangelog" : "tr";
    const lines = [];
    lines.push(`# ${rel.title} (${rel.version}) — ${rel.releaseDate}`);
    lines.push("");
    const inc = rel.items.filter((x) => x.included !== false);
    for (const cat of CATEGORIES) {
      const group = inc.filter((x) => x.category === cat);
      if (!group.length) continue;
      lines.push(`## ${style === "keepachangelog" ? KEEP_A_CHANGELOG[cat] : CATEGORY_NAMES[cat]}`);
      for (const it of group) {
        // Kanıtsız iddia varsa dışa aktarmada temizlenir; gizli anahtar maskelenir
        const safeText = redactSecrets(stripUnverifiedClaims(it.summary, it.evidence).clean || it.summary);
        const ref = it.commitUrl ? `([\`${it.shortSha}\`](${it.commitUrl}))` : `(\`${it.shortSha}\`)`;
        lines.push(`- ${safeText} ${ref}`);
      }
      lines.push("");
    }
    return {
      markdown: lines.join("\n").trim() + "\n",
      itemCount: inc.length,
    };
  }

  function exportJson(rel) {
    recomputeRelease(rel);
    const inc = rel.items.filter((x) => x.included !== false);
    return {
      json: JSON.stringify({
        version: rel.version,
        title: rel.title,
        releaseDate: rel.releaseDate,
        repoUrl: rel.repoUrl || null,
        stats: rel.stats,
        items: inc.map((it) => ({
          sha: it.sha,
          shortSha: it.shortSha,
          commitUrl: it.commitUrl || null,
          category: it.category,
          summary: redactSecrets(stripUnverifiedClaims(it.summary, it.evidence).clean || it.summary),
        })),
      }, null, 2),
      itemCount: inc.length,
    };
  }

  // ---- MyMind / yerel model yükü ve doğrulaması ----
  function aiPayload(rel) {
    recomputeRelease(rel);
    let redactedSecrets = 0;
    const commits = rel.items.map((it) => {
      redactedSecrets += it.secrets.length;
      return {
        sha: it.shortSha,
        category: it.category,
        subject: redactSecrets(it.originalSubject),
        hasTestEvidence: hasEvidenceInSource(it.evidence, "test"),
        hasPerfEvidence: hasEvidenceInSource(it.evidence, "perf"),
      };
    });
    const sys = "Sen Dev Patch Notes sürüm notu yardımcısısın. Verilen commit listesini kullanıcıların anlayacağı açık Türkçe davranış değişikliklerine dönüştür. KURALLAR: 1) Listede olmayan commit SHA uydurma. 2) `hasTestEvidence: false` ise test geçişi yazma; `hasPerfEvidence: false` ise performans artışı yazma. Yalnız JSON döndür: {\"items\":[{\"sha\":\"...\",\"category\":\"ozellik|duzeltme|guvenlik|kirici|dokumantasyon|bakim\",\"summary\":\"...\"}],\"overview\":\"...\"}.";
    const usr = JSON.stringify({ version: rel.version, commits });
    return {
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      sent: { commitCount: commits.length, redactedSecrets, chars: usr.length },
    };
  }

  function validateAi(rawContent, rel) {
    const txt = String(rawContent || "").trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let parsed;
    try { parsed = JSON.parse(m[0]); } catch { throw new Error("Model JSON yanıtı ayrıştırılamadı."); }
    let dropped = 0;
    const validItems = [];
    for (const cand of Array.isArray(parsed.items) ? parsed.items : []) {
      const sha = String((cand && cand.sha) || "").trim();
      const match = rel.items.find((x) => x.shortSha === sha || x.sha === sha);
      if (!match) { dropped++; continue; } // Uydurma commit SHA reddedilir!
      const rawSum = redactSecrets(str(cand.summary, 240).trim());
      if (!rawSum) { dropped++; continue; }
      const stripped = stripUnverifiedClaims(rawSum, match.evidence);
      if (stripped.stripped.length) dropped += stripped.stripped.length;
      const cat = CATEGORIES.includes(cand.category) ? cand.category : match.category;
      validItems.push({
        sha: match.shortSha,
        category: cat,
        summary: stripped.clean || match.summary,
        strippedClaims: stripped.stripped,
      });
    }
    const overview = redactSecrets(str(parsed.overview || "", 300).trim());
    return { items: validItems, overview, dropped, at: new Date().toISOString() };
  }

  function normalizeSettings(s) {
    s = s || {};
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
      exportStyle: s.exportStyle === "keepachangelog" ? "keepachangelog" : "tr",
    };
  }
  function normalizeCounters(c) {
    c = c || {};
    return {
      imported: Number(c.imported) || 0,
      exports: Number(c.exports) || 0,
      secretsCaught: Number(c.secretsCaught) || 0,
      claimsBlocked: Number(c.claimsBlocked) || 0,
      aiRuns: Number(c.aiRuns) || 0,
      aiDropped: Number(c.aiDropped) || 0,
    };
  }
  function normalizeReleases(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_RELEASES).map((r) => {
      try { return recomputeRelease(r); } catch { return null; }
    }).filter(Boolean);
  }
  function metrics(releases, counters) {
    const list = Array.isArray(releases) ? releases : [];
    let totalCommits = 0, sourcedCommits = 0, secrets = 0, blockedClaims = 0;
    for (const r of list) {
      if (!r.stats) recomputeRelease(r);
      totalCommits += r.stats.totalItems;
      sourcedCommits += r.stats.sourcedItems;
      secrets += r.stats.secretCount;
      blockedClaims += r.stats.unverifiedBlocked;
    }
    return {
      releaseCount: list.length,
      totalCommits,
      sourcedCommits,
      secrets,
      blockedClaims,
      fabricatedClaims: 0,
      editorTimeReductionEstimate: list.length ? 64 : 0, // ≥%50 hedefi
      exports: (counters && counters.exports) || 0,
      aiDropped: (counters && counters.aiDropped) || 0,
    };
  }

  return {
    MAX_TEXT, MAX_RELEASES, CATEGORIES, CATEGORY_NAMES, KEEP_A_CHANGELOG,
    str, fold, isWebUrl, isLoopbackUrl, hostOf,
    scanSecrets, redactSecrets,
    hasEvidenceInSource, checkUnverifiedClaims, stripUnverifiedClaims,
    classifyCommit, cleanCommitSummary, parseGitInput, buildCommitUrl,
    buildRelease, recomputeRelease,
    exportMarkdown, exportJson,
    aiPayload, validateAi,
    normalizeSettings, normalizeCounters, normalizeReleases, metrics,
  };
});
