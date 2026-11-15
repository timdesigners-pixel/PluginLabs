// Arayüz duman testi + ekran görüntüleri: gerçek Rust motoru (WebAssembly) ile tarayıcı önizlemesi.
// Kullanım: node scripts/ui-check.cjs [çıktı-klasörü]   (önce scripts/build-wasm.sh)
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "ui");
const out = process.argv[2] || path.join(__dirname, "..", "docs", "screenshots");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
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
  // tasarım motorları
  await page.click('[data-view="motor"]');
  await waitText("#motorInfo", /cm/);
  ok((await page.textContent("#motorInfo")).includes("perde"), "Motor: perde önizlemesi üretildi");
  await page.selectOption('#motorForm [data-mk="header"]', "kemer-kavisli");
  await page.waitForTimeout(500);
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
  // ürün ve kaplama kütüphaneleri, boyutlandırma
  await page.click('[data-view="kutuphane"]');
  await page.waitForSelector("#libGrid .uh-libcard svg");
  ok((await page.locator("#libGrid .uh-libcard").count()) >= 55, "Ürün kütüphanesi: en az 55 hazır model");
  await shot("12-urun-kutuphanesi.png");
  await page.click('[data-view="kaplama"]');
  await page.waitForSelector("#matGrid .uh-matcard");
  await page.fill("#matName", "Doğal taş bazalt");
  await page.fill("#matPrice", "2100");
  await page.click("#btnMatAdd");
  await page.waitForTimeout(400);
  ok((await page.textContent("#matGrid")).includes("Doğal taş bazalt"), "Kaplama kütüphanesi: yeni kaplama eklendi");
  await shot("13-kaplama-kutuphanesi.png");
  await page.click('#matGrid .uh-matcard.is-active [data-mat-apply]');
  await page.waitForSelector("#view-plan.is-active");
  ok((await page.textContent("#activeTool")).includes("Kaplama"), "Kaplama: uygulama aracı etkin");
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

  await browser.close();
  server.close();
  if (errors.length) { console.error("HATALAR:\n" + errors.join("\n")); process.exit(1); }
  console.log("Arayüz denetimi geçti");
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
