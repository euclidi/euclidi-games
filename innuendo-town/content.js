export const SHOPS=[
{ name:"The Meat Market",sign:"MEAT MARKET",owner:"Butch",mood:"Oblivious",line:"I need someone with a firm grip on our sausage inventory.",reply:"I meant stock management.",task:"Sort the delivery",verb:"Sort",items:["Pork","Beef","Turkey"],pay:28,product:"Butcher apron",price:18,kind:"sort",x:3,y:4,w:10,h:7,roof:16,open:480,close:1140 },
{ name:"Stiff Competition",sign:"STIFF COMP.",owner:"Flex",mood:"Competitive",line:"Everyone wants to get bigger. Nobody wants to put the weights back.",reply:"Proper form is everything.",task:"Spot three sets",verb:"Spot",pay:34,product:"Tracksuit",price:26,kind:"timing",x:20,y:3,w:12,h:8,roof:16,open:360,close:1320 },
{ name:"Happy Endings",sign:"HAPPY ENDINGS",owner:"Paige",mood:"Mischievous",line:"Our readers insist on a satisfying climax. Usually chapter twelve.",reply:"That belongs on a bookmark.",task:"Shelve the books",verb:"Shelve",items:["Mystery","Romance","Cooking"],pay:25,product:"Literary glasses",price:20,kind:"sort",x:39,y:4,w:9,h:7,roof:20,open:540,close:1200 },
{ name:"Deep & Tight",sign:"DEEP & TIGHT",owner:"Piper",mood:"Practical",line:"Can you handle a long pipe without giggling?",reply:"This is a plumbing business.",task:"Set the pressure",verb:"Adjust",pay:38,product:"Utility overalls",price:32,kind:"pressure",x:57,y:5,w:11,h:6,roof:16,open:420,close:1080 },
{ name:"The Morning Wood",sign:"MORNING WOOD",owner:"Woody",mood:"Deadpan",line:"My customer wants six inches of solid hardwood.",reply:"Oak, obviously.",task:"Deliver hardware",verb:"Deliver",pay:30,product:"Workshop boots",price:24,kind:"cargo",x:4,y:24,w:12,h:8,roof:16,open:420,close:1080 },
{ name:"The Wet Spot",sign:"THE WET SPOT",owner:"Sunny",mood:"Cheerful",line:"Free blow-drying for every customer whose car gets wet.",reply:"The mayor misread the flyer.",task:"Wash the car",verb:"Wash",pay:29,product:"Raincoat",price:25,kind:"wash",x:22,y:25,w:10,h:7,roof:20,open:480,close:1200 },
{ name:"Well Hung",sign:"WELL HUNG",owner:"Art",mood:"Dramatic",line:"The mayor is extremely particular about how he is hung.",reply:"His portrait, naturally.",task:"Level the frames",verb:"Level",pay:31,product:"Gallery coat",price:37,kind:"timing",x:39,y:24,w:10,h:8,roof:20,open:600,close:1260 },
{ name:"The Thirst Trap",sign:"THIRST TRAP",owner:"Jules",mood:"Flirtatious",line:"Come in thirsty and leave satisfied. The lemonade is excellent.",reply:"You should see our mocktail list.",task:"Fill drink orders",verb:"Pour",items:["Lemon","Mint","Berry"],pay:37,product:"Evening wear",price:42,kind:"sort",x:56,y:23,w:12,h:9,roof:16,open:1020,close:120 }
].map((s,id)=>({...s,id}));
export const RESIDENTS=SHOPS.map(s=>({name:s.owner,mood:s.mood,line:s.line,reply:s.reply,work:s.id})).concat([
{name:"Doris",mood:"Prudish",line:"I am starting a petition against the car wash.",reply:"I have not actually read the flyer."},
{name:"Hugh",mood:"Shameless",line:"This town has a firm policy on loose conduct.",reply:"I helped write it."},
{name:"Pat",mood:"Oblivious",line:"I asked the hardware store for a quick screw. Everyone laughed.",reply:"I needed a Phillips head."},
{name:"Robin",mood:"Mischievous",line:"I swapped the gym and plumbing advertisements.",reply:"Not one customer complained."},
{name:"Frank",mood:"Formal",line:"The council is committed to keeping this town well endowed.",reply:"With public infrastructure."},
{name:"Tess",mood:"Competitive",line:"I can hold a plank for five minutes. Woody refused to recognize the record.",reply:"His planks are wooden."},
{name:"Kim",mood:"Reserved",line:"I thought the Thirst Trap was a hydration station.",reply:"The lemonade is rather good."},
{name:"Lou",mood:"Gossip",line:"The mayor was seen in a compromising position last night.",reply:"He fell off a folding chair."}
]).map((s,id)=>({...s,id,look:id%6}));
export const INCIDENTS=[
["A firm sausage contest","Butch advertised a sausage contest. The mayor withdrew from the judging panel.",0],
["Pressure complaints","The gym sent its low-pressure complaint to the plumber. Piper is confused.",3],
["A public reading","Paige accidentally sent chapter twelve of a romance novel to town hall.",2],
["Hardwood shortage","Woody has run out of oak. His waiting list is embarrassing.",4],
["Free wax","Doris is protesting a car wash promotion without reading it.",5],
["Mayor on display","Art hung the mayor's portrait sideways. He calls it artistic.",6],
["A thirsty crowd","Jules sold out of lemonade after a poorly worded advertisement.",7],
["A stiff challenge","Flex challenged the lumberyard to a plank-holding contest.",1]
];
export const isOpen=(s,m)=>s.open<s.close?m>=s.open&&m<s.close:m>=s.open||m<s.close;
export const moneyFor=(s,score)=>Math.round(s.pay*(.4+.6*Math.max(0,Math.min(3,score))/3));
export function pathfind(cols,rows,blocked,start,end){let id=(x,y)=>y*cols+x,valid=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&!blocked.has(id(x,y));if(!valid(end.x,end.y))return [];let a=id(start.x,start.y),z=id(end.x,end.y),q=[a],prev=new Int32Array(cols*rows).fill(-1);prev[a]=a;for(let i=0;i<q.length&&prev[z]===-1;i++){let k=q[i],x=k%cols,y=Math.floor(k/cols);for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let X=x+dx,Y=y+dy,j=id(X,Y);if(valid(X,Y)&&prev[j]===-1){prev[j]=k;q.push(j)}}}if(prev[z]===-1)return [];let p=[];for(let k=z;k!==a;k=prev[k])p.unshift({x:k%cols,y:Math.floor(k/cols)});return p}
