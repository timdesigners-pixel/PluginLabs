'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('../../../../../node_modules/playwright');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9229');
 try{
  let page;for(let i=0;i<60&&!page;i++){page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes('tauri.localhost'));if(!page)await new Promise(r=>setTimeout(r,200));}
  assert.ok(page,'Kurtarma fixture Rust penceresi bulunmalı');await page.locator('#pl-recovery').waitFor({state:'visible'});
  const state=await page.evaluate(()=>window.__TAURI__.core.invoke('snapshot'));
  assert.equal(state.capabilities.rust,true);assert.equal(state.project.name,'Kurtarma regresyonu');
  assert.equal(state.project.clips.length,1);assert.equal(state.media[0].id,'missing-media');
  assert.equal(state.media[0].missing,true);assert.equal(state.recovery.missingMedia.length,1);
  assert.ok((await page.locator('#pl-recovery').textContent()).includes(state.recovery.message));
  assert.equal(state.jobs.length,2);assert.ok(state.jobs.every(j=>j.status==='failed'&&j.error));
  assert.ok(state.jobs.every(j=>!['queued','running','completed'].includes(j.status)));
  const root=path.resolve(__dirname,'..');await page.setViewportSize({width:1720,height:1080});
  await page.screenshot({path:path.join(root,'docs/screenshots/rust-recovery-1720.png')});
  await fs.writeFile(path.join(root,'docs/RECOVERY-EVIDENCE.json'),JSON.stringify({date:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'}),sourceCommit:process.env.KURGU_SOURCE_COMMIT,buildProfile:'release',checks:{nativeStartup:'passed',missingMediaPreserved:'passed',visibleRecovery:'passed',projectPreserved:'passed',missingOutputNotReady:'passed',interruptedJobNotRestarted:'passed'},scope:'Isolated synthetic fixture; no user projects or media changed.'},null,2));
  console.log('Native recovery fixture: 6 checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
