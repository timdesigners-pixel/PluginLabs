'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict');
const {start}=require('../src/server.cjs');
const {run}=require('../src/engine.cjs');
const {chromium}=require(path.join(process.env.KURGU_TEST_TOOL_ROOT||'C:/Users/pc/github/PluginLabs','node_modules/playwright'));
(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'kurgu-ui-'));
  let s,browser;
  try{
    const file=path.join(root,'Atölye-örnek.mp4');
    await run('ffmpeg',['-v','error','-y','-f','lavfi','-i','testsrc2=s=640x360:r=30:d=2','-f','lavfi','-i','sine=frequency=440:duration=2','-c:v','libx264','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-shortest',file]);
    s=await start({root:path.join(root,'data')});browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(s.url);await page.waitForSelector('[data-ready="1"]');
    await page.locator('input[type=file]').first().setInputFiles(file);
    await page.waitForFunction(()=>document.querySelectorAll('.pl-studio-clip').length===1);
    await page.locator('.pl-studio-clip').click();
    await page.getByRole('button',{name:'Klibi kes',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.pl-studio-clip').length===2);
    await page.locator('#caption-text').fill('PluginLabs · Gerçek medya testi');await page.getByRole('button',{name:'Altyazı ekle',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.pl-studio-caption').length===1);
    await page.getByRole('button',{name:'Önizlemeyi üret',exact:true}).click();
    await page.getByRole('button',{name:'Sonucu önizle',exact:true}).waitFor({timeout:60000});
    await page.getByRole('button',{name:'Sonucu önizle',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#studio-video').readyState>=2);
    await page.locator('#studio-video').evaluate(v=>{v.currentTime=.4;});
    await page.waitForTimeout(400);
    const docs=path.resolve(__dirname,'../docs');await fs.mkdir(docs,{recursive:true});await page.screenshot({path:path.join(docs,'studio-1440.png'),fullPage:true});
    await page.reload();await page.waitForSelector('[data-ready="1"]');assert.equal(await page.locator('.pl-studio-clip').count(),2);
    await page.keyboard.press('Control+k');assert.equal(await page.locator('#cmdk').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
    await page.setViewportSize({width:820,height:1200});await page.screenshot({path:path.join(docs,'studio-820.png'),fullPage:true});
    assert.deepEqual(errors,[]);console.log('UI passed: gerçek import, kesme, altyazı, render, video karesi, yeniden açma, Ctrl+K; konsol hatası yok.');
    await fs.writeFile(path.join(docs,'UI-EVIDENCE.json'),JSON.stringify({platform:process.platform,checkedAt:new Date().toISOString(),engine:'FFmpeg',checks:['import','split','subtitles','render','frame','restore','command-palette'],errors},null,2));
  }finally{await browser?.close();await s?.close();await fs.rm(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
