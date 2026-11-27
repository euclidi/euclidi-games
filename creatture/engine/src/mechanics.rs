use serde::{Serialize,Deserialize};
type V=[f64;3];
const K:usize=6;
const DT:f64=1./120.;
fn add(a:V,b:V)->V{[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
fn sub(a:V,b:V)->V{[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
fn mul(a:V,b:f64)->V{[a[0]*b,a[1]*b,a[2]*b]}
fn dot(a:V,b:V)->f64{a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
fn cross(a:V,b:V)->V{[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
fn length(a:V)->f64{dot(a,a).sqrt()}
fn clamp_len(a:V,cap:f64)->V{let l=length(a);if l>cap{mul(a,cap/l)}else{a}}
fn solve_distance(a:&mut V,b:&mut V,w1:f64,w2:f64,rest:f64,compliance:f64,lambda:&mut f64)->V{
 let d=sub(*b,*a);let l=length(d);if l<1e-9{return [0.;3];}
 let n=mul(d,1./l);let alpha=compliance/(DT*DT);
 let dl=(-(l-rest)-alpha* *lambda)/(w1+w2+alpha);
 *lambda+=dl;let g=mul(n,-dl);
 *a=add(*a,mul(g,w1));*b=sub(*b,mul(g,w2));g
}
fn volume(p:&[V;4])->f64{dot(sub(p[1],p[0]),cross(sub(p[2],p[0]),sub(p[3],p[0])))/6.}
fn solve_volume(p:&mut [V;4],rest:f64,lambda:&mut f64){
 let u=sub(p[1],p[0]);let v=sub(p[2],p[0]);let w=sub(p[3],p[0]);
 let g1=mul(cross(v,w),1./6.);let g2=mul(cross(w,u),1./6.);let g3=mul(cross(u,v),1./6.);let g0=mul(add(add(g1,g2),g3),-1.);
 let g=[g0,g1,g2,g3];let alpha=0.0000001/(DT*DT);let sum=g.iter().map(|v|dot(*v,*v)).sum::<f64>()+alpha;
 if sum<1e-12{return;}
 let dl=(-(volume(p)-rest)-alpha* *lambda)/sum;*lambda+=dl;
 for i in 0..4{p[i]=add(p[i],mul(g[i],dl));}
}
#[derive(Clone,Serialize,Deserialize,Debug,PartialEq)]
pub struct Mechanics{
 pub limbs:[[V;K];2],previous:[[V;K];2],pub enabled:bool,pub contacts:[bool;2],pub strain:f64,pub volume_ratio:f64,
 pub phase:f64
}
impl Mechanics{
 pub fn new()->Self{Self{limbs:[[[0.;3];K];2],previous:[[[0.;3];K];2],enabled:false,contacts:[false;2],strain:0.,volume_ratio:1.,phase:0.}}
 pub fn valid(&self)->bool{self.limbs.iter().flatten().flatten().chain(self.previous.iter().flatten().flatten()).all(|x|x.is_finite()&&x.abs()<100.)&&self.strain.is_finite()&&self.volume_ratio.is_finite()&&self.phase.is_finite()}
 pub fn step(&mut self,body:V,muscle:f64,energy:f64,water:f64,drive:f64)->V{
  if muscle<0.06{self.enabled=false;self.contacts=[false;2];return [0.;3];}
  let len=0.11+0.07*muscle.min(3.);
  if !self.enabled{for s in 0..2{let sign=if s==0{-1.}else{1.};for i in 0..K{let p=add(body,[sign*(0.27+i as f64*len*0.6),-0.08-i as f64*len*0.6,0.]);self.limbs[s][i]=p;self.previous[s][i]=p;}}self.enabled=true;}
  self.phase=(self.phase+DT*(3.+drive.abs()*4.))%std::f64::consts::TAU;
  let mut reaction=[0.;3];self.strain=0.;
  for s in 0..2{
   let sign=if s==0{-1.}else{1.};
   let anchor=add(body,[sign*0.27,-0.08,0.]);
   let cycle=self.phase+s as f64*std::f64::consts::PI;
   let activity=energy.clamp(0.,1.)*muscle.min(1.);
   let p=&mut self.limbs[s];let prev=&mut self.previous[s];
   let old=*p;p[0]=anchor;prev[0]=anchor;
   for i in 1..K{
    let vel=mul(sub(old[i],prev[i]),0.985-water*0.07);
    let f=[0.,-9.81*(1.-water*0.9),cycle.cos()*activity*2.5*(i as f64/(K-1)as f64)];
    p[i]=add(add(old[i],vel),mul(f,DT*DT));prev[i]=old[i];
   }
   let mut stretch=[0.;K-1];let mut bend=[0.;K-2];let mut grounded=false;let mut anchor_impulse=[0.;3];
   for _ in 0..7{
    p[0]=anchor;
    for i in 0..K-1{
     let target=len*(1.-activity*0.19*(cycle+i as f64*0.62).sin());
     let (left,right)=p.split_at_mut(i+1);
     let g=solve_distance(&mut left[i],&mut right[0],if i==0{0.}else{1.},1.,target,0.000012,&mut stretch[i]);
     if i==0{anchor_impulse=add(anchor_impulse,g);}
    }
    for i in 0..K-2{
     let (left,right)=p.split_at_mut(i+2);
     let g=solve_distance(&mut left[i],&mut right[0],if i==0{0.}else{1.},1.,len*1.78,0.00018,&mut bend[i]);
     if i==0{anchor_impulse=add(anchor_impulse,g);}
    }
    for i in 1..K{if p[i][1]<0.045{
     grounded=true;p[i][1]=0.045;
     // Position-level Coulomb-inspired tangential damping, bounded by penetration correction.
     let dx=p[i][0]-old[i][0];let dz=p[i][2]-old[i][2];
     let friction=0.22*(1.-0.8*water);
     p[i][0]-=dx*friction;p[i][2]-=dz*friction;
    }}
   }
   self.contacts[s]=grounded;
   for i in 0..K-1{self.strain=self.strain.max(((length(sub(p[i+1],p[i]))-len)/len).abs());}
   // Fixed anchor reaction transferred to the Rapier body; normalized segment mass 0.008.
   reaction=add(reaction,clamp_len(mul(anchor_impulse,0.008/(DT*DT)),2.8));
  }
  // Local tetrahedral tissue test volume follows an active deformation and XPBD correction.
  let mut tetra=[[0.,0.,0.],[0.3,0.,0.],[0.,0.3,0.],[0.,0.,0.3]];
  let rest=volume(&tetra);tetra[3][2]*=1.-0.18*energy.clamp(0.,1.)*self.phase.sin();
  let mut lambda=0.;for _ in 0..6{solve_volume(&mut tetra,rest,&mut lambda);}
  self.volume_ratio=volume(&tetra)/rest;
  reaction
 }
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test]fn distance_constraint_reduces_error(){let mut a=[0.,0.,0.];let mut b=[2.,0.,0.];let mut l=0.;solve_distance(&mut a,&mut b,0.,1.,1.,0.,&mut l);assert!((length(b)-1.).abs()<1e-9);}
 #[test]fn volume_constraint_preserves_volume(){let mut p=[[0.,0.,0.],[0.3,0.,0.],[0.,0.3,0.],[0.,0.,0.3]];let r=volume(&p);p[3][2]*=0.7;let mut l=0.;for _ in 0..12{solve_volume(&mut p,r,&mut l);}assert!((volume(&p)/r-1.).abs()<0.05);}
 #[test]fn stable_appendage_contact(){let mut m=Mechanics::new();for _ in 0..720{let f=m.step([0.,0.53,0.],2.,0.7,0.1,0.2);assert!(f.iter().all(|x|x.is_finite()));assert!(m.valid());}assert!(m.contacts.iter().any(|x|*x));assert!(m.strain<1.5);}
}
