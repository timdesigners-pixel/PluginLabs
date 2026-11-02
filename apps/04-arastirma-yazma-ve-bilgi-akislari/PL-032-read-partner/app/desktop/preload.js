/* Masaüstü kabuğu: sayfaya yalnız `window.rpDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld("rpDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on("state:changed", fn); return () => ipcRenderer.removeListener("state:changed", fn); },
  setSettings: call("settings:set"),
  addText: call("doc:addText"),
  openFile: call("doc:openFile"),
  addSample: call("doc:sample"),
  openDoc: call("doc:open"),
  renameDoc: call("doc:rename"),
  removeDoc: call("doc:remove"),
  /** Seçili bölüm için yerel (kural tabanlı) açıklama: sadeleştirme, terimler, 3 anlama sorusu. */
  analyze: call("expl:analyze"),
  term: call("expl:term"),
  ask: call("expl:ask"),
  /** Anlaşılırlık puanı 1–5 (Notion doğrulama ölçütü). */
  rate: call("expl:rate"),
  removeExplanation: call("expl:remove"),
  exportMarkdown: call("doc:exportMd"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    explain: call("mymind:explain"),
    ask: call("mymind:ask"),
  },
});
