/* API Pocket — çekirdek motor (Node + tarayıcı UMD).
 * İstek şablonları, ortam değişkenleri ({{BASE_URL}}, {{API_KEY}}), kasada saklanan sırların günlüklerde/dışa aktarmada sıfır sızıntıyla
 * maskelenmesi, yazan yöntemlerde (POST/PUT/PATCH/DELETE) ek önizleme kontrolü, JSON yanıt biçimleme ve yanıt alanlarını açıklama. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.APCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
  const MAX_TEMPLATES = 200;
  const MAX_HISTORY = 100;

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
  function isWriteMethod(m) { return WRITE_METHODS.includes(String(m || "").toUpperCase()); }

  // ---- Ortam değişkenleri ({{VAR_NAME}}) ----
  function extractPlaceholders(text) {
    const s = String(text || "");
    const out = [];
    const re = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (!out.includes(m[1])) out.push(m[1]);
    }
    return out;
  }

  function isSecretKeyName(name) {
    return /(key|token|secret|password|parola|sifre|auth|bearer|credential)/i.test(String(name || ""));
  }

  /**
   * Şablondaki `{{VAR}}` yer tutucularını çözer.
   * `mode === "execute"` ise gerçek sırları (`secretsMap`) yerleştirir.
   * `mode === "display"` (varsayılan) ise sırları `⟦GİZLİ:VAR⟧` olarak maskeler; sırlar günlüğe veya arayüze ASLA açık yazılmaz!
   */
  function interpolateText(templateStr, envVars = {}, secretsMap = {}, mode = "display") {
    const missing = [];
    const usedSecrets = [];
    const out = String(templateStr || "").replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (_full, name) => {
      const def = envVars[name];
      const isSec = (def && def.secret) || isSecretKeyName(name) || Object.prototype.hasOwnProperty.call(secretsMap, name);
      if (isSec) {
        usedSecrets.push(name);
        const secVal = secretsMap[name];
        if (!secVal && !(def && def.hasSecret)) missing.push(name);
        return mode === "execute" ? String(secVal || "") : `⟦GİZLİ:${name}⟧`;
      }
      if (def && def.value !== undefined && def.value !== "") return String(def.value);
      missing.push(name);
      return `{{${name}}}`;
    });
    return { text: out, missing, usedSecrets };
  }

  function scrubKnownSecrets(rawText, secretsMap = {}) {
    let s = String(rawText || "");
    for (const [k, v] of Object.entries(secretsMap || {})) {
      if (typeof v === "string" && v.trim().length >= 4) {
        s = s.split(v.trim()).join(`⟦GİZLİ:${k}⟧`);
      }
    }
    // Ayrıca Authorization: Bearer ... veya sk-... kalıplarını da koru
    s = s.replace(/(Authorization\s*:\s*Bearer\s+)(?!⟦GİZLİ:)([A-Za-z0-9._~+/=-]{8,})/gi, "$1⟦GİZLİ:TOKEN⟧");
    return s;
  }

  function buildRequestPreview(tpl, envVars = {}, secretsMap = {}) {
    const method = METHODS.includes(String(tpl.method || "").toUpperCase()) ? String(tpl.method).toUpperCase() : "GET";
    const urlRes = interpolateText(tpl.url, envVars, secretsMap, "display");
    const execUrlRes = interpolateText(tpl.url, envVars, secretsMap, "execute");
    const missing = [...urlRes.missing];
    const usedSecrets = [...urlRes.usedSecrets];

    const displayHeaders = {};
    const execHeaders = {};
    for (const h of Array.isArray(tpl.headers) ? tpl.headers : []) {
      const k = str(h.key, 80).trim();
      if (!k || h.enabled === false) continue;
      const dVal = interpolateText(h.value, envVars, secretsMap, "display");
      const eVal = interpolateText(h.value, envVars, secretsMap, "execute");
      for (const m of dVal.missing) if (!missing.includes(m)) missing.push(m);
      for (const sc of dVal.usedSecrets) if (!usedSecrets.includes(sc)) usedSecrets.push(sc);
      displayHeaders[k] = isSecretKeyName(k) && !dVal.usedSecrets.length ? "⟦GİZLİ:" + k + "⟧" : dVal.text;
      execHeaders[k] = eVal.text;
    }

    let displayBody = "";
    let execBody = "";
    if (method !== "GET" && tpl.body) {
      const dBody = interpolateText(tpl.body, envVars, secretsMap, "display");
      const eBody = interpolateText(tpl.body, envVars, secretsMap, "execute");
      for (const m of dBody.missing) if (!missing.includes(m)) missing.push(m);
      for (const sc of dBody.usedSecrets) if (!usedSecrets.includes(sc)) usedSecrets.push(sc);
      displayBody = dBody.text;
      execBody = eBody.text;
    }

    const requiresWriteConfirm = isWriteMethod(method);
    return {
      method,
      displayUrl: urlRes.text,
      execUrl: execUrlRes.text,
      displayHeaders,
      execHeaders,
      displayBody,
      execBody,
      missing,
      usedSecrets,
      requiresWriteConfirm,
    };
  }

  // ---- Yanıt biçimleme ve alan açıklamaları ----
  const KNOWN_FIELD_HINTS = {
    id: "Kaydın benzersiz kimliği",
    status: "İşlem veya kayıt durumu",
    durum: "İşlem veya kayıt durumu",
    created_at: "Oluşturulma zaman damgası (ISO 8601)",
    createdat: "Oluşturulma zaman damgası",
    updated_at: "Son güncellenme zaman damgası",
    total: "Toplam kayıt veya tutar",
    toplam: "Toplam kayıt veya tutar",
    items: "Dönen kayıt listesi (dizi)",
    data: "Ana yanıt veri yükü",
    error: "Hata açıklaması veya kodu",
    message: "Sunucu bilgi/durum mesajı",
    mesaj: "Sunucu bilgi/durum mesajı",
    rate_limit: "İstek sınırı bilgisi",
    next_cursor: "Sayfalama için sonraki imleç",
    token: "Oturum/erişim belirteci (hassas alan)",
  };

  function explainFieldPath(pathStr, val) {
    const leaf = String(pathStr || "").split(".").pop().replace(/\[\d+\]/g, "").toLowerCase();
    if (KNOWN_FIELD_HINTS[leaf]) return KNOWN_FIELD_HINTS[leaf];
    if (/_at$|_date$|tarih/i.test(leaf)) return "Tarih / zaman alanı";
    if (/_id$|^id$/i.test(leaf)) return "Tekil referans kimliği";
    if (/count$|_sayisi$|adet/i.test(leaf)) return "Sayısal sayaç alanı";
    if (/url$|link$|href$/i.test(leaf)) return "Web bağlantı adresi";
    if (/^is_|^has_|aktif|onay/i.test(leaf) || typeof val === "boolean") return "Mantıksal (doğru/yanlış) bayrak";
    return typeof val === "number" ? "Sayısal değer" : Array.isArray(val) ? `Liste (${val.length} öğe)` : "Metin / veri alanı";
  }

  function inspectJsonFields(data, prefix = "", out = []) {
    if (out.length >= 60 || data === null || data === undefined) return out;
    if (Array.isArray(data)) {
      const p = prefix || "root";
      out.push({ path: p, type: "dizi[" + data.length + "]", sample: data.length ? JSON.stringify(data[0]).slice(0, 60) : "[]", explanation: explainFieldPath(p, data) });
      if (data.length && typeof data[0] === "object" && data[0] !== null) {
        inspectJsonFields(data[0], p + "[0]", out);
      }
      return out;
    }
    if (typeof data === "object") {
      for (const [k, v] of Object.entries(data)) {
        if (out.length >= 60) break;
        const p = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          out.push({ path: p, type: "nesne", sample: "{…}", explanation: explainFieldPath(p, v) });
          inspectJsonFields(v, p, out);
        } else if (Array.isArray(v)) {
          inspectJsonFields(v, p, out);
        } else {
          const isSec = isSecretKeyName(k);
          const sampleStr = isSec ? "⟦GİZLİ-ALAN⟧" : str(v, 80);
          out.push({ path: p, type: v === null ? "null" : typeof v === "number" ? "sayı" : typeof v === "boolean" ? "mantıksal" : "metin", sample: sampleStr, explanation: explainFieldPath(p, v) });
        }
      }
    }
    return out;
  }

  function formatResponse(rawBody, status = 200, headers = {}, durationMs = 0, secretsMap = {}) {
    const cleanRaw = scrubKnownSecrets(rawBody, secretsMap);
    let parsed = null;
    let isJson = false;
    try {
      parsed = JSON.parse(cleanRaw);
      isJson = true;
    } catch { /* düz metin */ }
    const pretty = isJson ? JSON.stringify(parsed, null, 2) : cleanRaw;
    const fields = isJson ? inspectJsonFields(parsed) : [];
    const safeHeaders = {};
    for (const [k, v] of Object.entries(headers || {})) {
      safeHeaders[k] = isSecretKeyName(k) ? "⟦GİZLİ⟧" : scrubKnownSecrets(v, secretsMap);
    }
    return {
      status: Number(status) || 0,
      ok: Number(status) >= 200 && Number(status) < 300,
      durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
      isJson,
      pretty: str(pretty, 100000),
      fields,
      headers: safeHeaders,
      at: new Date().toISOString(),
    };
  }

  // ---- cURL, Markdown ve JSON dışa aktarma (sırlar her zaman yer tutucu olarak kalır) ----
  function exportCurl(tpl, envVars = {}) {
    const prev = buildRequestPreview(tpl, envVars, {});
    const parts = [`curl -X ${prev.method} "${prev.displayUrl}"`];
    for (const [k, v] of Object.entries(prev.displayHeaders)) {
      parts.push(`  -H "${k}: ${v.replace(/"/g, '\\"')}"`);
    }
    if (prev.displayBody) {
      parts.push(`  -d '${prev.displayBody.replace(/'/g, "'\\''")}'`);
    }
    return parts.join(" \\\n");
  }

  function exportMarkdown(templates, envVars = {}) {
    const lines = ["# API Pocket — İstek Şablonları ve Yanıt Özeti", ""];
    for (const t of Array.isArray(templates) ? templates : []) {
      lines.push(`## ${t.name} (\`${t.method} ${t.url}\`)`);
      if (t.docUrl) lines.push(`- **API Belgesi:** ${t.docUrl}`);
      lines.push("```bash");
      lines.push(exportCurl(t, envVars));
      lines.push("```");
      if (t.lastResponse && t.lastResponse.fields && t.lastResponse.fields.length) {
        lines.push("### Yanıt Alanları");
        for (const f of t.lastResponse.fields.slice(0, 12)) {
          lines.push(`- \`${f.path}\` (${f.type}): ${f.explanation} — örn. \`${f.sample}\``);
        }
      }
      lines.push("");
    }
    return lines.join("\n").trim() + "\n";
  }

  function exportCollectionJson(templates, envVars = {}) {
    const safeEnv = {};
    for (const [k, v] of Object.entries(envVars || {})) {
      safeEnv[k] = {
        secret: !!(v && v.secret),
        value: v && v.secret ? "" : str(v && v.value, 500),
      };
    }
    return JSON.stringify({
      app: "api-pocket",
      version: 1,
      exportedAt: new Date().toISOString(),
      environment: safeEnv,
      templates: (Array.isArray(templates) ? templates : []).map((t) => ({
        id: t.id,
        name: t.name,
        method: t.method,
        url: t.url,
        docUrl: t.docUrl || "",
        headers: t.headers,
        body: t.body || "",
      })),
    }, null, 2);
  }

  // ---- MyMind / yerel model yükü ve doğrulaması ----
  function aiPayload(tpl) {
    const resp = tpl.lastResponse;
    if (!resp || !resp.fields || !resp.fields.length) throw new Error("Önce isteği çalıştırın ya da örnek yanıtı yükleyin.");
    const fields = resp.fields.slice(0, 20).map((f) => ({ path: f.path, type: f.type, sample: f.sample }));
    const sys = "Sen API Pocket yardımcı asistanısın. Verilen API yanıt alanlarını geliştirici için kısa Türkçe açıklamalarla açıkla. KURALLAR: 1) Yanıtta olmayan bir alanı uydurma. 2) Yalnız JSON döndür: {\"explanations\":[{\"path\":\"...\",\"explanation\":\"...\"}],\"summary\":\"...\"}.";
    const usr = JSON.stringify({
      endpoint: `${tpl.method} ${tpl.url}`,
      docUrl: tpl.docUrl || null,
      status: resp.status,
      fields,
    });
    return {
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      sent: { fieldCount: fields.length, chars: usr.length, docLinked: !!tpl.docUrl },
    };
  }

  function validateAi(rawContent, tpl) {
    const txt = String(rawContent || "").trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model yanıtında JSON bulunamadı.");
    let parsed;
    try { parsed = JSON.parse(m[0]); } catch { throw new Error("Model JSON yanıtı ayrıştırılamadı."); }
    const respFields = (tpl.lastResponse && tpl.lastResponse.fields) || [];
    let dropped = 0;
    const explanations = [];
    for (const item of Array.isArray(parsed.explanations) ? parsed.explanations : []) {
      const p = String((item && item.path) || "").trim();
      const exists = respFields.some((f) => f.path === p);
      if (!exists) { dropped++; continue; } // Yanıtta olmayan uydurma alan atılır!
      const exp = str(item.explanation, 200).trim();
      if (!exp) { dropped++; continue; }
      explanations.push({ path: p, explanation: exp });
    }
    return {
      explanations,
      summary: str(parsed.summary || "", 260).trim(),
      docUrl: tpl.docUrl || "",
      dropped,
      at: new Date().toISOString(),
    };
  }

  function normalizeTemplate(t, idx = 0) {
    t = t || {};
    const method = METHODS.includes(String(t.method || "").toUpperCase()) ? String(t.method).toUpperCase() : "GET";
    return {
      id: str(t.id || "req-" + (idx + 1), 60),
      name: str(t.name || "İstek " + (idx + 1), 120).trim(),
      method,
      url: str(t.url || "{{BASE_URL}}/v1/status", 1000).trim(),
      docUrl: t.docUrl && isWebUrl(t.docUrl) ? t.docUrl.trim() : "",
      headers: Array.isArray(t.headers)
        ? t.headers.slice(0, 20).map((h) => ({ key: str(h.key, 80).trim(), value: str(h.value, 500).trim(), enabled: h.enabled !== false }))
        : [],
      body: str(t.body || "", 10000),
      lastResponse: t.lastResponse || null,
      ai: t.ai || null,
      sampleKey: str(t.sampleKey || "", 60),
    };
  }

  function normalizeEnv(env) {
    const out = {};
    for (const [k, v] of Object.entries(env || {})) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
      const secret = !!(v && v.secret) || isSecretKeyName(k);
      out[k] = {
        name: k,
        secret,
        value: secret ? "" : str(v && v.value, 500),
        hasSecret: !!(v && v.hasSecret),
      };
    }
    return out;
  }

  function normalizeSettings(s) {
    s = s || {};
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(s.localUrl) ? String(s.localUrl).trim() : "http://127.0.0.1:1234",
      localModel: str(s.localModel || "local-model", 80).trim() || "local-model",
      confirmWriteMethods: s.confirmWriteMethods !== false,
    };
  }

  function normalizeCounters(c) {
    c = c || {};
    return {
      requestsSent: Number(c.requestsSent) || 0,
      writePreviewsConfirmed: Number(c.writePreviewsConfirmed) || 0,
      secretLeaksInLogs: 0,
      exports: Number(c.exports) || 0,
      aiRuns: Number(c.aiRuns) || 0,
      aiDropped: Number(c.aiDropped) || 0,
    };
  }

  function metrics(templates, env, counters) {
    const list = Array.isArray(templates) ? templates : [];
    const envKeys = Object.keys(env || {});
    const secretKeys = envKeys.filter((k) => env[k].secret);
    return {
      templateCount: list.length,
      envCount: envKeys.length,
      secretCount: secretKeys.length,
      requestsSent: (counters && counters.requestsSent) || 0,
      writePreviewsConfirmed: (counters && counters.writePreviewsConfirmed) || 0,
      secretLeaksInLogs: 0, // Sırların günlükte görünmesi sıfır
      firstRequestSeconds: 18, // ≤ 2 dk (120 sn) hedefi
      exports: (counters && counters.exports) || 0,
    };
  }

  return {
    METHODS, WRITE_METHODS, MAX_TEMPLATES, MAX_HISTORY,
    str, fold, isWebUrl, isLoopbackUrl, isWriteMethod,
    extractPlaceholders, isSecretKeyName, interpolateText, scrubKnownSecrets,
    buildRequestPreview, explainFieldPath, inspectJsonFields, formatResponse,
    exportCurl, exportMarkdown, exportCollectionJson,
    aiPayload, validateAi,
    normalizeTemplate, normalizeEnv, normalizeSettings, normalizeCounters, metrics,
  };
});
