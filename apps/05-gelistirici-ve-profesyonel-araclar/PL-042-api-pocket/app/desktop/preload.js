/* Masaüstü kabuğu: sayfaya yalnız `window.apDesktop` adlı dar bir arayüz verir (contextBridge).
 * Kasadaki sırlar (`secrets`) hiçbir zaman arayüze sızdırılmaz; yalnız hangilerinin tanımlı olduğu (`hasSecret`) bildirilir. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };

contextBridge.exposeInMainWorld("apDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  env: {
    setVar: call("env:setVar"),
    setSecret: call("env:setSecret"),
    removeVar: call("env:removeVar"),
  },
  request: {
    open: call("request:open"),
    create: call("request:create"),
    update: call("request:update"),
    send: call("request:send"),
    loadSamples: call("request:loadSamples"),
  },
  openDoc: call("doc:open"),
  exportCurl: call("export:curl"),
  exportMd: call("export:md"),
  exportCollection: call("export:collection"),
  ai: {
    setKey: call("ai:setKey"),
    explain: call("ai:explain"),
    apply: call("ai:apply"),
  },
});
