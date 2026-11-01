/* Screenshot Studio — OCR motoru (ana süreç). Yalnız hassas alan ADAYLARINI bulmak için kelimelerin konumlarını okur.
 * Tesseract (tesseract.js, WebAssembly) cihazda, çevrimdışı çalışır: dil verisi uygulamayla gelir (ocr-data/, "best_int" LSTM modelleri),
 * internetten indirilmez, önbellek dosyası yazılmaz. İşler sıraya alınır (aynı anda tek tanıma); motor 5 dakika boşta kalınca kapatılır.
 * Okunan metin diske yazılmaz; yalnız bu oturumda, açık görüntü için bellekte tutulur. */
const path = require("node:path");
const fs = require("node:fs");
const T = require("tesseract.js");
const C = require("../src/studio.js");

const DATA_DIR = path.join(__dirname, "..", "ocr-data");
const IDLE_MS = 5 * 60 * 1000;
let worker = null;
let idle = null;
let chain = Promise.resolve();

function available() {
  return ["tur", "eng"].every((l) => fs.existsSync(path.join(DATA_DIR, l + ".traineddata.gz")));
}
async function stop() {
  clearTimeout(idle);
  idle = null;
  const w = worker;
  worker = null;
  if (w) await w.terminate().catch(() => {});
}
async function getWorker() {
  if (worker) return worker;
  if (!available()) throw new Error("OCR dil verisi bulunamadı (ocr-data). Uygulamayı yeniden kurun.");
  worker = await T.createWorker(["tur", "eng"], 1 /* LSTM */, { langPath: DATA_DIR, gzip: true, cacheMethod: "none", logger: () => {}, errorHandler: () => {} });
  await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "300" });
  return worker;
}

/** nativeImage → [{ words: [{ text, x, y, w, h, conf }] }] (özgün görüntü pikseli). Küçük ekran yazısı için önce büyütülür. */
function words(image) {
  const job = chain.then(async () => {
    clearTimeout(idle);
    const { width, height } = image.getSize();
    const k = C.upscaleFactor(width, height);
    const input = k > 1 ? image.resize({ width: width * k, height: height * k, quality: "best" }) : image;
    const w = await getWorker();
    const r = await w.recognize(input.toPNG(), {}, { blocks: true });
    idle = setTimeout(stop, IDLE_MS);
    return C.linesFromTesseract(r.data, k);
  });
  chain = job.catch(() => {});
  return job;
}

module.exports = { words, stop, available, DATA_DIR };
