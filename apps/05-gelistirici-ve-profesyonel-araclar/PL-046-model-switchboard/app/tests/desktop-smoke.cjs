// Masaüstü duman testi: gerçek Electron penceresi; boş başlangıç, örnek kayıtlar (uydurma; harcamaya girmez), resmi API anahtarı biçimi
// (geçersiz anahtar reddi), katalogda fiyat/tarih/doğrulama (tarihsiz doğrulama reddi, fiyat değişince doğrulamanın kalkması), aynı görevin
// taklit OpenAI + taklit Anthropic + taklit MyMind'a yan yana gönderimi (onay reddi → istek yok; gövde/başlık denetimi: max_completion_tokens,
// x-api-key + anthropic-version; anahtar yalnız kendi sağlayıcısına), gerçek maliyet = bildirilen kullanım × fiyat, puan/kazanan, bütçe
// tavanı (aşacak çalıştırma gönderilmez, istek sayısı değişmez), sağlayıcı hatası (401), MyMind görev türü/model önerisi (kişisel veri ve
// sistem talimatı gitmez; uydurma model/fiyat atılır), kayıtlı sonuçlardan öneri, CSV (formül enjeksiyonu)/JSON, ölçüler, yerel model
// (loopback; dış adres reddi), izin isteklerinin reddi ve kalıcılık.
// Çalıştırma: PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs [ekran-görüntüsü-klasörü]
const { _electron: electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const shots = process.argv[2];
const electronPath = require(require.resolve("electron", { paths: [repo] }));
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ms-desktop-"));
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ms-test-"));
const readLog = (f) => { try { return fs.readFileSync(path.join(testDir, f), "utf8"); } catch { return ""; } };
const setFile = (f, v) => fs.writeFileSync(path.join(testDir, f), v);
const rmFile = (f) => fs.rmSync(path.join(testDir, f), { force: true });
const OKEY = "sk-test-openai-" + "o".repeat(24);
const AKEY = "sk-ant-test-" + "a".repeat(24);
const HKEY = "test-istemci-anahtari-1234567890";
const NOW = "2026-11-08T12:00:00";

const calls = { openai: 0, anthropic: 0, hub: 0, hubAi: 0 };
const seen = { openaiAuth: [], anthropicKeys: [], anthropicVersion: [], hubAuth: [] };
function server(handler) {
  return http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { let j = {}; try { j = JSON.parse(body || "{}"); } catch { /* yok */ } const [status, out] = handler(req, j); res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(out)); });
  });
}
const lenOf = (msgs) => msgs.map((m) => m.content).join("").length;
const openaiSrv = server((req, j) => {
  if (req.url !== "/v1/chat/completions") return [404, {}];
  calls.openai++; seen.openaiAuth.push(req.headers.authorization || "");
  if (req.headers.authorization !== "Bearer " + OKEY) return [401, { error: { message: "Incorrect API key" } }];
  assert.ok(j.max_completion_tokens > 0 && !("max_tokens" in j), "OpenAI gövdesi max_completion_tokens kullanır");
  return [200, { model: j.model, choices: [{ message: { role: "assistant", content: "OpenAI yanıtı: KDV oranı 0.20 olmalı." }, finish_reason: "stop" }], usage: { prompt_tokens: Math.ceil(lenOf(j.messages) / 4), completion_tokens: 40 } }];
});
const anthropicSrv = server((req, j) => {
  if (req.url !== "/v1/messages") return [404, {}];
  calls.anthropic++; seen.anthropicKeys.push(req.headers["x-api-key"] || ""); seen.anthropicVersion.push(req.headers["anthropic-version"] || "");
  if (req.headers.authorization) return [400, { error: { message: "Authorization başlığı beklenmiyordu" } }];
  if (req.headers["x-api-key"] !== AKEY) return [401, { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }];
  assert.ok(j.max_tokens > 0 && Array.isArray(j.messages) && j.messages.every((m) => m.role !== "system"));
  return [200, { model: j.model, content: [{ type: "text", text: "Anthropic yanıtı: 18/10 yerine 0.20 kullanın." }], stop_reason: "end_turn", usage: { input_tokens: Math.ceil(lenOf(j.messages) / 4) + 5, output_tokens: 60 } }];
});
const hubSrv = server((req, j) => {
  if (req.url !== "/v1/chat/completions") return [404, {}];
  const auth = req.headers.authorization;
  seen.hubAuth.push(auth || "");
  if (!(auth === "Bearer " + HKEY || (!auth && j.model === "test-model"))) return [401, { error: "Geçersiz API anahtarı" }];
  const sys = (j.messages[0] && j.messages[0].role === "system" && j.messages[0].content) || "";
  if (/Model Switchboard yardımcısı/.test(sys)) {
    calls.hubAi++;
    return [200, { choices: [{ message: { content: "```json\n" + JSON.stringify({ tur: "kod", modeller: ["an-haiku", "gpt-9-ultra", "oa-mini"], gerekce: "Kod görevinde Haiku iyi puan almış; maliyeti $0.004. Destek: ayse@ornek.com" }) + "\n```" } }] }];
  }
  calls.hub++;
  return [200, { choices: [{ message: { content: "MyMind yanıtı: oranı 0,20 yapın." }, finish_reason: "stop" }] }];
});
const listen = (s) => new Promise((r) => s.listen(0, "127.0.0.1", () => r(s.address().port)));

async function until(page, fn, arg, tries = 600) {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); }
  throw new Error("Beklenen durum oluşmadı: " + fn.toString() + " " + (arg || "") + " · bildirim: " + (await page.evaluate(() => document.getElementById("toasts").textContent).catch(() => "")));
}
let ports;
async function launch() {
  const app = await electron.launch({ executablePath: electronPath, args: [repo, ...(process.platform === "linux" ? ["--no-sandbox"] : [])], env: { ...process.env, MS_USER_DATA: userData, MS_TEST_DIR: testDir, MS_OPENAI_URL: "http://127.0.0.1:" + ports.openai, MS_ANTHROPIC_URL: "http://127.0.0.1:" + ports.anthropic, MS_HUB_URL: "http://127.0.0.1:" + ports.hub, MS_NOW: NOW } });
  const page = await app.firstWindow();
  const violations = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  await page.setViewportSize({ width: 1380, height: 880 }).catch(() => {});
  await until(page, () => document.documentElement.dataset.ready === "1");
  return { app, page, violations };
}
const shot = async (page, name) => { if (shots) { await page.evaluate(() => { document.getElementById("toasts").replaceChildren(); document.querySelectorAll(".ms-compose").forEach((e) => { e.scrollTop = 0; }); }); fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name) }); } };
const toastHas = (page, re) => until(page, (s) => new RegExp(s).test(document.getElementById("toasts").textContent), re.source);
const state = (page) => page.evaluate(() => window.msDesktop.state());
const text = (page, sel) => page.textContent(sel);
async function pickOnly(page, ids) {
  for (const row of await page.$$("#picks .ms-pick")) {
    const id = await row.getAttribute("data-model");
    const cb = await row.$("input");
    if ((await cb.isChecked()) !== ids.includes(id)) await cb.click();
  }
  await page.waitForTimeout(300);
}

(async () => {
  ports = { openai: await listen(openaiSrv), anthropic: await listen(anthropicSrv), hub: await listen(hubSrv) };
  let { app, page, violations } = await launch();
  const report = {};
  try {
    // 0) İzin istekleri reddedilir; boş başlangıç
    const perm = await page.evaluate(async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); return "izin verildi"; } catch (e) { return "reddedildi"; } });
    assert.equal(perm, "reddedildi");
    let s = await state(page);
    assert.equal(s.runs.length, 0);
    assert.equal(s.catalog.length, 5);
    assert.ok(!JSON.stringify(s).match(/sk-|test-istemci/), "durumda anahtar yok");
    await until(page, () => /anahtarı girilmemiş/.test(document.getElementById("planBox").textContent));
    await shot(page, "masaustu-00-baslangic.png");

    // 1) Örnek kayıtlar
    await page.click('[data-act="sample"]');
    await toastHas(page, /2 örnek kayıt eklendi/);
    s = await state(page);
    assert.equal(s.metrics.runs, 0, "örnekler ölçüye girmez");
    assert.equal(s.metrics.spentMonth, 0);
    assert.match(await text(page, "#resMeta"), /ÖRNEK KAYIT/);

    // 2) Anahtarlar ve katalog
    await page.click('[data-nav="models"]');
    await page.fill("#key-openai", "sess-chatgpt-cerez-" + "x".repeat(30));
    await page.click('[data-keysave="openai"]');
    await toastHas(page, /Yalnız resmi API anahtarı/);
    await page.fill("#key-openai", OKEY); await page.click('[data-keysave="openai"]'); await toastHas(page, /OpenAI anahtarı (Windows kasasına|yalnız bu oturum)/);
    await page.fill("#key-anthropic", AKEY); await page.click('[data-keysave="anthropic"]'); await toastHas(page, /Anthropic anahtarı (Windows kasasına|yalnız bu oturum)/);
    await page.fill("#key-hub", HKEY); await page.click('[data-keysave="hub"]'); await toastHas(page, /MyMind \(Hub\) anahtarı (Windows kasasına|yalnız bu oturum)/);
    await until(page, async () => { const k = (await window.msDesktop.state()).keys; return k.openai && k.anthropic && k.hub; });
    s = await state(page);
    assert.deepEqual(s.keys, { openai: true, anthropic: true, hub: true });
    assert.ok(!JSON.stringify(s).includes(OKEY) && !JSON.stringify(s).includes(AKEY));
    const row = (id) => '#catTable tr[data-model="' + id + '"] ';
    await page.click(row("an-haiku") + 'input[data-field="verified"]');
    await toastHas(page, /kontrol ettiğiniz tarihi girin/);
    await page.fill(row("an-haiku") + 'input[data-field="priceDate"]', "2026-11-08");
    await page.dispatchEvent(row("an-haiku") + 'input[data-field="priceDate"]', "change");
    await toastHas(page, /kaydedildi/);
    await page.click(row("an-haiku") + 'input[data-field="verified"]');
    await until(page, () => /doğrulandı/.test(document.querySelector('#catTable tr[data-model="an-haiku"]').textContent));
    await page.fill(row("oa-mini") + 'input[data-field="priceDate"]', "2026-11-08");
    await page.dispatchEvent(row("oa-mini") + 'input[data-field="priceDate"]', "change");
    await toastHas(page, /kaydedildi/);
    await page.click(row("oa-mini") + 'input[data-field="verified"]');
    await until(page, () => /doğrulandı/.test(document.querySelector('#catTable tr[data-model="oa-mini"]').textContent));
    // fiyat değişince doğrulama kalkar, sonra geri doğrulanır
    await page.fill(row("oa-mini") + 'input[data-field="inPrice"]', "0.2");
    await page.dispatchEvent(row("oa-mini") + 'input[data-field="inPrice"]', "change");
    await toastHas(page, /doğrulama kaldırıldı/);
    s = await state(page);
    assert.equal(s.catalog.find((m) => m.id === "oa-mini").verified, false);
    await page.fill(row("oa-mini") + 'input[data-field="inPrice"]', "0.15");
    await page.dispatchEvent(row("oa-mini") + 'input[data-field="inPrice"]', "change");
    await toastHas(page, /kaydedildi/);
    await page.click(row("oa-mini") + 'input[data-field="verified"]');
    await until(page, () => /doğrulandı/.test(document.querySelector('#catTable tr[data-model="oa-mini"]').textContent));
    await shot(page, "masaustu-04-modeller.png");

    // 3) Karşılaştırma
    await page.click('[data-nav="compare"]');
    const PROMPT = "Aşağıdaki JavaScript işlevindeki KDV hatasını bul ve düzelt; sonucu ayse@ornek.com adresine yazacağım:\nfunction kdv(t){ return t * 18 / 10; }";
    await page.fill("#tTitle", "=KDV işlevi hatası");
    await page.fill("#tPrompt", PROMPT);
    await page.fill("#tSystem", "Kısa ve doğru yanıt ver.");
    await page.fill("#tMax", "400");
    await pickOnly(page, ["oa-mini", "an-haiku", "hub-mymind"]);
    await until(page, () => document.getElementById("planBox").classList.contains("is-ok"));
    const plan = await page.evaluate(() => window.msDesktop.plan({ prompt: document.getElementById("tPrompt").value, system: document.getElementById("tSystem").value, maxTokens: 400 }, ["oa-mini", "an-haiku", "hub-mymind"]));
    assert.ok(plan.ok);
    report.worst = plan.worst;
    setFile("deny.txt", "1");
    await page.click("#runBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(calls.openai + calls.anthropic + calls.hub, 0, "onay reddinde istek yok");
    rmFile("deny.txt");
    await page.click("#runBtn");
    await toastHas(page, /3 yanıt · gerçek maliyet/);
    assert.deepEqual([calls.openai, calls.anthropic, calls.hub], [1, 1, 1]);
    assert.deepEqual(seen.openaiAuth, ["Bearer " + OKEY]);
    assert.deepEqual(seen.anthropicKeys, [AKEY]);
    assert.deepEqual(seen.anthropicVersion, ["2023-06-01"]);
    assert.deepEqual(seen.hubAuth, ["Bearer " + HKEY], "her anahtar yalnız kendi sağlayıcısına");
    const appr = readLog("approvals.txt");
    assert.match(appr, /en kötü/); assert.match(appr, /api\.openai\.com/); assert.match(appr, /api\.anthropic\.com/); assert.ok(!appr.includes(OKEY));
    s = await state(page);
    const run = s.active;
    assert.equal(run.results.length, 3);
    assert.ok(run.results.every((x) => x.ok && x.cost != null));
    const oa = run.results.find((x) => x.modelId === "oa-mini"), an = run.results.find((x) => x.modelId === "an-haiku");
    assert.ok(Math.abs(oa.cost - (oa.inTok * 0.15 + 40 * 0.6) / 1e6) < 1e-12);
    assert.ok(Math.abs(an.cost - (an.inTok * 1 + 60 * 5) / 1e6) < 1e-12);
    assert.equal(run.results.find((x) => x.modelId === "hub-mymind").cost, 0);
    assert.equal(run.type, "kod", "görev türü kurallarla");
    const actual = run.results.reduce((a, x) => a + x.cost, 0);
    assert.ok(actual <= plan.worst, "gerçek maliyet en kötü durumu aşmaz");
    report.actual = actual;
    await page.click('[data-result="1"] [data-star="5"]');
    await page.click('[data-result="0"] [data-star="4"]');
    await page.click('[data-result="2"] [data-star="3"]');
    await page.click('[data-win="1"]');
    await until(page, () => document.querySelector('[data-result="1"]').classList.contains("is-win"));
    await shot(page, "masaustu-01-yan-yana.png");

    // 4) Bütçe tavanı: aşacak çalıştırma gönderilmez
    await page.click('[data-nav="settings"]');
    await page.fill("#setRun", "0.0001");
    await page.click("#saveBudget");
    await toastHas(page, /Bütçe ayarları kaydedildi/);
    await page.click('[data-nav="compare"]');
    await until(page, () => document.getElementById("planBox").classList.contains("is-bad"));
    assert.match(await text(page, "#planErrors"), /çalıştırma başına tavan/);
    const before = calls.openai + calls.anthropic + calls.hub;
    await page.click("#runBtn");
    await toastHas(page, /gönderilmez/);
    assert.equal(calls.openai + calls.anthropic + calls.hub, before, "tavanı aşan istek gönderilmedi");
    await page.click('[data-nav="settings"]');
    await page.fill("#setRun", "0.5");
    await page.click("#saveBudget");
    await toastHas(page, /kaydedildi/);

    // 5) Sağlayıcı hatası (geçersiz Anthropic anahtarı → 401), diğer model sonuç verir
    await page.click('[data-nav="models"]');
    await page.fill("#key-anthropic", "sk-ant-yanlis-" + "q".repeat(24)); await page.click('[data-keysave="anthropic"]'); await toastHas(page, /Anthropic anahtarı (Windows kasasına|yalnız bu oturum)/);
    await page.click('[data-nav="compare"]');
    await page.fill("#tTitle", "Özet denemesi");
    await page.fill("#tPrompt", "Toplantı notunu 2 maddede özetle: KDV Ocak'ta %20 olacak; PDF şablonu yenilenecek.");
    await pickOnly(page, ["oa-mini", "an-haiku"]);
    await until(page, () => document.getElementById("planBox").classList.contains("is-ok"));
    await page.click("#runBtn");
    await toastHas(page, /1 yanıt, 1 hata/);
    s = await state(page);
    assert.match(s.active.results.find((x) => x.modelId === "an-haiku").error, /anahtarı geçersiz \(401\)/);
    assert.equal(s.active.type, "ozet");
    await page.click('[data-result="0"] [data-star="4"]');
    await page.click('[data-nav="models"]');
    await page.fill("#key-anthropic", AKEY); await page.click('[data-keysave="anthropic"]'); await toastHas(page, /Anthropic anahtarı (Windows kasasına|yalnız bu oturum)/);

    // 6) MyMind önerisi
    await page.click('[data-nav="compare"]');
    await page.fill("#tTitle", "Regex doğrulama");
    await page.fill("#tPrompt", "E-posta doğrulayan bir JavaScript regex yaz; örnek: ali.veli@firma.com.tr, tel 0532 111 22 33, belge https://ic.firma.local/spec");
    await page.fill("#tSystem", "GIZLI-SISTEM-TALIMATI");
    setFile("deny.txt", "1");
    await page.click("#aiBtn");
    await toastHas(page, /Gönderilmedi/);
    assert.equal(calls.hubAi, 0);
    rmFile("deny.txt");
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi geldi \(2 öğe atıldı\)/);
    const aiSent = readLog("ai-sent.json");
    for (const bad of ["ali.veli@firma.com.tr", "0532", "ic.firma.local", "GIZLI-SISTEM", OKEY, AKEY, HKEY]) assert.ok(!aiSent.includes(bad), "MyMind'a gitmemeli: " + bad);
    assert.match(aiSent, /⟦e-posta⟧/);
    assert.match(await text(page, "#aiBox"), /Kod yazma/);
    assert.ok(!/ayse@ornek\.com|\$0\.004/.test(await text(page, "#aiBox")), "gerekçede kişisel veri/fiyat iddiası yok");
    await page.click("#aiBox >> text=Modelleri seç");
    await toastHas(page, /Önerilen modeller seçildi/);
    const picked = await page.$$eval("#picks .ms-pick.is-on", (r) => r.map((x) => x.dataset.model));
    assert.deepEqual(picked.sort(), ["an-haiku", "oa-mini"]);
    await page.click("#aiBox >> text=Türü uygula");
    assert.equal(await page.inputValue("#tType"), "kod");
    await page.waitForTimeout(400);
    await shot(page, "masaustu-02-mymind-onerisi.png");

    // 7) Geçmiş ve öneri
    await page.click('[data-nav="history"]');
    await until(page, () => document.querySelectorAll("#histTable tbody tr").length === 4);
    const kodCard = await text(page, '#recoCards [data-type="kod"]');
    assert.match(kodCard, /Claude Haiku 4\.5/);
    assert.match(await text(page, '#recoCards [data-type="ceviri"]'), /Öneri yok/);
    await page.click('#histTable tr[data-run="' + run.id + '"]');
    await until(page, () => !!document.querySelector(".ms-detail"));
    await shot(page, "masaustu-03-gecmis-oneri.png");

    // 8) Dışa aktarma
    await page.click("#csvBtn");
    await toastHas(page, /model-switchboard\.csv/);
    const csv = fs.readFileSync(path.join(testDir, "model-switchboard.csv"), "utf8");
    assert.ok(csv.includes("'=KDV işlevi hatası"), "formül enjeksiyonu etkisizleştirildi");
    assert.match(csv, /2026-11-08,evet/);
    await page.click("#jsonBtn");
    await toastHas(page, /model-switchboard\.json/);
    const j = JSON.parse(fs.readFileSync(path.join(testDir, "model-switchboard.json"), "utf8"));
    assert.equal(j.calistirmalar.length, 4);
    assert.ok(!JSON.stringify(j).includes(OKEY));

    // 9) Ölçüler ve ayarlar, yerel model
    await page.click('[data-nav="settings"]');
    await page.click('input[name="provider"][value="yerel"]');
    await until(page, () => !document.getElementById("localBox").hidden);
    await page.fill("#localUrl", "http://192.168.1.20:1234");
    await page.click("#saveLocal");
    await toastHas(page, /yalnız bu bilgisayar olabilir/);
    await page.fill("#localUrl", "http://127.0.0.1:" + ports.hub);
    await page.fill("#localModel", "test-model");
    await page.click("#saveLocal");
    await toastHas(page, /Yerel model ayarı kaydedildi/);
    await page.click('[data-nav="compare"]');
    await page.click("#aiBtn");
    await toastHas(page, /MyMind önerisi geldi/);
    assert.equal(calls.hubAi, 2);
    await page.click('[data-nav="settings"]');
    await page.click('input[name="provider"][value="hub"]');
    await until(page, () => document.getElementById("localBox").hidden);
    s = await state(page);
    report.metrics = s.metrics;
    assert.equal(s.metrics.visibility, 100, "gerçek maliyet görünürlüğü %100");
    assert.equal(s.metrics.overCap, 0);
    assert.equal(s.metrics.overEstimate, 0);
    assert.equal(s.metrics.blocked, 1);
    assert.equal(s.metrics.runs, 2);
    assert.match(await text(page, "#metrics"), /%100\s*gerçek maliyeti görünen yanıt/);
    await shot(page, "masaustu-05-butce-olculer.png");
    assert.deepEqual(violations, [], "CSP ihlali ya da sayfa hatası olmamalı");
    report.vault = s.vault;
    await app.close();

    // 10) Kalıcılık
    ({ app, page, violations } = await launch());
    s = await state(page);
    assert.equal(s.runs.length, 4);
    assert.equal(s.catalog.find((m) => m.id === "an-haiku").verified, true);
    assert.equal(s.recommendations.find((r) => r.type === "kod").best.modelId, "an-haiku");
    if (s.vault) assert.ok(s.keys.openai && s.keys.anthropic && s.keys.hub, "kasa varken anahtarlar kalıcı");
    assert.equal(await page.inputValue("#tTitle"), "Regex doğrulama", "taslak kalıcı");
    assert.deepEqual(violations, []);
    await app.close();
    console.log("DUMAN TESTİ GEÇTİ · " + JSON.stringify({ ...report, calls, platform: process.platform }));
  } catch (err) {
    console.error(err, violations);
    try { if (shots) await page.screenshot({ path: path.join(shots, "hata.png") }); } catch { /* yok */ }
    try { await app.close(); } catch { /* yok */ }
    for (const s of [openaiSrv, anthropicSrv, hubSrv]) s.close();
    process.exit(1);
  }
  for (const s of [openaiSrv, anthropicSrv, hubSrv]) s.close();
})();
