// Çekirdek birim testleri (node:test). Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../src/core.js");

const E = (value, uses, roles, samples) => ({ value, uses, roles: roles || {}, samples: samples || [] });
const raw = (over) => ({
  url: "https://ornek.example/sayfa", title: "Örnek", lang: "tr", viewport: { w: 1280, h: 900 }, elements: 120, sampled: 100, hidden: 3, capped: false, blockedSheets: 1, durationMs: 40,
  base: { color: "rgb(31, 41, 55)", background: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", fontSize: "16px" },
  values: {
    color: [E("rgb(31, 41, 55)", 30, { metin: 30 }, ["p"]), E("rgb(30, 40, 54)", 4, { metin: 4 }, [".kart p"]), E("#ffffff", 12, { zemin: 12 }, ["body"]), E("rgb(37, 99, 235)", 6, { zemin: 6 }, ["button"]), E("rgba(0, 0, 0, 0.5)", 2, { zemin: 2 }, [".perde"]), E("rgb(229, 231, 235)", 5, { kenarlik: 5 }, [".kart"]), E("rgb(250, 0, 0)", 1, { metin: 1 }, [".tek"]), E("transparent", 9, { zemin: 9 })],
    fontFamily: [E("Inter, system-ui, sans-serif", 40, {}, ["p"]), E("inter, Arial", 2, {}, ["small"]), E("Georgia, serif", 5, {}, ["h1", "main > h2"]), E("Consolas, monospace", 3, {}, ["code"])],
    fontSize: [E("16px", 30), E("16.4px", 2), E("14px", 10), E("32px", 1, {}, ["h1"]), E("20px", 4), E("11px", 1, {}, [".dipnot"])],
    fontWeight: [E("400", 30), E("700", 6)],
    lineHeight: [E("1.5", 30), E("1.2", 5)],
    space: [E("8px", 20, { padding: 20 }), E("16px", 15, { margin: 15 }), E("24px", 6, { gap: 6 }), E("7px", 1), E("12px", 4)],
    radius: [E("6px", 8), E("6.5px", 1), E("50%", 2), E("9999px", 3)],
    shadow: [E("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px", 4), E("bozuk gölge", 2)],
  },
  vars: [{ name: "--renk-vurgu", value: "#2563eb" }, { name: "bozuk", value: "x" }],
  states: [{ state: "hover", prop: "background-color", value: "rgb(29, 78, 216)", selector: "button:hover" }, { state: "focus-visible", prop: "outline-color", value: "#93c5fd", selector: "a:focus-visible" }, { state: "garip", prop: "color", value: "#000", selector: "x" }],
  expected: { color: ["#1f2937", "#ffffff", "#2563eb", "#e5e7eb"], fontSize: ["14px", "16px", "20px", "32px"], space: ["8px", "16px", "24px"], radius: ["6px"], fontFamily: ["Inter"], birlesmeli: [["#1f2937", "#1e2836"]] },
  ...(over || {}),
});
const scanOf = (settings, over) => C.normalizeRun(raw(over), { kind: "url", url: "https://ornek.example/sayfa", at: "2026-11-08T10:00:00Z", scripts: true }, C.normalizeSettings(settings || {}));
const tok = (s, name) => s.tokens.find((t) => t.name === name);

test("renk ayrıştırma: hex/rgb/rgba tek biçime; saydam atlanır; ΔE yakın tonda küçük, saydamlık farkında sonsuz", () => {
  assert.equal(C.normColor("rgb(31, 41, 55)"), "#1f2937");
  assert.equal(C.normColor("#ABC"), "#aabbcc");
  assert.equal(C.normColor("rgba(0, 0, 0, 0.5)"), "#00000080");
  assert.equal(C.normColor("rgba(0, 0, 0, 0)"), "");
  assert.equal(C.normColor("transparent"), "");
  assert.equal(C.normColor("url(javascript:alert(1))"), "");
  assert.ok(C.deltaE("#1f2937", "#1e2836") < 1);
  assert.ok(C.deltaE("#1f2937", "#2563eb") > 30);
  assert.equal(C.deltaE("#000000", "#00000080"), Infinity);
  assert.equal(C.colorFamily(C.parseColor("#1f2937")), "neutral");
  assert.equal(C.colorFamily(C.parseColor("#2563eb")), "blue");
  assert.equal(C.colorStep(C.parseColor("#ffffff")), 50);
  assert.equal(C.contrast("#000000", "#ffffff"), 21);
});

test("ölçü ve gölge: px dışı ve anlamsız değerler atlanır; gölge DTCG nesnesine çözülür", () => {
  assert.equal(C.normValue("space", "8px"), "8px");
  assert.equal(C.normValue("space", "auto"), "");
  assert.equal(C.normValue("space", "-4px"), "");
  assert.equal(C.normValue("radius", "1000px"), "9999px");
  assert.equal(C.normValue("fontFamily", 'Inter}; body{x:url(a)} /*'), "Inter bodyxurla");
  assert.deepEqual(C.parseShadow("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px"), [{ color: "#0000001a", offsetX: "0px", offsetY: "1px", blur: "3px", spread: "0px", inset: false }]);
  assert.equal(C.parseShadow("bozuk gölge"), null);
  assert.equal(C.normValue("shadow", "inset rgb(0, 0, 0) 0px 2px 4px 0px"), "inset 0px 2px 4px 0px #000000");
});

test("kümeleme: yakın renkler en çok kullanılanın değerinde birleşir, yeni değer üretilmez; ΔE kapalıyken ayrı kalır", () => {
  const s = scanOf({ colorTol: 3 });
  const text = s.tokens.find((t) => t.cat === "color" && t.value === "#1f2937");
  assert.equal(text.uses, 34);
  assert.deepEqual(text.members.map((m) => m.value), ["#1f2937", "#1e2836"]);
  const all = s.tokens.map((t) => t.value);
  for (const v of all.filter((v) => v.startsWith("#"))) assert.ok(Object.values(raw().values).flat().some((e) => C.normColor(e.value) === v) || raw().states.some((x) => C.normColor(x.value) === v), "uydurma renk yok: " + v);
  const off = scanOf({ colorTol: 0 });
  assert.equal(off.tokens.filter((t) => t.cat === "color").length, s.tokens.filter((t) => t.cat === "color").length + 1);
  const fs = s.tokens.find((t) => t.cat === "fontSize" && t.value === "16px");
  assert.equal(fs.uses, 32, "16.4px 1 px toleransla 16px'e katıldı");
  assert.equal(s.tokens.find((t) => t.cat === "radius" && t.value === "6px").uses, 9);
  assert.ok(s.tokens.some((t) => t.value === "50%") && s.tokens.some((t) => t.value === "9999px"), "daire ve hap köşesi ayrı");
  assert.equal(s.tokens.filter((t) => t.cat === "fontFamily" && /inter/i.test(t.value)).length, 1, "aynı birincil aile birleşir");
  assert.equal(s.tokens.filter((t) => t.cat === "shadow").length, 1, "bozuk gölge atlandı");
});

test("adlandırma: sayfa değişkeni adı korunur, gövde boyutu md, gövde ailesi base, başlık/mono aileleri, ızgaraya göre boşluk, köşe ve durum takma adları", () => {
  const s = scanOf();
  assert.equal(tok(s, "color.renk-vurgu").value, "#2563eb");
  assert.equal(tok(s, "color.renk-vurgu").varName, "--renk-vurgu");
  assert.equal(tok(s, "color.neutral.800").value, "#1f2937");
  assert.equal(tok(s, "font.size.md").value, "16px");
  assert.equal(tok(s, "font.size.sm").value, "14px");
  assert.equal(tok(s, "font.size.lg").value, "20px");
  assert.equal(tok(s, "font.family.base").value, "Inter, system-ui, sans-serif");
  assert.equal(tok(s, "font.family.heading").value, "Georgia, serif");
  assert.equal(tok(s, "font.family.mono").value, "Consolas, monospace");
  assert.equal(tok(s, "font.weight.bold").value, "700");
  assert.equal(tok(s, "font.line-height.normal").value, "1.5");
  assert.equal(tok(s, "space.2").value, "8px");
  assert.equal(tok(s, "space.6").value, "24px");
  assert.deepEqual(tok(s, "space.2").members.map((m) => m.value), ["8px", "7px"], "7px, 1 px toleransla 8px'e katıldı");
  assert.equal(tok(s, "space.3").value, "12px");
  assert.equal(tok(s, "radius.full").value, "9999px");
  assert.equal(tok(s, "radius.circle").value, "50%");
  assert.equal(new Set(s.tokens.map((t) => t.name)).size, s.tokens.length, "adlar benzersiz");
  const alias = Object.fromEntries(s.aliases.map((a) => [a.name, s.tokens.find((t) => t.id === a.ref).value]));
  assert.equal(alias["color.text.default"], "#1f2937");
  assert.equal(alias["color.surface.default"], "#ffffff");
  assert.equal(alias["color.border.default"], "#e5e7eb");
  assert.equal(alias["color.accent.default"], "#2563eb");
  assert.equal(alias["color.state.hover"], "#1d4ed8");
  assert.equal(alias["color.state.focus-visible"], "#93c5fd");
  assert.equal(s.states.length, 2, "bilinmeyen durum atlandı");
  assert.equal(s.vars.length, 1, "geçersiz değişken adı atlandı");
});

test("öneri: eşik altı seyrek değerler önerilmez ama sayfa değişkeni, gövde ve başlık boyutu çapa olarak önerilir; onay yalnız önerilenlere", () => {
  const s = scanOf({ minUses: 2 });
  assert.equal(C.proposed(s, s.tokens.find((t) => t.value === "#fa0000")), false);
  assert.equal(C.proposed(s, s.tokens.find((t) => t.cat === "fontSize" && t.value === "11px")), false);
  const h1 = s.tokens.find((t) => t.cat === "fontSize" && t.value === "32px");
  assert.equal(h1.anchor, "baslik");
  assert.equal(C.proposed(s, h1), true);
  const n = C.approveProposed(s);
  assert.equal(n, s.tokens.filter((t) => C.proposed(s, t)).length);
  assert.ok(!s.tokens.find((t) => t.value === "#fa0000").ok);
  const sm = C.summarize(s);
  assert.equal(sm.ok, n);
  assert.ok(sm.coverage > 95 && sm.reduction > 0);
  assert.deepEqual(sm.grid, { base: 8, share: 89.1 });
});

test("örnek sayfa doğrulaması: beklenen ana değer kapsaması ve birleşmesi gereken çift", () => {
  const s = scanOf();
  const fe = C.evaluateFixture(s);
  assert.equal(fe.expected, 13);
  assert.equal(fe.hit, 13);
  assert.equal(fe.coverage, 100);
  assert.equal(fe.merged, 1);
  const strict = scanOf({ colorTol: 0 });
  assert.equal(C.evaluateFixture(strict).merged, 0);
  const m = C.metrics([{ ...s, target: { kind: "ornek", fixture: "a" } }], {});
  assert.equal(m.fixture.pages, 1);
  assert.equal(m.fixture.coverage, 100);
});

test("ad doğrulaması: biçim, tür kökü, benzersizlik ve grup çakışması", () => {
  const s = scanOf();
  const t = s.tokens.find((x) => x.cat === "color");
  assert.match(C.validateName(s, t.id, "Renk Ana"), /küçük harf/);
  assert.match(C.validateName(s, t.id, "space.ana"), /color\./);
  assert.match(C.validateName(s, t.id, s.tokens.find((x) => x.cat === "color" && x.id !== t.id).name), /başka bir token/);
  assert.match(C.validateName(s, t.id, "color.neutral"), /grubuyla çakışıyor/);
  assert.equal(C.validateName(s, t.id, "color.brand.primary"), "");
});

test("dışa aktarma: yalnız onaylı tokenlar; DTCG yapısı, takma ad başvurusu, CSS değişkenleri, Markdown", () => {
  const s = scanOf();
  for (const t of s.tokens) t.ok = ["color.neutral.800", "color.renk-vurgu", "font.size.md", "shadow.sm", "font.family.base", "font.weight.bold"].includes(t.name);
  const j = JSON.parse(C.exportDtcg(s, "0.1.0"));
  assert.deepEqual(j.color.neutral["800"].$value, "#1f2937");
  assert.equal(j.color.neutral["800"].$type, "color");
  assert.match(j.color.neutral["800"].$description, /34 kullanım · birleşen: #1f2937, #1e2836/);
  assert.equal(j.font.size.md.$value, "16px");
  assert.deepEqual(j.font.family.base.$value, ["Inter", "system-ui", "sans-serif"]);
  assert.equal(j.font.weight.bold.$value, 700);
  assert.deepEqual(j.shadow.sm.$value, { color: "#0000001a", offsetX: "0px", offsetY: "1px", blur: "3px", spread: "0px" });
  assert.equal(j.color.text.default.$value, "{color.neutral.800}");
  assert.equal(j.color.accent.default.$value, "{color.renk-vurgu}");
  assert.equal(j.color.surface, undefined, "onaysız tokena giden takma ad yazılmaz");
  assert.equal(j.space, undefined);
  assert.match(j.$extensions["com.pluginlabs.design-token-scout"].source, /ornek\.example/);
  const css = C.exportCss(s, "0.1.0");
  assert.match(css, /--color-neutral-800: #1f2937; \/\* 34 kullanım \*\//);
  assert.match(css, /--font-family-base: Inter, system-ui, sans-serif;/);
  assert.match(css, /--color-text-default: var\(--color-neutral-800\);/);
  assert.doesNotMatch(css, /--space-/);
  const md = C.exportMarkdown(s, "0.1.0");
  assert.match(md, /^# Tasarım tokenları — Örnek/);
  assert.match(md, /\| `color.neutral.800` \| `--color-neutral-800` \| `#1f2937` \| 34 \|/);
  assert.match(md, /Örnek sayfa doğrulaması: beklenen 13 ana değerin 13'i/);
  assert.match(md, /aday onaylanmadığı için dosyalara alınmadı/);
});

test("MyMind: yalnız tür/değer/kullanım gider (adres, seçici, metin yok); geçersiz, bilinmeyen ve türüne uymayan öneriler atılır; değer değişmez", () => {
  const s = scanOf();
  const p = C.aiPayload(s);
  const body = JSON.stringify(p.messages);
  assert.ok(!body.includes("ornek.example") && !body.includes(".kart") && !body.includes("Örnek"));
  assert.ok(p.sent.tokens > 5);
  const first = Object.keys(p.map)[0], second = Object.keys(p.map)[1];
  const t1 = s.tokens.find((t) => t.id === p.map[first]);
  const goodName = C.CATS[t1.cat].root + ".brand.primary";
  const res = C.validateAi("```json\n" + JSON.stringify({ oneriler: [{ id: first, ad: goodName, neden: "en çok kullanılan" }, { id: second, ad: "Kötü Ad" }, { id: "t999", ad: "color.yok.var" }, { id: second, ad: "shadow.yanlis.tur" }, { id: first, ad: goodName }] }) + "\n```", s, p.map);
  assert.equal(res.suggestions.length, 1);
  assert.equal(res.dropped, 4);
  s.ai = { ...res, applied: false };
  const before = t1.value;
  assert.equal(C.applyAi(s), 1);
  assert.equal(t1.name, goodName);
  assert.equal(t1.value, before);
  assert.equal(t1.nameSource, "mymind");
  assert.equal(C.validateAi("serbest metin", s, p.map).dropped, 1);
});

test("ayarlar ve kalıcılık: yalnız izinli değerler; yerel model adresi yalnız loopback; bozuk kayıt atılır", () => {
  const st = C.normalizeSettings({ colorTol: 99, numTol: "2", minUses: 0, width: 777, localUrl: "http://10.0.0.5:1234", provider: "x" });
  assert.equal(st.colorTol, 3);
  assert.equal(st.numTol, 2);
  assert.equal(st.minUses, 2);
  assert.equal(st.width, 1280);
  assert.equal(st.localUrl, "http://127.0.0.1:1234");
  assert.equal(st.provider, "hub");
  const s = scanOf();
  const list = C.normalizeScans([s, { id: 5 }, null, { ...s, id: "x", tokens: [{ cat: "yok", name: "a" }, ...s.tokens] }]);
  assert.equal(list.length, 2);
  assert.equal(list[1].tokens.length, s.tokens.length);
  assert.equal(C.parseTarget("ornek.com/a#b"), "https://ornek.com/a");
  assert.equal(C.parseTarget("file:///C:/x.html"), null);
  assert.equal(C.parseTarget("https://kullanici:sifre@ornek.com"), null);
});
