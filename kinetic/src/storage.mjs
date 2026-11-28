const DB='kinetic-delta',STORE='characters';
function db(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Close other Kinetic tabs to update storage'));})}
async function access(mode,action){const d=await db();try{return await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,mode),req=action(tx.objectStore(STORE));let value;req.onsuccess=()=>value=req.result;tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error||Error('Save transaction aborted'));tx.onerror=()=>reject(tx.error);})}finally{d.close()}}
export async function saveSession(slot,session){if(typeof slot!=='string'||!slot.trim())throw Error('Invalid slot');const snapshot=session.snapshot();await access('readwrite',s=>s.put({snapshot,savedAt:new Date().toISOString()},slot));return true}
export async function loadSession(slot,session){const row=await access('readonly',s=>s.get(slot));return row?session.restore(row.snapshot):null}
export const deleteSession=slot=>access('readwrite',s=>s.delete(slot));
