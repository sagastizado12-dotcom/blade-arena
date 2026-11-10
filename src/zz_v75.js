// ===== v75: cities so every realm has three, one-time ruin repair, memorials instead of tombstones,
// daytime quiet near towns, spell motion, and the pencil markers stay gone.
const CITIES75=[
  {id:30,name:"Briarford",kind:"town",x:800,y:3400,r:18,roof:["#6a9a48","#2a4a18"],wall:"#f2ead0",gem:"#cf8",king:2},
  {id:31,name:"Emberreach",kind:"town",x:4200,y:2500,r:18,roof:["#8a3038","#3a1018"],wall:"#6a5860",gem:"#f88",king:3,demon:1},
  {id:32,name:"Oakenshore",kind:"town",x:3800,y:700,r:18,roof:["#d0a050","#7a5820"],wall:"#f6e6c4",gem:"#fd8",king:4},
  {id:33,name:"Tidewatch",kind:"town",x:6000,y:3200,r:18,roof:["#3a90a8","#145060"],wall:"#f4f0e4",gem:"#9ef",king:5},
  {id:34,name:"Wheatmarch",kind:"town",x:3000,y:4000,r:18,roof:["#c8b050","#7a6820"],wall:"#f8f0d4",gem:"#fea",king:6},
  {id:35,name:"Bellhollow",kind:"town",x:5600,y:4300,r:18,roof:["#68a848","#2a5818"],wall:"#f2ead0",gem:"#cf8",king:6}
];
const CITY_LINKS=[[30,15],[30,23],[31,17],[31,18],[32,24],[32,25],[33,27],[33,26],[34,28],[35,29],[35,28]];
for(const s of CITIES75){s.deferLayout=1;s.v75=1;SETS.push(s);KOF[s.id]=s.king;}
LOBES.push(
  {x:800,y:3400,rx:200,ry:150,k:"v75briar"},
  {x:4200,y:2500,rx:220,ry:160,k:"v75ember"},
  {x:3800,y:700,rx:200,ry:150,k:"v75oak"},
  {x:6000,y:3200,rx:220,ry:160,k:"v75tide"},
  {x:3000,y:4000,rx:220,ry:160,k:"v75wheat"},
  {x:5600,y:4300,rx:200,ry:150,k:"v75bell"}
);
{const _ls=layoutSettlement;layoutSettlement=function(s){if(s&&s.v75&&s._laid)return;const r=_ls.apply(this,arguments);if(s&&s.v75&&s._layNow)s._laid=1;return r;};}
{const _gd=genDuneHomes;genDuneHomes=function(){const r=_gd.apply(this,arguments);
  for(const s of CITIES75){s._layNow=1;layoutSettlement(s);
    if(s.demon)for(let y=s.y-s.r;y<=s.y+s.r;y++)for(let x=s.x-s.r;x<=s.x+s.r;x++){if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const i=y*WW+x;if(T[i]===GRASS||T[i]===FLOWER)T[i]=MUD;}}
  return r;};}
{const _gw=genWorld;genWorld=async function(){const r=await _gw.apply(this,arguments);try{
  for(const [a,b] of CITY_LINKS)if(SETS[a]&&SETS[b]&&typeof stampRoad==="function")stampRoad(SETS[a],SETS[b]);
}catch(e){console.warn("v75 roads",e);}return r;};}
{const _ft=finalizeTerrain;finalizeTerrain=function(){const r=_ft.apply(this,arguments);try{
  LOOKOUTS.length=0;for(let i=objects.length-1;i>=0;i--)if(objects[i]&&objects[i].type==="lookout")objects.splice(i,1);
}catch(_){}return r;};}
{const _gc=genCabinProps;genCabinProps=function(){const r=_gc.apply(this,arguments);try{
  if(typeof PROPS!=="undefined")for(let i=PROPS.length-1;i>=0;i--)if(PROPS[i]&&PROPS[i].type==="tent2")PROPS.splice(i,1);
}catch(_){}return r;};}
function isCity75(s){return !!(s&&typeof s.kind==="string"&&s.kind.indexOf("town")>=0);}
function cityReport(){const by={};for(const k of KINGDOMS)by[k.id]={name:k.name,cities:[],all:[]};
  for(const s of SETS){const k=kOf(s.id);if(!by[k])continue;by[k].all.push(s.name);if(isCity75(s))by[k].cities.push(s.name);}
  const nn={};for(const s of SETS){let best=1e9,who="";for(const o of SETS){if(o===s)continue;const d=Math.hypot(o.x-s.x,o.y-s.y);if(d<best){best=d;who=o.name;}}nn[s.name]={d:Math.round(best),who};}
  const rows=Object.keys(by).map(id=>({id:+id,name:by[id].name,n:by[id].cities.length,cities:by[id].cities,settlements:by[id].all}));
  return {rows,nn,sets:SETS.length,lookouts:LOOKOUTS.length,pencils:objects.filter(o=>o.type==="lookout").length,cones:(typeof PROPS!=="undefined"?PROPS.filter(p=>p.type==="tent2").length:0)};}
function restoreRealm75(){if(!world||world.intact75)return {skipped:1};
  const ruins=[];let bld=0,walls=0,back=0;
  if(world.sets)for(const s of world.sets){if(!s)continue;if(s.ruin||s.dpct>0)ruins.push(s.id);s.ruin=null;s.warn50=0;s.dpct=0;}
  if(world.bld)for(const b of world.bld){if(b&&((b.dmg||0)>0||(b.burn||0)>0)){bld++;b.dmg=0;b.burn=0;}}
  if(world.walls)for(const k in world.walls){if(world.walls[k]<10){walls++;world.walls[k]=10;}}
  world.cdmg={};world.pdmg={};
  if(typeof GATES!=="undefined")for(const g of GATES){g.hp=12;g.broken=0;}
  if(typeof npcs!=="undefined")for(const n of npcs){if(!n||!n.refugee)continue;const from=n.refugee.from;if(SETS[from]){n.s=from;if(n.refugee.home!=null&&buildings[n.refugee.home])n.home=n.refugee.home;n.work=n.refugee.work||null;n.inside=false;
    try{const home=buildings[n.home]||buildings[(SETS[from].bIdx||[])[0]];const d=home&&doorOf(home);if(d){n.x=d.x;n.y=d.y;}}catch(_){}}
    n.refugee=null;back++;}
  try{if(typeof applyWalls==="function")applyWalls();}catch(_){}
  world._bak75={ruins,bld,walls,returned:back};world.intact75=1;return world._bak75;}
function sweepTombs75(){if(!world)return 0;const L=world.lives||(world.lives={graves:[],base:{},tmem:{},summons:[],elderLog:[],memory:[],cultY:0,obits:[]});
  L.obits=L.obits||[];let n=0;if(!L.tombs75){for(const g of L.graves||[]){n++;if(!L.obits.some(o=>o&&o.id===g.id&&o.day===g.day))L.obits.push(g);
    if(g.fam){L.memory=L.memory||[];if(!L.memory.some(m=>m&&m.id===g.id))L.memory.push({id:g.id,name:g.name,sx:g.sx,age:g.age,rel:g.fam,day:g.day,s:g.s});}}
    L.tombs75=1;}
  L.graves=[];return n;}
function memorialsMenu(){const L=world&&world.lives;const rows=((L&&L.obits)||[]).slice(-30).reverse();
  const lines=rows.length?rows.map(g=>`${g.name} (${g.sx||"?"}), age ${g.age} — ${SETS[g.s]?SETS[g.s].name:"the wilds"}`).join("\n"):"The town books are quiet. No deaths are recorded.";
  const btns=rows.slice(0,6).map(g=>({l:"Remember "+g.name,f:()=>{try{jAdd(`I remembered ${g.name}${SETS[g.s]?" of "+SETS[g.s].name:""}.`,"family");}catch(_){}toast("You remember "+g.name+".");closeMenu();}}));
  btns.push({l:"Close"});showMenu("Town memorials",lines,btns);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&!b.some(o=>o&&o._mem)){b=b.slice();b.splice(1,0,{_mem:1,l:"Town memorials",f:memorialsMenu});}}catch(_){}return _sm.call(this,t,x,b);};}
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{if(world){world.intact75=1;sweepTombs75();}}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r){restoreRealm75();sweepTombs75();}}catch(e){console.warn(e);}return r;};}
function drawMotion75(){if(!hero||room||state!=="play"||(P&&P.fly>=28))return;let drawn=0;
  ctx.save();const z=(P&&P.fly>0&&P.fly<28)?Math.max(0.42,1-P.fly/46):1;ctx.setTransform(RS*z,0,0,RS*z,-camX*RS*z,-camY*RS*z);ctx.imageSmoothingEnabled=false;ctx.lineWidth=1;
  const see=(x,y)=>Math.abs(x-hero.x)<W+60&&Math.abs(y-hero.y)<H+60;
  if(typeof SP41!=="undefined")for(const p of SP41){if(drawn>20||!see(p.x,p.y))continue;drawn++;
    if(p.k==="frost"){const tipx=p.x+Math.cos(p.a||0)*(p.len||0),tipy=p.y+Math.sin(p.a||0)*(p.len||0)-4;ctx.fillStyle="#e7fbff";
      for(let i=0;i<3;i++){const u=((frameN+i*3)%8)/8;ctx.fillRect(p.x+Math.cos(p.a||0)*u*(p.len||8)-1,p.y+Math.sin(p.a||0)*u*(p.len||8)-6,2,2);}ctx.strokeStyle="#bff6ff";ctx.strokeRect(tipx-3,tipy-3,6,6);}
    else if(p.k==="quake"&&p.pts){ctx.fillStyle="#5a4030";for(let i=0;i<p.pts.length;i+=3){const q=p.pts[i];ctx.fillRect(q[0]-1,q[1]+(i%2),2,2);}}
    else if(p.k==="blackhole"){const spin=(p.t||frameN)*0.18;ctx.strokeStyle=p.phase==="fly"?"#d0b0ff":"#7a30b0";ctx.beginPath();ctx.arc(p.x,p.y-6,p.phase==="fly"?7:14,spin,spin+2.4);ctx.stroke();}
    else if(p.k==="meteor"){ctx.fillStyle="#ffe0a0";ctx.fillRect(p.x-6,p.y-14,3,3);ctx.fillStyle="#ff7020";ctx.fillRect(p.x-2,p.y-10,4,4);}
    else if(p.k==="blade"){ctx.save();ctx.translate(p.x,p.y-6);ctx.rotate(p.a||0);ctx.fillStyle="#ffe8ff";ctx.fillRect(2,-1,10,2);ctx.restore();}}
  if(typeof tbolts!=="undefined")for(const b of tbolts){if(drawn>20||!see(b.x,b.y))continue;drawn++;ctx.strokeStyle="#f4f0ff";ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.sin((b.seed||0)+frameN*0.2)*12,b.y-16);ctx.stroke();}
  if(typeof COMBO_FX!=="undefined")for(const f of COMBO_FX){if(!see(f.x,f.y))continue;const k=f.c&&f.c.k,p=(f.t||0)/50;ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=Math.max(0,1-p);
    if(k==="firestorm"){ctx.rotate(p*8);ctx.strokeStyle="#ff7a2a";ctx.beginPath();ctx.arc(0,0,8+p*16,0,1.4);ctx.stroke();}
    else if(k==="shatter"){ctx.strokeStyle="#c8f4ff";for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*1.6)*12,Math.sin(i*1.6)*12);ctx.stroke();}}
    else if(k==="steam"){ctx.strokeStyle="#e4f2f2";ctx.strokeRect(-6,-6-p*12,12,8);}
    else if(k==="cataclysm"){ctx.strokeStyle="#d08848";ctx.beginPath();ctx.arc(0,0,10+p*16,.4,2.2);ctx.stroke();}
    else if(k==="tempest"){ctx.strokeStyle="#ffe680";ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(0,6);ctx.lineTo(7,-3);ctx.stroke();}
    else if(k==="blessed"){ctx.strokeStyle="#fff4b0";ctx.strokeRect(-5,-5,10,10);}
    else if(k==="singular"){ctx.strokeStyle="#c090ff";ctx.beginPath();ctx.arc(0,0,Math.max(4,16-p*12),p*5,p*5+2.2);ctx.stroke();}
    else if(k==="permafrost"){ctx.strokeStyle="#8ad4ff";ctx.strokeRect(-8,-3,16,6);}
    ctx.restore();}
  ctx.restore();}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{drawMotion75();}catch(_){}return r;};}
window.__V75={cities:CITIES75.map(s=>s.name),report:cityReport,restore:restoreRealm75,tombs:sweepTombs75,isCity:isCity75,
  spawn:()=>spawnTick(),slide:(dx,dy)=>slideMove(hero,dx,dy),land:()=>landHero(),fly:()=>flyTick(),blocked:()=>blockedE(hero),pass:(n)=>passAway(n,true),memorials:memorialsMenu,
  tile:(x,y)=>tAt(x,y),solid:(x,y)=>solidTile(x,y),WH,TREE,FOREST,DEEP,SHAL};
