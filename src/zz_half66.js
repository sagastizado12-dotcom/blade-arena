// ===== v67 PRE-DOUBLING WORLD =====
// v47 (0328bc4) doubled the map by appending an eastern continent and Moderno.
// v66 squeezed that wider world into 1024. This puts the west back on its old
// coordinates (1024x800, towns 0-18) and drops the east add-on before genWorld.
// half66Migrate no longer scales. pre67Migrate undoes a v66 squeeze, folds a
// 2048-wide harvest map back to 1024, and leaves a pre-v47 save where it was.
function pre67Strip(){
  if(pre67Strip.done)return;pre67Strip.done=1;
  for(let i=SETS.length-1;i>=0;i--)if(SETS[i].id>=19)SETS.splice(i,1);
  for(let i=LOBES.length-1;i>=0;i--){const k=LOBES[i].k||"";if(k==="moderno"||k.indexOf("e_")===0||LOBES[i].x>=WW)LOBES.splice(i,1);}
  for(let i=ISLES.length-1;i>=0;i--)if(ISLES[i].x>=WW)ISLES.splice(i,1);
  for(let i=POIS.length-1;i>=0;i--)if(POIS[i].x>=WW)POIS.splice(i,1);
  for(let i=RIVERS2.length-1;i>=0;i--)if(RIVERS2[i].some(p=>p&&p[0]>=WW))RIVERS2.splice(i,1);
  if(typeof EXTRA_ROADS!=="undefined")for(let i=EXTRA_ROADS.length-1;i>=0;i--){const a=SETS[EXTRA_ROADS[i][0]],b=SETS[EXTRA_ROADS[i][1]];if(!a||!b)EXTRA_ROADS.splice(i,1);}
  if(typeof KOF!=="undefined"&&KOF.length>19)KOF.length=19;
  if(typeof KINGDOMS!=="undefined")while(KINGDOMS.length>4)KINGDOMS.pop();
}
pre67Strip();
function half66Migrate(){}
function pre67ScaleX(o,mul){if(mul!==1&&o&&typeof o.x==="number")o.x*=mul;}
function pre67Remap(o,mode){
  if(!o)return o;const n={};
  for(const k of Object.keys(o)){const i=+k;if(!isFinite(i)){n[k]=o[k];continue;}
    let y,x;if(mode==="wide"){y=Math.floor(i/2048);x=i%2048;}
    else if(mode==="half"){y=Math.floor(i/WW);x=(i%WW)*2;}
    else{n[k]=o[k];continue;}
    if(x<0||y<0||x>=WW||y>=WH)continue;n[y*WW+x]=o[k];}
  return n;
}
function pre67OffPx(o){return !!(o&&typeof o.x==="number"&&o.x>=WW*TILE);}
function pre67Migrate(d){
  if(!d||!d.world||d.world.pre67)return;
  const W=d.world,half=!!W.half66,wide=!!W.w2&&!half,mode=half?"half":wide?"wide":"same",mul=half?2:1;
  W.harvested=pre67Remap(W.harvested,mode);W.trees=pre67Remap(W.trees,mode);
  pre67ScaleX(d.hero,mul);
  if(pre67OffPx(d.hero)&&SETS[0]){d.hero.x=SETS[0].x*TILE;d.hero.y=(SETS[0].y+2)*TILE;}
  if(d.P){pre67ScaleX(d.P.boat,mul);pre67ScaleX(d.P.respawn,mul);
    if(pre67OffPx(d.P.respawn)&&SETS[0]){d.P.respawn.x=SETS[0].x*TILE;d.P.respawn.y=(SETS[0].y+2)*TILE;}
    if(pre67OffPx(d.P.boat)){d.P.boat.x=SETS[0].x*TILE;d.P.boat.y=(SETS[0].y+4)*TILE;}}
  if(Array.isArray(d.npcs))d.npcs=d.npcs.filter(n=>{if(!n)return false;pre67ScaleX(n,mul);if(n.s>=19||!SETS[n.s]||pre67OffPx(n))return false;return true;});
  for(const k of ["bandits","beasts","migr","wrecks","placed","caravans"])if(Array.isArray(W[k]))for(let i=W[k].length-1;i>=0;i--){pre67ScaleX(W[k][i],mul);if(pre67OffPx(W[k][i]))W[k].splice(i,1);}
  if(W.crown)for(const k of Object.keys(W.crown)){const C=W.crown[k];if(!C)continue;if(typeof C.x==="number")C.x*=mul;if(typeof C.gx==="number")C.gx*=mul;
    if((typeof C.x==="number"&&C.x>=WW)||(typeof C.gx==="number"&&C.gx>=WW)){C.x=SETS[0].x;C.gx=SETS[0].x;C.y=SETS[0].y;C.gy=SETS[0].y;}}
  if(d.P&&typeof buildings!=="undefined"&&buildings.length){
    if(Array.isArray(d.P.homes))d.P.homes=d.P.homes.filter(id=>buildings[id]&&buildings[id].s<19);
    if(typeof d.P.house==="number"&&d.P.house>=0&&(!buildings[d.P.house]||buildings[d.P.house].s>=19))d.P.house=-1;}
  W.w2=1;W.pre67=1;delete W.half66;
}
function half66Unwall(){for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=y*WW+x;if(T[i]!==TREE)continue;if(T[i+1]===TREE||T[i+WW]===TREE)T[i]=FOREST;}}
{const _bw66=buildWorldMap;buildWorldMap=function(){half66Unwall();return _bw66.apply(this,arguments);};}
function half66Overview(){
  let c=document.getElementById("half66map");
  if(!c){c=document.createElement("canvas");c.id="half66map";c.style.cssText="position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;background:#123";document.body.appendChild(c);}
  const w=c.width=844,h=c.height=390,g=c.getContext("2d");
  g.imageSmoothingEnabled=false;g.fillStyle="#0e1c28";g.fillRect(0,0,w,h);
  let dw=w-16,dh=dw*WH/WW;if(dh>h-12){dh=h-12;dw=dh*WW/WH;}
  const ox=(w-dw)/2,oy=(h-dh)/2;
  if(worldMapC)g.drawImage(worldMapC,ox,oy,dw,dh);
  g.fillStyle="#ffd84a";
  for(const s of SETS){const x=ox+s.x/WW*dw,y=oy+s.y/WH*dh;g.fillRect(x-1,y-1,3,3);}
  g.strokeStyle="#e8c060";g.strokeRect(ox+0.5,oy+0.5,dw-1,dh-1);
  return {mapW:worldMapC?worldMapC.width:0,mapH:worldMapC?worldMapC.height:0,ww:WW,wh:WH};
}
window.__HALF66={tiles:()=>WW*WH,overview:half66Overview,migrate:pre67Migrate,moderno:()=>SETS.find(s=>s.name==="Moderno")||null};
window.__PRE67={tiles:()=>WW*WH,migrate:pre67Migrate,sets:()=>SETS.length,kingdoms:()=>KINGDOMS.length};
