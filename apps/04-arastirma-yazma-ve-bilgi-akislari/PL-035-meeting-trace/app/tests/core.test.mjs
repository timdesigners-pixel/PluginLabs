// Meeting Trace çekirdek birim testleri: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const parse = (t) => C.parseTranscript(t);
const ext = (t, o) => { const p = parse(t); return { p, ...C.extract(p.lines, p.speakers, { meetingDate: "2026-11-04", ...(o || {}) }) }; };

test("zaman ayrıştırma ve biçimleme", () => {
  assert.equal(C.parseTime("00:01:02.500"), 62.5);
  assert.equal(C.parseTime("1:02:03"), 3723);
  assert.equal(C.parseTime("12:05"), 725);
  assert.equal(C.parseTime("00:00:04,200"), 4.2);
  assert.equal(C.parseTime("ab"), null);
  assert.equal(C.fmtTime(725), "12:05");
  assert.equal(C.fmtTime(3723), "1:02:03");
  assert.equal(C.fmtTime(null), "");
});

test("WebVTT: <v> konuşmacı etiketi, ardışık parçaları birleştirme, etiketsiz ipucu tahmin", () => {
  const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<v Ayşe Demir>Lansmanı konuşalım\n\n00:00:03.000 --> 00:00:05.000\n<v Ayşe Demir>ve takvimi netleştirelim.\n\n00:00:06.000 --> 00:00:08.000\n<v Mehmet Kaya>Raporu yarın göndereceğim.</v>\n\n00:00:09.000 --> 00:00:10.000\nTamam, teşekkürler.\n";
  const p = parse(vtt);
  assert.equal(p.format, "vtt");
  assert.equal(p.lines.length, 3);
  assert.equal(p.lines[0].text, "Lansmanı konuşalım ve takvimi netleştirelim.");
  assert.equal(p.lines[1].speaker, "Mehmet Kaya");
  assert.equal(p.lines[1].t, 6);
  assert.equal(p.lines[2].guess, true);
  assert.equal(p.lines[2].speaker, "Mehmet Kaya");
});

test("SRT: sıra numaraları metne karışmaz, 'Ad: metin' konuşmacı olur", () => {
  const srt = "1\n00:00:01,000 --> 00:00:02,500\nZeynep: Metinleri ben yazacağım.\n\n2\n00:00:03,000 --> 00:00:05,000\nCan: Testi cumaya bitireceğim.\n";
  const p = parse(srt);
  assert.equal(p.format, "srt");
  assert.deepEqual(p.lines.map((l) => [l.speaker, l.text]), [["Zeynep", "Metinleri ben yazacağım."], ["Can", "Testi cumaya bitireceğim."]]);
});

test("Teams/Zoom blok dökümü ve zaman damgalı satırlar", () => {
  const blok = "Ayşe Demir   0:00:05\nHerkese merhaba.\nBugün iki konu var.\n\nMehmet Kaya   0:01:10\nSunumu ben hazırlayacağım.\n";
  const p = parse(blok);
  assert.equal(p.format, "blok");
  assert.equal(p.lines.length, 3);
  assert.equal(p.lines[2].speaker, "Mehmet Kaya");
  assert.equal(p.lines[2].t, 70);
  const z = parse("[00:00:05] Ali: Merhaba.\n[00:00:09] Veli: Tamam.\n00:00:12 bunu sonra konuşuruz\n");
  assert.equal(z.format, "zaman-konusmaci");
  assert.equal(z.lines[2].guess, true);
  assert.equal(z.lines[2].speaker, "Veli");
});

test("genel konuşmacı etiketi kimlik belirsiz sayılır; 'Not:' konuşmacı değildir", () => {
  assert.equal(C.isGenericSpeaker("Konuşmacı 3"), true);
  assert.equal(C.isGenericSpeaker("Speaker 1"), true);
  assert.equal(C.isGenericSpeaker("Ayşe"), false);
  const p = parse("Konuşmacı 1: Merhaba herkese.\nKonuşmacı 2: Raporu ben göndereceğim.\nNot: bu satır bir nottur.\n");
  assert.equal(p.format, "konusmaci");
  assert.equal(p.speakers.filter((s) => s.generic).length, 2);
  assert.ok(!p.speakers.some((s) => s.name === "Not"));
});

test("düz metin: konuşmacısız satırlar; görev sorumlusu belirsiz ve nedeni yazılı", () => {
  const { p, tasks } = ext("Toplantıda bütçe konuşuldu.\n\nRaporun cuma gününe kadar gönderilmesi gerekiyor.");
  assert.equal(p.format, "duz");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].assigneeState, "belirsiz");
  assert.match(tasks[0].assigneeReason, /sorumlu belirtilmedi/);
  assert.equal(tasks[0].due, "2026-11-06");
});

test("örnek toplantı: elle etiketli görevlerde kesinlik ≥ %90 ve duyarlılık", () => {
  const p = parse(S.text);
  const x = C.extract(p.lines, p.speakers, { meetingDate: S.date, participants: S.participants });
  const ev = C.evaluate(x.tasks, S.gold);
  assert.ok(ev.precision >= 90, "kesinlik " + ev.precision);
  assert.ok(ev.recall >= 85, "duyarlılık " + ev.recall);
  assert.equal(x.decisions.length >= 2, true);
  const byLine = Object.fromEntries(x.tasks.map((t) => [t.lineIds[0], t]));
  assert.equal(byLine.L9.assignee, "Mehmet Kaya");
  assert.equal(byLine.L10.due, "2026-11-06");
  assert.equal(byLine.L11.assignee, "Zeynep Aksoy");
  assert.equal(byLine.L12.assigneeState, "belirsiz");
  assert.equal(byLine.L16.assignee, "Can Arslan");
  assert.equal(byLine.L16.due, "2026-11-10");
  assert.equal(byLine.L18.due, "2026-11-05");
  assert.equal(byLine.L20.assignee, "Zeynep Aksoy");
  assert.equal(byLine.L20.due, "2026-11-10");
  // "Kim üstlenecek?" ve geçmiş zaman görev değildir.
  assert.ok(!byLine.L13 && !byLine.L14 && !byLine.L19);
});

test("İngilizce görevler: I will, <Ad> will, can you, we need to", () => {
  const { tasks } = ext("Anna: I will send the deck by Friday.\nTom: Anna will also update the budget tomorrow.\nAnna: Tom, can you book the room?\nTom: We need to check the contract.");
  const by = (k) => tasks.find((t) => t.text.includes(k));
  assert.equal(by("deck").assignee, "Anna");
  assert.equal(by("deck").due, "2026-11-06");
  assert.equal(by("budget").assignee, "Anna");
  assert.equal(by("budget").due, "2026-11-05");
  assert.equal(by("room").assignee, "Tom");
  assert.equal(by("contract").assigneeState, "belirsiz");
});

test("sorumlu belirsizliği: aynı ilk ad, 'biz', 'sen' ve genel konuşmacı", () => {
  const ppl = "Ali Yılmaz: Merhaba.\nAli Demir: Merhaba.\nSelin: Ali raporu yarın gönderecek.\n";
  const a = ext(ppl).tasks.find((t) => t.text.includes("raporu"));
  assert.equal(a.assigneeState, "belirsiz");
  assert.match(a.assigneeReason, /Birden çok kişi/);
  const b = ext("Ece: Sunumu haftaya biz hazırlayacağız.\nOnur: Olur.").tasks[0];
  assert.equal(b.assigneeState, "belirsiz");
  assert.match(b.assigneeReason, /Biz/);
  const c = ext("Ece: Bütçe tablosunu sen güncelleyeceksin.\nOnur: Tamam.").tasks[0];
  assert.equal(c.assignee, "Onur");
  assert.equal(c.assigneeState, "tahmin");
  const d = ext("Konuşmacı 2: Faturayı ben keseceğim.\nKonuşmacı 1: Güzel.").tasks[0];
  assert.equal(d.assignee, "Konuşmacı 2");
  assert.equal(d.assigneeState, "tahmin");
  assert.match(d.assigneeReason, /genel etiket/);
});

test("kararlar: olumlu kalıplar yakalanır, olumsuzlar alınmaz", () => {
  const { decisions } = ext("A: Tarih 20 Kasım olarak kesinleşti.\nB: Henüz karar vermedik, sonra konuşalım.\nA: Yıllık planla devam ediyoruz.\nB: We agreed to ship on Monday.\nA: Karar verelim mi?");
  assert.deepEqual(decisions.map((d) => d.text.slice(0, 12)), ["Tarih 20 Kas", "Yıllık planl", "We agreed to"]);
});

test("son tarih: gün adları, haftaya, sayısal ve ay adlı tarihler, saat ile karışmaz", () => {
  const d = (t) => (C.findDue(t, "2026-11-04") || {}).date || "";
  assert.equal(d("cumaya kadar"), "2026-11-06");
  assert.equal(d("cumartesi günü"), "2026-11-07");
  assert.equal(d("haftaya salı"), "2026-11-10");
  assert.equal(d("pazartesi"), "2026-11-09");
  assert.equal(d("yarın"), "2026-11-05");
  assert.equal(d("15 Aralık'a kadar"), "2026-12-15");
  assert.equal(d("10.11'e kadar"), "2026-11-10");
  assert.equal(d("saat 14.30'da"), "");
  assert.equal(d("ay sonuna kadar"), "2026-11-30");
  assert.equal(d("pazarlama ekibi"), "");
  assert.equal(d("by Friday"), "2026-11-06");
});

test("MyMind isteği: adlar K-kodlu, iletişim ve gizli değerler gönderilmez", () => {
  const p = parse(S.text);
  const m = C.normalizeMeeting({ title: S.title, date: S.date, lines: p.lines, participants: S.participants });
  const pay = C.aiPayload(m, m.lines);
  const all = JSON.stringify(pay.messages);
  for (const secret of ["Ayşe", "Mehmet", "Zeynep", "Can Arslan", "mehmet.kaya@ornek.com", S.title]) assert.ok(!all.includes(secret), secret + " gönderilmemeli");
  assert.match(all, /K1/);
  assert.equal(pay.sent.fields, 1);
  assert.equal(pay.sent.byType[0].type, "email");
  assert.ok(all.includes("K4"), "konuşmayan katılımcı da kodlanır");
  assert.ok(/~/.test(all), "tahmini satır işaretli gider");
});

test("MyMind yanıtı doğrulanır: bilinmeyen satır/kişi reddedilir, kodlar ve yer tutucular geri çevrilir", () => {
  const p = parse(S.text);
  const m = C.normalizeMeeting({ title: S.title, date: S.date, lines: p.lines, participants: S.participants });
  const pay = C.aiPayload(m, m.lines);
  const code = (name) => pay.codes.find((c) => c.name === name).code;
  const reply = "```json\n" + JSON.stringify({
    kararlar: [{ metin: "Lansman 20 Kasım", satirlar: ["L5"] }, { metin: "Uydurma karar", satirlar: ["L999"] }],
    gorevler: [
      { metin: code("Mehmet Kaya") + " teşekkür e-postasını ⟦1⟧ listesine gönderir", sorumlu: code("Mehmet Kaya"), tarih: "yarın", satirlar: ["L18"] },
      { metin: "Basın bülteni taslağı", sorumlu: "K9", satirlar: ["L12"] },
      { metin: "SSS sayfası", sorumlu: "belirsiz", neden: "kimse üstlenmedi", satirlar: ["L15"] },
    ],
  }) + "\n```";
  const r = C.validateAi(reply, pay, m.lines, m.date);
  assert.equal(r.decisions.length, 1);
  assert.equal(r.dropped.decisions, 1);
  assert.equal(r.tasks[0].assignee, "Mehmet Kaya");
  assert.equal(r.tasks[0].text, "Mehmet Kaya teşekkür e-postasını mehmet.kaya@ornek.com listesine gönderir");
  assert.equal(r.tasks[0].due, "2026-11-05");
  assert.equal(r.tasks[1].assigneeState, "belirsiz");
  assert.match(r.tasks[1].assigneeReason, /bilinmeyen/);
  assert.equal(r.dropped.owners, 1);
  assert.equal(r.tasks[2].assigneeReason, "kimse üstlenmedi");
  assert.throws(() => C.validateAi("yanıt yok", pay, m.lines, m.date), /JSON/);
});

test("birleştirme: aynı satıra bağlı benzer taslak tekrar eklenmez", () => {
  const a = [{ kind: "gorev", text: "Özeti cumaya kadar kanala gönder", lineIds: ["L10"] }];
  const r = C.mergeItems(a, [{ kind: "gorev", text: "Özeti cumaya kadar kanala göndermek", lineIds: ["L10"] }, { kind: "gorev", text: "Ekran görüntülerini güncelle", lineIds: ["L11"] }]);
  assert.equal(r.added, 1);
});

test("dışa aktarma yalnız onaylı öğeleri yazar; CSV, ICS, Markdown, TXT", () => {
  const p = parse(S.text);
  const x = C.extract(p.lines, p.speakers, { meetingDate: S.date, participants: S.participants });
  const items = x.decisions.concat(x.tasks);
  items[0].status = "onayli";
  const t1 = items.find((t) => t.kind === "gorev" && t.assignee === "Mehmet Kaya"); t1.status = "onayli";
  const t2 = items.find((t) => t.kind === "gorev" && t.assigneeState === "belirsiz"); t2.status = "onayli";
  const m = C.normalizeMeeting({ title: "Lansman; haftalık", date: S.date, format: p.format, lines: p.lines, items, consent: { informed: true, method: "Toplantı başında sözlü" } });
  const csv = C.exportMeeting(m, "csv").body;
  assert.ok(csv.startsWith("﻿"));
  assert.equal(csv.trim().split("\r\n").length, 3);
  assert.match(csv, /"Lansman; haftalık"/);
  const inj = C.normalizeMeeting({ title: "=HYPERLINK(1)", lines: p.lines, items: [{ kind: "gorev", text: "=cmd|' /C calc'!A0", status: "onayli", lineIds: ["L1"] }] });
  const icsv = C.exportMeeting(inj, "csv").body;
  assert.ok(icsv.includes("'=cmd") && icsv.includes("'=HYPERLINK"), "formül enjeksiyonu engellenmeli");
  const ics = C.exportMeeting(m, "ics").body;
  assert.equal((ics.match(/BEGIN:VTODO/g) || []).length, 2);
  assert.match(ics, /DUE;VALUE=DATE:2026110[56]/);
  const md = C.exportMeeting(m, "md").body;
  assert.match(md, /## Kararlar/);
  assert.match(md, /Sorumlusu belirsiz/);
  assert.match(md, /Toplantı başında sözlü/);
  assert.ok(!md.includes("Bu arada geçen ay"));
  const txt = C.exportMeeting(m, "txt").body;
  assert.match(txt, /GÖREVLER\n1\. /);
});

test("arama: Türkçe harf duyarsız, kararlar önce", () => {
  const p = parse(S.text);
  const x = C.extract(p.lines, p.speakers, { meetingDate: S.date, participants: S.participants });
  const m = C.normalizeMeeting({ id: "m1", title: "Lansman", date: S.date, lines: p.lines, items: x.decisions.concat(x.tasks) });
  const r = C.search([m], "lansman tarihi");
  assert.equal(r[0].type, "karar");
  assert.ok(C.search([m], "sss sayfasi").length >= 2);
  assert.equal(C.search([m], "x").length, 0);
});

test("normalleştirme ve ayarlar: geçersiz değerler temizlenir, yerel model yalnız loopback", () => {
  const m = C.normalizeMeeting({ title: "", items: [{ kind: "gorev", text: "Bir iş", assignee: "", assigneeState: "acik", status: "x" }] });
  assert.equal(m.title, "Toplantı");
  assert.equal(m.items[0].assigneeState, "belirsiz");
  assert.equal(m.items[0].status, "taslak");
  assert.equal(C.normalizeSettings({ localUrl: "http://example.com" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({ localUrl: "http://localhost:11434" }).localUrl, "http://localhost:11434");
  assert.equal(C.normalizeSettings({ minConfidence: 0.1 }).minConfidence, 0.5);
  assert.equal(C.isLoopbackUrl("http://user:pw@127.0.0.1:1"), false);
});

test("hassas değerler ve parola benzeri pano", () => {
  const s = C.sensitiveSummary("Mail: a.b@ornek.com, tel 0532 123 45 67, IBAN TR33 0006 1005 1978 6457 8413 26, parola: Gizli123!");
  assert.deepEqual(s.map((x) => x.type).sort(), ["email", "gizli", "iban", "telefon"]);
  assert.equal(C.looksLikeSecret("Xy7#kq9Lm"), true);
  assert.equal(C.looksLikeSecret("Toplantı notu"), false);
});

test("kullanıcı onay/red kesinliği ve toplantı özeti", () => {
  const items = [{ source: "kural", status: "onayli" }, { source: "kural", status: "onayli" }, { source: "mymind", status: "red" }, { source: "elle", status: "onayli" }, { source: "kural", status: "taslak" }];
  const r = C.reviewPrecision(items);
  assert.deepEqual([r.approved, r.rejected, r.pending, r.precision], [2, 1, 1, 66.7]);
});
