use serde::{Serialize,Deserialize};
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Organism{pub id:u32,pub parents:Vec<u32>,pub genome:[f64;8],pub generation:u32,pub biomass:f64,pub reserve:f64,pub position:[f64;2],pub age:u64,pub relation:u8,pub activity:f64}
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Ecology{pub inhabitants:Vec<Organism>,pub rng:u32,pub interactions:u64,pub births:u64,pub deaths:u64,pub recycled:f64,pub charge:f64}
fn rand(s:&mut u32)->f64{*s=s.wrapping_mul(1664525).wrapping_add(1013904223);*s as f64/4294967296.}
impl Ecology{
 pub fn new(seed:u32)->Self{Self{inhabitants:vec![],rng:seed^0xB4C27611,interactions:0,births:0,deaths:0,recycled:0.,charge:0.}}
 pub fn mass(&self)->f64{self.inhabitants.iter().map(|o|o.biomass+o.reserve).sum()}
 pub fn valid(&self)->bool{self.inhabitants.len()<=16&&self.inhabitants.iter().all(|o|o.biomass.is_finite()&&o.biomass>=0.&&o.reserve.is_finite()&&o.reserve>=0.&&o.genome.iter().all(|g|g.is_finite()&&*g>=0.&&*g<=1.)&&o.position.iter().all(|p|p.is_finite()&&p.abs()<=3.)&&o.activity.is_finite()&&o.activity>=0.&&o.activity<=1.&&o.relation<3)&&self.charge.is_finite()&&self.charge>=0.&&self.charge<=1.&&self.recycled.is_finite()&&self.recycled>=0.}
 pub fn spawn(&mut self,genome:[f64;8],parents:Vec<u32>,generation:u32,reserve:&mut f64,relation:u8)->bool{
  if self.inhabitants.len()>=16||*reserve<0.28{return false;}
  *reserve-=0.28;let mut g=genome;
  for v in &mut g{*v=(*v+(rand(&mut self.rng)-0.5)*0.07).clamp(0.,1.);}
  let id=self.rng;let phase=rand(&mut self.rng)*std::f64::consts::TAU;
  self.inhabitants.push(Organism{id,parents,genome:g,generation,biomass:0.16,reserve:0.12,position:[phase.cos()*1.2,phase.sin()*1.2],age:0,relation:relation.min(2),activity:0.});self.births+=1;true
 }
 pub fn step(&mut self,world:usize,water:f64,light:f64,temperature:f64,organs:&[f64;12],nutrient:&mut f64,reserve:&mut f64,waste:&mut f64,root_pos:[f64;3]){
  // World-specific extensions to the normalized resource ledger.
  if world==2||world==5{let q=(*waste).min((0.0004+0.003*organs[7])*(0.5+water));*waste-=q;*nutrient+=q;self.recycled+=q;}
  if world==4{self.charge=(self.charge+0.002*light*organs[4]-0.0008*organs[5]).clamp(0.,1.);}
  let mut births=vec![];
  for o in &mut self.inhabitants{
   o.age+=1;let stress=(temperature-o.genome[1]).abs();let demand=(0.001+0.004*o.genome[2])*(1.-0.5*stress);
   let intake=(*nutrient).min(demand);*nutrient-=intake;o.reserve+=intake;
   let dx=root_pos[0]-o.position[0];let dz=root_pos[2]-o.position[1];let dist=(dx*dx+dz*dz).sqrt().max(1e-8);
   o.activity=(o.reserve*2.).clamp(0.,1.)*(1.-stress);
   let speed=0.012*o.activity;let angle=o.age as f64*0.019+o.genome[0]*6.;
   let attraction=if o.relation==0{0.5}else if o.relation==1{0.7}else{-0.2};
   o.position[0]=(o.position[0]+speed*(attraction*dx/dist+angle.sin()*0.5)).clamp(-2.6,2.6);
   o.position[1]=(o.position[1]+speed*(attraction*dz/dist+angle.cos()*0.5)).clamp(-2.6,2.6);
   if dist<1.4{
    if o.relation==0&&o.reserve>0.12{let q=(o.reserve-0.12).min(0.0015);o.reserve-=q;*reserve+=q;self.interactions+=1;}
    if o.relation==1&&*reserve>0.02{let q=(*reserve).min(0.0012);*reserve-=q;o.reserve+=q;self.interactions+=1;}
   }
   let grow=(o.reserve*0.018).min(0.002)*(1.-stress);o.reserve-=grow;o.biomass+=grow;
   let cost=(0.0008+o.biomass*0.002)*(0.8+stress+o.activity*0.2);
   let use_energy=o.reserve.min(cost);o.reserve-=use_energy;*waste+=use_energy;
   if use_energy<cost{let loss=o.biomass.min(cost-use_energy);o.biomass-=loss;*waste+=loss;}
   if o.age>240&&o.reserve>0.55&&o.biomass>0.28&&o.age%180==0{births.push((o.id,o.genome,o.generation,o.relation));}
  }
  for (id,g,gen,rel) in births{if self.inhabitants.len()>=16{break;}if let Some(i)=self.inhabitants.iter().position(|o|o.id==id){let mut energy=self.inhabitants[i].reserve;if self.spawn(g,vec![id],gen+1,&mut energy,rel){self.inhabitants[i].reserve=energy;}}}
  let before=self.inhabitants.len();self.inhabitants.retain(|o|{if o.biomass<0.02{*waste+=o.biomass+o.reserve;false}else{true}});self.deaths+=(before-self.inhabitants.len())as u64;
 }
}
#[cfg(test)]
mod tests{use super::*;
 #[test]fn ecosystem_closed_mass(){let mut e=Ecology::new(5);let mut r=2.;let mut n=2.;let mut w=0.;assert!(e.spawn([0.5;8],vec![3],1,&mut r,0));assert!(e.spawn([0.5;8],vec![3],1,&mut r,1));for _ in 0..2000{e.step(5,0.5,0.5,0.5,&[1.;12],&mut n,&mut r,&mut w,[0.;3]);assert!(e.valid());assert!((n+r+w+e.mass()-4.).abs()<1e-7);}}
 #[test]fn population_cap(){let mut e=Ecology::new(3);let mut r=50.;for _ in 0..30{e.spawn([0.5;8],vec![1],1,&mut r,0);}assert_eq!(e.inhabitants.len(),16);assert!(e.valid());}
}
