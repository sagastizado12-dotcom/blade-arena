// ===== v88 THE HERO'S CHILDREN =====
// His own children know him. They run up, wave, and say Dad or Father.
// After the legacy passes to a descendant, only that person's children say Dad.
// Siblings and parents use those words instead. Children stay out of combat.
try{SAVE_DROP.add("_dadAt");SAVE_DROP.add("waveT");}catch(_){}
function heroSelf(){return P&&P.legacyAs!=null?P.legacyAs:null;}
function ownChild(n){if(!n||!n.alive||!P)return false;const pars=n.parents||[];const me=heroSelf();
  if(me!=null)return pars.includes(me);
  if(pars.includes(-1))return true;
  if((P.kids||[]).includes(n.id))return true;
  return !!(n.heroKid&&!n.grandKid&&!n.desc);}
function kinRel(n){if(!n||!P)return null;if(ownChild(n))return"child";
  const me=heroSelf();if(me==null){if(n.grandKid||n.desc)return"descendant";if((P.wives||[]).includes(n.id)||P.spouse===n.id)return"spouse";return null;}
  const self=npcs.find(x=>x.id===me);if(!self)return null;
  const mine=self.parents||[];
  if(mine.includes(n.id))return"parent";
  if(n.id!==me&&(n.parents||[]).some(id=>id!==-1&&mine.includes(id)))return"sibling";
  if(n.heroKid&&!ownChild(n))return"elder";
  return null;}
function nobleRaised(n){if(!n)return false;if(n.career==="knight"||n.job==="knight"||n.role==="leader")return true;
  if(P&&P.king)return true;const o=otherParent(n);return !!(o&&(o.role==="leader"||o.career==="knight"||o.job==="knight"));}
function dadWord(n){const age=n.age||0,noble=nobleRaised(n);
  if(age>=18)return"Father";
  if(age>=13)return(noble||n.id%3!==0)?"Father":"Dad";
  if(noble)return n.id%4===0?"Dad":"Father";
  if(n.id%7===0)return"Father";
  return"Dad";}
function kinName(n){return n&&n.name?String(n.name).replace(/\s*\([MF]\)\s*$/,""):"";}
function otherParent(n){return (n.parents||[]).map(id=>npcs.find(p=>p&&p.id===id)).find(p=>p&&p.id!==-1&&p.id!==heroSelf())||null;}
function mySiblings(n){return npcs.filter(s=>s&&s.alive&&s!==n&&ownChild(s));}
function dadGreet(n){const w=dadWord(n),age=n.age||0,gone=world.day-(n.dadLast==null?world.day:n.dadLast);
  if(gone>2)return"You were gone so long, "+w+"!";
  if(age>=18)return w+", I can come with you.";
  if(age>=13)return n.id%2?"Father, you're home!":"Hi Father!";
  return n.id%3===0?w+", look what I found!":n.id%3===1?"Hi "+w+"!":w+"!";}
function dadSpeech(n){const w=dadWord(n),age=n.age||0;
  const o=otherParent(n),sib=mySiblings(n)[0];
  const home=SETS[n.s]?SETS[n.s].name:"home";
  const bits=[dadGreet(n)];
  const fam=[];
  if(o&&o.alive)fam.push(kinName(o).split(" ")[0]+" is home in "+home);
  else fam.push("I was home in "+home);
  if(sib)fam.push("I was with "+kinName(sib).split(" ")[0]);
  bits.push(fam.join(", and ")+".");
  const D=P&&P.deeds86;if(D&&D.fought)bits.push("I heard you fought at the front!");
  else if(typeof atWarHome==="function"&&atWarHome(n))bits.push("I worried while you were away at the war.");
  if(age<13)bits.push(n.id%2?"Can we play, "+w+"?":"Will you bring me a little gift, "+w+"?");
  else if(age<18)bits.push("School was good today, "+w+".");
  else bits.push("The house is yours whenever you want it, "+w+".");
  return bits.slice(0,4).join(" ");}
function kinSpeech(n){const rel=kinRel(n);if(rel==="child")return dadSpeech(n);
  if(rel==="sibling"){const sx=typeof sexOf==="function"&&sexOf(n)==="F"?"sister":"brother";const home=SETS[n.s]?SETS[n.s].name:"home";return"It's your "+sx+". I kept the house in "+home+" while you were away.";}
  if(rel==="parent")return"My child. Come in. Your little ones have been waiting at the door.";
  if(rel==="elder")return"You have your father's walk. The children at home still play in the yard.";}
function kinShield(n){if(!n)return false;if((n.age||18)<18||n.role==="child"||n.heroKid||n.grandKid)return true;const r=kinRel(n);return r==="child"||r==="sibling"||r==="parent"||r==="elder";}
function migrateKin(){if(!P||!npcs)return;P.kids=P.kids||[];
  for(const n of npcs){const pars=n.parents||[];if(pars.includes(-1)&&!n.grandKid)n.heroKid=true;if(P.kids.includes(n.id))n.heroKid=true;}
  if(P.legacyAs!=null&&!npcs.some(n=>n.id===P.legacyAs))P.legacyAs=null;
  keepKidsSafe();}
function keepKidsSafe(){if(!P||!npcs)return;const young=id=>{const n=npcs.find(x=>x&&x.id===id);return !n||(n.age||0)<18;};
  if(P.teenHunt)P.teenHunt=P.teenHunt.filter(id=>!young(id));
  if(P.knights)P.knights=P.knights.filter(id=>!young(id));}
function childDanger(n){try{if(typeof nearHostile==="function"&&nearHostile(n))return true;}catch(_){}return false;}
function kinTick(){if(!hero||!npcs||state!=="play"||room||paused)return;if((frameN%30)===0)keepKidsSafe();let seen=0;
  for(const n of npcs){if(!ownChild(n)||(n.age||0)<3)continue;if(Math.hypot(n.x-hero.x,n.y-hero.y)>240)continue;if(++seen>4)break;
    if(n.waveT>0)n.waveT--;
    if(childDanger(n)||(typeof BRAWL!=="undefined"&&BRAWL.on&&Math.hypot(n.x-hero.x,n.y-hero.y)<80)){n.inside=false;continue;}
    const dx=hero.x+(n.id%2?16:-18)-n.x,dy=hero.y+6-n.y,d=Math.hypot(dx,dy)||1;
    if(d>20){n.inside=false;n.x+=dx/d*1.7;n.y+=dy/d*1.7;n.dir=dx<0?1:2;n.anim=(n.anim||0)+1;}
    if(d<34&&(!n._dadAt||frameN-n._dadAt>360)){n._dadAt=frameN||1;n.waveT=48;const line=dadGreet(n);n.dadLast=world.day;
      try{if(typeof bubbles!=="undefined"){for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i];if(!b||!b.n||Math.hypot((b.n.x||0)-n.x,(b.n.y||0)-n.y)<48)bubbles.splice(i,1);}}
        say(n,line,220);}catch(_){}}}}
function drawKin(){if(!npcs)return;ctx.font="bold 8px system-ui";ctx.textAlign="center";
  for(const n of npcs){if(!n.waveT||!ownChild(n))continue;if(n.x<camX-20||n.y<camY-20||n.x>camX+W+20||n.y>camY+H+20)continue;
    const up=(n.waveT%8)<4?-3:0;ctx.lineWidth=3;ctx.strokeStyle="#000";ctx.strokeText("👋",n.x+8,n.y-16+up);ctx.fillStyle="#ffe08a";ctx.fillText("👋",n.x+8,n.y-16+up);}}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{const line=kinSpeech(n);if(line&&Array.isArray(L))L.unshift(line);}catch(_){}return L;};}
{const _rt=romanceTalk;romanceTalk=function(n,msg){try{if(kinShield(n))return talk0(n);}catch(_){}
  try{if(ownChild(n)){const v=dadSpeech(n);msg=n.name+" looks up. \""+v+"\"";} }catch(_){}return _rt.call(this,n,msg);};}
{const _tk=talk;talk=function(n){if(n&&kinShield(n)){const was=n.heroKid;n.heroKid=true;try{return _tk.apply(this,arguments);}finally{n.heroKid=was;}}return _tk.apply(this,arguments);};}
{const _cr=canRomance;canRomance=function(n){if(kinShield(n))return false;return _cr.apply(this,arguments);};}
{const _fn=flirtNow;flirtNow=function(n){if(kinShield(n)){try{toast(n.name+" is family.");}catch(_){}return;}return _fn.apply(this,arguments);};}
{const _nt=npcTarget;npcTarget=function(n){try{if(ownChild(n)&&(n.age||0)>=3&&hero&&!childDanger(n)&&Math.hypot(n.x-hero.x,n.y-hero.y)<200&&!(typeof BRAWL!=="undefined"&&BRAWL.on)){
  return{x:hero.x+(n.id%2?18:-16),y:hero.y+8};}}catch(_){}return _nt.apply(this,arguments);};}
{const _ca=callToArms;callToArms=function(n,on){if(n&&(n.age||0)<18){keepKidsSafe();try{toast(n.name+" stays home. Children do not fight.");}catch(_){}return false;}return _ca.apply(this,arguments);};}
{const _th=teenHunt;teenHunt=function(k){if(k&&(k.age||0)<18){keepKidsSafe();try{toast(k.name+" stays home and plays. Children do not fight.");}catch(_){}return;}return _th.apply(this,arguments);};}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{kinTick();}catch(e){console.warn("kin",e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&!room&&!(P&&P.fly>=28)){ctx.save();
  const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:1):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);drawKin();ctx.restore();}}catch(e){try{ctx.restore();}catch(_){}}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r)migrateKin();}catch(_){}return r;};}
{const _dm=descMenu;descMenu=function(n){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;try{if(n&&n.age>=18&&Array.isArray(b)&&!b.some(o=>o&&o._leg)){
  b=[{_leg:1,l:P.legacyAs===n.id?"Return to yourself":"Carry the legacy as "+n.name,f:()=>{P.legacyAs=P.legacyAs===n.id?null:n.id;toast(P.legacyAs?"You carry on as "+n.name+". Your children know your voice.":"You are the wanderer again. Your children run to meet you.");descMenu(n);}}].concat(b);}}catch(_){}return sm(t,x,b);};try{return _dm(n);}finally{showMenu=sm;}};}
window.__KIN88={ownChild,kinRel,dadWord,dadGreet,dadSpeech,kinSpeech,migrateKin,kinShield,legacy:(id)=>{P.legacyAs=id;}};
