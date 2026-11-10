// ===== CITIES, PORTS, WAGONS, HOMES =====
// Bigger towns with a plaza, a market, and suburbs. Capitals and the six
// island city-states are the largest. Towns that sit too close are nudged
// apart; owned houses keep their building ids and move with the town.
// Ports, sea lanes, and road wagons share the caravan prices.
const CS_DEF=[
  {name:"Briarford",ruler:"Queen Briar Holt",fem:true,col:"#6a9a48",rgb:[106,154,72],good:"timber",price:0.84},
  {name:"Emberreach",ruler:"King Cinder Voss",fem:false,col:"#c4483a",rgb:[196,72,58],good:"ore",price:1.32},
  {name:"Oakenshore",ruler:"King Oaken Marr",fem:false,col:"#d0a050",rgb:[208,160,80],good:"oak",price:1.08},
  {name:"Tidewatch",ruler:"Queen Lira Tide",fem:true,col:"#3a90a8",rgb:[58,144,168],good:"salt",price:0.96},
  {name:"Wheatmarch",ruler:"King Harlan Wheat",fem:false,col:"#c8a040",rgb:[200,160,64],good:"grain",price:0.72},
  {name:"Bellhollow",ruler:"Queen Ness Bell",fem:true,col:"#5aaa40",rgb:[90,170,64],good:"wool",price:1.14}
];
(function dropOldAdventure(){
  try{
    if(localStorage.getItem("realmWorldRev")==="4")return;
    const drop=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;
      if(k===SAVEKEY||k===SAVEKEY+"_bak"||k===SAVEKEY+"_prevlife"||/realmTenWindsSave/i.test(k))drop.push(k);}
    for(const k of drop)localStorage.removeItem(k);
    try{indexedDB.deleteDatabase("blade-world");indexedDB.deleteDatabase("blade-saves");}catch(e){}
    localStorage.setItem("realmWorldRev","4");
    if(drop.length)window.__rebuilt=1;
  }catch(e){}
})();
const PORT_GOODS=["salt","fish","timber","grain","ore","wool","oak","spice"];
const HARBOR_NAMES=["Mara Quill","Bren Holt","Sela Voss","Tarin Pike","Nessa Crowe","Olm Reed","Ida Marsh","Cal Derrow","Pia Fen","Jory Hale","Esme Lark","Ned Bramble"];
const CARGO_ITEM={salt:"fish",fish:"fish",timber:"wood",grain:"bread",ore:"ore",wool:"herb",oak:"wood",spice:"herb",peat:"herb",honey:"pie"};
let PORTS=[],SEA=[],SHIPS=[],CITY_MOVES=[],ISLE_MOVES=[],CS_LIST=[],DECOR_AT=new Map();
let SAIL_SPR=null,WAGON_SPR=null;
function modCity(){return SETS.find(s=>s&&s.name==="Moderno")||SETS[MOD_ID];}
function tierOf(s){if(!s)return 0;if(s.citystate||s.name==="Moderno"||/capital/.test(s.kind||"")||(typeof KINGDOMS!=="undefined"&&KINGDOMS.some(k=>k.cap===s.id)))return 2;if(/town/.test(s.kind||""))return 1;return 0;}
function cityPrice(s){const t=tierOf(s);const base=t===2?640:t===1?380:240;return base+Math.round((s.r||16)*4);}
function landOk(x,y){if(x<40||y<40||x>=WW-40||y>=WH-40)return false;const t=tAt(x,y);return t===GRASS||t===FLOWER||t===FOREST||t===SAND||t===COBBLE||t===ROAD||t===FARM||t===SNOW||t===MUD||t===DUNE||t===BUSH;}
function landDisk(x,y,r){if(!landOk(x,y))return false;let ok=0;for(let a=0;a<8;a++){const tx=x+Math.round(Math.cos(a*0.785)*r),ty=y+Math.round(Math.sin(a*0.785)*r);if(landOk(tx,ty))ok++;}return ok>=6;}
function syncBld(){if(!world||!world.bld)return;for(const b of buildings){if(b&&!world.bld[b.id])world.bld[b.id]={dmg:0,burn:0};}}
function plotFree(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)return false;const t=T[yy*WW+xx];
  if(t===DEEP||t===SHAL||t===WALL||t===CLIFF||t===MTN||t===TREE||t===ROCK)return false;if(OCC[yy*WW+xx]>0)return false;}
  for(const b of buildings){if(!b)continue;if(x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y)return false;}return true;}
function housePlot(s){const r=Math.max(8,(s.r||16)-2);
  for(let ring=Math.max(6,r-8);ring<=r;ring++)for(let a=0;a<12;a++){const x=s.x+Math.round(Math.cos(a*0.524)*ring)-2,y=s.y+Math.round(Math.sin(a*0.524)*ring)-1;if(plotFree(x,y,4,3))return{x,y};}
  return null;}
function addLot(s,kind,extra){const p=housePlot(s);if(!p)return null;
  const b=Object.assign({id:buildings.length,s:s.id,x:p.x,y:p.y,w:4,h:3,kind,price:kind==="forsale"?cityPrice(s):0,dmg:0,burn:0,district:kind==="forsale"?"residential":"market",csLot:1},extra||{});
  buildings.push(b);s.bIdx=s.bIdx||[];s.bIdx.push(b.id);
  for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(x>0&&y>0&&x<WW&&y<WH)OCC[y*WW+x]=b.id+1;
  return b;}
function placeModerno(){let s=SETS.find(o=>o.name==="Moderno");if(s)return s;
  const k=Math.sqrt((3584*2752)/(2048*1600))*2;let x=Math.round(1560*k),y=Math.round(262*k);const spots=[[x,y]];
  for(let rad=90;rad<=900;rad+=90)for(let a=0;a<10;a++)spots.push([Math.round(x+Math.cos(a*0.628)*rad),Math.round(y+Math.sin(a*0.628)*rad)]);
  let pick=null;for(const [sx,sy] of spots){if(!landDisk(sx,sy,22))continue;if(SETS.some(o=>Math.hypot(o.x-sx,o.y-sy)<340))continue;pick={x:sx,y:sy};break;}
  if(!pick){for(let y=200;y<WH-200&&!pick;y+=80)for(let x=200;x<WW-200&&!pick;x+=80){if(!landDisk(x,y,22))continue;if(SETS.some(o=>Math.hypot(o.x-x,o.y-y)<340))continue;pick={x,y};}}
  if(!pick)pick={x,y};
  s={id:SETS.length,name:"Moderno",kind:"capital town",label:"free city",x:pick.x,y:pick.y,r:38,free:true,moderno:1,roof:["#2a6ad0","#12347a"],wall:"#f6eedc",gem:"#9df"};
  s.bIdx=[];SETS.push(s);return s;}
function ensureCityStates(){for(const def of CS_DEF){const s=SETS.find(o=>o&&o.name===def.name);if(!s)continue;
  let K=KINGDOMS.find(k=>k.citystate&&k.cap===s.id);
  if(!K){const id=KINGDOMS.length;K={id,name:def.name,cap:s.id,col:def.col,rgb:def.rgb,ruler:def.ruler,fem:def.fem,citystate:1,good:def.good};
    KINGDOMS.push(K);const L=chibiLook(9000+id*77,"king","human");
    if(typeof RULER_LOOK!=="undefined")RULER_LOOK[id]=def.fem?{...L,cls:"king",fem:true,hair:[230,190,90],style:"long",beard:false,king:1,skin:[244,206,172]}:{...L,cls:"king",king:1,skin:[236,196,150]};}
  s.citystate=1;s.port=1;s.harbor=1;s.free=false;s.demon=0;s.king=K.id;s.kind=/town/.test(s.kind||"")?s.kind:"capital town";if(!/capital/.test(s.kind))s.kind="capital "+s.kind;
  if(typeof KOF!=="undefined")KOF[s.id]=K.id;
  if(world&&world.sets&&world.sets[s.id]){const ws=world.sets[s.id];if(!ws.portSet){ws.portSet=1;ws.cargo=def.good;ws.price=def.price;}}}
  if(typeof kingdomPrep!=="undefined")kingdomPrep.sure=null;if(typeof KGRID!=="undefined")KGRID=null;}
function farSpot(ox,oy,fixed){const clear=(x,y)=>{for(const o of fixed)if(Math.hypot(x-o.x,y-o.y)<320)return false;return true;};
  if(clear(ox,oy)&&landOk(ox,oy))return{x:ox,y:oy};
  for(let rad=30;rad<=1100;rad+=24)for(let a=0;a<28;a++){const tx=Math.round(ox+Math.cos(a/28*6.283)*rad),ty=Math.round(oy+Math.sin(a/28*6.283)*rad);
    if(!landDisk(tx,ty,12)||!clear(tx,ty))continue;return{x:tx,y:ty};}
  return null;}
function placeFoot(b,x,y){if(!b)return;for(let yy=b.y;yy<b.y+(b.h||3);yy++)for(let xx=b.x;xx<b.x+(b.w||4);xx++){if(xx>0&&yy>0&&xx<WW&&yy<WH&&OCC[yy*WW+xx]===b.id+1)OCC[yy*WW+xx]=0;}
  b.x=x;b.y=y;for(let yy=y;yy<y+(b.h||3);yy++)for(let xx=x;xx<x+(b.w||4);xx++)if(xx>1&&yy>1&&xx<WW-1&&yy<WH-1){OCC[yy*WW+xx]=b.id+1;const t=T[yy*WW+xx];if(t===DEEP||t===SHAL)T[yy*WW+xx]=COBBLE;}}
function isleCenters(n){const cand=[];for(let y=420;y<WH-520;y+=150)for(let x=360;x<WW-360;x+=150){if(x>WW*0.68&&y>WH*0.62)continue;if(tAt(x,y)!==DEEP)continue;let sea=0;for(let a=0;a<8;a++){const t=tAt(x+((Math.cos(a)*120)|0),y+((Math.sin(a)*120)|0));if(t===DEEP)sea++;}if(sea<7)continue;
  if(SETS.some(s=>s&&!s.citystate&&Math.hypot(s.x-x,s.y-y)<460))continue;cand.push({x,y});}
  const seeds=[[0.22,0.30],[0.58,0.24],[0.84,0.38],[0.28,0.55],[0.66,0.62],[0.42,0.78]];
  const pick=[];for(const [fx,fy] of seeds){if(pick.length>=n)break;let best=null,bd=1e9;for(const c of cand){if(pick.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<720))continue;const d=Math.hypot(c.x-WW*fx,c.y-WH*fy);if(d<bd){bd=d;best=c;}}if(best)pick.push(best);}return pick;}
function stampIsle(cx,cy){const R=86;for(let y=cy-R-4;y<=cy+R+16;y++)for(let x=cx-R-4;x<=cx+R+4;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const d=Math.hypot(x-cx,y-cy),i=y*WW+x;
  if(Math.abs(x-cx)<=14&&y>=cy+46){T[i]=DEEP;OCC[i]=0;continue;}
  if(d>R+2)continue;if(OCC[i]>0&&!(Math.abs(x-cx)<=14&&y>=cy+40))continue;
  const spoke=d<24&&(Math.abs(x-cx)<=1||Math.abs(y-cy)<=1);const market=y>cy+6&&y<cy+14&&Math.abs(x-cx)<16;
  if(d<=8||market||spoke)T[i]=COBBLE;
  else if(d>R-2)T[i]=SAND;
  else if(d>R-16&&((Math.atan2(y-cy,x-cx)+5)%2)<0.7)T[i]=FARM;
  else if(hash2(x,y,17)<0.07)T[i]=FLOWER;
  else T[i]=GRASS;}
  for(let y=cy+34;y<=cy+R+24;y++)for(let x=cx-40;x<=cx+40;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;if(y<cy+42&&Math.abs(x-cx)>16)continue;const i=y*WW+x;if(OCC[i]>0)continue;T[i]=DEEP;}
  for(let k=-12;k<=12;k+=12)for(let y=cy+40;y<=cy+48;y++){const x=cx+k;if(x>1&&y>1&&y<WH-1){T[y*WW+x]=PIER;T[y*WW+x+1]=PIER;OCC[y*WW+x]=0;}}}
function citySlots(s){const slots=[];const push=(x,y)=>{if(Math.hypot(x+2-s.x,y+1-s.y)>66)return;if(y>s.y+38&&Math.abs(x-s.x)<14)return;if(Math.hypot(x+2-s.x,y+1-s.y)<7)return;if(slots.some(p=>Math.abs(p.x-x)<7&&Math.abs(p.y-y)<5))return;slots.push({x,y});};
  for(let x=s.x-12;x<=s.x+8;x+=8)push(x,s.y+8);
  for(const ring of [15,24,34,46,58]){const n=Math.max(8,Math.floor(ring*0.72));for(let i=0;i<n;i++){const a=-2.2+i/n*4.5;push(s.x+Math.round(Math.cos(a)*ring)-2,s.y+Math.round(Math.sin(a)*ring)-1);}}
  return slots;}
function addLotAt(s,kind,x,y,extra){const b=Object.assign({id:buildings.length,s:s.id,x,y,w:4,h:3,kind,price:kind==="forsale"?cityPrice(s):0,dmg:0,burn:0,district:kind==="forsale"||kind==="house"?"residential":"market",csLot:1},extra||{});
  buildings.push(b);s.bIdx=s.bIdx||[];if(s.bIdx.indexOf(b.id)<0)s.bIdx.push(b.id);placeFoot(b,x,y);return b;}
function bottomRightOcean(){for(let y=WH-260;y>WH*0.62;y-=70)for(let x=WW-260;x>WW*0.62;x-=70){if(tAt(x,y)!==DEEP)continue;let sea=0;for(let a=0;a<8;a++){const t=tAt(x+((Math.cos(a)*120)|0),y+((Math.sin(a)*120)|0));if(t===DEEP)sea++;}if(sea<6)continue;if(SETS.some(s=>s&&Math.hypot(s.x-x,s.y-y)<420))continue;return{x,y};}return{x:WW-420,y:WH-360};}
function modernoRealm(s){let K=KINGDOMS.find(k=>k&&k.hold);if(!K){K={id:KINGDOMS.length,name:"Moderno",cap:s.id,col:"#2a6ad0",rgb:[42,106,208],ruler:"the Lord of Moderno",hold:1,good:"spice"};KINGDOMS.push(K);}s.king=K.id;s.tint=K.col;if(typeof KOF!=="undefined")KOF[s.id]=K.id;return K;}
function placeModernoIsle(){const s=placeModerno();if(!s)return;const ox=s.x,oy=s.y;window.__OLD_MOD={x:ox,y:oy};const spot=bottomRightOcean();s.x=spot.x;s.y=spot.y;s.r=78;s.moderno=1;s.port=1;s.harbor=1;s.free=true;modernoRealm(s);
  if(!SETS.some(t=>t&&t.name==="Wayford")){const w={id:SETS.length,name:"Wayford",kind:"town",x:ox,y:oy,r:26,king:0,wayford:1,roof:["#d0a060","#7a5828"],wall:"#f6e6c4",gem:"#fd8"};w.bIdx=[];SETS.push(w);if(typeof KOF!=="undefined")KOF[w.id]=0;}}
function stockTown(s,want){const count=k=>buildings.filter(b=>b&&b.s===s.id&&b.kind===k&&!b.cabin).length;
  for(const kind of Object.keys(want))while(count(kind)<want[kind]){const b=addLot(s,kind,kind==="forsale"?{portHome:1}:{});if(!b)break;}}
function fillCityStates(){placeModernoIsle();const names=["Briarford","Emberreach","Oakenshore","Tidewatch","Wheatmarch","Bellhollow","Moderno"];
  for(const name of names){const s=SETS.find(o=>o&&o.name===name);if(!s)continue;const isle=name!=="Wayford";stampIsle(s.x,s.y);s.r=78;s.port=1;s.harbor=1;
    const slots=citySlots(s);let si=0;const take=()=>slots[si++]||null;
    const mine=buildings.filter(b=>b&&b.s===s.id&&!b.cabin).sort((a,b)=>a.id-b.id);
    for(const b of mine){const p=take();if(p)placeFoot(b,p.x,p.y);}
    const count=k=>buildings.filter(b=>b&&b.s===s.id&&b.kind===k&&!b.cabin).length;
    const want={guild:1,inn:1,shop:3,harbor:1,house:16,forsale:4};
    for(const kind of ["guild","inn","shop","harbor","house","forsale"])while(count(kind)<want[kind]){const p=take();if(!p)break;addLotAt(s,kind,p.x,p.y,kind==="forsale"?{portHome:1}:{});}
    if(name!=="Moderno"&&typeof CASTLES!=="undefined"){let castle=CASTLES.find(c=>c&&c.s===s.id);if(!castle){CASTLES.push(castle={k:s.king|0,s:s.id,x:s.x-3,y:s.y-16,w:6,h:3,citystate:s.citystate?1:0});}castle.x=s.x-3;castle.y=s.y-16;castle.k=s.king|0;}
    if(typeof waystones!=="undefined")for(const w of waystones)if(w&&w.s===s.id){w.x=s.x-10;w.y=s.y+1;}}
  const way=SETS.find(t=>t&&t.name==="Wayford");if(way){way.r=28;paintCity(way);stockTown(way,{guild:1,inn:1,shop:2,house:8,forsale:2});}
  if(typeof chunkCache!=="undefined")chunkCache.clear();bakeDecor();if(typeof kingdomPrep!=="undefined")kingdomPrep.sure=null;if(typeof KGRID!=="undefined")KGRID=null;try{paintKingdomCells();}catch(e){}BORDER_LAYER=null;}
function placeCityIslands(){ISLE_MOVES=[];const spots=isleCenters(6);const names=["Briarford","Emberreach","Oakenshore","Tidewatch","Wheatmarch","Bellhollow"];
  names.forEach((name,i)=>{const s=SETS.find(o=>o&&o.name===name);const spot=spots[i];if(!s||!spot)return;const ox=s.x,oy=s.y;s.citystate=1;s._islePick=1;
    for(let y=oy-40;y<=oy+40;y++)for(let x=ox-40;x<=ox+40;x++){if(x<1||y<1||x>=WW-1||y>=WH-1)continue;if(Math.hypot(x-ox,y-oy)>36)continue;const ii=y*WW+x;if(OCC[ii]>0)continue;if(T[ii]===COBBLE)T[ii]=GRASS;}
    s.x=spot.x;s.y=spot.y;s.r=78;ISLE_MOVES.push({id:s.id,name:s.name,ox,oy,dx:spot.x-ox,dy:spot.y-oy,r:78});});
  try{indexedDB.deleteDatabase("blade-world");}catch(e){}
  window.__ISLE_MOVES=ISLE_MOVES.map(m=>({name:m.name,ox:m.ox,oy:m.oy,x:m.ox+m.dx,y:m.oy+m.dy}));}
function separateTowns(){const anchors=[],movers=[];
  for(const s of SETS){if(!s||s.island||s.citystate||s.moderno||s.wayford||s.name==="Moderno")continue;(tierOf(s)>=2?anchors:movers).push(s);}
  anchors.sort((a,b)=>a.id-b.id);movers.sort((a,b)=>a.id-b.id);
  const fixed=[];const moves=[];
  const place=s=>{const spot=farSpot(s.x,s.y,fixed);const ox=s.x,oy=s.y;
    if(spot&&(spot.x!==ox||spot.y!==oy)){moves.push({id:s.id,name:s.name,ox,oy,dx:spot.x-ox,dy:spot.y-oy,r:s.r||16});s.x=spot.x;s.y=spot.y;}
    fixed.push(s);};
  for(const s of anchors)place(s);for(const s of movers)place(s);return moves;}
function shiftFoot(b,dx,dy){if(!b)return;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){if(x<0||y<0||x>=WW||y>=WH)continue;if(OCC[y*WW+x]===b.id+1)OCC[y*WW+x]=0;}
  b.x+=dx;b.y+=dy;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(x>0&&y>0&&x<WW&&y<WH)OCC[y*WW+x]=b.id+1;}
function applyMoves(moves){for(const m of moves){for(const b of buildings)if(b&&b.s===m.id)shiftFoot(b,m.dx,m.dy);
  if(typeof waystones!=="undefined")for(const w of waystones)if(w&&w.s===m.id){w.x+=m.dx;w.y+=m.dy;}
  if(typeof PROPS!=="undefined")for(const p of PROPS)if(p&&Math.hypot(p.x-m.ox,p.y-m.oy)<m.r+4){p.x+=m.dx;p.y+=m.dy;}
  if(typeof CASTLES!=="undefined")for(const c of CASTLES)if(c&&c.s===m.id){c.x+=m.dx;c.y+=m.dy;}
  for(let y=m.oy-m.r;y<=m.oy+m.r;y++)for(let x=m.ox-m.r;x<=m.ox+m.r;x++){if(Math.hypot(x-m.ox,y-m.oy)>m.r)continue;if(x<1||y<1||x>=WW-1||y>=WH-1)continue;
    if(Math.hypot(x-(m.ox+m.dx),y-(m.oy+m.dy))<m.r+8)continue;const i=y*WW+x;if(OCC[i]>0)continue;if(T[i]===COBBLE)T[i]=GRASS;}}}
function paintCity(s){const R=s.r|0;const tier=tierOf(s);const plaza=tier===2?6:tier===1?4:3;const chunks=new Set();
  for(let y=s.y-R-4;y<=s.y+R+6;y++)for(let x=s.x-R-4;x<=s.x+R+6;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const d=Math.hypot(x-s.x,y-s.y);if(d>R+5)continue;
    const i=y*WW+x;if(OCC[i]>0)continue;const t=T[i];if(t===DEEP||t===SHAL||t===PIER||t===CLIFF||t===MTN||t===WALL||t===ROCK||t===CAVE)continue;
    const cross=Math.abs(x-s.x)<=1||Math.abs(y-s.y)<=1;const ring=Math.abs(d-R*0.62)<1.2;const market=y>s.y+plaza-1&&y<s.y+plaza+5&&Math.abs(x-s.x)<(tier?7:5);
    const suburb=d>R-7&&d<=R-1;const field=d>R-1&&d<=R+4&&((Math.atan2(y-s.y,x-s.x)+4)%2)<0.7;
    if(d<=plaza||market)T[i]=COBBLE;else if((cross||ring)&&d<=R)T[i]=(tier?COBBLE:ROAD);else if(field&&t!==TREE)T[i]=FARM;else if(suburb&&hash2(x,y,17)<0.18)T[i]=FLOWER;
    chunks.add((x>>4)+","+(y>>4));}
  if(typeof chunkCache!=="undefined")for(const k of chunks)chunkCache.delete(k);
  s._plaza=plaza;}
function ensureDistricts(){for(const s of SETS){if(!s||s.island||s.citystate||s.moderno||s.wayford||s.name==="Moderno")continue;const tier=tierOf(s);s.r=Math.max(s.r||16,tier===2?36:tier===1?26:18);
  if(s.name==="Moderno")s.r=Math.max(s.r,38);paintCity(s);
  const sale=buildings.filter(b=>b&&b.s===s.id&&b.kind==="forsale"&&!b.cabin).length;const want=tier===2?4:tier===1?2:1;
  for(let i=sale;i<want;i++)addLot(s,"forsale",{portHome:1});
  for(const b of buildings)if(b&&b.s===s.id&&b.kind==="forsale"&&!b.cabin&&(!b.price||b.price===250||b.price===300||b.price===220))b.price=cityPrice(s);
  if(tier>=1&&!buildings.some(b=>b&&b.s===s.id&&b.kind==="inn"))addLot(s,"inn");
  const shops=buildings.filter(b=>b&&b.s===s.id&&b.kind==="shop").length;const needShop=tier===2?2:1;
  for(let i=shops;i<needShop;i++)addLot(s,"shop",{market:1});
  const shop=buildings.find(b=>b&&b.s===s.id&&b.kind==="shop");if(shop)shop.market=1;
  if(tier>=2&&!s.free&&typeof CASTLES!=="undefined"&&!CASTLES.some(c=>c&&c.s===s.id)){const kid=s.king!=null?s.king:kOf(s.id);if(KINGDOMS[kid]){const cx=s.x-3,cy=s.y-(s._plaza||5)-4;CASTLES.push({k:kid,s:s.id,x:cx,y:cy,w:6,h:3,citystate:s.citystate?1:0});}}
  if(typeof objects!=="undefined"&&!objects.some(o=>o&&o.type==="board"&&o.s===s.id))objects.push({type:"board",s:s.id,x:s.x+5,y:s.y-1});}
  bakeDecor();}
function waterNear(s,extra){const rad=(s.r||16)+(extra||28);let best=null,bd=1e9;
  const step=rad>80?3:2;for(let y=s.y-rad;y<=s.y+rad;y+=step)for(let x=s.x-rad;x<=s.x+rad;x+=step){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const t=T[y*WW+x];if(t!==DEEP&&t!==SHAL)continue;const d=Math.hypot(x-s.x,y-s.y);if(d<bd){bd=d;best={x,y,d};}}
  return best;}
function dockOf(s,water){let x=water.x|0,y=water.y|0;const sx=Math.sign(s.x-x),sy=Math.sign(s.y-y);let last={x,y};
  for(let g=0;g<90;g++){const nx=x+(sx||0),ny=y+(sy||0);if(nx<2||ny<2||nx>=WW-2||ny>=WH-2)break;const t=T[ny*WW+nx];if(t!==DEEP&&t!==SHAL)return last;last={x:nx,y:ny};x=nx;y=ny;}return last;}
function lineSea(a,b){let w=0,n=10;for(let i=1;i<n;i++){const x=(a.x+(b.x-a.x)*i/n)|0,y=(a.y+(b.y-a.y)*i/n)|0;const t=tAt(x,y);if(t===DEEP||t===SHAL||t===PIER)w++;}return w;}
function seaPath(a,b){if(lineSea(a,b)>=6)return[{x:a.x,y:a.y},{x:b.x,y:b.y}];
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len;let best=null,bs=-1;
  for(const mag of [140,280,460,700,980])for(const sg of [1,-1]){const w={x:(mx+px*mag*sg)|0,y:(my+py*mag*sg)|0};if(!landOk(w.x,w.y)&&tAt(w.x,w.y)!==DEEP&&tAt(w.x,w.y)!==SHAL)continue;
    const t=tAt(w.x,w.y);if(t!==DEEP&&t!==SHAL)continue;const s1=lineSea(a,w),s2=lineSea(w,b),sc=s1+s2;if(s1>=5&&s2>=5)return[{x:a.x,y:a.y},w,{x:b.x,y:b.y}];if(sc>bs){bs=sc;best=[{x:a.x,y:a.y},w,{x:b.x,y:b.y}];}}
  return bs>=8?best:null;}
function ensurePorts(){PORTS=[];const by={};
  for(const s of SETS){if(!s||s.island)continue;const k=s.citystate&&s.king!=null?s.king:(typeof kOf==="function"?kOf(s.id):0);if(k==null||k<0)continue;(by[k]=by[k]||[]).push(s);}
  for(const k of Object.keys(by)){const list=by[k];const reach=list.some(s=>s.citystate)?240:90;
    let pick=list.filter(s=>s.citystate).map(s=>({s,w:waterNear(s,reach)})).filter(x=>x.w)[0];
    if(!pick)pick=list.filter(s=>s.harbor).map(s=>({s,w:waterNear(s,50)})).filter(x=>x.w).sort((a,b)=>a.w.d-b.w.d)[0];
    if(!pick)pick=list.map(s=>({s,w:waterNear(s,reach)})).filter(x=>x.w).sort((a,b)=>a.w.d-b.w.d)[0];
    if(!pick)continue;const s=pick.s;s.port=1;s.harbor=1;const dock=(s.citystate||s.moderno)?{x:s.x,y:s.y+56}:dockOf(s,pick.w);
    const good=(KINGDOMS.find(q=>q.citystate&&q.cap===s.id)||{}).good||PORT_GOODS[(+k)%PORT_GOODS.length];
    PORTS.push({id:s.id,name:s.name,k:+k,x:dock.x,y:dock.y,lx:s.x,ly:s.y+4,good,big:!!s.citystate||!!s.moderno||tierOf(s)>=2});
    if(world&&world.sets&&world.sets[s.id]&&!world.sets[s.id].cargo){world.sets[s.id].cargo=good;}}
  for(const s of SETS){if(!s||!(s.citystate||s.moderno))continue;if(PORTS.some(p=>p.id===s.id))continue;const good=(KINGDOMS.find(q=>q&&q.cap===s.id)||{}).good||"spice";
    PORTS.push({id:s.id,name:s.name,k:s.king|0,x:s.x,y:s.y+56,lx:s.x,ly:s.y+4,good,big:1});}
  SEA=[];const deg={};
  const link=(p,q)=>{if(!p||!q||p.id===q.id)return;if(SEA.some(r=>(r.a===p.id&&r.b===q.id)||(r.a===q.id&&r.b===p.id)))return;const path=seaPath(p,q);if(!path)return;SEA.push({a:p.id,b:q.id,pts:path});deg[p.id]=(deg[p.id]||0)+1;deg[q.id]=(deg[q.id]||0)+1;};
  for(const p of PORTS){const near=PORTS.filter(q=>q.id!==p.id).map(q=>({q,d:Math.hypot(p.x-q.x,p.y-q.y)})).sort((a,b)=>a.d-b.d);
    for(const n of near){if((deg[p.id]||0)>=(p.big?3:2))break;if((deg[n.q.id]||0)>=3)continue;link(p,n.q);}}
  for(const p of PORTS)if(!SEA.some(r=>r.a===p.id||r.b===p.id)){const near=PORTS.filter(q=>q!==p).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));for(const q of near){const before=SEA.length;link(p,q);if(SEA.length>before)break;}}
  SHIPS=SEA.map((r,i)=>({i,t:(i*0.17)%1,cargo:(PORTS.find(p=>p.id===r.a)||{}).good||"goods",near:0}));
  const kingName=k=>{const K=KINGDOMS.find(x=>x.id===k);return K?K.name:(""+k);};
  window.__PORTS93={ports:PORTS.map(p=>({id:p.id,name:p.name,k:p.k,good:p.good,x:p.x,y:p.y,king:kingName(p.k),citystate:!!(SETS.find(s=>s.id===p.id)&&SETS.find(s=>s.id===p.id).citystate)})),routes:SEA.map(r=>{const A=SETS.find(s=>s.id===r.a),B=SETS.find(s=>s.id===r.b);return (A?A.name:r.a)+" → "+(B?B.name:r.b);}),moves:CITY_MOVES.map(m=>({name:m.name,dx:m.dx,dy:m.dy}))};
  return PORTS.length;}
function ensureCityFolk(){if(!npcs)return;let max=nextNpc||1;for(const n of npcs)if(n&&n.id>=max)max=n.id+1;nextNpc=max;
  const roles=["guard","shopkeeper","innkeeper","farmer","fisher","child","guard","child"];
  for(const s of SETS){if(!s||!(s.citystate||s.moderno||s.wayford))continue;const cap=s.wayford?8:16;const have=npcs.filter(n=>n&&n.alive&&n.s===s.id);
    if(have.length>=cap)continue;const homes=buildings.filter(b=>b&&b.s===s.id&&b.kind==="house");
    for(let i=have.length;i<cap;i++){const role=roles[i%roles.length];const n=makeNpc(s.id,role,role==="child"?8+(i%6):24+(i%20));
      const home=homes[i%Math.max(1,homes.length)];if(home){n.home=home.id;const d=doorOf(home);n.x=d.x;n.y=d.y;}n.cityFolk=1;}}}
function ensureHarborFolk(){if(!npcs||!PORTS.length)return;let max=nextNpc||1;for(const n of npcs)if(n&&n.id>=max)max=n.id+1;nextNpc=max;
  for(const p of PORTS){if(npcs.some(n=>n&&n.alive&&n.harborMaster&&n.s===p.id))continue;
    const id=nextNpc++;const homeB=buildings.find(b=>b&&b.s===p.id&&(b.kind==="house"||b.kind==="forsale"||b.kind==="inn"));
    npcs.push({id,name:HARBOR_NAMES[p.id%HARBOR_NAMES.length],s:p.id,role:"fisher",age:40+(p.id%10),alive:true,harborMaster:1,x:p.x*16,y:p.y*16,home:homeB?homeB.id:0,met:false,friend:12,rel:{},spouse:0,partner:0,look:id*19,dir:0,frame:0,inside:false,gift:-1});}}
function along(pts,t){if(!pts||pts.length<2)return pts&&pts[0]||{x:0,y:0};let len=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(d);len+=d;}let dist=(t%1)*len;
  for(let i=1;i<pts.length;i++){if(dist<=seg[i-1]||i===pts.length-1){const u=seg[i-1]?dist/seg[i-1]:0;return{x:pts[i-1].x+(pts[i].x-pts[i-1].x)*u,y:pts[i-1].y+(pts[i].y-pts[i-1].y)*u};}dist-=seg[i-1];}
  return pts[pts.length-1];}
function shipPos(r,t){const p=along(r.pts,t);return{x:p.x*16,y:p.y*16};}
function stepShips(){if(!SHIPS.length||!world||!hero)return;const detail=(frameN&3)===0;const near=P&&P.fly>20?900:480;
  for(const sh of SHIPS){const r=SEA[sh.i];if(!r)continue;sh.t+=0.00022;if(sh.t>=1){sh.t-=1;
    const ws=world.sets&&world.sets[r.b];if(ws){ws.price=Math.max(0.55,(ws.price||1)-0.06);ws.stock=ws.stock||{};ws.stock.bread=(ws.stock.bread||0)+2;ws.stock.fish=(ws.stock.fish||0)+1;ws.cargo=sh.cargo;}
    const from=world.sets&&world.sets[r.a];if(from)from.price=Math.min(1.75,(from.price||1)+0.03);
    const wag=(world.caravans||[]).find(c=>c&&c.land&&(c.from===r.b||c.to===r.b));if(wag){wag.cargo=sh.cargo;wag.seaLinked=1;}
    const pos=shipPos(r,0.02);if(Math.abs(hero.x-pos.x)<900&&Math.abs(hero.y-pos.y)<700){try{addNews(r.b,"A "+sh.cargo+" ship from "+SETS.find(s=>s.id===r.a).name+" docks at "+SETS.find(s=>s.id===r.b).name+". Prices ease.");}catch(e){}}}
    if(!detail&&!sh.near)continue;const p=shipPos(r,sh.t);sh.px=p.x;sh.py=p.y;sh.near=(Math.abs(hero.x-p.x)<near&&Math.abs(hero.y-p.y)<near)?1:0;}}
function sailSprite(){if(SAIL_SPR)return SAIL_SPR;const c=document.createElement("canvas");c.width=32;c.height=28;const g=c.getContext("2d");
  g.fillStyle="rgba(0,0,0,.22)";g.beginPath();g.ellipse(16,22,8,2.2,0,0,7);g.fill();
  g.fillStyle="#7a4e2c";g.fillRect(9,12,14,5);g.fillStyle="#5c3818";g.fillRect(9,16,14,2);g.fillStyle="#e8d2a4";g.fillRect(10,13,4,2);
  g.fillStyle="#f6f1e4";g.fillRect(15,2,2,10);g.fillStyle="#c4453a";g.fillRect(17,3,7,6);SAIL_SPR=c;return c;}
function drawSail(x,y,flip,bob){ctx.save();ctx.translate(x,y+bob);if(flip)ctx.scale(-1,1);ctx.drawImage(sailSprite(),-16,-14);ctx.restore();}
function putDecor(x,y,k,extra){const key=(x>>4)+","+(y>>4);let a=DECOR_AT.get(key);if(!a){a=[];DECOR_AT.set(key,a);}a.push(Object.assign({x,y,k},extra||{}));}
function bakeDecor(){DECOR_AT=new Map();CS_LIST=[];
  for(const s of SETS){if(!s||s.island)continue;const tier=tierOf(s);
    putDecor(s.x,s.y,"fount");
    const stall=tier===2?3:2;for(let i=0;i<stall;i++)putDecor(s.x-1+i,s.y+2,"stall",{i});
    if(tier>=1)putDecor(s.x+2,s.y,"mart");
    if(tier>=2)putDecor(s.x-1,s.y-1,"statue");
    if(s.citystate||s.moderno){const K=KINGDOMS.find(k=>k.cap===s.id);if(K)putDecor(s.x+1,s.y-2,"flag",{col:K.col});CS_LIST.push(s);}}
  for(const b of buildings)if(b&&b.kind==="forsale"&&!b.cabin)putDecor(b.x+b.w-1,b.y+1,"sale",{b});}
function stampDecor(c,cx,cy){const list=DECOR_AT.get(cx+","+cy);if(!list)return;const g=c.getContext("2d");g.setTransform(RS,0,0,RS,0,0);const x0=cx*16,y0=cy*16;
  for(const d of list){if(d.k==="sale"&&d.b&&owns(d.b))continue;const x=(d.x-x0)*16,y=(d.y-y0)*16;
    if(d.k==="fount"){g.fillStyle="#8aa0b0";g.fillRect(x,y+6,16,8);g.fillStyle="#3a6ea8";g.fillRect(x+3,y+8,10,4);g.fillStyle="#d8e8f8";g.fillRect(x+6,y+2,2,6);}
    else if(d.k==="stall"){g.fillStyle=["#c84a3a","#e0a040","#3a7a4a"][d.i%3];g.fillRect(x,y+4,14,8);g.fillStyle="#f4e2c0";g.fillRect(x,y+1,14,3);}
    else if(d.k==="mart"){g.fillStyle="#f3e2a4";g.fillRect(x,y,16,8);g.fillStyle="#3a2414";g.fillRect(x+6,y+8,2,8);}
    else if(d.k==="statue"){g.fillStyle="#c8c4bc";g.fillRect(x+4,y,8,14);g.fillStyle="#8a8078";g.fillRect(x+2,y-2,12,4);}
    else if(d.k==="flag"){g.fillStyle="#3a2414";g.fillRect(x+6,y,2,14);g.fillStyle=d.col||"#c84a3a";g.fillRect(x+8,y,10,7);}
    else if(d.k==="sale"){g.fillStyle="#3a2414";g.fillRect(x+6,y+6,2,10);g.fillStyle="#f3e2a4";g.fillRect(x,y,18,8);}}}
function drawPorts(){if(room||state!=="play"||!hero)return;let any=false;
  for(const p of PORTS){if(Math.abs(p.x*16-camX)<W+80&&Math.abs(p.y*16-camY)<H+60){any=true;break;}}
  if(!any)for(const sh of SHIPS)if(sh.near){any=true;break;}
  if(!any)return;
  ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);ctx.imageSmoothingEnabled=false;
  for(const p of PORTS){if(Math.abs(p.x*16-camX)>W+80||Math.abs(p.y*16-camY)>H+60)continue;const x=p.x*16,y=p.y*16,w=p.big?28:18;
    ctx.fillStyle="#6a4a28";ctx.fillRect(x-4,y,w+6,6);ctx.fillStyle="#c49a62";ctx.fillRect(x,y,w,4);
    const bob=Math.sin(frameN*0.05+p.id)*1.2;const boats=p.big?[[-36,16,0],[-12,22,1],[16,16,0],[40,24,1]]:[[-16,12,0]];
    for(const bt of boats)drawSail(x+bt[0],y+bt[1],bt[2],bob);}
  for(const sh of SHIPS){if(!sh.near||sh.px==null)continue;const r=SEA[sh.i];const a=r.pts[0],b=r.pts[r.pts.length-1];drawSail(sh.px,sh.py,b.x<a.x,Math.sin(frameN*0.08+sh.i));}
  ctx.restore();}
function ferryPrice(r){const a=r.pts[0],b=r.pts[r.pts.length-1];return Math.max(8,Math.min(80,12+Math.round(Math.hypot(b.x-a.x,b.y-a.y)/90)));}
function openFerry(port){const legs=SEA.filter(r=>r.a===port.id||r.b===port.id);
  const lines=legs.length?legs.map(r=>{const id=r.a===port.id?r.b:r.a;const ws=world.sets[id];return SETS[id].name+": "+((ws&&ws.cargo)||"goods")+" · prices "+(ws&&ws.price?ws.price.toFixed(2):"1.00");}).join("\n"):"No lane from this harbor yet.";
  const btns=legs.map(r=>{const id=r.a===port.id?r.b:r.a;const price=ferryPrice(r);const dest=PORTS.find(p=>p.id===id);
    return {l:"Sail to "+SETS[id].name+" ("+price+"g)",dis:P.gold<price,f:()=>{if(P.gold<price||!dest)return;P.gold-=price;fadeQuick(()=>{hero.x=dest.lx*16;hero.y=dest.ly*16;hero.boat=false;if(P)P.fly=0;toast("You step ashore in "+SETS[id].name+".");});}}});
  btns.push({l:"Close"});showMenu(port.name+" harbor","Harbor master "+HARBOR_NAMES[port.id%HARBOR_NAMES.length]+" keeps the books.\nThis port ships "+port.good+".\n\n"+lines,btns);}
function portHere(){if(!hero||room)return null;for(const p of PORTS){if(Math.hypot(hero.x-(p.x*16+8),hero.y-(p.y*16+4))<34)return p;}
  for(const n of npcs)if(n&&n.harborMaster&&n.alive&&Math.hypot(hero.x-n.x,hero.y-n.y)<24)return PORTS.find(p=>p.id===n.s)||null;return null;}
function roadPoly(A,B){const n=14,pts=[];for(let i=0;i<=n;i++){let x=(A.x+(B.x-A.x)*i/n)|0,y=(A.y+(B.y-A.y)*i/n)|0;let best=null,bd=7;
  for(let dy=-6;dy<=6;dy+=2)for(let dx=-6;dx<=6;dx+=2){const t=tAt(x+dx,y+dy);if(t===ROAD||t===BRIDGE||t===COBBLE){const d=Math.hypot(dx,dy);if(d<bd){bd=d;best={x:x+dx,y:y+dy};}}}
  pts.push(best||{x,y});}return pts;}
function ensureWagons(){if(!world)return;world.caravans=world.caravans||[];
  for(const p of PORTS){if(world.caravans.some(c=>c&&c.land&&c.from===p.id))continue;let dest=null,bd=1e9;for(const o of SETS){if(!o||o.id===p.id||o.island)continue;if(kOf(o.id)!==p.k&&!o.citystate)continue;const d=Math.hypot(o.x-SETS[p.id].x,o.y-SETS[p.id].y);if(d>70&&d<bd){bd=d;dest=o;}}
    if(!dest){for(const o of SETS){if(!o||o.id===p.id)continue;const d=Math.hypot(o.x-SETS[p.id].x,o.y-SETS[p.id].y);if(d>70&&d<bd){bd=d;dest=o;}}}
    if(!dest)continue;const A=SETS[p.id];world.caravans.push({from:p.id,to:dest.id,t:0.15,hours:30,live82:1,land:1,cargo:p.good,seed:p.id*13,road:roadPoly(A,dest)});
    if(world.caravans.filter(c=>c&&c.land).length>=8)break;}}
function wagonTick(){if(!world||!hero)return;for(const c of world.caravans||[]){if(!c)continue;let p=null;try{p=carPos(c);}catch(e){continue;}if(!p)continue;
  if(c._seenT!=null&&c._seenT>0.85&&p.t<0.15){const ws=world.sets[c.to];if(ws){ws.price=Math.max(0.55,(ws.price||1)-0.08);ws.stock=ws.stock||{};ws.stock.bread=(ws.stock.bread||0)+2;if(c.cargo)ws.cargo=c.cargo;}
    if(Math.hypot(hero.x-p.x,hero.y-p.y)<800){try{addNews(c.to,"A wagon of "+(c.cargo||"goods")+" from "+SETS[c.from].name+" rolls into "+SETS[c.to].name+". Prices ease.");}catch(e){}}}
  c._seenT=p.t;if(c.escort&&Math.hypot(hero.x-p.x,hero.y-p.y)<70){c.escortLeft=(c.escortLeft||20)-1;if(c.escortLeft<=0){c.escort=0;P.gold+=25;toast("The driver pays 25g for the escort.");}}}}
function wagonSprite(){if(WAGON_SPR)return WAGON_SPR;const c=document.createElement("canvas");c.width=44;c.height=28;const g=c.getContext("2d");
  g.fillStyle="rgba(0,0,0,.25)";g.fillRect(4,18,36,3);g.fillStyle="#8a5a32";g.fillRect(26,8,14,8);g.fillStyle="#c4a06a";g.fillRect(36,6,6,6);g.fillStyle="#2a1a10";g.fillRect(40,8,2,2);
  g.fillRect(28,16,2,5);g.fillRect(36,16,2,5);g.fillStyle="#6a4428";g.fillRect(4,6,22,9);g.fillStyle="#a07848";g.fillRect(6,8,8,5);
  g.fillStyle="#3a2414";g.fillRect(10,15,5,5);g.fillRect(20,15,5,5);g.fillStyle="#222";g.fillRect(11,16,3,3);g.fillRect(21,16,3,3);
  g.fillStyle="#f0d8b0";g.fillRect(16,2,4,6);g.fillStyle="#3a6a9a";g.fillRect(15,8,6,5);g.fillStyle="#c45a4a";g.fillRect(8,2,6,4);WAGON_SPR=c;return c;}
function drawCarriage(c,p){if(!p||Math.abs(p.x-hero.x)>520||Math.abs(p.y-hero.y)>400)return;const flip=p.B.x<p.A.x?-1:1;ctx.save();ctx.translate(p.x,p.y+Math.sin(frameN*0.2+(c.seed||0)));if(flip<0)ctx.scale(-1,1);ctx.drawImage(wagonSprite(),-22,-14);ctx.restore();}
function csCourt(k){const K=KINGDOMS[k];world.csStance=world.csStance||{};const stance=world.csStance[k]||"neutral";
  const decs=(world.live82&&world.live82.decrees||[]).filter(d=>d.k===k).map(d=>d.text);const dec=decs[0]||(K.ruler+" decrees open harbors and a standing bounty.");
  showMenu(K.ruler+" of "+K.name,"Throne room of "+K.name+".\nThe "+K.name+" flag hangs behind the throne.\nStance: "+stance+".\nThe port ships "+(K.good||"goods")+".\n\n"+dec,[
    {l:"Read the decree",f:()=>toast(dec)},
    {l:"Turn in a gem bounty (40g)",f:()=>{if(!(P.inv.gem>0))return toast("The bounty asks for a gem.");P.inv.gem--;P.gold+=40;toast(K.ruler+" pays the bounty. +40g.");}},
    {l:stance==="ally"?"Remain neutral":"Offer an alliance",f:()=>{world.csStance[k]=stance==="ally"?"neutral":"ally";toast(K.name+" is now "+world.csStance[k]+".");}},
    {l:"Leave"}]);}
function seedDecrees(){if(!world)return;if(!world.live82)world.live82={help:{},decrees:[],lastDecree:-99,quest:null,holdDay:{}};world.live82.decrees=world.live82.decrees||[];
  for(const K of KINGDOMS)if(K.citystate&&!world.live82.decrees.some(d=>d.k===K.id))world.live82.decrees.unshift({k:K.id,day:world.day||0,text:K.ruler+" of "+K.name+" decrees open trade and posts 40g for a gem."});}
function seatManor(){const S=modCity();if(!S||S.name!=="Moderno")return;const ox=ESTATE.x,oy=ESTATE.y;
  for(let y=oy-1;y<=oy+ESTATE.h;y++)for(let x=ox-1;x<=ox+ESTATE.w;x++){if(x<0||y<0||x>=WW||y>=WH)continue;if(OCC[y*WW+x]===-2)OCC[y*WW+x]=0;}
  ESTATE.x=S.x-10;ESTATE.y=Math.max(4,S.y-Math.round(S.r*0.45));
  for(let y=ESTATE.y;y<ESTATE.y+ESTATE.h;y++)for(let x=ESTATE.x;x<ESTATE.x+ESTATE.w;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;if(OCC[i]>0)continue;const t=T[i];if(t===DEEP||t===SHAL||t===CLIFF||t===MTN||t===WALL)continue;T[i]=GRASS;}
  for(let i=0;i<10;i++){const x=ESTATE.x+12,y=ESTATE.y+ESTATE.h+i;if(y>=S.y)break;if(OCC[y*WW+x]>0)continue;T[y*WW+x]=COBBLE;}
  try{eApply();}catch(e){}
  window.__MANOR={x:ESTATE.x,y:ESTATE.y,city:S.name,cx:S.x,cy:S.y};}
function shiftBy(moves,flag){if(!world||world[flag])return;for(const m of moves){for(const n of npcs)if(n&&n.s===m.id){n.x+=m.dx*TILE;n.y+=m.dy*TILE;}
  if(hero&&Math.hypot(hero.x/TILE-m.ox,hero.y/TILE-m.oy)<(m.r||40)+30){hero.x+=m.dx*TILE;hero.y+=m.dy*TILE;}
  if(P&&P.respawn&&Math.hypot(P.respawn.x/TILE-m.ox,P.respawn.y/TILE-m.oy)<(m.r||40)+30){P.respawn.x+=m.dx*TILE;P.respawn.y+=m.dy*TILE;}}world[flag]=1;}
function shiftPeople(){shiftBy(CITY_MOVES,"cityShift");shiftBy(ISLE_MOVES,"isleShift");}
const PIN=new Map();const BAKE_Q=[];
function queueChunks(tx,ty,rad,front){const c0=(tx/TILE)>>4,r0=(ty/TILE)>>4;const batch=[];for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const k=(c0+dx)+","+(r0+dy);if(PIN.has(k))continue;batch.push([c0+dx,r0+dy]);}if(front)for(let i=batch.length-1;i>=0;i--)BAKE_Q.unshift(batch[i]);else for(const b of batch)BAKE_Q.push(b);}
function bakeStep(budget){const t0=performance.now();let n=0;while(BAKE_Q.length&&performance.now()-t0<budget){const j=BAKE_Q.shift();const k=j[0]+","+j[1];if(PIN.has(k))continue;try{PIN.set(k,getChunk(j[0],j[1]));n++;}catch(e){window.__bakeErr=String(e&&e.message||e);}if(PIN.size>96)PIN.delete(PIN.keys().next().value);}window.__bakeN=(window.__bakeN||0)+n;return n;}
function queueBake(){for(const s of SETS)if(s&&(s.citystate||s.moderno||s.wayford))queueChunks(s.x*TILE,s.y*TILE,1);window.__qLen=BAKE_Q.length;
  let borders=false;function step(){try{if(!TILESET&&typeof makeTiles==="function")TILESET=makeTiles(0);if(!borders){borders=true;buildBorders();window.__borders=1;}if(TILESET)bakeStep(8);}catch(e){window.__bakeErr=String(e&&e.message||e);}if(BAKE_Q.length)setTimeout(step,TILESET?0:80);else window.__baked=PIN.size;}
  function arm(){if(!window.__READY){setTimeout(arm,80);return;}setTimeout(step,40);}setTimeout(arm,80);}
function bootCities(){if(bootCities.done)return;bootCities.done=1;
  try{ensureCityStates();placeCityIslands();CITY_MOVES=separateTowns();applyMoves(CITY_MOVES);ensureDistricts();fillCityStates();ensurePorts();
    queueBake();
    const added=buildings.filter(b=>b&&b.portHome).length;window.__homesAdded=added;window.__cityMoves=CITY_MOVES;seatManor();}catch(e){console.warn("cities",e);window.__cityErr=String(e&&e.stack||e);}}
if(typeof worldRestore==="function"){const _wr=worldRestore;worldRestore=function(){const r=_wr.apply(this,arguments);try{bootCities();}catch(e){console.warn(e);}return r;};}
if(typeof genWorld==="function"){const _gw=genWorld;genWorld=async function(){const r=await _gw.apply(this,arguments);try{bootCities();}catch(e){}return r;};}
if(typeof ruinTown==="function"){const _rt=ruinTown;ruinTown=function(sid){const S=SETS[sid];if(S&&(S.port||S.citystate||S.name==="Moderno")){try{toast(S.name+" holds. Wars leave the town standing.");}catch(e){}return;}return _rt.apply(this,arguments);};}
if(typeof startWar==="function"){const _sw=startWar;startWar=function(a,b,why){const A=KINGDOMS[a],B=KINGDOMS[b];if((A&&(A.citystate||A.hold))||(B&&(B.citystate||B.hold)))return false;return _sw.apply(this,arguments);};}
if(typeof frontOf==="function"){const _fo=frontOf;frontOf=function(w){const f=_fo.apply(this,arguments);if(!f)return f;for(const s of SETS){if(!s||!s.citystate)continue;if(Math.hypot(f.x-s.x,f.y-s.y)<s.r+8){const dx=f.x-s.x||1,dy=f.y-s.y||0,d=Math.hypot(dx,dy)||1,R=s.r+16;f.x=Math.round(s.x+dx/d*R);f.y=Math.round(s.y+dy/d*R);}}return f;};}
if(typeof rulerAudience==="function"){const _ra=rulerAudience;rulerAudience=function(k){const K=KINGDOMS[k];if(K&&K.citystate)return csCourt(k);return _ra.apply(this,arguments);};}
{const _lg=loadGame;loadGame=function(){if(window.__rebuilt)return false;const r=_lg.apply(this,arguments);if(r&&world&&world.wrev!==4){try{localStorage.removeItem(SAVEKEY);localStorage.removeItem(SAVEKEY+"_bak");}catch(e){}window.__rebuilt=1;return false;}try{if(r){shiftPeople();ensurePorts();syncBld();ensureCityFolk();ensureHarborFolk();ensureWagons();seedDecrees();for(const n of npcs)if(n&&SETS[n.s]&&SETS[n.s].citystate)n.demon=false;}}catch(e){}return r;};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{if(world){world.cityShift=1;world.isleShift=1;world.wrev=4;}syncBld();ensurePorts();ensureCityFolk();ensureHarborFolk();ensureWagons();seedDecrees();}catch(e){}return r;};}
{const _ng=newGame;newGame=function(){if(window.__rebuilt){const _t=toast;toast=function(m){toast=_t;return _t(m&&String(m).indexOf("new life")>=0?"The world was rebuilt. A new adventure begins.":m);};}return _ng.apply(this,arguments);};}
{const _up=update;update=function(){const r=_up.apply(this,arguments);try{if(state==="play"){stepShips();if((frameN%20)===0)wagonTick();
  if(hero&&!room&&(frameN&7)===0){for(const s of CS_LIST){if(Math.abs(hero.x-s.x*TILE)>1100||Math.abs(hero.y-s.y*TILE)>800)continue;const R=(s.r+6)*TILE;for(const m of mobs){if(!m||m.dead||!(m.raider||m.hunter||m.war49||m.soldier))continue;const dx=m.x-s.x*TILE,dy=m.y-s.y*TILE;if(dx*dx+dy*dy<R*R){const d=Math.hypot(dx,dy)||1;m.x=s.x*TILE+dx/d*(R+20);m.y=s.y*TILE+dy/d*(R+20);}}}}}}catch(e){}return r;};}
{const _dr=draw;draw=function(){const r=_dr.apply(this,arguments);try{drawPorts();}catch(e){}return r;};}
if(typeof drawCartFlag==="function"){drawCartFlag=function(c,p){if(p)drawCarriage(c,p);};}
if(typeof carPos==="function"){const _cp=carPos;carPos=function(c){if(c&&c.road&&c.road.length){if(c._pos&&hero&&(frameN-(c._pf||0))<12){const dx=c._pos.x-hero.x,dy=c._pos.y-hero.y;if(dx*dx+dy*dy>700*700)return c._pos;}
  const span=Math.max(60,(c.hours||10)*60);const clock=((world.day*1440+(world.min|0))+(c.seed||0))%span;const t=clock/span;const q=along(c.road,t);const A=SETS.find(s=>s.id===c.from),B=SETS.find(s=>s.id===c.to);if(!A||!B)return _cp(c);
  c._pf=frameN;return c._pos={x:q.x*TILE,y:q.y*TILE,t,A,B};}return _cp(c);};}
if(typeof caravanMenu==="function"){const _cm=caravanMenu;caravanMenu=function(hit){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;if(t==="Caravan"&&Array.isArray(b)){const c=hit.c;const item=CARGO_ITEM[c.cargo]||"herb";const cost=Math.max(6,Math.round(12*((world.sets[c.from]&&world.sets[c.from].price)||1)));
  b=b.slice();b.splice(Math.max(0,b.length-1),0,{l:"Buy "+(c.cargo||"goods")+" ("+cost+"g)",dis:P.gold<cost,f:()=>{P.gold-=cost;P.inv[item]=(P.inv[item]||0)+1;toast("The driver hands over the "+(c.cargo||"crate")+".");}},{l:"Escort the wagon (+25g)",f:()=>{c.escort=1;c.escortLeft=24;toast("Stay with the wagon. The driver will pay at the end of the watch.");}});
  x=(x||"")+"\nDriver: We are hauling "+(c.cargo||"goods")+(c.seaLinked?" straight off the ship.":".");}
  return sm(t,x,b);};try{return _cm(hit);}finally{showMenu=sm;}};}
{const _in=interact;interact=function(){const p=portHere();if(p){openFerry(p);return true;}return _in.apply(this,arguments);};}
{const _ih=interactHint;interactHint=function(){if(portHere())return "A: Harbor";return _ih();};}
let BORDER_LAYER=null,BORDER_SIG=-1;
function borderSig(){let s=0;const o=world&&world.owner||{};for(const k in o)s=(s*17+(+k)*3+(+o[k]|0))|0;return s;}
function paintKingdomCells(){if(typeof buildKGrid==="function"&&(!KGRID))buildKGrid();if(!KGRID)return;const step=8,gw=Math.ceil(WW/step);
  for(const s of SETS){if(!s||!(s.citystate||s.moderno))continue;const k=s.king|0,rad=(s.r||70)+6;for(let y=s.y-rad;y<=s.y+rad;y+=step)for(let x=s.x-rad;x<=s.x+rad;x+=step){if(Math.hypot(x-s.x,y-s.y)>rad)continue;const gx=x/step|0,gy=y/step|0;if(gx<0||gy<0||gx>=gw)continue;KGRID[gy*gw+gx]=k;}}}
function buildBorders(){paintKingdomCells();const step=8,gw=Math.ceil(WW/step),gh=Math.ceil(WH/step);const c=document.createElement("canvas");c.width=gw;c.height=gh;const g=c.getContext("2d");const img=g.createImageData(gw,gh),d=img.data;
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const tx=x*step,ty=y*step;const t=tAt(tx,ty);if(t===DEEP||t===SHAL)continue;const k=KGRID[y*gw+x];const K=KINGDOMS[k];if(!K||!K.rgb)continue;const edge=KGRID[y*gw+x+1]!==k||KGRID[(y+1)*gw+x]!==k||KGRID[y*gw+x-1]!==k||KGRID[(y-1)*gw+x]!==k;const o=(y*gw+x)*4;
    d[o]=edge?20:K.rgb[0];d[o+1]=edge?16:K.rgb[1];d[o+2]=edge?12:K.rgb[2];d[o+3]=edge?210:48;}
  g.putImageData(img,0,0);
  for(const s of SETS)if(s&&(s.citystate||s.moderno)){const K=KINGDOMS.find(q=>q&&q.cap===s.id);if(!K)continue;g.beginPath();g.arc(s.x/step,s.y/step,(s.r||70)/step,0,7);g.strokeStyle="#140c08";g.lineWidth=2;g.setLineDash([3,2]);g.stroke();g.strokeStyle=K.col;g.lineWidth=1.2;g.stroke();g.setLineDash([]);}
  BORDER_LAYER=c;BORDER_SIG=borderSig();}
function blitBorders(g,x0,y0,tw,th,dw,dh){if(!BORDER_LAYER||BORDER_SIG!==borderSig())buildBorders();if(!BORDER_LAYER)return;g.save();g.imageSmoothingEnabled=false;g.drawImage(BORDER_LAYER,x0/8,y0/8,Math.max(1,tw/8),Math.max(1,th/8),0,0,dw,dh);g.restore();}
function mapLegend(){const el=document.getElementById("maplegend");if(!el||el._cs)return;el._cs=1;const rows=KINGDOMS.filter(k=>k&&k.col).map(k=>`<div><span style="display:inline-block;width:10px;height:10px;background:${k.col};border:1px solid #140c08;margin-right:4px"></span>${k.citystate?"⚑ ":""}${k.name}</div>`).join("");
  el.insertAdjacentHTML("beforeend","<div style=\"margin-top:6px\"><b>Countries</b>"+rows+"</div>");}
function paintTrade(g,P2){if(!g)return;g.save();
  if(SEA.length){g.setLineDash([3,4]);g.strokeStyle="rgba(186,226,255,.92)";g.lineWidth=1.4;g.beginPath();for(const r of SEA){const a=P2(r.pts[0].x,r.pts[0].y);g.moveTo(a[0],a[1]);for(let i=1;i<r.pts.length;i++){const q=P2(r.pts[i].x,r.pts[i].y);g.lineTo(q[0],q[1]);}}g.stroke();g.setLineDash([]);
    g.fillStyle="#9fd4ff";for(const p of PORTS){const q=P2(p.x,p.y);g.fillRect(q[0]-2,q[1]-2,4,4);}}
  g.setLineDash([2,3]);g.strokeStyle="rgba(232,192,96,.9)";g.lineWidth=1.2;g.beginPath();
  for(const c of (world&&world.caravans)||[]){if(!c||!c.road)continue;const a=P2(c.road[0].x,c.road[0].y);g.moveTo(a[0],a[1]);for(let i=1;i<c.road.length;i+=2){const q=P2(c.road[i].x,c.road[i].y);g.lineTo(q[0],q[1]);}}g.stroke();g.setLineDash([]);
  for(const c of (world&&world.caravans)||[]){let p=null;try{p=carPos(c);}catch(e){continue;}if(!p)continue;const q=P2(p.x/TILE,p.y/TILE);g.fillStyle="#e8c060";g.fillRect(q[0]-3,q[1]-2,7,4);g.fillStyle="#6a4428";g.fillRect(q[0]+3,q[1]-3,3,2);}
  for(const s of SETS)if(s&&s.citystate){const K=KINGDOMS.find(k=>k.cap===s.id);const q=P2(s.x,s.y);if(K){g.fillStyle=K.col;g.fillRect(q[0]-3,q[1]-8,6,4);} }
  g.restore();}
{const _mi=mapInfo;mapInfo=function(){const o=_mi.apply(this,arguments);try{const tx=(hero.x+6)/TILE,ty=(hero.y+8)/TILE;for(const s of SETS){if(!s||!s.citystate)continue;if(Math.hypot(tx-s.x,ty-s.y)<(s.r||70)){o.town=s.name;o.inTown=true;o.dist=0;const K=KINGDOMS.find(k=>k&&k.cap===s.id);if(K)o.kingdom=K.name;break;}}}catch(e){}return o;};}
{const _mf=drawFullMap;drawFullMap=function(){const r=_mf.apply(this,arguments);try{const c=document.getElementById("mapc");if(c){const g=c.getContext("2d");const dpr=Math.min(2,window.devicePixelRatio||1);g.setTransform(dpr,0,0,dpr,0,0);const s=mapScaleCss();const x0=MAPM.cx-c.clientWidth/2/s,y0=MAPM.cy-c.clientHeight/2/s;blitBorders(g,x0,y0,c.clientWidth/s,c.clientHeight/s,c.clientWidth,c.clientHeight);paintTrade(g,(x,y)=>[(x-MAPM.cx)*s+c.clientWidth/2,(y-MAPM.cy)*s+c.clientHeight/2]);mapLegend();}}catch(e){}return r;};}
{const _mm=drawMini;drawMini=function(){const r=_mm.apply(this,arguments);try{if(typeof mini==="undefined"||!hero)return r;const R=MINI_R[miniZ],tx=hero.x/TILE,ty=hero.y/TILE,sx=mini.width/(R*2),sy=mini.height/(R*1.5);
  blitBorders(mg,tx-R,ty-R*0.75,R*2,R*1.5,mini.width,mini.height);
  for(const s of SETS){const x=(s.x-tx+R)*sx,y=(s.y-ty+R*0.75)*sy;const K=s.citystate?KINGDOMS.find(k=>k&&k.cap===s.id):KINGDOMS[kOf(s.id)];mg.fillStyle=K&&K.col||"#ffd84a";mg.fillRect(x-2,y-2,4,4);}
  if((frameN&3)!==0)return r;const P2=(x,y)=>[(x-tx+R)*sx,(y-ty+R*0.75)*sy];
  mg.save();mg.setLineDash([2,2]);mg.strokeStyle="rgba(186,226,255,.9)";mg.lineWidth=1;mg.beginPath();
  for(const rt of SEA){let on=false;for(const q of rt.pts)if(Math.abs(q.x-tx)<R&&Math.abs(q.y-ty)<R)on=true;if(!on)continue;const a=P2(rt.pts[0].x,rt.pts[0].y);mg.moveTo(a[0],a[1]);for(let i=1;i<rt.pts.length;i++){const q=P2(rt.pts[i].x,rt.pts[i].y);mg.lineTo(q[0],q[1]);}}
  mg.stroke();mg.setLineDash([]);for(const p of PORTS){if(Math.abs(p.x-tx)>R)continue;const q=P2(p.x,p.y);mg.fillStyle="#9fd4ff";mg.fillRect(q[0]-1,q[1]-1,3,3);}
  for(const sh of SHIPS){if(!sh.near||sh.px==null)continue;const q=P2(sh.px/TILE,sh.py/TILE);mg.fillStyle="#e8c060";mg.fillRect(q[0]-2,q[1]-1,4,2);}mg.restore();}catch(e){}return r;};}
if(typeof mapTap==="function"){const _mt=mapTap;mapTap=function(e){try{const c=document.getElementById("mapc");const r=c.getBoundingClientRect();const s=mapScaleCss();const tx=MAPM.cx+(e.clientX-r.left-c.clientWidth/2)/s,ty=MAPM.cy+(e.clientY-r.top-c.clientHeight/2)/s;
  let best=null,bd=Math.max(8,22/s);for(const S of SETS){const d=Math.hypot(S.x-tx,S.y-ty);if(d<bd){bd=d;best=S;}}
  if(best){toggleMap();warpTo(best.x*TILE+2,(best.y+3)*TILE+2,best.name);return;}}catch(err){}return _mt.apply(this,arguments);};}
if(typeof markVisited==="function"){const _mv=markVisited;markVisited=function(){_mv();try{const S=settlementAt(hero.x,hero.y);if(!S)return;for(const w of waystones)if(w&&w.s===S.id)w.found=true;}catch(e){}};}
{const _hs=homeSpots;homeSpots=function(){return _hs();};}
{const _dhm=drawHomesMap;drawHomesMap=function(g,P2,txt,z){_dhm.apply(this,arguments);if(!g||z<3)return;const c=document.getElementById("mapc");const cw=c?c.clientWidth:800,ch=c?c.clientHeight:400;
  for(const b of buildings){if(!b||b.kind!=="forsale"||b.cabin||owns(b))continue;const xy=P2(b.x+b.w/2,b.y+b.h/2),x=xy[0],y=xy[1];if(x<12||y<12||x>cw-12||y>ch-12)continue;
    g.font="bold 10px system-ui";g.textAlign="center";g.lineWidth=3;g.strokeStyle="#140c08";g.strokeText(homePrice(b)+"g",x,y+12);g.fillStyle="#fff";g.fillText(homePrice(b)+"g",x,y+12);}};}
if(typeof getChunk==="function"){const _chunk=getChunk;getChunk=function(cx,cy){const k=cx+","+cy;const hit=PIN.get(k);if(hit)return hit;const c=_chunk(cx,cy);if(c&&!c._decor){c._decor=1;try{stampDecor(c,cx,cy);}catch(e){}}return c;};}
if(typeof warpTo==="function"){const _warp=warpTo;warpTo=function(px,py,label,after){queueChunks(px,py,2,true);bakeStep(24);const done=after;return _warp(px,py,label,function(){bakeStep(36);if(done)done();});};}
if(typeof buyHome==="function"){const _bh=buyHome;buyHome=function(b){const r=_bh.apply(this,arguments);try{if(b)invalidateTile(b.x+b.w,b.y);}catch(e){}return r;};}
window.__seaBoot=function(){try{bootCities();}catch(e){}return window.__PORTS93;};
