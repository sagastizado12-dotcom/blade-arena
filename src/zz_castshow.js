// ===== v73 SPELL SHOW: short original phases — sigil, travel mark, hit, fade.
// Drawn shapes only, culled to the view, capped. Does not change damage, mana, cooldowns, or charged Black Hole.
const SHOW=[];
function pushShow(o){if(SHOW.length>32)SHOW.shift();SHOW.push(o);}
function markHit(e,col){if(!e||SHOW.length>32)return;pushShow({kind:"hit",x:(e.x||0)+(e.w||12)/2,y:(e.y||0)+(e.h||8)/3,life:11,max:11,col:col||[255,236,180]});}
{const _sh=spellHit;spellHit=function(e,dmg,ang){const r=_sh.apply(this,arguments);try{markHit(e,[255,210,120]);}catch(_){}return r;};}
{const _h41=hit41;hit41=function(e,d,ang,st){const r=_h41.apply(this,arguments);try{markHit(e,[210,230,255]);}catch(_){}return r;};}
{const _cs=castSpell;castSpell=function(k){const ok=_cs.apply(this,arguments);try{if(ok!==false&&hero){const key=k||curSpell;const col=(SPELLS[key]&&SPELLS[key].col)||[255,220,140];
  pushShow({kind:"sigil",x:hero.x+6,y:hero.y+8,life:14,max:14,col});}}catch(_){}return ok;};}
function onView(x,y){return hero&&Math.abs(x-hero.x)<W+40&&Math.abs(y-hero.y)<H+40;}
{const _u=update;update=function(){
  let fires=[],holes=[];
  try{fires=fx.filter(f=>f.k==="fireball"||f.k==="air");holes=(typeof SP41!=="undefined"?SP41:[]).filter(p=>p.k==="blackhole"&&p.phase==="vortex"&&p.life<=1);}catch(_){}
  const r=_u.apply(this,arguments);
  try{
    for(const f of fires)if(!fx.includes(f))pushShow({kind:"boom",x:f.x,y:f.y,life:14,max:14,col:f.k==="air"?[180,255,220]:[255,120,40],r:6+(f.r||4)});
    for(const h of holes)if(!SP41.includes(h))pushShow({kind:"collapse",x:h.x,y:h.y-6,life:18,max:18});
    for(let i=SHOW.length-1;i>=0;i--)if(--SHOW[i].life<=0)SHOW.splice(i,1);
  }catch(_){}
  return r;};}
function pixOrb(x,y,col,n){ctx.fillStyle=`rgb(${col[0]|0},${col[1]|0},${col[2]|0})`;ctx.fillRect(x-1,y-1,3,3);ctx.fillStyle="#fff8e0";ctx.fillRect(x,y-2,1,1);ctx.fillRect(x-2,y,1,1);ctx.fillRect(x+2,y,1,1);ctx.fillRect(x,y+2,1,1);
  if(n){ctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},.55)`;ctx.fillRect(x-n-1,y,1,1);ctx.fillRect(x+n+1,y,1,1);}}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(!hero||state!=="play"||room)return r;
  if(P&&P.fly>=32)return r;
  ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);ctx.imageSmoothingEnabled=false;
  if(typeof fx!=="undefined")for(const f of fx){if(!onView(f.x,f.y))continue;
    if(f.k==="fireball")pixOrb(f.x,f.y-6,f.col||[255,140,40],2);
    else if(f.k==="air"){ctx.save();ctx.translate(f.x,f.y-6);ctx.rotate(f.ang||0);ctx.strokeStyle="#e8fff4";ctx.lineWidth=1;ctx.beginPath();ctx.arc(-2,0,7,-1,1);ctx.stroke();ctx.restore();}}
  if(typeof SP41!=="undefined")for(const p of SP41){if(p.k!=="blackhole"||!onView(p.x,p.y))continue;ctx.save();ctx.translate(p.x,p.y-6);
    if(p.phase==="fly"){pixOrb(0,0,[90,40,140],1);ctx.strokeStyle="rgba(180,120,255,.8)";ctx.beginPath();ctx.arc(0,0,5,p.t||0,(p.t||0)+2);ctx.stroke();}
    else{const spin=(p.t||0)*0.15;ctx.strokeStyle="rgba(160,90,255,.75)";ctx.beginPath();ctx.ellipse(0,2,18,6,spin,0,7);ctx.stroke();
      ctx.strokeStyle="rgba(40,10,60,.9)";ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.stroke();
      for(let i=0;i<6;i++){const a=spin+i*1.047,rr=10+((i+p.t)%4);ctx.fillStyle=i%2?"#d0a0ff":"#6a30a0";ctx.fillRect(Math.cos(a)*rr,Math.sin(a)*rr*0.45,2,2);}}
    ctx.restore();}
  if(typeof COMBO_FX!=="undefined")for(const f of COMBO_FX){if(!onView(f.x,f.y))continue;const p=f.t/50;ctx.save();ctx.globalAlpha=1-p;ctx.translate(f.x,f.y);ctx.rotate(-p*3);
    ctx.strokeStyle="#ffe9a0";ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,Math.max(6,f.r*(0.45+0.2*p)),0.2,2.4);ctx.stroke();ctx.restore();}
  for(const s of SHOW){if(!onView(s.x,s.y))continue;const a=s.life/s.max;ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.translate(s.x,s.y);
    if(s.kind==="sigil"){ctx.rotate((1-a)*2);ctx.strokeStyle=`rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;ctx.strokeRect(-4,-4,8,8);ctx.rotate(0.8);ctx.strokeRect(-2,-2,4,4);}
    else if(s.kind==="hit"){ctx.strokeStyle=`rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(5,4);ctx.moveTo(5,-4);ctx.lineTo(-5,4);ctx.stroke();}
    else if(s.kind==="boom"){const rr=(s.r||8)*(1.4-a*0.6);ctx.strokeStyle=`rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;ctx.beginPath();ctx.arc(0,0,rr,0,7);ctx.stroke();pixOrb(0,0,s.col,0);}
    else if(s.kind==="collapse"){const rr=4+a*16;ctx.strokeStyle=`rgba(180,110,255,${a})`;ctx.beginPath();ctx.arc(0,0,rr,0,7);ctx.stroke();ctx.fillStyle=`rgba(8,4,16,${1-a})`;ctx.beginPath();ctx.arc(0,0,Math.max(2,8*a),0,7);ctx.fill();}
    ctx.restore();}
  ctx.restore();}catch(e){try{ctx.restore();}catch(_){}}
  return r;};}
