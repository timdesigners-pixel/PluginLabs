import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const I = require("../desktop/indexer.js");
const C = require("../src/core.js");

test("tarayıcı: metin okur, ikiliyi işaretler, hariç/gizli/bağlantıyı atlar, dosyalara yazmaz; artımlı", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fp-ix-"));
  const w = (rel, data) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); return f; };
  w("Belgeler/kira.txt", "Kira sözleşmesi depozito 3 ay");
  w("Belgeler/alt/notlar.md", "# Not\nkombi servisi");
  w("Belgeler/şifreli.txt", Buffer.from([0x00, 0x01, 0x02, 0x03]));
  w("Belgeler/büyük.log", "x".repeat(3 * 1024 * 1024));
  w("Belgeler/foto.jpg", Buffer.from([0xff, 0xd8, 0xff]));
  w("node_modules/paket/index.js", "gizli");
  w(".gizli/a.txt", "gizli");
  w("Belgeler/~$taslak.txt", "geçici");
  const before = new Map(fs.readdirSync(root, { recursive: true }).map((f) => [f, fs.statSync(path.join(root, f)).mtimeMs]));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "fp-dis-"));
  fs.writeFileSync(path.join(outside, "dışarıda.txt"), "klasör dışı");
  try { fs.symlinkSync(outside, path.join(root, "bağlantı"), "junction"); } catch { /* izin olmayabilir */ }
  const r = await I.scan([root], C.settingsOf(null), new Map(), null, null);
  const by = Object.fromEntries(r.docs.map((d) => [d.name, d]));
  assert.deepEqual(Object.keys(by).sort(), ["büyük.log", "foto.jpg", "kira.txt", "notlar.md", "şifreli.txt"]);
  assert.equal(by["kira.txt"].status, "metin");
  assert.equal(by["şifreli.txt"].status, "okunamadi");
  assert.equal(by["büyük.log"].status, "buyuk");
  assert.equal(by["foto.jpg"].status, "ad");
  assert.equal(by["notlar.md"].rel, path.join("Belgeler", "alt", "notlar.md"));
  for (const [f, m] of before) assert.equal(fs.statSync(path.join(root, f)).mtimeMs, m, "dosya değişmemeli: " + f);
  // Artımlı: değişmeyen dosya yeniden okunmaz, etiket korunur
  by["kira.txt"].tags = ["ev"];
  const prev = new Map(r.docs.map((d) => [d.path, d]));
  w("Belgeler/alt/notlar.md", "# Not\nkombi servisi ve fatura");
  fs.utimesSync(path.join(root, "Belgeler/alt/notlar.md"), new Date(), new Date(Date.now() + 5000));
  const r2 = await I.scan([root], C.settingsOf(null), prev, null, null);
  assert.equal(r2.stats.reused, 2); // kira.txt + değişmeyen okunamayan dosya
  assert.equal(r2.stats.read, 1);
  const k2 = r2.docs.find((d) => d.name === "kira.txt");
  assert.deepEqual(k2.tags, ["ev"]);
  assert.match(r2.docs.find((d) => d.name === "notlar.md").text, /fatura/);
  // Durdurma
  const r3 = await I.scan([root], C.settingsOf(null), new Map(), null, () => true);
  assert.equal(r3.stats.stopped, true);
  fs.rmSync(path.join(root, "bağlantı"), { force: true, recursive: false });
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(outside, { recursive: true, force: true });
});
