const crypto = require("node:crypto");
const BROWSERS = ["Chrome", "Opera", "Edge", "Brave", "Chromium"];
const EXTENSION_ID = /^[a-p]{32}$/;
function error(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function validateExtension(value) {
  if (!value || !EXTENSION_ID.test(value.id)) error("Geçersiz eklenti kimliği");
  return {
    id: value.id,
    name: String(value.name || value.id).slice(0, 150),
    version: String(value.version || "").slice(0, 50),
    description: String(value.description || "").slice(0, 500),
    enabled: value.enabled === true,
    mayDisable: value.mayDisable === true,
    isApp: value.isApp === true,
    type: String(value.type || "extension").slice(0, 50),
    installType: String(value.installType || "").slice(0, 50),
    permissions: Array.isArray(value.permissions)
      ? value.permissions
          .filter((p) => typeof p === "string")
          .slice(0, 100)
          .map((p) => p.slice(0, 150))
      : [],
    hostPermissions: Array.isArray(value.hostPermissions)
      ? value.hostPermissions
          .filter((p) => typeof p === "string")
          .slice(0, 100)
          .map((p) => p.slice(0, 300))
      : [],
  };
}
class ExtensionManager {
  constructor(hub) {
    this.hub = hub;
    this.browsers = new Map();
    this.commands = new Map();
  }
  snapshot() {
    return {
      browsers: [...this.browsers.values()]
        .filter((b) => this.hub.state.clients.some((c) => c.id === b.clientId))
        .map((b) => ({ ...b, online: Date.now() - b.lastSeen < 75000 })),
      commands: [...this.commands.values()]
        .slice(-100)
        .map((c) => ({
          ...c,
          status:
            ["pending", "awaiting-confirmation"].includes(c.status) &&
            Date.now() - c.createdAt > 300000
              ? "expired"
              : c.status,
        })),
    };
  }
  async createBrowser(name, extensionId) {
    if (!BROWSERS.includes(name) || !EXTENSION_ID.test(extensionId))
      error("Tarayıcı ve 32 harfli bağlantı eklentisi kimliği gerekli");
    const result = await this.hub.createClient(`${name} · Eklenti yöneticisi`, [
      "browser.manage",
    ]);
    const client = this.hub.state.clients.find((c) => c.id === result.id);
    client.browser = {
      name,
      extensionId,
      origin: `chrome-extension://${extensionId}`,
    };
    await this.hub.save();
    return result;
  }
  checkOrigin(req) {
    const c = this.hub.authenticate(req, "browser.manage");
    if (!c.browser || req.headers.origin !== c.browser.origin)
      error("Tarayıcı köprüsü kimliği eşleşmiyor", 403);
    return c;
  }
  sync(client, body) {
    if (!Array.isArray(body.extensions) || body.extensions.length > 500)
      error("Eklenti envanteri sınırı aşıldı");
    const entries = body.extensions.map(validateExtension);
    if (new Set(entries.map((e) => e.id)).size !== entries.length)
      error("Tekrarlayan eklenti kimliği");
    if (
      body.results !== undefined &&
      (!Array.isArray(body.results) || body.results.length > 30)
    )
      error("Geçersiz sonuçlar");
    for (const result of body.results || []) {
      const c = this.commands.get(result.id);
      if (
        !c ||
        c.clientId !== client.id ||
        !["pending", "awaiting-confirmation"].includes(c.status)
      )
        continue;
      if (Date.now() - c.createdAt > 300000) {
        c.status = "expired";
        continue;
      }
      c.status = result.ok === true ? "complete" : "failed";
      c.error =
        result.ok === true
          ? undefined
          : String(result.error || "Tarayıcı işlemi tamamlanamadı").slice(
              0,
              300,
            );
      this.hub.log(
        `${client.browser.name} · ${c.extensionName}: ${c.status === "complete" ? "işlem tamamlandı" : "işlem başarısız"}`,
      );
    }
    this.browsers.set(client.id, {
      clientId: client.id,
      name: client.browser.name,
      bridgeId: client.browser.extensionId,
      lastSeen: Date.now(),
      extensions: entries,
    });
    const commands = [];
    for (const c of this.commands.values()) {
      if (
        c.clientId !== client.id ||
        !["pending", "awaiting-confirmation"].includes(c.status)
      )
        continue;
      if (Date.now() - c.createdAt > 300000) {
        c.status = "expired";
        continue;
      }
      c.status = "awaiting-confirmation";
      commands.push({
        id: c.id,
        extensionId: c.extensionId,
        extensionName: c.extensionName,
        action: c.action,
        createdAt: c.createdAt,
      });
    }
    this.hub.emit("change");
    return { commands: commands.slice(0, 30), hubVersion: "0.2.0" };
  }
  request(clientId, extensionId, action) {
    const b = this.browsers.get(clientId);
    if (!b || Date.now() - b.lastSeen > 75000)
      error("Tarayıcı çevrimdışı; bağlantı eklentisini açın");
    if (!["enable", "disable", "uninstall", "options"].includes(action))
      error("Desteklenmeyen eklenti işlemi");
    const ext = b.extensions.find((e) => e.id === extensionId);
    if (!ext) error("Eklenti bulunamadı");
    if (extensionId === b.bridgeId)
      error("Bağlantı eklentisini kendi tarayıcı ekranından yönetin");
    if (["enable", "disable", "uninstall"].includes(action) && !ext.mayDisable)
      error("Bu eklenti tarayıcı veya kurum politikasıyla yönetiliyor");
    if (
      [...this.commands.values()].some(
        (c) =>
          c.clientId === clientId &&
          c.extensionId === extensionId &&
          ["pending", "awaiting-confirmation"].includes(c.status) &&
          Date.now() - c.createdAt < 300000,
      )
    )
      error("Bu eklenti için bekleyen bir işlem var", 409);
    const c = {
      id: crypto.randomUUID(),
      clientId,
      extensionId,
      extensionName: ext.name,
      action,
      status: "pending",
      createdAt: Date.now(),
    };
    this.commands.set(c.id, c);
    if (this.commands.size > 200) {
      for (const [id, old] of this.commands) {
        if (
          Date.now() - old.createdAt > 300000 ||
          !["pending", "awaiting-confirmation"].includes(old.status)
        )
          this.commands.delete(id);
        if (this.commands.size <= 200) break;
      }
    }
    this.hub.log(`${b.name} · ${ext.name}: tarayıcı onayı bekleniyor`);
    return c;
  }
}
module.exports = { ExtensionManager, BROWSERS, EXTENSION_ID };
