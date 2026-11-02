// Simge üretimi (geliştirme aracı; pakete girmez): SVG → PNG (Chromium ile) → ICO (PNG gömülü).
// Çalıştırma: node scripts/make-icons.cjs   (playwright gerekir: PLAYWRIGHT_MODULE ile yol verilebilir)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), path = require("node:path");
const out = path.join(__dirname, "..", "icons");
// Hub aksanı (#7c6cff) üzerinde koyu zemin; üç düğümlü iz (iddia → kaynaklar) ve bir alıntı imi: "kanıt izi". Aile simgeleriyle aynı biçim.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#7c6cff"/>
  <rect x="22" y="22" width="84" height="84" rx="14" fill="#0b0f1a"/>
  <path d="M42 84 L64 58 L86 70" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
  <circle cx="42" cy="84" r="8" fill="#ffffff"/>
  <circle cx="64" cy="58" r="8" fill="#f4c45a"/>
  <circle cx="86" cy="70" r="8" fill="#ffffff"/>
  <path d="M38 34h9l-4 12h-6zM52 34h9l-4 12h-6z" fill="#7c6cff"/>
</svg>`;
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage();
  const pngs = {};
  for (const s of [16, 32, 48, 128, 256]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${s}" height="${s}" `)}</body></html>`);
    pngs[s] = await p.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(out, `icon${s}.png`), pngs[s]);
  }
  await b.close();
  const sizes = [16, 32, 48, 256];
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let offset = head.length;
  sizes.forEach((s, i) => {
    const o = 6 + 16 * i;
    head.writeUInt8(s === 256 ? 0 : s, o); head.writeUInt8(s === 256 ? 0 : s, o + 1);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(pngs[s].length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += pngs[s].length;
  });
  fs.writeFileSync(path.join(out, "icon.ico"), Buffer.concat([head, ...sizes.map((s) => pngs[s])]));
  console.log("simgeler yazıldı:", fs.readdirSync(out).join(", "));
})();
