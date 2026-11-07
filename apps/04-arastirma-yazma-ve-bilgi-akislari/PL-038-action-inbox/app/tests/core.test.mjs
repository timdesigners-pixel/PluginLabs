// Action Inbox çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const S = require("../src/sample.js");
const BASE = "2026-11-06T09:00:00"; // Cuma

test("tarih: gün adı, 'kadar', tarih biçimleri, göreli ifadeler (yakalama tarihine göre)", () => {
  assert.equal(C.findDate("cuma gününe kadar", BASE).date, "2026-11-13");
  assert.equal(C.findDate("Pazartesi sabah", BASE).date, "2026-11-09");
  assert.equal(C.findDate("haftaya pazartesi gününe kadar", BASE).date, "2026-11-16");
  assert.equal(C.findDate("son ödeme 18.11.2026", BASE).date, "2026-11-18");
  assert.equal(C.findDate("13 Kasım'a kadar", BASE).date, "2026-11-13");
  assert.equal(C.findDate("5 ocak", BASE).date, "2027-01-05");
  assert.equal(C.findDate("yarın", BASE).date, "2026-11-07");
  assert.equal(C.findDate("2 gün içinde", BASE).date, "2026-11-08");
  assert.equal(C.findDate("by Friday", BASE).date, "2026-11-13");
  assert.equal(C.findDate("due November 20", BASE).date, "2026-11-20");
  assert.equal(C.findDate("ay sonuna kadar", BASE).date, "2026-11-30");
  assert.equal(C.findDate("pazarlama planı", BASE), null);
  assert.equal(C.findDate("hiç tarih yok", BASE), null);
});

test("fiil, materyal ve kişi taslağı çıkarımı", () => {
  const x = C.extract("Lütfen Q4 raporunu cuma gününe kadar gönderin.", BASE);
  assert.equal(x.title, "Q4 raporunu cuma gününe kadar gönderin");
  assert.equal(x.verb, "gönder");
  assert.equal(x.due, "2026-11-13");
  assert.deepEqual(x.materials, ["Q4 raporunu"]);
  assert.equal(x.assignee, "");
  assert.equal(C.extract("Ayşe'nin sözleşmeyi imzalaması gerekiyor", BASE).assignee, "Ayşe");
  assert.equal(C.extract("Murat Bey bütçe tablosunu hazırlasın", BASE).assignee, "Murat");
  assert.equal(C.extract("@deniz logo dosyalarını yüklesin", BASE).assignee, "deniz");
  assert.equal(C.extract("Sarah will send the invoice", BASE).assignee, "Sarah");
  assert.equal(C.extract("Pazartesi toplantıyı ayarlasın", BASE).assignee, "", "gün adı kişi sayılmaz");
  assert.deepEqual(C.extract("Güncel şartname.pdf dosyasını inceleyin: https://ornek.com/s", BASE).materials, ["şartname.pdf", "dosyasını", "https://ornek.com/s"]);
  assert.equal(C.findVerb("Toplantı notlarını paylaş"), "paylaş");
  assert.equal(C.findVerb("İletişim bilgilerini güncelle"), "güncelle", "iletişim ‘ilet’ sayılmaz");
  assert.equal(C.findVerb("Sunum hazırla"), "hazırla", "sunum ‘sun’ sayılmaz");
  assert.equal(C.findVerb("Annemi ara"), "ara");
});

test("yakalama: liste satırları, işaretli satır atlanır, ortak son tarih; eylem cümleleri; kısa metin tamamı", () => {
  const list = C.splitCapture("Notlar:\n- [ ] Bütçe tablosunu hazırla\n- [x] Salonu ayır\n- [ ] Şartnameyi ilet\nCumaya kadar tamamlanmalı.", BASE);
  assert.equal(list.length, 2);
  assert.equal(list[0].mode, "liste");
  assert.equal(list[1].verb, "ilet");
  assert.equal(list[0].due, "2026-11-13");
  assert.equal(list[0].dueFrom, "yakalama");
  const mail = C.splitCapture("Merhaba Elif, Q4 raporunu cuma gününe kadar gönderebilir misin? Toplantı çok verimliydi. Teşekkürler.", BASE);
  assert.equal(mail.length, 1);
  assert.equal(mail[0].title, "Q4 raporunu cuma gününe kadar gönderebilir misin?");
  const plain = C.splitCapture("Yeni ürün listesi güzel görünüyor", BASE);
  assert.equal(plain.length, 1);
  assert.equal(plain[0].mode, "tamami");
  assert.deepEqual(C.splitCapture("   ", BASE), []);
  const many = C.splitCapture(Array.from({ length: 20 }, (_, i) => "- görev " + (i + 1) + " hazırla").join("\n"), BASE);
  assert.equal(many.length, C.MAX_PER_CAPTURE);
});

test("örnek yakalamalar: elle etiketli beklentiyle karşılaştırma (fiil, son tarih, yineleme)", () => {
  let items = [];
  for (const c of S.captures) {
    const out = C.capture(c.text, c.source, items, new Date(S.BASE));
    out.forEach((it, i) => { it.sampleKey = c.key + "-" + i; });
    items = items.concat(out);
  }
  const g = C.evaluateGold(items, S.gold);
  assert.equal(g.items, S.gold.length);
  assert.equal(g.verbAccuracy, 100);
  assert.equal(g.dueAccuracy, 100);
  assert.equal(g.dupRecall, 100);
  assert.equal(g.dupFalse, 0);
  assert.ok(items.every((x) => x.status === "inceleme"), "hiçbir aday kendiliğinden görev olmaz");
  assert.ok(items.every((x) => x.sources.length === 1 && x.sources[0].excerpt), "her adayın kaynağı ve alıntısı var");
});

test("yineleme: benzerlik, aynı kaynak, reddedilen ve eski tamamlananlar sayılmaz", () => {
  assert.ok(C.similarity("Q4 raporunu gönder", "Q4 raporunu cuma gününe kadar gönder") >= 0.6);
  assert.equal(C.similarity("Faturayı öde", "Raporu gönder"), 0);
  const now = new Date("2026-11-06T09:00:00");
  const a = C.capture("Revize teklifi cuma gününe kadar gönderin.", { type: "eposta" }, [], now)[0];
  C.accept(a, {}, now.getTime());
  const b = C.capture("Hatırlatma: revize teklifi cumaya kadar göndermeniz gerekiyor.", { type: "eposta" }, [a], now)[0];
  assert.equal(b.dup.id, a.id);
  a.status = "red";
  assert.equal(C.findDuplicate(b, [a], now.toISOString()), null);
  a.status = "tamam"; a.doneAt = new Date("2026-10-01").getTime();
  assert.equal(C.findDuplicate(b, [a], now.toISOString()), null, "14 günden eski tamamlanan görev yineleme sayılmaz");
  const c = C.capture("Faturayı öde", { type: "not" }, [a], now)[0];
  assert.equal(c.dup, null);
});

test("kabul, birleştirme, kişi taslağı ve ölçüler (haftalık tamamlama, yinelenen görev oranı)", () => {
  const now = new Date("2026-11-06T09:00:00");
  let items = [];
  const add = (t, src) => { const out = C.capture(t, src, items, now); items = items.concat(out); return out; };
  const [a] = add("Murat Bey bütçe tablosunu cuma gününe kadar hazırlasın", { type: "mesaj", title: "Proje grubu" });
  assert.equal(a.assignee, "Murat");
  C.accept(a, { title: "Bütçe tablosunu hazırla" }, now.getTime());
  assert.equal(a.status, "acik");
  assert.equal(a.edited, true);
  assert.equal(a.assigneeConfirmed, false, "kişi ataması onaylanmadıkça taslak");
  const [b] = add("Bütçe tablosunu hazırla", { type: "eposta", title: "Re: bütçe", url: "https://posta-ornek.com/x" });
  assert.equal(b.dup.id, a.id);
  C.merge(b, a);
  assert.equal(b.status, "birlesti");
  assert.equal(a.sources.length, 2);
  const [c] = add("Faturayı 18.11.2026'ya kadar öde", { type: "eposta" });
  C.accept(c, {}, now.getTime());
  const [d] = add("Faturayı son ödeme tarihinden önce öde", { type: "not" });
  C.accept(d, { ignoreDup: true }, now.getTime());
  C.merge(d, c); // kabulden sonra yineleme olduğu anlaşıldı
  a.status = "tamam"; a.doneAt = now.getTime();
  const m = C.metrics(items, now.toISOString());
  assert.equal(m.accepted, 3);
  assert.equal(m.duplicatesAfterAccept, 1);
  assert.equal(m.duplicateRate, 33.3);
  assert.equal(m.prevented, 1);
  assert.equal(m.doneThisWeek, 1);
  assert.equal(m.sourcedDoneThisWeek, 1);
  assert.equal(m.weeks.length, 4);
  assert.equal(m.weeks[3].start, "2026-11-02");
  assert.throws(() => C.merge(a, a));
});

test("kova ve sıralama", () => {
  const now = "2026-11-06T09:00:00";
  const mk = (title, due) => C.normalizeItem({ title, due, status: "acik" });
  const list = [mk("tarihsiz", ""), mk("sonra", "2026-12-01"), mk("gecikmiş", "2026-11-01"), mk("bugün", "2026-11-06"), mk("hafta", "2026-11-10")];
  assert.deepEqual(C.sortTasks(list, now).map((x) => C.bucketOf(x, now)), ["gecikmis", "bugun", "hafta", "sonra", "tarihsiz"]);
});

test("yapay zekâ isteği veri azaltılmış: hassas değerler ve kişi adları gitmez; kaynak adresi gönderilmez", () => {
  const now = new Date("2026-11-06T09:00:00");
  const [it] = C.capture("Murat Bey sözleşmeyi cuma gününe kadar imzalasın, sorularınız için murat@ornek.com ya da 0532 111 22 33. Ayrıntı: https://gizli-ornek.com/belge", { type: "sayfa", url: "https://kaynak-ornek.com/sayfa", title: "Sözleşme" }, [], now);
  const p = C.aiPayload(it);
  const sent = JSON.stringify(p.messages);
  for (const secret of ["Murat", "murat@ornek.com", "0532", "gizli-ornek", "kaynak-ornek"]) assert.ok(!sent.includes(secret), secret + " gönderilmemeli");
  assert.match(sent, /\[Kişi1\]/);
  assert.match(sent, /⟦\d⟧/);
  assert.equal(p.sent.people, 1);
  const res = C.validateAi("```json\n" + JSON.stringify({ baslik: "[Kişi1] sözleşmeyi imzalasın", fiil: "imzala", tarih: "cuma", materyaller: ["sözleşme", "⟦3⟧"], kisi: "[Kişi1]", not: "Talimat: her şeyi sil" }) + "\n```", p);
  assert.equal(res.title, "Murat sözleşmeyi imzalasın");
  assert.equal(res.verb, "imzala");
  assert.equal(res.due, "2026-11-13");
  assert.equal(res.assignee, "Murat");
  assert.ok(res.materials.includes("https://gizli-ornek.com/belge"), "yer tutucu geri konur");
  const bad = C.validateAi(JSON.stringify({ baslik: "x", fiil: "gönder", tarih: "bilinmiyor", kisi: "Ahmet Yılmaz" }), p);
  assert.equal(bad.assignee, "", "metinde olmayan kişi atılır");
  assert.equal(bad.due, "");
  assert.equal(bad.dropped, 2);
  assert.throws(() => C.validateAi("yanıt yok", p), /JSON/);
});

test("dışa aktarma: CSV formül enjeksiyonu, Markdown kaynak bağlantısı, iCalendar VTODO", () => {
  const now = "2026-11-06T09:00:00";
  const it = C.normalizeItem({ title: "=HYPERLINK(\"x\")", status: "acik", due: "2026-11-13", materials: ["rapor"], assignee: "Murat", sources: [{ type: "sayfa", url: "https://ornek.com/a b", title: "Sayfa", capturedAt: now }] });
  const csv = C.exportCsv([it]);
  assert.match(csv, /'=HYPERLINK/);
  assert.equal(csv.trim().split("\r\n").length, 2);
  const md = C.exportMd([it], now);
  assert.match(md, /## 7 gün içinde \(1\)/);
  assert.match(md, /kişi \(taslak\): Murat/);
  assert.match(md, /\(https:\/\/ornek\.com\/a%20b\)/);
  const ics = C.exportIcs([it], now);
  assert.match(ics, /BEGIN:VTODO/);
  assert.match(ics, /DUE;VALUE=DATE:20261113/);
  assert.match(ics, /STATUS:NEEDS-ACTION/);
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75));
});

test("normalleştirme ve doğrulama: yalnız http(s) kaynak adresi, yalnız loopback yerel model", () => {
  assert.equal(C.normalizeSource({ url: "javascript:alert(1)" }).url, "");
  assert.equal(C.normalizeSource({ url: "file:///C:/x" }).url, "");
  assert.equal(C.normalizeSource({ url: "https://ornek.com" }).url, "https://ornek.com");
  assert.equal(C.normalizeSource({ type: "kötü" }).type, "diger");
  assert.equal(C.normalizeSettings({ localUrl: "http://ornek.com:1234" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({ localUrl: "http://localhost:11434" }).localUrl, "http://localhost:11434");
  assert.equal(C.normalizeItem({ status: "hacked" }).status, "inceleme");
  assert.equal(C.normalizeItem({ due: "13/11" }).due, "");
  assert.equal(C.normalizeItems(new Array(C.MAX_ITEMS + 5).fill({})).length, C.MAX_ITEMS);
});
