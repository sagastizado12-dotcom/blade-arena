// ===== v66 HALF WORLD: width 2048 → 1024 (tile count exactly half). Town radii stay, so Moderno
// remains the large city. Feature X and horizontal radii are squeezed once before genWorld.
function half66x(n){return Math.round(n*0.5);}
function squeezeHalf(){
  if(squeezeHalf.done)return;squeezeHalf.done=1;
  const hx=o=>{if(o&&typeof o.x==="number")o.x=half66x(o.x);};
  for(const s of SETS)hx(s);
  for(const L of LOBES){hx(L);if(typeof L.rx==="number")L.rx=Math.max(8,half66x(L.rx));}
  for(const I of ISLES){hx(I);if(typeof I.r==="number"){const host=SETS.find(s=>Math.hypot(s.x-I.x,s.y-I.y)<s.r+4);I.r=Math.max(host?host.r+14:6,half66x(I.r));}}
  for(const p of POIS)hx(p);
  for(const L of LAKES2){hx(L);if(typeof L.rx==="number")L.rx=Math.max(3,half66x(L.rx));}
  for(const L of LAIRS)hx(L);
  for(const c of CAMPS)hx(c);
  for(const r of RIVERS2)for(const p of r)if(p)p[0]=half66x(p[0]);
  hx(RUINS);hx(ISLE_RUIN);hx(CAVE_POS);hx(LAKE);
  if(typeof ESTATE!=="undefined")hx(ESTATE);
  if(typeof DEP!=="undefined")hx(DEP);
}
squeezeHalf();
// Bogsend gains one edge lot on the narrower map. Drop that extra house so ids after it stay put.
{const _ls=layoutSettlement;layoutSettlement=function(s){_ls(s);if(!s||s.id!==8)return;
  while(s.bIdx.length>8){const id=s.bIdx.pop();const b=buildings[id];if(b){for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++){const i=y*WW+x;if(i>=0&&i<OCC.length&&OCC[i]===id+1)OCC[i]=0;}}if(buildings.length&&buildings[buildings.length-1].id===id)buildings.pop();}};}
function half66ScaleX(o){if(o&&typeof o.x==="number")o.x*=0.5;}
function half66Remap(o,oldW){if(!o)return o;const n={};for(const k of Object.keys(o)){const i=+k;if(!isFinite(i)){n[k]=o[k];continue;}const y=Math.floor(i/oldW),x=i%oldW;const nx=Math.min(WW-1,half66x(x));n[y*WW+nx]=o[k];}return n;}
function half66Migrate(d){
  if(!d||!d.world||d.world.half66)return;
  const oldW=d.world.w2?2048:1024;
  d.world.harvested=half66Remap(d.world.harvested,oldW);
  d.world.trees=half66Remap(d.world.trees,oldW);
  half66ScaleX(d.hero);
  if(d.P){half66ScaleX(d.P.boat);half66ScaleX(d.P.respawn);}
  if(Array.isArray(d.npcs))for(const n of d.npcs)half66ScaleX(n);
  const W=d.world;
  for(const k of ["bandits","beasts","migr","wrecks","placed","caravans"])if(Array.isArray(W[k]))for(const o of W[k])half66ScaleX(o);
  if(W.crown)for(const k of Object.keys(W.crown)){const C=W.crown[k];if(!C)continue;if(typeof C.x==="number")C.x*=0.5;if(typeof C.gx==="number")C.gx*=0.5;}
  W.w2=1;W.half66=1;
}
function half66Unwall(){for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=y*WW+x;if(T[i]!==TREE)continue;if(T[i+1]===TREE||T[i+WW]===TREE)T[i]=FOREST;}}
{const _bw66=buildWorldMap;buildWorldMap=function(){half66Unwall();return _bw66.apply(this,arguments);};}
function half66Overview(){
  let c=document.getElementById("half66map");
  if(!c){c=document.createElement("canvas");c.id="half66map";c.style.cssText="position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;background:#123";document.body.appendChild(c);}
  const w=c.width=844,h=c.height=390,g=c.getContext("2d");
  g.imageSmoothingEnabled=false;g.fillStyle="#0e1c28";g.fillRect(0,0,w,h);
  let dw=w-16,dh=dw*WH/WW;if(dh>h-12){dh=h-12;dw=dh*WW/WH;}
  const ox=(w-dw)/2,oy=(h-dh)/2;
  if(worldMapC)g.drawImage(worldMapC,ox,oy,dw,dh);
  g.fillStyle="#ffd84a";
  for(const s of SETS){const x=ox+s.x/WW*dw,y=oy+s.y/WH*dh;g.fillRect(x-1,y-1,3,3);}
  g.strokeStyle="#e8c060";g.strokeRect(ox+0.5,oy+0.5,dw-1,dh-1);
  return {mapW:worldMapC?worldMapC.width:0,mapH:worldMapC?worldMapC.height:0,ww:WW,wh:WH};
}
window.__HALF66={tiles:()=>WW*WH,overview:half66Overview,migrate:half66Migrate,moderno:()=>SETS.find(s=>s.name==="Moderno")};
