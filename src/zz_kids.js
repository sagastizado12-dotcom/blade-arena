// ===== v26 KIDS GROW UP on the calendar: baby (0-2) → child (3-12) → teen (13-17) → adult (18+). 1 year = 28 game days =====
const kidStage=n=>{const a=n.age||0;return a<3?"baby":a<13?"child":a<18?"teen":"adult";};
const STAGE_IC={baby:"🍼",child:"🧒",teen:"🧑",adult:"⭐"};
const heroKids=()=>npcs.filter(k=>k.alive&&k.heroKid);
// babies stay safe at home
{const _nt=npcTarget;npcTarget=function(n){if(n&&n.heroKid&&kidStage(n)==="baby"){const b=buildings[n.home];if(b){const d=doorOf(b);return{x:d.x,y:d.y,inside:true};}}return _nt(n);};}
// grown hero-kids: the family home stays the hero's — no deed ever transfers
{const _fd=familyDay;familyDay=function(){const before=new Map(heroKids().map(k=>[k.id,kidStage(k)]));const homes=(P.homes||[]).slice(),house=P.house;const r=_fd.apply(this,arguments);
  P.homes=Array.from(new Set(homes.concat(P.homes||[])));if(house!=null)P.house=house;
  for(const k of heroKids()){const st=kidStage(k),was=before.get(k.id);if(was&&was!==st){const msg={child:`${k.name} took their first steps out of the cradle.`,teen:`${k.name} is a teenager now — old enough to learn spells, join my hunts, or take a job.`,adult:`${k.name} has grown up! My child is an adult now.`}[st];
    if(msg){toast(`${STAGE_IC[st]} ${msg}`);try{jAdd(msg,"family");}catch(_){}}if(st==="adult"){k.teenHunt=false;P.teenHunt=(P.teenHunt||[]).filter(i=>i!==k.id);}}
    if(st==="teen"&&k.job&&world.day!==k.jobPaid){k.jobPaid=world.day;P.gold+=k.jobPay||6;}}
  return r;};}
// teens: jobs, spells, hunting with me
const TEEN_JOBS=[["apprentice smith",8],["guild runner",7],["fisher's helper",6],["farmhand",5],["tavern helper",6]];
function teenJob(k){if(kidStage(k)!=="teen")return;const [j,pay]=TEEN_JOBS[(k.id+world.day)%TEEN_JOBS.length];k.job=j;k.jobPay=pay;toast(`${k.name} now works as a ${j} (+${pay}g a day for the family).`);try{jAdd(`${k.name} took a job as a ${j}.`,"family");}catch(_){}}
function teenSpell(k){if(kidStage(k)!=="teen")return;const known=(SPELL_ORDER||[]).filter(s=>P.spells?P.spells.includes(s):true);k.spells=k.spells||[];const next=known.find(s=>!k.spells.includes(s));if(!next){toast(`${k.name} already knows every spell you can teach.`);return;}
  k.spells.push(next);toast(`📚 You taught ${k.name} ${SPELLS&&SPELLS[next]?SPELLS[next].name||next:next}!`);try{jAdd(`I taught ${k.name} the ${next} spell.`,"family");}catch(_){}}
function teenHunt(k,on){if(kidStage(k)!=="teen")return;P.teenHunt=P.teenHunt||[];if(on===undefined)on=!P.teenHunt.includes(k.id);P.teenHunt=P.teenHunt.filter(i=>i!==k.id);if(on){if(P.teenHunt.length>=2){toast("Two teens at most on a hunt.");return;}P.teenHunt.push(k.id);k.x=hero.x-14;k.y=hero.y+6;k.inside=false;toast(`${k.name} grabs a practice sword and follows you!`);}else toast(`${k.name} heads home.`);}
const teenFollowers=()=>(P&&P.teenHunt||[]).map(id=>npcs.find(n=>n.id===id&&n.alive&&kidStage(n)==="teen")).filter(Boolean);
{const _up=update;update=function(){_up.apply(this,arguments);try{if(!hero||state!=="play"||room||paused)return;teenFollowers().forEach((k,i)=>{k.inside=false;
  const tx=hero.x+(i?16:-16),ty=hero.y+10;let d=Math.hypot(tx-k.x,ty-k.y);if(d>400){k.x=tx;k.y=ty;d=0;}
  let tgt=null,td=120;for(const e of mobs){if(e.dead||e.def&&e.def.beh==="pea")continue;const ed=Math.hypot(e.x-k.x,e.y-k.y);if(ed<td){td=ed;tgt=e;}}
  const gx=tgt?tgt.x:tx,gy=tgt?tgt.y:ty,gd=Math.hypot(gx-k.x,gy-k.y);if(gd>(tgt?30:6)){const v=Math.min(gd,1.3);k.x+=(gx-k.x)/gd*v;k.y+=(gy-k.y)/gd*v;k.dir=Math.abs(gx-k.x)>Math.abs(gy-k.y)?(gx>k.x?2:1):(gy>k.y?0:3);}
  k.atkCd=(k.atkCd||0)-1;if(tgt&&td<48&&k.atkCd<=0){k.atkCd=50;const dmg=1+((k.spells||[]).length?1:0);hurtEnemy(tgt,dmg,Math.atan2(tgt.y-k.y,tgt.x-k.x));if((k.spells||[]).length&&typeof spray==="function")for(let q=0;q<6;q++)spray(tgt.x+6,tgt.y+5,2,Math.random()*7,1);}});}catch(e){window.__kerr=String(e);}};}
// teens following me are not "updated" by town AI (they'd wander home)
{const _un=updateNpc;updateNpc=function(n){if(n&&P&&(P.teenHunt||[]).includes(n.id)&&kidStage(n)==="teen")return;return _un.apply(this,arguments);};}
// optional: let an adult child live in one of my houses (deed stays mine)
function letLive(k,bid){k.home=bid;k.livesInHeroHome=true;toast(`${k.name} moves into ${homeName(bid)}. The deed stays in your name.`);try{jAdd(`I let ${k.name} live in ${homeName(bid)}.`,"family");}catch(_){}}
// Family tab: stages + actions
{const _fm=familyMenu;familyMenu=function(){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;try{const K=heroKids();if(K.length){x=(x||"").split("\n").filter(l=>!/^👶/.test(l)).join("\n").trim()+"\n\n"+K.map(k=>`${STAGE_IC[kidStage(k)]} ${k.name}, ${k.age} — ${kidStage(k)}${k.job?` · ${k.job}`:""}${(k.spells||[]).length?` · spells: ${k.spells.join(", ")}`:""}${(P.teenHunt||[]).includes(k.id)?" · hunting with you":""}`).join("\n");
    b=(b||[]).slice();for(const k of K){if(kidStage(k)==="teen")b.unshift({l:`🧑 ${k.name}…`,f:()=>showMenu(`${k.name} (teen)`,"What should they do?",[{l:"📚 Teach a spell",f:()=>{teenSpell(k);familyMenu();}},{l:(P.teenHunt||[]).includes(k.id)?"🏠 Send home":"🗡 Join my hunt",f:()=>{teenHunt(k);closeMenu();}},{l:k.job?`🔨 New job (now ${k.job})`:"🔨 Find a job",f:()=>{teenJob(k);familyMenu();}},{l:"Back",f:familyMenu}])});
      if(kidStage(k)==="adult"&&(P.homes||[]).length)b.unshift({l:`🏡 Let ${k.name} live in…`,f:()=>showMenu("Which house?",`${k.name} can live there; you keep the deed.`,(P.homes||[]).map(h=>({l:homeName(h),f:()=>{letLive(k,h);closeMenu();}})).concat([{l:"Back",f:familyMenu}]))});}}}catch(e){console.warn(e);}return sm.call(this,t,x,b);};try{return _fm.apply(this,arguments);}finally{showMenu=sm;}};}
