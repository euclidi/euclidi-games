// Euclidi Games development adapter. Reference-space quaternion inputs, official CC0 MakeHuman weights. Not final pose/IK or garment simulation.
export function createRigAdapter(body, rig) {
  // Angles are expressed about unposed reference axes, inherited by children.
  // Full source weights are retained and renormalized; this is linear blend skinning.
  const rest=new Float64Array(body.positions), indices=new Uint32Array(body.indices), bones=rig.bones, n=rest.length/3;
  if(body.source.blob!==rig.source.bodyBlob||!Number.isInteger(n)||rig.fullInfluences.length!==n||!rest.every(Number.isFinite)||!indices.every(i=>i<n))throw new Error("Body/rig compatibility gate failed");
  const nameToIndex=new Map(bones.map((b,i)=>[b.name,i]));
  if(nameToIndex.size!==bones.length||bones.some((b,i)=>b.parent>=i||b.parent< -1||!Number.isInteger(b.parent)))throw new Error("Invalid bone hierarchy");
  const influences=rig.fullInfluences.map((inf)=>{const sum=inf.reduce((s,p)=>s+p[1],0);if(!(sum>0)||inf.some(([i,w])=>!Number.isInteger(i)||i<0||i>=bones.length||!(w>0)))throw new Error("Invalid skin weights");return inf.map(([i,w])=>[i,w/sum]);});
  function mul(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
  function rotate(q,x,y,z){const [a,b,c,d]=q;const u=2*(b*z-c*y),v=2*(c*x-a*z),w=2*(a*y-b*x);return [x+d*u+b*w-c*v,y+d*v+c*u-a*w,z+d*w+a*v-b*u]}
  function normalized(q){if(!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite))throw new Error("Expected finite xyzw quaternion");let len=Math.hypot(...q);if(len<1e-12)throw new Error("Zero quaternion");return q.map(x=>x/len)}
  function axisAngle(axis,radians){if(!Array.isArray(axis)||axis.length!==3||!axis.every(Number.isFinite)||!Number.isFinite(radians))throw new Error("Invalid axis angle");const len=Math.hypot(...axis);if(len<1e-12)throw new Error("Zero axis");const a=Math.sin(radians/2)/len;return [...axis.map(x=>x*a),Math.cos(radians/2)]}
  function evaluate(rotations={},translation=[0,0,0]){
    if(translation.length!==3||!translation.every(Number.isFinite))throw new Error("Invalid root translation");
    for(const k of Object.keys(rotations))if(!nameToIndex.has(k))throw new Error("Unknown bone: "+k);
    const heads=[],orientations=[],tails=[];
    for(let i=0;i<bones.length;i++){const b=bones[i],q=normalized(rotations[b.name]||[0,0,0,1]);if(b.parent===-1){heads[i]=b.head.map((x,k)=>x+translation[k]);orientations[i]=q;}else{const pb=bones[b.parent],ph=heads[b.parent],pq=orientations[b.parent],d=rotate(pq,...b.head.map((x,k)=>x-pb.head[k]));heads[i]=d.map((x,k)=>x+ph[k]);orientations[i]=mul(pq,q);}
      const d=rotate(orientations[i],...b.tail.map((x,k)=>x-b.head[k]));tails[i]=d.map((x,k)=>x+heads[i][k]);
    }
    const positions=new Float64Array(rest.length);
    for(let i=0;i<n;i++){let x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];for(const [k,w] of influences[i]){const b=bones[k],h=heads[k],r=rotate(orientations[k],x-b.head[0],y-b.head[1],z-b.head[2]);for(let j=0;j<3;j++)positions[i*3+j]+=w*(r[j]+h[j]);}}
    const normals=new Float64Array(rest.length);
    for(let i=0;i<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const j of [a,b,c]){normals[j]+=nx;normals[j+1]+=ny;normals[j+2]+=nz;}}
    for(let j=0;j<normals.length;j+=3){const l=Math.hypot(normals[j],normals[j+1],normals[j+2]);if(l>1e-16){normals[j]/=l;normals[j+1]/=l;normals[j+2]/=l;}}
    return {positions,normals,heads,tails,orientations};
  }
  return {evaluate,axisAngle,vertexCount:n,indices,nameToIndex};
}
