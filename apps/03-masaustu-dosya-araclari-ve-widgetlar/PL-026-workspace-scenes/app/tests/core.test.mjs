import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const C = createRequire(import.meta.url)("../src/core.js");

test("bağlantı doğrulaması: yalnız http/https, giriş bilgisi yok, şemasız alan adına https", () => {
  assert.equal(C.normalizeUrl("github.com/pluginlabs"), "https://github.com/pluginlabs");
  assert.equal(C.normalizeUrl("http://ornek.com"), "http://ornek.com/");
  for (const bad of ["javascript:alert(1)", "file:///C:/Windows/system32/cmd.exe", "https://kullanici:parola@ornek.com", "ms-settings:", "  ", "sadecekelime", "data:text/html,x"])
    assert.equal(C.normalizeUrl(bad), null, bad);
});

test("öğe normalleştirme: tam yol, Windows uygulama uzantısı, varsayılan ad", () => {
  const a = C.normalizeItem({ type: "app", target: "C:\\Program Files\\Microsoft VS Code\\Code.exe" }, "win32");
  assert.equal(a.label, "Code");
  assert.equal(C.normalizeItem({ type: "folder", target: "D:\\Projeler\\tez\\" }, "win32").label, "tez");
  assert.equal(C.normalizeItem({ type: "url", target: "https://www.figma.com/files" }).label, "figma.com");
  assert.throws(() => C.normalizeItem({ type: "app", target: "C:\\x\\script.ps1" }, "win32"), /yalnız \.exe/);
  assert.throws(() => C.normalizeItem({ type: "folder", target: "göreli\\yol" }, "win32"), /tam yol/);
  assert.throws(() => C.normalizeItem({ type: "folder", target: "~/x" }, "linux"), /tam yol/);
  assert.throws(() => C.normalizeItem({ type: "komut", target: "x" }), /tür/);
  assert.ok(C.isAbsPath("\\\\sunucu\\paylasim\\klasor", "win32"));
  assert.equal(C.normalizeItem({ type: "file", target: "/home/a/not.md" }, "linux").label, "not.md");
});

test("sahne normalleştirme: yinelenen ve geçersiz öğeler elenir, gecikme ve ölçüm alanları sınırlanır", () => {
  const s = C.normalizeScene({ name: "  Tez   çalışması ", delayMs: 999, manualMinutes: "6", items: [
    { type: "url", target: "https://scholar.google.com/" }, { type: "url", target: "https://scholar.google.com/" },
    { type: "url", target: "javascript:x" }, { type: "folder", target: "C:\\Tez" }, { type: "folder", target: "c:\\tez" },
  ] }, "win32");
  assert.equal(s.name, "Tez çalışması");
  assert.equal(s.items.length, 2);
  assert.equal(s.delayMs, 700);
  assert.equal(s.manualMinutes, 6);
  assert.throws(() => C.normalizeScene({ name: "  " }), /ad/);
});

test("açılış planı: yalnız etkin öğeler, sıra korunur, kapatma adımı yok; onay metni hedefleri gösterir", () => {
  const s = C.normalizeScene({ name: "Kod", delayMs: 300, items: [
    { type: "folder", target: "C:\\p" }, { type: "app", target: "C:\\a\\Code.exe", args: "C:\\p", enabled: false }, { type: "url", target: "https://github.com" },
  ] }, "win32");
  const p = C.launchPlan(s);
  assert.deepEqual(p.steps.map((x) => x.type), ["folder", "url"]);
  assert.deepEqual(p.steps.map((x) => x.n), [1, 2]);
  assert.equal(p.estimateMs, 300);
  assert.equal(p.closes, 0);
  const t = C.planText(s, p);
  assert.match(t, /1\. Klasör — p\n   C:\\p/);
  assert.match(t, /kapatılmaz/);
  assert.equal(C.launchPlan(s, [s.items[2].id]).steps.length, 1);
});

test("kurulum süresi: ortanca ve elle kuruluma göre azalma yüzdesi", () => {
  const s = C.normalizeScene({ name: "x", manualMinutes: 5, launches: [{ at: 1, ms: 4000, opened: 3, failed: 0 }, { at: 2, ms: 6000, opened: 3, failed: 0 }, { at: 3, ms: 50000, opened: 2, failed: 1 }] });
  const t = C.timing(s);
  assert.equal(t.runs, 3);
  assert.equal(t.medianSec, 6);
  assert.equal(t.reduction, 98);
  assert.equal(t.failed, 1);
  assert.equal(C.timing(C.normalizeScene({ name: "y" })).reduction, null);
});

test("şablon ve eksik araç önerisi: ada göre eşleşir, var olan alan adını tekrar önermez, gerekçe verir", () => {
  assert.equal(C.matchTemplates("Tez araştırması")[0].key, "arastirma");
  assert.equal(C.matchTemplates("Frontend kodlama")[0].key, "yazilim");
  assert.deepEqual(C.matchTemplates("rastgele"), []);
  assert.ok(!C.matchTemplates("Yazılım geliştirme: site").some((t) => t.key === "yazi"), "yazılım ≠ yazı");
  assert.equal(C.matchTemplates("Toplantısı hazırlığı")[0].key, "toplanti");
  const s = C.normalizeScene({ name: "Yazılım projesi", items: [{ type: "url", target: "https://github.com/acme" }] }, "win32");
  const g = C.suggestMissing(s);
  assert.ok(!g.some((x) => C.hostOf(x.target) === "github.com"));
  assert.ok(g.some((x) => x.type === "folder" && !x.target && /klasör yok/.test(x.reason)));
  assert.ok(g.some((x) => x.type === "url" && /stackoverflow/.test(x.target)));
  const tpl = C.fromTemplate("tasarim");
  assert.equal(C.normalizeScene(tpl).items.length, 3);
});

test("çoklu bağlantı yapıştırma: başlıklı satırlar, yineleme ve geçersizler", () => {
  const r = C.parseUrlList("GitHub - https://github.com/a\nhttps://github.com/a\nnot bir satır\nfigma.com/files\njavascript:alert(1)\n[Belge](https://docs.google.com/d/1)");
  assert.deepEqual(r.map((x) => x.target), ["https://github.com/a", "https://figma.com/files", "https://docs.google.com/d/1"]);
  assert.equal(r[2].label, "Belge");
  assert.equal(r[0].label, "GitHub");
  assert.equal(r.length, 3);
});

test("dışa/içe aktarma: biçim denetimi, açılış geçmişi taşınmaz, bozuk sahne atlanır", () => {
  const s = C.normalizeScene({ name: "A", items: [{ type: "url", target: "https://a.com" }], launches: [{ at: 1, ms: 1, opened: 1, failed: 0 }] });
  const text = C.exportData([s]);
  assert.ok(!text.includes('"launches"'));
  const j = JSON.parse(text);
  j.scenes.push({ name: "" });
  const r = C.importData(JSON.stringify(j));
  assert.equal(r.scenes.length, 1);
  assert.equal(r.skipped, 1);
  assert.notEqual(r.scenes[0].id, s.id);
  assert.throws(() => C.importData('{"scenes":[]}'), /yedeği değil/);
  assert.throws(() => C.importData("x"), /JSON/);
});

test("MyMind isteği veri azaltılmış: yollar, tam adresler ve argümanlar gitmez", () => {
  const s = C.normalizeScene({ name: "Tez", purpose: "kaynak tarama", items: [
    { type: "folder", target: "C:\\Users\\ayse\\Gizli\\Tez" }, { type: "app", target: "C:\\Apps\\Zotero.exe", args: "--profile gizli" }, { type: "url", target: "https://scholar.google.com/scholar?q=gizli+konu" },
  ] }, "win32");
  const p = C.mymindPayload("Tez yazımı", s);
  const all = JSON.stringify(p.messages);
  assert.ok(!all.includes("ayse") && !all.includes("C:\\\\") && !all.includes("gizli") && !all.includes("scholar?q"), all);
  assert.match(all, /scholar\.google\.com/);
  assert.match(all, /Klasör: Tez/);
  assert.throws(() => C.mymindPayload("a", s), /3 karakter/);
});

test("MyMind yanıt doğrulaması: yalnız bilinen tür, https, yineleme yok, en fazla 5", () => {
  const s = C.normalizeScene({ name: "Tez", items: [{ type: "url", target: "https://scholar.google.com/" }] });
  const v = C.validateAi("```json\n" + JSON.stringify({ sahne: "Tez yazımı", oneriler: [
    { tur: "url", ad: "Akademik", url: "https://scholar.google.com/x" },
    { tur: "url", ad: "Zararlı", url: "javascript:alert(1)" },
    { tur: "url", ad: "Düz http", url: "http://ornek.com" },
    { tur: "klasör", ad: "Kaynaklar klasörü", gerekce: "PDF'ler için" },
    { tur: "komut", ad: "rm -rf" },
    { tur: "url", ad: "Zotero", url: "https://www.zotero.org/" },
    { tur: "uygulama", ad: "PDF okuyucu" }, { tur: "dosya", ad: "Taslak" }, { tur: "url", ad: "TDK", url: "https://sozluk.gov.tr" }, { tur: "url", ad: "Fazla", url: "https://fazla.com" },
  ] }) + "\n```", s);
  assert.equal(v.ok, true);
  assert.equal(v.sceneName, "Tez yazımı");
  assert.deepEqual(v.suggestions.map((x) => x.label), ["Kaynaklar klasörü", "Zotero", "PDF okuyucu", "Taslak", "TDK"]);
  assert.equal(v.suggestions[0].type, "folder");
  assert.equal(v.suggestions[0].target, "");
  assert.ok(v.rejected >= 4);
  assert.equal(C.validateAi("yanıt yok").ok, false);
});

test("sahne süzgeci Türkçe duyarsız; arşiv ayrı", () => {
  const list = [C.normalizeScene({ name: "Şirket işleri" }), C.normalizeScene({ name: "Okul", archived: true })];
  assert.equal(C.filterScenes(list, "sirket", false).length, 1);
  assert.equal(C.filterScenes(list, "", true)[0].name, "Okul");
});
