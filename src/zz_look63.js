// ===== v63 PAINTED WORLD + WEATHER MOOD =====
// Original pixels only. Denser grass and forest floors, deeper shade, warmer
// roads, and water with vertical sparkle. Day gets a warm wash. Night stays a
// readable green dark with the lamps and windows that already exist — no light
// is drawn on the hero. Rain and storms cool and darken the air. Snow lays a
// pale veil and small drifts. Fog drifts in bands. Baked into the season
// tileset, so the frame adds only a few full-screen washes and a short fleck pass.
function lushGrass(g,v,P,flowers,bed){
  pxR(g,0,0,16,16,P[0]);
  for(let i=0;i<5;i++){const x=(hash2(i,v,21)*12)|0,y=(hash2(i,v,22)*11)|0;pxR(g,x,y,4,3,P[1]);pxR(g,x,y,4,1,P[3]);}
  for(let i=0;i<4;i++)pxR(g,(hash2(i,v,25)*15)|0,(hash2(i,v,26)*15)|0,1,1,P[2]);
  for(let i=0;i<11;i++){const x=(hash2(i,v,23)*15)|0,y=(hash2(i,v,24)*13)|0;pxR(g,x,y,1,3,P[3]);pxR(g,x,y,1,1,P[2]);if((i&1)===0)pxR(g,x+1,y+1,1,2,P[1]);}
  if(flowers&&(v%2)===0){const c=flowers[v%flowers.length],x=2+((hash2(v,9,17)*11)|0),y=2+((hash2(v,8,18)*11)|0);pxR(g,x,y,1,1,c);pxR(g,x,y+1,1,1,P[3]);}
  if(bed&&flowers)for(let i=0;i<3;i++){const x=2+((hash2(i,v,17)*12)|0),y=2+((hash2(i,v,18)*12)|0),c=flowers[(i+v)%flowers.length];
    pxR(g,x,y,1,1,"#fff6c8");pxR(g,x-1,y,1,1,c);pxR(g,x+1,y,1,1,c);pxR(g,x,y-1,1,1,c);pxR(g,x,y+1,1,1,c);}}
function lushForest(g,v,P,leaf,season){
  lushGrass(g,v,[P[1],P[3],P[0],P[3]],null,false);
  const litter=season===2?["#e08a28","#c45a18","#f0c050"]:season===3?["#d8e4ea","#ffffff","#b8c8d0"]:["#1a4018","#2f6a2c","#102810"];
  pxR(g,1,1,6,4,"rgba(0,0,0,.16)");
  for(let i=0;i<9;i++)pxR(g,(hash2(i,v,41)*14)|0,(hash2(i,v,42)*14)|0,2,1,litter[i%3]);
  const col=(leaf&&leaf[0])||P[3],x=2+((hash2(v,3,43)*8)|0);
  pxR(g,x,6,1,6,col);pxR(g,x-2,8,2,1,col);pxR(g,x+1,9,2,1,(leaf&&leaf[2])||col);pxR(g,x-1,11,2,1,(leaf&&leaf[1])||col);}
function lushBush(g,v,P,leaf,season){
  lushGrass(g,v,P,null,false);
  const L0=leaf[0],L1=leaf[1]||leaf[0],L2=leaf[2]||leaf[0];
  pxR(g,2,14,12,2,"rgba(0,0,0,.30)");
  pxR(g,2,8,12,6,L1);pxR(g,3,6,10,4,L0);pxR(g,5,4,6,3,L2);
  pxR(g,2,8,1,6,"#102414");pxR(g,13,8,1,6,"#102414");pxR(g,3,13,10,1,"#102414");pxR(g,4,5,2,1,"#e8ffc8");
  if(season<2&&(v&1)===0){pxR(g,6,9,1,1,"#ff4a6a");pxR(g,9,7,1,1,"#ffd23a");}}
function lushWater(g,v,deep){
  const b=deep?"#1458b0":"#2f9ed4",d=deep?"#0c3e86":"#1c78ae",h=deep?"#3d86e0":"#9ee0f8";
  const spark=deep?"rgba(214,236,255,.72)":"rgba(255,255,255,.82)";
  pxR(g,0,0,16,16,b);
  for(let x=0;x<16;x+=4)if(((x+v)&4)===0)pxR(g,x,0,1,16,d);
  for(let y=0;y<16;y++)if(((y+v)&3)===0)pxR(g,0,y,16,1,d);
  for(let i=0;i<6;i++){const x=(hash2(i,v,33)*14)|0,y=(hash2(i,v,34)*12)|0;pxR(g,x,y,1,3,spark);if(i<3)pxR(g,(x+3)%16,y,2,1,h);}
  if(!deep)pxR(g,(hash2(v,1,35)*12)|0,(hash2(v,2,35)*12)|0,2,1,"#e6d0a0");}
function lushRoad(g,v){
  pxR(g,0,0,16,16,"#e4c48a");pxR(g,0,0,16,1,"#f4e0b4");pxR(g,0,15,16,1,"#b08858");
  pxR(g,0,6,16,1,"#f0d6a4");pxR(g,0,7,16,2,"#c9a46c");
  pxR(g,0,0,1,16,"#c8a878");pxR(g,15,0,1,16,"#c8a878");
  for(let i=0;i<5;i++)pxR(g,(hash2(i,v,71)*15)|0,(hash2(i,v,72)*14)|0,1,1,"#a07848");}
function lushRock(g,v,P){
  lushGrass(g,v,P,null,false);
  pxR(g,2,13,12,3,"rgba(0,0,0,.35)");
  pxR(g,3,10,10,4,"#5c5a66");pxR(g,4,8,8,3,"#8e8c98");pxR(g,5,6,6,3,"#c2c0cc");pxR(g,6,5,4,2,"#eceaf4");
  pxR(g,6,5,2,1,"#f8f6fc");pxR(g,3,10,1,4,"#3a3844");pxR(g,12,9,1,4,"#3a3844");pxR(g,4,13,8,1,"#3a3844");}
function lushSnow(g,v){
  pxR(g,0,0,16,16,"#f4f8fc");pxR(g,0,(2+v)%14,16,2,"#d5e4f0");pxR(g,0,(8+v*2)%13,16,1,"#ffffff");
  for(let i=0;i<4;i++)pxR(g,(hash2(i,v,3)*14)|0,(hash2(i,v,4)*14)|0,2,1,"#c5d6e6");
  pxR(g,(hash2(v,1,5)*14)|0,(hash2(v,2,5)*14)|0,1,1,"#ffffff");}
function lookFlowers(season,kind){
  if(season===3||kind==="tundra")return["#ffffff","#dceaf2"];
  if(kind==="desert")return["#f0d060","#e8a060"];
  if(kind==="volcanic")return null;
  if(kind==="autumn")return["#ff8a3a","#ffd23a","#e85a3a"];
  if(kind==="swamp")return["#d6e070","#f0e8a0"];
  return["#ff5a7a","#ffd23a","#7ec8ff","#ffffff","#ff8ad0"];}
function lookSet(o,P,LV,season,kind){if(!o||!P)return;const fl=lookFlowers(season,kind);
  polRepaint(o[GRASS],(g,v)=>lushGrass(g,v,P,fl,false));
  polRepaint(o[FLOWER],(g,v)=>lushGrass(g,v,P,fl,true));
  polRepaint(o[FOREST],(g,v)=>lushForest(g,v,P,leafOf(LV,v),season));
  polRepaint(o[BUSH],(g,v)=>lushBush(g,v,P,leafOf(LV,v),season));
  polRepaint(o[ROCK],(g,v)=>lushRock(g,v,P));}
function shadeCanopy(c){if(!c||!c.getContext)return;const g=c.getContext("2d");g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;
  g.globalAlpha=.5;g.fillStyle="#101810";g.fillRect(5,16,14,3);g.globalAlpha=1;}
function lookTiles(t,season){
  const G=WAP.grass[season],L=LEAVES.norm[season];
  lookSet(t,G,L,season,"norm");
  polRepaint(t[ROAD],lushRoad);
  polRepaint(t[DEEP],(g,v)=>lushWater(g,v,true));
  polRepaint(t[SHAL],(g,v)=>lushWater(g,v,false));
  polRepaint(t[SNOW],lushSnow);
  polRepaint(t[MUD],(g,v)=>{pxR(g,0,0,16,16,"#4e5830");pxR(g,0,(v*3)%14,16,2,"#3a4224");for(let i=0;i<4;i++)pxR(g,(hash2(i,v,3)*14)|0,(hash2(i,v,4)*14)|0,2,1,"#6a7444");});
  if(t.canopy)t.canopy.forEach(shadeCanopy);
  const rows=[[ZN.autumn,WAP.autumn,LEAVES.autumn,"autumn"],[ZN.tropical,WAP.tropical,LEAVES.tropical,"tropical"],[ZN.volcanic,WAP.volcanic,LEAVES.volcanic,"volcanic"],[ZN.restored,WAP.restored,LEAVES.restored,"norm"],[ZN.highland,WAP.highland,LEAVES.highland,"norm"],[ZN.swamp,WAP.swamp,LEAVES.swamp,"swamp"],[ZN.tundra,WAP.tundra,LEAVES.tundra,"tundra"],[ZN.desert,WAP.desert,LEAVES.desert,"desert"]];
  if(t.B)for(const [z,P,LV,kind] of rows){lookSet(t.B[z],P,LV,season,kind);if(t.B[z]&&t.B[z].canopy)t.B[z].canopy.forEach(shadeCanopy);}
  const vg=t.B&&t.B[ZN.volcanic]&&t.B[ZN.volcanic][GRASS];
  if(vg)for(let v=0;v<vg.length;v++){if(v&1)continue;const g=vg[v].getContext("2d");g.setTransform(2,0,0,2,0,0);pxR(g,(hash2(v,5,5)*12)|0,(hash2(v,6,5)*12)|0,3,1,"#ff6a2a");pxR(g,(hash2(v,7,5)*12)|0,(hash2(v,8,5)*12)|0,1,1,"#ffb04a");}}
{const _mt=makeTiles;makeTiles=function(season){return _mt(season);};}
function drawLook63(){if(!world||!hero||room||state!=="play")return;const w=world.weather,wet=world.wet||0;
  if(wet>0.45&&w!=="snow"&&w!=="rain"&&w!=="storm"){ctx.fillStyle=`rgba(255,255,255,${0.12*wet})`;
    for(let i=0;i<12;i++){const x=(hash2(i,frameN>>3,7)*W)|0,y=(hash2(i,frameN>>3,8)*H)|0;ctx.fillRect(x,y,2,1);}}
  if(w==="fog"){ctx.fillStyle="rgba(186,194,202,0.11)";for(let i=0;i<4;i++){const y=((frameN*0.2+i*52)%(H+36))-18;ctx.fillRect(0,y,W,16);}}}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&world&&hero&&!room)drawLook63();}catch(e){console.warn("look",e);}return r;};}
window.__LOOK63={lush:false};
