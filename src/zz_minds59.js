// ===== v59 NPC MINDS + ACTIVE KINGS + BRAVERY ON THE LINE =====
// Local utility AI only (no network). Weekly schedules stay soft goals.
// An NPC scores work / day off / shelter / flee / hide / celebrate / gossip / shop / help
// from personality, role, weather, war, festival, and danger, then walks the winner
// through the existing gate-aware pathing. Kings keep a tiny world.crown order
// (march, hold, crush, parley, court). Soldiers at a front use one bravery check:
// some hold, some break, and a king on the field can rally them.
// Kids are never romanceable (existing) and never take a hit; they shelter.
try{SAVE_DROP.add("_mk");SAVE_DROP.add("_md");SAVE_DROP.add("_ms");}catch(_){}
const M59_TEMPER={0:"bold",1:"proud",2:"cautious",3:"cruel",4:"bold",5:"cautious",6:"proud",7:"bold"};
let MIND_BUDGET=4;
const BFIELD={};const RFIELD={};
function mindTraits(n){const h=Math.imul((n.id+1),2246822519)>>>0;return{brave:h%100,duty:(h>>>8)%100,social:(h>>>16)%100,caution:(h>>>24)%100};}
function roleOf(n){
  if(!n)return"villager";
  if(n.role==="child"||(n.age||0)<18)return"child";
  if(n.role==="leader")return"leader";
  if(n.role==="guard"||n.post!=null)return"guard";
  if(n.adv)return"adventurer";
  try{if(n.spouse===-1||n.wife||(typeof isWife==="function"&&isWife(n)))return"wife";}catch(_){}
  if(n.role==="shopkeeper"||n.role==="innkeeper"||n.role==="merchant")return"merchant";
  if(n.role==="farmer"||n.role==="fisher")return"farmer";
  return"villager";
}
function mindSkip(n){
  if(!n||!n.alive||!world)return true;
  if(n.duelist||n.engage||n.down>0||n.soldierT)return true;
  if(n.adv&&n.adv.state==="travel")return true;
  if(typeof P!=="undefined"&&P){if((P.party||[]).includes(n.id)||(P.knights||[]).includes(n.id))return true;}
  if(n.heroKid&&typeof kidStage==="function"){try{if(kidStage(n)==="baby")return true;}catch(_){}}
  return false;
}
function anchor59(x,y,seed){x=x|0;y=y|0;const p=(typeof nearestWalk==="function"&&nearestWalk(x,y,8,seed||0))||[x,y];return{x:p[0],y:p[1]};}
function homeT(n){const b=buildings[n.home];if(!b){const S=SETS[n.s]||SETS[0];return{x:S.x*TILE,y:(S.y+1)*TILE};}return{...doorOf(b),inside:true,b:n.home};}
function squareT(n){const S=SETS[n.s];const f=typeof fountainOf==="function"?fountainOf(S):null;const cx=f?f.x:S.x,cy=f?f.y:S.y;const a=(n.id%6)/6*6.283;return{x:(cx+Math.cos(a)*2.2)*TILE,y:(cy+1.4+Math.sin(a)*1.2)*TILE};}
function shopT(n){const S=SETS[n.s];const id=S&&S.bIdx&&S.bIdx.find(b=>buildings[b]&&buildings[b].kind==="shop");if(id==null)return squareT(n);const d=doorOf(buildings[id]);return{x:d.x+(n.id%5-2)*8,y:d.y+8};}
function kidOut(n){const ws=world.sets[n.s];const danger=world.weather==="storm"||world.weather==="snow"||(ws&&(ws.raid||ws.dragon));if(!danger||!n)return null;
  for(const k of npcs){if(!k.alive||k.inside||k.s!==n.s)continue;if(k.role!=="child"&&(k.age||18)>=12)continue;if((k.parents||[]).includes(n.id))return k;}return null;}
function holeLive(sid){try{return typeof SING!=="undefined"&&SING&&SING.sid===sid;}catch(_){return false;}}
function townDanger(n){const ws=world.sets[n.s]||{};const k=typeof kOf==="function"?kOf(n.s):-1;
  let reb=null,warNear=false,atWarK=false;
  if(world.rebels)for(const r of world.rebels){if(r.over)continue;if(r.s===n.s)reb=r;if(r.k===k)atWarK=true;}
  if(world.wars)for(const w of world.wars){if(w.over)continue;if(w.a===k||w.b===k){atWarK=true;try{const f=frontOf(w);const S=SETS[n.s];if(S&&Math.hypot(f.x-S.x,f.y-S.y)<18)warNear=true;}catch(_){}}}
  const sie=n.s===MOD_ID&&world.mod&&world.mod.siege?world.mod.siege:null;
  if(sie)atWarK=true;
  return{reb,warNear,atWarK,sie,raid:ws.raid||ws.dragon,fest:ws.festival&&absMin()<ws.festival,hole:holeLive(n.s)||!!(ws.ruin&&ws.ruin.bh),ruin:!!(ws.ruin&&ws.ruin.bh)};
}
function nearHostile(n){if(typeof mobs==="undefined")return false;for(const m of mobs){if(m.dead||!m.def)continue;if(!(m.def.beh==="agg"||m.provoked||m.raider||m.demon))continue;if(Math.hypot(m.x-n.x,m.y-n.y)<110)return true;}return false;}
function heroFoe(n){try{const k=kOf(n.s);return k>=0&&typeof atWar==="function"&&atWar(k);}catch(_){return false;}}
function onDuty(n){try{return n.role==="guard"&&n.post!=null&&typeof onShift==="function"&&onShift(n);}catch(_){return false;}}
function workLine(n,role){const h=hour();
  if(role==="child")return"I'm going out to play.";
  if(role==="guard")return"My watch isn't over.";
  if(role==="merchant")return"The shop's open. Coin doesn't earn itself.";
  if(role==="farmer"&&season()===2&&h>=7&&h<17)return"The harvest won't wait — I'm staying in the field.";
  if(role==="farmer")return"The fields won't tend themselves. I'm working today.";
  if(role==="wife")return"I'll see to the house, then whatever the day still needs.";
  if(role==="adventurer")return"The guild board first, then wherever the road points.";
  if(role==="leader")return"The town needs a steady hand in the square today.";
  return"I've got work to do. The schedule says I'm on today.";}
function mindKey(n){const d=townDanger(n);const ko=kidOut(n);let nearP=0;if(hero){const dist=Math.hypot(hero.x-n.x,hero.y-n.y);nearP=dist<130?1:0;}
  let off=0;try{off=dayOff(n)?1:0;}catch(_){}
  const liveR=typeof raidActive==="function"&&raidActive(n.s)?1:0;
  return[world.weather,hour()|0,((world.day%7)+7)%7,d.fest?1:0,d.raid?1:0,liveR,d.sie?1:0,d.hole?1:0,d.reb?1:0,d.warNear?1:0,d.atWarK?1:0,nearHostile(n)?1:0,heroFoe(n)?nearP:0,off,season(),n.safe57?1:0,ko?1:0].join(":");}
function mindDecide(n){
  const role=roleOf(n),tr=mindTraits(n),kid=role==="child",h=hour(),dng=townDanger(n);
  const bravePost=onDuty(n)&&tr.brave>=48;
  let best={act:"work",score:-1,override:false,why:"schedule",line:workLine(n,role),thought:"",target:null};
  const put=(act,score,override,why,line,thought,target)=>{if(score>best.score)best={act,score,override,why,line,thought,target};};
  let off=false;try{off=!kid&&dayOff(n);}catch(_){}
  if(n.safe57)return{act:"shelter",score:100,override:false,why:"blackhole",line:"They hurried me out of town. I'm staying put.",thought:"stay here",target:null};
  if(off){let hobby="I'll keep the day for myself.";try{const sc=sched(n);hobby=["I'm off fishing.","Just browsing the market.","See you at the tavern later.","I'll say a prayer at the shrine.","I'm visiting family today.","A quiet day at home.","Off to see some friends."][sc.hob];}catch(_){}
    put("off",72,false,"dayoff","It's my day off. "+hobby,"day off",null);}
  else{let s=52;if(!kid&&h>=6&&h<21)s=60+tr.duty*0.18;if(role==="leader")s=Math.max(s,82);if(role==="farmer"&&season()===2&&h>=7&&h<17&&world.weather==="clear")s+=18;
    put(kid?"play":"work",kid?56:s,false,kid?"play":"schedule",workLine(n,role),kid?"play":"",null);}
  if(world.weather==="storm")put("shelter",kid?99:93,true,"storm","I'm heading home early because of the storm.","the storm…",homeT(n));
  else if(world.weather==="snow"&&(kid||tr.caution>=42))put("shelter",kid?90:70+tr.caution*0.15,true,"snow","Too cold to stay out. I'm going in.","the snow",homeT(n));
  else if(world.weather==="rain"&&(kid||tr.caution>=62))put("shelter",kid?84:58+tr.caution*0.22,true,"rain","This rain's too much — I'll finish the day at home.","the rain",homeT(n));
  if(dng.fest&&h>=9&&h<21)put("celebrate",bravePost?34:86+tr.social*0.04,!bravePost,"festival","The festival's on! Work can wait — I'm going to the square.","festival!",squareT(n));
  if(dng.hole){const live=holeLive(n.s);put("hide",98,true,"blackhole",live?"A black hole hangs over the town — I'm taking cover!":"A black hole ate the town. I'm keeping my head down.","the hole!",live?holeT(n):homeT(n));}
  if(dng.sie)put("hide",kid?99:94,true,"siege","Their army is at the walls. I'm hiding until it passes.","take cover",homeT(n));
  if(dng.raid){const live=typeof raidActive==="function"&&raidActive(n.s);
    if(live)put("hide",kid?99:92,false,"raid",kid?"Raiders! I'm staying with everyone at the fountain.":"Raiders! Everyone to the fountain — stay together.","the fountain",null);
    else put("hide",kid?99:92,!bravePost,"raid",kid?"I'm hiding!":"Raiders! I'm getting inside.","raiders!",homeT(n));}
  if(dng.reb)put("hide",kid?98:90,!bravePost,"rebellion","The streets aren't safe. I'm hiding until the rising passes.","stay hidden",homeT(n));
  if(dng.warNear&&!bravePost)put("hide",86+tr.caution*0.05,true,"war","The fighting is too close. I'm staying indoors.","the war",homeT(n));
  else if(dng.atWarK&&!bravePost&&!kid&&tr.caution>=58&&h>=15&&h<21)put("shelter",76,true,"war","With the war on, I'm closing up early.","war worries",homeT(n));
  if(nearHostile(n))put("flee",kid?99:74+(100-tr.brave)*0.18,!(bravePost&&tr.brave>=60),"danger","There's something dangerous — I'm running!","run!",homeT(n));
  const child=kidOut(n);
  if(child&&!kid)put("help",96,true,"family","I'm fetching "+child.name+" home.", "the little one", Math.hypot(n.x-child.x,n.y-child.y)>28?{x:child.x,y:child.y}:homeT(n));
  if(!kid&&role!=="leader"&&!dng.raid&&!dng.hole&&!dng.sie&&!dng.reb&&world.weather==="clear"&&h>=16&&h<19&&tr.social>=70&&tr.duty<42){const fr=friendOf(n);
    put("gossip",68+tr.social*0.08,true,"friends",fr?"I'm going to see "+fr.name+" — I heard something.":"I should find someone and pass on what I heard.","must talk",fr?visitT(fr):shopT(n));}
  if(!kid&&role!=="merchant"&&role!=="guard"&&role!=="leader"&&!dng.raid&&!dng.hole&&world.weather!=="storm"&&h>=11&&h<15&&tr.duty<30&&tr.social>=48)
    put("shop",64,true,"errand","I need a few things from the market before it closes.","the market",shopT(n));
  if(hero&&heroFoe(n)&&Math.hypot(hero.x-n.x,hero.y-n.y)<120)
    put("flee",kid?97:85,!bravePost,"player",kid?"I'm scared. I'm going home.":"You're no friend of this crown — I'm getting inside!","stay back",homeT(n));
  if(hero&&!heroFoe(n)&&!kid&&role!=="leader"&&n.friend>=45&&tr.social>=62&&tr.duty<50&&h>=12&&h<18&&world.weather==="clear"&&!dng.raid&&!dng.hole&&!dng.sie&&Math.hypot(hero.x-n.x,hero.y-n.y)<46)
    put("gossip",63,true,"player","I was hoping I'd see you — have you heard the news?","oh, hello",{x:hero.x+18,y:hero.y+10});
  if(bravePost&&best.override&&best.why!=="blackhole"&&(best.act==="shelter"||best.act==="hide"||best.act==="flee"||best.act==="help"))
    best={act:"stand",score:best.score,override:false,why:"duty",line:world.weather==="storm"?"Storm or no storm, I hold this post.":"I hold this post. Fear can wait.",thought:"my post",target:null};
  return best;
}
function friendOf(n){let best=null,bv=35;for(const o of npcs){if(o===n||!o.alive||o.s!==n.s||o.home===n.home||(o.age||0)<18)continue;const rel=(n.rel&&n.rel[o.id])||0;const fam=(n.spouse&&n.spouse===o.id)||(o.parents||[]).includes(n.id)||(n.parents||[]).includes(o.id);const sc=rel+(fam?50:0);if(sc>bv){bv=sc;best=o;}}return best;}
function visitT(o){const b=buildings[o.home];if(!b)return squareT(o);const d=doorOf(b);return{x:d.x,y:d.y+4};}
function holeT(n){try{if(typeof SING!=="undefined"&&SING){const dx=n.x-SING.x||1,dy=n.y-SING.y||0,D=Math.hypot(dx,dy)||1;return anchorPx(n.x+dx/D*140,n.y+dy/D*100,n.id);}}catch(_){}return homeT(n);}
function anchorPx(px,py,seed){const p=anchor59(px/TILE,py/TILE,seed);return{x:p.x*TILE+1,y:p.y*TILE};}
function mindOf(n,force){if(!n||!world)return{act:"",override:false,why:"",line:"",thought:"",target:null};
  if(mindSkip(n))return{act:"busy",override:false,why:"busy",line:"",thought:"",target:null};
  const key=mindKey(n);if(!force&&n._mk===key&&n._md)return n._md;
  let d;try{d=mindDecide(n);}catch(e){d={act:"work",override:false,why:"schedule",line:"",thought:"",target:null};}
  n._mk=key;n._md=d;if(d.act)n.doing=d.act;return d;}
function mindPath(n,t){try{
  if(!t)return t;if(typeof room!=="undefined"&&room)return t;
  if(Math.hypot((n.x||0)-hero.x,(n.y||0)-hero.y)>520)return t;
  const [sx,sy]=ntile(n);let gx=Math.floor(((t.x||0)+7)/TILE),gy=Math.floor(((t.y||0)+8)/TILE);
  if(typeof walk==="function"&&!walk(gx,gy)){const p=nearestWalk(gx,gy,8,n.id);if(p){gx=p[0];gy=p[1];t={...t,x:p[0]*TILE+1,y:p[1]*TILE};}}
  if(Math.abs(sx-gx)+Math.abs(sy-gy)<=1)return t;
  if(!(n._noLos>frameN)&&typeof losClear==="function"&&losClear(sx,sy,gx,gy))return t;
  const far=Math.abs(sx-gx)+Math.abs(sy-gy);
  if(MIND_BUDGET>0&&far<=70&&typeof findPath==="function"){MIND_BUDGET--;const key="m"+gx+","+gy;let P2=n._pt;
    if(!P2||P2.k!==key||frameN-(P2.t||0)>500){const r=findPath(sx,sy,gx,gy);n._pt=P2={k:key,t:frameN,pts:r&&r.path&&r.path.length?pathPoints(r.path):null,i:0};}
    if(P2&&P2.pts&&P2.pts.length)return wp(n,P2,t);}
  const dx=Math.sign(gx-sx),dy=Math.sign(gy-sy);
  for(const [a,c] of [[dx,dy],[dx,0],[0,dy],[-dy,dx],[dy,-dx]]){if((a||c)&&walk(sx+a,sy+c))return{x:(sx+a)*TILE+1,y:(sy+c)*TILE+1};}
  return t;}catch(_){return t;}}
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&world&&!mindSkip(n)){
  // A live raid already gathers civilians at the fountain. Don't send them home instead.
  if(!(typeof raidActive==="function"&&raidActive(n.s)&&n.role!=="guard"&&!n.guard&&!n.soldier)){const d=mindOf(n);if(d&&d.override&&d.target)return mindPath(n,d.target);}}}catch(e){console.warn("mind",e);}return _nt.apply(this,arguments);};}
function keepTitle(L){const t=L.findIndex((s,i)=>i>3&&typeof s==="string"&&(s.indexOf("You're the ")>=0||s.indexOf("They say you're the ")>=0));if(t>3){const line=L.splice(t,1)[0];L.splice(1,0,line);}}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(Array.isArray(L)&&n&&world){const d=mindOf(n);
  // Only real plan changes. Routine work and days off already have schedule lines, and talk() shows four lines.
  if(d&&d.line&&(d.override||d.act==="stand")){L.splice(1,0,d.line);keepTitle(L);}
  if(n.role==="leader"){const K=KINGDOMS.find(k=>k.cap===n.s);const C=K&&world.crown&&world.crown[K.id];if(C&&C.o&&C.o!=="court"){L.splice(1,0,orderLine(K.id,C.o,C.why));keepTitle(L);}}}}catch(_){}return L;};}
{const _nh=npcHurt;npcHurt=function(n,d,a){if(n&&(n.role==="child"||(n.age||0)<18))return false;return _nh.apply(this,arguments);};}
// ----- kings: a few numbers per crown, decisions the player can read -----
function temperOf(k){return M59_TEMPER[k]||"bold";}
function capitalAnchor(k){const K=KINGDOMS[k],S=SETS[K.cap];const c=typeof CASTLES!=="undefined"&&CASTLES.find(c=>c.s===K.cap||c.k===k);return anchor59(c?c.x+2:S.x,c?c.y+(c.h||3)+1:S.y+2,k+3);}
function frontGoal(w,k){const f=frontOf(w);const back=w.a===k?-1:1;const x=Math.round(f.x+Math.cos(f.ang)*back*6),y=Math.round(f.y+Math.sin(f.ang)*back*6);return anchor59(x,y,k+w.id);}
function losing(w,k){return w.a===k?w.p<=-0.55:w.p>=0.55;}
function orderLine(k,o,why){const R=KINGDOMS[k],cap=SETS[R.cap].name;
  if(o==="march"&&why==="siege")return`${R.ruler} marches with the host to the siege of Moderno.`;
  if(o==="march")return`${R.ruler} takes the field and marches ${R.name}'s host to the front.`;
  if(o==="hold"&&why==="war")return`${R.ruler} stays in ${cap} and orders the walls held.`;
  if(o==="hold"&&why==="citadel")return`${R.ruler} directs the legions from the citadel.`;
  if(o==="hold"&&why==="rebellion")return`${R.ruler} holds ${cap} and sends reserves to the rising.`;
  if(o==="crush")return`${R.ruler} rides out to put down the rising in ${why}.`;
  if(o==="parley")return`${R.ruler} has seen enough blood and sues for peace.`;
  return`${R.ruler} holds court in ${cap}.`;}
function heroNearTile(x,y){return hero&&Math.hypot(x*TILE-hero.x,y*TILE-hero.y)<520;}
function setKing(k,o,why,dest){world.crown=world.crown||{};const prev=world.crown[k]||{};const changed=prev.o!==o||prev.why!==why;
  const C=world.crown[k]={o,why,x:prev.x!=null?prev.x:dest.x,y:prev.y!=null?prev.y:dest.y,gx:dest.x,gy:dest.y,d:world.day};
  if(!heroNearTile(C.x,C.y)&&Math.abs(C.gx-C.x)+Math.abs(C.gy-C.y)>28){C.x=dest.x;C.y=dest.y;}
  if(changed&&o!=="court"){const line=orderLine(k,o,why);try{addNews(KINGDOMS[k].cap,line);}catch(_){}try{jAdd(line,"war");}catch(_){}try{if(heroNearTile(C.x,C.y)||heroNearTile(dest.x,dest.y))toast("♛ "+line);}catch(_){}}
  return C;}
function kingThink(){if(!world||!world.sets)return null;try{W49();}catch(_){}world.crown=world.crown||{};const peace={};
  for(const K of KINGDOMS){if(K.demon||temperOf(K.id)!=="cautious")continue;for(const w of world.wars||[]){if(w.over||(w.a!==K.id&&w.b!==K.id))continue;if(world.day-(w.day||0)<8||!losing(w,K.id))continue;
    const side=w.a===K.id?"a":"b";if(w.hero===side)continue;try{endWar(w,world.day-w.day>24?"peace":"truce");}catch(_){}peace[K.id]=1;}}
  for(const K of KINGDOMS){const k=K.id;
    if(peace[k]){setKing(k,"parley","peace",capitalAnchor(k));continue;}
    if(K.demon){setKing(k,"hold","citadel",capitalAnchor(k));continue;}
    const reb=(world.rebels||[]).find(r=>!r.over&&r.k===k);
    const wars=(world.wars||[]).filter(w=>!w.over&&(w.a===k||w.b===k));
    if(reb){const S=SETS[reb.s];if((reb.cs||0)>=(reb.rs||1)*0.85)setKing(k,"crush",S.name,anchor59(S.x,S.y+(S.r||6)+2,k));else setKing(k,"hold","rebellion",capitalAnchor(k));continue;}
    if(wars.length){const w=wars.slice().sort((a,b)=>(losing(b,k)?1:0)-(losing(a,k)?1:0))[0];
      if(losing(w,k)&&temperOf(k)!=="bold")setKing(k,"hold","war",capitalAnchor(k));else setKing(k,"march","war",frontGoal(w,k));continue;}
    if(world.mod&&world.mod.siege&&world.mod.siege.k===k){const S=SETS[MOD_ID];setKing(k,"march","siege",anchor59(S.x,S.y+(S.r||8)+6,k));continue;}
    setKing(k,"court","peace",capitalAnchor(k));}
  return world.crown;}
function kingStep(k){const C=world.crown&&world.crown[k];if(!C||(C.x===C.gx&&C.y===C.gy))return C;const dist=Math.abs(C.x-C.gx)+Math.abs(C.y-C.gy);const near=heroNearTile(C.x,C.y);
  if(dist>22&&!near){const nx=C.x+Math.sign(C.gx-C.x)*Math.min(12,Math.abs(C.gx-C.x)),ny=C.y+Math.sign(C.gy-C.y)*Math.min(12,Math.abs(C.gy-C.y));const p=anchor59(nx,ny,k);C.x=p.x;C.y=p.y;return C;}
  const dx=Math.sign(C.gx-C.x),dy=Math.sign(C.gy-C.y);
  for(const [a,c] of [[dx,dy],[dx,0],[0,dy],[-dy,dx],[dy,-dx]]){if((a||c)&&walk(C.x+a,C.y+c)){C.x+=a;C.y+=c;return C;}}
  return C;}
function kingLook(id){const K=KINGDOMS[id];const base=(typeof RULER_LOOK!=="undefined"&&RULER_LOOK[id])||chibiLook(9100+id,K.fem?"noble":"guard","human");return{...base,cloth:K.rgb};}
// ----- bravery: one rule for the roster, the knights, and the menu -----
// Slots are banded so every line has cowards and veterans (still jittered per war).
function soldierOf(w,side,i){const h=Math.imul((w.id*17+1)*(side+3)+i*13+9,2246822519)>>>0;const band=[8,22,37,55,71,88][i%6];
  return{i,side,brv:Math.max(0,Math.min(99,band+((h>>>4)%11)-5)),cap:i===5,k:side?w.b:w.a};}
function soldierWill(brv,pressure,rally,cap){brv=Math.max(0,Math.min(99,brv|0));pressure=Math.max(0,Math.min(1,+pressure||0));
  let panic=30+(100-brv)*0.48+pressure*36-(cap?22:0)-(rally?16:0);
  if(brv>=78&&pressure<0.92&&panic<78)return"hold";
  return panic>=64?"flee":"hold";}
function kingRallies(k,f){const C=world.crown&&world.crown[k];if(!C||(C.o!=="march"&&C.o!=="crush"))return false;return Math.hypot((C.x||0)-f.x,(C.y||0)-f.y)<=10;}
function slotPos(w,m){const f=frontOf(w);const ang=f.ang,nx=-Math.sin(ang),ny=Math.cos(ang);const dir=m.side===0?-1:1;const back=m.st==="flee"?72:(m.st==="rally"?44:24);const along=(m.i-2.5)*13;
  return{x:f.x*TILE+Math.cos(ang)*dir*back+nx*along,y:f.y*TILE+Math.sin(ang)*dir*back+ny*along};}
function battleReset(w){if(w)delete BFIELD[w.id];}
function battleEnsure(w){let B=BFIELD[w.id];if(B)return B;const men=[];for(let side=0;side<2;side++)for(let i=0;i<6;i++)men.push({...soldierOf(w,side,i),st:"",x:0,y:0});return BFIELD[w.id]={men,cd:0,said:null};}
function battleStep(w){if(!w||w.over)return null;const B=battleEnsure(w);const f=frontOf(w);const rally=[kingRallies(w.a,f),kingRallies(w.b,f)];const pressure=[Math.max(0,-w.p),Math.max(0,w.p)];const flee=[0,0],hold=[0,0];
  for(const m of B.men){const will=soldierWill(m.brv,pressure[m.side],rally[m.side],m.cap);m.st=(m.st==="flee"&&will==="hold")?"rally":will;if(m.st==="flee")flee[m.side]++;else hold[m.side]++;}
  for(const m of B.men){const p=slotPos(w,m);if(!m.x){m.x=p.x;m.y=p.y;}else{m.x+=(p.x-m.x)*0.5;m.y+=(p.y-m.y)*0.5;}}
  let dp=0;if(B.cd<=0){if(flee[0]>=4&&flee[0]>flee[1]){w.p=Math.max(-1,w.p-0.07);dp=-0.07;B.cd=3;}else if(flee[1]>=4&&flee[1]>flee[0]){w.p=Math.min(1,w.p+0.07);dp=0.07;B.cd=3;}}else B.cd--;
  if(dp&&B.said!==world.day){B.said=world.day;const who=dp>0?KINGDOMS[w.b].name:KINGDOMS[w.a].name;try{addNews(-1,`The soldiers of ${who} break and fall back!`);}catch(_){}}
  if(w.p>=1){try{capture(w,w.a,w.b);}catch(_){}}else if(w.p<=-1){try{capture(w,w.b,w.a);}catch(_){}}
  B.sum={flee,hold,dp,rally};return B;}
function battleMen(w){const B=BFIELD[w.id];return B?B.men.map(m=>({...m})):[]}
function fieldReport(w){const f=frontOf(w);const rally=[kingRallies(w.a,f),kingRallies(w.b,f)];let h0=0,f0=0,h1=0,f1=0;
  for(let side=0;side<2;side++)for(let i=0;i<6;i++){const s=soldierOf(w,side,i);const p=side?Math.max(0,w.p):Math.max(0,-w.p);const st=soldierWill(s.brv,p,rally[side],s.cap);if(side){if(st==="flee")f1++;else h1++;}else{if(st==="flee")f0++;else h0++;}}
  const rk=rally[0]||rally[1]?" A crown is on the field — some who ran are steadying.":"";
  return`${KINGDOMS[w.a].name} ${h0} stand / ${f0} flee · ${KINGDOMS[w.b].name} ${h1} stand / ${f1} flee.${rk}`;}
function rebelReset(r){if(r)delete RFIELD[r.s];}
function rebelSoldier(r,side,i){const h=Math.imul((r.s+3)*19+side*7+i*11,2246822519)>>>0;const band=[8,22,37,55,71,88][i%6];return{i,side,brv:Math.max(0,Math.min(99,band+((h>>>4)%11)-5-(side?10:0))),cap:side===0&&i===5,k:side?-1:r.k};}
function rebelEnsure(r){let B=RFIELD[r.s];if(B)return B;const men=[];for(let side=0;side<2;side++)for(let i=0;i<6;i++)men.push({...rebelSoldier(r,side,i),st:"",x:0,y:0});return RFIELD[r.s]={men};}
function rebelStep(r){if(!r||r.over)return null;const B=rebelEnsure(r);const S=SETS[r.s];const rally=!!(S&&kingRallies(r.k,{x:S.x,y:S.y}));const pc=Math.max(0,Math.min(1,((r.rs||1)-(r.cs||1))/6));const pr=Math.max(0,Math.min(1,((r.cs||1)-(r.rs||1))/6));
  for(const m of B.men){const will=soldierWill(m.brv,m.side?pr:pc,m.side?false:rally,m.cap);m.st=(m.st==="flee"&&will==="hold")?"rally":will;const dir=m.side?1:-1;const back=m.st==="flee"?5:1.4;m.x=(S.x+dir*((S.r||6)+back))*TILE;m.y=(S.y+(m.i-2.5)*2)*TILE;}
  return B;}
function rebelMen(r){const B=RFIELD[r.s];return B?B.men.map(m=>({...m})):[]}
function crownNote(){if(!world||!world.crown)return"";const L=[];for(const K of KINGDOMS){const C=world.crown[K.id];if(!C||C.o==="court")continue;L.push("♛ "+orderLine(K.id,C.o,C.why));}return L.join("\n");}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(typeof x==="string"&&world){
  if(x.indexOf("Front between")>=0&&x.indexOf("On the field")<0){const lines=[];for(const w of world.wars||[])if(!w.over){try{lines.push(fieldReport(w));}catch(_){}}if(lines.length)x+="\n\nOn the field:\n"+lines.join("\n");}
  if((t==="⚔ Wars & Rebellions"||(typeof x==="string"&&x.indexOf("Front between")>=0))&&x.indexOf("Crown orders")<0){const c=crownNote();if(c)x+="\n\nCrown orders:\n"+c;}}}catch(_){}return _sm.call(this,t,x,b);};}
{const _um=updateMob;updateMob=function(e){try{if(e&&e.war49&&!e.dead&&world){if(e.brv==null)e.brv=(hash2(e.x|0,e.y|0,e.war49||1)*100)|0;const w=(world.wars||[]).find(q=>q.id===e.war49&&!q.over);
  if(w){const side=e.kingdom===w.b?1:0;const f=frontOf(w);const pressure=side?Math.max(0,w.p):Math.max(0,-w.p);if(soldierWill(e.brv,pressure,kingRallies(side?w.b:w.a,f),false)==="flee")e.warFlee=28;}
  if(e.warFlee>0){e.warFlee--;const w2=(world.wars||[]).find(q=>q.id===e.war49);if(w2){const f=frontOf(w2);const dx=e.x-f.x*TILE,dy=e.y-f.y*TILE,D=Math.hypot(dx,dy)||1;moveEntity(e,dx/D*1.7,dy/D*1.7);e.dir=dx<0?1:2;return;}}}}catch(_){}return _um.apply(this,arguments);};}
function mindChatter(){if(!hero||room)return;const near=[];for(const n of npcs){if(!n.alive||n.inside)continue;if(Math.abs(n.x-hero.x)>300||Math.abs(n.y-hero.y)>200)continue;near.push(n);}near.sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y));
  let said=0;for(const n of near){if(said>=2)break;const d=n._md||mindOf(n);if(!d||!d.line)continue;const k=d.act+"|"+d.why;if(n._ms===k)continue;n._ms=k;if(d.act==="work"||d.act==="play"||d.act==="busy")continue;try{say(n,d.line,170);}catch(_){}said++;}}
function mindAfter(){if(typeof state==="undefined"||state!=="play"||!world||!hero||room)return;
  if(frameN%12===0&&world.crown)for(const K of KINGDOMS){try{kingStep(K.id);}catch(_){}}
  if(frameN%24===0){for(const w of world.wars||[])if(!w.over){try{const f=frontOf(w);if(Math.hypot(f.x*TILE-hero.x,f.y*TILE-hero.y)<700)battleStep(w);}catch(_){}}
    for(const r of world.rebels||[])if(!r.over){try{const S=SETS[r.s];if(S&&Math.hypot(S.x*TILE-hero.x,S.y*TILE-hero.y)<640)rebelStep(r);}catch(_){}}}
  if(frameN%45===0){try{mindChatter();}catch(_){}}}
{const _u=update;update=function(){MIND_BUDGET=4;const r=_u.apply(this,arguments);try{mindAfter();}catch(e){console.warn("mind",e);}return r;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{kingThink();}catch(e){console.warn("king",e);}return r;};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{kingThink();}catch(e){console.warn(e);}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r&&world)kingThink();}catch(e){console.warn(e);}return r;};}
function thoughtBubble(x,y,t){ctx.fillStyle="rgba(255,255,255,.95)";ctx.beginPath();ctx.arc(x-7,y+7,1.6,0,7);ctx.arc(x-3,y+3,2.4,0,7);ctx.fill();
  const w=Math.min(86,ctx.measureText(t).width+8);ctx.fillStyle="#fffef8";ctx.strokeStyle="#5a4030";ctx.lineWidth=1;ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(x-w/2,y-16,w,12,4);else ctx.rect(x-w/2,y-16,w,12);ctx.fill();ctx.stroke();ctx.fillStyle="#2a1a12";ctx.fillText(t,x,y-7);}
function tagAt(x,y,t,col){ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.lineWidth=2;ctx.strokeStyle="#000";ctx.strokeText(t,x,y);ctx.fillStyle=col||"#fff";ctx.fillText(t,x,y);}
function drawMindWorld(){if(!world||room)return;ctx.font="bold 7px system-ui";ctx.textAlign="center";
  const thoughts=[];for(const n of npcs){if(!n.alive||n.inside||!n._md||!n._md.thought)continue;if(n._md.act==="work"||n._md.act==="play"||n._md.act==="busy")continue;if(Math.abs(n.x-hero.x)>320||Math.abs(n.y-hero.y)>210)continue;thoughts.push([Math.hypot(n.x-hero.x,n.y-hero.y),n]);}
  thoughts.sort((a,b)=>a[0]-b[0]);for(const [,n] of thoughts.slice(0,6))thoughtBubble(n.x+8,n.y-20,n._md.thought);
  if(world.crown)for(const K of KINGDOMS){const C=world.crown[K.id];if(!C)continue;const x=C.x*TILE+8,y=C.y*TILE+4;if(x<camX-30||y<camY-40||x>camX+W+30||y>camY+H+30)continue;
    try{drawChibi(kingLook(K.id),x,y,(C.gx>C.x?2:C.gx<C.x?1:0),(frameN>>3)%2,1);}catch(_){}
    ctx.fillStyle="#ffd84a";ctx.strokeStyle="#6a4a10";ctx.lineWidth=1;ctx.beginPath();const cy=y-30;ctx.moveTo(x-5,cy+3);ctx.lineTo(x-5,cy-1);ctx.lineTo(x-2,cy+1);ctx.lineTo(x,cy-4);ctx.lineTo(x+2,cy+1);ctx.lineTo(x+5,cy-1);ctx.lineTo(x+5,cy+3);ctx.closePath();ctx.fill();ctx.stroke();
    const tag=C.o==="march"?"marching":C.o==="hold"?"directing":C.o==="crush"?"riding out":C.o==="parley"?"seeking peace":"holding court";tagAt(x,y-36,(K.ruler.split(" ").pop())+" · "+tag,K.col);}
  for(const w of world.wars||[]){if(w.over)continue;const B=BFIELD[w.id];if(!B)continue;let fleeN=0,holdN=0,runLab=0,holdLab=0;const f=frontOf(w);
    for(const m of B.men){if(!m.x)continue;if(m.x<camX-20||m.y<camY-20||m.x>camX+W+20||m.y>camY+H+20)continue;const K=KINGDOMS[m.k]||KINGDOMS[0];
      ctx.fillStyle=m.st==="flee"?"rgba(210,36,36,.45)":"rgba(36,150,64,.4)";ctx.fillRect(m.x-7,m.y+2,14,3);
      try{const L={...chibiLook(8000+w.id*30+m.i+m.side*9,"guard","human"),cloth:K.rgb};drawChibi(L,m.x,m.y-(m.st==="flee"&&(frameN%8<4)?2:0),m.st==="flee"?(m.side?2:1):(m.side?1:2),(frameN>>2)%2,0.92);}catch(_){}
      if(m.st==="flee"){fleeN++;ctx.strokeStyle="rgba(255,255,255,.85)";ctx.beginPath();ctx.moveTo(m.x-10,m.y-2);ctx.lineTo(m.x-16,m.y);ctx.stroke();if(runLab++<1)tagAt(m.x,m.y-24,"Run!","#ffd0d0");}
      else{holdN++;ctx.strokeStyle="#f2f2f2";ctx.beginPath();ctx.moveTo(m.x+3,m.y-8);ctx.lineTo(m.x+3+(m.side?-9:9),m.y-16);ctx.stroke();if(m.brv>=70&&holdLab++<1)tagAt(m.x,m.y-24,"Hold!","#e8ffe8");}}
    if(fleeN+holdN)tagAt(f.x*TILE,f.y*TILE-40,fleeN>=4?"The line is breaking!":"The line holds.",fleeN>=4?"#ffb0a0":"#fff");}
  for(const r of world.rebels||[]){if(r.over)continue;const B=RFIELD[r.s];if(!B)continue;const K=KINGDOMS[r.k];
    for(const m of B.men){if(!m.x||m.x<camX-20||m.y<camY-20||m.x>camX+W+20||m.y>camY+H+20)continue;
      ctx.fillStyle=m.st==="flee"?"rgba(210,36,36,.45)":"rgba(36,150,64,.4)";ctx.fillRect(m.x-7,m.y+2,14,3);
      try{const cloth=m.side?[150,64,48]:(K?K.rgb:[80,80,120]);drawChibi({...chibiLook(6000+r.s*10+m.i+m.side,"guard","human"),cloth},m.x,m.y,m.side?1:2,(frameN>>2)%2,0.9);}catch(_){}
      if(m.st==="flee")tagAt(m.x,m.y-22,"Run!","#ffd0d0");else if(m.cap)tagAt(m.x,m.y-22,"Hold!","#e8ffe8");}}}
{const _d=draw;draw=function(){_d.apply(this,arguments);try{if(typeof state==="undefined"||state!=="play"||!world||!hero||room)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);drawMindWorld();ctx.restore();}catch(e){try{ctx.restore();}catch(_){}}};}
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{if(!world||!world.crown)return;const c=document.getElementById("mapc");if(!c)return;const g=c.getContext("2d");
  for(const K of KINGDOMS){const C=world.crown[K.id];if(!C)continue;const p=mapToScreen(C.x,C.y);g.font="bold 13px system-ui";g.textAlign="center";g.lineWidth=3;g.strokeStyle="#000";g.strokeText("♛",p.x,p.y-10);g.fillStyle=K.col;g.fillText("♛",p.x,p.y-10);}}catch(_){}};}
window.__MIND59={mindOf,mindTraits,mindDecide,roleOf,soldierWill,soldierOf,battleStep,battleMen,battleReset,battleEnsure,fieldReport,rebelStep,rebelMen,rebelReset,kingThink,kingStep,orderLine,capitalAnchor,frontGoal,losing,temperOf,kingRallies,crown:()=>world&&world.crown,TEMPER:M59_TEMPER,homeT,squareT};
