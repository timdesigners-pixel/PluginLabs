const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { Hub, scopes } = require("./hub.cjs");
let hub,
  window,
  quitting = false;
const uiURL = pathToFileURL(path.join(__dirname, "../ui/index.html")).href;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    window?.show();
    window?.focus();
  });
  app.whenReady().then(async () => {
    hub = await new Hub(
      !app.isPackaged && process.env.PLUGINLABS_DATA
        ? process.env.PLUGINLABS_DATA
        : path.join(app.getPath("userData"), "hub"),
    ).init();
    try {
      await hub.startAPI();
    } catch {
      hub.log("API başlatılamadı: 47632 portunu kontrol edin.");
    }
    window = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 1000,
      minHeight: 700,
      backgroundColor: "#101214",
      title: "PluginLabs Hub",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (e, url) => {
      if (url !== uiURL) e.preventDefault();
    });
    await window.loadURL(uiURL);
  });
}
ipcMain.handle("hub:call", async (event, method, args = []) => {
  if (
    !window ||
    event.sender !== window.webContents ||
    event.senderFrame !== window.webContents.mainFrame ||
    event.senderFrame.url !== uiURL
  )
    throw new Error("Güvenilmeyen pencere");
  if (!Array.isArray(args) || JSON.stringify(args).length > 180000)
    throw new Error("Geçersiz istek");
  const operations = {
    snapshot: () => hub.snapshot(),
    readProduct: (id) => hub.readProduct(id),
    saveProduct: (id, data) => hub.saveProduct(id, data),
    idea: (id) => {
      const item = require("../resources/notion-catalog.json").items.find(
        (i) => i.id === id,
      );
      if (!item) throw Error("Fikir bulunamadı");
      return item;
    },
    createBrowser: (name, id) => hub.extensions.createBrowser(name, id),
    browserAction: (client, id, action) =>
      hub.extensions.request(client, id, action),
    connectAppExtensions: async () => {
      const selected = await dialog.showOpenDialog(window, {
        title: "VS Code veya VSCodium uygulama dosyasını seçin",
        properties: ["openFile"],
      });
      if (!selected.canceled)
        return hub.appExtensions.connect(selected.filePaths[0]);
    },
    scanAppExtensions: () => hub.appExtensions.scan(),
    appExtensionAction: (action, id) => hub.appExtensions.action(action, id),
    disconnectAppExtensions: () => hub.appExtensions.disconnect(),
    exportBrowserBridge: async () => {
      const selected = await dialog.showOpenDialog(window, {
        title: "Bağlantı eklentisinin çıkarılacağı klasör",
        properties: ["openDirectory", "createDirectory"],
      });
      if (selected.canceled) return;
      const fs = require("node:fs/promises"),
        target = path.join(selected.filePaths[0], "PluginLabs-Browser-Bridge");
      try {
        await fs.access(target);
        throw Error("Bu klasör zaten var; başka bir konum seçin");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      await fs.mkdir(target);
      for (const name of [
        "manifest.json",
        "background.js",
        "popup.html",
        "popup.css",
        "popup.js",
        "icon.png",
      ]) {
        const bytes = await fs.readFile(
          path.join(__dirname, "../browser-extension", name),
        );
        await fs.writeFile(path.join(target, name), bytes, { flag: "wx" });
      }
      return target;
    },
    importPack: async () => {
      const selected = await dialog.showOpenDialog(window, {
        properties: ["openFile"],
        filters: [
          { name: "PluginLabs kaynak paketi", extensions: ["plpack", "json"] },
        ],
      });
      if (selected.canceled) return null;
      const fs = require("node:fs/promises"),
        file = selected.filePaths[0];
      if ((await fs.stat(file)).size > 2000000)
        throw Error("Paket en fazla 2 MB olabilir");
      return hub.importPack(JSON.parse(await fs.readFile(file, "utf8")));
    },
    scopes: () => scopes,
    install: (id) => hub.install(id),
    remove: (id) => hub.remove(id),
    toggle: (id, value) => hub.toggle(id, value),
    settings: (id, s) => hub.resourceSettings(id, s),
    cancel: (id) => hub.cancel(id),
    rollback: (id) => hub.rollback(id),
    launch: (id) => hub.launch(id),
    checkUpdates: () => hub.checkUpdates(),
    createClient: (name, permissions) => hub.createClient(name, permissions),
    revokeClient: (id) => hub.revokeClient(id),
    approve: (id, allow) => hub.approve(id, allow),
    startModel: () => hub.startModel(),
    stopModel: () => hub.stopModel(),
    chat: (b) => hub.chat(b),
    readResource: (id) => hub.readResource(id),
    exportResource: async (id) => {
      const data = await hub.readResource(id);
      const result = await dialog.showSaveDialog(window, {
        defaultPath: `${id}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!result.canceled)
        await require("node:fs/promises").writeFile(
          result.filePath,
          JSON.stringify(data, null, 2),
        );
      return !result.canceled;
    },
    openSource: async (id) => {
      const item = hub.item(id),
        url =
          item.source || (item.repo ? `https://github.com/${item.repo}` : null);
      if (url) await shell.openExternal(url);
    },
    openData: () => shell.openPath(hub.root),
    copy: async (text) => {
      if (typeof text !== "string" || text.length > 10000)
        throw Error("Geçersiz metin");
      require("electron").clipboard.writeText(text);
    },
  };
  if (!Object.hasOwn(operations, method)) throw new Error("Bilinmeyen işlem");
  return operations[method](...args);
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", (event) => {
  if (hub && !quitting) {
    event.preventDefault();
    quitting = true;
    hub.close().finally(() => app.quit());
  }
});
