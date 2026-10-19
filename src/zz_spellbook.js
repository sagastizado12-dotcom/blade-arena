// ===== v36 SPELLBOOK: catalog of all spells (learned + locked with unlock hints), assign any spell to the 4 spell buttons; saved =====
const BASE4=SPELL_ORDER.slice();
const NEWSP={frost:{n:"Frost Nova",ic:"❄",mp:16,col:[150,220,255],unlock:{lv:5},desc:"A ring of ice around you: damages and freezes nearby foes."},
 quake:{n:"Earthquake",ic:"⛰",mp:24,col:[200,160,100],unlock:{lv:10},desc:"The ground heaves: heavy damage and stun in a wide circle."},
 blade:{n:"Spirit Blade",ic:"🗡",mp:18,col:[255,110,230],unlock:{swd:2},desc:"Your sword glows: +2 damage on every swing for 20 seconds."},
 meteor:{n:"Meteor",ic:"☄",mp:34,col:[255,150,60],unlock:{lv:16},desc:"Calls a meteor onto the nearest enemy: huge blast after a short delay."}};
for(const k in NEWSP){SPELLS[k]={n:NEWSP[k].n,ic:NEWSP[k].ic,mp:NEWSP[k].mp,col:NEWSP[k].col};SP_COL[k]="#"+NEWSP[k].col.map(v=>v.toString(16).padStart(2,"0")).join("");}
const BASEDESC={fireball:"Hurls a fireball that bursts on impact.",thunder:"A bolt of lightning that chains between foes.",heal:"Restores your health.",air:"A fast slicing gust of wind."};
const heroLv36=()=>P.lv||1;
function spellUnlocked(k){if(BASE4.includes(k))return true;const u=NEWSP[k].unlock;if(u.lv&&heroLv36()<u.lv)return false;if(u.swd&&(typeof swRank!=="function"||swRank()<u.swd))return false;return true;}
const unlockHint=k=>{const u=NEWSP[k].unlock;return u.lv?`Reach level ${u.lv}`:u.swd?`Reach sword rank ${SW_RANKS[u.swd]}`:"";};
const allSpells=()=>BASE4.concat(Object.keys(NEWSP));
function slots(){const m=P.mag;if(!Array.isArray(m.slots)||m.slots.length!==4)m.slots=BASE4.slice();m.slots=m.slots.map((k,i)=>SPELLS[k]&&spellUnlocked(k)?k:BASE4[i]);return m.slots;}
const slotFor=base=>{const i=BASE4.indexOf(base);return i>=0&&P&&P.mag?slots()[i]:base;};
function refreshSpellButtons(){if(!P||!P.mag)return;slots().forEach((k,i)=>{const b=document.getElementById("sp_"+BASE4[i]);if(!b)return;const s=SPELLS[k];b.title=s.n;b.dataset.spell=k;
  const t=[...b.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());if(t)t.nodeValue=s.ic;else b.insertBefore(document.createTextNode(s.ic),b.firstChild);if(b.classList.contains("sp4"))b.style.background=`radial-gradient(circle at 45% 35%,#ffffff88,${SP_COL[k]||"#555"} 55%,#1a1020)`;});}
{const _mi=magicInit;magicInit=function(){_mi.apply(this,arguments);try{P.mag.known=allSpells().filter(spellUnlocked);}catch(_){}};}
{const _us=unlockSpells;unlockSpells=function(){_us.apply(this,arguments);try{const before=new Set(P.mag.known);P.mag.known=allSpells().filter(spellUnlocked);for(const k of P.mag.known)if(!before.has(k)&&NEWSP[k])toast(`📖 New spell for your Spellbook: ${SPELLS[k].ic} ${SPELLS[k].n}!`);}catch(_){}};}
let blade36=0;
function castNew(k){const s=SPELLS[k],m=P.mag;SPCD[k]=SPCD[k]||0;const now=performance.now();if(SPCD[k]>now)return false;if(!spellUnlocked(k))return false;if(m.mp<s.mp){toast("Not enough mana.");return false;}
  SPCD[k]=now+({frost:1400,quake:3000,blade:6000,meteor:4500})[k];m.mp-=s.mp;m.xp[k]=(m.xp[k]||0)+1;const lv=spellLv(k);hero.castT=20;const cx=hero.x+6,cy=hero.y+6;window.__lastNewSpell=k;
  const ring=(r,col,n)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;particles.push({x:cx+Math.cos(a)*r*.3,y:cy+Math.sin(a)*r*.3,z:4,vx:Math.cos(a)*r/18,vy:Math.sin(a)*r/18,vz:.2,life:22,max:22,col,size:3,kind:"magic"});}};
  const hit=(x,y,r,d,st)=>{for(const e of mobs){if(e.dead||e.pet)continue;if(Math.hypot(e.x+e.w/2-x,e.y+e.h/2-y)<r){if(e.sp==="dragon")hitDragon(e,0);else{e.iframes=0;hurtEnemy(e,d,Math.atan2(e.y-y,e.x-x),false);}if(st)e.stun=Math.max(e.stun||0,st);}}};
  if(k==="frost"){ring(56,[160,225,255],28);hit(cx,cy,56,1+Math.floor(lv/3),70);}
  if(k==="quake"){ring(90,[200,160,100],36);shake=10;hit(cx,cy,90,2+Math.floor(lv/2),100);}
  if(k==="blade"){blade36=performance.now()+20000;m.blade=Math.max(m.blade||0,1200);toast("🗡 Spirit Blade!");}
  if(k==="meteor"){let t=null,td=260;for(const e of mobs){if(e.dead||e.pet)continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d<td){td=d;t=e;}}const tx=t?t.x+t.w/2:cx+[0,-80,80,0][hero.dir],ty=t?t.y+t.h/2:cy+[80,0,0,-80][hero.dir];
    for(let i=0;i<20;i++)particles.push({x:tx,y:ty-80+i*4,z:20,vx:0,vy:2,vz:0,life:20,max:20,col:[255,150,60],size:4,kind:"magic"});setTimeout(()=>{if(!hero)return;shake=12;hit(tx,ty,64,4+lv,40);for(let i=0;i<30;i++){const a=Math.random()*7;particles.push({x:tx,y:ty,z:2,vx:Math.cos(a)*3,vy:Math.sin(a)*3,vz:1,life:30,max:30,col:[255,120,40],size:3,kind:"magic"});}},600);}
  try{SFX.cast&&SFX.cast();}catch(_){}return true;}
{const _sd=swordDmg;swordDmg=function(){return _sd()+(blade36>performance.now()?2:0);};}
{const _cs=castSpell;castSpell=function(k){k=k||curSpell;const r=slotFor(k);if(NEWSP[r])return castNew(r);return _cs.call(this,r);};}
// Spellbook UI: tap a spell, then tap a slot
let sbSel=null;
function spellbookMenu(){const sl=slots();const all=allSpells();
  const body=all.map(k=>{const s=SPELLS[k],un=spellUnlocked(k),lv=un?spellLv(k):0;return `${un?"":"🔒 "}${s.ic} ${s.n}${un?` · Rank ${lv}`:""} · ${s.mp} MP${sl.includes(k)?` · slot ${sl.indexOf(k)+1}`:""}\n   ${NEWSP[k]?NEWSP[k].desc:BASEDESC[k]||""}${un?"":` — Unlock: ${unlockHint(k)}`}`;}).join("\n");
  showMenu("📖 Spellbook",(sbSel?`Selected ${SPELLS[sbSel].ic} ${SPELLS[sbSel].n} — now tap a slot below.\n\n`:"Tap a learned spell, then tap one of the 4 slots.\n\n")+body,
    all.map(k=>({l:`${SPELLS[k].ic} ${SPELLS[k].n}${sbSel===k?" ✓":""}`,cls:"sbspell",dis:!spellUnlocked(k),f:()=>{sbSel=k;spellbookMenu();}}))
    .concat(sl.map((k,i)=>({l:`Slot ${i+1}: ${SPELLS[k].ic}`,cls:"sbslot",dis:!sbSel,f:()=>{assignSlot(i,sbSel);sbSel=null;spellbookMenu();}})))
    .concat([{l:"Reset slots",f:()=>{P.mag.slots=BASE4.slice();refreshSpellButtons();spellbookMenu();}},{l:"Close",f:()=>{sbSel=null;closeMenu();}}]));
  try{menuEl.querySelectorAll("button").forEach(b=>{b.draggable=true;});}catch(_){}}
function assignSlot(i,k){if(!k||!spellUnlocked(k))return false;const sl=slots();const j=sl.indexOf(k);if(j>=0)sl[j]=sl[i];sl[i]=k;P.mag.slots=sl;refreshSpellButtons();try{saveGame();}catch(_){}toast(`${SPELLS[k].ic} ${SPELLS[k].n} → slot ${i+1}`);return true;}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world)b=[{l:"📖 Spellbook",f:spellbookMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
// quick button (next to the bag) + keep buttons in sync
function sbQuick(){if(document.getElementById("btnBook"))return;const bag=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="BAG");if(!bag)return;const nb=document.createElement("button");nb.id="btnBook";nb.className=bag.className;nb.textContent="📖";nb.title="Spellbook";
  nb.onclick=e=>{e.stopPropagation();if(state==="play")spellbookMenu();};bag.after(nb);}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(frameN%30===0&&P&&P.mag){sbQuick();const want=slots().join();if(refreshSpellButtons._w!==want){refreshSpellButtons._w=want;refreshSpellButtons();}if(frameN%300===0)unlockSpells();}}catch(_){}};}
