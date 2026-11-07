/* Masaüstü kabuğu: sayfaya yalnız `window.vnDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("vnDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  setSettings: call("settings:set"),
  sample: call("text:sample"),
  audio: { openFile: call("audio:openFile"), get: call("audio:get") },
  note: {
    fromAudio: call("note:fromAudio"),
    transcribe: call("note:transcribe"),
    typed: call("note:typed"),
    open: call("note:open"),
    update: call("note:update"),
    reanalyze: call("note:reanalyze"),
    save: call("note:save"),
    done: call("note:done"),
    archive: call("note:archive"),
    deleteAudio: call("note:deleteAudio"),
    deleteTranscript: call("note:deleteTranscript"),
    remove: call("note:delete"),
  },
  notes: { exportAs: call("notes:export"), copy: call("notes:copy"), backup: call("notes:backup") },
  ai: { setKey: call("ai:setKey"), refine: call("ai:refine") },
  bubble: { toggle: call("bubble:toggle"), resize: call("bubble:resize"), dismiss: call("bubble:dismiss") },
  showMain: call("main:show"),
});
