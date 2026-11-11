// Telefon köprüsü: PluginLabs Hub Android'in aynı ağdaki masaüstü Hub'a bağlanması.
// - Varsayılan kapalıdır; kullanıcı Ayarlar'dan açar. Yerel API (127.0.0.1) değişmez, köprü ayrı sunucudur.
// - Eşleştirme: masaüstünde gösterilen 6 haneli tek kullanımlık kod + ECDH (P-256). İki ekranda aynı
//   4 haneli karşılaştırma kodu görünür; masaüstünde "Onayla" denmeden cihaz eklenmez.
// - Eşleşmeden sonra her istek ve yanıt AES-256-GCM ile şifrelenir; zaman damgası ve tek kullanımlık
//   nonce ile tekrar oynatma engellenir.
// - Telefon yalnız durum okur, özellik ayarlarını değiştirir ve kurulum ister; kurulum masaüstünde onay bekler.
"use strict";
const crypto = require("node:crypto");
const http = require("node:http");
const os = require("node:os");
const appFeatures = require("./app-features.cjs");

const PORT = 47633;
const CODE_TTL = 5 * 60 * 1000;
const PAIR_TTL = 5 * 60 * 1000;
const MAX_BODY = 64 * 1024;
const CLOCK_SKEW = 120;
const VERSION = "pl-bridge-v1";

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
const b64 = (buf) => Buffer.from(buf).toString("base64");
const unb64 = (s, max = 4096) => {
  if (typeof s !== "string" || s.length > max || !/^[A-Za-z0-9+/=]*$/.test(s)) fail("Geçersiz veri");
  return Buffer.from(s, "base64");
};
const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);

/** İki tarafın aynı hesapladığı anahtar ve karşılaştırma kodu. */
function deriveKeys(shared, code, devicePub, hubPub) {
  const okm = Buffer.from(crypto.hkdfSync("sha256", shared, Buffer.from(code), Buffer.from(`${VERSION}|${b64(devicePub)}|${b64(hubPub)}`), 64));
  const key = okm.subarray(0, 32);
  const compare = String(okm.readUInt32BE(32) % 10000).padStart(4, "0");
  return { key, compare };
}

function seal(key, aad, obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(aad));
  const body = Buffer.concat([c.update(JSON.stringify(obj)), c.final(), c.getAuthTag()]);
  return { n: b64(iv), c: b64(body) };
}

function open(key, aad, n, cipher) {
  const iv = unb64(n, 32);
  const data = unb64(cipher, MAX_BODY * 2);
  if (iv.length !== 12 || data.length < 17) fail("Geçersiz şifreli veri");
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(data.subarray(data.length - 16));
  try {
    return JSON.parse(Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]).toString());
  } catch {
    fail("Şifre çözülemedi", 401);
  }
}

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === "IPv4" && !a.internal) out.push(a.address);
  }
  return out;
}

class MobileBridge {
  constructor(hub, options = {}) {
    this.hub = hub;
    this.host = options.host || "0.0.0.0";
    this.server = null;
    this.port = null;
    this.pairing = null; // { code, expiresAt, attempts }
    this.pairs = new Map(); // pairId -> { name, key, compare, status, createdAt, deviceId }
    this.nonces = new Map(); // deviceId -> Set
    this.hits = [];
  }

  get settings() {
    const s = this.hub.state.settings;
    s.mobileBridge = s.mobileBridge || { enabled: false, port: PORT };
    return s.mobileBridge;
  }
  get devices() {
    this.hub.state.mobileDevices = this.hub.state.mobileDevices || [];
    return this.hub.state.mobileDevices;
  }

  snapshot() {
    return {
      enabled: !!this.settings.enabled,
      running: !!this.server,
      port: this.port || this.settings.port || PORT,
      addresses: this.server ? lanAddresses() : [],
      pairing: this.pairing && this.pairing.expiresAt > Date.now() ? { code: this.pairing.code, expiresAt: this.pairing.expiresAt } : null,
      requests: [...this.pairs.entries()]
        .filter(([, p]) => p.status === "pending" && Date.now() - p.createdAt < PAIR_TTL)
        .map(([id, p]) => ({ id, name: p.name, compare: p.compare, createdAt: p.createdAt })),
      devices: this.devices.map(({ key, ...d }) => d),
    };
  }

  async setEnabled(enabled, port) {
    if (typeof enabled !== "boolean") fail("Geçersiz durum");
    this.settings.enabled = enabled;
    if (port !== undefined) {
      if (!Number.isInteger(port) || port < 1024 || port > 65535) fail("Geçersiz bağlantı noktası");
      this.settings.port = port;
    }
    await this.hub.save();
    if (enabled) await this.start();
    else await this.stop();
    this.hub.log(`Telefon köprüsü ${enabled ? "açıldı" : "kapatıldı"}`);
    this.hub.emit("change");
    return this.snapshot();
  }

  async start(port = this.settings.port ?? PORT) {
    if (this.server) return;
    const server = http.createServer((req, res) => {
      this.route(req, res).catch((e) => {
        if (res.headersSent) return res.destroy();
        res.writeHead(e.status || 500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end(JSON.stringify({ error: e.status ? e.message : "İşlem başarısız" }));
      });
    });
    server.requestTimeout = 15000;
    server.headersTimeout = 10000;
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, this.host, resolve);
    });
    this.server = server;
    this.port = server.address().port;
  }

  async stop() {
    this.pairing = null;
    this.pairs.clear();
    if (!this.server) return;
    const s = this.server;
    this.server = null;
    this.port = null;
    s.closeAllConnections();
    await new Promise((r) => s.close(r));
  }

  /** Masaüstündeki "Telefonu eşleştir" düğmesi: 6 haneli tek kullanımlık kod üretir. */
  startPairing() {
    if (!this.server) fail("Önce telefon köprüsünü açın");
    this.pairing = { code: String(crypto.randomInt(0, 1000000)).padStart(6, "0"), expiresAt: Date.now() + CODE_TTL, attempts: 0 };
    this.hub.emit("change");
    return this.snapshot();
  }

  async decide(pairId, allow) {
    const p = this.pairs.get(pairId);
    if (!p || p.status !== "pending") fail("Bekleyen eşleştirme yok");
    if (Date.now() - p.createdAt > PAIR_TTL) {
      p.status = "expired";
      fail("Eşleştirme süresi doldu");
    }
    if (!allow) {
      p.status = "rejected";
      this.hub.emit("change");
      return this.snapshot();
    }
    if (this.devices.length >= 10) fail("En fazla 10 cihaz eşleşebilir");
    const id = crypto.randomUUID();
    this.devices.push({ id, name: p.name, key: b64(p.key), createdAt: Date.now(), lastSeen: null });
    p.status = "approved";
    p.deviceId = id;
    this.pairing = null;
    await this.hub.save();
    this.hub.log(`Telefon eşleşti: ${p.name}`);
    this.hub.emit("change");
    return this.snapshot();
  }

  async revoke(id) {
    const i = this.devices.findIndex((d) => d.id === id);
    if (i < 0) fail("Cihaz bulunamadı", 404);
    const [d] = this.devices.splice(i, 1);
    this.nonces.delete(id);
    await this.hub.save();
    this.hub.log(`Telefon eşleşmesi kaldırıldı: ${d.name}`);
    this.hub.emit("change");
    return this.snapshot();
  }

  rateLimit() {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < 60000);
    if (this.hits.length >= 120) fail("Çok fazla istek", 429);
    this.hits.push(now);
  }

  async body(req) {
    let total = 0;
    const parts = [];
    for await (const chunk of req) {
      total += chunk.length;
      if (total > MAX_BODY) fail("İstek çok büyük", 413);
      parts.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(parts).toString() || "{}");
    } catch {
      fail("Geçersiz JSON");
    }
  }

  async route(req, res) {
    this.rateLimit();
    if (req.headers.origin) fail("Tarayıcı kaynaklarından erişim kapalı", 403);
    if (req.method !== "POST") fail("Yalnız POST", 405);
    const url = new URL(req.url, "http://bridge");
    const data = await this.body(req);
    let out;
    if (url.pathname === "/bridge/pair/start") out = this.pairStart(data);
    else if (url.pathname === "/bridge/pair/status") out = this.pairStatus(data);
    else if (url.pathname === "/bridge/call") out = await this.call(data);
    else fail("Bulunamadı", 404);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(JSON.stringify(out));
  }

  pairStart({ devicePub, name, mac }) {
    const p = this.pairing;
    if (!p || p.expiresAt < Date.now()) fail("Masaüstünde etkin eşleştirme kodu yok", 403);
    const pub = unb64(devicePub, 200);
    const deviceName = String(name || "Telefon").replace(/[\u0000-\u001f]/g, "").slice(0, 60) || "Telefon";
    const expected = hmac(p.code, `${VERSION}|start|${b64(pub)}|${deviceName}`);
    if (!safeEqual(unb64(mac, 100), expected)) {
      p.attempts += 1;
      if (p.attempts >= 3) this.pairing = null;
      this.hub.emit("change");
      fail("Eşleştirme kodu yanlış", 403);
    }
    let shared, hubPub;
    try {
      const ecdh = crypto.createECDH("prime256v1");
      hubPub = ecdh.generateKeys();
      shared = ecdh.computeSecret(pub);
    } catch {
      fail("Geçersiz anahtar");
    }
    const { key, compare } = deriveKeys(shared, p.code, pub, hubPub);
    const pairId = crypto.randomUUID();
    // Kod tek kullanımlıktır: ikinci bir cihaz aynı kodla başlayamaz.
    this.pairing = null;
    this.pairs.set(pairId, { name: deviceName, key, compare, status: "pending", createdAt: Date.now() });
    for (const [id, x] of this.pairs) if (Date.now() - x.createdAt > PAIR_TTL * 2) this.pairs.delete(id);
    this.hub.emit("change");
    return { pairId, hubPub: b64(hubPub), mac: b64(hmac(p.code, `${VERSION}|reply|${b64(hubPub)}|${b64(pub)}|${pairId}`)) };
  }

  pairStatus({ pairId }) {
    const p = this.pairs.get(String(pairId || ""));
    if (!p) fail("Eşleştirme bulunamadı", 404);
    if (p.status === "pending" && Date.now() - p.createdAt > PAIR_TTL) p.status = "expired";
    if (p.status !== "approved") return { status: p.status };
    const sealed = seal(p.key, `${VERSION}|pair|${pairId}`, { deviceId: p.deviceId, hub: os.hostname() });
    this.pairs.delete(pairId);
    return { status: "approved", ...sealed };
  }

  async call({ d, n, c }) {
    const device = this.devices.find((x) => x.id === d);
    if (!device) fail("Cihaz eşleşmemiş", 401);
    const key = Buffer.from(device.key, "base64");
    const msg = open(key, `${VERSION}|req|${device.id}`, n, c);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(msg.ts) || Math.abs(now - msg.ts) > CLOCK_SKEW) fail("Saat uyuşmuyor; telefonun saatini denetleyin", 401);
    const seen = this.nonces.get(device.id) || new Set();
    if (seen.has(n)) fail("Tekrarlanan istek", 401);
    seen.add(n);
    if (seen.size > 500) seen.delete(seen.values().next().value);
    this.nonces.set(device.id, seen);
    device.lastSeen = Date.now();
    let result;
    try {
      result = { ok: true, data: await this.op(device, msg.op, msg.args || {}) };
    } catch (e) {
      result = { ok: false, error: e.status ? e.message : "İşlem başarısız" };
    }
    return seal(key, `${VERSION}|res|${device.id}`, result);
  }

  async op(device, op, args) {
    const hub = this.hub;
    if (op === "status") {
      let disk = null;
      try {
        const s = await require("node:fs/promises").statfs(hub.root);
        disk = { total: s.blocks * s.bsize, free: s.bavail * s.bsize };
      } catch {
        disk = null;
      }
      const snap = hub.snapshot();
      return {
        hub: { version: snap.version, host: os.hostname(), platform: process.platform, release: os.release() },
        system: { cpus: os.cpus().length, memTotal: os.totalmem(), memFree: os.freemem(), uptime: os.uptime(), disk },
        installed: Object.entries(snap.installed).map(([id, v]) => ({ id, name: v.name, version: v.version, kind: v.kind, enabled: v.enabled })),
        model: { running: snap.model.running, source: snap.model.source },
        jobs: snap.jobs.filter((j) => ["queued", "downloading", "installing"].includes(j.status)).length,
        pending: snap.pending.filter((p) => p.status === "pending").length,
      };
    }
    if (op === "features.get") {
      return Object.fromEntries(Object.keys(appFeatures.definitions.apps).map((id) => [id, appFeatures.resolve(id, hub.state.features?.[id])]));
    }
    if (op === "features.set") {
      const values = await hub.setAppFeatures(String(args.app || ""), args.values);
      hub.log(`${device.name} telefondan ${args.app} özelliklerini değiştirdi`);
      return values;
    }
    if (op === "install") {
      const id = String(args.id || "");
      const item = hub.catalog.find((i) => i.id === id);
      if (!item) fail("Katalogda yok", 404);
      return hub.requestApproval({ id: `mobile:${device.id}`, name: `${device.name} (telefon)` }, `${item.name} kurulsun`, () => hub.install(id));
    }
    if (op === "request") {
      const p = hub.pending.get(String(args.id || ""));
      if (!p || p.clientId !== `mobile:${device.id}`) fail("İstek bulunamadı", 404);
      return { status: p.status, error: p.error || null };
    }
    fail("Bilinmeyen işlem", 404);
  }
}

module.exports = { MobileBridge, deriveKeys, seal, open, hmac, VERSION, PORT };
