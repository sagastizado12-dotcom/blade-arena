// ===== v60 WORLD POLISH: cleaner original pixel tiles. Baked into the season tileset
// and the chunk cache, so the frame loop does no extra work. No new collision,
// no round boulders, no hero glow. Building layout is untouched. =====
function polGrass(g,v,P,flowers){
  pxR(g,0,0,16,16,P[0]);
  for(let i=0;i<3;i++){const x=(hash2(i,v,21)*13)|0,y=(hash2(i,v,22)*13)|0;pxR(g,x,y,3,2,P[1]);pxR(g,x,y,3,1,P[2]);}
  for(let i=0;i<6;i++){const x=1+((hash2(i,v,23)*14)|0),y=2+((hash2(i,v,24)*11)|0);pxR(g,x,y,1,3,P[3]);pxR(g,x,y,1,1,P[2]);}
  if(flowers)for(let i=0;i<3;i++){const x=2+((hash2(i,v,17)*12)|0),y=2+((hash2(i,v,18)*12)|0),c=flowers[(i+v)%flowers.length];
    pxR(g,x,y,1,1,"#fff6a0");pxR(g,x-1,y,1,1,c);pxR(g,x+1,y,1,1,c);pxR(g,x,y-1,1,1,c);pxR(g,x,y+1,1,1,c);}}
function polForest(g,v,P,leaf,season){
  polGrass(g,v,[P[1],P[3],P[0],P[3]],null);
  const litter=season===2?["#e08a28","#c45a18","#f0c050"]:season===3?["#d8e4ea","#ffffff","#b8c8d0"]:["#245c28","#3a7a32","#1a401c"];
  for(let i=0;i<7;i++)pxR(g,(hash2(i,v,41)*14)|0,(hash2(i,v,42)*14)|0,2,1,litter[i%3]);
  if((v&1)===0){const x=3+((hash2(v,3,43)*8)|0);pxR(g,x,8,1,4,leaf[0]);pxR(g,x-2,9,2,1,leaf[2]||leaf[0]);pxR(g,x+1,10,2,1,leaf[2]||leaf[0]);pxR(g,x-1,12,2,1,leaf[1]||leaf[0]);}}
function polTrunk(g,v,P){
  polGrass(g,v,P,null);
  pxR(g,3,13,10,2,"rgba(0,0,0,.28)");
  pxR(g,6,5,4,9,"#7a4a28");pxR(g,6,5,1,9,"#a86a3c");pxR(g,9,5,1,9,"#4e3018");
  pxR(g,5,13,2,1,"#4e3018");pxR(g,9,13,2,1,"#4e3018");pxR(g,7,8,1,1,"#c09060");}
function polBush(g,v,P,leaf,season){
  polGrass(g,v,P,null);
  pxR(g,2,13,12,2,"rgba(0,0,0,.22)");
  pxR(g,3,8,10,5,leaf[1]||leaf[0]);pxR(g,4,6,8,4,leaf[0]);pxR(g,5,5,4,2,leaf[2]||leaf[0]);
  pxR(g,3,8,1,5,"#16301a");pxR(g,12,8,1,5,"#16301a");pxR(g,4,12,8,1,"#16301a");
  if(season<2&&(v&1)===0){pxR(g,6,9,1,1,"#ff4a6a");pxR(g,9,8,1,1,"#ffd23a");}}
function polWater(g,v,deep){
  const b=deep?"#1a62c4":"#3eb6ea",d=deep?"#124ea0":"#2a98d0",h=deep?"#4a96ee":"#c8f4ff",f=deep?"#9ad0ff":"#f4fcff";
  pxR(g,0,0,16,16,b);
  for(let y=0;y<16;y++){if(((y+v)&3)===0)pxR(g,0,y,16,1,d);if(((y+v*2)&3)===2)for(let x=(v&3);x<16;x+=5)pxR(g,x,y,2,1,h);}
  const cy=(2+v*4)%13;pxR(g,1,cy,6,1,f);pxR(g,2,(cy+15)%16,4,1,f);pxR(g,9,(cy+7)%15,5,1,f);
  if(!deep)pxR(g,(hash2(v,1,33)*12)|0,(hash2(v,2,33)*12)|0,2,1,"#e8d098");}
function polDirt(g,v){
  pxR(g,0,0,16,16,"#e6c890");pxR(g,0,0,16,1,"#f4deb0");
  pxR(g,0,5,16,1,"#c9a46c");pxR(g,0,6,16,1,"#f0d6a4");pxR(g,0,11,16,1,"#c9a46c");pxR(g,0,12,16,1,"#f0d6a4");
  for(let i=0;i<4;i++)pxR(g,(hash2(i,v,71)*15)|0,(hash2(i,v,72)*14)|0,1,1,"#a88458");}
function polSand(g,v){
  pxR(g,0,0,16,16,"#f6e2a6");
  pxR(g,0,(3+v*3)%14,16,1,"#e4c888");pxR(g,0,(8+v*2)%15,16,1,"#fff3c8");
  for(let i=0;i<3;i++)pxR(g,(hash2(i,v,81)*14)|0,(hash2(i,v,82)*14)|0,1,1,"#d2b070");}
function polCobble(g,v){
  pxR(g,0,0,16,16,"#6a666e");
  const cols=["#d8d2c8","#c4beb4","#e8e2d8","#b0aaa2"];
  for(let row=0;row<4;row++){const off=row&1?3:0;for(let x=-3;x<16;x+=5){const sx=x+off,x0=Math.max(0,sx),x1=Math.min(16,sx+4);if(x1<=x0)continue;
    const c=cols[(row+(x>>2)+v)&3];pxR(g,x0,row*4,x1-x0,3,c);pxR(g,x0,row*4,x1-x0,1,"#f4f0ea");}}}
function polRock(g,v,P){
  polGrass(g,v,P,null);
  pxR(g,3,13,10,2,"rgba(0,0,0,.28)");
  pxR(g,3,9,10,4,"#6e6c78");pxR(g,4,7,8,3,"#9a98a4");pxR(g,5,5,6,3,"#c8c6d0");pxR(g,6,4,4,2,"#eceaf2");
  pxR(g,6,4,3,1,"#f8f6fc");pxR(g,4,12,8,1,"#4a4654");pxR(g,3,9,1,4,"#4a4654");pxR(g,11,8,2,2,"#4a4654");}
function polCliff(g,v,season,G){
  pxR(g,0,0,16,16,"#75685c");
  for(let r=0;r<4;r++){const y=4+r*3;pxR(g,0,y,16,2,r&1?"#9c8e7e":"#64564c");pxR(g,0,y,16,1,"#c4b4a4");pxR(g,(hash2(r,v,55)*13)|0,y,1,3,"#3e342c");}
  pxR(g,0,14,16,2,"#4a4038");
  const lip=season===3?"#f4f8fa":G[0];pxR(g,0,0,16,2,lip);for(let x=0;x<16;x+=2)if(hash2(x,v,56)<0.55)pxR(g,x,2,1,1,lip);pxR(g,0,3,16,1,"#3a322c");}
function polMtn(g,v,season){
  pxR(g,0,0,16,16,season===3?"#c5d0d8":"#8a8470");
  for(let i=0;i<5;i++){const x=(hash2(i,v,130)*11)|0,y=(hash2(i,v,131)*11)|0,w=3+((hash2(i,v,132)*3)|0);
    pxR(g,x,y+2,w,1,"#5a5448");pxR(g,x,y,w,2,i&1?"#b8b29e":"#d4cfbc");pxR(g,x,y,w,1,"#eee9d8");}
  if(season===3||v===0){pxR(g,0,0,16,2,"#f7fbfd");pxR(g,2,2,5,1,"#ffffff");pxR(g,10,2,4,1,"#e4eef4");}}
function polFarmTile(g,v,season){
  pxR(g,0,0,16,16,"#8d5a30");
  for(let y=0;y<16;y+=4){pxR(g,0,y,16,1,"#c4844c");pxR(g,0,y+1,16,2,"#6a401c");pxR(g,0,y+3,16,1,"#a36c38");
    if(season<3)for(let x=1+(v&1);x<16;x+=4){const col=season===2?"#e2b040":"#4ec04a",h=season===1?3:2;pxR(g,x,y+2-h,1,h,col);if(season===2)pxR(g,x-1,y+2-h,3,1,"#f0d060");}}}
function polFlat(g,v,c0,c1,c2,bands){
  pxR(g,0,0,16,16,c0);
  if(bands){pxR(g,0,(2+v*3)%14,16,1,c1);pxR(g,0,(7+v)%15,16,1,c2);}
  for(let i=0;i<4;i++)pxR(g,(hash2(i,v,3)*14)|0,(hash2(i,v,4)*14)|0,2,1,i&1?c1:c2);}
function polRepaint(arr,fn){if(!arr)return;for(let v=0;v<arr.length;v++){const g=arr[v].getContext("2d");g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,16,16);fn(g,v);}}
function shineCanopy(c){if(!c||!c.getContext)return;const g=c.getContext("2d");g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;
  g.globalAlpha=.7;g.fillStyle="#ffffff";g.fillRect(9,3,3,1);g.fillRect(8,4,2,1);
  g.globalAlpha=.45;g.fillStyle="#102010";g.fillRect(5,16,14,2);g.globalAlpha=1;}
function leafOf(LV,v){return Array.isArray(LV[0])?LV[v%LV.length]:LV;}
function polishSet(o,P,LV,season){if(!o||!P)return;
  polRepaint(o[GRASS],(g,v)=>polGrass(g,v,P,null));
  polRepaint(o[FLOWER],(g,v)=>polGrass(g,v,P,season===3?["#ffffff","#dceaf2"]:["#ff5a7a","#ffd23a","#ffffff","#b07aff","#ff8a3a"]));
  polRepaint(o[FOREST],(g,v)=>polForest(g,v,P,leafOf(LV,v),season));
  polRepaint(o[TREE],(g,v)=>polTrunk(g,v,P));
  polRepaint(o[BUSH],(g,v)=>polBush(g,v,P,leafOf(LV,v),season));
  if(o.canopy)o.canopy.forEach(shineCanopy);}
function polishTiles(t,season){
  const G=WAP.grass[season],L=LEAVES.norm[season];
  polishSet(t,G,L,season);
  polRepaint(t[ROAD],polDirt);polRepaint(t[SAND],polSand);polRepaint(t[COBBLE],polCobble);
  polRepaint(t[DEEP],(g,v)=>polWater(g,v,true));polRepaint(t[SHAL],(g,v)=>polWater(g,v,false));
  polRepaint(t[ROCK],(g,v)=>polRock(g,v,G));polRepaint(t[CLIFF],(g,v)=>polCliff(g,v,season,G));
  polRepaint(t[MTN],(g,v)=>polMtn(g,v,season));polRepaint(t[FARM],(g,v)=>polFarmTile(g,v,season));
  polRepaint(t[MUD],(g,v)=>polFlat(g,v,"#6a6840","#525430","#8a8858",false));
  polRepaint(t[DUNE],(g,v)=>polFlat(g,v,"#f0cc84","#d8b068","#fff0c0",true));
  polRepaint(t[SNOW],(g,v)=>polFlat(g,v,"#eef6fb","#d4e2ee","#ffffff",true));
  polRepaint(t[ICE],(g,v)=>{pxR(g,0,0,16,16,"#b7dff2");pxR(g,1+v,4,8,1,"#f4fcff");pxR(g,6-v,11,7,1,"#f4fcff");pxR(g,4,8,1,5,"#8ec0dc");pxR(g,4,8,6,1,"#8ec0dc");});
  polRepaint(t[MESA],(g,v)=>{polSand(g,v);pxR(g,1,3,14,12,"#3a241c");pxR(g,2,4,12,10,"#d07840");pxR(g,2,4,12,2,"#f0a868");pxR(g,2,8,12,1,"#a85028");pxR(g,2,12,12,1,"#8a4020");pxR(g,2,4,1,10,"#a85a30");});
  if(t.B){const rows=[[ZN.autumn,WAP.autumn,LEAVES.autumn],[ZN.tropical,WAP.tropical,LEAVES.tropical],[ZN.volcanic,WAP.volcanic,LEAVES.volcanic],[ZN.restored,WAP.restored,LEAVES.restored],[ZN.highland,WAP.highland,LEAVES.highland],[ZN.swamp,WAP.swamp,LEAVES.swamp],[ZN.tundra,WAP.tundra,LEAVES.tundra],[ZN.desert,WAP.desert,LEAVES.desert]];
    for(const [z,P,LV] of rows)polishSet(t.B[z],P,LV,season);
    const vg=t.B[ZN.volcanic]&&t.B[ZN.volcanic][GRASS];
    if(vg)for(let v=0;v<vg.length;v++){if(v&1)continue;const g=vg[v].getContext("2d");g.setTransform(2,0,0,2,0,0);pxR(g,(hash2(v,5,5)*12)|0,(hash2(v,6,5)*12)|0,3,1,"#ff6a2a");pxR(g,(hash2(v,7,5)*12)|0,(hash2(v,8,5)*12)|0,1,1,"#ffb04a");}}
}
{const _mt=makeTiles;makeTiles=function(season){const t=_mt(season);try{polishTiles(t,season);}catch(e){console.warn("polish",e);}return t;};}
// one-pixel shore lip, drawn once when a chunk is first built
function shoreLip(c,cx,cy){const g=c.getContext("2d");g.setTransform(RS,0,0,RS,0,0);g.imageSmoothingEnabled=false;
  const NB=[[0,-1,0,0,16,1],[0,1,0,15,16,1],[-1,0,0,0,1,16],[1,0,15,0,1,16]];
  for(let y=0;y<CH;y++)for(let x=0;x<CH;x++){const tx=cx*CH+x,ty=cy*CH+y,t=tAt(tx,ty);
    if(isWater(t)||t===PIER||t===BRIDGE||t===SAND||t===COBBLE||t===WALL)continue;
    for(let d=0;d<4;d++){const n=tAt(tx+NB[d][0],ty+NB[d][1]);if(!isWater(n)||n===PIER||n===BRIDGE)continue;
      g.fillStyle=(t===ROAD||t===FARM)?"#c4a06a":"#ead7a4";g.fillRect(x*TILE+NB[d][2],y*TILE+NB[d][3],NB[d][4],NB[d][5]);}}}
{const _gc=getChunk;getChunk=function(cx,cy){const c=_gc(cx,cy);if(c&&!c._p60){c._p60=1;try{shoreLip(c,cx,cy);}catch(e){console.warn("shore",e);}}return c;};}
