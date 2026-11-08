// ===== v74 woodland hunters. Original creatures. Towns, homes and children stay off-limits.
const WOOD_MON={
  bramblewolf:["Bramble Wolf","beast","brown",44,{beh:"agg",hp:6,spd:1.05,aggro:250,biome:["forest"],wood:1,parts:["fang","claw","hide"],gold:[4,9],desc:"A thorn-maned wolf that commits to a chase the moment it scents you."}],
  hollowowl:["Hollow Owl","bat","night",36,{beh:"agg",hp:4,spd:1.15,aggro:230,biome:["forest"],wood:1,fly:1,night:0,parts:["wing","fang"],gold:[3,7],desc:"A silent owl that drops out of the canopy and stays on you."}],
  rootmaw:["Root Maw","plant","moss",42,{beh:"agg",hp:8,spd:0.55,aggro:190,biome:["forest"],wood:1,parts:["fang","core","wood"],gold:[5,10],desc:"A rooted maw that lashes as soon as you step into its reach."}],
  antlerbrute:["Antler Brute","lion","gold",48,{beh:"agg",hp:10,spd:0.9,aggro:220,biome:["forest"],wood:1,tier:2,parts:["horn","hide","claw"],gold:[8,14],desc:"A stag-headed brute. It lowers its antlers, then charges."}]
};
function regWood(k){const [name,shape,pk,S,o]=WOOD_MON[k];MONDEF[k]=WOOD_MON[k];const big=S>=64;
  SPECIES[k]={mon:1,name,shape,beh:o.beh,hp:o.hp,spd:o.spd,aggro:o.aggro,biome:o.biome,night:o.night,fly:o.fly,wood:1,tier:o.tier||1,
    gold:o.gold,w:Math.round(S*(big?.42:.4)),h:Math.round(S*(big?.22:.26)),S,dmg:o.tier>=2?2:1};
  PART_DROPS[k]=(o.parts||[]).filter(p=>typeof ITEMS==="undefined"||ITEMS[p]||(typeof PARTDEF!=="undefined"&&PARTDEF[p]));
  BEST_DESC[k]=o.desc;}
for(const k in WOOD_MON)regWood(k);
function woodTile(x,y){const t=tAt(x/TILE|0,y/TILE|0);return t===FOREST||t===TREE||t===BUSH;}
{const _um=updateMob;updateMob=function(e){if(!e||e.dead||!hero)return _um(e);
  const safe=!!room||inTown(hero.x,hero.y)||(!e.raidOf&&inTown(e.x,e.y));
  e._safe=safe?1:0;
  const onWood=woodTile(e.x,e.y)||woodTile(hero.x,hero.y);
  e._wood=(e.def&&e.def.wood)||(onWood&&e.def&&e.def.beh==="agg")?1:0;
  if(e._wood&&!safe){const dist=Math.hypot(hero.x-e.x,hero.y-e.y);if(dist<(e.def.wood?280:220)&&dist<520)e.provoked=true;}
  if(safe)e.provoked=false;
  const saved=e.def;
  if(e._wood&&!safe&&saved){e.def=Object.assign({},saved,{beh:"agg",aggro:Math.max(saved.aggro||90,saved.wood?260:200),spd:Math.max(saved.spd||0.5,saved.wood?1.0:0.8)});}
  let r;try{r=_um(e);}finally{e.def=saved;}
  if(!e.raidOf&&inTown(e.x,e.y)){const s=settlementAt(e.x,e.y);if(s){const dx=e.x-s.x*TILE,dy=e.y-s.y*TILE,l=Math.hypot(dx,dy)||1;e.x+=dx/l*10;e.y+=dy/l*10;e.provoked=false;e.wind=0;}}
  return r;};}
window.__WOODS={names:Object.keys(WOOD_MON).map(k=>WOOD_MON[k][0])};
