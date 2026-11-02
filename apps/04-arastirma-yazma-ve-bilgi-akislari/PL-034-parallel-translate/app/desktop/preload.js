/* Masaüstü kabuğu: sayfaya yalnız `window.ptDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("ptDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  /** Genel kısayol (Ctrl+Shift+Space) ile panodan alınan metin; yalnız kullanıcı kısayola bastığında gelir. */
  onQuick: on("quick:text"),
  setSettings: call("settings:set"),
  sample: call("text:sample"),
  openFile: call("text:openFile"),
  /** Panoyu yalnız kullanıcı düğmeye basınca okur; parola gibi görünen tek parça metin alınmaz. */
  readClipboard: call("clip:read"),
  doc: {
    create: call("doc:create"),
    open: call("doc:open"),
    update: call("doc:update"),
    swap: call("doc:swap"),
    archive: call("doc:archive"),
    restore: call("doc:restore"),
    align: call("doc:align"),
    exportAs: call("doc:export"),
    copyTarget: call("doc:copyTarget"),
    backup: call("doc:backup"),
  },
  seg: {
    set: call("seg:set"),
    rate: call("seg:rate"),
    approve: call("seg:approve"),
    merge: call("seg:merge"),
    draft: call("seg:draft"),
    useAlt: call("seg:useAlt"),
  },
  glossary: {
    add: call("glossary:add"),
    remove: call("glossary:remove"),
    importCsv: call("glossary:import"),
    exportCsv: call("glossary:export"),
  },
  ai: {
    status: call("ai:status"),
    setKey: call("ai:setKey"),
    translate: call("ai:translate"),
  },
});
