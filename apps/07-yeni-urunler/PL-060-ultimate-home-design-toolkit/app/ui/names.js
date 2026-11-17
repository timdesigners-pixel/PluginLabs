/* Motor verisinin görünen adları: katalog, kaplama, mahal türü, kapı/pencere, maliyet kalemi …
 * Kimliği bilinen öğelerin adı dil dosyasından gelir; kullanıcının verdiği adlar olduğu gibi gösterilir. */
import { t, has } from "./i18n.js";

export function slug(s) {
  return String(s ?? "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pick(section, id, fallback) {
  const key = `${section}.${id}`;
  return has(key) ? t(key) : fallback;
}

export const catName = (item) => pick("catalog", item.id, item.name);
export const groupName = (g) => pick("catgroup", slug(g), g);
export const openingName = (o) => pick("opening", o.id, o.label);
export const roomKindName = (k) => pick("roomkind", k.id, k.label);
export const texKindName = (k) => pick("texkind", k.id, k.label);
export const unitName = (u) => pick("unit", u, u);
export const tierName = (label) => pick("tier", slug(label), label);
export const sceneName = (name) => pick("scenename", slug(name), name);

const PREFIXES = ["perde-tul", "perde-fon", "havuz-fayans", "nevresim", "baslik", "baza", "hali"];
export function matName(m) {
  if (!m) return "";
  const key = `material.${m.id}`;
  if (has(key)) return t(key);
  // motorların ürettiği renk kimlikli kaplamalar: "perde-tul-…", "hali-…" …
  const p = PREFIXES.find((x) => m.id.startsWith(`${x}-`));
  if (p && m.category !== "palet") return t(`materialprefix.${p}`);
  return m.name;
}

/** Maliyet kalemi adı: hazır kalemler kimliğinden, kaplama kalemleri kaplama adından. */
export function costLineName(line, materials) {
  if (has(`rate.${line.id}`)) return t(`rate.${line.id}`);
  const mat = (id) => materials.find((m) => m.id === id);
  if (line.id.startsWith("zemin-")) {
    const m = mat(line.id.slice(6));
    if (m) return t("names.zemin_kaplamasi", { name: matName(m) });
  }
  if (line.id.startsWith("cephe-")) {
    const m = mat(line.id.slice(6));
    if (m) return matName(m);
  }
  return line.name;
}
export const costGroupName = (g) => pick("rategroup", slug(g), g);

/** Öntanımlı adla kalmış oda: tür adı (ve sıra numarası) çevrilir. */
export function roomName(room, kinds) {
  const k = kinds.find((x) => x.id === room.kind);
  if (k) {
    const src = k.label_src || k.label;
    const m = String(room.name).match(new RegExp(`^${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\d+)?$`));
    if (m) return roomKindName(k) + (m[1] || "");
  }
  return pick("roomname", slug(room.name), room.name);
}

/** Katalogdan eklenmiş ve adı değiştirilmemiş nesne: katalog adı çevrilir. */
export function objectName(o, catalog) {
  if (typeof o.mesh === "string" && o.mesh.startsWith("cat:")) {
    const item = catalog.find((x) => x.id === o.mesh.slice(4));
    if (item && (o.name === (item.name_src || item.name) || !o.name)) return catName(item);
  }
  return o.name;
}
