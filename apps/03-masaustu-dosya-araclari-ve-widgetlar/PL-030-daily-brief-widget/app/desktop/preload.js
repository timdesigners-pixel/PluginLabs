/* Masaüstü kabuğu: sayfaya yalnız `window.dbDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz.
 * Özetin tek yetkilisi ana süreçtir; ana pencere ve widget yalnız gösterir ve istek gönderir. */
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const viewArg = (process.argv || []).find((a) => a.startsWith("--db-view="));
contextBridge.exposeInMainWorld("dbDesktop", {
  platform: process.platform,
  view: viewArg ? viewArg.slice(10) : "main",
  state: call("state:get"),
  onState: on("state:changed"),
  onNav: on("nav"),
  setSettings: call("settings:set"),
  addTask: call("task:add"),
  updateTask: call("task:update"),
  toggleTask: call("task:toggle"),
  removeTask: call("task:remove"),
  clearDone: call("task:clearDone"),
  addEvent: call("event:add"),
  removeEvent: call("event:remove"),
  addIcsFile: call("source:addFile"),
  addIcsUrl: call("source:addUrl"),
  refreshSource: call("source:refresh"),
  setSource: call("source:set"),
  removeSource: call("source:remove"),
  /** "Okudum": sabah özeti okuma ölçüsü (Notion doğrulama ölçütü). */
  markRead: call("brief:read"),
  /** Kullanıcının "yanlış/eskimiş" diye işaretlediği etkinlik (ölçü). Takvime yazılmaz. */
  flagEvent: call("brief:flag"),
  showWidget: call("widget:show"),
  showMain: call("main:show"),
  exportData: call("data:export"),
  importData: call("data:import"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    plan: call("mymind:plan"),
  },
});
