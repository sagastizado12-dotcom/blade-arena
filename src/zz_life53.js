// ===== v53 Phase 7: seasons & life — frozen rivers, seasonal festivals, harvest market, seasonal monsters, home farm plot, pet breeding, festival bards =====
Object.assign(ITEMS,{wheat:{n:"Wheat",p:3,food:8},pumpkin:{n:"Pumpkin",p:7,food:25},carrot:{n:"Carrots",p:3,food:12},
  blossom:{n:"Spirit Blossom",p:14,gift:2},sunstone:{n:"Sunstone",p:18},gourdseed:{n:"Ghost Gourd",p:16},frostshard:{n:"Frost Shard",p:20}});
const SEASON_N=["Spring","Summer","Autumn","Winter"];
// ---- frozen rivers: in winter, deep water in rivers/narrow channels freezes and can be walked on ----
const RIVM=new Int8Array(WW*WH).fill(-1);
function riverTile(x,y){const i=y*WW+x;if(RIVM[i]>=0)return RIVM[i]===1;let r=0;if(T[i]===DEEP||T[i]===SHAL){const land=(dx,dy)=>{for(let k=1;k<=7;k++){const t=tAt(x+dx*k,y+dy*k);if(t!==DEEP&&t!==SHAL)return true;}return false;};r=(land(1,0)&&land(-1,0))||(land(0,1)&&land(0,-1))?1:0;}RIVM[i]=r;return r===1;}
const iceAt=(x,y)=>!!world&&season()===3&&x>=0&&y>=0&&x<WW&&y<WH&&(T[y*WW+x]===DEEP||T[y*WW+x]===SHAL)&&riverTile(x,y);
{const _w=walk;walk=function(x,y){if(iceAt(x,y))return true;return _w(x,y);};}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{if(!world||season()!==3||room)return;list.push({y:-1e9,f:()=>{const x0=Math.floor(camX/16)-1,y0=Math.floor(camY/16)-1,x1=x0+Math.ceil(W/16)+3,y1=y0+Math.ceil(H/16)+3;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){if(!iceAt(x,y))continue;ctx.fillStyle="#cfe9f5";ctx.fillRect(x*16,y*16,16,16);ctx.fillStyle="#e9f7ff";if((x*7+y*3)%5===0)ctx.fillRect(x*16+3,y*16+5,7,1.5);if((x*3+y*11)%7===0){ctx.fillStyle="#a8cfe0";ctx.fillRect(x*16+9,y*16+10,5,1);}}}});}catch(_){}};}
// ---- seasonal festivals: one big named festival per season in every town ----
const FESTS=[{k:"blossom",n:"Blossom Fair",m:3,ic:"🌸",act:"You dance under the blossoms and leave with a crown of flowers.",gift:{flowers:2},buff:"charm"},
 {k:"midsummer",n:"Midsummer Night",m:6,ic:"🔥",act:"You leap the bonfire with the townsfolk; the whole town cheers.",gift:{pie:1},buff:"atk"},
 {k:"harvest",n:"Harvest Fair",m:9,ic:"🎃",act:"You win the pumpkin-carrying race and a sack of coin.",gift:{pumpkin:2},gold:120},
 {k:"lantern",n:"Lantern Festival",m:0,ic:"🏮",act:"You release a lantern for those you've lost; the night sky fills with light.",gift:{},mp:true}];
const FST=()=>{world.fest53=world.fest53||{cur:null,joined:{}};return world.fest53;};
const festNow=()=>{const F=FST();return F.cur&&absMin()<F.cur.until?FESTS.find(f=>f.k===F.cur.k):null;};
function startSeasonFest(f){const F=FST();F.cur={k:f.k,until:absMin()+1440,year:Math.floor(world.day/365)};for(const s of world.sets){if(!s.ruin)s.festival=absMin()+1440;}toast(`${f.ic} The ${f.n} has begun in every town!`);try{addNews(0,`The ${f.n} is celebrated across the realm.`);jAdd(`The ${f.n} filled every town with music.`,"life");}catch(_){}}
function festDaily(){const [m,d]=mdOf43(world.day);const f=FESTS.find(x=>x.m===m);if(f&&d===15)startSeasonFest(f);}
function joinFest(){const f=festNow();if(!f){toast("No festival today.");return false;}const F=FST();const key=f.k+F.cur.year;if(F.joined[key]){toast("You've already joined this festival.");return false;}F.joined[key]=world.day;
  for(const [k,v] of Object.entries(f.gift))P.inv[k]=(P.inv[k]||0)+v;if(f.gold)P.gold+=f.gold;if(f.mp)P.mag.mp=P.mag.max||P.mag.mp;P.festBuff={k:f.buff||"",until:absMin()+720};P.fame=(P.fame||0)+5;
  showMenu(`${f.ic} ${f.n}`,f.act+"\n\n"+bardSong(),[{l:"Close"}]);try{jAdd(`I joined the ${f.n}. ${f.act}`,"life");}catch(_){}return true;}
// ---- festival bards sing of the season and of your deeds ----
function bardSong(){const s=SEASON_N[season()];const deeds=[];try{const H=world.hunts;if(H)for(const k in H.slain){const L=HLEG.find(l=>l.k===k);if(L)deeds.push(`who felled ${L.n}`);}}catch(_){}
  try{const c=Object.keys(P.combos||{}).length;if(c)deeds.push(`who wove ${c} spell${c>1?"s":""} into one`);}catch(_){}try{if(world.dragonsSlain)deeds.push("who slew the dragon");}catch(_){}try{if(world.mod&&world.mod.walls)deeds.push("who raised Moderno's walls");}catch(_){}
  const nm=typeof heroName==="function"?heroName():"the hero";const L=[`🎶 The bard strums a ${s.toLowerCase()} tune:`,`“${["Blossoms fall on Aldmoor's road","The summer sun is long and gold","The fields are cut, the barns are full","The rivers sleep beneath the snow"][season()]},`,
   deeds.length?`and still they sing of ${nm}, ${deeds.slice(0,2).join(" and ")}!”`:`and someday they'll sing of ${nm}, whose tale is still untold.”`];return L.join("\n");}
// ---- harvest market: crops sell for double in autumn (and at festivals) ----
const CROPS=["wheat","pumpkin","carrot","berry"];
const cropPrice=k=>Math.round(ITEMS[k].p*(season()===2?2:1)*(festNow()?1.25:1));
function harvestMarket(){const have=CROPS.filter(k=>P.inv[k]>0);const B=have.map(k=>({l:`Sell ${P.inv[k]} ${ITEMS[k].n} @ ${cropPrice(k)}g`,f:()=>{const g=cropPrice(k)*P.inv[k];P.gold+=g;P.inv[k]=0;toast(`🧺 Sold for ${g}g.`);harvestMarket();}}));B.push({l:"Back",f:lifeMenu});
  showMenu("🧺 Harvest market",(season()===2?"🍂 Autumn harvest market — crops fetch double!":"Crops sell at the usual price (double in autumn).")+"\n"+(have.map(k=>`${ITEMS[k].n}: ${P.inv[k]}`).join(" · ")||"You have no crops."),B);}
// ---- home farm plot: 4 beds beside your first home ----
const SEEDS={wheat:{n:"Wheat",days:4,y:[3,5],cost:5},carrot:{n:"Carrots",days:3,y:[2,4],cost:4},pumpkin:{n:"Pumpkins",days:6,y:[2,3],cost:8,bonus:2}};
const HFARM=()=>{P.farm=P.farm||{beds:[null,null,null,null]};return P.farm;};
const homeB=()=>{const h=(P.homes||[])[0];return h!=null?buildings[h]:null;};
const bedReady=b=>b&&world.day>=b.ready;
function plant(i,k){const F=HFARM(),S=SEEDS[k];if(!homeB()){toast("You need a home for a farm plot.");return false;}if(season()===3){toast("❄ The ground is frozen — nothing grows in winter.");return false;}if(F.beds[i]){toast("That bed is planted.");return false;}if(P.gold<S.cost){toast("Not enough gold for seed.");return false;}
  P.gold-=S.cost;F.beds[i]={k,planted:world.day,ready:world.day+S.days};toast(`🌱 Planted ${S.n} (ready in ${S.days} days)`);return true;}
function harvestBed(i){const F=HFARM(),b=F.beds[i];if(!bedReady(b))return 0;const S=SEEDS[b.k];let n=S.y[0]+Math.floor(Math.random()*(S.y[1]-S.y[0]+1));if(season()===2&&S.bonus)n+=S.bonus;P.inv[b.k]=(P.inv[b.k]||0)+n;F.beds[i]=null;toast(`🧺 Harvested ${n} ${ITEMS[b.k].n}`);return n;}
function farmMenu(){const F=HFARM();const B=[];F.beds.forEach((b,i)=>{if(!b)for(const k in SEEDS)B.push({l:`Bed ${i+1}: plant ${SEEDS[k].n} (${SEEDS[k].cost}g, ${SEEDS[k].days}d)`,f:()=>{plant(i,k);farmMenu();}});else B.push(bedReady(b)?{l:`Bed ${i+1}: 🧺 harvest ${ITEMS[b.k].n}`,f:()=>{harvestBed(i);farmMenu();}}:{l:`Bed ${i+1}: ${ITEMS[b.k].n} growing… ${b.ready-world.day}d`,dis:true});});
  B.push({l:"Back",f:lifeMenu});showMenu("🌱 Home farm plot",homeB()?`Four beds beside your home. ${season()===3?"❄ Winter: the ground is frozen.":season()===2?"🍂 Autumn: pumpkins yield extra.":""}`:"Buy a home to get a farm plot.",B);}
// winter frost kills unharvested crops
function farmDaily(){if(season()===3&&P.farm)P.farm.beds=P.farm.beds.map(b=>b&&!bedReady(b)?null:b);}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{const h=homeB();if(!h||!P.farm)return;const d=doorOf(h);const x0=d.x+20,y0=d.y-4;if(!vis(x0,y0,60))return;
  list.push({y:y0,f:()=>{P.farm.beds.forEach((b,i)=>{const x=x0+i*14,y=y0;ctx.fillStyle="#6a4422";ctx.fillRect(x,y,12,10);ctx.fillStyle="#4a2e16";ctx.fillRect(x,y+3,12,1);ctx.fillRect(x,y+7,12,1);
   if(b){const p=Math.min(1,(world.day-b.planted)/Math.max(1,b.ready-b.planted));const col=b.k==="pumpkin"?"#ff8a2a":b.k==="carrot"?"#ff6a1a":"#e8c050";for(let j=0;j<3;j++){ctx.fillStyle="#4aa83a";ctx.fillRect(x+2+j*4,y+8-p*6,1.5,p*6+1);if(p>=1){ctx.fillStyle=col;ctx.fillRect(x+1+j*4,y+1,3,3);}}}});}});}catch(_){}};}
// ---- pet breeding: two pets of the same kind (lv 3+) raise a young one at home in 3 days ----
function breedPairs(){const L=pets();const by={};for(const p of L)if((p.lv||1)>=3)(by[p.sp]=by[p.sp]||[]).push(p);return Object.keys(by).filter(k=>by[k].length>=2);}
function breed(sp){if(P.breed){toast("A young one is already on the way.");return false;}if(!homeB()){toast("Pets need a home to raise young.");return false;}if(!breedPairs().includes(sp))return false;P.breed={sp,done:world.day+3};toast(`🥚 Your ${TAME[sp].nm}s are expecting — 3 days.`);return true;}
function breedDaily(){if(!P.breed||world.day<P.breed.done)return;const sp=P.breed.sp;P.breed=null;const p={id:Date.now()%1e9+Math.floor(Math.random()*1000),sp,name:PET_NAMES[(pets().length+3)%PET_NAMES.length]+" Jr.",lv:1,xp:0,active:false,born:world.day};pets().push(p);
  const m=`A young ${TAME[sp].nm} was born at home! I named it ${p.name}.`;toast(`${TAME[sp].ic} ${m}`);try{jAdd(m,"family");}catch(_){}}
function breedMenu(){const pr=breedPairs();const B=pr.map(sp=>({l:`${TAME[sp].ic} Breed ${TAME[sp].nm}s`,f:()=>{breed(sp);lifeMenu();}}));B.push({l:"Back",f:lifeMenu});showMenu("🥚 Pet breeding",P.breed?`A young ${TAME[P.breed.sp].nm} arrives in ${P.breed.done-world.day} days.`:pr.length?"Choose a pair:":"You need two pets of the same kind at level 3+.",B);}
// ---- seasonal monsters: variants roam only in their season and drop seasonal goods ----
const SEASON_MON=[{sp:"meadowslime",n:"Bloomling",drop:"blossom"},{sp:"emberslime",n:"Sunscorch",drop:"sunstone"},{sp:"snapbloom",n:"Gourdling",drop:"gourdseed"},{sp:"slime",n:"Frostcrawler",drop:"frostshard"}];
function seasonSpawn(force){if(!hero||room)return null;const tx=hero.x/TILE|0,ty=hero.y/TILE|0;if(inTown(hero.x,hero.y))return null;try{if(inModerno(tx,ty))return null;}catch(_){}if(!force&&mobs.filter(m=>m.seasonal&&!m.dead).length>=2)return null;
  const M=SEASON_MON[season()];if(!SPECIES[M.sp])return null;for(let k=0;k<12;k++){const a=Math.random()*6.28,r=140+Math.random()*80;const x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;const t=tAt(x/TILE|0,y/TILE|0);if(t===DEEP||t===SHAL||solidTile(x/TILE|0,y/TILE|0)||inTown(x,y))continue;
   const e=spawnMob(M.sp,x,y,{});if(!e)return null;e.seasonal=M.drop;e.name=M.n;e.hp=e.maxHp=Math.max(6,(e.maxHp||3)*2);e.provoked=true;return e;}return null;}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e.seasonal){P.inv[e.seasonal]=(P.inv[e.seasonal]||0)+1;floatText(e.x,e.y-10,"+"+ITEMS[e.seasonal].n,"#bff");}}catch(_){}return r;};}
// winter: seasonal mobs from other seasons melt away; out-of-season variants vanish at the turn
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||!world||room)return;if(frameN%1200===0&&Math.random()<0.5)seasonSpawn();if(frameN%300===0){const cur=SEASON_MON[season()].drop;for(const m of mobs)if(m.seasonal&&m.seasonal!==cur)m.dead=true;}
  for(const m of mobs){if(!m.seasonal||m.dead||!vis0(m))continue;}
  // walking on ice: never swim over a frozen river
  if(hero.swim){const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0;if(iceAt(tx,ty))hero.swim=false;}}catch(_){}};}
const vis0=m=>Math.abs(m.x-hero.x)<500&&Math.abs(m.y-hero.y)<400;
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{for(const m of mobs){if(!m.seasonal||m.dead||!vis(m.x,m.y,30))continue;list.push({y:m.y+30,f:()=>{ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillStyle="#000";ctx.fillText(m.name,m.x+(m.w||12)/2+0.5,m.y-5.5);ctx.fillStyle=["#ffc8e8","#ffe08a","#ffb060","#cfefff"][season()];ctx.fillText(m.name,m.x+(m.w||12)/2,m.y-6);}});}}catch(_){}};}
// ---- Life menu (Pause) ----
function lifeMenu(){const f=festNow();const B=[];if(f)B.push({l:`${f.ic} Join the ${f.n}`,f:joinFest});B.push({l:"🌱 Home farm plot",f:farmMenu},{l:"🧺 Harvest market",f:harvestMarket},{l:"🥚 Pet breeding",f:breedMenu});if(typeof cookMenu==="function")B.push({l:"🍲 Cook",f:cookMenu});B.push({l:"Close"});
  const nx=FESTS.map(x=>`${x.ic} ${x.n}: ${["January","February","March","April","May","June","July","August","September","October","November","December"][x.m]} 15`).join("\n");
  showMenu(`🍃 Seasons & life — ${SEASON_N[season()]}`,`${["🌸 Spring: plant your beds; Bloomlings drift through the meadows.","☀ Summer: long days; Sunscorch slimes ooze over the dry hills.","🍂 Autumn: harvest market pays double; Gourdlings roam.","❄ Winter: rivers freeze and can be walked; crops can't grow; Frostcrawlers hunt."][season()]}\n${f?`\n${f.ic} Today: the ${f.n}!`:""}\n\nFestivals:\n${nx}\n\nFish at any shore with a rod; cook at home.`,B);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&!b.some(o=>o&&o._life))b=[{_life:1,l:"🍃 Life",f:lifeMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{festDaily();farmDaily();breedDaily();}catch(e){console.warn(e);}return r;};}
