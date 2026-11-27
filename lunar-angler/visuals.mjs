import * as T from '../library/vendor/three.module.min.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
const mat=(color,metalness=0,roughness=.6,extra={})=>new T.MeshStandardMaterial({color,metalness,roughness,...extra});
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
function shaft(p,a,b,r,m,r2=r){const v=V(...a),w=V(...b),d=w.clone().sub(v);const o=mesh(p,new T.CylinderGeometry(r2,r,d.length(),24),m);o.position.copy(v).add(w).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function ball(p,m,x,y,z,a,b,c){const o=mesh(p,new T.SphereGeometry(1,24,16),m,x,y,z);o.scale.set(a,b,c);return o;}
function torus(p,r,t,m,x,y,z){return mesh(p,new T.TorusGeometry(r,t,10,64),m,x,y,z);}
function lathe(p,profile,m,x,y,z){return mesh(p,new T.LatheGeometry(profile.map(([a,b])=>new T.Vector2(a,b)),48),m,x,y,z);}
function noiseTex(seed=8){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),im=ctx.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const k=(y*128+x)*4,v=150+Math.sin(y*.7)*16+(seed/4294967296-.5)*45;im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=255;}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);return tex;}
function dialTexture(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#d0ba8d';x.fillRect(0,0,512,512);let rng=63;for(let i=0;i<25000;i++){rng=(Math.imul(rng,1664525)+1013904223)>>>0;const a=rng%512;rng=(Math.imul(rng,1664525)+1013904223)>>>0;const b=rng%512;x.fillStyle=i%2?'rgba(46,29,15,.035)':'rgba(255,245,215,.04)';x.fillRect(a,b,2,2);}x.strokeStyle='#473b29';x.lineWidth=3;x.beginPath();x.arc(256,256,230,0,7);x.stroke();x.textAlign='center';x.font='27px Georgia';for(let i=0;i<=50;i++){const a=(-140+i*5.6)*Math.PI/180,s=Math.sin(a),q=-Math.cos(a);x.beginPath();x.moveTo(256+s*216,256+q*216);x.lineTo(256+s*(i%5===0?188:204),256+q*(i%5===0?188:204));x.stroke();if(i%10===0)x.fillText(String(i*2),256+s*162,264+q*162);}x.font='31px Georgia';x.fillText('TENSION',256,202);x.font='17px Georgia';x.fillText('LUNAR WORKS',256,334);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function observatory(scene){
 const root=new T.Group();scene.add(root);root.scale.setScalar(.4);root.rotation.z=-Math.PI/2;
 const grain=noiseTex(),brass=mat(0xb49556,.56,.38,{roughnessMap:grain}),bright=mat(0xe0c48b,.43,.29,{roughnessMap:grain}),iron=mat(0x343a37,.62,.44,{roughnessMap:grain}),wood=mat(0x60402b,.04,.65,{roughnessMap:grain}),cloth=mat(0x827a5d,0,.86,{roughnessMap:grain}),leather=mat(0x483a2a,0,.78,{roughnessMap:grain}),skin=mat(0xb18a65,0,.68),glass=mat(0x253b43,.35,.12);
 // Outward axis is local +Y. At scale .4, muzzle (0,2,0) coincides with core anchor.
 const platform=lathe(root,[[0,-.03],[1.26,-.03],[1.33,.02],[1.33,.11],[1.22,.14],[0,.14]],iron,0,0,-.2);
 for(let k=0;k<16;k++){const a=k*Math.PI/8;ball(root,brass,Math.sin(a)*1.17,.14,-.2+Math.cos(a)*1.17,.045,.027,.045);}
 const chair=new T.Group();chair.position.set(0,.10,-1.0);root.add(chair);
 for(const x of [-.27,.27]){shaft(chair,[x,0,-.24],[x,.49,.17],.034,iron);shaft(chair,[x,0,.26],[x,.49,-.20],.034,iron);shaft(chair,[x,.49,-.22],[x,1.18,-.37],.04,wood);shaft(chair,[x,.52,-.23],[x,.52,.23],.04,wood);}
 for(let i=0;i<6;i++)mesh(chair,new T.BoxGeometry(.63,.055,.09),wood,0,.52,-.24+i*.085);
 for(let i=0;i<5;i++)mesh(chair,new T.BoxGeometry(.58,.105,.065),wood,0,.72+i*.105,-.31-i*.025);
 // Seated surveyor, articulated segments and coherent joint placement.
 const person=new T.Group();person.position.set(0,.12,-1);root.add(person);
 ball(person,cloth,0,.65,-.02,.27,.24,.22);const torso=ball(person,cloth,0,.97,-.025,.28,.38,.20);torso.rotation.x=.09;
 ball(person,leather,0,.76,-.014,.282,.068,.218);
 shaft(person,[0,1.20,-.02],[0,1.31,0],.10,cloth);
 ball(person,skin,0,1.45,.04,.15,.18,.145);
 const helmet=ball(person,brass,0,1.49,.035,.20,.205,.19);
 ball(person,glass,0,1.49,.163,.15,.105,.071);torus(person,.15,.012,bright,0,1.49,.189);
 for(const side of [-1,1]){const x=side*.15;shaft(person,[x,.67,.01],[x,.56,.42],.112,cloth,.099);ball(person,cloth,x,.56,.42,.10,.10,.105);shaft(person,[x,.56,.42],[x,.14,.48],.085,cloth,.066);ball(person,leather,x,.13,.56,.098,.08,.17);
 const shoulder=[side*.26,1.08,.0],elbow=[side*.32,.84,.28],hand=[side*.13,1.05,.55];ball(person,cloth,...shoulder,.105,.12,.105);shaft(person,shoulder,elbow,.082,cloth,.073);ball(person,cloth,...elbow,.074,.075,.074);shaft(person,elbow,hand,.07,cloth,.05);ball(person,leather,...hand,.065,.062,.074);}
 const pack=lathe(person,[[0,0],[.18,0],[.21,.045],[.21,.39],[.18,.44],[0,.44]],iron,0,.82,-.24);for(const x of [-.115,.115])shaft(person,[x,.79,-.16],[x,1.24,-.13],.025,leather);
 // Instrument pedestal, bronze bearings, rotating reel and crank.
 lathe(root,[[0,0],[.36,0],[.36,.065],[.22,.11],[.17,.30],[.12,.78],[.2,.83],[.2,.88],[0,.88]],brass,0,.12,0);
 for(const x of [-.24,.24])shaft(root,[x,.30,0],[x,1.30,0],.045,iron);
 const reel=new T.Group();reel.position.set(0,1.15,0);root.add(reel);reel.rotation.y=Math.PI/2;
 const drum=lathe(reel,[[0,-.20],[.33,-.20],[.36,-.16],[.36,-.10],[.20,-.08],[.20,.08],[.36,.10],[.36,.16],[.33,.20],[0,.20]],brass,0,0,0);drum.rotation.x=Math.PI/2;
 for(let i=0;i<15;i++)torus(reel,.212,.009,bright,0,0,-.088+i*.012);
 for(let side of [-1,1])for(let j=0;j<16;j++){const a=j*Math.PI/8;mesh(reel,new T.BoxGeometry(.052,.048,.048),iron,Math.cos(a)*.357,Math.sin(a)*.357,side*.151).rotation.z=a;}
 shaft(reel,[0,0,.2],[0,.34,.25],.032,bright);shaft(reel,[0,.34,.25],[0,.34,.42],.049,wood);
 const rig=new T.Group();rig.position.set(0,2,0);root.add(rig);
 const launcher=new T.Group();rig.add(launcher);const rod=new T.Group();rig.add(rod);
 // Launcher forks terminate either side of the physical muzzle. Moving draw carriage is visual feedback.
 for(const side of [-1,1]){shaft(launcher,[side*.10,-.63,0],[side*.25,-.08,0],.047,brass,.035);ball(launcher,bright,side*.25,-.08,0,.065,.065,.065);}
 shaft(launcher,[0,-.85,0],[0,-.15,0],.065,wood,.048);
 const band=new T.BufferGeometry();band.setAttribute('position',new T.BufferAttribute(new Float32Array(9),3));const bands=new T.Line(band,new T.LineBasicMaterial({color:0xd4ac69}));launcher.add(bands);
 const drawPouch=ball(launcher,leather,0,-.3,0,.065,.08,.045);
 const rodCurve=new T.CatmullRomCurve3([V(0,-.87,0),V(0,-.5,-.07),V(0,-.18,-.04),V(0,0,0)]);
 mesh(rod,new T.TubeGeometry(rodCurve,32,.027,12,false),bright);
 shaft(rod,[0,-.90,0],[0,-.63,-.055],.051,wood,.043);
 for(let i=1;i<5;i++){const p=rodCurve.getPoint(i/5);const o=torus(rod,.042-i*.004,.008,brass,p.x,p.y,p.z);o.rotation.x=Math.PI/2;}
 const gauge=new T.Group();gauge.position.set(.48,.83,-.12);gauge.rotation.x=-.45;root.add(gauge);const housing=mesh(gauge,new T.CylinderGeometry(.23,.25,.1,48),brass);housing.rotation.x=Math.PI/2;const face=mesh(gauge,new T.CircleGeometry(.205,64),new T.MeshBasicMaterial({map:dialTexture()}),0,0,.055);torus(gauge,.213,.018,bright,0,0,.056);const needle=new T.Group();needle.position.z=.064;gauge.add(needle);mesh(needle,new T.BoxGeometry(.012,.158,.008),mat(0x773a24),0,.06,0);ball(gauge,bright,0,0,.07,.023,.023,.013);
 const lamp=lathe(root,[[0,0],[.13,0],[.13,.04],[.065,.09],[.055,.48],[.12,.53],[.13,.56],[0,.56]],brass,-.75,.12,-.34);ball(root,new T.MeshBasicMaterial({color:0xf5d79b}),-.75,.69,-.34,.085,.095,.085);const light=new T.PointLight(0xffcd83,.6,2.7,2);light.position.set(-.75,.72,-.34);root.add(light);
 const telescope=new T.Group();telescope.position.set(.86,.8,.10);telescope.rotation.z=-.38;root.add(telescope);lathe(telescope,[[0,-.43],[.12,-.43],[.13,-.37],[.11,-.31],[.10,.30],[.15,.34],[.15,.43],[0,.43]],brass,0,0,0);const lens=mesh(telescope,new T.CircleGeometry(.12,32),glass,0,.435,0);lens.rotation.x=-Math.PI/2;for(const x of [-.19,.19])shaft(root,[.86+x,.04,.12],[.86,.72,.12],.025,iron);
 return {root,rig,update({angle,power,rod:which,active,length,tension}){rig.rotation.x=angle*Math.PI/180;launcher.visible=!!which;rod.visible=!which;const d=active?-.08:-.12-power*.53;drawPouch.position.y=d;band.attributes.position.array.set([-.25,-.08,0,0,d,0,.25,-.08,0]);band.attributes.position.needsUpdate=true;reel.rotation.x=-length*.55;needle.rotation.z=(140-Math.min(1,tension/1300)*280)*Math.PI/180;}};
}
export function createSea(scene){
 const group=new T.Group();scene.add(group);const surface=new T.Mesh(new T.SphereGeometry(1,64,40),new T.MeshBasicMaterial({color:0x4b93a1,side:T.BackSide,transparent:true,opacity:.50,depthWrite:false}));group.add(surface);
 const geo=new T.BufferGeometry(),a=[];let s=829;for(let i=0;i<900;i++){const f=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};const x=f()*2-1,y=f()*2-1,z=f()*2-1;if(x*x+y*y+z*z<.95&&x*x+y*y+z*z>.25)a.push(x,y,z);}
 geo.setAttribute('position',new T.Float32BufferAttribute(a,3));const dust=new T.Points(geo,new T.PointsMaterial({color:0xb8dfd8,size:.06,transparent:true,opacity:.45,depthWrite:false}));group.add(dust);
 group.visible=false;return{group,update(body,radius,amber,t){group.position.copy(body.position);group.scale.setScalar(radius);surface.material.color.set(amber?0xa28b50:0x4b93a1);dust.rotation.y=t*.013;}};
}

function fin(parent,pts,material){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));geo.computeVertexNormals();return mesh(parent,geo,material);}
function swimmerBody(parent,material,len,height,width,shape=1){
 const verts=[],uv=[],indices=[],steps=28,rings=20;
 for(let j=0;j<=steps;j++){const u=j/steps,x=len*(.53-u),base=Math.pow(Math.sin(Math.PI*u),.66)*(.76+.32*Math.sin(Math.PI*u*1.2)),tail=Math.max(.025,base);
  for(let k=0;k<=rings;k++){const a=k/rings*Math.PI*2;verts.push(x,Math.cos(a)*height*tail,Math.sin(a)*width*tail);uv.push(u,k/rings);}
 }
 for(let j=0;j<steps;j++)for(let k=0;k<rings;k++){const a=j*(rings+1)+k,b=a+rings+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const m=mesh(parent,geo,material);return {mesh:m,base:Float32Array.from(verts),len,shape};
}
function skinMap(color,kind){
 const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d'),col=new T.Color(color);const rgb=col.clone().convertLinearToSRGB();const r=Math.round(rgb.r*255),g=Math.round(rgb.g*255),b=Math.round(rgb.b*255);const grad=x.createLinearGradient(0,0,0,128);grad.addColorStop(0,'rgb('+Math.round(r*.52)+','+Math.round(g*.55)+','+Math.round(b*.62)+')');grad.addColorStop(.5,'rgb('+r+','+g+','+b+')');grad.addColorStop(1,'rgb('+Math.round(r*.52)+','+Math.round(g*.55)+','+Math.round(b*.62)+')');x.fillStyle=grad;x.fillRect(0,0,256,128);
 for(let y=0;y<128;y+=7)for(let z=0;z<256;z+=9){x.strokeStyle='rgba(230,225,197,.12)';x.beginPath();x.arc(z+(y%14?4:0),y,5,-.85,.85);x.stroke();}
 if(kind===0||kind===4)for(let k=0;k<160;k++){const z=(k*73.3)%256,y=(k*37.7)%128;x.fillStyle='rgba(35,43,40,.36)';x.beginPath();x.ellipse(z,y,1.6+(k%3)*.65,1.1,0,0,7);x.fill();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export function makeCreature(scene,i){
 const colors=[0xb3c0b6,0xa3b977,0x76b8aa,0x9fbbce,0x4ba0b2,0xbaa5d1,0xbc8751,0xa15b43,0xe4b15b,0xa98172,0xb2a26c,0xd9ba79],g=new T.Group();scene.add(g);
 const eel=i===2||i===6,ray=i===3||i===7,jelly=i===5||i===11,squid=i===9;
 const tex=skinMap(colors[i],i),m=mat(colors[i],.08,.43,{map:tex}),fm=new T.MeshStandardMaterial({color:colors[i],side:T.DoubleSide,transparent:true,opacity:.78,roughness:.6}),eye=mat(0x171c1b,.1,.22),glint=mat(0xd4dbc5,0,.3);
 let body=null,tail=null,wings=[],tentacles=[];
 if(jelly){
  const bell=lathe(g,[[0,.48],[.23,.44],[.42,.32],[.56,.12],[.59,-.04],[.52,-.09],[.35,-.01],[.10,.18],[0,.20]],new T.MeshStandardMaterial({color:colors[i],transparent:true,opacity:.60,side:T.DoubleSide,roughness:.23}),0,0,0);body={bell};
  for(let j=0;j<9;j++){const a=j*2*Math.PI/9,geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(18*3),3));const l=new T.Line(geo,new T.LineBasicMaterial({color:colors[i],transparent:true,opacity:.8}));g.add(l);tentacles.push({l,a});}
 }else if(ray){
  body=swimmerBody(g,m,1.1,.16,.27);for(const side of [-1,1]){const wing=new T.Group();g.add(wing);fin(wing,[[.48,0,0],[-.22,0,side*1.05],[-.56,0,side*.18],[.48,0,0],[-.56,0,side*.18],[-.32,0,0]],fm);wings.push({wing,side});}shaft(g,[-.48,0,0],[-1.5,-.03,0],.035,m,.008);for(const side of [-1,1])ball(g,eye,.29,.12,side*.17,.06,.045,.06);
 }else if(squid){
  body=swimmerBody(g,m,1.25,.28,.25);for(const side of [-1,1])fin(g,[[.35,0,0],[-.42,0,side*.43],[-.60,0,0]],fm);for(let j=0;j<8;j++){const a=j*Math.PI/4,geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(18*3),3));const l=new T.Line(geo,new T.LineBasicMaterial({color:colors[i]}));g.add(l);tentacles.push({l,a});}for(const side of [-1,1])ball(g,eye,-.31,.02,side*.21,.082,.078,.043);
 }else{
  const len=eel?2.1:1.45+(i%3)*.12;body=swimmerBody(g,m,len,eel?.11:.30,eel?.12:.19);
  tail=new T.Group();tail.position.x=-len*.47;g.add(tail);fin(tail,[[0,0,0],[-.34,.32,0],[-.23,0,0],[0,0,0],[-.23,0,0],[-.34,-.32,0]],fm);
  if(!eel){fin(g,[[.13,.20,0],[-.24,.51,0],[-.43,.16,0]],fm);for(const side of [-1,1]){fin(g,[[.24,-.06,side*.12],[-.28,-.20,side*.39],[-.22,-.12,side*.13]],fm);ball(g,eye,len*.30,.06,side*.14,.052,.058,.033);ball(g,glint,len*.32,.075,side*.165,.017,.017,.009);}}
  else for(const side of [-1,1])ball(g,eye,len*.40,.025,side*.075,.041,.039,.025);
 }
 return {g,animate(t){
  if(body?.base){const attr=body.mesh.geometry.attributes.position,a=attr.array,src=body.base;for(let j=0;j<a.length;j+=3){const x=src[j],u=Math.max(0,Math.min(1,.5-x/body.len));a[j+2]=src[j+2]+Math.sin(t*(eel?7:10)-u*5+i)*u*u*(eel?.18:.075);}attr.needsUpdate=true;body.mesh.geometry.computeVertexNormals();}
  if(tail)tail.rotation.y=Math.sin(t*10+i)*.44;
  for(const {wing,side} of wings)wing.rotation.x=side*Math.sin(t*5+i)*.36;
  if(body?.bell){const s=1+.075*Math.sin(t*3+i);body.bell.scale.set(s,1/s,s);}
  for(const {l,a} of tentacles){const arr=l.geometry.attributes.position.array;for(let j=0;j<18;j++){const u=j/17;arr[j*3]=jelly?Math.cos(a)*(.35+u*.13)+Math.sin(t*2+u*4+a)*u*.09:-.5-u*(1+(a%1)*.3);arr[j*3+1]=jelly?-.03-u*1.1:Math.cos(a)*(.13+u*.12)+Math.sin(t*4+u*6+a)*u*.1;arr[j*3+2]=jelly?Math.sin(a)*(.35+u*.13)+Math.cos(t*2+u*4+a)*u*.08:Math.sin(a)*(.15+u*.10)+Math.sin(t*3+u*7+a)*u*.12;}l.geometry.attributes.position.needsUpdate=true;l.frustumCulled=false;}
 }};
}
