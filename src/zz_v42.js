// ===== v42 GAMEPLAY: chain-homing Ice Beam & Earthquake, stronger Black Hole, Spirit crescent slashes, no cooldowns,
// infinite mana, 3x XP, much stronger level growth (retroactive), hero age, away-time catch-up on PWA resume =====
// ---- hero age (ageless lore: looks the same) ----
const heroAge=()=>(P&&P.startAge||20)+Math.floor((world?world.day:0)/YEAR_DAYS);
const ageStr=()=>`Age ${heroAge()} (looks ${(P&&P.startAge)||20})`;
{const _sm=showMenu;showMenu=function(t,x,b){try{if(P&&world&&(t==="Paused"||/Family/.test(t)))x=`🧍 ${ageStr()}\n`+(x||"");}catch(_){}return _sm.call(this,t,x,b);};}
{const _gc=guildCard;guildCard=function(){const r=_gc.apply(this,arguments);try{return typeof r==="string"?r.replace("\n",`\n${ageStr()}\n`):r;}catch(_){return r;}};}
// ---- XP x3, stronger growth ----
{const _ge=gainExp;gainExp=function(n,x,y){return _ge.call(this,Math.round((n||0)*3),x,y);};}
{const _h=hpForLv;hpForLv=function(lv){return _h(lv)+Math.floor((lv-1)*2.5);};}
{const _m=mpForLv;mpForLv=function(lv){return _m(lv)+(lv-1)*12;};}
const powLv=()=>Math.floor(((P&&P.lv)||1)/3);
{const _sd=swordDmg;swordDmg=function(){return _sd()+powLv();};}
let MAGIC42=0;
{const _he=hurtEnemy;hurtEnemy=function(e,d){if(MAGIC42>0&&typeof d==="number")arguments[1]=d+Math.ceil(powLv()*0.8);return _he.apply(this,arguments);};}
{const _um=updateMagic;updateMagic=function(){MAGIC42++;try{return _um.apply(this,arguments);}finally{MAGIC42--;}};}
{const _u41=upd41;upd41=function(){MAGIC42++;try{return _u41.apply(this,arguments);}finally{MAGIC42--;}};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{recomputeMax();hero.hp=hero.maxHp;}catch(_){}return r;};}
// ---- infinite mana, no cooldowns ----
{const _cs=castSpell;castSpell=function(k){if(P&&P.mag)P.mag.mp=P.mag.max;for(const q in SPCD)SPCD[q]=0;MAGIC42++;let r;try{r=_cs.apply(this,arguments);}finally{MAGIC42--;}if(P&&P.mag)P.mag.mp=P.mag.max;for(const q in SPCD)SPCD[q]=0;return r;};}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(P&&P.mag){P.mag.mp=P.mag.max;}for(const q in SPCD)SPCD[q]=0;}catch(_){}};}
{const _uh=updateHotbar;updateHotbar=function(){_uh.apply(this,arguments);try{const e=document.getElementById("mpNum");if(e)e.textContent="∞";const f=document.getElementById("mpFill");if(f)f.style.width="100%";}catch(_){}};}
// ---- chain helper: home onto the nearest foe in front, then jump foe to foe ----
function chain42(cx,cy,jumps,range){const F=foes41();const L=[];let x=cx,y=cy;const a0=aim41(cx,cy);
  let first=null,bd=230;for(const e of F){const ex=e.x+e.w/2,ey=e.y+e.h/2,d=Math.hypot(ex-cx,ey-cy);const a=Math.atan2(ey-cy,ex-cx);const df=Math.abs(((a-a0)+Math.PI*3)%(Math.PI*2)-Math.PI);if(df<1.1&&d<bd){bd=d;first=e;}}
  if(!first)return L;L.push(first);x=first.x+first.w/2;y=first.y+first.h/2;
  while(L.length<jumps){let nx=null,nd=range;for(const e of F){if(L.includes(e))continue;const d=Math.hypot(e.x+e.w/2-x,e.y+e.h/2-y);if(d<nd){nd=d;nx=e;}}if(!nx)break;L.push(nx);x=nx.x+nx.w/2;y=nx.y+nx.h/2;}return L;}
{const _cn=castNew;castNew=function(k){if(k!=="frost"&&k!=="quake"&&k!=="blade")return _cn.apply(this,arguments);const m=P.mag,lv=spellLv(k);if(!spellUnlocked(k))return false;m.xp[k]=(m.xp[k]||0)+1;hero.castT=20;window.__lastNewSpell=k;
  const cx=hero.x+6,cy=hero.y+6;
  if(k==="blade"){blade36=performance.now()+20000;const a=aim41(cx,cy);for(const o of [-0.32,0,0.32])SP41.push({k:"crescent",x:cx,y:cy,a:a+o,v:4.2,life:40,dmg:2+Math.floor(lv/2),hit:new Set(),r:5});return true;}
  const T=chain42(cx,cy,k==="frost"?5:6,k==="frost"?120:110);
  if(!T.length){return _cn.apply(this,arguments);} // nothing to home onto: straight beam / crack forward
  SP41.push({k:k==="frost"?"frostc":"quakec",tg:T,pts:[[cx,cy]],i:0,t:0,life:200,dmg:k==="frost"?2+Math.floor(lv/3):3+Math.floor(lv/2),seed:Math.random()*99});if(k==="quake")shake=Math.max(shake,8);return true;};}
{const _u2=upd41;upd41=function(){_u2.apply(this,arguments);for(const p of SP41){
  if(p.k==="frostc"||p.k==="quakec"){p.t++;const step=p.k==="frostc"?5:8;if(p.i<p.tg.length&&p.t%step===0){const e=p.tg[p.i];if(!e.dead){const ex=e.x+e.w/2,ey=e.y+e.h/2;p.pts.push([ex,ey]);MAGIC42++;try{hit41(e,p.dmg,0,p.k==="frostc"?60:80);}finally{MAGIC42--;}if(p.k==="frostc"){e.slowT=180;e.frozen=60;}
        for(let i=0;i<8;i++)particles.push({x:ex,y:ey,z:4,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:.6,life:18,max:18,col:p.k==="frostc"?[200,240,255]:[150,110,70],size:2,kind:p.k==="frostc"?"magic":undefined});}p.i++;if(p.i>=p.tg.length)p.life=Math.min(p.life,p.k==="frostc"?24:60);}}
  if(p.k==="crescent"){p.x+=Math.cos(p.a)*p.v;p.y+=Math.sin(p.a)*p.v;p.r=Math.min(14,p.r+0.35);p.v*=0.985;for(const e of foes41()){if(p.hit.has(e))continue;if(Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<p.r+6){p.hit.add(e);MAGIC42++;try{hit41(e,p.dmg,p.a,12);}finally{MAGIC42--;}}}}
  // stronger black hole: hard pull to the centre + damage while pulled
  if(p.k==="blackhole"&&p.phase!=="fly"){for(const e of foes41()){if(e.sp==="dragon")continue;const dx=p.x-(e.x+e.w/2),dy=p.y-(e.y+e.h/2),d=Math.hypot(dx,dy);if(d<180&&d>2){const pull=Math.min(3.2,180/(d+20));const nx=e.x+dx/d*pull,ny=e.y+dy/d*pull;const fr=(x,y)=>!solidTile(((x+e.w/2)/TILE)|0,((y+e.h/2)/TILE)|0);if(fr(nx,ny)){e.x=nx;e.y=ny;}else if(fr(nx,e.y))e.x=nx;else if(fr(e.x,ny))e.y=ny;e.stun=Math.max(e.stun||0,2);
        if(p.t%12===0){MAGIC42++;try{hit41(e,Math.max(1,p.dmg+(d<30?1:0)),Math.atan2(dy,dx),0);}finally{MAGIC42--;}}}}}}};}
{const _d2=draw41;draw41=function(){_d2.apply(this,arguments);for(const p of SP41){ctx.save();
  if(p.k==="frostc"){ctx.globalCompositeOperation="lighter";ctx.lineCap="round";ctx.lineJoin="round";const al=Math.min(1,p.life/24);for(const [w,c] of [[8,`rgba(120,200,255,${.35*al})`],[4,`rgba(190,240,255,${.85*al})`],[1.5,`rgba(255,255,255,${al})`]]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();p.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y-4):ctx.moveTo(x,y-4));ctx.stroke();}
    for(const [x,y] of p.pts.slice(1)){ctx.fillStyle=`rgba(230,250,255,${al})`;for(let i=0;i<4;i++){const a=i*1.57+.4;ctx.fillRect(x+Math.cos(a)*6-1,y-4+Math.sin(a)*6-1,2,2);}}}
  if(p.k==="quakec"){const al=Math.min(1,p.life/40);ctx.lineJoin="round";for(let s=1;s<p.pts.length;s++){const [ax,ay]=p.pts[s-1],[bx,by]=p.pts[s];const n=Math.max(2,Math.round(Math.hypot(bx-ax,by-ay)/6));ctx.beginPath();ctx.moveTo(ax,ay+2);
      for(let i=1;i<=n;i++){const u=i/n,j=i<n?Math.sin(i*1.9+p.seed+s)*4:0;const nx=-(by-ay),ny=bx-ax,l=Math.hypot(nx,ny)||1;ctx.lineTo(ax+(bx-ax)*u+nx/l*j,ay+2+(by-ay)*u+ny/l*j);}
      ctx.strokeStyle=`rgba(40,22,14,${al})`;ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=`rgba(255,140,60,${al*.7})`;ctx.lineWidth=1.5;ctx.stroke();}}
  if(p.k==="crescent"){ctx.translate(p.x,p.y-6);ctx.rotate(p.a);ctx.globalCompositeOperation="lighter";const al=Math.min(1,p.life/14);
    ctx.strokeStyle=`rgba(255,120,235,${.45*al})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(-p.r*0.5,0,p.r,-1.1,1.1);ctx.stroke();ctx.strokeStyle=`rgba(255,235,252,${al})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-p.r*0.5,0,p.r,-1.0,1.0);ctx.stroke();
    ctx.fillStyle=`rgba(200,140,255,${.6*al})`;ctx.fillRect(-p.r-4,-1,4,2);}
  ctx.restore();}};}
NEWSP.frost.desc="An ice beam that homes onto a foe in front and chains to up to 5 foes: damages, freezes, then slows.";
NEWSP.quake.desc="A fissure races to a foe in front and splits on to up to 6 foes, damaging and stunning each.";
NEWSP.blade.desc="Three spectral crescent slashes fan out and pierce foes; your sword glows +2 for 20 seconds.";
NEWSP.blackhole.desc="A dark orb flies forward and collapses into a vortex that drags foes to its core, grinding them as they are pulled.";
// ---- away-time catch-up also on resume (iOS home-screen PWA stays alive while hidden) ----
let hidAt42=0;
document.addEventListener("visibilitychange",()=>{try{if(document.hidden){hidAt42=Date.now();return;}if(!hidAt42||state!=="play"||!P||!world)return;const ms=Date.now()-hidAt42;hidAt42=0;resumeAway(ms);}catch(e){console.warn(e);}});
addEventListener("pageshow",e=>{try{if(e.persisted&&hidAt42&&state==="play"){const ms=Date.now()-hidAt42;hidAt42=0;resumeAway(ms);}}catch(_){}});
function resumeAway(ms){if(ms<MS_PER_GAME_MIN*60)return 0;const before=calStr();let a=null;try{if(ms>=AWAY_MIN_MS){a=awaySim(ms);if(a&&a.lines&&a.lines.length){awayPending=a;jAdd(`While I was away: ${a.lines.join(" ")}`,"away");}}}catch(_){}
  const mins=awayAdvance(ms);if(a){a.cal=`${before} → ${calStr()}`;try{showAway(a);}catch(_){}}P.lastSaved=Date.now();try{saveGame();}catch(_){}window.__lastResume={ms,mins,before,after:calStr()};return mins;}
// ---- the hero's striking good looks: Charm stat + NPC reactions (PG-13; kids never flirt) ----
try{HERO_LOOK.heroPolish=1;}catch(_){}
const heroCharm=()=>Math.min(100,92+Math.floor(((P&&P.lv)||1)/10));
{const _sm=showMenu;showMenu=function(t,x,b){try{if(P&&world&&t==="Paused")x=`💖 Charm ${heroCharm()} — strikingly handsome\n`+(x||"");}catch(_){}return _sm.call(this,t,x,b);};}
function charmLine(n){const kid=n.role==="child"||(n.age||20)<16;if(kid)return pick(["Whoa, you look like a real hero from the storybooks!","Are you a knight? You look like one!","When I grow up I want to look like a hero, just like you!"]);
  const flirty=typeof canRomance==="function"&&canRomance(n)&&n.spouse!==-1;if(flirty)return pick(["*blushes* Has anyone told you how handsome you are?","Oh! I... forgot what I was saying. You're very easy on the eyes.","*looks away, cheeks pink* Sorry, I was staring."]);
  return pick(["Folks say you're the finest-looking traveler to pass through.","You carry yourself like royalty, friend.","Half the town turns their heads when you walk by."]);}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(Array.isArray(L)&&n&&Math.random()<0.4)L.splice(Math.min(1,L.length),0,charmLine(n));}catch(_){}return L;};}
// ---- challengers removed entirely: no challenges, ambushes or pending duels; old saves cleaned ----
issueChallenge=function(){return null;};showChallenge=function(){};
function clearChallengers(){try{CHAL=null;DPEND=null;if(world){world.duelAmbush=null;}if(DUEL){DUEL=null;}for(const n of npcs){if(n.duelist){n.duelist=false;n.duelWalk=false;if(n.chal||n.challenger){n.alive=false;}}n.duelWatch=null;}
  for(let i=npcs.length-1;i>=0;i--){const n=npcs[i];if(n.challenger||n.chal)npcs.splice(i,1);}}catch(_){}}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);clearChallengers();return r;};}
{const _hr=hourlyTick;hourlyTick=function(){const r=_hr.apply(this,arguments);try{if(CHAL||DPEND||(world&&world.duelAmbush))clearChallengers();}catch(_){}return r;};}
