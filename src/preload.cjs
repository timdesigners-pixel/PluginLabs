const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('pluginlabs',{call:(method,...args)=>ipcRenderer.invoke('hub:call',method,args)});
