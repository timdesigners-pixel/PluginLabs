const { _electron: electron } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const fs = require("node:fs/promises");
(async () => {
  const data = require("node:fs").mkdtempSync(require("node:path").join(require("node:os").tmpdir(), "pluginlabs-ui-"));
  const app = await electron.launch({
    executablePath: process.env.PLUGINLABS_TEST_ELECTRON || require("electron"),
    args: [
      process.env.PLUGINLABS_TEST_APP || require("node:path").resolve(__dirname, ".."),
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
  const errors = [];
  const page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error("CONSOLE", m.text());
  });
  await page
    .getByRole("heading", { name: "Her şey, tek bir yerde." })
    .waitFor();
  await page.screenshot({
    path: require("node:path").resolve(__dirname, "../preview-home.png"),
    fullPage: true,
  });
  await page.locator('nav [data-page="resources"]').click();
  await page
    .locator(".card")
    .filter({
      has: page.getByRole("heading", { name: "Graphite", exact: true }),
    })
    .getByRole("button", { name: "＋ Yükle" })
    .click();
  await page
    .getByRole("button", { name: "Yönet", exact: true })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: "Yönet", exact: true })
    .first()
    .click();
  await page.locator('#resource-form input[name="accent"]').fill("#aabbcc");
  await page.getByRole("button", { name: "Ayarları kaydet" }).click();
  await page
    .getByRole("button", { name: "Devre dışı bırak", exact: true })
    .click();
  await page.locator('nav [data-page="api"]').click();
  await page.getByRole("button", { name: "＋ İstemci oluştur" }).click();
  await page.locator('input[name="name"]').fill("UI test client");
  await page.locator('input[value="resources.read"]').check();
  await page
    .getByRole("button", { name: "Anahtar oluştur", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Uygulama anahtarı hazır" })
    .waitFor();
  const token = await page.locator("#modal .code").textContent();
  if (!token.startsWith("plh_")) throw Error("Missing token");
  await page.getByRole("button", { name: "Tamam", exact: true }).click();
  await page
    .getByRole("heading", { name: "UI test client", exact: true })
    .waitFor();
  await page.screenshot({
    path: require("node:path").resolve(__dirname, "../preview-api.png"),
    fullPage: true,
  });
  await page.locator('nav [data-page="mymind"]').click();
  await page
    .getByRole("heading", { name: "My Mind. Sizin cihazınızda." })
    .waitFor();
  await page.screenshot({
    path: require("node:path").resolve(__dirname, "../preview-mymind.png"),
    fullPage: true,
  });
  require("node:assert/strict").deepEqual(errors, []);
  console.log(
    "PASS: native Electron UI, resource install/settings/toggle, API client creation, model page",
  );
  } finally {
    await app.close();
    await fs.rm(data, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
