// ===== Clean city layouts =====
// Wipe baked walls, towers, pillars and old streets inside every town, then
// place one building per lot so nothing stacks or sits on a road.

function orgBig(s){return !!(s&&(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2)));}
const ORG_THEMES=[
  {roof:["#c4483a","#7a241c"],wall:"#f6ead4",gem:"#e8c060",name:"brick"},
  {roof:["#2a5a9a","#142848"],wall:"#f4f0e6",gem:"#9ec0e8",name:"slate"},
  {roof:["#3a7a48","#1c4024"],wall:"#f3ead4",gem:"#b6e090",name:"green tile"},
  {roof:["#8a5a32","#4a2e18"],wall:"#f8f0dc",gem:"#e8a060",name:"timber"},
  {roof:["#6a3a6a","#301830"],wall:"#f6eaf2",gem:"#e8a0d0",name:"violet"},
  {roof:["#3a6a6a","#183438"],wall:"#e7f2ef",gem:"#80d0c8",name:"sea"},
  {roof:["#a07830","#5a4010"],wall:"#f8f2dc",gem:"#f0d060",name:"gold"},
  {roof:["#4a4a5a","#22222c"],wall:"#ece8f2",gem:"#c8c8e4",name:"stone"}
];
function orgTheme(s){
  if(!s)return;
  if(s.citystate&&typeof KINGDOMS!=="undefined"){const K=KINGDOMS.find(k=>k&&k.cap===s.id);if(K){s.roof=[K.col,"#241810"];s.wall="#f7f1e6";s.gem=K.col;s.theme=K.name;s.tint=K.col;return;}}
  if(s.moderno||s.name==="Moderno"){s.roof=["#2a6ad0","#12347a"];s.wall="#f6eedc";s.gem="#9df";s.theme="Moderno";return;}
  const t=ORG_THEMES[(s.id||0)%ORG_THEMES.length];
  s.roof=t.roof.slice();s.wall=t.wall;s.gem=t.gem;s.theme=t.name;
}
function orgRadius(s){
  const tier=typeof tierOf==="function"?tierOf(s):(/town/.test(s.kind||"")?1:0);
  if(orgBig(s))return 40;
  if(tier>=1||/town/.test(s.kind||""))return 24;
  return 16;
}
function orgClearR(s){return Math.max(orgRadius(s),(s.r|0))+8;}
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
function orgPave(x,y){if(x<2||y<2||x>=WW-2||y>=WH-2)return;const i=y*WW+x;if(OCC[i]>0||OCC[i]===-2)return;const t=T[i];if(t===DEEP||t===SHAL||t===CLIFF||t===MTN||t===ROCK)return;T[i]=COBBLE;}
function orgStreets(s,blocked){
  const R=s._orgR,cx=s.x|0,cy=s.y|0;
  for(let y=cy-4;y<=cy+3;y++)for(let x=cx-5;x<=cx+5;x++)orgPave(x,y);
  for(let y=cy-R;y<=cy+R;y++){orgPave(cx,y);orgPave(cx+1,y);}
  for(let x=cx-R;x<=cx+R;x++){orgPave(x,cy);orgPave(x,cy+1);}
  for(let y=cy-R+2;y<=cy+R-3;y+=5)for(let x=cx-R;x<=cx+R;x++){orgPave(x,y+3);orgPave(x,y+4);}
  for(const b of blocked)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;if(OCC[i]<=0&&T[i]===COBBLE)T[i]=s.demon?MUD:GRASS;}
}
function orgDig(x,y){if(x<2||y<2||x>=WW-2||y>=WH-2)return;const i=y*WW+x;if(OCC[i]>0||OCC[i]===-2)return;T[i]=DEEP;OCC[i]=0;}
function orgHarbor(s){
  if(!(orgBig(s)||s.port||s.harbor))return;
  const cx=s.x|0,cy=s.y|0;
  let w=typeof waterNear==="function"?waterNear(s,140):null;
  let sx=0,sy=1;
  if(w){sx=Math.sign(w.x-cx);sy=Math.sign(w.y-cy);if(!sx&&!sy)sy=1;}
  let x=cx,y=cy,last={x,y},hit=null,guard=0;
  while(guard++<160){
    const nx=x+sx,ny=y+sy;if(nx<2||ny<2||nx>=WW-2||ny>=WH-2)break;
    const t=T[ny*WW+nx];
    if(t===DEEP||t===SHAL){hit={x:nx,y:ny};break;}
    x=nx;y=ny;last={x,y};
    if(OCC[ny*WW+nx]<=0&&t!==CLIFF&&t!==MTN&&t!==ROCK){T[ny*WW+nx]=COBBLE;if(sx)T[ny*WW+nx+(sy?0:0)]=COBBLE;}
    if(guard>s._orgR+28)break;
  }
  if(!hit){
    const bx=cx-6,by=cy+(s._orgR|0)+2;
    for(let yy=by;yy<by+8;yy++)for(let xx=bx;xx<bx+14;xx++)orgDig(xx,yy);
    hit={x:cx,y:by};last={x:cx,y:by-1};
    for(let yy=cy;yy<by;yy++){orgPave(cx,yy);orgPave(cx+1,yy);}
    sx=0;sy=1;
  }
  for(const off of [-5,0,5]){
    let px=hit.x+(sy?off:0),py=hit.y+(sx?off:0);
    for(let n=0;n<8;n++){
      if(px<2||py<2||px>=WW-2||py>=WH-2)break;
      const i=py*WW+px;if(OCC[i]>0)break;
      T[i]=PIER;OCC[i]=0;
      px+=sx||0;py+=sy||1;
    }
  }
  s._dock={x:last.x,y:last.y};
}
function orgEnsure(s,mine){
  const big=orgBig(s);
  const town=/town|capital|village/.test(s.kind||"")||s.citystate||s.moderno;
  const want=big?[["guild",1],["church",1],["inn",1],["shop",4],["harbor",1],["house",12],["forsale",4]]
    :town?[["inn",1],["shop",2],["house",6],["forsale",2]]
    :[["inn",1],["shop",1],["house",3],["forsale",1]];
  const saleN=want.find(w=>w[0]==="forsale")[1];
  const homeOf=b=>typeof npcs!=="undefined"&&npcs.some(n=>n&&n.home===b.id);
  for(const [kind,n] of want){
    let have=mine.filter(b=>b.kind===kind).length;
    while(have<n){
      let b=mine.find(q=>q.kind==="house"&&!homeOf(q)&&mine.filter(x=>x.kind==="house").length>1);
      if(!b&&kind!=="house")b=mine.find(q=>q.kind==="forsale"&&mine.filter(x=>x.kind==="forsale").length>saleN);
      if(!b){
        b={id:buildings.length,s:s.id,x:s.x,y:s.y,w:4,h:3,kind,price:kind==="forsale"&&typeof cityPrice==="function"?cityPrice(s):0,dmg:0,burn:0,csLot:1};
        buildings.push(b);mine.push(b);
        if(world&&world.bld)world.bld[b.id]={dmg:0,burn:0};
      }else b.kind=kind;
      if(kind==="forsale"&&typeof cityPrice==="function")b.price=cityPrice(s);
      if(kind==="guild"||kind==="church")b.hall=1;
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
  orgTheme(s);
  const mine=buildings.filter(b=>b&&b.s===s.id&&!b.cabin);
  orgEnsure(s,mine);
  const rank=k=>({shop:0,inn:1,guild:2,church:3,house:4,forsale:5,harbor:8}[k]??6);
  mine.sort((a,b)=>rank(a.kind)-rank(b.kind)||a.id-b.id);
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
function orgSyncPorts(){
  if(typeof PORTS==="undefined"||typeof SETS==="undefined")return;
  for(const s of SETS){
    if(!s||!s._dock)continue;
    let p=PORTS.find(q=>q&&q.id===s.id);
    if(!p&&(s.citystate||s.moderno||orgBig(s))){
      p={id:s.id,name:s.name,k:s.king|0,x:s._dock.x,y:s._dock.y,lx:s.x,ly:s.y+2,good:"goods",big:!!(s.citystate||s.moderno||orgBig(s))};
      PORTS.push(p);
    }
    if(p){p.x=s._dock.x;p.y=s._dock.y;p.lx=s.x;p.ly=s.y+2;p.big=!!(s.citystate||s.moderno||orgBig(s));}
  }
}
function orgPatchMap(s){
  if(typeof worldMapC==="undefined"||!worldMapC||typeof MAPRGB==="undefined")return;
  const R=s._clearR,x0=Math.max(0,(s.x|0)-R),y0=Math.max(0,(s.y|0)-R),x1=Math.min(WW-1,(s.x|0)+R),y1=Math.min(WH-1,(s.y|0)+R);
  const w=x1-x0+1,h=y1-y0+1;if(w<1||h<1)return;
  const g=worldMapC.getContext("2d"),id=g.getImageData(x0,y0,w,h),d=id.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y0+y)*WW+(x0+x),t=T[i],c=MAPRGB[t]||MAPRGB[0],o=(y*w+x)*4;
    d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];
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
    if(typeof PIN!=="undefined")PIN.clear();
    if(typeof BAKE_Q!=="undefined")BAKE_Q.length=0;
    if(typeof bldCache!=="undefined")bldCache.clear();
    if(typeof dropBldSheets==="function")dropBldSheets();
    orgSyncPorts();
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
    const R=(s._orgR||s.r||16)+2;
    if(typeof WALLS!=="undefined"&&WALLS.some(w=>w&&w.s===s.id&&Math.hypot(w.x-s.x,w.y-s.y)<R))add("leftover-wall "+s.name);
    if(typeof TOWERS!=="undefined"&&TOWERS.some(t=>t&&t.s===s.id&&Math.hypot(t.x-s.x,t.y-s.y)<R))add("leftover-pillar "+s.name);
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
if(typeof buildWorldMap==="function"){const _bwm=buildWorldMap;buildWorldMap=function(){try{organizeAll();}catch(e){console.warn("organize",e);window.__cityErr=String(e&&e.stack||e);}const r=_bwm.apply(this,arguments);try{calmMap();}catch(e){console.warn("calm",e);window.__calmErr=String(e&&e.stack||e);}return r;};}
if(typeof planAllTowns==="function"){planAllTowns=function(){return organizeAll();};}
if(typeof buildBorders==="function"){buildBorders=function(){if(typeof paintKingdomCells==="function")paintKingdomCells();if(typeof KGRID==="undefined"||!KGRID)return;const step=8,gw=Math.ceil(WW/step),gh=Math.ceil(WH/step);const c=document.createElement("canvas");c.width=gw;c.height=gh;const g=c.getContext("2d");const img=g.createImageData(gw,gh),d=img.data;
  const landCell=(x,y)=>{if(x<1||y<1||x>=gw-1||y>=gh-1)return false;const t=tAt(x*step,y*step);return t!==DEEP&&t!==SHAL;};
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const tx=x*step,ty=y*step;const t=tAt(tx,ty);if(t===DEEP||t===SHAL)continue;const k=KGRID[y*gw+x];const K=KINGDOMS[k];if(!K||!K.rgb)continue;const edge=(landCell(x+1,y)&&KGRID[y*gw+x+1]!==k)||(landCell(x-1,y)&&KGRID[y*gw+x-1]!==k)||(landCell(x,y+1)&&KGRID[(y+1)*gw+x]!==k)||(landCell(x,y-1)&&KGRID[(y-1)*gw+x]!==k);const o=(y*gw+x)*4;
    d[o]=edge?20:K.rgb[0];d[o+1]=edge?16:K.rgb[1];d[o+2]=edge?12:K.rgb[2];d[o+3]=edge?210:48;}
  g.putImageData(img,0,0);BORDER_LAYER=c;BORDER_SIG=typeof borderSig==="function"?borderSig():0;};}
if(typeof paintTrade==="function"){paintTrade=function(g,P2){if(!g)return;g.save();
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
    const lines=[[cx-R,cy,cx+R,cy],[cx,cy-R,cx,cy+R]];
    for(let y=cy-R+5;y<=cy+R-3;y+=5)lines.push([cx-R,y,cx+R,y]);
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
function calmMap(){
  if(typeof T==="undefined"||!T||typeof WW==="undefined")return;
  const maxW=1600,sc=Math.min(1,maxW/WW),w=Math.max(1,Math.round(WW*sc)),h=Math.max(1,Math.round(WH*sc)),n=w*h;
  const cat=new Uint8Array(n),sx=WW/w,sy=WH/h;
  const landOf=t=>t===FOREST||t===TREE||t===BUSH?4:t===ROCK||t===MTN||t===CLIFF||t===STAIRS?5:t===DUNE||t===CACTUS||t===MESA?6:t===SNOW||t===ICE?7:t===MUD||t===REED||t===DEADTREE?8:3;
  for(let y=0;y<h;y++){
    const ty=Math.min(WH-1,(y*sy)|0),row=y*w;
    for(let x=0;x<w;x++){
      const tx=Math.min(WW-1,(x*sx)|0);
      let deep=0,shal=0,v3=0,v4=0,v5=0,v6=0,v7=0,v8=0;
      for(let oy=-4;oy<=4;oy+=4)for(let ox=-4;ox<=4;ox+=4){
        let xx=tx+ox,yy=ty+oy;if(xx<0)xx=0;else if(xx>=WW)xx=WW-1;if(yy<0)yy=0;else if(yy>=WH)yy=WH-1;
        const t=T[yy*WW+xx];
        if(t===DEEP)deep++;
        else if(t===SHAL)shal++;
        else{const c=landOf(t);if(c===4)v4++;else if(c===5)v5++;else if(c===6)v6++;else if(c===7)v7++;else if(c===8)v8++;else v3++;}
      }
      const water=deep+shal;let pick;
      if(deep>=2||(deep>0&&water>=4))pick=1;
      else if(shal>=3)pick=2;
      else{pick=3;let bv=v3;if(v4>bv){pick=4;bv=v4;}if(v5>bv){pick=5;bv=v5;}if(v6>bv){pick=6;bv=v6;}if(v7>bv){pick=7;bv=v7;}if(v8>bv)pick=8;}
      cat[row+x]=pick;
    }
  }
  const seen=new Uint8Array(n),q=new Int32Array(n);
  let qs=0,qe=0;
  const push=i=>{if(i<0||i>=n||seen[i])return;const c=cat[i];if(c!==1&&c!==2)return;seen[i]=1;cat[i]=1;q[qe++]=i;};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}
  for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
  while(qs<qe){const i=q[qs++],x=i%w,y=(i/w)|0;if(x>0)push(i-1);if(x+1<w)push(i+1);if(y>0)push(i-w);if(y+1<h)push(i+w);}
  for(let i=0;i<n;i++){
    if(cat[i]!==2||seen[i])continue;
    qs=0;qe=0;q[qe++]=i;seen[i]=2;let count=0;
    while(qs<qe){
      const j=q[qs++],x=j%w,y=(j/w)|0;count++;
      const take=k=>{if(k<0||k>=n||seen[k]||cat[k]!==2)return;seen[k]=2;q[qe++]=k;};
      if(x>0)take(j-1);if(x+1<w)take(j+1);if(y>0)take(j-w);if(y+1<h)take(j+w);
    }
    if(count<28)for(let k=0;k<count;k++)cat[q[k]]=3;
  }
  const nxt=new Uint8Array(n);
  for(let pass=0;pass<3;pass++){
    nxt.fill(0);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x,c=cat[i];
      if(c===1||c===2){nxt[i]=c;continue;}
      const nb=[cat[i-1],cat[i+1],cat[i-w],cat[i+w],cat[i-w-1],cat[i-w+1],cat[i+w-1],cat[i+w+1]];
      const cnt=new Uint8Array(9);let same=0,best=c,bv=0;
      for(let k=0;k<8;k++){const v=nb[k];if(v===c)same++;if(v===1||v===2)continue;cnt[v]++;if(cnt[v]>bv){bv=cnt[v];best=v;}}
      nxt[i]=same>=5?c:best;
    }
    for(let i=0;i<n;i++)if(nxt[i])cat[i]=nxt[i];
  }
  const COL=[[0,0,0],[20,74,158],[40,122,184],[98,158,66],[44,112,50],[126,122,134],[198,172,104],[222,228,232],[98,116,70]];
  const cnv=document.createElement("canvas");cnv.width=w;cnv.height=h;const g=cnv.getContext("2d"),img=g.createImageData(w,h),d=img.data;
  for(let y=0;y<h;y++){
    const ty=Math.min(WH-1,(y*sy)|0);
    for(let x=0;x<w;x++){
      const i=y*w+x,c=cat[i]||3,col=COL[c]||COL[3],o=i*4;
      let r=col[0],gc=col[1],b=col[2];
      if(c>2&&typeof kAtTile==="function"){
        const k=kAtTile(Math.min(WW-1,(x*sx)|0),ty);
        const kc=k===255?[42,106,208]:(typeof KINGDOMS!=="undefined"&&KINGDOMS[k]&&KINGDOMS[k].rgb);
        if(kc){const a=0.2;r=r*(1-a)+kc[0]*a;gc=gc*(1-a)+kc[1]*a;b=b*(1-a)+kc[2]*a;}
      }
      d[o]=r;d[o+1]=gc;d[o+2]=b;d[o+3]=255;
    }
  }
  g.putImageData(img,0,0);
  if(typeof MAP_SHEET!=="undefined")MAP_SHEET=cnv;
  if(typeof worldMapC!=="undefined"&&worldMapC){const wg=worldMapC.getContext("2d");wg.imageSmoothingEnabled=true;wg.drawImage(cnv,0,0,worldMapC.width,worldMapC.height);}
  if(typeof shot!=="undefined")shot=null;
  window.__calmMap={w,h};
  window.__mapSheet=cnv;
}
function bannerWorld(){
  if(typeof banner==="undefined"||!banner||banner.life<=0||typeof camX==="undefined"||typeof W==="undefined")return null;
  return {x0:camX+W/2-124,x1:camX+W/2+124,y0:camY+8,y1:camY+84};
}
function dodgeBanner(x,y){
  const b=bannerWorld();if(!b||typeof camY==="undefined")return y;
  if(x<b.x0||x>b.x1)return y;
  const top=y-18;
  if(y<b.y0||top>b.y1)return y;
  return b.y1+20;
}
function paintTownBanner(){
  if(typeof banner==="undefined"||!banner||banner.life<=0||typeof ctx==="undefined")return;
  ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.globalAlpha=Math.min(1,banner.life/30);
  ctx.fillStyle="rgba(16,8,14,.94)";ctx.fillRect(W/2-108,28,216,48);
  ctx.strokeStyle="#e8c060";ctx.lineWidth=2;ctx.strokeRect(W/2-108,28,216,48);
  ctx.textAlign="center";ctx.font="bold 20px Georgia,serif";ctx.lineWidth=4;ctx.strokeStyle="#140c08";ctx.strokeText(banner.t,W/2,50);ctx.fillStyle="#ffe08a";ctx.fillText(banner.t,W/2,50);
  ctx.font="italic 9px Georgia,serif";ctx.fillStyle="#fff4d0";ctx.fillText(banner.sub||"",W/2,64);ctx.restore();
}
if(typeof paintOwnerSheet==="function"){paintOwnerSheet=function(){try{calmMap();}catch(e){console.warn(e);}};}
if(typeof draw==="function"){const _db=draw;draw=function(){const r=_db.apply(this,arguments);try{paintTownBanner();}catch(e){}return r;};}
try{localStorage.setItem("realmSaveSchema","6");window.__lsAfterOrg=localStorage.getItem("realmSaveSchema");}catch(e){window.__lsErr=String(e);}
function showTitle(name){
  const s=SETS.find(q=>q&&q.name===name);if(!s)return null;
  if(typeof P!=="undefined"&&P)P.fly=0;
  hero.boat=false;hero.vx=hero.vy=0;
  hero.x=s.x*TILE;hero.y=s.y*TILE+H/2-36;
  banner={t:s.name,sub:s.kind||"town",life:500};
  return {name:s.name,x:hero.x|0,y:hero.y|0};
}
function standHarbor(name){
  const s=SETS.find(q=>q&&q.name===name);if(!s)return null;
  if(typeof P!=="undefined"&&P)P.fly=0;
  hero.boat=false;let x=s.x|0,y=s.y|0,t=0;
  for(let i=0;i<90;i++){y++;t=tAt(x,y);if(t===DEEP||t===SHAL||t===PIER)break;}
  hero.x=x*TILE+4;hero.y=Math.max(0,(y-3)*TILE);hero.vx=hero.vy=0;
  banner={t:s.name,sub:"harbor",life:400};
  return {name:s.name,tx:x,ty:y,tile:t};
}
window.__standHarbor=standHarbor;
window.__showTitle=showTitle;
function standIn(name){
  const s=SETS.find(q=>q&&q.name===name);if(!s)return null;
  if(typeof room!=="undefined"&&room)try{room=null;}catch(e){}
  if(typeof P!=="undefined"&&P)P.fly=0;
  hero.boat=false;hero.x=(s.x-2)*TILE+4;hero.y=(s.y+1)*TILE+6;hero.vx=hero.vy=0;
  keys.KeyD=true;keys.KeyA=keys.KeyW=keys.KeyS=false;
  let moved=0;
  for(let i=0;i<48;i++){const x0=hero.x;updateHero();if(Math.abs(hero.x-x0)>0.2)moved++;}
  keys.KeyD=false;
  banner={t:s.name,sub:s.kind||"town",life:140};
  return {name:s.name,x:hero.x|0,y:hero.y|0,moved,tx:hero.x/TILE|0,ty:hero.y/TILE|0};
}
window.__standIn=standIn;
window.__walkStreets=walkStreets;
window.__organizeCities=organizeAll;
window.__auditCities=auditCities;
