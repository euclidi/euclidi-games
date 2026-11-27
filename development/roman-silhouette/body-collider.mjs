// Pose-dependent triangle BVH. Nearest surface, parity inside test and limited point projection. Not continuous collision detection or self collision.
export function buildBodyCollider(positions,indices,normals){
 const n=positions.length/3;
 if(!Number.isInteger(n)||positions.length!==normals.length||indices.length%3||!positions.every(Number.isFinite)||!normals.every(Number.isFinite)||!indices.every(i=>i>=0&&i<n&&Number.isInteger(i)))throw Error("Invalid collision surface");
 const V=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]],add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{let l=Math.hypot(...a);return l>1e-15?mul(a,1/l):[0,1,0]};
 let volume=0;
 const tris=Array.from({length:indices.length/3},(_,i)=>{let ids=[indices[i*3],indices[i*3+1],indices[i*3+2]],v=ids.map(V),lo=[0,1,2].map(k=>Math.min(...v.map(a=>a[k]))),hi=[0,1,2].map(k=>Math.max(...v.map(a=>a[k])));volume+=dot(v[0],cross(v[1],v[2]))/6;return {i,ids,v,lo,hi,c:mul(add(add(v[0],v[1]),v[2]),1/3)};});
 const orientation=volume<0?-1:1;
 function build(list){const lo=[0,1,2].map(k=>list.reduce((a,t)=>Math.min(a,t.lo[k]),Infinity)),hi=[0,1,2].map(k=>list.reduce((a,t)=>Math.max(a,t.hi[k]),-Infinity));if(list.length<=8)return{lo,hi,list};let k=[0,1,2].reduce((a,b)=>hi[b]-lo[b]>hi[a]-lo[a]?b:a,0);list.sort((a,b)=>a.c[k]-b.c[k]||a.i-b.i);let m=list.length>>1;return{lo,hi,left:build(list.slice(0,m)),right:build(list.slice(m))}}
 const root=build(tris);
 function boxDistance(p,b){return p.reduce((s,x,k)=>s+Math.max(b.lo[k]-x,0,x-b.hi[k])**2,0)}
 // Closest-point region classification with barycentric coordinates.
 function closest(p,t){const [a,b,c]=t.v,ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);let w;
 if(d1<=0&&d2<=0)w=[1,0,0];else{let bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)w=[0,1,0];else{let vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){let v=d1/(d1-d3);w=[1-v,v,0];}else{let cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)w=[0,0,1];else{let vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){let u=d2/(d2-d6);w=[1-u,0,u];}else{let va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0){let u=(d4-d3)/((d4-d3)+(d5-d6));w=[0,1-u,u];}else{let denom=1/(va+vb+vc);let v=vb*denom,u=vc*denom;w=[1-v-u,v,u];}}}}}}
 const point=add(add(mul(a,w[0]),mul(b,w[1])),mul(c,w[2]));const diff=sub(p,point);return {triangle:t.i,ids:t.ids,weights:w,point,d2:dot(diff,diff),faceNormal:unit(mul(cross(ab,ac),orientation))};}
 function nearest(p){if(p.length!==3||!p.every(Number.isFinite))throw Error("Invalid query");let best={d2:Infinity};function visit(node){if(boxDistance(p,node)>best.d2)return;if(node.list){for(const t of node.list){const q=closest(p,t);if(q.d2<best.d2)best=q;}return;}let a=node.left,b=node.right;if(boxDistance(p,a)>boxDistance(p,b))[a,b]=[b,a];visit(a);visit(b);}visit(root);
 let smooth=[0,0,0];for(let j=0;j<3;j++){const i=best.ids[j]*3;for(let k=0;k<3;k++)smooth[k]+=normals[i+k]*best.weights[j]*orientation;}best.normal=unit(smooth);if(dot(best.normal,best.faceNormal)<.1)best.normal=best.faceNormal;return best;}
 const ray=unit([1,.123456789,.314159265]);
 function rayBox(p,b){let near=0,far=Infinity;for(let k=0;k<3;k++){let a=(b.lo[k]-p[k])/ray[k],c=(b.hi[k]-p[k])/ray[k];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(far<near)return false;}return true;}
 function rayTri(p,t){const [a,b,c]=t.v,e1=sub(b,a),e2=sub(c,a),h=cross(ray,e2),det=dot(e1,h);if(Math.abs(det)<1e-14)return null;const s=sub(p,a),u=dot(s,h)/det;if(u<0||u>1)return null;const q=cross(s,e1),v=dot(ray,q)/det;if(v<0||u+v>1)return null;let d=dot(e2,q)/det;return d>1e-10?d:null;}
 function inside(p){let hits=[];function visit(b){if(!rayBox(p,b))return;if(b.list){for(const t of b.list){const d=rayTri(p,t);if(d!==null)hits.push(d);}return;}visit(b.left);visit(b.right);}visit(root);hits.sort((a,b)=>a-b);let count=0,prev=-Infinity;for(const h of hits)if(h-prev>1e-8){count++;prev=h;}return count%2===1;}
 function query(p){const q=nearest(p),d=Math.sqrt(q.d2);return {...q,distance:d<1e-9?0:inside(p)?-d:d};}
 function project(p,clearance=.003){if(!Number.isFinite(clearance)||clearance<0)throw Error("Invalid clearance");let x=p.slice(),moved=false,q;for(let i=0;i<4;i++){q=query(x);if(q.distance>=clearance-1e-7)break;const n=q.distance>1e-8?unit(sub(x,q.point)):q.distance< -1e-8?unit(sub(q.point,x)):q.faceNormal;
 x=add(q.point,mul(n,clearance+1e-6));moved=true;}
 let result=query(x);
 // Narrow gaps (for example between nearby surfaces) can defeat local
 // projection. Search deterministic directions at increasing distances,
 // preferring the smallest displacement that actually clears the body.
 if(result.distance<clearance-1e-7){
  const directions=[result.faceNormal,result.normal];
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++)if(a||b||c)directions.push(unit([a,b,c]));
  let best=null,bestD=Infinity;
  for(const radius of [clearance*1.1,clearance*2,clearance*3,clearance*5,clearance*8]){
   for(const d of directions){
    const candidate=add(result.point,mul(d,radius+1e-6)),delta=sub(candidate,p),dist2=dot(delta,delta);
    if(dist2>=bestD)continue;const test=query(candidate);
    if(test.distance>=clearance-1e-7){best=candidate;bestD=dist2;}
   }
   if(best)break;
  }
  if(best){x=best;result=query(x);moved=true;}
 }
 return{point:x,moved,distance:result.distance,converged:result.distance>=clearance-1e-7};}
 return {nearest,inside,query,project,volume,triangles:tris.length};
}
