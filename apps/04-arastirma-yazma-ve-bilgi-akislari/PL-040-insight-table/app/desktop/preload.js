/* Masaüstü kabuğu: sayfaya yalnız `window.itDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtarlar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("itDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  capture: { text: call("capture:text"), clipboard: call("capture:clipboard"), files: call("capture:files"), sample: call("capture:sample") },
  item: { open: call("item:open"), table: call("item:table"), header: call("item:header"), column: call("item:column"), row: call("item:row"), reset: call("item:reset"), archive: call("item:archive"), restore: call("item:restore") },
  openLink: call("link:open"),
  exportCsv: call("export:csv"),
  exportJson: call("export:json"),
  copyTsv: call("export:tsv"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), suggest: call("ai:suggest"), apply: call("ai:apply"), dismiss: call("ai:dismiss") },
});
