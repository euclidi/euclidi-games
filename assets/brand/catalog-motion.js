/* Catalog-only motion. No gameplay state or navigation changes. */
(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const replay=document.getElementById('crt-replay');
 const overlay=document.createElement('div');overlay.className='eg-crt';overlay.setAttribute('aria-hidden','true');
 const line=document.createElement('div');line.className='eg-crt-line';overlay.append(line);document.body.append(overlay);
 let generation=0;
 function stop(){generation++;overlay.classList.remove('is-playing');}
 function startup(){
   if(preference.matches)return;
   const current=++generation;
   overlay.classList.remove('is-playing');void overlay.offsetWidth;overlay.classList.add('is-playing');
   // Timer is only a cleanup fallback; animation duration is defined in CSS.
   setTimeout(()=>{if(current===generation)stop();},1250);
 }
 function sync(){replay.hidden=false;replay.disabled=preference.matches;replay.textContent=preference.matches?'Motion reduced':'Replay CRT';if(preference.matches){stop();document.querySelectorAll('.is-tilted').forEach(x=>x.classList.remove('is-tilted'));}}
 replay.addEventListener('click',startup);
 preference.addEventListener('change',sync);fine.addEventListener('change',()=>document.querySelectorAll('.is-tilted').forEach(x=>x.classList.remove('is-tilted')));
 sync();
 for(const card of document.querySelectorAll('.game')){
   card.addEventListener('pointermove',event=>{
     if(preference.matches||!fine.matches||event.pointerType==='touch')return;
     // Use the untransformed layout footprint to avoid pointer/tilt feedback jitter.
     const box=card.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight;
     const x=Math.max(-1,Math.min(1,(event.clientX-(box.left+box.width/2))/(w/2)));
     const y=Math.max(-1,Math.min(1,(event.clientY-(box.top+box.height/2))/(h/2)));
     card.style.setProperty('--tilt-x',(-y*10).toFixed(2)+'deg');
     card.style.setProperty('--tilt-y',(x*12).toFixed(2)+'deg');
     card.classList.add('is-tilted');
   },{passive:true});
   const clear=()=>card.classList.remove('is-tilted');card.addEventListener('pointerleave',clear);card.addEventListener('pointercancel',clear);
 }
 // Start after font loading, so a cold page load cannot conceal the effect.
 Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,650))]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(startup)));
})();
