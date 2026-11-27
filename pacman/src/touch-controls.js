// Four-way arcade control math and local bitmap joystick art.
export const CONTROL_MODES=['pad','joystick','off'];
export function nextControl(mode){return CONTROL_MODES[(CONTROL_MODES.indexOf(mode)+1)%CONTROL_MODES.length]}
export function controlVector(x,y,dead=.12,last=null){if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<dead)return {dir:null,x:0,y:0};let ax=Math.abs(x),ay=Math.abs(y),dir=ax>=ay?(x>0?3:1):(y>0?2:0);if(last!==null&&Math.abs(ax-ay)<.055){if((last===1&&x<0)||(last===3&&x>0)||(last===0&&y<0)||(last===2&&y>0))dir=last}let mag=Math.min(1,Math.hypot(x,y)/.40);return {dir,x:[0,-1,0,1][dir]*mag,y:[-1,0,1,0][dir]*mag}}
export function drawStick(c,dx=0,dy=0,active=null){
 const W=112,H=112;c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;
 const px=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 // Top-down arcade gate: circular steel bezel, rubber boot, four inlaid indexes.
 const cx=56,cy=56;
 for(let y=12;y<100;y++)for(let x=12;x<100;x++){
  const xx=x-cx+.5,yy=y-cy+.5,r=Math.hypot(xx,yy);if(r>43)continue;
  const top=xx+yy<0;
  let col=r>41?'#121318':r>39?(top?'#737982':'#343840'):r>36?(top?'#474d56':'#24272d'):r>34?'#0c0e13':r>30?(top?'#2b3038':'#444a53'):r>28?'#15181d':'#20232a';
  px(x,y,1,1,col);
 }
 for(let d=0;d<4;d++){let vx=[0,-1,0,1][d],vy=[-1,0,1,0][d],col=active===d?'#ffe552':'#8c929a';for(let k=0;k<6;k++)for(let j=-1;j<=1;j++)px(cx+vx*(36+k)+vy*j,cy+vy*(36+k)-vx*j,1,1,col)}
 const bx=cx+Math.round(Math.max(-1,Math.min(1,dx))*14),by=cy+Math.round(Math.max(-1,Math.min(1,dy))*14);
 // Contact shadow and moving handle, without the old oversized cabinet plate.
 for(let y=cy-29;y<=cy+29;y++)for(let x=cx-29;x<=cx+29;x++){
  const a=Math.hypot(x-bx-2,y-by-3),b=Math.hypot(x-cx,y-cy);
  if(b<29&&a<22)px(x,y,1,1,a<19?'#08090b':'#111318');
 }
 for(let y=-19;y<=19;y++)for(let x=-19;x<=19;x++){
  const r=Math.hypot(x+.5,y+.5);if(r>19)continue;
  const h=Math.sqrt(Math.max(0,1-(r/19)**2)),light=(-x*.38-y*.54)/19+h*.65;
  let col=r>18?'#440a12':light<.03?'#76111a':light<.28?'#a91a25':light<.52?'#ce2430':light<.76?'#ed3b43':'#fa5356';
  if((x+7)**2/25+(y+9)**2/9<1)col='#ff9c93';
  if((x+8)**2/7+(y+10)**2/3<1)col='#ffd0b6';
  px(bx+x,by+y,1,1,col);
 }
}
