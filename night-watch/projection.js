// Standalone perspective and wall-depth helpers. No PAC-MAN runtime dependency.
export function projectPoint(camera,x,y,z,height,width,w,h){
 const dx=x-camera.x,dy=y-camera.y,cs=Math.cos(camera.angle),sn=Math.sin(camera.angle),depth=dx*cs+dy*sn;if(depth<=.075)return null;
 const lateral=-dx*sn+dy*cs,focal=w/(2*Math.tan(41*Math.PI/180)),cx=w/2+lateral*focal/depth,top=(camera.horizon??h/2)-(z+height-camera.eye)*focal/depth;
 return {depth,x:cx-width*focal/depth/2,y:top,w:width*focal/depth,h:height*focal/depth};
}
export function visibleColumns(depth,rect,w=depth.length){const spans=[];for(let x=Math.max(0,Math.floor(rect.x));x<Math.min(w,Math.ceil(rect.x+rect.w));x++)if(rect.depth<depth[x]-.015)spans.push(x);return spans}
