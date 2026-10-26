const { _electron: electron } = require(
    process.env.PLAYWRIGHT_MODULE || "playwright",
  ),
  path = require("node:path"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  assert = require("node:assert/strict");
(async () => {
  const root = path.resolve(__dirname, ".."),
    data = await fs.mkdtemp(path.join(os.tmpdir(), "pl-extensions-ui-"));
  const app = await electron.launch({
    executablePath: process.env.PLUGINLABS_TEST_ELECTRON || require("electron"),
    args: [
      process.env.PLUGINLABS_TEST_APP || root,
      "--no-sandbox",
      "--disable-gpu",
    ],
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ":99",
      PLUGINLABS_DATA: data,
    },
  });
  try {
    const page = await app.firstWindow();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page
      .getByRole("heading", { name: "Her şey, tek bir yerde." })
      .waitFor();
    await page.locator("nav [data-page=ideas]").click();
    assert.equal(await page.locator(".idea-card").count(), 50);
    await page
      .getByRole("heading", { name: "Flow Dock", exact: true })
      .waitFor();
    await page
      .locator(".idea-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Permission Radar",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Kapsamı gör" })
      .click();
    await page
      .locator("#modal")
      .getByRole("heading", { name: "Permission Radar", exact: true })
      .waitFor();
    assert(
      (await page.locator(".spec-fields").textContent()).includes(
        "Chrome management API",
      ),
    );
    await page
      .getByRole("button", { name: "Kapat", exact: true })
      .last()
      .click();
    await page.screenshot({ path: path.join(root, "preview-notion.png") });
    await page.locator("nav [data-page=extensions]").click();
    await page
      .getByRole("heading", { name: "Eklentileriniz. Ortak bir merkez." })
      .waitFor();
    await page.screenshot({ path: path.join(root, "preview-extensions.png") });
    await page.getByRole("button", { name: "＋ Tarayıcı bağla" }).click();
    await page.locator("[name=browser]").selectOption("Opera");
    await page.locator("[name=extensionId]").fill("a".repeat(32));
    await page
      .getByRole("button", { name: "Bağlantı anahtarı oluştur" })
      .click();
    await page
      .getByRole("heading", { name: "Tarayıcı anahtarı hazır" })
      .waitFor();
    const token = await page.locator("#modal .code").textContent();
    await page.getByRole("button", { name: "Tamam", exact: true }).click();
    const snapshot = await page.evaluate(() =>
      window.pluginlabs.call("snapshot"),
    );
    const response = await fetch(
      `http://127.0.0.1:${snapshot.api.port}/v1/browser/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: "chrome-extension://" + "a".repeat(32),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extensions: [
            {
              id: "b".repeat(32),
              name: "Fixture extension",
              version: "1.0",
              enabled: true,
              mayDisable: true,
              permissions: ["storage"],
              hostPermissions: [],
            },
          ],
        }),
      },
    );
    assert.equal(response.status, 200);
    await page
      .getByRole("heading", { name: "Fixture extension", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Devre dışı bırak", exact: true })
      .click();
    await page
      .getByRole("button", { name: "İsteği gönder", exact: true })
      .click();
    await page
      .getByText("Bağlantı eklentisine gönderiliyor", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Diğer uygulamalar", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "VS Code / VSCodium", exact: true })
      .waitFor();
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: 50 Notion cards, full specification modal, browser pairing, queued command, application manager and no renderer errors",
    );
  } finally {
    await app.close();
    await fs.rm(data, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
