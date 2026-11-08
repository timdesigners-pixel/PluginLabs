// Simge üretimi (geliştirme aracı; pakete girmez): SVG → PNG (Chromium ile) → ICO (PNG gömülü).
// Çalıştırma: node scripts/make-icons.cjs   (playwright gerekir: PLAYWRIGHT_MODULE ile yol verilebilir)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), path = require("node:path");
const out = path.join(__dirname, "..", "icons");
// Hub aksanı (#7c6cff) üzerinde koyu zemin; tırtıklı fatura belgesi + TL/toplam satırları + altın onay rozeti.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#7c6cff"/>
  <rect x="22" y="22" width="84" height="84" rx="14" fill="#0b0f1a"/>
  <path d="M40 32h48a4 4 0 0 1 4 4v58l-8-5-8 5-8-5-8 5-8-5-8 5V36a4 4 0 0 1 4-4z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
  <line x1="48" y1="46" x2="72" y2="46" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  <line x1="48" y1="58" x2="80" y2="58" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".65"/>
  <line x1="48" y1="70" x2="66" y2="70" stroke="#f4c45a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="84" cy="74" r="13" fill="#0b0f1a" stroke="#f4c45a" stroke-width="4"/>
  <path d="M78 74l4 4 8-9" fill="none" stroke="#3ad29f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
(async () => {
  fs.mkdirSync(out, { recursive: true });
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
