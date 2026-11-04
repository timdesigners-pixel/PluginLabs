'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { EventEmitter } = require('node:events');

function run(exe, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, ...options });
    let stdout = '', stderr = '';
    child.stdout.on('data', b => { stdout = (stdout + b).slice(-4e6); });
    child.stderr.on('data', b => { stderr = (stderr + b).slice(-16000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr || `İşlem sonlandı: ${code}`)));
    options.onChild?.(child);
  });
}
const finite = (n, lo, hi, label) => {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < lo || n > hi) throw new Error(`Geçersiz ${label}`);
  return n;
};
function validate(project, media) {
  if (!project || project.version !== 1 || !Array.isArray(project.clips) || project.clips.length > 100) throw new Error('Geçersiz proje');
  const out = {version: 1, name: String(project.name || 'Yeni proje').slice(0,120), clips: [], subtitles: []};
  const ids = new Set();
  for (const clip of project.clips) {
    if (!media.has(clip.mediaId)) throw new Error('Medya bulunamadı; dosyayı yeniden içe aktarın');
    if (typeof clip.id !== 'string' || ids.has(clip.id)) throw new Error('Klip kimliği yineleniyor');
    ids.add(clip.id);
    const item = media.get(clip.mediaId);
    const c = {id:clip.id, mediaId:clip.mediaId, start:finite(clip.start,0,86400,'başlangıç'), in:finite(clip.in,0,item.duration,'giriş'),
      duration:finite(clip.duration,0.04,3600,'süre'), layer:finite(clip.layer ?? 0,0,8,'katman'),
      volume:finite(clip.volume ?? 1,0,2,'ses düzeyi'), fade:finite(clip.fade ?? 0,0,5,'geçiş')};
    if (!Number.isInteger(c.layer) || c.in + c.duration > item.duration + .05 || c.fade > c.duration / 2) throw new Error('Klip aralığı veya geçiş süresi geçersiz');
    if (clip.lutId) { if (media.get(clip.lutId)?.kind !== 'lut') throw new Error('LUT bulunamadı'); c.lutId=clip.lutId; }
    if (!['video','audio'].includes(item.kind)) throw new Error('Klip yalnız video veya ses olabilir');
    out.clips.push(c);
  }
  if (!Array.isArray(project.subtitles || []) || (project.subtitles || []).length > 200) throw new Error('Çok fazla altyazı');
  for (const s of project.subtitles || []) {
    out.subtitles.push({start:finite(s.start,0,86400,'altyazı başlangıcı'),duration:finite(s.duration,.04,3600,'altyazı süresi'),text:String(s.text).slice(0,2000)});
  }
  return out;
}
function parseCube(text) {
  if (Buffer.byteLength(text) > 12e6) throw new Error('LUT en fazla 12 MB olabilir');
  let size = 0, rows = 0;
  for (const raw of text.split(/\r?\n/)) {
    const s=raw.replace(/#.*/, '').trim(); if (!s) continue;
    if (/^TITLE\s/.test(s)) continue;
    if (/^LUT_3D_SIZE\s/.test(s)) { size=Number(s.split(/\s+/)[1]); if(!Number.isInteger(size)||size<2||size>65) throw new Error('LUT boyutu 2–65 olmalı'); continue; }
    if (/^DOMAIN_(MIN|MAX)\s/.test(s)) continue;
    const nums=s.split(/\s+/).map(Number);
    if(nums.length!==3 || nums.some(n=>!Number.isFinite(n))) throw new Error('Geçersiz .cube satırı');
    rows++;
  }
  if(!size || rows!==size**3) throw new Error('LUT örnek sayısı boyutla eşleşmiyor');
  return size;
}
class Engine extends EventEmitter {
  constructor(root, options={}) {
    super(); this.root=root; this.ffmpeg=options.ffmpeg || process.env.KURGU_FFMPEG || 'ffmpeg';
    this.ffprobe=options.ffprobe || process.env.KURGU_FFPROBE || 'ffprobe';
    this.media=new Map(); this.jobs=[]; this.active=null; this.project={version:1,name:'Yeni proje',clips:[],subtitles:[]};
    this.persist=Promise.resolve();
  }
  async init() {
    for(const dir of ['media','jobs']) await fs.mkdir(path.join(this.root,dir),{recursive:true});
    try { const saved=JSON.parse(await fs.readFile(path.join(this.root,'session.json'),'utf8')); this.media=new Map(saved.media.map(m=>[m.id,m])); this.project=validate(saved.project,this.media); this.jobs=(saved.jobs||[]).map(j=>['queued','running'].includes(j.status)?{...j,status:'failed',error:'Uygulama kapandı; işi yeniden başlatın'}:j); }
    catch(e) { if(e.code!=='ENOENT') throw new Error(`Proje kurtarılamadı: ${e.message}`); }
    return this;
  }
  snapshot(){return {project:this.project,media:[...this.media.values()].map(({file,proxyFile,...m})=>({...m,proxy:!!proxyFile})),jobs:this.jobs.map(({child,...j})=>j)};}
  save() {
    const body=JSON.stringify({project:this.project,media:[...this.media.values()],jobs:this.jobs.map(({child,...j})=>j)},null,2);
    const write=this.persist.then(async()=>{ const p=path.join(this.root,'session.json'); await fs.writeFile(p+'.tmp',body); await fs.rename(p+'.tmp',p); });
    this.persist=write.catch(()=>{}); return write;
  }
  async setProject(p){const valid=validate(p,this.media); this.project=valid; await this.save(); return this.snapshot();}
  async importFile(file,name) {
    const id=randomUUID(), ext=path.extname(name).toLowerCase();
    const destination=path.join(this.root,'media',id+ext);
    try {
      let metadata;
      if(ext==='.cube') { const size=parseCube(await fs.readFile(file,'utf8')); metadata={kind:'lut',size,duration:0}; }
      else {
        const probe=JSON.parse(await run(this.ffprobe,['-v','error','-show_format','-show_streams','-of','json',file]));
        const video=probe.streams.find(s=>s.codec_type==='video'), audio=probe.streams.some(s=>s.codec_type==='audio');
        const duration=Number(probe.format.duration);
        finite(duration,.04,86400,'medya süresi');
        if(!video&&!audio) throw new Error('Video veya ses akışı bulunamadı');
        metadata={kind:video?'video':'audio',duration,audio,width:video?.width,height:video?.height};
      }
      await fs.copyFile(file,destination);
      const item={id,name:path.basename(name).slice(0,160),file:destination,...metadata}; this.media.set(id,item);
      await this.save(); return {id,name:item.name,...metadata};
    } catch(e) { await fs.rm(destination,{force:true}); throw e; }
  }
  enqueue(kind='export',mediaId) {
    if(!['export','preview','proxy'].includes(kind)) throw new Error('Geçersiz render türü');
    if(this.jobs.filter(j=>['queued','running'].includes(j.status)).length>=8) throw new Error('Render kuyruğu dolu');
    let project=validate(this.project,this.media); if(!project.clips.length) throw new Error('Önce zaman çizelgesine klip ekleyin');
    if(kind==='proxy'){const m=this.media.get(mediaId);if(m?.kind!=='video')throw new Error('Proxy için video klibi seçin');project=validate({version:1,clips:[{id:'proxy',mediaId,start:0,in:0,duration:Math.min(m.duration,3600)}],subtitles:[]},this.media);}
    const j={id:randomUUID(),kind,status:'queued',progress:0,project,...(kind==='proxy'?{mediaId}:{})}; this.jobs.push(j); this.drain(); return j.id;
  }
  cancel(id){const j=this.jobs.find(x=>x.id===id); if(!j)throw new Error('İş bulunamadı'); if(['queued','running'].includes(j.status)){j.status='cancelled'; j.child?.kill();} }
  async drain(){
    if(this.active)return;
    const j=this.jobs.find(x=>x.status==='queued'); if(!j)return;
    this.active=j; j.status='running';
    try{await this.render(j); if(j.status!=='cancelled'){j.status='completed';j.progress=1;}}
    catch(e){if(j.status!=='cancelled'){j.status='failed';j.error=e.message;}}
    finally{delete j.child; this.active=null;try{if(j.status==='completed'&&j.kind==='proxy')this.media.get(j.mediaId).proxyFile=path.join(this.root,'jobs',j.id,'output.mp4');await this.save();}catch(e){j.status='failed';j.error=`Kayıt hatası: ${e.message}`;}this.emit('job',j);this.drain();}
  }
  async render(j) {
    const dir=path.join(this.root,'jobs',j.id); await fs.mkdir(dir,{recursive:true});
    const p=j.project, duration=Math.max(...p.clips.map(c=>c.start+c.duration));
    if(duration>3600)throw new Error('Bu sürümde proje en fazla 60 dakika olabilir');
    const [w,h]=j.kind==='export'?[1920,1080]:[640,360];
    const args=['-hide_banner','-v','error','-nostdin','-y'];
    for(const c of p.clips){args.push('-ss',String(c.in),'-t',String(c.duration),'-i',this.media.get(c.mediaId).file);}
    const graph=[`color=c=black:s=${w}x${h}:r=30:d=${duration}[base]`,`anullsrc=r=48000:cl=stereo,atrim=duration=${duration}[silent]`];
    let v='base', aud=['silent'];
    const ordered=p.clips.map((c,i)=>({c,i})).sort((a,b)=>a.c.layer-b.c.layer);
    for(const {c,i} of ordered){
      const media=this.media.get(c.mediaId);
      if(media.kind==='video'){
        let filters=`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuva420p`;
        if(c.lutId){const filename=`lut-${i}.cube`; await fs.copyFile(this.media.get(c.lutId).file,path.join(dir,filename)); filters+=`,lut3d=file=${filename}`;}
        if(c.fade)filters+=`,fade=t=in:st=0:d=${c.fade}:alpha=1,fade=t=out:st=${c.duration-c.fade}:d=${c.fade}:alpha=1`;
        graph.push(`[${i}:v]${filters},setpts=PTS-STARTPTS+${c.start}/TB[v${i}]`);
        graph.push(`[${v}][v${i}]overlay=eof_action=pass:enable='between(t,${c.start},${c.start+c.duration})'[o${i}]`);v=`o${i}`;
      }
      if(media.audio && c.volume>0){
        graph.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,volume=${c.volume},adelay=${Math.round(c.start*1000)}:all=1[a${i}]`);aud.push(`a${i}`);
      }
    }
    if(p.subtitles.length && process.platform==='win32')await fs.copyFile(path.join(process.env.WINDIR||'C:\\Windows','Fonts','segoeui.ttf'),path.join(dir,'caption-font.ttf'));
    for(let i=0;i<p.subtitles.length;i++){
      const s=p.subtitles[i]; await fs.writeFile(path.join(dir,`caption-${i}.txt`),s.text);
      graph.push(`[${v}]drawtext=${process.platform==='win32'?'fontfile=caption-font.ttf:':''}textfile=caption-${i}.txt:expansion=none:fontcolor=white:fontsize=${Math.round(h/24)}:box=1:boxcolor=black@0.7:x=(w-tw)/2:y=h-th-40:enable='between(t,${s.start},${s.start+s.duration})'[s${i}]`);v=`s${i}`;
    }
    graph.push(`${aud.map(a=>`[${a}]`).join('')}amix=inputs=${aud.length}:normalize=0:duration=first[aout]`);
    await fs.writeFile(path.join(dir,'graph.txt'),graph.join(';\n'));
    args.push('-/filter_complex','graph.txt','-map',`[${v}]`,'-map','[aout]','-t',String(duration),'-c:v','libx264','-preset','ultrafast','-crf',j.kind==='export'?'20':'28','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart','-threads','2','-filter_complex_threads','1','-progress','pipe:1','output.mp4');
    await run(this.ffmpeg,args,{cwd:dir,onChild:child=>{j.child=child;if(j.status==='cancelled')child.kill();child.stdout.on('data',b=>{const m=String(b).match(/out_time_us=(\d+)/);if(m)j.progress=Math.min(.99,+m[1]/1e6/duration);});}});
    const probe=JSON.parse(await run(this.ffprobe,['-v','error','-show_format','-of','json',path.join(dir,'output.mp4')]));
    if(Number(probe.format.duration)<duration-.15)throw new Error('Çıktı süresi doğrulanamadı');
    j.duration=Number(probe.format.duration);
  }
}
module.exports={Engine,run,validate,parseCube};
