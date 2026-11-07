// Çekirdek birim testleri (node --test). Ağ, dosya ve Electron gerekmez.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const build = (text, o) => C.buildMeeting(C.parseTranscript(text), { date: "2026-11-04", ...(o || {}) });

test("zaman ayrıştırma ve biçim", () => {
  assert.equal(C.parseTime("00:01:02.500"), 62.5);
  assert.equal(C.parseTime("1:02:03"), 3723);
  assert.equal(C.parseTime("12:05"), 725);
  assert.equal(C.parseTime("00:61:00"), null);
  assert.equal(C.parseTime("abc"), null);
  assert.equal(C.fmtTime(3723), "01:02:03");
  assert.equal(C.fmtTime(65), "00:01:05");
  assert.equal(C.fmtTime(null), "—");
});

test("konuşmacı etiketi sezgisi", () => {
  for (const ok of ["Ayşe Demir", "Konuşmacı 1", "Speaker 2", "Dr. Kaya", "Ali (Pazarlama)", "John"]) assert.ok(C.speakerLike(ok), ok);
  for (const no of ["Karar", "Not", "Toplantı tarihi", "bunu da", "https://x", "Ali, bunu", "Bir iki üç dört beş"]) assert.ok(!C.speakerLike(no), no);
});

test("WebVTT: <v> etiketi, konuşmacısız parça tahmini, kısa parçaların birleşmesi", () => {
  const p = C.parseTranscript("WEBVTT\n\nNOTE yorum\nsatır\n\n1\n00:00:01.000 --> 00:00:02.000\n<v Ali Er>Merhaba\n\n00:00:02.500 --> 00:00:04.000\n<v Ali Er>herkese.\n\n00:00:05.000 --> 00:00:06.000\n<v Veli>Selam.\n\n00:00:06.200 --> 00:00:07.000\nDevam ediyorum.\n");
  assert.equal(p.format, "vtt");
  assert.equal(p.lines.length, 3);
  assert.equal(p.lines[0].text, "Merhaba herkese.");
  const m = C.buildMeeting(p, { date: "2026-11-04" });
  assert.equal(m.lines[2].speaker, "s2");
  assert.equal(m.lines[2].guess, true);
  assert.equal(m.lines[1].guess, false);
});

test("SRT, zaman damgalı satırlar, Teams başlığı, Ad: metin, düz metin", () => {
  const srt = C.parseTranscript("1\n00:00:01,000 --> 00:00:03,000\nAyşe: Merhaba.\n\n2\n00:00:04,000 --> 00:00:05,000\nMehmet: Selam.\n");
  assert.equal(srt.format, "srt");
  assert.deepEqual(srt.lines.map((l) => [l.t, l.speaker, l.text]), [[1, "Ayşe", "Merhaba."], [4, "Mehmet", "Selam."]]);
  const z = C.parseTranscript("[00:01:02] Ayşe Demir: Başlayalım.\n00:01:10 - Mehmet: Tamam.\n(01:20) Not: bu bir not\nAyşe Demir (00:02:00): Devam.\n");
  assert.equal(z.format, "zamanli");
  assert.deepEqual(z.lines.map((l) => [l.t, l.speaker]), [[62, "Ayşe Demir"], [70, "Mehmet"], [80, ""], [120, "Ayşe Demir"]]);
  assert.equal(z.lines[2].text, "Not: bu bir not");
  const teams = C.parseTranscript("Selin Yılmaz   0:02\nGünaydın.\nİkinci satır.\n\nBurak Öztürk   0:15\nMerhaba.\n");
  assert.deepEqual(teams.lines.map((l) => [l.t, l.speaker, l.text]), [[2, "Selin Yılmaz", "Günaydın."], [2, "Selin Yılmaz", "İkinci satır."], [15, "Burak Öztürk", "Merhaba."]]);
  const b = C.parseTranscript("Ali: Merhaba.\nKarar: Pazartesi başlıyoruz.\nVeli: Tamam.");
  assert.equal(b.format, "basit");
  assert.deepEqual(b.lines.map((l) => l.speaker), ["Ali", "", "Veli"]);
  assert.equal(C.parseTranscript("Bugün toplandık.\nKonu belli.").format, "duz");
});

test("son tarih: göreli ve açık ifadeler toplantı tarihine göre çözülür", () => {
  const d = (t) => (C.parseDue(t, "2026-11-04") || {}).date || null; // 4 Kasım 2026 çarşamba
  assert.equal(d("yarın gönderirim"), "2026-11-05");
  assert.equal(d("cuma gününe kadar"), "2026-11-06");
  assert.equal(d("çarşamba"), "2026-11-11");
  assert.equal(d("pazar"), "2026-11-08");
  assert.equal(d("haftaya pazartesi"), "2026-11-09");
  assert.equal(d("gelecek hafta"), "2026-11-13");
  assert.equal(d("ay sonuna kadar"), "2026-11-30");
  assert.equal(d("3 gün içinde"), "2026-11-07");
  assert.equal(d("15 Kasım"), "2026-11-15");
  assert.equal(d("2 Ocak"), "2027-01-02");
  assert.equal(d("15.11.2026"), "2026-11-15");
  assert.equal(d("20.11'e kadar"), "2026-11-20");
  assert.equal(d("by Friday"), "2026-11-06");
  assert.equal(d("Nov 20"), "2026-11-20");
  assert.equal(d("in 2 weeks"), "2026-11-18");
  assert.equal(d("sürüm 1.5 hazır"), null);
  assert.equal(d("31.02.2026"), null);
  assert.equal(C.parseDue("yarın", "geçersiz"), null);
});

test("Notion ölçütü: etiketli örnekte görev çıkarma kesinliği ≥ %90", () => {
  const m = build(S.text, { title: S.title, date: S.date });
  assert.equal(m.lines.length, 21);
  assert.equal(m.speakers.length, 4);
  assert.equal(m.speakers[3].name, "");
  assert.equal(m.lines.find((l) => l.id === "l8").guess, true);
  const ev = C.evaluate(m.items, S.gold);
  const tasks = C.evaluate(m.items.filter((x) => x.kind === "gorev"), S.gold.filter((g) => g.kind === "gorev"));
  assert.ok(ev.precision >= 0.9, "kesinlik " + ev.precision + " yanlış: " + ev.fp.join(","));
  assert.ok(tasks.precision >= 0.9, "görev kesinliği " + tasks.precision);
  assert.ok(ev.recall >= 0.8, "duyarlılık " + ev.recall + " eksik: " + ev.fn.join(","));
  assert.equal(ev.ownerOk, ev.ownerN, "sorumlu eşleşmesi");
  const byLine = (l) => m.items.find((x) => x.lineIds[0] === l);
  assert.equal(byLine("l5").due, "2026-11-06");
  assert.equal(byLine("l6").due, "2026-11-05");
  assert.equal(byLine("l8").ownerState, "tahmin"); // konuşmacı tahmini
  assert.equal(byLine("l13").ownerState, "tahmin"); // adlandırılmamış konuşmacı
  assert.equal(byLine("l14").ownerState, "belirsiz");
  assert.equal(byLine("l10").ownerState, "ekip");
  assert.ok(!byLine("l7"), "onay satırı tekrar görev sayılmaz");
  assert.ok(!byLine("l17"), "soru cümlesi karar değildir");
  assert.ok(!byLine("l1"), "gündem cümlesi görev değildir");
});

test("bağımsız İngilizce örnek (zaman damgalı satırlar): kesinlik ≥ %90", () => {
  const en = [
    "[00:00:03] John Miller: Thanks for joining, today we'll go over the launch plan.",
    "[00:00:10] Priya Shah: The landing page copy is almost done.",
    "[00:00:18] John Miller: We decided to launch on December 1st.",
    "[00:00:25] Priya Shah: I'll send the final copy to legal by Friday.",
    "[00:00:34] John Miller: Tom, can you update the pricing table?",
    "[00:00:40] Tom Becker: Sure, will do.",
    "[00:00:47] Tom Becker: The analytics dashboard still shows wrong numbers.",
    "[00:00:55] Priya Shah: Whether we offer a free tier is still open.",
    "[00:01:03] John Miller: We need to book the venue for the launch event.",
    "[00:01:10] Tom Becker: I can't do it this week.",
    "[00:01:16] John Miller: Then Priya will handle the venue booking.",
    "[00:01:24] Priya Shah: Okay. Is the budget approved?",
    "[00:01:30] John Miller: Yes, the budget has been approved.",
    "[00:01:38] Tom Becker: Let me fix the dashboard before the next meeting.",
  ].join("\n");
  const gold = [
    { line: "l3", kind: "karar" }, { line: "l4", kind: "gorev", owner: "s2" }, { line: "l5", kind: "gorev", owner: "s3" }, { line: "l8", kind: "soru" },
    { line: "l9", kind: "gorev", owner: "ekip" }, { line: "l11", kind: "gorev", owner: "s2" }, { line: "l13", kind: "karar" }, { line: "l14", kind: "gorev", owner: "s3" },
  ];
  const m = build(en);
  const ev = C.evaluate(m.items, gold);
  assert.ok(ev.precision >= 0.9, "kesinlik " + ev.precision + " yanlış: " + ev.fp.join(","));
  assert.ok(ev.recall >= 0.8, "duyarlılık " + ev.recall + " eksik: " + ev.fn.join(","));
  assert.equal(ev.ownerOk, ev.ownerN);
  assert.equal(m.items.find((x) => x.lineIds[0] === "l4").due, "2026-11-06");
});

test("bağımsız Türkçe örnek (Teams başlık biçimi): kesinlik ≥ %90", () => {
  const tr = [
    "Selin Yılmaz   0:02", "Günaydın, bugün kampanya bütçesine bakacağız.", "",
    "Burak Öztürk   0:15", "Geçen ayın reklam harcaması planın üstünde kaldı.", "",
    "Selin Yılmaz   0:31", "Reklam bütçesini yüzde 10 azaltma kararı aldık.", "",
    "Burak Öztürk   0:44", "Yeni bütçe tablosunu çarşamba gününe kadar hazırlayacağım.", "",
    "Selin Yılmaz   1:02", "Can, ajansa yeni brifi iletir misin?", "",
    "Can Er   1:10", "Olur, bugün iletirim.", "",
    "Selin Yılmaz   1:21", "Sosyal medya takvimi de güncellenecek.", "",
    "Burak Öztürk   1:35", "Influencer iş birliği yapıp yapmayacağımız henüz belli değil.", "",
    "Can Er   1:50", "Rakip analizini ben üstlenirim, ay sonuna kadar sunarım.", "",
    "Selin Yılmaz   2:04", "Teşekkürler, iyi çalışmalar.",
  ].join("\n");
  const gold = [
    { line: "l3", kind: "karar" }, { line: "l4", kind: "gorev", owner: "s2" }, { line: "l5", kind: "gorev", owner: "s3" },
    { line: "l7", kind: "gorev", owner: "belirsiz" }, { line: "l8", kind: "soru" }, { line: "l9", kind: "gorev", owner: "s3" },
  ];
  const m = build(tr);
  assert.equal(m.lines.length, 10);
  const ev = C.evaluate(m.items, gold);
  assert.ok(ev.precision >= 0.9, "kesinlik " + ev.precision + " yanlış: " + ev.fp.join(","));
  assert.ok(ev.recall >= 0.8, "duyarlılık " + ev.recall + " eksik: " + ev.fn.join(","));
  assert.equal(ev.ownerOk, ev.ownerN);
  const t = m.items.find((x) => x.lineIds[0] === "l9");
  assert.equal(t.due, "2026-11-30");
});

test("hassas değer maskeleme", () => {
  const table = { values: [], types: [] };
  const s = "Bana ali@ornek.com ya da 0532 111 22 33 ile ulaşın; IBAN TR33 0006 1005 1978 6457 8413 26, kart 4111 1111 1111 1111, link https://ornek.com/x, parola: Gizli123!";
  const out = C.mask(s, table);
  for (const v of ["ali@ornek.com", "0532 111 22 33", "TR33", "4111", "https://", "Gizli123"]) assert.ok(!out.includes(v), v + " maskelenmeli: " + out);
  assert.equal(C.unmask(out, table), s);
  assert.equal(C.mask("Aynı ali@ornek.com, yine ali@ornek.com", { values: [], types: [] }), "Aynı ⟦1⟧, yine ⟦1⟧");
  assert.deepEqual(C.sensitiveSummary("ali@ornek.com ve veli@ornek.com").map((x) => x.count), [2]);
  assert.equal(C.detectSensitive("Sipariş no 12345678901").length, 0); // T.C. kimlik doğrulaması geçmez
});

test("MyMind isteği veri azaltılmış: adlar takma adla, hassas değerler yer tutucuyla", () => {
  const m = build(S.text, { title: S.title, date: S.date });
  const p = C.aiPayload(m);
  const all = p.messages.map((x) => x.content).join("\n");
  for (const name of ["Ayşe", "Mehmet", "Zeynep", "Demir", "Kaya", "Arslan", "destek@ornekfirma.com.tr"]) assert.ok(!all.includes(name), name + " gönderilmemeli");
  assert.match(all, /\[L6 00:01:20\] S1: S3, müşterilere/);
  assert.match(all, /\[L8 00:01:35\] S3\?: Metni de ⟦1⟧/);
  assert.equal(p.sent.masked, 1);
  assert.equal(p.sent.lines, 21);
  assert.equal(p.alias.S2, "s2");
  assert.equal(C.batches(m).length, 1);
});

test("MyMind yanıtı doğrulanır: var olmayan satır ve geçersiz sorumlu atılır, değerler geri konur", () => {
  const m = build(S.text, { title: S.title, date: S.date });
  const p = C.aiPayload(m);
  const reply = "```json\n" + JSON.stringify({
    kararlar: [{ metin: "Sürüm 20 Kasım'a ertelendi", satirlar: ["L4"] }, { metin: "Uydurma karar", satirlar: ["L99"] }],
    gorevler: [{ metin: "Metni ⟦1⟧ adresinden paylaşmak", sorumlu: "S3", son_tarih: "", satirlar: ["L8"] }, { metin: "SSS taslağı", sorumlu: "S9", son_tarih: "perşembe", satirlar: ["L13"] }],
    sorular: [{ metin: "Paket fiyatları", satirlar: [] }],
    konusmaci_tahminleri: [{ satir: "L8", konusmaci: "S3", gerekce: "önceki satırın devamı" }, { satir: "L8", konusmaci: "S7" }],
  }) + "\n```";
  const r = C.validateAi(reply, p, m);
  assert.equal(r.items.length, 3);
  assert.equal(r.dropped, 3);
  const g = r.items.find((x) => x.lineIds[0] === "l8");
  assert.equal(g.text, "Metni destek@ornekfirma.com.tr adresinden paylaşmak");
  assert.equal(g.owner, "s3");
  assert.equal(g.ownerState, "tahmin");
  const sss = r.items.find((x) => x.lineIds[0] === "l13");
  assert.equal(sss.owner, "");
  assert.equal(sss.ownerState, "belirsiz");
  assert.equal(sss.due, "2026-11-05");
  assert.deepEqual(r.guesses, [{ lineId: "l8", speaker: "s3", why: "önceki satırın devamı" }]);
  assert.ok(C.isDuplicate(r.items[0], m.items));
  assert.throws(() => C.validateAi("yanıt yok", p, m), /JSON/);
});

test("dışa aktarma: yalnız onaylı öğeler; CSV formül koruması; ICS görevleri", () => {
  const m = build(S.text, { title: S.title, date: S.date });
  m.items.forEach((x, i) => { x.status = i < 6 ? "onayli" : "taslak"; });
  m.items[1].text = "=HYPERLINK(\"x\")";
  m.notes.push({ id: "n1", lineId: "l3", t: 31, text: "Giriş ekranı şikâyeti öncelikli" });
  const md = C.exportMeeting(m, "md").body;
  assert.match(md, /^# Ürün haftalık toplantısı \(örnek\)/);
  assert.match(md, /\*\*Tarih:\*\* 4 Kasım 2026/);
  assert.match(md, /## Kararlar \(1\)/);
  assert.match(md, /- \[ \] Zeynep, müşterilere .* — Sorumlu: Zeynep Arslan — Son tarih: 5 Kasım 2026 \[00:01:20\]/);
  assert.match(md, /Sorumlu: Zeynep Arslan \(tahmin\)/);
  assert.match(md, /- \[00:00:31\] Giriş ekranı şikâyeti öncelikli/);
  assert.match(md, /6 taslak öğe onaylanmadığı için/);
  assert.ok(!md.includes("Performans testi"), "taslak öğe nota girmez");
  const csv = C.exportMeeting(m, "csv").body;
  assert.ok(csv.startsWith("﻿Tür;Metin;Sorumlu"));
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.equal(csv.trim().split("\r\n").length, 7);
  const ics = C.exportMeeting(m, "ics", { now: Date.UTC(2026, 10, 4) }).body;
  assert.match(ics, /BEGIN:VCALENDAR\r\nVERSION:2.0/);
  assert.match(ics, /DUE;VALUE=DATE:20261106/);
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75));
  assert.match(C.exportMeeting(m, "txt").body, /^ÜRÜN HAFTALIK TOPLANTISI/);
});

test("normalleştirme: bozuk kayıt ayıklanır; ölçüler", () => {
  const m = C.normalizeMeeting({ title: "", date: "2026-13-40", speakers: [{ key: "s1", name: "Ali" }], lines: [{ id: "l1", text: "Merhaba", speaker: "s9", t: "x" }, { id: "l2", text: "" }], items: [{ kind: "gorev", text: "Var", lineIds: ["l1"], owner: "s1" }, { kind: "karar", text: "Yok", lineIds: ["l5"] }] });
  assert.equal(m.title, "Toplantı");
  assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(m.lines.length, 1);
  assert.equal(m.lines[0].speaker, "");
  assert.equal(m.lines[0].t, null);
  assert.equal(m.items.length, 1);
  assert.equal(m.items[0].ownerState, "belirsiz");
  const a = build(S.text, { date: S.date });
  a.items.forEach((x, i) => { x.status = i === 0 ? "red" : "onayli"; });
  const st = C.stats([a], C.normalizeMetrics({}));
  assert.equal(st.decidedRule, 12);
  assert.equal(st.precision, 91.7);
  assert.equal(C.normalizeSettings({ provider: "yerel", localUrl: "http://ornek.com:1234" }).localUrl, "http://127.0.0.1:1234");
  assert.ok(C.isLoopbackUrl("http://localhost:11434"));
  assert.ok(!C.isLoopbackUrl("https://127.0.0.1"));
  const ms = C.meetingStats(a);
  assert.equal(ms.guessed, 1);
  assert.equal(ms.unnamed, 1);
});
