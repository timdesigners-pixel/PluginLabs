// Masaüstü duman testi: gerçek Electron penceresi, gerçek içe aktarma (yapıştırma, örnek, .html dosyası), seçim → yerel açıklama,
// terimler, sorular, soru-cevap, anlaşılırlık puanı, Markdown dışa aktarma, gerçek kalıcılık ve yeniden açılış; MyMind için taklit Hub.
// TEST kipinde onaylar ve dosya seçimleri dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "rp-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "rp-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const KEY = "test-istemci-anahtari-1234567890";

// Taklit Hub: açıklama isteğine biri desteklenmeyen (alıntısı metinde yok) 4 iddialı yanıt; soru isteğine kaynaklı yanıt.
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const msg = ok ? JSON.parse(body).messages[1].content : "";
    const content = msg.startsWith("Soru:")
      ? JSON.stringify({ cevap: "Kullanıcı eskimiş veri görebilir; süre verinin değişme sıklığına göre seçilmelidir.", kaynak: [{ p: 3, alinti: "çok uzun tutulursa kullanıcı eskimiş veri görebilir" }], bilinmiyor: false })
      : "```json\n" + JSON.stringify({
        sade: "Önbelleğin ne kadar işe yaradığı isabet oranıyla ölçülür. TTL, bir kaydın ne kadar süre taze sayılacağını söyler; çok kısa olursa sunucu yorulur, çok uzun olursa eski bilgi görünür. Önbellek dolunca LRU gibi bir kural hangi kaydın silineceğine karar verir.",
        terimler: [
          { terim: "İsabet oranı", aciklama: "İsteklerin ne kadarının önbellekten karşılandığını gösteren pay.", p: 2, alinti: "isteklerin tüm isteklere oranı demektir" },
          { terim: "TTL", aciklama: "Bir kaydın önbellekte geçerli sayıldığı süre.", p: 3, alinti: "bir kaydın önbellekte ne kadar süre geçerli sayılacağını belirleyen süredir" },
          { terim: "CDN", aciklama: "İçeriği kullanıcıya yakın sunuculardan dağıtan ağ.", p: 3, alinti: "CDN içerikleri kullanıcıya yakın sunuculardan verir" },
        ],
        sorular: [{ soru: "LRU hangi kaydı önce siler?", cevap: "En uzun süredir kullanılmayan kaydı.", p: 4, alinti: "en uzun süredir kullanılmayan kayıt önce silinir" }],
        bilinmeyen: ["Metin, TTL için önerilen somut bir süre vermiyor."],
      }) + "\n```";
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
    env: { ...process.env, RP_USER_DATA: userData, RP_TEST_DIR: testDir, RP_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  page.on("dialog", (d) => d.accept());
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1240, height: 800 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.rpDesktop.state());
const text = (page, sel) => page.textContent(sel);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Read Partner");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.rpDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".rp-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".rp-product"), /Read Partner.*Okuma yardımcısı.*32/s);
    assert.ok(await page.isVisible("#readEmpty"), "ilk açılışta boş durum");
    await shot(page, "masaustu-00-ilk-acilis.png");

    // 1) Örnek metin: 6 paragraf, sayfa içi talimat uyarısı
    await page.click('#readEmpty [data-act="sample"]');
    await until(page, () => document.querySelectorAll(".rp-para").length === 6);
    assert.ok(await page.isVisible("#injWarn"));
    assert.match(await text(page, "#injWarn"), /1 sayfa içi talimat/);
    assert.equal(await page.locator(".rp-para.is-inj").count(), 1);
    assert.match(await text(page, "#readScore"), /Okunabilirlik \d+/);

    // 2) Seçim: ¶2, Shift+¶4 → Açıkla
    await page.click('.rp-pno[data-p="2"]');
    await page.click('.rp-pno[data-p="4"]', { modifiers: ["Shift"] });
    assert.match(await text(page, "#selLabel"), /¶2–4/);
    assert.equal(await page.locator(".rp-para.is-sel").count(), 3);
    await page.click("#explainBtn");
    await toastHas(page, /¶2–4 açıklandı/);
    await until(page, () => document.querySelectorAll(".rp-sent").length >= 5);
    assert.ok(await page.locator(".rp-sent:not(.is-same)").count() >= 1, "en az bir cümle sadeleşmeli");
    report.sadeCumle = await page.locator(".rp-sent").count();
    await shot(page, "masaustu-01-yan-yana-sadelestirme.png");

    // 3) Terimler: TTL açılımı ¶3, kullanıcı terimi (metinde tanım / bilinmiyor)
    await page.click('[data-tab="terms"]');
    await until(page, () => /TTL/.test(document.getElementById("tabBody").textContent));
    const terms = await text(page, "#tabBody");
    assert.match(terms, /TTL.*= Time To Live.*açılım.*¶3/s);
    assert.match(terms, /LRU.*Least Recently Used/s);
    await page.fill("#termInput", "isabet oranı");
    await page.click('#termForm button[type="submit"]');
    await until(page, () => /isabet oranı.*metindeki tanım/s.test(document.getElementById("tabBody").textContent));
    await page.fill("#termInput", "kuantum");
    await page.click('#termForm button[type="submit"]');
    await until(page, () => /kuantum.*bilinmiyor — metinde tanım yok/s.test(document.getElementById("tabBody").textContent));
    await shot(page, "masaustu-02-terimler.png");
    // Kaynağa git: ¶ bağlantısı paragrafı vurgular
    await page.click('#tabBody .rp-ref >> text="¶3"');
    await until(page, () => document.querySelector('.rp-para[data-p="3"]').classList.contains("is-flash"));

    // 4) Sorular: 3 soru, yanıtı göster
    await page.click('[data-tab="questions"]');
    await until(page, () => document.querySelectorAll("#tabBody .rp-q").length === 3);
    await page.click("#tabBody .rp-q details summary");
    assert.ok(await page.locator("#tabBody .rp-q details[open]").count() === 1);
    // Anlaşılırlık puanı
    await page.click('.rp-star[aria-label="5 / 5"]');
    await toastHas(page, /5\/5 kaydedildi/);
    await shot(page, "masaustu-03-anlama-sorulari.png");

    // 5) Soru sor: bulunan ve bulunmayan (bilinmiyor)
    await page.click('[data-tab="ask"]');
    await page.fill("#askInput", "Önbellek kaç para eder?");
    await page.click('#askForm button[type="submit"]');
    await until(page, () => /bilinmiyor.*yanıtlanamıyor.*para, eder/s.test(document.getElementById("tabBody").textContent));
    await page.fill("#askInput", "TTL uzun tutulursa ne olur?");
    await page.click('#askForm button[type="submit"]');
    await until(page, () => /metinde bulundu/.test(document.getElementById("tabBody").textContent));
    assert.equal(await page.textContent("#tabBody .rp-hit .rp-ref"), "¶3");
    await shot(page, "masaustu-04-soru-cevap.png");

    // 6) MyMind: anahtar yokken diyalog; anahtar; reddedilen onay; onaylı açıklama (yalnız seçili paragraflar), alıntı denetimi
    await page.click('[data-tab="simple"]');
    await page.click("#aiBtn");
    await until(page, () => document.getElementById("mymindDialog").open);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await until(page, () => document.getElementById("mymindState").textContent === "Bağlı");
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0, "reddedilen onayda Hub'a istek gitmemeli");
    setFile("deny.txt", "0");
    await page.click('[data-level="baslangic"]');
    await page.click("#aiBtn");
    await toastHas(page, /MyMind açıklaması hazır — 1 açıklama kaynakta bulunamadı/);
    const approvals = readLog("approvals.txt");
    assert.match(approvals, /Seçili paragraflar: ¶2–4/);
    assert.match(approvals, /Seviye: Başlangıç/);
    assert.match(approvals, /tarama geçmişi gönderilmez/);
    const sent = readLog("mymind-sent.json").trim().split("\n").pop();
    assert.ok(sent.includes("[p2]") && sent.includes("[p4]") && !sent.includes("[p1]") && !sent.includes("[p6]"), "yalnız seçili paragraflar gitmeli");
    assert.ok(!sent.includes(KEY), "anahtar içerikte olmamalı");
    assert.match(await text(page, "#tabBody .rp-ai"), /MyMind sade anlatım.*1\/4 desteklenmeyen.*Metinden çıkarılamayan/s);
    await page.click('[data-tab="terms"]');
    await until(page, () => /CDN.*desteklenmeyen — kaynakta bulunamadı/s.test(document.getElementById("tabBody").textContent));
    await shot(page, "masaustu-05-mymind-alinti-denetimi.png");
    // MyMind'a soru
    await page.click('[data-tab="ask"]');
    await page.fill("#askInput", "TTL uzun tutulursa ne olur?");
    await page.click("#askAi");
    await until(page, () => /MyMind yanıtı.*eskimiş veri.*kaynakta var/s.test(document.getElementById("tabBody").textContent));

    // 7) Kitaplık: yapıştırma ve .html dosyası
    await page.click('[data-nav="library"]');
    await page.fill("#pasteTitle", "Fotosentez notları");
    await page.fill("#pasteText", "Fotosentez, bitkilerin ışık enerjisini kimyasal enerjiye dönüştürmesidir. Bu süreç kloroplastlarda gerçekleşir.\n\nKlorofil, ışığı soğuran yeşil pigment demektir. Işık tepkimeleri tilakoit zarlarında olur.\n\nCalvin döngüsü (karbon tutma) stromada gerçekleşir ve 3 karbonlu şekerler üretir.");
    await page.click('#pasteForm button[type="submit"]');
    await toastHas(page, /Fotosentez notları.*eklendi: 3 paragraf/);
    assert.ok(await page.isVisible("#view-read"));
    const html = path.join(testDir, "makale.html");
    fs.writeFileSync(html, "<!doctype html><html><head><title>Web makalesi</title><script>window.hacked=1</script></head><body><nav>Menü</nav><article><h1>Başlık</h1><p>Birinci paragraf &amp; içerik.</p><p>İkinci paragraf <a href='https://ornek.com'>bağlantı</a> ile.</p></article></body></html>");
    setFile("pick.txt", html);
    await page.click('[data-nav="library"]');
    await page.click('#view-library [data-act="openFile"]');
    await toastHas(page, /Web makalesi.*açıldı: 3 paragraf/);
    assert.equal(await page.evaluate(() => window.hacked), undefined, "belgedeki betik çalışmamalı");
    assert.ok(!/Menü/.test(await text(page, "#doc")));
    await page.click('[data-nav="library"]');
    assert.equal(await page.locator(".rp-docrow").count(), 3);
    await shot(page, "masaustu-06-kitaplik.png");

    // 8) Örnek belgeye dön, Markdown dışa aktar
    await page.click('.rp-docrow:has-text("Önbellek nasıl çalışır?") >> text="Oku"');
    await until(page, () => document.querySelectorAll(".rp-para").length === 6);
    await page.click('[data-act="exportMd"]');
    await toastHas(page, /2 açıklama Markdown olarak kaydedildi/);
    const md = fs.readFileSync(path.join(testDir, "disari.md"), "utf8");
    assert.match(md, /## ¶2–4 · Yerel · Orta · anlaşılırlık 5\/5/);
    assert.match(md, /## ¶2–4 · MyMind · Başlangıç/);
    assert.match(md, /⚠ desteklenmeyen/);

    // 9) Ayarlar ve ölçüler
    await page.click('[data-nav="settings"]');
    const metrics = await text(page, "#metrics");
    assert.match(metrics, /5\/5/);
    assert.match(metrics, /%100/);
    assert.match(metrics, /desteklenmeyen iddia \(1\/5\)/);
    assert.match(metrics, /3sorulan soru/);
    await page.selectOption("#setFont", "18");
    await until(page, () => getComputedStyle(document.documentElement).getPropertyValue("--rp-font").trim() === "18px");
    await shot(page, "masaustu-07-ayarlar-olculer.png");
    const st = await state(page);
    report.stats = st.stats;
    report.vault = st.vault;
    assert.equal(st.docs.length, 3);
    assert.equal(st.stats.questionsAsked, 3);
    assert.equal(st.stats.unanswered, 1);
    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    await app.close();

    // 10) Yeniden açılış: kitaplık, açıklamalar, puan ve ayarlar kalıcı; anahtar diske düz yazılmaz
    const files = fs.readdirSync(userData);
    report.files = files.filter((f) => /okumalar|mymind/.test(f));
    const plain = files.includes("okumalar.json") ? fs.readFileSync(path.join(userData, "okumalar.json"), "utf8") : "";
    if (st.vault) assert.ok(files.includes("okumalar.bin") && !files.includes("okumalar.json"), "kasa varken düz dosya olmamalı");
    assert.ok(!plain.includes(KEY), "anahtar düz kayıtta olmamalı");
    ({ app, page, violations } = await launch(port));
    const st2 = await state(page);
    assert.equal(st2.docs.length, 3);
    assert.equal(st2.current.title, "Önbellek nasıl çalışır?");
    assert.equal(st2.current.explanations.length, 2);
    assert.equal(st2.current.explanations[0].rating, 5);
    assert.equal(st2.settings.fontSize, 18);
    await until(page, () => document.querySelectorAll(".rp-sent").length >= 1 || /MyMind/.test(document.getElementById("tabBody").textContent));
    assert.deepEqual(violations, []);
    console.log(JSON.stringify(report));
    console.log("DUMAN TESTİ GEÇTİ: Read Partner (" + process.platform + ") — örnek + yapıştırma + .html içe aktarma, seçim → sadeleştirme/terimler/3 soru, soru-cevap (bilinmiyor dahil), puan, MyMind (onay, red, yalnız seçili paragraflar, alıntı denetimi), dışa aktarma, kalıcılık");
  } catch (e) {
    console.error("DUMAN TESTİ BAŞARISIZ:", e);
    if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await app.close().catch(() => {});
    server.close();
  }
})();
