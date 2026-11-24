// ===== Clean city layouts =====
// Wipe baked walls, towers, pillars and old streets inside every town, then
// place one building per lot so nothing stacks or sits on a road.

function orgRadius(s){
  const tier=typeof tierOf==="function"?tierOf(s):(/town/.test(s.kind||"")?1:0);
  if(s.citystate||s.moderno)return 36;
  if(tier>=2)return 30;
  if(tier>=1)return 22;
  return Math.max(14,Math.min(s.r|0,18));
}
function orgClearR(s){return Math.max(orgRadius(s),(s.r|0))+6;}
function orgLand(x,y){if(x<2||y<2||x>=WW-2||y>=WH-2)return false;const t=T[y*WW+x];return t!==DEEP&&t!==SHAL&&t!==CLIFF&&t!==MTN&&t!==ROCK&&t!==ICE&&t!==WALL;}
function orgManor(){
  if(typeof ESTATE==="undefined"||!ESTATE)return null;
  const S=typeof modCity==="function"?modCity():SETS.find(s=>s&&s.name==="Moderno");
  if(!S)return null;
  return {x:ESTATE.x|0,y:ESTATE.y|0,w:ESTATE.w|0,h:ESTATE.h|0};
}
function orgHits(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function orgDropOld(towns){
  const inside=(x,y)=>towns.some(s=>Math.hypot(x-s.x,y-s.y)<=s._clearR);
  if(typeof WALLS!=="undefined"){
    const keep=[];
    for(const w of WALLS){
      if(!w||w.s!=null&&towns.some(s=>s.id===w.s)||inside(w.x,w.y)){
        if(w){const i=w.y*WW+w.x;if(i>=0&&i<OCC.length&&OCC[i]===-3)OCC[i]=0;if(typeof WALLIDX!=="undefined")WALLIDX.delete(i);}
      }else keep.push(w);
    }
    WALLS.length=0;
    for(const w of keep){w.i=WALLS.length;WALLS.push(w);if(typeof WALLIDX!=="undefined")WALLIDX.set(w.y*WW+w.x,w.i);}
  }
  if(typeof TOWERS!=="undefined")for(let i=TOWERS.length-1;i>=0;i--){const t=TOWERS[i];if(t&&(towns.some(s=>s.id===t.s)||inside(t.x,t.y)))TOWERS.splice(i,1);}
  if(typeof GATES!=="undefined")for(let i=GATES.length-1;i>=0;i--){const g=GATES[i];if(g&&towns.some(s=>s.id===g.s))GATES.splice(i,1);}
  if(typeof PROPS!=="undefined")for(let i=PROPS.length-1;i>=0;i--){const p=PROPS[i];if(p&&inside(p.x,p.y))PROPS.splice(i,1);}
}
function orgWipe(s){
  const R=s._clearR,cx=s.x|0,cy=s.y|0,fill=s.demon?MUD:GRASS;
  for(let y=cy-R;y<=cy+R;y++)for(let x=cx-R;x<=cx+R;x++){
    if(x<2||y<2||x>=WW-2||y>=WH-2)continue;
    if(Math.hypot(x-cx,y-cy)>R)continue;
    const i=y*WW+x,t=T[i];
    if(t===DEEP||t===SHAL||t===CLIFF||t===MTN)continue;
    const occ=OCC[i];
    if(occ===-2){const man=orgManor();if(man&&x>=man.x&&x<man.x+man.w&&y>=man.y&&y<man.y+man.h)continue;OCC[i]=0;}
    if(occ===-3||occ===-1)OCC[i]=0;
    else if(occ>0){const b=buildings[occ-1];if(b&&!b.cabin)OCC[i]=0;}
    if(t===COBBLE||t===ROAD||t===PIER||t===WALL||t===FLOWER||t===FARM)T[i]=fill;
  }
}
function orgKeep(s,cx,cy){
  if(s.name==="Moderno"||s.moderno)return null;
  const capital=/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2);
  if(s.id===0&&typeof castleObj!=="undefined"&&castleObj){castleObj.x=cx-3;castleObj.y=cy-12;castleObj.w=6;castleObj.h=3;return {x:castleObj.x,y:castleObj.y,w:6,h:3};}
  if(!(s.citystate||capital)||typeof CASTLES==="undefined")return null;
  let keep=null;
  for(let i=CASTLES.length-1;i>=0;i--){const c=CASTLES[i];if(!c||c.s!==s.id)continue;if(!keep)keep=c;else CASTLES.splice(i,1);}
  if(!keep){keep={k:s.king!=null?s.king:0,s:s.id,w:6,h:3,citystate:s.citystate?1:0};CASTLES.push(keep);}
  keep.x=cx-3;keep.y=cy-12;keep.w=6;keep.h=3;keep.s=s.id;
  return {x:keep.x,y:keep.y,w:6,h:3};
}
function orgLots(s,blocked){
  const R=s._orgR,cx=s.x|0,cy=s.y|0,lots=[];
  const plaza={x:cx-5,y:cy-4,w:11,h:8};
  const blockedAll=blocked.concat([plaza]);
  const free=(x,y)=>{const r={x,y,w:4,h:3};if(blockedAll.some(b=>orgHits(r,b)))return false;
    for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+4;xx++){if(!orgLand(xx,yy))return false;if(OCC[yy*WW+xx]>0)return false;}return true;};
  for(let y=cy-R+2;y<=cy+R-6;y+=5)for(let x=cx-R+2;x<=cx+R-6;x+=6)if(free(x,y))lots.push({x,y});
  lots.sort((a,b)=>Math.hypot(a.x+2-cx,a.y+1-cy)-Math.hypot(b.x+2-cx,b.y+1-cy));
  return lots;
}
function orgStamp(b,x,y){
  for(let yy=b.y;yy<b.y+(b.h||3);yy++)for(let xx=b.x;xx<b.x+(b.w||4);xx++){if(xx>0&&yy>0&&xx<WW&&yy<WH&&OCC[yy*WW+xx]===b.id+1)OCC[yy*WW+xx]=0;}
  b.x=x;b.y=y;b.w=4;b.h=3;
  const fill=SETS[b.s]&&SETS[b.s].demon?MUD:GRASS;
  for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+4;xx++){const i=yy*WW+xx;OCC[i]=b.id+1;const t=T[i];if(t!==DEEP&&t!==SHAL&&t!==CLIFF&&t!==MTN)T[i]=fill;}
  for(const row of [3,4])for(let xx=x;xx<x+4;xx++){const yy=y+row;const i=yy*WW+xx;if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)continue;if(OCC[i]>0)continue;const t=T[i];if(t===DEEP||t===SHAL||t===CLIFF||t===MTN)continue;if(OCC[i]<0)OCC[i]=0;T[i]=COBBLE;}
}
function orgPave(x,y){if(x<2||y<2||x>=WW-2||y>=WH-2)return;const i=y*WW+x;if(OCC[i]>0||OCC[i]===-2||OCC[i]===-3)return;const t=T[i];if(t===DEEP||t===SHAL||t===CLIFF||t===MTN||t===ROCK)return;T[i]=COBBLE;}
function orgStreets(s,blocked){
  const R=s._orgR,cx=s.x|0,cy=s.y|0;
  for(let y=cy-4;y<=cy+3;y++)for(let x=cx-5;x<=cx+5;x++)orgPave(x,y);
  for(let y=cy-R;y<=cy+R;y++){orgPave(cx,y);orgPave(cx+1,y);}
  for(let x=cx-R;x<=cx+R;x++){orgPave(x,cy);orgPave(x,cy+1);}
  for(let y=cy-R+2;y<=cy+R-3;y+=5)for(let x=cx-R;x<=cx+R;x++){orgPave(x,y+3);orgPave(x,y+4);}
  for(const b of blocked)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;if(OCC[i]<=0&&T[i]===COBBLE)T[i]=s.demon?MUD:GRASS;}
}
function orgHarbor(s){
  if(!(s.port||s.harbor||s.citystate||s.moderno))return;
  if(typeof waterNear!=="function")return;
  const w=waterNear(s,Math.max(s._clearR,48));
  if(!w)return;
  const cx=s.x|0,cy=s.y|0;
  let x=cx,y=cy,sx=Math.sign(w.x-cx),sy=Math.sign(w.y-cy);
  if(!sx&&!sy)sy=1;
  let last={x,y},guard=0;
  while(guard++<s._clearR+50){
    const nx=x+sx,ny=y+sy;if(nx<2||ny<2||nx>=WW-2||ny>=WH-2)break;
    const t=T[ny*WW+nx];
    if(t===DEEP||t===SHAL)break;
    x=nx;y=ny;last={x,y};
    if(OCC[ny*WW+nx]<=0&&t!==CLIFF&&t!==MTN)T[ny*WW+nx]=COBBLE;
  }
  const px=sy?1:0,py=sx?1:0;
  for(let k=-8;k<=8;k++){const qx=last.x+px*k,qy=last.y+py*k;orgPave(qx,qy);}
  for(const off of [-6,0,6]){
    let px0=last.x+sx+(sy?off:0),py0=last.y+sy+(sx?off:0);
    for(let n=0;n<10;n++){
      if(px0<2||py0<2||px0>=WW-2||py0>=WH-2)break;
      const t=T[py0*WW+px0];
      if(t!==DEEP&&t!==SHAL&&t!==PIER)break;
      T[py0*WW+px0]=PIER;OCC[py0*WW+px0]=0;
      px0+=sx;py0+=sy;
    }
  }
}
function orgEnsure(s,mine){
  const town=/town|capital/.test(s.kind||"")||s.citystate||s.moderno;
  const big=!!(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2));
  const saleN=big?4:town?2:1;
  const want=town?[["guild",1],["church",big?1:0],["inn",1],["shop",s.citystate||big?3:2]]:[["inn",1],["shop",1]];
  if(s.port||s.harbor||s.citystate||s.moderno)want.push(["harbor",1]);
  want.push(["forsale",saleN]);
  const take=()=>mine.find(b=>b.kind==="house"||b.kind==="forsale"&&want.every(w=>w[0]!=="forsale"||mine.filter(q=>q.kind==="forsale").length>saleN));
  for(const [kind,n] of want){
    let have=mine.filter(b=>b.kind===kind).length;
    while(have<n){
      let b=mine.find(q=>q.kind==="house");
      if(!b&&kind!=="house")b=mine.find(q=>q.kind==="forsale"&&mine.filter(x=>x.kind==="forsale").length>saleN);
      if(!b){
        b={id:buildings.length,s:s.id,x:s.x,y:s.y,w:4,h:3,kind,price:kind==="forsale"&&typeof cityPrice==="function"?cityPrice(s):0,dmg:0,burn:0,csLot:1};
        buildings.push(b);mine.push(b);
        if(world&&world.bld)world.bld[b.id]={dmg:0,burn:0};
      }else b.kind=kind;
      if(kind==="forsale"&&typeof cityPrice==="function")b.price=cityPrice(s);
      if(kind==="guild")b.hall=1;
      have++;
    }
  }
}
function orgIsTown(s){return !!(s&&(s.citystate||s.moderno||/town|capital|village/.test(s.kind||"")||(typeof buildings!=="undefined"&&buildings.some(b=>b&&b.s===s.id&&!b.cabin))));}
function orgOne(s){
  if(!orgIsTown(s))return;
  s._orgR=orgRadius(s);s._clearR=orgClearR(s);
  orgWipe(s);
  const cx=s.x|0,cy=s.y|0;
  const blocked=[];
  const manor=s.moderno||s.name==="Moderno"?orgManor():null;
  if(manor)blocked.push(manor);
  const keep=orgKeep(s,cx,cy);if(keep)blocked.push(keep);
  const mine=buildings.filter(b=>b&&b.s===s.id&&!b.cabin);
  orgEnsure(s,mine);
  const lots=orgLots(s,blocked);
  const used=new Set();
  const claim=(b,lot)=>{orgStamp(b,lot.x,lot.y);used.add(lot.x+","+lot.y);blocked.push({x:lot.x,y:lot.y,w:4,h:5});};
  let li=0;
  for(const b of mine){
    let lot=null;
    while(li<lots.length&&used.has(lots[li].x+","+lots[li].y))li++;
    if(li<lots.length)lot=lots[li++];
    if(!lot){
      for(let rad=s._orgR;rad<s._orgR+24&&!lot;rad+=5)for(let a=0;a<10&&!lot;a++){
        const x=cx+((Math.cos(a*0.628)*rad)|0),y=cy+((Math.sin(a*0.628)*rad)|0);
        if(used.has(x+","+y))continue;
        let ok=true;const r={x,y,w:4,h:3};
        if(blocked.some(q=>orgHits(r,q)))ok=false;
        for(let yy=y;yy<y+3&&ok;yy++)for(let xx=x;xx<x+4;xx++)if(!orgLand(xx,yy)||OCC[yy*WW+xx]>0)ok=false;
        if(ok)lot={x,y};
      }
    }
    if(lot)claim(b,lot);
  }
  orgStreets(s,blocked);
  orgHarbor(s);
  if(typeof waystones!=="undefined"){const w=waystones.find(q=>q&&q.s===s.id);if(w){w.x=cx+3;w.y=cy-3;const i=w.y*WW+w.x;if(i>=0&&i<OCC.length&&OCC[i]===-1)OCC[i]=0;}}
  if(typeof objects!=="undefined")for(const o of objects)if(o&&o.s===s.id&&o.type==="board"){o.x=cx+6;o.y=cy;}
  s.bIdx=mine.map(b=>b.id);
}
function orgPatchMap(s){
  if(typeof worldMapC==="undefined"||!worldMapC||typeof MAPRGB==="undefined")return;
  const R=s._clearR,x0=Math.max(0,(s.x|0)-R),y0=Math.max(0,(s.y|0)-R),x1=Math.min(WW-1,(s.x|0)+R),y1=Math.min(WH-1,(s.y|0)+R);
  const w=x1-x0+1,h=y1-y0+1;if(w<1||h<1)return;
  const g=worldMapC.getContext("2d"),id=g.getImageData(x0,y0,w,h),d=id.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y0+y)*WW+(x0+x),t=T[i],c=MAPRGB[t]||MAPRGB[0],o=(y*w+x)*4;
    if(OCC[i]>0){d[o]=200;d[o+1]=80;d[o+2]=60;}else{d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];}
    d[o+3]=255;
  }
  g.putImageData(id,x0,y0);
}
function organizeAll(){
  if(typeof SETS==="undefined"||!SETS.length||organizeAll.busy)return;
  organizeAll.busy=1;
  let rep={ok:false,n:1,issues:["organize-failed"]};
  try{
    const towns=SETS.filter(orgIsTown);
    for(const s of towns){s._orgR=orgRadius(s);s._clearR=orgClearR(s);}
    orgDropOld(towns);
    for(const s of towns){try{orgOne(s);}catch(e){console.warn("town",s&&s.name,e);}}
    if(typeof chunkCache!=="undefined")chunkCache.clear();
    if(typeof MAP_SHEET!=="undefined")MAP_SHEET=null;
    for(const s of towns)orgPatchMap(s);
    if(typeof BORDER_LAYER!=="undefined")BORDER_LAYER=null;
    rep=auditCities();
    window.__cityAudit=rep;
    if(!rep.ok)console.warn("city audit",rep.n,rep.issues);
  }finally{organizeAll.busy=0;}
  return rep;
}
function auditCities(){
  const issues=[];
  const counts={};
  const add=m=>{counts[m.split(" ")[0]]=(counts[m.split(" ")[0]]||0)+1;issues.push(m);};
  const seen=new Map();
  for(const b of buildings){
    if(!b)continue;
    const w=b.w||4,h=b.h||3;
    for(let y=b.y;y<b.y+h;y++)for(let x=b.x;x<b.x+w;x++){
      if(x<0||y<0||x>=WW||y>=WH){add("out "+b.id);continue;}
      const k=x+","+y;
      if(seen.has(k))add("building-building "+seen.get(k)+" "+b.id+" @"+k);
      else seen.set(k,b.id);
      const t=T[y*WW+x];
      if(t===ROAD||t===COBBLE)add("building-road "+b.id+" @"+k);
      if(typeof WALLIDX!=="undefined"&&WALLIDX.has(y*WW+x))add("building-wall "+b.id+" @"+k);
    }
  }
  for(const s of SETS){
    if(!orgIsTown(s))continue;
    if(s._wallStone){const nw=typeof WALLS!=="undefined"?WALLS.filter(w=>w&&w.s===s.id).length:0;if(nw<12)add("missing-wall "+s.name);}
    if((s.citystate||s.moderno)&&(buildings.filter(b=>b&&b.s===s.id&&b.kind==="forsale").length<4))add("forsale "+s.name);
    if((s.citystate||(/capital/.test(s.kind||"")&&s.name!=="Moderno"))&&s.id!==0){
      const n=typeof CASTLES!=="undefined"?CASTLES.filter(c=>c&&c.s===s.id).length:0;
      if(n!==1)add("palace "+s.name+" "+n);
    }
  }
  const keeps=[];
  if(typeof castleObj!=="undefined"&&castleObj)keeps.push({x:castleObj.x,y:castleObj.y,w:castleObj.w||6,h:castleObj.h||3});
  if(typeof CASTLES!=="undefined")for(const c of CASTLES)if(c)keeps.push({x:c.x,y:c.y,w:c.w||6,h:c.h||3});
  for(const c of keeps)for(const b of buildings)if(b&&orgHits(c,{x:b.x,y:b.y,w:b.w||4,h:b.h||3}))add("palace-building "+b.id);
  return {ok:issues.length===0,n:issues.length,counts,issues:issues.slice(0,30)};
}
if(typeof buildWorldMap==="function"){const _bwm=buildWorldMap;buildWorldMap=function(){try{organizeAll();}catch(e){console.warn("organize",e);window.__cityErr=String(e&&e.stack||e);}return _bwm.apply(this,arguments);};}
if(typeof planAllTowns==="function"){planAllTowns=function(){return organizeAll();};}
if(typeof buildBorders==="function"){buildBorders=function(){if(typeof paintKingdomCells==="function")paintKingdomCells();if(typeof KGRID==="undefined"||!KGRID)return;const step=8,gw=Math.ceil(WW/step),gh=Math.ceil(WH/step);const c=document.createElement("canvas");c.width=gw;c.height=gh;const g=c.getContext("2d");const img=g.createImageData(gw,gh),d=img.data;
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const tx=x*step,ty=y*step;const t=tAt(tx,ty);if(t===DEEP||t===SHAL)continue;const k=KGRID[y*gw+x];const K=KINGDOMS[k];if(!K||!K.rgb)continue;const edge=KGRID[y*gw+x+1]!==k||KGRID[(y+1)*gw+x]!==k||KGRID[y*gw+x-1]!==k||KGRID[(y-1)*gw+x]!==k;const o=(y*gw+x)*4;
    d[o]=edge?20:K.rgb[0];d[o+1]=edge?16:K.rgb[1];d[o+2]=edge?12:K.rgb[2];d[o+3]=edge?210:48;}
  g.putImageData(img,0,0);BORDER_LAYER=c;BORDER_SIG=typeof borderSig==="function"?borderSig():0;};}
if(typeof paintTrade==="function"){paintTrade=function(g,P2){if(!g||typeof SEA==="undefined")return;g.save();
  if(SEA.length){g.strokeStyle="rgba(150,210,255,.55)";g.lineWidth=1;g.beginPath();for(const r of SEA){if(!r.pts||r.pts.length<2)continue;let prev=null,open=false;for(const p of r.pts){const q=P2(p.x,p.y);const t=tAt(p.x|0,p.y|0);const wet=t===DEEP||t===SHAL||t===PIER;if(!wet||prev&&Math.hypot(p.x-prev.x,p.y-prev.y)>18){open=false;prev=p;continue;}if(!open){g.moveTo(q[0],q[1]);open=true;}else g.lineTo(q[0],q[1]);prev=p;}}g.stroke();
    g.fillStyle="#9fd4ff";for(const p of PORTS){const q=P2(p.x,p.y);g.fillRect(q[0]-2,q[1]-2,4,4);}}
  for(const s of SETS)if(s&&s.citystate){const K=KINGDOMS.find(k=>k&&k.cap===s.id);const q=P2(s.x,s.y);if(K){g.fillStyle=K.col;g.fillRect(q[0]-3,q[1]-8,6,4);}}
  g.restore();};}
function auditDoors(){
  const issues=[];
  if(typeof solidTile!=="function")return issues;
  for(const b of buildings){
    if(!b||b.cabin)continue;
    const dx=(b.x+1)|0,dy=(b.y+(b.h||3))|0;
    if(solidTile(dx,dy)||solidTile(dx+1,dy))issues.push((SETS[b.s]?SETS[b.s].name:"?")+" door "+b.id+" @"+dx+","+dy);
  }
  return issues;
}
function walkStreets(){
  const report=[];
  if(typeof P!=="undefined"&&P)P.fly=0;
  if(typeof hero!=="undefined"){hero.boat=false;hero.fly=0;}
  const towns=SETS.filter(orgIsTown);
  const hold=(code,on)=>{keys[code]=!!on;};
  const release=()=>{keys.KeyW=keys.KeyA=keys.KeyS=keys.KeyD=false;};
  for(const s of towns){
    const R=s._orgR||orgRadius(s),cx=s.x|0,cy=s.y|0;
    if(typeof npcs!=="undefined")for(const n of npcs)if(n&&n.s===s.id){n.x=-4000;n.y=-4000;n.inside=true;}
    const lines=[[cx,cy,cx+R,cy],[cx,cy,cx-R,cy],[cx,cy,cx,cy+R],[cx,cy,cx,cy-R]];
    for(const [x0,y0,x1,y1] of lines){
      if(!orgLand(x0,y0))continue;
      hero.x=x0*TILE+4;hero.y=y0*TILE+6;hero.vx=hero.vy=0;hero.boat=false;
      if(typeof room!=="undefined"&&room)continue;
      const dx=Math.sign(x1-x0),dy=Math.sign(y1-y0);
      const code=dx>0?"KeyD":dx<0?"KeyA":dy>0?"KeyS":"KeyW";
      release();hold(code,true);
      let stuck=0,steps=0,limit=(Math.abs(x1-x0)+Math.abs(y1-y0)+4)*10;
      const street=t=>t===COBBLE||t===ROAD||t===BRIDGE||t===PIER;
      while(steps++<limit){
        const tx=hero.x/TILE|0,ty=hero.y/TILE|0;
        const nx=tx+dx,ny=ty+dy;
        if(!street(tAt(nx,ny)))break;
        const px=hero.x,py=hero.y;
        updateHero();
        const moved=Math.hypot(hero.x-px,hero.y-py);
        if(moved<0.15)stuck++;else stuck=0;
        if(stuck>6){report.push(s.name+" blocked @"+tx+","+ty+" t"+tAt(tx,ty)+"/"+OCC[ty*WW+tx]+" next "+nx+","+ny+" t"+tAt(nx,ny)+"/"+OCC[ny*WW+nx]);break;}
      }
      release();
    }
  }
  const doors=auditDoors();
  window.__walkReport={blocked:report.slice(0,40),blockedN:report.length,doors:doors.slice(0,40),doorN:doors.length};
  return window.__walkReport;
}
try{localStorage.setItem("realmSaveSchema","6");window.__lsAfterOrg=localStorage.getItem("realmSaveSchema");}catch(e){window.__lsErr=String(e);}
window.__walkStreets=walkStreets;
window.__organizeCities=organizeAll;
window.__auditCities=auditCities;
