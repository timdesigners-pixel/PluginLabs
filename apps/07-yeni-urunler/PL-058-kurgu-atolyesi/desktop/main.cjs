'use strict';
const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const {start}=require('../src/server.cjs');
let service;
if(process.env.KURGU_HEADLESS_TEST)app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  service=await start({root:process.env.KURGU_DATA||path.join(app.getPath('userData'),'studio')});
  const window=new BrowserWindow({width:1440,height:980,minWidth:920,minHeight:720,backgroundColor:'#090d18',show:!process.env.KURGU_HEADLESS_TEST,webPreferences:{offscreen:!!process.env.KURGU_HEADLESS_TEST,backgroundThrottling:false,sandbox:true,contextIsolation:true,nodeIntegration:false}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(service.url+'/'))event.preventDefault();});
  await window.loadURL(service.url);
  if(process.env.KURGU_HEADLESS_TEST){
    const evidence=await window.webContents.executeJavaScript(`new Promise((resolve,reject)=>{
      const deadline=Date.now()+20000;
      const poll=()=>{const v=document.querySelector('#studio-video');
        if(v && v.readyState>=2 && v.videoWidth>0 && Math.abs(v.duration-2)<0.15){
          v.pause();v.addEventListener('seeked',()=>{setTimeout(()=>{const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d');x.drawImage(v,0,0,16,16);if(!x.getImageData(0,0,16,16).data.some((n,i)=>i%4!==3&&n>30))return reject(new Error('Decoded frame blank'));resolve({width:v.videoWidth,height:v.videoHeight,duration:v.duration,time:v.currentTime,src:v.currentSrc});},300);},{once:true});v.currentTime=0.4;return;
        }
        if(Date.now()>deadline)return reject(new Error('Native video frame readiness failed'));
        setTimeout(poll,100);
      };poll();})`);
    const shot=await window.webContents.capturePage();require('node:fs').writeFileSync(process.env.KURGU_SCREENSHOT,shot.toPNG());require('node:fs').writeFileSync(process.env.KURGU_SCREENSHOT+'.json',JSON.stringify(evidence,null,2));app.quit();
  }
}).catch(e=>{console.error(e);app.exit(1);});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{for(const j of service?.engine.jobs||[])service.engine.cancel(j.id);service?.server.close();});
