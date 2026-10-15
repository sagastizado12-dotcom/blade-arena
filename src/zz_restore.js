// ===== v30 Restore Nethervale: great spell cutscene, land heals, demons live as townsfolk, lasting peace =====
const RST_ROOF=[["#c8402a","#8a2a1a"],["#4a7ad8","#2a4a98"],["#5a9a4a","#2e6a2a"]];
function canRestore(){try{const K=kState();return K.crowns.includes(DEMON_K())&&!(world.restored&&world.restored.done);}catch(_){return false;}}
function rstTile(x,y){const i=y*WW+x,t=T[i];if(t===MUD){T[i]=hash2(x,y,707)<0.08?TREE:hash2(x,y,708)<0.012?SHAL:GRASS;return true;}if(t===DEADTREE){T[i]=TREE;return true;}return false;}
function rstArea(cx,cy,r0,r1){const x0=Math.max(560,cx-r1|0),x1=Math.min(WW-1,cx+r1|0),y0=Math.max(440,cy-r1|0),y1=Math.min(WH-1,cy+r1|0);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=Math.hypot(x-cx,y-cy);if(d<r0||d>r1)continue;if(kingdomAt(x,y)!==3)continue;if(rstTile(x,y)&&!(x&7)&&!(y&7))invalidateTile(x,y);}}
function rstAll(){const k=DEMON_K();for(let y=440;y<WH;y++)for(let x=560;x<WW;x++)if(kingdomAt(x,y)===3)rstTile(x,y);try{chunkCache.clear();}catch(_){}
  for(const S of SETS)if(kOf(S.id)===k){S.roof=RST_ROOF[S.id%3];S.wall="#f4e6c8";world.sets[S.id].settled=true;}try{bldCache.clear();}catch(_){}try{buildWorldMap();}catch(_){}
  for(const n of npcs)if(n.demon){n.peaceful=true;n.townsfolk=true;n.chasingHero=false;}}
let RST=null;
function restoreNethervale(){if(!canRestore())return false;const S=SETS[KINGDOMS[DEMON_K()].cap];closeMenu();
  hero.x=S.x*TILE;hero.y=(S.y+3)*TILE;RST={f:0,cx:S.x,cy:S.y+3,r:0};world.restored={day:world.day,done:false};
  toast("✨ You raise your hands and speak the Great Renewal...");try{SFX.levelUp&&SFX.levelUp();}catch(_){}return true;}
function finishRestore(){const k=DEMON_K(),K=kState();rstAll();world.restored.done=true;K.demonPeace=true;K.demonFallen=true;for(const q in K.war)delete K.war[q];try{syncWar();}catch(_){}
  for(const ws of world.sets)if(ws.raid&&ws.raid.demon)ws.raid=null;
  addNews(KINGDOMS[k].cap,"Nethervale is restored! Green fields where ash once lay. Demons and humans now live in peace.");
  for(const q of KINGDOMS)if(!q.demon)addNews(q.cap,`${q.name} signs a lasting peace with Nethervale.`);
  try{jAdd("Restored Nethervale with the Great Renewal. Its demon folk now farm, trade and raise families in peace.");}catch(_){}
  P.fame=(P.fame||0)+100;toast("🌿 Nethervale is reborn! Peace with all kingdoms. +100 fame");RST=null;try{saveGame();}catch(_){}}
{const _u=update;update=function(){if(RST){RST.f++;const r1=RST.f*1.4;rstArea(RST.cx,RST.cy,RST.r,r1);RST.r=r1;shake=Math.max(shake,2);
    if(RST.f%3===0)for(let i=0;i<6;i++){const a=Math.random()*7;particles.push({x:hero.x+6+Math.cos(a)*r1*16*.2,y:hero.y+6+Math.sin(a)*r1*16*.2,z:10,vx:Math.cos(a),vy:Math.sin(a),vz:.3,life:30,max:30,col:[255,250,190],size:3,kind:"magic"});}
    if(RST.f>=180)finishRestore();return;}
  _u();};}
{const _d=draw;draw=function(){_d();if(!RST||!hero)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);const r=RST.r*16;const g=ctx.createRadialGradient(hero.x+6,hero.y+6,Math.max(0,r-40),hero.x+6,hero.y+6,r+10);
  g.addColorStop(0,"rgba(255,255,220,0)");g.addColorStop(.8,"rgba(255,250,200,.55)");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.fillRect(hero.x-r-20,hero.y-r-20,2*r+52,2*r+52);
  ctx.fillStyle="rgba(255,250,200,.9)";ctx.beginPath();ctx.arc(hero.x+6,hero.y-4,6+Math.sin(RST.f*.3)*2,0,7);ctx.fill();ctx.restore();};}
{const _dr=demonRaid;demonRaid=function(sid){if(world.restored&&world.restored.done)return null;return _dr(sid);};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(world&&world.restored&&world.restored.done)rstAll();}catch(e){console.error(e);}return r;};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if((t==="Paused"||t==="♛ Ruler")&&Array.isArray(b)&&world&&canRestore()&&!RST)b=[{l:"✨ Restore Nethervale",f:()=>restoreNethervale()}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
