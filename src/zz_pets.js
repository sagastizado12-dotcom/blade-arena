// ===== v30 PETS & MOUNTS: tame weakened monsters; fighters battle beside you, mounts carry you faster; they level up =====
const TAME={wolfman:{k:"fighter",ic:"🐺",nm:"Wolfkin"},viper:{k:"fighter",ic:"🐍",nm:"Viper"},duskbat:{k:"fighter",ic:"🦇",nm:"Dusk Bat"},slime:{k:"fighter",ic:"🟢",nm:"Slime"},
  manebeast:{k:"mount",ic:"🐎",nm:"Manebeast Steed"},meadowslime:{k:"mount",ic:"🫧",nm:"Meadow Slime"}};
const PET_NAMES=["Ash","Bramble","Comet","Dusk","Ember","Fang","Gale","Hazel","Ivy","Juniper","Koda","Luna","Moss","Nyx","Pip","Rune","Sable","Thistle"];
const pets=()=>(P&&(P.pets=P.pets||[]))||[];
const activePet=()=>pets().find(p=>p.active&&TAME[p.sp].k==="fighter");
const activeMount=()=>pets().find(p=>p.active&&TAME[p.sp].k==="mount");
let tameAsked=new WeakSet();
function tryTame(e){if(!e||e.dead||!TAME[e.sp])return false;const ch=Math.min(0.9,0.55+(P.lv||1)*0.02);if(Math.random()>ch&&!window.__TAME_SURE){toast(`The ${e.sp} snaps free and flees!`);e.provoked=false;return false;}
  const D=TAME[e.sp];const p={id:Date.now()%1e9+Math.floor(Math.random()*1000),sp:e.sp,name:PET_NAMES[pets().length%PET_NAMES.length],lv:1,xp:0,active:false};pets().push(p);e.dead=true;e.flash=1;
  const m=`I tamed a ${D.nm}! I named it ${p.name}.`;toast(`${D.ic} ${m}`);try{jAdd(m,"family");}catch(_){}petSet(p,true);return p;}
function petSet(p,on){for(const q of pets())if(TAME[q.sp].k===TAME[p.sp].k)q.active=false;p.active=!!on;despawnPets();if(!on)P.riding=false;else if(TAME[p.sp].k==="mount")P.riding=true;}
function despawnPets(){for(let i=mobs.length-1;i>=0;i--)if(mobs[i].pet)mobs.splice(i,1);}
function petEntity(p){let e=mobs.find(m=>m.pet===p.id);if(!e&&!room){e=spawnMob(p.sp,hero.x-28,hero.y-4,{persist:true});if(!e)return null;e.pet=p.id;e.persist=true;e.hp=e.maxHp=99999;e.name=p.name;}return e;}
// pets are friends: never hurt by the hero, never run normal monster AI
{const _he=hurtEnemy;hurtEnemy=function(e){if(e&&e.pet)return;return _he.apply(this,arguments);};}
{const _um=updateMob;updateMob=function(e){if(e&&e.pet)return;return _um.apply(this,arguments);};}
{const _sh=typeof spellHit==="function"?spellHit:null;if(_sh)spellHit=function(e){if(e&&e.pet)return;return _sh.apply(this,arguments);};}
function petXp(p,n){p.xp+=n;while(p.xp>=p.lv*20){p.xp-=p.lv*20;p.lv++;toast(`${TAME[p.sp].ic} ${p.name} grew to level ${p.lv}!`);}}
let rideLast=null;
{const _u=update;update=function(){const hx=hero&&hero.x,hy=hero&&hero.y;_u.apply(this,arguments);try{if(!hero||state!=="play"||room||paused||!P)return;
  // fighter
  const fp=activePet();if(fp){const e=petEntity(fp);const ck=typeof CMD!=="undefined"?CMD.k:null;if(e&&ck!=="hold"){let tgt=null,td=ck==="rally"?-1:ck==="flank"?200:130;for(const m of mobs){if(m.dead||m.pet||(m.def&&m.def.beh==="pea"))continue;const d=Math.hypot(m.x-e.x,m.y-e.y);if(d<td&&Math.hypot(m.x-hero.x,m.y-hero.y)<200){td=d;tgt=m;}}
    const gx=tgt?tgt.x:hero.x-28,gy=tgt?tgt.y:hero.y-4,gd=Math.hypot(gx-e.x,gy-e.y);if(gd>300){e.x=hero.x-28;e.y=hero.y-4;}else if(gd>(tgt?14:10)){const v=Math.min(gd,1.6);e.x+=(gx-e.x)/gd*v;e.y+=(gy-e.y)/gd*v;e.dir=Math.abs(gx-e.x)>Math.abs(gy-e.y)?(gx>e.x?2:1):(gy>e.y?0:3);e.anim=(e.anim||0)+1;e.frame=(e.anim>>3)%2;}
    e.petCd=(e.petCd||0)-1;if(tgt&&td<22&&e.petCd<=0){e.petCd=45;tgt._petHit=frameN;tgt._petId=fp.id;hurtEnemy(tgt,1+Math.floor(fp.lv/3),Math.atan2(tgt.y-e.y,tgt.x-e.x));}}}
  // mount: rider moves faster
  const mp=activeMount();if(mp&&P.riding&&!hero.boat){const e=petEntity(mp);if(hx!=null){const dx=hero.x-hx,dy=hero.y-hy;if((dx||dy)&&Math.hypot(dx,dy)<6){const k=0.45+mp.lv*0.03;const nx=hero.x+dx*k,ny=hero.y+dy*k;if(!blocked(nx,ny,12,12)){hero.x=nx;hero.y=ny;}if(frameN%60===0)petXp(mp,1);}}
    if(e){e.x=hero.x-4;e.y=hero.y-3;e.dir=hero.dir;e.anim=(e.anim||0)+1;e.frame=(e.anim>>3)%2;}}
  // offer to tame a weakened tameable monster nearby
  if(frameN%20===0&&menuEl.classList.contains("hidden"))for(const m of mobs){if(m.dead||m.pet||!TAME[m.sp]||tameAsked.has(m))continue;if(m.hp>m.maxHp*0.3||Math.hypot(m.x-hero.x,m.y-hero.y)>48)continue;tameAsked.add(m);const D=TAME[m.sp];
    showMenu(`${D.ic} Tame the ${m.sp}?`,`It's weak and wary. A ${D.k==="mount"?"mount to ride":"companion to fight beside you"}.`,[{l:"🐾 Tame",f:()=>{closeMenu();tryTame(m);}},{l:"No",f:closeMenu}]);break;}}catch(e){console.warn(e);}};}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{const fp=activePet();if(fp&&e&&!e.pet)petXp(fp,e._petId===fp.id&&frameN-(e._petHit||0)<90?6:2);}catch(_){}return r;};}
// Family tab: Pets section
function petsMenu(){const L=pets();showMenu("🐾 Pets & Mounts",L.length?L.map(p=>`${TAME[p.sp].ic} ${p.name} — ${TAME[p.sp].nm} · Lv ${p.lv} (${p.xp}/${p.lv*20} xp)${p.active?(TAME[p.sp].k==="mount"?(P.riding?" · riding":" · with you"):" · fighting beside you"):""}`).join("\n"):"No pets yet. Weaken a wolf-like or rideable beast and tame it!",
  L.map(p=>({l:`${TAME[p.sp].ic} ${p.name}: ${p.active?(TAME[p.sp].k==="mount"?"Send to stable":"Dismiss"):(TAME[p.sp].k==="mount"?"Ride":"Summon")}`,f:()=>{petSet(p,!p.active);petsMenu();}})).concat([{l:"👪 Family",f:familyMenu},{l:"Close",f:closeMenu}]));}
{const _fm=familyMenu;familyMenu=function(){const sm=showMenu;showMenu=function(t,x,b){showMenu=sm;try{if(Array.isArray(b)){b=b.slice();b.unshift({l:"🐾 Pets & Mounts",f:petsMenu});}const L=pets();if(L.length)x=(x||"")+"\n\nPets: "+L.map(p=>`${TAME[p.sp].ic} ${p.name} Lv${p.lv}`).join(" · ");}catch(_){}return sm.call(this,t,x,b);};try{return _fm.apply(this,arguments);}finally{showMenu=sm;}};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{despawnPets();}catch(_){}return r;};}
