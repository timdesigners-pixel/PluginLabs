/* Masaüstü kabuğu: sayfaya yalnız `window.nbDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("nbDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  target: { setToken: call("target:setToken"), fetch: call("target:fetch"), useSample: call("target:useSample") },
  capture: { text: call("capture:text"), clipboard: call("capture:clipboard"), files: call("capture:files"), sample: call("capture:sample") },
  item: { open: call("item:open"), set: call("item:set"), remap: call("item:remap"), archive: call("item:archive"), restore: call("item:restore"), save: call("item:save") },
  openLink: call("link:open"),
  exportCsv: call("export:csv"),
  exportMd: call("export:md"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), map: call("ai:map"), apply: call("ai:apply") },
});
