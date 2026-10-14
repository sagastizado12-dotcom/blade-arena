// ===== MAGIC =====
const SPELLS={
 fireball:{n:"Fireball",ic:"🔥",mp:12,col:[255,120,30]},
 ice:{n:"Ice Lance",ic:"❄",mp:10,col:[150,230,255],rank:1},
 heal:{n:"Healing Light",ic:"✚",mp:20,col:[255,240,140]},
 dash:{n:"Wind Dash",ic:"🌀",mp:8,col:[180,255,200]},
 wall:{n:"Earth Wall",ic:"⛰",mp:18,col:[190,140,80],rank:2},
 chain:{n:"Lightning Chain",ic:"⚡",mp:22,col:[200,180,255],rank:3},
 blade:{n:"Enchanted Blade",ic:"🗡",mp:25,col:[255,90,220],rank:4},
 meteor:{n:"Meteor (Ultimate)",ic:"☄",mp:60,col:[255,80,40],tome:1},
};
const SPELL_ORDER=Object.keys(SPELLS);
let fx=[],walls=[],curSpell="fireball",castPressed=false;
function magicInit(){if(!P.mag)P.mag={mp:100,max:100,known:[],lv:{},xp:{},blade:0};P.mag.known=SPELL_ORDER.slice();if(!P.mag.xp)P.mag.xp={};}
function unlockSpells(){const m=P.mag;m.known=SPELL_ORDER.slice();return;for(const k of SPELL_ORDER){const s=SPELLS[k];if(m.known.includes(k))continue;
  if(s.rank!=null&&P.rank>=s.rank){m.known.push(k);toast("New spell learned: "+s.n+"!");}}}
function learnTome(k){if(!P.mag.known.includes(k)){P.mag.known.push(k);toast("Tome read! Learned "+SPELLS[k].n+"!");}}
const spellLv=k=>1+Math.floor((P.mag.xp[k]||0)/8);
function wantCast(){const k=keys.KeyL||touch.c||latch.KeyL;latch.KeyL=false;if(k&&!castPressed){castPressed=true;return true;}if(!k)castPressed=false;return false;}
function spellHit(e,dmg,ang){if(e.dead)return;dmg+=(P.gear&&P.gear.focus)||0;e._spell=1;for(let i=0;i<dmg;i++){e.iframes=0;if(e.sp==="dragon"){e.fly=Math.min(e.fly,0)||e.fly;hitDragon(e,ang);}else hurtEnemy(e,1,ang,true);if(e.dead)break;}}
function burst(x,y,col,n,sp,size){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*sp;particles.push({x,y,z:4+Math.random()*6,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:Math.random()*2,life:20+Math.random()*25,max:45,col:[clamp(col[0]+(Math.random()-.5)*60,0,255),clamp(col[1]+(Math.random()-.5)*60,0,255),clamp(col[2]+(Math.random()-.5)*60,0,255)],size:size||2,kind:"magic"});}}
function castSpell(k){
  if(hero)hero.castT=20;
  k=k||curSpell;const s=SPELLS[k],m=P.mag;SPCD[k]=SPCD[k]||0;if(SPCD[k]>performance.now())return false;SPCD[k]=performance.now()+SPCDMS(k);if(!m.known.includes(k))return false;if(m.mp<s.mp){toast("Not enough mana.");return false;}
  m.mp-=s.mp;m.xp[k]=(m.xp[k]||0)+1;const lv=spellLv(k);if((m.xp[k])%8===0)toast(s.n+" reached level "+lv+"!");
  const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const cx=hero.x+6,cy=hero.y+6;const ang=Math.atan2(dy,dx);
  // aim at nearest hostile if any
  let tgt=null,bd=200;for(const e of mobs)if(!e.dead&&e.def&&e.def.beh!=="pea"&&e.def.beh!=="flee"){const d=Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy);if(d<bd){bd=d;tgt=e;}}
  const aim=tgt?Math.atan2(tgt.y+tgt.h/2-cy,tgt.x+tgt.w/2-cx):ang;
  switch(k){
  case "fireball":fx.push({k,x:cx,y:cy,vx:Math.cos(aim)*3.2,vy:Math.sin(aim)*3.2,life:70,dmg:2+Math.floor(lv/2),r:4+lv*.5});break;
  case "ice":fx.push({k,x:cx,y:cy,vx:Math.cos(aim)*5,vy:Math.sin(aim)*5,life:50,dmg:2+Math.floor(lv/3),pierce:true,hit:new Set(),ang:aim});break;
  case "heal":{const amt=2+Math.floor(lv/2);const before=Math.max(0,hero.hp);hero.hp=Math.min(hero.maxHp,before+amt);updateHearts();floatText(cx,cy-14,"+"+(hero.hp-before)+" HP","#7dff8a");SFX.chime();burst(cx,cy,[120,255,140],24,1.2,2);
    try{for(const n of (typeof partyMembers==="function"?partyMembers():[])){if(Math.hypot(n.x-hero.x,n.y-hero.y)<120){if(n.adv&&n.adv.hp!=null&&n.adv.maxHp)n.adv.hp=Math.min(n.adv.maxHp,n.adv.hp+amt*2);if(n.hp!=null&&n.maxHp)n.hp=Math.min(n.maxHp,n.hp+amt*2);burst(n.x+8,n.y+8,[255,230,120],14,1,2);floatText(n.x+8,n.y-8,"+HP","#7dff8a");}}}catch(_){}}burst(cx,cy,s.col,40,1.5,2);fx.push({k:"ring",x:cx,y:cy,r:2,max:30,life:30,col:s.col});break;
  case "dash":{const l=Math.hypot(...[getMoveInput().mx||dx,getMoveInput().my||dy])||1;const mx=(getMoveInput().mx||dx)/l,my=(getMoveInput().my||dy)/l;
    hero.dodgeT=10+lv;hero.iframes=Math.max(hero.iframes,20);hero.knockVx=mx*5;hero.knockVy=my*5;for(let i=0;i<20;i++)particles.push({x:cx,y:cy,z:4,vx:-mx*Math.random()*3+(Math.random()-.5),vy:-my*Math.random()*3+(Math.random()-.5),vz:.3,life:25,max:25,col:s.col,size:2,kind:"magic"});
    for(const e of mobs)if(!e.dead&&Math.hypot(e.x-cx,e.y-cy)<40&&e.def.beh==="agg"){e.knockT=10;e.knockVx=mx*3;e.knockVy=my*3;}break;}
  case "wall":{for(let i=-2;i<=2;i++){const wx=cx+dx*26+(dy?i*12:0),wy=cy+dy*26+(dx?i*12:0);walls.push({x:wx-6,y:wy-6,w:12,h:12,life:300+lv*60});burst(wx,wy,s.col,8,1.5,3);}break;}
  case "chain":{let from={x:cx,y:cy},hit=new Set(),jumps=3+lv;const segs=[];
    for(let j=0;j<jumps;j++){let best=null,bd2=130;for(const e of mobs){if(e.dead||hit.has(e)||e.def.beh==="pea"||e.def.beh==="flee")continue;const d=Math.hypot(e.x+e.w/2-from.x,e.y+e.h/2-from.y);if(d<bd2){bd2=d;best=e;}}
      if(!best)break;hit.add(best);const to={x:best.x+best.w/2,y:best.y+best.h/2};segs.push([from,to]);spellHit(best,2+Math.floor(lv/3),Math.atan2(to.y-from.y,to.x-from.x));burst(to.x,to.y,s.col,10,2,2);from=to;}
    if(!segs.length)segs.push([{x:cx,y:cy},{x:cx+dx*60,y:cy+dy*60}]);fx.push({k:"bolt",segs,life:14});shake=4;break;}
  case "blade":m.blade=600+lv*120;burst(cx,cy,s.col,30,1.2,2);toast("Your blade blazes with arcane fire!");break;
  case "meteor":{const tx=tgt?tgt.x+tgt.w/2:cx+dx*80,ty=tgt?tgt.y+tgt.h/2:cy+dy*80;fx.push({k:"meteor",tx,ty,h:220,life:60,dmg:8+lv*2});break;}
  }
  SFX.spell(k);return true;
}
function updateMagic(){const m=P.mag;if(!m)return;
  m.mp=Math.min(m.max,m.mp+0.07+(curSet?0.05:0));if(m.blade>0)m.blade--;
  if(!hero.dead&&!hero.boat&&!fishing&&wantCast())castSpell();
  // enchanted blade combo: swings release arcane crescents
  if(m.blade>0&&hero.swinging===1&&hero.swingT===3){const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];
    fx.push({k:"crescent",x:hero.x+6,y:hero.y+6,vx:dx*3.5,vy:dy*3.5,life:30,dmg:1+Math.floor(spellLv("blade")/2),pierce:true,hit:new Set(),ang:Math.atan2(dy,dx)});}
  for(const f of fx){f.life--;
    if(f.vx!=null){f.x+=f.vx;f.y+=f.vy;const col=SPELLS[f.k]?SPELLS[f.k].col:[255,90,220];
      if(frameN%2===0)particles.push({x:f.x,y:f.y,z:6,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:.2,life:18,max:18,col,size:f.k==="fireball"?3:2,kind:"magic"});
      if(blocked(f.x-2,f.y-2,4,4)&&f.k!=="crescent"){f.life=0;burst(f.x,f.y,col,14,2,2);continue;}
      for(const e of mobs){if(e.dead||(f.hit&&f.hit.has(e)))continue;if(f.x>e.x-4&&f.x<e.x+e.w+4&&f.y>e.y-6&&f.y<e.y+e.h+4){
        if(f.k==="fireball"){for(const o of mobs)if(!o.dead&&Math.hypot(o.x+o.w/2-f.x,o.y+o.h/2-f.y)<26+f.r*2)spellHit(o,f.dmg,Math.atan2(o.y-f.y,o.x-f.x));burst(f.x,f.y,[255,140,40],40,3,3);shake=5;f.life=0;break;}
        f.hit.add(e);spellHit(e,f.dmg,f.ang);if(f.k==="ice"){e.knockT=0;e.slow=120;}burst(f.x,f.y,col,10,2,2);}}}
    if(f.k==="meteor"){f.h-=220/60;if(f.life<=0){for(const o of mobs)if(!o.dead&&Math.hypot(o.x+o.w/2-f.tx,o.y+o.h/2-f.ty)<70)spellHit(o,f.dmg,Math.atan2(o.y-f.ty,o.x-f.tx));
      SFX.explode();burst(f.tx,f.ty,[255,120,40],80,4,3);burst(f.tx,f.ty,[255,230,120],40,2.5,2);fx.push({k:"ring",x:f.tx,y:f.ty,r:4,max:70,life:30,col:[255,160,60]});shake=14;}}
    if(f.k==="ring")f.r+=(f.max-f.r)*0.15;}
  fx=fx.filter(f=>f.life>0);for(const w of walls)w.life--;walls=walls.filter(w=>w.life>0);
  // walls block projectiles and enemies
  for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];if(walls.some(w=>p.x>w.x&&p.x<w.x+w.w&&p.y>w.y&&p.y<w.y+w.h)){burst(p.x,p.y,[190,140,80],5,1,2);projectiles.splice(i,1);}}
}
function drawMagic(){
  for(const w of walls){ctx.globalAlpha=Math.min(1,w.life/30);ctx.fillStyle="#7a5a34";ctx.fillRect(w.x,w.y-6,w.w,w.h+6);ctx.fillStyle="#a8844e";ctx.fillRect(w.x,w.y-6,w.w,5);ctx.fillStyle="#6ad04a";ctx.fillRect(w.x,w.y-7,w.w,2);ctx.strokeStyle="#e8c060";ctx.strokeRect(w.x+.5,w.y-5.5,w.w-1,w.h+5);}ctx.globalAlpha=1;
  ctx.globalCompositeOperation="lighter";
  for(const f of fx){
    if(f.k==="fireball"){const g=ctx.createRadialGradient(f.x,f.y-6,1,f.x,f.y-6,f.r*2.5);g.addColorStop(0,"rgba(255,255,200,1)");g.addColorStop(.4,"rgba(255,140,30,.9)");g.addColorStop(1,"rgba(255,40,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y-6,f.r*2.5,0,7);ctx.fill();}
    else if(f.k==="ice"||f.k==="crescent"){ctx.save();ctx.translate(f.x,f.y-6);ctx.rotate(f.ang);ctx.fillStyle=f.k==="ice"?"rgba(170,240,255,.95)":"rgba(255,100,230,.85)";ctx.beginPath();
      if(f.k==="ice"){ctx.moveTo(10,0);ctx.lineTo(-8,-3);ctx.lineTo(-8,3);}else{ctx.arc(0,0,10,-1.2,1.2);ctx.arc(-4,0,8,1.2,-1.2,true);}ctx.fill();ctx.restore();}
    else if(f.k==="bolt"){ctx.strokeStyle=`rgba(210,190,255,${f.life/14})`;ctx.lineWidth=2.5;ctx.beginPath();for(const [a,b] of f.segs){ctx.moveTo(a.x,a.y-6);for(let i=1;i<=5;i++){const t=i/5;ctx.lineTo(a.x+(b.x-a.x)*t+(i<5?(Math.random()-.5)*10:0),a.y+(b.y-a.y)*t-6+(i<5?(Math.random()-.5)*10:0));}}ctx.stroke();ctx.lineWidth=1;}
    else if(f.k==="meteor"){const x=f.tx+f.h*.5,y=f.ty-f.h;const g=ctx.createRadialGradient(x,y,1,x,y,16);g.addColorStop(0,"#fff6c0");g.addColorStop(.5,"rgba(255,110,30,.9)");g.addColorStop(1,"rgba(255,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,16,0,7);ctx.fill();
      for(let i=0;i<3;i++)particles.push({x:x+Math.random()*6,y:y+Math.random()*6,z:0,vx:1,vy:-1.5,vz:0,life:15,max:15,col:[255,150,50],size:3,kind:"magic"});
      ctx.strokeStyle="rgba(255,80,40,.6)";ctx.beginPath();ctx.ellipse(f.tx,f.ty,70*(1-f.life/60)+10,30*(1-f.life/60)+5,0,0,7);ctx.stroke();}
    else if(f.k==="ring"){ctx.strokeStyle=`rgba(${f.col[0]},${f.col[1]},${f.col[2]},${f.life/30})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.55,0,0,7);ctx.stroke();ctx.lineWidth=1;}
  }
  if(P.mag&&P.mag.blade>0){ctx.fillStyle=`rgba(255,90,220,${.25+.15*Math.sin(frameN*.3)})`;ctx.beginPath();ctx.arc(hero.x+6,hero.y+4,10,0,7);ctx.fill();}
  ctx.globalCompositeOperation="source-over";
}
// spell wheel UI
const wheelEl=document.getElementById("wheel");
function openWheel(){if(state!=="play")return;paused=true;wheelEl.innerHTML="";const known=P.mag.known;
  SPELL_ORDER.forEach((k,i)=>{const s=SPELLS[k];const b=document.createElement("button");b.type="button";const a=i/SPELL_ORDER.length*Math.PI*2-Math.PI/2;
    b.style.left=`calc(50% + ${Math.cos(a)*110}px - 34px)`;b.style.top=`calc(50% + ${Math.sin(a)*110}px - 34px)`;b.className="sp"+(k===curSpell?" cur":"");
    b.disabled=!known.includes(k);b.innerHTML=`<span>${s.ic}</span><small>${known.includes(k)?s.n+" L"+spellLv(k):"Locked"}</small>`;b.onclick=e=>{e.stopPropagation();curSpell=k;closeWheel();};wheelEl.appendChild(b);});
  const c=document.createElement("div");c.className="wc";c.textContent=SPELLS[curSpell].ic;wheelEl.appendChild(c);wheelEl.classList.remove("hidden");}
function closeWheel(){wheelEl.classList.add("hidden");paused=false;updateSpellBtn();}
wheelEl.addEventListener("click",()=>closeWheel());
function updateSpellBtn(){document.getElementById("btnC").textContent=SPELLS[curSpell].ic;}
touch.c=false;
const btnC=document.getElementById("btnC");
btnC.addEventListener("touchstart",e=>{e.preventDefault();touch.c=true;btnC.classList.add("active");touch.cId=e.changedTouches[0].identifier},{passive:false});
window.addEventListener("touchend",e=>{for(const t of e.changedTouches)if(t.identifier===touch.cId){touch.c=false;btnC.classList.remove("active");}});
document.getElementById("btnW").addEventListener("click",e=>{e.stopPropagation();openWheel();});
document.getElementById("btnW").addEventListener("touchstart",e=>{e.preventDefault();openWheel();},{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="KeyQ"&&state==="play"){wheelEl.classList.contains("hidden")?openWheel():closeWheel();}
  const n=parseInt(e.key);if(n>=1&&n<=8&&state==="play"){const k=SPELL_ORDER[n-1];curSpell=k;updateSpellBtn();if(!paused)castSpell(k);}});
// ===== SUMMONING INTRO =====
const INTRO=["A circle of light blazes across the marble floor...","KING ALDRIC: \"It worked! Welcome, hero from another world.\"","\"Forgive the abrupt summons. Our realm needed someone with your strength... and your magic.\"","\"But I will not chain you to a quest. Live as you wish: hunt, trade, love, explore.\"","\"Should you earn the people's trust, perhaps one day you will wear this crown after me.\"","\"My castle doors are always open. Now go, the Realm of Ten Winds awaits!\""];
let introStep=0,introT=0;
function startIntro(){state="intro";introStep=0;introT=0;document.getElementById("overlay").classList.add("hidden");document.getElementById("introBox").classList.remove("hidden");document.getElementById("introText").textContent=INTRO[0];}
function advanceIntro(){if(state!=="intro")return;introStep++;if(introStep>=INTRO.length){endIntro();return;}document.getElementById("introText").textContent=INTRO[introStep];}
function endIntro(){document.getElementById("introBox").classList.add("hidden");P.introDone=true;localStorage.setItem("realmIntroSeen","1");
  hero.x=(castleObj.x+2.6)*TILE;hero.y=(castleObj.y+3.4)*TILE;beginPlay();toast("You are free to go anywhere. Visit the castle for royal requests.");saveGame();}
document.getElementById("introBox").addEventListener("click",e=>{e.stopPropagation();advanceIntro();});
document.getElementById("introSkip").addEventListener("click",e=>{e.stopPropagation();endIntro();});
window.addEventListener("keydown",e=>{if(state==="intro"&&(e.code==="Enter"||e.code==="Space"||e.code==="KeyJ")){e.preventDefault();advanceIntro();}});
function drawIntro(){introT++;const t=introT;ctx.fillStyle="#2a0c18";ctx.fillRect(0,0,W,H);
  const fl=ctx.createLinearGradient(0,60,0,H);fl.addColorStop(0,"#5a3a48");fl.addColorStop(1,"#2a1a24");ctx.fillStyle=fl;ctx.fillRect(0,60,W,H);
  for(let x=0;x<W;x+=32){ctx.strokeStyle="rgba(255,220,180,.08)";ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(W/2+(x-W/2)*2,H);ctx.stroke();}
  ctx.fillStyle="#a01a2a";ctx.beginPath();ctx.moveTo(W/2-18,60);ctx.lineTo(W/2+18,60);ctx.lineTo(W/2+40,H);ctx.lineTo(W/2-40,H);ctx.fill();ctx.strokeStyle="#e8c060";ctx.stroke();
  for(const px of [40,W-56]){const g=ctx.createLinearGradient(px,0,px+16,0);g.addColorStop(0,"#b08a3a");g.addColorStop(.5,"#ffe08a");g.addColorStop(1,"#8a6a2a");ctx.fillStyle=g;ctx.fillRect(px,0,16,H);
    ctx.fillStyle="#5ff";ctx.beginPath();ctx.arc(px+8,40,3,0,7);ctx.fill();}
  ctx.fillStyle="#6a2a8a";ctx.fillRect(W/2-20,14,40,46);ctx.fillStyle="#e8c060";ctx.fillRect(W/2-24,10,48,6);ctx.fillRect(W/2-24,50,48,10);ctx.fillStyle="#f5f";ctx.beginPath();ctx.arc(W/2,22,3,0,7);ctx.fill();
  // king
  const k=personSprite({skin:[240,200,170],hair:[230,230,230],cloth:[150,30,60],trim:[255,215,90],leg:[80,30,60],long:true,hat:null},0);
  ctx.drawImage(k,W/2-12,26,24,24);ctx.fillStyle="#ffd84a";ctx.beginPath();ctx.moveTo(W/2-7,30);ctx.lineTo(W/2-5,22);ctx.lineTo(W/2,27);ctx.lineTo(W/2+5,22);ctx.lineTo(W/2+7,30);ctx.fill();
  // magic circle
  const cx=W/2,cy=H-70;ctx.save();ctx.globalCompositeOperation="lighter";for(let r=0;r<3;r++){ctx.strokeStyle=`rgba(${120+r*40},${200},255,${.6-r*.15})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,50-r*12,20-r*5,0,0,7);ctx.stroke();}
  ctx.translate(cx,cy);ctx.scale(1,.4);ctx.rotate(t*.02);ctx.strokeStyle="rgba(200,255,255,.7)";ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=(i+2)/6*Math.PI*2;ctx.moveTo(Math.cos(a)*48,Math.sin(a)*48);ctx.lineTo(Math.cos(b)*48,Math.sin(b)*48);}ctx.stroke();
  ctx.fillStyle="rgba(180,255,255,.9)";ctx.font="10px serif";for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.fillText("ᚠᚢᚦᚨᚱᚲ"[i%6],Math.cos(a)*40-3,Math.sin(a)*40+3);}ctx.restore();
  const beam=introStep===0?Math.min(1,t/60):Math.max(0,1-(t-60)/80);if(beam>0){ctx.globalCompositeOperation="lighter";const g=ctx.createLinearGradient(cx-20,0,cx+20,0);g.addColorStop(0,"rgba(120,220,255,0)");g.addColorStop(.5,`rgba(220,255,255,${beam*.8})`);g.addColorStop(1,"rgba(120,220,255,0)");ctx.fillStyle=g;ctx.fillRect(cx-20,0,40,cy);ctx.globalCompositeOperation="source-over";}
  if(Math.random()<.5)particles.push({x:cx+(Math.random()-.5)*90,y:cy+(Math.random()-.5)*30,z:0,vx:0,vy:0,vz:.5,life:40,max:40,col:[150,240,255],size:2,kind:"magic"});
  for(const p of particles){p.z+=p.vz;p.life--;ctx.fillStyle=`rgba(${p.col[0]},${p.col[1]},${p.col[2]},${p.life/40})`;ctx.fillRect(p.x,p.y-p.z,p.size,p.size);}particles=particles.filter(p=>p.life>0);
  if(t>30){ctx.save();ctx.globalAlpha=Math.min(1,(t-30)/40);ctx.drawImage(chibi(HERO_LOOK,3,0),cx-15,cy-40,30,45);ctx.restore();}
}

const SPCD={};const SPCDMS=k=>k==="meteor"?3000:k==="blade"||k==="wall"?1200:400;
function buildHotbar(){if(document.getElementById("hotbar"))return;const hb=document.createElement("div");hb.id="hotbar";
  const st=document.createElement("style");st.textContent="#hotbar{position:fixed;right:max(8px,env(safe-area-inset-right));bottom:calc(150px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(4,44px);gap:6px;z-index:20;touch-action:none}#hotbar button{position:relative;width:44px;height:44px;border-radius:12px;border:2px solid #2b1a12;background:rgba(60,40,90,.8);color:#fff;font-size:20px;padding:0;overflow:hidden}#hotbar button.low{opacity:.4}#hotbar .cd{position:absolute;inset:0;pointer-events:none}#hotbar small{position:absolute;left:3px;top:1px;font-size:9px;opacity:.8}@media (orientation:landscape){#hotbar{bottom:calc(130px + env(safe-area-inset-bottom));grid-template-columns:repeat(4,40px)}#hotbar button{width:40px;height:40px}}";
  document.head.appendChild(st);
  SPELL_ORDER.forEach((k,i)=>{const b=document.createElement("button");b.id="sp_"+k;b.title=SPELLS[k].n;b.innerHTML=`<small>${i+1}</small>${SPELLS[k].ic}<span class="cd"></span>`;
    const go=e=>{e.preventDefault();e.stopPropagation();if(state!=="play"||paused)return;curSpell=k;updateSpellBtn();castSpell(k);};
    b.addEventListener("touchstart",go,{passive:false});b.addEventListener("click",go);hb.appendChild(b);});document.body.appendChild(hb);}
function updateHotbar(){if(!P||!P.mag)return;const now=performance.now();for(const k of SPELL_ORDER){const b=document.getElementById("sp_"+k);if(!b)continue;
  b.classList.toggle("low",P.mag.mp<SPELLS[k].mp);const r=Math.max(0,((SPCD[k]||0)-now)/SPCDMS(k));b.lastChild.style.background=r>0?`conic-gradient(rgba(0,0,0,.6) ${r*360}deg,transparent 0)`:"";}}
setInterval(()=>{try{buildHotbar();updateHotbar();}catch(_){}} ,100);
