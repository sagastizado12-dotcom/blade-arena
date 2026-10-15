// ===== v25 WORLD EVENTS on the calendar: eclipse, harvest festival, circling dragon, plague =====
const WEV=()=>{world.wev=world.wev||{};return world.wev;};
const doy=()=>world.day%28;
const nonDemonTowns=()=>SETS.filter(s=>!s.demon&&!(world.sets[s.id]&&world.sets[s.id].ruin));
function crier(sid,msg){const where=sid!=null&&SETS[sid]?SETS[sid].name:"the realm";try{addNews(sid==null?-1:sid,msg);}catch(_){}toast(`📯 Town crier: ${msg}`);try{jAdd(msg,"event");}catch(_){}}
function wevStart(type,sid){const W=WEV();const now=absMin();
  if(type==="eclipse"){W.eclipse={until:now+1440};crier(null,"The sun goes dark! An eclipse empowers every demon in the land — stay near the light.");}
  else if(type==="harvest"){W.harvest={until:now+1440};for(const s of nonDemonTowns())world.sets[s.id].festival=now+1440;crier(null,"The Harvest Festival has begun! Games in every town, and love is in the air.");}
  else if(type==="dragon"){if(W.dragon)return W.dragon;const T=sid!=null?SETS[sid]:nonDemonTowns()[Math.floor(hash2(world.day,7,991)*nonDemonTowns().length)];const k=Object.keys(DRAGONS)[Math.floor(hash2(world.day,3,992)*Object.keys(DRAGONS).length)];
    W.dragon={sid:T.id,k};world.sets[T.id].dragon={k,until:now+1e8,spawned:false,circling:true};crier(T.id,`${DRAGONS[k].name} is circling over ${T.name}! It will not leave until someone slays it.`);}
  else if(type==="plague"){if(W.plague)return W.plague;const L=nonDemonTowns();const T=sid!=null?SETS[sid]:L[Math.floor(hash2(world.day,5,993)*L.length)];W.plague={sid:T.id,start:now};world.sets[T.id].price=Math.min(1.8,(world.sets[T.id].price||1)+0.3);
    crier(T.id,`A plague has struck ${T.name}! A hero with medicine could save them.`);}
  return W[type];}
function wevEnd(type){const W=WEV();if(type==="dragon"&&W.dragon){const ws=world.sets[W.dragon.sid];if(ws&&ws.dragon&&ws.dragon.circling)ws.dragon=null;}delete W[type];}
// calendar schedule (once per game day)
{const _dt=dailyTick;dailyTick=function(){_dt.apply(this,arguments);try{if(!world||!P)return;const d=doy(),W=WEV();
  if(W.eclipse&&absMin()>=W.eclipse.until){delete W.eclipse;crier(null,"The eclipse has passed. The sun shines again.");}
  if(W.harvest&&absMin()>=W.harvest.until)delete W.harvest;
  if(d===13||d===27)wevStart("eclipse");// Summer 7 and Winter 7
  if(d===17)wevStart("harvest");// Autumn 4
  if(d%7===0&&!W.dragon&&hash2(world.day,1,994)<0.6)wevStart("dragon");// start of each season
  if(world.day%10===5&&!W.plague&&hash2(world.day,2,995)<0.5)wevStart("plague");}catch(e){console.warn(e);}};}
// keep events tidy hourly: circling dragon respawns if you walked away; ends when slain
{const _ht=hourlyTick;hourlyTick=function(){_ht.apply(this,arguments);try{const W=WEV();if(W.eclipse&&absMin()>=W.eclipse.until)delete W.eclipse;if(W.harvest&&absMin()>=W.harvest.until)delete W.harvest;
  if(W.dragon){const ws=world.sets[W.dragon.sid];if(!ws.dragon){crier(W.dragon.sid,`The dragon over ${SETS[W.dragon.sid].name} has been slain! The skies are clear.`);delete W.dragon;}
    else if(ws.dragon.spawned&&!mobs.some(m=>!m.dead&&m.sp==="dragon"))ws.dragon.spawned=false;}}catch(_){}};}
// eclipse: demons stronger
const isDemonMob=(sp,x)=>/demon|imp|fiend|shade|wraith|hell/.test(sp)||(x&&x.demon);
{const _sm=spawnMob;spawnMob=function(sp,x,y,extra){const e=_sm.apply(this,arguments);try{if(e&&WEV().eclipse&&isDemonMob(sp,extra)){e.hp=e.maxHp=Math.round(e.maxHp*1.6);e.dmg=(e.dmg||1)+1;e.eclipse=true;}}catch(_){}return e;};}
// eclipse sky
setInterval(()=>{try{let d=document.getElementById("eclipseTint");const on=world&&state==="play"&&!room&&WEV().eclipse;if(!d){d=document.createElement("div");d.id="eclipseTint";d.style.cssText="position:fixed;pointer-events:none;z-index:3;background:radial-gradient(ellipse at 50% 40%,rgba(70,0,35,.45),rgba(20,0,12,.78));display:none";document.body.appendChild(d);}
  if(!on){d.style.display="none";return;}const r=canvas.getBoundingClientRect();Object.assign(d.style,{display:"block",left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});}catch(_){}},250);
// harvest: romance bonus (+50% on any affection gain) — watched every 800ms
let romPrev=new Map();
setInterval(()=>{try{if(state!=="play"||!world||!WEV().harvest){romPrev.clear();return;}for(const n of npcs){if(!n.alive||n.age<18)continue;const p=romPrev.get(n.id);if(p!=null&&n.friend>p){n.friend=Math.min(100,n.friend+Math.ceil((n.friend-p)*0.5));}romPrev.set(n.id,n.friend);}}catch(_){}},800);
// festival games
function festTown(){const S=settlementAt(hero.x,hero.y);return S&&WEV().harvest&&world.sets[S.id].festival?S:null;}
function festivalGames(){const S=festTown();if(!S){toast("No festival here right now.");return;}P.festPlays=P.festPlays||{};const key=world.day+":"+S.id;const plays=P.festPlays[key]||0;
  const play=(name,chance,win,lose)=>()=>{if((P.festPlays[key]||0)>=3){showMenu("🎪 Festival",`You've played enough games in ${S.name} today.`,[{l:"OK",f:closeMenu}]);return;}P.festPlays[key]=(P.festPlays[key]||0)+1;
    const ok=Math.random()<chance;const msg=ok?win():lose;showMenu("🎪 "+name,msg,[{l:"More games",f:festivalGames},{l:"Close",f:closeMenu}]);};
  showMenu(`🎪 ${S.name} Harvest Games`,`Games left today: ${3-plays}. Prizes for winners!`,[
    {l:"🍎 Apple bobbing",f:play("Apple bobbing",0.6,()=>{P.gold+=30;P.inv.flowers=(P.inv.flowers||0)+1;return"You came up with an apple in your teeth! +30g and a bouquet.";},"Splash! Just a wet face this time.")},
    {l:"💪 Strength test",f:play("Strength test",Math.min(0.9,0.3+(P.lv||1)*0.03),()=>{P.gold+=50;P.fame=(P.fame||0)+2;return"DING! The bell rings. +50g, +2 fame.";},"The puck barely moves. The crowd giggles.")},
    {l:"🥧 Pie contest",f:play("Pie contest",0.45,()=>{P.inv.bread=(P.inv.bread||0)+3;P.hunger=100;return"You out-ate everyone! Full belly and 3 loaves to take home.";},"You tap out after four pies.")},
    {l:"Close",f:closeMenu}]);}
// plague cure
function plagueHere(){const W=WEV();if(!W.plague)return null;const S=settlementAt(hero.x,hero.y);return S&&S.id===W.plague.sid?S:null;}
function curePlague(pay){const W=WEV();if(!W.plague)return false;const S=SETS[W.plague.sid];
  if(pay==="potions"){if((P.inv.potion||0)<3){toast("You need 3 potions.");return false;}P.inv.potion-=3;}else{if(P.gold<200){toast("You need 200g for medicine.");return false;}P.gold-=200;}
  delete W.plague;world.sets[S.id].price=Math.max(0.6,world.sets[S.id].price-0.3);P.fame=(P.fame||0)+15;for(const n of npcs)if(n.alive&&n.s===S.id)n.friend=Math.min(100,n.friend+10);
  try{const K=kState();K.rep=Math.min(100,(K.rep||0)+5);}catch(_){}crier(S.id,`The hero cured the plague in ${S.name}! (+15 fame)`);return true;}
function plagueMenu(){const S=plagueHere();if(!S){toast("There is no plague here.");return;}showMenu(`☣ Plague in ${S.name}`,"The sick cough in the streets. You could cure them.",[{l:"Use 3 potions",f:()=>{if(curePlague("potions"))closeMenu();}},{l:"Buy medicine (200g)",f:()=>{if(curePlague("gold"))closeMenu();}},{l:"Not now",f:closeMenu}]);}
// sick NPCs cough
setInterval(()=>{try{const W=WEV();if(state!=="play"||!W.plague)return;const c=npcs.filter(n=>n.alive&&n.s===W.plague.sid&&!n.inside&&Math.hypot(n.x-hero.x,n.y-hero.y)<200);if(c.length&&Math.random()<0.5)say(pick(c),pick(["*cough cough*","I feel so weak...","Is there a healer?"]),120);}catch(_){}},4000);
// Pause buttons
{const _sm2=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world){const W=WEV(),ex=[];if(festTown())ex.push({l:"🎪 Festival games",f:festivalGames});if(plagueHere())ex.push({l:"☣ Cure plague",f:plagueMenu});
  const ev=[W.eclipse&&"🌑 Eclipse",W.harvest&&"🎪 Harvest Festival",W.dragon&&`🐉 Dragon over ${SETS[W.dragon.sid].name}`,W.plague&&`☣ Plague in ${SETS[W.plague.sid].name}`].filter(Boolean);if(ev.length)x=`Events: ${ev.join(" · ")}\n`+(x||"");if(ex.length)b=ex.concat(b);}}catch(_){}return _sm2.call(this,t,x,b);};}
// map + minimap markers
{const _df=drawFullMap;drawFullMap=function(){const r=_df.apply(this,arguments);try{const W=WEV(),txt=window.__mapTxt;const c=document.getElementById("mapc");if(!txt||!c)return r;const s=mapScaleCss(),cw=c.clientWidth,ch=c.clientHeight;const x0=MAPM.cx-cw/2/s,y0=MAPM.cy-ch/2/s;const P2=(x,y)=>[(x-x0)*s,(y-y0)*s];
  window.__wevMarks=[];const mark=(t,x,y,col,sz)=>{txt(t,x,y,col,sz);window.__wevMarks.push(t);};
  if(W.harvest)for(const S of nonDemonTowns()){const [x,y]=P2(S.x,S.y);mark("🎪",x-16,y+5,"#f9f",13);}
  if(W.dragon){const S=SETS[W.dragon.sid];const a=performance.now()/700;const R=Math.max(14,S.r*s*0.9);const [x,y]=P2(S.x,S.y);const g=c.getContext("2d");g.save();g.strokeStyle="rgba(255,80,40,.7)";g.setLineDash([4,4]);g.lineWidth=2;g.beginPath();g.arc(x,y,R,0,7);g.stroke();g.restore();mark("🐉",x+Math.cos(a)*R,y+Math.sin(a)*R+5,"#f60",15);}
  if(W.plague){const S=SETS[W.plague.sid];const [x,y]=P2(S.x,S.y);mark("☣",x+16,y+5,"#9f3",15);}
  if(W.eclipse){const g=c.getContext("2d");g.save();g.fillStyle="rgba(30,0,20,.55)";g.fillRect(cw/2-120,8,240,24);g.restore();mark("🌑 ECLIPSE — demons are stronger",cw/2,25,"#ff9ab0",13);}}catch(e){console.warn(e);}return r;};}
{const _dm=drawMini;drawMini=function(){_dm.apply(this,arguments);try{if(room||!world)return;const W=WEV();const R=MINI_R[miniZ],sx=mini.width/(R*2),sy=mini.height/(R*1.5),Wd=mini.width/2,H=mini.height/2;
  const put=(t,tx,ty,col)=>{let dx=(tx-hero.x/TILE)*sx,dy=(ty-hero.y/TILE)*sy;const k=Math.max(Math.abs(dx)/(Wd-7),Math.abs(dy)/(H-7),1);dx/=k;dy/=k;mg.save();mg.font="bold 11px system-ui";mg.textAlign="center";mg.fillStyle=col;mg.fillText(t,Wd+dx,H+dy+4);mg.restore();};
  if(W.dragon){const S=SETS[W.dragon.sid];put("🐉",S.x,S.y,"#f60");}if(W.plague){const S=SETS[W.plague.sid];put("☣",S.x,S.y,"#9f3");}
  if(W.eclipse){mg.save();mg.fillStyle="rgba(40,0,25,.35)";mg.fillRect(0,0,mini.width,mini.height);mg.restore();}}catch(_){}};}
