// ===== v61 WARS STAY ON LAND + A REVERSIBLE WAR DEMO =====
// frontOf used to drop the battle on the straight line between two towns, which
// crosses rivers, lakes, and the sea. Every reader (map, forts, knights, kings,
// soldier stand/flee) now gets that point pulled onto the nearest walkable land
// tile. Offsets that would step back into the water are pulled out too.
// Bridges, piers, ice, and shallows are crossings, not places to fight.
// Pause > Wars > "⚔ War demo" starts one practice war. "End demo" (only while
// it is running) deletes that war, its soldiers, and the demo crown order,
// and puts the two crowns back. It does not capture towns or sign a treaty.
const LAND_MEM=new Map();
function fightTile(tx,ty){tx|=0;ty|=0;if(typeof T==="undefined"||!T||tx<0||ty<0||tx>=WW||ty>=WH)return false;const t=T[ty*WW+tx];
  if(t===DEEP||t===SHAL||t===BRIDGE||t===PIER||t===ICE)return false;
  try{if(typeof iceAt==="function"&&iceAt(tx,ty))return false;}catch(_){}
  try{if(typeof walk==="function"&&!walk(tx,ty))return false;}catch(_){return false;}
  return true;}
function marchTile(tx,ty){tx|=0;ty|=0;if(tx<0||ty<0||tx>=WW||ty>=WH)return false;const t=T[ty*WW+tx];
  if(t===DEEP||t===SHAL||t===PIER||t===ICE)return false;
  try{if(typeof iceAt==="function"&&iceAt(tx,ty))return false;}catch(_){}
  return typeof walk==="function"?walk(tx,ty):false;}
function nearestTile(tx,ty,R,tag,ok){tx|=0;ty|=0;R=R||48;const key=tag+":"+tx+","+ty+":"+R;if(LAND_MEM.has(key))return LAND_MEM.get(key);
  let found=null;if(ok(tx,ty))found=[tx,ty];else{for(let r=1;r<=R&&!found;r++){let best=null,bk=null;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(!ok(x,y))continue;
      const t=T[y*WW+x];const prefer=(t===GRASS||t===FLOWER||t===ROAD||t===COBBLE||t===FARM||t===FOREST)?0:1;const man=Math.abs(dx)+Math.abs(dy);
      if(!best||prefer<bk[0]||(prefer===bk[0]&&man<bk[1])||(prefer===bk[0]&&man===bk[1]&&x<bk[2])||(prefer===bk[0]&&man===bk[1]&&x===bk[2]&&y<bk[3])){best=[x,y];bk=[prefer,man,x,y];}}
    if(best)found=best;}}
  if(LAND_MEM.size>5000)LAND_MEM.clear();if(found)LAND_MEM.set(key,found);return found;}
function landFrontPoint(raw){if(fightTile(raw.x,raw.y))return[raw.x,raw.y];
  const n=nearestTile(raw.x,raw.y,48,"f",fightTile);if(n)return n;
  let best=null,bd=1e9;for(const S of [raw.s,raw.t]){if(!S)continue;const steps=Math.max(1,Math.abs(S.x-raw.x),Math.abs(S.y-raw.y));
    for(let i=1;i<=steps;i++){const x=Math.round(raw.x+(S.x-raw.x)*i/steps),y=Math.round(raw.y+(S.y-raw.y)*i/steps);if(!fightTile(x,y))continue;const d=Math.hypot(x-raw.x,y-raw.y);if(d<bd){bd=d;best=[x,y];}break;}}
  if(best)return best;const S=raw.s||raw.t;if(S){const n2=nearestTile(S.x,S.y,16,"f",fightTile);return n2||[S.x,S.y];}return[raw.x,raw.y];}
function warLandPx(px,py){const tx=Math.floor(px/TILE),ty=Math.floor(py/TILE);if(fightTile(tx,ty))return{x:px,y:py};
  const n=nearestTile(tx,ty,36,"f",fightTile);if(!n)return{x:px,y:py};return{x:n[0]*TILE+8,y:n[1]*TILE+8};}
const _frontOf61=frontOf;const FRONT_MEM=new Map();
frontOf=function(w){const raw=_frontOf61(w);const key=raw.x+","+raw.y;let xy=FRONT_MEM.get(key);
  if(!xy){xy=landFrontPoint(raw);if(FRONT_MEM.size>400)FRONT_MEM.clear();FRONT_MEM.set(key,xy);}
  return{x:xy[0],y:xy[1],s:raw.s,t:raw.t,ang:raw.ang};};
const _slotPos61=slotPos;slotPos=function(w,m){const p=_slotPos61(w,m);return warLandPx(p.x,p.y);};
function pullMen(men){if(!men)return;for(const m of men){if(m.x==null||m.y==null)continue;const tx=Math.floor(m.x/TILE),ty=Math.floor(m.y/TILE);if(fightTile(tx,ty))continue;const n=nearestTile(tx,ty,24,"f",fightTile);if(n){m.x=n[0]*TILE+8;m.y=n[1]*TILE+8;}}}
const _battleStep61=battleStep;battleStep=function(w){const B=_battleStep61.apply(this,arguments);try{if(B)pullMen(B.men);}catch(_){}return B;};
const _rebelStep61=rebelStep;rebelStep=function(r){const B=_rebelStep61.apply(this,arguments);try{if(B)pullMen(B.men);}catch(_){}return B;};
const _frontGoal61=frontGoal;frontGoal=function(w,k){const f=frontOf(w);const g=_frontGoal61(w,k);let x=g?g.x:f.x,y=g?g.y:f.y;
  if(!fightTile(x,y)){const n=nearestTile(x,y,16,"f",fightTile);if(n){x=n[0];y=n[1];}else{x=f.x;y=f.y;}}
  if(Math.hypot(x-f.x,y-f.y)>12){let best=[f.x,f.y],bd=Math.hypot(x-f.x,y-f.y)||1;for(let i=1;i<=8;i++){const sx=Math.round(f.x+(x-f.x)*i/bd),sy=Math.round(f.y+(y-f.y)*i/bd);if(fightTile(sx,sy)&&Math.hypot(sx-f.x,sy-f.y)<=10)best=[sx,sy];}return{x:best[0],y:best[1]};}
  return{x,y};};
const _kingStep61=kingStep;kingStep=function(k){const C=world.crown&&world.crown[k];if(!C)return _kingStep61(k);const ox=C.x,oy=C.y;const r=_kingStep61(k);
  if(C&&!marchTile(C.x,C.y)){C.x=ox;C.y=oy;const dx=Math.sign(C.gx-C.x),dy=Math.sign(C.gy-C.y);let moved=false;
    for(const [a,c] of [[dx,dy],[dx,0],[0,dy],[-dy,dx],[dy,-dx],[-dx,0],[0,-dy]]){if((a||c)&&marchTile(C.x+a,C.y+c)){C.x+=a;C.y+=c;moved=true;break;}}
    if(!moved||!marchTile(C.x,C.y)){const n=nearestTile(C.x,C.y,16,"m",marchTile);if(n){C.x=n[0];C.y=n[1];}}}
  return r||C;};
const _updateMob61=updateMob;updateMob=function(e){const r=_updateMob61.apply(this,arguments);try{if(e&&e.war49&&!e.dead){const tx=Math.floor(e.x/TILE),ty=Math.floor(e.y/TILE);if(!fightTile(tx,ty)){const n=nearestTile(tx,ty,20,"f",fightTile);if(n){e.x=n[0]*TILE+8;e.y=n[1]*TILE+8;e.warFlee=0;}}}}catch(_){}return r;};
const _capture61=capture;capture=function(w,att,def){if(w&&w.demo){w.p=Math.max(-0.8,Math.min(0.8,w.p));return null;}return _capture61.apply(this,arguments);};
function demoWar(){return(world&&world.wars||[]).find(w=>w&&w.demo&&!w.over)||null;}
function crownCopy(k){const C=world.crown&&world.crown[k];return C?{o:C.o,why:C.why,x:C.x,y:C.y,gx:C.gx,gy:C.gy,d:C.d}:null;}
function endWarDemo(silent){const w=demoWar();if(!w){if(!silent){toast("No war demo is running.");try{conflictsMenu();}catch(_){}}return false;}
  w._demoEnding=1;const snap=w.demoSnap,id=w.id,a=w.a,b=w.b;w.over=true;w.demo=0;
  if(world.wars)world.wars=world.wars.filter(q=>q.id!==id);
  try{battleReset(w);}catch(_){}try{delete BFIELD[id];}catch(_){}
  try{for(const m of mobs)if(m&&m.war49===id)m.dead=true;}catch(_){}
  if(snap&&snap.crowns){world.crown=world.crown||{};for(const k of [a,b]){if(snap.crowns[k])world.crown[k]=snap.crowns[k];else delete world.crown[k];}}
  if(snap&&snap.treatyKeys&&world.treaties){const keep=new Set(snap.treatyKeys);world.treaties=world.treaties.filter(t=>keep.has(pairKey(t.a,t.b)+":"+t.kind+":"+t.until));}
  if(world.cq)world.cq=world.cq.filter(q=>!(q&&q.text&&/[Ww]ar demo|practice front/.test(q.text)));
  try{addNews(-1,"The war demo is over. No towns changed hands.");}catch(_){}
  if(!silent){toast("End demo: the practice war is over. The front, the soldiers, and the demo order are gone.");try{conflictsMenu();}catch(_){}}
  return true;}
const _endWar61=endWar;endWar=function(w,kind,quiet){if(w&&w.demo&&!w._demoEnding)return endWarDemo(true);return _endWar61.apply(this,arguments);};
function demoPair(){const H=HUMAN_K();const scored=[];for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){const a=H[i],b=H[j];
  if(warOf(a,b)||treatyOf(a,b)||!canStartConflict("war",[a,b]))continue;
  let wet=false,near="";try{const raw=_frontOf61({id:0,a,b,p:0,over:false});wet=!fightTile(raw.x,raw.y);near=raw.s&&raw.s.name||"";}catch(_){}
  scored.push({a,b,wet,prefer:(a===0&&b===1)?1:0,near});}
  scored.sort((p,q)=>(q.wet-p.wet)||(q.prefer-p.prefer));return scored[0]||null;}
function startWarDemo(){const cur=demoWar();if(cur){const f=frontOf(cur);toast("⚔ The war demo is already on the fields near "+(f.s?f.s.name:"the town")+". End demo in the Wars menu when you are done.");
  const ok=warpTo(f.x*TILE,f.y*TILE,"the war demo");if(!ok){hero.x=f.x*TILE+2;hero.y=f.y*TILE+2;hero.boat=false;}return cur;}
  const pair=demoPair();if(!pair){toast("⚔ Can't start a war demo. The conflict caps are full, or every neighbour is already at war or under a treaty.");try{conflictsMenu();}catch(_){}return null;}
  world.crown=world.crown||{};const snap={crowns:{},treatyKeys:(world.treaties||[]).map(t=>pairKey(t.a,t.b)+":"+t.kind+":"+t.until),warIds:(world.wars||[]).filter(w=>!w.over).map(w=>w.id)};
  snap.crowns[pair.a]=crownCopy(pair.a);snap.crowns[pair.b]=crownCopy(pair.b);
  const w=startWar(pair.a,pair.b,"a war demo");if(!w){toast("⚔ The war demo couldn't start.");try{conflictsMenu();}catch(_){}return null;}
  w.demo=1;w.demoSnap=snap;w.demoKing=pair.a;
  if(world.cq&&world.cq.length){const q=world.cq[world.cq.length-1];if(q&&q.text&&/declared war/.test(q.text))world.cq.pop();}
  const f=frontOf(w);const msg=`War demo: ${KINGDOMS[pair.a].name} and ${KINGDOMS[pair.b].name} drill on the fields near ${f.s.name}. Practice only — it will not capture towns. Press End demo in the Wars menu to put your world back.`;
  try{addNews(-1,msg);}catch(_){}toast("⚔ "+msg);
  try{setKing(pair.a,"march","demo",frontGoal(w,pair.a));}catch(e){console.warn(e);}
  // Keep the other crown off this field so that side is not rallied: some soldiers hold, some run.
  const other=world.crown[pair.b];if(other){const home=capitalAnchor(pair.b);other.o="court";other.why="peace";other.x=home.x;other.y=home.y;other.gx=home.x;other.gy=home.y;}
  const C=world.crown[pair.a];if(C){C.x=C.gx;C.y=C.gy;}
  try{battleReset(w);w.p=0;battleStep(w);}catch(e){console.warn(e);}
  const ok=warpTo(f.x*TILE,f.y*TILE,"the war demo near "+f.s.name);if(!ok){hero.x=f.x*TILE+2;hero.y=f.y*TILE+2;hero.boat=false;toast("⚔ Walk to the practice front near "+f.s.name+".");}
  return w;}
function demoMenu(w){const f=frontOf(w);const A=KINGDOMS[w.a],B=KINGDOMS[w.b];let report="";try{report=fieldReport(w);}catch(_){}
  const kid=w.demoKing!=null?w.demoKing:w.a;const C=world.crown&&world.crown[kid];const order=C&&C.o&&C.o!=="court"?orderLine(kid,C.o,C.why):"";
  showMenu("⚔ War demo",`Practice line near ${f.s.name} and ${f.t.name}. ${A.name} and ${B.name} are drilling on land. This demo does not capture towns. End demo removes it and puts the crowns back.\n\nOn the field:\n${report}${order?"\n\nCrown orders:\n♛ "+order:""}`,
    [{l:"🌌 Teleport to the front",f:()=>warpTo(f.x*TILE,f.y*TILE,"the war demo")},{l:"End demo",f:()=>endWarDemo()},{l:"Back",f:conflictsMenu}]);}
const _warMenu61=warMenu;warMenu=function(w){if(w&&w.demo&&!w.over)return demoMenu(w);return _warMenu61.apply(this,arguments);};
const _showMenu61=showMenu;showMenu=function(t,x,b){try{if(t==="⚔ Wars & Rebellions"&&Array.isArray(b)&&world){b=b.slice();const demo=demoWar();
  if(demo){const tag="⚔ "+KINGDOMS[demo.a].name+" vs "+KINGDOMS[demo.b].name;b=b.map(btn=>btn&&btn.l===tag?{...btn,l:"⚔ War demo: "+KINGDOMS[demo.a].name+" vs "+KINGDOMS[demo.b].name}:btn);
    x=(x||"")+"\n\nWar demo is a practice front on land. End demo removes only that war and restores the crowns. Towns are not captured.";}
  else x=(x||"")+"\n\n⚔ War demo starts a practice battle on land near a town. End demo appears beside it while the demo is running.";
  const at=b.findIndex(o=>o&&o.l==="Close");const i=at<0?b.length:at;const row=[{l:"⚔ War demo",f:()=>startWarDemo()}];if(demo)row.push({l:"End demo",f:()=>endWarDemo()});b.splice(i,0,...row);}}catch(_){}
  return _showMenu61.call(this,t,x,b);};
function sampleFront(a,b,p){const fake={id:1,a,b,p,over:false};const raw=_frontOf61(fake);const f=frontOf(fake);const pts=[];
  const ang=f.ang,nx=-Math.sin(ang),ny=Math.cos(ang);
  for(let k=-3;k<=3;k++){const q=warLandPx((f.x+nx*k*5)*TILE,(f.y+ny*k*5)*TILE);pts.push([Math.floor(q.x/TILE),Math.floor(q.y/TILE)]);}
  for(let side=0;side<2;side++)for(let i=0;i<6;i++)for(const st of ["hold","flee"]){const q=slotPos(fake,{side,i,st});pts.push([Math.floor(q.x/TILE),Math.floor(q.y/TILE)]);}
  const g=frontGoal(fake,a);return{rawWet:!fightTile(raw.x,raw.y),raw:[raw.x,raw.y],front:[f.x,f.y],town:f.s&&f.s.name,other:f.t&&f.t.name,king:[g.x,g.y],pts,frontWet:!fightTile(f.x,f.y),kingWet:!fightTile(g.x,g.y),slotWet:pts.some(p=>!fightTile(p[0],p[1]))};}
window.__WAR61={startWarDemo,endWarDemo,demoWar,fightTile,marchTile,warLandPx,rawFront:_frontOf61,sampleFront,nearestFight:(x,y,r)=>nearestTile(x,y,r||48,"f",fightTile)};
