/* Masaüstü kabuğu: sayfaya yalnız `window.dtsDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("dtsDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  scan: { url: call("scan:url"), file: call("scan:file"), paste: call("scan:paste"), samples: call("scan:samples"), rerun: call("scan:rerun"), open: call("scan:open"), archive: call("scan:archive"), restore: call("scan:restore") },
  token: { approve: call("token:approve"), approveProposed: call("token:approveProposed"), clear: call("token:clear"), rename: call("token:rename"), rebuild: call("token:rebuild"), show: call("token:show") },
  openLink: call("link:open"),
  exportJson: call("export:json"),
  exportCss: call("export:css"),
  exportMd: call("export:md"),
  ai: { setKey: call("ai:setKey"), name: call("ai:name"), apply: call("ai:apply"), discard: call("ai:discard") },
});
