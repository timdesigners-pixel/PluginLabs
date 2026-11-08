/* Masaüstü kabuğu: sayfaya yalnız `window.msDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("msDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  run: {
    loadSample: call("run:loadSample"),
    compare: call("run:compare"),
    open: call("run:open"),
  },
  keys: {
    setProviderKey: call("keys:setProvider"),
  },
  catalog: {
    updatePrice: call("catalog:updatePrice"),
  },
  ai: {
    setKey: call("ai:setKey"),
    recommend: call("ai:recommend"),
  },
  exportCsv: call("export:csv"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
});
