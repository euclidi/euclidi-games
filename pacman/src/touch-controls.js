// Four-way arcade control math and local bitmap joystick art.
export const CONTROL_MODES=['pad','joystick','off'];
export function nextControl(mode){return CONTROL_MODES[(CONTROL_MODES.indexOf(mode)+1)%CONTROL_MODES.length]}
export function controlVector(x,y,dead=.12,last=null){if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<dead)return {dir:null,x:0,y:0};let ax=Math.abs(x),ay=Math.abs(y),dir=ax>=ay?(x>0?3:1):(y>0?2:0);if(last!==null&&Math.abs(ax-ay)<.055){if((last===1&&x<0)||(last===3&&x>0)||(last===0&&y<0)||(last===2&&y>0))dir=last}let mag=Math.min(1,Math.hypot(x,y)/.40);return {dir,x:[0,-1,0,1][dir]*mag,y:[-1,0,1,0][dir]*mag}}
export function drawStick(c,dx=0,dy=0,active=null){
 const W=112,H=112; c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 rect(8,12,96,88,'#080808');rect(4,16,104,80,'#080808');rect(8,14,96,82,'#35373b');rect(6,18,100,74,'#35373b');rect(9,18,94,73,'#191a1b');rect(11,17,90,1,'#67696d');rect(8,20,1,68,'#4a4b4c');rect(12,91,88,2,'#090a0a');
 for(let [x,y] of [[14,24],[97,24],[14,85],[97,85]]){rect(x-2,y-2,5,5,'#0a0a0b');rect(x-1,y-2,3,4,'#7b7e80');rect(x-1,y,3,1,'#292b2b')}
 for(let y=29;y<85;y++)for(let x=28;x<84;x++){let r=Math.hypot(x-55.5,(y-60)*1.12);if(r<27){let color=r>25?'#090909':r>23?(y<60?'#5d5d60':'#27272a'):r>19?'#101113':r>17?'#383a3c':'#0a0b0c';rect(x,y,1,1,color)}}
 for(let d=0;d<4;d++){let vx=[0,-1,0,1][d],vy=[-1,0,1,0][d],cx=56+vx*37,cy=60+vy*30,col=active===d?'#ffff00':'#707276';for(let j=0;j<4;j++)for(let i=-j;i<=j;i++)rect(cx-vx*j+vy*i,cy-vy*j-vx*i,1,1,col)}
 let bx=56+Math.round(dx*17),by=44+Math.round(dy*14);
 for(let t=0;t<=24;t++){let u=t/24,x=56+(bx-56)*u,y=60+(by-60)*u;rect(x-4,y,9,2,'#0a0a0b');rect(x-2,y,5,2,'#898c8e');rect(x-2,y,2,2,'#c1c4c5');rect(x+2,y,2,2,'#45484a')}
 for(let y=-17;y<=17;y++)for(let x=-17;x<=17;x++){let r=x*x+y*y;if(r>17*17)continue;let lit=(-x*.56-y*.83)/17,edge=Math.sqrt(r)/17;let col=edge>.96?'#39090b':lit<-.43?'#64090d':lit<-.10?'#9c1018':lit<.28?'#cc1823':lit<.65?'#ed3038':'#ff5050';if((x+6)**2+(y+7)**2<13)col='#ff9a8d';if((x+7)**2+(y+8)**2<4)col='#ffd6bd';rect(bx+x,by+y,1,1,col)}
}
