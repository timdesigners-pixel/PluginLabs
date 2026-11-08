/* Masaüstü kabuğu: sayfaya yalnız `window.alDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("alDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  audit: {
    snippet: call("audit:snippet"),
    clipboard: call("audit:clipboard"),
    files: call("audit:files"),
    sample: call("audit:sample"),
    select: call("audit:select"),
    setIssueStatus: call("audit:setIssueStatus"),
    applyFix: call("audit:applyFix"),
    toggleManual: call("audit:toggleManual"),
  },
  exportMd: call("export:md"),
  exportCsv: call("export:csv"),
  backup: call("export:backup"),
  ai: { setKey: call("ai:setKey"), explain: call("ai:explain"), apply: call("ai:apply") },
});
