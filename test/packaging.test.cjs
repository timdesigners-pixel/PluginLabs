// Paketlenmiş uygulamada eksik dosya kalmasın: src/ içindeki her "../" require hedefi build.files kapsamında olmalı.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = require("../package.json").build.files;

function covered(rel) {
  return files.some((g) => (g.endsWith("/**") ? rel.startsWith(g.slice(0, -2)) : rel === g));
}

test("paket: kodun okuduğu dosyalar build.files içinde", () => {
  const missing = [];
  for (const f of fs.readdirSync(path.join(root, "src")).filter((x) => x.endsWith(".cjs"))) {
    const src = fs.readFileSync(path.join(root, "src", f), "utf8");
    for (const m of src.matchAll(/require\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g)) {
      let rel = path.relative(root, path.resolve(root, "src", m[1])).split(path.sep).join("/");
      if (!path.extname(rel)) rel += ".cjs";
      if (!covered(rel)) missing.push(`${f} → ${rel}`);
    }
  }
  assert.deepEqual(missing, []);
});
