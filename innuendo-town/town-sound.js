// Sample-based, gesture-unlocked, quiet environmental mix.
// All audio ships locally; source provenance is in assets/audio/CREDITS.md.
const CUES={click:.20,confirm:.25,error:.16,switch:.17,back:.15,door:.22,coins:.24,step0:.105,step1:.105,step2:.10};
const LOOPS={street:.22,interior:.13,night:.13};
export class TownSound{
 constructor(){this.context=null;this.enabled=false;this.buffers=new Map();this.pending=new Map();this.layers=new Map();this.desired='street';this.lastStep=0;this.stepDistance=0;this.stepIndex=0;this.lastCue=0}
 async load(name){
  if(this.buffers.has(name))return this.buffers.get(name);
  if(this.pending.has(name))return this.pending.get(name);
  const task=(async()=>{try{let r=await fetch(new URL('./assets/audio/'+name+'.ogg',import.meta.url));if(!r.ok)throw Error('Audio '+r.status);let a=await this.context.decodeAudioData(await r.arrayBuffer());this.buffers.set(name,a);return a}catch{return null}finally{this.pending.delete(name)}})();
  this.pending.set(name,task);return task;
 }
 async enable(on){
  this.enabled=on;
  if(!on){if(this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.07);return}
  try{if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination)}
   await this.context.resume();if(!this.enabled)return;
   this.master.gain.setTargetAtTime(.8,this.context.currentTime,.08);
   for(const name of Object.keys(CUES))this.load(name);
   await this.ambience(this.desired);
  }catch{this.enabled=false}
 }
 async ambience(name){
  this.desired=name;if(!this.enabled||!this.context)return;
  const ctx=this.context;
  for(const [key,layer] of this.layers)layer.gain.gain.setTargetAtTime(key===name?LOOPS[name]:0,ctx.currentTime,.32);
  if(this.layers.has(name))return;
  const buf=await this.load(name);if(!buf||!this.enabled||this.layers.has(name))return;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buf;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(this.master);source.start();this.layers.set(name,{source,gain});gain.gain.setTargetAtTime(this.desired===name?LOOPS[name]:0,ctx.currentTime,.35);
 }
 async play(name,variation=0){
  if(!this.enabled||!this.context)return;const ctx=this.context,buf=await this.load(name);if(!buf||!this.enabled)return;
  let source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buf;source.playbackRate.value=1+variation;gain.gain.value=CUES[name]??.18;source.connect(gain);gain.connect(this.master);source.start();
 }
 cue(f=400){if(!this.enabled)return;if(performance.now()-this.lastCue<60)return;this.lastCue=performance.now();this.play(f>=520?'confirm':f<230?'error':'click')}
 walk(distance){
  if(!this.enabled||distance<=0)return;this.stepDistance+=Math.min(distance,4);
  if(this.stepDistance>=11&&performance.now()-this.lastStep>=120){this.stepDistance%=11;this.lastStep=performance.now();this.play('step'+(this.stepIndex++%3),(this.stepIndex%3-1)*.035)}
 }
 info(){return {enabled:this.enabled,context:this.context?.state||'none',decoded:[...this.buffers.keys()],loops:[...this.layers.keys()],desired:this.desired}}
}
