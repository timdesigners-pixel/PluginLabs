'use strict';
const http=require('node:http');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {randomBytes,randomUUID}=require('node:crypto');
const {pipeline}=require('node:stream/promises');
const {Transform}=require('node:stream');
const {Engine}=require('./engine.cjs');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4','.json':'application/json'};
async function start(options={}){
  const engine=await new Engine(options.root||path.join(os.homedir(),'.pluginlabs','kurgu'),options).init();
  const token=randomBytes(32).toString('hex'), ui=path.resolve(__dirname,'../ui');
  let origin;
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'");
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    try{
      if(req.headers.host!==new URL(origin).host)return json(403,{error:'Geçersiz host'});
      const url=new URL(req.url,origin), pathname=url.pathname;
      if(req.headers.origin && req.headers.origin!==origin)return json(403,{error:'Yabancı origin'});
      if(pathname.startsWith('/api/') && req.method!=='GET' && req.headers['x-kurgu-token']!==token)return json(403,{error:'Oturum izni gerekli'});
      if(pathname==='/api/session'&&req.method==='GET')return json(200,{token,capabilities:{mymind:!!process.env.KURGU_HUB_TOKEN},...engine.snapshot()});
      if(pathname==='/api/mymind'&&req.method==='POST'){
        let text='';for await(const b of req){text+=b;if(Buffer.byteLength(text)>12000)throw new Error('İstek çok büyük');}
        const input=JSON.parse(text);
        if(input.consent!==true || typeof input.prompt!=='string' || input.prompt.length>4000)throw new Error('Metin ve açık gönderim onayı gerekli');
        if(!process.env.KURGU_HUB_TOKEN)throw new Error('Hub bağlantısı yapılandırılmadı');
        const hub=new URL(process.env.KURGU_HUB_URL||'http://127.0.0.1:8765');
        if(hub.protocol!=='http:' || !['127.0.0.1','[::1]'].includes(hub.hostname) || hub.username || hub.password)throw new Error('Hub yalnız loopback olabilir');
        const response=await fetch(new URL('/v1/chat/completions',hub),{method:'POST',redirect:'error',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.KURGU_HUB_TOKEN}`},body:JSON.stringify({model:'mymind-lite',messages:[{role:'user',content:input.prompt}],max_tokens:512,stream:false})});
        if(!response.ok)throw new Error(`Hub isteği başarısız (${response.status})`);
        const result=await response.json();const answer=result.choices?.[0]?.message?.content;
        if(typeof answer!=='string')throw new Error('Hub yanıtı metin içermiyor');
        return json(200,{text:answer.slice(0,16000),source:'PluginLabs Hub · MyMind'});
      }
      if(pathname==='/api/import'&&req.method==='POST'){
        if(!/^\d+$/.test(req.headers['content-length']||'') || +req.headers['content-length']>1024**3)return json(413,{error:'Dosya en fazla 1 GB olabilir'});
        const temp=path.join(engine.root,randomUUID()+'.upload');let bytes=0;
        try{
          await pipeline(req,new Transform({transform(b,e,cb){bytes+=b.length;cb(bytes>1024**3?new Error('Dosya çok büyük'):null,b);}}),fs.createWriteStream(temp,{flags:'wx'}));
          const name=decodeURIComponent(req.headers['x-filename']||'medya');
          return json(200,await engine.importFile(temp,name));
        }finally{await fsp.rm(temp,{force:true});}
      }
      const body=async()=>{let s='';for await(const b of req){s+=b;if(Buffer.byteLength(s)>1024**2)throw new Error('İstek çok büyük');}return JSON.parse(s||'{}');};
      if(pathname==='/api/project'&&req.method==='PUT')return json(200,await engine.setProject(await body()));
      if(pathname==='/api/render'&&req.method==='POST'){const input=await body();return json(202,{id:engine.enqueue(input.kind,input.mediaId)});}
      if(pathname==='/api/cancel'&&req.method==='POST'){engine.cancel((await body()).id);return json(200,{ok:true});}
      if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Yöntem desteklenmiyor'});
      let file;
      if(pathname.startsWith('/proxy/')){
        const item=engine.media.get(pathname.slice(7));if(!item?.proxyFile)return json(404,{error:'Proxy yok'});file=item.proxyFile;
      }else if(pathname.startsWith('/media/')){
        const item=engine.media.get(pathname.slice(7));if(!item||item.kind==='lut')return json(404,{error:'Medya yok'});file=item.file;
      }else if(pathname.startsWith('/output/')){
        const job=engine.jobs.find(j=>j.id===pathname.slice(8)&&j.status==='completed');if(!job)return json(404,{error:'Çıktı henüz hazır değil'});
        file=path.join(engine.root,'jobs',job.id,'output.mp4');
        if(url.searchParams.has('download'))res.setHeader('Content-Disposition','attachment; filename="Kurgu-Atolyesi.mp4"');
      }else{
        file=path.resolve(ui,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
        if(!file.startsWith(ui+path.sep))return json(403,{error:'Yol reddedildi'});
      }
      const stat=await fsp.stat(file);if(!stat.isFile())return json(404,{error:'Dosya yok'});
      let start=0,end=stat.size-1;
      if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)return json(416,{error:'Aralık geçersiz'});start=+m[1];end=m[2]?Math.min(+m[2],end):end;if(start>end)return json(416,{error:'Aralık geçersiz'});res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
      res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Type',pathname.startsWith('/output/')?'video/mp4':MIME[path.extname(file)]||'application/octet-stream');
      res.setHeader('Content-Length',end-start+1);
      if(req.method==='HEAD')return res.end();
      fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
    }catch(e){if(!res.headersSent)json(e.code==='ENOENT'?404:400,{error:e.message});else res.destroy();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(options.port||0,'127.0.0.1',resolve);});
  origin=`http://127.0.0.1:${server.address().port}`;
  return {server,engine,url:origin,close:async()=>{for(const j of engine.jobs)engine.cancel(j.id);await new Promise(r=>server.close(r));}};
}
if(require.main===module)start({port:Number(process.env.PORT)||5758}).then(s=>console.log(`Kurgu Atölyesi: ${s.url}`)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={start};
