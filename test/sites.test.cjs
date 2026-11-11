const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { planla, SITES } = require("../scripts/sites-sync.cjs");

const KOK = path.join(__dirname, "..", "sites");

function ustDuzeyBol(secici) {
  const parcalar = [];
  let derinlik = 0, bas = 0;
  for (let i = 0; i < secici.length; i++) {
    if (secici[i] === "(") derinlik++;
    else if (secici[i] === ")") derinlik--;
    else if (secici[i] === "," && derinlik === 0) { parcalar.push(secici.slice(bas, i)); bas = i + 1; }
  }
  parcalar.push(secici.slice(bas));
  return parcalar;
}

test("site varlıkları ortak kaynakla eşit", () => {
  for (const [dosya, icerik] of planla()) {
    assert.ok(fs.existsSync(dosya), `${dosya} eksik; node scripts/sites-sync.cjs çalıştırın`);
    assert.ok(fs.readFileSync(dosya).equals(icerik), `${dosya} güncel değil`);
  }
});

test("site katmanı yalnız token kullanır ve global seçici yazmaz", () => {
  const css = fs.readFileSync(path.join(KOK, "_ortak", "site.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(css), false, "site.css içinde sabit hex renk var");
  assert.ok(css.includes("@layer pl"), "@layer pl yok");
  const seciciler = css.split("{").map((p) => p.split("}").pop().trim()).filter((s) => s && !s.startsWith("@"));
  for (const s of seciciler) {
    for (const parca of ustDuzeyBol(s)) {
      const ilk = parca.trim();
      if (!ilk || /^(from|to|\d)/.test(ilk) || /^(src|font-|unicode-range)/.test(ilk)) continue;
      assert.match(ilk, /^(\.pl-|:where\(\.pl-site\))/, `Kapsam dışı seçici: ${ilk}`);
    }
  }
});

test("her site tasarım sistemi kapsayıcısı, sıra ve komut paletiyle gelir", () => {
  for (const site of SITES) {
    const html = fs.readFileSync(path.join(KOK, site, "index.html"), "utf8");
    assert.match(html, /<body class="pl-site" data-pl data-pl-theme="dark"[^>]*lang="tr">/, site);
    const sira = ["pl-tokens.css", "pl-components.css", "pl-advanced.css", "site.css"].map((f) => html.indexOf(`assets/${f}`));
    assert.ok(sira.every((v, i) => v > 0 && (i === 0 || v > sira[i - 1])), `${site}: CSS sırası yanlış`);
    assert.ok(html.includes('id="pl-cmdk"') && html.includes("data-pl-open-cmdk"), `${site}: komut paleti yok`);
    for (const m of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${m[1]}"`), `${site}: #${m[1]} hedefi yok`);
    }
  }
});

test("ürün verisi kayıttaki tüm ürünleri içerir", () => {
  const veri = fs.readFileSync(path.join(KOK, "getpluginlabs.com", "assets", "veri.js"), "utf8");
  const json = JSON.parse(veri.slice(veri.indexOf("{"), veri.lastIndexOf("}") + 1));
  const kayit = require("../registry/projects.json");
  assert.equal(json.urunler.length, kayit.projects.length);
  assert.ok(json.urunler.every((u) => u.ad && u.harf && (u.urun || u.renk)));
});
