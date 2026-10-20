// ===== v48 LEGACY & DESCENDANTS: grandchildren, careers (some become adventurers/knights), training, they fight beside you,
// family tree, descendants as regents, statues of past wives and Seekers =====
const isDesc=n=>!!n&&(n.heroKid||(n.parents||[]).some(id=>{const p=npcs.find(m=>m.id===id);return p&&(p.heroKid||p.desc);}));
function markDesc(){let c=0;for(let pass=0;pass<4;pass++)for(const n of npcs)if(!n.desc&&!n.heroKid&&(n.parents||[]).some(id=>{const p=npcs.find(m=>m.id===id);return p&&(p.heroKid||p.desc);})){n.desc=true;c++;}return c;}
const descendants=()=>npcs.filter(n=>n.alive&&(n.heroKid||n.desc));
const genOf=n=>{let g=1,cur=n;for(let i=0;i<8&&cur&&!cur.heroKid;i++){const p=(cur.parents||[]).map(id=>npcs.find(m=>m.id===id)).find(m=>m&&(m.heroKid||m.desc));cur=p;g++;}return g;};
const GEN_NAME=["","child","grandchild","great-grandchild","great-great-grandchild"];
// careers when they come of age
function career48(n){if(n.career||(n.age||0)<18||n.role==="child")return;const h=(n.id*7919)%100;n.career=h<20?"knight":h<35?"adventurer":"town";
  if(n.career==="knight"){n.role="guard";n.job="knight";n.title=(isWoman(n)?"Dame ":"Sir ");}else if(n.career==="adventurer"){n.job="adventurer";n.advLike=true;}
  n.trainLv=n.trainLv||(n.career==="town"?0:1);try{jAdd(`${n.name}, my ${GEN_NAME[genOf(n)]||"descendant"}, became ${n.career==="knight"?"a knight":n.career==="adventurer"?"an adventurer":"a "+(n.job||n.role)}.`,"family");}catch(_){}}
function legacyTick(){markDesc();for(const n of descendants())career48(n);}
// training + fighting beside the hero
function train48(n){if(!n||!n.alive)return false;n.trainLv=Math.min(10,(n.trainLv||0)+1);if(n.career==="town"&&n.trainLv>=2){n.career="adventurer";n.job="adventurer";}
  try{world.min+=60;}catch(_){}toast(`⚔ You spar with ${n.name}. Skill ${n.trainLv}/10.`);try{jAdd(`I trained ${n.name} with the sword (skill ${n.trainLv}).`,"family");}catch(_){}return true;}
const KN=()=>{P.knights=P.knights||[];return P.knights;};
function callToArms(n,on){if(on===undefined)on=!KN().includes(n.id);P.knights=KN().filter(i=>i!==n.id);if(on){if(KN().length>=3){toast("Three descendants at most fight beside you.");return false;}if((n.trainLv||0)<1){toast(`${n.name} needs training first.`);return false;}P.knights.push(n.id);n.inside=false;n.x=hero.x-16;n.y=hero.y+8;toast(`${n.name} draws steel and follows you!`);}else toast(`${n.name} returns home.`);return true;}
const knightFollowers=()=>KN().map(id=>npcs.find(n=>n.id===id&&n.alive)).filter(Boolean);
{const _up=update;update=function(){_up.apply(this,arguments);try{if(!hero||state!=="play"||room||paused)return;knightFollowers().forEach((k,i)=>{k.inside=false;
  const tx=hero.x+[-20,20,0][i],ty=hero.y+[12,12,24][i];let d=Math.hypot(tx-k.x,ty-k.y);if(d>400){k.x=tx;k.y=ty;d=0;}
  let tgt=null,td=150;for(const e of mobs){if(e.dead||e.pet||e.def&&e.def.beh==="pea")continue;const ed=Math.hypot(e.x-k.x,e.y-k.y);if(ed<td){td=ed;tgt=e;}}
  const gx=tgt?tgt.x:tx,gy=tgt?tgt.y:ty,gd=Math.hypot(gx-k.x,gy-k.y);if(gd>(tgt?26:6)){const v=Math.min(gd,1.5);k.x+=(gx-k.x)/gd*v;k.y+=(gy-k.y)/gd*v;k.dir=Math.abs(gx-k.x)>Math.abs(gy-k.y)?(gx>k.x?2:1):(gy>k.y?0:3);k.anim=(k.anim||0)+1;k.frame=(k.anim>>3)%3;}
  k.atkCd=(k.atkCd||0)-1;if(tgt&&td<44&&k.atkCd<=0){k.atkCd=40;hurtEnemy(tgt,1+(k.trainLv||1)*0.5,Math.atan2(tgt.y-k.y,tgt.x-k.x));}});}catch(e){}};}
{const _un=updateNpc;updateNpc=function(n){if(n&&P&&(P.knights||[]).includes(n.id))return;return _un.apply(this,arguments);};}
// family tree screen
function familyTree(){markDesc();const lines=["🧍 You — the ageless hero"];const W=npcs.filter(n=>(P.wives||[]).includes(n.id)||n.formerWife);
  const kidsOf=p=>npcs.filter(k=>(k.parents||[]).includes(p.id)&&(k.heroKid||k.desc));const seen=new Set();
  const row=(n,d)=>{if(seen.has(n.id)||d>5)return;seen.add(n.id);const tag=n.career==="knight"?" ⚔ knight":n.career==="adventurer"?" 🗡 adventurer":n.job?" · "+n.job:"";
    lines.push(`${"   ".repeat(d)}${n.alive?"└":"✝"} ${n.title||""}${n.name}${/, \d+$/.test(n.name)?"":", "+n.age}${tag}${n.trainLv?` (skill ${n.trainLv})`:""}${(P.knights||[]).includes(n.id)?" · with you":""}`);for(const k of kidsOf(n))row(k,d+1);};
  const wifeIds=new Set((P.wives||[]).concat(npcs.filter(n=>n.heroKid).flatMap(k=>k.parents||[])));
  for(const id of wifeIds){if(id===-1)continue;const w=npcs.find(n=>n.id===id);if(!w)continue;lines.push(` 💍 ${w.name}${w.alive?"":" ✝"}`);for(const k of npcs.filter(k=>k.heroKid&&(k.parents||[]).includes(w.id)))row(k,1);}
  for(const k of npcs.filter(k=>k.heroKid&&!seen.has(k.id)))row(k,1);
  const D=descendants();const B=D.filter(n=>n.age>=16).slice(0,6).map(n=>({l:`${n.name} (${GEN_NAME[genOf(n)]||"descendant"})…`,f:()=>descMenu(n)}));B.push({l:"Back",f:()=>familyMenu()});
  showMenu("🌳 Family tree",lines.join("\n")+`\n\nLiving descendants: ${D.length} · generations: ${D.reduce((m,n)=>Math.max(m,genOf(n)),0)}`,B);}
function descMenu(n){const on=(P.knights||[]).includes(n.id);showMenu(`${n.title||""}${n.name}`,`Your ${GEN_NAME[genOf(n)]||"descendant"}, ${n.age}. ${n.career==="knight"?"A knight of the realm.":n.career==="adventurer"?"An adventurer.":"Works as "+(n.job||n.role)+"."} Skill ${n.trainLv||0}/10.`,
  [{l:"⚔ Train together (1 hour)",f:()=>{train48(n);descMenu(n);}},{l:on?"🏠 Send home":"📯 Fight beside me",f:()=>{callToArms(n);closeMenu();}},{l:"Back",f:familyTree}]);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(/Family/.test(t)&&Array.isArray(b)&&!b.some(o=>o&&o._tree)&&world)b=[{_tree:1,l:"🌳 Family tree",f:familyTree}].concat(b);
  const n=typeof talkFocus!=="undefined"?talkFocus:null;if(n&&isDesc(n)&&n.age>=16&&Array.isArray(b)&&typeof t==="string"&&t.includes(n.name)&&!b.some(o=>o&&o._tr))b=[{_tr:1,l:"⚔ Train",f:()=>{train48(n);}},{_tr:1,l:(P.knights||[]).includes(n.id)?"🏠 Go home":"📯 Fight beside me",f:()=>{callToArms(n);closeMenu();}}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
// descendants as regents of abdicated realms
{const _pr=pickRegent;pickRegent=function(k){try{const D=descendants().filter(n=>n.age>=25&&!n.adv);if(D.length){const n=D.sort((a,b)=>(b.trainLv||0)-(a.trainLv||0)||b.age-a.age)[0];return{name:n.name,id:n.id,title:(isWoman(n)?"Lady":"Lord")+" Regent"};}}catch(_){}return _pr.apply(this,arguments);};}
// statues & memorials: past wives (in their town) and past Seekers (in the capital)
function memorials(){const out=[];try{for(const m of LV().memory)if(m.rel==="wife")out.push({s:m.s,name:m.name,k:"wife",sx:"F"});}catch(_){}try{for(const e of SK().log)if(e.died)out.push({s:KINGDOMS[0].cap,name:e.name,k:"seeker",sx:"F"});}catch(_){}return out;}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{const M=memorials();const per={};for(const m of M){const S=SETS[m.s];if(!S)continue;const i=per[m.s]=(per[m.s]||0)+1;const a=i*1.3,R=8;
  const px=(S.x+Math.cos(a)*R)*16,py=(S.y+Math.sin(a)*R*0.6+5)*16;if(!vis(px,py,40))continue;
  list.push({y:py+14,f:()=>{ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(px+8,py+14,10,3,0,0,7);ctx.fill();ctx.fillStyle="#b8b4ac";ctx.fillRect(px-1,py+2,18,12);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(px-1,py+2,18,12);
    ctx.fillStyle="#d8d4cc";ctx.beginPath();ctx.arc(px+8,py-14,4.5,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(px+2,py+2);ctx.lineTo(px+4,py-9);ctx.lineTo(px+12,py-9);ctx.lineTo(px+14,py+2);ctx.closePath();ctx.fill();ctx.stroke();
    if(m.k==="seeker"){ctx.strokeStyle="#8a8680";ctx.beginPath();ctx.moveTo(px+14,py-12);ctx.lineTo(px+15,py+2);ctx.stroke();}else{ctx.fillStyle="#e86a8a";ctx.fillRect(px+3,py+11,3,2);ctx.fillRect(px+10,py+11,3,2);}
    ctx.fillStyle="#3a3630";ctx.font="bold 4px system-ui";ctx.textAlign="center";ctx.fillText(m.name.replace(/ \([MF]\)/,"").slice(0,10),px+8,py+9);}});}}catch(_){}};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{legacyTick();}catch(_){}return r;};}
{const _ay=awayYears;awayYears=function(y){const r=_ay.apply(this,arguments);try{legacyTick();P.knights=[];}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r)legacyTick();}catch(_){}return r;};}
