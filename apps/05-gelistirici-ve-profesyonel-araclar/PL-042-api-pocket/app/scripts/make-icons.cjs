// Simge üretimi (geliştirme aracı; pakete girmez): SVG → PNG (Chromium ile) → ICO (PNG gömülü).
// Çalıştırma: node scripts/make-icons.cjs   (playwright gerekir: PLAYWRIGHT_MODULE ile yol verilebilir)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), path = require("node:path");
const out = path.join(__dirname, "..", "icons");
// Hub aksanı (#7c6cff) üzerinde koyu zemin; cep (yuvarlatılmış cep ağzı) içinde GET oku ve süslü parantez: "cepteki API isteği". Aile simgeleriyle aynı biçim.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#7c6cff"/>
  <rect x="22" y="22" width="84" height="84" rx="14" fill="#0b0f1a"/>
  <path d="M36 48h56v26c0 15-12 24-28 24S36 89 36 74z" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round" opacity=".9"/>
  <path d="M36 48c8 8 48 8 56 0" fill="none" stroke="#ffffff" stroke-width="4" opacity=".55"/>
  <path d="M52 76h22M66 68l8 8-8 8" fill="none" stroke="#f4c45a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M58 30c-5 0-6 3-6 6v3c0 2-1 3-3 3 2 0 3 1 3 3M70 30c5 0 6 3 6 6v3c0 2 1 3 3 3-2 0-3 1-3 3" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
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
