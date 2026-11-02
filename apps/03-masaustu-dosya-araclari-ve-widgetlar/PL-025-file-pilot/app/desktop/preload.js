/* Masaüstü kabuğu: sayfaya yalnız `window.fpDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si ve dosya yolları üzerinde
 * doğrudan işlem sızdırılmaz; dosyalar kimlikleriyle anılır, ana süreç her isteği doğrular. */
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (cb) => {
  const fn = (_e, d) => cb(d);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};
contextBridge.exposeInMainWorld("fpDesktop", {
  platform: process.platform,
  /** Durum: { roots, settings, counts, tags, scanning, progress, lastScan, vault, hasKey }. */
  state: () => ipcRenderer.invoke("state:get"),
  onState: on("state:changed"),
  setSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
  /** Klasör seçme penceresi ana süreçte açılır. */
  addRoot: () => ipcRenderer.invoke("roots:add"),
  /** Klasörü yalnız indeksten çıkarır; diskteki dosyalara dokunmaz. */
  removeRoot: (dir) => ipcRenderer.invoke("roots:remove", dir),
  scan: () => ipcRenderer.invoke("scan:start"),
  stopScan: () => ipcRenderer.invoke("scan:stop"),
  search: (query, opts) => ipcRenderer.invoke("search", query, opts || {}),
  preview: (id, query) => ipcRenderer.invoke("doc:preview", id, query),
  similar: (id) => ipcRenderer.invoke("doc:similar", id),
  open: (id) => ipcRenderer.invoke("doc:open", id),
  reveal: (id) => ipcRenderer.invoke("doc:reveal", id),
  copyPath: (id) => ipcRenderer.invoke("doc:copyPath", id),
  setTags: (id, tags) => ipcRenderer.invoke("doc:tags", id, tags),
  mymind: {
    status: () => ipcRenderer.invoke("mymind:status"),
    setKey: (key) => ipcRenderer.invoke("mymind:setKey", key),
    /** Ana süreç gönderilecek veriyi gösterip onay ister; dönen: { approved, ok?, answer?, sources?, error? }. */
    ask: (question, query) => ipcRenderer.invoke("mymind:ask", question, query),
  },
});
