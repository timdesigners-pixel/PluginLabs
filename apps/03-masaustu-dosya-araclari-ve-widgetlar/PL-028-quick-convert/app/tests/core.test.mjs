import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import zlib from "node:zlib";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");
const enc = (s) => new Uint8Array(Buffer.from(s, "latin1"));

// Küçük, gerçek PNG üretici (testler için).
function png(w, h, rgba) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rgba(x, y).forEach((v, i) => (raw[y * (w * 4 + 1) + 1 + x * 4 + i] = v));
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}

test("tür tanıma içerikten yapılır; yürütülebilir ve betikler reddedilir", () => {
  const p = png(3, 2, () => [1, 2, 3, 255]);
  assert.deepEqual([C.sniff(p, "a.png").kind, C.sniff(p, "a.png").type], ["image", "png"]);
  assert.equal(C.sniff(p, "foto.jpg").type, "png");
  assert.match(C.extWarning("foto.jpg", C.sniff(p, "foto.jpg")), /Uzantı \.jpg ama içerik PNG/);
  assert.equal(C.sniff(enc("\xff\xd8\xff\xe0abc"), "x").type, "jpeg");
  assert.equal(C.sniff(enc("GIF89a\x02\x00\x03\x00"), "x").type, "gif");
  assert.equal(C.sniff(enc("RIFF\x00\x00\x00\x00WEBPVP8 "), "x").type, "webp");
  assert.equal(C.sniff(enc("MZ\x90\x00\x03"), "kurulum.png").kind, "blocked");
  assert.equal(C.sniff(enc("\x7fELF\x02\x01"), "a").kind, "blocked");
  assert.equal(C.sniff(enc("#!/bin/sh\nrm -rf /\n"), "betik").kind, "blocked");
  assert.equal(C.sniff(enc("#!/bin/sh\necho\n"), "notlar.txt").kind, "text");
  assert.match(C.sniff(enc("PK\x03\x04..."), "a.docx").reason, /Office/);
  assert.match(C.sniff(enc("%PDF-1.7"), "a.pdf").reason, /PDF/);
  assert.match(C.sniff(enc('<?xml version="1.0"?><svg xmlns="x"></svg>'), "a.svg").reason, /SVG/);
  assert.equal(C.sniff(enc("Merhaba dünya\r\n"), "a.txt").kind, "text");
  assert.equal(C.sniff(new Uint8Array([0xff, 0xfe, 0x48, 0x00]), "a.txt").kind, "text");
  assert.equal(C.sniff(new Uint8Array(0), "a.txt").kind, "unknown");
  assert.equal(C.sniff(new Uint8Array([1, 2, 0, 0, 5, 0, 7, 8, 9]), "veri.bin").kind, "unknown");
});

test("görüntü başlığından ölçü ve sınırlar", () => {
  const p = png(640, 480, () => [0, 0, 0, 255]);
  assert.deepEqual(C.imageSize(p, "png"), { width: 640, height: 480 });
  assert.deepEqual(C.imageSize(enc("GIF89a\x20\x03\x58\x02"), "gif"), { width: 800, height: 600 });
  const jpg = enc("\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xc0\x00\x11\x08\x01\xe0\x02\x80\x03");
  assert.deepEqual(C.imageSize(jpg, "jpeg"), { width: 640, height: 480 });
  assert.equal(C.checkImageLimits({ width: 20000, height: 10 }, 100), "Görüntü kenarı 16384 pikseli aşıyor.");
  assert.match(C.checkImageLimits({ width: 12000, height: 12000 }, 100), /100 megapiksel/);
  assert.match(C.checkImageLimits(null, 100), /bozuk/);
  assert.match(C.checkImageLimits({ width: 10, height: 10 }, 60 * C.MB), /sınırını aşıyor/);
  assert.equal(C.checkImageLimits({ width: 10, height: 10 }, 100), "");
  assert.equal(C.verifyOutput(p, "png"), true);
  assert.equal(C.verifyOutput(p, "webp"), false);
});

test("boyut planı oranı korur ve asla büyütmez", () => {
  const o = C.normalizeImageOptions({ resize: "fit", width: 1600, height: 1600 });
  assert.deepEqual(C.planResize({ width: 4000, height: 3000 }, o), { width: 1600, height: 1200, scaled: true });
  assert.deepEqual(C.planResize({ width: 800, height: 600 }, o), { width: 800, height: 600, scaled: false });
  assert.deepEqual(C.planResize({ width: 1001, height: 3 }, C.normalizeImageOptions({ resize: "percent", percent: 10 })), { width: 100, height: 1, scaled: true });
  assert.deepEqual(C.planResize({ width: 10, height: 10 }, C.normalizeImageOptions({ resize: "percent", percent: 500 })), { width: 10, height: 10, scaled: false });
  const n = C.normalizeImageOptions({ format: "gif", quality: 300, width: -5, background: "red" });
  assert.equal(n.format, "webp"); assert.equal(n.quality, 100); assert.equal(n.width, 1); assert.equal(n.background, "#ffffff");
  assert.equal(C.targetFormat({ format: "same" }, "gif"), "png");
  assert.equal(C.targetFormat({ format: "same" }, "jpeg"), "jpeg");
  assert.equal(C.describeImage(C.normalizeImageOptions({ format: "jpeg", quality: 80, resize: "fit", width: 1600, height: 1600 })), "JPEG · kalite %80 · en fazla 1600×1600 px");
});

test("çıktı adı kaynağı ezmez, Windows'ta geçersiz adları düzeltir", () => {
  const taken = new Set(["tatil-donusturuldu.webp", "tatil-donusturuldu-2.webp"]);
  assert.equal(C.outputName("C:\\Foto\\tatil.JPG", "webp", (n) => taken.has(n)), "tatil-donusturuldu-3.webp");
  assert.equal(C.outputName("rapor.txt", "txt"), "rapor-donusturuldu.txt");
  assert.equal(C.outputName("con.png", "png"), "dosya-donusturuldu.png");
  assert.equal(C.outputName('a<b>:c?.png', "png"), "a_b__c_-donusturuldu.png");
  assert.equal(C.textExt("altyazi.SRT"), "srt");
  assert.equal(C.textExt("veri.dat"), "txt");
});

test("Windows-1254 tablosu WHATWG/ICU çözücüsüyle birebir aynı", () => {
  const all = Uint8Array.from({ length: 256 }, (_, i) => i);
  const ref = new TextDecoder("windows-1254").decode(all);
  assert.equal(C.decodeText(all, "windows-1254"), ref);
  assert.equal(C.decodeText(enc("\xdd\xfe\xf0\xfd\xd0\xde"), "windows-1254"), "İşğıĞŞ");
});

test("kodlama algılama: BOM, UTF-16, UTF-8, Windows-1254", () => {
  assert.equal(C.detectEncoding(enc("\xef\xbb\xbfa")).encoding, "utf-8-bom");
  assert.equal(C.detectEncoding(new Uint8Array([0xff, 0xfe, 0x41, 0])).encoding, "utf-16le");
  assert.equal(C.detectEncoding(Buffer.from("Merhaba dünya, şöyle böyle", "utf16le")).encoding, "utf-16le");
  assert.equal(C.detectEncoding(Buffer.from("Çağrı İşık")).encoding, "utf-8");
  assert.equal(C.detectEncoding(Buffer.from("abc")).asciiOnly, true);
  assert.equal(C.detectEncoding(C.encodeText("Çağrı İşık", "windows-1254").bytes).encoding, "windows-1254");
  // Fazla uzun UTF-8 dizisi ve vekil kod noktası geçersizdir.
  assert.equal(C.detectEncoding(enc("\xc0\xaf")).encoding, "windows-1254");
  assert.equal(C.detectEncoding(enc("\xed\xa0\x80")).encoding, "windows-1254");
  assert.equal(C.detectEncoding(enc("ab\xc3")).encoding, "windows-1254");
});

test("metin dönüştürme kayıpsızdır ve geri çözülerek doğrulanır", () => {
  const s = "Ağaç, ılık, ŞİŞE, Ğğ — “tırnak” €\r\nİkinci satır\r\n";
  const src = C.encodeText(s, "windows-1254").bytes;
  const r = C.convertTextBytes(src, { from: "auto", to: "utf-8" });
  assert.equal(r.from, "windows-1254");
  assert.equal(Buffer.from(r.bytes).toString("utf8"), s);
  assert.equal(r.eolFrom, "crlf"); assert.equal(r.lines, 3); assert.equal(r.lost, 0); assert.equal(r.verified, true);
  // UTF-8 BOM (Excel) + LF
  const r2 = C.convertTextBytes(r.bytes, { to: "utf-8-bom", eol: "lf" });
  assert.deepEqual([...r2.bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(Buffer.from(r2.bytes.slice(3)).toString("utf8"), s.replace(/\r\n/g, "\n"));
  // UTF-16 LE gidiş-dönüş, emoji (vekil çifti) dahil
  const e = "Merhaba 😀 dünya\n";
  const r3 = C.convertTextBytes(Buffer.from(e), { to: "utf-16le" });
  assert.equal(new TextDecoder("utf-16le").decode(r3.bytes.slice(2)), e);
  assert.equal(C.convertTextBytes(r3.bytes, { to: "utf-8" }).bytes.length, Buffer.byteLength(e));
  // Aynı kodlamaya dönüştürme: baytlar aynı
  assert.equal(C.convertTextBytes(Buffer.from("abc\n"), { to: "utf-8" }).identical, true);
});

test("Windows-1254'e sığmayan karakterler varsayılan olarak durdurur; izinle ? yazılır", () => {
  const src = Buffer.from("Fiyat: 5 ₺ ve 😀 ve 😀");
  assert.throws(() => C.convertTextBytes(src, { to: "windows-1254" }), /“₺” ×1, “😀” ×2/);
  const r = C.convertTextBytes(src, { to: "windows-1254", unmappable: "replace" });
  assert.equal(Buffer.from(r.bytes).toString("latin1"), "Fiyat: 5 ? ve ? ve ?");
  assert.equal(r.lost, 3); assert.equal(r.verified, false);
  assert.throws(() => C.convertTextBytes(enc("ab\xc3"), { from: "utf-8", to: "utf-16le" }), /geçerli UTF-8 değil/);
  assert.throws(() => C.convertTextBytes(new Uint8Array([0xff, 0xfe, 0x41]), { to: "utf-8" }), /tek/);
});

test("satır sonları", () => {
  assert.equal(C.eolOf("a\r\nb\nc").kind, "mixed");
  assert.equal(C.eolOf("a\nb\n").kind, "lf");
  assert.equal(C.eolOf("tek").kind, "none");
  assert.equal(C.convertEol("a\r\nb\nc\rd", "crlf"), "a\r\nb\r\nc\r\nd");
  assert.equal(C.convertEol("a\r\nb\rc", "lf"), "a\nb\nc");
});

test("kurala dayalı öneri: ihtiyaç cümlesinden ayar ve gerekçe", () => {
  let s = C.suggest("Bu fotoğrafları e-posta ile göndermek için küçült", { kind: "image" });
  assert.deepEqual(s.image, { format: "jpeg", resize: "fit", width: 1600, height: 1600, quality: 80 });
  assert.equal(s.text, null);
  s = C.suggest("1080 px webp olsun, en fazla 300 KB", { kind: "image" });
  assert.equal(s.image.format, "webp"); assert.equal(s.image.width, 1080); assert.equal(s.image.maxKB, 300);
  s = C.suggest("logoyu %50 küçült, şeffaf kalsın", { kind: "image" });
  assert.equal(s.image.format, "png"); assert.equal(s.image.resize, "percent"); assert.equal(s.image.percent, 50);
  s = C.suggest("1920x1080 jpg kalite 70", { kind: "image" });
  assert.deepEqual([s.image.format, s.image.width, s.image.height, s.image.quality], ["jpeg", 1920, 1080, 70]);
  s = C.suggest("Excel'de Türkçe karakterler bozuk çıkıyor", { kind: "text" });
  assert.deepEqual(s.text, { to: "utf-8-bom" }); assert.equal(s.image, null);
  s = C.suggest("eski muhasebe programı ANSI istiyor, Windows satır sonu", { kind: "text" });
  assert.deepEqual(s.text, { to: "windows-1254", eol: "crlf" });
  s = C.suggest("bir şey yap", { kind: "image" });
  assert.equal(s.matched, false);
});

test("MyMind: yalnız ihtiyaç + tür/ölçü gönderilir; yanıt izinli alanlarla doğrulanır", () => {
  const p = C.aiPayload("instagram için hazırla", { kind: "image", type: "jpeg", width: 4032, height: 3024, bytes: 3_500_000, name: "C:\\Gizli\\aile-tatili.jpg" });
  const all = JSON.stringify(p.messages);
  assert.doesNotMatch(all, /aile-tatili|Gizli/);
  assert.match(all, /4032×3024 px/);
  assert.equal(p.sent.type, "JPEG");
  const v = C.validateAi('Öneri:\n```json\n{"bicim":"JPG","kalite":92,"boyutlandir":"sığdır","genislik":1080,"yukseklik":1350,"kodlama":"utf-8","komut":"del *","gerekce":"Instagram dikey gönderi"}\n```', "image");
  assert.deepEqual(v.image, { format: "jpeg", quality: 92, resize: "fit", width: 1080, height: 1350 });
  assert.equal(v.text, null);
  assert.deepEqual(v.rejected.sort(), ["kodlama", "komut"]);
  assert.equal(v.reason, "Instagram dikey gönderi");
  const t = C.validateAi('{"kodlama":"WINDOWS-1254","satir_sonu":"crlf","kalite":5000}', "text");
  assert.deepEqual(t.text, { to: "windows-1254", eol: "crlf" });
  const bad = C.validateAi('{"kalite":5000,"bicim":"exe"}', "image");
  assert.equal(bad.empty, true);
  assert.throws(() => C.validateAi("bilmiyorum", "image"), /JSON yok/);
});

test("ayarlar ve geçmiş normalleştirme", () => {
  const s = C.normalizeSettings({ output: "folder", outputDir: "", image: { format: "png" }, text: { to: "x" } });
  assert.equal(s.output, "beside"); assert.equal(s.image.format, "png"); assert.equal(s.text.to, "utf-8"); assert.equal(s.dropAutorun, true);
  assert.equal(C.normalizeHistory({ out: "" }), null);
  const h = C.normalizeHistory({ id: "a", at: 5, kind: "image", out: "/x/y.webp", srcBytes: 1000, outBytes: 400 });
  assert.deepEqual(C.historyStats([h]), { total: 1, images: 1, texts: 0, savedBytes: 600 });
  assert.equal(C.fmtBytes(1536), "1,5 KB");
  assert.equal(C.pct(1000, 400), -60);
  assert.equal(C.pctLabel(1000, 400), "−%60"); assert.equal(C.pctLabel(100, 112), "+%12");
  assert.equal(C.psnr(new Uint8ClampedArray([1, 2, 3, 255]), new Uint8ClampedArray([1, 2, 3, 0])), Infinity);
  assert.match(C.qualityLabel(41.234), /41,2 dB · çok iyi/);
});
