/* Daily Brief Widget — çekirdek (saf işlevler; ana süreçte, arayüzde ve testlerde aynı kod çalışır).
 * Bugün görünümü: yerel görevler + kullanıcının eklediği takvimler (yerel etkinlik, .ics dosyası, izin verilen .ics adresi).
 * Burada: ayar/görev/etkinlik doğrulaması, iCalendar (RFC 5545) ayrıştırma ve tekrar açılımı, günün özeti (etkinlikler, görevler,
 * çakışmalar, boş aralıklar, kural tabanlı kısa plan), hassas başlık gizleme, veri tazeliği, ölçüler, içe/dışa aktarma ve
 * MyMind istek/yanıt doğrulaması. Dosya sistemine ve ağa erişmez; takvime hiçbir şey yazmaz. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DBCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MIN = 60000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const ID_RE = /^[a-z0-9]{6,24}$/;
  const MAX_TASKS = 500;
  const MAX_LOCAL_EVENTS = 1000;
  const MAX_SOURCES = 12;
  const MAX_ICS_EVENTS = 5000;
  const MAX_ICS_BYTES = 5 * 1024 * 1024;
  const LOCAL_ID = "yerelkaynak";
  const REFRESH_CHOICES = [15, 30, 60, 180, 720, 1440];
  const DEFAULT_SETTINGS = {
    workStart: "09:00", workEnd: "18:00", briefTime: "08:00", notify: true, widgetOnStart: true,
    hideSensitive: false, sensitiveWords: ["doktor", "hastane", "maaş", "banka"], reduceMotion: false, defaultTaskMin: 30,
  };

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
  const pad = (n) => String(n).padStart(2, "0");
  // ID_RE.test(undefined) "undefined" metnini eşleştirir; önce tür denetlenir.
  const validId = (v) => typeof v === "string" && ID_RE.test(v);

  // ---- Tarih yardımcıları (yerel saat) ----
  function dayStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function addDays(ts, n) { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); }
  function dateKey(ts) { const d = new Date(ts); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseDateKey(k) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(k || ""));
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d.getTime() : null;
  }
  function parseHM(v) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return +m[1] * 60 + +m[2];
  }
  const hm = (mins) => pad(Math.floor(mins / 60)) + ":" + pad(mins % 60);
  const clock = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const atMinutes = (day, mins) => { const d = new Date(day); d.setHours(Math.floor(mins / 60), mins % 60, 0, 0); return d.getTime(); };

  function normalizeSettings(raw) {
    const x = raw && typeof raw === "object" ? raw : {};
    const d = DEFAULT_SETTINGS;
    const hmOr = (v, def) => (parseHM(v) == null ? def : hm(parseHM(v)));
    let workStart = hmOr(x.workStart, d.workStart), workEnd = hmOr(x.workEnd, d.workEnd);
    if (parseHM(workEnd) <= parseHM(workStart)) { workStart = d.workStart; workEnd = d.workEnd; }
    const words = Array.isArray(x.sensitiveWords) ? x.sensitiveWords : typeof x.sensitiveWords === "string" ? x.sensitiveWords.split(/[,;\n]/) : d.sensitiveWords;
    return {
      workStart, workEnd, briefTime: hmOr(x.briefTime, d.briefTime),
      notify: x.notify == null ? d.notify : !!x.notify,
      widgetOnStart: x.widgetOnStart == null ? d.widgetOnStart : !!x.widgetOnStart,
      hideSensitive: !!x.hideSensitive,
      sensitiveWords: [...new Set(words.map((w) => str(w, 40)).filter((w) => w.length >= 2).map((w) => w.toLocaleLowerCase("tr-TR")))].slice(0, 40),
      reduceMotion: !!x.reduceMotion,
      defaultTaskMin: clampInt(x.defaultTaskMin, 5, 480, d.defaultTaskMin),
    };
  }

  // ---- Görevler ----
  function normalizeTask(x) {
    if (!x || typeof x !== "object") return null;
    const title = str(x.title, 140);
    if (!title) return null;
    const due = parseDateKey(x.due) == null ? "" : x.due;
    const time = due && parseHM(x.time) != null ? hm(parseHM(x.time)) : "";
    return {
      id: validId(x.id) ? x.id : makeId(), title, due, time,
      durationMin: clampInt(x.durationMin, 5, 480, 30), priority: clampInt(x.priority, 1, 3, 2),
      sensitive: !!x.sensitive, done: !!x.done, doneAt: x.done && Number.isFinite(x.doneAt) ? x.doneAt : null,
      createdAt: Number.isFinite(x.createdAt) ? x.createdAt : Date.now(), note: str(x.note, 300),
    };
  }
  const normalizeTasks = (list) => (Array.isArray(list) ? list : []).map(normalizeTask).filter(Boolean).slice(0, MAX_TASKS);

  // ---- Etkinlikler ve kaynaklar ----
  const FREQS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
  const WD = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  function normalizeRule(r) {
    if (!r || typeof r !== "object" || !FREQS.includes(r.freq)) return null;
    return {
      freq: r.freq, interval: clampInt(r.interval, 1, 400, 1), count: r.count == null ? null : clampInt(r.count, 1, 10000, null),
      until: Number.isFinite(r.until) ? r.until : null, byday: Array.isArray(r.byday) ? r.byday.filter((d) => WD.includes(d)) : [],
    };
  }
  function normalizeEvent(x) {
    if (!x || typeof x !== "object") return null;
    const title = str(x.title, 200) || "(başlıksız)";
    if (!Number.isFinite(x.start)) return null;
    const allDay = !!x.allDay;
    let end = Number.isFinite(x.end) && x.end > x.start ? x.end : x.start + (allDay ? DAY : HOUR);
    if (end - x.start > 60 * DAY) end = x.start + 60 * DAY;
    return {
      id: validId(x.id) ? x.id : makeId(), uid: str(x.uid, 200), title, start: x.start, end, allDay, location: str(x.location, 160),
      sensitive: !!x.sensitive, rule: normalizeRule(x.rule), exdates: Array.isArray(x.exdates) ? x.exdates.filter(Number.isFinite).slice(0, 500) : [],
    };
  }
  function normalizeSource(x) {
    if (!x || typeof x !== "object") return null;
    const kind = ["local", "file", "url"].includes(x.kind) ? x.kind : null;
    if (!kind) return null;
    const id = kind === "local" ? LOCAL_ID : validId(x.id) ? x.id : makeId();
    const max = kind === "local" ? MAX_LOCAL_EVENTS : MAX_ICS_EVENTS;
    return {
      id, kind, name: str(x.name, 60) || (kind === "local" ? "Yerel etkinlikler" : "Takvim"),
      url: kind === "url" ? str(x.url, 1000) : "", file: kind === "file" ? str(x.file, 260) : "",
      refreshMin: REFRESH_CHOICES.includes(Number(x.refreshMin)) ? Number(x.refreshMin) : 60,
      lastFetched: Number.isFinite(x.lastFetched) ? x.lastFetched : null, lastError: str(x.lastError, 200),
      enabled: x.enabled == null ? true : !!x.enabled, hideAll: !!x.hideAll, tzUnknown: clampInt(x.tzUnknown, 0, 100000, 0),
      events: (Array.isArray(x.events) ? x.events : []).map(normalizeEvent).filter(Boolean).slice(0, max),
    };
  }
  function normalizeSources(list) {
    const out = (Array.isArray(list) ? list : []).map(normalizeSource).filter(Boolean);
    const seen = new Set();
    const uniq = out.filter((s) => (seen.has(s.id) ? false : seen.add(s.id)));
    if (!uniq.some((s) => s.kind === "local")) uniq.unshift(normalizeSource({ kind: "local", events: [] }));
    return uniq.slice(0, MAX_SOURCES + 1);
  }

  /** Abonelik adresi: yalnız https (webcal:// → https://); kullanıcı adı/parola, yerel ağ ve IP adresleri reddedilir. */
  function normalizeIcsUrl(v, allowLoopback) {
    let s = String(v == null ? "" : v).trim();
    if (/^webcals?:\/\//i.test(s)) s = s.replace(/^webcals?:\/\//i, "https://");
    let u;
    try { u = new URL(s); } catch { throw new Error("Geçerli bir takvim adresi girin (https://… .ics)."); }
    const loop = allowLoopback && u.protocol === "http:" && u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !loop) throw new Error("Yalnız https:// (ya da webcal://) takvim adresleri kabul edilir.");
    if (u.username || u.password) throw new Error("Kullanıcı adı/parola içeren adresler kabul edilmez.");
    const h = u.hostname.toLowerCase();
    if (!loop && (h === "localhost" || /\.local$|\.lan$|\.internal$/.test(h) || /^[\d.]+$/.test(h) || h.includes(":"))) throw new Error("Yerel ağ ya da IP adresleri kabul edilmez; takvim sağlayıcısının paylaşım adresini kullanın.");
    if (s.length > 1000) throw new Error("Adres çok uzun.");
    return u.toString();
  }
  /** Arayüzde adresin tamamı (gizli anahtar içerebilir) yerine yalnız sağlayıcı alan adı gösterilir. */
  function sourceLink(src) {
    if (src.kind === "local") return "Bu bilgisayar";
    if (src.kind === "file") return src.file || "ICS dosyası";
    try { return new URL(src.url).hostname; } catch { return "adres"; }
  }

  // ---- iCalendar ayrıştırma ----
  const WIN_TZ = {
    "Turkey Standard Time": "Europe/Istanbul", "GTB Standard Time": "Europe/Bucharest", "W. Europe Standard Time": "Europe/Berlin",
    "Central Europe Standard Time": "Europe/Budapest", "Romance Standard Time": "Europe/Paris", "GMT Standard Time": "Europe/London",
    "E. Europe Standard Time": "Europe/Chisinau", "FLE Standard Time": "Europe/Kiev", "Russian Standard Time": "Europe/Moscow",
    "Arabic Standard Time": "Asia/Baghdad", "Arab Standard Time": "Asia/Riyadh", "Eastern Standard Time": "America/New_York",
    "Central Standard Time": "America/Chicago", "Mountain Standard Time": "America/Denver", "Pacific Standard Time": "America/Los_Angeles",
    UTC: "UTC", "Coordinated Universal Time": "UTC",
  };
  const tzOk = (tz) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };
  /** Duvar saati (y-m-d h:m:s, verilen saat diliminde) → UTC ms. İki adım düzeltme yaz saati geçişlerini karşılar. */
  function zonedToUtc(y, mo, d, h, mi, s, tz) {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const want = Date.UTC(y, mo - 1, d, h, mi, s);
    let t = want;
    for (let i = 0; i < 3; i++) {
      const p = {};
      for (const x of f.formatToParts(new Date(t))) p[x.type] = +x.value;
      const got = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
      if (got === want) break;
      t += want - got;
    }
    return t;
  }
  function unescapeText(v) { return String(v).replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1"); }
  function parseLine(line) {
    // AD;PARAM=DEĞER;PARAM="a:b":DEĞER — tırnak içindeki ':' ve ';' bölmez.
    let i = 0, q = false;
    for (; i < line.length; i++) { const c = line[i]; if (c === '"') q = !q; else if (c === ":" && !q) break; }
    const head = line.slice(0, i), value = line.slice(i + 1);
    const parts = head.match(/(?:[^;"]+|"[^"]*")+/g) || [""];
    const params = {};
    for (const p of parts.slice(1)) { const k = p.indexOf("="); if (k > 0) params[p.slice(0, k).toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, ""); }
    return { name: parts[0].toUpperCase(), params, value };
  }
  function parseIcsDate(value, params, stats) {
    const v = String(value || "").trim();
    let m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (m || params.VALUE === "DATE") {
      m = m || /^(\d{4})(\d{2})(\d{2})/.exec(v);
      if (!m) return null;
      return { ts: new Date(+m[1], +m[2] - 1, +m[3]).getTime(), allDay: true };
    }
    m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
    if (!m) return null;
    const a = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0)];
    if (m[7]) return { ts: Date.UTC(a[0], a[1] - 1, a[2], a[3], a[4], a[5]), allDay: false };
    const tzid = params.TZID ? String(params.TZID).replace(/^\/+/, "") : "";
    const tz = tzid && (tzOk(tzid) ? tzid : WIN_TZ[tzid]);
    if (tz) return { ts: zonedToUtc(a[0], a[1], a[2], a[3], a[4], a[5], tz), allDay: false };
    if (tzid && stats) stats.tzUnknown++;
    return { ts: new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5]).getTime(), allDay: false };
  }
  function parseDuration(v) {
    const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v || "").trim());
    if (!m) return null;
    const ms = ((+m[2] || 0) * 7 * DAY) + ((+m[3] || 0) * DAY) + ((+m[4] || 0) * HOUR) + ((+m[5] || 0) * MIN) + ((+m[6] || 0) * 1000);
    return m[1] === "-" ? -ms : ms;
  }
  function parseRule(v, stats) {
    const r = {};
    for (const p of String(v || "").split(";")) { const k = p.indexOf("="); if (k > 0) r[p.slice(0, k).toUpperCase()] = p.slice(k + 1); }
    if (!FREQS.includes(r.FREQ)) { if (stats) stats.unsupportedRule++; return null; }
    let until = null;
    if (r.UNTIL) { const d = parseIcsDate(r.UNTIL, {}, null); until = d ? (d.allDay ? d.ts + DAY - 1 : d.ts) : null; }
    // BYSETPOS, BYMONTHDAY listeleri gibi ileri kurallar desteklenmez: ilk tekrar biçimi kullanılır ve sayılır.
    if (r.BYSETPOS || r.BYWEEKNO || r.BYYEARDAY || (r.BYDAY && r.FREQ !== "WEEKLY")) if (stats) stats.unsupportedRule++;
    return normalizeRule({
      freq: r.FREQ, interval: r.INTERVAL ? +r.INTERVAL : 1, count: r.COUNT ? +r.COUNT : null, until,
      byday: r.FREQ === "WEEKLY" && r.BYDAY ? r.BYDAY.split(",").map((d) => d.replace(/^[+-]?\d+/, "").toUpperCase()) : [],
    });
  }
  /** .ics metni → etkinlikler. Satır katlama, kaçış karakterleri, TZID/UTC/tarih, DURATION, RRULE (DAILY/WEEKLY+BYDAY/MONTHLY/YEARLY,
   * INTERVAL, COUNT, UNTIL), EXDATE, RECURRENCE-ID (tek tekrarı değiştiren kayıt) ve iptal edilen (STATUS:CANCELLED) etkinlikler. */
  function parseICS(text) {
    const raw = String(text == null ? "" : text);
    if (raw.length > MAX_ICS_BYTES) throw new Error("Takvim dosyası 5 MB'tan büyük.");
    if (!/BEGIN:VCALENDAR/i.test(raw)) throw new Error("Bu bir iCalendar (.ics) takvimi değil.");
    const lines = raw.replace(/\r\n|\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
    const stats = { tzUnknown: 0, unsupportedRule: 0, cancelled: 0, skipped: 0, total: 0 };
    const items = [];
    let cur = null, depth = 0, calName = "";
    for (const line of lines) {
      if (!line) continue;
      const { name, params, value } = parseLine(line);
      if (name === "BEGIN" && /^VEVENT$/i.test(value)) { cur = { params: {} }; depth = 0; continue; }
      if (!cur) { if (name === "X-WR-CALNAME") calName = str(unescapeText(value), 60); continue; }
      if (name === "BEGIN") { depth++; continue; }
      if (name === "END" && depth > 0) { depth--; continue; }
      if (depth > 0) continue; // VALARM vb. iç bileşenler
      if (name === "END" && /^VEVENT$/i.test(value)) { items.push(cur); cur = null; if (items.length > MAX_ICS_EVENTS * 2) break; continue; }
      if (name === "SUMMARY") cur.title = unescapeText(value);
      else if (name === "LOCATION") cur.location = unescapeText(value);
      else if (name === "UID") cur.uid = value.trim();
      else if (name === "STATUS") cur.status = value.trim().toUpperCase();
      else if (name === "CLASS") cur.cls = value.trim().toUpperCase();
      else if (name === "DTSTART") cur.dtstart = parseIcsDate(value, params, stats);
      else if (name === "DTEND") cur.dtend = parseIcsDate(value, params, stats);
      else if (name === "DURATION") cur.duration = parseDuration(value);
      else if (name === "RRULE") cur.rule = parseRule(value, stats);
      else if (name === "RECURRENCE-ID") cur.recur = parseIcsDate(value, params, stats);
      else if (name === "EXDATE") {
        cur.ex = cur.ex || [];
        for (const v of value.split(",")) { const d = parseIcsDate(v, params, stats); if (d) cur.ex.push(d.ts); }
      }
    }
    stats.total = items.length;
    const masters = new Map();
    const out = [];
    const overrides = [];
    for (const it of items) {
      if (!it.dtstart) { stats.skipped++; continue; }
      const allDay = it.dtstart.allDay;
      let end = it.dtend ? it.dtend.ts : it.duration != null ? it.dtstart.ts + it.duration : it.dtstart.ts + (allDay ? DAY : 0);
      if (end <= it.dtstart.ts) end = it.dtstart.ts + (allDay ? DAY : 30 * MIN);
      const ev = normalizeEvent({ uid: it.uid, title: it.title, location: it.location, start: it.dtstart.ts, end, allDay, rule: it.recur ? null : it.rule, exdates: it.ex, sensitive: it.cls === "PRIVATE" || it.cls === "CONFIDENTIAL" });
      if (!ev) { stats.skipped++; continue; }
      if (it.recur) { overrides.push({ ev, recur: it.recur.ts, cancelled: it.status === "CANCELLED" }); continue; }
      if (it.status === "CANCELLED") { stats.cancelled++; continue; }
      if (ev.uid && ev.rule) masters.set(ev.uid, ev);
      out.push(ev);
    }
    for (const o of overrides) {
      const m = masters.get(o.ev.uid);
      if (m) m.exdates.push(o.recur);
      if (o.cancelled) stats.cancelled++;
      else out.push(o.ev);
    }
    return { events: out.slice(0, MAX_ICS_EVENTS), name: calName, stats: { ...stats, kept: Math.min(out.length, MAX_ICS_EVENTS) } };
  }

  // ---- Tekrar açılımı: [from, to) aralığına düşen tekrarlar (yerel duvar saatine göre adım) ----
  function occurrences(ev, from, to) {
    const dur = ev.end - ev.start;
    const out = [];
    const push = (s) => { if (s < to && s + dur > from && !ev.exdates.includes(s)) out.push({ start: s, end: s + dur }); };
    const r = ev.rule;
    if (!r) { push(ev.start); return out; }
    const until = r.until == null ? Infinity : r.until;
    const limit = r.count == null ? Infinity : r.count;
    const base = new Date(ev.start);
    let n = 0;
    const atOffset = (fn) => { const d = new Date(base); fn(d); return d.getTime(); };
    for (let k = 0; k < 20000; k++) {
      if (r.freq === "WEEKLY" && r.byday.length) {
        const wkStart = atOffset((d) => { const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd + k * 7 * r.interval); });
        if (wkStart - 7 * DAY >= to || wkStart > until) break;
        const days = r.byday.map((x) => (WD.indexOf(x) + 6) % 7).sort((a, b) => a - b);
        for (const off of days) {
          const s = addDays(wkStart, off);
          if (s < ev.start) continue;
          if (s > until || n >= limit) return out;
          n++;
          push(s);
        }
        continue;
      }
      let s;
      if (r.freq === "DAILY") s = atOffset((d) => d.setDate(d.getDate() + k * r.interval));
      else if (r.freq === "WEEKLY") s = atOffset((d) => d.setDate(d.getDate() + 7 * k * r.interval));
      else if (r.freq === "MONTHLY") {
        s = atOffset((d) => { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + k * r.interval); d.setDate(day); });
        if (new Date(s).getDate() !== base.getDate()) continue; // 31'i olmayan ay atlanır (RFC 5545)
      } else {
        s = atOffset((d) => { const day = d.getDate(), mo = d.getMonth(); d.setDate(1); d.setFullYear(d.getFullYear() + k * r.interval); d.setMonth(mo); d.setDate(day); });
        if (new Date(s).getDate() !== base.getDate()) continue; // 29 Şubat
      }
      if (s > until || n >= limit || s >= to) break;
      n++;
      push(s);
    }
    return out;
  }

  // ---- Gizleme ----
  function isSensitive(item, settings, source) {
    if (item.sensitive || (source && source.hideAll)) return true;
    const t = fold(item.title);
    return (settings.sensitiveWords || []).some((w) => t.includes(fold(w)));
  }
  const maskWord = (kind) => (kind === "task" ? "Özel görev" : "Özel etkinlik");

  // ---- Günün özeti ----
  /** Kaynak tazeliği: adres kaynakları yenileme süresinin iki katından eskiyse "eskimiş". Dosya ve yerel kaynak eskimez (siz güncellersiniz). */
  function freshness(src, now) {
    if (src.kind !== "url") return { stale: false, ageMin: src.lastFetched ? Math.round((now - src.lastFetched) / MIN) : null };
    if (!src.lastFetched) return { stale: true, ageMin: null };
    const age = now - src.lastFetched;
    return { stale: age > 2 * src.refreshMin * MIN, ageMin: Math.round(age / MIN) };
  }
  function freeSlots(busy, from, to, minLen) {
    const iv = busy.filter((b) => b.end > from && b.start < to).map((b) => [Math.max(b.start, from), Math.min(b.end, to)]).sort((a, b) => a[0] - b[0]);
    const out = [];
    let t = from;
    for (const [s, e] of iv) { if (s - t >= minLen) out.push({ start: t, end: s }); t = Math.max(t, e); }
    if (to - t >= minLen) out.push({ start: t, end: to });
    return out;
  }
  const roundUp = (ts, step) => Math.ceil(ts / step) * step;

  function brief(d, now) {
    const S = normalizeSettings(d.settings);
    const today = dayStart(now), tomorrow = addDays(today, 1), key = dateKey(now);
    const events = [];
    const sources = [];
    for (const src of d.sources || []) {
      const f = freshness(src, now);
      let count = 0;
      if (src.enabled) {
        for (const ev of src.events) {
          for (const o of occurrences(ev, today, tomorrow)) {
            const sens = isSensitive(ev, S, src);
            events.push({
              key: src.id + ":" + ev.id + ":" + o.start, sourceId: src.id, eventId: ev.id, source: src.name, title: sens && S.hideSensitive ? maskWord("event") : ev.title,
              sensitive: sens, location: sens && S.hideSensitive ? "" : ev.location, start: o.start, end: o.end, allDay: ev.allDay || (o.start <= today && o.end >= tomorrow), stale: f.stale,
            });
            count++;
          }
        }
      }
      sources.push({ id: src.id, kind: src.kind, name: src.name, link: sourceLink(src), enabled: src.enabled, lastFetched: src.lastFetched, lastError: src.lastError, refreshMin: src.refreshMin, stale: src.enabled && f.stale, ageMin: f.ageMin, today: count, total: src.events.length, hideAll: src.hideAll, tzUnknown: src.tzUnknown });
    }
    events.sort((a, b) => (b.allDay - a.allDay) || a.start - b.start || a.title.localeCompare(b.title, "tr"));
    const timed = events.filter((e) => !e.allDay);
    const next = timed.find((e) => e.end > now) || null;

    const view = (t) => { const sens = isSensitive(t, S); return { ...t, sensitive: sens, title: sens && S.hideSensitive ? maskWord("task") : t.title }; };
    const open = (d.tasks || []).filter((t) => !t.done);
    const overdue = open.filter((t) => t.due && t.due < key).sort((a, b) => a.due.localeCompare(b.due) || a.priority - b.priority).map(view);
    const dueToday = open.filter((t) => t.due === key).sort((a, b) => (a.time || "99").localeCompare(b.time || "99") || a.priority - b.priority).map(view);
    const undated = open.filter((t) => !t.due).sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt).map(view);
    const upcoming = open.filter((t) => t.due && t.due > key).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5).map(view);
    const doneToday = (d.tasks || []).filter((t) => t.done && t.doneAt && t.doneAt >= today && t.doneAt < tomorrow).map(view);

    // Çakışmalar: zamanlı etkinlik çiftleri ve saatli görev × etkinlik. Yalnız öneri; takvime yazılmaz.
    const conflicts = [];
    for (let i = 0; i < timed.length; i++)
      for (let j = i + 1; j < timed.length; j++) {
        const a = timed[i], b = timed[j];
        if (a.start < b.end && b.start < a.end) {
          const mins = Math.round((Math.min(a.end, b.end) - Math.max(a.start, b.start)) / MIN);
          conflicts.push({ kind: "event", a: a.key, b: b.key, minutes: mins, text: "“" + a.title + "” (" + clock(a.start) + "–" + clock(a.end) + ") ile “" + b.title + "” (" + clock(b.start) + "–" + clock(b.end) + ") " + mins + " dk çakışıyor.", tip: "Öneri: birini kaydırmayı ya da katılımcılara haber vermeyi düşünün. Takvim otomatik değiştirilmez." });
        }
      }
    for (const t of dueToday.filter((x) => x.time)) {
      const s = atMinutes(today, parseHM(t.time)), e = s + t.durationMin * MIN;
      for (const ev of timed) if (s < ev.end && ev.start < e) conflicts.push({ kind: "task", a: t.id, b: ev.key, minutes: Math.round((Math.min(e, ev.end) - Math.max(s, ev.start)) / MIN), text: "Görev “" + t.title + "” (" + t.time + ") “" + ev.title + "” ile çakışıyor.", tip: "Öneri: görevi aşağıdaki boş aralıklardan birine alın." });
    }

    // Boş aralıklar (çalışma saatleri içinde, şimdiden sonrası) ve kural tabanlı kısa plan.
    const ws = atMinutes(today, parseHM(S.workStart)), we = atMinutes(today, parseHM(S.workEnd));
    const busy = timed.map((e) => ({ start: e.start, end: e.end }));
    for (const t of dueToday.filter((x) => x.time)) { const s = atMinutes(today, parseHM(t.time)); busy.push({ start: s, end: s + t.durationMin * MIN }); }
    const from = Math.max(ws, roundUp(now, 5 * MIN));
    const slots = from < we ? freeSlots(busy, from, we, 15 * MIN) : [];
    const plan = [], unplaced = [];
    const cand = [...overdue, ...dueToday.filter((t) => !t.time), ...undated.filter((t) => t.priority === 1)].sort((a, b) => a.priority - b.priority);
    const free = slots.map((s) => ({ ...s }));
    for (const t of cand) {
      const need = t.durationMin * MIN;
      const slot = free.find((s) => s.end - s.start >= need);
      if (!slot) { unplaced.push({ id: t.id, title: t.title, durationMin: t.durationMin }); continue; }
      plan.push({ start: slot.start, end: slot.start + need, taskId: t.id, title: t.title, why: t.due && t.due < key ? "gecikmiş" : t.due === key ? "bugün" : "yüksek öncelik" });
      slot.start += need;
    }
    for (const t of dueToday.filter((x) => x.time)) { const s = atMinutes(today, parseHM(t.time)); plan.push({ start: s, end: s + t.durationMin * MIN, taskId: t.id, title: t.title, why: "saatli görev", fixed: true }); }
    plan.sort((a, b) => a.start - b.start);
    const freeMin = Math.round(slots.reduce((n, s) => n + (s.end - s.start), 0) / MIN);
    const busyMin = Math.round(timed.reduce((n, e) => n + Math.max(0, Math.min(e.end, we) - Math.max(e.start, ws)), 0) / MIN);
    const stale = events.filter((e) => e.stale).length;
    const lastData = sources.filter((s) => s.enabled && s.kind === "url" && s.lastFetched).reduce((m, s) => Math.min(m, s.lastFetched), Infinity);
    return {
      date: key, now, events, next, overdue, dueToday, undated: undated.slice(0, 5), upcoming, doneToday, conflicts, slots, plan, unplaced,
      freeMin, busyMin, sources, staleEvents: stale, oldestFetch: Number.isFinite(lastData) ? lastData : null, hidden: S.hideSensitive,
      headline: headline(events, dueToday.length + overdue.length, conflicts.length),
    };
  }
  function headline(events, tasks, conflicts) {
    const p = [];
    p.push(events.length ? events.length + " etkinlik" : "etkinlik yok");
    p.push(tasks ? tasks + " görev" : "bugüne görev yok");
    if (conflicts) p.push(conflicts + " çakışma");
    return p.join(" · ");
  }

  // ---- Ölçüler (Notion doğrulama ölçütü: sabah özeti okuma ≥%60; yanlış/eskimiş etkinlik oranı <%1) ----
  function normalizeMetrics(x) {
    const days = {};
    const src = x && typeof x === "object" && x.days && typeof x.days === "object" ? x.days : {};
    for (const k of Object.keys(src).filter((k) => parseDateKey(k) != null).sort().slice(-90)) {
      const v = src[k] || {};
      days[k] = { shown: !!v.shown, readAt: Number.isFinite(v.readAt) ? v.readAt : null, events: clampInt(v.events, 0, 100000, 0), stale: clampInt(v.stale, 0, 100000, 0), flagged: Array.isArray(v.flagged) ? v.flagged.map((f) => str(f, 120)).filter(Boolean).slice(0, 200) : [] };
    }
    return { days };
  }
  /** Gün içinde gösterilen en büyük etkinlik sayısı ve o andaki eskimiş sayısı kaydedilir (gün sonunda değil; uygulama kapalı olabilir). */
  function recordShown(m, b) {
    const d = m.days[b.date] || { shown: false, readAt: null, events: 0, stale: 0, flagged: [] };
    d.shown = true;
    if (b.events.length >= d.events) { d.events = b.events.length; d.stale = b.staleEvents; }
    m.days[b.date] = d;
    return m;
  }
  function markRead(m, date, now) { const d = m.days[date] || { shown: true, readAt: null, events: 0, stale: 0, flagged: [] }; d.shown = true; d.readAt = d.readAt || now; m.days[date] = d; return m; }
  function flagEvent(m, date, key) { const d = m.days[date] || { shown: true, readAt: null, events: 0, stale: 0, flagged: [] }; if (!d.flagged.includes(key)) d.flagged.push(key); m.days[date] = d; return m; }
  function stats(m, now, days) {
    const n = days || 14;
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(dateKey(addDays(dayStart(now), -i)));
    let shown = 0, read = 0, events = 0, bad = 0, flagged = 0;
    for (const k of keys) { const d = m.days[k]; if (!d || !d.shown) continue; shown++; if (d.readAt) read++; events += d.events; bad += d.stale + d.flagged.length; flagged += d.flagged.length; }
    return { days: n, shown, read, readRate: shown ? read / shown : null, events, bad, flagged, badRate: events ? bad / events : null, readGoal: 0.6, badGoal: 0.01 };
  }

  // ---- İçe/dışa aktarma ----
  function exportData(d) {
    const sources = normalizeSources(d.sources).map((s) => ({ ...s, url: "" , lastError: "" }));
    return JSON.stringify({ format: "pluginlabs-daily-brief", version: 1, exportedAt: new Date().toISOString(), settings: normalizeSettings(d.settings), tasks: normalizeTasks(d.tasks), sources, metrics: normalizeMetrics(d.metrics) }, null, 2);
  }
  /** İçe aktarma: görevler kimliğe göre birleşir (yinelenmez), yerel etkinlikler eklenir. Abonelik adresleri yedekte bulunmaz (gizli anahtar içerebilir). */
  function importData(text, cur) {
    let j;
    try { j = JSON.parse(String(text || "")); } catch { throw new Error("Yedek dosyası okunamadı (JSON değil)."); }
    if (!j || j.format !== "pluginlabs-daily-brief") throw new Error("Bu dosya bir Daily Brief yedeği değil.");
    const haveT = new Set((cur.tasks || []).map((t) => t.id));
    const tasks = normalizeTasks(j.tasks).filter((t) => !haveT.has(t.id));
    const local = (cur.sources || []).find((s) => s.kind === "local");
    const haveE = new Set(local ? local.events.map((e) => e.id) : []);
    const inLocal = (normalizeSources(j.sources).find((s) => s.kind === "local") || { events: [] }).events.filter((e) => !haveE.has(e.id));
    return { tasks, events: inLocal, skipped: (Array.isArray(j.tasks) ? j.tasks.length : 0) - tasks.length };
  }

  // ---- MyMind: günü kısa plana dönüştürme. Gönderilecek veri onay penceresinde gösterilir. ----
  /** Veri azaltma: hassas başlıklar gizleme kipinden bağımsız olarak her zaman "Özel …" gider; yer, kaynak adı, adres ve not gönderilmez. */
  function planPayload(d, now) {
    const S = normalizeSettings(d.settings);
    const b = brief({ ...d, settings: { ...S, hideSensitive: true } }, now);
    const ev = b.events.map((e) => (e.allDay ? "tüm gün" : clock(e.start) + "-" + clock(e.end)) + " " + e.title);
    const tk = [...b.overdue, ...b.dueToday, ...b.undated.filter((t) => t.priority === 1)].slice(0, 15).map((t) => (t.time ? t.time + " " : "") + t.title + " (" + t.durationMin + " dk, öncelik " + t.priority + (t.due && t.due < b.date ? ", gecikmiş" : "") + ")");
    const sl = b.slots.map((s) => clock(s.start) + "-" + clock(s.end));
    if (!ev.length && !tk.length) throw new Error("Bugün için plan yapılacak etkinlik ya da görev yok.");
    const sent = { date: b.date, now: clock(now), work: S.workStart + "-" + S.workEnd, events: ev, tasks: tk, slots: sl };
    return {
      sent,
      messages: [
        { role: "system", content: "Sen bir gün planlama yardımcısısın. Verilen etkinlik ve görevlerden bugün için en fazla 8 adımlık kısa, gerçekçi bir plan yap. Etkinlikleri taşıma ya da silme önerme; görevleri yalnız boş aralıklara yerleştir. Çakışma varsa yalnız öneri olarak belirt. Yalnız şu JSON'u ver: {\"plan\":[{\"saat\":\"HH:MM-HH:MM\",\"is\":\"kısa açıklama\"}],\"not\":\"tek cümle\"}" },
        { role: "user", content: "Tarih: " + sent.date + " · şu an " + sent.now + " · çalışma " + sent.work + "\nEtkinlikler:\n" + (ev.join("\n") || "yok") + "\nGörevler:\n" + (tk.join("\n") || "yok") + "\nBoş aralıklar: " + (sl.join(", ") || "yok") },
      ],
    };
  }
  function parseJson(content) {
    const t = String(content == null ? "" : content).trim().replace(/^```[a-z]*\s*|\s*```$/g, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  }
  const BAD = /(iptal\s*et|iptal\s*edin|\bsil(in|inmeli)?\b|takvim\S*\s+(değiştir|güncelle|düzenle)|parola|şifre)/i;
  /** Plan doğrulaması: "HH:MM-HH:MM" saat aralığı (başlangıç < bitiş), metin ≤120 karakter, en fazla 8 adım; takvim değiştirme/silme öneren adımlar atılır. */
  function validatePlan(content) {
    const j = parseJson(content);
    if (!j) return { ok: false, error: "MyMind yanıtı beklenen biçimde değil." };
    const out = [];
    let rejected = 0;
    for (const x of Array.isArray(j.plan) ? j.plan : []) {
      const m = /^\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*$/.exec(String(x && x.saat || ""));
      const text = str(x && (x.is || x.iş || x.text), 120);
      const a = m && parseHM(m[1]), b = m && parseHM(m[2]);
      if (!m || a == null || b == null || b <= a || !text || BAD.test(text)) { rejected++; continue; }
      out.push({ from: hm(a), to: hm(b), text });
      if (out.length >= 8) break;
    }
    out.sort((p, q) => p.from.localeCompare(q.from));
    if (!out.length) return { ok: false, error: "MyMind geçerli bir plan önermedi.", rejected };
    return { ok: true, plan: out, note: BAD.test(String(j.not || "")) ? "" : str(j.not || j.note, 200), rejected };
  }

  function longDate(ts) { return new Date(ts).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }); }
  function ago(ts, now) {
    if (!ts) return "hiç alınmadı";
    const m = Math.round((now - ts) / MIN);
    if (m < 1) return "az önce";
    if (m < 60) return m + " dk önce";
    if (m < 24 * 60) return Math.floor(m / 60) + " sa önce";
    return Math.floor(m / 1440) + " gün önce";
  }
  function until(ts, now) {
    const m = Math.round((ts - now) / MIN);
    if (m <= 0) return "şimdi";
    if (m < 60) return m + " dk sonra";
    return Math.floor(m / 60) + " sa " + (m % 60 ? (m % 60) + " dk " : "") + "sonra";
  }

  return { MIN, HOUR, DAY, ID_RE, LOCAL_ID, MAX_TASKS, MAX_SOURCES, MAX_ICS_BYTES, REFRESH_CHOICES, DEFAULT_SETTINGS, makeId, str, fold, pad,
    dayStart, addDays, dateKey, parseDateKey, parseHM, hm, clock, atMinutes, normalizeSettings, normalizeTask, normalizeTasks, normalizeEvent, normalizeSource, normalizeSources,
    normalizeIcsUrl, sourceLink, zonedToUtc, parseICS, parseDuration, occurrences, isSensitive, freshness, freeSlots, brief,
    normalizeMetrics, recordShown, markRead, flagEvent, stats, exportData, importData, planPayload, validatePlan, longDate, ago, until };
});
