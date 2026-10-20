// ===== v46 FLIRT FIX =====
// Root cause: kids who come of age during away-time (the 100-years-per-week batch skips daily ticks) kept role "child",
// so grown women like a 24-year-old woodcutter were treated as children: no romance menu, no Flirt. Promote them, and
// put Flirt as a top-level button in every adult woman's talk window (disabled with a reason when she's married).
function growUp46(){let c=0;for(const k of npcs){if(k&&k.alive&&k.role==="child"&&k.age>=18){k.role=k.job||pick(["farmer","fisher","smith","farmer","woodcutter"]);k.grownUp=true;c++;}}return c;}
{const _ay=awayYears;awayYears=function(y){const r=_ay.apply(this,arguments);try{growUp46();}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r)growUp46();}catch(_){}return r;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{growUp46();}catch(_){}return r;};}
const heroBlood=n=>!!(n.heroKid||(n.parents&&n.parents.some(id=>id===-1||(P.wives||[]).includes(id)&&n.heroKid)));
canRomance=function(n){return !!n&&n.alive&&n.age>=18&&n.role!=="child"&&!heroBlood(n);};
const adultWoman=n=>!!n&&n.alive!==false&&(n.age||(n.adv?25:0))>=18&&n.role!=="child"&&!heroBlood(n)&&(isWoman(n)||(typeof sexOf==="function"&&sexOf(n)==="F"))&&!n.demonLord;
function flirtNow(n){if(!canWoo(n))return;const r=romanceChoose(n,"flirt",null);after(n,r,"flirt");}
{const _sm=showMenu;showMenu=function(t,x,b){try{const n=typeof talkFocus!=="undefined"?talkFocus:null;
  if(n&&Array.isArray(b)&&typeof t==="string"&&t.includes(n.name)&&adultWoman(n)&&!isWife(n)&&!b.some(o=>o&&/Flirt/.test(o.l||""))){b=b.slice();
    if(n.spouse>0){const h=npcs.find(m=>m.id===n.spouse);b.unshift({l:"😉 Flirt (married)",dis:true});x=(x||"")+`\n\n💍 ${n.name} is married${h?" to "+h.name:""} — she won't flirt back.`;}
    else if(n.role==="leader")b.unshift({l:"😉 Flirt (busy ruling)",dis:true});
    else b.unshift({l:"😉 Flirt",f:()=>flirtNow(n)},{l:"❤ Romance…",f:()=>romanceTalk(n)});}}catch(_){}return _sm.call(this,t,x,b);};}
// the type-to-talk box is retired from the UI (code stays dormant)
window.__noSayBox=true;
// make sure a running home-screen app picks up new builds: on resume, check version.json and reload at a safe moment
{const BV="__BUILDV__";let pend=false;const chk=()=>{if(location.protocol==="file:")return;fetch("version.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{if(j&&j.v&&String(j.v)!==BV&&/^\d+$/.test(BV))pend=true;}).catch(()=>{});};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)chk();});setInterval(chk,15*60*1000);
  setInterval(()=>{if(!pend)return;const safe=state!=="play"||(!heroFighting()&&!document.querySelector("#menu")?.offsetParent);if(safe){pend=false;try{if(state==="play")saveGame();}catch(_){}location.reload();}},4000);}
