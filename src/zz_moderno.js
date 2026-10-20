// ===== v47b MODERNO: Lord menu, treasury, farms, upgrade tiers with visible construction, sieges by foreign countries =====
const MODS=()=>{const S=SETS[MOD_ID];if(!world)return null;if(!world.mod)world.mod={lord:true,treasury:150,tax:1,guards:4,unrest:12,walls:0,streets:0,bld:{houses:0,market:0,smithy:0,inn:0,guild:0,temple:0,barracks:0,granary:0,farms:0},q:[],siege:null,burnt:{},peaceUntil:20,log:[],since:world.day};return world.mod;};
const MOD_DIST=[["houses","🏘 Houses"],["market","🛒 Market"],["smithy","⚒ Smithy"],["inn","🍺 Inn"],["guild","📜 Guild"],["temple","⛪ Temple"],["barracks","🛡 Barracks"],["granary","🌾 Granary"],["farms","🚜 Farms"]];
const WALL_T=["Palisade","Stone wall","High walls, towers & gatehouse","Fortress"],STREET_T=["Dirt lanes","Cobblestone","Paved boulevards with lamps, trees & fountains"];
const MOD_FLAG={field:"#2a6ad0",band:"#f6eedc",star:"#ffd040"};
const modTerr=()=>(world&&world.mod&&world.mod.terr)||80;
const inModerno=(tx,ty)=>Math.hypot(tx-SETS[MOD_ID].x,ty-SETS[MOD_ID].y)<modTerr();
function modCost(k,t){const base=k==="walls"?400:k==="streets"?300:150;return{gold:Math.round(base*(t+1)*(t+1)),wood:20*(t+1),days:2+2*t};}
function modTier(k){const M=MODS();return k==="walls"?M.walls:k==="streets"?M.streets:M.bld[k.slice(4)]||0;}
const modMax=k=>k==="streets"?2:3;
const modQueued=k=>MODS().q.some(q=>q.k===k);
function modStart(k){const M=MODS(),t=modTier(k);if(t>=modMax(k)||modQueued(k))return false;const c=modCost(k,t);
  if((P.gold||0)+M.treasury<c.gold){toast("🏙 Not enough gold (treasury + purse).");return false;}if((P.inv.wood||0)<c.wood){toast(`🏙 Need ${c.wood} wood.`);return false;}
  const fromT=Math.min(M.treasury,c.gold);M.treasury-=fromT;P.gold-=c.gold-fromT;P.inv.wood-=c.wood;M.q.push({k,to:t+1,done:world.day+c.days,start:world.day});
  try{jAdd(`I ordered work in Moderno: ${modLabel(k)} → ${modTierName(k,t+1)} (${c.days} days).`,"home");}catch(_){}toast(`🏗 Construction started: ${modLabel(k)} (${c.days} days)`);try{saveGame();}catch(_){}return true;}
const modLabel=k=>k==="walls"?"Walls":k==="streets"?"Streets":(MOD_DIST.find(d=>"bld:"+d[0]===k)||[0,k])[1];
const modTierName=(k,t)=>k==="walls"?WALL_T[t]:k==="streets"?STREET_T[t]:["Basic","Improved","Grand","Splendid"][t];
const modPop=()=>{const M=MODS();return SETS[MOD_ID].bIdx.filter(i=>buildings[i].mk==="houses").length*(4+M.bld.houses*2)+20;};
const modGuardCap=()=>4+MODS().bld.barracks*4;
const modFields=()=>MODF.fields.filter(f=>!(MODS().burnt[f.i]>world.day));
function modDefense(){const M=MODS();return Math.round(([1,2,3.5,5][M.walls])*(1+M.guards*0.08)*(1+M.bld.barracks*0.1)*10)/10;}
function modIncome(){const M=MODS();const sf=[0.6,1,1.6,0.2][season()];const farm=modFields().length*(1+M.bld.farms*0.5)*sf*6;
  const tax=modPop()*[0.5,1,1.6][M.tax]*(1+0.12*(M.bld.market+M.bld.inn+M.bld.guild+M.bld.smithy))*(1-M.unrest/150)*0.5;return{farm:Math.round(farm),tax:Math.round(tax),upkeep:M.guards*3};}
function modApply(){const M=MODS();if(!M)return;const S=SETS[MOD_ID];
  // streets: dirt lanes until cobbled
  if(!MODST.length)for(let y=S.y-S.r;y<=S.y+S.r;y++)for(let x=S.x-S.r;x<=S.x+S.r;x++){const i=y*WW+x;if(Math.hypot(x-S.x,y-S.y)<=S.r&&OCC[i]<=0&&(T[i]===COBBLE||T[i]===ROAD))MODST.push(i);}
  for(const i of MODST)T[i]=M.streets>=1?COBBLE:ROAD;
  // walls tier 2+: archer towers on the ring (they shoot raiders)
  for(let i=TOWERS.length-1;i>=0;i--)if(TOWERS[i].mod)TOWERS.splice(i,1);
  if(M.walls>=2){const R=wallR(S);const L=[[-R,-20],[-R,20],[R+1,-20],[R+1,20],[-20,-R],[20,-R],[-20,R+1],[20,R+1]];const L3=M.walls>=3?[[-R,-32],[-R,32],[R+1,-32],[R+1,32],[-32,-R],[32,-R],[-32,R+1],[32,R+1]]:[];for(const [dx,dy] of L.concat(L3))TOWERS.push({x:S.x+dx,y:S.y+dy,mod:1,s:MOD_ID,cd:0});}
  try{buildWorldMap();}catch(_){}}
const MODST=[];
function modDaily(){const M=MODS();if(!M)return;const I=modIncome();M.treasury=Math.max(0,M.treasury+I.farm+I.tax-I.upkeep);
  const tgt=[5,15,35][M.tax]-M.streets*5-M.bld.temple*4-(season()===3?M.bld.granary*3:0)+(M.siege?20:0)+(modFields().length<MODF.fields.length?8:0);M.unrest=Math.max(0,Math.min(100,Math.round(M.unrest+(tgt-M.unrest)*0.2)));
  for(let i=M.q.length-1;i>=0;i--){const q=M.q[i];if(world.day>=q.done){M.q.splice(i,1);if(q.k==="walls")M.walls=q.to;else if(q.k==="streets")M.streets=q.to;else M.bld[q.k.slice(4)]=q.to;
    const m=`Moderno: ${modLabel(q.k)} finished — now ${modTierName(q.k,q.to)}.`;try{addNews(MOD_ID,m);jAdd(m,"home");}catch(_){}toast("🏙 "+m);modApply();}}
  modSiegeTick();}
// ---- sieges: foreign countries can declare war on the free city (counts toward the global conflict caps) ----
function conflicts(){const L=[];try{const K=kState();for(const k of KINGDOMS)if(!k.demon&&K.war&&K.war[k.id])L.push({kind:"war",a:k.id});}catch(_){}
  try{for(const c of (world.wars||[]))if(!c.over)L.push({kind:"war",a:c.a,b:c.b});}catch(_){}try{for(const r of (world.rebels||[]))if(!r.over)L.push({kind:"rebellion",s:r.s});}catch(_){}
  const M=world&&world.mod;if(M&&M.siege)L.push({kind:"war",a:M.siege.k,b:"moderno"});return L;}
function countriesAtWar(){const s=new Set();for(const c of conflicts())if(c.kind==="war"){s.add(c.a);if(c.b!=null&&c.b!=="moderno")s.add(c.b);}return s;}
function canStartConflict(kind,ks){const L=conflicts();if(L.length>=4)return false;if(kind==="war"){const s=countriesAtWar();for(const k of ks||[])s.add(k);if(s.size>3)return false;}return true;}
function modDeclare(k,forced){const M=MODS();if(M.siege)return false;const ks=[k];if(!forced&&!canStartConflict("war",ks))return false;if(!canStartConflict("war",ks)){M.pending=k;return false;}
  const K=KINGDOMS[k];M.siege={k,day:world.day,until:world.day+5,str:Math.round((2+Math.random()*3+world.day/3650)*10)/10,won:0};world.sets[MOD_ID].raid={until:absMin()+720,spawned:false,n:7,siege:k};
  const m=`${K.ruler} of ${K.name} has declared war on Moderno! Their army marches on the farmland.`;try{addNews(MOD_ID,m);jAdd(m,"war");}catch(_){}try{queueW&&WQ.push({k:"mod",why:m});}catch(_){}toast("⚔ "+m);return true;}
function modSiegeTick(){const M=MODS();const S=M.siege;
  if(!S){if(M.pending!=null&&canStartConflict("war",[M.pending])){const k=M.pending;M.pending=null;modDeclare(k);return;}
    if(world.day<M.peaceUntil)return;if(Math.random()<0.004+M.treasury/2e6){const cand=KINGDOMS.filter(k=>!k.demon&&!(kState().crowns||[]).includes(k.id));if(cand.length){const k=pick(cand).id;if(!modDeclare(k))M.pending=k;}}return;}
  const ws=world.sets[MOD_ID];if(!ws.raid&&!S.cleared){S.cleared=true;S.str=Math.max(0.5,S.str-2);}
  if(world.day>=S.until){const def=modDefense()*(0.8+Math.random()*0.4);const K=KINGDOMS[S.k];
    if(def>=S.str||S.cleared){M.unrest=Math.max(0,M.unrest-10);const m=`Moderno held! ${K.name}'s army broke against the ${WALL_T[M.walls].toLowerCase()}.`;try{addNews(MOD_ID,m);jAdd(m,"war");}catch(_){}toast("🏙 "+m);}
    else{const trib=Math.round(M.treasury*0.3);M.treasury-=trib;const F=modFields();for(let i=0;i<F.length;i+=3)M.burnt[F[i].i]=world.day+20;
      const m=`Moderno's walls held but ${K.name} ravaged the farmland and took ${trib}g in tribute. (Your homes are untouched.)`;try{addNews(MOD_ID,m);jAdd(m,"war");}catch(_){}toast("⚔ "+m);}
    M.siege=null;ws.raid=null;M.peaceUntil=world.day+60;if(!(def>=S.str||S.cleared)){M.terr=Math.max(56,modTerr()-8);if(typeof modTerrChanged==="function")modTerrChanged();try{addNews(MOD_ID,`${K.name} seized a strip of Moderno's countryside.`);}catch(_){}}}}
function modSue(){const M=MODS(),S=M.siege;if(!S)return;const c=Math.round(100+S.str*80);if(M.treasury+(P.gold||0)<c){toast("Not enough gold for a peace payment.");return;}
  const t=Math.min(M.treasury,c);M.treasury-=t;P.gold-=c-t;const K=KINGDOMS[S.k];M.siege=null;world.sets[MOD_ID].raid=null;M.peaceUntil=world.day+60;const m=`I paid ${c}g and ${K.name} withdrew from Moderno.`;try{jAdd(m,"war");addNews(MOD_ID,m);}catch(_){}toast("🕊 "+m);}
// ---- Lord menu ----
function modStatus(){const M=MODS(),I=modIncome();const q=M.q.map(q=>`🏗 ${modLabel(q.k)} → ${modTierName(q.k,q.to)} (${Math.max(0,q.done-world.day)}d left)`).join("\n");
  return `Flag: azure field, white band, golden star · Lord: you\n💰 Treasury ${M.treasury}g · daily +${I.farm} farms +${I.tax} taxes −${I.upkeep} guards\n👥 Population ${modPop()} · 🛡 Guards ${M.guards}/${modGuardCap()} · 😠 Unrest ${M.unrest}\n🏰 Walls: ${WALL_T[M.walls]} (defense ${modDefense()}) · 🛣 Streets: ${STREET_T[M.streets]}\n🌾 Fields ${modFields().length}/${MODF.fields.length}, orchards ${MODF.orchards.length}, pastures ${MODF.pastures.length}`+
   (M.siege?`\n⚔ BESIEGED by ${KINGDOMS[M.siege.k].name} (strength ${M.siege.str}) — ${Math.max(0,M.siege.until-world.day)} days`:"")+(q?"\n"+q:"");}
function modBtn(k){const t=modTier(k);if(t>=modMax(k))return{l:`${modLabel(k)}: ${modTierName(k,t)} (max)`,dis:true};if(modQueued(k))return{l:`${modLabel(k)}: building…`,dis:true};const c=modCost(k,t);
  return{l:`${modLabel(k)} → ${modTierName(k,t+1)} (${c.gold}g, ${c.wood} wood, ${c.days}d)`,f:()=>{modStart(k);modUpgrades();}};}
function modUpgrades(){showMenu("🏗 Moderno upgrades",modStatus(),[modBtn("walls"),modBtn("streets"),{l:"🏘 Districts & buildings…",f:modDistricts},{l:"Back",f:lordMenu}]);}
function modDistricts(){showMenu("🏘 Moderno districts",MOD_DIST.map(([k,n])=>`${n}: ${modTierName("bld:"+k,MODS().bld[k])}`).join("\n"),MOD_DIST.map(([k])=>modBtn("bld:"+k)).concat([{l:"Back",f:modUpgrades}]));}
function lordMenu(){const M=MODS();if(!M)return;const B=[{l:"🏗 Upgrades (walls, streets, buildings)",f:modUpgrades},
  {l:`💰 Taxes: ${["Low","Normal","High"][M.tax]} (tap to change)`,f:()=>{M.tax=(M.tax+1)%3;lordMenu();}},
  {l:`🛡 Hire a guard (${M.guards}/${modGuardCap()}, 60g)`,dis:M.guards>=modGuardCap(),f:()=>{if(M.treasury>=60){M.treasury-=60;M.guards++;}else toast("The treasury can't pay a new guard.");lordMenu();}},
  {l:"💼 Take 50% of treasury",dis:M.treasury<2,f:()=>{const g=Math.floor(M.treasury/2);M.treasury-=g;P.gold+=g;toast(`💰 +${g}g from Moderno's treasury`);lordMenu();}}];
  if(M.siege)B.push({l:`🕊 Sue for peace (${Math.round(100+M.siege.str*80)}g)`,f:()=>{modSue();lordMenu();}},{l:"🌌 Teleport to the walls",f:()=>{const S=SETS[MOD_ID];warpTo(S.x*TILE+2,(S.y+S.r+6)*TILE,"Moderno's walls");}});
  B.push({l:"Close"});showMenu("🏙 Lord of Moderno",modStatus(),B);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(Array.isArray(b)&&world&&world.mod!==undefined||Array.isArray(b)&&world){
  if(t==="Paused"){MODS();b=[{l:MODS().siege?"🏙 Moderno ⚔":"🏙 Moderno",f:lordMenu}].concat(b);}
  else if(t==="🌌 Teleport — where to?"&&!b.some(o=>o&&/Moderno \(your city\)/.test(o.l||""))){const S=SETS[MOD_ID];b=b.slice();b.unshift({l:"🏙 Moderno (your city)",f:()=>warpTo(S.x*TILE+2,(S.y+3)*TILE+2,"Moderno")});}
  else{const n=typeof talkFocus!=="undefined"?talkFocus:null;if(n&&n.s===MOD_ID&&n.role==="leader"&&typeof t==="string"&&t.includes(n.name)&&!b.some(o=>o&&o._lord)){b=[{_lord:1,l:"🏙 Lord of Moderno",f:lordMenu}].concat(b);x=(x||"")+"\n\n\"My Lord. Moderno answers to you alone — not to any crown.\"";}}}}catch(_){}return _sm.call(this,t,x,b);};}
const MOD_LINES=["Long live the Lord of Moderno!","No king taxes us here. Only our Lord.","Have you seen the new works? The city grows every season.","The farms out past the wall feed the whole city.","They say Moderno is three times the size of any capital."];
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(n&&n.s===MOD_ID&&Array.isArray(L)&&n.role!=="child")L.splice(1,0,MOD_LINES[(n.id+world.day)%MOD_LINES.length]+(MODS().siege?` ${KINGDOMS[MODS().siege.k].name}'s soldiers are at the fields!`:""));}catch(_){}return L;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{modDaily();}catch(e){console.warn(e);}return r;};}
{const _ay=awayYears;awayYears=function(y){const r=_ay.apply(this,arguments);try{const M=MODS();const I=modIncome();M.treasury=Math.min(5e6,M.treasury+Math.round((I.farm/1.6+I.tax-I.upkeep)*365*y*0.5));for(const q of M.q)q.done=Math.min(q.done,world.day);modDaily();M.siege=null;if(world.sets[MOD_ID])world.sets[MOD_ID].raid=null;}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r&&world){MODS();try{w47Populate();}catch(_){}modApply();P.tpv=P.tpv||[];if(!P.tpv.includes(MOD_ID))P.tpv.push(MOD_ID);}}catch(e){console.warn(e);}return r;};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{MODS();modApply();}catch(_){}return r;};}
{const _rt=ruinTown;ruinTown=function(sid){if(sid===MOD_ID)return;return _rt.apply(this,arguments);};}
// map: label + flag; info line says "Free City of Moderno"
{const _mi=mapInfo;mapInfo=function(){const o=_mi.apply(this,arguments);try{const tx=(hero.x+6)/TILE,ty=(hero.y+8)/TILE;if(inModerno(tx,ty))o.kingdom="Free City of Moderno";}catch(_){}return o;};}
function drawModFlag(g,x,y,s){g.fillStyle="#5a3a1a";g.fillRect(x,y-2*s,1.2*s,10*s);g.fillStyle=MOD_FLAG.field;g.fillRect(x+1.2*s,y-2*s,8*s,5.4*s);g.fillStyle=MOD_FLAG.band;g.fillRect(x+1.2*s,y+0.1*s,8*s,1.2*s);
  g.fillStyle=MOD_FLAG.star;g.beginPath();const cx=x+5.2*s,cy=y-0.4*s;for(let i=0;i<10;i++){const a=-1.571+i*0.628,r=i%2?0.7*s:1.7*s;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.fill();g.strokeStyle="#000";g.lineWidth=0.6;g.strokeRect(x+1.2*s,y-2*s,8*s,5.4*s);}
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{const c=document.getElementById("mapc");if(!c||!world)return;const g=c.getContext("2d");const S=SETS[MOD_ID];const p=mapToScreen(S.x,S.y);const z=MAPM.z;
  if(z<=1){g.font=`bold ${z?16:13}px system-ui`;g.textAlign="center";g.lineWidth=3;g.strokeStyle="rgba(0,0,0,.85)";const t="🏙 MODERNO"+(MODS().siege?" ⚔":"");g.strokeText(t,p.x,p.y-(z?34:22));g.fillStyle="#7ac8ff";g.fillText(t,p.x,p.y-(z?34:22));}
  drawModFlag(g,p.x+8,p.y-8,z>=2?1.6:1);
  if(MODS().siege){const s=mapScaleCss();g.strokeStyle="rgba(255,60,60,.9)";g.setLineDash([5,4]);g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,(S.r+34)*s,0,6.283);g.stroke();g.setLineDash([]);}}catch(_){}};}
// ---- world drawing: tiered walls, street décor, building upgrades, scaffolding, farmland life, signs and flags ----
{const _dw=drawWallsList;drawWallsList=function(list,vis){const M=world&&world.mod;if(!M)return _dw.apply(this,arguments);const keep=WALLS;WALLS=keep.filter(w=>w.s!==MOD_ID);try{_dw.call(this,list,vis);}finally{WALLS=keep;}
  try{modDrawList(list,vis);}catch(e){}};}
function modWall(w,M){const x=w.x*16,y=w.y*16,hp=wallHp(w.i);if(hp<=0){ctx.fillStyle="#8a8078";ctx.fillRect(x+2,y+10,12,4);return;}
  ctx.fillStyle="rgba(30,15,10,.25)";ctx.fillRect(x+2,y+12,16,5);
  if(M.walls===0){for(let k=0;k<4;k++){const sx=x+k*4;ctx.fillStyle=k%2?"#a8743e":"#946232";ctx.fillRect(sx,y-6,4,19);ctx.beginPath();ctx.moveTo(sx,y-6);ctx.lineTo(sx+2,y-10);ctx.lineTo(sx+4,y-6);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.7;ctx.strokeRect(sx,y-6,4,19);}ctx.fillStyle="#6e4422";ctx.fillRect(x,y+1,16,2);return;}
  const H=M.walls===1?22:M.walls===2?28:32,top=y+14-H;const c1=M.walls>=3?"#8a8690":"#b8b0b0",c2=M.walls>=3?"#a6a2ac":"#cfc8c4",c3=M.walls>=3?"#76727c":"#a8a09c";
  ctx.fillStyle=c1;ctx.fillRect(x,top,16,H);for(let r=0;r<Math.floor(H/5.5);r++)for(let c=0;c<2;c++){ctx.fillStyle=(r+c)%2?c2:c3;ctx.fillRect(x+c*8+(r%2?2:0)+.5,top+r*5.5+.5,7,5);}
  ctx.fillStyle=c2;for(let c=0;c<3;c++)ctx.fillRect(x+c*6,top-4,4,4);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(x,top,16,H);for(let c=0;c<3;c++)ctx.strokeRect(x+c*6,top-4,4,4);
  if(M.walls>=3){ctx.fillStyle="#2a2a34";ctx.fillRect(x+7,top+8,2,6);if(w.i%6===0){ctx.fillStyle="#5a3a1a";ctx.fillRect(x+7,top-16,1.5,12);ctx.fillStyle=MOD_FLAG.field;ctx.fillRect(x+8.5,top-16,7,5);ctx.fillStyle=MOD_FLAG.star;ctx.fillRect(x+11,top-14,2,2);}}}
function scaffold(x,y,w,h){ctx.strokeStyle="#7a5228";ctx.lineWidth=1.4;for(let i=0;i<=w;i+=8){ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i,y+h);ctx.stroke();}for(let j=0;j<=h;j+=8){ctx.beginPath();ctx.moveTo(x,y+j);ctx.lineTo(x+w,y+j);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+h);ctx.stroke();ctx.fillStyle="#e8c060";ctx.fillRect(x+w-6,y-10,2,10);ctx.fillRect(x+w-14,y-10,10,2);ctx.strokeStyle="#333";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x+w-13,y-8);ctx.lineTo(x+w-13,y-2);ctx.stroke();}
function farmhand(x,y,sea,t,seed){const L=chibiLook(seed,"farmer","human");const ph=Math.floor(t/20)%2;drawChibi(L,x,y,(seed>>2)%4,ph);
  ctx.strokeStyle="#6a4a22";ctx.lineWidth=1.3;ctx.beginPath();if(sea===2){ctx.fillStyle="#c89a3a";ctx.fillRect(x+9,y+4,6,5);}else{ctx.moveTo(x+11,y-2);ctx.lineTo(x+14+ph*2,y+10);}ctx.stroke();}
function modDrawList(list,vis){const M=world.mod,S=SETS[MOD_ID],sea=season(),hr=hour(),t=frameN;
  for(const w of WALLS){if(w.s!==MOD_ID||!vis(w.x*16,w.y*16,40))continue;list.push({y:w.y*16+15,f:()=>modWall(w,M)});}
  // construction sites
  for(const q of M.q){if(q.k==="walls"){const MW=WALLS.filter(w=>w.s===MOD_ID);const pr=Math.max(0,Math.min(0.999,(world.day-(q.start||world.day)+world.min/1440)/Math.max(1,q.done-(q.start||world.day))));const c=Math.floor(pr*MW.length);// only the stretch being built right now
      for(let j=c;j<Math.min(MW.length,c+6);j+=2){const w=MW[j];if(!vis(w.x*16,w.y*16,40))continue;list.push({y:w.y*16+16,f:()=>scaffold(w.x*16-4,w.y*16-24,24,36)});}}
    else if(q.k==="streets"){const R=S.r-4;for(let k=0;k<6;k++){const px=(S.x+Math.cos(k)*R*0.6)*16,py=(S.y+Math.sin(k)*R*0.6)*16;if(!vis(px,py,30))continue;list.push({y:py+8,f:()=>{ctx.fillStyle="#9a9088";for(let i=0;i<5;i++)ctx.fillRect(px+i*4,py+((i*7)%5),3,3);ctx.fillStyle="#7a5228";ctx.fillRect(px-2,py+6,24,2);ctx.fillStyle="#ff8a20";ctx.beginPath();ctx.moveTo(px+24,py+8);ctx.lineTo(px+27,py);ctx.lineTo(px+30,py+8);ctx.fill();}});}}
    else{const mk=q.k.slice(4);for(const i of S.bIdx.concat(buildings.filter(b=>b.farm).map(b=>b.id))){const b=buildings[i];if(!b||b.mk!==mk||!vis(b.x*16,b.y*16,80))continue;list.push({y:(b.y+b.h)*16+2,f:()=>scaffold(b.x*16-2,b.y*16-30,b.w*16+4,b.h*16+28)});}}}
  // building upgrades: window boxes, pennants, awnings, gold trim
  for(const i of S.bIdx){const b=buildings[i];if(!b||!vis(b.x*16,b.y*16,80))continue;const tier=M.bld[b.mk]||0;if(!tier)continue;const x=b.x*16,y=b.y*16;
    list.push({y:(b.y+b.h)*16+1,f:()=>{ctx.fillStyle="#3a8a2a";ctx.fillRect(x+6,y+b.h*16-14,12,3);ctx.fillStyle="#ff6a8a";ctx.fillRect(x+7,y+b.h*16-16,2,2);ctx.fillRect(x+12,y+b.h*16-16,2,2);
      if(tier>=2){ctx.fillStyle="#5a3a1a";ctx.fillRect(x+b.w*16-8,y-30,1.5,16);ctx.fillStyle=MOD_FLAG.field;ctx.fillRect(x+b.w*16-6.5,y-30,8,5);ctx.fillStyle=MOD_FLAG.star;ctx.fillRect(x+b.w*16-3.5,y-28.5,2,2);
        ctx.fillStyle="#d84a3a";for(let k=0;k<4;k++){ctx.fillStyle=k%2?"#f6eedc":"#2a6ad0";ctx.fillRect(x+30+k*5,y+b.h*16-20,5,4);}}
      if(tier>=3){ctx.fillStyle="#ffd040";ctx.fillRect(x,y-2,b.w*16,2);ctx.strokeStyle="#a07810";ctx.lineWidth=.6;ctx.strokeRect(x,y-2,b.w*16,2);}
      ctx.fillStyle="#ffd040";ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillText("★".repeat(tier),x+b.w*8,y+b.h*16+8);}});}
  // paved boulevards: lamps, trees, fountains
  if(M.streets>=2)for(let gy=-4;gy<=4;gy++)for(let gx=-4;gx<=4;gx++){const tx=S.x+gx*7+(gx<0?0:1),ty=S.y+gy*6+(gy<0?0:1);if((gx|gy)===0||Math.hypot(tx-S.x,ty-S.y)>S.r-3)continue;const px=tx*16,py=ty*16;if(!vis(px,py,40))continue;if(OCC[ty*WW+tx]>0)continue;
    const kind=(gx*3+gy*5+40)%3;list.push({y:py+14,f:()=>{if(kind===0){ctx.fillStyle="#2a2a30";ctx.fillRect(px+7,py-14,2,26);ctx.fillStyle=hr>=18||hr<6?"#ffe890":"#f0e8c0";ctx.fillRect(px+5,py-18,6,5);ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.strokeRect(px+5,py-18,6,5);}
      else if(kind===1){ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(px+8,py+12,7,3,0,0,7);ctx.fill();ctx.fillStyle="#6a4a2a";ctx.fillRect(px+7,py,2,12);ctx.fillStyle=sea===3?"#dfe8ee":sea===2?"#e08a30":"#3aa04a";ctx.beginPath();ctx.arc(px+8,py-3,7,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.stroke();}
      else{ctx.fillStyle="#b8b0a8";ctx.beginPath();ctx.ellipse(px+8,py+8,9,5,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#5ab8ff";ctx.beginPath();ctx.ellipse(px+8,py+8,7,3.4,0,0,7);ctx.fill();ctx.fillStyle="#cfe8ff";ctx.fillRect(px+7,py-2-((t>>3)%3),2,9);}}});}
  // welcome sign + flag at the south gate
  {const px=(S.x+4)*16,py=(S.y+wallR(S)+3)*16;if(vis(px,py,60))list.push({y:py+12,f:()=>{ctx.fillStyle="#6a4422";ctx.fillRect(px+10,py-6,3,18);ctx.fillStyle="#d8b070";ctx.fillRect(px-6,py-14,36,11);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(px-6,py-14,36,11);ctx.fillStyle="#3a2010";ctx.font="bold 6px system-ui";ctx.textAlign="center";ctx.fillText("MODERNO",px+12,py-6.5);drawModFlag(ctx,px+34,py-14,1.4);}});}
  // farmland: fences, crops by season, orchards' fruit, livestock, farmhands at work
  const fence=(q)=>{const x=q.x*16-3,y=q.y*16-3,w=q.w*16+6,h=q.h*16+6;ctx.strokeStyle="#8a5a2a";ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);ctx.strokeRect(x,y+3,w,h-6);ctx.fillStyle="#6a4422";for(let i=0;i<=w;i+=12){ctx.fillRect(x+i-1,y-2,2,6);ctx.fillRect(x+i-1,y+h-4,2,6);}for(let j=12;j<h;j+=12){ctx.fillRect(x-1,y+j-2,2,6);ctx.fillRect(x+w-1,y+j-2,2,6);}};
  for(const q of MODF.fields){if(!vis(q.x*16,q.y*16,q.w*16+40))continue;const burnt=M.burnt[q.i]>world.day;
    list.push({y:q.y*16-2,f:()=>{for(let r=0;r<q.h;r++)for(let c=0;c<q.w;c++){const px=(q.x+c)*16,py=(q.y+r)*16;if(burnt){ctx.fillStyle="rgba(40,30,30,.75)";ctx.fillRect(px,py,16,16);continue;}
      if(sea===3){ctx.fillStyle="rgba(240,246,250,.55)";ctx.fillRect(px,py,16,16);continue;}for(let k=0;k<3;k++){const sx=px+3+k*5;if(sea===0){ctx.fillStyle="#7ad04a";ctx.fillRect(sx,py+9,2,3);}else if(sea===1){ctx.fillStyle="#3a9a2a";ctx.fillRect(sx,py+3,2,10);ctx.fillRect(sx-1,py+5,4,2);}else{ctx.fillStyle="#e8c040";ctx.fillRect(sx,py+2,2,11);ctx.fillStyle="#c89a20";ctx.fillRect(sx-1,py+1,4,3);}}}}});
    list.push({y:(q.y+q.h)*16+3,f:()=>fence(q)});
    /* farm work is done by real farmer NPCs (talkable) */}
  for(const q of MODF.orchards){if(!vis(q.x*16,q.y*16,q.w*16+40))continue;list.push({y:(q.y+q.h)*16+3,f:()=>{fence(q);if(sea===1||sea===2){ctx.fillStyle=sea===2?"#e83a2a":"#ffb0c0";for(let r=1;r<q.h;r+=3)for(let c=1;c<q.w;c+=3){const px=(q.x+c)*16,py=(q.y+r)*16;ctx.fillRect(px+3,py-10,3,3);ctx.fillRect(px+10,py-6,3,3);}}}});
    }
  for(const q of MODF.pastures){if(!vis(q.x*16,q.y*16,q.w*16+40))continue;list.push({y:(q.y+q.h)*16+3,f:()=>fence(q)});
    for(let k=0;k<4;k++){const ax=q.x*16+12+((t*0.05*(k%2?1:-1)+k*37+q.i*11)%(q.w*16-24)+(q.w*16-24))%(q.w*16-24),ay=q.y*16+12+k*20%(q.h*16-20);
      list.push({y:ay+8,f:()=>{const sheep=k%2;ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(ax+6,ay+8,7,2.5,0,0,7);ctx.fill();ctx.fillStyle=sheep?"#f4f0e8":"#f8f8f8";ctx.beginPath();ctx.ellipse(ax+6,ay+2,7,5,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.stroke();
        if(!sheep){ctx.fillStyle="#2a2a2a";ctx.fillRect(ax+2,ay,3,3);ctx.fillRect(ax+7,ay+2,3,2);}ctx.fillStyle=sheep?"#3a3a3a":"#f8f8f8";ctx.beginPath();ctx.arc(ax+13,ay,3,0,7);ctx.fill();ctx.stroke();ctx.fillStyle="#3a3a3a";ctx.fillRect(ax+2,ay+6,1.5,3);ctx.fillRect(ax+9,ay+6,1.5,3);}});}}
  // a siege: enemy camp with tents and banners beyond the fields
  if(M.siege){const K=KINGDOMS[M.siege.k];for(let k=0;k<8;k++){const a=k/8*6.283+0.4,R=S.r+36;const px=(S.x+Math.cos(a)*R)*16,py=(S.y+Math.sin(a)*R)*16;if(!vis(px,py,40))continue;
    list.push({y:py+10,f:()=>{ctx.fillStyle="#d8c8a0";ctx.beginPath();ctx.moveTo(px-12,py+10);ctx.lineTo(px,py-10);ctx.lineTo(px+12,py+10);ctx.closePath();ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#3a2a1a";ctx.fillRect(px-2,py+2,4,8);
      ctx.fillStyle="#5a3a1a";ctx.fillRect(px+14,py-16,1.5,26);ctx.fillStyle=K.col;ctx.fillRect(px+15.5,py-16,9,6);}});}}}
