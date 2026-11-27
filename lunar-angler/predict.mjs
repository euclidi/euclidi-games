// Forecast on a separate instance of the exact authoritative binary.
// Copy only at an exported-call boundary. The live instance is never stepped.
export function forecast(live,trial,{x,y,power,rod,drag=.4,maxSteps=960}){
 const memory=new Uint8Array(trial.memory.buffer), source=new Uint8Array(live.memory.buffer);
 if(memory.length!==source.length||trial.snapshot()!==live.snapshot())throw Error('Incompatible prediction instance');
 memory.set(source);
 trial.cast(x,y,power,rod);
 const state=new Float64Array(trial.memory.buffer,trial.snapshot(),256),points=[];
 let wet=0,hitTime=0,hitPosition=null;
 for(let i=0;i<maxSteps;i++){
   trial.step(1/120,0,drag);
   if(i%8===0||state[2])points.push(state[126],state[127]);
   if(state[2]){wet=state[2];hitTime=(i+1)/120;hitPosition=[state[126],state[127]];break;}
   if(!state[1]||state[5])break;
 }
 return {points,wet,hitTime,hitPosition};
}
