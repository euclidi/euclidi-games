import {sim} from "./simulation.js";
let state;
self.onmessage=e=>{const c=e.data;try{let message="";if(c.type==="init"){state=c.state?.version===1?c.state:sim.fresh(c.mode)}else if(c.type==="reset"){state=sim.fresh(c.mode)}else{if(!state)state=sim.fresh();message=sim.action(state,c)}self.postMessage({state,message})}catch(e){self.postMessage({error:String(e)})}};
