/* Masaüstü kabuğu: sayfaya yalnız `window.msDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("msDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  setKey: call("key:set"),
  catalog: { set: call("catalog:set"), add: call("catalog:add"), reset: call("catalog:reset") },
  plan: call("run:plan"),
  run: call("run:compare"),
  runs: { open: call("run:open"), rate: call("run:rate"), winner: call("run:winner"), note: call("run:note"), archive: call("run:archive"), restore: call("run:restore"), sample: call("run:sample"), copy: call("run:copy") },
  exportCsv: call("export:csv"),
  exportJson: call("export:json"),
  ai: { classify: call("ai:classify") },
});
