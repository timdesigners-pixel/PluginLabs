/* Masaüstü kabuğu: sayfaya yalnız `window.mlDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("mlDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  mail: {
    importFiles: call("mail:importFiles"),
    paste: call("mail:paste"),
    sample: call("mail:sample"),
    open: call("mail:open"),
    decide: call("mail:decide"),
    accept: call("mail:accept"),
    reset: call("mail:reset"),
    archive: call("mail:archive"),
  },
  bulk: { preview: call("bulk:preview"), apply: call("bulk:apply") },
  draft: { make: call("draft:make"), set: call("draft:set"), copy: call("draft:copy") },
  exportCsv: call("export:csv"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), suggest: call("ai:suggest"), apply: call("ai:apply") },
});
