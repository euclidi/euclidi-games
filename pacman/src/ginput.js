// Browser gamepad input layer, including nonstandard / legacy controller fallback.
export function choosePad(pads,slot='auto'){const all=Array.from(pads||[]).filter(p=>p&&p.connected!==false);return slot==='auto'?all[0]||null:all.find(p=>p.index===Number(slot))||null}
const pressed=(p,i)=>!!(p.buttons?.[i]?.pressed||(p.buttons?.[i]?.value??0)>.5);
export function padState(p,options={}){
 if(!p)return {dir:null,ok:false,back:false,start:false,menu:false,prev:false,next:false};
 const raw=options.mapping==='legacy'||(options.mapping!=='standard'&&p.mapping!=='standard');
 const dz={low:.22,normal:.38,high:.55}[options.deadzone]??.38;
 const x=Number(p.axes?.[0])||0,y=Number(p.axes?.[1])||0;
 let dir=null;
 for(let [b,d] of [[12,0],[14,1],[13,2],[15,3]])if(pressed(p,b))dir=d;
 // Legacy controllers often expose their POV hat as axis 9 (eight discrete positions).
 if(dir===null&&raw&&p.axes?.length>=10){let hat=p.axes[9];if(Number.isFinite(hat)&&hat>=-1.01&&hat<=1.01){let k=Math.round((hat+1)*3.5);if(Math.abs(hat-(k/3.5-1))<.045)dir=[0,0,3,2,2,2,1,0][k]??null}}
 if(dir===null&&Math.max(Math.abs(x),Math.abs(y))>=dz)dir=Math.abs(x)>Math.abs(y)?x>0?3:1:y>0?2:0;
 return {dir,ok:pressed(p,raw?1:0),back:pressed(p,raw?2:1),start:pressed(p,9),menu:pressed(p,8),prev:pressed(p,4),next:pressed(p,5)};
}
export function createGInput(){let before={},last=null,repeatAt=0,device=null;
 return {poll(p,options,now){const state=padState(p,options);let id=p?String(p.index)+':'+p.id:null;if(id!==device){before={};last=null;repeatAt=0;device=id}let edge={};for(let k of ['ok','back','start','menu','prev','next'])edge[k]=state[k]&&!before[k];let nav=null;if(state.dir!==null){if(last!==state.dir){nav=state.dir;repeatAt=now+300}else if(now>=repeatAt){nav=state.dir;repeatAt=now+105}}last=state.dir;before=state;return {...state,edge,nav}},reset(){before={};last=null;repeatAt=0;device=null}}
}
export function vibratePad(p,event,enabled=true){if(!p||!enabled)return false;let v=p.vibrationActuator||p.hapticActuators?.[0];if(!v)return false;const duration=event==='death'?380:event==='power'?120:75,strong=event==='death'?.85:.32,weak=event==='death'?.55:.6;try{let result=v.playEffect?v.playEffect('dual-rumble',{duration,strongMagnitude:strong,weakMagnitude:weak}):v.pulse?.(strong,duration);if(!result)return false;Promise.resolve(result).catch(()=>{});return true}catch{return false}}
