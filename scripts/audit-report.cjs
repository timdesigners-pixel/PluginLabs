// Keep vulnerability evidence, but do not turn registry/authentication failures into success.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--json'], {
  encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
});
if (result.error || ![0, 1].includes(result.status)) {
  console.error('Dependency audit could not complete; check registry access.');
  process.exitCode = 1;
} else {
  try {
    const report = JSON.parse(result.stdout);
    if (report.error || !Number.isInteger(report.metadata?.vulnerabilities?.total)) {
      throw new Error('Invalid audit response');
    }
    fs.writeFileSync('dependency-audit.json', JSON.stringify(report, null, 2) + '\n');
    console.log('Dependency findings:', JSON.stringify(report.metadata.vulnerabilities));
  } catch {
    console.error('Registry did not return a valid vulnerability report.');
    process.exitCode = 1;
  }
}
