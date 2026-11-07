/* Masaüstü kabuğu: sayfaya yalnız `window.axDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("axDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  capture: { text: call("capture:text"), clipboard: call("capture:clipboard"), files: call("capture:files"), sample: call("capture:sample") },
  item: {
    open: call("item:open"), update: call("item:update"), accept: call("item:accept"), acceptMany: call("item:acceptMany"),
    reject: call("item:reject"), toReview: call("item:toReview"), merge: call("item:merge"), done: call("item:done"),
  },
  openSource: call("source:open"),
  exportMd: call("export:md"),
  exportCsv: call("export:csv"),
  exportIcs: call("export:ics"),
  backup: call("export:backup"),
  widget: { open: call("widget:open"), close: call("widget:close"), focusApp: call("app:focus") },
  ai: { setKey: call("ai:setKey"), extract: call("ai:extract"), apply: call("ai:apply") },
});
