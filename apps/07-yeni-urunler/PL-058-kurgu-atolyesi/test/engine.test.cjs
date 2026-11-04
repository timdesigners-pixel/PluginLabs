'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {Engine,run,validate,parseCube}=require('../src/engine.cjs');
const {start}=require('../src/server.cjs');
const cube='LUT_3D_SIZE 2\n0 0 0\n1 0 0\n0 1 0\n1 1 0\n0 0 1\n1 0 1\n0 1 1\n1 1 1\n';
test('proje sınırları, kaynak aralığı ve LUT doğrulanır',()=>{
  const media=new Map([['a',{duration:2,kind:'video'}]]);
  const p={version:1,clips:[{id:'1',mediaId:'a',in:0,duration:1,start:0}],subtitles:[]};
  assert.equal(validate(p,media).clips[0].volume,1);
  assert.throws(()=>validate({...p,clips:[{...p.clips[0],in:1.5}]},media));
  assert.throws(()=>validate({...p,clips:[{...p.clips[0],start:NaN}]},media));
  assert.throws(()=>validate({...p,clips:[{...p.clips[0],lutId:'missing'}]},media));
  assert.equal(parseCube(cube),2);assert.throws(()=>parseCube('LUT_3D_SIZE 65\n0 0 0'));
});
test('gerçek FFmpeg: içe aktar, LUT + altyazı + ses + katman, 1080p dışa aktar ve kalıcı kayıt',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'kurgu-engine-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const source=path.join(root,'source.mp4');
  await run('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=red:s=160x90:r=30:d=1','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',source]);
  const e=await new Engine(path.join(root,'data')).init();
  const m=await e.importFile(source,'örnek.mp4');await fs.writeFile(path.join(root,'green.cube'),'LUT_3D_SIZE 2\n'+Array(8).fill('0 1 0').join('\n'));const lut=await e.importFile(path.join(root,'green.cube'),'green.cube');
  await e.setProject({version:1,name:'Test',clips:[{id:'c1',mediaId:m.id,in:0,start:0,duration:1,fade:.1,lutId:lut.id},{id:'c2',mediaId:m.id,in:0,start:1,duration:.5,layer:1}],subtitles:[{start:0,duration:.5,text:'Türkçe: % {x} : \\'}]});
  const id=e.enqueue('export');await new Promise((resolve,reject)=>{e.once('job',j=>j.status==='completed'?resolve():reject(new Error(j.error)));});
  const output=path.join(root,'data/jobs',id,'output.mp4');
  const probe=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output]));
  assert.equal(probe.streams.find(s=>s.codec_type==='video').width,1920);assert.ok(probe.streams.some(s=>s.codec_type==='audio'));assert.ok(+probe.format.duration>=1.45);
  async function pixel(input,name){const out=path.join(root,name+'.ppm');await run('ffmpeg',['-v','error','-y','-ss','0.4','-i',input,'-vf','crop=16:16:100:100,scale=1:1','-frames:v','1','-pix_fmt','rgb24',out]);return [...(await fs.readFile(out)).subarray(-3)];}
  const full=await pixel(output,'export');assert.ok(full[1]>180&&full[0]<50,'LUT kırmızı kaynağı yeşile çevirmeli');
  const preview=e.enqueue('preview');await new Promise(resolve=>e.once('job',resolve));assert.equal(e.jobs.find(j=>j.id===preview).status,'completed');
  const small=await pixel(path.join(root,'data/jobs',preview,'output.mp4'),'preview');assert.ok(small.every((n,i)=>Math.abs(n-full[i])<12),'LUT önizlemesi ve çıktı aynı rengi taşımalı');
  const restored=await new Engine(path.join(root,'data')).init();assert.equal(restored.project.clips.length,2);assert.equal(restored.media.size,2);
  // İptal edilmiş bekleyen iş render edilmemeli.
  e.active={};const cancel=e.enqueue('preview');e.cancel(cancel);e.active=null;await e.drain();assert.equal(e.jobs.find(j=>j.id===cancel).status,'cancelled');
  const proxy=e.enqueue('proxy',m.id);await new Promise(resolve=>e.once('job',resolve));assert.equal(e.jobs.find(j=>j.id===proxy).status,'completed');assert.ok(e.media.get(m.id).proxyFile);
});
test('API token, origin, yol sınırı ve medya byte-range',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'kurgu-api-'));const s=await start({root});
  t.after(async()=>{await s.close();await fs.rm(root,{recursive:true,force:true});});
  const r=await fetch(s.url+'/api/session');const session=await r.json();
  assert.equal((await fetch(s.url+'/api/project',{method:'PUT',body:'{}'})).status,403);
  assert.equal((await fetch(s.url+'/api/session',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal((await fetch(s.url+'/%2e%2e%2fpackage.json')).status,403);
  const saved=await fetch(s.url+'/api/project',{method:'PUT',headers:{'x-kurgu-token':session.token},body:JSON.stringify({version:1,name:'Kalıcı',clips:[],subtitles:[]})});assert.equal(saved.status,200);
  await fs.writeFile(path.join(root,'data.mp4'),'0123456789');s.engine.media.set('test',{id:'test',file:path.join(root,'data.mp4'),kind:'video'});
  const range=await fetch(s.url+'/media/test',{headers:{Range:'bytes=2-5'}});assert.equal(range.status,206);assert.equal(await range.text(),'2345');
});
