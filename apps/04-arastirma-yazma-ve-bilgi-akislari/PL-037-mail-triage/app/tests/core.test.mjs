// Mail Triage çekirdek birim testleri: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");

const bin = (s) => Buffer.from(s, "utf8").toString("latin1");
const sampleMails = () => S.mails.map((x) => { const m = C.normalizeMail({ ...C.parseEml(bin(x.raw), x.key), sampleKey: x.key }); m.suggestion = C.triage(m, S.settings); return m; });
const one = (headers, body, opts) => { const raw = Object.entries(headers).map(([k, v]) => k + ": " + v).join("\r\n") + "\r\n\r\n" + body; const m = C.parseEml(bin(raw)); m.suggestion = C.triage(m, opts || S.settings); return m; };
const ME = "elif@ornekfirma.com.tr";

test("RFC 2047 başlıkları ve karakter kümeleri", () => {
  assert.equal(C.decodeWords("=?utf-8?B?U2lwYXJpxZ9pbml6?="), "Siparişiniz");
  assert.equal(C.decodeWords("=?iso-8859-9?Q?=DE=FDk=E2yet_formu?="), "Şıkâyet formu");
  assert.equal(C.decodeWords("=?utf-8?Q?a?= =?utf-8?Q?b?="), "ab");
  assert.equal(C.decodeWords(bin("Düz UTF-8 konu")), "Düz UTF-8 konu");
  assert.deepEqual(C.parseAddresses('"Demir, Ayşe" <Ayse@Ornek.com>, b@c.org'), [{ name: "Demir, Ayşe", addr: "ayse@ornek.com" }, { name: "", addr: "b@c.org" }]);
});

test("MIME: multipart, quoted-printable HTML, base64, ekler, .ics", () => {
  const ms = sampleMails();
  const k = (key) => ms.find((m) => m.sampleKey === key);
  assert.match(k("k3").body, /Sepette ek %50 indirim fırsatını kaçırmayın/);
  assert.ok(!/<|href/.test(k("k3").body), "HTML etiketleri metne karışmamalı");
  assert.equal(k("k3").subject, "Son gün! Tüm ürünlerde %50 indirim");
  assert.match(k("k7").body, /Q4 raporunun son hâli/);
  assert.equal(k("k7").from.name, "Oğuz Türk");
  assert.deepEqual(k("k2").attachments.map((a) => a.name), ["fatura-2026-11.pdf"]);
  assert.equal(k("k5").calendar, true);
  assert.equal(k("k3").list, true);
  assert.equal(k("k4").auto, true);
  assert.equal(k("k1").date, "2026-11-06T06:12:00.000Z");
});

test("Windows-1254 gövde ve RFC 2231 dosya adı", () => {
  const raw = "From: a@b.com\r\nSubject: x\r\nContent-Type: multipart/mixed; boundary=X\r\n\r\n--X\r\nContent-Type: text/plain; charset=windows-1254\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n=DEirket =E7al=FD=FEanlar=FD\r\n--X\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename*=utf-8''s%C3%B6zle%C5%9Fme.pdf\r\n\r\nAAAA\r\n--X--\r\n";
  const m = C.parseEml(raw);
  assert.equal(m.body.trim(), "Şirket çalışanları");
  assert.equal(m.attachments[0].name, "sözleşme.pdf");
});

test("mbox bölme (mboxrd kaçışı)", () => {
  const mbox = "From a@b.com Thu Nov  5 10:00:00 2026\nFrom: a@b.com\nSubject: Bir\n\nMerhaba\n>From the start\n\nFrom c@d.com Thu Nov  5 11:00:00 2026\nFrom: c@d.com\nSubject: İki\n\nSelam\n";
  assert.equal(C.looksLikeMbox(mbox), true);
  const parts = C.splitMbox(mbox);
  assert.equal(parts.length, 2);
  assert.match(parts[0], /\nFrom the start/);
  assert.equal(C.parseEml(parts[1]).subject, "İki");
});

test("örnek gelen kutusu: etiket kesinliği/duyarlılığı, önemli iletinin düşük önerilmemesi", () => {
  const ev = C.evaluateGold(sampleMails(), S.gold);
  assert.equal(ev.mails, 12);
  assert.ok(ev.labelPrecision >= 85, "etiket kesinliği " + ev.labelPrecision);
  assert.ok(ev.labelRecall >= 85, "etiket duyarlılığı " + ev.labelRecall);
  assert.equal(ev.importantLow, 0);
  assert.ok(ev.priorityAgreement >= 90);
});

test("öncelik korumaları: toplu kampanyadaki 'son gün' düşük kalır; VIP, güvenlik, son ödeme düşük olamaz", () => {
  const ms = sampleMails(), k = (key) => ms.find((m) => m.sampleKey === key).suggestion;
  assert.equal(k("k3").priority, "dusuk");
  assert.equal(k("k1").priority, "yuksek");
  assert.match(k("k1").priorityReasons.join(" "), /önemli kişi/);
  assert.equal(k("k4").priority, "yuksek");
  assert.equal(k("k12").priority, "yuksek");
  assert.equal(k("k12").due, "2026-11-08");
  // Otomatik ama doğrudan rica içeren ileti düşük önerilmez.
  const m = one({ From: "noreply@hizmet.com", To: ME, Subject: "Hesap bilgisi", Date: "Fri, 06 Nov 2026 09:00:00 +0300" }, "Lütfen sözleşme onayınızı 10.11.2026 tarihine kadar iletin.");
  assert.notEqual(m.suggestion.priority, "dusuk");
  assert.match(m.suggestion.priorityReasons.join(" "), /düşük önceliğe alınmadı|son tarih/);
});

test("doğrudan soru 'Yanıt bekliyor'; CC ile bilgi ve teşekkür iletisi etiketsiz", () => {
  const a = one({ From: "ali@x.com", To: ME, Subject: "Rapor", Date: "Fri, 06 Nov 2026 09:00:00 +0300" }, "Raporu inceleyebildin mi? Yarın konuşalım mı?");
  assert.deepEqual(a.suggestion.labels, ["yanit"]);
  const b = one({ From: "ali@x.com", To: "ekip@x.com", Cc: ME, Subject: "Bilgi", Date: "Fri, 06 Nov 2026 09:00:00 +0300" }, "Lütfen dosyayı inceleyin.");
  assert.deepEqual(b.suggestion.labels, []);
  assert.match(b.suggestion.priorityReasons[0], /CC/);
});

test("İngilizce ileti: rica, son tarih, yanıt taslağı İngilizce", () => {
  const ms = sampleMails(), m = ms.find((x) => x.sampleKey === "k8");
  assert.equal(m.suggestion.due, "2026-11-09");
  assert.match(m.suggestion.actions[0], /Could you please sign/);
  const d = C.replyDraft(m, m.suggestion, "Elif Yıldız");
  assert.match(d, /^Hi,/);
  assert.match(d, /Best regards,\nElif Yıldız$/);
  const t = C.replyDraft(ms[0], ms[0].suggestion, "Elif Yıldız");
  assert.match(t, /^Merhaba Murat,/);
  assert.match(t, /13 kasım 2026/);
});

test("alıntı ve imza atılır", () => {
  assert.equal(C.stripQuoted("Tamam.\n\n> eski satır\nOn Mon, 2 Nov 2026 Ali wrote:\nönceki"), "Tamam.");
  assert.equal(C.stripQuoted("Selam\n-- \nAd Soyad\nUnvan"), "Selam");
  assert.equal(C.stripQuoted("Olur\n\n5 Kas 2026 tarihinde Elif şunu yazdı:\n> x"), "Olur");
});

test("tarih ve tutar çıkarımı", () => {
  assert.equal(C.findDue("Son ödeme tarihi: 08.11.2026. Asgari ödeme", "2026-11-06T06:00:00Z").date, "2026-11-08");
  assert.equal(C.findDue("Raporu cuma gününe kadar gönderin.", "2026-11-04T06:00:00Z").date, "2026-11-06");
  assert.equal(C.findDue("15 Aralık'a kadar dönüş yapın", "2026-11-04T06:00:00Z").date, "2026-12-15");
  assert.equal(C.findDue("Pazarlama ekibi toplandı.", "2026-11-04T06:00:00Z"), null);
  assert.deepEqual(C.findAmounts("Tutar: 1.245,60 TL, ayrıca $25 ve 300 EUR"), ["$25", "1.245,60 TL", "300 EUR"].sort((a, b) => "Tutar: 1.245,60 TL, ayrıca $25 ve 300 EUR".indexOf(a) - "Tutar: 1.245,60 TL, ayrıca $25 ve 300 EUR".indexOf(b)));
});

test("toplu değişiklik önizlemesi: önce/sonra, uyarı, değişmeyen satır", () => {
  const ms = sampleMails();
  const ids = ["k1", "k3"].map((k) => ms.find((m) => m.sampleKey === k).id);
  const p = C.bulkPreview(ms, ids, { priority: "dusuk", addLabel: "bulten" });
  assert.equal(p.rows.length, 2);
  assert.equal(p.changed, 1, "k3 zaten düşük + bülten");
  assert.equal(p.warnings, 1, "k1 önemli işaretli → uyarı");
  assert.deepEqual(p.rows[0].after.labels, ["yanit", "bulten"]);
});

test("ölçüler: etiket kabulü ve yanlış düşük öncelik oranı kullanıcı kararlarından", () => {
  const ms = sampleMails();
  for (const m of ms) m.reviewed = true;
  const k3 = ms.find((m) => m.sampleKey === "k3");
  k3.decision = { labels: [], priority: "yuksek", important: true }; // kullanıcı: aslında önemliydi
  const r = C.metrics(ms);
  assert.equal(r.reviewed, 12);
  assert.equal(r.labelSuggested, 14);
  assert.equal(r.labelKept, 13);
  assert.equal(r.important, 6);
  assert.equal(r.wrongLow, 1);
  assert.equal(r.wrongLowRate, 16.7);
});

test("MyMind isteği: yalnız bir ileti, adlar ve iletişim bilgileri gizli, alıntı yok", () => {
  const ms = sampleMails();
  const m = ms.find((x) => x.sampleKey === "k10");
  const p = C.aiPayload(m, { myName: "Elif Yıldız" });
  const all = JSON.stringify(p.messages);
  for (const secret of ["Selin", "Elif", "selin.kara@", "ornekfirma", "Sunumun taslağı ekte"]) assert.ok(!all.includes(secret), secret + " gönderilmemeli");
  assert.match(all, /\[Alıcı\]/);
  const k1 = C.aiPayload(ms[0], { myName: "Elif Yıldız" });
  assert.equal(k1.sent.byType[0].type, "telefon");
  assert.ok(!JSON.stringify(k1.messages).includes("0532"));
  const k4 = C.aiPayload(ms.find((x) => x.sampleKey === "k4"), {});
  assert.ok(!JSON.stringify(k4.messages).includes("482913"), "doğrulama kodu gönderilmemeli");
});

test("MyMind yanıtı doğrulanır: bilinmeyen etiket atılır, önem işaretli ileti Düşük yapılamaz, roller geri çevrilir", () => {
  const ms = sampleMails(), m = ms[0];
  const p = C.aiPayload(m, { myName: "Elif Yıldız" });
  const r = C.validateAi("```json\n" + JSON.stringify({ etiketler: ["yanit", "spam"], oncelik: "dusuk", neden: "[Gönderen] teklif istiyor", tarih: "cuma", yanit_taslagi: "Merhaba [Gönderen], ⟦1⟧ numarasından arayacağım. [Alıcı]" }) + "\n```", p, m, { myName: "Elif Yıldız" });
  assert.deepEqual(r.labels, ["yanit"]);
  assert.equal(r.unknown, 1);
  assert.equal(r.priority, "normal");
  assert.equal(r.clamped, true);
  assert.equal(r.reply, "Merhaba Murat, 0532 111 22 33 numarasından arayacağım. Elif");
  assert.equal(r.due, "2026-11-13");
  assert.throws(() => C.validateAi("yok", p, m), /JSON/);
  const low = ms.find((x) => x.sampleKey === "k3");
  const p3 = C.aiPayload(low, {});
  assert.equal(C.validateAi(JSON.stringify({ etiketler: ["bulten"], oncelik: "dusuk" }), p3, low).priority, "dusuk");
});

test("dışa aktarma: CSV (formül enjeksiyonu engellenir), Markdown öncelik grupları", () => {
  const ms = sampleMails();
  ms[0].subject = "=HYPERLINK(\"x\")";
  const csv = C.exportCsv(ms);
  assert.ok(csv.startsWith("﻿"));
  assert.equal(csv.trim().split("\r\n").length, 13);
  assert.ok(csv.includes("'=HYPERLINK"));
  const md = C.exportMd(ms);
  assert.match(md, /## Yüksek öncelik \(5\)/);
  assert.match(md, /- \[ \] /);
});

test("normalleştirme: ayarlar ve kararlar", () => {
  const s = C.normalizeSettings({ myAddresses: "a@b.com; c@d.com x", vip: ["@ornek.com", "boş"], localUrl: "http://example.com" });
  assert.deepEqual(s.myAddresses, ["a@b.com", "c@d.com"]);
  assert.deepEqual(s.vip, ["@ornek.com"]);
  assert.equal(s.localUrl, "http://127.0.0.1:1234");
  const m = C.normalizeMail({ decision: { labels: ["yanit", "x"], priority: "q" }, suggestion: { labels: ["fatura"], priority: "dusuk" } });
  assert.deepEqual(m.decision.labels, ["yanit"]);
  assert.equal(C.finalOf(m).priority, "dusuk");
  assert.equal(C.isVip("ali@musteri.com", ["@musteri.com"]), true);
  assert.equal(C.isVip("ali@musteri.com.tr", ["musteri.com"]), false);
});
