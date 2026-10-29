// ui/themes.css üretici: ui/styles.css :root içindeki renk değişkenlerinden
// iris (koyu/açık) ve hub-yesil açık paletlerini türetir. Varsayılan = hub-yesil koyu.
const fs = require("node:fs"),
  path = require("node:path");
const cssPath = path.join(__dirname, "../ui/styles.css");
const outPath = process.env.THEMES_OUT || path.join(__dirname, "../ui/themes.css");

const hex2rgb = (h) => {
  h = h.replace("#", "");
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(h.length === 8 ? [h.slice(6)] : []);
};
const rgb2hex = (r, g, b, a) =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("") + (a || "");
function toHsl(h) {
  const [r, g, b, a] = hex2rgb(h),
    mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    l = (mx + mn) / 2,
    d = mx - mn;
  let hue = 0,
    s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s, l, a };
}
function fromHsl({ h, s, l, a }) {
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgb2hex(r + m, g + m, b + m, a);
}
const IRIS_HUE = 246;
const keep = (hex) => {
  const c = toHsl(hex);
  return c.a !== undefined && c.s === 0 && (c.l === 0 || c.l === 1);
};
function iris(hex) {
  if (keep(hex)) return hex;
  const c = toHsl(hex);
  const green = c.h >= 60 && c.h <= 150 && c.s > 0.12;
  const neutral = c.s <= 0.2 && c.h >= 90 && c.h <= 240;
  if (green) c.h = IRIS_HUE;
  else if (neutral) {
    c.h = 226;
    c.s = c.l < 0.35 ? Math.max(c.s, 0.3) : c.l < 0.65 ? Math.max(c.s, 0.14) : Math.max(c.s, 0.1);
  }
  return fromHsl(c);
}
const invert = (hex) => {
  if (keep(hex)) return hex;
  const c = toHsl(hex);
  c.l = 1 - c.l;
  return fromHsl(c);
};

const css = fs.readFileSync(cssPath, "utf8");
const tokensPath = path.join(__dirname, "../ui/design-tokens.css");
const tokens = fs.readFileSync(tokensPath, "utf8");
const rootOf = (src) => src.slice(src.indexOf(":root {"), src.indexOf("\n}", src.indexOf(":root {")));
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
// styles.css :root içindeki --c-* sabit renkleri + design-tokens.css içindeki renk içeren tüm tokenlar
const vars = Object.fromEntries(
  [...rootOf(css).matchAll(/--(c-[\w-]+):\s*(#[0-9a-fA-F]+)\s*;/g), ...rootOf(tokens).matchAll(/--([\w-]+):\s*([^;]*#[0-9a-fA-F]{3,8}\b[^;]*);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]),
);

// Elle seçilen yapısal renkler (değerle eşleşen tüm --c-* değişkenlerine de uygulanır)
const structural = {
  "iris-dark": { "#101214": "#090d18", "#191c1f": "#141a2c", "#202427": "#1b2238", "#2a2e31": "#232c44", "#edf0eb": "#f2f5fb", "#929a9e": "#8791a8", "#c1f78a": "#8a7dff" },
  "hub-yesil-light": { "#101214": "#eef1ec", "#191c1f": "#ffffff", "#202427": "#f4f6f2", "#2a2e31": "#d3d9d0", "#edf0eb": "#141815", "#929a9e": "#586159", "#c1f78a": "#2f6d0c" },
  "iris-light": { "#101214": "#f4f6fb", "#191c1f": "#ffffff", "#202427": "#eef1f7", "#2a2e31": "#d5dbe8", "#edf0eb": "#0e1424", "#929a9e": "#586178", "#c1f78a": "#4a3bd6" },
};
const derive = {
  "iris-dark": (v) => structural["iris-dark"][v] || iris(v),
  "hub-yesil-light": (v) => structural["hub-yesil-light"][v] || invert(v),
  "iris-light": (v) => structural["iris-light"][v] || invert(iris(v)),
};
const selectors = {
  "iris-dark": 'html[data-palette="iris"][data-mode="dark"]',
  "hub-yesil-light": 'html[data-palette="hub-yesil"][data-mode="light"]',
  "iris-light": 'html[data-palette="iris"][data-mode="light"]',
};
const names = { bg: "#101214", surface: "#191c1f", surface2: "#202427", line: "#2a2e31", muted: "#929a9e", text: "#edf0eb", accent: "#c1f78a" };
let out = `/* Otomatik üretildi: node scripts/generate-themes.cjs — elle düzenlemeyin.\n   Varsayılan (hub-yesil + koyu) ui/styles.css :root içindedir. */\n`;
for (const [id, sel] of Object.entries(selectors)) {
  out += `${sel} {\n  color-scheme: ${id.endsWith("light") ? "light" : "dark"};\n`;
  for (const [k, v] of Object.entries(vars)) {
    out += `  --${k}: ${v.replace(HEX, (h) => derive[id](h))};\n`;
  }
  if (id.endsWith("light")) out += `  --c-white: ${derive[id](names.text)};\n`;
  out += "}\n";
}
fs.writeFileSync(outPath, out);
console.log("themes.css:", Object.keys(vars).length, "değişken × 3 tema");
