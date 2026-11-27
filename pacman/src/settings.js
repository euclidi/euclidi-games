export const SETTINGS=[
 {id:'lives',group:'GAME RULES',label:'Starting lives',values:[1,3,5],def:3,help:'New games only'},
 {id:'bonus',group:'GAME RULES',label:'Bonus life',values:[10000,15000,20000,0],labels:['10,000','15,000','20,000','Off'],def:10000,help:'New games only'},
 {id:'difficulty',group:'GAME RULES',label:'Ghost speed',values:['relaxed','arcade','expert'],labels:['Relaxed','Arcade','Expert'],def:'arcade',help:'New games only'},
 {id:'volume',group:'AUDIO',label:'Master volume',values:[0,25,50,75,100],labels:['0%','25%','50%','75%','100%'],def:100},
 {id:'music',group:'AUDIO',label:'Music',values:[true,false],def:true},
 {id:'siren',group:'AUDIO',label:'Ghost sirens',values:[true,false],def:true},
 {id:'intro',group:'AUDIO',label:'Opening jingle',values:[true,false],def:true},
 {id:'size',group:'CONTROLS',label:'Touch control size',values:['small','normal','large'],def:'normal'},
 {id:'sensitivity',group:'CONTROLS',label:'Joystick sensitivity',values:['low','normal','high'],def:'normal'},
 {id:'feedback',group:'CONTROLS',label:'Direction lights',values:[true,false],def:true},
 {id:'swipe',group:'CONTROLS',label:'Maze swipe',values:[true,false],def:true},
 {id:'scan',group:'DISPLAY',label:'CRT scanline strength',values:['light','normal','strong'],def:'normal',help:'When CRT is enabled'},
 {id:'motion',group:'DISPLAY',label:'Menu animation',values:[true,false],def:true},
 {id:'blink',group:'DISPLAY',label:'Pellet flashing',values:[true,false],def:true},
 {id:'autoPause',group:'DISPLAY',label:'Auto-pause on tab switch',values:[true,false],def:true},
 {id:'padSlot',group:'GAMEPAD',label:'Controller',values:['auto','0','1','2','3'],labels:['Auto','1','2','3','4'],def:'auto'},
 {id:'mapping',group:'GAMEPAD',label:'Input mapping',values:['auto','standard','legacy'],labels:['Auto','Standard','Legacy'],def:'auto'},
 {id:'deadzone',group:'GAMEPAD',label:'Stick deadzone',values:['low','normal','high'],def:'normal'},
 {id:'rumble',group:'GAMEPAD',label:'Vibration',values:[true,false],def:true}
];
export function normalizeSettings(input){let out={};for(const s of SETTINGS)out[s.id]=s.values.includes(input?.[s.id])?input[s.id]:s.def;return out}
export function scoreKey(mode,settings){const s=normalizeSettings(settings);return 'maze-high-'+mode+(s.lives===3&&s.bonus===10000&&s.difficulty==='arcade'?'':'-'+s.lives+'-'+s.bonus+'-'+s.difficulty)}
export function settingText(s,v){let i=s.values.indexOf(v);return s.labels?.[i]??(typeof v==='boolean'?v?'On':'Off':String(v))}
