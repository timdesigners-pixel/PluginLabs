// Masaüstü duman testi: gerçek Electron penceresi; metin girişi (gizli veri uyarısı, dil tespiti), örnek belge + temsilî terim kümesi,
// yan yana tablo, MyMind (taklit Hub: anahtar, onay, red, korunan alan değerlerinin ve ilgisiz sözlük terimlerinin gitmemesi, eksik alan ve
// sözlük uyumsuzluğu işaretleri), elle düzeltme ile canlı sözlük denetimi, alternatif terim, kalite notu, yalnız sorunlu süzgeci,
// dışa aktarma (CSV/TMX/TXT/MD), gerçek pano (kopyala, parola benzeri metnin reddi, Ctrl+Shift+Space işlevi), sözlük ekle/CSV içe aktar,
// var olan çeviriyi hizalama, sözlük taslağı, bölüm birleştirme, yerel model (loopback; dış adres reddi), arşiv, ölçüler ve kalıcılık.
// TEST kipinde onaylar ve dosya seçimleri dosya üzerinden yürür. Linux'ta xvfb gerekir; Windows'ta doğrudan çalışır.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "pt-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "pt-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";

// Taklit model: örnek belgenin bölümleri için hazır İngilizce şablonlar ($1, $2 = o bölümdeki yer tutucular sırasıyla).
// Bilerek: 4. bölümde "business day" yerine "working day" (sözlük uyumsuzluğu), 9. bölümde ⟦n⟧ düşürülür (eksik korunan alan).
const TEMPLATES = [
  ["Hizmet Sözleşmesi Özeti", "Service Agreement Summary"],
  ["Bu özet", "This summary explains the main clauses of the agreement between Ayşe Demir and the PluginLabs Hub service.", [{ terim: "clauses", secenekler: ["provisions", "terms"], aciklama: "Hukuki metinde “provisions” daha yaygındır." }]],
  ["yürürlüğe girer", "The agreement takes effect on $1 and is valid for $2 months."],
  ["hizmet bedeli", "The monthly service fee is $1 and is invoiced on the first working day of each month.", [], "“iş günü” için sözlükte business day var."],
  ["gecikme faizi", "Late payment interest of $1 applies to late payments."],
  ["Taraflar", "- The parties comply with the confidentiality obligation."],
  ["Kişisel veriler", "- Personal data is processed only to provide the service."],
  ["Destek talepleri", "- Support requests are answered on weekdays between $1 and $2."],
  ["feshi", "Termination of the agreement requires written notice days in advance."],
  ["Fesih bildirimini", "You can send the termination notice to $1."],
  ["Taraflar sözleşmeyi", "The parties sign the agreement."],
];
let hubCalls = 0;
const seen = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const j = JSON.parse(body || "{}");
    const auth = req.headers.authorization;
    const ok = req.url === "/v1/chat/completions" && (auth === "Bearer " + KEY || (!auth && j.model === "test-model"));
    seen.push({ auth: !!auth, model: j.model });
    let content = "";
    if (ok) {
      const user = j.messages[1].content;
      const items = JSON.parse(/<bolumler>\n([\s\S]*)\n<\/bolumler>/.exec(user)[1]);
      content = "```json\n" + JSON.stringify({ bolumler: items.map((it) => {
        const t = TEMPLATES.slice().reverse().find(([k]) => it.metin.includes(k));
        const ph = it.metin.match(/⟦\d+⟧/g) || [];
        if (!t) return { i: it.i, ceviri: "EN " + it.metin };
        return { i: it.i, ceviri: t[1].replace(/\$(\d)/g, (_, k) => ph[k - 1] || ""), alternatifler: t[2] || [], not: t[3] || "" };
      }) }) + "\n```";
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
    env: { ...process.env, PT_USER_DATA: userData, PT_TEST_DIR: testDir, PT_HUB_URL: "http://127.0.0.1:" + port },
  });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1320, height: 840 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.replaceChildren(); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.ptDesktop.state());
const text = (page, sel) => page.textContent(sel);
const row = (k) => `#rows .pt-seg:nth-child(${k})`;
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);
const clipRead = (app) => app.evaluate(({ clipboard }) => clipboard.readText());

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Parallel Translate");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined", "Node/Electron sayfaya sızmamalı");
    assert.equal(await page.evaluate(() => window.ptDesktop.platform), process.platform);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.match(await text(page, ".pt-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".pt-product"), /Parallel Translate.*Yan yana çeviri.*34/s);
    assert.ok(await page.isVisible("#startPanel"));

    // 1) Metin girişi: dil tespiti, gizli veri uyarısı
    await page.fill("#input", "The parties shall sign the agreement. Payment to IBAN TR33 0006 1005 1978 6457 8413 26 is due.");
    await until(page, () => /İngilizce · 2 bölüm/.test(document.getElementById("inLang").textContent));
    assert.ok(await page.isVisible("#sensWarn"));
    assert.match(await text(page, "#sensWarn"), /1 IBAN/);
    await shot(page, "masaustu-00-metin-girisi.png");
    await page.fill("#input", "");

    // 2) Örnek belge + temsilî terim kümesi → yan yana tablo
    await page.click('[data-act="sample"]');
    await toastHas(page, /12 terim sözlüğe eklendi/);
    await until(page, () => document.querySelectorAll("#rows .pt-seg").length === 10);
    assert.equal(await page.locator("#rows mark.pt-term").count(), 16);
    assert.match(await text(page, "#docDir"), /Türkçe → İngilizce/);
    assert.match(await text(page, "#docStats"), /0\/10/);
    assert.equal(await text(page, "#termCount"), "12");

    // 3) MyMind: anahtar yoksa bağlantı penceresi açılır
    await page.click("#aiAllBtn");
    await until(page, () => document.getElementById("mymindDialog").open);
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar/);
    await until(page, () => /Bağlı/.test(document.getElementById("mymindState").textContent));

    // 4) Onay reddedilirse hiçbir şey gönderilmez
    setFile("deny.txt", "1");
    await page.click("#aiAllBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");

    // 5) Onaylı çeviri: korunan alan değerleri ve ilgisiz terimler gitmez; uyumsuzluklar işaretlenir
    await page.click("#aiAllBtn");
    await toastHas(page, /10 bölüm çevrildi — 1 korunan alan eksik · sözlük uyumu %93,8/);
    assert.equal(hubCalls, 1);
    const sent = readLog("ai-sent.json");
    for (const v of ["12.500", "15.03.2026", "destek@ornek-hizmet.com", "09:00"]) assert.ok(!sent.includes(v), "gönderilmemeli: " + v);
    assert.ok(sent.includes("sözleşme = agreement") && sent.includes("iş günü = business day"));
    assert.match(readLog("approvals.txt"), /10 bölüm.*korunan alan.*değerleri gönderilmez/s);
    assert.match(await text(page, row(4) + " .pt-meta"), /sözlük 1\/2/);
    assert.match(await text(page, row(9) + " .pt-meta"), /alan eksik 1/);
    assert.equal(await page.inputValue(row(3) + " textarea"), "The agreement takes effect on 15.03.2026 and is valid for 12 months.");
    assert.match(await text(page, "#docStats"), /10\/10.*%93,8.*\(15\/16\)/s);
    await page.click(row(4) + " .pt-src");
    await until(page, () => /Bölüm 4/.test(document.getElementById("inspector").textContent));
    assert.match(await text(page, "#inspector"), /iş günü\s*→\s*business day.*çeviride 0/s);
    assert.match(await text(page, "#inspector"), /MyMind notu/);
    await shot(page, "masaustu-01-yan-yana-ceviri.png");

    // 6) Elle düzeltme: canlı sözlük denetimi, kaydedilir
    await page.fill(row(4) + " textarea", "The monthly service fee is 12.500 TL and is invoiced on the first business day of each month.");
    await until(page, () => /sözlük 2\/2/.test(document.querySelector("#rows .pt-seg:nth-child(4) .pt-meta").textContent));
    await page.fill(row(9) + " textarea", "Termination of the agreement requires written notice 30 days in advance.");
    await until(page, () => /%100/.test(document.getElementById("docStats").textContent));
    await page.click(row(1) + " .pt-src");
    await until(page, () => window.ptDesktop.state().then((s) => s.doc.segments[3].status === "elle" && /business day/.test(s.doc.segments[3].tgt) && /30 days/.test(s.doc.segments[8].tgt)));

    // 7) Alternatif terim ve kalite notu
    await page.click(row(2) + " .pt-src");
    await until(page, () => /Alternatif terimler/.test(document.getElementById("inspector").textContent));
    await shot(page, "masaustu-02-alternatif-terim.png");
    await page.click('#inspector button:has-text("provisions")');
    await toastHas(page, /“clauses” yerine “provisions”/);
    assert.match(await page.inputValue(row(2) + " textarea"), /main provisions of the agreement/);
    await page.click('#inspector button:has-text("İyi")');
    await until(page, () => /İyi/.test(document.querySelector("#rows .pt-seg:nth-child(2) .pt-meta").textContent));
    await page.click(row(1) + " .pt-src");
    await page.click('#inspector button:has-text("İyi")');
    await page.click(row(4) + " .pt-src");
    await page.click('#inspector button:has-text("Düzeltme gerekti")');
    await until(page, () => /kalite \(3 not\)/.test(document.getElementById("docStats").textContent));
    assert.match(await text(page, "#docStats"), /%66,7/);

    // 8) Yalnız sorunlu süzgeci: sorunlu bölüm kalmadı
    await page.check("#onlyIssues");
    assert.equal(await page.locator("#rows .pt-seg:not([hidden])").count(), 0);
    await page.uncheck("#onlyIssues");
    assert.equal(await page.locator("#rows .pt-seg:not([hidden])").count(), 10);

    // 9) Dışa aktarma ve pano
    for (const f of ["csv", "tmx", "txt", "md"]) { await page.selectOption("#exportFmt", f); await page.click("#exportBtn"); await toastHas(page, new RegExp("\\." + f + "” kaydedildi")); }
    const base = path.join(testDir, "Örnek — Hizmet sözleşmesi özeti");
    const csv = fs.readFileSync(base + ".csv", "utf8");
    assert.ok(csv.startsWith("﻿no;Türkçe (kaynak);İngilizce (çeviri)"));
    assert.match(csv, /Aylık hizmet bedeli 12\.500 TL'dir.*business day.*;2\/2;Düzeltme gerekti/);
    const tmx = fs.readFileSync(base + ".tmx", "utf8");
    assert.equal((tmx.match(/<tu>/g) || []).length, 10);
    assert.match(tmx, /srclang="tr-TR"/);
    const txt = fs.readFileSync(base + ".txt", "utf8");
    assert.ok(txt.startsWith("Service Agreement Summary\n\nThis summary explains"));
    assert.match(txt, /\n- The parties comply with the confidentiality obligation\.\n- Personal data/);
    assert.match(fs.readFileSync(base + ".md", "utf8"), /\| 1 \| Hizmet Sözleşmesi Özeti \| Service Agreement Summary \|/);
    await page.click("#copyBtn");
    await toastHas(page, /panoya kopyalandı/);
    assert.equal(await clipRead(app), txt.trim());

    // 10) Sözlük: ekle, CSV içe aktar, ara
    await page.click('[data-nav="glossary"]');
    await page.fill("#termTr", "özet");
    await page.fill("#termEn", "summary");
    await page.fill("#termNote", "başlıklarda da");
    await page.click('#termForm button[type="submit"]');
    await toastHas(page, /“özet → summary” sözlüğe eklendi/);
    setFile("sozluk.csv", "türkçe;ingilizce;not\nfatura;invoice;\"e-fatura; kâğıt\"\nödeme;payment;\nsözleşme;agreement;güncel not\n");
    setFile("pick.txt", path.join(testDir, "sozluk.csv"));
    await page.click("#importBtn");
    await toastHas(page, /3 satır okundu, 2 yeni terim eklendi/);
    assert.equal(await text(page, "#termCount"), "15");
    await page.fill("#termSearch", "sözleşme");
    await until(page, () => document.querySelectorAll("#terms .pt-termrow:not(.pt-termrow--head)").length === 1);
    assert.match(await text(page, "#terms"), /agreement.*güncel not.*4 kez/s);
    await page.fill("#termSearch", "");
    await shot(page, "masaustu-03-terim-sozlugu.png");

    // 11) Var olan çeviriyi hizalama (yeni belge, 2-1 eşleşme birleştirilir)
    await page.click('[data-nav="desk"]');
    await page.click("#newBtn");
    await until(page, () => !document.getElementById("startPanel").hidden);
    await page.fill("#input", "Fatura ekte. Bu ikinci cümle oldukça uzun ve çevirisi iki cümleye bölünmüş durumda. Üç. Dört kısa. Bildirim yazılı yapılır.");
    await page.click('[data-dir="tr"]');
    await page.click("#createBtn");
    await toastHas(page, /5 bölüm · Türkçe → İngilizce/);
    await page.click("#alignBtn");
    await page.fill("#alignText", "The invoice is attached. This second sentence is fairly long. Its translation was split in two. Three and four short. The notification is made in writing.");
    await page.click("#alignRun");
    await toastHas(page, /5 çeviri cümlesi 4 bölüme hizalandı \(1 bölüm birleştirildi\)/);
    assert.equal(await page.inputValue(row(2) + " textarea"), "This second sentence is fairly long. Its translation was split in two.");
    assert.match(await text(page, row(3) + " .pt-src"), /Üç\. Dört kısa\./);
    assert.match(await text(page, row(1) + " .pt-meta"), /sözlük 1\/1/);
    await shot(page, "masaustu-04-hizalama.png");

    // 12) Birleştirme ve sözlük taslağı (yeni belge)
    await page.click("#newBtn");
    await page.fill("#input", "Taraflar fatura bildirimini alır. Ek iki.\n\nKişisel veri ve fesih.");
    await page.click("#createBtn");
    await toastHas(page, /3 bölüm/);
    await page.click(row(1) + " .pt-src");
    await page.click('#inspector button:has-text("Sonrakiyle birleştir")');
    await toastHas(page, /Bölüm 1 ve 2 birleştirildi/);
    assert.equal(await page.locator("#rows .pt-seg").count(), 2);
    await page.click("#draftBtn");
    await toastHas(page, /2 boş bölüme 4 sözlük terimi yerleştirildi/);
    assert.equal(await page.inputValue(row(1) + " textarea"), "Party invoice bildirimini alır. Ek iki.");
    assert.match(await text(page, row(2) + " .pt-meta"), /Sözlük taslağı/);

    // 13) Yerel model: dış adres reddedilir, loopback ile tek bölüm çevrilir (anahtar gönderilmez)
    await page.click('[data-nav="settings"]');
    await page.check('input[name="provider"][value="yerel"]');
    await toastHas(page, /yerel model/);
    await page.fill("#localUrl", "http://192.168.1.20:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="desk"]');
    await page.click(row(2) + " .pt-src");
    await page.click('#inspector button:has-text("Bu bölümü çevir")');
    await toastHas(page, /1 bölüm çevrildi/);
    assert.deepEqual(seen[seen.length - 1], { auth: false, model: "test-model" });
    assert.match(readLog("approvals.txt"), /Yerel model \(http:\/\/127\.0\.0\.1:\d+, test-model\)/);
    assert.equal(await page.inputValue(row(2) + " textarea"), "EN Kişisel veri ve fesih.");

    // 14) Pano: parola benzeri metin alınmaz; kısayol işlevi panodaki metni getirir
    await page.click("#newBtn");
    await clipWrite(app, "Xk9#mP2qL!zR");
    await page.click('[data-act="clip"]');
    await toastHas(page, /parola ya da anahtar gibi/);
    await clipWrite(app, "Please review the attached invoice before Friday.");
    await app.evaluate(() => global.__ptQuick());
    await toastHas(page, /Panodan alındı/);
    assert.equal(await page.inputValue("#input"), "Please review the attached invoice before Friday.");

    // 15) Belgeler: arşivleme (silinmez), ölçüler
    await page.click('[data-nav="docs"]');
    assert.equal(await page.locator("#docList .pt-docrow").count(), 3);
    await page.click('#docList .pt-docrow:nth-child(1) button:has-text("Arşivle")');
    await toastHas(page, /arşivlendi/);
    assert.equal(await page.locator("#docList .pt-docrow").count(), 2);
    await page.check("#showArchived");
    assert.equal(await page.locator("#docList .pt-docrow").count(), 3);
    await shot(page, "masaustu-05-belgeler.png");
    await page.click('[data-nav="settings"]');
    const metrics = await text(page, "#metrics");
    assert.match(metrics, /%100\s*sözlük uyumu — tüm çeviriler/);
    assert.match(metrics, /insan kalite/);
    await page.check('input[name="provider"][value="hub"]');
    await toastHas(page, /MyMind/);
    await shot(page, "masaustu-06-olculer-ayarlar.png");
    const st = await state(page);
    report.stats = { compliance: st.stats.compliance, aiCompliance: st.stats.aiCompliance, quality: st.stats.quality, fields: st.stats.fields, metrics: st.stats.metrics };
    assert.equal(st.stats.aiCompliance, 83.3);
    assert.equal(violations.length, 0, "CSP/hata: " + violations.join(" | "));
    await app.close();

    // 16) Kalıcılık: yeniden açılış
    ({ app, page, violations } = await launch(port));
    const s2 = await state(page);
    assert.equal(s2.glossary.length, 15);
    assert.equal(s2.docs.length, 3);
    const sample = s2.docs.find((d) => d.sample);
    assert.equal(sample.stats.rated, 3);
    assert.equal(s2.settings.provider, "hub");
    assert.equal(s2.settings.localModel, "test-model");
    report.vault = s2.vault;
    if (s2.vault) assert.ok(fs.existsSync(path.join(userData, "ceviriler.bin")) && !fs.existsSync(path.join(userData, "ceviriler.json")));
    else assert.ok(fs.existsSync(path.join(userData, "ceviriler.json")));
    await page.click('[data-nav="docs"]');
    await page.click('#docList .pt-docrow:has-text("Örnek") button:has-text("Aç")');
    await until(page, () => document.querySelectorAll("#rows .pt-seg").length === 10);
    assert.equal(violations.length, 0, "CSP/hata: " + violations.join(" | "));
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ", JSON.stringify({ platform: process.platform, kasa: report.vault ? "var" : "yok", hubCalls, ...report.stats }));
  } catch (e) {
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    console.error(e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
