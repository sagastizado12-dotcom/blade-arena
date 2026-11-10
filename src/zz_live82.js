// ===== v82 REASONS TO FLY + LIVING COUNTRIES =====
// Sky islands, rings, races, and aerial foes are original and only exist in the air.
// Wars nudge a front near the hero and change a village's flag. They do not ruin towns.
// Country ticks run on the game-minute clock, and only the front near the hero moves.
const SKY_SEEDS=[
  {id:"cloudrest",name:"Cloudrest",x:980,y:860,alt:14,kind:"shrine"},
  {id:"galehoard",name:"Galehoard",x:2680,y:1680,alt:16,kind:"material"},
  {id:"highperch",name:"Highperch",x:3600,y:2480,alt:13,kind:"race"},
  {id:"lanternreach",name:"Lanternreach",x:2100,y:4520,alt:15,kind:"shrine"},
  {id:"windbarrow",name:"Windbarrow",x:6200,y:1960,alt:12,kind:"chest"}
];
const LORE82={
  cloudrest:"A stone cut from no quarry reads: the first wind was a road, and the road remembered every foot that never touched the ground.",
  lanternreach:"The shrine keeps a winter tale. When the lanterns rise, the dead roads of the sky light for one night, and the greedy lose the way home."
};
function bag82(){
  if(!P.sky)P.sky={chests:{},orbs:{},mats:{},best:{},seen:{},calm:0,festDay:-1,races:0,bossDay:-99};
  if(!world.live82)world.live82={help:{},decrees:[],lastDecree:-99,quest:null,holdDay:{}};
  world.caravans=world.caravans||[];
  return P.sky;
}
function nearTown(tx,ty,pad){for(const s of SETS){if(s.island)continue;if(Math.hypot(s.x-tx,s.y-ty)<(s.r||16)+(pad||0))return s;}return null;}
function skyDry(t){return t===GRASS||t===FLOWER||t===FARM||t===FOREST;}
function skySpot(x,y){if(x<50||y<50||x>=WW-50||y>=WH-50)return null;for(let dy=-6;dy<=6;dy+=3)for(let dx=-6;dx<=6;dx+=3)if(!skyDry(tAt(x+dx,y+dy)))return null;
  if(nearTown(x,y,42))return null;if(typeof ISLES!=="undefined"&&ISLES.some(I=>Math.hypot(I.x-x,I.y-y)<(I.r||8)+16))return null;return{x,y};}
function skyFind(x0,y0){
  for(let rad=0;rad<=520;rad+=12){for(let a=0;a<12;a++){const hit=skySpot(x0+Math.round(Math.cos(a*0.524)*rad),y0+Math.round(Math.sin(a*0.524)*rad));if(hit)return hit;}}
  let near=SETS[0],bd=1e9;for(const s of SETS){if(s.island)continue;const d=Math.hypot(s.x-x0,s.y-y0);if(d<bd){bd=d;near=s;}}
  for(let rad=(near.r||18)+48;rad<=280;rad+=14){for(let a=0;a<12;a++){const hit=skySpot(near.x+Math.round(Math.cos(a*0.524)*rad),near.y+Math.round(Math.sin(a*0.524)*rad));if(hit)return hit;}}
  return{x:near.x+(near.r||18)+48,y:near.y};
}
function quiet82(){try{toasts.length=0;const el=document.getElementById("toasts");if(el)el.innerHTML="";}catch(_){}}
let ISLES82=null,ORBS82=null,COURSES82=null,TOWERS82=null;
function ensure82(){
  if(!world||!P||typeof tAt!=="function")return null;bag82();
  if(!ISLES82){ISLES82=SKY_SEEDS.map(s=>{const p=skyFind(s.x,s.y);return Object.assign({},s,p,{r:7});});
    ORBS82=[];COURSES82=[];
    ISLES82.forEach((I,i)=>{
      ORBS82.push({id:I.id+"a",x:I.x*TILE+86,y:I.y*TILE-40,alt:I.alt,wx:i%2?"clear":""});
      ORBS82.push({id:I.id+"b",x:I.x*TILE-70,y:I.y*TILE+54,alt:I.alt,wx:i===1?"storm":""});
      const rings=[];for(let k=0;k<6;k++){const a=-1.2+k*0.55;rings.push({x:I.x*TILE+Math.cos(a)*150,y:I.y*TILE+Math.sin(a)*96,alt:I.alt});}
      if(I.kind==="race"||i===0)COURSES82.push({id:I.id,name:I.name+" Run",from:"isle",isle:I.id,alt:I.alt,rings});
    });
    TOWERS82=[];
    for(const k of KINGDOMS){if(!k||k.demon||!SETS[k.cap])continue;const S=SETS[k.cap];const p=skyFind(S.x,S.y+(S.r||18)+8);
      const isle=ISLES82[k.id%ISLES82.length];
      TOWERS82.push({id:"tower"+k.id,k:k.id,name:S.name+" Spire",x:p.x,y:p.y,course:isle.id});
      if(COURSES82.length<3&&!COURSES82.some(c=>c.id==="spire"+k.id)){const rings=[];
        for(let n=0;n<6;n++){const a=n/6*Math.PI*2;rings.push({x:p.x*TILE+Math.cos(a)*170,y:p.y*TILE+Math.sin(a)*110,alt:13});}
        COURSES82.push({id:"spire"+k.id,name:S.name+" Spire Cup",from:"tower",tower:"tower"+k.id,alt:13,rings});}
      if(TOWERS82.length>=2)break;}
  }
  syncCars();syncFest();return ISLES82;
}
function syncCars(){const towns=SETS.filter(s=>!s.island&&/town/.test(s.kind||""));
  world.caravans=(world.caravans||[]).filter(c=>SETS[c.from]&&SETS[c.to]&&!c.done);
  let n=0;while(world.caravans.filter(c=>c.live82).length<2&&towns.length>3&&n<6){n++;
    const a=towns[(world.day+n*3)%towns.length],b=towns[(world.day+n*3+7)%towns.length];if(!a||!b||a.id===b.id)continue;
    world.caravans.push({from:a.id,to:b.id,t:0.2*n,hours:36,live82:1,seed:n*90});}}
function carPos(c){const A=SETS[c.from],B=SETS[c.to];if(!A||!B)return null;
  const span=Math.max(60,(c.hours||10)*60);const clock=((world.day*1440+(world.min|0))+(c.seed||0))%span;const t=clock/span;
  return{x:(A.x+(B.x-A.x)*t)*TILE,y:(A.y+(B.y-A.y)*t)*TILE,t,A,B};}
function syncFest(){const S=festTown();if(!S||!world.sets[S.id])return S;const ws=world.sets[S.id];
  if(ws._festDay!==world.day){ws._festDay=world.day;ws.festival=absMin()+900;ws.festKind=["blossom","summer","harvest","lantern"][season()];}return S;}
function festTown(){const list=SETS.filter(s=>!s.island&&/town/.test(s.kind||""));if(!list.length)return SETS[0];return list[(world.day+season()*5)%list.length];}
function festName(k){return{blossom:"Blossom Fair",summer:"Summer Market",harvest:"Harvest Fair",lantern:"Lantern Night"}[k]||"Town Fair";}
function contested82(w){if(!w||w.over)return null;let f;try{f=frontOf(w);}catch(_){return null;}const def=w.p>=0?w.b:w.a;
  const towns=townsOf(def).filter(s=>!isCap49(s.id));towns.sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y));return towns[0]||null;}
function visW(x,y,m){return x>camX-m&&x<camX+W+m&&y>camY-m&&y<camY+H+m;}
function altOk(alt){return P&&P.fly>0&&Math.abs(P.fly-alt)<6;}
function wxNow(){return world&&world.weather||"clear";}
// ----- drawing -----
function drawIsle(I){
  const x=I.x*TILE,y=I.y*TILE,bob=Math.sin(frameN*0.04+I.x)*2;
  const fog=wxNow()==="fog"&&Math.hypot(hero.x-x,hero.y-y)>140;
  const climb=Math.max(0,Math.min(1,(P.fly-3)/8));
  ctx.save();ctx.globalAlpha=(fog?0.35:1)*Math.max(0.25,climb);
  ctx.fillStyle="rgba(20,16,28,.35)";ctx.beginPath();ctx.ellipse(x,y+28,62,16,0,0,7);ctx.fill();
  ctx.fillStyle="#f4f7ff";ctx.beginPath();ctx.ellipse(x,y-18+bob,58,22,0,0,7);ctx.fill();
  ctx.fillStyle="#d5e2f4";ctx.beginPath();ctx.ellipse(x-8,y-14+bob,36,12,0,0,7);ctx.fill();
  ctx.fillStyle="#efe6d2";ctx.fillRect(x-14,y-30+bob,28,12);
  if(I.kind==="shrine"){ctx.fillStyle="#c8b48a";ctx.fillRect(x-10,y-48+bob,20,16);ctx.fillStyle="#7a5a28";ctx.fillRect(x-12,y-54+bob,24,6);ctx.fillStyle="#f0d060";ctx.fillRect(x-3,y-44+bob,6,6);}
  else{const open=bag82().chests[I.id];ctx.fillStyle=open?"#6a5030":"#8a5a28";ctx.fillRect(x-8,y-42+bob,16,10);ctx.fillStyle="#e8c060";ctx.fillRect(x-3,y-39+bob,6,4);}
  ctx.fillStyle="#1a120c";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.fillText(I.name,x,y-60+bob);
  ctx.restore();
}
function drawOrb(o){
  const on=!o.wx||o.wx===wxNow();ctx.save();ctx.globalAlpha=on?1:0.35;
  ctx.fillStyle=o.wx==="storm"?"#9ecbff":"#ffe08a";ctx.beginPath();ctx.arc(o.x,o.y+Math.sin(frameN*0.08+o.x)*2,5,0,7);ctx.fill();
  ctx.strokeStyle="#1a120c";ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
function drawRing(r,state){
  ctx.save();ctx.strokeStyle=state==="next"?"#ffe08a":state==="done"?"#8fd08a":"rgba(255,255,255,.7)";ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(r.x,r.y,18,10,0,0,7);ctx.stroke();
  ctx.fillStyle=state==="next"?"#ffe08a":"#fff";ctx.fillRect(r.x-1,r.y-10,2,4);ctx.restore();
}
function drawAirFoe(e){
  if(!e||e.dead)return;const flap=Math.sin(frameN*0.3+e.x)*3;ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h/2);ctx.scale(1.8,1.8);if(e.dir===1)ctx.scale(-1,1);
  const boss=e.sp==="skylord",hawk=e.sp==="stormhawk";
  ctx.fillStyle=boss?"#6a2048":hawk?"#8a5a32":"#3a6a88";
  ctx.fillRect(-10,-3,16,6);ctx.fillStyle=boss?"#e8d060":"#f2e2c8";ctx.fillRect(4,-2,6,4);
  ctx.fillStyle=boss?"#4a1830":hawk?"#c45a28":"#245068";ctx.fillRect(-8,-8+flap,10,4);ctx.fillRect(-8,4-flap,10,4);
  ctx.fillStyle="#1a120c";ctx.fillRect(8,-1,2,2);ctx.restore();
  ctx.fillStyle="rgba(10,8,16,.35)";ctx.beginPath();ctx.ellipse(e.x+e.w/2,e.y+e.h+14,8,3,0,0,7);ctx.fill();
}
function drawCartFlag(c,p){const k=kOf(c.from);const col=KINGDOMS[k]&&KINGDOMS[k].col||"#e8c060";
  ctx.fillStyle="#5a3a22";ctx.fillRect(p.x+10,p.y-16,2,16);ctx.fillStyle=col;ctx.fillRect(p.x+12,p.y-16,8,5);
  ctx.fillStyle="#1a120c";ctx.font="bold 7px system-ui";ctx.textAlign="left";ctx.fillText(p.A.name+" → "+p.B.name,p.x-10,p.y-18);}
function drawFest(S){const ws=world.sets[S.id];const kind=ws.festKind||"summer";const x=S.x*TILE,y=S.y*TILE;
  const stalls=[[8,3],[-7,4],[2,-6]];ctx.save();
  stalls.forEach((o,i)=>{const px=x+o[0]*TILE,py=y+o[1]*TILE;ctx.fillStyle=["#c84a3a","#e0a040","#3a7a4a"][i];ctx.fillRect(px,py,18,10);ctx.fillStyle="#f4e2c0";ctx.fillRect(px,py-4,18,4);ctx.fillStyle="#1a120c";ctx.fillRect(px+4,py+3,3,3);});
  ctx.fillStyle="#f4d2a8";ctx.fillRect(x-20,y+8,6,10);ctx.fillStyle="#6a3a20";ctx.fillRect(x-22,y+4,10,4);
  ctx.fillStyle="#1a120c";ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.fillText(festName(kind),x,y-28);
  if(wxNow()==="storm"||wxNow()==="rain"){ctx.fillStyle="rgba(40,50,70,.35)";ctx.fillRect(x-40,y-8,90,6);}ctx.restore();}
function drawTower(T){ctx.fillStyle="#6a5a48";ctx.fillRect(T.x*TILE-4,T.y*TILE-18,8,20);ctx.fillStyle="#e8c060";ctx.fillRect(T.x*TILE-6,T.y*TILE-22,12,4);
  ctx.fillStyle="#1a120c";ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillText("Spire",T.x*TILE,T.y*TILE-26);}
function drawBanner(S,w){const x=S.x*TILE+(S.r||16)*8,y=S.y*TILE;const K=KINGDOMS[kOf(S.id)]||KINGDOMS[0];
  ctx.fillStyle="#3a2a18";ctx.fillRect(x,y-20,2,22);ctx.fillStyle=K.col||"#c83a3a";ctx.fillRect(x+2,y-20,10,7);
  ctx.fillStyle="#1a120c";ctx.font="bold 7px system-ui";ctx.textAlign="left";ctx.fillText("Hold",x-2,y-24);}
function skyCam(){const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:Math.max(0.42,1-P.fly/46)):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);ctx.imageSmoothingEnabled=false;}
function paintWorld82(){if(!ensure82()||room)return;const fly=P.fly||0;
  if(fly>=4&&fly<28){for(const I of ISLES82)if(visW(I.x*TILE,I.y*TILE,220))drawIsle(I);
    for(const o of ORBS82)if(!bag82().orbs[o.id]&&visW(o.x,o.y,80))drawOrb(o);
    const race=bag82().race;if(race){const C=COURSES82.find(c=>c.id===race.id);if(C)C.rings.forEach((r,i)=>drawRing(r,i<race.i?"done":i===race.i?"next":"wait"));}
    for(const e of mobs)if(e.air&&!e.dead&&visW(e.x,e.y,80))drawAirFoe(e);}
  if(fly<28){const S=festTown();if(S&&Math.hypot(hero.x/TILE-S.x,hero.y/TILE-S.y)<S.r+18)drawFest(S);
    for(const T of TOWERS82)if(visW(T.x*TILE,T.y*TILE,80))drawTower(T);
    for(const c of world.caravans){const p=carPos(c);if(p&&visW(p.x,p.y,90))drawCartFlag(c,p);}
    for(const w of (world.wars||[])){if(w.over)continue;const S=contested82(w);if(S&&visW(S.x*TILE,S.y*TILE,120))drawBanner(S,w);}}
}
function paintHud82(){const race=P&&P.sky&&P.sky.race;if(!race)return;const sec=((performance.now()-race.t0)/1000);
  ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.fillStyle="#1a120c";ctx.fillRect(8,H-22,150,14);
  ctx.fillStyle="#ffe6b0";ctx.font="bold 8px system-ui";ctx.textAlign="left";ctx.fillText(race.name+"  "+sec.toFixed(1)+"s  ring "+(race.i+1)+"/"+(race.n||6),12,H-12);ctx.restore();}
// ----- play -----
function openChest(I){const B=bag82();if(B.chests[I.id]){toast(I.name+"'s chest is empty.");return true;}B.chests[I.id]=1;
  const g=90+((I.x*3+I.y)%80);P.gold+=g;P.inv.gem=(P.inv.gem||0)+1;toast(I.name+": "+g+"g and a gem.");try{SFX.coin();}catch(_){}return true;}
function openShrine(I){const B=bag82();B.calm=frameN+900;showMenu(I.name,LORE82[I.id]||"The wind keeps its own counsel.",[{l:"Kneel (the storm eases)",f:()=>toast("The shrine steadies your flight.")},{l:"Open the chest",f:()=>openChest(I)},{l:"Leave"}]);return true;}
function openMat(I){const B=bag82();if(B.mats[I.id]){openChest(I);return true;}B.mats[I.id]=1;ITEMS.stormglass=ITEMS.stormglass||{n:"Stormglass",p:80};
  const n=wxNow()==="storm"||wxNow()==="rain"?2:1;P.inv.stormglass=(P.inv.stormglass||0)+n;toast("You cut "+n+" stormglass from the cloud rock.");openChest(I);return true;}
function startRace(id){const C=COURSES82.find(c=>c.id===id);if(!C)return false;const B=bag82();
  if(!(P.fly>6)){P.fly=Math.max(P.fly||0,C.alt-1);toast("You kick off the spire.");}
  B.race={id:C.id,name:C.name,i:0,n:C.rings.length,t0:performance.now()};toast(C.name+" — fly the gold rings.");return true;}
function finishRace(){const B=bag82();const race=B.race;if(!race)return;const ms=performance.now()-race.t0;const prev=B.best[race.id];
  const first=!prev;const better=!prev||ms<prev;if(better)B.best[race.id]=ms;B.race=null;B.races=(B.races||0)+1;
  const g=first?140:better?50:20;P.gold+=g;if(first)P.inv.gem=(P.inv.gem||0)+1;
  toast(race.name+" "+(ms/1000).toFixed(1)+"s. "+(better?"A new best! ":"")+"+"+g+"g.");try{SFX.chime();}catch(_){}}
function skyInteract(){ensure82();const hx=hero.x+6,hy=hero.y+6;
  for(const I of ISLES82){if(Math.hypot(hx-I.x*TILE,hy-I.y*TILE)>I.r*TILE*0.7||!altOk(I.alt))continue;bag82().seen[I.id]=1;
    if(I.kind==="shrine")return openShrine(I);if(I.kind==="material")return openMat(I);if(I.kind==="race"){showMenu(I.name,"A ring course hangs off this island.",[{l:"Start "+I.name+" Run",f:()=>startRace(I.id)},{l:"Open the chest",f:()=>openChest(I)},{l:"Leave"}]);return true;}
    return openChest(I);}
  return false;}
function towerHere(){if(!TOWERS82||P.fly>0)return null;for(const T of TOWERS82)if(Math.hypot(hero.x+6-T.x*TILE,hero.y+6-T.y*TILE)<26)return T;return null;}
function carHere(){if(!world||P.fly>0)return null;for(const c of world.caravans){const p=carPos(c);if(p&&Math.hypot(hero.x-p.x,hero.y-p.y)<28)return{c,p};}return null;}
function bannerHere(){if(!world||!world.wars||P.fly>0)return null;for(const w of world.wars){if(w.over)continue;const S=contested82(w);if(!S)continue;
  const x=S.x*TILE+(S.r||16)*8,y=S.y*TILE;if(Math.hypot(hero.x-x,hero.y-y)<26)return{w,S};}return null;}
function holdWalls(w,S){const L=world.live82;const key=w.id+":"+world.day;if(L.holdDay[key]){toast("The walls are already manned today.");return;}
  L.holdDay[key]=1;const side=kOf(S.id)===w.a?"a":"b";w.hero=side;L.help[w.id]=(L.help[w.id]||0)+1;
  const ws=world.sets[S.id];if(ws)ws.price=Math.max(0.6,(ws.price||1)-0.06);P.gold+=25;
  toast("You hold "+S.name+". The "+KINGDOMS[kOf(S.id)].name+" line stiffens. +25g.");nudgeWar(w);}
function caravanMenu(hit){const c=hit.c,p=hit.p;const pf=world.sets[c.from]&&world.sets[c.from].price||1,pt=world.sets[c.to]&&world.sets[c.to].price||1;
  const buy=Math.max(4,Math.round(10*pf)),sell=Math.max(buy+2,Math.round(16*pt));
  showMenu("Caravan",p.A.name+" to "+p.B.name+". Prices follow the road: "+pf.toFixed(2)+"× leaving, "+pt.toFixed(2)+"× arriving.",[
    {l:"Buy trail spice ("+buy+"g)",dis:P.gold<buy,f:()=>{P.gold-=buy;P.inv.herb=(P.inv.herb||0)+1;toast("Trail spice for the pack.");}},
    {l:"Sell a crate ("+sell+"g)",dis:!(P.inv.herb>0),f:()=>{P.inv.herb--;P.gold+=sell;const ws=world.sets[c.to];if(ws)ws.price=Math.max(0.55,(ws.price||1)-0.04);toast("The caravan pays "+sell+"g.");}},
    {l:"Leave"}]);}
function festMenu(S){const ws=world.sets[S.id];const kind=ws.festKind||"summer";const price=ws.price||1;const pie=Math.max(3,Math.round(8*price));
  const wet=wxNow()==="storm"||wxNow()==="rain";
  showMenu(festName(kind),S.name+" keeps the fair"+(wet?" under the awnings while the weather blows through.":" in the square. Bards, stalls, and a bell to ring.")+ " Season: "+SEASONS[season()]+".",[
    {l:"Listen to the bard",f:()=>{try{SFX.chime();}catch(_){}toast(kind==="lantern"?"The bard sings the roads back into the sky.":kind==="harvest"?"The bard counts the loaves and the lucky.":"The bard keeps the square in time.");}},
    {l:"Stall: berry pie ("+pie+"g)",dis:P.gold<pie,f:()=>{P.gold-=pie;P.inv.pie=(P.inv.pie||0)+1;toast("Hot from the stall.");}},
    {l:"Ring the bell",f:()=>{if(bag82().festDay===world.day){toast("The bell is tired of you today.");return;}if((frameN%50)<20){bag82().festDay=world.day;P.gold+=20;ws.price=Math.max(0.55,(ws.price||1)-0.05);toast("Right on the beat! +20g. The town cheers.");}else toast("Early. Wait for the bright beat and try again.");}},
    {l:"Leave"}]);}
function groundExtra(){ensure82();const T=towerHere();if(T){const C=COURSES82.find(c=>c.id===T.course||c.tower===T.id);showMenu(T.name,"A stone spire. The rings start when you leave the ground.",[{l:C?"Fly the "+C.name:"Climb",f:()=>{if(C)startRace(C.id);}},{l:"Leave"}]);return true;}
  const car=carHere();if(car){caravanMenu(car);return true;}
  const ban=bannerHere();if(ban){const A=KINGDOMS[ban.w.a],B=KINGDOMS[ban.w.b];showMenu("War banner",ban.S.name+" is contested. "+(ban.w.p>=0?A.name:B.name)+" is pushing. A flag change is not a ruin.",[
    {l:"Hold the walls for "+(KINGDOMS[kOf(ban.S.id)]||A).name,f:()=>holdWalls(ban.w,ban.S)},
    {l:"Send supplies (20g)",dis:P.gold<20,f:()=>{P.gold-=20;world.live82.help[ban.w.id]=(world.live82.help[ban.w.id]||0)+1;toast("Wagons roll to the front.");nudgeWar(ban.w);}},
    {l:"Leave"}]);return true;}
  const S=festTown();if(S&&[[8,3],[-7,4],[2,-6],[-1.2,0.5]].some(o=>Math.hypot(hero.x-(S.x+o[0])*TILE,hero.y-(S.y+o[1])*TILE)<22)){festMenu(S);return true;}
  return false;}
function board82(){ensure82();const B=bag82();const lines=(B.best&&Object.keys(B.best).map(id=>{const C=COURSES82.find(c=>c.id===id);return (C?C.name:id)+" best "+(B.best[id]/1000).toFixed(1)+"s";}).join("\n"))||"No race times yet.";
  const dec=(world.live82.decrees||[]).map(d=>d.text).join("\n")||"No decrees.";
  const wars=(world.wars||[]).filter(w=>!w.over).map(w=>{const S=contested82(w);return KINGDOMS[w.a].name+" vs "+KINGDOMS[w.b].name+(S?" · "+S.name:"")+" ("+Math.round(w.p*100)+"%)";}).join("\n")||"No wars.";
  showMenu("Sky & Realm",lines+"\n\n"+wars+"\n\n"+dec,[
    {l:"Wars",f:()=>{try{conflictsMenu();}catch(_){}}},{l:"Close"}]);}
function collectOrbs(){const B=bag82();for(const o of ORBS82){if(B.orbs[o.id])continue;if(!altOk(o.alt)||Math.hypot(hero.x-o.x,hero.y-o.y)>20)continue;
  if(o.wx&&o.wx!==wxNow()){if(frameN%80===0)toast("The orb stays shut in this weather.");continue;}
  B.orbs[o.id]=1;const g=o.wx==="clear"?40:25;P.gold+=g;toast("Sky orb +"+g+"g.");try{SFX.coin();}catch(_){}}}
function raceTick(){const B=bag82();const race=B.race;if(!race)return;if(!(P.fly>0)){B.race=null;toast("You dropped out of the course.");return;}
  const C=COURSES82.find(c=>c.id===race.id);if(!C){B.race=null;return;}
  const r=C.rings[race.i];if(r&&altOk(r.alt)&&Math.hypot(hero.x-r.x,hero.y-r.y)<22){race.i++;if(race.i>=C.rings.length)finishRace();else toast("Ring "+race.i+".");}
  if(performance.now()-race.t0>90000){B.race=null;toast("The course closed. Ninety seconds.");}}
function spawnAir(){if(!(P.fly>=8&&P.fly<28)||room||nearTown(hero.x/TILE,hero.y/TILE,18))return;
  const alive=mobs.filter(m=>m.air&&!m.dead);if(alive.length>=2)return;
  const w=wxNow();if(w==="fog"&&frameN%240!==0)return;
  const bd=bag82().bossDay;const bossDue=w==="storm"&&P.fly>12&&!nearTown(hero.x/TILE,hero.y/TILE,55)&&(bd==null||world.day-bd>12)&&!alive.some(m=>m.sp==="skylord");
  const sp=bossDue&&Math.random()<0.35?"skylord":(w==="storm"||w==="rain")?"stormhawk":"skywyvern";
  if(!SPECIES[sp])return;const ang=Math.random()*6.28;const dist=sp==="skylord"?160:120;
  let x=hero.x+Math.cos(ang)*dist,y=hero.y+Math.sin(ang)*dist;
  if(nearTown(x/TILE,y/TILE,20))return;
  const e=spawnMob(sp,x,y,{air:1,name:sp==="skylord"?"Skyfather Veyr":sp==="stormhawk"?"Storm Hawk":"Sky Wyvern"});
  if(e){e.air=1;e.dmg=sp==="skylord"?2:1;if(sp==="skylord"){e.hp=e.maxHp=36;bag82().bossDay=world.day;toast("Skyfather Veyr drops out of the storm.");}}}
function airThink(e){if(e.dead)return;if(e.iframes>0)e.iframes--;if(e.flash>0)e.flash--;
  if(e.knockT>0){e.x+=e.knockVx;e.y+=e.knockVy;e.knockVx*=0.7;e.knockVy*=0.7;e.knockT--;}
  const away=nearTown(e.x/TILE,e.y/TILE,16);const hx=hero.x+6,hy=hero.y+6;let dx=hx-e.x,dy=hy-e.y;let dist=Math.hypot(dx,dy)||1;
  if(!(P.fly>4)||away||dist>780){dx=-dx;dy=-dy;dist=Math.hypot(dx,dy)||1;e.x+=dx/dist*1.6;e.y+=dy/dist*1.6;e.life=(e.life||0)+1;if(e.life>180||dist>900){e.dead=true;}return;}
  e.life=0;const sp=(e.def&&e.def.spd)||1;e.x+=dx/dist*sp;e.y+=dy/dist*sp;e.dir=dx<0?1:2;
  if(e.atkCd>0)e.atkCd--;else if(dist<20+e.w/3&&P.fly>4){e.atkCd=e.sp==="skylord"?50:36;hurtHero(e.dmg||1,Math.atan2(dy,dx));}
  e.x=clamp(e.x,8,PXW-24);e.y=clamp(e.y,8,PXH-24);}
function stormTick(){if(!(P.fly>8)||wxNow()!=="storm"||nearTown(hero.x/TILE,hero.y/TILE,4))return;
  if(bag82().calm>frameN)return;if(frameN%300===40){hurtHero(1,Math.random()*6);toast("The storm claws the wings of your flight.");}}
function nudgeWar(w){if(!w||w.over)return;const help=world.live82.help[w.id]||0;world.live82.help[w.id]=0;
  w.p+=(help*0.22)+((strOf(w.a)-strOf(w.b))*0.012);w.p=Math.max(-1.15,Math.min(1.15,w.p));
  if(w.p>=1)capture(w,w.a,w.b);else if(w.p<=-1)capture(w,w.b,w.a);}
function minute82(){if(!world||!hero)return;ensure82();
  for(const c of world.caravans){const p=carPos(c);if(p)c.t=Math.min(0.98,p.t);}
  if((world.min|0)%10!==0)return;
  const hx=hero.x/TILE,hy=hero.y/TILE;
  for(const w of world.wars||[]){if(w.over)continue;let f;try{f=frontOf(w);}catch(_){continue;}if(Math.hypot(f.x-hx,f.y-hy)<110)nudgeWar(w);}
  const S=nearTown(hx,hy,8)||festTown();if(S&&world.sets[S.id]){const ws=world.sets[S.id];let d=0;
    const w=wxNow();if(w==="storm"||w==="snow")d+=0.02;if(w==="clear")d-=0.01;
    for(const war of world.wars||[]){if(war.over)continue;const C=contested82(war);if(C&&C.id===S.id)d+=0.03;}
    ws.price=clamp((ws.price||1)+d,0.55,1.8);}
  if(world.day-world.live82.lastDecree>=3)issueDecree();}
function issueDecree(){const H=KINGDOMS.filter(k=>k&&!k.demon&&SETS[k.cap]);if(!H.length)return;const K=H[world.day%H.length];
  world.live82.lastDecree=world.day;let text;
  const war=(world.wars||[]).find(w=>!w.over);
  const roll=world.day%3;
  if(roll===0)text=K.ruler+" of "+K.name+" posts a bounty: 50g for a storm hawk.";
  else if(roll===1&&war){const S=contested82(war);text=K.ruler+" asks you to hold "+(S?S.name:"the front")+".";world.live82.quest={kind:"hold",sid:S&&S.id,war:war.id,day:world.day};}
  else{const S=festTown();text=K.ruler+" decrees a fair blessing on "+(S?S.name:"the towns")+".";}
  const d={k:K.id,day:world.day,text};world.live82.decrees.unshift(d);world.live82.decrees=world.live82.decrees.slice(0,4);
  try{addNews(-1,text);}catch(_){}toast("👑 "+text);}
// ----- hooks -----
ITEMS.stormglass=ITEMS.stormglass||{n:"Stormglass",p:80};
SPECIES.skywyvern={beh:"agg",hp:8,spd:1.15,aggro:220,gold:[14,26],drop:"scale",w:22,h:12,air:1};
SPECIES.stormhawk={beh:"agg",hp:5,spd:1.55,aggro:200,gold:[8,16],drop:"gem",w:18,h:10,air:1};
SPECIES.skylord={beh:"agg",hp:36,spd:0.95,aggro:280,gold:[90,150],drop:"gem",w:36,h:18,air:1,rare:1};
{const _b=blockedE;blockedE=function(e){if(e&&e.air){const x0=Math.floor(e.x/TILE),y0=Math.floor(e.y/TILE),x1=Math.floor((e.x+e.w)/TILE),y1=Math.floor((e.y+e.h)/TILE);
  if(x0<0||y0<0||x1>=WW||y1>=WH)return true;return false;}return _b.apply(this,arguments);};}
{const _um=updateMob;updateMob=function(e){if(e&&e.air)return airThink(e);return _um.apply(this,arguments);};}
{const _dm=drawMob;drawMob=function(e){if(e&&e.air)return;return _dm.apply(this,arguments);};}
{const _ws=weatherSpd;weatherSpd=function(){let s=_ws();if(P&&P.fly>0&&world&&world.weather==="storm"&&!(bag82().calm>frameN))s*=0.72;return s;};}
{const _i=interact;interact=function(){try{if(P&&P.fly>0)return skyInteract();}catch(e){console.warn(e);}try{if(groundExtra())return true;}catch(e){console.warn(e);}return _i.apply(this,arguments);};}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e&&e.air){if(e.sp==="skylord"){P.gold+=80;P.inv.stormglass=(P.inv.stormglass||0)+1;toast("Skyfather Veyr falls. +80g and stormglass.");}
  const dec=(world.live82&&world.live82.decrees||[]).find(d=>/storm hawk/i.test(d.text)&&!d.paid);if(dec&&e.sp==="stormhawk"){dec.paid=1;P.gold+=50;toast("Bounty paid. +50g.");}}
  if(e&&e.war49){const w=(world.wars||[]).find(q=>q.id===e.war49);if(w){world.live82.help[w.id]=(world.live82.help[w.id]||0)+0.35;}}
}catch(_){}return r;};}
{const _am=advanceMinutes;advanceMinutes=function(m){const before=world&&world.min;const r=_am.apply(this,arguments);try{if(world&&hero&&state==="play"&&world.min!==before)minute82();}catch(e){console.warn(e);}return r;};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b))b=[{l:"☁ Sky & Realm",f:board82}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
{const _df=drawFullMap;drawFullMap=function(){const r=_df.apply(this,arguments);try{paintMap82();}catch(_){}return r;};}
function paintMap82(){if(!world||!ISLES82)return;const c=document.getElementById("mapc");if(!c||c.clientWidth<20)return;const g=c.getContext("2d");const dpr=Math.min(2,window.devicePixelRatio||1);g.setTransform(dpr,0,0,dpr,0,0);
  const B=bag82();
  for(const I of ISLES82){if(!B.seen[I.id]&&!(P.fly>8))continue;const p=mapToScreen(I.x,I.y);g.fillStyle="rgba(244,248,255,.95)";g.beginPath();g.ellipse(p.x,p.y,7,4,0,0,7);g.fill();g.strokeStyle="#1a120c";g.stroke();
    g.font="bold 10px system-ui";g.textAlign="center";g.lineWidth=3;g.strokeStyle="#000";g.strokeText(I.name,p.x,p.y-8);g.fillStyle="#fff";g.fillText(I.name,p.x,p.y-8);}
  for(const w of world.wars||[]){if(w.over)continue;let f;try{f=frontOf(w);}catch(_){continue;}const p=mapToScreen(f.x,f.y);const nx=-Math.sin(f.ang),ny=Math.cos(f.ang),L=Math.max(28,70);
    g.lineWidth=4;g.strokeStyle="rgba(0,0,0,.75)";g.beginPath();g.moveTo(p.x-nx*L,p.y-ny*L);g.lineTo(p.x+nx*L,p.y+ny*L);g.stroke();
    g.setLineDash([7,4]);g.lineWidth=2;g.strokeStyle="#ff4040";g.beginPath();g.moveTo(p.x-nx*L,p.y-ny*L);g.lineTo(p.x+nx*L,p.y+ny*L);g.stroke();g.setLineDash([]);
    const S=contested82(w);g.font="bold 11px system-ui";g.textAlign="center";g.strokeStyle="#000";g.lineWidth=3;const lab=S?"FRONT · "+S.name:"FRONT";
    g.strokeText(lab,p.x,p.y-12);g.fillStyle="#ffd0d0";g.fillText(lab,p.x,p.y-12);}
  const FS=festTown();if(FS){const p=mapToScreen(FS.x,FS.y);g.font="bold 11px system-ui";g.textAlign="center";g.strokeStyle="#000";g.lineWidth=3;g.strokeText("✦ "+festName(world.sets[FS.id]&&world.sets[FS.id].festKind),p.x,p.y+18);g.fillStyle="#ffd0f0";g.fillText("✦ "+festName(world.sets[FS.id]&&world.sets[FS.id].festKind),p.x,p.y+18);}
  for(const c of world.caravans||[]){const p0=carPos(c);if(!p0)continue;const p=mapToScreen(p0.x/TILE,p0.y/TILE);g.fillStyle="#e8c060";g.fillRect(p.x-3,p.y-2,6,4);}}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{if(state==="play"&&!room&&hero&&P){ensure82();
  if(P.fly>0&&P.fly<28){collectOrbs();raceTick();stormTick();if(frameN%140===0)spawnAir();
    for(const I of ISLES82){if(bag82().seen[I.id])continue;if(P.fly>6&&Math.hypot(hero.x/TILE-I.x,hero.y/TILE-I.y)<28){bag82().seen[I.id]=1;toast(I.name+" hangs in the climb.");}}}
}}catch(e){console.warn(e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&hero&&P&&!(P.fly>=28)){ctx.save();skyCam();paintWorld82();ctx.restore();paintHud82();}}catch(e){console.warn(e);}return r;};}
window.__LIVE82={
  ensure:ensure82,isles:()=>ISLES82,orbs:()=>ORBS82,courses:()=>COURSES82,towers:()=>TOWERS82,
  fest:()=>{const S=festTown();return S?{id:S.id,name:S.name,x:S.x,y:S.y,kind:world.sets[S.id]&&world.sets[S.id].festKind,title:festName(world.sets[S.id]&&world.sets[S.id].festKind)}:null;},
  cars:()=>(world.caravans||[]).map(c=>{const p=carPos(c);return p?{from:p.A.name,to:p.B.name,x:Math.round(p.x),y:Math.round(p.y),pf:world.sets[c.from]&&world.sets[c.from].price}:null;}).filter(Boolean),
  startRace,holdWalls,issueDecree,nudgeWar,spawnAir,openChest,
  beginWar:(a,b)=>startWar(a,b,"a border dispute"),quiet:quiet82,
  probe:()=>({spd:weatherSpd(),interact:interact()}),
  fronts:()=>(world.wars||[]).filter(w=>!w.over).map(w=>{let f=null;try{f=frontOf(w);}catch(_){}const S=contested82(w);return{a:KINGDOMS[w.a]&&KINGDOMS[w.a].name,b:KINGDOMS[w.b]&&KINGDOMS[w.b].name,p:w.p,x:f&&f.x,y:f&&f.y,town:S&&S.name,tid:S&&S.id};})
};
