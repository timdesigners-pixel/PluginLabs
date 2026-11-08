/* Masaüstü kabuğu: sayfaya yalnız `window.dtsDesktop` adlı dar bir arayüz verir (contextBridge). */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("dtsDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  source: {
    add: call("source:add"),
    clipboard: call("source:clipboard"),
    files: call("source:files"),
    sample: call("source:sample"),
  },
  token: {
    select: call("token:select"),
    update: call("token:update"),
    approveAll: call("token:approveAll"),
  },
  exportJson: call("export:json"),
  exportCss: call("export:css"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), hierarchy: call("ai:hierarchy"), apply: call("ai:apply") },
});
