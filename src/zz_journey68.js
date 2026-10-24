// ===== v68 JOURNEY: towns stay the same size, the land between them is stretched x2.
// Wilderness was filled on a 2-tile grid in genWorld, so the extra space is cheap.
// Saves written on the 1024x800 map are scaled once. Building ids do not change.
const J68=2;
function j68pt(o){if(o&&typeof o.x==="number")o.x*=J68;if(o&&typeof o.y==="number")o.y*=J68;}
function j68box(o){j68pt(o);if(!o)return;if(typeof o.rx==="number")o.rx*=J68;if(typeof o.ry==="number")o.ry*=J68;if(typeof o.r==="number")o.r*=J68;}
function journeyGeom(){if(journeyGeom.done)return;journeyGeom.done=1;
  for(const s of SETS)j68pt(s);
  for(const I of ISLES)j68box(I);
  j68pt(RUINS);j68pt(ISLE_RUIN);j68pt(CAVE_POS);j68pt(DUNGEON);
  for(const q of POIS)j68pt(q);
  for(const L of LOBES)j68box(L);
  for(const L of LAKES2)j68box(L);
  j68pt(LAKE);
  if(typeof RIVERS2!=="undefined")for(const r of RIVERS2)for(const p of r){p[0]*=J68;p[1]*=J68;}
  if(typeof LAIRS!=="undefined")for(const L of LAIRS)j68pt(L);
  if(typeof CAMPS!=="undefined")for(const c of CAMPS)j68pt(c);
}
journeyGeom();
function j68remap(o){if(!o)return o;const n={},W0=1024;
  for(const k of Object.keys(o)){const i=+k;if(!isFinite(i)){n[k]=o[k];continue;}
    const y=Math.floor(i/W0),x=i%W0;if(x<0||y<0||x>=W0||y>=800)continue;
    n[(y*J68)*WW+(x*J68)]=o[k];}
  return n;}
function journeyMigrate(d){if(!d||!d.world||d.world.journey)return;const W=d.world;
  W.harvested=j68remap(W.harvested);W.trees=j68remap(W.trees);
  j68pt(d.hero);if(d.P){j68pt(d.P.boat);j68pt(d.P.respawn);}
  if(Array.isArray(d.npcs))for(const n of d.npcs)j68pt(n);
  for(const k of ["bandits","beasts","migr","wrecks","placed","caravans"])if(Array.isArray(W[k]))for(const o of W[k])j68pt(o);
  if(W.crown)for(const id of Object.keys(W.crown)){const C=W.crown[id];if(!C)continue;j68pt(C);if(typeof C.gx==="number")C.gx*=J68;if(typeof C.gy==="number")C.gy*=J68;}
  if(d.hero&&(d.hero.x<0||d.hero.y<0||d.hero.x>=WW*TILE||d.hero.y>=WH*TILE)&&SETS[0]){d.hero.x=SETS[0].x*TILE;d.hero.y=(SETS[0].y+2)*TILE;}
  W.journey=1;W.pre67=1;W.w2=1;
}
window.__J68={scale:J68,migrate:journeyMigrate,old:[1024,800],map:[WW,WH]};
