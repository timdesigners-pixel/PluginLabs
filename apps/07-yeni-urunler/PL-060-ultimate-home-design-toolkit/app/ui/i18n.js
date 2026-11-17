/* Dil desteği: arayüz metinleri yalnız locales/<dil>.json dosyalarındadır.
 * t(anahtar, değerler) metni döndürür; {ad} yer tutucuları değerlerle doldurulur.
 * HTML'de data-i18n (metin) ve data-i18n-attr ("öznitelik=anahtar;…") kullanılır.
 * Motorun döndürdüğü iletiler "@anahtar|ad=değer|…" biçimindedir; tr() bunları çevirir. */
export const LANGS = ["tr", "en"];
const DEFAULT_LANG = "tr";
let lang = DEFAULT_LANG;
let dict = {};
const missing = new Set();

function flatten(o, prefix, out) {
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}

function storedLang() {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    const s = localStorage.getItem("uh-lang");
    if (LANGS.includes(s)) return s;
  } catch {
    /* depolama kapalı olabilir */
  }
  return DEFAULT_LANG;
}

export async function init(code) {
  lang = LANGS.includes(code) ? code : storedLang();
  const res = await fetch(`locales/${lang}.json`);
  if (!res.ok) throw new Error(`locales/${lang}.json`);
  dict = flatten(await res.json(), "", {});
  document.documentElement.lang = lang;
  return lang;
}

export function getLang() {
  return lang;
}

export function setLang(code) {
  if (!LANGS.includes(code)) return;
  try {
    localStorage.setItem("uh-lang", code);
  } catch {
    /* depolama kapalı olabilir */
  }
}

/** Sayı ve sıralama için yerel ayar. */
export function locale() {
  return lang === "tr" ? "tr-TR" : "en-US";
}

export function has(key) {
  return Object.prototype.hasOwnProperty.call(dict, key);
}

export function t(key, params) {
  let s = dict[key];
  if (s === undefined) {
    if (!missing.has(key)) {
      missing.add(key);
      console.warn(`i18n: eksik anahtar ${key}`);
    }
    s = key;
  }
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m));
  return s;
}

/** Motor iletisi: "@anahtar|ad=değer|…" çevrilir; değerlerdeki @anahtar da çevrilir. */
export function tr(text) {
  if (typeof text !== "string" || !text.startsWith("@")) return text;
  const [key, ...rest] = text.slice(1).split("|");
  const params = {};
  for (const p of rest) {
    const i = p.indexOf("=");
    if (i > 0) {
      const v = p.slice(i + 1);
      params[p.slice(0, i)] = v.startsWith("~") ? t(v.slice(1)) : v.startsWith("@") ? tr(v.replace(/¦/g, "|")) : v;
    }
  }
  return t(`engine.${key}`, params);
}

/** Eksik anahtarlar (denetim için). */
export function missingKeys() {
  return [...missing];
}

export function apply(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split("=");
      if (attr && key) el.setAttribute(attr, t(key));
    }
  }
}
