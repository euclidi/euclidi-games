use serde::{Serialize,Deserialize};
#[derive(Clone,Serialize,Deserialize,Debug)]
pub struct Ending{pub title:String,pub description:String,pub secret:bool,pub palette:usize}
#[derive(Clone,Serialize,Deserialize)]
pub struct Branch{pub focus:usize,pub first:usize,pub second:usize,pub ends:[Ending;2]}
#[derive(Clone,Serialize,Deserialize)]
pub struct Package{pub name:String,pub branches:Vec<Branch>}
pub fn package(id:usize)->Package{
 let json=match id{0=>include_str!("../../worlds/primordium.json"),1=>include_str!("../../worlds/abyss.json"),2=>include_str!("../../worlds/mycelium.json"),3=>include_str!("../../worlds/silica.json"),4=>include_str!("../../worlds/prosthesis.json"),_=>include_str!("../../worlds/communion.json")};
 serde_json::from_str(json).expect("bundled world package")
}
pub fn resolve(id:usize,history:&[usize],organs:&[f64;12])->Option<Ending>{
 let pos=|i:usize|history.iter().position(|x|*x==i).unwrap_or(usize::MAX);
 if (0..12).any(|i|pos(i)==usize::MAX){return None;}
 let world=package(id);
 let b=world.branches.iter().min_by_key(|b|pos(b.focus))?;
 let branch=if pos(b.first)<pos(b.second){0}else{1};
 let companion=if branch==0{b.first}else{b.second};
 if organs[b.focus]<0.01||organs[companion]<0.01{return None;}
 Some(b.ends[branch].clone())
}
pub fn candidate_orders(id:usize)->Vec<(String,Vec<usize>)>{
 let p=package(id);let mut routes=vec![];
 for b in p.branches{for j in 0..2{
  let preferred=if j==0{b.first}else{b.second};
  let mut order=vec![b.focus,preferred];order.dedup();
  for i in 0..12{if !order.contains(&i){order.push(i);}}
  routes.push((b.ends[j].title.clone(),order));
 }}
 routes
}
