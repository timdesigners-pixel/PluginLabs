// Masaüstü duman testi (PL-006 Note Master): gerçek Electron penceresi; boş başlangıç, 60 sn içinde ilk not (#etiket),
// panodan alıntı + kaynaklı not (alıntı sınırı, izleme parametresi temizliği, kaynaksız alıntı reddi), hızlı görev ve tamamlama,
// örnek notlar, Türkçe duyarlı arama ve etiket süzgeci, geri çağırma ölçütü, gizli notun MyMind'a gönderilmemesi,
// MyMind taslağı (taklit Hub: yeniden yazım ve notta geçmeyen kavramın atılması, özgün metnin korunması, önerilerin göreve çevrilmesi),
// hızlı not widget'ı, Markdown/JSON dışa aktarma (gizliler hariç), JSON içe aktarma, kalıcılık ve DPAPI şifreleme.
// Çalıştırma: node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
delete process.env.ELECTRON_RUN_AS_NODE;
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");

const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "nm-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "nm-test-"));
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
setFile("now.txt", "2026-11-08T09:00:00.000Z");

let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    hubCalls++;
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer " + KEY;
    const content =
      "```json\n" +
      JSON.stringify({
        ozet: "Yerel öncelikli yaklaşımda verinin asıl kopyası kullanıcının cihazındadır; bulut yalnız eşitleme ve yedek içindir. Note Master için eşitleme ayrı bir modül olmalı.",
        gorevler: ["CRDT kütüphanelerini karşılaştır", "Mind Palace not şemasıyla eşitleme alanlarını çıkar", "Çakışma senaryolarını test et"],
        kavramlar: ["yerel öncelikli", "CRDT", "DPAPI", "Kuantum şifreleme"], // son kavram notta geçmiyor -> atılmalı
        metin: "Notun model tarafından düzeltilmiş hâli", // özgün metni yeniden yazma girişimi -> atılmalı
      }) +
      "\n```";
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ok ? { choices: [{ message: { role: "assistant", content } }] } : { error: "Geçersiz API anahtarı" }));
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return;
    await page.waitForTimeout(50);
  }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])],
    env: { ...process.env, NM_USER_DATA: userData, NM_TEST_DIR: testDir, NM_HUB_URL: "http://127.0.0.1:" + port },
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
const shot = async (page, name) => {
  if (!shots) return;
  await page.evaluate(() => document.getElementById("toasts").replaceChildren());
  fs.mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: path.join(shots, name) });
};
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const clearToasts = (page) => page.evaluate(() => document.getElementById("toasts").replaceChildren());
const state = (page) => page.evaluate(() => window.nmDesktop.state());
const text = (page, sel) => page.textContent(sel);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Note Master");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".ax-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".ax-product"), /Note Master.*Kaynaklı hızlı not ve görev.*06/s);
    assert.ok(await page.isVisible("#emptyPanel"));
    await shot(page, "masaustu-01-baslangic.png");

    // 1) İlk not 42 sn sonra (ölçüt ≤ 60 sn), Ctrl+Enter ile; #etiket otomatik
    setFile("now.txt", "2026-11-08T09:00:42.000Z");
    await page.fill("#cBody", "Okuma listesine ekle: yerel öncelikli yazılım makalesi #okuma");
    await page.press("#cBody", "Control+Enter");
    await toastHas(page, /Not kaydedildi/);
    let s = await state(page);
    assert.equal(s.notes.length, 1);
    assert.deepEqual(s.notes[0].tags, ["okuma"]);
    assert.equal(s.metrics.firstNoteSeconds, 42);
    assert.equal(s.metrics.firstNoteOk, true);

    // 2) Kaynaksız alıntı reddedilir; panodan alıntı + kaynak URL (izleme parametresi temizlenir, alıntı sınırı uygulanır)
    await clearToasts(page);
    setFile("clipboard.txt", "Kaynaklı not almak, okurken düşünceyi kaynağıyla birlikte saklamaktır. ".repeat(14));
    await page.click("#clipBtn");
    await toastHas(page, /alıntı olarak eklendi/);
    assert.match(await text(page, "#quoteInfo"), /kısaltılacak/);
    assert.ok(await page.isVisible("#cQuote"), "panodan alıntı alanı açmalı");
    await page.fill("#cBody", "Kaynaklı not ilkesi: alıntı ve adres birlikte saklanır. #ilke");
    await page.click("#saveBtn");
    await toastHas(page, /Alıntı için kaynak gerekli/);
    setFile("clipboard.txt", "https://ornek-blog.example/kaynakli-not?utm_source=bulten&fbclid=abc#yorumlar");
    await page.click("#clipBtn");
    await toastHas(page, /adres kaynak olarak eklendi/);
    assert.equal(await page.inputValue("#cUrl"), "https://ornek-blog.example/kaynakli-not");
    await page.fill("#cSrcTitle", "Örnek Blog — Kaynaklı not");
    await clearToasts(page);
    await page.click("#saveBtn");
    await toastHas(page, /alıntı sınırı nedeniyle kısaltıldı/);
    s = await state(page);
    const sourced = s.notes[0];
    assert.equal(sourced.sourceUrl, "https://ornek-blog.example/kaynakli-not");
    assert.equal(sourced.quoteTruncated, true);
    assert.ok(sourced.quote.length <= 601);
    assert.match(await text(page, "#detailSource"), /Örnek Blog — Kaynaklı not/);
    await shot(page, "masaustu-02-kaynakli-not-ve-alinti-siniri.png");

    // 3) Hızlı görev + tamamlama
    await page.click('[data-kind="gorev"]');
    await page.fill("#cBody", "Kaynaklı not makalesini ekiple paylaş #okuma");
    await page.click("#moreBtn");
    await page.fill("#cDue", "2026-11-10");
    await page.click("#saveBtn");
    await toastHas(page, /Görev kaydedildi/);
    await page.click('[data-kind="not"]');

    // 4) Örnek notlar, arama, etiket süzgeci ve geri çağırma
    await page.click('[data-act="sample"]');
    await toastHas(page, /Örnek notlar yüklendi \(5 kayıt\)/);
    await page.fill("#searchInput", "YEREL oncelikli");
    await until(page, () => document.querySelectorAll("#noteList .ax-item").length === 2);
    await page.click('#noteList .ax-item[data-id="not-ornek-okuma"]');
    await until(page, () => /Yerel öncelikli yazılım/.test(document.getElementById("detailTitle").textContent));
    await page.fill("#searchInput", "");
    await page.click('#tagList .pl-tag:has-text("#okuma")');
    await until(page, () => document.querySelectorAll("#noteList .ax-item").length === 4);
    await page.click("#clearTagBtn");
    // Beş farklı notu geri çağır (aç) -> haftalık ölçüt sağlanır
    for (const id of ["not-ornek-toplanti", "gorev-ornek-1", "gorev-ornek-2", "not-ornek-gizli"]) {
      await page.click(`#noteList .ax-item[data-id="${id}"]`);
    }
    await page.click('#noteList .ax-item[data-id="not-ornek-okuma"]'); // 10 dk içinde ikinci kez: sayılmaz
    s = await state(page);
    assert.equal(s.metrics.weeklyRecalledNotes, 5);
    assert.equal(s.metrics.weeklyOk, true);

    // 5) Gizli not MyMind'a gönderilmez
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /MyMind anahtarı kaydedildi/);
    await page.click('#noteList .ax-item[data-id="not-ornek-gizli"]');
    await clearToasts(page);
    await page.click("#draftBtn");
    await toastHas(page, /gizli içerik varsayılan olarak modele gönderilmez/);
    assert.equal(hubCalls, 0);

    // 6) MyMind taslağı: onay reddi -> gönderim yok; onay -> denetlenmiş taslak, özgün metin korunur
    await page.click('#noteList .ax-item[data-id="not-ornek-okuma"]');
    const bodyBefore = (await state(page)).notes.find((n) => n.id === "not-ornek-okuma").body;
    setFile("deny.txt", "1");
    await page.click("#draftBtn");
    await toastHas(page, /hiçbir şey gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await clearToasts(page);
    await page.click("#draftBtn");
    await toastHas(page, /Taslak hazır — 1 yeniden yazım girişimi atıldı, 1 notta geçmeyen kavram atıldı/);
    assert.equal(hubCalls, 1);
    const sent = fs.readFileSync(path.join(testDir, "ai-sent.json"), "utf8");
    assert.doesNotMatch(sent, /utm_source|\/makale\//);
    assert.match(sent, /ornek-dergi\.example/);
    s = await state(page);
    const okuma = s.notes.find((n) => n.id === "not-ornek-okuma");
    assert.equal(okuma.body, bodyBefore, "özgün metin değişmemeli");
    assert.deepEqual(okuma.aiDraft.concepts, ["yerel öncelikli", "CRDT", "DPAPI"]);
    assert.match(await text(page, "#droppedInfo"), /yeniden yazma girişimi: 1 · notta geçmeyen kavram: 1/);
    await page.evaluate(() => document.getElementById("aiBox").scrollIntoView({ block: "end" }));
    await shot(page, "masaustu-03-mymind-taslak-ozgun-metin-korunur.png");
    await page.click("#applyTasksBtn");
    await toastHas(page, /3 görev eklendi/);
    s = await state(page);
    assert.equal(s.notes.filter((n) => n.parentId === "not-ornek-okuma").length, 3);

    // 7) Görevler görünümü ve tamamlama
    await page.click('[data-nav="tasks"]');
    const openBefore = s.metrics.openTasks;
    await page.click("#openTasks .ax-item input[type=checkbox]");
    await until(page, (n) => Number(document.getElementById("openCount").textContent) === n - 1, openBefore);
    await shot(page, "masaustu-04-gorevler.png");

    // 8) Dışa aktarma (gizliler hariç), JSON içe aktarma, ölçütler
    await page.click('[data-nav="export"]');
    await page.check("#exclPrivate");
    await page.click("#mdBtn");
    await toastHas(page, /note-master-notlar\.md” kaydedildi/);
    await page.click("#jsonBtn");
    await toastHas(page, /note-master-yedek\.json” kaydedildi/);
    const md = fs.readFileSync(path.join(testDir, "note-master-notlar.md"), "utf8");
    assert.match(md, /^# Note Master — dışa aktarım/);
    assert.match(md, /Kaynak: \[Örnek Blog — Kaynaklı not\]\(<https:\/\/ornek-blog\.example\/kaynakli-not>\)/);
    assert.match(md, /alıntı sınırı nedeniyle kısaltıldı/);
    assert.match(md, /MyMind taslağı \(özgün metin değiştirilmedi\)/);
    assert.doesNotMatch(md, /sağlık randevusu/);
    const imp = path.join(testDir, "ice-aktar.json");
    fs.writeFileSync(imp, JSON.stringify({ schema: "pluginlabs-note/1", notes: [{ id: "not-ice-aktarilan", body: "Başka cihazdan gelen not #ice-aktarma", createdAt: "2026-11-07T10:00:00.000Z" }, { id: "not-ornek-okuma", body: "kopya" }] }));
    setFile("import-path.txt", imp);
    await page.click("#importBtn");
    await toastHas(page, /1 not içe aktarıldı, 1 atlandı/);
    assert.match(await text(page, "#kpis"), /42 sn/);
    await shot(page, "masaustu-05-olcutler-ve-disa-aktarma.png");

    // 9) Hızlı not widget'ı
    await page.click("#miniBtn");
    await until(page, () => document.getElementById("root").classList.contains("is-mini"));
    assert.equal((await state(page)).mini, true);
    await page.fill("#cBody", "Widget'tan hızlı not #widget");
    await page.press("#cBody", "Control+Enter");
    await toastHas(page, /Not kaydedildi/);
    if (shots) {
      await page.setViewportSize({ width: 420, height: 560 }).catch(() => {});
      await shot(page, "masaustu-06-hizli-not-widget.png");
    }
    await page.click("#miniExitBtn");
    await until(page, () => !document.getElementById("root").classList.contains("is-mini"));

    assert.deepEqual(violations, [], "CSP ihlali / sayfa hatası olmamalı");
    const snap = await state(page);
    await app.close();

    // 10) Kalıcılık ve DPAPI
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.notes.length, snap.notes.length);
    assert.equal(s.metrics.firstNoteSeconds, 42);
    report.notes = s.notes.length;
    report.firstNoteSeconds = s.metrics.firstNoteSeconds;
    report.weeklyRecalledNotes = s.metrics.weeklyRecalledNotes;
    report.aiDroppedRewrites = s.counters.aiDroppedRewrites;
    report.aiDroppedConcepts = s.counters.aiDroppedConcepts;
    report.privateBlocked = s.counters.privateBlocked;
    report.vault = s.vault;
    if (s.vault) assert.ok(!fs.readFileSync(path.join(userData, "notlar.bin"), "latin1").includes("randevu"));
    assert.deepEqual(violations, []);
    await app.close();

    console.log(JSON.stringify(report, null, 2));
    console.log(
      "DUMAN TESTİ GEÇTİ — " + new Date().toISOString() + " · " + process.platform + " · electron " +
        require(path.join(path.dirname(require.resolve("electron/package.json", { paths: [repo] })), "package.json")).version
    );
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
