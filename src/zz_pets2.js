// ===== v39 PETS MENU: summon/dismiss (dismissed rest at home), release to the wild with confirm, quick button =====
const petRest=()=>{const h=(P.homes&&P.homes.length)||P.house>=0;return h?"resting at home":"resting at the stable";};
function releasePet(p){const i=pets().indexOf(p);if(i<0)return false;const D=TAME[p.sp];if(p.active){p.active=false;despawnPets();if(D.k==="mount")P.riding=false;}pets().splice(i,1);
  const m=`I released ${p.name} the ${D.nm} back into the wild. Farewell, friend.`;toast(`${D.ic} ${p.name} bounds away into the wild.`);try{jAdd(m,"family");}catch(_){}try{saveGame();}catch(_){}return true;}
petsMenu=function(){const L=pets();const st=p=>{const D=TAME[p.sp];return p.active?(D.k==="mount"?(P.riding?"riding":"with you"):"following you"):petRest();};
  showMenu("🐾 Pets & Mounts",L.length?"One fighter and one mount can be out at a time.\n\n"+L.map(p=>`${TAME[p.sp].ic} ${p.name} — ${TAME[p.sp].nm} · Lv ${p.lv} (${p.xp}/${p.lv*20} xp) · ${st(p)}`).join("\n"):"No pets yet. Weaken a wolf-like or rideable beast and tame it!",
   L.flatMap(p=>{const D=TAME[p.sp];return[{l:`${D.ic} ${p.name}: ${p.active?"Dismiss":(D.k==="mount"?"Summon & ride":"Summon")}`,f:()=>{petSet(p,!p.active);try{saveGame();}catch(_){}petsMenu();}},
     {l:`🕊 Release ${p.name}`,f:()=>showMenu(`Release ${p.name}?`,`${p.name} will return to the wild for good. This cannot be undone.`,[{l:"🕊 Yes, release",f:()=>{releasePet(p);petsMenu();}},{l:"Keep "+p.name,f:petsMenu}])}];})
   .concat([{l:"👪 Family",f:familyMenu},{l:"Close",f:closeMenu}]));};
function petsQuick(){if(document.getElementById("btnPets"))return;const ref=document.getElementById("btnBook");if(!ref)return;const b=document.createElement("button");b.id="btnPets";b.className=ref.className;b.textContent="🐾";b.title="Pets";
  b.onclick=e=>{e.stopPropagation();if(state==="play")petsMenu();};ref.after(b);}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(frameN%30===0)petsQuick();}catch(_){}};}
