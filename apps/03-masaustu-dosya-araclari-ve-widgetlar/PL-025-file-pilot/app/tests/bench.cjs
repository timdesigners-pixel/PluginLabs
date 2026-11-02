// Kıyaslamayı tek başına çalıştırır: node tests/bench.cjs
const { performance } = require("node:perf_hooks");
const r = require("../src/bench.js").run({ now: () => performance.now() });
console.log(JSON.stringify(r, null, 2));
process.exit(r.ok ? 0 : 1);
