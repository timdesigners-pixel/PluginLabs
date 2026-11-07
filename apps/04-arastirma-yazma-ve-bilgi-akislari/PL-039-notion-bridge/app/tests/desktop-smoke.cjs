// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek şema + elle etiketli örnek içerikler (doğruluk, uydurma alan yok,
// örnek şemayla kayıt yapılmaması), taklit Notion API (loopback): anahtar biçimi, şema okuma onayı (red/onay), taslakların yeniden eşlenmesi,
// Yeni içerik penceresi (kaynak adresi doğrulaması), alanı elle düzenleme (geçersiz değer reddi, seçenek listesi), boş başlıkta kaydın
// engellenmesi, onaylı kayıt (gönderilen gövdenin şemaya birebir uyması, PATCH yok), aynı girdinin ikinci kez kaydedilmemesi (yerel defter),
// Notion'da aynı başlıklı kart (uzak mükerrer sorgusu), gerçek panodan içerik, .txt (BOM) + desteklenmeyen dosyanın atlanması ve kaynak
// dosyanın değişmemesi, MyMind (taklit Hub: anahtar, red, onay, e-posta/bağlantı/kaynak adresi/Notion anahtarı gönderilmez, uydurma
// alan/seçeneğin atılması, öneriyi uygulama), arşivleme/geri alma, Kayıtlar, ölçüler, yerel model (loopback; dış adres reddi), CSV/MD
// dışa aktarma, Notion'da şema değişince 400 → anlaşılır hata, izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "nb-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const KEY = "test-istemci-anahtari-1234567890";
const TOKEN = "secret_" + "TestNotionAnahtari1234567890abcdefXYZ";
const NOW = "2026-11-06T12:00:00";
const DB = "a1b2c3d4-e5f6-4789-8abc-def012345678";
const DB_URL = "https://www.notion.so/pluginlabs/Okuma-listesi-a1b2c3d4e5f647898abcdef012345678?v=99998888777766665555444433332222";

const txtPath = path.join(testDir, "yazi-notu.txt");
fs.writeFileSync(txtPath, "﻿Arayüzlerde erişilebilir renk\nYazar: Mert Tan\nTür: Makale\n#tasarım\n", "utf8");
const pdfPath = path.join(testDir, "rapor.pdf");
fs.writeFileSync(pdfPath, "%PDF-1.4 sahte");
const before = sha(txtPath);

// ---- Taklit Notion API (yalnız 127.0.0.1) ----
const notionSchema = () => ({
  object: "database", id: DB, url: "https://www.notion.so/a1b2c3d4e5f647898abcdef012345678", title: [{ plain_text: "Okuma listesi" }],
  properties: {
    Ad: { type: "title", title: {} }, "Bağlantı": { type: "url", url: {} }, Yazar: { type: "rich_text", rich_text: {} },
    "Tür": { type: "select", select: { options: (notion.removeVideo ? ["Makale", "Kitap", "Podcast"] : ["Makale", "Video", "Kitap", "Podcast"]).map((name) => ({ name })) } },
    Etiketler: { type: "multi_select", multi_select: { options: ["Tasarım", "Yapay zekâ", "Verimlilik", "İş", "Sağlık"].map((name) => ({ name })) } },
    Durum: { type: "status", status: { options: ["Okunacak", "Okunuyor", "Bitti"].map((name) => ({ name })) } },
    Tarih: { type: "date", date: {} }, Puan: { type: "number", number: {} }, "Önemli": { type: "checkbox", checkbox: {} }, Not: { type: "rich_text", rich_text: {} },
    Sahip: { type: "people", people: {} }, "Oluşturulma": { type: "created_time", created_time: {} },
  },
});
const notion = { calls: [], pages: [], removeVideo: false };
function checkProps(props) {
  const sc = notionSchema().properties;
  for (const [k, v] of Object.entries(props)) {
    const p = sc[k];
    if (!p) return k + " is not a property that exists.";
    const t = Object.keys(v)[0];
    if (t !== p.type) return k + " is expected to be " + p.type + ".";
    if ((t === "select" || t === "status") && !p[t].options.some((o) => o.name === v[t].name)) return "Invalid select option for " + k;
    if (t === "multi_select" && v[t].some((x) => !p[t].options.some((o) => o.name === x.name))) return "Invalid multi_select option for " + k;
    if (["created_time", "people"].includes(t)) return k + " is read-only";
  }
  if (!props.Ad) return "Title is required";
  return null;
}
let hubCalls = 0;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, j) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(j)); };
    if (req.url === "/v1/chat/completions") {
      hubCalls++;
      const j = JSON.parse(body || "{}");
      const auth = req.headers.authorization;
      const ok = auth === "Bearer " + KEY || (!auth && j.model === "test-model");
      const content = "```json\n" + JSON.stringify({ alanlar: { Ad: "Haftalık ürün bülteni", Yazar: "Ece Demir", "Tür": "Bülten", Etiketler: ["İş", "Pazarlama"], Puan: 4, "Öncelik": "yüksek", Sahip: "Ece", Durum: "Okunacak" } }) + "\n```";
      return ok ? send(200, { choices: [{ message: { role: "assistant", content } }] }) : send(401, { error: "Geçersiz API anahtarı" });
    }
    notion.calls.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null, version: req.headers["notion-version"] });
    if (req.headers.authorization !== "Bearer " + TOKEN) return send(401, { object: "error", code: "unauthorized", message: "API token is invalid." });
    if (req.headers["notion-version"] !== "2022-06-28") return send(400, { object: "error", code: "missing_version", message: "Notion-Version header failed validation" });
    if (req.method === "GET" && req.url === "/v1/databases/" + DB) return send(200, notionSchema());
    if (req.method === "GET" && req.url.startsWith("/v1/databases/")) return send(404, { object: "error", code: "object_not_found", message: "Could not find database" });
    if (req.method === "POST" && req.url === "/v1/databases/" + DB + "/query") {
      const j = JSON.parse(body);
      const want = j.filter && j.filter.title && j.filter.title.equals;
      const hits = [...notion.pages, { id: "p-mevcut", title: "Mevcut kart: tasarım ilkeleri", url: "https://www.notion.so/Mevcut-kart-p0", created_time: "2026-11-01T10:00:00.000Z" }].filter((p) => p.title === want);
      return send(200, { object: "list", results: hits.map((p) => ({ object: "page", id: p.id, url: p.url, created_time: p.created_time, archived: false })) });
    }
    if (req.method === "POST" && req.url === "/v1/pages") {
      const j = JSON.parse(body);
      if (!j.parent || j.parent.database_id !== DB) return send(400, { object: "error", code: "validation_error", message: "parent invalid" });
      const err = checkProps(j.properties || {});
      if (err) return send(400, { object: "error", code: "validation_error", message: err });
      const id = "p" + (notion.pages.length + 1);
      const title = j.properties.Ad.title.map((t) => t.text.content).join("");
      notion.pages.push({ id, title, url: "https://www.notion.so/" + id, created_time: new Date().toISOString(), properties: j.properties });
      return send(200, { object: "page", id, url: "https://www.notion.so/" + id });
    }
    send(405, { object: "error", code: "invalid_request", message: "Unsupported" });
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, NB_USER_DATA: userData, NB_TEST_DIR: testDir, NB_HUB_URL: "http://127.0.0.1:" + port, NB_NOTION_URL: "http://127.0.0.1:" + port, NB_NOW: NOW } });
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
const state = (page) => page.evaluate(() => window.nbDesktop.state());
const text = (page, sel) => page.textContent(sel);
const byTitle = async (page, re) => (await state(page)).items.find((x) => Object.values(x.values).some((v) => re.test(String(v.value))) || re.test(x.input.text));
const openDraft = async (page, re) => { const x = await byTitle(page, re); await page.click(`#draftList .nb-item[data-id="${x.id}"]`); await until(page, (i) => !!document.querySelector(`#draftList .nb-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const nav = (page, v) => page.click(`[data-nav="${v}"]`);
const clipWrite = (app, t) => app.evaluate(({ clipboard }, v) => clipboard.writeText(v), t);
const pagesPosted = () => notion.calls.filter((c) => c.method === "POST" && c.url === "/v1/pages").length;
const capture = async (page, t, url) => {
  await page.click('.nb-toolbar [data-act="capture"]');
  await page.fill("#capText", t);
  await page.fill("#capUrl", url || "");
  await page.click("#capRun");
};

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Notion Bridge");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".nb-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".nb-product"), /Notion Bridge.*Alanlara eşleme.*39/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    report.shortcut = (await state(page)).shortcut;
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek şema + örnek içerikler: doğruluk, uydurma yok, belirsiz alan boş ve gerekçeli, örnek şemayla kayıt yok
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /3 örnek içerik örnek şemaya eşlendi/);
    let s = await state(page);
    assert.equal(s.gold.accuracy, 100);
    assert.equal(s.gold.inventions, 0);
    assert.equal(s.schema.source, "ornek");
    await openDraft(page, /Derin Çalışma/);
    assert.match(await text(page, '[data-prop="Tür"]'), /Boş bırakıldı: metinde birden çok seçenek geçiyor \(Kitap, Podcast\)/);
    assert.match(await text(page, "#draftDetail"), /Şemada olmayan — eklenmedi.*Öncelik/s);
    await openDraft(page, /toplantı özetleri/);
    assert.equal(await page.inputValue('[data-prop="Puan"] input'), "4.5");
    assert.equal(await page.inputValue('[data-prop="Tür"] select'), "Video");
    assert.match(await text(page, '[data-prop="Tarih"]'), /“12 kasım 2026” ifadesinden/);
    assert.match(await text(page, '[data-prop="Etiketler"]'), /şemada olmayan seçenek eklenmedi: pazarlama/);
    assert.match(await text(page, '[data-prop="Sahip"]'), /bu alana yazmaz/);
    assert.ok(await page.isDisabled("#saveBtn"), "örnek şemayla kayıt yapılmaz");
    assert.match(await text(page, "#checkBox"), /Şemaya uygun/);
    await shot(page, "masaustu-01-taslak-onizleme.png");

    // 2) Hedef: anahtar biçimi, şema okuma onayı (red → okunmaz), onay → Notion şeması; taslaklar yeniden eşlenir
    await nav(page, "target");
    await page.fill("#notionKey", "sk-yanlis");
    await page.click("#notionSave");
    await toastHas(page, /Anahtar biçimi geçersiz/);
    await page.fill("#notionKey", TOKEN);
    await page.click("#notionSave");
    await toastHas(page, /Notion anahtarı (Windows kasasına kaydedildi|yalnız bu oturum)/);
    assert.equal(await page.inputValue("#notionKey"), "", "anahtar alanı temizlenir");
    assert.ok(!(await page.content()).includes(TOKEN), "anahtar arayüzde yok");
    await page.fill("#dbInput", "https://kotu-site.com/a1b2c3d4e5f647898abcdef012345678");
    await page.click("#dbFetch");
    await toastHas(page, /anlaşılamadı/);
    await page.fill("#dbInput", DB_URL);
    setFile("deny.txt", "1");
    await page.click("#dbFetch");
    await toastHas(page, /Şema okunmadı \(onay verilmedi\)/);
    assert.equal(notion.calls.length, 0, "onaysız Notion isteği yok");
    rmFile("deny.txt");
    await page.click("#dbFetch");
    await toastHas(page, /“Okuma listesi” şeması okundu: 10\/12 alan yazılabilir; 3 taslak yeniden eşlendi/);
    assert.match(readLog("approvals.txt"), /Notion'dan veritabanı şeması okunsun mu\?[\s\S]*a1b2c3d4-e5f6-4789-8abc-def012345678/);
    assert.equal(notion.calls[0].version, "2022-06-28");
    s = await state(page);
    assert.equal(s.schema.id, DB);
    assert.equal(s.schema.source, "notion");
    assert.ok(s.items.every((x) => x.dbId === DB));
    assert.ok(!JSON.stringify(s).includes(TOKEN), "anahtar durum nesnesinde yok");
    await page.waitForSelector("#schemaTable");
    assert.match(await text(page, "#schemaTable"), /Makale, Video, Kitap, Podcast/);
    await shot(page, "masaustu-02-hedef-ve-sema.png");

    // 3) Yeni içerik: kaynak adresi doğrulaması; elle düzenleme (geçersiz değer reddi); boş başlıkta kayıt engeli
    await nav(page, "drafts");
    await capture(page, "Renk kontrastı rehberi\nTür: Makale\n#tasarım", "javascript:alert(1)");
    await toastHas(page, /yalnız http:\/\/ ya da https:\/\//);
    await page.fill("#capUrl", "https://ornek-rehber.com/kontrast");
    await page.click("#capRun");
    await toastHas(page, /Yeni taslak: \d+ alan eşlendi/);
    s = await state(page);
    let cur = s.items.find((x) => x.id === s.active);
    assert.equal(cur.values["Bağlantı"].value, "https://ornek-rehber.com/kontrast");
    assert.equal(cur.values["Tür"].value, "Makale");
    assert.deepEqual(cur.values.Etiketler.value, ["Tasarım"]);
    await page.fill('[data-prop="Puan"] input', "çok iyi");
    await page.locator('[data-prop="Puan"] input').press("Tab");
    await toastHas(page, /Puan”: sayı değil/);
    await page.fill('[data-prop="Puan"] input', "5");
    await page.locator('[data-prop="Puan"] input').press("Tab");
    await until(page, () => window.nbDesktop.state().then((x) => x.items.find((i) => i.id === x.active).values.Puan?.value === 5) && true);
    await page.click('[data-prop="Etiketler"] .nb-chip:has-text("Verimlilik")');
    await until(page, () => document.querySelector('[data-prop="Etiketler"] .nb-chip[aria-pressed="true"]:nth-of-type(3)') !== null || document.querySelectorAll('[data-prop="Etiketler"] .nb-chip[aria-pressed="true"]').length === 2);
    await page.fill('[data-prop="Ad"] input', "");
    await page.locator('[data-prop="Ad"] input').press("Tab");
    await until(page, () => /başlık alanı boş/.test(document.getElementById("checkBox")?.textContent || ""));
    assert.ok(await page.isDisabled("#saveBtn"));
    await assert.rejects(page.evaluate((id) => window.nbDesktop.item.save(id), cur.id), /şemaya uymuyor, kaydedilmedi/);
    assert.equal(pagesPosted(), 0, "uyumsuz taslak gönderilmez");
    await page.fill('[data-prop="Ad"] input', "Renk kontrastı rehberi");
    await page.locator('[data-prop="Ad"] input').press("Tab");
    await until(page, () => /Şemaya uygun/.test(document.getElementById("checkBox")?.textContent || ""));

    // 4) Kayıt: onay (red → gönderilmez), onay → yalnız POST /v1/pages; gövde şemaya birebir uyar
    setFile("deny.txt", "1");
    await page.click("#saveBtn");
    await toastHas(page, /Kaydedilmedi \(onay verilmedi\)/);
    assert.equal(pagesPosted(), 0);
    rmFile("deny.txt");
    await page.click("#saveBtn");
    await toastHas(page, /Notion'a yeni kart olarak eklendi/);
    assert.equal(pagesPosted(), 1);
    const posted = notion.pages[0];
    assert.equal(posted.title, "Renk kontrastı rehberi");
    assert.deepEqual(posted.properties.Etiketler, { multi_select: [{ name: "Tasarım" }, { name: "Verimlilik" }] });
    assert.deepEqual(posted.properties.Puan, { number: 5 });
    assert.ok(notion.calls.every((c) => c.method !== "PATCH" && c.method !== "DELETE"), "var olan sayfa değişmez");
    assert.ok(notion.calls.some((c) => c.url.endsWith("/query") && c.body.filter.title.equals === "Renk kontrastı rehberi"), "uzak mükerrer sorgusu yalnız başlıkla");
    assert.match(readLog("approvals.txt"), /Notion'a yeni kart olarak eklensin mi\?[\s\S]*• Puan: 5[\s\S]*Yalnız yeni sayfa eklenir/);
    s = await state(page);
    assert.equal(s.metrics.saved, 1);
    assert.equal(s.metrics.remoteRejected, 0);

    // 5) Aynı girdi tekrar: yerel defter yakalar, Notion'a istek gitmez
    const callsBefore = notion.calls.length;
    await capture(page, "  renk kontrastı rehberi\nTür: Makale\n#Tasarım ", "https://ornek-rehber.com/kontrast/");
    await toastHas(page, /Yeni taslak/);
    await page.click("#saveBtn");
    await toastHas(page, /Mükerrer kayıt önlendi: Aynı girdi bu veritabanına daha önce kaydedildi/);
    assert.equal(notion.calls.length, callsBefore, "yerel mükerrerde Notion'a gidilmez");

    // 6) Notion'da aynı başlıklı kart (uzak sorgu) → mükerrer; sayfa eklenmez
    await capture(page, "Mevcut kart: tasarım ilkeleri\nTür: Kitap");
    await toastHas(page, /Yeni taslak/);
    await page.click("#saveBtn");
    await toastHas(page, /Mükerrer kayıt önlendi: Notion'da aynı başlıkla bir kart zaten var/);
    assert.equal(pagesPosted(), 1);
    s = await state(page);
    assert.equal(s.metrics.dupPrevented, 2);

    // 7) Gerçek pano ve dosya (BOM; .pdf atlanır; kaynak dosya değişmez)
    await clipWrite(app, "Sağlıklı uyku podcast bölümü\nTür: Podcast\nDurum: Okunacak\nhttps://podcast-ornek.fm/uyku");
    await page.click('.nb-toolbar [data-act="clipboard"]');
    await toastHas(page, /Yeni taslak: \d+ alan eşlendi \(panodan\)/);
    s = await state(page);
    cur = s.items.find((x) => x.id === s.active);
    assert.equal(cur.values["Bağlantı"].value, "https://podcast-ornek.fm/uyku");
    assert.equal(cur.values.Durum.value, "Okunacak");
    assert.equal(cur.input.via, "pano");
    setFile("pick.txt", txtPath + "\n" + pdfPath);
    await page.click('.nb-toolbar [data-act="files"]');
    await toastHas(page, /1 dosyadan taslak oluşturuldu · 1 dosya atlandı/);
    s = await state(page);
    cur = s.items.find((x) => x.id === s.active);
    assert.equal(cur.values.Ad.value, "Arayüzlerde erişilebilir renk", "BOM temizlenir");
    assert.equal(cur.values.Yazar.value, "Mert Tan");
    assert.equal(sha(txtPath), before, "kaynak dosya değişmez");

    // 8) MyMind: anahtar yok → hata; red → gönderilmez; onay → veri azaltılmış istek; uydurma alan/seçenek atılır; uygula
    await capture(page, "Haftalık ürün bülteni — editör Ece Demir (ece@ornek-bulten.com).\nBu sayı pazarlama ve iş stratejisi üzerine, bence 4 puanlık.\nhttps://gizli-bulten.example.com/sayi-12", "https://kaynak-bulten.example.com/arsiv");
    await toastHas(page, /Yeni taslak/);
    await page.click("#aiBtn");
    await toastHas(page, /Önce MyMind bağlantısı için Hub istemci anahtarını girin/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (Windows kasasına kaydedildi|yalnız bu oturum)/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi \(onay verilmedi\)/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi hazır: 5 alan; 4 öğe denetimde atıldı/);
    const sent = readLog("ai-sent.json");
    for (const secret of ["ece@ornek-bulten.com", "gizli-bulten.example.com", "kaynak-bulten.example.com", TOKEN]) assert.ok(!sent.includes(secret), "gönderilmemeli: " + secret);
    assert.match(sent, /⟦1⟧/);
    assert.match(await text(page, "#aiBlock"), /“Tür”: “Bülten” şemadaki seçeneklerden biri değil[\s\S]*“Öncelik”: şemada yok[\s\S]*“Sahip”: Kişi alanına yazılmaz/);
    await page.locator("#aiBlock").scrollIntoViewIfNeeded();
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click('#aiBlock button:has-text("Boş alanlara uygula")');
    await toastHas(page, /alan MyMind önerisinden dolduruldu/);
    s = await state(page);
    cur = s.items.find((x) => x.id === s.active);
    assert.equal(cur.values.Yazar.value, "Ece Demir");
    assert.equal(cur.values.Yazar.from, "mymind");
    assert.deepEqual(cur.values.Etiketler.value, ["İş"]);
    assert.ok(!("Tür" in cur.values) && !("Sahip" in cur.values));
    assert.equal(s.metrics.aiDropped, 4);

    // 9) Arşivle / geri al; Kayıtlar görünümü
    await page.click('.nb-actions button:has-text("Arşivle")');
    await toastHas(page, /Taslak arşivlendi \(silinmedi\)/);
    await nav(page, "history");
    await page.click('[data-hf="iptal"]');
    await until(page, () => document.querySelectorAll("#histList .nb-item").length === 1);
    await page.click('#histDetail button:has-text("Taslağa geri al")');
    await until(page, () => document.querySelectorAll("#histList .nb-item").length === 0);
    await page.click('[data-hf="mukerrer"]');
    await until(page, () => document.querySelectorAll("#histList .nb-item").length === 2);
    await page.click('[data-hf="kaydedildi"]');
    await until(page, () => document.querySelectorAll("#histList .nb-item").length === 1);
    assert.match(await text(page, "#histDetail"), /Notion'a kart olarak eklendi/);
    await page.click('#histDetail button:has-text("Notion\'da aç")');
    await until(page, () => true);
    await new Promise((r) => setTimeout(r, 300));
    assert.match(readLog("opened.txt"), /https:\/\/www\.notion\.so\/p1/);
    await shot(page, "masaustu-04-kayitlar.png");

    // 10) Ölçüler ve ayarlar; yerel model yalnız loopback
    await nav(page, "settings");
    await page.click('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://192.168.1.20:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('input[name="provider"][value="hub"]');
    await until(page, () => document.getElementById("localBox").hidden);
    assert.match(await text(page, "#metrics"), /0\s*şema uyumsuz kayıt/);
    await shot(page, "masaustu-05-olculer-ayarlar.png");

    // 11) Dışa aktarma
    await page.click("#csvBtn");
    await toastHas(page, /“notion-bridge\.csv” kaydedildi \(\d+ satır/);
    const csv = fs.readFileSync(path.join(testDir, "notion-bridge.csv"), "utf8");
    assert.ok(csv.replace(/^﻿/, "").startsWith("Ad,Bağlantı,Yazar,Tür,Etiketler,Durum,Tarih,Puan,Önemli,Not"));
    assert.ok(!csv.includes("Sahip"));
    await page.click("#mdBtn");
    await toastHas(page, /“notion-bridge\.md” kaydedildi/);
    assert.match(fs.readFileSync(path.join(testDir, "notion-bridge.md"), "utf8"), /## Renk kontrastı rehberi/);

    // 12) Notion'da şema değişti (Video seçeneği silindi) → 400 anlaşılır hata, ölçüye işlenir; şemayı yeniden okuyunca taslak uyumsuz görünür
    notion.removeVideo = true;
    await nav(page, "drafts");
    await capture(page, "Video derleme: animasyon ilkeleri\nTür: Video");
    await toastHas(page, /Yeni taslak/);
    await page.click("#saveBtn");
    await toastHas(page, /Notion kaydı reddetti \(şema uyuşmazlığı\).*şemayı yeniden okuyun/);
    s = await state(page);
    report.remoteRejectedAfterSchemaChange = s.metrics.remoteRejected;
    assert.equal(s.metrics.remoteRejected, 1);
    await nav(page, "target");
    await page.fill("#dbInput", DB);
    await page.click("#dbFetch");
    await toastHas(page, /şeması okundu/);
    await nav(page, "drafts");
    s = await state(page);
    cur = s.items.find((x) => x.id === s.active);
    assert.ok(!("Tür" in cur.values), "silinen seçenek artık eşlenmez");
    assert.equal(notion.pages.length, 1, "reddedilen gönderim sayfa oluşturmaz");

    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = (await state(page)).vault;
    await app.close();

    // 13) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.schema.id, DB);
    assert.equal(s.metrics.saved, 1);
    assert.equal(s.ledgerCount, 1);
    if (s.vault) assert.ok(s.hasNotion, "kasa varken Notion anahtarı kalıcı");
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify({ ...report, notionCalls: notion.calls.length, pages: notion.pages.length, hubCalls, platform: process.platform }));
  } catch (err) {
    console.error(err);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
  server.close();
})();
