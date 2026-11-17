// Uygulama genişleme paketleri: imzalı lisansları doğrular, saklar ve uygulamalara verir.
"use strict";
const crypto = require("node:crypto");
const registry = require("../registry/expansion-packs.json");

// Ed25519 açık anahtarının SPKI (DER) ön eki
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const TOKEN = /^UHPK1\.([A-Za-z0-9_-]{8,1500})\.([A-Za-z0-9_-]{80,90})$/;

function keyObjects(extra = []) {
  return [...registry.publicKeys, ...extra]
    .map((k) => Buffer.from(String(k), "base64"))
    .filter((raw) => raw.length === 32)
    .map((raw) => crypto.createPublicKey({ key: Buffer.concat([SPKI_PREFIX, raw]), format: "der", type: "spki" }));
}

/** Lisansı doğrular; geçerliyse yükü döndürür, değilse hata fırlatır. */
function verify(token, extraKeys = []) {
  const m = TOKEN.exec(String(token || "").trim());
  if (!m) throw Object.assign(new Error("Lisans biçimi geçersiz"), { status: 400 });
  const signed = Buffer.from(`UHPK1.${m[1]}`);
  const sig = Buffer.from(m[2], "base64url");
  const ok = sig.length === 64 && keyObjects(extraKeys).some((k) => crypto.verify(null, signed, k, sig));
  if (!ok) throw Object.assign(new Error("Lisans imzası doğrulanamadı"), { status: 400 });
  let payload;
  try {
    payload = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
  } catch {
    throw Object.assign(new Error("Lisans içeriği okunamadı"), { status: 400 });
  }
  const pack = registry.packs.find((p) => p.id === payload.pack && p.app === payload.app);
  if (!pack) throw Object.assign(new Error("Bu lisans tanınan bir pakete ait değil"), { status: 400 });
  return { pack: pack.id, app: pack.app, lic: String(payload.lic || "").slice(0, 64), iat: String(payload.iat || "").slice(0, 10) };
}

/** Hub görünümü: paketler, fiyat, satın alma durumu ve sahiplik. */
function list(licenses = []) {
  return registry.packs.map((p) => {
    const own = licenses.find((l) => l.pack === p.id);
    return {
      id: p.id,
      app: p.app,
      appName: p.appName,
      name: p.name,
      description: p.description,
      features: p.features,
      price: p.price,
      purchasable: /^https:\/\//.test(p.checkoutUrl || "") && registry.publicKeys.length > 0,
      owned: !!own,
      license: own ? { lic: own.lic, iat: own.iat, addedAt: own.addedAt } : null,
    };
  });
}

function checkoutUrl(id) {
  const p = registry.packs.find((x) => x.id === id);
  if (!p) throw Object.assign(new Error("Paket bulunamadı"), { status: 404 });
  if (!/^https:\/\//.test(p.checkoutUrl || "")) throw Object.assign(new Error("Bu paketin satın alma bağlantısı henüz tanımlı değil"), { status: 409 });
  return p.checkoutUrl;
}

module.exports = { registry, verify, list, checkoutUrl };
