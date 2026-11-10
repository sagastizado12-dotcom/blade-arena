// ===== v89 HERO'S BLOOD =====
// His own children inherit a bloodline. While they are small it is only talent:
// a wooden sword, a handful of sparks, a race. They never fight and nothing targets them.
// Grown, they stand above ordinary folk and soldiers, and short of the hero in his prime.
const SOLDIER89={hp:6,atk:1,mag:0,spd:4};
const PERK89={sword:"Father's sword",flame:"Flame",storm:"Storm",gale:"Gale",flight:"Flight"};
function heroPrime(){
  const hp=typeof hpForLv==="function"?hpForLv(20):37;
  return {hp,atk:4,mag:4,spd:10};
}
function bloodKin(n){
  if(!n||!n.alive)return false;
  if(typeof ownChild==="function"&&ownChild(n))return true;
  if(n.heroKid&&!n.grandKid&&!n.desc)return true;
  return (n.parents||[]).some(id=>{const p=npcs.find(x=>x&&x.id===id);return p&&p.blood89;});
}
function choosePerk(){
  const xp=P&&P.mag&&P.mag.xp||{};
  let best="fireball",bv=-1;
  for(const k of ["fireball","thunder","air"]){const v=xp[k]||0;if(v>bv){bv=v;best=k;}}
  const sword=(P&&P.gear&&P.gear.sword)||0;
  const fly=P&&P.fly||0;
  if(bv>=3)return best==="fireball"?"flame":best==="thunder"?"storm":"gale";
  if(fly>=8&&fly>=sword*4)return "flight";
  return "sword";
}
function bloodShare(n){
  if(n.heroKid&&!n.grandKid&&!n.desc)return 1;
  if(typeof ownChild==="function"&&ownChild(n)&&!(n.grandKid||n.desc))return 1;
  const g=typeof genOf==="function"?genOf(n):2;
  return g<=1?1:g===2?0.82:0.68;
}
function ensureBlood(n){
  if(!bloodKin(n)||!world)return null;
  const age=n.age||0;
  if(!n.blood89)n.blood89={pot:null,perk:null,day:world.day,grown:0};
  const B=n.blood89;
  if(B.pot==null)B.pot=Math.min(100,age<3?26:age<13?34+age*4:72+(n.id%8));
  if(!B.perk)B.perk=choosePerk();
  if(!PERK89[B.perk])B.perk="sword";
  if(age<18){
    const span=Math.max(0,Math.min(20,(world.day||0)-(B.day==null?world.day:B.day)));
    if(span)B.pot=Math.min(100,B.pot+span*3);
    B.day=world.day;
    B.grown=0;
    B.hp=B.atk=B.mag=0;B.spd=4;
    return B;
  }
  const prime=heroPrime(),t=Math.max(0.62,Math.min(1,(B.pot||80)/100)),s=bloodShare(n);
  B.hp=Math.max(SOLDIER89.hp+10,Math.min(prime.hp-12,Math.round((16+8*t)*s)));
  B.atk=Math.max(SOLDIER89.atk+1,Math.min(prime.atk-1,Math.round((2+1.5*t)*s)));
  B.mag=Math.max(2,Math.min(prime.mag-1,Math.round((2+1.5*t)*s)));
  B.spd=Math.max(SOLDIER89.spd+2,Math.min(prime.spd-2,Math.round((6+2*t)*s)));
  B.grown=1;B.day=world.day;
  n.maxHp=B.hp;if(n.hp==null||n.hp>B.hp)n.hp=B.hp;if(n.hp<1)n.hp=B.hp;
  if((n.trainLv||0)<2)n.trainLv=2;
  return B;
}
function bloodCard(n){
  const B=ensureBlood(n);if(!B)return "";
  const nm=typeof kinName==="function"?kinName(n):n.name;
  const age=n.age||0;
  if(age<18){
    const act=["the wooden sword","magic sparks","footraces"][n.id%3];
    return nm+", age "+age+": Hero's blood · talent "+B.pot+"/100 · gifted at "+act+".";
  }
  return nm+", age "+age+": Hero's blood · HP "+B.hp+" ATK "+B.atk+" MAG "+B.mag+" SPD "+B.spd+" · "+PERK89[B.perk]+".";
}
function bloodPass(){if(!npcs)return;for(const n of npcs)if(n&&n.heroKid&&!n.grandKid)ensureBlood(n);for(const n of npcs)if(bloodKin(n))ensureBlood(n);}
function practiceKind(n){return n.id%3===0?"sword":n.id%3===1?"magic":"race";}
function practiceLine(n){
  const w=typeof dadWord==="function"?dadWord(n):"Dad";
  const k=practiceKind(n);
  if(k==="sword")return "I want to be strong like you, "+w+"!";
  if(k==="magic")return "Watch the sparks, "+w+"!";
  return "Race you, "+w+"! I'm getting fast!";
}
function kidTalent(n){
  if(!n||(n.age||0)<3||(n.age||0)>=18||!bloodKin(n))return;
  if(Math.hypot(n.x-hero.x,n.y-hero.y)>160)return;
  if(typeof childDanger==="function"&&childDanger(n))return;
  if(n.pracT>0){n.pracT--;
    const k=practiceKind(n);
    if(k==="race"){const a=(frameN+n.id)*0.18;n.x=hero.x+Math.cos(a)*28;n.y=hero.y+10+Math.sin(a)*10;n.anim=(n.anim||0)+1;}
    else if(k==="magic"&&n.pracT%6===0&&typeof burst==="function")burst(n.x+8,n.y+4,n.id%2?[255,150,60]:[160,190,255],4,1.2,1);
    return;}
  if(n._pracAt&&frameN-n._pracAt<240)return;
  n._pracAt=frameN||1;n.pracT=36;n.inside=false;
  try{if(typeof bubbles!=="undefined"){for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i];if(b&&b.n===n)bubbles.splice(i,1);}}say(n,practiceLine(n),120);}catch(_){}
}
function championTick(n){
  const B=n.blood89;if(!B||!B.grown||(n.age||0)<18)return;
  const withYou=(P.knights||[]).includes(n.id)||(P.party||[]).includes(n.id);
  if(!withYou||typeof BRAWL==="undefined"||!BRAWL.on||!BRAWL.war||!BRAWL.war.hero)return;
  if((n._champCd||0)>0){n._champCd--;return;}
  const enemy=BRAWL.war.hero==="a"?1:0;
  let best=null,bd=34;
  for(const m of BRAWL.men){if(!m||m.side!==enemy||m.hp<=0||m.fade||m.yield)continue;const d=Math.hypot(m.x-n.x,m.y-n.y);if(d<bd){bd=d;best=m;}}
  if(!best||typeof brawlHurt!=="function")return;
  n._champCd=40;
  const prime=heroPrime();
  brawlHurt(best,Math.min(2,B.atk,prime.atk-1),Math.atan2(best.y-n.y,best.x-n.x));
}
function keepBloodKidsHome(){
  if(!P)return;
  if(P.party)P.party=P.party.filter(id=>{const n=npcs.find(x=>x&&x.id===id);return !(n&&bloodKin(n)&&(n.age||18)<18);});
}
function bloodTick(){
  if(!hero||!npcs||state!=="play"||room||paused)return;
  if((frameN%45)===0){bloodPass();keepBloodKidsHome();}
  let practiced=0;
  for(const n of npcs){
    if(!bloodKin(n))continue;
    const B=ensureBlood(n);if(!B)continue;
    if((n.age||0)<18){if(practiced<1){kidTalent(n);if(n.pracT>0)practiced++;}}
    else championTick(n);
  }
}
function drawBlood(){
  if(!npcs)return;
  for(const n of npcs){
    if(!n.pracT||(n.age||0)>=18)continue;
    if(n.x<camX-30||n.y<camY-30||n.x>camX+W+30||n.y>camY+H+30)continue;
    const k=practiceKind(n);
    if(k==="sword"){ctx.save();ctx.translate(n.x+12,n.y+8);ctx.rotate(-0.8+(n.pracT%8<4?0.6:0));ctx.fillStyle="#8a5a32";ctx.fillRect(0,-1,9,2);ctx.fillStyle="#d8c090";ctx.fillRect(-2,-1.5,3,3);ctx.restore();}
    else if(k==="magic"){ctx.fillStyle=n.id%2?"#ffb060":"#b8d4ff";ctx.fillRect(n.x+4,n.y-6-(n.pracT%5),2,2);ctx.fillRect(n.x+10,n.y-8-(n.pracT%4),2,2);}
    else {ctx.fillStyle="#ffe08a";ctx.fillRect(n.x+2,n.y+14,3,1);}
  }
}
{const _ds=dadSpeech;dadSpeech=function(n){const line=_ds.apply(this,arguments);try{
  if(!n||!bloodKin(n))return line;
  const w=typeof dadWord==="function"?dadWord(n):"Dad";
  if((n.age||0)<18){const wish="I want to be strong like you, "+w+"!";const extra=practiceLine(n);return line+" "+wish+(extra===wish?"":" "+extra);}
  const B=ensureBlood(n);
  return line+" Hero's blood runs in me — "+(B?PERK89[B.perk]:"Father's sword")+".";
}catch(_){return line;}};}
{const _nh=npcHurt;npcHurt=function(n,d,a){if(n&&bloodKin(n)&&(n.age||18)<18)return false;return _nh.apply(this,arguments);};}
{const _ip=inviteParty;inviteParty=function(n){try{if(n&&ensureBlood(n)&&n.blood89.grown){
  const B=n.blood89;const cast=B.perk==="flame"||B.perk==="storm"||B.perk==="gale";
  if(!n.adv)n.adv={cls:cast?"mage":"knight",lvl:6,rank:3,xp:0,hp:B.hp,max:B.hp,state:"town",job:null,gold:0,kills:0};
  else{n.adv.max=B.hp;n.adv.hp=Math.min(n.adv.max,n.adv.hp||B.hp);if(n.adv.lvl<6)n.adv.lvl=6;}
  n.friend=Math.max(n.friend||0,60);
}}catch(_){}return _ip.apply(this,arguments);};}
{const _ph=updatePartyHud;updatePartyHud=function(){const r=_ph.apply(this,arguments);try{
  const el=document.getElementById("party");if(!el)return r;
  const bits=partyMembers().filter(n=>n.blood89&&n.blood89.grown).map(n=>`<div class="pm"><b>Hero's blood</b> <small>${n.name} HP ${n.blood89.hp} ATK ${n.blood89.atk} ${PERK89[n.blood89.perk]||""}</small></div>`);
  if(bits.length&&!el.innerHTML.includes("Hero's blood"))el.insertAdjacentHTML("beforeend",bits.join(""));
}catch(_){}return r;};}
{const _sm=showMenu;showMenu=function(t,x,b){try{
  if(typeof t==="string"&&typeof x==="string"&&npcs&&!/Hero's blood/.test(x)){
    if(/Family/.test(t)){
      const lines=npcs.filter(bloodKin).slice(0,8).map(bloodCard).filter(Boolean);
      if(lines.length)x=x+"\n\n"+lines.join("\n")+"\nStronger than a soldier (HP "+SOLDIER89.hp+", ATK "+SOLDIER89.atk+", SPD "+SOLDIER89.spd+"), and short of you in your prime.";
      if(Array.isArray(b)&&!b.some(o=>o&&o._blood)){
        for(const n of npcs.filter(k=>k.blood89&&k.blood89.grown&&(k.age||0)>=18).slice(0,3)){
          const nm=typeof kinName==="function"?kinName(n):n.name;
          b=[{_blood:1,l:"⚔ "+nm+" stands with you",f:()=>{ensureBlood(n);try{callToArms(n,true);}catch(_){}try{closeMenu();}catch(_){}}}].concat(b);
        }
      }
    }else if(/descendant|Skill /.test(x)){
      const hit=npcs.find(n=>bloodKin(n)&&n.name&&t.includes(n.name));
      if(hit)x=x+"\n\n"+bloodCard(hit);
    }
  }
}catch(_){}return _sm.call(this,t,x,b);};}
{const _pr=pickRegent;pickRegent=function(k){try{
  const D=npcs.filter(n=>n.alive&&n.blood89&&n.blood89.grown&&(n.age||0)>=25);
  if(D.length){const n=D.sort((a,b)=>(b.blood89.hp+b.blood89.atk*4)-(a.blood89.hp+a.blood89.atk*4))[0];
    return {name:n.name,id:n.id,title:(typeof isWoman==="function"&&isWoman(n)?"Lady":"Lord")+" Regent"};}
}catch(_){}return _pr.apply(this,arguments);};}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{bloodTick();}catch(e){console.warn("blood",e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&!room&&!(P&&P.fly>=28)){ctx.save();
  const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:1):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);drawBlood();ctx.restore();}}catch(e){try{ctx.restore();}catch(_){}}return r;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{bloodPass();}catch(_){}return r;};}
{const _fb=familyBirths;familyBirths=function(){const r=_fb.apply(this,arguments);try{bloodPass();}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r)bloodPass();}catch(_){}return r;};}
try{SAVE_DROP.add("pracT");SAVE_DROP.add("_pracAt");SAVE_DROP.add("_champCd");}catch(_){}
window.__BLOOD89={ensureBlood,bloodKin,bloodCard,heroPrime,choosePerk,practiceLine,SOLDIER89,PERK89};
