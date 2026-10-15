// ===== v33 NPC LIVES: aging & lifespans, respectful deaths (graves, In memory), gossip, ages on names, Ageless hero,
// per-town memory, elders who keep the secret and summon in crises, 100-year questioning =====
const LV=()=>{world.lives=world.lives||{graves:[],base:{},tmem:{},summons:[],elderLog:[],memory:[],cultY:0};return world.lives;};
const isWifeN=n=>(P.wives||[]).includes(n.id)||P.spouse===n.id;
const famOf=n=>isWifeN(n)?"wife":n.heroKid?"child":n.grandKid?"grandchild":null;
function lifeOf(n){if(n.life==null)n.life=68+Math.floor(hash2(n.id,7,909)*24);if(isWifeN(n)&&n.wedAge==null)n.wedAge=n.age;if(n.wedAge!=null)n.life=Math.max(n.life,n.wedAge+62);if(n.heroKid||n.grandKid)n.life=Math.max(n.life,80);return n.life;}
const heroYears=()=>Math.floor(world.day/YEAR_DAYS);
const cemOf=S=>({x:S.x-S.r+4,y:S.y+S.r-6});
let fades=[];
function passAway(n,quiet){if(!n.alive&&n.passed)return;n.alive=false;n.passed={day:world.day,age:n.age};const L=LV(),S=SETS[n.s],sx=sexOf(n);
  const g={id:n.id,name:n.name,sx,age:n.age,s:n.s,day:world.day,fam:famOf(n),born:world.day-n.age*YEAR_DAYS};const here=L.graves.filter(q=>q.s===n.s);g.k=here.length;L.graves.push(g);
  if(here.length>=40){const i=L.graves.findIndex(q=>q.s===n.s&&!q.fam);if(i>=0)L.graves.splice(i,1);}
  if(!quiet&&hero&&Math.hypot(n.x-hero.x,n.y-hero.y)<260&&!n.inside)fades.push({x:n.x,y:n.y,t:120,name:n.name});
  const f=g.fam;if(f){L.memory.push({id:n.id,name:n.name,sx,age:n.age,rel:f,day:world.day,s:n.s});const m=`My ${f==="wife"?"beloved wife":f} ${n.name} passed away peacefully at ${n.age}. She${sx==="M"?"":""} rests in the ${S.name} cemetery.`.replace(" She rests",sx==="M"?" He rests":" She rests");jAdd(m,"family");toast("🕯 "+m);}
  else if(n.met){jAdd(`${n.name} of ${S.name} passed away at ${n.age}. I knew them once.`,"news");}
  addNews(n.s,`${n.name} of ${S.name} passed away peacefully at ${n.age}. A grave was laid in the cemetery.`);
  if(n.role==="leader")elderSucceed(n.s,n);}
function elderSucceed(sid,old){const c=npcs.filter(m=>m.alive&&m.s===sid&&m.age>=30&&m.role!=="guard"&&m.role!=="child"&&!isWifeN(m)&&!m.heroKid&&!m.adv).sort((a,b)=>b.age-a.age)[0];if(!c)return;
  c.role="leader";c.met=true;c.friend=Math.max(c.friend||0,60);c.elderSecret=true;const t=(LEADER[SETS[sid].kind]||"Elder");const m=`${c.name} became ${t} of ${SETS[sid].name}${old?` after ${old.name}`:""}. The secret of the ageless wanderer was passed on.`;
  LV().elderLog.push({d:world.day,s:sid,name:c.name,prev:old?old.name:null});jAdd(m,"news");addNews(sid,`${c.name} is the new ${t} of ${SETS[sid].name}.`);}
// yearly life: deaths, newcomers, gossip, hero's kids marry, grandkids
const GOSSIP_JOBS=["farmer","fisher","smith","farmer","woodcutter"];
function lifeYear(){const L=LV();
  for(const S of SETS){if(L.base[S.id]==null)L.base[S.id]=npcs.filter(n=>n.alive&&n.s===S.id&&!isKid(n)).length;}
  for(const n of npcs)if(n.alive&&!n.adv&&n.age>=lifeOf(n))passAway(n,true);
  for(const S of SETS){const ad=npcs.filter(n=>n.alive&&n.s===S.id&&!isKid(n));if(ad.length<L.base[S.id]*0.7&&S.bIdx&&S.bIdx.some(b=>buildings[b].kind==="house")){const n=makeNpc(S.id,pick(GOSSIP_JOBS),18+Math.floor(Math.random()*12));if(S.demon||(SETS[S.id]&&SETS[S.id].demon))n.demon=true;addNews(S.id,`${n.name} moved to ${S.name} to start a new life.`);}
    if(Math.random()<0.5)gossipEvent(S.id);}
  for(const k of npcs){if(!k.alive||!k.heroKid||k.age<18||k.spouse>0)continue;if(Math.random()>0.35)continue;const ks=sexOf(k);
    const b=npcs.find(m=>m.alive&&m.s===k.s&&!isKid(m)&&m.age>=18&&Math.abs(m.age-k.age)<=10&&!m.spouse&&!m.heroKid&&!m.grandKid&&!isWifeN(m)&&sexOf(m)!==ks&&m.role!=="leader"&&!m.adv);
    if(b){try{npcWedding(k,b);}catch(_){k.spouse=b.id;b.spouse=k.id;}const m=`My ${ks==="F"?"daughter":"son"} ${k.name} married ${b.name} in ${SETS[k.s].name}!`;jAdd(m,"family");toast("💒 "+m);}}
  markGrand();if(heroYears()>=100&&world.day/YEAR_DAYS-L.cultY>=5){L.cultY=heroYears();const S=pick(SETS.filter(s=>!s.island));addNews(S.id,`A secret cult of "the Undying Wanderer" meets by night in ${S.name}.`);}}
function markGrand(){const ids=new Set(npcs.filter(k=>k.heroKid||k.grandKid).map(k=>k.id));for(const k of npcs)if(!k.heroKid&&!k.grandKid&&k.parents&&k.parents.some(p=>ids.has(p))){k.grandKid=true;if(k.alive){const m=`A grandchild was born: little ${k.name} in ${SETS[k.s].name}.`;jAdd(m,"family");toast("👶 "+m);}}}
function gossipEvent(sid){const S=SETS[sid];const pool=npcs.filter(n=>n.alive&&n.s===sid&&!isKid(n)&&n.role!=="leader"&&n.role!=="guard"&&!isWifeN(n)&&!n.heroKid&&!n.adv&&!n.work&&!n.duelist);if(pool.length<2)return;const a=pick(pool);let msg;const r=Math.random();
  if(r<0.25&&!a.spouse&&!a.partner){const to=pick(SETS.filter(t=>t.id!==sid&&!t.island&&!!t.demon===!!S.demon&&t.bIdx&&t.bIdx.some(b=>buildings[b].kind==="house")));if(!to)return;const hs=to.bIdx.filter(b=>buildings[b].kind==="house");a.s=to.id;a.home=pick(hs);const d=doorOf(buildings[a.home]);a.x=d.x;a.y=d.y;msg=`${a.name} packed up and moved from ${S.name} to ${to.name}.`;}
  else if(r<0.5&&GOSSIP_JOBS.includes(a.role)){const j=pick(GOSSIP_JOBS.filter(x=>x!==a.role));msg=`${a.name} of ${S.name} gave up being a ${a.role} and became a ${j}.`;a.role=j;}
  else{const b=pick(pool.filter(x=>x!==a));a.rel=a.rel||{};b.rel=b.rel||{};if(Math.random()<0.6){a.rel[b.id]=b.rel[a.id]=95;msg=`${a.name} and ${b.name} of ${S.name} have become fast friends.`;}else{a.rel[b.id]=b.rel[a.id]=5;msg=`${a.name} and ${b.name} of ${S.name} are feuding over a fence.`;}}
  addNews(sid,msg);if(typeof curSet!=="undefined"&&curSet&&curSet.id===sid)toast("💬 Gossip: "+msg);}
// hooks: yearly in play, per-year when away; bury anyone who died by other means
{const _dt=dailyTick;dailyTick=function(){_dt.apply(this,arguments);try{if(world.day%YEAR_DAYS===0)lifeYear();for(const n of npcs)if(!n.alive&&!n.slain&&!n.passed&&!n.adv&&n.name)passAway(n,true);}catch(e){console.warn(e);}};}
{const _ay=awayYears;awayYears=function(y){for(let i=0;i<y;i++){_ay(1);try{lifeYear();}catch(e){console.warn(e);}}};}
// per-town memory: last visit; after ~25 years and nobody left who knew him -> stranger again
let lastTownMem=-1;
{const _u=update;update=function(){_u.apply(this,arguments);try{if(!hero||state!=="play"||room||frameN%60)return;const S=settlementAt(hero.x,hero.y);if(!S)return;const L=LV(),tm=L.tmem[S.id];
  if(lastTownMem!==S.id){lastTownMem=S.id;if(tm&&(world.day-tm.last)/YEAR_DAYS>=25&&!npcs.some(n=>n.alive&&n.s===S.id&&n.met&&n.role!=="leader"))forgetHero(S.id);townArrive(S.id);}
  L.tmem[S.id]={last:world.day};}catch(_){}};}
function forgetHero(sid){const ws=world.sets[sid];for(const n of npcs)if(n.s===sid&&n.role!=="leader"){n.met=false;n.friend=Math.min(n.friend||0,5);n.bond=0;}ws.angryUntil=0;ws.bounty=0;if(ws.rep!=null)ws.rep=0;ws.forgot=world.day;
  toast(`Nobody in ${SETS[sid].name} remembers you anymore.`);jAdd(`${SETS[sid].name} has forgotten me. Everyone who knew me is gone; only the ${LEADER[SETS[sid].kind]||"elder"} still keeps my secret.`,"news");}
// elders: crisis summons
function crisisAt(sid){const ws=world.sets[sid];if(ws.raid)return"raid";try{const W=WEV();if(W.dragon&&W.dragon.s===sid)return"dragon";if(W.plague&&W.plague.s===sid)return"plague";}catch(_){}try{const K=kState(),k=kOf(sid);if(K.war&&K.war[k])return"war";}catch(_){}if(ws.dragon)return"dragon";return null;}
{const _ht=hourlyTick;hourlyTick=function(){_ht.apply(this,arguments);try{const L=LV();L.summons=L.summons.filter(s=>world.day<=s.until);for(const S of SETS){const c=crisisAt(S.id);if(!c||L.summons.some(s=>s.s===S.id))continue;
    if(c==="war"&&Math.random()>0.05)continue;const el=npcs.find(n=>n.alive&&n.s===S.id&&n.role==="leader");if(!el)continue;L.summons.push({s:S.id,type:c,until:world.day+3,from:el.name});
    const m=`📜 A sealed letter from ${el.name}, ${LEADER[S.kind]||"Elder"} of ${S.name}: "Old friend, ${({raid:"raiders are at our gates",dragon:"a dragon darkens our sky",plague:"a plague spreads among us",war:"war is coming"})[c]}. Come quickly — you know why only you can help."`;toast(m);jAdd(m.slice(3),"news");}}catch(e){}};}
function townArrive(sid){const L=LV();const i=L.summons.findIndex(s=>s.s===sid);if(i>=0){const s=L.summons.splice(i,1)[0];toast(`${s.from} meets you quietly: "Thank you for coming, old friend."`);}}
{const _drm=drawRuinMap;drawRuinMap=function(g,P2,txt,z){_drm(g,P2,txt,z);try{for(const s of LV().summons){const S=SETS[s.s];const [x,y]=P2(S.x,S.y);txt("📜 Summons",x,y-22,"#ffe08a",11);}window.__summonMarks=LV().summons.length;}catch(_){}};}
// dialogue: elders' secret, strangers, 100-year questioning
{const _dl=dialogLines;dialogLines=function(n){const L=_dl(n);try{const y=heroYears(),ws=world.sets[n.s];
  if(n.role==="leader"){L.push(pick([`(quietly) Your secret is safe with me, as it was with every ${LEADER[SETS[n.s].kind]||"elder"} before me.`,`(lowering voice) The old ${LEADER[SETS[n.s].kind]||"elder"} told me who you really are. I'll keep it.`]));return L;}
  if(ws.forgot&&!n.met)L.unshift(pick(["Never seen you before, stranger.",y>=50?"You look like the statue in the square… odd.":"New in town?"]));
  if(y>=100){if(n.role==="guard")L.push(pick(["You match the description in the old records. I'm keeping an eye on you.","Halt… how old are you, really?"]));
    else if(Math.random()<0.4)L.push(pick(["My great-grandmother spoke of a wanderer with your face…","The scholars say a man like you walked here a century ago.","Are you… the Undying One the cult talks about?"]));}
  else if(y>=60&&Math.random()<0.3)L.push(pick(["Folk whisper you haven't aged a day.","Funny, my grandfather described you exactly."]));}catch(_){}return L;};}
// ages next to names (dialogue header, Family/Friends), Ageless hero
function ageLabel(root,title){const spans=[...root.querySelectorAll(".sx")];for(const sp of spans){if(sp.dataset.aged)continue;const prev=sp.previousSibling&&sp.previousSibling.previousSibling;const txt=prev&&prev.nodeValue||"";
  const inTitle=sp.closest("h2");if(!inTitle&&!/Family|Friends/.test(title))continue;const m=txt.match(/([A-Z][A-Za-z']+(?: [A-Z][A-Za-z']+)?)\s*$/);if(!m)continue;
  const nm=m[1];const c=npcs.filter(n=>n.name===nm||nm.endsWith(n.name));if(!c.length)continue;const n=(talkFocus&&c.includes(talkFocus))?talkFocus:c.sort((a,b)=>(b.alive-a.alive)||Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];
  sp.dataset.aged=1;sp.after(document.createTextNode(`, ${n.age}`));}}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused")x=(x||"")+"\n🧍 Hero trait: Ageless — you never grow old.";if(/Family/.test(t)){const M=LV().memory;if(M.length)x=(x||"")+"\n\n🕯 In memory:\n"+M.map(m=>`${m.name} (${m.sx}), ${m.rel} — passed at ${m.age}, ${calOf?calOf(m.day):"day "+m.day}`).join("\n");
    const g=npcs.filter(k=>k.alive&&k.grandKid);if(g.length)x+="\n\n👶 Grandchildren: "+g.map(k=>`${k.name}, ${k.age}`).join(" · ");}}catch(_){}const r=_sm.call(this,t,x,b);try{ageLabel(menuEl,t);}catch(_){}return r;};}
// graves: cemetery in each town, visit
{const _d=draw;draw=function(){_d.apply(this,arguments);try{if(!world||state!=="play"||room)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);const L=LV();
  for(const g of L.graves){const S=SETS[g.s],c=cemOf(S);const x=(c.x+(g.k%8))*TILE,y=(c.y+((g.k/8)|0)%5)*TILE;if(x<camX-20||x>camX+W+20||y<camY-20||y>camY+H+20)continue;
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(x+3,y+12,10,3);ctx.fillStyle=g.fam?"#d8d0e0":"#9a96a4";ctx.beginPath();ctx.moveTo(x+3,y+13);ctx.lineTo(x+3,y+5);ctx.arc(x+8,y+5,5,Math.PI,0);ctx.lineTo(x+13,y+13);ctx.fill();ctx.fillStyle="#6a6676";ctx.fillRect(x+7,y+5,2,6);ctx.fillRect(x+5,y+7,6,2);if(g.fam){ctx.fillStyle="#e86a8a";ctx.fillRect(x+4,y+12,2,2);ctx.fillStyle="#f4d860";ctx.fillRect(x+10,y+12,2,2);}}
  fades=fades.filter(f=>f.t-->0);for(const f of fades){ctx.globalAlpha=f.t/120;ctx.fillStyle="#fff8e0";ctx.beginPath();ctx.arc(f.x+8,f.y+4-(120-f.t)*.2,6,0,7);ctx.fill();ctx.font="8px sans-serif";ctx.fillText("🕊 "+f.name,f.x-6,f.y-12-(120-f.t)*.2);ctx.globalAlpha=1;}
  ctx.restore();}catch(_){}};}
let gravePrompt=0;
function graveNear(){const L=LV();const tx=(hero.x+6)/TILE,ty=(hero.y+8)/TILE;return L.graves.find(g=>{const c=cemOf(SETS[g.s]);return Math.abs(c.x+(g.k%8)+.5-tx)<.8&&Math.abs(c.y+(((g.k/8)|0)%5)+.5-ty)<.8;});}
function visitGrave(g){showMenu("🪦 Here lies "+g.name,`${g.name} (${g.sx}), ${g.age} years\n${g.fam?"Beloved "+g.fam+" of the wanderer.\n":""}Laid to rest ${calOf?calOf(g.day):"day "+g.day}, ${SETS[g.s].name}.`,[{l:"💐 Lay flowers",f:()=>{jAdd(`I laid flowers on ${g.name}'s grave in ${SETS[g.s].name}.`,"family");toast("You lay flowers and remember.");closeMenu();}},{l:"Leave",f:closeMenu}]);}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(!hero||state!=="play"||room||frameN<gravePrompt||frameN%10)return;const g=graveNear();if(g){gravePrompt=frameN+300;visitGrave(g);}}catch(_){}};}
