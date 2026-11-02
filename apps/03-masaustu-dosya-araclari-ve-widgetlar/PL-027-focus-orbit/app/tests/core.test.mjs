import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const C = createRequire(import.meta.url)("../src/core.js");
const M = C.MIN;

test("ayarlar: sınırlar dışı değerler varsayılana döner", () => {
  const s = C.normalizeSettings({ focusMin: "50", breakMin: 0, longEvery: 99, autoBreak: false, weeklyGoal: "x" });
  assert.equal(s.focusMin, 50);
  assert.equal(s.breakMin, 5);
  assert.equal(s.longEvery, 4);
  assert.equal(s.autoBreak, false);
  assert.equal(s.weeklyGoal, 3);
  assert.equal(C.normalizeSettings(null).notify, true);
});

test("zamanlayıcı: kalan süre, duraklatma/sürdürme kaymaz, uzatma, bitiş", () => {
  let t = C.startFocus({ focusMin: 25 }, 1000, "abcdef123456");
  assert.equal(C.remaining(t, 1000), 25 * M);
  assert.equal(C.remaining(t, 1000 + 10 * M), 15 * M);
  t = C.pause(t, 1000 + 10 * M);
  assert.equal(C.remaining(t, 1000 + 40 * M), 15 * M, "duraklatılmışken süre akmaz");
  assert.equal(C.isDue(t, 1000 + 999 * M), false);
  t = C.resume(t, 1000 + 40 * M);
  assert.equal(C.remaining(t, 1000 + 45 * M), 10 * M);
  t = C.extend(t, 5);
  assert.equal(C.remaining(t, 1000 + 45 * M), 15 * M);
  assert.equal(C.elapsed(t, 1000 + 45 * M), 15 * M);
  assert.equal(C.isDue(t, 1000 + 60 * M), true);
  assert.equal(C.remaining(t, 1000 + 99 * M), 0);
  assert.equal(C.fmt(25 * M), "25:00");
  assert.equal(C.fmt(61 * 1000 - 1), "01:01");
  assert.equal(C.fmt(90 * M), "1:30:00");
});

test("mola: her 4. tamamlanan odaktan sonra uzun mola", () => {
  const s = { breakMin: 5, longBreakMin: 15, longEvery: 4 };
  assert.equal(C.startBreak(s, 0, 1).durationMs, 5 * M);
  assert.equal(C.startBreak(s, 0, 4).long, true);
  assert.equal(C.startBreak(s, 0, 4).durationMs, 15 * M);
  assert.equal(C.startBreak({ ...s, longEvery: 0 }, 0, 4).long, false);
});

test("görev ve adımlar: boş/yinelenen adımlar atılır, en fazla 12", () => {
  const t = C.normalizeTask({ title: "  Tez   bölüm 3 ", steps: ["Kaynakları topla", "kaynakları topla", "", { text: "Taslak yaz", done: true }, ...Array.from({ length: 20 }, (_, i) => "Adım " + i)] });
  assert.equal(t.title, "Tez bölüm 3");
  assert.equal(t.steps.length, 12);
  assert.equal(t.steps[1].done, true);
});

test("dikkat listesi: alan adına indirgenir; yerel/IP/giriş bilgili adresler reddedilir", () => {
  assert.equal(C.normalizeHost("https://www.youtube.com/watch?v=x"), "youtube.com");
  assert.equal(C.normalizeHost("X.com"), "x.com");
  for (const bad of ["localhost", "192.168.1.1", "javascript:alert(1)", "https://a:b@ornek.com", "kelime", "ftp://ornek.com"]) assert.equal(C.normalizeHost(bad), null, bad);
  const l = C.parseSiteList("youtube.com, www.youtube.com; instagram.com\nreddit.com/r/x");
  assert.deepEqual(l.map((s) => s.host), ["youtube.com", "instagram.com", "reddit.com"]);
  assert.equal(C.normalizeSites([{ host: "x.com", on: false }])[0].on, false);
});

test("seans kaydı: çalışan seans yeniden yüklemede erken bitmiş sayılır; kesinti eklenir", () => {
  let s = C.newSession({ title: "Rapor" }, { focusMin: 25 }, 5000);
  assert.equal(s.status, "running");
  s = C.addInterruption(s, "https://www.instagram.com/", "bildirim", 6000);
  s = C.addInterruption(s, "", "", 7000);
  assert.equal(s.interruptions.length, 2);
  assert.equal(s.interruptions[0].site, "instagram.com");
  const n = C.normalizeSession(s);
  assert.equal(n.status, "stopped");
  assert.equal(C.normalizeSession({ startedAt: "x" }), null);
});

test("haftalık ölçü: tamamlanan seans, hedef, kesinti/seans ve geçen haftaya göre eğilim", () => {
  const now = new Date(2026, 10, 5, 15, 0).getTime(); // Perşembe
  const w0 = C.weekStart(now);
  assert.equal(new Date(w0).getDay(), 1, "hafta Pazartesi başlar");
  const mk = (at, status, ints) => ({ id: C.makeId(), task: "x", plannedMin: 25, startedAt: at, endedAt: at + 25 * M, focusMs: 25 * M, status, interruptions: Array.from({ length: ints }, () => ({ at, site: "", note: "" })), stepsDone: 0, stepsTotal: 0, summary: "" });
  const sessions = [
    mk(w0 - 3 * 86400000, "done", 4), mk(w0 - 2 * 86400000, "done", 2), // geçen hafta: 3/seans
    mk(w0 + 3600000, "done", 1), mk(w0 + 86400000 + 3600000, "done", 0), mk(w0 + 2 * 86400000, "stopped", 5), mk(w0 + 3 * 86400000 + 1000, "done", 2),
  ];
  const w = C.weekStats(sessions, now, 3);
  assert.equal(w.done, 3);
  assert.equal(w.stopped, 1);
  assert.equal(w.goalMet, true);
  assert.equal(w.focusMin, 75);
  assert.equal(w.interruptionsPerSession, 1);
  assert.equal(w.lastWeekInterruptionsPerSession, 3);
  assert.equal(w.trend, "down");
  assert.deepEqual(w.days.map((d) => d.done), [1, 1, 0, 1, 0, 0, 0]);
  assert.equal(C.completedToday(sessions, now), 1);
});

test("en çok dikkat dağıtan siteler yalnız kullanıcı kayıtlarından", () => {
  const s = [{ interruptions: [{ site: "youtube.com" }, { site: "x.com" }, { site: "youtube.com" }, { site: "" }] }];
  assert.deepEqual(C.topSites(s, 5), [{ host: "youtube.com", count: 2 }, { host: "x.com", count: 1 }]);
});

test("yedek: dışa/içe aktarma; aynı seans iki kez eklenmez, yabancı dosya reddedilir", () => {
  const sess = C.normalizeSession({ id: "abcdef123456", task: "A", startedAt: 1000, status: "done", focusMs: 60000 });
  const text = C.exportData({ settings: {}, task: { title: "A" }, sites: ["youtube.com"], sessions: [sess] });
  const r = C.importData(text, [sess]);
  assert.equal(r.sessions.length, 0);
  assert.equal(r.skipped, 1);
  assert.equal(C.importData(text, []).sessions.length, 1);
  assert.deepEqual(C.importData(text, []).sites.map((s) => s.host), ["youtube.com"]);
  assert.throws(() => C.importData('{"format":"baska"}'), /Focus Orbit yedeği değil/);
  assert.throws(() => C.importData("x"), /JSON değil/);
});

test("MyMind görev parçalama: yalnız görev başlığı gönderilir; yanıt doğrulanır", () => {
  const p = C.splitPayload({ title: "Tez yöntem bölümü", steps: [{ text: "Gizli adım" }] });
  assert.deepEqual(p.sent, { task: "Tez yöntem bölümü" });
  assert.doesNotMatch(JSON.stringify(p.messages), /Gizli adım/);
  assert.throws(() => C.splitPayload({ title: "a" }), /en az 3/);
  const r = C.validateSteps("```json\n" + JSON.stringify({ adimlar: ["Kaynak listesini çıkar", "Kaynak listesini çıkar", "Tarayıcıyı kapat", "", "Mevcut adım", "Yöntem taslağını yaz"], ipucu: "Önce en kolay adım." }) + "\n```", { title: "x", steps: [{ text: "mevcut adım" }] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.steps, ["Kaynak listesini çıkar", "Yöntem taslağını yaz"]);
  assert.equal(r.rejected, 4);
  assert.equal(C.validateSteps("düz metin", {}).ok, false);
});

test("MyMind seans özeti: site ve notlar gönderilmez; özet doğrulanır", () => {
  const s = C.addInterruption(C.newSession({ title: "Rapor" }, { focusMin: 25 }, 1000), "instagram.com", "gizli not", 2000);
  s.status = "done"; s.focusMs = 25 * M;
  const p = C.summaryPayload(s, { title: "Rapor", steps: [{ text: "Giriş", done: true }] });
  assert.equal(p.sent.interruptions, 1);
  assert.deepEqual(p.sent.steps, ["[x] Giriş"]);
  const all = JSON.stringify(p.messages);
  assert.doesNotMatch(all, /instagram|gizli not/);
  const v = C.validateSummary('{"ozet":"25 dakikalık seans tamamlandı.","sonraki":"Sonuç bölümünü yaz"}');
  assert.equal(v.ok, true);
  assert.equal(v.next, "Sonuç bölümünü yaz");
  assert.equal(C.validateSummary('{"ozet":"x","sonraki":"Uygulamaları kapat"}').next, "");
  assert.equal(C.validateSummary('{"sonraki":"y"}').ok, false);
});
