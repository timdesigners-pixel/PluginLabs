/* Masaüstü kabuğu: sayfaya yalnız `window.nmDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(ch, fn);
  return () => ipcRenderer.removeListener(ch, fn);
};

contextBridge.exposeInMainWorld("nmDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  onCaptureFocus: on("capture:focus"),
  setSettings: call("settings:set"),
  notes: {
    loadSample: call("notes:loadSample"),
    create: call("notes:create"),
    update: call("notes:update"),
    toggle: call("notes:toggle"),
    remove: call("notes:remove"),
    recall: call("notes:recall"),
    copyMd: call("notes:copyMd"),
  },
  readClipboard: call("clipboard:read"),
  setMini: call("window:mini"),
  exportMd: call("export:md"),
  exportJson: call("export:json"),
  importJson: call("import:json"),
  ai: {
    setKey: call("ai:setKey"),
    draft: call("ai:draft"),
    applyTasks: call("ai:applyTasks"),
  },
});
