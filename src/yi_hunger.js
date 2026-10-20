// ===== Hunger removed (v52 hotfix): no drain, no starving, no HUD bar. Food still heals/buffs; the hero eats during his away-life. =====
var P_HUNGER_OFF=true;
function hungerBar(){for(const id of ["hgFill","hungerFill"]){const e=document.getElementById(id);if(!e)continue;const box=id==="hgFill"?e.closest(".hg"):e.closest(".bar");if(box)box.remove();}}
{const _b=buildHUD;buildHUD=function(){_b.apply(this,arguments);try{hungerBar();layoutHUD();}catch(_){}};}
// keep the (legacy) field full so old code paths never penalise; clears old saves' hunger
{const _u=update;update=function(){if(P)P.hunger=100;return _u.apply(this,arguments);};}
{const _l=loadGame;loadGame=function(){const r=_l.apply(this,arguments);try{if(P)P.hunger=100;hungerBar();}catch(_){}return r;};}
function awayMeals(hrs){if(!P||hrs<3)return null;let wife=null;try{const w=(P.wives||[])[0];wife=w!=null?npcs.find(n=>n.id===w&&n.alive):null;}catch(_){}
  let town="the road";try{town=SETS[wife?wife.s:nearestTown()].name;}catch(_){}const meal=hrs>=20?"dinner":hrs>=10?"supper":"a hot lunch";
  return wife?`I ate ${meal} with ${wife.name} in ${town}.`:`I ate ${meal} at the inn in ${town}.`;}
