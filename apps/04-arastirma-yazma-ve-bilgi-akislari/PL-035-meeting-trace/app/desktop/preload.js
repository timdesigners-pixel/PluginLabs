/* Masaüstü kabuğu: sayfaya yalnız `window.mtDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("mtDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  sample: call("text:sample"),
  openFile: call("text:openFile"),
  /** Panoyu yalnız kullanıcı düğmeye basınca okur; parola gibi görünen tek parça metin alınmaz. */
  readClipboard: call("clip:read"),
  /** Katılımcı bilgilendirme metnini panoya kopyalar. */
  copyNotice: call("text:notice"),
  mt: {
    create: call("mt:create"),
    open: call("mt:open"),
    update: call("mt:update"),
    renameSpeaker: call("mt:renameSpeaker"),
    participants: call("mt:participants"),
    archive: call("mt:archive"),
    restore: call("mt:restore"),
    exportAs: call("mt:export"),
    copy: call("mt:copy"),
    backup: call("mt:backup"),
    search: call("mt:search"),
  },
  item: {
    status: call("item:status"),
    update: call("item:update"),
    add: call("item:add"),
    approveAll: call("item:approveAll"),
    done: call("task:done"),
  },
  ai: {
    status: call("ai:status"),
    setKey: call("ai:setKey"),
    extract: call("ai:extract"),
  },
});
