import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const C = createRequire(import.meta.url)("../src/core.js");
const { MIN, HOUR } = C;
// Testler makinenin yerel saat diliminden bağımsızdır: yerel tarihler new Date(y, m, d, h) ile kurulur.
const L = (y, m, d, h = 0, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
const NOW = L(2026, 11, 3, 8, 30); // 3 Kasım 2026 Salı 08:30

const ICS = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:İş takvimi",
  "BEGIN:VEVENT", "UID:a1", "DTSTART:20261103T090000", "DTEND:20261103T100000", "SUMMARY:Haftalık ekip toplantısı", "LOCATION:Toplantı odası\\, 3. kat", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a2", "DTSTART:20261103T093000", "DURATION:PT1H", "SUMMARY:Müşteri görüşmesi", "BEGIN:VALARM", "TRIGGER:-PT10M", "SUMMARY:alarm", "END:VALARM", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a3", "DTSTART;VALUE=DATE:20261103", "DTEND;VALUE=DATE:20261104", "SUMMARY:Cumhuriyet haftası", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a4", "DTSTART:20261020T140000", "DTEND:20261020T143000", "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;COUNT=20", "EXDATE:20261105T140000", "SUMMARY:Spor salonu", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a5", "DTSTART:20261103T120000", "DTEND:20261103T130000", "STATUS:CANCELLED", "SUMMARY:İptal edilen öğle", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a6", "DTSTART:20261101T160000", "DTEND:20261101T163000", "RRULE:FREQ=DAILY;UNTIL=20261110T000000", "SUMMARY:Günlük kontrol", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a6", "RECURRENCE-ID:20261103T160000", "DTSTART:20261103T170000", "DTEND:20261103T173000", "SUMMARY:Günlük kontrol (kaydırıldı)", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a7", "DTSTART:20261103T150000", "DTEND:20261103T153000", "CLASS:PRIVATE", "SUMMARY:Diş hekimi", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a8", "DTSTART:20250131T080000", "DTEND:20250131T081500", "RRULE:FREQ=MONTHLY", "SUMMARY:Ay sonu", "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const src = (events, extra) => C.normalizeSource({ id: "isktakvim01", kind: "url", name: "İş", url: "https://calendar.example.com/x.ics", refreshMin: 60, lastFetched: NOW - 10 * MIN, events, ...extra });
const local = (events) => C.normalizeSource({ kind: "local", events });

test("ayarlar: hatalı saatler varsayılana döner, hassas kelimeler temizlenir", () => {
  const s = C.normalizeSettings({ workStart: "19:00", workEnd: "08:00", briefTime: "25:00", sensitiveWords: "Avukat, x, Hastane", defaultTaskMin: 2 });
  assert.equal(s.workStart, "09:00");
  assert.equal(s.workEnd, "18:00");
  assert.equal(s.briefTime, "08:00");
  assert.deepEqual(s.sensitiveWords, ["avukat", "hastane"]);
  assert.equal(s.defaultTaskMin, 30);
  assert.equal(C.normalizeSettings(null).widgetOnStart, true);
});

test("ICS: katlama, kaçış, DURATION, tüm gün, VALARM, iptal, RECURRENCE-ID, CLASS:PRIVATE", () => {
  const r = C.parseICS(ICS.replace("SUMMARY:Haftalık ekip toplantısı", "SUMMARY:Haftalık ekip \r\n toplantısı"));
  assert.equal(r.name, "İş takvimi");
  assert.equal(r.stats.cancelled, 1);
  const byUid = (u) => r.events.filter((e) => e.uid === u);
  assert.equal(byUid("a1")[0].title, "Haftalık ekip toplantısı");
  assert.equal(byUid("a1")[0].location, "Toplantı odası, 3. kat");
  assert.equal(byUid("a2")[0].end - byUid("a2")[0].start, HOUR);
  assert.equal(byUid("a2")[0].title, "Müşteri görüşmesi", "VALARM özeti etkinlik başlığını ezmemeli");
  assert.equal(byUid("a3")[0].allDay, true);
  assert.equal(byUid("a7")[0].sensitive, true);
  assert.equal(byUid("a6").length, 2);
  assert.ok(byUid("a6")[0].exdates.includes(L(2026, 11, 3, 16)), "kaydırılan tekrar ana kayıttan çıkarılmalı");
  assert.throws(() => C.parseICS("merhaba"), /iCalendar/);
});

test("ICS: UTC ve TZID (IANA ve Windows adı) doğru ana dönüşür", () => {
  const r = C.parseICS(["BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:u", "DTSTART:20261103T060000Z", "DTEND:20261103T070000Z", "SUMMARY:UTC", "END:VEVENT",
    "BEGIN:VEVENT", "UID:t", "DTSTART;TZID=Europe/Istanbul:20261103T090000", "DTEND;TZID=Europe/Istanbul:20261103T100000", "SUMMARY:IST", "END:VEVENT",
    "BEGIN:VEVENT", "UID:w", "DTSTART;TZID=\"Turkey Standard Time\":20261103T090000", "DTEND;TZID=Turkey Standard Time:20261103T093000", "SUMMARY:WIN", "END:VEVENT",
    "BEGIN:VEVENT", "UID:n", "DTSTART;TZID=Mars/Olympus:20261103T090000", "DTEND;TZID=Mars/Olympus:20261103T093000", "SUMMARY:?", "END:VEVENT", "END:VCALENDAR"].join("\n"));
  const g = (u) => r.events.find((e) => e.uid === u);
  assert.equal(g("u").start, Date.UTC(2026, 10, 3, 6));
  assert.equal(g("t").start, Date.UTC(2026, 10, 3, 6), "İstanbul UTC+3");
  assert.equal(g("w").start, Date.UTC(2026, 10, 3, 6));
  assert.equal(g("n").start, L(2026, 11, 3, 9), "bilinmeyen saat dilimi yerel saat sayılır");
  assert.equal(r.stats.tzUnknown, 2);
  assert.equal(C.zonedToUtc(2026, 3, 29, 12, 0, 0, "Europe/Berlin"), Date.UTC(2026, 2, 29, 10), "yaz saati (CEST)");
});

test("tekrar: haftalık BYDAY + COUNT + EXDATE, günlük UNTIL, aylık 31 atlanır", () => {
  const r = C.parseICS(ICS);
  const gym = r.events.find((e) => e.uid === "a4");
  const day = (y, m, d) => C.occurrences(gym, L(y, m, d), L(y, m, d + 1));
  assert.equal(day(2026, 11, 3).length, 1, "Salı");
  assert.equal(day(2026, 11, 4).length, 0, "Çarşamba");
  assert.equal(day(2026, 11, 5).length, 0, "EXDATE");
  const all = C.occurrences(gym, L(2026, 1, 1), L(2027, 12, 31));
  assert.equal(all.length, 19, "COUNT=20, biri EXDATE");
  const daily = r.events.find((e) => e.uid === "a6" && e.rule);
  assert.equal(C.occurrences(daily, L(2026, 11, 1), L(2026, 12, 1)).length, 8, "1–9 Kasım, 3 Kasım kaydırıldı");
  const ms = r.events.find((e) => e.uid === "a8");
  const months = C.occurrences(ms, L(2025, 1, 1), L(2026, 1, 1)).map((o) => new Date(o.start).getMonth() + 1);
  assert.deepEqual(months, [1, 3, 5, 7, 8, 10, 12]);
});

test("özet: etkinlikler, sonraki, çakışmalar, görevler, boş aralık ve plan", () => {
  const { events } = C.parseICS(ICS);
  const tasks = C.normalizeTasks([
    { id: "gorev000001", title: "Rapor taslağı", due: "2026-11-02", durationMin: 60, priority: 1, createdAt: 1 },
    { id: "gorev000002", title: "Faturayı öde", due: "2026-11-03", durationMin: 15, priority: 2, createdAt: 2 },
    { id: "gorev000003", title: "Sunum provası", due: "2026-11-03", time: "09:45", durationMin: 30, priority: 2, createdAt: 3 },
    { id: "gorev000004", title: "Kitap oku", durationMin: 30, priority: 3, createdAt: 4 },
    { id: "gorev000005", title: "Yarın", due: "2026-11-04", createdAt: 5 },
    { id: "gorev000006", title: "Bitti", due: "2026-11-03", done: true, doneAt: NOW - MIN, createdAt: 6 },
  ]);
  const b = C.brief({ settings: {}, tasks, sources: [local([]), src(events)] }, NOW);
  assert.equal(b.date, "2026-11-03");
  assert.equal(b.events[0].title, "Cumhuriyet haftası", "tüm gün önce");
  assert.deepEqual(b.events.filter((e) => !e.allDay).map((e) => e.title), ["Haftalık ekip toplantısı", "Müşteri görüşmesi", "Spor salonu", "Diş hekimi", "Günlük kontrol (kaydırıldı)"]);
  assert.equal(b.next.title, "Haftalık ekip toplantısı");
  assert.equal(b.conflicts.filter((c) => c.kind === "event").length, 1);
  assert.match(b.conflicts[0].text, /30 dk çakışıyor/);
  assert.ok(b.conflicts.some((c) => c.kind === "task" && /Sunum provası/.test(c.text)));
  assert.deepEqual(b.overdue.map((t) => t.title), ["Rapor taslağı"]);
  assert.deepEqual(b.dueToday.map((t) => t.title), ["Sunum provası", "Faturayı öde"]);
  assert.equal(b.doneToday.length, 1);
  assert.equal(b.upcoming[0].title, "Yarın");
  // 09:00–10:30 dolu (toplantılar + saatli görev), 14:00–14:30 spor, 15:00–15:30 hekim, 17:00–17:30 kontrol.
  assert.equal(C.clock(b.slots[0].start), "10:30");
  const rapor = b.plan.find((p) => p.title === "Rapor taslağı");
  assert.equal(C.clock(rapor.start) + "-" + C.clock(rapor.end), "10:30-11:30");
  assert.equal(rapor.why, "gecikmiş");
  assert.ok(b.plan.some((p) => p.fixed && p.title === "Sunum provası"));
  assert.match(b.headline, /6 etkinlik · 3 görev · 3 çakışma/);
});

test("gizleme: hassas kelime, CLASS:PRIVATE ve kaynağın tüm başlıkları", () => {
  const { events } = C.parseICS(ICS);
  const tasks = C.normalizeTasks([{ title: "Hastane randevusu al", due: "2026-11-03" }, { title: "Market", due: "2026-11-03", sensitive: true }]);
  let b = C.brief({ settings: { hideSensitive: true }, tasks, sources: [src(events)] }, NOW);
  assert.ok(b.events.some((e) => e.title === "Özel etkinlik"), "Diş hekimi (PRIVATE) gizlenmeli");
  assert.ok(!b.events.some((e) => /Diş/.test(e.title)));
  assert.deepEqual(b.dueToday.map((t) => t.title), ["Özel görev", "Özel görev"]);
  b = C.brief({ settings: { hideSensitive: false }, tasks, sources: [src(events)] }, NOW);
  assert.ok(b.events.some((e) => e.title === "Diş hekimi" && e.sensitive));
  b = C.brief({ settings: { hideSensitive: true }, tasks: [], sources: [src(events, { hideAll: true })] }, NOW);
  assert.ok(b.events.every((e) => e.title === "Özel etkinlik" && !e.location));
});

test("tazelik: adres kaynağı yenileme süresinin 2 katını aşınca eskimiş; ölçüler", () => {
  const { events } = C.parseICS(ICS);
  let b = C.brief({ settings: {}, tasks: [], sources: [src(events, { lastFetched: NOW - 3 * HOUR })] }, NOW);
  assert.equal(b.sources[0].stale, true);
  assert.equal(b.staleEvents, b.events.length);
  b = C.brief({ settings: {}, tasks: [], sources: [src(events)] }, NOW);
  assert.equal(b.staleEvents, 0);
  let m = C.normalizeMetrics({});
  m = C.recordShown(m, b);
  m = C.markRead(m, b.date, NOW);
  m = C.flagEvent(m, b.date, b.events[1].key);
  m = C.flagEvent(m, b.date, b.events[1].key);
  m.days["2026-11-02"] = { shown: true, readAt: null, events: 4, stale: 0, flagged: [] };
  m = C.normalizeMetrics(m);
  const s = C.stats(m, NOW, 14);
  assert.equal(s.shown, 2);
  assert.equal(s.readRate, 0.5);
  assert.equal(s.flagged, 1);
  assert.equal(s.badRate, 1 / (b.events.length + 4));
});

test("abonelik adresi: webcal → https; http, IP, yerel ağ ve parola reddedilir", () => {
  assert.equal(C.normalizeIcsUrl("webcal://calendar.google.com/calendar/ical/x/basic.ics"), "https://calendar.google.com/calendar/ical/x/basic.ics");
  for (const bad of ["http://example.com/a.ics", "https://192.168.1.2/a.ics", "https://localhost/a.ics", "https://u:p@example.com/a.ics", "https://nas.local/a.ics", "ftp://x"]) assert.throws(() => C.normalizeIcsUrl(bad), Error, bad);
  assert.equal(C.normalizeIcsUrl("http://127.0.0.1:5000/a.ics", true), "http://127.0.0.1:5000/a.ics");
  assert.equal(C.sourceLink(src([])), "calendar.example.com", "adresin gizli kısmı gösterilmez");
});

test("MyMind: hassas başlıklar her zaman gizli gider; yer ve kaynak adı gitmez; plan doğrulanır", () => {
  const { events } = C.parseICS(ICS);
  const tasks = C.normalizeTasks([{ title: "Maaş bordrosunu kontrol et", due: "2026-11-03" }, { title: "Rapor", due: "2026-11-03" }]);
  const p = C.planPayload({ settings: { hideSensitive: false }, tasks, sources: [src(events)] }, NOW);
  const all = JSON.stringify(p.messages);
  assert.doesNotMatch(all, /Diş hekimi|Maaş|Toplantı odası|calendar\.example|İş takvimi/);
  assert.match(all, /Özel etkinlik/);
  assert.match(all, /Özel görev/);
  assert.match(all, /Rapor \(30 dk/);
  assert.throws(() => C.planPayload({ settings: {}, tasks: [], sources: [] }, NOW), /plan yapılacak/);
  const v = C.validatePlan("```json\n" + JSON.stringify({ plan: [{ saat: "11:00-12:00", is: "Rapor" }, { saat: "10:30–11:00", is: "E-postalar" }, { saat: "12:00-11:00", is: "ters" }, { saat: "13:00-13:30", is: "Müşteri toplantısını iptal et" }, { saat: "x", is: "y" }], not: "Öğleden önce raporu bitirin." }) + "\n```");
  assert.equal(v.ok, true);
  assert.deepEqual(v.plan.map((x) => x.from), ["10:30", "11:00"]);
  assert.equal(v.rejected, 3);
  assert.equal(C.validatePlan("yok").ok, false);
});

test("yedek: abonelik adresi yedeğe yazılmaz; içe aktarma görevleri yinelemez", () => {
  const d = { settings: {}, tasks: C.normalizeTasks([{ id: "gorev000001", title: "A" }]), sources: [local([{ id: "etkinlik0001", title: "Yerel", start: NOW }]), src([])], metrics: {} };
  const text = C.exportData(d);
  assert.doesNotMatch(text, /calendar\.example\.com\/x\.ics/);
  const r = C.importData(text, { tasks: d.tasks, sources: [local([])] });
  assert.equal(r.tasks.length, 0);
  assert.equal(r.skipped, 1);
  assert.equal(r.events.length, 1);
  assert.throws(() => C.importData("{}", d), /Daily Brief yedeği değil/);
});

test("kimlik: eksik kimlik yeni kimlik alır (\"undefined\" metni kimlik sayılmaz)", () => {
  const a = C.normalizeTask({ title: "A", id: undefined }), b = C.normalizeTask({ title: "B" });
  assert.match(a.id, C.ID_RE);
  assert.notEqual(a.id, "undefined");
  assert.notEqual(a.id, b.id);
  assert.match(C.normalizeSource({ kind: "url", url: "https://x.com/a.ics" }).id, /^[a-z0-9]{12}$/);
});
