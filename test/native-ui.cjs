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
    .getByRole("button", { name: "Yükle", exact: true })
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
  await page.getByRole("button", { name: "İstemci oluştur", exact: true }).click();
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
    .getByRole("cell", { name: "UI test client" })
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
  // Kasım kuralları: menüde kaydırma çubuğu yok, komut paleti opak ve klavyeyle çalışır
  const asideBar = await page.evaluate(() => {
    const a = document.querySelector("aside");
    const cs = getComputedStyle(a);
    return (
      a.offsetWidth - a.clientWidth -
      parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)
    );
  });
  require("node:assert/strict").equal(asideBar, 0);
  await page.keyboard.press("Control+k");
  await page.locator("#palette[open] .pl-cmdk").waitFor();
  const panelAlpha = await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector("#palette .pl-cmdk")).backgroundColor;
    const m = c.match(/rgba?\(([^)]+)\)/);
    const parts = m[1].split(/[ ,/]+/).filter(Boolean);
    return parts.length > 3 ? parseFloat(parts[3]) : 1;
  });
  require("node:assert/strict").equal(panelAlpha, 1);
  await page.keyboard.type("API ve izinler");
  await page.screenshot({
    path: require("node:path").resolve(__dirname, "../preview-palette.png"),
  });
  await page.keyboard.press("Enter");
  await page.locator('nav [data-page="api"].active').waitFor();
  require("node:assert/strict").equal(await page.locator("#palette[open]").count(), 0);
  // Advanced kabuğu: üst menü, kayan akış bandı, durum kartları
  await page.getByRole("menuitem", { name: "Dosya" }).click();
  await page.getByRole("menuitem", { name: /Veri klasörünü aç/ }).waitFor();
  await page.keyboard.press("Escape");
  require("node:assert/strict").equal(await page.locator(".mb-drop:not([hidden])").count(), 0);
  await page.locator("#ticker-track span").first().waitFor({ state: "attached" });
  require("node:assert/strict").ok((await page.locator("#ticker-track span").count()) >= 8);
  await page.locator('nav [data-page="home"]').click();
  await page.locator('[data-card="server"]').waitFor();
  await page.locator('[data-card="connection"]').waitFor();
  await page.getByRole("button", { name: /Pro'ya geç/ }).click();
  await page.locator("#modal[open]").waitFor();
  await page.getByRole("button", { name: "Tamam" }).click();
  // Ayarlar: Advanced sekmeleri, segment ile palet/tema, gerçek sürüm
  await page.locator('nav [data-page="settings"]').click();
  await page.locator(".pl-tabs [data-settings-tab]").first().waitFor();
  await page.locator('#content [data-set-palette="iris"]').click();
  require("node:assert/strict").equal(await page.evaluate(() => document.documentElement.dataset.palette), "iris");
  await page.locator('#content [data-set-palette="hub-yesil"]').click();
  await page.locator('[data-settings-tab="hakkinda"]').click();
  await page.getByText(/Sürüm \d+\.\d+\.\d+ · Önizleme/).first().waitFor();
  await page.locator('[data-settings-tab="veri"]').click();
  await page.locator(".settings-faq details").first().waitFor();
  // Uygulamalarım: istatistik kartları, tür süzgeci, ızgara/liste görünümü
  await page.locator('nav [data-page="apps"]').click();
  await page.locator(".stat-row .pl-statcard").first().waitFor();
  await page.locator('[data-apps-view="list"]').click();
  await page.locator(".app-list .app-row").first().waitFor();
  await page.locator('[data-apps-view="grid"]').click();
  await page.locator(".app-grid .card").first().waitFor();
  // Widget'lar: panoda örnek widget'lar, Ayarlar'dan çıkar/ekle ve sıra değiştir
  await page.locator('nav [data-page="home"]').click();
  await page.locator(".wdg").first().waitFor();
  const wdgTotal = await page.locator(".wdg").count();
  require("node:assert/strict").ok(wdgTotal >= 10);
  await page.locator("[data-widget-edit]").first().click();
  await page.locator('[data-settings-tab="widget"].is-active').waitFor();
  await page.locator('[data-widget-toggle="kombin"]').uncheck();
  await page.locator('nav [data-page="home"]').click();
  require("node:assert/strict").equal(await page.locator('.wdg[data-w="kombin"]').count(), 0);
  require("node:assert/strict").equal(await page.locator(".wdg").count(), wdgTotal - 1);
  await page.locator("[data-widget-edit]").first().click();
  await page.locator('[data-widget-toggle="kombin"]').check();
  await page.locator('[data-widget-move="down"][data-id="akis"]').click();
  await page.locator("[data-widget-reset]").click();
  await page.locator('nav [data-page="home"]').click();
  require("node:assert/strict").equal(await page.locator(".wdg").count(), wdgTotal);
  // Üst çerçeve menüsü, sayfa geçişinde en üstten açılma, bölünmüş Yükle düğmesi, fotoğraf alanı
  await page.locator('nav [data-page="home"]').click();
  const mb = await page.evaluate(() => {
    const r = document.querySelector(".menubar").getBoundingClientRect();
    return { top: r.top, left: r.left, w: r.width, iw: document.documentElement.clientWidth };
  });
  require("node:assert/strict").equal(mb.top, 0);
  require("node:assert/strict").equal(mb.left, 0);
  require("node:assert/strict").ok(mb.w >= mb.iw - 1);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.locator('nav [data-page="settings"]').click();
  require("node:assert/strict").equal(await page.evaluate(() => window.scrollY), 0);
  await page.locator('nav [data-page="home"]').click();
  const firstCard = page.locator(".app-compact").first();
  await firstCard.getByRole("button", { name: "Yükle", exact: true }).waitFor();
  await firstCard.locator("[data-split-toggle]").click();
  await page.getByRole("menuitem", { name: "Detaylı bilgi" }).first().click();
  await page.locator("#modal[open] .pl-kv").waitFor();
  await page.getByRole("button", { name: "Kapat", exact: true }).last().click();
  const png = require("node:path").join(data, "foto.png");
  require("node:fs").writeFileSync(png, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.locator('[data-photo-pick="kombin"]').click(),
  ]);
  await chooser.setFiles(png);
  await page.locator('.wdg-photo[data-slot="kombin"] img').waitFor();
  await page.locator('[data-photo-clear="kombin"]').click();
  await page.getByRole("img", { name: "Kombin çizimi" }).waitFor();
  // Canlı veri: bir uygulama kanala yayın yapınca widget örnek veriden canlıya geçer
  const created = await page.evaluate(() =>
    window.pluginlabs.call("createClient", "Leo Helper", ["channels.publish"], "leo-helper"),
  );
  const port = (await page.evaluate(() => window.pluginlabs.call("snapshot"))).api.port;
  const sent = await fetch(`http://127.0.0.1:${port}/v1/channels/leo-helper.codes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${created.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: { total: 4321, label: "Bugün yakalanan kod", chips: [{ text: "TESTKOD" }] } }),
  });
  require("node:assert/strict").equal(sent.status, 200);
  await page.locator('.wdg[data-w="kodlar"] .pl-badge', { hasText: "Canlı · Leo Helper" }).waitFor();
  await page.locator('.wdg[data-w="kodlar"] .wdg-big', { hasText: "4321" }).waitFor();
  await page.locator('nav [data-page="api"]').click();
  await page.getByRole("heading", { name: /Kanallar ve köprüler \(1\)/ }).waitFor();
  await page.getByRole("button", { name: "Kapat" }).first().click();
  await page.getByRole("heading", { name: /Kanallar ve köprüler \(0\)/ }).waitFor();
  await page.locator('nav [data-page="mymind"]').click();
  await page.getByRole("heading", { name: /Uygulamalar için hazır görevler/ }).waitFor();
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
