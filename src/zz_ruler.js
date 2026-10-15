// ===== v27 RULE A KINGDOM: Ruler tab once you hold a throne — taxes vs happiness, walls/guards (raid defense), crisis choices =====
function rulerRealms(){try{const K=kState();const s=new Set(K.crowns||[]);if(P.king)s.add(0);return[...s].filter(k=>KINGDOMS[k]);}catch(_){return[];}}
function realmOf(k){world.rule=world.rule||{};return world.rule[k]=world.rule[k]||{tax:1,happy:60,walls:0,guards:0,ev:null,log:[]};}
const realmTowns=k=>SETS.filter(s=>{try{return kOf(s.id)===k;}catch(_){return false;}});
const TAXN=["None","Low","Fair","Heavy"];
function rulerDaily(){for(const k of rulerRealms()){const R=realmOf(k),towns=realmTowns(k).filter(s=>!(world.sets[s.id]&&world.sets[s.id].ruin));
  const inc=towns.length*R.tax*12,up=R.walls*8+R.guards*10;P.gold+=inc;if(P.gold>=up)P.gold-=up;else{R.walls=Math.max(0,R.walls-1);R.guards=Math.max(0,R.guards-1);toast(`♛ ${KINGDOMS[k].name}: the treasury can't pay upkeep — defenses cut.`);}
  R.happy=Math.max(0,Math.min(100,R.happy+(2-R.tax*1.5)+(R.guards>=3?-0.5:0)+(R.walls?0.3:0)));R.lastInc=inc;R.lastUp=up;
  for(const s of towns)for(const n of npcs)if(n.alive&&n.s===s.id&&R.tax>=3&&Math.random()<0.1)n.friend=Math.max(0,n.friend-1);
  if(!R.ev){if(R.happy<25&&Math.random()<0.5)R.ev={t:"rebellion",day:world.day};else if(Math.random()<0.08)R.ev={t:"famine",day:world.day};
    if(R.ev){const msg=R.ev.t==="rebellion"?`Rebellion brews in ${KINGDOMS[k].name}! Open the Ruler tab.`:`Famine in ${KINGDOMS[k].name}! The people beg for relief.`;toast("♛ "+msg);try{addNews(-1,msg);jAdd(msg,"event");}catch(_){}}}}}
{const _dt=dailyTick;dailyTick=function(){_dt.apply(this,arguments);try{rulerDaily();}catch(e){console.warn(e);}};}
function resolveEvent(k,choice){const R=realmOf(k);if(!R.ev)return false;const name=KINGDOMS[k].name;let msg="";
  if(R.ev.t==="famine"){if(choice==="relief"){if(P.gold<150){toast("Relief costs 150g.");return false;}P.gold-=150;R.happy=Math.min(100,R.happy+15);msg=`I sent grain to the hungry of ${name}. They cheer my name.`;}
    else{R.happy=Math.max(0,R.happy-15);msg=`I let the famine in ${name} run its course. The people won't forget.`;}}
  else if(R.ev.t==="rebellion"){if(choice==="negotiate"){R.tax=0;R.happy=Math.min(100,R.happy+20);msg=`I met the rebels of ${name} and abolished taxes for now. Peace returns.`;}
    else{if(R.guards<2){R.happy=Math.max(0,R.happy-10);msg=`I tried to crush the rebels of ${name} without enough guards. It only made things worse.`;R.ev=null;R.log.unshift(msg);toast(msg);return true;}
      R.happy=Math.max(0,R.happy-10);P.infamy=(P.infamy||0)+5;msg=`My guards scattered the rebels of ${name}. Order, but at a cost.`;}}
  R.ev=null;R.log.unshift(msg);R.log.length=Math.min(R.log.length,8);toast("♛ "+msg);try{jAdd(msg,"event");}catch(_){}return true;}
// raid defense: walls & guards repel or shrink raids on ruled towns
function raidDefense(ws){const k=kOf(ws.id);if(!rulerRealms().includes(k))return;const R=realmOf(k);if(!ws.raid||ws.raid.rchk)return;ws.raid.rchk=1;
  const p=Math.min(0.75,R.walls*0.09+R.guards*0.06);if(Math.random()<p){ws.raid=null;const m=`The royal walls and guards of ${SETS[ws.id].name} repelled a raid!`;addNews(ws.id,m);toast("🛡 "+m);return;}ws.raid.n=Math.max(1,(ws.raid.n||5)-R.guards);}
{const _ht=hourlyTick;hourlyTick=function(){_ht.apply(this,arguments);try{for(const ws of world.sets)if(ws.raid&&!ws.raid.spawned)raidDefense(ws);}catch(_){}};}
{const _st=spawnTick;spawnTick=function(){try{for(const ws of world.sets)if(ws.raid&&!ws.raid.spawned&&!ws.raid.rchk)raidDefense(ws);}catch(_){}return _st.apply(this,arguments);};}
function bar(v){const n=Math.round(v/10);return"█".repeat(n)+"░".repeat(10-n);}
function rulerMenu(k){const L=rulerRealms();if(!L.length){showMenu("♛ Ruler","You hold no throne yet.",[{l:"Close"}]);return;}if(k==null||!L.includes(k))k=L[0];const R=realmOf(k),T=realmTowns(k);
  const ev=R.ev?(R.ev.t==="famine"?"⚠ FAMINE — the granaries are empty.":"⚠ REBELLION — angry crowds gather."):"No crisis.";
  const txt=`${KINGDOMS[k].name} · ${T.length} towns\nHappiness ${bar(R.happy)} ${Math.round(R.happy)}\nTaxes: ${TAXN[R.tax]} (+${T.length*R.tax*12}g/day)\nWalls: ${R.walls}/5 · Guards: ${R.guards}/5 (upkeep ${R.walls*8+R.guards*10}g/day)\nRaid defense: ${Math.round(Math.min(0.75,R.walls*0.09+R.guards*0.06)*100)}%\n\n${ev}${R.log.length?"\n\nRecent: "+R.log.slice(0,3).join(" · "):""}`;
  const set=(f)=>()=>{f();rulerMenu(k);};const b=[];
  if(R.ev&&R.ev.t==="famine")b.push({l:"🌾 Send relief (150g)",f:()=>{resolveEvent(k,"relief");rulerMenu(k);}},{l:"Ignore",f:()=>{resolveEvent(k,"ignore");rulerMenu(k);}});
  if(R.ev&&R.ev.t==="rebellion")b.push({l:"🤝 Negotiate",f:()=>{resolveEvent(k,"negotiate");rulerMenu(k);}},{l:"⚔ Crush it",f:()=>{resolveEvent(k,"crush");rulerMenu(k);}});
  b.push({l:"Tax −",f:set(()=>R.tax=Math.max(0,R.tax-1))},{l:"Tax +",f:set(()=>R.tax=Math.min(3,R.tax+1))},{l:"🧱 Walls +",f:set(()=>R.walls=Math.min(5,R.walls+1))},{l:"Walls −",f:set(()=>R.walls=Math.max(0,R.walls-1))},{l:"🛡 Guards +",f:set(()=>R.guards=Math.min(5,R.guards+1))},{l:"Guards −",f:set(()=>R.guards=Math.max(0,R.guards-1))});
  if(L.length>1)b.push({l:"Next realm ▶",f:()=>rulerMenu(L[(L.indexOf(k)+1)%L.length])});b.push({l:"Close",f:closeMenu});showMenu("♛ Ruler — "+KINGDOMS[k].name,txt,b);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world&&rulerRealms().length){const any=rulerRealms().some(k=>realmOf(k).ev);b=[{l:any?"♛ Ruler ⚠":"♛ Ruler",f:()=>rulerMenu()}].concat(b);}}catch(_){}return _sm.call(this,t,x,b);};}
