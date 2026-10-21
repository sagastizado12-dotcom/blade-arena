// ===== v57 City-eater: a FULLY charged Black Hole cast in/near a town opens a singularity that drags the town's buildings & walls into ruin =====
// Kids are whisked to safety, adults flee (no one is harmed), enemies in range are crushed. Ruins take a season to rebuild (or pay to rebuild now).
let SING=null;const DEBRIS57=[];const BH_REBUILD_DAYS=90,BH_COST=4000;
function townAt57(px,py){let best=null,bd=1e9;for(const S of SETS){const d=Math.hypot(px/TILE-S.x,py/TILE-S.y);if(d<=S.r+6&&d<bd){bd=d;best=S;}}return best;}
function bhTargets(sid){const S=SETS[sid],cx=S.x*TILE,cy=S.y*TILE;const L=[];
  for(const b of townBlds(sid)){if(owns(b))continue;L.push({k:"b",o:b,d:Math.hypot((b.x+b.w/2)*TILE-cx,(b.y+b.h/2)*TILE-cy),x:(b.x+b.w/2)*TILE,y:(b.y+b.h/2)*TILE});}
  for(const w of townWalls(sid))L.push({k:"w",o:w,d:Math.hypot(w.x*TILE-cx,w.y*TILE-cy),x:w.x*TILE,y:w.y*TILE});
  for(const g of townGates(sid)){const t=g.tiles&&g.tiles[0]||[S.x,S.y];L.push({k:"g",o:g,d:Math.hypot(t[0]*TILE-cx,t[1]*TILE-cy),x:t[0]*TILE,y:t[1]*TILE});}
  return L.sort((a,b)=>b.d-a.d);}// outer ring first, collapsing inward
function kidsToSafety(sid){const S=SETS[sid];const dest=nearTownR(sid,T=>!!ruinOf(T.id)||!!T.demon)||nearTownR(sid);let n=0;
  for(const k of npcs){if(!k.alive||k.s!==sid||!(k.role==="child"||(k.age||0)<18))continue;if(dest){const d=doorOf(buildings[dest.bIdx[0]]);k.x=d.x+(k.id%7)*3;k.y=d.y+10;}k.inside=false;k.safe57=1;n++;}return n;}
function startSingularity(sid,x,y){const S=SETS[sid];const L=bhTargets(sid);SING={sid,x:S.x*TILE,y:S.y*TILE,t:0,dur:300,L,done:0,kids:kidsToSafety(sid)};
  toast(`🌀 The singularity tears open over ${S.name}!`);try{SFX.roar&&SFX.roar();}catch(_){}window.__lastSing=sid;return true;}
function collapse57(T){if(T.k==="b"){world.bld[T.o.id]=world.bld[T.o.id]||{};world.bld[T.o.id].dmg=1;}else if(T.k==="w"){world.walls=world.walls||{};world.walls[T.o.i]=0;OCC[T.o.y*WW+T.o.x]=0;try{invalidateTile(T.o.x,T.o.y);}catch(_){}}else{T.o.hp=0;T.o.broken=1;}
  try{burst(T.x,T.y,[120,100,90],10,2,2.5);}catch(_){}for(let i=0;i<6&&DEBRIS57.length<140;i++)DEBRIS57.push({x:T.x+(Math.random()-.5)*30,y:T.y+(Math.random()-.5)*20,a:Math.random()*6.28,s:2+Math.random()*4,c:["#6a5040","#8a7060","#5a4a40","#a08060"][i%4]});}
function finishSingularity(){const G=SING;if(!G)return;SING=null;for(;G.done<G.L.length;G.done++)collapse57(G.L[G.done]);
  const S=SETS[G.sid];for(const [p,i] of townProps(G.sid))propDmgMap()[i]=1;if(CASTLES.some(c=>c.s===G.sid)||(G.sid===0&&castleObj)){world.cdmg=world.cdmg||{};world.cdmg[G.sid]=1;}
  const ws=world.sets[G.sid];if(!ws.ruin){const slain=npcSlain,dw=declareWar;npcSlain=null;// PG-13: everyone flees, nobody is cut down
    declareWar=function(k,q){if(G.sid===MOD_ID)return;if(!canStartConflict("war",[k])){addNews(G.sid,`${KINGDOMS[k].ruler} seethes at the Destroyer, but ${KINGDOMS[k].name} has no strength left for another war.`);return;}return dw.apply(this,arguments);};
    try{ruinTown(G.sid);}finally{npcSlain=slain;declareWar=dw;}}
  if(ws.ruin)ws.ruin.bh=1;ws.dpct=townDestruction(G.sid);for(const n of npcs){delete n.safe57;delete n.fleeing57;}window.__singDone=(window.__singDone||0)+1;try{saveGame();}catch(_){}}
function castFull57(){const S=townAt57(hero.x+6,hero.y+6);if(!S||room||ruinOf(S.id)||SING)return false;
  if(S.id===MOD_ID){showMenu("🌀 Destroy Moderno?","Your fully charged Black Hole would tear YOUR OWN city of Moderno into ruins. Its people would flee and it would take a season to rebuild.\n\nAre you sure?",[{l:"🌀 Yes — unleash it on Moderno",f:()=>{closeMenu();startSingularity(S.id);}},{l:"No, spare my city"}]);return true;}
  return startSingularity(S.id);}
{const _cc=castCharged;castCharged=function(k,tier){const inRoom=!!room;const full=k==="blackhole"&&(tier|0)>=3&&P.mag&&SPELLS[k]&&P.mag.mp>=SPELLS[k].mp*CH_MULT[3];const r=_cc.apply(this,arguments);try{if(r&&full&&!inRoom)castFull57();}catch(e){console.warn(e);}return r;};}
{const _u=update;update=function(){_u.apply(this,arguments);try{const G=SING;
  for(let i=DEBRIS57.length-1;i>=0;i--){const d=DEBRIS57[i];const cx=G?G.x:d.x,cy=G?G.y:d.y;const dx=cx-d.x,dy=cy-d.y,D=Math.hypot(dx,dy);if(!G||D<10){DEBRIS57.splice(i,1);continue;}const v=Math.min(6,1.5+260/(D+20));d.x+=dx/D*v-dy/D*v*.6;d.y+=dy/D*v+dx/D*v*.6;d.a+=.2;}
  if(!G||state!=="play")return;G.t++;shake=Math.max(shake,3+4*Math.sin(Math.PI*Math.min(1,G.t/G.dur)));
  const want=Math.floor(G.L.length*Math.min(1,G.t/(G.dur*.85)));while(G.done<want)collapse57(G.L[G.done++]);
  const R=(SETS[G.sid].r+5)*TILE;
  if(G.t%10===0)for(const e of foes41()){const d=Math.hypot(e.x+e.w/2-G.x,e.y+e.h/2-G.y);if(d<R){try{hurtEnemy(e,9999,Math.atan2(G.y-e.y,G.x-e.x),false);}catch(_){}}}
  for(const n of npcs){if(!n.alive||n.s!==G.sid||n.safe57)continue;const dx=n.x-G.x,dy=n.y-G.y,D=Math.hypot(dx,dy)||1;if(D<R){n.inside=false;n.x+=dx/D*1.6;n.y+=dy/D*1.6;n.fleeing57=1;}}
  if(G.t>=G.dur)finishSingularity();}catch(e){console.warn(e);SING=null;}};}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{const G=SING;if(!G&&!DEBRIS57.length)return;
  list.push({y:1e7,f:()=>{ctx.save();for(const d of DEBRIS57){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);ctx.fillStyle=d.c;ctx.fillRect(-d.s/2,-d.s/2,d.s,d.s*.7);ctx.restore();}
    if(G){const p=Math.min(1,G.t/40)*(G.t>G.dur-30?(G.dur-G.t)/30:1),R=(40+Math.min(1,G.t/G.dur)*90)*p;
      const g=ctx.createRadialGradient(G.x,G.y,0,G.x,G.y,R*1.6);g.addColorStop(0,"rgba(0,0,0,.95)");g.addColorStop(.45,"rgba(20,0,40,.85)");g.addColorStop(.7,"rgba(110,50,200,.35)");g.addColorStop(1,"rgba(110,50,200,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(G.x,G.y,R*1.6,0,6.283);ctx.fill();ctx.strokeStyle="rgba(190,140,255,.7)";ctx.lineWidth=2;
      for(let i=0;i<5;i++){ctx.beginPath();const a0=G.t*.08+i*1.256;for(let s=0;s<=20;s++){const a=a0+s*.25,r=R*1.5*(1-s/22);const X=G.x+Math.cos(a)*r,Y=G.y+Math.sin(a)*r*.7;s?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();}
      ctx.fillStyle="#000";ctx.beginPath();ctx.arc(G.x,G.y,R*.35,0,6.283);ctx.fill();}ctx.restore();}});}catch(_){}};}
// a save mid-collapse finishes it first (nothing transient is saved)
{const _sg=saveGame;saveGame=function(){if(SING&&!saveGame._in){saveGame._in=1;try{finishSingularity();}finally{saveGame._in=0;}}return _sg.apply(this,arguments);};}
// Black-hole ruins rebuild over a season; walls stay down while they do
{const _rb=rebuildHourly;rebuildHourly=function(){const pre={};for(const S of SETS){const R=ruinOf(S.id);if(R&&R.bh)pre[S.id]=R.progress;}_rb.apply(this,arguments);
  for(const id in pre){const R=ruinOf(+id);if(!R)continue;R.progress=pre[id]+(R.progress-pre[id])*(REBUILD_DAYS/BH_REBUILD_DAYS);}};}
{const _wd=wallDaily;wallDaily=function(){_wd.apply(this,arguments);try{for(const S of SETS){const R=ruinOf(S.id);if(!R||!R.bh)continue;for(const w of townWalls(S.id)){const cap=10*R.progress;if(wallHp(w.i)>cap){world.walls[w.i]=cap;if(cap<=0){OCC[w.y*WW+w.x]=0;}}}}}catch(_){}};}
function rebuildNow(sid){const R=ruinOf(sid);if(!R)return false;if(P.gold<BH_COST){toast(`You need ${BH_COST}g to rebuild ${SETS[sid].name} at once.`);return false;}P.gold-=BH_COST;R.progress=1;R.since=Math.min(R.since,absMin()-25*60);R.bh=0;
  for(const b of townBlds(sid))if(world.bld[b.id])world.bld[b.id].dmg=0;for(const w of townWalls(sid)){world.walls[w.i]=10;OCC[w.y*WW+w.x]=-3;}for(const g of townGates(sid)){g.hp=12;g.broken=0;}
  rebuildHourly();K_rep(10);return true;}
{const _dm=donateMenu;donateMenu=function(sid){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;if(Array.isArray(b)&&ruinOf(sid)){b=b.slice();b.splice(b.length-1,0,{l:`🏗 Rebuild now (${BH_COST}g)`,dis:P.gold<BH_COST,f:()=>{if(rebuildNow(sid))closeMenu();}});if(ruinOf(sid).bh)x+=`\nThe singularity left little standing: it will take about a season to rebuild.`;}return sm(t,x,b);};try{return _dm.apply(this,arguments);}finally{showMenu=sm;}};}
window.__BH57={castCharged:(k,t)=>castCharged(k,t),townAt57,startSingularity,finishSingularity,sing:()=>SING,rebuildNow,donateMenu,ruinOf:s=>ruinOf(s),townBlds,townWalls,dest:s=>townDestruction(s),rebuildHourly:()=>rebuildHourly(),wallHp:i=>wallHp(i),MOD_ID,conflicts:()=>conflicts(),setRoom:r=>{room=r;},getRoom:()=>room,BH_COST};
// collapsed buildings in a singularity ruin are drawn as rubble heaps (footprint unchanged; ids untouched)
{const _db=drawBuilding;drawBuilding=function(b){try{const R=b&&ruinOf(b.s),st=world.bld[b.id];if(R&&R.bh&&st&&st.dmg>=0.9){const x=b.x*16,y=b.y*16,w=b.w*16,h=b.h*16;
  ctx.fillStyle="rgba(30,24,20,.35)";ctx.fillRect(x-2,y+h*.35,w+4,h*.7);
  for(let i=0;i<b.w*b.h*2;i++){const rx=x+hash2(b.id,i,11)*(w-8),ry=y+h*.3+hash2(b.id,i,12)*(h*.7-6),s=4+hash2(b.id,i,13)*7;ctx.fillStyle=["#6e625a","#857565","#5a4c44","#9a8a78","#4a3c34"][i%5];ctx.fillRect(rx,ry,s,s*.7);ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(rx,ry+s*.6,s,2);}
  for(let i=0;i<Math.max(2,b.w);i++){const bx=x+6+hash2(b.id,i,21)*(w-14),by=y+h*.45+hash2(b.id,i,22)*h*.4;ctx.fillStyle="#3e2a1c";ctx.save();ctx.translate(bx,by);ctx.rotate(hash2(b.id,i,23)*3-1.5);ctx.fillRect(-9,-1.5,18,3);ctx.restore();}
  return;}}catch(_){}return _db.apply(this,arguments);};}
