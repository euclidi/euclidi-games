
import {rng} from "./levels.js";
// Original raster environment benchmark. Directional foliage clusters, bark grain,
// aerial perspective and irregular rock strata; no repeated glossy sphere trees.
export function woodland(g,W,H){
 const random=rng(0x243581),R=(a,b)=>a+(b-a)*random(),pick=a=>a[Math.floor(random()*a.length)];
 const path=(pts,fill)=>{g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.fillStyle=fill;g.fill()};
 let sky=g.createLinearGradient(0,0,W*.24,H);sky.addColorStop(0,"#859a86");sky.addColorStop(.35,"#a2ae90");sky.addColorStop(.68,"#566b58");sky.addColorStop(1,"#293e33");g.fillStyle=sky;g.fillRect(0,0,W,H);
 for(let layer=0;layer<4;layer++){let y=520+layer*105,pts=[[0,H]];for(let x=-40;x<W+50;x+=20)pts.push([x,y+Math.sin(x*.003+layer*1.6)*80+Math.sin(x*.012+layer)*19+R(-8,8)]);pts.push([W,H]);path(pts,["#778a77","#677d69","#4b6655","#394e40"][layer])}
 function leaf(x,y,w,h,a,col){g.save();g.translate(x,y);g.rotate(a);g.fillStyle=col;g.beginPath();g.moveTo(-w,0);g.quadraticCurveTo(0,-h,w,0);g.quadraticCurveTo(0,h*.62,-w,0);g.fill();g.restore()}
 function branch(x,y,len,thick,a,depth,colors,detail){let ex=x+Math.sin(a)*len,ey=y-Math.cos(a)*len,bend=R(-.22,.22),mx=x+(ex-x)*.51+len*bend,my=(y+ey)/2;g.lineCap="round";g.lineJoin="round";g.strokeStyle=colors[0];g.lineWidth=thick;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx,my,ex,ey);g.stroke();if(detail){g.strokeStyle=colors[1];g.lineWidth=Math.max(1,thick*.23);g.beginPath();g.moveTo(x-thick*.18,y);g.quadraticCurveTo(mx-thick*.18,my,ex-thick*.1,ey);g.stroke();if(thick>10)for(let i=0;i<4;i++){let t=R(.15,.9),xx=x+(ex-x)*t,yy=y+(ey-y)*t;g.strokeStyle="#191f1c65";g.lineWidth=R(.7,1.9);g.beginPath();g.moveTo(xx+R(-thick*.25,thick*.25),yy);g.lineTo(xx+R(-thick*.25,thick*.25),yy- R(9,20));g.stroke()}}
 if(depth>0){branch(ex,ey,len*R(.59,.75),thick*.58,a+R(-.65,-.25),depth-1,colors,detail);branch(ex,ey,len*R(.54,.73),thick*.55,a+R(.3,.76),depth-1,colors,detail);if(depth>2)branch(mx,my,len*.54,thick*.46,a+R(-.9,.9),depth-2,colors,detail)}else{let spread=len*1.7;for(let i=0;i<(detail?35:18);i++){let t=R(0,Math.PI*2),d=Math.sqrt(random()),lx=ex+Math.cos(t)*spread*d,ly=ey+Math.sin(t)*spread*.65*d;let size=R(5,12)*(detail?1.2:.8),v=ly<ey?pick(colors.slice(3)):pick(colors.slice(2,5));leaf(lx,ly,size,size*R(.4,.85),R(-2,2),v)}}}
 const distant=["#516b5e","#6d8171","#5a7667","#668572","#7d9780","#91a58b"],near=["#263c2e","#766d4c","#344e31","#4b643b","#6b7d45","#889254"];
 for(let i=0;i<28;i++){let x=i*59+R(-35,35),y=R(770,880),size=R(105,190);branch(x,y,size,size*.11,R(-.2,.2),3,distant,false)}
 // A quiet river gorge separates the two miniature banks.
 path([[528,590],[698,575],[742,680],[721,770],[828,842],[893,960],[1110,H],[400,H],[558,940],[612,823],[565,724]],"#3b5d57");
 path([[588,610],[677,606],[688,690],[674,770],[770,853],[843,963],[986,H],[510,H],[615,951],[660,820],[623,736]],"#76918a");
 for(let i=0;i<250;i++){let y=R(635,H),t=(y-635)/(H-635),x=R(622-t*38,665+t*235),w=R(3,31)*(1+t);g.fillStyle=pick(["#b3c1a42e","#304f4e44","#d5d8bc22","#688c804c"]);g.fillRect(x,y,w,R(.8,2.2))}
 function stone(x,y,w,h){let pts=[[x-w*.52,y],[x-w*.61,y-h*.37],[x-w*.2,y-h],[x+w*.27,y-h*.87],[x+w*.56,y-h*.35],[x+w*.45,y]];path(pts,"#263b32");path([pts[1],pts[2],pts[3],[x+w*.08,y-h*.41]],pick(["#71816b","#7e876c","#63765d"]));path([pts[1],[x+w*.08,y-h*.41],pts[3],pts[4],pts[5]],pick(["#4d6151","#586853","#485b4b"]));g.strokeStyle="#a0a58a70";g.lineWidth=1.5;g.beginPath();g.moveTo(...pts[2]);g.lineTo(...pts[3]);g.stroke();for(let k=0;k<15;k++){g.fillStyle=pick(["#adb28a24","#263e3260","#78835570"]);g.fillRect(x+R(-w*.27,w*.27),y-R(h*.19,h*.56),R(1,4),R(1,3))}}
 for(let i=0;i<75;i++){let x=R(0,W),y=R(886,H);if(x>540&&x<950)continue;stone(x,y,R(30,100),R(13,49))}
 for(let x of [35,167,317,1220,1370,1503]){let y=R(1090,1220),len=R(170,275);branch(x,y,len,len*.14,R(-.18,.18),4,near,true)}
 for(let i=0;i<1800;i++){let x=R(0,W),y=R(985,H);if(x>520&&x<1000)continue;let len=R(3,15),color=pick(["#526747","#7e8656","#a0a66c","#273e31","#455e40"]);g.strokeStyle=color;g.lineWidth=R(.6,1.6);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+R(-3,3),y-len*.6,x+R(-6,6),y-len);g.stroke()}
 // Fine material grain, fixed in world space rather than noisy moving particles.
 for(let i=0;i<23000;i++){let x=R(0,W),y=R(0,H);g.fillStyle=random()<.5?"#141d1510":"#f4e6af0d";g.fillRect(x,y,R(.6,2.6),R(.6,2.2))}
 const haze=g.createRadialGradient(W*.5,H*.41,10,W*.5,H*.41,W*.56);haze.addColorStop(0,"#d1d6b529");haze.addColorStop(.6,"#9ca88a10");haze.addColorStop(1,"#101a1600");g.fillStyle=haze;g.fillRect(0,0,W,H);
}
