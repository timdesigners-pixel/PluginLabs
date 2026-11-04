use crate::model::*;
use base64::Engine as _;
use serde::{Deserialize,Serialize};
use std::{fs,path::{Path,PathBuf},process::{Command,Stdio,Child},sync::{Arc,Mutex},io::{BufRead,BufReader},thread};
use uuid::Uuid;
pub fn command(exe:&str)->Command{let mut c=Command::new(exe);#[cfg(windows)]{use std::os::windows::process::CommandExt;c.creation_flags(0x08000000);}c}
pub fn run(exe:&str,args:&[String],cwd:Option<&Path>)->Result<Vec<u8>,String>{let mut c=command(exe);c.args(args);if let Some(p)=cwd{c.current_dir(p);}let o=c.output().map_err(|e|format!("{exe}: {e}"))?;if !o.status.success(){return Err(String::from_utf8_lossy(&o.stderr).chars().take(4000).collect());}Ok(o.stdout)}
fn args(s:&[&str])->Vec<String>{s.iter().map(|s|s.to_string()).collect()}
#[derive(Clone,Serialize,Deserialize)]
pub struct Job{pub id:String,pub kind:String,pub status:String,pub progress:f64,pub file:String,pub error:String,#[serde(skip)]pub cancelled:bool}
#[derive(Serialize,Deserialize)]
pub struct Disk{pub project:Project,pub media:Vec<Media>,#[serde(default)]pub jobs:Vec<Job>}
pub struct Engine{pub root:PathBuf,pub project:Project,pub media:Vec<Media>,pub jobs:Vec<Job>,pub children:std::collections::HashMap<String,Arc<Mutex<Child>>>,pub hub_token:String,pub evidence:bool}
pub type Shared=Arc<Mutex<Engine>>;
impl Engine{
 pub fn new(root:PathBuf,evidence:bool)->Result<Self,String>{fs::create_dir_all(root.join("media")).map_err(|e|e.to_string())?;fs::create_dir_all(root.join("jobs")).map_err(|e|e.to_string())?;let saved=root.join("session.json");let mut disk=if saved.exists(){serde_json::from_slice::<Disk>(&fs::read(saved).map_err(|e|e.to_string())?).map_err(|e|format!("Proje kurtarılamadı: {e}"))?}else{Disk{project:Project::default(),media:vec![],jobs:vec![]}};let canonical=root.canonicalize().map_err(|e|e.to_string())?;for m in &disk.media{let file=Path::new(&m.file).canonicalize().map_err(|_|"Kayıtlı medya bulunamadı".to_string())?;if !file.starts_with(&canonical){return Err("Medya uygulama alanı dışında".into());}}disk.project.validate(&disk.media)?;for j in &disk.jobs{if !Path::new(&j.file).starts_with(&root){return Err("İş çıktısı uygulama alanı dışında".into());}}Ok(Self{root,project:disk.project,media:disk.media,jobs:disk.jobs.into_iter().map(|mut j|{if j.status=="running"||j.status=="queued"{j.status="failed".into();j.error="Uygulama kapandı; render işini yeniden başlatın".into();}j}).collect(),children:Default::default(),hub_token:String::new(),evidence})}
 pub fn snapshot(&self)->serde_json::Value{serde_json::json!({"project":self.project,"media":self.media,"jobs":self.jobs,"capabilities":{"rust":true,"mymind":!self.hub_token.is_empty(),"aiMask":false,"graph":"serial-video","gpu":false}})}
 pub fn save(&mut self,mut project:Project)->Result<(),String>{project.validate(&self.media)?;let disk=Disk{project:project.clone(),media:self.media.clone(),jobs:self.jobs.clone()};let bytes=serde_json::to_vec_pretty(&disk).map_err(|e|e.to_string())?;let temp=self.root.join("session.tmp");fs::write(&temp,bytes).map_err(|e|e.to_string())?;let dest=self.root.join("session.json");#[cfg(windows)] if dest.exists(){fs::copy(&dest,self.root.join("session.previous.json")).map_err(|e|e.to_string())?;fs::remove_file(&dest).map_err(|e|e.to_string())?;}fs::rename(temp,dest).map_err(|e|e.to_string())?;self.project=project;Ok(())}
 pub fn import(&mut self,path:&Path)->Result<Media,String>{
  let metadata=fs::metadata(path).map_err(|e|e.to_string())?;if !metadata.is_file()||metadata.len()>1024*1024*1024{return Err("Dosya sınırı 1 GB".into());}
  let id=Uuid::new_v4().to_string();let extension=path.extension().and_then(|s|s.to_str()).unwrap_or("bin").to_lowercase();if extension.len()>10||!extension.chars().all(|c|c.is_ascii_alphanumeric()){return Err("Dosya uzantısı geçersiz".into());}
  let file=self.root.join("media").join(format!("{id}.{extension}"));let mut m=Media{id:id.clone(),name:path.file_name().unwrap_or_default().to_string_lossy().into(),kind:String::new(),duration:0.,width:0,height:0,audio:false,file:file.to_string_lossy().into(),thumbnail:String::new()};
  if extension=="cube"{let text=fs::read_to_string(path).map_err(|e|e.to_string())?;if text.len()>12_000_000{return Err("LUT sınırı 12 MB".into());}let size=text.lines().find_map(|l|l.strip_prefix("LUT_3D_SIZE ")).and_then(|n|n.trim().parse::<usize>().ok()).ok_or("LUT_3D_SIZE yok")?;if !(2..=65).contains(&size){return Err("LUT boyutu 2–65".into());}let count=text.lines().filter(|l|{let n:Vec<_>=l.split_whitespace().collect();n.len()==3&&n.iter().all(|x|x.parse::<f64>().is_ok_and(|v|v.is_finite()))}).count();if count!=size.pow(3){return Err("LUT veri sayısı eşleşmiyor".into());}m.kind="lut".into();}
  else{let probe=run("ffprobe",&vec!["-v".into(),"error".into(),"-show_format".into(),"-show_streams".into(),"-of".into(),"json".into(),path.to_string_lossy().into()],None)?;let value:serde_json::Value=serde_json::from_slice(&probe).map_err(|e|e.to_string())?;m.duration=value["format"]["duration"].as_str().and_then(|s|s.parse().ok()).ok_or("Medya süresi yok")?;number(m.duration,0.01,86400.)?;for s in value["streams"].as_array().ok_or("Medya akışı yok")?{if s["codec_type"]=="video"{m.width=s["width"].as_u64().unwrap_or(0)as u32;m.height=s["height"].as_u64().unwrap_or(0)as u32;}if s["codec_type"]=="audio"{m.audio=true;}}m.kind=if m.width>0{"video"}else if m.audio{"audio"}else{return Err("Video/ses bulunamadı".into())}.into();}
  fs::copy(path,&file).map_err(|e|e.to_string())?;
  if m.kind=="video"{let thumb=run("ffmpeg",&vec!["-v".into(),"error".into(),"-i".into(),file.to_string_lossy().into(),"-frames:v".into(),"1".into(),"-vf".into(),"scale=240:-2".into(),"-f".into(),"image2pipe".into(),"-c:v".into(),"mjpeg".into(),"pipe:1".into()],None)?;m.thumbnail=format!("data:image/jpeg;base64,{}",base64::engine::general_purpose::STANDARD.encode(thumb));}
  self.media.push(m.clone());self.save(self.project.clone())?;Ok(m)
 }
}
fn param(n:&Node,key:&str,default:f64,lo:f64,hi:f64)->Result<f64,String>{let value=n.params.get(key).and_then(|n|n.as_f64()).unwrap_or(default);number(value,lo,hi)?;Ok(value)}
pub fn filters(project:&Project,media:&[Media],dir:&Path,preview:bool)->Result<(String,Vec<String>),String>{
 let(w,h)=if preview{(640,360)}else{(project.width,project.height)};let duration=project.duration();let mut a=args(&["-hide_banner","-v","error","-nostdin","-y"]);
 let mut f=vec![format!("color=c=black:s={w}x{h}:r={}:d={duration}[base]",project.fps),format!("anullsrc=r=48000:cl=stereo,atrim=duration={duration}[silent]")];let mut audio=vec!["silent".to_string()];let mut prev="base".to_string();
 for c in &project.clips{let m=media.iter().find(|m|m.id==c.media_id).ok_or("Medya yok")?;a.extend(vec!["-ss".into(),c.source_in.to_string(),"-t".into(),(c.duration*c.speed).to_string(),"-i".into(),m.file.clone()]);}
 let mut sorted:Vec<_>=project.clips.iter().enumerate().collect();sorted.sort_by_key(|(_,c)|c.layer);
 for(i,c)in sorted{let m=media.iter().find(|m|m.id==c.media_id).unwrap();
  if m.kind=="video"{
   let sw=((w as f64*c.scale).round()as u32/2*2).max(2);let sh=((h as f64*c.scale).round()as u32/2*2).max(2);
   let mut fx=format!("setpts=(PTS-STARTPTS)/{},scale={sw}:{sh}:force_original_aspect_ratio=decrease,setsar=1,fps={},format=yuva420p,eq=brightness={}:contrast={}:saturation={}",c.speed,project.fps,c.brightness,c.contrast,c.saturation);
   if c.blur>0.{fx+=&format!(",gblur=sigma={}",c.blur);}
   for n in graph(&c.nodes)?{if n.params.get("enabled")==Some(&serde_json::Value::Bool(false)){continue;}match n.kind.as_str(){"color"=>fx+=&format!(",eq=brightness={}:contrast={}:saturation={}",param(n,"brightness",0.,-1.,1.)?,param(n,"contrast",1.,0.,3.)?,param(n,"saturation",1.,0.,3.)?),"blur"=>fx+=&format!(",gblur=sigma={}",param(n,"sigma",1.,0.,30.)?),"chroma"=>{let color=n.params.get("color").and_then(|v|v.as_str()).unwrap_or("00ff00").trim_start_matches("0x").trim_start_matches('#');if color.len()!=6||!color.chars().all(|c|c.is_ascii_hexdigit()){return Err("Chroma rengi geçersiz".into());}fx+=&format!(",chromakey=0x{color}:{}:{}",param(n,"similarity",0.1,0.01,1.)?,param(n,"blend",0.,0.,1.)?);},_=>{}}}
   if let Some(id)=&c.lut_id{if !id.is_empty(){let lut=media.iter().find(|m|&m.id==id&&m.kind=="lut").ok_or("LUT yok")?;fs::copy(&lut.file,dir.join(format!("lut{i}.cube"))).map_err(|e|e.to_string())?;fx+=&format!(",lut3d=file=lut{i}.cube");}}
   fx+=&format!(",colorchannelmixer=aa={}",c.opacity);if c.fade>0.{fx+=&format!(",fade=t=in:st=0:d={}:alpha=1,fade=t=out:st={}:d={}:alpha=1",c.fade,c.duration-c.fade,c.fade);}
   f.push(format!("[{i}:v]{fx},setpts=PTS+{}/TB[v{i}]",c.start));let shifted:Vec<Key>=c.keyframes.iter().map(|k|Key{frame:k.frame+(c.start*project.fps).round()as u32,property:k.property.clone(),value:k.value,easing:k.easing.clone()}).collect();let x=curve(&shifted,"x",c.x,project.fps);let y=curve(&shifted,"y",c.y,project.fps);let factor=w as f64/project.width as f64;
   f.push(format!("[{prev}][v{i}]overlay=x='(W-w)/2+({x})*{factor}':y='(H-h)/2+({y})*{factor}':eof_action=pass:enable='between(t,{},{})'[o{i}]",c.start,c.start+c.duration));prev=format!("o{i}");
  }
  if m.audio&&c.volume>0.{let mut tempo=c.speed;let mut at=String::new();while tempo>2.{at+="atempo=2,";tempo/=2.;}while tempo<0.5{at+="atempo=0.5,";tempo*=2.;}at+=&format!("atempo={tempo}");f.push(format!("[{i}:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,{at},volume={},adelay={}:all=1[a{i}]",c.volume,(c.start*1000.).round()));audio.push(format!("a{i}"));}
 }
 if !project.subtitles.is_empty(){#[cfg(windows)]fs::copy(Path::new(&std::env::var("WINDIR").unwrap_or("C:\\Windows".into())).join("Fonts/segoeui.ttf"),dir.join("font.ttf")).map_err(|e|e.to_string())?;}
 for(i,s)in project.subtitles.iter().enumerate(){fs::write(dir.join(format!("text{i}.txt")),&s.text).map_err(|e|e.to_string())?;f.push(format!("[{prev}]drawtext={}textfile=text{i}.txt:expansion=none:fontcolor=white:fontsize={}:box=1:boxcolor=black@0.7:x=(w-tw)/2:y=h-th-30:enable='between(t,{},{})'[s{i}]",if cfg!(windows){"fontfile=font.ttf:"}else{""},h/24,s.start,s.start+s.duration));prev=format!("s{i}");}
 f.push(format!("{}amix=inputs={}:normalize=0:duration=first[aout]",audio.iter().map(|s|format!("[{s}]")).collect::<String>(),audio.len()));
 a.extend(vec!["-/filter_complex".into(),"graph.txt".into(),"-map".into(),format!("[{prev}]"),"-map".into(),"[aout]".into(),"-t".into(),duration.to_string(),"-c:v".into(),"libx264".into(),"-preset".into(),"ultrafast".into(),"-pix_fmt".into(),"yuv420p".into(),"-c:a".into(),"aac".into(),"-threads".into(),"2".into(),"-filter_complex_threads".into(),"1".into(),"-movflags".into(),"+faststart".into(),"-progress".into(),"pipe:1".into(),"output.mp4".into()]);Ok((f.join(";\n"),a))
}
pub fn enqueue(shared:Shared,mut project:Project,kind:String)->Result<String,String>{
 if !["preview","export","proxy"].contains(&kind.as_str()){return Err("Render türü geçersiz".into());}
 let id=Uuid::new_v4().to_string();{let mut s=shared.lock().map_err(|e|e.to_string())?;project.validate(&s.media)?;if project.clips.is_empty(){return Err("Zaman çizelgesi boş".into());}if s.jobs.iter().filter(|j|j.status=="queued"||j.status=="running").count()>=8{return Err("Kuyruk dolu".into());}s.save(project.clone())?;let file=s.root.join("jobs").join(&id).join("output.mp4").to_string_lossy().into();s.jobs.push(Job{id:id.clone(),kind:kind.clone(),status:"queued".into(),progress:0.,file,error:String::new(),cancelled:false});}
 let job_id=id.clone();thread::spawn(move||{
  loop{let mut s=shared.lock().unwrap();let j=s.jobs.iter().find(|j|j.id==job_id).unwrap();if j.cancelled{return;}let first=s.jobs.iter().find(|j|j.status=="queued"||j.status=="running").map(|j|j.id==job_id).unwrap_or(false);if first{s.jobs.iter_mut().find(|j|j.id==job_id).unwrap().status="running".into();break;}drop(s);thread::sleep(std::time::Duration::from_millis(100));}
  let result=(||->Result<(),String>{let(root,media)={let s=shared.lock().unwrap();(s.root.clone(),s.media.clone())};let dir=root.join("jobs").join(&job_id);fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let(graph,a)=filters(&project,&media,&dir,kind!="export")?;fs::write(dir.join("graph.txt"),graph).map_err(|e|e.to_string())?;
   let stderr=fs::File::create(dir.join("error.log")).map_err(|e|e.to_string())?;let mut c=command("ffmpeg");c.args(a).current_dir(&dir).stdout(Stdio::piped()).stderr(stderr);let mut child=c.spawn().map_err(|e|e.to_string())?;let stdout=child.stdout.take().ok_or("FFmpeg stdout yok")?;let handle=Arc::new(Mutex::new(child));shared.lock().unwrap().children.insert(job_id.clone(),handle.clone());
   for line in BufReader::new(stdout).lines(){let line=line.map_err(|e|e.to_string())?;if let Some(n)=line.strip_prefix("out_time_us=").and_then(|n|n.parse::<f64>().ok()){let mut s=shared.lock().unwrap();let j=s.jobs.iter_mut().find(|j|j.id==job_id).unwrap();j.progress=(n/1e6/project.duration()).min(0.99);}}
   let status=handle.lock().unwrap().wait().map_err(|e|e.to_string())?;if !status.success(){return Err(fs::read_to_string(dir.join("error.log")).unwrap_or("Render başarısız".into()).chars().take(4000).collect());}Ok(())})();
  let mut s=shared.lock().unwrap();s.children.remove(&job_id);let j=s.jobs.iter_mut().find(|j|j.id==job_id).unwrap();if j.cancelled{j.status="cancelled".into();}else{match result{Ok(())=>{j.status="completed".into();j.progress=1.;},Err(e)=>{j.status="failed".into();j.error=e;}}}
 });Ok(id)
}
#[cfg(test)]mod tests{
 use super::*;
 #[test]fn real_ffmpeg_preview_and_export(){
  let root=std::env::temp_dir().join(format!("kurgu-rust-test-{}",Uuid::new_v4()));fs::create_dir_all(&root).unwrap();
  let result=(||->Result<(),String>{
   let source=root.join("source.mp4");let mut a=args(&["-v","error","-y","-f","lavfi","-i","testsrc2=s=160x90:r=30:d=1","-f","lavfi","-i","sine=frequency=440:duration=1","-c:v","libx264","-threads","2","-pix_fmt","yuv420p","-c:a","aac","-shortest"]);a.push(source.to_string_lossy().into());run("ffmpeg",&a,None)?;
   let mut e=Engine::new(root.join("data"),true)?;let m=e.import(&source)?;
   let mut p:Project=serde_json::from_value(serde_json::json!({"version":2,"name":"Rust test","fps":30,"clips":[{"id":"v1","mediaId":m.id,"start":0,"in":0,"duration":1,"speed":1,"volume":0.3,"fade":0.1,"nodes":[{"id":"color","kind":"color","brightness":0.05,"contrast":1.1,"enabled":true}],"keyframes":[{"frame":0,"property":"x","value":0,"easing":"linear"},{"frame":30,"property":"x","value":20,"easing":"linear"}]}],"subtitles":[{"text":"Rust · gerçek render","start":0,"duration":1}]})).map_err(|e|e.to_string())?;p.validate(&e.media)?;
   for preview in [true,false]{let d=root.join(if preview{"preview"}else{"export"});fs::create_dir_all(&d).map_err(|e|e.to_string())?;let(g,a)=filters(&p,&e.media,&d,preview)?;fs::write(d.join("graph.txt"),g).map_err(|e|e.to_string())?;run("ffmpeg",&a,Some(&d))?;let probe=run("ffprobe",&vec!["-v".into(),"error".into(),"-show_streams".into(),"-of".into(),"json".into(),d.join("output.mp4").to_string_lossy().into()],None)?;let v:serde_json::Value=serde_json::from_slice(&probe).map_err(|e|e.to_string())?;let streams=v["streams"].as_array().unwrap();assert!(streams.iter().any(|s|s["width"]==if preview{640}else{1920}));assert!(streams.iter().any(|s|s["codec_type"]=="audio"));}
   e.save(p)?;assert_eq!(Engine::new(e.root.clone(),true)?.project.clips.len(),1);Ok(())
  })();fs::remove_dir_all(&root).unwrap();result.unwrap();
 }
}
