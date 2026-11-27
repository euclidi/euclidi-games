export const upgrades=[
{id:"rebound",name:"Rebound Assembly",base:120,max:5,desc:"Higher ball rebound on solid contacts.",value:l=>(.88+.018*l).toFixed(3)},
{id:"magnet",name:"Magnetic Core",base:180,max:5,desc:"Pulls gently toward nearby unhit pegs.",value:l=>l===0?"Off":l*12+"%"},
{id:"mint",name:"Coin Press",base:140,max:5,desc:"Increases earned coins.",value:l=>(1+.2*l).toFixed(1)+"×"},
{id:"bucket",name:"Bucket Mechanism",base:150,max:5,desc:"Widens the moving catcher.",value:l=>116+12*l+" px"},
{id:"ammo",name:"Ball Magazine",base:100,max:5,desc:"Adds starting ammunition.",value:l=>10+l}
];
export function tier(save,id){return Math.max(0,Math.min(5,Math.floor(Number(save[id])||0)))}
export function cost(u,l){return Math.round(u.base*Math.pow(1.55,l))}
export function buy(save,id){let u=upgrades.find(x=>x.id===id);if(!u)return false;let l=tier(save,id),c=cost(u,l);if(l>=u.max||save.coins<c)return false;save.coins-=c;save[id]=l+1;return true}
export function inputs(s){let active=s.playing&&!s.editing&&!s.paused&&!s.finished&&!s.fever;return {aim:!!(active&&!s.balls),fire:!!(active&&!s.balls&&s.ammo>0),flip:!!(active&&s.power==="Flippers")}}
export function shotsLabel(n){return n+" "+(n===1?"shot":"shots")}
export const obstacleTypes=["brick","bumper","obstacle","platform","rotor"];
export function isObstacle(p){return obstacleTypes.includes(p.type)}
export function objectRadius(p){return isObstacle(p)&&p.type!=="bumper"?Math.hypot(p.width||44,p.height||16)/2:12}
export const abilityText={"Super Guide":"Predicts multiple rebounds before the next shot.","Wide Bucket":"Widens the catcher for the next shot.","Multiball":"Launches a second ball at a slight angle.","Flippers":"Kick low balls upward using the Flippers control.","Fireball":"Passes through scoring pegs and hits nearby targets.","Score Rush":"Doubles peg points on the next shot.","Extra Ball":"Refunds one ball when the next shot launches."};
