/* Masaüstü kabuğu: sayfaya yalnız `window.dpnDesktop` adlı dar bir arayüz verir (contextBridge). */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("dpnDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  capture: {
    text: call("capture:text"),
    clipboard: call("capture:clipboard"),
    files: call("capture:files"),
    sample: call("capture:sample"),
  },
  release: {
    open: call("release:open"),
    updateItem: call("release:updateItem"),
    updateMeta: call("release:updateMeta"),
  },
  openCommit: call("commit:open"),
  exportMd: call("export:md"),
  exportJson: call("export:json"),
  backup: call("export:backup"),
  ai: {
    setKey: call("ai:setKey"),
    draft: call("ai:draft"),
    apply: call("ai:apply"),
  },
});
