/* Masaüstü kabuğu: sayfaya yalnız `window.itDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve anahtar sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("itDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  capture: { clipboard: call("capture:clipboard"), text: call("capture:text"), files: call("capture:files"), url: call("capture:url"), sample: call("capture:sample") },
  ds: { open: call("ds:open"), rename: call("ds:rename"), choose: call("ds:choose"), header: call("ds:header"), column: call("ds:column"), archive: call("ds:archive"), restore: call("ds:restore") },
  openLink: call("link:open"),
  exportCsv: call("export:csv"),
  exportJson: call("export:json"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), suggest: call("ai:suggest"), apply: call("ai:apply") },
});
