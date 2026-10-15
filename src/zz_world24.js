// ===== v24: after loading an older save, never leave the hero stuck in water or inside solid terrain =====
function heroTileBad(){if(!hero||room||hero.boat)return false;const tx=Math.floor((hero.x+6)/TILE),ty=Math.floor((hero.y+8)/TILE);return isWater(tAt(tx,ty))||solidTile(tx,ty);}
function rescueHero(){if(!heroTileBad())return false;const sx=Math.floor((hero.x+6)/TILE),sy=Math.floor((hero.y+8)/TILE);
  for(let r=1;r<220;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=sx+dx,y=sy+dy;if(x<2||y<2||x>=WW-2||y>=WH-2)continue;
    const ok=(a,b)=>!isWater(tAt(a,b))&&!solidTile(a,b);if(ok(x,y)&&ok(x+1,y)&&ok(x,y+1)){hero.x=x*TILE+2;hero.y=y*TILE+2;try{camFX=null;}catch(_){}return true;}}return false;}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r&&rescueHero())toast("The land has shifted — you find yourself on solid ground.");}catch(e){console.warn(e);}return r;};}
