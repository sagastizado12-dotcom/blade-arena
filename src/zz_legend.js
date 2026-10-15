// ===== v29 LEGENDARY GEAR: rare parts from tough monsters; master smiths in capitals forge named weapons with effects =====
const RARE={emberheart:["Ember Heart","🔥",600],voidshard:["Void Shard","🌌",650],titanbone:["Titan Bone","🦴",500],tidepearl:["Tide Pearl","🫧",520],stormfang:["Storm Fang","⚡",480]};
for(const k in RARE){const [n,ic,p]=RARE[k];ITEMS[k]={n,p,ic,part:1,rare:1};}
function rareFor(e){const sp=e.sp||e.type||"";if(sp==="dragon")return"emberheart";if(e.depBoss||/demonlord|archfiend|demongeneral/.test(sp))return e.eclipse?"emberheart":"voidshard";if(/cyclops|grovegiant|kingslime|treant|boss/.test(sp))return"titanbone";if(/tidemaw|seaserpent/.test(sp))return"tidepearl";if(/voltusk|charger|demonbrute/.test(sp))return"stormfang";return null;}
const tough=e=>(e.maxHp||0)>=20||e.depBoss||e.sp==="dragon"||(e.def&&e.def.rare);
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e&&tough(e)){const k=rareFor(e);if(k&&(e.depBoss||e.sp==="dragon"||Math.random()<0.25)){P.inv[k]=(P.inv[k]||0)+1;toast(`✨ Rare part: ${RARE[k][1]} ${RARE[k][0]}!`);try{jAdd(`I claimed a ${RARE[k][0]} from a fallen ${e.sp||"beast"}.`,"deed");}catch(_){}}}}catch(_){}return r;};}
const LEGENDS={
 emberfang:{n:"Emberfang",ic:"🔥",dmg:4,fx:"burn",desc:"Sets foes ablaze (extra damage over time).",need:{emberheart:1,dscale:1},gold:250},
 tidecaller:{n:"Tidecaller",ic:"🌊",dmg:3,fx:"heal",desc:"Every 5th kill restores a heart.",need:{tidepearl:2,scale:2},gold:200},
 stormbrand:{n:"Stormbrand",ic:"⚡",dmg:3,fx:"chain",desc:"Lightning arcs to a nearby foe.",need:{stormfang:2,core:1},gold:220},
 titanmaul:{n:"Titanmaul",ic:"🔨",dmg:5,fx:"knock",desc:"Crushing blows hurl enemies back.",need:{titanbone:2,horn:2},gold:240},
 voidreaver:{n:"Voidreaver",ic:"🌌",dmg:4,fx:"leech",desc:"Hits sometimes steal life.",need:{voidshard:1,gem:2},gold:300}};
const legHave=(k,n)=>(P.inv[k]||0)+(P.inv[k+"+"]||0)>=n;
function canForge(id){const L=LEGENDS[id];return P.gold>=L.gold&&Object.entries(L.need).every(([k,n])=>legHave(k,n));}
function forgeLegend(id){if(!canForge(id))return false;const L=LEGENDS[id];P.gold-=L.gold;for(const [k,n] of Object.entries(L.need))for(let i=0;i<n;i++){if((P.inv[k]||0)>0)P.inv[k]--;else P.inv[k+"+"]--;}
  P.legends=P.legends||[];if(!P.legends.includes(id))P.legends.push(id);P.legend=id;const m=`The master smith forged ${L.n} for me — a legendary blade!`;toast(`${L.ic} ${m}`);try{jAdd(m,"deed");SFX.chime();}catch(_){}return true;}
const capitalHere=()=>{const S=settlementAt(hero.x,hero.y);return S&&(KINGDOMS.some(k=>k.cap===S.id)||S.id===0)?S:null;};
function smithMenu(){const S=capitalHere();if(!S){toast("Master smiths only work in the capitals.");return;}P.legends=P.legends||[];
  const rare=Object.keys(RARE).map(k=>`${RARE[k][1]} ${RARE[k][0]}: ${P.inv[k]||0}`).join(" · ");
  showMenu(`⚒ Master Smith of ${S.name}`,`"Bring me the rarest parts and I'll forge you a legend."\nRare parts — ${rare}\nWielding: ${P.legend?LEGENDS[P.legend].ic+" "+LEGENDS[P.legend].n:"nothing legendary"}`,
    Object.entries(LEGENDS).map(([id,L])=>P.legends.includes(id)?{l:`${L.ic} ${L.n}${P.legend===id?" (wielding)":" — wield"}`,f:()=>{P.legend=id;smithMenu();}}:
      {l:`${L.ic} ${L.n} (+${L.dmg}) — ${Object.entries(L.need).map(([k,n])=>`${n} ${(ITEMS[k]||{}).ic||""}${(ITEMS[k]||{}).n||k}`).join(", ")}, ${L.gold}g`,dis:!canForge(id),f:()=>{forgeLegend(id);smithMenu();}}).concat([{l:"Close",f:closeMenu}]));}
// effects: damage bonus via swordDmg; on-hit effects for melee
let legHitF=-1,legKills=0;
{const _sd=swordDmg;swordDmg=function(){legHitF=frameN;return _sd()+(P&&P.legend&&LEGENDS[P.legend]?LEGENDS[P.legend].dmg:0);};}
{const _he=hurtEnemy;hurtEnemy=function(e,dmg,ang,cd){const r=_he.apply(this,arguments);try{if(!P||!P.legend||legHitF!==frameN||!e||e._legFx)return r;const fx=LEGENDS[P.legend].fx;
  if(fx==="burn"&&!e.dead){e.burnT=180;}
  else if(fx==="chain"){const o=mobs.find(m=>m!==e&&!m.dead&&Math.hypot(m.x-e.x,m.y-e.y)<70);if(o){o._legFx=1;_he(o,2,Math.atan2(o.y-e.y,o.x-e.x));o._legFx=0;}}
  else if(fx==="knock"&&!e.dead){e.knockT=14;e.knockVx=Math.cos(ang||0)*5;e.knockVy=Math.sin(ang||0)*5;}
  else if(fx==="leech"&&Math.random()<0.2&&hero.hp<hero.maxHp){hero.hp++;updateHearts();}}catch(_){}return r;};}
{const _ok2=onKill;onKill=function(e){const r=_ok2.apply(this,arguments);try{if(P.legend==="tidecaller"&&++legKills%5===0&&hero.hp<hero.maxHp){hero.hp++;updateHearts();toast("🌊 Tidecaller restores a heart.");}}catch(_){}return r;};}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||room)return;if(frameN%30===0)for(const e of mobs)if(e.burnT>0&&!e.dead){e.burnT-=30;e._legFx=1;e.iframes=0;hurtEnemy(e,1,0);e._legFx=0;if(typeof spray==="function")spray(e.x+6,e.y+4,1,Math.random()*7,1);}}catch(_){}};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if((t==="Paused"||t==="Forge & Workbench")&&Array.isArray(b)&&world&&capitalHere())b=[{l:"⚒ Master Smith",f:smithMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
