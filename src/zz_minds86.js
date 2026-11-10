// ===== v86 NPC AUTONOMY =====
// Builds on the v59 minds. Nearby people keep a plan; everyone else keeps a
// hashed goal and a slow daily tick. Kids play and go to school. They never
// enlist, never romance, and never take a blow.
try{SAVE_DROP.add("_m86");}catch(_){}
function trait86(n){const t=mindTraits(n);const h=Math.imul((n.id+3),2246822519)>>>0;const g=h%100,c=(h>>>6)%100;
  let name="steady";
  if(t.brave>=72)name="brave";else if(t.brave<28)name="timid";
  else if(t.duty>=78)name="ambitious";else if(t.duty<28)name="lazy";
  else if(g<18)name="greedy";else if(g>84)name="generous";
  else if(c>76)name="curious";else if(t.social>=72)name="friendly";
  return{name,brave:t.brave,duty:t.duty,social:t.social,caution:t.caution,greedy:g<35,curious:c>60};}
function adult86(n){return n&&n.alive&&n.role!=="child"&&(n.age||18)>=18&&!n.heroKid;}
function goalOf(n){if(!adult86(n))return"play";
  if(n.goal86)return n.goal86;
  const g=["house","partner","trade","work","enlist"][n.id%5];
  if(g==="partner"&&(n.spouse||n.spouse===-1))return"work";
  return g;}
function deeds86(){P.deeds86=P.deeds86||{help:0,fought:0,rescue:0};return P.deeds86;}
function rumor86(){return world&&world.rumor86;}
function knowsRumor(n){const r=rumor86();if(!r||world.day-(r.day||0)>6)return false;return n.s===r.sid||Math.abs((n.s|0)-(r.sid|0))<4;}
function innT86(n){const S=SETS[n.s];const id=S&&S.bIdx&&S.bIdx.find(b=>buildings[b]&&buildings[b].kind==="inn");if(id==null)return squareT(n);const d=doorOf(buildings[id]);return{x:d.x+(n.id%5-2)*10,y:d.y+10,inside:false};}
function schoolT86(n){const S=SETS[n.s];const id=S&&S.bIdx&&S.bIdx.find(b=>buildings[b]&&(buildings[b].kind==="guild"||buildings[b].kind==="inn"));if(id==null)return squareT(n);const d=doorOf(buildings[id]);return{x:d.x+(n.id%4-1)*8,y:d.y+6};}
function atWarHome(n){try{const k=kOf(n.s);return (world.wars||[]).find(w=>!w.over&&(w.a===k||w.b===k))||null;}catch(_){return null;}}
function spread86(n,t){if(!t)return t;const a=(n.id%8)/8*6.283;return{...t,x:(t.x||0)+Math.cos(a)*10,y:(t.y||0)+Math.sin(a)*8};}
{const _md=mindDecide;mindDecide=function(n){const d=_md.apply(this,arguments);try{
  if(!n||!world)return d;const role=roleOf(n),tr=trait86(n),h=hour(),kid=role==="child";
  const put=(act,score,why,line,thought,target)=>{if(!d||score>d.score)return{act,score,override:!!target,why,line,thought,target};return null;};
  if(n.enlisted)return{act:"enlist",score:100,override:true,why:"army",line:"I marched with the army. I'll come home if I live.",thought:"the front",target:homeT(n)};
  if(n.awayTil>world.day)return{act:"travel",score:100,override:true,why:"caravan",line:"I'm out with the caravan. Back in a few days.",thought:"the road",target:homeT(n)};
  if(!kid&&(h<6||h>=22)&&role!=="guard"){const s=put("sleep",94,"night","The day is done. I'm going home to sleep.","sleep",homeT(n));if(s)return s;}
  if(kid&&h>=9&&h<15&&world.weather!=="storm"){const s=put("school",88,"school","School first. I'll play after.","school",schoolT86(n));if(s)return s;}
  if(kid){const s=put("play",70,"play","I'm playing. Don't tell me to enlist.","play",squareT(n));if(s&&(!d||d.act==="work"))return s;}
  if(world.weather==="rain"&&!(role==="guard"&&tr.brave>=70)){const s=put("shelter",kid?92:84,"rain","This rain is enough. I'm heading in.","the rain",homeT(n));if(s)return s;}
  if(typeof BRAWL!=="undefined"&&BRAWL.on&&hero&&Math.hypot(n.x-hero.x,n.y-hero.y)<220&&role!=="guard"){const s=put("flee",97,"battle",kid?"The fighting is too close. I'm hiding!":"A battle is on. I'm getting off the street.","take cover",homeT(n));if(s)return s;}
  if(!kid&&(h===12||h===18)&&world.weather!=="storm"&&role!=="guard"){const s=put("eat",74,"meal","I'm hungry. The inn will have a bowl.","supper",innT86(n));if(s)return s;}
  if(!kid&&h>=7&&h<9&&(tr.curious||n.id%7===0)&&world.weather==="clear"){const s=put("worship",66,"shrine","A short prayer at the shrine, then the day.","the shrine",spread86(n,squareT(n)));if(s)return s;}
  const g=goalOf(n);
  if(g==="house"&&h>=11&&h<16&&!kid){const s=put("shop",71,"house","I'm saving every coin. A house of my own, someday.","the house",shopT(n));if(s)return s;}
  if(g==="partner"&&!n.spouse&&n.spouse!==-1&&h>=16&&h<20&&world.weather==="clear"){const s=put("gossip",73,"partner","I was hoping to meet someone in the square tonight.","company",spread86(n,squareT(n)));if(s)return s;}
  if(g==="trade"&&h>=8&&h<17){const s=put("work",76,"trade","I'm learning the trade. The shop won't teach itself.","the craft",shopT(n));if(s)return s;}
  if(g==="enlist"&&atWarHome(n)&&tr.brave>=40&&h>=8&&h<18){const s=put("work",75,"enlist","My country is at war. I may take the levy.","the levy",spread86(n,squareT(n)));if(s)return s;}
  if(d&&d.target)d.target=spread86(n,d.target);
}catch(e){console.warn("mind86",e);}return d;};}
{const _nt=npcTarget;npcTarget=function(n){if(n&&(n.enlisted||(n.awayTil> (world&&world.day)))){const h=homeT(n);n.inside=true;return h;}return _nt.apply(this,arguments);};}
{const _un=updateNpc;updateNpc=function(n){try{
  if(n&&n.enlisted){const w=(world.wars||[]).find(q=>q.id===n.enlisted&&!q.over);if(!w){n.enlisted=0;n.inside=false;const h=homeT(n);n.x=h.x;n.y=h.y;}else{const h=homeT(n);n.x=h.x;n.y=h.y;n.inside=true;return;}}
  if(n&&n.awayTil>world.day){n.inside=true;return;}
}catch(_){}
  const r=_un.apply(this,arguments);
  try{if(n&&n.alive&&!n.inside&&hero&&Math.hypot(n.x-hero.x,n.y-hero.y)<420&&(frameN+n.id)%4===0){
    let seen=0;for(const o of npcs){if(o===n||!o.alive||o.inside)continue;if(++seen>8)break;const dx=n.x-o.x,dy=n.y-o.y,d=Math.hypot(dx,dy);if(d>1&&d<12){n.x+=dx/d*0.35;n.y+=dy/d*0.35;break;}}
  }}catch(_){}
  return r;};}
function voice86(n){if(!n||!world)return"";const kid=roleOf(n)==="child",tr=trait86(n),g=goalOf(n),S=SETS[n.s];
  if(n.enlisted)return"I enlisted. If I come home, buy me a pie.";
  if(kid)return hour()>=9&&hour()<15?"I'm going to school. We learned letters today.":"School's out. I'm playing, and I'm not joining any army.";
  const r=rumor86();
  if(knowsRumor(n))return"Have you heard? "+r.t;
  const war=atWarHome(n);
  if(war&&g==="enlist")return KINGDOMS[kOf(n.s)].name+" is calling. A brave sort would march.";
  if(war&&tr.name==="timid")return"The war has everyone looking over their shoulder. I'm staying near home.";
  if(g==="house")return"I've been setting coins aside. A little house in "+S.name+" would do.";
  if(g==="partner"&&!n.spouse&&n.spouse!==-1)return"I'd like to meet someone kind. Nothing hasty.";
  if(g==="trade")return"I'm learning a trade. The work is slow and I like it.";
  const D=P&&P.deeds86;
  if(D&&D.fought&&kOf(n.s)===D.fought)return"You stood with "+KINGDOMS[D.fought].name+". People here remember that.";
  if(D&&D.help>0&&n.friend>=30)return"You helped when trouble came. I haven't forgotten.";
  if(world.bounty86&&world.bounty86.sid===n.s&&world.day-(world.bounty86.day||0)<5)return"The elder posted a bounty: "+world.bounty86.gold+"g for "+world.bounty86.what+".";
  if(tr.name==="greedy"&&n.role==="shopkeeper")return"Prices went up. War and weather both eat the stock.";
  if(tr.name==="generous")return"If you're short of coin, say so. I'll not let a neighbor go hungry.";
  if(tr.name==="curious")return"I walked the long way today just to see what the weather was doing.";
  if(tr.name==="lazy"&&hour()>=12&&hour()<15)return"The inn has a bench and I intend to use it.";
  if(world.weather==="rain")return"Rain like this, sensible folk finish the day indoors.";
  const foe=friendFoe86(n);if(foe)return foe;
  if(g==="work")return"The day's work comes first. "+(world.weather==="clear"?"Clear skies help.":"This weather slows everyone down.");
  if(tr.name==="brave")return"I'd rather face the day than hide from it.";
  return"I'm "+tr.name+", and I've got my own plans today.";}
function friendFoe86(n){if(!n.rel)return"";const ids=Object.keys(n.rel);if(!ids.length)return"";
  let hi=ids[0],lo=ids[0];for(const id of ids){if(n.rel[id]>n.rel[hi])hi=id;if(n.rel[id]<n.rel[lo])lo=id;}
  const pal=npcs.find(x=>x.id==hi),gr=npcs.find(x=>x.id==lo);
  if(gr&&n.rel[lo]<25&&gr.alive)return gr.name+" and I are not speaking. Some grudges keep.";
  if(pal&&n.rel[hi]>60&&pal.alive)return pal.name+" is a real friend. We pass the news along.";
  return"";}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{const line=voice86(n);if(line&&Array.isArray(L))L.splice(1,0,line);}catch(_){}return L;};}
{const _rt=romanceTalk;romanceTalk=function(n,msg){try{if(!msg&&n){const v=voice86(n);if(v)msg=n.name+" ("+personaOf(n)+") looks at you. \""+v+"\"";} }catch(_){}return _rt.call(this,n,msg);};}
function postRumor(sid,t){world.rumor86={sid,t:String(t).slice(0,140),day:world.day||0};}
function life86(){if(!world||!npcs)return;let fired=0;P.deeds86=P.deeds86||{help:0,fought:0,rescue:0};
  for(const n of npcs){if(fired>=3)break;if(!n.alive||(n.id+world.day)%47!==0)continue;
    if(!adult86(n)||n.role==="leader"||n.role==="guard"||n.enlisted)continue;
    if(n.spouse===-1)continue;
    const g=goalOf(n),k=kOf(n.s),war=atWarHome(n),tr=trait86(n);
    if(g==="enlist"&&war&&tr.brave>=40){n.enlisted=war.id;n.inside=true;fired++;
      const msg=n.name+" of "+SETS[n.s].name+" enlisted with "+KINGDOMS[k].name+".";
      try{addNews(n.s,msg);jAdd(msg,"life");}catch(_){}postRumor(n.s,msg);continue;}
    if(g==="trade"&&n.role==="farmer"&&(n.id+world.day)%94===0){n.stall=1;n.goal86="trade";fired++;
      const msg=n.name+" opened a small stall in "+SETS[n.s].name+".";try{addNews(n.s,msg);}catch(_){}postRumor(n.s,msg);continue;}
    if(tr.name==="ambitious"&&(n.id*3+world.day)%120===0){const towns=SETS.filter(s=>!s.island&&kOf(s.id)===k&&s.id!==n.s&&/town/.test(s.kind||""));
      const dest=towns[n.id%Math.max(1,towns.length)];if(dest){const from=SETS[n.s].name;n.s=dest.id;const hs=dest.bIdx&&dest.bIdx.filter(b=>buildings[b]&&buildings[b].kind==="house");
        if(hs&&hs.length){n.home=hs[n.id%hs.length];const d=doorOf(buildings[n.home]);n.x=d.x;n.y=d.y;}
        fired++;const msg=n.name+" left "+from+" and moved to "+dest.name+".";try{addNews(dest.id,msg);}catch(_){}postRumor(dest.id,msg);continue;}}
    if(g==="work"&&(n.id+world.day)%80===0&&world.caravans&&world.caravans.length){n.awayTil=world.day+3;n.inside=true;fired++;
      const msg=n.name+" joined a caravan out of "+SETS[n.s].name+".";try{addNews(n.s,msg);}catch(_){}postRumor(n.s,msg);}
  }
  if(hero){const s=typeof settlementAt==="function"&&settlementAt(hero.x,hero.y);if(s&&world.sets[s.id]){const ws=world.sets[s.id];
    const war=atWarHome({s:s.id});
    if(war||world.weather==="storm")ws.price=Math.max(0.55,Math.min(1.8,(ws.price||1)+0.04));
    else if(ws.festival)ws.price=Math.max(0.55,Math.min(1.8,(ws.price||1)-0.04));
    if((ws.raid||war)&&(!world.bounty86||world.day-(world.bounty86.day||0)>4))world.bounty86={sid:s.id,gold:40,what:ws.raid?"the raiders":"enemies at the front",day:world.day};}}
}
function gossip86(){if(!hero||!npcs||frameN%90!==0)return;let a=null,b=null,seen=0;
  for(const n of npcs){if(!n.alive||n.inside||!adult86(n))continue;if(Math.hypot(n.x-hero.x,n.y-hero.y)>360)continue;if(++seen>12)break;if(!a)a=n;else if(Math.hypot(n.x-a.x,n.y-a.y)<28){b=n;break;}}
  if(!a||!b)return;const ta=trait86(a),tb=trait86(b);const d=(ta.greedy&&tb.greedy)?-2:(ta.social>60&&tb.social>60)?2:1;
  a.rel=a.rel||{};b.rel=b.rel||{};
  if(Object.keys(a.rel).length<6||a.rel[b.id]!=null)a.rel[b.id]=Math.max(0,Math.min(100,(a.rel[b.id]||40)+d));
  if(Object.keys(b.rel).length<6||b.rel[a.id]!=null)b.rel[a.id]=Math.max(0,Math.min(100,(b.rel[a.id]||40)+d));}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{const D=deeds86();
  if(e&&e.raidOf!=null)D.help=(D.help||0)+1;
  if(e&&e.war49){const w=(world.wars||[]).find(q=>q.id===e.war49);if(w&&w.hero)D.fought=w.hero==="a"?w.a:w.b;}
}catch(_){}return r;};}
{const _ea=ensureArmy;ensureArmy=function(w){const had=w.army&&w.army.baseA;const A=_ea.apply(this,arguments);try{if(!had&&A){let n=0;
  for(const p of npcs){if(n>=2)break;if(!adult86(p)||p.role==="leader"||p.role==="guard"||p.enlisted||p.spouse===-1)continue;
    const k=kOf(p.s);if(k!==w.a&&k!==w.b)continue;if(goalOf(p)!=="enlist"&&trait86(p).brave<60)continue;
    p.enlisted=w.id;p.inside=true;n++;const msg=p.name+" of "+SETS[p.s].name+" enlisted with "+(KINGDOMS[k]&&KINGDOMS[k].name||"the crown")+".";
    try{addNews(p.s,msg);}catch(_){}postRumor(p.s,msg);}}}catch(e){console.warn("enlist",e);}return A;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{life86();}catch(e){console.warn("life86",e);}return r;};}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{if(state==="play"&&!room)gossip86();}catch(_){}return r;};}
window.__MIND86={trait:trait86,goal:goalOf,voice:voice86,life:life86,rumor:rumor86,deeds:()=>P&&P.deeds86};
