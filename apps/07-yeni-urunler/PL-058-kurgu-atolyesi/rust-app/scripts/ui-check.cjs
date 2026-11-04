'use strict';
// Connects to an already-running --evidence Rust/Tauri application. No backend mocks.
// WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9227
const {chromium}=require(process.env.KURGU_PLAYWRIGHT||'C:/Users/pc/github/PluginLabs/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const out=path.resolve(__dirname,'../test-output/native');
const endpoint=process.env.KURGU_CDP||'http://127.0.0.1:9227';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=30000){const start=Date.now();let last;while(Date.now()-start<timeout){try{const v=await fn();if(v)return v;}catch(e){last=e;}await wait(150);}throw last||new Error('Condition timed out');}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.connectOverCDP(endpoint);
 const report={platform:process.platform,checkedAt:new Date().toISOString(),endpoint,tests:[],screenshots:[],limitations:['Native file-picker acceptance and installer UI are separate manual checks.','Windows DPI 150/200%, screen reader and live Hub provider require separate acceptance.']};
 const errors=[];
 const page=await until(async()=>{for(const context of browser.contexts())for(const p of context.pages())if(await p.evaluate(()=>!!window.__TAURI__?.core).catch(()=>false))return p;});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const native=(command,args={})=>page.evaluate(({command,args})=>window.__TAURI__.core.invoke(command,args),{command,args});
 const snapshot=()=>native('snapshot');
 const test=async(name,fn)=>{await fn();report.tests.push({name,status:'passed'});};
 const shot=async name=>{const dest=path.join(out,name+'.png');await page.screenshot({path:dest,fullPage:true});report.screenshots.push(dest);};
 try{
 await test('Real Rust command and packaged UI',async()=>{const s=await snapshot();assert.equal(s.project.version,2);assert.equal(s.capabilities.rust,true);await page.locator('.pl-studio-top').waitFor();});
 await test('Native demo generates actual media',async()=>{await page.locator('[data-action="demo"]').click();await until(async()=>{const s=await snapshot();return s.media.length&&s.project.clips.length;},90000);await until(async()=>await page.locator('[data-clip]').count()>0);const s=await snapshot();assert.ok(s.media[0].file);assert.ok(s.media[0].thumbnail.startsWith('data:image/'));});
 await shot('01-kurgu');
 await test('Select, split and undo via interface',async()=>{await page.locator('[data-clip]').first().click();const count=(await snapshot()).project.clips.length;const ruler=await page.locator('.pl-studio-ruler').boundingBox();assert.ok(ruler);await page.mouse.click(ruler.x+55,ruler.y+15);await page.locator('[data-action="split"]').click();await page.locator('[data-action="save"]').click();await until(async()=>(await snapshot()).project.clips.length===count+1);await page.locator('[data-action="undo"]').click();await page.locator('[data-action="save"]').click();await until(async()=>(await snapshot()).project.clips.length===count);});
 await test('Color control persists in Rust project',async()=>{await page.locator('[data-workspace="color"]').click();const control=page.locator('[data-prop="brightness"]');await control.evaluate(e=>{e.value='0.12';e.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('[data-action="save"]').click();await until(async()=>Math.abs((await snapshot()).project.clips[0].brightness-.12)<.001);});
 await shot('02-renk');
 await test('Node creation and disable persist',async()=>{await page.locator('[data-workspace="nodes"]').click();await page.locator('#nodeKind').selectOption('blur');await page.locator('[data-action="node"]').click();await page.locator('[data-action="save"]').click();let s=await until(async()=>{const s=await snapshot();return s.project.clips[0].nodes.length?s:null;});const id=s.project.clips[0].nodes.at(-1).id;await page.locator(`[data-node-toggle="${id}"]`).click();await page.locator('[data-action="save"]').click();await until(async()=>(await snapshot()).project.clips[0].nodes.find(n=>n.id===id)?.enabled===false);});
 await shot('03-kompozisyon');
 await test('X/Y keyframes persist in frame model',async()=>{await page.locator('[data-workspace="edit"]').click();await page.locator('[data-action="keyframe"]').click();await page.locator('[data-action="save"]').click();const s=await until(async()=>{const s=await snapshot();return s.project.clips[0].keyframes.length?s:null;});assert.ok(s.project.clips[0].keyframes.every(k=>Number.isInteger(k.frame)&&['x','y'].includes(k.property)));});
 await test('Command palette and modal keyboard',async()=>{await page.keyboard.press('Control+k');await page.locator('#dialog[open]').waitFor();assert.ok(await page.locator('[data-command]').count()>0);await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog').evaluate(d=>d.open),false);});
 await test('Native render finishes with actual output',async()=>{await page.locator('[data-action="preview"]').click();const j=await until(async()=>{const s=await snapshot();const j=s.jobs.at(-1);if(j?.status==='failed')throw new Error(j.error);return j?.status==='completed'?j:null;},120000);assert.ok(j.file);const st=await fs.stat(j.file);assert.ok(st.size>1000);await page.locator(`[data-job-play="${j.id}"]`).click();await until(async()=>page.locator('#renderPlayer').evaluate(v=>v.readyState>=2&&v.videoWidth>0),15000);});
 await shot('04-teslim');
 await test('AI requires approval and does not expose token',async()=>{const denied=await native('mymind',{prompt:'Test metni',approved:false}).then(()=>false,()=>true);assert.ok(denied);const s=await snapshot();assert.ok(!Object.hasOwn(s,'hub_token'));});
 await test('No renderer errors',async()=>assert.deepEqual(errors,[]));
 report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{report.errors=errors;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
