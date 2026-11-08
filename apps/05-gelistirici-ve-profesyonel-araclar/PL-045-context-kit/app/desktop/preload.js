/* Masaüstü kabuğu: sayfaya yalnız `window.ckDesktop` adlı dar bir arayüz verir (contextBridge). */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("ckDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  source: {
    add: call("source:add"),
    clipboard: call("source:clipboard"),
    files: call("source:files"),
    sample: call("source:sample"),
    select: call("source:select"),
    toggle: call("source:toggle"),
  },
  exportMd: call("export:md"),
  exportXml: call("export:xml"),
  exportJson: call("export:json"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), brief: call("ai:brief"), apply: call("ai:apply") },
});
