/* Masaüstü kabuğu: sayfaya yalnız `window.itDesktop` adlı dar bir arayüz verir (contextBridge). */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("itDesktop", {
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
  table: {
    open: call("table:open"),
    updateColumn: call("table:updateColumn"),
    editCell: call("table:editCell"),
    resetCell: call("table:resetCell"),
  },
  openSource: call("source:open"),
  exportCsv: call("export:csv"),
  exportJson: call("export:json"),
  backup: call("export:backup"),
  ai: {
    setKey: call("ai:setKey"),
    normalize: call("ai:normalize"),
    apply: call("ai:apply"),
  },
});
