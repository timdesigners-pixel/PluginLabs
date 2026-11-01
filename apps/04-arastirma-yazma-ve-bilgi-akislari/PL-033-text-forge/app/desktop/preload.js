/* Masaüstü kabuğu: sayfaya yalnız `window.tfDesktop` adlı dar bir arayüz verir (contextBridge). Node/Electron API'si sızdırılmaz. */
const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); };
contextBridge.exposeInMainWorld("tfDesktop", {
  platform: process.platform,
  state: call("state:get"),
  onState: on("state:changed"),
  /** Genel kısayol (Ctrl+Shift+Y) ile panodan alınan metin; yalnız kullanıcı kısayola bastığında gelir. */
  onQuick: on("quick:text"),
  setSettings: call("settings:set"),
  sample: call("text:sample"),
  openFile: call("text:openFile"),
  /** Panoyu yalnız kullanıcı düğmeye basınca okur; parola gibi görünen tek parça metin alınmaz. */
  readClipboard: call("clip:read"),
  /** Yerel (kural tabanlı) dönüştürme; sabit alanlar korunur ve denetlenir. */
  forge: call("forge:run"),
  /** Sonucu panoya kopyalar (kaynak uygulamaya yazma yalnız kullanıcının yapıştırmasıyla); öneri "kullanıldı" sayılır. */
  copy: call("clip:copy"),
  removeHistory: call("history:remove"),
  clearHistory: call("history:clear"),
  mymind: {
    status: call("mymind:status"),
    setKey: call("mymind:setKey"),
    alternatives: call("mymind:alternatives"),
  },
});
