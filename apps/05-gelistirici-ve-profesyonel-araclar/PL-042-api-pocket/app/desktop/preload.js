/* Masaüstü kabuğu: sayfaya yalnız `window.apDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si, ağ ve sır değerleri sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("apDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  tpl: { create: call("tpl:new"), open: call("tpl:open"), set: call("tpl:set"), duplicate: call("tpl:duplicate"), archive: call("tpl:archive"), restore: call("tpl:restore"), send: call("tpl:send"), copyCurl: call("tpl:copyCurl") },
  env: { create: call("env:new"), set: call("env:set"), vars: call("env:vars") },
  importCurl: call("import:curl"),
  importCollection: call("import:collection"),
  sample: call("sample:start"),
  exportCollection: call("export:collection"),
  exportResponse: call("export:response"),
  copyResponse: call("copy:response"),
  ai: { setKey: call("ai:setKey"), explain: call("ai:explain"), draft: call("ai:draft") },
});
