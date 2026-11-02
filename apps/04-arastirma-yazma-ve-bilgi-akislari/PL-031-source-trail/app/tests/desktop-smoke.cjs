// Masaüstü duman testi: gerçek Electron penceresi; örnek proje, iddia durumları ve kopya kaynağın bağımsız sayılmaması, eksik etiketi ile %100 ölçütü,
// gerçek panodan yakalama, kopya uyarısı, kaynakta olmayan alıntının reddi, dış bağlantı (yalnız http(s), yerel ağ reddi), kaynakça (APA/MLA/BibTeX/CSL/Markdown;
// panoya ve dosyaya), MyMind (taklit Hub: onay, red, veri azaltma, uydurma alıntının atılması, taslağı uygulama), arşivleme/geri alma ve kalıcılık.
// TEST kipinde onaylar, dosya seçimleri ve dış bağlantılar dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "st-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "st-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";

// Taklit Hub: S1 için kaynak metninden aynen alınmış alıntıyla "destekler", S2 için uydurma alıntıyla "destekler", S3 için "bağlam".
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    let content = "";
    if (ok) {
      const user = JSON.parse(body).messages[1].content;
      const q1 = /<kaynak id="S1"[^>]*>\n([\s\S]*?)\n<\/kaynak>/.exec(user)[1];
      content = "```json\n" + JSON.stringify({ karsilastirma: [
        { kaynak: "S1", iliski: "destekler", alinti: q1.slice(q1.indexOf("odaklanma"), q1.indexOf("bildirdi") + 8), gerekce: "Katılımcıların çoğu odaklanmanın arttığını bildiriyor." },
        { kaynak: "S2", iliski: "destekler", alinti: "çalışanların tamamı evde daha verimli", gerekce: "Haber destekliyor." },
        { kaynak: "S3", iliski: "baglam", alinti: "", gerekce: "Kesintisiz çalışma bloklarından söz ediyor." },
      ], ozet: "İddia öz bildirimle destekleniyor; nesnel ölçüm dolaylı." }) + "\n```";
    }
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  // CSP 'unsafe-eval' içermediği için waitForFunction kullanılmaz; yoklama ile beklenir.
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, ST_USER_DATA: userData, ST_TEST_DIR: testDir, ST_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1280, height: 820 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.stDesktop.state());
const text = (page, sel) => page.textContent(sel);
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());
const nav = (page, v) => page.click(`[data-nav="${v}"]`);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Source Trail");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.stDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".st-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".st-product"), /Source Trail.*Kanıt izi arşivin.*31/s);
    assert.match(await text(page, "#claimDetail"), /eksik kanıt/);

    // 1) Örnek proje: 4 iddia, kopya kaynak bağımsız sayılmaz, ölçüt %75
    await nav(page, "biblio");
    await page.click('[data-act="sample"]');
    await toastHas(page, /Örnek proje eklendi/);
    await until(page, () => document.querySelectorAll("#claimList [data-claim]").length === 4);
    assert.match(await text(page, "#sideInfo"), /%75/);
    const d1 = await text(page, "#claimDetail");
    assert.match(d1, /Kanıtlı \(≥2 bağımsız kaynak\)/);
    assert.match(d1, /başka bir destekleyen kaynağın kopyası; bağımsız doğrulama sayılmadı/);
    assert.match(d1, /kopya grubu: 2/);
    assert.equal(await page.locator("#claimDetail .st-link").count(), 3);
    await shot(page, "masaustu-01-iddia-ve-kanitlar.png");
    await page.click('[data-claim="ornek-c2"]');
    assert.match(await text(page, "#claimDetail"), /Kaynaklar çelişiyor/);

    // 2) Kaynaksız iddia → açık eksik etiketi → %100
    await page.click('[data-claim="ornek-c4"]');
    assert.match(await text(page, "#claimDetail"), /erişilebilir kayıtlı kaynağı da, eksik etiketi de yok/);
    await page.check("#missingChk");
    await page.fill("#missingNote", "Kira gideri verisi aranıyor.");
    await page.click('button:has-text("Etiketi kaydet")');
    await toastHas(page, /Eksik kanıt etiketi kaydedildi/);
    await until(page, () => /%100/.test(document.getElementById("sideInfo").textContent));
    report.coverage = "%75 → %100 (eksik etiketi)";

    // 3) Gerçek panodan yakalama → yeni kaynak kartı; aynı adresin ikinci kaydı kopya uyarısı alır
    await clipWrite(app, "Başlık: Örnek: Ofis kira raporu\nAraştırmaya katılan şirketlerin yarısı hibrit düzene geçtikten sonra ofis alanını küçülttüğünü, ancak toplam kira giderinin bölgeye göre çok değiştiğini bildirdi.\nhttps://www.example.org/kira/rapor?utm_source=bulten#ozet");
    await nav(page, "sources");
    await page.click('[data-act="capture"]');
    await toastHas(page, /Panodan alındı \(adres: example\.org\)/);
    assert.equal(await page.inputValue("#fTitle"), "Örnek: Ofis kira raporu");
    assert.match(await page.inputValue("#fQuote"), /ofis alanını küçülttüğünü/);
    assert.equal(await page.inputValue("#fAccessed"), await page.evaluate(() => window.STCore.today()));
    await page.fill("#fAuthors", "Örnek Emlak Kurumu");
    await page.selectOption("#fType", "rapor");
    await page.click('#sourceForm button[type="submit"]');
    await toastHas(page, /Kaynak kartı kaydedildi/);
    await clipWrite(app, "aynı rapor, başka bağlantı\nhttp://example.org/kira/rapor/");
    await page.click('[data-act="capture"]');
    await toastHas(page, /Panodan alındı/);
    await page.fill("#fTitle", "Örnek: Kira raporu (paylaşım)");
    await page.click('#sourceForm button[type="submit"]');
    await toastHas(page, /aynı adres\/metin; bağımsız kaynak sayılmaz/);
    assert.match(await text(page, "#sourceBadges"), /kopya: aynı adres/);
    assert.ok(await page.locator("#sourceList .pl-badge--warning", { hasText: "kopya grubu" }).count() >= 4);
    await page.click('[data-source="ornek-s3"]');
    assert.equal(await page.inputValue("#fAuthors"), "Kaya, Elif; Demir, Can");
    assert.match(await text(page, "#sourceUsedBy"), /Destekler: Evden çalışma/);
    await shot(page, "masaustu-02-kaynak-karti.png");

    // 4) Dış bağlantı: yalnız herkese açık http(s)
    await page.click('[data-act="openUrl"]');
    await toastHas(page, /Sistem tarayıcısında açıldı: example\.net/);
    assert.match(readLog("opened.txt"), /^https:\/\/example\.net\/dergi\/hibrit-verimlilik/);
    await page.fill("#fUrl", "http://192.168.1.10/panel");
    await page.click('[data-act="openUrl"]');
    await toastHas(page, /Yalnız herkese açık http\(s\)/);
    await page.fill("#fUrl", "https://example.net/dergi/hibrit-verimlilik");

    // 5) Yeni iddia; kaynakta olmayan alıntı reddedilir, aynen olan kabul edilir
    await nav(page, "claims");
    await page.fill("#newClaim", "Hibrit düzene geçen şirketler ofis alanını küçültür.");
    await page.keyboard.press("Control+Enter");
    await toastHas(page, /İddia eklendi/);
    const kira = (await state(page)).sources.find((s) => s.title === "Örnek: Ofis kira raporu");
    await page.selectOption("#linkSource", kira.id);
    await page.fill("#linkQuote", "şirketlerin tamamı ofislerini kapattı");
    await page.click("#linkAdd");
    await toastHas(page, /aynen bulunmuyor/);
    await page.fill("#linkQuote", "şirketlerin yarısı hibrit düzene geçtikten sonra ofis alanını küçülttüğünü");
    await page.click("#linkAdd");
    await toastHas(page, /Kaynak bağlandı/);
    assert.match(await text(page, "#claimDetail"), /Alıntı kaynak kartındaki metinde aynen var/);
    assert.match(await text(page, "#claimDetail"), /Tek bağımsız kaynak/);
    assert.equal((await state(page)).metrics.quoteRejects, 1);
    report.quote = "uydurma alıntı reddedildi, aynen olan kabul edildi";

    // 6) Kaynakça: APA önizleme, BibTeX panoya, CSL-JSON ve Markdown dosyaya
    await nav(page, "biblio");
    await page.click('[data-format="apa"]');
    const apa = await text(page, "#biblioPreview");
    assert.match(apa, /Kaya, E\., & Demir, C\. \(2024\)\. Örnek: Hibrit ekiplerde verimlilik ölçümü\./);
    assert.match(await text(page, "#biblioInfo"), /\d+ kaynak · proje: Örnek: Uzaktan çalışma/);
    await shot(page, "masaustu-03-kaynakca.png");
    await page.click('[data-format="bibtex"]');
    await page.click('[data-act="exportCopy"]');
    await toastHas(page, /BibTeX panoya kopyalandı/);
    assert.match(await clipRead(app), /@article\{kaya2024,/);
    await page.click('[data-format="csl"]');
    await page.click('[data-act="exportSave"]');
    await toastHas(page, /kaynakca-csl\.json kaydedildi/);
    assert.ok(Array.isArray(JSON.parse(fs.readFileSync(path.join(testDir, "out", "kaynakca-csl.json"), "utf8"))));
    await page.click('[data-format="md"]');
    await page.click('[data-act="exportSave"]');
    await toastHas(page, /kanit-izi\.md kaydedildi/);
    assert.match(fs.readFileSync(path.join(testDir, "out", "kanit-izi.md"), "utf8"), /Eksik kanıt: Kira gideri verisi aranıyor\./);
    await page.click('[data-act="backupExport"]');
    await toastHas(page, /Yedek kaydedildi/);

    // 7) MyMind: anahtar, red (hiçbir şey gitmez), onay (veri azaltılmış), uydurma alıntı atılır, taslak uygulanır
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await until(page, () => /Bağlı/.test(document.getElementById("mymindState").textContent));
    await nav(page, "claims");
    await page.click('[data-claim="ornek-c1"]');
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    setFile("deny.txt", "0");
    await page.click("#aiBtn");
    await toastHas(page, /Taslak hazır: 3 kaynak · 1 uydurma alıntı atıldı/);
    assert.equal(hubCalls, 1);
    const sent = readLog("mymind-sent.json");
    for (const bad of ["example.org", "example.com", "Deniz Yılmaz", "Öz bildirime", "Örnek: Uzaktan çalışma"]) assert.ok(!sent.includes(bad), "gönderilmemeli: " + bad);
    assert.match(readLog("approvals.txt"), /Adresler, yazarlar, notlarınız, proje adı ve diğer iddialar gönderilmez/);
    const ai = await text(page, ".st-ai");
    assert.match(ai, /önerilen alıntı kaynak metninde aynen bulunmadığı için atıldı/);
    assert.match(ai, /Özet \(taslak\)/);
    assert.equal(await page.locator('[data-ai="ornek-s1"] button:has-text("Uygula")').count(), 1);
    assert.equal(await page.locator('[data-ai="ornek-s2"] button:has-text("Uygula")').count(), 0, "uydurma alıntılı öneri uygulanamaz");
    await page.locator(".st-ai").scrollIntoViewIfNeeded();
    await shot(page, "masaustu-04-mymind-karsilastirma.png");
    await page.click('[data-ai="ornek-s1"] button:has-text("Uygula")');
    await toastHas(page, /Taslak ilişki bağa uygulandı/);
    const c1 = (await state(page)).claims.find((c) => c.id === "ornek-c1");
    assert.equal(c1.links.find((l) => l.sourceId === "ornek-s1").by, "mymind");
    report.mymind = "red→0 istek; onay→1 istek, URL/yazar/not/proje gitmedi; 1 uydurma alıntı atıldı; taslak uygulandı";

    // 8) Arşivle → kanıt sayılmaz; geri al
    await page.click('[data-claim="ornek-c1"] ');
    await page.click('#claimDetail [data-link="ornek-s3"] button:has-text("Kartı aç")');
    await page.click('[data-act="archiveSource"]');
    await toastHas(page, /Kaynak arşivlendi/);
    await nav(page, "claims");
    await page.click('[data-claim="ornek-c1"]');
    assert.match(await text(page, "#claimDetail"), /Tek bağımsız kaynak/);
    await page.click('#claimDetail [data-link="ornek-s3"] button:has-text("Kartı aç")');
    await page.click('[data-act="archiveSource"]');
    await toastHas(page, /Kaynak geri alındı/);

    await nav(page, "settings");
    assert.match(await text(page, "#metrics"), /%100/);
    await shot(page, "masaustu-05-olculer.png");
    assert.deepEqual(violations, []);

    // 9) Kalıcılık: yeniden açılışta kartlar ve ölçüt korunur
    const before = await state(page);
    await app.close();
    ({ app, page, violations } = await launch(port));
    const after = await state(page);
    assert.equal(after.claims.length, before.claims.length);
    assert.equal(after.sources.length, before.sources.length);
    assert.match(await text(page, "#sideInfo"), /%100/);
    assert.equal(after.metrics.aiApplied, 1);
    report.persist = "yeniden açılışta " + after.claims.length + " iddia / " + after.sources.length + " kaynak · kasa: " + (after.vault ? "var (şifreli)" : "yok (düz JSON)");
    await shot(page, "masaustu-00-ilk-acilis.png");
    assert.deepEqual(violations, []);
    console.log("DUMAN TESTİ GEÇTİ: " + Object.values(report).join(" · "));
  } catch (e) {
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    console.error(e);
    process.exitCode = 1;
  } finally {
    await app.close().catch(() => {});
    server.close();
  }
})();
