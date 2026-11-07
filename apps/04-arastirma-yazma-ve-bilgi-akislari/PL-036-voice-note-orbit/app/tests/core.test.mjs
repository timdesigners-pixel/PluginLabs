import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");
const R = require("../src/recorder.js");

const B = "2026-11-04"; // Çarşamba
const W = (t, now = "10:00", base = B) => C.parseWhen(t, base, now);

test("etiketli örnek kümesinde tarih doğruluğu ≥ %90 (Notion ölçütü)", () => {
  const e = C.evaluate(S.gold);
  assert.ok(e.total >= 40, "en az 40 etiketli örnek");
  assert.ok(e.accuracy >= 90, "doğruluk " + e.accuracy + " — kaçanlar: " + JSON.stringify(e.misses));
});

test("bağımsız ikinci küme (kurallar yazıldıktan sonra eklendi) ≥ %90", () => {
  const base = "2026-11-07", now = "18:30"; // Cumartesi akşam
  const hold = [
    { text: "Pazartesi sabah 10'da müşteriyi ara", date: "2026-11-09", time: "10:00" },
    { text: "Yarın öğlen annemle yemek", date: "2026-11-08", time: "12:00" },
    { text: "Salı günü kargoyu gönder", date: "2026-11-10" },
    { text: "Önümüzdeki hafta cuma raporu teslim et", date: "2026-11-13" },
    { text: "Bugün saat 21:15'te ilaç", date: "2026-11-07", time: "21:15" },
    { text: "25 Aralık'ta hediye al", date: "2026-12-25" },
    { text: "Saat 6'da antrenman", ambiguous: true },
    { text: "Haftaya oto servisi", ambiguous: true },
    { text: "Cumartesi pazar alışverişi", ambiguous: true },
    { text: "İki gün sonra faturayı öde", date: "2026-11-09" },
    { text: "Ayın 15'inde kira", date: "2026-11-15" },
    { text: "Ayın 3'ünde aidat", date: "2026-12-03" },
    { text: "Bu akşam çöpü çıkar", date: "2026-11-07", time: "19:00" },
    { text: "Remind me to water the plants on Sunday", date: "2026-11-08" },
    { text: "Book the flight next Tuesday", date: "2026-11-10" },
    { text: "Dentist on December 3 at 9am", date: "2026-12-03", time: "09:00" },
    { text: "Saat 17:00'de kapanış", ambiguous: true, why: "17:00 geçti (18:30) → bugün mü yarın mı" },
    { text: "Süt bitti, market listesine ekle", date: "" },
    { text: "Gece 11'de yayın var", date: "2026-11-07", time: "23:00" },
    { text: "3 hafta sonra pasaport yenile", date: "2026-11-28" },
  ].map((g) => ({ base, now, ...g }));
  const e = C.evaluate(hold);
  console.log("bağımsız küme:", e.ok + "/" + e.total, "%" + e.accuracy, e.misses.map((m) => m.text));
  assert.ok(e.accuracy >= 90, JSON.stringify(e.misses));
});

test("belirsiz ifadelerde tek tarih uydurulmaz, seçenek sunulur", () => {
  const a = W("Saat 3'te Can'ı ara");
  assert.equal(a.ambiguous, true);
  assert.equal(a.time, "");
  assert.deepEqual(a.timeOptions, ["15:00", "03:00"]);
  const b = W("Haftaya bankaya uğra");
  assert.equal(b.ambiguous, true);
  assert.equal(b.date, "");
  assert.ok(b.dateOptions.includes("2026-11-09") && b.dateOptions.includes("2026-11-11"));
  const c = W("Çarşamba spor"); // bugün çarşamba
  assert.deepEqual(c.dateOptions, ["2026-11-04", "2026-11-11"]);
  const d = W("Saat 09:30'da otobüs", "11:00"); // saat geçti (baştaki sıfır: 24 saat biçimi)
  assert.equal(d.ambiguous, true);
  assert.deepEqual(d.dateOptions, ["2026-11-04", "2026-11-05"]);
  assert.equal(d.time, "09:30");
  const ch = C.whenChoices(a);
  assert.equal(ch.length, 2);
  assert.equal(ch[0].time, "15:00");
  assert.match(ch[0].label, /4 Kasım Çarşamba 15:00/);
  assert.deepEqual(C.whenChoices(W("Yarın 14:00")), []);
});

test("Türkçe harfler sözcük sınırını bozmaz; gösterilen ifade özgün metinden", () => {
  const a = W("Öbür gün kargo gelecek");
  assert.equal(a.date, "2026-11-06");
  assert.equal(a.text, "Öbür gün");
  assert.equal(W("Bu akşam Zeynep'e yaz").text, "Bu akşam");
  assert.equal(W("Perşembe akşam 8'de sinema").time, "20:00");
  assert.equal(W("Yarın öğleden sonra 2'de kuaför").time, "14:00");
  assert.equal(W("Kitap okumak güzel"), null);
  // 15.11 gibi tarih biçimi saat sanılmaz
  assert.equal(W("15.11.2026 tarihinde noter").date, "2026-11-15");
  assert.equal(W("15.11.2026 tarihinde noter").time, "");
});

test("tür: görev / not ayrımı", () => {
  assert.equal(C.classify("Ekmek ve süt al").kind, "gorev");
  assert.equal(C.classify("Yarın annemi aramayı unutma").kind, "gorev");
  assert.equal(C.classify("Remind me to call the dentist").kind, "gorev");
  assert.equal(C.classify("Kitap için yeni bir fikir: zaman yolculuğu yapan kedi").kind, "not");
  assert.equal(C.classify("Not: toplantı çok verimli geçti").kind, "not");
  assert.equal(C.classify("Bugün hava çok güzeldi").kind, "not");
  const a = C.analyze("Eee şey, hatırlat: yarın 10'da Elif'i ara.", B, "09:00");
  assert.equal(a.kind, "gorev");
  assert.equal(a.title, "Yarın 10'da Elif'i ara");
  assert.equal(a.when.date, "2026-11-05");
  // "10'da" gün parçası olmadan sabah/akşam belirsizdir: olası olan (10:00) önce sunulur, seçim kullanıcının.
  assert.equal(a.when.time, "");
  assert.deepEqual(a.when.timeOptions, ["10:00", "22:00"]);
  assert.equal(C.analyze("Yarın sabah 10'da Elif'i ara", B, "09:00").when.time, "10:00");
});

test("MyMind isteği hassas değerleri maskeler; yanıt doğrulanır", () => {
  const note = C.normalizeNote({ transcript: "Yarın ali@ornek.com adresine yaz, IBAN TR12 0006 4000 0011 2345 6789 01, telefon 0532 123 45 67", day: B });
  const p = C.aiPayload(note, B);
  const user = p.messages[1].content;
  assert.ok(!user.includes("ali@ornek.com") && !user.includes("0532") && !user.includes("TR12"));
  assert.equal(p.sent.masked, 3);
  const ok = C.validateAi('```json\n{"tur":"gorev","baslik":"⟦1⟧ adresine yaz","tarih_ifadesi":"yarın","duzeltilmis":"Yarın ⟦1⟧ adresine yaz, IBAN ⟦2⟧, telefon ⟦3⟧."}\n```', p, note);
  assert.equal(ok.kind, "gorev");
  assert.equal(ok.title, "ali@ornek.com adresine yaz");
  assert.ok(ok.corrected.includes("ali@ornek.com"));
  assert.equal(ok.dateText, "yarın");
  const bad = C.validateAi('{"tur":"gorev","baslik":"x","tarih_ifadesi":"15 Mart","duzeltilmis":"tamamen uydurma ve çok çok çok uzun bir metin ' + "a".repeat(400) + '"}', p, note);
  assert.equal(bad.dateText, "", "metinde geçmeyen tarih atılır");
  assert.equal(bad.corrected, "", "aşırı farklı düzeltme atılır");
  assert.equal(bad.dropped, 2);
  assert.throws(() => C.validateAi("merhaba", p, note), /JSON/);
});

test("WAV: kaydedici çıktısı ana süreç denetiminden geçer; bozuk veri reddedilir", () => {
  const pcm = R.downsample([new Float32Array(48000).map((_, i) => Math.sin(i / 10) * 0.5)], 48000);
  assert.equal(pcm.length, 16000);
  const w = R.wav(pcm);
  const info = C.wavInfo(w);
  assert.equal(info.ok, true);
  assert.equal(info.rate, 16000);
  assert.ok(Math.abs(info.seconds - 1) < 0.01);
  assert.equal(C.wavInfo(new Uint8Array(60)).ok, false);
  const bad = new Uint8Array(w); bad[20] = 3; // PCM değil
  assert.equal(C.wavInfo(bad).ok, false);
});

test("dışa aktarma: CSV formül enjeksiyonu engellenir, ICS VTODO üretir, taslaklar girmez", () => {
  const notes = [
    C.normalizeNote({ title: "=HYPERLINK(\"x\")", kind: "gorev", status: "kayitli", transcript: "a;b", when: { date: "2026-11-05", time: "10:00" }, day: B }),
    C.normalizeNote({ title: "Tarihsiz görev", kind: "gorev", status: "tamam", day: B }),
    C.normalizeNote({ title: "Fikir", kind: "not", status: "kayitli", transcript: "Kedi", day: B }),
    C.normalizeNote({ title: "Taslak", kind: "gorev", status: "taslak", day: B }),
  ];
  const csv = C.exportNotes(notes, "csv");
  assert.equal(csv.count, 3);
  assert.ok(csv.body.includes("\"'=HYPERLINK(\"\"x\"\")\""));
  assert.ok(!csv.body.includes("Taslak"));
  const ics = C.exportNotes(notes, "ics", "2026-11-04T10:00:00.000Z");
  assert.equal(ics.count, 2);
  assert.ok(ics.body.includes("DUE:20261105T100000"));
  assert.ok(ics.body.includes("STATUS:COMPLETED"));
  assert.ok(ics.body.includes("DTSTAMP:20261104T100000Z"));
  const md = C.exportNotes(notes, "md");
  assert.ok(md.body.includes("- [x] Tarihsiz görev") && md.body.includes("### Fikir"));
});

test("ayarlar: sunucu adresleri yalnız loopback; kayıt süresi sınırlı", () => {
  assert.equal(C.normalizeSettings({ sttUrl: "http://example.com:8080" }).sttUrl, "http://127.0.0.1:8080");
  assert.equal(C.normalizeSettings({ sttUrl: "http://localhost:9000" }).sttUrl, "http://localhost:9000");
  assert.equal(C.normalizeSettings({ localUrl: "https://127.0.0.1:1" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({ maxSeconds: 999 }).maxSeconds, 120);
  assert.equal(C.normalizeSettings({}).sttAsk, true);
  assert.equal(C.isLoopbackUrl("http://user:p@127.0.0.1:1"), false);
});

test("ölçüler: hızlı kayıt (≤ 3 tık) ve tarih doğruluğu", () => {
  const notes = [
    C.normalizeNote({ source: "kayit", status: "kayitli", clicks: 3, recSeconds: 28, kind: "gorev", dateCheck: "dogru" }),
    C.normalizeNote({ source: "kayit", status: "kayitli", clicks: 4, recSeconds: 30, kind: "gorev", dateCheck: "yanlis" }),
    C.normalizeNote({ source: "kayit", status: "taslak", clicks: 1, recSeconds: 10 }),
    C.normalizeNote({ source: "kayit", status: "kayitli", clicks: 2, recSeconds: 90 }),
  ];
  const st = C.stats(notes, C.normalizeMetrics({}));
  assert.equal(st.quickSaves, 2);
  assert.equal(st.quickRate, 50);
  assert.equal(st.avgClicks, 3.5);
  assert.equal(st.dateAccuracy, 50);
  assert.equal(st.drafts, 1);
});

test("normalleştirme: bozuk not alanları güvenli değerlere iner", () => {
  const n = C.normalizeNote({ id: "../x", kind: "x", status: "y", audio: { file: "../../etc/passwd" }, when: { date: "2026-02-30", time: "25:00" }, clicks: 500 });
  assert.match(n.id, /^[a-z0-9]{6,20}$/);
  assert.notEqual(C.normalizeNote({}).id, undefined, "kimliksiz nota yeni kimlik verilir");
  assert.notEqual(C.normalizeNote({}).id, C.normalizeNote({}).id);
  assert.equal(n.kind, "not");
  assert.equal(n.status, "taslak");
  assert.equal(n.audio, null);
  assert.equal(n.when, null);
  assert.equal(n.clicks, 99);
});
