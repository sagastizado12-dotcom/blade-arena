// ===== v52 Phase 6: spell combos — cast two spells within 3 seconds to fuse them =====
const COMBOS=[
 {a:"frost",b:"thunder",k:"shatter",n:"Shatterstorm",ic:"❄⚡",d:"Lightning shatters frozen foes: heavy damage and a long stun.",mult:2.2,r:70,stun:120},
 {a:"fireball",b:"air",k:"firestorm",n:"Firestorm",ic:"🔥🌪",d:"Wind whips the flames into a burning vortex that keeps scorching.",mult:1.4,r:80,burn:180},
 {a:"frost",b:"fireball",k:"steam",n:"Steam Burst",ic:"❄🔥",d:"Ice meets fire: a scalding blast that blinds and slows everything near.",mult:1.2,r:90,slow:240},
 {a:"quake",b:"meteor",k:"cataclysm",n:"Cataclysm",ic:"⛰☄",d:"The meteor lands on broken ground: a huge blast that flings foes away.",mult:2.6,r:110,knock:6},
 {a:"air",b:"thunder",k:"tempest",n:"Tempest",ic:"🌪⚡",d:"Lightning rides the wind and jumps between every foe in reach.",mult:1.6,r:140},
 {a:"heal",b:"blade",k:"blessed",n:"Blessed Blades",ic:"✚🗡",d:"Spirit blades blessed with light: they cut foes and mend you for each hit.",mult:1.3,r:90,lifesteal:1},
 {a:"blackhole",b:"meteor",k:"singular",n:"Singularity",ic:"🌀☄",d:"A meteor falls into the black hole: everything is pulled in, then crushed.",mult:2.8,r:120,pull:1},
 {a:"quake",b:"frost",k:"permafrost",n:"Permafrost",ic:"⛰❄",d:"The cracked ground freezes solid: foes are rooted in place.",mult:1.2,r:100,stun:200}];
const COMBO_WIN=3000;let LAST_CAST=null;const COMBO_FX=[];
const comboOf=(a,b)=>COMBOS.find(c=>c.a===a&&c.b===b||c.a===b&&c.b===a);
const foes=()=>mobs.filter(e=>!e.dead&&!e.pet&&!e.tamed&&e.def&&e.def.beh!=="pea"&&e.def.beh!=="flee"&&!e.duelNpc);
function fireCombo(c){const cx0=hero.x+6,cy0=hero.y+6;let best=null,bd=220;for(const e of foes()){const d=Math.hypot(e.x+e.w/2-cx0,e.y+e.h/2-cy0);if(d<bd){bd=d;best=e;}}
  const cx=best?best.x+best.w/2:cx0,cy=best?best.y+best.h/2:cy0;const lv=Math.max(spellLv(c.a),spellLv(c.b));const dmg=Math.round((3+lv)*c.mult);let hit=0;
  for(const e of foes()){const ex=e.x+e.w/2,ey=e.y+e.h/2,d=Math.hypot(ex-cx,ey-cy);if(d>c.r)continue;const ang=Math.atan2(ey-cy,ex-cx);
    if(c.pull){e.x+=(cx-ex)*0.6;e.y+=(cy-ey)*0.6;}
    try{if(e.sp==="dragon"&&typeof hitDragon==="function")hitDragon(e,dmg);else{e.iframes=0;hurtEnemy(e,dmg,ang,true);}}catch(_){}hit++;
    if(c.stun)e.stun=Math.max(e.stun||0,c.stun);if(c.slow)e.slowT=Math.max(e.slowT||0,c.slow);if(c.burn)e.cburnT=c.burn;if(c.knock){e.knockT=14;e.knockVx=Math.cos(ang)*c.knock;e.knockVy=Math.sin(ang)*c.knock;}
    if(c.lifesteal){P.hp=Math.min(P.maxHp||P.hp,(P.hp||0)+2);try{hero.hp=Math.min(hero.maxHp||99,hero.hp+2);}catch(_){}}}
  COMBO_FX.push({x:cx,y:cy,r:c.r,t:0,c});floatText(cx-20,cy-30,`✨ ${c.n}!`,"#ffe66a");try{SFX.chime();}catch(_){}
  P.combos=P.combos||{};const first=!P.combos[c.k];P.combos[c.k]=(P.combos[c.k]||0)+1;if(first){toast(`✨ New spell combo discovered: ${c.ic} ${c.n}!`);try{jAdd(`I fused two spells into something new: ${c.n}.`,"magic");}catch(_){}}
  return hit;}
{const _cs=castSpell;castSpell=function(k){const mp0=P&&P.mag?P.mag.mp:0;const r=_cs.apply(this,arguments);try{const kk=typeof slotFor==="function"?slotFor(k||curSpell):(k||curSpell);if(r!==false&&P.mag.mp<mp0){const now=performance.now();
  if(LAST_CAST&&now-LAST_CAST.t<COMBO_WIN&&LAST_CAST.k!==kk){const c=comboOf(LAST_CAST.k,kk);if(c){fireCombo(c);LAST_CAST=null;return r;}}LAST_CAST={k:kk,t:now};}}catch(e){console.warn(e);}return r;};}
// burning DoT from Firestorm
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play")return;for(const e of mobs){if(e.cburnT>0&&!e.dead){e.cburnT--;if(e.cburnT%45===0){e.iframes=0;hurtEnemy(e,1,0,false);}}}for(let i=COMBO_FX.length-1;i>=0;i--)if(++COMBO_FX[i].t>50)COMBO_FX.splice(i,1);}catch(_){}};}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{for(const f of COMBO_FX){list.push({y:f.y+999,f:()=>{const p=f.t/50;ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle={shatter:"#a8e8ff",firestorm:"#ff7a2a",steam:"#e8f0f0",cataclysm:"#c87a3a",tempest:"#ffe66a",blessed:"#fff6b0",singular:"#a05aff",permafrost:"#6ac8ff"}[f.c.k];
  ctx.lineWidth=4*(1-p)+1;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.3+0.7*p),0,6.283);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*0.5*(0.3+0.7*p),0,6.283);ctx.stroke();
  for(let i=0;i<10;i++){const a=i*0.628+p*4,rr=f.r*p;ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(f.x+Math.cos(a)*rr-2,f.y+Math.sin(a)*rr-2,4,4);}ctx.restore();}});}}catch(_){}};}
// Spellbook: combo list (discovered ones named, others hinted)
function combosText(){const C=P.combos||{};return "✨ Spell combos — cast the two spells within 3 s:\n"+COMBOS.map(c=>C[c.k]?`${c.ic} ${c.n} (${SPELLS[c.a]?SPELLS[c.a].n:c.a} + ${SPELLS[c.b]?SPELLS[c.b].n:c.b}) — ${c.d} · used ${C[c.k]}×`:`❔ ??? — try ${SPELLS[c.a]?SPELLS[c.a].ic:"?"} with something else`).join("\n")+`\nDiscovered ${Object.keys(C).length}/${COMBOS.length}`;}
function combosMenu(){showMenu("✨ Spell combos",combosText(),[{l:"◂ Spellbook",f:()=>spellbookMenu()},{l:"Close"}]);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="📖 Spellbook"&&Array.isArray(b)&&!b.some(o=>o&&o._cmb)){b=[{_cmb:1,l:`✨ Combos (${Object.keys(P.combos||{}).length}/${COMBOS.length})`,f:combosMenu}].concat(b);}}catch(_){}return _sm.call(this,t,x,b);};}
