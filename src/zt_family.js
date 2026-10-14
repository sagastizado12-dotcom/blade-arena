// ===== MARRIED LIFE: WIVES AT HOME, SEVERAL WIVES, PREGNANCY & CHILDREN =====
const wives=()=>{if(!P)return[];P.wives=P.wives||(P.spouse?[P.spouse]:[]);if(P.spouse&&!P.wives.includes(P.spouse))P.wives.unshift(P.spouse);return P.wives.map(id=>npcs.find(n=>n.id===id)).filter(n=>n&&n.alive);};
const isWife=n=>!!n&&wives().includes(n);
function primaryHome(){const h=P.homes||[];return P.house>=0&&h.includes(P.house)?P.house:h.length?h[0]:-1;}
function settleWife(n){const ph=primaryHome();if(n.wifeHome==null||!(P.homes||[]).includes(n.wifeHome))n.wifeHome=ph>=0?ph:null;
  if(n.wifeHome!=null){n.ownHome=n.ownHome??n.home;n.home=n.wifeHome;}else if(n.ownHome!=null)n.home=n.ownHome;return n.wifeHome;}
function assignWifeHome(n,bid){n.wifeHome=bid;settleWife(n);saveGame&&saveGame();}
// marry more than one: each needs In Love (aff >= 80) + confession + ring
{const _pr=propose;propose=function(n){if(isWife(n))return"You're already married to her.";if(!(n.age>=18)||n.role==="child")return"That isn't possible.";
  if(P.spouse&&(n.aff||0)<80)return`"I... I'm not there yet."`;const keep=P.spouse;if(keep)P.spouse=0;let r;try{r=_pr(n);}finally{if(keep&&P.spouse===n.id){P.spouse=keep;}else if(keep&&!P.spouse)P.spouse=keep;}
  if(n.spouse===-1){wives();if(!P.wives.includes(n.id))P.wives.push(n.id);settleWife(n);
    if(n.wifeHome==null)r+=" (You don't own a home yet, so she stays at her own house. Buy one at any shop's Real Estate board!)";
    else r+=` She moves into ${homeName(n.wifeHome)}.`;}
  return r;};}
function homeName(bid){const b=buildings[bid];return b?(b.cabin?b.cabinName+" cabin":"your house in "+SETS[b.s].name):"her house";}
// propose button for extra wives
{const _rt=romanceTalk;romanceTalk=function(n,msg){if(!P.spouse||isWife(n)||!n.confessed||!P.dating.includes(n.id))return _rt(n,msg);
  const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;if(Array.isArray(b)&&!b.some(q=>/Propose/.test(q.l))){b=b.slice();b.splice(Math.max(0,b.length-2),0,{l:"💍 Propose",f:()=>showMenu(n.name,propose(n),[{l:"OK"}])});}return sm(t,x,b);};try{return _rt(n,msg);}finally{showMenu=sm;}};}
// daily routine: keep the day job, home around 19:00, inside at night
{const _nt=npcTarget;npcTarget=function(n){if(n.spouse===-1&&isWife(n)){settleWife(n);const h=hour();if(n.wifeHome!=null&&(h>=19||h<7)){const b=buildings[n.wifeHome];if(b)return{...doorOf(b),inside:true,b:n.wifeHome};}}return _nt(n);};}
const HOME_ACTS=["is cooking a stew","is curled up reading","is sitting by the hearth","is mending a shirt","is setting the table"];
{const _eb=enterBuilding;enterBuilding=function(b){const r=_eb.apply(this,arguments);try{const here=wives().filter(w=>w.wifeHome===b.id);if(here.length&&(hour()>=19||hour()<7)){
  toast(here.map((w,i)=>`${w.name} ${HOME_ACTS[(w.id+world.day+i)%HOME_ACTS.length]}. "Welcome home!"`).join(" "));}}catch(_){}return r;};}
// sleeping at home with a wife: well rested + chance of pregnancy (fade to black only)
let lastPregRoll=null;
function pregRoll(b,force){const here=wives().filter(w=>w.wifeHome===b.id&&!w.preg);for(const w of here){
  const kids=npcs.filter(k=>k.alive&&k.parents&&k.parents.includes(w.id)&&k.heroKid&&isKid(k)).length;if(kids>=4)continue;
  if(force||Math.random()<0.25){w.preg={due:world.day+10,since:world.day};addNews(w.s,`Happy news: ${w.name} is expecting a baby!`);toast(`${w.name} shares happy news — a baby is on the way!`);return w;}}return null;}
{const _sl=sleep;sleep=function(b){const withWife=b&&wives().some(w=>w.wifeHome===b.id);_sl(b);if(!withWife)return;setTimeout(()=>{P.rested=world.day+1;toast("💤 Well rested! (less damage taken today)");lastPregRoll=pregRoll(b);},(window.__FAST?60:1650));};}
{const _hh=hurtHero;hurtHero=function(d,...a){if(P&&P.rested>=world.day&&typeof d==="number")d=d*0.85;return _hh(d,...a);};}
function familyBirths(){for(const w of wives())if(w.preg&&world.day>=w.preg.due){w.preg=null;const kid=babyFor(w,null);kid.parents=[w.id,-1];kid.heroKid=true;kid.home=w.home;kid.spouse=0;kid.partner=0;
  P.kids=P.kids||[];P.kids.push(kid.id);addNews(w.s,`${w.name} and the wanderer welcomed a baby, little ${kid.name}!`);toast(`👶 ${w.name} gave birth to little ${kid.name}!`);}}
{const _ht=hourlyTick;hourlyTick=function(){_ht.apply(this,arguments);if(world&&hour()===8)familyBirths();};}
// modest maternity look (a slightly rounder dress)
{const _d=drawNpc;drawNpc=function(n){_d(n);if(!n.preg||n.inside)return;const c=(n.lookObj&&n.lookObj.cloth)||"#c86a8a";ctx.save();ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(n.x+8+(n.dir===1?-1:n.dir===2?1:0),n.y+14,4,3,0,0,7);ctx.fill();ctx.restore();};}
// hearts on the map at homes where wives live
function drawFamilyMap(g,P2,txt,z){const seen=new Set();for(const w of wives()){if(w.wifeHome==null||seen.has(w.wifeHome))continue;seen.add(w.wifeHome);const b=buildings[w.wifeHome];if(!b)continue;const [x,y]=P2(b.x+b.w/2,b.y+b.h/2);txt("❤",x+10,y-8,"#ff5a8a",12);}}
// light jealousy flavour
{const _tk=talk;talk=function(n){if(isWife(n)&&wives().length>1&&Math.random()<0.3){const o=wives().find(w=>w!==n);setTimeout(()=>say(n,pick([`Spending time with ${o.name} again, hm?`,`Don't forget about me, dear.`,`${o.name} got flowers last week... just saying.`]),160),50);}return _tk(n);};}
// Family tab in the Friends menu
function familyMenu(){const W=wives();const kids=npcs.filter(k=>k.alive&&k.heroKid);
  const lines=W.map(w=>`💍 ${w.name} — lives at ${w.wifeHome!=null?homeName(w.wifeHome):"her own house (buy a home!)"}${w.preg?` · expecting (due day ${w.preg.due})`:""}`).concat(kids.map(k=>`👶 ${k.name}, age ${k.age} — child of ${(npcs.find(m=>m.id===k.parents[0])||{}).name||"?"}`));
  const btns=W.filter(()=>(P.homes||[]).length>1).map(w=>({l:`🏠 Move ${w.name} to…`,f:()=>showMenu("Choose a home",`Where should ${w.name} live?`,P.homes.map(h=>({l:homeName(h)+(w.wifeHome===h?" ✓":""),f:()=>{assignWifeHome(w,h);familyMenu();}})).concat([{l:"Back",f:familyMenu}]))}));
  showMenu("👪 Family",lines.length?lines.join("\n"):"No family yet. Win a heart, confess, and propose with a ring.",btns.concat([{l:"🤝 Friends",f:friendsMenu},{l:"Close"}]));}
{const _fm=friendsMenu;friendsMenu=function(){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;if(Array.isArray(b)){b=b.slice();b.unshift({l:"👪 Family",f:familyMenu});}return sm(t,x,b);};try{return _fm();}finally{showMenu=sm;}};}
// long commutes: by 21:00 a wife has reached her home even if the walk was long or the gates shut
let wcT=0;{const _u=update;update=function(){_u();if(!world||(++wcT)%30)return;const h=hour();if(!(h>=21||h<6))return;for(const w of wives()){if(w.wifeHome==null||w.inside)continue;const b=buildings[w.wifeHome];if(!b)continue;const d=doorOf(b);
  if(Math.hypot(w.x-d.x,w.y-d.y)>3*TILE&&(h>=22||h<6||Math.hypot(w.x-hero.x,w.y-hero.y)>140)){w.x=d.x;w.y=d.y;}if(Math.hypot(w.x-d.x,w.y-d.y)<=3*TILE){w.inside=true;w.at=w.wifeHome;w.x=d.x;w.y=d.y;}}};}
function nightHome(n){if(!world||n.wifeHome==null||!isWife(n))return false;const h=hour();return h>=19||h<7;}
// quest turn-in works whichever conversation path the giver uses (romance talk included)
{const _tk2=talk;talk=function(n){try{if(n&&(P.jobs||[]).some(j=>j.giver===n.id))tryCompleteJobs(n.s,n);}catch(_){}return _tk2(n);};}
