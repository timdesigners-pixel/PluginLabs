"use strict";
/* Kanallar: uygulamalardan Hub'a veri akışı ve uygulamalar arası köprü.
   - Yalnızca bellekte tutulur (yeniden başlatmada silinir); kalıcı depoya yazılmaz.
   - Bir istemci yalnızca kendi ad alanındaki (`<ad-alani>.<konu>`) kanallara yayın yapabilir.
   - Okuma: Hub arayüzü her kanalı görür; başka bir istemci yalnızca yayıncının `share` ile açtığı kanalı okur.
   - Boyut, derinlik, anahtar sayısı, süre ve oran sınırları vardır. */
const { EventEmitter } = require("node:events");

const NAME = /^[a-z0-9][a-z0-9-]{1,39}\.[a-z0-9][a-z0-9._-]{0,63}$/;
const NS = /^[a-z0-9][a-z0-9-]{1,39}$/;
const LIMITS = {
  dataChars: 8000,
  depth: 6,
  keys: 40,
  items: 50,
  string: 500,
  ttlMin: 5,
  ttlMax: 86400,
  ttlDefault: 3600,
  perOwner: 16,
  total: 64,
  ratePerMinute: 30,
  share: 8,
};

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function clean(value, depth = 0) {
  if (depth > LIMITS.depth) fail("Veri çok derin");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("Geçersiz sayı");
    return value;
  }
  if (typeof value === "string") {
    if (value.length > LIMITS.string) fail("Metin sınırı aşıldı");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > LIMITS.items) fail("Liste çok uzun");
    return value.map((v) => clean(v, depth + 1));
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > LIMITS.keys) fail("Çok fazla alan");
    const out = {};
    for (const k of keys) {
      if (k === "__proto__" || k === "constructor" || k === "prototype")
        fail("Geçersiz alan adı");
      if (k.length > 60) fail("Alan adı çok uzun");
      out[k] = clean(value[k], depth + 1);
    }
    return out;
  }
  fail("Desteklenmeyen veri türü");
}

class Channels extends EventEmitter {
  constructor({ now = () => Date.now() } = {}) {
    super();
    this.now = now;
    this.map = new Map();
    this.hits = new Map();
    this.setMaxListeners(40);
  }
  static validName(name) {
    return typeof name === "string" && NAME.test(name);
  }
  static validNamespace(ns) {
    return typeof ns === "string" && NS.test(ns);
  }
  static namespaceOf(name) {
    return name.split(".")[0];
  }
  prune() {
    const t = this.now();
    for (const [k, r] of this.map)
      if (r.expiresAt <= t) {
        this.map.delete(k);
        this.emit("closed", { channel: k });
      }
  }
  rate(clientId) {
    const t = this.now(),
      list = (this.hits.get(clientId) || []).filter((x) => t - x < 60000);
    if (list.length >= LIMITS.ratePerMinute)
      fail("Yayın sınırı aşıldı (dakikada 30)", 429);
    list.push(t);
    this.hits.set(clientId, list);
  }
  publish(client, namespace, name, body) {
    if (!Channels.validName(name)) fail("Geçersiz kanal adı");
    if (Channels.namespaceOf(name) !== namespace)
      fail("Yalnızca kendi ad alanınızdaki kanallara yayın yapabilirsiniz", 403);
    if (!body || typeof body !== "object" || Array.isArray(body))
      fail("Geçersiz istek");
    this.prune();
    this.rate(client.id);
    const data = clean(body.data);
    if (JSON.stringify(data).length > LIMITS.dataChars) fail("Veri çok büyük");
    let ttl = body.ttlSeconds ?? LIMITS.ttlDefault;
    if (!Number.isInteger(ttl) || ttl < LIMITS.ttlMin || ttl > LIMITS.ttlMax)
      fail("Süre 5–86400 saniye olmalı");
    let share = body.share ?? [];
    if (
      !Array.isArray(share) ||
      share.length > LIMITS.share ||
      share.some((s) => s !== "*" && !Channels.validNamespace(s))
    )
      fail("Geçersiz paylaşım listesi");
    share = [...new Set(share)];
    const existing = this.map.get(name);
    if (existing && existing.ownerId !== client.id)
      fail("Bu kanal başka bir istemciye ait", 409);
    if (!existing) {
      const own = [...this.map.values()].filter((r) => r.ownerId === client.id).length;
      if (own >= LIMITS.perOwner) fail("İstemci başına en fazla 16 kanal", 429);
      if (this.map.size >= LIMITS.total) fail("Kanal sınırı dolu", 429);
    }
    const t = this.now(),
      record = {
        channel: name,
        namespace,
        ownerId: client.id,
        owner: client.name,
        share,
        seq: (existing?.seq || 0) + 1,
        updatedAt: t,
        expiresAt: t + ttl * 1000,
        data,
      };
    this.map.set(name, record);
    this.emit("publish", record);
    return this.view(record);
  }
  // Dışarıya (istemci/arayüz) verilen biçim: sahip kimliği yok.
  view({ ownerId, ...r }) {
    return r;
  }
  readable(record, readerNamespace) {
    return (
      readerNamespace === record.namespace ||
      record.share.includes("*") ||
      record.share.includes(readerNamespace)
    );
  }
  get(name, readerNamespace) {
    if (!Channels.validName(name)) fail("Geçersiz kanal adı");
    this.prune();
    const r = this.map.get(name);
    if (!r || !this.readable(r, readerNamespace)) fail("Kanal bulunamadı", 404);
    return this.view(r);
  }
  // readerNamespace === null: Hub arayüzü (tümünü görür).
  list(readerNamespace = null) {
    this.prune();
    return [...this.map.values()]
      .filter((r) => readerNamespace === null || this.readable(r, readerNamespace))
      .map((r) => this.view(r))
      .sort((a, b) => a.channel.localeCompare(b.channel));
  }
  close(name) {
    const had = this.map.delete(name);
    if (had) this.emit("closed", { channel: name });
    return had;
  }
  dropOwner(clientId) {
    for (const [k, r] of [...this.map])
      if (r.ownerId === clientId) this.close(k);
    this.hits.delete(clientId);
  }
}

module.exports = { Channels, LIMITS, NAME, NS };
