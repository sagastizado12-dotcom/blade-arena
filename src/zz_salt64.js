// ===== v64 SALTMERE TOWN LOOK =====
// Clean bright top-down pixels. Grass is a flat green with short vertical tufts.
// Town paths are round cobbles. Houses are brick with steep red, blue, or slate
// roofs, a gold eave, and warm arched windows. Stalls wear striped awnings and
// lamps are gold posts. Rain is short white vertical dashes under a grey-green
// overcast. Original art. No light is drawn on the hero. Building ids stay put.
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
  for(let i=0;i<8;i++){const x=(hash2(i,v,1)*15)|0,y=(hash2(i,v,2)*12)|0;pxR(g,x,y,1,3,P[3]);pxR(g,x,y,1,1,P[2]);}
  if((v%3)===0){const x=4+((hash2(v,5,6)*8)|0),y=4+((hash2(v,6,6)*8)|0),c=["#ffffff","#ff9ab8","#ffe070"][v%3];pxR(g,x,y,1,1,c);pxR(g,x,y+1,1,2,P[3]);}}
function saltFlower(g,v,P){
  saltGrass(g,v,P);
  const cols=["#ffffff","#ff8ab0","#7ec8ff","#ffd060"];
  for(let i=0;i<2;i++){const x=3+((hash2(i,v,11)*10)|0),y=3+((hash2(i,v,12)*10)|0),c=cols[(i+v)%4];
    pxR(g,x,y-1,1,1,c);pxR(g,x,y+1,1,1,c);pxR(g,x-1,y,1,1,c);pxR(g,x+1,y,1,1,c);pxR(g,x,y,1,1,"#fff6c0");pxR(g,x,y+2,1,2,P[3]);}}
function saltForest(g,v,P){saltGrass(g,v,[P[1],P[3],P[0],P[3]]);for(let i=0;i<4;i++)pxR(g,(hash2(i,v,41)*14)|0,(hash2(i,v,42)*14)|0,2,1,P[3]);}
function saltCobble(g,v){
  pxR(g,0,0,16,16,"#5c564e");
  const cols=["#e4dcd0","#d0c8bc","#f2ebe2","#bdb4a8"];
  for(let row=0;row<3;row++){const off=row&1?3:0;for(let col=0;col<4;col++){const cx=2+col*5+off,cy=3+row*5;if(cx<1||cx>15)continue;
    pxDisc(g,cx,cy,2,cols[(row+col+v)&3],"#2e2822");pxR(g,cx-1,cy-1,1,1,"#f8f4ee");}}}
function saltTiles(t,season){
  const paint=(o,P)=>{if(!o||!P)return;polRepaint(o[GRASS],(g,v)=>saltGrass(g,v,P));polRepaint(o[FLOWER],(g,v)=>saltFlower(g,v,P));polRepaint(o[FOREST],(g,v)=>saltForest(g,v,P));};
  paint(t,SALT_G.norm);
  polRepaint(t[COBBLE],saltCobble);
  const rows=[[ZN.autumn,"autumn"],[ZN.tropical,"tropical"],[ZN.volcanic,"volcanic"],[ZN.restored,"restored"],[ZN.highland,"highland"],[ZN.swamp,"swamp"],[ZN.tundra,"tundra"],[ZN.desert,"desert"]];
  if(t.B)for(const [z,k] of rows)paint(t.B[z],SALT_G[k]);
  const vg=t.B&&t.B[ZN.volcanic]&&t.B[ZN.volcanic][GRASS];
  if(vg)for(let v=0;v<vg.length;v++){if(v&1)continue;const g=vg[v].getContext("2d");g.setTransform(2,0,0,2,0,0);pxR(g,(hash2(v,5,5)*12)|0,(hash2(v,6,5)*12)|0,2,1,"#ff6a2a");}}
{const _mt=makeTiles;makeTiles=function(season){const t=_mt(season);try{saltTiles(t,season);}catch(e){console.warn("salt",e);}return t;};}
function saltBrick(g,x,y,w,h){
  pxR(g,x,y,w,h,"#6e4636");
  for(let r=0;r<h;r+=3){const off=(r/3)&1?3:0;pxR(g,x,y+r,w,1,"#4a2e24");
    for(let k=-6;k<w;k+=6){const x0=Math.max(x,x+k+off),x1=Math.min(x+w,x+k+off+5);if(x1<=x0)continue;pxR(g,x0,y+r+1,x1-x0,2,"#8d5844");pxR(g,x0,y+r+1,x1-x0,1,"#a86c54");}}
  pxR(g,x,y,w,1,"#e8c060");pxR(g,x,y+h-1,w,1,"#a08030");pxR(g,x,y,1,h,"#c8a048");pxR(g,x+w-1,y,1,h,"#c8a048");}
function saltRoof(g,x,y,w,h,R){
  for(let r=0;r<h;r++){const inset=Math.floor((h-1-r)*0.32);const ww=w-inset*2;if(ww<3)continue;
    pxR(g,x+inset,y+r,ww,1,r&1?R[0]:R[1]);pxR(g,x+inset,y+r,1,1,"#f0d070");pxR(g,x+inset+ww-1,y+r,1,1,"#a08030");}
  const rw=Math.max(4,w-Math.floor(h*0.44));pxR(g,x+((w-rw)>>1),y,rw,2,"#f0d070");pxR(g,x+((w-rw)>>1),y,rw,1,"#fff0b0");
  pxR(g,x,y+h-1,w,2,"#e8c060");pxR(g,x,y+h,w,1,"#8a6828");}
function saltWin(g,x,y){
  pxR(g,x,y+2,6,5,"#1a120c");pxR(g,x+1,y,4,2,"#1a120c");
  pxR(g,x+1,y+1,4,5,"#ffe070");pxR(g,x+2,y+2,2,3,"#fff6c0");
  pxR(g,x,y+2,1,5,"#e8c060");pxR(g,x+5,y+2,1,5,"#e8c060");pxR(g,x+1,y,4,1,"#e8c060");pxR(g,x,y+7,6,1,"#c8a040");}
function saltDoor(g,x,y){
  pxR(g,x,y+3,8,10,"#1a120c");pxR(g,x+1,y,6,3,"#1a120c");
  pxR(g,x+1,y+1,6,11,"#5a3018");pxR(g,x+2,y+2,4,8,"#7a4428");
  pxR(g,x+1,y,6,1,"#e8c060");pxR(g,x,y+3,1,10,"#e8c060");pxR(g,x+7,y+3,1,10,"#e8c060");
  pxR(g,x+5,y+7,1,1,"#ffd060");}
{const _bs=buildingSprite;buildingSprite=function(b){if(!b||b.dune||b.cabin)return _bs(b);
  const key=b.id+":"+b.kind+":"+(b.owned?1:0)+":salt64"+(b.hall?1:0);let c=bldCache.get(key);if(c)return c;
  const w=b.w*16,extra=b.hall?44:30,h=b.h*16+extra;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);c.lw=w;c.lh=h;
  const ri=b.kind==="shop"?0:b.kind==="inn"?1:b.kind==="harbor"?2:b.kind==="guild"?3:(b.id*3+(b.s||0))%4;const R=SALT_ROOF[ri];
  const baseY=h-2,wallH=b.hall?22:16,wallY=baseY-wallH,roofH=Math.max(12,h-wallH-4);
  pxR(g,3,baseY,w-4,2,"rgba(0,0,0,.22)");
  saltRoof(g,0,2,w,roofH,R);
  saltBrick(g,2,wallY,w-4,wallH);
  pxR(g,0,wallY-1,w,2,"#e8c060");
  if((b.id%4)!==0){const cx=w-12;pxR(g,cx,1,5,8,"#6e4636");pxR(g,cx,1,5,1,"#a86c54");pxR(g,cx-1,0,7,2,"#4a2e24");}
  saltWin(g,(w>>1)-2,4+((roofH/3)|0));
  const doorX=(w>>1)-4;saltDoor(g,doorX,baseY-14);
  for(const wx of [6,w-12])if(Math.abs(wx-doorX)>7)saltWin(g,wx,wallY+3);
  if((b.id%5)===0){pxDisc(g,(w>>1),wallY-7,3,"#e8c060","#1a120c");pxR(g,(w>>1)-1,wallY-8,2,2,R[0]);}
  if(b.kind==="shop"||b.kind==="inn"){const A=b.kind==="shop"?"#e24a4a":"#3a6ad0";for(let k=0;k<w-8;k++)pxR(g,4+k,wallY+1,1,4,(k>>1)&1?A:"#fff6ea");pxR(g,4,wallY+5,w-8,1,"#c8a040");}
  bldCache.set(key,c);return c;};}
{const _dp=drawProp;drawProp=function(p){if(!p||(p.type!=="lamp"&&p.type!=="stall"))return _dp(p);
  const x=p.x*16,y=p.y*16;const S=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h);};
  if(p.type==="lamp"){S(5,14,6,2,"rgba(0,0,0,.25)");S(7,1,2,14,"#e8c060");S(6,1,1,14,"#fff0a8");S(6,14,4,2,"#a08030");S(4,-2,8,7,"#3a3428");S(5,-1,6,5,"#ffe070");S(6,0,3,3,"#fff8c8");S(3,-4,10,3,"#e8c060");S(5,-6,6,2,"#c8a040");return;}
  const A=(p.x+p.y)&1?"#e24a4a":"#3a6ad0";S(1,14,14,2,"rgba(0,0,0,.22)");S(1,6,1,8,"#e8c060");S(14,6,1,8,"#e8c060");S(0,0,16,1,"#e8c060");
  for(let k=0;k<16;k++)S(k,1,1,5,(k>>1)&1?A:"#fff6ea");S(0,6,16,1,"#c8a040");S(1,8,14,5,"#6a4030");S(2,7,3,2,"#ffd060");S(6,7,3,2,"#7ad070");S(10,7,3,2,"#ff8a6a");};}
drawGroundFX=function(tx0,ty0){const tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;const off=(frameN*.25)%32;
  ctx.globalAlpha=.28;ctx.globalCompositeOperation="lighter";
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const t=tAt(x,y);if(t!==DEEP&&t!==SHAL)continue;const sx=((x*16+off+y*7)%48+48)%48;ctx.drawImage(waveTex,sx,(y%4)*6,16,16,x*16,y*16,16,16);}
  ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;};
window.__SALT64={town:true};
