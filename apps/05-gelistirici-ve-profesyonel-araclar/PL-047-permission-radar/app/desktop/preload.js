/* Masaüstü kabuğu: sayfaya yalnız `window.prDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("prDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  inventory: {
    loadSample: call("inv:loadSample"),
    inspectJson: call("inv:inspectJson"),
    open: call("inv:open"),
    openChromeManage: call("inv:openChromeManage"),
  },
  ai: {
    setKey: call("ai:setKey"),
    explain: call("ai:explain"),
  },
  exportCsv: call("export:csv"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
});
