/* Masaüstü kabuğu: sayfaya yalnız `window.mtDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("mtDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  sample: call("import:sample"),
  openFile: call("import:openFile"),
  meeting: {
    create: call("meeting:create"),
    open: call("meeting:open"),
    update: call("meeting:update"),
    archive: call("meeting:archive"),
    restore: call("meeting:restore"),
    reextract: call("meeting:reextract"),
    exportAs: call("meeting:export"),
    copy: call("meeting:copy"),
    backup: call("meeting:backup"),
  },
  speaker: {
    rename: call("speaker:rename"),
    merge: call("speaker:merge"),
    setFor: call("utterance:setSpeaker"),
  },
  item: {
    set: call("item:set"),
    add: call("item:add"),
  },
  ai: {
    setKey: call("ai:setKey"),
    extract: call("ai:extract"),
  },
});
