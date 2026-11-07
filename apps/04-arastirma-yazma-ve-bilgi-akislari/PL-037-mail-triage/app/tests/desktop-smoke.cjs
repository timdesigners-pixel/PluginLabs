// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek gelen kutusu (elle etiketli), .eml + .mbox içe aktarma
// (Windows-1254, kopya Message-ID atlanır, kaynak dosyalar değişmez), kaynağı yapıştırma, öneri kabul/düzeltme, önemli işareti,
// süzgeçler ve arama, yanıt taslağı (şablon, düzenleme, panoya kopya; gönderim yok), MyMind (taklit Hub: anahtar, red, onay, adların
// ve adreslerin gitmemesi, Düşük önerisinin engellenmesi, düzenlenen taslağın ezilmemesi), toplu değişiklik önizlemesi (uyarı) ve
// uygulama, ölçüler, yerel model (loopback; dış adres reddi), CSV/MD dışa aktarma, arşiv, izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ml-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ml-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";

// İçe aktarılacak dosyalar: Windows-1254 quoted-printable .eml ve iki iletili .mbox (biri örnekteki k1 ile aynı Message-ID).
const emlPath = path.join(testDir, "tedarikci.eml");
fs.writeFileSync(emlPath, Buffer.from("From: =?windows-1254?Q?Tedarik=E7i_=DEirketi?= <satis@tedarikci-ornek.com>\r\nTo: elif@ornekfirma.com.tr\r\nSubject: =?windows-1254?Q?=DEartname_g=FCncellemesi?=\r\nDate: Thu, 05 Nov 2026 16:40:00 +0300\r\nMessage-ID: <t1@tedarikci-ornek.com>\r\nContent-Type: text/plain; charset=windows-1254\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nElif Han=FDm, g=FCncel =FEartnameyi inceleyip onay=FDn=FDz=FD iletebilir misiniz?\r\n", "latin1"));
const mboxPath = path.join(testDir, "arsiv.mbox");
fs.writeFileSync(mboxPath, "From x@y Thu Nov  5 10:00:00 2026\nFrom: Haber Bülteni <bulten@haber-ornek.com>\nTo: elif@ornekfirma.com.tr\nSubject: Haftanın öne çıkanları\nDate: Thu, 05 Nov 2026 08:00:00 +0300\nMessage-ID: <h1@haber-ornek.com>\nList-Unsubscribe: <https://haber-ornek.com/cik>\nContent-Type: text/plain; charset=utf-8\n\nBu haftanın en çok okunan yazıları.\n\nFrom x@y Thu Nov  5 11:00:00 2026\nFrom: Murat Şen <murat.sen@musteri-a.com.tr>\nTo: elif@ornekfirma.com.tr\nSubject: Teklif revizyonu hakkında\nDate: Fri, 06 Nov 2026 09:12:00 +0300\nMessage-ID: <k1@musteri-a.com.tr>\nContent-Type: text/plain; charset=utf-8\n\nKopya ileti.\n");
const before = { eml: sha(emlPath), mbox: sha(mboxPath) };

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    const content = "```json\n" + JSON.stringify({ etiketler: ["yanit", "spam"], oncelik: "dusuk", neden: "[Gönderen] revize teklif bekliyor", eylemler: ["Revize teklifi hazırlayıp gönder"], tarih: "cuma", yanit_taslagi: "Merhaba [Gönderen], revize teklifi cuma günü ileteceğim. [Alıcı]" }) + "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, ML_USER_DATA: userData, ML_TEST_DIR: testDir, ML_HUB_URL: "http://127.0.0.1:" + port } });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => document.getElementById("toasts").replaceChildren()); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.mlDesktop.state());
const text = (page, sel) => page.textContent(sel);
const rows = (page) => page.locator("#list .ml-row-item").count();
const idOf = async (page, subj) => (await state(page)).mails.find((m) => m.subject === subj).id;
const openMail = async (page, subj) => { const id = await idOf(page, subj); await page.click(`#list .ml-row-item[data-id="${id}"]`); await until(page, (i) => !!document.querySelector(`#list .ml-row-item.is-sel[data-id="${i}"]`), id); return id; };
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Mail Triage");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".ml-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".ml-product"), /Mail Triage.*Posta önceliği.*37/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek gelen kutusu: öneriler, gerekçeler, sıralama
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /12 ileti eklendi · örnek adresler ve önemli alan ayarlara yazıldı/);
    await until(page, () => document.querySelectorAll("#list .ml-row-item").length === 12);
    let s = await state(page);
    assert.deepEqual(s.settings.myAddresses, ["elif@ornekfirma.com.tr"]);
    assert.equal(s.gold.labelPrecision, 100);
    assert.equal(s.gold.importantLow, 0);
    assert.match(await text(page, "#list .ml-row-item:first-child"), /Yüksek/);
    assert.match(await text(page, "#detail"), /Teklif revizyonu hakkında/);
    assert.match(await text(page, "#detail .ml-why"), /önemli kişi\/alan listesinde/);
    assert.match(await text(page, "#detail .ml-extract"), /son tarih 13 kasım 2026/);
    await shot(page, "masaustu-01-gelen-kutusu.png");

    // 2) .eml + .mbox içe aktarma: Windows-1254, kopya atlanır, kaynak dosyalar değişmez
    setFile("pick.txt", emlPath + "\n" + mboxPath);
    await page.click('.ml-toolbar [data-act="import"]');
    await toastHas(page, /2 ileti eklendi · 1 kopya atlandı/);
    s = await state(page);
    const ted = s.mails.find((m) => m.subject === "Şartname güncellemesi");
    assert.ok(ted, "Windows-1254 konu çözülmeli");
    assert.equal(ted.from.name, "Tedarikçi Şirketi");
    assert.deepEqual(ted.suggested.labels, ["yanit"]);
    assert.equal(s.mails.find((m) => m.subject === "Haftanın öne çıkanları").suggested.priority, "dusuk");
    assert.equal(sha(emlPath), before.eml);
    assert.equal(sha(mboxPath), before.mbox);
    rmFile("pick.txt");

    // 3) Kaynağı yapıştır (Unicode metin) ve geçersiz metin reddi
    await page.click('.ml-toolbar [data-act="paste"]');
    await page.fill("#pasteText", "Bu bir e-posta değil, sadece not.");
    await page.click("#pasteRun");
    await toastHas(page, /kaynağına benzemiyor/);
    await page.fill("#pasteText", "From: Gülşen Ünal <gulsen@ornekfirma.com.tr>\nTo: elif@ornekfirma.com.tr\nSubject: Öğle yemeği planı\nDate: Fri, 06 Nov 2026 11:00:00 +0300\nMessage-ID: <p1@ornekfirma.com.tr>\n\nYarın öğlen birlikte yiyelim mi? Çarşı tarafında yeni bir yer açılmış.");
    await page.click("#pasteRun");
    await toastHas(page, /1 ileti eklendi/);
    assert.equal(await rows(page), 15);
    assert.match(await text(page, "#detail"), /Öğle yemeği planı/);
    assert.match(await text(page, "#detail"), /Gülşen Ünal/);

    // 4) Süzgeçler ve arama
    await page.click('[data-prio="dusuk"]');
    await until(page, () => document.querySelectorAll("#list .ml-row-item").length === 4);
    await page.click('[data-prio="all"]');
    await page.fill("#q", "kargo");
    await until(page, () => document.querySelectorAll("#list .ml-row-item").length === 1);
    await page.fill("#q", "");
    await page.selectOption("#labelFilter", "fatura");
    await until(page, () => document.querySelectorAll("#list .ml-row-item").length === 2);
    await page.selectOption("#labelFilter", "");

    // 5) Kabul ve düzeltme: k1 kabul; Q4 bilgisi Yüksek + önemli; kampanya iletisine etiket ekle
    await openMail(page, "Teklif revizyonu hakkında");
    await page.click("#acceptBtn");
    await toastHas(page, /Öneri kabul edildi/);
    await openMail(page, "Bilgi: Q4 raporu paylaşıldı");
    await page.click('#detail [data-setprio="yuksek"]');
    await until(page, () => /düzeltildi/.test(document.getElementById("detail").textContent));
    await page.check("#impBox");
    await openMail(page, "Kasım 2026 elektrik faturanız");
    await page.click('#detail .ml-chip[data-label="yanit"]');
    await until(page, () => document.querySelector('#detail .ml-chip[data-label="yanit"]').classList.contains("is-on"));
    s = await state(page);
    assert.equal(s.metrics.reviewed, 3);
    assert.equal(s.metrics.labelAdded, 1);

    // 6) Yanıt taslağı: şablon → düzenleme → panoya kopya (gönderim yok)
    await openMail(page, "Teklif revizyonu hakkında");
    await page.click("#draftBtn");
    await toastHas(page, /Taslak hazırlandı/);
    assert.match(await page.inputValue("#draftText"), /^Merhaba Murat,/);
    await page.fill("#draftText", "Merhaba Murat Bey,\n\nRevize teklifi perşembe günü paylaşacağım.\n\nElif");
    await page.press("#draftText", "Tab");
    await page.click("#copyDraftBtn");
    await toastHas(page, /Taslak panoya kopyalandı/);
    assert.match(await clipRead(app), /perşembe günü paylaşacağım/);

    // 7) MyMind: anahtar, red, onay; adlar/adresler/telefon gitmez; Düşük önerisi engellenir; düzenlenen taslak ezilmez
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    assert.match(readLog("approvals.txt"), /Kişi adları \[Gönderen\] \/ \[Alıcı\] olarak/);
    assert.match(readLog("approvals.txt"), /1 telefon ⟦n⟧ yer tutucusuyla/);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi hazır \(önem işareti olduğu için Düşük önerisi Normal'e yükseltildi\); 1 bilinmeyen etiket/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    for (const secret of ["Murat", "Elif", "musteri-a", "murat.sen@", "0532", "ornekfirma"]) assert.ok(!sent.includes(secret), secret + " gönderilmemeli");
    assert.match(await text(page, "#detail .ml-ai"), /MyMind önerisi.*Normal.*Yanıt bekliyor/s);
    assert.match(await text(page, "#detail .ml-ai"), /Murat revize teklif bekliyor/);
    assert.match(await page.inputValue("#draftText"), /perşembe günü/, "elle düzenlenen taslak ezilmemeli");
    await shot(page, "masaustu-03-mymind-ve-yanit-taslagi.png");
    await page.click("#detail .ml-ai button");
    await toastHas(page, /MyMind önerisi uygulandı/);
    s = await state(page);
    assert.equal(s.mail.final.priority, "normal");
    report.mymind = { calls: hubCalls, counters: s.counters.aiClamped };

    // 8) Toplu değişiklik önizlemesi: uyarı ve uygulama
    for (const subj of ["Siparişiniz kargoya verildi", "Haftalık etkinlik özetiniz", "ACİL: sunum dosyası"]) {
      const id = await idOf(page, subj);
      await page.check(`#list .ml-row-item[data-id="${id}"] input[type=checkbox]`);
    }
    assert.equal(await text(page, "#selCount"), "3");
    await page.click('[data-nav="bulk"]');
    await page.selectOption("#bulkPrio", "dusuk");
    await page.selectOption("#bulkAdd", "bildirim");
    await page.click("#bulkPreviewBtn");
    await until(page, () => document.querySelectorAll("#bulkTable .ml-prow:not(.ml-prow--head)").length === 3);
    assert.ok(await page.isVisible("#bulkWarn"));
    assert.match(await text(page, "#bulkWarn"), /1 önemli işaretli ileti/);
    await shot(page, "masaustu-02-toplu-degisiklik-onizleme.png");
    await page.click("#bulkApplyBtn");
    await toastHas(page, /ileti güncellendi \(yalnız bu uygulamada; posta kutusu değişmedi\)/);
    s = await state(page);
    assert.equal(s.mails.find((m) => m.subject === "Haftalık etkinlik özetiniz").final.labels.join(), "bulten,bildirim");
    assert.equal(await text(page, "#selCount"), "0");

    // 9) Seçilenlerin önerisini kabul et
    await page.click('[data-prio="dusuk"]');
    await page.check("#selAll");
    await page.click("#acceptSelBtn");
    await toastHas(page, /iletinin önerisi kabul edildi/);
    await page.click('[data-prio="all"]');

    // 10) Ölçüler ve ayarlar; yerel model yalnız loopback
    await page.click('[data-nav="settings"]');
    s = await state(page);
    report.metrics = { labelAcceptance: s.metrics.labelAcceptance, wrongLowRate: s.metrics.wrongLowRate, reviewed: s.metrics.reviewed, gold: s.gold };
    assert.match(await text(page, "#metrics"), /etiket kabulü/);
    assert.match(await text(page, "#goldInfo"), /etiket kesinliği %100/);
    await shot(page, "masaustu-04-olculer-ayarlar.png");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://example.com:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="inbox"]');
    await openMail(page, "Şartname güncellemesi");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi hazır/);
    assert.equal(hubCalls, 2);
    assert.match(readLog("approvals.txt"), /Yerel model \(http:\/\/127\.0\.0\.1:\d+, test-model\)/);
    assert.match(await page.inputValue("#draftText"), /^Merhaba Tedarikçi,|^Merhaba ,|revize teklifi/, "MyMind taslağı boş taslağa yazılır");

    // 11) Adres ayarı değişince öneriler yenilenir, kararlar korunur
    await page.click('[data-nav="settings"]');
    await page.fill("#setVip", "@musteri-a.com.tr, @tedarikci-ornek.com");
    await page.click("#saveAddr");
    await toastHas(page, /öneriler yeniden hesaplandı/);
    s = await state(page);
    assert.equal(s.mails.find((m) => m.subject === "Şartname güncellemesi").suggested.priority, "yuksek");
    assert.equal(s.mails.find((m) => m.subject === "Bilgi: Q4 raporu paylaşıldı").final.priority, "yuksek");

    // 12) Dışa aktarma
    await page.click("#csvBtn");
    await toastHas(page, /mail-triage\.csv” kaydedildi \(15 ileti\)/);
    await page.click("#mdBtn");
    await toastHas(page, /gelen-kutusu-ozeti\.md/);
    const csv = fs.readFileSync(path.join(testDir, "mail-triage.csv"), "utf8");
    assert.equal(csv.trim().split("\r\n").length, 16);
    assert.match(fs.readFileSync(path.join(testDir, "gelen-kutusu-ozeti.md"), "utf8"), /## Yüksek öncelik/);

    // 13) Arşiv (silme yok)
    await page.click('[data-nav="inbox"]');
    await openMail(page, "Öğle yemeği planı");
    await page.click("#detail button:has-text('Arşivle')");
    await toastHas(page, /arşivlendi/);
    assert.equal(await rows(page), 14);
    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snap = await state(page);
    await app.close();

    // 14) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.mails.length, 15);
    assert.equal(s.mails.filter((m) => m.archived).length, 1);
    assert.equal(s.metrics.reviewed, snap.metrics.reviewed);
    assert.equal(s.settings.provider, "yerel");
    report.vault = s.vault;
    if (s.vault) assert.ok(!fs.readFileSync(path.join(userData, "gelen-kutusu.bin"), "latin1").includes("Teklif"));
    assert.equal(sha(emlPath), before.eml);
    assert.deepEqual(violations, []);
    await app.close();
    console.log(JSON.stringify(report, null, 2));
    console.log("DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform + " · electron " + require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version);
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
