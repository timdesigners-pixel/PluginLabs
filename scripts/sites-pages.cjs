#!/usr/bin/env node
// Üç siteyi tek GitHub Pages yayınında birleştirir:
//   /       → getpluginlabs.com
//   /tech/  → pluginlabs.tech
//   /dev/   → pluginlabs.dev
// Alan adlarına giden mutlak bağlantılar göreli yollara çevrilir.
// Kullanım: node scripts/sites-pages.cjs [hedef-klasör]  (varsayılan: _site)
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HEDEF = path.resolve(ROOT, process.argv[2] || "_site");
const YERLESIM = [
  { site: "getpluginlabs.com", yol: "" },
  { site: "pluginlabs.tech", yol: "tech/" },
  { site: "pluginlabs.dev", yol: "dev/" },
];

function goreli(kaynakYol, hedefYol) {
  const derinlik = kaynakYol.split("/").filter(Boolean).length;
  return "../".repeat(derinlik) + hedefYol || "./";
}

function donustur(html, kaynakYol) {
  let cikti = html;
  for (const { site, yol } of YERLESIM) {
    const r = goreli(kaynakYol, yol);
    cikti = cikti.split(`https://${site}/#`).join(`${r === "./" ? "" : r}#`);
    cikti = cikti.split(`https://${site}/`).join(r);
  }
  // Kanonik ve og:url yalnız gerçek alan adı bağlandığında anlamlıdır.
  cikti = cikti.replace(/\s*<link rel="canonical"[^>]*>/, "").replace(/\s*<meta property="og:url"[^>]*>/, "");
  return cikti.split('href="/"').join('href="./"');
}

function kopyala(kaynak, hedef) {
  fs.mkdirSync(hedef, { recursive: true });
  for (const ad of fs.readdirSync(kaynak, { withFileTypes: true })) {
    const k = path.join(kaynak, ad.name);
    const h = path.join(hedef, ad.name);
    if (ad.isDirectory()) kopyala(k, h);
    else fs.copyFileSync(k, h);
  }
}

function main() {
  fs.rmSync(HEDEF, { recursive: true, force: true });
  for (const { site, yol } of YERLESIM) {
    const kaynak = path.join(ROOT, "sites", site);
    const hedef = path.join(HEDEF, yol);
    kopyala(kaynak, hedef);
    const dosya = path.join(hedef, "index.html");
    fs.writeFileSync(dosya, donustur(fs.readFileSync(dosya, "utf8"), yol));
  }
  fs.writeFileSync(path.join(HEDEF, ".nojekyll"), "");
  console.log(`GitHub Pages çıktısı hazır: ${path.relative(ROOT, HEDEF)}/`);
}

if (require.main === module) main();
module.exports = { donustur, YERLESIM };
