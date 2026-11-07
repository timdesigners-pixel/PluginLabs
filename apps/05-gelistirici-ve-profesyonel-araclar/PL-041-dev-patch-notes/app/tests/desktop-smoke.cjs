// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek depo (elle etiketli kategori doğruluğu, sır maskeleme, commit
// bağlantıları), madde düzenleme (kanıtsız iddia → dışa aktarma engeli, başlık değiştirme, bakım maddesini dahil etme), Markdown/düz metin/
// JSON/pano çıktısı ve geri okuma, Keep a Changelog şablonu, GERÇEK yerel git deposu (git CLI ile kurulur: etiket aralığı, origin → https
// bağlantısı, sır içeren commit, depo hiç değişmez), geçersiz aralık reddi, yapıştırma (--oneline, geçersiz depo adresi reddi), .patch dosyası,
// MyMind (taklit Hub: anahtar, red, onay, istekte sır/e-posta/yazar yok, yeni madde ve kanıtsız iddianın atılması, uygulama), yerel model
// (loopback; dış adres reddi), arşiv, ölçüler, izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dp-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "dp-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const KEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-06T12:00:00";
const TOKEN = "ghp_" + "Zx81Qw".repeat(6);

// ---- Gerçek git deposu ----
const gitDir = fs.mkdtempSync(path.join(os.tmpdir(), "dp-depo-"));
let tick = 0;
const g = (...args) => execFileSync("git", ["-c", "user.name=Ece Demir", "-c", "user.email=ece@ornek.example", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args], { cwd: gitDir, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_DATE: "2026-11-0" + (1 + (tick % 5)) + "T10:00:00+03:00", GIT_COMMITTER_DATE: "2026-11-0" + (1 + (tick++ % 5)) + "T10:00:00+03:00" } }).trim();
const commit = (file, body, msg) => { fs.mkdirSync(path.dirname(path.join(gitDir, file)), { recursive: true }); fs.writeFileSync(path.join(gitDir, file), body); g("add", "-A"); g("commit", "-q", "-m", msg); };
g("init", "-q", "-b", "main");
commit("README.md", "# Deneme\n", "İlk sürüm");
g("tag", "v0.1.0");
commit("src/arama.js", "export const ara = (q) => q.trim();\n", "feat(arama): boşluklu sorgular kırpılıyor");
commit("src/oturum.js", "const t = 1;\n", "fix: oturum süresi dolunca boş ekran\n\nYeni anahtar: " + TOKEN);
commit("docs/kurulum.md", "Kurulum\n", "docs: kurulum belgesi");
g("remote", "add", "origin", "git@github.com:ornek/deneme.git");
const gitBefore = { head: g("rev-parse", "HEAD"), refs: g("for-each-ref"), status: g("status", "--porcelain") };

const patchPath = path.join(testDir, "duzeltme.patch");
fs.writeFileSync(patchPath, "From 3333333333333333333333333333333333333333 Mon Sep 17 00:00:00 2001\nFrom: Mert Tan <mert@ornek.example>\nDate: Thu, 5 Nov 2026 10:00:00 +0300\nSubject: [PATCH] fix: CSV dışa aktarmada Türkçe karakter bozulması\n\n---\n src/csv.js | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)\n\ndiff --git a/src/csv.js b/src/csv.js\n--- a/src/csv.js\n+++ b/src/csv.js\n@@ -1 +1 @@\n-yaz(veri)\n+yaz('\\ufeff' + veri)\n");

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
      const content = "```json\n" + JSON.stringify({ maddeler: [
        { id: "m3", metin: "Takip numarasının başında ya da sonunda boşluk olsa da sorgu artık sonuç veriyor", kategori: "duzeltme" },
        { id: "m4", metin: "Sipariş listesi %80 daha hızlı açılıyor", kategori: "iyilestirme" },
        { id: "m6", metin: "Teslim tarihleri artık Türkiye saatine göre gösteriliyor", kategori: "duzeltme" },
        { id: "m99", metin: "Canlı kargo haritası eklendi", kategori: "ozellik" },
      ] }) + "\n```";
      return ok ? send(200, { choices: [{ message: { role: "assistant", content } }] }) : send(401, { error: "Geçersiz API anahtarı" });
    }
    send(404, { error: "yok" });
  });
});

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || ""));
}
async function launch(port) {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, DP_USER_DATA: userData, DP_TEST_DIR: testDir, DP_HUB_URL: "http://127.0.0.1:" + port, DP_NOW: NOW } });
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
const state = (page) => page.evaluate(() => window.dpDesktop.state());
const text = (page, sel) => page.textContent(sel);
const nav = (page, v) => page.click(`[data-nav="${v}"]`);
const openRel = async (page, re) => { const s = await state(page); const x = s.releases.find((r) => re.test(r.title + " " + r.source.label)); assert.ok(x, "sürüm yok: " + re); await page.click(`#relList .dp-item[data-id="${x.id}"]`); await until(page, (i) => !!document.querySelector(`#relList .dp-item.is-sel[data-id="${i}"]`), x.id); return x.id; };
const itemSel = (id) => `.dp-it[data-item="${id}"]`;
const setText = async (page, id, v) => { await page.fill(itemSel(id) + " textarea", v); await page.locator(itemSel(id) + " textarea").press("Tab"); };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let { app, page, violations } = await launch(port);
  const report = {};
  try {
    assert.equal(await page.title(), "Dev Patch Notes");
    assert.equal(await page.evaluate(() => typeof require + typeof process + typeof window.electron), "undefinedundefinedundefined");
    assert.match(await text(page, ".dp-brand"), /PluginLabs\s*APPS/);
    assert.match(await text(page, ".dp-product"), /Dev Patch Notes.*Sürüm notu.*41/s);
    assert.equal(await page.locator("#root").getAttribute("data-pl-theme"), "dark");
    assert.ok(await page.isVisible("#emptyPanel"));
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "verildi"; } catch (e) { return "red:" + e.name; } });
    assert.match(perm, /^red:/);
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek depo
    await page.click('#emptyPanel [data-act="sample"]');
    await toastHas(page, /15 commit → 9 madde · 1 sır maskelendi/);
    let s = await state(page);
    assert.equal(s.gold.accuracy, 100, JSON.stringify(s.gold.misses));
    report.gold = s.gold;
    assert.ok(await page.isVisible("#secretBox"));
    assert.match(await text(page, "#secretBox"), /AWS erişim anahtarı · AKIA•••LE/);
    const dom = await page.evaluate(() => document.body.innerText + [...document.querySelectorAll("textarea,input")].map((e) => e.value).join(" "));
    assert.doesNotMatch(dom, /AKIAIOSFODNN7EXAMPLE/);
    const prev = await text(page, "#preview");
    assert.match(prev, /^## 1\.4\.0 — 2026-11-06/);
    assert.match(prev, /- Takip numarasında boşluk olunca sorgu boş dönüyordu \(\[666e093\]\(https:\/\/github\.com\/ornek-ekip\/kargo-takip\/commit\/666e093/);
    assert.doesNotMatch(prev, /Axios|Wip|Bildirim|Kargo iade akışı/);
    await page.click(itemSel("m3") + " .dp-sha");
    assert.match(readLog("opened.txt"), /^https:\/\/github\.com\/ornek-ekip\/kargo-takip\/commit\/666e093/);
    await page.evaluate(() => { document.getElementById("relDetail").scrollTop = 0; });
    await shot(page, "masaustu-01-surum-notu.png");

    // 2) Kanıtsız iddia → engel
    await setText(page, "m3", "Takip numarası sorgusu düzeltildi, tüm testler geçti");
    await toastHas(page, /test geçişi kaynak commit'te yok/);
    await until(page, () => !!document.getElementById("blockBox"));
    await page.evaluate(() => { const d = document.getElementById("relDetail"); d.scrollTop = 0; });
    await shot(page, "masaustu-02-kanitsiz-iddia.png");
    await page.click("#mdBtn");
    await toastHas(page, /Dışa aktarılmadı — önce düzeltin: “tüm testler geçti”/);
    assert.ok(!fs.existsSync(path.join(testDir, "1.4.0-surum-notu.md")));
    await setText(page, "m4", "Uzun sipariş listeleri 2x faster açılıyor");
    await until(page, () => !/m4/.test((document.getElementById("blockBox") || {}).textContent || ""));
    await setText(page, "m3", "Takip numarasındaki boşluklar artık sorguyu bozmuyor");
    await until(page, () => !document.getElementById("blockBox"));
    await page.selectOption(itemSel("m13") + " select", "belge");
    await page.check(itemSel("m9") + ' input[type="checkbox"]');
    await until(page, () => /Axios/.test(document.getElementById("preview").textContent));
    assert.match(await text(page, "#preview"), /### Belgeler\n\n- Kurulum[^\n]*\n- Yapılandırma örneği eklendi/);

    // 3) Çıktılar
    await page.click("#mdBtn");
    await toastHas(page, /“1\.4\.0-surum-notu\.md” kaydedildi: 10 madde, 10 commit bağlantısı, düzeltme oranı %\d+(,\d)? · geri okuma birebir/);
    const md = fs.readFileSync(path.join(testDir, "1.4.0-surum-notu.md"), "utf8");
    assert.match(md, /Takip numarasındaki boşluklar artık sorguyu bozmuyor \(\[666e093\]/);
    assert.match(md, /2x faster/);
    assert.doesNotMatch(md, /AKIA|testler geçti/);
    for (const line of md.split("\n").filter((l) => l.startsWith("- "))) assert.match(line, /\/commit\/[0-9a-f]{40}\)/);
    await page.click("#copyBtn");
    await toastHas(page, /Panoya kopyalandı: 10 madde/);
    assert.equal(await app.evaluate(({ clipboard }) => clipboard.readText()), md);
    await page.click("#txtBtn");
    await toastHas(page, /surum-notu\.txt/);
    assert.match(fs.readFileSync(path.join(testDir, "1.4.0-surum-notu.txt"), "utf8"), /^1\.4\.0 — 2026-11-06\n/);
    await page.click("#jsonBtn");
    await toastHas(page, /surum-notu\.json/);
    const j = JSON.parse(fs.readFileSync(path.join(testDir, "1.4.0-surum-notu.json"), "utf8"));
    assert.equal(j.maddeler.length, 10);
    assert.ok(j.maddeler.every((m) => m.commitler[0].adres.startsWith("https://github.com/ornek-ekip/kargo-takip/commit/")));
    await nav(page, "settings");
    await page.selectOption("#setTemplate", "keepachangelog");
    await nav(page, "notes");
    assert.match(await text(page, "#preview"), /^## \[1\.4\.0\] - 2026-11-06\n\n### Added/);
    await nav(page, "settings");
    await page.selectOption("#setTemplate", "kullanici");
    await nav(page, "notes");

    // 4) Gerçek git deposu (yalnız okuma)
    setFile("dir.txt", gitDir);
    await page.click('.dp-toolbar [data-act="repo"]');
    await page.click("#repoPick");
    await until(page, () => document.getElementById("repoRange").value === "v0.1.0..HEAD");
    assert.equal(await page.inputValue("#repoUrl"), "https://github.com/ornek/deneme");
    assert.match(await text(page, "#repoInfo"), /dal main · 1 etiket, son: v0\.1\.0/);
    await page.fill("#repoRange", "--output=/tmp/x");
    await page.click("#repoRun");
    await toastHas(page, /Aralık biçimi geçersiz/);
    await page.fill("#repoRange", "v0.1.0..HEAD");
    await page.fill("#repoVer", "0.2.0");
    await page.click("#repoRun");
    await toastHas(page, /3 commit → 3 madde · 1 sır maskelendi/);
    s = await state(page);
    assert.equal(s.detail.source.format, "git");
    assert.equal(s.detail.title, "0.2.0");
    assert.deepEqual(s.detail.items.map((x) => x.cat).sort(), ["belge", "duzeltme", "ozellik"]);
    assert.equal(s.detail.secrets[0].type, "GitHub belirteci");
    assert.match(await text(page, "#preview"), /- Arama: Boşluklu sorgular kırpılıyor \(\[[0-9a-f]{7}\]\(https:\/\/github\.com\/ornek\/deneme\/commit\/[0-9a-f]{40}\)\)/);
    assert.doesNotMatch(JSON.stringify(s), new RegExp(TOKEN));
    assert.deepEqual({ head: g("rev-parse", "HEAD"), refs: g("for-each-ref"), status: g("status", "--porcelain") }, gitBefore, "depo değişmedi");
    rmFile("dir.txt");
    report.repo = s.detail.items.map((x) => x.cat + ": " + x.text);

    // 5) Yapıştırma ve dosya
    await page.click('.dp-toolbar [data-act="paste"]');
    await page.fill("#pasteText", "a1b2c3d (HEAD -> main, tag: v2.1.0) fix: giriş ekranında çökme\n9f8e7d6 feat: koyu tema\n1234abc chore: lint\n");
    await page.fill("#pasteUrl", "ftp://kotu");
    await page.click("#pasteRun");
    await toastHas(page, /Depo adresi anlaşılamadı/);
    await page.fill("#pasteUrl", "https://gitlab.com/ekip/uygulama");
    await page.fill("#pasteVer", "2.1.0");
    await page.click("#pasteRun");
    await toastHas(page, /3 commit → 2 madde/);
    assert.match(await text(page, "#preview"), /\[a1b2c3d\]\(https:\/\/gitlab\.com\/ekip\/uygulama\/-\/commit\/a1b2c3d\)/);
    setFile("pick.txt", patchPath);
    await page.click('.dp-toolbar [data-act="file"]');
    await toastHas(page, /1 commit → 1 madde/);
    rmFile("pick.txt");
    s = await state(page);
    assert.equal(s.detail.source.format, "patch");
    assert.equal(s.detail.items[0].text, "CSV dışa aktarmada Türkçe karakter bozulması");

    // 6) MyMind
    await openRel(page, /kargo-takip/);
    await page.click("#aiBtn");
    await toastHas(page, /Hub istemci anahtarını girin/);
    await page.click("#openMymind");
    await page.fill("#mymindKey", KEY);
    await page.click("#mymindSave");
    await toastHas(page, /Anahtar (Windows kasasına kaydedildi|yalnız bu oturum)/);
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(hubCalls, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /2 madde önerisi · 2 öneri atıldı/);
    const sent = readLog("ai-sent.json");
    assert.doesNotMatch(sent, /AKIAIOSFODNN7EXAMPLE|@ornek\.example|Ece Demir|Mert Tan|github\.com\/ornek-ekip/);
    assert.match(readLog("approvals.txt"), /Yazar adları, e-postalar ve depo adresi gönderilmez/);
    s = await state(page);
    assert.ok(s.detail.ai.droppedList.some((d) => /kanıtsız iddia/.test(d)) && s.detail.ai.droppedList.some((d) => /yeni madde eklenmez/.test(d)));
    await page.evaluate(() => { const d = document.getElementById("relDetail"); d.scrollTop = d.scrollHeight; });
    await shot(page, "masaustu-03-mymind-onerisi.png");
    await page.click("text=Önerileri uygula");
    await toastHas(page, /2 madde güncellendi/);
    assert.match(await text(page, "#preview"), /Teslim tarihleri artık Türkiye saatine göre gösteriliyor/);

    // 7) Yerel model
    await nav(page, "settings");
    await page.check('input[name="provider"][value="yerel"]');
    await page.fill("#localUrl", "http://kotu.example:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar/);
    await page.fill("#localUrl", "http://127.0.0.1:" + port);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await nav(page, "notes");
    await page.click("#aiBtn");
    await toastHas(page, /madde önerisi/);
    assert.equal(hubCalls, 2);
    await nav(page, "settings");
    await page.check('input[name="provider"][value="hub"]');

    // 8) Arşiv, dışa aktarımlar, ölçüler
    await nav(page, "notes");
    await openRel(page, /duzeltme\.patch/);
    await page.click("text=Arşivle");
    await toastHas(page, /arşivlendi/);
    await page.click('[data-lf="arsiv"]');
    assert.match(await text(page, "#relList"), /duzeltme\.patch/);
    await page.click('[data-lf="etkin"]');
    await openRel(page, /kargo-takip/);
    await nav(page, "exports");
    assert.equal(await page.locator("#expTable tbody tr").count(), 4);
    assert.equal(await page.locator("#expTable .pl-badge--danger").count(), 0);
    await shot(page, "masaustu-04-disa-aktarimlar.png");
    await nav(page, "settings");
    s = await state(page);
    assert.equal(s.metrics.blocked, 1);
    assert.equal(s.metrics.last10, 1);
    assert.ok(s.metrics.editRatio > 0);
    assert.equal(s.metrics.secretsFound, 2);
    report.metrics = s.metrics;
    await page.evaluate(() => { document.getElementById("view-settings").scrollTop = 0; });
    await shot(page, "masaustu-05-olculer-ayarlar.png");
    await nav(page, "notes");
    report.vault = s.vault;
    assert.deepEqual(violations, []);
    await app.close();

    // 9) Kalıcılık
    ({ app, page, violations } = await launch(port));
    s = await state(page);
    assert.equal(s.releases.length, 4);
    assert.match(s.detail.preview, /Teslim tarihleri artık Türkiye saatine göre gösteriliyor/);
    assert.equal(s.exports.length, 4);
    assert.ok(fs.existsSync(path.join(userData, s.vault ? "notlar.bin" : "notlar.json")));
    assert.doesNotMatch(fs.readFileSync(path.join(userData, s.vault ? "notlar.bin" : "notlar.json")).toString("latin1"), /AKIAIOSFODNN7EXAMPLE|ghp_Zx81/);
    assert.deepEqual(violations, []);
    await app.close();
    console.log(JSON.stringify(report, null, 1));
    console.log("DUMAN TESTİ GEÇTİ (" + process.platform + ", electron " + require(path.join(repo, "node_modules/electron/package.json")).version + ")");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await shot(page, "hata.png"); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    server.close();
    process.exit(1);
  }
})();
