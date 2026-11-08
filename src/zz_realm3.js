// ===== v72: three times the playable area, five new towns, flight into the sky.
// Area ratio is (3584*2752)/(2048*1600) = 3.01. Town radii are not scaled.
const OLD_WW=2048,OLD_WH=1600;
// Freeze the v72 scale so the existing 24 towns and owned buildings stay put
// while the map grows around them. Do not derive this from the new WW*WH.
const V72_WW=3584,V72_WH=2752;
const AREA_K=Math.sqrt((V72_WW*V72_WH)/(OLD_WW*OLD_WH));
const REG_C=Math.ceil(WW/32),REG_R=Math.ceil(WH/32),REG_N=REG_C*REG_R;
GEO_K=AREA_K;
regionOf=function(px,py){const c=clamp(Math.floor((px||0)/TILE/32),0,REG_C-1),r=clamp(Math.floor((py||0)/TILE/32),0,REG_R-1);return r*REG_C+c;};
function areaPt(o,s){if(o&&typeof o.x==="number"){o.x=Math.round(o.x*s);o.y=Math.round(o.y*s);}}
function areaBox(o,s){areaPt(o,s);if(!o)return;if(typeof o.rx==="number")o.rx=Math.max(4,Math.round(o.rx*s));if(typeof o.ry==="number")o.ry=Math.max(4,Math.round(o.ry*s));if(typeof o.r==="number"&&o.kind==null)o.r=Math.max(4,Math.round(o.r*s));}
function areaGeom(){if(areaGeom.done)return;areaGeom.done=1;const s=AREA_K;
  for(const o of SETS)areaPt(o,s);
  for(const o of ISLES)areaBox(o,s);
  areaPt(RUINS,s);areaPt(ISLE_RUIN,s);areaPt(CAVE_POS,s);areaPt(DUNGEON,s);areaPt(LAKE,s);
  for(const o of POIS)areaPt(o,s);
  for(const o of LOBES)areaBox(o,s);
  for(const o of LAKES2)areaBox(o,s);
  if(typeof RIVERS2!=="undefined")for(const r of RIVERS2)for(const p of r){p[0]*=s;p[1]*=s;}
  if(typeof LAIRS!=="undefined")for(const L of LAIRS)areaPt(L,s);
  if(typeof CAMPS!=="undefined")for(const c of CAMPS)areaPt(c,s);
}
areaGeom();
const NEW_TOWNS=[
  {id:19,name:"Hearthcross",kind:"village",x:620,y:800,r:18,roof:["#c4a05a","#7a5828"],wall:"#f4e4c0",gem:"#fc8"},
  {id:20,name:"Marrowell",kind:"town",x:2300,y:1200,r:20,roof:["#c45a3a","#7a3018"],wall:"#f6e6c8",gem:"#f88"},
  {id:21,name:"Goldbarrow",kind:"village",x:1200,y:1750,r:18,roof:["#d8b04a","#8a6a20"],wall:"#f8ecc8",gem:"#fd6"},
  {id:22,name:"Frostferry",kind:"village",x:1750,y:420,r:17,roof:["#9ab4c8","#4a6478"],wall:"#e8eef2",gem:"#cef",region:"tundra"},
  {id:23,name:"Ashford",kind:"village",x:1700,y:1900,r:18,roof:["#8a9a48","#4a5a22"],wall:"#f0e2c0",gem:"#ce8"}
];
const NEW_K=[0,1,2,1,2];
for(let i=0;i<NEW_TOWNS.length;i++){SETS.push(NEW_TOWNS[i]);KOF[NEW_TOWNS[i].id]=NEW_K[i];}
if(typeof EXTRA_ROADS!=="undefined")EXTRA_ROADS.push([19,0],[19,7],[20,12],[20,10],[21,7],[21,13],[22,6],[23,13],[23,15]);
{const _ln=layoutNewSets;layoutNewSets=function(){const r=_ln.apply(this,arguments);for(const s of SETS)if(s.id>=19)layoutSettlement(s);return r;};}
function areaKeys(o,w0,h0,s){if(!o)return o;const n={};for(const k of Object.keys(o)){const i=+k;if(!isFinite(i)){n[k]=o[k];continue;}
  const y=Math.floor(i/w0),x=i%w0;if(x<0||y<0||x>=w0||y>=h0)continue;const nx=Math.round(x*s),ny=Math.round(y*s);if(nx<0||ny<0||nx>=WW||ny>=WH)continue;n[ny*WW+nx]=o[k];}return n;}
function areaMigrate(d){if(!d||!d.world||d.world.area3)return;const W=d.world,from=!!W.journey,w0=from?OLD_WW:1024,h0=from?OLD_WH:800,s=from?AREA_K:(2*AREA_K);
  areaPt(d.hero,s);if(d.P){areaPt(d.P.boat,s);areaPt(d.P.respawn,s);}
  if(Array.isArray(d.npcs))for(const n of d.npcs)areaPt(n,s);
  for(const k of ["bandits","beasts","migr","wrecks","placed","caravans"])if(Array.isArray(W[k]))for(const o of W[k])areaPt(o,s);
  if(W.crown)for(const id of Object.keys(W.crown)){const C=W.crown[id];if(!C)continue;areaPt(C,s);if(typeof C.gx==="number"){C.gx*=s;C.gy*=s;}}
  W.harvested=areaKeys(W.harvested,w0,h0,s);W.trees=areaKeys(W.trees,w0,h0,s);
  if(d.hero){d.hero.x=clamp(d.hero.x||0,0,PXW-8);d.hero.y=clamp(d.hero.y||0,0,PXH-8);if(!(d.hero.x>8)){d.hero.x=SETS[0].x*TILE;d.hero.y=(SETS[0].y+2)*TILE;}}
  W.area3=1;W.journey=1;W.pre67=1;
}
journeyMigrate=areaMigrate;
if(window.__J68)window.__J68.migrate=areaMigrate;
function ensureRegions(){if(!world)return;world.regions=world.regions||[];while(world.regions.length<REG_N)world.regions.push(0.65+Math.random()*0.4);if(world.regions.length>REG_N)world.regions.length=REG_N;}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{world.area3=1;ensureRegions();}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r){ensureRegions();
  hero.x=clamp(hero.x,16,PXW-24);hero.y=clamp(hero.y,16,PXH-24);
  if(P){P.fly=clamp(P.fly||0,0,72);if(P.fly>0&&(heroTileBad()||!(hero.x>16))){/* stay airborne; descend lands inside the map */}}
  if(P&&!(P.fly>0)&&typeof heroTileBad==="function"&&heroTileBad()&&typeof rescueHero==="function")rescueHero();
}}catch(_){}return r;};}
// ---- flight: leave the ground, climb into a star field, come back down on land ----
function landHero(){if(!hero)return;P.fly=0;hero.boat=false;hero.swim=false;
  const tx=Math.floor((hero.x+6)/TILE),ty=Math.floor((hero.y+8)/TILE);
  const ok=t=>t===GRASS||t===ROAD||t===COBBLE||t===SAND||t===FLOWER||t===FARM||t===SNOW||t===DUNE||t===FOREST;
  if(tx>=1&&ty>=1&&tx<WW-1&&ty<WH-1&&ok(tAt(tx,ty))&&!solidTile(tx,ty))return;
  for(let rad=1;rad<48;rad++)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(Math.abs(dx)!==rad&&Math.abs(dy)!==rad)continue;const x=tx+dx,y=ty+dy;if(x<1||y<1||x>=WW-1||y>=WH-1)continue;if(ok(tAt(x,y))&&!solidTile(x,y)){hero.x=x*TILE+2;hero.y=y*TILE+2;return;}}
  hero.x=SETS[0].x*TILE;hero.y=(SETS[0].y+2)*TILE;}
function flyTick(){if(!hero||!P||state!=="play")return;if(room){P.fly=0;return;}
  if(P.fly>0){if(flyHold.up)P.fly=Math.min(72,P.fly+0.7);if(flyHold.down)P.fly=Math.max(0,P.fly-0.7);
    hero.x=clamp(hero.x,8,PXW-20);hero.y=clamp(hero.y,8,PXH-20);
    if(P.fly<=0){landHero();toast("You land.");}}
  const pad=document.getElementById("flyPad");if(pad)pad.style.display=P.fly>0?"flex":"none";
  const b=document.getElementById("btnFly");if(b)b.textContent=P.fly>0?(P.fly>=32?"Space":"Flying"):"Fly";}
const flyHold={up:false,down:false};
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{flyTick();}catch(_){}return r;};}
function drawSpace(){ctx.setTransform(RS,0,0,RS,0,0);ctx.fillStyle="#070814";ctx.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){const x=(hash2(i,3,9)*(W))|0,y=(hash2(i,4,9)*(H*0.72))|0;ctx.fillStyle=i%5?"#d8e4ff":"#fff6c8";ctx.fillRect(x,y,i%7?1:2,1);}
  const cx=W/2,cy=H*0.62,rw=Math.min(W,H)*0.42,rh=rw*0.62;
  ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(cx,cy+8,rw,rh*0.35,0,0,7);ctx.fill();
  if(!drawSpace.grid){const g=drawSpace.grid=[],step=48;for(let y=0;y<WH;y+=step){const row=[];for(let x=0;x<WW;x+=step){const t=tAt(x,y);row.push(t===DEEP||t===SHAL?"#1d4e86":t===SAND||t===DUNE?"#e2c56a":t===SNOW||t===ICE?"#d5e4ea":t===MUD?"#5c6a38":"#3f9a3a");}g.push(row);}}
  const g=drawSpace.grid,cols=g[0].length,rows=g.length;
  const dw=Math.ceil((rw*2)/cols)+1,dh=Math.ceil(rh/rows)+1;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const u=(i+0.5)/cols*2-1,v=(j+0.5)/rows*2-1;if(u*u+v*v>1.02)continue;ctx.fillStyle=g[j][i];ctx.fillRect(cx+u*rw-dw/2,cy+v*rh*0.5-dh/2,dw,dh);}
  const hx=(hero.x/PXW)*2-1,hy=(hero.y/PXH)*2-1;ctx.fillStyle="#ffe08a";ctx.fillRect(cx+hx*rw-2,cy+hy*rh*0.5-2,4,4);
  ctx.fillStyle="#f4f0e4";ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.fillText(P.fly>=60?"Above the sky":"Climbing",cx,18);
  const spr=chibi(HERO_LOOK,hero.d8!=null?hero.d8:hero.dir,10);ctx.drawImage(spr,cx-10,cy-rh-28,20,30);
}
{const _d=draw;draw=function(){if(P&&P.fly>=28&&hero&&state==="play"&&!room){try{drawSpace();return;}catch(e){console.warn(e);}}return _d.apply(this,arguments);};}
(function(){const st=document.createElement("style");st.textContent="#btnFly,#flyPad button{position:fixed;z-index:28;width:48px;height:40px;border-radius:10px;border:3px solid #c8a05a;background:#1c140c;color:#ffe6b0;font:700 13px system-ui;touch-action:none}#btnFly{left:10px;top:46%}#flyPad{position:fixed;left:10px;top:calc(46% + 46px);display:none;gap:6px;z-index:28}#flyPad button{position:static}";document.head.appendChild(st);
  const b=document.createElement("button");b.id="btnFly";b.type="button";b.textContent="Fly";
  const pad=document.createElement("div");pad.id="flyPad";
  const up=document.createElement("button");up.type="button";up.textContent="Up";
  const dn=document.createElement("button");dn.type="button";dn.textContent="Down";
  pad.appendChild(up);pad.appendChild(dn);document.body.appendChild(b);document.body.appendChild(pad);
  const hold=(el,k)=>{const on=e=>{e.preventDefault();e.stopPropagation();flyHold[k]=true;};const off=e=>{e.preventDefault();flyHold[k]=false;};
    el.addEventListener("touchstart",on,{passive:false});el.addEventListener("touchend",off,{passive:false});el.addEventListener("mousedown",on);el.addEventListener("mouseup",off);el.addEventListener("mouseleave",off);};
  hold(up,"up");hold(dn,"down");
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(!P||!hero||state!=="play")return;if(P.fly>0){landHero();toast("You drop back to the ground.");}else{P.fly=6;toast("You rise. Up and Down climb. Land returns you to earth.");}});
})();
window.__REALM3={k:AREA_K,ww:WW,wh:WH,area:(WW*WH)/(OLD_WW*OLD_WH),towns:NEW_TOWNS.map(t=>t.name),land:landHero};
