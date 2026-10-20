// ===== v41 SPELLS AS PROJECTILES: frost beam, earthquake fissure, meteor shot, spirit blade throw, new Black Hole vortex.
// All offensive spells fire in the facing direction (soft-aim like thunder). Only hostile monsters are hit: never townsfolk, kids or pets. =====
NEWSP.frost.n="Ice Beam";NEWSP.frost.desc="A beam of ice in the facing direction: damages, freezes, then slows foes it touches.";SPELLS.frost.n="Ice Beam";
NEWSP.quake.desc="Splits the ground in a crack running forward: damages and stuns every foe along the fissure.";
NEWSP.meteor.desc="Hurls a blazing meteor forward: it smashes into the first foe (or lands at range) in a huge blast.";
NEWSP.blade.desc="Throws a spectral blade that pierces foes, and your sword glows: +2 damage for 20 seconds.";
NEWSP.blackhole={n:"Black Hole",ic:"🌀",mp:30,col:[150,90,255],unlock:{lv:12},desc:"A dark orb flies forward, then collapses into a vortex that drags foes in and grinds them for a few seconds."};
SPELLS.blackhole={n:"Black Hole",ic:"🌀",mp:30,col:[150,90,255]};SP_COL.blackhole="#965aff";
const SP41=[];
const foes41=()=>mobs.filter(e=>!e.dead&&!e.pet&&!(e.def&&(e.def.beh==="pea"||e.def.beh==="flee")));
function aim41(cx,cy){const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const ang=Math.atan2(dy,dx);let best=null,bd=220;
  for(const e of foes41()){const ex=e.x+e.w/2,ey=e.y+e.h/2,d=Math.hypot(ex-cx,ey-cy);const a=Math.atan2(ey-cy,ex-cx);const df=Math.abs(((a-ang)+Math.PI*3)%(Math.PI*2)-Math.PI);if(df<0.7&&d<bd){bd=d;best=a;}}return best==null?ang:best;}
function hit41(e,d,ang,st){if(e.sp==="dragon"){try{hitDragon(e,0);}catch(_){}return;}e.iframes=0;hurtEnemy(e,d,ang,false);if(st)e.stun=Math.max(e.stun||0,st);}
{const _cn=castNew;castNew=function(k){if(!["frost","quake","meteor","blade","blackhole"].includes(k))return _cn.apply(this,arguments);
  const s=SPELLS[k],m=P.mag;SPCD[k]=SPCD[k]||0;const now=performance.now();if(SPCD[k]>now)return false;if(!spellUnlocked(k))return false;if(m.mp<s.mp){toast("Not enough mana.");return false;}
  SPCD[k]=now+({frost:1200,quake:2600,blade:5000,meteor:4000,blackhole:5000})[k];m.mp-=s.mp;m.xp[k]=(m.xp[k]||0)+1;const lv=spellLv(k);hero.castT=20;window.__lastNewSpell=k;
  const cx=hero.x+6,cy=hero.y+6,a=aim41(cx,cy),vx=Math.cos(a),vy=Math.sin(a);
  if(k==="frost")SP41.push({k,x:cx,y:cy,a,len:0,max:150,life:34,dmg:1+Math.floor(lv/3),hit:new Set()});
  if(k==="quake"){SP41.push({k,x:cx,y:cy+2,a,len:0,max:170,life:70,dmg:2+Math.floor(lv/2),hit:new Set(),seed:Math.random()*99,pts:[]});shake=Math.max(shake,8);}
  if(k==="meteor")SP41.push({k,x:cx,y:cy,vx:vx*3.6,vy:vy*3.6,life:60,dmg:4+lv,z:18});
  if(k==="blade"){blade36=performance.now()+20000;m.blade=Math.max(m.blade||0,1200);SP41.push({k,x:cx,y:cy,vx:vx*5,vy:vy*5,a,life:44,dmg:2+Math.floor(lv/2),hit:new Set()});}
  if(k==="blackhole")SP41.push({k,x:cx,y:cy,vx:vx*3,vy:vy*3,life:34,phase:"fly",dmg:1+Math.floor(lv/3),t:0});
  try{SFX.spell&&SFX.spell(k==="frost"?"heal":"fireball");}catch(_){}return true;};}
function upd41(){for(const p of SP41){p.life--;const F=foes41();
  if(p.k==="frost"){p.len=Math.min(p.max,p.len+14);const ex=p.x+Math.cos(p.a)*p.len,ey=p.y+Math.sin(p.a)*p.len;
    for(const e of F){if(p.hit.has(e))continue;const qx=e.x+e.w/2-p.x,qy=e.y+e.h/2-p.y;const t=qx*Math.cos(p.a)+qy*Math.sin(p.a);const off=Math.abs(-qx*Math.sin(p.a)+qy*Math.cos(p.a));if(t>0&&t<p.len&&off<10){p.hit.add(e);hit41(e,p.dmg,p.a,60);e.slowT=180;e.frozen=60;}}
    if(frameN%2===0)particles.push({x:ex,y:ey,z:4,vx:(Math.random()-.5),vy:(Math.random()-.5),vz:.2,life:16,max:16,col:[190,240,255],size:2,kind:"magic"});}
  if(p.k==="quake"){if(p.len<p.max){p.len+=5;const j=Math.sin(p.len*0.21+p.seed)*5+Math.sin(p.len*0.07+p.seed*2)*4;const nx=-Math.sin(p.a),ny=Math.cos(p.a);
      const qx=p.x+Math.cos(p.a)*p.len+nx*j,qy=p.y+Math.sin(p.a)*p.len+ny*j;{p.pts.push([qx,qy]);
      for(let i=0;i<3;i++)particles.push({x:qx,y:qy,z:1,vx:(Math.random()-.5)*1.4,vy:(Math.random()-.5)*1.4,vz:1+Math.random(),life:20,max:20,col:[150,110,70],size:2});
      for(const e of F){if(p.hit.has(e))continue;if(Math.hypot(e.x+e.w/2-qx,e.y+e.h/2-qy)<19){p.hit.add(e);hit41(e,p.dmg,p.a+1.57,90);}}}}}
  if(p.k==="meteor"){p.x+=p.vx;p.y+=p.vy;if(frameN%2===0)particles.push({x:p.x,y:p.y,z:p.z,vx:-p.vx*.2,vy:-p.vy*.2,vz:0,life:18,max:18,col:[255,140,40],size:3,kind:"magic"});
    const hitE=F.find(e=>Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<14);if(hitE||p.life<=0||solidTile((p.x/TILE)|0,(p.y/TILE)|0)){p.life=0;shake=12;for(const e of F)if(Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<56)hit41(e,p.dmg,Math.atan2(e.y-p.y,e.x-p.x),40);
      for(let i=0;i<34;i++){const a=Math.random()*7;particles.push({x:p.x,y:p.y,z:2,vx:Math.cos(a)*3,vy:Math.sin(a)*3,vz:1,life:30,max:30,col:[255,120,40],size:3,kind:"magic"});}}}
  if(p.k==="blade"){p.x+=p.vx;p.y+=p.vy;for(const e of F){if(p.hit.has(e))continue;if(Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<13){p.hit.add(e);hit41(e,p.dmg,p.a,10);}}}
  if(p.k==="blackhole"){if(p.phase==="fly"){p.x+=p.vx;p.y+=p.vy;if(p.life<=0||F.some(e=>Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<14)||solidTile((p.x/TILE)|0,(p.y/TILE)|0)){p.phase="vortex";p.life=180;shake=Math.max(shake,5);}}
    else{p.t++;for(const e of F){const dx=p.x-(e.x+e.w/2),dy=p.y-(e.y+e.h/2),d=Math.hypot(dx,dy);if(d<90&&e.sp!=="dragon"){const pull=Math.min(1.6,40/(d+8));const nx=e.x+dx/(d||1)*pull,ny=e.y+dy/(d||1)*pull;if(!solidTile(((nx+e.w/2)/TILE)|0,((ny+e.h/2)/TILE)|0)){e.x=nx;e.y=ny;}}
        if(d<26&&p.t%20===0)hit41(e,p.dmg,0,8);}
      if(frameN%2===0){const a=Math.random()*7,r=40+Math.random()*30;particles.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,z:3,vx:-Math.cos(a)*r/22+Math.sin(a)*1.2,vy:-Math.sin(a)*r/22-Math.cos(a)*1.2,vz:0,life:20,max:20,col:[170,110,255],size:2,kind:"magic"});}}}}
  for(let i=SP41.length-1;i>=0;i--)if(SP41[i].life<=0)SP41.splice(i,1);
  // freeze then slow: frozen foes skip moves; slowed ones move every other frame
  for(const e of mobs){if(e.slowT>0){e.slowT--;if(!e.stun&&frameN%2===0)e.stun=1;}}}
function draw41(){for(const p of SP41){ctx.save();
  if(p.k==="frost"){const ex=p.x+Math.cos(p.a)*p.len,ey=p.y+Math.sin(p.a)*p.len;ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    for(const [w,c] of [[9,"rgba(120,200,255,.35)"],[5,"rgba(180,235,255,.8)"],[2,"rgba(255,255,255,1)"]]){ctx.strokeStyle=c;ctx.lineWidth=w*(p.life/34+.3);ctx.beginPath();ctx.moveTo(p.x,p.y-4);ctx.lineTo(ex,ey-4);ctx.stroke();}
    for(let s=10;s<p.len;s+=18){const x=p.x+Math.cos(p.a)*s,y=p.y+Math.sin(p.a)*s-4;ctx.fillStyle="rgba(230,250,255,.9)";ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+2,y);ctx.lineTo(x,y+4);ctx.lineTo(x-2,y);ctx.fill();}}
  if(p.k==="quake"&&p.pts.length){const al=Math.min(1,p.life/30);ctx.lineJoin="round";ctx.strokeStyle=`rgba(40,22,14,${al})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x,p.y);for(const [x,y] of p.pts)ctx.lineTo(x,y);ctx.stroke();
    ctx.strokeStyle=`rgba(255,140,60,${al*.7})`;ctx.lineWidth=1.5;ctx.stroke();ctx.strokeStyle=`rgba(40,22,14,${al})`;ctx.lineWidth=2;for(let i=3;i<p.pts.length;i+=4){const [x,y]=p.pts[i];const b=(i%8?1:-1)*1.2+p.a;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(b)*7,y+Math.sin(b)*7);ctx.stroke();}
    ctx.fillStyle=`rgba(120,90,60,${al})`;for(let i=0;i<p.pts.length;i+=3){const [x,y]=p.pts[i];ctx.fillRect(x-4,y-3,3,2);ctx.fillRect(x+2,y+1,3,2);}}
  if(p.k==="meteor"){ctx.globalCompositeOperation="lighter";const g=ctx.createRadialGradient(p.x,p.y-8,1,p.x,p.y-8,12);g.addColorStop(0,"rgba(255,250,200,1)");g.addColorStop(.5,"rgba(255,120,30,.9)");g.addColorStop(1,"rgba(200,30,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y-8,12,0,7);ctx.fill();
    ctx.globalCompositeOperation="source-over";ctx.fillStyle="#4a2a1a";ctx.beginPath();ctx.arc(p.x,p.y-8,4,0,7);ctx.fill();}
  if(p.k==="blade"){ctx.translate(p.x,p.y-6);ctx.rotate(p.a);ctx.globalCompositeOperation="lighter";ctx.fillStyle="rgba(255,120,235,.5)";ctx.fillRect(-12,-3,22,6);ctx.fillStyle="#ffe6fb";ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-2);ctx.lineTo(-6,2);ctx.fill();ctx.fillStyle="#ffd23a";ctx.fillRect(-8,-4,2,8);}
  if(p.k==="blackhole"){const R=p.phase==="fly"?6:14+Math.sin(p.t*0.2)*2;ctx.translate(p.x,p.y-6);
    if(p.phase!=="fly"){ctx.rotate(p.t*0.12);for(let i=0;i<3;i++){ctx.rotate(2.09);ctx.strokeStyle=`rgba(${170-i*30},${100+i*20},255,.7)`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,R+10+i*6,0,2.2);ctx.stroke();}}
    const g=ctx.createRadialGradient(0,0,1,0,0,R+6);g.addColorStop(0,"#000");g.addColorStop(.6,"#120424");g.addColorStop(.85,"rgba(160,90,255,.9)");g.addColorStop(1,"rgba(160,90,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R+6,0,7);ctx.fill();}
  ctx.restore();}}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state==="play"&&!paused)upd41();}catch(e){console.warn(e);}};}
{const _dm=drawMagic;drawMagic=function(){_dm.apply(this,arguments);try{draw41();}catch(_){}};}
// no "New spell for your Spellbook" toasts: learn silently, note it in the journal
{const _us=unlockSpells;unlockSpells=function(){const before=new Set((P.mag&&P.mag.known)||[]);_us.apply(this,arguments);try{if(before.size)for(const k of P.mag.known)if(!before.has(k)&&NEWSP[k])jAdd(`I learned a new spell: ${SPELLS[k].n}.`,"skills");}catch(_){}};}
const getSP41=()=>SP41;
