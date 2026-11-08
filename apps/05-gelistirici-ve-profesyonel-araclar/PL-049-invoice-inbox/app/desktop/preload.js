/* Masaüstü kabuğu: sayfaya yalnız `window.invDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(ch, fn);
  return () => ipcRenderer.removeListener(ch, fn);
};

contextBridge.exposeInMainWorld("invDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  ingest: {
    text: call("ingest:text"),
    clipboard: call("ingest:clipboard"),
    files: call("ingest:files"),
    sample: call("ingest:sample"),
  },
  doc: {
    open: call("doc:open"),
    update: call("doc:update"),
    approve: call("doc:approve"),
    reject: call("doc:reject"),
    toReview: call("doc:toReview"),
  },
  exportCsv: call("export:csv"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
  ai: {
    setKey: call("ai:setKey"),
    extract: call("ai:extract"),
    apply: call("ai:apply"),
  },
});
