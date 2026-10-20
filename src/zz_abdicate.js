// ===== v44 ABDICATION: give up any realm (incl. Nethervale) to a named, friendly regent; reclaim it later at the throne =====
const ABD=()=>{world.abd=world.abd||{};return world.abd;};
const REGENT_NAMES=["Lady Maren Ashford","Lord Edric Vale","Elder Tomas Brightwater","Lady Isolde Wren","Lord Cedric Thorne","Steward Aldous Fenn","Lady Rowena Hale","Elder Brannoc Moss"];
const REGENT_DEMON=["Archduke Malvoren","Duchess Vexmira","Warlord Kaelthas","Regent Morgrim"];
function pickRegent(k){const cap=KINGDOMS[k].cap;const ok=n=>n.alive&&n.name&&!n.adv&&!n.demonLord&&n.role!=="child"&&(n.age||30)>=25&&!n.wife&&!n.spouse&&!n.heroKid&&!(P.wives||[]).includes(n.id);
  const here=npcs.filter(n=>ok(n)&&n.s===cap);const pref=here.find(n=>n.role==="leader")||here.find(n=>/elder|noble|advis|steward|priest|mayor/i.test(n.role||n.job||""))||here.sort((a,b)=>(b.age||0)-(a.age||0))[0];
  if(pref&&!KINGDOMS[k].demon){const t=pref.role==="leader"?"Lord Regent":(sexOf&&sexOf(pref)==="F"?"Lady Regent":"Lord Regent");return{name:pref.name,id:pref.id,title:t};}
  const L=KINGDOMS[k].demon?REGENT_DEMON:REGENT_NAMES;return{name:L[(k*3+(world.day%7))%L.length],id:null,title:"Regent"};}
const isAbd=k=>!!(world&&world.abd&&world.abd[k]);
function abdicate(k){const K=kState();if(!rulerRealms().includes(k))return false;const R=KINGDOMS[k];const rg=pickRegent(k);
  const A={regent:rg.name,rid:rg.id,title:rg.title,day:world.day};
  if(k===0){A.wasKing=!!P.king;A.crowned=!!P.crowned;A.rank=P.rank;P.king=false;P.crowned=false;P.canCrown=false;P.rank=Math.min(P.rank,4);}
  const i=K.crowns.indexOf(k);if(i>=0)K.crowns.splice(i,1);delete K.war[k];if(R.demon)K.demonPeace=true;try{syncWar();}catch(_){}
  if(K.crowns.length<4&&P.titles){A.hadHigh=P.titles.includes("High Ruler of the Four Realms");P.titles=P.titles.filter(t=>t!=="High Ruler of the Four Realms");}
  ABD()[k]=A;if(rg.id!=null){const n=npcs.find(q=>q.id===rg.id);if(n)n.friend=Math.max(n.friend||0,80);}
  const m=`I gave up the crown of ${R.name}. ${rg.name} now governs as ${rg.title}, and remains a friend.`;
  try{addNews(R.cap,`The wanderer has abdicated the throne of ${R.name}. ${rg.name} rules as ${rg.title}.`);}catch(_){}try{jAdd(m,"war");}catch(_){}toast("👑 "+m);try{saveGame();}catch(_){}return true;}
function reclaim(k){const A=ABD()[k];if(!A)return false;const R=KINGDOMS[k];const K=kState();delete ABD()[k];
  if(!K.crowns.includes(k))K.crowns.push(k);delete K.war[k];try{syncWar();}catch(_){}
  if(k===0){P.king=true;P.crowned=true;P.rank=6;world.castle=true;}
  if(K.crowns.length>=4){P.titles=P.titles||[];if(!P.titles.includes("High Ruler of the Four Realms"))P.titles.push("High Ruler of the Four Realms");}
  const m=`${A.regent} returned the crown of ${R.name} to me. I rule again.`;try{addNews(R.cap,`The wanderer has reclaimed the throne of ${R.name} from ${A.regent}.`);}catch(_){}try{jAdd(m,"war");}catch(_){}toast("♛ "+m);try{saveGame();}catch(_){}return true;}
function abdicateConfirm(k){const R=KINGDOMS[k];showMenu("👑 Abdicate?",`Give up the throne of ${R.name}?\n\nA regent will govern in your place. You lose this realm's taxes, income and command of its guards. Your homes stay yours, and${R.demon?" Nethervale's restoration stays.":" all you rebuilt stays."}\n\nYou may reclaim the crown later by speaking to the regent at the throne.`,
  [{l:"👑 Yes, abdicate",f:()=>{abdicate(k);const L=rulerRealms();if(L.length)rulerMenu(L[0]);else showMenu("👑 Abdicated",`${ABD()[k].regent} now rules ${R.name} as ${ABD()[k].title}.`,[{l:"OK"}]);}},{l:"No, keep the crown",f:()=>rulerMenu(k)}]);}
function regentAudience(k){const A=ABD()[k],R=KINGDOMS[k];
  showMenu(`${A.regent}, ${A.title} of ${R.name}`,`"Welcome back, friend. I keep ${R.name} safe in your name. Say the word and the crown is yours again."`,
    [{l:"♛ Take the crown back",f:()=>showMenu("Reclaim the crown?",`Take back the throne of ${R.name} from ${A.regent}?`,[{l:"♛ Yes, reclaim it",f:()=>{reclaim(k);showMenu(R.name,`${A.regent} kneels and hands you the crown. "Long may you reign."`,[{l:"OK"}]);}},{l:"Not yet",f:()=>regentAudience(k)}])},
     {l:"Kingdoms & War",f:kingdomsMenu},{l:"Leave"}]);}
{const _cm=castleMenu;castleMenu=function(){try{if(room&&room.b&&room.b.kind==="castle"){const k=kOf(room.b.s);if(isAbd(k))return regentAudience(k);}}catch(_){}return _cm.apply(this,arguments);};}
{const _rn=roomNpcs;roomNpcs=function(){const L=_rn.apply(this,arguments);try{if(room&&room.b&&room.b.kind==="castle"){const k=kOf(room.b.s);if(isAbd(k))for(const e of L)if(e.king)e.name=ABD()[k].regent;}}catch(_){}return L;};}
{const _ck=checkRank;checkRank=function(){const r=_ck.apply(this,arguments);try{if(isAbd(0))P.canCrown=false;}catch(_){}return r;};}
// the Ruler tab stays reachable while every realm is under a regent
{const _rm=rulerMenu;rulerMenu=function(k){if(!rulerRealms().length&&world&&Object.keys(ABD()).length){const t=Object.keys(ABD()).map(i=>`${KINGDOMS[i].name}: ${ABD()[i].regent} (${ABD()[i].title})`).join("\n");return showMenu("♛ Ruler","You hold no throne. Your realms are under regents:\n"+t+"\n\nSpeak to a regent at the throne to reclaim a crown.",[{l:"Close"}]);}return _rm.apply(this,arguments);};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world&&!rulerRealms().length&&Object.keys(ABD()).length)b=[{l:"♛ Ruler",f:()=>rulerMenu()}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
