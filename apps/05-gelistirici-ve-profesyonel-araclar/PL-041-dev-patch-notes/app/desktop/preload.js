/* Masaüstü kabuğu: sayfaya yalnız `window.dpDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("dpDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  repo: { pick: call("repo:pick"), read: call("repo:read") },
  capture: { text: call("capture:text"), file: call("capture:file"), sample: call("capture:sample") },
  rel: { open: call("rel:open"), meta: call("rel:meta"), reset: call("rel:reset"), archive: call("rel:archive"), restore: call("rel:restore") },
  item: { set: call("item:set") },
  openCommit: call("link:open"),
  exportMd: call("export:md"),
  exportTxt: call("export:txt"),
  exportJson: call("export:json"),
  copy: call("export:copy"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), draft: call("ai:draft"), apply: call("ai:apply"), dismiss: call("ai:dismiss") },
});
