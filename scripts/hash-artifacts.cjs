const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
(async () => {
  const dir = path.resolve(__dirname, '../dist');
  const files = fs.readdirSync(dir).filter(name => /\.(exe|AppImage)$/.test(name)).sort();
  if (!files.length) throw new Error('No preview packages were built');
  const rows = [];
  for (const name of files) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(path.join(dir, name))) hash.update(chunk);
    rows.push(`${hash.digest('hex')}  ${name}`);
  }
  fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), rows.join('\n') + '\n');
  const { execFileSync } = require('node:child_process');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(dir, 'BUILD-INFO.json'), JSON.stringify({
    commit, dirty, platform: process.platform, arch: process.arch,
    node: process.version, version: require('../package.json').version,
    packages: files, releasePublished: false,
  }, null, 2) + '\n');
  console.log(`Hashed ${files.length} preview packages; wrote build provenance`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
