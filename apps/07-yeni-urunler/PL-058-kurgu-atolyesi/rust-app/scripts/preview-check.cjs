'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'../../../../../node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs','screenshots');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9227');
 let page;for(let i=0;i<40&&!page;i++){page=browser.contexts().flatMap(c=>c.pages()).find(p=>/tauri[.:]/.test(p.url())||p.url().includes('localhost'));if(!page)await new Promise(r=>setTimeout(r,250));}
 assert.ok(page,'Gerçek Tauri WebView bulunmalı: '+browser.contexts().flatMap(c=>c.pages()).map(p=>p.url()).join(','));
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!/\b(?:tauri|ipc|asset)\.localhost\b/.test(r.url()))external.push(r.url());});
 await page.reload();await page.waitForFunction(()=>window.__TAURI__&&document.querySelector('.pl-omni-previewlabel')?.textContent.includes('RUST'));
 const snapshot=await page.evaluate(()=>window.__TAURI__.core.invoke('snapshot'));
 assert.equal(snapshot.capabilities.rust,true);
 await page.setViewportSize({width:1720,height:1080});
 await page.emulateMedia({reducedMotion:'reduce'});
 const results=[];
 for(const ws of ['edit','fusion','ae','color','audio','deliver']){
  await page.locator(`[data-ws="${ws}"]`).click();
  await page.waitForTimeout(180);
  assert.equal(await page.locator('.pl-ws-page:visible').count(),1);
  assert.equal(await page.locator(`#ws-${ws}`).isVisible(),true);
  assert.equal(await page.locator(`#ws-${ws} .pl-omni-plan`).count(),1);
  await page.screenshot({path:path.join(out,`rust-${ws}-1720.png`)});
  results.push({workspace:ws,status:'passed'});
 }
 await page.keyboard.press('Control+k');await page.locator('#cmdk').waitFor({state:'visible'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#cmdk').isVisible(),false);
 await page.locator('[data-ws="fusion"]').click();
 const node=page.locator('.pl-fusion-node').first(),before=await node.boundingBox();
 await page.mouse.move(before.x+30,before.y+18);await page.mouse.down();await page.mouse.move(before.x+65,before.y+36,{steps:5});await page.mouse.up();
 const after=await node.boundingBox();assert.ok(after.x!==before.x||after.y!==before.y,'Düğüm sürükleme çalışmalı');
 await page.locator('[data-ws="edit"]').click();
 assert.ok(await page.locator('.pl-kurgu-clip--film').count()>0,'Zaman çizelgesi klip sınıfları korunmalı');
 const film=await page.locator('.pl-kurgu-clip--film').first().boundingBox();assert.ok(film.height>20&&film.width>100);
 await page.locator('#vol').fill('40');await page.locator('#vol').dispatchEvent('input');
 assert.equal((await page.locator('#vol-out').textContent()).trim(),'%40');
 await page.locator('[data-ai="text"]').click();assert.ok((await page.locator('#toasts').textContent()).includes('henüz bağlı değil'));
 await page.setViewportSize({width:1320,height:900});
 await page.locator('.pl-kurgu-app').waitFor({state:'visible'});
 const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.querySelector('.pl-kurgu-app').scrollWidth,client:document.querySelector('.pl-kurgu-app').clientWidth}));
 assert.ok(geometry.scroll<=geometry.client+1,'Küçük masaüstünde yatay taşma olmamalı');
 await page.screenshot({path:path.join(out,'rust-edit-1320.png')});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await fs.writeFile(path.join(root,'docs','PREVIEW-EVIDENCE.json'),JSON.stringify({date:'2026-11-04',platform:'Windows x64 / Tauri 2 / WebView2',url:page.url(),capabilities:snapshot.capabilities,results,commandPalette:'passed',nodeDrag:'passed',slider:'passed',layout1320:'passed',externalRequests:external,errors,scope:'UI preview; sample scene/measurements. No AI inference, GPU telemetry or professional codec export claimed.'},null,2));
 console.log(JSON.stringify({passed:results.length+5,screenshots:out,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
