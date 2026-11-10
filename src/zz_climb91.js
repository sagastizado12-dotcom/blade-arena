// ===== CLIMBABLE RANGES + CAVES =====
// Mountains are baked into the world pack. Cliff faces block walking; stairs
// are the vines, ladders, ropes, handholds, and switchbacks. Flight still
// crosses them. Caves are built when you step inside, not at boot.
// Loose boulders are not placed. Rock tiles that seal a cave, a ruin, or the
// dungeon stay, because removing them would open those walls.
ITEMS.crystal={n:"Cave Crystal",p:18};
ITEMS.ore={n:"Copper Ore",p:8};
elevAt=function(x,y){if(x<0||y<0||x>=WW||y>=WH)return 0;const t=T[y*WW+x];
  if(t===CLIFF)return 1;if(t===STAIRS)return 1;if(t===MTN){let n=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=tAt(x+dx,y+dy);if(q===MTN||q===STAIRS)n++;}
    return n>=8?3:2;}return ELEV[y*WW+x]|0;};
let _caveAt=null,_peakAt=null;
function caveMarks(){if(_caveAt)return;_caveAt=new Map();_peakAt=new Set();
  if(typeof objects==="undefined")return;
  for(const o of objects){if(o.type==="cave")_caveAt.set(o.x+","+o.y,o);if(o.type==="peak")_peakAt.add(o.x+","+o.y);}}
function paintClimbTile(g,tx,ty,t,X,Y){caveMarks();
  if(t===MTN){const set=TILESET&&TILESET[GRASS];if(set&&set.length){const v=Math.floor(hash2(tx,ty,5)*set.length);g.drawImage(set[v%set.length],X,Y,16,16);}
    const e=elevAt(tx,ty);if(e>=3){g.fillStyle="rgba(214,226,255,.2)";g.fillRect(X,Y,16,16);}
    if(tAt(tx,ty+1)===CLIFF){g.fillStyle="#5a4636";g.fillRect(X,Y+13,16,3);g.fillStyle="#d2c0a4";g.fillRect(X,Y+13,16,1);}
    if(_peakAt&&_peakAt.has(tx+","+ty)){g.fillStyle="#6a4a28";g.fillRect(X+7,Y+4,2,10);g.fillStyle="#e23a3a";g.fillRect(X+9,Y+4,5,3);g.fillStyle="#ffd060";g.fillRect(X+9,Y+7,5,2);}}
  if(t===CLIFF){g.fillStyle="#6a5e52";g.fillRect(X,Y,16,16);g.fillStyle="#4a4038";
    for(let i=0;i<4;i++)g.fillRect(X,Y+2+i*4,16,2);g.fillStyle="#8a7c70";g.fillRect(X+1,Y+3,5,1);g.fillRect(X+9,Y+7,4,1);g.fillStyle="#2c261f";g.fillRect(X,Y+14,16,2);
    if(tAt(tx,ty-1)===MTN||tAt(tx,ty-1)===STAIRS){g.fillStyle="#3c8a34";g.fillRect(X,Y,16,3);g.fillStyle="#1a4016";g.fillRect(X,Y+3,16,1);}}
  if(t===STAIRS){let face=false;for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(tAt(tx+dx,ty+dy)===CLIFF)face=true;
    if(!face){g.fillStyle="#c4a06a";g.fillRect(X,Y+6,16,5);g.fillStyle="#8a6840";g.fillRect(X,Y+10,16,1);g.fillStyle="#e6d2a4";g.fillRect(X+2,Y+7,3,1);g.fillRect(X+9,Y+8,4,1);return;}
    const k=Math.abs(tx*5+3)%4;g.fillStyle="#3a3438";g.fillRect(X,Y,16,16);
    if(k===0){g.fillStyle="#2f6a28";g.fillRect(X+7,Y,2,16);g.fillStyle="#4aaa3a";for(let i=0;i<5;i++)g.fillRect(X+4+(i%2)*4,Y+1+i*3,3,2);}
    else if(k===1){g.fillStyle="#8a5a32";g.fillRect(X+3,Y,2,16);g.fillRect(X+11,Y,2,16);g.fillStyle="#e2c090";for(let i=0;i<5;i++)g.fillRect(X+3,Y+2+i*3,10,1);}
    else if(k===2){g.fillStyle="#d8c4a0";g.fillRect(X+7,Y,2,16);for(let i=0;i<4;i++)g.fillRect(X+6,Y+2+i*4,4,1);}
    else{g.fillStyle="#6a6040";g.fillRect(X,Y,16,16);g.fillStyle="#d8d0c0";g.fillRect(X+3,Y+3,3,2);g.fillRect(X+10,Y+6,3,2);g.fillRect(X+5,Y+11,3,2);g.fillRect(X+11,Y+13,2,2);}}
  const mouth=_caveAt&&_caveAt.get(tx+","+(ty+1));
  if(mouth&&t===CLIFF){g.fillStyle="#120c14";g.beginPath();g.moveTo(X+3,Y+15);g.lineTo(X+3,Y+6);g.quadraticCurveTo(X+8,Y+1,X+13,Y+6);g.lineTo(X+13,Y+15);g.fill();
    g.fillStyle="#3a2a22";g.fillRect(X+2,Y+12,12,3);g.fillStyle="#1a120e";g.fillRect(X+5,Y+8,6,5);}
  if(_caveAt&&_caveAt.has(tx+","+ty)){g.fillStyle="#2a2018";g.fillRect(X+2,Y+12,12,4);g.fillStyle="#100c10";g.fillRect(X+4,Y+10,8,4);}}
const _blockedClimb=blockedE;
blockedE=function(e){if(e===hero&&!(P&&P.fly>0)&&!hero.boat&&!room){const x0=Math.floor(e.x/TILE),y0=Math.floor(e.y/TILE),x1=Math.floor((e.x+e.w-0.01)/TILE),y1=Math.floor((e.y+e.h-0.01)/TILE);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(tAt(tx,ty)===CLIFF)return true;}return _blockedClimb(e);};
function tryCliffHop(dx,dy){const ax=Math.abs(dx),ay=Math.abs(dy);if(ax<0.05&&ay<0.05)return false;let sx=0,sy=0;if(ax>=ay)sx=Math.sign(dx);else sy=Math.sign(dy);
  const tx=Math.floor((hero.x+6)/TILE),ty=Math.floor((hero.y+8)/TILE);const here=tAt(tx,ty);if(here!==MTN&&here!==STAIRS)return false;let x=tx+sx,y=ty+sy;if(tAt(x,y)!==CLIFF)return false;let steps=0;
  while(steps<7&&tAt(x,y)===CLIFF){x+=sx;y+=sy;steps++;}
  const land=tAt(x,y);if(steps<1||land===CLIFF||land===WALL||land===CAVE||isWater(land)||solidTile(x,y))return false;
  hero.x=x*TILE+2;hero.y=y*TILE+2;hero.jumpT=14;hero.vx=0;hero.vy=0;return true;}
const _slideClimb=slideMove;
slideMove=function(e,dx,dy){if(e===hero&&!room&&!(P&&P.fly>0)&&!hero.boat&&tryCliffHop(dx,dy))return;return _slideClimb(e,dx,dy);};
const _uhClimb=updateHero;
updateHero=function(){hero.climb=false;hero._climbFace=3;
  if(!room&&!(P&&P.fly>0)&&!hero.boat&&!hero.dead){const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0;
    if(tAt(tx,ty)===STAIRS){for(const [dx,dy,d] of [[0,-1,3],[0,1,0],[-1,0,1],[1,0,2]])if(tAt(tx+dx,ty+dy)===CLIFF){hero.climb=true;hero._climbFace=d;break;}}}
  return _uhClimb();};
const _dhClimb=drawHeroFull;
drawHeroFull=function(){if(hero.climb&&!(P&&P.fly>0)&&!room&&!hero.boat){const prev=hero.dir,prev8=hero.d8;hero.dir=hero._climbFace|0;hero.d8=hero.dir;
    const step=(frameN>>3)&1,moving=Math.hypot(hero.vx||0,hero.vy||0)>0.05;ctx.save();if(moving)ctx.translate(step?1:-1,step?-1:0);_dhClimb();ctx.restore();hero.dir=prev;hero.d8=prev8;return;}return _dhClimb();};
const _ihClimb=interactHint;
interactHint=function(){const h=_ihClimb();const o=typeof objects!=="undefined"&&objects.find(q=>q.type==="cave"&&near(q.x*TILE+8,q.y*TILE+8,26));if(o)return "A: Cave";if(hero.climb)return "Climbing";return h;};
const _actClimb=interact;
interact=function(){if(!(P&&P.fly>0)&&!hero.boat&&!room){const o=objects.find(q=>q.type==="cave"&&near(q.x*TILE+8,q.y*TILE+8,28));if(o){enterCave(o);return true;}}return _actClimb();};
function caveSeed(id){let h=2166136261;const s=String(id);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function caveHash(a,b,c){let n=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function buildCave(o){const seed=caveSeed(o.id),floors=o.boss?3:o.small?2:2,w=40,h=26,levels=[];
  for(let f=0;f<floors;f++){const g=new Uint8Array(w*h);g.fill(1);const rooms=[];
    const nR=4+(seed+f)%2;for(let i=0;i<nR;i++){const rw=5+((caveHash(i,f,seed)*4)|0),rh=4+((caveHash(i,f,seed+3)*3)|0);
      const rx=2+((caveHash(i,f,seed+5)*(w-rw-4))|0),ry=2+((caveHash(i,f,seed+7)*(h-rh-4))|0);rooms.push({x:rx,y:ry,w:rw,h:rh});
      for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)g[y*w+x]=0;}
    for(let i=0;i<rooms.length-1;i++){const a=rooms[i],b=rooms[i+1];let x=a.x+(a.w>>1),y=a.y+(a.h>>1);const x1=b.x+(b.w>>1),y1=b.y+(b.h>>1);const wide=caveHash(i,f,seed+9)>0.62?2:1;
      const sx=Math.sign(x1-x);while(x!==x1){for(let k=0;k<wide;k++)if(y+k<h-1)g[(y+k)*w+x]=0;x+=sx;}
      const sy=Math.sign(y1-y);while(y!==y1){for(let k=0;k<wide;k++)if(x+k<w-1)g[y*w+x+k]=0;y+=sy;}g[y1*w+x1]=0;}
    const pool=rooms[Math.min(2,rooms.length-1)];
    for(let y=pool.y+1;y<pool.y+pool.h-1;y++)for(let x=pool.x+1;x<pool.x+Math.min(4,pool.w-1);x++)g[y*w+x]=2;
    const lad=rooms[rooms.length-1];g[(lad.y+1)*w+(lad.x+1)]=f===floors-1?0:(f%2?4:3);
    if(f>0){const up=rooms[0];g[(up.y+1)*w+(up.x+1)]=f%2?4:3;}
    const shrine=rooms[1]||rooms[0];g[(shrine.y+shrine.h-2)*w+(shrine.x+shrine.w-2)]=11;
    for(let i=0;i<10;i++){const rm=rooms[i%rooms.length];const x=rm.x+1+((caveHash(i,f,seed+11)*(rm.w-2))|0),y=rm.y+1+((caveHash(i,f,seed+13)*(rm.h-2))|0);
      if(g[y*w+x]===0)g[y*w+x]=caveHash(i,f,seed+17)>0.45?6:5;}
    if(o.secret&&f===floors-1){const s=rooms[0];g[(s.y+(s.h>>1))*w+(s.x+s.w-2)]=8;}
    levels.push({g,rooms});}
  const door={x:w>>1,y:h-2};for(let y=h-3;y>=2;y--)levels[0].g[y*w+door.x]=0;levels[0].g[door.y*w+door.x]=0;levels[0].g[(door.y-1)*w+door.x]=0;
  const chests=[];for(let f=0;f<floors;f++){const rm=levels[f].rooms[f%levels[f].rooms.length];const x=rm.x+2,y=rm.y+2;if(levels[f].g[y*w+x]===1)levels[f].g[y*w+x]=0;levels[f].g[y*w+x]=7;
    chests.push({f,x,y,id:o.id+"-c"+f,loot:f===floors-1?{gold:35,crystal:1,gem:1}:{gold:12+f*8,ore:1+f}});}
  const foes=[];const kinds=["bat","slime","mole"];
  for(let f=0;f<floors;f++){const rm=levels[f].rooms;const n=o.boss&&f===floors-1?3:3+f;
    for(let i=0;i<n;i++){const r=rm[i%rm.length];const x=(r.x+1+((caveHash(i,f,seed+21)*(r.w-2))|0))*16+2,y=(r.y+1+((caveHash(i,f,seed+23)*(r.h-2))|0))*16+2;
      foes.push({kind:kinds[(i+f)%3],x,y,w:12,h:12,hp:kinds[(i+f)%3]==="mole"?4:3,max:kinds[(i+f)%3]==="mole"?4:3,floor:f,hit:0,dead:0});}}
  if(o.boss){const top=floors-1,r=levels[top].rooms[levels[top].rooms.length-1];
    foes.push({kind:"warden",boss:1,x:(r.x+(r.w>>1))*16,y:(r.y+(r.h>>1))*16,w:18,h:16,hp:18,max:18,floor:top,hit:0,dead:world.opened&&world.opened[o.id+"-boss"]?1:0,phase:0});}
  return {cave:1,b:{kind:"cave",id:-9,s:0,name:o.name},kind:"cave",w,h,F:[],sp:{},door,o,level:0,grid:levels.map(L=>L.g),chests,foes,name:o.name};}
function enterCave(o){P.caves=P.caves||[];if(!P.caves.includes(o.id)){P.caves.push(o.id);toast("Found "+o.name+".");}
  fadeQuick(()=>{room=buildCave(o);room.out={x:hero.x,y:hero.y};hero.x=room.door.x*16+2;hero.y=room.door.y*16-4;hero.dir=3;hero.vx=hero.vy=0;hero.boat=false;try{saveGame();}catch(e){}});}
function leaveCave(to){const back=room.out,spot=to||back;fadeQuick(()=>{room=null;hero.x=spot.x;hero.y=spot.y;hero.dir=0;hero.vx=hero.vy=0;try{saveGame();}catch(e){}});}
function caveCell(tx,ty){if(!room||!room.cave)return 1;if(tx<0||ty<0||tx>=room.w||ty>=room.h)return 1;return room.grid[room.level][ty*room.w+tx];}
const _roomSolidC=roomSolid;
roomSolid=function(tx,ty){if(room&&room.cave){const t=caveCell(tx,ty);return t===1||t===2;}return _roomSolidC(tx,ty);};
function caveShift(floor){if(floor<0||floor>=room.grid.length||floor===room.level)return;const px=hero.x,py=hero.y;
  fadeQuick(()=>{room.level=floor;room._cv=null;hero.x=px;hero.y=py;if(roomSolid((hero.x/TILE)|0,(hero.y/TILE)|0)){hero.x=room.door.x*16;hero.y=(room.door.y-2)*16;}});}
const _roomUpC=roomUpdate;
roomUpdate=function(){if(!room||!room.cave)return _roomUpC();caveUpdate();};
function caveUpdate(){if(hero.iframes>0)hero.iframes--;const {mx,my}=getMoveInput();const spd=1.05;
  if(hero.knockT>0){hero.knockT--;}else if(mx||my){hero.vx=mx*spd;hero.vy=my*spd;moveEntity(hero,hero.vx,hero.vy);hero.anim++;if(hero.anim%6===0){hero.frame^=1;if(hero.frame)SFX.step(10);}hero.d8=dir8(mx,my,hero.d8);hero.dir=Math.abs(mx)>=Math.abs(my)?(mx<0?1:2):(my<0?3:0);}else hero.vx=hero.vy=0;
  const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0,cell=caveCell(tx,ty);
  if(!hero._caveHold){if((cell===3||cell===4)&&my<0&&room.level<room.grid.length-1){hero._caveHold=12;caveShift(room.level+1);return;}
    if((cell===3||cell===4)&&my>0&&room.level>0){hero._caveHold=12;caveShift(room.level-1);return;}
    if(cell===8&&room.o.secret){hero._caveHold=20;toast("A crack of daylight. You squeeze out onto the heights.");leaveCave({x:room.o.secret.x*TILE+2,y:room.o.secret.y*TILE+2});return;}
    if(tx===room.door.x&&ty>=room.door.y-1&&my>0&&room.level===0){leaveCave();return;}}
  else hero._caveHold--;
  if(wantAttack()){if(cell===7||cell===11)caveUse(cell,tx,ty);else caveSwing();}
  for(const f of room.foes){if(f.dead||f.floor!==room.level)continue;caveFoe(f);if(f.hit>0)f.hit--;
    if(f.hit<=0&&Math.abs(f.x+f.w/2-hero.x-6)<f.w*0.6+6&&Math.abs(f.y+f.h/2-hero.y-8)<f.h*0.6+6){f.hit=36;hurtHero(f.boss?2:1,Math.atan2(hero.y-f.y,hero.x-f.x));}}
  room.foes=room.foes.filter(f=>!(f.dead&&f.fade>20));}
function caveUse(cell,tx,ty){if(cell===7){const c=room.chests.find(q=>q.f===room.level&&q.x===tx&&q.y===ty);if(!c)return;
    if(world.opened[c.id])toast("Empty.");else{world.opened[c.id]=1;const bits=[];for(const k in c.loot){if(k==="gold")P.gold+=c.loot[k];else P.inv[k]=(P.inv[k]||0)+c.loot[k];bits.push(c.loot[k]+" "+(k==="gold"?"gold":ITEMS[k].n));}toast("Found "+bits.join(", "));try{saveGame();}catch(e){}}}
  if(cell===11){hero.hp=hero.maxHp;if(P.mag)P.mag.mp=P.mag.max;updateHearts();toast("A quiet shrine. You are rested, and the road remembers you.");try{saveGame();}catch(e){}}}
function caveSwing(){hero.swinging=0;hero.swingT=0;SFX.swing&&SFX.swing();const dmg=typeof swordDmg==="function"?swordDmg():2;const dir=hero.dir;
  for(const f of room.foes){if(f.dead||f.floor!==room.level)continue;const dx=f.x+f.w/2-hero.x-6,dy=f.y+f.h/2-hero.y-8;if(Math.hypot(dx,dy)>26)continue;
    const ok=dir===1?dx<4:dir===2?dx>-4:dir===3?dy<6:dy>-6;if(!ok)continue;f.hp-=dmg;f.hit=8;floatText(f.x,f.y,"-"+dmg,"#fff");
    if(f.hp<=0){f.dead=1;f.fade=0;const g=2+((f.x^f.y)&3);P.gold+=g;gainExp(f.boss?36:5,f.x,f.y);floatText(f.x,f.y-8,"+"+g+"g","#ffe060");
      if(f.boss&&!(world.opened&&world.opened[room.o.id+"-boss"])){world.opened[room.o.id+"-boss"]=1;P.inv.crystal=(P.inv.crystal||0)+2;P.inv.gem=(P.inv.gem||0)+1;P.gold+=40;toast(room.o.name+" is quiet. The warden left a crystal cache.");try{saveGame();}catch(e){}}
      else if(caveHash(f.x,f.y,3)>0.72){P.inv.ore=(P.inv.ore||0)+1;floatText(f.x,f.y-16,"+Ore","#e8a060");}}}
}
function caveFoe(f){const dx=hero.x-f.x,dy=hero.y-f.y,dist=Math.hypot(dx,dy)||1;let spd=f.kind==="bat"?0.85:f.kind==="slime"?0.35:0.55;
  if(f.boss){const p=f.hp<f.max*0.3?2:f.hp<f.max*0.6?1:0;if(p!==f.phase){f.phase=p;toast(p===1?"The warden digs in faster.":"The warden rears up.");}spd=0.4+p*0.35;}
  if(f.kind==="slime"&&((frameN+f.x|0)%48)>8)spd=0;if(dist<150||f.boss){const nx=f.x+(dx/dist)*spd,ny=f.y+(dy/dist)*spd+(f.kind==="bat"?Math.sin(frameN*0.15+f.x)*0.3:0);
    const tx=(nx+f.w/2)/TILE|0,ty=(ny+f.h/2)/TILE|0;if(!roomSolid(tx,ty)){f.x=nx;f.y=ny;}}if(f.dead)f.fade=(f.fade||0)+1;}
const TORCH=(()=>{const c=mkCanvas(220,220),g=c.getContext("2d");const gr=g.createRadialGradient(110,110,16,110,110,108);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(.55,"rgba(0,0,0,.55)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.beginPath();g.arc(110,110,108,0,7);g.fill();return c;})();
const TORCH_SM=(()=>{const c=mkCanvas(96,96),g=c.getContext("2d");const gr=g.createRadialGradient(48,48,6,48,48,46);gr.addColorStop(0,"rgba(0,0,0,.9)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.beginPath();g.arc(48,48,46,0,7);g.fill();return c;})();
let caveDark=null;
function caveFloorCanvas(){if(room._cv&&room._cvLv===room.level)return room._cv;const c=mkCanvas(room.w*16,room.h*16),g=c.getContext("2d");g.imageSmoothingEnabled=false;const grid=room.grid[room.level];
  for(let y=0;y<room.h;y++)for(let x=0;x<room.w;x++){const t=grid[y*room.w+x],px=x*16,py=y*16;
    if(t===1){g.fillStyle=(x+y)&1?"#2c2830":"#241f28";g.fillRect(px,py,16,16);g.fillStyle="#3a343c";g.fillRect(px,py+4,16,1);g.fillRect(px,py+11,16,1);if(((x*3+y)&7)===0){g.fillStyle="#141218";g.fillRect(px+4,py+6,2,5);}continue;}
    g.fillStyle=(x+y)&1?"#4a4036":"#3e362e";g.fillRect(px,py,16,16);g.fillStyle="rgba(20,14,10,.35)";g.fillRect(px,py+14,16,2);
    if(t===2){g.fillStyle="#163e6a";g.fillRect(px,py,16,16);g.fillStyle="#2a78b0";g.fillRect(px+1,py+2,14,2);g.fillStyle="rgba(200,230,255,.45)";g.fillRect(px+3,py+6,4,1);}
    else if(t===3){g.fillStyle="#8a5a32";g.fillRect(px+3,py,2,16);g.fillRect(px+11,py,2,16);g.fillStyle="#e6c898";for(let i=0;i<5;i++)g.fillRect(px+3,py+2+i*3,10,1);}
    else if(t===4){g.fillStyle="#d8c4a0";g.fillRect(px+7,py,2,16);for(let i=0;i<4;i++)g.fillRect(px+5,py+2+i*4,6,2);}
    else if(t===5){g.fillStyle="#efe6d4";g.fillRect(px+7,py+8,2,6);g.fillStyle="#d24a6a";g.fillRect(px+4,py+4,8,5);g.fillStyle="#f2d0dc";g.fillRect(px+5,py+5,2,2);}
    else if(t===6){g.fillStyle="#1a2838";g.fillRect(px+4,py+10,8,4);g.fillStyle="#7ec8ff";g.fillRect(px+6,py+3,4,8);g.fillStyle="#d8f4ff";g.fillRect(px+7,py+4,2,3);g.fillStyle="#3a78c8";g.fillRect(px+4,py+6,2,4);}
    else if(t===7){g.fillStyle="#6a4424";g.fillRect(px+3,py+6,10,7);g.fillStyle="#c89858";g.fillRect(px+3,py+6,10,3);g.fillStyle="#e8d080";g.fillRect(px+6,py+8,3,2);}
    else if(t===8){g.fillStyle="#d8e6b0";g.fillRect(px+5,py+2,6,12);g.fillStyle="#f4f8e4";g.fillRect(px+7,py+4,2,8);}
    else if(t===11){g.fillStyle="#8a847c";g.fillRect(px+2,py+8,12,5);g.fillStyle="#ffb050";g.fillRect(px+7,py+4,2,4);g.fillStyle="#fff0c0";g.fillRect(px+7,py+3,2,2);}}
  room._cv=c;room._cvLv=room.level;return c;}
const _drawRoomC=drawRoom;
drawRoom=function(){if(!room||!room.cave)return _drawRoomC();
  const Wp=room.w*16,Hp=room.h*16,ox=Math.round(Math.max(0,(W-Wp)/2)-(Wp>W?clamp(hero.x+6-W/2,0,Wp-W):0)),oy=Math.round(Math.max(0,(H-Hp)/2)-(Hp>H?clamp(hero.y+6-H/2,0,Hp-H):0));
  ctx.fillStyle="#07060c";ctx.fillRect(0,0,W,H);ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(ox,oy);ctx.drawImage(caveFloorCanvas(),0,0);
  for(const f of room.foes)if(!f.dead&&f.floor===room.level)drawCaveFoe(f);
  const WS=walkState(hero,Math.hypot(hero.vx||0,hero.vy||0),true);footShadow(hero.x+6,hero.y+14,6);drawChibi(HERO_LOOK,hero.x+6,hero.y+14,hero.d8!=null?hero.d8:hero.dir,WS.fr);
  ctx.restore();
  if(!caveDark||caveDark.width!==Math.ceil(W)||caveDark.height!==Math.ceil(H))caveDark=mkCanvas(Math.ceil(W),Math.ceil(H));
  const g=caveDark.getContext("2d");g.globalCompositeOperation="source-over";g.clearRect(0,0,caveDark.width,caveDark.height);g.fillStyle="rgba(2,2,8,.93)";g.fillRect(0,0,caveDark.width,caveDark.height);
  g.globalCompositeOperation="destination-out";g.drawImage(TORCH,ox+hero.x+6-110,oy+hero.y+8-110);
  if(!room._lights||room._lightLv!==room.level){room._lights=[];const grid=room.grid[room.level];for(let i=0;i<grid.length;i++)if(grid[i]===5||grid[i]===6||grid[i]===11)room._lights.push({x:(i%room.w)*16+8,y:(i/room.w|0)*16+8,big:grid[i]===6||grid[i]===11});room._lightLv=room.level;}
  for(const L of room._lights)g.drawImage(L.big?TORCH:TORCH_SM,ox+L.x-(L.big?110:48),oy+L.y-(L.big?110:48),L.big?220:96,L.big?220:96);
  g.globalCompositeOperation="source-over";ctx.drawImage(caveDark,0,0);
  ctx.font="bold 9px Georgia,serif";ctx.textAlign="center";ctx.fillStyle="#ffe08a";ctx.fillText(room.name+"  ·  depth "+(room.level+1)+"/"+room.grid.length,W/2,14);
  const cell=caveCell((hero.x+6)/TILE|0,(hero.y+8)/TILE|0);let hint=null;if(cell===7)hint="A: Chest";else if(cell===11)hint="A: Rest";else if(cell===3||cell===4)hint=room.level<room.grid.length-1?"Up: climb":"Down: climb";else if(cell===8)hint="Step into the light";
  if(hint){ctx.font="bold 8px system-ui";ctx.fillStyle="#ffe8a0";ctx.fillText(hint,ox+hero.x+6,oy+hero.y-12);}};
function drawCaveFoe(f){const bob=f.kind==="bat"?Math.sin(frameN*0.2+f.x)*2:f.kind==="slime"?Math.abs(Math.sin(frameN*0.12+f.y))*2:0;ctx.save();ctx.translate(f.x+f.w/2|0,f.y+f.h-bob|0);
  if(f.kind==="bat"){ctx.fillStyle="#5a4638";ctx.fillRect(-6,-6,4,3);ctx.fillRect(2,-6,4,3);ctx.fillStyle="#3a2e28";ctx.fillRect(-2,-5,4,4);ctx.fillStyle="#f0e0c8";ctx.fillRect(-1,-4,1,1);ctx.fillRect(1,-4,1,1);}
  else if(f.kind==="slime"){ctx.fillStyle="#3aaa48";ctx.beginPath();ctx.ellipse(0,-5,6,4,0,0,7);ctx.fill();ctx.fillStyle="#b8f0a0";ctx.fillRect(-2,-7,2,2);ctx.fillStyle="#102010";ctx.fillRect(-3,-6,2,2);ctx.fillRect(1,-6,2,2);}
  else if(f.kind==="mole"){ctx.fillStyle="#6a4a32";ctx.fillRect(-5,-8,10,7);ctx.fillStyle="#e8b0a8";ctx.fillRect(-1,-4,2,2);ctx.fillStyle="#201810";ctx.fillRect(-4,-6,2,2);ctx.fillRect(2,-6,2,2);ctx.fillStyle="#c8b090";ctx.fillRect(-6,-3,2,2);ctx.fillRect(4,-3,2,2);}
  else{ctx.fillStyle="#4a382c";ctx.fillRect(-8,-14,16,12);ctx.fillStyle="#e8b0a0";ctx.fillRect(-2,-8,4,3);ctx.fillStyle="#f0d060";ctx.fillRect(-7,-16,3,3);ctx.fillRect(4,-16,3,3);ctx.fillStyle="#201810";ctx.fillRect(-5,-11,2,2);ctx.fillRect(3,-11,2,2);
    ctx.fillStyle="#300";ctx.fillRect(-8,-20,16,3);ctx.fillStyle="#e44";ctx.fillRect(-8,-20,16*(f.hp/f.max),3);}
  ctx.restore();}
const _actCave=interact;
interact=function(){if(room&&room.cave){const tx=(hero.x+6)/TILE|0,ty=(hero.y+8)/TILE|0,cell=caveCell(tx,ty);
    if(cell===7){const c=room.chests.find(q=>q.f===room.level&&q.x===tx&&q.y===ty);if(c){if(world.opened[c.id])toast("Empty.");else{world.opened[c.id]=1;const bits=[];for(const k in c.loot){if(k==="gold")P.gold+=c.loot[k];else P.inv[k]=(P.inv[k]||0)+c.loot[k];bits.push(c.loot[k]+" "+(k==="gold"?"gold":ITEMS[k].n));}toast("Found "+bits.join(", "));try{saveGame();}catch(e){}}}return true;}
    if(cell===11){hero.hp=hero.maxHp;if(P.mag)P.mag.mp=P.mag.max;updateHearts();toast("A quiet shrine. You are rested, and the road remembers you.");try{saveGame();}catch(e){}return true;}
    return false;}return _actCave();};
function paintFoundCaves(g,P2){if(!P||!P.caves||!P.caves.length)return;for(const o of objects)if(o.type==="cave"&&P.caves.includes(o.id)){const [x,y]=P2(o.x,o.y);g.fillStyle="#e6c0ff";g.fillRect(x-2,y-2,5,5);g.fillStyle="#2a1038";g.fillRect(x-1,y-1,3,3);}}
const _mapC=drawFullMap;
drawFullMap=function(){const r=_mapC.apply(this,arguments);try{const c=document.getElementById("mapc");if(c&&typeof MAPM!=="undefined"){const g=c.getContext("2d"),s=MAP_MULT[MAPM.z];paintFoundCaves(g,(x,y)=>[(x-MAPM.cx)*s,(y-MAPM.cy)*s]);}}catch(e){}return r;};
const _miniC=drawMini;
drawMini=function(){const r=_miniC.apply(this,arguments);try{if(typeof mini==="undefined"||!mg)return r;const R=MINI_R[miniZ],tx=hero.x/TILE,ty=hero.y/TILE,sx=mini.width/(R*2),sy=mini.height/(R*1.5);paintFoundCaves(mg,(x,y)=>[(x-tx+R)*sx,(y-ty+R*0.75)*sy]);}catch(e){}return r;};
{const leg=typeof document!=="undefined"&&document.getElementById("maplegend");if(leg&&!leg.dataset.cave){leg.dataset.cave="1";leg.insertAdjacentHTML("beforeend",'<div><span style="color:#e6c0ff">■</span> Cave, once you have found the mouth</div>');}}
