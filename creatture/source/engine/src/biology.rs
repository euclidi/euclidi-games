use serde::{Serialize,Deserialize};
pub const COUNT:usize=12;
pub const REGION:usize=144;
// Directed developmental prerequisites and bidirectional resource transport edges.
pub const EDGES:[(usize,usize);17]=[(0,1),(0,2),(0,4),(0,9),(1,5),(1,7),(1,10),(2,3),(2,5),(2,6),(4,5),(5,6),(6,10),(6,11),(7,8),(8,3),(9,10)];
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Network{
 pub pools:[f64;COUNT],pub integrity:[f64;COUNT],pub flux:Vec<f64>,
 pub regions:Vec<f64>,pub activation:[f64;6],pub association:[f64;4],
 pub stimulus:f64,pub habituation:f64,pub action:usize
}
impl Network{
 pub fn new()->Self{Self{pools:[0.;COUNT],integrity:[1.;COUNT],flux:vec![0.;EDGES.len()],regions:vec![1.;REGION],activation:[0.;6],association:[0.;4],stimulus:0.,habituation:0.,action:0}}
 pub fn mass(&self)->f64{self.pools.iter().sum()}
 pub fn valid(&self)->bool{
  self.regions.len()==REGION&&self.flux.len()==EDGES.len()&&self.action<6&&
  self.pools.iter().all(|x|x.is_finite()&&*x>=0.)&&
  self.integrity.iter().chain(self.regions.iter()).chain(self.association.iter()).chain([&self.stimulus,&self.habituation]).all(|x|x.is_finite()&&*x>=0.&&*x<=1.)&&
  self.activation.iter().all(|x|x.is_finite()&&x.abs()<=1.)&&self.flux.iter().all(|x|x.is_finite())
 }
 pub fn region_for(i:usize)->usize{let x=2+(i*5)%8;let y=2+(i*3)%8;y*12+x}
 pub fn damage(&mut self,site:usize,amount:f64){
  if !amount.is_finite()||site>=REGION{return;}
  self.regions[site]=(self.regions[site]-amount.clamp(0.,1.)).max(0.);
  let x=site%12;let y=site/12;
  for i in 0..COUNT{let r=Self::region_for(i);let dx=(r%12).abs_diff(x);let dy=(r/12).abs_diff(y);if dx+dy<=2{self.integrity[i]=(self.integrity[i]-amount.clamp(0.,1.)/(1.+(dx+dy)as f64)).max(0.);}}
 }
 pub fn transport(&mut self,organs:&[f64;COUNT],reserve:&mut f64){
  // Primitive body distributes a small basal supply; developed connections increase conductance.
  for i in 0..COUNT{
   let capacity=0.025+organs[i]*0.045;
   let request=(capacity-self.pools[i]).max(0.)*(0.08+0.09*organs[2])*self.integrity[i];
   let moved=request.min(*reserve);*reserve-=moved;self.pools[i]+=moved;
  }
  for (k,(a,b)) in EDGES.iter().copied().enumerate(){
   let conductance=0.018*(0.15+organs[a].min(organs[b]))*self.integrity[a].min(self.integrity[b]);
   let q=(self.pools[a]-self.pools[b])*conductance;
   let flow=q.clamp(-self.pools[b],self.pools[a]);
   self.pools[a]-=flow;self.pools[b]+=flow;self.flux[k]=flow;
  }
 }
 pub fn repair(&mut self,organs:&[f64;COUNT],waste:&mut f64){
  for i in 0..COUNT{let j=Self::region_for(i);let d=(1.-self.integrity[i]).max(1.-self.regions[j]);
   let amount=(d*0.008*(0.2+organs[7])).min(self.pools[i]/0.15);
   self.pools[i]-=amount*0.15;*waste+=amount*0.15;
   self.integrity[i]=(self.integrity[i]+amount).min(1.);self.regions[j]=(self.regions[j]+amount).min(1.);
  }
 }
 pub fn cue(&mut self,strength:f64){if strength.is_finite(){self.stimulus=strength.clamp(0.,1.);}}
 pub fn neural_step(&mut self,genome:&[f64;8],nerves:f64,energy:f64,stress:f64){
  let old=self.activation;let reward=(energy*0.5-stress).clamp(-1.,1.);
  let lr=0.006+genome[4]*0.014;
  let cue=self.stimulus*(1.-self.habituation);
  let input=[1.-energy.min(1.),stress,cue,self.association[0],energy.min(1.),genome[0]];
  for i in 0..6{
   let recurrent=old[(i+5)%6]*(0.12+genome[(i+2)%8]*0.5)-old[(i+3)%6]*0.16;
   let target=(input[i]*(0.4+genome[i])+recurrent-0.25).tanh();
   self.activation[i]=(old[i]+0.25*nerves.min(1.)*(target-old[i])).clamp(-1.,1.);
  }
  if self.stimulus>0.05{
   self.association[0]=(self.association[0]+lr*nerves.min(1.)*self.stimulus*((reward+1.)*0.5-self.association[0])).clamp(0.,1.);
   self.habituation=(self.habituation+0.005*self.stimulus*(1.-stress)).min(1.);
  }else{self.habituation*=0.998;}
  self.stimulus*=0.985;
  let utilities=[self.activation[0],self.activation[1],self.activation[2],self.activation[3],self.activation[4]-0.2,self.activation[5]-0.1];
  self.action=(0..6).max_by(|a,b|utilities[*a].total_cmp(&utilities[*b])).unwrap_or(0);
 }
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test]fn transport_conserves_mass(){let mut n=Network::new();let mut r=2.;for _ in 0..300{n.transport(&[1.;COUNT],&mut r);}assert!((n.mass()+r-2.).abs()<1e-9);assert!(n.valid());}
 #[test]fn damage_and_repair(){let mut n=Network::new();let j=Network::region_for(2);n.damage(j,0.8);assert!(n.integrity[2]<0.3);let mut r=4.;let mut w=0.;for _ in 0..300{n.transport(&[1.;COUNT],&mut r);n.repair(&[1.;COUNT],&mut w);}assert!(n.integrity[2]>0.3);assert!((n.mass()+r+w-4.).abs()<1e-8);}
 #[test]fn conditioning_and_habituation(){let mut n=Network::new();for _ in 0..300{n.cue(0.8);n.neural_step(&[0.5;8],1.,1.,0.);}assert!(n.association[0]>0.4);assert!(n.habituation>0.5);assert!(n.valid());}
}
