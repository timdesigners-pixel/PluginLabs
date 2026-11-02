/* Seçim katmanı: yalnız `window.ssOverlay` (görüntüyü al, seçimi bildir, vazgeç). Başka API yok. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ssOverlay", {
  init: () => ipcRenderer.invoke("overlay:init"),
  done: (rect) => ipcRenderer.invoke("overlay:done", rect),
  cancel: () => ipcRenderer.invoke("overlay:cancel"),
});
