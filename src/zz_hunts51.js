// ===== v51 Phase 5: legendary hunts + bestiary milestones =====
const HLEG=[
 {k:"ironhide",n:"Ironhide the Unbroken",sp:"manebeast",s:0,dx:40,dy:-30,hp:60,dmg:3,lv:3,lore:"A mane beast whose hide turned arrows on the Aldmoor road for forty years.",rew:{gold:400,item:"gem",n:3},title:"Hide-breaker"},
 {k:"whisper",n:"The Whispering Wolf",sp:"wolfman",s:4,dx:-36,dy:24,hp:70,dmg:3,lv:5,lore:"Woodcutters hear it before they see it; few see it twice.",rew:{gold:500,item:"pelt",n:6},title:"Silencer"},
 {k:"emberjaw",n:"Emberjaw",sp:"firespirit",s:8,dx:30,dy:34,hp:90,dmg:4,lv:7,lore:"A fire spirit the size of a pony, born in a forge fire.",rew:{gold:650,item:"gem",n:4},title:"Ember-quencher"},
 {k:"gloomqueen",n:"Gloom Queen Vesh",sp:"wisp",s:12,dx:-30,dy:-36,hp:110,dmg:4,lv:9,lore:"The wisps of the marsh move as one when she sings.",rew:{gold:800,item:"gem",n:5},title:"Gloombane"},
 {k:"thunderhorn",n:"Thunderwing",sp:"gargoyle",s:19,dx:36,dy:-28,hp:140,dmg:5,lv:11,lore:"Every storm on the eastern plains is said to be its breath.",rew:{gold:1000,item:"gem",n:6},title:"Stormrider"},
 {k:"oldgrove",n:"The Old Grove",sp:"treant",s:22,dx:-34,dy:30,hp:200,dmg:6,lv:14,lore:"A giant older than the kingdoms. The forest bows where it walks.",rew:{gold:1500,item:"gem",n:8},title:"Grovewarden"}];
const HUNT=()=>{world.hunts=world.hunts||{track:null,slain:{},tries:{}};return world.hunts;};
const lairOf=L=>{const S=SETS[L.s]||SETS[0];return{x:S.x+L.dx,y:S.y+L.dy};};
const legAlive=()=>mobs.find(m=>m.legendK&&!m.dead);
function huntsMenu(){const H=HUNT();const B=[];
  for(const L of HLEG){const done=H.slain[L.k],tr=H.track===L.k;B.push(done?{l:`✅ ${L.n} — slain (day ${done})`,dis:true}:{l:`${tr?"🎯 Tracking":"🐾 Track"} ${L.n} (lv ${L.lv}) near ${SETS[L.s].name}`,f:()=>{H.track=tr?null:L.k;toast(tr?"Hunt dropped.":`🐾 Tracking ${L.n}: its lair is marked on your map.`);huntsMenu();}});}
  B.push({l:"📖 Bestiary",f:bestiaryMenu},{l:"Close"});
  showMenu("🐾 Legendary hunts",HLEG.map(L=>`${H.slain[L.k]?"✅":"▫"} ${L.n} — ${L.lore}`).join("\n")+`\n\nSlain ${Object.keys(H.slain).length}/${HLEG.length}`+(P.huntTitle?` · Title: ${P.huntTitle}`:""),B);}
function spawnLegend(L){const p=lairOf(L);const e=spawnMob(L.sp,p.x*TILE,p.y*TILE,{persist:true});if(!e)return null;e.legendK=L.k;e.persist=true;e.legend=true;e.hp=e.maxHp=L.hp;e.dmg=L.dmg;e.name=L.n;e.aggroR=200;toast(`👑 ${L.n} emerges from its lair!`);return e;}
function huntTick(){const H=HUNT();if(!H.track||H.slain[H.track])return;const L=HLEG.find(l=>l.k===H.track);const p=lairOf(L);
  const d=Math.hypot(hero.x/TILE-p.x,hero.y/TILE-p.y);if(d<30&&!mobs.some(m=>m.legendK===L.k&&!m.dead))spawnLegend(L);}
function legendSlain(e){const H=HUNT(),L=HLEG.find(l=>l.k===e.legendK);if(!L||H.slain[L.k])return;H.slain[L.k]=Math.max(1,world.day);if(H.track===L.k)H.track=null;
  P.gold+=L.rew.gold;P.inv[L.rew.item]=(P.inv[L.rew.item]||0)+L.rew.n;P.fame=(P.fame||0)+20+L.lv*3;P.huntTitle=L.title;
  world.legend=world.legend||{};world.legend.slain=world.legend.slain||[];world.legend.slain.push(L.n);
  const m=`I slew ${L.n} near ${SETS[L.s].name}. They call me ${L.title} now.`;toast(`👑 ${L.n} is slain! +${L.rew.gold}g, ${L.rew.n} ${L.rew.item} · title “${L.title}”`);try{jAdd(m,"hunt");}catch(_){}try{addNews(L.s,`${heroName?heroName():"The hero"} slew the legendary ${L.n}.`);}catch(_){}}
// bestiary milestones: 10 kills = +10% damage vs that species, 25 = +25% and its parts drop more often
const bestTier=sp=>{const b=P.best&&P.best[sp];const k=b?b.kills:0;return k>=25?2:k>=10?1:0;};
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e.sp){const b=bestiary(e.sp);if(!PART_DROPS[e.sp])b.kills=(b.kills||0)+1;const k=b.kills,t0=k-1>=25?2:k-1>=10?1:0,t1=bestTier(e.sp);if(t1>t0)toast(`📖 ${monName(e.sp)} mastery ${t1}: +${t1===2?25:10}% damage against them.`);}if(e.legendK)legendSlain(e);}catch(_){}return r;};}
{const _he=hurtEnemy;hurtEnemy=function(e,dmg,ang,c){try{if(e&&e.sp&&typeof dmg==="number"){const t=bestTier(e.sp);if(t)dmg*=t===2?1.25:1.1;}}catch(_){}return _he.call(this,e,dmg,ang,c);};}
{const _bm=bestiaryMenu;bestiaryMenu=function(){_bm.apply(this,arguments);try{const H=HUNT();const el=document.getElementById("menu");const p=el&&el.querySelector("pre,.mtxt,p");const extra=`\n\n👑 Legends: ${HLEG.map(L=>H.slain[L.k]?L.n:"???").join(" · ")}\nMastery: 10 kills +10% dmg · 25 kills +25% dmg`;if(p)p.textContent+=extra;}catch(_){}};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&!b.some(o=>o&&o._hunt))b=[{_hunt:1,l:"🐾 Hunts",f:huntsMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state==="play"&&world&&!room&&frameN%30===0)huntTick();}catch(_){}};}
// crown + name over a legend; lair marker on the world map for the tracked hunt
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{for(const m of mobs){if(!m.legendK||m.dead||!vis(m.x,m.y,40))continue;list.push({y:m.y+40,f:()=>{const x=m.x+(m.w||12)/2,y=m.y-14;ctx.fillStyle="#ffd23a";ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x-6,y-6);ctx.lineTo(x-3,y-3);ctx.lineTo(x,y-7);ctx.lineTo(x+3,y-3);ctx.lineTo(x+6,y-6);ctx.lineTo(x+6,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.fillStyle="#000";ctx.fillText(m.name,x+0.6,y-9.4);ctx.fillStyle="#ffe6a8";ctx.fillText(m.name,x,y-10);const w=30;ctx.fillStyle="#300";ctx.fillRect(x-w/2,y+2,w,3);ctx.fillStyle="#e33";ctx.fillRect(x-w/2,y+2,w*Math.max(0,m.hp/m.maxHp),3);}});}}catch(_){}};}
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{const H=HUNT();if(!H.track)return;const L=HLEG.find(l=>l.k===H.track);const p=lairOf(L);const q=mapToScreen(p.x,p.y);const g=document.getElementById("mapc").getContext("2d");g.font="16px system-ui";g.textAlign="center";g.fillText("🐾",q.x,q.y+5);g.font="bold 10px system-ui";g.fillStyle="#ffe6a8";g.fillText(L.n,q.x,q.y-10);}catch(_){}};}
