// ===== v47 WORLD x2: the map doubles eastward (2048x800). Old lands keep their exact tiles and coordinates;
// a new eastern continent, joined by isthmus roads, holds six new settlements, ruins and lore. =====
SETS.push(
 {id:19,name:"Eastwatch",kind:"capital town",x:1250,y:290,r:22,roof:["#c87a3a","#6a3a14"],wall:"#ead8bc",gem:"#fc9"},
 {id:20,name:"Frostmere",kind:"capital town",x:1800,y:140,r:22,roof:["#a8c8e8","#4a6a90"],wall:"#eef2f6",gem:"#cff",region:"tundra"},
 {id:21,name:"Sandhaven",kind:"capital town",x:1660,y:680,r:22,roof:["#e8a85a","#9a5a1a"],wall:"#f6e2b8",gem:"#fd8",region:"desert"},
 {id:22,name:"Ambervale",kind:"town",x:1500,y:460,r:20,roof:["#d0642a","#7a2a10"],wall:"#f2e4c8",gem:"#fa6"},
 {id:23,name:"Mossdeep",kind:"capital town",x:1880,y:440,r:22,roof:["#5a7a3a","#2a3a1a"],wall:"#a89068",gem:"#ae6",region:"swamp"},
 {id:24,name:"Highmarch",kind:"village",x:1430,y:110,r:18,roof:["#7a7aa8","#3a3a6a"],wall:"#d8d4cc",gem:"#ccf"},
 {id:25,name:"Icewind",kind:"village",x:1950,y:280,r:17,roof:["#b8d0e8","#5a7aa0"],wall:"#f2f6fa",gem:"#dff",region:"tundra"},
 {id:26,name:"Oasis Rest",kind:"village",x:1330,y:690,r:17,roof:["#f0b860","#a06020"],wall:"#f8e8c0",gem:"#fe9",region:"desert"});
KOF.push(4,5,6,7,7,4,5,6);
LOBES.push({x:1010,y:300,rx:150,ry:30,k:"e_isth"},{x:1330,y:270,rx:230,ry:180,k:"e1"},{x:1610,y:600,rx:260,ry:170,k:"e2"},{x:1790,y:250,rx:170,ry:170,k:"e3"},
 {x:1880,y:470,rx:100,ry:110,k:"e4"},{x:1480,y:420,rx:140,ry:110,k:"e5"},{x:1040,y:620,rx:150,ry:24,k:"e_isth2"});
ISLES.push({x:1960,y:700,r:22,name:"Sunspire Isle"},{x:1150,y:90,r:16,name:"Gale Rock"});
POIS.push({x:1300,y:400,name:"Ember Barrow",loot:{gold:160,gem:3}},{x:1700,y:300,name:"Glacier Crypt",loot:{gold:170,pearl:3,gem:2}},{x:1560,y:600,name:"Sunken Bazaar",loot:{gold:180,gem:3}},
 {x:1880,y:360,name:"Bogheart Shrine",loot:{gold:150,dscale:1,gem:2}},{x:1240,y:180,name:"Old Lighthouse",loot:{gold:140,pearl:4}},{x:1960,y:700,name:"Sunspire Ruins",loot:{gold:220,gem:4,dscale:1}});
RIVERS2.push([[1360,120],[1330,220],[1352,330],[1330,420],[1360,560],[1340,740],[1346,799]],[[1720,60],[1690,200],[1712,300],[1682,420]]);
const EXTRA_ROADS=[[11,19],[19,22],[19,24],[22,21],[22,23],[24,20],[23,20],[20,25],[25,23],[21,26],[26,22],[17,26]];
{const _rk=regionKind;regionKind=function(x,y){if(SETS.some(s=>s.id>=19)&&x>=1100){if(Math.hypot(x-1880,y-440)<34)return null;// Mossdeep sits on dry ground inside the marsh
if(x>1620&&y<330)return"tundra";if(y>600&&x>1420)return"desert";if(x>1790&&y>360&&y<560)return"swamp";return null;}return _rk(x,y);};}
// ---- save migration: tile-indexed maps move to the wider grid; new towns get their people and stalls ----
function w47Remap(o){if(!o)return o;const n={};for(const k of Object.keys(o)){const i=+k;if(!isFinite(i)){n[k]=o[k];continue;}const y=Math.floor(i/1024),x=i%1024;n[y*WW+x]=o[k];}return n;}
function w47Migrate(d){if(!d||!d.world||d.world.w2)return;d.world.harvested=w47Remap(d.world.harvested);d.world.trees=w47Remap(d.world.trees);d.world.w2=1;}
function w47Populate(){if(!world||!world.sets)return 0;let c=0;
  while(world.bld.length<buildings.length)world.bld.push({dmg:0,burn:0});
  for(const s of SETS){if(world.sets[s.id])continue;world.sets[s.id]={id:s.id,price:1,stock:{bread:10,potion:4,flowers:5,pie:3,ring:1,axe:2},crop:0,festival:0,merchant:0,raid:null,dmgLog:0,jobs:[],safety:1};
    if(npcs.some(n=>n.s===s.id))continue;const roles=s.kind.includes("town")?ROLES_T:ROLES_V;const made=[];roles.forEach(r=>made.push(makeNpc(s.id,r)));
    s.bIdx.filter(b=>buildings[b].kind==="house").forEach((h,i)=>{const n=makeNpc(s.id,pick(s.kind.includes("town")?["guard","smith","fisher","farmer","child","farmer"]:["farmer","fisher","child","farmer"]));n.home=h;const dd=doorOf(buildings[h]);n.x=dd.x;n.y=dd.y;made.push(n);});
    for(const a of made)for(const b of made)if(a!==b)a.rel[b.id]=Math.floor(Math.random()*50);c+=made.length;try{addNews(s.id,`Travelers speak of ${s.name}, a ${s.kind} in the newly charted east.`);}catch(_){}}
  return c;}
function layoutEast47(){for(const s of SETS)if(s.id>=19&&!s.free)layoutSettlement(s);}
