const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
const ui = path.join(__dirname, "../ui");
const styles = fs.readFileSync(path.join(ui, "styles.css"), "utf8");
const themes = fs.readFileSync(path.join(ui, "themes.css"), "utf8");
const tokens = fs.readFileSync(path.join(ui, "design-tokens.css"), "utf8");
const html = fs.readFileSync(path.join(ui, "index.html"), "utf8");

const lum = (hex) => {
  const c = hex.replace("#", "").slice(0, 6).match(/../g).map((v) => parseInt(v, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const block = (src, selector) => {
  const i = src.indexOf(selector + " {");
  assert.ok(i >= 0, selector);
  return src.slice(i, src.indexOf("}", i));
};
const vars = (b) => Object.fromEntries([...b.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const resolve = (all, name, seen = new Set()) => {
  assert.ok(!seen.has(name) && name in all, `tanımsız veya döngüsel: ${name}`);
  const v = all[name];
  const m = v.match(/^var\(--([\w-]+)\)$/);
  return m ? resolve(all, m[1], new Set([...seen, name])) : v;
};

test("her sabit renk değişkene bağlı ve :root'ta tanımlı", () => {
  const defined = new Set(Object.keys(vars(block(styles, ":root"))));
  const used = [...styles.matchAll(/var\(--(c-[\w]+)\)/g)].map((m) => m[1]);
  assert.ok(used.length > 90);
  assert.deepEqual([...new Set(used)].filter((v) => !defined.has(v)), []);
  const afterRoot = styles.slice(styles.indexOf("}", styles.indexOf(":root {")));
  assert.equal(/\s#[0-9a-fA-F]{3,8}\b/.test(afterRoot.replace(/\.choice-swatch[^}]*}/g, "")), false);
});

test("themes.css üreticiyle birebir aynı", () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plh-themes-")), "themes.css");
  execFileSync(process.execPath, [path.join(__dirname, "../scripts/generate-themes.cjs")], { env: { ...process.env, THEMES_OUT: out } });
  // Windows'ta git CRLF ile çıkarabilir; satır sonlarını normalize ederek karşılaştır.
  const lf = (t) => t.replace(/\r\n/g, "\n");
  assert.equal(lf(fs.readFileSync(out, "utf8")), lf(themes));
});

test("dört paletli tema kontrastı: metin, ikincil metin ve vurgu ≥ 4.5:1", () => {
  const base = { ...vars(block(tokens, ":root")), ...vars(block(styles, ":root")) };
  const sets = {
    "hub-yesil/dark": base,
    "iris/dark": { ...base, ...vars(block(themes, 'html[data-palette="iris"][data-mode="dark"]')) },
    "hub-yesil/light": { ...base, ...vars(block(themes, 'html[data-palette="hub-yesil"][data-mode="light"]')) },
    "iris/light": { ...base, ...vars(block(themes, 'html[data-palette="iris"][data-mode="light"]')) },
  };
  for (const [name, v] of Object.entries(sets))
    for (const bg of ["bg", "surface", "surface2"])
      for (const fg of ["text", "muted", "accent"]) {
        const r = ratio(resolve(v, fg), resolve(v, bg));
        assert.ok(r >= 4.5, `${name} ${fg} / ${bg} = ${r.toFixed(2)}`);
      }
});

test("design-tokens.css içindeki her renk tokenı üç temada da geçersiz kılınır", () => {
  const colorTokens = Object.entries(vars(block(tokens, ":root"))).filter(([, v]) => /#[0-9a-f]{3,8}\b/i.test(v)).map(([k]) => k);
  assert.ok(colorTokens.length >= 15);
  for (const sel of ['html[data-palette="iris"][data-mode="dark"]', 'html[data-palette="hub-yesil"][data-mode="light"]', 'html[data-palette="iris"][data-mode="light"]']) {
    const o = vars(block(themes, sel));
    assert.deepEqual(colorTokens.filter((k) => !(k in o)), [], sel);
  }
});

test("tema betiği ilk boyamadan önce yüklenir; CSP satır içi betiğe izin vermez", () => {
  assert.ok(html.indexOf("theme-init.js") > 0 && html.indexOf("theme-init.js") < html.indexOf("styles.css"));
  assert.ok(html.indexOf("styles.css") < html.indexOf("themes.css"));
  assert.match(html, /script-src 'self';/);
  assert.equal(/<script>[^<]/.test(html), false);
});
