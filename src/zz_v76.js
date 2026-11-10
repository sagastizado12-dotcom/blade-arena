// ===== v76: twice the playable land, cities inside each realm's own ground, names on the overview.
// Old towns keep their coordinates. New land is appended east and south.
const W76_OLD=[6208,4768];
const CITIES76=[
  {id:36,name:"Redfen",kind:"town",x:2360,y:240,r:18,roof:["#c45a3a","#7a3018"],wall:"#f6e6c8",gem:"#f88",king:1,parent:10},
  {id:37,name:"Greymere",kind:"town",x:200,y:3900,r:18,roof:["#5ac88a","#1a6a40"],wall:"#f0e4c4",gem:"#afc",king:2,parent:30},
  {id:38,name:"Southmere",kind:"town",x:200,y:4760,r:18,roof:["#3aa860","#14582a"],wall:"#f4ecd4",gem:"#8f8",king:2,parent:37},
  {id:39,name:"Ashenwell",kind:"town",x:2180,y:3180,r:18,roof:["#7a2030","#3a0810"],wall:"#585058",gem:"#f66",king:3,demon:1,parent:18},
  {id:40,name:"Cinderwatch",kind:"town",x:1860,y:3860,r:18,roof:["#5a1838","#2a0818"],wall:"#4a3a48",gem:"#f4a",king:3,demon:1,parent:39},
  {id:41,name:"Goldwake",kind:"town",x:5160,y:340,r:18,roof:["#e0a040","#8a5a18"],wall:"#f6e6c4",gem:"#fc6",king:4,parent:25},
  {id:42,name:"Dunemarsh",kind:"town",x:6120,y:240,r:18,roof:["#c4a05a","#7a5828"],wall:"#f4e4c0",gem:"#fd8",king:4,parent:41},
  {id:43,name:"Highbarrow",kind:"town",x:6380,y:2500,r:18,roof:["#3aa0b8","#145868"],wall:"#f4f0e4",gem:"#9ef",king:5,parent:26},
  {id:44,name:"Millhaven",kind:"town",x:7140,y:2420,r:18,roof:["#5a88a8","#2a4860"],wall:"#efe6d4",gem:"#adf",king:5,parent:43},
  {id:45,name:"Bloomreach",kind:"town",x:4540,y:5140,r:18,roof:["#6aaa48","#2a5a18"],wall:"#f2ead0",gem:"#cf8",king:6,parent:29},
  {id:46,name:"Lanternmere",kind:"town",x:4320,y:6020,r:18,roof:["#d8c060","#8a7420"],wall:"#f8f0d4",gem:"#fea",king:6,parent:45}
];
for(const s of CITIES76){s.deferLayout=1;s.v76=1;SETS.push(s);KOF[s.id]=s.king;}
LOBES.push(
  {x:7000,y:1600,rx:1500,ry:1400,k:"v76east"},
  {x:6400,y:2400,rx:500,ry:400,k:"v76neck"},
  {x:5600,y:420,rx:900,ry:500,k:"v76north"},
  {x:4200,y:5600,rx:1400,ry:900,k:"v76south"},
  {x:500,y:4400,rx:700,ry:900,k:"v76sw"},
  {x:2000,y:3500,rx:700,ry:550,k:"v76nether"}
);
{const _ls=layoutSettlement;layoutSettlement=function(s){if(s&&s.v76&&s._laid)return;const r=_ls.apply(this,arguments);if(s&&s.v76&&s._layNow)s._laid=1;return r;};}
{const _gd=genDuneHomes;genDuneHomes=function(){const r=_gd.apply(this,arguments);
  for(const s of CITIES76){s._layNow=1;layoutSettlement(s);
    if(s.demon)for(let y=s.y-s.r;y<=s.y+s.r;y++)for(let x=s.x-s.r;x<=s.x+s.r;x++){if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const i=y*WW+x;if(T[i]===GRASS||T[i]===FLOWER)T[i]=MUD;}}
  return r;};}
{const _gw=genWorld;genWorld=function(){const r=_gw.apply(this,arguments);try{
  for(const s of CITIES76){const p=SETS[s.parent];if(p&&typeof stampRoad==="function")stampRoad(p,s);}
}catch(e){console.warn("v76 roads",e);}return r;};}
function territory76(s){let same=1e9,foreign=1e9,fn="",sn="";
  for(const o of SETS){if(o===s||o.island)continue;const d=Math.hypot(o.x-s.x,o.y-s.y);const k=kOf(o.id);
    if(k===kOf(s.id)){if(d<same){same=d;sn=o.name;}}else if(d<foreign){foreign=d;fn=o.name;}}
  return {same:Math.round(same),sn,foreign:Math.round(foreign),fn,inside:same+40<foreign};}
function report76(){const rows=[];
  for(const k of KINGDOMS){const cities=SETS.filter(s=>kOf(s.id)===k.id&&/town/.test(s.kind||""));
    rows.push({id:k.id,name:k.name,n:cities.length,cities:cities.map(s=>({name:s.name,x:s.x,y:s.y,kind:s.kind}))});}
  const fresh=CITIES76.map(s=>{const t=territory76(SETS[s.id]||s);const b=SETS[s.id];
    const blds=b?buildings.filter(x=>x&&x.s===s.id):[];
    const folks=b?npcs.filter(n=>n.alive&&n.s===s.id):[];
    return {name:s.name,king:KINGDOMS[s.king].name,x:s.x,y:s.y,...t,inn:blds.some(x=>x.kind==="inn"),shop:blds.some(x=>x.kind==="shop"),guild:blds.some(x=>x.kind==="guild"),leader:folks.some(n=>n.role==="leader"),guard:folks.some(n=>n.role==="guard"),npcs:folks.length,blds:blds.length};});
  return {ww:WW,wh:WH,area:(WW*WH)/(W76_OLD[0]*W76_OLD[1]),sets:SETS.length,rows,fresh,lookouts:LOOKOUTS.length,cones:(typeof PROPS!=="undefined"?PROPS.filter(p=>p.type==="tent2").length:0)};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{if(world)world.wide76=1;}catch(_){}return r;};}
function mapLabels76(z){const ov=document.getElementById("mapov");if(ov)ov.classList.remove("hidden");
  MAPM.z=z;MAPM.cx=WW/2;MAPM.cy=WH/2;mapClamp();drawFullMap();
  return (window.__mapLabels||[]).map(l=>l.t);}
function focus76(name,z){const s=SETS.find(x=>x.name===name);const ov=document.getElementById("mapov");if(ov)ov.classList.remove("hidden");
  MAPM.z=z==null?MAPM.z:z;if(s){MAPM.cx=s.x;MAPM.cy=s.y;}mapClamp();drawFullMap();return (window.__mapLabels||[]).map(l=>l.t);}
window.__V76={cities:CITIES76.map(s=>s.name),report:report76,old:W76_OLD,labels:mapLabels76,focus:focus76};
