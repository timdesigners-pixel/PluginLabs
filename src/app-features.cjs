// Uygulama özellik anahtarları: registry/app-features.json tanımlarını doğrular ve kayıtlı değerlerle birleştirir.
"use strict";
const definitions = require("../registry/app-features.json");

const ID = /^[a-z0-9][a-z0-9-]{1,63}$/;
const KEY = /^[a-zA-Z][a-zA-Z0-9]{1,40}$/;

function list(appId) {
  return Array.isArray(definitions.apps[appId]) ? definitions.apps[appId] : null;
}

function resolve(appId, stored = {}) {
  const defs = list(appId);
  if (!defs) return null;
  return Object.fromEntries(defs.map((f) => [f.id, typeof stored[f.id] === "boolean" ? stored[f.id] : f.default]));
}

function validate(appId, values) {
  if (!ID.test(String(appId))) throw Object.assign(new Error("Geçersiz uygulama"), { status: 400 });
  const defs = list(appId);
  if (!defs) throw Object.assign(new Error("Bu uygulamanın özellik ayarı yok"), { status: 404 });
  if (!values || typeof values !== "object" || Array.isArray(values) || Object.keys(values).length > 40)
    throw Object.assign(new Error("Geçersiz özellik değeri"), { status: 400 });
  const known = new Set(defs.map((f) => f.id));
  for (const [k, v] of Object.entries(values)) {
    if (!KEY.test(k) || !known.has(k) || typeof v !== "boolean")
      throw Object.assign(new Error("Desteklenmeyen özellik"), { status: 400 });
  }
  return values;
}

module.exports = { definitions, list, resolve, validate };
