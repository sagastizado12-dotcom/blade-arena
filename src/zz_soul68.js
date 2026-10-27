// ===== v68 LOOK: bright 3/4 pixel world, rigid camera already in the loop,
// safe-zone combat HUD, soft down-right shadows, a few drifting motes,
// and townsfolk kept out of the plaza.
function drawShadow(x,y,rx,ry){ctx.fillStyle="rgba(20,16,28,.32)";ctx.beginPath();ctx.ellipse((x||0)+3,(y||0)+2,rx||6,ry||2.4,0,0,7);ctx.fill();}
(function(){const s=document.createElement("style");s.textContent="#bars,#hearts{transition:opacity .12s linear}";document.head.appendChild(s);})();
function soulDanger(){if(!hero||typeof mobs==="undefined")return false;
  for(let i=0;i<mobs.length;i++){const e=mobs[i];if(!e||e.dead||e.pet)continue;
    const beh=e.def&&e.def.beh;if(!(beh==="agg"||e.provoked||e.raidOf!=null||e.sp==="dragon"||e.war49))continue;
    if(Math.abs(e.x-hero.x)>240||Math.abs(e.y-hero.y)>180)continue;
    if(Math.hypot(e.x-hero.x,e.y-hero.y)<220)return true;}
  return false;}
function soulHud(){const dim=!!hero&&!soulDanger();const bars=document.getElementById("bars");if(bars)bars.style.opacity=dim?"0":"1";
  const hearts=document.getElementById("hearts");if(hearts)hearts.style.opacity=dim?".2":"1";
  // Spell buttons stay on screen in town and in the wilds. The safe-town fade only covers the combat bars.
  const spells=document.querySelectorAll(".sp4");for(let i=0;i<spells.length;i++){spells[i].style.opacity="1";spells[i].style.pointerEvents="auto";}
}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{if(state==="play")soulHud();}catch(_){}return r;};}
const SOUL_MOTES=[];for(let i=0;i<12;i++)SOUL_MOTES.push({x:Math.random(),y:Math.random(),v:0.12+Math.random()*0.2,k:i%3,ph:Math.random()*6});
{const _d=draw;draw=function(){_d.apply(this,arguments);if(state!=="play"||!hero||room)return;try{ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.globalAlpha=.32;
  for(const m of SOUL_MOTES){m.x+=m.v*0.012;m.y+=Math.sin(frameN*0.02+m.ph)*0.0012;if(m.x>1)m.x-=1;if(m.y>1)m.y-=1;if(m.y<0)m.y+=1;
    ctx.fillStyle=m.k===0?"#fff4c0":m.k===1?"#d8f6ff":"#ffe0a8";ctx.fillRect((m.x*W)|0,(m.y*H)|0,m.k===2?2:1,1);}
  ctx.restore();}catch(e){try{ctx.restore();}catch(_){}}};}
{const _be=blendEdges;blendEdges=function(g,tx,ty,t,px,py){_be(g,tx,ty,t,px,py);
  if(t===DEEP||t===SHAL||t===WALL)return;const pal={3:"#3ed62a",4:"#1e8a22",7:"#e6c890",2:"#f4e0a4",12:"#ddd4c4",5:"#14681c",26:"#3ecf3a"};
  for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const n=tAt(tx+dx,ty+dy);if(n===t)continue;const c=pal[n];if(!c||!pal[t])continue;
    if(typeof GCLASS!=="undefined"&&GCLASS[n]&&GCLASS[n]===GCLASS[t])continue;
    g.globalAlpha=.4;g.fillStyle=c;g.beginPath();g.arc(px+(dx>0?16:0),py+(dy>0?16:0),3.2,0,6.3);g.fill();}
  g.globalAlpha=1;};}
// ----- plaza: why they bunched up, and where they go instead
// Day-off leisure and the old idle spot sit on a 7x3 box on the fountain.
// Kids, elders, and chapel routines use the same fountain. At midday the
// whole town shares the inn door on the square. The leader shove only
// pushed everyone else out to a ring 5 tiles from the fountain, which is
// still the plaza. Guards, raids, homes, and workplaces stay as they are.
// Two people may cross the square. Everyone else gets a door, a field, or a side street.
const SOUL_PLAZA=6.5;
function soulPlaza(s){const f=typeof fountainOf==="function"?fountainOf(s):null;return f?{x:f.x,y:f.y}:{x:s.x,y:s.y+1};}
function soulPlazaD(s,t){if(!t||t.x==null)return 99;const c=soulPlaza(s);return Math.hypot(t.x/TILE-c.x,t.y/TILE-c.y);}
function soulLane(n){const S=SETS[n.s];const a=(n.id%16)/16*6.2832;
  const rad=Math.min(Math.max(4,(S.r||12)-2),Math.max(9,(S.r||12)*0.72))+(n.id%4)*0.35;
  return {x:(S.x+Math.cos(a)*rad)*TILE,y:(S.y+Math.sin(a)*rad*0.8)*TILE};}
function soulDoor(b,n,ox,oy){const d=doorOf(b);return {x:d.x+ox,y:d.y+oy};}
// A post on the square is kept for one worker. Everyone else is sent past it.
function soulPick(n,S,sig){const h=typeof hour==="function"?hour():12;const off=typeof dayOff==="function"&&dayOff(n);const posts=[];
  const add=(p,key)=>{if(p&&p.x!=null)posts.push({p,key,d:soulPlazaD(S,p)});};
  try{if(n.work!=null&&buildings[n.work]&&h>=8&&h<18&&!off)add(soulDoor(buildings[n.work],n,((n.id%3)-1)*18,20),"w"+n.work);}catch(_){}
  if(n.role==="farmer"&&S.farm&&h>=7&&h<17&&!off)add({x:(S.farm.x+1+(n.id%3))*TILE,y:(S.farm.y+(n.id%2))*TILE},"farm");
  if(buildings[n.home])add(soulDoor(buildings[n.home],n,(n.id%2?1:-1)*(18+(n.id%3)*8),16),"h"+n.home);
  const claimed=key=>{let c=0;for(let i=0;i<npcs.length;i++){const o=npcs[i];if(o&&o!==n&&o.s===S.id&&o._psig===sig&&o._plot===key)c++;}return c;};
  for(let i=0;i<posts.length;i++)if(posts[i].d>=9)return posts[i].p;
  for(let i=0;i<posts.length;i++)if(claimed(posts[i].key)<1){n._plot=posts[i].key;return posts[i].p;}
  return soulLane(n);}
function soulPasser(n,S){const p=soulPlaza(S),k=n.id%2,a=k?0.4:-2.7;
  return {x:(p.x+Math.cos(a)*4.2)*TILE,y:(p.y+Math.sin(a)*3.1)*TILE};}
function soulAssign(n,S,t){const sig=S.id+":"+(world.day|0)+":"+(hour()|0);
  if(n._psig===sig&&n._pdest)return n._pdest;
  let pass=0,inn=0;const tile=(t.x/TILE|0)+","+(t.y/TILE|0);
  for(let i=0;i<npcs.length;i++){const o=npcs[i];if(!o||o===n||o.s!==S.id||o._psig!==sig)continue;if(o._pstay==="pass")pass++;if(o._pstay==="in"&&o._ptile===tile)inn++;}
  n._psig=sig;n._ptile=tile;n._plot="";
  let dest;
  if(t.inside&&inn<2){n._pstay="in";dest={x:t.x,y:t.y,inside:true,b:t.b};}
  else if(!t.inside&&pass<2){n._pstay="pass";dest=soulPasser(n,S);}
  else{n._pstay="out";dest=soulPick(n,S,sig);}
  n._pdest=dest;return dest;}
{const _nt=npcTarget;npcTarget=function(n){const t=_nt.apply(this,arguments);try{
  if(!n||!t||!world||n.huddle||(n.adv&&n.adv.state==="travel"))return t;
  if(n.role==="guard"&&(n.post==null||typeof onShift!=="function"||onShift(n)))return t;
  const S=SETS[n.s];if(!S)return t;const ws=world.sets[n.s];if(ws&&(ws.raid||ws.dragon))return t;
  if(n.role==="leader")return t;
  if(t.inside&&(t.b===n.home||t.b===n.work))return t;
  if(soulPlazaD(S,t)>SOUL_PLAZA)return t;
  return soulAssign(n,S,t)||t;}catch(_){return t;}};}
window.__SOUL68={danger:soulDanger,plaza:soulPlazaD};
