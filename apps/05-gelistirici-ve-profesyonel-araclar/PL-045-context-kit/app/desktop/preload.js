/* Masaüstü kabuğu: sayfaya yalnız `window.ckDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("ckDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  kit: { create: call("kit:new"), open: call("kit:open"), set: call("kit:set"), addFolder: call("kit:addFolder"), rescan: call("kit:rescan"), addPage: call("kit:addPage"), addClipboard: call("kit:addClipboard"), addFiles: call("kit:addFiles"), removeSource: call("kit:removeSource"), pin: call("kit:pin"), archive: call("kit:archive"), restore: call("kit:restore"), sample: call("kit:sample") },
  exportMd: call("export:md"),
  exportJson: call("export:json"),
  exportClipboard: call("export:clipboard"),
  ai: { setKey: call("ai:setKey"), rank: call("ai:rank") },
});
