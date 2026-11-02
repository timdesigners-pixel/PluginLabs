/* Focus Orbit — çekirdek (saf işlevler; ana süreçte, arayüzde ve testlerde aynı kod çalışır).
 * Odak seansı: tek görev + süre. Zamanlayıcı zaman damgalarından hesaplanır (bilgisayar uykuya geçse de kayma olmaz).
 * Burada: ayar doğrulaması, zamanlayıcı durum makinesi, seans kaydı, haftalık ölçüler, dikkat listesi (site) normalleştirme,
 * içe/dışa aktarma, MyMind istek/yanıt doğrulaması. Dosya sistemine ve ağa erişmez; ekranı izlemez, hiçbir uygulamayı kapatmaz. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FOCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MIN = 60000;
  const ID_RE = /^[a-z0-9]{6,24}$/;
  const MAX_STEPS = 12;
  const MAX_SITES = 40;
  const MAX_SESSIONS = 2000;
  const PRESETS = [
    { key: "klasik", name: "Klasik", focusMin: 25, breakMin: 5 },
    { key: "derin", name: "Derin çalışma", focusMin: 50, breakMin: 10 },
    { key: "kisa", name: "Kısa adım", focusMin: 15, breakMin: 3 },
  ];
  const DEFAULT_SETTINGS = { focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4, autoBreak: true, bubbleOnStart: true, weeklyGoal: 3, reduceMotion: false, notify: true };

  function makeId() {
    let s = "";
    for (let i = 0; i < 12; i++) s += "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)];
    return s;
  }
  const str = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  function fold(s) {
    return String(s == null ? "" : s).toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  const clampInt = (v, lo, hi, def) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= lo && n <= hi ? n : def;
  };

  function normalizeSettings(raw) {
    const x = raw && typeof raw === "object" ? raw : {};
    const d = DEFAULT_SETTINGS;
    return {
      focusMin: clampInt(x.focusMin, 1, 180, d.focusMin),
      breakMin: clampInt(x.breakMin, 1, 60, d.breakMin),
      longBreakMin: clampInt(x.longBreakMin, 1, 90, d.longBreakMin),
      longEvery: clampInt(x.longEvery, 0, 12, d.longEvery),
      autoBreak: x.autoBreak == null ? d.autoBreak : !!x.autoBreak,
      bubbleOnStart: x.bubbleOnStart == null ? d.bubbleOnStart : !!x.bubbleOnStart,
      weeklyGoal: clampInt(x.weeklyGoal, 1, 50, d.weeklyGoal),
      reduceMotion: !!x.reduceMotion,
      notify: x.notify == null ? d.notify : !!x.notify,
    };
  }

  // ---- Görev ve adımlar ----
  function normalizeStep(s) {
    const text = str(s && typeof s === "object" ? s.text : s, 140);
    if (!text) return null;
    return { id: s && ID_RE.test(s.id) ? s.id : makeId(), text, done: !!(s && s.done), ai: !!(s && s.ai) };
  }
  function normalizeTask(raw) {
    const x = raw && typeof raw === "object" ? raw : {};
    const steps = [];
    for (const s of Array.isArray(x.steps) ? x.steps : []) {
      const n = normalizeStep(s);
      if (n && !steps.some((o) => fold(o.text) === fold(n.text))) steps.push(n);
      if (steps.length >= MAX_STEPS) break;
    }
    return { title: str(x.title, 120), steps };
  }

  // ---- Dikkat listesi (uzak durulacak siteler). 0.1.0: hatırlatma ve kesinti kaydı; engelleme Chrome eklentisiyle gelecek. ----
  function normalizeHost(v) {
    let t = str(v, 260).toLowerCase();
    if (!t) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(t)) t = "https://" + t;
    let u;
    try { u = new URL(t); } catch { return null; }
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    const h = u.hostname.replace(/^www\./, "").replace(/\.$/, "");
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && !/^xn--/.test(h)) return null;
    if (/^\d+(\.\d+){3}$/.test(h) || h === "localhost") return null;
    return h;
  }
  function normalizeSites(list) {
    const out = [];
    for (const s of Array.isArray(list) ? list : []) {
      const host = normalizeHost(s && typeof s === "object" ? s.host : s);
      if (!host || out.some((o) => o.host === host)) continue;
      out.push({ host, on: !(s && typeof s === "object" && s.on === false) });
      if (out.length >= MAX_SITES) break;
    }
    return out;
  }
  function parseSiteList(text) {
    return normalizeSites(String(text || "").split(/[\s,;]+/).filter(Boolean));
  }

  // ---- Zamanlayıcı: { phase: idle|focus|break, startedAt, durationMs, pausedAt, pausedMs, sessionId, long } ----
  const IDLE = Object.freeze({ phase: "idle" });
  function remaining(t, now) {
    if (!t || t.phase === "idle") return 0;
    const ref = t.pausedAt || now;
    return Math.max(0, t.durationMs - (ref - t.startedAt - (t.pausedMs || 0)));
  }
  function elapsed(t, now) {
    if (!t || t.phase === "idle") return 0;
    return Math.min(t.durationMs, (t.pausedAt || now) - t.startedAt - (t.pausedMs || 0));
  }
  function startFocus(settings, now, sessionId) {
    const s = normalizeSettings(settings);
    return { phase: "focus", startedAt: now, durationMs: s.focusMin * MIN, pausedAt: 0, pausedMs: 0, sessionId };
  }
  /** Kaçıncı odak seansından sonra uzun mola verileceği: bugün tamamlanan odak sayısına göre. */
  function startBreak(settings, now, completedToday) {
    const s = normalizeSettings(settings);
    const long = s.longEvery > 0 && completedToday > 0 && completedToday % s.longEvery === 0;
    return { phase: "break", startedAt: now, durationMs: (long ? s.longBreakMin : s.breakMin) * MIN, pausedAt: 0, pausedMs: 0, long };
  }
  function pause(t, now) {
    if (!t || t.phase === "idle" || t.pausedAt) return t;
    return { ...t, pausedAt: now };
  }
  function resume(t, now) {
    if (!t || !t.pausedAt) return t;
    return { ...t, pausedMs: (t.pausedMs || 0) + (now - t.pausedAt), pausedAt: 0 };
  }
  /** Süreyi uzat (yalnız etkin evrede, +1..+30 dk). */
  function extend(t, minutes) {
    if (!t || t.phase === "idle") return t;
    const m = clampInt(minutes, 1, 30, 5);
    return { ...t, durationMs: t.durationMs + m * MIN };
  }
  const isDue = (t, now) => !!t && t.phase !== "idle" && !t.pausedAt && remaining(t, now) <= 0;
  function fmt(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const two = (n) => String(n).padStart(2, "0");
    return h ? h + ":" + two(m) + ":" + two(s) : two(m) + ":" + two(s);
  }

  // ---- Seans kayıtları ----
  function newSession(task, settings, now) {
    const t = normalizeTask(task);
    return { id: makeId(), task: t.title || "Adsız görev", plannedMin: normalizeSettings(settings).focusMin, startedAt: now, endedAt: 0, focusMs: 0, status: "running", interruptions: [], stepsDone: 0, stepsTotal: t.steps.length, summary: "" };
  }
  function normalizeSession(x) {
    if (!x || typeof x !== "object") return null;
    const status = ["done", "stopped", "running"].includes(x.status) ? x.status : "stopped";
    const startedAt = Number(x.startedAt);
    if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
    return {
      id: ID_RE.test(x.id) ? x.id : makeId(),
      task: str(x.task, 120) || "Adsız görev",
      plannedMin: clampInt(x.plannedMin, 1, 180, 25),
      startedAt,
      endedAt: Number(x.endedAt) > 0 ? Number(x.endedAt) : 0,
      focusMs: Math.max(0, Math.min(Number(x.focusMs) || 0, 24 * 60 * MIN)),
      status: status === "running" ? "stopped" : status,
      interruptions: (Array.isArray(x.interruptions) ? x.interruptions : []).slice(0, 100).map((i) => ({ at: Number(i && i.at) || startedAt, site: normalizeHost(i && i.site) || "", note: str(i && i.note, 80) })),
      stepsDone: clampInt(x.stepsDone, 0, MAX_STEPS, 0),
      stepsTotal: clampInt(x.stepsTotal, 0, MAX_STEPS, 0),
      summary: str(x.summary, 400),
    };
  }
  function addInterruption(session, site, note, now) {
    if (!session) return session;
    const host = normalizeHost(site) || "";
    return { ...session, interruptions: session.interruptions.concat({ at: now, site: host, note: str(note, 80) }).slice(0, 100) };
  }

  /** Hafta başı (Pazartesi 00:00, yerel saat). */
  function weekStart(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const wd = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - wd);
    return d.getTime();
  }
  function dayStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function weekStats(sessions, now, goal) {
    const w0 = weekStart(now), prev = weekStart(w0 - 1);
    const pick = (a, b) => sessions.filter((s) => s.startedAt >= a && s.startedAt < b && s.status !== "running");
    const cur = pick(w0, w0 + 7 * 86400000), last = pick(prev, w0);
    const done = (l) => l.filter((s) => s.status === "done");
    const perSession = (l) => { const d = done(l); return d.length ? d.reduce((n, s) => n + s.interruptions.length, 0) / d.length : null; };
    const days = [];
    for (let i = 0; i < 7; i++) {
      const a = w0 + i * 86400000;
      const ds = done(cur).filter((s) => dayStart(s.startedAt) === dayStart(a));
      days.push({ day: a, done: ds.length, focusMin: Math.round(ds.reduce((n, s) => n + s.focusMs, 0) / MIN) });
    }
    const g = clampInt(goal, 1, 50, 3);
    const doneCount = done(cur).length;
    const ipsNow = perSession(cur), ipsLast = perSession(last);
    return {
      done: doneCount, stopped: cur.filter((s) => s.status === "stopped").length, goal: g, goalMet: doneCount >= g,
      focusMin: Math.round(done(cur).reduce((n, s) => n + s.focusMs, 0) / MIN),
      interruptionsPerSession: ipsNow, lastWeekInterruptionsPerSession: ipsLast, lastWeekDone: done(last).length,
      trend: ipsNow == null || ipsLast == null ? null : ipsNow < ipsLast ? "down" : ipsNow > ipsLast ? "up" : "same",
      days,
    };
  }
  const completedToday = (sessions, now) => sessions.filter((s) => s.status === "done" && dayStart(s.startedAt) === dayStart(now)).length;
  function topSites(sessions, n) {
    const m = new Map();
    for (const s of sessions) for (const i of s.interruptions) if (i.site) m.set(i.site, (m.get(i.site) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n || 5).map(([host, count]) => ({ host, count }));
  }

  // ---- İçe/dışa aktarma ----
  function exportData(d) {
    return JSON.stringify({ format: "pluginlabs-focus-orbit", version: 1, exportedAt: new Date().toISOString(), settings: normalizeSettings(d.settings), task: normalizeTask(d.task), sites: normalizeSites(d.sites), sessions: (d.sessions || []).map(normalizeSession).filter(Boolean) }, null, 2);
  }
  function importData(text, existing) {
    let j;
    try { j = JSON.parse(String(text || "")); } catch { throw new Error("Yedek dosyası okunamadı (JSON değil)."); }
    if (!j || j.format !== "pluginlabs-focus-orbit") throw new Error("Bu dosya bir Focus Orbit yedeği değil.");
    const have = new Set((existing || []).map((s) => s.id + ":" + s.startedAt));
    const incoming = (Array.isArray(j.sessions) ? j.sessions : []).map(normalizeSession).filter(Boolean);
    const sessions = incoming.filter((s) => !have.has(s.id + ":" + s.startedAt));
    return { sessions, sites: normalizeSites(j.sites), skipped: incoming.length - sessions.length + ((j.sessions || []).length - incoming.length) };
  }

  // ---- MyMind: görev parçalama ve seans sonu özeti. Gönderilecek veri her istekte onay penceresinde gösterilir. ----
  function splitPayload(task) {
    const title = str(task && task.title, 120);
    if (title.length < 3) throw new Error("Görev en az 3 karakter olmalı.");
    const sent = { task: title };
    return {
      sent,
      messages: [
        { role: "system", content: "Sen bir odak koçusun. Kullanıcının tek görevini, tek oturumda yapılabilecek 3-6 somut, kısa adıma böl. Ekran, uygulama ya da site kapatma önerme. Yalnız şu JSON'u ver: {\"adimlar\":[\"fiille başlayan kısa adım\"],\"ipucu\":\"tek cümle\"}" },
        { role: "user", content: "Görev: " + title },
      ],
    };
  }
  function parseJson(content) {
    const t = String(content == null ? "" : content).trim().replace(/^```[a-z]*\s*|\s*```$/g, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  }
  const BAD_STEP = /(kapat|engelle|sil|format|kayıt defteri|regedit|parola|şifre)/i;
  /** Adım doğrulaması: metin, ≤140 karakter, en fazla 6, yinelenmez, mevcut adımlarla çakışmaz; kapatma/silme içerenler atılır. */
  function validateSteps(content, task) {
    const j = parseJson(content);
    if (!j) return { ok: false, error: "MyMind yanıtı beklenen biçimde değil." };
    const have = new Set(normalizeTask(task).steps.map((s) => fold(s.text)));
    const out = [];
    let rejected = 0;
    for (const s of Array.isArray(j.adimlar) ? j.adimlar : Array.isArray(j.steps) ? j.steps : []) {
      const text = str(typeof s === "string" ? s : s && (s.metin || s.text), 140);
      if (!text || text.length < 3 || BAD_STEP.test(text) || have.has(fold(text)) || out.some((o) => fold(o) === fold(text))) { rejected++; continue; }
      out.push(text);
      if (out.length >= 6) break;
    }
    return { ok: true, steps: out, tip: str(j.ipucu || j.tip, 160), rejected };
  }
  function summaryPayload(session, task) {
    if (!session) throw new Error("Seans bulunamadı.");
    const t = normalizeTask(task);
    const steps = session.task === t.title ? t.steps.map((s) => (s.done ? "[x] " : "[ ] ") + s.text) : [];
    const sent = {
      task: session.task, plannedMin: session.plannedMin, focusMin: Math.round(session.focusMs / MIN),
      status: session.status === "done" ? "tamamlandı" : "erken bitirildi", interruptions: session.interruptions.length, steps,
    };
    return {
      sent,
      messages: [
        { role: "system", content: "Sen bir odak koçusun. Seans bilgisinden en fazla iki cümlelik, yargısız bir özet ve tek bir sonraki adım yaz. Yalnız şu JSON'u ver: {\"ozet\":\"en fazla iki cümle\",\"sonraki\":\"tek kısa adım\"}" },
        { role: "user", content: "Görev: " + sent.task + "\nPlan: " + sent.plannedMin + " dk, odak: " + sent.focusMin + " dk (" + sent.status + ")\nBildirilen dikkat kesintisi: " + sent.interruptions + (steps.length ? "\nAdımlar:\n" + steps.join("\n") : "") },
      ],
    };
  }
  function validateSummary(content) {
    const j = parseJson(content);
    if (!j) return { ok: false, error: "MyMind yanıtı beklenen biçimde değil." };
    const summary = str(j.ozet || j.summary, 320);
    const next = str(j.sonraki || j.next, 120);
    if (!summary) return { ok: false, error: "MyMind özet döndürmedi." };
    return { ok: true, summary, next: BAD_STEP.test(next) ? "" : next };
  }

  function formatWhen(ts, now) {
    if (!ts) return "";
    const d = new Date(ts), n = new Date(now || Date.now());
    const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === n.toDateString()) return "bugün " + time;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) + " " + time;
  }

  return { MIN, ID_RE, MAX_STEPS, MAX_SITES, MAX_SESSIONS, PRESETS, DEFAULT_SETTINGS, IDLE, makeId, str, fold, normalizeSettings, normalizeStep, normalizeTask, normalizeHost, normalizeSites, parseSiteList,
    remaining, elapsed, startFocus, startBreak, pause, resume, extend, isDue, fmt, newSession, normalizeSession, addInterruption, weekStart, weekStats, completedToday, topSites,
    exportData, importData, splitPayload, validateSteps, summaryPayload, validateSummary, formatWhen };
});
