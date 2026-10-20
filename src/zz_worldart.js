// ===== v38 WORLD ART OVERHAUL: original procedural 16px tiles in a bright, saturated top-down JRPG look.
// Auto-tiled grass/dirt/cobble/shore transitions, rocky cliff faces, rounded trees & conifers with shadows,
// varied roofs (clay tile / shingle / thatch) and walls (half-timber / stone / plaster), window boxes, shop signs,
// capital banners & statues, draw-only decor (no collision changes), and distinct biome zones. =====
const WA={zone:null,rest:-1,on:true};
const ZN={none:0,autumn:1,tropical:2,volcanic:3,restored:4,highland:5,swamp:6,tundra:7,desert:8};
const ZNAME=Object.keys(ZN);
function waZones(){const rs=world&&world.restored&&world.restored.done?1:0;if(WA.zone&&WA.rest===rs)return WA.zone;WA.rest=rs;
  const RW_=Math.ceil(WW/32),RH_=Math.ceil(WH/32);const z=new Uint8Array(RW_*RH_);
  for(let ry=0;ry<RH_;ry++)for(let rx=0;rx<RW_;rx++){const cx=rx*32+16,cy=ry*32+16;let n=0,c={};for(let y=ry*32;y<ry*32+32;y+=3)for(let x=rx*32;x<rx*32+32;x+=3){const t=tAt(x,y);c[t]=(c[t]||0)+1;n++;}
    const f=(...ks)=>ks.reduce((a,k)=>a+(c[k]||0),0)/n;let v=0;
    if(ISLES.some(I=>Math.hypot(cx-I.x,cy-I.y)<I.r+8))v=ZN.tropical;
    else if(typeof kAtTile==="function"&&kAtTile(cx,cy)===3&&cy>420)v=rs?ZN.restored:ZN.volcanic;
    else if(f(SNOW,ICE)>0.18)v=ZN.tundra;else if(f(MUD,REED,DEADTREE)>0.12)v=ZN.swamp;else if(f(DUNE,CACTUS,MESA)>0.18)v=ZN.desert;
    else if(f(ROCK,MTN,CLIFF,STAIRS)>0.16)v=ZN.highland;else if(f(FOREST,TREE,BUSH)>0.22&&hash2(rx,ry,4242)<0.4)v=ZN.autumn;
    z[ry*RW_+rx]=v;}
  WA.zone=z;WA.rw=RW_;return z;}
// per-tile zone, boundaries dithered so biomes blend instead of forming squares
function zoneAt(tx,ty){const z=waZones();const j=(hash2(tx,ty,31)-.5)*12,k=(hash2(ty,tx,37)-.5)*12;const rx=clamp(((tx+j)/32)|0,0,WA.rw-1),ry=clamp(((ty+k)/32)|0,0,Math.ceil(WH/32)-1);return z[ry*WA.rw+rx];}
// ---------- tile painting ----------
const WAP={ // [base, dark, light, tuft]
 grass:[["#5ccf3e","#3fae32","#8be85a","#2f9a2c"],["#52c43a","#38a22e","#80e052","#2a8e28"],["#9ac646","#7ea83a","#c4e066","#6a9430"],["#eaf2f6","#cfdce6","#ffffff","#b8c8d4"]],
 autumn:["#c8a640","#a8862e","#e6c45a","#8e6a24"],tropical:["#46d67a","#2eb45e","#7cf09a","#1f9a4c"],volcanic:["#5a4a48","#3e3232","#7a6460","#2a2020"],
 restored:["#48d6a0","#2eb482","#8cf4c4","#22986c"],highland:["#7cb44e","#5e9640","#a2d06a","#4a7a34"],swamp:["#5e8a3e","#46702e","#7ea456","#385a26"],tundra:["#dce8ee","#c2d2dc","#f6fbfd","#a8bcc8"],desert:["#c8c46a","#aaa852","#e2dc88","#8e8a40"]};
const LEAVES={norm:[["#3cae3a","#24822c","#74da5c","#16602a"],["#34a234","#1e7a28","#66d050","#145a24"],["#e08a2a","#b0601e","#f8b84a","#7a3c14"],["#9cbcc4","#7a9aa4","#eaf6fa","#5a7a84"]],
 autumn:[["#e86a24","#b4441a","#ffa040","#7a2a10"],["#d8a024","#a8741a","#f8d050","#6e4a10"],["#c8402a","#902a1e","#f0704a","#601a14"]],
 tropical:["#2ec46a","#18944a","#6cf09a","#0e6a34"],volcanic:["#4a3a36","#2e2422","#6e5a52","#1e1614"],restored:["#36c890","#209a6a","#7cf0c0","#127050"],
 highland:["#3a8a4a","#246a36","#62b06a","#164a24"],swamp:["#5a8a3a","#3e6a28","#86b05a","#2a4a1a"],tundra:["#4a7a6a","#305a4c","#e8f4f8","#1e3e34"],desert:["#7aa040","#5a7e2e","#a4c862","#3e5a1e"]};
function waMk(f,n=4){const a=[];for(let v=0;v<n;v++){const c=mkCanvas(32,32),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);f(g,v);a.push(c);}return a;}
const H3=(i,v,k)=>hash2(i,v,k);
function paintGrass(g,v,P,flowers){pxR(g,0,0,16,16,P[0]);
  for(let i=0;i<10;i++){const x=(H3(i,v,11)*16)|0,y=(H3(i,v,12)*16)|0;pxR(g,x,y,2,1,P[1]);}            // soft mottling
  for(let i=0;i<5;i++){const x=(H3(i,v,13)*14)|0,y=2+((H3(i,v,14)*12)|0);pxR(g,x,y,1,2,P[3]);pxR(g,x+2,y,1,2,P[3]);pxR(g,x+1,y+1,1,2,P[3]);} // grass tufts (V)
  for(let i=0;i<4;i++)pxR(g,(H3(i,v,15)*15)|0,(H3(i,v,16)*15)|0,1,1,P[2]);
  if(flowers)for(let i=0;i<4;i++){const x=2+((H3(i,v,17)*12)|0),y=2+((H3(i,v,18)*12)|0),c=flowers[(i+v)%flowers.length];pxR(g,x,y-1,1,1,c);pxR(g,x-1,y,3,1,c);pxR(g,x,y+1,1,1,c);pxR(g,x,y,1,1,"#fff6a0");}}
function paintCanopy(L,kind,v){const c=mkCanvas(48,44),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);const OLc="#1c2a1c";
  if(kind==="pine"||kind==="snowpine"){for(let k=0;k<4;k++){const w=3+k*2.4,y=1+k*4;for(let r=0;r<5;r++){const ww=Math.max(1,Math.round(w*(0.55+r*0.11)));pxR(g,12-ww,y+r,ww*2,1,r<2?L[2]:r<4?L[0]:L[1]);}pxR(g,12-Math.round(w)-1,y+4,1,1,OLc);pxR(g,12+Math.round(w),y+4,1,1,OLc);
      if(kind==="snowpine"){pxR(g,12-Math.round(w*0.6),y,Math.round(w*1.2),1,"#ffffff");}}pxR(g,11,0,2,1,OLc);pxR(g,4,19,16,2,L[3]);return c;}
  if(kind==="palm"){for(let i=0;i<6;i++){const a=i/6*6.283+v,len=9;for(let s=0;s<len;s++){const x=12+Math.cos(a)*s,y=8+Math.sin(a)*s*0.6+s*s*0.04;pxR(g,x|0,y|0,2,1,s<3?L[2]:L[0]);if(s>2)pxR(g,x|0,(y|0)+1,1,1,L[1]);}}pxDisc(g,12,8,2,"#8a5a2a",OLc);pxR(g,10,10,1,1,"#6a3a1a");pxR(g,13,10,1,1,"#6a3a1a");return c;}
  if(kind==="dead"){g.fillStyle="#2a1e1a";for(const [x,y,w,h] of [[11,4,2,16],[7,6,5,1],[13,3,5,1],[6,4,1,3],[17,1,1,3],[9,9,3,1],[13,8,4,1]])g.fillRect(x,y,w,h);g.fillStyle="#ff6a2a";g.fillRect(17,1,1,1);return c;}
  if(kind==="willow"){pxDisc(g,12,8,8,L[0],OLc);pxDisc(g,10,6,4,L[2]);for(let i=0;i<9;i++){const x=5+i*1.6|0;pxR(g,x,10,1,6+(i%3)*2,L[1]);}return c;}
  // round bushy broadleaf: 3 overlapping lobes, light top-left, dark bottom-right, outline
  pxDisc(g,12,11,9,L[1],OLc);pxDisc(g,8,9,6,L[0]);pxDisc(g,16,9,6,L[0]);pxDisc(g,12,6,6,L[0]);pxDisc(g,10,5,3,L[2]);pxDisc(g,7,8,2,L[2]);pxR(g,6,4,2,1,"#ffffff66");
  for(let i=0;i<6;i++)pxR(g,6+((H3(i,v,51)*12)|0),8+((H3(i,v,52)*8)|0),2,1,L[1]);pxR(g,5,17,14,2,L[3]);
  if(v===1&&kind==="norm")for(let i=0;i<4;i++)pxR(g,6+((H3(i,v,9)*12)|0),5+((H3(i,v,8)*10)|0),2,2,"#ff4a4a");
  return c;}
function artTiles(t,season){const G=WAP.grass[season];const L=LEAVES.norm[season];const FL=season===3?["#ffffff"]:["#ff5a7a","#ffffff","#ffd23a","#b07aff","#ff8a3a"];
  t[GRASS]=waMk((g,v)=>paintGrass(g,v,G),6);
  t[FLOWER]=waMk((g,v)=>paintGrass(g,v,G,FL));
  t[FOREST]=waMk((g,v)=>{paintGrass(g,v,[G[1],G[3],G[0],shade(G[3],.8)]);for(let i=0;i<3;i++){const x=(H3(i,v,61)*13)|0,y=(H3(i,v,62)*13)|0;pxR(g,x,y,3,2,L[1]);pxR(g,x,y,2,1,L[0]);}});
  const dirt=(g,v)=>{pxR(g,0,0,16,16,"#e2c48a");for(let i=0;i<8;i++)pxR(g,(H3(i,v,71)*15)|0,(H3(i,v,72)*15)|0,2,1,"#cfae72");for(let i=0;i<4;i++)pxR(g,(H3(i,v,73)*15)|0,(H3(i,v,74)*15)|0,1,1,"#f2dcaa");pxR(g,(H3(v,1,75)*13)|0,(H3(v,2,75)*13)|0,2,2,"#b8966a");pxR(g,(H3(v,3,75)*13)|0,(H3(v,4,75)*13)|0,1,1,"#a07e56");};
  t[ROAD]=waMk(dirt);
  t[COBBLE]=waMk((g,v)=>{pxR(g,0,0,16,16,"#8c8a92");const rows=[0,4,8,12];for(const y of rows){const off=(y/4%2)*3+((v*2)%3);for(let x=-6;x<16;x+=5){const w=4,sx=x+off;const c=["#c4c2ca","#b4b2bc","#cfcdd4","#aeacb6"][((x+y+v*3)>>2)&3];pxR(g,Math.max(0,sx),y+1,Math.min(w,16-Math.max(0,sx)),3,c);if(sx>=0&&sx<16)pxR(g,sx,y+1,Math.min(w,16-sx),1,"#e0dee4");pxR(g,Math.max(0,sx),y+3,Math.min(w,16-Math.max(0,sx)),1,"#9a98a2");}}});
  t[SAND]=waMk((g,v)=>{pxR(g,0,0,16,16,"#f6e2a4");for(let i=0;i<7;i++)pxR(g,(H3(i,v,81)*15)|0,(H3(i,v,82)*15)|0,1,1,"#e2c886");for(let i=0;i<3;i++)pxR(g,(H3(i,v,83)*15)|0,(H3(i,v,84)*15)|0,1,1,"#fff6d0");if(v===2){pxR(g,10,11,2,1,"#f4a0a0");pxR(g,11,10,1,1,"#f4a0a0");}});
  const water=(g,v,b,d,h)=>{pxR(g,0,0,16,16,b);for(let i=0;i<5;i++)pxR(g,(H3(i,v,91)*14)|0,(H3(i,v,92)*15)|0,3,1,d);const y=(2+v*4)%14;pxR(g,2+v,y,4,1,h);pxR(g,3+v,y-1,2,1,h);pxR(g,10-v,(y+7)%15,4,1,h);};
  t[DEEP]=waMk((g,v)=>water(g,v,"#2f86e8","#2672d0","#8ccaff"));
  t[SHAL]=waMk((g,v)=>water(g,v,"#52b8f4","#44a4e6","#c4ecff"));
  t[CLIFF]=waMk((g,v)=>{pxR(g,0,0,16,16,"#8a7a6c");for(let i=0;i<5;i++){const x=(H3(i,v,101)*12)|0,y=3+((H3(i,v,102)*11)|0),w=3+((H3(i,v,103)*4)|0);pxR(g,x,y,w,3,"#a8988a");pxR(g,x,y,w,1,"#c4b4a4");pxR(g,x,y+3,w,1,"#5e5046");}
    pxR(g,0,13,16,3,"#5e5046");pxR(g,0,0,16,3,season===3?"#f4f8fa":G[0]);pxR(g,0,3,16,1,G[3]);pxR(g,0,4,16,1,"#4a3e36");for(let x=0;x<16;x+=3)pxR(g,x,3,1,1+((H3(x,v,104)*2)|0),G[0]);});
  t[STAIRS]=waMk((g,v)=>{pxR(g,0,0,16,16,"#6e6058");pxR(g,0,0,2,16,"#8a7a6c");pxR(g,14,0,2,16,"#8a7a6c");for(let i=0;i<4;i++){pxR(g,2,i*4,12,3,"#d8ccb8");pxR(g,2,i*4,12,1,"#f0e6d4");pxR(g,2,i*4+3,12,1,"#8a7c6a");}});
  t[FARM]=waMk((g,v)=>{pxR(g,0,0,16,16,"#9a6638");for(let y=0;y<16;y+=4){pxR(g,0,y,16,2,"#b47a44");pxR(g,0,y+2,16,1,"#7a4a26");if(season<3)for(let x=1+(v%2);x<16;x+=3){const h=season===0?1:season===1?3:2;pxR(g,x,y+1-h+1,1,h,season===2?"#e0b03a":"#5ac83a");if(season===1)pxR(g,x,y-1,1,1,"#9ae060");}}});
  t[ROCK]=waMk((g,v)=>{paintGrass(g,v,G);pxR(g,3,13,11,2,"rgba(0,0,0,.2)");pxDisc(g,8,9,5,"#a4a2ae","#2a2830");pxR(g,4,11,9,2,"#84828e");pxR(g,5,5,4,2,"#dcdae4");pxR(g,9,8,2,1,"#84828e");});
  t[BUSH]=waMk((g,v)=>{paintGrass(g,v,G);pxR(g,2,13,12,2,"rgba(0,0,0,.2)");pxDisc(g,8,9,5,L[1],"#16301a");pxDisc(g,7,8,3,L[0]);pxR(g,5,6,2,1,L[2]);if(season<2&&v%2===0){pxR(g,6,9,1,1,"#ff4a6a");pxR(g,10,8,1,1,"#ffd23a");}});
  t[TREE]=waMk((g,v)=>{paintGrass(g,v,G);pxR(g,2,12,13,3,"rgba(0,0,0,.24)");pxR(g,6,6,4,8,"#8a5228");pxR(g,6,6,1,8,"#b0703a");pxR(g,9,6,1,8,"#5e3418");pxR(g,5,13,2,1,"#5e3418");pxR(g,9,13,2,1,"#5e3418");});
  t[19]=waMk((g,v)=>{paintGrass(g,v,G);pxR(g,4,12,9,2,"rgba(0,0,0,.2)");pxR(g,5,8,6,5,"#8a5228");pxR(g,5,7,6,2,"#e8c890");pxR(g,7,7,2,1,"#c8a070");pxR(g,4,8,1,5,"#3a2214");pxR(g,11,8,1,5,"#3a2214");});
  // biome-specific variants (same tile ids, different art)
  const B=t.B={};const mkSet=(P,LV,canKinds)=>{const o={};o[GRASS]=waMk((g,v)=>paintGrass(g,v,P),4);o[FLOWER]=waMk((g,v)=>paintGrass(g,v,P,FL));o[FOREST]=waMk((g,v)=>{paintGrass(g,v,[P[1],P[3],P[0],P[3]]);});
    o[TREE]=waMk((g,v)=>{paintGrass(g,v,P);pxR(g,2,12,13,3,"rgba(0,0,0,.24)");pxR(g,6,6,4,8,"#7a4a24");pxR(g,6,6,1,8,"#a06a38");});
    o[BUSH]=waMk((g,v)=>{paintGrass(g,v,P);pxR(g,2,13,12,2,"rgba(0,0,0,.2)");const l=Array.isArray(LV[0])?LV[v%LV.length]:LV;pxDisc(g,8,9,5,l[1],"#16301a");pxDisc(g,7,8,3,l[0]);pxR(g,5,6,2,1,l[2]);});
    o.canopy=[0,1,2,3].map(v=>{const l=Array.isArray(LV[0])?LV[v%LV.length]:LV;return paintCanopy(l,canKinds[v],v);});return o;};
  B[ZN.autumn]=mkSet(WAP.autumn,LEAVES.autumn,["norm","norm","norm","pine"]);
  B[ZN.tropical]=mkSet(WAP.tropical,LEAVES.tropical,["palm","norm","palm","palm"]);
  B[ZN.volcanic]=mkSet(WAP.volcanic,LEAVES.volcanic,["dead","dead","norm","dead"]);
  B[ZN.volcanic][GRASS]=waMk((g,v)=>{paintGrass(g,v,WAP.volcanic);if(v%2===0){pxR(g,(H3(v,5,5)*12)|0,(H3(v,6,5)*12)|0,3,1,"#ff6a2a");pxR(g,(H3(v,7,5)*12)|0,(H3(v,8,5)*12)|0,1,1,"#ffb04a");}},4);
  B[ZN.restored]=mkSet(WAP.restored,LEAVES.restored,["norm","norm","norm","pine"]);
  B[ZN.highland]=mkSet(WAP.highland,LEAVES.highland,["pine","pine","norm","pine"]);
  B[ZN.swamp]=mkSet(WAP.swamp,LEAVES.swamp,["willow","willow","norm","willow"]);
  B[ZN.tundra]=mkSet(WAP.tundra,LEAVES.tundra,["snowpine","snowpine","snowpine","snowpine"]);
  B[ZN.desert]=mkSet(WAP.desert,LEAVES.desert,["palm","norm","palm","norm"]);
  t.canopy=[0,1,2,3].map(v=>paintCanopy(L,v===3?(season===3?"snowpine":"pine"):"norm",v));
  return t;}
{const _mt=makeTiles;makeTiles=function(season){const t=_mt(season);if(!WA.on)return t;try{artTiles(t,season);}catch(e){console.warn("worldart",e);}return t;};}
// ---------- chunk renderer with auto-tiled transitions ----------
const GRASSY=new Set([GRASS,FLOWER,FOREST,TREE,BUSH,19,20]);
const PRI=t=>GRASSY.has(t)?3:t===COBBLE?4:t===ROAD||t===STAIRS?2:t===SAND?1:t===FARM?2:0;
function waSet(t,tx,ty){const B=TILESET.B;if(B&&GRASSY.has(t)){const z=zoneAt(tx,ty);const s=B[z];if(s&&s[t])return s[t];}return TILESET[t];}
function jag(g,src,dir,px0,py0,tx,ty,depth){ // jagged soft edge: draw neighbour art column by column
  for(let i=0;i<16;i++){const d=Math.max(1,Math.round(depth*(0.55+hash2(tx*16+i,ty,dir+7)*0.7)));
    if(dir===0)g.drawImage(src,i*2,0,2,d*2,px0+i,py0,1,d);else if(dir===1)g.drawImage(src,i*2,32-d*2,2,d*2,px0+i,py0+16-d,1,d);
    else if(dir===2)g.drawImage(src,0,i*2,d*2,2,px0,py0+i,d,1);else g.drawImage(src,32-d*2,i*2,d*2,2,px0+16-d,py0+i,d,1);}}
const _getChunk0=getChunk;
getChunk=function(cx,cy){const k=cx+","+cy;let c=chunkCache.get(k);if(c)return c;
  if(!WA.on||!TILESET.B)return _getChunk0(cx,cy);
  c=mkCanvas(CH*TILE*RS,CH*TILE*RS);const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(RS,RS);
  const NB=[[0,-1],[0,1],[-1,0],[1,0]];
  for(let y=0;y<CH;y++)for(let x=0;x<CH;x++){const tx=cx*CH+x,ty=cy*CH+y,t=tAt(tx,ty),X=x*TILE,Y=y*TILE;
    const set=waSet(t,tx,ty)||TILESET[GRASS];const v=Math.floor(hash2(tx,ty,5)*set.length);g.drawImage(set[v],X,Y,16,16);
    const wat=isWater(t);
    if(!wat){const p=PRI(t);for(let d=0;d<4;d++){const n=tAt(tx+NB[d][0],ty+NB[d][1]);const pn=PRI(n);
        if(pn===3&&p>0&&p<3&&t!==STAIRS){const s=waSet(n===TREE||n===BUSH||n===19||n===20?GRASS:n,tx+NB[d][0],ty+NB[d][1])||TILESET[GRASS];jag(g,s[0],d,X,Y,tx,ty,3);}
        else if(t===COBBLE&&pn!==4&&!isWater(n)){g.fillStyle="#6e6c76";if(d===0)g.fillRect(X,Y,16,1);if(d===1)g.fillRect(X,Y+15,16,1);if(d===2)g.fillRect(X,Y,1,16);if(d===3)g.fillRect(X+15,Y,1,16);}
        if(isWater(n)&&n!==PIER&&t!==PIER&&t!==BRIDGE){ // darker bank lip on land
          g.fillStyle=GRASSY.has(t)?"rgba(40,90,30,.55)":"rgba(150,110,60,.45)";if(d===0)g.fillRect(X,Y,16,2);if(d===1)g.fillRect(X,Y+14,16,2);if(d===2)g.fillRect(X,Y,2,16);if(d===3)g.fillRect(X+14,Y,2,16);}}}
    else if(t!==PIER&&t!==BRIDGE){let shore=0;for(let d=0;d<4;d++){const n=tAt(tx+NB[d][0],ty+NB[d][1]);if(isWater(n)||n===PIER||n===BRIDGE)continue;shore++;
        g.fillStyle="rgba(10,40,110,.35)";if(d===0)g.fillRect(X,Y,16,4);if(d===1)g.fillRect(X,Y+12,16,4);if(d===2)g.fillRect(X,Y,4,16);if(d===3)g.fillRect(X+12,Y,4,16);
        g.fillStyle="rgba(255,255,255,.7)";const o=(frameN>>5)%2;if(d===0)g.fillRect(X,Y+1+o,16,1);if(d===1)g.fillRect(X,Y+14-o,16,1);if(d===2)g.fillRect(X+1+o,Y,1,16);if(d===3)g.fillRect(X+14-o,Y,1,16);}
      // lily pads in ponds / calm shallows near shore
      if(shore&&hash2(tx,ty,808)<0.16){const lx=X+3+((hash2(tx,ty,809)*8)|0),ly=Y+4+((hash2(tx,ty,810)*6)|0);pxDisc(g,lx,ly,2,"#3cae4a","#1a5a2a");g.fillStyle="#2f86e8";g.fillRect(lx,ly-2,1,2);if(hash2(tx,ty,811)<0.4){g.fillStyle="#ffb0d0";g.fillRect(lx-1,ly-1,2,2);}}}
    if(t===CLIFF&&tAt(tx,ty+1)!==CLIFF){g.fillStyle="rgba(0,0,0,.25)";g.fillRect(X,Y+14,16,2);}
    const ev=elevAt(tx,ty);if(ev&&t!==CLIFF){g.fillStyle=`rgba(255,250,230,${ev*0.06})`;g.fillRect(X,Y,16,16);}
    if(tAt(tx,ty-1)===CLIFF&&t!==CLIFF){const gr=g.createLinearGradient(0,Y,0,Y+7);gr.addColorStop(0,"rgba(20,10,40,.42)");gr.addColorStop(1,"rgba(20,10,40,0)");g.fillStyle=gr;g.fillRect(X,Y,16,7);}
    if(blendEdges&&!GRASSY.has(t)&&t!==ROAD&&t!==COBBLE&&t!==SAND&&!wat)blendEdges(g,tx,ty,t,X,Y);}
  chunkCache.set(k,c);if(chunkCache.size>36)chunkCache.delete(chunkCache.keys().next().value);return c;};
// canopies per biome
drawCanopies=function(){const tx0=tx0g()-1,ty0=ty0g()-1,tx1=tx0+Math.ceil(W/TILE)+3,ty1=ty0+Math.ceil(H/TILE)+3;const wv=wind();const B=TILESET.B;
  const hx=hero.x+6,hy=hero.y+6;
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){if(tAt(x,y)!==TREE)continue;const v=Math.floor(hash2(x,y,5)*4);const z=B?zoneAt(x,y):0;const cs=(B&&B[z]&&B[z].canopy)||TILESET.canopy;
    const sh=chopShake.get(y*WW+x)||0;const sw=(wv+Math.sin(frameN*.04+x*.7+y*.3))*.9+Math.sin(sh*1.8)*sh*.25;
    const cx=x*16-4+sw,cy=y*16-12;const behind=hy<y*16+4&&hy>y*16-18&&Math.abs(hx-(x*16+8))<12;
    ctx.fillStyle="rgba(0,0,0,.16)";ctx.beginPath();ctx.ellipse(x*16+9,y*16+13,9,3.5,0,0,7);ctx.fill();
    if(behind)ctx.globalAlpha=.55;ctx.drawImage(cs[v],cx,cy,24,22);ctx.globalAlpha=1;}};
// clear caches when Nethervale is restored
{const _u=update;update=function(){_u.apply(this,arguments);try{if(frameN%120===0&&world){const rs=world.restored&&world.restored.done?1:0;if(WA.zone&&rs!==WA.rest){WA.zone=null;chunkCache.clear();}}}catch(_){}};}
// biome monsters for the new zones (only when enough species exist)
const ZMON={volcanic:/^(firespirit|emberslime|imp|gargoyle|dreadknight)$/,tropical:/^(slime|meadowslime|viper|snapbloom|venusmaw|cobra)$/,autumn:/^(treant|wolfman|duskbat|wisp|snapbloom)$/,highland:/^(stonegolem|cyclops|gargoyle|manebeast|wolfman)$/};
const ZMON_OK={};(function(){for(const b in ZMON){let n=0;for(const k in SPECIES){const d=SPECIES[k];if(!d.biome||!ZMON[b].test(k))continue;if(!d.biome.includes(b))d.biome.push(b);n++;}ZMON_OK[b]=n>=3;}})();
{const _ba=biomeAt;biomeAt=function(tx,ty){const b=_ba(tx,ty);if(!WA.on)return b;try{if(b==="meadow"||b==="forest"){const z=ZNAME[zoneAt(tx,ty)];if(ZMON_OK[z])return z;}}catch(_){}return b;};}
// ---------- buildings: varied roofs & walls, window boxes, signs ----------
const ROOFC=[["#d8503a","#a83426","#f4846a"],["#3a6ec8","#264c96","#6a9ae8"],["#4aa05a","#2e7440","#7ad08a"],["#8a5a3a","#5e3a22","#b4825a"],["#6a6a7e","#4a4a5c","#9a9ab0"],["#c8783a","#9a5422","#eaa060"],["#8a3a6a","#5e2448","#b46a96"]];
const THATCH=["#d8b45a","#a8843a","#f0d48a"];
function roofDraw(g,x,y,w,h,R,style){const OLr="#2a2030";
  if(style==="thatch"){pxR(g,x,y,w,h,R[0]);for(let i=0;i<w*h/6;i++)pxR(g,x+((H3(i,w,121)*w)|0),y+((H3(i,h,122)*h)|0),1,2+((H3(i,1,123)*2)|0),i%3?R[1]:R[2]);for(let k=0;k<w;k+=2)pxR(g,x+k,y+h,1,1+(k%4?1:0),R[1]);pxR(g,x,y,w,2,R[2]);}
  else if(style==="tile"){for(let r=0;r<h;r+=3){pxR(g,x,y+r,w,3,R[0]);for(let k=(r%6?2:0);k<w;k+=4){pxR(g,x+k,y+r+2,3,1,R[1]);pxR(g,x+k,y+r,1,2,R[2]);}}pxR(g,x,y,w,1,R[2]);}
  else{for(let r=0;r<h;r+=2){pxR(g,x,y+r,w,2,r%4?R[0]:shade(R[0],.94));for(let k=(r%4?3:0);k<w;k+=6)pxR(g,x+k,y+r,1,2,R[1]);}pxR(g,x,y,w,1,R[2]);}
  pxR(g,x,y+h,w,1,"rgba(0,0,0,.35)");pxR(g,x-1,y,1,h+1,OLr);pxR(g,x+w,y,1,h+1,OLr);pxR(g,x,y-1,w,1,OLr);pxR(g,x-1,y+h+1,w+2,1,OLr);}
function wallDraw(g,x,y,w,h,style,base){const OLw="#2a2030";
  if(style==="stone"){pxR(g,x,y,w,h,"#b4aea8");for(let r=0;r<h;r+=3)for(let k=(r%6?3:0);k<w;k+=6){pxR(g,x+k,y+r,5,2,["#c8c2bc","#bcb6b0","#d0cac4"][(k+r)%3]);pxR(g,x+k,y+r,5,1,"#dcd6d0");}}
  else if(style==="timber"){pxR(g,x,y,w,h,base);const D="#6a3e22";pxR(g,x,y,w,1,D);pxR(g,x,y+h-1,w,1,D);pxR(g,x,y+(h>>1),w,1,D);for(let k=0;k<=w;k+=8){pxR(g,Math.min(x+k,x+w-1),y,1,h,D);if(k+8<=w)for(let i=0;i<(h>>1);i++){pxR(g,x+k+((i*8/(h>>1))|0),y+i,1,1,D);}}}
  else{pxR(g,x,y,w,h,base);for(let r=1;r<h;r+=3)pxR(g,x,y+r,w,1,shade(base,.92));}
  pxR(g,x-1,y,1,h,OLw);pxR(g,x+w,y,1,h,OLw);}
function winBox(g,x,y,lit,flow){pxR(g,x-1,y-1,6,6,"#2a2030");pxR(g,x,y,4,4,lit?"#ffe080":"#9ad8f4");pxR(g,x,y,2,2,lit?"#fff4c0":"#d8f4ff");pxR(g,x+2,y,1,4,"#f4ecd8");pxR(g,x,y+2,4,1,"#f4ecd8");pxR(g,x-2,y,1,4,"#4a7a3a");pxR(g,x+5,y,1,4,"#4a7a3a");
  if(flow){pxR(g,x-1,y+5,6,2,"#8a5228");for(let i=0;i<3;i++)pxR(g,x+i*2-1+1,y+4,1,1,["#ff5a7a","#ffd23a","#ffffff"][i]);pxR(g,x,y+4,4,0,"#3a9030");}}
function signDraw(g,x,y,txt,col){const sw=txt.length*4+4;pxR(g,x+2,y-3,1,3,"#2a2030");pxR(g,x+sw-3,y-3,1,3,"#2a2030");pxR(g,x-1,y-1,sw+2,8,"#2a2030");pxR(g,x,y,sw,6,col||"#c88a50");pxR(g,x,y,sw,1,"#e8b070");g.fillStyle="#fff8e0";g.font="bold 5px monospace";g.textBaseline="top";g.fillText(txt,x+2,y);}
{const _bs=buildingSprite;buildingSprite=function(b){if(!WA.on||!b||b.dune||b.cabin||!["house","forsale","shop","inn","harbor"].includes(b.kind))return _bs(b);
  const key=b.id+":"+b.kind+":"+(b.owned?1:0)+":wa38"+(b.hall?1:0);let c=bldCache.get(key);if(c)return c;
  const w=b.w*16,extra=b.hall?44:30,h=b.h*16+extra;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);c.lw=w;c.lh=h;
  const S=SETS[b.s]||{};const lit=world&&(hour()>=19||hour()<6);const hh=k=>hash2(b.id,b.s||0,k);
  const z=WA.zone?ZNAME[zoneAt(b.x,b.y)]:"none";
  const rs=b.kind==="inn"?"tile":b.kind==="shop"?"shingle":z==="tundra"?"shingle":S.kind==="village"&&hh(1)<0.45?"thatch":hh(2)<0.5?"tile":"shingle";
  const R=rs==="thatch"?THATCH:b.hall?ROOFC[0]:b.kind==="inn"?ROOFC[0]:b.kind==="shop"?ROOFC[1]:b.kind==="harbor"?ROOFC[4]:(S.roof&&hh(3)<0.35?[S.roof[0],S.roof[1],shade(S.roof[0],1.25)]:ROOFC[(hh(4)*ROOFC.length)|0]);
  const ws=b.hall||b.kind==="harbor"||z==="highland"||z==="tundra"?"stone":hh(5)<0.55?"timber":"plaster";const wb=S.wall&&!S.demon?S.wall:["#f4e6c4","#f0dcb8","#ece4d4","#f8eedc"][(hh(6)*4)|0];
  const baseY=h-2,wallH=b.hall?24:18,wallY=baseY-wallH,roofH=h-wallH-6;
  pxR(g,2,baseY-1,w-2,3,"rgba(0,0,0,.2)");pxR(g,1,baseY-3,w-2,3,"#9a96a0");pxR(g,1,baseY-3,w-2,1,"#bcb8c4");pxR(g,1,baseY,w-2,1,"#2a2030");
  wallDraw(g,2,wallY,w-4,wallH-3,ws,wb);roofDraw(g,1,4,w-2,roofH,R,rs);
  if(!b.hall&&b.kind!=="forsale"&&rs!=="thatch"){const cx=w-13;pxR(g,cx-1,0,7,9,"#2a2030");pxR(g,cx,1,5,8,"#a8644a");pxR(g,cx,1,5,1,"#c88a70");pxR(g,cx,4,5,1,"#8a4a36");}
  if(roofH>14)winBox(g,(w/2|0)-2,6+Math.floor(roofH/3),lit,false);
  const doorX=Math.floor(w/2)-3;pxR(g,doorX-1,baseY-15,8,13,"#2a2030");pxR(g,doorX,baseY-14,6,12,"#8a4e28");pxR(g,doorX+1,baseY-13,4,10,"#a8643a");pxR(g,doorX+1,baseY-9,4,1,"#7a4020");pxR(g,doorX+4,baseY-8,1,1,"#ffd23a");pxR(g,doorX-2,baseY-2,10,1,"#c8c2bc");
  for(const wx of [6,w-11])if(Math.abs(wx-doorX)>8)winBox(g,wx,wallY+4,lit,hh(7+wx)<0.7);
  if(b.hall){const tx=Math.floor(w/2)-8;pxR(g,tx-1,0,18,roofH+6,"#2a2030");pxR(g,tx,1,16,roofH+4,"#e8dcc4");for(let k=0;k<roofH;k+=4)pxR(g,tx,1+k,16,1,"#c8b8a0");pxDisc(g,tx+8,9,5,"#fffbe8","#2a2030");pxR(g,tx+8,6,1,4,"#2a2030");pxR(g,tx+8,9,3,1,"#2a2030");
    roofDraw(g,tx-2,-2,20,3,ROOFC[1],"tile");for(const bx of [3,w-7]){pxR(g,bx,wallY-2,1,14,"#5a3a20");pxR(g,bx+1,wallY-1,4,9,S.gem||"#e84a4a");pxR(g,bx+1,wallY+8,2,1,S.gem||"#e84a4a");pxR(g,bx+2,wallY+2,2,2,"#ffd23a");}}
  if(b.kind==="shop"||b.kind==="inn"){const aw=b.kind==="shop"?["#e84a4a","#fff4e8"]:["#3a8a5a","#fff4e8"];for(let k=0;k<w-8;k++)pxR(g,4+k,wallY,1,4,aw[Math.floor(k/3)%2]);pxR(g,4,wallY+4,w-8,1,"#2a2030");for(let k=0;k<w-8;k+=3)pxR(g,4+k,wallY+4,2,1,aw[0]);}
  const sign={inn:"INN",shop:"SHOP",harbor:"DOCK",forsale:b.owned?"HOME":"SALE"}[b.kind]||(b.hall?"HALL":null);
  if(sign)signDraw(g,doorX+8,baseY-21,sign,b.kind==="inn"?"#3a7a4a":b.kind==="shop"?"#b04a3a":"#c88a50");
  if(b.kind==="inn"){pxR(g,doorX-9,baseY-16,5,6,"#2a2030");pxR(g,doorX-8,baseY-15,3,4,"#e8b040");pxR(g,doorX-8,baseY-15,3,1,"#fff8e0");pxR(g,doorX-5,baseY-14,1,2,"#2a2030");}
  if(b.kind==="harbor"){pxR(g,w-10,baseY-10,8,8,"#c88a50");pxR(g,w-10,baseY-10,8,1,"#2a2030");pxR(g,w-8,baseY-8,4,1,"#7a4a24");}
  bldCache.set(key,c);return c;};}
// ---------- draw-only decor props (never solid: collision unchanged) ----------
const isCapital=s=>s.id===0||/capital/.test(s.kind);
{const _gp=genCabinProps;genCabinProps=function(){_gp.apply(this,arguments);if(!WA.on)return;try{const occ=new Set(PROPS.map(p=>p.x+","+p.y));
  const ok=(x,y)=>{if(occ.has(x+","+y))return false;const t=T[y*WW+x];if(OCC[y*WW+x]||SOLID_T.has(t)||isWater(t)||t===CLIFF)return false;for(const b of buildings){if(x>=b.x-1&&x<=b.x+b.w&&y>=b.y-1&&y<=b.y+b.h+1)return false;}return true;};
  const put=(type,x,y,extra)=>{x|=0;y|=0;if(!ok(x,y))return false;occ.add(x+","+y);PROPS.push(Object.assign({type,x,y,deco:1},extra||{}));return true;};
  for(const s of SETS){const cap=isCapital(s);
    for(const bi of s.bIdx){const b=buildings[bi];if(!b)continue;if(b.kind==="inn"||b.kind==="shop"){put("barrel",b.x-1,b.y+b.h+1);put("barrel",b.x+b.w,b.y+b.h+1);}
      else if(b.kind==="house"&&hash2(bi,1,77)<0.4)put(hash2(bi,2,77)<0.5?"barrel":"flowerbed",b.x+b.w,b.y+b.h);}
    if(cap){for(let i=0;i<10;i++){const a=i/10*6.283;put("banner",s.x+Math.round(Math.cos(a)*7),s.y+Math.round(Math.sin(a)*5),{c:s.gem||"#e84a4a"});}
      for(const [dx,dy] of [[-8,0],[8,0],[0,-7],[0,7]])put("statue2",s.x+dx,s.y+dy);
      for(let i=0;i<14;i++){const a=i/14*6.283;put("hedge",s.x+Math.round(Math.cos(a)*11),s.y+Math.round(Math.sin(a)*8));}
      for(let i=0;i<8;i++){const a=i/8*6.283+.3;put("flowerbed",s.x+Math.round(Math.cos(a)*4),s.y+Math.round(Math.sin(a)*3));}}
    put("signpost",s.x+s.r-1,s.y+1);
    if(s.farm){for(let k=0;k<2;k++)put("tent2",s.farm.x+s.farm.w+2+k*2,s.farm.y-3);put("barrel",s.farm.x-2,s.farm.y);}}
  }catch(e){console.warn("decor",e);}};}
{const _dp=drawProp;drawProp=function(p){if(!p||!p.deco&&p.type!=="fountain")return _dp(p);const x=p.x*16,y=p.y*16,g=ctx;const S=(a,b2,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b2,w,h);};const O="#2a2030";
  switch(p.type){
  case"barrel":S(2,14,12,2,"rgba(0,0,0,.2)");S(3,3,10,12,O);S(4,4,8,10,"#a8683a");S(4,4,8,2,"#c88a50");S(4,7,8,1,"#5a5a64");S(4,11,8,1,"#5a5a64");S(5,4,1,10,"#c88a50");return;
  case"flowerbed":S(1,9,14,6,O);S(2,10,12,4,"#7a4a26");for(let i=0;i<5;i++){const c=["#ff5a7a","#ffd23a","#ffffff","#b07aff","#ff8a3a"][(i+p.x)%5];S(2+i*3,7+(i%2),2,2,c);S(2+i*3,9+(i%2),1,2,"#3a9030");}return;
  case"hedge":S(0,13,16,3,"rgba(0,0,0,.18)");S(0,4,16,11,"#1a3a1a");S(1,5,14,9,"#3a9a3a");S(1,5,14,3,"#5ac04a");S(3,9,2,1,"#2a7a2a");S(9,10,3,1,"#2a7a2a");return;
  case"banner":S(6,15,6,1,"rgba(0,0,0,.2)");S(7,-10,2,26,"#5a3a20");S(6,-11,4,2,"#ffd23a");S(9,-9,6,10,O);S(10,-8,4,8,p.c||"#e84a4a");S(10,0,2,2,p.c||"#e84a4a");S(11,-6,2,2,"#ffd23a");return;
  case"statue2":S(1,13,14,3,"rgba(0,0,0,.22)");S(2,8,12,7,O);S(3,9,10,5,"#b8b4c0");S(3,9,10,1,"#dcd8e4");S(5,-6,6,15,O);S(6,-5,4,13,"#c8c4d0");S(6,-8,4,4,O);S(7,-7,2,2,"#dcd8e4");S(9,-4,3,1,"#c8c4d0");S(11,-6,1,6,"#9a96a4");return;
  case"signpost":S(6,15,5,1,"rgba(0,0,0,.2)");S(7,3,2,12,"#6a4024");S(1,2,14,5,O);S(2,3,12,3,"#d0a060");S(12,3,3,3,"#d0a060");S(4,4,6,1,"#7a4a24");return;
  case"tent2":S(0,14,16,2,"rgba(0,0,0,.2)");for(let r=0;r<12;r++){const w=2+r;S(8-w/2|0,2+r,w,1,r%3?"#e8dcc0":"#c8b898");}S(7,8,2,6,"#5a3a20");S(1,13,14,1,O);S(7,1,2,2,"#e84a4a");return;
  case"fountain":{_dp(p);if(!SETS.some(s=>isCapital(s)&&Math.hypot(s.x-p.x,s.y-p.y)<8))return;const cx=x+8,cy=y+9;g.fillStyle="rgba(0,0,0,.18)";g.beginPath();g.ellipse(cx,cy+3,22,10,0,0,7);g.fill();
    g.fillStyle="#2a2030";g.beginPath();g.ellipse(cx,cy,22,10,0,0,7);g.fill();g.fillStyle="#c8c4d0";g.beginPath();g.ellipse(cx,cy,21,9,0,0,7);g.fill();g.fillStyle="#3a90e8";g.beginPath();g.ellipse(cx,cy,17,6.5,0,0,7);g.fill();
    g.fillStyle="#9ad8ff";g.fillRect(cx-10+((frameN>>3)%6),cy-1,5,1);g.fillRect(cx+3-((frameN>>3)%5),cy+2,4,1);g.fillStyle="#2a2030";g.fillRect(cx-3,cy-12,6,12);g.fillStyle="#dcd8e4";g.fillRect(cx-2,cy-11,4,11);g.fillStyle="#c8f0ff";g.fillRect(cx-1,cy-16-((frameN>>4)%2),2,5);return;}
  }return _dp(p);};}
