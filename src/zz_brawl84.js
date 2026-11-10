// ===== v84 WAR BRAWLS =====
// Near the camera, one front becomes a fight: soldiers charge and swing, archers
// loose volleys, mages cast, and the losing line retreats. Far fronts stay a
// number on the war. Nobody in this list is a civilian or a child, and the
// fight refuses to step inside a town. The fallen fade. They do not leave graves.
const BRAWL={war:null,men:[],bolts:[],on:0,cd:0,kills:[0,0]};
const BRAWL_CAP=36;
function brawlTown(x,y){const tx=x/TILE,ty=y/TILE;for(const s of SETS){if(s.island)continue;if(Math.hypot(s.x-tx,s.y-ty)<(s.r||16)+3)return s;}return null;}
function brawlWild(x,y){if(brawlTown(x,y))return false;const tx=x/TILE|0,ty=y/TILE|0;return typeof fightTile!=="function"||fightTile(tx,ty);}
function brawlNear(w){if(!w||w.over||!hero)return false;let f;try{f=frontOf(w);}catch(_){return false;}
  if(Math.hypot(f.x*TILE-hero.x,f.y*TILE-hero.y)>460)return false;
  if(brawlTown(f.x*TILE,f.y*TILE))return false;return f;}
function brawlRole(i){return i%8>=6?"mage":i%8>=4?"archer":"melee";}
function brawlSpawn(w,side,i,fromCity){const f=frontOf(w);const ang=f.ang,nx=-Math.sin(ang),ny=Math.cos(ang),dir=side?1:-1;
  const back=fromCity?110:(22+(i%5)*7),along=((i%9)-4)*16;
  let x=f.x*TILE+Math.cos(ang)*dir*back+nx*along,y=f.y*TILE+Math.sin(ang)*dir*back+ny*along;
  if(typeof warLandPx==="function"){const q=warLandPx(x,y);x=q.x;y=q.y;}
  if(!brawlWild(x,y))return null;
  const role=brawlRole(i);const hp=role==="mage"?3:4;
  return{side,role,k:side?w.b:w.a,x,y,hp,max:hp,cd:8+(i%7)*4,stagger:0,kx:0,ky:0,fade:0,flee:0,swing:0,dir:side?1:2,banner:i===0,march:fromCity?1:0,id:side*40+i};}
function brawlFill(w,n){const men=BRAWL.men;for(let side=0;side<2;side++)for(let i=0;i<n;i++){if(men.length>=BRAWL_CAP)return;const m=brawlSpawn(w,side,i,0);if(m)men.push(m);}}
function brawlHideSlots(w){const B=typeof BFIELD!=="undefined"&&BFIELD[w.id];if(!B)return;for(const m of B.men){m.x=-8000;m.y=-8000;}}
function brawlAlive(side){let n=0;for(const m of BRAWL.men)if(m.side===side&&m.hp>0&&!m.fade)n++;return n;}
function brawlFoe(m,w){let best=null,bd=m.role==="melee"?78:150,heroHit=0;
  for(const o of BRAWL.men){if(o.side===m.side||o.hp<=0||o.fade)continue;const d=Math.hypot(o.x-m.x,o.y-m.y);if(d<bd){bd=d;best=o;}}
  const join=w.hero==="a"?0:w.hero==="b"?1:-1;
  if(join>=0&&m.side!==join&&!(P&&P.fly>16)){const d=Math.hypot(hero.x+6-m.x,hero.y+6-m.y);if(d<bd&&d<160&&!brawlTown(hero.x,hero.y)){best=null;heroHit=1;bd=d;}}
  return{best,heroHit,bd};}
function brawlSpark(x,y,ang,col){if(typeof particles==="undefined")return;const c=col||[220,200,140];
  for(let i=0;i<3;i++)particles.push({x,y,z:2,vx:Math.cos(ang)*(0.6+Math.random()),vy:Math.sin(ang)*(0.6+Math.random()),vz:.3,life:12,max:12,col:c,size:2,kind:"spark"});}
function brawlDust(x,y){if(typeof particles==="undefined")return;particles.push({x,y,z:0,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*.5,vz:.1,life:16,max:16,col:[150,130,90],size:2,kind:"spark"});}
function brawlHurt(m,dmg,ang){if(!m||m.hp<=0)return;m.hp-=dmg;m.stagger=10;m.kx=Math.cos(ang)*2.4;m.ky=Math.sin(ang)*2.4;m.swing=0;
  brawlSpark(m.x,m.y-8,ang,[255,220,140]);if(frameN%4===0){try{SFX.hit();}catch(_){}}
  if(m.hp<=0){m.hp=0;m.fade=26;BRAWL.kills[m.side]=(BRAWL.kills[m.side]||0)+1;brawlDust(m.x,m.y);}}
function brawlStepMan(w,m){if(m.hp<=0){if(m.fade>0)m.fade--;return;}
  if(m.stagger>0){m.stagger--;const nx=m.x+m.kx,ny=m.y+m.ky;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}m.kx*=0.6;m.ky*=0.6;return;}
  const f=frontOf(w);const ang=f.ang;const fx=f.x*TILE,fy=f.y*TILE;
  const broken=brawlAlive(m.side)<=4;
  if(broken)m.flee=1;
  if(m.flee){const dir=m.side?1:-1;const tx=m.x+Math.cos(ang)*dir*1.4,ty=m.y+Math.sin(ang)*dir*1.4;
    if(brawlWild(tx,ty)){m.x=tx;m.y=ty;}m.dir=dir>0?2:1;if(Math.hypot(m.x-fx,m.y-fy)>150)m.fade=18;return;}
  if(m.march){const dx=fx-m.x,dy=fy-m.y,d=Math.hypot(dx,dy)||1;const nx=m.x+dx/d*1.25,ny=m.y+dy/d*1.25;
    if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}m.dir=dx<0?1:2;if(d<48)m.march=0;return;}
  const aim=brawlFoe(m,w);m.cd--;
  if(aim.heroHit){const dx=hero.x+6-m.x,dy=hero.y+6-m.y,d=Math.hypot(dx,dy)||1;m.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
    if(m.role==="melee"&&d>16){const nx=m.x+dx/d*1.15,ny=m.y+dy/d*1.15;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
    if(m.cd<=0&&d<(m.role==="melee"?20:130)){m.cd=m.role==="melee"?32:m.role==="archer"?48:64;m.swing=8;
      if(m.role==="melee"){hurtHero(1,Math.atan2(dy,dx));brawlDust(m.x,m.y);if(frameN%3===0)try{SFX.swing();}catch(_){}}
      else BRAWL.bolts.push({x:m.x,y:m.y-10,vx:dx/d*2.6,vy:dy/d*2.6,life:28,side:m.side,mage:m.role==="mage",hero:1});}
    return;}
  const o=aim.best;if(!o){const dir=m.side?-1:1;const nx=m.x+Math.cos(ang)*dir*0.6,ny=m.y+Math.sin(ang)*dir*0.6;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}return;}
  const dx=o.x-m.x,dy=o.y-m.y,d=Math.hypot(dx,dy)||1;m.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
  const want=m.role==="melee"?14:m.role==="archer"?78:96;
  if(d>want+8){const nx=m.x+dx/d*(m.role==="melee"?1.2:0.7),ny=m.y+dy/d*(m.role==="melee"?1.2:0.7);if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
  else if(m.role!=="melee"&&d<want-18){const nx=m.x-dx/d*0.5,ny=m.y-dy/d*0.5;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
  if(m.role==="melee"&&(m.id+frameN)%3===0){for(const a of BRAWL.men){if(a===m||a.side!==m.side||a.hp<=0)continue;const ad=Math.hypot(a.x-m.x,a.y-m.y);if(ad>0&&ad<9){m.x+=(m.x-a.x)/ad*0.45;m.y+=(m.y-a.y)/ad*0.45;break;}}}
  if(m.cd<=0&&d<want+16){m.cd=m.role==="melee"?26:m.role==="archer"?42:58;m.swing=8;
    if(m.role==="melee"){brawlHurt(o,1,Math.atan2(dy,dx));brawlDust((m.x+o.x)/2,(m.y+o.y)/2);if(frameN%3===0)try{SFX.swing();}catch(_){}}
    else{BRAWL.bolts.push({x:m.x,y:m.y-10,vx:dx/d*2.8,vy:dy/d*2.8,life:26,side:m.side,mage:m.role==="mage",hero:0,tx:o});if(frameN%6===0)try{SFX.blip();}catch(_){}}}}
function brawlBolts(w){for(let i=BRAWL.bolts.length-1;i>=0;i--){const b=BRAWL.bolts[i];b.x+=b.vx;b.y+=b.vy;b.life--;
  if(b.life<=0||!brawlWild(b.x,b.y)){BRAWL.bolts.splice(i,1);continue;}
  if(b.hero){if(Math.hypot(hero.x+6-b.x,hero.y+4-b.y)<12){hurtHero(1,Math.atan2(b.vy,b.vx));brawlSpark(b.x,b.y,0,b.mage?[170,140,255]:[240,220,160]);BRAWL.bolts.splice(i,1);}continue;}
  for(const m of BRAWL.men){if(m.side===b.side||m.hp<=0||m.fade)continue;if(Math.hypot(m.x-b.x,m.y-8-b.y)<11){brawlHurt(m,b.mage?2:1,Math.atan2(b.vy,b.vx));BRAWL.bolts.splice(i,1);break;}}}}
function brawlHeroSwing(w){if(!w.hero||hero.swinging<0||hero.swingT<2||hero.swingT>5||hero._brHit)return;hero._brHit=1;
  const side=w.hero==="a"?1:0;
  for(const m of BRAWL.men){if(m.side!==side||m.hp<=0||m.fade)continue;if(Math.hypot(m.x-hero.x-6,m.y-hero.y-6)<24)brawlHurt(m,2,Math.atan2(m.y-hero.y,m.x-hero.x));}}
function brawlProjectiles(w){if(typeof projectiles==="undefined"||!w.hero)return;const enemy=w.hero==="a"?1:0;
  for(const p of projectiles){if(!p||p.dead||!p.friendly)continue;for(const m of BRAWL.men){if(m.side!==enemy||m.hp<=0||m.fade)continue;if(Math.hypot(m.x-p.x,m.y-8-p.y)<14){p.dead=true;brawlHurt(m,2,Math.atan2(p.vy||0,p.vx||1));break;}}}}
function brawlPressure(w){if(BRAWL.cd>0){BRAWL.cd--;return;}BRAWL.cd=50;
  const a=brawlAlive(0),b=brawlAlive(1);w.p=Math.max(-1.1,Math.min(1.1,w.p+(a-b)*0.02));
  if(w.p>=1){try{capture(w,w.a,w.b);}catch(_){}}else if(w.p<=-1){try{capture(w,w.b,w.a);}catch(_){}}}
function brawlReinforce(w){if(BRAWL.men.length>=BRAWL_CAP||frameN%90!==0)return;
  for(let side=0;side<2;side++){if(brawlAlive(side)>=8)continue;for(let k=0;k<2&&BRAWL.men.length<BRAWL_CAP;k++){const m=brawlSpawn(w,side,20+side*3+k+(frameN%5),1);if(m)BRAWL.men.push(m);}}}
function brawlTick(){window.__brawlOn=0;if(!world||!hero||state!=="play"||room||(P&&P.fly>=28)){BRAWL.on=0;BRAWL.men.length=0;BRAWL.bolts.length=0;return;}
  let best=null,bd=1e9;for(const w of world.wars||[]){if(w.over)continue;const f=brawlNear(w);if(!f)continue;const d=Math.hypot(f.x*TILE-hero.x,f.y*TILE-hero.y);if(d<bd){bd=d;best=w;}}
  if(!best){BRAWL.war=null;BRAWL.on=0;if(frameN%120===0){BRAWL.men.length=0;BRAWL.bolts.length=0;}return;}
  if(!BRAWL.war||BRAWL.war.id!==best.id){BRAWL.war=best;BRAWL.men.length=0;BRAWL.bolts.length=0;BRAWL.kills=[0,0];brawlFill(best,14);}
  BRAWL.on=1;window.__brawlOn=1;brawlHideSlots(best);
  if(hero.swinging<0)hero._brHit=0;
  for(const m of BRAWL.men)brawlStepMan(best,m);
  brawlBolts(best);brawlHeroSwing(best);brawlProjectiles(best);brawlReinforce(best);brawlPressure(best);
  for(let i=BRAWL.men.length-1;i>=0;i--)if(BRAWL.men[i].fade===0&&BRAWL.men[i].hp<=0)BRAWL.men.splice(i,1);}
function brawlDraw(){if(!BRAWL.on||!BRAWL.men.length)return;const w=BRAWL.war;if(!w)return;
  for(const b of BRAWL.bolts){ctx.strokeStyle=b.mage?"#c8a0ff":"#f0e2b0";ctx.lineWidth=b.mage?2:1;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*2,b.y-b.vy*2);ctx.stroke();}
  for(const m of BRAWL.men){if(m.hp<=0&&!m.fade)continue;const K=KINGDOMS[m.k]||KINGDOMS[0];
    ctx.save();if(m.fade)ctx.globalAlpha=Math.max(0,m.fade/26);
    ctx.fillStyle=K.col;ctx.fillRect(m.x-5,m.y-8,10,4);
    try{const L={...chibiLook(8400+m.id*3,"guard","human"),cloth:K.rgb};drawChibi(L,m.x,m.y-(m.stagger?2:0),m.dir,(m.swing||m.march)?(frameN>>1)%2:(frameN>>3)%2,m.role==="mage"?0.92:1);}catch(_){}
    if(m.swing>0){m.swing--;ctx.strokeStyle=m.role==="mage"?"#d2b0ff":"#f4f4f4";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(m.x+2,m.y-10);ctx.lineTo(m.x+(m.dir===1?-12:12),m.y-16);ctx.stroke();}
    if(m.banner&&m.hp>0){ctx.fillStyle="#3a2a18";ctx.fillRect(m.x+6,m.y-28,2,20);ctx.fillStyle=K.col;ctx.fillRect(m.x+8,m.y-28,9,6);}
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(m.x-6,m.y+2,12,2);ctx.fillStyle=m.hp>2?"#3ecf6e":"#e23b3b";ctx.fillRect(m.x-6,m.y+2,12*(m.hp/m.max),2);
    ctx.restore();}
  const f=frontOf(w);ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.lineWidth=2;ctx.strokeStyle="#000";ctx.fillStyle="#ffe6c0";
  const lab=(brawlAlive(0))+"–"+(brawlAlive(1))+(w.hero?" · you with "+(w.hero==="a"?KINGDOMS[w.a].name:KINGDOMS[w.b].name):"");
  ctx.strokeText(lab,f.x*TILE,f.y*TILE-48);ctx.fillText(lab,f.x*TILE,f.y*TILE-48);}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{brawlTick();}catch(e){console.warn("brawl",e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(BRAWL.on&&state==="play"&&hero&&!(P&&P.fly>=28)){ctx.save();
  const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:Math.max(0.42,1-P.fly/46)):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);ctx.imageSmoothingEnabled=false;brawlDraw();ctx.restore();}}catch(e){try{ctx.restore();}catch(_){}}return r;};}
window.__BRAWL84={get on(){return BRAWL.on},get men(){return BRAWL.men},get bolts(){return BRAWL.bolts},cap:BRAWL_CAP,tick:brawlTick,alive:brawlAlive};
