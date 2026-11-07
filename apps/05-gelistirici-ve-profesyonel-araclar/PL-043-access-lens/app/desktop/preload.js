/* Masaüstü kabuğu: sayfaya yalnız `window.alDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("alDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  audit: { url: call("audit:url"), file: call("audit:file"), paste: call("audit:paste"), samples: call("audit:samples"), rerun: call("audit:rerun"), open: call("audit:open"), archive: call("audit:archive"), restore: call("audit:restore") },
  finding: { fp: call("finding:fp"), show: call("finding:show") },
  openLink: call("link:open"),
  exportMd: call("export:md"),
  exportJson: call("export:json"),
  exportCsv: call("export:csv"),
  ai: { setKey: call("ai:setKey"), explain: call("ai:explain") },
});
