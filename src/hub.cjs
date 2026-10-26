require("./network.cjs");
const fs = require("node:fs/promises"),
  fss = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  crypto = require("node:crypto"),
  http = require("node:http"),
  { EventEmitter } = require("node:events"),
  { spawn } = require("node:child_process");
const { catalog: defaults } = require("./catalog.cjs");
const digest = (s) => crypto.createHash("sha256").update(s).digest("hex");
const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const scopes = [
  "catalog.read",
  "resources.read",
  "jobs.read",
  "downloads.request",
  "apps.launch",
  "mymind.chat",
  "providers.register",
  "actions.invoke",
  "browser.manage",
];
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function validId(id) {
  if (typeof id !== "string" || !idPattern.test(id)) fail("Geçersiz kimlik");
  return id;
}
function boundedText(value, max = 100000) {
  if (typeof value !== "string" || value.length > max)
    fail("Metin sınırı aşıldı");
  return value;
}
async function atomic(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + "." + crypto.randomUUID() + ".tmp";
  await fs.writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.rename(temp, file);
}
async function limitedJSON(response, max = 2e6) {
  if (!response.ok) fail(`Sunucu yanıtı: ${response.status}`, 502);
  let size = 0,
    parts = [];
  for await (const c of response.body) {
    size += c.length;
    if (size > max) fail("Yanıt boyutu aşıldı", 502);
    parts.push(c);
  }
  return JSON.parse(Buffer.concat(parts).toString());
}
function versionCompare(a, b) {
  const clean = (s) => String(s).replace(/^v/, "").split(".").map(Number);
  const x = clean(a),
    y = clean(b);
  if ([...x, ...y].some((n) => !Number.isSafeInteger(n) || n < 0)) return 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
function safeEntry(name) {
  if (
    !name ||
    name.includes("\\") ||
    name.startsWith("/") ||
    name
      .split("/")
      .some(
        (x) =>
          x === ".." ||
          x === "." ||
          x.includes(":") ||
          /[\x00-\x1f]/.test(x) ||
          /[. ]$/.test(x) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(x),
      )
  )
    fail("Güvenli olmayan arşiv yolu");
  return name;
}
async function extract(archive, dest, format) {
  await fs.mkdir(dest, { recursive: true });
  let entries = 0,
    total = 0;
  const names = new Set();
  function accept(name, size) {
    safeEntry(name);
    const key = name.toLowerCase().replace(/\/$/, "");
    if (names.has(key)) fail("Tekrarlayan arşiv yolu");
    names.add(key);
    if (++entries > 20000 || (total += size) > 2e9) fail("Arşiv sınırı aşıldı");
  }
  if (format === "zip") {
    const yauzl = require("yauzl");
    await new Promise((resolve, reject) => {
      yauzl.open(archive, { lazyEntries: true }, (err, zip) => {
        if (err) return reject(err);
        let failed = false;
        const abort = (e) => {
          if (!failed) {
            failed = true;
            zip.close();
            reject(e);
          }
        };
        zip.on("error", abort);
        zip.on("end", resolve);
        zip.on("entry", (entry) => {
          (async () => {
            accept(entry.fileName, entry.uncompressedSize);
            const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
            if ((mode & 0o170000) === 0o120000)
              fail("Arşiv bağlantıları desteklenmiyor");
            const target = path.join(dest, entry.fileName);
            if (entry.fileName.endsWith("/"))
              await fs.mkdir(target, { recursive: true });
            else {
              await fs.mkdir(path.dirname(target), { recursive: true });
              const stream = await new Promise((r, j) =>
                zip.openReadStream(entry, (e, s) => (e ? j(e) : r(s))),
              );
              await require("node:stream/promises").pipeline(
                stream,
                fss.createWriteStream(target, { flags: "wx", mode: 0o600 }),
              );
            }
            zip.readEntry();
          })().catch(abort);
        });
        zip.readEntry();
      });
    });
  } else if (format === "tar") {
    let invalid;
    const links = [];
    await require("tar").x({
      file: archive,
      cwd: dest,
      strict: true,
      preservePaths: false,
      filter: (name, entry) => {
        try {
          accept(name, entry.size || 0);
          if (entry.type === "SymbolicLink") {
            safeEntry(entry.linkpath);
            if (entry.linkpath.includes("/"))
              fail("Arşiv bağlantıları aynı klasörde olmalı");
            links.push({ name, target: entry.linkpath });
            return false;
          }
          if (!["File", "Directory"].includes(entry.type))
            fail("Arşiv bağlantıları desteklenmiyor");
          return !invalid;
        } catch (e) {
          invalid = e;
          return false;
        }
      },
    });
    if (invalid) throw invalid;
    let pending = links;
    for (let round = 0; pending.length && round < 32; round++) {
      const next = [];
      for (const link of pending) {
        const file = path.join(dest, link.name),
          target = path.join(path.dirname(file), link.target);
        try {
          const real = await fs.realpath(target);
          if (
            !real.startsWith(path.resolve(dest) + path.sep) ||
            !(await fs.stat(real)).isFile()
          )
            fail("Geçersiz arşiv bağlantısı");
          await fs.symlink(link.target, file);
        } catch (e) {
          if (e.code === "ENOENT") next.push(link);
          else throw e;
        }
      }
      if (next.length === pending.length)
        fail("Çözümlenemeyen arşiv bağlantısı");
      pending = next;
    }
    if (pending.length) fail("Arşiv bağlantı zinciri çok uzun");
  } else fail("Arşiv türü desteklenmiyor");
}
class Hub extends EventEmitter {
  constructor(root, options = {}) {
    super();
    this.root = root;
    this.options = options;
    this.catalog = structuredClone(options.catalog || defaults);
    this.jobs = new Map();
    this.pending = new Map();
    this.providers = new Map();
    this.controllers = new Map();
    this.tasks = new Set();
    this.extensions = new (require("./extensions.cjs").ExtensionManager)(this);
    this.appExtensions = new (require("./app-extensions.cjs").AppExtensions)(
      this,
    );
    this.model = null;
    this.aiActive = false;
    this.closed = false;
  }
  async init() {
    await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
    try {
      this.state = JSON.parse(
        await fs.readFile(path.join(this.root, "state.json"), "utf8"),
      );
      if (this.state.schema !== 1) fail("Veri sürümü desteklenmiyor");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      this.state = {
        schema: 1,
        installed: {},
        clients: [],
        activity: [],
        settings: { apiEnabled: true, modelContext: 4096 },
      };
      await this.save();
    }
    this.catalog.push(...(this.state.customCatalog || []));
    this.log("Merkez hazır");
    return this;
  }
  async save() {
    // Serialize snapshots before I/O so simultaneous writes cannot replace newer state.
    const snapshot = structuredClone(this.state);
    this.saving = (this.saving || Promise.resolve())
      .catch(() => {})
      .then(() => atomic(path.join(this.root, "state.json"), snapshot));
    await this.saving;
  }
  log(message) {
    this.state.activity.unshift({
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      message,
    });
    this.state.activity = this.state.activity.slice(0, 150);
    this.emit("change");
    this.save().catch(() => {});
  }
  item(id) {
    validId(id);
    const item = this.catalog.find((i) => i.id === id);
    if (!item) fail("Katalog kaydı bulunamadı", 404);
    return item;
  }
  installed(id) {
    validId(id);
    const item = this.state.installed[id];
    if (!item) fail("Önce yükleyin", 404);
    return item;
  }
  folder(id, version) {
    validId(id);
    if (!/^[a-zA-Z0-9.-]{1,60}$/.test(version) || version.includes(".."))
      fail("Geçersiz sürüm");
    return path.join(this.root, "packages", id, version);
  }
  snapshot() {
    const { codeHost, ...publicSettings } = this.state.settings;
    return {
      extensions: this.extensions.snapshot(),
      appExtensions: this.appExtensions.snapshot(),
      ideas: require("../resources/notion-catalog.json").items.map(
        ({ spec, ...i }) => i,
      ),
      catalog: this.catalog.map((i) => ({ ...i, payload: undefined })),
      installed: this.state.installed,
      jobs: [...this.jobs.values()],
      activity: this.state.activity,
      clients: this.state.clients.map(({ hash, ...c }) => c),
      pending: [...this.pending.values()].map(({ run, ...p }) => p),
      providers: [...this.providers.values()]
        .filter((p) => p.expires > Date.now())
        .map(({ secret, url, ...p }) => p),
      model: {
        running: !!this.model?.healthy,
        starting: !!this.model && !this.model.healthy,
        error: this.modelError || null,
      },
      api: { port: this.port || null, running: !!this.server },
      settings: publicSettings,
    };
  }
  async install(id) {
    if (this.closed) fail("Merkez kapanıyor", 503);
    const item = this.item(id);
    if (item.supported === false) fail("Bu işletim sistemi için paket yok");
    if (
      [...this.jobs.values()].some(
        (j) =>
          j.item === id &&
          ["queued", "downloading", "installing"].includes(j.status),
      )
    )
      fail("İndirme zaten sürüyor", 409);
    if (
      this.state.installed[id] &&
      versionCompare(item.version, this.state.installed[id].version) <= 0
    )
      fail("Bu sürüm veya daha yenisi zaten yüklü", 409);
    const job = {
      id: crypto.randomUUID(),
      item: id,
      name: item.name,
      status: "queued",
      bytes: 0,
      total: item.size || 0,
      time: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    const controller = new AbortController();
    this.controllers.set(job.id, controller);
    const task = this.doInstall(structuredClone(item), job, controller);
    this.tasks.add(task);
    task.finally(() => this.tasks.delete(task)).catch(() => {});
    return job;
  }
  async doInstall(item, job, controller) {
    const target = this.folder(item.id, item.version),
      stage = target + ".stage-" + job.id;
    let timer;
    try {
      await fs.mkdir(stage, { recursive: true, mode: 0o700 });
      if (item.bundled) {
        await atomic(path.join(stage, "resource.json"), item.payload);
      } else {
        if (
          !/^[a-f0-9]{64}$/.test(item.sha256) ||
          !Number.isSafeInteger(item.size) ||
          item.size < 1
        )
          fail("Doğrulanmış paket özeti eksik");
        const url = new URL(item.url);
        if (url.protocol !== "https:" && !this.options.allowTestHTTP)
          fail("HTTPS gerekli");
        job.status = "downloading";
        this.emit("change");
        timer = setTimeout(() => controller.abort(), 30 * 60 * 1000);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) fail(`İndirme yanıtı: ${response.status}`);
        const archive = path.join(stage, item.file);
        const handle = await fs.open(archive, "wx", 0o600);
        const hash = crypto.createHash("sha256");
        try {
          for await (const chunk of response.body) {
            if (controller.signal.aborted) fail("İptal edildi");
            job.bytes += chunk.length;
            if (job.bytes > item.size) fail("Dosya beklenenden büyük");
            hash.update(chunk);
            await handle.write(chunk);
            this.emit("progress", job);
          }
        } finally {
          await handle.close();
        }
        if (job.bytes !== item.size || hash.digest("hex") !== item.sha256)
          fail("SHA-256 veya boyut doğrulaması başarısız");
        if (["zip", "tar"].includes(item.format)) {
          job.status = "installing";
          this.emit("change");
          await extract(archive, path.join(stage, "content"), item.format);
          await fs.unlink(archive);
        }
      }
      if (controller.signal.aborted) fail("İptal edildi");
      if (["llama-engine", "mymind-lite"].includes(item.id) && this.model)
        await this.stopModel();
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.rm(target, { recursive: true, force: true });
      await fs.rename(stage, target);
      const old = this.state.installed[item.id];
      this.state.installed[item.id] = {
        version: item.version,
        enabled: true,
        kind: item.kind,
        name: item.name,
        file: item.file,
        previous: old?.version || null,
        settings: Object.fromEntries(
          Object.entries(item.settings || {}).map(([k, v]) => [
            k,
            typeof old?.settings?.[k] === typeof v ? old.settings[k] : v,
          ]),
        ),
        installedAt: new Date().toISOString(),
      };
      await this.save();
      job.status = "complete";
      this.log(`${item.name} ${item.version} yüklendi`);
    } catch (e) {
      job.status = controller.signal.aborted ? "cancelled" : "failed";
      job.error = controller.signal.aborted
        ? "İndirme iptal edildi"
        : e.message;
      await fs.rm(stage, { recursive: true, force: true });
      this.log(`${item.name}: ${job.error}`);
    } finally {
      clearTimeout(timer);
      this.controllers.delete(job.id);
      this.emit("change");
    }
  }
  cancel(jobId) {
    const c = this.controllers.get(jobId);
    if (!c) fail("Etkin indirme bulunamadı");
    c.abort();
  }
  async remove(id) {
    const item = this.installed(id);
    if (id === "mymind-lite" || id === "llama-engine") await this.stopModel();
    if (
      [...this.jobs.values()].some(
        (j) => j.item === id && this.controllers.has(j.id),
      )
    )
      fail("Önce indirmeyi iptal edin");
    await fs.rm(path.join(this.root, "packages", validId(id)), {
      recursive: true,
      force: true,
    });
    delete this.state.installed[id];
    await this.save();
    this.log(`${item.name} kaldırıldı`);
  }
  async toggle(id, enabled) {
    const item = this.installed(id);
    if (typeof enabled !== "boolean") fail("Geçersiz durum");
    if (!enabled && ["mymind-lite", "llama-engine"].includes(id))
      await this.stopModel();
    item.enabled = enabled;
    await this.save();
    this.log(`${item.name}: ${enabled ? "etkin" : "devre dışı"}`);
  }
  async resourceSettings(id, settings) {
    const item = this.installed(id);
    if (!["asset", "template", "plugin", "library"].includes(item.kind))
      fail("Bu paketin kaynak ayarları yok");
    if (
      !settings ||
      Array.isArray(settings) ||
      typeof settings !== "object" ||
      JSON.stringify(settings).length > 4096
    )
      fail("Geçersiz ayar");
    const allowed = this.item(id).settings || {};
    for (const [k, v] of Object.entries(settings)) {
      if (
        !(k in allowed) ||
        typeof v !== typeof allowed[k] ||
        String(v).length > 200
      )
        fail("Desteklenmeyen ayar");
    }
    item.settings = { ...item.settings, ...settings };
    await this.save();
  }
  async rollback(id) {
    const item = this.installed(id);
    if (!item.previous) fail("Önceki sürüm yok");
    await fs.access(this.folder(id, item.previous));
    if (["mymind-lite", "llama-engine"].includes(id)) await this.stopModel();
    [item.version, item.previous] = [item.previous, item.version];
    await this.save();
    this.log(`${item.name} önceki sürüme döndü`);
  }
  async launch(id) {
    const record = this.installed(id),
      item = this.item(id);
    if (record.kind !== "app" || !record.enabled) fail("Uygulama etkin değil");
    if (item.platform && item.platform !== process.platform)
      fail("Bu uygulama Windows üzerinde açılır");
    const file = path.join(this.folder(id, record.version), record.file);
    await fs.access(file);
    const child = spawn(file, [], {
      detached: true,
      stdio: "ignore",
      shell: false,
    });
    await new Promise((r, j) => {
      child.once("spawn", r);
      child.once("error", j);
    });
    child.unref();
    this.log(`${item.name} açıldı`);
  }
  async checkUpdates() {
    const results = [];
    for (const item of this.catalog.filter((i) => i.repo)) {
      try {
        const data = await limitedJSON(
          await fetch(
            `https://api.github.com/repos/${item.repo}/releases/latest`,
            {
              headers: { Accept: "application/vnd.github+json" },
              signal: AbortSignal.timeout(15000),
            },
          ),
        );
        const version = data.tag_name.replace(/^v/, "");
        const newer =
          versionCompare(
            version,
            this.state.installed[item.id]?.version || item.version,
          ) > 0;
        let ready = false;
        if (newer) {
          const asset = data.assets.find((a) =>
            item.id === "mind-palace"
              ? /Tasinabilir.*x64\.exe$/.test(a.name)
              : a.name === "LeoHelper.exe",
          );
          if (
            asset &&
            /^sha256:[a-f0-9]{64}$/.test(asset.digest || "") &&
            asset.browser_download_url.startsWith(
              `https://github.com/${item.repo}/releases/download/`,
            )
          ) {
            Object.assign(item, {
              version,
              url: asset.browser_download_url,
              size: asset.size,
              sha256: asset.digest.slice(7),
            });
            ready = true;
          }
        }
        results.push({ id: item.id, version, available: newer, ready });
      } catch (e) {
        results.push({ id: item.id, error: e.message });
      }
    }
    this.updateResults = results;
    this.log("Güncelleme denetimi tamamlandı");
    return results;
  }
  async createClient(name, requested) {
    boundedText(name, 80);
    if (
      !name.trim() ||
      !Array.isArray(requested) ||
      requested.some((s) => !scopes.includes(s))
    )
      fail("Geçersiz istemci veya izin");
    const token = "plh_" + crypto.randomBytes(32).toString("hex");
    const client = {
      id: crypto.randomUUID(),
      name,
      scopes: [...new Set(requested)],
      hash: digest(token),
      createdAt: new Date().toISOString(),
    };
    this.state.clients.push(client);
    await this.save();
    this.log(`${name} için API erişimi oluşturuldu`);
    return { id: client.id, token };
  }
  async revokeClient(id) {
    this.state.clients = this.state.clients.filter((c) => c.id !== id);
    for (const [key, p] of this.providers)
      if (p.clientId === id) this.providers.delete(key);
    for (const p of this.pending.values())
      if (p.clientId === id) {
        p.status = "rejected";
        delete p.run;
      }
    await this.save();
    this.log("API istemcisi iptal edildi");
  }
  authenticate(req, scope) {
    const raw = req.headers.authorization || "";
    if (!raw.startsWith("Bearer ") || raw.length > 200)
      fail("API anahtarı gerekli", 401);
    const hash = Buffer.from(digest(raw.slice(7)));
    const c = this.state.clients.find((c) =>
      crypto.timingSafeEqual(Buffer.from(c.hash), hash),
    );
    if (!c) fail("Geçersiz API anahtarı", 401);
    if (scope && !c.scopes.includes(scope)) fail("Bu işlem için izin yok", 403);
    return c;
  }
  requestApproval(client, label, run) {
    if (
      [...this.pending.values()].filter((p) => p.status === "pending").length >=
      40
    )
      fail("Onay kuyruğu dolu", 429);
    const request = {
      id: crypto.randomUUID(),
      clientId: client.id,
      clientName: client.name,
      label,
      status: "pending",
      createdAt: Date.now(),
      run,
    };
    this.pending.set(request.id, request);
    while (this.pending.size > 100) {
      const [id, p] = this.pending.entries().next().value;
      if (p.status === "pending") break;
      this.pending.delete(id);
    }
    this.emit("change");
    return { requestId: request.id, status: "pending" };
  }
  async approve(id, allow) {
    const p = this.pending.get(id);
    if (!p || p.status !== "pending") fail("Bekleyen işlem yok");
    if (Date.now() - p.createdAt > 300000) {
      p.status = "expired";
      delete p.run;
      fail("Onay süresi doldu");
    }
    p.status = allow ? "running" : "rejected";
    const run = p.run;
    delete p.run;
    try {
      if (allow) {
        p.result = await run();
        p.status = "complete";
      }
    } catch (e) {
      p.status = "failed";
      p.error = e.message;
    }
    this.log(`${p.label}: ${p.status}`);
    return p.result;
  }
  async importPack(data) {
    if (
      !data ||
      typeof data !== "object" ||
      JSON.stringify(data).length > 2000000
    )
      fail("Paket en fazla 2 MB olabilir");
    const id = validId(data.id);
    if (!id.startsWith("custom-")) fail("Paket kimliği custom- ile başlamalı");
    if (!["asset", "template", "library", "plugin"].includes(data.kind))
      fail("Yalnızca veri ve görünüm paketleri içe aktarılabilir");
    if (!/^\d+\.\d+\.\d+$/.test(data.version || ""))
      fail("Sürüm x.y.z biçiminde olmalı");
    const name = boundedText(data.name, 80),
      description = boundedText(data.description || "", 500);
    if (
      !name.trim() ||
      !data.payload ||
      typeof data.payload !== "object" ||
      Array.isArray(data.payload)
    )
      fail("Geçersiz paket içeriği");
    const settings = data.settings || {};
    if (
      typeof settings !== "object" ||
      Array.isArray(settings) ||
      Object.keys(settings).length > 20
    )
      fail("Geçersiz ayarlar");
    for (const [k, v] of Object.entries(settings)) {
      if (
        !/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k) ||
        !["string", "boolean"].includes(typeof v) ||
        String(v).length > 200
      )
        fail("Ayarlar kısa metin veya onay kutusu olmalı");
    }
    const existing = this.catalog.find((i) => i.id === id);
    if (existing && versionCompare(data.version, existing.version) <= 0)
      fail("Daha yeni bir paket sürümü gerekli");
    const item = {
      id,
      name,
      description,
      version: data.version,
      kind: data.kind,
      bundled: true,
      payload: data.payload,
      settings,
      supported: true,
      custom: true,
    };
    if (existing) this.catalog[this.catalog.indexOf(existing)] = item;
    else this.catalog.push(item);
    this.state.customCatalog = this.catalog.filter((i) => i.custom);
    await this.save();
    return this.install(id);
  }
  async readResource(id) {
    const i = this.installed(id);
    if (
      !i.enabled ||
      !["asset", "template", "library", "plugin"].includes(i.kind)
    )
      fail("Kaynak etkin değil");
    return JSON.parse(
      await fs.readFile(
        path.join(this.folder(id, i.version), "resource.json"),
        "utf8",
      ),
    );
  }
  async findFile(folder, name) {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name === name) return path.join(folder, name);
      if (e.isDirectory()) {
        const found = await this.findFile(path.join(folder, e.name), name);
        if (found) return found;
      }
    }
    return null;
  }
  async startModel() {
    if (this.model) fail("Model zaten çalışıyor veya başlatılıyor", 409);
    const engine = this.installed("llama-engine"),
      model = this.installed("mymind-lite");
    if (!engine.enabled || !model.enabled)
      fail("Motor ve modeli etkinleştirin");
    const binary = await this.findFile(
      path.join(this.folder("llama-engine", engine.version), "content"),
      process.platform === "win32" ? "llama-server.exe" : "llama-server",
    );
    if (!binary) fail("Model sunucusu bulunamadı");
    if (process.platform !== "win32") await fs.chmod(binary, 0o700);
    const key = crypto.randomBytes(32).toString("hex");
    const keyfile = path.join(this.root, "model-session.key");
    await fs.writeFile(keyfile, key, { mode: 0o600 });
    this.modelError = null;
    const args = [
      "--model",
      path.join(this.folder("mymind-lite", model.version), model.file),
      "--host",
      "127.0.0.1",
      "--port",
      "8765",
      "--ctx-size",
      String(this.state.settings.modelContext),
      "--parallel",
      "1",
      "--n-predict",
      "512",
      "--api-key-file",
      keyfile,
      "--no-webui",
    ];
    const proc = spawn(binary, args, {
      cwd: path.dirname(binary),
      stdio: ["ignore", "ignore", "pipe"],
      shell: false,
      env: { ...process.env, LD_LIBRARY_PATH: path.dirname(binary) },
    });
    const own = { proc, key, healthy: false };
    this.model = own;
    let errors = "";
    proc.stderr.on("data", (chunk) => {
      errors = (errors + chunk.toString()).slice(-3000);
    });
    proc.on("error", (e) => {
      this.modelError = e.message;
    });
    proc.on("exit", () => {
      if (this.model === own) {
        this.model = null;
        this.modelError = own.stopping
          ? null
          : "Motor durdu. İşletim sistemi uyumluluğunu ve model dosyasını kontrol edin.";
        this.emit("change");
      }
      fs.unlink(keyfile).catch(() => {});
    });
    this.emit("change");
    try {
      const end = Date.now() + 120000;
      while (Date.now() < end) {
        if (proc.exitCode !== null || proc.signalCode || this.model !== own)
          fail(this.modelError || "Model başlatılamadı");
        try {
          const response = await fetch("http://127.0.0.1:8765/health", {
            headers: { Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(1500),
          });
          if (response.ok) {
            own.healthy = true;
            this.log("My Mind yerel sunucusu hazır");
            return;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 350));
      }
      fail("Model başlatma süresi doldu");
    } catch (e) {
      await this.stopModel();
      this.modelError = e.message;
      throw e;
    }
  }
  async stopModel() {
    const own = this.model;
    if (!own) return;
    own.stopping = true;
    own.healthy = false;
    own.proc.kill();
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        own.proc.kill("SIGKILL");
        resolve();
      }, 5000);
      own.proc.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      if (own.proc.exitCode !== null) {
        clearTimeout(timer);
        resolve();
      }
    });
    if (this.model === own) this.model = null;
    this.emit("change");
  }
  async chat(body, signal) {
    if (!this.model?.healthy) fail("Önce My Mind motorunu başlatın", 503);
    if (this.aiActive) fail("My Mind şu anda meşgul", 429);
    if (body.stream) fail("Bu sürümde akış desteklenmiyor");
    if (
      !Array.isArray(body.messages) ||
      body.messages.length < 1 ||
      body.messages.length > 24
    )
      fail("Geçersiz mesajlar");
    let length = 0;
    const messages = body.messages.map((m) => {
      if (!["system", "user", "assistant"].includes(m.role))
        fail("Geçersiz rol");
      length += boundedText(m.content, 12000).length;
      return { role: m.role, content: m.content };
    });
    if (length > 16000) fail("Mesajlar çok uzun");
    const tokens = body.max_tokens ?? 256;
    if (!Number.isInteger(tokens) || tokens < 1 || tokens > 512)
      fail("Çıktı sınırı 1–512");
    this.aiActive = true;
    try {
      const result = await limitedJSON(
        await fetch("http://127.0.0.1:8765/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.model.key}`,
          },
          body: JSON.stringify({
            model: "mymind-lite",
            messages,
            max_tokens: tokens,
            temperature: 0.4,
            stream: false,
            chat_template_kwargs: { enable_thinking: false },
          }),
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(120000)])
            : AbortSignal.timeout(120000),
        }),
      );
      return {
        id: result.id,
        object: "chat.completion",
        created: result.created,
        model: "mymind-lite",
        choices: result.choices,
        usage: result.usage,
      };
    } finally {
      this.aiActive = false;
    }
  }
  async registerProvider(client, body) {
    const id = validId(body.id);
    if (!Array.isArray(body.actions) || body.actions.length > 30)
      fail("Geçersiz işlemler");
    const actions = body.actions.map((a) => ({
      id: validId(a.id),
      label: boundedText(a.label, 80),
      write: a.write !== false,
    }));
    if (new Set(actions.map((a) => a.id)).size !== actions.length)
      fail("Tekrarlayan işlem");
    let url;
    try {
      url = new URL(body.url);
    } catch {
      fail("Geçersiz sağlayıcı URL");
    }
    if (
      url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1" ||
      !url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      fail("Sağlayıcı yalnızca 127.0.0.1 üzerinde çalışabilir");
    if (Number(url.port) === this.port) fail("Merkez sağlayıcı olamaz");
    if (typeof body.secret !== "string" || !/^[a-f0-9]{64}$/.test(body.secret))
      fail("Sağlayıcı anahtarı gerekli");
    const existing = this.providers.get(id);
    if (
      existing &&
      existing.clientId !== client.id &&
      existing.expires > Date.now()
    )
      fail("Sağlayıcı başka istemciye ait", 409);
    const nonce = crypto.randomBytes(24).toString("hex");
    const proof = await limitedJSON(
      await fetch(new URL("challenge", url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce }),
        redirect: "error",
        signal: AbortSignal.timeout(3000),
      }),
      4096,
    );
    const expected = crypto
      .createHmac("sha256", body.secret)
      .update(nonce)
      .digest("hex");
    if (
      typeof proof.proof !== "string" ||
      proof.proof.length !== 64 ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(proof.proof))
    )
      fail("Sağlayıcı doğrulanamadı", 403);
    this.providers.set(id, {
      id,
      clientId: client.id,
      name: boundedText(body.name, 80),
      url: url.href,
      secret: body.secret,
      actions,
      expires: Date.now() + 90000,
    });
    this.emit("change");
    return { id, leaseSeconds: 90 };
  }
  async invoke(client, body) {
    if (body.provider === "hub" && body.action === "text-count") {
      this.installed("text-tools");
      if (!this.state.installed["text-tools"].enabled)
        fail("Metin araçları devre dışı");
      const text = boundedText(body.input?.text, 100000);
      return {
        words: text.trim() ? text.trim().split(/\s+/u).length : 0,
        characters: this.state.installed["text-tools"].settings.countWhitespace
          ? Array.from(text).length
          : Array.from(text.replace(/\s/gu, "")).length,
      };
    }
    const p = this.providers.get(body.provider);
    if (!p || p.expires < Date.now()) fail("Sağlayıcı çevrimdışı", 404);
    const action = p.actions.find((a) => a.id === body.action);
    if (!action) fail("İşlem bulunamadı", 404);
    if (JSON.stringify(body.input || {}).length > 100000)
      fail("Girdi çok büyük");
    const run = () => limitedJSONFromProvider(p, body.action, body.input || {});
    return action.write
      ? this.requestApproval(client, `${p.name}: ${action.label}`, run)
      : run();
  }
  async startAPI(port = 47632) {
    if (this.server) return;
    if (!Number.isInteger(port) || port < 0 || port > 65535)
      fail("Geçersiz port");
    this.server = http.createServer((req, res) => {
      this.route(req, res).catch((e) => {
        if (!res.headersSent) {
          res.writeHead(e.status || 500, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          res.end(
            JSON.stringify({ error: e.status ? e.message : "İşlem başarısız" }),
          );
        } else res.destroy();
      });
    });
    this.server.requestTimeout = 150000;
    this.server.headersTimeout = 10000;
    this.server.maxConnections = 30;
    try {
      await new Promise((r, j) => {
        this.server.once("error", j);
        this.server.listen(port, "127.0.0.1", r);
      });
      this.port = this.server.address().port;
      this.emit("change");
    } catch (e) {
      this.server = null;
      throw e;
    }
  }
  async route(req, res) {
    if (req.headers.origin && !req.url.startsWith("/v1/browser/"))
      fail("Tarayıcı kaynaklarından API erişimi kapalı", 403);
    if (
      ![`127.0.0.1:${this.port}`, `localhost:${this.port}`].includes(
        req.headers.host,
      )
    )
      fail("Geçersiz Host", 403);
    const url = new URL(req.url, `http://127.0.0.1:${this.port}`);
    let out;
    const send = (data) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
    };
    if (req.method === "GET" && url.pathname === "/health")
      return send({ service: "PluginLabs Hub", version: "0.2.0" });
    const body = async () => {
      let total = 0,
        parts = [];
      for await (const chunk of req) {
        total += chunk.length;
        if (total > 1200000) fail("İstek çok büyük", 413);
        parts.push(chunk);
      }
      try {
        return JSON.parse(Buffer.concat(parts).toString() || "{}");
      } catch {
        fail("Geçersiz JSON");
      }
    };
    if (req.method === "POST" && url.pathname === "/v1/browser/sync") {
      const c = this.extensions.checkOrigin(req);
      out = this.extensions.sync(c, await body());
    } else if (req.method === "GET" && url.pathname === "/v1/ideas") {
      this.authenticate(req, "catalog.read");
      out = this.snapshot().ideas;
    } else if (req.method === "GET" && url.pathname === "/v1/catalog") {
      this.authenticate(req, "catalog.read");
      out = this.snapshot().catalog;
    } else if (req.method === "GET" && url.pathname === "/v1/installed") {
      this.authenticate(req, "catalog.read");
      out = this.state.installed;
    } else if (req.method === "GET" && url.pathname === "/v1/resources") {
      this.authenticate(req, "resources.read");
      out = Object.entries(this.state.installed)
        .filter(
          ([, v]) =>
            v.enabled &&
            ["asset", "template", "library", "plugin"].includes(v.kind),
        )
        .map(([id, v]) => ({ id, ...v }));
    } else if (
      req.method === "GET" &&
      /^\/v1\/resources\/[a-z0-9-]+$/.test(url.pathname)
    ) {
      this.authenticate(req, "resources.read");
      out = await this.readResource(url.pathname.split("/").pop());
    } else if (req.method === "GET" && url.pathname === "/v1/jobs") {
      this.authenticate(req, "jobs.read");
      out = [...this.jobs.values()];
    } else if (req.method === "GET" && url.pathname === "/v1/providers") {
      this.authenticate(req, "actions.invoke");
      out = this.snapshot().providers;
    } else if (req.method === "POST" && url.pathname === "/v1/downloads") {
      const c = this.authenticate(req, "downloads.request"),
        b = await body();
      this.item(b.id);
      out = this.requestApproval(c, `${this.item(b.id).name} yükle`, () =>
        this.install(b.id),
      );
    } else if (req.method === "POST" && url.pathname === "/v1/apps/launch") {
      const c = this.authenticate(req, "apps.launch"),
        b = await body();
      this.installed(b.id);
      out = this.requestApproval(c, `${this.item(b.id).name} aç`, () =>
        this.launch(b.id).then(() => ({ opened: true })),
      );
    } else if (
      req.method === "GET" &&
      url.pathname.startsWith("/v1/requests/")
    ) {
      const c = this.authenticate(req),
        p = this.pending.get(url.pathname.split("/").pop());
      if (!p || p.clientId !== c.id) fail("İstek bulunamadı", 404);
      const { run, ...publicRequest } = p;
      out = publicRequest;
    } else if (
      req.method === "POST" &&
      url.pathname === "/v1/providers/register"
    ) {
      const c = this.authenticate(req, "providers.register");
      out = await this.registerProvider(c, await body());
    } else if (req.method === "POST" && url.pathname === "/v1/actions/invoke") {
      const c = this.authenticate(req, "actions.invoke");
      out = await this.invoke(c, await body());
    } else if (req.method === "GET" && url.pathname === "/v1/models") {
      this.authenticate(req, "mymind.chat");
      out = {
        object: "list",
        data: this.model?.healthy
          ? [{ id: "mymind-lite", object: "model", owned_by: "local" }]
          : [],
      };
    } else if (
      req.method === "POST" &&
      url.pathname === "/v1/chat/completions"
    ) {
      this.authenticate(req, "mymind.chat");
      const b = await body(),
        abort = new AbortController();
      res.on("close", () => abort.abort());
      out = await this.chat(b, abort.signal);
    } else fail("API yolu bulunamadı", 404);
    send(out);
  }
  async close() {
    this.closed = true;
    for (const c of this.controllers.values()) c.abort();
    await Promise.allSettled([...this.tasks]);
    await this.stopModel();
    if (this.server) {
      this.server.closeAllConnections();
      await new Promise((r) => this.server.close(r));
      this.server = null;
    }
    await this.saving;
  }
}
async function limitedJSONFromProvider(p, action, input) {
  if (p.expires < Date.now()) fail("Sağlayıcının bağlantı süresi doldu");
  return limitedJSON(
    await fetch(new URL("invoke", p.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.secret}`,
      },
      body: JSON.stringify({ action, input }),
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    }),
    1000000,
  );
}
module.exports = { Hub, scopes, extract, versionCompare, safeEntry, digest };
