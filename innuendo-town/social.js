export function witnessIncident(state,actor,witness,kind){
 if(witness===null||witness===undefined||actor===witness)return null;
 const rumor={id:state.day+':'+state.minute+':'+actor+':'+kind,actor,witness,kind,day:state.day,minute:state.minute,heard:[witness],ttl:180};
 state.rumors=[rumor,...(state.rumors||[])].slice(0,12);return rumor;
}
export function spreadRumors(state,contacts){
 const changed=[];
 for(const r of state.rumors||[]){
  const age=(state.day-r.day)*1440+state.minute-r.minute;
  if(age>r.ttl)continue;
  for(const [a,b] of contacts){if(a===b||a===r.actor||b===r.actor)continue;
   const ah=r.heard.includes(a),bh=r.heard.includes(b);
   if(ah!==bh){let target=ah?b:a;r.heard.push(target);changed.push({rumor:r,target});break}
  }
 }
 return changed;
}
export const rumorText=(r,name)=>r.kind==='collision'?'I heard '+name+' had a rather awkward encounter with a delivery crate.':'I heard '+name+' was making questionable remarks near the shops.';
