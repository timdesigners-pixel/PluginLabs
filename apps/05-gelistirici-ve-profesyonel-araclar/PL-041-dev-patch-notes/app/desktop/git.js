/* Dev Patch Notes — yerel git deposundan YALNIZ OKUMA. Kabuk kullanılmaz (execFile), komutlar sabit beyaz listededir:
 * rev-parse (depo kökü / doğrulama), remote get-url origin, tag --list, log (commit listesi + numstat), show (tek commit farkı, yalnız MyMind isteğinde).
 * commit, push, tag oluşturma, checkout, fetch gibi depoyu ya da uzak sunucuyu değiştiren hiçbir komut YOKTUR. Aralık girdisi seçenek olarak
 * yorumlanamaz (--end-of-options + biçim denetimi). Ortam: GIT_TERMINAL_PROMPT=0, GIT_OPTIONAL_LOCKS=0 (salt okuma, kilit dosyası yazılmaz). */
const { execFile } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ALLOWED = new Set(["rev-parse", "remote", "tag", "log", "show"]);
const RANGE_RE = /^(?!-)[\w./^~@{}-]{1,120}(?:\.\.\.?[\w./^~@{}-]{1,120})?$/;
const REF_RE = /^(?!-)[\w./^~@{}-]{1,120}$/;
const FORMAT = "--format=%x1e%H%x1f%an%x1f%aI%x1f%P%x1f%s%x1f%b%x1d";

function run(dir, args, maxBuffer) {
  if (!ALLOWED.has(args[0])) return Promise.reject(new Error("İzin verilmeyen git komutu."));
  if (args[0] === "remote" && !(args[1] === "get-url" && args[2] === "origin")) return Promise.reject(new Error("İzin verilmeyen git komutu."));
  if (args[0] === "tag" && args[1] !== "--list") return Promise.reject(new Error("İzin verilmeyen git komutu."));
  const bin = process.env.DP_GIT || "git";
  return new Promise((resolve, reject) => {
    execFile(bin, ["-c", "core.quotepath=off", "-c", "log.showSignature=false", "-C", dir, ...args], {
      windowsHide: true, timeout: 20000, maxBuffer: maxBuffer || 32 * 1024 * 1024, encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0", GIT_PAGER: "cat", PAGER: "cat", LC_ALL: "C.UTF-8" },
    }, (err, stdout, stderr) => {
      if (err) {
        if (err.code === "ENOENT") return reject(new Error("git bulunamadı. Git for Windows'u kurun (git-scm.com) ya da git log çıktısını yapıştırın."));
        return reject(new Error(String(stderr || err.message).trim().split("\n")[0].slice(0, 300) || "git hatası"));
      }
      resolve(stdout);
    });
  });
}

/** Klasörün git deposu olduğunu doğrular; depo kökü, origin adresi ve son etiketler. */
async function inspect(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error("Klasör bulunamadı.");
  let top;
  try { top = (await run(dir, ["rev-parse", "--show-toplevel"])).trim(); } catch { throw new Error("Seçilen klasör bir git deposu değil."); }
  let remote = "";
  try { remote = (await run(top, ["remote", "get-url", "origin"])).trim(); } catch { /* uzak yok */ }
  let tags = [];
  try { tags = (await run(top, ["tag", "--list", "--sort=-creatordate"])).split("\n").map((t) => t.trim()).filter((t) => REF_RE.test(t)).slice(0, 30); } catch { /* etiket yok */ }
  let head = "";
  try { head = (await run(top, ["rev-parse", "--abbrev-ref", "HEAD"])).trim(); } catch { /* boş depo */ }
  return { dir: path.normalize(top), name: path.basename(top), remote, tags, head };
}

/** Commit listesi (makine biçimi). range: "v1.2.0..HEAD" gibi; boşsa son `max` commit. */
async function log(dir, range, max) {
  const args = ["log", "--no-color", "--no-ext-diff", "--numstat", "-n", String(Math.max(1, Math.min(1000, max || 300))), FORMAT];
  if (range) {
    if (!RANGE_RE.test(range)) throw new Error("Aralık biçimi geçersiz. Örnek: v1.2.0..HEAD, main~20..main");
    args.push("--end-of-options", range);
  }
  return run(dir, args);
}
async function show(dir, sha) {
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) throw new Error("Geçersiz commit.");
  return (await run(dir, ["show", "--no-color", "--no-ext-diff", "--format=", "--unified=1", "--end-of-options", sha], 4 * 1024 * 1024)).slice(0, 20000);
}

module.exports = { inspect, log, show, RANGE_RE, ALLOWED };
