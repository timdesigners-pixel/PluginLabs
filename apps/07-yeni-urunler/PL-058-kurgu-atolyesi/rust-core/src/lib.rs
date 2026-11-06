//! Frame-accurate editing and typed compositing kernel. No third-party dependencies.
use std::collections::{HashMap, HashSet};

pub type Frame = i64;
#[derive(Clone, Debug, PartialEq)]
pub struct Clip { pub id: u64, pub track: u32, pub start: Frame, pub source_in: Frame, pub length: Frame, pub source_length: Frame }
impl Clip {
    pub fn validate(&self) -> Result<(), &'static str> {
        if self.start < 0 || self.source_in < 0 || self.length < 1 || self.source_in.checked_add(self.length).is_none_or(|n| n > self.source_length) || self.start.checked_add(self.length).is_none() { return Err("invalid clip range"); } Ok(())
    }
    pub fn split(&self, at: Frame, new_id: u64) -> Result<(Self, Self), &'static str> {
        self.validate()?; if at <= 0 || at >= self.length || new_id == self.id {return Err("split must be inside clip with a fresh id");}
        let mut left=self.clone(); left.length=at;
        let mut right=self.clone(); right.id=new_id;right.start+=at;right.source_in+=at;right.length-=at;Ok((left,right))
    }
    pub fn slip(&mut self, delta: Frame) -> Result<(), &'static str> { let mut candidate=self.clone();candidate.source_in=candidate.source_in.checked_add(delta).ok_or("overflow")?;candidate.validate()?;*self=candidate;Ok(()) }
    pub fn trim(&mut self, incoming: Frame, length: Frame) -> Result<(), &'static str> {let mut candidate=self.clone();candidate.source_in=incoming;candidate.length=length;candidate.validate()?;*self=candidate;Ok(())}
}
pub fn snap(frame: Frame, targets: &[Frame], tolerance: Frame) -> Frame {
    targets.iter().copied().filter(|&n|n>=0 && n.abs_diff(frame)<=tolerance.max(0) as u64).min_by_key(|n|(n.abs_diff(frame),*n)).unwrap_or(frame.max(0))
}
#[derive(Clone, Default, Debug, PartialEq)]
pub struct Timeline {pub clips: Vec<Clip>,pub locked: HashSet<u32>}
impl Timeline {
    pub fn move_clip(&mut self,id:u64,start:Frame,track:u32)->Result<(),&'static str>{
        let c=self.clips.iter_mut().find(|c|c.id==id).ok_or("clip not found")?;
        if self.locked.contains(&c.track)||self.locked.contains(&track){return Err("track locked");}
        let mut candidate=c.clone();candidate.start=start;candidate.track=track;candidate.validate()?;*c=candidate;Ok(())
    }
    pub fn ripple_remove(&mut self,id:u64)->Result<(),&'static str>{
        let c=self.clips.iter().find(|c|c.id==id).ok_or("clip not found")?.clone();
        if self.locked.contains(&c.track){return Err("track locked");}
        self.clips.retain(|x|x.id!=id);
        for x in &mut self.clips{if x.track==c.track && x.start>=c.start+c.length{x.start-=c.length;}}
        Ok(())
    }
}
#[derive(Default)]
pub struct History {pub current:Timeline,past:Vec<Timeline>,future:Vec<Timeline>}
impl History {
    pub fn edit(&mut self, f: impl FnOnce(&mut Timeline)->Result<(),&'static str>)->Result<(),&'static str>{let mut next=self.current.clone();f(&mut next)?;self.past.push(std::mem::replace(&mut self.current,next));self.future.clear();Ok(())}
    pub fn undo(&mut self)->bool{if let Some(p)=self.past.pop(){self.future.push(std::mem::replace(&mut self.current,p));true}else{false}}
    pub fn redo(&mut self)->bool{if let Some(p)=self.future.pop(){self.past.push(std::mem::replace(&mut self.current,p));true}else{false}}
}
#[derive(Clone,Copy,Debug)]
pub enum Easing {Linear, Smooth, Hold}
#[derive(Clone,Copy,Debug)]
pub struct Key {pub frame:Frame,pub value:f64,pub easing:Easing}
pub fn evaluate(keys:&[Key],frame:Frame)->Result<f64,&'static str>{
    if keys.is_empty()||keys.iter().any(|k|k.frame<0||!k.value.is_finite())||keys.windows(2).any(|w|w[0].frame>=w[1].frame){return Err("invalid keys");}
    if frame<=keys[0].frame{return Ok(keys[0].value);}
    for pair in keys.windows(2){let (a,b)=(pair[0],pair[1]);if frame<b.frame{let t=(frame-a.frame)as f64/(b.frame-a.frame)as f64;let t=match a.easing{Easing::Linear=>t,Easing::Smooth=>t*t*(3.-2.*t),Easing::Hold=>0.};return Ok(a.value+(b.value-a.value)*t);}}
    Ok(keys.last().unwrap().value)
}
#[derive(Clone,Copy,PartialEq,Eq,Debug)]
pub enum Port {Video,Audio,Mask}
#[derive(Clone,Debug)]
pub struct Node {pub id:u64,pub input:Option<Port>,pub output:Port}
pub fn graph_order(nodes:&[Node],edges:&[(u64,u64)])->Result<Vec<u64>,&'static str>{
    if nodes.len()>100||edges.len()>200{return Err("graph limit");}
    let index:HashMap<_,_>=nodes.iter().map(|n|(n.id,n)).collect();if index.len()!=nodes.len(){return Err("duplicate node");}
    let mut indegree:HashMap<u64,usize>=nodes.iter().map(|n|(n.id,0)).collect();let mut seen=HashSet::new();
    for &(a,b) in edges {let x=index.get(&a).ok_or("missing source")?;let y=index.get(&b).ok_or("missing destination")?;if Some(x.output)!=y.input||!seen.insert((a,b)){return Err("incompatible port or duplicate edge");}*indegree.get_mut(&b).unwrap()+=1;}
    let mut ready:Vec<_>=nodes.iter().filter(|n|indegree[&n.id]==0).map(|n|n.id).collect();let mut result=vec![];
    while let Some(id)=ready.pop(){result.push(id);for &(_,b) in edges.iter().filter(|&&(a,_)|a==id){let d=indegree.get_mut(&b).unwrap();*d-=1;if *d==0{ready.push(b);}}}
    if result.len()!=nodes.len(){return Err("cycle");}Ok(result)
}
#[cfg(test)]
mod tests {
 use super::*;
 fn clip()->Clip{Clip{id:1,track:0,start:10,source_in:3,length:30,source_length:90}}
 #[test] fn split_slip_trim(){let c=clip();let(a,b)=c.split(12,2).unwrap();assert_eq!((a.length,b.start,b.source_in,b.length),(12,22,15,18));let mut c=c;c.slip(5).unwrap();assert_eq!(c.source_in,8);let before=c.clone();assert!(c.slip(100).is_err());assert_eq!(c,before);c.trim(4,20).unwrap();assert_eq!(c.length,20);}
 #[test] fn ripple_lock_history(){let mut h=History::default();h.current.clips=vec![clip(),Clip{id:2,start:40,..clip()}];h.edit(|t|t.ripple_remove(1)).unwrap();assert_eq!(h.current.clips[0].start,10);assert!(h.undo());assert_eq!(h.current.clips.len(),2);assert!(h.redo());h.current.locked.insert(0);assert!(h.edit(|t|t.move_clip(2,0,0)).is_err());}
 #[test] fn snap_and_keys(){assert_eq!(snap(29,&[20,30,60],2),30);assert_eq!(snap(29,&[20,60],2),29);assert_eq!(evaluate(&[Key{frame:0,value:0.,easing:Easing::Smooth},Key{frame:30,value:1.,easing:Easing::Linear}],15).unwrap(),0.5);}
 #[test] fn graph_rejects_cycle_and_mismatched_types(){let n=vec![Node{id:1,input:Some(Port::Video),output:Port::Video},Node{id:2,input:Some(Port::Video),output:Port::Video}];assert_eq!(graph_order(&n,&[(1,2)]).unwrap(),vec![1,2]);assert!(graph_order(&n,&[(1,2),(2,1)]).is_err());let n=vec![Node{id:1,input:None,output:Port::Audio},Node{id:2,input:Some(Port::Video),output:Port::Video}];assert!(graph_order(&n,&[(1,2)]).is_err());}
}
