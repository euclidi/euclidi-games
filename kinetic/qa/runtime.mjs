import {Engine,Scene,Vector3,Color3,Color4,ArcRotateCamera,HemisphericLight,DirectionalLight,MeshBuilder,PhysicsAggregate,PhysicsShapeType,HavokPlugin,ImportMeshAsync} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';
const status=document.querySelector('#status'), canvas=document.querySelector('#view');
const report={phase:'boot',assets:[],errors:[],physics:false};window.kineticQA=report;
const lib='/assets/resource-library/foundations-3d/';
async function run(){
  const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,disableWebGL2Support:false});
  const scene=new Scene(engine);scene.clearColor=new Color4(.14,.16,.17,1);
  const camera=new ArcRotateCamera('review',-Math.PI/2,Math.PI/3,7,new Vector3(0,1,0),scene);camera.attachControl(canvas,true);
  new HemisphericLight('sky',new Vector3(0,1,0),scene).intensity=1;
  const sun=new DirectionalLight('sun',new Vector3(-1,-2,1),scene);sun.intensity=2;
  const hk=await HavokPhysics({locateFile:()=>new URL('./generated/HavokPhysics.wasm',import.meta.url).href});
  scene.enablePhysics(new Vector3(0,-9.81,0),new HavokPlugin(true,hk));
  // Diagnostic colliders only; no primitive placeholder is intended for game assets.
  const floor=MeshBuilder.CreateGround('QA ground',{width:16,height:16},scene);
  new PhysicsAggregate(floor,PhysicsShapeType.BOX,{mass:0},scene);
  const ball=MeshBuilder.CreateSphere('QA physics probe',{diameter:.4},scene);ball.position.set(0,3,-2);
  new PhysicsAggregate(ball,PhysicsShapeType.SPHERE,{mass:1,restitution:.1},scene);
  const list=[
    ['ranger','fps-and-archery/kaykit/Characters/gltf/Ranger.glb',-1.8],
    ['bow','fps-and-archery/kaykit/Assets/gltf/bow_withString.gltf',0],
    ['crossbow','fps-and-archery/kaykit/Assets/gltf/crossbow_2handed.gltf',1.5],
    ['deer','quaternius/ultimate-animated-animals/Deer.gltf',3]
  ];
  engine.runRenderLoop(()=>scene.render());addEventListener('resize',()=>engine.resize());
  for(const [id,url,x] of list){
    const imported=await ImportMeshAsync(lib+url,scene);
    const visible=imported.meshes.filter(m=>m.getTotalVertices()>0);
    if(!visible.length)throw Error(id+' has no geometry');
    const root=imported.meshes[0];root.position.x=x;
    const groups=imported.animationGroups||[];
    const data={id,meshes:visible.length,vertices:visible.reduce((a,m)=>a+m.getTotalVertices(),0),animations:groups.map(a=>a.name),skeletons:imported.skeletons.length};
    report.assets.push(data);if(groups.length)groups[0].start(true);
  }
  const start=ball.position.y;
  await new Promise(resolve=>setTimeout(resolve,1500));
  report.physics=ball.position.y<2.9&&ball.position.y>-.5&&ball.position.y<=start+.1;
  report.ballY=ball.position.y;report.engine=engine.webGLVersion;report.phase='ready';
  status.textContent=JSON.stringify(report);
  if(!report.physics)throw Error('Havok probe did not settle near ground');
}
run().catch(e=>{report.phase='failed';report.errors.push(String(e.stack||e));status.textContent=String(e);console.error(e)});
