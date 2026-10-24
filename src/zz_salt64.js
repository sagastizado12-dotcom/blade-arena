// ===== v64 SALTMERE TOWN LOOK, v65 QUIETER =====
// Clean bright top-down pixels. Grass is a flat green with a few short tufts.
// Town paths are round cobbles in close warm tones, without a dark ring.
// Houses keep steep red, blue, or slate roofs, brick walls, a gold eave, and
// warm arched windows, drawn with straight roof edges and matching windows.
// Stalls wear striped awnings and lamps are gold posts. Rain and snow are a
// handful of short dashes, not a particle storm. Original art. No light is
// drawn on the hero. Building ids stay put.
const SALT_G={
  norm:["#4f9a3c","#3c7e2e","#86d05e","#2c6424"],
  autumn:["#c4a24a","#9a7a30","#e0c060","#7a5a22"],
  tropical:["#3aaa58","#2a8844","#6ed080","#1e6a34"],
  volcanic:["#5a4844","#3e3230","#7a6460","#2a201c"],
  restored:["#3cbc78","#2a9460","#70e0a0","#1e7048"],
  highland:["#6a9a48","#4e7a34","#90c068","#3a6428"],
  swamp:["#4e7a38","#3a5c28","#6a9848","#2a4a1c"],
  tundra:["#d5e4ea","#b8ccd4","#f4fafc","#8aa8b4"],
  desert:["#c8c070","#a8a058","#e4dc90","#8a8640"]
};
const SALT_ROOF=[
  ["#c4453a","#8e2e26","#e07060"],
  ["#3a62c8","#274494","#6a8ae0"],
  ["#4a5566","#323844","#7a8698"],
  ["#2c4e96","#1c346c","#4e72c0"]
];
function saltGrass(g,v,P){
  pxR(g,0,0,16,16,P[0]);
  for(let i=0;i<4;i++){const x=(hash2(i,v,1)*14)|0,y=2+((hash2(i,v,2)*11)|0);pxR(g,x,y,1,2,P[1]);}}
function saltFlower(g,v,P){
  saltGrass(g,v,P);
  const cols=["#ffffff","#ff8ab0","#7ec8ff","#ffd060"];
  const x=4+((hash2(v,11,6)*8)|0),y=4+((hash2(v,12,6)*8)|0),c=cols[v&3];
  pxR(g,x,y-1,1,1,c);pxR(g,x,y+1,1,1,c);pxR(g,x-1,y,1,1,c);pxR(g,x+1,y,1,1,c);pxR(g,x,y,1,1,"#fff6c0");pxR(g,x,y+2,1,2,P[1]);}
function saltForest(g,v,P){saltGrass(g,v,P);for(let i=0;i<2;i++)pxR(g,(hash2(i,v,41)*14)|0,(hash2(i,v,42)*14)|0,2,1,P[3]);}
function saltCobble(g,v){
  pxR(g,0,0,16,16,"#c9bba6");
  const cols=["#d5c7b2","#cbbda8","#ddd0ba","#c3b49e"];
  const spots=[[4,5],[11,4],[5,12],[12,11]];
  for(let i=0;i<spots.length;i++){const s=spots[i];pxDisc(g,s[0],s[1],2,cols[(i+v)&3]);}}
function saltTiles(t,season){
  const paint=(o,P)=>{if(!o||!P)return;polRepaint(o[GRASS],(g,v)=>saltGrass(g,v,P));polRepaint(o[FLOWER],(g,v)=>saltFlower(g,v,P));polRepaint(o[FOREST],(g,v)=>saltForest(g,v,P));};
  paint(t,SALT_G.norm);
  polRepaint(t[COBBLE],saltCobble);
  const rows=[[ZN.autumn,"autumn"],[ZN.tropical,"tropical"],[ZN.volcanic,"volcanic"],[ZN.restored,"restored"],[ZN.highland,"highland"],[ZN.swamp,"swamp"],[ZN.tundra,"tundra"],[ZN.desert,"desert"]];
  if(t.B)for(const [z,k] of rows)paint(t.B[z],SALT_G[k]);
  const vg=t.B&&t.B[ZN.volcanic]&&t.B[ZN.volcanic][GRASS];
  if(vg)for(let v=0;v<vg.length;v++){if(v&1)continue;const g=vg[v].getContext("2d");g.setTransform(2,0,0,2,0,0);pxR(g,(hash2(v,5,5)*12)|0,(hash2(v,6,5)*12)|0,2,1,"#ff6a2a");}}
{const _mt=makeTiles;makeTiles=function(season){return _mt(season);};}
function saltBrick(g,x,y,w,h){
  pxR(g,x,y,w,h,"#a06a54");
  pxR(g,x,y+1,w,1,"#b07a62");
  for(let r=0;r<h;r+=4){pxR(g,x,y+r,w,1,"#8d5a46");const off=(r>>2)&1?4:0;for(let k=off;k<w;k+=8)pxR(g,x+k,y+r,1,Math.min(4,h-r),"#8d5a46");}
  pxR(g,x,y+h-2,w,2,"#7a4e3e");}
function saltRoof(g,x,y,w,h,R){
  const topW=Math.max(12,Math.round(w*0.44)),topL=x+((w-topW)>>1),topR=topL+topW,botL=x,botR=x+w;
  for(let r=0;r<h;r++){const t=h<=1?0:r/(h-1);const L=Math.round(topL+(botL-topL)*t),Rt=Math.round(topR+(botR-topR)*t),ww=Math.max(1,Rt-L);
    pxR(g,L,y+r,ww,1,(r&3)===3?R[1]:R[0]);}
  pxR(g,topL,y,topW,2,"#f0d070");pxR(g,topL,y,topW,1,"#fff6c8");}
function saltWin(g,x,y){
  pxR(g,x+2,y,4,1,"#e8c060");pxR(g,x+1,y+1,1,1,"#e8c060");pxR(g,x+6,y+1,1,1,"#e8c060");
  pxR(g,x,y+2,1,7,"#e8c060");pxR(g,x+7,y+2,1,7,"#e8c060");pxR(g,x,y+9,8,1,"#c8a040");
  pxR(g,x+2,y+1,4,1,"#ffe090");pxR(g,x+1,y+2,6,7,"#ffe070");pxR(g,x+3,y+3,2,3,"#fff6c0");
  pxR(g,x+4,y+2,1,7,"#e8c060");pxR(g,x+1,y+5,6,1,"#e8c060");}
function saltDoor(g,x,y,h){
  pxR(g,x+2,y,4,1,"#e8c060");pxR(g,x+1,y+1,1,2,"#e8c060");pxR(g,x+6,y+1,1,2,"#e8c060");
  pxR(g,x,y+3,1,h-3,"#e8c060");pxR(g,x+7,y+3,1,h-3,"#e8c060");
  pxR(g,x+1,y+2,6,h-3,"#6a3a22");pxR(g,x+2,y+4,4,Math.max(2,h-8),"#8a5234");
  pxR(g,x+1,y+h-1,6,1,"#a08030");pxR(g,x+5,y+((h*0.55)|0),1,1,"#ffd060");}
// v67: Saltmere house, stall, and lamp redraws are off. Town sprites stay on the v60 path.
drawGroundFX=function(tx0,ty0){const wth=world&&world.weather;if(wth==="rain"||wth==="storm"||wth==="snow")return;
  const tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;const off=(frameN*.25)%32;
  ctx.globalAlpha=.28;ctx.globalCompositeOperation="lighter";
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const t=tAt(x,y);if(t!==DEEP&&t!==SHAL)continue;const sx=((x*16+off+y*7)%48+48)%48;ctx.drawImage(waveTex,sx,(y%4)*6,16,16,x*16,y*16,16,16);}
  ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;};
{const _dc=drawClouds;drawClouds=function(){const wth=world&&world.weather;if(wth==="rain"||wth==="storm"||wth==="snow")return;return _dc.apply(this,arguments);};}
const WX65={rainStreaks:8,stormStreaks:10,snowFlakes:6,puddles:4,snowParticles:0};
function drawWx65(){if(!world)return;const w=world.weather;
  if(w==="rain"||w==="storm"){ctx.fillStyle="rgba(255,255,255,.78)";const n=w==="storm"?WX65.stormStreaks:WX65.rainStreaks;
    for(let i=0;i<n;i++){const x=(hash2(i,frameN>>1,8)*W)|0,y=(hash2(i,frameN>>1,9)*H)|0;ctx.fillRect(x,y,1,3);}}
  else if(w==="snow"){ctx.fillStyle="rgba(255,255,255,.92)";
    for(let i=0;i<WX65.snowFlakes;i++){const x=(hash2(i,frameN>>2,8)*W)|0,y=(hash2(i,frameN>>2,9)*H)|0;ctx.fillRect(x,y,1,2);}}
  const wet=world.wet||0;if(wet>0.18&&w!=="snow"){ctx.fillStyle=`rgba(40,56,72,${0.18*wet})`;
    const spanX=Math.max(1,Math.ceil(W/TILE)),spanY=Math.max(1,Math.ceil(H/TILE)),ox=Math.floor(camX/TILE),oy=Math.floor(camY/TILE);
    for(let i=0;i<WX65.puddles;i++){const tx=ox+((hash2(i,ox>>1,21)*spanX)|0),ty=oy+((hash2(i,oy>>1,22)*spanY)|0),t=tAt(tx,ty);
      if(t!==GRASS&&t!==ROAD&&t!==COBBLE&&t!==FARM&&t!==FLOWER&&t!==MUD)continue;ctx.fillRect(tx*TILE-camX+2,ty*TILE-camY+11,8,2);}}}
window.__SALT64={town:false};
window.__WX65=WX65;
