const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
const { Hub } = require("../src/hub.cjs");
async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pl-ext-test-"));
  const h = await new Hub(root).init();
  await h.startAPI(0);
  t.after(async () => {
    await h.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  return h;
}
const bridge = "a".repeat(32),
  extension = "b".repeat(32),
  inventory = [
    {
      id: extension,
      name: "Test extension",
      version: "1.0",
      enabled: true,
      mayDisable: true,
      permissions: ["storage"],
      hostPermissions: ["https://example.test/*"],
    },
  ];
test("50 original Notion product names, IDs and required fields are preserved", () => {
  const data = require("../resources/notion-catalog.json");
  assert.equal(data.items.length, 50);
  assert.equal(new Set(data.items.map((i) => i.id)).size, 50);
  assert.equal(data.items[0].name, "Flow Dock");
  assert.equal(data.items[49].name, "Decision Board");
  for (const item of data.items) {
    assert(item.source.startsWith("https://app.notion.com/p/"));
    assert(item.fields.Platform);
    assert(item.fields["MVP ve temel akış"]);
    assert(item.spec.includes(item.fields["MVP ve temel akış"]));
  }
});
test("browser pairing binds token to bridge origin, scopes and client; native requests need browser confirmation", async (t) => {
  const h = await setup(t),
    key = await h.extensions.createBrowser("Opera", bridge),
    base = `http://127.0.0.1:${h.port}`,
    sync = (token, origin, body) =>
      fetch(base + "/v1/browser/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  assert.equal(
    (await sync(key.token, "https://evil.invalid", { extensions: inventory }))
      .status,
    403,
  );
  assert.equal(
    (
      await sync(key.token, "chrome-extension://" + "c".repeat(32), {
        extensions: inventory,
      })
    ).status,
    403,
  );
  const response = await sync(key.token, "chrome-extension://" + bridge, {
    extensions: inventory,
  });
  assert.equal(response.status, 200);
  assert.equal(
    h.extensions.snapshot().browsers[0].extensions[0].name,
    "Test extension",
  );
  const c = h.extensions.request(key.id, extension, "disable");
  assert.equal(c.status, "pending");
  assert.throws(
    () => h.extensions.request(key.id, extension, "uninstall"),
    /bekleyen/,
  );
  const delivered = await (
    await sync(key.token, "chrome-extension://" + bridge, {
      extensions: inventory,
    })
  ).json();
  assert.equal(delivered.commands[0].action, "disable");
  assert.equal(h.extensions.snapshot().browsers[0].extensions[0].enabled, true);
  await sync(key.token, "chrome-extension://" + bridge, {
    extensions: [{ ...inventory[0], enabled: false }],
    results: [{ id: c.id, ok: true }],
  });
  assert.equal(h.extensions.snapshot().commands[0].status, "complete");
  assert.equal(
    h.extensions.snapshot().browsers[0].extensions[0].enabled,
    false,
  );
  const ordinary = await h.createClient("Ordinary", ["catalog.read"]);
  assert.equal(
    (
      await sync(ordinary.token, "chrome-extension://" + bridge, {
        extensions: inventory,
      })
    ).status,
    403,
  );
  await h.revokeClient(key.id);
  assert.equal(
    (
      await sync(key.token, "chrome-extension://" + bridge, {
        extensions: inventory,
      })
    ).status,
    401,
  );
  assert.equal(h.extensions.snapshot().browsers.length, 0);
});
test("browser operation rejects policy-controlled extensions, bridge changes, stale connections and expired confirmations", async (t) => {
  const h = await setup(t),
    key = await h.extensions.createBrowser("Chrome", bridge),
    client = h.state.clients.find((c) => c.id === key.id);
  h.extensions.sync(client, {
    extensions: [
      ...inventory,
      { id: bridge, name: "Bridge", enabled: true, mayDisable: true },
      { id: "d".repeat(32), name: "Managed", enabled: true, mayDisable: false },
    ],
  });
  assert.throws(
    () => h.extensions.request(key.id, bridge, "disable"),
    /Bağlantı/,
  );
  assert.throws(
    () => h.extensions.request(key.id, "d".repeat(32), "disable"),
    /politikasıyla/,
  );
  assert.throws(
    () => h.extensions.request(key.id, extension, "shell"),
    /Desteklenmeyen/,
  );
  const c = h.extensions.request(key.id, extension, "uninstall");
  c.createdAt = Date.now() - 301000;
  const result = h.extensions.sync(client, {
    extensions: inventory,
    results: [{ id: c.id, ok: true }],
  });
  assert.equal(result.commands.length, 0);
  assert.equal(h.extensions.commands.get(c.id).status, "expired");
  h.extensions.browsers.get(key.id).lastSeen = 0;
  assert.throws(
    () => h.extensions.request(key.id, extension, "enable"),
    /çevrimdışı/,
  );
});
test("VS Code adapter parses inventory and passes arguments without shell; failed connect restores prior host", async (t) => {
  const h = await setup(t),
    folder = path.join(h.root, "fixture-code");
  await fs.mkdir(folder);
  const file = path.join(folder, "code");
  await fs.writeFile(
    file,
    '#!/usr/bin/env node\nconst fs=require("fs");const args=process.argv.slice(2);if(args[0]==="--list-extensions")console.log("publisher.example@1.2.3");else fs.writeFileSync(' +
      JSON.stringify(path.join(folder, "args.json")) +
      ",JSON.stringify(args));\n",
  );
  await fs.chmod(file, 0o700);
  await h.appExtensions.connect(file);
  assert.equal(h.appExtensions.snapshot().items[0].id, "publisher.example");
  assert(!JSON.stringify(h.snapshot()).includes(file));
  await h.appExtensions.action("update", "publisher.example");
  assert.deepEqual(
    JSON.parse(await fs.readFile(path.join(folder, "args.json"), "utf8")),
    ["--install-extension", "publisher.example", "--force"],
  );
  await assert.rejects(
    h.appExtensions.action("install", "--shell;boom"),
    /kimliği/,
  );
  await assert.rejects(h.appExtensions.connect(process.execPath), /VS Code/);
  assert.equal(h.appExtensions.snapshot().connected, true);
  await h.appExtensions.disconnect();
  assert.equal(h.appExtensions.snapshot().connected, false);
});

test("all 50 product packs install and open; product notes and checklists persist independently of package files", async (t) => {
  const h = await setup(t);
  for (const item of require("../resources/notion-catalog.json").items) {
    const id = item.id.toLowerCase(),
      job = await h.install(id);
    while (["queued", "downloading", "installing"].includes(job.status))
      await new Promise((r) => setTimeout(r, 3));
    assert.equal(job.status, "complete");
    const product = await h.readProduct(id);
    assert.equal(product.package.name, item.name);
    assert.equal(product.package.productId, item.id);
  }
  await h.saveProduct("pl-047", {
    notes: "İzin inceleme notu",
    completed: [0, 1],
  });
  await h.toggle("pl-047", false);
  await assert.rejects(h.readProduct("pl-047"), /etkin/);
  await h.toggle("pl-047", true);
  assert.equal(
    (await h.readProduct("pl-047")).workspace.notes,
    "İzin inceleme notu",
  );
  const saved = JSON.parse(
    await fs.readFile(path.join(h.root, "state.json"), "utf8"),
  );
  assert.deepEqual(saved.productWorkspaces["pl-047"].completed, [0, 1]);
  await h.resourceSettings("pl-047", { showDevelopmentTasks: false });
  assert.equal(
    h.state.installed["pl-047"].settings.showDevelopmentTasks,
    false,
  );
  await assert.rejects(
    h.saveProduct("pl-047", { notes: "x".repeat(20001), completed: [] }),
    /sınır/,
  );
});
