// Original Kenney Urban atlas, 27 columns × 18 rows, 16 px cells.
// World decoration is data-driven so individual tile assignments can be audited.
export const FACADES=[
 {roof:[16,0],wall: [9,4],accent:0xad514d, awning:0xe4c9a4, text:"FRESH CUTS · DELI"},
 {roof:[20,3],wall:[9,4],accent:0x677789,awning:0xb4cad0,text:"24/7 FITNESS"},
 {roof:[20,0],wall:[10,4],accent:0x9f777b,awning:0xdcb0a7,text:"BOOKS · COFFEE"},
 {roof:[16,3],wall:[9,4],accent:0x658c95,awning:0xc4d0c3,text:"PIPE · DRAIN · REPAIR"},
 {roof:[16,3],wall:[9,4],accent:0xa27d4c,awning:0xd0ad70,text:"TIMBER · HARDWARE"},
 {roof:[20,3],wall:[9,4],accent:0x477e85,awning:0xc5dad5,text:"WASH · WAX"},
 {roof:[20,0],wall:[10,4],accent:0x8a697d,awning:0xe4c5a1,text:"CUSTOM FRAMING"},
 {roof:[16,0],wall:[9,4],accent:0x614b7d,awning:0xc39cce,text:"MOCKTAILS · MUSIC"}
];
export const INTERIORS=[
 [[3,3,4,10,3,1],[3,6,5,10,2,1],[19,3,7,10,3,1],[19,8,9,10,2,1],[4,11,4,10,2,1]],
 [[3,3,7,12,2,1],[3,7,7,12,2,1],[19,3,9,13,2,1],[19,7,9,13,2,1],[5,12,9,13,2,1]],
 [[3,3,4,12,3,1],[3,7,4,12,3,1],[3,11,4,12,3,1],[19,3,4,12,3,1],[19,7,4,12,3,1],[19,11,4,12,3,1]],
 [[3,3,4,10,3,1],[19,3,5,10,3,1],[3,8,9,13,2,1],[19,8,7,12,2,1],[4,12,4,10,3,1]],
 [[3,3,4,10,3,1],[19,3,4,10,3,1],[3,8,4,10,2,1],[19,8,7,12,2,1]],
 [[4,4,15,15,1,2],[19,4,16,15,1,2],[3,9,4,10,2,1],[19,10,9,13,2,1]],
 [[3,3,10,12,2,1],[19,3,10,12,2,1],[3,7,10,13,2,1],[19,7,10,13,2,1],[3,11,9,13,2,1]],
 [[3,3,7,12,2,1],[19,3,7,12,2,1],[3,7,9,13,2,1],[19,7,9,13,2,1],[3,12,7,12,2,1],[19,12,7,12,2,1]],
 [[3,3,7,12,2,1],[19,3,9,13,2,1],[3,9,4,12,3,1]]
];
export const MOOD_TINT=[0xffffff,0xe6edff,0xffebdf,0xe1ffec,0xfff2cc,0xe9e0ff,0xdde7ff,0xffddeb];
export function destinationFor(n,minute,day,previous){
 // owners return to their business for working hours; all residents make
 // periodic visits to breakfast, work, recreation, or evening venues.
 let hour=Math.floor(minute/60);
 if(hour<7)return (n.id+day)%4+4;
 if(hour<10)return [0,2,1,0][n.id%4];
 if(hour<17)return n.work??((n.id+Math.floor(hour/3)+day)%7);
 if(hour<23)return [7,1,2,5][(n.id+day)%4];
 return previous;
}
