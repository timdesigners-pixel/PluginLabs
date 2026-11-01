const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const {
  Hub,
  digest,
  safeEntry,
  extract,
  versionCompare,
} = require("../src/hub.cjs");
const { PluginLabsClient, ProviderAgent } = require("../sdk/client.cjs");
async function fixture(t, catalog) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plhub-test-"));
  const hub = await new Hub(root, { catalog, allowTestHTTP: true }).init();
  await hub.startAPI(0);
  t.after(async () => {
    await hub.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  return hub;
}
async function settled(hub, job) {
  while (["queued", "downloading", "installing"].includes(job.status))
    await new Promise((r) => setTimeout(r, 10));
  return job;
}
async function endpoint(t, handler) {
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(
    () =>
      new Promise((r) => {
        server.closeAllConnections();
        server.close(r);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}
test("atomic persistence, token secrecy, resource lifecycle and settings", async (t) => {
  const hub = await fixture(t);
  const job = await hub.install("text-tools");
  await settled(hub, job);
  assert.equal(job.status, "complete");
  assert.equal((await hub.readResource("text-tools")).capability, "text.count");
  await hub.resourceSettings("text-tools", { countWhitespace: false });
  const client = { id: "fixture", name: "Fixture" };
  assert.deepEqual(
    await hub.invoke(client, {
      provider: "hub",
      action: "text-count",
      input: { text: "hello world" },
    }),
    { words: 2, characters: 10 },
  );
  await hub.toggle("text-tools", false);
  await assert.rejects(hub.readResource("text-tools"));
  await assert.rejects(hub.resourceSettings("text-tools", { shell: "bad" }));
  const key = await hub.createClient("Test", ["catalog.read"]);
  assert(!JSON.stringify(hub.snapshot()).includes(key.token));
  assert(
    !(await fs.readFile(path.join(hub.root, "state.json"), "utf8")).includes(
      key.token,
    ),
  );
  await hub.remove("text-tools");
  assert.equal(hub.state.installed["text-tools"], undefined);
});
test("download verification, failed update keeps working version, rollback and cancellation", async (t) => {
  const payload = Buffer.from("verified-package");
  let slow = false;
  const url = await endpoint(t, (_req, res) => {
    if (slow) {
      res.write(payload.subarray(0, 3));
      setTimeout(() => res.end(payload.subarray(3)), 500);
    } else res.end(payload);
  });
  const item = {
    id: "test-app",
    name: "Test",
    kind: "app",
    version: "1.0.0",
    format: "exe",
    file: "test.exe",
    size: payload.length,
    sha256: digest(payload),
    url,
  };
  const hub = await fixture(t, [item]);
  let job = await hub.install("test-app");
  await settled(hub, job);
  assert.equal(job.status, "complete");
  hub.catalog[0].version = "2.0.0";
  hub.catalog[0].sha256 = "a".repeat(64);
  job = await hub.install("test-app");
  await settled(hub, job);
  assert.equal(job.status, "failed");
  assert.equal(hub.state.installed["test-app"].version, "1.0.0");
  assert.deepEqual(
    await fs.readFile(path.join(hub.folder("test-app", "1.0.0"), "test.exe")),
    payload,
  );
  hub.catalog[0].sha256 = digest(payload);
  job = await hub.install("test-app");
  await settled(hub, job);
  assert.equal(job.status, "complete");
  await hub.rollback("test-app");
  assert.equal(hub.state.installed["test-app"].version, "1.0.0");
  hub.catalog[0].version = "3.0.0";
  slow = true;
  job = await hub.install("test-app");
  hub.cancel(job.id);
  await settled(hub, job);
  assert.equal(job.status, "cancelled");
  assert.equal(hub.state.installed["test-app"].version, "1.0.0");
});
test("HTTP permissions, browser defenses, native-only approvals, revoke", async (t) => {
  const hub = await fixture(t);
  const { token } = await hub.createClient("Read-only", ["catalog.read"]);
  const base = `http://127.0.0.1:${hub.port}`;
  const request = (route, opts = {}) =>
    fetch(base + route, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, ...opts.headers },
    });
  assert.equal((await fetch(base + "/v1/catalog")).status, 401);
  assert.equal((await request("/v1/catalog")).status, 200);
  assert.equal((await request("/v1/resources")).status, 403);
  assert.equal(
    (
      await request("/v1/catalog", {
        headers: { Origin: "https://evil.invalid" },
      })
    ).status,
    403,
  );
  assert.equal(
    await new Promise((resolve, reject) => {
      http
        .get(
          base + "/v1/catalog",
          {
            headers: { Host: "evil.invalid", Authorization: `Bearer ${token}` },
          },
          (r) => {
            r.resume();
            resolve(r.statusCode);
          },
        )
        .on("error", reject);
    }),
    403,
  );
  assert.equal(
    (await request("/v1/admin/approve", { method: "POST" })).status,
    404,
  );
  const created = await hub.createClient("Installer", ["downloads.request"]);
  const client = new PluginLabsClient({ token: created.token, port: hub.port });
  const result = await client.request("/v1/downloads", {
    id: "graphite-theme",
  });
  assert.equal(result.status, "pending");
  assert.equal(hub.state.installed["graphite-theme"], undefined);
  await hub.approve(result.requestId, true);
  await settled(hub, [...hub.jobs.values()][0]);
  assert.equal(hub.state.installed["graphite-theme"].version, "1.0.0");
  await hub.revokeClient(created.id);
  await assert.rejects(
    client.request("/v1/downloads", { id: "meeting-template" }),
  );
});
test("provider SDK proves ownership, exposes read operations, reviews writes and expires", async (t) => {
  const hub = await fixture(t);
  const created = await hub.createClient("Provider", [
    "providers.register",
    "actions.invoke",
  ]);
  const client = new PluginLabsClient({ token: created.token, port: hub.port });
  let writes = 0;
  const provider = await new ProviderAgent(client, {
    id: "test-provider",
    name: "Test provider",
    actions: [
      { id: "read", label: "Read", write: false, run: () => ({ value: 42 }) },
      {
        id: "write",
        label: "Write",
        write: true,
        run: () => ({ writes: ++writes }),
      },
    ],
  }).start();
  t.after(() => provider.close());
  assert.deepEqual(await client.invoke("test-provider", "read", {}), {
    value: 42,
  });
  const result = await client.invoke("test-provider", "write", {});
  assert.equal(writes, 0);
  await hub.approve(result.requestId, true);
  assert.equal(writes, 1);
  const status = await client.request("/v1/requests/" + result.requestId);
  assert.deepEqual(status.result, { writes: 1 });
  hub.providers.get("test-provider").expires = 0;
  await assert.rejects(
    client.invoke("test-provider", "read", {}),
    /çevrimdışı/,
  );
  await assert.rejects(
    hub.registerProvider(
      { id: "x" },
      {
        id: "test",
        name: "test",
        url: "http://192.168.1.1:80/",
        actions: [],
        secret: "a".repeat(64),
      },
    ),
    /127.0.0.1/,
  );
});
test("custom packs have versioned installation, configuration and no arbitrary code execution", async (t) => {
  const hub = await fixture(t);
  const pack = {
    id: "custom-board",
    name: "Board",
    kind: "template",
    version: "1.0.0",
    settings: { language: "tr" },
    payload: { columns: ["Todo", "Done"] },
  };
  await settled(hub, await hub.importPack(pack));
  assert.deepEqual((await hub.readResource(pack.id)).columns, ["Todo", "Done"]);
  await assert.rejects(hub.importPack(pack), /Daha yeni/);
  await assert.rejects(hub.importPack({ ...pack, id: "official" }), /custom-/);
  await assert.rejects(
    hub.importPack({ ...pack, id: "custom-exe", kind: "app" }),
    /Yalnızca/,
  );
  await settled(hub, await hub.importPack({ ...pack, version: "1.1.0" }));
  assert.equal(hub.state.installed[pack.id].previous, "1.0.0");
});
test("AI proxy fails closed and enforces payload constraints", async (t) => {
  const hub = await fixture(t);
  await assert.rejects(
    hub.chat({ messages: [{ role: "user", content: "hi" }] }),
    /başlatın/,
  );
  hub.model = { healthy: true };
  await assert.rejects(
    hub.chat({ messages: [{ role: "tool", content: "hi" }] }),
    /rol/,
  );
  await assert.rejects(
    hub.chat({ messages: [{ role: "user", content: "hi" }], max_tokens: 1000 }),
    /1–512/,
  );
  await assert.rejects(
    hub.chat({ messages: [{ role: "user", content: "hi" }], stream: true }),
    /akış/,
  );
  hub.model = null;
});
test("archive paths and version handling", () => {
  for (const bad of [
    "../x",
    "/root",
    "a/../x",
    "a\\b",
    "C:/bad",
    "aux.txt",
    "a./bad",
    "a\u0000b",
  ])
    assert.throws(() => safeEntry(bad), /arşiv/);
  assert.equal(safeEntry("build/bin/server"), "build/bin/server");
  assert.equal(versionCompare("1.11.0", "1.9.0"), 1);
  assert.equal(versionCompare("2.0.0-beta", "1.0.0"), 0);
});
test("tar rejects symbolic links without writing outside package", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plhub-archive-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "source"));
  await fs.writeFile(path.join(root, "source", "good"), "good");
  await fs.symlink("/tmp", path.join(root, "source", "bad"));
  await require("tar").c(
    {
      file: path.join(root, "test.tar.gz"),
      cwd: path.join(root, "source"),
      gzip: true,
    },
    ["good", "bad"],
  );
  await assert.rejects(
    extract(path.join(root, "test.tar.gz"), path.join(root, "out"), "tar"),
    /bağlantı|arşiv yolu/,
  );
});
test("update check reads only own-prefixed releases from the public distribution repo", async (t) => {
  const dist = "ornek/dagitim", dl = (tag, f) => `https://github.com/${dist}/releases/download/${tag}/${f}`;
  const sha = "sha256:" + "b".repeat(64);
  const releases = [
    { tag_name: "app-a-v2.0.0", draft: false, prerelease: true, assets: [{ name: "A.exe", size: 1, digest: sha, browser_download_url: dl("app-a-v2.0.0", "A.exe") }] },
    { tag_name: "app-a-v1.5.0", draft: false, prerelease: false, assets: [{ name: "A.exe", size: 5, digest: sha, browser_download_url: dl("app-a-v1.5.0", "A.exe") }] },
    { tag_name: "app-a-v1.10.0", draft: false, prerelease: false, assets: [{ name: "A.exe", size: 10, digest: sha, browser_download_url: dl("app-a-v1.10.0", "A.exe") }] },
    { tag_name: "app-ab-v9.0.0", draft: false, prerelease: false, assets: [] },
    { tag_name: "app-b-v3.0.0", draft: false, prerelease: false, assets: [{ name: "B.exe", size: 1, digest: sha, browser_download_url: "https://github.com/baska/depo/releases/download/app-b-v3.0.0/B.exe" }] },
    { tag_name: "app-c-vbeta", draft: false, prerelease: false, assets: [] },
  ];
  const original = global.fetch;
  global.fetch = async (url) => { assert.equal(url, `https://api.github.com/repos/${dist}/releases?per_page=100`); return Response.json(releases); };
  t.after(() => { global.fetch = original; });
  const item = (id, asset) => ({ id, name: id, kind: "app", version: "1.0.0", platform: "win32", format: "exe", file: "x.exe", size: 1, sha256: "a".repeat(64), url: "https://example.test/x.exe", distAsset: asset });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plhub-upd-"));
  const hub = await new Hub(root, { catalog: [item("app-a", "^A\.exe$"), item("app-b", "^B\.exe$"), item("app-c", "x")], dist }).init();
  // log() kaydı beklemeden başlatır; close() bekleyen yazmayı tamamlar, sonra klasör silinir (ENOTEMPTY yarışı).
  t.after(async () => { await hub.close(); await fs.rm(root, { recursive: true, force: true }); });
  const r = Object.fromEntries((await hub.checkUpdates()).map((x) => [x.id, x]));
  assert.deepEqual(r["app-a"], { id: "app-a", version: "1.10.0", available: true, ready: true }, "1.10.0 > 1.5.0; ön sürüm ve app-ab yok sayılır");
  assert.equal(hub.catalog[0].url, dl("app-a-v1.10.0", "A.exe"));
  assert.equal(hub.catalog[0].sha256, "b".repeat(64));
  assert.deepEqual(r["app-b"], { id: "app-b", version: "3.0.0", available: true, ready: false }, "başka depoya işaret eden dosya reddedilir");
  assert.match(r["app-c"].error, /sürüm yok/);
});
function storedZip(files) {
  // Sıkıştırmasız (stored) küçük zip: yalnız test için.
  const { crc32 } = require("node:zlib");
  const locals = [],
    centrals = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.from(text),
      nameBuf = Buffer.from(name),
      crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dir = Buffer.concat(centrals),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}
test("zip app installs into content/ and launches the declared file only", async (t) => {
  const payload = storedZip({ "App.exe": "binary", "OKU-BENI.txt": "not" });
  const url = await endpoint(t, (_req, res) => res.end(payload));
  const item = {
    id: "zip-app",
    name: "Zip App",
    kind: "app",
    version: "1.0.0",
    platform: process.platform,
    format: "zip",
    file: "App-Windows-x64.zip",
    launch: "content/App.exe",
    size: payload.length,
    sha256: digest(payload),
    url,
  };
  const hub = await fixture(t, [item]);
  const job = await settled(hub, await hub.install("zip-app"));
  assert.equal(job.status, "complete");
  const file = hub.appFile("zip-app");
  assert.equal(file, path.join(hub.folder("zip-app", "1.0.0"), "content", "App.exe"));
  assert.equal(await fs.readFile(file, "utf8"), "binary");
  await assert.rejects(fs.access(path.join(hub.folder("zip-app", "1.0.0"), item.file)));
  for (const bad of ["../x.exe", "content/../../x.exe", "/abs.exe", "content\\App.exe"]) {
    hub.state.installed["zip-app"].launch = bad;
    assert.throws(() => hub.appFile("zip-app"));
  }
});
