/* Masaüstü kabuğu: sayfaya yalnız `window.qcDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz.
 * Bırakılan dosyaların gerçek yolu `webUtils.getPathForFile` ile alınır (sayfa yol uyduramaz; ana süreç ayrıca doğrular). */
const { contextBridge, ipcRenderer, webUtils } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const viewArg = (process.argv || []).find((a) => a.startsWith("--qc-view="));
const pathsFor = (files) => Array.from(files || []).map((f) => { try { return webUtils.getPathForFile(f); } catch { return ""; } }).filter(Boolean);
contextBridge.exposeInMainWorld("qcDesktop", {
  platform: process.platform,
  view: viewArg ? viewArg.slice(10) : "main",
  pathsFor,
  state: call("state:get"),
  onState: on("state:changed"),
  onAutorun: on("queue:autorun"),
  setSettings: call("settings:set"),
  chooseOutput: call("output:choose"),
  pick: call("files:pick"),
  add: call("files:add"),
  dropAdd: call("drop:add"),
  remove: call("queue:remove"),
  clear: call("queue:clear"),
  read: call("item:read"),
  writeImage: call("item:writeImage"),
  convertText: call("item:convertText"),
  fail: call("item:fail"),
  reveal: call("item:reveal"),
  showDrop: call("drop:show"),
  showMain: call("main:show"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    suggest: call("mymind:suggest"),
  },
});
