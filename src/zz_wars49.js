// ===== v49 MOVING WAR FRONTS & REBELLIONS =====
// world.wars:[{id,a,b,p,day,sa,sb,hero,target,over}] front p in [-1,1] (>0 = a pushing into b); world.rebels:[{s,k,day,until,rs,cs,hero,over}];
// world.treaties:[{a,b,kind:"peace"|"truce"|"alliance",until}]; world.owner:{sid:k|-1}. Caps via canStartConflict (max 4 conflicts, max 3 countries at war).
const W49=()=>{world.wars=world.wars||[];world.rebels=world.rebels||[];world.treaties=world.treaties||[];world.owner=world.owner||{};world.cq=world.cq||[];world.wid=world.wid||1;return world;};
const HUMAN_K=()=>KINGDOMS.filter(k=>!k.demon).map(k=>k.id);
const pairKey=(a,b)=>a<b?a+"-"+b:b+"-"+a;
function treatyOf(a,b){return W49().treaties.find(t=>pairKey(t.a,t.b)===pairKey(a,b)&&(t.kind==="alliance"||t.until>world.day));}
const isCap49=sid=>KINGDOMS.some(k=>k.cap===sid);
const townsOf=k=>SETS.filter(s=>!s.island&&s.id!==MOD_ID&&kOf(s.id)===k);
const warOf=(a,b)=>W49().wars.find(w=>!w.over&&pairKey(w.a,w.b)===pairKey(a,b));
const strOf=k=>townsOf(k).length*2+(isAllied(k)?2:0)+3;
const isAllied=k=>W49().treaties.some(t=>t.kind==="alliance"&&(t.a===k||t.b===k));
function k49Refresh(){try{KGRID=null;buildKGrid();findBorderPosts();buildWorldMap();syncWar();}catch(_){}}
function setOwner(sid,k){const S=SETS[sid];W49().owner[sid]=k;if(k===-1){S.free=true;S.freeTown=true;}else{S.free=false;S.freeTown=false;KOF[sid]=k;}k49Refresh();}
function applyOwners(){const O=W49().owner;for(const sid in O){const S=SETS[sid];if(!S)continue;if(O[sid]===-1){S.free=true;S.freeTown=true;}else{S.free=false;S.freeTown=false;KOF[sid]=O[sid];}}k49Refresh();}
// nearest pair of towns between two countries: where the front sits
function frontOf(w){const A=townsOf(w.a),B=townsOf(w.b);let best=null,bd=1e9;for(const s of A)for(const t of B){const d=Math.hypot(s.x-t.x,s.y-t.y);if(d<bd){bd=d;best=[s,t];}}
  if(!best){const s=SETS[KINGDOMS[w.a].cap],t=SETS[KINGDOMS[w.b].cap];best=[s,t];}const [s,t]=best;const f=0.5+0.35*w.p;return{x:Math.round(s.x+(t.x-s.x)*f),y:Math.round(s.y+(t.y-s.y)*f),s,t,ang:Math.atan2(t.y-s.y,t.x-s.x)};}
function alert49(title,text,pos){try{addNews(-1,text);jAdd(text,"war");}catch(_){}toast("⚔ "+text);W49().cq.push({title,text,pos});}
function startWar(a,b,why){if(a===b||warOf(a,b)||treatyOf(a,b))return false;if(!canStartConflict("war",[a,b]))return false;const w={id:W49().wid++,a,b,p:0,day:world.day,sa:strOf(a),sb:strOf(b),over:false};world.wars.push(w);
  const f=frontOf(w);alert49("⚔ War!",`${KINGDOMS[a].name} has declared war on ${KINGDOMS[b].name}${why?" ("+why+")":""}! The front lies between ${f.s.name} and ${f.t.name}.`,f);return w;}
function endWar(w,kind,quiet){w.over=true;const t={a:w.a,b:w.b,kind,until:world.day+(kind==="truce"?30:kind==="peace"?120:1e9)};world.treaties=world.treaties.filter(q=>pairKey(q.a,q.b)!==pairKey(w.a,w.b));world.treaties.push(t);
  if(!quiet)alert49("🕊 "+(kind==="alliance"?"Alliance":kind==="truce"?"Truce":"Peace"),`${KINGDOMS[w.a].name} and ${KINGDOMS[w.b].name} sign a ${kind==="alliance"?"treaty of alliance":kind==="truce"?"truce":"peace treaty"}.`);}
function capture(w,att,def){const f=frontOf(w);const cand=townsOf(def).filter(s=>!isCap49(s.id)).sort((x,y)=>Math.hypot(x.x-f.x,x.y-f.y)-Math.hypot(y.x-f.x,y.y-f.y));const S=cand[0];
  if(!S){endWar(w,"peace");return null;}setOwner(S.id,att);const ws=world.sets[S.id];ws.raid=null;ws.unrest=60;ws.conq=world.day;ws.price=Math.min(1.8,(ws.price||1)+0.3);
  alert49("🏳 Town captured",`${KINGDOMS[att].name} has captured ${S.name} from ${KINGDOMS[def].name}! New flag, new guards.`,{x:S.x,y:S.y});w.p=0;return S;}
// rebellions: unrest grows with war, recent conquest, high taxes in the hero's realms, and fades in peace
function townUnrest(s){const ws=world.sets[s.id];if(!ws)return 0;let u=ws.unrest==null?10:ws.unrest;const k=kOf(s.id);if(k<0)return 0;
  const tgt=8+(W49().wars.some(w=>!w.over&&(w.a===k||w.b===k))?15:0)+(ws.conq&&world.day-ws.conq<120?30:0)+(rulerRealms().includes(k)&&typeof realmOf==="function"&&(realmOf(k).tax||0)>1?20:0)+(ws.ruin?0:0);
  u+=(tgt-u)*0.05;ws.unrest=Math.max(0,Math.min(100,u));return ws.unrest;}
function startRebellion(s,why){const k=kOf(s.id);if(k<0||isCap49(s.id)||W49().rebels.some(r=>!r.over&&r.s===s.id))return false;if(!canStartConflict("rebellion"))return false;
  const r={s:s.id,k,day:world.day,until:world.day+6+Math.floor(Math.random()*7),rs:2+world.sets[s.id].unrest/20+Math.random()*2,cs:strOf(k)*0.6,over:false};world.rebels.push(r);
  alert49("✊ Rebellion!",`${s.name} rises against ${KINGDOMS[k].name}${why?" ("+why+")":""}! The crown marches troops to crush the rebels.`,{x:s.x,y:s.y});return r;}
function resolveRebellion(r,forceWin){const S=SETS[r.s],ws=world.sets[r.s],K=KINGDOMS[r.k];r.over=true;ws.raid=null;
  const rebelsWin=forceWin!=null?forceWin:(r.rs*(0.7+Math.random()*0.6)>r.cs*(0.7+Math.random()*0.6));
  if(!rebelsWin){ws.unrest=Math.max(0,(ws.unrest||0)-35);ws.price=Math.min(1.8,(ws.price||1)+0.2);const b=S.bIdx&&S.bIdx[0];if(b!=null&&world.bld[b])world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.3);
    alert49("👑 Rebellion crushed",`The crown of ${K.name} crushed the rebellion in ${S.name}. Order returns, but the town pays a heavy fine.`,{x:S.x,y:S.y});r.win="crown";return"crown";}
  // rebels win: free city, or join the neighbouring country they like best (never the one they rose against)
  let join=null,bd=1e9;for(const k of HUMAN_K()){if(k===r.k)continue;const c=SETS[KINGDOMS[k].cap];const d=Math.hypot(c.x-S.x,c.y-S.y)-(isAllied(k)?0:40)-(warOf(k,r.k)?120:0);if(d<bd){bd=d;join=k;}}
  const free=Math.random()<0.5||join==null;setOwner(r.s,free?-1:join);ws.unrest=15;r.win=free?"free":"join";r.joined=free?-1:join;
  alert49("✊ The rebels won",free?`${S.name} has thrown off ${K.name} and declares itself a free city!`:`${S.name} has thrown off ${K.name} and chosen to join ${KINGDOMS[join].name}!`,{x:S.x,y:S.y});return r.win;}
function wars49Daily(){if(!world||!world.sets)return;W49();
  for(const w of world.wars){if(w.over)continue;const sa=strOf(w.a)+(w.hero==="a"?3:0)+(w.heroA||0),sb=strOf(w.b)+(w.hero==="b"?3:0)+(w.heroB||0);
    w.p+=(sa-sb)*0.03+(Math.random()-0.5)*0.35;if(w.p>=1)capture(w,w.a,w.b);else if(w.p<=-1)capture(w,w.b,w.a);
    if(!w.over&&world.day-w.day>10&&Math.random()<0.04){const r=Math.random();endWar(w,r<0.5?"peace":r<0.85?"truce":"alliance");}}
  for(const r of world.rebels){if(r.over)continue;r.cs+=0.3;if(r.hero==="crown")r.cs+=0.6;if(r.hero==="rebels")r.rs+=0.6;if(world.day>=r.until)resolveRebellion(r);}
  // expired truces, new conflicts (wait while the caps are full)
  world.treaties=world.treaties.filter(t=>t.kind==="alliance"||t.until>world.day);
  if(Math.random()<0.03){const H=HUMAN_K();const a=pick(H),b=pick(H.filter(k=>k!==a));if(b!=null&&!rulerRealms().includes(a))startWar(a,b,pick(["a border dispute","a stolen dowry","a broken trade pact","an insult at court"]));}
  for(const s of SETS){if(s.island||s.id===MOD_ID)continue;const u=townUnrest(s);if(u>35&&Math.random()<u/3000)startRebellion(s,u>60?"anger over the war":"high taxes and hunger");}
  world.wars=world.wars.filter(w=>!w.over||world.day-w.day<400).slice(-30);world.rebels=world.rebels.filter(r=>!r.over||world.day-r.day<400).slice(-30);}
// away-time: each in-game year a few fronts move; capped so a long absence can't redraw the whole world
function wars49Away(y){W49();let ch=0;for(const w of world.wars)if(!w.over)endWar(w,"peace",true);for(const r of world.rebels)if(!r.over){resolveRebellion(r);ch++;}
  const n=Math.min(6,Math.floor(y*0.3+Math.random()));for(let i=0;i<n;i++){const H=HUMAN_K();const a=pick(H),b=pick(H.filter(k=>k!==a));const T2=townsOf(b).filter(s=>!isCap49(s.id));if(T2.length>1&&Math.random()<0.5&&!rulerRealms().includes(b)){const S=pick(T2);setOwner(S.id,a);world.sets[S.id].conq=world.day;}}}
// hero actions: join a side, negotiate, crush/support rebels
function frontNear(){const hx=hero.x/TILE,hy=hero.y/TILE;let best=null,bd=60;for(const w of W49().wars){if(w.over)continue;const f=frontOf(w);const d=Math.hypot(f.x-hx,f.y-hy);if(d<bd){bd=d;best={w,f};}}return best;}
function warMenu(w){const A=KINGDOMS[w.a],B=KINGDOMS[w.b],f=frontOf(w);const cost=150+Math.round(Math.abs(w.p)*200);
  showMenu(`⚔ ${A.name} vs ${B.name}`,`Front between ${f.s.name} and ${f.t.name} (${w.p>0?A.name:B.name} advancing, ${Math.round(Math.abs(w.p)*100)}%).\nDay ${world.day-w.day+1} of the war.${w.hero?`\nYou fight for ${w.hero==="a"?A.name:B.name}.`:""}`,
   [{l:`🗡 Fight for ${A.name}`,f:()=>{w.hero="a";toast(`You join ${A.name}'s army.`);}},{l:`🗡 Fight for ${B.name}`,f:()=>{w.hero="b";toast(`You join ${B.name}'s army.`);}},
    {l:`🕊 Negotiate peace (${cost}g)`,f:()=>{if(P.gold<cost){toast("Not enough gold to broker a treaty.");return;}P.gold-=cost;endWar(w,Math.random()<0.5?"peace":"truce");try{kState().rep=Math.min(100,(kState().rep||50)+5);}catch(_){}}},
    {l:"🌌 Teleport to the front",f:()=>warpTo(f.x*TILE,f.y*TILE,"the front")},{l:"Back",f:conflictsMenu}]);}
function rebelMenu(r){const S=SETS[r.s],K=KINGDOMS[r.k];const cost=120;
  showMenu(`✊ Rebellion in ${S.name}`,`Rebels (strength ${r.rs.toFixed(1)}) against ${K.name} (crown strength ${r.cs.toFixed(1)}). ${Math.max(0,r.until-world.day)} days until it is decided.${r.hero?`\nYou side with the ${r.hero}.`:""}`,
   [{l:"👑 Help the crown crush them",f:()=>{r.hero="crown";toast(`You stand with ${K.name}.`);}},{l:"✊ Support the rebels",f:()=>{r.hero="rebels";toast(`You stand with the rebels of ${S.name}.`);}},
    {l:`🕊 Negotiate (${cost}g): lower taxes, pardon`,f:()=>{if(P.gold<cost){toast("Not enough gold.");return;}P.gold-=cost;r.over=true;r.win="talks";world.sets[r.s].unrest=10;alert49("🕊 Rebellion ends","Thanks to the wanderer's talks, "+S.name+" lays down its arms and stays with "+K.name+".");}},
    {l:"🌌 Teleport there",f:()=>warpTo(S.x*TILE+2,(S.y+3)*TILE+2,S.name)},{l:"Back",f:conflictsMenu}]);}
function conflictsMenu(){W49();const L=conflicts();const B=[];for(const w of world.wars)if(!w.over)B.push({l:`⚔ ${KINGDOMS[w.a].name} vs ${KINGDOMS[w.b].name}`,f:()=>warMenu(w)});
  for(const r of world.rebels)if(!r.over)B.push({l:`✊ ${SETS[r.s].name} rebels vs ${KINGDOMS[r.k].name}`,f:()=>rebelMenu(r)});
  const tr=world.treaties.map(t=>`${t.kind==="alliance"?"🤝":"🕊"} ${KINGDOMS[t.a].name}–${KINGDOMS[t.b].name}: ${t.kind}${t.kind!=="alliance"?` (${t.until-world.day}d)`:""}`).join("\n");
  const fr=SETS.filter(s=>s.freeTown).map(s=>s.name).join(", ");
  B.push({l:"Close"});showMenu("⚔ Wars & Rebellions",`Active conflicts: ${L.length}/4 · countries at war: ${countriesAtWar().size}/3\n${tr||"No treaties."}${fr?"\nFree cities: "+fr:""}`,B);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world){W49();const n=conflicts().length;b=[{l:n?`⚔ Wars ${n}`:"⚔ Wars",f:conflictsMenu}].concat(b);}}catch(_){}return _sm.call(this,t,x,b);};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{wars49Daily();}catch(e){console.warn(e);}return r;};}
{const _ay=awayYears;awayYears=function(y){const r=_ay.apply(this,arguments);try{wars49Away(y);}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r&&world){W49();applyOwners();}}catch(e){console.warn(e);}return r;};}
// battle zone: soldiers clash at the front; enemy knights attack the hero once he picks a side
const BZ=[];
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||!world||room)return;
  if(frameN%40===0){const F=frontNear();if(F&&F.w.hero){const enemy=F.w.hero==="a"?F.w.b:F.w.a;const live=mobs.filter(m=>!m.dead&&m.war49===F.w.id).length;
      if(live<4&&Math.hypot(F.f.x*TILE-hero.x,F.f.y*TILE-hero.y)<30*TILE){const a=Math.random()*6.283;const m=spawnMob("knight",F.f.x*TILE+Math.cos(a)*140,F.f.y*TILE+Math.sin(a)*140,{kingdom:enemy});if(m){m.war49=F.w.id;m.warSide=F.w.hero;}}}}
  for(const m of mobs)if(m.war49&&m.dead&&!m.w49c){m.w49c=1;const w=world.wars.find(q=>q.id===m.war49);if(w){if(m.warSide==="a")w.heroA=(w.heroA||0)+0.5;else w.heroB=(w.heroB||0)+0.5;}}
  if(world.cq&&world.cq.length&&frameN%30===0&&!menuOpen()&&!paused&&!heroFighting()){const q=world.cq.shift();const B=[{l:"OK"}];if(q.pos)B.unshift({l:"🌌 Teleport there",f:()=>warpTo(q.pos.x*TILE,q.pos.y*TILE,"the front")});B.splice(1,0,{l:"⚔ Wars & Rebellions",f:conflictsMenu});showMenu(q.title,q.text,B);}}catch(_){}};}
// draw forts, tents and clashing soldiers at each front
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{if(!world||!world.wars)return;for(const w of world.wars){if(w.over)continue;const f=frontOf(w);const A=KINGDOMS[w.a],B=KINGDOMS[w.b];
  const nx=-Math.sin(f.ang),ny=Math.cos(f.ang);for(let k=-3;k<=3;k++){const bx=(f.x+nx*k*5)*16,by=(f.y+ny*k*5)*16;if(!vis(bx,by,80))continue;
    for(const [side,K,off] of [[0,A,-1],[1,B,1]]){const px=bx+Math.cos(f.ang)*off*28,py=by+Math.sin(f.ang)*off*28;const seed=w.id*97+k*13+side;
      list.push({y:py+8,f:()=>{if(k%3===0){ctx.fillStyle="#6e4422";for(let i=0;i<5;i++){ctx.fillRect(px-12+i*6,py-14,4,18);ctx.beginPath();ctx.moveTo(px-12+i*6,py-14);ctx.lineTo(px-10+i*6,py-18);ctx.lineTo(px-8+i*6,py-14);ctx.fill();}ctx.fillStyle="#5a3a1a";ctx.fillRect(px+16,py-30,1.5,30);ctx.fillStyle=K.col;ctx.fillRect(px+17.5,py-30,10,7);}
        else{const L={...chibiLook(seed,"guard","human"),cloth:K.rgb};const ph=((frameN>>3)+seed)%4;drawChibi(L,px+(ph<2?off*-3:0),py,side?2:1,ph%2);ctx.strokeStyle="#ddd";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px+6,py-4);ctx.lineTo(px+6-off*10*(ph<2?1:0.4),py-12);ctx.stroke();}}});}}}}catch(_){}};}
// map: front lines, captured/free towns, rebellions
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{if(!world||!world.wars)return;const c=document.getElementById("mapc");const g=c.getContext("2d");const s=mapScaleCss();
  for(const w of world.wars){if(w.over)continue;const f=frontOf(w);const p=mapToScreen(f.x,f.y);const nx=-Math.sin(f.ang),ny=Math.cos(f.ang),L=Math.max(14,40*s);
    g.lineWidth=3;g.strokeStyle="rgba(0,0,0,.7)";g.beginPath();g.moveTo(p.x-nx*L,p.y-ny*L);g.lineTo(p.x+nx*L,p.y+ny*L);g.stroke();g.setLineDash([6,4]);g.lineWidth=2;g.strokeStyle="#ff3a3a";g.beginPath();g.moveTo(p.x-nx*L,p.y-ny*L);g.lineTo(p.x+nx*L,p.y+ny*L);g.stroke();g.setLineDash([]);
    g.font="bold 14px system-ui";g.textAlign="center";g.fillStyle="#fff";g.strokeStyle="#000";g.lineWidth=3;g.strokeText("⚔",p.x,p.y+5);g.fillText("⚔",p.x,p.y+5);}
  for(const r of world.rebels){if(r.over)continue;const S=SETS[r.s];const p=mapToScreen(S.x,S.y);g.font="bold 13px system-ui";g.lineWidth=3;g.strokeStyle="#000";g.strokeText("✊",p.x+12,p.y-6);g.fillStyle="#ffb020";g.fillText("✊",p.x+12,p.y-6);}
  for(const S of SETS){if(!S.freeTown)continue;const p=mapToScreen(S.x,S.y);g.font="bold 10px system-ui";g.lineWidth=3;g.strokeStyle="#000";g.strokeText("FREE",p.x,p.y+16);g.fillStyle="#fff";g.fillText("FREE",p.x,p.y+16);}}catch(_){}};}
