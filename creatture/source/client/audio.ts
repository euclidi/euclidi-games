// Original deterministic synthesized soundscapes. No external samples or music.
const TAU=Math.PI*2;
const score=[
 {root:110,notes:[0,7,12,14,19],rate:1.2,noise:.055,bright:.22},
 {root:55,notes:[0,7,10,12,19],rate:.65,noise:.12,bright:.08},
 {root:82.41,notes:[0,3,7,12,15],rate:.9,noise:.085,bright:.13},
 {root:130.81,notes:[0,4,7,11,16],rate:1.4,noise:.025,bright:.48},
 {root:65.41,notes:[0,5,7,12,17],rate:2.2,noise:.09,bright:.31},
 {root:98,notes:[0,5,7,9,12,17],rate:1.55,noise:.065,bright:.24}
];
function rand(seed:number){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function soundtrack(ctx:AudioContext,world:number){
 const spec=score[world%6],rate=22050,secs=24,n=rate*secs;
 const buf=ctx.createBuffer(2,n,rate),a=buf.getChannelData(0),b=buf.getChannelData(1),rng=rand(7757+world*97);
 const freqs=spec.notes.map(k=>Math.round(spec.root*2**(k/12)*secs)/secs);
 let smooth=0,slow=0;
 for(let i=0;i<n;i++){
  const t=i/rate,phase=TAU*t/secs;const w=rng()*2-1;smooth+=.035*(w-smooth);slow+=.004*(smooth-slow);
  const swell=.65+.35*Math.sin(phase*2+world);
  let left=0,right=0;
  for(let j=0;j<freqs.length;j++){const f=freqs[j],p=TAU*f*t;const g=.075/(1+j*.42)*(.36+.64*Math.pow(.5+.5*Math.cos(phase*(j%3+1)+j*1.7),2));
   const harmonic=Math.sin(p+.21*Math.sin(phase*(j+1)))+spec.bright*.45*Math.sin(2*p+.2*j)+spec.bright*.18*Math.sin(3*p);
   const pan=.5+.36*Math.sin(j*2.4+phase);
   left+=g*harmonic*Math.sqrt(1-pan);right+=g*harmonic*Math.sqrt(pan);
  }
  const pulse=Math.pow(.5+.5*Math.cos(phase*Math.round(spec.rate*secs)),world===4?9:3);
  const texture=spec.noise*(smooth*.7+slow*1.6)*swell;
  const low=.035*Math.sin(TAU*freqs[0]*t*.5)*swell;
  const rhythm=world===4?.028*pulse*Math.sin(TAU*freqs[1]*t):world===3?.018*pulse*Math.sin(TAU*freqs.at(-1)!*t):0;
  a[i]=Math.tanh(left+texture+low+rhythm);b[i]=Math.tanh(right+texture*.85+low-rhythm*.3);
 }
 // Seam smoothing: wrap ends without a discontinuity; retains the authored tonal structure.
 const fade=Math.floor(rate*.09);for(let i=0;i<fade;i++){const x=i/fade,w=.5-.5*Math.cos(Math.PI*x);for(const c of [a,b]){const v=(c[i]+c[n-1-i])*.5;c[i]=v*(1-w)+c[i]*w;c[n-1-i]=v*(1-w)+c[n-1-i]*w;}}
 return buf;
}
export class HabitatAudio{
 ctx:AudioContext|null=null;master:GainNode|null=null;ambience:GainNode|null=null;effects:GainNode|null=null;source:AudioBufferSourceNode|null=null;buffers=new Map<number,AudioBuffer>();world=-1;music=.55;sfx=.7;
 async enable(world:number){
  if(this.ctx){await this.ctx.resume();this.setWorld(world);return;}
  const c=this.ctx=new AudioContext();this.master=c.createGain();this.ambience=c.createGain();this.effects=c.createGain();this.master.gain.value=.7;
  this.ambience.gain.value=this.music;this.effects.gain.value=this.sfx;this.ambience.connect(this.master);this.effects.connect(this.master);this.master.connect(c.destination);
  await c.resume();this.setWorld(world);
 }
 async disable(){const c=this.ctx;if(!c)return;this.ctx=null;this.source=null;this.world=-1;this.buffers.clear();await c.close();}
 setLevels(music:number,sfx:number){this.music=Math.max(0,Math.min(1,music));this.sfx=Math.max(0,Math.min(1,sfx));if(this.ctx){this.ambience?.gain.setTargetAtTime(this.music,this.ctx.currentTime,.04);this.effects?.gain.setTargetAtTime(this.sfx,this.ctx.currentTime,.04);}}
 setWorld(world:number){const c=this.ctx;if(!c||world===this.world||!this.ambience)return;this.world=world;
  let buffer=this.buffers.get(world);if(!buffer){buffer=soundtrack(c,world);this.buffers.set(world,buffer);}
  const old=this.source;const src=c.createBufferSource(),gain=c.createGain();src.buffer=buffer;src.loop=true;src.connect(gain).connect(this.ambience);gain.gain.setValueAtTime(0,c.currentTime);gain.gain.linearRampToValueAtTime(1,c.currentTime+.8);src.start();this.source=src;
  if(old){try{old.stop(c.currentTime+.8);}catch{}}
 }
 event(i:number,world:number,x=0,z=0,effort=.6){
  const c=this.ctx;if(!c||!this.effects)return;
  const spec=score[world%6],dur=.16+effort*.45;const start=c.currentTime;
  const osc=c.createOscillator(),g=c.createGain(),filter=c.createBiquadFilter(),pan=c.createStereoPanner();
  const root=spec.root*2**(spec.notes[i%spec.notes.length]/12)*(i===9?.5:1);
  osc.type=world===4?'triangle':'sine';osc.frequency.setValueAtTime(root*(1.25+effort*.4),start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,root*.73),start+dur);
  filter.type='lowpass';filter.frequency.value=world===1?550:1100+i*70;
  pan.pan.value=Math.max(-.8,Math.min(.8,x/3));
  g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.09*effort/(1+Math.abs(z)*.2),start+.03);g.gain.exponentialRampToValueAtTime(.0001,start+dur);
  osc.connect(filter).connect(g).connect(pan).connect(this.effects);osc.start(start);osc.stop(start+dur+.02);
 }
}
