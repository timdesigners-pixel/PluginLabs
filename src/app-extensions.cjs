const fs = require("node:fs/promises"),
  path = require("node:path"),
  { spawn } = require("node:child_process");
const ID = /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i;
class AppExtensions {
  constructor(hub) {
    this.hub = hub;
    this.running = false;
    this.items = [];
    this.lastScan = null;
  }
  async connect(file) {
    const real = await fs.realpath(file),
      base = path.basename(real).toLowerCase();
    if (
      ![
        "code",
        "code-insiders",
        "codium",
        "code.exe",
        "code - insiders.exe",
        "vscodium.exe",
      ].includes(base)
    )
      throw Error("VS Code / VSCodium uygulama dosyasını seçin");
    let args = [];
    if (base.endsWith(".exe")) {
      const cli = path.join(
        path.dirname(real),
        "resources",
        "app",
        "out",
        "cli.js",
      );
      await fs.access(cli);
      args = [cli];
    }
    const previous = this.hub.state.settings.codeHost;
    this.hub.state.settings.codeHost = {
      file: real,
      args,
      name: base.includes("codium") ? "VSCodium" : "VS Code",
    };
    try {
      await this.scan();
      await this.hub.save();
    } catch (e) {
      this.hub.state.settings.codeHost = previous;
      throw e;
    }
    this.hub.log("Uygulama eklenti yöneticisi bağlandı");
    return this.snapshot();
  }
  snapshot() {
    const host = this.hub.state.settings.codeHost;
    return {
      connected: !!host,
      name: host?.name,
      items: this.items,
      lastScan: this.lastScan,
      running: this.running,
    };
  }
  async run(args) {
    const host = this.hub.state.settings.codeHost;
    if (!host) throw Error("Önce uygulama dosyasını seçin");
    if (this.running) throw Error("Önceki uygulama işlemi sürüyor");
    this.running = true;
    this.hub.emit("change");
    try {
      return await new Promise((resolve, reject) => {
        let output = "",
          failed = false;
        const p = spawn(host.file, [...host.args, ...args], {
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
          env: {
            ...process.env,
            ...(host.args.length ? { ELECTRON_RUN_AS_NODE: "1" } : {}),
          },
        });
        const timer = setTimeout(() => {
          failed = true;
          p.kill();
          reject(Error("Uygulama işlemi zaman aşımına uğradı"));
        }, 120000);
        const collect = (c) => {
          output += c.toString();
          if (output.length > 1000000 && !failed) {
            failed = true;
            p.kill();
            clearTimeout(timer);
            reject(Error("Uygulama yanıtı çok büyük"));
          }
        };
        p.stdout.on("data", collect);
        p.stderr.on("data", collect);
        p.on("error", (e) => {
          clearTimeout(timer);
          reject(e);
        });
        p.on("exit", (code) => {
          clearTimeout(timer);
          if (failed) return;
          if (code !== 0)
            reject(
              Error(
                "Uygulama eklenti işlemi tamamlanamadı; uygulamanın bağlantısını ve izinlerini kontrol edin",
              ),
            );
          else resolve(output);
        });
      });
    } finally {
      this.running = false;
      this.hub.emit("change");
    }
  }
  async scan() {
    const text = await this.run(["--list-extensions", "--show-versions"]);
    this.items = text
      .split(/\r?\n/)
      .map((line) => line.trim().match(/^([a-z0-9-]+\.[a-z0-9-]+)@([^\s]+)$/i))
      .filter(Boolean)
      .map((m) => ({ id: m[1], version: m[2] }));
    this.lastScan = new Date().toISOString();
    this.hub.emit("change");
    return this.snapshot();
  }
  async action(action, id) {
    if (!ID.test(id) || id.length > 150)
      throw Error("Eklenti kimliği yayımcı.ad biçiminde olmalı");
    if (!["install", "update", "uninstall"].includes(action))
      throw Error("Desteklenmeyen uygulama eklenti işlemi");
    if (action !== "install" && !this.items.some((i) => i.id === id))
      throw Error("Önce envanteri yenileyin");
    await this.run(
      action === "uninstall"
        ? ["--uninstall-extension", id]
        : [
            "--install-extension",
            id,
            ...(action === "update" ? ["--force"] : []),
          ],
    );
    this.hub.log(`${this.hub.state.settings.codeHost.name} · ${id}: ${action}`);
    return this.scan();
  }
  async disconnect() {
    delete this.hub.state.settings.codeHost;
    this.items = [];
    this.lastScan = null;
    await this.hub.save();
  }
}
module.exports = { AppExtensions };
