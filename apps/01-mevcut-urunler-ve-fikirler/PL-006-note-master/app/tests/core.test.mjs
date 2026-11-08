import test from "node:test";
import assert from "node:assert/strict";
import C from "../src/core.js";
import SAMPLE from "../src/sample.js";

const NOW = "2026-11-08T10:00:00.000Z";
const notes = () => SAMPLE.sampleNotes.map((n) => C.normalizeNote(n, { now: NOW }));

test("1. Kaynaklı not: URL izleme parametreleri ve #parça atılır, etiketler gövdeden çıkarılır", () => {
  const n = C.createNote(
    { body: "Deneme notu #Okuma #yapay-zeka", quote: "Kısa alıntı", sourceUrl: "https://kullanici:sifre@ornek.example/a?b=1&utm_medium=x&fbclid=y#bolum" },
    NOW
  );
  assert.equal(n.sourceUrl, "https://ornek.example/a?b=1");
  assert.deepEqual(n.tags, ["okuma", "yapay-zeka"]);
  assert.equal(n.title, "Deneme notu #Okuma #yapay-zeka");
  assert.equal(n.schema, "pluginlabs-note/1");
});

test("2. Alıntı sınırı tutulur: uzun alıntı kısaltılır ve işaretlenir; alıntı kaynaksız kaydedilemez", () => {
  const long = "kelime ".repeat(200);
  const n = C.createNote({ quote: long, sourceTitle: "Kitap" }, NOW, { quoteLimit: 200 });
  assert.ok(n.quote.length <= 201);
  assert.ok(n.quote.endsWith("…"));
  assert.equal(n.quoteTruncated, true);
  assert.throws(() => C.createNote({ quote: "kaynaksız alıntı" }, NOW), /Alıntı için kaynak gerekli/);
  assert.throws(() => C.createNote({ body: "x", sourceUrl: "javascript:alert(1)" }, NOW), /http/);
  assert.throws(() => C.createNote({ body: "  " }, NOW), /Not boş/);
});

test("3. Arama Türkçe karakterleri katlar, başlık eşleşmesini öne alır, etiket ve görev süzgeci çalışır", () => {
  const list = notes();
  const r = C.search(list, "YEREL oncelikli");
  assert.equal(r[0].id, "not-ornek-okuma");
  assert.equal(C.search(list, "widget").length, 1);
  assert.equal(C.search(list, "", { tag: "#okuma" }).length, 2);
  assert.deepEqual(C.search(list, "", { openOnly: true }).map((n) => n.id), ["gorev-ornek-1"]);
  assert.equal(C.search(list, "olmayanbirsey").length, 0);
});

test("4. Doğrulama ölçütü: ilk not süresi ve haftalık geri çağrılan not sayısı hesaplanır", () => {
  let list = [C.createNote({ body: "ilk not" }, "2026-11-08T09:00:42.000Z")];
  let m = C.metrics(list, { firstLaunchAt: "2026-11-08T09:00:00.000Z" }, NOW);
  assert.equal(m.firstNoteSeconds, 42);
  assert.equal(m.firstNoteOk, true);
  // Sabitlenen ilk not anı, sonradan eklenen eski tarihli (örnek/içe aktarılan) notlardan etkilenmez
  const fixed = C.metrics([...list, ...notes()], { firstLaunchAt: "2026-11-08T09:00:00.000Z", firstNoteAt: "2026-11-08T09:00:42.000Z" }, NOW);
  assert.equal(fixed.firstNoteSeconds, 42);
  // Aynı not 10 dk içinde iki kez açılırsa bir kez sayılır
  let r = C.recordRecall(list[0], "2026-11-08T09:10:00.000Z");
  assert.equal(r.counted, true);
  r = C.recordRecall(r.note, "2026-11-08T09:15:00.000Z");
  assert.equal(r.counted, false);
  list = [r.note, ...notes()];
  for (let i = 1; i < 5; i++) list[i] = C.recordRecall(list[i], "2026-11-07T12:00:00.000Z").note;
  m = C.metrics(list, { firstLaunchAt: "2026-11-08T09:00:00.000Z" }, NOW);
  assert.equal(m.weeklyRecalledNotes, 5);
  assert.equal(m.weeklyOk, true);
  // 8 gün önceki geri çağırma sayılmaz
  const old = C.recordRecall(notes()[0], "2026-10-30T10:00:00.000Z").note;
  assert.equal(C.metrics([old], {}, NOW).weeklyRecalledNotes, 0);
});

test("5. Markdown dışa aktarma: görev kutuları, alıntı, kaynak bağlantısı; gizli notlar istenirse hariç", () => {
  const list = notes();
  const md = C.exportMarkdown(list, { now: NOW });
  assert.match(md, /^# Note Master — dışa aktarım/);
  assert.match(md, /## \[ \] Markdown dışa aktarımında/);
  assert.match(md, /## \[x\] Okuma listesindeki/);
  assert.match(md, /> Yerel öncelikli yazılımda verinin birincil kopyası/);
  assert.match(md, /Kaynak: \[Örnek Dergi — Yerel öncelikli yazılım\]\(<https:\/\/ornek-dergi\.example\/makale\/yerel-oncelikli-yazilim>\)/);
  assert.match(md, /sağlık randevusu/);
  const pub = C.exportMarkdown(list, { now: NOW, excludePrivate: true });
  assert.doesNotMatch(pub, /sağlık randevusu/);
  assert.match(pub, /gizli notlar hariç/);
});

test("6. JSON dışa/içe aktarma aynı şemayla gidip gelir; mevcut kimlikler atlanır", () => {
  const list = notes();
  const json = C.exportJson(list, { now: NOW });
  const r1 = C.importJson(json, [], NOW);
  assert.equal(r1.added.length, list.length);
  assert.deepEqual(r1.added[0], list[0]);
  const r2 = C.importJson(json, list, NOW);
  assert.equal(r2.added.length, 0);
  assert.equal(r2.skipped, list.length);
  assert.throws(() => C.importJson('{"schema":"baska"}', [], NOW), /biçiminde değil/);
});

test("7. Gizli içerik varsayılan olarak modele gönderilmez; izinle gönderilirse kişisel veri maskelenir", () => {
  const priv = notes().find((n) => n.private);
  assert.throws(() => C.aiPayload(priv, {}), /gizli/);
  const p = C.aiPayload(priv, { allowPrivateAi: true });
  const sent = JSON.stringify(p.messages);
  assert.doesNotMatch(sent, /ornek\.kisi@example\.com/);
  assert.doesNotMatch(sent, /0532 000 00 00/);
  assert.match(sent, /\[e-posta\]/);
  assert.match(sent, /\[telefon\]/);
  const pub = notes()[0];
  const pp = C.aiPayload(pub, {});
  assert.equal(pp.sent.host, "ornek-dergi.example");
  assert.doesNotMatch(JSON.stringify(pp.messages), /utm_source|\/makale\//);
  assert.throws(() => C.aiPayload(notes()[2], {}), /en az/);
});

test("8. Model çıktısı denetimi: özgün metni yeniden yazma girişimi ve notta geçmeyen kavramlar atılır", () => {
  const n = notes()[0];
  const before = JSON.stringify(n);
  const reply =
    "```json\n" +
    JSON.stringify({
      ozet: "Yerel öncelikli yaklaşımda asıl veri cihazdadır; bulut eşitleme içindir.",
      gorevler: ["- [ ] CRDT kütüphanelerini karşılaştır", "Çakışma senaryolarını test et", "Çakışma senaryolarını test et"],
      kavramlar: ["CRDT", "yerel öncelikli", "Blockchain"],
      metin: "Notun düzeltilmiş hâli…",
    }) +
    "\n```";
  const d = C.validateAi(reply, n, "MyMind", NOW);
  assert.deepEqual(d.concepts, ["CRDT", "yerel öncelikli"]);
  assert.equal(d.droppedConcepts, 1);
  assert.equal(d.droppedRewrites, 1);
  assert.deepEqual(d.tasks, ["CRDT kütüphanelerini karşılaştır", "Çakışma senaryolarını test et"]);
  assert.equal(JSON.stringify(n), before, "özgün not değişmemeli");
  const withDraft = { ...n, aiDraft: d };
  const tasks = C.tasksFromDraft(withDraft, [0], NOW);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].kind, "gorev");
  assert.equal(tasks[0].parentId, n.id);
  assert.equal(tasks[0].sourceUrl, n.sourceUrl);
  assert.throws(() => C.validateAi("serbest metin", n, "x", NOW), /JSON/);
});

test("9. Ayarlar: yerel model adresi yalnız loopback olabilir; alıntı sınırı aralıkta tutulur", () => {
  assert.equal(C.normalizeSettings({ provider: "yerel", localUrl: "http://10.0.0.5:1234" }).localUrl, "http://127.0.0.1:1234");
  assert.equal(C.normalizeSettings({ quoteLimit: 5 }).quoteLimit, 120);
  assert.equal(C.normalizeSettings({ quoteLimit: 99999 }).quoteLimit, 2000);
  assert.equal(C.normalizeSettings({}).allowPrivateAi, false);
  assert.equal(C.isLoopbackUrl("http://localhost:11434"), true);
  assert.equal(C.isLoopbackUrl("https://ornek.example"), false);
});
