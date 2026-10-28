// Compare against an explicit pre-refactor CSS file; no baseline updates are automatic.
const { _electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const baseline = process.argv[2];
const output = path.resolve(
  process.argv[3] || path.join(root, "dist/design-equivalence"),
);
if (!baseline)
  throw Error(
    "Usage: node scripts/verify-design-equivalence.cjs BASELINE_CSS [OUTPUT_DIR]",
  );
async function capture(mode) {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), "pl-design-"));
  const app = await _electron.launch({
    args: [root, "--no-sandbox", "--disable-gpu"],
    executablePath: require("electron"),
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ":99",
      PLUGINLABS_DATA: data,
    },
  });
  try {
    const page = await app.firstWindow();
    await page
      .getByRole("heading", { name: "Her şey, tek bir yerde." })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    const results = {};
    if (mode === "before") {
      await page.addStyleTag({ content: await fs.readFile(baseline, "utf8") });
      await page
        .locator('link[href="styles.css"]')
        .evaluate((el) => el.remove());
    }
    for (const width of [1440, 1000, 1600]) {
      await app.evaluate(
        ({ BrowserWindow }, width) =>
          BrowserWindow.getAllWindows()[0].setSize(width, 960),
        width,
      );
      for (const motion of ["reduce", "no-preference"]) {
        await page.emulateMedia({ reducedMotion: motion });
        for (const route of [
          "home",
          "ideas",
          "extensions",
          "api",
          "mymind",
          "settings",
        ]) {
          await page.locator(`nav [data-page="${route}"]`).click();
          await page.evaluate(() => document.fonts.ready);
          if (route === "api")
            await page
              .getByRole("button", { name: "＋ İstemci oluştur" })
              .click();
          await page.evaluate(async () => {
            await new Promise((r) =>
              requestAnimationFrame(() => requestAnimationFrame(r)),
            );
            for (const animation of document.getAnimations()) {
              if (animation.effect.getTiming().iterations === Infinity) {
                animation.pause();
                animation.currentTime = 0;
              } else animation.finish();
            }
          });
          const key = `${width}-${motion}-${route}`;
          results[key] = await page.evaluate(() =>
            [...document.querySelectorAll("body,body *")].map((el) => {
              const s = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              // Animation phase and ephemeral API status are deliberately excluded.
              const props = [
                "fontFamily",
                "fontSize",
                "fontWeight",
                "lineHeight",
                "color",
                "backgroundColor",
                "backgroundImage",
                "borderRadius",
                "borderColor",
                "padding",
                "margin",
                "gap",
                "width",
                "height",
                "display",
                "transitionDuration",
                "animationName",
                "animationDuration",
              ];
              return {
                tag: el.tagName,
                cls: el.className,
                rect: [r.x, r.y, r.width, r.height],
                style: Object.fromEntries(props.map((p) => [p, s[p]])),
              };
            }),
          );
          // Freeze animation only for deterministic before/after PNGs.
          if (width === 1440 && motion === "reduce")
            await page.screenshot({
              path: path.join(output, `${mode}-${route}.png`),
              fullPage: true,
            });
          if (route === "api")
            await page
              .locator("#modal [data-action=closeModal]")
              .first()
              .click();
        }
      }
    }
    await fs.writeFile(
      path.join(output, `${mode}.json`),
      JSON.stringify(results),
    );
    console.log(
      mode + ": captured " + Object.keys(results).length + " UI states",
    );
    return results;
  } finally {
    await app.close();
    await fs.rm(data, { recursive: true, force: true });
  }
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const before = await capture("before");
  const after = await capture("after");
  assert.deepEqual(after, before, "Computed styles or geometry changed");
  for (const route of [
    "home",
    "ideas",
    "extensions",
    "api",
    "mymind",
    "settings",
  ]) {
    assert.deepEqual(
      await fs.readFile(path.join(output, `before-${route}.png`)),
      await fs.readFile(path.join(output, `after-${route}.png`)),
      route + " pixels changed",
    );
  }
  console.log(
    "PASS: 36 computed-style/geometry states and six byte-identical Electron PNG pairs",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
