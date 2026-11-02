/* Masaüstü kabuğu: sayfaya yalnız `window.stDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("stDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  loadSample: call("sample:load"),
  /** Panodaki seçimi yalnız kullanıcı düğmeye basınca okur ve kaynak kartı alanlarına ayırır. */
  capture: call("clip:capture"),
  copyText: call("clip:write"),
  saveSource: call("source:save"),
  archiveSource: call("source:archive"),
  /** Yalnız herkese açık http(s) adresini sistem tarayıcısında açar. */
  openUrl: call("url:open"),
  saveClaim: call("claim:save"),
  archiveClaim: call("claim:archive"),
  setMissing: call("claim:missing"),
  /** Bağ alıntısı kaynak kartındaki metinde aynen yoksa reddedilir. */
  setLink: call("link:set"),
  removeLink: call("link:remove"),
  exportCopy: call("export:copy"),
  exportSave: call("export:save"),
  backupExport: call("backup:export"),
  backupImport: call("backup:import"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    compare: call("mymind:compare"),
    apply: call("mymind:apply"),
  },
});
