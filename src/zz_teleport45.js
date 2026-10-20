// ===== v45 TELEPORT spell, wife-in-danger alerts, wife summons =====
NEWSP.teleport={n:"Teleport",ic:"🌌",mp:20,col:[120,200,255],unlock:{lv:1},desc:"Fold space: warp to a town you've visited, one of your homes, a castle, or straight to one of your wives."};
SPELLS.teleport={n:"Teleport",ic:"🌌",mp:20,col:[120,200,255]};SP_COL.teleport="#78c8ff";
const TPV=()=>{P.tpv=P.tpv||[];return P.tpv;};
function markVisited(){try{if(room)return;const S=settlementAt(hero.x,hero.y);if(S&&!TPV().includes(S.id))TPV().push(S.id);}catch(_){}}
const visitedTowns=()=>{const s=new Set(TPV());s.add(0);for(const n of npcs)if(n.met&&n.s!=null&&n.s>=0)s.add(n.s);for(const id of (P.homes||[])){const b=buildings[id];if(b&&b.s!=null)s.add(b.s);}return[...s].filter(i=>SETS[i]&&!(world.sets[i]&&world.sets[i].ruin)).sort((a,b)=>a-b);};
const doorPx=b=>({x:(b.x+Math.floor(b.w/2))*TILE+2,y:(b.y+b.h+1)*TILE+2});
function freeNear(px,py){const tx0=Math.floor(px/TILE),ty0=Math.floor(py/TILE);for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx0+dx,y=ty0+dy;if(!solidTile(x,y)&&!solidTile(x,y+0)){const t=T[y*WW+x];if(t!==DEEP&&t!==SHAL)return{x:x*TILE+2,y:y*TILE+2};}}return{x:px,y:py};}
const WARPFX=[];
function warpRing(x,y,inw){for(let i=0;i<26&&particles.length<320;i++){const a=i/26*6.283,v=inw?-1.6:1.6;particles.push({x:x+(inw?Math.cos(a)*30:0),y:y+(inw?Math.sin(a)*30:0),z:4,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:.5,life:22,max:22,col:[120,200,255],size:2,kind:"magic"});}WARPFX.push({x,y,t:0,inw});}
let TP_BUSY=false;
function tpBlocked(){if(room&&!room.b)return"The walls here resist your magic.";if(typeof DUEL!=="undefined"&&DUEL)return"Not mid-duel.";if(mobs.some(e=>!e.dead&&e.boss&&Math.hypot(e.x-hero.x,e.y-hero.y)<12*TILE))return"A boss's aura blocks the warp!";return null;}
function warpTo(px,py,label,after){const why=tpBlocked();if(why){toast("🌌 "+why);return false;}if(TP_BUSY)return false;TP_BUSY=true;closeMenu();
  warpRing(hero.x+6,hero.y+6,true);try{SFX.chime();}catch(_){}
  setTimeout(()=>{fadeQuick(()=>{room=null;const p=freeNear(px,py);hero.x=p.x;hero.y=p.y;hero.boat=false;P.boarded=false;P.riding=P.riding&&false;try{despawnPets&&despawnPets();}catch(_){}
    warpRing(hero.x+6,hero.y+6,false);markVisited();TP_BUSY=false;toast("🌌 Warped to "+label+".");if(after)try{after();}catch(e){console.warn(e);}});},260);return true;}
function wifeSpot(n){if(n.inside){const b=buildings[n.at!=null?n.at:n.home];if(b)return doorPx(b);}return{x:n.x+18,y:n.y+4};}
const townOf=n=>{const S=SETS[n.s];return S?S.name:"the wilds";};
function teleportMenu(){const why=tpBlocked();if(why){toast("🌌 "+why);return;}const B=[];
  for(const w of wives())B.push({l:`💞 ${w.name} (${townOf(w)})`,f:()=>{const p=wifeSpot(w);warpTo(p.x,p.y,w.name);}});
  for(const id of (P.homes||[])){const b=buildings[id];if(b){const p=doorPx(b);B.push({l:`🏠 Home in ${SETS[b.s]?SETS[b.s].name:"the wilds"}`,f:()=>warpTo(p.x,p.y,"your home")});}}
  for(const K of KINGDOMS){const S=SETS[K.cap];if(!S||(world.sets[S.id]&&world.sets[S.id].ruin))continue;const cb=buildings.find(b=>b.s===S.id&&(b.kind==="castle"||b.kind==="palace"));const p=cb?doorPx(cb):{x:S.x*TILE+2,y:(S.y+1)*TILE+2};B.push({l:`🏰 Castle of ${K.name} (${S.name})`,f:()=>warpTo(p.x,p.y,K.name+" castle")});}
  for(const i of visitedTowns()){const S=SETS[i];B.push({l:`🏘 ${S.name}`,f:()=>warpTo(S.x*TILE+2,(S.y+3)*TILE+2,S.name)});}
  B.push({l:"Cancel"});showMenu("🌌 Teleport — where to?","Choose a destination.",B);}
{const _cn=castNew;castNew=function(k){if(k==="teleport"){teleportMenu();return true;}return _cn.apply(this,arguments);};}
// ---- wives: danger alerts + summons ----
const WQ=[];// queued prompts {k:"danger"|"call",id,why}
const heroFighting=()=>{try{return inMonsterFight(hero.x+6,hero.y+6);}catch(_){return false;}};
function wifeThreat(n){const ws=world.sets[n.s];if(ws&&ws.raid)return"raid";try{const W=WEV();if(W.plague&&W.plague.sid===n.s)return"plague";}catch(_){}
  if(!n.inside)for(const e of mobs){if(e.dead||e.pet||!e.def||e.def.beh==="pea")continue;if(Math.hypot(e.x-n.x,e.y-n.y)<6*TILE)return"monster";}return null;}
function queueW(q){if(WQ.some(o=>o.k===q.k&&o.id===q.id))return;WQ.push(q);}
function dangerScan(){for(const n of wives()){const t=wifeThreat(n);if(!t){n.dangerK=null;continue;}const key=t+":"+world.day;if(n.dangerK===key)continue;
  if(Math.hypot(n.x-hero.x,n.y-hero.y)<8*TILE&&!room)continue;n.dangerK=key;queueW({k:"danger",id:n.id,why:t});}}
{const _nh=npcHurt;npcHurt=function(n,dmg,ang){const prot=n&&isWife(n)&&(n.protectUntil||0)>absMin();if(prot&&n.hp!=null&&n.hp-dmg<1)dmg=Math.max(0,n.hp-1);const r=_nh.call(this,n,dmg,ang);
  try{if(n&&isWife(n)&&n.alive&&Math.hypot(n.x-hero.x,n.y-hero.y)>8*TILE&&n.dangerK!=="hurt:"+world.day){n.dangerK="hurt:"+world.day;queueW({k:"danger",id:n.id,why:"attack"});}}catch(_){}return r;};}
const WHY={raid:"Raiders are attacking",plague:"Plague has struck",monster:"A monster is prowling near her",attack:"She's being attacked"};
function respond(n){n.protectUntil=absMin()+8*60;if(n.hp!=null)n.hp=Math.max(n.hp,1);}
function showDanger(q){const n=npcs.find(x=>x.id===q.id);if(!n||!n.alive||!isWife(n))return;const T=townOf(n);
  showMenu(`⚠ ${n.name} is in danger in ${T}!`,`${WHY[q.why]||"Trouble"} — she needs you.`,[{l:"🌌 Teleport to her",f:()=>{respond(n);const p=wifeSpot(n);warpTo(p.x,p.y,n.name,()=>say&&say(n,"You came! Behind me—there!",160));}},{l:"Not now"}]);}
const CALL_LINES=["I missed you. Stay a moment?","There you are... I just wanted to see your face.","Come here, you. *pulls you into a long hug*","I saved you a seat by the fire."];
function showCall(q){const n=npcs.find(x=>x.id===q.id);if(!n||!n.alive||!isWife(n))return;
  showMenu(`💞 ${n.name} is calling for you`,`"${q.why==="help"?"Could you come? I could use your help.":"I miss you. Come see me?"}"`,[{l:"🌌 Go",f:()=>{const p=wifeSpot(n);warpTo(p.x,p.y,n.name,()=>{n.aff=Math.min(100,(n.aff||0)+3);n.friend=Math.min(100,(n.friend||0)+2);try{say(n,CALL_LINES[(n.id+world.day)%CALL_LINES.length],200);}catch(_){}toast(`💞 ${n.name} smiles. ♥+3`);});}},{l:"Not now"}]);}
function wifeCalls(){if(!wives().length)return;if(absMin()<(P.callCd||0))return;if(Math.random()>0.06)return;const L=wives();const n=L[Math.floor(Math.random()*L.length)];
  if(Math.hypot(n.x-hero.x,n.y-hero.y)<10*TILE&&!room)return;P.callCd=absMin()+Math.round(1440*(1+Math.random()));queueW({k:"call",id:n.id,why:Math.random()<0.3?"help":"miss"});}
function menuOpen(){const m=document.getElementById("menu");return !!(m&&m.style.display!=="none"&&m.offsetParent!==null&&m.innerText.trim());}
{const _ht=hourlyTick;hourlyTick=function(){const r=_ht.apply(this,arguments);try{if(!AWAY_TICK)wifeCalls();}catch(_){}return r;};}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||!world||!P)return;if(frameN%30===0){markVisited();dangerScan();}
  if(WQ.length&&frameN%20===0&&!menuOpen()&&!paused&&!TP_BUSY){const i=WQ.findIndex(q=>q.k==="danger");if(i>=0){showDanger(WQ.splice(i,1)[0]);}else if(!heroFighting()){showCall(WQ.shift());}}
  for(const f of WARPFX)f.t++;for(let i=WARPFX.length-1;i>=0;i--)if(WARPFX[i].t>30)WARPFX.splice(i,1);}catch(e){}};}
{const _d=draw;draw=function(){_d.apply(this,arguments);if(!WARPFX.length||room)return;try{ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);ctx.globalCompositeOperation="lighter";
  for(const f of WARPFX){const k=f.t/30,r=f.inw?28*(1-k)+2:4+26*k;ctx.strokeStyle=`rgba(140,210,255,${1-k})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y+4,r,r*.45,0,0,6.283);ctx.stroke();
    ctx.fillStyle=`rgba(160,220,255,${.5*(1-k)})`;ctx.fillRect(f.x-3,f.y-40*(1-k)-6,6,40*(1-k)+10);}ctx.restore();}catch(_){try{ctx.restore();}catch(__){}}};}
// wife talk: "call me anytime" note + summon-me button
{const _sm=showMenu;showMenu=function(t,x,b){try{const n=typeof talkFocus!=="undefined"?talkFocus:null;if(n&&isWife(n)&&Array.isArray(b)&&typeof t==="string"&&t.includes(n.name)&&!b.some(o=>o&&o._call)){
  x=(x||"")+`\n\n💞 "Call me anytime — and I'll call you when I miss you." (She can summon you; cast 🌌 Teleport to reach her.)`;b=b.slice();b.splice(Math.max(0,b.length-1),0,{_call:1,l:"📣 Call me whenever you need me",f:()=>{n.wantsCalls=true;toast(`💞 ${n.name}: "I will. Come quickly when I do."`);}});}}catch(_){}return _sm.call(this,t,x,b);};}
