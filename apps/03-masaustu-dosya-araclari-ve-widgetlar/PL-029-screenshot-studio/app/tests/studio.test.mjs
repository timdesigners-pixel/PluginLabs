import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/studio.js");

// Kelimeleri soldan sağa 10 px/karakter genişlikte dizen yardımcı (OCR çıktısı taklidi).
function line(text, y = 10) {
  let x = 0;
  return { words: text.split(" ").map((t) => { const w = { text: t, x, y, w: t.length * 10, h: 20 }; x += t.length * 10 + 10; return w; }) };
}

test("doğrulayıcılar: Luhn, IBAN (mod 97), T.C. kimlik", () => {
  assert.ok(C.luhn("4111 1111 1111 1111"));
  assert.ok(!C.luhn("4111 1111 1111 1112"));
  assert.ok(!C.luhn("0000 0000 0000 0000"));
  assert.ok(C.ibanValid("TR33 0006 1005 1978 6457 8413 26"));
  assert.ok(!C.ibanValid("TR33 0006 1005 1978 6457 8413 27"));
  assert.ok(C.ibanValid("DE89370400440532013000"));
  assert.ok(C.tcknValid("10000000146"));
  assert.ok(!C.tcknValid("10000000147"));
  assert.ok(!C.tcknValid("01234567890"));
});

test("hassas alan adayları: e-posta, IBAN, kart, telefon, TCKN, anahtar, etiketli şifre", () => {
  const lines = [
    line("İletişim: ayse.yilmaz@ornek.com.tr"),
    line("IBAN: TR33 0006 1005 1978 6457 8413 26", 40),
    line("Kart 4111 1111 1111 1111 son", 70),
    line("Tel 0532 123 45 67", 100),
    line("TC 10000000146", 130),
    line("Anahtar sk-proj-AbCdEf0123456789XyZ", 160),
    line("Şifre: Gizli123!", 190),
    line("Sunucu 192.168.1.20 açık", 220),
    line("Toplam 4111 TL ve 2026 yılı", 250),
  ];
  const c = C.findCandidates(lines, 1000, 400);
  const kinds = c.map((x) => x.kind);
  for (const k of ["email", "iban", "card", "phone", "tckn", "secret", "labeled", "ip"]) assert.ok(kinds.includes(k), k + " bulunamadı: " + kinds.join(","));
  // Sıradan sayılar aday olmaz; satır 9'dan aday yok.
  assert.ok(!c.some((x) => x.rect.y >= 245));
  // Etiketli şifrede yalnız değer maskelenir (etiket "Şifre:" görünür kalır).
  const pw = c.find((x) => x.kind === "labeled");
  assert.ok(pw.rect.x >= 60, "etiket de maskelenmiş: " + JSON.stringify(pw.rect));
  // Aday metni saklanmaz; yalnız kısaltılmış ipucu.
  const em = c.find((x) => x.kind === "email");
  assert.ok(!em.hint.includes("yilmaz"));
  assert.ok(!JSON.stringify(c).includes("1978 6457"));
  // Kart numarası telefon olarak tekrar eklenmez.
  assert.equal(c.filter((x) => x.rect.y >= 60 && x.rect.y < 90).length, 1);
});

test("geçersiz kart/IBAN/TCKN aday değildir", () => {
  const c = C.findCandidates([line("Sipariş 4111 1111 1111 1112 TR33 0006 1005 1978 6457 8413 27 12345678901")], 1000, 100);
  assert.deepEqual(c.map((x) => x.kind), []);
});

test("maske doğrulaması: içerik kalırsa yakalanır; köşe kırpması hesaba katılır", () => {
  const W = 40, H = 30;
  const bmp = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { bmp[i * 4] = 200; bmp[i * 4 + 1] = 100; bmp[i * 4 + 2] = 50; bmp[i * 4 + 3] = 255; }
  const mask = { id: "m1", x: 5, y: 5, w: 10, h: 8, color: "#000000" };
  assert.equal(C.verifyMasks(bmp, W, H, [mask]).ok, false);
  for (let y = 5; y < 13; y++) for (let x = 5; x < 15; x++) { const i = (y * W + x) * 4; bmp[i] = bmp[i + 1] = bmp[i + 2] = 0; }
  const r = C.verifyMasks(bmp, W, H, [mask]);
  assert.ok(r.ok);
  assert.equal(r.pixels, 80);
  bmp[(8 * W + 9) * 4 + 1] = 3; // tek piksel sızıntısı
  const bad = C.verifyMasks(bmp, W, H, [mask]);
  assert.equal(bad.ok, false);
  assert.equal(bad.failed[0].bad, 1);
  assert.ok(C.verifyMasks(bmp, W, H, [mask], { tolerance: 4 }).ok);
});

test("çerçeve yerleşimi ve maskelerin çıktı koordinatı", () => {
  const L = C.frameLayout(800, 600, "window");
  assert.equal(L.ox, L.pad);
  assert.equal(L.oy, L.pad + 36);
  assert.equal(L.W, 800 + 2 * L.pad);
  const m = C.masksToOutput([{ id: "a", x: 100, y: 50, w: 40, h: 10, color: "#000000" }, { id: "b", x: 0, y: 0, w: 10, h: 10, color: "#000000" }], { x: 90, y: 40, w: 200, h: 100 }, L);
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].x, m[0].y], [10 + L.ox, 10 + L.oy]);
  assert.ok(C.insideRounded(L, L.wx + 20, L.wy + 20));
  assert.ok(!C.insideRounded(L, L.wx, L.wy + L.wh - 1));
  assert.deepEqual(C.frameLayout(10, 10, "none"), { W: 10, H: 10, ox: 0, oy: 0, pad: 0, bar: 0, r: 0, wx: 0, wy: 0, ww: 10, wh: 10 });
});

test("dosya adı: çakışmada numara, yasak karakter ayıklanır", () => {
  const t = new Date(2026, 10, 1, 13, 5, 9).getTime();
  assert.equal(C.outputName(t, "png"), "Ekran görüntüsü 2026-11-01 13.05.09.png");
  const taken = new Set(["Ekran görüntüsü 2026-11-01 13.05.09.jpg"]);
  assert.equal(C.outputName(t, "jpeg", (n) => taken.has(n)), "Ekran görüntüsü 2026-11-01 13.05.09 (2).jpg");
  assert.equal(C.outputName(t, "png", null, "..\\a/b:c*?"), ".. a b c.png");
});

test("ayarlar varsayılanlara döner; bilinmeyen değer kabul edilmez", () => {
  const s = C.normalizeSettings({ shortcut: "Alt+F4", format: "gif", frame: "x", maskColor: "red", jpegQuality: 5 });
  assert.equal(s.shortcut, C.SHORTCUTS[0]);
  assert.equal(s.format, "png");
  assert.equal(s.frame, "none");
  assert.equal(s.maskColor, "#000000");
  assert.equal(s.jpegQuality, 50);
  assert.equal(s.autoScan, true);
});

test("MyMind: rakamlı/maskeli kelimeler gönderilmez; yanıt yalnız gönderilen kelimelerle sınırlı", () => {
  const lines = [line("Müşteri Ayşe Yılmaz sipariş 4111 TR33 Yılmaz ayse@x.com")];
  const covered = (w) => w.text.includes("@");
  const words = C.aiWords(lines, covered);
  assert.deepEqual(words, ["Müşteri", "Ayşe", "Yılmaz", "sipariş"]);
  const p = C.aiPayload(words);
  assert.equal(p.sent.count, 4);
  assert.ok(!JSON.stringify(p.messages).includes("4111"));
  assert.ok(!JSON.stringify(p.messages).includes("@"));
  const picks = C.validateAi("```json\n{\"hassas\":[{\"kelime\":\"Ayşe\",\"neden\":\"kişi adı\"},{\"kelime\":\"yılmaz\",\"neden\":\"soyadı\"},{\"kelime\":\"Ahmet\",\"neden\":\"uydurma\"}],\"komut\":\"rm -rf\"}\n```", words);
  assert.deepEqual(picks.map((x) => x.word), ["Ayşe", "Yılmaz"]);
  const c = C.candidatesForWords(lines, picks, 2000, 100);
  assert.equal(c.length, 3); // Yılmaz iki kez geçer
  assert.throws(() => C.validateAi("tamam", words));
});

test("geçmiş istatistikleri: medyan hazırlık süresi, ≤30 sn oranı, kabul oranı", () => {
  const h = [10000, 20000, 40000].map((p, i) => C.normalizeHistory({ id: "h" + i, at: i, prepMs: p, masks: i, verified: true, accepted: 3, rejected: 1 }));
  const s = C.historyStats(h);
  assert.equal(s.count, 3);
  assert.equal(s.medianPrepS, 20);
  assert.equal(s.under30, 67);
  assert.equal(s.acceptRate, 75);
  assert.equal(s.withMasks, 2);
});

test("bölge seçimi fiziksel piksele çevrilir; çok küçük seçim reddedilir", () => {
  assert.deepEqual(C.cropRect({ x: 10, y: 10, width: 100, height: 50 }, { width: 1000, height: 500 }, { width: 2000, height: 1000 }), { x: 20, y: 20, width: 200, height: 100 });
  assert.equal(C.cropRect({ x: 0, y: 0, width: 1, height: 1 }, { width: 100, height: 100 }, { width: 100, height: 100 }), null);
});
