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
  table: { open: call("table:open"), rename: call("table:rename"), header: call("table:header"), col: call("table:col"), archive: call("table:archive"), restore: call("table:restore") },
  openSource: call("link:open"),
  exportCsv: call("export:csv"),
  exportJson: call("export:json"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), check: call("ai:check"), apply: call("ai:apply") },
});
