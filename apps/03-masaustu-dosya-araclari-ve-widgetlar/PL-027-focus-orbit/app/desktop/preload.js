/* Masaüstü kabuğu: sayfaya yalnız `window.foDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz.
 * Zamanlayıcının tek yetkilisi ana süreçtir; ana pencere ve odak balonu yalnız gösterir ve istek gönderir. */
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const viewArg = (process.argv || []).find((a) => a.startsWith("--fo-view="));
contextBridge.exposeInMainWorld("foDesktop", {
  platform: process.platform,
  view: viewArg ? viewArg.slice(10) : "main",
  state: call("state:get"),
  onState: on("state:changed"),
  onTick: on("timer:tick"),
  setSettings: call("settings:set"),
  setTask: call("task:set"),
  addStep: call("step:add"),
  addSteps: call("step:addMany"),
  toggleStep: call("step:toggle"),
  removeStep: call("step:remove"),
  moveStep: call("step:move"),
  start: call("timer:start"),
  pause: call("timer:pause"),
  resume: call("timer:resume"),
  extend: call("timer:extend"),
  stop: call("timer:stop"),
  startBreak: call("timer:break"),
  /** Kullanıcının bildirdiği dikkat kesintisi (isteğe bağlı site). Ekran izlenmez. */
  interrupt: call("interrupt:log"),
  addSites: call("sites:add"),
  toggleSite: call("sites:toggle"),
  removeSite: call("sites:remove"),
  showBubble: call("bubble:show"),
  showMain: call("main:show"),
  exportData: call("data:export"),
  importData: call("data:import"),
  saveSummary: call("session:saveSummary"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    split: call("mymind:split"),
    summary: call("mymind:summary"),
  },
});
