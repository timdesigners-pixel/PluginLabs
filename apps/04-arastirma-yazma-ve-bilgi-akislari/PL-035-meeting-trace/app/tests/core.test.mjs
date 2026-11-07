// Meeting Trace çekirdek birim testleri: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const meetingOf = (text, date) => { const p = C.parseTranscript(text); return C.normalizeMeeting({ title: "T", date: date || "2026-11-06", utterances: p.utterances, speakers: p.speakers }); };
const label = (m, it) => (it.owner && it.owner.key ? C.speakerLabel(m, it.owner.key) : it.owner && it.owner.name) || "belirsiz";

test("zaman biçimleri", () => {
  assert.equal(C.parseTime("01:02:03"), 3723);
  assert.equal(C.parseTime("02:03,250"), 123);
  assert.equal(C.parseTime("1:02:03.500"), 3723);
  assert.equal(C.parseTime("abc"), null);
  assert.equal(C.fmtTime(3723), "1:02:03");
  assert.equal(C.fmtTime(65), "01:05");
  assert.equal(C.fmtTime(null), "—");
});

test("metin transkripti: köşeli zaman + konuşmacı, konuşmacısız satır tahmin edilir", () => {
  const p = C.parseTranscript("[00:00:05] Ayşe Demir: Merhaba.\n[00:00:09] Mehmet: Selam.\n[00:00:15] Bunu ben yaparım.\nNot: bu bir etiket satırı");
  assert.equal(p.format, "txt");
  assert.equal(p.speakers.length, 2);
  assert.deepEqual(p.utterances.map((u) => u.t), [5, 9, 15, null]);
  assert.equal(p.utterances[2].speaker, p.utterances[1].speaker);
  assert.equal(p.utterances[2].guess, true, "konuşmacısız satır tahmin işaretli");
  assert.equal(p.guessed, 2);
  assert.ok(!p.speakers.some((s) => /Not/i.test(s.name)), "“Not:” konuşmacı sayılmaz");
});

test("Zoom/Teams dökümü: ad + zaman başlığı, ardından konuşma", () => {
  const p = C.parseTranscript("Ayşe Demir   0:01\nHerkese merhaba.\nBugün iki konu var.\n\nCan Yıldız   0:15\nBen tabloyu hazırlarım.");
  assert.equal(p.utterances.length, 2);
  assert.equal(p.utterances[0].t, 1);
  assert.equal(p.utterances[0].text, "Herkese merhaba. Bugün iki konu var.");
  assert.equal(C.speakerLabel({ speakers: p.speakers }, p.utterances[1].speaker), "Can Yıldız");
  assert.equal(p.utterances[1].guess, false);
});

test("WebVTT (<v> etiketi) ve SRT", () => {
  const vtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\n<v Ayşe Demir>Lansmanı 27 Kasım'a aldık.</v>\n\n00:00:05.000 --> 00:00:07.500\n<v.loud Can>Ben fiyat tablosunu yarın paylaşacağım.\n";
  const a = C.parseTranscript(vtt);
  assert.equal(a.format, "vtt");
  assert.equal(a.utterances.length, 2);
  assert.equal(a.utterances[1].t, 5);
  assert.deepEqual(a.speakers.map((s) => s.name), ["Ayşe Demir", "Can"]);
  const srt = "1\n00:00:01,000 --> 00:00:03,000\nSelin: Test planını pazartesi paylaşacağım.\n\n2\n00:00:04,000 --> 00:00:06,000\nTeşekkürler.\n";
  const b = C.parseTranscript(srt);
  assert.equal(b.format, "srt");
  assert.equal(b.utterances.length, 2);
  assert.equal(b.utterances[0].text, "Test planını pazartesi paylaşacağım.");
  assert.equal(b.utterances[1].guess, true);
});

test("son tarih ifadeleri toplantı tarihine göre çözülür", () => {
  const d = "2026-11-06"; // Cuma
  assert.deepEqual(C.parseDue("Raporu cumaya kadar gönderirim", d), { text: "cumaya kadar", date: "2026-11-13" });
  assert.equal(C.parseDue("yarın paylaşırım", d).date, "2026-11-07");
  assert.equal(C.parseDue("15 kasıma kadar", d).date, "2026-11-15");
  assert.equal(C.parseDue("pazarlama planını konuşalım", d).date, "", "“pazarlama” pazar günü değildir");
  assert.equal(C.parseDue("saat 14.30'da", d).date, "", "saat tarih değildir");
  assert.equal(C.parseDue("Send it by Friday", d).text, "by Friday");
  assert.equal(C.parseDue("ay sonuna kadar", d).date, "2026-11-30");
});

test("Notion ölçütü: elle etiketli Türkçe örnekte görev kesinliği ≥ %90, belirsiz sahipler görünür", () => {
  const m = meetingOf(S.text, S.date);
  const items = C.extract(m);
  const r = C.evaluate(items, S.labels, m, "gorev");
  assert.ok(r.precision >= 90, "kesinlik %" + r.precision);
  assert.ok(r.recall >= 85, "duyarlılık %" + r.recall);
  assert.equal(r.ambiguousShown, r.ambiguousWant, "etiketi “belirsiz” olan her görevde sahip kesin gösterilmez");
  const k = C.evaluate(items, S.labels, m, "karar");
  assert.ok(k.precision >= 90 && k.recall >= 75, JSON.stringify(k));
  // Sahip ayrıntıları
  const byRef = (ref) => items.filter((x) => x.kind === "gorev" && x.refs[0] === ref);
  assert.equal(label(m, byRef("u9")[0]), "Mehmet Kaya");
  assert.equal(byRef("u9")[0].rule, "istek-kabul");
  assert.equal(byRef("u21")[0].owner.name, "Zeynep");
  assert.equal(byRef("u21")[0].owner.state, "tahmin", "katılımcı olmayan kişi tahmin");
  assert.equal(byRef("u24")[0].owner.state, "kesin");
  assert.equal(label(m, byRef("u24")[0]), "Can Yıldız");
  assert.equal(byRef("u30")[0].owner.state, "tahmin", "konuşmacısı tahmin olan satırın sahibi de tahmin");
  assert.equal(byRef("u8")[0].due, "2026-11-09");
  assert.ok(!items.some((x) => x.refs[0] === "u12"), "“Bakalım… gelecek hafta” görev değil");
  assert.ok(!items.some((x) => x.refs[0] === "u27"), "olumsuz cümle görev değil");
  assert.ok(!items.some((x) => x.kind === "gorev" && x.refs[0] === "u25"), "“kim?” yanıtı ayrı görev olarak tekrar etmez");
});

// Ayrı (kurallar bu metne göre ayarlanmadı) İngilizce örnek; sonuç olduğu gibi raporlanır.
const EN = [
  "[00:00:02] Laura Chen: Thanks for joining. Let's start with the roadmap.",
  "[00:00:15] Omar Haddad: The beta feedback is mostly positive.",
  "[00:00:40] Laura Chen: We decided to ship the export feature in December.",
  "[00:01:02] Omar Haddad: I'll write the release notes by Friday.",
  "[00:01:20] Laura Chen: Priya, can you update the onboarding screens?",
  "[00:01:26] Priya Nair: Sure, I can have them ready next week.",
  "[00:01:50] Omar Haddad: We need to check the analytics dashboard before launch.",
  "[00:02:10] Laura Chen: Let's see how the numbers look next month.",
  "[00:02:30] Priya Nair: I won't change the color palette this time.",
  "[00:02:45] Laura Chen: Agreed, the pricing stays the same for now.",
  "[00:03:00] Omar Haddad: Action item: send the survey to beta users.",
  "[00:03:20] Laura Chen: Thanks everyone.",
].join("\n");
const EN_LABELS = [
  { kind: "karar", ref: "u3" }, { kind: "karar", ref: "u10" },
  { kind: "gorev", ref: "u4", owner: "Omar Haddad" }, { kind: "gorev", ref: "u5", owner: "Priya Nair" },
  { kind: "gorev", ref: "u7", owner: "belirsiz" }, { kind: "gorev", ref: "u11", owner: "belirsiz" },
];
test("İngilizce ayrı örnek (ayar yapılmadan)", () => {
  const m = meetingOf(EN);
  const items = C.extract(m);
  const r = C.evaluate(items, EN_LABELS, m, "gorev");
  console.log("İngilizce ayrı örnek — görev:", JSON.stringify(r), "karar:", JSON.stringify(C.evaluate(items, EN_LABELS, m, "karar")));
  assert.ok(r.precision >= 80, JSON.stringify(r));
  assert.ok(r.recall >= 75, JSON.stringify(r));
});

test("yeniden çıkarım: onaylı/reddedilmiş korunur, reddedilen geri gelmez", () => {
  const m = meetingOf(S.text, S.date);
  let { items } = C.mergeExtraction([], C.extract(m));
  const n = items.length;
  items[0].status = "reddedildi";
  items[1].status = "onayli";
  items.push(C.normalizeItem({ kind: "gorev", text: "Elle eklenen görev", origin: "elle", status: "onayli", refs: ["u1"] }));
  const r = C.mergeExtraction(items, C.extract(m));
  assert.equal(r.added, n - 2);
  assert.equal(r.items.length, n + 1);
  assert.equal(r.items.find((x) => x.sig === items[0].sig).status, "reddedildi");
  // MyMind birleştirmesi bekleyen adayları silmez.
  const ai = C.mergeExtraction(r.items, [C.normalizeItem({ kind: "gorev", text: "Yeni MyMind görevi", origin: "ai", status: "aday", refs: ["u2"] })], { keepAll: true });
  assert.equal(ai.added, 1);
  assert.equal(ai.items.length, r.items.length + 1);
  assert.equal(ai.items.filter((x) => x.status === "aday").length, r.items.filter((x) => x.status === "aday").length + 1);
});

test("zaman damgalı notlar: gündem işaretinde yeni bölüm, bölümün maddeleri", () => {
  const m = meetingOf(S.text, S.date);
  m.items = C.mergeExtraction([], C.extract(m)).items;
  const ns = C.notes(m, 5);
  assert.deepEqual(ns.filter((x) => x.topic).map((x) => x.title), ["lansman tarihi", "fiyatlandırma", "destek hazırlığı"]);
  const price = ns.find((x) => x.title === "fiyatlandırma");
  assert.equal(price.start, 200);
  assert.ok(price.decisions.length >= 3);
  assert.ok(price.tasks.length >= 2);
});

test("MyMind isteği: adlar takma ad, hassas değerler gizli, yalnız seçili satırlar", () => {
  const m = meetingOf("[00:00:01] Ayşe Demir: Mehmet, raporu ayse@ornek.com adresine gönderir misin? Telefonum 0532 123 45 67.\n[00:00:05] Mehmet Kaya: Tamam. IBAN TR33 0006 1005 1978 6457 8413 26.\n[00:00:09] Ayşe Demir: Gizli satır.");
  const p = C.aiPayload(m, ["u1", "u2"]);
  const all = JSON.stringify(p.requests);
  for (const bad of ["Ayşe", "Mehmet", "Demir", "Kaya", "ayse@ornek.com", "0532", "TR33", "Gizli satır"]) assert.ok(!all.includes(bad), bad + " gönderilmemeli");
  assert.match(all, /u1 \[00:01\] K1: K2, raporu ⟦e-posta⟧/);
  assert.match(all, /⟦telefon⟧/);
  assert.match(all, /⟦IBAN⟧/);
  assert.equal(p.sent.utterances, 2);
  assert.ok(p.sent.names >= 1);
  assert.deepEqual(p.sent.sensitive.map((x) => x.type).sort(), ["email", "iban", "telefon"]);
});

test("MyMind yanıtı doğrulanır: kaynaksız/istek dışı madde atılır, takma ad geri çevrilir", () => {
  const m = meetingOf("[00:00:01] Ayşe Demir: Raporu kim gönderecek?\n[00:00:04] Mehmet Kaya: Ben cuma gönderirim.\n[00:00:09] Ayşe Demir: Tamam, kararlaştırıldı.");
  const p = C.aiPayload(m);
  const req = p.requests[0];
  const content = "```json\n" + JSON.stringify({
    kararlar: [{ metin: "Raporu K2 gönderecek", kaynak: ["u3"] }, { metin: "Uydurma karar", kaynak: ["u99"] }],
    gorevler: [
      { metin: "Raporu gönder", sorumlu: "K2", tarih: "cuma", kaynak: ["u2"] },
      { metin: "Sunumu hazırla", sorumlu: "tahmin:K1", kaynak: ["u1"] },
      { metin: "Bütçeyi onayla", sorumlu: "Ahmet", kaynak: ["u1"] },
      { metin: "Kaynaksız görev", sorumlu: "K1", kaynak: [] },
    ],
  }) + "\n```";
  const r = C.validateAi(content, req, p, m);
  assert.equal(r.rejected, 2);
  assert.equal(r.items.length, 4);
  assert.equal(r.items[0].text, "Raporu Mehmet Kaya gönderecek");
  const t = r.items.filter((x) => x.kind === "gorev");
  assert.equal(C.speakerLabel(m, t[0].owner.key), "Mehmet Kaya");
  assert.equal(t[0].owner.state, "kesin");
  assert.equal(t[0].due, "2026-11-13");
  assert.equal(t[1].owner.state, "tahmin");
  assert.equal(t[2].owner.state, "belirsiz");
  assert.ok(t.every((x) => x.status === "aday" && x.origin === "ai"), "MyMind maddeleri onaysız eklenir");
  assert.equal(C.validateAi("yanıt yok", req, p, m).items.length, 0);
});

test("dışa aktarma: yalnız onaylı maddeler; CSV Excel uyumlu; Markdown notlar", () => {
  const m = meetingOf(S.text, S.date);
  m.items = C.mergeExtraction([], C.extract(m)).items;
  m.items.forEach((x, i) => { x.status = i % 3 === 2 ? "aday" : "onayli"; });
  const md = C.exportMeeting(m, "md").body;
  assert.match(md, /^# T/);
  assert.match(md, /## Kararlar/);
  assert.match(md, /\| Görev \| Sorumlu \| Son tarih \| Zaman \|/);
  assert.match(md, /### 03:20 — fiyatlandırma/);
  assert.match(md, /onay bekliyor; bu dosyaya yalnız onaylı maddeler alındı/);
  const pending = m.items.find((x) => x.status === "aday");
  assert.ok(!md.includes(pending.text.replace(/\|/g, "\\|") + " |"), "onay bekleyen madde tabloda yok");
  const csv = C.exportMeeting(m, "csv").body;
  assert.ok(csv.startsWith("﻿Tür;Metin;Sorumlu"));
  assert.equal(csv.trim().split("\r\n").length, 1 + m.items.filter((x) => x.status === "onayli").length);
  const all = C.exportMeeting(m, "csv", { pending: true }).body;
  assert.equal(all.trim().split("\r\n").length, 1 + m.items.length);
  const j = JSON.parse(C.exportMeeting(m, "json").body);
  assert.equal(j.app, "meeting-trace");
  assert.ok(j.tasks.every((x) => x.status === "onayli"));
});

test("normalleştirme ve ayarlar", () => {
  const m = C.normalizeMeeting({ utterances: [{ id: "u1", t: "x", text: "a" }, { id: "", text: "b" }], items: [{ kind: "x", text: "y", status: "z", owner: { state: "q" } }] });
  assert.equal(m.utterances.length, 1);
  assert.equal(m.utterances[0].t, null);
  assert.equal(m.items[0].kind, "gorev");
  assert.equal(m.items[0].status, "aday");
  assert.equal(m.items[0].owner.state, "belirsiz");
  assert.equal(C.normalizeSettings({ localUrl: "http://example.com" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({ minutes: 7 }).minutes, 5);
  assert.ok(C.isLoopbackUrl("http://localhost:11434"));
  assert.ok(!C.isLoopbackUrl("https://127.0.0.1"));
  assert.ok(!C.looksLikeName("Bu çok uzun bir cümle, konuşmacı değil"));
  assert.ok(C.looksLikeName("Konuşmacı 2"));
});
