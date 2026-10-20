// ===== v47.2 Moderno rework + NPC pathing + guard shifts =====
// ---- Moderno: clean square wall ring with gatehouses (replaces the round ring for the big city) ----
const MODGH=[];// gatehouse towers {x,y,d}
function squareModWall(){const s=SETS[MOD_ID],R=wallR(s);
  for(const w of WALLS)if(w.s===MOD_ID){const j=w.y*WW+w.x;if(OCC[j]===-3)OCC[j]=0;WALLIDX.delete(j);}
  for(let i=WALLS.length-1;i>=0;i--)if(WALLS[i].s===MOD_ID)WALLS.splice(i,1);WALLS.forEach((w,i)=>{w.i=i;});WALLIDX.clear();for(const w of WALLS)WALLIDX.set(w.y*WW+w.x,w.i);
  for(let i=GATES.length-1;i>=0;i--)if(GATES[i].s===MOD_ID)GATES.splice(i,1);for(let i=TOWERS.length-1;i>=0;i--)if(TOWERS[i].s===MOD_ID)TOWERS.splice(i,1);
  const xa=s.x-R,xb=s.x+1+R,ya=s.y-R,yb=s.y+1+R;MODGH.length=0;
  const gateAt=(x,y)=>(y===ya||y===yb)&&(x===s.x||x===s.x+1)||(x===xa||x===xb)&&(y===s.y||y===s.y+1);
  const ghAt=(x,y)=>(y===ya||y===yb)&&(x===s.x-1||x===s.x+2)||(x===xa||x===xb)&&(y===s.y-1||y===s.y+2);
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){if(!(y===ya||y===yb||x===xa||x===xb))continue;const i=y*WW+x;
    if(gateAt(x,y)){OCC[i]=0;T[i]=ROAD;ELEV[i]=0;continue;}if(T[i]===DEEP||T[i]===SHAL)continue;if(OCC[i]>0)continue;
    if(SOLID_T.has(T[i])||T[i]===FARM)T[i]=GRASS;ELEV[i]=0;const w={x,y,s:MOD_ID,i:WALLS.length,gh:ghAt(x,y)};WALLS.push(w);WALLIDX.set(i,w.i);OCC[i]=-3;if(w.gh)MODGH.push(w);}
  // clear a 2-tile apron inside and out so the wall never touches fields/props; gate roads run straight in and out
  for(let y=ya-2;y<=yb+2;y++)for(let x=xa-2;x<=xb+2;x++){const m=Math.min(Math.abs(y-ya),Math.abs(y-yb),Math.abs(x-xa),Math.abs(x-xb));if(m===0||m>2)continue;if(!(x>=xa-2&&x<=xb+2&&y>=ya-2&&y<=yb+2))continue;const i=y*WW+x;if(OCC[i]||T[i]===DEEP||T[i]===SHAL||T[i]===BRIDGE)continue;if(SOLID_T.has(T[i])||T[i]===FARM||T[i]===FLOWER)T[i]=GRASS;}
  for(const [d,o,x,y] of [["N",[0,-1],s.x,ya],["S",[0,1],s.x,yb],["W",[-1,0],xa,s.y],["E",[1,0],xb,s.y]]){const tiles=o[0]?[[x,y],[x,y+1]]:[[x,y],[x+1,y]];GATES.push({s:MOD_ID,d,tiles,o,x,y,wide:1});
    for(let k=-5;k<=6;k++)for(const [tx,ty] of tiles){const cx=tx+o[0]*k,cy=ty+o[1]*k,j=cy*WW+cx;if(OCC[j]>0||WALLIDX.has(j))continue;if(T[j]!==COBBLE&&T[j]!==DEEP&&T[j]!==SHAL)T[j]=k<=0?COBBLE:ROAD;if(OCC[j]<0&&!WALLIDX.has(j))OCC[j]=0;}}
  for(const [x,y] of [[xa,ya],[xb,ya],[xa,yb],[xb,yb]])TOWERS.push({x,y,s:MOD_ID,cd:0});}
{const _gw=genWalls;genWalls=function(){const r=_gw.apply(this,arguments);try{squareModWall();}catch(e){console.warn("modwall",e);}return r;};}
// gatehouse towers flanking each Moderno gate (tiered look); drawn over the plain wall tiles
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{const M=world&&world.mod;if(!M)return;for(const w of MODGH){const x=w.x*16,y=w.y*16;if(!vis(x,y,60))continue;
  list.push({y:y+16.5,f:()=>{const wood=M.walls===0,H=wood?30:M.walls>=2?44:36;ctx.fillStyle="rgba(30,15,10,.28)";ctx.beginPath();ctx.ellipse(x+8,y+15,12,4,0,0,7);ctx.fill();
    ctx.fillStyle=wood?"#8a5a2e":M.walls>=3?"#8a8690":"#c0b8b4";ctx.fillRect(x-3,y+14-H,22,H);for(let r=0;r<Math.floor(H/6);r++){ctx.fillStyle=wood?(r%2?"#a8743e":"#946232"):(r%2?"#d0c8c4":"#aaa29e");ctx.fillRect(x-3,y+14-H+r*6,22,3);}
    ctx.strokeStyle=OL;ctx.lineWidth=1.2;ctx.strokeRect(x-3,y+14-H,22,H);ctx.fillStyle=wood?"#6e4422":"#5a4a8a";ctx.beginPath();ctx.moveTo(x-6,y+14-H);ctx.lineTo(x+8,y-2-H);ctx.lineTo(x+22,y+14-H);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#5a3a1a";ctx.fillRect(x+7,y-20-H,1.5,18);ctx.fillStyle=MOD_FLAG.field;ctx.fillRect(x+8.5,y-20-H,9,6);ctx.fillStyle=MOD_FLAG.star;ctx.fillRect(x+11.5,y-18.5,2,2);ctx.fillStyle="#2a1a3a";ctx.fillRect(x+5,y+14-H+8,6,8);}});}}catch(_){}};}
// ---- Moderno territory is exclusive land: carved out of every kingdom (KGRID value 255) ----
const MOD_K=255;let MODK_ON=false;{const _bk=buildKGrid;buildKGrid=function(){MODK_ON=true;try{return _bk.apply(this,arguments);}finally{MODK_ON=false;}};}
{const _ka=kingdomAt;kingdomAt=function(x,y){if(MODK_ON)try{const S=SETS[MOD_ID];if(Math.hypot(x-S.x,y-S.y)<modTerr())return MOD_K;}catch(_){}return _ka.apply(this,arguments);};}
function modTerrChanged(){try{KGRID=null;buildKGrid();findBorderPosts();buildWorldMap();}catch(e){console.warn(e);}}
// ---- Moderno territory on the map; the hero can expand it, sieges can cut it back ----
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{if(!world||!world.mod)return;const c=document.getElementById("mapc");const g=c.getContext("2d");const S=SETS[MOD_ID];const p=mapToScreen(S.x,S.y);const r=modTerr()*mapScaleCss();
  g.fillStyle="rgba(42,106,208,.16)";g.beginPath();g.arc(p.x,p.y,r,0,6.283);g.fill();g.strokeStyle="#2a6ad0";g.lineWidth=2.5;g.setLineDash([2,3]);g.beginPath();g.arc(p.x,p.y,r,0,6.283);g.stroke();g.setLineDash([]);}catch(_){}};}
{const lg=document.getElementById("maplegend");if(lg&&!lg.querySelector(".modleg"))lg.insertAdjacentHTML("beforeend",`<div class="modleg"><span style="color:#2a6ad0">◯</span> Moderno territory (your free city) · <span style="color:#ff3a3a">- -</span> war front · ✊ rebels</div>`);}
{const _mi=mapInfo;mapInfo=function(){const o=_mi.apply(this,arguments);try{const tx=(hero.x+6)/TILE,ty=(hero.y+8)/TILE;if(inModerno(tx,ty))o.kingdom="Moderno territory";}catch(_){}return o;};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="🏙 Lord of Moderno"&&Array.isArray(b)&&world&&world.mod&&!b.some(o=>o&&o._terr)){const M=world.mod,c=500+Math.round((modTerr()-80)*40);b=b.slice();
  b.splice(Math.max(0,b.length-1),0,{_terr:1,l:modTerr()>=130?"🗺 Territory: max (130 tiles)":`🗺 Expand territory ${modTerr()}→${modTerr()+10} tiles (${c}g)`,dis:modTerr()>=130,f:()=>{if(M.treasury+P.gold<c){toast("Not enough gold.");return;}const t=Math.min(M.treasury,c);M.treasury-=t;P.gold-=c-t;M.terr=modTerr()+10;modTerrChanged();toast(`🗺 Moderno's borders grow to ${M.terr} tiles.`);try{jAdd(`I expanded Moderno's territory to ${M.terr} tiles.`,"home");}catch(_){}lordMenu();}});
  x=(x||"")+`\n🗺 Territory: ${modTerr()} tiles around the city`;}}catch(_){}return _sm.call(this,t,x,b);};}
// no wild monsters roam inside Moderno's land (guards patrol); raiders, sieges, war knights and pets are exempt
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||!world||!world.mod||frameN%45)return;const S=SETS[MOD_ID],R=modTerr()*TILE;if(Math.hypot(hero.x-S.x*TILE,hero.y-S.y*TILE)>R+500)return;
  for(const m of mobs){if(m.dead||m.pet||m.boss||m.raidOf!=null||m.war49||m.persist||m.bandit||m.migr||m.kingdom!=null||m.legend||m.tamed)continue;if(Math.hypot(m.x-S.x*TILE,m.y-S.y*TILE)<R){m.dead=true;m.flash=0;}}}catch(_){}};}
// ---- NPC pathing on the tile grid: walls, buildings, fences and water block; route via gates and doors ----
const walk=(x,y)=>{if(x<0||y<0||x>=WW||y>=WH)return false;const i=y*WW+x,t=T[i];if(t===DEEP||t===CLIFF)return false;return !solidTile(x,y);};
const ntile=n=>[Math.floor((n.x+7)/TILE),Math.floor((n.y+8)/TILE)];
function nearestWalk(tx,ty,R,seed){if(walk(tx,ty))return[tx,ty];for(let r=1;r<=(R||8);r++){const C=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(walk(tx+dx,ty+dy))C.push([tx+dx,ty+dy]);}if(C.length)return C[(seed||0)%C.length];}return null;}
function npcUnstick(n,t){const [tx,ty]=ntile(n);const p=nearestWalk(tx,ty,6,n.id);if(p&&!(p[0]===tx&&p[1]===ty)){n.x=p[0]*TILE+1+(n.id%5)-2;n.y=p[1]*TILE+(n.id%3)-1;}else if(t&&!walk(...ntile(n))){n.x=t.x;n.y=t.y;}}
function losClear(x0,y0,x1,y1){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let k=0;k<=n;k++){const x=Math.round(x0+(x1-x0)*k/Math.max(1,n)),y=Math.round(y0+(y1-y0)*k/Math.max(1,n));if(!walk(x,y)||!walk(x+1,y)&&!walk(x,y+1))return false;}return true;}
let PATH_BUDGET=0;
function findPath(sx,sy,gx,gy,margin){const m=margin||28;const x0=Math.max(0,Math.min(sx,gx)-m),y0=Math.max(0,Math.min(sy,gy)-m),x1=Math.min(WW-1,Math.max(sx,gx)+m),y1=Math.min(WH-1,Math.max(sy,gy)+m);
  const bw=x1-x0+1,bh=y1-y0+1;if(bw*bh>40000)return null;const from=new Int32Array(bw*bh).fill(-1);const q=new Int32Array(bw*bh);let h=0,tl=0;const id=(x,y)=>(y-y0)*bw+(x-x0);
  const s=id(sx,sy),g=id(gx,gy);from[s]=s;q[tl++]=s;let best=s,bd=1e9;
  while(h<tl){const c=q[h++];if(c===g){best=g;break;}const cx=c%bw+x0,cy=(c/bw|0)+y0;const d=Math.abs(cx-gx)+Math.abs(cy-gy);if(d<bd){bd=d;best=c;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<x0||ny<y0||nx>x1||ny>y1)continue;const j=id(nx,ny);if(from[j]>=0)continue;if(!walk(nx,ny)&&!(nx===gx&&ny===gy))continue;from[j]=c;q[tl++]=j;}}
  const path=[];let c=best;for(let k=0;k<5000&&c!==s;k++){path.push([c%bw+x0,(c/bw|0)+y0]);c=from[c];}path.reverse();return{path,reached:best===g};}
// simplify: keep corner points only
function pathPoints(p){const o=[];for(let i=0;i<p.length;i++){if(i===p.length-1||i===0){o.push(p[i]);continue;}const a=p[i-1],b=p[i],c=p[i+1];if(b[0]-a[0]!==c[0]-b[0]||b[1]-a[1]!==c[1]-b[1])o.push(b);}return o;}
{const _nt=npcTarget;npcTarget=function(n){const t=_nt.apply(this,arguments);try{if(!n||!t||room||state!=="play"||n.huddle||n.adv&&n.adv.state==="travel")return t;if(Math.hypot(n.x-hero.x,n.y-hero.y)>520)return t;if(n.inside)return t;
  const [sx,sy]=ntile(n);const gx=Math.floor((t.x+7)/TILE),gy=Math.floor((t.y+8)/TILE);if(Math.abs(sx-gx)+Math.abs(sy-gy)<=1)return t;
  const key=gx+","+gy;let P2=n._pt;if(!P2||P2.k!==key||frameN-P2.t>600){if(!(n._noLos>frameN)&&losClear(sx,sy,gx,gy)){n._pt={k:key,t:frameN,los:1};return t;}if(PATH_BUDGET<=0)return P2&&P2.pts?wp(n,P2,t):t;PATH_BUDGET--;
    const r=findPath(sx,sy,gx,gy);n._pt=P2={k:key,t:frameN,pts:r&&r.path.length?pathPoints(r.path):null,i:0};}
  if(P2.los||!P2.pts)return t;return wp(n,P2,t);}catch(e){return t;}};}
function wp(n,P2,t){const [sx,sy]=ntile(n);while(P2.i<P2.pts.length){const p=P2.pts[P2.i];if(Math.abs(p[0]-sx)+Math.abs(p[1]-sy)===0)P2.i++;else break;}
  // skip ahead when a later corner is in plain sight
  if(!(n._noLos>frameN))for(let j=Math.min(P2.pts.length-1,P2.i+3);j>P2.i;j--){const p=P2.pts[j];if(losClear(sx,sy,p[0],p[1])){P2.i=j;break;}}
  if(P2.i>=P2.pts.length)return t;const p=P2.pts[P2.i];return{x:p[0]*TILE+1,y:p[1]*TILE};}
{const _u=update;update=function(){PATH_BUDGET=3;_u.apply(this,arguments);try{if(state!=="play"||!world||room)return;for(const n of npcs){if(!n.alive||n.inside||n.huddle)continue;if(Math.abs(n.x-hero.x)>520||Math.abs(n.y-hero.y)>400)continue;const [tx,ty]=ntile(n);if(!walk(tx,ty))npcUnstick(n);}
    if(frameN%30===0){const night=isNight();for(const n of npcs)if(n.role==="guard"&&n.post!=null){const on=night&&onShift(n)&&!n.inside;n.torch=on;if(on)n._nightOut=true;}}}catch(_){}};}
// ---- Moderno farmers: work the fields by day, market at dusk, home at night; shelter during sieges ----
const modField=n=>{const F=MODF.fields;if(!F.length)return null;const b=buildings[n.home];if(!b||!b.farm)return F[n.id%F.length];if(n._mf==null||!F[n._mf]){const o=F.map((f,i)=>[Math.hypot(f.x-b.x,f.y-b.y),i]).sort((a,b)=>a[0]-b[0]);n._mf=o[Math.min(o.length-1,n.id%3)][1];}return F[n._mf];};
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&n.s===MOD_ID&&n.role==="farmer"&&world&&world.mod){const h=hour(),M=world.mod,ws=world.sets[MOD_ID];
  if(M.siege||ws.raid){const b=buildings[n.home];if(b)return{...doorOf(b),inside:true,b:n.home};}
  const F=modField(n);const burnt=F&&M.burnt[F.i]>world.day;
  if(F&&!burnt&&season()!==3&&h>=6&&h<17){const k=Math.floor(frameN/900+n.id)%F.w;return{x:(F.x+k)*TILE+1,y:(F.y+1+(n.id%Math.max(1,F.h-2)))*TILE};}
  if(h>=17&&h<19){const S=SETS[MOD_ID];return{x:(S.x-4+n.id%8)*TILE,y:(S.y+3+n.id%2)*TILE};}}}catch(_){}return _nt.apply(this,arguments);};}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(n&&n.s===MOD_ID&&n.role==="farmer"&&Array.isArray(L)){const F=modField(n),M=world.mod;
  if(M.siege)L.splice(1,0,"Soldiers in our fields! I barred the farmhouse door.");else if(F&&M.burnt[F.i]>world.day)L.splice(1,0,"They burned my field... it'll take weeks to plant again.");else L.splice(1,0,["Spring planting is back-breaking, but look at those rows!","The wheat is high and gold this year.","Harvest! Every hand to the fields.","Winter — the fields rest, and so do I."][season()]);}}catch(_){}return L;};}
// ---- guards everywhere: shifts at gates and towers; off duty at the tavern, market or home ----
const SHIFT=h=>h>=6&&h<14?0:h>=14&&h<22?1:2;const SHIFT_END=[14,22,6];
function postsOf(s){const P2=[];const G=GATES.filter(g=>g.s===s.id);const town=s.kind.includes("town");const pick2=town?G:G.slice(0,1);
  for(const g of pick2){const [gx,gy]=g.tiles[0];const ix=gx-g.o[0]*2+(g.o[0]?0:-1),iy=gy-g.o[1]*2+(g.o[1]?0:-1);const p=nearestWalk(ix,iy,4)||[ix,iy];P2.push({k:"gate",d:g.d,x:p[0],y:p[1]});}
  if(town)for(const t of TOWERS.filter(t=>t.s===s.id).slice(0,2)){const dx=Math.sign(s.x-t.x),dy=Math.sign(s.y-t.y);const p=nearestWalk(t.x+dx*2,t.y+dy*2,4)||[t.x,t.y];P2.push({k:"tower",tw:TOWERS.indexOf(t),x:p[0],y:p[1]});}
  return P2;}
let POSTS=null;function allPosts(){if(!POSTS){POSTS={};for(const s of SETS)POSTS[s.id]=postsOf(s);}return POSTS;}
function staffGuards(){if(!world||!npcs)return 0;let made=0;POSTS=null;const AP=allPosts();for(const s of SETS){const ws=world.sets[s.id];if(!ws||ws.ruin||s.island&&!s.kind.includes("village"))continue;const posts=AP[s.id];if(!posts.length)continue;
  const G=npcs.filter(n=>n.alive&&n.s===s.id&&n.role==="guard"&&!n.soldierT&&!n.adv&&!n.heroKid&&!(P.knights||[]).includes(n.id));const need=posts.length*3;
  for(let i=G.length;i<need;i++){const n=makeNpc(s.id,"guard",22+Math.floor(Math.random()*30));G.push(n);made++;}
  G.sort((a,b)=>a.id-b.id);G.forEach((n,i)=>{if(i<need){n.post=i%posts.length;n.shift=Math.floor(i/posts.length)%3;n.onDuty=true;}else{n.post=null;n.shift=null;}});}return made;}
const onShift=n=>n.post!=null&&n.shift===SHIFT(hour());
function postPx(n){const p=allPosts()[n.s]&&allPosts()[n.s][n.post];return p?{x:p.x*TILE+1,y:p.y*TILE,p}:null;}
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&n.role==="guard"&&n.post!=null&&world&&!n.engage&&!n.down){const ws=world.sets[n.s];if(ws&&(ws.raid||ws.dragon))return _nt.apply(this,arguments);const S=SETS[n.s];
  if(onShift(n)){const q=postPx(n);if(q){if(q.p.k==="tower")return{x:q.x,y:q.y,inside:true,tower:q.p.tw};return{x:q.x,y:q.y};}}
  const h=hour(),since=(h-SHIFT_END[n.shift]+24)%24;
  if(since<3){const inn=S.bIdx.find(b=>buildings[b].kind==="inn");if(n.id%2&&inn!=null)return{...doorOf(buildings[inn]),inside:true,b:inn};const shop=S.bIdx.find(b=>buildings[b].kind==="shop");if(shop!=null){const d=doorOf(buildings[shop]);return{x:d.x+(n.id%5-2)*10,y:d.y+8};}return{x:(S.x-7+n.id%3)*TILE,y:(S.y+6)*TILE};}
  const b=buildings[n.home];if(b)return{...doorOf(b),inside:true,b:n.home};}}catch(_){}return _nt.apply(this,arguments);};}
// tower sentries stand on the tower top during their shift
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{if(!world)return;for(const n of npcs){if(!n.alive||n.role!=="guard"||n.post==null||!onShift(n)||!n.inside)continue;const q=postPx(n);if(!q||q.p.k!=="tower")continue;const t=TOWERS[q.p.tw];if(!t)continue;const x=t.x*16,y=t.y*16;if(!vis(x,y,60))continue;
  if(Math.hypot(n.x-q.x,n.y-q.y)>40)continue;list.push({y:y+17,f:()=>{drawChibi(chibiLook(n.look||n.id,"guard","human"),x+8,y-22,0,(frameN>>5)%2,0.8);}});}}catch(_){}};}
// a guard on night shift near the hero carries a torch
{const _ld=loadGame;loadGame=function(){const r=_ld.apply(this,arguments);try{if(r&&world){fixHomes47();if(modTerr()!==80)modTerrChanged();staffGuards();modFarmers();}}catch(e){console.warn(e);}return r;};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{staffGuards();modFarmers();}catch(e){console.warn(e);}return r;};}
// saves from v47.0/1: Moderno farm buildings were re-laid out — re-home anyone whose house no longer exists
function fixHomes47(){let c=0;for(const n of npcs){const b=buildings[n.home];if(b&&b.s===n.s)continue;const S=SETS[n.s];if(!S||!S.bIdx)continue;const hs=S.bIdx.filter(i=>buildings[i]&&buildings[i].kind==="house");if(!hs.length)continue;n.home=hs[n.id%hs.length];c++;}
  for(const n of npcs){if(n.work!=null&&!buildings[n.work])n.work=null;}return c;}
function modFarmers(){for(const n of npcs){const b=buildings[n.home];if(b&&b.farm&&n.alive&&n.role!=="child"&&n.role!=="leader"&&(n.age||0)>=16&&n.role!=="guard")n.role="farmer";}}
