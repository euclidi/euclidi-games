export const GHOST_NAMES=['BLINKY','PINKY','INKY','CLYDE','CUSTOM'];
export const GHOST_COLORS=['#ff0000','#ffb8ff','#00ffff','#ffb851'];
export const CUSTOM_COLORS=['#b47cff','#6de85c','#ff794d','#ec4aa4','#27bdb0','#e4d143','#aa8c67','#bcbcbc'];
export const PUPIL_COLORS=['#2121ff','#b12c46','#117c51','#171727'];
export function normalizeGhost(v={}){let slot=Number.isInteger(v?.slot)&&v.slot>=0&&v.slot<=4?v.slot:0;let name=String(v?.name??'SPECTER').toUpperCase().replace(/[^A-Z0-9 ]/g,'').trim().slice(0,8)||'SPECTER';return {slot,name,color:CUSTOM_COLORS.includes(v?.color)?v.color:CUSTOM_COLORS[0],pupil:PUPIL_COLORS.includes(v?.pupil)?v.pupil:PUPIL_COLORS[0]}}
export function ghostName(v){let g=normalizeGhost(v);return g.slot===4?g.name:GHOST_NAMES[g.slot]}
export function ghostColor(v){let g=normalizeGhost(v);return g.slot===4?g.color:GHOST_COLORS[g.slot]}
export function ghostScoreKey(mode,settings){return 'maze-ghost-high-'+mode+'-'+settings.lives+'-'+settings.difficulty}
