'use strict';
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');
const {Engine,run}=require('../src/engine.cjs');
(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'kurgu-native-'));
  try{
    const source=path.join(root,'ornek.mp4');
    await run('ffmpeg',['-v','error','-y','-f','lavfi','-i','testsrc2=s=640x360:r=30:d=2','-c:v','libx264','-threads','2','-pix_fmt','yuv420p',source]);
    const e=await new Engine(path.join(root,'studio')).init();const m=await e.importFile(source,'Örnek video.mp4');
    await e.setProject({version:1,name:'Masaüstü test',clips:[{id:'v1',mediaId:m.id,start:0,in:0,duration:2}],subtitles:[{text:'Kurgu Atölyesi · PL-058',start:0,duration:2}]});
    e.enqueue('preview');await new Promise((resolve,reject)=>e.once('job',j=>j.status==='completed'?resolve():reject(new Error(j.error))));
    const env={...process.env,KURGU_HEADLESS_TEST:'1',KURGU_DATA:path.join(root,'studio'),KURGU_SCREENSHOT:path.resolve(__dirname,'../docs/studio-electron.png')};delete env.ELECTRON_RUN_AS_NODE;
    await fs.rm(env.KURGU_SCREENSHOT,{force:true});await fs.rm(env.KURGU_SCREENSHOT+'.json',{force:true});
    const exe=process.env.KURGU_APP_EXE||'C:/Users/pc/github/PluginLabs/node_modules/electron/dist/electron.exe';
    await run(exe,process.env.KURGU_APP_EXE?[]:[path.resolve(__dirname,'..')],{env});
    const stat=await fs.stat(env.KURGU_SCREENSHOT);if(stat.size<10000)throw new Error('Masaüstü ekranı doğrulanamadı');
    const evidence=JSON.parse(await fs.readFile(env.KURGU_SCREENSHOT+'.json','utf8'));if(evidence.width!==640||Math.abs(evidence.duration-2)>.15||Math.abs(evidence.time-.4)>.05)throw new Error('Native gerçek video kanıtı geçersiz');
    console.log('Windows Electron gizli pencere testi geçti; gerçek masaüstü ekranı kaydedildi.');
  }finally{await fs.rm(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
