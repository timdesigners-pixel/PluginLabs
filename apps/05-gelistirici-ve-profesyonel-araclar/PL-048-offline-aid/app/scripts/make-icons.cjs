// Simge üretimi (geliştirme aracı; pakete girmez): SVG → PNG (Chromium ile) → ICO (PNG gömülü).
// Çalıştırma: node scripts/make-icons.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), path = require("node:path");
const out = path.join(__dirname, "..", "icons");
// Hub aksanı (#7c6cff) üzerinde koyu zemin; cihaz işlemcisi (chip) içinde metin satırları ve çevrimdışı onay işareti.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#7c6cff"/>
  <rect x="22" y="22" width="84" height="84" rx="14" fill="#0b0f1a"/>
  <rect x="38" y="38" width="52" height="52" rx="8" fill="none" stroke="#ffffff" stroke-width="4"/>
  <path d="M50 30v8M64 30v8M78 30v8M50 90v8M64 90v8M78 90v8M30 50h8M30 64h8M30 78h8M90 50h8M90 64h8M90 78h8" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity=".65"/>
  <path d="M48 54h32M48 64h22" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  <path d="M54 76l7 7 15-15" fill="none" stroke="#f4c45a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
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
