/* File Pilot — dizin tarayıcı (yalnız ana süreç). Kullanıcının seçtiği klasörleri OKUR; hiçbir dosyayı yazmaz, taşımaz, silmez, yeniden adlandırmaz.
 * Sınırlar: sembolik bağlantılar izlenmez (döngü ve klasör dışına kaçış yok), gizli/sistem dosyaları (ayara göre) ve hariç tutulan desenler atlanır,
 * metin yalnız bilinen metin uzantılarında ve boyut sınırının altında okunur; ikili/şifreli görünen içerik "okunamadı" olarak işaretlenir.
 * Artımlı: boyutu ve değişiklik zamanı aynı olan dosyanın metni yeniden okunmaz. */
const fs = require("node:fs");
const path = require("node:path");
const C = require("../src/core.js");

/** roots: mutlak klasör yolları; prev: Map(yol → önceki belge); onProgress({ files, dirs, current }) */
async function scan(roots, settings, prev, onProgress, shouldStop) {
  const st = C.settingsOf(settings);
  const maxBytes = st.maxSizeMB * 1024 * 1024;
  const docs = [];
  const errors = [];
  let dirs = 0, reused = 0, read = 0, skipped = 0, unreadable = 0;
  let lastTick = 0;
  const tick = (current) => {
    const t = Date.now();
    if (onProgress && t - lastTick > 120) { lastTick = t; onProgress({ files: docs.length, dirs, current }); }
  };
  for (const root of roots) {
    const stack = [root];
    while (stack.length) {
      if (shouldStop && shouldStop()) return { docs, errors, stats: { dirs, reused, read, skipped, unreadable, stopped: true } };
      const dir = stack.pop();
      let entries;
      try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { errors.push({ path: dir, error: e.code || String(e.message) }); continue; }
      dirs++;
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        const rel = path.relative(root, full);
        if (st.skipHidden && (ent.name.startsWith(".") || ent.name.startsWith("~$"))) { skipped++; continue; }
        if (C.excluded(rel, st.excludes)) { skipped++; continue; }
        if (ent.isSymbolicLink()) { skipped++; continue; }
        if (ent.isDirectory()) { stack.push(full); continue; }
        if (!ent.isFile()) continue;
        if (docs.length >= C.MAX_FILES) { errors.push({ path: root, error: "Dosya sınırı (" + C.MAX_FILES + ") aşıldı; kalan dosyalar indekslenmedi." }); stack.length = 0; break; }
        let s;
        try { s = await fs.promises.lstat(full); } catch (e) { errors.push({ path: full, error: e.code || String(e.message) }); continue; }
        const ext = C.extOf(ent.name);
        const mtime = Math.round(s.mtimeMs);
        const old = prev && prev.get(full);
        const doc = { id: C.makeId(full), path: full, root, rel, name: ent.name, ext, size: s.size, mtime, text: "", status: "ad", tags: old && Array.isArray(old.tags) ? old.tags : [] };
        if (C.isTextExt(ext)) {
          if (s.size > maxBytes) doc.status = "buyuk";
          else if (old && old.size === s.size && old.mtime === mtime && old.status !== "ad") { doc.text = old.text; doc.status = old.status; reused++; }
          else {
            try {
              const raw = C.decodeText(await fs.promises.readFile(full));
              if (raw == null) { doc.status = "okunamadi"; unreadable++; }
              else { doc.text = C.plainText(ext, raw); doc.status = "metin"; read++; }
            } catch (e) { doc.status = "okunamadi"; unreadable++; errors.push({ path: full, error: e.code || String(e.message) }); }
          }
        }
        docs.push(doc);
        tick(dir);
      }
    }
  }
  if (onProgress) onProgress({ files: docs.length, dirs, current: "" });
  return { docs, errors, stats: { dirs, reused, read, skipped, unreadable, stopped: false } };
}

module.exports = { scan };
