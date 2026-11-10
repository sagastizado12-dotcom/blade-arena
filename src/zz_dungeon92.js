// ===== DUNGEONS =====
// Themed floors, lairs, and a boss. Sealing a lair pays you or opens a door
// inside the dungeon. It does not change towns, houses, or people outside.
// Puzzles use the spells you already have: fire, thunder, and air.
const DUNS=[
  {id:"grove",name:"Greenmere Grove",theme:"grove",x:928,y:700,el:"fireball"},
  {id:"flood",name:"Sunken Cloister",theme:"flood",x:3200,y:1600,el:"thunder"},
  {id:"ice",name:"Palevein Cavern",theme:"ice",x:4912,y:700,el:"air"},
  {id:"ash",name:"Cinder Vault",theme:"ash",x:2588,y:3600,el:"air"},
  {id:"sky",name:"High Aerie",theme:"sky",x:5000,y:3600,el:"thunder"},
  {id:"manor",name:"Hollow Manor",theme:"manor",x:900,y:4800,el:"fireball"}
];
const DUN_PAL={
  grove:{wall:"#1c3a22",floor:"#3d5a32",floor2:"#314a28",water:"#2a6a58",accent:"#7dff9a"},
  flood:{wall:"#163044",floor:"#2a4458",floor2:"#203848",water:"#1a68a8",accent:"#8fd4ff"},
  ice:{wall:"#2a3a48",floor:"#8aa4b4",floor2:"#7894a6",water:"#3a78a8",accent:"#e8f6ff"},
  ash:{wall:"#3a221c",floor:"#5a382c",floor2:"#4a2c22",water:"#6a3018",accent:"#ffb060"},
  sky:{wall:"#243048",floor:"#c8d4e4",floor2:"#b4c4d8",water:"#6aa0d0",accent:"#fff6c8"},
  manor:{wall:"#241820",floor:"#4a382e",floor2:"#3c2c24",water:"#243848",accent:"#e8c0ff"}
};
function dunState(id){P.duns=P.duns||{};return P.duns[id]=P.duns[id]||{found:0,sealed:{},open:{},lit:{},boss:0,charm:0};}
function placeDungeons(){if(typeof objects==="undefined"||!objects)return;for(const d of DUNS){if(!objects.some(o=>o.type==="dungeon"&&o.id===d.id))objects.push({type:"dungeon",id:d.id,name:d.name,theme:d.theme,x:d.x,y:d.y,el:d.el});}}
if(typeof worldRestore==="function"){const _wrD=worldRestore;worldRestore=function(){const r=_wrD.apply(this,arguments);try{placeDungeons();}catch(e){}return r;};}
function dunFill(g,w,x,y,rw,rh,t){for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++)g[yy*w+xx]=t;}
function dunHall(g,w,x0,y0,x1,y1){const sx=Math.sign(x1-x0),sy=Math.sign(y1-y0);let x=x0,y=y0,n=0;g[y*w+x]=0;while((x!==x1||y!==y1)&&n++<80){if(x!==x1)x+=sx;else y+=sy;g[y*w+x]=0;}}
function makeDunFloor(theme,f){const w=32,h=20,g=new Uint8Array(w*h);g.fill(1);
  dunFill(g,w,2,12,28,6,0);dunFill(g,w,4,4,10,8,0);dunFill(g,w,18,4,10,8,0);dunHall(g,w,9,8,18,8);dunHall(g,w,16,10,16,12);
  const lairs=[],doors=[],chests=[];
  if(f===0){g[9*w+16]=8;g[6*w+6]=5;chests.push({f,x:6,y:6,id:theme+"-c0",loot:{gold:25,ore:1}});
    g[6*w+22]=7;lairs.push({id:theme+"-l0",f,x:22,y:6,n:3,kind:theme==="flood"?"slime":"bat",weak:theme==="ash"?"air":"fireball"});
    g[3*w+16]=4;doors.push({id:theme+"-d0",x:16,y:3,f,need:"lair"});g[2*w+16]=3;}
  else if(f===1){g[8*w+8]=11;g[6*w+6]=5;chests.push({f,x:6,y:6,id:theme+"-c1",loot:{gold:20,gem:1}});
    g[8*w+24]=10;doors.push({id:theme+"-d1",x:27,y:14,f,need:"switch"});g[14*w+27]=4;g[14*w+28]=3;
    g[6*w+20]=7;lairs.push({id:theme+"-l1",f,x:20,y:6,n:4,kind:"guard",weak:theme==="grove"||theme==="manor"?"fireball":theme==="ice"||theme==="ash"?"air":"thunder"});
    g[15*w+8]=6;}
  else{dunFill(g,w,6,4,20,12,0);g[16*w+16]=0;g[10*w+16]=13;g[6*w+22]=5;chests.push({f,x:22,y:6,id:theme+"-boss",loot:{gold:80,gem:2,crystal:1},boss:1});g[17*w+16]=3;}
  return {g,lairs,doors,chests,w,h};}
function buildDungeon(o){const st=dunState(o.id);const floors=[0,1,2].map(f=>makeDunFloor(o.theme,f));
  for(const fl of floors){for(const d of fl.doors)if(st.open[d.id])fl.g[d.y*fl.w+d.x]=0;
    for(const L of fl.lairs)if(st.sealed[L.id])fl.g[L.y*fl.w+L.x]=0;}
  return {dungeon:1,cave:0,b:{kind:"dungeon",id:-8,s:0,name:o.name},kind:"dungeon",o,w:32,h:20,F:[],sp:{},door:{x:16,y:17},level:0,
    floors,grid:floors.map(f=>f.g),chests:floors.reduce((a,f)=>a.concat(f.chests),[]),lairs:floors.reduce((a,f)=>a.concat(f.lairs),[]),
    foes:[],name:o.name,theme:o.theme};}
function enterDun(o){const st=dunState(o.id);st.found=1;fadeQuick(()=>{room=buildDungeon(o);room.out={x:hero.x,y:hero.y};hero.x=room.door.x*16+2;hero.y=room.door.y*16-6;hero.dir=3;hero.vx=hero.vy=0;hero.boat=false;try{saveGame();}catch(e){}});toast("You step into "+o.name+".");}
function leaveDun(to){const back=room.out;fadeQuick(()=>{room=null;hero.x=(to||back).x;hero.y=(to||back).y;hero.dir=0;hero.vx=hero.vy=0;});}
function dunCell(tx,ty){if(!room||!room.dungeon)return 1;if(tx<0||ty<0||tx>=room.w||ty>=room.h)return 1;return room.grid[room.level][ty*room.w+tx];}
function dunSet(tx,ty,t){if(tx<0||ty<0||tx>=room.w||ty>=room.h)return;room.grid[room.level][ty*room.w+tx]=t;room._cv=null;}
function dunSolid(tx,ty){const t=dunCell(tx,ty);return t===1||t===2||t===4||t===8||t===11;}
const _rsDun=roomSolid;
roomSolid=function(tx,ty){if(room&&room.dungeon)return dunSolid(tx,ty);return _rsDun(tx,ty);};
const _blDun=blocked;
blocked=function(x,y,w,h){if(room&&room.dungeon){const tx=Math.floor((x+w/2)/TILE),ty=Math.floor((y+h/2)/TILE);return dunSolid(tx,ty);}return _blDun(x,y,w,h);};
function dunAlive(id){let n=0;for(const f of room.foes)if(!f.dead&&f.lair===id)n++;return n;}
function dunSpawn(L){const weak=L.weak;room.foes.push({kind:L.kind,x:L.x*16+2,y:L.y*16+8,w:12,h:12,hp:L.kind==="guard"?5:3,max:L.kind==="guard"?5:3,floor:L.f,weak,lair:L.id,hit:0,dead:0,t:0});L.spawned=(L.spawned||0)+1;}
function dunSeal(L){const st=dunState(room.o.id);if(st.sealed[L.id])return;st.sealed[L.id]=1;dunSet(L.x,L.y,0);
  let opened=false;for(const fl of room.floors)for(const d of fl.doors)if(d.need==="lair"&&d.f===L.f){st.open[d.id]=1;if(d.f===room.level)dunSet(d.x,d.y,0);opened=true;}
  const g=12+((L.x*3+L.y)&7);P.gold+=g;gainExp(8,L.x*16,L.y*16);
  toast(opened?"The lair is sealed. A door grinds open deeper in. (+"+g+"g)":"The lair is sealed. (+"+g+"g)");
  try{saveGame();}catch(e){}}
function dunLairs(){const st=dunState(room.o.id);for(const L of room.lairs){if(L.f!==room.level||st.sealed[L.id])continue;
    L.spawned=L.spawned||0;if(L.spawned<L.n&&dunAlive(L.id)<1&&frameN%28===0)dunSpawn(L);
    if(L.spawned>=L.n&&dunAlive(L.id)===0)dunSeal(L);}}
function dunFoeStep(f){if(f.dead)return;f.t++;const dx=hero.x-f.x,dy=hero.y-f.y,dist=Math.hypot(dx,dy)||1;let spd=f.kind==="bat"?0.9:f.kind==="slime"?0.3:0.55;
  if(f.boss){const p=f.hp<f.max*0.3?2:f.hp<f.max*0.6?1:0;if(p!==f.phase){f.phase=p;toast(p===1?room.name+"'s guardian quickens.":"The guardian breaks into a rush.");}spd=0.45+p*0.28;}
  if(f.kind==="guard"&&Math.abs(dy)<10&&dist<90)spd=1.3;
  if(f.kind==="slime"&&(f.t%36)>10)spd=0;
  if(f.kind==="bat")f.y+=Math.sin(frameN*0.2+f.x)*0.35;
  if(dist<170){const nx=f.x+(dx/dist)*spd,ny=f.y+(dy/dist)*spd;const tx=(nx+6)/TILE|0,ty=(ny+6)/TILE|0;if(!dunSolid(tx,ty)){f.x=nx;f.y=ny;}}
  if(f.hit>0)f.hit--;
  if(f.hit<=0&&Math.abs(f.x+6-hero.x-6)<10&&Math.abs(f.y+6-hero.y-8)<10){f.hit=32;hurtHero(f.boss?2:1,Math.atan2(hero.y-f.y,hero.x-f.x));}}
function dunHurt(f,dmg,el){if(f.dead)return;if(el&&f.weak===el){dmg*=2;floatText(f.x,f.y-10,"Weak!","#fff0a0");}f.hp-=dmg;f.hit=10;floatText(f.x,f.y,"-"+dmg,"#fff");
  if(f.hp<=0){f.dead=1;const g=f.boss?0:2+((f.x|0)&3);if(g){P.gold+=g;floatText(f.x,f.y-8,"+"+g+"g","#ffe060");}gainExp(f.boss?30:4,f.x,f.y);
    if(f.boss){const st=dunState(room.o.id);if(!st.boss){st.boss=1;st.charm=1;P.charms=P.charms||{};P.charms[room.theme]=room.o.el;P.gold+=60;P.inv.gem=(P.inv.gem||0)+1;
      toast(room.name+" is still. Your "+SPELLS[room.o.el].n+" hits harder now.");try{saveGame();}catch(e){}}dunSet(22,6,5);}}}
function dunSpellHit(){if(!room||!room.dungeon)return;const st=dunState(room.o.id);
  for(const f of fx){if(f.life<=0||f.k==="ring")continue;const tx=f.x/TILE|0,ty=f.y/TILE|0,cell=dunCell(tx,ty);
    if(f.k==="fireball"&&cell===8){dunSet(tx,ty,0);f.life=0;toast("The vines burn away.");}
    else if(f.k==="fireball"&&cell===9&&!st.lit[tx+","+ty+":"+room.level]){st.lit[tx+","+ty+":"+room.level]=1;room._cv=null;f.life=0;toast("The torch catches.");}
    else if(f.k==="air"&&cell===11){const dir=hero.dir,dx=dir===1?-1:dir===2?1:0,dy=dir===0?1:dir===3?-1:0;const nx=tx+dx,ny=ty+dy;if(dx||dy){if(dunCell(nx,ny)===0){dunSet(tx,ty,0);dunSet(nx,ny,11);toast("The block slides.");}f.life=0;}}
    for(const e of room.foes){if(e.dead||e.floor!==room.level)continue;if(Math.abs(f.x-e.x-6)<12&&Math.abs(f.y-e.y-6)<12){dunHurt(e,f.dmg||1,f.k);if(f.k==="fireball")f.life=0;}}}
  if(typeof tbolts!=="undefined")for(const b of tbolts){if(b.done)continue;const tx=b.x/TILE|0,ty=b.y/TILE|0;
    if(dunCell(tx,ty)===10){const door=room.floors[room.level].doors.find(d=>d.need==="switch");if(door){st.open[door.id]=1;if(door.f===room.level)dunSet(door.x,door.y,0);}b.done=1;toast("Thunder hits the switch. A shortcut opens.");try{saveGame();}catch(e){}}
    for(const e of room.foes){if(!e.dead&&e.floor===room.level&&Math.abs(b.x-e.x-6)<14&&Math.abs(b.y-e.y-6)<14){dunHurt(e,b.dmg||2,"thunder");b.done=1;}}}}
const _umDun=updateMagic;
updateMagic=function(){const r=_umDun.apply(this,arguments);try{dunSpellHit();}catch(e){}return r;};
const _csDun=castSpell;
castSpell=function(k){const r=_csDun.apply(this,arguments);try{const el=k||curSpell;if(r&&P.charms){for(const th in P.charms){const want=DUNS.find(d=>d.theme===th);if(want&&want.el===el){const f=fx[fx.length-1];if(f&&f.dmg)f.dmg+=1;if(typeof tbolts!=="undefined"&&tbolts.length){const b=tbolts[tbolts.length-1];if(b&&b.dmg&&el==="thunder")b.dmg+=1;}}}}}catch(e){}return r;};
const _ruDun=roomUpdate;
roomUpdate=function(){if(room&&room.dungeon)return dunUpdate();return _ruDun();};
function dunUpdate(){if(hero.iframes>0)hero.iframes--;const {mx,my}=getMoveInput();const spd=1.05;
  if(mx||my){hero.vx=mx*spd;hero.vy=my*spd;moveEntity(hero,hero.vx,hero.vy);hero.anim++;if(hero.anim%6===0){hero.frame^=1;if(hero.frame)SFX.step(8);}hero.d8=dir8(mx,my,hero.d8);hero.dir=Math.abs(mx)>=Math.abs(my)?(mx<0?1:2):(my<0?3:0);}else hero.vx=hero.vy=0;
  const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0,cell=dunCell(tx,ty);
  if(!hero._dunHold){if(cell===3&&my<0&&room.level<2){hero._dunHold=14;const px=hero.x,py=hero.y;fadeQuick(()=>{room.level++;room._cv=null;hero.x=px;hero.y=py;if(dunSolid((hero.x/TILE)|0,(hero.y/TILE)|0)){hero.x=16*16;hero.y=14*16;}});}
    else if(cell===3&&my>0&&room.level>0){hero._dunHold=14;const px=hero.x;fadeQuick(()=>{room.level--;room._cv=null;hero.x=px;hero.y=8*16;});}
    else if(room.level===0&&ty>=room.door.y-1&&tx===room.door.x&&my>0)leaveDun();
    else if(cell===4)toast("The door is shut. Seal the lair, or strike the switch.");
    else if(cell===8)toast("Thick vines. Fire would burn them.");
    else if(cell===10)toast("A metal switch. Thunder would strike it.");
    else if(cell===11)toast("A loose block. A gust of air could push it.");}
  else hero._dunHold--;
  if(wantAttack()){hero.swinging=0;SFX.swing&&SFX.swing();const dmg=typeof swordDmg==="function"?swordDmg():2;
    for(const f of room.foes){if(f.dead||f.floor!==room.level)continue;const dx=f.x+6-hero.x-6,dy=f.y+6-hero.y-8;if(Math.hypot(dx,dy)>24)continue;dunHurt(f,dmg,null);}}
  if(frameN%20===0){const st=dunState(room.o.id);if(!st.boss&&room.level===2&&!room.foes.some(f=>f.boss&&!f.dead))room.foes.push({kind:"boss",boss:1,x:16*16,y:8*16,w:18,h:16,hp:20,max:20,floor:2,weak:room.o.el,lair:"",hit:0,dead:0,t:0,phase:0});}
  dunLairs();
  for(const f of room.foes)if(f.floor===room.level)dunFoeStep(f);
  room.foes=room.foes.filter(f=>!f.dead);}
function dunInteract(){const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0,cell=dunCell(tx,ty),st=dunState(room.o.id);
  if(cell===5){const c=room.chests.find(q=>q.f===room.level&&q.x===tx&&q.y===ty);if(!c)return false;if(c.boss&&!st.boss){toast("The chest is sealed until the guardian falls.");return true;}
    const id=c.id;world.opened=world.opened||{};if(world.opened[id])toast("Empty.");else{world.opened[id]=1;const bits=[];for(const k in c.loot){if(k==="gold")P.gold+=c.loot[k];else P.inv[k]=(P.inv[k]||0)+c.loot[k];bits.push(c.loot[k]+" "+(k==="gold"?"gold":(ITEMS[k]&&ITEMS[k].n)||k));}toast("Found "+bits.join(", "));try{saveGame();}catch(e){}}return true;}
  if(cell===6){hero.hp=hero.maxHp;if(P.mag)P.mag.mp=P.mag.max;updateHearts();toast("The shrine mends you. This place will remember you.");try{saveGame();}catch(e){}return true;}
  return false;}
const _actDun=interact;
interact=function(){if(room&&room.dungeon)return dunInteract();
  if(!(P&&P.fly>0)&&!hero.boat&&!room){const o=objects.find(q=>q.type==="dungeon"&&near(q.x*TILE+8,q.y*TILE+8,28));if(o){enterDun(o);return true;}}
  return _actDun();};
const _ihDun=interactHint;
interactHint=function(){const o=!room&&objects&&objects.find(q=>q.type==="dungeon"&&near(q.x*TILE+8,q.y*TILE+8,26));if(o)return "A: Enter";return _ihDun();};
function dunFloorCanvas(){if(room._cv&&room._cvLv===room.level)return room._cv;const pal=DUN_PAL[room.theme]||DUN_PAL.grove;const c=mkCanvas(room.w*16,room.h*16),g=c.getContext("2d");g.imageSmoothingEnabled=false;const grid=room.grid[room.level];const st=dunState(room.o.id);
  for(let y=0;y<room.h;y++)for(let x=0;x<room.w;x++){const t=grid[y*room.w+x],px=x*16,py=y*16;
    if(t===1){g.fillStyle=(x+y)&1?pal.wall:"#140e12";g.fillRect(px,py,16,16);g.fillStyle="rgba(255,255,255,.05)";g.fillRect(px,py+3,16,1);continue;}
    g.fillStyle=(x+y)&1?pal.floor:pal.floor2;g.fillRect(px,py,16,16);
    if(t===2){g.fillStyle=pal.water;g.fillRect(px,py,16,16);g.fillStyle="rgba(255,255,255,.35)";g.fillRect(px+2,py+4,6,1);}
    else if(t===3){g.fillStyle="#8a5a32";g.fillRect(px+3,py,2,16);g.fillRect(px+11,py,2,16);g.fillStyle="#e6c898";for(let i=0;i<5;i++)g.fillRect(px+3,py+2+i*3,10,1);}
    else if(t===4){g.fillStyle="#3a2418";g.fillRect(px+2,py+2,12,12);g.fillStyle="#c8a060";g.fillRect(px+6,py+6,4,3);}
    else if(t===5){g.fillStyle="#6a4424";g.fillRect(px+3,py+6,10,7);g.fillStyle="#e8c878";g.fillRect(px+3,py+6,10,3);}
    else if(t===6){g.fillStyle="#8a8478";g.fillRect(px+2,py+8,12,5);g.fillStyle="#ffb050";g.fillRect(px+7,py+3,2,5);}
    else if(t===7){g.fillStyle="#201028";g.beginPath();g.arc(px+8,py+8,6,0,7);g.fill();g.strokeStyle=pal.accent;g.stroke();}
    else if(t===8){g.fillStyle="#1f6a28";g.fillRect(px+6,py,3,16);g.fillStyle="#46b04a";g.fillRect(px+2,py+3,6,3);g.fillRect(px+8,py+8,6,3);}
    else if(t===9){g.fillStyle="#5a4632";g.fillRect(px+7,py+6,2,8);if(st.lit[x+","+y+":"+room.level]){g.fillStyle="#ffb040";g.fillRect(px+6,py+2,4,4);}}
    else if(t===10){g.fillStyle="#8a9098";g.fillRect(px+4,py+4,8,8);g.fillStyle="#d8dee8";g.fillRect(px+6,py+2,4,4);}
    else if(t===11){g.fillStyle="#6a5a48";g.fillRect(px+2,py+4,12,10);g.fillStyle="#8a7a64";g.fillRect(px+3,py+5,10,3);}
    else if(t===13){g.fillStyle="#000";g.beginPath();g.arc(px+8,py+8,5,0,7);g.fill();}}
  room._cv=c;room._cvLv=room.level;return c;}
const _drDun=drawRoom;
drawRoom=function(){if(!room||!room.dungeon)return _drDun();
  const Wp=room.w*16,Hp=room.h*16,ox=Math.round(Math.max(0,(W-Wp)/2)-(Wp>W?clamp(hero.x+6-W/2,0,Wp-W):0)),oy=Math.round(Math.max(0,(H-Hp)/2)-(Hp>H?clamp(hero.y+6-H/2,0,Hp-H):0));
  ctx.fillStyle="#07060c";ctx.fillRect(0,0,W,H);ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(ox,oy);ctx.drawImage(dunFloorCanvas(),0,0);
  const pulse=0.45+0.25*Math.sin(frameN*0.12);ctx.strokeStyle=DUN_PAL[room.theme].accent;ctx.globalAlpha=pulse;
  for(const L of room.lairs)if(L.f===room.level&&!dunState(room.o.id).sealed[L.id]){ctx.beginPath();ctx.arc(L.x*16+8,L.y*16+8,7+pulse*3,0,7);ctx.stroke();}
  ctx.globalAlpha=1;
  for(const f of room.foes)if(!f.dead&&f.floor===room.level){ctx.save();ctx.translate(f.x+6|0,f.y+10|0);
    if(f.boss){ctx.fillStyle="#3a2048";ctx.fillRect(-8,-16,16,14);ctx.fillStyle="#f0d060";ctx.fillRect(-6,-18,3,3);ctx.fillRect(3,-18,3,3);ctx.fillStyle="#200";ctx.fillRect(-8,-22,16,3);ctx.fillStyle="#e44";ctx.fillRect(-8,-22,16*(f.hp/f.max),3);}
    else if(f.kind==="bat"){ctx.fillStyle="#5a4638";ctx.fillRect(-6,-8,4,3);ctx.fillRect(2,-8,4,3);ctx.fillStyle="#2a2018";ctx.fillRect(-2,-7,4,4);}
    else if(f.kind==="slime"){ctx.fillStyle="#3aaa48";ctx.beginPath();ctx.ellipse(0,-6,6,4,0,0,7);ctx.fill();ctx.fillStyle="#102010";ctx.fillRect(-3,-7,2,2);ctx.fillRect(1,-7,2,2);}
    else{ctx.fillStyle="#6a4030";ctx.fillRect(-5,-10,10,9);ctx.fillStyle="#f0e0c8";ctx.fillRect(-3,-8,2,2);ctx.fillRect(1,-8,2,2);}
    ctx.restore();}
  const WS=walkState(hero,Math.hypot(hero.vx||0,hero.vy||0),true);footShadow(hero.x+6,hero.y+14,6);drawChibi(HERO_LOOK,hero.x+6,hero.y+14,hero.d8!=null?hero.d8:hero.dir,WS.fr);
  ctx.restore();
  ctx.font="bold 9px Georgia,serif";ctx.textAlign="center";ctx.fillStyle="#ffe08a";ctx.fillText(room.name+"  ·  floor "+(room.level+1)+"/3",W/2,14);};
function paintDuns(g,P2){if(!P||!P.duns)return;for(const o of objects)if(o.type==="dungeon"&&P.duns[o.id]&&P.duns[o.id].found){const [x,y]=P2(o.x,o.y);g.fillStyle="#ffb45a";g.fillRect(x-2,y-2,5,5);g.fillStyle="#3a1808";g.fillRect(x-1,y-1,3,3);}}
const _mapD=drawFullMap;drawFullMap=function(){const r=_mapD.apply(this,arguments);try{const c=document.getElementById("mapc");if(c){const g=c.getContext("2d"),s=MAP_MULT[MAPM.z];paintDuns(g,(x,y)=>[(x-MAPM.cx)*s,(y-MAPM.cy)*s]);}}catch(e){}return r;};
const _miniD=drawMini;drawMini=function(){const r=_miniD.apply(this,arguments);try{const R=MINI_R[miniZ],tx=hero.x/TILE,ty=hero.y/TILE,sx=mini.width/(R*2),sy=mini.height/(R*1.5);paintDuns(mg,(x,y)=>[(x-tx+R)*sx,(y-ty+R*0.75)*sy]);}catch(e){}return r;};
{const _dDoor=draw;draw=function(){const r=_dDoor.apply(this,arguments);try{if(room||!objects||state!=="play")return r;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);
  for(const o of objects)if(o.type==="dungeon"&&Math.abs(o.x*16-hero.x)<420&&Math.abs(o.y*16-hero.y)<300){const x=o.x*16,y=o.y*16;ctx.fillStyle="#2a241c";ctx.fillRect(x+2,y+4,12,12);ctx.fillStyle="#100c0a";ctx.beginPath();ctx.moveTo(x+4,y+14);ctx.lineTo(x+4,y+7);ctx.quadraticCurveTo(x+8,y+2,x+12,y+7);ctx.lineTo(x+12,y+14);ctx.fill();ctx.fillStyle="#c8a060";ctx.fillRect(x+3,y+13,10,2);}ctx.restore();}catch(e){}return r;};}
