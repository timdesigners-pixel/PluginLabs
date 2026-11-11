#!/usr/bin/env node
// PluginLabs web siteleri: ortak varlıkları her siteye kopyalar ve veri.js üretir.
// Kullanım: node scripts/sites-sync.cjs          → yazar
//           node scripts/sites-sync.cjs --check  → yalnız denetler (fark varsa çıkış kodu 1)
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SITES_DIR = path.join(ROOT, "sites");
const SITES = ["getpluginlabs.com", "pluginlabs.tech", "pluginlabs.dev"];
const DS = path.join(ROOT, "design-system", "pluginlabs-advanced", "assets");
const SHARED = path.join(SITES_DIR, "_ortak");

const AKSAN = {
  "flow-dock": "flowdock",
  "leo-helper": "leo",
  "mind-palace-plugin-hub": "mindpalace",
  "the-ultimate-scrapper": "scrapper",
  "extension-manager": "extman",
  tweakster: "tweakster",
  "mutfak-atolyesi": "mutfak",
  mywishlist: "wishlist",
  "mymind-ai": "mymind",
};
const PLATFORM_ADI = { windows: "Windows", linux: "Linux", macos: "macOS", chrome: "Chrome", web: "Web" };

function kisaAd(baslik) {
  return String(baslik)
    .replace(/^\d+\s*·\s*/, "")
    .replace(/\s+—\s+PL-.*$/, "")
    .trim();
}
function basHarfler(ad) {
  const kelimeler = String(ad).replace(/[!/&]/g, " ").split(/\s+/).filter(Boolean);
  const harfler = kelimeler.length > 1 ? kelimeler[0][0] + kelimeler[1][0] : kelimeler[0].slice(0, 2);
  return harfler.toLocaleUpperCase("tr-TR");
}

function veriUret() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "registry", "projects.json"), "utf8"));
  const { catalog } = require(path.join(ROOT, "src", "catalog.cjs"));
  const uygulamalar = catalog.filter((x) => x.kind === "app");
  const onizlemeler = new Set(catalog.filter((x) => x.kind === "preview").map((x) => x.id));
  const kategoriler = registry.categories.map((k) => ({ id: k.id, ad: kisaAd(k.title) }));

  const urunler = registry.projects.map((p) => {
    const hub = uygulamalar.find(
      (a) => a.id === p.slug || (a.repo && p.repo && p.repo.name && a.repo.endsWith("/" + p.repo.name)),
    );
    const durumSurum = /v(\d+\.\d+\.\d+)/.exec(p.status || "");
    const onizlemeId = "pl-" + String(p.number).padStart(3, "0");
    return {
      no: p.number,
      id: p.id,
      slug: p.slug,
      ad: p.name,
      ozet: p.summary,
      kategori: p.category.id,
      platformlar: Object.keys(PLATFORM_ADI).filter((k) => p.platforms && p.platforms[k]),
      surum: hub ? hub.version : durumSurum ? durumSurum[1] : null,
      hub: hub ? "uygulama" : onizlemeler.has(onizlemeId) ? "onizleme" : null,
      urun: AKSAN[p.slug] || null,
      renk: AKSAN[p.slug] ? null : ((p.number - 1) % 8) + 1,
      harf: basHarfler(p.name),
    };
  });

  const say = (k) => urunler.filter((u) => u.platformlar.includes(k)).length;
  const istatistik = {
    urun: urunler.length,
    kategori: kategoriler.length,
    hubUygulama: urunler.filter((u) => u.hub === "uygulama").length,
    hubKurulabilir: urunler.filter((u) => u.hub).length,
    windows: say("windows"),
    linux: say("linux"),
    macos: say("macos"),
    chrome: say("chrome"),
    web: say("web"),
    katalogKaydi: catalog.length,
  };
  const veri = { kaynak: "registry/projects.json + src/catalog.cjs", tarih: registry.generatedAt, platformAdi: PLATFORM_ADI, istatistik, kategoriler, urunler };
  return "/* Üretilen dosya: node scripts/sites-sync.cjs */\nwindow.PL_VERI = " + JSON.stringify(veri, null, 1) + ";\n";
}

function planla() {
  const veri = veriUret();
  const dosyalar = [];
  for (const site of SITES) {
    const hedef = path.join(SITES_DIR, site, "assets");
    for (const f of ["pl-tokens.css", "pl-components.css", "pl-advanced.css"]) {
      dosyalar.push([path.join(hedef, f), fs.readFileSync(path.join(DS, f))]);
    }
    for (const f of ["site.css", "site.js", "favicon.svg"]) {
      dosyalar.push([path.join(hedef, f), fs.readFileSync(path.join(SHARED, f))]);
    }
    for (const f of fs.readdirSync(path.join(SHARED, "fonts"))) {
      dosyalar.push([path.join(hedef, "fonts", f), fs.readFileSync(path.join(SHARED, "fonts", f))]);
    }
    dosyalar.push([path.join(hedef, "veri.js"), Buffer.from(veri)]);
  }
  return dosyalar;
}

function main() {
  const denetle = process.argv.includes("--check");
  const farklar = [];
  for (const [dosya, icerik] of planla()) {
    const mevcut = fs.existsSync(dosya) ? fs.readFileSync(dosya) : null;
    if (mevcut && mevcut.equals(icerik)) continue;
    farklar.push(path.relative(ROOT, dosya));
    if (!denetle) {
      fs.mkdirSync(path.dirname(dosya), { recursive: true });
      fs.writeFileSync(dosya, icerik);
    }
  }
  if (denetle && farklar.length) {
    console.error("Siteler güncel değil; `node scripts/sites-sync.cjs` çalıştırın:\n  " + farklar.join("\n  "));
    process.exitCode = 1;
  } else {
    console.log(denetle ? "Siteler güncel." : `${farklar.length} dosya yazıldı.`);
  }
}

if (require.main === module) main();
module.exports = { planla, veriUret, SITES };
