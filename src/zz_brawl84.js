// ===== v84 WAR BRAWLS + v85 ARMIES =====
// A country fields a share of its people. Sprites near the camera are squads,
// capped at 36. The headcount falls as those squads fall, and reserves step in
// until that army is gone or its morale breaks. Survivors of a surrender walk
// home. The fallen fade. No graves, no towns, no civilians.
const BRAWL={war:null,men:[],bolts:[],on:0,cd:0,kills:[0,0],seq:1};
const BRAWL_CAP=36;
function brawlTown(x,y){const tx=x/TILE,ty=y/TILE;for(const s of SETS){if(s.island)continue;if(Math.hypot(s.x-tx,s.y-ty)<(s.r||16)+3)return s;}return null;}
function brawlWild(x,y){if(brawlTown(x,y))return false;const tx=x/TILE|0,ty=y/TILE|0;return typeof fightTile!=="function"||fightTile(tx,ty);}
function brawlNear(w){if(!w||w.over||!hero)return false;let f;try{f=frontOf(w);}catch(_){return false;}
  if(Math.hypot(f.x*TILE-hero.x,f.y*TILE-hero.y)>460)return false;
  if(brawlTown(f.x*TILE,f.y*TILE))return false;return f;}
function seedPop(){if(!world)return null;if(world.pop85&&world.pop85.n)return world.pop85;
  const n={},base={};for(const k of KINGDOMS){n[k.id]=0;base[k.id]=0;}
  for(const s of SETS){if(s.island)continue;const k=typeof kOf==="function"?kOf(s.id):-1;if(k==null||k<0||!KINGDOMS[k])continue;
    const add=/capital/.test(s.kind||"")?520:/town/.test(s.kind||"")?280:150;n[k]+=add;}
  for(const k of KINGDOMS)if(!n[k.id])n[k.id]=220;
  for(const id in n)base[id]=n[id];
  world.pop85={n,base,day:world.day||0};return world.pop85;}
function popOf(k){const P85=seedPop();return P85&&P85.n[k]||0;}
function fielded(k){let n=0;for(const w of world.wars||[]){if(w.over||!w.army)continue;if(w.a===k)n+=w.army.a||0;if(w.b===k)n+=w.army.b||0;}return n;}
function ensureArmy(w){if(w.army&&w.army.baseA)return w.army;seedPop();
  const levy=k=>{const p=popOf(k);const take=Math.max(48,Math.min(Math.round(p*0.22),Math.max(48,p-70)));return Math.min(take,p);};
  const a=levy(w.a),b=levy(w.b);
  world.pop85.n[w.a]=Math.max(40,(world.pop85.n[w.a]||0)-a);
  world.pop85.n[w.b]=Math.max(40,(world.pop85.n[w.b]||0)-b);
  w.army={a,b,baseA:a,baseB:b,bannerA:1,bannerB:1,cmdA:1,cmdB:1,morA:100,morB:100,surrendered:null,done:0,yieldT:0,wipe:null,day:world.day||0};
  try{jAdd(KINGDOMS[w.a].name+" sends "+a+" and "+KINGDOMS[w.b].name+" sends "+b+" to the front.","war");}catch(_){}
  return w.army;}
function armyMorale(w,side){const A=w.army;const mine=side?A.b:A.a,theirs=side?A.a:A.b,base=Math.max(1,side?A.baseB:A.baseA);
  let m=72-(1-mine/base)*62;if(!(side?A.bannerB:A.bannerA))m-=18;if(!(side?A.cmdB:A.cmdA))m-=14;
  if(mine*1.4<theirs)m-=12;const home=popOf(side?w.b:w.a),seed=(world.pop85.base[side?w.b:w.a])||home;if(home<seed*0.45)m-=10;
  m=Math.max(0,Math.min(100,Math.round(m)));if(side)A.morB=m;else A.morA=m;return m;}
function brawlRole(i){return i%8>=6?"mage":i%8>=4?"archer":"melee";}
function brawlSpawn(w,side,i,fromCity){const f=frontOf(w);const ang=f.ang,nx=-Math.sin(ang),ny=Math.cos(ang),dir=side?1:-1;
  const back=fromCity?110:(22+(i%5)*7),along=((i%9)-4)*16;
  let x=f.x*TILE+Math.cos(ang)*dir*back+nx*along,y=f.y*TILE+Math.sin(ang)*dir*back+ny*along;
  if(typeof warLandPx==="function"){const q=warLandPx(x,y);x=q.x;y=q.y;}
  if(!brawlWild(x,y))return null;
  const role=brawlRole(i);const hp=role==="mage"?3:4;
  return{side,role,k:side?w.b:w.a,x,y,hp,max:hp,cd:8+(i%7)*4,stagger:0,kx:0,ky:0,fade:0,flee:0,swing:0,dir:side?1:2,banner:i===0,captain:i===1,yield:0,march:fromCity?1:0,id:BRAWL.seq++};}
function brawlSprites(side){let n=0;for(const m of BRAWL.men)if(m.side===side&&m.hp>0&&!m.fade)n++;return n;}
function brawlFill(w){for(let side=0;side<2;side++)for(let i=0;i<14;i++){if(BRAWL.men.length>=BRAWL_CAP)return;const m=brawlSpawn(w,side,i,0);if(m)BRAWL.men.push(m);}}
function brawlHideSlots(w){const B=typeof BFIELD!=="undefined"&&BFIELD[w.id];if(!B)return;for(const m of B.men){m.x=-8000;m.y=-8000;}}
function brawlFoe(m,w){if(w.army&&(w.army.surrendered||w.army.done))return{best:null,heroHit:0};
  let best=null,bd=m.role==="melee"?78:150,heroHit=0;
  for(const o of BRAWL.men){if(o.side===m.side||o.hp<=0||o.fade||o.yield)continue;const d=Math.hypot(o.x-m.x,o.y-m.y);if(d<bd){bd=d;best=o;}}
  const join=w.hero==="a"?0:w.hero==="b"?1:-1;
  if(join>=0&&m.side!==join&&!(P&&P.fly>16)){const d=Math.hypot(hero.x+6-m.x,hero.y+6-m.y);if(d<bd&&d<160&&!brawlTown(hero.x,hero.y)){best=null;heroHit=1;bd=d;}}
  return{best,heroHit,bd};}
function brawlSpark(x,y,ang,col){if(typeof particles==="undefined")return;const c=col||[220,200,140];
  for(let i=0;i<3;i++)particles.push({x,y,z:2,vx:Math.cos(ang)*(0.6+Math.random()),vy:Math.sin(ang)*(0.6+Math.random()),vz:.3,life:12,max:12,col:c,size:2,kind:"spark"});}
function brawlDust(x,y){if(typeof particles==="undefined")return;particles.push({x,y,z:0,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*.5,vz:.1,life:16,max:16,col:[150,130,90],size:2,kind:"spark"});}
function brawlSquad(w,side){const A=w.army;const base=Math.max(1,side?A.baseB:A.baseA);return Math.max(4,Math.round(base/18));}
function brawlHurt(m,dmg,ang){const w=BRAWL.war;if(!m||m.hp<=0||m.yield)return;if(w&&w.army&&(w.army.surrendered||w.army.done))return;
  m.hp-=dmg;m.stagger=10;m.kx=Math.cos(ang)*2.4;m.ky=Math.sin(ang)*2.4;m.swing=0;
  brawlSpark(m.x,m.y-8,ang,[255,220,140]);if(frameN%4===0){try{SFX.hit();}catch(_){}}
  if(m.hp<=0){m.hp=0;m.fade=26;BRAWL.kills[m.side]=(BRAWL.kills[m.side]||0)+1;brawlDust(m.x,m.y);
    if(w&&w.army){const A=w.army,key=m.side?"b":"a";const loss=Math.min(A[key],brawlSquad(w,m.side));A[key]=Math.max(0,A[key]-loss);
      if(m.banner){if(m.side)A.bannerB=0;else A.bannerA=0;}if(m.captain){if(m.side)A.cmdB=0;else A.cmdA=0;}}}}
function brawlStepMan(w,m){if(m.hp<=0){if(m.fade>0)m.fade--;return;}
  const A=w.army;
  if(A&&A.surrendered){const loser=A.surrendered==="a"?0:1;
    if(m.side===loser){m.yield=1;m.swing=0;const ang=frontOf(w).ang,dir=m.side?1:-1;const nx=m.x+Math.cos(ang)*dir*0.45,ny=m.y+Math.sin(ang)*dir*0.45;
      if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}m.dir=dir>0?2:1;return;}
    m.swing=0;return;}
  if(m.stagger>0){m.stagger--;const nx=m.x+m.kx,ny=m.y+m.ky;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}m.kx*=0.6;m.ky*=0.6;return;}
  const f=frontOf(w);const ang=f.ang,fx=f.x*TILE,fy=f.y*TILE;
  if(m.march){const dx=fx-m.x,dy=fy-m.y,d=Math.hypot(dx,dy)||1;const nx=m.x+dx/d*1.25,ny=m.y+dy/d*1.25;
    if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}m.dir=dx<0?1:2;if(d<48)m.march=0;return;}
  const aim=brawlFoe(m,w);m.cd--;
  if(aim.heroHit){const dx=hero.x+6-m.x,dy=hero.y+6-m.y,d=Math.hypot(dx,dy)||1;m.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
    if(m.role==="melee"&&d>16){const nx=m.x+dx/d*1.15,ny=m.y+dy/d*1.15;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
    if(m.cd<=0&&d<(m.role==="melee"?20:130)){m.cd=m.role==="melee"?32:m.role==="archer"?48:64;m.swing=8;
      if(m.role==="melee"){hurtHero(1,Math.atan2(dy,dx));brawlDust(m.x,m.y);if(frameN%3===0)try{SFX.swing();}catch(_){}}
      else BRAWL.bolts.push({x:m.x,y:m.y-10,vx:dx/d*2.6,vy:dy/d*2.6,life:28,side:m.side,mage:m.role==="mage",hero:1});}
    return;}
  const o=aim.best;if(!o){const dir=m.side?-1:1;const nx=m.x+Math.cos(ang)*dir*0.55,ny=m.y+Math.sin(ang)*dir*0.55;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}return;}
  const dx=o.x-m.x,dy=o.y-m.y,d=Math.hypot(dx,dy)||1;m.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
  const want=m.role==="melee"?14:m.role==="archer"?78:96;
  if(d>want+8){const nx=m.x+dx/d*(m.role==="melee"?1.2:0.7),ny=m.y+dy/d*(m.role==="melee"?1.2:0.7);if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
  else if(m.role!=="melee"&&d<want-18){const nx=m.x-dx/d*0.5,ny=m.y-dy/d*0.5;if(brawlWild(nx,ny)){m.x=nx;m.y=ny;}}
  if(m.role==="melee"&&(m.id+frameN)%3===0){for(const a of BRAWL.men){if(a===m||a.side!==m.side||a.hp<=0)continue;const ad=Math.hypot(a.x-m.x,a.y-m.y);if(ad>0&&ad<9){if(brawlWild(m.x+(m.x-a.x)/ad*0.45,m.y)){m.x+=(m.x-a.x)/ad*0.45;m.y+=(m.y-a.y)/ad*0.45;}}break;}}
  if(m.cd<=0&&d<want+16){m.cd=m.role==="melee"?26:m.role==="archer"?42:58;m.swing=8;
    if(m.role==="melee"){brawlHurt(o,1,Math.atan2(dy,dx));brawlDust((m.x+o.x)/2,(m.y+o.y)/2);if(frameN%3===0)try{SFX.swing();}catch(_){}}
    else{BRAWL.bolts.push({x:m.x,y:m.y-10,vx:dx/d*2.8,vy:dy/d*2.8,life:26,side:m.side,mage:m.role==="mage",hero:0});if(frameN%6===0)try{SFX.blip();}catch(_){}}}}
function brawlBolts(){const w=BRAWL.war;for(let i=BRAWL.bolts.length-1;i>=0;i--){const b=BRAWL.bolts[i];if(w&&w.army&&w.army.surrendered){BRAWL.bolts.splice(i,1);continue;}
  b.x+=b.vx;b.y+=b.vy;b.life--;if(b.life<=0||!brawlWild(b.x,b.y)){BRAWL.bolts.splice(i,1);continue;}
  if(b.hero){if(Math.hypot(hero.x+6-b.x,hero.y+4-b.y)<12){hurtHero(1,Math.atan2(b.vy,b.vx));brawlSpark(b.x,b.y,0,b.mage?[170,140,255]:[240,220,160]);BRAWL.bolts.splice(i,1);}continue;}
  for(const m of BRAWL.men){if(m.side===b.side||m.hp<=0||m.fade||m.yield)continue;if(Math.hypot(m.x-b.x,m.y-8-b.y)<11){brawlHurt(m,b.mage?2:1,Math.atan2(b.vy,b.vx));BRAWL.bolts.splice(i,1);break;}}}}
function brawlHeroSwing(w){if(!w.hero||!w.army||w.army.surrendered||hero.swinging<0||hero.swingT<2||hero.swingT>5||hero._brHit)return;hero._brHit=1;
  const side=w.hero==="a"?1:0;
  for(const m of BRAWL.men){if(m.side!==side||m.hp<=0||m.fade||m.yield)continue;if(Math.hypot(m.x-hero.x-6,m.y-hero.y-6)<24)brawlHurt(m,2,Math.atan2(m.y-hero.y,m.x-hero.x));}}
function brawlProjectiles(w){if(typeof projectiles==="undefined"||!w.hero||w.army&&w.army.surrendered)return;const enemy=w.hero==="a"?1:0;
  for(const p of projectiles){if(!p||p.dead||!p.friendly)continue;for(const m of BRAWL.men){if(m.side!==enemy||m.hp<=0||m.fade||m.yield)continue;if(Math.hypot(m.x-p.x,m.y-8-p.y)<14){p.dead=true;brawlHurt(m,2,Math.atan2(p.vy||0,p.vx||1));break;}}}}
function brawlFinish(w,winner,how){const A=w.army;if(!A||A.done)return;A.done=1;A.yieldT=0;A.day=world.day||0;
  const winK=winner===0?w.a:w.b,loseK=winner===0?w.b:w.a,loseKey=winner===0?"b":"a";
  const left=A[loseKey]|0;
  if(how==="surrender")world.pop85.n[loseK]=(world.pop85.n[loseK]||0)+left;
  A[loseKey]=0;
  w.p=winner===0?1:-1;
  let town=null;try{town=capture(w,winK,loseK);}catch(_){}
  const edge=town&&town.name?town.name+" changes flag.":"The border moves.";
  const msg=how==="surrender"
    ?KINGDOMS[loseK].name+" surrenders. "+left+" soldiers drop their weapons and walk home alive. "+KINGDOMS[winK].name+" pushes the border. "+edge
    :KINGDOMS[loseK].name+"'s army is gone. "+KINGDOMS[winK].name+" pushes the border. "+edge;
  try{jAdd(msg,"war");addNews(-1,msg);}catch(_){}try{toast(msg);}catch(_){}
  const seed=world.pop85.base[loseK]||1;
  if((world.pop85.n[loseK]||0)<seed*0.42){const peace=KINGDOMS[loseK].name+" is too spent to fight on and sues for peace. The treaty keeps the new border.";
    try{endWar(w,"peace");jAdd(peace,"war");addNews(-1,peace);}catch(_){}
    const back=winner===0?A.a:A.b;world.pop85.n[winK]=(world.pop85.n[winK]||0)+back;if(winner===0)A.a=0;else A.b=0;}
  for(const m of BRAWL.men)if(m.hp>0&&!m.yield)m.fade=m.fade||18;}
function brawlMorale(w){const A=w.army;if(!A||A.done||A.surrendered)return;
  for(const side of [0,1]){const mine=side?A.b:A.a,base=Math.max(1,side?A.baseB:A.baseA);
    if(mine<=0){A.wipe=side?"b":"a";return brawlFinish(w,side?0:1,"wipe");}
    const m=armyMorale(w,side);
    if(m<22&&mine<base*0.7){A.surrendered=side?"b":"a";A.yieldT=170;
      const who=KINGDOMS[side?w.b:w.a].name;try{toast(who+" breaks. White flags go up.");}catch(_){}return;}}}
function brawlReinforce(w){const A=w.army;if(!A||A.done||A.surrendered)return;
  if(frameN%200===0){for(const side of [0,1]){const key=side?"b":"a",k=side?w.b:w.a;const home=popOf(k);
    if(A[key]<A[side?"baseB":"baseA"]*0.5&&home>100){const take=Math.min(60,Math.round(home*0.06),home-70);if(take>=24){world.pop85.n[k]=home-take;A[key]+=take;}}}}
  if(frameN%24!==0||BRAWL.men.length>=BRAWL_CAP)return;
  for(let side=0;side<2;side++){const left=side?A.b:A.a;if(left<=0)continue;if(brawlSprites(side)>=14)continue;
    const m=brawlSpawn(w,side,30+(frameN%9),1);if(m)BRAWL.men.push(m);}}
function brawlTick(){window.__brawlOn=0;if(!world||!hero||state!=="play"||room||(P&&P.fly>=28)){BRAWL.on=0;return;}
  seedPop();
  let best=null,bd=1e9;for(const w of world.wars||[]){if(w.over)continue;const f=brawlNear(w);if(!f)continue;const d=Math.hypot(f.x*TILE-hero.x,f.y*TILE-hero.y);if(d<bd){bd=d;best=w;}}
  if(!best){BRAWL.war=null;BRAWL.on=0;if(frameN%120===0){BRAWL.men.length=0;BRAWL.bolts.length=0;}return;}
  ensureArmy(best);
  if(!BRAWL.war||BRAWL.war.id!==best.id){BRAWL.war=best;BRAWL.men.length=0;BRAWL.bolts.length=0;BRAWL.kills=[0,0];if(!best.army.done)brawlFill(best);}
  if(best.army.done&&best.army.day===world.day){BRAWL.on=0;window.__brawlOn=0;return;}
  if(best.army.done){delete best.army;ensureArmy(best);BRAWL.men.length=0;brawlFill(best);}
  BRAWL.on=1;window.__brawlOn=1;brawlHideSlots(best);
  if(best.army.surrendered){best.army.yieldT--;if(best.army.yieldT<=0)brawlFinish(best,best.army.surrendered==="a"?1:0,"surrender");}
  else if(frameN%20===0)brawlMorale(best);
  if(hero.swinging<0)hero._brHit=0;
  for(const m of BRAWL.men)brawlStepMan(best,m);
  brawlBolts();brawlHeroSwing(best);brawlProjectiles(best);brawlReinforce(best);
  for(let i=BRAWL.men.length-1;i>=0;i--)if(BRAWL.men[i].fade===0&&BRAWL.men[i].hp<=0)BRAWL.men.splice(i,1);}
function brawlDraw(){if(!BRAWL.on||!BRAWL.men.length)return;const w=BRAWL.war;if(!w||!w.army)return;
  for(const b of BRAWL.bolts){ctx.strokeStyle=b.mage?"#c8a0ff":"#f0e2b0";ctx.lineWidth=b.mage?2:1;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*2,b.y-b.vy*2);ctx.stroke();}
  for(const m of BRAWL.men){if(m.hp<=0&&!m.fade)continue;const K=KINGDOMS[m.k]||KINGDOMS[0];
    ctx.save();if(m.fade)ctx.globalAlpha=Math.max(0,m.fade/26);
    ctx.fillStyle=K.col;ctx.fillRect(m.x-5,m.y-8,10,4);
    const kneel=m.yield?4:m.stagger?2:0;
    try{const L={...chibiLook(8400+m.id*3,"guard","human"),cloth:K.rgb};drawChibi(L,m.x,m.y+kneel,m.dir,(m.swing||m.march)&&!m.yield?(frameN>>1)%2:(frameN>>3)%2,m.role==="mage"?0.92:1);}catch(_){}
    if(m.yield){ctx.fillStyle="#f7f4ea";ctx.fillRect(m.x+5,m.y-22,8,5);ctx.fillStyle="#3a2a18";ctx.fillRect(m.x+4,m.y-22,1,12);}
    else if(m.swing>0){m.swing--;ctx.strokeStyle=m.role==="mage"?"#d2b0ff":"#f4f4f4";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(m.x+2,m.y-10);ctx.lineTo(m.x+(m.dir===1?-12:12),m.y-16);ctx.stroke();}
    if(m.banner&&m.hp>0&&!m.yield){ctx.fillStyle="#3a2a18";ctx.fillRect(m.x+6,m.y-28,2,20);ctx.fillStyle=K.col;ctx.fillRect(m.x+8,m.y-28,9,6);}
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(m.x-6,m.y+2,12,2);ctx.fillStyle=m.hp>2?"#3ecf6e":"#e23b3b";ctx.fillRect(m.x-6,m.y+2,12*(m.hp/m.max),2);
    ctx.restore();}
  const A=w.army,f=frontOf(w);ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#000";ctx.fillStyle="#ffe6c0";
  const lab=KINGDOMS[w.a].name+" "+A.a+" vs "+KINGDOMS[w.b].name+" "+A.b+(A.surrendered?" · surrender":"");
  ctx.strokeText(lab,f.x*TILE,f.y*TILE-52);ctx.fillText(lab,f.x*TILE,f.y*TILE-52);}
function brawlHud(){if(!BRAWL.on||!BRAWL.war||!BRAWL.war.army)return;const w=BRAWL.war,A=w.army;
  ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.fillStyle="#1a120c";ctx.fillRect(W/2-104,36,208,16);
  ctx.fillStyle="#ffe6b0";ctx.font="bold 8px system-ui";ctx.textAlign="center";
  ctx.fillText(KINGDOMS[w.a].name+" "+A.a+"  vs  "+KINGDOMS[w.b].name+" "+A.b,W/2,47);ctx.restore();}
function popDaily(){if(!world||!world.wars)return;const P85=seedPop();if(P85.day===world.day)return;
  const span=Math.min(14,Math.max(1,world.day-(P85.day||0)));P85.day=world.day;
  for(const k of KINGDOMS){let p=P85.n[k.id]||0;let price=1,c=0;
    try{for(const t of townsOf(k.id)){const ws=world.sets[t.id];if(ws){price+=ws.price||1;c++;}}}catch(_){}
    if(c)price/=c;let g=price<1.05?0.0035:price>1.25?-0.0015:0.001;if(typeof season==="function"&&season()===3)g-=0.0025;
    if((world.day+k.id)%6===0)g-=0.002;
    try{if(hero&&kAtTile((hero.x/TILE)|0,(hero.y/TILE)|0)===k.id&&(world.weather==="storm"||world.weather==="snow"))g-=0.004;}catch(_){}
    P85.n[k.id]=Math.max(60,Math.round(p*(1+g*span)));}
  for(const w of world.wars){if(w.over)continue;if(w.army&&w.army.done&&w.army.day!==world.day)delete w.army;
    if(BRAWL.on&&BRAWL.war&&BRAWL.war.id===w.id)continue;const A=ensureArmy(w);if(A.done||A.surrendered)continue;
    const hitA=Math.max(1,Math.round(A.b*0.02)),hitB=Math.max(1,Math.round(A.a*0.02));
    A.a=Math.max(0,A.a-hitA);A.b=Math.max(0,A.b-hitB);brawlMorale(w);}}
function popLines(){seedPop();return KINGDOMS.filter(k=>!k.demon).map(k=>{const home=popOf(k.id),field=fielded(k.id);return k.name+" "+(home+field)+" ("+field+" in the field)";}).join("\n");}
function paintArmyMap(){if(!world||!world.wars)return;const c=document.getElementById("mapc");if(!c||c.clientWidth<20)return;const g=c.getContext("2d");
  const dpr=Math.min(2,window.devicePixelRatio||1);g.setTransform(dpr,0,0,dpr,0,0);g.font="bold 11px system-ui";g.textAlign="center";
  seedPop();
  for(const w of world.wars){if(!w.over)ensureArmy(w);if(w.over||!w.army)continue;let f;try{f=frontOf(w);}catch(_){continue;}const p=mapToScreen(f.x,f.y);
    const t=KINGDOMS[w.a].name+" "+w.army.a+" vs "+KINGDOMS[w.b].name+" "+w.army.b;
    g.lineWidth=3;g.strokeStyle="#000";g.strokeText(t,p.x,p.y+18);g.fillStyle="#fff";g.fillText(t,p.x,p.y+18);}}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{brawlTick();}catch(e){console.warn("brawl",e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(BRAWL.on&&state==="play"&&hero&&!(P&&P.fly>=28)){ctx.save();
  const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:Math.max(0.42,1-P.fly/46)):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);ctx.imageSmoothingEnabled=false;brawlDraw();ctx.restore();brawlHud();}}catch(e){try{ctx.restore();}catch(_){}}return r;};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{popDaily();}catch(e){console.warn("pop",e);}return r;};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world)b=[{l:"Population",f:()=>showMenu("Population",popLines(),[{l:"Close"}])}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
{const _df=drawFullMap;drawFullMap=function(){const r=_df.apply(this,arguments);try{paintArmyMap();}catch(_){}return r;};}
window.__BRAWL84={get on(){return BRAWL.on},get men(){return BRAWL.men},get bolts(){return BRAWL.bolts},cap:BRAWL_CAP,tick:brawlTick,sprites:brawlSprites,seedPop,popOf,ensureArmy,armyMorale,fielded,popLines};
