const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../scripts/audit-report.cjs');
function auditFixture(body, verify) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pluginlabs-audit-'));
  try {
    const fixture = path.join(dir, 'npm-fixture.cjs');
    fs.writeFileSync(fixture, body);
    const result = spawnSync(process.execPath, [script], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, npm_execpath: fixture },
    });
    verify(result, path.join(dir, 'dependency-audit.json'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('audit evidence preserves vulnerability findings without hiding the separate security gate', () => {
  auditFixture('console.log(JSON.stringify({metadata:{vulnerabilities:{high:1,total:1}}}));process.exitCode=1;', (result, file) => {
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(fs.readFileSync(file)).metadata.vulnerabilities.high, 1);
  });
});
test('audit evidence fails for registry error JSON rather than treating any output as a report', () => {
  auditFixture('console.log(JSON.stringify({error:{code:"E403"}}));process.exitCode=1;', (result, file) => {
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(file), false);
  });
});
test('audit evidence fails for interrupted or malformed registry responses', () => {
  for (const body of ['console.log("not JSON");process.exitCode=1;', 'process.exitCode=2;']) {
    auditFixture(body, (result, file) => {
      assert.equal(result.status, 1);
      assert.equal(fs.existsSync(file), false);
    });
  }
});
