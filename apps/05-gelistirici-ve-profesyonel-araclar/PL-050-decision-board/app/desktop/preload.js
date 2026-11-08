/* Masaüstü kabuğu: sayfaya yalnız `window.dbDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(ch, fn);
  return () => ipcRenderer.removeListener(ch, fn);
};

contextBridge.exposeInMainWorld("dbDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  board: {
    loadSample: call("board:loadSample"),
    updateMeta: call("board:updateMeta"),
    addOption: call("board:addOption"),
    addCriterion: call("board:addCriterion"),
    updateWeight: call("board:updateWeight"),
    updateCell: call("board:updateCell"),
    recordDecision: call("board:recordDecision"),
  },
  exportMd: call("export:md"),
  exportCsv: call("export:csv"),
  backup: call("export:backup"),
  ai: {
    setKey: call("ai:setKey"),
    analyze: call("ai:analyze"),
    applyCriterion: call("ai:applyCriterion"),
  },
});
