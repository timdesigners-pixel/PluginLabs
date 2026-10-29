const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generate } = require("../scripts/design-tokens.cjs");
const root = path.resolve(__dirname, "..");
test("shipped design tokens match the portable source and load before component styles", () => {
  const tokens = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs/ecosystem-v1/design-system/tokens.json"),
      "utf8",
    ),
  );
  const css = fs.readFileSync(path.join(root, "ui/design-tokens.css"), "utf8");
  assert.equal(
    css,
    generate(tokens),
    "regenerate CSS after changing portable tokens",
  );
  const html = fs.readFileSync(path.join(root, "ui/index.html"), "utf8");
  assert(html.includes('href="design-tokens.css"'));
  assert(
    html.indexOf('href="design-tokens.css"') <
      html.indexOf('href="styles.css"'),
  );
  const styles = fs.readFileSync(path.join(root, "ui/styles.css"), "utf8");
  const declared = new Set(
    [...css.matchAll(/(--pl-[\w-]+):/g)].map((m) => m[1]),
  );
  for (const [, name] of styles.matchAll(/var\((--pl-[\w-]+)\)/g)) {
    assert(declared.has(name), `undefined token: ${name}`);
  }
  assert(
    !css.includes("--pl-color-accent: #8ab4f8"),
    "Flow Dock overrides must not replace Hub defaults",
  );
});
