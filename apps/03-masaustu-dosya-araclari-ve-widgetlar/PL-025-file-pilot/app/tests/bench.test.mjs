import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
const require = createRequire(import.meta.url);
const B = require("../src/bench.js");

test("doğrulama ölçütü: 1000 belgede bilinen dosya ilk 5'te ≥ %90, p95 sorgu ≤ 1 sn (sentetik derlem)", () => {
  for (const seed of [2025, 11]) {
    const r = B.run({ now: () => performance.now(), seed });
    console.log("kıyaslama", seed, JSON.stringify({ top5: r.top5, p95Ms: r.p95Ms, byKind: r.byKind, buildMs: r.buildMs }));
    assert.equal(r.docs, 1000);
    assert.ok(r.top5 >= 90, "ilk 5 isabeti %" + r.top5);
    assert.ok(r.p95Ms <= 1000, "p95 " + r.p95Ms + " ms");
  }
});
