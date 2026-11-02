const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os");
const { Hub } = require("../src/hub.cjs");
const { Channels } = require("../src/channels.cjs");
const { PluginLabsClient } = require("../sdk/client.cjs");
const mymind = require("../src/mymind-tasks.cjs");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plhub-ch-"));
  const hub = await new Hub(root, { allowTestHTTP: true }).init();
  await hub.startAPI(0);
  t.after(async () => {
    await hub.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const make = async (name, scopes, namespace) => {
    const k = await hub.createClient(name, scopes, namespace);
    return new PluginLabsClient({ token: k.token, port: hub.port });
  };
  return { hub, make };
}

test("kanal: yayın, okuma, ad alanı sahipliği ve paylaşım", async (t) => {
  const { hub, make } = await fixture(t);
  const leo = await make("Leo Helper", ["channels.publish", "channels.read"], "leo-helper");
  const other = await make("Başka", ["channels.read"], "baska");
  const rec = await leo.publish("leo-helper.codes", { total: 3 }, { ttlSeconds: 60 });
  assert.equal(rec.seq, 1);
  assert.equal(rec.ownerId, undefined);
  assert.equal((await leo.publish("leo-helper.codes", { total: 4 })).seq, 2);
  await assert.rejects(leo.publish("baska.x", { a: 1 }), /kendi ad alanınız/);
  await assert.rejects(other.read("leo-helper.codes"), /bulunamadı/);
  assert.deepEqual(await other.channels(), []);
  await leo.publish("leo-helper.codes", { total: 5 }, { share: ["baska"] });
  assert.equal((await other.read("leo-helper.codes")).data.total, 5);
  await assert.rejects(other.publish("baska.x", {}), /izin yok/);
  assert.equal(hub.snapshot().channels.length, 1);
  assert.equal(hub.closeChannel("leo-helper.codes"), true);
  assert.equal(hub.snapshot().channels.length, 0);
});

test("kanal: sınırlar ve geçersiz girdiler", async (t) => {
  let now = 1000;
  const c = new Channels({ now: () => now });
  const client = { id: "a", name: "A" };
  assert.throws(() => c.publish(client, "a1", "kotu", { data: {} }), /Geçersiz kanal/);
  assert.throws(() => c.publish(client, "a1", "a1.x", { data: "x".repeat(501) }), /Metin/);
  assert.throws(() => c.publish(client, "a1", "a1.x", { data: JSON.parse('{"__proto__":1}') }), /alan adı/);
  assert.throws(() => c.publish(client, "a1", "a1.x", { data: {}, ttlSeconds: 1 }), /Süre/);
  assert.throws(() => c.publish(client, "a1", "a1.x", { data: {}, share: ["BÜYÜK"] }), /paylaşım/);
  let deep = {};
  for (let i = 0; i < 10; i++) deep = { d: deep };
  assert.throws(() => c.publish(client, "a1", "a1.x", { data: deep }), /derin/);
  c.publish(client, "a1", "a1.ok", { data: { v: 1 }, ttlSeconds: 10 });
  now += 61000;
  assert.equal(c.list().length, 0);
  for (let i = 0; i < 30; i++) c.publish(client, "a1", "a1.ok", { data: { i } });
  assert.throws(() => c.publish(client, "a1", "a1.ok", { data: {} }), /dakikada/);
  const b = { id: "b", name: "B" };
  assert.throws(() => c.publish(b, "a1", "a1.ok", { data: {} }), /başka bir istemciye/);
});

test("kanal: SSE canlı akış ve iptalde temizlik", async (t) => {
  const { hub, make } = await fixture(t);
  const pub = await make("Yayıncı", ["channels.publish"], "yayinci");
  const sub = await make("Dinleyici", ["channels.read"], "dinleyici");
  await pub.publish("yayinci.feed", { events: [{ message: "ilk" }] }, { share: ["*"] });
  const seen = [];
  const stop = sub.subscribe(["yayinci.feed"], (r) => seen.push(r.seq));
  t.after(stop);
  const wait = async (n) => {
    for (let i = 0; i < 100 && seen.length < n; i++) await new Promise((r) => setTimeout(r, 20));
  };
  await wait(1);
  await pub.publish("yayinci.feed", { events: [] }, { share: ["*"] });
  await wait(2);
  assert.deepEqual(seen, [1, 2]);
  const client = hub.state.clients.find((c) => c.namespace === "yayinci");
  await hub.revokeClient(client.id);
  assert.equal(hub.snapshot().channels.length, 0);
});

test("istemci ad alanı benzersiz olur", async (t) => {
  const { hub } = await fixture(t);
  await hub.createClient("Aynı Ad", ["channels.read"]);
  await hub.createClient("Aynı Ad", ["channels.read"]);
  const ns = hub.snapshot().clients.map((c) => c.namespace);
  assert.deepEqual(ns, ["ayni-ad", "ayni-ad-2"]);
  await assert.rejects(hub.createClient("X", [], "ayni-ad"), /kullanılıyor/);
});

test("My Mind görevleri: katalog, doğrulama, JSON ayrıştırma ve enjeksiyon koruması", async () => {
  assert.ok(mymind.catalog().length >= 12);
  let sent;
  const chat = async (b) => {
    sent = b;
    return { choices: [{ message: { content: 'Tamam {"category":"market"} bitti' } }] };
  };
  const r = await mymind.run(chat, "expense-categorize", { description: "Migros alışveriş" });
  assert.deepEqual(r.output, { category: "market" });
  assert.match(sent.messages[0].content, /VERİ/);
  assert.equal(sent.messages[1].content, "Migros alışveriş");
  await assert.rejects(mymind.run(chat, "yok", {}), /bulunamadı/);
  await assert.rejects(mymind.run(chat, "summarize", {}), /Eksik/);
  await assert.rejects(mymind.run(chat, "summarize", { text: "x".repeat(7000) }), /Geçersiz/);
  const bad = async () => ({ choices: [{ message: { content: "json yok" } }] });
  await assert.rejects(mymind.run(bad, "break-down-task", { task: "a" }), /geçerli/);
  const odd = async () => ({ choices: [{ message: { content: '{"category":"hack"}' } }] });
  assert.equal((await mymind.run(odd, "expense-categorize", { description: "x" })).output.category, "diğer");
});

test("My Mind uç noktaları izin ister", async (t) => {
  const { make } = await fixture(t);
  const noScope = await make("İzinsiz", ["channels.read"]);
  await assert.rejects(noScope.mymind.capabilities(), /izin yok/);
  const ok = await make("İzinli", ["mymind.chat"]);
  const cap = await ok.mymind.capabilities();
  assert.equal(cap.ready, false);
  await assert.rejects(ok.mymind.run("summarize", { text: "merhaba" }), /motorunu başlatın/);
});
