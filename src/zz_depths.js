// ===== v28 DUNGEONS: "The Shifting Depths" — entrances in caves/ruins, rooms, traps, treasure, boss; layout reshuffles every in-game week =====
const DEP={x:964,y:754,w:54,h:40};
const DEP_ENTR=()=>[{x:RUINS.x,y:RUINS.y+9,name:"Old Ruins"},...POIS.map(q=>({x:q.x+3,y:q.y+6,name:q.name}))];
let depLayout=null;const depWeek=()=>Math.floor(world.day/7);
function depGen(week){const D=DEP;const R=(a,b,c)=>hash2(week*13+a,b,c);
  for(let y=Math.max(1,D.y-14);y<=Math.min(WH-2,D.y+D.h);y++)for(let x=Math.max(1,D.x-16);x<=Math.min(WW-2,D.x+D.w);x++){const i=y*WW+x;T[i]=y<D.y-1||x<D.x-1?ROCK:WALL;OCC[i]=0;}
  // 3x2 grid of rooms with random sizes, connected in a snake; start room and boss room at ends (order reshuffled weekly)
  const cells=[];for(let gy=0;gy<2;gy++)for(let gx=0;gx<3;gx++)cells.push([gx,gy]);const order=[0,1,2,5,4,3];if(R(1,1,801)<0.5)order.reverse();
  const rooms=order.map((ci,j)=>{const [gx,gy]=cells[ci];const cw=18,ch=20;const w=8+Math.floor(R(j,2,802)*7),h=7+Math.floor(R(j,3,803)*8);const x=D.x+gx*cw+1+Math.floor(R(j,4,804)*(cw-w-2)),y=D.y+gy*ch+1+Math.floor(R(j,5,805)*(ch-h-2));return{x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)};});
  for(const r of rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)T[y*WW+x]=RUIN;
  for(let j=0;j<rooms.length-1;j++){let {cx:x,cy:y}=rooms[j];const b=rooms[j+1];const dig=(x,y)=>{for(let k=0;k<2;k++)T[y*WW+x+k]=RUIN;T[(y+1)*WW+x]=RUIN;};while(x!==b.cx){dig(x,y);x+=Math.sign(b.cx-x);}while(y!==b.cy){dig(x,y);y+=Math.sign(b.cy-y);}}
  const traps=[];rooms.forEach((r,j)=>{if(j===0||j===rooms.length-1)return;const n=3+Math.floor(R(j,6,806)*4);for(let k=0;k<n;k++){const x=r.x+1+Math.floor(R(j,7+k,807)*(r.w-2)),y=r.y+1+Math.floor(R(j,20+k,808)*(r.h-2));traps.push({x,y,t:0});}});
  for(let i=objects.length-1;i>=0;i--)if(objects[i].dep)objects.splice(i,1);
  const loots=[{gold:120,gem:1},{gold:80,potion:2},{gold:150,core:1},{gold:60,gem:2},{gold:200}];
  rooms.forEach((r,j)=>{if(j===0)return;if(j===rooms.length-1||R(j,30,809)<0.6){const x=r.x+r.w-2,y=r.y+1;objects.push({type:"chest",id:`dep${week}_${j}`,x,y,dep:true,loot:j===rooms.length-1?{gold:400,gem:3,dscale:1}:loots[(j+week)%loots.length]});OCC[y*WW+x]=-1;}});
  const s=rooms[0];T[(s.y+1)*WW+s.x+1]=STAIRS;
  for(let y=Math.max(1,D.y-14);y<=Math.min(WH-2,D.y+D.h);y++)for(let x=Math.max(1,D.x-16);x<=Math.min(WW-2,D.x+D.w);x+=8)invalidateTile(x,y);for(let y=D.y-1;y<=D.y+D.h;y+=16)invalidateTile(D.x+D.w,y);
  depLayout={week,rooms,traps,exit:{x:s.x+1,y:s.y+1},boss:rooms[rooms.length-1],spawned:false};return depLayout;}
function inDepths(){return hero&&hero.x>=DEP.x*TILE&&hero.x<(DEP.x+DEP.w)*TILE&&hero.y>=DEP.y*TILE&&hero.y<(DEP.y+DEP.h)*TILE;}
function depEnter(from){const wk=depWeek();if(!depLayout||depLayout.week!==wk)depGen(wk);P.depFrom=from?{x:from.x,y:from.y}:{x:hero.x/TILE|0,y:hero.y/TILE|0};
  for(let i=mobs.length-1;i>=0;i--)if(mobs[i].depMob)mobs.splice(i,1);const L=depLayout;const st=L.rooms[0];
  fadeBlack("The Shifting Depths",()=>{hero.boat=false;hero.x=(st.cx)*TILE;hero.y=(st.cy+1)*TILE;camFX=null;const cleared=(P.depCleared||{})[wk];
    const pool=["skeleton","mummy","heximp","evileye","orc","goblin"];L.rooms.forEach((r,j)=>{if(j===0||j===L.rooms.length-1)return;const n=2+((j+wk)%3);for(let k=0;k<n;k++){const m=spawnMob(pool[(j*3+k+wk)%pool.length],(r.x+2+k*2)*TILE,(r.y+2+(k%2)*2)*TILE,{persist:true});if(m)m.depMob=true;}});
    if(!cleared){const bs=["demonlord","cyclops","kingslime","archfiend"][wk%4];const b=spawnMob(bs,L.boss.cx*TILE,L.boss.cy*TILE,{persist:true});if(b){b.depMob=true;b.depBoss=true;b.hp=b.maxHp=Math.round(b.maxHp*1.3);}}
    toast(cleared?"The Depths are quiet — you already beat this week's guardian. New layout next week!":`Week ${wk+1}: the Depths have shifted. Find the guardian in the deepest room!`);});}
function depExit(){const f=P.depFrom||{x:RUINS.x,y:RUINS.y+10};for(let i=mobs.length-1;i>=0;i--)if(mobs[i].depMob)mobs.splice(i,1);fadeBlack("",()=>{hero.x=f.x*TILE;hero.y=(f.y+2)*TILE;camFX=null;});}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e&&e.depBoss){const wk=depWeek();P.depCleared=P.depCleared||{};P.depCleared[wk]=1;P.fame=(P.fame||0)+10;P.gold+=150;const m=`I defeated the guardian of the Shifting Depths (week ${wk+1})! +150g, +10 fame.`;toast("🏆 "+m);try{jAdd(m,"deed");}catch(_){}}}catch(_){}return r;};}
// traps, entrance prompts, exit stairs
let depPrompt=0;
{const _u=update;update=function(){_u.apply(this,arguments);try{if(!hero||state!=="play"||room||paused||!world)return;const tx=Math.floor((hero.x+6)/TILE),ty=Math.floor((hero.y+8)/TILE);
  if(inDepths()&&depLayout){if(depLayout.week!==depWeek()){toast("The walls groan and shift around you…");depEnter(P.depFrom);return;}
    for(const t of depLayout.traps){if(t.t>0)t.t--;if(t.x===tx&&t.y===ty&&t.t<=0){t.t=90;t.seen=true;hurtHero(1,0);toast("Spikes!");}}
    if(tx===depLayout.exit.x&&ty===depLayout.exit.y&&frameN>depPrompt){depPrompt=frameN+180;showMenu("⬆ Exit","Climb back to the surface?",[{l:"Climb up",f:()=>{closeMenu();depExit();}},{l:"Stay",f:closeMenu}]);}return;}
  if(frameN>depPrompt)for(const e of DEP_ENTR())if(Math.abs(tx-e.x)<=1&&Math.abs(ty-e.y)<=1){depPrompt=frameN+240;showMenu("🕳 "+e.name+" — a stairway down",`Cold air rises from below. The Shifting Depths change every week.${(P.depCleared||{})[depWeek()]?"\n(This week's guardian is already beaten.)":""}`,[{l:"Descend",f:()=>{closeMenu();depEnter(e);}},{l:"Not now",f:closeMenu}]);break;}}catch(e){console.warn(e);}};}
// visuals: entrance stairs on the overworld, trap spikes (subtle until triggered)
{const _d=draw;draw=function(){_d.apply(this,arguments);try{if(!world||state!=="play"||room)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);
  for(const e of DEP_ENTR()){const x=e.x*TILE,y=e.y*TILE;if(x<camX-40||x>camX+W+40||y<camY-40||y>camY+H+40)continue;ctx.fillStyle="#1a1018";ctx.fillRect(x,y,16,16);ctx.fillStyle="#6a5a4a";for(let k=0;k<4;k++)ctx.fillRect(x+2,y+2+k*3,12-k*2,2);ctx.strokeStyle="#c8a050";ctx.strokeRect(x+.5,y+.5,15,15);}
  if(depLayout&&inDepths())for(const t of depLayout.traps){const x=t.x*TILE,y=t.y*TILE;ctx.fillStyle=t.seen||t.t>0?"rgba(200,200,210,.9)":"rgba(90,80,90,.35)";for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(x+3+k*4,y+13);ctx.lineTo(x+5+k*4,y+5);ctx.lineTo(x+7+k*4,y+13);ctx.fill();}}
  ctx.restore();}catch(_){}};}
// map: mark entrances
{const _df=drawFullMap;drawFullMap=function(){const r=_df.apply(this,arguments);try{const txt=window.__mapTxt,c=document.getElementById("mapc");if(!txt||!c||MAPM.z<1)return r;const s=mapScaleCss(),cw=c.clientWidth,ch=c.clientHeight,x0=MAPM.cx-cw/2/s,y0=MAPM.cy-ch/2/s;
  for(const e of DEP_ENTR())txt("🕳",(e.x-x0)*s,(e.y-y0)*s+4,"#c9f",12);}catch(_){}return r;};}
