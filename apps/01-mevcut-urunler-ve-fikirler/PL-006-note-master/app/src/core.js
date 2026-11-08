/* PL-006 Note Master — saf çekirdek (hem Node hem tarayıcıda çalışır).
 * Notion: "Seçili metinden kaynaklı not, hızlı görev, etiket ve Markdown dışa aktarma. Mind Palace ile aynı not şemasını kullanır."
 * "Yapay zekânın rolü: Uzun notu görev/özet/anahtar kavram taslağına çevirir; özgün metni saklar."
 * "Teknik bağımlılık ve sınır: Kaynak URL ve alıntı sınırı tutulur; gizli sayfa içeriği varsayılan buluta gönderilmez."
 * "Doğrulama ölçütü: İlk notun 60 sn içinde alınması; haftada ≥5 geri çağrılan not." */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NoteCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SCHEMA = "pluginlabs-note/1";
  const KINDS = ["not", "gorev"];
  const DEFAULT_QUOTE_LIMIT = 600;
  const MIN_QUOTE_LIMIT = 120;
  const MAX_QUOTE_LIMIT = 2000;
  const MAX_BODY = 20000;
  const MAX_TAGS = 12;
  const RECALL_DEDUPE_MS = 10 * 60 * 1000;
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const TARGET_FIRST_NOTE_SECONDS = 60;
  const TARGET_WEEKLY_RECALLS = 5;
  const AI_MIN_CHARS = 280;

  const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max == null ? 10000 : max);
  const clampInt = (v, lo, hi, def) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
  };
  const isoOr = (v, def) => {
    const t = Date.parse(v);
    return Number.isFinite(t) ? new Date(t).toISOString() : def;
  };

  /* Türkçe duyarlı katlama: arama ve etiket karşılaştırması için. */
  function fold(s) {
    return str(s)
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "");
  }

  function makeId(prefix, nowIso, seed) {
    const t = Date.parse(nowIso) || 0;
    let h = 2166136261;
    const s = str(seed) + "|" + t + "|" + Math.random();
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return prefix + "-" + t.toString(36) + "-" + (h >>> 0).toString(36);
  }

  /* Etiket: harf/rakam/-/_; küçük harf (tr); en çok 32 karakter. */
  function normalizeTag(t) {
    const x = str(t, 64).trim().replace(/^#+/, "").toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "");
    return x.slice(0, 32);
  }
  function parseTags(text) {
    const out = [];
    const re = /(^|[\s(])#([\p{L}\p{N}_-]{2,32})/gu;
    let m;
    const s = str(text, MAX_BODY);
    while ((m = re.exec(s))) out.push(m[2]);
    return out;
  }
  function mergeTags(...lists) {
    const seen = new Set();
    const out = [];
    for (const list of lists) {
      for (const raw of Array.isArray(list) ? list : str(list).split(/[,\s]+/)) {
        const t = normalizeTag(raw);
        if (t.length < 2 || seen.has(t)) continue;
        seen.add(t);
        out.push(t);
        if (out.length >= MAX_TAGS) return out;
      }
    }
    return out;
  }

  /* Kaynak URL: yalnız http/https; kimlik bilgisi, #parça ve izleme parametreleri atılır. Geçersizse boş. */
  function normalizeSourceUrl(u) {
    const s = str(u, 2048).trim();
    if (!s) return "";
    let x;
    try { x = new URL(s); } catch { return ""; }
    if (x.protocol !== "http:" && x.protocol !== "https:") return "";
    x.username = "";
    x.password = "";
    x.hash = "";
    const drop = [];
    x.searchParams.forEach((_v, k) => { if (/^(utm_|fbclid$|gclid$|mc_eid$|igshid$|si$)/i.test(k)) drop.push(k); });
    drop.forEach((k) => x.searchParams.delete(k));
    return x.toString();
  }
  function sourceHost(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
  }

  /* Alıntı sınırı: kaynaktan alınan metin en çok `limit` karakter tutulur; kesilirse işaretlenir. */
  function clipQuote(q, limit) {
    const lim = clampInt(limit, MIN_QUOTE_LIMIT, MAX_QUOTE_LIMIT, DEFAULT_QUOTE_LIMIT);
    const s = str(q, MAX_BODY).replace(/\r\n/g, "\n").trim();
    if (s.length <= lim) return { quote: s, truncated: false, originalLength: s.length };
    let cut = s.slice(0, lim);
    const sp = cut.lastIndexOf(" ");
    if (sp > lim * 0.7) cut = cut.slice(0, sp);
    return { quote: cut.trimEnd() + "…", truncated: true, originalLength: s.length };
  }

  function titleFrom(body, quote) {
    const first = (str(body, MAX_BODY).split("\n").find((l) => l.trim()) || str(quote).split("\n").find((l) => l.trim()) || "").trim();
    const t = first.replace(/^#+\s*/, "").replace(/\s+/g, " ");
    return t.length > 80 ? t.slice(0, 79).trimEnd() + "…" : t || "Başlıksız not";
  }

  function normalizeSettings(s) {
    s = s && typeof s === "object" ? s : {};
    const localUrl = str(s.localUrl, 200).trim() || "http://127.0.0.1:1234";
    return {
      provider: s.provider === "yerel" ? "yerel" : "hub",
      localUrl: isLoopbackUrl(localUrl) ? localUrl : "http://127.0.0.1:1234",
      localModel: str(s.localModel, 120).trim(),
      allowPrivateAi: s.allowPrivateAi === true,
      quoteLimit: clampInt(s.quoteLimit, MIN_QUOTE_LIMIT, MAX_QUOTE_LIMIT, DEFAULT_QUOTE_LIMIT),
      firstLaunchAt: isoOr(s.firstLaunchAt, ""),
      firstNoteAt: isoOr(s.firstNoteAt, ""),
    };
  }

  function normalizeDraft(d) {
    if (!d || typeof d !== "object") return null;
    return {
      summary: str(d.summary, 800),
      tasks: (Array.isArray(d.tasks) ? d.tasks : []).map((t) => str(t, 160).trim()).filter(Boolean).slice(0, 8),
      concepts: (Array.isArray(d.concepts) ? d.concepts : []).map((t) => str(t, 48).trim()).filter(Boolean).slice(0, 10),
      droppedConcepts: clampInt(d.droppedConcepts, 0, 999, 0),
      droppedRewrites: clampInt(d.droppedRewrites, 0, 999, 0),
      provider: str(d.provider, 120),
      at: isoOr(d.at, ""),
    };
  }

  function normalizeNote(n, opts) {
    n = n && typeof n === "object" ? n : {};
    const now = (opts && opts.now) || new Date().toISOString();
    const limit = opts && opts.quoteLimit;
    const body = str(n.body, MAX_BODY).replace(/\r\n/g, "\n");
    const q = clipQuote(n.quote, limit == null ? MAX_QUOTE_LIMIT : limit);
    const sourceUrl = normalizeSourceUrl(n.sourceUrl);
    const createdAt = isoOr(n.createdAt, now);
    return {
      schema: SCHEMA,
      id: str(n.id, 64) || makeId("not", now, body + q.quote),
      kind: KINDS.includes(n.kind) ? n.kind : "not",
      title: str(n.title, 120).trim() || titleFrom(body, q.quote),
      body,
      quote: q.quote,
      quoteTruncated: n.quoteTruncated === true || q.truncated,
      sourceUrl,
      sourceTitle: str(n.sourceTitle, 200).trim(),
      tags: mergeTags(n.tags, parseTags(body)),
      private: n.private === true,
      done: n.done === true,
      due: /^\d{4}-\d{2}-\d{2}$/.test(str(n.due)) ? n.due : "",
      parentId: str(n.parentId, 64),
      createdAt,
      updatedAt: isoOr(n.updatedAt, createdAt),
      recalls: (Array.isArray(n.recalls) ? n.recalls : []).map((r) => isoOr(r, "")).filter(Boolean).slice(-200),
      aiDraft: normalizeDraft(n.aiDraft),
    };
  }

  /* Yeni not: gövde ya da alıntıdan biri zorunlu; kaynak URL geçersizse hata. */
  function createNote(input, nowIso, settings) {
    input = input || {};
    const body = str(input.body, MAX_BODY).trim();
    const rawQuote = str(input.quote, MAX_BODY).trim();
    if (!body && !rawQuote) throw new Error("Not boş: bir metin ya da kaynaktan alıntı girin.");
    const rawUrl = str(input.sourceUrl, 2048).trim();
    const sourceUrl = normalizeSourceUrl(rawUrl);
    if (rawUrl && !sourceUrl) throw new Error("Kaynak adresi yalnız http:// ya da https:// ile başlayan bir web adresi olabilir.");
    if (rawQuote && !sourceUrl && !str(input.sourceTitle).trim()) {
      throw new Error("Alıntı için kaynak gerekli: kaynak adresini ya da kaynak adını girin.");
    }
    const limit = normalizeSettings(settings).quoteLimit;
    const q = clipQuote(rawQuote, limit);
    return normalizeNote(
      {
        kind: input.kind,
        title: input.title,
        body,
        quote: q.quote,
        quoteTruncated: q.truncated,
        sourceUrl,
        sourceTitle: input.sourceTitle,
        tags: input.tags,
        private: input.private === true,
        due: input.due,
        parentId: input.parentId,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      { now: nowIso, quoteLimit: limit }
    );
  }

  function updateNote(note, patch, nowIso, settings) {
    patch = patch || {};
    const next = { ...note };
    if ("title" in patch) next.title = str(patch.title, 120).trim();
    if ("body" in patch) next.body = str(patch.body, MAX_BODY);
    if ("tags" in patch) next.tags = mergeTags(patch.tags);
    if ("private" in patch) next.private = patch.private === true;
    if ("done" in patch) next.done = patch.done === true;
    if ("kind" in patch && KINDS.includes(patch.kind)) next.kind = patch.kind;
    if ("due" in patch) next.due = patch.due;
    if ("sourceUrl" in patch) {
      const u = normalizeSourceUrl(patch.sourceUrl);
      if (str(patch.sourceUrl).trim() && !u) throw new Error("Kaynak adresi yalnız http:// ya da https:// olabilir.");
      next.sourceUrl = u;
    }
    if ("sourceTitle" in patch) next.sourceTitle = str(patch.sourceTitle, 200);
    if ("body" in patch && !("tags" in patch)) next.tags = mergeTags(note.tags, parseTags(next.body));
    next.updatedAt = nowIso;
    return normalizeNote(next, { now: nowIso, quoteLimit: normalizeSettings(settings).quoteLimit });
  }

  /* Geri çağırma: notu açmak/kopyalamak/dışa aktarmak bir geri çağırmadır; aynı not 10 dk içinde tekrar sayılmaz. */
  function recordRecall(note, nowIso) {
    const t = Date.parse(nowIso);
    const last = note.recalls.length ? Date.parse(note.recalls[note.recalls.length - 1]) : -Infinity;
    if (t - last < RECALL_DEDUPE_MS) return { note, counted: false };
    return { note: { ...note, recalls: [...note.recalls, new Date(t).toISOString()].slice(-200) }, counted: true };
  }

  function search(notes, query, filters) {
    filters = filters || {};
    const terms = fold(query).split(/\s+/).filter(Boolean);
    const tag = filters.tag ? normalizeTag(filters.tag) : "";
    const out = [];
    for (const n of notes) {
      if (tag && !n.tags.includes(tag)) continue;
      if (filters.kind && n.kind !== filters.kind) continue;
      if (filters.openOnly && (n.kind !== "gorev" || n.done)) continue;
      let score = 0;
      if (terms.length) {
        const ft = fold(n.title), fg = fold(n.tags.join(" ")), fb = fold(n.body + " " + n.quote), fs = fold(n.sourceTitle + " " + n.sourceUrl);
        let all = true;
        for (const t of terms) {
          const s = (ft.includes(t) ? 3 : 0) + (fg.includes(t) ? 2 : 0) + (fb.includes(t) ? 1 : 0) + (fs.includes(t) ? 1 : 0);
          if (!s) { all = false; break; }
          score += s;
        }
        if (!all) continue;
      }
      out.push({ note: n, score });
    }
    out.sort((a, b) => b.score - a.score || (b.note.updatedAt > a.note.updatedAt ? 1 : b.note.updatedAt < a.note.updatedAt ? -1 : 0));
    return out.map((r) => r.note);
  }

  function tagCloud(notes) {
    const m = new Map();
    for (const n of notes) for (const t of n.tags) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).map(([tag, count]) => ({ tag, count }));
  }

  /* Doğrulama ölçütleri: ilk not süresi (≤60 sn) ve son 7 günde geri çağrılan farklı not sayısı (≥5). */
  function metrics(notes, settings, nowIso) {
    const s = normalizeSettings(settings);
    const now = Date.parse(nowIso);
    let firstNoteSeconds = null;
    /* İlk not anı, kullanıcının uygulamada oluşturduğu ilk kayıtta sabitlenir (örnek/içe aktarılan notlar ölçütü bozmaz). */
    if (s.firstLaunchAt && (s.firstNoteAt || notes.length)) {
      const first = s.firstNoteAt ? Date.parse(s.firstNoteAt) : Math.min(...notes.map((n) => Date.parse(n.createdAt)));
      firstNoteSeconds = Math.max(0, Math.round((first - Date.parse(s.firstLaunchAt)) / 1000));
    }
    let weeklyRecalledNotes = 0, weeklyRecallEvents = 0;
    for (const n of notes) {
      const c = n.recalls.filter((r) => now - Date.parse(r) <= WEEK_MS && Date.parse(r) <= now).length;
      weeklyRecallEvents += c;
      if (c) weeklyRecalledNotes++;
    }
    const tasks = notes.filter((n) => n.kind === "gorev");
    return {
      total: notes.length,
      notes: notes.length - tasks.length,
      tasks: tasks.length,
      openTasks: tasks.filter((t) => !t.done).length,
      sourced: notes.filter((n) => n.sourceUrl || n.sourceTitle).length,
      privateCount: notes.filter((n) => n.private).length,
      firstNoteSeconds,
      firstNoteOk: firstNoteSeconds != null && firstNoteSeconds <= TARGET_FIRST_NOTE_SECONDS,
      weeklyRecalledNotes,
      weeklyRecallEvents,
      weeklyOk: weeklyRecalledNotes >= TARGET_WEEKLY_RECALLS,
      targets: { firstNoteSeconds: TARGET_FIRST_NOTE_SECONDS, weeklyRecalls: TARGET_WEEKLY_RECALLS },
    };
  }

  const mdEsc = (s) => str(s).replace(/([\\`*_[\]])/g, "\\$1");
  function noteToMarkdown(n) {
    const lines = [];
    const box = n.kind === "gorev" ? (n.done ? "[x] " : "[ ] ") : "";
    lines.push("## " + box + mdEsc(n.title));
    const meta = [];
    meta.push(n.kind === "gorev" ? "Görev" : "Not");
    if (n.due) meta.push("son tarih " + n.due);
    meta.push("oluşturma " + n.createdAt.slice(0, 16).replace("T", " "));
    if (n.private) meta.push("gizli");
    lines.push("_" + meta.join(" · ") + "_");
    if (n.tags.length) lines.push("", n.tags.map((t) => "#" + t).join(" "));
    if (n.body.trim()) lines.push("", n.body.trim());
    if (n.quote) {
      lines.push("", ...n.quote.split("\n").map((l) => "> " + l));
      if (n.quoteTruncated) lines.push(">", "> _(alıntı sınırı nedeniyle kısaltıldı)_");
    }
    if (n.sourceUrl || n.sourceTitle) {
      const label = mdEsc(n.sourceTitle || sourceHost(n.sourceUrl) || n.sourceUrl);
      lines.push("", "Kaynak: " + (n.sourceUrl ? "[" + label + "](<" + n.sourceUrl + ">)" : label));
    }
    if (n.aiDraft && (n.aiDraft.summary || n.aiDraft.tasks.length || n.aiDraft.concepts.length)) {
      lines.push("", "<details><summary>MyMind taslağı (özgün metin değiştirilmedi)</summary>", "");
      if (n.aiDraft.summary) lines.push("**Özet:** " + n.aiDraft.summary, "");
      if (n.aiDraft.tasks.length) lines.push("**Görev önerileri:**", ...n.aiDraft.tasks.map((t) => "- [ ] " + t), "");
      if (n.aiDraft.concepts.length) lines.push("**Anahtar kavramlar:** " + n.aiDraft.concepts.join(", "), "");
      lines.push("</details>");
    }
    return lines.join("\n");
  }
  function exportMarkdown(notes, opts) {
    opts = opts || {};
    const list = notes.filter((n) => !(opts.excludePrivate && n.private));
    const head = ["# Note Master — dışa aktarım", "", "_" + list.length + " kayıt · " + str(opts.now || new Date().toISOString()).slice(0, 16).replace("T", " ") + (opts.excludePrivate ? " · gizli notlar hariç" : "") + "_", ""];
    return head.join("\n") + list.map(noteToMarkdown).join("\n\n---\n\n") + "\n";
  }
  function exportJson(notes, opts) {
    opts = opts || {};
    const list = notes.filter((n) => !(opts.excludePrivate && n.private));
    return JSON.stringify({ schema: SCHEMA, app: "note-master", exportedAt: opts.now || new Date().toISOString(), notes: list }, null, 2);
  }
  /* İçe aktarma: aynı şemadaki dosya; kimliği zaten olan not atlanır. */
  function importJson(text, existing, nowIso) {
    let d;
    try { d = JSON.parse(str(text, 20 * 1024 * 1024)); } catch { throw new Error("Dosya geçerli bir JSON değil."); }
    if (!d || d.schema !== SCHEMA || !Array.isArray(d.notes)) throw new Error("Dosya " + SCHEMA + " biçiminde değil.");
    const ids = new Set(existing.map((n) => n.id));
    const added = [];
    for (const raw of d.notes.slice(0, 5000)) {
      const n = normalizeNote(raw, { now: nowIso });
      if (ids.has(n.id)) continue;
      ids.add(n.id);
      added.push(n);
    }
    return { added, skipped: d.notes.length - added.length };
  }

  /* Model yükü: gizli not varsayılan olarak gönderilmez; e-posta/telefon/IBAN/TCKN maskelenir; kaynak adresinin yalnız alan adı gider. */
  function maskPii(s) {
    return str(s, MAX_BODY)
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[e-posta]")
      .replace(/\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, "[IBAN]")
      .replace(/(?<!\d)[1-9]\d{10}(?!\d)/g, "[TCKN]")
      .replace(/(?:\+90|0)?\s?\(?5\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, "[telefon]");
  }
  function aiPayload(note, settings) {
    const s = normalizeSettings(settings);
    if (note.private && !s.allowPrivateAi) {
      throw new Error("Bu not gizli olarak işaretli; gizli içerik varsayılan olarak modele gönderilmez (Ayarlar'dan açıkça izin verebilirsiniz).");
    }
    const text = (note.body + (note.quote ? "\n\nAlıntı:\n" + note.quote : "")).trim();
    if (text.length < AI_MIN_CHARS) throw new Error("Taslak için not en az " + AI_MIN_CHARS + " karakter olmalı (şu an " + text.length + ").");
    const masked = maskPii(text).slice(0, 8000);
    const host = sourceHost(note.sourceUrl);
    const sys =
      "Sen Note Master için not düzenleme yardımcısısın. Kullanıcının uzun notunu özet, görev ve anahtar kavram TASLAĞINA çevirirsin. " +
      "Özgün metni yeniden yazmazsın, düzeltmezsin, silmezsin. Notta olmayan bilgi eklemezsin. Anahtar kavramlar notta geçen ifadeler olmalı. " +
      'Yalnız şu JSON ile yanıt ver: {"ozet":"en çok 3 cümle","gorevler":["fiille başlayan kısa görev"],"kavramlar":["notta geçen kavram"]}';
    return {
      messages: [
        { role: "system", content: sys },
        { role: "user", content: "Başlık: " + maskPii(note.title) + (host ? "\nKaynak alan adı: " + host : "") + "\n\nNot:\n" + masked },
      ],
      sent: { chars: masked.length, host, masked: masked !== text.slice(0, 8000), private: note.private },
    };
  }
  function extractJson(text) {
    const s = str(text, 200000);
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const cand = fence ? fence[1] : s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1);
    try { return JSON.parse(cand); } catch { return null; }
  }
  /* Model çıktısı denetimi: özgün metni değiştirme girişimleri (metin/govde/duzeltilmis…) atılır; notta geçmeyen kavramlar atılır. */
  function validateAi(text, note, provider, nowIso) {
    const j = extractJson(text);
    if (!j || typeof j !== "object") throw new Error("Model yanıtı beklenen JSON biçiminde değil.");
    let droppedRewrites = 0;
    for (const k of Object.keys(j)) if (/^(metin|govde|gövde|body|text|duzeltilmis|düzeltilmiş|yeniden_?yazim|rewrite|yeniMetin)$/i.test(k)) droppedRewrites++;
    const hay = fold(note.title + " " + note.body + " " + note.quote);
    const conceptsRaw = (Array.isArray(j.kavramlar) ? j.kavramlar : Array.isArray(j.concepts) ? j.concepts : []).map((c) => str(c, 48).trim()).filter(Boolean);
    const concepts = [];
    let droppedConcepts = 0;
    for (const c of conceptsRaw) {
      const f = fold(c);
      if (f.length >= 2 && hay.includes(f) && !concepts.some((x) => fold(x) === f)) concepts.push(c);
      else droppedConcepts++;
    }
    const tasks = (Array.isArray(j.gorevler) ? j.gorevler : Array.isArray(j.tasks) ? j.tasks : [])
      .map((t) => str(typeof t === "object" && t ? t.baslik || t.title || "" : t, 160).replace(/^[-*\s[\]x]+/i, "").trim())
      .filter(Boolean);
    return normalizeDraft({
      summary: str(j.ozet || j.summary, 800).trim(),
      tasks: [...new Set(tasks)],
      concepts,
      droppedConcepts,
      droppedRewrites,
      provider,
      at: nowIso,
    });
  }
  /* Taslaktaki görev önerilerini, kaynağı ana nottan devralan ayrı görev kayıtlarına çevirir (özgün not değişmez). */
  function tasksFromDraft(note, indices, nowIso, settings) {
    if (!note.aiDraft) throw new Error("Bu notta MyMind taslağı yok.");
    const pick = (Array.isArray(indices) && indices.length ? indices : note.aiDraft.tasks.map((_t, i) => i)).filter((i) => note.aiDraft.tasks[i]);
    return pick.map((i) =>
      createNote(
        { kind: "gorev", title: note.aiDraft.tasks[i], body: note.aiDraft.tasks[i] + "\n\n(“" + note.title + "” notundan)", sourceUrl: note.sourceUrl, sourceTitle: note.sourceTitle || note.title, tags: note.tags, private: note.private, parentId: note.id },
        nowIso,
        settings
      )
    );
  }

  function isLoopbackUrl(u) {
    try {
      const x = new URL(u);
      return x.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(x.hostname) && !x.username && !x.password;
    } catch { return false; }
  }

  return {
    SCHEMA,
    KINDS,
    DEFAULT_QUOTE_LIMIT,
    AI_MIN_CHARS,
    TARGET_FIRST_NOTE_SECONDS,
    TARGET_WEEKLY_RECALLS,
    str,
    fold,
    normalizeTag,
    parseTags,
    mergeTags,
    normalizeSourceUrl,
    sourceHost,
    clipQuote,
    titleFrom,
    normalizeSettings,
    normalizeNote,
    createNote,
    updateNote,
    recordRecall,
    search,
    tagCloud,
    metrics,
    noteToMarkdown,
    exportMarkdown,
    exportJson,
    importJson,
    maskPii,
    aiPayload,
    validateAi,
    tasksFromDraft,
    isLoopbackUrl,
  };
});
