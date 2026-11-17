// Arayüz duman testi + ekran görüntüleri: gerçek Rust motoru (WebAssembly) ile tarayıcı önizlemesi.
// Kullanım: node scripts/ui-check.cjs [çıktı-klasörü]   (önce scripts/build-wasm.sh)
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "ui");
const out = process.argv[2] || path.join(__dirname, "..", "docs", "screenshots");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json" };
// Sahte Poly Haven (çevrimdışı test): küçük glTF kanepe ve bir parke doku seti
const zlib = require("zlib");
function makePng(w, h, px) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = px(x, y); c.forEach((v, k) => (raw[y * (w * 4 + 1) + 1 + x * 4 + k] = v)); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function fakeSofa() {
  // birim küpten 2 × 0,8 × 0,9 m kanepe gövdesi (6 yüz, UV'li)
  const P = [], N = [], U = [], I = [];
  const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
  const S = [1.0, 0.45, 0.4];
  for (const [n, u, v] of faces) {
    const b = P.length / 3;
    for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      for (let k = 0; k < 3; k++) P.push((n[k] + u[k] * a + v[k] * c) * S[k] + (k === 1 ? 0.45 : 0));
      N.push(...n); U.push((a + 1) / 2, (1 - c) / 2);
    }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const f = Buffer.from(new Float32Array([...P, ...N, ...U]).buffer);
  const idx = Buffer.from(new Uint16Array(I).buffer);
  const bin = Buffer.concat([f, idx]);
  const n = P.length / 3;
  const gltf = {
    asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: "Kadife", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.9 } }],
    textures: [{ source: 0 }], images: [{ uri: "textures/kadife.png" }],
    buffers: [{ byteLength: bin.length, uri: "test_sofa.bin" }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: n * 12 }, { buffer: 0, byteOffset: n * 12, byteLength: n * 12 }, { buffer: 0, byteOffset: n * 24, byteLength: n * 8 }, { buffer: 0, byteOffset: n * 32, byteLength: I.length * 2 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: n, type: "VEC3" }, { bufferView: 1, componentType: 5126, count: n, type: "VEC3" }, { bufferView: 2, componentType: 5126, count: n, type: "VEC2" }, { bufferView: 3, componentType: 5123, count: I.length, type: "SCALAR" }],
  };
  const tex = makePng(16, 16, (x, y) => [20 + ((x + y) % 4) * 6, 90 + (x % 3) * 8, 70, 255]);
  return { main: "test_sofa.gltf", files: { "test_sofa.gltf": Buffer.from(JSON.stringify(gltf)).toString("base64"), "test_sofa.bin": bin.toString("base64"), "textures/kadife.png": tex.toString("base64") }, license: "Poly Haven · CC0" };
}
const PH = {
  "list/models": [{ id: "test_sofa", name: "Test Sofa", categories: ["seating", "furniture"], tags: ["sofa"], polycount: 12, dimensions: [2000, 900, 800], authors: "Test" }, { id: "test_plant", name: "Test Plant", categories: ["plants", "potted plants"], tags: ["plant"], polycount: 9000, dimensions: [500, 1200, 500], authors: "Test" }],
  "list/textures": [{ id: "test_oak", name: "Test Oak Floor", categories: ["floor", "wood"], tags: ["parquet"], dimensions: [2000, 2000], authors: "Test" }],
  "model/test_sofa/2k": fakeSofa(),
  "texture/test_oak/2k": { maps: { diff: makePng(32, 32, (x, y) => [150 + (y % 8) * 6, 105 + (y % 8) * 4, 70, 255]).toString("base64"), nor: makePng(8, 8, () => [128, 128, 255, 255]).toString("base64"), arm: makePng(8, 8, () => [255, 150, 0, 255]).toString("base64") }, license: "Poly Haven · CC0" },
};
const server = http.createServer((req, res) => {
  const ph = decodeURIComponent(req.url.split("?")[0]).match(/^\/polyhaven\/(.+)$/);
  if (ph) {
    if (ph[1].startsWith("thumb/")) { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(makePng(8, 8, () => [90, 110, 140, 255])); }
    const body = PH[ph[1]];
    res.writeHead(body ? 200 : 404, { "Content-Type": "application/json" });
    return res.end(body ? JSON.stringify(body) : "{}");
  }
  const p = path.normalize(path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html"));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, {
    "Content-Type": types[path.extname(p)] || "application/octet-stream",
    // Tauri yapılandırmasındaki CSP + yalnız önizleme için WebAssembly izni
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
  });
  fs.createReadStream(p).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: Number(process.env.DSF || 1) });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, name) }); console.log("ekran:", name); };
  // CSP 'unsafe-eval' içermediği için waitForFunction yerine metin yoklaması
  const waitUntil = async (fn, ms = 30000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await fn()) return;
      await page.waitForTimeout(150);
    }
    throw new Error("zaman aşımı: koşul gerçekleşmedi");
  };
  const waitText = async (sel, re, ms = 60000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const t = await page.textContent(sel).catch(() => "");
      if (re.test(t || "")) return;
      await page.waitForTimeout(200);
    }
    throw new Error(`${sel} beklenen metne ulaşmadı: ${re}`);
  };
  const ok = (cond, msg) => { if (!cond) { errors.push("DOĞRULAMA: " + msg); console.log("✗", msg); } else console.log("✓", msg); };

  // 1 · Model: boş proje, modül seçimi
  await page.goto(base);
  await waitText("#engineInfo", /Rust/);
  await page.waitForSelector("#view-karsilama.is-active");
  ok((await page.textContent("#welcomeWire")).includes("Henüz proje yok"), "Karşılama: boş durumda yönlendirme");
  await page.click("#btnWelcomeNew");
  await page.waitForSelector("#view-model.is-active");
  await page.click('[data-storey="2"]');
  await page.click('[data-inc="10"]');
  await page.click('[data-inc="10"]');
  await page.click('[data-inc="6"]');
  ok((await page.textContent("#kpiArea")) === "104 m²", "Model: 2×(4×10) + 4×6 = 104 m²");
  await shot("01-model.png");
  await page.click("#btnPlaceModules");
  await page.waitForSelector("#view-katlar.is-active");
  await page.check('[data-upper="M1"]');
  await page.waitForTimeout(400);
  ok(await page.isChecked('[data-upper="M1"]'), "Katlar: M1 üst kata çıkarıldı");
  await shot("02-katlar.png");

  // Karşılama: örnek projenin önden tel kafes önizlemesi
  await page.goto(base + "?demo=1&view=karsilama");
  await page.waitForSelector("#welcomeWire svg line", { state: "attached" });
  ok((await page.locator("#welcomeWire svg line.k1").count()) >= 8, "Karşılama: ön cephe açıklıkları tel kafeste");
  ok((await page.textContent("#welcomeCap")).includes("Ön cephe"), "Karşılama: cephe ölçüleri yazılı");
  await shot("00-karsilama.png");
  await page.click('#segElev [data-side="arka"]');
  await waitText("#welcomeCap", /Arka cephe/);

  // Örnek proje ile iç plan
  await page.goto(base + "?demo=1&view=plan&sel=room:L0-R1");
  await page.waitForSelector("#view-plan.is-active");
  await page.waitForTimeout(800);
  ok((await page.textContent("#liveStats")).includes("4 mahal"), "İç plan: örnek projede 4 mahal");
  ok((await page.textContent("#inspector")).includes("Net alan"), "İç plan: seçili mahal denetçisi");
  await shot("03-ic-plan.png");

  // 3B
  await page.click('[data-view="uc"]');
  await waitText("#view3dInfo", /üçgen/);
  await page.waitForTimeout(800);
  await shot("04-3b-dis.png");
  await page.click('#segView [data-v="ic"]');
  await page.waitForTimeout(1200);
  await page.selectOption("#selRes", "960x540");
  await page.selectOption("#selSpp", "16");
  await page.click("#btnRender");
  await page.waitForSelector("#renderFig:not([hidden])", { timeout: 600000 });
  ok((await page.getAttribute("#renderImg", "src")).startsWith("data:image/png;base64,"), "3B: render PNG üretildi");
  await shot("05-render.png");
  // render stili ve motoru: Cycles tarayıcı önizlemesinde masaüstüne yönlendirir
  await page.selectOption("#selStyle", "editorial");
  await page.click('#segEngine [data-engine="cycles"]');
  await waitText("#cyclesState", /masaüstü/);
  await page.locator("#cyclesState").scrollIntoViewIfNeeded();
  await shot("24-render-motoru.png");
  await page.click('#segEngine [data-engine="internal"]');
  await page.selectOption("#selStyle", "default");

  // Ölçü, maliyet, fonksiyon, özet
  await page.click('[data-view="olcu"]');
  await page.waitForSelector("#mRooms tbody tr");
  await shot("06-olcu.png");
  await page.click('[data-view="maliyet"]');
  await page.waitForSelector("#cLines tbody tr");
  ok((await page.textContent("#cKpis")).includes("₺"), "Maliyet: toplam hesaplandı");
  await page.click('#segTier [data-t="premium"]');
  await page.waitForTimeout(800);
  await shot("07-maliyet.png");
  await page.click('[data-view="fonksiyon"]');
  await page.fill("#fnName", "Perde kornişi");
  await page.fill("#fnExpr", "windows * 2.5");
  await page.click("#btnFnTest");
  await page.waitForTimeout(400);
  ok((await page.textContent("#fnResult")).includes("Sonuç"), "Fonksiyon: formül denendi");
  await page.click("#btnFnAdd");
  await page.waitForTimeout(500);
  ok((await page.textContent("#fnList")).includes("Perde kornişi"), "Fonksiyon: eklendi");
  await shot("08-fonksiyonlar.png");
  // sürükle bırak: plan aracından tuvale, hızlı üründen 3B sahneye; 3B araç çubuğu
  await page.click('[data-view="plan"]');
  await page.waitForSelector("#view-plan.is-active");
  await page.evaluate(() => document.querySelectorAll("#toolPanel details").forEach((d) => (d.open = true)));
  const before = await page.evaluate(() => document.querySelector("#sideInfo").textContent);
  await page.dragAndDrop('#toolPanel [data-drag-item="berjer"]', "#canvasP", { targetPosition: { x: 420, y: 300 } });
  await page.waitForTimeout(600);
  ok((await page.inputValue('#inspector [data-f="name"]')) === "Berjer", "Sürükle bırak: berjer plana bırakıldı ve seçildi");
  await page.click('[data-view="uc"]');
  await waitText("#view3dInfo", /üçgen/);
  await page.waitForSelector('#quick3d [data-drag-item="lambader"]');
  await page.dragAndDrop('#quick3d [data-drag-item="lambader"]', "#canvas3d", { targetPosition: { x: 520, y: 520 } });
  await waitText("#b3dSel", /Lambader/);
  ok(!(await page.isDisabled('[data-3d="rot"]')), "3B: bırakılan nesne seçili, araç çubuğu etkin");
  await page.click('[data-3d="rot"]');
  await page.click('[data-3d="up"]');
  await page.click('#seg3dMode [data-mode="duzenle"]');
  await page.waitForTimeout(900);
  await shot("21-3b-duzenleme.png");
  void before;
  // tasarım motorları
  await page.click('[data-view="motor"]');
  await waitText("#motorInfo", /cm/);
  ok(/perde/i.test(await page.textContent("#motorInfo")), "Motor: perde önizlemesi üretildi");
  await page.selectOption('#motorForm [data-mk="header"]', "kemer-kavisli");
  await page.waitForTimeout(500);
  // görünüm yükleme: bir görseli perde kumaşı olarak kullan, gerçekçi önizleme al
  await page.setInputFiles("#lookInput", path.join(__dirname, "..", "docs", "screenshots", "render-kusbakisi.png"));
  await waitText("#toasts", /Görünüm yüklendi/);
  ok((await page.inputValue('#motorForm [data-mk="look"]')).startsWith("img:"), "Motor: yüklenen görünüm seçildi");
  await page.click("#btnMotorReal");
  await page.waitForSelector("#motorReal:not([hidden])", { timeout: 600000 });
  await shot("15-motor-perde.png");
  await page.click('#motorTabs [data-m="hali"]');
  await page.selectOption('#motorForm [data-mk="pattern"]', "madalyon");
  await waitText("#motorInfo", /[Hh]alı/);
  await page.waitForTimeout(400);
  await shot("16-motor-hali.png");
  await page.click('#motorTabs [data-m="havuz"]');
  await waitText("#motorInfo", /[Hh]avuz/);
  await page.waitForTimeout(400);
  await shot("17-motor-havuz.png");
  await page.click('#motorTabs [data-m="yatak"]');
  await waitText("#motorInfo", /Yatak/);
  await page.waitForTimeout(400);
  await shot("18-motor-yatak.png");
  await page.click("#btnMotorAdd");
  await page.waitForSelector("#view-plan.is-active");
  await page.waitForTimeout(600);
  ok((await page.inputValue('#inspector [data-f="name"]')).startsWith("Yatak"), "Motor: yatak plana eklendi ve seçildi");
  // izometrik görünüm ve gökyüzü
  await page.click('[data-view="uc"]');
  await waitText("#view3dInfo", /üçgen/);
  await page.click('[data-cam="izometrik-kesit"]');
  await page.waitForTimeout(1500);
  await page.check("#chkSky");
  await page.fill("#skyHour", "17.5");
  await page.dispatchEvent("#skyHour", "input");
  ok((await page.textContent("#skyHourOut")) === "17:30", "Gökyüzü: saat 17:30");
  await shot("19-izometrik-kesit.png");
  // görselden referans: örnek render'ı referans al, sahneye uygula
  await page.click('[data-view="referans"]');
  await page.setInputFiles("#refInput", path.join(__dirname, "..", "docs", "screenshots", "render-perspektif-gun-batimi.png"));
  await page.waitForSelector("#refBody:not([hidden])");
  ok((await page.locator("#refPalette span").count()) >= 3, "Referans: renk paleti çıkarıldı");
  ok((await page.textContent("#refApplyList")).includes("Gökyüzü"), "Referans: uyarlama önerileri listelendi");
  await shot("20-gorselden-referans.png");
  await page.click("#btnRefApply");
  await page.waitForSelector("#view-uc.is-active");
  await page.waitForTimeout(1200);
  ok(await page.isChecked("#chkSky"), "Referans: gökyüzü ayarı sahneye uygulandı");
  // fotoğraftan mekân: köşe işaretleri → ölçü → 3B oda → ölçü düzenleme
  await page.click('[data-view="foto"]');
  await page.setInputFiles("#photoInput", path.join(__dirname, "..", "docs", "screenshots", "render-ic-mekan.png"));
  await waitText("#phResult", /Genişlik/);
  ok((await page.locator("#phSvg [data-pt]").count()) === 6, "Fotoğraf: 6 köşe işareti");
  ok((await page.locator("#phSvg line.uh-ph-out").count()) >= 4, "Fotoğraf: hesaplanan oda fotoğrafa geri izdüşüldü");
  await page.focus('#phSvg [data-pt="tr"]');
  for (let i = 0; i < 6; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(400);
  await page.click("#btnPhotoBuild");
  await page.waitForSelector("#spaceRows [data-sp]");
  await shot("23-fotograftan-mekan.png");
  await page.fill('#spaceRows [data-k="width"]', "500");
  await page.dispatchEvent('#spaceRows [data-k="width"]', "change");
  const areaBefore = await page.textContent("#spaceRows td.is-num:nth-child(5)");
  await page.waitForTimeout(1500);
  ok((await page.inputValue('#spaceRows [data-k="width"]')) === "500", "Mekân: genişlik düzenlendi");
  void areaBefore;
  // ürün ve kaplama kütüphaneleri, boyutlandırma
  await page.click('[data-view="kutuphane"]');
  await page.waitForSelector("#libGrid .uh-libcard svg");
  ok((await page.locator("#libGrid .uh-libcard").count()) >= 55, "Ürün kütüphanesi: en az 55 hazır model");
  await page.click('#libGrid [data-lib-real="kanepe-3"]');
  await page.waitForSelector('[data-thumb="kanepe-3"] img', { timeout: 600000 });
  await page.click('#libGrid [data-lib-real="berjer"]');
  await page.waitForSelector('[data-thumb="berjer"] img', { timeout: 600000 });
  await shot("12-urun-kutuphanesi.png");
  // gerçekçi kütüphane: indir → glTF içe aktar → plana yerleştir
  await page.waitForSelector('#phGrid [data-phget="test_sofa"]');
  ok((await page.locator("#phGrid .uh-phcard").count()) === 1, "Poly Haven: oturma kategorisinde 1 model");
  await page.click('#phGrid [data-phget="test_sofa"]');
  await waitText("#objResult", /12/);
  ok(/200 × 90 × 80/.test(await page.textContent("#objResult")), "glTF: ölçü doğru (200 × 90 × 80 cm)");
  await page.locator("#phGrid").scrollIntoViewIfNeeded();
  await shot("25-gercekci-kutuphane.png");
  await page.click('[data-view="kaplama"]');
  await page.waitForSelector("#matGrid .uh-matcard");
  await page.fill("#matName", "Doğal taş bazalt");
  await page.fill("#matPrice", "2100");
  await page.click("#btnMatAdd");
  await page.waitForTimeout(400);
  ok((await page.textContent("#matGrid")).includes("Doğal taş bazalt"), "Kaplama kütüphanesi: yeni kaplama eklendi");
  await shot("13-kaplama-kutuphanesi.png");
  await page.waitForSelector('#phtGrid [data-phget="test_oak"]');
  await page.click('#phtGrid [data-phget="test_oak"]');
  await waitText("#toasts", /Test Oak Floor/);
  ok(await page.evaluate(() => [...document.querySelectorAll("#matGrid .uh-matcard b")].some((b) => b.textContent.includes("Test Oak Floor"))), "Gerçek doku: kaplamalara eklendi");
  await page.locator("#phtGrid").scrollIntoViewIfNeeded();
  await shot("26-gercek-dokular.png");
  const palFile = path.join(out, "ornek-palet.gpl");
  fs.writeFileSync(palFile, "GIMP Palette\nName: Yaz evi\n232 220 200 Kum\n107 143 113 Adaçayı\n43 58 85 Gece mavisi\n201 122 86 Kiremit\n");
  await page.setInputFiles("#paletteInput", palFile);
  await waitText("#matGrid", /Gece mavisi/);
  ok((await page.locator("#matGrid .uh-matcard").count()) === 4, "Palet: 4 renk kaplamalara eklendi");
  await shot("22-renk-paleti.png");
  fs.unlinkSync(palFile);
  await page.click('#matCats [data-mat-cat="zemin"]');
  await page.waitForSelector("#matGrid .uh-matcard.is-active");
  await page.click('#matGrid .uh-matcard.is-active [data-mat-apply]');
  await page.waitForSelector("#view-plan.is-active");
  ok((await page.textContent("#activeTool")).includes("Kaplama"), "Kaplama: uygulama aracı etkin");
  // renk kartelası: RAL ara → seç → boya aracı
  await page.click('[data-view="kaplama"]');
  await page.waitForSelector("#paintGrid .uh-paintsw");
  ok((await page.locator("#paintGrid .uh-paintsw").count()) === 215, "Renk kartelası: RAL Classic 215 renk");
  await page.fill("#paintSearch", "antrasit");
  await page.waitForSelector('#paintGrid [data-paint-code="7016"]');
  await page.click('#paintGrid [data-paint-code="7016"]');
  await waitText("#toasts", /RAL 7016 Antrasit gri/);
  await page.click('[data-view="plan"]');
  await page.waitForSelector("#view-plan.is-active");
  ok((await page.textContent("#activeTool")).includes("RAL 7016"), "Renk kartelası: boya aracı RAL 7016 ile hazır");
  await page.click('[data-view="kaplama"]');
  await page.waitForSelector("#paintGrid .uh-paintsw");
  await page.fill("#paintSearch", "");
  await page.dispatchEvent("#paintSearch", "input");
  await page.click('#paintGroups [data-paint-group="grey"]');
  await page.locator("#paintSys").scrollIntoViewIfNeeded();
  await shot("27-renk-kartelasi.png");
  // firma kartelası (CSV) içe aktarma
  const kart = path.join(out, "ornek-firma.csv");
  fs.writeFileSync(kart, "kod;ad;hex;grup\nOF-101;Kireç beyazı;#F2EEE4;Beyazlar\nOF-205;Zeytin dalı;#7D8566;Yeşiller\nOF-310;Kil;B9775A;Topraklar\n");
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click("#btnPaintImport")]);
  await chooser.setFiles(kart);
  await waitText("#paintState", /3 renk/);
  ok((await page.inputValue("#paintSys")) === "k-ornek_firma", "Firma kartelası: içe aktarıldı ve seçildi");
  await page.selectOption("#paintTarget", "cephe");
  await page.click('#paintGrid [data-paint-code="OF-310"]');
  await waitText("#toasts", /OF-310/);
  fs.unlinkSync(kart);
  // tek duvarda kombine boya: üst + alt bölge + şerit
  await page.goto(base + "?demo=1&view=plan&sel=wall:M1-G2000");
  await page.waitForSelector("#inspector .uh-details summary");
  await page.click("#inspector .uh-details summary");
  await page.click('#inspector [data-act="two-tone"][data-up="9010"]');
  await waitUntil(async () => (await page.inputValue('#inspector [data-f="lower"]').catch(() => "")) === "ral7016-ic");
  ok((await page.inputValue('#inspector [data-f="wmat"]')) === "ral9010-ic", "Kombine boya: üst renk RAL 9010");
  await page.fill('#inspector [data-f="split"]', "110");
  await page.dispatchEvent('#inspector [data-f="split"]', "change");
  await waitUntil(() => page.isEnabled('#inspector [data-f="band"]').catch(() => false));
  await page.selectOption('#inspector [data-f="band"]', "ral9010-ic");
  await waitUntil(() => page.isEnabled('#inspector [data-f="band_h"]').catch(() => false));
  ok((await page.inputValue('#inspector [data-f="split"]')) === "110" && (await page.inputValue('#inspector [data-f="band_h"]')) === "6", "Kombine boya: ayırma 110 cm, şerit 6 cm");
  await shot("28-kombine-duvar-boyasi.png");
  await page.evaluate(() => {});
  await page.goto(base + "?demo=1&view=plan&sel=object:N1");
  await page.waitForSelector("#view-plan.is-active");
  await page.waitForTimeout(900);
  await page.fill('#inspector [data-f="w"]', "260");
  await page.dispatchEvent('#inspector [data-f="w"]', "change");
  await page.waitForTimeout(500);
  ok((await page.textContent("#inspector")).includes("%118"), "Boyutlandırma: genişlik 220 → 260 cm (%118)");
  await shot("14-boyutlandirma.png");
  await page.click('[data-view="ozet"]');
  await page.waitForSelector("#sumRooms tbody tr");
  await shot("09-ozet.png");
  await page.click('[data-view="mymind"]');
  await page.waitForTimeout(600);
  ok((await page.textContent("#mmPreview")).includes("m²"), "MyMind: veri azaltılmış önizleme");
  ok(!(await page.textContent("#mmPreview")).includes("₺"), "MyMind: fiyat gönderilmez");
  await shot("10-mymind.png");
  // komut paleti
  await page.keyboard.press("Control+k");
  await page.waitForSelector("#cmdDialog[open]");
  await shot("11-komut-paleti.png");
  await page.keyboard.press("Escape");

  // Genişleme paketleri: lisanssız kilitli, imzalı test lisansıyla açılır
  await page.goto(base + "?demo=1&view=paket");
  await page.waitForSelector('#packGrid [data-pack="uhd-tiny-house"]');
  ok((await page.locator("#packGrid [data-pack-preset]:disabled").count()) === 7, "Paketler: lisanssız 7 gövde kilitli");
  ok((await page.textContent("#packCount")) === "0/2", "Paketler: 0/2 lisans");
  await shot("29-genisleme-paketleri.png");
  const ed = require("crypto").generateKeyPairSync("ed25519");
  const packKey = ed.publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64");
  const lic = (pack) => {
    const body = Buffer.from(JSON.stringify({ pack, app: "PL-060", lic: "TEST", iat: "2026-11-17" })).toString("base64url");
    return `UHPK1.${body}.${require("crypto").sign(null, Buffer.from(`UHPK1.${body}`), ed.privateKey).toString("base64url")}`;
  };
  const licUrl = `&packkey=${encodeURIComponent(packKey)}&packlic=${lic("uhd-tiny-house")},${lic("uhd-van-builder")}`;
  await page.goto(base + "?demo=1&view=paket" + licUrl);
  await waitText("#packCount", /2\/2/);
  await page.click('[data-pack-preset="th-72"]');
  await page.waitForSelector("#packCheck .pl-table");
  ok((await page.locator("#packCheck .pl-badge--success").count()) === 6, "Tiny House 7,2 m: yol ölçüsü ve ağırlık uygun");
  ok((await page.textContent("#packCheck")).includes("2.550 mm") || (await page.textContent("#packCheck")).includes("2550 mm"), "Tiny House: dış genişlik 2550 mm");
  await page.locator("#packCheck").scrollIntoViewIfNeeded();
  await shot("30-tiny-house-denetim.png");
  await page.click('[data-view="uc"]');
  await page.waitForTimeout(2500);
  await shot("31-tiny-house-3b.png");
  await page.click('[data-view="paket"]');
  await page.click('[data-pack-preset="van-l3h2"]');
  await waitText("#packCheck", /2560 Wh|2\.560 Wh/);
  ok((await page.locator("#packCheck .pl-badge--danger").count()) === 0, "Van L3H2: faydalı yük ve enerji uygun");
  await page.locator("#packCheck").scrollIntoViewIfNeeded();
  await shot("32-van-builder-denetim.png");
  await page.click('[data-view="plan"]');
  await page.waitForTimeout(900);
  await shot("33-van-plan.png");
  await page.click('[data-view="kutuphane"]');
  await page.waitForSelector('#libGroups [data-lib-group="Van"]');
  ok(true, "Paket ürünleri lisansla ürün kütüphanesinde");

  // İngilizce arayüz: tüm metinler dil dosyasından gelir, eksik anahtar uyarısı olmamalı
  const missing = [];
  page.on("console", (m) => { if (m.text().includes("i18n:")) missing.push(m.text()); });
  await page.goto(base + "?demo=1&lang=en&view=karsilama");
  await waitText("#engineInfo", /Rust engine/);
  await shot("en-00-welcome.png");
  for (const [view, file] of [["plan", "en-03-floor-plan.png"], ["uc", "en-04-3d-render.png"], ["foto", "en-23-room-from-photo.png"], ["maliyet", "en-07-cost.png"]]) {
    await page.click(`[data-view="${view}"]`);
    await page.waitForTimeout(view === "uc" ? 2500 : 900);
    await shot(file);
  }
  await page.click('[data-view="kaplama"]');
  await page.waitForSelector('#paintGrid [data-paint-code="7016"]');
  ok((await page.textContent('#paintGrid [data-paint-code="7016"]')).includes("Anthracite grey"), "İngilizce: RAL adları dil dosyasından");
  await page.locator("#paintSys").scrollIntoViewIfNeeded();
  await shot("en-27-colour-systems.png");
  ok(missing.length === 0, `İngilizce: eksik çeviri anahtarı yok (${missing.length})`);
  if (missing.length) console.log(missing.slice(0, 20).join("\n"));
  await browser.close();
  server.close();
  if (errors.length) { console.error("HATALAR:\n" + errors.join("\n")); process.exit(1); }
  console.log("Arayüz denetimi geçti");
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
