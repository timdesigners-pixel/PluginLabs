use serde::{Deserialize, Serialize};
use std::collections::{HashMap,HashSet};
fn one()->f64{1.0}
fn fps()->f64{30.0}
fn width()->u32{1920}
fn height()->u32{1080}
#[derive(Clone,Serialize,Deserialize,Debug)]
#[serde(rename_all="camelCase")]
pub struct Media{pub id:String,pub name:String,pub kind:String,pub duration:f64,pub width:u32,pub height:u32,pub audio:bool,pub file:String,pub thumbnail:String}
#[derive(Clone,Serialize,Deserialize,Debug)]
pub struct Key{pub frame:u32,pub property:String,pub value:f64,#[serde(default)]pub easing:String}
#[derive(Clone,Serialize,Deserialize,Debug)]
pub struct Node{pub id:String,#[serde(alias="type")]pub kind:String,#[serde(default)]pub inputs:Vec<String>,#[serde(flatten)]pub params:HashMap<String,serde_json::Value>}
#[derive(Clone,Serialize,Deserialize,Debug)]
#[serde(rename_all="camelCase")]
pub struct Clip{
 pub id:String,pub media_id:String,pub start:f64,#[serde(rename="in")]pub source_in:f64,pub duration:f64,#[serde(default)]pub layer:u32,
 #[serde(default="one")]pub volume:f64,#[serde(default)]pub fade:f64,#[serde(default="one")]pub speed:f64,
 #[serde(default)]pub brightness:f64,#[serde(default="one")]pub contrast:f64,#[serde(default="one")]pub saturation:f64,#[serde(default)]pub blur:f64,
 #[serde(default)]pub x:f64,#[serde(default)]pub y:f64,#[serde(default="one")]pub scale:f64,#[serde(default="one")]pub opacity:f64,
 #[serde(default)]pub keyframes:Vec<Key>,#[serde(default)]pub nodes:Vec<Node>,#[serde(default)]pub lut_id:Option<String>,
}
#[derive(Clone,Serialize,Deserialize,Debug)]
pub struct Subtitle{pub text:String,pub start:f64,pub duration:f64}
#[derive(Clone,Serialize,Deserialize,Debug)]
pub struct Project{pub version:u32,pub name:String,#[serde(default="width")]pub width:u32,#[serde(default="height")]pub height:u32,#[serde(default="fps")]pub fps:f64,#[serde(default)]pub clips:Vec<Clip>,#[serde(default)]pub subtitles:Vec<Subtitle>}
impl Default for Project{fn default()->Self{Self{version:2,name:"Yeni proje".into(),width:1920,height:1080,fps:30.,clips:vec![],subtitles:vec![]}}}
pub fn number(n:f64,min:f64,max:f64)->Result<(),String>{if !n.is_finite()||n<min||n>max{Err(format!("Parametre aralık dışında: {min}–{max}"))}else{Ok(())}}
pub fn graph(nodes:&[Node])->Result<Vec<&Node>,String>{
 if nodes.len()>64{return Err("En fazla 64 düğüm".into());}
 let map:HashMap<_,_>=nodes.iter().map(|n|(n.id.as_str(),n)).collect();if map.len()!=nodes.len(){return Err("Düğüm kimliği yineleniyor".into());}
 let mut order=vec![];let mut visiting=HashSet::new();let mut done=HashSet::new();
 fn visit<'a>(n:&'a Node,map:&HashMap<&str,&'a Node>,visiting:&mut HashSet<String>,done:&mut HashSet<String>,out:&mut Vec<&'a Node>)->Result<(),String>{
  if done.contains(&n.id){return Ok(());}if !visiting.insert(n.id.clone()){return Err("Düğüm döngüsü".into());}
  if !["source","color","blur","chroma","transform","output"].contains(&n.kind.as_str())||n.inputs.len()>1{return Err("Desteklenmeyen düğüm veya çok girişli port".into());}
  for id in &n.inputs{visit(map.get(id.as_str()).ok_or("Düğüm bağlantısı bulunamadı")?,map,visiting,done,out)?;}
  visiting.remove(&n.id);done.insert(n.id.clone());out.push(n);Ok(())
 }
 for n in nodes{visit(n,&map,&mut visiting,&mut done,&mut order)?;}Ok(order)
}
impl Project{
 pub fn validate(&mut self,media:&[Media])->Result<(),String>{
  if self.version!=2||self.clips.len()>100||self.subtitles.len()>200||self.name.len()>256{return Err("Proje sınırı veya sürümü geçersiz".into());}
  number(self.fps,1.,120.)?;if self.width<64||self.height<64||self.width>3840||self.height>2160||self.width%2!=0||self.height%2!=0{return Err("Çözünürlük geçersiz".into());}
  let mut ids=HashSet::new();
  for c in &mut self.clips{
   if !ids.insert(c.id.clone()){return Err("Klip kimliği yineleniyor".into());}
   let m=media.iter().find(|m|m.id==c.media_id).ok_or("Medya bulunamadı")?;
   if !["video","audio"].contains(&m.kind.as_str()){return Err("Klip kaynağı video/ses olmalı".into());}
   number(c.start,0.,3600.)?;number(c.source_in,0.,m.duration)?;number(c.duration,1./self.fps,3600.)?;number(c.speed,0.25,4.)?;
   number(c.volume,0.,2.)?;number(c.fade,0.,c.duration/2.)?;number(c.brightness,-1.,1.)?;number(c.contrast,0.,3.)?;number(c.saturation,0.,3.)?;number(c.blur,0.,30.)?;
   number(c.x,-8192.,8192.)?;number(c.y,-8192.,8192.)?;number(c.scale,0.05,4.)?;number(c.opacity,0.,1.)?;
   if c.layer>16||c.source_in+c.duration*c.speed>m.duration+1./self.fps||c.start+c.duration>3600.{return Err("Klip kaynak aralığı veya katmanı geçersiz".into());}
   c.start=(c.start*self.fps).round()/self.fps;c.duration=(c.duration*self.fps).round()/self.fps;
   if c.keyframes.len()>200{return Err("Keyframe sınırı".into());}
   for k in &c.keyframes{if !["x","y"].contains(&k.property.as_str())||!["","linear","smooth","hold"].contains(&k.easing.as_str()){return Err("Keyframe tipi geçersiz".into());}number(k.value,if k.property=="opacity"{0.}else{-8192.},if k.property=="opacity"{1.}else{8192.})?;}
   graph(&c.nodes)?;
   if let Some(id)=&c.lut_id{if !id.is_empty()&&!media.iter().any(|m|&m.id==id&&m.kind=="lut"){return Err("LUT bulunamadı".into());}}
  }
  for s in &self.subtitles{number(s.start,0.,3600.)?;number(s.duration,0.01,3600.)?;if s.text.len()>8000{return Err("Altyazı sınırı".into());}}
  Ok(())
 }
 pub fn duration(&self)->f64{self.clips.iter().map(|c|c.start+c.duration).fold(0.,f64::max)}
}
pub fn curve(keys:&[Key],property:&str,base:f64,fps:f64)->String{
 let mut keys:Vec<_>=keys.iter().filter(|k|k.property==property).collect();keys.sort_by_key(|k|k.frame);keys.dedup_by_key(|k|k.frame);
 if keys.is_empty(){return base.to_string();}let mut tail=keys.last().unwrap().value.to_string();
 for w in keys.windows(2).rev(){let(a,b)=(w[0],w[1]);let t=format!("((t-{})/{})",a.frame as f64/fps,(b.frame-a.frame)as f64/fps);let ease=match a.easing.as_str(){"hold"=>"0".into(),"smooth"=>format!("({t}*{t}*(3-2*{t}))"),_=>t};tail=format!("if(lt(t,{}),{}+({}-{})*{}, {})",b.frame as f64/fps,a.value,b.value,a.value,ease,tail);}
 format!("if(lt(t,{}),{}, {})",keys[0].frame as f64/fps,keys[0].value,tail)
}
#[cfg(test)]mod tests{
 use super::*;
 #[test]fn graph_cycle_rejected(){let n=|id:&str,input:&str|Node{id:id.into(),kind:"color".into(),inputs:vec![input.into()],params:HashMap::new()};assert!(graph(&[n("a","b"),n("b","a")]).is_err());assert!(graph(&[n("a","missing")]).is_err());}
 #[test]fn keyframe_expression_uses_frames(){let k=vec![Key{frame:0,property:"x".into(),value:0.,easing:"linear".into()},Key{frame:30,property:"x".into(),value:100.,easing:"smooth".into()}];assert!(curve(&k,"x",0.,30.).contains("lt(t,1)"));assert_eq!(curve(&[],"x",42.,30.),"42");}
}
