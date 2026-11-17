// Dil dosyası denetimi: node scripts/i18n-check.cjs
// 1) tr.json ve en.json aynı anahtarlara sahip, hiçbir metin boş değil
// 2) {yer tutucu} kümeleri iki dilde aynı
// 3) İngilizce metinlerde Türkçe harf yok; iki dilde aynı kalan metinler yalnız izinli türlerden (birim, marka, sayı, biçim)
// 4) Kodda kullanılan her anahtar (L("…"), data-i18n, motorun "@anahtar" iletileri) dil dosyasında var
// 5) Arayüz kodunda (HTML/JS) dil dosyası dışında Türkçe arayüz metni kalmamış
const fs = require("fs");
const path = require("path");

const app = path.join(__dirname, "..");
const ui = path.join(app, "ui");
const flatten = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};
const tr = flatten(JSON.parse(fs.readFileSync(path.join(ui, "locales", "tr.json"), "utf8")));
const en = flatten(JSON.parse(fs.readFileSync(path.join(ui, "locales", "en.json"), "utf8")));
const errors = [];
const notes = [];
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

// 1
for (const k of Object.keys(tr)) if (!(k in en)) errors.push(`en.json eksik: ${k}`);
for (const k of Object.keys(en)) if (!(k in tr)) errors.push(`tr.json eksik: ${k}`);
for (const [lang, d] of [["tr", tr], ["en", en]]) for (const [k, v] of Object.entries(d)) if (typeof v !== "string" || !v.trim()) errors.push(`${lang}.json boş metin: ${k}`);
// 2
const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const k of Object.keys(tr)) if (k in en && ph(tr[k]) !== ph(en[k])) errors.push(`yer tutucu uyuşmuyor: ${k} (tr: ${ph(tr[k])} · en: ${ph(en[k])})`);
// 3
const SAME_OK = (v) => {
  const letters = v.replace(/\{\w+\}/g, "").replace(/[^A-Za-z]/g, "");
  if (letters.length <= 3) return true; // birim, sayı, kısaltma (cm, m², f/8, 4K…)
  return /^(PluginLabs Apps|Premium|Model|Metal|Poly Haven · CC0 · \{author\}|\d · Model|NET \{p\} m²|Net m²|Oval|Parapet|Net|Soundbar|Cycles|Ultra · 512|Final · 128|ceil\(.*\)|.*\(HD\)|.*\(Full HD\)|.*\(4K\)|.*\(8K\)|PluginLabs Hub.*|\{name\}: \{reason\}|\{name\} \{w\}×\{d\} cm)$/.test(v);
};
let same = 0;
for (const [k, v] of Object.entries(en)) {
  if (TR_CHARS.test(v)) errors.push(`İngilizce metinde Türkçe harf: ${k} = ${v}`);
  if (tr[k] === v) {
    same++;
    if (!SAME_OK(v)) errors.push(`çevrilmemiş görünüyor (tr = en): ${k} = ${v}`);
  }
}
// 4
const used = new Set();
const read = (f) => fs.readFileSync(f, "utf8");
for (const f of fs.readdirSync(ui).filter((x) => x.endsWith(".js"))) {
  const s = read(path.join(ui, f));
  for (const m of s.matchAll(/\b(?:L|t)\("([a-z0-9_-]+\.[a-z0-9_.-]+)"/g)) used.add(m[1]);
}
const html = read(path.join(ui, "index.html"));
for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(";")) used.add(pair.split("=")[1]);
const rsDirs = [path.join(app, "engine", "src"), path.join(app, "src-tauri", "src")];
for (const d of rsDirs) {
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".rs"))) {
    const s = read(path.join(d, f)).split("#[cfg(test)]")[0].split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    for (const m of s.matchAll(/"@([a-z0-9_]+)/g)) used.add(`engine.${m[1]}`);
  }
}
used.add("engine.worker_file");
for (const k of used) if (!(k in tr) || !(k in en)) errors.push(`kodda kullanılan anahtar dil dosyasında yok: ${k}`);
const unused = Object.keys(tr).filter((k) => !used.has(k) && !/^(catalog|catgroup|opening|roomkind|material|materialprefix|rate|rategroup|unit|texkind|tier|names|roomname|scenename|motor|mm|ral|ralgroup|ph\.cat|ph\.tcat)\./.test(k));
if (unused.length) notes.push(`kullanılmayan ${unused.length} anahtar: ${unused.slice(0, 12).join(", ")}${unused.length > 12 ? " …" : ""}`);
// 5
const acorn = (() => {
  for (const p of [path.join(app, "node_modules", "acorn"), "/opt/node-tools/node_modules/acorn"]) {
    try { return require(p); } catch { /* sonraki */ }
  }
  return null;
})();
const ALLOWED_JS = new Set(["korniş", "Ö"]); // veri değerleri: motor parametresi ve ölçü çizgisi kimlik öneki, arayüz metni değil
for (const f of fs.readdirSync(ui).filter((x) => x.endsWith(".js") && x !== "i18n.js")) {
  const s = read(path.join(ui, f));
  if (acorn) {
    const ast = acorn.parse(s, { ecmaVersion: 2022, sourceType: "module", locations: true });
    const walk = (n) => {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "Literal" && typeof n.value === "string" && TR_CHARS.test(n.value) && !ALLOWED_JS.has(n.value) && !/^[çğıöşü]$/.test(n.value)) errors.push(`${f}:${n.loc.start.line} kodda Türkçe metin: ${n.value.slice(0, 60)}`);
      if (n.type === "TemplateElement" && TR_CHARS.test(n.value.raw)) errors.push(`${f}:${n.loc.start.line} şablonda Türkçe metin: ${n.value.raw.slice(0, 60)}`);
      for (const v of Object.values(n)) {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object" && typeof v.type === "string") walk(v);
      }
    };
    walk(ast);
  } else {
    // acorn yoksa yine de satır düzeyinde tarama
    s.split("\n").forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      for (const m of line.matchAll(/"([^"\\]*)"|`([^`]*)`/g)) {
        const v = m[1] ?? m[2] ?? "";
        if (TR_CHARS.test(v) && !ALLOWED_JS.has(v) && !/^[çğıöşü]$/.test(v)) errors.push(`${f}:${i + 1} kodda Türkçe metin: ${v.slice(0, 60)}`);
      }
    });
    notes.push("acorn bulunamadı; JS taraması satır düzeyinde yapıldı");
  }
}
const htmlText = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "\n").split("\n").map((x) => x.trim()).filter(Boolean);
for (const t of htmlText) if (TR_CHARS.test(t) && t !== "Türkçe") errors.push(`index.html'de çevrilmemiş metin: ${t}`);
for (const m of html.matchAll(/\s(?:aria-label|placeholder|title|alt)="([^"]*)"/g)) if (TR_CHARS.test(m[1])) errors.push(`index.html özniteliğinde Türkçe metin: ${m[1]}`);

const total = Object.keys(tr).length;
console.log(`Dil dosyaları: tr.json ${total} metin, en.json ${Object.keys(en).length} metin; kodda kullanılan ${used.size} anahtar; iki dilde aynı kalan ${same} metin (birim, marka, sayı).`);
for (const n of notes) console.log(`not: ${n}`);
if (errors.length) {
  console.error(`HATA (${errors.length}):\n` + errors.slice(0, 80).join("\n"));
  process.exit(1);
}
console.log("Çeviri denetimi geçti: Türkçe ve İngilizce tam.");
