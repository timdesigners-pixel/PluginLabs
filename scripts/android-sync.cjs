#!/usr/bin/env node
// Hub kataloğunu ve tasarım sistemi dosyalarını Android uygulamasının assets klasörüne hazırlar.
// Üretilen dosyalar git'e eklenmez (android/.gitignore); CI ve yerel derleme bu betiği çalıştırır.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const web = path.join(root, "android/app/src/main/assets/web");
const vendor = path.join(web, "vendor");

const ANDROID_KINDS = new Set(["app", "engine", "model", "plugin", "library", "template", "asset"]);

function buildCatalog() {
  const { catalog } = require(path.join(root, "src/catalog.cjs"));
  const pkg = require(path.join(root, "package.json"));
  const apk = JSON.parse(fs.readFileSync(path.join(root, "android/catalog-android.json"), "utf8")).apk;
  const apkById = new Map(apk.map((a) => [a.id, a]));
  const features = require(path.join(root, "src/app-features.cjs"));

  const seen = new Set();
  const items = [];
  for (const it of catalog) {
    if (!ANDROID_KINDS.has(it.kind) || seen.has(it.id)) continue;
    seen.add(it.id);
    const a = apkById.get(it.id);
    items.push({
      id: it.id,
      name: it.name,
      kind: it.kind,
      version: it.version,
      description: it.description || "",
      platform: it.platform || "",
      format: it.format || "",
      size: it.size || 0,
      url: typeof it.url === "string" ? it.url : "",
      repo: it.repo || "",
      prerelease: !!it.prerelease,
      android: a ? androidEntry(a) : null,
      features: features.list(it.id) || null,
    });
  }
  for (const a of apk) {
    if (!seen.has(a.id)) throw new Error(`catalog-android.json: '${a.id}' Hub kataloğunda yok`);
  }
  return {
    schema: 1,
    hubDesktopVersion: pkg.version,
    previews: catalog.filter((i) => i.kind === "preview").length,
    items,
  };
}

function androidEntry(a) {
  const verified =
    a.status === "verified" &&
    /^https:\/\/github\.com\//.test(a.url) &&
    /^[0-9a-f]{64}$/.test(a.sha256) &&
    Number.isInteger(a.size) &&
    a.size > 0;
  return {
    status: verified ? "verified" : "pending",
    package: a.package || "",
    version: a.version || "",
    url: verified ? a.url : "",
    size: verified ? a.size : 0,
    sha256: verified ? a.sha256 : "",
    source: a.source || "",
    reason: a.reason || "",
  };
}

function copyVendor() {
  fs.mkdirSync(vendor, { recursive: true });
  for (const f of ["pl-tokens.css", "pl-components.css"]) {
    fs.copyFileSync(path.join(root, "ui/pl", f), path.join(vendor, f));
  }
  for (const f of ["inter-latin-wght-normal.woff2", "inter-latin-ext-wght-normal.woff2", "OFL.txt"]) {
    fs.copyFileSync(path.join(root, "ui/fonts", f), path.join(vendor, f));
  }
}

if (require.main === module) {
  const cat = buildCatalog();
  fs.mkdirSync(web, { recursive: true });
  fs.writeFileSync(path.join(web, "catalog.json"), JSON.stringify(cat, null, 2) + "\n");
  copyVendor();
  const apkReady = cat.items.filter((i) => i.android?.status === "verified").length;
  console.log(`android-sync: ${cat.items.length} katalog öğesi, ${apkReady} doğrulanmış APK`);
}

module.exports = { buildCatalog, androidEntry };
