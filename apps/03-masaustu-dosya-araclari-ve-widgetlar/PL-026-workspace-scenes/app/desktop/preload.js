/* Masaüstü kabuğu: sayfaya yalnız `window.wsDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz;
 * sahneler ve öğeler kimlikleriyle anılır, ana süreç her isteği doğrular. Açma işlemi her seferinde ana süreçteki onay penceresinden geçer. */
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld("wsDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  /** Masaüstü kısayolundan (--sahne=<kimlik>) gelen istek. */
  onSceneRequested: on("scene:requested"),
  takePending: call("pending:take"),
  setSettings: call("settings:set"),
  saveScene: call("scene:save"),
  fromTemplate: call("scene:fromTemplate"),
  duplicate: call("scene:duplicate"),
  archive: call("scene:archive"),
  addItem: call("scene:addItem"),
  /** Klasör / uygulama / dosya seçme penceresi ana süreçte açılır. */
  pickItem: call("scene:pickItem"),
  pasteUrls: call("scene:pasteUrls"),
  check: call("scene:check"),
  /** Ana süreç açılış dizisini gösterip onay ister; dönen: { approved, opened?, failed?, ms?, results? }. */
  launch: call("scene:launch"),
  shortcut: call("scene:shortcut"),
  exportData: call("data:export"),
  importData: call("data:import"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    suggest: call("mymind:suggest"),
  },
});
