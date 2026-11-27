use serde::{Serialize,Deserialize};
use wasm_bindgen::prelude::*;
use rapier3d::prelude::*;
const N:usize=12;
const SIDE:usize=12;
const TISSUE:usize=SIDE*SIDE;
const MAX:f64=3.0;
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
struct World { name:String, water:f64, temperature:f64, light:f64, mineral:f64, diffusion:f64 }
fn world(id:usize)->World {
 let values=[("Primordium",0.35,0.5,0.65,0.3,0.12),("Abyss",1.,0.24,0.08,0.45,0.18),("Mycelium",0.7,0.45,0.2,0.3,0.22),("Silica",0.12,0.78,0.8,1.,0.07),("Prosthesis",0.22,0.58,0.4,0.85,0.08),("Communion",0.52,0.52,0.7,0.5,0.16)];
 let (n,w,t,l,m,d)=values[id.min(5)];
 World{name:n.into(),water:w,temperature:t,light:l,mineral:m,diffusion:d}
}
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
struct Specimen {
 version:u32, world_id:usize, environment:World, seed:u32, genome:[f64;8], organs:[f64;N], used:[bool;N], history:Vec<usize>, available:[f64;N], tissue:Vec<f64>, nutrient:f64, reserve:f64, biomass:f64,waste:f64, input_mass:f64, hydration:f64, stress:f64, learned:f64, neural:f64, generation:u32, parents:Vec<u32>, turn:u32, tick:u64, outcome:String, position:[f64;3], velocity:[f64;3]
}
fn rng(s:&mut u32)->f64{*s=s.wrapping_mul(1664525).wrapping_add(1013904223);*s as f64/4294967296.}
fn bounded(x:f64)->f64{x.clamp(0.,1.)}
impl Specimen {
 fn new(id:usize,mut seed:u32)->Self{
  let original=seed; let mut genome=[0.;8];for x in &mut genome{*x=0.25+rng(&mut seed)*0.5;}
  let env=world(id);
  Self{version:1,world_id:id.min(5),environment:env,seed:original,genome,organs:[0.;N],used:[false;N],history:vec![],available:[0.;N],tissue:vec![0.;TISSUE],nutrient:2.,reserve:0.4,biomass:1.,waste:0.,input_mass:3.4,hydration:0.5,stress:0.,learned:0.,neural:0.,generation:0,parents:vec![],turn:0,tick:0,outcome:String::new(),position:[0.,0.7,0.],velocity:[0.;3]}
 }
 fn valid(&self)->bool {
  self.version==1 && self.world_id<6 && self.tissue.len()==TISSUE && self.history.iter().all(|x|*x<N) &&
  self.genome.iter().all(|v|v.is_finite()&&*v>=0.&&*v<=1.) &&
  self.organs.iter().all(|v|v.is_finite()&&*v>=0.&&*v<=MAX) &&
  self.available.iter().all(|v|v.is_finite()&&*v>=0.&&*v<=8.) &&
  self.tissue.iter().all(|v|v.is_finite()&&*v>=0.&&*v<=1.) &&
  [self.nutrient,self.reserve,self.biomass,self.waste,self.input_mass].iter().all(|x|x.is_finite()&&*x>=0.) &&
  (self.nutrient+self.reserve+self.biomass+self.waste-self.input_mass).abs()<1e-6 &&
  [self.hydration,self.stress,self.learned,self.environment.water,self.environment.temperature,self.environment.light,self.environment.mineral,self.environment.diffusion].iter().all(|x|x.is_finite()&&*x>=0.&&*x<=1.) &&
  self.position.iter().chain(self.velocity.iter()).all(|x|x.is_finite()&&x.abs()<100.)
 }
 fn introduce(&mut self,i:usize,dose:f64,site:usize,puzzle:bool)->bool{
  if i>=N || !dose.is_finite() || (puzzle && self.used[i]) {return false;}
  let amount=dose.clamp(0.25,2.);
  self.used[i]=true;self.history.push(i);self.turn+=1;
  self.available[i]=(self.available[i]+amount).min(8.);
  self.nutrient+=amount*0.7;self.input_mass+=amount*0.7;
  let j=site.min(TISSUE-1);self.tissue[j]=bounded(self.tissue[j]+amount*0.2);
  if i==2{self.hydration=bounded(self.hydration+0.12*amount);}
  if i==9{self.environment.temperature=bounded(self.environment.temperature+0.08*amount);}
  if i==3{self.environment.light=bounded(self.environment.light+0.09*amount);}
  if i==4{self.environment.mineral=bounded(self.environment.mineral+0.08*amount);}
  if i==11{self.learned=bounded(self.learned+0.03*self.organs[6]);}
  for _ in 0..40{self.bio_step();}
  self.classify();true
 }
 fn bio_step(&mut self){
  self.tick+=1;
  let a=self.organs;
  let env=&self.environment;
  self.hydration=bounded(self.hydration+(env.water-self.hydration)*0.01);
  let target_stress=bounded((env.temperature-self.genome[1]).abs()*0.7+(1.-self.hydration)*0.2-0.04*a[0]);
  self.stress=bounded(self.stress+(target_stress-self.stress)*0.025);
  // Directed prerequisites; earlier elements enjoy more development time, but require connected functions.
  let supports=[1.,0.5+0.15*a[0],0.55+0.15*a[0],0.35+env.light*0.5,0.25+env.mineral*0.5+0.12*a[0],0.12+0.25*a[1]+0.14*a[4],0.1+0.24*a[5]+0.1*a[2],0.25+0.18*a[1],0.2+0.15*a[7]+env.water*0.25,0.45+0.12*a[0],0.3+0.08*a[6],0.15+0.3*a[6]];
  let intake=self.nutrient.min(0.025*(0.3+a[1]+a[7]*0.3));
  self.nutrient-=intake;self.reserve+=intake;
  for i in 0..N{
   if self.available[i]>0. && self.organs[i]<MAX {
    let desired=0.013*self.available[i].min(2.)*supports[i]*(0.5+self.genome[i%8])*(1.-self.stress*0.5);
    let delta=desired.min(MAX-self.organs[i]).min(self.reserve/0.14);
    self.organs[i]+=delta;self.reserve-=delta*0.14;self.biomass+=delta*0.14;
   }
  }
  let spend=self.reserve.min(0.002+0.001*a.iter().sum::<f64>()+0.002*self.stress);
  self.reserve-=spend;self.waste+=spend;
  // Bounded regional field with no-flux edges. This is a signal field, not conserved nutrient mass.
  if self.tick%4==0{
   let old=self.tissue.clone();
   let d=env.diffusion.min(0.24);
   for y in 0..SIDE {for x in 0..SIDE{
    let j=y*SIDE+x;let p=old[j];
    let lap=old[y*SIDE+x.saturating_sub(1)]+old[y*SIDE+(x+1).min(SIDE-1)]+old[y.saturating_sub(1)*SIDE+x]+old[(y+1).min(SIDE-1)*SIDE+x]-4.*p;
    let source=if j==TISSUE/2+SIDE/2 {0.008*self.organs[8]}else{0.};
    self.tissue[j]=bounded(p+d*lap+source-0.004*p);
   }}
  }
  let reward=bounded(self.reserve*0.4-self.stress);
  self.learned=bounded(self.learned+0.012*self.organs[6]*(reward-self.learned));
  self.neural=(0.52*self.neural+0.45*self.learned+0.2*self.genome[4]-0.3*self.stress).tanh();
 }
 fn classify(&mut self){
  if self.turn<12 {self.outcome.clear();return;}
  let a=self.organs;
  self.outcome=match self.world_id{
   0=>if a[5]+a[6]>3.2{"Ambulatory symbiont"}else{"Quiet membrane"},
   1=>if a[2]+a[11]>3.2{"Pelagic resonator"}else{"Benthic refuge"},
   2=>if a[7]+a[8]>3.2{"Spore network"}else{"Dormant colony"},
   3=>if a[4]+a[9]>3.2{"Thermal lattice"}else{"Mineral husk"},
   4=>if a[4]+a[6]+a[11]>4.7{"Electroactive host"}else{"Isolated conductor"},
   _=>if a[7]+a[6]>3.2{"Social symbiont"}else{"Solitary survivor"}
  }.into();
 }
}
struct ContactWorld{
 pipeline:PhysicsPipeline,islands:IslandManager,broad:BroadPhaseMultiSap,narrow:NarrowPhase,bodies:RigidBodySet,colliders:ColliderSet,joints:ImpulseJointSet,multibody:MultibodyJointSet,ccd:CCDSolver,body:RigidBodyHandle
}
impl ContactWorld{
 fn new(p:[f64;3],v:[f64;3])->Self{
  let mut bodies=RigidBodySet::new();let mut colliders=ColliderSet::new();
  colliders.insert(ColliderBuilder::cuboid(8.,0.2,8.).translation(vector![0.,-0.2,0.]).friction(0.85).build());
  let body=bodies.insert(RigidBodyBuilder::dynamic().translation(vector![p[0] as f32,p[1] as f32,p[2] as f32]).linvel(vector![v[0] as f32,v[1] as f32,v[2] as f32]).linear_damping(1.8).angular_damping(3.).build());
  colliders.insert_with_parent(ColliderBuilder::ball(0.53).density(1.).friction(0.7).build(),body,&mut bodies);
  Self{pipeline:PhysicsPipeline::new(),islands:IslandManager::new(),broad:BroadPhaseMultiSap::new(),narrow:NarrowPhase::new(),bodies,colliders,joints:ImpulseJointSet::new(),multibody:MultibodyJointSet::new(),ccd:CCDSolver::new(),body}
 }
 fn step(&mut self,s:&mut Specimen){
  let b=&mut self.bodies[self.body];
  let p=*b.translation();let v=*b.linvel();
  let water=s.environment.water as f32;let motor=(s.organs[5]*s.reserve.min(1.)*(1.-s.stress)) as f32;
  let phase=(s.tick as f32)*0.19;
  let steer=vector![phase.sin()*motor-p.x*0.12-v.x*0.25,(water*9.0-1.)*b.mass(),phase.cos()*motor-p.z*0.12-v.z*0.25];
  b.reset_forces(false);b.add_force(steer,true);
  let mut ip=IntegrationParameters::default();ip.dt=1./120.;
  self.pipeline.step(&vector![0.,-9.81,0.],&ip,&mut self.islands,&mut self.broad,&mut self.narrow,&mut self.bodies,&mut self.colliders,&mut self.joints,&mut self.multibody,&mut self.ccd,None,&(),&());
  let b=&self.bodies[self.body];let p=b.translation();let v=b.linvel();
  s.position=[p.x as f64,p.y as f64,p.z as f64];s.velocity=[v.x as f64,v.y as f64,v.z as f64];
 }
}
#[wasm_bindgen]
pub struct Engine {state:Specimen,physics:ContactWorld}
#[wasm_bindgen]
impl Engine{
 #[wasm_bindgen(constructor)]
 pub fn new(world_id:usize,seed:u32)->Self{let state=Specimen::new(world_id,seed);let physics=ContactWorld::new(state.position,state.velocity);Self{state,physics}}
 pub fn introduce(&mut self,i:usize,dose:f64,site:usize,puzzle:bool)->bool{self.state.introduce(i,dose,site,puzzle)}
 pub fn advance(&mut self,ticks:u32){for _ in 0..ticks.min(100){self.state.bio_step();for _ in 0..12{self.physics.step(&mut self.state);}}self.state.classify();}
 pub fn environment(&mut self,water:f64,light:f64,temperature:f64){if [water,light,temperature].iter().all(|v|v.is_finite()){self.state.environment.water=bounded(water);self.state.environment.light=bounded(light);self.state.environment.temperature=bounded(temperature);}}
 pub fn snapshot(&self)->String{serde_json::to_string(&self.state).unwrap_or_default()}
 pub fn restore(&mut self,json:&str)->bool{if let Ok(s)=serde_json::from_str::<Specimen>(json){if s.valid(){self.physics=ContactWorld::new(s.position,s.velocity);self.state=s;return true;}}false}
 pub fn transfer(&mut self,id:usize)->bool{if id>=6{return false;}self.state.world_id=id;self.state.environment=world(id);true}
 pub fn breed(&mut self,other:&str,mut seed:u32)->bool{
  if let Ok(p)=serde_json::from_str::<Specimen>(other){if p.valid()&&self.state.reserve>0.1&&p.generation<1000{
   let original=seed;let mut child=Specimen::new(self.state.world_id,original);
   for i in 0..8{child.genome[i]=bounded((self.state.genome[i]+p.genome[i])*0.5+(rng(&mut seed)-0.5)*0.09);}
   child.generation=self.state.generation.max(p.generation)+1;child.parents=vec![self.state.seed,p.seed];
   self.physics=ContactWorld::new(child.position,child.velocity);self.state=child;return true;
  }}false
 }
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test]fn deterministic_and_mass_balance(){for w in 0..6{let mut a=Specimen::new(w,7);let mut b=a.clone();for i in 0..N{assert!(a.introduce(i,1.,72,true));assert!(b.introduce(i,1.,72,true));assert_eq!(a,b);assert!(a.valid());}assert!(!a.introduce(0,1.,0,true));assert!(!a.outcome.is_empty());}}
 #[test]fn order_changes_anatomy(){let mut a=Specimen::new(0,3);let mut b=a.clone();for i in 0..N{a.introduce(i,1.,72,true);b.introduce(N-1-i,1.,72,true);}assert_ne!(a.organs,b.organs);}
 #[test]fn starvation_nonnegative(){let mut a=Specimen::new(0,9);for _ in 0..10000{a.bio_step();}assert!(a.valid());}
 #[test]fn physical_contact_finite(){let mut a=Engine::new(0,3);a.advance(30);assert!(a.state.valid());assert!(a.state.position[1]>0.2);}
}
