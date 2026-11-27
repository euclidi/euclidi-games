export const roster=[
{id:"finch",name:"Finch",kind:"Fox inventor",power:"Super Guide",unlock:0,color:"#b66b40",desc:"An ingenious explorer with an eye for impossible angles."},
{id:"moss",name:"Moss",kind:"Woodland magician",power:"Wide Bucket",unlock:0,color:"#83a968",desc:"A patient keeper of the forest's hidden machinery."},
{id:"pearl",name:"Pearl",kind:"Aquatic creature",power:"Multiball",unlock:10,color:"#c9a7b6",desc:"A collector of sunken treasures."},
{id:"cog",name:"Cogsworth",kind:"Clockwork automaton",power:"Flippers",unlock:20,color:"#bfa16a",desc:"A mechanical engineer from the brass city."},
{id:"ember",name:"Ember",kind:"Fire spirit",power:"Fireball",unlock:30,color:"#d4774f",desc:"A spirited flame from the furnace depths."},
{id:"opal",name:"Opal",kind:"Human illusionist",power:"Score Rush",unlock:40,color:"#a3bcd4",desc:"A magician who studies refracted light."},
{id:"orion",name:"Orion",kind:"Owl astronomer",power:"Extra Ball",unlock:50,color:"#a394ca",desc:"A celestial navigator who never wastes a shot."}
];
export function available(cleared){return roster.filter(c=>c.unlock<=cleared)}
export function clearedCount(save){return Math.max(0,Math.min(50,Math.max(Number(save.level)||0,Number(save.cleared)||0,...Object.entries(save.records||{}).filter(([k,v])=>/^Campaign:\d+$/.test(k)&&Number.isFinite(v?.shots)&&v.shots<999).map(([k])=>Number(k.split(":")[1])+1))))}
export function selectedCharacter(save){return available(clearedCount(save)).find(c=>c.id===save.character)||roster[0]}
export function chooseCharacter(save,id){if(!available(clearedCount(save)).some(c=>c.id===id))return false;save.character=id;return true}
