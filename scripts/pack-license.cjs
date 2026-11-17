#!/usr/bin/env node
// Genişleme paketi lisans aracı (yayıncı tarafı).
//
//   node scripts/pack-license.cjs keygen <özel-anahtar-dosyası>
//       Ed25519 anahtar çifti üretir. Özel anahtar yalnız verilen dosyaya yazılır (depoya eklemeyin);
//       ekrana basılan açık anahtar registry/expansion-packs.json → publicKeys ve
//       uygulamanın engine/data/pack-keys.json dosyasına eklenir.
//
//   node scripts/pack-license.cjs sign <özel-anahtar-dosyası> <paket-kimliği> <lisans-no>
//       Ödeme sağlayıcısı satışı onayladıktan sonra müşteriye verilecek lisansı üretir.
"use strict";
const crypto = require("node:crypto");
const fs = require("node:fs");
const registry = require("../registry/expansion-packs.json");

const [cmd, file, pack, lic] = process.argv.slice(2);
const die = (m) => {
  console.error(m);
  process.exit(1);
};

if (cmd === "keygen") {
  if (!file) die("Kullanım: keygen <özel-anahtar-dosyası>");
  if (fs.existsSync(file)) die("Dosya zaten var; üzerine yazılmaz.");
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  fs.writeFileSync(file, privateKey.export({ format: "pem", type: "pkcs8" }), { mode: 0o600, flag: "wx" });
  console.log(publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64"));
} else if (cmd === "sign") {
  if (!file || !pack || !lic) die("Kullanım: sign <özel-anahtar-dosyası> <paket-kimliği> <lisans-no>");
  const p = registry.packs.find((x) => x.id === pack);
  if (!p) die(`Bilinmeyen paket: ${pack}`);
  if (!/^[A-Za-z0-9-]{1,64}$/.test(lic)) die("Lisans numarası harf, rakam ve tire içerebilir (en çok 64).");
  const key = crypto.createPrivateKey(fs.readFileSync(file));
  const body = Buffer.from(JSON.stringify({ pack: p.id, app: p.app, lic, iat: new Date().toISOString().slice(0, 10) })).toString("base64url");
  const signed = `UHPK1.${body}`;
  console.log(`${signed}.${crypto.sign(null, Buffer.from(signed), key).toString("base64url")}`);
} else {
  die("Komutlar: keygen | sign");
}
