"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { buildCatalog, androidEntry } = require("../scripts/android-sync.cjs");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("android katalog: Hub kataloğundan üretilir, önizlemeler hariç", () => {
  const cat = buildCatalog();
  assert.ok(cat.items.length > 10);
  assert.ok(cat.items.every((i) => i.kind !== "preview"));
  assert.strictEqual(new Set(cat.items.map((i) => i.id)).size, cat.items.length);
});

test("android katalog: doğrulanmamış APK kurulum bilgisi taşımaz", () => {
  const pending = androidEntry({ status: "verified", url: "https://example.com/a.apk", sha256: "x", size: 1 });
  assert.strictEqual(pending.status, "pending");
  assert.strictEqual(pending.url, "");
  const ok = androidEntry({ status: "verified", url: "https://github.com/o/r/releases/download/t/a.apk", sha256: "a".repeat(64), size: 10 });
  assert.strictEqual(ok.status, "verified");
});

test("android manifest: yalnız gerekli izinler, yedekleme kapalı, düz HTTP yok", () => {
  const m = read("android/app/src/main/AndroidManifest.xml");
  const perms = [...m.matchAll(/uses-permission android:name="([^"]+)"/g)].map((x) => x[1]).sort();
  assert.deepStrictEqual(perms, [
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.INTERNET",
    "android.permission.REQUEST_INSTALL_PACKAGES",
  ]);
  assert.match(m, /android:allowBackup="false"/);
  assert.match(read("android/app/src/main/res/xml/network_security_config.xml"), /cleartextTrafficPermitted="false"/);
});

test("android kurulum: SHA-256, boyut sınırı ve izinli sunucu denetimi var", () => {
  const j = read("android/app/src/main/java/com/pluginlabs/hub/ApkInstaller.java");
  assert.match(j, /MessageDigest\.getInstance\("SHA-256"\)/);
  assert.match(j, /setInstanceFollowRedirects\(false\)/);
  assert.match(j, /ALLOWED_HOSTS\.contains/);
  assert.match(j, /MAX_BYTES/);
});

test("android arayüz: açılış en az 4 sn, CSP ve marka", () => {
  const js = read("android/app/src/main/assets/web/app.js");
  assert.match(js, /const SPLASH_MS = 4000;/);
  const html = read("android/app/src/main/assets/web/index.html");
  assert.match(html, /Content-Security-Policy[^>]+script-src 'self'/);
  assert.match(html, /data-pl-product="hub"/);
  assert.match(html, /APPS/);
  assert.doesNotMatch(js, /api[_-]?key\s*[:=]\s*["'][^"']+/i);
});
