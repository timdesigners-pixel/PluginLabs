/* Masaüstü kabuğu: sayfaya yalnız `window.ssDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld("ssDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  onCapture: on("capture:new"),
  onNotice: on("app:notice"),
  setSettings: call("settings:set"),
  chooseOutput: call("output:choose"),
  capture: call("capture:start"),
  windows: call("capture:windows"),
  captureWindow: call("capture:window"),
  open: call("capture:open"),
  fromBytes: call("capture:fromBytes"),
  paste: call("capture:paste"),
  image: call("capture:image"),
  scan: call("scan:run"),
  save: call("export:save"),
  copy: call("export:copy"),
  reveal: call("history:reveal"),
  forget: call("history:forget"),
  mymind: { setKey: call("mymind:setKey"), suggest: call("scan:mymind") },
});
