// ===== v29 Sword mastery, hero speed, tactician (telegraphs, weak points, Command) =====
const SPRINT_MUL=2.4;
const SW_RANKS=["Novice","Adept","Expert","Master","Grandmaster"],SW_XP=[0,40,150,400,1000];
function swd(){P.swd=P.swd||{xp:0};return P.swd;}
function swRank(){const x=swd().xp;let r=0;for(let i=0;i<SW_XP.length;i++)if(x>=SW_XP[i])r=i;return r;}
function swGain(e){const r0=swRank();const hp=(e.maxHp||e.hp||3);swd().xp+=1+Math.floor(hp/6)+(e.boss||e.sp==="dragon"?10:0);const r=swRank();
  if(r>r0){const u=["","Spin Slash (hold 🗡)","Charged Thrust (hold 🗡 longer)","Combo Finisher shockwave","Grandmaster edge"][r];toast(`⚔ Sword rank: ${SW_RANKS[r]}! Unlocked: ${u}`);try{jAdd("Reached sword rank "+SW_RANKS[r]+".");}catch(_){}}}
let swHit=0;
{const _he=hurtEnemy;hurtEnemy=function(e,dmg,ang,cd){const mine=!window.__guardSwing&&(hero.swinging>=0||hero.spinT>0||swHit>0);
  if(mine&&e&&!e.pet){if(e.weakA!=null&&ang!=null){let df=Math.abs(((ang-e.weakA)+Math.PI*3)%(Math.PI*2)-Math.PI);if(df<0.8){dmg*=2;window.__lastCrit=frameN;try{floatText(e.x+6,e.y-8,"CRIT!","#ffd84a");}catch(_){}}}swGain(e);}
  return _he(e,dmg,ang,cd);};}
{const _sd=swordDmg;swordDmg=function(){return _sd()+[0,0,1,1,2][swRank()];};}
{const _hb=swordHitbox;swordHitbox=function(){const b=_hb();if(!b)return b;const g=swRank()*3;b.x-=g/2;b.y-=g/2;b.w+=g;b.h+=g;return b;};}
let swHold=0;
function swThrust(){const d=[[0,1],[-1,0],[1,0],[0,-1]][hero.dir];hero.knockVx=d[0]*6;hero.knockVy=d[1]*6;hero.iframes=Math.max(hero.iframes,14);swHit=12;
  const cx=hero.x+6,cy=hero.y+6;for(const e of mobs){if(e.dead||e.pet)continue;const ex=e.x+e.w/2-cx,ey=e.y+e.h/2-cy,along=ex*d[0]+ey*d[1],side=Math.abs(ex*d[1]-ey*d[0]);
   if(along>-6&&along<70&&side<16){if(e.sp==="dragon")hitDragon(e,Math.atan2(d[1],d[0]));else hurtEnemy(e,swordDmg()*2,Math.atan2(d[1],d[0]),true);}}
  for(let i=0;i<10;i++)particles.push({x:cx+d[0]*i*6,y:cy+d[1]*i*6,z:0,vx:0,vy:0,vz:.2,life:14,max:14,col:[255,230,140],size:3,kind:"spark"});shake=3;hitStop=4;try{SFX.swing();}catch(_){}}
function dashStrike(){window.__dashStrike=frameN;swThrust();}
{const _u=update;update=function(){const s0=hero&&hero.swinging,c0=hero&&hero.combo;_u();if(!hero||state!=="play"||!P)return;if(swHit>0)swHit--;
  const r=swRank();
  if(hero.swinging>=0&&r>=2&&hero.swingT%3===1)hero.swingT++;
  // dash-strike: swing started while sprinting
  if(s0<0&&hero.swinging===0&&hero.sprinting)dashStrike();
  // hold-to-charge
  const held=keys.KeyJ||keys.Space||touch.a;
  if(held&&!hero.boat){swHold++;if(swHold===30&&r>=1){hero.chargeGlow=1;}}else{if(swHold>=70&&r>=2)swThrust();else if(swHold>=30&&r>=1)spinAttack();swHold=0;hero.chargeGlow=0;}
  // combo finisher shockwave
  if(r>=3&&hero.combo===2&&hero.swinging===2&&hero.swingT%3===0&&!hero._fin){hero._fin=1;for(const e of mobs){if(e.dead||e.pet||e.sp==="dragon")continue;if(Math.hypot(e.x-hero.x,e.y-hero.y)<44)hurtEnemy(e,swordDmg(),Math.atan2(e.y-hero.y,e.x-hero.x),false);}window.__finisher=frameN;shake=4;}
  if(hero.swinging<0)hero._fin=0;
  if(frameN%30===0)for(const e of mobs)if(!e.dead&&e.weakA==null&&!e.pet)e.weakA=Math.random()*Math.PI*2-Math.PI;
  if(CMD.until&&frameN>CMD.until){CMD.k=null;CMD.until=0;}};}
// draw: rank trails, telegraphs, weak points
{const _dh=drawHeroFull;drawHeroFull=function(){
  for(const e of mobs){if(e.dead||e.pet)continue;if(Math.abs(e.x-hero.x)>200||Math.abs(e.y-hero.y)>200)continue;const cx=e.x+e.w/2,cy=e.y+e.h/2;
    const tele=e.state==="windup"||e.state==="slam"||(e.atkCd>0&&e.atkCd<14)||(Math.hypot(cx-hero.x-6,cy-hero.y-6)<22&&!e.stun);
    if(tele){e._tele=frameN;const a=Math.atan2(hero.y+6-cy,hero.x+6-cx);ctx.save();ctx.globalAlpha=.55+.3*Math.sin(frameN*.5);ctx.fillStyle="#ff3b2f";ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,26,a-.5,a+.5);ctx.fill();ctx.font="bold 10px sans-serif";ctx.fillText("!",cx-2,e.y-6);ctx.restore();window.__teleN=(window.__teleN||0)+1;}
    if(e.weakA!=null){ctx.save();ctx.fillStyle="#ffd84a";ctx.globalAlpha=.7+.3*Math.sin(frameN*.3);ctx.beginPath();ctx.arc(cx-Math.cos(e.weakA)*(e.w/2+3),cy-Math.sin(e.weakA)*(e.h/2+3),2.2,0,7);ctx.fill();ctx.restore();}}
  _dh();
  const r=swRank();if(hero.swinging>=0&&hero.swinging<4&&r>0){const d=[[0,1],[-1,0],[1,0],[0,-1]][hero.dir];const b=Math.atan2(d[1],d[0]);ctx.save();ctx.globalCompositeOperation="lighter";
    for(let i=0;i<r;i++){ctx.strokeStyle=r>=3?`rgba(255,215,90,${.5-i*.08})`:`rgba(160,220,255,${.5-i*.08})`;ctx.lineWidth=2+r-i*.5;ctx.beginPath();ctx.arc(hero.x+6,hero.y+4,14+r*3+i*2,b-1.2+hero.swinging*.5,b-0.4+hero.swinging*.5);ctx.stroke();}ctx.restore();}
  if(hero.chargeGlow||swHold>=30){ctx.save();ctx.strokeStyle=swHold>=70&&r>=2?"#ffd84a":"#9fd8ff";ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hero.x+6,hero.y+8,12+Math.sin(frameN*.4)*2,0,7);ctx.stroke();ctx.restore();}
  if(CMD.k){ctx.save();ctx.font="bold 9px sans-serif";ctx.fillStyle="#ffe08a";ctx.fillText({rally:"⚑ RALLY",flank:"⇆ FLANK",hold:"■ HOLD"}[CMD.k],hero.x-10,hero.y-14);ctx.restore();}};}
// Command
const CMD={k:null,until:0};
function command(k){CMD.k=k;CMD.until=frameN+60*40;toast({rally:"⚑ Allies rally to you!",flank:"⇆ Allies flank the enemy!",hold:"■ Allies hold the line!"}[k]);}
function inBattle(){return mobs.some(e=>!e.dead&&!e.pet&&(e.raidOf!=null||e.sp==="dragon"||e.boss)&&Math.hypot(e.x-hero.x,e.y-hero.y)<400)||(typeof DUEL!=="undefined"&&false);}
function commandMenu(){showMenu("⚑ Command",inBattle()?"Direct guards, allies and pets nearby.":"No battle nearby, but your allies will still listen.",[{l:"⚑ Rally",f:()=>{command("rally");closeMenu();}},{l:"⇆ Flank",f:()=>{command("flank");closeMenu();}},{l:"■ Hold",f:()=>{command("hold");closeMenu();}},{l:"Close"}]);}
const isAllyN=n=>n.role==="guard"||n.guard||n.soldier||(P.party||[]).includes(n.id);
{const _gt=guardTick;guardTick=function(n){if(CMD.k&&n.alive!==false&&Math.hypot(n.x-hero.x,n.y-hero.y)<260){
   if(CMD.k==="hold"){n.vx=n.vy=0;return true;}
   if(CMD.k==="rally"&&Math.hypot(n.x-hero.x,n.y-hero.y)>28){stepTo(n,hero.x+((n.id%3)-1)*14,hero.y+16,GUARD_RUN);return true;}
   if(CMD.k==="flank"){let b=null,bd=1e9;for(const e of mobs){if(e.dead||e.pet)continue;const d=Math.hypot(e.x-n.x,e.y-n.y);if(d<bd){bd=d;b=e;}}
     if(b&&bd<300){const a=Math.atan2(b.y-hero.y,b.x-hero.x)+(n.id%2?1:-1)*1.3;const tx=b.x+Math.cos(a)*18,ty=b.y+Math.sin(a)*18;if(Math.hypot(tx-n.x,ty-n.y)>10){stepTo(n,tx,ty,GUARD_RUN);n._flank=1;return true;}}}}
  return _gt(n);};}
function skillsMenu(){const r=swRank(),x=swd().xp,nx=SW_XP[r+1];
  showMenu("⚔ Skills",`Sword: ${SW_RANKS[r]} (${x}${nx?" / "+nx:""} XP)\nDamage +${[0,0,1,1,2][r]} · Reach +${r*3}px · Swing ${r>=2?"faster":"normal"}\n\n`+
   [[1,"Spin Slash: hold 🗡"],[2,"Charged Thrust: hold 🗡 longer"],[3,"Combo Finisher: 3rd hit shockwave"],[4,"Grandmaster: golden trails"]].map(([k,t])=>(r>=k?"✔ ":"○ ")+t).join("\n")+
   `\n\nAlways: Dash-Strike (attack while sprinting) · Telegraphs (red ! before blows) · Weak points (gold dot, ×2 crit)\nSprint ×${SPRINT_MUL}, faster than any foe or villager.`,[{l:"⚑ Command",f:()=>commandMenu()},{l:"Close"}]);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world){b=[{l:"⚔ Skills",f:()=>skillsMenu()}].concat(inBattle()?[{l:"⚑ Command",f:()=>commandMenu()}]:[]).concat(b);}}catch(_){}return _sm.call(this,t,x,b);};}
