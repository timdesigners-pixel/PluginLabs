'use strict';
const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const {start}=require('../src/server.cjs');
let service;
app.whenReady().then(async()=>{
  service=await start({root:process.env.KURGU_DATA||path.join(app.getPath('userData'),'studio')});
  const window=new BrowserWindow({width:1440,height:980,minWidth:920,minHeight:720,backgroundColor:'#090d18',show:!process.env.KURGU_HEADLESS_TEST,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(service.url+'/'))event.preventDefault();});
  await window.loadURL(service.url);
  if(process.env.KURGU_HEADLESS_TEST){await new Promise(r=>setTimeout(r,1200));const shot=await window.webContents.capturePage();require('node:fs').writeFileSync(process.env.KURGU_SCREENSHOT,shot.toPNG());app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{for(const j of service?.engine.jobs||[])service.engine.cancel(j.id);service?.server.close();});
