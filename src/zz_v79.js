// ===== v79: more cities in the larger countries, spaced at least as far as the closest
// existing pair (Aldmoor–Highcrest, 321 tiles). Counts follow land area. The towns
// are baked into the map pack, so a normal boot does not lay them out again.
const CITIES79=[
  {id:47,name:"Mossglen",kind:"town",x:1128,y:4616,r:18,roof:["#5ac88a","#1a6a40"],wall:"#f0e4c4",gem:"#afc",king:2},
  {id:48,name:"Deeproot",kind:"town",x:744,y:5208,r:18,roof:["#3aa860","#14582a"],wall:"#f4ecd4",gem:"#8f8",king:2},
  {id:49,name:"Elmrest",kind:"town",x:6936,y:312,r:18,roof:["#e0a040","#8a5a18"],wall:"#f6e6c4",gem:"#fc6",king:4},
  {id:50,name:"Woldham",kind:"town",x:3544,y:1672,r:18,roof:["#c4a05a","#7a5828"],wall:"#f4e4c0",gem:"#fd8",king:4},
  {id:51,name:"Ryehall",kind:"town",x:4904,y:1896,r:18,roof:["#d0a050","#7a5820"],wall:"#f6e6c4",gem:"#fd8",king:4},
  {id:52,name:"Oatford",kind:"town",x:5688,y:744,r:18,roof:["#e0a040","#8a5a18"],wall:"#f6e6c4",gem:"#fc6",king:4},
  {id:53,name:"Gullhaven",kind:"town",x:8104,y:776,r:18,roof:["#3aa0b8","#145868"],wall:"#f4f0e4",gem:"#9ef",king:5,harbor:true},
  {id:54,name:"Cormouth",kind:"town",x:8328,y:2008,r:18,roof:["#5a88a8","#2a4860"],wall:"#efe6d4",gem:"#adf",king:5,harbor:true},
  {id:55,name:"Drifthaven",kind:"town",x:6968,y:1224,r:18,roof:["#3aa0b8","#145868"],wall:"#f4f0e4",gem:"#9ef",king:5},
  {id:56,name:"Shellford",kind:"town",x:6176,y:1616,r:18,roof:["#5a88a8","#2a4860"],wall:"#efe6d4",gem:"#adf",king:5},
  {id:57,name:"Foamreach",kind:"town",x:7880,y:2712,r:18,roof:["#3a90a8","#145060"],wall:"#f4f0e4",gem:"#9ef",king:5,harbor:true},
  {id:58,name:"Keelbay",kind:"town",x:7720,y:1496,r:18,roof:["#5a88a8","#2a4860"],wall:"#efe6d4",gem:"#adf",king:5},
  {id:59,name:"Cloverfen",kind:"town",x:2840,y:5512,r:18,roof:["#6aaa48","#2a5a18"],wall:"#f2ead0",gem:"#cf8",king:6},
  {id:60,name:"Sunmead",kind:"town",x:5448,y:5768,r:18,roof:["#d8c060","#8a7420"],wall:"#f8f0d4",gem:"#fea",king:6},
  {id:61,name:"Petalgate",kind:"town",x:3592,y:4904,r:18,roof:["#68a848","#2a5818"],wall:"#f2ead0",gem:"#cf8",king:6},
  {id:62,name:"Honeymead",kind:"town",x:3416,y:6280,r:18,roof:["#c8b050","#7a6820"],wall:"#f8f0d4",gem:"#fea",king:6},
  {id:63,name:"Larkwell",kind:"town",x:4088,y:4344,r:18,roof:["#6aaa48","#2a5a18"],wall:"#f2ead0",gem:"#cf8",king:6},
  {id:64,name:"Fernmere",kind:"town",x:3720,y:5624,r:18,roof:["#d8c060","#8a7420"],wall:"#f8f0d4",gem:"#fea",king:6}
];
for(const s of CITIES79){s.deferLayout=1;s.v79=1;SETS.push(s);KOF[s.id]=s.king;}
{const _ls=layoutSettlement;layoutSettlement=function(s){if(s&&s.v79&&s._laid)return;const r=_ls.apply(this,arguments);if(s&&s.v79&&s._layNow)s._laid=1;return r;};}
function connectCities79(){
  const linked=SETS.filter(s=>/town/.test(s.kind||"")&&!s.v79);
  const left=CITIES79.map(s=>SETS[s.id]);
  while(left.length){
    let bi=0,bp=null,bd=1e9;
    for(let i=0;i<left.length;i++)for(const p of linked){
      if(kOf(p.id)!==kOf(left[i].id))continue;
      const d=Math.hypot(p.x-left[i].x,p.y-left[i].y);
      if(d<bd){bd=d;bi=i;bp=p;}
    }
    if(!bp||typeof stampRoad!=="function")break;
    stampRoad(bp,left[bi]);
    linked.push(left.splice(bi,1)[0]);
  }
}
function placeCities79(){
  if(placeCities79.done)return 0;
  placeCities79.done=1;
  if(buildings.some(b=>b&&b.s===CITIES79[0].id))return 0;
  const t0=performance.now();
  for(const s of CITIES79){s._layNow=1;layoutSettlement(s);}
  connectCities79();
  if(typeof buildKGrid==="function"){KGRID=null;buildKGrid();}
  window.__CITIES79MS=Math.round(performance.now()-t0);
  return CITIES79.length;
}
function report79(){
  const cities=SETS.filter(s=>/town/.test(s.kind||""));
  let min=1e9,pair="";
  for(let i=0;i<cities.length;i++)for(let j=i+1;j<cities.length;j++){const d=Math.hypot(cities[i].x-cities[j].x,cities[i].y-cities[j].y);if(d<min){min=d;pair=cities[i].name+"-"+cities[j].name;}}
  const rows=[];
  for(const k of KINGDOMS){
    const list=cities.filter(s=>kOf(s.id)===k.id);
    rows.push({id:k.id,name:k.name,n:list.length,cities:list.map(s=>({name:s.name,x:s.x,y:s.y,fresh:!!s.v79}))});
  }
  const fresh=CITIES79.map(s=>{
    const b=SETS[s.id];
    const blds=buildings.filter(x=>x&&x.s===s.id);
    const folks=(typeof npcs!=="undefined"?npcs:[]).filter(n=>n.alive&&n.s===s.id);
    let same=1e9,foreign=1e9;
    for(const o of SETS){if(o===b||o.island)continue;const d=Math.hypot(o.x-b.x,o.y-b.y);if(kOf(o.id)===s.king)same=Math.min(same,d);else foreign=Math.min(foreign,d);}
    return {name:s.name,king:KINGDOMS[s.king].name,x:s.x,y:s.y,same:Math.round(same),foreign:Math.round(foreign),
      inn:blds.some(x=>x.kind==="inn"),shop:blds.some(x=>x.kind==="shop"),guild:blds.some(x=>x.kind==="guild"),
      leader:folks.some(n=>n.role==="leader"),guard:folks.some(n=>n.role==="guard"),blds:blds.length,npcs:folks.length};
  });
  return {rows,fresh,min:Math.round(min),pair,sets:SETS.length,lookouts:LOOKOUTS.length,ms:window.__CITIES79MS||0};
}
window.__placeCities=placeCities79;
window.__V79={cities:CITIES79.map(s=>s.name),report:report79};
