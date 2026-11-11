const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os");
const { Hub } = require("../src/hub.cjs");
const { deriveKeys, seal, open, hmac, VERSION } = require("../src/mobile-bridge.cjs");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plbridge-test-"));
  const hub = await new Hub(root, { bridge: { host: "127.0.0.1" } }).init();
  t.after(async () => {
    await hub.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  return hub;
}
const b64 = (b) => Buffer.from(b).toString("base64");

test("telefon köprüsü: kapalı başlar, kodla + onayla eşleşir, şifreli çalışır", async (t) => {
  const hub = await fixture(t);
  assert.equal(hub.snapshot().mobileBridge.enabled, false);
  assert.equal(hub.snapshot().mobileBridge.running, false);
  assert.throws(() => hub.bridge.startPairing(), /köprüsünü açın/);

  hub.bridge.settings.enabled = true;
  await hub.bridge.start(0);
  const base = `http://127.0.0.1:${hub.bridge.port}`;
  const post = (p, body, headers = {}) =>
    fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

  // Kod yokken eşleşme başlamaz.
  assert.equal((await post("/bridge/pair/start", {})).status, 403);
  const { pairing } = hub.bridge.startPairing();
  assert.match(pairing.code, /^\d{6}$/);

  const phone = crypto.createECDH("prime256v1");
  const devicePub = phone.generateKeys();
  const name = "Test telefonu";
  // Yanlış kod reddedilir.
  const wrong = await post("/bridge/pair/start", { devicePub: b64(devicePub), name, mac: b64(hmac("000000" === pairing.code ? "111111" : "000000", `${VERSION}|start|${b64(devicePub)}|${name}`)) });
  assert.equal(wrong.status, 403);
  // Tarayıcı kaynağı engellenir.
  assert.equal((await post("/bridge/pair/start", {}, { Origin: "https://evil.example" })).status, 403);

  const start = await (await post("/bridge/pair/start", { devicePub: b64(devicePub), name, mac: b64(hmac(pairing.code, `${VERSION}|start|${b64(devicePub)}|${name}`)) })).json();
  assert.ok(start.pairId);
  const hubPub = Buffer.from(start.hubPub, "base64");
  assert.deepEqual(Buffer.from(start.mac, "base64"), hmac(pairing.code, `${VERSION}|reply|${start.hubPub}|${b64(devicePub)}|${start.pairId}`));
  const { key, compare } = deriveKeys(phone.computeSecret(hubPub), pairing.code, devicePub, hubPub);
  // Kod tek kullanımlık.
  assert.equal(hub.snapshot().mobileBridge.pairing, null);
  // Masaüstü aynı karşılaştırma kodunu görür; onaylanmadan cihaz eklenmez.
  const req = hub.snapshot().mobileBridge.requests[0];
  assert.equal(req.compare, compare);
  assert.equal((await (await post("/bridge/pair/status", { pairId: start.pairId })).json()).status, "pending");
  await hub.bridge.decide(req.id, true);
  const st = await (await post("/bridge/pair/status", { pairId: start.pairId })).json();
  assert.equal(st.status, "approved");
  const { deviceId } = open(key, `${VERSION}|pair|${start.pairId}`, st.n, st.c);
  assert.equal(hub.snapshot().mobileBridge.devices[0].id, deviceId);
  assert.equal(hub.snapshot().mobileBridge.devices[0].key, undefined, "anahtar arayüze verilmez");

  const call = async (op, args, overrides = {}) => {
    const msg = { ts: Math.floor(Date.now() / 1000), op, args, ...overrides };
    const sealed = seal(key, `${VERSION}|req|${deviceId}`, msg);
    const r = await post("/bridge/call", { d: deviceId, ...sealed });
    const body = await r.json();
    return { status: r.status, sealed, body, out: r.ok ? open(key, `${VERSION}|res|${deviceId}`, body.n, body.c) : null };
  };
  const status = await call("status", {});
  assert.equal(status.out.ok, true);
  assert.equal(status.out.data.hub.version, require("../package.json").version);
  assert.ok(status.out.data.system.memTotal > 0);

  const set = await call("features.set", { app: "leo-helper", values: { autoSubmit: true } });
  assert.equal(set.out.data.autoSubmit, true);
  assert.equal(hub.snapshot().appFeatures["leo-helper"].values.autoSubmit, true);
  assert.equal((await call("features.set", { app: "leo-helper", values: { nope: true } })).out.ok, false);

  // Tekrar oynatma ve eski zaman damgası reddedilir.
  const replay = await post("/bridge/call", { d: deviceId, ...status.sealed });
  assert.equal(replay.status, 401);
  assert.equal((await call("status", {}, { ts: 1000 })).status, 401);
  // Yanlış anahtarla şifrelenen istek reddedilir.
  const forged = seal(crypto.randomBytes(32), `${VERSION}|req|${deviceId}`, { ts: Math.floor(Date.now() / 1000), op: "status" });
  assert.equal((await post("/bridge/call", { d: deviceId, ...forged })).status, 401);

  // Kurulum masaüstü onayı ister.
  const inst = await call("install", { id: "text-tools" });
  assert.equal(inst.out.data.status, "pending");
  const pend = hub.snapshot().pending.find((p) => p.id === inst.out.data.requestId);
  assert.match(pend.clientName, /telefon/);
  assert.equal(hub.state.installed["text-tools"], undefined);

  // Eşleşme kaldırılınca erişim biter.
  await hub.bridge.revoke(deviceId);
  assert.equal((await call("status", {})).status, 401);
});

test("telefon köprüsü: üç yanlış kod denemesi kodu geçersiz kılar", async (t) => {
  const hub = await fixture(t);
  await hub.bridge.start(0);
  hub.bridge.startPairing();
  const base = `http://127.0.0.1:${hub.bridge.port}`;
  const pub = b64(crypto.createECDH("prime256v1").generateKeys());
  for (let i = 0; i < 3; i++) {
    const r = await fetch(base + "/bridge/pair/start", { method: "POST", body: JSON.stringify({ devicePub: pub, name: "x", mac: b64(crypto.randomBytes(32)) }) });
    assert.equal(r.status, 403);
  }
  assert.equal(hub.snapshot().mobileBridge.pairing, null);
});
