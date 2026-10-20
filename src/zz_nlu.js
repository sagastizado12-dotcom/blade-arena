// ===== v40 STRONGER TYPE-TO-TALK UNDERSTANDING (offline): normalization, texting/misspellings, stemming, fuzzy keywords & names,
// synonyms, multi-intent, question words, entity extraction, topic memory, yes/no follow-ups, NPC knowledge answers =====
const NL_TEXT={u:"you",ya:"you",yu:"you",ur:"your",yer:"your",r:"are",wat:"what",wut:"what",wht:"what",whut:"what",wher:"where",whr:"where",were:"where",wear:"where",wheres:"where is",
  hw:"how",hru:"how are you",wbu:"what about you",pls:"please",plz:"please",thx:"thanks",ty:"thanks",tnx:"thanks",k:"ok",kk:"ok",okay:"ok",yep:"yes",yeah:"yes",yea:"yes",ya2:"yes",sure:"yes",yup:"yes",
  nah:"no",nope:"no",naw:"no",im:"i am",ive:"i have",dont:"do not",cant:"can not",wont:"will not",whats:"what is",whos:"who is",hows:"how is",thats:"that is",its:"it is",
  y:"why",b4:"before",gr8:"great",l8r:"later",cya:"bye",bai:"bye",byee:"bye",helo:"hello",hallo:"hello",hii:"hi",hiya:"hi",heya:"hey",ello:"hello",
  tavren:"tavern",taverm:"tavern",inm:"inn",shpo:"shop",stor:"store",gild:"guild",guid:"guild",castel:"castle",casle:"castle",chuch:"church",chruch:"church",
  qeust:"quest",quets:"quest",qest:"quest",wepon:"weapon",weopon:"weapon",sowrd:"sword",potoin:"potion",mony:"money",rumur:"rumor",rumers:"rumors",gosip:"gossip",
  beautifull:"beautiful",beatiful:"beautiful",butiful:"beautiful",pritty:"pretty",prety:"pretty",stupd:"stupid",stoopid:"stupid",idiat:"idiot",weathr:"weather",wether:"weather",
  famly:"family",famliy:"family",daugter:"daughter",husbund:"husband",childen:"children",gonna:"going to",wanna:"want to",gotta:"got to",lemme:"let me",gimme:"give me",cuz:"because",coz:"because",bc:"because"};
function nlNorm(t){t=String(t||"").toLowerCase().replace(/[’`]/g,"'");
  t=t.replace(/\b(\w+)'(s|re|m|ll|ve|d|t)\b/g,(m,a,b)=>b==="t"?(a==="won"?"will not":a==="can"?"can not":a.replace(/n$/,"")+" not"):a+" "+({s:"is",re:"are",m:"am",ll:"will",ve:"have",d:"would"}[b]));
  t=t.replace(/[^a-z0-9\s]/g," ").replace(/(\w)\1{2,}/g,"$1$1");
  return t.split(/\s+/).filter(Boolean).map(w=>NL_TEXT[w]||w).join(" ").split(" ").filter(Boolean);}
const nlStem=w=>w.length<=3?w:w.replace(/(ies)$/,"y").replace(/(ing|edly|edness|ness|ly|ed|es|s)$/,"").replace(/(.)\1$/,"$1")||w;
function edit(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const d=[];for(let i=0;i<=a.length;i++){d[i]=[i];}for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++){let best=1e9;for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);best=Math.min(best,d[i][j]);}if(best>max)return max+1;}return d[a.length][b.length];}
const fz=(w,k)=>{if(w===k)return true;if(k.length<5||w.length<4)return false;const m=k.length>=7?2:1;return edit(w,k,m)<=m;};
// lexicon: single words (stems) and phrases; weights
const LEX={
 greet:{w:["hi","hello","hey","howdy","greeting","greet","hail","yo","sup","morning","evening","afternoon","salutation"],p:["good morning","good evening","good afternoon","good day","well met"]},
 bye:{w:["bye","goodbye","farewell","later","adieu","cheerio","goodnight"],p:["see you","see ya","take care","good night","gotta go","got to go","i must go","i should go","catch you later"]},
 insult:{w:["stupid","idiot","ugly","dumb","fool","loser","moron","useless","pathetic","worthless","stink","smelly","jerk","imbecile","coward","lame","gross","annoy","creep","scum","hag","peasant"],p:["shut up","hate you","you suck","go away","get lost","you smell","nobody likes you"]},
 flirt:{w:["kiss","cute","beautiful","gorgeous","handsome","sexy","hot","pretty","attractive","crush","darling","sweetheart","babe","lovely eyes","romance","romantic","date","marry","adorable","stunning"],p:["marry me","love you","date me","go out with me","you are cute","you are pretty","your eyes","be mine","have dinner with me","fancy you","like like"]},
 compliment:{w:["nice","great","awesome","cool","kind","lovely","amazing","wonderful","thank","thanks","brilliant","excellent","appreciate","helpful","smart","clever","best","fantastic"],p:["thank you","good job","well done","like you","you are great","you are kind","you rock"]},
 where:{w:["where","direction","locate","location","find","route","way","head"],p:["how do i get","how to get","way to","which way","point me","show me the way"] },
 buy:{w:["buy","sell","shop","ware","trade","price","cost","purchase","goods","merchant","store","gold","coin","money","afford","cheap","expensive","deal"],p:["for sale","what do you sell","how much"]},
 quest:{w:["quest","job","task","bounty","errand","mission","contract","adventure","hire","chore"],p:["need help","help you","anything to do","something to do","any work","looking for work","can i help","need anything","need a hand"]},
 rumor:{w:["rumor","rumour","news","gossip","heard","happen","latest","story","stories","tale","whisper","event"],p:["going on","what is new","anything new","any news","what happened"]},
 family:{w:["family","wife","husband","spouse","kid","child","children","son","daughter","parent","mother","father","mom","dad","married","brother","sister","sibling","baby","grandchild"],p:[]},
 job:{w:["profession","occupation","career","living","trade"],p:["your job","what do you do","work as","what is your work","do for a living","what is your trade"]},
 age:{w:["age","old","birthday","born","young"],p:["how old"]},
 name:{w:["name","call"],p:["who are you","your name","what are you called","introduce yourself"]},
 weather:{w:["weather","rain","sunny","sun","snow","storm","season","cold","warm","hot","wind","cloud","forecast","spring","summer","autumn","winter","fog"],p:[]},
 time:{w:["time","day","today","hour","weekday","clock","date","tomorrow","week","calendar"],p:["what day","what time"]},
 town:{w:["town","village","city","place","here","home","settlement","hometown","capital"],p:["this place","live here","living here","about here","this town"]},
 mood:{w:["feel","feeling","mood","happy","sad","tired","fine","ok"],p:["how are you","how is it going","you ok","how have you been","what is up","how do you do","what about you","how is life","you alright"]},
 doing:{w:["busy","plans"],p:["what are you doing","where are you going","what are you up to","what are you up"]},
 seeker:{w:["seeker","lore","ancient","fragment","sanctum","secret","prophecy","relic"],p:[]},
 thanks:{w:[],p:[]},
};
const STEMLEX={};for(const k in LEX)STEMLEX[k]=LEX[k].w.map(nlStem);
const PLACEW={inn:["inn","tavern","pub","bar","ale","beer","drink","bed","sleep","rest","room"],shop:["shop","store","market","merchant","shopkeeper","general store"],guild:["guild","board","adventurer","guildhall"],
 harbor:["harbor","harbour","dock","port","boat","ship","pier"],castle:["castle","palace","throne","king","queen","ruler","keep"],forsale:["house","home for sale","real estate","property","estate"],fountain:["fountain","square","plaza","well","center","centre"],church:["church","chapel","temple","shrine","priest"]};
const QW=["who","what","where","when","why","how","which"];
function nlEntities(toks,n){const E=[];const s=" "+toks.join(" ")+" ";
  // people (first names, fuzzy), wives & kids
  const seen=new Set();const ppl=npcs.filter(m=>m.alive&&m!==n).sort((a,b)=>(b.s===n.s)-(a.s===n.s));
  for(const w of toks){if(w.length<3||QW.includes(w))continue;for(const m of ppl){const f=String(m.name).toLowerCase().split(" ")[0];if(seen.has(m.id))continue;if(w===f||(f.length>=5&&fz(w,f))){E.push({t:"person",v:m,w});seen.add(m.id);break;}}}
  for(const S of SETS){const nm=S.name.toLowerCase();if(s.includes(" "+nm+" ")||toks.some(w=>w.length>=5&&fz(w,nm)))E.push({t:"town",v:S});}
  for(const k in PLACEW)if(PLACEW[k].some(p=>p.includes(" ")?s.includes(" "+p+" "):toks.some(w=>w===p||nlStem(w)===nlStem(p)||(p.length>=5&&fz(w,p)))))E.push({t:"place",v:k});
  try{for(const k in ITEMS){const nm=ITEMS[k].n.toLowerCase();const last=nm.split(" ").pop();if(s.includes(" "+nm+" ")||toks.some(w=>w.length>=4&&(nlStem(w)===nlStem(last)||(last.length>=6&&fz(w,last)))))E.push({t:"item",v:k});}}catch(_){}
  try{for(const k in SPELLS){const nm=SPELLS[k].n.toLowerCase();if(s.includes(" "+nm+" ")||toks.some(w=>w.length>=4&&(w===k||fz(w,nm.split(" ")[0]))))E.push({t:"spell",v:k});}}catch(_){}
  try{const mons=Object.keys(MONDEF);for(const w of toks){if(w.length<4)continue;const k=mons.find(m=>w===m||nlStem(w)===m||fz(w,m));if(k)E.push({t:"monster",v:k});}}catch(_){}
  if(/\b(dragon|dragons)\b/.test(s))E.push({t:"monster",v:"dragon"});
  return E;}
let NLNS=null,NLNS_N=-1;function nlNameSet(){try{if(NLNS_N!==npcs.length){NLNS=new Set(npcs.filter(m=>m&&m.name).map(m=>String(m.name).split(" ")[0].toLowerCase()));NLNS_N=npcs.length;}}catch(_){NLNS=NLNS||new Set();}return NLNS;}
function nlParse(raw,n){const toks=nlNorm(raw);const st=toks.map(nlStem),s=" "+toks.join(" ")+" ";const sc={},pos={};
  const hit=(k,v,i)=>{sc[k]=(sc[k]||0)+v;if(pos[k]==null||i<pos[k])pos[k]=i;};
  if(SLURS.test(String(raw))||SLURS.test(toks.join(" ")))return{toks,intents:["slur"],ents:[],q:null};
  for(const k in LEX){for(const p of LEX[k].p){const i=s.indexOf(" "+p+" ");if(i>=0)hit(k,3,i);}
    STEMLEX[k].forEach((w,j)=>{st.forEach((x,i)=>{if(x===w||toks[i]===LEX[k].w[j]||toks[i].replace(/s$/,"")===LEX[k].w[j])hit(k,2,i*5);else if(!nlNameSet().has(toks[i])&&fz(toks[i],LEX[k].w[j]))hit(k,1.2,i*5);});});}
  const q=toks.find(w=>QW.includes(w))||null;const ents=nlEntities(toks,n);
  // question-word rules
  if(q==="where")hit("where",3,0);if(q==="when"&&!sc.age)hit("time",1.5,0);if(q==="who"&&!ents.some(e=>e.t==="person")&&!sc.family)hit("name",1.5,0);
  if(q==="how"&&/\bhow (old|many years)\b/.test(s))hit("age",4,0);
  if(ents.some(e=>e.t==="place")&&(q==="where"||sc.where))hit("where",2,0);
  // disambiguation
  if(sc.insult&&sc.compliment&&/\b(not|never|no)\b/.test(s)){delete sc.compliment;}
  if(sc.flirt&&sc.compliment)sc.compliment-=1.5;if(sc.weather&&sc.compliment)delete sc.compliment;if(sc.flirt&&/\b(the date|what date|date today|today s date)\b/.test(s)){delete sc.flirt;hit("time",2,0);}if(sc.seeker)sc.seeker+=2;
  if(sc.mood&&/\bhow are you\b/.test(s))sc.mood+=3;
  if(sc.weather&&sc.flirt&&/\b(hot|warm|cold)\b/.test(s)&&!/\byou\b/.test(s))delete sc.flirt;
  if(sc.flirt&&/\b(hot|warm|cold|rain)\b/.test(s)&&/\b(today|weather|out|outside)\b/.test(s))delete sc.flirt;
  if(sc.where&&sc.buy&&ents.some(e=>e.t==="place"))sc.buy-=2;
  if(sc.time&&sc.where&&!/\b(when|time|day)\b/.test(s))delete sc.time;
  if(sc.town&&(sc.where||sc.mood||sc.doing||sc.job))sc.town-=1.5;
  if(sc.job&&sc.quest&&/\b(your job|you do|for a living|your work|work as)\b/.test(s))delete sc.quest;
  if(sc.quest&&/\bwhat do you do\b/.test(s))delete sc.quest;
  if(sc.doing&&sc.where&&/\bwhere are you going\b/.test(s))delete sc.where;
  if(sc.age&&/\bold\b/.test(s)&&!/\bhow old|your age|age\b/.test(s)&&sc.insult)delete sc.age;
  if(sc.age&&sc.compliment&&!/\bhow old|age\b/.test(s))delete sc.age;
  if(sc.family&&ents.some(e=>e.t==="person")&&(q==="who"||q==="where"))sc.family-=1;
  let intents=Object.keys(sc).filter(k=>sc[k]>=1.2).sort((a,b)=>(sc[b]-sc[a])||(pos[a]-pos[b]));{const gi=intents.indexOf("greet");if(gi>0&&sc.greet>=2&&pos.greet<=pos[intents[0]]){intents.splice(gi,1);intents.unshift("greet");}}
  // multi-intent: keep up to 2 in sentence order (e.g. "hi! where is the inn?")
  const yes=/^\s*(yes|ok|alright|fine|of course|definitely|absolutely|please)\b/.test(toks.join(" "))&&toks.length<=4,no=/^\s*(no|not really|never mind|nevermind)\b/.test(toks.join(" "))&&toks.length<=4;
  return{toks,intents,ents,q,yes,no,sc};}
const NL_CANON={greet:"hello",bye:"bye",insult:"you idiot",flirt:"you're beautiful",compliment:"thank you",buy:"buy",quest:"any quest",rumor:"rumors",family:"family",job:"what do you do",age:"how old",name:"your name",weather:"weather",time:"what time",town:"this town",mood:"how are you",doing:"what are you doing",seeker:"seeker"};
const _sayIntentOld=sayIntent;
sayIntent=function(t,n){const p=nlParse(t,n||{s:0,id:-1});return p.intents[0]||"fallback";};
function personAbout(n,m,kid){const S=SETS[m.s],job=(typeof jobOf==="function"&&jobOf(m))||m.role;const sp=m.spouse===-1?"the wanderer's own spouse":m.spouse>0?(npcs.find(x=>x.id===m.spouse)||{}).name:null;
  if(m.spouse===-1&&(n.spouse===-1))return`${m.name}? Family, of course.`;
  return kid?`${m.name}? ${m.role==="child"?"They're my friend!":"They're a grown-up. A "+job+", I think."}`:`${m.name} is ${m.age?m.age+", ":""}a ${m.role==="child"?"child":job} in ${S.name}${sp?`, married to ${sp}`:""}.${m.doing&&m.s===n.s?` Right now: ${m.doing}.`:""}`;}
const _sayReplyOld=sayReply;
sayReply=function(n,raw){const t=String(raw||"").slice(0,200).trim();if(!t)return null;const kid=isKidN(n);const p=nlParse(t,n);const ctx=n._ctx=n._ctx||{};const S=SETS[n.s];
  const fin=(k,r,act)=>{ctx.k=k;ctx.t=frameN;return{k,r:sayClean(r),act,ents:p.ents,intents:p.intents};};
  if(p.intents[0]==="slur")return Object.assign(_sayReplyOld(n,"nigger"),{intents:["slur"]});
  // yes/no follow-up to the NPC's last offer
  if((p.yes||p.no)&&ctx.ask&&!p.intents.filter(i=>i!=="mood").length){const a=ctx.ask;ctx.ask=null;if(p.no)return fin("no",kid?"Okay!":"Suit yourself.");
    if(a==="shop")return fin("buy","Right this way!",()=>shopMenu(n.s));if(a==="board")return fin("quest","Here's the notice board.",()=>boardMenu(n.s));if(a==="dir"&&ctx.ent)return fin("where",ctx.ent.t==="town"?`Follow the road ${dirWord(ctx.ent.v.x-S.x,ctx.ent.v.y-S.y)}. Safe travels!`:"Just follow the path, you can't miss it.");}
  // topic carry-over: pronouns
  let ents=p.ents.slice();const pron=p.toks.some(w=>["her","him","she","he","it","there","they","them","that","this"].includes(w));
  if(!ents.length&&pron&&ctx.ent&&frameN-(ctx.t||0)<60*60*5)ents=[ctx.ent];
  let intents=p.intents.slice();if(!intents.length&&ents.length&&p.toks.length<=4)intents=[ctx.k&&["where","who"].includes(ctx.k)?ctx.k:ents[0].t==="person"?"who":"where"];
  if(ents.length)ctx.ent=ents[0];
  const out=[];let act=null,k0=intents[0]||"fallback";
  for(const k of intents.slice(0,3)){let r=null;const e=ents[0];
    if(k==="where"&&e){if(e.t==="person"){const m=e.v;r=m.s===n.s?`${m.name}? ${m.doing?"Last I saw, "+m.doing+".":"Somewhere around town."}`:`${m.name} lives over in ${SETS[m.s].name}, ${dirWord(SETS[m.s].x-S.x,SETS[m.s].y-S.y)} of here.`;}
      else if(e.t==="town"){r=_sayReplyOld(n,"where is "+e.v.name).r+(kid?"":" Want directions?");ctx.ask="dir";}
      else if(e.t==="place"){r=e.v==="church"?(kid?"The chapel's by the fountain on Restday!":"We gather by the fountain for chapel on Restday mornings."):_sayReplyOld(n,"where is the "+({inn:"inn",shop:"shop",guild:"guild",harbor:"harbor",castle:"castle",forsale:"house",fountain:"fountain"}[e.v])).r;}
      else if(e.t==="item"){r=`${ITEMS[e.v].n}? Try the shop${S.bIdx.some(b=>buildings[b].kind==="shop")?" here in town":" in a bigger town"}.`;}
      else if(e.t==="monster"){r=e.v==="dragon"?"Dragons nest far from towns. Pray you never find one.":`${e.v[0].toUpperCase()+e.v.slice(1)}s roam the wilds outside town. Watch yourself.`;}}
    else if((k==="name"||k==="family"||k==="who"||k==="job"||k==="age")&&e&&e.t==="person"){r=personAbout(n,e.v,kid);if(k==="age"&&e.v.age)r=`${e.v.name} is ${e.v.age}.`;}
    else if(k==="who"&&e&&e.t==="town"){const L=npcs.find(m=>m.alive&&m.s===e.v.id&&m.role==="leader");r=`${e.v.name} is a ${e.v.kind}${L?`, led by ${L.name}`:""}.`;}
    else if(k==="town"&&e&&e.t==="town"&&e.v!==S){const L=npcs.find(m=>m.alive&&m.s===e.v.id&&m.role==="leader");r=`${e.v.name}? A ${e.v.kind} ${dirWord(e.v.x-S.x,e.v.y-S.y)} of here${L?`; ${L.name} runs things there`:""}.`;}
    else if(e&&e.t==="spell"&&(k==="where"||k==="quest"||k==="buy"||k==="name"||!k)){r=`${SPELLS[e.v].n}? ${kid?"Magic! So cool!":"Check your Spellbook to see how to learn it."}`;}
    else if(k==="buy"&&e&&e.t==="item"){const it=ITEMS[e.v];r=`${it.n} goes for about ${Math.round((it.p||5)*(world.sets[n.s].price||1))}g${n.role==="shopkeeper"?". Want some?":" at the shop."}`;if(n.role==="shopkeeper")ctx.ask="shop";}
    else if(k==="who"&&!e){r=_sayReplyOld(n,"your name").r;}
    if(!r){const res=_sayReplyOld(n,NL_CANON[k]||t);r=res.r;if(res.act)act=res.act;if(res.k==="fallback"&&k!=="fallback"){}
      if(k==="buy"&&!res.act&&!kid)ctx.ask=null;if(k==="quest"&&n.role==="leader")act=res.act;}
    if(k==="buy"&&n.role==="shopkeeper"&&!act&&!(e&&e.t==="item")){act=()=>shopMenu(n.s);}
    out.push(r);}
  if(!out.length){if(ents.length&&ents[0].t==="person")out.push(personAbout(n,ents[0].v,kid));else if(ents.length&&ents[0].t==="town"){out.push(`${ents[0].v.name}? It's ${dirWord(ents[0].v.x-S.x,ents[0].v.y-S.y)} of here.`);k0="where";}
    else {const res=_sayReplyOld(n,t);return fin(res.k,res.r,res.act);}}
  if(k0==="bye")act="close";
  return fin(k0,out.join(" "),act);};
