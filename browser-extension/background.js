"use strict";
let syncing = false;
const LABELS = {
  enable: "Etkinleştir",
  disable: "Devre dışı bırak",
  uninstall: "Kaldır",
  options: "Ayarları aç",
};
async function sync() {
  if (syncing) return;
  syncing = true;
  try {
    const {
      token,
      port = 47632,
      results = [],
    } = await chrome.storage.local.get(["token", "port", "results"]);
    if (!token) return;
    const all = await chrome.management.getAll();
    const extensions = all.map(
      ({
        id,
        name,
        version,
        description,
        enabled,
        mayDisable,
        isApp,
        type,
        installType,
        permissions,
        hostPermissions,
      }) => ({
        id,
        name,
        version,
        description,
        enabled,
        mayDisable,
        isApp,
        type,
        installType,
        permissions,
        hostPermissions,
      }),
    );
    const response = await fetch(`http://127.0.0.1:${port}/v1/browser/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ extensions, results }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Hub bağlantısı başarısız");
    await chrome.storage.local.set({
      commands: data.commands,
      results: [],
      lastSync: Date.now(),
      error: null,
    });
    await chrome.action.setBadgeText({
      text: data.commands.length ? String(data.commands.length) : "",
    });
    await chrome.action.setBadgeBackgroundColor({ color: "#c1f78a" });
  } catch (e) {
    await chrome.storage.local.set({ error: e.message });
  } finally {
    syncing = false;
  }
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("hub-sync", { periodInMinutes: 0.5 });
  sync();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("hub-sync", { periodInMinutes: 0.5 });
  sync();
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "hub-sync") sync();
});
chrome.management.onInstalled.addListener(sync);
chrome.management.onUninstalled.addListener(sync);
chrome.management.onEnabled.addListener(sync);
chrome.management.onDisabled.addListener(sync);
chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (message?.type === "sync") {
    sync().then(() => reply({ ok: true }));
    return true;
  }
});
