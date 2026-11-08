/* Masaüstü kabuğu: sayfaya yalnız `window.oaDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("oaDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  task: {
    loadSample: call("task:loadSample"),
    runRuleBased: call("task:runRuleBased"),
    runLocalLlm: call("task:runLocalLlm"),
    open: call("task:open"),
  },
  ai: {
    setKey: call("ai:setKey"),
  },
  exportTxt: call("export:txt"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
});
