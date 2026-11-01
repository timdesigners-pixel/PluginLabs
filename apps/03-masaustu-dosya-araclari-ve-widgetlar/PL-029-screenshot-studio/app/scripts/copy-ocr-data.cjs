// OCR dil verisini (Tesseract LSTM "best_int", Apache-2.0) npm paketlerinden uygulamanın ocr-data/ klasörüne kopyalar.
// npm ci sonrasında otomatik çalışır (postinstall). Uygulama dil verisini internetten indirmez; yalnız bu klasörden okur.
const fs = require("node:fs"), path = require("node:path");
const root = path.join(__dirname, "..");
const out = path.join(root, "ocr-data");
fs.mkdirSync(out, { recursive: true });
for (const lang of ["tur", "eng"]) {
  let src;
  try { src = path.join(path.dirname(require.resolve("@tesseract.js-data/" + lang + "/package.json", { paths: [root] })), "4.0.0_best_int", lang + ".traineddata.gz"); } catch { src = null; }
  if (!src || !fs.existsSync(src)) { console.warn("ocr-data: " + lang + " dil verisi bulunamadı (geliştirme bağımlılıkları kurulu değil)"); continue; }
  fs.copyFileSync(src, path.join(out, lang + ".traineddata.gz"));
}
console.log("ocr-data:", fs.readdirSync(out).join(", "));
