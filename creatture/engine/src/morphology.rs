use serde::{Serialize,Deserialize};
const SIDE:usize=12;
const CELLS:usize=SIDE*SIDE;
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Node {pub id:usize,pub parent:usize,pub organ:usize,pub pos:[f64;3],pub radius:f64,pub exterior:bool,pub maturity:f64}
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Morphology {pub nodes:Vec<Node>,pub activator:Vec<f64>,pub inhibitor:Vec<f64>,pub regulation:[f64;12]}
impl Morphology{
 pub fn new()->Self{Self{nodes:vec![Node{id:0,parent:0,organ:0,pos:[0.,0.,0.],radius:0.49,exterior:true,maturity:1.}],activator:vec![1.;CELLS],inhibitor:vec![0.;CELLS],regulation:[0.;12]}}
 pub fn valid(&self)->bool{self.nodes.len()<=40&&!self.nodes.is_empty()&&self.nodes.iter().enumerate().all(|(i,n)|n.id==i&&(i==0||n.parent<i)&&n.organ<12&&n.radius.is_finite()&&n.radius>0.&&n.radius<=1.&&n.pos.iter().all(|x|x.is_finite()&&x.abs()<2.)&&n.maturity.is_finite()&&n.maturity>=0.&&n.maturity<=1.)&&self.activator.len()==CELLS&&self.inhibitor.len()==CELLS&&self.activator.iter().chain(self.inhibitor.iter()).chain(self.regulation.iter()).all(|x|x.is_finite()&&*x>=0.&&*x<=1.)}
 pub fn step(&mut self,world:usize,genome:&[f64;8],organs:&[f64;12],signal:&[f64],integrity:&[f64;12],hydration:f64,tick:u64){
  // Two bounded Gray-Scott reaction fields, no-flux boundaries. Signal influences local feed.
  if tick%4==0{
   let u=self.activator.clone();let v=self.inhibitor.clone();
   let lap=|a:&[f64],x:usize,y:usize|a[y*SIDE+x.saturating_sub(1)]+a[y*SIDE+(x+1).min(SIDE-1)]+a[y.saturating_sub(1)*SIDE+x]+a[(y+1).min(SIDE-1)*SIDE+x]-4.*a[y*SIDE+x];
   for y in 0..SIDE{for x in 0..SIDE{let i=y*SIDE+x;let feed=0.025+0.015*genome[2]+0.01*hydration;let kill=0.055+0.008*genome[3];let reaction=u[i]*v[i]*v[i];let seed=0.015*signal[i]*(1.-v[i]);
    self.activator[i]=(u[i]+0.15*lap(&u,x,y)-reaction+feed*(1.-u[i])).clamp(0.,1.);
    self.inhibitor[i]=(v[i]+0.07*lap(&v,x,y)+reaction-(feed+kill)*v[i]+seed).clamp(0.,1.);
   }}
  }
  let prev=self.regulation;
  let requirements=[0,0,0,2,0,1,5,1,7,0,6,6];
  for i in 0..12{
   let upstream=requirements[i];let site=(2+(i*3)%8)*SIDE+2+(i*5)%8;
   let local=self.inhibitor[site];
   let support=if i==0{1.}else{0.35+0.45*prev[upstream]};
   let goal=(organs[i]/1.7*support*(0.75+0.4*genome[i%8])+local*0.15).clamp(0.,1.)*integrity[i];
   self.regulation[i]=(prev[i]+0.045*(goal-prev[i])).clamp(0.,1.);
  }
  // Constrained grammar: each organ can create an anchored primary structure and, as
  // its regulatory signal matures, a supported secondary structure. Nodes never float.
  self.nodes[0].radius=(0.47+0.045*organs[0]+0.035*organs[1]).min(0.76);
  let positions:[[f64;3];12]=[[0.,0.1,0.],[0.,-0.12,0.09],[0.,0.,-0.31],[0.,0.39,-0.10],[0.,0.16,-0.36],[0.37,-0.22,0.],[0.,0.26,0.30],[-0.26,0.02,-0.19],[0.,0.34,-0.28],[0.,-0.16,-0.29],[0.19,0.12,0.12],[0.24,0.39,0.12]];
  let exterior=[true,false,true,true,true,true,false,true,true,false,false,true];
  for i in 1..12{
   if self.regulation[i]<0.025&& !self.nodes.iter().any(|n|n.organ==i){continue;}
   let mut parent=self.nodes.iter().position(|n|n.organ==requirements[i]).unwrap_or(0);
   if requirements[i]==i{parent=0;}
   let mut target=positions[i];let w=world.min(5);
   // World-specific anatomical axes, not only palette variations.
   if w==1{target[0]*=1.25;target[1]*=0.70;target[2]*=1.25;}
   if w==2{target[0]*=1.25;target[1]*=1.35;target[2]*=0.8;}
   if w==3{target[1]*=1.25;target[2]*=0.85;}
   if w==4{target[0]*=1.15;target[1]*=0.85;}
   let maturity=self.regulation[i];
   let target_radius=(0.07+0.20*maturity)*(0.8+0.4*genome[(i+3)%8]);
   let index=if let Some(k)=self.nodes.iter().position(|n|n.organ==i){k}else{
    let k=self.nodes.len();let pos=self.nodes[parent].pos;self.nodes.push(Node{id:k,parent,organ:i,pos,radius:0.025,exterior:exterior[i],maturity:0.});k};
   let n=&mut self.nodes[index];
   let spread=0.55+0.85*maturity;
   for j in 0..3{let q=target[j]*spread;n.pos[j]+=0.035*(q-n.pos[j]);}
   n.radius+=0.035*(target_radius-n.radius);n.maturity=maturity;
   if [2,3,5,8,11].contains(&i)&&maturity>0.22 {
    // One paired/branching daughter per eligible organ; inherited asymmetry is bounded.
    let branch_id=12+i;
    let k=if let Some(k)=self.nodes.iter().position(|n|n.id!=0&&n.organ==i&&n.parent==index){k}else{
     let k=self.nodes.len();let pos=self.nodes[index].pos;
     self.nodes.push(Node{id:k,parent:index,organ:i,pos,radius:0.025,exterior:true,maturity:0.});k};
    let root=self.nodes[index].pos;let child=&mut self.nodes[k];
    let dir=if i==5||i==11{-1.}else{1.};
    let q=[dir*target[0].abs().max(0.12)*(1.2+genome[branch_id%8]*0.5),target[1]*1.35,target[2]*1.2];
    for j in 0..3{let goal=(root[j]*0.3+q[j]*0.7)*spread;child.pos[j]+=0.035*(goal-child.pos[j]);}
    child.radius+=0.035*(target_radius*0.68-child.radius);child.maturity=maturity;
   }
  }
 }
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test]fn graph_is_anchored_and_bounded(){for w in 0..6{let mut m=Morphology::new();let mut signal=vec![0.;CELLS];signal[72]=1.;for t in 0..600{m.step(w,&[0.5;8],&[2.;12],&signal,&[1.;12],0.5,t);assert!(m.valid());}assert!(m.nodes.len()>=15);assert!(m.inhibitor.iter().any(|x|*x>0.01));}}
 #[test]fn development_responds_to_environment(){let mut a=Morphology::new();let mut b=a.clone();for t in 0..400{a.step(1,&[0.5;8],&[2.;12],&[0.2;CELLS],&[1.;12],0.9,t);b.step(3,&[0.5;8],&[2.;12],&[0.2;CELLS],&[1.;12],0.1,t);}assert_ne!(a.nodes,b.nodes);assert_ne!(a.inhibitor,b.inhibitor);}
}
