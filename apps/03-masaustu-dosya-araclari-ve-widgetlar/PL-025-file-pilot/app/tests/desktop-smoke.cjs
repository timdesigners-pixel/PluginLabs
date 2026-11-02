// Masaüstü duman testi: gerçek Electron penceresi, gerçek klasör taraması (geçici örnek klasör), gerçek arama/önizleme/etiket/benzer belge,
// gerçek sistem panosu; MyMind için taklit Hub. Klasör seçimi ve onaylar TEST kipinde dosyalardan gelir; dosya açma/klasörde gösterme TEST kipinde günlüğe yazılır.
// Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "fp-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "fp-test-"));
const docsRoot = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fp-docs-")), "Belgelerim");
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const KEY = "test-istemci-anahtari-1234567890";

// Örnek klasör: gerçekçi Türkçe belgeler (test verisi).
const FILES = {
  "Faturalar/2026/elektrik-kasim.txt": "Elektrik faturası — Kasım 2026\nAbone no: 48213\nDönem tüketimi 412 kWh.\nSon ödeme tarihi: 15.11.2026\nTutar: 2.480,75 TL\nOtomatik ödeme talimatı yok; bankadan havale ile ödenecek.",
  "Faturalar/2026/dogalgaz-ekim.txt": "Doğalgaz faturası — Ekim 2026\nTüketim 96 m3. Son ödeme tarihi 22.10.2026. Tutar 1.140,20 TL.\nKombi bakımı sonrası tüketim düştü.",
  "Ev/kombi-servis-kayitlari.csv": "tarih,firma,işlem,tutar\n2025-10-02,Isı Servis,yıllık bakım,950\n2026-10-04,Isı Servis,yıllık bakım ve filtre,1250\n2026-10-20,Isı Servis,basınç ayarı,0",
  "Ev/kira-sozlesmesi-notlari.md": "# Kira sözleşmesi\n- Başlangıç: 01.09.2025\n- Depozito: 2 aylık kira\n- Aidat kiracıya ait\n- Kombi bakımı ev sahibine ait (madde 7)\n",
  "İş/Toplantılar/2026-10-28-proje-gundemi.md": "# Proje toplantısı — 28 Ekim\nKatılımcılar: Ayşe, Mehmet, Zeynep\nGündem:\n1. Sürüm 0.2 takvimi\n2. Müşteri geri bildirimleri\nKarar: test haftası 3 Kasım'da başlar. Sorumlu: Zeynep.",
  "İş/Toplantılar/2026-10-14-butce.md": "# Bütçe toplantısı — 14 Ekim\nKatılımcılar: Ayşe, Okan\nGündem: dördüncü çeyrek bütçesi, yazılım lisansları.\nKarar: lisans yenilemesi Kasım'a ertelendi.",
  "İş/rapor-taslak.html": "<html><body><h1>Çeyrek raporu</h1><p>Müşteri memnuniyeti %87; destek talepleri azaldı.</p><script>izleme()</script></body></html>",
  "İş/eski-yazisma.rtf": "{\\rtf1\\ansi\\ansicpg1254 Say\\'fdn Okan Bey,\\par lisans yenilemesi i\\'e7in teklif ektedir.\\par}",
  "Sağlık/tahlil-sonuclari.txt": "Tahlil sonuçları — Eylül 2026\nKolesterol normal sınırda. D vitamini düşük; 3 ay takviye önerildi. Kontrol randevusu: 12 Aralık.",
  "Seyahat/izmir-rezervasyon.txt": "Otel rezervasyonu: İzmir, 21–23 Kasım 2026\nOnay kodu: KZ-7731\nKahvaltı dahil; geç çıkış talep edildi.",
  "Seyahat/pasaport.pdf": Buffer.from("%PDF-1.7\n\x00\x01\x02 ikili içerik"),
  "Fotoğraflar/IMG_2041.jpg": Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  "proje/node_modules/paket/index.js": "gizli kalmalı",
  ".git/config": "gizli kalmalı",
};
for (const [rel, data] of Object.entries(FILES)) { const f = path.join(docsRoot, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); }
const snapshot = () => Object.fromEntries(Object.keys(FILES).map((rel) => { const st = fs.statSync(path.join(docsRoot, rel)); return [rel, st.size + ":" + st.mtimeMs]; }));
const before = snapshot();

// Taklit Hub: /v1/chat/completions; anahtar doğrulanır. Yanıt, gönderilen 1 numaralı bölümden aynen bir alıntı içerir (ve bir uydurma kaynak).
let hubCalls = 0, lastBody = "";
const hub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    lastBody = body;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    let content = "{}";
    try {
      const user = JSON.parse(body).messages[1].content;
      const m = /\[1\] [^\n]+\n([^\n]+)/.exec(user);
      const quote = m && /Son ödeme tarihi: 15\.11\.2026/.test(m[1]) ? "Son ödeme tarihi: 15.11.2026" : (m ? m[1].replace(/^…/, "").slice(0, 24) : "");
      content = "```json\n" + JSON.stringify({ cevap: "Elektrik faturasının son ödeme tarihi 15 Kasım 2026; tutar 2.480,75 TL.", kaynaklar: [{ n: 1, alinti: quote }, { n: 2, alinti: "bu alıntı belgede yok" }] }) + "\n```";
    } catch { /* boş */ }
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, FP_USER_DATA: userData, FP_TEST_DIR: testDir, FP_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1180, height: 760 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => document.getElementById("toasts").replaceChildren()); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
async function until(page, fn, arg, tries = 400) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString());
}
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const rowNames = (page) => page.$$eval("#rows .fp-row .pl-listrow__title", (n) => n.map((x) => x.textContent));
async function search(page, q) {
  await page.fill("#search", q);
  await page.waitForTimeout(250);
  await until(page, () => !/taranıyor/.test(document.getElementById("listHead").textContent));
}

(async () => {
  await new Promise((r) => hub.listen(0, "127.0.0.1", r));
  const port = hub.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "File Pilot");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.fpDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await page.textContent(".fp-brand"), /PluginLabs\s*APPS/);
    assert.match(await page.textContent(".fp-product"), /File Pilot.*Dosya arama.*25/s);
    assert.match(await page.textContent("#detail"), /Hatırladığınız birkaç sözcükle/);
    await shot(page, "masaustu-00-karsilama.png");

    // 1) Klasör ekle → gerçek tarama
    setFile("folder.txt", docsRoot);
    await page.click("#addRoot");
    await until(page, () => /\d+ dosya ·/.test(document.getElementById("scanInfo").textContent));
    const st = await page.evaluate(() => window.fpDesktop.state());
    assert.deepEqual(st.roots, [docsRoot]);
    assert.equal(st.counts.files, 12, "node_modules ve .git hariç 12 dosya: " + JSON.stringify(st.counts));
    assert.equal(st.counts.text, 10);
    assert.equal(st.counts.nameOnly, 2, "pdf ve jpg yalnız adıyla");
    report.scan = st.counts;

    // 2) Ek ve aksan duyarsız arama + eşleşen bölüm
    await search(page, "odeme tarihi");
    let names = await rowNames(page);
    assert.equal(names[0], "elektrik-kasim.txt", names.join(","));
    assert.ok(names.includes("dogalgaz-ekim.txt"));
    assert.match(await page.textContent("#listHead"), /sonuç · [\d,]+ ms/);
    const marks = await page.$$eval("#rows .fp-row.is-current mark", (m) => m.map((x) => x.textContent));
    assert.ok(marks.some((x) => /ödeme/i.test(x)) && marks.includes("tarihi"), marks.join(","));
    await until(page, () => !!document.querySelector("#detail .fp-line.is-hit"));
    const hitLine = await page.$eval("#detail .fp-line.is-hit .fp-line__n", (e) => e.textContent);
    assert.equal(hitLine, "4");
    assert.match(await page.textContent("#detail .fp-path"), /Faturalar.2026.elektrik-kasim\.txt$/);

    // 3) Etiket ekle → kenar çubuğunda görünür → #ev süzgeci
    await page.fill("#tagInput", "ev");
    await page.press("#tagInput", "Enter");
    await until(page, () => /#ev/.test(document.getElementById("tagNav").textContent));
    await search(page, "kombi");
    names = await rowNames(page);
    assert.equal(names[0], "kombi-servis-kayitlari.csv", names.join(","));
    await page.click("#rows .fp-row:nth-child(1)");
    await page.fill("#tagInput", "ev");
    await page.press("#tagInput", "Enter");
    await until(page, () => document.querySelectorAll("#detail .fp-tags .pl-tag").length === 1);
    await search(page, "#ev");
    assert.deepEqual((await rowNames(page)).sort(), ["elektrik-kasim.txt", "kombi-servis-kayitlari.csv"]);

    // 4) Tür süzgeci (çip), tam ifade, hariç, dosya adı, klasör yolu, RTF (1254) ve HTML içeriği
    await search(page, "kombi");
    await page.click("#kinds .pl-tag:nth-child(1)"); // Metin
    await page.waitForTimeout(250);
    names = await rowNames(page);
    assert.ok(names.length >= 2 && names.every((x) => /\.(txt|md)$/.test(x)), names.join(","));
    await page.click("#kinds .pl-tag:nth-child(1)");
    await search(page, '"son ödeme tarihi" -dogalgaz');
    assert.deepEqual(await rowNames(page), ["elektrik-kasim.txt"]);
    await search(page, "img 2041");
    assert.deepEqual(await rowNames(page), ["IMG_2041.jpg"]);
    assert.match(await page.textContent("#detail"), /içeriği okunmaz/);
    await search(page, "seyahat");
    assert.deepEqual((await rowNames(page)).sort(), ["izmir-rezervasyon.txt", "pasaport.pdf"]);
    await search(page, "sayin okan lisans");
    assert.equal((await rowNames(page))[0], "eski-yazisma.rtf");
    await search(page, "musteri memnuniyeti");
    assert.equal((await rowNames(page))[0], "rapor-taslak.html");
    await search(page, "izleme");
    assert.ok(!(await rowNames(page)).includes("rapor-taslak.html"), "betik içeriği indekslenmez");

    // 5) Benzer belge
    await search(page, "butce toplantisi");
    assert.equal((await rowNames(page))[0], "2026-10-14-butce.md");
    await until(page, () => document.querySelectorAll("#detail .fp-sim .fp-row").length > 0);
    const sim = await page.$$eval("#detail .fp-sim .pl-listrow__title", (n) => n.map((x) => x.textContent));
    assert.equal(sim[0], "2026-10-28-proje-gundemi.md", sim.join(","));

    // 6) Aç / klasörde göster / yolu kopyala (klavye ile)
    await search(page, "rezervasyon izmir");
    await page.press("#search", "Enter");
    await until(page, () => true);
    await page.waitForTimeout(200);
    assert.match(readLog("opened.txt"), /izmir-rezervasyon\.txt/);
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(200);
    assert.match(readLog("revealed.txt"), /izmir-rezervasyon\.txt/);
    await page.keyboard.press("Control+Shift+C");
    await toastHas(page, /yolu panoya/);
    assert.equal(await app.evaluate(({ clipboard }) => clipboard.readText()), path.join(docsRoot, "Seyahat", "izmir-rezervasyon.txt"));
    await page.keyboard.press("ArrowDown");

    // 7) MyMind: anahtar → soru → onay ayrıntısında yalnız ad + kısa bölüm → kaynağa bağlı yanıt
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await until(page, () => document.getElementById("mymindState").textContent === "Bağlı");
    await search(page, "fatura");
    await page.click("#askBtn");
    await page.fill("#askInput", "Elektrik faturasının son ödeme tarihi ne zaman?");
    await page.click("#askSend");
    await until(page, () => !document.getElementById("answer").hidden);
    const appr = readLog("approvals.txt");
    assert.match(appr, /elektrik-kasim\.txt/);
    assert.ok(!appr.includes(docsRoot), "onay metninde tam yol olmamalı");
    const sent = readLog("mymind-sent.json");
    assert.ok(sent.length > 0 && !sent.includes(docsRoot) && !sent.includes("Faturalar/2026") && !sent.includes("#ev"), "gönderilen veri azaltılmış olmalı");
    assert.equal(hubCalls, 1);
    const ans = await page.textContent("#answer");
    assert.match(ans, /15 Kasım 2026/);
    assert.match(ans, /elektrik-kasim\.txt · satır 4 — “Son ödeme tarihi: 15\.11\.2026”/);
    assert.match(ans, /alıntı doğrulanamadı/);
    await until(page, () => !!document.querySelector("#detail .fp-line.is-focus"));
    assert.equal(await page.$eval("#detail .fp-line.is-focus .fp-line__n", (e) => e.textContent), "4");
    await shot(page, "masaustu-02-mymind-yanit.png");
    // Ret: hiçbir şey gönderilmez
    setFile("deny.txt", "1");
    await page.click("#askBtn");
    await page.fill("#askInput", "Kombi bakımı kimin sorumluluğunda?");
    await page.click("#askSend");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 1);
    setFile("deny.txt", "0");

    // Ana ekran görüntüsü: arama + eşleşen bölüm + etiket + benzer belgeler
    await page.click("#answer .pl-btn");
    await search(page, "kombi bakimi");
    await shot(page, "masaustu-01-arama.png");

    // 8) Klasörler ve ayarlar görünümleri
    await page.click('[data-nav="folders"]');
    await until(page, () => /Toplam dosya/.test(document.getElementById("scanStats").textContent));
    assert.match(await page.textContent("#rootList"), /Belgelerim/);
    await shot(page, "masaustu-03-klasorler.png");
    await page.click('[data-nav="settings"]');
    assert.match(await page.inputValue("#excludes"), /node_modules/);
    await shot(page, "masaustu-04-ayarlar.png");
    // Hariç tutma ayarı + yeniden tarama: "Sağlık" klasörü çıkar
    await page.fill("#excludes", (await page.inputValue("#excludes")) + "\nSağlık");
    await page.click("#saveExcludes");
    await toastHas(page, /kaydedildi/);
    await page.click('[data-nav="folders"]');
    await page.click("#rescan");
    await toastHas(page, /11 dosya indekslendi/);
    await page.click('[data-nav="search"]');
    await search(page, "tahlil");
    assert.deepEqual(await rowNames(page), []);
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    await app.close();

    // 9) Yeniden açılış: indeks, etiketler ve ayarlar kalıcı; indeks dosyası (kasa varsa) şifreli
    ({ app, page, violations } = await launch(port));
    const files = fs.readdirSync(userData);
    report.vault = files.includes("indeks.bin");
    if (report.vault) assert.ok(!fs.readFileSync(path.join(userData, "indeks.bin")).includes(Buffer.from("Son ödeme")), "şifreli indeks düz metin içermemeli");
    else assert.ok(files.includes("indeks.json"));
    await until(page, () => /11 dosya ·/.test(document.getElementById("scanInfo").textContent));
    await search(page, "#ev");
    assert.equal((await rowNames(page)).length, 2);
    // Klasörü listeden çıkar: indeks boşalır, diskteki dosyalara dokunulmaz
    await page.click('[data-nav="folders"]');
    await page.click("#rootList .pl-btn");
    await toastHas(page, /dokunulmadı/);
    assert.equal((await page.evaluate(() => window.fpDesktop.state())).counts.files, 0);
    assert.deepEqual(snapshot(), before, "örnek klasördeki hiçbir dosya değişmemeli");
    assert.equal(violations.length, 0, "CSP/sayfa hatası: " + violations.join(" | "));
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify(report));
  } finally {
    await app.close().catch(() => {});
    hub.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
