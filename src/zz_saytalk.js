// ===== v36b TYPE-TO-TALK: offline keyword/synonym intent matching with NPC context =====
const SLURS=/\b(n[i1]gg(er|a)s?|f[a4]gg?(ot)?s?|retards?|k[i1]kes?|sp[i1]cs?|ch[i1]nks?|tr[a4]nn(y|ies)|wetbacks?|coons?)\b/i;
const CUSS=/\b(fuck\w*|shit\w*|bitch\w*|bastards?|damn\w*|ass(hole)?s?|crap|piss\w*|dick\w*|hell)\b/gi;
const sayClean=t=>String(t).replace(CUSS,w=>prof()?w:w[0]+"*".repeat(w.length-1));
const INTENTS=[
 ["slur",SLURS],
 ["bye",/\b(bye|goodbye|farewell|see (ya|you)|later|cya|good ?night|take care)\b/i],
 ["greet",/^\s*(hi+|hello|hey+|howdy|greetings|good (morning|afternoon|evening)|yo|hail|sup)\b/i],
 ["insult",/\b(stupid|idiot|ugly|dumb|fool|loser|hate you|smell|moron|useless|shut up|fuck\w*|bitch\w*|bastard)\b/i],
 ["flirt",/\b(marry me|kiss|date me|love you|cute|beautiful|gorgeous|handsome|sexy|hot|pretty|attractive|crush)\b/i],
 ["compliment",/\b(nice|great|awesome|cool|kind|lovely|amazing|wonderful|thanks?|thank you|good job|well done|like you)\b/i],
 ["where",/\b(where('?s| is| are| can i find)?|how do i get to|direction|way to|find)\b/i],
 ["buy",/\b(buy|sell|shop|wares|trade|price|cost|purchase|goods)\b/i],
 ["quest",/\b(quest|job|work|task|help you|need help|errand|bounty|anything (to do|i can do))\b/i],
 ["rumor",/\b(rumou?rs?|news|gossip|heard|happening|going on|latest)\b/i],
 ["family",/\b(family|wife|husband|spouse|kids?|children|son|daughter|parents?|mother|father|mom|dad|married)\b/i],
 ["job",/\b(your job|what do you do|work as|profession|occupation|trade)\b/i],
 ["age",/\b(how old|your age|age)\b/i],
 ["name",/\b(your name|who are you|name)\b/i],
 ["weather",/\b(weather|rain|sunny|snow|storm|season|cold|hot today)\b/i],
 ["time",/\b(time|what day|today|hour|weekday)\b/i],
 ["town",/\b(town|village|city|this place|live here|about here)\b/i],
 ["mood",/\b(how are you|how('?s| is) it going|you ok|feeling|how have you been|what('?s| is) up)\b/i],
 ["doing",/\b(what are you doing|busy|plans|where are you going)\b/i],
 ["seeker",/\b(seeker|lore|ancient|fragment|sanctum)\b/i],
];
function sayIntent(t){for(const [k,re] of INTENTS){re.lastIndex=0;if(re.test(t))return k;}return"fallback";}
const isKidN=n=>n.role==="child"||(n.age||20)<16;
const vary=(n,a)=>{n._sv=(n._sv||0)+1;return a[(n._sv+Math.floor(Math.random()*a.length))%a.length];};
const PLACE={inn:/\b(inn|tavern|pub|bar|ale|bed|sleep)\b/,shop:/\b(shop|store|market|merchant)\b/,guild:/\b(guild|board|adventur)/,harbor:/\b(harbou?r|dock|port|boat|ship)\b/,castle:/\b(castle|king|queen|throne|palace|ruler)\b/,forsale:/\b(house|home for sale|real estate|property)\b/};
function dirWord(dx,dy){const a=Math.atan2(dy,dx)*180/Math.PI;return["east","south-east","south","south-west","west","north-west","north","north-east"][((Math.round(a/45)%8)+8)%8];}
function sayWhere(n,t){const S=SETS[n.s];const tl=t.toLowerCase();
  for(const k in PLACE)if(PLACE[k].test(tl)){const b=S.bIdx.find(i=>buildings[i]&&buildings[i].kind===k);if(b!=null){const B=buildings[b];return`The ${k==="forsale"?"house for sale":k} is ${dirWord(B.x-S.x,B.y-S.y)} of the square, just a short walk.`;}return`We don't have a ${k} here in ${S.name}, sorry.`;}
  if(/fountain|square|well/.test(tl))return`The square's right in the middle of ${S.name}.`;
  for(const O of SETS){if(O!==S&&tl.includes(O.name.toLowerCase())){const d=Math.round(Math.hypot(O.x-S.x,O.y-S.y));return`${O.name}? Head ${dirWord(O.x-S.x,O.y-S.y)}, about ${d>60?"a long journey":d>25?"a day's walk":"not far"}.`;}}
  const nm=npcs.find(m=>m.alive&&m!==n&&tl.includes(String(m.name).toLowerCase().split(" ")[0]));if(nm){const r=nm.doing||"";return nm.s===n.s?`${nm.name}? ${r?"Last I saw, "+r+".":"Somewhere around town."}`:`${nm.name} lives over in ${SETS[nm.s].name}.`;}
  return isKidN(n)?"Um... I don't know that place! Ask a grown-up?":"Not sure where that is. Try the guild or the innkeeper.";}
function sayReply(n,raw){const t=String(raw||"").slice(0,140).trim();if(!t)return null;const S=SETS[n.s],kid=isKidN(n),k=sayIntent(t),me=P.king?"Your Majesty":n.met?"friend":"traveler";
  const job=(typeof jobOf==="function"&&jobOf(n))||n.role,fr=n.friend||0;const F=d=>{n.friend=Math.max(0,Math.min(100,fr+d));};let r,act=null;
  switch(k){
  case"slur":F(-10);r=vary(n,["I won't listen to that kind of talk.","How dare you. Leave.","Words like that aren't welcome here."]);break;
  case"greet":r=kid?vary(n,["Hi hi!","Hello, mister wanderer!","Hey! Wanna see a frog?"]):vary(n,[`Hello, ${me}.`,fr>60?`${me}! Good to see you!`:`Well met, ${me}.`,`Morning to you too.`]);break;
  case"bye":r=vary(n,kid?["Bye-bye!","See ya!"]:["Safe travels.","Farewell, "+me+".","Come back soon."]);act="close";break;
  case"insult":F(-6);r=kid?vary(n,["Hey! That's mean!","I'm telling my mom!","*sniff* ...meanie."]):vary(n,["Watch your tongue.","Charming. Truly.","I don't need this.","Say that again, I dare you."]);break;
  case"flirt":if(kid){r=vary(n,["Eww, gross! Hehe.","You're silly!","Haha, wanna play tag instead?"]);break;}
    if(n.spouse===-1){F(2);r=vary(n,["You still make my heart race.","Flatterer... come home early tonight.","I love you too, dear."]);break;}
    if(typeof canWoo==="function"&&canWoo(n)){F(2);n.aff=Math.min(100,(n.aff||0)+(fr>=30?4:2));try{heartPop(true);}catch(_){}r=vary(n,["Oh! *blushes* You're sweet.","Careful, I might start believing you.","Hah... maybe buy me a drink first?"]);}
    else r=vary(n,["Heh, thanks, but let's keep it friendly.","That's kind, but I'm not looking.","*laughs* Nice try, wanderer."]);break;
  case"compliment":F(1);r=kid?vary(n,["Thanks! You're cool too!","Hehe, really?"]):vary(n,["That's kind of you.","Why, thank you!","You're not so bad yourself."]);break;
  case"where":r=sayWhere(n,t);break;
  case"buy":if(n.role==="shopkeeper"||job==="merchant"){r="Have a look at my wares!";act=()=>shopMenu(n.s);}else r=kid?"I've only got a shiny pebble...":`I'm a ${job}, not a merchant. The shop's ${(()=>{const b=S.bIdx.find(i=>buildings[i].kind==="shop");return b!=null?dirWord(buildings[b].x-S.x,buildings[b].y-S.y)+" of the square":"in a bigger town"})()}.`;break;
  case"quest":if(n.role==="leader"){r="There's always work. Here's the board.";act=()=>boardMenu(n.s);}else r=kid?"Find my lost marble? ...Just kidding!":vary(n,["Check the guild board for real jobs.","The elder posts work on the notice board.","If you want coin, the guild's always hiring."]);break;
  case"rumor":{const rec=world.news.filter(x=>x.d>=world.day-6);r=rec.length?(kid?"I heard grown-ups say: ":"Word is... ")+pick(rec).t:"Quiet lately. Too quiet.";break;}
  case"family":{const sp=n.spouse>0&&npcs.find(x=>x.id===n.spouse);const kids=npcs.filter(x=>(x.parents||[]).includes(n.id)&&x.alive);
    r=n.spouse===-1?"You're my family, silly.":kid?(n.parents&&n.parents.length?"My folks are around somewhere. Mom says don't talk to strangers!":"I live with my family here."):sp?`I'm married to ${sp.name}${kids.length?`, and we have ${kids.length} kid${kids.length>1?"s":""}`:""}.`:kids.length?`I've got ${kids.map(x=>x.name).join(" and ")}.`:"Just me for now.";break;}
  case"job":r=kid?"I go to school! And I play.":`I'm a ${job} here in ${S.name}. ${n.doing?"Right now: "+n.doing+".":""}`;break;
  case"age":r=kid?`I'm ${n.age||8}! Almost grown!`:(n.age||30)>=60?`${n.age} winters, and still kicking.`:`I'm ${n.age||30}. Why do you ask?`;break;
  case"name":r=`I'm ${n.name} of ${S.name}.`;n.met=true;break;
  case"weather":r=world.weather==="rain"?"Rain again. Most folks stay in.":world.weather==="storm"?"Nasty storm. Stay safe.":world.weather==="snow"?"Snow! "+(kid?"Snowball fight!":"Mind the ice."):`Fine ${SEASONS[season()].toLowerCase()} weather.`;break;
  case"time":r=`It's ${dayName()}, around ${hour()}:00.`;break;
  case"town":r=`${S.name} is a ${S.kind}. ${RT.market(RT.wd())?"Market day today!":"Good folk here."}`;break;
  case"mood":r=fr>60?vary(n,["Better now that you're here!","Wonderful, thanks!"]):fr<20?"Could be better.":vary(n,["Can't complain.","Busy, but well.","Fine, fine."]);break;
  case"doing":r=n.doing?`Oh, ${n.doing}. Usual ${dayName().split(" ")[0]}.`:"Just going about my day.";break;
  case"seeker":r=(n.role==="leader"||n.elderSecret)?"Some secrets are older than this town. Ask the Seeker.":"The Seeker? Odd folk, always digging in ruins.";break;
  default:r=kid?vary(n,["Huh? That's weird!","Hehe, what?","I don't get it."]):vary(n,["Hm, I'm not sure what you mean.","Come again?","Interesting... I suppose.","Can't say I know about that."]);}
  return{k,r:sayClean(r),act};}
function sayBox(n){if(window.__noSayBox)return;const m=document.getElementById("menu");if(!m||m.classList.contains("hidden")||m.querySelector(".saybox"))return;
  const w=document.createElement("div");w.className="saybox";w.style.cssText="display:flex;gap:6px;margin:8px 0 4px";
  const out=document.createElement("div");out.className="sayout";out.style.cssText="min-height:0;margin:4px 0;color:#ffe9a8";
  const i=document.createElement("input");i.type="text";i.placeholder="⌨ Say...";i.maxLength=140;i.setAttribute("enterkeyhint","send");i.autocomplete="off";i.style.cssText="flex:1;font-size:16px;padding:8px;border-radius:6px;border:2px solid #e8c060;background:#1e0c1a;color:#ffefd0;min-width:0";
  const b=document.createElement("button");b.type="button";b.textContent="Say";
  const go=()=>{const v=i.value;if(!v.trim())return;let res;if(SLURS.test(v)){res=sayReply(n,v);i.value="";out.textContent=res.r;return;}res=sayReply(n,v);i.value="";
    out.textContent=`You: "${sayClean(v)}"\n${n.name}: "${res.r}"`;out.style.whiteSpace="pre-line";if(res.act==="close")setTimeout(closeMenu,900);else if(typeof res.act==="function")setTimeout(res.act,600);};
  b.onclick=e=>{e.stopPropagation();go();};i.onkeydown=e=>{e.stopPropagation();if(e.key==="Enter"){e.preventDefault();go();}};i.onkeyup=e=>e.stopPropagation();
  ["touchstart","pointerdown","click"].forEach(ev=>i.addEventListener(ev,e=>e.stopPropagation()));
  i.onfocus=()=>{const vv=window.visualViewport;if(vv){m.style.top=(vv.offsetTop+vv.height/2)+"px";m.style.maxHeight=(vv.height-12)+"px";}setTimeout(()=>i.scrollIntoView({block:"nearest"}),250);};
  i.onblur=()=>{m.style.top="";m.style.maxHeight="";};
  w.append(i,b);const btns=m.querySelector(".mbtns");m.insertBefore(out,btns);m.insertBefore(w,btns);}
if(window.visualViewport)window.visualViewport.addEventListener("resize",()=>{const m=document.getElementById("menu");const a=document.activeElement;if(m&&a&&a.closest&&a.closest(".saybox")){const vv=window.visualViewport;m.style.top=(vv.offsetTop+vv.height/2)+"px";m.style.maxHeight=(vv.height-12)+"px";}});
{const _tk=talk;talk=function(n){const r=_tk.apply(this,arguments);try{if(n&&n.alive!==false)setTimeout(()=>{const h=document.querySelector("#menu h2");if(h&&h.textContent.includes(n.name))sayBox(n);},0);}catch(_){}return r;};}
